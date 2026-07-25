import type { CombatContext } from "../types.js";
import { tickStatusEffects, tickPotionBuffs } from "./status.js";
import { drinkCombatPotions } from "./potions.js";
import { runActions } from "./actions.js";
import { applyMissionModifiers } from "../modifiers.js";
import { applySurvivalReflex, evaluateRetreat, playerGone, enemiesGone } from "../retreat.js";
import { movePhase } from "../positional.js";

/**
 * One combat round. Returns true if combat should continue, false to break.
 *
 * Order:
 *   1. tickStatusEffects — cooldowns, slow, debuffs, poison DoTs, clear taunts
 *   2. Check for wipe after DoTs
 *   3. drinkCombatPotions (free action, doesn't consume turn)
 *   4. tickPotionBuffs (decrement duration on existing buffs)
 *   5. runActions — initiative-ordered turns
 *   6. Check for wipe after actions
 *
 * Every phase is a pure-ish function over the shared CombatContext.
 * Adding a new phase = writing a phase function + slotting it in.
 */
export function runRound(ctx: CombatContext): boolean {
  if (playerGone(ctx) || enemiesGone(ctx)) return false;

  // Re-evaluate mission modifier gates each round. If the gate-ally fell since
  // last round (e.g. Niamh died), this is what removes the physical-pierce flag
  // from ghosts and restores their immunity for the rest of the fight.
  applyMissionModifiers(ctx);

  tickStatusEffects(ctx);
  // Survival reflex (Model C): a non-overkill DoT/tick death leaves the hero
  // clinging at 1 HP and broken, rather than dead. Run before the wipe check so
  // a saved hero isn't counted as down.
  applySurvivalReflex(ctx);

  if (playerGone(ctx) || enemiesGone(ctx)) return false;

  // Morale check: decide Hold vs Fall back for this round (sets ctx.retreating).
  evaluateRetreat(ctx);

  drinkCombatPotions(ctx);
  tickPotionBuffs(ctx);
  // Positional Move phase: units reposition (melee advance w/ engagement, ranged
  // kite) before they act, so reach/exposure/flank gate the action phase.
  movePhase(ctx);
  runActions(ctx);
  // Reflex again after the action phase (most lethal blows land here).
  applySurvivalReflex(ctx);

  if (playerGone(ctx)) return false;
  if (enemiesGone(ctx)) return false;
  // A mission-objective ally falling ends combat immediately — surviving
  // adventurers retreat. The result builder reports vipFallen so the mission
  // engine can take the distinct-failure path (no rewards, no team-wipe permadeath cascade).
  if (ctx.adventurers.some((u) => u.isMissionObjective && u.hp <= 0)) return false;
  return true;
}
