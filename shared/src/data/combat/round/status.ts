import type { CombatContext, CombatUnit } from "../types.js";
import { tickCooldowns } from "../abilities/cooldown.js";
import { decayAllThreat } from "../threat.js";

/**
 * Round-start phase: cooldowns, slows, stat debuffs, poison DoTs, threat decay.
 *
 * Called once at the top of each round for every still-alive unit.
 * Mutates units in place and appends DoT damage entries to ctx.log.
 */
export function tickStatusEffects(ctx: CombatContext): void {
  const allUnits = [...ctx.adventurers, ...ctx.enemies];
  for (const unit of allUnits) {
    if (unit.hp <= 0) continue;
    tickCooldowns(unit);
    if (unit.slowed > 0) unit.slowed--;
    if (unit.focusRounds && unit.focusRounds > 0) {
      unit.focusRounds--;
      if (unit.focusRounds <= 0) unit.focusTarget = undefined;
    }
    tickStatDebuffs(unit);
    tickPoison(unit, ctx);
  }
  // Taunt only lasts one round; clear after status tick so new turn starts clean.
  for (const unit of allUnits) unit.tauntedBy = undefined;
  // Bleed off accumulated threat so fights don't snowball forever.
  decayAllThreat(ctx.enemies);
}

function tickStatDebuffs(unit: CombatUnit): void {
  if (!unit.statDebuffs?.length) return;
  unit.statDebuffs = unit.statDebuffs.filter((d) => {
    d.rounds--;
    if (d.rounds <= 0) {
      (unit as any)[d.stat] = Math.max(1, (unit as any)[d.stat] + d.pct);
      return false;
    }
    return true;
  });
}

function tickPoison(unit: CombatUnit, ctx: CombatContext): void {
  if (unit.poisonTicks.length === 0) return;
  // Capture the source of the first active tick BEFORE we mutate the array —
  // this is the "blame" the death record will pick up if the tick is lethal.
  const source = unit.poisonTicks[0];
  const sourceName = source.sourceName ?? "Bleeding";
  const sourceIcon = source.sourceIcon ?? "🩸";
  let totalDot = 0;
  unit.poisonTicks = unit.poisonTicks.filter((p) => {
    totalDot += p.damage;
    p.rounds--;
    return p.rounds > 0;
  });
  if (totalDot <= 0) return;
  unit.hp -= totalDot;
  ctx.log.push({
    round: ctx.round, attackerName: sourceName, attackerIcon: sourceIcon, targetName: unit.name,
    damage: totalDot, dodged: false, crit: false, killed: unit.hp <= 0,
    targetHp: Math.max(0, unit.hp), targetMaxHp: unit.maxHp,
    isEnemy: unit.isEnemy, isPoisonTick: true,
  });
}

/** Tick down combat potion buff durations at the end of a round. */
export function tickPotionBuffs(ctx: CombatContext): void {
  const allUnits = [...ctx.adventurers, ...ctx.enemies];
  for (const unit of allUnits) {
    if (unit.damageBoost) {
      unit.damageBoost.rounds--;
      if (unit.damageBoost.rounds <= 0) unit.damageBoost = undefined;
    }
    if (unit.defenseBoost) {
      unit.defenseBoost.rounds--;
      if (unit.defenseBoost.rounds <= 0) unit.defenseBoost = undefined;
    }
  }
}
