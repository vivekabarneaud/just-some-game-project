import type { CombatContext, CombatUnit } from "../types.js";
import type { ClassAbilityHandler, ClassAbilityRegistry } from "./types.js";
import type { AIState } from "../ai/types.js";
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
 *
 * The unit's current AI state may reorder that list via `preferredAbilities`:
 * same handlers, different priority, so a state can change what a unit reaches
 * for first without a second copy of the registry.
 */
export function tryClassAbility(unit: CombatUnit, ctx: CombatContext, state?: AIState): boolean {
  if (!unit.class || unit.isEnemy) return false;
  const handlers = CLASS_ABILITIES[unit.class];
  if (!handlers) return false;
  for (const h of preferFirst(handlers, state)) {
    if (h.run(unit, ctx)) return true;
  }
  return false;
}

/**
 * Registration order, with the current state's `preferredAbilities` lifted to
 * the front in the order named. Ids that match nothing are ignored, and
 * everything unnamed keeps its relative order behind them — so a state names
 * only what it wants reached for first, never the whole list.
 */
export function preferFirst<T extends { id: string }>(abilities: T[], state?: AIState): T[] {
  const preferred = state?.preferredAbilities;
  if (!preferred?.length) return abilities;
  const rank = new Map(preferred.map((id, i) => [id, i]));
  return [...abilities].sort(
    (a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

export type { ClassAbilityHandler };
export { tryEnemyAbility } from "./enemy.js";
