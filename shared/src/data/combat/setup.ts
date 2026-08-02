import type { Adventurer } from "../adventurers.js";
import type { AdventurerMissionSupplies } from "../missions/index.js";
import { getCombatPotionEffect, getFoodEffect, getRecoveryEffect, MATCHED_FOOD_HP_BONUS, getItem } from "../items/index.js";
import type { CombatUnit } from "./types.js";
import { calcFamilyBonuses } from "./units.js";

/**
 * Apply supply-driven pre-combat state to adventurer units in place.
 *   - combat potions are stored on the unit, triggered in the round pipeline
 *   - food gives a stat bonus + HP bonus (with matched-flavor extra)
 *   - recovery slot heals before combat (skipped for expeditions)
 */
export function applySupplies(
  adventurers: CombatUnit[],
  team: Adventurer[],
  supplies: Record<string, AdventurerMissionSupplies> | undefined,
  skipRecoveryHeal: boolean,
): void {
  if (!supplies) return;
  for (const unit of adventurers) {
    const sup = supplies[unit.id];
    if (!sup) continue;

    if (sup.potion) {
      const potionEff = getCombatPotionEffect(sup.potion);
      if (potionEff) unit.combatPotion = potionEff;
    }

    // Brewed free-form potion: apply its buffs at combat start. First slice —
    // stat/sub-stat buffs, +damage%/+defense%, resists, and a pre-combat heal.
    // (Poison coatings + throwables are a later slice.)
    if (sup.brewEffects) applyBrewBuffs(unit, sup.brewEffects);

    if (sup.food) applyFood(unit, team, sup.food);

    if (sup.recovery && !skipRecoveryHeal) {
      const rec = getRecoveryEffect(sup.recovery);
      if (rec) {
        const healAmount = Math.floor(unit.maxHp * rec.healPct / 100);
        unit.hp = Math.min(unit.maxHp, unit.hp + healAmount);
      }
    }
  }
}

const PRIMARY = new Set(["str", "dex", "int", "vit", "wis"]);
const SUBSTAT = new Set(["crit", "accuracy", "dodge", "parry", "initiative", "mobility", "presence", "luck"]);
const WHOLE_FIGHT = 999;

/** Apply a brewed potion's buff effects to a unit at combat start. Sustained
 *  effects last the fight; a burst effect keeps its `rounds`. Offensive channels
 *  (poison/aoe/confuse/weaken/slow) are ignored here — a later slice. */
function applyBrewBuffs(unit: CombatUnit, effects: import("../missions/types.js").AdventurerMissionSupplies["brewEffects"]): void {
  if (!effects) return;
  for (const e of effects) {
    const ch = e.channel;
    const rounds = e.shape === "burst" ? (e.rounds ?? 2) : WHOLE_FIGHT;
    if (PRIMARY.has(ch)) {
      (unit as any)[ch] = ((unit as any)[ch] ?? 0) + e.amount;
    } else if (SUBSTAT.has(ch)) {
      unit.raw = unit.raw ?? {};
      (unit.raw as any)[ch] = ((unit.raw as any)[ch] ?? 0) + e.amount;
    } else if (ch === "damage_pct") {
      unit.damageBoost = { pct: (unit.damageBoost?.pct ?? 0) + e.amount, rounds };
    } else if (ch === "defense_pct") {
      unit.defenseBoost = { pct: (unit.defenseBoost?.pct ?? 0) + e.amount, rounds };
    } else if (ch === "heal_hp") {
      unit.hp = Math.min(unit.maxHp, unit.hp + e.amount);
    } else if (ch.startsWith("resist_")) {
      const school = ch.replace("resist_", "");
      if (school !== "confuse" && school !== "undead") {
        unit.resist = unit.resist ?? {};
        (unit.resist as any)[school] = ((unit.resist as any)[school] ?? 0) + e.amount;
      }
    }
    // poison / weaken / slow / confuse / aoe_* → later slice (coatings + throwables)
  }
}

function applyFood(unit: CombatUnit, team: Adventurer[], foodId: string): void {
  const foodFx = getFoodEffect(foodId);
  if (foodFx?.statBonus) {
    const s = foodFx.statBonus.stat;
    (unit as any)[s] = ((unit as any)[s] ?? 0) + foodFx.statBonus.amount;
  }
  if (foodFx?.hpBonus) {
    unit.maxHp += foodFx.hpBonus;
    unit.hp += foodFx.hpBonus;
  }
  // Matched-flavor bonus HP
  const foodItem = getItem(foodId);
  const adv = team.find((a) => a.id === unit.id);
  if (foodItem?.foodFlavors && adv?.foodPreference &&
      foodItem.foodFlavors.includes(adv.foodPreference as any)) {
    unit.maxHp += MATCHED_FOOD_HP_BONUS;
    unit.hp += MATCHED_FOOD_HP_BONUS;
  }
}

/** Apply carry-over HP from a previous expedition event. */
export function applyHpOverride(adventurers: CombatUnit[], hpOverride: Record<string, number> | undefined): void {
  if (!hpOverride) return;
  for (const unit of adventurers) {
    const savedHp = hpOverride[unit.id];
    if (savedHp != null) unit.hp = Math.min(unit.maxHp, Math.max(0, savedHp));
  }
}

/**
 * Pre-combat passives:
 *   - Family bond: +2 all stats per extra teammate sharing a surname
 *   - Archer Eagle Eye: +3 DEX to party per archer
 *   - Wizard Arcane Haste: +3 WIS (=+9 MR) to party per wizard
 *
 * Stat bumps happen before the round loop so all derived calcs see them.
 */
export function applyPassives(adventurers: CombatUnit[], team: Adventurer[]): void {
  const familyBonuses = calcFamilyBonuses(team);
  for (const unit of adventurers) {
    const bonus = familyBonuses.get(unit.id) ?? 0;
    if (bonus > 0) {
      const b = bonus * 2;
      unit.str += b; unit.dex += b; unit.int += b; unit.vit += b; unit.wis += b;
      unit.maxHp = unit.vit * 8;
      unit.hp = unit.maxHp;
    }
  }

  const archerCount = team.filter((a) => a.class === "archer").length;
  if (archerCount > 0) {
    const dexBonus = archerCount * 3;
    for (const unit of adventurers) unit.dex += dexBonus;
  }

  const wizardCount = team.filter((a) => a.class === "wizard").length;
  if (wizardCount > 0) {
    for (const unit of adventurers) unit.wis += wizardCount * 3;
  }
}
