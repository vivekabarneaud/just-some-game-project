import type { CombatContext, CombatUnit } from "../types.js";
import { combatRandom } from "../prng.js";
import { getDodgeChance, getInitiative } from "../stats.js";
import { calcDamageResult } from "../damage.js";
import { pickTarget, pickTargetForAdventurer } from "../targeting.js";
import { tryClassAbility, tryEnemyAbility } from "../abilities/index.js";
import { evaluateTransitions, getCurrentState } from "../ai/index.js";

/**
 * The main action phase of a round.
 *
 * Turn order: initiative desc (DEX + WIS/2, halved while slowed).
 *
 * Per-unit flow:
 *   1. Evaluate AI transitions (may change aiState)
 *   2. If state has an onTurn hook, delegate entirely to it
 *   3. Otherwise: mind-control override → class/enemy ability → basic attack
 *
 * Basic attacks roll dodge, then damage, and may trigger Shield Wall (warrior
 * absorbs killing blows for allies, once per combat).
 */
export function runActions(ctx: CombatContext): void {
  const alive = [...ctx.adventurers.filter((u) => u.hp > 0), ...ctx.enemies.filter((u) => u.hp > 0)]
    .sort((a, b) => getInitiative(b) - getInitiative(a));

  for (const unit of alive) {
    if (unit.hp <= 0) continue;

    evaluateTransitions(unit, ctx);
    const { state } = getCurrentState(unit);
    if (state.onTurn?.(unit, ctx)) continue;

    if (mindControlAttack(unit, ctx)) continue;
    if (unit.mindControlled && unit.mindControlled > 0) continue;

    if (!unit.isEnemy && tryClassAbility(unit, ctx)) continue;
    if (unit.isEnemy && tryEnemyAbility(unit, ctx)) continue;

    basicAttack(unit, ctx);
  }
}

/**
 * Mind-controlled adventurers hit their own team and decrement the counter.
 * Returns true if the unit's turn was consumed here.
 */
function mindControlAttack(unit: CombatUnit, ctx: CombatContext): boolean {
  if (unit.isEnemy || !unit.mindControlled || unit.mindControlled <= 0) return false;
  const allyTarget = ctx.adventurers.find((a) => a.hp > 0 && a.id !== unit.id);
  if (allyTarget) {
    const { damage, crit } = calcDamageResult(unit, allyTarget);
    allyTarget.hp -= damage;
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🧠",
      abilityName: "Mind Controlled",
      targetName: allyTarget.name, damage, dodged: false, crit,
      killed: allyTarget.hp <= 0,
      targetHp: Math.max(0, allyTarget.hp), targetMaxHp: allyTarget.maxHp, isEnemy: false,
    });
  }
  unit.mindControlled--;
  return true;
}

function basicAttack(unit: CombatUnit, ctx: CombatContext): void {
  const targetPool = unit.isEnemy ? ctx.adventurers : ctx.enemies;
  const target = unit.isEnemy ? pickTarget(unit, targetPool) : pickTargetForAdventurer(unit, targetPool);
  if (!target || target.hp <= 0) return;

  if (combatRandom() * 100 < getDodgeChance(target)) {
    ctx.log.push({
      round: ctx.round, attackerName: unit.name,
      attackerIcon: unit.isEnemy ? unit.icon : (unit.isMagical ? "🔮" : "⚔️"),
      targetName: target.name, damage: 0, dodged: true, crit: false, killed: false,
      targetHp: target.hp, targetMaxHp: target.maxHp, isEnemy: unit.isEnemy,
    });
    return;
  }

  const { damage, rawDamage, crit } = calcDamageResult(unit, target);

  // Shield Wall: a warrior absorbs a killing blow meant for an ally (once per combat, 50% chance).
  if (unit.isEnemy && !target.isEnemy && target.hp - damage <= 0) {
    const protector = ctx.adventurers.find((a) =>
      a.hp > 0 && a.class === "warrior" && a.id !== target.id && !a.shieldWallUsed,
    );
    if (protector && combatRandom() < 0.5) {
      protector.shieldWallUsed = true;
      protector.hp -= damage;
      ctx.log.push({
        round: ctx.round, attackerName: protector.name, attackerIcon: "🛡️",
        targetName: target.name, damage, dodged: false, crit: false,
        killed: protector.hp <= 0,
        targetHp: Math.max(0, protector.hp), targetMaxHp: protector.maxHp,
        isEnemy: false, isShieldWall: true,
        abilityName: "Shield Wall", abilityIcon: "🛡️",
      });
      return;
    }
  }

  target.hp -= damage;
  ctx.log.push({
    round: ctx.round, attackerName: unit.name,
    attackerIcon: unit.isEnemy ? unit.icon : (unit.isMagical ? "🔮" : "⚔️"),
    targetName: target.name, damage, rawDamage,
    dodged: false, crit, killed: target.hp <= 0,
    targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp,
    isEnemy: unit.isEnemy,
  });
}
