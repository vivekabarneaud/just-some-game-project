import type { AdventurerClass } from "../adventurers.js";
import type { EnemyTag, EnemyAbility } from "../enemies.js";
import type { CombatPotionEffect } from "../items/index.js";

/**
 * Per-enemy targeting intelligence — drives how the threat system affects them.
 *   feral    : random target, ignores threat (mindless beasts, low-tier mobs)
 *   tactical : threat-aware scored pick (default — most enemies)
 *   cunning  : prioritize backline (priest > wizard) over threat (smart casters, elites)
 *
 * Boss flag is orthogonal — a feral dragon is fine. AI tier shapes targeting only.
 */
export type AITier = "feral" | "tactical" | "cunning";

/**
 * Resistance to forced-target effects (warrior taunt, future "elite" taunts).
 *   none   : tauntable by anything (default)
 *   normal : ignores generic taunts; only "elite" taunts work (e.g. thorns wall)
 *   all    : nothing forces targeting on this unit (final-boss tier)
 */
export type TauntImmunity = "none" | "normal" | "all";

/**
 * Combatant role. Finer-grained than `isEnemy` — splits the player's side into
 * regular adventurers, scripted NPC allies (Niamh), and entities (walls/wards
 * shipping in a later branch). Enemy is its own side.
 *
 * `isEnemy` stays as the two-side discriminator so existing targeting / round /
 * damage code keeps working untouched. `kind` is additive.
 */
export type CombatKind = "adventurer" | "ally" | "entity" | "enemy";

/** An in-combat actor. Adventurer, NPC ally, entity, or enemy. Mutated during the simulation. */
export interface CombatUnit {
  id: string;
  name: string;
  icon: string;
  kind: CombatKind;
  isEnemy: boolean;
  hp: number;
  maxHp: number;
  str: number;
  dex: number;
  int: number;
  vit: number;
  wis: number;
  class?: AdventurerClass;
  /** Display metadata for the combat stage — stamped when the unit is built from
   *  an adventurer (buildAdventurerUnit). Portrait is the full URL; level is the
   *  adventurer's level. Absent for enemies / entities / anonymous stacks. */
  portrait?: string;
  level?: number;
  /** Authored display-size multiplier for the combat stage (boss → 1.2, a future
   *  pet → <1). Undefined = 1. The stage layers swarm-shrink on top. */
  scale?: number;
  isMagical: boolean;
  gearDefense: number;
  /** This unit's physical auto-attack damage range (weapon for adventurers, the
   *  creature's own bite/claw for enemies, fists as a fallback). The roll in
   *  this range is the BASE, then scaled by the primary stat in calcDamageResult. */
  dmgMin: number;
  dmgMax: number;
  trait?: string;
  /** Adventurer talent ids (for combat hooks — e.g. the wounded-damage penalty
   *  can be bypassed by "unflinching" or inverted by "last_stand"). */
  talents?: string[];
  /** Equipped mainHand weapon family (for weapon-affinity traits like axe mastery). */
  weaponType?: string;
  enemyTags?: EnemyTag[];
  enemyDefId?: string;
  /** Combat-stage formation row ("back" for ranged/casters). Presentational. */
  combatRole?: "front" | "back";
  /** Backref to NPC_ALLIES catalog when kind === "ally". */
  npcId?: string;
  // ── Capabilities (mostly defaults; entities flip these off) ──
  /** False for walls / ward stones — they don't take a turn in initiative order. */
  canAct: boolean;
  /** False for walls — priest heals skip them. Wards may set true ("repair"). */
  canBeHealed: boolean;
  /** True if this unit can have a forced-target effect applied to it (warrior taunt etc.). */
  isTauntable: boolean;
  /** When true, this unit's death immediately fails the mission. */
  isMissionObjective?: boolean;
  // ── AI state ──
  /** Per-unit AI behavior id (resolved to a state machine in ai/registry). Defaults apply when absent. */
  aiBehavior?: string;
  /** Current AI state id within the unit's behavior. Transitions evaluated once per round. */
  aiState?: string;
  /** Targeting tier — drives how threat affects this enemy. Allies/entities don't read this. */
  aiTier?: AITier;
  /** Forced-target resistance for enemies. Allies/entities don't read this. */
  tauntImmunity?: TauntImmunity;
  // ── Threat (WoW-style per-target threat table) ──
  /** For enemies: maps allyId → accumulated threat against that ally. Highest entry
   *  is the preferred target (subject to AI tier rules). Allies leave this empty. */
  threatTable?: Record<string, number>;
  /** For allies: how much threat they generate per point of damage/heal. Default 1.0.
   *  Mission-side (npcAlly.threatMultiplier) overrides per encounter. */
  threatMultiplier?: number;
  // ── Mission-modifier flags (set at setup, refreshed each round start) ──
  /** When true, this enemy's tag-based physical immunity (e.g. ghost) is bypassed
   *  for the duration of a mission modifier. Cleared when the gate condition
   *  (e.g. "while Niamh alive") fails. */
  physicallyPierceable?: boolean;
  // ── Stack/squad representation (raid garrisons) ──
  /** Original headcount this unit represents. When set, the unit is a "stack"
   *  of N soldiers sharing one pooled HP bar (HP = headcount × hpPerUnit).
   *  Outgoing damage scales with current HP fraction so the squad's effective
   *  output drops as casualties pile up. Adventurer units leave this undefined. */
  headcount?: number;
  /** Per-soldier HP used to derive surviving headcount post-combat
   *  (survivors = floor(currentHp / hpPerUnit)). Required when headcount is set. */
  hpPerUnit?: number;
  // ── Retreat / recovery (Model C) ──
  /** Survival reflex spent: a non-overkill lethal blow already left them at 1 HP
   *  once this fight. After that, the next lethal hit downs them for real. */
  reflexUsed?: boolean;
  /** Reeling — out of the fighting line for the rest of combat; can only try to
   *  flee. A heal restores HP (helps survive the run) but does NOT un-break them. */
  broken?: boolean;
  /** Escaped the field alive — removed from targeting + the action order, comes
   *  home wounded. */
  fled?: boolean;
  /** Enemy rout threshold (0-1 of maxHp). When an enemy at/below this breaks and
   *  flees on its turn — set `fled` (survives, off the field) instead of fighting
   *  on. Carried from EnemyDefinition.routsAt. Undefined = fights to the end. */
  routsAt?: number;
  /** This unit's presence upgrades the team's retreat judgment (Morgause). Set at
   *  unit-build time. Command is lost if they fall/flee/break. */
  isCommander?: boolean;
  // ── Status effects / per-round state ──
  cooldowns: Record<string, number>;
  tauntedBy?: string;
  slowed: number;
  poisonTicks: { damage: number; rounds: number; sourceName?: string; sourceIcon?: string; type?: "bleed" | "poison" }[];
  /** Infected with the froth (rabid-boar bite-sickness) this fight. Not a combat
   *  DoT — it's carried home as an Adventurer condition if the unit survives. */
  frothed?: boolean;
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
  /** Stable combatant ids, stamped in a post-pass from the roster snapshot
   *  (names are unique per fight, so the name→id map is 1:1). Let the combat
   *  stage match a log line to its roster bar by id rather than by name. */
  attackerId?: string;
  targetId?: string;
  damage: number;
  rawDamage?: number;
  dodged: boolean;
  crit: boolean;
  killed: boolean;
  /** Set on the killing-blow entry once death rolls have been applied:
   *  true = permanently slain (pantheon entry), false = unconscious only.
   *  Undefined when the death roll hasn't been applied (still in-flight). */
  permanentDeath?: boolean;
  targetHp?: number;
  targetMaxHp?: number;
  healed?: boolean;
  healAmount?: number;
  isEnemy: boolean;
  abilityName?: string;
  abilityIcon?: string;
  targets?: {
    name: string;
    /** Stable id, stamped in the same post-pass as attackerId/targetId. */
    id?: string;
    damage: number;
    killed: boolean;
    hp: number;
    maxHp: number;
    /** Mirrors the top-level permanentDeath flag for AoE casualties. */
    permanentDeath?: boolean;
  }[];
  isPoisonTick?: boolean;
  isTaunt?: boolean;
  isShieldWall?: boolean;
  /** Optional inline note that this hit applied a status effect (bleed/slow/etc).
   *  Rendered as a small italic suffix on the log line. */
  statusApplied?: {
    /** Conventional id: "bleed" | "poison" | "slow" | "debuff:str" | "debuff:dex" | ... */
    type: string;
    rounds: number;
    /** For DoTs (bleed/poison): damage per round */
    perRound?: number;
  };
  /** Retreat/recovery narrative beat (Model C). Interim flat-schema marker until
   *  the combat-log discriminated-union refactor lands; the renderer can special-
   *  case these as highlighted lines. */
  beat?: "broken" | "flee_success" | "flee_fail" | "order_hold" | "order_fallback" | "abandoned";
  /** Human-readable narrative line for a `beat` entry. */
  note?: string;
}

export interface LootResult {
  type: "resource" | "item";
  resource?: string;
  itemId?: string;
  amount: number;
  fromEnemy: string;
}

/** A combatant's state at the START of the fight — the roster the combat-stage
 *  UI lays out (allies left, enemies right) and animates from. Captured before
 *  the sim mutates anyone, so `hp` reflects the true starting HP (a wounded
 *  adventurer opens below maxHp). Log lines drive the HP changes from here. */
export interface CombatantSnapshot {
  id: string;
  name: string;
  icon: string;
  side: "ally" | "enemy";
  /** Finer role than side — for positioning (entities/walls back, heroes front). */
  kind: CombatKind;
  class?: AdventurerClass;
  level?: number;
  /** Starting HP (may be below maxHp for a wounded hero). */
  hp: number;
  maxHp: number;
  /** Full portrait URL for adventurer-kind combatants; absent otherwise. */
  portrait?: string;
  /** Authored display-size multiplier (boss → 1.2). Undefined = 1. */
  scale?: number;
  /** Enemy catalog id (for grouping swarms of the same type on the stage). */
  enemyDefId?: string;
  /** Formation row for enemies ("back" = ranged/caster). Allies derive theirs
   *  from class on the stage. */
  combatRole?: "front" | "back";
}

export interface CombatResult {
  victory: boolean;
  rounds: number;
  log: CombatLogEntry[];
  /** Starting-state roster for the combat stage. Absent on legacy results. */
  roster?: CombatantSnapshot[];
  performanceRatio: number;
  survivingEnemies: number;
  fallenAdventurerIds: string[];
  /** Subset of fallenAdventurerIds that were permanently killed (death roll applied).
   *  The rest are KO'd and recover. Set after the post-combat death roll runs.
   *  Empty when the death roll hasn't been applied (legacy compute-at-completion path). */
  permanentDeaths?: string[];
  /** Subset of fallenAdventurerIds whose permadeath roll was undone by a
   *  priest's Divine Grace. Drives the loot-modal "X was revived" line. */
  revivedAdventurerIds?: string[];
  totalEnemies: number;
  loot: LootResult[];
  /** The player's side broke off (fled / routed) rather than winning or being
   *  wiped. Mission fails, but the escapees come home wounded. */
  retreated?: boolean;
  /** Adventurer ids that escaped the field alive (came home wounded). Distinct
   *  from fallenAdventurerIds (downed, did NOT escape → death-roll candidates). */
  fledAdventurerIds?: string[];
  finalHp?: Record<string, number>;
  finalMaxHp?: Record<string, number>;
  /** Lingering DoTs (bleed/poison) still active on SURVIVING adventurers when
   *  combat ended. Written home as Adventurer.conditions — they block passive
   *  regen until they decay/are treated. Keyed by adventurer id. */
  finalConditions?: Record<string, { type: "bleed" | "poison" | "froth"; remainingRounds: number; perRound?: number; icon?: string }[]>;
  /** Set to the NPC ally id when an isMissionObjective ally fell during combat.
   *  Mission completion treats this as a distinct failure — no rewards, no team
   *  XP, but surviving adventurers still go home (no team-wipe permadeath cascade). */
  vipFallen?: string;
}

/** Context passed to ability handlers and AI state methods. */
export interface CombatContext {
  round: number;
  /** All adventurer units (including fallen). Filter by hp > 0 for alive. */
  adventurers: CombatUnit[];
  /** All enemy units (including fallen). */
  enemies: CombatUnit[];
  log: CombatLogEntry[];
  /** Per-mission combat-rule modifiers active for this fight. Re-evaluated
   *  each round so gate conditions (whileAllyAlive) can flip mid-fight. */
  modifiers?: import("../missions/types.js").MissionModifier[];
  // ── Retreat state (Model C) ──
  /** Set by evaluateRetreat: the team is routing this round (all able units flee). */
  retreating?: boolean;
  /** Set by evaluateRetreat: an active commander (Morgause) is directing, so flees
   *  this round get the coordinated bonus. */
  retreatCoordinated?: boolean;
  /** When true, the whole retreat/reflex layer is off (expeditions, special
   *  missions — lethal by design). */
  disableRetreat?: boolean;
}
