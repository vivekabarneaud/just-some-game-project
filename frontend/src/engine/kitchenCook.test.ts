import { describe, it, expect } from "vitest";
import { cook, clampPlacements, MAX_PER_INGREDIENT, dishIdFor } from "@medieval-realm/shared/data/kitchen/cook";
import { NAMED_DISHES, matchNamedDish } from "@medieval-realm/shared/data/kitchen/named_dishes";
import { getFoodIngredient } from "@medieval-realm/shared/data/kitchen/ingredients";
import type { DishChannel, CookPlacement, CookTechnique } from "@medieval-realm/shared/data/kitchen/types";

const p = (id: string, t: CookTechnique): CookPlacement => ({ ingredientId: id, technique: t });
const amt = (r: ReturnType<typeof cook>, ch: DishChannel) => r.effects.find((e) => e.channel === ch)?.amount ?? 0;

describe("cook — the free-form cooking engine", () => {
  it("an empty pot is an empty pot", () => {
    expect(cook([]).name).toBe("Empty Pot");
    expect(cook([{ ingredientId: "", technique: "boil" }]).effects).toEqual([]);
  });

  it("boiled grain is hearty and warming (a staple needs no staple)", () => {
    const r = cook([p("barley", "boil")]);
    expect(r.quality).toBe("fine");
    expect(amt(r, "nourishment")).toBeGreaterThan(0);
    expect(amt(r, "warmth")).toBeGreaterThan(0); // hot food warms
  });

  it("a dish with substance but no staple comes out thin (the base lever)", () => {
    const withStaple = cook([p("venison", "roast"), p("barley", "boil")]);
    const noStaple = cook([p("venison", "roast")]);
    expect(noStaple.quality).toBe("rough");
    expect(noStaple.notes.some((n) => n.toLowerCase().includes("staple") || n.toLowerCase().includes("grain"))).toBe(true);
    expect(amt(noStaple, "nourishment")).toBeLessThan(amt(withStaple, "nourishment"));
  });

  it("prep is per-ingredient: roast the meat AND boil the staple in one dish", () => {
    const r = cook([p("venison", "roast"), p("barley", "boil")]);
    expect(amt(r, "comfort")).toBeGreaterThan(0); // roast leans comfort
    expect(amt(r, "warmth")).toBeGreaterThan(0);  // boiled grain warms
    expect(r.quality).toBe("fine");
  });

  it("technique changes what an ingredient gives: chopped is fresh + cold, boiled warms", () => {
    const chopped = cook([p("apple", "chop"), p("barley", "boil")]);
    const boiled = cook([p("apple", "boil"), p("barley", "boil")]);
    expect(amt(chopped, "freshness")).toBeGreaterThan(amt(boiled, "freshness"));
    expect(amt(boiled, "warmth")).toBeGreaterThan(0);
  });

  it("spices amplify the dish (catalyst, no line of its own)", () => {
    const plain = cook([p("pork", "roast"), p("barley", "boil")]);
    const spiced = cook([p("pork", "roast"), p("barley", "boil"), p("long_pepper", "boil")]);
    expect(spiced.notes.some((n) => n.toLowerCase().includes("spice"))).toBe(true);
    expect(amt(spiced, "comfort")).toBeGreaterThan(amt(plain, "comfort"));
    expect(spiced.effects.some((e) => (e.channel as string) === "spice")).toBe(false);
  });

  it("quantity is potency but capped: 20 barley cooks like 5 (no larder dump)", () => {
    const five = cook(Array.from({ length: MAX_PER_INGREDIENT }, () => p("barley", "boil")));
    const twenty = cook(Array.from({ length: 20 }, () => p("barley", "boil")));
    expect(amt(twenty, "nourishment")).toBe(amt(five, "nourishment"));
    expect(clampPlacements(Array.from({ length: 20 }, () => p("barley", "boil"))).length).toBe(MAX_PER_INGREDIENT);
  });
});

describe("named dishes — the tier-1 staples", () => {
  it("every named dish uses real ingredients", () => {
    for (const d of NAMED_DISHES) {
      for (const pl of d.placements) {
        expect(getFoodIngredient(pl.ingredientId), `${d.name} → ${pl.ingredientId}`).toBeTruthy();
      }
    }
  });

  it("matches a staple by ingredients + preps, order/quantity independent", () => {
    // Hearth Stew = boil(venison) + boil(nuts); reversed + doubled still matches.
    expect(matchNamedDish([p("nuts", "boil"), p("venison", "boil")])?.name).toBe("Hearth Stew");
    expect(matchNamedDish([p("venison", "boil"), p("venison", "boil"), p("nuts", "boil")])?.name).toBe("Hearth Stew");
    // The same ingredients prepared differently is not the Hearth Stew.
    expect(matchNamedDish([p("venison", "roast"), p("nuts", "boil")])).toBeUndefined();
  });

  it("each named dish has a unique id", () => {
    const ids = NAMED_DISHES.map((d) => dishIdFor(d.placements));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
