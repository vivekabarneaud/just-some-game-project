import { describe, it, expect } from "vitest";
import { matchNamedDish, NAMED_DISHES, FOOD_GROUPS } from "@medieval-realm/shared/data/kitchen/named_dishes";
import type { CookPlacement } from "@medieval-realm/shared/data/kitchen/types";

// The three dishes designed 2026-08-31 and authored 2026-09-08 (IDEAS.md,
// "buildable the moment someone wants to"). These are pure data assertions:
// which combination resolves to which name, and that the new one-slot dish
// does not swallow the specific two-slot dishes it sits beside.

const pot = (...pairs: [string, string][]): CookPlacement[] =>
  pairs.map(([ingredientId, technique], i) => ({ ingredientId, technique, slot: i } as CookPlacement));

const nameOf = (...pairs: [string, string][]) => matchNamedDish(pot(...pairs))?.name;

describe("the bolete + fried-mushroom batch", () => {
  it("all three exist, with a note that promises only what the slots require", () => {
    for (const id of ["dish_fried_mushrooms", "dish_roast_bolete_caps", "dish_bolete_barley"]) {
      const d = NAMED_DISHES.find((x) => x.id === id);
      expect(d, `${id} must be authored`).toBeTruthy();
      expect(d!.note.length).toBeGreaterThan(20);
    }
    // "A note must not promise what its slot doesn't require" (user, 2026-08-31):
    // Fried Mushrooms accepts ANY mushroom, so its note must not name one.
    const fried = NAMED_DISHES.find((x) => x.id === "dish_fried_mushrooms")!;
    for (const m of FOOD_GROUPS.mushroom) {
      expect(fried.note.toLowerCase()).not.toContain(m.replace("_", " "));
    }
  });

  it("Fried Mushrooms covers every mushroom in the group — one entry, not four", () => {
    for (const m of FOOD_GROUPS.mushroom) {
      expect(nameOf([m, "fry"]), `${m} fried`).toBe("Fried Mushrooms");
    }
    // Morels are deliberately included: their signature is Morel Cream.
    expect(nameOf(["morel", "fry"], ["milk", "boil"])).toBe("Morel Cream");
  });

  it("does NOT swallow the specific fried dishes beside it", () => {
    expect(nameOf(["cepe", "fry"], ["ramsons", "fry"])).toBe("Bolete Fry");
    expect(nameOf(["eggs", "fry"], ["field_mushroom", "fry"])).toBe("Mushroom Omelet");
  });

  it("technique is what separates the three cep dishes", () => {
    expect(nameOf(["cepe", "roast"])).toBe("Roast Bolete Caps");
    expect(nameOf(["cepe", "fry"])).toBe("Fried Mushrooms");
    expect(nameOf(["cepe", "skewer"])).toBe("Fire-Charred Mushrooms");
  });

  it("Bolete Caps and Barley needs the caps ROASTED — boiled is still Pottage", () => {
    expect(nameOf(["cepe", "roast"], ["barley", "boil"])).toBe("Bolete Caps and Barley");
    expect(nameOf(["cepe", "boil"], ["barley", "boil"])).toBe("Mushroom Pottage");
  });

  it("the two discoveries stay hidden; frying mushrooms is common knowledge", () => {
    const byId = (id: string) => NAMED_DISHES.find((x) => x.id === id)!;
    expect(byId("dish_fried_mushrooms").preknown).toBe(true);
    expect(byId("dish_roast_bolete_caps").preknown).toBeFalsy();
    expect(byId("dish_bolete_barley").preknown).toBeFalsy();
  });
});
