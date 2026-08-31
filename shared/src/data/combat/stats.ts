import type { CombatUnit } from "./types.js";

// ── Weapon-damage model (Phase 1) ────────────────────────────────────────────
// Physical auto-attacks roll a base in the wielder's weapon range, then scale it
// by the primary stat: raw = roll × (1 + primaryStat × ATTACK_STAT_SCALE).
// See docs/design/combat/NOVICE_ITEMS.md §2.

/** Each point of primary stat adds this fraction to a physical hit. */
export const ATTACK_STAT_SCALE = 0.1;

/** Fists — the fallback range when a unit wields no weapon. */
export const UNARMED_RANGE = { min: 1, max: 3 };

// ── Weapon range bands (Combat Foundation §3) ────────────────────────────────
// Range comes from the weapon, not the role. Bands are quantized against the
// positional layer's contact distance (POS.contact = 5): all melee connects at
// 0–5 and ranged opens just past it at 6+, so there is no dead gap between a
// bow's minimum and a knife's maximum. The doc's finer bands (dagger 0–3,
// spear 2–8 reach) wait on band-aware MOVEMENT — today units close to contact.

/** Melee band: strikes in contact. Fists, daggers, swords, axes, maces, spears. */
export const MELEE_BAND = { min: 0, max: 5 };
/** Ranged band: strikes past contact, useless with a foe on top of you.
 *  Bows — and caster foci, whose zap reaches like a bow until spell weapons
 *  (Phase 2) give spells their own ranges. */
export const RANGED_BAND = { min: 6, max: 100 };

/** How hard a ranged creature's close-in fallback (claws/teeth) hits, as a
 *  fraction of its real attack — parity with the retired pinned-exposure rule.
 *  Adventurers don't use this: their fallback is an actual sidearm or fists,
 *  whose own damage is the falloff. */
export const CLOSE_IN_FRACTION = 0.4;

/** The range band a weapon fights in: authored minRange/maxRange if present,
 *  else a default by weapon family. */
export function weaponBand(item?: { minRange?: number; maxRange?: number; weaponType?: string } | null): { min: number; max: number } {
  if (item?.minRange != null && item?.maxRange != null) return { min: item.minRange, max: item.maxRange };
  if (item?.weaponType === "bow" || item?.weaponType === "staff" || item?.weaponType === "wand") return RANGED_BAND;
  return MELEE_BAND;
}

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

/** Physical attack power — ALL physical power is STR now (melee AND ranged;
 *  Combat Foundation). DEX is precision/agility (crit/dodge/accuracy/mobility),
 *  no longer raw damage. Magical attackers use getMagicPower (INT) instead. */
export function getAttackPower(unit: CombatUnit): number {
  return unit.str;
}

/** Magical damage scales from INT. */
export function getMagicPower(unit: CombatUnit): number {
  return unit.int;
}

/** Fraction of incoming physical damage absorbed by defense. Diminishing returns curve. */
export function getDefenseReduction(unit: CombatUnit): number {
  // Physical mitigation pool: base (enemy VIT×3 / adventurer gearDefense) + any
  // raw.armor from gear/talents. def/(def+150) → % reduction.
  let def = (unit.isEnemy ? unit.vit * 3 : unit.gearDefense) + (unit.raw?.armor ?? 0);
  if (unit.defenseBoost) def = Math.floor(def * (1 + unit.defenseBoost.pct / 100));
  return def / (def + 150);
}

/** Avoidance cap — even a stacked dodge+parry tank can't become unhittable. */
export const MAX_AVOIDANCE = 75;

/** Hit resolution (Combat Foundation §46): one avoidance roll. The defender's
 *  Dodge (evade) plus Parry (deflect — PHYSICAL attacks only, you can't parry a
 *  fireball) minus the attacker's Accuracy, clamped to [0, MAX_AVOIDANCE]. On a
 *  successful roll the attack is negated (0 damage). `parried` picks the flavor
 *  when parry was the larger contributor. */
export function getAvoidance(attacker: CombatUnit, target: CombatUnit, forcePhysical?: boolean): { chance: number; parried: boolean } {
  const physical = forcePhysical || !dealsMagicalDamage(attacker);
  const dodge = getDodgeChance(target) + getRangedElusion(attacker, target);
  const parry = physical ? getParry(target) : 0;
  const chance = Math.max(0, Math.min(MAX_AVOIDANCE, dodge + parry - getAccuracy(attacker)));
  return { chance, parried: physical && parry > dodge };
}

// "Elusive at range" (Skirmisher archetype): a weaving creature (a charging wolf)
// is hard to hit while still closing, and commits — becoming hittable — at melee
// contact. The dodge bonus scales from full at/beyond ELUSION_FULL paces down to
// 0 at ELUSION_CONTACT. Only a distant (ranged) attacker ever sees it, so it is a
// clean anti-kite tool: a meleer at contact reads 0. Numbers mirror the positional
// layer's contact (~5) and a typical closing gap (~45+).
const ELUSION_CONTACT = 5;
const ELUSION_FULL = 45;
/** Distance-scaled bonus Dodge % a target's `elusiveAtRange` grants vs this attacker. */
export function getRangedElusion(attacker: CombatUnit, target: CombatUnit): number {
  const peak = target.elusiveAtRange ?? 0;
  if (!peak || attacker.x == null || target.x == null) return 0;
  const gap = Math.abs(attacker.x - target.x);
  const t = Math.min(1, Math.max(0, (gap - ELUSION_CONTACT) / (ELUSION_FULL - ELUSION_CONTACT)));
  return peak * t;
}

/** Fraction of incoming magical damage absorbed by wisdom-driven magic resistance. */
export function getMagicResistReduction(unit: CombatUnit): number {
  const mr = unit.wis * 3;
  return mr / (mr + 150);
}

/** Turn order — higher goes first. DEX + WIS (equal weight); halved while slowed.
 *  (Combat Foundation: WIS no longer halved — a wise wizard acts first.) */
export function getInitiative(unit: CombatUnit): number {
  const base = unit.dex + unit.wis + (unit.raw?.initiative ?? 0);
  return unit.slowed > 0 ? Math.floor(base / 2) : base;
}

/** Crit chance — DEX-derived floor (cap 50) + raw crit. Assassins +10. */
export function getCritChance(unit: CombatUnit): number {
  const base = 5 + unit.dex * 0.5;
  const classBonus = unit.class === "assassin" ? 10 : 0;
  return Math.min(50, base + classBonus) + (unit.raw?.crit ?? 0);
}

/** Dodge % — evade entirely. DEX-derived floor (cap 20) + raw dodge. */
export function getDodgeChance(unit: CombatUnit): number {
  return Math.min(20, unit.dex * 1.0) + (unit.raw?.dodge ?? 0);
}

/** Accuracy % — chance to LAND a hit, counters the defender's Dodge/Parry.
 *  DEX-derived floor + raw accuracy. (Consumed by the hit-resolution step.) */
export function getAccuracy(unit: CombatUnit): number {
  return Math.min(20, unit.dex * 1.0) + (unit.raw?.accuracy ?? 0);
}

/** Parry % — deflect an incoming PHYSICAL attack. STR-derived floor + raw parry.
 *  STR's defensive identity, distinct from DEX-dodge. */
export function getParry(unit: CombatUnit): number {
  return Math.min(20, unit.str * 0.7) + (unit.raw?.parry ?? 0);
}

/** Base Presence by class (Combat Foundation) — how much aggro/attention the
 *  ROLE commands. Positive draws threat (the tank wants to be hit); negative
 *  sheds it (the dps/ghost). Deliberately NOT attribute-derived — aggro is a
 *  property of the role, not of STR/DEX — so a strong assassin still vanishes.
 *  Gear/talents add raw presence on top (raw.presence). */
export function classPresenceFloor(cls?: string): number {
  switch (cls) {
    case "warrior": return 10;    // the wall — holds the line, wants the blows
    case "assassin": return -15;  // the ghost — never registers
    case "archer": return -8;     // backline, picks you off unseen
    case "wizard": return -6;     // squishy, wants to be left alone
    case "priest": return -6;     // (healing already pulls aggro; this offsets)
    default: return 0;            // enemies / NPC allies: neutral
  }
}

/** Presence → threat-generation multiplier. 0 Presence = 1.0 (baseline); high
 *  Presence amplifies the threat you build, deep-negative sheds it toward a
 *  floor (never fully zero — a determined dps can still pull if they must). */
export function presenceToThreatMult(presence: number): number {
  return Math.max(0.15, 1 + presence * 0.05);
}

/** Whether the unit deals magical damage (wizards, priests, magical enemies). */
export function dealsMagicalDamage(unit: CombatUnit): boolean {
  if (unit.isMagical) return true;
  if (unit.class === "wizard" || unit.class === "priest") return true;
  return false;
}
