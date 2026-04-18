/**
 * Seeded PRNG (mulberry32) for deterministic combat simulation.
 *
 * The simulation uses a module-scoped seed rather than passing a generator through
 * every call site. This keeps callees clean, but means combat is not re-entrant —
 * don't run two simulations concurrently in the same process with different seeds.
 *
 * When the seed is undefined, falls back to Math.random() for production combat.
 */

let _combatSeed: number | undefined;

export function setCombatSeed(seed: number | undefined): void {
  _combatSeed = seed;
}

export function combatRandom(): number {
  if (_combatSeed === undefined) return Math.random();
  _combatSeed |= 0;
  _combatSeed = (_combatSeed + 0x6d2b79f5) | 0;
  let t = Math.imul(_combatSeed ^ (_combatSeed >>> 15), 1 | _combatSeed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
