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
  /** Explicit per-recipe tool requirement (overrides level-based gating) */
  requiredTool?: string;
}

// ─── Building Tools ─────────────────────────────────────────────
// Tools crafted at one building and installed into another to unlock recipes or provide buffs.

export interface BuildingToolDef {
  id: string;
  name: string;
  icon: string;
  image?: string;
  description: string;
  /** Which building this tool can be installed in */
  targetBuilding: string;
  /** The crafting recipe that produces this tool */
  recipeId: string;
  /** Recipes with minLevel >= this value require this tool to be installed */
  unlocksMinLevel: number;
}

export const BUILDING_TOOLS: BuildingToolDef[] = [
  {
    id: "cutting_board",
    name: "Cutting Board",
    icon: "🔪",
    description: "A sturdy wooden cutting board. Enables proper food preparation at the Kitchen.",
    targetBuilding: "kitchen",
    recipeId: "cutting_board",
    unlocksMinLevel: 3,
  },
];

export function getBuildingTool(id: string): BuildingToolDef | undefined {
  return BUILDING_TOOLS.find((t) => t.id === id);
}

export function getBuildingToolByRecipe(recipeId: string): BuildingToolDef | undefined {
  return BUILDING_TOOLS.find((t) => t.recipeId === recipeId);
}

export function getBuildingToolsForBuilding(buildingId: string): BuildingToolDef[] {
  return BUILDING_TOOLS.filter((t) => t.targetBuilding === buildingId);
}

/** Returns the tool that blocks a recipe, or null if no tool is needed / tool is installed */
export function getRequiredTool(recipe: CraftingRecipe, installedToolIds: string[]): BuildingToolDef | null {
  // Check explicit per-recipe requirement first
  if (recipe.requiredTool && !installedToolIds.includes(recipe.requiredTool)) {
    return getBuildingTool(recipe.requiredTool) ?? null;
  }
  // Then check level-based gating from tool definitions
  const tools = getBuildingToolsForBuilding(recipe.building);
  for (const tool of tools) {
    if (recipe.minLevel >= tool.unlocksMinLevel && !installedToolIds.includes(tool.id)) {
      return tool;
    }
  }
  return null;
}

export interface ActiveCraft {
  recipeId: string;
  remaining: number; // game-seconds for current item
  quantity?: number;  // total items to craft (counts down as each completes)
  /** True when this craft is queued behind others and waiting for a slot.
   *  Pending crafts do not tick. Promoted when a peer in the same building
   *  finishes (and that was the last copy of its recipe). */
  pending?: boolean;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: "wool_clothing",
    name: "Wool Clothing",
    icon: "🧥",
    building: "tailoring_shop",
    minLevel: 1,
    costs: [{ resource: "wool", amount: 5 }],
    produces: { resource: "clothing", amount: 1 },
    craftTime: 5,
  },
  {
    id: "bandage",
    name: "Bandage",
    icon: "🩹",
    building: "tailoring_shop",
    minLevel: 1,
    costs: [{ resource: "fiber", amount: 3 }],
    produces: { resource: "potions", amount: 1 },
    craftTime: 20,
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

  // ── Woodworker — Building Tools ────────────────────────────────
  {
    id: "cutting_board",
    name: "Cutting Board",
    icon: "🔪",
    building: "woodworker",
    minLevel: 1,
    costs: [{ resource: "wood", amount: 8 }],
    produces: { resource: "tools", amount: 1 },
    craftTime: 20,
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
    id: "iron_dagger",
    name: "Iron Dagger",
    icon: "🗡️",
    building: "blacksmith",
    minLevel: 1,
    costs: [{ resource: "iron", amount: 8 }, { resource: "wood", amount: 3 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 20,
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
  // Recipes use specific food types (meat / eggs / milk / fish / fruits / veggies)
  // plus the "grain" alias (wheat OR barley — interchangeable in baking).

  // Campfire recipes (Lv 1-2) — basic grilling and smoking
  { id: "peppered_jerky", name: "Peppered Jerky", icon: "🌶️", building: "kitchen", minLevel: 1,
    costs: [{ resource: "meat", amount: 4 }], produces: { resource: "potions", amount: 1 }, craftTime: 30,
    requiredTool: "cutting_board" },
  { id: "herb_salad", name: "Fresh Herb Salad", icon: "🥬", building: "kitchen", minLevel: 1,
    costs: [{ resource: "cabbages", amount: 2 }, { resource: "mushrooms", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 20,
    requiredTool: "cutting_board" },
  { id: "smoked_fish", name: "Smoked Fish", icon: "🐟", building: "kitchen", minLevel: 1,
    costs: [{ resource: "fish", amount: 3 }, { resource: "wood", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "grilled_mushrooms", name: "Grilled Mushrooms", icon: "🍄", building: "kitchen", minLevel: 1,
    costs: [{ resource: "mushrooms", amount: 3 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },

  // Village kitchen recipes (Lv 3-4) — proper cooking with ovens and prep tables
  { id: "cheese", name: "Cheese", icon: "🧀", building: "kitchen", minLevel: 3,
    costs: [{ resource: "milk", amount: 3 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "meat_pie", name: "Meat Pie", icon: "🥧", building: "kitchen", minLevel: 3,
    costs: [{ resource: "meat", amount: 3 }, { resource: "grain", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "cheese_bread", name: "Cheese Bread", icon: "🧀", building: "kitchen", minLevel: 3,
    costs: [{ resource: "milk", amount: 2 }, { resource: "grain", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "honeycake", name: "Honeycake", icon: "🍯", building: "kitchen", minLevel: 3,
    costs: [{ resource: "grain", amount: 2 }, { resource: "honey", amount: 2 }, { resource: "eggs", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "fruit_tart", name: "Fruit Tart", icon: "🍎", building: "kitchen", minLevel: 4,
    costs: [{ resource: "grain", amount: 2 }, { resource: "apples", amount: 1 }, { resource: "pears", amount: 1 }, { resource: "honey", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },

  // Town kitchen recipes (Lv 5-6) — complex multi-ingredient dishes
  { id: "hunters_stew", name: "Hunter's Stew", icon: "🍲", building: "kitchen", minLevel: 5,
    costs: [{ resource: "meat", amount: 4 }, { resource: "turnips", amount: 2 }, { resource: "mushrooms", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "spiced_honeycake", name: "Spiced Honeycake", icon: "🍰", building: "kitchen", minLevel: 5,
    costs: [{ resource: "grain", amount: 2 }, { resource: "honey", amount: 3 }, { resource: "eggs", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "pea_mint_bowl", name: "Pea & Mint Bowl", icon: "🫛", building: "kitchen", minLevel: 5,
    costs: [{ resource: "peas", amount: 4 }, { resource: "milk", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },

  // City kitchen recipes (Lv 7-8) — refined cuisine
  { id: "cherry_cheese_plate", name: "Cherry Cheese Plate", icon: "🍒", building: "kitchen", minLevel: 7,
    costs: [{ resource: "cherries", amount: 2 }, { resource: "milk", amount: 2 }, { resource: "nuts", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "smoked_pork_roast", name: "Smoked Pork Roast", icon: "🍖", building: "kitchen", minLevel: 7,
    costs: [{ resource: "meat", amount: 5 }, { resource: "squash", amount: 1 }, { resource: "wood", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "fishermans_broth", name: "Fisherman's Broth", icon: "🥣", building: "kitchen", minLevel: 7,
    costs: [{ resource: "fish", amount: 3 }, { resource: "turnips", amount: 1 }, { resource: "cabbages", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },

  // ── Exotic-spice recipes (require caravan-only ingredients) ─────
  // Spices and tea can't be grown — only obtained via escort missions
  // or marketplace trade. These dishes give variety to advanced kitchens.

  { id: "spiced_stew", name: "Spiced Stew", icon: "🌶️", building: "kitchen", minLevel: 3,
    costs: [{ resource: "meat", amount: 3 }, { resource: "turnips", amount: 1 }, { resource: "pepper", amount: 1 }], produces: { resource: "potions", amount: 2 }, craftTime: 45 },
  { id: "cinnamon_honey_cake", name: "Cinnamon Honey Cake", icon: "🍰", building: "kitchen", minLevel: 4,
    costs: [{ resource: "grain", amount: 2 }, { resource: "honey", amount: 2 }, { resource: "eggs", amount: 1 }, { resource: "cinnamon", amount: 1 }], produces: { resource: "potions", amount: 2 }, craftTime: 45 },
  { id: "fiery_broth", name: "Fiery Broth", icon: "🥵", building: "kitchen", minLevel: 5,
    costs: [{ resource: "meat", amount: 2 }, { resource: "cabbages", amount: 2 }, { resource: "chili", amount: 1 }], produces: { resource: "potions", amount: 2 }, craftTime: 45 },
  { id: "steeped_tea_leaves", name: "Steeped Tea Leaves", icon: "🍵", building: "kitchen", minLevel: 3,
    costs: [{ resource: "tea", amount: 1 }, { resource: "honey", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "royal_feast", name: "Royal Feast", icon: "👑", building: "kitchen", minLevel: 7,
    costs: [{ resource: "meat", amount: 4 }, { resource: "grain", amount: 3 }, { resource: "milk", amount: 2 }, { resource: "saffron", amount: 1 }], produces: { resource: "potions", amount: 4 }, craftTime: 90 },

  // ── Origin Recipes (loyalty-unlocked) ───────────────────────────
  // Discovered when an adventurer from that origin reaches the required loyalty rank.

  // Ashwick — hearty English comfort food
  { id: "shepherds_pie", name: "Shepherd's Pie", icon: "🥧", building: "kitchen", minLevel: 3,
    costs: [{ resource: "meat", amount: 3 }, { resource: "turnips", amount: 2 }, { resource: "grain", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "ashwick_ale_stew", name: "Ashwick Ale Stew", icon: "🍺", building: "kitchen", minLevel: 5,
    costs: [{ resource: "meat", amount: 3 }, { resource: "cabbages", amount: 2 }, { resource: "grain", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "blackberry_crumble", name: "Blackberry Crumble", icon: "🫐", building: "kitchen", minLevel: 5,
    costs: [{ resource: "berries", amount: 3 }, { resource: "grain", amount: 2 }, { resource: "honey", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },

  // Nordveld — smoky, preserved, harsh-winter food
  { id: "smoked_elk_berries", name: "Smoked Elk & Cloudberries", icon: "🫐", building: "kitchen", minLevel: 3,
    costs: [{ resource: "meat", amount: 3 }, { resource: "berries", amount: 2 }, { resource: "wood", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "nordveld_porridge", name: "Nordveld Barley Porridge", icon: "🥣", building: "kitchen", minLevel: 5,
    costs: [{ resource: "barley", amount: 4 }, { resource: "milk", amount: 1 }, { resource: "honey", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 30 },
  { id: "pickled_herring", name: "Pickled Herring", icon: "🐟", building: "kitchen", minLevel: 5,
    costs: [{ resource: "fish", amount: 3 }, { resource: "turnips", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },

  // Meridian — Mediterranean seafood and bold flavors
  { id: "saffron_fish_stew", name: "Saffron Fish Stew", icon: "🍲", building: "kitchen", minLevel: 3,
    costs: [{ resource: "fish", amount: 3 }, { resource: "turnips", amount: 1 }, { resource: "squash", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "grilled_octopus", name: "Grilled Octopus", icon: "🐙", building: "kitchen", minLevel: 5,
    costs: [{ resource: "fish", amount: 4 }, { resource: "wood", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "fig_honey_toast", name: "Fig & Honey Toast", icon: "🍯", building: "kitchen", minLevel: 5,
    costs: [{ resource: "grain", amount: 2 }, { resource: "pears", amount: 1 }, { resource: "honey", amount: 3 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },

  // Zah'kari — bold spiced dishes, communal portions
  { id: "groundnut_spice_bowl", name: "Groundnut Spice Bowl", icon: "🥜", building: "kitchen", minLevel: 3,
    costs: [{ resource: "nuts", amount: 2 }, { resource: "peas", amount: 2 }, { resource: "squash", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "jollof_rice", name: "Zah'kari Jollof", icon: "🍚", building: "kitchen", minLevel: 5,
    costs: [{ resource: "grain", amount: 4 }, { resource: "meat", amount: 2 }, { resource: "squash", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "plantain_pepper_fry", name: "Plantain Pepper Fry", icon: "🍌", building: "kitchen", minLevel: 5,
    costs: [{ resource: "squash", amount: 3 }, { resource: "peas", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },

  // Tianzhou — delicate, precise, balanced
  { id: "steamed_dumplings", name: "Steamed Dumplings", icon: "🥟", building: "kitchen", minLevel: 3,
    costs: [{ resource: "grain", amount: 3 }, { resource: "meat", amount: 1 }, { resource: "cabbages", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "five_spice_duck", name: "Five-Spice Duck", icon: "🦆", building: "kitchen", minLevel: 5,
    costs: [{ resource: "meat", amount: 5 }, { resource: "honey", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 90 },
  { id: "jade_tea_soup", name: "Jade Tea Soup", icon: "🍵", building: "kitchen", minLevel: 5,
    costs: [{ resource: "peas", amount: 2 }, { resource: "cabbages", amount: 2 }, { resource: "mushrooms", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },

  // Khor'vani — aromatic, slow-cooked, layered spices
  { id: "lamb_tagine", name: "Lamb Tagine", icon: "🍲", building: "kitchen", minLevel: 3,
    costs: [{ resource: "meat", amount: 4 }, { resource: "squash", amount: 2 }, { resource: "nuts", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "saffron_rice_pilaf", name: "Saffron Rice Pilaf", icon: "🍚", building: "kitchen", minLevel: 5,
    costs: [{ resource: "grain", amount: 4 }, { resource: "peas", amount: 1 }, { resource: "nuts", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "rosewater_pastries", name: "Rosewater Pastries", icon: "🌹", building: "kitchen", minLevel: 5,
    costs: [{ resource: "grain", amount: 2 }, { resource: "honey", amount: 3 }, { resource: "eggs", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },

  // Silvaneth — wild, foraged, living-forest cuisine
  { id: "honeyed_acorn_bread", name: "Honeyed Acorn Bread", icon: "🌰", building: "kitchen", minLevel: 3,
    costs: [{ resource: "nuts", amount: 2 }, { resource: "grain", amount: 2 }, { resource: "honey", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "elderflower_broth", name: "Elderflower Broth", icon: "🌸", building: "kitchen", minLevel: 5,
    costs: [{ resource: "mushrooms", amount: 2 }, { resource: "berries", amount: 2 }, { resource: "peas", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "moss_wrapped_trout", name: "Moss-Wrapped Trout", icon: "🐟", building: "kitchen", minLevel: 5,
    costs: [{ resource: "fish", amount: 3 }, { resource: "mushrooms", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },

  // Hauts-Cieux — refined, delicate, almost too elegant for the frontier
  { id: "starfruit_meringue", name: "Starfruit Meringue", icon: "⭐", building: "kitchen", minLevel: 3,
    costs: [{ resource: "eggs", amount: 3 }, { resource: "cherries", amount: 2 }, { resource: "honey", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "crystal_consomme", name: "Crystal Consommé", icon: "🥣", building: "kitchen", minLevel: 5,
    costs: [{ resource: "fish", amount: 2 }, { resource: "eggs", amount: 2 }, { resource: "turnips", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "moonpetal_sorbet", name: "Moonpetal Sorbet", icon: "🍨", building: "kitchen", minLevel: 7,
    costs: [{ resource: "cherries", amount: 2 }, { resource: "pears", amount: 1 }, { resource: "apples", amount: 1 }, { resource: "honey", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 90 },

  // Khazdurim — heavy, hearty, forge-cooked
  { id: "forge_roasted_boar", name: "Forge-Roasted Boar", icon: "🐗", building: "kitchen", minLevel: 3,
    costs: [{ resource: "meat", amount: 6 }, { resource: "turnips", amount: 2 }, { resource: "wood", amount: 3 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "deep_mushroom_stew", name: "Deep Mushroom Stew", icon: "🍄", building: "kitchen", minLevel: 5,
    costs: [{ resource: "mushrooms", amount: 4 }, { resource: "milk", amount: 1 }, { resource: "grain", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 60 },
  { id: "iron_bread", name: "Iron Bread", icon: "🍞", building: "kitchen", minLevel: 5,
    costs: [{ resource: "grain", amount: 3 }, { resource: "iron", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },

  // Feldgrund — cozy, abundant, pub food
  { id: "harvest_ale_stew", name: "Harvest Ale Stew", icon: "🍺", building: "kitchen", minLevel: 3,
    costs: [{ resource: "meat", amount: 3 }, { resource: "cabbages", amount: 2 }, { resource: "grain", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "cheese_and_onion_pie", name: "Cheese & Onion Pie", icon: "🥧", building: "kitchen", minLevel: 5,
    costs: [{ resource: "milk", amount: 2 }, { resource: "turnips", amount: 2 }, { resource: "grain", amount: 2 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
  { id: "apple_butter_toast", name: "Apple Butter Toast", icon: "🍎", building: "kitchen", minLevel: 5,
    costs: [{ resource: "apples", amount: 3 }, { resource: "grain", amount: 2 }, { resource: "honey", amount: 1 }], produces: { resource: "potions", amount: 1 }, craftTime: 45 },
];
