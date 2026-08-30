import { combatRandom } from "../prng.js";
import { calcDamageResult } from "../damage.js";
import { canUseAbility, startCooldown } from "./cooldown.js";
import { addDamageThreat } from "../threat.js";
import { acceptsTaunt } from "../ai/profile.js";
import type { ClassAbilityHandler } from "./types.js";

/**
 * Taunt — when an ally drops below 30% HP, force all enemies to target self.
 * Skipped per-enemy if tauntImmunity blocks generic taunts. Iron Will enemies
 * still resist 10% on top of that.
 */
export const taunt: ClassAbilityHandler = {
  id: "taunt",
  run(unit, ctx) {
    if (!canUseAbility(unit, "taunt")) return false;
    const aliveAllies = ctx.adventurers.filter((u) => u.hp > 0);
    if (!aliveAllies.some((a) => a.id !== unit.id && a.hp / a.maxHp < 0.3)) return false;

    startCooldown(unit, "taunt", 4);
    for (const enemy of ctx.enemies) {
      if (enemy.hp <= 0) continue;
      // The tauntable knob decides: "ignores-generic" units shrug off the
      // warrior's taunt (only a future elite pull reaches them), "ignores" units
      // shrug off everything. Resolved from the authored `ai` block, falling
      // back to the legacy tauntImmunity field.
      if (!acceptsTaunt(enemy, "generic")) continue;
      if (enemy.isTauntable === false) continue;
      if (enemy.trait === "iron_will" && combatRandom() < 0.10) continue;
      enemy.tauntedBy = unit.id;
    }
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🛡️", targetName: "",
      damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
      abilityName: "Taunt", abilityIcon: "🛡️", isTaunt: true,
    });
    return true;
  },
};

/** Cleave — when 2+ enemies alive, hit the first two for 70% damage each. */
export const cleave: ClassAbilityHandler = {
  id: "cleave",
  run(unit, ctx) {
    if (!canUseAbility(unit, "cleave")) return false;
    const alive = ctx.enemies.filter((e) => e.hp > 0);
    if (alive.length < 2) return false;

    startCooldown(unit, "cleave", 3);
    const targets = alive.slice(0, 2);
    const hits = targets.map((t) => {
      const { damage } = calcDamageResult(unit, t, { damageMult: 0.7 });
      t.hp -= damage;
      addDamageThreat(t, unit, damage);
      return { name: t.name, damage, killed: t.hp <= 0, hp: Math.max(0, t.hp), maxHp: t.maxHp };
    });
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "⚔️", targetName: "",
      damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
      abilityName: "Cleave", abilityIcon: "⚔️", targets: hits,
    });
    return true;
  },
};

export const WARRIOR_ABILITIES: ClassAbilityHandler[] = [taunt, cleave];
