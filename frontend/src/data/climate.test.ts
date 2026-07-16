import { describe, it, expect } from "vitest";
import { getClimate, getClimateYield, CLIMATE_META, type ClimateBand } from "./climate";

describe("getClimate", () => {
  it("is deterministic — same year, same band", () => {
    for (const y of [1, 7, 42, 100]) expect(getClimate(y)).toBe(getClimate(y));
  });

  it("never puts two droughts within 3 years of each other (guard)", () => {
    const droughtYears: number[] = [];
    for (let y = 1; y <= 400; y++) if (getClimate(y) === "drought") droughtYears.push(y);
    for (let i = 1; i < droughtYears.length; i++) {
      expect(droughtYears[i] - droughtYears[i - 1]).toBeGreaterThanOrEqual(4);
    }
  });

  it("produces a believable spread over the long run", () => {
    const tally: Record<ClimateBand, number> = { drought: 0, dry: 0, normal: 0, wet: 0, deluge: 0 };
    const N = 1000;
    for (let y = 1; y <= N; y++) tally[getClimate(y)]++;
    // normal is the common case; droughts stay rare; every band shows up.
    expect(tally.normal / N).toBeGreaterThan(0.4);
    expect(tally.drought / N).toBeLessThan(0.1);
    for (const band of Object.keys(tally) as ClimateBand[]) expect(tally[band]).toBeGreaterThan(0);
  });
});

describe("getClimateYield", () => {
  it("is a bell curve — a fair year yields most, both extremes less", () => {
    expect(getClimateYield("normal")).toBe(1);
    expect(getClimateYield("dry")).toBeLessThan(getClimateYield("normal"));
    expect(getClimateYield("wet")).toBeLessThan(getClimateYield("normal"));
    expect(getClimateYield("drought")).toBeLessThan(getClimateYield("dry"));
    expect(getClimateYield("deluge")).toBeLessThan(getClimateYield("wet"));
  });
  it("every band has metadata", () => {
    for (const band of Object.keys(CLIMATE_META) as ClimateBand[]) {
      expect(CLIMATE_META[band].name.length).toBeGreaterThan(0);
      expect(CLIMATE_META[band].yield).toBe(getClimateYield(band));
    }
  });
});
