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
export const MAX_HIVES = 4;
export const HIVE_MAX_LEVEL = 5;

/** How many hive slots the settlement has unlocked at a given Town Hall level.
 *  Beekeeping is humble, so the first hive comes early (TH2, still a camp);
 *  each settlement tier after that unlocks one more, up to MAX_HIVES.
 *  TH2 (camp) → 1, village (TH3) → 2, town (TH5) → 3, city (TH7) → 4. */
export function unlockedHiveCount(townHallLevel: number): number {
  let n = 0;
  if (townHallLevel >= 2) n = 1;
  if (townHallLevel >= 3) n = 2;
  if (townHallLevel >= 5) n = 3;
  if (townHallLevel >= 7) n = 4;
  return Math.min(MAX_HIVES, n);
}

/** Town Hall level at which the Nth hive slot (0-indexed) unlocks, and a short
 *  label for the locked card. */
export function hiveSlotUnlock(slotIndex: number): { thLevel: number; label: string } {
  switch (slotIndex) {
    case 0: return { thLevel: 2, label: "Town Hall Lv.2" };
    case 1: return { thLevel: 3, label: "a Village (Town Hall Lv.3)" };
    case 2: return { thLevel: 5, label: "a Town (Town Hall Lv.5)" };
    default: return { thLevel: 7, label: "a City (Town Hall Lv.7)" };
  }
}
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
