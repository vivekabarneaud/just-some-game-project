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
  category: "settlement" | "gathering" | "crafting" | "guild" | "defense" | "magic" | "trade";
  description: string;
  icon: string;
  image?: string; // path to building illustration
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
  damaged: boolean;
}

/** Repair cost: 30% of current level's build cost */
export function getRepairCost(building: BuildingDefinition, level: number): BuildingCost {
  if (level <= 0) return { wood: 0, stone: 0 };
  const levelDef = building.levels[level - 1];
  if (!levelDef) return { wood: 0, stone: 0 };
  return {
    wood: Math.floor(levelDef.cost.wood * 0.3),
    stone: Math.floor(levelDef.cost.stone * 0.3),
  };
}

// ─── Settlement tiers ────────────────────────────────────────────

export const SETTLEMENT_TIERS: { tier: SettlementTier; name: string; minTownHall: number }[] = [
  { tier: "camp", name: "Camp", minTownHall: 1 },
  { tier: "village", name: "Village", minTownHall: 3 },
  { tier: "town", name: "Town", minTownHall: 5 },
  { tier: "city", name: "City", minTownHall: 7 },
];

// Prerequisites for upgrading Town Hall to the level that triggers a tier change
// Key = the TH level that triggers the new tier
export interface TierPrerequisite {
  buildingId: string;
  minLevel: number;
  label: string;
}

export const TIER_UPGRADE_PREREQUISITES: Record<number, TierPrerequisite[]> = {
  // TH lvl 3 = village: need houses lvl 2 + woodworker lvl 1
  3: [
    { buildingId: "houses", minLevel: 2, label: "Houses Lv.2" },
    { buildingId: "woodworker", minLevel: 1, label: "Woodworker" },
  ],
  // TH lvl 5 = town: need houses lvl 6 + tailoring shop lvl 1
  5: [
    { buildingId: "houses", minLevel: 6, label: "Houses Lv.6" },
    { buildingId: "tailoring_shop", minLevel: 1, label: "Tailoring Shop" },
  ],
  // TH lvl 7 = city: need houses lvl 10 + blacksmith lvl 1
  7: [
    { buildingId: "houses", minLevel: 10, label: "Houses Lv.10" },
    { buildingId: "blacksmith", minLevel: 1, label: "Blacksmith" },
  ],
};

export function getTierPrerequisitesMet(targetTHLevel: number, buildings: PlayerBuilding[]): { met: boolean; missing: string[] } {
  const prereqs = TIER_UPGRADE_PREREQUISITES[targetTHLevel];
  if (!prereqs) return { met: true, missing: [] };
  const missing: string[] = [];
  for (const p of prereqs) {
    const b = buildings.find((b) => b.buildingId === p.buildingId);
    if (!b || b.level < p.minLevel) missing.push(p.label);
  }
  return { met: missing.length === 0, missing };
}

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
    // Costs: gentle for lvl 1-2, steeper for 3+
    const costMultiplier = lvl <= 2 ? Math.pow(1.35, lvl - 1) : Math.pow(1.35, 1) * Math.pow(1.55, lvl - 2);
    // Build time starts very short and ramps up — first levels feel instant
    const timeMultiplier = Math.pow(1.6, lvl - 1);
    return {
      level: lvl,
      cost: {
        wood: Math.floor(base.wood * costMultiplier),
        stone: Math.floor(base.stone * costMultiplier),
      },
      buildTime: Math.floor(buildTimeBase * timeMultiplier),
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
    category: "settlement",
    description:
      "The heart of your settlement. Upgrading the Town Hall unlocks new buildings and evolves your settlement.",
    icon: "🏛️",
    maxLevel: 25,
    levels: generateLevels({ wood: 80, stone: 80 }, 60, undefined, 25),
    requiredTier: "camp",
  },
  {
    id: "houses",
    name: "Houses",
    category: "settlement",
    description:
      "Simple dwellings for your citizens. Each level provides housing for more people, allowing your settlement to grow.",
    icon: "🏠",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/houses.png",
    maxLevel: 20,
    levels: generateLevels({ wood: 60, stone: 40 }, 6),
    requiredTier: "camp",
  },
  {
    id: "warehouse",
    name: "Warehouse",
    category: "settlement",
    description:
      "A sturdy storehouse for wood and stone. Without enough storage, excess materials are lost.",
    icon: "🏚️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/warehouse.png",
    maxLevel: 20,
    levels: generateLevels({ wood: 80, stone: 60 }, 7),
    requiredTier: "camp",
  },
  {
    id: "pantry",
    name: "Pantry",
    category: "settlement",
    description:
      "A cool cellar and salting room to preserve food. Without a pantry, surplus food spoils quickly.",
    icon: "🥫",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/pantry.png",
    maxLevel: 20,
    levels: generateLevels({ wood: 50, stone: 30 }, 6),
    requiredTier: "camp",
  },

  // Camp tier — Woodworker (wood-based equipment)
  {
    id: "woodworker",
    name: "Woodworker",
    category: "crafting",
    description:
      "A skilled carpenter crafts staves, bows, and wooden equipment. Essential gear for wizards and archers.",
    icon: "🪚",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/woodworker.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 60, stone: 20 }, 15, undefined, 10),
    requiredTier: "camp",
    tierLevelCaps: { camp: 3, village: 6, town: 8, city: 10 },
  },

  // Camp tier — Shrine (happiness + deity blessings)
  {
    id: "shrine",
    name: "Shrine",
    category: "settlement",
    description:
      "A sacred place where the old gods are honored. Each day a different deity visits — make an offering to receive their blessing. Also improves settlement happiness.",
    icon: "🔮",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/shrine.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 40, stone: 60 }, 18, undefined, 10),
    requiredTier: "camp",
    tierLevelCaps: { camp: 2, village: 5, town: 8, city: 10 },
  },

  // Camp tier — production basics
  {
    id: "lumber_mill",
    name: "Lumber Mill",
    category: "gathering",
    description:
      "Woodcutters fell trees from the surrounding forest and process them into usable timber.",
    icon: "🪓",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/lumber_mill.png",
    maxLevel: 20,
    levels: generateLevels({ wood: 30, stone: 40 }, 7, { resource: "wood", baseRate: 55 }),
    requiredTier: "camp",
  },
  {
    id: "quarry",
    name: "Stone Quarry",
    category: "gathering",
    description:
      "Miners extract stone from the nearby hills. Essential for constructing advanced buildings.",
    icon: "⛏️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/quarry.png",
    maxLevel: 20,
    levels: generateLevels({ wood: 60, stone: 10 }, 7, { resource: "stone", baseRate: 40 }),
    requiredTier: "camp",
  },
  {
    id: "hunting_camp",
    name: "Hunting Camp",
    category: "gathering",
    description:
      "Skilled hunters venture into the wilds, bringing back game, pelts, and leather. Production is reduced in autumn (75%) and winter (50%) when game is scarce.",
    icon: "🏹",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/hunting_camp.png",
    maxLevel: 15,
    levels: generateLevels({ wood: 40, stone: 10 }, 6, { resource: "food", baseRate: 14, foodType: "meat" }, 15),
    requiredTier: "camp",
  },

  {
    id: "forager_hut",
    name: "Forager's Hut",
    category: "gathering",
    description:
      "Gatherers scour the forest for food, fiber, and medicinal herbs. Berries in spring and summer, mushrooms in autumn (75%), and nuts in winter (25%) — they always find something.",
    icon: "🫐",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/forager_hut.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 30, stone: 5 }, 6, { resource: "food", baseRate: 8, foodType: "berries" }, 10),
    requiredTier: "camp",
  },

  {
    id: "fishing_hut",
    name: "Fishing Hut",
    category: "gathering",
    description:
      "A small dock on the river where fishermen cast their nets. Production is reduced in autumn (75%) and winter (50%) when rivers run cold.",
    icon: "🐟",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/fishing_hut.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 35, stone: 10 }, 6, { resource: "food", baseRate: 12, foodType: "fish" }, 10),
    requiredTier: "camp",
  },

  // Village tier — Brewery & Tavern (ale chain + happiness)
  {
    id: "brewery",
    name: "Brewery",
    category: "crafting",
    description:
      "Converts grain into ale. A vital supply for the Tavern and a happy settlement.",
    icon: "🍺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/brewery.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 60, stone: 40 }, 20, undefined, 10),
    requiredTier: "village",
    tierLevelCaps: { village: 3, town: 7, city: 10 },
  },
  {
    id: "tavern",
    name: "Tavern",
    category: "settlement",
    description:
      "A lively gathering place for citizens and travelers. Consumes ale and greatly boosts happiness.",
    icon: "🍻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/tavern.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 80, stone: 50 }, 22, undefined, 10),
    requiredTier: "village",
    tierLevelCaps: { village: 3, town: 7, city: 10 },
  },

  // Village tier — Tailoring Shop (clothing crafting)
  {
    id: "tailoring_shop",
    name: "Tailoring Shop",
    category: "crafting",
    description:
      "Skilled tailors craft clothing from wool and fiber. Citizens need clothes to stay warm, especially in winter.",
    icon: "🧵",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/tailoring_shop.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 50, stone: 30 }, 18, undefined, 10),
    requiredTier: "village",
    tierLevelCaps: { village: 3, town: 7, city: 10 },
  },

  // Village tier (TH 3+)
  {
    id: "gold_mine",
    name: "Gold Mine",
    category: "gathering",
    description: "Deep shafts delve into the earth seeking precious gold veins to fund your realm.",
    icon: "💰",
    maxLevel: 20,
    levels: generateLevels({ wood: 100, stone: 80 }, 22, { resource: "gold", baseRate: 15 }),
    requiredTier: "village",
  },
  {
    id: "iron_mine",
    name: "Iron Mine",
    category: "gathering",
    description: "Miners extract iron ore from deep veins. Essential for the Blacksmith to forge tools, weapons, and armor.",
    icon: "⚒️",
    maxLevel: 15,
    levels: generateLevels({ wood: 80, stone: 100 }, 22, undefined, 15),
    requiredTier: "village",
    tierLevelCaps: { village: 4, town: 10, city: 15 },
  },
  {
    id: "blacksmith",
    name: "Blacksmith",
    category: "crafting",
    description:
      "The ring of hammer on anvil echoes through the village. The blacksmith forges tools and weapons for your people.",
    icon: "🔨",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/blacksmith.png",
    maxLevel: 15,
    levels: generateLevels({ wood: 80, stone: 60 }, 25, undefined, 15),
    requiredTier: "village",
  },
  {
    id: "leatherworking",
    name: "Leatherworking",
    category: "crafting",
    description:
      "Hides and pelts are tanned, cut, and stitched into light armor. Assassins and archers swear by leather — flexible, quiet, and tougher than it looks.",
    icon: "🪡",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/leatherworking.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 50, stone: 25 }, 15, undefined, 10),
    requiredTier: "village",
    tierLevelCaps: { camp: 0, village: 3, town: 7, city: 10 },
  },
  {
    id: "marketplace",
    name: "Marketplace",
    category: "trade",
    description:
      "A bustling bazaar where travelling merchants gather. Trade your surplus resources for what you need.",
    icon: "🏪",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/marketplace.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 60, stone: 40 }, 25, undefined, 10),
    requiredTier: "camp",
    tierLevelCaps: { camp: 2, village: 5, town: 8, city: 10 },
  },

  // Town tier (TH 5+)
  {
    id: "barracks",
    name: "Barracks",
    category: "defense",
    description:
      "Training grounds for your soldiers. Higher levels unlock more powerful unit types.",
    icon: "⚔️",
    maxLevel: 20,
    levels: generateLevels({ wood: 100, stone: 80 }, 30),
    requiredTier: "town",
  },
  {
    id: "watchtower",
    name: "Watchtower",
    category: "defense",
    description:
      "Sentinels keep watch from this tall tower, warning of approaching threats and improving your defenses.",
    icon: "🏰",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/watchtower.png",
    maxLevel: 15,
    levels: generateLevels({ wood: 60, stone: 120 }, 32, undefined, 15),
    requiredTier: "village",
  },
  {
    id: "mage_tower",
    name: "Mage Tower",
    category: "magic",
    description:
      "A spire of arcane energy where wizards study the mystic arts. Unlocks magical research.",
    icon: "🗼",
    maxLevel: 20,
    levels: generateLevels({ wood: 60, stone: 100 }, 38),
    requiredTier: "town",
  },

  // Camp tier — Adventurer's Guild (missions)
  {
    id: "adventurers_guild",
    name: "Adventurer's Guild",
    category: "guild",
    description:
      "A bustling hall where brave souls gather seeking fortune. Recruit adventurers and send them on missions to bring back resources and treasure.",
    icon: "🏰",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/adventurers_guild.png",
    maxLevel: 5,
    levels: [
      { level: 1, cost: { wood: 60, stone: 40 }, buildTime: 30, description: "2 mission slots, recruit Novices" },
      { level: 2, cost: { wood: 150, stone: 120 }, buildTime: 180, description: "3 mission slots, recruit up to Apprentice" },
      { level: 3, cost: { wood: 280, stone: 220 }, buildTime: 360, description: "4 mission slots, recruit up to Journeyman" },
      { level: 4, cost: { wood: 500, stone: 400 }, buildTime: 600, description: "5 mission slots, recruit up to Veteran" },
      { level: 5, cost: { wood: 900, stone: 700 }, buildTime: 900, description: "6 mission slots, recruit up to Elite" },
    ],
    requiredTier: "camp",
    tierLevelCaps: { camp: 2, village: 3, town: 4, city: 5 },
  },

  // Village tier — Mason's Guild (queue + build bonuses)
  {
    id: "masons_guild",
    name: "Mason's Guild",
    category: "guild",
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
    category: "defense",
    description:
      "Stone fortifications around your settlement. Provides passive defense against raids and attacks.",
    icon: "🧱",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/walls.png",
    maxLevel: 15,
    levels: generateLevels({ wood: 40, stone: 120 }, 25, undefined, 15),
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/alchemy_lab.png",
    maxLevel: 15,
    levels: generateLevels({ wood: 40, stone: 80 }, 45, undefined, 15),
    requiredTier: "city",
  },
];

// ─── Default tier level caps ────────────────────────────────────
// Applied to any building that doesn't specify its own tierLevelCaps.
// Town Hall is exempt (no cap) since it IS the tier driver.

export const DEFAULT_TIER_LEVEL_CAPS: Record<SettlementTier, number> = {
  camp: 3,
  village: 6,
  town: 10,
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
export const FOOD_PER_CITIZEN_PER_HOUR = 5;

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

// Winter cold
export const WINTER_WOOD_PER_CITIZEN_PER_HOUR = 0.5; // wood consumed for heating
export const WINTER_HAPPINESS_PENALTY = -10; // base happiness penalty in winter
export const WINTER_NO_WOOD_HAPPINESS = -25; // extra penalty if wood runs out
export const WINTER_NO_WOOD_DEATH_RATE = 0.3; // citizens lost per hour if freezing

// Clothing
export const CLOTHING_PER_CITIZENS = 2; // 1 clothing per 2 citizens
export const CLOTHING_DEGRADE_PER_DAY = 1; // clothing lost per game-day (24h)
export const CLOTHING_WINTER_WOOD_REDUCTION = 0.3; // 30% less wood needed per clothed citizen
export const CLOTHING_HAPPINESS_BONUS = 5; // happiness when fully clothed
export const CLOTHING_HAPPINESS_PENALTY = -5; // happiness when not enough clothes

// Ale system
export const ALE_PRODUCTION_PER_BREWERY_LEVEL = 5; // ale/hour
export const ALE_FOOD_COST_PER_BREWERY_LEVEL = 3; // food consumed/hour to make ale
export const ALE_CONSUMED_PER_TAVERN_LEVEL = 4; // ale consumed/hour
export const ALE_STORAGE_BASE = 50;
export const ALE_STORAGE_PER_BREWERY_LEVEL = 30;

// Happiness
export const SHRINE_HAPPINESS_PER_LEVEL = 3;
export const TAVERN_HAPPINESS_PER_LEVEL = 5; // when ale is available
export const TAVERN_HAPPINESS_DRY = 1; // per level when no ale
