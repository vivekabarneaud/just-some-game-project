// ─── Defenses helpers ─────────────────────────────────────────────
// Cost tables, slot-cap calculators, and ring-unlock rules for the
// multi-instance walls / watchtowers / barracks system.
// See docs/DESIGN_DEFENSES.md.

import type { SettlementTier } from "./buildings";
import type { DefenseRing, GameState } from "~/engine/gameState";

// ─── Costs (instant build/upgrade for v1; no construction queue) ──

/** Resource cost to build (level 0 → 1) or upgrade (level N → N+1) a wall. */
export function getWallCost(currentLevel: number): { wood: number; stone: number } {
  return { wood: 30 + 25 * currentLevel, stone: 25 + 20 * currentLevel };
}

export function getWatchtowerCost(currentLevel: number): { wood: number; stone: number } {
  return { wood: 25 + 20 * currentLevel, stone: 10 + 10 * currentLevel };
}

export function getBarracksCost(currentLevel: number): { wood: number; stone: number; iron: number } {
  return {
    wood: 35 + 25 * currentLevel,
    stone: 25 + 15 * currentLevel,
    iron: Math.max(1, currentLevel),
  };
}

/** Cost to repair a wall back to full HP (proportional to level). */
export function getWallRepairCost(level: number): { wood: number; stone: number } {
  return { wood: Math.ceil(15 * level), stone: Math.ceil(10 * level) };
}

/** Damage repair for towers/barracks — flat-ish, doesn't scale much. */
export function getDefensiveRepairCost(level: number): { wood: number; stone: number } {
  return { wood: 10 + 5 * level, stone: 5 + 5 * level };
}

/** Mage Tower build/upgrade cost (level N → N+1). Ramp matches the legacy
 *  building-list mage tower so existing players see the same numbers. */
export function getMageTowerCost(currentLevel: number): { wood: number; stone: number } {
  return { wood: 60 + 40 * currentLevel, stone: 100 + 60 * currentLevel };
}

// ─── Build times (game-seconds) ───────────────────────────────────
// Match the ramp the legacy buildings used: short for early levels,
// steeper as you climb. Mason's Guild discount applies on top via the
// upgrade action (existing applyMasonTimeReduction).

function rampedBuildTime(base: number, currentLevel: number): number {
  return Math.floor(base * Math.pow(1.5, currentLevel));
}

export function getWallBuildTime(currentLevel: number): number {
  return rampedBuildTime(25, currentLevel);
}
export function getWatchtowerBuildTime(currentLevel: number): number {
  return rampedBuildTime(32, currentLevel);
}
export function getBarracksBuildTime(currentLevel: number): number {
  return rampedBuildTime(30, currentLevel);
}
export function getMageTowerBuildTime(currentLevel: number): number {
  return rampedBuildTime(38, currentLevel);
}

/** Per-recruit gold cost. Cheap on purpose — late-game cities station
 *  hundreds of troops, so a 20g flat cost would price out scaling.
 *  Future: cost scales with the building's trained level when training lands. */
export const SOLDIER_COST = { gold: 5 };
export const ARCHER_COST = { gold: 5 };

// ─── Per-building capacity (garrison rework) ──────────────────────
// Quadratic-ish scaling so a city-tier (lvl 6) tower feels like a real
// garrison rather than a token squad. Curves are tuned so:
//   lvl 1 → ~4-5 (a frontier squad)
//   lvl 6 → ~54-60 (an actual castle wall garrison)
// Building level is itself capped by the town hall, so settlement tier
// gates the upper end.

/** Archer slots in one watchtower at this level. level² + 3·level. */
export function getWatchtowerArcherCap(level: number): number {
  if (level <= 0) return 0;
  return level * level + 3 * level; // 4 / 10 / 18 / 28 / 40 / 54 ...
}

/** Soldier slots in one barracks at this level. level² + 4·level (slightly
 *  more than archers — barracks have always had a higher density). */
export function getBarracksSoldierCap(level: number): number {
  if (level <= 0) return 0;
  return level * level + 4 * level; // 5 / 12 / 21 / 32 / 45 / 60 ...
}

/** Max soldiers across all undamaged barracks. Sum of per-building caps. */
export function maxSoldiers(state: GameState): number {
  return state.barracks
    .filter((b) => !b.damaged)
    .reduce((sum, b) => sum + getBarracksSoldierCap(b.level), 0);
}

/** Max archers across all undamaged watchtowers. Sum of per-building caps. */
export function maxArchers(state: GameState): number {
  return state.watchtowers
    .filter((t) => !t.damaged)
    .reduce((sum, t) => sum + getWatchtowerArcherCap(t.level), 0);
}

/** Citizens available to take a soldier/archer slot. The 5-founder carve-out
 *  is a placeholder until the per-category citizen rework (toddler/child/
 *  adult/elderly) lands — until then, founders are treated as the only
 *  non-recruitable pop. */
const FOUNDER_COUNT = 5;
export function availableCitizens(state: GameState): number {
  return Math.max(0, Math.floor(state.population) - FOUNDER_COUNT - state.soldiers - state.archers);
}

// ─── Training ─────────────────────────────────────────────────────
// Garrisons level collectively (one trainedLevel per garrison). Each level
// raises the squad's HP and attack stat. Building level caps the trained
// level — upgrade the tower/barracks before training higher.

/** Gold to train one level UP (current → current+1). Linear ramp; tunable.
 *  Free baseline at level 0 means "untrained recruits"; the first investment
 *  raises them to lvl 1. */
export function getTrainCost(targetLevel: number): { gold: number } {
  return { gold: 50 + 50 * Math.max(0, targetLevel - 1) };
}

/** Game-seconds to train one level UP. Mason's Guild discount does NOT apply
 *  here (purely military investment, not construction). */
export function getTrainTime(targetLevel: number): number {
  return Math.floor(60 * Math.pow(1.4, Math.max(0, targetLevel - 1)));
}

// ─── Migration ────────────────────────────────────────────────────

/** Spread a legacy global headcount across multiple ring buildings, outer
 *  first, capped at each building's per-level capacity. Used once at save-load
 *  time to convert pre-garrison-rework saves to the per-building model.
 *  Mutates the array in place. */
export function distributeLegacyGarrison<T extends { level: number; garrison: { count: number; trainedLevel: number } }>(
  buildings: T[],
  legacyTotal: number,
  capFor: (level: number) => number,
): void {
  if (!legacyTotal || legacyTotal <= 0) return;
  // Skip if any garrison already has units — assume migration already ran.
  if (buildings.some((b) => b.garrison.count > 0)) return;
  let remaining = legacyTotal;
  for (const b of buildings) {
    if (remaining <= 0) break;
    const cap = capFor(b.level);
    const take = Math.min(cap, remaining);
    b.garrison.count = take;
    remaining -= take;
  }
}

// ─── Ring unlocks ─────────────────────────────────────────────────

/** True if a given ring is buildable at the current settlement tier.
 *  Camp = Outer only; Village adds Middle; Town adds Inner. Rings unlock
 *  outer→inward so players never see a labelled "inner" ring without a
 *  "middle" ring between it and "outer". */
export function ringUnlocked(ring: DefenseRing, tier: SettlementTier): boolean {
  if (ring === "outer") return true;
  if (ring === "middle") return tier !== "camp";
  if (ring === "inner") return tier === "town" || tier === "city";
  return false;
}

/** Player-friendly label for the tier where a ring unlocks. */
export function ringUnlockTier(ring: DefenseRing): SettlementTier {
  if (ring === "outer") return "camp";
  if (ring === "middle") return "village";
  return "town"; // inner
}

// ─── Display ──────────────────────────────────────────────────────

export const RING_LABELS: Record<DefenseRing, string> = {
  outer: "Outer Ring",
  middle: "Middle Ring",
  inner: "Inner Ring",
};

export const RING_DESCRIPTIONS: Record<DefenseRing, string> = {
  outer: "First line of defense — faces the raid head-on.",
  middle: "Second line — buys time and absorbs breakthroughs.",
  inner: "The keep — last stand if outer rings fall.",
};
