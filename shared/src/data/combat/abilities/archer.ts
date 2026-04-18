import { combatRandom } from "../prng.js";
import { calcDamageResult } from "../damage.js";
import { canUseAbility, startCooldown } from "./cooldown.js";
import type { ClassAbilityHandler } from "./types.js";

/** Multi-shot — 2+ enemies alive, hit up to 3 random alive enemies for 60% damage. */
export const multiShot: ClassAbilityHandler = {
  id: "multi_shot",
  run(unit, ctx) {
    if (!canUseAbility(unit, "multi_shot")) return false;
    const alive = ctx.enemies.filter((e) => e.hp > 0);
    if (alive.length < 2) return false;

    startCooldown(unit, "multi_shot", 3);
    const shuffled = [...alive].sort(() => combatRandom() - 0.5);
    const targets = shuffled.slice(0, Math.min(3, alive.length));
    const hits = targets.map((t) => {
      const { damage } = calcDamageResult(unit, t, { damageMult: 0.6 });
      t.hp -= damage;
      return { name: t.name, damage, killed: t.hp <= 0, hp: Math.max(0, t.hp), maxHp: t.maxHp };
    });
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🏹", targetName: "",
      damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
      abilityName: "Multi-Shot", abilityIcon: "🏹", targets: hits,
    });
    return true;
  },
};

/** Aimed Shot — guaranteed crit on highest-HP enemy. */
export const aimedShot: ClassAbilityHandler = {
  id: "aimed_shot",
  run(unit, ctx) {
    if (!canUseAbility(unit, "aimed_shot")) return false;
    const alive = ctx.enemies.filter((e) => e.hp > 0);
    if (alive.length === 0) return false;

    startCooldown(unit, "aimed_shot", 4);
    const target = [...alive].sort((a, b) => b.hp - a.hp)[0];
    const { damage } = calcDamageResult(unit, target, { forceCrit: true });
    target.hp -= damage;
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🎯", targetName: target.name,
      damage, dodged: false, crit: true, killed: target.hp <= 0,
      targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp,
      isEnemy: false, abilityName: "Aimed Shot", abilityIcon: "🎯",
    });
    return true;
  },
};

export const ARCHER_ABILITIES: ClassAbilityHandler[] = [multiShot, aimedShot];
