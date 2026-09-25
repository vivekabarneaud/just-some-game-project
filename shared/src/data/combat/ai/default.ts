import type { AIBehavior } from "./types.js";
import { FLIGHT_STATES, FLIGHT_TRANSITIONS } from "./flight.js";

/**
 * The default behavior — every unit starts here unless overridden.
 *
 * `normal` has no onTurn hook, so the round pipeline runs its usual flow:
 *   adventurer: try class abilities in order → fall back to basic attack
 *   enemy:      try enemy abilities         → fall back to basic attack
 *
 * Breaking is not hand-coded any more: the flight states and their transitions
 * (./flight.ts) are spread in, so `normal → fleeing` and `normal → yielded` are
 * ordinary transitions. A boss behavior that wants its creature to be able to
 * break spreads the same two constants in rather than reimplementing them.
 */
export const DEFAULT_BEHAVIOR: AIBehavior = {
  id: "default",
  initial: "normal",
  states: {
    normal: { id: "normal" },
    ...FLIGHT_STATES,
  },
  transitions: [...FLIGHT_TRANSITIONS],
};
