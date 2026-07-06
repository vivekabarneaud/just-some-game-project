// ─── Tavern: hospitality mechanics ──────────────────────────────
// Phase 1 of the tavern rework (docs/DESIGN_TAVERN.md): rooms for travelers
// (passive gold), a menu (staples), and occupancy driven by settlement
// prosperity. Numbers here are deliberately placeholder — tune against real
// play. The building itself still runs the ale->happiness chain in gameState.

import { getSettlementTier, type SettlementTier } from "./buildings";

/** Rooms a tavern of this level offers. Exponential — settlement growth is
 *  exponential (endgame ~1000 citizens), so rooms can't creep linearly. Locked
 *  for L1-4 at 1 / 2 / 4 / 8; keeps doubling beyond as a placeholder until the
 *  population curve is tuned (see DESIGN_TAVERN.md). */
export function tavernRooms(level: number): number {
  if (level <= 0) return 0;
  return Math.pow(2, level - 1); // 1, 2, 4, 8, 16, ...
}

/** Cooked staples featured on the menu by default. Phase 2 lets the player add
 *  a few adventurer/culture dishes as extra featured slots. */
export const MENU_STAPLE_IDS = ["porridge", "hearth_stew", "river_stew"];

/** Gold per occupied room per game-day (placeholder). */
export const TAVERN_GOLD_PER_ROOM_PER_DAY = 5;

/** Per-tier occupancy bonus — a known, prosperous waystation draws more traffic. */
const TIER_OCCUPANCY_BONUS: Record<SettlementTier, number> = {
  camp: 0, village: 0.05, town: 0.1, city: 0.15,
};

/** Fraction of rooms filled by passing travelers (0..1). Placeholder formula:
 *  a floor, plus happiness, plus menu variety, plus settlement tier. */
export function calcTavernOccupancy(happiness: number, menuVariety: number, tier: SettlementTier): number {
  const base = 0.25;
  const fromHappiness = (Math.max(0, Math.min(100, happiness)) / 100) * 0.45;
  const fromMenu = Math.min(0.24, menuVariety * 0.08);
  const fromTier = TIER_OCCUPANCY_BONUS[tier] ?? 0;
  return Math.max(0, Math.min(1, base + fromHappiness + fromMenu + fromTier));
}

/** Convenience: occupancy from a town-hall level (resolves the tier). */
export function calcTavernOccupancyForTownHall(happiness: number, menuVariety: number, townHallLevel: number): number {
  return calcTavernOccupancy(happiness, menuVariety, getSettlementTier(townHallLevel));
}

/** Traveler gold per game-hour for a tavern at this level and occupancy. */
export function tavernTravelerGoldPerHour(level: number, occupancy: number): number {
  return (tavernRooms(level) * occupancy * TAVERN_GOLD_PER_ROOM_PER_DAY) / 24;
}
