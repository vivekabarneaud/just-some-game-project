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
  remaining: number; // game-seconds
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
];
