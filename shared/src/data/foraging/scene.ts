// ─── Foraging — the woods' stock, and the scene built from it ───────────────
// The rate limit lives in the WORLD, not in a counter: you may walk into the
// woods as often as you like, but you already picked everything and it has not
// grown back. No charges, no daily reset, no expiry, so no guilt.
// See docs/DESIGN_FORAGING_MINIGAME.md §3a.

import type { Season } from "../../gameState.js";
import { FORAGE_PLANTS, getForagePlant } from "./plants.js";
import type { PlacedPlant, TerrainId, WoodsStock } from "./types.js";

/** What this plant's stock tops out at in this season (0 = doesn't grow now). */
export function seasonCap(plantId: string, season: Season): number {
  return getForagePlant(plantId)?.cap[season] ?? 0;
}

/** A fresh, untouched wood: everything at its seasonal ceiling. */
export function fullStock(season: Season): WoodsStock {
  const stock: WoodsStock = {};
  for (const p of FORAGE_PLANTS) stock[p.id] = seasonCap(p.id, season);
  return stock;
}

/** Regrow toward the seasonal cap. Called with elapsed game-hours.
 *  Pure: returns a new record rather than mutating.
 *
 *  Note it clamps to the CURRENT season's cap, so a season change needs no
 *  migration or reconciliation — autumn's mushrooms simply stop being topped up
 *  and drain away as they're picked, and winter's caps of 0 pull everything to
 *  nothing on their own. Nothing is remembered, so nothing can go stale. */
export function regrow(stock: WoodsStock, season: Season, hours: number): WoodsStock {
  const next: WoodsStock = {};
  for (const p of FORAGE_PLANTS) {
    const cap = seasonCap(p.id, season);
    const have = stock[p.id] ?? 0;
    next[p.id] = cap <= 0 ? Math.min(have, cap) : Math.min(cap, have + p.regrow * hours);
  }
  return next;
}

/** Take one. Floors at 0 — picking what isn't there is a no-op, not a negative. */
export function pick(stock: WoodsStock, plantId: string): WoodsStock {
  return { ...stock, [plantId]: Math.max(0, (stock[plantId] ?? 0) - 1) };
}

// ── Scene generation ────────────────────────────────────────────────────────

/** Deterministic PRNG (mulberry32). The scene must be STABLE: picking one plant
 *  must not reshuffle the others, and a re-render must not move anything. So
 *  the layout is a pure function of (seed, stock, season), never Math.random. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Used when a plant declares no size of its own. */
export const DEFAULT_SIZE: [number, number] = [0.8, 1.2];

/** Perspective squeeze: how much smaller a plant at the very top of the frame
 *  draws than one at the very bottom. Modest on purpose — the view is steep, so
 *  the distance range is small, and overdoing it looks like a diorama. */
export const DEPTH_MIN = 0.78;
export const DEPTH_MAX = 1.12;
const depthAt = (y: number) => DEPTH_MIN + (DEPTH_MAX - DEPTH_MIN) * (y / 100);

/** Do two plants' drawn size ranges overlap at all? For a pair that relies on
 *  size as its tell, the answer must be no — otherwise a big impostor can pass
 *  for a small real one, which is precisely the mistake that poisons people. */
export function sizeRangesOverlap(a: [number, number], b: [number, number]): boolean {
  // Compared at their DRAWN extremes: a plant at the bottom of the frame is
  // drawn larger than the same plant at the top, so the perspective squeeze has
  // to be folded in or a near dapperling could out-size a distant parasol.
  const lo = (r: [number, number]) => r[0] * DEPTH_MIN;
  const hi = (r: [number, number]) => r[1] * DEPTH_MAX;
  return lo(a) <= hi(b) && lo(b) <= hi(a);
}

/** Keep sprites off the very edges, where a feathered painting falls away. */
const MARGIN = 8;
/** Minimum gap between two CLUMPS, so separate finds stay separate. This is the
 *  FLOOR — big plants claim proportionally more room (see `clearanceBetween`),
 *  because 11% means nothing to a bramble that is forty percent of the frame. */
const MIN_GAP = 11;
/** Nominal sprite height, as a percentage of the scene, before a plant's own
 *  size range multiplies it. Only used to reason about how much room a plant
 *  takes up; the renderer's own value is passed in when it differs. */
const NOMINAL_SPRITE_H = 5;
/** How much two neighbours may overlap. Below 1 they interlace a little, which
 *  is what a real thicket does — the point is to stop a mushroom being swallowed
 *  whole by a bramble, not to keep everything in its own tidy circle. */
const OVERLAP_ALLOWANCE = 0.7;

/** Things grow upward, so nothing should lean far. A little keeps a scene from
 *  looking stamped — with only a handful of painted shapes per plant, perfectly
 *  aligned copies are obvious — but the bigger a thing is, the more a tilt reads
 *  as it falling over rather than as it having grown crooked. */
/** How much of a sprite's height sits ABOVE its position, matching the
 *  renderer's transform. A plant stands on its spot rather than hovering
 *  centred over it, and host spots must be resolved against the same anchor. */
export const ANCHOR_Y = 0.88;

const TILT_BASE = 6;
const TILT_MIN = 1.5;
const TILT_MAX = 6;
/** How tightly the members of one clump sit together. */
const CLUMP_RADIUS = 7;
/** Minimum gap WITHIN a clump — close enough to read as a troop, far enough
 *  that each one is still its own clickable thing. */
const INTRA_GAP = 3.2;

/** A good rain is what turns a quiet wood into a flush. It is the one event
 *  allowed to push stock past its usual ceiling, so a wet autumn is genuinely
 *  richer than a dry one rather than merely refilling faster. */
const RAIN_CEILING = 1.6;
export function rain(stock: WoodsStock, season: Season): WoodsStock {
  const next: WoodsStock = { ...stock };
  for (const p of FORAGE_PLANTS) {
    const cap = seasonCap(p.id, season);
    if (cap <= 0 || !p.rainFlush) continue;
    next[p.id] = Math.min(cap * RAIN_CEILING, (stock[p.id] ?? 0) + p.rainFlush);
  }
  return next;
}

/** Lay out what's currently growing. Most things fruit in company rather than
 *  one at a time — chanterelles come in troops, ramsons carpets a bank — so
 *  stock is spent in CLUMPS, not scattered evenly. A picked-over wood is
 *  visibly thin, which is the feedback the whole rate limit rests on. */
export interface SceneOptions {
  maxSprites?: number;
  /** Reads the scene's painted mask at a point (percentages). Returns null for
   *  blocked ground. Supplied by the frontend, which owns the pixels — this
   *  module stays pure and deterministic so it can be tested without a canvas. */
  terrainAt?: (x: number, y: number) => TerrainId | null;
  /** The berry spots painted on a host sprite, in its own 0..1 space. Supplied
   *  by the frontend, which reads them off the host's mask. Without it, hosted
   *  plants simply don't appear.
   *
   *  Coordinates rather than a count, deliberately: the generator has to know
   *  where a berry actually lands to keep it off other plants, and working that
   *  out at render time made the check impossible. */
  hostSpots?: (plantId: string, variant: number) => { sx: number; sy: number }[];
  /** The renderer's base sprite height, if it isn't the nominal 5%. */
  spriteHeightPct?: number;
}

export function buildScene(stock: WoodsStock, season: Season, seed: number, opts: SceneOptions = {}): PlacedPlant[] {
  const { maxSprites = 22, terrainAt, spriteHeightPct = NOMINAL_SPRITE_H } = opts;
  const rand = rng(seed);

  /** How far this plant may lean, in degrees. */
  const tiltFor = (plantId: string) => {
    const p = getForagePlant(plantId);
    if (p?.tilt != null) return p.tilt;
    const [lo, hi] = p?.size ?? DEFAULT_SIZE;
    const avg = (lo + hi) / 2;
    return Math.min(TILT_MAX, Math.max(TILT_MIN, TILT_BASE / Math.sqrt(avg)));
  };

  /** Roughly how wide a plant of this kind draws, in scene percent. */
  const halfSpan = (plantId: string) => {
    const [lo, hi] = getForagePlant(plantId)?.size ?? DEFAULT_SIZE;
    return ((lo + hi) / 2) * spriteHeightPct * 0.5;
  };
  /** How far apart two things of these kinds must sit. Scales with what they
   *  are, so brambles keep their distance from each other while mushrooms carry
   *  on clustering as before. */
  const clearanceBetween = (a: string, b: string) =>
    Math.max(MIN_GAP, (halfSpan(a) + halfSpan(b)) * OVERLAP_ALLOWANCE);

  /** Is this a spot the given plant would actually grow? */
  const suits = (plantId: string, x: number, y: number) => {
    if (!terrainAt) return true;
    const ground = terrainAt(x, y);
    if (ground == null) return false;                        // rock, water, blocked
    const wants = getForagePlant(plantId)?.grows;
    return !wants || wants.includes(ground);
  };

  // Spend each plant's stock as clumps rather than singles. Hosted plants are
  // held back — they can only be placed once their hosts are down.
  const clumps: { plantId: string; count: number }[] = [];
  for (const p of FORAGE_PLANTS) {
    if (seasonCap(p.id, season) <= 0) continue;
    if (p.host) continue;
    let left = Math.floor(stock[p.id] ?? 0);
    const most = Math.max(1, p.clump ?? 1);
    while (left > 0) {
      const n = Math.min(left, 1 + Math.floor(rand() * most));
      clumps.push({ plantId: p.id, count: n });
      left -= n;
    }
  }
  // Shuffle so a crowded wood doesn't systematically favour whatever is
  // declared first once maxSprites bites.
  for (let i = clumps.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [clumps[i], clumps[j]] = [clumps[j], clumps[i]];
  }
  // ...then float scenery to the front. A bramble is the structure of a scene
  // and carries the fruit; losing one to the sprite cap costs far more than
  // losing a mushroom, and two of three were being dropped exactly that way.
  clumps.sort((a, b) => Number(!!getForagePlant(b.plantId)?.scenery) - Number(!!getForagePlant(a.plantId)?.scenery));

  const placed: PlacedPlant[] = [];
  for (const { plantId, count } of clumps) {
    if (placed.length >= maxSprites) break;

    // Anchor the clump somewhere clear, on ground the plant accepts.
    let ax = 0, ay = 0, anchored = false;
    for (let attempt = 0; attempt < 60 && !anchored; attempt++) {
      ax = MARGIN + rand() * (100 - MARGIN * 2);
      ay = MARGIN + rand() * (100 - MARGIN * 2);
      if (placed.some((q) => Math.hypot(q.x - ax, q.y - ay) < clearanceBetween(plantId, q.plantId))) continue;
      if (!suits(plantId, ax, ay)) continue;
      anchored = true;
    }
    if (!anchored) continue;

    const variants = getForagePlant(plantId)?.artVariants ?? 0;
    for (let k = 0; k < count && placed.length < maxSprites; k++) {
      // The first sits on the anchor; the rest gather round it.
      let x = ax, y = ay, ok = k === 0;
      for (let attempt = 0; attempt < 24 && !ok; attempt++) {
        const a = rand() * Math.PI * 2;
        const r = INTRA_GAP + rand() * (CLUMP_RADIUS - INTRA_GAP);
        x = Math.min(100 - MARGIN, Math.max(MARGIN, ax + Math.cos(a) * r));
        y = Math.min(100 - MARGIN, Math.max(MARGIN, ay + Math.sin(a) * r));
        if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < INTRA_GAP)) continue;
        if (!suits(plantId, x, y)) continue;
        ok = true;
      }
      if (!ok) continue;
      placed.push({
        key: `${plantId}-${placed.length}`,
        plantId,
        x, y,
        sortY: y,
        variant: variants > 0 ? 1 + Math.floor(rand() * variants) : 1,
        flip: rand() < 0.5,
        depth: y / 100,
        scale: (() => {
          const [lo, hi] = getForagePlant(plantId)?.size ?? DEFAULT_SIZE;
          return (lo + rand() * (hi - lo)) * depthAt(y);
        })(),
        rotate: (rand() - 0.5) * 2 * tiltFor(plantId),
        brightness: 0.9 + rand() * 0.22,
        saturate: 0.88 + rand() * 0.3,
      });
    }
  }
  // ── Hosted plants: fruit hung on whatever bushes went down ──────────────
  // Only where the artist painted a spot, so a berry never floats in the bush's
  // empty air, and never on a spot already taken or already occupied by
  // something else standing there.
  if (opts.hostSpots) {
    const taken = new Set<string>();
    for (const p of FORAGE_PLANTS) {
      if (!p.host || seasonCap(p.id, season) <= 0) continue;
      let left = Math.floor(stock[p.id] ?? 0);
      if (left <= 0) continue;

      // Every free spot on every host of the right kind, resolved to a real
      // position in the scene, then shuffled.
      const candidates: { hostKey: string; spot: number; x: number; y: number }[] = [];
      for (const host of placed) {
        if (host.plantId !== p.host) continue;
        const spots = opts.hostSpots(host.plantId, host.variant);
        const h = spriteHeightPct * host.scale;                            // drawn height, scene %
        const w = h * (getForagePlant(host.plantId)?.aspect ?? 1);
        const rad = (host.rotate * Math.PI) / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        spots.forEach((spot, i) => {
          const id = `${host.key}#${i}`;
          if (taken.has(id)) return;
          // A spot must follow its sprite through the SAME transforms the
          // renderer applies, or it points at the mirror image of where the
          // artist painted it — which is how berries ended up hanging in
          // mid-air beside a flipped bush.
          const sx = host.flip ? 1 - spot.sx : spot.sx;
          // The host is centred on x and anchored ANCHOR_Y of its height above
          // y, which is also the point it rotates about.
          const dx = -w / 2 + sx * w;
          const dy = -ANCHOR_Y * h + spot.sy * h;
          candidates.push({
            hostKey: host.key, spot: i,
            x: host.x + dx * cos - dy * sin,
            y: host.y + dx * sin + dy * cos,
          });
        });
      }
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }

      const variants = getForagePlant(p.id)?.artVariants ?? 0;
      for (const c of candidates) {
        if (left <= 0) break;
        // Off the edge of the picture, or sitting on something that isn't its
        // own bush: a berry perched on a mushroom looks like fruit growing out
        // of a toadstool.
        if (c.x < 2 || c.x > 98 || c.y < 2 || c.y > 98) continue;
        const clash = placed.some((q) =>
          q.key !== c.hostKey &&
          getForagePlant(q.plantId)?.host !== p.host &&   // its siblings may crowd
          Math.hypot(q.x - c.x, q.y - c.y) < clearanceBetween(p.id, q.plantId) * 0.6);
        if (clash) continue;

        taken.add(`${c.hostKey}#${c.spot}`);
        left--;
        const host = placed.find((q) => q.key === c.hostKey)!;
        placed.push({
          key: `${p.id}-${c.hostKey}-${c.spot}`,
          plantId: p.id,
          x: c.x, y: c.y,
          // Sorts with its bush: a berry hanging high would otherwise read as
          // far away and disappear behind the very leaves it grows on.
          sortY: host.y,
          attach: { hostKey: c.hostKey, spot: c.spot },
          // Fruit shares its bush's distance, so it hazes and lights with it.
          depth: host.depth,
          variant: variants > 0 ? 1 + Math.floor(rand() * variants) : 1,
          flip: rand() < 0.5,
          scale: (() => {
            const [lo, hi] = getForagePlant(p.id)?.size ?? DEFAULT_SIZE;
            return (lo + rand() * (hi - lo)) * depthAt(host.y);
          })(),
          rotate: (rand() - 0.5) * 2 * tiltFor(p.id),
          brightness: 0.9 + rand() * 0.22,
          saturate: 0.88 + rand() * 0.3,
        });
      }
    }
  }

  return placed;
}
