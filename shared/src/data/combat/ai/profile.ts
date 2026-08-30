// ─── Composable AI knobs: resolution ────────────────────────────────────────
// One place where an enemy's authored `ai` block, its legacy aiTier /
// tauntImmunity / routsAt fields, and the defaults all collapse into a single
// resolved AIProfile. Consumers read the resolved profile and nothing else.
//
// See DESIGN_TIER1_ENEMIES §1 "Composable AI (knobs, not one tier)".

import type { AIFear, AIProfile, AITargeting, AITauntable, AITier, CombatUnit, TauntImmunity } from "../types.js";

/** Legacy tier → targeting knob.
 *
 *  `feral` maps to **nearest** (changed 2026-08-19, deliberately). It used to
 *  mean *random* reachable target — but that was written before positions
 *  existed, when "random" was the only way to say "this thing does not think".
 *  Now that there is a battlefield, an animal biting whatever is closest is
 *  both truer and more readable, and it makes the front line mean something to
 *  beasts. `random` survives as its own mode for genuinely erratic things
 *  (panicked, confused). The other two mappings are unchanged. */
const TIER_TARGETING: Record<AITier, AITargeting> = {
  feral: "nearest",
  tactical: "threat",
  cunning: "backline",
};

/** Legacy taunt-immunity → tauntable knob. Same three cases, renamed to say
 *  what the unit does rather than what it resists. */
const IMMUNITY_TAUNTABLE: Record<TauntImmunity, AITauntable> = {
  none: "obeys",
  normal: "ignores-generic",
  all: "ignores",
};

/** What a unit with nothing authored does: follows threat, obeys taunts, and
 *  breaks when its `routsAt` says so. Matches the pre-knobs defaults. */
export const DEFAULT_AI: AIProfile = { targeting: "threat", tauntable: "obeys", fear: "routs" };

/**
 * The unit's effective AI knobs.
 *
 * Precedence: the stamped/authored profile wins knob-by-knob, then the legacy
 * fields, then the defaults. Resolution is cheap and pure, so callers may use
 * it directly rather than depending on units.ts having stamped anything — which
 * keeps hand-built test units working.
 */
export function resolveAI(u: {
  /** Authored knobs — partial, since an enemy sets only what makes it distinct. */
  ai?: Partial<AIProfile>;
  aiTier?: AITier;
  tauntImmunity?: TauntImmunity;
  routsAt?: number;
}): AIProfile {
  const legacyTargeting = u.aiTier ? TIER_TARGETING[u.aiTier] : undefined;
  const legacyTauntable = u.tauntImmunity ? IMMUNITY_TAUNTABLE[u.tauntImmunity] : undefined;
  // A creature with no rout threshold has nothing to break at — that is what
  // "fights to the end" has always meant in the data (undead, maddened beasts).
  const legacyFear: AIFear = u.routsAt == null ? "fearless" : "routs";
  return {
    targeting: u.ai?.targeting ?? legacyTargeting ?? DEFAULT_AI.targeting,
    tauntable: u.ai?.tauntable ?? legacyTauntable ?? DEFAULT_AI.tauntable,
    fear: u.ai?.fear ?? legacyFear,
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
