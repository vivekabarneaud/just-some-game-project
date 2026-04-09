// ─── Item system ────────────────────────────────────────────────

export type ItemSlot = "head" | "chest" | "legs" | "boots" | "cloak" | "mainHand" | "offHand" | "ring1" | "ring2" | "amulet" | "trinket";

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
  /** Item sprite image path */
  image?: string;
  /** Two-handed weapon — equipping clears offHand */
  twoHanded?: boolean;
  /** Minimum level to equip */
  levelReq?: number;
  /** Minimum stat to equip */
  statReq?: { stat: keyof AdventurerStats; value: number };
  /** Physical damage reduction in combat (WoW-style: DEF/(DEF+150) = % reduction) */
  defense?: number;
}

export const ITEMS: ItemDefinition[] = [
  // ── Swords (Blacksmith) — warrior, assassin ───────────────────
  {
    id: "iron_sword", name: "Iron Sword", icon: "⚔️", slot: "mainHand",
    description: "+1 STR",
    classes: ["warrior", "assassin"],
    stats: { str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_sword", consumable: false,
  },
  {
    id: "steel_sword", name: "Steel Sword", icon: "🗡️", slot: "mainHand",
    description: "+3 STR, +1 DEX",
    classes: ["warrior", "assassin"],
    stats: { str: 3, dex: 1 }, durationMod: 1, lootMod: 1.05,
    recipeId: "steel_sword", consumable: false,
  },

  // ── Staves (Woodworker) — wizard, priest ──────────────────────
  {
    id: "wooden_staff", name: "Wooden Staff", icon: "🪄", slot: "mainHand", image: "/images/items/wooden_staff.png",
    description: "+1 INT",
    classes: ["wizard", "priest"],
    stats: { int: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "wooden_staff", consumable: false, twoHanded: true,
  },
  {
    id: "enchanted_staff", name: "Enchanted Staff", icon: "✨", slot: "mainHand",
    description: "+4 INT, +2 WIS, -15% duration", twoHanded: true,
    classes: ["wizard", "priest"],
    stats: { int: 4, wis: 2 }, durationMod: 0.85, lootMod: 1,
    recipeId: "enchanted_staff", consumable: false,
  },

  // ── Bows (Woodworker) — archer ────────────────────────────────
  {
    id: "short_bow", name: "Short Bow", icon: "🏹", slot: "mainHand",
    description: "+1 DEX (basic)",
    classes: ["archer"],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "short_bow", consumable: false, twoHanded: true,
  },
  {
    id: "hunting_bow", name: "Hunting Bow", icon: "🏹", slot: "mainHand",
    description: "+1 DEX",
    classes: ["archer"],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "hunting_bow", consumable: false, twoHanded: true,
  },
  {
    id: "longbow", name: "Longbow", icon: "🎯", slot: "mainHand",
    description: "+3 DEX, +1 STR",
    classes: ["archer"],
    stats: { dex: 3, str: 1 }, durationMod: 1, lootMod: 1.05,
    recipeId: "longbow", consumable: false, twoHanded: true,
  },

  // ── Plate armor (Blacksmith) — warrior ────────────────────────
  {
    id: "iron_shield", name: "Iron Shield", icon: "🛡️", slot: "offHand",
    description: "+2 VIT, 45 DEF",
    classes: ["warrior"],
    stats: { vit: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_shield", consumable: false, defense: 45,
  },
  {
    id: "iron_armor", name: "Iron Armor", icon: "🦺", slot: "chest",
    description: "+3 VIT, +1 STR, 65 DEF",
    classes: ["warrior"],
    stats: { vit: 3, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_armor", consumable: false, defense: 65,
  },
  {
    id: "chainmail", name: "Chainmail Armor", icon: "⛓️", slot: "chest",
    description: "+4 VIT, +1 STR, 55 DEF",
    classes: ["warrior", "archer"],
    stats: { vit: 4, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "chainmail", consumable: false, defense: 55,
  },

  // ── Light armor (Woodworker) ──────────────────────────────────
  {
    id: "wooden_shield", name: "Wooden Shield", icon: "🪵", slot: "offHand",
    description: "+1 VIT, 25 DEF",
    classes: ["warrior", "archer", "assassin"],
    stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "wooden_shield", consumable: false, defense: 25,
  },

  // ── Cloth armor (Tailoring) — wizard, priest ──────────────────
  {
    id: "woolen_robe", name: "Woolen Robe", icon: "🧶", slot: "chest",
    description: "+1 VIT, +1 WIS, 10 DEF",
    classes: ["wizard", "priest"],
    stats: { vit: 1, wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "woolen_robe", consumable: false, defense: 10,
  },
  {
    id: "priest_robes", name: "Priest Robes", icon: "🥋", slot: "chest",
    description: "+2 VIT, +1 WIS, 18 DEF",
    classes: ["priest"],
    stats: { vit: 2, wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "priest_robes", consumable: false, defense: 18,
  },
  {
    id: "wizard_robes", name: "Wizard Robes", icon: "🧙", slot: "chest",
    description: "+2 VIT, +2 INT, -10% duration, 18 DEF",
    classes: ["wizard"],
    stats: { vit: 2, int: 2 }, durationMod: 0.9, lootMod: 1,
    recipeId: "wizard_robes", consumable: false, defense: 18,
  },

  // ── Trinkets — all classes ────────────────────────────────────
  {
    id: "iron_tools_equip", name: "Iron Tools", icon: "🔧", slot: "trinket",
    description: "+1 DEX, -10% duration, +5% loot",
    classes: [],
    stats: { dex: 1 }, durationMod: 0.9, lootMod: 1.05,
    recipeId: "iron_tools", consumable: false,
  },

  // ── Potions (Alchemy) — all classes, consumable ───────────────
  {
    id: "healing_potion_equip", name: "Healing Potion", icon: "❤️", slot: "trinket",
    description: "+4 VIT (consumed)",
    classes: [],
    stats: { vit: 4 }, durationMod: 1, lootMod: 1,
    recipeId: "healing_potion", consumable: true,
  },
  {
    id: "strength_elixir_equip", name: "Strength Elixir", icon: "💪", slot: "trinket",
    description: "+2 STR, +1 DEX (consumed)",
    classes: [],
    stats: { str: 2, dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "strength_elixir", consumable: true,
  },
  {
    id: "antidote_equip", name: "Antidote", icon: "🧪", slot: "trinket",
    description: "+3 VIT (consumed)",
    classes: [],
    stats: { vit: 3 }, durationMod: 1, lootMod: 1,
    recipeId: "antidote", consumable: true,
  },

  // ── Leather armor (Leatherworking) ────────────────────────────
  {
    id: "leather_vest", name: "Leather Vest", icon: "🦺", slot: "chest",
    description: "+1 DEX, 30 DEF",
    classes: ["assassin", "archer"],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_vest", consumable: false, defense: 30,
  },
  {
    id: "leather_boots", name: "Leather Boots", icon: "🥾", slot: "boots",
    description: "+1 DEX, 15 DEF",
    classes: [],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_boots", consumable: false, defense: 15,
  },
  {
    id: "leather_hood", name: "Leather Hood", icon: "🪖", slot: "head",
    description: "+1 DEX, 15 DEF",
    classes: ["assassin", "archer"],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_hood", consumable: false, defense: 15,
  },
  {
    id: "leather_pants", name: "Leather Pants", icon: "👖", slot: "legs",
    description: "+1 VIT, 20 DEF",
    classes: ["assassin", "archer", "warrior"],
    stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_pants", consumable: false, defense: 20,
  },
  {
    id: "leather_cloak", name: "Leather Cloak", icon: "🧥", slot: "cloak",
    description: "+1 DEX, 12 DEF",
    classes: ["assassin", "archer"],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_cloak", consumable: false, defense: 12,
  },
  {
    id: "rangers_garb", name: "Ranger's Garb", icon: "🏹", slot: "chest",
    description: "+2 DEX, +1 VIT, 40 DEF",
    classes: ["archer"],
    stats: { dex: 2, vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "rangers_garb", consumable: false, defense: 40,
  },
  {
    id: "shadow_mantle", name: "Shadow Mantle", icon: "🗡️", slot: "cloak",
    description: "+2 DEX, +1 STR, 22 DEF",
    classes: ["assassin"],
    stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "shadow_mantle", consumable: false, defense: 22,
  },
];

export function getItem(id: string): ItemDefinition | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function getItemByRecipe(recipeId: string): ItemDefinition | undefined {
  return ITEMS.find((i) => i.recipeId === recipeId);
}

const ALL_GEAR_SLOTS = ["head", "chest", "legs", "boots", "cloak", "mainHand", "offHand", "ring1", "ring2", "amulet", "trinket"] as const;

export function getEquipmentStats(equipment: Record<string, string | null>): Partial<AdventurerStats> {
  const stats: Partial<AdventurerStats> = {};
  for (const slot of ALL_GEAR_SLOTS) {
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

export function getEquipmentDefense(equipment: Record<string, string | null>): number {
  let defense = 0;
  for (const slot of ALL_GEAR_SLOTS) {
    const itemId = equipment[slot];
    if (itemId) {
      const item = getItem(itemId);
      if (item?.defense) defense += item.defense;
    }
  }
  return defense;
}

export function getItemsForSlot(slot: ItemSlot, adventurerClass?: AdventurerClass): ItemDefinition[] {
  return ITEMS.filter((i) => {
    if (i.slot !== slot) return false;
    if (adventurerClass && i.classes.length > 0 && !i.classes.includes(adventurerClass)) return false;
    return true;
  });
}

// ─── Mission Supplies (potions used at deploy time) ─────────────

export interface MissionSupplyEffect {
  successBonus: number;   // flat % added to success chance
  deathReduction: number; // multiplier on death chance (0.5 = halved)
}

const SUPPLY_EFFECTS: Record<string, MissionSupplyEffect> = {
  "healing_potion_equip":   { successBonus: 0,  deathReduction: 0.5 },  // halves death chance
  "strength_elixir_equip":  { successBonus: 10, deathReduction: 1.0 },  // +10% success
  "antidote_equip":         { successBonus: 5,  deathReduction: 0.7 },  // +5% success, -30% death
};

export function getSupplyEffect(itemId: string): MissionSupplyEffect | undefined {
  return SUPPLY_EFFECTS[itemId];
}

export function isSupplyItem(itemId: string): boolean {
  return itemId in SUPPLY_EFFECTS;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

export function getAvailableSupplies(inventory: InventoryItem[]): { item: ItemDefinition; qty: number }[] {
  return inventory
    .filter((inv) => inv.quantity > 0 && isSupplyItem(inv.itemId))
    .map((inv) => ({ item: getItem(inv.itemId)!, qty: inv.quantity }))
    .filter((x) => x.item);
}

export const MAX_MISSION_SUPPLIES = 3;
