import type { Adventurer } from "../adventurers.js";
import type { MissionTemplate, MissionEncounter, AdventurerMissionSupplies } from "../missions/index.js";
import type { CombatContext, CombatResult } from "./types.js";
import { setCombatSeed } from "./prng.js";
import { buildAdventurerUnit, buildEnemyUnits } from "./units.js";
import { applySupplies, applyHpOverride, applyPassives } from "./setup.js";
import { runRound } from "./round/index.js";
import { buildResult } from "./result.js";

// ─── Public types re-exported for consumers ─────────────────────
export type { CombatUnit, CombatLogEntry, CombatResult, LootResult, CombatContext } from "./types.js";
export { setCombatSeed, combatRandom } from "./prng.js";
export { calcDamageResult } from "./damage.js";
export { getAttackPower, getMagicPower, getCritChance, getDodgeChance, getInitiative, getDefenseReduction, getMagicResistReduction, dealsMagicalDamage } from "./stats.js";
export { pickTarget, pickTargetForAdventurer } from "./targeting.js";
export { buildAdventurerUnit, buildEnemyUnits, calcFamilyBonuses } from "./units.js";
export type { AIBehavior, AIState, AITransition } from "./ai/index.js";
export { DEFAULT_BEHAVIOR } from "./ai/index.js";

const MAX_ROUNDS = 20;

/**
 * Run a combat simulation.
 *
 * Deterministic when `seed` is provided (same seed + inputs → same result).
 * Returns null when there's nothing to fight (no encounters or empty team).
 *
 * Overrides exist for the expedition engine, which runs multiple combat events
 * in sequence carrying HP between them.
 */
export function simulateCombat(
  mission: MissionTemplate,
  team: Adventurer[],
  adventurerSupplies?: Record<string, AdventurerMissionSupplies>,
  seed?: number,
  overrides?: {
    encounters?: MissionEncounter[];
    hpOverride?: Record<string, number>;
    skipRecoveryHeal?: boolean;
  },
): CombatResult | null {
  const encountersToUse = overrides?.encounters ?? mission.encounters;
  if (!encountersToUse?.length || team.length === 0) return null;

  setCombatSeed(seed);

  const adventurers = team.map(buildAdventurerUnit);
  applySupplies(adventurers, team, adventurerSupplies, !!overrides?.skipRecoveryHeal);
  applyHpOverride(adventurers, overrides?.hpOverride);
  applyPassives(adventurers, team);

  const enemies = buildEnemyUnits(encountersToUse);
  const totalEnemies = enemies.length;
  if (enemies.length === 0) return null;

  const ctx: CombatContext = { round: 0, adventurers, enemies, log: [] };

  while (ctx.round < MAX_ROUNDS) {
    ctx.round++;
    if (!runRound(ctx)) break;
  }

  const result = buildResult(adventurers, enemies, totalEnemies, ctx.log, ctx.round);
  setCombatSeed(undefined); // restore Math.random for non-preview combat
  return result;
}
