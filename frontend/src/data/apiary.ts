import type { Season } from "./seasons";

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

// Costs
export const HIVE_BASE_COST = { wood: 15, stone: 5, gold: 30 };
export const HIVE_COST_MULTIPLIER = 1.3;
export const HIVE_GOLD_PER_LEVEL = 20;
export const HIVE_BASE_BUILD_TIME = 5; // seconds
export const HIVE_BUILD_TIME_MULTIPLIER = 1.4;
export const MAX_HIVES = 4;
export const HIVE_MAX_LEVEL = 5;
export const HONEY_BASE_STORAGE = 30;
export const HONEY_STORAGE_PER_LEVEL = 15;

export function getHiveCost(level: number): { wood: number; stone: number; gold: number } {
  const mult = Math.pow(HIVE_COST_MULTIPLIER, level);
  return {
    wood: Math.floor(HIVE_BASE_COST.wood * mult),
    stone: Math.floor(HIVE_BASE_COST.stone * mult),
    gold: HIVE_BASE_COST.gold + level * HIVE_GOLD_PER_LEVEL,
  };
}

export function getHiveBuildTime(level: number): number {
  return Math.floor(HIVE_BASE_BUILD_TIME * Math.pow(HIVE_BUILD_TIME_MULTIPLIER, level));
}

export function getHoneyRate(level: number, season: Season): number {
  return Math.floor(APIARY.baseHoneyPerHour * level * 1.1 * APIARY.seasonalModifiers[season]);
}

export function getHoneyStorageCap(hives: { level: number }[]): number {
  const totalLevels = hives.reduce((sum, h) => sum + h.level, 0);
  return HONEY_BASE_STORAGE + totalLevels * HONEY_STORAGE_PER_LEVEL;
}
