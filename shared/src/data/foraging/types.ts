// ─── Foraging — types ───────────────────────────────────────────────────────
// The cozy downtime valve: walk into the woods, search a painting, fill a
// basket. See docs/DESIGN_FORAGING_MINIGAME.md.
//
// Two rules from that design shape everything here:
//
//  1. NO LABELS EVER IN THE SCENE. A plant is a picture, nothing else. Any name
//     on a sprite kills the mechanic outright — the player would simply stop
//     clicking anything marked. Names exist only in the BASKET (after the fact,
//     when Edda goes through it) and in the herbier.
//
//  2. NO FAIL STATE. Misidentifying costs a basket slot and teaches you what
//     the thing actually was. It never costs health or resources.

import type { Season } from "../../gameState.js";

/** A thing that can be found in the woods. Decoys are plants too — the whole
 *  point is that you can't tell from the id, only from looking. */
export interface ForagePlant {
  id: string;
  /** Shown in the basket and the herbier. NEVER rendered in the scene. */
  name: string;
  icon: string;
  /** Sprite art. Falls back to the icon while the paintings are being made. */
  art?: string;
  /** What lands in the larder when picked. `null` = a decoy: it looked like
   *  something, it wasn't, and it goes in the bin with a line from Edda. */
  yields: string | null;
  /** For a decoy (or a dangerous plant), the plant it is mistaken for. Drives
   *  the herbier's "how to tell them apart" entry. */
  mimics?: string;
  /** What Edda says when she finds it in the basket. Player-facing. */
  note: string;
  /** Ceiling on how much of it the woods hold, per season. Absent or 0 means it
   *  doesn't grow then, so the scene generator won't place it at all. */
  cap: Partial<Record<Season, number>>;
  /** Stock regrown per game-hour. Berries bounce back in days; a King Bolete
   *  takes far longer. This is the whole rate-limit — see §3a of the design. */
  regrow: number;
}

/** One plant placed in a scene. Positions are percentages so the art can be
 *  swapped or re-cropped without touching anything. */
export interface PlacedPlant {
  /** Stable within a scene, so picking one doesn't reshuffle the rest. */
  key: string;
  plantId: string;
  x: number;
  y: number;
  /** Slight per-sprite variation so a patch doesn't look stamped. */
  scale: number;
  rotate: number;
}

/** How much of each plant the woods currently hold. Picking decrements it;
 *  regrowth ticks it back toward the seasonal cap. Deliberately NOT a list of
 *  persisted patches: per-patch state with individual respawn timers is the
 *  same class of bug that already bites the farm (fields holding live crops in
 *  winter), and a plain record of numbers cannot go stale. */
export type WoodsStock = Record<string, number>;
