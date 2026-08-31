// ─── Food Item Types ──────────────────────────────────────────
// Tracks individual food stockpiles. The pantry caps the TOTAL across all types.
// Consumption is proportional — citizens eat from all types in proportion to stock.

export type FoodItemType =
  | "wheat" | "barley"
  | "cabbages" | "turnips" | "peas" | "squash" | "fava"
  | "apples" | "pears" | "cherries" | "strawberries"
  | "venison" | "boar" | "wisent" | "pork" | "mutton" | "goat" | "chicken" | "wild_fowl" | "rabbit"
  | "eggs" | "milk"
  | "trout" | "pike" | "eel" | "salmon"
  | "blackberry" | "blueberry" | "raspberry" | "nuts"
  | "dandelion" | "sorrel" | "ramsons" | "wild_carrot"
  | "field_mushroom" | "morel" | "chanterelle" | "cepe"
  | "porridge" | "hearth_stew" | "river_stew" | "bone_broth";

export type FoodCategoryId = "grain" | "veggie" | "fruit" | "animal" | "wild" | "cooked";

/** How a cooked dish is served at the tavern — drives the menu columns.
 *  Added slowly: tag new dishes as drinks (teas, ale-based) or desserts as
 *  they arrive; untagged cooked dishes read as meals. */
export type DishKind = "meal" | "drink" | "dessert";

export interface FoodItemMeta {
  id: FoodItemType;
  label: string;
  icon: string;
  /** Optional custom icon image URL — replaces the emoji when set. */
  iconImage?: string;
  /** Display order within its category */
  order: number;
  category: FoodCategoryId;
  /** Tavern menu column (cooked dishes only). Defaults to "meal" when unset. */
  kind?: DishKind;
}

export interface FoodCategoryMeta {
  id: FoodCategoryId;
  label: string;
  icon: string;
  order: number;
}


export const FOOD_ITEMS: FoodItemMeta[] = [
  // Grains
  { id: "wheat",     label: "Wheat",     icon: "🌾", order: 1, category: "grain" },
  { id: "barley",    label: "Barley",    icon: "🌿", order: 2, category: "grain" },
  // Vegetables
  { id: "cabbages",  label: "Cabbages",  icon: "🥬", order: 1, category: "veggie" },
  { id: "turnips",   label: "Turnips",   icon: "🥕", order: 2, category: "veggie" },
  { id: "peas",      label: "Peas",      icon: "🫛", order: 3, category: "veggie" },
  { id: "squash",    label: "Gourd",     icon: "🎃", order: 4, category: "veggie" },
  { id: "fava",      label: "Fava Beans", icon: "🫘", order: 5, category: "veggie" },
  // Fruits
  { id: "apples",    label: "Apples",    icon: "🍎", iconImage: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/icons/apple.png?v=2", order: 1, category: "fruit" },
  { id: "pears",     label: "Pears",     icon: "🍐", order: 2, category: "fruit" },
  { id: "cherries",  label: "Cherries",  icon: "🍒", order: 3, category: "fruit" },
  { id: "strawberries", label: "Strawberries", icon: "🍓", order: 4, category: "fruit" },
  // Animal products — meats (all share the "meat" recipe/feed alias below)
  { id: "venison",   label: "Venison",   icon: "🦌", order: 1, category: "animal" },
  { id: "boar",      label: "Boar",      icon: "🐗", order: 2, category: "animal" },
  { id: "wisent",    label: "Wisent",    icon: "🦬", order: 3, category: "animal" },
  { id: "pork",      label: "Pork",      icon: "🥓", order: 4, category: "animal" },
  { id: "mutton",    label: "Mutton",    icon: "🐑", order: 5, category: "animal" },
  { id: "goat",      label: "Goat",      icon: "🐐", order: 6, category: "animal" },
  { id: "chicken",   label: "Chicken",   icon: "🍗", order: 7, category: "animal" },
  { id: "wild_fowl", label: "Wild Fowl", icon: "🦆", order: 8, category: "animal" },
  { id: "rabbit",    label: "Rabbit",    icon: "🐰", order: 9, category: "animal" },
  { id: "eggs",      label: "Eggs",      icon: "🥚", order: 10, category: "animal" },
  { id: "milk",      label: "Milk",      icon: "🥛", order: 11, category: "animal" },
  // Fish (all share the "fish" recipe/feed alias below)
  { id: "trout",     label: "Trout",     icon: "🐟", order: 12, category: "animal" },
  { id: "pike",      label: "Pike",      icon: "🐠", order: 13, category: "animal" },
  { id: "eel",       label: "Eel",       icon: "🐍", order: 14, category: "animal" },
  { id: "salmon",    label: "Salmon",    icon: "🍥", order: 15, category: "animal" },
  // Wild foods — foraged. Berries share the "berries" alias, mushrooms the
  // "mushrooms" alias; the whole category is the "wild" alias.
  { id: "blackberry",    label: "Blackberry",  icon: "🫐", order: 1, category: "wild" },
  { id: "blueberry",     label: "Blueberry",   icon: "🫐", order: 2, category: "wild" },
  { id: "raspberry",     label: "Raspberry",   icon: "🫐", order: 3, category: "wild" },
  { id: "dandelion",     label: "Dandelion",   icon: "🌼", order: 4, category: "wild" },
  { id: "sorrel",        label: "Sorrel",      icon: "🌿", order: 5, category: "wild" },
  { id: "ramsons",       label: "Ramsons",     icon: "🧄", order: 6, category: "wild" },
  { id: "wild_carrot",   label: "Wild Carrot", icon: "🥕", order: 7, category: "wild" },
  { id: "field_mushroom", label: "Field Mushroom", icon: "🍄", order: 8, category: "wild" },
  { id: "morel",         label: "Morel",       icon: "🍄", order: 9, category: "wild" },
  { id: "chanterelle",   label: "Chanterelle", icon: "🍄", order: 10, category: "wild" },
  { id: "cepe",          label: "King Bolete", icon: "🍄", order: 11, category: "wild" },
  { id: "nuts",          label: "Nuts",        icon: "🌰", order: 12, category: "wild" },
  // Cooked meals — made at the Kitchen; stretch raw food into more portions and
  // count toward food diversity (a hot meal). See crafting.ts kitchen recipes.
  { id: "porridge",    label: "Porridge",    icon: "🥣", iconImage: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/icons/porridge.png",    order: 1, category: "cooked", kind: "meal" },
  { id: "hearth_stew", label: "Hearth Stew", icon: "🍲", iconImage: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/icons/hearth_stew.png", order: 2, category: "cooked", kind: "meal" },
  { id: "river_stew",  label: "River Stew",  icon: "🍲", iconImage: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/icons/river_stew.png",  order: 3, category: "cooked", kind: "meal" },
  { id: "bone_broth",  label: "Bone Broth",  icon: "🍜", order: 4, category: "cooked", kind: "meal" },
];

export const FOOD_ITEM_IDS: FoodItemType[] = FOOD_ITEMS.map((f) => f.id);

/** The specific meats behind the "meat" cost/feed alias. A recipe or reward that
 *  asks for "meat" resolves across all of these (like "grain" = wheat+barley), so
 *  the meat split never breaks a recipe. Grant sites pick a SPECIFIC meat (cull →
 *  per animal, hunting camp → seasonal catch, boar hunt → boar). */
export const MEAT_TYPES: FoodItemType[] = ["venison", "boar", "wisent", "pork", "mutton", "goat", "chicken", "wild_fowl", "rabbit"];

/** The specific fish behind the "fish" cost/feed alias (same pattern as MEAT_TYPES).
 *  Grant sites pick a specific fish (hut → trout/pike, eel event, salmon mission). */
export const FISH_TYPES: FoodItemType[] = ["trout", "pike", "eel", "salmon"];

/** The specific mushrooms behind the "mushrooms" alias. Also folded into the
 *  "wild" alias below. */
export const MUSHROOM_TYPES: FoodItemType[] = ["field_mushroom", "morel", "chanterelle", "cepe"];

/** The wild foraged berries behind the "berries" alias (strawberry is a cultivated
 *  garden Fruit, NOT in this alias). */
export const BERRY_TYPES: FoodItemType[] = ["blackberry", "blueberry", "raspberry"];

/** Everything the Forager brings home = the "wild" alias. Derived from the wild
 *  category so new foraged foods fold in automatically. */
export const WILD_TYPES: FoodItemType[] = FOOD_ITEMS.filter((f) => f.category === "wild").map((f) => f.id);

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
  if (resource === "mushrooms") return MUSHROOM_TYPES.reduce((sum, t) => sum + (foods[t] ?? 0), 0);
  if (resource === "berries") return BERRY_TYPES.reduce((sum, t) => sum + (foods[t] ?? 0), 0);
  if (resource === "wild") return WILD_TYPES.reduce((sum, t) => sum + (foods[t] ?? 0), 0);
  if (resource === "meat") return MEAT_TYPES.reduce((sum, t) => sum + (foods[t] ?? 0), 0);
  if (resource === "fish") return FISH_TYPES.reduce((sum, t) => sum + (foods[t] ?? 0), 0);
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
  if (resource === "meat" || resource === "fish" || resource === "mushrooms" || resource === "berries" || resource === "wild") {
    // Take the alias's members most-abundant-first so a stew doesn't zero out the
    // venison while the larder is full of pork (or the trout while it has pike).
    let remaining = amount;
    const pool = resource === "meat" ? MEAT_TYPES
      : resource === "fish" ? FISH_TYPES
      : resource === "mushrooms" ? MUSHROOM_TYPES
      : resource === "berries" ? BERRY_TYPES
      : WILD_TYPES;
    const order = [...pool].sort((a, b) => (foods[b] ?? 0) - (foods[a] ?? 0));
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

