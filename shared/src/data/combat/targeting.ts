import type { CombatUnit } from "./types.js";
import { combatRandom } from "./prng.js";
import { getDefenseReduction, getMagicResistReduction, dealsMagicalDamage } from "./stats.js";
import { getThreat } from "./threat.js";

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
  const alive = targets.filter((u) => u.hp > 0);
  if (alive.length === 0) return null;

  if (attacker.tauntedBy) {
    const taunter = alive.find((u) => u.id === attacker.tauntedBy);
    if (taunter) return taunter;
  }

  if (alive.length === 1) return alive[0];

  const tier = attacker.aiTier ?? "tactical";

  if (tier === "feral") {
    return alive[Math.floor(combatRandom() * alive.length)];
  }

  if (tier === "cunning") {
    // Smart enemies hunt the backline first, threat only breaks ties within a class.
    const priests = alive.filter((t) => t.class === "priest");
    if (priests.length > 0) return priests.length === 1 ? priests[0] : highestThreat(attacker, priests) ?? priests[0];
    const wizards = alive.filter((t) => t.class === "wizard");
    if (wizards.length > 0) return wizards.length === 1 ? wizards[0] : highestThreat(attacker, wizards) ?? wizards[0];
    // Fall back to a scored pick where threat barely matters (small weight).
    return scoredPick(attacker, alive, 10, 0, 0.3);
  }

  // tactical — full threat weighting
  return scoredPick(attacker, alive, 20, 0.15, 1.0);
}

/**
 * Adventurer basic-attack targeting. Scores candidates by resistance and HP%,
 * with a 15% chance to pick the second-best target (feels less optimal/robotic).
 * Threat doesn't apply on this side — adventurers/allies pick their own targets.
 */
export function pickTargetForAdventurer(attacker: CombatUnit, targets: CombatUnit[]): CombatUnit | null {
  const alive = targets.filter((u) => u.hp > 0);
  if (alive.length === 0) return null;
  if (alive.length === 1) return alive[0];
  return scoredPick(attacker, alive, 20, 0.15, 0);
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
