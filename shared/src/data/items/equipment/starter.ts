// ─── Starter / worn gear (0-stat, not craftable) ───
// Split by item type (see items/equipment/index.ts). Rarity is the field.

import type { ItemDefinition } from "../types.js";

export const STARTER_GEAR: ItemDefinition[] = [
  {
    id: "worn_bow", rarity: "common", name: "Worn Bow", icon: "🏹", slot: "mainHand", weaponType: "bow", twoHanded: true,
    description: "", flavor: "A well-worn hunting bow. It has fed the table and kept the crows off the barley more winters than not.",
    classes: ["archer"], stats: {}, dmgMin: 3, dmgMax: 5, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "plain_sword", rarity: "common", name: "Plain Sword", icon: "⚔️", slot: "mainHand", weaponType: "sword",
    description: "", flavor: "A plain, notched blade. Nothing fine about it, but it holds an edge.",
    classes: ["warrior"], stats: {}, dmgMin: 3, dmgMax: 5, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "worn_dagger", rarity: "common", name: "Worn Dagger", icon: "🔪", slot: "mainHand", weaponType: "dagger",
    description: "", flavor: "A worn utility knife, kept sharp out of habit.",
    classes: ["assassin"], stats: {}, dmgMin: 2, dmgMax: 4, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "plain_staff", rarity: "common", name: "Plain Staff", icon: "🪵", slot: "mainHand", weaponType: "staff", twoHanded: true,
    description: "", flavor: "A plain walking staff, smooth where a hand has held it for years.",
    classes: ["wizard", "priest"], stats: {}, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "cloth_hood", rarity: "common", name: "Cloth Hood", icon: "🧢", slot: "head", armorType: "cloth",
    description: "+2 DEF", flavor: "A simple cloth hood against the weather.",
    classes: [], stats: {}, defense: 2, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "patched_leather", rarity: "common", name: "Patched Leathers", icon: "🟫", slot: "chest", armorType: "leather",
    description: "+6 DEF", flavor: "A patched leather jerkin, much mended. It has seen a few winters.",
    classes: [], stats: {}, defense: 6, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "worn_chainmail", rarity: "common", name: "Worn Chainmail", icon: "⛓️", slot: "chest", armorType: "mail",
    description: "+35 DEF", flavor: "An old coat of mail, rings gone dull. Heavy and much-mended, but it has turned a blade before.",
    classes: [], stats: {}, defense: 35, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "homespun_robe", rarity: "common", name: "Homespun Robe", icon: "🧶", slot: "chest", armorType: "cloth",
    description: "+4 DEF", flavor: "A plain homespun robe, warm enough and no more.",
    classes: ["wizard", "priest"], stats: {}, defense: 4, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
];
