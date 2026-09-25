import { describe, it, expect } from "vitest";
import { NAMED_DISHES } from "@medieval-realm/shared/data/kitchen/named_dishes";
import { NAMED_RECIPES, namedRecipeId } from "@medieval-realm/shared/data/alchemy/named_recipes";
import { getFoodIngredient } from "@medieval-realm/shared/data/kitchen/ingredients";
import { getIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";

// The census counts the NAMED recipes. A player's own combos are open-ended and
// live in the desk books — you cannot count what has no end.

describe("there is something left to find", () => {
  it("most dishes are discoveries, not gifts", () => {
    const preknown = NAMED_DISHES.filter((d) => d.preknown).length;
    expect(preknown).toBeGreaterThan(0);          // the staples, or a new kitchen is a blank wall
    expect(preknown).toBeLessThan(NAMED_DISHES.length / 2);
  });

  it("most brews are discoveries too", () => {
    // Until 2026-09-25 every named brew was handed over for free, which made the
    // apothecary's book worthless to fill. This is the assertion that pins it.
    const preknown = NAMED_RECIPES.filter((r) => r.preknown).length;
    expect(preknown).toBeGreaterThan(0);
    expect(preknown).toBeLessThan(NAMED_RECIPES.length);
  });

  it("the worked examples a newcomer needs are makeable at a camp", () => {
    // A pre-known recipe that needs a station you do not have teaches nothing.
    const campStations = new Set(["boil", "crush"]);
    for (const r of NAMED_RECIPES.filter((x) => x.preknown)) {
      for (const pl of r.placements) {
        expect(campStations.has(pl.technique), `${r.name} needs a ${pl.technique} station`).toBe(true);
      }
    }
  });
});

describe("every entry can actually be rendered", () => {
  it("a dish's ingredients all resolve", () => {
    for (const d of NAMED_DISHES) {
      expect(d.slots.length, `${d.id} has no slots`).toBeGreaterThan(0);
      for (const slot of d.slots) {
        for (const id of slot.anyOf) {
          expect(getFoodIngredient(id), `${d.id} wants ${id}, which is not an ingredient`).toBeDefined();
        }
      }
    }
  });

  it("a brew's ingredients all resolve, and its id is stable", () => {
    const ids = new Set<string>();
    for (const r of NAMED_RECIPES) {
      for (const pl of r.placements) {
        expect(getIngredient(pl.ingredientId), `${r.name} wants ${pl.ingredientId}`).toBeDefined();
      }
      const id = namedRecipeId(r);
      expect(id).toBe(namedRecipeId(r));          // deterministic
      expect(ids.has(id), `${r.name} collides with another recipe`).toBe(false);
      ids.add(id);
    }
  });

  it("dish ids are unique, since the census keys on them", () => {
    const ids = NAMED_DISHES.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
