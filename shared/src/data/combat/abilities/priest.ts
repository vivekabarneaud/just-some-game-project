import { combatRandom } from "../prng.js";
import { calcDamageResult } from "../damage.js";
import { canUseAbility, startCooldown } from "./cooldown.js";
import { addDamageThreat, addHealThreat } from "../threat.js";
import type { ClassAbilityHandler } from "./types.js";

/** Group Heal — 2+ allies below 50% HP, heal everyone for ~40% of a normal heal. */
export const groupHeal: ClassAbilityHandler = {
  id: "group_heal",
  run(unit, ctx) {
    if (!canUseAbility(unit, "group_heal")) return false;
    const allies = ctx.adventurers.filter((u) => u.hp > 0);
    const wounded = allies.filter((a) => a.hp / a.maxHp < 0.5);
    if (wounded.length < 2) return false;

    startCooldown(unit, "group_heal", 4);
    const healBase = Math.floor(unit.int * 0.6 * 0.4);
    const hits: { name: string; damage: number; killed: boolean; hp: number; maxHp: number }[] = [];
    let totalHealed = 0;
    for (const a of allies) {
      if (a.canBeHealed === false) continue;
      if (a.hp >= a.maxHp) continue;
      const heal = Math.floor(healBase * (0.8 + combatRandom() * 0.4));
      const before = a.hp;
      a.hp = Math.min(a.maxHp, a.hp + heal);
      totalHealed += a.hp - before;
      hits.push({ name: a.name, damage: -heal, killed: false, hp: a.hp, maxHp: a.maxHp });
    }
    addHealThreat(ctx.enemies, unit, totalHealed);
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "💚", targetName: "",
      damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
      abilityName: "Group Heal", abilityIcon: "💚", targets: hits, healed: true,
    });
    return true;
  },
};

/** Single-target heal fallback — exactly one ally below 50% HP. No cooldown gate. */
export const singleHeal: ClassAbilityHandler = {
  id: "single_heal",
  run(unit, ctx) {
    const allies = ctx.adventurers.filter((u) => u.hp > 0);
    const wounded = allies.filter((a) => a.hp / a.maxHp < 0.5);
    if (wounded.length !== 1) return false;

    const target = wounded[0];
    if (target.canBeHealed === false) return false;
    const healAmount = Math.floor(unit.int * 0.6 * (0.8 + combatRandom() * 0.4));
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + healAmount);
    addHealThreat(ctx.enemies, unit, target.hp - before);
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "💚", targetName: target.name,
      damage: 0, dodged: false, crit: false, killed: false,
      targetHp: target.hp, targetMaxHp: target.maxHp,
      isEnemy: false, healed: true, healAmount,
    });
    return true;
  },
};

/** Smite — holy damage that ignores physical defense, targets lowest-HP alive enemy. */
export const smite: ClassAbilityHandler = {
  id: "smite",
  run(unit, ctx) {
    if (!canUseAbility(unit, "smite")) return false;
    const alive = ctx.enemies.filter((e) => e.hp > 0);
    if (alive.length === 0) return false;

    startCooldown(unit, "smite", 2);
    const target = [...alive].sort((a, b) => a.hp - b.hp)[0];
    const { damage, crit } = calcDamageResult(unit, target, { ignorePhysicalDef: true });
    target.hp -= damage;
    addDamageThreat(target, unit, damage);
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "✝️", targetName: target.name,
      damage, dodged: false, crit, killed: target.hp <= 0,
      targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp,
      isEnemy: false, abilityName: "Smite", abilityIcon: "✝️",
    });
    return true;
  },
};

export const PRIEST_ABILITIES: ClassAbilityHandler[] = [groupHeal, singleHeal, smite];
