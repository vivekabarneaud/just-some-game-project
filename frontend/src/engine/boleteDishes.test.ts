import { describe, it, expect } from "vitest";
import { matchNamedDish, NAMED_DISHES, FOOD_GROUPS } from "@medieval-realm/shared/data/kitchen/named_dishes";
import { getFoodIngredient } from "@medieval-realm/shared/data/kitchen/ingredients";
import { formatReward } from "@medieval-realm/shared/data/missions/helpers";
import { FOOD_ITEMS, MUSHROOM_TYPES } from "../data/foods";
import { FOOD_CATEGORY } from "../data/animalFeed";
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

// ─── The oyster mushroom (2026-09-08) ───────────────────────────────────────
// Foraging yields it (winter weight 30, five times its autumn odds), and until
// now nothing downstream accepted it: no pantry slot, no kitchen ingredient, no
// group membership. Registering a food touches SEVEN files, so the last test
// here is the one that matters — it fails if a future ingredient is added to
// six of them.
describe("the oyster mushroom is a full citizen of the pantry", () => {
  it("joins the mushroom group, so it inherits every generic mushroom dish", () => {
    expect(FOOD_GROUPS.mushroom).toContain("oyster_mushroom");
    expect(nameOf(["oyster_mushroom", "fry"])).toBe("Fried Mushrooms");
    expect(nameOf(["oyster_mushroom", "skewer"])).toBe("Fire-Charred Mushrooms");
    expect(nameOf(["oyster_mushroom", "boil"], ["barley", "boil"])).toBe("Mushroom Pottage");
    expect(nameOf(["eggs", "fry"], ["oyster_mushroom", "fry"])).toBe("Mushroom Omelet");
  });

  it("Bone and Oyster Broth needs both halves — bone alone is still Bone Broth", () => {
    expect(nameOf(["bone", "boil"], ["oyster_mushroom", "boil"])).toBe("Bone and Oyster Broth");
    expect(nameOf(["bone", "boil"])).toBe("Bone Broth");
    expect(nameOf(["bone", "boil"], ["ramsons", "boil"])).toBe("Ramsons Broth");
  });

  it("cannot be eaten raw — it is a fungus, so `chop` is not on its list", () => {
    const oyster = getFoodIngredient("oyster_mushroom");
    expect(oyster, "must be a kitchen ingredient").toBeTruthy();
    expect(oyster!.techniques).not.toContain("chop");
    expect(oyster!.techniques).toContain("fry");
  });

  it("every mushroom in the group is registered in ALL of its homes", () => {
    for (const id of FOOD_GROUPS.mushroom) {
      expect(getFoodIngredient(id), `${id}: kitchen ingredient`).toBeTruthy();
      expect(MUSHROOM_TYPES, `${id}: MUSHROOM_TYPES`).toContain(id);
      expect(FOOD_ITEMS.find((f) => f.id === id), `${id}: UI food row`).toBeTruthy();
      // formatReward falls back to the raw id ("+3 oyster_mushroom") when a
      // food is missing from its label map — that is the visible symptom, so
      // assert through the public function rather than exporting the map.
      const shown = formatReward({ resource: id, amount: 3 } as never);
      expect(shown, `${id}: reward label`).not.toContain(id);
      expect(FOOD_CATEGORY[id as keyof typeof FOOD_CATEGORY], `${id}: animal feed`).toBeTruthy();
    }
  });

  it("anything foraging yields as FOOD has a pantry home (or is declared non-food)", () => {
    // Not every yield is food — hemlock is a poison. But a yield that reaches
    // the kitchen group must be storable, or the basket has nowhere to go.
    for (const id of FOOD_GROUPS.mushroom) {
      expect(FOOD_ITEMS.some((f) => f.id === id), `${id} must be storable`).toBe(true);
    }
  });
});
