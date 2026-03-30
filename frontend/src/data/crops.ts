export type CropId = "wheat" | "barley" | "flax";

export interface CropDefinition {
  id: CropId;
  name: string;
  icon: string;
  description: string;
  foodType: "grain" | "fiber"; // fiber = not food (future crafting material)
  isFood: boolean;
  baseYield: number; // per hour at level 1, scales with level
}

export const CROPS: CropDefinition[] = [
  {
    id: "wheat",
    name: "Wheat",
    icon: "🌾",
    description: "A hardy staple grain. Reliable yield across seasons.",
    foodType: "grain",
    isFood: true,
    baseYield: 10,
  },
  {
    id: "barley",
    name: "Barley",
    icon: "🌿",
    description: "Versatile grain used for bread and ale. Slightly lower yield than wheat.",
    foodType: "grain",
    isFood: true,
    baseYield: 7,
  },
  {
    id: "flax",
    name: "Flax",
    icon: "🪻",
    description: "Produces fiber for linen cloth. Does not provide food, but valuable for trade and crafting.",
    foodType: "fiber",
    isFood: false,
    baseYield: 5,
  },
];

export function getCrop(id: CropId): CropDefinition {
  return CROPS.find((c) => c.id === id)!;
}

// Field building costs and timing
export const FIELD_BASE_COST = { wood: 40, stone: 10 };
export const FIELD_COST_MULTIPLIER = 1.4; // per level
export const FIELD_BASE_BUILD_TIME = 45; // seconds
export const FIELD_BUILD_TIME_MULTIPLIER = 1.5;

// Max fields you can have (can increase later with upgrades)
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

export function getFieldYield(crop: CropDefinition, level: number): number {
  return Math.floor(crop.baseYield * level * 1.1);
}
