import type { Adventurer } from "../adventurers.js";
import type { MissionTemplate, MissionEncounter, AdventurerMissionSupplies } from "../missions/index.js";
import type { CombatContext, CombatResult } from "./types.js";
import { setCombatSeed } from "./prng.js";
import { buildAdventurerUnit, buildEnemyUnits, buildNpcAllyUnit } from "./units.js";
import { snapshotRoster, stampLogIds } from "./snapshot.js";
import { placeUnits } from "./positional.js";
import { applySupplies, applyHpOverride, applyPassives } from "./setup.js";
import { applyMissionAllyBaselineThreat, applyPresenceBaselineThreat } from "./threat.js";
import { applyMissionModifiers } from "./modifiers.js";
import { runRound } from "./round/index.js";
import { buildResult } from "./result.js";

// ─── Public types re-exported for consumers ─────────────────────
export type { CombatUnit, CombatLogEntry, CombatResult, CombatantSnapshot, LootResult, CombatContext, AITier, TauntImmunity, CombatKind } from "./types.js";
export { setCombatSeed, combatRandom } from "./prng.js";
export { calcDamageResult, woundedDamageMult } from "./damage.js";
export { getAttackPower, getMagicPower, getCritChance, getDodgeChance, getAccuracy, getParry, getAvoidance, MAX_AVOIDANCE, getInitiative, getDefenseReduction, getMagicResistReduction, dealsMagicalDamage, ATTACK_STAT_SCALE, UNARMED_RANGE, rarityWeaponRange, derivedDamageRange } from "./stats.js";
export { pickTarget, pickTargetForAdventurer } from "./targeting.js";
export { buildAdventurerUnit, buildEnemyUnits, buildNpcAllyUnit, calcFamilyBonuses } from "./units.js";
export type { AIBehavior, AIState, AITransition } from "./ai/index.js";
export { DEFAULT_BEHAVIOR } from "./ai/index.js";
export { addDamageThreat, addHealThreat, decayAllThreat, applyMissionAllyBaselineThreat, getThreat } from "./threat.js";
export { luckLootMultiplier, LUCK_CHANCE_PER_POINT } from "./result.js";

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
    /** Turn off the whole retreat/reflex layer (expeditions + special missions,
     *  which are lethal by design). Model C — see DESIGN_RECOVERY_AND_RETREAT. */
    disableRetreat?: boolean;
  },
): CombatResult | null {
  const encountersToUse = overrides?.encounters ?? mission.encounters;
  if (!encountersToUse?.length || team.length === 0) return null;

  setCombatSeed(seed);

  const adventurers = team.map(buildAdventurerUnit);
  applySupplies(adventurers, team, adventurerSupplies, !!overrides?.skipRecoveryHeal);
  applyHpOverride(adventurers, overrides?.hpOverride);
  applyPassives(adventurers, team);

  // Mission's locked NPC ally (Niamh in story 4) joins the adventurer side. She
  // takes turns + gets healed like an adventurer, but is filtered from XP /
  // permadeath rolls in the engine. Death triggers a distinct failure (vipFallen).
  const npcAllyUnit = mission.npcAlly ? buildNpcAllyUnit(mission.npcAlly) : null;
  if (npcAllyUnit) adventurers.push(npcAllyUnit);

  const enemies = buildEnemyUnits(encountersToUse);
  const totalEnemies = enemies.length;
  if (enemies.length === 0) return null;

  // Apply the mission's baseline threat (e.g. "ghosts focus the ritualist") to
  // each matching enemy's threat table BEFORE the first round. This is what
  // makes Niamh draw aggro from round 1 instead of round 2+.
  if (npcAllyUnit && mission.npcAlly) {
    applyMissionAllyBaselineThreat(enemies, npcAllyUnit, mission.npcAlly);
  }
  // Presence: seed each enemy's threat with the adventurers' Presence, so tanks
  // draw aggro from round 1 (not after threat accumulates).
  applyPresenceBaselineThreat(enemies, adventurers);

  const ctx: CombatContext = {
    round: 0, adventurers, enemies, log: [],
    modifiers: mission.modifiers,
    disableRetreat: overrides?.disableRetreat,
  };
  // Stamp initial modifier flags. Re-evaluated each round in case gate
  // conditions (whileAllyAlive) flip mid-combat (e.g. Niamh dies → physical
  // immunity returns to ghosts).
  applyMissionModifiers(ctx);

  // Place everyone on the 1D battlefield (melee front, ranged back) before the
  // first move/act. The roster snapshot below captures these starting positions.
  placeUnits(ctx);

  // Roster snapshot at t0 — before any HP is spent — for the combat stage.
  const roster = snapshotRoster([...adventurers, ...enemies]);

  // Per-round battlefield positions (index 0 = start). Actions don't move units,
  // so the post-round snapshot equals that round's post-move positions.
  const snapX = () => Object.fromEntries([...adventurers, ...enemies].map((u) => [u.id, Math.round(u.x ?? 0)]));
  const positions: Record<string, number>[] = [snapX()];

  while (ctx.round < MAX_ROUNDS) {
    ctx.round++;
    const cont = runRound(ctx);
    positions.push(snapX());
    if (!cont) break;
  }

  stampLogIds(ctx.log, roster);
  const result = buildResult(adventurers, enemies, totalEnemies, ctx.log, ctx.round);
  result.roster = roster;
  result.positions = positions;
  setCombatSeed(undefined); // restore Math.random for non-preview combat
  return result;
}
