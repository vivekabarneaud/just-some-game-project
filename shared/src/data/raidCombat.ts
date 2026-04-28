// ─── Raid combat simulation ─────────────────────────────────────
// Concentric-ring siege resolved as a series of per-ring fights:
// raiders attack the active wall; tower archers fire each round;
// barracks soldiers engage when the wall breaches. Surviving raiders
// carry their HP into the next ring inward.
//
// Reuses the mission combat primitives — same CombatUnit shape,
// damage formula, and CombatLogEntry — so the existing playback UI
// renders raid combat without modification.
//
// Pure addition for v1: callers don't yet wire this into the raid
// lifecycle (commit 6 will swap resolveRaid over to consume this).

import type { MissionEncounter } from "./missions/index.js";
import type { CombatLogEntry, CombatUnit } from "./combat/types.js";
import { setCombatSeed, combatRandom } from "./combat/prng.js";
import { calcDamageResult } from "./combat/damage.js";
import { getDodgeChance } from "./combat/stats.js";
import { buildEnemyUnits } from "./combat/units.js";

export type DefenseRing = "outer" | "middle" | "inner";

const RING_ORDER: DefenseRing[] = ["outer", "middle", "inner"];
const RING_LABEL: Record<DefenseRing, string> = {
  outer: "Outer",
  middle: "Middle",
  inner: "Inner",
};

const MAX_ROUNDS_PER_RING = 30;
const WALL_BASE_HP = 100;

// ─── Inputs ─────────────────────────────────────────────────────

export interface RaidWallInput {
  ring: DefenseRing;
  level: number;
  hp: number;     // current hp (post-prior-damage)
  maxHp: number;
}
export interface RaidWatchtowerInput {
  ring: DefenseRing;
  level: number;
  damaged: boolean;
}
export interface RaidBarracksInput {
  ring: DefenseRing;
  level: number;
  damaged: boolean;
}

export interface RaidCombatInput {
  raidId: string;
  encounters: MissionEncounter[];
  walls: RaidWallInput[];
  watchtowers: RaidWatchtowerInput[];
  barracks: RaidBarracksInput[];
  /** Stationed archer pool. Allocated outer→inner by tower level until exhausted. */
  totalArchers: number;
  /** Stationed soldier pool. Allocated outer→inner by barracks level until exhausted. */
  totalSoldiers: number;
  seed?: number;
}

export interface RaidCombatResult {
  /** True = defenders held (raiders all dead). */
  victory: boolean;
  rounds: number;
  log: CombatLogEntry[];
  /** Final wall HP per ring, in outer→inner order. Walls breached during the
   *  fight come back at hp 0. Walls untouched (because the raid never reached
   *  them) keep their incoming hp. */
  wallFinalHp: { ring: DefenseRing; hp: number }[];
  /** Towers/barracks marked damaged when ≥half their staff died. */
  damagedTowerRings: DefenseRing[];
  damagedBarracksRings: DefenseRing[];
  /** Citizens lost — soldiers and archers come from the population. */
  archersLost: number;
  soldiersLost: number;
  raidersKilled: number;
  raidersAlive: number;
}

// ─── Defender unit construction ─────────────────────────────────

function buildWallUnit(ring: DefenseRing, level: number, currentHp: number): CombatUnit {
  // Walls absorb damage with high gearDefense rather than high VIT.
  // VIT here is purely cosmetic — HP is pegged to currentHp/maxHp.
  return {
    id: `wall_${ring}`,
    name: `${RING_LABEL[ring]} Wall`,
    icon: "🧱",
    isEnemy: false,
    hp: currentHp,
    maxHp: WALL_BASE_HP * level,
    str: 0, dex: 0, int: 0,
    vit: Math.max(1, level * 5),
    wis: 0,
    isMagical: false,
    gearDefense: 30 + 8 * level,
    cooldowns: {}, slowed: 0, poisonTicks: [],
  };
}

function buildArcherUnit(ring: DefenseRing, idx: number): CombatUnit {
  const hp = 24;
  return {
    id: `archer_${ring}_${idx}`,
    name: `${RING_LABEL[ring]} Tower Archer`,
    icon: "🏹",
    isEnemy: false,
    hp, maxHp: hp,
    str: 4, dex: 7, int: 0, vit: 3, wis: 2,
    class: "archer",
    isMagical: false,
    gearDefense: 8,
    cooldowns: {}, slowed: 0, poisonTicks: [],
  };
}

function buildSoldierUnit(ring: DefenseRing, idx: number): CombatUnit {
  const hp = 32;
  return {
    id: `soldier_${ring}_${idx}`,
    name: `${RING_LABEL[ring]} Guard`,
    icon: "⚔️",
    isEnemy: false,
    hp, maxHp: hp,
    str: 7, dex: 4, int: 0, vit: 4, wis: 2,
    class: "warrior",
    isMagical: false,
    gearDefense: 14,
    cooldowns: {}, slowed: 0, poisonTicks: [],
  };
}

// ─── Per-ring allocation ────────────────────────────────────────

/** Fill outer ring first, then middle, then inner. Each ring gets up to its
 *  capacity (tower-level for archers, barracks-level × 3 for soldiers). */
function allocatePerRing(
  totalPool: number,
  ringCapacities: Record<DefenseRing, number>,
): Record<DefenseRing, number> {
  const out: Record<DefenseRing, number> = { outer: 0, middle: 0, inner: 0 };
  let remaining = totalPool;
  for (const ring of RING_ORDER) {
    const take = Math.min(remaining, ringCapacities[ring]);
    out[ring] = take;
    remaining -= take;
    if (remaining <= 0) break;
  }
  return out;
}

// ─── Combat helpers ─────────────────────────────────────────────

function aliveAttackers(units: CombatUnit[]): CombatUnit[] {
  return units.filter((u) => u.hp > 0 && u.str > 0);
}

function aliveTargets(units: CombatUnit[]): CombatUnit[] {
  return units.filter((u) => u.hp > 0);
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(combatRandom() * arr.length)];
}

/** Resolves a single attack and pushes a CombatLogEntry. */
function attack(
  attacker: CombatUnit,
  target: CombatUnit,
  round: number,
  log: CombatLogEntry[],
  abilityName?: string,
  abilityIcon?: string,
): void {
  const dodgeRoll = combatRandom() * 100;
  const dodgeChance = target.str > 0 ? getDodgeChance(target) : 0; // walls don't dodge
  const dodged = dodgeRoll < dodgeChance;

  if (dodged) {
    log.push({
      round,
      attackerName: attacker.name,
      attackerIcon: attacker.icon,
      targetName: target.name,
      damage: 0,
      dodged: true,
      crit: false,
      killed: false,
      targetHp: target.hp,
      targetMaxHp: target.maxHp,
      isEnemy: attacker.isEnemy,
      abilityName,
      abilityIcon,
    });
    return;
  }

  const result = calcDamageResult(attacker, target);
  target.hp = Math.max(0, target.hp - result.damage);
  const killed = target.hp <= 0;

  log.push({
    round,
    attackerName: attacker.name,
    attackerIcon: attacker.icon,
    targetName: target.name,
    damage: result.damage,
    rawDamage: result.rawDamage,
    dodged: false,
    crit: result.crit,
    killed,
    targetHp: target.hp,
    targetMaxHp: target.maxHp,
    isEnemy: attacker.isEnemy,
    abilityName,
    abilityIcon,
  });
}

// ─── Main entry ─────────────────────────────────────────────────

export function simulateRaidCombat(input: RaidCombatInput): RaidCombatResult {
  setCombatSeed(input.seed);

  // ── Build raiders ─────────────────────────────────────────────
  const raiders = buildEnemyUnits(input.encounters);

  // ── Allocate archers/soldiers per ring, outer-first ───────────
  const towerByRing: Record<DefenseRing, RaidWatchtowerInput | undefined> = {
    outer: input.watchtowers.find((t) => t.ring === "outer"),
    middle: input.watchtowers.find((t) => t.ring === "middle"),
    inner: input.watchtowers.find((t) => t.ring === "inner"),
  };
  const barracksByRing: Record<DefenseRing, RaidBarracksInput | undefined> = {
    outer: input.barracks.find((b) => b.ring === "outer"),
    middle: input.barracks.find((b) => b.ring === "middle"),
    inner: input.barracks.find((b) => b.ring === "inner"),
  };
  const archerCapByRing: Record<DefenseRing, number> = {
    outer: towerByRing.outer && !towerByRing.outer.damaged ? towerByRing.outer.level : 0,
    middle: towerByRing.middle && !towerByRing.middle.damaged ? towerByRing.middle.level : 0,
    inner: towerByRing.inner && !towerByRing.inner.damaged ? towerByRing.inner.level : 0,
  };
  const soldierCapByRing: Record<DefenseRing, number> = {
    outer: barracksByRing.outer && !barracksByRing.outer.damaged ? barracksByRing.outer.level * 3 : 0,
    middle: barracksByRing.middle && !barracksByRing.middle.damaged ? barracksByRing.middle.level * 3 : 0,
    inner: barracksByRing.inner && !barracksByRing.inner.damaged ? barracksByRing.inner.level * 3 : 0,
  };
  const archersPerRing = allocatePerRing(input.totalArchers, archerCapByRing);
  const soldiersPerRing = allocatePerRing(input.totalSoldiers, soldierCapByRing);

  // ── Build per-ring defender rosters up front ──────────────────
  const archersByRing: Record<DefenseRing, CombatUnit[]> = { outer: [], middle: [], inner: [] };
  const soldiersByRing: Record<DefenseRing, CombatUnit[]> = { outer: [], middle: [], inner: [] };
  const wallByRing: Record<DefenseRing, CombatUnit | undefined> = { outer: undefined, middle: undefined, inner: undefined };

  for (const ring of RING_ORDER) {
    for (let i = 0; i < archersPerRing[ring]; i++) {
      archersByRing[ring].push(buildArcherUnit(ring, i));
    }
    for (let i = 0; i < soldiersPerRing[ring]; i++) {
      soldiersByRing[ring].push(buildSoldierUnit(ring, i));
    }
    const wallInput = input.walls.find((w) => w.ring === ring);
    if (wallInput && wallInput.level > 0 && wallInput.hp > 0) {
      wallByRing[ring] = buildWallUnit(ring, wallInput.level, wallInput.hp);
    }
  }

  // ── Run the siege, ring by ring ──────────────────────────────
  const log: CombatLogEntry[] = [];
  let round = 0;

  for (const ring of RING_ORDER) {
    if (raiders.every((r) => r.hp <= 0)) break;

    const wall = wallByRing[ring];
    const archers = archersByRing[ring];
    const soldiers = soldiersByRing[ring];

    // Ring with no defenders at all? Skip — raid walks through.
    if (!wall && archers.length === 0 && soldiers.length === 0) continue;

    let ringRound = 0;
    while (ringRound < MAX_ROUNDS_PER_RING) {
      round++;
      ringRound++;

      // 1. Archers fire (this ring only)
      for (const archer of archers) {
        if (archer.hp <= 0) continue;
        const target = pickRandom(aliveTargets(raiders));
        if (!target) break;
        attack(archer, target, round, log);
      }
      if (raiders.every((r) => r.hp <= 0)) break;

      // 2. Raiders attack — wall first, then soldiers when wall down
      const livingRaiders = aliveAttackers(raiders);
      const wallStanding = wall && wall.hp > 0;
      for (const raider of livingRaiders) {
        if (wallStanding) {
          attack(raider, wall, round, log);
          if (wall.hp <= 0) break; // wall falls mid-round → remaining raiders go next round
        } else {
          // Wall already down — pick a soldier (or archer if no soldiers)
          const meleeTargets = aliveTargets(soldiers);
          const fallback = aliveTargets(archers);
          const pool = meleeTargets.length > 0 ? meleeTargets : fallback;
          const target = pickRandom(pool);
          if (!target) break;
          attack(raider, target, round, log);
        }
      }

      // 3. Soldiers melee (only when wall is down)
      if (wall && wall.hp <= 0) {
        for (const soldier of soldiers) {
          if (soldier.hp <= 0) continue;
          const target = pickRandom(aliveTargets(raiders));
          if (!target) break;
          attack(soldier, target, round, log);
        }
      } else if (!wall) {
        // No wall ever existed in this ring — soldiers engage immediately
        for (const soldier of soldiers) {
          if (soldier.hp <= 0) continue;
          const target = pickRandom(aliveTargets(raiders));
          if (!target) break;
          attack(soldier, target, round, log);
        }
      }

      // 4. End conditions for this ring
      if (raiders.every((r) => r.hp <= 0)) break; // siege over
      const wallDown = !wall || wall.hp <= 0;
      const soldiersGone = soldiers.every((s) => s.hp <= 0);
      if (wallDown && soldiersGone) break; // ring breached, raid pushes inward
    }

    // Record final wall HP for this ring (if it had a wall)
    if (wall) {
      const wallInput = input.walls.find((w) => w.ring === ring);
      if (wallInput) wallInput.hp = wall.hp; // mutate for output assembly below
    }
  }

  setCombatSeed(undefined);

  // ── Assemble result ──────────────────────────────────────────
  const raidersAlive = raiders.filter((r) => r.hp > 0).length;
  const raidersKilled = raiders.length - raidersAlive;
  const victory = raidersAlive === 0;

  const wallFinalHp = input.walls.map((w) => ({ ring: w.ring, hp: w.hp }));

  // Damage flag: ≥half the staffed archers/soldiers fell at this ring
  const damagedTowerRings: DefenseRing[] = [];
  const damagedBarracksRings: DefenseRing[] = [];
  let archersLost = 0;
  let soldiersLost = 0;
  for (const ring of RING_ORDER) {
    const archerLossCount = archersByRing[ring].filter((a) => a.hp <= 0).length;
    const soldierLossCount = soldiersByRing[ring].filter((s) => s.hp <= 0).length;
    archersLost += archerLossCount;
    soldiersLost += soldierLossCount;
    const archerStart = archersByRing[ring].length;
    const soldierStart = soldiersByRing[ring].length;
    if (archerStart > 0 && archerLossCount * 2 >= archerStart) damagedTowerRings.push(ring);
    if (soldierStart > 0 && soldierLossCount * 2 >= soldierStart) damagedBarracksRings.push(ring);
  }

  return {
    victory,
    rounds: round,
    log,
    wallFinalHp,
    damagedTowerRings,
    damagedBarracksRings,
    archersLost,
    soldiersLost,
    raidersKilled,
    raidersAlive,
  };
}
