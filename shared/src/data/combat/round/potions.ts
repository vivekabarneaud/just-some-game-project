import type { CombatContext, CombatUnit } from "../types.js";

/**
 * Auto-drink combat potions at the start of the action phase.
 *
 * Doesn't consume a turn — adventurers still get their action this round.
 * Triggers:
 *   - `before_first_attack`: only on round 1
 *   - `auto_low_hp`: HP < 40%
 *
 * Kept separate from class abilities because drinks aren't on any cooldown and
 * don't need to pass through the priority dispatch.
 */
export function drinkCombatPotions(ctx: CombatContext): void {
  const alive = ctx.adventurers.filter((u) => u.hp > 0);
  for (const unit of alive) {
    if (unit.potionUsed || !unit.combatPotion) continue;
    if (!shouldDrink(unit, ctx.round)) continue;
    applyPotion(unit, ctx);
  }
}

function shouldDrink(unit: CombatUnit, round: number): boolean {
  const pot = unit.combatPotion!;
  if (pot.trigger === "before_first_attack" && round === 1) return true;
  if (pot.trigger === "auto_low_hp" && unit.hp / unit.maxHp < 0.4) return true;
  return false;
}

function applyPotion(unit: CombatUnit, ctx: CombatContext): void {
  const pot = unit.combatPotion!;
  unit.potionUsed = true;

  if (pot.type === "heal_pct") {
    const heal = Math.floor(unit.maxHp * pot.value / 100);
    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🧪",
      abilityName: "Combat Potion",
      targetName: unit.name, damage: heal, dodged: false, crit: false, killed: false,
      targetHp: unit.hp, targetMaxHp: unit.maxHp,
      isEnemy: false, healed: true, healAmount: heal,
    });
  } else if (pot.type === "damage_boost") {
    unit.damageBoost = { pct: pot.value, rounds: pot.duration ?? 2 };
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🧪",
      abilityName: "Damage Potion",
      targetName: unit.name, damage: 0, dodged: false, crit: false, killed: false,
      targetHp: unit.hp, targetMaxHp: unit.maxHp, isEnemy: false,
    });
  } else if (pot.type === "defense_boost") {
    unit.defenseBoost = { pct: pot.value, rounds: pot.duration ?? 2 };
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🧪",
      abilityName: "Defense Potion",
      targetName: unit.name, damage: 0, dodged: false, crit: false, killed: false,
      targetHp: unit.hp, targetMaxHp: unit.maxHp, isEnemy: false,
    });
  }
}
