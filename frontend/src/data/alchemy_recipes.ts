// ─── Alchemy Recipe Definitions ─────────────────────────────────
// Herb-based potions crafted at the Alchemy Lab.
// Recipes are either starter (available immediately) or discoverable via research.

export interface AlchemyRecipeDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: "novice" | "apprentice" | "journeyman" | "veteran";
  minLabLevel: number;
  costs: { resource: string; amount: number }[];
  effect: string; // description of what it does
  craftTime: number; // game-seconds
  /** If true, available from the start without research */
  starterRecipe?: boolean;
  /** Chance to discover this recipe during research (0-1) */
  discoveryChance: number;
}

export const ALCHEMY_RECIPES: AlchemyRecipeDefinition[] = [
  // ── Novice (Lab lvl 1-2, starter recipes) ─────────────────────
  {
    id: "healing_salve",
    name: "Healing Salve",
    icon: "💚",
    description: "-25% death chance on next mission",
    tier: "novice",
    minLabLevel: 1,
    costs: [{ resource: "chamomile", amount: 3 }],
    effect: "deathReduction:0.75",
    craftTime: 300,
    starterRecipe: true,
    discoveryChance: 0,
  },
  {
    id: "vigor_tea",
    name: "Vigor Tea",
    icon: "🍵",
    description: "+5 to relevant stat check",
    tier: "novice",
    minLabLevel: 1,
    costs: [{ resource: "chamomile", amount: 2 }, { resource: "mugwort", amount: 1 }],
    effect: "successBonus:5",
    craftTime: 360,
    starterRecipe: true,
    discoveryChance: 0,
  },
  {
    id: "foragers_tonic",
    name: "Forager's Tonic",
    icon: "🧃",
    description: "+50 bonus food from mission rewards",
    tier: "novice",
    minLabLevel: 1,
    costs: [{ resource: "chamomile", amount: 2 }],
    effect: "bonusFood:50",
    craftTime: 240,
    starterRecipe: true,
    discoveryChance: 0,
  },

  // ── Novice (discoverable) ─────────────────────────────────────
  {
    id: "herbal_antidote",
    name: "Herbal Antidote",
    icon: "🧪",
    description: "+5 to stat check, -15% death risk",
    tier: "novice",
    minLabLevel: 1,
    costs: [{ resource: "nettle", amount: 2 }],
    effect: "successBonus:5,deathReduction:0.85",
    craftTime: 420,
    discoveryChance: 0.4,
  },

  // ── Apprentice (Lab lvl 3-4) ──────────────────────────────────
  {
    id: "strength_draught",
    name: "Strength Draught",
    icon: "💪",
    description: "+25% damage for 3 rounds in combat",
    tier: "apprentice",
    minLabLevel: 3,
    costs: [{ resource: "mugwort", amount: 3 }, { resource: "nettle", amount: 2 }],
    effect: "successBonus:10",
    craftTime: 600,
    discoveryChance: 0.3,
  },
  {
    id: "mending_potion",
    name: "Mending Potion",
    icon: "❤️‍🩹",
    description: "-50% death chance for entire party",
    tier: "apprentice",
    minLabLevel: 3,
    costs: [{ resource: "chamomile", amount: 4 }, { resource: "nettle", amount: 2 }],
    effect: "deathReduction:0.5",
    craftTime: 720,
    discoveryChance: 0.25,
  },
  {
    id: "swiftfoot_brew",
    name: "Swiftfoot Brew",
    icon: "💨",
    description: "-20% mission duration",
    tier: "apprentice",
    minLabLevel: 3,
    costs: [{ resource: "mugwort", amount: 3 }],
    effect: "durationReduction:0.8",
    craftTime: 540,
    discoveryChance: 0.3,
  },
  {
    id: "eagle_eye_elixir",
    name: "Eagle Eye Elixir",
    icon: "🦅",
    description: "+15 to DEX-based stat checks",
    tier: "apprentice",
    minLabLevel: 4,
    costs: [{ resource: "nettle", amount: 2 }, { resource: "nightbloom", amount: 1 }],
    effect: "successBonus:15",
    craftTime: 900,
    discoveryChance: 0.2,
  },

  // ── Journeyman (Lab lvl 5-6) ──────────────────────────────────
  {
    id: "ironhide_tonic",
    name: "Ironhide Tonic",
    icon: "🛡️",
    description: "+20 defense for next raid",
    tier: "journeyman",
    minLabLevel: 5,
    costs: [{ resource: "nettle", amount: 3 }, { resource: "nightbloom", amount: 2 }],
    effect: "defenseBonus:20",
    craftTime: 1200,
    discoveryChance: 0.15,
  },
  {
    id: "scholars_draught",
    name: "Scholar's Draught",
    icon: "📚",
    description: "+30% XP from next mission",
    tier: "journeyman",
    minLabLevel: 5,
    costs: [{ resource: "nightbloom", amount: 2 }, { resource: "mugwort", amount: 2 }],
    effect: "xpBonus:0.3",
    craftTime: 1080,
    discoveryChance: 0.15,
  },

  // ── Veteran (Lab lvl 7+) ──────────────────────────────────────
  {
    id: "phoenix_tears",
    name: "Phoenix Tears",
    icon: "🔥",
    description: "Auto-revive entire party on mission failure",
    tier: "veteran",
    minLabLevel: 7,
    costs: [{ resource: "moonpetal", amount: 2 }, { resource: "nightbloom", amount: 3 }],
    effect: "autoRevive:true",
    craftTime: 3600,
    discoveryChance: 0.1,
  },
  {
    id: "elixir_of_insight",
    name: "Elixir of Insight",
    icon: "👁️",
    description: "Guaranteed rare loot drop on next mission",
    tier: "veteran",
    minLabLevel: 7,
    costs: [{ resource: "moonpetal", amount: 1 }, { resource: "chamomile", amount: 3 }],
    effect: "rareLoot:true",
    craftTime: 2400,
    discoveryChance: 0.1,
  },
  {
    id: "netherons_draught",
    name: "Netheron's Draught",
    icon: "☠️",
    description: "2x mission rewards but 2x death chance",
    tier: "veteran",
    minLabLevel: 8,
    costs: [{ resource: "moonpetal", amount: 1 }, { resource: "nettle", amount: 3 }],
    effect: "doubleRewards:true,doubleDeath:true",
    craftTime: 2700,
    discoveryChance: 0.08,
  },
];

// ─── Helpers ────────────────────────────────────────────────────

export function getStarterRecipes(): AlchemyRecipeDefinition[] {
  return ALCHEMY_RECIPES.filter((r) => r.starterRecipe);
}

export function getDiscoverableRecipes(labLevel: number, discovered: string[]): AlchemyRecipeDefinition[] {
  return ALCHEMY_RECIPES.filter((r) =>
    !r.starterRecipe &&
    r.minLabLevel <= labLevel &&
    !discovered.includes(r.id)
  );
}

export function getAvailableAlchemyRecipes(labLevel: number, discovered: string[]): AlchemyRecipeDefinition[] {
  return ALCHEMY_RECIPES.filter((r) =>
    r.minLabLevel <= labLevel &&
    (r.starterRecipe || discovered.includes(r.id))
  );
}

export const RESEARCH_BASE_COST = 50; // gold
