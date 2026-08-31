// ─── Free-form alchemy — what a brew DOES when used ─────────────────────────
// Pure readers over a recipe's effect list, so the engine (Phase 3 use-wiring)
// can apply a brewed potion the same way everywhere. At-home recovery only for
// now; combat application comes with the mission-supply slice.

import type { Effect } from "./types.js";

export interface RecoverySummary {
  /** Flat HP restored (sum of heal_hp). */
  healHp: number;
  /** Game-hours a matching-line ailment's recovery is sped by. */
  easeFever: number;
  easeGut: number;
  easeWound: number;
  /** Applies to any ailment line. */
  general: number;
  happiness: number;
  /** Adventurer condition types this brew clears outright (bleed/poison/venom/froth). */
  cures: string[];
}

export function summarizeRecovery(effects: Effect[]): RecoverySummary {
  const s: RecoverySummary = { healHp: 0, easeFever: 0, easeGut: 0, easeWound: 0, general: 0, happiness: 0, cures: [] };
  for (const e of effects) {
    switch (e.channel) {
      case "heal_hp": s.healHp += e.amount; break;
      case "ease_fever": s.easeFever += e.amount; break;
      case "ease_gut": s.easeGut += e.amount; break;
      case "ease_wound": s.easeWound += e.amount; break;
      case "general_recovery": s.general += e.amount; break;
      case "happiness": s.happiness += e.amount; break;
      case "cure_bleed": s.cures.push("bleed"); break;
      case "cure_poison": s.cures.push("poison"); break;
      case "cure_venom": s.cures.push("venom"); break;
      case "cure_froth": s.cures.push("froth"); break;
    }
  }
  return s;
}

/** Hours of recovery this brew removes from an ailment of the given line
 *  (its matching ease_<line> plus the line-agnostic general recovery). */
export function easeHoursFor(sum: RecoverySummary, line: "fever" | "gut" | "wound"): number {
  const byLine = line === "fever" ? sum.easeFever : line === "gut" ? sum.easeGut : sum.easeWound;
  return byLine + sum.general;
}

