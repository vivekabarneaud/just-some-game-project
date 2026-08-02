import { describe, it, expect } from "vitest";
import { brew, recipeIdFor } from "@medieval-realm/shared/data/alchemy/brew";
import { NAMED_RECIPES, matchNamedRecipe } from "@medieval-realm/shared/data/alchemy/named_recipes";
import { getIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";
import { summarizeRecovery, easeHoursFor } from "@medieval-realm/shared/data/alchemy/apply";
import type { Placement } from "@medieval-realm/shared/data/alchemy/types";

const p = (ingredientId: string, technique: Placement["technique"]): Placement => ({ ingredientId, technique });
const amt = (r: ReturnType<typeof brew>, ch: string) => r.effects.find((e) => e.channel === ch)?.amount ?? 0;

describe("brew — the free-form alchemy engine", () => {
  it("an empty pot is an empty vessel", () => {
    expect(brew([]).name).toBe("Empty Vessel");
    expect(brew([{ ingredientId: "", technique: "boil" }]).effects).toEqual([]);
  });

  it("chamomile steeped alone is a fine, gentle recovery tonic (a base needs no base)", () => {
    const r = brew([p("chamomile", "steep")]);
    expect(r.quality).toBe("fine");
    expect(amt(r, "general_recovery")).toBeGreaterThan(0); // one effect per technique now
  });

  it("a hero with no base carries thin and harsh (the anti-'5 heroes' lever)", () => {
    const withBase = brew([p("chamomile", "steep"), p("feverfew", "steep")]);
    const withoutBase = brew([p("feverfew", "steep")]);
    expect(withoutBase.quality).toBe("rough");
    expect(withoutBase.notes.some((n) => n.toLowerCase().includes("base"))).toBe(true);
    // The same feverfew eases fever LESS without a base to carry it.
    expect(amt(withoutBase, "ease_fever")).toBeLessThan(amt(withBase, "ease_fever"));
  });

  it("honey (steeped, raw) amplifies the other effects", () => {
    const plain = brew([p("chamomile", "steep"), p("feverfew", "steep")]);
    const honeyed = brew([p("chamomile", "steep"), p("feverfew", "steep"), p("honey", "steep")]);
    expect(honeyed.notes.some((n) => n.toLowerCase().includes("amplif"))).toBe(true);
    expect(amt(honeyed, "ease_fever")).toBeGreaterThan(amt(plain, "ease_fever"));
  });

  it("technique changes the output: mugwort boiled → INT sustained; distilled → INT burst", () => {
    const boiled = brew([p("chamomile", "steep"), p("mugwort", "boil")]);
    const distilled = brew([p("chamomile", "steep"), p("mugwort", "distil")]);
    // Boil is sustained (no shape flag); distil is a burst with rounds.
    const boilInt = boiled.effects.find((e) => e.channel === "int");
    const distInt = distilled.effects.find((e) => e.channel === "int");
    expect(boilInt?.shape).toBeUndefined();
    expect(distInt?.shape).toBe("burst");
    expect(distInt?.rounds).toBeGreaterThan(0);
    expect(distInt!.amount).toBeGreaterThan(boilInt!.amount); // burst peaks higher
  });

  it("the same toxin plant is safe or nasty by technique: nettle boiled nourishes, crushed poisons", () => {
    const boiled = brew([p("nettle", "boil")]);
    const crushed = brew([p("nettle", "crush")]);
    expect(amt(boiled, "poison")).toBe(0);
    expect(amt(boiled, "vit")).toBeGreaterThan(0); // boiled → a nourishing tonic
    expect(amt(crushed, "poison")).toBeGreaterThan(0);
  });

  it("a wildcard's potent effect + the wildcard note", () => {
    const r = brew([p("chamomile", "steep"), p("witchs_cap", "boil")]);
    expect(amt(r, "int")).toBeGreaterThan(0);
    expect(r.notes.some((n) => n.toLowerCase().includes("wildcard"))).toBe(true);
  });

  it("names the brew from its dominant effect + form (crush → Salve, poison → Poison)", () => {
    expect(brew([p("yarrow", "crush")]).name).toContain("Salve");
    expect(brew([p("nightshade", "crush")]).name).toContain("Poison"); // clean poison coating
  });

  it("a wrong technique is mostly wasted (faint generic only) and says so", () => {
    const r = brew([p("chamomile", "boil")]); // chamomile isn't for boiling
    expect(r.notes.some((n) => n.toLowerCase().includes("wasn't made for"))).toBe(true);
  });

  it("quantity is potency: more of the same plant heals more (diminishing, capped)", () => {
    const one = brew([p("chamomile", "crush")]);
    const five = brew(Array.from({ length: 5 }, () => p("chamomile", "crush")));
    expect(amt(five, "heal_hp")).toBeGreaterThan(amt(one, "heal_hp"));
    // Diminishing returns: five doses are worth well under 5x a single dose.
    expect(amt(five, "heal_hp")).toBeLessThan(amt(one, "heal_hp") * 5);
  });
});

describe("named recipes — curated combos the settlement knows", () => {
  it("every named recipe uses real ingredients", () => {
    for (const r of NAMED_RECIPES) {
      for (const pl of r.placements) {
        expect(getIngredient(pl.ingredientId), `${r.name} → ${pl.ingredientId}`).toBeTruthy();
      }
    }
  });

  it("matches a combo order-independently and returns its lore name", () => {
    const fever = NAMED_RECIPES.find((r) => r.name === "Fever Tonic")!;
    const reversed = [...fever.placements].reverse();
    expect(matchNamedRecipe(reversed)?.name).toBe("Fever Tonic");
    // A different combo isn't the Fever Tonic.
    expect(matchNamedRecipe([p("nightshade", "distil")])).toBeUndefined();
  });

  it("each named recipe's ids are unique (no two combos collide)", () => {
    const ids = NAMED_RECIPES.map((r) => recipeIdFor(r.placements));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("identity ignores quantity: extra plant still matches the same recipe + id", () => {
    const salve = NAMED_RECIPES.find((r) => r.name === "Woundwort Salve")!;
    // Double every ingredient — a stronger batch, but the SAME recipe.
    const doubled = salve.placements.flatMap((pl) => [pl, pl]);
    expect(matchNamedRecipe(doubled)?.name).toBe("Woundwort Salve");
    expect(recipeIdFor(doubled)).toBe(recipeIdFor(salve.placements));
  });

  it("brewing a named recipe's placements yields real effects (a Fever Tonic eases fever)", () => {
    const fever = NAMED_RECIPES.find((r) => r.name === "Fever Tonic")!;
    const r = brew(fever.placements);
    expect(r.effects.some((e) => e.channel === "ease_fever")).toBe(true);
  });
});

describe("recovery application — what a brew does at home", () => {
  it("a Fever Tonic eases the fever line most, and nothing for wounds beyond the general part", () => {
    const fever = NAMED_RECIPES.find((r) => r.name === "Fever Tonic")!;
    const sum = summarizeRecovery(brew(fever.placements).effects);
    // Fever is its point; it beats the gut easing chamomile brings along.
    expect(easeHoursFor(sum, "fever")).toBeGreaterThan(easeHoursFor(sum, "gut"));
    // No wound easing beyond the line-agnostic general recovery.
    expect(easeHoursFor(sum, "wound")).toBe(sum.general);
  });

  it("a Woundwort Salve heals HP and eases the wound line", () => {
    const salve = NAMED_RECIPES.find((r) => r.name === "Woundwort Salve")!;
    const sum = summarizeRecovery(brew(salve.placements).effects);
    expect(sum.healHp).toBeGreaterThan(0);
    expect(easeHoursFor(sum, "wound")).toBeGreaterThan(0);
  });
});
