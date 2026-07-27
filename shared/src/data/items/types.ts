// ─── Item system — shared types ────────────────────────────────
// Type definitions + armor-tier metadata shared across equipment, foods,
// potions, and materials. No item data lives here.

import type { AdventurerClass, AdventurerStats } from "../adventurers.js";

export type ItemSlot = "head" | "chest" | "legs" | "boots" | "gloves" | "cloak" | "mainHand" | "offHand" | "ring1" | "ring2" | "amulet" | "trinket";

/** Armor tier — gates equipment by class + talents. Weapons/rings/trinkets have no armorType. */
export type ArmorType = "cloth" | "leather" | "mail" | "plate";
/** Weapon family for mainHand items. Drives weapon-affinity traits (e.g. Hester's
 *  axe mastery). Optional — untagged weapons simply match no affinity. */
export type WeaponType = "sword" | "greatsword" | "axe" | "dagger" | "mace" | "spear" | "staff" | "wand" | "bow";

/** Rarity tier — drives the ornament frame shown in the UI and roughly tracks
 *  power/source (common/uncommon crafted basics → rare/epic material & boss
 *  pieces → legendary). Split the equipment folder holds one file per item
 *  TYPE; this field is the cross-cutting rank within each. */
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

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

// ─── Weapon access by class ─────────────────────────────────────
// Weapon families each class can wield. Mirrors CLASS_ARMOR_ACCESS: access is by
// CATEGORY (weaponType), not per-item. Talents (e.g. shadowblade) extend it.
export const CLASS_WEAPON_ACCESS: Record<AdventurerClass, WeaponType[]> = {
  warrior: ["sword", "greatsword", "axe", "mace", "spear"],
  archer:  ["bow", "dagger"],
  assassin: ["dagger"],
  wizard:  ["staff", "wand"],
  priest:  ["mace", "staff"],
};

/** Talent IDs that grant an extra weapon family. */
export const WEAPON_TALENTS: Record<string, WeaponType> = {
  shadowblade: "sword", // Assassin: can wield swords (Shadowblade build)
};

/** The full set of weapon families an adventurer can wield, incl. talent grants. */
export function getWeaponAccess(cls: AdventurerClass, talents: string[] | undefined): Set<WeaponType> {
  const set = new Set(CLASS_WEAPON_ACCESS[cls]);
  if (talents) {
    for (const t of talents) {
      const grant = WEAPON_TALENTS[t];
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
  /** Rarity tier (equipment). Drives the ornament frame; optional so consumables
   *  (foods/potions) can omit it. Defaults to common in the UI when absent. */
  rarity?: ItemRarity;
  /** Equipment slot. Omitted for pure consumables (foods, recovery items) and
   *  inventory-only entries — those use isFoodItem / isSupplyItem helpers
   *  instead of the slot field to route through mission-supplies rather than
   *  the persistent equipment object. */
  slot?: ItemSlot;
  /** The green stat/effect line (e.g. "+1 STR", "+6 DEF"). By convention this is
   *  the mechanical summary, shown in the stat colour. */
  description: string;
  /** Optional italic flavour prose, shown under the stat line. Use for worn/
   *  starter gear whose "stat" is nil or just defense but which has a story. */
  flavor?: string;
  /** Which classes can equip this item. Empty array = any class (armorType check still applies). */
  classes: AdventurerClass[];
  /** Armor tier — if set, adventurer must have access to this type. Not used for weapons/jewelry. */
  armorType?: ArmorType;
  /** Weapon family (mainHand only) — drives weapon-affinity traits. Optional. */
  weaponType?: WeaponType;
  /** Physical auto-attack damage range (mainHand weapons). The combat sim rolls
   *  within [dmgMin, dmgMax] as the base hit, then scales it by the wielder's
   *  primary stat. If omitted, a rarity-default range is used (see combat units).
   *  Casters (staves/wands) drive damage through their spell instead (Phase 2). */
  dmgMin?: number;
  dmgMax?: number;
  /** Stat bonuses provided by this item */
  stats: Partial<AdventurerStats>;
  /** Raw sub-stat bonuses (Combat Foundation): flat additions on top of the
   *  DEX/STR-derived floors — crit / accuracy / dodge / parry / mobility /
   *  initiative / armor. Lets gear grant e.g. +crit without inflating DEX.
   *  Summed across equipped items by getEquipmentRaw and applied in
   *  buildAdventurerUnit. Mirror of CombatUnit.raw. (accuracy/parry are inert
   *  until the hit-resolution step; crit/dodge/mobility work now.) */
  raw?: {
    crit?: number;
    accuracy?: number;
    dodge?: number;
    parry?: number;
    mobility?: number;
    initiative?: number;
    armor?: number;
    presence?: number;
  };
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
