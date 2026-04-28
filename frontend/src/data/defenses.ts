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

/** Recruitment costs — citizen takes the role; gold pays for wages + training.
 *  Gear quality is implicit in barracks/tower level (which already cost iron
 *  to upgrade). Keeping recruit cost gold-only avoids soft-locking the
 *  Baptism of Fire quest, which fires before the player can build an iron
 *  mine. */
export const SOLDIER_COST = { gold: 15 };
export const ARCHER_COST = { gold: 20 };

// ─── Slot caps ────────────────────────────────────────────────────

/** Max soldiers across all undamaged barracks (3 per barracks level). */
export function maxSoldiers(state: GameState): number {
  return state.barracks
    .filter((b) => !b.damaged)
    .reduce((sum, b) => sum + b.level * 3, 0);
}

/** Max archers across all undamaged watchtowers (1 per tower level). */
export function maxArchers(state: GameState): number {
  return state.watchtowers
    .filter((t) => !t.damaged)
    .reduce((sum, t) => sum + t.level, 0);
}

/** Available citizens to take a soldier/archer slot — population minus already-stationed. */
export function availableCitizens(state: GameState): number {
  return Math.max(0, Math.floor(state.population) - state.soldiers - state.archers);
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
