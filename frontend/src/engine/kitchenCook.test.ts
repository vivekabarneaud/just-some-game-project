import { describe, it, expect } from "vitest";
import { cook, clampPlacements, MAX_PER_INGREDIENT, dishFlavors } from "@medieval-realm/shared/data/kitchen/cook";
import { NAMED_DISHES, matchNamedDish, resolveDish } from "@medieval-realm/shared/data/kitchen/named_dishes";
import { getFoodIngredient } from "@medieval-realm/shared/data/kitchen/ingredients";
import { dishMissionBoons } from "@medieval-realm/shared/data/kitchen/mission";
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
    const withStaple = cook([p("meat", "roast"), p("barley", "boil")]);
    const noStaple = cook([p("meat", "roast")]);
    expect(noStaple.quality).toBe("rough");
    expect(noStaple.notes.some((n) => n.toLowerCase().includes("staple") || n.toLowerCase().includes("grain"))).toBe(true);
    expect(amt(noStaple, "nourishment")).toBeLessThan(amt(withStaple, "nourishment"));
  });

  it("a legume dish is NOT thin — beans are a base in their own right", () => {
    expect(cook([p("fava", "boil")]).quality).toBe("fine");
    expect(cook([p("peas", "boil")]).quality).toBe("fine");
  });

  it("multiple spices stack with diminishing amplify", () => {
    const a = amt(cook([p("barley", "boil")]), "nourishment");
    const b = amt(cook([p("barley", "boil"), p("honey", "boil")]), "nourishment");
    const c = amt(cook([p("barley", "boil"), p("honey", "boil"), p("cinnamon", "boil"), p("long_pepper", "boil")]), "nourishment");
    expect(b).toBeGreaterThan(a);          // a spice helps
    expect(c).toBeGreaterThan(b);          // more spice helps more
    expect(c - a).toBeLessThan(3 * (b - a)); // ...but three spices are worth well under 3x one
  });

  it("prep is per-ingredient: roast the meat AND boil the staple in one dish", () => {
    const r = cook([p("meat", "roast"), p("barley", "boil")]);
    expect(amt(r, "comfort")).toBeGreaterThan(0); // roast leans comfort
    expect(amt(r, "warmth")).toBeGreaterThan(0);  // boiled grain warms
    expect(r.quality).toBe("fine");
  });

  it("technique changes what an ingredient gives: chopped is fresh + cold, boiled warms", () => {
    const chopped = cook([p("apples", "chop"), p("barley", "boil")]);
    const boiled = cook([p("apples", "boil"), p("barley", "boil")]);
    expect(amt(chopped, "freshness")).toBeGreaterThan(amt(boiled, "freshness"));
    expect(amt(boiled, "warmth")).toBeGreaterThan(0);
  });

  it("spices amplify the dish (catalyst, no line of its own)", () => {
    const plain = cook([p("meat", "roast"), p("barley", "boil")]);
    const spiced = cook([p("meat", "roast"), p("barley", "boil"), p("long_pepper", "boil")]);
    expect(spiced.notes.some((n) => n.toLowerCase().includes("spice"))).toBe(true);
    expect(amt(spiced, "comfort")).toBeGreaterThan(amt(plain, "comfort"));
    expect(spiced.effects.some((e) => (e.channel as string) === "spice")).toBe(false);
  });

  it("a seasoning lifts a proper meal to 'seasoned' quality", () => {
    expect(cook([p("barley", "boil")]).quality).toBe("fine");
    expect(cook([p("barley", "boil"), p("honey", "boil")]).quality).toBe("seasoned");
  });

  it("a garnish enhances a named dish without breaking its identity", () => {
    const broth = [p("meat", "boil"), p("turnips", "boil"), p("barley", "boil")];
    const plain = cook(broth);
    const seasoned = cook([...broth, p("honey", "boil")]);
    // Still Ploughman's Broth (honey is a garnish here, not a new body ingredient).
    expect(matchNamedDish([...broth, p("honey", "boil")])?.name).toBe("Ploughman's Broth");
    expect(plain.quality).toBe("fine");
    expect(seasoned.quality).toBe("seasoned");
    expect(amt(seasoned, "nourishment")).toBeGreaterThan(amt(plain, "nourishment"));
  });

  it("a required seasoning slot must be present: grain+berries only becomes Berry Pottage with honey", () => {
    expect(matchNamedDish([p("barley", "boil"), p("berries", "boil")])).toBeUndefined();
    expect(matchNamedDish([p("barley", "boil"), p("berries", "boil"), p("honey", "boil")])?.name).toBe("Berry Pottage");
  });

  it("an extra BODY ingredient breaks identity (that's a different dish)", () => {
    expect(matchNamedDish([p("meat", "boil"), p("nuts", "boil"), p("turnips", "boil")])?.name).not.toBe("Hearth Stew");
  });

  it("a prestige spice (saffron) tips an invented dish into a 'Golden ___'", () => {
    const golden = cook([p("meat", "roast"), p("barley", "boil"), p("saffron", "boil")]);
    expect(golden.name).toMatch(/^Golden /);
    const plain = cook([p("meat", "roast"), p("barley", "boil"), p("honey", "boil")]);
    expect(plain.name).not.toMatch(/^Golden /);
  });

  it("variety is a hidden catalyst: a broader spread lifts boons, with no 'diversity' line", () => {
    const narrow = cook([p("barley", "boil")]);
    const varied = cook([p("barley", "boil"), p("turnips", "boil")]);
    expect(amt(varied, "nourishment")).toBeGreaterThan(amt(narrow, "nourishment"));
    expect(varied.effects.some((e) => (e.channel as string) === "diversity")).toBe(false);
  });

  it("a dish's taste emerges from its ingredients (honey-heavy → sweet)", () => {
    const porridge = [p("wheat", "boil"), p("berries", "boil"), p("nuts", "boil"),
      ...Array.from({ length: 5 }, () => p("honey", "boil"))];
    expect(dishFlavors(porridge)).toContain("sweet"); // honey ×5 + berries dominate
    expect(dishFlavors(porridge)).not.toContain("hearty"); // wheat/nuts are outvoted
  });

  it("skewering over the fire makes it smoky (the camp smoky method)", () => {
    expect(dishFlavors([p("meat", "skewer")])).toContain("smoky");
    expect(dishFlavors([p("meat", "boil")])).not.toContain("smoky"); // boiling doesn't
  });

  it("quantity is potency but capped: 20 barley cooks like 5 (no larder dump)", () => {
    const five = cook(Array.from({ length: MAX_PER_INGREDIENT }, () => p("barley", "boil")));
    const twenty = cook(Array.from({ length: 20 }, () => p("barley", "boil")));
    expect(amt(twenty, "nourishment")).toBe(amt(five, "nourishment"));
    expect(clampPlacements(Array.from({ length: 20 }, () => p("barley", "boil"))).length).toBe(MAX_PER_INGREDIENT);
  });
});

describe("named dishes — curated combos (real pantry)", () => {
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
    expect(matchNamedDish([p("nuts", "boil"), p("meat", "boil")])?.name).toBe("Hearth Stew");
    expect(matchNamedDish([p("meat", "boil"), p("meat", "boil"), p("nuts", "boil")])?.name).toBe("Hearth Stew");
    // The same ingredients prepared differently is not the Hearth Stew.
    expect(matchNamedDish([p("meat", "roast"), p("nuts", "boil")])).toBeUndefined();
  });

  it("the redMeat group is the split-ready seam: meat makes Hearth Stew, fish does not", () => {
    // Today redMeat = [meat]; when the split lands it becomes [venison, pork, …]
    // and this dish accepts them all with no change here.
    expect(matchNamedDish([p("meat", "boil"), p("nuts", "boil")])?.name).toBe("Hearth Stew");
    expect(matchNamedDish([p("fish", "boil"), p("nuts", "boil")])).toBeUndefined();
  });

  it("each named dish has a unique id", () => {
    const ids = NAMED_DISHES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("a packed dish gives mission boons: nourishment→HP, comfort→loyalty", () => {
    const roast = resolveDish([p("meat", "roast"), p("barley", "boil")]); // hearty + comforting
    const b = dishMissionBoons(roast.effects);
    expect(b.hpBonus).toBeGreaterThan(0);
    expect(b.loyalty).toBeGreaterThan(0);
    // A watery nothing gives nothing.
    expect(dishMissionBoons([]).hpBonus).toBe(0);
  });

  it("a recognised named dish never reads thin (resolveDish floors it to fine)", () => {
    // Hearth Stew (meat + nuts, no staple/legume) is 'rough' from the raw engine,
    // but it's a known dish, so its resolved quality floors at 'fine'.
    const stew = [p("meat", "boil"), p("nuts", "boil")];
    expect(cook(stew).quality).toBe("rough");
    const resolved = resolveDish(stew);
    expect(resolved.name).toBe("Hearth Stew");
    expect(resolved.quality).toBe("fine");
    // An unnamed no-staple experiment still reads thin (fair feedback).
    expect(resolveDish([p("meat", "roast")]).quality).toBe("rough");
  });
});
