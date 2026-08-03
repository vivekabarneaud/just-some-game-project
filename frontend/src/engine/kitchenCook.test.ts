import { describe, it, expect } from "vitest";
import { cook, clampPlacements, MAX_PER_INGREDIENT } from "@medieval-realm/shared/data/kitchen/cook";
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

  it("a seasoning lifts a proper meal to 'seasoned' quality", () => {
    expect(cook([p("barley", "boil")]).quality).toBe("fine");
    expect(cook([p("barley", "boil"), p("bay", "boil")]).quality).toBe("seasoned");
  });

  it("a garnish enhances a named dish without breaking its identity", () => {
    const broth = [p("venison", "boil"), p("turnip", "boil"), p("barley", "boil")];
    const plain = cook(broth);
    const seasoned = cook([...broth, p("bay", "boil")]);
    // Still Ploughman's Broth (bay is a garnish, not a new ingredient), but finer + a touch stronger.
    expect(matchNamedDish([...broth, p("bay", "boil")])?.name).toBe("Ploughman's Broth");
    expect(plain.quality).toBe("fine");
    expect(seasoned.quality).toBe("seasoned");
    expect(amt(seasoned, "nourishment")).toBeGreaterThan(amt(plain, "nourishment"));
  });

  it("the right spice UPGRADES a plain dish into a named one (chicken + saffron → Golden Fowl)", () => {
    expect(matchNamedDish([p("chicken", "roast")])).toBeUndefined();
    expect(matchNamedDish([p("chicken", "roast"), p("saffron", "boil")])?.name).toBe("Golden Fowl");
  });

  it("an extra BODY ingredient does break identity (that's a different dish)", () => {
    expect(matchNamedDish([p("venison", "boil"), p("nuts", "boil"), p("turnip", "boil")])?.name).not.toBe("Hearth Stew");
  });

  it("variety is a hidden catalyst: a broader spread lifts boons, with no 'diversity' line", () => {
    // Same headline ingredient (barley) both times; the varied dish adds a
    // second BODY shelf, which lifts nourishment beyond barley alone.
    const narrow = cook([p("barley", "boil")]);
    const varied = cook([p("barley", "boil"), p("turnip", "boil")]);
    expect(amt(varied, "nourishment")).toBeGreaterThan(amt(narrow, "nourishment"));
    // No output line is ever labelled "diversity".
    expect(varied.effects.some((e) => (e.channel as string) === "diversity")).toBe(false);
  });

  it("a prestige spice (saffron) tips an invented dish into a 'Golden ___'", () => {
    const golden = cook([p("venison", "roast"), p("barley", "boil"), p("saffron", "boil")]);
    expect(golden.name).toMatch(/^Golden /);
    const plain = cook([p("venison", "roast"), p("barley", "boil"), p("salt", "boil")]);
    expect(plain.name).not.toMatch(/^Golden /);
  });

  it("quantity is potency but capped: 20 barley cooks like 5 (no larder dump)", () => {
    const five = cook(Array.from({ length: MAX_PER_INGREDIENT }, () => p("barley", "boil")));
    const twenty = cook(Array.from({ length: 20 }, () => p("barley", "boil")));
    expect(amt(twenty, "nourishment")).toBe(amt(five, "nourishment"));
    expect(clampPlacements(Array.from({ length: 20 }, () => p("barley", "boil"))).length).toBe(MAX_PER_INGREDIENT);
  });
});

describe("named dishes — curated combos (with meat-split slots)", () => {
  it("every named dish slot uses real ingredients", () => {
    for (const d of NAMED_DISHES) {
      for (const slot of d.slots) {
        for (const id of slot.anyOf) {
          expect(getFoodIngredient(id), `${d.name} → ${id}`).toBeTruthy();
        }
      }
    }
  });

  it("matches order/quantity independently", () => {
    // Hearth Stew = boil(red meat) + boil(nuts); reversed + doubled still matches.
    expect(matchNamedDish([p("nuts", "boil"), p("venison", "boil")])?.name).toBe("Hearth Stew");
    expect(matchNamedDish([p("venison", "boil"), p("venison", "boil"), p("nuts", "boil")])?.name).toBe("Hearth Stew");
    // The same ingredients prepared differently is not the Hearth Stew.
    expect(matchNamedDish([p("venison", "roast"), p("nuts", "boil")])).toBeUndefined();
  });

  it("an anyOf slot substitutes freely: pork OR venison both make Hearth Stew", () => {
    expect(matchNamedDish([p("pork", "boil"), p("nuts", "boil")])?.name).toBe("Hearth Stew");
    expect(matchNamedDish([p("venison", "boil"), p("nuts", "boil")])?.name).toBe("Hearth Stew");
    // But chicken isn't a "red meat" — no Hearth Stew.
    expect(matchNamedDish([p("chicken", "boil"), p("nuts", "boil")])).toBeUndefined();
  });

  it("a signature dish demands its meat: Honeyed Ham needs pork, not just any meat", () => {
    expect(matchNamedDish([p("pork", "roast"), p("honey", "boil")])?.name).toBe("Honeyed Ham");
    expect(matchNamedDish([p("venison", "roast"), p("honey", "boil")])).toBeUndefined();
  });

  it("each named dish has a unique id", () => {
    const ids = NAMED_DISHES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
