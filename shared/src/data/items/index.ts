// ─── Items — public entrypoint ─────────────────────────────────
// Single combined ITEMS array (equipment + recovery supplies + foods),
// general helpers that span the slice files, and re-exports of all
// slice-level types, data, and helpers so consumers can keep importing
// from "@medieval-realm/shared/data/items".

import type { AdventurerClass, AdventurerStats } from "../adventurers.js";
import type { RawSubStats } from "../combat/types.js";
import type { ItemDefinition, ItemSlot } from "./types.js";
import { CLASS_WEAPON_ACCESS } from "./types.js";
import { EQUIPMENT_ITEMS } from "./equipment/index.js";
import { POTION_ITEMS } from "./potions.js";
import { FOOD_ITEMS } from "./foods.js";

export const ITEMS: ItemDefinition[] = [...EQUIPMENT_ITEMS, ...POTION_ITEMS, ...FOOD_ITEMS];

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

/** Sum the raw sub-stat bonuses across all equipped items (Combat Foundation).
 *  Fed into CombatUnit.raw so gear can grant crit/dodge/mobility/etc. without
 *  inflating primary stats. */
export function getEquipmentRaw(equipment: Record<string, string | null>): RawSubStats {
  const raw: Record<string, number> = {};
  for (const slot of ALL_GEAR_SLOTS) {
    const itemId = equipment[slot];
    if (!itemId) continue;
    const item = getItem(itemId);
    if (!item?.raw) continue;
    for (const [key, val] of Object.entries(item.raw)) {
      if (val) raw[key] = (raw[key] ?? 0) + val;
    }
  }
  return raw as RawSubStats;
}

export function getItemsForSlot(slot: ItemSlot, adventurerClass?: AdventurerClass): ItemDefinition[] {
  return ITEMS.filter((i) => {
    if (i.slot !== slot) return false;
    if (adventurerClass) {
      // Weapons filter by weapon-family category (base access; talent grants are
      // an equip-time concern); everything else by the per-item class list.
      if (i.slot === "mainHand" && i.weaponType) {
        if (!CLASS_WEAPON_ACCESS[adventurerClass].includes(i.weaponType)) return false;
      } else if (i.classes.length > 0 && !i.classes.includes(adventurerClass)) {
        return false;
      }
    }
    return true;
  });
}

// ─── Re-exports ────────────────────────────────────────────────
export * from "./types.js";
export * from "./equipment/index.js";
export * from "./foods.js";
export * from "./potions.js";
export * from "./materials.js";
