import type { CombatContext, CombatUnit } from "./types.js";
import { combatRandom } from "./prng.js";
import { getAttackPower, getInitiative, getDefenseReduction, getMagicResistReduction, dealsMagicalDamage } from "./stats.js";

// ─── Tunables (Model C — see docs/DESIGN_RECOVERY_AND_RETREAT.md) ───────────────

/** Survival reflex: a killing blow that overshoots 0 by at least this fraction of
 *  max HP is "overkill" and downs the hero outright; anything softer leaves them
 *  clinging at 1 HP (once per fight). Overshoot is the reconciliation-friendly
 *  proxy for the design's "single hit ≥ 50% max HP". */
const OVERKILL_OVERSHOOT_FRACTION = 0.5;

/** Crude (no-commander) rout: retreat when the team's current HP drops below this
 *  fraction of its total, OR half the team is broken/down. Deliberately noisy. */
const PANIC_HP_FRACTION = 0.30;

/** Commander projection caution: she calls the retreat once our rounds-to-win
 *  exceed the enemy's rounds-to-break-us by even a little (retreat in time). */
const HOLD_MARGIN = 0.9;

/** Flee-check formula. */
const FLEE_BASE = 50;
const FLEE_INIT_WEIGHT = 2;
const FLEE_OUTNUMBERED_PENALTY = 8;
const FLEE_COORDINATED_BONUS = 18;
const FLEE_BROKEN_PENALTY = 10;
const FLEE_MIN = 10;
const FLEE_MAX = 95;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Player-side units still on the field (not downed, not fled). Includes allies. */
function activeFighters(ctx: CombatContext): CombatUnit[] {
  return ctx.adventurers.filter((u) => u.hp > 0 && !u.fled);
}

/** Adventurer-kind units still in the fight (excludes NPC allies/entities). */
function activeAdventurers(ctx: CombatContext): CombatUnit[] {
  return ctx.adventurers.filter((u) => u.kind === "adventurer" && u.hp > 0 && !u.fled);
}

function aliveEnemies(ctx: CombatContext): CombatUnit[] {
  // Fled enemies (routed beasts) have hp > 0 but have left the field — they no
  // longer fight, threaten, or block victory.
  return ctx.enemies.filter((u) => u.hp > 0 && !u.fled);
}

/** The player's side is gone (every adventurer is downed or fled). */
export function playerGone(ctx: CombatContext): boolean {
  return activeAdventurers(ctx).length === 0;
}

/** All enemies defeated. */
export function enemiesGone(ctx: CombatContext): boolean {
  return aliveEnemies(ctx).length === 0;
}

/** An active commander (Morgause) is present and able to direct — alive, on the
 *  field, not broken. Command is lost the moment she falls/flees/breaks. */
function hasActiveCommander(ctx: CombatContext): boolean {
  return ctx.adventurers.some(
    (u) => u.isCommander && u.kind === "adventurer" && u.hp > 0 && !u.fled && !u.broken,
  );
}

// ─── Survival reflex ──────────────────────────────────────────────────────────

/**
 * Reconciliation pass run right after each damage phase (status ticks, actions)
 * and before the wipe checks. The first time a non-overkill blow would drop an
 * adventurer to 0, they cling to 1 HP and become "broken" (out of the fighting
 * line — they can only flee, and a heal can't put them back in). Overkill (a hit
 * that overshoots 0 hard) downs them outright. Disabled when ctx.disableRetreat.
 */
export function applySurvivalReflex(ctx: CombatContext): void {
  if (ctx.disableRetreat) return;
  for (const u of ctx.adventurers) {
    if (u.kind !== "adventurer") continue;
    if (u.hp > 0 || u.reflexUsed || u.broken) continue; // not freshly downed
    u.reflexUsed = true;
    const overkill = u.hp <= -(OVERKILL_OVERSHOOT_FRACTION * u.maxHp);
    if (overkill) continue; // a crushing blow — stays downed, needs rescue/revive
    // Saved: cling to 1 HP, reeling and out of the line.
    u.hp = 1;
    u.broken = true;
    unmarkStaleKill(ctx, u.name);
    ctx.log.push({
      round: ctx.round, attackerName: u.name, attackerIcon: "🩹",
      targetName: u.name, damage: 0, dodged: false, crit: false, killed: false,
      targetHp: 1, targetMaxHp: u.maxHp, isEnemy: false,
      beat: "broken", note: `${u.name} reels — barely standing, and breaks for the rear`,
    });
  }
}

/** A killing-blow log entry was stamped before the reflex saved the unit. Walk the
 *  log back and clear the stale `killed` flag so the playback doesn't show a death
 *  that didn't happen. */
function unmarkStaleKill(ctx: CombatContext, name: string): void {
  for (let i = ctx.log.length - 1; i >= 0; i--) {
    const e = ctx.log[i];
    if (e.targetName === name && e.killed) { e.killed = false; return; }
    if (e.targets) {
      const t = e.targets.find((x) => x.name === name && x.killed);
      if (t) { t.killed = false; return; }
    }
  }
}

// ─── Rout decision ────────────────────────────────────────────────────────────

/** Sum of effective damage-per-round a set of attackers deals into the opposing
 *  side (rough: raw attack power × (1 − average opposing mitigation)). */
function sideDps(attackers: CombatUnit[], defenders: CombatUnit[]): number {
  if (attackers.length === 0 || defenders.length === 0) return 0;
  const avgPhysRed = defenders.reduce((s, d) => s + getDefenseReduction(d), 0) / defenders.length;
  const avgMagRed = defenders.reduce((s, d) => s + getMagicResistReduction(d), 0) / defenders.length;
  let dps = 0;
  for (const a of attackers) {
    const red = dealsMagicalDamage(a) ? avgMagRed : avgPhysRed;
    dps += getAttackPower(a) * (1 - red);
  }
  return dps;
}

/** Are we losing the damage race? (Commander's read.) */
function losingTheRace(ctx: CombatContext): boolean {
  const team = activeAdventurers(ctx);
  const foes = aliveEnemies(ctx);
  if (team.length === 0) return true;
  if (foes.length === 0) return false;

  const ourDps = sideDps(team, foes);
  const theirDps = sideDps(foes, team);
  const enemyHp = foes.reduce((s, e) => s + e.hp, 0);
  const ourHp = team.reduce((s, t) => s + t.hp, 0);

  const ourRoundsToWin = enemyHp / Math.max(1, ourDps);
  const theirRoundsToBreak = ourHp / Math.max(1, theirDps);
  // Cautious: bail once they're winning the race by even the HOLD_MARGIN.
  return ourRoundsToWin > theirRoundsToBreak * HOLD_MARGIN;
}

/** Crude panic check used when no commander is present. */
function panicRout(ctx: CombatContext): boolean {
  const team = ctx.adventurers.filter((u) => u.kind === "adventurer");
  if (team.length === 0) return false;
  const totalHp = team.reduce((s, t) => s + t.hp, 0);
  const totalMaxHp = team.reduce((s, t) => s + t.maxHp, 0);
  if (totalMaxHp > 0 && totalHp / totalMaxHp < PANIC_HP_FRACTION) return true;
  const downOrBroken = team.filter((t) => t.hp <= 0 || t.broken).length;
  return downOrBroken >= Math.ceil(team.length / 2);
}

/**
 * Evaluate the team's morale each round (before actions). Sets ctx.retreating
 * (sticky — once a rout starts it doesn't reverse) and ctx.retreatCoordinated
 * (a commander is directing). With Morgause the call is a smart damage-race
 * projection; without her it's the noisy panic heuristic.
 */
export function evaluateRetreat(ctx: CombatContext): void {
  if (ctx.disableRetreat) return;
  const commander = hasActiveCommander(ctx);
  ctx.retreatCoordinated = commander;

  if (ctx.retreating) return; // already routing — stays that way

  // Nothing to decide if we've already won/lost the field.
  if (enemiesGone(ctx) || playerGone(ctx)) return;

  const shouldRetreat = commander ? losingTheRace(ctx) : panicRout(ctx);
  if (!shouldRetreat) {
    // A commander who chooses to stay is making the call to Hold — logged at
    // most once per fight (not every round) to keep the log clean.
    if (commander && !ctx.log.some((e) => e.beat === "order_hold")) {
      ctx.log.push({
        round: ctx.round, attackerName: commanderName(ctx), attackerIcon: "🎖️",
        targetName: "", damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
        beat: "order_hold", note: `${commanderName(ctx)}: "Hold the line — we can take them!"`,
      });
    }
    return;
  }

  ctx.retreating = true;
  ctx.log.push({
    round: ctx.round,
    attackerName: commander ? commanderName(ctx) : "The line",
    attackerIcon: commander ? "🎖️" : "🏳️",
    targetName: "", damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
    beat: "order_fallback",
    note: commander
      ? `${commanderName(ctx)}: "Fall back — get them out, now!"`
      : "The line breaks — it's every soul for themselves!",
  });
}

function commanderName(ctx: CombatContext): string {
  return ctx.adventurers.find((u) => u.isCommander && u.hp > 0)?.name ?? "The commander";
}

// ─── Flee resolution ───────────────────────────────────────────────────────────

/** Per-round escape chance for a fleeing unit (0–100). */
function escapeChance(unit: CombatUnit, ctx: CombatContext): number {
  const foes = aliveEnemies(ctx);
  const avgPursuerInit = foes.length
    ? foes.reduce((s, e) => s + getInitiative(e), 0) / foes.length
    : 0;
  let pct = FLEE_BASE
    + (getInitiative(unit) - avgPursuerInit) * FLEE_INIT_WEIGHT
    - Math.max(0, foes.length - 1) * FLEE_OUTNUMBERED_PENALTY;
  if (ctx.retreatCoordinated) pct += FLEE_COORDINATED_BONUS;
  if (unit.broken) pct -= FLEE_BROKEN_PENALTY;
  return Math.max(FLEE_MIN, Math.min(FLEE_MAX, pct));
}

/**
 * A fleeing unit's turn: roll to break contact. Success removes them from the
 * fight alive (comes home wounded). Failure burns the turn — they stay on the
 * field and eat the pursuers' blows, then try again next round (repeated fails =
 * the cornered-death vector). Always consumes the turn.
 */
export function attemptFlee(unit: CombatUnit, ctx: CombatContext): void {
  if (unit.fled) return;
  const chance = escapeChance(unit, ctx);
  if (combatRandom() * 100 < chance) {
    unit.fled = true;
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🏃",
      targetName: unit.name, damage: 0, dodged: false, crit: false, killed: false,
      targetHp: Math.max(0, unit.hp), targetMaxHp: unit.maxHp, isEnemy: false,
      beat: "flee_success", note: `${unit.name} breaks contact and slips away`,
    });
  } else {
    ctx.log.push({
      round: ctx.round, attackerName: unit.name, attackerIcon: "🏃",
      targetName: unit.name, damage: 0, dodged: false, crit: false, killed: false,
      targetHp: Math.max(0, unit.hp), targetMaxHp: unit.maxHp, isEnemy: false,
      beat: "flee_fail", note: `${unit.name} can't shake them`,
    });
  }
}

/** Should this unit flee instead of fight this turn? Broken units always run;
 *  everyone runs once the team is routing. */
export function shouldFlee(unit: CombatUnit, ctx: CombatContext): boolean {
  if (ctx.disableRetreat) return false;
  if (unit.isEnemy || unit.kind !== "adventurer") return false;
  return !!unit.broken || !!ctx.retreating;
}

// ─── Outlaw morale (Outlaw archetype) ────────────────────────────────────────
// A morale enemy routs on COURAGE, not just HP. Each round it weighs:
//   morale = courage + (leader alive ? LEADER : 0)
//          − LOSS × (their fallen ÷ their starting number)   ← mates dropping
//          − OUTNUM × (your living − their living, if > 0)    ← being outnumbered
//          + PRESS × (1 − your side's HP fraction)            ← smelling the kill
// …and breaks when it drops below zero. Every constant is a tuning knob.
const MORALE = { leader: 40, loss: 70, outnum: 12, press: 45 };

/** Does this humanoid's nerve break THIS round? Leaders and non-morale units never do. */
export function moraleBreaks(unit: CombatUnit, ctx: CombatContext): boolean {
  if (!unit.morale || unit.fled || unit.hp <= 0) return false;
  const side = ctx.enemies;
  const livingSide = side.filter((e) => e.hp > 0 && !e.fled);
  const foes = ctx.adventurers.filter((a) => a.hp > 0 && !a.fled);
  if (foes.length === 0) return false; // no one left to fear
  const fallenFrac = side.length > 0 ? (side.length - livingSide.length) / side.length : 0;
  const leaderAlive = livingSide.some((e) => e.leader);
  const outnumberedBy = Math.max(0, foes.length - livingSide.length);
  const foeMaxHp = foes.reduce((s, a) => s + a.maxHp, 0);
  const foeHpFrac = foeMaxHp > 0 ? foes.reduce((s, a) => s + a.hp, 0) / foeMaxHp : 1;
  const morale = unit.morale.courage
    + (leaderAlive ? MORALE.leader : 0)
    - MORALE.loss * fallenFrac
    - MORALE.outnum * outnumberedBy
    + MORALE.press * (1 - foeHpFrac);
  return morale < 0;
}
