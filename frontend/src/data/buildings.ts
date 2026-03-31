export interface BuildingCost {
  wood: number;
  stone: number;
}

export type FoodType = "grain" | "meat" | "berries" | "fish" | "fiber";

export interface BuildingLevel {
  level: number;
  cost: BuildingCost;
  buildTime: number; // seconds
  production?: { resource: string; rate: number; foodType?: FoodType };
  description: string;
}

export type SettlementTier = "camp" | "village" | "town" | "city";

export interface BuildingDefinition {
  id: string;
  name: string;
  category: "production" | "military" | "magic" | "infrastructure";
  description: string;
  icon: string;
  maxLevel: number;
  levels: BuildingLevel[];
  requiredTier: SettlementTier;
  /** Per-tier level caps — if set, the building can't exceed this level until the player reaches a higher tier */
  tierLevelCaps?: Partial<Record<SettlementTier, number>>;
}

export interface PlayerBuilding {
  buildingId: string;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number; // seconds remaining (game-time)
}

// ─── Settlement tiers ────────────────────────────────────────────

export const SETTLEMENT_TIERS: { tier: SettlementTier; name: string; minTownHall: number }[] = [
  { tier: "camp", name: "Camp", minTownHall: 1 },
  { tier: "village", name: "Village", minTownHall: 3 },
  { tier: "town", name: "Town", minTownHall: 5 },
  { tier: "city", name: "City", minTownHall: 7 },
];

export function getSettlementTier(townHallLevel: number): SettlementTier {
  if (townHallLevel >= 7) return "city";
  if (townHallLevel >= 5) return "town";
  if (townHallLevel >= 3) return "village";
  return "camp";
}

export function getSettlementName(tier: SettlementTier): string {
  return SETTLEMENT_TIERS.find((t) => t.tier === tier)!.name;
}

export function isBuildingUnlocked(building: BuildingDefinition, townHallLevel: number): boolean {
  const currentTier = getSettlementTier(townHallLevel);
  const tierOrder: SettlementTier[] = ["camp", "village", "town", "city"];
  return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(building.requiredTier);
}

export function getUnlockRequirement(building: BuildingDefinition): string {
  const tierInfo = SETTLEMENT_TIERS.find((t) => t.tier === building.requiredTier)!;
  return `Requires ${tierInfo.name} (Town Hall ${tierInfo.minTownHall})`;
}

// ─── Level generation ────────────────────────────────────────────

function generateLevels(
  base: { wood: number; stone: number },
  buildTimeBase: number,
  production?: { resource: string; baseRate: number; foodType?: FoodType },
  maxLevel: number = 20,
): BuildingLevel[] {
  return Array.from({ length: maxLevel }, (_, i) => {
    const lvl = i + 1;
    const multiplier = Math.pow(1.5, lvl - 1);
    return {
      level: lvl,
      cost: {
        wood: Math.floor(base.wood * multiplier),
        stone: Math.floor(base.stone * multiplier),
      },
      buildTime: Math.floor(buildTimeBase * multiplier),
      production: production
        ? {
            resource: production.resource,
            rate: Math.floor(production.baseRate * lvl * 1.1),
            foodType: production.foodType,
          }
        : undefined,
      description: `Level ${lvl}`,
    };
  });
}

// ─── Building definitions ────────────────────────────────────────

export const BUILDINGS: BuildingDefinition[] = [
  // Always available — Town Hall is special, always shown
  {
    id: "town_hall",
    name: "Town Hall",
    category: "infrastructure",
    description:
      "The heart of your settlement. Upgrading the Town Hall unlocks new buildings and evolves your settlement.",
    icon: "🏛️",
    maxLevel: 25,
    levels: generateLevels({ wood: 200, stone: 200 }, 360, undefined, 25),
    requiredTier: "camp",
  },
  {
    id: "houses",
    name: "Houses",
    category: "infrastructure",
    description:
      "Simple dwellings for your citizens. Each level provides housing for more people, allowing your settlement to grow.",
    icon: "🏠",
    maxLevel: 20,
    levels: generateLevels({ wood: 60, stone: 40 }, 45),
    requiredTier: "camp",
  },
  {
    id: "warehouse",
    name: "Warehouse",
    category: "infrastructure",
    description:
      "A sturdy storehouse for wood and stone. Without enough storage, excess materials are lost.",
    icon: "🏚️",
    maxLevel: 20,
    levels: generateLevels({ wood: 80, stone: 60 }, 60),
    requiredTier: "camp",
  },
  {
    id: "pantry",
    name: "Pantry",
    category: "infrastructure",
    description:
      "A cool cellar and salting room to preserve food. Without a pantry, surplus food spoils quickly.",
    icon: "🥫",
    maxLevel: 20,
    levels: generateLevels({ wood: 50, stone: 30 }, 50),
    requiredTier: "camp",
  },

  // Camp tier — Chapel (happiness)
  {
    id: "chapel",
    name: "Chapel",
    category: "infrastructure",
    description:
      "A humble place of worship where citizens find peace and solace. Improves settlement happiness.",
    icon: "⛪",
    maxLevel: 10,
    levels: generateLevels({ wood: 40, stone: 60 }, 90, undefined, 10),
    requiredTier: "camp",
    tierLevelCaps: { camp: 2, village: 5, town: 8, city: 10 },
  },

  // Camp tier — production basics
  {
    id: "lumber_mill",
    name: "Lumber Mill",
    category: "production",
    description:
      "Woodcutters fell trees from the surrounding forest and process them into usable timber.",
    icon: "🪓",
    maxLevel: 20,
    levels: generateLevels({ wood: 30, stone: 40 }, 75, { resource: "wood", baseRate: 25 }),
    requiredTier: "camp",
  },
  {
    id: "quarry",
    name: "Stone Quarry",
    category: "production",
    description:
      "Miners extract stone from the nearby hills. Essential for constructing advanced buildings.",
    icon: "⛏️",
    maxLevel: 20,
    levels: generateLevels({ wood: 60, stone: 10 }, 90, { resource: "stone", baseRate: 20 }),
    requiredTier: "camp",
  },
  {
    id: "hunting_camp",
    name: "Hunting Camp",
    category: "production",
    description:
      "Skilled hunters venture into the wilds, bringing back game and pelts. Supplements your food supply.",
    icon: "🏹",
    maxLevel: 15,
    levels: generateLevels({ wood: 90, stone: 10 }, 60, { resource: "food", baseRate: 10, foodType: "meat" }, 15),
    requiredTier: "camp",
  },

  {
    id: "forager_hut",
    name: "Forager's Hut",
    category: "production",
    description:
      "Gatherers scour the forest edges for wild berries, mushrooms, and herbs. A quick and cheap source of food.",
    icon: "🫐",
    maxLevel: 10,
    levels: generateLevels({ wood: 30, stone: 5 }, 30, { resource: "food", baseRate: 6, foodType: "berries" }, 10),
    requiredTier: "camp",
  },

  {
    id: "fishing_hut",
    name: "Fishing Hut",
    category: "production",
    description:
      "A small dock on the river where fishermen cast their nets. Provides a steady supply of fish year-round.",
    icon: "🐟",
    maxLevel: 10,
    levels: generateLevels({ wood: 50, stone: 10 }, 50, { resource: "food", baseRate: 8, foodType: "fish" }, 10),
    requiredTier: "camp",
  },

  // Village tier — Brewery & Tavern (ale chain + happiness)
  {
    id: "brewery",
    name: "Brewery",
    category: "production",
    description:
      "Converts grain into ale. A vital supply for the Tavern and a happy settlement.",
    icon: "🍺",
    maxLevel: 10,
    levels: generateLevels({ wood: 60, stone: 40 }, 100, undefined, 10),
    requiredTier: "village",
    tierLevelCaps: { village: 3, town: 7, city: 10 },
  },
  {
    id: "tavern",
    name: "Tavern",
    category: "infrastructure",
    description:
      "A lively gathering place for citizens and travelers. Consumes ale and greatly boosts happiness.",
    icon: "🍻",
    maxLevel: 10,
    levels: generateLevels({ wood: 80, stone: 50 }, 120, undefined, 10),
    requiredTier: "village",
    tierLevelCaps: { village: 3, town: 7, city: 10 },
  },

  // Village tier (TH 3+)
  {
    id: "gold_mine",
    name: "Gold Mine",
    category: "production",
    description: "Deep shafts delve into the earth seeking precious gold veins to fund your realm.",
    icon: "💰",
    maxLevel: 20,
    levels: generateLevels({ wood: 100, stone: 80 }, 120, { resource: "gold", baseRate: 15 }),
    requiredTier: "village",
  },
  {
    id: "blacksmith",
    name: "Blacksmith",
    category: "infrastructure",
    description:
      "The ring of hammer on anvil echoes through the village. The blacksmith forges tools and weapons for your people.",
    icon: "🔨",
    maxLevel: 15,
    levels: generateLevels({ wood: 80, stone: 60 }, 150, undefined, 15),
    requiredTier: "village",
  },
  {
    id: "marketplace",
    name: "Marketplace",
    category: "infrastructure",
    description:
      "A bustling bazaar where merchants gather. Enables trading resources with other players.",
    icon: "🏪",
    maxLevel: 15,
    levels: generateLevels({ wood: 120, stone: 60 }, 180, undefined, 15),
    requiredTier: "village",
  },

  // Town tier (TH 5+)
  {
    id: "barracks",
    name: "Barracks",
    category: "military",
    description:
      "Training grounds for your soldiers. Higher levels unlock more powerful unit types.",
    icon: "⚔️",
    maxLevel: 20,
    levels: generateLevels({ wood: 100, stone: 80 }, 180),
    requiredTier: "town",
  },
  {
    id: "watchtower",
    name: "Watchtower",
    category: "military",
    description:
      "Sentinels keep watch from this tall tower, warning of approaching threats and improving your defenses.",
    icon: "🏰",
    maxLevel: 15,
    levels: generateLevels({ wood: 60, stone: 120 }, 200, undefined, 15),
    requiredTier: "town",
  },
  {
    id: "mage_tower",
    name: "Mage Tower",
    category: "magic",
    description:
      "A spire of arcane energy where wizards study the mystic arts. Unlocks magical research.",
    icon: "🗼",
    maxLevel: 20,
    levels: generateLevels({ wood: 60, stone: 100 }, 240),
    requiredTier: "town",
  },

  // Camp tier — Adventurer's Guild (missions)
  {
    id: "adventurers_guild",
    name: "Adventurer's Guild",
    category: "infrastructure",
    description:
      "A bustling hall where brave souls gather seeking fortune. Recruit adventurers and send them on missions to bring back resources and treasure.",
    icon: "🏰",
    maxLevel: 5,
    levels: [
      { level: 1, cost: { wood: 80, stone: 60 }, buildTime: 180, description: "2 mission slots, recruit Novices" },
      { level: 2, cost: { wood: 150, stone: 120 }, buildTime: 360, description: "3 mission slots, recruit up to Apprentice" },
      { level: 3, cost: { wood: 280, stone: 220 }, buildTime: 600, description: "4 mission slots, recruit up to Journeyman" },
      { level: 4, cost: { wood: 500, stone: 400 }, buildTime: 900, description: "5 mission slots, recruit up to Veteran" },
      { level: 5, cost: { wood: 900, stone: 700 }, buildTime: 1350, description: "6 mission slots, recruit up to Elite" },
    ],
    requiredTier: "camp",
    tierLevelCaps: { camp: 2, village: 3, town: 4, city: 5 },
  },

  // Village tier — Mason's Guild (queue + build bonuses)
  {
    id: "masons_guild",
    name: "Mason's Guild",
    category: "infrastructure",
    description:
      "Master builders coordinate construction across the settlement. Each level unlocks an extra build queue slot and reduces building costs and times.",
    icon: "🧱",
    maxLevel: 5,
    levels: [
      { level: 1, cost: { wood: 150, stone: 200 }, buildTime: 300, description: "Queue +1, costs & time −5%" },
      { level: 2, cost: { wood: 225, stone: 300 }, buildTime: 450, description: "Queue +1, costs & time −10%" },
      { level: 3, cost: { wood: 340, stone: 450 }, buildTime: 675, description: "Queue +1, costs & time −15%" },
      { level: 4, cost: { wood: 510, stone: 675 }, buildTime: 1012, description: "Queue +1, costs & time −20%" },
      { level: 5, cost: { wood: 765, stone: 1012 }, buildTime: 1518, description: "Queue +1, costs & time −25%" },
    ],
    requiredTier: "village",
    tierLevelCaps: { village: 2, town: 4, city: 5 },
  },

  // Town tier — Walls (passive defense)
  {
    id: "walls",
    name: "Walls",
    category: "military",
    description:
      "Stone fortifications around your settlement. Provides passive defense against raids and attacks.",
    icon: "🧱",
    maxLevel: 15,
    levels: generateLevels({ wood: 40, stone: 120 }, 150, undefined, 15),
    requiredTier: "camp",
    tierLevelCaps: { camp: 2, village: 5, town: 10, city: 15 },
  },

  // City tier (TH 7+)
  {
    id: "alchemy_lab",
    name: "Alchemy Lab",
    category: "magic",
    description:
      "Bubbling cauldrons and strange vapors fill this laboratory where alchemists brew potions and transmute materials.",
    icon: "🧪",
    maxLevel: 15,
    levels: generateLevels({ wood: 40, stone: 80 }, 300, undefined, 15),
    requiredTier: "city",
  },
];

// ─── Default tier level caps ────────────────────────────────────
// Applied to any building that doesn't specify its own tierLevelCaps.
// Town Hall is exempt (no cap) since it IS the tier driver.

export const DEFAULT_TIER_LEVEL_CAPS: Record<SettlementTier, number> = {
  camp: 3,
  village: 6,
  town: 9,
  city: 999, // effectively uncapped
};

/** Returns the effective max level a building can reach at the player's current tier */
export function getEffectiveMaxLevel(building: BuildingDefinition, currentTier: SettlementTier): number {
  // Town Hall is never capped by tier — it drives tier progression
  if (building.id === "town_hall") return building.maxLevel;

  const tierOrder: SettlementTier[] = ["camp", "village", "town", "city"];
  const currentIdx = tierOrder.indexOf(currentTier);
  const caps = building.tierLevelCaps;

  if (caps) {
    // Find the highest cap at or below the player's current tier
    let cap = 0;
    for (let i = currentIdx; i >= 0; i--) {
      const tierCap = caps[tierOrder[i]];
      if (tierCap !== undefined) { cap = tierCap; break; }
    }
    return Math.min(cap || 0, building.maxLevel);
  }

  // Use default caps
  return Math.min(DEFAULT_TIER_LEVEL_CAPS[currentTier], building.maxLevel);
}

/** Returns the next tier needed to unlock more levels, or null if already at max */
export function getNextTierForLevels(building: BuildingDefinition, currentTier: SettlementTier): { tier: SettlementTier; name: string; maxLevel: number } | null {
  if (building.id === "town_hall") return null;
  const tierOrder: SettlementTier[] = ["camp", "village", "town", "city"];
  const currentIdx = tierOrder.indexOf(currentTier);
  const currentCap = getEffectiveMaxLevel(building, currentTier);
  if (currentCap >= building.maxLevel) return null;

  for (let i = currentIdx + 1; i < tierOrder.length; i++) {
    const nextCap = getEffectiveMaxLevel(building, tierOrder[i]);
    if (nextCap > currentCap) {
      return { tier: tierOrder[i], name: getSettlementName(tierOrder[i]), maxLevel: nextCap };
    }
  }
  return null;
}

// ─── Mason's Guild helpers ──────────────────────────────────────

export interface MasonBonuses {
  queueSlots: number;      // total simultaneous builds allowed
  costReduction: number;    // 0.0 – 0.25
  timeReduction: number;    // 0.0 – 0.25
}

const MASON_BONUS_PER_LEVEL = 0.05; // 5% per level

export function getMasonBonuses(masonLevel: number): MasonBonuses {
  return {
    queueSlots: 1 + masonLevel,  // base 1 + 1 per level
    costReduction: masonLevel * MASON_BONUS_PER_LEVEL,
    timeReduction: masonLevel * MASON_BONUS_PER_LEVEL,
  };
}

/** Apply Mason's Guild cost reduction */
export function applyMasonCostReduction(cost: BuildingCost, masonLevel: number): BuildingCost {
  const { costReduction } = getMasonBonuses(masonLevel);
  return {
    wood: Math.floor(cost.wood * (1 - costReduction)),
    stone: Math.floor(cost.stone * (1 - costReduction)),
  };
}

/** Apply Mason's Guild time reduction */
export function applyMasonTimeReduction(buildTime: number, masonLevel: number): number {
  const { timeReduction } = getMasonBonuses(masonLevel);
  return Math.floor(buildTime * (1 - timeReduction));
}

// ─── Game constants ──────────────────────────────────────────────

// Population capacity per Houses level
export const HOUSES_POP_PER_LEVEL = 8;

// Base population (you always have some citizens even without houses)
export const BASE_POPULATION = 5;

// Food consumed per citizen per hour
export const FOOD_PER_CITIZEN_PER_HOUR = 3;

// Material storage (wood & stone) — Warehouse
export const BASE_MATERIAL_STORAGE = 500;
export const MATERIAL_STORAGE_PER_WAREHOUSE_LEVEL = 500;

// Food storage — Pantry
export const BASE_FOOD_STORAGE = 300;
export const FOOD_STORAGE_PER_PANTRY_LEVEL = 300;

// Gold storage — Town Hall treasury
export const BASE_GOLD_STORAGE = 200;
export const GOLD_STORAGE_PER_TH_LEVEL = 300;

// Villager growth: 1 new villager per this many game-hours, when conditions are met
export const VILLAGER_GROWTH_INTERVAL_HOURS = 0.083; // ~1 villager every 5 min

// Gold tax income per citizen per hour
export const GOLD_TAX_PER_CITIZEN_PER_HOUR = 1;

// Ale system
export const ALE_PRODUCTION_PER_BREWERY_LEVEL = 5; // ale/hour
export const ALE_FOOD_COST_PER_BREWERY_LEVEL = 3; // food consumed/hour to make ale
export const ALE_CONSUMED_PER_TAVERN_LEVEL = 4; // ale consumed/hour
export const ALE_STORAGE_BASE = 50;
export const ALE_STORAGE_PER_BREWERY_LEVEL = 30;

// Happiness
export const CHAPEL_HAPPINESS_PER_LEVEL = 3;
export const TAVERN_HAPPINESS_PER_LEVEL = 5; // when ale is available
export const TAVERN_HAPPINESS_DRY = 1; // per level when no ale
