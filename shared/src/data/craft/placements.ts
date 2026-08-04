// ─── Shared cooking-style primitives (alchemy brew + kitchen cook) ──────────
// Both engines take a list of {ingredientId, technique} placements and turn
// stacked amounts into capped boons. These two primitives were identical across
// them (down to the diminish weights), so they live here once and each engine
// re-exports its own named cap (MAX_PER_PLANT / MAX_PER_INGREDIENT) on top.

/** A placement is an ingredient prepared a certain way. Both the alchemy
 *  Placement and the kitchen CookPlacement structurally satisfy this. */
export interface CraftPlacement {
  ingredientId: string;
  technique: string;
}

/** Most of one (ingredient, technique) that counts in a single craft. The
 *  diminish weights below run out at 5, so a 6th dose adds almost nothing —
 *  this bounds the "dump the whole pantry" combo and stops it burning stock.
 *  Breadth (several DIFFERENT ingredients) stays unbounded by design. */
export const MAX_PER_PLACEMENT = 5;

/** Diminishing returns on stacking the same channel — the biggest counts full,
 *  each further one counts less, with a flat 0.1 tail past the 5th. Sorted by
 *  MAGNITUDE so a strong negative (an alchemy downside) still leads; for the
 *  all-positive kitchen values this is identical to a plain descending sort. */
export function diminish(amounts: number[]): number {
  const sorted = [...amounts].sort((a, b) => Math.abs(b) - Math.abs(a));
  const weights = [1, 0.6, 0.4, 0.25, 0.15];
  return sorted.reduce((sum, a, i) => sum + a * (weights[i] ?? 0.1), 0);
}

/** Trim a placement list to at most `max` of each (ingredientId, technique),
 *  dropping empties. Authoritative: every engine path runs through it, so no
 *  caller (lab, kitchen, combat, co-op) can over-stack a single ingredient. */
export function clampPlacements<T extends CraftPlacement>(
  placements: T[],
  max: number = MAX_PER_PLACEMENT,
): T[] {
  const seen = new Map<string, number>();
  const out: T[] = [];
  for (const p of placements) {
    if (!p.ingredientId) continue;
    const k = `${p.ingredientId}:${p.technique}`;
    const n = seen.get(k) ?? 0;
    if (n >= max) continue;
    seen.set(k, n + 1);
    out.push(p);
  }
  return out;
}
