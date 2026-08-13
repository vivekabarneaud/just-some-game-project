// ─── Foraging — the woods' stock, and the scene built from it ───────────────
// The rate limit lives in the WORLD, not in a counter: you may walk into the
// woods as often as you like, but you already picked everything and it has not
// grown back. No charges, no daily reset, no expiry, so no guilt.
// See docs/DESIGN_FORAGING_MINIGAME.md §3a.

import type { Season } from "../../gameState.js";
import { FORAGE_PLANTS, getForagePlant } from "./plants.js";
import type { PlacedPlant, TerrainId, WoodsStock } from "./types.js";

// ── The woods' stock: slots, filled by lottery ──────────────────────────────
// The wood holds a number of SLOTS. Every free slot is filled by a weighted
// draw, so a plant's `weight` is not a quantity but a likelihood.
//
// This replaced a per-plant cap, and the reason is worth keeping: a cap of 4
// means a full autumn has exactly four cepes, always, forever. There is no such
// thing as a bad year, and no such thing as a lucky morning. A weight of 3 means
// usually two or three, sometimes four, and sometimes NONE, which is what a wood
// is actually like. See §3c of the design doc.

/** How many things the wood holds when it is full. One number a season instead
 *  of a cap for every plant — and it is also the honest way to say that winter
 *  is bare, rather than by writing twenty small numbers. */
export const SEASON_CAPACITY: Record<Season, number> = {
  spring: 60,
  summer: 75,
  autumn: 85,
  winter: 8,
};

/** How long an empty wood takes to fill back up, in hours. Must be short enough
 *  that going away for a few days genuinely gives you a full wood back, which is
 *  the promise the whole no-tickets model rests on. */
const FILL_HOURS = 60;

/** Fraction of an OUT-OF-SEASON plant's stock lost each hour.
 *
 *  Seasons used to snap: the moment a plant left season its stock was forced to
 *  0. That was right about the state and wrong about the world. At 0.15/h a full
 *  patch is thin by the end of the first day of the new season and finished
 *  during the second, so there are late ramsons in early summer, tattier and
 *  thinning, and then there aren't. The freed slots are taken by whatever is in
 *  season now, so spring doesn't end so much as get replaced, plant by plant.
 *
 *  The safety property the snap protected SURVIVES: out-of-season stock only
 *  ever decreases, so it still converges to zero on its own and cannot go stale.
 *  Do not "simplify" this back into a hard reset. */
const OFF_SEASON_FADE = 0.15;

/** This plant's share of the draw this season. 0 = it isn't growing. */
export function seasonWeight(plantId: string, season: Season): number {
  return getForagePlant(plantId)?.weight[season] ?? 0;
}

/** Everything currently in season, with its weight. */
function inSeason(season: Season): { id: string; weight: number; clump: number }[] {
  const out: { id: string; weight: number; clump: number }[] = [];
  for (const p of FORAGE_PLANTS) {
    const w = p.weight[season] ?? 0;
    if (w > 0) out.push({ id: p.id, weight: w, clump: Math.max(1, p.clump ?? 1) });
  }
  return out;
}

const totalStock = (stock: WoodsStock) =>
  Object.values(stock).reduce((a, b) => a + b, 0);

/** One weighted draw. Returns null only if nothing grows this season at all. */
function drawPlant(pool: { id: string; weight: number }[], rand: () => number): string | null {
  const total = pool.reduce((a, p) => a + p.weight, 0);
  if (total <= 0) return null;
  let r = rand() * total;
  for (const p of pool) {
    r -= p.weight;
    if (r <= 0) return p.id;
  }
  return pool[pool.length - 1].id;
}

/** Fill `slots` free slots by drawing, a clump at a time. Most things fruit in
 *  company — you find a patch of chanterelles, not a chanterelle — so a draw
 *  places a whole troop, which is also why two full woods look different rather
 *  than merely being shuffled. */
function fill(
  stock: WoodsStock, season: Season, slots: number, rand: () => number,
  poolOverride?: { id: string; weight: number; clump: number }[],
): void {
  const pool = poolOverride ?? inSeason(season);
  if (!pool.length) return;
  let left = slots;
  let guard = 0;
  while (left >= 1 && guard++ < 500) {
    const pick = drawPlant(pool, rand);
    if (!pick) return;
    const clump = pool.find((p) => p.id === pick)!.clump;
    const n = Math.min(left, 1 + Math.floor(rand() * clump));
    stock[pick] = (stock[pick] ?? 0) + n;
    left -= n;
  }
}

/** A fresh, untouched wood: slots filled from nothing. Takes a seed because the
 *  composition is a roll of the dice, not a table — two full autumns are not the
 *  same autumn. */
export function fullStock(season: Season, seed = 1): WoodsStock {
  const stock: WoodsStock = {};
  for (const p of FORAGE_PLANTS) stock[p.id] = 0;
  fill(stock, season, SEASON_CAPACITY[season], rng(seed));
  return stock;
}

/** Advance the woods by `hours`: things fade, and free slots are drawn again.
 *
 *  Decay's whole job is CHURN, not scarcity. The wood stays full when left
 *  alone (fill outpaces fade by design), but what fills it keeps being re-rolled,
 *  so a wood you haven't visited for a week is full AND different. Scarcity comes
 *  from a plant's weight, never from a ceiling. */
export function advance(stock: WoodsStock, season: Season, hours: number, seed = 1): WoodsStock {
  const next: WoodsStock = {};
  for (const p of FORAGE_PLANTS) {
    const have = stock[p.id] ?? 0;
    if (have <= 0) { next[p.id] = 0; continue; }
    const out = (p.weight[season] ?? 0) > 0
      ? have * Math.exp(-(p.decay ?? 0) * hours)          // in season: it churns
      : have * Math.pow(1 - OFF_SEASON_FADE, hours);      // out of season: it goes
    // Exponentials never quite reach zero, and a wood haunted by 0.003 of a
    // ramson would keep a slot occupied forever.
    next[p.id] = out < 0.05 ? 0 : out;
  }

  const capacity = SEASON_CAPACITY[season];
  const free = capacity - totalStock(next);
  if (free > 0) {
    const growth = Math.min(free, (capacity / FILL_HOURS) * hours);
    fill(next, season, growth, rng(seed));
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
export function rain(stock: WoodsStock, season: Season, seed = 1): WoodsStock {
  const next: WoodsStock = { ...stock };
  const pool = FORAGE_PLANTS
    .filter((p) => (p.weight[season] ?? 0) > 0 && p.rainFlush)
    .map((p) => ({ id: p.id, weight: (p.weight[season] ?? 0) * p.rainFlush!, clump: Math.max(1, p.clump ?? 1) }));
  if (!pool.length) return next;

  // Weighted by weight x rainFlush, so rain doesn't merely add more of
  // everything — it favours the things that actually answer rain. A wet autumn
  // is a MUSHROOM autumn.
  const room = SEASON_CAPACITY[season] * RAIN_CEILING - Object.values(next).reduce((a, b) => a + b, 0);
  if (room <= 0) return next;
  fill(next, season, Math.min(room, SEASON_CAPACITY[season] * 0.35), rng(seed), pool);
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
  /** Spots the artist painted on the SCENE mask, in scene percent, each naming
   *  what grows there. Fruit hangs on bushes that are part of the painting, so
   *  these are the only places an `anchored` plant can appear. */
  anchors?: { plantId: string; x: number; y: number }[];
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
    if (seasonWeight(p.id, season) <= 0) continue;
    if (p.anchored) continue;
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
  // ── Anchored plants: fruit on the bushes painted into the scene ─────────
  // The bush is part of the picture, so these are simply the points the artist
  // marked. Stock decides how many of them bear anything, which is what makes a
  // picked-over bush read as picked over.
  if (opts.anchors?.length) {
    for (const p of FORAGE_PLANTS) {
      if (!p.anchored || seasonWeight(p.id, season) <= 0) continue;
      let left = Math.floor(stock[p.id] ?? 0);
      if (left <= 0) continue;

      const mine = opts.anchors.filter((a) => a.plantId === p.id);
      // Shuffled, so a half-picked bush thins out unevenly rather than always
      // emptying from the same end.
      const order = mine.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }

      const variants = getForagePlant(p.id)?.artVariants ?? 0;
      for (const idx of order) {
        if (left <= 0) break;
        const a = mine[idx];
        left--;
        placed.push({
          key: `${p.id}-anchor-${idx}`,
          plantId: p.id,
          x: a.x, y: a.y,
          sortY: a.y,
          anchor: true,
          depth: a.y / 100,
          variant: variants > 0 ? 1 + Math.floor(rand() * variants) : 1,
          flip: rand() < 0.5,
          scale: (() => {
            const [lo, hi] = getForagePlant(p.id)?.size ?? DEFAULT_SIZE;
            return (lo + rand() * (hi - lo)) * depthAt(a.y);
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
