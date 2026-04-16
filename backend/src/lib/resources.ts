import type { GameState } from "@medieval-realm/shared";

export type TradeResourceKey = "gold" | "wood" | "stone" | "food" | "iron" | "wool" | "fiber" | "ale" | "honey" | "fruit";

const CORE_RESOURCES = new Set(["gold", "wood", "stone", "food"]);
const VALID_RESOURCES = new Set<string>(["gold", "wood", "stone", "food", "iron", "wool", "fiber", "ale", "honey", "fruit"]);

export function isValidResource(key: string): key is TradeResourceKey {
  return VALID_RESOURCES.has(key);
}

export function getResource(state: GameState, key: TradeResourceKey): number {
  if (CORE_RESOURCES.has(key)) {
    return (state.resources as any)[key] ?? 0;
  }
  return (state as any)[key] ?? 0;
}

export function setResource(state: GameState, key: TradeResourceKey, value: number): void {
  if (CORE_RESOURCES.has(key)) {
    (state.resources as any)[key] = value;
  } else {
    (state as any)[key] = value;
  }
}

export function deductResource(state: GameState, key: TradeResourceKey, amount: number): boolean {
  const current = getResource(state, key);
  if (Math.floor(current) < amount) return false;
  setResource(state, key, current - amount);
  return true;
}

export function addResource(state: GameState, key: TradeResourceKey, amount: number): void {
  setResource(state, key, getResource(state, key) + amount);
}
