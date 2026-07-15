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
// ── Per-crop water DEMAND — scales with how much is actually growing. Crops
// drink this much every hour; rain covers it in kind years, the reserve
// (well + cistern) covers the shortfall in dry ones. Displayed as whole units.
export const ANIMAL_WATER_PER_HEAD = 1;    // per head
export const ORCHARD_WATER_PER_TREE = 2;   // per bearing tree/vine
export const FIELD_WATER_PER_LEVEL = 4;    // a field is acreage — thirsty
const GARDEN_WATER_PER_PLANT: Record<string, number> = {
  lavender: 0.5,     // likes it dry
  squash: 1.2,       // thirsty
  strawberries: 1.2,
};
export function gardenWaterPerPlant(veggieId: string): number {
  return GARDEN_WATER_PER_PLANT[veggieId] ?? 1;
}
export function gardenWaterDemand(veggieId: string, plants: number): number {
  return Math.round(gardenWaterPerPlant(veggieId) * Math.max(0, plants));
}
export function fieldWaterDemand(level: number): number {
  return FIELD_WATER_PER_LEVEL * Math.max(0, level);
}
export function orchardWaterDemand(matureTrees: number): number {
  return ORCHARD_WATER_PER_TREE * Math.max(0, matureTrees);
}
export function penWaterDemand(count: number): number {
  return ANIMAL_WATER_PER_HEAD * Math.max(0, count);
}

/** Fraction of a crop's water need that natural rainfall covers this year. The
 *  rest is a deficit the reserve/irrigation must make up, or the crop goes
 *  thirsty and its yield drops to this fraction. Kind years = fully rain-fed. */
export function naturalRainCoverage(band: ClimateBand): number {
  switch (band) {
    case "deluge": case "wet": case "normal": return 1;
    case "dry": return 0.5;
    case "drought": return 0.2;
  }
}

/** Water a drainage works banks from runoff in a wet year, water/hour per level. */
export function getDrainageBank(level: number): number {
  return level <= 0 ? 0 : level * 5;
}
