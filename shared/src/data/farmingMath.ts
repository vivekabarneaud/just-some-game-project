// ─── Farming math helpers ───────────────────────────────────────
// Shared formulas used by fields, gardens, pens, hives, and orchards
// across both shared (livestock) and frontend (crops, gardens, apiary,
// orchards). One source of truth for tiered growth so cost and build-
// time curves stay aligned across the five domains.

/** Geometric growth: `floor(base * mult ** level)`. The shape every
 *  per-level cost and build-time helper across farming uses. */
export function growth(base: number, mult: number, level: number): number {
  return Math.floor(base * Math.pow(mult, level));
}
