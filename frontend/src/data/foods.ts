// ─── Food Item Types ──────────────────────────────────────────
// Tracks individual food stockpiles. The pantry caps the TOTAL across all types.
// Consumption is proportional — citizens eat from all types in proportion to stock.

export type FoodItemType =
  | "wheat" | "barley"
  | "cabbages" | "turnips" | "peas" | "squash"
  | "apples" | "pears" | "cherries"
  | "meat" | "eggs" | "milk" | "fish"
  | "berries" | "mushrooms" | "nuts";

export type FoodCategoryId = "grain" | "veggie" | "fruit" | "animal" | "wild";

export interface FoodItemMeta {
  id: FoodItemType;
  label: string;
  icon: string;
  /** Optional custom icon image URL — replaces the emoji when set. */
  iconImage?: string;
  /** Display order within its category */
  order: number;
  category: FoodCategoryId;
}

export interface FoodCategoryMeta {
  id: FoodCategoryId;
  label: string;
  icon: string;
  order: number;
}

export const FOOD_CATEGORIES: FoodCategoryMeta[] = [
  { id: "grain",  label: "Grains",          icon: "🌾", order: 1 },
  { id: "veggie", label: "Vegetables",      icon: "🥬", order: 2 },
  { id: "fruit",  label: "Fruits",          icon: "🍎", order: 3 },
  { id: "animal", label: "Animal Products", icon: "🍖", order: 4 },
  { id: "wild",   label: "Wild Foods",      icon: "🍄", order: 5 },
];

export const FOOD_ITEMS: FoodItemMeta[] = [
  // Grains
  { id: "wheat",     label: "Wheat",     icon: "🌾", order: 1, category: "grain" },
  { id: "barley",    label: "Barley",    icon: "🌿", order: 2, category: "grain" },
  // Vegetables
  { id: "cabbages",  label: "Cabbages",  icon: "🥬", order: 1, category: "veggie" },
  { id: "turnips",   label: "Turnips",   icon: "🥕", order: 2, category: "veggie" },
  { id: "peas",      label: "Peas",      icon: "🫛", order: 3, category: "veggie" },
  { id: "squash",    label: "Squash",    icon: "🎃", order: 4, category: "veggie" },
  // Fruits
  { id: "apples",    label: "Apples",    icon: "🍎", iconImage: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/icons/apple.png?v=2", order: 1, category: "fruit" },
  { id: "pears",     label: "Pears",     icon: "🍐", order: 2, category: "fruit" },
  { id: "cherries",  label: "Cherries",  icon: "🍒", order: 3, category: "fruit" },
  // Animal products
  { id: "meat",      label: "Meat",      icon: "🍖", order: 1, category: "animal" },
  { id: "eggs",      label: "Eggs",      icon: "🥚", order: 2, category: "animal" },
  { id: "milk",      label: "Milk",      icon: "🥛", order: 3, category: "animal" },
  { id: "fish",      label: "Fish",      icon: "🐟", order: 4, category: "animal" },
  // Wild foods
  { id: "berries",   label: "Berries",   icon: "🫐", order: 1, category: "wild" },
  { id: "mushrooms", label: "Mushrooms", icon: "🍄", order: 2, category: "wild" },
  { id: "nuts",      label: "Nuts",      icon: "🌰", order: 3, category: "wild" },
];

export const FOOD_ITEM_IDS: FoodItemType[] = FOOD_ITEMS.map((f) => f.id);

export function getFoodMeta(id: FoodItemType): FoodItemMeta {
  return FOOD_ITEMS.find((f) => f.id === id)!;
}

/** Fast set-lookup for whether a string is a valid FoodItemType. */
const FOOD_ITEM_ID_SET: Set<string> = new Set(FOOD_ITEMS.map((f) => f.id));
export function isFoodItemType(id: string): id is FoodItemType {
  return FOOD_ITEM_ID_SET.has(id);
}

/** How much of a given cost resource the player has right now. Supports the
 *  "grain" alias (sum of wheat + barley) so interchangeable grains work cleanly. */
export function getFoodCostAmount(foods: Record<FoodItemType, number> | undefined, resource: string): number {
  if (!foods) return 0;
  if (resource === "grain") return (foods.wheat ?? 0) + (foods.barley ?? 0);
  if (isFoodItemType(resource)) return foods[resource] ?? 0;
  return 0;
}

/** Drain a cost amount from a food-type resource. For "grain", takes from
 *  whichever of wheat/barley is most abundant first (so the player doesn't
 *  accidentally zero out one type while the other has plenty). Mutates. */
export function consumeFoodCost(foods: Record<FoodItemType, number>, resource: string, amount: number): void {
  if (amount <= 0) return;
  if (resource === "grain") {
    // Take from the larger stockpile first, fall back to the other if it runs out
    let remaining = amount;
    const order: FoodItemType[] = (foods.wheat ?? 0) >= (foods.barley ?? 0)
      ? ["wheat", "barley"]
      : ["barley", "wheat"];
    for (const t of order) {
      const take = Math.min(foods[t] ?? 0, remaining);
      foods[t] = (foods[t] ?? 0) - take;
      remaining -= take;
      if (remaining <= 0) break;
    }
    return;
  }
  if (isFoodItemType(resource)) {
    foods[resource] = Math.max(0, (foods[resource] ?? 0) - amount);
  }
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
