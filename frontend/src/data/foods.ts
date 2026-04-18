// ─── Food Item Types ──────────────────────────────────────────
// Tracks individual food stockpiles. The pantry caps the TOTAL across all types.
// Consumption is proportional — citizens eat from all types in proportion to stock.

export type FoodItemType =
  | "wheat" | "barley"
  | "cabbages" | "turnips" | "peas" | "squash"
  | "meat" | "eggs" | "milk"
  | "berries" | "mushrooms" | "nuts"
  | "fish";

export interface FoodItemMeta {
  id: FoodItemType;
  label: string;
  icon: string;
  /** Display order in dropdown */
  order: number;
}

export const FOOD_ITEMS: FoodItemMeta[] = [
  // Grains
  { id: "wheat",     label: "Wheat",     icon: "🌾", order: 1 },
  { id: "barley",    label: "Barley",    icon: "🌿", order: 2 },
  // Vegetables
  { id: "cabbages",  label: "Cabbages",  icon: "🥬", order: 10 },
  { id: "turnips",   label: "Turnips",   icon: "🥕", order: 11 },
  { id: "peas",      label: "Peas",      icon: "🫛", order: 12 },
  { id: "squash",    label: "Squash",    icon: "🎃", order: 13 },
  // Animal products
  { id: "meat",      label: "Meat",      icon: "🍖", order: 20 },
  { id: "eggs",      label: "Eggs",      icon: "🥚", order: 21 },
  { id: "milk",      label: "Milk",      icon: "🥛", order: 22 },
  // Wild foods
  { id: "berries",   label: "Berries",   icon: "🫐", order: 30 },
  { id: "mushrooms", label: "Mushrooms", icon: "🍄", order: 31 },
  { id: "nuts",      label: "Nuts",      icon: "🌰", order: 32 },
  { id: "fish",      label: "Fish",      icon: "🐟", order: 33 },
];

export const FOOD_ITEM_IDS: FoodItemType[] = FOOD_ITEMS.map((f) => f.id);

export function getFoodMeta(id: FoodItemType): FoodItemMeta {
  return FOOD_ITEMS.find((f) => f.id === id)!;
}

/** Create an empty foods record with all types set to 0. */
export function emptyFoods(): Record<FoodItemType, number> {
  const foods = {} as Record<FoodItemType, number>;
  for (const id of FOOD_ITEM_IDS) foods[id] = 0;
  return foods;
}

/** Total food across all types. */
export function getTotalFood(foods: Record<FoodItemType, number> | undefined): number {
  if (!foods) return 0;
  let total = 0;
  for (const id of FOOD_ITEM_IDS) total += foods[id] ?? 0;
  return total;
}

/**
 * Deduct `amount` of food proportionally across all types.
 * Mutates the foods record. Returns the actual amount consumed (may be less if stock is insufficient).
 */
export function consumeFood(foods: Record<FoodItemType, number>, amount: number): number {
  if (amount <= 0) return 0;
  const total = getTotalFood(foods);
  if (total <= 0) return 0;
  const toConsume = Math.min(amount, total);

  let consumed = 0;
  for (const id of FOOD_ITEM_IDS) {
    const stock = foods[id] ?? 0;
    if (stock <= 0) continue;
    const share = (stock / total) * toConsume;
    const taken = Math.min(stock, share);
    foods[id] = stock - taken;
    consumed += taken;
  }
  return consumed;
}

/**
 * Add `amount` of a specific food type, respecting the shared cap.
 * If adding would exceed the cap, only add up to the cap.
 * Mutates the foods record. Returns actual amount added.
 */
export function addFood(
  foods: Record<FoodItemType, number>,
  type: FoodItemType,
  amount: number,
  cap: number,
): number {
  if (amount <= 0) return 0;
  const total = getTotalFood(foods);
  const room = Math.max(0, cap - total);
  const actual = Math.min(amount, room);
  foods[type] = (foods[type] ?? 0) + actual;
  return actual;
}

/** Migrate an old save's flat resources.food into the new typed foods map. */
export function migrateFoodsFromLegacy(legacyFood: number | undefined): Record<FoodItemType, number> {
  const foods = emptyFoods();
  if (legacyFood && legacyFood > 0) {
    foods.wheat = legacyFood;
  }
  return foods;
}
