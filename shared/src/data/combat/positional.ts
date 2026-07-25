// ─── 1D positional layer (P1) ───────────────────────────────────────────────
// Ports the validated sandbox model (docs/DESIGN_POSITIONAL_COMBAT.md; prototype
// at frontend/src/prototype/) onto production CombatUnits. Ally side = !isEnemy
// (starts low on the X axis), enemy side = isEnemy (starts high); they close.
//
// Baseline numbers live here; gear/talents scale them later. This module is the
// pure positional logic — placement, movement, engagement, and the reach /
// pinned / behind predicates the attack layer consults. It is wired into the sim
// by: placeUnits() at combat start, movePhase() as a round phase before actions,
// and isPinned/inReach/isBehind inside basicAttack + a reach-aware pickTarget.

import type { CombatContext, CombatUnit } from "./types.js";
import type { CombatLogEntry } from "./types.js";

export const POS = {
  fieldMin: 0, fieldMax: 100,
  allyFront: 32, allyBack: 18,
  enemyFront: 68, enemyBack: 82,
  contact: 5,          // melee contact distance (paces)
  backstabMult: 1.5,   // baseline flank bonus; talents scale
  exposureMult: 0.4,   // pinned ranged unit "drew a dagger" — fraction of its attack
  holdPer: 2,          // attackers ONE frontliner pins; the rest overflow to the backline
};

/** Charge tuning (Charger archetype). A charge covers ground in the Move phase;
 *  the gore's bonus + knockback scale with the distance actually charged. Small,
 *  capped knockback keeps it loop-safe (no charge->shove->charge spiral). */
export const CHARGE = {
  minRunup: 10,       // need this much gap BEYOND contact to bother charging
  dmgPerPace: 0.025,  // +2.5% gore damage per pace charged...
  dmgCap: 1.0,        // ...up to +100% on a long run
  knockPerPace: 0.12, // shove the target back this many paces per pace charged...
  knockCap: 6,        // ...capped low — a stumble, not a launch
};

const RANGED_CLASSES = new Set(["archer", "wizard", "priest"]);

export function isRanged(u: CombatUnit): boolean {
  if (u.class) return RANGED_CLASSES.has(u.class);   // adventurers/allies: by class
  return u.combatRole === "back";                     // enemies: by authored formation row
}
export function reachOf(u: CombatUnit): number {
  return isRanged(u) ? POS.fieldMax : POS.contact; // melee connects at contact distance
}
export function mobilityOf(u: CombatUnit): number {
  const base = u.class === "assassin" ? 22
    : u.class === "warrior" ? 12
    : isRanged(u) ? 7
    : 10;
  // Raw mobility (Combat Foundation): flat paces/turn a creature gets without
  // inflating DEX. Wolves are "fast" this way; boars carry none and rely on Charge.
  return Math.max(4, Math.round(base + (u.dex - 10) * 0.3 + (u.raw?.mobility ?? 0)));
}
export function canBypass(u: CombatUnit): boolean {
  return u.class === "assassin"; // + Slip Away / flanker talents later
}

const allySide = (u: CombatUnit) => !u.isEnemy;
const clamp = (x: number) => Math.max(POS.fieldMin, Math.min(POS.fieldMax, x));
const px = (u: CombatUnit) => u.x ?? 0;
const gap = (a: CombatUnit, b: CombatUnit) => Math.abs(px(a) - px(b));
/** Distance in paces between two units (exported for the ability range gate). */
export function paceGap(a: CombatUnit, b: CombatUnit): number { return gap(a, b); }
const nearest = (u: CombatUnit, pool: CombatUnit[]) => pool.slice().sort((a, b) => gap(u, a) - gap(u, b))[0];
// Higher = deeper into the enemy's own back territory (where casters sit).
const backlineScore = (e: CombatUnit, u: CombatUnit) => (allySide(u) ? px(e) : -px(e));
const living = (ctx: CombatContext) => [...ctx.adventurers, ...ctx.enemies].filter((u) => u.hp > 0 && !u.fled);
const foesOf = (u: CombatUnit, ctx: CombatContext) => (u.isEnemy ? ctx.adventurers : ctx.enemies).filter((f) => f.hp > 0 && !f.fled);

/** Place everyone at combat start: melee at their side's front, ranged behind. */
export function placeUnits(ctx: CombatContext): void {
  for (const u of [...ctx.adventurers, ...ctx.enemies]) {
    const front = allySide(u) ? POS.allyFront : POS.enemyFront;
    const back = allySide(u) ? POS.allyBack : POS.enemyBack;
    u.x = isRanged(u) ? back : front;
  }
}

/** Which advancing melee are HELD by the opposing front this round (capacity =
 *  holders × holdPer, frontmost held first; overflow + bypass slip past). */
export function computeHolds(ctx: CombatContext): Set<string> {
  const units = living(ctx);
  const held = new Set<string>();
  for (const enemySide of [true, false]) {
    const attackers = units.filter((u) => u.isEnemy === enemySide && !isRanged(u) && !canBypass(u));
    const holders = units.filter((u) => u.isEnemy !== enemySide && !isRanged(u));
    const capacity = holders.length * POS.holdPer;
    attackers.sort((a, b) => (enemySide ? px(a) - px(b) : px(b) - px(a))); // frontmost (toward center) first
    attackers.forEach((a, i) => { if (i < capacity) held.add(a.id); });
  }
  return held;
}

function logMove(ctx: CombatContext, u: CombatUnit, target: CombatUnit, paces: number): void {
  const entry: CombatLogEntry = {
    round: ctx.round,
    attackerName: u.name,
    attackerIcon: u.icon || "👣",
    targetName: target.name,
    damage: 0, dodged: false, crit: false, killed: false,
    isEnemy: u.isEnemy,
    beat: "move",
    note: `${u.name} advances ${paces} pace${paces === 1 ? "" : "s"} toward ${target.name}`,
    moves: [{ id: u.id, x: Math.round(px(u)) }],
  };
  ctx.log.push(entry);
}

/** A ranged unit giving ground (kite); stamped so the retreat animates. */
function logKite(ctx: CombatContext, u: CombatUnit): void {
  ctx.log.push({
    round: ctx.round, attackerName: u.name, attackerIcon: u.icon || "🏹",
    targetName: u.name, damage: 0, dodged: false, crit: false, killed: false,
    isEnemy: u.isEnemy, beat: "move", note: `${u.name} gives ground`,
    moves: [{ id: u.id, x: Math.round(px(u)) }],
  });
}

/** If this unit can charge right now, at whom and how far. Shared by the mover
 *  (to execute) and the turn order (chargers act FIRST — a charge is a burst of
 *  aggression that beats initiative). Returns null when held/engaged (no run-up
 *  — gap too small), on cooldown, ranged, or with no chargeable foe. */
export function chargePlan(u: CombatUnit, ctx: CombatContext): { target: CombatUnit; dist: number } | null {
  if (!u.charge || isRanged(u) || (u.cooldowns.charge ?? 0) > 0) return null;
  const foes = foesOf(u, ctx);
  if (!foes.length) return null;
  const target = nearest(u, foes);
  const g = gap(u, target);
  if (g <= POS.contact + CHARGE.minRunup) return null;
  return { target, dist: Math.min(u.charge.range, g - POS.contact) };
}

/** Move ONE unit on its turn: charge if it can, else melee-advance (stopped by
 *  engagement) or ranged-kite. Called by the interleaved turn loop so a unit's
 *  move and its action are one continuous beat (a boar's charge flows straight
 *  into its gore, instead of every unit sliding at once at round start). */
export function moveUnit(u: CombatUnit, ctx: CombatContext, held: Set<string>): void {
  u.chargedThisRound = undefined; // transient — set only if this unit charges now
  if (u.canAct === false) return; // walls / ritualists hold position
  const foes = foesOf(u, ctx);
  if (!foes.length) return;
  const mob = mobilityOf(u);

  // Charge (Charger archetype): barrel to contact if there's room + the cooldown
  // is ready. No separate move entry — the run-up's slide + narration ride the
  // gore entry (one line: "charges N paces at Y and gores for D"). Held/engaged
  // units have no run-up (chargePlan returns null), so engagement defuses it.
  const plan = chargePlan(u, ctx);
  if (plan) {
    const dir = px(plan.target) > px(u) ? 1 : -1;
    u.x = clamp(px(u) + dir * plan.dist);
    u.chargedThisRound = { distance: plan.dist, targetId: plan.target.id };
    u.cooldowns.charge = u.charge!.cooldown;
    return; // the charge IS this unit's move
  }

  if (isRanged(u)) {
    const pinned = foes.some((f) => !isRanged(f) && gap(u, f) <= POS.contact);
    const pressed = foes.some((f) => !isRanged(f) && gap(u, f) <= POS.contact * 1.4);
    if (pressed && !pinned) {
      const before = px(u);
      u.x = clamp(px(u) + (allySide(u) ? -1 : 1) * mob); // kite (pinned = locked)
      if (Math.abs(px(u) - before) >= 2) logKite(ctx, u);
    }
    return;
  }

  // Melee. Commit an intent ONCE (no per-round flip-flop): bypassers and
  // overflow (beyond the front's hold capacity) BREAK THROUGH to the backline;
  // everyone else holds the FRONT line.
  if (u.breakthrough === undefined) u.breakthrough = canBypass(u) || !held.has(u.id);
  const fromX = px(u);
  let intent: CombatUnit | undefined;

  if (u.breakthrough) {
    // Push toward the enemy backline and stay committed; flank just past.
    intent = foes.slice().sort((a, b) => backlineScore(b, u) - backlineScore(a, u))[0];
    const dir = px(intent) > px(u) ? 1 : -1;
    const stop = px(intent) + dir * 2;
    let destX = px(u) + dir * mob;
    destX = dir > 0 ? Math.min(destX, stop) : Math.max(destX, stop);
    u.x = clamp(destX);
  } else {
    // Frontline: hold the moment an enemy is in contact — never chase a foe
    // that has slipped past. Otherwise close to the line.
    const engaged = foes.some((f) => !isRanged(f) && gap(u, f) <= POS.contact);
    if (!engaged) {
      const ahead = foes.filter((f) => (allySide(u) ? px(f) >= px(u) : px(f) <= px(u)));
      intent = nearest(u, ahead.length ? ahead : foes);
      const dir = px(intent) > px(u) ? 1 : -1;
      const stopX = px(intent) - dir * POS.contact;
      let destX = px(u) + dir * mob;
      destX = dir > 0 ? Math.min(destX, stopX) : Math.max(destX, stopX);
      u.x = clamp(destX);
    }
  }
  // Stamp any real advance (>=2 paces) — including the final close to contact — so
  // the approach both reads in the log AND animates on this unit's own turn.
  if (intent && Math.abs(px(u) - fromX) >= 2) {
    logMove(ctx, u, intent, Math.round(Math.abs(px(u) - fromX)));
  }
}

/** Legacy whole-army move phase (kept for the standalone prototype/tests). The
 *  live round instead moves each unit on its own turn — see runActions. */
export function movePhase(ctx: CombatContext): void {
  const held = computeHolds(ctx);
  for (const u of living(ctx)) moveUnit(u, ctx, held);
}

// ── Predicates the attack layer consults ────────────────────────────────────

/** A ranged unit with a melee foe in contact — drops the bow, draws a dagger. */
export function isPinned(u: CombatUnit, ctx: CombatContext): boolean {
  if (!isRanged(u)) return false;
  return foesOf(u, ctx).some((f) => !isRanged(f) && gap(u, f) <= POS.contact);
}
/** The melee foe pinning this ranged unit (the one it stabs), or null. */
export function pinningFoe(u: CombatUnit, ctx: CombatContext): CombatUnit | null {
  if (!isRanged(u)) return null;
  const pinners = foesOf(u, ctx).filter((f) => !isRanged(f) && gap(u, f) <= POS.contact);
  return pinners.length ? nearest(u, pinners) : null;
}
/** Can this unit's attack reach the target right now? */
export function inReach(u: CombatUnit, target: CombatUnit): boolean {
  return gap(u, target) <= reachOf(u) + 1e-6;
}
/** Attacker is on the far side of the target (flanked past it). */
export function isBehind(u: CombatUnit, target: CombatUnit): boolean {
  return allySide(u) ? px(u) > px(target) : px(u) < px(target);
}
/** + damage when a packmate shares your target (Pack Tactics). */
export const PACK_TACTICS_BONUS = 0.15;
/** Pack Tactics (Flanker archetype): is a living packmate (same `pack` tag) ALSO
 *  in reach of this target? If so the pack is ganging up and every bite bites
 *  harder. A lone pack-hunter gets nothing — wolves are dangerous in numbers. */
export function hasPackmateOn(u: CombatUnit, target: CombatUnit, ctx: CombatContext): boolean {
  if (!u.pack) return false;
  const mates = u.isEnemy ? ctx.enemies : ctx.adventurers;
  return mates.some((m) => m.id !== u.id && m.hp > 0 && !m.fled && m.pack === u.pack && inReach(m, target));
}
