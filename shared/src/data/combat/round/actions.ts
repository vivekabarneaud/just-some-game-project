import type { CombatContext, CombatUnit } from "../types.js";
import { combatRandom } from "../prng.js";
import { getAvoidance, getInitiative, CLOSE_IN_FRACTION } from "../stats.js";
import { calcDamageResult } from "../damage.js";
import { pickTarget, pickTargetForAdventurer } from "../targeting.js";
import { tryClassAbility, tryEnemyAbility } from "../abilities/index.js";
import { evaluateTransitions, getCurrentState } from "../ai/index.js";
import { addDamageThreat } from "../threat.js";
import { shouldFlee, attemptFlee, moraleBreaks } from "../retreat.js";
import { canBreak } from "../ai/profile.js";
import { POS, CHARGE, moveUnit, computeHolds, chargePlan, pinningFoe, inReach, isBehind, weaponAt, paceGap, hasPackmateOn, PACK_TACTICS_BONUS, livingPackmates, PACK_NERVE_ACCURACY } from "../positional.js";

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
  // Chargers act FIRST — a charge is a burst of aggression that beats initiative,
  // so a boar barrels across the field before the slower tank walks up (evaluated
  // at round start, before anyone has moved). Within each group, initiative order.
  const chargers = new Set(
    [...ctx.adventurers, ...ctx.enemies].filter((u) => u.hp > 0 && chargePlan(u, ctx)).map((u) => u.id),
  );
  const alive = [...ctx.adventurers.filter((u) => u.hp > 0), ...ctx.enemies.filter((u) => u.hp > 0)]
    .sort((a, b) => {
      const ca = chargers.has(a.id) ? 1 : 0, cb = chargers.has(b.id) ? 1 : 0;
      if (ca !== cb) return cb - ca;
      return getInitiative(b) - getInitiative(a);
    });
  // Front-line holds for this round (breakthrough vs. hold is committed once);
  // computed at round start, consulted as each unit takes its move.
  const held = computeHolds(ctx);

  for (const unit of alive) {
    if (unit.hp <= 0 || unit.fled) continue;
    // Walls, ritualists, ward stones — units explicitly flagged as non-acting.
    // Still take damage, still healable, just skip the turn.
    if (unit.canAct === false) continue;

    // Stunned: skip the whole turn (no move, no act), burning one stun point.
    if (unit.stunned && unit.stunned > 0) {
      unit.stunned--;
      ctx.log.push({
        round: ctx.round, attackerName: unit.name, attackerIcon: "💫",
        targetName: unit.name, damage: 0, dodged: false, crit: false, killed: false,
        isEnemy: unit.isEnemy, beat: "stunned", note: `${unit.name} is stunned and can't act`,
      });
      continue;
    }

    // Retreat (Model C): broken heroes, and everyone once the team is routing,
    // spend their turn trying to break contact instead of fighting.
    if (shouldFlee(unit, ctx)) { attemptFlee(unit, ctx); continue; }

    // Break-and-run: a beast worn to/below its routsAt (fear of pain), OR a
    // human whose morale snaps (mates fallen, leader down, outnumbered — see
    // moraleBreaks). It survives and leaves the field; counts as defeated for
    // victory, yields only keepOnRout loot.
    if (unit.isEnemy && canBreak(unit) && (enemyBreaksAndRuns(unit) || moraleBreaks(unit, ctx))) { routEnemy(unit, ctx); continue; }

    // Move on this unit's own turn (charge/advance/kite), THEN act below.
    moveUnit(unit, ctx, held);

    evaluateTransitions(unit, ctx);
    const { state } = getCurrentState(unit);
    if (state.onTurn?.(unit, ctx)) continue;

    if (mindControlAttack(unit, ctx)) continue;
    if (unit.mindControlled && unit.mindControlled > 0) continue;

    if (!unit.isEnemy && tryClassAbility(unit, ctx)) continue;
    // A unit that charged this round drives home a goring basic attack (the
    // charge bonus + knockback ride the swing) rather than using another ability.
    if (unit.isEnemy && !unit.chargedThisRound && tryEnemyAbility(unit, ctx)) continue;

    basicAttack(unit, ctx);
  }
}

/**
 * Mind-controlled adventurers hit their own team and decrement the counter.
 * Returns true if the unit's turn was consumed here.
 */
/** A beast at/below its rout threshold breaks off (already-fled units excluded).
 *  Fearlessness is gated by the caller's `canBreak`, which covers this and the
 *  morale path together. */
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
  // Pinned ranged unit drops its bow and stabs the melee foe on top of it.
  const pin = pinningFoe(unit, ctx);
  // A charging unit drives at the foe it charged; consume the charge either way.
  const chargeInfo = unit.chargedThisRound;
  unit.chargedThisRound = undefined;
  const chargeTarget = chargeInfo
    ? targetPool.find((t) => t.id === chargeInfo.targetId && t.hp > 0)
    : undefined;
  const target = chargeTarget ?? pin ?? (unit.isEnemy ? pickTarget(unit, targetPool, ctx.enemies) : pickTargetForAdventurer(unit, targetPool));
  if (!target || target.hp <= 0) return;
  const charged = !!chargeTarget && target.id === chargeTarget.id;

  // Weapon selection (Combat Foundation §3): strike with the best weapon whose
  // band fits the gap — primary, then sidearm, then fists. Nothing fitting =
  // no swing this beat (still closing). Band-less units keep the old reach gate.
  // A pin/charge guarantees contact, where sidearm/fists always fit.
  const weapon = unit.weapons?.length ? weaponAt(unit, paceGap(unit, target)) : null;
  if (unit.weapons?.length) {
    if (!weapon) return;
  } else if (!pin && !charged && !inReach(unit, target)) {
    return;
  }
  // An adventurer falling back to steel (sidearm/fists) attacks physically even
  // if their primary attack is a spell. Enemy fallbacks keep their own school —
  // a lich's claws rake with the same deathly touch as its bolts.
  const forcePhysical = !!weapon && weapon.kind !== "primary" && !unit.isEnemy;

  // The charge's run-up + gore render as ONE line; its slide animates on this entry.
  const chargePaces = charged ? Math.round(chargeInfo!.distance) : 0;
  const chargeSlide = charged ? { id: unit.id, x: Math.round(unit.x ?? 0) } : undefined;
  const icon = charged ? "💨"
    : weapon?.kind === "sidearm" && !unit.isEnemy ? "🗡️"
    : weapon?.kind === "fists" && !unit.isEnemy ? "👊"
    : (unit.isEnemy ? unit.icon : (unit.isMagical ? "🔮" : "⚔️"));

  // Hit resolution: one avoidance roll (Dodge + Parry − Accuracy, capped). On a
  // successful roll the attack is negated; `parried` picks the flavor.
  const avoid = getAvoidance(unit, target, forcePhysical);
  // Pack Nerve: a packed attacker's aim firms up with each living packmate, so a
  // mob lands hits a lone skirmisher never would. Lowers the target's avoidance.
  if (unit.packNerve) {
    const mates = livingPackmates(unit, ctx);
    if (mates > 0) avoid.chance = Math.max(0, avoid.chance - PACK_NERVE_ACCURACY * mates);
  }
  if (combatRandom() * 100 < avoid.chance) {
    const verb = avoid.parried ? "parries" : "dodges";
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: icon,
      targetName: target.name, damage: 0, dodged: true, parried: avoid.parried, crit: false, killed: false,
      targetHp: target.hp, targetMaxHp: target.maxHp, isEnemy: unit.isEnemy,
      ...(charged ? { abilityName: "Goring Charge", note: `${unit.name} charges ${chargePaces} paces at ${target.name}, who ${verb}` } : {}),
      ...(chargeSlide ? { moves: [chargeSlide] } : {}),
    });
    return;
  }

  // A magical creature's close-in fallback rakes at the claws fraction — its
  // magic path ignores the profile's damage values, so the falloff rides a mult.
  const magicalClawsMult = weapon?.kind === "sidearm" && unit.isEnemy && unit.isMagical
    ? CLOSE_IN_FRACTION : undefined;
  const dr = calcDamageResult(unit, target, weapon
    ? { weapon: { dmgMin: weapon.dmgMin, dmgMax: weapon.dmgMax, physical: forcePhysical }, damageMult: magicalClawsMult }
    : undefined);
  const rawDamage = dr.rawDamage;
  const crit = dr.crit;
  // Positional modifiers: a flank from behind does bonus damage. (The old
  // pinned-exposure fraction is gone — a pinned unit now swings its actual
  // sidearm/fists, whose own damage IS the falloff.) Baseline; talents scale.
  let damage = dr.damage;
  if (isBehind(unit, target)) damage = Math.round(damage * POS.backstabMult);
  // Pack Tactics: wolves (and any packed foe) bite harder when a packmate is
  // also on the target — the whole reason a lone wolf is weak and a pack lethal.
  if (unit.pack && hasPackmateOn(unit, target, ctx)) damage = Math.round(damage * (1 + PACK_TACTICS_BONUS));

  // Charge gore: bonus damage + a small capped knockback, both scaling with the
  // distance charged (the shove opens a re-charge gap; cooldown + cap keep it
  // from spiraling).
  let knockMove: { id: string; x: number } | undefined;
  if (charged) {
    damage = Math.round(damage * (1 + Math.min(CHARGE.dmgCap, chargeInfo!.distance * CHARGE.dmgPerPace)));
    const dir = (target.x ?? 0) >= (unit.x ?? 0) ? 1 : -1;
    const knock = Math.min(CHARGE.knockCap, chargeInfo!.distance * CHARGE.knockPerPace);
    target.x = Math.max(POS.fieldMin, Math.min(POS.fieldMax, (target.x ?? 0) + dir * knock));
    knockMove = { id: target.id, x: Math.round(target.x) };
  }

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
        ...(charged ? { moves: [chargeSlide, knockMove].filter(Boolean) as { id: string; x: number }[] } : {}),
      });
      return;
    }
  }

  target.hp -= damage;
  if (!unit.isEnemy) addDamageThreat(target, unit, damage);
  const chargeMoves = [chargeSlide, knockMove].filter(Boolean) as { id: string; x: number }[];
  ctx.log.push({
    round: ctx.round, attackerName: unit.name, attackerIcon: icon,
    targetName: target.name, damage, rawDamage, rollFactor: dr.rollFactor,
    dodged: false, crit, killed: target.hp <= 0,
    targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp,
    isEnemy: unit.isEnemy,
    ...(charged ? { abilityName: "Goring Charge", note: `${unit.name} charges ${chargePaces} paces at ${target.name} and gores for ${damage} damage` } : {}),
    ...(chargeMoves.length ? { moves: chargeMoves } : {}),
  });
}
