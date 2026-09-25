import { describe, it, expect } from "vitest";
import { buildPage, triedKey, recipesFor, HERBIER_LAWS } from "@medieval-realm/shared/data/alchemy/herbier";
import { LIVE_TECHNIQUES } from "@medieval-realm/shared/data/alchemy/types";
import { getIngredient, INGREDIENTS } from "@medieval-realm/shared/data/alchemy/ingredients";
import { brew, recipeIdFor } from "@medieval-realm/shared/data/alchemy/brew";
import { NAMED_RECIPES } from "@medieval-realm/shared/data/alchemy/named_recipes";
import { describeEffectParts } from "@medieval-realm/shared/data/alchemy/describe";
import type { Placement, Technique } from "@medieval-realm/shared/data/alchemy/types";

// The Herbier is the Lord's own notebook: a page the day a plant is in hand, a
// line each time he actually tries something. These assert the RULES of that
// book, never a balance number.

const p = (ingredientId: string, technique: Placement["technique"]): Placement => ({ ingredientId, technique });
const willowbark = getIngredient("willowbark")!;
const honey = getIngredient("honey")!;

describe("the book only ever records what he actually did", () => {
  it("a page he has drawn but never worked with holds no lines at all", () => {
    const page = buildPage(willowbark, new Set());
    expect(page.lines).toEqual([]);
    expect(page.complete).toBe(false);
    expect(page.signature).toBeUndefined();
  });

  it("trying one preparation writes one line, and says nothing about the others", () => {
    const page = buildPage(willowbark, new Set([triedKey("willowbark", "boil")]));
    expect(page.lines.every((l) => l.technique === "boil")).toBe(true);
    expect(page.lines.length).toBeGreaterThan(0);
  });

  it("a preparation the plant was never made for is still a finding, not a blank", () => {
    // Pick a live technique this plant genuinely has no entry for.
    const barren = LIVE_TECHNIQUES.find((t) => !willowbark.techniques[t]);
    expect(barren, "willowbark should lack at least one live technique").toBeDefined();
    const page = buildPage(willowbark, new Set([triedKey("willowbark", barren!)]));
    expect(page.lines).toHaveLength(1);
    expect(page.lines[0].barren).toBe(true);
    expect(page.lines[0].label.length).toBeGreaterThan(0);
  });
});

describe("the parked techniques are genuinely out of the book", () => {
  it("LIVE_TECHNIQUES excludes dry, char and ferment", () => {
    expect(LIVE_TECHNIQUES).not.toContain("dry" as Technique);
    expect(LIVE_TECHNIQUES).not.toContain("char" as Technique);
    expect(LIVE_TECHNIQUES).not.toContain("ferment" as Technique);
  });

  it("a parked preparation never writes a line, even where the data still has one", () => {
    // Some ingredient does author a parked technique; the book must ignore it.
    const withParked = INGREDIENTS.find((i) => i.techniques.char || i.techniques.dry);
    expect(withParked, "the data should still hold parked cells").toBeDefined();
    const parked: Technique = withParked!.techniques.char ? "char" : "dry";
    const page = buildPage(withParked!, new Set([triedKey(withParked!.id, parked)]));
    expect(page.lines).toEqual([]);
  });
});

describe("the signature is the reward for finishing a page", () => {
  it("it is withheld while any live preparation is untried", () => {
    const all = LIVE_TECHNIQUES.map((t) => triedKey("willowbark", t));
    for (let i = 0; i < all.length; i++) {
      const missingOne = new Set(all.filter((_, j) => j !== i));
      expect(buildPage(willowbark, missingOne).signature).toBeUndefined();
    }
  });

  it("trying only the two techniques the lab can actually perform is not enough", () => {
    // The point of the decision: no page can be finished until steep and distil
    // have stations. If this ever passes, the signature became cheap.
    const reachable = new Set([triedKey("willowbark", "boil"), triedKey("willowbark", "crush")]);
    expect(buildPage(willowbark, reachable).complete).toBe(false);
  });

  it("it appears once every live preparation has been tried", () => {
    const all = new Set(LIVE_TECHNIQUES.map((t) => triedKey("willowbark", t)));
    const page = buildPage(willowbark, all);
    expect(page.complete).toBe(true);
    expect(page.signature).toBe(willowbark.signature);
  });
});

describe("the laws of the craft are learned by feeling them go wrong", () => {
  it("every law has an entry to write down", () => {
    const ids = new Set(HERBIER_LAWS.map((l) => l.id));
    expect(ids).toEqual(new Set(["base", "catalyst", "stacking", "wildcard"]));
  });

  it("a hero with no base teaches the base law", () => {
    const res = brew([p("willowbark", "boil")]); // willowbark is a hero
    expect(res.quality).toBe("rough");
    expect(res.laws).toContain("base");
  });

  it("a brew carried by a base teaches nothing about bases", () => {
    const res = brew([p("willowbark", "boil"), p("chamomile", "crush")]);
    expect(res.laws).not.toContain("base");
  });

  it("honey teaches the catalyst law", () => {
    const res = brew([p("chamomile", "crush"), p("willowbark", "boil"), p("honey", honey.signature)]);
    expect(res.laws).toContain("catalyst");
  });

  it("an empty pot teaches nothing", () => {
    expect(brew([]).laws).toEqual([]);
  });
});

describe("cross-links to the recipe book", () => {
  it("a plant lists only the named recipes the player has actually discovered", () => {
    const recipe = NAMED_RECIPES[0];
    const ingId = recipe.placements[0].ingredientId;
    expect(recipesFor(ingId, new Set())).toEqual([]);
    const found = recipesFor(ingId, new Set([recipeIdFor(recipe.placements)]));
    expect(found.map((r) => r.name)).toContain(recipe.name);
  });
});

describe("the modifier channels read as prose", () => {
  it("honey's entry says what it does instead of naming a variable", () => {
    // Honey's whole content is `amplify`; without a case it read
    // "+0.2 amplify for the whole fight".
    const amplify = honey.techniques[honey.signature]?.find((e) => e.channel === "amplify");
    expect(amplify, "honey should carry an amplify effect").toBeDefined();
    const { label } = describeEffectParts(amplify!);
    expect(label).not.toContain("amplify");
    expect(label.length).toBeGreaterThan(0);
  });
});
