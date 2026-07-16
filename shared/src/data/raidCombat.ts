// ─── Raid combat simulation ─────────────────────────────────────
// Concentric-ring siege resolved as a series of per-ring fights:
// raiders attack the active wall; tower archers fire each round;
// barracks soldiers engage when the wall breaches. Surviving raiders
// carry their HP into the next ring inward.
//
// Per-ring archer/soldier rosters are STACKS — one CombatUnit per
// ring representing N soldiers. HP is pooled (headcount × hpPerUnit);
// outgoing damage scales with the squad's current HP fraction. This
// keeps the sim fast even at city-tier scale (60+ archers per ring),
// and post-combat casualties = floor((maxHp - finalHp) / hpPerUnit).
//
// Reuses the mission combat primitives — same CombatUnit shape,
// damage formula, and CombatLogEntry — so the existing playback UI
// renders raid combat without modification.

import type { MissionEncounter } from "./missions/index.js";
import type { CombatLogEntry, CombatUnit } from "./combat/types.js";
import { setCombatSeed, combatRandom } from "./combat/prng.js";
import { calcDamageResult } from "./combat/damage.js";
import { getDodgeChance, derivedDamageRange } from "./combat/stats.js";
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

/** HP per individual soldier in a stack at training level 0 — drives pooled
 *  HP at start AND surviving-headcount derivation post-combat. Tune during
 *  playtest. */
const ARCHER_HP_PER_UNIT_BASE = 28;
const SOLDIER_HP_PER_UNIT_BASE = 36;
/** Militia are untrained villagers — pitchforks and kitchen knives. Roughly
 *  half a soldier's effectiveness, no training scaling. */
const MILITIA_HP_PER_UNIT = 14;
/** Per-trained-level multipliers applied on top of the base. */
const TRAINING_HP_MULT_PER_LEVEL = 0.25;
const TRAINING_ATK_MULT_PER_LEVEL = 0.20;

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
  /** Archers stationed in this tower (from PlayerWatchtower.garrison.count). */
  archerCount: number;
  /** Collective training level — scales squad HP and attack stat. Default 0. */
  trainedLevel?: number;
}
export interface RaidBarracksInput {
  ring: DefenseRing;
  level: number;
  damaged: boolean;
  /** Soldiers stationed in this barracks (from PlayerBarracks.garrison.count). */
  soldierCount: number;
  /** Collective training level — scales squad HP and attack stat. Default 0. */
  trainedLevel?: number;
}

export interface RaidCombatInput {
  raidId: string;
  encounters: MissionEncounter[];
  walls: RaidWallInput[];
  watchtowers: RaidWatchtowerInput[];
  barracks: RaidBarracksInput[];
  /** Uncommitted adult citizens who grab pitchforks when a raid lands.
   *  Spawned as a militia stack at the outer ring. Weak (~half a soldier's
   *  effectiveness, no training), but enough to make the early-game
   *  walls-only player not completely defenseless. */
  militiaCount?: number;
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
  /** Per-ring casualty deltas — engine writes these back to each garrison.count. */
  archerCasualtiesByRing: { ring: DefenseRing; lost: number }[];
  soldierCasualtiesByRing: { ring: DefenseRing; lost: number }[];
  /** Aggregate citizen losses (sum of per-ring casualties). Engine decrements
   *  state.archers / state.soldiers / state.population by these. */
  archersLost: number;
  soldiersLost: number;
  /** Adults who grabbed pitchforks and died. Engine reduces citizens.adults
   *  by this, respecting FOUNDER_FLOOR. */
  militiaLost: number;
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
    kind: "entity",
    isEnemy: false,
    hp: currentHp,
    maxHp: WALL_BASE_HP * level,
    str: 0, dex: 0, int: 0,
    vit: Math.max(1, level * 5),
    wis: 0,
    isMagical: false,
    gearDefense: 30 + 8 * level,
    dmgMin: 1, dmgMax: 1, // a wall doesn't strike
    canAct: true, canBeHealed: false, isTauntable: false,
    threatMultiplier: 0,
    cooldowns: {}, slowed: 0, poisonTicks: [],
  };
}

/** Stack of N archers stationed in a watchtower. One CombatUnit per ring;
 *  HP pooled across the squad. Stats are per-individual archer baseline —
 *  dodge / crit feel right for one shooter — and the headcount field on the
 *  unit makes calcDamageResult scale outgoing damage to the squad's size.
 *  trainedLevel layers HP and attack stat multipliers on top. */
function buildArcherStack(ring: DefenseRing, count: number, trainedLevel: number): CombatUnit | null {
  if (count <= 0) return null;
  const hpMult = 1 + TRAINING_HP_MULT_PER_LEVEL * trainedLevel;
  const atkMult = 1 + TRAINING_ATK_MULT_PER_LEVEL * trainedLevel;
  const hpPerUnit = Math.floor(ARCHER_HP_PER_UNIT_BASE * hpMult);
  const maxHp = hpPerUnit * count;
  const baseDex = 14;
  const trainTag = trainedLevel > 0 ? ` Lv.${trainedLevel}` : "";
  return {
    id: `archers_${ring}`,
    name: `${RING_LABEL[ring]} Tower Archers${trainTag} (${count})`,
    icon: "🏹",
    kind: "ally",
    isEnemy: false,
    hp: maxHp, maxHp,
    str: 5, dex: Math.floor(baseDex * atkMult), int: 0, vit: 3, wis: 2,
    class: "archer",
    isMagical: false,
    gearDefense: 8,
    ...(() => { const r = derivedDamageRange(Math.floor(baseDex * atkMult)); return { dmgMin: r.min, dmgMax: r.max }; })(),
    canAct: true, canBeHealed: true, isTauntable: false,
    threatMultiplier: 1.0,
    headcount: count,
    hpPerUnit,
    cooldowns: {}, slowed: 0, poisonTicks: [],
  };
}

/** Untrained-citizen stack — adults with pitchforks at the outer wall.
 *  Half a soldier's HP, half its strength, very little armor, lower threat
 *  multiplier so raiders don't preferentially target them. */
function buildMilitiaStack(count: number): CombatUnit | null {
  if (count <= 0) return null;
  const hpPerUnit = MILITIA_HP_PER_UNIT;
  const maxHp = hpPerUnit * count;
  return {
    id: `militia_outer`,
    name: `Townsfolk Militia (${count})`,
    icon: "🍞",
    kind: "ally",
    isEnemy: false,
    hp: maxHp, maxHp,
    str: 7, dex: 4, int: 0, vit: 2, wis: 0,
    class: "warrior",
    isMagical: false,
    gearDefense: 4,
    ...(() => { const r = derivedDamageRange(7); return { dmgMin: r.min, dmgMax: r.max }; })(),
    canAct: true, canBeHealed: true, isTauntable: false,
    threatMultiplier: 0.6,
    headcount: count,
    hpPerUnit,
    cooldowns: {}, slowed: 0, poisonTicks: [],
  };
}

function buildSoldierStack(ring: DefenseRing, count: number, trainedLevel: number): CombatUnit | null {
  if (count <= 0) return null;
  const hpMult = 1 + TRAINING_HP_MULT_PER_LEVEL * trainedLevel;
  const atkMult = 1 + TRAINING_ATK_MULT_PER_LEVEL * trainedLevel;
  const hpPerUnit = Math.floor(SOLDIER_HP_PER_UNIT_BASE * hpMult);
  const maxHp = hpPerUnit * count;
  const baseStr = 14;
  const trainTag = trainedLevel > 0 ? ` Lv.${trainedLevel}` : "";
  return {
    id: `soldiers_${ring}`,
    name: `${RING_LABEL[ring]} Guards${trainTag} (${count})`,
    icon: "⚔️",
    kind: "ally",
    isEnemy: false,
    hp: maxHp, maxHp,
    str: Math.floor(baseStr * atkMult), dex: 5, int: 0, vit: 4, wis: 2,
    class: "warrior",
    isMagical: false,
    gearDefense: 14,
    ...(() => { const r = derivedDamageRange(Math.floor(baseStr * atkMult)); return { dmgMin: r.min, dmgMax: r.max }; })(),
    canAct: true, canBeHealed: true, isTauntable: false,
    threatMultiplier: 1.0,
    headcount: count,
    hpPerUnit,
    cooldowns: {}, slowed: 0, poisonTicks: [],
  };
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

/** Survivors of a stack at end of combat. floor(currentHp / hpPerUnit) — any
 *  partial-soldier residue counts as wounded but not killed. */
function surviversOfStack(stack: CombatUnit | null): number {
  if (!stack || !stack.hpPerUnit || stack.hp <= 0) return 0;
  return Math.floor(stack.hp / stack.hpPerUnit);
}

// ─── Main entry ─────────────────────────────────────────────────

export function simulateRaidCombat(input: RaidCombatInput): RaidCombatResult {
  setCombatSeed(input.seed);

  // ── Build raiders ─────────────────────────────────────────────
  const raiders = buildEnemyUnits(input.encounters);

  // ── Build per-ring defender stacks (one stack per ring, gated on
  //    the building being built and undamaged) ────────────────────
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

  const archerStackByRing: Record<DefenseRing, CombatUnit | null> = { outer: null, middle: null, inner: null };
  const soldierStackByRing: Record<DefenseRing, CombatUnit | null> = { outer: null, middle: null, inner: null };
  const wallByRing: Record<DefenseRing, CombatUnit | undefined> = { outer: undefined, middle: undefined, inner: undefined };
  // Original headcount per ring (immutable). Casualties = original − survivors.
  const archerStartCount: Record<DefenseRing, number> = { outer: 0, middle: 0, inner: 0 };
  const soldierStartCount: Record<DefenseRing, number> = { outer: 0, middle: 0, inner: 0 };
  // Militia — outer ring only, one squad regardless of how many rings exist.
  const militiaStartCount = input.militiaCount ?? 0;
  const militiaStack: CombatUnit | null = buildMilitiaStack(militiaStartCount);

  for (const ring of RING_ORDER) {
    const tower = towerByRing[ring];
    if (tower && !tower.damaged && tower.archerCount > 0) {
      archerStackByRing[ring] = buildArcherStack(ring, tower.archerCount, tower.trainedLevel ?? 0);
      archerStartCount[ring] = tower.archerCount;
    }
    const bar = barracksByRing[ring];
    if (bar && !bar.damaged && bar.soldierCount > 0) {
      soldierStackByRing[ring] = buildSoldierStack(ring, bar.soldierCount, bar.trainedLevel ?? 0);
      soldierStartCount[ring] = bar.soldierCount;
    }
    const wallInput = input.walls.find((w) => w.ring === ring);
    if (wallInput && wallInput.level > 0 && wallInput.hp > 0) {
      wallByRing[ring] = buildWallUnit(ring, wallInput.level, wallInput.hp);
    }
  }

  // ── Run the siege, ring by ring ──────────────────────────────
  const log: CombatLogEntry[] = [];
  let round = 0;
  // Walls untouched by the sim (because the raid never reached them) keep
  // their incoming HP. Filled in as each ring's combat resolves.
  const wallFinalHpByRing: Record<DefenseRing, number | undefined> = { outer: undefined, middle: undefined, inner: undefined };

  for (const ring of RING_ORDER) {
    if (raiders.every((r) => r.hp <= 0)) break;

    const wall = wallByRing[ring];
    const archers = archerStackByRing[ring];
    const soldiers = soldierStackByRing[ring];
    // Militia spawns only at the outer ring.
    const militia = ring === "outer" ? militiaStack : null;

    // Ring with no defenders at all? Skip — raid walks through.
    if (!wall && !archers && !soldiers && !militia) continue;

    let ringRound = 0;
    while (ringRound < MAX_ROUNDS_PER_RING) {
      round++;
      ringRound++;

      // 1. Archer stack fires (this ring only). One attack from the squad
      //    per round; calcDamageResult scales the damage by the stack's
      //    current effective headcount.
      if (archers && archers.hp > 0) {
        const target = pickRandom(aliveTargets(raiders));
        if (target) attack(archers, target, round, log);
      }
      if (raiders.every((r) => r.hp <= 0)) break;

      // 2. Raiders attack — wall first, then defenders when wall down
      const livingRaiders = aliveAttackers(raiders);
      const wallStanding = wall && wall.hp > 0;
      for (const raider of livingRaiders) {
        if (wallStanding) {
          attack(raider, wall, round, log);
          if (wall.hp <= 0) break; // wall falls mid-round → remaining raiders go next round
        } else {
          // Wall down — soldiers first, then militia, archers last (they
          // shoot from broken walls). Threat-multiplier on militia (0.6)
          // doesn't change targeting here — it's a uniform pick — but it
          // matters for the future taunt/threat features.
          const meleeAlive = soldiers && soldiers.hp > 0 ? soldiers : null;
          const militiaAlive = militia && militia.hp > 0 ? militia : null;
          const archerAlive = archers && archers.hp > 0 ? archers : null;
          const target = meleeAlive ?? militiaAlive ?? archerAlive;
          if (!target) break;
          attack(raider, target, round, log);
        }
      }

      // 3. Soldier stack melees (only when wall is down or never existed)
      const wallDown = !wall || wall.hp <= 0;
      if (wallDown && soldiers && soldiers.hp > 0) {
        const target = pickRandom(aliveTargets(raiders));
        if (target) attack(soldiers, target, round, log);
      }

      // 3b. Militia hands fly when the wall falls. Same gate as soldiers.
      if (wallDown && militia && militia.hp > 0) {
        const target = pickRandom(aliveTargets(raiders));
        if (target) attack(militia, target, round, log);
      }

      // 4. End conditions for this ring
      if (raiders.every((r) => r.hp <= 0)) break;
      const archersGone = !archers || archers.hp <= 0;
      const soldiersGone = !soldiers || soldiers.hp <= 0;
      const militiaGone = !militia || militia.hp <= 0;
      // Ring breached only when nothing remains to defend it. Archers keep
      // firing from a fallen wall as long as the squad still has HP.
      if (wallDown && soldiersGone && archersGone && militiaGone) break;
    }

    // Record final wall HP for this ring (if it had a wall)
    if (wall) wallFinalHpByRing[ring] = wall.hp;
  }

  setCombatSeed(undefined);

  // ── Assemble result ──────────────────────────────────────────
  const raidersAlive = raiders.filter((r) => r.hp > 0).length;
  const raidersKilled = raiders.length - raidersAlive;
  const victory = raidersAlive === 0;

  // Each wall in the input gets a final HP — sim-affected rings reflect
  // combat damage, untouched rings keep their incoming HP.
  const wallFinalHp = input.walls.map((w) => ({
    ring: w.ring,
    hp: wallFinalHpByRing[w.ring] ?? w.hp,
  }));

  // Per-ring casualties = original headcount − survivors derived from final HP.
  // Damage flag: ≥half the staffed troops fell at this ring.
  const damagedTowerRings: DefenseRing[] = [];
  const damagedBarracksRings: DefenseRing[] = [];
  let archersLost = 0;
  let soldiersLost = 0;
  const archerCasualtiesByRing: { ring: DefenseRing; lost: number }[] = [];
  const soldierCasualtiesByRing: { ring: DefenseRing; lost: number }[] = [];
  for (const ring of RING_ORDER) {
    const aStart = archerStartCount[ring];
    const sStart = soldierStartCount[ring];
    const aSurv = surviversOfStack(archerStackByRing[ring]);
    const sSurv = surviversOfStack(soldierStackByRing[ring]);
    const aLost = Math.max(0, aStart - aSurv);
    const sLost = Math.max(0, sStart - sSurv);
    archerCasualtiesByRing.push({ ring, lost: aLost });
    soldierCasualtiesByRing.push({ ring, lost: sLost });
    archersLost += aLost;
    soldiersLost += sLost;
    if (aStart > 0 && aLost * 2 >= aStart) damagedTowerRings.push(ring);
    if (sStart > 0 && sLost * 2 >= sStart) damagedBarracksRings.push(ring);
  }

  const militiaSurvivors = surviversOfStack(militiaStack);
  const militiaLost = Math.max(0, militiaStartCount - militiaSurvivors);

  return {
    victory,
    rounds: round,
    log,
    wallFinalHp,
    damagedTowerRings,
    damagedBarracksRings,
    archerCasualtiesByRing,
    soldierCasualtiesByRing,
    archersLost,
    soldiersLost,
    militiaLost,
    raidersKilled,
    raidersAlive,
  };
}
