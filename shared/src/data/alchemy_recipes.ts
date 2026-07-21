// ─── Alchemy Recipe Definitions ─────────────────────────────────
// Herb-based potions crafted at the Alchemy Lab.
// Recipes are either starter (available immediately) or discoverable via research.

export interface AlchemyRecipeDefinition {
  id: string;
  name: string;
  icon: string;
  image?: string;
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/healing_salve.png",
    name: "Healing Salve",
    icon: "💚",
    description: "At home or before a fight: heals 25% HP. In combat: auto-heals 30% HP when low.",
    tier: "novice",
    minLabLevel: 1,
    costs: [{ resource: "chamomile", amount: 3 }],
    effect: "healPct:25",
    craftTime: 300,
    starterRecipe: true,
    discoveryChance: 0,
  },
  {
    id: "vigor_tea",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/vigor_tea.png",
    name: "Vigor Tea",
    icon: "🍵",
    description: "Combat: +15% damage for 2 rounds at the opening.",
    tier: "novice",
    minLabLevel: 1,
    costs: [{ resource: "chamomile", amount: 2 }, { resource: "mugwort", amount: 1 }],
    effect: "damageBoost:15",
    craftTime: 360,
    starterRecipe: true,
    discoveryChance: 0,
  },
  {
    id: "foragers_tonic",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/foragers_tonic.png",
    name: "Forager's Tonic",
    icon: "🧃",
    description: "Non-combat: +50 bonus food. Combat: auto-heal 15% HP when low.",
    tier: "novice",
    minLabLevel: 1,
    costs: [{ resource: "chamomile", amount: 2 }],
    effect: "bonusFood:50",
    craftTime: 240,
    // Parked for now: not offered as a starter recipe (and not discoverable), so
    // it stays out of the early potion set until we revisit the food-bonus lever.
    starterRecipe: false,
    discoveryChance: 0,
  },

  {
    id: "boars_bane_salve",
    // No art yet — falls back to the 🐗 icon. Add an R2 image here when drawn.
    name: "Boar's-Bane Salve",
    icon: "🐗",
    description: "Cures the froth (rabid-boar bite-sickness) on a resting hero, and heals 30% HP. Ground boar tusk and mugwort — the bite's own cure.",
    tier: "novice",
    minLabLevel: 1,
    costs: [{ resource: "tusk_shard", amount: 1 }, { resource: "mugwort", amount: 1 }],
    effect: "curefroth",
    craftTime: 15,
    starterRecipe: true,
    discoveryChance: 0,
  },

  // ── Novice (discoverable) ─────────────────────────────────────
  {
    id: "herbal_antidote",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/herbal_antidote.png",
    name: "Herbal Antidote",
    icon: "🧪",
    description: "Cures poison. In combat: drunk the moment poison lands, curing it and healing 20% HP. At home: clears poison from a resting hero.",
    tier: "novice",
    minLabLevel: 1,
    costs: [{ resource: "nettle", amount: 2 }],
    effect: "curePoison",
    craftTime: 420,
    discoveryChance: 0.4,
  },

  // ── Apprentice (Lab lvl 3-4) ──────────────────────────────────
  {
    id: "strength_draught",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/strength_draught.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/mending_potion.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/swiftfoot_brew.png",
    name: "Swiftfoot Brew",
    icon: "💨",
    description: "Non-combat: -20% mission duration. Combat: +20% damage for 2 rounds at opening.",
    tier: "apprentice",
    minLabLevel: 3,
    costs: [{ resource: "mugwort", amount: 3 }],
    effect: "durationReduction:0.8",
    craftTime: 540,
    discoveryChance: 0.3,
  },
  {
    id: "eagle_eye_elixir",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/eagle_eye_elixir.png",
    name: "Eagle Eye Elixir",
    icon: "🦅",
    description: "Non-combat: +15 DEX checks. Combat: +25% damage for 2 rounds at opening.",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/ironhide_tonic.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/scholars_draught.png",
    name: "Scholar's Draught",
    icon: "📚",
    description: "Non-combat: +30% XP. Combat: +10% damage for 3 rounds at opening.",
    tier: "journeyman",
    minLabLevel: 5,
    costs: [{ resource: "nightbloom", amount: 2 }, { resource: "mugwort", amount: 2 }],
    effect: "xpBonus:0.3",
    craftTime: 1080,
    discoveryChance: 0.15,
  },

  // ── Tea-based brews (require traded tea leaves) ───────────────
  // Tea is an exotic good — only obtainable from caravan missions or
  // marketplace trade. These recipes give alchemists a second use for it.
  {
    id: "clarity_brew",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/clarity_brew.png",
    name: "Clarity Brew",
    icon: "🍵",
    description: "+10 to INT/WIS-based stat checks",
    tier: "apprentice",
    minLabLevel: 3,
    costs: [{ resource: "tea", amount: 1 }, { resource: "chamomile", amount: 2 }],
    effect: "successBonus:10",
    craftTime: 540,
    discoveryChance: 0.3,
  },
  {
    id: "focus_elixir",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/focus_elixir.png",
    name: "Focus Elixir",
    icon: "👁️‍🗨️",
    description: "+15% XP from next mission",
    tier: "journeyman",
    minLabLevel: 5,
    costs: [{ resource: "tea", amount: 2 }, { resource: "mugwort", amount: 2 }],
    effect: "xpBonus:0.15",
    craftTime: 900,
    discoveryChance: 0.2,
  },

  // ── Veteran (Lab lvl 7+) ──────────────────────────────────────
  {
    id: "phoenix_tears",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/phoenix_tears.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/elixir_of_insight.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/alchemy_lab/netherons_draught.png",
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

  // ── Story-unlocked recipe — only appears once a robin event has fired
  // (see frontend/src/data/robins.ts → robin_first). Not discoverable via
  // research (discoveryChance: 0). The engine pushes the id into
  // state.discoveredRecipes when the player acknowledges the robin.
  {
    id: "wraithwound_salve",
    name: "Wraithwound Salve",
    icon: "🩹",
    description: "A salve that closes the cold edge of ghost-wounds. Where ordinary bandages fail, this works.",
    tier: "apprentice",
    minLabLevel: 2,
    // Recipe needs Greymantle (Feldgrund-hill plant Edda's grandmother knew).
    // Sourced via story 5 mission and future northern trade — does not grow
    // this far south. The salve runs out without resupply, which is the
    // chapter 2 motivation.
    costs: [{ resource: "moonpetal", amount: 2 }, { resource: "greymantle", amount: 1 }],
    effect: "cure:ghost_wound,heal:full",
    craftTime: 480,
    discoveryChance: 0,
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
