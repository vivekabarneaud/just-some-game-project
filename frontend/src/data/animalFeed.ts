// ─── Animal Feed Categories ────────────────────────────────────
// Animals no longer eat from a generic food pool — each species prefers certain
// food categories, and grazers (sheep, goats) can supplement with fallow-field
// grazing. If none of a pen's preferred categories are stocked, it starves
// (production scales with fedRatio; 0 when nothing is covered).

import type { FoodItemType } from "./foods";
import type { AnimalId } from "@medieval-realm/shared/data/livestock";

export type FeedCategory = "grain" | "veggie" | "fruit";

/** Which category each food item falls into. Animal products (meat/eggs/milk/fish)
 *  are excluded — animals don't eat them. */
export const FOOD_CATEGORY: Partial<Record<FoodItemType, FeedCategory>> = {
  // Grains
  wheat: "grain",
  barley: "grain",
  // Vegetables
  cabbages: "veggie",
  turnips: "veggie",
  peas: "veggie",
  squash: "veggie",
  // "Fruit" includes orchard fruits + foraged berries/nuts/mushrooms
  apples: "fruit",
  pears: "fruit",
  cherries: "fruit",
  berries: "fruit",
  mushrooms: "fruit",
  nuts: "fruit",
  // meat, eggs, milk, fish → not animal feed
};

/** What each species can eat, in order of preference. */
export const ANIMAL_FEED: Record<AnimalId, FeedCategory[]> = {
  chickens: ["grain", "veggie"],
  pigs: ["grain", "veggie", "fruit"], // omnivores
  goats: ["fruit", "veggie"],
  sheep: ["grain", "veggie"],
};

/** Animals that can graze on fallow fields. */
export const GRAZERS: AnimalId[] = ["sheep", "goats"];

/** Food/hour each fallow field provides to grazers combined. */
export const GRAZING_PER_FIELD = 3;

export function isGrazer(animal: AnimalId): boolean {
  return GRAZERS.includes(animal);
}

/** Sum how many food units a pen can get from its preferred categories. */
export function availableFromCategories(
  foods: Record<FoodItemType, number>,
  categories: FeedCategory[],
): number {
  let total = 0;
  for (const [food, cat] of Object.entries(FOOD_CATEGORY)) {
    if (cat && categories.includes(cat)) {
      total += foods[food as FoodItemType] ?? 0;
    }
  }
  return total;
}

/** Consume `amount` of food, drained proportionally across the pen's preferred
 *  categories. Returns actually-consumed amount (capped by stock). Mutates. */
export function consumeFromCategories(
  foods: Record<FoodItemType, number>,
  categories: FeedCategory[],
  amount: number,
): number {
  if (amount <= 0) return 0;
  const eligible: FoodItemType[] = [];
  let total = 0;
  for (const [food, cat] of Object.entries(FOOD_CATEGORY)) {
    if (cat && categories.includes(cat)) {
      const stock = foods[food as FoodItemType] ?? 0;
      if (stock > 0) {
        eligible.push(food as FoodItemType);
        total += stock;
      }
    }
  }
  if (total <= 0) return 0;
  const toConsume = Math.min(amount, total);
  let consumed = 0;
  for (const food of eligible) {
    const stock = foods[food] ?? 0;
    const share = (stock / total) * toConsume;
    const taken = Math.min(stock, share);
    foods[food] = stock - taken;
    consumed += taken;
  }
  return consumed;
}

export const FEED_CATEGORY_ICON: Record<FeedCategory, string> = {
  grain: "🌾",
  veggie: "🥬",
  fruit: "🍎",
};

export const FEED_CATEGORY_LABEL: Record<FeedCategory, string> = {
  grain: "grain",
  veggie: "veggies",
  fruit: "fruit",
};
