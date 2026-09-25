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
 * The first real citizen is FLIGHT (./flight.ts): breaking is a transition, and
 * `fleeing` / `yielded` are states that own their own turn. That is what lets a
 * broken creature do more than run in a straight line -- a withdrawing mage can
 * cast frost over its shoulder, where the old hand-coded block allowed nothing
 * but a basic attack.
 */
export interface AIBehavior {
  id: string;
  initial: string;
  states: Record<string, AIState>;
  transitions?: AITransition[];
}

/**
 * Per-round behavior hook for a state. All are optional:
 *   - onEnter: one-shot work when a transition lands here (stamp flags, push the
 *     log beat, raise a stat). Runs once, from evaluateTransitions, NOT per turn.
 *   - onTurn: custom action for this turn (if returns true, the turn is consumed
 *     INCLUDING its movement — the state owns the whole beat)
 *   - preferredAbilities: ordered list of ability ids to try first (before default list)
 *   - allowAbilities: false = basic attacks only in this state (default true)
 *
 * When onTurn is absent, the default round pipeline handles the unit normally.
 * This lets most states be tiny, with only exotic behaviors overriding the full turn.
 */
export interface AIState {
  id: string;
  onEnter?: (unit: CombatUnit, ctx: CombatContext) => void;
  onTurn?: (unit: CombatUnit, ctx: CombatContext) => boolean;
  preferredAbilities?: string[];
  allowAbilities?: boolean;
}

/** A guard from one state to another, checked once per round before the action phase. */
export interface AITransition {
  from: string;
  to: string;
  when: (unit: CombatUnit, ctx: CombatContext) => boolean;
}
