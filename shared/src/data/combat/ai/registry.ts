import type { CombatContext, CombatUnit } from "../types.js";
import type { AIBehavior, AIState } from "./types.js";
import { DEFAULT_BEHAVIOR } from "./default.js";

/**
 * Lookup table: behavior id → definition. Expand as you add boss/elite AIs.
 *
 * Future additions might look like:
 *   { id: "hydra_matriarch", initial: "heads_all", states: {...}, transitions: [...] }
 *
 * Enemy definitions opt in via CombatUnit.aiBehavior during unit-building;
 * adventurers default to "default" unless we add per-class wounded/critical
 * variants later.
 */
const AI_BEHAVIORS: Record<string, AIBehavior> = {
  default: DEFAULT_BEHAVIOR,
};

export function getBehavior(id: string | undefined): AIBehavior {
  if (!id) return DEFAULT_BEHAVIOR;
  return AI_BEHAVIORS[id] ?? DEFAULT_BEHAVIOR;
}

/** Returns the active state for a unit, creating the default entry if missing. */
export function getCurrentState(unit: CombatUnit): { behavior: AIBehavior; state: AIState } {
  const behavior = getBehavior(unit.aiBehavior);
  if (!unit.aiState) unit.aiState = behavior.initial;
  const state = behavior.states[unit.aiState] ?? behavior.states[behavior.initial];
  return { behavior, state };
}

/**
 * Evaluate transitions for a unit in its current state. If a transition fires,
 * update the unit's state. Called once per round per unit before actions.
 */
export function evaluateTransitions(unit: CombatUnit, ctx: CombatContext): void {
  const { behavior } = getCurrentState(unit);
  if (!behavior.transitions?.length) return;
  for (const t of behavior.transitions) {
    if (t.from !== unit.aiState) continue;
    if (t.when(unit, ctx)) {
      unit.aiState = t.to;
      return;
    }
  }
}
