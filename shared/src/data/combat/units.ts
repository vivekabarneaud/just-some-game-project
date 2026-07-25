import type { Adventurer } from "../adventurers.js";
import { calcStats, getPortraitUrl } from "../adventurers.js";
import { getEquipmentStats, getEquipmentDefense, getItem } from "../items/index.js";
import { getEnemy } from "../enemies.js";
import type { MissionEncounter, MissionNpcAlly } from "../missions/index.js";
import { getNpcAlly } from "../npcs.js";
import { rarityWeaponRange, UNARMED_RANGE, derivedDamageRange } from "./stats.js";
import type { CombatUnit } from "./types.js";

/** The physical damage range a mainHand weapon confers: an authored range if it
 *  has one, else a rarity default, else fists. Casters ignore this (magic path). */
function weaponRange(mainHandId?: string | null): { min: number; max: number } {
  if (!mainHandId) return UNARMED_RANGE;
  const item = getItem(mainHandId);
  if (!item) return UNARMED_RANGE;
  if (item.dmgMin != null && item.dmgMax != null) return { min: item.dmgMin, max: item.dmgMax };
  return rarityWeaponRange(item.rarity);
}

/** Premades who upgrade the team's retreat judgment (Model C commander system).
 *  Interim: recognized by premadeId until a "tactics"/commander talent exists —
 *  then this becomes a talent check and generalizes. Morgause is the gold standard. */
const COMMANDER_PREMADE_IDS = new Set(["char_020"]); // Morgause Dunwall

/** Convert an Adventurer into a combat-ready unit. HP = VIT × 8. */
export function buildAdventurerUnit(adv: Adventurer): CombatUnit {
  const equipStats = getEquipmentStats(adv.equipment);
  const stats = calcStats(adv, equipStats);
  const hp = stats.vit * 8;
  const wr = weaponRange(adv.equipment.mainHand);
  const isCommander = (adv.premadeId ? COMMANDER_PREMADE_IDS.has(adv.premadeId) : false)
    || (adv.talents?.includes("commander_tactics") ?? false);
  return {
    id: adv.id, name: adv.name, icon: "", kind: "adventurer", isEnemy: false,
    hp, maxHp: hp,
    str: stats.str, dex: stats.dex, int: stats.int, vit: stats.vit, wis: stats.wis,
    class: adv.class,
    portrait: getPortraitUrl(adv),
    level: adv.level,
    talents: adv.talents,
    isMagical: adv.class === "wizard" || adv.class === "priest",
    gearDefense: getEquipmentDefense(adv.equipment),
    dmgMin: wr.min, dmgMax: wr.max,
    trait: adv.trait,
    weaponType: adv.equipment.mainHand ? getItem(adv.equipment.mainHand)?.weaponType : undefined,
    canAct: true, canBeHealed: true, isTauntable: false,
    isCommander,
    threatMultiplier: 1.0,
    cooldowns: {}, slowed: 0, poisonTicks: [],
  };
}

/**
 * Build an NPC ally unit from a mission's npcAlly block. HP = VIT × 8 (same as
 * adventurers). Mission-side mechanics (threatMultiplier, isMissionObjective)
 * stamp here. Baseline threat-vs-tag is applied later, in setup.ts, once enemies
 * are built and we know which enemy IDs to target.
 */
export function buildNpcAllyUnit(missionNpc: MissionNpcAlly): CombatUnit | null {
  const def = getNpcAlly(missionNpc.npcId);
  if (!def) return null;
  const hp = def.stats.vit * 8;
  // Passive NPCs (ritualists, frail VIPs) take no turn — canAct=false skips
  // them in the action phase. Enemies still target them; priests still heal them.
  const passive = !!missionNpc.passive;
  const npcRange = derivedDamageRange(Math.max(def.stats.str, def.stats.dex));
  return {
    id: `npc_${def.id}`,
    name: def.name,
    icon: def.icon,
    kind: "ally",
    isEnemy: false,
    hp, maxHp: hp,
    str: def.stats.str, dex: def.stats.dex, int: def.stats.int, vit: def.stats.vit, wis: def.stats.wis,
    class: def.class,
    isMagical: def.class === "wizard" || def.class === "priest",
    gearDefense: 0,
    dmgMin: npcRange.min, dmgMax: npcRange.max,
    npcId: def.id,
    canAct: !passive,
    canBeHealed: true,
    isTauntable: false,
    isMissionObjective: missionNpc.deathFailsMission ?? true,
    threatMultiplier: missionNpc.threatMultiplier ?? 1.0,
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
    // A creature's bite/claw range: authored if the def carries one, else derived
    // from its offensive stat (behavior-preserving — hits exactly as before).
    const eRange = (def.dmgMin != null && def.dmgMax != null)
      ? { min: def.dmgMin, max: def.dmgMax }
      : derivedDamageRange(Math.max(def.stats.str, def.stats.dex));
    for (let i = 0; i < enc.count; i++) {
      const hp = def.stats.vit * 10;
      units.push({
        id: `${def.id}_${i}`,
        name: enc.count > 1 ? `${def.name} ${i + 1}` : def.name,
        icon: def.icon, kind: "enemy", isEnemy: true,
        hp, maxHp: hp,
        str: def.stats.str,
        dex: def.stats.dex,
        int: def.stats.int,
        vit: def.stats.vit,
        wis: def.stats.wis ?? 0,
        raw: def.raw,
        class: undefined, isMagical, gearDefense: 0,
        dmgMin: eRange.min, dmgMax: eRange.max,
        enemyTags: def.tags,
        enemyDefId: def.id,
        combatRole: def.combatRole,
        scale: def.boss ? 1.2 : undefined,
        routsAt: def.routsAt,
        enemyAbilities: def.abilities,
        canAct: true, canBeHealed: true, isTauntable: true,
        // Tactical = follow threat, scored pick. Designers explicitly tag
        // exceptions: feral for mindless beasts (random targeting, ignores
        // threat), cunning for smart casters/elites that hunt the backline.
        // WIS stays a pure mechanical stat (magic resist + initiative).
        aiTier: def.aiTier ?? "tactical",
        tauntImmunity: def.tauntImmunity ?? "none",
        threatTable: {},
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
