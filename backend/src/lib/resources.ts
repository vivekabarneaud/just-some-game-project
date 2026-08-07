import type { GameState, TradeResourceKey as SharedTradeResourceKey } from "@medieval-realm/shared";

// Re-export shared's union so routes and services that cross the API boundary
// get the same type the client sends.
export type TradeResourceKey = SharedTradeResourceKey;

// Where each trade good actually lives on the saved blob (mirrors the
// frontend's storage model — see frontend/src/engine/gameState.tsx):
//  - gold/wood/stone      → state.resources.*
//  - food (generic)       → state.foods (a per-type record; total = sum)
//  - fruit (generic)      → the fruit entries of state.foods
//  - spices               → state.exotics record
//  - iron/wool/fiber/ale/honey → top-level scalar fields
// (Previously "food" read state.resources.food and "fruit" read state.fruit —
// neither exists, so food/fruit trades always saw 0 and spice trades hit
// phantom top-level keys. See docs/TECH_DEBT.md 1.5.)
const CORE_RESOURCES = new Set(["gold", "wood", "stone"]);
const EXOTIC_RESOURCES = new Set(["pepper", "cinnamon", "tea", "chili", "saffron"]);
const FRUIT_FOODS = ["apples", "pears", "cherries", "strawberries"];
const VALID_RESOURCES = new Set<string>([
  "gold", "wood", "stone", "food", "iron", "wool", "fiber", "ale", "honey", "fruit",
  "pepper", "cinnamon", "tea", "chili", "saffron",
]);

export function isValidResource(key: string): key is TradeResourceKey {
  return VALID_RESOURCES.has(key);
}

function foodsOf(state: GameState): Record<string, number> {
  return (state.foods ?? {}) as Record<string, number>;
}

// The stale shared GameState doesn't declare `exotics` yet (TECH_DEBT 4.1);
// the saved blob does.
function exoticsOf(state: GameState): Record<string, number> {
  const s = state as any;
  if (!s.exotics) s.exotics = {};
  return s.exotics as Record<string, number>;
}

export function getResource(state: GameState, key: TradeResourceKey): number {
  if (CORE_RESOURCES.has(key)) return (state.resources as any)[key] ?? 0;
  if (key === "food") return Object.values(foodsOf(state)).reduce((sum, n) => sum + (n ?? 0), 0);
  if (key === "fruit") return FRUIT_FOODS.reduce((sum, f) => sum + (foodsOf(state)[f] ?? 0), 0);
  if (EXOTIC_RESOURCES.has(key)) return exoticsOf(state)[key] ?? 0;
  return (state as any)[key] ?? 0;
}

/** Drain `amount` across the given food types, most-abundant-first (mirrors the
 *  frontend's consumeFoodCost). Returns how much was actually drained. */
function drainFoods(foods: Record<string, number>, types: string[], amount: number): number {
  let need = amount;
  const sorted = types.filter((t) => (foods[t] ?? 0) > 0).sort((a, b) => (foods[b] ?? 0) - (foods[a] ?? 0));
  for (const t of sorted) {
    if (need <= 0) break;
    const take = Math.min(foods[t] ?? 0, need);
    foods[t] = (foods[t] ?? 0) - take;
    need -= take;
  }
  return amount - need;
}

export function deductResource(state: GameState, key: TradeResourceKey, amount: number): boolean {
  const current = getResource(state, key);
  if (Math.floor(current) < amount) return false;
  if (key === "food") {
    drainFoods(foodsOf(state), Object.keys(foodsOf(state)), amount);
  } else if (key === "fruit") {
    drainFoods(foodsOf(state), FRUIT_FOODS, amount);
  } else if (EXOTIC_RESOURCES.has(key)) {
    exoticsOf(state)[key] = Math.max(0, (exoticsOf(state)[key] ?? 0) - amount);
  } else if (CORE_RESOURCES.has(key)) {
    (state.resources as any)[key] = Math.max(0, current - amount);
  } else {
    (state as any)[key] = Math.max(0, current - amount);
  }
  return true;
}

export function addResource(state: GameState, key: TradeResourceKey, amount: number): void {
  if (key === "food") {
    // Generic food arrives as wheat, the staple — same default the frontend's
    // grantReward uses for generic "food".
    const foods = foodsOf(state);
    foods.wheat = (foods.wheat ?? 0) + amount;
    (state as any).foods = foods;
  } else if (key === "fruit") {
    const foods = foodsOf(state);
    foods.apples = (foods.apples ?? 0) + amount;
    (state as any).foods = foods;
  } else if (EXOTIC_RESOURCES.has(key)) {
    exoticsOf(state)[key] = (exoticsOf(state)[key] ?? 0) + amount;
  } else if (CORE_RESOURCES.has(key)) {
    (state.resources as any)[key] = ((state.resources as any)[key] ?? 0) + amount;
  } else {
    (state as any)[key] = ((state as any)[key] ?? 0) + amount;
  }
}
