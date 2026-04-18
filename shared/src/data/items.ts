// ─── Item system ────────────────────────────────────────────────

export type ItemSlot = "head" | "chest" | "legs" | "boots" | "cloak" | "mainHand" | "offHand" | "ring1" | "ring2" | "amulet" | "trinket";

/** Armor tier — gates equipment by class + talents. Weapons/rings/trinkets have no armorType. */
export type ArmorType = "cloth" | "leather" | "mail" | "plate";

import type { AdventurerClass, AdventurerStats } from "./adventurers.js";
import { ALCHEMY_RECIPES } from "./alchemy_recipes.js";

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
  slot: ItemSlot;
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

export const ITEMS: ItemDefinition[] = [
  // ── Swords (Blacksmith) — warrior, assassin ───────────────────
  {
    id: "iron_sword", name: "Iron Sword", icon: "⚔️", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/iron_sword.png",
    description: "+1 STR",
    classes: ["warrior", "assassin"],
    stats: { str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_sword", consumable: false,
  },
  {
    id: "steel_sword", name: "Steel Sword", icon: "🗡️", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/steel_sword.png",
    description: "+3 STR, +1 DEX",
    classes: ["warrior", "assassin"],
    stats: { str: 3, dex: 1 }, durationMod: 1, lootMod: 1.05,
    recipeId: "steel_sword", consumable: false,
  },

  // ── Staves (Woodworker) — wizard, priest ──────────────────────
  {
    id: "wooden_staff", name: "Wooden Staff", icon: "🪄", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/wooden_staff.png",
    description: "+1 INT",
    classes: ["wizard", "priest"],
    stats: { int: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "wooden_staff", consumable: false, twoHanded: true,
  },
  {
    id: "enchanted_staff", name: "Enchanted Staff", icon: "✨", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/enchanted_staff.png",
    description: "+4 INT, +2 WIS, -15% duration", twoHanded: true,
    classes: ["wizard", "priest"],
    stats: { int: 4, wis: 2 }, durationMod: 0.85, lootMod: 1,
    recipeId: "enchanted_staff", consumable: false,
  },

  // ── Bows (Woodworker) — archer ────────────────────────────────
  {
    id: "short_bow", name: "Short Bow", icon: "🏹", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/short_bow.png",
    description: "+1 DEX (basic)",
    classes: ["archer"],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "short_bow", consumable: false, twoHanded: true,
  },
  {
    id: "hunting_bow", name: "Hunting Bow", icon: "🏹", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/hunting_bow.png",
    description: "+1 DEX",
    classes: ["archer"],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "hunting_bow", consumable: false, twoHanded: true,
  },
  {
    id: "longbow", name: "Longbow", icon: "🎯", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/longbow.png",
    description: "+3 DEX, +1 STR",
    classes: ["archer"],
    stats: { dex: 3, str: 1 }, durationMod: 1, lootMod: 1.05,
    recipeId: "longbow", consumable: false, twoHanded: true,
  },

  // ── Plate armor (Blacksmith) ──────────────────────────────────
  // Plate items no longer class-restricted — anyone with plate access (warriors + Blessed Armor priests) can wear.
  {
    id: "iron_shield", name: "Iron Shield", icon: "🛡️", slot: "offHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/iron_shield.png",
    description: "+2 VIT, 45 DEF",
    classes: [], armorType: "plate",
    stats: { vit: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_shield", consumable: false, defense: 45,
  },
  {
    id: "iron_armor", name: "Iron Armor", icon: "🦺", slot: "chest",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/iron_armor.png",
    description: "+3 VIT, +1 STR, 65 DEF",
    classes: [], armorType: "plate",
    stats: { vit: 3, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_armor", consumable: false, defense: 65,
  },

  // ── Mail armor (Blacksmith) — medium armor, dex-flavored ──────
  {
    id: "chainmail", name: "Chainmail Armor", icon: "⛓️", slot: "chest",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/chainmail_armor.png",
    description: "+3 VIT, +2 DEX, 55 DEF. Flexible rings — protects without sacrificing speed.",
    classes: [], armorType: "mail",
    stats: { vit: 3, dex: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "chainmail", consumable: false, defense: 55,
  },

  // ── Light armor (Woodworker) ──────────────────────────────────
  {
    id: "wooden_shield", name: "Wooden Shield", icon: "🪵", slot: "offHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/wooden_shield.png",
    description: "+1 VIT, 25 DEF",
    classes: ["warrior", "archer", "assassin"],
    stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "wooden_shield", consumable: false, defense: 25,
  },

  // ── Cloth armor (Tailoring) ───────────────────────────────────
  {
    id: "woolen_robe", name: "Woolen Robe", icon: "🧶", slot: "chest",
    description: "+1 VIT, +1 WIS, 10 DEF",
    classes: [], armorType: "cloth",
    stats: { vit: 1, wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "woolen_robe", consumable: false, defense: 10,
  },
  {
    id: "priest_robes", name: "Priest Robes", icon: "🥋", slot: "chest",
    description: "+2 VIT, +1 WIS, 18 DEF",
    classes: ["priest"], armorType: "cloth",
    stats: { vit: 2, wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "priest_robes", consumable: false, defense: 18,
  },
  {
    id: "wizard_robes", name: "Wizard Robes", icon: "🧙", slot: "chest",
    description: "+2 VIT, +2 INT, -10% duration, 18 DEF",
    classes: ["wizard"], armorType: "cloth",
    stats: { vit: 2, int: 2 }, durationMod: 0.9, lootMod: 1,
    recipeId: "wizard_robes", consumable: false, defense: 18,
  },

  // ── Trinkets — all classes ────────────────────────────────────
  {
    id: "iron_dagger_equip", name: "Iron Dagger", icon: "🗡️", slot: "mainHand",
    description: "+1 DEX. A simple but sharp blade — every adventurer's first real weapon.",
    classes: [],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_dagger", consumable: false,
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

  // ── Recovery items (between-event heal on expeditions, pre-combat heal on simple missions)
  {
    id: "bandage", name: "Bandage", icon: "🩹", slot: "trinket",
    description: "Clean linen strips. Heals 25% max HP before combat.",
    classes: [],
    stats: {}, durationMod: 1, lootMod: 1,
    recipeId: "bandage", consumable: true,
  },

  // ── Leather armor (Leatherworking) ────────────────────────────
  {
    id: "leather_vest", name: "Leather Vest", icon: "🦺", slot: "chest",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leather_vest.png",
    description: "+1 DEX, 30 DEF",
    classes: [], armorType: "leather",
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_vest", consumable: false, defense: 30,
  },
  {
    id: "leather_boots", name: "Leather Boots", icon: "🥾", slot: "boots",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leather_boots.png",
    description: "+1 DEX, 15 DEF",
    classes: [], armorType: "leather",
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_boots", consumable: false, defense: 15,
  },
  {
    id: "leather_hood", name: "Leather Hood", icon: "🪖", slot: "head",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leather_hood.png",
    description: "+1 DEX, 15 DEF",
    classes: [], armorType: "leather",
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_hood", consumable: false, defense: 15,
  },
  {
    id: "leather_pants", name: "Leather Pants", icon: "👖", slot: "legs",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leather_pants.png",
    description: "+1 VIT, 20 DEF",
    classes: [], armorType: "leather",
    stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_pants", consumable: false, defense: 20,
  },
  {
    id: "leather_cloak", name: "Leather Cloak", icon: "🧥", slot: "cloak",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leather_cloak.png",
    description: "+1 DEX, 12 DEF",
    classes: [], armorType: "leather",
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_cloak", consumable: false, defense: 12,
  },
  {
    id: "rangers_garb", name: "Ranger's Garb", icon: "🏹", slot: "chest",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/rangers_garb.png",
    description: "+2 DEX, +1 VIT, 40 DEF",
    classes: ["archer"], armorType: "leather",
    stats: { dex: 2, vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "rangers_garb", consumable: false, defense: 40,
  },
  {
    id: "shadow_mantle", name: "Shadow Mantle", icon: "🗡️", slot: "cloak",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/shadow_mantle.png",
    description: "+2 DEX, +1 STR, 22 DEF",
    classes: ["assassin"], armorType: "leather",
    stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "shadow_mantle", consumable: false, defense: 22,
  },

  // ── Material-crafted equipment ────────────────────────────────

  // Blacksmith — material weapons & armor
  {
    id: "orc_cleaver", name: "Orc Cleaver", icon: "🪓", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/orc_cleaver.png",
    description: "+3 STR. Crude but brutally effective.",
    classes: ["warrior"],
    stats: { str: 3 }, durationMod: 1, lootMod: 1,
    recipeId: "orc_cleaver", consumable: false,
  },
  {
    id: "cursed_blade", name: "Cursed Blade", icon: "⚔️", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/cursed_blade.png",
    description: "+2 STR, +2 INT. The edge never dulls. It whispers when drawn.",
    classes: ["warrior", "assassin"],
    stats: { str: 2, int: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "cursed_blade", consumable: false,
  },
  {
    id: "dragonbone_sword", name: "Dragonbone Sword", icon: "🗡️", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/dragonbone_sword.png",
    description: "+5 STR, +2 DEX. Forged with dragon fang — it cuts through armor like parchment.",
    classes: ["warrior", "assassin"],
    stats: { str: 5, dex: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "dragonbone_sword", consumable: false,
  },
  {
    id: "infernal_mail", name: "Infernal Mail", icon: "⛓️", slot: "chest",
    description: "+2 VIT, +1 STR, 65 DEF. Demon-forged links that radiate heat.",
    classes: ["warrior"],
    stats: { vit: 2, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "infernal_mail", consumable: false, defense: 65,
  },
  {
    id: "fang_necklace", name: "Fang Necklace", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/fang_necklace.png", icon: "🦷", slot: "amulet",
    description: "+1 STR, +1 DEX. Zah'kari courage charm — wolf fangs on sinew cord.",
    classes: [],
    stats: { str: 1, dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "fang_necklace", consumable: false,
  },

  // Leatherworking — material armor
  {
    id: "wolfhide_armor", name: "Wolfhide Armor", icon: "🐺", slot: "chest",
    description: "+1 VIT, +1 DEX, 25 DEF. Tough and pungent. The frontier's favorite.",
    classes: [], armorType: "leather",
    stats: { vit: 1, dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "wolfhide_armor", consumable: false, defense: 25,
  },
  {
    id: "chitin_vest", name: "Chitin Vest", icon: "🕷️", slot: "chest",
    description: "+2 DEX, 35 DEF. Light as wood, hard as iron. Spider-silk stitching.",
    classes: [], armorType: "leather",
    stats: { dex: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "chitin_vest", consumable: false, defense: 35,
  },
  {
    id: "trollhide_cloak", name: "Trollhide Cloak", icon: "🧌", slot: "cloak",
    description: "+2 VIT, +1 STR, 30 DEF. Still warm. The regeneration lingers.",
    classes: [], armorType: "leather",
    stats: { vit: 2, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "trollhide_cloak", consumable: false, defense: 30,
  },
  {
    id: "wyrmscale_armor", name: "Wyrmscale Armor", icon: "🐉", slot: "chest",
    description: "+3 VIT, +2 STR, 70 DEF. Dragon scales over leather. Forge-resistant and magnificent.",
    classes: [], armorType: "plate",
    stats: { vit: 3, str: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "wyrmscale_armor", consumable: false, defense: 70,
  },

  // Tailoring — material robes & cloaks
  {
    id: "ghostweave_cloak", name: "Ghostweave Cloak", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/shadow_cloak.png", icon: "👻", slot: "cloak",
    description: "+2 INT, +1 WIS, 15 DEF. Nearly invisible. Cold as moonlight.",
    classes: [], armorType: "cloth",
    stats: { int: 2, wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "ghostweave_cloak", consumable: false, defense: 15,
  },
  {
    id: "windweave_robe", name: "Windweave Robe", icon: "💨", slot: "chest",
    description: "+3 INT, +1 DEX, 20 DEF. Weighs nothing. Dries instantly. 5% faster missions.",
    classes: ["wizard"], armorType: "cloth",
    stats: { int: 3, dex: 1 }, durationMod: 0.95, lootMod: 1,
    recipeId: "windweave_robe", consumable: false, defense: 20,
  },
  {
    id: "war_banner", name: "War Banner", icon: "🏴", slot: "trinket",
    description: "+1 STR to entire party. Orc warlord's standard, restitched and blessed.",
    classes: [],
    stats: { str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "war_banner", consumable: false,
  },

  // Woodworker — material weapons
  {
    id: "sinew_bow", name: "Sinew Bow", icon: "🏹", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/sinew_bow.png",
    description: "+2 DEX, +1 STR. Wolf-sinew string. Never snaps in the cold.",
    classes: ["archer"],
    stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "sinew_bow", consumable: false,
  },
  {
    id: "dragonfire_staff", name: "Dragonfire Staff", icon: "🔥", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/dragonfire_staff.png",
    description: "+5 INT, +2 WIS. The tip smolders permanently. Ink evaporates near it.",
    classes: ["wizard"],
    stats: { int: 5, wis: 2 }, durationMod: 0.9, lootMod: 1,
    recipeId: "dragonfire_staff", consumable: false, twoHanded: true,
  },

  // ── New Equipment — Content Expansion ──────────────────────────

  // ── Rings (Jewelcrafter) ─────────────────────────────────────────
  {
    id: "copper_band", name: "Copper Band", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/copper_band.png", icon: "💍", slot: "ring1",
    description: "+1 VIT. Simple copper ring, polished smooth. Better than nothing.",
    classes: [], stats: { vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "copper_band", consumable: false,
  },
  {
    id: "bone_ring", name: "Bone Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/bone_ring.png", icon: "💍", slot: "ring1",
    description: "+1 STR. Carved from barrowfield bone. The dead don't need it anymore.",
    classes: ["warrior", "assassin"], stats: { str: 1 }, durationMod: 1, lootMod: 1, recipeId: "bone_ring", consumable: false,
  },
  {
    id: "woven_vine_ring", name: "Woven Vine Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woven_vine_ring.png", icon: "💍", slot: "ring1",
    description: "+1 WIS. Living vine twisted into a ring. It grows tighter on your finger — but not uncomfortably.",
    classes: ["priest", "wizard"], stats: { wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "woven_vine_ring", consumable: false,
  },
  {
    id: "ruby_signet", name: "Ruby Signet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/ruby_signet.png", icon: "💍", slot: "ring1",
    description: "+2 STR, +1 VIT. A fire ruby set in iron. Warm to the touch, always.",
    classes: ["warrior"], stats: { str: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "ruby_signet", consumable: false,
  },
  {
    id: "sapphire_ring", name: "Sapphire Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/sapphire_ring.png", icon: "💍", slot: "ring1",
    description: "+2 INT, +1 WIS. A frost sapphire in silver. Keeps your mind clear and your fingers cold.",
    classes: ["wizard", "priest"], stats: { int: 2, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "sapphire_ring", consumable: false,
  },
  {
    id: "topaz_band", name: "Topaz Band", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/storm_ring.png", icon: "💍", slot: "ring1",
    description: "+2 DEX, +1 STR. A storm topaz in copper. Crackles faintly when you move fast.",
    classes: ["archer", "assassin"], stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "topaz_band", consumable: false,
  },
  {
    id: "emerald_loop", name: "Emerald Loop", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/emerald_band.png", icon: "💍", slot: "ring1",
    description: "+2 WIS, +1 VIT. An emerald shard in twisted silver. Smells faintly of forest rain.",
    classes: ["priest"], stats: { wis: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "emerald_loop", consumable: false,
  },
  {
    id: "moonstone_seal", name: "Moonstone Seal", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/moonstone_ring.png", icon: "💍", slot: "ring1",
    description: "+3 WIS, +2 INT, +1 VIT. Divine light trapped in stone. The priests weep when they see it.",
    classes: ["priest", "wizard"], stats: { wis: 3, int: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "moonstone_seal", consumable: false,
  },
  {
    id: "void_band", name: "Void Band", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/void_ring.png", icon: "💍", slot: "ring1",
    description: "+3 DEX, +2 STR. The shadows seem darker near your hand. You move faster. You don't question why.",
    classes: ["assassin"], stats: { dex: 3, str: 2 }, durationMod: 1, lootMod: 1, recipeId: "void_band", consumable: false,
  },
  {
    id: "dragonfire_ring", name: "Dragonfire Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/dragonscale_ring.png", icon: "💍", slot: "ring1",
    description: "+3 STR, +2 VIT. Dragon blood fused with ruby. It pulses like a second heartbeat.",
    classes: ["warrior"], stats: { str: 3, vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "dragonfire_ring", consumable: false,
  },

  // ── Head Armor ──────────────────────────────────────────────────
  {
    id: "iron_helm", name: "Iron Helm", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/steel_helm.png", icon: "🪖", slot: "head",
    description: "+2 VIT, +1 STR, 35 DEF. Heavy, hot, and the reason you still have a skull.",
    classes: [], armorType: "plate",
    stats: { vit: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "iron_helm", consumable: false, defense: 35,
  },
  {
    id: "chainmail_coif", name: "Chainmail Coif", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/chainmail_coif.png", icon: "⛓️", slot: "head",
    description: "+1 VIT, +1 DEX, 25 DEF. Iron rings woven tight. Light enough to turn your head in.",
    classes: [], armorType: "mail",
    stats: { vit: 1, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "chainmail_coif", consumable: false, defense: 25,
  },
  {
    id: "wizard_hat", name: "Wizard's Hat", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/wizard_hat.png", icon: "🎩", slot: "head",
    description: "+2 INT, 8 DEF. Tall, pointed, and embroidered with arcane sigils. Yes, it's a bit much.",
    classes: ["wizard"], armorType: "cloth",
    stats: { int: 2 }, durationMod: 1, lootMod: 1, recipeId: "wizard_hat", consumable: false, defense: 8,
  },
  {
    id: "priest_circlet", name: "Priest's Circlet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/moonstone_circlet.png", icon: "👑", slot: "head",
    description: "+1 WIS, +1 INT, 12 DEF. A simple gold band set with a moonstone chip. Consecrated.",
    classes: ["priest"], armorType: "cloth",
    stats: { wis: 1, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "priest_circlet", consumable: false, defense: 12,
  },
  {
    id: "shadow_cowl", name: "Shadow Cowl", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/assassin_hood.png", icon: "🥷", slot: "head",
    description: "+2 DEX, +1 STR, 18 DEF. Dark leather hood that covers everything but the eyes. The eyes are the point.",
    classes: ["assassin"], armorType: "leather",
    stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "shadow_cowl", consumable: false, defense: 18,
  },
  {
    id: "bear_skull_helm", name: "Bear-Skull Helm", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/beast_skull_helm.png", icon: "💀", slot: "head",
    description: "+1 STR, +1 VIT, +1 DEX, 30 DEF. A dire bear skull, hollowed and lined with fur. Terrifying to enemies. Uncomfortable for you.",
    classes: [], armorType: "mail",
    stats: { str: 1, vit: 1, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "bear_skull_helm", consumable: false, defense: 30,
  },

  // ── Leg Armor ───────────────────────────────────────────────────
  {
    id: "iron_greaves", name: "Iron Greaves", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/steel_greaves.png", icon: "🦵", slot: "legs",
    description: "+2 VIT, +1 STR, 40 DEF. Plate leg armor. Loud, heavy, and reassuringly solid.",
    classes: [], armorType: "plate",
    stats: { vit: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "iron_greaves", consumable: false, defense: 40,
  },
  {
    id: "cloth_leggings", name: "Cloth Leggings", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/priest_vestments_legs.png", icon: "👖", slot: "legs",
    description: "+1 VIT, +1 WIS, 8 DEF. Reinforced linen with prayer-stitched hems. Comfortable for long rituals.",
    classes: [], armorType: "cloth",
    stats: { vit: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "cloth_leggings", consumable: false, defense: 8,
  },
  {
    id: "ranger_trousers", name: "Ranger's Trousers", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/ranger_trousers.png", icon: "👖", slot: "legs",
    description: "+1 DEX, +1 VIT, 22 DEF. Leather-reinforced at the knees. Built for running and crouching.",
    classes: [], armorType: "leather",
    stats: { dex: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "ranger_trousers", consumable: false, defense: 22,
  },
  {
    id: "wyrmscale_greaves", name: "Wyrmscale Greaves", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/dragonscale_greaves.png", icon: "🐉", slot: "legs",
    description: "+3 VIT, +1 STR, 50 DEF. Dragon-scale leg plates. Worth more than most houses.",
    classes: [], armorType: "plate",
    stats: { vit: 3, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "wyrmscale_greaves", consumable: false, defense: 50,
  },

  // ── Boots ───────────────────────────────────────────────────────
  {
    id: "iron_sabatons", name: "Iron Sabatons", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/steel_boots.png", icon: "🥾", slot: "boots",
    description: "+1 VIT, +1 STR, 30 DEF. Plated boots. Every step sounds like a hammer.",
    classes: [], armorType: "plate",
    stats: { vit: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "iron_sabatons", consumable: false, defense: 30,
  },
  {
    id: "soft_shoes", name: "Soft Shoes", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/pilgrim_sandals.png", icon: "👟", slot: "boots",
    description: "+1 DEX, +1 WIS, 5 DEF. Cloth shoes with cork soles. Quiet, comfortable, terrible in mud.",
    classes: [], armorType: "cloth",
    stats: { dex: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "soft_shoes", consumable: false, defense: 5,
  },
  {
    id: "scout_boots", name: "Scout's Boots", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/stalker_boots.png", icon: "🥾", slot: "boots",
    description: "+2 DEX, 18 DEF. Supple leather, silent on any surface. The archer's best friend.",
    classes: [], armorType: "leather",
    stats: { dex: 2 }, durationMod: 1, lootMod: 1, recipeId: "scout_boots", consumable: false, defense: 18,
  },
  {
    id: "trollhide_boots", name: "Trollhide Boots", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/troll_stompers.png", icon: "🥾", slot: "boots",
    description: "+2 VIT, +1 DEX, 25 DEF. Tough as stone, ugly as sin. They'll outlast you.",
    classes: [], armorType: "leather",
    stats: { vit: 2, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "trollhide_boots", consumable: false, defense: 25,
  },

  // ── Amulets (Jewelcrafter) ──────────────────────────────────────
  {
    id: "holy_pendant", name: "Holy Pendant", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/moonstone_pendant.png", icon: "✝️", slot: "amulet",
    description: "+2 WIS, +1 VIT. A moonstone set in silver, blessed by three priests. Warm against the skin.",
    classes: ["priest"], stats: { wis: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "holy_pendant", consumable: false,
  },
  {
    id: "amber_charm", name: "Amber Charm", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/amber_amulet.png", icon: "🟠", slot: "amulet",
    description: "+2 INT, +1 WIS. Ancient amber with a perfect insect inside. The Silvaneth say it thinks.",
    classes: ["wizard"], stats: { int: 2, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "amber_charm", consumable: false,
  },
  {
    id: "predator_tooth", name: "Predator's Tooth", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alpha_fang_amulet.png", icon: "🦷", slot: "amulet",
    description: "+2 DEX, +1 STR. An alpha wolf's fang on braided sinew. The pack respects the kill.",
    classes: ["archer", "assassin"], stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "predator_tooth", consumable: false,
  },
  {
    id: "warlord_chain", name: "Warlord's Chain", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/warlord_chain.png", icon: "⛓️", slot: "amulet",
    description: "+2 STR, +2 VIT. Orc-steel links and a fire ruby clasp. Taken from a chief who doesn't need it anymore.",
    classes: ["warrior"], stats: { str: 2, vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "warlord_chain", consumable: false,
  },
  {
    id: "ghostveil_locket", name: "Ghostveil Locket", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/spirit_locket.png", icon: "👻", slot: "amulet",
    description: "+2 INT, +1 DEX. A locket that holds a wisp of ghostweave. The dead don't notice you as easily.",
    classes: [], stats: { int: 2, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "ghostveil_locket", consumable: false,
  },

  // ── Off-Hand — New ──────────────────────────────────────────────
  {
    id: "arcane_focus", name: "Arcane Focus", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/crystal_orb.png", icon: "🔮", slot: "offHand",
    description: "+2 INT, +1 WIS. A crystal orb that floats beside your hand. Show-off? Maybe. Effective? Definitely.",
    classes: ["wizard"], stats: { int: 2, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "arcane_focus", consumable: false,
  },
  {
    id: "prayer_book", name: "Prayer Book", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tome_of_power.png", icon: "📖", slot: "offHand",
    description: "+2 WIS, +1 INT. Leather-bound, well-thumbed, with annotations in three languages.",
    classes: ["priest"], stats: { wis: 2, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "prayer_book", consumable: false,
  },
  {
    id: "parrying_dagger", name: "Parrying Dagger", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/parrying_dagger.png", icon: "🗡️", slot: "offHand",
    description: "+1 DEX, +1 STR, 15 DEF. A wide-bladed dagger built for catching swords, not throwing.",
    classes: ["assassin"], stats: { dex: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "parrying_dagger", consumable: false, defense: 15,
  },
  {
    id: "quiver_precision", name: "Quiver of Precision", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/enchanted_quiver.png", icon: "🏹", slot: "offHand",
    description: "+2 DEX. Enchanted quiver — arrows slide out nocked and ready. Faster than thinking.",
    classes: ["archer"], stats: { dex: 2 }, durationMod: 1, lootMod: 1, recipeId: "quiver_precision", consumable: false,
  },

  // ── Assassin Daggers (mainHand) ─────────────────────────────────
  {
    id: "stiletto", name: "Stiletto", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/stiletto.png", icon: "🗡️", slot: "mainHand",
    description: "+2 DEX, +1 STR. Needle-thin, whisper-quiet. Made for gaps in armor, not fair fights.",
    classes: ["assassin"], stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "stiletto", consumable: false,
  },
  {
    id: "poisoned_blade", name: "Poisoned Blade", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/venom_blade.png", icon: "🗡️", slot: "mainHand",
    description: "+3 DEX, +2 STR. The groove along the blade holds venom. The nick is worse than the cut.",
    classes: ["assassin"], stats: { dex: 3, str: 2 }, durationMod: 1, lootMod: 1, recipeId: "poisoned_blade", consumable: false,
  },
  {
    id: "shadow_dagger", name: "Shadow Dagger", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/void_dagger.png", icon: "🗡️", slot: "mainHand",
    description: "+4 DEX, +3 STR. Void-touched steel that drinks the light. The wound hurts before the blade arrives.",
    classes: ["assassin"], stats: { dex: 4, str: 3 }, durationMod: 1, lootMod: 1, recipeId: "shadow_dagger", consumable: false,
  },

  // ── Priest Weapons (mainHand) ───────────────────────────────────
  {
    id: "iron_mace", name: "Iron Mace", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/war_mace.png", icon: "🔨", slot: "mainHand",
    description: "+1 STR, +1 WIS. Heavy, blunt, and sanctioned by the Church. For when prayer isn't enough.",
    classes: ["priest", "warrior"], stats: { str: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "iron_mace", consumable: false,
  },
  {
    id: "blessed_mace", name: "Blessed Mace", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/holy_mace.png", icon: "🔨", slot: "mainHand",
    description: "+2 WIS, +2 STR, +1 VIT. Moonstone-capped and consecrated. The undead hate it. So does everything else you hit with it.",
    classes: ["priest"], stats: { wis: 2, str: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "blessed_mace", consumable: false,
  },

  // ── Boss Loot Equipment (not craftable) ─────────────────────────
  {
    id: "alpha_fang_amulet", name: "Alpha's Fang", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alpha_fang_amulet.png", icon: "🐺", slot: "amulet",
    description: "+2 STR, +1 DEX. The pack leader's broken fang, still warm. Wearing it feels like being watched by yellow eyes.",
    classes: [], stats: { str: 2, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "witch_eye_trinket", name: "Witch's Eye", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/witch_eye_pendant.png", icon: "👁️", slot: "trinket",
    description: "+2 INT, +1 WIS, -5% duration. It sees what you can't. Don't ask what it shows the witch.",
    classes: ["wizard", "priest"], stats: { int: 2, wis: 1 }, durationMod: 0.95, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "goblin_crown", name: "Goblin Crown", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/goblin_crown.png", icon: "👑", slot: "head",
    description: "+2 DEX, +1 STR, +10% loot. Bent copper and stolen gems. It's ugly. It's also lucky.",
    classes: [], stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1.10, recipeId: "", consumable: false,
  },
  {
    id: "necromancer_cowl", name: "Necromancer's Cowl", icon: "🧥", slot: "head",
    description: "+3 INT, +1 WIS. The fabric whispers when you put it on. Best not to listen.",
    classes: ["wizard"], stats: { int: 3, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false, defense: 10,
  },
  {
    id: "beast_heart_charm", name: "Beast Heart Charm", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/beast_heart_charm.png", icon: "❤️", slot: "trinket",
    description: "+2 VIT, +2 STR. A dire bear's heart, dried and bound in leather. Courage you can wear.",
    classes: [], stats: { vit: 2, str: 2 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "infernal_signet", name: "Infernal Signet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/infernal_signet.png", icon: "💍", slot: "ring1",
    description: "+3 STR, +2 VIT. Demon-forged iron and fire ruby. Burns cold. Grants strength at a cost nobody can name.",
    classes: ["warrior", "assassin"], stats: { str: 3, vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },

  // ── Kitchen — Mission Food (consumable) ─────────────────────────
  // Food items are consumed on mission deploy. They give small stat bonuses,
  // boosted if the food's flavor matches the adventurer's foodPreference.

  // Tier 1 — Simple (1 tag, Kitchen Lv 1-2)
  {
    id: "honeycake", name: "Honeycake", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/honeycake.png", icon: "🍯", slot: "trinket",
    description: "Sweet golden cake made with fresh honey. Adventurers with a sweet tooth love it.",
    classes: [], stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "honeycake", consumable: true, foodFlavors: ["sweet"],
  },
  {
    id: "peppered_jerky", name: "Peppered Jerky", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/peppered_jerky.png", icon: "🌶️", slot: "trinket",
    description: "Dried meat rubbed with wild herbs and crushed peppers. Burns going down.",
    classes: [], stats: { str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "peppered_jerky", consumable: true, foodFlavors: ["spicy"],
  },
  {
    id: "herb_salad", name: "Fresh Herb Salad", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/herb_salad.png", icon: "🥬", slot: "trinket",
    description: "Wild herbs, cabbages, and berries tossed with a light dressing. Refreshing.",
    classes: [], stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "herb_salad", consumable: true, foodFlavors: ["fresh"],
  },
  {
    id: "smoked_fish", name: "Smoked Fish", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/smoked_fish.png", icon: "🐟", slot: "trinket",
    description: "River fish smoked over applewood. The campfire crowd's favorite.",
    classes: [], stats: { wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "smoked_fish", consumable: true, foodFlavors: ["smoky"],
  },
  {
    id: "meat_pie", name: "Meat Pie", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/meat_pie.png", icon: "🥧", slot: "trinket",
    description: "A thick, filling pie stuffed with seasoned meat and gravy. Stick-to-your-ribs good.",
    classes: [], stats: { vit: 1, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "meat_pie", consumable: true, foodFlavors: ["hearty"],
  },
  {
    id: "cheese_bread", name: "Cheese Bread", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/cheese_bread.png", icon: "🧀", slot: "trinket",
    description: "Warm bread stuffed with melted goat cheese. Simple and satisfying.",
    classes: [], stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "cheese_bread", consumable: true, foodFlavors: ["hearty"],
  },
  {
    id: "grilled_mushrooms", name: "Grilled Mushrooms", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/grilled_mushrooms.png", icon: "🍄", slot: "trinket",
    description: "Forest mushrooms charred over an open flame with herbs. Earthy and rich.",
    classes: [], stats: { int: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "grilled_mushrooms", consumable: true, foodFlavors: ["smoky"],
  },
  {
    id: "fruit_tart", name: "Fruit Tart", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/fruit_tart.png", icon: "🍎", slot: "trinket",
    description: "Pastry shell filled with fresh fruit and honey glaze. A rare treat on the frontier.",
    classes: [], stats: { wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "fruit_tart", consumable: true, foodFlavors: ["sweet"],
  },

  // Tier 2 — Complex (2 tags, Kitchen Lv 3-4)
  {
    id: "hunters_stew", name: "Hunter's Stew", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/hunters_stew.png", icon: "🍲", slot: "trinket",
    description: "Slow-cooked meat with root vegetables and mushrooms. Smells like the campfire after a good hunt.",
    classes: [], stats: { str: 1, vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "hunters_stew", consumable: true, foodFlavors: ["hearty", "smoky"],
  },
  {
    id: "spiced_honeycake", name: "Spiced Honeycake", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/spiced_honeycake.png", icon: "🍰", slot: "trinket",
    description: "Honeycake with crushed herbs and pepper. Sweet heat that lingers.",
    classes: [], stats: { wis: 1, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "spiced_honeycake", consumable: true, foodFlavors: ["sweet", "spicy"],
  },
  {
    id: "pea_mint_bowl", name: "Pea & Mint Bowl", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/pea_mint_bowl.png", icon: "🫛", slot: "trinket",
    description: "Fresh peas with mint and a kick of pepper. Light but energizing.",
    classes: [], stats: { dex: 1, int: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "pea_mint_bowl", consumable: true, foodFlavors: ["fresh", "spicy"],
  },
  {
    id: "cherry_cheese_plate", name: "Cherry Cheese Plate", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/cherry_cheese_plate.png", icon: "🍒", slot: "trinket",
    description: "Goat cheese with fresh fruit and wild berries. Elegant for the frontier.",
    classes: [], stats: { wis: 1, dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "cherry_cheese_plate", consumable: true, foodFlavors: ["sweet", "fresh"],
  },
  {
    id: "smoked_pork_roast", name: "Smoked Pork Roast", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/smoked_pork_roast.png", icon: "🍖", slot: "trinket",
    description: "Thick-cut pork smoked with squash and hardwood. A meal that fights back.",
    classes: [], stats: { str: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "smoked_pork_roast", consumable: true, foodFlavors: ["smoky", "hearty"],
  },
  {
    id: "fishermans_broth", name: "Fisherman's Broth", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/fishermans_broth.png", icon: "🥣", slot: "trinket",
    description: "Fish, cabbage, and herbs in a clear broth. Light, warm, and keeps death at bay.",
    classes: [], stats: { vit: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "fishermans_broth", consumable: true, foodFlavors: ["fresh", "hearty"],
  },
  // ── Origin Recipes — Loyalty Unlocked ──────────────────────────

  // Ashwick
  { id: "shepherds_pie", name: "Shepherd's Pie", icon: "🥧", slot: "trinket",
    description: "Ashwick comfort food — meat and mashed roots under a golden crust. Tastes like home.",
    classes: [], stats: { vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "shepherds_pie", consumable: true, foodFlavors: ["hearty"] },
  { id: "ashwick_ale_stew", name: "Ashwick Ale Stew", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/ashwick_ale_stew.png", icon: "🍺", slot: "trinket",
    description: "Slow-cooked in dark ale until the meat falls apart. The Hearthlands in a bowl.",
    classes: [], stats: { str: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "ashwick_ale_stew", consumable: true, foodFlavors: ["hearty", "smoky"] },
  { id: "blackberry_crumble", name: "Blackberry Crumble", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blackberry_crumble.png", icon: "🫐", slot: "trinket",
    description: "Wild blackberries under a buttery oat crust with honey drizzle. Grandma's recipe.",
    classes: [], stats: { wis: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "blackberry_crumble", consumable: true, foodFlavors: ["sweet"] },

  // Nordveld
  { id: "smoked_elk_berries", name: "Smoked Elk & Cloudberries", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/smoked_elk_berries.png", icon: "🫐", slot: "trinket",
    description: "Elk smoked over pine coals, served with tart cloudberries. A Nordveld jarl's meal.",
    classes: [], stats: { str: 2 }, durationMod: 1, lootMod: 1, recipeId: "smoked_elk_berries", consumable: true, foodFlavors: ["smoky", "sweet"] },
  { id: "nordveld_porridge", name: "Nordveld Barley Porridge", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/nordveld_porridge.png", icon: "🥣", slot: "trinket",
    description: "Thick barley porridge with honey and salt. Keeps you warm through any blizzard.",
    classes: [], stats: { vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "nordveld_porridge", consumable: true, foodFlavors: ["hearty", "sweet"] },
  { id: "pickled_herring", name: "Pickled Herring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/pickled_herring.png", icon: "🐟", slot: "trinket",
    description: "Herring preserved in brine and herbs. An acquired taste. The Nordveld never acquired any other.",
    classes: [], stats: { dex: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "pickled_herring", consumable: true, foodFlavors: ["fresh"] },

  // Meridian
  { id: "saffron_fish_stew", name: "Saffron Fish Stew", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/saffron_fish_stew.png", icon: "🍲", slot: "trinket",
    description: "A Corsair captain's recipe — white fish in saffron broth with lemon and peppers.",
    classes: [], stats: { int: 1, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "saffron_fish_stew", consumable: true, foodFlavors: ["fresh", "spicy"] },
  { id: "grilled_octopus", name: "Grilled Octopus", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/grilled_octopus.png", icon: "🐙", slot: "trinket",
    description: "Charred over driftwood with sea salt and olive oil. The harbor smells like this on good days.",
    classes: [], stats: { dex: 2 }, durationMod: 1, lootMod: 1, recipeId: "grilled_octopus", consumable: true, foodFlavors: ["smoky", "fresh"] },
  { id: "fig_honey_toast", name: "Fig & Honey Toast", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/fig_honey_toast.png", icon: "🍯", slot: "trinket",
    description: "Toasted bread with ripe figs, honey, and a whisper of sea salt. Meridian mornings in a bite.",
    classes: [], stats: { wis: 2 }, durationMod: 1, lootMod: 1, recipeId: "fig_honey_toast", consumable: true, foodFlavors: ["sweet"] },

  // Zah'kari
  { id: "groundnut_spice_bowl", name: "Groundnut Spice Bowl", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/groundnut_spice_bowl.png", icon: "🥜", slot: "trinket",
    description: "Crushed groundnuts in a thick spiced sauce over grain. A Zah'kari council-day staple.",
    classes: [], stats: { str: 1, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "groundnut_spice_bowl", consumable: true, foodFlavors: ["spicy", "hearty"] },
  { id: "jollof_rice", name: "Zah'kari Jollof", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jollof_rice.png", icon: "🍚", slot: "trinket",
    description: "Tomato-spiced rice with smoked meat. Every Zah'kari family claims theirs is the best.",
    classes: [], stats: { str: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "jollof_rice", consumable: true, foodFlavors: ["spicy", "smoky"] },
  { id: "plantain_pepper_fry", name: "Plantain Pepper Fry", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/plantain_pepper_fry.png", icon: "🍌", slot: "trinket",
    description: "Fried plantain with crushed peppers and palm oil. Sweet heat that makes you sweat.",
    classes: [], stats: { dex: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "plantain_pepper_fry", consumable: true, foodFlavors: ["sweet", "spicy"] },

  // Tianzhou
  { id: "steamed_dumplings", name: "Steamed Dumplings", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/steamed_dumplings.png", icon: "🥟", slot: "trinket",
    description: "Delicate pork dumplings in paper-thin wrappers. A Tianzhou scholar's working lunch.",
    classes: [], stats: { int: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "steamed_dumplings", consumable: true, foodFlavors: ["fresh"] },
  { id: "five_spice_duck", name: "Five-Spice Duck", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/five_spice_duck.png", icon: "🦆", slot: "trinket",
    description: "Slow-roasted duck glazed in five imperial spices. An entire afternoon of cooking for one perfect meal.",
    classes: [], stats: { str: 1, int: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "five_spice_duck", consumable: true, foodFlavors: ["smoky", "spicy"] },
  { id: "jade_tea_soup", name: "Jade Tea Soup", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jade_tea_soup.png", icon: "🍵", slot: "trinket",
    description: "A clear broth infused with green tea and ginger. Tianzhou monks drink this before meditation.",
    classes: [], stats: { wis: 2 }, durationMod: 1, lootMod: 1, recipeId: "jade_tea_soup", consumable: true, foodFlavors: ["fresh"] },

  // Khor'vani
  { id: "lamb_tagine", name: "Lamb Tagine", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/lamb_tagine.png", icon: "🍲", slot: "trinket",
    description: "Slow-cooked lamb with dried fruit and twelve spices in a clay pot. The Crossroads' signature dish.",
    classes: [], stats: { str: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "lamb_tagine", consumable: true, foodFlavors: ["smoky", "spicy"] },
  { id: "saffron_rice_pilaf", name: "Saffron Rice Pilaf", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/saffron_rice_pilaf.png", icon: "🍚", slot: "trinket",
    description: "Golden rice studded with dried fruits and toasted nuts. Every grain worth its weight.",
    classes: [], stats: { int: 2 }, durationMod: 1, lootMod: 1, recipeId: "saffron_rice_pilaf", consumable: true, foodFlavors: ["sweet", "spicy"] },
  { id: "rosewater_pastries", name: "Rosewater Pastries", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/rosewater_pastries.png", icon: "🌹", slot: "trinket",
    description: "Flaky pastry soaked in rosewater and honey. The Khor'vani serve these to honored guests.",
    classes: [], stats: { wis: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "rosewater_pastries", consumable: true, foodFlavors: ["sweet"] },

  // Silvaneth
  { id: "honeyed_acorn_bread", name: "Honeyed Acorn Bread", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/honeyed_acorn_bread.png", icon: "🌰", slot: "trinket",
    description: "Dense nutty bread sweetened with wild honey. The Silvaneth bake it in hot stones.",
    classes: [], stats: { vit: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "honeyed_acorn_bread", consumable: true, foodFlavors: ["sweet", "fresh"] },
  { id: "elderflower_broth", name: "Elderflower Broth", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/elderflower_broth.png", icon: "🌸", slot: "trinket",
    description: "A delicate clear broth with elderflower and forest herbs. Heals what ails you.",
    classes: [], stats: { wis: 2 }, durationMod: 1, lootMod: 1, recipeId: "elderflower_broth", consumable: true, foodFlavors: ["fresh"] },
  { id: "moss_wrapped_trout", name: "Moss-Wrapped Trout", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/moss_wrapped_trout.png", icon: "🐟", slot: "trinket",
    description: "River trout wrapped in damp moss and slow-steamed over coals. Tastes of the forest itself.",
    classes: [], stats: { dex: 1, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "moss_wrapped_trout", consumable: true, foodFlavors: ["smoky", "fresh"] },

  // Hauts-Cieux
  { id: "starfruit_meringue", name: "Starfruit Meringue", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/starfruit_meringue.png", icon: "⭐", slot: "trinket",
    description: "Whipped cloud-light meringue with crystallized starfruit. It tastes like the sky looks at dawn.",
    classes: [], stats: { int: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "starfruit_meringue", consumable: true, foodFlavors: ["sweet"] },
  { id: "crystal_consomme", name: "Crystal Consommé", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/crystal_consomme.png", icon: "🥣", slot: "trinket",
    description: "A broth so clear you can read through it. The Hauts-Cieux consider cloudy soup a moral failing.",
    classes: [], stats: { int: 2 }, durationMod: 1, lootMod: 1, recipeId: "crystal_consomme", consumable: true, foodFlavors: ["fresh"] },
  { id: "moonpetal_sorbet", name: "Moonpetal Sorbet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/moonpetal_sorbet.png", icon: "🍨", slot: "trinket",
    description: "Frozen sorbet made with moonpetal essence. Glows faintly silver. Tastes of starlight and regret.",
    classes: [], stats: { wis: 2, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "moonpetal_sorbet", consumable: true, foodFlavors: ["sweet", "fresh"] },

  // Khazdurim
  { id: "forge_roasted_boar", name: "Forge-Roasted Boar", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/forge_roasted_boar.png", icon: "🐗", slot: "trinket",
    description: "Whole boar roasted in forge heat until the fat crackles. The Khazdurim eat this before battle.",
    classes: [], stats: { str: 2 }, durationMod: 1, lootMod: 1, recipeId: "forge_roasted_boar", consumable: true, foodFlavors: ["smoky", "hearty"] },
  { id: "deep_mushroom_stew", name: "Deep Mushroom Stew", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/deep_mushroom_stew.png", icon: "🍄", slot: "trinket",
    description: "Mushrooms from the third level, slow-cooked in dark ale. Don't ask what level means.",
    classes: [], stats: { vit: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "deep_mushroom_stew", consumable: true, foodFlavors: ["hearty", "smoky"] },
  { id: "iron_bread", name: "Iron Bread", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/iron_bread.png", icon: "🍞", slot: "trinket",
    description: "Bread so dense you could hammer nails with it. The Khazdurim consider this a feature.",
    classes: [], stats: { vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "iron_bread", consumable: true, foodFlavors: ["hearty"] },

  // Feldgrund
  { id: "harvest_ale_stew", name: "Harvest Ale Stew", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/harvest_ale_stew.png", icon: "🍺", slot: "trinket",
    description: "Root vegetables and sausage in golden ale broth. The Feldgrund version of fine dining.",
    classes: [], stats: { vit: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "harvest_ale_stew", consumable: true, foodFlavors: ["hearty"] },
  { id: "cheese_and_onion_pie", name: "Cheese & Onion Pie", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/cheese_and_onion_pie.png", icon: "🥧", slot: "trinket",
    description: "Flaky crust packed with caramelized onions and three kinds of cheese. Pub perfection.",
    classes: [], stats: { vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "cheese_and_onion_pie", consumable: true, foodFlavors: ["hearty", "smoky"] },
  { id: "apple_butter_toast", name: "Apple Butter Toast", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/apple_butter_toast.png", icon: "🍎", slot: "trinket",
    description: "Thick toast with spiced apple butter. A Feldgrund child's first breakfast and an elder's last comfort.",
    classes: [], stats: { wis: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "apple_butter_toast", consumable: true, foodFlavors: ["sweet", "hearty"] },
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

// ─── Potion System ──────────────────────────────────────────────
// Three categories:
// - Mission potions: used at deploy for non-combat missions (success%, death reduction)
// - Combat potions: consumed during combat (healing, damage boost, defense)
// - Recovery items (bandages, mending potions): heal between fights on expeditions,
//   or give a pre-combat HP boost on single-encounter missions.

export type PotionCategory = "mission" | "combat" | "recovery";

export interface MissionSupplyEffect {
  successBonus: number;     // flat stat bonus to relevant stat check (not %)
  deathReduction: number;
}

export interface CombatPotionEffect {
  type: "heal_pct" | "damage_boost" | "defense_boost" | "cleanse" | "haste";
  value: number;        // heal%=25 means 25% max HP, damage_boost=50 means +50%, etc.
  duration?: number;    // rounds for buffs (undefined = instant)
  trigger: "auto_low_hp" | "before_first_attack" | "on_use";  // when the AI drinks it
}

export interface RecoveryEffect {
  /** Heal % of max HP. Applied pre-combat on simple missions, between-event on expeditions. */
  healPct: number;
}

export interface PotionInfo {
  category: PotionCategory;
  mission?: MissionSupplyEffect;
  combat?: CombatPotionEffect;
  recovery?: RecoveryEffect;
}

const POTION_REGISTRY: Record<string, PotionInfo> = {
  // ── Mission potions (non-combat only) ─────────────────────────
  "healing_potion_equip":   { category: "mission", mission: { successBonus: 0,  deathReduction: 0.5 } },
  "antidote_equip":         { category: "mission", mission: { successBonus: 5,  deathReduction: 0.7 } },
  "healing_salve":          { category: "mission", mission: { successBonus: 0,  deathReduction: 0.75 } },
  "vigor_tea":              { category: "mission", mission: { successBonus: 5,  deathReduction: 1.0 } },
  "herbal_antidote":        { category: "mission", mission: { successBonus: 5,  deathReduction: 0.85 } },
  "swiftfoot_brew":         { category: "mission", mission: { successBonus: 3,  deathReduction: 1.0 } },
  "eagle_eye_elixir":       { category: "mission", mission: { successBonus: 15, deathReduction: 1.0 } },

  // ── Combat potions (used during combat, consumed) ─────────────
  "strength_elixir_equip":  { category: "combat", combat: { type: "damage_boost", value: 50, duration: 2, trigger: "before_first_attack" } },
  "strength_draught":       { category: "combat", combat: { type: "damage_boost", value: 25, duration: 3, trigger: "before_first_attack" } },
  "ironhide_tonic":         { category: "combat", combat: { type: "defense_boost", value: 30, duration: 3, trigger: "auto_low_hp" } },
  "phoenix_tears":          { category: "combat", combat: { type: "heal_pct", value: 100, trigger: "auto_low_hp" } },
  "scholars_draught":       { category: "mission", mission: { successBonus: 0, deathReduction: 1.0 } }, // XP bonus handled separately
  "foragers_tonic":         { category: "mission", mission: { successBonus: 0, deathReduction: 1.0 } }, // food bonus handled separately

  // ── Recovery items (between-event heal on expeditions, pre-combat heal on simple missions) ─
  "bandage":                { category: "recovery", recovery: { healPct: 25 } },
  "mending_potion":         { category: "recovery", recovery: { healPct: 50 } },
};

export function getPotionInfo(itemId: string): PotionInfo | undefined {
  return POTION_REGISTRY[itemId];
}

export function getSupplyEffect(itemId: string): MissionSupplyEffect | undefined {
  return POTION_REGISTRY[itemId]?.mission;
}

export function getCombatPotionEffect(itemId: string): CombatPotionEffect | undefined {
  return POTION_REGISTRY[itemId]?.combat;
}

export function getRecoveryEffect(itemId: string): RecoveryEffect | undefined {
  return POTION_REGISTRY[itemId]?.recovery;
}

export function isSupplyItem(itemId: string): boolean {
  return itemId in POTION_REGISTRY;
}

// ─── Food Effects ──────────────────────────────────────────────
// Food items are equipped in an adventurer's food slot. Effects apply only to
// that adventurer. Matching the adv's foodPreference grants a bonus (+10 HP on
// top of the base effect, and +1 loyalty on successful mission completion).

export interface FoodEffect {
  /** Stat bonus to a specific stat (non-combat and combat both benefit). */
  statBonus?: { stat: "str" | "dex" | "int" | "vit" | "wis"; amount: number };
  /** Flat HP bonus applied before combat starts. */
  hpBonus?: number;
}

export const FOOD_EFFECTS: Record<string, FoodEffect> = {
  // Campfire recipes (Lv 1-2)
  peppered_jerky: { statBonus: { stat: "str", amount: 1 } },
  herb_salad: { statBonus: { stat: "dex", amount: 1 } },
  smoked_fish: { statBonus: { stat: "int", amount: 1 } },
  grilled_mushrooms: { hpBonus: 5 },
};

/** Bonus when the food's flavor matches the adventurer's preference. */
export const MATCHED_FOOD_HP_BONUS = 10;
export const MATCHED_FOOD_LOYALTY_BONUS = 1;

export function getFoodEffect(itemId: string): FoodEffect | undefined {
  return FOOD_EFFECTS[itemId];
}

export function isFoodItem(itemId: string): boolean {
  const item = getItem(itemId);
  return !!item?.foodFlavors?.length;
}

export function isCombatPotion(itemId: string): boolean {
  return POTION_REGISTRY[itemId]?.category === "combat";
}

export function isMissionPotion(itemId: string): boolean {
  return POTION_REGISTRY[itemId]?.category === "mission";
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  /** Enchantments applied to this stack. Enchanted items unstack (qty=1) */
  enchantments?: string[];
}

export function getAvailableSupplies(inventory: InventoryItem[], category?: PotionCategory): { item: { id: string; name: string; icon: string; description: string }; qty: number }[] {
  return inventory
    .filter((inv) => inv.quantity > 0 && isSupplyItem(inv.itemId) && (!category || POTION_REGISTRY[inv.itemId]?.category === category))
    .map((inv) => {
      const item = getItem(inv.itemId);
      if (item) return { item, qty: inv.quantity };
      // Fall back to alchemy recipe data for herb-brewed potions
      const alch = ALCHEMY_RECIPES.find((r) => r.id === inv.itemId);
      if (alch) return { item: { id: alch.id, name: alch.name, icon: alch.icon, description: alch.description }, qty: inv.quantity };
      return null;
    })
    .filter(Boolean) as { item: { id: string; name: string; icon: string; description: string }; qty: number }[];
}

export function getAvailableFood(inventory: InventoryItem[]): { item: ItemDefinition; qty: number }[] {
  return inventory
    .filter((inv) => inv.quantity > 0 && isFoodItem(inv.itemId))
    .map((inv) => {
      const item = getItem(inv.itemId);
      return item ? { item, qty: inv.quantity } : null;
    })
    .filter(Boolean) as { item: ItemDefinition; qty: number }[];
}

export const MAX_MISSION_SUPPLIES = 3;

// ─── Crafting Materials ────────────────────────────────────────
// Monster drops and rare finds. Stored in inventory, used in crafting recipes.

export type MaterialCategory = "hide" | "bone" | "metal" | "cloth" | "alchemy" | "enchanting" | "gem" | "dragon";

export interface MaterialDefinition {
  id: string;
  name: string;
  icon: string;
  image?: string;
  description: string;   // flavor text
  category: MaterialCategory;
  tier: 1 | 2 | 3 | 4 | 5;  // rarity tier, matches enemy tiers
}

export const MATERIALS: MaterialDefinition[] = [
  // ── Hides & Leather ──────────────────────────────────────────
  {
    id: "wolfhide_strip", name: "Wolfhide Strip", icon: "🐺",
    description: "Tough and pungent. The frontier tanners prefer it to cattle leather.",
    category: "hide", tier: 1,
  },
  {
    id: "chitin_plate", name: "Chitin Plate", icon: "🕷️",
    description: "Peeled from a cave spider's back. Light as wood, hard as iron.",
    category: "hide", tier: 2,
  },
  {
    id: "trollhide", name: "Trollhide", icon: "🧌",
    description: "Still warm hours after skinning. The regeneration lingers in the leather.",
    category: "hide", tier: 3,
  },
  {
    id: "wyrmshell_plate", name: "Wyrmshell Plate", icon: "🐉",
    description: "A dragon scale the size of a dinner plate. Forge-resistant — you'll need dragonfire to shape it.",
    category: "hide", tier: 3,
  },
  {
    id: "wyrm_scale", name: "Wyrm Scale", icon: "🐲",
    description: "From an ancient wyrm. Iridescent, warm to the touch, and harder than any steel the Khazdurim have forged.",
    category: "hide", tier: 5,
  },

  // ── Bone & Sinew ─────────────────────────────────────────────
  {
    id: "gnawed_marrow", name: "Gnawed Marrow", icon: "🦴",
    description: "Cracked open and half-eaten. Still useful for bone meal and alchemical grinding.",
    category: "bone", tier: 1,
  },
  {
    id: "bonewalk_shard", name: "Bonewalk Shard", icon: "💀",
    description: "A piece of a skeleton that kept walking after death. The marrow hums faintly.",
    category: "bone", tier: 1,
  },
  {
    id: "sinew_cord", name: "Sinew Cord", icon: "🪢",
    description: "Dried wolf tendon, twisted tight. Makes a bowstring that won't snap in the cold.",
    category: "bone", tier: 1,
  },
  {
    id: "fang", name: "Fang", icon: "🦷",
    description: "Long, curved, and still sharp. The Zah'kari string them on necklaces for courage.",
    category: "bone", tier: 1,
  },
  {
    id: "dragon_fang", name: "Dragon Fang", icon: "🦷",
    description: "Hot to the touch even weeks after extraction. A Blacksmith's dream — and nightmare.",
    category: "bone", tier: 4,
  },

  // ── Metal & Salvage ──────────────────────────────────────────
  {
    id: "highwaymans_steel", name: "Highwayman's Steel", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/highwaymans_steel.png", icon: "🔩",
    description: "Rusty, chipped, but serviceable. Melt it down and the iron remembers its shape.",
    category: "metal", tier: 1,
  },
  {
    id: "cursed_iron", name: "Cursed Iron", icon: "⛓️",
    description: "Taken from an undead archer's quiver. Cold to the touch, always. The Blacksmith says it holds an edge forever.",
    category: "metal", tier: 2,
  },
  {
    id: "orc_steel", name: "Orc Steel", icon: "⚔️",
    description: "Crude but brutally effective. Heavier than Dominion steel, with an ugly green tint.",
    category: "metal", tier: 2,
  },
  {
    id: "infernal_link", name: "Infernal Link", icon: "🔗",
    description: "A single chain link from a demon's armor. It doesn't rust, doesn't cool, and hums when holy water is near.",
    category: "metal", tier: 4,
  },

  // ── Cloth & Thread ───────────────────────────────────────────
  {
    id: "torn_banner", name: "Torn Banner", icon: "🏴",
    description: "Ripped from an orc warlord's standard. The dye is surprisingly fine — the Tailors can work with this.",
    category: "cloth", tier: 2,
  },
  {
    id: "ghostweave", name: "Ghostweave", icon: "🕸️",
    description: "Thread spun from spectral residue. Nearly invisible, cold as moonlight, and impossibly strong.",
    category: "cloth", tier: 3,
  },
  {
    id: "windweave_fiber", name: "Windweave Fiber", icon: "💨",
    description: "Harvested from a storm sprite's wake. Cloth made from this weighs nothing and dries instantly.",
    category: "cloth", tier: 3,
  },

  // ── Alchemy Ingredients ──────────────────────────────────────
  {
    id: "spinners_bile", name: "Spinner's Bile", icon: "🧪",
    description: "Venom from a cave spider. The frontier folk call them Spinners. Don't drink this. Obviously.",
    category: "alchemy", tier: 2,
  },
  {
    id: "barrow_ash", name: "Barrow Ash", icon: "⚱️",
    description: "Grey dust from where the dead walked. Alchemists say it stabilizes volatile mixtures. Nobody asks why.",
    category: "alchemy", tier: 2,
  },
  {
    id: "war_paint", name: "War Paint", icon: "🎨",
    description: "Scraped from an orc's face. The pigment is mixed with something alchemical — it numbs the skin and dulls pain.",
    category: "alchemy", tier: 2,
  },
  {
    id: "dragon_blood", name: "Dragon Blood", icon: "🩸",
    description: "Thick, hot, and luminous. A single vial can fuel a dozen potions. Handle with gloves.",
    category: "alchemy", tier: 4,
  },
  {
    id: "dragonfire_ash", name: "Dragonfire Ash", icon: "🔥",
    description: "What's left after dragonfire burns the air itself. Smells like a forge and a thunderstorm had a child.",
    category: "alchemy", tier: 2,
  },
  {
    id: "ashblood", name: "Ashblood", icon: "🩸",
    description: "Demon blood. It smells like burning hair and moves on its own when left in a bowl. The Khor'vani pay well for this.",
    category: "alchemy", tier: 4,
  },
  {
    id: "hellite", name: "Hellite", icon: "💜",
    description: "Crystallized brimstone from the demon realm. Burns cold. The Alchemists say it's 'theoretically useful and practically terrifying.'",
    category: "alchemy", tier: 4,
  },

  // ── Enchanting Essences ──────────────────────────────────────
  {
    id: "veilmist", name: "Veilmist", icon: "🌫️",
    description: "Mist from the other side of the boundary. Collected in a sealed flask, it swirls endlessly. The dead breathe this.",
    category: "enchanting", tier: 2,
  },
  {
    id: "soul_shard", name: "Soul Shard", icon: "💎",
    description: "A splinter of crystallized life-force. It pulses faintly. The Thornveil say it's not a thing — it's a person.",
    category: "enchanting", tier: 2,
  },
  {
    id: "shimmer", name: "Shimmer", icon: "✨",
    description: "Pure Aether dust. Weightless, warm, and faintly luminous. The base ingredient for any serious enchantment.",
    category: "enchanting", tier: 4,
  },
  {
    id: "livingflame_bead", name: "Livingflame Bead", icon: "🔴",
    description: "The core of a flame wisp, still glowing. It never cools. Keep it away from parchment.",
    category: "enchanting", tier: 3,
  },
  {
    id: "thunderglass", name: "Thunderglass", icon: "⚡",
    description: "Lightning crystallized into smooth, dark glass. It crackles when you hold it. Don't hold it for long.",
    category: "enchanting", tier: 3,
  },
  {
    id: "frozen_droplet", name: "Frozen Droplet", icon: "❄️",
    description: "Water from a tide serpent, frozen solid and refusing to melt. The cold radiates outward like a tiny winter.",
    category: "enchanting", tier: 3,
  },
  {
    id: "heartstone", name: "Heartstone", icon: "🗿",
    description: "The core of a stone golem. It hums with the memory of wanting to move. Warm despite being rock.",
    category: "enchanting", tier: 3,
  },
  {
    id: "voidthorn", name: "Voidthorn", icon: "🖤",
    description: "A shard of crystallized darkness from beyond the boundary. It drinks light and pricks like a needle that isn't there.",
    category: "enchanting", tier: 5,
  },
  {
    id: "shadow_fragment", name: "Shadow Fragment", icon: "🌑",
    description: "A piece of a Shadow Lord. It exists and doesn't. Looking at it too long gives you a headache shaped like a scream.",
    category: "enchanting", tier: 5,
  },

  // ── Gems & Divine ────────────────────────────────────────────
  {
    id: "keening_shard", name: "Keening Shard", icon: "💠",
    description: "Crystallized from a banshee's scream. It hums a single note, always. Jewelcrafters say it's beautiful. Everyone else says it's unsettling.",
    category: "gem", tier: 4,
  },
  {
    id: "godspark", name: "Godspark", icon: "⭐",
    description: "A fragment of dormant divine essence. Warm, golden, and faintly aware. The Church would kill to have this. The Cult would kill to use it.",
    category: "gem", tier: 4,
  },
  {
    id: "dormant_sigil", name: "Dormant Sigil", icon: "⚜️",
    description: "Pried from a temple guardian's chest. The runes are dark now, but they flicker when you pray.",
    category: "gem", tier: 4,
  },
  {
    id: "seraphs_grief", name: "Seraph's Grief", icon: "💧",
    description: "Liquid light, pooled from a fallen seraph's eyes. It's warm. It's sad. And it remembers being righteous.",
    category: "gem", tier: 5,
  },
  {
    id: "aether_core", name: "Aether Core", icon: "💠",
    description: "The heart of an Aether Colossus. Pure crystallized magic, dense as lead, bright as noon. The Hauts-Cieux would weep to hold this.",
    category: "gem", tier: 5,
  },

  // ── Dragon-specific ──────────────────────────────────────────
  {
    id: "pyrewing_core", name: "Pyrewing Core", icon: "🔥",
    description: "The furnace inside an ancient wyrm. It still burns. It will burn for centuries. Handle with something that isn't your hands.",
    category: "dragon", tier: 5,
  },
  {
    id: "wyrm_heart", name: "Wyrm Heart", icon: "❤️‍🔥",
    description: "Massive, slow-beating, and too hot to carry bare-handed. The Tianzhou scholars say a wyrm heart can power a city. Nobody has tested this.",
    category: "dragon", tier: 5,
  },
  {
    id: "lichglass", name: "Lichglass", icon: "🔮",
    description: "A fragment of a lich's phylactery. Looks like glass, feels like ice, and whispers equations when the moon is full.",
    category: "enchanting", tier: 4,
  },

  // ── New Materials — Content Expansion ──────────────────────────

  // Hides
  { id: "thick_pelt", name: "Thick Pelt", icon: "🐻", description: "Heavy bear fur, tough enough to turn a blade. Smells worse than it looks.", category: "hide", tier: 1 },
  { id: "bristlehide", name: "Bristlehide", icon: "🐗", description: "Coarse boar skin covered in needle-sharp bristles. Makes surprisingly good padding.", category: "hide", tier: 1 },

  // Bones & Parts
  { id: "bear_claw", name: "Bear Claw", icon: "🐾", description: "Curved, sharp, and the size of a dagger. The hunters mount them as trophies. The Jewelcrafters see raw material.", category: "bone", tier: 1 },
  { id: "serpent_fang", name: "Serpent Fang", icon: "🐍", description: "Hollow, curved, and still glistening with venom. Handle with thick gloves.", category: "bone", tier: 1 },
  { id: "tusk_shard", name: "Tusk Shard", icon: "🦷", description: "A broken boar tusk, dense as stone. The Khazdurim use them for practice scrimshaw.", category: "bone", tier: 1 },
  { id: "alpha_fang", name: "Alpha Fang", icon: "🐺", description: "The largest fang from the pack leader's jaw. Warm to the touch, as if the beast's fury persists.", category: "bone", tier: 2 },
  { id: "beast_heart", name: "Beast Heart", icon: "❤️", description: "Massive, still faintly warm. The old hunters say eating it raw gives you the bear's courage. Don't.", category: "alchemy", tier: 3 },

  // Alchemy
  { id: "snake_oil", name: "Snake Oil", icon: "🧪", description: "Rendered from marsh adder venom. The alchemists call it a universal solvent. Everyone else calls it poison.", category: "alchemy", tier: 1 },
  { id: "glowcap_spore", name: "Glowcap Spore", icon: "🍄", description: "Luminous fungal spores that glow blue-green in the dark. Mildly hallucinogenic if inhaled. Useful for alchemy.", category: "alchemy", tier: 1 },
  { id: "ghoul_marrow", name: "Ghoul Marrow", icon: "🦴", description: "Grey, cold, and faintly luminescent. The alchemists want it. The priests want it burned. The alchemists are more persuasive.", category: "alchemy", tier: 2 },
  { id: "grave_dust", name: "Grave Dust", icon: "💀", description: "Fine grey powder from where the undead walk. Disturbing to collect, invaluable to enchanters.", category: "alchemy", tier: 2 },
  { id: "witch_eye", name: "Witch's Eye", icon: "👁️", description: "A glass eye that isn't glass. It blinks when you're not looking. The witch says she has a spare.", category: "enchanting", tier: 2 },
  { id: "hex_fetish", name: "Hex Fetish", icon: "🪬", description: "A crude totem of bone and feathers, still humming with hedge-magic. The goblins hang them from their belts like lucky charms.", category: "enchanting", tier: 2 },

  // Nature
  { id: "living_heartwood", name: "Living Heartwood", icon: "🪵", description: "Cut from the core of a corrupted treant. It's warm, it bleeds sap, and if you leave it in soil it tries to grow roots overnight.", category: "enchanting", tier: 3 },
  { id: "amber_resin", name: "Amber Resin", icon: "🟠", description: "Golden tree-blood hardened into crystal. Ancient insects trapped inside sometimes still move.", category: "gem", tier: 3 },
  { id: "charite", name: "Charite", icon: "🔶", description: "Crystallized fire-ash from the bones of a Burnt Skeleton. It's always warm and glows faintly in the dark.", category: "enchanting", tier: 2 },

  // Elemental Gems
  { id: "crude_ruby", name: "Crude Ruby", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/crude_ruby.png", icon: "🔴", description: "An uncut fire-touched gemstone, cloudy and rough. A Jewelcrafter could refine it into something beautiful.", category: "gem", tier: 2 },
  { id: "fire_ruby", name: "Fire Ruby", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/fire_ruby.png", icon: "❤️‍🔥", description: "A deep red gem that pulses with inner heat. Cut properly, it holds fire magic like a lantern holds flame.", category: "gem", tier: 3 },
  { id: "frost_sapphire", name: "Frost Sapphire", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/frost_sapphire.png", icon: "💎", description: "Blue as a winter sky, cold to the touch even in summer. Water beads and freezes on its surface.", category: "gem", tier: 3 },
  { id: "storm_topaz", name: "Storm Topaz", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/storm_topaz.png", icon: "⚡", description: "Yellow-white and crackling with static. Touch it and your hair stands on end for an hour.", category: "gem", tier: 3 },
  { id: "void_topaz", name: "Void Topaz", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/void_topaz.png", icon: "🟣", description: "Black as a moonless night with faint purple veins. It absorbs light rather than reflecting it. Unsettling to hold.", category: "gem", tier: 4 },
  { id: "emerald_shard", name: "Emerald Shard", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/emerald_shard.png", icon: "💚", description: "A fragment of living crystal, green as new growth. Plants lean toward it. The Silvaneth say it remembers being a forest.", category: "gem", tier: 3 },
  { id: "moonstone", name: "Moonstone", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/moonstone_gem.png", icon: "🌙", description: "White as milk with an inner shimmer like captured moonlight. The priests say it's a fragment of divine attention. The enchanters say it's useful. Both are right.", category: "gem", tier: 4 },
];

export function getMaterial(id: string): MaterialDefinition | undefined {
  return MATERIALS.find((m) => m.id === id);
}

export function getMaterialsByCategory(category: MaterialCategory): MaterialDefinition[] {
  return MATERIALS.filter((m) => m.category === category);
}
