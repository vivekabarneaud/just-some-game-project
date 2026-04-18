import { calcDamageResult } from "../damage.js";
import { getAttackPower } from "../stats.js";
import { canUseAbility, startCooldown } from "./cooldown.js";
import type { ClassAbilityHandler } from "./types.js";

/** Backstab — any enemy below 40% HP, 2× damage execute. */
export const backstab: ClassAbilityHandler = {
  id: "backstab",
  run(unit, ctx) {
    if (!canUseAbility(unit, "backstab")) return false;
    const weak = ctx.enemies.find((e) => e.hp > 0 && e.hp / e.maxHp < 0.4);
    if (!weak) return false;

    startCooldown(unit, "backstab", 2);
    const { damage, crit } = calcDamageResult(unit, weak, { damageMult: 2.0 });
    weak.hp -= damage;
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🗡️", targetName: weak.name,
      damage, dodged: false, crit, killed: weak.hp <= 0,
      targetHp: Math.max(0, weak.hp), targetMaxHp: weak.maxHp,
      isEnemy: false, abilityName: "Backstab", abilityIcon: "🗡️",
    });
    return true;
  },
};

/** Poison — apply 3-round DoT on highest-HP enemy. */
export const poison: ClassAbilityHandler = {
  id: "poison",
  run(unit, ctx) {
    if (!canUseAbility(unit, "poison")) return false;
    const alive = ctx.enemies.filter((e) => e.hp > 0);
    if (alive.length === 0) return false;

    startCooldown(unit, "poison", 4);
    const target = [...alive].sort((a, b) => b.hp - a.hp)[0];
    const dotDamage = Math.floor(getAttackPower(unit) * 0.3);
    target.poisonTicks.push({ damage: dotDamage, rounds: 3 });
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "☠️", targetName: target.name,
      damage: 0, dodged: false, crit: false, killed: false,
      targetHp: target.hp, targetMaxHp: target.maxHp,
      isEnemy: false, abilityName: "Poison", abilityIcon: "☠️",
    });
    return true;
  },
};

export const ASSASSIN_ABILITIES: ClassAbilityHandler[] = [backstab, poison];
