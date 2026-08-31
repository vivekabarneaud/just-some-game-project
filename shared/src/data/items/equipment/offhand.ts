// ─── Off-hand (shields, focuses, quivers) ───
// Split by item type (see items/equipment/index.ts). Rarity is the field.

import type { ItemDefinition } from "../types.js";

export const OFFHAND: ItemDefinition[] = [
  {
    id: "iron_shield", rarity: "uncommon", name: "Iron Shield", icon: "🛡️", slot: "offHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/iron_shield.png",
    description: "+2 VIT, 45 DEF",
    classes: [], armorType: "plate",
    stats: { vit: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_shield", consumable: false, defense: 45,
  },
  {
    id: "wooden_shield", rarity: "common", name: "Wooden Shield", icon: "🪵", slot: "offHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woodworker/wooden_shield.png",
    description: "+1 VIT, 25 DEF",
    classes: ["warrior", "archer", "assassin"],
    stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "wooden_shield", consumable: false, defense: 25,
  },
  {
    id: "prayer_book", rarity: "uncommon", name: "Prayer Book", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/tome_of_power.png", icon: "📖", slot: "offHand",
    description: "+2 WIS, +1 INT. Leather-bound, well-thumbed, with annotations in three languages.",
    classes: ["priest"], stats: { wis: 2, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "prayer_book", consumable: false,
  },
  {
    id: "parrying_dagger", rarity: "common", name: "Parrying Dagger", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/parrying_dagger.png", icon: "🗡️", slot: "offHand",
    description: "+1 DEX, +1 STR, 15 DEF. A wide-bladed dagger built for catching swords, not throwing.",
    classes: ["assassin"], stats: { dex: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "parrying_dagger", consumable: false, defense: 15,
  },
  {
    id: "quiver_precision", rarity: "uncommon", name: "Quiver of Precision", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/enchanted_quiver.png", icon: "🏹", slot: "offHand",
    description: "+2 DEX. Enchanted quiver — arrows slide out nocked and ready. Faster than thinking.",
    classes: ["archer"], stats: { dex: 2 }, durationMod: 1, lootMod: 1, recipeId: "quiver_precision", consumable: false,
  },
];
