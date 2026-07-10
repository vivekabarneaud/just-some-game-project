import { growth } from "./farmingMath";

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
  image?: string;
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/pen_chickens.png",
  },
  {
    id: "goats",
    name: "Goats",
    icon: "🐐",
    description: "Hardy animals that provide milk. Moderate upkeep.",
    foodConsumedPerHour: 2,
    foodProducedPerHour: 4,
    foodLabel: "Milk",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/pen_goats.png",
  },
  {
    id: "pigs",
    name: "Pigs",
    icon: "🐷",
    description: "Hungry but produce the most meat. Need plenty of grain.",
    foodConsumedPerHour: 3,
    foodProducedPerHour: 6,
    foodLabel: "Meat",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/pen_pigs.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/pen_sheep.png",
  },
];

export function getAnimal(id: AnimalId): AnimalDefinition {
  return ANIMALS.find((a) => a.id === id)!;
}

// Pen costs — gold to buy animals, wood/stone to build the pen
export const PEN_GOLD_COST = 45;
export const PEN_GOLD_COST_PER_LEVEL = 30;
export const PEN_BASE_COST = { wood: 30, stone: 15 };
export const PEN_COST_MULTIPLIER = 1.4;
export const PEN_BASE_BUILD_TIME = 5; // seconds
export const PEN_BUILD_TIME_MULTIPLIER = 1.5;
export const MAX_PENS = 6;
export const PEN_MAX_LEVEL = 8;

// ── Population model (slice 1) ──
// A pen's LEVEL sets its capacity; you BUY animals (gold/head) to fill it, and
// production scales with the actual headcount, not the level. Tune freely.
export const PEN_HEADS_PER_LEVEL = 3;
/** How many animals the pen can hold at this level (0 = not built). */
export function getPenCapacity(level: number): number {
  return level * PEN_HEADS_PER_LEVEL;
}
/** Gold to buy one animal, per species. Chickens cheap, pigs/sheep dearer. */
export const ANIMAL_BUY_COST: Record<AnimalId, number> = {
  chickens: 6,
  goats: 18,
  pigs: 22,
  sheep: 20,
};
export function getAnimalBuyCost(animal: AnimalId): number {
  return ANIMAL_BUY_COST[animal];
}

/** Seasonal multiplier on WOOL (the only seasonal byproduct — sheep are shorn
 *  in the warm months; nothing usable in deep winter). Primary products
 *  (milk/eggs/meat) are year-round and NOT affected. */
export const WOOL_SEASON_MOD: Record<string, number> = {
  spring: 1,
  summer: 1,
  autumn: 0.5,
  winter: 0,
};
export function getWoolSeasonMod(season: string): number {
  return WOOL_SEASON_MOD[season] ?? 1;
}

// ── Flock dynamics (slice 2) — births + starvation deaths per tick. Tune. ──
/** Fraction of a fully-starved flock lost per game-hour (scaled by how unfed). */
export const LIVESTOCK_STARVE_DEATH_PER_HOUR = 0.01;
/** Fraction a fed flock grows per game-hour in a breeding season (needs room). */
export const LIVESTOCK_BREED_PER_HOUR = 0.015;
/** Minimum headcount before a flock breeds. >2 on purpose: two animals read as
 *  a countable "pair" (an inbreeding optic at small scale), and gating births on
 *  a real little flock means early growth comes from buying fresh stock, not a
 *  closed line. Tune. */
export const LIVESTOCK_MIN_BREEDING_FLOCK = 3;
/** The warm seasons when a fed flock breeds (lambs in spring; growth into summer). */
export const LIVESTOCK_BREEDING_SEASONS = ["spring", "summer"] as const;

// ── Predation (slice 3): wolves thin an UNDEFENDED fold, worse in lean seasons. Tune. ──
/** Base per-game-hour chance of a wolf raid on an undefended pen with livestock. */
export const PREDATION_PER_HOUR = 0.004;
/** Season multiplier on that chance — hungriest (and boldest) in winter. */
export const PREDATION_SEASON_MOD: Record<string, number> = {
  spring: 1,
  summer: 0.8,
  autumn: 1.4,
  winter: 2.5,
};
/** Most animals a single raid takes. */
export const PREDATION_MAX_LOSS = 2;
/** Gold to keep a guard dog with a pen — stops predation on that fold. */
export const GUARD_DOG_COST = 60;

// ── Culling (slice 4): the player's DELIBERATE choice to slaughter one animal.
// Yields meat (food) + leather (feeds leatherworking). Bone deferred until a
// livestock-bone recipe exists (no dead-end drops). Chickens have no hide. Tune.
export interface CullYield { meat: number; leather: number; bone: number; }
export const CULL_YIELD: Record<AnimalId, CullYield> = {
  chickens: { meat: 2, leather: 0, bone: 1 },
  goats: { meat: 4, leather: 1, bone: 2 },
  pigs: { meat: 8, leather: 1, bone: 3 },
  sheep: { meat: 5, leather: 2, bone: 2 },
};
export function getCullYield(animal: AnimalId): CullYield {
  return CULL_YIELD[animal];
}

export function getPenCost(level: number): { wood: number; stone: number; gold: number } {
  return {
    wood: growth(PEN_BASE_COST.wood, PEN_COST_MULTIPLIER, level),
    stone: growth(PEN_BASE_COST.stone, PEN_COST_MULTIPLIER, level),
    gold: PEN_GOLD_COST + level * PEN_GOLD_COST_PER_LEVEL,
  };
}

export function getPenBuildTime(level: number): number {
  return growth(PEN_BASE_BUILD_TIME, PEN_BUILD_TIME_MULTIPLIER, level);
}

// Production scales with the HEADCOUNT — the animals actually in the pen, not
// the pen level (which now just sets capacity). An empty pen (count 0) yields
// nothing; a full one yields count x the per-head rate.
export function getPenProduction(animal: AnimalDefinition, count: number): { produced: number; consumed: number; secondary?: { resource: string; amount: number } } {
  const result: { produced: number; consumed: number; secondary?: { resource: string; amount: number } } = {
    produced: Math.floor(animal.foodProducedPerHour * count),
    consumed: Math.floor(animal.foodConsumedPerHour * count),
  };
  if (count > 0 && animal.secondaryResource && animal.secondaryPerHour) {
    result.secondary = {
      resource: animal.secondaryResource,
      amount: Math.floor(animal.secondaryPerHour * count),
    };
  }
  return result;
}
