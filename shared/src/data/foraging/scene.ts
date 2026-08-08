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

/** Keep sprites off the very edges, where a feathered painting falls away. */
const MARGIN = 8;
/** Minimum gap between two CLUMPS, so separate finds stay separate. */
const MIN_GAP = 11;
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
}

export function buildScene(stock: WoodsStock, season: Season, seed: number, opts: SceneOptions = {}): PlacedPlant[] {
  const { maxSprites = 22, terrainAt } = opts;
  const rand = rng(seed);

  /** Is this a spot the given plant would actually grow? */
  const suits = (plantId: string, x: number, y: number) => {
    if (!terrainAt) return true;
    const ground = terrainAt(x, y);
    if (ground == null) return false;                        // rock, water, blocked
    const wants = getForagePlant(plantId)?.grows;
    return !wants || wants.includes(ground);
  };

  // Spend each plant's stock as clumps rather than singles.
  const clumps: { plantId: string; count: number }[] = [];
  for (const p of FORAGE_PLANTS) {
    if (seasonCap(p.id, season) <= 0) continue;
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
      if (placed.some((q) => Math.hypot(q.x - ax, q.y - ay) < MIN_GAP)) continue;
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
        variant: variants > 0 ? 1 + Math.floor(rand() * variants) : 1,
        flip: rand() < 0.5,
        scale: 0.85 + rand() * 0.4,
        rotate: (rand() - 0.5) * 34,
        brightness: 0.9 + rand() * 0.22,
        saturate: 0.88 + rand() * 0.3,
      });
    }
  }
  return placed;
}
