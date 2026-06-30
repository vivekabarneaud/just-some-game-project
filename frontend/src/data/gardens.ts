import type { Season } from "./seasons";
import { growth } from "@medieval-realm/shared/data/farmingMath";

export type VeggieId = "cabbages" | "turnips" | "peas" | "squash" | "fava";

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
  {
    id: "fava",
    name: "Fava Beans",
    icon: "🫘",
    description: "Sown before winter takes hold. The vines weather frost and snow, swelling into pods that fill the table from spring through summer. A peasant staple, dried and stored against the lean year.",
    plantSeasons: ["autumn"],
    produceSeasons: ["spring", "summer"],
    seedCost: 7,
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
/** Fixed at 4 — one slot per veggie type. Every save pre-spawns all four. */
export const MAX_GARDENS = VEGGIES.length;
export const GARDEN_MAX_LEVEL = 8;

export function getGardenCost(level: number): { wood: number; stone: number } {
  return {
    wood: growth(GARDEN_BASE_COST.wood, GARDEN_COST_MULTIPLIER, level),
    stone: growth(GARDEN_BASE_COST.stone, GARDEN_COST_MULTIPLIER, level),
  };
}

export function getGardenBuildTime(level: number): number {
  return growth(GARDEN_BASE_BUILD_TIME, GARDEN_BUILD_TIME_MULTIPLIER, level);
}

export function getGardenRate(veggie: VeggieDefinition, level: number): number {
  return Math.floor(veggie.baseRate * level * 1.1);
}

/** Scales seed cost lightly with level so bigger gardens cost a bit more to sow.
 *  NOTE: legacy gold-cost planting. Superseded by the per-crop seed system
 *  (getSeedCapacity / getEffectiveGardenRate); kept only for the marketplace
 *  buy price, which still reads it. */
export function getSeedCost(veggie: VeggieDefinition, level: number): number {
  return Math.max(1, Math.floor(veggie.seedCost * (1 + (level - 1) * 0.2)));
}

// ─── Per-crop seed system ───────────────────────────────────────
// Seeds are what you SOW, not the harvest. Each seed becomes a plant that
// yields vegetables all season (the +X/h rate). Sowing fills the plot up to
// its capacity; yield scales with how full it is. A steady plot saves its own
// seed at year's end (plus a little surplus), so you only buy seed to expand
// past your own supply or recover after a famine ate it.

/** Seeds a garden holds at a given level — bigger plot, more seed to fill it.
 *  10 per level (L1=10 … L8=80). */
export function getSeedCapacity(level: number): number {
  return Math.max(0, level) * 10;
}

/** The food/hour a planted garden actually produces, scaled by how full it is
 *  sown. Fully seeded → the base getGardenRate; half-seeded → half. */
export function getEffectiveGardenRate(
  veggie: VeggieDefinition,
  level: number,
  seedsPlanted: number,
): number {
  const cap = getSeedCapacity(level);
  if (cap <= 0) return 0;
  const fill = Math.min(1, Math.max(0, seedsPlanted) / cap);
  return Math.floor(getGardenRate(veggie, level) * fill);
}

/** Seed kept back from a season's crop. >1 so a steady plot self-sustains and
 *  the surplus slowly funds expansion; big jumps still need the market. */
export const SEED_RETURN_FACTOR = 1.5;
export function getSeedReturn(seedsPlanted: number): number {
  return Math.floor(Math.max(0, seedsPlanted) * SEED_RETURN_FACTOR);
}

/** Seeds the founding crew arrives with — enough to fully sow a first L1 plot
 *  of each crop (capacity 10) with a little buffer, so day-one planting needs
 *  no shopping. */
export const STARTING_SEED_PER_CROP = 20;
export function makeStartingSeeds(): Record<VeggieId, number> {
  return VEGGIES.reduce((acc, v) => {
    acc[v.id] = STARTING_SEED_PER_CROP;
    return acc;
  }, {} as Record<VeggieId, number>);
}

/** Can the player plant seeds in this garden right now? */
export function canPlantVeggie(veggie: VeggieDefinition, season: Season): boolean {
  return veggie.plantSeasons.includes(season);
}

/** Is the garden producing food this season (assuming it's planted)? */
export function isVeggieProducing(veggie: VeggieDefinition, season: Season): boolean {
  return veggie.produceSeasons.includes(season);
}
