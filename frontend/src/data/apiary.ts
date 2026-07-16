import type { Season } from "./seasons";
import { growth } from "@medieval-realm/shared/data/farmingMath";

export interface ApiaryDefinition {
  baseHoneyPerHour: number;
  seasonalModifiers: Record<Season, number>;
}

export const APIARY: ApiaryDefinition = {
  baseHoneyPerHour: 2,
  seasonalModifiers: {
    spring: 1.0,
    summer: 1.0,
    autumn: 0.5,
    winter: 0,
  },
};

/** Banner art for the apiary card — the same image is reused across all hives. */
export const APIARY_IMAGE = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/apiary.png";

// Costs
export const HIVE_BASE_COST = { wood: 15, stone: 5, gold: 30 };
export const HIVE_COST_MULTIPLIER = 1.3;
export const HIVE_GOLD_PER_LEVEL = 20;
export const HIVE_BASE_BUILD_TIME = 5; // seconds
export const HIVE_BUILD_TIME_MULTIPLIER = 1.4;
// A single apiary the settlement upgrades as it grows (upgrades are capped by
// Town Hall level, like every other building). Not a multi-slot yard.
export const MAX_HIVES = 1;
export const HIVE_MAX_LEVEL = 5;
export const HONEY_BASE_STORAGE = 30;
export const HONEY_STORAGE_PER_LEVEL = 15;

export function getHiveCost(level: number): { wood: number; stone: number; gold: number } {
  return {
    wood: growth(HIVE_BASE_COST.wood, HIVE_COST_MULTIPLIER, level),
    stone: growth(HIVE_BASE_COST.stone, HIVE_COST_MULTIPLIER, level),
    gold: HIVE_BASE_COST.gold + level * HIVE_GOLD_PER_LEVEL,
  };
}

export function getHiveBuildTime(level: number): number {
  return growth(HIVE_BASE_BUILD_TIME, HIVE_BUILD_TIME_MULTIPLIER, level);
}

export function getHoneyRate(level: number, season: Season): number {
  return Math.floor(APIARY.baseHoneyPerHour * level * 1.1 * APIARY.seasonalModifiers[season]);
}

export function getHoneyStorageCap(hives: { level: number }[]): number {
  const totalLevels = hives.reduce((sum, h) => sum + h.level, 0);
  return HONEY_BASE_STORAGE + totalLevels * HONEY_STORAGE_PER_LEVEL;
}
