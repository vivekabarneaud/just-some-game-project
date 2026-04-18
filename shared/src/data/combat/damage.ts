import type { CombatUnit } from "./types.js";
import { combatRandom } from "./prng.js";
import { getAttackPower, getMagicPower, getCritChance, getDefenseReduction, getMagicResistReduction, dealsMagicalDamage } from "./stats.js";
import { getTraitDamageBonus, getTraitCritBonus } from "./traits.js";

export interface DamageOptions {
  /** Forces a crit regardless of the roll (used by Aimed Shot etc.). */
  forceCrit?: boolean;
  /** Flat multiplier on the raw damage. Used by cleave/multi-shot/etc. */
  damageMult?: number;
  /** When true, uses magic resistance for the reduction curve even for physical attacks (Smite). */
  ignorePhysicalDef?: boolean;
}

export interface DamageResult {
  damage: number;
  rawDamage: number;
  crit: boolean;
}

/**
 * Resolves a single attack's damage. Handles:
 *  - Type immunities (ghost vs physical, aether vs magical)
 *  - Power scaling (physical vs magical)
 *  - Crit roll (including Lucky trait bonus)
 *  - Damage buffs (potion-applied) and trait bonuses vs enemy type
 *  - Defense reduction (physical or magic-resist)
 */
export function calcDamageResult(attacker: CombatUnit, defender: CombatUnit, opts?: DamageOptions): DamageResult {
  const magical = dealsMagicalDamage(attacker) || !!opts?.ignorePhysicalDef;

  // Ghost: immune to physical unless spirit_sensitive trait
  if (!magical && defender.enemyTags?.includes("ghost") && attacker.trait !== "spirit_sensitive") {
    return { damage: 0, rawDamage: 0, crit: false };
  }
  // Aether elemental: immune to magical damage
  if (magical && defender.enemyTags?.includes("elemental_aether")) {
    return { damage: 0, rawDamage: 0, crit: false };
  }

  const power = magical ? getMagicPower(attacker) : getAttackPower(attacker);
  const reductionPct = opts?.ignorePhysicalDef
    ? getMagicResistReduction(defender)
    : (magical ? getMagicResistReduction(defender) : getDefenseReduction(defender));

  let rawDamage = Math.max(1, Math.floor(power * (0.7 + combatRandom() * 0.6)));

  const crit = !!opts?.forceCrit || combatRandom() * 100 < (getCritChance(attacker) + getTraitCritBonus(attacker));
  if (crit) rawDamage = Math.floor(rawDamage * 1.5);

  if (opts?.damageMult) rawDamage = Math.floor(rawDamage * opts.damageMult);

  if (attacker.damageBoost) rawDamage = Math.floor(rawDamage * (1 + attacker.damageBoost.pct / 100));

  const traitBonus = getTraitDamageBonus(attacker, defender);
  if (traitBonus > 0) rawDamage = Math.floor(rawDamage * (1 + traitBonus));

  const damage = Math.max(1, Math.floor(rawDamage * (1 - reductionPct)));
  return { damage, rawDamage, crit };
}
