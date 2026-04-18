import type { AdventurerClass } from "../../adventurers.js";
import type { CombatContext, CombatUnit } from "../types.js";
import type { ClassAbilityHandler, ClassAbilityRegistry } from "./types.js";
import { WARRIOR_ABILITIES } from "./warrior.js";
import { WIZARD_ABILITIES } from "./wizard.js";
import { PRIEST_ABILITIES } from "./priest.js";
import { ARCHER_ABILITIES } from "./archer.js";
import { ASSASSIN_ABILITIES } from "./assassin.js";

/**
 * Class ability registry. To add a new ability: write a handler in the class's
 * file, append it to that class's export array. Evaluation order = priority —
 * the first handler that fires consumes the unit's action.
 */
export const CLASS_ABILITIES: ClassAbilityRegistry = {
  warrior: WARRIOR_ABILITIES,
  wizard: WIZARD_ABILITIES,
  priest: PRIEST_ABILITIES,
  archer: ARCHER_ABILITIES,
  assassin: ASSASSIN_ABILITIES,
};

/**
 * Dispatch — try each handler for the unit's class in registration order.
 * Returns true as soon as one fires. Enemies are handled separately via
 * tryEnemyAbility in ./enemy.
 */
export function tryClassAbility(unit: CombatUnit, ctx: CombatContext): boolean {
  if (!unit.class || unit.isEnemy) return false;
  const handlers = CLASS_ABILITIES[unit.class];
  if (!handlers) return false;
  for (const h of handlers) {
    if (h.run(unit, ctx)) return true;
  }
  return false;
}

export type { ClassAbilityHandler };
export { tryEnemyAbility } from "./enemy.js";
