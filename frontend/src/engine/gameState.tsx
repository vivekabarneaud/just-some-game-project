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
  getSettlementTier,
  getSettlementName,
  isBuildingUnlocked,
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
  type Season,
  SEASON_ORDER,
  HOURS_PER_SEASON,
  HARVEST_DURATION_HOURS,
  nextSeason,
} from "~/data/seasons";

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

export interface GameState {
  resources: ResourceState;
  buildings: PlayerBuilding[];
  fields: PlayerField[];
  population: number;
  season: Season;
  seasonElapsed: number; // game-hours elapsed in current season
  year: number;
  lastTick: number;
  gameSpeed: number;
  villageName: string;
}

export interface FoodSource {
  type: FoodType;
  label: string;
  icon: string;
  rate: number;
  building: string;
}

export interface GameActions {
  // Buildings
  upgradeBuilding: (buildingId: string) => boolean;
  canAfford: (cost: BuildingCost) => boolean;
  getBuildingEffect: (buildingId: string, nextLevel: number) => string | null;
  // Fields
  buildField: (crop: CropId) => boolean;
  upgradeField: (fieldId: string) => boolean;
  removeField: (fieldId: string) => void;
  // Game
  setGameSpeed: (speed: number) => void;
  resetGame: () => void;
  skipSeason: () => void;
  // Derived
  getProductionRates: () => ResourceState;
  getMaxPopulation: () => number;
  getFoodConsumption: () => number;
  getFoodBreakdown: () => FoodSource[];
  getStorageCaps: () => StorageCaps;
  getSettlementTier: () => SettlementTier;
  getTownHallLevel: () => number;
  isHarvesting: () => boolean;
}

// ─── Constants ───────────────────────────────────────────────────

const STORAGE_KEY = "medieval-realm-save";
const TICK_INTERVAL_MS = 1000;
let fieldIdCounter = 1;

function nextFieldId(): string {
  return `field_${fieldIdCounter++}`;
}

function createInitialState(): GameState {
  return {
    resources: { gold: 100, wood: 250, stone: 150, food: 200 },
    buildings: BUILDINGS.map((b) => ({
      buildingId: b.id,
      level: b.id === "town_hall" ? 1 : b.id === "houses" ? 1 : 0,
      upgrading: false,
    })),
    fields: [],
    population: BASE_POPULATION + HOUSES_POP_PER_LEVEL,
    season: "spring",
    seasonElapsed: 0,
    year: 1,
    lastTick: Date.now(),
    gameSpeed: 1,
    villageName: "Oakenhold",
  };
}

// ─── Persistence ─────────────────────────────────────────────────

function saveGame(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // silently ignore
  }
}

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as GameState;
    for (const def of BUILDINGS) {
      if (!saved.buildings.find((b) => b.buildingId === def.id)) {
        saved.buildings.push({ buildingId: def.id, level: 0, upgrading: false });
      }
    }
    saved.buildings = saved.buildings.filter((b) => b.buildingId !== "farm");
    if ("mana" in saved.resources) {
      delete (saved.resources as Record<string, unknown>)["mana"];
    }
    if (saved.population === undefined) {
      const houses = saved.buildings.find((b) => b.buildingId === "houses");
      saved.population = BASE_POPULATION + (houses?.level ?? 0) * HOUSES_POP_PER_LEVEL;
    }
    if (!saved.fields) saved.fields = [];
    if (!saved.season) { saved.season = "spring"; saved.seasonElapsed = 0; saved.year = 1; }
    for (const pb of saved.buildings) {
      if (pb.upgrading && (pb as any).upgradeFinishTime) {
        const remaining = Math.max(0, ((pb as any).upgradeFinishTime - Date.now()) / 1000);
        pb.upgradeRemaining = remaining;
        delete (pb as any).upgradeFinishTime;
      }
    }
    let maxId = 0;
    for (const f of saved.fields) {
      const num = parseInt(f.id.replace("field_", ""), 10);
      if (num > maxId) maxId = num;
    }
    fieldIdCounter = maxId + 1;
    return saved;
  } catch {
    return null;
  }
}

// ─── Season helpers ──────────────────────────────────────────────

function isHarvestTime(season: Season, seasonElapsed: number): boolean {
  // Harvest happens during the first HARVEST_DURATION_HOURS of autumn
  return season === "autumn" && seasonElapsed < HARVEST_DURATION_HOURS;
}

// ─── Derived calculations ────────────────────────────────────────

function calcProductionRates(
  buildings: PlayerBuilding[],
  fields: PlayerField[],
  population: number,
  season: Season,
  seasonElapsed: number,
): ResourceState {
  const rates: ResourceState = { gold: 0, wood: 0, stone: 0, food: 0 };
  rates.gold += Math.floor(population) * GOLD_TAX_PER_CITIZEN_PER_HOUR;
  // Building production (year-round)
  for (const pb of buildings) {
    if (pb.level === 0) continue;
    const def = BUILDINGS.find((b) => b.id === pb.buildingId);
    if (!def) continue;
    const levelDef = def.levels[pb.level - 1];
    if (levelDef?.production) {
      const res = levelDef.production.resource as keyof ResourceState;
      if (res in rates) {
        rates[res] += levelDef.production.rate;
      }
    }
  }
  // Field production — only during harvest (autumn, first few hours)
  if (isHarvestTime(season, seasonElapsed)) {
    for (const field of fields) {
      if (field.level === 0) continue;
      const crop = getCrop(field.crop);
      if (crop.isFood) {
        const totalYield = getSeasonYield(crop, field.level);
        // Spread the harvest over HARVEST_DURATION_HOURS
        rates.food += totalYield / HARVEST_DURATION_HOURS;
      }
    }
  }
  return rates;
}

const FOOD_TYPE_META: Record<string, { label: string; icon: string }> = {
  grain: { label: "Grain", icon: "🌾" },
  meat: { label: "Meat", icon: "🥩" },
  berries: { label: "Berries", icon: "🫐" },
};

function calcFoodBreakdown(
  buildings: PlayerBuilding[],
  fields: PlayerField[],
  season: Season,
  seasonElapsed: number,
): FoodSource[] {
  const sources: FoodSource[] = [];
  // From fields (only during harvest)
  if (isHarvestTime(season, seasonElapsed)) {
    for (const field of fields) {
      if (field.level === 0) continue;
      const crop = getCrop(field.crop);
      if (!crop.isFood) continue;
      const totalYield = getSeasonYield(crop, field.level);
      const rate = totalYield / HARVEST_DURATION_HOURS;
      sources.push({
        type: "grain",
        label: crop.name,
        icon: crop.icon,
        rate: Math.round(rate),
        building: `${crop.name} Field (Lv${field.level})`,
      });
    }
  }
  // From buildings (year-round: hunting, foraging)
  for (const pb of buildings) {
    if (pb.level === 0) continue;
    const def = BUILDINGS.find((b) => b.id === pb.buildingId);
    if (!def) continue;
    const levelDef = def.levels[pb.level - 1];
    if (levelDef?.production?.resource === "food" && levelDef.production.foodType) {
      const ft = levelDef.production.foodType;
      const meta = FOOD_TYPE_META[ft];
      if (meta) {
        sources.push({
          type: ft,
          label: meta.label,
          icon: meta.icon,
          rate: levelDef.production.rate,
          building: def.name,
        });
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
    if (next === "spring") {
      s.year += 1;
    }
  }

  function applyTicks(elapsedMs: number) {
    const elapsedHours = elapsedMs / 3_600_000;
    const elapsedSeconds = elapsedMs / 1000;
    if (elapsedHours <= 0) return;

    setState(
      produce((s) => {
        // Advance season clock
        s.seasonElapsed += elapsedHours;
        while (s.seasonElapsed >= HOURS_PER_SEASON) {
          s.seasonElapsed -= HOURS_PER_SEASON;
          advanceSeason(s);
        }

        const rates = calcProductionRates(s.buildings, s.fields, s.population, s.season, s.seasonElapsed);
        const foodCons = calcFoodConsumption(s.population);
        const caps = calcStorageCaps(s.buildings);
        const maxPop = calcMaxPopulation(s.buildings);
        const netFoodRate = rates.food - foodCons;

        s.resources.gold = Math.min(caps.gold, Math.max(0, s.resources.gold + rates.gold * elapsedHours));
        s.resources.wood = Math.min(caps.wood, Math.max(0, s.resources.wood + rates.wood * elapsedHours));
        s.resources.stone = Math.min(caps.stone, Math.max(0, s.resources.stone + rates.stone * elapsedHours));
        s.resources.food = Math.min(caps.food, Math.max(0, s.resources.food + netFoodRate * elapsedHours));

        // Tick down building upgrades
        for (const pb of s.buildings) {
          if (pb.upgrading && pb.upgradeRemaining !== undefined) {
            pb.upgradeRemaining -= elapsedSeconds;
            if (pb.upgradeRemaining <= 0) {
              pb.level += 1;
              pb.upgrading = false;
              pb.upgradeRemaining = undefined;
            }
          }
        }

        // Tick down field upgrades
        for (const field of s.fields) {
          if (field.upgrading && field.upgradeRemaining !== undefined) {
            field.upgradeRemaining -= elapsedSeconds;
            if (field.upgradeRemaining <= 0) {
              field.level += 1;
              field.upgrading = false;
              field.upgradeRemaining = undefined;
            }
          }
        }

        // Villager growth / decline
        if (netFoodRate > 0 && s.population < maxPop) {
          const growthRate = 1 / VILLAGER_GROWTH_INTERVAL_HOURS;
          const growth = growthRate * elapsedHours;
          s.population = Math.min(maxPop, s.population + growth);
        } else if (s.resources.food <= 0 && s.population > BASE_POPULATION) {
          const loss = 1 * elapsedHours;
          s.population = Math.max(BASE_POPULATION, s.population - loss);
        }

        s.lastTick = Date.now();
      }),
    );
  }

  // Apply offline catch-up
  const offlineMs = Date.now() - state.lastTick;
  if (offlineMs > 2000) {
    applyTicks(offlineMs);
  }

  const tickInterval = setInterval(() => {
    const elapsedMs = TICK_INTERVAL_MS * state.gameSpeed;
    applyTicks(elapsedMs);
  }, TICK_INTERVAL_MS);

  const saveInterval = setInterval(() => {
    saveGame(JSON.parse(JSON.stringify(state)));
  }, 5000);

  onCleanup(() => {
    clearInterval(tickInterval);
    clearInterval(saveInterval);
    saveGame(JSON.parse(JSON.stringify(state)));
  });

  const actions: GameActions = {
    upgradeBuilding(buildingId: string): boolean {
      const pb = state.buildings.find((b) => b.buildingId === buildingId);
      if (!pb || pb.upgrading) return false;
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def) return false;
      if (!isBuildingUnlocked(def, getTownHallLevel(state.buildings))) return false;
      if (pb.level >= def.maxLevel) return false;
      const levelDef = def.levels[pb.level];
      if (!levelDef) return false;
      const cost = levelDef.cost;
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;

      setState(
        produce((s) => {
          s.resources.wood -= cost.wood;
          s.resources.stone -= cost.stone;
          const b = s.buildings.find((b) => b.buildingId === buildingId)!;
          b.upgrading = true;
          b.upgradeRemaining = levelDef.buildTime;
        }),
      );
      return true;
    },

    buildField(crop: CropId): boolean {
      if (state.fields.length >= MAX_FIELDS) return false;
      const cost = getFieldCost(0);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;

      const id = nextFieldId();
      const buildTime = getFieldBuildTime(0);
      setState(
        produce((s) => {
          s.resources.wood -= cost.wood;
          s.resources.stone -= cost.stone;
          s.fields.push({ id, crop, level: 0, upgrading: true, upgradeRemaining: buildTime });
        }),
      );
      return true;
    },

    upgradeField(fieldId: string): boolean {
      const field = state.fields.find((f) => f.id === fieldId);
      if (!field || field.upgrading || field.level >= FIELD_MAX_LEVEL) return false;
      const cost = getFieldCost(field.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;

      const buildTime = getFieldBuildTime(field.level);
      setState(
        produce((s) => {
          s.resources.wood -= cost.wood;
          s.resources.stone -= cost.stone;
          const f = s.fields.find((f) => f.id === fieldId)!;
          f.upgrading = true;
          f.upgradeRemaining = buildTime;
        }),
      );
      return true;
    },

    removeField(fieldId: string) {
      setState(
        produce((s) => {
          const idx = s.fields.findIndex((f) => f.id === fieldId);
          if (idx !== -1) s.fields.splice(idx, 1);
        }),
      );
    },

    setGameSpeed(speed: number) {
      setState("gameSpeed", speed);
    },

    resetGame() {
      fieldIdCounter = 1;
      const fresh = createInitialState();
      setState(fresh);
      saveGame(fresh);
    },

    skipSeason() {
      setState(
        produce((s) => {
          advanceSeason(s);
        }),
      );
    },

    getProductionRates() {
      return calcProductionRates(state.buildings, state.fields, state.population, state.season, state.seasonElapsed);
    },

    getMaxPopulation() {
      return calcMaxPopulation(state.buildings);
    },

    getFoodConsumption() {
      return calcFoodConsumption(state.population);
    },

    getFoodBreakdown() {
      return calcFoodBreakdown(state.buildings, state.fields, state.season, state.seasonElapsed);
    },

    getStorageCaps() {
      return calcStorageCaps(state.buildings);
    },

    getSettlementTier() {
      return getSettlementTier(getTownHallLevel(state.buildings));
    },

    getTownHallLevel() {
      return getTownHallLevel(state.buildings);
    },

    canAfford(cost: BuildingCost) {
      return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone;
    },

    getBuildingEffect(buildingId: string, nextLevel: number) {
      return calcBuildingEffect(buildingId, nextLevel);
    },

    isHarvesting() {
      return isHarvestTime(state.season, state.seasonElapsed);
    },
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {props.children}
    </GameContext.Provider>
  );
}
