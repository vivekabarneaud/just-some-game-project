import { describe, it, expect } from "vitest";
import {
  getSeedCapacity,
  getEffectiveGardenRate,
  getSeedReturn,
  getSproutedPlants,
  getGerminationRate,
  makeStartingSeeds,
  isSeedUnlocked,
  startingUnlockedSeeds,
  getGardenRate,
  getVeggie,
  VEGGIES,
} from "./gardens";

// First unit test for the project. Targets the per-crop seed system (June 2026)
// because it's pure, just shipped, and central to the early-game food loop.
// The assertions lean on CONTRACTS (partial scales down, clamps at capacity,
// germination reduces a full sow below the theoretical base rate) so they
// survive balance tweaks, plus pin the formulas that ARE the spec
// (capacity = 10/level, return = 1.5x per sprouted plant).

const turnips = getVeggie("turnips");

describe("getSeedCapacity", () => {
  it("is 10 seeds per garden level", () => {
    expect(getSeedCapacity(1)).toBe(10);
    expect(getSeedCapacity(3)).toBe(30);
    expect(getSeedCapacity(8)).toBe(80);
  });
  it("is 0 for an unbuilt plot", () => {
    expect(getSeedCapacity(0)).toBe(0);
  });
});

describe("getEffectiveGardenRate", () => {
  it("a fully-sown plot produces the germinated fraction of the base rate", () => {
    const cap = getSeedCapacity(2);
    const sprouted = getSproutedPlants(turnips, cap);
    expect(getEffectiveGardenRate(turnips, 2, cap))
      .toBe(Math.floor(getGardenRate(turnips, 2) * (sprouted / cap)));
    // ...and that's below the theoretical full rate (not every seed takes).
    expect(getEffectiveGardenRate(turnips, 2, cap)).toBeLessThan(getGardenRate(turnips, 2));
  });
  it("scales down with a partial sow", () => {
    const fullSown = getEffectiveGardenRate(turnips, 1, getSeedCapacity(1));
    const half = getEffectiveGardenRate(turnips, 1, getSeedCapacity(1) / 2);
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(fullSown);
  });
  it("clamps at the base rate when heavily over-sown (extra seed offsets germination loss)", () => {
    expect(getEffectiveGardenRate(turnips, 1, getSeedCapacity(1) * 3)).toBe(getGardenRate(turnips, 1));
  });
  it("produces nothing with no seeds sown", () => {
    expect(getEffectiveGardenRate(turnips, 1, 0)).toBe(0);
  });
  it("produces nothing on an unbuilt plot (no capacity)", () => {
    expect(getEffectiveGardenRate(turnips, 0, 50)).toBe(0);
  });
});

describe("getGerminationRate / getSproutedPlants", () => {
  it("every crop germinates between 50% and 100%", () => {
    for (const v of VEGGIES) {
      const r = getGerminationRate(v);
      expect(r).toBeGreaterThanOrEqual(0.5);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
  it("sprouts the germinated fraction of sown seed, floored", () => {
    expect(getSproutedPlants(turnips, 10)).toBe(Math.floor(10 * getGerminationRate(turnips)));
    expect(getSproutedPlants(turnips, 0)).toBe(0);
  });
});

describe("getSeedReturn", () => {
  it("returns 1.5x the sprouted plants, floored", () => {
    expect(getSeedReturn(10)).toBe(15);
    expect(getSeedReturn(7)).toBe(10); // floor(10.5)
  });
  it("returns nothing for an unsown plot", () => {
    expect(getSeedReturn(0)).toBe(0);
  });
});

describe("makeStartingSeeds", () => {
  it("gives the crew one plot's worth (10) of every staple, 0 of specialty crops", () => {
    const seeds = makeStartingSeeds();
    expect(Object.keys(seeds).length).toBe(VEGGIES.length);
    for (const v of VEGGIES) expect(seeds[v.id]).toBe(v.specialty ? 0 : 10);
  });
});

describe("isSeedUnlocked / startingUnlockedSeeds", () => {
  it("staples are always unlocked; specialty crops start locked", () => {
    const unlocked = startingUnlockedSeeds();
    for (const v of VEGGIES) {
      expect(isSeedUnlocked(v, unlocked)).toBe(!v.specialty);
    }
  });

  it("unlocks a specialty crop once its id is present", () => {
    const strawberries = VEGGIES.find((v) => v.id === "strawberries")!;
    expect(strawberries.specialty).toBe(true);
    expect(isSeedUnlocked(strawberries, [])).toBe(false);
    expect(isSeedUnlocked(strawberries, ["strawberries"])).toBe(true);
  });
});
