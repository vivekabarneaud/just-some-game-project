import type { AdventurerClass } from "../adventurers.js";

// ─── Mission types ──────────────────────────────────────────────

export type RewardType = "gold" | "wood" | "stone" | "food" | "astralShards"
  // Typed foods (post-food-refactor missions reward specific items)
  | "wheat" | "barley"
  | "cabbages" | "turnips" | "peas" | "squash"
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
}

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
  /** Effective duration at deploy (accounts for wizard reduction). Used to schedule event firings. */
  initialDuration?: number;
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
}

export interface StoryMission extends MissionTemplate {
  storyOrder: number;
  prerequisite?: string; // ID of previous story mission that must be completed
  lore: string; // lore text revealed on completion
  chapter: string;
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
