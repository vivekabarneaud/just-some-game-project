import { describe, it, expect } from "vitest";
import { cook, clampIngredients, MAX_PER_INGREDIENT, dishIdFor } from "@medieval-realm/shared/data/kitchen/cook";
import { NAMED_DISHES, matchNamedDish } from "@medieval-realm/shared/data/kitchen/named_dishes";
import { getFoodIngredient } from "@medieval-realm/shared/data/kitchen/ingredients";
import type { DishChannel } from "@medieval-realm/shared/data/kitchen/types";

const amt = (r: ReturnType<typeof cook>, ch: DishChannel) => r.effects.find((e) => e.channel === ch)?.amount ?? 0;

describe("cook — the free-form cooking engine", () => {
  it("an empty pot is an empty pot", () => {
    expect(cook("simmer", []).name).toBe("Empty Pot");
    expect(cook("simmer", [""]).effects).toEqual([]);
  });

  it("simmered grain is hearty and warming (a staple needs no staple)", () => {
    const r = cook("simmer", ["barley"]);
    expect(r.quality).toBe("fine");
    expect(amt(r, "nourishment")).toBeGreaterThan(0);
    expect(amt(r, "warmth")).toBeGreaterThan(0); // hot food warms
  });

  it("a dish with substance but no staple comes out thin (the base lever)", () => {
    const withStaple = cook("simmer", ["venison", "barley"]);
    const noStaple = cook("simmer", ["venison"]);
    expect(noStaple.quality).toBe("rough");
    expect(noStaple.notes.some((n) => n.toLowerCase().includes("staple") || n.toLowerCase().includes("grain"))).toBe(true);
    expect(amt(noStaple, "nourishment")).toBeLessThan(amt(withStaple, "nourishment"));
  });

  it("technique changes the character: assemble is fresh + cold (no warmth), simmer warms", () => {
    const board = cook("assemble", ["apple", "cheese"]);
    const stew = cook("simmer", ["apple", "cheese", "barley"]);
    expect(amt(board, "freshness")).toBeGreaterThan(0);
    expect(amt(board, "warmth")).toBe(0);
    expect(amt(stew, "warmth")).toBeGreaterThan(0);
  });

  it("spices amplify the dish (catalyst, no line of its own)", () => {
    const plain = cook("roast", ["pork", "barley"]);
    const spiced = cook("roast", ["pork", "barley", "long_pepper"]);
    expect(spiced.notes.some((n) => n.toLowerCase().includes("spice"))).toBe(true);
    // Amplifies the existing boons rather than adding a "spice" line of its own.
    expect(amt(spiced, "comfort")).toBeGreaterThan(amt(plain, "comfort"));
    expect(amt(spiced, "nourishment")).toBeGreaterThan(amt(plain, "nourishment"));
    expect(spiced.effects.some((e) => (e.channel as string) === "spice")).toBe(false);
  });

  it("quantity is potency but capped: 20 barley cooks like 5 (no larder dump)", () => {
    const five = cook("simmer", Array.from({ length: MAX_PER_INGREDIENT }, () => "barley"));
    const twenty = cook("simmer", Array.from({ length: 20 }, () => "barley"));
    expect(amt(twenty, "nourishment")).toBe(amt(five, "nourishment"));
    expect(clampIngredients(Array.from({ length: 20 }, () => "barley")).length).toBe(MAX_PER_INGREDIENT);
  });
});

describe("named dishes — the tier-1 staples", () => {
  it("every named dish uses real ingredients", () => {
    for (const d of NAMED_DISHES) {
      for (const id of d.ingredientIds) {
        expect(getFoodIngredient(id), `${d.name} → ${id}`).toBeTruthy();
      }
    }
  });

  it("matches a staple by technique + ingredients, order/quantity independent", () => {
    // Hearth Stew = simmer(venison + nuts); reversed + doubled still matches.
    expect(matchNamedDish("simmer", ["nuts", "venison"])?.name).toBe("Hearth Stew");
    expect(matchNamedDish("simmer", ["venison", "venison", "nuts"])?.name).toBe("Hearth Stew");
    // The same ingredients cooked a DIFFERENT way is not the Hearth Stew.
    expect(matchNamedDish("roast", ["venison", "nuts"])).toBeUndefined();
  });

  it("each named dish has a unique id", () => {
    const ids = NAMED_DISHES.map((d) => dishIdFor(d.technique, d.ingredientIds));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
