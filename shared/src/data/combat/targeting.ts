import type { CombatUnit } from "./types.js";
import { combatRandom } from "./prng.js";
import { getDefenseReduction, getMagicResistReduction, dealsMagicalDamage } from "./stats.js";

/**
 * Enemy targeting — WIS tier decides how smart they are.
 *   ≤3  : random alive target
 *   ≤8  : low-HP target (30% chance of second-lowest)
 *   ≤14 : scored by (1 - resistance) + wounded bonus
 *   ≥15 : priest > wizard > scored, ignores taunt miss
 *
 * Taunt short-circuits everything — if tauntedBy is set, must attack the taunter.
 */
export function pickTarget(attacker: CombatUnit, targets: CombatUnit[]): CombatUnit | null {
  const alive = targets.filter((u) => u.hp > 0);
  if (alive.length === 0) return null;

  if (attacker.tauntedBy) {
    const taunter = alive.find((u) => u.id === attacker.tauntedBy);
    if (taunter) return taunter;
  }

  if (alive.length === 1) return alive[0];
  const wis = attacker.wis;

  if (wis <= 3) {
    return alive[Math.floor(combatRandom() * alive.length)];
  }
  if (wis <= 8) {
    const sorted = [...alive].sort((a, b) => a.hp - b.hp);
    if (sorted.length > 1 && combatRandom() < 0.3) return sorted[1];
    return sorted[0];
  }
  if (wis <= 14) {
    return scoredPick(attacker, alive, 10, 0.2);
  }

  // Smart enemies prioritize backline
  const priests = alive.filter((t) => t.class === "priest");
  if (priests.length > 0) return priests[0];
  const casters = alive.filter((t) => t.class === "wizard");
  if (casters.length > 0) return casters[0];
  return scoredPick(attacker, alive, 10, 0);
}

/**
 * Adventurer basic-attack targeting. Scores candidates by resistance and HP%,
 * with a 15% chance to pick the second-best target (feels less optimal/robotic).
 */
export function pickTargetForAdventurer(attacker: CombatUnit, targets: CombatUnit[]): CombatUnit | null {
  const alive = targets.filter((u) => u.hp > 0);
  if (alive.length === 0) return null;
  if (alive.length === 1) return alive[0];
  return scoredPick(attacker, alive, 20, 0.15);
}

/** Scores alive targets by attack efficiency, picks best (or second with probability `missChance`). */
function scoredPick(attacker: CombatUnit, alive: CombatUnit[], woundedWeight: number, missChance: number): CombatUnit {
  const magical = dealsMagicalDamage(attacker);
  const scored = alive.map((t) => {
    const reduction = magical ? getMagicResistReduction(t) : getDefenseReduction(t);
    return { target: t, score: (1 - reduction) * 100 + (1 - t.hp / t.maxHp) * woundedWeight };
  });
  scored.sort((a, b) => b.score - a.score);
  if (missChance > 0 && scored.length > 1 && combatRandom() < missChance) return scored[1].target;
  return scored[0].target;
}
