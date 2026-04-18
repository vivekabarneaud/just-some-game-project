import type { Season } from "./seasons";

export type VeggieId = "cabbages" | "turnips" | "peas" | "squash";

export interface VeggieDefinition {
  id: VeggieId;
  name: string;
  icon: string;
  description: string;
  /** Seasons where seeds can be sown — the window in which "Plant" is available. */
  plantSeasons: Season[];
  /** Seasons where the garden actively produces food once planted. */
  produceSeasons: Season[];
  /** Gold paid each year to plant seeds. */
  seedCost: number;
  /** Food per hour when producing, before level scaling. */
  baseRate: number;
  image?: string;
}

export const VEGGIES: VeggieDefinition[] = [
  {
    id: "peas",
    name: "Peas",
    icon: "🫛",
    description: "Overwintering peas — sow under the first frost, and they wake with spring. A hardy early crop that enriches the soil.",
    plantSeasons: ["winter"],
    produceSeasons: ["spring", "summer"],
    seedCost: 6,
    baseRate: 4,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/garden_peas.png",
  },
  {
    id: "turnips",
    name: "Turnips",
    icon: "🥕",
    description: "Fast-growing root vegetables. Planted in spring, they crowd the summer table and keep into autumn.",
    plantSeasons: ["spring"],
    produceSeasons: ["summer", "autumn"],
    seedCost: 4,
    baseRate: 5,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/garden_turnips.png",
  },
  {
    id: "cabbages",
    name: "Cabbages",
    icon: "🥬",
    description: "Tough-leaved and dependable. Planted in spring, producing through summer and autumn — the stored heads keep through winter too.",
    plantSeasons: ["spring"],
    produceSeasons: ["summer", "autumn", "winter"],
    seedCost: 5,
    baseRate: 4,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/garden_cabbages.png",
  },
  {
    id: "squash",
    name: "Squash",
    icon: "🎃",
    description: "Planted in summer, ripens through autumn and keeps in the cellar for winter. A storage crop that feeds you past the frost.",
    plantSeasons: ["summer"],
    produceSeasons: ["autumn", "winter"],
    seedCost: 8,
    baseRate: 5,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/garden_squash.png",
  },
];

export function getVeggie(id: VeggieId): VeggieDefinition {
  return VEGGIES.find((v) => v.id === id)!;
}

export const GARDEN_BASE_COST = { wood: 20, stone: 5 };
export const GARDEN_COST_MULTIPLIER = 1.3;
export const GARDEN_BASE_BUILD_TIME = 5; // seconds
export const GARDEN_BUILD_TIME_MULTIPLIER = 1.4;
/** Fixed at 4 — one slot per veggie type. Every save pre-spawns all four. */
export const MAX_GARDENS = VEGGIES.length;
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

/** Scales seed cost lightly with level so bigger gardens cost a bit more to sow. */
export function getSeedCost(veggie: VeggieDefinition, level: number): number {
  return Math.max(1, Math.floor(veggie.seedCost * (1 + (level - 1) * 0.2)));
}

/** Can the player plant seeds in this garden right now? */
export function canPlantVeggie(veggie: VeggieDefinition, season: Season): boolean {
  return veggie.plantSeasons.includes(season);
}

/** Is the garden producing food this season (assuming it's planted)? */
export function isVeggieProducing(veggie: VeggieDefinition, season: Season): boolean {
  return veggie.produceSeasons.includes(season);
}

/** Legacy alias — kept so existing callers that only care about "is this season relevant?" don't break. */
export function isGardenActive(veggie: VeggieDefinition, season: Season): boolean {
  return isVeggieProducing(veggie, season);
}
