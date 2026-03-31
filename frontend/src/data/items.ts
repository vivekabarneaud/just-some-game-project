// ─── Item system ────────────────────────────────────────────────

export type ItemSlot = "weapon" | "armor" | "trinket";

import type { AdventurerClass, AdventurerStats } from "./adventurers";

export interface ItemDefinition {
  id: string;
  name: string;
  icon: string;
  slot: ItemSlot;
  description: string;
  /** Which classes can equip this item. Empty array = all classes */
  classes: AdventurerClass[];
  /** Stat bonuses provided by this item */
  stats: Partial<AdventurerStats>;
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
    description: "+5 STR",
    classes: ["warrior", "assassin"],
    stats: { str: 5 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_sword", consumable: false,
  },
  {
    id: "steel_sword", name: "Steel Sword", icon: "🗡️", slot: "weapon",
    description: "+10 STR, +3 DEX",
    classes: ["warrior", "assassin"],
    stats: { str: 10, dex: 3 }, durationMod: 1, lootMod: 1.05,
    recipeId: "steel_sword", consumable: false,
  },

  // ── Staves (Woodworker) — wizard, priest ──────────────────────
  {
    id: "wooden_staff", name: "Wooden Staff", icon: "🪄", slot: "weapon",
    description: "+4 INT, +2 WIS",
    classes: ["wizard", "priest"],
    stats: { int: 4, wis: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "wooden_staff", consumable: false,
  },
  {
    id: "enchanted_staff", name: "Enchanted Staff", icon: "✨", slot: "weapon",
    description: "+12 INT, +5 WIS, -15% duration",
    classes: ["wizard", "priest"],
    stats: { int: 12, wis: 5 }, durationMod: 0.85, lootMod: 1,
    recipeId: "enchanted_staff", consumable: false,
  },

  // ── Bows (Woodworker) — archer ────────────────────────────────
  {
    id: "hunting_bow", name: "Hunting Bow", icon: "🏹", slot: "weapon",
    description: "+6 DEX",
    classes: ["archer"],
    stats: { dex: 6 }, durationMod: 1, lootMod: 1,
    recipeId: "hunting_bow", consumable: false,
  },
  {
    id: "longbow", name: "Longbow", icon: "🎯", slot: "weapon",
    description: "+10 DEX, +3 STR",
    classes: ["archer"],
    stats: { dex: 10, str: 3 }, durationMod: 1, lootMod: 1.05,
    recipeId: "longbow", consumable: false,
  },

  // ── Heavy armor (Blacksmith) — warrior ────────────────────────
  {
    id: "iron_shield", name: "Iron Shield", icon: "🛡️", slot: "armor",
    description: "+8 VIT",
    classes: ["warrior"],
    stats: { vit: 8 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_shield", consumable: false,
  },
  {
    id: "iron_armor", name: "Iron Armor", icon: "🦺", slot: "armor",
    description: "+12 VIT, +3 STR",
    classes: ["warrior"],
    stats: { vit: 12, str: 3 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_armor", consumable: false,
  },
  {
    id: "chainmail", name: "Chainmail Armor", icon: "⛓️", slot: "armor",
    description: "+15 VIT, +5 STR",
    classes: ["warrior", "archer", "assassin"],
    stats: { vit: 15, str: 5 }, durationMod: 1, lootMod: 1,
    recipeId: "chainmail", consumable: false,
  },

  // ── Light armor (Woodworker) ──────────────────────────────────
  {
    id: "wooden_shield", name: "Wooden Shield", icon: "🪵", slot: "armor",
    description: "+6 VIT",
    classes: ["warrior", "archer", "assassin"],
    stats: { vit: 6 }, durationMod: 1, lootMod: 1,
    recipeId: "wooden_shield", consumable: false,
  },

  // ── Robes (Tailoring) — wizard, priest ────────────────────────
  {
    id: "priest_robes", name: "Priest Robes", icon: "🥋", slot: "armor",
    description: "+10 VIT, +5 WIS",
    classes: ["priest"],
    stats: { vit: 10, wis: 5 }, durationMod: 1, lootMod: 1,
    recipeId: "priest_robes", consumable: false,
  },
  {
    id: "wizard_robes", name: "Wizard Robes", icon: "🧙", slot: "armor",
    description: "+8 VIT, +6 INT, -10% duration",
    classes: ["wizard"],
    stats: { vit: 8, int: 6 }, durationMod: 0.9, lootMod: 1,
    recipeId: "wizard_robes", consumable: false,
  },

  // ── Trinkets — all classes ────────────────────────────────────
  {
    id: "iron_tools_equip", name: "Iron Tools", icon: "🔧", slot: "trinket",
    description: "+3 DEX, -10% duration, +5% loot",
    classes: [],
    stats: { dex: 3 }, durationMod: 0.9, lootMod: 1.05,
    recipeId: "iron_tools", consumable: false,
  },

  // ── Potions (Alchemy) — all classes, consumable ───────────────
  {
    id: "healing_potion_equip", name: "Healing Potion", icon: "❤️", slot: "trinket",
    description: "+15 VIT (consumed)",
    classes: [],
    stats: { vit: 15 }, durationMod: 1, lootMod: 1,
    recipeId: "healing_potion", consumable: true,
  },
  {
    id: "strength_elixir_equip", name: "Strength Elixir", icon: "💪", slot: "trinket",
    description: "+8 STR, +4 DEX (consumed)",
    classes: [],
    stats: { str: 8, dex: 4 }, durationMod: 1, lootMod: 1,
    recipeId: "strength_elixir", consumable: true,
  },
  {
    id: "antidote_equip", name: "Antidote", icon: "🧪", slot: "trinket",
    description: "+10 VIT (consumed)",
    classes: [],
    stats: { vit: 10 }, durationMod: 1, lootMod: 1,
    recipeId: "antidote", consumable: true,
  },
];

export function getItem(id: string): ItemDefinition | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function getItemByRecipe(recipeId: string): ItemDefinition | undefined {
  return ITEMS.find((i) => i.recipeId === recipeId);
}

/** Get combined stat bonuses from all equipped items */
export function getEquipmentStats(equipment: { weapon: string | null; armor: string | null; trinket: string | null }): Partial<AdventurerStats> {
  const stats: Partial<AdventurerStats> = {};
  for (const slot of ["weapon", "armor", "trinket"] as const) {
    const itemId = equipment[slot];
    if (itemId) {
      const item = getItem(itemId);
      if (item) {
        for (const [key, val] of Object.entries(item.stats)) {
          stats[key as keyof AdventurerStats] = (stats[key as keyof AdventurerStats] ?? 0) + (val ?? 0);
        }
      }
    }
  }
  return stats;
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
