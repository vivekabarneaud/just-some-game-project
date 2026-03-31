import {
  createContext,
  useContext,
  onCleanup,
  type ParentProps,
} from "solid-js";
import { createStore, produce } from "solid-js/store";
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
  CHAPEL_HAPPINESS_PER_LEVEL,
  TAVERN_HAPPINESS_PER_LEVEL,
  TAVERN_HAPPINESS_DRY,
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

// ─── Types ───────────────────────────────────────────────────────

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
  crop: CropId;
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
  // Ale & Happiness
  ale: number;
  happiness: number; // 0-100
  lastRaidOutcome: "none" | "victory" | "defeat";
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
  buildField: (crop: CropId) => boolean;
  upgradeField: (fieldId: string) => boolean;
  removeField: (fieldId: string) => void;
  buildGarden: (veggie: VeggieId) => boolean;
  upgradeGarden: (gardenId: string) => boolean;
  removeGarden: (gardenId: string) => void;
  buildPen: (animal: AnimalId) => boolean;
  upgradePen: (penId: string) => boolean;
  removePen: (penId: string) => void;
  setGameSpeed: (speed: number) => void;
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
  deployMission: (missionId: string, adventurerIds: string[]) => boolean;
  collectCompletedMissions: () => CompletedMission[];
  getAvailableAdventurers: () => Adventurer[];
  getRosterSize: () => { current: number; max: number };
  getMissionSlotInfo: () => { used: number; max: number };
  grantResources: (amount: number) => void;
  // Ale & Happiness
  getAleInfo: () => { current: number; cap: number; production: number; consumption: number };
  getHappinessModifier: () => number;
  repairBuilding: (buildingId: string) => boolean;
  // Raids
  getDefense: () => DefenseBreakdown;
  collectRaidLog: () => RaidResult[];
  triggerRaid: () => boolean;
  recallAdventurers: () => { recalled: number; instant: boolean };
  // Astral Shards
  claimDailyLogin: () => boolean;
  canClaimDailyLogin: () => boolean;
  rerollMissions: () => boolean;
  rerollRecruits: () => boolean;
}

// ─── Constants ───────────────────────────────────────────────────

const STORAGE_KEY = "medieval-realm-save";
const TICK_INTERVAL_MS = 1000;
let idCounter = 1;

function nextId(prefix: string): string {
  return `${prefix}_${idCounter++}`;
}

function createInitialState(): GameState {
  return {
    resources: { gold: 100, wood: 250, stone: 150, food: 200 },
    buildings: BUILDINGS.map((b) => ({
      buildingId: b.id,
      level: b.id === "town_hall" ? 1 : b.id === "houses" ? 1 : 0,
      upgrading: false,
      damaged: false,
    })),
    fields: [],
    gardens: [],
    pens: [],
    population: BASE_POPULATION + HOUSES_POP_PER_LEVEL,
    season: "spring",
    seasonElapsed: 0,
    year: 1,
    lastTick: Date.now(),
    gameSpeed: 1,
    villageName: "Oakenhold",
    ale: 0,
    happiness: 50,
    lastRaidOutcome: "none",
    adventurers: [],
    activeMissions: [],
    completedMissions: [],
    recruitCandidates: [],
    missionBoard: [],
    recruitRefreshIn: 0,
    missionRefreshIn: 0,
    incomingRaids: [],
    raidLog: [],
    hoursSinceLastRaid: 0, // increases over time, raids become more likely
    astralShards: 0,
    lastDailyLogin: 0,
    missionRerollToday: false,
    recruitRerollToday: false,
    lastRerollReset: Date.now(),
  };
}

// ─── Persistence ─────────────────────────────────────────────────

function saveGame(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
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
    // Building damage migration
    for (const pb of saved.buildings) {
      if ((pb as any).damaged === undefined) (pb as any).damaged = false;
    }
    // Ale & Happiness migration
    if (saved.ale === undefined) saved.ale = 0;
    if (saved.happiness === undefined) saved.happiness = 50;
    if (!saved.lastRaidOutcome) saved.lastRaidOutcome = "none";
    // Raid migration
    if (!saved.incomingRaids) saved.incomingRaids = [];
    if (!saved.raidLog) saved.raidLog = [];
    if (saved.hoursSinceLastRaid === undefined) saved.hoursSinceLastRaid = 48;
    // Astral Shards migration
    if (saved.astralShards === undefined) saved.astralShards = 0;
    if (saved.lastDailyLogin === undefined) saved.lastDailyLogin = 0;
    if (saved.missionRerollToday === undefined) saved.missionRerollToday = false;
    if (saved.recruitRerollToday === undefined) saved.recruitRerollToday = false;
    if (saved.lastRerollReset === undefined) saved.lastRerollReset = Date.now();
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
      if (field.level === 0) continue;
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
      if (field.level === 0) continue;
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
    case "chapel": {
      const cur = Math.max(0, currentLevel) * CHAPEL_HAPPINESS_PER_LEVEL;
      const next = nextLevel * CHAPEL_HAPPINESS_PER_LEVEL;
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
  const initial = loadGame() ?? createInitialState();
  const [state, setState] = createStore<GameState>(initial);

  function advanceSeason(s: GameState) {
    const next = nextSeason(s.season);
    s.season = next;
    s.seasonElapsed = 0;
    if (next === "spring") s.year += 1;
  }

  function applyTicks(elapsedMs: number) {
    const elapsedHours = elapsedMs / 3_600_000;
    const elapsedSeconds = elapsedMs / 1000;
    if (elapsedHours <= 0) return;

    setState(
      produce((s) => {
        // Advance season
        s.seasonElapsed += elapsedHours;
        while (s.seasonElapsed >= HOURS_PER_SEASON) {
          s.seasonElapsed -= HOURS_PER_SEASON;
          advanceSeason(s);
        }

        const rates = calcProductionRates(s);
        const citizenFood = calcFoodConsumption(s.population);
        const animalFood = calcAnimalFoodConsumption(s.pens);
        const caps = calcStorageCaps(s.buildings);
        const maxPop = calcMaxPopulation(s.buildings);
        const netFoodRate = rates.food - citizenFood - animalFood;

        // Happiness production modifier: 80-120% based on happiness
        const happinessMod = 0.8 + (s.happiness / 100) * 0.4;

        s.resources.gold = Math.min(caps.gold, Math.max(0, s.resources.gold + rates.gold * happinessMod * elapsedHours));
        s.resources.wood = Math.min(caps.wood, Math.max(0, s.resources.wood + rates.wood * happinessMod * elapsedHours));
        s.resources.stone = Math.min(caps.stone, Math.max(0, s.resources.stone + rates.stone * happinessMod * elapsedHours));
        s.resources.food = Math.min(caps.food, Math.max(0, s.resources.food + netFoodRate * happinessMod * elapsedHours));

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

        // ── Winter cold ──
        const isWinter = s.season === "winter";
        if (isWinter) {
          const woodNeeded = WINTER_WOOD_PER_CITIZEN_PER_HOUR * s.population * elapsedHours;
          if (s.resources.wood >= woodNeeded) {
            s.resources.wood -= woodNeeded;
          } else {
            s.resources.wood = 0;
            // Freezing — citizens die
            s.population = Math.max(BASE_POPULATION, s.population - WINTER_NO_WOOD_DEATH_RATE * elapsedHours);
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
        const chapelLvl = s.buildings.find((b) => b.buildingId === "chapel")?.level ?? 0;
        happiness += chapelLvl * CHAPEL_HAPPINESS_PER_LEVEL;

        // Tavern (depends on ale)
        if (tavernLvl > 0) {
          const aleRatio = aleConsumed / (ALE_CONSUMED_PER_TAVERN_LEVEL * tavernLvl * elapsedHours || 1);
          if (aleRatio > 0.5) {
            happiness += tavernLvl * TAVERN_HAPPINESS_PER_LEVEL;
          } else {
            happiness += tavernLvl * TAVERN_HAPPINESS_DRY; // dry tavern
          }
        }

        // Damaged buildings
        const damagedCount = s.buildings.filter((b) => b.damaged).length;
        if (damagedCount > 0) happiness -= damagedCount * 3;

        // Raid morale
        if (s.lastRaidOutcome === "victory") happiness += 10;
        else if (s.lastRaidOutcome === "defeat") happiness -= 15;

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
              }
            }
          }
        }

        // Villager growth / decline (affected by happiness)
        if (netFoodRate > 0 && s.population < maxPop && s.happiness >= 20) {
          const growthMod = s.happiness >= 70 ? 1.5 : s.happiness >= 40 ? 1.0 : 0.5;
          const growth = (1 / VILLAGER_GROWTH_INTERVAL_HOURS) * elapsedHours * growthMod;
          s.population = Math.min(maxPop, s.population + growth);
        } else if (s.happiness < 20 && s.population > BASE_POPULATION) {
          // Very unhappy citizens leave
          s.population = Math.max(BASE_POPULATION, s.population - elapsedHours * 0.5);
        } else if (s.resources.food <= 0 && s.population > BASE_POPULATION) {
          s.population = Math.max(BASE_POPULATION, s.population - elapsedHours);
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
                  if (advInState) advInState.alive = false;
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

              // Grant XP to all surviving adventurers
              const xpGain = template ? getMissionXp(template.difficulty, success) : 0;
              for (const adv of team) {
                if (!casualties.includes(adv.id)) {
                  const advInState = s.adventurers.find((a) => a.id === adv.id);
                  if (advInState) {
                    const result = applyXp(advInState, xpGain);
                    if (result.leveled) levelUps.push(advInState.name);
                    if (result.rankUp) {
                      rankUps.push({ name: advInState.name, newRank: RANK_NAMES[advInState.rank] });
                    }
                  }
                }
              }

              // Free surviving adventurers
              for (const id of am.adventurerIds) {
                const adv = s.adventurers.find((a) => a.id === id);
                if (adv) adv.onMission = false;
              }

              // Grant resource rewards
              if (rewards.length > 0) {
                const resCaps = calcStorageCaps(s.buildings);
                for (const reward of rewards) {
                  if (reward.resource === "astralShards") {
                    s.astralShards += reward.amount;
                  } else {
                    const key = reward.resource as keyof ResourceState;
                    const cap = resCaps[key];
                    s.resources[key] = Math.min(cap, s.resources[key] + reward.amount);
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
                xpGained: xpGain,
                levelUps,
                rankUps,
              });

              // Remove from active
              s.activeMissions.splice(i, 1);
            }
          }

          // Refresh recruit candidates
          s.recruitRefreshIn -= elapsedHours;
          if (s.recruitRefreshIn <= 0) {
            s.recruitRefreshIn = RECRUIT_REFRESH_HOURS;
            const count = getCandidateCount(guildLvl);
            const maxRank = getMaxRecruitRank(guildLvl);
            resetAdventurerSeed(Date.now() + s.year * 1000 + s.seasonElapsed);
            s.recruitCandidates = [];
            for (let i = 0; i < count; i++) {
              s.recruitCandidates.push(generateCandidate(nextId("adv"), maxRank));
            }
          }

          // Refresh mission board
          s.missionRefreshIn -= elapsedHours;
          if (s.missionRefreshIn <= 0) {
            s.missionRefreshIn = MISSION_REFRESH_HOURS;
            const boardSize = getMissionBoardSize(guildLvl);
            s.missionBoard = generateMissionBoard(guildLvl, boardSize, Date.now() + s.year * 777);
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

              // Damage buildings on defeat
              if (!result.victory) {
                const damageable = s.buildings.filter((b) => b.level > 0 && !b.damaged && b.buildingId !== "town_hall");
                const damageCount = Math.min(damageable.length, 1 + Math.floor(Math.random() * 3));
                for (let d = 0; d < damageCount; d++) {
                  const idx = Math.floor(Math.random() * damageable.length);
                  damageable[idx].damaged = true;
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

  const offlineMs = Date.now() - state.lastTick;
  if (offlineMs > 2000) applyTicks(offlineMs);

  const tickInterval = setInterval(() => applyTicks(TICK_INTERVAL_MS * state.gameSpeed), TICK_INTERVAL_MS);
  const saveInterval = setInterval(() => saveGame(JSON.parse(JSON.stringify(state))), 5000);

  onCleanup(() => {
    clearInterval(tickInterval);
    clearInterval(saveInterval);
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

    buildField(crop) {
      if (state.fields.length >= MAX_FIELDS) return false;
      const cost = getFieldCost(0);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      const id = nextId("field");
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.fields.push({ id, crop, level: 0, upgrading: true, upgradeRemaining: getFieldBuildTime(0) });
      }));
      return true;
    },

    upgradeField(fieldId) {
      const field = state.fields.find((f) => f.id === fieldId);
      if (!field || field.upgrading || field.level >= FIELD_MAX_LEVEL) return false;
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

    resetGame() {
      idCounter = 1;
      const fresh = createInitialState();
      setState(fresh);
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
    deployMission(missionId, adventurerIds) {
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

      const successChance = calcSuccessChance(template, team);
      const effectiveDuration = calcEffectiveDuration(template, team);

      setState(produce((s) => {
        s.resources.gold -= template.deployCost;
        // Mark adventurers as on mission
        for (const id of adventurerIds) {
          const adv = s.adventurers.find((a) => a.id === id);
          if (adv) adv.onMission = true;
        }
        s.activeMissions.push({
          missionId: template.id,
          adventurerIds: [...adventurerIds],
          remaining: effectiveDuration,
          successChance,
        });
        // Remove from mission board so it can't be repeated
        s.missionBoard = s.missionBoard.filter((m) => m.id !== template.id);
      }));
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
    getHappinessModifier() {
      return 0.8 + (state.happiness / 100) * 0.4;
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
        s.missionBoard = generateMissionBoard(guildLvl, boardSize, Date.now());
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
        const maxRank = getMaxRecruitRank(guildLvl);
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
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {props.children}
    </GameContext.Provider>
  );
}
