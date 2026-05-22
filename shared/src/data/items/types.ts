// ─── Item system — shared types ────────────────────────────────
// Type definitions + armor-tier metadata shared across equipment, foods,
// potions, and materials. No item data lives here.

import type { AdventurerClass, AdventurerStats } from "../adventurers.js";

export type ItemSlot = "head" | "chest" | "legs" | "boots" | "cloak" | "mainHand" | "offHand" | "ring1" | "ring2" | "amulet" | "trinket";

/** Armor tier — gates equipment by class + talents. Weapons/rings/trinkets have no armorType. */
export type ArmorType = "cloth" | "leather" | "mail" | "plate";

// ─── Armor access by class ──────────────────────────────────────
// Base armor types each class can wear. Talents (e.g. p_armor for priest) can extend this.
export const CLASS_ARMOR_ACCESS: Record<AdventurerClass, ArmorType[]> = {
  warrior: ["plate", "mail", "leather", "cloth"],
  archer: ["mail", "leather", "cloth"],
  assassin: ["leather", "cloth"],
  priest: ["cloth"],
  wizard: ["cloth"],
};

/** Talent IDs that grant extra armor types. */
export const ARMOR_TALENTS: Record<string, ArmorType> = {
  p_armor: "plate", // Priest: Blessed Armor
};

/** Returns the full set of armor types an adventurer can equip, including talent grants. */
export function getArmorAccess(cls: AdventurerClass, talents: string[] | undefined): Set<ArmorType> {
  const set = new Set(CLASS_ARMOR_ACCESS[cls]);
  if (talents) {
    for (const t of talents) {
      const grant = ARMOR_TALENTS[t];
      if (grant) set.add(grant);
    }
  }
  return set;
}

/** Human-friendly labels + icons for armor types, used in UI badges. */
export const ARMOR_TYPE_META: Record<ArmorType, { label: string; icon: string }> = {
  cloth:   { label: "Cloth",   icon: "🧵" },
  leather: { label: "Leather", icon: "🟫" },
  mail:    { label: "Mail",    icon: "⛓️" },
  plate:   { label: "Plate",   icon: "🛡️" },
};

export interface ItemDefinition {
  id: string;
  name: string;
  icon: string;
  /** Equipment slot. Omitted for pure consumables (foods, recovery items) and
   *  inventory-only entries — those use isFoodItem / isSupplyItem helpers
   *  instead of the slot field to route through mission-supplies rather than
   *  the persistent equipment object. */
  slot?: ItemSlot;
  description: string;
  /** Which classes can equip this item. Empty array = any class (armorType check still applies). */
  classes: AdventurerClass[];
  /** Armor tier — if set, adventurer must have access to this type. Not used for weapons/jewelry. */
  armorType?: ArmorType;
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
  /** Food flavor tags for adventurer preference matching (food items only) */
  foodFlavors?: ("sweet" | "spicy" | "hearty" | "smoky" | "fresh")[];
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  /** Enchantments applied to this stack. Enchanted items unstack (qty=1) */
  enchantments?: string[];
}
