import { describe, it, expect } from "vitest";
import { getMaxStack, clampStackAdd } from "@medieval-realm/shared/data/items";

describe("maxStack — per-item inventory cap", () => {
  it("defaults to uncapped (Infinity) for ordinary materials and gear", () => {
    expect(getMaxStack("fang")).toBe(Infinity);          // monster-drop material
    expect(getMaxStack("greypelt_jerkin")).toBe(Infinity); // craftable gear
    expect(getMaxStack("not_a_real_id")).toBe(Infinity);   // unknown id
  });

  it("clampStackAdd respects the cap and drops overflow", () => {
    // room left below the cap
    expect(clampStackAdd(0, 2, 2)).toBe(2);   // empty -> fill to cap
    expect(clampStackAdd(1, 5, 2)).toBe(1);   // 1 held, cap 2 -> only 1 fits
    expect(clampStackAdd(2, 5, 2)).toBe(0);   // already full -> nothing
    expect(clampStackAdd(3, 5, 2)).toBe(0);   // over cap (never negative)
  });

  it("clampStackAdd is uncapped when cap is Infinity", () => {
    expect(clampStackAdd(0, 5, Infinity)).toBe(5);
    expect(clampStackAdd(100, 7, Infinity)).toBe(7);
  });

  it("clampStackAdd ignores non-positive amounts", () => {
    expect(clampStackAdd(0, 0, 2)).toBe(0);
    expect(clampStackAdd(0, -3, 2)).toBe(0);
  });
});
