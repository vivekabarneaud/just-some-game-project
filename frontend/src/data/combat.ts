// ─── Combat Simulation Engine ───────────────────────────────────
// Round-based combat for missions with encounters.
// Adventurers fight enemies using stats; produces a combat log.

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
  class?: AdventurerClass;
}

export interface CombatLogEntry {
  round: number;
  attackerName: string;
  attackerIcon: string;
  targetName: string;
  damage: number;
  dodged: boolean;
  killed: boolean;
  healed?: boolean;
  healAmount?: number;
  isEnemy: boolean; // true if attacker is an enemy
}

export interface CombatResult {
  victory: boolean;
  rounds: number;
  log: CombatLogEntry[];
  performanceRatio: number; // 0-1, how well the team did (modifies death chance)
  survivingEnemies: number;
  totalEnemies: number;
}

// ─── Helpers ────────────────────────────────────────────────────

const PRIMARY_STAT: Record<AdventurerClass, "str" | "dex" | "int"> = {
  warrior: "str",
  archer: "dex",
  assassin: "dex",
  wizard: "int",
  priest: "int",
};

function getPrimaryStat(unit: CombatUnit): number {
  if (!unit.class) return Math.max(unit.str, unit.dex, unit.int); // enemies use highest
  return unit[PRIMARY_STAT[unit.class]];
}

function calcDamage(attacker: CombatUnit): number {
  const base = getPrimaryStat(attacker);
  // 70-130% randomness
  return Math.max(1, Math.floor(base * (0.7 + Math.random() * 0.6)));
}

function calcDodgeChance(defender: CombatUnit): number {
  return Math.min(30, defender.dex * 1.5); // max 30% dodge
}

function pickTarget(units: CombatUnit[]): CombatUnit | null {
  const alive = units.filter((u) => u.hp > 0);
  if (alive.length === 0) return null;
  return alive[Math.floor(Math.random() * alive.length)];
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
    class: adv.class,
  };
}

function buildEnemyUnits(encounters: MissionEncounter[]): CombatUnit[] {
  const units: CombatUnit[] = [];
  for (const enc of encounters) {
    const def = getEnemy(enc.enemyId);
    if (!def) continue;
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

    // Priest healing phase — priests heal the most wounded ally before attacking
    for (const adv of aliveAdvs) {
      if (adv.class === "priest" && aliveAdvs.length > 1) {
        const wounded = aliveAdvs
          .filter((a) => a.id !== adv.id && a.hp < a.maxHp)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        if (wounded.length > 0) {
          const healAmount = Math.floor(adv.int * 0.6 * (0.8 + Math.random() * 0.4));
          if (healAmount > 0) {
            const target = wounded[0];
            target.hp = Math.min(target.maxHp, target.hp + healAmount);
            log.push({
              round,
              attackerName: adv.name,
              attackerIcon: "💚",
              targetName: target.name,
              damage: 0,
              dodged: false,
              killed: false,
              healed: true,
              healAmount,
              isEnemy: false,
            });
            continue; // priest heals instead of attacking
          }
        }
      }
    }

    // Adventurers attack enemies
    for (const adv of aliveAdvs) {
      if (adv.class === "priest" && log.some((l) => l.round === round && l.attackerName === adv.name && l.healed)) {
        continue; // priest already healed this round
      }
      const target = pickTarget(enemies);
      if (!target) break;

      const dodge = Math.random() * 100 < calcDodgeChance(target);
      if (dodge) {
        log.push({
          round,
          attackerName: adv.name,
          attackerIcon: "⚔️",
          targetName: target.name,
          damage: 0,
          dodged: true,
          killed: false,
          isEnemy: false,
        });
        continue;
      }

      let damage = calcDamage(adv);
      // Assassin crit: 20% chance for 1.5x damage
      if (adv.class === "assassin" && Math.random() < 0.2) {
        damage = Math.floor(damage * 1.5);
      }
      target.hp -= damage;
      const killed = target.hp <= 0;
      log.push({
        round,
        attackerName: adv.name,
        attackerIcon: "⚔️",
        targetName: target.name,
        damage,
        dodged: false,
        killed,
        isEnemy: false,
      });
    }

    // Check if enemies are all dead
    if (enemies.filter((u) => u.hp > 0).length === 0) break;

    // Enemies attack adventurers
    for (const enemy of enemies.filter((u) => u.hp > 0)) {
      const target = pickTarget(adventurers);
      if (!target) break;

      const dodge = Math.random() * 100 < calcDodgeChance(target);
      if (dodge) {
        log.push({
          round,
          attackerName: enemy.name,
          attackerIcon: enemy.icon,
          targetName: target.name,
          damage: 0,
          dodged: true,
          killed: false,
          isEnemy: true,
        });
        continue;
      }

      const damage = calcDamage(enemy);
      target.hp -= damage;
      const killed = target.hp <= 0;
      log.push({
        round,
        attackerName: enemy.name,
        attackerIcon: enemy.icon,
        targetName: target.name,
        damage,
        dodged: false,
        killed,
        isEnemy: true,
      });
    }

    // Check if adventurers are all down
    if (adventurers.filter((u) => u.hp > 0).length === 0) break;
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

  // Performance ratio: how well the team did (affects death chance on loss)
  // 1.0 = barely lost (most enemies dead), 0.0 = crushed
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
