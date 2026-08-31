import { createSignal } from "solid-js";
import type { Season } from "./seasons";
import { SEASON_ORDER, SEASON_ELAPSED_SPAN, IS_DEV, getGlobalSeason } from "./seasons";
import { getClimate, climateOverrideBand, type ClimateBand } from "./climate";

// ─── Weather (ambient mood layer) ──────────────────────────────────────────
//
// Two-layer model (see docs/IDEAS.md (Weather)):
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
  | "heavy_rain"
  | "snow"
  | "fog"
  | "heat_wave"
  | "storm"
  | "unnatural_storm";

export const WEATHER_META: Record<
  WeatherType,
  { name: string; icon: string; blurb: string; image?: string }
> = {
  clear:     { name: "Clear",      icon: "☀️", blurb: "Open skies. A calm day over the settlement." },
  overcast:  { name: "Overcast",   icon: "☁️", blurb: "A grey lid of cloud. Nothing stirring yet." },
  rain:      { name: "Rain",       icon: "🌧️", blurb: "Steady rain darkens the thatch and softens the fields." },
  heavy_rain:{ name: "Downpour",   icon: "🌊", blurb: "A hammering downpour. The fields flood and the roots drown if the water can't run off." },
  snow:      { name: "Snowfall",   icon: "🌨️", blurb: "Snow drifts down. The cold keeps its own counsel." },
  fog:       { name: "Fog",        icon: "🌫️", blurb: "A low fog clings to the ground. Hard to see the line." },
  heat_wave: { name: "Heat wave",  icon: "🥵", blurb: "A blistering, windless heat. The crops wilt, and a dry reserve means worse.", image: "/images/seasons/season_drought.png" },
  storm:     { name: "Storm",      icon: "⛈️", blurb: "Wind and lightning. Keep the watch and the roofs sound." },
  unnatural_storm: {
    name: "Unnatural Storm",
    icon: "🌀",
    blurb: "The sky is the wrong colour. This weather does not belong to the season.",
  },
};

// Probability weights for the ambient drift, per season. Only the four "calm"
// moods appear here; storms are events, not mood, so they carry no weight.
// Wet weather pulled down a notch across the board (rain was reading as
// "always raining" — see WEATHER_WINDOWS note). Dry moods bias longer.
const WEATHER_WEIGHTS: Record<Season, Partial<Record<WeatherType, number>>> = {
  spring: { rain: 24, heavy_rain: 5, overcast: 24, clear: 33, fog: 14 },
  summer: { clear: 58, heat_wave: 6, overcast: 21, rain: 8, fog: 7 },
  autumn: { overcast: 31, rain: 20, heavy_rain: 5, fog: 19, clear: 25 },
  winter: { snow: 42, overcast: 30, clear: 20, fog: 8 },
};

// How many distinct weather "windows" a season is divided into. Weather is
// derived from the real wall-clock (prod: getGlobalSeason, a 3-day season), so
// it evolves on its own whether or not the player is watching — good for an
// idle game (you come back to a changed sky). 72 windows over a 3-day season =
// a fresh roll every ~1 real hour (in dev, ~20 game-min). Short windows fix the
// old "stuck in one 12h rain window all session" feel, and because each window
// rolls independently, consecutive same-weather windows merge into naturally
// variable-length spells (a passing shower vs a long grey afternoon) — no
// separate duration machinery needed.
const WEATHER_WINDOWS = 72;

// ── Momentary crop damage from harsh weather events (per game-hour) ──────────
// A heat wave withers crops (thirst adds more when the reserve is dry); a
// downpour drowns them (drainage cuts it). Each weather window is ~1 game-hour,
// events span a few windows, so these are punchier than any per-year rate.
// Tune here. Applied only to standing crops in growing seasons.
export const HEATWAVE_HEAT_KILL_PER_HOUR = 0.02;   // withering even if watered
// Deluge drowning is deliberately GENTLER than a heat wave's worst case (0.08):
// drought is the deadlier threat, a flood the milder one, so a misjudged sluice
// in a wet year stings less than getting caught dry. Scaled by how full the
// reserve is (delugeDrownFactor) — a low reserve drowns nothing.
export const DELUGE_DROWN_KILL_PER_HOUR = 0.04;    // roots drown in the flood (× fill)
// Sustained water DEFICIT slowly wilts crops any weather (applyDeficitWilt),
// scaled by 1−cropCoverage. Gentle: a bone-dry plot (coverage 0) loses ~5%/h, so
// a full plot thins over many hours — time to run a water mission — and never
// wipes (the last plant holds). Keeping crop demand covered is the defence.
export const CHRONIC_WILT_PER_HOUR = 0.05;

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
// How the year band tilts the harsh-event frequency. A dry/hot year throws more
// heat waves and fewer downpours; a wet year the reverse. So the year type is
// FELT in the sky (and read from it) rather than announced. 1 = unchanged.
const BAND_EVENT_BIAS: Record<ClimateBand, { heat_wave: number; heavy_rain: number }> = {
  drought: { heat_wave: 3,   heavy_rain: 0.2 },
  dry:     { heat_wave: 2,   heavy_rain: 0.5 },
  normal:  { heat_wave: 1,   heavy_rain: 1 },
  wet:     { heat_wave: 0.4, heavy_rain: 2 },
  deluge:  { heat_wave: 0.1, heavy_rain: 3 },
};

export function getAmbientWeather(season: Season, progress: number, year: number): WeatherType {
  const window = Math.min(WEATHER_WINDOWS - 1, Math.floor(progress * WEATHER_WINDOWS));
  const seed = SEASON_ORDER.indexOf(season) * 1000 + year * 37 + window * 7.3;
  const roll = hash01(seed);

  // The deterministic year band tilts how often heat waves / downpours roll, so
  // a drought year genuinely bakes and a wet year genuinely floods.
  const band = climateOverrideBand() ?? getClimate(year);
  const bias = BAND_EVENT_BIAS[band];
  const base = WEATHER_WEIGHTS[season];
  const weights: Partial<Record<WeatherType, number>> = { ...base };
  if (weights.heat_wave != null) weights.heat_wave *= bias.heat_wave;
  if (weights.heavy_rain != null) weights.heavy_rain *= bias.heavy_rain;

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

/**
 * THE single source of truth for what (season, progress, year) the weather is
 * derived from. Every weather consumer (the sidebar chip, WeatherAmbience, the
 * RainCanvas, the audio bed) MUST go through this so they can never disagree.
 * In dev it follows the local game clock; in prod it follows the shared world
 * clock (`getGlobalSeason`, incl. its year — the year seeds the roll).
 *
 * IMPORTANT: the year here is the *weather roll* year (world year in prod), NOT
 * the settlement-age "Year N" shown in the UI (that's `state.year`, a separate
 * display value). Feeding `state.year` in here is what desynced the chip from
 * the rendered/audible weather.
 */
export function currentWeatherInfo(
  season: Season,
  seasonElapsed: number,
  year: number,
): { season: Season; progress: number; year: number } {
  return IS_DEV
    ? { season, progress: seasonElapsed / SEASON_ELAPSED_SPAN, year }
    : getGlobalSeason();
}

/** Convenience: resolve the weather straight from the game clock inputs. */
export function resolveCurrentWeather(season: Season, seasonElapsed: number, year: number): WeatherType {
  const i = currentWeatherInfo(season, seasonElapsed, year);
  return resolveWeather(i.season, i.progress, i.year);
}

const isWetWeather = (w: WeatherType) => w === "rain" || w === "storm" || w === "unnatural_storm";

/**
 * True during the first DRY window right after a wet one — the damp aftermath a
 * forager's hut sprouts mushrooms in. Computed from the deterministic wall-clock
 * weather (dry now AND wet in the previous ~1h window), so it needs no save
 * state and lasts about one window before fading. Deliberately "after" the rain,
 * not during. Skips the season-boundary lookback for simplicity.
 */
export function forageBloomNow(season: Season, seasonElapsed: number, year: number): boolean {
  const info = currentWeatherInfo(season, seasonElapsed, year);
  if (isWetWeather(resolveWeather(info.season, info.progress, info.year))) return false; // still raining
  const prevProgress = info.progress - 1 / WEATHER_WINDOWS;
  if (prevProgress < 0) return false; // start of the season — no prior window to read
  return isWetWeather(resolveWeather(info.season, prevProgress, info.year));
}

/** Ordered list for menus/dropdowns. */
export const WEATHER_TYPES: WeatherType[] = [
  "clear", "overcast", "rain", "snow", "fog", "storm", "unnatural_storm",
  // Crop-damaging events — rare in ambient drift, listed here so the dev weather
  // dropdown can force one on demand to test heat-wave / downpour crop loss.
  "heat_wave", "heavy_rain",
];
