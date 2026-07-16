import type { CombatUnit } from "./types.js";

// ── Weapon-damage model (Phase 1) ────────────────────────────────────────────
// Physical auto-attacks roll a base in the wielder's weapon range, then scale it
// by the primary stat: raw = roll × (1 + primaryStat × ATTACK_STAT_SCALE).
// See docs/DESIGN_NOVICE_ITEMS.md §2.

/** Each point of primary stat adds this fraction to a physical hit. */
export const ATTACK_STAT_SCALE = 0.1;

/** Fists — the fallback range when a unit wields no weapon. */
export const UNARMED_RANGE = { min: 1, max: 3 };

/** First-pass weapon damage range by rarity, used when a weapon carries no
 *  explicit dmgMin/dmgMax. Calibrated so a common weapon in a low-stat hand
 *  lands near the old stat-only damage; better weapons + higher stats climb from
 *  there. Tuning knob — the novice item pass sets explicit ranges. */
export function rarityWeaponRange(rarity?: string): { min: number; max: number } {
  switch (rarity) {
    case "legendary": return { min: 16, max: 22 };
    case "epic": return { min: 11, max: 16 };
    case "rare": return { min: 7, max: 11 };
    case "uncommon": return { min: 4, max: 7 };
    default: return { min: 2, max: 5 }; // common / unset
  }
}

/** Behavior-preserving damage range derived from a unit's offensive power, for
 *  units with no authored weapon range (enemies, NPC allies). By construction,
 *  rolling this range and applying the ×(1 + power·scale) scale reproduces the
 *  old `power × [0.7, 1.3]` damage — so an un-tuned creature hits as before. */
export function derivedDamageRange(power: number): { min: number; max: number } {
  const mid = power / (1 + power * ATTACK_STAT_SCALE);
  const min = Math.max(1, Math.round(mid * 0.7));
  const max = Math.max(min + 1, Math.round(mid * 1.3));
  return { min, max };
}

/** Attack power — scales from the unit's primary combat stat. */
export function getAttackPower(unit: CombatUnit): number {
  if (!unit.class) return Math.max(unit.str, unit.dex);
  if (unit.class === "warrior") return unit.str;
  if (unit.class === "archer" || unit.class === "assassin") return unit.dex;
  return unit.int;
}

/** Magical damage scales from INT. */
export function getMagicPower(unit: CombatUnit): number {
  return unit.int;
}

/** Fraction of incoming physical damage absorbed by defense. Diminishing returns curve. */
export function getDefenseReduction(unit: CombatUnit): number {
  let def = unit.isEnemy ? unit.vit * 3 : unit.gearDefense;
  if (unit.defenseBoost) def = Math.floor(def * (1 + unit.defenseBoost.pct / 100));
  return def / (def + 150);
}

/** Fraction of incoming magical damage absorbed by wisdom-driven magic resistance. */
export function getMagicResistReduction(unit: CombatUnit): number {
  const mr = unit.wis * 3;
  return mr / (mr + 150);
}

/** Turn order tiebreaker — higher goes first. Halved while slowed. */
export function getInitiative(unit: CombatUnit): number {
  const base = unit.dex + Math.floor(unit.wis / 2);
  return unit.slowed > 0 ? Math.floor(base / 2) : base;
}

/** Crit chance 0-50. Assassins get +10 class bonus. */
export function getCritChance(unit: CombatUnit): number {
  const base = 5 + unit.dex * 0.5;
  const classBonus = unit.class === "assassin" ? 10 : 0;
  return Math.min(50, base + classBonus);
}

/** Flat dodge chance 0-20, driven by DEX. */
export function getDodgeChance(unit: CombatUnit): number {
  return Math.min(20, unit.dex * 1.0);
}

/** Whether the unit deals magical damage (wizards, priests, magical enemies). */
export function dealsMagicalDamage(unit: CombatUnit): boolean {
  if (unit.isMagical) return true;
  if (unit.class === "wizard" || unit.class === "priest") return true;
  return false;
}
