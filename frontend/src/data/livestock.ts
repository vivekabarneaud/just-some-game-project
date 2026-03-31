export type AnimalId = "chickens" | "pigs" | "goats" | "sheep";

export interface AnimalDefinition {
  id: AnimalId;
  name: string;
  icon: string;
  description: string;
  foodConsumedPerHour: number; // grain/food consumed
  foodProducedPerHour: number; // food output
  foodLabel: string; // "Eggs", "Meat", "Milk"
  /** Secondary resource produced (e.g. wool) */
  secondaryResource?: string;
  secondaryPerHour?: number;
}

export const ANIMALS: AnimalDefinition[] = [
  {
    id: "chickens",
    name: "Chickens",
    icon: "🐔",
    description: "Easy to keep, low feed cost. Produce eggs steadily.",
    foodConsumedPerHour: 1,
    foodProducedPerHour: 3,
    foodLabel: "Eggs",
  },
  {
    id: "goats",
    name: "Goats",
    icon: "🐐",
    description: "Hardy animals that provide milk. Moderate upkeep.",
    foodConsumedPerHour: 2,
    foodProducedPerHour: 4,
    foodLabel: "Milk",
  },
  {
    id: "pigs",
    name: "Pigs",
    icon: "🐷",
    description: "Hungry but produce the most meat. Need plenty of grain.",
    foodConsumedPerHour: 3,
    foodProducedPerHour: 6,
    foodLabel: "Meat",
  },
  {
    id: "sheep",
    name: "Sheep",
    icon: "🐑",
    description: "Produce wool for clothing and some meat. Essential for surviving winter.",
    foodConsumedPerHour: 2,
    foodProducedPerHour: 2,
    foodLabel: "Meat",
    secondaryResource: "wool",
    secondaryPerHour: 3,
  },
];

export function getAnimal(id: AnimalId): AnimalDefinition {
  return ANIMALS.find((a) => a.id === id)!;
}

// Pen costs — gold to buy animals, wood/stone to build the pen
export const PEN_GOLD_COST = 50;
export const PEN_GOLD_COST_PER_LEVEL = 30;
export const PEN_BASE_COST = { wood: 30, stone: 15 };
export const PEN_COST_MULTIPLIER = 1.4;
export const PEN_BASE_BUILD_TIME = 40; // seconds
export const PEN_BUILD_TIME_MULTIPLIER = 1.5;
export const MAX_PENS = 6;
export const PEN_MAX_LEVEL = 8;

export function getPenCost(level: number): { wood: number; stone: number; gold: number } {
  const mult = Math.pow(PEN_COST_MULTIPLIER, level);
  return {
    wood: Math.floor(PEN_BASE_COST.wood * mult),
    stone: Math.floor(PEN_BASE_COST.stone * mult),
    gold: PEN_GOLD_COST + level * PEN_GOLD_COST_PER_LEVEL,
  };
}

export function getPenBuildTime(level: number): number {
  return Math.floor(PEN_BASE_BUILD_TIME * Math.pow(PEN_BUILD_TIME_MULTIPLIER, level));
}

// Production scales with level
export function getPenProduction(animal: AnimalDefinition, level: number): { produced: number; consumed: number; secondary?: { resource: string; amount: number } } {
  const result: { produced: number; consumed: number; secondary?: { resource: string; amount: number } } = {
    produced: Math.floor(animal.foodProducedPerHour * level * 1.1),
    consumed: Math.floor(animal.foodConsumedPerHour * level * 1.05),
  };
  if (animal.secondaryResource && animal.secondaryPerHour) {
    result.secondary = {
      resource: animal.secondaryResource,
      amount: Math.floor(animal.secondaryPerHour * level * 1.1),
    };
  }
  return result;
}
