import type { AdventurerStats } from "./adventurers";
import type { ItemSlot } from "./items";

// ─── Enchantment Definitions ────────────────────────────────────

export interface EnchantmentDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Which item slots this enchantment can be applied to */
  validSlots: ItemSlot[];
  /** Stat bonuses added by the enchantment */
  stats?: Partial<AdventurerStats>;
  /** Flat defense bonus */
  defenseBonus?: number;
  /** Extra damage (flat, added to attack power) */
  damageBonus?: number;
  /** Element type for flavor */
  element?: "fire" | "frost" | "lightning" | "holy" | "shadow" | "nature" | "arcane";
  /** Material costs */
  costs: { resource: string; amount: number }[];
  /** Required Mage Tower level */
  minTowerLevel: number;
}

export const ENCHANTMENTS: EnchantmentDefinition[] = [
  // ── Weapon enchantments ─────────────────────────────────────────
  {
    id: "fire_edge",
    name: "Fire Edge",
    icon: "🔥",
    description: "+5 fire damage on hit",
    validSlots: ["mainHand", "offHand"],
    damageBonus: 5,
    element: "fire",
    costs: [{ resource: "livingflame_bead", amount: 2 }],
    minTowerLevel: 1,
  },
  {
    id: "frost_bite",
    name: "Frost Bite",
    icon: "❄️",
    description: "+3 damage, +2 WIS",
    validSlots: ["mainHand", "offHand"],
    damageBonus: 3,
    stats: { wis: 2 },
    element: "frost",
    costs: [{ resource: "frozen_droplet", amount: 2 }],
    minTowerLevel: 1,
  },
  {
    id: "lightning_strike",
    name: "Lightning Strike",
    icon: "⚡",
    description: "+8 damage (staves only)",
    validSlots: ["mainHand"],
    damageBonus: 8,
    element: "lightning",
    costs: [{ resource: "thunderglass", amount: 2 }],
    minTowerLevel: 2,
  },
  {
    id: "holy_smite",
    name: "Holy Smite",
    icon: "✝️",
    description: "+4 holy damage, +2 INT",
    validSlots: ["mainHand", "offHand"],
    damageBonus: 4,
    stats: { int: 2 },
    element: "holy",
    costs: [{ resource: "godspark", amount: 1 }],
    minTowerLevel: 3,
  },
  {
    id: "shadow_edge",
    name: "Shadow Edge",
    icon: "🌑",
    description: "+6 damage, +3 DEX",
    validSlots: ["mainHand", "offHand"],
    damageBonus: 6,
    stats: { dex: 3 },
    element: "shadow",
    costs: [{ resource: "shadow_fragment", amount: 1 }, { resource: "veilmist", amount: 2 }],
    minTowerLevel: 3,
  },
  {
    id: "dragonfire",
    name: "Dragonfire",
    icon: "🐉",
    description: "+12 fire damage, +3 STR",
    validSlots: ["mainHand"],
    damageBonus: 12,
    stats: { str: 3 },
    element: "fire",
    costs: [{ resource: "dragonfire_ash", amount: 3 }, { resource: "dragon_blood", amount: 1 }],
    minTowerLevel: 4,
  },

  // ── Armor enchantments ──────────────────────────────────────────
  {
    id: "frost_ward",
    name: "Frost Ward",
    icon: "❄️",
    description: "+10 DEF, +2 VIT",
    validSlots: ["chest", "head", "legs"],
    defenseBonus: 10,
    stats: { vit: 2 },
    element: "frost",
    costs: [{ resource: "frozen_droplet", amount: 1 }, { resource: "shimmer", amount: 1 }],
    minTowerLevel: 1,
  },
  {
    id: "fire_ward",
    name: "Fire Ward",
    icon: "🔥",
    description: "+8 DEF, +3 VIT",
    validSlots: ["chest", "head", "legs"],
    defenseBonus: 8,
    stats: { vit: 3 },
    element: "fire",
    costs: [{ resource: "livingflame_bead", amount: 1 }, { resource: "shimmer", amount: 1 }],
    minTowerLevel: 1,
  },
  {
    id: "arcane_shield",
    name: "Arcane Shield",
    icon: "💠",
    description: "+5 DEF, +3 WIS, +2 INT",
    validSlots: ["chest", "head", "cloak"],
    defenseBonus: 5,
    stats: { wis: 3, int: 2 },
    element: "arcane",
    costs: [{ resource: "shimmer", amount: 2 }],
    minTowerLevel: 2,
  },
  {
    id: "nature_blessing",
    name: "Nature's Blessing",
    icon: "🌿",
    description: "+3 VIT, +3 WIS",
    validSlots: ["chest", "cloak", "boots"],
    stats: { vit: 3, wis: 3 },
    element: "nature",
    costs: [{ resource: "heartstone", amount: 1 }],
    minTowerLevel: 2,
  },
  {
    id: "shadow_weave",
    name: "Shadow Weave",
    icon: "🌑",
    description: "+5 DEX, +5 DEF",
    validSlots: ["cloak", "boots", "chest"],
    defenseBonus: 5,
    stats: { dex: 5 },
    element: "shadow",
    costs: [{ resource: "ghostweave", amount: 2 }, { resource: "veilmist", amount: 1 }],
    minTowerLevel: 3,
  },

  // ── Accessory/boot enchantments ─────────────────────────────────
  {
    id: "swiftness",
    name: "Swiftness",
    icon: "💨",
    description: "+5 DEX",
    validSlots: ["boots", "cloak", "ring1", "ring2"],
    stats: { dex: 5 },
    costs: [{ resource: "windweave_fiber", amount: 2 }],
    minTowerLevel: 1,
  },
  {
    id: "fortitude",
    name: "Fortitude",
    icon: "💪",
    description: "+5 STR, +3 VIT",
    validSlots: ["ring1", "ring2", "amulet"],
    stats: { str: 5, vit: 3 },
    costs: [{ resource: "heartstone", amount: 1 }, { resource: "orc_steel", amount: 2 }],
    minTowerLevel: 2,
  },
  {
    id: "divine_grace",
    name: "Divine Grace",
    icon: "👼",
    description: "+5 WIS, +3 INT, +5 DEF",
    validSlots: ["amulet", "ring1", "ring2"],
    defenseBonus: 5,
    stats: { wis: 5, int: 3 },
    element: "holy",
    costs: [{ resource: "godspark", amount: 1 }, { resource: "shimmer", amount: 2 }],
    minTowerLevel: 4,
  },
];

export function getEnchantment(id: string): EnchantmentDefinition | undefined {
  return ENCHANTMENTS.find((e) => e.id === id);
}

export function getEnchantmentsForSlot(slot: ItemSlot): EnchantmentDefinition[] {
  return ENCHANTMENTS.filter((e) => e.validSlots.includes(slot));
}
