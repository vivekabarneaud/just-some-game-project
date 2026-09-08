import { describe, it, expect } from "vitest";
import { currentWeatherInfo, resolveWeather, type WeatherClock } from "./weather";
import { SEASON_ELAPSED_SPAN, getGlobalSeason, settlementYear, worldYearOf } from "@medieval-realm/shared/data/calendar";
import { IS_DEV } from "./seasons";

// The weather is rolled from (season, progress, year). The year used to be a
// caller-supplied argument and 12 of the 14 call sites passed `state.year` --
// settlement AGE, the UI's "Year N" -- instead of the world year the roll is
// seeded by. Prod hid it (prod reads the wall clock and ignores the argument),
// but in dev the sidebar chip and the rendered rain rolled DIFFERENT weather.
// The function's own docstring warned about it; only two sites had been fixed.
// So the year is no longer something a caller can pass.

const clock = (over: Partial<WeatherClock> = {}): WeatherClock =>
  ({ season: "autumn", seasonElapsed: 6, year: 1, foundingYear: 11, ...over });

describe("nobody can pass the weather-roll year any more", () => {
  it("currentWeatherInfo takes one clock object, not three loose numbers", () => {
    expect(currentWeatherInfo.length).toBe(1);
  });

  it("no call site anywhere passes a year — signature is the guard, this is the sweep", () => {
    // Catches a regression in the exact shape the original bug had: someone
    // reintroducing a third argument, or reaching for state.year directly.
    // import.meta.glob (Vite, typed by vite/client) reads the sources without
    // needing @types/node, which the frontend package does not carry.
    const sources = import.meta.glob("/src/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const offenders: string[] = [];
    let scanned = 0;
    for (const [path, src] of Object.entries(sources)) {
      if (path.includes(".test.") || path.endsWith("/data/weather.ts")) continue;
      scanned++;
      for (const m of src.matchAll(/(resolveCurrentWeather|currentWeatherInfo|forageBloomNow)\(([^)]*)\)/g)) {
        if (m[2].includes(",")) offenders.push(`${path}: ${m[0]}`);
      }
    }
    expect(scanned, "glob matched nothing — the test would pass vacuously").toBeGreaterThan(20);
    expect(offenders).toEqual([]);
  });
});

describe("dev and prod agree on the weather", () => {
  it("a fresh settlement rolls the same weather in either mode", () => {
    // Fresh save: seasonElapsed seeded from world progress, year 1, founded
    // this world year. Dev must then derive exactly the world year.
    const g = getGlobalSeason();
    const fresh = clock({ season: g.season, seasonElapsed: g.progress * SEASON_ELAPSED_SPAN, year: 1, foundingYear: g.year });
    const info = currentWeatherInfo(fresh);
    expect(info.season).toBe(g.season);
    expect(info.progress).toBeCloseTo(g.progress, 6);
    expect(info.year).toBe(g.year);
    // Same inputs, therefore same weather, in whichever mode this runs.
    expect(resolveWeather(info.season, info.progress, info.year))
      .toBe(resolveWeather(g.season, g.progress, g.year));
  });

  it("settlement age and world year round-trip, so accelerating rolls new weather", () => {
    // The bug was feeding age (1) where the world year (11) belonged.
    expect(worldYearOf(1, 11)).toBe(11);
    expect(worldYearOf(2, 11)).toBe(12); // a local year later = a new roll
    expect(settlementYear(worldYearOf(3, 9), 9)).toBe(3);
    // Age is never the world year unless the settlement is world-year 1.
    expect(worldYearOf(1, 11)).not.toBe(1);
  });

  it("dev's year advances with the local clock; prod's never does", () => {
    const y1 = currentWeatherInfo(clock({ year: 1 })).year;
    const y2 = currentWeatherInfo(clock({ year: 2 })).year;
    if (IS_DEV) {
      expect(y2).toBe(y1 + 1); // speed buttons cross a year -> new weather
    } else {
      expect(y2).toBe(y1); // prod is the wall clock, full stop
    }
  });
});
