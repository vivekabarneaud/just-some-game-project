import type { CombatContext } from "../types.js";
import { tickStatusEffects, tickPotionBuffs } from "./status.js";
import { drinkCombatPotions } from "./potions.js";
import { runActions } from "./actions.js";

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
  if (ctx.adventurers.every((u) => u.hp <= 0) || ctx.enemies.every((u) => u.hp <= 0)) return false;

  tickStatusEffects(ctx);

  if (ctx.adventurers.every((u) => u.hp <= 0) || ctx.enemies.every((u) => u.hp <= 0)) return false;

  drinkCombatPotions(ctx);
  tickPotionBuffs(ctx);
  runActions(ctx);

  if (ctx.adventurers.every((u) => u.hp <= 0)) return false;
  if (ctx.enemies.every((u) => u.hp <= 0)) return false;
  return true;
}
