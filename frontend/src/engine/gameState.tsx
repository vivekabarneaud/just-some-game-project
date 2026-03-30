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

export interface GameState {
  resources: ResourceState;
  buildings: PlayerBuilding[];
  population: number;
  lastTick: number;
  gameSpeed: number;
  villageName: string;
}

export interface GameActions {
  upgradeBuilding: (buildingId: string) => boolean;
  setGameSpeed: (speed: number) => void;
  resetGame: () => void;
  getProductionRates: () => ResourceState;
  getMaxPopulation: () => number;
  getFoodConsumption: () => number;
  getStorageCaps: () => StorageCaps;
  getSettlementTier: () => SettlementTier;
  getTownHallLevel: () => number;
  canAfford: (cost: BuildingCost) => boolean;
  getBuildingEffect: (buildingId: string, nextLevel: number) => string | null;
}

// ─── Constants ───────────────────────────────────────────────────

const STORAGE_KEY = "medieval-realm-save";
const TICK_INTERVAL_MS = 1000;

function createInitialState(): GameState {
  return {
    resources: { gold: 100, wood: 250, stone: 150, food: 200 },
    buildings: BUILDINGS.map((b) => ({
      buildingId: b.id,
      level: b.id === "town_hall" ? 1 : b.id === "houses" ? 1 : 0,
      upgrading: false,
    })),
    population: BASE_POPULATION + HOUSES_POP_PER_LEVEL,
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
    if ("mana" in saved.resources) {
      delete (saved.resources as Record<string, unknown>)["mana"];
    }
    if (saved.population === undefined) {
      const houses = saved.buildings.find((b) => b.buildingId === "houses");
      saved.population = BASE_POPULATION + (houses?.level ?? 0) * HOUSES_POP_PER_LEVEL;
    }
    for (const pb of saved.buildings) {
      if (pb.upgrading && (pb as any).upgradeFinishTime) {
        const remaining = Math.max(0, ((pb as any).upgradeFinishTime - Date.now()) / 1000);
        pb.upgradeRemaining = remaining;
        delete (pb as any).upgradeFinishTime;
      }
    }
    return saved;
  } catch {
    return null;
  }
}

// ─── Derived calculations ────────────────────────────────────────

function calcProductionRates(buildings: PlayerBuilding[], population: number): ResourceState {
  const rates: ResourceState = { gold: 0, wood: 0, stone: 0, food: 0 };
  rates.gold += Math.floor(population) * GOLD_TAX_PER_CITIZEN_PER_HOUR;
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
  return rates;
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

// Shows what the next upgrade does for infrastructure buildings
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

  function applyTicks(elapsedMs: number) {
    const elapsedHours = elapsedMs / 3_600_000;
    const elapsedSeconds = elapsedMs / 1000;
    if (elapsedHours <= 0) return;

    setState(
      produce((s) => {
        const rates = calcProductionRates(s.buildings, s.population);
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

  // Live tick loop
  const tickInterval = setInterval(() => {
    const elapsedMs = TICK_INTERVAL_MS * state.gameSpeed;
    applyTicks(elapsedMs);
  }, TICK_INTERVAL_MS);

  // Autosave every 5s
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
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) {
        return false;
      }

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

    setGameSpeed(speed: number) {
      setState("gameSpeed", speed);
    },

    resetGame() {
      const fresh = createInitialState();
      setState(fresh);
      saveGame(fresh);
    },

    getProductionRates() {
      return calcProductionRates(state.buildings, state.population);
    },

    getMaxPopulation() {
      return calcMaxPopulation(state.buildings);
    },

    getFoodConsumption() {
      return calcFoodConsumption(state.population);
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
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {props.children}
    </GameContext.Provider>
  );
}
