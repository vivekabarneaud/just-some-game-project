import type { AdventurerClass, AdventurerCondition } from "../adventurers.js";
import type { EnemyTag } from "../enemies.js";
import type { Season } from "../../gameState.js";

// ─── Mission types ──────────────────────────────────────────────

export type RewardType = "gold" | "wood" | "stone" | "water" | "food" | "astralShards"
  // Typed foods (post-food-refactor missions reward specific items)
  | "wheat" | "barley"
  | "cabbages" | "turnips" | "peas" | "squash" | "fava"
  | "apples" | "pears" | "cherries"
  // "meat"/"fish" are aliases (grant the default cut); the specific cuts let a
  // mission reward exactly its quarry (boar hunt → boar, salmon run → salmon).
  | "meat" | "venison" | "boar" | "wisent" | "pork" | "mutton" | "goat" | "chicken" | "wild_fowl" | "rabbit"
  | "eggs" | "milk"
  | "fish" | "trout" | "pike" | "eel" | "salmon"
  | "berries" | "mushrooms" | "nuts" | "honey"
  // Herbs
  | "chamomile" | "mugwort" | "nettle" | "nightbloom" | "moonpetal" | "greymantle" | "fenbalm"
  // Exotic goods (caravan/escort drops only, non-growable)
  | "pepper" | "cinnamon" | "tea" | "chili" | "saffron"
  // Crafting materials (also drop via combat loot; can be guaranteed mission rewards too)
  | "wolfhide_strip" | "fang" | "sinew_cord"
  | "thick_pelt" | "bear_claw"
  | "bristlehide" | "tusk_shard" | "boar_tusk" | "cloven_hoof" | "boar_skull"
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

export type MissionTag = "combat" | "exploration" | "magical" | "outdoor" | "stealth" | "escort" | "spying" | "assassination" | "dungeon" | "survival" | "peaceful";

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
  /** Barter / offering cost: item-or-resource amounts paid ON DEPLOY, in
   *  addition to `deployCost` gold. The player must HAVE them (deploy is
   *  blocked otherwise) and they're consumed when the team sets out. Powers
   *  real trade (bring grain, return with stone), tribute, ritual offerings.
   *  Same {resource, amount} shape as a reward — here it's a cost. */
  deployItems?: MissionReward[];
  /** Premade character ids recruited to the roster when this mission SUCCEEDS
   *  (earned, bypasses the browse cap). Powers quest-unlock characters — you
   *  play their story to gain them. e.g. saving Edmund recruits Edmund + Elspeth. */
  recruitsOnSuccess?: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Optional per-mission override for the BASE permadeath chance (%). When set,
   *  it replaces the difficulty/encounter formula in calcDeathChance (player
   *  mitigations like VIT/priests/potions still apply). Use 0 for missions that
   *  should never risk a permanent death (e.g. a safe herb gather). */
  deathRisk?: number;
  minGuildLevel: number;
  tags: MissionTag[];
  image?: string; // optional mission illustration
  encounters?: MissionEncounter[]; // enemies faced during the mission
  guaranteed?: boolean; // always ~98% success regardless of stats
  /** Success scales with how full the team is: chance = filled slots / total
   *  slots (e.g. 1 of 3 = 33%, 3 of 3 = 100%). For story beats where a full
   *  team should be a guaranteed pass but under-staffing is a real gamble.
   *  Combines with discoveryMission (unbeatable-fight scouts) so completion
   *  rides on headcount, not on winning a fight the team cannot win yet. */
  teamSizeSuccess?: boolean;
  /** Pin this mission to the board whenever eligible (like sideChain missions),
   *  but WITHOUT showing a chain banner — for one-off hooks that should reliably
   *  appear yet read as an ordinary errand (e.g. the bog-witch front). */
  pinned?: boolean;
  /** Discovery mission: the objective is what the team LEARNS, not winning the
   *  fight. The combat still runs (they come home wounded), but a lost fight
   *  still completes the mission, and no one dies (a scripted retreat). Used for
   *  story_3 — the team meets the ghosts, steel does nothing, they barely get the
   *  knowledge home; Niamh's binding is story_4's payoff. */
  discoveryMission?: boolean;
  /** One-time mission. Once completed successfully it never returns to the
   *  board (its id lands in completedUniqueMissionIds). Use for personal /
   *  narrative beats (a rescue, a found keepsake, a neighbour's plea) where
   *  repetition would break immersion. Omit/false = a recurring "chore" that
   *  keeps reappearing (timber, foraging, patrols, livestock threats). */
  unique?: boolean;
  /** Marks this mission as a beat in a side-story chain. Drives the card's
   *  side-story styling (teal frame + the chain's name banner, distinct from
   *  the main story's gold). `id` is internal (never shown — keep it clear and
   *  non-spoilery for our own sake); `name` is the player-facing banner and
   *  must not spoil. Also the hook for any future side-quest log. */
  sideChain?: { id: string; name: string };
  /** Parked placeholder. Still resolvable by getMission() (so saves mid-flight
   *  don't break) but never generated onto the board. Un-stage by reworking the
   *  mission so it fits the world and dropping this flag — or delete it.
   *  (The separate STAGED_MISSIONS holding pen was removed 2026-08-31; parked
   *  missions now just carry this flag inside their own tier file.) */
  staged?: boolean;
  /** Urgent settlement-side response (a spider infestation in the quarry, a
   *  food crisis) — usually forced onto the board from game state. Drives the
   *  card's distinct orange outline + "⚠ At the settlement" banner so the player
   *  can't miss it, and reads apart from story (gold) / side-chain (teal). */
  urgent?: boolean;
  /** Where this mission pins on the world map (the mission board IS the map).
   *  Normalized 0..1 of the full map image, so the pin survives pan/zoom.
   *  Authored by hand per mission. A mission
   *  with no `map` falls to the "Close to home" list beside the map until a
   *  pin is authored. */
  map?: { x: number; y: number };
  /** The mission site's climate, authored (NOT derived from position). Drives
   *  the seasonal debuff that warm/fresh food mitigates. Omit = temperate. */
  climate?: "cold" | "temperate" | "hot";
  /** Named cast who can't be sent on this mission because the fiction has them
   *  elsewhere (e.g. Gareth is at the watchtower sounding the alarm during the
   *  fold raids). Keyed by premadeId; the reason shows greyed in the assembly
   *  panel, so the absence is never a mystery. */
  excludeCharacters?: { premadeId: string; reason: string }[];
  requires?: MissionRequirements; // conditions for this mission to appear on the board
  /** Chronicle entry surfaced when this mission is claimed (on success). Story
   *  missions have always had this; side-chain beats can carry one too. */
  chronicleEntryId?: string;
  /** Locked NPC ally that fights alongside the team (escort / ritual companion / VIP). */
  npcAlly?: MissionNpcAlly;
  /** Per-mission combat-rule modifiers (e.g. physical can hit ghosts during the binding). */
  modifiers?: MissionModifier[];
}

/**
 * Mission-specific NPC ally configuration.
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
  /** When true, this ally can never be downed in THIS mission — clamped at 1 HP.
   *  For beloved companions whose fall is reserved for a scripted beat elsewhere
   *  (Truffle fights the fold escorts but only Greyfang's beat can maul him). */
  cannotFall?: boolean;
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
  buildings?: string[]; // ALL of these building IDs must be built (level > 0)
  tavernReputation?: number; // tavern reputation (0-100) must be at least this — "the haven's name has spread"
  missionCount?: { id: string; count: number }; // a mission must have been completed at least `count` times
  hasClass?: AdventurerClass; // at least one alive adventurer of this class must be on the roster — for missions that NEED a class to be doable (e.g. a priest for ghosts), so they don't tease before that class exists
  pen?: import("../livestock").AnimalId; // pen animal type that must exist (level > 0)
  /** Id of a `unique` mission that must be completed first. Powers the
   *  discovery→routine pattern: a one-time "first" mission unlocks the
   *  recurring "chore" version (checked against completedUniqueMissionIds). */
  missionDone?: string;
  /** A chronicle entry that must have fired. Lets a story-director beat surface
   *  a mission only after its setup has played (e.g. the "Nell's gone
   *  wandering" worry beat opens the search mission). */
  chronicleFired?: string;
  /** Only appears in this season. For seasonal gathers (the spring bee-tree, the
   *  autumn apple tree) that belong to the rhythm of the year rather than a
   *  crisis. Checked against the board context's current season. */
  season?: Season;
}

/** Per-adventurer mission supplies: potion (combat), food (mission start buff), recovery (between-event heal). */
export interface AdventurerMissionSupplies {
  potion?: string;    // item ID — combat use
  food?: string;      // item ID — mission start buff
  recovery?: string;  // item ID — bandage / mending potion
  /** When `potion` is a brewed free-form potion, its effect vector is resolved
   *  here at deploy time so the pure combat sim can apply it (buffs/heal at
   *  combat start). See applySupplies + docs/IDEAS.md (Alchemy). */
  brewEffects?: import("../alchemy/types.js").Effect[];
  /** When `food` is a cooked free-form dish, its mission boons are resolved here
   *  at deploy (a well-fed HP bonus applied at combat start; loyalty on return).
   *  See docs/IDEAS.md (Kitchen) + kitchen/mission.ts. */
  dishBoons?: import("../kitchen/mission.js").DishMissionBoons;
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

/** Per-adventurer before/after outcome for one deployed hero. Drives the loot
 *  modal's team strip: HP drains hpBefore → hpAfter, XP fills xpBefore → xpAfter,
 *  with a level-up flash. Captured at resolution (the live adventurer is mutated
 *  in place, so before-values are snapshotted first). */
export interface MissionRosterEntry {
  id: string;
  name: string;
  portrait?: string;
  advClass: AdventurerClass;
  level: number; // level after the mission
  hpMax: number;
  hpBefore: number;
  hpAfter: number;
  xpBefore: number; // xp within the level at deploy
  xpAfter: number;  // xp within the (possibly new) level after
  leveledUp: boolean;
  died: boolean;
  revived: boolean;
  /** Lingering conditions the hero came home with (bleed/poison/froth). Surfaced
   *  in the loot modal so a regen-blocking wound like the froth isn't missed. */
  conditions?: AdventurerCondition[];
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
  /** Starting-state roster for the combat stage (allies + enemies at t0). */
  combatRoster?: import("../combat").CombatantSnapshot[];
  /** Per-round battlefield positions (unit id → x), for the battlefield stage. */
  combatPositions?: Record<string, number>[];
  combatRounds?: number;
  combatVictory?: boolean; // distinct from success — success is the overall mission outcome
  /** The team broke off and retreated (Model C) rather than being wiped — the
   *  loss reads as "Retreated" + most of the team comes home wounded. */
  retreated?: boolean;
  /** Set to the NPC ally id when an isMissionObjective ally fell during combat —
   *  drives the distinct "Warden Niamh fell, the binding could not complete" UI. */
  vipFallen?: string;
  /** Enemy ids first encountered on THIS mission that were genuine surprises
   *  (not `revealPortrait` foes the settlement already knew). Drives the loot
   *  modal's "New foes faced" reveal — the payoff for the "???" cards. */
  revealedEnemies?: string[];
  /** Per-adventurer before/after vitals for the loot modal's team strip.
   *  Optional: co-op claims and legacy results omit it (strip just hides). */
  roster?: MissionRosterEntry[];
  /** Title of the pure-tracker story quest this mission completes (if any) —
   *  drives the LootModal's "Quest accomplished" acknowledgment. The quest is
   *  auto-completed on claim, so it never shows a "done" click in the log. */
  storyQuestAccomplished?: string;
  /** Enemy drops (resources + items) from combat, kept SEPARATE from `rewards`
   *  (the known, upfront mission pay). These are the surprise the loot chest
   *  reveals, and they're applied on claim, not at mission end. */
  loot?: import("../combat").LootResult[];
}

export interface StoryMission extends MissionTemplate {
  storyOrder: number;
  prerequisite?: string; // ID of previous story mission that must be completed
  /** Optional quest prerequisite — if set, the player must have claimed
   *  this quest's reward before the mission is unlocked. Used when a
   *  story beat is gated by parallel settlement work (e.g. story 13
   *  waits for Watch the Walls to complete, since Rowena's visit happens
   *  via that quest's chronicle). */
  prerequisiteQuest?: string;
  chapter: string;
  /** Chronicle entry id fired into the archive on success. The cinematic for
   *  the mission lives in STORY_CINEMATICS keyed by the mission id. */
  chronicleEntryId?: string;
  /** Additional chronicle entries to fire alongside the primary one on
   *  mission completion. Used for bridge chronicles (breath beats, narrative
   *  follow-ups) that have no other natural trigger. Note: these all fire at
   *  once with the main chronicle; proper pacing/delays is a future feature. */
  additionalChronicleEntryIds?: string[];
  /** Optional expedition fields. When present, the mission also routes through
   *  the expedition engine (multi-event timeline). isExpedition() picks this up
   *  structurally. */
  events?: ExpeditionEventSlot[];
  biome?: string;
}

// ─── Expeditions ────────────────────────────────────────────────
// Multi-event missions. Events resolve sequentially as the mission ticks.

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
  /** Per-round combat log for combat events. Lets the player play back any
   *  expedition fight via the same playback modal used for regular missions.
   *  Empty/missing for non-combat events. */
  combatLog?: import("../combat/types.js").CombatLogEntry[];
  /** Starting-state roster for the combat stage on this expedition fight. */
  combatRoster?: import("../combat/types.js").CombatantSnapshot[];
  /** Per-round battlefield positions for the battlefield stage. */
  combatPositions?: Record<string, number>[];
  /** Combat victory flag — distinct from `success` (treasure/encounter events
   *  use `success` differently). Used by the playback modal banner. */
  combatVictory?: boolean;
  /** True once the player has watched this combat. Drives the red-pulse
   *  release on the active expedition card so it stops drawing attention. */
  combatViewed?: boolean;
}

/** Type guard — is this mission template an expedition? */
export function isExpedition(m: MissionTemplate | undefined | null): m is ExpeditionTemplate {
  return !!m && Array.isArray((m as ExpeditionTemplate).events);
}

/** Mission travel phase. Three states for both regular missions and
 *  expeditions, just computed differently. Expeditions move through these
 *  states event-by-event as their timeline ticks. */
export type MissionPhase = "outbound" | "combat" | "homeward";

/** Compute the current phase from a mission's elapsed time.
 *  Regular missions:
 *  - outbound: 0% → 50% elapsed (team traveling to the encounter)
 *  - combat:   50% elapsed → either the player views the playback OR ~2 min cap
 *  - homeward: after combat resolves → 100% elapsed (team returning with loot)
 *  Combat phase is engagement-gated: it persists past the midpoint until the
 *  player engages with the watch button. Capped at 2 game-minutes so an AFK
 *  player still sees the mission progress instead of stalling at "combat" forever.
 *  Expeditions:
 *  - outbound: no events resolved yet, OR most recent event was non-combat
 *  - combat:   most recent resolved event is a combat event, AND the player
 *              hasn't viewed its playback yet (analogous to combatViewed gate)
 *  - homeward: all events resolved, traveling home with the loot
 *  Returns null when the mission has no resolvable phase (no prerolled combat
 *  for regular missions, or no expedition log yet for an expedition). */
export function getMissionPhase(am: ActiveMission): MissionPhase | null {
  // ── Expedition phase ─────────────────────────────────────────
  if (am.expeditionResolvedEvents !== undefined) {
    const log = am.expeditionLog ?? [];
    const totalEvents = am.expeditionResolvedEvents.length;
    const resolved = am.expeditionEventIndex ?? 0;
    if (resolved === 0) return "outbound";
    if (resolved >= totalEvents && am.remaining <= 0) return "homeward";
    const lastEvent = log[log.length - 1];
    if (!lastEvent) return "outbound";
    if (lastEvent.kind === "combat" && !lastEvent.combatViewed) return "combat";
    // Between events / non-combat event most recent: still on the road
    return resolved >= totalEvents ? "homeward" : "outbound";
  }
  // ── Regular non-expedition mission ───────────────────────────
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
