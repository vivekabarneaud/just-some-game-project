import { describe, it, expect } from "vitest";
import { buildAdventurerUnit } from "@medieval-realm/shared/data/combat";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import { getItem, getItemByRecipe } from "@medieval-realm/shared/data/items";
import { CRAFTING_RECIPES } from "./crafting";

// The 11 wolf/boar pieces authored from DESIGN_TIER1_GEAR.md.
const NEW_GEAR = [
  "greypelt_jerkin", "wolfhide_treads", "hunters_cloak", "fang_gauntlets",
  "bristlehide_hauberk", "bristlehide_greaves", "tusked_boar_hood", "bristlehide_shoes",
  "crude_fang_dagger", "fang_dagger", "tusk_dagger",
];

const warrior = (id: string) => buildRecruitFromPremadeId(id, "char_021", 3)!; // leather-capable

describe("wolf/boar gear — craftable and wired", () => {
  it("every new item has a recipe that resolves back to it on craft completion", () => {
    for (const id of NEW_GEAR) {
      const item = getItem(id);
      expect(item, `item ${id} exists`).toBeTruthy();
      const recipe = CRAFTING_RECIPES.find((r) => r.id === item!.recipeId);
      expect(recipe, `recipe for ${id}`).toBeTruthy();
      // gameState craft-completion calls getItemByRecipe(recipe.id) — must map back.
      expect(getItemByRecipe(recipe!.id)?.id).toBe(id);
    }
  });

  it("the boar hauberk's +5 Presence and fang gauntlets' +3 Crit reach the combat unit", () => {
    const a = warrior("t");
    a.equipment.chest = "bristlehide_hauberk";
    a.equipment.gloves = "fang_gauntlets";
    const unit = buildAdventurerUnit(a);
    expect(unit.raw?.presence).toBe(5);
    expect(unit.raw?.crit).toBe(3);
    // +5 Presence lifts the tank's threat pull above a bare warrior.
    expect(unit.threatMultiplier).toBeGreaterThan(buildAdventurerUnit(warrior("t2")).threatMultiplier);
  });

  it("the Hunter's Cloak -5 Presence sheds threat", () => {
    const a = warrior("c");
    a.equipment.cloak = "hunters_cloak";
    expect(buildAdventurerUnit(a).threatMultiplier)
      .toBeLessThan(buildAdventurerUnit(warrior("c2")).threatMultiplier);
  });
});
