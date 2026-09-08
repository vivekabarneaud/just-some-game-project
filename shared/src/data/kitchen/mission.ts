// ─── Cooking → the mission-pack facet ───────────────────────────────────────
// What a packed dish does for an adventurer on the road. Mild, per the design:
// nourishment → a well-fed HP bonus (same scale as the fixed foods); comfort →
// a small loyalty gain (you fed them well). See docs/IDEAS.md (Kitchen).

import type { DishEffect } from "./types.js";

export interface DishMissionBoons {
  /** Flat HP at combat start (a hardier, well-fed adventurer). */
  hpBonus: number;
  /** Loyalty gained on a safe return (capped/mild — see the daily mission cap). */
  loyalty: number;
}

const amountOf = (effects: DishEffect[], channel: DishEffect["channel"]) =>
  effects.find((e) => e.channel === channel)?.amount ?? 0;

/** Resolve a dish's boons for a mission pack. hpBonus ≈ nourishment (mild — the
 *  fixed foods give +5 to +10); loyalty ≈ comfort / 3 (a nudge, not a grind).
 *  FUTURE (deferred — needs high-tier content to tune): make hpBonus EVOLUTIVE so
 *  a good meal still matters at high level. Plan: scale by the eater's max HP /
 *  level and DISPLAY the actual scaled number (stays a concrete value, not a %,
 *  just bigger for a bigger hero). The scale point is this function + the combat
 *  application in setup.ts + the mission-panel hint. Flat is fine for early game. */
export function dishMissionBoons(effects: DishEffect[]): DishMissionBoons {
  return {
    hpBonus: Math.round(amountOf(effects, "nourishment")),
    loyalty: Math.round(amountOf(effects, "comfort") / 3),
  };
}
