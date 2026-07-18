// ─── Climate (weather → yield, Layer 2) ─────────────────────────────────────
//
// One deterministic "climate" per WORLD year (the wall-clock year from
// getGlobalSeason — shared across players, like the ambient weather). Unlike the
// 72-window ambient mood, this is ONE roll per year, so years actually differ
// (aggregating the ambient weather washes out to ~constant — see DESIGN_WEATHER_YIELD.md).
//
// Deterministic → reproducible, no save state. A "guard" rule keeps it fair
// (no back-to-back droughts). A settlement's own first year gets a grace pass
// (handled by the caller, using state.year — not here).

import { createSignal } from "solid-js";

export type ClimateBand = "drought" | "dry" | "normal" | "wet" | "deluge";

// Dev-only override: force a climate band to test the yield swings / drought
// kill without waiting for the world year to roll one. Null = real climate.
// Nothing sets this in prod (only the dev-tools dropdown), so it's inert there.
const [climateOverride, setClimateOverrideSig] = createSignal<ClimateBand | null>(null);
export const climateOverrideBand = climateOverride;
export function setClimateOverride(b: ClimateBand | null) { setClimateOverrideSig(b); }

export const CLIMATE_META: Record<
  ClimateBand,
  { name: string; icon: string; color: string; blurb: string; yield: number }
> = {
  // `yield` is the crop-yield multiplier for the year. Bell curve: normal best,
  // both extremes worse; drought worst (and it also kills standing plants).
  drought: { name: "Drought",   icon: "🥵", color: "#d4831a", blurb: "A parched year — crops wither and the wells run low.", yield: 0.45 },
  dry:     { name: "Dry year",  icon: "🌾", color: "#c9a227", blurb: "A dry season. Yields come in light.", yield: 0.8 },
  normal:  { name: "Fair year", icon: "🌤️", color: "#7CFC00", blurb: "Kind weather. The fields do well.", yield: 1.0 },
  wet:     { name: "Wet year",  icon: "🌧️", color: "#87CEEB", blurb: "A soggy season. Some of the crop rots in the wet.", yield: 0.85 },
  deluge:  { name: "Deluge",    icon: "🌊", color: "#4a90d9", blurb: "Relentless rain. Waterlogged roots drag the harvest down.", yield: 0.65 },
};

// Fraction of standing garden/field plants a drought kills. Kept only for the
// dev "apply kill now" test tool. The year-type climate band is yield-only now
// (getClimateYield); the killing is done by momentary WEATHER events (heat wave
// / downpour) in weather.ts, not by the year.
export const DROUGHT_PLANT_KILL = 0.4;

// mulberry32 core — a good 0..1 hash for sequential integer seeds (the sin-based
// ambient hash clusters badly one-roll-per-year; this doesn't).
function rand01(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Raw band from the year's roll (before the anti-clustering guard).
function rawBand(year: number): ClimateBand {
  const r = rand01(year * 2 + 101); // *2+k so adjacent years use well-separated seeds
  if (r < 0.07) return "drought";
  if (r < 0.25) return "dry";
  if (r < 0.75) return "normal";
  if (r < 0.93) return "wet";
  return "deluge";
}

/**
 * The climate band for a world year. Guard: a drought is downgraded to "dry" if
 * any of the previous 3 years was (raw) a drought — no brutal back-to-back
 * drought runs. Deterministic (uses raw neighbours, so no recursion).
 */
export function getClimate(worldYear: number): ClimateBand {
  const band = rawBand(worldYear);
  if (band === "drought") {
    for (let y = worldYear - 1; y >= worldYear - 3 && y >= 1; y--) {
      if (rawBand(y) === "drought") return "dry";
    }
  }
  return band;
}

export function getClimateYield(band: ClimateBand): number {
  return CLIMATE_META[band].yield;
}

/** Dry bands (a water deficit — a full reserve buffers the heat-wave thirst). */
export function isDryBand(band: ClimateBand): boolean {
  return band === "dry" || band === "drought";
}
/** Wet bands (a water surplus — a low reserve / open sluice avoids drowning). */
export function isWetBand(band: ClimateBand): boolean {
  return band === "wet" || band === "deluge";
}
/** How much rain a cistern catches this year, relative to a normal year — wet
 *  years fill it fast, drought barely at all. */
export function climateRainFactor(band: ClimateBand): number {
  switch (band) {
    case "deluge": return 1.8;
    case "wet": return 1.35;
    case "normal": return 1.0;
    case "dry": return 0.4;
    case "drought": return 0.1;
  }
}
