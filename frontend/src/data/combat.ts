// ─── Combat Simulation Engine ───────────────────────────────────
// Round-based combat with class abilities, status effects, and smart AI.

import type { Adventurer, AdventurerClass } from "./adventurers";
import { calcStats, BACKSTORY_TRAITS } from "./adventurers";
import { getEquipmentStats, getEquipmentDefense } from "./items";
import { getEnemy } from "./enemies";
import type { EnemyTag, EnemyAbility } from "./enemies";
import type { MissionTemplate, MissionEncounter } from "./missions";
import { getAbilitiesForClass } from "./abilities";

// ─── Types ──────────────────────────────────────────────────────

export interface CombatUnit {
  id: string;
  name: string;
  icon: string;
  isEnemy: boolean;
  hp: number;
  maxHp: number;
  str: number;
  dex: number;
  int: number;
  vit: number;
  wis: number;
  class?: AdventurerClass;
  isMagical: boolean;
  gearDefense: number;
  trait?: string;           // adventurer backstory trait id
  enemyTags?: EnemyTag[];   // enemy type tags (for trait bonus matching)
  enemyDefId?: string;      // enemy definition ID (for loot rolling)
  // Status effects
  cooldowns: Record<string, number>; // abilityId → rounds until available
  tauntedBy?: string; // unit ID forcing this unit to attack them
  slowed: number; // rounds remaining of halved initiative
  poisonTicks: { damage: number; rounds: number }[]; // active poison DoTs
  shieldWallUsed?: boolean; // warrior passive: once per combat
  enemyAbilities?: EnemyAbility[]; // enemy special abilities
  mindControlled?: number; // rounds remaining of mind control (attacks own team)
  statDebuffs?: { stat: string; pct: number; rounds: number }[]; // temporary stat reductions
}

export interface CombatLogEntry {
  round: number;
  attackerName: string;
  attackerIcon: string;
  targetName: string;
  damage: number;
  rawDamage?: number;
  dodged: boolean;
  crit: boolean;
  killed: boolean;
  targetHp?: number;
  targetMaxHp?: number;
  healed?: boolean;
  healAmount?: number;
  isEnemy: boolean;
  // Ability fields
  abilityName?: string;
  abilityIcon?: string;
  targets?: { name: string; damage: number; killed: boolean; hp: number; maxHp: number }[];
  isPoisonTick?: boolean;
  isTaunt?: boolean;
  isShieldWall?: boolean;
}

export interface LootResult {
  type: "resource" | "item";
  resource?: string;     // for resource drops
  itemId?: string;       // for item drops
  amount: number;        // quantity (1 for items)
  fromEnemy: string;     // enemy name that dropped it
}

export interface CombatResult {
  victory: boolean;
  rounds: number;
  log: CombatLogEntry[];
  performanceRatio: number;
  survivingEnemies: number;
  fallenAdventurerIds: string[];
  totalEnemies: number;
  loot: LootResult[];    // loot rolled from killed enemies
}

// ─── Derived combat stats ───────────────────────────────────────

function getAttackPower(unit: CombatUnit): number {
  if (!unit.class) return Math.max(unit.str, unit.dex);
  if (unit.class === "warrior") return unit.str;
  if (unit.class === "archer" || unit.class === "assassin") return unit.dex;
  return unit.int;
}

function getMagicPower(unit: CombatUnit): number {
  return unit.int;
}

function getDefenseReduction(unit: CombatUnit): number {
  const def = unit.isEnemy ? unit.vit * 3 : unit.gearDefense;
  return def / (def + 150);
}

function getMagicResistReduction(unit: CombatUnit): number {
  const mr = unit.wis * 3;
  return mr / (mr + 150);
}

function getInitiative(unit: CombatUnit): number {
  const base = unit.dex + Math.floor(unit.wis / 2);
  return unit.slowed > 0 ? Math.floor(base / 2) : base;
}

function getCritChance(unit: CombatUnit): number {
  const base = 5 + unit.dex * 0.5;
  const classBonus = unit.class === "assassin" ? 10 : 0;
  return Math.min(50, base + classBonus);
}

function getDodgeChance(unit: CombatUnit): number {
  return Math.min(20, unit.dex * 1.0);
}

function dealsMagicalDamage(unit: CombatUnit): boolean {
  if (unit.isMagical) return true;
  if (unit.class === "wizard" || unit.class === "priest") return true;
  return false;
}

// ─── Target selection ───────────────────────────────────────────

function pickTarget(attacker: CombatUnit, targets: CombatUnit[]): CombatUnit | null {
  const alive = targets.filter((u) => u.hp > 0);
  if (alive.length === 0) return null;

  // Taunt check: if attacker is taunted, must attack the taunter
  if (attacker.tauntedBy) {
    const taunter = alive.find((u) => u.id === attacker.tauntedBy);
    if (taunter) return taunter;
  }

  if (alive.length === 1) return alive[0];
  const wis = attacker.wis;

  if (wis <= 3) {
    return alive[Math.floor(Math.random() * alive.length)];
  }
  if (wis <= 8) {
    const sorted = [...alive].sort((a, b) => a.hp - b.hp);
    if (sorted.length > 1 && Math.random() < 0.3) return sorted[1];
    return sorted[0];
  }
  if (wis <= 14) {
    const magical = dealsMagicalDamage(attacker);
    const scored = alive.map((t) => {
      const reduction = magical ? getMagicResistReduction(t) : getDefenseReduction(t);
      return { target: t, score: (1 - reduction) * 100 + (1 - t.hp / t.maxHp) * 10 };
    });
    scored.sort((a, b) => b.score - a.score);
    if (scored.length > 1 && Math.random() < 0.2) return scored[1].target;
    return scored[0].target;
  }

  const priests = alive.filter((t) => t.class === "priest");
  if (priests.length > 0) return priests[0];
  const casters = alive.filter((t) => t.class === "wizard");
  if (casters.length > 0) return casters[0];

  const magical = dealsMagicalDamage(attacker);
  const scored = alive.map((t) => {
    const reduction = magical ? getMagicResistReduction(t) : getDefenseReduction(t);
    return { target: t, score: (1 - reduction) * 100 + (1 - t.hp / t.maxHp) * 10 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].target;
}

function pickTargetForAdventurer(attacker: CombatUnit, targets: CombatUnit[]): CombatUnit | null {
  const alive = targets.filter((u) => u.hp > 0);
  if (alive.length === 0) return null;
  if (alive.length === 1) return alive[0];

  const magical = dealsMagicalDamage(attacker);
  const scored = alive.map((t) => {
    const reduction = magical ? getMagicResistReduction(t) : getDefenseReduction(t);
    return { target: t, score: (1 - reduction) * 100 + (1 - t.hp / t.maxHp) * 20 };
  });
  scored.sort((a, b) => b.score - a.score);
  if (scored.length > 1 && Math.random() < 0.15) return scored[1].target;
  return scored[0].target;
}

// ─── Trait bonus vs enemy tags ──────────────────────────────────

/** Map trait IDs to the enemy tags they grant bonus damage against */
const TRAIT_TAG_BONUSES: Record<string, { tags: string[]; bonus: number }> = {
  demon_hunter:       { tags: ["demon"], bonus: 0.05 },
  grave_walker:       { tags: ["undead", "ghost"], bonus: 0.05 },
  beast_tracker:      { tags: ["beast"], bonus: 0.05 },
  dragonmarked:       { tags: ["dragon"], bonus: 0.05 },
  pious_heart:        { tags: ["demon", "divine"], bonus: 0.05 },
  elemental_attuned:  { tags: ["elemental_fire", "elemental_water", "elemental_earth", "elemental_wind", "elemental_aether"], bonus: 0.05 },
  veteran_campaigner: { tags: ["humanoid"], bonus: 0.05 },
};

/** Get trait-based damage multiplier for an attacker vs a defender's tags */
function getTraitDamageBonus(attacker: CombatUnit, defender: CombatUnit): number {
  if (!attacker.trait || !defender.enemyTags?.length) return 0;
  const entry = TRAIT_TAG_BONUSES[attacker.trait];
  if (!entry) return 0;
  const hasMatch = defender.enemyTags.some((tag) => entry.tags.includes(tag));
  return hasMatch ? entry.bonus : 0;
}

/** Get extra crit chance from the Lucky trait */
function getTraitCritBonus(unit: CombatUnit): number {
  return unit.trait === "lucky" ? 3 : 0;
}

// ─── Damage calculation ─────────────────────────────────────────

function calcDamageResult(attacker: CombatUnit, defender: CombatUnit, opts?: { forceCrit?: boolean; damageMult?: number; ignorePhysicalDef?: boolean }): { damage: number; rawDamage: number; crit: boolean } {
  // Ghost immunity: physical attacks deal 0 unless attacker has spirit_sensitive trait or deals magical damage
  const magical = dealsMagicalDamage(attacker) || opts?.ignorePhysicalDef;
  if (!magical && defender.enemyTags?.includes("ghost") && attacker.trait !== "spirit_sensitive") {
    return { damage: 0, rawDamage: 0, crit: false };
  }
  // Aether immunity: magical attacks deal 0 against aether elementals
  if (magical && defender.enemyTags?.includes("elemental_aether")) {
    return { damage: 0, rawDamage: 0, crit: false };
  }

  const power = magical ? getMagicPower(attacker) : getAttackPower(attacker);
  const reductionPct = opts?.ignorePhysicalDef ? getMagicResistReduction(defender) : (magical ? getMagicResistReduction(defender) : getDefenseReduction(defender));

  let rawDamage = Math.max(1, Math.floor(power * (0.7 + Math.random() * 0.6)));

  const crit = opts?.forceCrit || Math.random() * 100 < (getCritChance(attacker) + getTraitCritBonus(attacker));
  if (crit) rawDamage = Math.floor(rawDamage * 1.5);

  if (opts?.damageMult) rawDamage = Math.floor(rawDamage * opts.damageMult);

  // Trait bonus vs enemy type
  const traitBonus = getTraitDamageBonus(attacker, defender);
  if (traitBonus > 0) rawDamage = Math.floor(rawDamage * (1 + traitBonus));

  const damage = Math.max(1, Math.floor(rawDamage * (1 - reductionPct)));
  return { damage, rawDamage, crit };
}

// ─── Unit builders ──────────────────────────────────────────────

function buildAdventurerUnit(adv: Adventurer): CombatUnit {
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

// Tier-based stat scaling so enemies keep up with adventurer growth
// Enemy stats are used as-is from the definition — balance through the data, not multipliers
function buildEnemyUnits(encounters: MissionEncounter[]): CombatUnit[] {
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

// ─── Ability execution ──────────────────────────────────────────

function canUseAbility(unit: CombatUnit, abilityId: string): boolean {
  return (unit.cooldowns[abilityId] ?? 0) <= 0;
}

function startCooldown(unit: CombatUnit, abilityId: string, cooldown: number) {
  unit.cooldowns[abilityId] = cooldown;
}

function tickCooldowns(unit: CombatUnit) {
  for (const key of Object.keys(unit.cooldowns)) {
    if (unit.cooldowns[key] > 0) unit.cooldowns[key]--;
  }
}

/** Try to use a class ability. Returns true if ability was used (replaces basic attack). */
function tryUseAbility(
  unit: CombatUnit,
  adventurers: CombatUnit[],
  enemies: CombatUnit[],
  round: number,
  log: CombatLogEntry[],
): boolean {
  if (!unit.class || unit.isEnemy) return false;
  const aliveEnemies = enemies.filter((u) => u.hp > 0);
  const aliveAdvs = adventurers.filter((u) => u.hp > 0);

  switch (unit.class) {
    case "warrior":
      return tryWarriorAbility(unit, aliveAdvs, aliveEnemies, round, log);
    case "wizard":
      return tryWizardAbility(unit, aliveEnemies, round, log);
    case "priest":
      return tryPriestAbility(unit, aliveAdvs, aliveEnemies, round, log);
    case "archer":
      return tryArcherAbility(unit, aliveEnemies, round, log);
    case "assassin":
      return tryAssassinAbility(unit, aliveEnemies, round, log);
  }
  return false;
}

function tryWarriorAbility(unit: CombatUnit, allies: CombatUnit[], enemies: CombatUnit[], round: number, log: CombatLogEntry[]): boolean {
  // Taunt: when any ally is below 30% HP
  if (canUseAbility(unit, "taunt") && allies.some((a) => a.id !== unit.id && a.hp / a.maxHp < 0.3)) {
    startCooldown(unit, "taunt", 4);
    for (const enemy of enemies) {
      // Iron Will trait: 10% chance to resist taunt
      if (enemy.trait === "iron_will" && Math.random() < 0.10) continue;
      enemy.tauntedBy = unit.id;
    }
    log.push({
      round, attackerName: unit.name, attackerIcon: "🛡️", targetName: "",
      damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
      abilityName: "Taunt", abilityIcon: "🛡️", isTaunt: true,
    });
    return true;
  }

  // Cleave: when 2+ enemies alive
  if (canUseAbility(unit, "cleave") && enemies.length >= 2) {
    startCooldown(unit, "cleave", 3);
    const targets = enemies.slice(0, 2);
    const hits: { name: string; damage: number; killed: boolean; hp: number; maxHp: number }[] = [];
    for (const t of targets) {
      const { damage, crit } = calcDamageResult(unit, t, { damageMult: 0.7 });
      t.hp -= damage;
      hits.push({ name: t.name, damage, killed: t.hp <= 0, hp: Math.max(0, t.hp), maxHp: t.maxHp });
    }
    log.push({
      round, attackerName: unit.name, attackerIcon: "⚔️", targetName: "",
      damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
      abilityName: "Cleave", abilityIcon: "⚔️", targets: hits,
    });
    return true;
  }
  return false;
}

function tryWizardAbility(unit: CombatUnit, enemies: CombatUnit[], round: number, log: CombatLogEntry[]): boolean {
  // Fireball: when 3+ enemies alive
  if (canUseAbility(unit, "fireball") && enemies.length >= 3) {
    startCooldown(unit, "fireball", 3);
    const hits: { name: string; damage: number; killed: boolean; hp: number; maxHp: number }[] = [];
    for (const t of enemies) {
      const { damage } = calcDamageResult(unit, t, { damageMult: 0.5 });
      t.hp -= damage;
      hits.push({ name: t.name, damage, killed: t.hp <= 0, hp: Math.max(0, t.hp), maxHp: t.maxHp });
    }
    log.push({
      round, attackerName: unit.name, attackerIcon: "🔥", targetName: "",
      damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
      abilityName: "Fireball", abilityIcon: "🔥", targets: hits,
    });
    return true;
  }

  // Frost Bolt: default ability when fireball on cooldown
  if (canUseAbility(unit, "frost_bolt")) {
    startCooldown(unit, "frost_bolt", 2);
    const target = enemies.sort((a, b) => b.hp - a.hp)[0]; // highest HP
    const { damage, crit } = calcDamageResult(unit, target, { damageMult: 1.3 });
    target.hp -= damage;
    target.slowed = 2;
    log.push({
      round, attackerName: unit.name, attackerIcon: "❄️", targetName: target.name,
      damage, dodged: false, crit, killed: target.hp <= 0,
      targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp,
      isEnemy: false, abilityName: "Frost Bolt", abilityIcon: "❄️",
    });
    return true;
  }
  return false;
}

function tryPriestAbility(unit: CombatUnit, allies: CombatUnit[], enemies: CombatUnit[], round: number, log: CombatLogEntry[]): boolean {
  // Group Heal: when 2+ allies below 50% HP
  const woundedAllies = allies.filter((a) => a.hp / a.maxHp < 0.5);
  if (canUseAbility(unit, "group_heal") && woundedAllies.length >= 2) {
    startCooldown(unit, "group_heal", 4);
    const healBase = Math.floor(unit.int * 0.6 * 0.4); // 40% of normal heal
    const hits: { name: string; damage: number; killed: boolean; hp: number; maxHp: number }[] = [];
    for (const a of allies) {
      if (a.hp >= a.maxHp) continue;
      const heal = Math.floor(healBase * (0.8 + Math.random() * 0.4));
      a.hp = Math.min(a.maxHp, a.hp + heal);
      hits.push({ name: a.name, damage: -heal, killed: false, hp: a.hp, maxHp: a.maxHp });
    }
    log.push({
      round, attackerName: unit.name, attackerIcon: "💚", targetName: "",
      damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
      abilityName: "Group Heal", abilityIcon: "💚", targets: hits, healed: true,
    });
    return true;
  }

  // Single heal if one ally below 50%
  if (woundedAllies.length === 1) {
    const target = woundedAllies[0];
    const healAmount = Math.floor(unit.int * 0.6 * (0.8 + Math.random() * 0.4));
    target.hp = Math.min(target.maxHp, target.hp + healAmount);
    log.push({
      round, attackerName: unit.name, attackerIcon: "💚", targetName: target.name,
      damage: 0, dodged: false, crit: false, killed: false,
      targetHp: target.hp, targetMaxHp: target.maxHp,
      isEnemy: false, healed: true, healAmount,
    });
    return true;
  }

  // Smite: when no ally needs healing — holy damage ignoring physical defense
  if (canUseAbility(unit, "smite")) {
    startCooldown(unit, "smite", 2);
    const target = enemies.sort((a, b) => a.hp - b.hp)[0]; // lowest HP
    const { damage, crit } = calcDamageResult(unit, target, { ignorePhysicalDef: true });
    target.hp -= damage;
    log.push({
      round, attackerName: unit.name, attackerIcon: "✝️", targetName: target.name,
      damage, dodged: false, crit, killed: target.hp <= 0,
      targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp,
      isEnemy: false, abilityName: "Smite", abilityIcon: "✝️",
    });
    return true;
  }
  return false;
}

function tryArcherAbility(unit: CombatUnit, enemies: CombatUnit[], round: number, log: CombatLogEntry[]): boolean {
  // Multi-shot: when 2+ enemies alive
  if (canUseAbility(unit, "multi_shot") && enemies.length >= 2) {
    startCooldown(unit, "multi_shot", 3);
    // Hit up to 3 random enemies
    const shuffled = [...enemies].sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, Math.min(3, enemies.length));
    const hits: { name: string; damage: number; killed: boolean; hp: number; maxHp: number }[] = [];
    for (const t of targets) {
      const { damage } = calcDamageResult(unit, t, { damageMult: 0.6 });
      t.hp -= damage;
      hits.push({ name: t.name, damage, killed: t.hp <= 0, hp: Math.max(0, t.hp), maxHp: t.maxHp });
    }
    log.push({
      round, attackerName: unit.name, attackerIcon: "🏹", targetName: "",
      damage: 0, dodged: false, crit: false, killed: false, isEnemy: false,
      abilityName: "Multi-Shot", abilityIcon: "🏹", targets: hits,
    });
    return true;
  }

  // Aimed Shot: guaranteed crit on highest HP enemy
  if (canUseAbility(unit, "aimed_shot")) {
    startCooldown(unit, "aimed_shot", 4);
    const target = enemies.sort((a, b) => b.hp - a.hp)[0];
    const { damage } = calcDamageResult(unit, target, { forceCrit: true });
    target.hp -= damage;
    log.push({
      round, attackerName: unit.name, attackerIcon: "🎯", targetName: target.name,
      damage, dodged: false, crit: true, killed: target.hp <= 0,
      targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp,
      isEnemy: false, abilityName: "Aimed Shot", abilityIcon: "🎯",
    });
    return true;
  }
  return false;
}

function tryAssassinAbility(unit: CombatUnit, enemies: CombatUnit[], round: number, log: CombatLogEntry[]): boolean {
  // Backstab: when any enemy below 40% HP
  const weakEnemy = enemies.find((e) => e.hp / e.maxHp < 0.4);
  if (canUseAbility(unit, "backstab") && weakEnemy) {
    startCooldown(unit, "backstab", 2);
    const { damage, crit } = calcDamageResult(unit, weakEnemy, { damageMult: 2.0 });
    weakEnemy.hp -= damage;
    log.push({
      round, attackerName: unit.name, attackerIcon: "🗡️", targetName: weakEnemy.name,
      damage, dodged: false, crit, killed: weakEnemy.hp <= 0,
      targetHp: Math.max(0, weakEnemy.hp), targetMaxHp: weakEnemy.maxHp,
      isEnemy: false, abilityName: "Backstab", abilityIcon: "🗡️",
    });
    return true;
  }

  // Poison: apply DoT on highest HP enemy
  if (canUseAbility(unit, "poison")) {
    startCooldown(unit, "poison", 4);
    const target = enemies.sort((a, b) => b.hp - a.hp)[0];
    const dotDamage = Math.floor(getAttackPower(unit) * 0.3);
    target.poisonTicks.push({ damage: dotDamage, rounds: 3 });
    log.push({
      round, attackerName: unit.name, attackerIcon: "☠️", targetName: target.name,
      damage: 0, dodged: false, crit: false, killed: false,
      targetHp: target.hp, targetMaxHp: target.maxHp,
      isEnemy: false, abilityName: "Poison", abilityIcon: "☠️",
    });
    return true;
  }
  return false;
}

// ─── Simulation ─────────────────────────────────────────────────

const MAX_ROUNDS = 20;

function calcFamilyBonuses(team: Adventurer[]): Map<string, number> {
  const lastNames = team.map((a) => a.name.split(" ").slice(1).join(" "));
  const nameCounts = new Map<string, number>();
  for (const ln of lastNames) { nameCounts.set(ln, (nameCounts.get(ln) ?? 0) + 1); }
  const bonuses = new Map<string, number>();
  for (let i = 0; i < team.length; i++) {
    const count = nameCounts.get(lastNames[i]) ?? 1;
    if (count > 1) bonuses.set(team[i].id, count - 1);
  }
  return bonuses;
}

// ─── Enemy ability execution ────────────────────────────────────

function tryEnemyAbility(
  unit: CombatUnit,
  allies: CombatUnit[],     // other enemies
  targets: CombatUnit[],    // adventurers
  round: number,
  log: CombatLogEntry[],
): boolean {
  if (!unit.enemyAbilities?.length) return false;

  const aliveAllies = allies.filter((u) => u.hp > 0);
  const deadAllies = allies.filter((u) => u.hp <= 0);
  const aliveTargets = targets.filter((u) => u.hp > 0);

  for (const ability of unit.enemyAbilities) {
    // Check cooldown
    if ((unit.cooldowns[ability.id] ?? 0) > 0) continue;

    // Check trigger condition
    const hpPct = unit.hp / unit.maxHp;
    switch (ability.trigger) {
      case "always": break;
      case "hp_below_50": if (hpPct >= 0.5) continue; break;
      case "ally_dead": if (deadAllies.length === 0) continue; break;
      case "any_ally_below_30": if (!aliveAllies.some((a) => a.hp / a.maxHp < 0.3)) continue; break;
      case "round_start": break; // always triggers at round start (handled separately)
    }

    const eff = ability.effect;
    unit.cooldowns[ability.id] = ability.cooldown;

    switch (eff.type) {
      case "bleed":
      case "poison": {
        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        if (!target) return false;
        const dotDmg = Math.floor(getAttackPower(unit) * eff.pctPerRound / 100);
        target.poisonTicks.push({ damage: dotDmg, rounds: eff.rounds });
        log.push({
          round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: target.name, damage: 0, dodged: false, crit: false, killed: false,
          targetHp: target.hp, targetMaxHp: target.maxHp, isEnemy: true,
        });
        return true;
      }

      case "heal_self": {
        const heal = Math.floor(unit.maxHp * eff.pct / 100);
        unit.hp = Math.min(unit.maxHp, unit.hp + heal);
        log.push({
          round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: unit.name, damage: heal, dodged: false, crit: false, killed: false,
          targetHp: unit.hp, targetMaxHp: unit.maxHp, isEnemy: true, healed: true, healAmount: heal,
        });
        return true;
      }

      case "heal_ally": {
        const wounded = aliveAllies.filter((a) => a.hp < a.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        const target = wounded[0];
        if (!target) continue;
        const heal = Math.floor(target.maxHp * eff.pct / 100);
        target.hp = Math.min(target.maxHp, target.hp + heal);
        log.push({
          round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: target.name, damage: heal, dodged: false, crit: false, killed: false,
          targetHp: target.hp, targetMaxHp: target.maxHp, isEnemy: true, healed: true, healAmount: heal,
        });
        return true;
      }

      case "aoe_damage": {
        const power = eff.magical ? unit.int : unit.str;
        const baseDmg = Math.floor(power * eff.pct / 100);
        const hits: { name: string; damage: number; killed: boolean; hp: number; maxHp: number }[] = [];
        for (const t of aliveTargets) {
          const def = eff.magical ? t.wis * 3 : (t.isEnemy ? t.vit * 3 : t.gearDefense);
          const reduction = def / (def + 150);
          const dmg = Math.max(1, Math.floor(baseDmg * (1 - reduction)));
          t.hp -= dmg;
          hits.push({ name: t.name, damage: dmg, killed: t.hp <= 0, hp: Math.max(0, t.hp), maxHp: t.maxHp });
        }
        log.push({
          round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: hits[0]?.name ?? "", damage: 0, dodged: false, crit: false,
          killed: hits.some((h) => h.killed), isEnemy: true,
          targets: hits,
        });
        return true;
      }

      case "damage_mult": {
        // Pick target(s) and deal multiplied damage
        const tgts = aliveTargets.slice().sort(() => Math.random() - 0.5).slice(0, eff.targets);
        const hits: { name: string; damage: number; killed: boolean; hp: number; maxHp: number }[] = [];
        for (const t of tgts) {
          const { damage } = calcDamageResult(unit, t, { damageMult: eff.mult });
          t.hp -= damage;
          hits.push({ name: t.name, damage, killed: t.hp <= 0, hp: Math.max(0, t.hp), maxHp: t.maxHp });
        }
        if (hits.length === 1) {
          log.push({
            round, attackerName: unit.name, attackerIcon: ability.icon,
            abilityName: ability.name,
            targetName: hits[0].name, damage: hits[0].damage, dodged: false, crit: false,
            killed: hits[0].killed, targetHp: hits[0].hp, targetMaxHp: hits[0].maxHp, isEnemy: true,
          });
        } else {
          log.push({
            round, attackerName: unit.name, attackerIcon: ability.icon,
            abilityName: ability.name,
            targetName: hits[0]?.name ?? "", damage: 0, dodged: false, crit: false,
            killed: hits.some((h) => h.killed), isEnemy: true, targets: hits,
          });
        }
        return true;
      }

      case "buff_allies": {
        for (const ally of aliveAllies) {
          const bonus = Math.floor((ally as any)[eff.stat] * eff.pct / 100);
          (ally as any)[eff.stat] += bonus;
          if (!ally.statDebuffs) ally.statDebuffs = [];
          ally.statDebuffs.push({ stat: eff.stat, pct: -bonus, rounds: eff.rounds }); // negative = buff to remove later
        }
        log.push({
          round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: "all allies", damage: 0, dodged: false, crit: false, killed: false, isEnemy: true,
        });
        return true;
      }

      case "debuff_target": {
        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        if (!target) continue;
        const reduction = Math.floor((target as any)[eff.stat] * eff.pct / 100);
        (target as any)[eff.stat] = Math.max(1, (target as any)[eff.stat] - reduction);
        if (!target.statDebuffs) target.statDebuffs = [];
        target.statDebuffs.push({ stat: eff.stat, pct: reduction, rounds: eff.rounds });
        log.push({
          round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: target.name, damage: 0, dodged: false, crit: false, killed: false,
          targetHp: target.hp, targetMaxHp: target.maxHp, isEnemy: true,
        });
        return true;
      }

      case "mind_control": {
        const target = aliveTargets.filter((t) => !t.mindControlled).sort(() => Math.random() - 0.5)[0];
        if (!target) continue;
        target.mindControlled = eff.rounds;
        log.push({
          round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: target.name, damage: 0, dodged: false, crit: false, killed: false,
          targetHp: target.hp, targetMaxHp: target.maxHp, isEnemy: true,
        });
        return true;
      }

      case "revive_ally": {
        const dead = deadAllies[0];
        if (!dead) continue;
        dead.hp = Math.floor(dead.maxHp * eff.hpPct / 100);
        log.push({
          round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: dead.name, damage: 0, dodged: false, crit: false, killed: false,
          targetHp: dead.hp, targetMaxHp: dead.maxHp, isEnemy: true, healed: true, healAmount: dead.hp,
        });
        return true;
      }

      case "summon": {
        const summonDef = getEnemy(eff.enemyId);
        if (!summonDef) continue;
        for (let s = 0; s < eff.count; s++) {
          const summonHp = summonDef.stats.vit * 10;
          const summonId = `${eff.enemyId}_summon_${round}_${s}`;
          allies.push({
            id: summonId,
            name: summonDef.name,
            icon: summonDef.icon, isEnemy: true,
            hp: summonHp, maxHp: summonHp,
            str: summonDef.stats.str,
            dex: summonDef.stats.dex,
            int: summonDef.stats.int,
            vit: summonDef.stats.vit,
            wis: summonDef.stats.wis ?? 0,
            class: undefined,
            isMagical: summonDef.tags.includes("magical") || summonDef.tags.includes("demon"),
            gearDefense: 0,
            enemyTags: summonDef.tags,
            enemyDefId: summonDef.id,
            cooldowns: {}, slowed: 0, poisonTicks: [], statDebuffs: [],
          });
        }
        log.push({
          round, attackerName: unit.name, attackerIcon: ability.icon,
          abilityName: ability.name,
          targetName: `${eff.count}x ${summonDef.name}`, damage: 0, dodged: false, crit: false,
          killed: false, isEnemy: true,
        });
        return true;
      }
    }
  }
  return false;
}

export function simulateCombat(
  mission: MissionTemplate,
  team: Adventurer[],
): CombatResult | null {
  if (!mission.encounters?.length || team.length === 0) return null;

  const adventurers = team.map(buildAdventurerUnit);

  // Family bond: +2 to all stats per shared family member
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

  const enemies = buildEnemyUnits(mission.encounters);
  const totalEnemies = enemies.length;
  if (enemies.length === 0) return null;

  const log: CombatLogEntry[] = [];
  let round = 0;

  while (round < MAX_ROUNDS) {
    round++;
    const aliveAdvs = adventurers.filter((u) => u.hp > 0);
    const aliveEnemies = enemies.filter((u) => u.hp > 0);
    if (aliveAdvs.length === 0 || aliveEnemies.length === 0) break;

    // ── Round start: tick status effects ──
    const allUnits = [...adventurers, ...enemies];
    for (const unit of allUnits) {
      if (unit.hp <= 0) continue;
      tickCooldowns(unit);
      if (unit.slowed > 0) unit.slowed--;

      // Tick stat debuffs/buffs
      if (unit.statDebuffs?.length) {
        unit.statDebuffs = unit.statDebuffs.filter((d) => {
          d.rounds--;
          if (d.rounds <= 0) {
            // Restore the stat
            (unit as any)[d.stat] = Math.max(1, (unit as any)[d.stat] + d.pct);
            return false;
          }
          return true;
        });
      }

      // Poison DoT ticks
      if (unit.poisonTicks.length > 0) {
        let totalDot = 0;
        unit.poisonTicks = unit.poisonTicks.filter((p) => {
          totalDot += p.damage;
          p.rounds--;
          return p.rounds > 0;
        });
        if (totalDot > 0) {
          unit.hp -= totalDot;
          log.push({
            round, attackerName: "Poison", attackerIcon: "☠️", targetName: unit.name,
            damage: totalDot, dodged: false, crit: false, killed: unit.hp <= 0,
            targetHp: Math.max(0, unit.hp), targetMaxHp: unit.maxHp,
            isEnemy: unit.isEnemy, isPoisonTick: true,
          });
        }
      }
    }

    // Clear taunt from previous round
    for (const unit of allUnits) { unit.tauntedBy = undefined; }

    // Recheck alive after DoTs
    const aliveAfterDots = adventurers.filter((u) => u.hp > 0);
    const aliveEnemiesAfterDots = enemies.filter((u) => u.hp > 0);
    if (aliveAfterDots.length === 0 || aliveEnemiesAfterDots.length === 0) break;

    // Sort all alive units by initiative
    const allAlive = [...aliveAfterDots, ...aliveEnemiesAfterDots]
      .sort((a, b) => getInitiative(b) - getInitiative(a));

    // ── Action phase ──
    for (const unit of allAlive) {
      if (unit.hp <= 0) continue;

      // Mind-controlled adventurers attack their own team
      if (!unit.isEnemy && unit.mindControlled && unit.mindControlled > 0) {
        const allyTarget = adventurers.filter((a) => a.hp > 0 && a.id !== unit.id)[0];
        if (allyTarget) {
          const { damage, crit } = calcDamageResult(unit, allyTarget);
          allyTarget.hp -= damage;
          log.push({
            round, attackerName: unit.name, attackerIcon: "🧠",
            abilityName: "Mind Controlled",
            targetName: allyTarget.name, damage, dodged: false, crit,
            killed: allyTarget.hp <= 0,
            targetHp: Math.max(0, allyTarget.hp), targetMaxHp: allyTarget.maxHp, isEnemy: false,
          });
        }
        unit.mindControlled--;
        continue;
      }

      // Adventurers: try ability first, then basic attack
      if (!unit.isEnemy) {
        const usedAbility = tryUseAbility(unit, adventurers, enemies, round, log);
        if (usedAbility) continue;
      }

      // Enemies: try special ability first
      if (unit.isEnemy) {
        const usedAbility = tryEnemyAbility(unit, enemies, adventurers, round, log);
        if (usedAbility) continue;
      }

      // Basic attack
      const targetPool = unit.isEnemy ? adventurers : enemies;
      const target = unit.isEnemy ? pickTarget(unit, targetPool) : pickTargetForAdventurer(unit, targetPool);
      if (!target || target.hp <= 0) continue;

      const dodged = Math.random() * 100 < getDodgeChance(target);
      if (dodged) {
        log.push({
          round, attackerName: unit.name,
          attackerIcon: unit.isEnemy ? unit.icon : (unit.isMagical ? "🔮" : "⚔️"),
          targetName: target.name, damage: 0, dodged: true, crit: false, killed: false,
          targetHp: target.hp, targetMaxHp: target.maxHp, isEnemy: unit.isEnemy,
        });
        continue;
      }

      const { damage, rawDamage, crit } = calcDamageResult(unit, target);

      // Shield Wall: warrior absorbs killing blow for ally (once per combat)
      if (!unit.isEnemy && target.hp > 0) {
        // N/A for attacker — Shield Wall triggers when DEFENDER would die
      }
      if (unit.isEnemy && target.hp - damage <= 0 && !target.isEnemy) {
        // Check if a warrior can absorb
        const warriors = adventurers.filter((a) => a.hp > 0 && a.class === "warrior" && a.id !== target.id && !a.shieldWallUsed);
        if (warriors.length > 0 && Math.random() < 0.5) {
          const protector = warriors[0];
          protector.shieldWallUsed = true;
          protector.hp -= damage;
          log.push({
            round, attackerName: protector.name, attackerIcon: "🛡️",
            targetName: target.name, damage, dodged: false, crit: false,
            killed: protector.hp <= 0,
            targetHp: Math.max(0, protector.hp), targetMaxHp: protector.maxHp,
            isEnemy: false, isShieldWall: true,
            abilityName: "Shield Wall", abilityIcon: "🛡️",
          });
          continue; // original target is saved
        }
      }

      target.hp -= damage;
      const killed = target.hp <= 0;

      log.push({
        round, attackerName: unit.name,
        attackerIcon: unit.isEnemy ? unit.icon : (unit.isMagical ? "🔮" : "⚔️"),
        targetName: target.name, damage, rawDamage,
        dodged: false, crit, killed,
        targetHp: Math.max(0, target.hp), targetMaxHp: target.maxHp,
        isEnemy: unit.isEnemy,
      });
    }

    if (adventurers.filter((u) => u.hp > 0).length === 0) break;
    if (enemies.filter((u) => u.hp > 0).length === 0) break;
  }

  const aliveAdvs = adventurers.filter((u) => u.hp > 0);
  const aliveEnemies = enemies.filter((u) => u.hp > 0);
  const survivingEnemies = aliveEnemies.length;

  let victory: boolean;
  if (aliveEnemies.length === 0) victory = true;
  else if (aliveAdvs.length === 0) victory = false;
  else {
    const advHpRatio = aliveAdvs.reduce((s, u) => s + u.hp, 0) / adventurers.reduce((s, u) => s + u.maxHp, 0);
    const enemyHpRatio = aliveEnemies.reduce((s, u) => s + u.hp, 0) / enemies.reduce((s, u) => s + u.maxHp, 0);
    victory = advHpRatio >= enemyHpRatio;
  }

  const enemiesKilled = totalEnemies - survivingEnemies;
  const performanceRatio = totalEnemies > 0 ? enemiesKilled / totalEnemies : 0.5;
  const fallenAdventurerIds = adventurers.filter((u) => u.hp <= 0).map((u) => u.id);

  // Roll loot from killed enemies
  const loot: LootResult[] = [];
  const killedEnemies = enemies.filter((u) => u.hp <= 0);
  for (const unit of killedEnemies) {
    if (!unit.enemyDefId) continue;
    const def = getEnemy(unit.enemyDefId);
    if (!def?.loot?.length) continue;
    for (const drop of def.loot) {
      if (Math.random() > drop.chance) continue;
      if (drop.type === "resource") {
        const amount = drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
        if (amount > 0) {
          loot.push({ type: "resource", resource: drop.resource, amount, fromEnemy: unit.name });
        }
      } else {
        loot.push({ type: "item", itemId: drop.itemId, amount: 1, fromEnemy: unit.name });
      }
    }
  }

  return { victory, rounds: round, log, performanceRatio, survivingEnemies, totalEnemies, fallenAdventurerIds, loot };
}
