import type { CombatUnit } from "./types.js";

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
