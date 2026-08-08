// ─── Foraging — the woods' stock, and the scene built from it ───────────────
// The rate limit lives in the WORLD, not in a counter: you may walk into the
// woods as often as you like, but you already picked everything and it has not
// grown back. No charges, no daily reset, no expiry, so no guilt.
// See docs/DESIGN_FORAGING_MINIGAME.md §3a.

import type { Season } from "../../gameState.js";
import { FORAGE_PLANTS, getForagePlant } from "./plants.js";
import type { PlacedPlant, WoodsStock } from "./types.js";

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
/** Minimum gap between two sprites, in percent, so nothing overlaps illegibly. */
const MIN_GAP = 9;

/** Lay out what's currently growing. One sprite per whole unit of stock, so a
 *  picked-over wood is visibly thin — that IS the feedback. Capped so a lush
 *  season doesn't produce an unreadable carpet. */
export function buildScene(stock: WoodsStock, season: Season, seed: number, maxSprites = 14): PlacedPlant[] {
  const rand = rng(seed);
  const pool: string[] = [];
  for (const p of FORAGE_PLANTS) {
    if (seasonCap(p.id, season) <= 0) continue;
    const n = Math.floor(stock[p.id] ?? 0);
    for (let i = 0; i < n; i++) pool.push(p.id);
  }
  // Shuffle so the cap doesn't systematically favour whatever is declared first.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const placed: PlacedPlant[] = [];
  for (const plantId of pool.slice(0, maxSprites)) {
    // Rejection-sample a spot that isn't on top of something else. Give up
    // after a few tries rather than looping forever in a crowded scene.
    let x = 0, y = 0, ok = false;
    for (let attempt = 0; attempt < 24 && !ok; attempt++) {
      x = MARGIN + rand() * (100 - MARGIN * 2);
      y = MARGIN + rand() * (100 - MARGIN * 2);
      ok = placed.every((q) => Math.hypot(q.x - x, q.y - y) >= MIN_GAP);
    }
    if (!ok) continue;
    placed.push({
      key: `${plantId}-${placed.length}`,
      plantId,
      x, y,
      scale: 0.85 + rand() * 0.4,
      rotate: (rand() - 0.5) * 24,
    });
  }
  return placed;
}
