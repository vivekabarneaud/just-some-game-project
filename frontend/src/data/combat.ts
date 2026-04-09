// ─── Combat Simulation Engine ───────────────────────────────────
// Round-based combat for missions with encounters.
// Uses derived stats: attack power, magic power, defense, magic resist,
// initiative, crit chance, dodge chance.

import type { Adventurer, AdventurerClass } from "./adventurers";
import { calcStats } from "./adventurers";
import { getEquipmentStats } from "./items";
import { getEnemy } from "./enemies";
import type { MissionTemplate, MissionEncounter } from "./missions";

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
  isMagical: boolean; // deals magical damage (reduced by magic resist)
}

export interface CombatLogEntry {
  round: number;
  attackerName: string;
  attackerIcon: string;
  targetName: string;
  damage: number;
  rawDamage?: number; // before defense/resist reduction
  dodged: boolean;
  crit: boolean;
  killed: boolean;
  targetHp?: number;     // HP after this action
  targetMaxHp?: number;
  healed?: boolean;
  healAmount?: number;
  isEnemy: boolean;
}

export interface CombatResult {
  victory: boolean;
  rounds: number;
  log: CombatLogEntry[];
  performanceRatio: number;
  survivingEnemies: number;
  totalEnemies: number;
}

// ─── Derived combat stats ───────────────────────────────────────

/** Physical damage stat — STR for warriors, DEX for archers/assassins */
function getAttackPower(unit: CombatUnit): number {
  if (!unit.class) return Math.max(unit.str, unit.dex); // enemies: highest physical
  if (unit.class === "warrior") return unit.str;
  if (unit.class === "archer" || unit.class === "assassin") return unit.dex;
  return unit.int; // wizards/priests fall through to magic
}

/** Magical damage stat — INT for wizards/priests */
function getMagicPower(unit: CombatUnit): number {
  return unit.int;
}

/** Physical damage reduction — VIT / 2 */
function getDefense(unit: CombatUnit): number {
  return Math.floor(unit.vit / 2);
}

/** Magical damage reduction — WIS / 2 */
function getMagicResist(unit: CombatUnit): number {
  return Math.floor(unit.wis / 2);
}

/** Turn order — DEX + WIS / 2. Higher goes first. */
function getInitiative(unit: CombatUnit): number {
  return unit.dex + Math.floor(unit.wis / 2);
}

/** Crit chance — 5% base + 0.5% per DEX. Assassins get +10% extra. */
function getCritChance(unit: CombatUnit): number {
  const base = 5 + unit.dex * 0.5;
  const classBonus = unit.class === "assassin" ? 10 : 0;
  return Math.min(50, base + classBonus); // cap 50%
}

/** Dodge chance — 1.5% per DEX, max 30% */
function getDodgeChance(unit: CombatUnit): number {
  return Math.min(30, unit.dex * 1.5);
}

/** Does this unit deal magical damage? */
function dealsMagicalDamage(unit: CombatUnit): boolean {
  if (unit.isMagical) return true;
  if (unit.class === "wizard" || unit.class === "priest") return true;
  return false;
}

function pickTarget(units: CombatUnit[]): CombatUnit | null {
  const alive = units.filter((u) => u.hp > 0);
  if (alive.length === 0) return null;
  return alive[Math.floor(Math.random() * alive.length)];
}

// ─── Damage calculation ─────────────────────────────────────────

function calcDamageResult(attacker: CombatUnit, defender: CombatUnit): { damage: number; rawDamage: number; crit: boolean } {
  const magical = dealsMagicalDamage(attacker);
  const power = magical ? getMagicPower(attacker) : getAttackPower(attacker);
  const reduction = magical ? getMagicResist(defender) : getDefense(defender);

  // Base damage with 70-130% randomness
  let rawDamage = Math.max(1, Math.floor(power * (0.7 + Math.random() * 0.6)));

  // Crit check
  const crit = Math.random() * 100 < getCritChance(attacker);
  if (crit) rawDamage = Math.floor(rawDamage * 1.5);

  // Apply defense/resist reduction
  const damage = Math.max(1, rawDamage - reduction);

  return { damage, rawDamage, crit };
}

// ─── Unit builders ──────────────────────────────────────────────

function buildAdventurerUnit(adv: Adventurer): CombatUnit {
  const equipStats = getEquipmentStats(adv.equipment);
  const stats = calcStats(adv, equipStats);
  const hp = stats.vit * 8;
  return {
    id: adv.id,
    name: adv.name,
    icon: "",
    isEnemy: false,
    hp,
    maxHp: hp,
    str: stats.str,
    dex: stats.dex,
    int: stats.int,
    vit: stats.vit,
    wis: stats.wis,
    class: adv.class,
    isMagical: adv.class === "wizard" || adv.class === "priest",
  };
}

function buildEnemyUnits(encounters: MissionEncounter[]): CombatUnit[] {
  const units: CombatUnit[] = [];
  for (const enc of encounters) {
    const def = getEnemy(enc.enemyId);
    if (!def) continue;
    const isMagical = def.tags.includes("magical") || def.tags.includes("undead");
    for (let i = 0; i < enc.count; i++) {
      const hp = def.stats.vit * 6;
      units.push({
        id: `${def.id}_${i}`,
        name: enc.count > 1 ? `${def.name} ${i + 1}` : def.name,
        icon: def.icon,
        isEnemy: true,
        hp,
        maxHp: hp,
        str: def.stats.str,
        dex: def.stats.dex,
        int: def.stats.int,
        vit: def.stats.vit,
        wis: def.stats.wis ?? 0,
        class: undefined,
        isMagical,
      });
    }
  }
  return units;
}

// ─── Simulation ─────────────────────────────────────────────────

const MAX_ROUNDS = 20;

export function simulateCombat(
  mission: MissionTemplate,
  team: Adventurer[],
): CombatResult | null {
  if (!mission.encounters?.length || team.length === 0) return null;

  const adventurers = team.map(buildAdventurerUnit);
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

    // Sort all alive units by initiative (highest first)
    const allAlive: CombatUnit[] = [...aliveAdvs, ...aliveEnemies]
      .sort((a, b) => getInitiative(b) - getInitiative(a));

    // Track which priests have healed this round
    const priestsHealed = new Set<string>();

    // Priest healing phase — priests heal before combat if there are wounded allies
    for (const unit of allAlive) {
      if (unit.hp <= 0 || unit.isEnemy || unit.class !== "priest") continue;
      const currentAliveAdvs = adventurers.filter((u) => u.hp > 0);
      if (currentAliveAdvs.length <= 1) continue;

      const wounded = currentAliveAdvs
        .filter((a) => a.id !== unit.id && a.hp < a.maxHp)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      if (wounded.length > 0) {
        const healAmount = Math.floor(unit.int * 0.6 * (0.8 + Math.random() * 0.4));
        if (healAmount > 0) {
          const target = wounded[0];
          target.hp = Math.min(target.maxHp, target.hp + healAmount);
          priestsHealed.add(unit.id);
          log.push({
            round,
            attackerName: unit.name,
            attackerIcon: "💚",
            targetName: target.name,
            damage: 0,
            dodged: false,
            crit: false,
            killed: false,
            targetHp: target.hp,
            targetMaxHp: target.maxHp,
            healed: true,
            healAmount,
            isEnemy: false,
          });
        }
      }
    }

    // Combat phase — all units act in initiative order
    for (const unit of allAlive) {
      if (unit.hp <= 0) continue; // died earlier this round
      if (!unit.isEnemy && unit.class === "priest" && priestsHealed.has(unit.id)) continue;

      const targetPool = unit.isEnemy ? adventurers : enemies;
      const target = pickTarget(targetPool);
      if (!target) continue;

      // Dodge check
      const dodged = Math.random() * 100 < getDodgeChance(target);
      if (dodged) {
        log.push({
          round,
          attackerName: unit.name,
          attackerIcon: unit.isEnemy ? unit.icon : "⚔️",
          targetName: target.name,
          damage: 0,
          dodged: true,
          crit: false,
          killed: false,
          targetHp: target.hp,
          targetMaxHp: target.maxHp,
          isEnemy: unit.isEnemy,
        });
        continue;
      }

      // Damage calculation with defense/resist
      const { damage, rawDamage, crit } = calcDamageResult(unit, target);
      target.hp -= damage;
      const killed = target.hp <= 0;

      log.push({
        round,
        attackerName: unit.name,
        attackerIcon: unit.isEnemy ? unit.icon : "⚔️",
        targetName: target.name,
        damage,
        rawDamage,
        dodged: false,
        crit,
        killed,
        targetHp: Math.max(0, target.hp),
        targetMaxHp: target.maxHp,
        isEnemy: unit.isEnemy,
      });
    }

    // Check end conditions
    if (adventurers.filter((u) => u.hp > 0).length === 0) break;
    if (enemies.filter((u) => u.hp > 0).length === 0) break;
  }

  const aliveAdvs = adventurers.filter((u) => u.hp > 0);
  const aliveEnemies = enemies.filter((u) => u.hp > 0);
  const survivingEnemies = aliveEnemies.length;

  // Determine victory
  let victory: boolean;
  if (aliveEnemies.length === 0) {
    victory = true;
  } else if (aliveAdvs.length === 0) {
    victory = false;
  } else {
    // Timeout: compare remaining HP ratios
    const advHpRatio = aliveAdvs.reduce((s, u) => s + u.hp, 0) / adventurers.reduce((s, u) => s + u.maxHp, 0);
    const enemyHpRatio = aliveEnemies.reduce((s, u) => s + u.hp, 0) / enemies.reduce((s, u) => s + u.maxHp, 0);
    victory = advHpRatio >= enemyHpRatio;
  }

  // Performance ratio: 1.0 = barely lost, 0.0 = crushed
  const enemiesKilled = totalEnemies - survivingEnemies;
  const performanceRatio = totalEnemies > 0 ? enemiesKilled / totalEnemies : 0.5;

  return {
    victory,
    rounds: round,
    log,
    performanceRatio,
    survivingEnemies,
    totalEnemies,
  };
}
