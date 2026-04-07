import {
  createContext,
  createSignal,
  onMount,
  Show,
  useContext,
  onCleanup,
  type ParentProps,
} from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
import {
  BUILDINGS,
  type BuildingCost,
  type FoodType,
  type PlayerBuilding,
  type SettlementTier,
  BASE_POPULATION,
  HOUSES_POP_PER_LEVEL,
  FOOD_PER_CITIZEN_PER_HOUR,
  BASE_MATERIAL_STORAGE,
  MATERIAL_STORAGE_PER_WAREHOUSE_LEVEL,
  BASE_FOOD_STORAGE,
  FOOD_STORAGE_PER_PANTRY_LEVEL,
  BASE_GOLD_STORAGE,
  GOLD_STORAGE_PER_TH_LEVEL,
  VILLAGER_GROWTH_INTERVAL_HOURS,
  GOLD_TAX_PER_CITIZEN_PER_HOUR,
  ALE_PRODUCTION_PER_BREWERY_LEVEL,
  ALE_FOOD_COST_PER_BREWERY_LEVEL,
  ALE_CONSUMED_PER_TAVERN_LEVEL,
  ALE_STORAGE_BASE,
  ALE_STORAGE_PER_BREWERY_LEVEL,
  SHRINE_HAPPINESS_PER_LEVEL,
  TAVERN_HAPPINESS_PER_LEVEL,
  TAVERN_HAPPINESS_DRY,
  CLOTHING_PER_CITIZENS,
  CLOTHING_DEGRADE_PER_DAY,
  CLOTHING_WINTER_WOOD_REDUCTION,
  CLOTHING_HAPPINESS_BONUS,
  CLOTHING_HAPPINESS_PENALTY,
  WINTER_WOOD_PER_CITIZEN_PER_HOUR,
  WINTER_HAPPINESS_PENALTY,
  WINTER_NO_WOOD_HAPPINESS,
  WINTER_NO_WOOD_DEATH_RATE,
  getRepairCost,
  getSettlementTier,
  getSettlementName,
  isBuildingUnlocked,
  getEffectiveMaxLevel,
  getMasonBonuses,
  applyMasonCostReduction,
  applyMasonTimeReduction,
  type MasonBonuses,
} from "~/data/buildings";
import {
  type CropId,
  getCrop,
  getFieldCost,
  getFieldBuildTime,
  getSeasonYield,
  MAX_FIELDS,
  FIELD_MAX_LEVEL,
} from "~/data/crops";
import {
  type VeggieId,
  getVeggie,
  getGardenCost,
  getGardenBuildTime,
  getGardenRate,
  isGardenActive,
  MAX_GARDENS,
  GARDEN_MAX_LEVEL,
} from "~/data/gardens";
import {
  type AnimalId,
  getAnimal,
  getPenCost,
  getPenBuildTime,
  getPenProduction,
  MAX_PENS,
  PEN_MAX_LEVEL,
} from "~/data/livestock";
import {
  type Season,
  HOURS_PER_SEASON,
  HARVEST_DURATION_HOURS,
  nextSeason,
  IS_DEV,
  getGlobalSeason,
} from "~/data/seasons";
import {
  type Adventurer,
  type AdventurerRank,
  generateCandidate,
  getRecruitCost,
  getMaxRecruitRank,
  getCandidateCount,
  getMaxRoster,
  getMissionSlots,
  RECRUIT_REFRESH_HOURS,
  MISSION_REFRESH_HOURS,
  resetAdventurerSeed,
} from "~/data/adventurers";
import {
  type ActiveMission,
  type CompletedMission,
  type MissionReward,
  type MissionTemplate,
  getMission,
  generateMissionBoard,
  getMissionBoardSize,
  calcSuccessChance,
  calcDeathChance,
  calcEffectiveDuration,
  calcAssassinBonusRewards,
  calcAssassinFailRewards,
  PRIEST_REVIVE_CHANCE,
} from "~/data/missions";
import {
  getMissionXp,
  applyXp,
  RANK_NAMES,
} from "~/data/adventurers";
import {
  type InventoryItem,
  type ItemSlot,
  getItem,
  getItemByRecipe,
  getEquipmentStats,
  ITEMS,
  getSupplyEffect,
} from "~/data/items";
import {
  calcStats as calcAdvStats,
  getUnspentStatPoints,
  type AdventurerStats,
  STAT_KEYS,
} from "~/data/adventurers";
import {
  type IncomingRaid,
  type RaidResult,
  getRaid,
  calcDefense,
  calcWarningTime,
  resolveRaid,
  spawnRaid,
  getRaidChance,
  type DefenseBreakdown,
} from "~/data/raids";

import { QUEST_CHAIN } from "~/data/quests";
import {
  listSettlements,
  loadSettlement as loadSettlementApi,
  saveSettlement as saveSettlementApi,
  createSettlement as createSettlementApi,
} from "~/api/settlement";
import { isLoggedIn } from "~/api/auth";

// ─── Types ───────────────────────────────────────────────────────

// ─── Event Log ──────────────────────────────────────────────────

export type GameEventType =
  | "citizen_born" | "citizen_died" | "citizen_left"
  | "building_completed" | "building_damaged" | "building_repaired"
  | "mission_success" | "mission_failed" | "adventurer_died" | "adventurer_levelup" | "adventurer_rankup"
  | "raid_victory" | "raid_defeat" | "raid_incoming"
  | "winter_freezing";

export interface GameEvent {
  type: GameEventType;
  message: string;
  icon: string;
  timestamp: number; // game tick when it happened
}

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
    craftTime: 600, // 10 min
  },
  {
    id: "linen_clothing",
    name: "Linen Clothing",
    icon: "👘",
    building: "tailoring_shop",
    minLevel: 1,
    costs: [{ resource: "fiber", amount: 10 }],
    produces: { resource: "clothing", amount: 1 },
    craftTime: 720, // 12 min
  },
  {
    id: "fine_clothing",
    name: "Fine Clothing",
    icon: "👔",
    building: "tailoring_shop",
    minLevel: 3,
    costs: [{ resource: "wool", amount: 5 }, { resource: "fiber", amount: 5 }, { resource: "gold", amount: 10 }],
    produces: { resource: "clothing", amount: 2 },
    craftTime: 900, // 15 min
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
    craftTime: 1200, // 20 min
  },
  {
    id: "wizard_robes",
    name: "Wizard Robes",
    icon: "🧙",
    building: "tailoring_shop",
    minLevel: 3,
    costs: [{ resource: "fiber", amount: 15 }, { resource: "wool", amount: 8 }, { resource: "gold", amount: 20 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 1500, // 25 min
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
    craftTime: 480, // 8 min
  },
  {
    id: "hunting_bow",
    name: "Hunting Bow",
    icon: "🏹",
    building: "woodworker",
    minLevel: 1,
    costs: [{ resource: "wood", amount: 12 }, { resource: "fiber", amount: 5 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 600, // 10 min
  },
  {
    id: "wooden_shield",
    name: "Wooden Shield",
    icon: "🪵",
    building: "woodworker",
    minLevel: 2,
    costs: [{ resource: "wood", amount: 20 }, { resource: "iron", amount: 3 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 720, // 12 min
  },
  {
    id: "longbow",
    name: "Longbow",
    icon: "🎯",
    building: "woodworker",
    minLevel: 4,
    costs: [{ resource: "wood", amount: 25 }, { resource: "fiber", amount: 10 }, { resource: "iron", amount: 5 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 1200, // 20 min
  },
  {
    id: "enchanted_staff",
    name: "Enchanted Staff",
    icon: "✨",
    building: "woodworker",
    minLevel: 6,
    costs: [{ resource: "wood", amount: 20 }, { resource: "gold", amount: 30 }, { resource: "astralShards", amount: 2 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 1800, // 30 min
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
    craftTime: 600, // 10 min
  },
  {
    id: "iron_sword",
    name: "Iron Sword",
    icon: "⚔️",
    building: "blacksmith",
    minLevel: 1,
    costs: [{ resource: "iron", amount: 15 }, { resource: "wood", amount: 5 }],
    produces: { resource: "weapons", amount: 1 },
    craftTime: 900, // 15 min
  },
  {
    id: "iron_shield",
    name: "Iron Shield",
    icon: "🛡️",
    building: "blacksmith",
    minLevel: 2,
    costs: [{ resource: "iron", amount: 20 }, { resource: "wood", amount: 8 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 1200, // 20 min
  },
  {
    id: "iron_armor",
    name: "Iron Armor",
    icon: "🦺",
    building: "blacksmith",
    minLevel: 3,
    costs: [{ resource: "iron", amount: 30 }, { resource: "fiber", amount: 5 }, { resource: "gold", amount: 15 }],
    produces: { resource: "armor", amount: 2 },
    craftTime: 1800, // 30 min
  },
  {
    id: "chainmail",
    name: "Chainmail Armor",
    icon: "⛓️",
    building: "blacksmith",
    minLevel: 4,
    costs: [{ resource: "iron", amount: 35 }, { resource: "fiber", amount: 8 }, { resource: "gold", amount: 20 }],
    produces: { resource: "armor", amount: 1 },
    craftTime: 2100, // 35 min
  },
  {
    id: "steel_sword",
    name: "Steel Sword",
    icon: "🗡️",
    building: "blacksmith",
    minLevel: 5,
    costs: [{ resource: "iron", amount: 40 }, { resource: "gold", amount: 25 }],
    produces: { resource: "weapons", amount: 2 },
    craftTime: 2400, // 40 min
  },

  // ── Alchemy Lab recipes ───────────────────────────────────────
  {
    id: "healing_potion",
    name: "Healing Potion",
    icon: "❤️",
    building: "alchemy_lab",
    minLevel: 1,
    costs: [{ resource: "food", amount: 20 }, { resource: "gold", amount: 5 }],
    produces: { resource: "potions", amount: 1 },
    craftTime: 480, // 8 min
  },
  {
    id: "strength_elixir",
    name: "Strength Elixir",
    icon: "💪",
    building: "alchemy_lab",
    minLevel: 2,
    costs: [{ resource: "food", amount: 15 }, { resource: "iron", amount: 5 }, { resource: "gold", amount: 10 }],
    produces: { resource: "potions", amount: 1 },
    craftTime: 720, // 12 min
  },
  {
    id: "antidote",
    name: "Antidote",
    icon: "🧪",
    building: "alchemy_lab",
    minLevel: 2,
    costs: [{ resource: "food", amount: 25 }, { resource: "gold", amount: 8 }],
    produces: { resource: "potions", amount: 1 },
    craftTime: 600, // 10 min
  },
  {
    id: "revival_elixir",
    name: "Revival Elixir",
    icon: "✨",
    building: "alchemy_lab",
    minLevel: 4,
    costs: [{ resource: "food", amount: 50 }, { resource: "gold", amount: 40 }, { resource: "astralShards", amount: 3 }],
    produces: { resource: "potions", amount: 1 },
    craftTime: 3600, // 1 hour
  },
  {
    id: "transmute_gold",
    name: "Transmute to Gold",
    icon: "🪙",
    building: "alchemy_lab",
    minLevel: 3,
    costs: [{ resource: "iron", amount: 20 }, { resource: "stone", amount: 30 }],
    produces: { resource: "gold", amount: 50 },
    craftTime: 1800, // 30 min
  },
];

export interface ResourceState {
  gold: number;
  wood: number;
  stone: number;
  food: number;
}

export interface StorageCaps {
  gold: number;
  wood: number;
  stone: number;
  food: number;
}

export interface PlayerField {
  id: string;
  crop: CropId | null; // null = empty/unplanted field
  harvested: boolean; // true after this field's harvest is collected this year
  harvestsBeforeFallow: number; // 2 = fresh, 1 = one more harvest, 0 = fallow this year
  fallow: boolean; // true = resting this year, can't plant
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

export interface PlayerGarden {
  id: string;
  veggie: VeggieId;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

export interface PlayerPen {
  id: string;
  animal: AnimalId;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

export interface GameState {
  resources: ResourceState;
  buildings: PlayerBuilding[];
  fields: PlayerField[];
  gardens: PlayerGarden[];
  pens: PlayerPen[];
  population: number;
  season: Season;
  seasonElapsed: number;
  year: number;
  lastTick: number;
  gameSpeed: number;
  villageName: string;
  // Adventurer's Guild
  adventurers: Adventurer[];
  activeMissions: ActiveMission[];
  completedMissions: CompletedMission[]; // recent results (cleared on read)
  recruitCandidates: Adventurer[];
  missionBoard: MissionTemplate[];
  recruitRefreshIn: number; // game-hours until next candidate refresh
  missionRefreshIn: number; // game-hours until next mission board refresh
  // Harvest tracking
  yearHarvest: Record<string, number>; // { "wheat": 120, "flax": 60 }
  // Materials & Crafting
  wool: number;
  fiber: number;
  clothing: number;
  iron: number;
  tools: number;
  weapons: number;
  armor: number;
  potions: number;
  gems: number;
  ironMinedTotal: number; // tracks total iron for gem proc
  inventory: InventoryItem[];
  craftingQueue: ActiveCraft[];
  // Event log
  eventLog: GameEvent[];
  // Ale & Happiness
  ale: number;
  happiness: number; // 0-100
  lastRaidOutcome: "none" | "victory" | "defeat";
  lastRaidTime: number; // game-hours elapsed since last raid outcome
  // Raids
  incomingRaids: IncomingRaid[];
  raidLog: RaidResult[]; // recent results (cleared on read)
  hoursSinceLastRaid: number; // game-hours until next raid spawns
  // Astral Shards (premium currency)
  astralShards: number;
  lastDailyLogin: number; // real-world timestamp of last daily reward claim
  missionRerollToday: boolean;
  recruitRerollToday: boolean;
  lastRerollReset: number; // real-world timestamp of last reroll reset (daily)
  lastGuildVisit: number; // timestamp of last guild page visit
  lastMissionRefresh: number; // timestamp when missions last refreshed
  lastRecruitRefresh: number; // timestamp when recruits last refreshed
  // Quest system
  questRewardsClaimed: string[];
  firstMissionSent: boolean;
}

export interface FoodSource {
  type: FoodType | string;
  label: string;
  icon: string;
  rate: number;
  building: string;
}

export interface GameActions {
  upgradeBuilding: (buildingId: string) => boolean;
  canAfford: (cost: BuildingCost) => boolean;
  getBuildingEffect: (buildingId: string, nextLevel: number) => string | null;
  buildField: () => boolean;
  plantField: (fieldId: string, crop: CropId) => boolean;
  upgradeField: (fieldId: string) => boolean;
  removeField: (fieldId: string) => void;
  buildGarden: (veggie: VeggieId) => boolean;
  upgradeGarden: (gardenId: string) => boolean;
  removeGarden: (gardenId: string) => void;
  buildPen: (animal: AnimalId) => boolean;
  upgradePen: (penId: string) => boolean;
  removePen: (penId: string) => void;
  setGameSpeed: (speed: number) => void;
  renameVillage: (name: string) => void;
  resetGame: () => void;
  skipSeason: () => void;
  getProductionRates: () => ResourceState;
  getMaxPopulation: () => number;
  getFoodConsumption: () => number;
  getAnimalFoodConsumption: () => number;
  getFoodBreakdown: () => FoodSource[];
  getStorageCaps: () => StorageCaps;
  getSettlementTier: () => SettlementTier;
  getTownHallLevel: () => number;
  isHarvesting: () => boolean;
  getMasonBonuses: () => MasonBonuses;
  getMasonLevel: () => number;
  getActiveQueueCount: () => number;
  getEffectiveMaxLevel: (buildingId: string) => number;
  cancelBuild: (buildingId: string) => boolean;
  // Adventurer's Guild
  getGuildLevel: () => number;
  recruitAdventurer: (candidateId: string) => boolean;
  dismissAdventurer: (adventurerId: string) => boolean;
  deployMission: (missionId: string, adventurerIds: string[], supplies?: string[]) => boolean;
  collectCompletedMissions: () => CompletedMission[];
  getAvailableAdventurers: () => Adventurer[];
  getRosterSize: () => { current: number; max: number };
  getMissionSlotInfo: () => { used: number; max: number };
  grantResources: (amount: number) => void;
  // Ale & Happiness
  getAleInfo: () => { current: number; cap: number; production: number; consumption: number };
  startCraft: (recipeId: string) => boolean;
  getAvailableRecipes: () => CraftingRecipe[];
  getClothingInfo: () => { current: number; needed: number };
  allocateStat: (adventurerId: string, stat: keyof AdventurerStats) => boolean;
  equipItem: (adventurerId: string, itemId: string) => boolean;
  unequipItem: (adventurerId: string, slot: ItemSlot) => boolean;
  getInventoryCount: (itemId: string) => number;
  getHappinessModifier: () => number;
  getHappinessBreakdown: () => { label: string; value: number }[];
  repairBuilding: (buildingId: string) => boolean;
  // Raids
  getDefense: () => DefenseBreakdown;
  collectRaidLog: () => RaidResult[];
  triggerRaid: () => boolean;
  recallAdventurers: () => { recalled: number; instant: boolean };
  // Astral Shards
  claimDailyLogin: () => boolean;
  canClaimDailyLogin: () => boolean;
  visitGuild: () => void;
  hasNewGuildContent: () => boolean;
  rerollMissions: () => boolean;
  rerollRecruits: () => boolean;
  claimQuestReward: (questId: string) => boolean;
  claimMissionReward: (index: number) => void;
  trade: (give: keyof ResourceState, giveAmount: number, receive: keyof ResourceState, receiveAmount: number) => boolean;
}

// ─── Constants ───────────────────────────────────────────────────

const STORAGE_KEY = "medieval-realm-save";
const TICK_INTERVAL_MS = 1000;
let idCounter = 1;

function nextId(prefix: string): string {
  return `${prefix}_${idCounter++}`;
}

const NAME_PREFIXES = [
  "Oak", "Iron", "Storm", "Shadow", "Golden", "Silver", "Raven", "Wolf",
  "Frost", "Ember", "Thorn", "Stone", "Moss", "Cedar", "Amber", "Copper",
  "Willow", "Elder", "Ashen", "Bright", "Dark", "Red", "White", "Black",
  "Moon", "Sun", "Star", "Dawn", "Dusk", "Mist", "River", "Lake",
];
const NAME_SUFFIXES = [
  "hold", "haven", "dale", "ford", "stead", "watch", "keep", "fall",
  "wood", "field", "bridge", "vale", "crest", "hollow", "glen", "moor",
  "shire", "brook", "marsh", "ridge", "peak", "gate", "wall", "helm",
];

function generateSettlementName(): string {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  return prefix + suffix;
}

function createInitialState(): GameState {
  return {
    resources: { gold: 150, wood: 300, stone: 200, food: 300 },
    buildings: BUILDINGS.map((b) => ({
      buildingId: b.id,
      level: b.id === "town_hall" ? 1 : 0,
      upgrading: false,
      damaged: false,
    })),
    fields: [],
    gardens: [],
    pens: [],
    population: BASE_POPULATION,
    season: "spring",
    seasonElapsed: 0,
    year: 1,
    lastTick: Date.now(),
    gameSpeed: 1,
    villageName: generateSettlementName(),
    yearHarvest: {},
    wool: 0,
    fiber: 0,
    clothing: 0,
    iron: 0,
    tools: 0,
    weapons: 0,
    armor: 0,
    potions: 0,
    gems: 0,
    ironMinedTotal: 0,
    inventory: [],
    craftingQueue: [],
    eventLog: [],
    ale: 0,
    happiness: 50,
    lastRaidOutcome: "none",
    lastRaidTime: 0,
    adventurers: [],
    activeMissions: [],
    completedMissions: [],
    recruitCandidates: [],
    missionBoard: [],
    recruitRefreshIn: 0,
    missionRefreshIn: 0,
    incomingRaids: [],
    raidLog: [],
    hoursSinceLastRaid: 48, // start with 48h of calm
    astralShards: 0,
    lastDailyLogin: 0,
    lastGuildVisit: 0,
    lastMissionRefresh: 0,
    lastRecruitRefresh: 0,
    missionRerollToday: false,
    recruitRerollToday: false,
    lastRerollReset: Date.now(),
    questRewardsClaimed: [],
    firstMissionSent: false,
  };
}

// ─── Persistence ─────────────────────────────────────────────────

function saveGameLocal(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

let _settlementId: string | null = null;

export function getSettlementId(): string | null {
  return _settlementId;
}

function saveGame(state: GameState) {
  saveGameLocal(state);
  if (_settlementId) {
    saveSettlementApi(_settlementId, state).catch(() => { /* silent fail, will retry */ });
  }
}

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as GameState;
    for (const def of BUILDINGS) {
      if (!saved.buildings.find((b) => b.buildingId === def.id)) {
        saved.buildings.push({ buildingId: def.id, level: 0, upgrading: false, damaged: false });
      }
    }
    saved.buildings = saved.buildings.filter((b) => b.buildingId !== "farm");
    if ("mana" in saved.resources) delete (saved.resources as any)["mana"];
    if (saved.population === undefined) {
      const houses = saved.buildings.find((b) => b.buildingId === "houses");
      saved.population = BASE_POPULATION + (houses?.level ?? 0) * HOUSES_POP_PER_LEVEL;
    }
    if (!saved.fields) saved.fields = [];
    if (!saved.gardens) saved.gardens = [];
    if (!saved.pens) saved.pens = [];
    if (!saved.season) { saved.season = "spring"; saved.seasonElapsed = 0; saved.year = 1; }
    // Adventurer's Guild migration
    if (!saved.adventurers) saved.adventurers = [];
    if (!saved.activeMissions) saved.activeMissions = [];
    if (!saved.completedMissions) saved.completedMissions = [];
    if (!saved.recruitCandidates) saved.recruitCandidates = [];
    if (!saved.missionBoard) saved.missionBoard = [];
    if (saved.recruitRefreshIn === undefined) saved.recruitRefreshIn = 0;
    if (saved.missionRefreshIn === undefined) saved.missionRefreshIn = 0;
    // Force mission board refresh if missions lack tags (old save format)
    if (saved.missionBoard?.length > 0 && !(saved.missionBoard[0] as any).tags) {
      saved.missionBoard = [];
      saved.missionRefreshIn = 0;
    }
    // Chapel → Shrine rename
    for (const pb of saved.buildings) {
      if (pb.buildingId === "chapel") pb.buildingId = "shrine";
    }
    // Building damage migration
    for (const pb of saved.buildings) {
      if ((pb as any).damaged === undefined) (pb as any).damaged = false;
    }
    // Materials migration
    if (saved.wool === undefined) saved.wool = 0;
    if (saved.fiber === undefined) saved.fiber = 0;
    if (!saved.yearHarvest) saved.yearHarvest = {};
    for (const f of saved.fields) {
      if ((f as any).harvested === undefined) (f as any).harvested = false;
      if ((f as any).harvestsBeforeFallow === undefined) (f as any).harvestsBeforeFallow = 2;
      if ((f as any).fallow === undefined) (f as any).fallow = false;
    }
    if (saved.clothing === undefined) saved.clothing = 0;
    if (saved.iron === undefined) saved.iron = 0;
    if (saved.tools === undefined) saved.tools = 0;
    if (saved.weapons === undefined) saved.weapons = 0;
    if (saved.armor === undefined) saved.armor = 0;
    if (saved.potions === undefined) saved.potions = 0;
    if (saved.gems === undefined) saved.gems = 0;
    if (saved.ironMinedTotal === undefined) saved.ironMinedTotal = 0;
    if (!saved.inventory) saved.inventory = [];
    // Equipment & stats migration for adventurers
    for (const adv of saved.adventurers) {
      if (!(adv as any).equipment) (adv as any).equipment = { weapon: null, armor: null, trinket: null };
      if (!(adv as any).bonusStats) (adv as any).bonusStats = {};
    }
    for (const adv of saved.recruitCandidates) {
      if (!(adv as any).equipment) (adv as any).equipment = { weapon: null, armor: null, trinket: null };
      if (!(adv as any).bonusStats) (adv as any).bonusStats = {};
    }
    if (!saved.craftingQueue) saved.craftingQueue = [];
    // Event log migration
    if (!saved.eventLog) saved.eventLog = [];
    // Ale & Happiness migration
    if (saved.ale === undefined) saved.ale = 0;
    if (saved.happiness === undefined) saved.happiness = 50;
    if (!saved.lastRaidOutcome) saved.lastRaidOutcome = "none";
    if (saved.lastRaidTime === undefined) saved.lastRaidTime = 0;
    // Raid migration
    if (!saved.incomingRaids) saved.incomingRaids = [];
    if (!saved.raidLog) saved.raidLog = [];
    if (saved.hoursSinceLastRaid === undefined) saved.hoursSinceLastRaid = 48;
    // Astral Shards migration
    if (saved.astralShards === undefined) saved.astralShards = 0;
    if (saved.lastDailyLogin === undefined) saved.lastDailyLogin = 0;
    if (saved.lastGuildVisit === undefined) saved.lastGuildVisit = 0;
    if (saved.lastMissionRefresh === undefined) saved.lastMissionRefresh = 0;
    if (saved.lastRecruitRefresh === undefined) saved.lastRecruitRefresh = 0;
    if (saved.missionRerollToday === undefined) saved.missionRerollToday = false;
    if (saved.recruitRerollToday === undefined) saved.recruitRerollToday = false;
    if (saved.lastRerollReset === undefined) saved.lastRerollReset = Date.now();
    // Quest system migration
    if (!saved.questRewardsClaimed) saved.questRewardsClaimed = [];
    if (saved.firstMissionSent === undefined) saved.firstMissionSent = false;
    // Migrate adventurers missing xp/level fields
    for (const adv of saved.adventurers) {
      if ((adv as any).level === undefined) { (adv as any).level = 1; (adv as any).xp = 0; }
    }
    for (const adv of saved.recruitCandidates) {
      if ((adv as any).level === undefined) { (adv as any).level = 1; (adv as any).xp = 0; }
    }
    for (const pb of saved.buildings) {
      if (pb.upgrading && (pb as any).upgradeFinishTime) {
        pb.upgradeRemaining = Math.max(0, ((pb as any).upgradeFinishTime - Date.now()) / 1000);
        delete (pb as any).upgradeFinishTime;
      }
    }
    // Restore ID counter
    let maxId = 0;
    const allIds: { id: string }[] = [...saved.fields, ...saved.gardens, ...saved.pens, ...saved.adventurers, ...saved.recruitCandidates];
    for (const item of allIds) {
      const num = parseInt(item.id.replace(/^[a-z]+_/, ""), 10);
      if (num > maxId) maxId = num;
    }
    idCounter = maxId + 1;
    return saved;
  } catch {
    return null;
  }
}

// ─── Season helpers ──────────────────────────────────────────────

const MAX_EVENT_LOG = 50;
function pushEvent(s: GameState, type: GameEventType, icon: string, message: string) {
  s.eventLog.unshift({ type, icon, message, timestamp: Date.now() });
  if (s.eventLog.length > MAX_EVENT_LOG) s.eventLog.length = MAX_EVENT_LOG;
}

function isHarvestTime(season: Season, seasonElapsed: number): boolean {
  return season === "autumn" && seasonElapsed < HARVEST_DURATION_HOURS;
}

// ─── Derived calculations ────────────────────────────────────────

function calcProductionRates(state: GameState): ResourceState {
  const { buildings, fields, gardens, pens, population, season, seasonElapsed } = state;
  const rates: ResourceState = { gold: 0, wood: 0, stone: 0, food: 0 };

  // Citizen tax
  rates.gold += Math.floor(population) * GOLD_TAX_PER_CITIZEN_PER_HOUR;

  // Building production (year-round) — damaged buildings don't produce
  for (const pb of buildings) {
    if (pb.level === 0 || pb.damaged) continue;
    const def = BUILDINGS.find((b) => b.id === pb.buildingId);
    if (!def) continue;
    const levelDef = def.levels[pb.level - 1];
    if (levelDef?.production) {
      const res = levelDef.production.resource as keyof ResourceState;
      if (res in rates) rates[res] += levelDef.production.rate;
    }
  }

  // Fields — harvest burst in autumn
  if (isHarvestTime(season, seasonElapsed)) {
    for (const field of fields) {
      if (field.level === 0 || !field.crop) continue;
      const crop = getCrop(field.crop);
      if (crop.isFood) {
        rates.food += getSeasonYield(crop, field.level) / HARVEST_DURATION_HOURS;
      }
    }
  }

  // Gardens — produce during active seasons
  for (const garden of gardens) {
    if (garden.level === 0) continue;
    const veggie = getVeggie(garden.veggie);
    if (isGardenActive(veggie, season)) {
      rates.food += getGardenRate(veggie, garden.level);
    }
  }

  // Pens — produce year-round, but also consume food
  for (const pen of pens) {
    if (pen.level === 0) continue;
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.level);
    rates.food += prod.produced;
  }

  return rates;
}

function calcAnimalFoodConsumption(pens: PlayerPen[]): number {
  let total = 0;
  for (const pen of pens) {
    if (pen.level === 0) continue;
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.level);
    total += prod.consumed;
  }
  return total;
}

const FOOD_TYPE_META: Record<string, { label: string; icon: string }> = {
  grain: { label: "Grain", icon: "🌾" },
  meat: { label: "Meat", icon: "🥩" },
  berries: { label: "Berries", icon: "🫐" },
  fish: { label: "Fish", icon: "🐟" },
  eggs: { label: "Eggs", icon: "🥚" },
  milk: { label: "Milk", icon: "🥛" },
  veggies: { label: "Vegetables", icon: "🥬" },
};

function calcFoodBreakdown(state: GameState): FoodSource[] {
  const { buildings, fields, gardens, pens, season, seasonElapsed } = state;
  const sources: FoodSource[] = [];

  // Fields (harvest only)
  if (isHarvestTime(season, seasonElapsed)) {
    for (const field of fields) {
      if (field.level === 0 || !field.crop) continue;
      const crop = getCrop(field.crop);
      if (!crop.isFood) continue;
      const rate = Math.round(getSeasonYield(crop, field.level) / HARVEST_DURATION_HOURS);
      sources.push({ type: "grain", label: crop.name, icon: crop.icon, rate, building: `${crop.name} Field Lv${field.level}` });
    }
  }

  // Gardens
  for (const garden of gardens) {
    if (garden.level === 0) continue;
    const veggie = getVeggie(garden.veggie);
    if (!isGardenActive(veggie, season)) continue;
    const rate = getGardenRate(veggie, garden.level);
    sources.push({ type: "veggies", label: veggie.name, icon: veggie.icon, rate, building: `${veggie.name} Garden Lv${garden.level}` });
  }

  // Pens
  for (const pen of pens) {
    if (pen.level === 0) continue;
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.level);
    sources.push({ type: animal.foodLabel.toLowerCase(), label: animal.foodLabel, icon: animal.icon, rate: prod.produced, building: `${animal.name} Pen Lv${pen.level}` });
  }

  // Buildings (hunting, foraging, fishing)
  for (const pb of buildings) {
    if (pb.level === 0) continue;
    const def = BUILDINGS.find((b) => b.id === pb.buildingId);
    if (!def) continue;
    const levelDef = def.levels[pb.level - 1];
    if (levelDef?.production?.resource === "food" && levelDef.production.foodType) {
      const ft = levelDef.production.foodType;
      const meta = FOOD_TYPE_META[ft];
      if (meta) {
        sources.push({ type: ft, label: meta.label, icon: meta.icon, rate: levelDef.production.rate, building: def.name });
      }
    }
  }

  return sources;
}

function calcMaxPopulation(buildings: PlayerBuilding[]): number {
  const houses = buildings.find((b) => b.buildingId === "houses");
  return BASE_POPULATION + (houses?.level ?? 0) * HOUSES_POP_PER_LEVEL;
}

function calcFoodConsumption(population: number): number {
  return population * FOOD_PER_CITIZEN_PER_HOUR;
}

function calcStorageCaps(buildings: PlayerBuilding[]): StorageCaps {
  const warehouse = buildings.find((b) => b.buildingId === "warehouse");
  const pantry = buildings.find((b) => b.buildingId === "pantry");
  const th = buildings.find((b) => b.buildingId === "town_hall");
  const materialCap = BASE_MATERIAL_STORAGE + (warehouse?.level ?? 0) * MATERIAL_STORAGE_PER_WAREHOUSE_LEVEL;
  return {
    gold: BASE_GOLD_STORAGE + (th?.level ?? 0) * GOLD_STORAGE_PER_TH_LEVEL,
    wood: materialCap,
    stone: materialCap,
    food: BASE_FOOD_STORAGE + (pantry?.level ?? 0) * FOOD_STORAGE_PER_PANTRY_LEVEL,
  };
}

function getTownHallLevel(buildings: PlayerBuilding[]): number {
  return buildings.find((b) => b.buildingId === "town_hall")?.level ?? 0;
}

function calcBuildingEffect(buildingId: string, nextLevel: number): string | null {
  const currentLevel = nextLevel - 1;
  switch (buildingId) {
    case "warehouse": {
      const cur = BASE_MATERIAL_STORAGE + Math.max(0, currentLevel) * MATERIAL_STORAGE_PER_WAREHOUSE_LEVEL;
      const next = BASE_MATERIAL_STORAGE + nextLevel * MATERIAL_STORAGE_PER_WAREHOUSE_LEVEL;
      return `Wood & Stone storage: ${cur.toLocaleString()} → ${next.toLocaleString()}`;
    }
    case "pantry": {
      const cur = BASE_FOOD_STORAGE + Math.max(0, currentLevel) * FOOD_STORAGE_PER_PANTRY_LEVEL;
      const next = BASE_FOOD_STORAGE + nextLevel * FOOD_STORAGE_PER_PANTRY_LEVEL;
      return `Food storage: ${cur.toLocaleString()} → ${next.toLocaleString()}`;
    }
    case "houses": {
      const cur = BASE_POPULATION + Math.max(0, currentLevel) * HOUSES_POP_PER_LEVEL;
      const next = BASE_POPULATION + nextLevel * HOUSES_POP_PER_LEVEL;
      return `Max population: ${cur} → ${next}`;
    }
    case "town_hall": {
      const curGold = BASE_GOLD_STORAGE + Math.max(0, currentLevel) * GOLD_STORAGE_PER_TH_LEVEL;
      const nextGold = BASE_GOLD_STORAGE + nextLevel * GOLD_STORAGE_PER_TH_LEVEL;
      const curTier = getSettlementTier(Math.max(0, currentLevel));
      const nextTier = getSettlementTier(nextLevel);
      const tierChange = curTier !== nextTier ? ` — Evolves to ${getSettlementName(nextTier)}!` : "";
      return `Treasury: ${curGold.toLocaleString()} → ${nextGold.toLocaleString()}${tierChange}`;
    }
    case "masons_guild": {
      const curBonuses = getMasonBonuses(Math.max(0, currentLevel));
      const nextBonuses = getMasonBonuses(nextLevel);
      return `Queue slots: ${curBonuses.queueSlots} → ${nextBonuses.queueSlots} · Cost/time reduction: ${Math.round(curBonuses.costReduction * 100)}% → ${Math.round(nextBonuses.costReduction * 100)}%`;
    }
    case "woodworker":
    case "blacksmith":
    case "alchemy_lab": {
      return `Crafting slots: ${Math.max(0, currentLevel)} → ${nextLevel} (1 per level)`;
    }
    case "iron_mine": {
      const cur = Math.max(0, currentLevel) * 8;
      const next = nextLevel * 8;
      return `Iron: +${cur}/h → +${next}/h`;
    }
    case "tailoring_shop": {
      return `Crafting slots: ${Math.max(0, currentLevel)} → ${nextLevel} (1 per level)`;
    }
    case "shrine": {
      const cur = Math.max(0, currentLevel) * SHRINE_HAPPINESS_PER_LEVEL;
      const next = nextLevel * SHRINE_HAPPINESS_PER_LEVEL;
      return `Happiness: +${cur} → +${next}`;
    }
    case "brewery": {
      const curAle = Math.max(0, currentLevel) * ALE_PRODUCTION_PER_BREWERY_LEVEL;
      const nextAle = nextLevel * ALE_PRODUCTION_PER_BREWERY_LEVEL;
      const curFood = Math.max(0, currentLevel) * ALE_FOOD_COST_PER_BREWERY_LEVEL;
      const nextFood = nextLevel * ALE_FOOD_COST_PER_BREWERY_LEVEL;
      return `Ale: +${curAle}/h → +${nextAle}/h · Food cost: ${curFood}/h → ${nextFood}/h`;
    }
    case "tavern": {
      const cur = Math.max(0, currentLevel) * TAVERN_HAPPINESS_PER_LEVEL;
      const next = nextLevel * TAVERN_HAPPINESS_PER_LEVEL;
      const curAle = Math.max(0, currentLevel) * ALE_CONSUMED_PER_TAVERN_LEVEL;
      const nextAle = nextLevel * ALE_CONSUMED_PER_TAVERN_LEVEL;
      return `Happiness: +${cur} → +${next} · Ale cost: ${curAle}/h → ${nextAle}/h`;
    }
    case "walls": {
      const cur = Math.max(0, currentLevel) * 8;
      const next = nextLevel * 8;
      return `Defense: +${cur} → +${next}`;
    }
    case "barracks": {
      const cur = Math.max(0, currentLevel) * 12;
      const next = nextLevel * 12;
      return `Defense: +${cur} → +${next}`;
    }
    case "watchtower": {
      const curDef = Math.max(0, currentLevel) * 5;
      const nextDef = nextLevel * 5;
      const curWarn = Math.max(0, currentLevel) * 2;
      const nextWarn = nextLevel * 2;
      return `Defense: +${curDef} → +${nextDef} · Early warning: +${curWarn}h → +${nextWarn}h`;
    }
    case "adventurers_guild": {
      const curSlots = getMissionSlots(Math.max(0, currentLevel));
      const nextSlots = getMissionSlots(nextLevel);
      const curRoster = getMaxRoster(Math.max(0, currentLevel));
      const nextRoster = getMaxRoster(nextLevel);
      return `Mission slots: ${curSlots} → ${nextSlots} · Max roster: ${curRoster} → ${nextRoster}`;
    }
    default:
      return null;
  }
}

// ─── Context ─────────────────────────────────────────────────────

const GameContext = createContext<{ state: GameState; actions: GameActions }>();

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────

export function GameProvider(props: ParentProps) {
  const [loaded, setLoaded] = createSignal(false);
  // In production, always start with a blank state — the server load will overwrite it.
  // In dev, load from localStorage for offline play.
  const initial = IS_DEV ? (loadGame() ?? createInitialState()) : createInitialState();
  const [state, setState] = createStore<GameState>(initial);

  // Load state from server on mount
  onMount(async () => {
    if (!isLoggedIn()) {
      setLoaded(true);
      return;
    }
    try {
      const list = await listSettlements();
      let settlement;
      if (list.settlements.length > 0) {
        // Load first settlement
        const res = await loadSettlementApi(list.settlements[0].id);
        settlement = res.settlement;
      } else {
        // Create first settlement
        const res = await createSettlementApi();
        settlement = res.settlement;
      }

      _settlementId = settlement.id;

      // If server has game state (not empty), use it as source of truth
      const serverState = settlement.gameState as GameState;
      if (serverState && serverState.resources) {
        // Migrate missing fields for old saves
        if (!serverState.questRewardsClaimed) serverState.questRewardsClaimed = [];
        if (serverState.firstMissionSent === undefined) serverState.firstMissionSent = false;
        // Re-apply leveling in case XP curve changed
        for (const adv of serverState.adventurers ?? []) {
          applyXp(adv, 0);
        }
        // Restore ID counter from server state and fix any duplicate IDs
        let maxId = 0;
        const allIds = [
          ...(serverState.fields ?? []),
          ...(serverState.gardens ?? []),
          ...(serverState.pens ?? []),
          ...(serverState.adventurers ?? []),
          ...(serverState.recruitCandidates ?? []),
        ];
        for (const item of allIds) {
          const num = parseInt(item.id.replace(/^[a-z]+_/, ""), 10);
          if (num > maxId) maxId = num;
        }
        idCounter = maxId + 1;
        // Rename chapel → shrine for old saves
        for (const b of serverState.buildings ?? []) {
          if (b.buildingId === "chapel") b.buildingId = "shrine";
        }
        // Fix duplicate adventurer IDs (from previous bug)
        const seenIds = new Set<string>();
        for (const adv of serverState.adventurers ?? []) {
          if (seenIds.has(adv.id)) {
            adv.id = `adv_${idCounter++}`;
          }
          seenIds.add(adv.id);
        }
        for (const adv of serverState.recruitCandidates ?? []) {
          if (seenIds.has(adv.id)) {
            adv.id = `adv_${idCounter++}`;
          }
          seenIds.add(adv.id);
        }
        setState(reconcile(serverState));
        // Catch up for time spent offline
        const offlineMs = Date.now() - serverState.lastTick;
        if (offlineMs > 2000) applyTicks(offlineMs);
        // Resolve any missions/crafts with negative remaining (server tick counted down but didn't resolve)
        const hasUnresolved = serverState.activeMissions?.some((m) => m.remaining <= 0)
          || serverState.craftingQueue?.some((c) => c.remaining <= 0);
        if (hasUnresolved) applyTicks(1000); // trigger one tick to resolve them
      } else {
        // New settlement — start with a fresh initial state, not localStorage
        const fresh = createInitialState();
        setState(reconcile(fresh));
        saveSettlementApi(settlement.id, fresh).catch(() => {});
      }
    } catch (err) {
      console.warn("Failed to load from server, using local state:", err);
    }
    setLoaded(true);
  });

  function advanceSeason(s: GameState) {
    const prev = s.season;
    const next = nextSeason(s.season);
    s.season = next;
    s.seasonElapsed = 0;
    if (next === "spring") {
      s.year += 1;
      pushEvent(s, "building_completed", "🌱", "Spring has arrived — time to plant your fields!");
    }
    // Record harvest totals and clear crops when entering winter
    if (next === "winter") {
      s.yearHarvest = {};
      for (const field of s.fields) {
        if (field.crop && field.level > 0) {
          const crop = getCrop(field.crop);
          const amount = getSeasonYield(crop, field.level);
          s.yearHarvest[crop.name] = (s.yearHarvest[crop.name] ?? 0) + amount;
          field.harvested = true;
          field.crop = null;
          // Decrement harvests before fallow
          field.harvestsBeforeFallow -= 1;
          if (field.harvestsBeforeFallow <= 0) {
            field.fallow = true;
          }
        }
      }
    }
    // Reset fallow and harvested flags in spring
    if (next === "spring") {
      for (const field of s.fields) {
        field.harvested = false;
        if (field.fallow) {
          // Fallow year is over — field is refreshed
          field.fallow = false;
          field.harvestsBeforeFallow = 2;
        }
      }
    }
    if (prev === "summer") {
      pushEvent(s, "building_completed", "🍂", "Autumn is here — harvest season begins!");
    }
  }

  function applyTicks(elapsedMs: number) {
    const elapsedHours = elapsedMs / 3_600_000;
    const elapsedSeconds = elapsedMs / 1000;
    if (elapsedHours <= 0) return;

    setState(
      produce((s) => {
        // Advance season
        if (IS_DEV) {
          // Dev mode: season driven by game ticks (affected by speed)
          s.seasonElapsed += elapsedHours;
          while (s.seasonElapsed >= HOURS_PER_SEASON) {
            s.seasonElapsed -= HOURS_PER_SEASON;
            advanceSeason(s);
          }
        } else {
          // Production: season derived from real-world time (global for all players)
          const global = getGlobalSeason();
          if (global.season !== s.season) {
            // Season changed — trigger season-change logic
            while (s.season !== global.season) {
              advanceSeason(s);
            }
          }
          s.seasonElapsed = global.progress * HOURS_PER_SEASON;
          s.year = global.year;
        }

        const rates = calcProductionRates(s);
        const citizenFood = calcFoodConsumption(s.population);
        const animalFood = calcAnimalFoodConsumption(s.pens);
        const caps = calcStorageCaps(s.buildings);
        const maxPop = calcMaxPopulation(s.buildings);
        const netFoodRate = rates.food - citizenFood - animalFood;

        // Happiness production modifier: 100% baseline, drops below 50 happiness, bonus above 80
        const happinessMod = s.happiness >= 80 ? 1 + (s.happiness - 80) / 100  // 80→100% = 1.0→1.2
          : s.happiness >= 50 ? 1.0  // 50-79 = normal
          : 0.6 + (s.happiness / 50) * 0.4; // 0-49 = 0.6→1.0

        s.resources.gold = Math.min(caps.gold, Math.max(0, s.resources.gold + rates.gold * happinessMod * elapsedHours));
        s.resources.wood = Math.min(caps.wood, Math.max(0, s.resources.wood + rates.wood * happinessMod * elapsedHours));
        s.resources.stone = Math.min(caps.stone, Math.max(0, s.resources.stone + rates.stone * happinessMod * elapsedHours));
        s.resources.food = Math.min(caps.food, Math.max(0, s.resources.food + netFoodRate * happinessMod * elapsedHours));

        // ── Wool from sheep pens (seasonal) ──
        const woolSeasonMod = s.season === "spring" || s.season === "summer" ? 1.0
          : s.season === "autumn" ? 0.5 : 0; // no wool in winter
        for (const pen of s.pens) {
          if (pen.level === 0) continue;
          const animal = getAnimal(pen.animal);
          const prod = getPenProduction(animal, pen.level);
          if (prod.secondary && prod.secondary.resource === "wool" && woolSeasonMod > 0) {
            s.wool = Math.min(200, s.wool + prod.secondary.amount * woolSeasonMod * elapsedHours);
          }
        }

        // ── Fiber from flax harvest ──
        if (isHarvestTime(s.season, s.seasonElapsed)) {
          for (const field of s.fields) {
            if (field.level === 0 || !field.crop) continue;
            const crop = getCrop(field.crop);
            if (!crop.isFood && crop.foodType === "fiber") {
              const fiberRate = getSeasonYield(crop, field.level) / HARVEST_DURATION_HOURS;
              s.fiber = Math.min(200, s.fiber + fiberRate * elapsedHours);
            }
          }
        }

        // ── Iron production + gem/shard procs ──
        const ironMineLvl = s.buildings.find((b) => b.buildingId === "iron_mine")?.level ?? 0;
        const ironMineDamaged = s.buildings.find((b) => b.buildingId === "iron_mine")?.damaged ?? false;
        if (ironMineLvl > 0 && !ironMineDamaged) {
          const ironRate = 8 * ironMineLvl;
          const ironMined = ironRate * elapsedHours;
          s.iron = Math.min(300, s.iron + ironMined);

          // 0.5% chance per iron unit for gem, 0.5% for shard
          const gemChance = ironMined * 0.005;
          const shardChance = ironMined * 0.005;
          if (Math.random() < gemChance) {
            s.gems += 1;
            pushEvent(s, "building_completed", "💎", "Your miners unearthed a rare gem!");
          }
          if (Math.random() < shardChance) {
            s.astralShards += 1;
            pushEvent(s, "building_completed", "💠", "Your miners found an astral shard in the depths!");
          }
        }

        // ── Crafting queue tick ──
        for (let i = s.craftingQueue.length - 1; i >= 0; i--) {
          const craft = s.craftingQueue[i];
          craft.remaining -= elapsedSeconds;
          if (craft.remaining <= 0) {
            const recipe = CRAFTING_RECIPES.find((r) => r.id === craft.recipeId);
            if (recipe) {
              const res = recipe.produces.resource;
              const amt = recipe.produces.amount;
              // Add to stockpile counters
              if (res === "clothing") s.clothing += amt;
              else if (res === "tools") s.tools += amt;
              else if (res === "weapons") s.weapons += amt;
              else if (res === "armor") s.armor += amt;
              else if (res === "potions") s.potions += amt;
              else if (res === "gold") s.resources.gold += amt;
              else if (res === "wool") s.wool += amt;
              else if (res === "fiber") s.fiber += amt;
              // Also add equippable item to inventory
              const itemDef = getItemByRecipe(recipe.id);
              if (itemDef) {
                const existing = s.inventory.find((i) => i.itemId === itemDef.id);
                if (existing) existing.quantity += amt;
                else s.inventory.push({ itemId: itemDef.id, quantity: amt });
              }
              pushEvent(s, "building_completed", recipe.icon, `Crafted ${recipe.name} (x${recipe.produces.amount})`);
            }
            s.craftingQueue.splice(i, 1);
          }
        }

        // ── Clothing degradation ──
        s.clothing = Math.max(0, s.clothing - (CLOTHING_DEGRADE_PER_DAY / 24) * elapsedHours);

        // ── Ale production & consumption ──
        const breweryLvl = s.buildings.find((b) => b.buildingId === "brewery")?.level ?? 0;
        const tavernLvl = s.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
        const aleStorageCap = ALE_STORAGE_BASE + breweryLvl * ALE_STORAGE_PER_BREWERY_LEVEL;

        if (breweryLvl > 0) {
          const aleProduced = ALE_PRODUCTION_PER_BREWERY_LEVEL * breweryLvl * elapsedHours;
          const foodNeeded = ALE_FOOD_COST_PER_BREWERY_LEVEL * breweryLvl * elapsedHours;
          // Only produce if we have enough food
          if (s.resources.food >= foodNeeded) {
            s.resources.food -= foodNeeded;
            s.ale = Math.min(aleStorageCap, s.ale + aleProduced);
          }
        }

        let aleConsumed = 0;
        if (tavernLvl > 0) {
          const aleNeeded = ALE_CONSUMED_PER_TAVERN_LEVEL * tavernLvl * elapsedHours;
          aleConsumed = Math.min(s.ale, aleNeeded);
          s.ale = Math.max(0, s.ale - aleConsumed);
        }

        // ── Winter cold (clothing reduces wood needed) ──
        const isWinter = s.season === "winter";
        if (isWinter) {
          const clothingNeeded = Math.ceil(s.population / CLOTHING_PER_CITIZENS);
          const clothingRatio = Math.min(1, s.clothing / Math.max(1, clothingNeeded));
          const woodReduction = clothingRatio * CLOTHING_WINTER_WOOD_REDUCTION;
          const woodNeeded = WINTER_WOOD_PER_CITIZEN_PER_HOUR * (1 - woodReduction) * s.population * elapsedHours;
          if (s.resources.wood >= woodNeeded) {
            s.resources.wood -= woodNeeded;
          } else {
            s.resources.wood = 0;
            // Freezing — citizens die
            const frozenBefore = Math.floor(s.population);
            s.population = Math.max(BASE_POPULATION, s.population - WINTER_NO_WOOD_DEATH_RATE * elapsedHours);
            const frozenLost = frozenBefore - Math.floor(s.population);
            if (frozenLost > 0) {
              pushEvent(s, "winter_freezing", "🥶", `${frozenLost} citizen${frozenLost > 1 ? "s" : ""} froze to death`);
            }
          }
        }

        // ── Happiness calculation ──
        let happiness = 50; // baseline

        // Food surplus/deficit
        if (netFoodRate > 0) happiness += Math.min(15, netFoodRate / 5);
        else if (netFoodRate < 0) happiness -= Math.min(30, Math.abs(netFoodRate) / 3);

        // Starvation penalty
        if (s.resources.food <= 0) happiness -= 20;

        // Winter cold
        if (isWinter) {
          happiness += WINTER_HAPPINESS_PENALTY;
          if (s.resources.wood <= 0) happiness += WINTER_NO_WOOD_HAPPINESS;
        }

        // Housing
        if (s.population > maxPop) happiness -= 15; // overcrowded
        else if (s.population > maxPop * 0.9) happiness -= 5; // nearly full

        // Chapel
        const shrineLvl = s.buildings.find((b) => b.buildingId === "shrine")?.level ?? 0;
        happiness += shrineLvl * SHRINE_HAPPINESS_PER_LEVEL;

        // Tavern (depends on ale)
        if (tavernLvl > 0) {
          const aleRatio = aleConsumed / (ALE_CONSUMED_PER_TAVERN_LEVEL * tavernLvl * elapsedHours || 1);
          if (aleRatio > 0.5) {
            happiness += tavernLvl * TAVERN_HAPPINESS_PER_LEVEL;
          } else {
            happiness += tavernLvl * TAVERN_HAPPINESS_DRY; // dry tavern
          }
        }

        // Clothing
        const clothingNeededHappy = Math.ceil(s.population / CLOTHING_PER_CITIZENS);
        if (clothingNeededHappy > 0) {
          if (s.clothing >= clothingNeededHappy) happiness += CLOTHING_HAPPINESS_BONUS;
          else if (s.clothing < clothingNeededHappy * 0.5) happiness += CLOTHING_HAPPINESS_PENALTY;
        }

        // Food diversity
        const foodSources = new Set<string>();
        for (const pb of s.buildings) {
          if (pb.level === 0 || pb.damaged) continue;
          const def = BUILDINGS.find((b) => b.id === pb.buildingId);
          if (def) {
            const lvlDef = def.levels[pb.level - 1];
            if (lvlDef?.production?.foodType) foodSources.add(lvlDef.production.foodType);
          }
        }
        for (const garden of s.gardens) {
          if (garden.level > 0) foodSources.add("veggies");
        }
        for (const pen of s.pens) {
          if (pen.level > 0) {
            const animal = getAnimal(pen.animal);
            foodSources.add(animal.foodLabel.toLowerCase());
          }
        }
        const foodTypes = foodSources.size;
        if (foodTypes <= 1) happiness -= 5;
        else if (foodTypes === 3) happiness += 3;
        else if (foodTypes === 4) happiness += 6;
        else if (foodTypes >= 5) happiness += 10;

        // Damaged buildings
        const damagedCount = s.buildings.filter((b) => b.damaged).length;
        if (damagedCount > 0) happiness -= damagedCount * 3;

        // Raid morale (decays over 48 game-hours)
        s.lastRaidTime += elapsedHours;
        if (s.lastRaidOutcome !== "none") {
          const decay = Math.max(0, 1 - s.lastRaidTime / 48);
          if (s.lastRaidOutcome === "victory") happiness += Math.round(10 * decay);
          else if (s.lastRaidOutcome === "defeat") happiness -= Math.round(15 * decay);
          if (decay <= 0) s.lastRaidOutcome = "none";
        }

        s.happiness = Math.max(0, Math.min(100, Math.round(happiness)));

        // Tick upgrades — buildings, fields, gardens, pens
        for (const list of [s.buildings, s.fields, s.gardens, s.pens]) {
          for (const item of list) {
            if (item.upgrading && item.upgradeRemaining !== undefined) {
              item.upgradeRemaining -= elapsedSeconds;
              if (item.upgradeRemaining <= 0) {
                item.level += 1;
                item.upgrading = false;
                item.upgradeRemaining = undefined;
                // Log building completion
                if ("buildingId" in item) {
                  const def = BUILDINGS.find((b) => b.id === (item as any).buildingId);
                  if (def) pushEvent(s, "building_completed", def.icon, `${def.name} upgraded to level ${item.level}`);
                }
              }
            }
          }
        }

        // Villager growth / decline (affected by happiness)
        const popBefore = Math.floor(s.population);
        if (netFoodRate > 0 && s.population < maxPop && s.happiness >= 20) {
          const growthMod = s.happiness >= 70 ? 1.5 : s.happiness >= 40 ? 1.0 : 0.5;
          const growth = (1 / VILLAGER_GROWTH_INTERVAL_HOURS) * elapsedHours * growthMod;
          s.population = Math.min(maxPop, s.population + growth);
        } else if (s.happiness < 20 && s.population > BASE_POPULATION) {
          s.population = Math.max(BASE_POPULATION, s.population - elapsedHours * 0.5);
        } else if (s.resources.food <= 0 && s.population > BASE_POPULATION) {
          s.population = Math.max(BASE_POPULATION, s.population - elapsedHours);
        }
        const popAfter = Math.floor(s.population);
        if (popAfter > popBefore) {
          pushEvent(s, "citizen_born", "👶", `${popAfter - popBefore} new citizen${popAfter - popBefore > 1 ? "s" : ""} arrived`);
        } else if (popAfter < popBefore) {
          const lost = popBefore - popAfter;
          if (s.resources.food <= 0) {
            pushEvent(s, "citizen_died", "💀", `${lost} citizen${lost > 1 ? "s" : ""} starved`);
          } else if (s.happiness < 20) {
            pushEvent(s, "citizen_left", "🚶", `${lost} citizen${lost > 1 ? "s" : ""} left (unhappy)`);
          }
        }

        // ── Adventurer's Guild tick ──
        const guildLvl = s.buildings.find((b) => b.buildingId === "adventurers_guild")?.level ?? 0;
        if (guildLvl > 0) {
          // Tick active missions
          for (let i = s.activeMissions.length - 1; i >= 0; i--) {
            const am = s.activeMissions[i];
            am.remaining -= elapsedSeconds;
            if (am.remaining <= 0) {
              // Mission complete — resolve
              const template = getMission(am.missionId);
              const team = am.adventurerIds.map((id) => s.adventurers.find((a) => a.id === id)).filter(Boolean) as Adventurer[];
              const success = Math.random() * 100 < am.successChance;
              const casualties: string[] = [];
              const revived: string[] = [];
              const levelUps: string[] = [];
              const rankUps: { name: string; newRank: string }[] = [];

              if (!success && template) {
                // Check for deaths
                const deadIds: string[] = [];
                for (const adv of team) {
                  const deathChance = calcDeathChance(template, team, adv);
                  if (Math.random() * 100 < deathChance) {
                    deadIds.push(adv.id);
                  }
                }

                // Warrior passive: Shield Wall — protect one ally from death
                const warriors = team.filter((a) => a.class === "warrior" && !deadIds.includes(a.id));
                for (const warrior of warriors) {
                  const protectable = deadIds.filter((id) => id !== warrior.id);
                  if (protectable.length > 0) {
                    // Warrior takes the hit instead (50% chance warrior survives)
                    const savedId = protectable[0];
                    deadIds.splice(deadIds.indexOf(savedId), 1);
                    if (Math.random() > 0.5) {
                      deadIds.push(warrior.id);
                    }
                    break; // only one save per mission
                  }
                }

                // Priest passive: Divine Grace — chance to revive fallen allies
                const priests = team.filter((a) => a.class === "priest" && !deadIds.includes(a.id));
                for (const deadId of [...deadIds]) {
                  for (const _priest of priests) {
                    if (Math.random() < PRIEST_REVIVE_CHANCE) {
                      deadIds.splice(deadIds.indexOf(deadId), 1);
                      revived.push(deadId);
                      break; // one revive attempt per fallen
                    }
                  }
                }

                // Apply deaths
                for (const id of deadIds) {
                  casualties.push(id);
                  const advInState = s.adventurers.find((a) => a.id === id);
                  if (advInState) {
                    advInState.alive = false;
                    // Equipment lost on death
                    advInState.equipment = { weapon: null, armor: null, trinket: null };
                  }
                }
              }

              // Calculate rewards with class passives
              let rewards: MissionReward[] = [];
              if (template) {
                if (success) {
                  rewards = calcAssassinBonusRewards(template, team);
                } else {
                  // Assassin partial loot on failure
                  const survivors = team.filter((a) => !casualties.includes(a.id));
                  rewards = calcAssassinFailRewards(template, team, survivors);
                }
              }

              // Grant XP to all surviving adventurers (WIS boosts XP)
              const baseXp = template ? getMissionXp(template.difficulty, success) : 0;
              for (const adv of team) {
                if (!casualties.includes(adv.id)) {
                  const advInState = s.adventurers.find((a) => a.id === adv.id);
                  if (advInState) {
                    const equipStats = getEquipmentStats(advInState.equipment);
                    const stats = calcAdvStats(advInState, equipStats);
                    const wisBonus = 1 + stats.wis * 0.02; // +2% XP per WIS point
                    const xpGain = Math.floor(baseXp * wisBonus);
                    const result = applyXp(advInState, xpGain);
                    if (result.leveled) levelUps.push(advInState.name);
                    if (result.rankUp && advInState.rank !== result.oldRank) {
                      rankUps.push({ name: advInState.name, newRank: RANK_NAMES[advInState.rank] });
                    }
                  }
                }
              }

              // Free surviving adventurers and consume trinket potions
              for (const id of am.adventurerIds) {
                const adv = s.adventurers.find((a) => a.id === id);
                if (adv) {
                  adv.onMission = false;
                  // Consume consumable trinkets
                  if (adv.equipment.trinket) {
                    const trinketDef = getItem(adv.equipment.trinket);
                    if (trinketDef?.consumable) {
                      adv.equipment.trinket = null;
                    }
                  }
                }
              }

              // Rewards are NOT auto-granted — player claims them via the Guild page

              // Log events
              const missionName = template?.name ?? am.missionId;
              if (success) {
                const rewardStr = rewards.map((r) => `+${r.amount} ${r.resource}`).join(", ");
                pushEvent(s, "mission_success", "✅", `Mission "${missionName}" succeeded! ${rewardStr}`);
              } else {
                pushEvent(s, "mission_failed", "❌", `Mission "${missionName}" failed`);
              }
              for (const name of levelUps) {
                pushEvent(s, "adventurer_levelup", "⬆️", `${name} leveled up!`);
              }
              for (const ru of rankUps) {
                pushEvent(s, "adventurer_rankup", "🌟", `${ru.name} promoted to ${ru.newRank}!`);
              }
              for (const id of casualties) {
                const deadAdv = team.find((a) => a.id === id);
                if (deadAdv) pushEvent(s, "adventurer_died", "⚰️", `${deadAdv.name} fell on mission "${missionName}"`);
              }

              // Record result
              s.completedMissions.push({
                missionId: am.missionId,
                success,
                rewards,
                casualties,
                revived,
                xpGained: baseXp,
                levelUps,
                rankUps,
              });

              // Remove from active
              s.activeMissions.splice(i, 1);
            }
          }

          // Refresh recruits and missions daily at 3 AM UTC
          const now = Date.now();
          const today3am = new Date();
          today3am.setUTCHours(3, 0, 0, 0);
          if (today3am.getTime() > now) today3am.setUTCDate(today3am.getUTCDate() - 1);
          const lastRefresh = Math.max(s.lastMissionRefresh, s.lastRecruitRefresh);
          if (lastRefresh < today3am.getTime()) {
            // Recruits
            const count = getCandidateCount(guildLvl);
            const maxRank = getMaxRecruitRank(guildLvl, s.adventurers);
            resetAdventurerSeed(now + s.year * 1000);
            s.recruitCandidates = [];
            for (let i = 0; i < count; i++) {
              s.recruitCandidates.push(generateCandidate(nextId("adv"), maxRank));
            }
            s.lastRecruitRefresh = now;
            // Missions — cap difficulty at best adventurer's rank + 1
            const boardSize = getMissionBoardSize(guildLvl);
            const bestRank = s.adventurers.length > 0 ? Math.max(...s.adventurers.map((a) => a.rank)) : 1;
            const maxDiff = Math.min(5, bestRank + 1);
            s.missionBoard = generateMissionBoard(guildLvl, boardSize, now + s.year * 777, maxDiff);
            s.lastMissionRefresh = now;
          }
        }

        // Remove dead adventurers from roster
        s.adventurers = s.adventurers.filter((a) => a.alive);

        // ── Raid system tick ──
        const tier = getSettlementTier(getTownHallLevel(s.buildings));

        // Countdown incoming raids
        for (let i = s.incomingRaids.length - 1; i >= 0; i--) {
          const ir = s.incomingRaids[i];
          ir.remaining -= elapsedSeconds;
          if (ir.remaining <= 0) {
            // Raid arrives — resolve it
            const template = getRaid(ir.raidId);
            if (template) {
              const homeAdvs = s.adventurers.filter((a) => a.alive && !a.onMission);
              const defense = calcDefense(s.buildings, homeAdvs, s.population);
              const result = resolveRaid({
                raid: template,
                raidStrength: ir.strength,
                defense,
                resources: s.resources,
                population: s.population,
                homeAdventurers: homeAdvs,
              });

              // Log and damage buildings on defeat
              const raidName = template?.name ?? ir.raidId;
              if (result.victory) {
                const lootStr = result.loot.map((l) => `+${l.amount} ${l.resource}`).join(", ");
                pushEvent(s, "raid_victory", "🛡️", `Repelled ${raidName}! Loot: ${lootStr}`);
              } else {
                pushEvent(s, "raid_defeat", "💔", `Defeated by ${raidName}! Lost resources and citizens.`);
                const damageable = s.buildings.filter((b) => b.level > 0 && !b.damaged && b.buildingId !== "town_hall");
                const damageCount = Math.min(damageable.length, result.buildingsDamaged ?? 1);
                for (let d = 0; d < damageCount; d++) {
                  const idx = Math.floor(Math.random() * damageable.length);
                  damageable[idx].damaged = true;
                  const def = BUILDINGS.find((b) => b.id === (damageable[idx] as any).buildingId);
                  if (def) pushEvent(s, "building_damaged", "🔧", `${def.name} was damaged in the raid`);
                  damageable.splice(idx, 1);
                }
              }

              // Apply losses or grant loot
              if (result.victory) {
                const resCaps = calcStorageCaps(s.buildings);
                for (const loot of result.loot) {
                  if (loot.resource === "astralShards") {
                    s.astralShards += loot.amount;
                  } else {
                    const key = loot.resource as keyof ResourceState;
                    s.resources[key] = Math.min(resCaps[key], s.resources[key] + loot.amount);
                  }
                }
              } else {
                s.resources.gold = Math.max(0, s.resources.gold - result.resourcesLost.gold);
                s.resources.wood = Math.max(0, s.resources.wood - result.resourcesLost.wood);
                s.resources.stone = Math.max(0, s.resources.stone - result.resourcesLost.stone);
                s.resources.food = Math.max(0, s.resources.food - result.resourcesLost.food);
                s.population = Math.max(BASE_POPULATION, s.population - result.citizensLost);
              }

              s.raidLog.push(result);
              s.lastRaidOutcome = result.victory ? "victory" : "defeat";
              s.lastRaidTime = 0;
            }
            s.incomingRaids.splice(i, 1);
          }
        }

        // Spawn new raids (probability-based, checked each tick)
        s.hoursSinceLastRaid += elapsedHours;
        const raidChance = getRaidChance(tier, s.hoursSinceLastRaid);
        if (raidChance > 0 && Math.random() < raidChance * elapsedHours) {
          s.hoursSinceLastRaid = 0; // reset timer
          const spawn = spawnRaid(tier, s.year);
          if (spawn) {
            const wtLevel = s.buildings.find((b) => b.buildingId === "watchtower")?.level ?? 0;
            const warningHours = calcWarningTime(spawn.raid.baseWarning, wtLevel);
            s.incomingRaids.push({
              raidId: spawn.raid.id,
              remaining: warningHours * 3600,
              strength: spawn.strength,
              warned: true,
            });
            pushEvent(s, "raid_incoming", "⚠️", `${spawn.raid.name} approaching! (strength ${spawn.strength})`);
          }
        }

        // Reset daily rerolls at midnight (real-world time)
        const now = Date.now();
        const lastResetDay = new Date(s.lastRerollReset).toDateString();
        const todayStr = new Date(now).toDateString();
        if (lastResetDay !== todayStr) {
          s.missionRerollToday = false;
          s.recruitRerollToday = false;
          s.lastRerollReset = now;
        }

        s.lastTick = now;
      }),
    );
  }

  // Offline catch-up: in dev mode, run immediately.
  // In production, this runs after server state loads (see onMount above).
  if (IS_DEV) {
    const offlineMs = Date.now() - state.lastTick;
    if (offlineMs > 2000) applyTicks(offlineMs);
  }

  // In production, speed is always 1. In dev, player can adjust.
  const getSpeed = () => IS_DEV ? state.gameSpeed : 1;
  // Use real elapsed time since lastTick, not fixed interval — handles browser throttling
  const tickInterval = setInterval(() => {
    const now = Date.now();
    const elapsed = now - state.lastTick;
    if (elapsed > 500) applyTicks(elapsed * getSpeed());
  }, TICK_INTERVAL_MS);

  // Catch up when tab becomes visible again (browsers throttle background tabs)
  const handleVisibility = () => {
    if (!document.hidden) {
      const offlineMs = Date.now() - state.lastTick;
      if (offlineMs > 2000) applyTicks(offlineMs);
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);
  const localSaveInterval = IS_DEV
    ? setInterval(() => saveGameLocal(JSON.parse(JSON.stringify(state))), 5000)
    : null;
  const apiSaveInterval = setInterval(() => {
    if (_settlementId) {
      saveSettlementApi(_settlementId, JSON.parse(JSON.stringify(state))).catch(() => {});
    }
  }, 15000);

  // Save when tab becomes hidden (user switches away)
  const handleVisibilitySave = () => {
    if (document.hidden && _settlementId) {
      saveSettlementApi(_settlementId, JSON.parse(JSON.stringify(state))).catch(() => {});
    }
  };
  document.addEventListener("visibilitychange", handleVisibilitySave);

  onCleanup(() => {
    clearInterval(tickInterval);
    if (localSaveInterval) clearInterval(localSaveInterval);
    clearInterval(apiSaveInterval);
    document.removeEventListener("visibilitychange", handleVisibility);
    document.removeEventListener("visibilitychange", handleVisibilitySave);
    saveGame(JSON.parse(JSON.stringify(state)));
  });

  const actions: GameActions = {
    upgradeBuilding(buildingId) {
      const pb = state.buildings.find((b) => b.buildingId === buildingId);
      if (!pb || pb.upgrading) return false;
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def || !isBuildingUnlocked(def, getTownHallLevel(state.buildings))) return false;

      // Check tier-gated level cap
      const tier = getSettlementTier(getTownHallLevel(state.buildings));
      const effectiveMax = getEffectiveMaxLevel(def, tier);
      if (pb.level >= effectiveMax) return false;

      const levelDef = def.levels[pb.level];
      if (!levelDef) return false;

      // Check queue slots
      const masonLvl = state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
      const bonuses = getMasonBonuses(masonLvl);
      const activeBuilds = state.buildings.filter((b) => b.upgrading).length;
      if (activeBuilds >= bonuses.queueSlots) return false;

      // Apply Mason's Guild cost/time reduction (not on the guild itself)
      const effectiveMasonLvl = buildingId === "masons_guild" ? 0 : masonLvl;
      const adjustedCost = applyMasonCostReduction(levelDef.cost, effectiveMasonLvl);
      const adjustedTime = applyMasonTimeReduction(levelDef.buildTime, effectiveMasonLvl);

      if (state.resources.wood < adjustedCost.wood || state.resources.stone < adjustedCost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= adjustedCost.wood;
        s.resources.stone -= adjustedCost.stone;
        const b = s.buildings.find((b) => b.buildingId === buildingId)!;
        b.upgrading = true;
        b.upgradeRemaining = adjustedTime;
      }));
      return true;
    },

    buildField() {
      if (state.fields.length >= MAX_FIELDS) return false;
      const cost = getFieldCost(0);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      const id = nextId("field");
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.fields.push({ id, crop: null, level: 0, upgrading: true, upgradeRemaining: getFieldBuildTime(0), harvested: false, harvestsBeforeFallow: 2, fallow: false });
      }));
      return true;
    },

    plantField(fieldId, crop) {
      if (state.season !== "spring") return false;
      const field = state.fields.find((f) => f.id === fieldId);
      if (!field || field.upgrading || field.level === 0) return false;
      if (field.crop !== null) return false; // already planted
      if (field.fallow) return false; // resting this year
      setState(produce((s) => {
        const f = s.fields.find((f) => f.id === fieldId)!;
        f.crop = crop;
        f.harvested = false;
      }));
      return true;
    },

    upgradeField(fieldId) {
      const field = state.fields.find((f) => f.id === fieldId);
      if (!field || field.upgrading || field.level >= FIELD_MAX_LEVEL) return false;
      // Can only upgrade empty or fallow fields (not planted ones)
      if (field.crop !== null) return false;
      const cost = getFieldCost(field.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const f = s.fields.find((f) => f.id === fieldId)!;
        f.upgrading = true;
        f.upgradeRemaining = getFieldBuildTime(field.level);
      }));
      return true;
    },

    removeField(fieldId) {
      setState(produce((s) => {
        const idx = s.fields.findIndex((f) => f.id === fieldId);
        if (idx !== -1) s.fields.splice(idx, 1);
      }));
    },

    buildGarden(veggie) {
      if (state.gardens.length >= MAX_GARDENS) return false;
      const cost = getGardenCost(0);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      const id = nextId("garden");
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.gardens.push({ id, veggie, level: 0, upgrading: true, upgradeRemaining: getGardenBuildTime(0) });
      }));
      return true;
    },

    upgradeGarden(gardenId) {
      const garden = state.gardens.find((g) => g.id === gardenId);
      if (!garden || garden.upgrading || garden.level >= GARDEN_MAX_LEVEL) return false;
      const cost = getGardenCost(garden.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const g = s.gardens.find((g) => g.id === gardenId)!;
        g.upgrading = true;
        g.upgradeRemaining = getGardenBuildTime(garden.level);
      }));
      return true;
    },

    removeGarden(gardenId) {
      setState(produce((s) => {
        const idx = s.gardens.findIndex((g) => g.id === gardenId);
        if (idx !== -1) s.gardens.splice(idx, 1);
      }));
    },

    buildPen(animal) {
      if (state.pens.length >= MAX_PENS) return false;
      const cost = getPenCost(0);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone || state.resources.gold < cost.gold) return false;
      const id = nextId("pen");
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.resources.gold -= cost.gold;
        s.pens.push({ id, animal, level: 0, upgrading: true, upgradeRemaining: getPenBuildTime(0) });
      }));
      return true;
    },

    upgradePen(penId) {
      const pen = state.pens.find((p) => p.id === penId);
      if (!pen || pen.upgrading || pen.level >= PEN_MAX_LEVEL) return false;
      const cost = getPenCost(pen.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone || state.resources.gold < cost.gold) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.resources.gold -= cost.gold;
        const p = s.pens.find((p) => p.id === penId)!;
        p.upgrading = true;
        p.upgradeRemaining = getPenBuildTime(pen.level);
      }));
      return true;
    },

    removePen(penId) {
      setState(produce((s) => {
        const idx = s.pens.findIndex((p) => p.id === penId);
        if (idx !== -1) s.pens.splice(idx, 1);
      }));
    },

    setGameSpeed(speed) { setState("gameSpeed", speed); },
    renameVillage(name) {
      const trimmed = name.trim();
      if (trimmed.length > 0 && trimmed.length <= 30) {
        setState("villageName", trimmed);
      }
    },

    resetGame() {
      idCounter = 1;
      const fresh = createInitialState();
      setState(reconcile(fresh));
      saveGame(fresh);
    },

    skipSeason() { setState(produce((s) => { advanceSeason(s); })); },

    getProductionRates() { return calcProductionRates(state); },
    getMaxPopulation() { return calcMaxPopulation(state.buildings); },
    getFoodConsumption() { return calcFoodConsumption(state.population); },
    getAnimalFoodConsumption() { return calcAnimalFoodConsumption(state.pens); },
    getFoodBreakdown() { return calcFoodBreakdown(state); },
    getStorageCaps() { return calcStorageCaps(state.buildings); },
    getSettlementTier() { return getSettlementTier(getTownHallLevel(state.buildings)); },
    getTownHallLevel() { return getTownHallLevel(state.buildings); },
    canAfford(cost) { return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone; },
    getBuildingEffect(buildingId, nextLevel) { return calcBuildingEffect(buildingId, nextLevel); },
    isHarvesting() { return isHarvestTime(state.season, state.seasonElapsed); },
    getMasonLevel() {
      return state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
    },
    getMasonBonuses() {
      return getMasonBonuses(this.getMasonLevel());
    },
    getActiveQueueCount() {
      return state.buildings.filter((b) => b.upgrading).length;
    },
    getEffectiveMaxLevel(buildingId) {
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def) return 0;
      const tier = getSettlementTier(getTownHallLevel(state.buildings));
      return getEffectiveMaxLevel(def, tier);
    },
    getGuildLevel() {
      return state.buildings.find((b) => b.buildingId === "adventurers_guild")?.level ?? 0;
    },
    recruitAdventurer(candidateId) {
      const guildLvl = this.getGuildLevel();
      if (guildLvl === 0) return false;
      const candidate = state.recruitCandidates.find((c) => c.id === candidateId);
      if (!candidate) return false;
      const maxRoster = getMaxRoster(guildLvl);
      if (state.adventurers.length >= maxRoster) return false;
      const cost = getRecruitCost(candidate.rank);
      if (state.resources.gold < cost) return false;
      setState(produce((s) => {
        s.resources.gold -= cost;
        s.adventurers.push({ ...candidate, alive: true, onMission: false });
        s.recruitCandidates = s.recruitCandidates.filter((c) => c.id !== candidateId);
      }));
      return true;
    },
    dismissAdventurer(adventurerId) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      setState(produce((s) => {
        s.adventurers = s.adventurers.filter((a) => a.id !== adventurerId);
      }));
      return true;
    },
    deployMission(missionId, adventurerIds, supplies = []) {
      const guildLvl = this.getGuildLevel();
      if (guildLvl === 0) return false;
      const maxSlots = getMissionSlots(guildLvl);
      if (state.activeMissions.length >= maxSlots) return false;

      const template = getMission(missionId);
      if (!template || template.minGuildLevel > guildLvl) return false;
      if (adventurerIds.length === 0 || adventurerIds.length > template.slots.length) return false;

      // Check adventurers are available
      const team: Adventurer[] = [];
      for (const id of adventurerIds) {
        const adv = state.adventurers.find((a) => a.id === id && a.alive && !a.onMission);
        if (!adv) return false;
        team.push(adv);
      }

      // Check deploy cost
      if (state.resources.gold < template.deployCost) return false;

      let successChance = calcSuccessChance(template, team);
      let effectiveDuration = calcEffectiveDuration(template, team);

      // Apply supply bonuses
      for (const supplyId of supplies) {
        const effect = getSupplyEffect(supplyId);
        if (effect) successChance = Math.min(100, successChance + effect.successBonus);
      }

      // Apply equipment duration/loot mods
      for (const adv of team) {
        for (const slot of ["weapon", "armor", "trinket"] as const) {
          const itemId = adv.equipment[slot];
          if (itemId) {
            const itemDef = getItem(itemId);
            if (itemDef) {
              effectiveDuration = Math.floor(effectiveDuration * itemDef.durationMod);
            }
          }
        }
      }

      setState(produce((s) => {
        s.resources.gold -= template.deployCost;
        // Mark adventurers as on mission
        for (const id of adventurerIds) {
          const adv = s.adventurers.find((a) => a.id === id);
          if (adv) adv.onMission = true;
        }
        // Consume supply potions from inventory
        for (const supplyId of supplies) {
          const inv = s.inventory.find((i) => i.itemId === supplyId);
          if (inv && inv.quantity > 0) inv.quantity -= 1;
        }
        s.activeMissions.push({
          missionId: template.id,
          adventurerIds: [...adventurerIds],
          remaining: effectiveDuration,
          successChance,
        });
        // Remove from mission board so it can't be repeated
        s.missionBoard = s.missionBoard.filter((m) => m.id !== template.id);
        s.firstMissionSent = true;
      }));
      // Save immediately so mission isn't lost if tab closes
      if (_settlementId) saveSettlementApi(_settlementId, JSON.parse(JSON.stringify(state))).catch(() => {});
      return true;
    },
    collectCompletedMissions() {
      const completed = [...state.completedMissions];
      if (completed.length > 0) {
        setState(produce((s) => { s.completedMissions = []; }));
      }
      return completed;
    },
    getAvailableAdventurers() {
      return state.adventurers.filter((a) => a.alive && !a.onMission);
    },
    getRosterSize() {
      const guildLvl = this.getGuildLevel();
      return { current: state.adventurers.length, max: getMaxRoster(guildLvl) };
    },
    getMissionSlotInfo() {
      const guildLvl = this.getGuildLevel();
      return { used: state.activeMissions.length, max: getMissionSlots(guildLvl) };
    },
    getAleInfo() {
      const breweryLvl = state.buildings.find((b) => b.buildingId === "brewery")?.level ?? 0;
      const tavernLvl = state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
      return {
        current: Math.floor(state.ale),
        cap: ALE_STORAGE_BASE + breweryLvl * ALE_STORAGE_PER_BREWERY_LEVEL,
        production: breweryLvl * ALE_PRODUCTION_PER_BREWERY_LEVEL,
        consumption: tavernLvl * ALE_CONSUMED_PER_TAVERN_LEVEL,
      };
    },
    startCraft(recipeId) {
      const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
      if (!recipe) return false;
      const building = state.buildings.find((b) => b.buildingId === recipe.building);
      if (!building || building.level < recipe.minLevel || building.damaged) return false;
      // Check max crafting slots (1 per building level)
      const activeCrafts = state.craftingQueue.filter((c) => {
        const r = CRAFTING_RECIPES.find((cr) => cr.id === c.recipeId);
        return r?.building === recipe.building;
      }).length;
      if (activeCrafts >= building.level) return false;
      // Check costs
      for (const cost of recipe.costs) {
        const res = cost.resource;
        if (res === "wool" && state.wool < cost.amount) return false;
        if (res === "fiber" && state.fiber < cost.amount) return false;
        if (res === "iron" && state.iron < cost.amount) return false;
        if (res === "gold" && state.resources.gold < cost.amount) return false;
        if (res === "wood" && state.resources.wood < cost.amount) return false;
        if (res === "stone" && state.resources.stone < cost.amount) return false;
        if (res === "food" && state.resources.food < cost.amount) return false;
        if (res === "astralShards" && state.astralShards < cost.amount) return false;
      }
      setState(produce((s) => {
        for (const cost of recipe.costs) {
          if (cost.resource === "wool") s.wool -= cost.amount;
          else if (cost.resource === "fiber") s.fiber -= cost.amount;
          else if (cost.resource === "iron") s.iron -= cost.amount;
          else if (cost.resource === "gold") s.resources.gold -= cost.amount;
          else if (cost.resource === "wood") s.resources.wood -= cost.amount;
          else if (cost.resource === "stone") s.resources.stone -= cost.amount;
          else if (cost.resource === "food") s.resources.food -= cost.amount;
          else if (cost.resource === "astralShards") s.astralShards -= cost.amount;
        }
        s.craftingQueue.push({ recipeId, remaining: recipe.craftTime });
      }));
      // Save immediately so craft isn't lost if tab closes
      if (_settlementId) saveSettlementApi(_settlementId, JSON.parse(JSON.stringify(state))).catch(() => {});
      return true;
    },
    getAvailableRecipes() {
      return CRAFTING_RECIPES.filter((r) => {
        const building = state.buildings.find((b) => b.buildingId === r.building);
        return building && building.level >= r.minLevel;
      });
    },
    getClothingInfo() {
      return {
        current: Math.floor(state.clothing),
        needed: Math.ceil(state.population / CLOTHING_PER_CITIZENS),
      };
    },
    allocateStat(adventurerId, stat) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv) return false;
      if (getUnspentStatPoints(adv) <= 0) return false;
      if (!STAT_KEYS.includes(stat)) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((a) => a.id === adventurerId)!;
        a.bonusStats[stat] = (a.bonusStats[stat] ?? 0) + 1;
      }));
      return true;
    },
    equipItem(adventurerId, itemId) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      const itemDef = getItem(itemId);
      if (!itemDef) return false;
      // Class restriction check
      if (itemDef.classes.length > 0 && !itemDef.classes.includes(adv.class)) return false;
      const inv = state.inventory.find((i) => i.itemId === itemId);
      if (!inv || inv.quantity <= 0) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((a) => a.id === adventurerId)!;
        // Unequip current item in that slot first (return to inventory)
        const currentItemId = a.equipment[itemDef.slot];
        if (currentItemId) {
          const curInv = s.inventory.find((i) => i.itemId === currentItemId);
          if (curInv) curInv.quantity += 1;
          else s.inventory.push({ itemId: currentItemId, quantity: 1 });
        }
        // Equip new item
        a.equipment[itemDef.slot] = itemId;
        const newInv = s.inventory.find((i) => i.itemId === itemId)!;
        newInv.quantity -= 1;
      }));
      return true;
    },
    unequipItem(adventurerId, slot) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      const currentItemId = adv.equipment[slot];
      if (!currentItemId) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((a) => a.id === adventurerId)!;
        a.equipment[slot] = null;
        const inv = s.inventory.find((i) => i.itemId === currentItemId);
        if (inv) inv.quantity += 1;
        else s.inventory.push({ itemId: currentItemId, quantity: 1 });
      }));
      return true;
    },
    getInventoryCount(itemId) {
      return state.inventory.find((i) => i.itemId === itemId)?.quantity ?? 0;
    },
    getHappinessModifier() {
      const h = state.happiness;
      return h >= 80 ? 1 + (h - 80) / 100 : h >= 50 ? 1.0 : 0.6 + (h / 50) * 0.4;
    },
    getHappinessBreakdown() {
      const factors: { label: string; value: number }[] = [];
      factors.push({ label: "Baseline", value: 50 });

      const rates = calcProductionRates(state);
      const foodCons = calcFoodConsumption(state.population);
      const animalFood = calcAnimalFoodConsumption(state.pens);
      const netFood = rates.food - foodCons - animalFood;
      if (netFood > 0) factors.push({ label: "Food surplus", value: Math.min(15, Math.round(netFood / 5)) });
      else if (netFood < 0) factors.push({ label: "Food deficit", value: -Math.min(30, Math.round(Math.abs(netFood) / 3)) });
      if (state.resources.food <= 0) factors.push({ label: "Starvation", value: -20 });

      const maxPop = calcMaxPopulation(state.buildings);
      if (state.population > maxPop) factors.push({ label: "Overcrowded", value: -15 });
      else if (state.population > maxPop * 0.9) factors.push({ label: "Housing tight", value: -5 });

      const shrineLvl = state.buildings.find((b) => b.buildingId === "shrine")?.level ?? 0;
      if (shrineLvl > 0) factors.push({ label: `Shrine Lv.${shrineLvl}`, value: shrineLvl * SHRINE_HAPPINESS_PER_LEVEL });

      const tavernLvl = state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
      if (tavernLvl > 0) {
        const hasAle = state.ale > 0;
        factors.push({ label: `Tavern Lv.${tavernLvl}${hasAle ? "" : " (dry)"}`, value: tavernLvl * (hasAle ? TAVERN_HAPPINESS_PER_LEVEL : TAVERN_HAPPINESS_DRY) });
      }

      // Clothing
      const clothNeeded = Math.ceil(state.population / CLOTHING_PER_CITIZENS);
      if (clothNeeded > 0) {
        if (state.clothing >= clothNeeded) factors.push({ label: `Well-clothed (${Math.floor(state.clothing)}/${clothNeeded})`, value: CLOTHING_HAPPINESS_BONUS });
        else if (state.clothing < clothNeeded * 0.5) factors.push({ label: `Poorly clothed (${Math.floor(state.clothing)}/${clothNeeded})`, value: CLOTHING_HAPPINESS_PENALTY });
      }

      // Food diversity
      const foodSources = new Set<string>();
      for (const pb of state.buildings) {
        if (pb.level === 0 || pb.damaged) continue;
        const def = BUILDINGS.find((b) => b.id === pb.buildingId);
        if (def) {
          const lvlDef = def.levels[pb.level - 1];
          if (lvlDef?.production?.foodType) foodSources.add(lvlDef.production.foodType);
        }
      }
      for (const garden of state.gardens) { if (garden.level > 0) foodSources.add("veggies"); }
      for (const pen of state.pens) {
        if (pen.level > 0) { const animal = getAnimal(pen.animal); foodSources.add(animal.foodLabel.toLowerCase()); }
      }
      const ft = foodSources.size;
      if (ft <= 1) factors.push({ label: `Monotonous diet (${ft} type)`, value: -5 });
      else if (ft === 3) factors.push({ label: `Good diet (${ft} types)`, value: 3 });
      else if (ft === 4) factors.push({ label: `Varied diet (${ft} types)`, value: 6 });
      else if (ft >= 5) factors.push({ label: `Diverse feast (${ft} types)`, value: 10 });

      const damagedCount = state.buildings.filter((b) => b.damaged).length;
      if (damagedCount > 0) factors.push({ label: `${damagedCount} damaged building${damagedCount > 1 ? "s" : ""}`, value: -damagedCount * 3 });

      if (state.lastRaidOutcome !== "none") {
        const decay = Math.max(0, 1 - state.lastRaidTime / 48);
        if (decay > 0) {
          const val = state.lastRaidOutcome === "victory" ? Math.round(10 * decay) : -Math.round(15 * decay);
          if (val !== 0) factors.push({ label: `Raid ${state.lastRaidOutcome} morale (fading)`, value: val });
        }
      }

      if (state.season === "winter") {
        factors.push({ label: "Winter cold", value: WINTER_HAPPINESS_PENALTY });
        if (state.resources.wood <= 0) factors.push({ label: "No wood (freezing)", value: WINTER_NO_WOOD_HAPPINESS });
      }

      return factors;
    },
    repairBuilding(buildingId) {
      const pb = state.buildings.find((b) => b.buildingId === buildingId);
      if (!pb || !pb.damaged) return false;
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def) return false;
      const cost = getRepairCost(def, pb.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const b = s.buildings.find((b) => b.buildingId === buildingId)!;
        b.damaged = false;
        pushEvent(s, "building_repaired", "🔨", `${def.name} repaired`);
      }));
      return true;
    },
    getDefense() {
      const homeAdvs = state.adventurers.filter((a) => a.alive && !a.onMission);
      return calcDefense(state.buildings, homeAdvs, state.population);
    },
    collectRaidLog() {
      const log = [...state.raidLog];
      if (log.length > 0) {
        setState(produce((s) => { s.raidLog = []; }));
      }
      return log;
    },
    recallAdventurers() {
      const missions = state.activeMissions;
      if (missions.length === 0) return { recalled: 0, instant: false };

      let hasWizard = false;
      let recalledCount = 0;

      setState(produce((s) => {
        for (const mission of s.activeMissions) {
          // Check if any party has a wizard (for partial loot save)
          const team = mission.adventurerIds.map((id) => s.adventurers.find((a) => a.id === id)).filter(Boolean);
          if (team.some((a) => a!.class === "wizard")) hasWizard = true;

          // Free all adventurers
          for (const id of mission.adventurerIds) {
            const adv = s.adventurers.find((a) => a.id === id);
            if (adv) {
              adv.onMission = false;
              recalledCount++;
            }
          }

          // Wizard saves 30% of mission loot on recall
          if (hasWizard) {
            const template = getMission(mission.missionId);
            if (template) {
              const caps = calcStorageCaps(s.buildings);
              for (const reward of template.rewards) {
                if (reward.resource === "astralShards") {
                  s.astralShards += Math.floor(reward.amount * 0.3);
                } else {
                  const key = reward.resource as keyof ResourceState;
                  s.resources[key] = Math.min(caps[key], s.resources[key] + Math.floor(reward.amount * 0.3));
                }
              }
            }
          }
        }
        // Cancel all missions
        s.activeMissions = [];
      }));

      return { recalled: recalledCount, instant: hasWizard };
    },
    triggerRaid() {
      const tier = getSettlementTier(getTownHallLevel(state.buildings));
      const spawn = spawnRaid(tier, state.year);
      if (!spawn) return false;
      setState(produce((s) => {
        s.incomingRaids.push({
          raidId: spawn.raid.id,
          remaining: 60, // 1 minute warning for testing
          strength: spawn.strength,
          warned: true,
        });
      }));
      return true;
    },
    visitGuild() {
      setState("lastGuildVisit", Date.now());
    },
    hasNewGuildContent() {
      return (state.lastMissionRefresh > state.lastGuildVisit && state.missionBoard.length > 0) ||
             (state.lastRecruitRefresh > state.lastGuildVisit && state.recruitCandidates.length > 0);
    },
    canClaimDailyLogin() {
      if (state.lastDailyLogin === 0) return true;
      const lastDay = new Date(state.lastDailyLogin).toDateString();
      const today = new Date().toDateString();
      return lastDay !== today;
    },
    claimDailyLogin() {
      if (!this.canClaimDailyLogin()) return false;
      setState(produce((s) => {
        s.astralShards += 10;
        s.lastDailyLogin = Date.now();
      }));
      return true;
    },
    rerollMissions() {
      if (state.missionRerollToday || state.astralShards < 10) return false;
      const guildLvl = this.getGuildLevel();
      if (guildLvl === 0) return false;
      setState(produce((s) => {
        s.astralShards -= 10;
        s.missionRerollToday = true;
        const boardSize = getMissionBoardSize(guildLvl);
        const bestRank = s.adventurers.length > 0 ? Math.max(...s.adventurers.map((a) => a.rank)) : 1;
        const maxDiff = Math.min(5, bestRank + 1);
        s.missionBoard = generateMissionBoard(guildLvl, boardSize, Date.now(), maxDiff);
      }));
      return true;
    },
    rerollRecruits() {
      if (state.recruitRerollToday || state.astralShards < 10) return false;
      const guildLvl = this.getGuildLevel();
      if (guildLvl === 0) return false;
      setState(produce((s) => {
        s.astralShards -= 10;
        s.recruitRerollToday = true;
        const count = getCandidateCount(guildLvl);
        const maxRank = getMaxRecruitRank(guildLvl, s.adventurers);
        resetAdventurerSeed(Date.now());
        s.recruitCandidates = [];
        for (let i = 0; i < count; i++) {
          s.recruitCandidates.push(generateCandidate(nextId("adv"), maxRank));
        }
      }));
      return true;
    },
    grantResources(amount) {
      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);
        s.resources.gold = Math.min(caps.gold, s.resources.gold + amount);
        s.resources.wood = Math.min(caps.wood, s.resources.wood + amount);
        s.resources.stone = Math.min(caps.stone, s.resources.stone + amount);
        s.resources.food = Math.min(caps.food, s.resources.food + amount);
      }));
    },
    cancelBuild(buildingId) {
      const pb = state.buildings.find((b) => b.buildingId === buildingId);
      if (!pb || !pb.upgrading) return false;
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def) return false;
      const levelDef = def.levels[pb.level];
      if (!levelDef) return false;
      // Refund adjusted cost
      const masonLvl = buildingId === "masons_guild" ? 0 :
        (state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0);
      const adjustedCost = applyMasonCostReduction(levelDef.cost, masonLvl);
      setState(produce((s) => {
        const b = s.buildings.find((b) => b.buildingId === buildingId)!;
        b.upgrading = false;
        b.upgradeRemaining = undefined;
        s.resources.wood += adjustedCost.wood;
        s.resources.stone += adjustedCost.stone;
      }));
      return true;
    },
    claimQuestReward(questId) {
      const questIdx = QUEST_CHAIN.findIndex((q) => q.id === questId);
      if (questIdx < 0) return false;
      const quest = QUEST_CHAIN[questIdx];
      if (state.questRewardsClaimed.includes(questId)) return false;
      if (questIdx > 0 && !state.questRewardsClaimed.includes(QUEST_CHAIN[questIdx - 1].id)) return false;
      if (!quest.condition(state)) return false;
      setState(produce((s) => {
        s.questRewardsClaimed.push(questId);
        const caps = calcStorageCaps(s.buildings);
        for (const reward of quest.rewards) {
          if (reward.resource === "astralShards") {
            s.astralShards += reward.amount;
          } else {
            const key = reward.resource as keyof typeof s.resources;
            s.resources[key] = Math.min(caps[key], s.resources[key] + reward.amount);
          }
        }
      }));
      return true;
    },
    claimMissionReward(index) {
      const mission = state.completedMissions[index];
      if (!mission) return;
      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);
        for (const reward of mission.rewards) {
          if (reward.resource === "astralShards") {
            s.astralShards += reward.amount;
          } else {
            const key = reward.resource as keyof typeof s.resources;
            s.resources[key] = Math.min(caps[key], s.resources[key] + reward.amount);
          }
        }
        s.completedMissions.splice(index, 1);
      }));
    },
    trade(give, giveAmount, receive, receiveAmount) {
      if (state.resources[give] < giveAmount) return false;
      const marketLevel = state.buildings.find((b) => b.buildingId === "marketplace")?.level ?? 0;
      if (marketLevel === 0) return false;
      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);
        s.resources[give] -= giveAmount;
        s.resources[receive] = Math.min(caps[receive], s.resources[receive] + receiveAmount);
      }));
      return true;
    },
  };

  return (
    <Show when={loaded()} fallback={
      <div style={{
        display: "flex", "align-items": "center", "justify-content": "center",
        height: "100vh", color: "var(--text-secondary)", "font-family": "var(--font-heading)",
        "font-size": "1.4rem", background: "var(--bg-primary)",
      }}>
        Loading your settlement...
      </div>
    }>
      <GameContext.Provider value={{ state, actions }}>
        {props.children}
      </GameContext.Provider>
    </Show>
  );
}
