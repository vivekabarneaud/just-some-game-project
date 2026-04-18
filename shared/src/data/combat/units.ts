import type { Adventurer } from "../adventurers.js";
import { calcStats } from "../adventurers.js";
import { getEquipmentStats, getEquipmentDefense } from "../items.js";
import { getEnemy } from "../enemies.js";
import type { MissionEncounter } from "../missions/index.js";
import type { CombatUnit } from "./types.js";

/** Convert an Adventurer into a combat-ready unit. HP = VIT × 8. */
export function buildAdventurerUnit(adv: Adventurer): CombatUnit {
  const equipStats = getEquipmentStats(adv.equipment);
  const stats = calcStats(adv, equipStats);
  const hp = stats.vit * 8;
  return {
    id: adv.id, name: adv.name, icon: "", isEnemy: false,
    hp, maxHp: hp,
    str: stats.str, dex: stats.dex, int: stats.int, vit: stats.vit, wis: stats.wis,
    class: adv.class,
    isMagical: adv.class === "wizard" || adv.class === "priest",
    gearDefense: getEquipmentDefense(adv.equipment),
    trait: adv.trait,
    cooldowns: {}, slowed: 0, poisonTicks: [],
  };
}

/** Build enemy units from mission encounters. HP = VIT × 10. */
export function buildEnemyUnits(encounters: MissionEncounter[]): CombatUnit[] {
  const units: CombatUnit[] = [];
  for (const enc of encounters) {
    const def = getEnemy(enc.enemyId);
    if (!def) continue;
    const isMagical = def.tags.includes("magical") || def.tags.includes("demon");
    for (let i = 0; i < enc.count; i++) {
      const hp = def.stats.vit * 10;
      units.push({
        id: `${def.id}_${i}`,
        name: enc.count > 1 ? `${def.name} ${i + 1}` : def.name,
        icon: def.icon, isEnemy: true,
        hp, maxHp: hp,
        str: def.stats.str,
        dex: def.stats.dex,
        int: def.stats.int,
        vit: def.stats.vit,
        wis: def.stats.wis ?? 0,
        class: undefined, isMagical, gearDefense: 0,
        enemyTags: def.tags,
        enemyDefId: def.id,
        enemyAbilities: def.abilities,
        cooldowns: {}, slowed: 0, poisonTicks: [], statDebuffs: [],
      });
    }
  }
  return units;
}

/**
 * Family bond passive — each adventurer with shared-surname teammates gets
 * +2 to all stats per extra family member. Returns id → bonus-per-stat.
 */
export function calcFamilyBonuses(team: Adventurer[]): Map<string, number> {
  const lastNames = team.map((a) => a.name.split(" ").slice(1).join(" "));
  const counts = new Map<string, number>();
  for (const ln of lastNames) counts.set(ln, (counts.get(ln) ?? 0) + 1);
  const bonuses = new Map<string, number>();
  for (let i = 0; i < team.length; i++) {
    const count = counts.get(lastNames[i]) ?? 1;
    if (count > 1) bonuses.set(team[i].id, count - 1);
  }
  return bonuses;
}
