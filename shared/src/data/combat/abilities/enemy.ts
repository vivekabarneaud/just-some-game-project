import { combatRandom } from "../prng.js";
import { calcDamageResult } from "../damage.js";
import { getAttackPower } from "../stats.js";
import { getEnemy } from "../../enemies.js";
import type { CombatContext, CombatUnit } from "../types.js";

/**
 * Try each of the enemy unit's special abilities in registration order.
 * First ability whose trigger + cooldown + effect all land stops evaluation
 * and consumes the unit's action. Returns true if an ability fired.
 */
export function tryEnemyAbility(unit: CombatUnit, ctx: CombatContext): boolean {
  if (!unit.enemyAbilities?.length) return false;

  const aliveAllies = ctx.enemies.filter((u) => u.id !== unit.id && u.hp > 0);
  const deadAllies = ctx.enemies.filter((u) => u.id !== unit.id && u.hp <= 0);
  const aliveTargets = ctx.adventurers.filter((u) => u.hp > 0);

  for (const ability of unit.enemyAbilities) {
    if ((unit.cooldowns[ability.id] ?? 0) > 0) continue;

    const hpPct = unit.hp / unit.maxHp;
    switch (ability.trigger) {
      case "always": break;
      case "hp_below_50": if (hpPct >= 0.5) continue; break;
      case "ally_dead": if (deadAllies.length === 0) continue; break;
      case "any_ally_below_30": if (!aliveAllies.some((a) => a.hp / a.maxHp < 0.3)) continue; break;
      case "round_start": break; // handled by caller at round start
    }

    const eff = ability.effect;
    unit.cooldowns[ability.id] = ability.cooldown;

    switch (eff.type) {
      case "bleed":
      case "poison": {
        const target = aliveTargets[Math.floor(combatRandom() * aliveTargets.length)];
        if (!target) return false;
        const hit = calcDamageResult(unit, target);
        target.hp -= hit.damage;
        const dotDmg = Math.max(1, Math.floor(getAttackPower(unit) * eff.pctPerRound / 100));
        target.poisonTicks.push({ damage: dotDmg, rounds: eff.rounds });
        ctx.log.push({
          round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: target.name, damage: hit.damage, dodged: false, crit: hit.crit, killed: target.hp <= 0,
          targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp, isEnemy: true,
        });
        if (target.hp <= 0) target.hp = 0;
        return true;
      }

      case "heal_self": {
        const heal = Math.floor(unit.maxHp * eff.pct / 100);
        unit.hp = Math.min(unit.maxHp, unit.hp + heal);
        ctx.log.push({
          round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: unit.name, damage: heal, dodged: false, crit: false, killed: false,
          targetHp: unit.hp, targetMaxHp: unit.maxHp, isEnemy: true, healed: true, healAmount: heal,
        });
        return true;
      }

      case "heal_ally": {
        const wounded = aliveAllies
          .filter((a) => a.hp < a.maxHp)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        const target = wounded[0];
        if (!target) continue;
        const heal = Math.floor(target.maxHp * eff.pct / 100);
        target.hp = Math.min(target.maxHp, target.hp + heal);
        ctx.log.push({
          round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: target.name, damage: heal, dodged: false, crit: false, killed: false,
          targetHp: target.hp, targetMaxHp: target.maxHp, isEnemy: true, healed: true, healAmount: heal,
        });
        return true;
      }

      case "aoe_damage": {
        const power = eff.magical ? unit.int : unit.str;
        const baseDmg = Math.floor(power * eff.pct / 100);
        const hits = aliveTargets.map((t) => {
          const def = eff.magical ? t.wis * 3 : (t.isEnemy ? t.vit * 3 : t.gearDefense);
          const reduction = def / (def + 150);
          const dmg = Math.max(1, Math.floor(baseDmg * (1 - reduction)));
          t.hp -= dmg;
          return { name: t.name, damage: dmg, killed: t.hp <= 0, hp: Math.max(0, t.hp), maxHp: t.maxHp };
        });
        ctx.log.push({
          round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: hits[0]?.name ?? "", damage: 0, dodged: false, crit: false,
          killed: hits.some((h) => h.killed), isEnemy: true, targets: hits,
        });
        return true;
      }

      case "damage_mult": {
        const tgts = [...aliveTargets].sort(() => combatRandom() - 0.5).slice(0, eff.targets);
        const hits = tgts.map((t) => {
          const { damage } = calcDamageResult(unit, t, { damageMult: eff.mult });
          t.hp -= damage;
          return { name: t.name, damage, killed: t.hp <= 0, hp: Math.max(0, t.hp), maxHp: t.maxHp };
        });
        if (hits.length === 1) {
          ctx.log.push({
            round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
            abilityName: ability.name,
            targetName: hits[0].name, damage: hits[0].damage, dodged: false, crit: false,
            killed: hits[0].killed, targetHp: hits[0].hp, targetMaxHp: hits[0].maxHp, isEnemy: true,
          });
        } else {
          ctx.log.push({
            round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
            abilityName: ability.name,
            targetName: hits[0]?.name ?? "", damage: 0, dodged: false, crit: false,
            killed: hits.some((h) => h.killed), isEnemy: true, targets: hits,
          });
        }
        return true;
      }

      case "buff_allies": {
        for (const ally of aliveAllies) {
          const bonus = Math.floor((ally as any)[eff.stat] * eff.pct / 100);
          (ally as any)[eff.stat] += bonus;
          if (!ally.statDebuffs) ally.statDebuffs = [];
          ally.statDebuffs.push({ stat: eff.stat, pct: -bonus, rounds: eff.rounds });
        }
        ctx.log.push({
          round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: "all allies", damage: 0, dodged: false, crit: false, killed: false, isEnemy: true,
        });
        return true;
      }

      case "debuff_target": {
        const target = aliveTargets[Math.floor(combatRandom() * aliveTargets.length)];
        if (!target) continue;
        const reduction = Math.floor((target as any)[eff.stat] * eff.pct / 100);
        (target as any)[eff.stat] = Math.max(1, (target as any)[eff.stat] - reduction);
        if (!target.statDebuffs) target.statDebuffs = [];
        target.statDebuffs.push({ stat: eff.stat, pct: reduction, rounds: eff.rounds });
        ctx.log.push({
          round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: target.name, damage: 0, dodged: false, crit: false, killed: false,
          targetHp: target.hp, targetMaxHp: target.maxHp, isEnemy: true,
        });
        return true;
      }

      case "mind_control": {
        const target = aliveTargets
          .filter((t) => !t.mindControlled)
          .sort(() => combatRandom() - 0.5)[0];
        if (!target) continue;
        target.mindControlled = eff.rounds;
        ctx.log.push({
          round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: target.name, damage: 0, dodged: false, crit: false, killed: false,
          targetHp: target.hp, targetMaxHp: target.maxHp, isEnemy: true,
        });
        return true;
      }

      case "revive_ally": {
        const dead = deadAllies[0];
        if (!dead) continue;
        dead.hp = Math.floor(dead.maxHp * eff.hpPct / 100);
        ctx.log.push({
          round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: dead.name, damage: 0, dodged: false, crit: false, killed: false,
          targetHp: dead.hp, targetMaxHp: dead.maxHp, isEnemy: true, healed: true, healAmount: dead.hp,
        });
        return true;
      }

      case "summon": {
        const summonDef = getEnemy(eff.enemyId);
        if (!summonDef) continue;
        for (let s = 0; s < eff.count; s++) {
          const summonHp = summonDef.stats.vit * 10;
          ctx.enemies.push({
            id: `${eff.enemyId}_summon_${ctx.round}_${s}`,
            name: summonDef.name,
            icon: summonDef.icon, isEnemy: true,
            hp: summonHp, maxHp: summonHp,
            str: summonDef.stats.str,
            dex: summonDef.stats.dex,
            int: summonDef.stats.int,
            vit: summonDef.stats.vit,
            wis: summonDef.stats.wis ?? 0,
            class: undefined,
            isMagical: summonDef.tags.includes("magical") || summonDef.tags.includes("demon"),
            gearDefense: 0,
            enemyTags: summonDef.tags,
            enemyDefId: summonDef.id,
            cooldowns: {}, slowed: 0, poisonTicks: [], statDebuffs: [],
          });
        }
        ctx.log.push({
          round: ctx.round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: `${eff.count}x ${summonDef.name}`, damage: 0, dodged: false, crit: false,
          killed: false, isEnemy: true,
        });
        return true;
      }
    }
  }
  return false;
}
