export type CropId = "wheat" | "barley" | "flax";

export interface CropDefinition {
  id: CropId;
  name: string;
  icon: string;
  description: string;
  foodType: "grain" | "fiber";
  isFood: boolean;
  baseSeasonYield: number; // total yield per harvest, scales with level
  image?: string;          // banner art used on the field card when this crop is planted
}

export const CROPS: CropDefinition[] = [
  {
    id: "wheat",
    name: "Wheat",
    icon: "🌾",
    description: "A hardy staple grain. High yield at harvest.",
    foodType: "grain",
    isFood: true,
    baseSeasonYield: 120,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/field_wheat.png",
  },
  {
    id: "barley",
    name: "Barley",
    icon: "🌿",
    description: "Versatile grain for bread and ale. Moderate yield.",
    foodType: "grain",
    isFood: true,
    baseSeasonYield: 80,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/field_barley.png",
  },
  {
    id: "flax",
    name: "Flax",
    icon: "🪻",
    description: "Produces fiber for linen cloth. No food, but valuable for trade.",
    foodType: "fiber",
    isFood: false,
    baseSeasonYield: 60,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/field_flax.png",
  },
];

export function getCrop(id: CropId): CropDefinition {
  return CROPS.find((c) => c.id === id)!;
}

// Field building costs and timing
export const FIELD_BASE_COST = { wood: 40, stone: 10 };
export const FIELD_COST_MULTIPLIER = 1.4;
export const FIELD_BASE_BUILD_TIME = 5; // seconds
export const FIELD_BUILD_TIME_MULTIPLIER = 1.5;

export const MAX_FIELDS = 3;
export const FIELD_MAX_LEVEL = 10;

export function getFieldCost(level: number): { wood: number; stone: number } {
  const mult = Math.pow(FIELD_COST_MULTIPLIER, level);
  return {
    wood: Math.floor(FIELD_BASE_COST.wood * mult),
    stone: Math.floor(FIELD_BASE_COST.stone * mult),
  };
}

export function getFieldBuildTime(level: number): number {
  return Math.floor(FIELD_BASE_BUILD_TIME * Math.pow(FIELD_BUILD_TIME_MULTIPLIER, level));
}

// Total harvest yield for a field at a given level, before soil multipliers.
export function getSeasonYield(crop: CropDefinition, level: number): number {
  return Math.floor(crop.baseSeasonYield * level * 1.1);
}

// ─── Soil depletion / crop rotation ─────────────────────────────
// Planting the same crop in a row depletes the soil. Rotating refreshes it.
// Leaving a field idle through a growing season grants a rest bonus.
//
// Tuning knobs — if changed, update getSoilStatus() text to match.

/** Yield multiplier by consecutive-same-crop streak (0 = fresh, 3+ = exhausted). */
export const SOIL_YIELD_MULTIPLIERS = [1.0, 0.7, 0.45, 0.25];

/** Yield bonus applied when a field was left idle through a growing season. */
export const REST_BONUS_MULTIPLIER = 1.15;

/** Combined yield multiplier: streak penalty × rest bonus (if any). */
export function getSoilMultiplier(sameCropStreak: number, restBonus: boolean): number {
  const streakIdx = Math.min(sameCropStreak, SOIL_YIELD_MULTIPLIERS.length - 1);
  const streak = SOIL_YIELD_MULTIPLIERS[streakIdx];
  return streak * (restBonus ? REST_BONUS_MULTIPLIER : 1);
}

/** Human-readable soil status for the current streak. Drives the pill on field cards. */
export function getSoilStatus(sameCropStreak: number): { label: string; color: string } {
  if (sameCropStreak === 0) return { label: "Fresh soil", color: "var(--accent-green)" };
  if (sameCropStreak === 1) return { label: "Tired soil — yield reduced", color: "var(--accent-gold)" };
  if (sameCropStreak === 2) return { label: "Depleted — consider rotating", color: "#e67e22" };
  return { label: "Exhausted — rotate or rest", color: "var(--accent-red)" };
}
