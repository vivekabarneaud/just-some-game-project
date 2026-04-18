import type { AIBehavior } from "./types.js";

/**
 * The default single-state behavior — every unit starts here unless overridden.
 *
 * With no onTurn hook, the round pipeline runs its normal flow:
 *   adventurer: try class abilities in order → fall back to basic attack
 *   enemy:      try enemy abilities         → fall back to basic attack
 *
 * New behaviors (boss phases, wounded/critical adventurer modes, enraged
 * enemies, etc.) can subclass this by copying the structure and adding states
 * or transitions — they don't need to reimplement the whole turn.
 */
export const DEFAULT_BEHAVIOR: AIBehavior = {
  id: "default",
  initial: "normal",
  states: {
    normal: { id: "normal" },
  },
};
