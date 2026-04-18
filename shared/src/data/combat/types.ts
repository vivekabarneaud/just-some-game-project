import type { AdventurerClass } from "../adventurers.js";
import type { EnemyTag, EnemyAbility } from "../enemies.js";
import type { CombatPotionEffect } from "../items.js";

/** An in-combat actor. Adventurer or enemy. Mutated during the simulation. */
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
  trait?: string;
  enemyTags?: EnemyTag[];
  enemyDefId?: string;
  // ── AI state ──
  /** Per-unit AI behavior id (resolved to a state machine in ai/registry). Defaults apply when absent. */
  aiBehavior?: string;
  /** Current AI state id within the unit's behavior. Transitions evaluated once per round. */
  aiState?: string;
  // ── Status effects / per-round state ──
  cooldowns: Record<string, number>;
  tauntedBy?: string;
  slowed: number;
  poisonTicks: { damage: number; rounds: number }[];
  shieldWallUsed?: boolean;
  enemyAbilities?: EnemyAbility[];
  combatPotion?: CombatPotionEffect;
  potionUsed?: boolean;
  damageBoost?: { pct: number; rounds: number };
  defenseBoost?: { pct: number; rounds: number };
  mindControlled?: number;
  statDebuffs?: { stat: string; pct: number; rounds: number }[];
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
  abilityName?: string;
  abilityIcon?: string;
  targets?: { name: string; damage: number; killed: boolean; hp: number; maxHp: number }[];
  isPoisonTick?: boolean;
  isTaunt?: boolean;
  isShieldWall?: boolean;
}

export interface LootResult {
  type: "resource" | "item";
  resource?: string;
  itemId?: string;
  amount: number;
  fromEnemy: string;
}

export interface CombatResult {
  victory: boolean;
  rounds: number;
  log: CombatLogEntry[];
  performanceRatio: number;
  survivingEnemies: number;
  fallenAdventurerIds: string[];
  totalEnemies: number;
  loot: LootResult[];
  finalHp?: Record<string, number>;
  finalMaxHp?: Record<string, number>;
}

/** Context passed to ability handlers and AI state methods. */
export interface CombatContext {
  round: number;
  /** All adventurer units (including fallen). Filter by hp > 0 for alive. */
  adventurers: CombatUnit[];
  /** All enemy units (including fallen). */
  enemies: CombatUnit[];
  log: CombatLogEntry[];
}
