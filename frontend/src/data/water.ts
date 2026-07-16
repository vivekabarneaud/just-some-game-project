// ─── Water system (weather → yield, Layer 2) ────────────────────────────────
// A stream + wells + rain-catching cisterns fill a `water` reserve; crops draw
// it continuously via irrigation (paused when it rains), livestock and citizens
// drink from it. When it's short: citizens first, then livestock, then crops.
// See docs/DESIGN_WEATHER_YIELD.md §5.

import type { ClimateBand } from "./climate";
import type { WeatherType } from "./weather";
import type { Season } from "./seasons";

// Building ids (defined in data/buildings.ts).
export const WELL_ID = "well";
export const CISTERN_ID = "cistern";
export const IRRIGATION_ID = "irrigation_works";
export const DRAINAGE_ID = "drainage_works";

/** A little water is held even without a cistern (a few barrels) — the stream
 *  keeps it topped up, so a new settlement is never dry. */
export const BASE_WATER_CAP = 40;

// ── Passive sources (they FILL the reserve) ─────────────────────────────────

/** The stream is abundant but fickle. Its status drives BOTH its water yield
 *  and the fishing hut's catch (same low water, fewer fish). */
export type StreamStatus = "flowing" | "low" | "frozen" | "dry";
export const STREAM_YIELD = 20; // water/hour at full flow
export function streamStatus(band: ClimateBand, season: Season): StreamStatus {
  if (band === "drought") return "dry";       // drought stops it
  if (season === "winter") return "frozen";   // winter freezes it
  if (band === "dry" || season === "summer") return "low"; // summer/dry dip
  return "flowing";
}
/** Multiplier on the stream's water yield AND the fishing hut's catch. */
export function streamFactor(status: StreamStatus): number {
  switch (status) {
    case "flowing": return 1;
    case "low": return 0.5;
    case "frozen": return 0.2;
    case "dry": return 0.05;
  }
}

/** Well groundwater output, water/hour. Reliable — only a MILD drought dip, and
 *  it never freezes (that's the point of digging one). */
export function getWellOutput(level: number): number {
  return level <= 0 ? 0 : level * 12;
}
export function wellFactor(band: ClimateBand): number {
  return band === "drought" ? 0.7 : band === "dry" ? 0.85 : 1;
}

/** Cistern storage capacity added per level. */
export function getCisternCap(level: number): number {
  return level <= 0 ? 0 : level * 150;
}
/** Rain a cistern catches, water/hour, before the year's climate rain factor. */
export function getCisternRainCatch(level: number): number {
  return level <= 0 ? 0 : level * 9;
}
/** The cistern only catches water while it's ACTUALLY raining (or storming). */
export function ambientRainFactor(weather: WeatherType): number {
  switch (weather) {
    case "rain": case "storm": case "unnatural_storm": return 2.5;
    default: return 0;
  }
}
/** Water a drainage works banks from runoff in a wet year, water/hour per level. */
export function getDrainageBank(level: number): number {
  return level <= 0 ? 0 : level * 5;
}

/** Total water the reserve can hold (base barrels + cisterns). */
export function getWaterCap(cisternLevel: number): number {
  return BASE_WATER_CAP + getCisternCap(cisternLevel);
}

// ── Consumption (per hour) — scales with what's actually alive/growing ───────
export const ANIMAL_WATER_PER_HEAD = 1;
export const ORCHARD_WATER_PER_TREE = 2;   // per bearing tree/vine
export const FIELD_WATER_PER_LEVEL = 4;    // a field is acreage — thirsty
export const CITIZEN_WATER_PER_HEAD = 1;
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
/** Citizens drink year-round (a whole unit each), more in the summer heat and
 *  more still in a dry/drought year. */
export function citizenWaterDemand(pop: number, season: Season, band: ClimateBand): number {
  const summer = season === "summer" ? 1.5 : 1;
  const heat = band === "drought" ? 1.5 : band === "dry" ? 1.2 : 1;
  return Math.round(CITIZEN_WATER_PER_HEAD * Math.max(0, pop) * summer * heat);
}
/** Crops drink more in the heat of a dry/drought year. */
export function cropHeatFactor(band: ClimateBand): number {
  return band === "drought" ? 2 : band === "dry" ? 1.3 : 1;
}

/** Crops drink from the reserve whenever it isn't raining. Irrigation channels
 *  deliver it efficiently — the same crop spends less water — so an irrigated
 *  farm's reserve lasts far longer through a dry spell. */
export const IRRIGATION_EFFICIENCY = 0.6;
