import type { CombatUnit } from "./types.js";
import { combatRandom } from "./prng.js";
import { getDefenseReduction, getMagicResistReduction, dealsMagicalDamage, getAvoidance } from "./stats.js";
import { getThreat } from "./threat.js";
import { inReach } from "./positional.js";
import { resolveAI } from "./ai/profile.js";
import { scoreTarget, type TargetWeights } from "./targetScore.js";
import { perceive } from "./perception.js";

/** Prefer targets the attacker can actually reach this turn; if none are in
 *  reach (still closing), fall back to all so a movement intent still resolves
 *  (basicAttack gates the actual swing on reach). Position-less units (x unset)
 *  read as all-reachable. */
function reachable(attacker: CombatUnit, alive: CombatUnit[]): CombatUnit[] {
  const r = alive.filter((t) => inReach(attacker, t));
  return r.length ? r : alive;
}

/**
 * Enemy targeting — a WEIGHTED SCORE over what a creature wants, times how far
 * it has to go to get it (docs/design/combat/TARGETING.md, targetScore.ts):
 *
 *   score(t) = ( BASE + rolePull + Σ wᵢ·dᵢ(t) ) × reachFactor(t)
 *
 * The legacy `targeting` mode names still resolve, each mapped to a canned
 * vector below, so nothing shipped changes shape. The dimensions are role,
 * condition, isolation, softness, threat, ganged and sticky — every one 0..1,
 * with all magnitude in the weight.
 *
 * Forced-target taunt (warrior taunt) short-circuits everything when set.
 * The taunt application itself respects the tauntable knob, so a unit that
 * ignores taunts never has tauntedBy set in the first place.
 */
export function pickTarget(attacker: CombatUnit, targets: CombatUnit[], allies?: CombatUnit[]): CombatUnit | null {
  const chosen = choose(attacker, targets, allies);
  // Remember the commitment so packmates acting later this round can pile on.
  if (chosen) attacker.lastTargetId = chosen.id;
  return chosen;
}

function choose(attacker: CombatUnit, targets: CombatUnit[], allies?: CombatUnit[]): CombatUnit | null {
  const standing = targets.filter((u) => u.hp > 0 && !u.fled);
  if (standing.length === 0) return null;

  // PERCEPTION FIRST (TARGETING.md): a creature can only consider what it can
  // assess. This runs ahead of the forced overrides on purpose — otherwise an
  // invisible or smoked taunter would still yank enemies onto itself, which
  // would defeat the whole point of concealment. Perceiving nobody means
  // holding: choose() returns null and basicAttack simply does not swing.
  const alive = perceive(attacker, standing);
  if (alive.length === 0) return null;

  // Pack Howl focus: locked on the alpha's marked prey, IGNORING taunts (the pack
  // obeys the alpha). Only when the prey is in reach — a wolf that can't get to it
  // fights through whatever's in front. This is what makes taunt fail to peel the
  // pack off the prey during the howl.
  if (attacker.focusRounds && attacker.focusRounds > 0 && attacker.focusTarget) {
    const prey = alive.find((u) => u.id === attacker.focusTarget);
    if (prey && inReach(attacker, prey)) return prey;
  }

  if (attacker.tauntedBy) {
    const taunter = alive.find((u) => u.id === attacker.tauntedBy);
    if (taunter) return taunter;
  }

  if (alive.length === 1) return alive[0];

  // The reachable subset is still the pool: an enemy commits to something it can
  // actually fight this turn, falling back to everyone while still closing. The
  // reach factor inside the score then discriminates WITHIN that pool.
  const pool = reachable(attacker, alive);
  const w = weightsFor(attacker);

  // Erratic is not a weight: a panicked or confused thing does not weigh
  // anything, so `random` stays a flag rather than a vector.
  if (w === "random") return pool[Math.floor(combatRandom() * pool.length)];

  const scoreCtx = { line: alive, allies, pool };
  const best = bestBy(pool, (t) => scoreTarget(attacker, t, w, scoreCtx));
  // Deliberate imperfection: occasionally take the second-best so combat does
  // not read as robotic. Preserved from the old scoredPick.
  if (pool.length > 1 && combatRandom() < TARGET_MISS_CHANCE) {
    const second = bestBy(pool.filter((t) => t.id !== best.id), (t) => scoreTarget(attacker, t, w, scoreCtx));
    return second;
  }
  return best;
}

/** How often a scored pick takes its second choice instead of its best. From
 *  the old scoredPick's threat path (0.15). */
const TARGET_MISS_CHANCE = 0.15;

/**
 * The seven legacy mode names as canned weight vectors (TARGETING.md).
 *
 * This preserves each mode's INTENT, not bit-exact picks: the reach factor now
 * discriminates inside the pool where `squishiest`/`opportunist` previously
 * ignored distance entirely, and threat/softness are on one 0..1 scale where
 * they used to be 0..100 against 0..20. Both are the point of the refactor.
 *
 * `nearest` maps to NO weights on purpose: with an empty vector the score is
 * BASE × reachFactor, so the closest reachable target wins — the behaviour
 * falls out of the creature's legs rather than being named.
 */
const MODE_WEIGHTS: Record<string, TargetWeights | "random"> = {
  random: "random",
  nearest: {},
  threat: { threat: 1, softness: 1, condition: 0.2, sticky: 0.2 },
  squishiest: { softness: 1 },
  opportunist: { isolation: 1, condition: 0.5 },
  backline: { roles: { healer: 1, caster: 0.8 }, threat: 0.2 },
  "gang-up": { ganged: 1 },
};

/** A creature's authored weights, or the canned vector for its legacy mode
 *  name. Default matches the old `threat` path, which most enemies were on. */
function weightsFor(attacker: CombatUnit): TargetWeights | "random" {
  const { targeting } = resolveAI(attacker);
  return MODE_WEIGHTS[targeting] ?? MODE_WEIGHTS.threat;
}

/** The candidate scoring highest on `score`. Ties keep the earlier candidate,
 *  so ordering stays deterministic for a given roster. */
function bestBy(pool: CombatUnit[], score: (u: CombatUnit) => number): CombatUnit {
  let best = pool[0];
  let bestScore = score(best);
  for (const u of pool.slice(1)) {
    const s = score(u);
    if (s > bestScore) { best = u; bestScore = s; }
  }
  return best;
}

/**
 * Adventurer basic-attack targeting. Scores candidates by resistance and HP%,
 * with a 15% chance to pick the second-best target (feels less optimal/robotic).
 * Threat doesn't apply on this side — adventurers/allies pick their own targets.
 */
export function pickTargetForAdventurer(attacker: CombatUnit, targets: CombatUnit[]): CombatUnit | null {
  // Perception is SYMMETRIC (TARGETING.md): without this the player's heroes
  // would have godlike sight while enemies groped in the dark. Their scoring
  // weights stay fixed in v1 — only what they can SEE changes.
  const alive = perceive(attacker, targets.filter((u) => u.hp > 0 && !u.fled));
  if (alive.length === 0) return null;
  // Threats first, runners after (ROUT_AND_FLIGHT): a fleeing enemy is ignored
  // while anything is still fighting — nobody shoots the running boar while its
  // mate is goring the line. Once only runners remain, the chase is the fight.
  // (Nessa's future Pursuit talent = lifting this exclusion for her.)
  const standing = alive.filter((u) => !u.fleeing);
  const pool = standing.length > 0 ? standing : alive;
  if (pool.length === 1) return pool[0];
  return scoredPick(attacker, reachable(attacker, pool), 20, 0.15, 0);
}

/**
 * Scores alive targets by attack efficiency + threat (when attacker is an enemy
 * reading its own threat table). missChance picks the second-best instead of
 * the best with that probability — adds occasional "wrong" choices so combat
 * doesn't feel robotic.
 */
function scoredPick(
  attacker: CombatUnit,
  alive: CombatUnit[],
  woundedWeight: number,
  missChance: number,
  threatWeight: number,
): CombatUnit {
  const magical = dealsMagicalDamage(attacker);
  const useThreat = threatWeight > 0 && attacker.isEnemy && attacker.threatTable;
  const scored = alive.map((t) => {
    const reduction = magical ? getMagicResistReduction(t) : getDefenseReduction(t);
    const baseScore = (1 - reduction) * 100 + (1 - t.hp / t.maxHp) * woundedWeight;
    const threatScore = useThreat ? getThreat(attacker, t.id) * 0.5 * threatWeight : 0;
    return { target: t, score: baseScore + threatScore };
  });
  scored.sort((a, b) => b.score - a.score);
  if (missChance > 0 && scored.length > 1 && combatRandom() < missChance) return scored[1].target;
  return scored[0].target;
}


