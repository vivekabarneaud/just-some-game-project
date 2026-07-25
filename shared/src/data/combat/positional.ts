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

export const POS = {
  fieldMin: 0, fieldMax: 100,
  allyFront: 32, allyBack: 18,
  enemyFront: 68, enemyBack: 82,
  contact: 5,          // melee contact distance (paces)
  backstabMult: 1.5,   // baseline flank bonus; talents scale
  exposureMult: 0.4,   // pinned ranged unit "drew a dagger" — fraction of its attack
  holdPer: 2,          // attackers ONE frontliner pins; the rest overflow to the backline
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
  return Math.max(4, Math.round(base + (u.dex - 10) * 0.3)); // raw mobility stat comes later
}
export function canBypass(u: CombatUnit): boolean {
  return u.class === "assassin"; // + Slip Away / flanker talents later
}

const allySide = (u: CombatUnit) => !u.isEnemy;
const clamp = (x: number) => Math.max(POS.fieldMin, Math.min(POS.fieldMax, x));
const px = (u: CombatUnit) => u.x ?? 0;
const gap = (a: CombatUnit, b: CombatUnit) => Math.abs(px(a) - px(b));
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

/** Reposition everyone: melee advance (stopped by engagement), ranged kite. */
export function movePhase(ctx: CombatContext): void {
  const units = living(ctx);
  const held = computeHolds(ctx);
  for (const u of units) {
    if (u.canAct === false) continue; // walls / ritualists hold position
    const foes = foesOf(u, ctx);
    if (!foes.length) continue;
    const mob = mobilityOf(u);

    if (isRanged(u)) {
      const pinned = foes.some((f) => !isRanged(f) && gap(u, f) <= POS.contact);
      const pressed = foes.some((f) => !isRanged(f) && gap(u, f) <= POS.contact * 1.4);
      if (pressed && !pinned) u.x = clamp(px(u) + (allySide(u) ? -1 : 1) * mob); // kite (pinned = locked)
      continue;
    }

    // Melee. Commit an intent ONCE (no per-round flip-flop): bypassers and
    // overflow (beyond the front's hold capacity) BREAK THROUGH to the backline;
    // everyone else holds the FRONT line.
    if (u.breakthrough === undefined) u.breakthrough = canBypass(u) || !held.has(u.id);

    if (u.breakthrough) {
      // Push toward the enemy backline and stay committed; flank just past.
      const target = foes.slice().sort((a, b) => backlineScore(b, u) - backlineScore(a, u))[0];
      const dir = px(target) > px(u) ? 1 : -1;
      const stop = px(target) + dir * 2;
      let destX = px(u) + dir * mob;
      destX = dir > 0 ? Math.min(destX, stop) : Math.max(destX, stop);
      u.x = clamp(destX);
    } else {
      // Frontline: hold the moment an enemy is in contact — never chase a foe
      // that has slipped past. Otherwise close to the line.
      const engaged = foes.some((f) => !isRanged(f) && gap(u, f) <= POS.contact);
      if (!engaged) {
        const ahead = foes.filter((f) => (allySide(u) ? px(f) >= px(u) : px(f) <= px(u)));
        const target = nearest(u, ahead.length ? ahead : foes);
        const dir = px(target) > px(u) ? 1 : -1;
        const stopX = px(target) - dir * POS.contact;
        let destX = px(u) + dir * mob;
        destX = dir > 0 ? Math.min(destX, stopX) : Math.max(destX, stopX);
        u.x = clamp(destX);
      }
    }
  }
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
