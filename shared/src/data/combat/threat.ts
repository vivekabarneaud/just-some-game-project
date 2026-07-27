// ─── Threat / aggro tracking ───────────────────────────────────
// WoW-style per-target threat: each enemy maintains its own threat table
// keyed by ally id. When an ally attacks or heals, the relevant enemies'
// tables grow. Targeting (in targeting.ts) reads these tables, weighted
// by AI tier — feral ignores threat, tactical follows it, cunning treats
// it as a tiebreaker behind backline-priority.

import type { CombatUnit } from "./types.js";
import type { EnemyTag } from "../enemies.js";
import type { MissionNpcAlly } from "../missions/types.js";

/** Default decay applied each round so fights don't snowball forever. */
export const THREAT_DECAY_PER_ROUND = 0.9;

/** Healing generates threat on every alive enemy (broadcast model — heals
 *  pull aggro across the room, same as WoW). 0.5 multiplier balances against
 *  raw damage threat. */
const HEAL_THREAT_MULT = 0.5;

/**
 * An ally dealt `damage` to `enemy`. Add it to that enemy's threat table for
 * the attacker, scaled by the attacker's threatMultiplier.
 *
 * No-ops on enemy-vs-enemy or ally-vs-ally hits — threat only flows between sides.
 */
export function addDamageThreat(enemy: CombatUnit, attacker: CombatUnit, damage: number): void {
  if (damage <= 0) return;
  if (!enemy.isEnemy) return;        // only enemies maintain threat tables
  if (attacker.isEnemy) return;      // enemy-on-ally damage doesn't generate ally threat
  if (!enemy.threatTable) enemy.threatTable = {};
  const mult = attacker.threatMultiplier ?? 1.0;
  enemy.threatTable[attacker.id] = (enemy.threatTable[attacker.id] ?? 0) + damage * mult;
}

/**
 * An ally healed `amount` for someone. Every alive enemy gets threat for the
 * healer (the broadcast model — healers pull aggro from everything in the
 * room, which is what makes them feel pressure early).
 */
export function addHealThreat(enemies: CombatUnit[], healer: CombatUnit, healAmount: number): void {
  if (healAmount <= 0) return;
  if (healer.isEnemy) return;
  const mult = healer.threatMultiplier ?? 1.0;
  const perEnemy = healAmount * HEAL_THREAT_MULT * mult;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    if (!e.threatTable) e.threatTable = {};
    e.threatTable[healer.id] = (e.threatTable[healer.id] ?? 0) + perEnemy;
  }
}

/** Decay every enemy's threat table at the end of a round. */
export function decayAllThreat(enemies: CombatUnit[], factor = THREAT_DECAY_PER_ROUND): void {
  for (const e of enemies) {
    if (!e.threatTable) continue;
    for (const k of Object.keys(e.threatTable)) {
      e.threatTable[k] *= factor;
    }
  }
}

/**
 * At combat start, apply a mission's npcAlly baseline threat directly to
 * matching enemies' threat tables. This is what makes ghosts focus the
 * binding ritualist from round 1, before she's done anything.
 */
export function applyMissionAllyBaselineThreat(
  enemies: CombatUnit[],
  npcAllyUnit: CombatUnit,
  missionNpc: MissionNpcAlly,
): void {
  const tagBoosts = missionNpc.baseThreatVsTag ?? {};
  const idBoosts = missionNpc.baseThreatVsEnemyId ?? {};
  for (const e of enemies) {
    let boost = 0;
    for (const tag of Object.keys(tagBoosts) as EnemyTag[]) {
      if (e.enemyTags?.includes(tag)) boost += tagBoosts[tag] ?? 0;
    }
    if (e.enemyDefId && idBoosts[e.enemyDefId] != null) {
      boost += idBoosts[e.enemyDefId] ?? 0;
    }
    if (boost === 0) continue;
    if (!e.threatTable) e.threatTable = {};
    e.threatTable[npcAllyUnit.id] = (e.threatTable[npcAllyUnit.id] ?? 0) + boost;
  }
}

/** Presence baseline (Combat Foundation): starting threat a positive-Presence
 *  ally lands on every enemy at combat start, so a **tank is the target from
 *  round 1** — before threat has a chance to accumulate, and enough to overcome
 *  the "hit the squishy" defence-pull. Negative Presence = no starting draw
 *  (the low threatMultiplier already sheds their ongoing threat). */
const PRESENCE_BASELINE_K = 10;

export function applyPresenceBaselineThreat(enemies: CombatUnit[], adventurers: CombatUnit[]): void {
  for (const adv of adventurers) {
    const seed = Math.max(0, (adv.presence ?? 0) * PRESENCE_BASELINE_K);
    if (seed <= 0) continue;
    for (const e of enemies) {
      if (!e.threatTable) e.threatTable = {};
      e.threatTable[adv.id] = (e.threatTable[adv.id] ?? 0) + seed;
    }
  }
}

/** Look up an enemy's current threat for an ally. Zero if the enemy has no entry. */
export function getThreat(enemy: CombatUnit, allyId: string): number {
  return enemy.threatTable?.[allyId] ?? 0;
}
