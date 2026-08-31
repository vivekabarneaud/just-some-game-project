// ─── Water system (weather → yield, Layer 2) ────────────────────────────────
// A stream + wells + rain-catching cisterns fill a `water` reserve; crops draw
// it continuously (paused when it rains), livestock and citizens drink from it.
// When it's short: citizens first, then livestock, then crops. The cistern has a
// sluice: shut, it banks water (a drought buffer); open, it stops banking and
// runs the reserve low so a downpour can't back up and drown the fields.
// See docs/IDEAS.md (Weather) §5.

import type { ClimateBand } from "./climate";
import type { WeatherType } from "./weather";
import type { Season } from "./seasons";

// Building ids (defined in data/buildings.ts).
export const WELL_ID = "well";
export const CISTERN_ID = "cistern";

/** A little water is held even without a cistern (a few barrels) — the stream
 *  keeps it topped up, so a new settlement is never dry. */
const BASE_WATER_CAP = 40;

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
function getCisternCap(level: number): number {
  return level <= 0 ? 0 : level * 150;
}
/** Rain a cistern catches, water/hour, before the year's climate rain factor. */
export function getCisternRainCatch(level: number): number {
  return level <= 0 ? 0 : level * 9;
}
/** The cistern only catches water while it's ACTUALLY raining (or storming). */
export function ambientRainFactor(weather: WeatherType): number {
  switch (weather) {
    case "heavy_rain": return 4;
    case "rain": case "storm": case "unnatural_storm": return 2.5;
    default: return 0;
  }
}
/** Total water the reserve can hold (base barrels + cisterns). */
export function getWaterCap(cisternLevel: number): number {
  return BASE_WATER_CAP + getCisternCap(cisternLevel);
}

// ── Consumption (per hour) — scales with what's actually alive/growing ───────
const ANIMAL_WATER_PER_HEAD = 1;
const ORCHARD_WATER_PER_TREE = 2;   // per bearing tree/vine
const FIELD_WATER_PER_LEVEL = 4;    // a field is acreage — thirsty
const CITIZEN_WATER_PER_HEAD = 1;
const GARDEN_WATER_PER_PLANT: Record<string, number> = {
  lavender: 0.5,     // likes it dry
  squash: 1.2,       // thirsty
  strawberries: 1.2,
};
function gardenWaterPerPlant(veggieId: string): number {
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

// ── The cistern sluice ───────────────────────────────────────────────────────
// Shut (default): the stream/well/rain fill the reserve — a drought buffer.
// Open: intake to the reserve is paused and it drains out, so it runs low. The
// point is flood safety — a downpour drowns crops only when the reserve is full
// enough to back up onto the fields (see delugeDrownFactor). Reading the year is
// the lever: shut it in a dry year (bank against heat waves), open it in a wet
// one (stay low against downpours; the rain waters the crops for free anyway).

/** How much of the reserve's capacity the open sluice spills per hour — enough
 *  to run a full cistern low over most of a game-day. */
const SLUICE_DRAIN_FRACTION = 0.12;
export function getSluiceDrain(cisternLevel: number): number {
  return Math.round(getWaterCap(cisternLevel) * SLUICE_DRAIN_FRACTION);
}

/** At or below this fill fraction, a downpour's runoff sheds harmlessly — the
 *  reserve has room and the fields drain. Above it, the reserve backs up and the
 *  roots start to drown, ramping to full drowning at capacity. */
export const DELUGE_SAFE_FILL = 0.25;
/** Deluge drowning severity from how full the reserve is (0 = safe, 1 = full).
 *  This is the whole point of the sluice: run low → floods can't hurt you. */
export function delugeDrownFactor(fillRatio: number): number {
  const f = Math.max(0, Math.min(1, fillRatio));
  if (f <= DELUGE_SAFE_FILL) return 0;
  return (f - DELUGE_SAFE_FILL) / (1 - DELUGE_SAFE_FILL);
}
