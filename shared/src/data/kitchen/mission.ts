// ─── Cooking → the mission-pack facet ───────────────────────────────────────
// What a packed dish does for an adventurer on the road. Mild, per the design:
// nourishment → a well-fed HP bonus (same scale as the fixed foods); comfort →
// a small loyalty gain (you fed them well). See docs/DESIGN_KITCHEN.md §effects.

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
 *  fixed foods give +5 to +10); loyalty ≈ comfort / 3 (a nudge, not a grind). */
export function dishMissionBoons(effects: DishEffect[]): DishMissionBoons {
  return {
    hpBonus: Math.round(amountOf(effects, "nourishment")),
    loyalty: Math.round(amountOf(effects, "comfort") / 3),
  };
}
