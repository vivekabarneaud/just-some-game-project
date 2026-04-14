export type CropId = "wheat" | "barley" | "flax";

export interface CropDefinition {
  id: CropId;
  name: string;
  icon: string;
  description: string;
  foodType: "grain" | "fiber";
  isFood: boolean;
  baseSeasonYield: number; // total yield per harvest, scales with level
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
  },
  {
    id: "barley",
    name: "Barley",
    icon: "🌿",
    description: "Versatile grain for bread and ale. Moderate yield.",
    foodType: "grain",
    isFood: true,
    baseSeasonYield: 80,
  },
  {
    id: "flax",
    name: "Flax",
    icon: "🪻",
    description: "Produces fiber for linen cloth. No food, but valuable for trade.",
    foodType: "fiber",
    isFood: false,
    baseSeasonYield: 60,
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

export const MAX_FIELDS = 8;
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

// Total harvest yield for a field at a given level
export function getSeasonYield(crop: CropDefinition, level: number): number {
  return Math.floor(crop.baseSeasonYield * level * 1.1);
}
