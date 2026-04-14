import type { Season } from "./seasons";

export type VeggieId = "cabbages" | "turnips" | "peas" | "squash";

export interface VeggieDefinition {
  id: VeggieId;
  name: string;
  icon: string;
  description: string;
  activeSeasons: Season[]; // seasons when this veggie produces
  baseRate: number; // food per hour when active
}

export const VEGGIES: VeggieDefinition[] = [
  {
    id: "cabbages",
    name: "Cabbages",
    icon: "🥬",
    description: "Hardy greens that grow across three seasons. Reliable but modest yield.",
    activeSeasons: ["spring", "summer", "autumn"],
    baseRate: 4,
  },
  {
    id: "turnips",
    name: "Turnips",
    icon: "🥕",
    description: "Fast-growing root vegetables. Good yield in spring and summer.",
    activeSeasons: ["spring", "summer"],
    baseRate: 5,
  },
  {
    id: "peas",
    name: "Peas",
    icon: "🫛",
    description: "Nutritious legumes that enrich the soil. Spring and summer crop.",
    activeSeasons: ["spring", "summer"],
    baseRate: 4,
  },
  {
    id: "squash",
    name: "Squash",
    icon: "🎃",
    description: "A hardy winter crop. Grows in autumn and keeps through the cold months when nothing else will.",
    activeSeasons: ["autumn", "winter"],
    baseRate: 5,
  },
];

export function getVeggie(id: VeggieId): VeggieDefinition {
  return VEGGIES.find((v) => v.id === id)!;
}

export const GARDEN_BASE_COST = { wood: 20, stone: 5 };
export const GARDEN_COST_MULTIPLIER = 1.3;
export const GARDEN_BASE_BUILD_TIME = 5; // seconds
export const GARDEN_BUILD_TIME_MULTIPLIER = 1.4;
export const MAX_GARDENS = 6;
export const GARDEN_MAX_LEVEL = 8;

export function getGardenCost(level: number): { wood: number; stone: number } {
  const mult = Math.pow(GARDEN_COST_MULTIPLIER, level);
  return {
    wood: Math.floor(GARDEN_BASE_COST.wood * mult),
    stone: Math.floor(GARDEN_BASE_COST.stone * mult),
  };
}

export function getGardenBuildTime(level: number): number {
  return Math.floor(GARDEN_BASE_BUILD_TIME * Math.pow(GARDEN_BUILD_TIME_MULTIPLIER, level));
}

export function getGardenRate(veggie: VeggieDefinition, level: number): number {
  return Math.floor(veggie.baseRate * level * 1.1);
}

export function isGardenActive(veggie: VeggieDefinition, season: Season): boolean {
  return veggie.activeSeasons.includes(season);
}
