import type { AdventurerClass } from "../../adventurers.js";
import type { CombatContext, CombatUnit } from "../types.js";

/**
 * Class ability handler. Each class registers one or more handlers, tried in
 * registration order until one fires. If none fire the unit falls back to a
 * basic attack. Returning `true` means the handler consumed the action.
 */
export interface ClassAbilityHandler {
  id: string;
  run(unit: CombatUnit, ctx: CombatContext): boolean;
}

export type ClassAbilityRegistry = Record<AdventurerClass, ClassAbilityHandler[]>;
