// ─── Flight: the first real citizen of the AI state machine ─────────────────
// Breaking is a TRANSITION; `fleeing` and `yielded` are STATES that own their
// own turn. This used to be a hardcoded block in round/actions.ts that ran
// before the machine got a look in, which meant a broken creature had no state,
// no onTurn hook, and could do nothing but run in a straight line.
//
// The two exits are not two flavours of one thing:
//   yielding = "do whatever you want with me" — the weapon is on the ground.
//   fleeing  = "I don't want to get caught"   — still a participant, still running.
//
// Which one a creature takes is authored per creature as its `fear` style
// (types.ts AIFear), so a boar can only ever flee and a brigand can only ever
// yield. See docs/design/combat/ROUT_AND_FLIGHT.md.

import type { CombatContext, CombatUnit } from "../types.js";
import type { AIState, AITransition } from "./types.js";
import { canBreak, resolveAI } from "./profile.js";
import { moraleBreaks } from "../retreat.js";
import { FLIGHT, POS, mobilityOf } from "../positional.js";

/** A beast worn to/below its rout threshold (fear of pain). Already-broken and
 *  down units excluded; fearlessness is gated by `canBreak` in the guard. */
function painBreaks(unit: CombatUnit): boolean {
  if (unit.routsAt == null || unit.fled || unit.hp <= 0) return false;
  return unit.hp <= unit.routsAt * unit.maxHp;
}

/** The nerve goes: a beast worn past its threshold, OR a human whose morale
 *  snaps (mates fallen, leader down, outnumbered — see moraleBreaks). WHEN it
 *  breaks; the `fear` style decides WHAT that looks like. */
function nerveGoes(unit: CombatUnit, ctx: CombatContext): boolean {
  if (!unit.isEnemy || unit.hp <= 0 || unit.fled) return false;
  if (!canBreak(unit)) return false;
  return painBreaks(unit) || moraleBreaks(unit, ctx);
}

/** A person who breaks throws down their weapon and stays, out of the fight
 *  where they stand. Also the fallback for a unit with no position (defensive:
 *  a positionless sim has no field to run across). */
function enterYield(unit: CombatUnit, ctx: CombatContext): void {
  unit.yielded = true;
  ctx.log.push({
    round: ctx.round, attackerId: unit.id, attackerName: unit.name, attackerIcon: "🏳️",
    targetName: unit.name, damage: 0, dodged: false, crit: false, killed: false,
    targetHp: Math.max(0, unit.hp), targetMaxHp: unit.maxHp, isEnemy: true,
    beat: "yields", note: `${unit.name} throws down their weapon`,
  });
}

/** The nerve breaks and the creature RUNS — `fleeing` until it makes its own
 *  field edge. A bolting animal weaves flat out: it borrows the Skirmisher
 *  elusion (distance-scaled dodge vs ranged), so the farther it gets, the worse
 *  the shot. A withdrawing one backs off at a walk, facing the line. */
function enterFlight(unit: CombatUnit, ctx: CombatContext): void {
  unit.fleeing = true;
  const bolts = resolveAI(unit).fear === "bolts";
  if (bolts) {
    unit.elusiveAtRange = Math.max(unit.elusiveAtRange ?? 0, FLIGHT.boltElusion);
  }
  ctx.log.push({
    round: ctx.round, attackerId: unit.id, attackerName: unit.name, attackerIcon: "🏃",
    targetName: unit.name, damage: 0, dodged: false, crit: false, killed: false,
    targetHp: Math.max(0, unit.hp), targetMaxHp: unit.maxHp, isEnemy: true,
    beat: "turns_tail",
    note: bolts ? `${unit.name} turns tail and bolts` : `${unit.name} falls back, still facing the line`,
  });
}

/** One turn of flight: run toward this side's field edge. Enemies flee toward
 *  fieldMax — back into the woods, never through the party.
 *
 *  Returns true when the state consumed the whole turn: either the unit made the
 *  edge (off the field, `fled`, defeated-with-sheddable-loot like any rout), or
 *  it is running flat out and has nothing left for tactics. Returns false for a
 *  creature backing off facing the line — the withdrawal WAS its move, and the
 *  normal pipeline then runs, so it can still bite or cast in reach.
 *
 *  Slain mid-flight = a full loot table, which is the point of the chase. */
function fleeTurn(unit: CombatUnit, ctx: CombatContext): boolean {
  const speed = Math.max(4, Math.round(mobilityOf(unit) * flightSpeedOf(unit, ctx)));
  const newX = (unit.x ?? POS.enemyFront) + speed;
  if (newX >= POS.fieldMax) {
    unit.x = POS.fieldMax;
    unit.fled = true;
    ctx.log.push({
      round: ctx.round, attackerId: unit.id, attackerName: unit.name, attackerIcon: "🏃",
      targetName: unit.name, damage: 0, dodged: false, crit: false, killed: false,
      targetHp: Math.max(0, unit.hp), targetMaxHp: unit.maxHp, isEnemy: true,
      beat: "flee_success", note: `${unit.name} escapes into the wilds`,
      moves: [{ id: unit.id, x: Math.round(unit.x) }],
    });
    return true;
  }
  unit.x = newX;
  ctx.log.push({
    round: ctx.round, attackerId: unit.id, attackerName: unit.name, attackerIcon: "🏃",
    targetName: unit.name, damage: 0, dodged: false, crit: false, killed: false,
    targetHp: Math.max(0, unit.hp), targetMaxHp: unit.maxHp, isEnemy: true,
    beat: "move", note: `${unit.name} puts ${speed} paces between them`,
    moves: [{ id: unit.id, x: Math.round(unit.x) }],
  });
  // Flat out: nothing left for tactics. Backing off: the move was the turn's
  // movement, and the rest of the pipeline still gets its say.
  return resolveAI(unit).fear === "bolts";
}

/** How fast this creature runs when broken, as a multiple of its mobility.
 *  Authored per creature (`ai.flightSpeed`), defaulted from the fear style. */
function flightSpeedOf(unit: CombatUnit, ctx: CombatContext): number {
  const base = resolveAI(unit).flightSpeed;
  // No quarter: it is running for its life rather than breaking off, and it knows
  // the difference. Without this the chase is a formality and "run them down"
  // would just be a loot button.
  return ctx.quarter === "none" ? base * FLIGHT.deniedBoost : base;
}

/** Flight states, composable: a boss behaviour spreads these into its own
 *  `states` rather than reimplementing breaking. */
export const FLIGHT_STATES: Record<string, AIState> = {
  // Basic attacks only: a creature backing off still bites what is in reach, but
  // it is past tactics. Casting or howling while you retreat is a deliberate
  // choice a creature makes, so it belongs to a bespoke behaviour that defines
  // its OWN fleeing state with allowAbilities on (a mage's parting frost), not
  // to every routed animal in the game.
  fleeing: { id: "fleeing", onEnter: enterFlight, onTurn: fleeTurn, allowAbilities: false },
  // Disarmed: the turn simply passes. He is still standing there.
  yielded: { id: "yielded", onEnter: enterYield, onTurn: () => true },
};

/** Breaking, as guards. Order matters: `yields` is tested first, so a creature
 *  whose style is to surrender never takes the running branch. A unit with no
 *  position falls to `yielded` too — there is no field for it to cross. */
export const FLIGHT_TRANSITIONS: AITransition[] = [
  {
    from: "normal", to: "yielded",
    when: (u, ctx) => nerveGoes(u, ctx) && (resolveAI(u).fear === "yields" || u.x == null),
  },
  { from: "normal", to: "fleeing", when: nerveGoes },
];
