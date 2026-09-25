import { describe, it, expect } from "vitest";
import { HERBIER_PLANTS, getHerbierPlant, herbierOrder } from "@medieval-realm/shared/data/herbier/registry";
import { FORAGE_PLANTS, isDecoy } from "@medieval-realm/shared/data/foraging/plants";
import { INGREDIENTS } from "@medieval-realm/shared/data/alchemy/ingredients";
import { LIVE_TECHNIQUES } from "@medieval-realm/shared/data/alchemy/types";
import { describeCooked } from "@medieval-realm/shared/data/kitchen/cook";

// The Herbier covers what the Lord FINDS, not what he sows. These assert the
// shape of that list, never a count that would break every time a plant is
// added — except where the count IS the rule (every forage plant has a page).

describe("what is in the book", () => {
  it("every plant from the woods has a page, decoys included", () => {
    for (const p of FORAGE_PLANTS) {
      expect(getHerbierPlant(p.id), `${p.id} has no herbier page`).toBeDefined();
    }
  });

  it("every plant on the alchemy shelf has a page", () => {
    const notPlants = new Set(["bone", "snake_oil", "serpent_fang", "tusk_shard", "honey"]);
    for (const ing of INGREDIENTS) {
      if (notPlants.has(ing.id)) continue;
      expect(getHerbierPlant(ing.id), `${ing.id} has no herbier page`).toBeDefined();
    }
  });

  it("nothing that never grew gets a page", () => {
    // A herbarium with a tusk shard in it stops being a herbarium.
    for (const id of ["bone", "snake_oil", "serpent_fang", "tusk_shard", "honey"]) {
      expect(getHerbierPlant(id), `${id} should not be in a herbarium`).toBeUndefined();
    }
  });

  it("nothing farmed gets a page: he does not misidentify what he planted", () => {
    for (const id of ["wheat", "barley", "cabbages", "turnips", "peas", "apples", "pears"]) {
      expect(getHerbierPlant(id), `${id} is sown, not found`).toBeUndefined();
    }
  });

  it("ids are unique, so the three sources really do not collide", () => {
    const ids = HERBIER_PLANTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the mimics", () => {
  it("every impostor apes a plant that actually exists", () => {
    for (const p of HERBIER_PLANTS) {
      if (!p.mimicOf) continue;
      expect(getHerbierPlant(p.mimicOf), `${p.id} apes ${p.mimicOf}, which has no page`).toBeDefined();
    }
  });

  it("mimickedBy is the exact inverse of mimicOf", () => {
    // The test that catches a decoy left pointing at a plant that was renamed.
    for (const p of HERBIER_PLANTS) {
      for (const impostorId of p.mimickedBy) {
        expect(getHerbierPlant(impostorId)?.mimicOf).toBe(p.id);
      }
      if (p.mimicOf) {
        expect(getHerbierPlant(p.mimicOf)?.mimickedBy).toContain(p.id);
      }
    }
  });

  it("the pairs the woods actually hold are all present", () => {
    const pairs = HERBIER_PLANTS.filter((p) => p.mimicOf).map((p) => `${p.id}->${p.mimicOf}`);
    expect(pairs.sort()).toEqual([
      "bitter_bolete->cepe",
      "deadly_dapperling->parasol",
      "false_chanterelle->chanterelle",
      "false_morel->morel",
      "galerina->velvet_shank",
      "hemlock->wild_carrot",
      "lily_of_the_valley->ramsons",
    ]);
  });

  it("both halves of every pair carry a line to tell them apart", () => {
    // The identification text is Edda's note; without it the comparison is empty.
    for (const p of HERBIER_PLANTS) {
      if (!p.mimicOf) continue;
      expect(p.forage?.note, `${p.id} has no tell`).toBeTruthy();
      expect(getHerbierPlant(p.mimicOf)?.forage?.note, `${p.mimicOf} has no tell`).toBeTruthy();
    }
  });

  it("a decoy yields nothing, and the registry agrees with the data", () => {
    for (const p of HERBIER_PLANTS) {
      if (!p.forage) continue;
      expect(isDecoy(p.id)).toBe(p.forage.yields == null);
    }
  });
});

describe("the order the book runs in", () => {
  it("lists every plant exactly once", () => {
    expect(herbierOrder().map((p) => p.id).sort()).toEqual(HERBIER_PLANTS.map((p) => p.id).sort());
  });

  it("puts each impostor directly after the plant it apes", () => {
    const order = herbierOrder();
    for (const p of order) {
      if (!p.mimicOf) continue;
      const i = order.findIndex((x) => x.id === p.id);
      expect(order[i - 1]?.id, `${p.id} should sit right after ${p.mimicOf}`).toBe(p.mimicOf);
    }
  });
});

describe("the kitchen half reads as words, not a spreadsheet", () => {
  it("says something useful for every preparation an ingredient allows", () => {
    for (const p of HERBIER_PLANTS) {
      const ing = p.kitchen;
      if (!ing) continue;
      for (const t of ing.techniques ?? []) {
        const text = describeCooked(ing, t);
        expect(text.length, `${p.id} ${t} says nothing`).toBeGreaterThan(0);
        // Dish effects stay mild and cozy: a page that read "nourish 2.4" would
        // turn supper into a min-max obligation, which is the whole thing this
        // is meant not to be.
        expect(text, `${p.id} ${t} leaked a number`).not.toMatch(/\d/);
      }
    }
  });

  it("the same ingredient reads differently for different preparations", () => {
    const ramsons = getHerbierPlant("ramsons")!.kitchen!;
    expect(describeCooked(ramsons, "chop")).not.toBe(describeCooked(ramsons, "boil"));
  });

  it("a spice says it lifts what it sits with, rather than claiming to feed anyone", () => {
    const spice = HERBIER_PLANTS.find((p) => p.kitchen?.amplify);
    if (!spice) return; // no spice is a plant today; the rule still holds if one becomes one
    expect(describeCooked(spice.kitchen!, spice.kitchen!.signature ?? "chop")).toContain("Lifts");
  });
});

describe("the two crafts cannot collide on a technique name", () => {
  it("boil means one thing on the bench and another in the pot", () => {
    // Both craft's technique sets contain "boil", which is why the save keeps
    // herbierTried and herbierCooked as separate lists rather than one.
    expect(LIVE_TECHNIQUES).toContain("boil");
    const ramsons = getHerbierPlant("ramsons")!;
    expect(ramsons.kitchen?.techniques).toContain("boil");
    expect(ramsons.alchemy).toBeUndefined(); // and it is not on the shelf at all
  });
});
