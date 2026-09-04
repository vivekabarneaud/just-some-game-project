// ─── Composable AI knobs: resolution ────────────────────────────────────────
// One place where an enemy's authored `ai` block, its `routsAt` threshold and
// the defaults collapse into a single resolved AIProfile. Consumers read the
// resolved profile and nothing else.
//
// See TIER1_ENEMIES §1 "Composable AI (knobs, not one tier)" and
// ROUT_AND_FLIGHT for the `fear` styles. The legacy `aiTier` / `tauntImmunity`
// fields were deleted 2026-09-04 — every enemy authors `ai` directly.

import type { AIFear, AIProfile, CombatUnit } from "../types.js";

export const DEFAULT_AI: AIProfile = { targeting: "threat", tauntable: "obeys", fear: "withdraws" };
// (fear here is nominal: resolution always reaches the routsAt inference below
// before this default, so a unit with no threshold resolves fearless.)

export function resolveAI(u: {
  /** Authored knobs — partial, since an enemy sets only what makes it distinct. */
  ai?: Partial<AIProfile>;
  routsAt?: number;
}): AIProfile {
  // A creature with no rout threshold has nothing to break at — that is what
  // "fights to the end" has always meant in the data (undead, maddened beasts).
  // A threshold with no authored style defaults to `withdraws`, the plain
  // beast exit; every enemy in the current roster sets its style explicitly.
  const inferredFear: AIFear = u.routsAt == null ? "fearless" : "withdraws";
  return {
    targeting: u.ai?.targeting ?? DEFAULT_AI.targeting,
    tauntable: u.ai?.tauntable ?? DEFAULT_AI.tauntable,
    fear: u.ai?.fear ?? inferredFear,
  };
}

/** Does a forced-target effect of this kind land on this unit? `elite` covers
 *  the stronger pulls (a future thorns wall); generic is the warrior taunt. */
export function acceptsTaunt(u: CombatUnit, kind: "generic" | "elite" = "generic"): boolean {
  const { tauntable } = resolveAI(u);
  if (tauntable === "ignores") return false;
  if (tauntable === "ignores-generic") return kind === "elite";
  return true;
}

/** Can this unit break and run at all? `fearless` units hold regardless of HP. */
export function canBreak(u: CombatUnit): boolean {
  return resolveAI(u).fear !== "fearless";
}
