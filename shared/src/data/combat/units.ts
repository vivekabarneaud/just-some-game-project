import type { Adventurer } from "../adventurers.js";
import { calcStats, getPortraitUrl } from "../adventurers.js";
import { getEquipmentStats, getEquipmentDefense, getEquipmentRaw, getItem } from "../items/index.js";
import { getEnemy } from "../enemies.js";
import type { MissionEncounter, MissionNpcAlly } from "../missions/index.js";
import { getNpcAlly } from "../npcs.js";
import { rarityWeaponRange, UNARMED_RANGE, derivedDamageRange, classPresenceFloor, presenceToThreatMult, weaponBand, MELEE_BAND, RANGED_BAND, CLOSE_IN_FRACTION } from "./stats.js";
import type { CombatUnit, WeaponProfile } from "./types.js";
import { resolveAI } from "./ai/profile.js";

/** The physical damage range a mainHand weapon confers: an authored range if it
 *  has one, else a rarity default, else fists. Casters ignore this (magic path). */
function weaponRange(mainHandId?: string | null): { min: number; max: number } {
  if (!mainHandId) return UNARMED_RANGE;
  const item = getItem(mainHandId);
  if (!item) return UNARMED_RANGE;
  if (item.dmgMin != null && item.dmgMax != null) return { min: item.dmgMin, max: item.dmgMax };
  return rarityWeaponRange(item.rarity);
}

/** {min,max} band → the profile's minRange/maxRange fields. */
const asBand = (b: { min: number; max: number }) => ({ minRange: b.min, maxRange: b.max });

/** Fists — always the last profile, so "no sidearm + pinned = a fist fight",
 *  never "nothing happens" (Combat Foundation §3). */
const FISTS: WeaponProfile = { kind: "fists", ...asBand(MELEE_BAND), dmgMin: UNARMED_RANGE.min, dmgMax: UNARMED_RANGE.max };

/** An adventurer's preference-ordered weapon list: primary (mainHand — or the
 *  spell for casters, whose zap fights at bow range until Phase 2 spell
 *  weapons), then the belt sidearm, then fists. */
function buildWeaponProfiles(adv: Adventurer, isMagical: boolean): WeaponProfile[] {
  const profiles: WeaponProfile[] = [];
  const main = adv.equipment.mainHand ? getItem(adv.equipment.mainHand) : undefined;
  const wr = weaponRange(adv.equipment.mainHand);
  // A caster's basic attack is the spell, not the held stave — its band is
  // ranged regardless of weaponType (a priest's mace is Phase-2 business).
  const primaryBand = isMagical ? RANGED_BAND : weaponBand(main);
  profiles.push({ kind: "primary", ...asBand(primaryBand), dmgMin: wr.min, dmgMax: wr.max });
  const side = adv.equipment.sidearm ? getItem(adv.equipment.sidearm) : undefined;
  if (side) {
    const sr = (side.dmgMin != null && side.dmgMax != null)
      ? { min: side.dmgMin, max: side.dmgMax }
      : rarityWeaponRange(side.rarity);
    profiles.push({ kind: "sidearm", ...asBand(weaponBand(side)), dmgMin: sr.min, dmgMax: sr.max });
  }
  profiles.push(FISTS);
  return profiles;
}

/** Premades who upgrade the team's retreat judgment (Model C commander system).
 *  Interim: recognized by premadeId until a "tactics"/commander talent exists —
 *  then this becomes a talent check and generalizes. Morgause is the gold standard. */
const COMMANDER_PREMADE_IDS = new Set(["char_020"]); // Morgause Dunwall

/** Convert an Adventurer into a combat-ready unit. HP = VIT × 8. */
export function buildAdventurerUnit(adv: Adventurer): CombatUnit {
  const equipStats = getEquipmentStats(adv.equipment);
  const equipRaw = getEquipmentRaw(adv.equipment);
  const stats = calcStats(adv, equipStats);
  const hp = stats.vit * 8;
  // Presence = class floor + gear/talent raw presence → the threat-generation
  // multiplier the aggro system already consumes (tanks draw, dps shed).
  const presence = classPresenceFloor(adv.class) + (equipRaw.presence ?? 0);
  const wr = weaponRange(adv.equipment.mainHand);
  const isCommander = (adv.premadeId ? COMMANDER_PREMADE_IDS.has(adv.premadeId) : false)
    || (adv.talents?.includes("commander_tactics") ?? false);
  const isMagical = adv.class === "wizard" || adv.class === "priest";
  return {
    id: adv.id, name: adv.name, icon: "", kind: "adventurer", isEnemy: false,
    hp, maxHp: hp,
    str: stats.str, dex: stats.dex, int: stats.int, vit: stats.vit, wis: stats.wis,
    class: adv.class,
    raw: equipRaw,
    portrait: getPortraitUrl(adv),
    level: adv.level,
    talents: adv.talents,
    isMagical,
    gearDefense: getEquipmentDefense(adv.equipment),
    dmgMin: wr.min, dmgMax: wr.max,
    weapons: buildWeaponProfiles(adv, isMagical),
    trait: adv.trait,
    weaponType: adv.equipment.mainHand ? getItem(adv.equipment.mainHand)?.weaponType : undefined,
    canAct: true, canBeHealed: true, isTauntable: false,
    isCommander,
    presence,
    threatMultiplier: presenceToThreatMult(presence),
    luck: equipRaw.luck ?? 0,
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
  // NPC allies fight bare-handed in schema terms: one natural profile at their
  // class's band (casters/archers at range, everyone else in contact) + fists.
  const npcRangedClass = def.class === "archer" || def.class === "wizard" || def.class === "priest";
  const npcProfiles: WeaponProfile[] = [
    { kind: "primary", ...asBand(npcRangedClass ? RANGED_BAND : MELEE_BAND), dmgMin: npcRange.min, dmgMax: npcRange.max },
    FISTS,
  ];
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
    weapons: npcProfiles,
    npcId: def.id,
    canAct: !passive,
    canBeHealed: true,
    isTauntable: false,
    isMissionObjective: missionNpc.deathFailsMission ?? true,
    cannotFall: missionNpc.cannotFall,
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
    // A creature's natural attack IS a weapon profile (Combat Foundation §3):
    // authored band, else melee contact — or ranged for back-row creatures. A
    // ranged creature also gets a weak close-in fallback (claws/teeth at the old
    // pinned-exposure fraction), so a pinned spitter still fights.
    const naturalBand = def.attackBand ?? (def.combatRole === "back" ? RANGED_BAND : MELEE_BAND);
    const enemyProfiles: WeaponProfile[] = [
      { kind: "primary", ...asBand(naturalBand), dmgMin: eRange.min, dmgMax: eRange.max },
      ...(naturalBand.min > MELEE_BAND.max ? [{
        kind: "sidearm" as const, ...asBand(MELEE_BAND),
        dmgMin: Math.max(1, Math.round(eRange.min * CLOSE_IN_FRACTION)),
        dmgMax: Math.max(1, Math.round(eRange.max * CLOSE_IN_FRACTION)),
      }] : []),
    ];
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
        weapons: enemyProfiles,
        enemyTags: def.tags,
        enemyDefId: def.id,
        pack: def.pack,
        packNerve: def.packNerve,
        morale: def.morale,
        leader: def.leader,
        charge: def.charge,
        elusiveAtRange: def.elusiveAtRange,
        combatRole: def.combatRole,
        scale: def.boss ? 1.2 : undefined,
        routsAt: def.routsAt,
        enemyAbilities: def.abilities,
        canAct: true, canBeHealed: true, isTauntable: true,
        // Resolved once here so every consumer reads one profile per fight.
        ai: resolveAI({ ai: def.ai, routsAt: def.routsAt }),
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
