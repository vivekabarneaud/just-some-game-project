import type { CombatUnit } from "./types.js";
import { combatRandom } from "./prng.js";
import { getAttackPower, getMagicPower, getCritChance, getDefenseReduction, getMagicResistReduction, dealsMagicalDamage, ATTACK_STAT_SCALE } from "./stats.js";
import { getTraitDamageBonus, getTraitCritBonus, getWeaponTraitBonus } from "./traits.js";

export interface DamageOptions {
  /** Forces a crit regardless of the roll (used by Aimed Shot etc.). */
  forceCrit?: boolean;
  /** Flat multiplier on the raw damage. Used by cleave/multi-shot/etc. */
  damageMult?: number;
  /** When true, uses magic resistance for the reduction curve even for physical attacks (Smite). */
  ignorePhysicalDef?: boolean;
  /** When true, a PHYSICAL attack bypasses armor entirely (no reduction) — the
   *  wolf's Throat Tear goes for the neck; chainmail is no help. Foundation
   *  `ignoreArmor` primitive; reusable by any armor-piercing attack. Only affects
   *  physical hits (magical already routes through magic-resist). */
  ignoreArmor?: boolean;
}

export interface DamageResult {
  damage: number;
  rawDamage: number;
  crit: boolean;
}

// ── Wounded penalty ──────────────────────────────────────────────
// A wounded fighter still swings, but with less behind it. Below 40% HP an
// attacker's outgoing damage scales down, linearly, to a floor at death's door.
// Applied per-attack off CURRENT hp, so it kicks in whether you send someone
// wounded OR they take hits mid-fight. Headcount stacks already scale by hp
// fraction (see below), so they're exempt. Talent hooks: "unflinching" ignores
// it; "last_stand" inverts it (harder as they bleed).
const WOUNDED_THRESHOLD = 0.4;
const WOUNDED_FLOOR = 0.5;      // damage multiplier at ~0 HP
const LAST_STAND_BONUS = 0.5;   // up to +50% damage at death's door for "last_stand"

export function woundedDamageMult(unit: CombatUnit): number {
  if (unit.headcount || unit.maxHp <= 0) return 1;
  const ratio = unit.hp / unit.maxHp;
  if (ratio >= WOUNDED_THRESHOLD) return 1;
  const talents = unit.talents ?? [];
  if (talents.includes("unflinching")) return 1;
  const wounded = 1 - ratio / WOUNDED_THRESHOLD; // 0 at the threshold → 1 at 0 HP
  if (talents.includes("last_stand")) return 1 + LAST_STAND_BONUS * wounded;
  return 1 - (1 - WOUNDED_FLOOR) * wounded;
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

  // Ghost: immune to physical unless spirit_sensitive trait, OR a mission
  // modifier (e.g. Niamh's binding ritual) is currently making the defender
  // physically pierceable. The flag is refreshed each round, so if the
  // gate-ally dies, ghosts return to full physical immunity.
  if (!magical && defender.enemyTags?.includes("ghost") &&
      attacker.trait !== "spirit_sensitive" && !defender.physicallyPierceable) {
    return { damage: 0, rawDamage: 0, crit: false };
  }
  // Aether elemental: immune to magical damage
  if (magical && defender.enemyTags?.includes("elemental_aether")) {
    return { damage: 0, rawDamage: 0, crit: false };
  }

  const reductionPct = opts?.ignorePhysicalDef
    ? getMagicResistReduction(defender)
    : (magical ? getMagicResistReduction(defender)
      : (opts?.ignoreArmor ? 0 : getDefenseReduction(defender))); // Throat Tear: armor no help

  // Physical: roll the weapon's own damage range, then scale by the primary stat
  // (a better weapon AND a stronger fighter both matter). Magical is unchanged
  // for now — INT-driven — until the caster spell-weapon pass (Phase 2).
  let rawDamage: number;
  if (magical) {
    rawDamage = Math.max(1, Math.floor(getMagicPower(attacker) * (0.7 + combatRandom() * 0.6)));
  } else {
    const roll = attacker.dmgMin + Math.floor(combatRandom() * (attacker.dmgMax - attacker.dmgMin + 1));
    const scale = 1 + getAttackPower(attacker) * ATTACK_STAT_SCALE;
    rawDamage = Math.max(1, Math.floor(roll * scale));
  }

  const crit = !!opts?.forceCrit || combatRandom() * 100 < (getCritChance(attacker) + getTraitCritBonus(attacker));
  if (crit) rawDamage = Math.floor(rawDamage * 1.5);

  if (opts?.damageMult) rawDamage = Math.floor(rawDamage * opts.damageMult);

  if (attacker.damageBoost) rawDamage = Math.floor(rawDamage * (1 + attacker.damageBoost.pct / 100));

  // Stack/squad scaling: a single CombatUnit may represent N soldiers (raid
  // garrisons). The unit's outgoing damage is base × current effective
  // headcount (= original × hp/maxHp). One-shot stat (low STR/DEX) keeps
  // realistic dodge/crit behavior; magnitude comes from the multiplier here.
  if (attacker.headcount && attacker.maxHp > 0) {
    const effective = attacker.headcount * (attacker.hp / attacker.maxHp);
    rawDamage = Math.max(1, Math.floor(rawDamage * effective));
  }

  // Wounded fighters hit softer (individuals only; stacks scale above).
  const woundMult = woundedDamageMult(attacker);
  if (woundMult !== 1) rawDamage = Math.max(1, Math.floor(rawDamage * woundMult));

  const traitBonus = getTraitDamageBonus(attacker, defender);
  if (traitBonus > 0) rawDamage = Math.floor(rawDamage * (1 + traitBonus));

  const weaponBonus = getWeaponTraitBonus(attacker);
  if (weaponBonus > 0) rawDamage = Math.floor(rawDamage * (1 + weaponBonus));

  const damage = Math.max(1, Math.floor(rawDamage * (1 - reductionPct)));
  return { damage, rawDamage, crit };
}
