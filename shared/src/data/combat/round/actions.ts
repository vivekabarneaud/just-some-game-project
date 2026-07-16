import type { CombatContext, CombatUnit } from "../types.js";
import { combatRandom } from "../prng.js";
import { getDodgeChance, getInitiative } from "../stats.js";
import { calcDamageResult } from "../damage.js";
import { pickTarget, pickTargetForAdventurer } from "../targeting.js";
import { tryClassAbility, tryEnemyAbility } from "../abilities/index.js";
import { evaluateTransitions, getCurrentState } from "../ai/index.js";
import { addDamageThreat } from "../threat.js";
import { shouldFlee, attemptFlee } from "../retreat.js";

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
    if (unit.hp <= 0 || unit.fled) continue;
    // Walls, ritualists, ward stones — units explicitly flagged as non-acting.
    // Still take damage, still healable, just skip the turn.
    if (unit.canAct === false) continue;

    // Retreat (Model C): broken heroes, and everyone once the team is routing,
    // spend their turn trying to break contact instead of fighting.
    if (shouldFlee(unit, ctx)) { attemptFlee(unit, ctx); continue; }

    // Beast rout: an enemy worn to/below its routsAt breaks and runs — it
    // survives and leaves the field (mercy + realism; animals don't fight to
    // the death). Counts as defeated for victory; yields only keepOnRout loot.
    if (unit.isEnemy && enemyBreaksAndRuns(unit)) { routEnemy(unit, ctx); continue; }

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
/** A beast at/below its rout threshold breaks off (already-fled units excluded). */
function enemyBreaksAndRuns(unit: CombatUnit): boolean {
  if (unit.routsAt == null || unit.fled || unit.hp <= 0) return false;
  return unit.hp <= unit.routsAt * unit.maxHp;
}

/** The beast turns tail: mark it fled (survives, off the field) and log the break.
 *  No escape roll — the settlement wants it gone, not run down. */
function routEnemy(unit: CombatUnit, ctx: CombatContext): void {
  unit.fled = true;
  ctx.log.push({
    round: ctx.round, attackerName: unit.name, attackerIcon: "🏃",
    targetName: unit.name, damage: 0, dodged: false, crit: false, killed: false,
    targetHp: Math.max(0, unit.hp), targetMaxHp: unit.maxHp, isEnemy: true,
    beat: "flee_success", note: `${unit.name} breaks and runs`,
  });
}

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
      // Shield Wall is a protective action — credit threat to the protector,
      // not the original attacker (the warrior pulled aggro by stepping in).
      addDamageThreat(unit, protector, damage);
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
  if (!unit.isEnemy) addDamageThreat(target, unit, damage);
  ctx.log.push({
    round: ctx.round, attackerName: unit.name,
    attackerIcon: unit.isEnemy ? unit.icon : (unit.isMagical ? "🔮" : "⚔️"),
    targetName: target.name, damage, rawDamage,
    dodged: false, crit, killed: target.hp <= 0,
    targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp,
    isEnemy: unit.isEnemy,
  });
}
