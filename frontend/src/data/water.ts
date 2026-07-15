// ─── Water system (weather → yield, Layer 2) ────────────────────────────────
// Wells + rain-catching cisterns fill a `water` reserve; irrigation spends it in
// dry/drought years to keep crops alive; drainage sheds it in wet years. See
// docs/DESIGN_WEATHER_YIELD.md §5.

import type { ClimateBand } from "./climate";
import type { WeatherType } from "./weather";

// Building ids (defined in data/buildings.ts).
export const WELL_ID = "well";
export const CISTERN_ID = "cistern";
export const IRRIGATION_ID = "irrigation_works";
export const DRAINAGE_ID = "drainage_works";

/** A little water can be held even without a cistern (a few barrels). */
export const BASE_WATER_CAP = 40;

/** Well groundwater output, water/hour, before the drought penalty. */
export function getWellOutput(level: number): number {
  return level <= 0 ? 0 : level * 12;
}
/** Wells run low in dry years and nearly dry up in a drought. */
export function wellDroughtFactor(band: ClimateBand): number {
  if (band === "drought") return 0.3;
  if (band === "dry") return 0.6;
  return 1;
}

/** Cistern storage capacity added per level. */
export function getCisternCap(level: number): number {
  return level <= 0 ? 0 : level * 150;
}
/** Rain a cistern catches, water/hour, before the year's climate rain factor. */
export function getCisternRainCatch(level: number): number {
  return level <= 0 ? 0 : level * 9;
}
/** The cistern only catches water while it's ACTUALLY raining (or storming).
 *  Clear, overcast, fog and snow add nothing — 0. Multiplies the rain catch on
 *  top of the yearly climate factor, so a downpour in a wet year fills fast. */
export function ambientRainFactor(weather: WeatherType): number {
  switch (weather) {
    case "rain": case "storm": case "unnatural_storm": return 2.5;
    default: return 0;
  }
}

/** Total water the reserve can hold (base barrels + cisterns). */
export function getWaterCap(cisternLevel: number): number {
  return BASE_WATER_CAP + getCisternCap(cisternLevel);
}

// ── Per-crop water demand (water/hour, per active plot) under irrigation ──
// Fields drink the most; gardens less; drought-loving lavender barely any.
export const FIELD_WATER_NEED = 3;
export const ORCHARD_WATER_NEED = 2;   // per bearing grove
/** Livestock drink year-round, per head. Modest — a well covers a small flock. */
export const ANIMAL_WATER_PER_HEAD = 0.3;
const GARDEN_WATER_NEED: Record<string, number> = {
  lavender: 0.5,   // likes it dry
  squash: 2,       // thirsty
  strawberries: 2,
};
export function gardenWaterNeed(veggieId: string): number {
  return GARDEN_WATER_NEED[veggieId] ?? 1.5;
}

/** Water a drainage works banks from runoff in a wet year, water/hour per level. */
export function getDrainageBank(level: number): number {
  return level <= 0 ? 0 : level * 5;
}
