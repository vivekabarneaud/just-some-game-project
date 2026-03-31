// ─── Item system ────────────────────────────────────────────────

export type ItemSlot = "weapon" | "armor" | "trinket";

export interface ItemDefinition {
  id: string;
  name: string;
  icon: string;
  slot: ItemSlot;
  description: string;
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
  // ── Weapons (Blacksmith) ──────────────────────────────────────
  {
    id: "iron_sword",
    name: "Iron Sword",
    icon: "⚔️",
    slot: "weapon",
    description: "+5% mission success",
    successBonus: 5,
    deathReduction: 0,
    durationMod: 1,
    lootMod: 1,
    recipeId: "iron_sword",
    consumable: false,
  },
  {
    id: "iron_shield",
    name: "Iron Shield",
    icon: "🛡️",
    slot: "armor",
    description: "-8% death chance",
    successBonus: 0,
    deathReduction: 8,
    durationMod: 1,
    lootMod: 1,
    recipeId: "iron_shield",
    consumable: false,
  },
  {
    id: "iron_armor",
    name: "Iron Armor",
    icon: "🦺",
    slot: "armor",
    description: "-12% death chance, +3% success",
    successBonus: 3,
    deathReduction: 12,
    durationMod: 1,
    lootMod: 1,
    recipeId: "iron_armor",
    consumable: false,
  },
  {
    id: "steel_sword",
    name: "Steel Sword",
    icon: "🗡️",
    slot: "weapon",
    description: "+10% mission success, +5% loot",
    successBonus: 10,
    deathReduction: 0,
    durationMod: 1,
    lootMod: 1.05,
    recipeId: "steel_sword",
    consumable: false,
  },

  // ── Clothing / Robes (Tailoring) ──────────────────────────────
  {
    id: "wool_clothing_equip",
    name: "Wool Cloak",
    icon: "🧥",
    slot: "armor",
    description: "-5% death chance",
    successBonus: 0,
    deathReduction: 5,
    durationMod: 1,
    lootMod: 1,
    recipeId: "wool_clothing",
    consumable: false,
  },
  {
    id: "fine_clothing_equip",
    name: "Fine Vestments",
    icon: "👔",
    slot: "armor",
    description: "-7% death chance, +3% success",
    successBonus: 3,
    deathReduction: 7,
    durationMod: 1,
    lootMod: 1,
    recipeId: "fine_clothing",
    consumable: false,
  },

  // ── Tools (Blacksmith) ────────────────────────────────────────
  {
    id: "iron_tools_equip",
    name: "Iron Tools",
    icon: "🔧",
    slot: "trinket",
    description: "-10% mission duration, +5% loot",
    successBonus: 0,
    deathReduction: 0,
    durationMod: 0.9,
    lootMod: 1.05,
    recipeId: "iron_tools",
    consumable: false,
  },

  // ── Potions (Alchemy) — consumable ────────────────────────────
  {
    id: "healing_potion_equip",
    name: "Healing Potion",
    icon: "❤️",
    slot: "trinket",
    description: "-15% death chance (consumed after mission)",
    successBonus: 0,
    deathReduction: 15,
    durationMod: 1,
    lootMod: 1,
    recipeId: "healing_potion",
    consumable: true,
  },
  {
    id: "strength_elixir_equip",
    name: "Strength Elixir",
    icon: "💪",
    slot: "trinket",
    description: "+8% success (consumed after mission)",
    successBonus: 8,
    deathReduction: 0,
    durationMod: 1,
    lootMod: 1,
    recipeId: "strength_elixir",
    consumable: true,
  },
  {
    id: "antidote_equip",
    name: "Antidote",
    icon: "🧪",
    slot: "trinket",
    description: "-10% death chance (consumed after mission)",
    successBonus: 0,
    deathReduction: 10,
    durationMod: 1,
    lootMod: 1,
    recipeId: "antidote",
    consumable: true,
  },
];

export function getItem(id: string): ItemDefinition | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function getItemByRecipe(recipeId: string): ItemDefinition | undefined {
  return ITEMS.find((i) => i.recipeId === recipeId);
}

export function getItemsForSlot(slot: ItemSlot): ItemDefinition[] {
  return ITEMS.filter((i) => i.slot === slot);
}

// ─── Inventory item instance ────────────────────────────────────

export interface InventoryItem {
  itemId: string;
  quantity: number;
}
