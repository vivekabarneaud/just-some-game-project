import { describe, it, expect } from "vitest";
import { brew } from "@medieval-realm/shared/data/alchemy/brew";
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
    expect(amt(r, "ease_gut")).toBeGreaterThan(0);
    expect(amt(r, "happiness")).toBeGreaterThan(0);
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
    expect(amt(boiled, "general_recovery")).toBeGreaterThan(0);
    expect(amt(crushed, "poison")).toBeGreaterThan(0);
  });

  it("a wildcard rides its own risk along (potency laced with a downside)", () => {
    const r = brew([p("chamomile", "steep"), p("witchs_cap", "boil")]);
    expect(amt(r, "int")).toBeGreaterThan(0);
    expect(amt(r, "poison")).toBeGreaterThan(0); // the risk is baked in
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
});
