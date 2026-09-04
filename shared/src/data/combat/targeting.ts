import type { CombatUnit } from "./types.js";
import { combatRandom } from "./prng.js";
import { getDefenseReduction, getMagicResistReduction, dealsMagicalDamage, getAvoidance } from "./stats.js";
import { getThreat } from "./threat.js";
import { inReach, paceGap } from "./positional.js";
import { resolveAI } from "./ai/profile.js";

/** Prefer targets the attacker can actually reach this turn; if none are in
 *  reach (still closing), fall back to all so a movement intent still resolves
 *  (basicAttack gates the actual swing on reach). Position-less units (x unset)
 *  read as all-reachable. */
function reachable(attacker: CombatUnit, alive: CombatUnit[]): CombatUnit[] {
  const r = alive.filter((t) => inReach(attacker, t));
  return r.length ? r : alive;
}

/**
 * Enemy targeting — driven by the resolved `targeting` knob (see ai/profile.ts;
 * every enemy authors it via the ai block, so nothing shipped changes):
 *   random      : any reachable target, erratically
 *   nearest     : the closest reachable target — what `feral` maps to
 *   threat      : scored pick (defense × wounded × threat) — the old `tactical`
 *   squishiest  : the softest — armor/resist AND dodge/parry, i.e. who it can
 *                 actually land on
 *   opportunist : the most exposed — cut off from their line, or nearly down
 *   gang-up     : whatever its allies already committed to (the pack instinct)
 *   backline    : priest, then wizard — the old `cunning`
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

/** How far away another unit still counts as "beside you" for the isolation
 *  read. The ally line normally spans ~14 paces, so this is roughly "in your
 *  formation" — drift further and the opportunist notices. */
const OPPORTUNIST_SUPPORT_RADIUS = 12;
/** How much a wounded target adds on top of isolation. Below 1 so a lone fresh
 *  target still outranks a wounded one standing in the middle of their line. */
const OPPORTUNIST_WOUNDED_WEIGHT = 0.5;

/** The closest unit in the pool. */
function nearestOf(attacker: CombatUnit, pool: CombatUnit[]): CombatUnit {
  return pool.reduce((a, b) => (paceGap(attacker, b) < paceGap(attacker, a) ? b : a));
}

function choose(attacker: CombatUnit, targets: CombatUnit[], allies?: CombatUnit[]): CombatUnit | null {
  const alive = targets.filter((u) => u.hp > 0 && !u.fled);
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

  const { targeting } = resolveAI(attacker);
  // Positional gate: an enemy hits the highest-threat target it can REACH.
  const pool = reachable(attacker, alive);

  if (targeting === "random") {
    return pool[Math.floor(combatRandom() * pool.length)];
  }

  if (targeting === "nearest") {
    return nearestOf(attacker, pool);
  }

  if (targeting === "squishiest") {
    // The softest target: armour/resistance AND how hittable they are. A plated,
    // parrying tank scores far below the cloth-wearer behind it, so this walks
    // past the wall toward whoever it can actually land damage on. Counterplay is
    // defensive — armour, and a body-block so the soft one isn't reachable.
    return bestBy(pool, (t) => {
      const through = 1 - (dealsMagicalDamage(attacker) ? getMagicResistReduction(t) : getDefenseReduction(t));
      const lands = 1 - getAvoidance(attacker, t).chance / 100;
      return through * lands;
    });
  }

  if (targeting === "opportunist") {
    // The most EXPOSED target, which is a question about the battlefield rather
    // than about armour: who has drifted away from their line, and who is nearly
    // down. A straggler with no one beside them scores highest; a wounded one
    // scores higher still. Counterplay is positional — hold formation.
    return bestBy(pool, (t) => {
      const supporters = pool.filter((a) => a.id !== t.id && paceGap(a, t) <= OPPORTUNIST_SUPPORT_RADIUS).length;
      const isolation = 1 / (1 + supporters);      // 1 alone · 0.5 with a friend · 0.33 with two
      const wounded = 1 - t.hp / t.maxHp;          // 0 fresh → 1 at death's door
      return isolation + wounded * OPPORTUNIST_WOUNDED_WEIGHT;
    });
  }

  if (targeting === "gang-up") {
    // The pack instinct: pile onto whatever packmates already committed to. This
    // is what makes a group of wolves a wolf PACK — and it compounds with Pack
    // Tactics, which pays a damage bonus for exactly this. Nobody committed yet
    // (first mover of the fight) → behave like a plain animal and take the nearest.
    const committed = new Map<string, number>();
    for (const mate of allies ?? []) {
      if (mate.id === attacker.id || mate.hp <= 0 || mate.fled || !mate.lastTargetId) continue;
      committed.set(mate.lastTargetId, (committed.get(mate.lastTargetId) ?? 0) + 1);
    }
    if (committed.size > 0) {
      const ganged = bestBy(pool, (t) => committed.get(t.id) ?? 0);
      if ((committed.get(ganged.id) ?? 0) > 0) return ganged;
    }
    return nearestOf(attacker, pool);
  }

  if (targeting === "backline") {
    // Smart enemies hunt the backline first, threat only breaks ties within a class.
    const priests = pool.filter((t) => t.class === "priest");
    if (priests.length > 0) return priests.length === 1 ? priests[0] : highestThreat(attacker, priests) ?? priests[0];
    const wizards = pool.filter((t) => t.class === "wizard");
    if (wizards.length > 0) return wizards.length === 1 ? wizards[0] : highestThreat(attacker, wizards) ?? wizards[0];
    // Fall back to a scored pick where threat barely matters (small weight).
    return scoredPick(attacker, pool, 10, 0, 0.3);
  }

  // threat — full threat weighting (the default, and most enemies)
  return scoredPick(attacker, pool, 20, 0.15, 1.0);
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
  const alive = targets.filter((u) => u.hp > 0 && !u.fled);
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

/**
 * Among a small candidate set, pick the one with the most threat in the
 * attacker's table. Returns null when threat data isn't useful (no enemies
 * have any entries) — caller falls back to first candidate.
 */
function highestThreat(attacker: CombatUnit, candidates: CombatUnit[]): CombatUnit | null {
  if (!attacker.isEnemy || !attacker.threatTable) return null;
  let best: CombatUnit | null = null;
  let bestThreat = -1;
  for (const c of candidates) {
    const t = getThreat(attacker, c.id);
    if (t > bestThreat) {
      bestThreat = t;
      best = c;
    }
  }
  return bestThreat > 0 ? best : null;
}
