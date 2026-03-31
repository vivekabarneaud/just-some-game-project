// ─── Item system ────────────────────────────────────────────────

export type ItemSlot = "weapon" | "armor" | "trinket";

import type { AdventurerClass } from "./adventurers";

export interface ItemDefinition {
  id: string;
  name: string;
  icon: string;
  slot: ItemSlot;
  description: string;
  /** Which classes can equip this item. Empty array = all classes */
  classes: AdventurerClass[];
  /** Flat bonus to mission success % */
  successBonus: number;
  /** Flat reduction to death chance % */
  deathReduction: number;
  /** Duration reduction multiplier (0.9 = 10% faster) */
  durationMod: number;
  /** Bonus loot multiplier (1.1 = 10% more) */
  lootMod: number;
  /** Which crafting recipe produces this item */
  recipeId: string;
  /** Consumable = destroyed after one mission (potions) */
  consumable: boolean;
}

export const ITEMS: ItemDefinition[] = [
  // ── Swords (Blacksmith) — warrior, assassin ───────────────────
  {
    id: "iron_sword", name: "Iron Sword", icon: "⚔️", slot: "weapon",
    description: "+5% success",
    classes: ["warrior", "assassin"],
    successBonus: 5, deathReduction: 0, durationMod: 1, lootMod: 1,
    recipeId: "iron_sword", consumable: false,
  },
  {
    id: "steel_sword", name: "Steel Sword", icon: "🗡️", slot: "weapon",
    description: "+10% success, +5% loot",
    classes: ["warrior", "assassin"],
    successBonus: 10, deathReduction: 0, durationMod: 1, lootMod: 1.05,
    recipeId: "steel_sword", consumable: false,
  },

  // ── Staves (Woodworker) — wizard, priest ──────────────────────
  {
    id: "wooden_staff", name: "Wooden Staff", icon: "🪄", slot: "weapon",
    description: "+4% success",
    classes: ["wizard", "priest"],
    successBonus: 4, deathReduction: 0, durationMod: 1, lootMod: 1,
    recipeId: "wooden_staff", consumable: false,
  },
  {
    id: "enchanted_staff", name: "Enchanted Staff", icon: "✨", slot: "weapon",
    description: "+12% success, -15% duration",
    classes: ["wizard", "priest"],
    successBonus: 12, deathReduction: 0, durationMod: 0.85, lootMod: 1,
    recipeId: "enchanted_staff", consumable: false,
  },

  // ── Bows (Woodworker) — archer ────────────────────────────────
  {
    id: "hunting_bow", name: "Hunting Bow", icon: "🏹", slot: "weapon",
    description: "+6% success",
    classes: ["archer"],
    successBonus: 6, deathReduction: 0, durationMod: 1, lootMod: 1,
    recipeId: "hunting_bow", consumable: false,
  },
  {
    id: "longbow", name: "Longbow", icon: "🎯", slot: "weapon",
    description: "+10% success, +5% loot",
    classes: ["archer"],
    successBonus: 10, deathReduction: 0, durationMod: 1, lootMod: 1.05,
    recipeId: "longbow", consumable: false,
  },

  // ── Heavy armor (Blacksmith) — warrior ────────────────────────
  {
    id: "iron_shield", name: "Iron Shield", icon: "🛡️", slot: "armor",
    description: "-8% death chance",
    classes: ["warrior"],
    successBonus: 0, deathReduction: 8, durationMod: 1, lootMod: 1,
    recipeId: "iron_shield", consumable: false,
  },
  {
    id: "iron_armor", name: "Iron Armor", icon: "🦺", slot: "armor",
    description: "-12% death, +3% success",
    classes: ["warrior"],
    successBonus: 3, deathReduction: 12, durationMod: 1, lootMod: 1,
    recipeId: "iron_armor", consumable: false,
  },
  {
    id: "chainmail", name: "Chainmail Armor", icon: "⛓️", slot: "armor",
    description: "-15% death, +5% success",
    classes: ["warrior", "archer", "assassin"],
    successBonus: 5, deathReduction: 15, durationMod: 1, lootMod: 1,
    recipeId: "chainmail", consumable: false,
  },

  // ── Light armor (Woodworker) — all classes ────────────────────
  {
    id: "wooden_shield", name: "Wooden Shield", icon: "🪵", slot: "armor",
    description: "-6% death chance",
    classes: ["warrior", "archer", "assassin"],
    successBonus: 0, deathReduction: 6, durationMod: 1, lootMod: 1,
    recipeId: "wooden_shield", consumable: false,
  },

  // ── Robes (Tailoring) — wizard, priest ────────────────────────
  {
    id: "priest_robes", name: "Priest Robes", icon: "🥋", slot: "armor",
    description: "-10% death, +5% on survival",
    classes: ["priest"],
    successBonus: 0, deathReduction: 10, durationMod: 1, lootMod: 1,
    recipeId: "priest_robes", consumable: false,
  },
  {
    id: "wizard_robes", name: "Wizard Robes", icon: "🧙", slot: "armor",
    description: "-8% death, -10% duration",
    classes: ["wizard"],
    successBonus: 0, deathReduction: 8, durationMod: 0.9, lootMod: 1,
    recipeId: "wizard_robes", consumable: false,
  },

  // ── Trinkets — all classes ────────────────────────────────────
  {
    id: "iron_tools_equip", name: "Iron Tools", icon: "🔧", slot: "trinket",
    description: "-10% duration, +5% loot",
    classes: [],
    successBonus: 0, deathReduction: 0, durationMod: 0.9, lootMod: 1.05,
    recipeId: "iron_tools", consumable: false,
  },

  // ── Potions (Alchemy) — all classes, consumable ───────────────
  {
    id: "healing_potion_equip", name: "Healing Potion", icon: "❤️", slot: "trinket",
    description: "-15% death (consumed)",
    classes: [],
    successBonus: 0, deathReduction: 15, durationMod: 1, lootMod: 1,
    recipeId: "healing_potion", consumable: true,
  },
  {
    id: "strength_elixir_equip", name: "Strength Elixir", icon: "💪", slot: "trinket",
    description: "+8% success (consumed)",
    classes: [],
    successBonus: 8, deathReduction: 0, durationMod: 1, lootMod: 1,
    recipeId: "strength_elixir", consumable: true,
  },
  {
    id: "antidote_equip", name: "Antidote", icon: "🧪", slot: "trinket",
    description: "-10% death (consumed)",
    classes: [],
    successBonus: 0, deathReduction: 10, durationMod: 1, lootMod: 1,
    recipeId: "antidote", consumable: true,
  },
];

export function getItem(id: string): ItemDefinition | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function getItemByRecipe(recipeId: string): ItemDefinition | undefined {
  return ITEMS.find((i) => i.recipeId === recipeId);
}

export function getItemsForSlot(slot: ItemSlot, adventurerClass?: AdventurerClass): ItemDefinition[] {
  return ITEMS.filter((i) => {
    if (i.slot !== slot) return false;
    if (adventurerClass && i.classes.length > 0 && !i.classes.includes(adventurerClass)) return false;
    return true;
  });
}

// ─── Inventory item instance ────────────────────────────────────

export interface InventoryItem {
  itemId: string;
  quantity: number;
}
