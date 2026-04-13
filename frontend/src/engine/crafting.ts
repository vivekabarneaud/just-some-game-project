// ─── Crafting ───────────────────────────────────────────────────

export interface CraftingRecipe {
  id: string;
  name: string;
  icon: string;
  building: string; // building ID required
  minLevel: number; // minimum building level
  costs: { resource: string; amount: number }[];
  produces: { resource: string; amount: number };
  craftTime: number; // game-seconds
}

export interface ActiveCraft {
  recipeId: string;
  remaining: number; // game-seconds for current item
  quantity?: number;  // total items to craft (counts down as each completes)
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: "wool_clothing",
    name: "Wool Clothing",
    icon: "🧥",
    building: "tailoring_shop",
    minLevel: 1,
    costs: [{ resource: "wool", amount: 8 }],
    produces: { resource: "clothing", amount: 1 },
    craftTime: 30, // 10 min
  },
  {
    id: "woolen_robe",
    name: "Woolen Robe",
    icon: "🧶",
    building: "tailoring_shop",
    minLevel: 1,
    costs: [{ resource: "wool", amount: 6 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 30, // 8 min
  },
  {
    id: "linen_clothing",
    name: "Linen Clothing",
    icon: "👘",
    building: "tailoring_shop",
    minLevel: 1,
    costs: [{ resource: "fiber", amount: 10 }],
    produces: { resource: "clothing", amount: 1 },
    craftTime: 30, // 12 min
  },
  {
    id: "fine_clothing",
    name: "Fine Clothing",
    icon: "👔",
    building: "tailoring_shop",
    minLevel: 3,
    costs: [{ resource: "wool", amount: 5 }, { resource: "fiber", amount: 5 }, { resource: "gold", amount: 10 }],
    produces: { resource: "clothing", amount: 2 },
    craftTime: 300, // 15 min
  },

  // ── Tailoring — Robes ──────────────────────────────────────────
  {
    id: "priest_robes",
    name: "Priest Robes",
    icon: "🥋",
    building: "tailoring_shop",
    minLevel: 2,
    costs: [{ resource: "fiber", amount: 12 }, { resource: "wool", amount: 6 }, { resource: "gold", amount: 15 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 120, // 20 min
  },
  {
    id: "wizard_robes",
    name: "Wizard Robes",
    icon: "🧙",
    building: "tailoring_shop",
    minLevel: 3,
    costs: [{ resource: "fiber", amount: 15 }, { resource: "wool", amount: 8 }, { resource: "gold", amount: 20 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 300, // 25 min
  },

  // ── Woodworker recipes ────────────────────────────────────────
  {
    id: "wooden_staff",
    name: "Wooden Staff",
    icon: "🪄",
    building: "woodworker",
    minLevel: 1,
    costs: [{ resource: "wood", amount: 15 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 30, // 8 min
  },
  {
    id: "short_bow",
    name: "Short Bow",
    icon: "🏹",
    building: "woodworker",
    minLevel: 1,
    costs: [{ resource: "wood", amount: 10 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 30, // 5 min
  },
  {
    id: "hunting_bow",
    name: "Hunting Bow",
    icon: "🏹",
    building: "woodworker",
    minLevel: 2,
    costs: [{ resource: "wood", amount: 12 }, { resource: "fiber", amount: 5 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 120, // 10 min
  },
  {
    id: "wooden_shield",
    name: "Wooden Shield",
    icon: "🪵",
    building: "woodworker",
    minLevel: 2,
    costs: [{ resource: "wood", amount: 20 }, { resource: "iron", amount: 3 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 120, // 12 min
  },
  {
    id: "longbow",
    name: "Longbow",
    icon: "🎯",
    building: "woodworker",
    minLevel: 4,
    costs: [{ resource: "wood", amount: 25 }, { resource: "fiber", amount: 10 }, { resource: "iron", amount: 5 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 600, // 20 min
  },
  {
    id: "enchanted_staff",
    name: "Enchanted Staff",
    icon: "✨",
    building: "woodworker",
    minLevel: 6,
    costs: [{ resource: "wood", amount: 20 }, { resource: "gold", amount: 30 }, { resource: "astralShards", amount: 2 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 1200, // 30 min
  },

  // ── Blacksmith recipes ────────────────────────────────────────
  {
    id: "iron_tools",
    name: "Iron Tools",
    icon: "🔧",
    building: "blacksmith",
    minLevel: 1,
    costs: [{ resource: "iron", amount: 10 }, { resource: "wood", amount: 5 }],
    produces: { resource: "tools", amount: 1 },
    craftTime: 30, // 10 min
  },
  {
    id: "iron_sword",
    name: "Iron Sword",
    icon: "⚔️",
    building: "blacksmith",
    minLevel: 1,
    costs: [{ resource: "iron", amount: 15 }, { resource: "wood", amount: 5 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 30, // 15 min
  },
  {
    id: "iron_shield",
    name: "Iron Shield",
    icon: "🛡️",
    building: "blacksmith",
    minLevel: 2,
    costs: [{ resource: "iron", amount: 20 }, { resource: "wood", amount: 8 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 120, // 20 min
  },
  {
    id: "iron_armor",
    name: "Iron Armor",
    icon: "🦺",
    building: "blacksmith",
    minLevel: 3,
    costs: [{ resource: "iron", amount: 30 }, { resource: "fiber", amount: 5 }, { resource: "gold", amount: 15 }],
    produces: { resource: "armor", amount: 2 },
    craftTime: 300, // 30 min
  },
  {
    id: "chainmail",
    name: "Chainmail Armor",
    icon: "⛓️",
    building: "blacksmith",
    minLevel: 4,
    costs: [{ resource: "iron", amount: 35 }, { resource: "fiber", amount: 8 }, { resource: "gold", amount: 20 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 600, // 35 min
  },
  {
    id: "steel_sword",
    name: "Steel Sword",
    icon: "🗡️",
    building: "blacksmith",
    minLevel: 5,
    costs: [{ resource: "iron", amount: 40 }, { resource: "gold", amount: 25 }],
    produces: { resource: "weapons", amount: 2 },
    craftTime: 900, // 40 min
  },

  // ── Leatherworking recipes ────────────────────────────────────
  {
    id: "leather_vest",
    name: "Leather Vest",
    icon: "🦺",
    building: "leatherworking",
    minLevel: 1,
    costs: [{ resource: "leather", amount: 12 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 30,
  },
  {
    id: "leather_boots",
    name: "Leather Boots",
    icon: "🥾",
    building: "leatherworking",
    minLevel: 1,
    costs: [{ resource: "leather", amount: 8 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 30,
  },
  {
    id: "leather_hood",
    name: "Leather Hood",
    icon: "🪖",
    building: "leatherworking",
    minLevel: 2,
    costs: [{ resource: "leather", amount: 10 }, { resource: "fiber", amount: 4 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 60,
  },
  {
    id: "leather_pants",
    name: "Leather Pants",
    icon: "👖",
    building: "leatherworking",
    minLevel: 2,
    costs: [{ resource: "leather", amount: 14 }, { resource: "fiber", amount: 4 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 60,
  },
  {
    id: "leather_cloak",
    name: "Leather Cloak",
    icon: "🧥",
    building: "leatherworking",
    minLevel: 3,
    costs: [{ resource: "leather", amount: 10 }, { resource: "fiber", amount: 8 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 120,
  },
  {
    id: "rangers_garb",
    name: "Ranger's Garb",
    icon: "🏹",
    building: "leatherworking",
    minLevel: 4,
    costs: [{ resource: "leather", amount: 20 }, { resource: "fiber", amount: 10 }, { resource: "gold", amount: 15 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 300,
  },
  {
    id: "shadow_mantle",
    name: "Shadow Mantle",
    icon: "🗡️",
    building: "leatherworking",
    minLevel: 5,
    costs: [{ resource: "leather", amount: 25 }, { resource: "fiber", amount: 12 }, { resource: "gold", amount: 20 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 600,
  },

  // ── Material-based recipes — Blacksmith ───────────────────────
  {
    id: "orc_cleaver",
    name: "Orc Cleaver",
    icon: "🪓",
    building: "blacksmith",
    minLevel: 3,
    costs: [{ resource: "orc_steel", amount: 3 }, { resource: "iron", amount: 10 }, { resource: "wood", amount: 5 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 300,
  },
  {
    id: "cursed_blade",
    name: "Cursed Blade",
    icon: "⚔️",
    building: "blacksmith",
    minLevel: 4,
    costs: [{ resource: "cursed_iron", amount: 4 }, { resource: "iron", amount: 15 }, { resource: "bonewalk_shard", amount: 2 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 600,
  },
  {
    id: "dragonbone_sword",
    name: "Dragonbone Sword",
    icon: "🗡️",
    building: "blacksmith",
    minLevel: 5,
    costs: [{ resource: "dragon_fang", amount: 2 }, { resource: "wyrmshell_plate", amount: 3 }, { resource: "iron", amount: 20 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 1200,
  },
  {
    id: "infernal_mail",
    name: "Infernal Mail",
    icon: "⛓️",
    building: "blacksmith",
    minLevel: 5,
    costs: [{ resource: "infernal_link", amount: 4 }, { resource: "iron", amount: 25 }, { resource: "ashblood", amount: 2 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 1200,
  },
  {
    id: "fang_necklace",
    name: "Fang Necklace",
    icon: "🦷",
    building: "blacksmith",
    minLevel: 2,
    costs: [{ resource: "fang", amount: 4 }, { resource: "sinew_cord", amount: 2 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 120,
  },

  // ── Material-based recipes — Leatherworking ───────────────────
  {
    id: "wolfhide_armor",
    name: "Wolfhide Armor",
    icon: "🐺",
    building: "leatherworking",
    minLevel: 2,
    costs: [{ resource: "wolfhide_strip", amount: 5 }, { resource: "leather", amount: 8 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 120,
  },
  {
    id: "chitin_vest",
    name: "Chitin Vest",
    icon: "🕷️",
    building: "leatherworking",
    minLevel: 3,
    costs: [{ resource: "chitin_plate", amount: 4 }, { resource: "leather", amount: 6 }, { resource: "sinew_cord", amount: 2 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 300,
  },
  {
    id: "trollhide_cloak",
    name: "Trollhide Cloak",
    icon: "🧌",
    building: "leatherworking",
    minLevel: 4,
    costs: [{ resource: "trollhide", amount: 3 }, { resource: "leather", amount: 10 }, { resource: "fiber", amount: 5 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 600,
  },
  {
    id: "wyrmscale_armor",
    name: "Wyrmscale Armor",
    icon: "🐉",
    building: "leatherworking",
    minLevel: 5,
    costs: [{ resource: "wyrmshell_plate", amount: 5 }, { resource: "leather", amount: 15 }, { resource: "sinew_cord", amount: 4 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 1200,
  },

  // ── Material-based recipes — Tailoring ────────────────────────
  {
    id: "ghostweave_cloak",
    name: "Ghostweave Cloak",
    icon: "👻",
    building: "tailoring_shop",
    minLevel: 4,
    costs: [{ resource: "ghostweave", amount: 4 }, { resource: "fiber", amount: 10 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 600,
  },
  {
    id: "windweave_robe",
    name: "Windweave Robe",
    icon: "💨",
    building: "tailoring_shop",
    minLevel: 4,
    costs: [{ resource: "windweave_fiber", amount: 4 }, { resource: "fiber", amount: 8 }, { resource: "wool", amount: 5 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 600,
  },
  {
    id: "war_banner",
    name: "War Banner",
    icon: "🏴",
    building: "tailoring_shop",
    minLevel: 3,
    costs: [{ resource: "torn_banner", amount: 3 }, { resource: "fiber", amount: 6 }, { resource: "gold", amount: 10 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 300,
  },

  // ── Material-based recipes — Woodworker ───────────────────────
  {
    id: "sinew_bow",
    name: "Sinew Bow",
    icon: "🏹",
    building: "woodworker",
    minLevel: 3,
    costs: [{ resource: "sinew_cord", amount: 3 }, { resource: "wood", amount: 15 }, { resource: "wolfhide_strip", amount: 2 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 300,
  },
  {
    id: "dragonfire_staff",
    name: "Dragonfire Staff",
    icon: "🔥",
    building: "woodworker",
    minLevel: 5,
    costs: [{ resource: "dragonfire_ash", amount: 4 }, { resource: "wood", amount: 20 }, { resource: "livingflame_bead", amount: 2 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 1200,
  },

  // ── New Recipes — Content Expansion ────────────────────────────

  // ── Jewelcrafter Recipes ────────────────────────────────────────
  { id: "copper_band", name: "Copper Band", icon: "💍", building: "jewelcrafter", minLevel: 1,
    costs: [{ resource: "gold", amount: 5 }, { resource: "iron", amount: 3 }], produces: { resource: "armor", amount: 1 }, craftTime: 60 },
  { id: "bone_ring", name: "Bone Ring", icon: "💍", building: "jewelcrafter", minLevel: 1,
    costs: [{ resource: "bonewalk_shard", amount: 3 }, { resource: "sinew_cord", amount: 2 }], produces: { resource: "armor", amount: 1 }, craftTime: 60 },
  { id: "woven_vine_ring", name: "Woven Vine Ring", icon: "💍", building: "jewelcrafter", minLevel: 1,
    costs: [{ resource: "fiber", amount: 3 }, { resource: "iron", amount: 2 }], produces: { resource: "armor", amount: 1 }, craftTime: 60 },
  { id: "ruby_signet", name: "Ruby Signet", icon: "💍", building: "jewelcrafter", minLevel: 3,
    costs: [{ resource: "fire_ruby", amount: 1 }, { resource: "gold", amount: 5 }, { resource: "iron", amount: 3 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },
  { id: "sapphire_ring", name: "Sapphire Ring", icon: "💍", building: "jewelcrafter", minLevel: 3,
    costs: [{ resource: "frost_sapphire", amount: 1 }, { resource: "gold", amount: 5 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },
  { id: "topaz_band", name: "Topaz Band", icon: "💍", building: "jewelcrafter", minLevel: 3,
    costs: [{ resource: "storm_topaz", amount: 1 }, { resource: "gold", amount: 5 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },
  { id: "emerald_loop", name: "Emerald Loop", icon: "💍", building: "jewelcrafter", minLevel: 3,
    costs: [{ resource: "emerald_shard", amount: 1 }, { resource: "gold", amount: 5 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },
  { id: "moonstone_seal", name: "Moonstone Seal", icon: "💍", building: "jewelcrafter", minLevel: 5,
    costs: [{ resource: "moonstone", amount: 1 }, { resource: "godspark", amount: 1 }, { resource: "gold", amount: 10 }], produces: { resource: "armor", amount: 1 }, craftTime: 900 },
  { id: "void_band", name: "Void Band", icon: "💍", building: "jewelcrafter", minLevel: 5,
    costs: [{ resource: "void_topaz", amount: 1 }, { resource: "shadow_fragment", amount: 1 }, { resource: "gold", amount: 10 }], produces: { resource: "armor", amount: 1 }, craftTime: 900 },
  { id: "dragonfire_ring", name: "Dragonfire Ring", icon: "💍", building: "jewelcrafter", minLevel: 6,
    costs: [{ resource: "fire_ruby", amount: 1 }, { resource: "dragon_blood", amount: 1 }, { resource: "gold", amount: 10 }], produces: { resource: "armor", amount: 1 }, craftTime: 1200 },
  // Jewelcrafter — Amulets
  { id: "holy_pendant", name: "Holy Pendant", icon: "✝️", building: "jewelcrafter", minLevel: 3,
    costs: [{ resource: "moonstone", amount: 1 }, { resource: "gold", amount: 8 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },
  { id: "amber_charm", name: "Amber Charm", icon: "🟠", building: "jewelcrafter", minLevel: 3,
    costs: [{ resource: "emerald_shard", amount: 1 }, { resource: "amber_resin", amount: 2 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },
  { id: "predator_tooth", name: "Predator's Tooth", icon: "🦷", building: "jewelcrafter", minLevel: 2,
    costs: [{ resource: "alpha_fang", amount: 1 }, { resource: "sinew_cord", amount: 2 }], produces: { resource: "armor", amount: 1 }, craftTime: 120 },
  { id: "warlord_chain", name: "Warlord's Chain", icon: "⛓️", building: "jewelcrafter", minLevel: 4,
    costs: [{ resource: "orc_steel", amount: 2 }, { resource: "fire_ruby", amount: 1 }, { resource: "gold", amount: 10 }], produces: { resource: "armor", amount: 1 }, craftTime: 600 },
  { id: "ghostveil_locket", name: "Ghostveil Locket", icon: "👻", building: "jewelcrafter", minLevel: 5,
    costs: [{ resource: "ghostweave", amount: 2 }, { resource: "soul_shard", amount: 1 }, { resource: "moonstone", amount: 1 }], produces: { resource: "armor", amount: 1 }, craftTime: 900 },
  // Jewelcrafter — Priest's Circlet
  { id: "priest_circlet", name: "Priest's Circlet", icon: "👑", building: "jewelcrafter", minLevel: 2,
    costs: [{ resource: "gold", amount: 8 }, { resource: "iron", amount: 3 }], produces: { resource: "armor", amount: 1 }, craftTime: 120 },

  // ── Blacksmith — New Recipes ────────────────────────────────────
  { id: "iron_helm", name: "Iron Helm", icon: "🪖", building: "blacksmith", minLevel: 3,
    costs: [{ resource: "iron", amount: 15 }, { resource: "leather", amount: 3 }], produces: { resource: "armor", amount: 1 }, craftTime: 120 },
  { id: "chainmail_coif", name: "Chainmail Coif", icon: "⛓️", building: "blacksmith", minLevel: 4,
    costs: [{ resource: "iron", amount: 20 }, { resource: "fiber", amount: 5 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },
  { id: "iron_greaves", name: "Iron Greaves", icon: "🦵", building: "blacksmith", minLevel: 3,
    costs: [{ resource: "iron", amount: 18 }, { resource: "leather", amount: 3 }], produces: { resource: "armor", amount: 1 }, craftTime: 120 },
  { id: "iron_sabatons", name: "Iron Sabatons", icon: "🥾", building: "blacksmith", minLevel: 3,
    costs: [{ resource: "iron", amount: 12 }, { resource: "leather", amount: 2 }], produces: { resource: "armor", amount: 1 }, craftTime: 120 },
  { id: "stiletto", name: "Stiletto", icon: "🗡️", building: "blacksmith", minLevel: 2,
    costs: [{ resource: "iron", amount: 10 }, { resource: "leather", amount: 3 }], produces: { resource: "weapons", amount: 1 }, craftTime: 60 },
  { id: "poisoned_blade", name: "Poisoned Blade", icon: "🗡️", building: "blacksmith", minLevel: 4,
    costs: [{ resource: "iron", amount: 15 }, { resource: "snake_oil", amount: 2 }, { resource: "spinners_bile", amount: 1 }], produces: { resource: "weapons", amount: 1 }, craftTime: 600 },
  { id: "shadow_dagger", name: "Shadow Dagger", icon: "🗡️", building: "blacksmith", minLevel: 5,
    costs: [{ resource: "shadow_fragment", amount: 1 }, { resource: "iron", amount: 20 }, { resource: "void_topaz", amount: 1 }], produces: { resource: "weapons", amount: 1 }, craftTime: 1200 },
  { id: "iron_mace", name: "Iron Mace", icon: "🔨", building: "blacksmith", minLevel: 2,
    costs: [{ resource: "iron", amount: 12 }, { resource: "wood", amount: 5 }], produces: { resource: "weapons", amount: 1 }, craftTime: 60 },
  { id: "blessed_mace", name: "Blessed Mace", icon: "🔨", building: "blacksmith", minLevel: 4,
    costs: [{ resource: "iron", amount: 20 }, { resource: "moonstone", amount: 1 }, { resource: "gold", amount: 15 }], produces: { resource: "weapons", amount: 1 }, craftTime: 600 },
  { id: "parrying_dagger", name: "Parrying Dagger", icon: "🗡️", building: "blacksmith", minLevel: 3,
    costs: [{ resource: "iron", amount: 10 }, { resource: "leather", amount: 3 }], produces: { resource: "weapons", amount: 1 }, craftTime: 120 },

  // ── Leatherworking — New Recipes ────────────────────────────────
  { id: "shadow_cowl", name: "Shadow Cowl", icon: "🥷", building: "leatherworking", minLevel: 4,
    costs: [{ resource: "leather", amount: 12 }, { resource: "fiber", amount: 6 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },
  { id: "bear_skull_helm", name: "Bear-Skull Helm", icon: "💀", building: "leatherworking", minLevel: 4,
    costs: [{ resource: "bear_claw", amount: 2 }, { resource: "thick_pelt", amount: 3 }, { resource: "leather", amount: 5 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },
  { id: "ranger_trousers", name: "Ranger's Trousers", icon: "👖", building: "leatherworking", minLevel: 3,
    costs: [{ resource: "leather", amount: 14 }, { resource: "fiber", amount: 4 }], produces: { resource: "armor", amount: 1 }, craftTime: 120 },
  { id: "wyrmscale_greaves", name: "Wyrmscale Greaves", icon: "🐉", building: "leatherworking", minLevel: 5,
    costs: [{ resource: "wyrmshell_plate", amount: 3 }, { resource: "leather", amount: 10 }, { resource: "sinew_cord", amount: 2 }], produces: { resource: "armor", amount: 1 }, craftTime: 1200 },
  { id: "scout_boots", name: "Scout's Boots", icon: "🥾", building: "leatherworking", minLevel: 3,
    costs: [{ resource: "leather", amount: 10 }, { resource: "fiber", amount: 3 }], produces: { resource: "armor", amount: 1 }, craftTime: 120 },
  { id: "trollhide_boots", name: "Trollhide Boots", icon: "🥾", building: "leatherworking", minLevel: 4,
    costs: [{ resource: "trollhide", amount: 2 }, { resource: "leather", amount: 6 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },
  { id: "quiver_precision", name: "Quiver of Precision", icon: "🏹", building: "leatherworking", minLevel: 3,
    costs: [{ resource: "leather", amount: 8 }, { resource: "sinew_cord", amount: 3 }], produces: { resource: "armor", amount: 1 }, craftTime: 120 },

  // ── Tailoring — New Recipes ─────────────────────────────────────
  { id: "wizard_hat", name: "Wizard's Hat", icon: "🎩", building: "tailoring_shop", minLevel: 3,
    costs: [{ resource: "fiber", amount: 8 }, { resource: "wool", amount: 4 }, { resource: "gold", amount: 5 }], produces: { resource: "armor", amount: 1 }, craftTime: 120 },
  { id: "cloth_leggings", name: "Cloth Leggings", icon: "👖", building: "tailoring_shop", minLevel: 2,
    costs: [{ resource: "fiber", amount: 8 }, { resource: "wool", amount: 3 }], produces: { resource: "armor", amount: 1 }, craftTime: 60 },
  { id: "soft_shoes", name: "Soft Shoes", icon: "👟", building: "tailoring_shop", minLevel: 2,
    costs: [{ resource: "fiber", amount: 6 }, { resource: "wool", amount: 2 }], produces: { resource: "armor", amount: 1 }, craftTime: 60 },
  { id: "prayer_book", name: "Prayer Book", icon: "📖", building: "tailoring_shop", minLevel: 3,
    costs: [{ resource: "fiber", amount: 6 }, { resource: "gold", amount: 5 }, { resource: "moonstone", amount: 1 }], produces: { resource: "armor", amount: 1 }, craftTime: 300 },

  // ── Woodworker — New Recipes ────────────────────────────────────
  { id: "arcane_focus", name: "Arcane Focus", icon: "🔮", building: "woodworker", minLevel: 4,
    costs: [{ resource: "wood", amount: 10 }, { resource: "livingflame_bead", amount: 1 }], produces: { resource: "weapons", amount: 1 }, craftTime: 300 },

  // ── Kitchen — Food Recipes ──────────────────────────────────────
  // Food uses generic "food" resource (representing whatever the settlement produces)
  // plus specific ingredients (honey, fruit, herbs, mushrooms) for flavor.

  // Special: Cheese (processed ingredient, not a mission food)
  { id: "cheese", name: "Cheese", icon: "🧀", building: "kitchen", minLevel: 1,
    costs: [{ resource: "food", amount: 15 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },

  // Tier 1 — Simple (1 flavor tag)
  { id: "honeycake", name: "Honeycake", icon: "🍯", building: "kitchen", minLevel: 1,
    costs: [{ resource: "food", amount: 10 }, { resource: "honey", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "peppered_jerky", name: "Peppered Jerky", icon: "🌶️", building: "kitchen", minLevel: 1,
    costs: [{ resource: "food", amount: 12 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "herb_salad", name: "Fresh Herb Salad", icon: "🥬", building: "kitchen", minLevel: 1,
    costs: [{ resource: "food", amount: 8 }], produces: { resource: "potions", amount: 1 }, craftTime: 20 },
  { id: "smoked_fish", name: "Smoked Fish", icon: "🐟", building: "kitchen", minLevel: 1,
    costs: [{ resource: "food", amount: 10 }, { resource: "wood", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "meat_pie", name: "Meat Pie", icon: "🥧", building: "kitchen", minLevel: 2,
    costs: [{ resource: "food", amount: 15 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "cheese_bread", name: "Cheese Bread", icon: "🧀", building: "kitchen", minLevel: 2,
    costs: [{ resource: "food", amount: 10 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "grilled_mushrooms", name: "Grilled Mushrooms", icon: "🍄", building: "kitchen", minLevel: 2,
    costs: [{ resource: "food", amount: 8 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "fruit_tart", name: "Fruit Tart", icon: "🍎", building: "kitchen", minLevel: 2,
    costs: [{ resource: "food", amount: 8 }, { resource: "honey", amount: 1 }, { resource: "fruit", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },

  // Tier 2 — Complex (2 flavor tags)
  { id: "hunters_stew", name: "Hunter's Stew", icon: "🍲", building: "kitchen", minLevel: 3,
    costs: [{ resource: "food", amount: 15 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "spiced_honeycake", name: "Spiced Honeycake", icon: "🍰", building: "kitchen", minLevel: 3,
    costs: [{ resource: "food", amount: 10 }, { resource: "honey", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "pea_mint_bowl", name: "Pea & Mint Bowl", icon: "🫛", building: "kitchen", minLevel: 3,
    costs: [{ resource: "food", amount: 12 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "cherry_cheese_plate", name: "Cherry Cheese Plate", icon: "🍒", building: "kitchen", minLevel: 4,
    costs: [{ resource: "food", amount: 8 }, { resource: "fruit", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "smoked_pork_roast", name: "Smoked Pork Roast", icon: "🍖", building: "kitchen", minLevel: 4,
    costs: [{ resource: "food", amount: 18 }, { resource: "wood", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "fishermans_broth", name: "Fisherman's Broth", icon: "🥣", building: "kitchen", minLevel: 4,
    costs: [{ resource: "food", amount: 15 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
];
