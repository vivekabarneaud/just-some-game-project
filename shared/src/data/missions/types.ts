import type { AdventurerClass } from "../adventurers.js";
import type { EnemyTag } from "../enemies.js";

// ─── Mission types ──────────────────────────────────────────────

export type RewardType = "gold" | "wood" | "stone" | "food" | "astralShards"
  // Typed foods (post-food-refactor missions reward specific items)
  | "wheat" | "barley"
  | "cabbages" | "turnips" | "peas" | "squash" | "fava"
  | "apples" | "pears" | "cherries"
  | "meat" | "eggs" | "milk" | "fish"
  | "berries" | "mushrooms" | "nuts"
  // Herbs
  | "chamomile" | "mugwort" | "nettle" | "nightbloom" | "moonpetal"
  // Exotic goods (caravan/escort drops only, non-growable)
  | "pepper" | "cinnamon" | "tea" | "chili" | "saffron"
  // Crafting materials (also drop via combat loot; can be guaranteed mission rewards too)
  | "wolfhide_strip" | "fang" | "sinew_cord"
  | "thick_pelt" | "bear_claw"
  | "bristlehide" | "tusk_shard"
  | "chitin_plate" | "spinners_bile"
  | "serpent_fang" | "snake_oil"
  | "gnawed_marrow" | "bonewalk_shard";

export interface MissionReward {
  resource: RewardType;
  amount: number;
}

export interface MissionSlot {
  class: AdventurerClass | "any"; // "any" means any class fills it
  required?: boolean; // if true, must be filled with the specified class to deploy
}

export type MissionTag = "combat" | "exploration" | "magical" | "outdoor" | "stealth" | "escort" | "spying" | "assassination" | "dungeon" | "survival";

export interface MissionEncounter {
  enemyId: string;
  count: number;
}

export interface MissionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  slots: MissionSlot[];
  duration: number; // game-seconds
  rewards: MissionReward[];
  deployCost: number; // gold to send the team
  difficulty: 1 | 2 | 3 | 4 | 5;
  minGuildLevel: number;
  tags: MissionTag[];
  image?: string; // optional mission illustration
  encounters?: MissionEncounter[]; // enemies faced during the mission
  guaranteed?: boolean; // always ~98% success regardless of stats
  requires?: MissionRequirements; // conditions for this mission to appear on the board
  /** Locked NPC ally that fights alongside the team (escort / ritual companion / VIP). */
  npcAlly?: MissionNpcAlly;
  /** Per-mission combat-rule modifiers (e.g. physical can hit ghosts during the binding). */
  modifiers?: MissionModifier[];
}

/**
 * Mission-specific NPC ally configuration.
 *
 * The character itself (stats, name, portrait) lives in NPC_ALLIES. This block
 * is the *mission's* layer on top — what makes Niamh-as-ritualist-in-this-mission
 * different from Niamh-as-ranger-in-some-other-mission.
 */
export interface MissionNpcAlly {
  /** ID into NPC_ALLIES (e.g. "niamh") */
  npcId: string;
  /** When true (default), the NPC's death immediately fails the mission, regardless
   *  of whether the team won the fight. Distinct failure path from team wipe. */
  deathFailsMission?: boolean;
  /** When true, the NPC takes no turn — no attacks, no abilities. She still
   *  has HP, can be healed, and counts as a target for enemies. Used for
   *  ritualists / frail VIPs / bound captives. The team's job is to keep her
   *  alive while the rest of the encounter resolves. */
  passive?: boolean;
  /** How much threat this NPC generates per point of damage/heal in combat.
   *  1.0 = same as a regular adventurer. 1.5 = pulls aggro harder. Irrelevant
   *  when passive=true (she doesn't generate damage threat anyway). */
  threatMultiplier?: number;
  /** Pre-loaded threat against enemies matching certain tags, applied at combat
   *  start. The "ritualist draws the ghost in" feel — Niamh starts with +80
   *  threat in every ghost's table on this mission only. */
  baseThreatVsTag?: Partial<Record<EnemyTag, number>>;
  /** Pre-loaded threat against specific enemy IDs (e.g. the named boss). */
  baseThreatVsEnemyId?: Record<string, number>;
}

/**
 * Per-mission combat-rule overrides. Discriminated union so we can extend
 * cleanly: each new modifier type is a new variant + one branch in the
 * applyMissionModifiers function.
 *
 * Currently shipping:
 *   - physical_pierces_tag: lets the party damage tagged enemies (e.g. ghosts)
 *     with physical attacks. Optionally gated to "while a specific NPC ally is
 *     alive" — the ritual binds them; if the ritualist dies, the binding fades.
 */
export type MissionModifier =
  | {
      type: "physical_pierces_tag";
      /** EnemyTag the modifier targets — e.g. "ghost" */
      tag: import("../enemies.js").EnemyTag;
      /** When set, only active while the named NPC ally id is still alive.
       *  Niamh's binding ritual: ghosts are bindable while she's casting,
       *  return to full physical immunity if she falls. */
      whileAllyAlive?: string;
    };

export interface MissionRequirements {
  story?: string;       // story mission ID that must be completed
  building?: string;    // building ID that must be built (level > 0)
  pen?: import("../livestock").AnimalId; // pen animal type that must exist (level > 0)
}

/** Per-adventurer mission supplies: potion (combat), food (mission start buff), recovery (between-event heal). */
export interface AdventurerMissionSupplies {
  potion?: string;    // item ID — combat use
  food?: string;      // item ID — mission start buff
  recovery?: string;  // item ID — bandage / mending potion
}

export interface ActiveMission {
  missionId: string;
  adventurerIds: string[];
  remaining: number; // game-seconds remaining
  successChance: number; // 0-100, locked in at deploy
  /** Per-adventurer supplies: map of adventurerId → { potion?, food?, recovery? } */
  adventurerSupplies?: Record<string, AdventurerMissionSupplies>;
  // ── Expedition-only fields ──────────────────────────────────
  /** Number of events completed so far (expedition only). Determines which event fires next. */
  expeditionEventIndex?: number;
  /** Per-adventurer HP carried between events. Key = advId. Value = current HP. */
  expeditionHp?: Record<string, number>;
  /** Per-adventurer max HP (captured at deploy, used for heal calculations). */
  expeditionMaxHp?: Record<string, number>;
  /** Which event was drawn from each random slot (fixed slots show the same index 0). Snapshot at deploy. */
  expeditionResolvedEvents?: ExpeditionEvent[];
  /** Effective duration at deploy (accounts for wizard reduction). Used to schedule event firings AND
   *  to compute the travel/combat/return phase for non-expedition missions. */
  initialDuration?: number;
  /** Pre-rolled combat result for non-expedition missions with encounters.
   *  Computed at deploy time (Math.random() is consumed up front), used at
   *  completion to avoid re-rolling. Lets the UI know what already happened
   *  mid-mission so the player can watch the playback once past the
   *  combat phase. Old saves without this fall back to compute-at-completion. */
  prerolledCombat?: import("../combat").CombatResult;
  /** True once the player has watched (or skipped) the combat playback for
   *  this mission. Drives the phase from "combat" to "homeward". */
  combatViewed?: boolean;
  /** True if the entire team is fated to permadie in this mission's combat.
   *  When set, the tick zeroes `remaining` once combat resolves (viewed or
   *  capped) — there's no team to make the return trip home. */
  wiped?: boolean;
  /** Death-record map (adventurerId → DeathRecord) computed at deploy time
   *  alongside the prerolled combat. Applied to adventurer state at completion. */
  deathRecords?: Record<string, import("../adventurers").DeathRecord>;
  /** Log of resolved events — displayed in the timeline UI */
  expeditionLog?: ResolvedExpeditionEvent[];
  /** Accumulated rewards from treasure/encounter events (separate from the template's base rewards) */
  expeditionRewards?: MissionReward[];
}

export interface CompletedMission {
  missionId: string;
  success: boolean;
  rewards: MissionReward[]; // actual rewards earned (empty on fail for non-assassin teams)
  casualties: string[]; // adventurer IDs who died
  revived: string[]; // adventurer IDs revived by priests
  xpGained: number;
  levelUps: string[]; // adventurer names that leveled up
  rankUps: { name: string; newRank: string }[]; // adventurers that ranked up
  combatLog?: import("../combat").CombatLogEntry[];
  combatRounds?: number;
  combatVictory?: boolean; // distinct from success — success is the overall mission outcome
  /** Set to the NPC ally id when an isMissionObjective ally fell during combat —
   *  drives the distinct "Warden Niamh fell, the binding could not complete" UI. */
  vipFallen?: string;
}

export interface StoryMission extends MissionTemplate {
  storyOrder: number;
  prerequisite?: string; // ID of previous story mission that must be completed
  chapter: string;
  /** Chronicle entry id fired into the archive on success. The cinematic for
   *  the mission lives in STORY_CINEMATICS keyed by the mission id. */
  chronicleEntryId?: string;
}

// ─── Expeditions ────────────────────────────────────────────────
// Multi-event missions. Events resolve sequentially as the mission ticks.
// See docs/DESIGN_EXPEDITIONS.md for the full design.

export interface CombatEvent {
  kind: "combat";
  encounters: MissionEncounter[];
}

export interface TreasureEvent {
  kind: "treasure";
  rewards: MissionReward[];
  /** Optional skill check to get the treasure (e.g. DEX check to pick a lock) */
  requiresCheck?: { stat: "dex" | "wis" | "int"; dc: number };
}

export interface TrapEvent {
  kind: "trap";
  dcStat: "dex" | "wis" | "int";
  dc: number;
  /** % of max HP dealt to whole party on failed check */
  damagePct: number;
}

export interface EncounterEvent {
  kind: "encounter";
  /** Narrative text shown in the log */
  text: string;
  /** Weighted outcomes — random roll picks one on resolution */
  outcomes: { weight: number; text: string; effect: ExpeditionEffect }[];
}

export interface EnvironmentEvent {
  kind: "environment";
  text: string;
  effect: ExpeditionEffect;
}

export type ExpeditionEvent = CombatEvent | TreasureEvent | TrapEvent | EncounterEvent | EnvironmentEvent;

export type ExpeditionEffect =
  | { type: "heal"; pct: number }
  | { type: "damage"; pct: number }
  | { type: "reward"; rewards: MissionReward[] }
  | { type: "nothing" };

/** An event slot in an expedition — either a fixed event or a weighted pool to draw from. */
export interface ExpeditionEventSlot {
  type: "fixed" | "random";
  event?: ExpeditionEvent;                                        // set when type==="fixed"
  pool?: { event: ExpeditionEvent; weight: number }[];            // set when type==="random"
}

export interface ExpeditionTemplate extends MissionTemplate {
  /** Sequence of event slots. Resolved in order as the mission ticks. */
  events: ExpeditionEventSlot[];
  /** Optional thematic biome label shown on the card (e.g. "Crypt", "Forest", "Dungeon") */
  biome?: string;
}

/** Runtime log of a resolved expedition event — stored on ActiveMission for UI display */
export interface ResolvedExpeditionEvent {
  kind: ExpeditionEvent["kind"];
  /** Short one-line summary (e.g., "Defeated 2 cave spiders", "Found 30 gold", "Triggered a trap") */
  summary: string;
  /** Icon for the timeline dot */
  icon: string;
  success: boolean;
}

/** Type guard — is this mission template an expedition? */
export function isExpedition(m: MissionTemplate | undefined | null): m is ExpeditionTemplate {
  return !!m && Array.isArray((m as ExpeditionTemplate).events);
}

/** Mission travel phase — for non-expedition missions with combat. The trip
 *  splits into outbound travel (first half), an instant combat moment at the
 *  midpoint, and homeward travel (second half). Expeditions have their own
 *  multi-event timeline and don't use this. */
export type MissionPhase = "outbound" | "combat" | "homeward";

/** Compute the current phase from a mission's elapsed time.
 *  - outbound: 0% → 50% elapsed (team traveling to the encounter)
 *  - combat: 50% elapsed → either the player views the playback OR ~2 min cap
 *  - homeward: after combat resolves → 100% elapsed (team returning with loot)
 *
 *  Combat phase is engagement-gated: it persists past the midpoint until the
 *  player engages with the watch button. Capped at 2 game-minutes so an AFK
 *  player still sees the mission progress instead of stalling at "combat" forever.
 *
 *  Returns null when the mission has no prerolled combat (no encounters or old save). */
export function getMissionPhase(am: ActiveMission): MissionPhase | null {
  if (!am.prerolledCombat) return null;
  const total = am.initialDuration;
  if (!total || total <= 0) return null;
  const elapsed = total - am.remaining;
  const halfway = total / 2;
  if (elapsed < halfway) return "outbound";
  if (am.combatViewed) return "homeward";
  // AFK cap: combat phase auto-resolves after 2 minutes of game time.
  const COMBAT_PHASE_MAX_SECONDS = 120;
  if (elapsed - halfway > COMBAT_PHASE_MAX_SECONDS) return "homeward";
  return "combat";
}
