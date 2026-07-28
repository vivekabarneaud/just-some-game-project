// ─── Shared types for Medieval Realm ────────────────────────────
// These types are used by both the frontend and backend.
// Only type definitions — no runtime code.

// ─── Seasons ────────────────────────────────────────────────────

export type Season = "spring" | "summer" | "autumn" | "winter";

// ─── Resources ──────────────────────────────────────────────────

export interface ResourceState {
  gold: number;
  wood: number;
  stone: number;
  /** Stored water — wells + rain-catching cisterns fill it; irrigation spends
   *  it in dry/drought years. Capped by cistern storage. */
  water: number;
}

export interface StorageCaps {
  gold: number;
  wood: number;
  stone: number;
  food: number;
}

// ─── Buildings ──────────────────────────────────────────────────

export type SettlementTier = "camp" | "village" | "town" | "city";

export type FoodType = "grain" | "meat" | "berries" | "fish" | "fiber";

export interface BuildingCost {
  gold?: number;
  wood?: number;
  stone?: number;
}

export interface PlayerBuilding {
  buildingId: string;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
  damaged: boolean;
  /** Seconds left on an in-progress repair; stays `damaged` until it hits 0. */
  repairRemaining?: number;
}

// ─── Farming ────────────────────────────────────────────────────

export type CropId = "wheat" | "barley" | "flax";

export interface PlayerField {
  id: string;
  /** Currently-growing crop. Null between autumn harvest and next spring planting. */
  crop: CropId | null;
  /** UI flag — already harvested this year, wait for spring. Reset each spring. */
  harvested: boolean;
  /** Last crop planted in this field (kept across years). Drives rotation bonuses/penalties. */
  lastCrop: CropId | null;
  /** How many years in a row the same crop has been planted. 0 = fresh or rotated. */
  sameCropStreak: number;
  /** Next harvest receives a +15% bonus (field was left idle through a growing season). */
  restBonus: boolean;
  /** Hay rick left on the field after the autumn grain harvest (straw byproduct).
   *  Grazers eat it through winter; cleared at spring replant. Fiber crops leave none. */
  hay?: number;
  /** Fraction (0-1) of this planting's crop lost to harsh weather so far (heat
   *  waves wither, downpours drown). Accrues while such events are active, scales
   *  down the expected harvest, and is cleared at spring replant. */
  weatherLoss?: number;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

export type VeggieId = "cabbages" | "turnips" | "peas" | "squash" | "fava" | "strawberries" | "lavender";

export interface PlayerGarden {
  id: string;
  veggie: VeggieId;
  level: number; // 0 = unbuilt plot, 1+ = built
  upgrading: boolean;
  upgradeRemaining?: number;
  /** Year the garden was last sown with seeds. Null = not planted this cycle.
   *  Cleared when the produce window closes so the player must replant. */
  plantedYear: number | null;
}

export type AnimalId = "chickens" | "pigs" | "goats" | "sheep";

export interface PlayerPen {
  id: string;
  animal: AnimalId;
  /** Capacity tier. 0 = not built. Level sets how many animals the pen holds
   *  (getPenCapacity); it no longer drives production directly. */
  level: number;
  /** Headcount — animals actually in the pen (0..capacity). Bought with gold;
   *  production/consumption scale with this. */
  count: number;
  upgrading: boolean;
  upgradeRemaining?: number;
  /** True when the pen couldn't cover its food need last tick — production drops to 0 until fed. */
  starving?: boolean;
  /** Accumulated game-hours of starvation; when it crosses the death threshold
   *  an animal dies and it resets. Cleared when the flock is fed again. */
  starveHours?: number;
}

export type AnimalSpecies = "dog" | "cat";
export type AnimalJob = "idle" | "guard" | "hunt" | "mouse";

/** A named working animal the settlement keeps (see docs/DESIGN_KEPT_ANIMALS.md).
 *  Dogs guard flocks / work the hunting camp; cats (later) keep vermin down.
 *  Cozy + attachment-driven: named companions posted to useful work. */
export type AnimalOrigin = "stray" | "thornwoods" | "bred";

export interface KeptAnimal {
  id: string;
  name: string;
  species: AnimalSpecies;
  /** Breed key (dogs) — drives portrait + aptitude; the frontend has the enum. */
  breed?: string;
  /** The specific adult portrait assigned to this animal. */
  portrait?: string;
  /** A young dog: shows the puppy portrait and can't work until grown. */
  isPuppy?: boolean;
  /** Some animals have a fixed name (the Thornwoods' dog) — no rename pen. */
  nameFixed?: boolean;
  /** Where it came from — drives the card's little description. */
  origin: AnimalOrigin;
  /** For `origin === "bred"`: the parents (by id, since names can change). */
  sireId?: string;
  damId?: string;
  /** Owner-bound: belongs to a named character (e.g. Brenna's hound), not the
   *  settlement's managed pack. Excluded from Kennel capacity; not player-
   *  reassignable. Holds the owner's name. */
  keeper?: string;
  /** Current posting. `idle` = "at the fire" (pet/charm, no effect). */
  job: AnimalJob;
  /** When `job === "guard"`, the pen this dog is posted to. */
  penId?: string;
  /** Two independent skill tracks, 0..5 (0 = untrained). Each rises from time
   *  spent on that job. The card's frame tier is the higher of the two. */
  guardLevel: number;
  huntLevel: number;
  /** Game-hours accumulated on the current job (drives leveling). */
  jobHours: number;
  /** 0..100, light and mostly automatic (fed + fitting job = content). */
  happiness: number;
}

export interface PlayerHive {
  id: string;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

export type FruitId = "apples" | "pears" | "cherries" | "grapes";

/** A sapling cohort planted at the same time — ages together to maturity. */
export interface OrchardCohort {
  count: number;
  seasonsGrown: number;
}

export interface PlayerOrchard {
  id: string;
  fruit: FruitId;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
  /** Trees/vines that are bearing fruit. */
  matureTrees: number;
  /** Planted-but-not-yet-bearing cohorts, ageing toward maturationSeasons. */
  saplings: OrchardCohort[];
}

// ─── Adventurers ────────────────────────────────────────────────

export type AdventurerClass = "warrior" | "wizard" | "priest" | "archer" | "assassin";

export type AdventurerRank = 1 | 2 | 3 | 4 | 5;

export type FoodPreference = "sweet" | "spicy" | "hearty" | "smoky" | "fresh";

export interface AdventurerStats {
  str: number;
  int: number;
  dex: number;
  vit: number;
  wis: number;
}

export interface Adventurer {
  id: string;
  name: string;
  class: AdventurerClass;
  rank: AdventurerRank;
  level: number;
  xp: number;
  alive: boolean;
  onMission: boolean;
  bonusStats: Partial<AdventurerStats>;
  equipment: {
    head: string | null;
    chest: string | null;
    legs: string | null;
    boots: string | null;
    gloves: string | null;
    cloak: string | null;
    mainHand: string | null;
    offHand: string | null;
    ring1: string | null;
    ring2: string | null;
    amulet: string | null;
    trinket: string | null;
  };
}

// ─── Items ──────────────────────────────────────────────────────
// ItemSlot lives in ./data/items/types.ts — single source of truth.

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

// ─── Missions ───────────────────────────────────────────────────

export type RewardType = "gold" | "wood" | "stone" | "food" | "astralShards"
  // Typed foods (post-food-refactor missions use these directly)
  | "wheat" | "barley"
  | "cabbages" | "turnips" | "peas" | "squash" | "fava"
  | "apples" | "pears" | "cherries"
  | "meat" | "eggs" | "milk" | "fish"
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
  class: AdventurerClass | "any";
}

export type MissionTag = "combat" | "exploration" | "magical" | "outdoor" | "stealth" | "escort" | "spying" | "assassination" | "dungeon" | "survival" | "peaceful";

export interface MissionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  slots: MissionSlot[];
  duration: number;
  rewards: MissionReward[];
  deployCost: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  minGuildLevel: number;
  tags: MissionTag[];
}

export interface AdventurerMissionSupplies {
  potion?: string;
  food?: string;
  recovery?: string;
}

export interface ActiveMission {
  missionId: string;
  adventurerIds: string[];
  remaining: number;
  successChance: number;
  adventurerSupplies?: Record<string, AdventurerMissionSupplies>;
}

export interface CompletedMission {
  missionId: string;
  success: boolean;
  rewards: MissionReward[];
  casualties: string[];
  revived: string[];
  xpGained: number;
  levelUps: string[];
  rankUps: { name: string; newRank: string }[];
  /** Enemy drops surfaced in the loot chest, applied on claim (see the richer
   *  CompletedMission in data/missions/types.ts). */
  loot?: import("./data/combat").LootResult[];
  /** Title of the pure-tracker story quest this mission completes (see richer def). */
  storyQuestAccomplished?: string;
}

// ─── Raids ──────────────────────────────────────────────────────

export interface IncomingRaid {
  raidId: string;
  remaining: number;
  strength: number;
  warned: boolean;
}

// ─── Crafting ───────────────────────────────────────────────────

export interface ActiveCraft {
  recipeId: string;
  remaining: number;
  /** Undefined/false = active (ticks down). True = waiting in line for a slot
   *  to free up (does not tick; promoted to active when a peer completes). */
  pending?: boolean;
}

// ─── Events ─────────────────────────────────────────────────────

export type GameEventType =
  | "citizen_born" | "citizen_died" | "citizen_left"
  | "building_completed" | "building_damaged" | "building_repaired"
  | "mission_success" | "mission_failed" | "adventurer_died" | "adventurer_wounded" | "adventurer_levelup" | "adventurer_rankup" | "loyalty_rankup"
  | "raid_victory" | "raid_defeat" | "raid_incoming"
  | "winter_freezing"
  | "drought"
  | "loot_drop"
  | "trade_accepted" | "trade_delivered"
  | "pen_starving"
  | "pen_deaths"
  | "pen_births"
  | "pen_predation"
  | "animal_born"
  | "animal_stray"
  | "animal_grown";

export interface GameEvent {
  type: GameEventType;
  message: string;
  icon: string;
  timestamp: number;
}

// ─── Full Game State ────────────────────────────────────────────

export interface GameState {
  resources: ResourceState;
  buildings: PlayerBuilding[];
  fields: PlayerField[];
  gardens: PlayerGarden[];
  pens: PlayerPen[];
  keptAnimals: KeptAnimal[];
  hives: PlayerHive[];
  orchards: PlayerOrchard[];
  /** Per-fruit sapling seed stock — spent to plant trees, saved back at harvest. */
  fruitSeeds: Record<FruitId, number>;
  /** Fruits the player can plant (apple from the start; specialty fruits unlock
   *  when their seed/cutting is acquired). */
  fruitsUnlocked: FruitId[];
  /** Last world-year a drought plant-kill was applied — so it fires once/year. */
  lastDroughtKillYear?: number;
  honey: number;
  /** Per-type food stockpiles — total is capped by pantry.
   *  Orchard fruits (apples/pears/cherries) now live here as first-class foods. */
  foods: Record<string, number>;
  /** Per-category population breakdown. Total via the citizens helper in
   *  frontend/src/data/citizens.ts. Replaces the old scalar `population`. */
  /** Citizens assigned to work each production building (by buildingId), incl.
   *  bench beyond capacity. Drawn from the shared adult pool. */
  buildingWorkers?: Record<string, number>;
  citizens: {
    toddlers: number;
    children: number;
    adults: number;
    elderly: number;
  };
  season: Season;
  seasonElapsed: number;
  year: number;
  lastTick: number;
  gameSpeed: number;
  /** Cistern sluice gate: open = drain the reserve low (flood-safe), shut = bank it. */
  cisternSluiceOpen?: boolean;
  villageName: string;
  // Adventurer's Guild
  adventurers: Adventurer[];
  activeMissions: ActiveMission[];
  completedMissions: CompletedMission[];
  missionBoard: MissionTemplate[];
  missionRefreshIn: number;
  // Harvest tracking
  yearHarvest: Record<string, number>;
  // Materials & Crafting
  wool: number;
  fiber: number;
  leather: number;
  /** Bone — from culling + the hunting camp. Feeds bone broth (later fertilizer). */
  bone: number;
  clothing: number;
  iron: number;
  tools: number;
  weapons: number;
  armor: number;
  potions: number;
  gems: number;
  ironMinedTotal: number;
  herbs: Record<string, number>;
  foragedTotal: number;
  discoveredRecipes: string[];
  activeBlessing: { deityId: string; effect: string } | null;
  lastTradeAt: number;
  alchemyResearchAvailable: boolean;
  inventory: InventoryItem[];
  craftingQueue: ActiveCraft[];
  /** Building tool slots: buildingId → installed tool IDs */
  buildingTools: Record<string, string[]>;
  /** Enemy IDs the player has encountered on missions */
  discoveredEnemies: string[];
  // Event log
  eventLog: GameEvent[];
  // Ale & Happiness
  ale: number;
  /** Mead — brewed from honey at the Brewery, served at the tavern like ale. */
  mead?: number;
  /** Cider — pressed from orchard apples at the Brewery. */
  cider?: number;
  /** Per-drink brewery pause switches, keyed by drink id ("ale", "mead", later
   *  "beer"/"wine"). Missing/false = brewing; true = paused. */
  brewingPaused?: Record<string, boolean>;
  happiness: number;
  lastRaidOutcome: "none" | "victory" | "defeat";
  lastRaidTime: number;
  starvationPenalty: number;
  starvationHours: number;
  // Raids
  incomingRaids: IncomingRaid[];
  hoursSinceLastRaid: number;
  // Astral Shards
  astralShards: number;
  lastDailyLogin: number;
  missionRerollToday: boolean | number;
  lastRerollReset: number;
  lastGuildVisit: number;
  lastMissionRefresh: number;
  // Quest system
  questRewardsClaimed: string[];
  firstMissionSent: boolean;
  // Story missions
  completedStoryMissions: string[];
  /** Robin events queued for the player to acknowledge. Empty most of the time. */
  pendingRobins: string[];
  /** Robin events already acknowledged (one-shot per save). */
  firedRobins: string[];
}
