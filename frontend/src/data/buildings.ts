export interface BuildingCost {
  wood: number;
  stone: number;
}

export type FoodType = "grain" | "meat" | "berries" | "fiber";

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
