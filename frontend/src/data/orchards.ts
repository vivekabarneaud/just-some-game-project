import type { Season } from "./seasons";

export type FruitId = "apples" | "pears" | "cherries";

export interface FruitDefinition {
  id: FruitId;
  name: string;
  icon: string;
  description: string;
  harvestSeasons: Season[];
  baseRate: number; // fruit per hour when active
  maturationSeasons: number; // seasons until first harvest
}

export const FRUITS: FruitDefinition[] = [
  {
    id: "apples",
    name: "Apple Trees",
    icon: "🍎",
    description: "The backbone of any orchard. Reliable autumn harvest, keeps well through winter.",
    harvestSeasons: ["autumn"],
    baseRate: 5,
    maturationSeasons: 4,
  },
  {
    id: "pears",
    name: "Pear Trees",
    icon: "🍐",
    description: "Elegant fruit trees. Bear fruit from late summer through autumn.",
    harvestSeasons: ["summer", "autumn"],
    baseRate: 3,
    maturationSeasons: 4,
  },
  {
    id: "cherries",
    name: "Cherry Trees",
    icon: "🍒",
    description: "Beautiful blossoms in spring, precious fruit in summer. Short harvest window, but prized for sweets.",
    harvestSeasons: ["summer"],
    baseRate: 3,
    maturationSeasons: 4,
  },
];

export function getFruit(id: FruitId): FruitDefinition {
  return FRUITS.find((f) => f.id === id)!;
}

// Costs
export const ORCHARD_BASE_COST = { wood: 25, stone: 10, gold: 40 };
export const ORCHARD_COST_MULTIPLIER = 1.3;
export const ORCHARD_GOLD_PER_LEVEL = 25;
export const ORCHARD_BASE_BUILD_TIME = 40; // seconds
export const ORCHARD_BUILD_TIME_MULTIPLIER = 1.4;
export const MAX_ORCHARDS = 4;
export const ORCHARD_MAX_LEVEL = 6;
export const FRUIT_BASE_STORAGE = 50;
export const FRUIT_STORAGE_PER_LEVEL = 20;

export function getOrchardCost(level: number): { wood: number; stone: number; gold: number } {
  const mult = Math.pow(ORCHARD_COST_MULTIPLIER, level);
  return {
    wood: Math.floor(ORCHARD_BASE_COST.wood * mult),
    stone: Math.floor(ORCHARD_BASE_COST.stone * mult),
    gold: ORCHARD_BASE_COST.gold + level * ORCHARD_GOLD_PER_LEVEL,
  };
}

export function getOrchardBuildTime(level: number): number {
  return Math.floor(ORCHARD_BASE_BUILD_TIME * Math.pow(ORCHARD_BUILD_TIME_MULTIPLIER, level));
}

export function getOrchardRate(fruit: FruitDefinition, level: number): number {
  return Math.floor(fruit.baseRate * level * 1.1);
}

export function isOrchardActive(fruit: FruitDefinition, season: Season): boolean {
  return fruit.harvestSeasons.includes(season);
}

export function isOrchardBlossoming(fruit: FruitDefinition, season: Season): boolean {
  return season === "spring" && !fruit.harvestSeasons.includes("spring");
}

export function getOrchardStatus(fruit: FruitDefinition, season: Season, mature: boolean, seasonsGrown: number): string {
  if (!mature) return `Sapling — ${seasonsGrown}/${fruit.maturationSeasons} seasons`;
  if (isOrchardBlossoming(fruit, season)) return "Blossoming";
  if (isOrchardActive(fruit, season)) return "Harvesting";
  return "Dormant";
}

export function getFruitStorageCap(orchards: { level: number }[]): number {
  const totalLevels = orchards.reduce((sum, o) => sum + o.level, 0);
  return FRUIT_BASE_STORAGE + totalLevels * FRUIT_STORAGE_PER_LEVEL;
}
