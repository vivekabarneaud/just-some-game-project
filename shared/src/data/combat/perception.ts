// ─── Perception: what a creature can actually assess ────────────────────────
// See docs/design/combat/TARGETING.md. Until now `choose()` received the full
// target array with exact positions, HP and armour — perfect information, which
// no smoke bomb can work against. This is the filter that runs in FRONT of the
// scorer, and four backlog items need it: the assassin's Smoke Bomb and Vanish,
// the puffball as an area-effect carrier, and Blind in the snake/marsh design.
//
// It models VISIBILITY, not uncertainty. Visibility is a filter on the
// candidate pool: one predicate, legible in the log, composes with everything.
// Uncertainty (jittered positions, fuzzy HP) is expensive and unreadable —
// neither the player nor the author could tell what happened or why.

import type { CombatContext, CombatUnit } from "./types.js";
import { inReach, paceGap } from "./positional.js";
import { POS } from "./positional.js";

/** Contact reveals: you can hear, smell and feel what is on top of you, whether
 *  or not you can see it. This is what stops concealment being absolute, and
 *  what gives a blinded creature something to swing at. */
function inContact(a: CombatUnit, t: CombatUnit): boolean {
  if (a.x == null || t.x == null) return true; // position-less sims: everything is "here"
  return paceGap(a, t) <= POS.contact;
}

/**
 * Can `attacker` assess `target` at all?
 *
 * TWO FLAGS, because the asymmetry is real and it is the whole reason the
 * design works:
 *   - `target.concealed`  — nobody sees THEM (invisibility, or standing in smoke)
 *   - `attacker.blinded`  — THEY see nothing (a blinding effect, or standing in smoke)
 *
 * So the three sources compose without special cases:
 *   invisibility (Vanish, a spell) stamps `concealed` only — the invisible one
 *     still sees everyone, which is the point of it.
 *   smoke stamps BOTH on everyone inside — it blocks sight in both directions
 *     (design decision), which makes it a tactical object for breaking contact
 *     rather than a defensive buff.
 *   Blind stamps `blinded` only — you are hidden from nobody, you simply cannot
 *     pick a target beyond arm's reach.
 */
export function perceivable(attacker: CombatUnit, target: CombatUnit): boolean {
  if (inContact(attacker, target)) return true;
  return !attacker.blinded && !target.concealed;
}

/** The candidates this attacker can assess. Falls back to NOTHING rather than
 *  to everyone: a creature that can perceive no one holds (choose() returns
 *  null and basicAttack simply does not swing). That is the honest outcome —
 *  the alternative silently defeats every concealment effect. */
export function perceive(attacker: CombatUnit, candidates: CombatUnit[]): CombatUnit[] {
  return candidates.filter((t) => perceivable(attacker, t));
}

/** Anyone at all hidden right now? Lets callers skip the filter entirely in the
 *  overwhelmingly common case where nothing is concealed or blinded. */
export function anyConcealment(ctx: CombatContext): boolean {
  for (const u of [...ctx.adventurers, ...ctx.enemies]) {
    if (u.concealed || u.blinded) return true;
  }
  return false;
}

// ── Sources ────────────────────────────────────────────────────────────────
//
// v1 LIMIT, deliberate: concealment is a per-unit flag, so smoke conceals
// whoever STANDS IN IT. A cloud thrown between two units who are both outside
// it does not block their sightline. Every v1 use is "the concealed unit is
// inside the cloud" (Smoke Bomb is thrown at your own feet to break contact;
// the puffball is an area effect), so the geometry can wait until something
// actually throws smoke at a distance. When it does, this is the file.

/** A smoke cloud: an x-range of the field nobody sees into or out of. */
export interface SmokeCloud { from: number; to: number; rounds: number }

/** Stamp concealment from active smoke clouds. Idempotent — safe to call once
 *  per round, following the same "stamp flags, consumers read them" pattern as
 *  applyMissionModifiers. Only clears what IT owns: a unit made invisible by
 *  Vanish keeps its `concealed` flag when it steps out of the smoke. */
export function applySmoke(ctx: CombatContext): void {
  const clouds = ctx.smoke?.filter((c) => c.rounds > 0) ?? [];
  for (const u of [...ctx.adventurers, ...ctx.enemies]) {
    if (u.smoked) { u.smoked = false; u.concealed = u.invisible ?? false; u.blinded = false; }
    if (u.x == null || clouds.length === 0) continue;
    if (clouds.some((c) => u.x! >= c.from && u.x! <= c.to)) {
      u.smoked = true;
      u.concealed = true;  // nobody sees in
      u.blinded = true;    // and you cannot see out
    }
  }
}
