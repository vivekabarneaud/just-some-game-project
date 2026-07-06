import { describe, it, expect } from "vitest";
import { getAmbientWeather, WEATHER_META } from "./weather";
import type { WeatherType } from "./weather";

// Sample every weather window across several years for a season.
function sampleSeason(season: Parameters<typeof getAmbientWeather>[0], years = 40): WeatherType[] {
  const out: WeatherType[] = [];
  for (let year = 1; year <= years; year++) {
    for (let w = 0; w < 72; w++) {
      out.push(getAmbientWeather(season, (w + 0.5) / 72, year));
    }
  }
  return out;
}

const frac = (arr: WeatherType[], w: WeatherType) => arr.filter((x) => x === w).length / arr.length;

describe("getAmbientWeather", () => {
  it("is deterministic — same (season, progress, year) → same mood", () => {
    for (let i = 0; i < 20; i++) {
      const p = i / 20;
      expect(getAmbientWeather("autumn", p, 3)).toBe(getAmbientWeather("autumn", p, 3));
    }
  });

  it("only ever returns a known weather type", () => {
    const seasons = ["spring", "summer", "autumn", "winter"] as const;
    for (const s of seasons) {
      for (const w of sampleSeason(s, 5)) {
        expect(WEATHER_META[w]).toBeDefined();
      }
    }
  });

  it("summer reads mostly dry — rain is an occasional shower, not the default", () => {
    const summer = sampleSeason("summer");
    // Tuned intent: clear dominates, rain is rare.
    expect(frac(summer, "clear")).toBeGreaterThan(0.45);
    expect(frac(summer, "rain")).toBeLessThan(0.2);
    expect(frac(summer, "clear")).toBeGreaterThan(frac(summer, "rain"));
  });

  it("keeps each season's character (winter snows, autumn greys, no summer snow)", () => {
    expect(frac(sampleSeason("winter"), "snow")).toBeGreaterThan(0.3);
    expect(frac(sampleSeason("summer"), "snow")).toBe(0); // snow carries no summer weight
    const autumn = sampleSeason("autumn");
    expect(frac(autumn, "overcast")).toBeGreaterThan(frac(autumn, "clear"));
  });

  it("produces variable-length spells — consecutive windows aren't all identical", () => {
    // Short independent windows should yield a mix of runs, not one frozen mood.
    const seq = sampleSeason("autumn", 1); // 72 windows of one year
    const distinct = new Set(seq).size;
    expect(distinct).toBeGreaterThan(1);
  });
});
