import type { CombatContext, CombatUnit } from "../types.js";

/**
 * Per-unit behavior modeled as a state machine.
 *
 * Each unit gets an AIBehavior (resolved at unit-build time or on the fly).
 * The behavior has one or more states. Each round, transitions are evaluated:
 * the first matching transition moves the unit to a new state. The state then
 * controls ability priority + targeting + potion use for that unit's turn.
 *
 * Typical uses:
 *   - Boss phases: state=phase1, transition at HP < 50% → phase2 (different abilities)
 *   - Adventurer danger mode: state=healthy → wounded → critical (healing priority)
 *   - Enraged berserker: hp_below_30 → enraged (damage mult, ignore targeting)
 *
 * Today only a "default" behavior exists, wrapping the current hand-coded logic
 * so the migration is a no-op. New behaviors are cheap to add.
 */
export interface AIBehavior {
  id: string;
  initial: string;
  states: Record<string, AIState>;
  transitions?: AITransition[];
}

/**
 * Per-round behavior hook for a state. All three are optional:
 *   - onTurn: custom action for this turn (if returns true, turn is consumed)
 *   - preferredAbilities: ordered list of ability ids to try first (before default list)
 *   - shouldUsePotion: override the default "drink at round 1" / "drink when low HP" policy
 *
 * When onTurn is absent, the default round pipeline handles the unit normally.
 * This lets most states be tiny, with only exotic behaviors overriding the full turn.
 */
export interface AIState {
  id: string;
  onTurn?: (unit: CombatUnit, ctx: CombatContext) => boolean;
  preferredAbilities?: string[];
}

/** A guard from one state to another, checked once per round before the action phase. */
export interface AITransition {
  from: string;
  to: string;
  when: (unit: CombatUnit, ctx: CombatContext) => boolean;
}
