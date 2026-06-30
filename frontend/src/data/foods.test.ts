import { describe, it, expect } from "vitest";
import {
  emptyFoods,
  getTotalFood,
  getFoodCostAmount,
  consumeFoodCost,
  addFood,
  isFoodItemType,
} from "./foods";

describe("isFoodItemType", () => {
  it("accepts real food types and rejects aliases / non-foods", () => {
    expect(isFoodItemType("wheat")).toBe(true);
    expect(isFoodItemType("meat")).toBe(true);
    expect(isFoodItemType("grain")).toBe(false); // alias, not a stored type
    expect(isFoodItemType("wild")).toBe(false);  // alias
    expect(isFoodItemType("gold")).toBe(false);
  });
});

describe("getFoodCostAmount", () => {
  it("sums the grain alias (wheat + barley)", () => {
    const f = emptyFoods();
    f.wheat = 5; f.barley = 3;
    expect(getFoodCostAmount(f, "grain")).toBe(8);
  });
  it("sums the wild alias (berries + mushrooms + nuts)", () => {
    const f = emptyFoods();
    f.berries = 2; f.mushrooms = 1; f.nuts = 4;
    expect(getFoodCostAmount(f, "wild")).toBe(7);
  });
  it("reads a direct food type, and is 0 for non-foods / missing record", () => {
    const f = emptyFoods();
    f.meat = 6;
    expect(getFoodCostAmount(f, "meat")).toBe(6);
    expect(getFoodCostAmount(f, "gold")).toBe(0);
    expect(getFoodCostAmount(undefined, "grain")).toBe(0);
  });
});

describe("consumeFoodCost", () => {
  it("drains the grain alias from the larger stockpile first", () => {
    const f = emptyFoods();
    f.wheat = 5; f.barley = 3;
    consumeFoodCost(f, "grain", 4);
    expect(f.wheat).toBe(1); // wheat was larger, drained first
    expect(f.barley).toBe(3);
  });
  it("falls back to the other grain when the first runs out, never going negative", () => {
    const f = emptyFoods();
    f.wheat = 2; f.barley = 1;
    consumeFoodCost(f, "grain", 10);
    expect(f.wheat).toBe(0);
    expect(f.barley).toBe(0);
  });
  it("drains a direct type and clamps at 0", () => {
    const f = emptyFoods();
    f.meat = 5;
    consumeFoodCost(f, "meat", 3);
    expect(f.meat).toBe(2);
    consumeFoodCost(f, "meat", 10);
    expect(f.meat).toBe(0);
  });
  it("is a no-op for non-positive amounts", () => {
    const f = emptyFoods();
    f.meat = 5;
    consumeFoodCost(f, "meat", 0);
    expect(f.meat).toBe(5);
  });
});

describe("addFood respects the shared cap", () => {
  it("adds the full amount when there's room", () => {
    const f = emptyFoods();
    expect(addFood(f, "meat", 5, 10)).toBe(5);
    expect(f.meat).toBe(5);
  });
  it("only fills up to the cap when near it", () => {
    const f = emptyFoods();
    f.wheat = 8; // total 8, cap 10 → room for 2
    expect(addFood(f, "meat", 5, 10)).toBe(2);
    expect(f.meat).toBe(2);
    expect(getTotalFood(f)).toBe(10);
  });
  it("adds nothing at the cap or for non-positive amounts", () => {
    const f = emptyFoods();
    f.wheat = 10;
    expect(addFood(f, "meat", 5, 10)).toBe(0);
    expect(addFood(f, "meat", -3, 10)).toBe(0);
  });
});

describe("getTotalFood", () => {
  it("sums every type and handles a missing record", () => {
    const f = emptyFoods();
    f.wheat = 3; f.meat = 4; f.berries = 1;
    expect(getTotalFood(f)).toBe(8);
    expect(getTotalFood(undefined)).toBe(0);
  });
});
