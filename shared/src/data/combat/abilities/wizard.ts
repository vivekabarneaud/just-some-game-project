import { calcDamageResult } from "../damage.js";
import { canUseAbility, startCooldown } from "./cooldown.js";
import type { ClassAbilityHandler } from "./types.js";

/** Fireball — 3+ enemies alive, hit all for 50% damage. */
export const fireball: ClassAbilityHandler = {
  id: "fireball",
  run(unit, ctx) {
    if (!canUseAbility(unit, "fireball")) return false;
    const alive = ctx.enemies.filter((e) => e.hp > 0);
    if (alive.length < 3) return false;

    startCooldown(unit, "fireball", 3);
    const hits = alive.map((t) => {
      const { damage } = calcDamageResult(unit, t, { damageMult: 0.5 });
      t.hp -= damage;
      return { name: t.name, damage, killed: t.hp <= 0, hp: Math.max(0, t.hp), maxHp: t.maxHp };
    });
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🔥", targetName: "",
      damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
      abilityName: "Fireball", abilityIcon: "🔥", targets: hits,
    });
    return true;
  },
};

/** Frost Bolt — high-damage single target + slow. Default when Fireball is on cooldown. */
export const frostBolt: ClassAbilityHandler = {
  id: "frost_bolt",
  run(unit, ctx) {
    if (!canUseAbility(unit, "frost_bolt")) return false;
    const alive = ctx.enemies.filter((e) => e.hp > 0);
    if (alive.length === 0) return false;

    startCooldown(unit, "frost_bolt", 2);
    const target = [...alive].sort((a, b) => b.hp - a.hp)[0];
    const { damage, crit } = calcDamageResult(unit, target, { damageMult: 1.3 });
    target.hp -= damage;
    target.slowed = 2;
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "❄️", targetName: target.name,
      damage, dodged: false, crit, killed: target.hp <= 0,
      targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp,
      isEnemy: false, abilityName: "Frost Bolt", abilityIcon: "❄️",
    });
    return true;
  },
};

export const WIZARD_ABILITIES: ClassAbilityHandler[] = [fireball, frostBolt];
