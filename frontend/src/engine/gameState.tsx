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
  getTierPrerequisitesMet,
} from "~/data/buildings";
import {
  type CropId,
  getCrop,
  getFieldCost,
  getFieldBuildTime,
  getSeasonYield,
  getSoilMultiplier,
  MAX_FIELDS,
  FIELD_MAX_LEVEL,
} from "~/data/crops";
import {
  type VeggieId,
  VEGGIES,
  getVeggie,
  getGardenCost,
  getGardenBuildTime,
  getGardenRate,
  getSeedCost,
  canPlantVeggie,
  isVeggieProducing,
  MAX_GARDENS,
  GARDEN_MAX_LEVEL,
} from "~/data/gardens";
import {
  type AnimalId,
  ANIMALS,
  getAnimal,
  getPenCost,
  getPenBuildTime,
  getPenProduction,
  PEN_MAX_LEVEL,
} from "@medieval-realm/shared/data/livestock";
import {
  type FoodItemType,
  emptyFoods,
  getTotalFood,
  consumeFood,
  addFood,
  migrateFoodsFromLegacy,
  isFoodItemType,
  getFoodCostAmount,
  consumeFoodCost,
} from "~/data/foods";
import {
  ANIMAL_FEED,
  GRAZING_PER_FIELD,
  isGrazer,
  consumeFromCategories,
} from "~/data/animalFeed";
import {
  getHiveCost,
  getHiveBuildTime,
  getHoneyRate,
  getHoneyStorageCap,
  MAX_HIVES,
  HIVE_MAX_LEVEL,
} from "~/data/apiary";
import {
  type FruitId,
  FRUITS,
  getFruit,
  getOrchardCost,
  getOrchardBuildTime,
  getOrchardRate,
  isOrchardActive,
  ORCHARD_MAX_LEVEL,
} from "~/data/orchards";
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
  type Race,
  generateCandidate,
  getRecruitCost,
  getMaxRecruitRank,
  getCandidateCount,
  getMaxRoster,
  RECRUIT_REFRESH_HOURS,
  MISSION_REFRESH_HOURS,
  RACE_WEIGHTS,
  ORIGINS,
  getOriginsForRace,
  getOrigin,
  BACKSTORY_TRAITS,
  PERSONALITY_QUIRKS,
} from "@medieval-realm/shared/data/adventurers";
import { PREMADE_CHARACTERS } from "@medieval-realm/shared/data/premade-characters";
import {
  type ActiveMission,
  type CompletedMission,
  type MissionReward,
  type MissionTemplate,
  getMission,
  generateMissionBoard,
  MISSION_POOL,
  NOVICE_MISSIONS,
  getMissionBoardSize,
  calcSuccessChance,
  calcDeathChance,
  calcEffectiveDuration,
  calcAssassinBonusRewards,
  calcAssassinFailRewards,
  PRIEST_REVIVE_CHANCE,
  formatReward,
  STORY_MISSIONS,
  isExpedition,
} from "@medieval-realm/shared/data/missions";
import {
  getMissionXp,
  applyXp,
  RANK_NAMES,
} from "@medieval-realm/shared/data/adventurers";
import {
  type InventoryItem,
  type ItemSlot,
  getItem,
  getItemByRecipe,
  getEquipmentStats,
  ITEMS,
  getSupplyEffect,
  MATCHED_FOOD_LOYALTY_BONUS,
  getArmorAccess,
} from "@medieval-realm/shared/data/items";
import {
  calcStats as calcAdvStats,
  getUnspentStatPoints,
  type AdventurerStats,
  STAT_KEYS,
  getLoyaltyRank,
  LOYALTY_RANKS,
  FOOD_PREFERENCES,
  type AgeCategory,
  ORIGIN_RECIPES,
} from "@medieval-realm/shared/data/adventurers";
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
import { HERBS } from "@medieval-realm/shared/data/herbs";
import { ALCHEMY_RECIPES, getDiscoverableRecipes, getAvailableAlchemyRecipes, RESEARCH_BASE_COST } from "@medieval-realm/shared/data/alchemy_recipes";
import { getDeity, getCurrentDeity } from "~/data/deities";
import { simulateCombat } from "@medieval-realm/shared/data/combat";
import { canUnlockTalent } from "~/data/talents";
import { getEnchantment } from "~/data/enchantments";
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
  | "mission_success" | "mission_failed" | "adventurer_died" | "adventurer_levelup" | "adventurer_rankup" | "loyalty_rankup"
  | "raid_victory" | "raid_defeat" | "raid_incoming"
  | "winter_freezing"
  | "loot_drop"
  | "trade_accepted" | "trade_delivered"
  | "pen_starving";

export interface GameEvent {
  type: GameEventType;
  message: string;
  icon: string;
  timestamp: number; // game tick when it happened
}

import { type CraftingRecipe, type ActiveCraft, CRAFTING_RECIPES, getBuildingToolByRecipe, getBuildingTool, getRequiredTool, type BuildingToolDef } from "./crafting";
import {
  calcAdventurerMaxHp,
  resolveEventSlot,
  resolveExpeditionEvent,
  applyBetweenEventHeal,
  applyRecoveryItems,
  isTeamWiped,
} from "@medieval-realm/shared/data/expeditionEngine";
export type { CraftingRecipe, ActiveCraft, BuildingToolDef };
export { CRAFTING_RECIPES, getBuildingTool, getBuildingToolByRecipe, getRequiredTool };
export { getBuildingToolsForBuilding, BUILDING_TOOLS } from "./crafting";

export interface ResourceState {
  gold: number;
  wood: number;
  stone: number;
}

export interface StorageCaps {
  gold: number;
  wood: number;
  stone: number;
  food: number;
}

export interface PlayerField {
  id: string;
  crop: CropId | null;          // currently-growing crop; null = empty
  harvested: boolean;           // already harvested this year, wait for spring
  lastCrop: CropId | null;      // last crop planted — drives rotation tracking
  sameCropStreak: number;       // consecutive same-crop years (0 = fresh/rotated)
  restBonus: boolean;           // +15% yield next harvest (field was idle a year)
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

export interface PlayerGarden {
  id: string;
  veggie: VeggieId;
  level: number;          // 0 = unbuilt
  upgrading: boolean;
  upgradeRemaining?: number;
  plantedYear: number | null; // null = needs replanting; else the year we sowed
}

export interface PlayerPen {
  id: string;
  animal: AnimalId;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
  /** True when the pen didn't cover its food need last tick. Production = 0 while starving. */
  starving?: boolean;
}

export interface PlayerHive {
  id: string;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

export interface PlayerOrchard {
  id: string;
  fruit: FruitId;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
  seasonsGrown: number;
  mature: boolean;
}

export interface GameState {
  resources: ResourceState;
  buildings: PlayerBuilding[];
  fields: PlayerField[];
  gardens: PlayerGarden[];
  pens: PlayerPen[];
  hives: PlayerHive[];
  orchards: PlayerOrchard[];
  honey: number;
  /** Per-type food stockpiles — total capped by pantry */
  foods: Record<FoodItemType, number>;
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
  leather: number;
  clothing: number;
  iron: number;
  tools: number;
  weapons: number;
  armor: number;
  potions: number;
  gems: number;
  ironMinedTotal: number; // tracks total iron for gem proc
  // Herbs
  herbs: Record<string, number>; // { chamomile: 5, mugwort: 3, ... }
  foragedTotal: number; // tracks total food foraged for herb procs
  // Alchemy research
  discoveredRecipes: string[]; // recipe IDs discovered through research
  alchemyResearchAvailable: boolean; // resets daily
  // Shrine blessing
  activeBlessing: { deityId: string; effect: string } | null;
  // Marketplace
  lastTradeAt: number; // timestamp of last trade
  inventory: InventoryItem[];
  craftingQueue: ActiveCraft[];
  /** Building tool slots: buildingId → installed tool IDs */
  buildingTools: Record<string, string[]>;
  /** Enemy IDs the player has encountered on missions */
  discoveredEnemies: string[];
  // Event log
  eventLog: GameEvent[];
  // Ale & Happiness
  ale: number;
  happiness: number; // 0-100
  lastRaidOutcome: "none" | "victory" | "defeat";
  lastRaidTime: number; // game-hours elapsed since last raid outcome
  starvationPenalty: number; // 0-75, decays over 24h after food is restored
  // Raids
  incomingRaids: IncomingRaid[];
  raidLog: RaidResult[]; // recent results (cleared on read)
  hoursSinceLastRaid: number; // game-hours until next raid spawns
  // Astral Shards (premium currency)
  astralShards: number;
  lastDailyLogin: number; // real-world timestamp of last daily reward claim
  missionRerollToday: boolean | number;
  recruitRerollToday: boolean | number;
  lastRerollReset: number; // real-world timestamp of last reroll reset (daily)
  lastGuildVisit: number; // timestamp of last guild page visit
  lastMissionRefresh: number; // timestamp when missions last refreshed
  lastRecruitRefresh: number; // timestamp when recruits last refreshed
  // Quest system
  questRewardsClaimed: string[];
  firstMissionSent: boolean;
  introSeen: boolean;
  // Story missions
  completedStoryMissions: string[];
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
  upgradeGarden: (gardenId: string) => boolean;
  /** Pay seed gold to sow the garden for this cycle. Only valid during the veggie's plantSeasons. */
  plantGarden: (gardenId: string) => boolean;
  upgradePen: (penId: string) => boolean;
  upgradeHive: (hiveId: string) => boolean;
  upgradeOrchard: (orchardId: string) => boolean;
  setGameSpeed: (speed: number) => void;
  renameVillage: (name: string) => void;
  resetGame: () => void;
  markIntroSeen: () => void;
  skipSeason: () => void;
  getProductionRates: () => { gold: number; wood: number; stone: number; food: number };
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
  deployMission: (missionId: string, adventurerIds: string[], adventurerSupplies?: Record<string, { potion?: string; food?: string; recovery?: string }>, precomputedSuccess?: number) => boolean;
  collectCompletedMissions: () => CompletedMission[];
  getAvailableAdventurers: () => Adventurer[];
  getRosterSize: () => { current: number; max: number };
  grantResources: (amount: number) => void;
  // Ale & Happiness
  getAleInfo: () => { current: number; cap: number; production: number; consumption: number };
  startCraft: (recipeId: string, quantity?: number) => boolean;
  getAvailableRecipes: () => CraftingRecipe[];
  installBuildingTool: (toolId: string, targetBuildingId: string) => boolean;
  getInstalledTools: (buildingId: string) => string[];
  enchantItem: (enchantId: string, adventurerId: string | null, slot: string | null, inventoryIdx: number | null) => boolean;
  getClothingInfo: () => { current: number; needed: number };
  allocateStat: (adventurerId: string, stat: keyof AdventurerStats) => boolean;
  unlockTalent: (adventurerId: string, talentId: string) => boolean;
  resetTalents: (adventurerId: string) => boolean;
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
  spawnTestMissions: (...missionIds: string[]) => void;
  recallAdventurers: () => { recalled: number; instant: boolean };
  // Astral Shards
  claimDailyLogin: () => boolean;
  canClaimDailyLogin: () => boolean;
  visitGuild: () => void;
  hasNewGuildContent: () => boolean;
  rerollMissions: () => boolean;
  /** Dev-only: replace the mission board with every novice mission, ignoring prerequisites. */
  devSpawnAllNoviceMissions: () => void;
  rerollRecruits: () => boolean;
  claimQuestReward: (questId: string) => boolean;
  startAlchemyResearch: () => boolean;
  startAlchemyCraft: (recipeId: string, quantity?: number) => boolean;
  getHerbCount: (herbId: string) => number;
  makeOffering: (deityId: string) => boolean;
  claimMissionReward: (index: number) => void;
  applyCoopClaim: (response: import("@medieval-realm/shared").CoopClaimResponse, expeditionId: string) => import("@medieval-realm/shared/data/missions").CompletedMission;
  skipRaidTimer: () => void;
  skipMissionTimers: () => void;
  devAddShards: (amount: number) => void;
  trade: (give: string, giveAmount: number, receive: string, receiveAmount: number) => boolean;
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
  const initialFoods = emptyFoods();
  initialFoods.wheat = 100;
  return {
    resources: { gold: 50, wood: 300, stone: 200 },
    foods: initialFoods,
    buildings: BUILDINGS.map((b) => ({
      buildingId: b.id,
      level: b.id === "town_hall" ? 1 : 0,
      upgrading: false,
      damaged: false,
    })),
    fields: [],
    // Pre-spawn one unbuilt slot per veggie so the player sees the 4-garden
    // shape immediately (cabbages / turnips / peas / squash).
    gardens: VEGGIES.map((v) => ({
      id: nextId("garden"),
      veggie: v.id,
      level: 0,
      upgrading: false,
      plantedYear: null,
    })),
    // Pre-spawn one pen per animal (chickens / goats / pigs / sheep).
    pens: ANIMALS.map((a) => ({
      id: nextId("pen"),
      animal: a.id,
      level: 0,
      upgrading: false,
    })),
    // Pre-spawn apiary slots — all identical, no type variants.
    hives: Array.from({ length: MAX_HIVES }, () => ({
      id: nextId("hive"),
      level: 0,
      upgrading: false,
    })),
    // Pre-spawn one orchard per fruit (apples / pears / cherries).
    orchards: FRUITS.map((f) => ({
      id: nextId("orchard"),
      fruit: f.id,
      level: 0,
      upgrading: false,
      seasonsGrown: 0,
      mature: false,
    })),
    honey: 0,
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
    leather: 0,
    clothing: 0,
    iron: 0,
    tools: 0,
    weapons: 0,
    armor: 0,
    potions: 0,
    gems: 0,
    ironMinedTotal: 0,
    herbs: {},
    foragedTotal: 0,
    discoveredRecipes: [],
    alchemyResearchAvailable: true,
    activeBlessing: null,
    lastTradeAt: 0,
    inventory: [],
    craftingQueue: [],
    buildingTools: {},
    discoveredEnemies: [],
    eventLog: [],
    ale: 0,
    happiness: 50,
    lastRaidOutcome: "none",
    lastRaidTime: 0,
    starvationPenalty: 0,
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
    missionRerollToday: 0,
    recruitRerollToday: 0,
    lastRerollReset: Date.now(),
    questRewardsClaimed: [],
    firstMissionSent: false,
    introSeen: false,
    completedStoryMissions: [],
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

// Debounced save: coalesces rapid actions into one API call within 1 second
let _debouncedSaveTimer: ReturnType<typeof setTimeout> | null = null;
let _latestStateGetter: (() => GameState) | null = null;

function scheduleSave() {
  if (_debouncedSaveTimer) clearTimeout(_debouncedSaveTimer);
  _debouncedSaveTimer = setTimeout(() => {
    _debouncedSaveTimer = null;
    if (_settlementId && _latestStateGetter) {
      saveSettlementApi(_settlementId, JSON.parse(JSON.stringify(_latestStateGetter()))).catch(() => {});
    }
  }, 1000);
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
      saved.population = BASE_POPULATION + (HOUSING_POP[houses?.level ?? 0] ?? 0);
    }
    if (!saved.fields) saved.fields = [];
    if (!saved.gardens) saved.gardens = [];
    // Garden migration: add plantedYear on each, and ensure one slot per veggie
    // exists so the pre-attributed 4-slot layout works on old saves.
    for (const g of saved.gardens) {
      if ((g as any).plantedYear === undefined) (g as any).plantedYear = null;
    }
    for (const v of VEGGIES) {
      if (!saved.gardens.some((g: any) => g.veggie === v.id)) {
        saved.gardens.push({
          id: nextId("garden"),
          veggie: v.id,
          level: 0,
          upgrading: false,
          plantedYear: null,
        });
      }
    }
    if (!saved.pens) saved.pens = [];
    if (!saved.hives) saved.hives = [];
    if (!saved.orchards) saved.orchards = [];
    // Pens: ensure one pre-attributed slot per animal
    for (const a of ANIMALS) {
      if (!saved.pens.some((p: any) => p.animal === a.id)) {
        saved.pens.push({
          id: nextId("pen"),
          animal: a.id,
          level: 0,
          upgrading: false,
        });
      }
    }
    // Orchards: ensure one pre-attributed slot per fruit
    for (const f of FRUITS) {
      if (!saved.orchards.some((o: any) => o.fruit === f.id)) {
        saved.orchards.push({
          id: nextId("orchard"),
          fruit: f.id,
          level: 0,
          upgrading: false,
          seasonsGrown: 0,
          mature: false,
        });
      }
    }
    // Hives: backfill up to MAX_HIVES slots
    while (saved.hives.length < MAX_HIVES) {
      saved.hives.push({
        id: nextId("hive"),
        level: 0,
        upgrading: false,
      });
    }
    if (saved.honey === undefined) saved.honey = 0;
    // Migrate legacy `fruit` bucket → split evenly across apples/pears/cherries in the typed pantry
    if ((saved as any).fruit !== undefined && (saved as any).fruit > 0) {
      const legacy = (saved as any).fruit;
      if (!saved.foods) (saved as any).foods = {};
      const each = legacy / 3;
      (saved.foods as any).apples = ((saved.foods as any).apples ?? 0) + each;
      (saved.foods as any).pears = ((saved.foods as any).pears ?? 0) + each;
      (saved.foods as any).cherries = ((saved.foods as any).cherries ?? 0) + each;
    }
    delete (saved as any).fruit;
    if (!saved.season) { saved.season = "spring"; saved.seasonElapsed = 0; saved.year = 1; }
    // Adventurer's Guild migration
    if (!saved.adventurers) saved.adventurers = [];
    if (!saved.activeMissions) saved.activeMissions = [];
    // Migrate old flat supplies to new per-adventurer shape (drop old data — low cost)
    for (const am of saved.activeMissions) {
      if ((am as any).supplies !== undefined) delete (am as any).supplies;
      if (!(am as any).adventurerSupplies) (am as any).adventurerSupplies = {};
    }
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
    // Rehydrate mission board from source data (picks up CDN image URLs etc.)
    if (saved.missionBoard?.length > 0) {
      saved.missionBoard = saved.missionBoard.map((m: any) => getMission(m.id) ?? m);
      // Force refresh if any mission still has old local image paths
      if (saved.missionBoard.some((m: any) => m.image && !m.image.startsWith("http"))) {
        saved.missionBoard = [];
        saved.missionRefreshIn = 0;
      }
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
    if (saved.leather === undefined) saved.leather = 0;
    if (saved.fiber === undefined) saved.fiber = 0;
    if (!saved.yearHarvest) saved.yearHarvest = {};
    for (const f of saved.fields) {
      if ((f as any).harvested === undefined) (f as any).harvested = false;
      // Migrate away from the forced-fallow counter — fallow is now a strategic choice.
      delete (f as any).harvestsBeforeFallow;
      delete (f as any).fallow;
      if ((f as any).lastCrop === undefined) (f as any).lastCrop = null;
      if ((f as any).sameCropStreak === undefined) (f as any).sameCropStreak = 0;
      if ((f as any).restBonus === undefined) (f as any).restBonus = false;
    }
    if (saved.clothing === undefined) saved.clothing = 0;
    if (saved.iron === undefined) saved.iron = 0;
    if (saved.tools === undefined) saved.tools = 0;
    if (saved.weapons === undefined) saved.weapons = 0;
    if (saved.armor === undefined) saved.armor = 0;
    if (saved.potions === undefined) saved.potions = 0;
    if (saved.gems === undefined) saved.gems = 0;
    if (!saved.herbs) saved.herbs = {};
    if (saved.foragedTotal === undefined) saved.foragedTotal = 0;
    if (!saved.discoveredRecipes) saved.discoveredRecipes = [];
    if (saved.alchemyResearchAvailable === undefined) saved.alchemyResearchAvailable = true;
    if (saved.activeBlessing === undefined) saved.activeBlessing = null;
    if (saved.lastTradeAt === undefined) saved.lastTradeAt = 0;
    if (saved.ironMinedTotal === undefined) saved.ironMinedTotal = 0;
    if (!saved.inventory) saved.inventory = [];
    // Equipment migration: old 3-slot → new 11-slot
    const migrateEquipment = (adv: any) => {
      if (!adv.equipment) {
        adv.equipment = { head: null, chest: null, legs: null, boots: null, cloak: null, mainHand: null, offHand: null, ring1: null, ring2: null, amulet: null, trinket: null };
      } else if (adv.equipment.weapon !== undefined || adv.equipment.armor !== undefined) {
        // Old format — migrate
        adv.equipment = {
          head: null, chest: adv.equipment.armor ?? null, legs: null, boots: null,
          cloak: null, mainHand: adv.equipment.weapon ?? null, offHand: null,
          ring1: null, ring2: null, amulet: null, trinket: adv.equipment.trinket ?? null,
        };
      }
      if (!adv.bonusStats) adv.bonusStats = {};
    };
    for (const adv of saved.adventurers) migrateEquipment(adv);
    for (const adv of saved.recruitCandidates) migrateEquipment(adv);
    if (!saved.craftingQueue) saved.craftingQueue = [];
    if (!saved.buildingTools) saved.buildingTools = {};
    if (!saved.discoveredEnemies) saved.discoveredEnemies = [];
    // Migrate old resources.food to typed foods map
    if (!saved.foods) {
      const legacyFood = (saved.resources as any)?.food;
      saved.foods = migrateFoodsFromLegacy(typeof legacyFood === "number" ? legacyFood : 0);
    }
    if (saved.resources && "food" in saved.resources) {
      delete (saved.resources as any).food;
    }
    // Event log migration
    if (!saved.eventLog) saved.eventLog = [];
    // Ale & Happiness migration
    if (saved.ale === undefined) saved.ale = 0;
    if (saved.happiness === undefined) saved.happiness = 50;
    if (!saved.lastRaidOutcome) saved.lastRaidOutcome = "none";
    if (saved.lastRaidTime === undefined) saved.lastRaidTime = 0;
    if (saved.starvationPenalty === undefined) saved.starvationPenalty = 0;
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
    if (saved.introSeen === undefined) saved.introSeen = true; // existing saves have already "seen" the intro
    if (!saved.completedStoryMissions) saved.completedStoryMissions = [];
    // Migrate adventurers missing xp/level fields
    for (const adv of saved.adventurers) {
      if ((adv as any).level === undefined) { (adv as any).level = 1; (adv as any).xp = 0; }
    }
    for (const adv of saved.recruitCandidates) {
      if ((adv as any).level === undefined) { (adv as any).level = 1; (adv as any).xp = 0; }
    }
    // Race/origin/backstory migration — backfill existing adventurers
    const backfillOrigin = (adv: any) => {
      if (adv.race) return; // already has origin data
      // Use name hash for deterministic assignment
      const hash = adv.name.split("").reduce((h: number, c: string) => h + c.charCodeAt(0), 0);
      // Pick race weighted by hash
      const raceRoll = (hash % 100) / 100;
      const race: Race = raceRoll < RACE_WEIGHTS.elf ? "elf" : raceRoll < RACE_WEIGHTS.elf + RACE_WEIGHTS.dwarf ? "dwarf" : "human";
      const origins = getOriginsForRace(race);
      const origin = origins[hash % origins.length];
      // Pick backstory, quirk, trait deterministically from hash
      const backstoryKeys = Object.keys(origin.backstories) as (keyof typeof origin.backstories)[];
      const backstory = origin.backstories[backstoryKeys[hash % backstoryKeys.length]];
      const quirk = PERSONALITY_QUIRKS[hash % PERSONALITY_QUIRKS.length];
      const trait = BACKSTORY_TRAITS[hash % BACKSTORY_TRAITS.length];
      adv.race = race;
      adv.origin = origin.id;
      adv.backstory = backstory;
      adv.quirk = quirk;
      adv.trait = trait.id;
    };
    for (const adv of saved.adventurers) backfillOrigin(adv);
    for (const adv of saved.recruitCandidates) backfillOrigin(adv);
    // Talent migration
    for (const adv of saved.adventurers) { if (!adv.talents) adv.talents = []; }
    for (const adv of saved.recruitCandidates) { if (!adv.talents) adv.talents = []; }
    // Food preference & loyalty migration
    const backfillFoodLoyalty = (adv: any) => {
      if (adv.foodPreference === undefined) {
        const hash = adv.name.split("").reduce((h: number, c: string) => h + c.charCodeAt(0), 0);
        adv.foodPreference = FOOD_PREFERENCES[hash % FOOD_PREFERENCES.length].id;
      }
      if (adv.loyalty === undefined) adv.loyalty = 0;
    };
    for (const adv of saved.adventurers) backfillFoodLoyalty(adv);
    for (const adv of saved.recruitCandidates) backfillFoodLoyalty(adv);
    // Age migration
    const backfillAge = (adv: any) => {
      if (adv.age === undefined) {
        const hash = adv.name.split("").reduce((h: number, c: string) => h + c.charCodeAt(0), 0);
        const ages: AgeCategory[] = ["young", "middle", "mature", "old"];
        adv.age = ages[hash % ages.length];
      }
    };
    for (const adv of saved.adventurers) backfillAge(adv);
    for (const adv of saved.recruitCandidates) backfillAge(adv);
    // Match premade characters by backstory to fix renamed names/portraits
    const migratePremadeByBackstory = (adv: any) => {
      if (!adv.backstory) return;
      const match = PREMADE_CHARACTERS.find((c) => c.backstory === adv.backstory);
      if (!match) return;
      if (adv.name !== match.name) adv.name = match.name;
      if (adv.portrait !== match.portrait) adv.portrait = match.portrait;
    };
    for (const adv of saved.adventurers) migratePremadeByBackstory(adv);
    for (const adv of saved.recruitCandidates) migratePremadeByBackstory(adv);
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

function calcProductionRates(state: GameState): { gold: number; wood: number; stone: number; food: number } {
  const { buildings, fields, gardens, pens, population, season, seasonElapsed } = state;
  const rates = { gold: 0, wood: 0, stone: 0, food: 0 };

  // Citizen tax
  rates.gold += Math.floor(population) * GOLD_TAX_PER_CITIZEN_PER_HOUR;

  // Building production — damaged buildings don't produce
  // Food gathering buildings have seasonal modifiers
  const FOOD_GATHERING = new Set(["hunting_camp", "forager_hut", "fishing_hut"]);
  const foodSeasonMod: Record<string, number> = {
    spring: 1.0, summer: 1.0, autumn: 0.75, winter: 0.5,
  };
  const foragerSeasonMod: Record<string, number> = {
    spring: 1.0, summer: 1.0, autumn: 0.75, winter: 0.25,
  };

  for (const pb of buildings) {
    if (pb.level === 0 || pb.damaged) continue;
    const def = BUILDINGS.find((b) => b.id === pb.buildingId);
    if (!def) continue;
    const levelDef = def.levels[pb.level - 1];
    if (levelDef?.production) {
      const res = levelDef.production.resource as keyof typeof rates;
      let rate = levelDef.production.rate;
      // Apply seasonal modifier for food gathering buildings
      if (FOOD_GATHERING.has(pb.buildingId)) {
        const mod = pb.buildingId === "forager_hut"
          ? (foragerSeasonMod[season] ?? 1)
          : (foodSeasonMod[season] ?? 1);
        rate = Math.floor(rate * mod);
      }
      if (res in rates) rates[res] += rate;
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

  // Gardens — produce only if planted this cycle and in a produce season
  for (const garden of gardens) {
    if (garden.level === 0) continue;
    if (garden.plantedYear == null) continue;
    const veggie = getVeggie(garden.veggie);
    if (isVeggieProducing(veggie, season)) {
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

/** Count fallow fields available for grazing (level ≥ 1, no crop planted). */
function calcGrazingCapacity(fields: PlayerField[]): number {
  let count = 0;
  for (const f of fields) if (f.level >= 1 && f.crop === null) count++;
  return count * GRAZING_PER_FIELD;
}

/** Drain pantry for each pen, applying grazing + category preferences.
 *  Returns per-pen fedRatio (0-1). Mutates pen.starving. */
function applyAnimalFeed(s: GameState, elapsedHours: number): Map<string, number> {
  const fedRatios = new Map<string, number>();
  if (!s.pens.length || elapsedHours <= 0) return fedRatios;

  const grazingPerHour = calcGrazingCapacity(s.fields);

  // Grazer demand weight (for splitting grazing proportionally)
  let totalGrazerDemand = 0;
  for (const pen of s.pens) {
    if (pen.level === 0 || !isGrazer(pen.animal)) continue;
    totalGrazerDemand += getPenProduction(getAnimal(pen.animal), pen.level).consumed;
  }

  for (const pen of s.pens) {
    if (pen.level === 0) {
      fedRatios.set(pen.id, 1);
      pen.starving = false;
      continue;
    }
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.level);
    const baseNeed = prod.consumed * elapsedHours;
    if (baseNeed <= 0) {
      fedRatios.set(pen.id, 1);
      pen.starving = false;
      continue;
    }

    let covered = 0;

    // Grazing share for sheep/goats, proportional to their consumption
    if (isGrazer(pen.animal) && totalGrazerDemand > 0) {
      const share = prod.consumed / totalGrazerDemand;
      const grazingForPen = grazingPerHour * share * elapsedHours;
      covered += Math.min(baseNeed, grazingForPen);
    }

    // Pantry consumption for the remainder (from preferred categories only)
    const remaining = Math.max(0, baseNeed - covered);
    if (remaining > 0 && s.foods) {
      covered += consumeFromCategories(s.foods, ANIMAL_FEED[pen.animal], remaining);
    }

    const ratio = Math.max(0, Math.min(1, covered / baseNeed));
    fedRatios.set(pen.id, ratio);

    const wasStarving = pen.starving === true;
    pen.starving = ratio < 0.5;
    if (pen.starving && !wasStarving) {
      pushEvent(s, "pen_starving", "🥀", `The ${animal.name.toLowerCase()} pen is starving — no food in its diet!`);
    }
  }

  return fedRatios;
}

/** Per-food-type production rates, used to add to the typed foods map each tick.
 *  Pass `fedRatios` to scale per-pen food output (starving pens produce less). */
function calcFoodRates(state: GameState, fedRatios?: Map<string, number>): Record<FoodItemType, number> {
  const rates = emptyFoods();
  const { buildings, fields, gardens, pens, orchards, season, seasonElapsed } = state;

  const foodSeasonMod: Record<string, number> = {
    spring: 1.0, summer: 1.0, autumn: 0.75, winter: 0.5,
  };
  const foragerSeasonMod: Record<string, number> = {
    spring: 1.0, summer: 1.0, autumn: 0.75, winter: 0.25,
  };

  // Fields — harvest season only
  if (isHarvestTime(season, seasonElapsed)) {
    for (const field of fields) {
      if (field.level === 0 || !field.crop) continue;
      const crop = getCrop(field.crop);
      if (!crop.isFood) continue;
      const rate = getSeasonYield(crop, field.level) / HARVEST_DURATION_HOURS;
      if (crop.id in rates) rates[crop.id as FoodItemType] += rate;
    }
  }

  // Gardens — active season only, and only if planted this cycle
  for (const garden of gardens) {
    if (garden.level === 0) continue;
    if (garden.plantedYear == null) continue;
    const veggie = getVeggie(garden.veggie);
    if (!isVeggieProducing(veggie, season)) continue;
    const rate = getGardenRate(veggie, garden.level);
    if (veggie.id in rates) rates[veggie.id as FoodItemType] += rate;
  }

  // Orchards — mature + harvest-season only, per-fruit
  for (const orchard of orchards ?? []) {
    if (orchard.level === 0 || orchard.upgrading || !orchard.mature) continue;
    const fruitDef = getFruit(orchard.fruit);
    if (!isOrchardActive(fruitDef, season)) continue;
    const rate = getOrchardRate(fruitDef, orchard.level);
    if (fruitDef.id in rates) rates[fruitDef.id as FoodItemType] += rate;
  }

  // Pens — animal products by foodLabel (Meat/Eggs/Milk → meat/eggs/milk)
  for (const pen of pens) {
    if (pen.level === 0) continue;
    const ratio = fedRatios ? (fedRatios.get(pen.id) ?? 0) : 1;
    if (ratio <= 0) continue;
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.level);
    const type = animal.foodLabel.toLowerCase() as FoodItemType;
    if (type in rates) rates[type] += prod.produced * ratio;
  }

  // Buildings — hunting, forager, fishing
  for (const pb of buildings) {
    if (pb.level === 0 || pb.damaged) continue;
    const def = BUILDINGS.find((b) => b.id === pb.buildingId);
    if (!def) continue;
    const levelDef = def.levels[pb.level - 1];
    if (!levelDef?.production || levelDef.production.resource !== "food") continue;
    let rate = levelDef.production.rate;
    let target: FoodItemType | null = null;
    if (pb.buildingId === "hunting_camp") {
      rate = Math.floor(rate * (foodSeasonMod[season] ?? 1));
      target = "meat";
    } else if (pb.buildingId === "forager_hut") {
      rate = Math.floor(rate * (foragerSeasonMod[season] ?? 1));
      target = season === "autumn" ? "mushrooms" : season === "winter" ? "nuts" : "berries";
    } else if (pb.buildingId === "fishing_hut") {
      rate = Math.floor(rate * (foodSeasonMod[season] ?? 1));
      target = "fish";
    }
    if (target) rates[target] += rate;
  }

  return rates;
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

  const foodSeasonMod: Record<string, number> = {
    spring: 1.0, summer: 1.0, autumn: 0.75, winter: 0.5,
  };
  const foragerSeasonMod: Record<string, number> = {
    spring: 1.0, summer: 1.0, autumn: 0.75, winter: 0.25,
  };

  // Fields (harvest only) — use crop.id (wheat/barley) as the food type
  if (isHarvestTime(season, seasonElapsed)) {
    for (const field of fields) {
      if (field.level === 0 || !field.crop) continue;
      const crop = getCrop(field.crop);
      if (!crop.isFood) continue;
      const rate = Math.round(getSeasonYield(crop, field.level) / HARVEST_DURATION_HOURS);
      sources.push({ type: crop.id, label: crop.name, icon: crop.icon, rate, building: `${crop.name} Field Lv${field.level}` });
    }
  }

  // Gardens — use veggie.id (cabbages/turnips/peas/squash)
  for (const garden of gardens) {
    if (garden.level === 0) continue;
    if (garden.plantedYear == null) continue;
    const veggie = getVeggie(garden.veggie);
    if (!isVeggieProducing(veggie, season)) continue;
    const rate = getGardenRate(veggie, garden.level);
    sources.push({ type: veggie.id, label: veggie.name, icon: veggie.icon, rate, building: `${veggie.name} Garden Lv${garden.level}` });
  }

  // Pens — meat/eggs/milk
  for (const pen of pens) {
    if (pen.level === 0) continue;
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.level);
    sources.push({ type: animal.foodLabel.toLowerCase(), label: animal.foodLabel, icon: animal.icon, rate: prod.produced, building: `${animal.name} Pen Lv${pen.level}` });
  }

  // Buildings — hunting (meat), forager (seasonal berries/mushrooms/nuts), fishing (fish)
  for (const pb of buildings) {
    if (pb.level === 0) continue;
    const def = BUILDINGS.find((b) => b.id === pb.buildingId);
    if (!def) continue;
    const levelDef = def.levels[pb.level - 1];
    if (levelDef?.production?.resource !== "food") continue;
    let rate = levelDef.production.rate;
    let type = "";
    let icon = "";
    let label = "";
    if (pb.buildingId === "hunting_camp") {
      rate = Math.floor(rate * (foodSeasonMod[season] ?? 1));
      type = "meat"; icon = "🍖"; label = "Meat";
    } else if (pb.buildingId === "forager_hut") {
      rate = Math.floor(rate * (foragerSeasonMod[season] ?? 1));
      if (season === "autumn") { type = "mushrooms"; icon = "🍄"; label = "Mushrooms"; }
      else if (season === "winter") { type = "nuts"; icon = "🌰"; label = "Nuts"; }
      else { type = "berries"; icon = "🫐"; label = "Berries"; }
    } else if (pb.buildingId === "fishing_hut") {
      rate = Math.floor(rate * (foodSeasonMod[season] ?? 1));
      type = "fish"; icon = "🐟"; label = "Fish";
    }
    if (type && rate > 0) {
      sources.push({ type, label, icon, rate, building: def.name });
    }
  }

  return sources;
}

// Population per housing level — escalates with tier progression
const HOUSING_POP: number[] = [
  0,    // lvl 0: no houses
  5,    // lvl 1: camp — small shelters
  10,   // lvl 2: camp
  18,   // lvl 3: village — proper cottages
  28,   // lvl 4: village
  40,   // lvl 5: village
  55,   // lvl 6: village
  75,   // lvl 7: town — multi-family housing
  100,  // lvl 8: town
  130,  // lvl 9: town
  170,  // lvl 10: town
  220,  // lvl 11: city — dense housing blocks
  280,  // lvl 12: city
  350,  // lvl 13: city
  440,  // lvl 14: city
  550,  // lvl 15: city
  700,  // lvl 16: city
  880,  // lvl 17: city
  1100, // lvl 18: city
  1400, // lvl 19: city
  1800, // lvl 20: city — metropolis
];

function calcMaxPopulation(buildings: PlayerBuilding[]): number {
  const houses = buildings.find((b) => b.buildingId === "houses");
  const level = houses?.level ?? 0;
  return BASE_POPULATION + (HOUSING_POP[level] ?? 0);
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
      const cur = BASE_POPULATION + (HOUSING_POP[Math.max(0, currentLevel)] ?? 0);
      const next = BASE_POPULATION + (HOUSING_POP[nextLevel] ?? 0);
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
      const curRoster = getMaxRoster(Math.max(0, currentLevel));
      const nextRoster = getMaxRoster(nextLevel);
      return `Max roster: ${curRoster} → ${nextRoster}`;
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
  _latestStateGetter = () => state;

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
        if (!serverState.completedStoryMissions) serverState.completedStoryMissions = [];
        if (!serverState.herbs) serverState.herbs = {};
        if (serverState.foragedTotal === undefined) serverState.foragedTotal = 0;
        if (serverState.starvationPenalty === undefined) serverState.starvationPenalty = 0;
        // Backfill any new buildings that were added since this save was created
        for (const def of BUILDINGS) {
          if (!serverState.buildings.find((b: any) => b.buildingId === def.id)) {
            serverState.buildings.push({ buildingId: def.id, level: 0, upgrading: false, damaged: false });
          }
        }
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
        // Gardens: add plantedYear + ensure one pre-attributed slot per veggie
        serverState.gardens = serverState.gardens ?? [];
        for (const g of serverState.gardens) {
          if ((g as any).plantedYear === undefined) (g as any).plantedYear = null;
        }
        for (const v of VEGGIES) {
          if (!serverState.gardens.some((g: any) => g.veggie === v.id)) {
            serverState.gardens.push({
              id: nextId("garden"),
              veggie: v.id,
              level: 0,
              upgrading: false,
              plantedYear: null,
            });
          }
        }
        // Pens: ensure one pre-attributed slot per animal
        serverState.pens = serverState.pens ?? [];
        for (const a of ANIMALS) {
          if (!serverState.pens.some((p: any) => p.animal === a.id)) {
            serverState.pens.push({
              id: nextId("pen"),
              animal: a.id,
              level: 0,
              upgrading: false,
            });
          }
        }
        // Orchards: ensure one pre-attributed slot per fruit
        serverState.orchards = serverState.orchards ?? [];
        for (const f of FRUITS) {
          if (!serverState.orchards.some((o: any) => o.fruit === f.id)) {
            serverState.orchards.push({
              id: nextId("orchard"),
              fruit: f.id,
              level: 0,
              upgrading: false,
              seasonsGrown: 0,
              mature: false,
            });
          }
        }
        // Hives: backfill up to MAX_HIVES pre-attributed slots
        serverState.hives = serverState.hives ?? [];
        while (serverState.hives.length < MAX_HIVES) {
          serverState.hives.push({
            id: nextId("hive"),
            level: 0,
            upgrading: false,
          });
        }
        // Legacy fruit bucket → split into typed pantry (apples/pears/cherries)
        if ((serverState as any).fruit !== undefined && (serverState as any).fruit > 0) {
          const legacy = (serverState as any).fruit;
          if (!serverState.foods) (serverState as any).foods = {};
          const each = legacy / 3;
          (serverState.foods as any).apples = ((serverState.foods as any).apples ?? 0) + each;
          (serverState.foods as any).pears = ((serverState.foods as any).pears ?? 0) + each;
          (serverState.foods as any).cherries = ((serverState.foods as any).cherries ?? 0) + each;
        }
        delete (serverState as any).fruit;
        // Equipment migration: old 3-slot → new 11-slot
        const migrateEq = (adv: any) => {
          if (adv.equipment?.weapon !== undefined || adv.equipment?.armor !== undefined) {
            adv.equipment = {
              head: null, chest: adv.equipment.armor ?? null, legs: null, boots: null,
              cloak: null, mainHand: adv.equipment.weapon ?? null, offHand: null,
              ring1: null, ring2: null, amulet: null, trinket: adv.equipment.trinket ?? null,
            };
          } else if (!adv.equipment?.head && adv.equipment?.head !== null) {
            adv.equipment = { head: null, chest: null, legs: null, boots: null, cloak: null, mainHand: null, offHand: null, ring1: null, ring2: null, amulet: null, trinket: null };
          }
        };
        for (const adv of serverState.adventurers ?? []) migrateEq(adv);
        for (const adv of serverState.recruitCandidates ?? []) migrateEq(adv);

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
        // Ensure lastTick is valid (prevents NaN in tick loop if server state lost the field)
        if (!serverState.lastTick || typeof serverState.lastTick !== "number") {
          serverState.lastTick = Date.now();
        }
        // Resolve expired raids directly (server tick counts down but never resolves)
        // This runs BEFORE setState to guarantee resolution even if applyTicks throws later
        if (serverState.incomingRaids?.length) {
          for (let i = serverState.incomingRaids.length - 1; i >= 0; i--) {
            const ir = serverState.incomingRaids[i];
            if (ir.remaining <= 0) {
              const template = getRaid(ir.raidId);
              if (template) {
                const homeAdvs = (serverState.adventurers ?? []).filter((a: any) => a.alive && !a.onMission);
                const defense = calcDefense(serverState.buildings, homeAdvs, serverState.population);
                const result = resolveRaid({
                  raid: template,
                  raidStrength: ir.strength,
                  defense,
                  resources: { ...serverState.resources, food: getTotalFood(serverState.foods) },
                  population: serverState.population,
                  homeAdventurers: homeAdvs,
                });
                // Apply results directly to server state
                if (result.victory) {
                  for (const loot of result.loot) {
                    if (loot.resource === "astralShards") {
                      serverState.astralShards += loot.amount;
                    } else {
                      const key = loot.resource as keyof typeof serverState.resources;
                      serverState.resources[key] += loot.amount;
                    }
                  }
                } else {
                  serverState.resources.gold = Math.max(0, serverState.resources.gold - result.resourcesLost.gold);
                  serverState.resources.wood = Math.max(0, serverState.resources.wood - result.resourcesLost.wood);
                  serverState.resources.stone = Math.max(0, serverState.resources.stone - result.resourcesLost.stone);
                  if (serverState.foods) consumeFood(serverState.foods, result.resourcesLost.food);
                  serverState.population = Math.max(BASE_POPULATION, serverState.population - result.citizensLost);
                  // Damage buildings
                  const damageable = serverState.buildings.filter((b: any) => b.level > 0 && !b.damaged && b.buildingId !== "town_hall");
                  const damageCount = Math.min(damageable.length, result.buildingsDamaged ?? 1);
                  for (let d = 0; d < damageCount; d++) {
                    const idx = Math.floor(Math.random() * damageable.length);
                    damageable[idx].damaged = true;
                    damageable.splice(idx, 1);
                  }
                }
                if (!serverState.raidLog) serverState.raidLog = [];
                serverState.raidLog.push(result);
                serverState.lastRaidOutcome = result.victory ? "victory" : "defeat";
                serverState.lastRaidTime = 0;
                if (!serverState.eventLog) serverState.eventLog = [];
                const raidName = template.name ?? ir.raidId;
                serverState.eventLog.unshift({
                  type: result.victory ? "raid_victory" : "raid_defeat",
                  icon: result.victory ? "🛡️" : "💔",
                  message: result.victory
                    ? `Repelled ${raidName}! Loot: ${result.loot.map((l: any) => `+${l.amount} ${l.resource}`).join(", ")}`
                    : `Defeated by ${raidName}! Resources stolen, buildings damaged.`,
                  timestamp: Date.now(),
                });
              }
              serverState.incomingRaids.splice(i, 1);
            }
          }
        }
        // Race/origin/backstory backfill for adventurers from older saves
        const backfillOriginServer = (adv: any) => {
          if (adv.race) return;
          const hash = adv.name.split("").reduce((h: number, c: string) => h + c.charCodeAt(0), 0);
          const raceRoll = (hash % 100) / 100;
          const race: Race = raceRoll < RACE_WEIGHTS.elf ? "elf" : raceRoll < RACE_WEIGHTS.elf + RACE_WEIGHTS.dwarf ? "dwarf" : "human";
          const origins = getOriginsForRace(race);
          const origin = origins[hash % origins.length];
          const backstoryKeys = Object.keys(origin.backstories) as (keyof typeof origin.backstories)[];
          adv.race = race;
          adv.origin = origin.id;
          adv.backstory = origin.backstories[backstoryKeys[hash % backstoryKeys.length]];
          adv.quirk = PERSONALITY_QUIRKS[hash % PERSONALITY_QUIRKS.length];
          adv.trait = BACKSTORY_TRAITS[hash % BACKSTORY_TRAITS.length].id;
        };
        for (const adv of serverState.adventurers ?? []) backfillOriginServer(adv);
        for (const adv of serverState.recruitCandidates ?? []) backfillOriginServer(adv);

        setState(reconcile(serverState));
        // Catch up for time spent offline
        const offlineMs = Date.now() - serverState.lastTick;
        if (offlineMs > 2000) {
          try {
            applyTicks(offlineMs);
          } catch (err) {
            console.error("Offline catch-up error:", err);
            setState("lastTick", Date.now());
          }
        }
        // Resolve any missions/crafts with negative remaining (server tick counted down but didn't resolve)
        const hasUnresolved = serverState.activeMissions?.some((m) => m.remaining <= 0)
          || serverState.craftingQueue?.some((c) => c.remaining <= 0);
        if (hasUnresolved) {
          try { applyTicks(1000); } catch { /* already logged above */ }
        }
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

  /** Check and unlock origin recipes when an adventurer's loyalty rank increases */
  function unlockOriginRecipes(s: GameState, adv: { name: string; origin: string }, newRank: { rank: number }) {
    const recipes = ORIGIN_RECIPES[adv.origin];
    if (!recipes) return;
    for (const { rank, recipeId } of recipes) {
      if (rank === newRank.rank && !s.discoveredRecipes.includes(recipeId)) {
        s.discoveredRecipes.push(recipeId);
        const recipeName = recipeId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        pushEvent(s, "loot_drop", "🍳", `${adv.name} shared the recipe for ${recipeName} with the kitchens!`);
      }
    }
  }

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
          // Planted this year — harvest with soil multiplier applied
          const crop = getCrop(field.crop);
          const base = getSeasonYield(crop, field.level);
          const mult = getSoilMultiplier(field.sameCropStreak, field.restBonus);
          const amount = Math.max(0, Math.floor(base * mult));
          s.yearHarvest[crop.name] = (s.yearHarvest[crop.name] ?? 0) + amount;
          field.harvested = true;
          field.crop = null;
          // Rest bonus is consumed by this harvest
          field.restBonus = false;
        } else if (field.level > 0 && field.lastCrop !== null) {
          // Field was left idle through this growing season — grant rest bonus
          // for the next harvest. Only applies if there's been a previous crop
          // (fresh fields already have full yield).
          field.restBonus = true;
        }
      }
    }
    // Reset per-year UI flag in spring
    if (next === "spring") {
      for (const field of s.fields) {
        field.harvested = false;
      }
    }
    // Clear each garden's plantedYear when we enter its veggie's plant season
    // from a previous cycle — the player has to buy fresh seeds and replant.
    for (const garden of s.gardens) {
      if (garden.plantedYear == null) continue;
      const veggie = getVeggie(garden.veggie);
      if (veggie.plantSeasons.includes(next) && garden.plantedYear < s.year) {
        garden.plantedYear = null;
      }
    }
    if (prev === "summer") {
      pushEvent(s, "building_completed", "🍂", "Autumn is here — harvest season begins!");
    }

    // Orchard maturation — increment seasonsGrown each season
    for (const orchard of s.orchards) {
      if (orchard.level > 0 && !orchard.upgrading && !orchard.mature) {
        orchard.seasonsGrown = (orchard.seasonsGrown ?? 0) + 1;
        const fruitDef = getFruit(orchard.fruit);
        if (orchard.seasonsGrown >= fruitDef.maturationSeasons) {
          orchard.mature = true;
          pushEvent(s, "building_completed", fruitDef.icon, `Your ${fruitDef.name} are now bearing fruit!`);
        }
      }
    }

    // Passive loyalty gain — +0.5 per season for alive, idle adventurers
    for (const adv of s.adventurers) {
      if (adv.alive && !adv.onMission) {
        const oldLoyalty = adv.loyalty ?? 0;
        const oldRank = getLoyaltyRank(oldLoyalty);
        adv.loyalty = Math.min(100, oldLoyalty + 0.5);
        const newRank = getLoyaltyRank(adv.loyalty);
        if (newRank.rank > oldRank.rank) {
          pushEvent(s, "loyalty_rankup", "💛", `${adv.name} is now ${newRank.title}!`);
          unlockOriginRecipes(s, adv as any, newRank);
        }
      }
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

          // Clear blessing if the deity has rotated
          if (s.activeBlessing) {
            const currentDeity = getCurrentDeity(s.season, global.progress);
            if (currentDeity.id !== s.activeBlessing.deityId) {
              s.activeBlessing = null;
            }
          }
        }

        const rates = calcProductionRates(s);
        // Animals eat from their preferred categories (and graze fallow fields) FIRST.
        // This drains the pantry in-place and returns a fedRatio per pen so
        // starving pens don't produce food/wool/leather this tick.
        const fedRatios = applyAnimalFeed(s, elapsedHours);
        const foodRates = calcFoodRates(s, fedRatios);
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

        // Food: add per-type production (capped at pantry total), then citizens eat proportionally.
        // Animal consumption already happened above in applyAnimalFeed.
        if (!s.foods) s.foods = emptyFoods();
        for (const [type, rate] of Object.entries(foodRates) as [FoodItemType, number][]) {
          if (rate > 0) addFood(s.foods, type, rate * happinessMod * elapsedHours, caps.food);
        }
        const foodToConsume = citizenFood * elapsedHours;
        if (foodToConsume > 0) consumeFood(s.foods, foodToConsume);

        // ── Wool from sheep pens (seasonal) ──
        const woolSeasonMod = s.season === "spring" || s.season === "summer" ? 1.0
          : s.season === "autumn" ? 0.5 : 0; // no wool in winter
        for (const pen of s.pens) {
          if (pen.level === 0) continue;
          const ratio = fedRatios.get(pen.id) ?? 1;
          if (ratio <= 0) continue;
          const animal = getAnimal(pen.animal);
          const prod = getPenProduction(animal, pen.level);
          if (prod.secondary && prod.secondary.resource === "wool" && woolSeasonMod > 0) {
            s.wool = Math.min(200, s.wool + prod.secondary.amount * woolSeasonMod * ratio * elapsedHours);
          }
        }

        // ── Leather from hunting camp and animal pens (except chickens) ──
        const huntingCampLvl = s.buildings.find((b) => b.buildingId === "hunting_camp")?.level ?? 0;
        if (huntingCampLvl > 0) {
          s.leather = Math.min(200, s.leather + huntingCampLvl * 1.0 * elapsedHours);
        }
        for (const pen of s.pens) {
          if (pen.level === 0) continue;
          if (pen.animal === "chickens") continue; // chickens don't produce leather
          const ratio = fedRatios.get(pen.id) ?? 1;
          if (ratio <= 0) continue;
          // Pigs, goats, sheep produce small amounts of leather (hides)
          const leatherRate = pen.animal === "goats" ? 1.2 : 0.8;
          s.leather = Math.min(200, s.leather + leatherRate * pen.level * ratio * elapsedHours);
        }

        // ── Fiber from forager's hut (wild flax and plant fibers) ──
        const foragerLvl = s.buildings.find((b) => b.buildingId === "forager_hut")?.level ?? 0;
        if (foragerLvl > 0) {
          s.fiber = Math.min(200, s.fiber + foragerLvl * 1.5 * elapsedHours);

          // ── Herb procs from foraging ──
          const foodForaged = foragerLvl * 8 * elapsedHours; // approximate food gathered
          s.foragedTotal = (s.foragedTotal ?? 0) + foodForaged;
          for (const herb of HERBS) {
            const herbChance = foodForaged * herb.dropRate;
            if (Math.random() < herbChance) {
              s.herbs[herb.id] = (s.herbs[herb.id] ?? 0) + 1;
              if (herb.rarity === "rare" || herb.rarity === "legendary") {
                pushEvent(s, "building_completed", herb.icon, `Your foragers found a rare ${herb.name}!`);
              }
            }
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

        // ── Honey from apiaries (seasonal) ──
        const honeyCap = getHoneyStorageCap(s.hives);
        for (const hive of s.hives) {
          if (hive.level === 0 || hive.upgrading) continue;
          const rate = getHoneyRate(hive.level, s.season);
          if (rate > 0) {
            s.honey = Math.min(honeyCap, s.honey + rate * elapsedHours);
          }
        }

        // Orchards no longer use a separate state.fruit bucket — per-fruit
        // production is added via calcFoodRates above, into the typed pantry.

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
        // Only active (non-pending) entries tick. When an active one finishes
        // its last item, a pending entry in the SAME building gets promoted.
        for (let i = s.craftingQueue.length - 1; i >= 0; i--) {
          const craft = s.craftingQueue[i];
          if (craft.pending) continue;
          craft.remaining -= elapsedSeconds;
          if (craft.remaining <= 0) {
            const recipe = CRAFTING_RECIPES.find((r) => r.id === craft.recipeId);
            let completedBuilding: string | null = null;
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
              // Also add equippable item or building tool to inventory
              const itemDef = getItemByRecipe(recipe.id);
              if (itemDef) {
                const existing = s.inventory.find((i) => i.itemId === itemDef.id);
                if (existing) existing.quantity += amt;
                else s.inventory.push({ itemId: itemDef.id, quantity: amt });
              }
              const toolDef = getBuildingToolByRecipe(recipe.id);
              if (toolDef) {
                const existing = s.inventory.find((i) => i.itemId === toolDef.id);
                if (existing) existing.quantity += amt;
                else s.inventory.push({ itemId: toolDef.id, quantity: amt });
              }
              const remaining = (craft.quantity ?? 1) - 1;
              pushEvent(s, "building_completed", recipe.icon, `Crafted ${recipe.name}${remaining > 0 ? ` (${remaining} remaining)` : ""}`);
              // If more to craft, reset timer; otherwise remove from queue
              if (remaining > 0) {
                craft.remaining = recipe.craftTime;
                craft.quantity = remaining;
              } else {
                completedBuilding = recipe.building;
                s.craftingQueue.splice(i, 1);
              }
            } else {
              // Check alchemy recipes (herb-based potions)
              const alchRecipe = ALCHEMY_RECIPES.find((r) => r.id === craft.recipeId);
              if (alchRecipe) {
                const existing = s.inventory.find((i) => i.itemId === alchRecipe.id);
                if (existing) existing.quantity += 1;
                else s.inventory.push({ itemId: alchRecipe.id, quantity: 1 });
                s.potions += 1;
                const remaining = (craft.quantity ?? 1) - 1;
                pushEvent(s, "building_completed", alchRecipe.icon, `Brewed ${alchRecipe.name}${remaining > 0 ? ` (${remaining} remaining)` : ""}`);
                if (remaining > 0) {
                  craft.remaining = alchRecipe.craftTime;
                  craft.quantity = remaining;
                } else {
                  completedBuilding = "alchemy_lab";
                  s.craftingQueue.splice(i, 1);
                }
              } else {
                s.craftingQueue.splice(i, 1);
              }
            }
            // Promote the next pending entry in the same building (if any)
            if (completedBuilding) {
              const nextPending = s.craftingQueue.find((c) => {
                if (!c.pending) return false;
                const r = CRAFTING_RECIPES.find((cr) => cr.id === c.recipeId);
                if (r) return r.building === completedBuilding;
                // Alchemy recipes share a single "alchemy_lab" slot pool
                return completedBuilding === "alchemy_lab" && ALCHEMY_RECIPES.some((ar) => ar.id === c.recipeId);
              });
              if (nextPending) {
                nextPending.pending = false;
                // Reset the timer now that it's starting
                const r = CRAFTING_RECIPES.find((cr) => cr.id === nextPending.recipeId)
                  ?? (ALCHEMY_RECIPES.find((ar) => ar.id === nextPending.recipeId) as any);
                if (r) nextPending.remaining = r.craftTime;
              }
            }
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
          // Only produce if we have enough food total (proportionally drawn)
          if (getTotalFood(s.foods) >= foodNeeded) {
            consumeFood(s.foods, foodNeeded);
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

        // Food surplus/deficit — deficit is punishing; surplus caps modestly
        if (netFoodRate > 0) happiness += Math.min(15, netFoodRate / 5);
        else if (netFoodRate < 0) happiness -= Math.min(40, Math.abs(netFoodRate) / 2);

        // Starvation penalty — resets to 75 when people starve, decays over 24h after food is restored
        if (getTotalFood(s.foods) <= 0) {
          s.starvationPenalty = 75; // hold at max while starving
        } else if (s.starvationPenalty > 0) {
          // Decay: lose 75 points over 24 hours = ~3.125 per hour
          s.starvationPenalty = Math.max(0, s.starvationPenalty - (75 / 24) * elapsedHours);
        }
        if (s.starvationPenalty > 0) happiness -= Math.round(s.starvationPenalty);

        // Winter cold
        if (isWinter) {
          happiness += WINTER_HAPPINESS_PENALTY;
          if (s.resources.wood <= 0) happiness += WINTER_NO_WOOD_HAPPINESS;
        }

        // Housing — only a real overcrowding penalty; no "nearly full" nag
        if (s.population > maxPop) happiness -= 15;

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

        // Clothing — scaled penalty when underclothed, doubled in winter
        const clothingNeededHappy = Math.ceil(s.population / CLOTHING_PER_CITIZENS);
        if (clothingNeededHappy > 0) {
          const clothRatio = Math.min(1, s.clothing / clothingNeededHappy);
          if (clothRatio >= 1) {
            happiness += CLOTHING_HAPPINESS_BONUS;
          } else if (clothRatio < 0.5) {
            // Scale from -5 (at 50%) to -15 (at 0%), doubled in winter
            const penalty = -Math.round(5 + 10 * (1 - clothRatio * 2));
            happiness += isWinter ? penalty * 2 : penalty;
          }
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
        if (getTotalFood(s.foods) > 0) {
          if (foodTypes <= 1) happiness -= 12;
          else if (foodTypes === 2) happiness -= 5;
          else if (foodTypes === 3) happiness += 3;
          else if (foodTypes === 4) happiness += 6;
          else if (foodTypes >= 5) happiness += 10;
        }

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

        // Tick upgrades — buildings, fields, gardens, pens, hives, orchards
        for (const list of [s.buildings, s.fields, s.gardens, s.pens, s.hives, s.orchards]) {
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

        // Villager growth / decline
        const popBefore = Math.floor(s.population);
        if (netFoodRate > 0 && s.population < maxPop && s.happiness >= 20) {
          const growthMod = s.happiness >= 70 ? 1.5 : s.happiness >= 40 ? 1.0 : 0.5;
          const growth = (1 / VILLAGER_GROWTH_INTERVAL_HOURS) * elapsedHours * growthMod;
          s.population = Math.min(maxPop, s.population + growth);
        } else if (s.population > BASE_POPULATION) {
          // Starvation and unhappiness stack — percentage-based so it scales with population
          let ratePct = 0;
          if (getTotalFood(s.foods) <= 0) ratePct += 0.10; // 10%/hour — brutal, but self-correcting as pop drops
          if (s.happiness < 20) ratePct += 0.02;      // 2%/hour fleeing
          if (ratePct > 0) {
            // Exponential decay: pop * (1 - rate)^hours, clamped to base
            const remaining = s.population * Math.pow(1 - ratePct, elapsedHours);
            s.population = Math.max(BASE_POPULATION, remaining);
          }
        }
        const popAfter = Math.floor(s.population);
        if (popAfter > popBefore) {
          pushEvent(s, "citizen_born", "👶", `${popAfter - popBefore} new citizen${popAfter - popBefore > 1 ? "s" : ""} arrived`);
        } else if (popAfter < popBefore) {
          const lost = popBefore - popAfter;
          if (getTotalFood(s.foods) <= 0) {
            pushEvent(s, "citizen_died", "💀", `${lost} citizen${lost > 1 ? "s" : ""} starved to death`);
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

            // ── Expedition event ticking ──────────────────────────
            const expTemplate = getMission(am.missionId);
            if (expTemplate && isExpedition(expTemplate) && am.expeditionResolvedEvents && am.initialDuration) {
              const events = am.expeditionResolvedEvents;
              const totalEvents = events.length;
              // How many events should have fired by now? Evenly spaced across duration.
              const elapsed = am.initialDuration - Math.max(0, am.remaining);
              const shouldHaveFired = Math.min(totalEvents, Math.floor((elapsed / am.initialDuration) * totalEvents + 0.0001) + 1);

              const team = am.adventurerIds.map((id) => s.adventurers.find((a) => a.id === id)).filter(Boolean) as Adventurer[];
              const hpMap = am.expeditionHp ?? {};
              const maxHpMap = am.expeditionMaxHp ?? {};
              const rewards = am.expeditionRewards ?? [];
              const log = am.expeditionLog ?? [];
              const supplies = am.adventurerSupplies ?? {};

              while ((am.expeditionEventIndex ?? 0) < Math.min(shouldHaveFired, totalEvents)) {
                const eventIdx = am.expeditionEventIndex ?? 0;
                const ev = events[eventIdx];

                // Between-event heal (skipped before first event — team starts fresh)
                if (eventIdx > 0) {
                  applyBetweenEventHeal(team, hpMap, maxHpMap);
                  applyRecoveryItems(team, hpMap, maxHpMap, supplies);
                }

                // Seed for deterministic combat simulation in expeditions
                let seed = 0;
                const seedStr = am.missionId + "|" + eventIdx;
                for (let j = 0; j < seedStr.length; j++) seed = ((seed << 5) - seed + seedStr.charCodeAt(j)) | 0;

                resolveExpeditionEvent(ev, {
                  template: expTemplate as any,
                  team,
                  hpMap,
                  maxHpMap,
                  rewards,
                  log,
                  supplies,
                  seed,
                  eventIndex: eventIdx,
                });

                am.expeditionEventIndex = eventIdx + 1;

                // If team wiped, fast-forward to mission completion
                if (isTeamWiped(team, hpMap)) {
                  am.remaining = 0;
                  break;
                }
              }

              // Persist back
              am.expeditionHp = hpMap;
              am.expeditionRewards = rewards;
              am.expeditionLog = log;
              am.adventurerSupplies = supplies;
            }

            if (am.remaining <= 0) {
              // Mission complete — resolve
              const template = getMission(am.missionId);
              const team = am.adventurerIds.map((id) => s.adventurers.find((a) => a.id === id)).filter(Boolean) as Adventurer[];

              const isExped = template && isExpedition(template);

              // Combat simulation for single-encounter missions; expeditions use pre-resolved event data; stat-based for the rest
              const combatResult = (isExped || !template) ? null : simulateCombat(template, team, am.adventurerSupplies);
              const success = isExped
                ? !isTeamWiped(team, am.expeditionHp ?? {})
                : (combatResult ? combatResult.victory : Math.random() * 100 < am.successChance);

              const casualties: string[] = [];
              const revived: string[] = [];
              const levelUps: string[] = [];
              const rankUps: { name: string; newRank: string }[] = [];

              // Expeditions: compute fallen from HP at end of mission. Regular missions: use combat result.
              const expeditionFallenIds = isExped
                ? new Set(team.filter((a) => (am.expeditionHp?.[a.id] ?? 0) <= 0).map((a) => a.id))
                : null;

              if ((!success || (isExped && expeditionFallenIds && expeditionFallenIds.size > 0)) && template) {
                // Check for deaths — tied to combat results when available
                const fallenInCombat = expeditionFallenIds ?? new Set(combatResult?.fallenAdventurerIds ?? []);
                const deadIds: string[] = [];
                for (const adv of team) {
                  const baseChance = calcDeathChance(template, team, adv);
                  let deathChance: number;
                  if (isExped) {
                    // Expedition: fallen during events = death check (HP hit 0)
                    deathChance = fallenInCombat.has(adv.id) ? baseChance * 1.5 : 0;
                  } else if (combatResult) {
                    // Fell in combat: high death chance (base * 1.5)
                    // Survived combat: they made it home alive — no death risk
                    deathChance = fallenInCombat.has(adv.id) ? baseChance * 1.5 : 0;
                  } else {
                    deathChance = baseChance; // non-combat missions: standard chance
                  }
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
                  const advInState = s.adventurers.find((a) => a.id === id);
                  casualties.push(advInState?.name ?? id);
                  if (advInState) {
                    advInState.alive = false;
                    // Equipment lost on death
                    advInState.equipment = { head: null, chest: null, legs: null, boots: null, cloak: null, mainHand: null, offHand: null, ring1: null, ring2: null, amulet: null, trinket: null };
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
                // Expeditions: add rewards accumulated from events (treasure, encounter outcomes, combat loot)
                if (isExped && am.expeditionRewards?.length) {
                  for (const r of am.expeditionRewards) {
                    const existing = rewards.find((x) => x.resource === r.resource);
                    if (existing) existing.amount += r.amount;
                    else rewards.push({ ...r });
                  }
                }
              }

              // Add combat loot from killed enemies
              if (combatResult?.loot?.length) {
                for (const drop of combatResult.loot) {
                  if (drop.type === "resource" && drop.resource) {
                    // Merge resource loot into mission rewards
                    const existing = rewards.find((r) => r.resource === drop.resource);
                    if (existing) {
                      existing.amount += drop.amount;
                    } else {
                      rewards.push({ resource: drop.resource as any, amount: drop.amount });
                    }
                  } else if (drop.type === "item" && drop.itemId) {
                    // Add item to inventory directly
                    const inv = s.inventory.find((i) => i.itemId === drop.itemId);
                    if (inv) {
                      inv.quantity += drop.amount;
                    } else {
                      s.inventory.push({ itemId: drop.itemId!, quantity: drop.amount });
                    }
                    pushEvent(s, "loot_drop", "🎁", `${drop.fromEnemy} dropped ${drop.itemId}!`);
                  }
                }
              }

              // Grant XP — the mission has `slots × baseXp` total XP, split among the deployed team.
              // Going in with fewer adventurers than slots = bigger individual share (risk/reward).
              const baseXp = template ? getMissionXp(template.difficulty, success) : 0;
              const totalSlots = template?.slots.length ?? 1;
              const deployedSize = Math.max(1, team.length);
              const perAdvBase = (baseXp * totalSlots) / deployedSize;
              for (const adv of team) {
                if (!casualties.includes(adv.id)) {
                  const advInState = s.adventurers.find((a) => a.id === adv.id);
                  if (advInState) {
                    const equipStats = getEquipmentStats(advInState.equipment);
                    const stats = calcAdvStats(advInState, equipStats);
                    const wisBonus = 1 + stats.wis * 0.02; // +2% XP per WIS point
                    const traitBonus = advInState.trait === "quick_learner" ? 1.10 : 1;
                    const xpGain = Math.floor(perAdvBase * wisBonus * traitBonus);
                    const result = applyXp(advInState, xpGain);
                    if (result.leveled) levelUps.push(advInState.name);
                    if (result.rankUp && advInState.rank !== result.oldRank) {
                      rankUps.push({ name: advInState.name, newRank: RANK_NAMES[advInState.rank] });
                    }
                  }
                }
              }

              // Grant loyalty to surviving adventurers
              const isDangerous = template ? template.difficulty >= 4 : false;
              for (const adv of team) {
                if (!casualties.includes(adv.id)) {
                  const advInState = s.adventurers.find((a) => a.id === adv.id);
                  if (advInState) {
                    const oldLoyalty = advInState.loyalty ?? 0;
                    const oldRank = getLoyaltyRank(oldLoyalty);
                    let gain = success ? 2 : 0;
                    if (isDangerous) gain += 1; // bonus for surviving dangerous missions
                    // Matched food bonus: +1 loyalty when eaten food matches preference on success
                    if (success) {
                      const foodId = am.adventurerSupplies?.[adv.id]?.food;
                      if (foodId) {
                        const foodItem = getItem(foodId);
                        if (foodItem?.foodFlavors && advInState.foodPreference &&
                            foodItem.foodFlavors.includes(advInState.foodPreference as any)) {
                          gain += MATCHED_FOOD_LOYALTY_BONUS;
                        }
                      }
                    }
                    advInState.loyalty = Math.min(100, oldLoyalty + gain);
                    const newRank = getLoyaltyRank(advInState.loyalty);
                    if (newRank.rank > oldRank.rank) {
                      pushEvent(s, "loyalty_rankup", "💛", `${advInState.name} is now ${newRank.title}!`);
                      unlockOriginRecipes(s, advInState as any, newRank);
                    }
                  }
                }
              }

              // Free surviving adventurers
              for (const id of am.adventurerIds) {
                const adv = s.adventurers.find((a) => a.id === id);
                if (adv) {
                  adv.onMission = false;
                }
              }

              // Rewards are NOT auto-granted — player claims them via the Guild page

              // Log events
              const missionName = template?.name ?? am.missionId;
              if (success) {
                const rewardStr = rewards.map((r) => formatReward(r)).join(", ");
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

              // Mark story mission as completed on success
              if (success && STORY_MISSIONS.some((sm) => sm.id === am.missionId)) {
                if (!s.completedStoryMissions.includes(am.missionId)) {
                  s.completedStoryMissions.push(am.missionId);
                }
              }

              // Record discovered enemies — success or failure, the player has now seen them
              if (template?.encounters) {
                if (!s.discoveredEnemies) s.discoveredEnemies = [];
                for (const enc of template.encounters) {
                  if (!s.discoveredEnemies.includes(enc.enemyId)) {
                    s.discoveredEnemies.push(enc.enemyId);
                  }
                }
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
                ...(combatResult ? {
                  combatLog: combatResult.log,
                  combatRounds: combatResult.rounds,
                  combatVictory: combatResult.victory,
                } : {}),
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
            const usedNames = new Set(s.adventurers.filter((a) => a.alive).map((a) => a.name));
            s.recruitCandidates = [];
            for (let i = 0; i < count; i++) {
              const c = generateCandidate(nextId("adv"), maxRank, usedNames);
              usedNames.add(c.name);
              s.recruitCandidates.push(c);
            }
            s.lastRecruitRefresh = now;
            // Missions — cap difficulty at best adventurer's rank + 1
            const boardSize = getMissionBoardSize(guildLvl);
            const bestRank = s.adventurers.length > 0 ? Math.max(...s.adventurers.map((a) => a.rank)) : 1;
            const maxDiff = Math.min(5, bestRank + 1);
            s.missionBoard = generateMissionBoard({
              guildLevel: guildLvl, count: boardSize, seed: now + s.year * 777, maxDifficulty: maxDiff,
              completedStoryMissions: s.completedStoryMissions, buildings: s.buildings, pens: s.pens,
            });
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
                resources: { ...s.resources, food: getTotalFood(s.foods) },
                population: s.population,
                homeAdventurers: homeAdvs,
              });

              // Log and damage buildings on defeat
              const raidName = template?.name ?? ir.raidId;
              const injured = result.defendersInjured.length;
              if (result.victory) {
                const lootStr = result.loot.map((l) => `+${l.amount} ${l.resource}`).join(", ");
                const parts = [`Repelled ${raidName}!`, `Loot: ${lootStr}`];
                if (injured > 0) parts.push(`Injured: ${injured}`);
                pushEvent(s, "raid_victory", "🛡️", parts.join(" · "));
              } else {
                const lost = result.resourcesLost;
                const lostParts: string[] = [];
                if (lost.gold > 0) lostParts.push(`${lost.gold}g`);
                if (lost.wood > 0) lostParts.push(`${lost.wood}w`);
                if (lost.stone > 0) lostParts.push(`${lost.stone}s`);
                if (lost.food > 0) lostParts.push(`${lost.food}f`);
                const parts = [`Defeated by ${raidName}!`];
                if (lostParts.length > 0) parts.push(`Lost: ${lostParts.join(", ")}`);
                if (result.citizensLost > 0) parts.push(`Citizens lost: ${result.citizensLost}`);
                if (injured > 0) parts.push(`Injured: ${injured}`);
                if (result.buildingsDamaged) parts.push(`Buildings damaged: ${result.buildingsDamaged}`);
                pushEvent(s, "raid_defeat", "💔", parts.join(" · "));
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
                if (result.resourcesLost.food > 0) consumeFood(s.foods, result.resourcesLost.food);
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
          s.missionRerollToday = 0;
          s.recruitRerollToday = 0;
          s.alchemyResearchAvailable = true;
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
    if (Number.isNaN(elapsed) || elapsed < 0) {
      // lastTick is invalid — reset it so the tick loop can resume
      setState("lastTick", now);
      return;
    }
    if (elapsed > 500) {
      try {
        applyTicks(elapsed * getSpeed());
      } catch (err) {
        console.error("Tick error:", err);
        // Reset lastTick so the next tick doesn't accumulate a huge elapsed
        setState("lastTick", Date.now());
      }
    }
  }, TICK_INTERVAL_MS);

  // Catch up when tab becomes visible again (browsers throttle background tabs)
  const handleVisibility = () => {
    if (!document.hidden) {
      const offlineMs = Date.now() - state.lastTick;
      if (offlineMs > 2000) {
        try {
          applyTicks(offlineMs);
        } catch (err) {
          console.error("Visibility catch-up error:", err);
          setState("lastTick", Date.now());
        }
      }
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

  // Save on page refresh/close — keepalive ensures the request survives page unload
  const handleBeforeUnload = () => {
    if (!_settlementId) return;
    const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";
    const token = localStorage.getItem("medieval-realm-token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${apiBase}/settlement/${_settlementId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ gameState: JSON.parse(JSON.stringify(state)) }),
      keepalive: true,
    }).catch(() => {});
  };
  window.addEventListener("beforeunload", handleBeforeUnload);

  onCleanup(() => {
    clearInterval(tickInterval);
    if (localSaveInterval) clearInterval(localSaveInterval);
    clearInterval(apiSaveInterval);
    if (_debouncedSaveTimer) clearTimeout(_debouncedSaveTimer);
    document.removeEventListener("visibilitychange", handleVisibility);
    document.removeEventListener("visibilitychange", handleVisibilitySave);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    _latestStateGetter = null;
    saveGame(JSON.parse(JSON.stringify(state)));
  });

  const actions: GameActions = {
    upgradeBuilding(buildingId) {
      const pb = state.buildings.find((b) => b.buildingId === buildingId);
      if (!pb || pb.upgrading) return false;
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def || !isBuildingUnlocked(def, getTownHallLevel(state.buildings))) return false;

      // Check Town Hall-gated level cap (no building may exceed TH level)
      const thLevel = getTownHallLevel(state.buildings);
      const effectiveMax = getEffectiveMaxLevel(def, thLevel);
      if (pb.level >= effectiveMax) return false;

      // Check tier upgrade prerequisites for Town Hall
      if (buildingId === "town_hall") {
        const { met } = getTierPrerequisitesMet(pb.level + 1, state.buildings);
        if (!met) return false;
      }

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
      scheduleSave();
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
        s.fields.push({
          id, level: 0,
          upgrading: true, upgradeRemaining: getFieldBuildTime(0),
          crop: null, harvested: false,
          lastCrop: null, sameCropStreak: 0, restBonus: false,
        });
      }));
      scheduleSave();
      return true;
    },

    plantField(fieldId, crop) {
      if (state.season !== "spring") return false;
      const field = state.fields.find((f) => f.id === fieldId);
      if (!field || field.upgrading || field.level === 0) return false;
      if (field.crop !== null) return false; // already planted
      setState(produce((s) => {
        const f = s.fields.find((f) => f.id === fieldId)!;
        f.crop = crop;
        f.harvested = false;
        // Update rotation tracking: same crop in a row = depleted streak grows,
        // different crop = streak resets. This determines yield at harvest.
        if (f.lastCrop === crop) {
          f.sameCropStreak += 1;
        } else {
          f.sameCropStreak = 0;
        }
        f.lastCrop = crop;
      }));
      scheduleSave();
      return true;
    },

    upgradeField(fieldId) {
      const field = state.fields.find((f) => f.id === fieldId);
      if (!field || field.upgrading || field.level >= FIELD_MAX_LEVEL) return false;
      // Can only upgrade empty or fallow fields (not planted ones)
      if (field.crop !== null) return false;
      // Winter-only: fields can only be worked when the ground is dormant.
      // Creates a yearly cycle — winter upgrades, spring plants, etc.
      if (state.season !== "winter") return false;
      // TH-gated: fields can't exceed the current Town Hall level, same rule as buildings.
      if (field.level >= getTownHallLevel(state.buildings)) return false;
      const cost = getFieldCost(field.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const f = s.fields.find((f) => f.id === fieldId)!;
        f.upgrading = true;
        f.upgradeRemaining = getFieldBuildTime(field.level);
      }));
      scheduleSave();
      return true;
    },

    removeField(fieldId) {
      setState(produce((s) => {
        const idx = s.fields.findIndex((f) => f.id === fieldId);
        if (idx !== -1) s.fields.splice(idx, 1);
      }));
      scheduleSave();
    },

    // Gardens use fixed pre-attributed slots (one per veggie), so there's no
    // build-by-type action. upgradeGarden handles both the initial 0→1 build
    // (available any season) and subsequent level-ups (winter + TH gated).

    upgradeGarden(gardenId) {
      const garden = state.gardens.find((g) => g.id === gardenId);
      if (!garden || garden.upgrading || garden.level >= GARDEN_MAX_LEVEL) return false;
      // Level 1+ upgrades mirror the field rules: winter only, TH-capped.
      if (garden.level >= 1) {
        if (state.season !== "winter") return false;
        if (garden.level >= getTownHallLevel(state.buildings)) return false;
      }
      const cost = getGardenCost(garden.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const g = s.gardens.find((g) => g.id === gardenId)!;
        g.upgrading = true;
        g.upgradeRemaining = getGardenBuildTime(garden.level);
      }));
      scheduleSave();
      return true;
    },

    plantGarden(gardenId) {
      const garden = state.gardens.find((g) => g.id === gardenId);
      if (!garden || garden.upgrading || garden.level === 0) return false;
      const veggie = getVeggie(garden.veggie);
      if (!canPlantVeggie(veggie, state.season)) return false;
      if (garden.plantedYear === state.year) return false; // already sown this cycle
      const cost = getSeedCost(veggie, garden.level);
      if (state.resources.gold < cost) return false;
      setState(produce((s) => {
        s.resources.gold -= cost;
        const g = s.gardens.find((g) => g.id === gardenId)!;
        g.plantedYear = s.year;
      }));
      scheduleSave();
      return true;
    },

    // Pens use pre-attributed slots (one per animal). upgradePen handles 0→1
    // build (any season) and level-ups (winter + TH capped, mirrors gardens).
    upgradePen(penId) {
      const pen = state.pens.find((p) => p.id === penId);
      if (!pen || pen.upgrading || pen.level >= PEN_MAX_LEVEL) return false;
      if (pen.level >= 1) {
        if (state.season !== "winter") return false;
        if (pen.level >= getTownHallLevel(state.buildings)) return false;
      }
      const base = getPenCost(pen.level);
      // Shepherd brings her own flock — first sheep pen doesn't cost gold.
      const goldCost = pen.animal === "sheep" && pen.level === 0 ? 0 : base.gold;
      if (state.resources.wood < base.wood || state.resources.stone < base.stone || state.resources.gold < goldCost) return false;
      setState(produce((s) => {
        s.resources.wood -= base.wood;
        s.resources.stone -= base.stone;
        s.resources.gold -= goldCost;
        const p = s.pens.find((p) => p.id === penId)!;
        p.upgrading = true;
        p.upgradeRemaining = getPenBuildTime(pen.level);
      }));
      scheduleSave();
      return true;
    },

    // ── Hives (Apiary) ──
    upgradeHive(hiveId) {
      const hive = state.hives.find((h) => h.id === hiveId);
      if (!hive || hive.upgrading || hive.level >= HIVE_MAX_LEVEL) return false;
      if (hive.level >= 1) {
        if (state.season !== "winter") return false;
        if (hive.level >= getTownHallLevel(state.buildings)) return false;
      }
      const cost = getHiveCost(hive.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone || state.resources.gold < cost.gold) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.resources.gold -= cost.gold;
        const h = s.hives.find((h) => h.id === hiveId)!;
        h.upgrading = true;
        h.upgradeRemaining = getHiveBuildTime(hive.level);
      }));
      scheduleSave();
      return true;
    },

    // ── Orchards ──
    upgradeOrchard(orchardId) {
      const orchard = state.orchards.find((o) => o.id === orchardId);
      if (!orchard || orchard.upgrading || orchard.level >= ORCHARD_MAX_LEVEL) return false;
      if (orchard.level >= 1) {
        if (state.season !== "winter") return false;
        if (orchard.level >= getTownHallLevel(state.buildings)) return false;
      }
      const cost = getOrchardCost(orchard.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone || state.resources.gold < cost.gold) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.resources.gold -= cost.gold;
        const o = s.orchards.find((o) => o.id === orchardId)!;
        o.upgrading = true;
        o.upgradeRemaining = getOrchardBuildTime(orchard.level);
      }));
      scheduleSave();
      return true;
    },

    setGameSpeed(speed) { setState("gameSpeed", speed); },
    renameVillage(name) {
      const trimmed = name.trim();
      if (trimmed.length > 0 && trimmed.length <= 30) {
        setState("villageName", trimmed);
        scheduleSave();
      }
    },

    resetGame() {
      idCounter = 1;
      const fresh = createInitialState();
      setState(reconcile(fresh));
      saveGame(fresh);
    },

    markIntroSeen() {
      setState("introSeen", true);
      scheduleSave();
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
      return getEffectiveMaxLevel(def, getTownHallLevel(state.buildings));
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
      scheduleSave();
      return true;
    },
    dismissAdventurer(adventurerId) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      setState(produce((s) => {
        s.adventurers = s.adventurers.filter((a) => a.id !== adventurerId);
      }));
      scheduleSave();
      return true;
    },
    deployMission(missionId, adventurerIds, adventurerSupplies = {}, precomputedSuccess?: number) {
      const guildLvl = this.getGuildLevel();
      if (guildLvl === 0) return false;

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

      const successChance = precomputedSuccess ?? calcSuccessChance(template, team, 0, adventurerSupplies);
      let effectiveDuration = calcEffectiveDuration(template, team);

      // Apply equipment duration/loot mods
      for (const adv of team) {
        for (const slot of ["head", "chest", "legs", "boots", "cloak", "mainHand", "offHand", "ring1", "ring2", "amulet", "trinket"] as const) {
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
        // Consume per-adventurer supplies from inventory
        for (const advId of adventurerIds) {
          const sup = adventurerSupplies[advId];
          if (!sup) continue;
          for (const itemId of [sup.potion, sup.food, sup.recovery]) {
            if (!itemId) continue;
            const inv = s.inventory.find((i) => i.itemId === itemId);
            if (inv && inv.quantity > 0) inv.quantity -= 1;
          }
        }
        const activeMission: any = {
          missionId: template.id,
          adventurerIds: [...adventurerIds],
          remaining: effectiveDuration,
          successChance,
          adventurerSupplies: { ...adventurerSupplies },
        };

        // Expedition-specific state: snapshot resolved events, init HP maps, initialDuration
        if (isExpedition(template)) {
          const expTemplate = template;
          const resolvedEvents: any[] = [];
          // Use a deterministic seed per mission so resolution is stable across reloads
          let seed = 0;
          const seedStr = template.id + "|" + adventurerIds.join(",");
          for (let i = 0; i < seedStr.length; i++) seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;
          let s2 = seed;
          const rand = () => { s2 = (s2 * 1664525 + 1013904223) & 0x7fffffff; return s2 / 0x7fffffff; };
          for (const slot of expTemplate.events) {
            const chosen = resolveEventSlot(slot, rand);
            if (chosen) resolvedEvents.push(chosen);
          }
          const hpMap: Record<string, number> = {};
          const maxHpMap: Record<string, number> = {};
          for (const adv of team) {
            const m = calcAdventurerMaxHp(adv);
            hpMap[adv.id] = m;
            maxHpMap[adv.id] = m;
          }
          activeMission.expeditionEventIndex = 0;
          activeMission.expeditionHp = hpMap;
          activeMission.expeditionMaxHp = maxHpMap;
          activeMission.expeditionResolvedEvents = resolvedEvents;
          activeMission.initialDuration = effectiveDuration;
          activeMission.expeditionLog = [];
          activeMission.expeditionRewards = [];
        }

        s.activeMissions.push(activeMission);
        // Remove from mission board so it can't be repeated
        s.missionBoard = s.missionBoard.filter((m) => m.id !== template.id);
        s.firstMissionSent = true;
      }));
      scheduleSave();
      return true;
    },
    collectCompletedMissions() {
      const completed = [...state.completedMissions];
      if (completed.length > 0) {
        setState(produce((s) => { s.completedMissions = []; }));
        scheduleSave();
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
    startCraft(recipeId, quantity = 1) {
      const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
      if (!recipe || quantity < 1) return false;
      const building = state.buildings.find((b) => b.buildingId === recipe.building);
      if (!building || building.level < recipe.minLevel || building.damaged) return false;
      // Check building tool requirements
      const missingTool = getRequiredTool(recipe, state.buildingTools?.[recipe.building] ?? []);
      if (missingTool) return false;
      // Queue is unlimited. Slots just gate how many items in this building
      // can be PARALLEL-crafted — any overflow enters the queue as `pending`
      // and picks up automatically when a peer finishes.
      // Check costs for total quantity
      const getResourceAmount = (res: string): number => {
        if (res === "wool") return state.wool;
        if (res === "fiber") return state.fiber;
        if (res === "iron") return state.iron;
        if (res === "leather") return state.leather;
        if (res === "gold") return state.resources.gold;
        if (res === "wood") return state.resources.wood;
        if (res === "stone") return state.resources.stone;
        if (res === "food") return getTotalFood(state.foods);
        if (res === "honey") return state.honey;
        if (res === "astralShards") return state.astralShards;
        // Food items (wheat, meat, eggs, ...) and the "grain" alias
        if (res === "grain" || isFoodItemType(res)) return getFoodCostAmount(state.foods, res);
        const inv = state.inventory.find((i) => i.itemId === res);
        return inv?.quantity ?? 0;
      };
      for (const cost of recipe.costs) {
        if (getResourceAmount(cost.resource) < cost.amount * quantity) return false;
      }
      setState(produce((s) => {
        // Deduct total cost upfront
        for (const cost of recipe.costs) {
          const total = cost.amount * quantity;
          const res = cost.resource;
          if (res === "wool") s.wool -= total;
          else if (res === "fiber") s.fiber -= total;
          else if (res === "iron") s.iron -= total;
          else if (res === "leather") s.leather -= total;
          else if (res === "gold") s.resources.gold -= total;
          else if (res === "wood") s.resources.wood -= total;
          else if (res === "stone") s.resources.stone -= total;
          else if (res === "food") consumeFood(s.foods, total);
          else if (res === "honey") s.honey = Math.max(0, s.honey - total);
          else if (res === "astralShards") s.astralShards -= total;
          else if (res === "grain" || isFoodItemType(res)) consumeFoodCost(s.foods, res, total);
          else {
            const inv = s.inventory.find((i) => i.itemId === res);
            if (inv) inv.quantity -= total;
          }
        }
        // Stack onto the existing entry if one's already crafting this recipe,
        // otherwise push a new queue entry — active if a slot's free in this
        // building, pending otherwise.
        const existing = s.craftingQueue.find((c) => c.recipeId === recipeId);
        if (existing) {
          existing.quantity = (existing.quantity ?? 1) + quantity;
        } else {
          const activeInBuilding = s.craftingQueue.filter((c) => {
            if (c.pending) return false;
            const r = CRAFTING_RECIPES.find((cr) => cr.id === c.recipeId);
            return r?.building === recipe.building;
          }).length;
          const consumableBonus = recipe.building === "kitchen" ? 1 : 0;
          const maxSlots = building.level + consumableBonus;
          const pending = activeInBuilding >= maxSlots;
          s.craftingQueue.push({
            recipeId,
            remaining: recipe.craftTime,
            quantity,
            pending,
          });
        }
      }));
      scheduleSave();
      return true;
    },
    getAvailableRecipes() {
      return CRAFTING_RECIPES.filter((r) => {
        const building = state.buildings.find((b) => b.buildingId === r.building);
        return building && building.level >= r.minLevel;
      });
    },
    installBuildingTool(toolId: string, targetBuildingId: string) {
      const toolDef = getBuildingTool(toolId);
      if (!toolDef || toolDef.targetBuilding !== targetBuildingId) return false;
      // Check tool is in inventory
      const inv = state.inventory.find((i) => i.itemId === toolId);
      if (!inv || inv.quantity < 1) return false;
      // Check target building exists
      const building = state.buildings.find((b) => b.buildingId === targetBuildingId);
      if (!building || building.level < 1) return false;
      // Check not already installed
      const installed = state.buildingTools?.[targetBuildingId] ?? [];
      if (installed.includes(toolId)) return false;
      setState(produce((s) => {
        // Remove from inventory
        const inv = s.inventory.find((i) => i.itemId === toolId);
        if (inv) {
          inv.quantity -= 1;
          if (inv.quantity <= 0) {
            s.inventory.splice(s.inventory.indexOf(inv), 1);
          }
        }
        // Install in building
        if (!s.buildingTools) s.buildingTools = {};
        if (!s.buildingTools[targetBuildingId]) s.buildingTools[targetBuildingId] = [];
        s.buildingTools[targetBuildingId].push(toolId);
        const buildingName = BUILDINGS.find((b) => b.id === targetBuildingId)?.name ?? targetBuildingId;
        pushEvent(s, "building_completed", toolDef.icon, `Installed ${toolDef.name} at ${buildingName}`);
      }));
      scheduleSave();
      return true;
    },
    getInstalledTools(buildingId: string) {
      return state.buildingTools?.[buildingId] ?? [];
    },
    enchantItem(enchantId, adventurerId, slot, inventoryIdx) {
      const ench = getEnchantment(enchantId);
      if (!ench) return false;
      const tower = state.buildings.find((b) => b.buildingId === "mage_tower");
      if (!tower || tower.level < ench.minTowerLevel) return false;

      // Check valid slot
      if (slot && !ench.validSlots.includes(slot as any)) return false;

      // Check costs
      for (const cost of ench.costs) {
        const inv = state.inventory.find((i) => i.itemId === cost.resource);
        if (!inv || inv.quantity < cost.amount) return false;
      }

      setState(produce((s) => {
        // Deduct costs
        for (const cost of ench.costs) {
          const inv = s.inventory.find((i) => i.itemId === cost.resource);
          if (inv) inv.quantity -= cost.amount;
        }

        if (adventurerId && slot) {
          // Enchant equipped item
          const adv = s.adventurers.find((a) => a.id === adventurerId);
          if (!adv) return;
          if (!adv.equipmentEnchants) adv.equipmentEnchants = {};
          if (!adv.equipmentEnchants[slot]) adv.equipmentEnchants[slot] = [];
          adv.equipmentEnchants[slot]!.push(enchantId);
        } else if (inventoryIdx !== null && inventoryIdx >= 0) {
          // Enchant inventory item — unstack if qty > 1
          const inv = s.inventory[inventoryIdx];
          if (!inv) return;
          if (inv.quantity > 1) {
            // Unstack: reduce qty by 1, create new entry with enchantment
            inv.quantity -= 1;
            s.inventory.push({ itemId: inv.itemId, quantity: 1, enchantments: [...(inv.enchantments ?? []), enchantId] });
          } else {
            // Single item: add enchantment in place
            if (!inv.enchantments) inv.enchantments = [];
            inv.enchantments.push(enchantId);
          }
        }
      }));
      scheduleSave();
      return true;
    },
    getClothingInfo() {
      return {
        current: Math.round(state.clothing),
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
      scheduleSave();
      return true;
    },
    unlockTalent(adventurerId, talentId) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      if (!canUnlockTalent(adv, talentId)) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((a) => a.id === adventurerId)!;
        if (!a.talents) a.talents = [];
        a.talents.push(talentId);
      }));
      scheduleSave();
      return true;
    },
    resetTalents(adventurerId) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      if (!adv.talents?.length) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((a) => a.id === adventurerId)!;
        a.talents = [];
      }));
      scheduleSave();
      return true;
    },
    equipItem(adventurerId, itemId) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      const itemDef = getItem(itemId);
      if (!itemDef) return false;
      // Class restriction (themed items like wizard_hat, priest_circlet)
      if (itemDef.classes.length > 0 && !itemDef.classes.includes(adv.class)) return false;
      // Armor type restriction — check base class access + talent grants
      if (itemDef.armorType) {
        const access = getArmorAccess(adv.class, adv.talents);
        if (!access.has(itemDef.armorType)) return false;
      }
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
        // 2H weapon clears offHand
        if (itemDef.slot === "mainHand" && itemDef.twoHanded && a.equipment.offHand) {
          const offId = a.equipment.offHand;
          a.equipment.offHand = null;
          const offInv = s.inventory.find((i) => i.itemId === offId);
          if (offInv) offInv.quantity += 1;
          else s.inventory.push({ itemId: offId, quantity: 1 });
        }
        // Equipping offHand clears 2H mainHand
        if (itemDef.slot === "offHand" && a.equipment.mainHand) {
          const mainItem = getItem(a.equipment.mainHand);
          if (mainItem?.twoHanded) {
            const mainId = a.equipment.mainHand;
            a.equipment.mainHand = null;
            const mainInv = s.inventory.find((i) => i.itemId === mainId);
            if (mainInv) mainInv.quantity += 1;
            else s.inventory.push({ itemId: mainId, quantity: 1 });
          }
        }
        const newInv = s.inventory.find((i) => i.itemId === itemId)!;
        newInv.quantity -= 1;
      }));
      scheduleSave();
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
      scheduleSave();
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
      else if (netFood < 0) factors.push({ label: "Food deficit", value: -Math.min(40, Math.round(Math.abs(netFood) / 2)) });
      if (state.starvationPenalty > 0) {
        const val = -Math.round(state.starvationPenalty);
        factors.push({ label: getTotalFood(state.foods) <= 0 ? "Starvation" : "Famine recovery (fading)", value: val });
      }

      const maxPop = calcMaxPopulation(state.buildings);
      if (state.population > maxPop) factors.push({ label: "Overcrowded", value: -15 });

      const shrineLvl = state.buildings.find((b) => b.buildingId === "shrine")?.level ?? 0;
      if (shrineLvl > 0) factors.push({ label: `Shrine Lv.${shrineLvl}`, value: shrineLvl * SHRINE_HAPPINESS_PER_LEVEL });

      // Solara's blessing
      if (state.activeBlessing?.effect?.startsWith("happiness:")) {
        const bonus = parseInt(state.activeBlessing.effect.split(":")[1]);
        if (bonus) factors.push({ label: "Solara's Warmth", value: bonus });
      }

      const tavernLvl = state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
      if (tavernLvl > 0) {
        const hasAle = state.ale > 0;
        factors.push({ label: `Tavern Lv.${tavernLvl}${hasAle ? "" : " (dry)"}`, value: tavernLvl * (hasAle ? TAVERN_HAPPINESS_PER_LEVEL : TAVERN_HAPPINESS_DRY) });
      }

      // Clothing
      const clothNeeded = Math.ceil(state.population / CLOTHING_PER_CITIZENS);
      if (clothNeeded > 0) {
        const clothRatio = Math.min(1, state.clothing / clothNeeded);
        if (clothRatio >= 1) {
          factors.push({ label: `Well-clothed (${Math.round(state.clothing)}/${clothNeeded})`, value: CLOTHING_HAPPINESS_BONUS });
        } else if (clothRatio < 0.5) {
          const penalty = -Math.round(5 + 10 * (1 - clothRatio * 2));
          const winterPenalty = state.season === "winter" ? penalty * 2 : penalty;
          factors.push({ label: `Poorly clothed (${Math.round(state.clothing)}/${clothNeeded})${state.season === "winter" ? " — freezing" : ""}`, value: winterPenalty });
        }
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
      if (getTotalFood(state.foods) > 0) {
        if (ft <= 1) factors.push({ label: `Monotonous diet (${ft} type)`, value: -12 });
        else if (ft === 2) factors.push({ label: `Bland diet (${ft} types)`, value: -5 });
        else if (ft === 3) factors.push({ label: `Good diet (${ft} types)`, value: 3 });
        else if (ft === 4) factors.push({ label: `Varied diet (${ft} types)`, value: 6 });
        else if (ft >= 5) factors.push({ label: `Diverse feast (${ft} types)`, value: 10 });
      }

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
      scheduleSave();
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
        scheduleSave();
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

      scheduleSave();
      return { recalled: recalledCount, instant: hasWizard };
    },
    spawnTestMissions(...missionIds: string[]) {
      const missions = missionIds.length > 0
        ? missionIds.map((id) => MISSION_POOL.find((m) => m.id === id)).filter(Boolean) as MissionTemplate[]
        : MISSION_POOL; // no args = all missions
      if (missions.length === 0) return;
      setState(produce((s) => {
        s.missionBoard = [...missions];
      }));
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
      scheduleSave();
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
      scheduleSave();
      return true;
    },
    rerollMissions() {
      const rerollCount = typeof state.missionRerollToday === "number" ? state.missionRerollToday : 0;
      const cost = 10 * Math.pow(2, rerollCount);
      if (state.astralShards < cost) return false;
      const guildLvl = this.getGuildLevel();
      if (guildLvl === 0) return false;
      setState(produce((s) => {
        s.astralShards -= cost;
        s.missionRerollToday = rerollCount + 1;
        const boardSize = getMissionBoardSize(guildLvl);
        const bestRank = s.adventurers.length > 0 ? Math.max(...s.adventurers.map((a) => a.rank)) : 1;
        const maxDiff = Math.min(5, bestRank + 1);
        s.missionBoard = generateMissionBoard({
          guildLevel: guildLvl, count: boardSize, seed: Date.now(), maxDifficulty: maxDiff,
          completedStoryMissions: s.completedStoryMissions, buildings: s.buildings, pens: s.pens,
        });
      }));
      scheduleSave();
      return true;
    },
    devSpawnAllNoviceMissions() {
      setState(produce((s) => {
        s.missionBoard = [...NOVICE_MISSIONS];
      }));
      scheduleSave();
    },
    rerollRecruits() {
      const rerollCount = typeof state.recruitRerollToday === "number" ? state.recruitRerollToday : 0;
      const cost = 10 * Math.pow(2, rerollCount);
      if (state.astralShards < cost) return false;
      const guildLvl = this.getGuildLevel();
      if (guildLvl === 0) return false;
      setState(produce((s) => {
        s.astralShards -= cost;
        s.recruitRerollToday = rerollCount + 1;
        const count = getCandidateCount(guildLvl);
        const maxRank = getMaxRecruitRank(guildLvl, s.adventurers);
        const usedNames = new Set(s.adventurers.filter((a) => a.alive).map((a) => a.name));
        s.recruitCandidates = [];
        for (let i = 0; i < count; i++) {
          const c = generateCandidate(nextId("adv"), maxRank, usedNames);
          usedNames.add(c.name);
          s.recruitCandidates.push(c);
        }
      }));
      scheduleSave();
      return true;
    },
    grantResources(amount) {
      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);
        s.resources.gold = Math.min(caps.gold, s.resources.gold + amount);
        s.resources.wood = Math.min(caps.wood, s.resources.wood + amount);
        s.resources.stone = Math.min(caps.stone, s.resources.stone + amount);
        addFood(s.foods, "wheat", amount, caps.food);
        s.wool = Math.min(200, s.wool + amount);
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
      scheduleSave();
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
          } else if (reward.resource === "wool") {
            s.wool = Math.min(200, s.wool + reward.amount);
          } else {
            const key = reward.resource as keyof typeof s.resources;
            s.resources[key] = Math.min(caps[key], s.resources[key] + reward.amount);
          }
        }

        // Check if the NEXT quest triggers a raid
        const nextQuest = QUEST_CHAIN[questIdx + 1];
        if (nextQuest?.triggersRaid && s.incomingRaids.length === 0) {
          // Spawn a weak, slow raid — 12 hours (43200 game-seconds)
          s.incomingRaids.push({
            raidId: "hungry_bandits",
            remaining: 43200,
            strength: 10, // very weak
            warned: true,
          });
          pushEvent(s, "raid_incoming", "⚠️", "Your adventurers spotted bandits heading this way! Estimated arrival: 12 hours.");
        }
      }));
      scheduleSave();
      return true;
    },
    getHerbCount(herbId) {
      return state.herbs?.[herbId] ?? 0;
    },
    makeOffering(deityId) {
      const deity = getDeity(deityId);
      if (!deity) return false;
      const shrineLvl = state.buildings.find((b) => b.buildingId === "shrine")?.level ?? 0;
      if (shrineLvl === 0) return false;

      // Check if player can afford offering
      for (const cost of deity.offeringCost) {
        const res = cost.resource;
        if (res === "gold" && state.resources.gold < cost.amount) return false;
        if (res === "food" && getTotalFood(state.foods) < cost.amount) return false;
        if (res === "wood" && state.resources.wood < cost.amount) return false;
        if (res === "stone" && state.resources.stone < cost.amount) return false;
        if (res === "wool" && state.wool < cost.amount) return false;
        if (res === "iron" && state.iron < cost.amount) return false;
        if (res === "weapons" && state.weapons < cost.amount) return false;
        if (res === "clothing" && state.clothing < cost.amount) return false;
        if (res === "astralShards" && state.astralShards < cost.amount) return false;
      }

      setState(produce((s) => {
        // Deduct offering costs
        for (const cost of deity.offeringCost) {
          const res = cost.resource;
          if (res === "gold") s.resources.gold -= cost.amount;
          else if (res === "food") consumeFood(s.foods, cost.amount);
          else if (res === "wood") s.resources.wood -= cost.amount;
          else if (res === "stone") s.resources.stone -= cost.amount;
          else if (res === "wool") s.wool -= cost.amount;
          else if (res === "iron") s.iron -= cost.amount;
          else if (res === "weapons") s.weapons -= cost.amount;
          else if (res === "clothing") s.clothing -= cost.amount;
          else if (res === "astralShards") s.astralShards -= cost.amount;
        }
        // Set blessing
        s.activeBlessing = { deityId: deity.id, effect: deity.blessingEffect };
        pushEvent(s, "building_completed", deity.icon, `${deity.name}'s blessing received: ${deity.blessingDescription}`);
      }));
      scheduleSave();
      return true;
    },
    startAlchemyResearch() {
      const labLvl = state.buildings.find((b) => b.buildingId === "alchemy_lab")?.level ?? 0;
      if (labLvl === 0) return false;
      if (!state.alchemyResearchAvailable) return false;
      if (state.resources.gold < RESEARCH_BASE_COST) return false;

      const discoverable = getDiscoverableRecipes(labLvl, state.discoveredRecipes ?? []);
      if (discoverable.length === 0) return false;

      setState(produce((s) => {
        s.resources.gold -= RESEARCH_BASE_COST;
        s.alchemyResearchAvailable = false;

        // Roll for discovery
        for (const recipe of discoverable) {
          if (Math.random() < recipe.discoveryChance) {
            s.discoveredRecipes = [...(s.discoveredRecipes ?? []), recipe.id];
            pushEvent(s, "building_completed", recipe.icon, `Alchemy breakthrough! Discovered: ${recipe.name}`);
            break; // only discover one per research
          }
        }
      }));
      scheduleSave();
      return true;
    },
    startAlchemyCraft(recipeId: string, quantity = 1) {
      if (quantity < 1) return false;
      const labLvl = state.buildings.find((b) => b.buildingId === "alchemy_lab")?.level ?? 0;
      if (labLvl === 0) return false;
      const lab = state.buildings.find((b) => b.buildingId === "alchemy_lab");
      if (lab?.damaged) return false;

      const recipe = ALCHEMY_RECIPES.find((r) => r.id === recipeId);
      if (!recipe || recipe.minLabLevel > labLvl) return false;

      // Must be a starter recipe or discovered
      if (!recipe.starterRecipe && !(state.discoveredRecipes ?? []).includes(recipeId)) return false;

      // Check herb costs for the full quantity
      for (const cost of recipe.costs) {
        const have = state.herbs?.[cost.resource] ?? 0;
        if (have < cost.amount * quantity) return false;
      }

      setState(produce((s) => {
        for (const cost of recipe.costs) {
          if (!s.herbs) s.herbs = {};
          s.herbs[cost.resource] = (s.herbs[cost.resource] ?? 0) - cost.amount * quantity;
        }
        // Stack onto existing alchemy queue entry, or push new (pending if over slot cap)
        const existing = s.craftingQueue.find((c) => c.recipeId === recipeId);
        if (existing) {
          existing.quantity = (existing.quantity ?? 1) + quantity;
        } else {
          const activeAlchemy = s.craftingQueue.filter((c) =>
            !c.pending && ALCHEMY_RECIPES.some((r) => r.id === c.recipeId)
          ).length;
          const pending = activeAlchemy >= labLvl + 1;
          s.craftingQueue.push({ recipeId, remaining: recipe.craftTime, quantity, pending });
        }
      }));
      scheduleSave();
      return true;
    },
    claimMissionReward(index) {
      const mission = state.completedMissions[index];
      if (!mission) return;
      const herbIds = new Set(HERBS.map((h) => h.id));
      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);
        for (const reward of mission.rewards) {
          // reward.resource is typed as RewardType but the loot pipeline widens
          // it with `as any` to include material IDs, food types, etc. — treat
          // it as a plain string here.
          const res = reward.resource as string;
          if (res === "astralShards") {
            s.astralShards += reward.amount;
          } else if (herbIds.has(res)) {
            if (!s.herbs) s.herbs = {};
            s.herbs[res] = (s.herbs[res] ?? 0) + reward.amount;
          } else if (res === "gold" || res === "wood" || res === "stone") {
            const key = res as keyof typeof s.resources;
            s.resources[key] = Math.min(caps[key], s.resources[key] + reward.amount);
          } else if (res === "food") {
            // Legacy generic "food" reward — credit as wheat
            addFood(s.foods, "wheat", reward.amount, caps.food);
          } else if (isFoodItemType(res)) {
            addFood(s.foods, res, reward.amount, caps.food);
          } else if (res === "wool") s.wool = Math.min(200, s.wool + reward.amount);
          else if (res === "fiber") s.fiber = Math.min(200, s.fiber + reward.amount);
          else if (res === "leather") s.leather = Math.min(200, s.leather + reward.amount);
          else if (res === "iron") s.iron = Math.min(300, s.iron + reward.amount);
          else if (res === "honey") s.honey = s.honey + reward.amount;
          else {
            // Material or item → add to inventory
            const existing = s.inventory.find((i) => i.itemId === res);
            if (existing) existing.quantity += reward.amount;
            else s.inventory.push({ itemId: res, quantity: reward.amount });
          }
        }
        s.completedMissions.splice(index, 1);
      }));
      scheduleSave();
    },
    applyCoopClaim(response, expeditionId) {
      // Apply server-authoritative coop results: rewards to resources, deaths to
      // adventurers, XP + potential level/rank ups. Returns a CompletedMission
      // shape so the caller can hand it to the existing LootModal.
      const herbIds = new Set(HERBS.map((h) => h.id));
      const casualties: string[] = [];
      const levelUps: string[] = [];
      const rankUps: { name: string; newRank: string }[] = [];
      let totalXp = 0;

      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);
        for (const reward of response.rewards) {
          if (reward.resource === "astralShards") {
            s.astralShards += reward.amount;
          } else if (herbIds.has(reward.resource)) {
            if (!s.herbs) s.herbs = {};
            s.herbs[reward.resource] = (s.herbs[reward.resource] ?? 0) + reward.amount;
          } else {
            const key = reward.resource as keyof typeof s.resources;
            if (key in s.resources) {
              s.resources[key] = Math.min(caps[key], s.resources[key] + reward.amount);
            }
          }
        }

        for (const outcome of response.myAdventurers) {
          const adv = s.adventurers.find((a) => a.id === outcome.id);
          if (!adv) continue;
          if (outcome.died) {
            adv.alive = false;
            casualties.push(adv.name);
            continue;
          }
          if (outcome.xpGained > 0) {
            const oldRank = adv.rank;
            const result = applyXp(adv, outcome.xpGained);
            totalXp += outcome.xpGained;
            if (result.leveled) levelUps.push(adv.name);
            if (result.rankUp && adv.rank !== oldRank) {
              rankUps.push({ name: adv.name, newRank: RANK_NAMES[adv.rank] });
            }
          }
        }
      }));
      scheduleSave();

      return {
        missionId: expeditionId,
        success: response.success,
        rewards: response.rewards.map((r) => ({ resource: r.resource as any, amount: r.amount })),
        casualties,
        revived: [],
        xpGained: totalXp,
        levelUps,
        rankUps,
      };
    },
    skipRaidTimer() {
      if (state.incomingRaids.length === 0) return;
      setState(produce((s) => {
        for (const raid of s.incomingRaids) {
          raid.remaining = 0;
        }
      }));
    },
    skipMissionTimers() {
      if (state.activeMissions.length === 0) return;
      setState(produce((s) => {
        for (const m of s.activeMissions) {
          m.remaining = 0;
        }
      }));
    },
    devAddShards(amount) {
      setState(produce((s) => { s.astralShards += amount; }));
      scheduleSave();
    },
    trade(give, giveAmount, receive, receiveAmount) {
      const marketLevel = state.buildings.find((b) => b.buildingId === "marketplace")?.level ?? 0;
      if (marketLevel === 0) return false;

      // Read current stock of a tradable resource (handles base resources, food total,
      // and top-level fields like wool/fiber/iron/ale/honey/fruit).
      const readAmount = (key: string): number => {
        if (key === "gold" || key === "wood" || key === "stone") {
          return state.resources[key as keyof ResourceState] ?? 0;
        }
        if (key === "food")  return getTotalFood(state.foods);
        if (key === "iron")  return state.iron ?? 0;
        if (key === "wool")  return state.wool ?? 0;
        if (key === "fiber") return state.fiber ?? 0;
        if (key === "ale")   return state.ale ?? 0;
        if (key === "honey") return state.honey ?? 0;
        if (key === "fruit") {
          const f = state.foods ?? {};
          return (f.apples ?? 0) + (f.pears ?? 0) + (f.cherries ?? 0);
        }
        return 0;
      };

      if (readAmount(give) < giveAmount) return false;

      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);

        // Deduct the "give" side
        if (give === "gold" || give === "wood" || give === "stone") {
          s.resources[give as keyof ResourceState] -= giveAmount;
        } else if (give === "food") {
          consumeFood(s.foods, giveAmount);
        } else if (give === "iron")  s.iron -= giveAmount;
        else if (give === "wool")    s.wool -= giveAmount;
        else if (give === "fiber")   s.fiber -= giveAmount;
        else if (give === "ale")     s.ale = Math.max(0, s.ale - giveAmount);
        else if (give === "honey")   s.honey = Math.max(0, s.honey - giveAmount);
        else if (give === "fruit") {
          // Proportionally drain apples/pears/cherries
          const f = s.foods ?? emptyFoods();
          const total = (f.apples ?? 0) + (f.pears ?? 0) + (f.cherries ?? 0);
          if (total > 0) {
            const toTake = Math.min(total, giveAmount);
            for (const k of ["apples", "pears", "cherries"] as const) {
              const share = (f[k] ?? 0) / total;
              f[k] = Math.max(0, (f[k] ?? 0) - toTake * share);
            }
          }
        }

        // Credit the "receive" side (respecting caps where applicable)
        if (receive === "gold" || receive === "wood" || receive === "stone") {
          const key = receive as keyof ResourceState;
          s.resources[key] = Math.min(caps[key], s.resources[key] + receiveAmount);
        } else if (receive === "food") {
          addFood(s.foods, "wheat", receiveAmount, caps.food);
        } else if (receive === "iron")  s.iron = Math.min(300, s.iron + receiveAmount);
        else if (receive === "wool")    s.wool = Math.min(200, s.wool + receiveAmount);
        else if (receive === "fiber")   s.fiber = Math.min(200, s.fiber + receiveAmount);
        else if (receive === "ale") {
          const breweryLvl = s.buildings.find((b) => b.buildingId === "brewery")?.level ?? 0;
          const aleCap = ALE_STORAGE_BASE + breweryLvl * ALE_STORAGE_PER_BREWERY_LEVEL;
          s.ale = Math.min(aleCap, s.ale + receiveAmount);
        }
        else if (receive === "honey")   s.honey = s.honey + receiveAmount;
        else if (receive === "fruit") {
          // Split incoming fruit evenly across the three types
          const each = receiveAmount / 3;
          addFood(s.foods, "apples", each, caps.food);
          addFood(s.foods, "pears", each, caps.food);
          addFood(s.foods, "cherries", each, caps.food);
        }

        s.lastTradeAt = Date.now();
      }));
      scheduleSave();
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
      <GameContext.Provider value={(() => { if (IS_DEV) (window as any).__game = { state, actions }; return { state, actions }; })()}>
        {props.children}
      </GameContext.Provider>
    </Show>
  );
}
