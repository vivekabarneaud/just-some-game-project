import { createSignal } from "solid-js";
import type { Season } from "./seasons";
import { SEASON_ORDER } from "./seasons";

// ─── Weather (ambient mood layer) ──────────────────────────────────────────
//
// Two-layer model (see docs/DESIGN_WEATHER.md):
//   Layer 1 — Ambient mood weather (THIS FILE, cosmetic only for now).
//   Layer 2 — Natural events (drought / storm / blizzard) with mechanics. TODO.
//   Layer 3 — Unnatural (aether) storms as a story tell. TODO, scripted + emergent.
//
// Ambient weather is DERIVED from (season, progress, year) rather than stored,
// so it costs nothing in the save file and needs no migration. It drifts on its
// own as the season progresses. `storm` and `unnatural_storm` are part of the
// vocabulary so the renderer already knows how to draw them, but the ambient
// drift never produces them — those will arrive via Layer 2/3 overrides.

export type WeatherType =
  | "clear"
  | "overcast"
  | "rain"
  | "snow"
  | "fog"
  | "storm"
  | "unnatural_storm";

export const WEATHER_META: Record<
  WeatherType,
  { name: string; icon: string; blurb: string }
> = {
  clear:     { name: "Clear",      icon: "☀️", blurb: "Open skies. A calm day over the settlement." },
  overcast:  { name: "Overcast",   icon: "☁️", blurb: "A grey lid of cloud. Nothing stirring yet." },
  rain:      { name: "Rain",       icon: "🌧️", blurb: "Steady rain darkens the thatch and softens the fields." },
  snow:      { name: "Snowfall",   icon: "🌨️", blurb: "Snow drifts down. The cold keeps its own counsel." },
  fog:       { name: "Fog",        icon: "🌫️", blurb: "A low fog clings to the ground. Hard to see the line." },
  storm:     { name: "Storm",      icon: "⛈️", blurb: "Wind and lightning. Keep the watch and the roofs sound." },
  unnatural_storm: {
    name: "Unnatural Storm",
    icon: "🌀",
    blurb: "The sky is the wrong colour. This weather does not belong to the season.",
  },
};

// Probability weights for the ambient drift, per season. Only the four "calm"
// moods appear here; storms are events, not mood, so they carry no weight.
const WEATHER_WEIGHTS: Record<Season, Partial<Record<WeatherType, number>>> = {
  spring: { rain: 35, overcast: 25, clear: 25, fog: 15 },
  summer: { clear: 55, overcast: 20, rain: 15, fog: 10 },
  autumn: { overcast: 35, rain: 30, fog: 20, clear: 15 },
  winter: { snow: 45, overcast: 30, clear: 15, fog: 10 },
};

// How many distinct weather "windows" a season is divided into. In dev a season
// is 24 game-hours, so 6 windows ≈ a fresh mood every ~4 hours.
const WEATHER_WINDOWS = 6;

// Stable 0..1 hash so a given (season, year, window) always picks the same mood.
function hash01(n: number): number {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Ambient weather for the current moment, derived deterministically.
 * @param season  current season
 * @param progress fraction through the season, 0..1
 * @param year    calendar year (so the same window in different years differs)
 */
export function getAmbientWeather(season: Season, progress: number, year: number): WeatherType {
  const window = Math.min(WEATHER_WINDOWS - 1, Math.floor(progress * WEATHER_WINDOWS));
  const seed = SEASON_ORDER.indexOf(season) * 1000 + year * 37 + window * 7.3;
  const roll = hash01(seed);

  const weights = WEATHER_WEIGHTS[season];
  const total = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0);
  let target = roll * total;
  for (const [type, w] of Object.entries(weights)) {
    target -= w ?? 0;
    if (target <= 0) return type as WeatherType;
  }
  return "clear";
}

// ─── Weather override (the Layer 2/3 seam) ──────────────────────────────────
// A runtime override that forces a specific weather, bypassing ambient drift.
// Ephemeral (not persisted): today it's driven by the dev tools dropdown; when
// Layer 2/3 land, scripted/emergent storms will set it for their duration.
const [override, setOverride] = createSignal<WeatherType | null>(null);

/** Current forced weather, or null when ambient drift is in control. */
export const weatherOverride = override;

/** Force a weather, or pass null to hand control back to ambient drift. */
export function setWeatherOverride(w: WeatherType | null) {
  setOverride(w);
}

/** The weather to actually render: override wins, else ambient drift. */
export function resolveWeather(season: Season, progress: number, year: number): WeatherType {
  return override() ?? getAmbientWeather(season, progress, year);
}

/** Ordered list for menus/dropdowns. */
export const WEATHER_TYPES: WeatherType[] = [
  "clear", "overcast", "rain", "snow", "fog", "storm", "unnatural_storm",
];
