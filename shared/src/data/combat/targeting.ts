import type { CombatUnit } from "./types.js";
import { combatRandom } from "./prng.js";
import { getDefenseReduction, getMagicResistReduction, dealsMagicalDamage } from "./stats.js";
import { getThreat } from "./threat.js";
import { inReach } from "./positional.js";

/** Prefer targets the attacker can actually reach this turn; if none are in
 *  reach (still closing), fall back to all so a movement intent still resolves
 *  (basicAttack gates the actual swing on reach). Position-less units (x unset)
 *  read as all-reachable. */
function reachable(attacker: CombatUnit, alive: CombatUnit[]): CombatUnit[] {
  const r = alive.filter((t) => inReach(attacker, t));
  return r.length ? r : alive;
}

/**
 * Enemy targeting — driven by aiTier (set per enemy, defaults from WIS):
 *   feral    : random alive target, ignores threat
 *   tactical : scored pick (defense × wounded × threat) — most enemies
 *   cunning  : prioritize backline (priest > wizard); threat is a tiebreaker
 *
 * Forced-target taunt (warrior taunt) short-circuits everything when set.
 * The taunt application itself respects tauntImmunity, so an immune enemy
 * never has tauntedBy set in the first place.
 */
export function pickTarget(attacker: CombatUnit, targets: CombatUnit[]): CombatUnit | null {
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

  const tier = attacker.aiTier ?? "tactical";
  // Positional gate: an enemy hits the highest-threat target it can REACH.
  const pool = reachable(attacker, alive);

  if (tier === "feral") {
    return pool[Math.floor(combatRandom() * pool.length)];
  }

  if (tier === "cunning") {
    // Smart enemies hunt the backline first, threat only breaks ties within a class.
    const priests = pool.filter((t) => t.class === "priest");
    if (priests.length > 0) return priests.length === 1 ? priests[0] : highestThreat(attacker, priests) ?? priests[0];
    const wizards = pool.filter((t) => t.class === "wizard");
    if (wizards.length > 0) return wizards.length === 1 ? wizards[0] : highestThreat(attacker, wizards) ?? wizards[0];
    // Fall back to a scored pick where threat barely matters (small weight).
    return scoredPick(attacker, pool, 10, 0, 0.3);
  }

  // tactical — full threat weighting
  return scoredPick(attacker, pool, 20, 0.15, 1.0);
}

/**
 * Adventurer basic-attack targeting. Scores candidates by resistance and HP%,
 * with a 15% chance to pick the second-best target (feels less optimal/robotic).
 * Threat doesn't apply on this side — adventurers/allies pick their own targets.
 */
export function pickTargetForAdventurer(attacker: CombatUnit, targets: CombatUnit[]): CombatUnit | null {
  const alive = targets.filter((u) => u.hp > 0 && !u.fled);
  if (alive.length === 0) return null;
  if (alive.length === 1) return alive[0];
  return scoredPick(attacker, reachable(attacker, alive), 20, 0.15, 0);
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
