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

/** Where a plant is willing to grow. A scene may carry a painted MASK saying
 *  which patches of its ground are which, so mushrooms cluster by trunks and
 *  fallen wood, greens take the open grass, and nothing sprouts out of a rock.
 *
 *  Painting convention (see the frontend's mask loader): three pure brush
 *  colours over the background, classified by dominant channel so a soft brush
 *  edge still reads correctly.
 *    RED   → "wood"   (trunk bases, roots, fallen logs, rotting timber)
 *    GREEN → "grass"  (weedy clearing, low ground cover)
 *    BLUE  → "litter" (leaf litter, open bare earth)
 *  Anything left black or transparent is BLOCKED: rock, water, deep shadow.
 *  No mask at all means the whole frame is fair game. */
export type TerrainId = "wood" | "grass" | "litter";

/** A thing that can be found in the woods. Decoys are plants too — the whole
 *  point is that you can't tell from the id, only from looking. */
export interface ForagePlant {
  id: string;
  /** Shown in the basket and the herbier. NEVER rendered in the scene. */
  name: string;
  icon: string;
  /** How many numbered sprite variants exist for this plant, at
   *  `/images/foraging/plants/{id}{n}.png` with n starting at 1. Several per
   *  plant makes a patch look grown rather than stamped, and makes the scene
   *  harder to skim by shape alone. 0 or absent falls back to the emoji. */
  artVariants?: number;
  /** What lands in the larder when picked. `null` = a decoy: it looked like
   *  something, it wasn't, and it goes in the bin with a line from Edda. */
  yields: string | null;
  /** For a decoy (or a dangerous plant), the plant it is mistaken for. Drives
   *  the herbier's "how to tell them apart" entry. */
  mimics?: string;
  /** What Edda says when she finds it in the basket. Player-facing. */
  note: string;
  /** How big this plant stands, as a multiplier on the scene's base sprite
   *  height. A parasol towers; a dapperling squats. Mostly cosmetic — EXCEPT
   *  for the parasol pair, where size is the real-world tell and so is
   *  deliberately different. For every other lookalike pair the sizes MATCH, or
   *  the player could sort them by silhouette without ever looking properly. */
  size?: number;
  /** Most fungi and many wild plants fruit in company rather than one at a
   *  time: chanterelles come in troops, ramsons carpets a whole bank. The
   *  largest group this plant appears in (default 1 = always solitary). */
  clump?: number;
  /** Extra units a good rain brings, over and above the usual cap. Rain is what
   *  turns a quiet wood into a mushroom flush, and it's the one event that can
   *  push stock past its ceiling. 0 or absent = indifferent to weather. */
  rainFlush?: number;
  /** Ground this plant will grow on. Omitted = anywhere the mask allows.
   *  A decoy should share its mimic's terrain, or it would give itself away by
   *  standing somewhere the real thing never does. */
  grows?: TerrainId[];
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
  /** Which sprite variant to draw (1-based). Stable within a scene. */
  variant: number;
  /** Mirrored horizontally. Doubles the apparent set for free, and — more
   *  usefully — destroys any accidental correlation between a plant's identity
   *  and which way its painted variants happen to lean. If every chanterelle
   *  leaned left and every impostor right, the player would learn THAT instead
   *  of learning the ridges. At sprite size the flipped lighting is invisible. */
  flip: boolean;
  /** Slight per-sprite variation so a patch doesn't look stamped. */
  scale: number;
  rotate: number;
  /** Mild tonal jitter, so two of the same variant read as two individuals.
   *  Brightness and saturation only — deliberately NOT hue, because colour can
   *  be part of a tell and shifting it could turn one plant into another. */
  brightness: number;
  saturate: number;
}

/** How much of each plant the woods currently hold. Picking decrements it;
 *  regrowth ticks it back toward the seasonal cap. Deliberately NOT a list of
 *  persisted patches: per-patch state with individual respawn timers is the
 *  same class of bug that already bites the farm (fields holding live crops in
 *  winter), and a plain record of numbers cannot go stale. */
export type WoodsStock = Record<string, number>;
