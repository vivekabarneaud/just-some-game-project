import {
  createContext,
  createSignal,
  onMount,
  Show,
  useContext,
  onCleanup,
  type ParentProps,
} from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
import {
  BUILDINGS,
  type BuildingCost,
  type FoodType,
  type PlayerBuilding,
  type SettlementTier,
  BASE_POPULATION,
  FOOD_PER_CITIZEN_PER_HOUR,
  PANIC_BUILD_IDS,
  PANIC_BUILD_SHARD_COST,
  craftingMaterialCap,
  BASE_MATERIAL_STORAGE,
  MATERIAL_STORAGE_PER_WAREHOUSE_LEVEL,
  BASE_CRAFTING_STORAGE,
  CRAFTING_STORAGE_PER_WAREHOUSE_LEVEL,
  BASE_FOOD_STORAGE,
  FOOD_STORAGE_PER_PANTRY_LEVEL,
  BASE_GOLD_STORAGE,
  GOLD_STORAGE_PER_TH_LEVEL,
  VILLAGER_GROWTH_INTERVAL_HOURS,
  GOLD_TAX_PER_CITIZEN_PER_HOUR,
  ALE_STORAGE_BASE,
  ALE_STORAGE_PER_BREWERY_LEVEL,
  SHRINE_HAPPINESS_PER_LEVEL,
  TAVERN_HAPPINESS_PER_LEVEL,
  TAVERN_HAPPINESS_DRY,
  CLOTHING_PER_CITIZENS,
  CLOTHING_DEGRADE_PER_DAY,
  CLOTHING_WINTER_WOOD_REDUCTION,
  CLOTHING_HAPPINESS_BONUS,
  WINTER_WOOD_PER_CITIZEN_PER_HOUR,
  WINTER_HAPPINESS_PENALTY,
  WINTER_NO_WOOD_HAPPINESS,
  WINTER_NO_WOOD_DEATH_RATE,
  getRepairCost,
  getRepairTime,
  getSettlementTier,
  getSettlementName,
  isBuildingUnlocked,
  isBuildingChapterUnlocked,
  getEffectiveMaxLevel,
  getMasonBonuses,
  applyMasonCostReduction,
  applyMasonTimeReduction,
  type MasonBonuses,
  getTierPrerequisitesMet,
  BUILDING_STAFF,
  staffCapacity,
  STAFF_LVL1_FLOOR,
  isStaffable,
  animalSlots,
  kennelDogCapacity,
  gatheringSeasonMod,
} from "~/data/buildings";
import { FOUNDING_CHARACTERS } from "~/data/founding_characters";
import {
  getWallCost,
  getWatchtowerCost,
  getBarracksCost,
  getWallRepairCost,
  getDefensiveRepairCost,
  getMageTowerCost,
  getWallBuildTime,
  getWatchtowerBuildTime,
  getBarracksBuildTime,
  getMageTowerBuildTime,
  SOLDIER_COST,
  ARCHER_COST,
  availableCitizens,
  militiaCount,
  TRAINER_ID,
  trainerHome,
  ringUnlocked,
  getWatchtowerArcherCap,
  getBarracksSoldierCap,
  distributeLegacyGarrison,
  getTrainTime,
} from "~/data/defenses";
import {
  type CitizenCounts,
  founderCitizens,
  founderHousehold,
  totalPopulation,
  effectiveFoodMouths,
  applySurvivalRatio,
  reduceByPriority,
  migrateLegacyPopulation,
  ageStep,
  rollArrival,
  addCitizens,
} from "~/data/citizens";
import { getRobinEvent, getRobinForStoryMission } from "~/data/robins";
import {
  type CropId,
  getCrop,
  getFieldCost,
  getFieldBuildTime,
  getSeasonYield,
  getSoilMultiplier,
  getHayFromHarvest,
  MAX_FIELDS,
  FIELD_MAX_LEVEL,
} from "~/data/crops";
import {
  type VeggieId,
  VEGGIES,
  getVeggie,
  getGardenCost,
  getGardenBuildTime,
  getSeedCapacity,
  getLiveGardenRate,
  getSeedReturn,
  getSproutedPlants,
  getGerminationRate,
  makeStartingSeeds,
  startingUnlockedSeeds,
  isSeedUnlocked,
  STARTING_SEED_PER_CROP,
  canPlantVeggie,
  isVeggieProducing,
  GARDEN_MAX_LEVEL,
} from "~/data/gardens";
import {
  type AnimalId,
  ANIMALS,
  getAnimal,
  getPenCost,
  getPenBuildTime,
  getPenProduction,
  getPenCapacity,
  getAnimalBuyCost,
  LIVESTOCK_STARVE_DEATH_HOURS,
  LIVESTOCK_BREED_PER_HOUR,
  LIVESTOCK_MIN_BREEDING_FLOCK,
  LIVESTOCK_BREEDING_SEASONS,
  PREDATION_PER_HOUR,
  PREDATION_SEASON_MOD,
  PREDATION_MAX_LOSS,
  getCullYield,
  getWoolSeasonMod,
  PEN_MAX_LEVEL,
} from "@medieval-realm/shared/data/livestock";
import {
  type FoodItemType,
  emptyFoods,
  getTotalFood,
  consumeFood,
  addFood,
  migrateFoodsFromLegacy,
  isFoodItemType,
  getFoodCostAmount,
  consumeFoodCost,
  type DishKind,
} from "~/data/foods";
import {
  ANIMAL_FEED,
  isGrazer,
  consumeFromCategories,
} from "~/data/animalFeed";
import {
  getHiveCost,
  getHiveBuildTime,
  getHoneyRate,
  getHoneyStorageCap,
  MAX_HIVES,
  HIVE_MAX_LEVEL,
} from "~/data/apiary";
import {
  type FruitId,
  FRUITS,
  getFruit,
  getOrchardCost,
  getOrchardBuildTime,
  getOrchardRate,
  getOrchardTreeSlots,
  getOrchardSeedReturn,
  startingFruitSeeds,
  startingUnlockedFruits,
  isFruitUnlocked,
  SAPLING_PLANT_SEASON,
  isOrchardActive,
  ORCHARD_MAX_LEVEL,
} from "~/data/orchards";
import { getClimate, getClimateYield, climateOverrideBand, setClimateOverride, isWetBand, climateRainFactor, type ClimateBand } from "~/data/climate";
import { WELL_ID, CISTERN_ID, getWellOutput, wellFactor, getCisternRainCatch, getWaterCap, ambientRainFactor, gardenWaterDemand, fieldWaterDemand, orchardWaterDemand, penWaterDemand, getSluiceDrain, delugeDrownFactor, STREAM_YIELD, streamStatus, streamFactor, cropHeatFactor, citizenWaterDemand } from "~/data/water";
import type { StreamStatus } from "~/data/water";
import { resolveCurrentWeather, HEATWAVE_HEAT_KILL_PER_HOUR, DELUGE_DROWN_KILL_PER_HOUR, CHRONIC_WILT_PER_HOUR, type WeatherType } from "~/data/weather";
import {
  type Season,
  SEASON_ELAPSED_SPAN,
  HARVEST_DURATION_HOURS,
  nextSeason,
  IS_DEV,
  getGlobalSeason,
} from "~/data/seasons";
import { STORY_CHAINS, runStoryChains, next3amUTC } from "~/engine/story/chains";
import {
  type Adventurer,
  type Race,
  buildRecruitFromPremadeId,
  getArrivedPremades,
  getDeployCost,
  getMaxRoster,
  RACE_WEIGHTS,
  getOriginsForRace,
  BACKSTORY_TRAITS,
  PERSONALITY_QUIRKS,
  getPortraitUrl,
} from "@medieval-realm/shared/data/adventurers";
import { PREMADE_CHARACTERS } from "@medieval-realm/shared/data/premade-characters";
import { getNpcAlly } from "@medieval-realm/shared/data/npcs";
import {
  type ActiveMission,
  type CompletedMission,
  type MissionReward,
  type MissionTemplate,
  getMission,
  generateMissionBoard,
  eligiblePinnedMissions,
  MISSION_POOL,
  NOVICE_MISSIONS,
  EXPERT_MISSIONS,
  getMissionBoardSize,
  calcSuccessChance,
  rollPermanentDeaths,
  calcEffectiveDuration,
  calcAssassinBonusRewards,
  calcAssassinFailRewards,
  formatReward,
  STORY_MISSIONS,
  isExpedition,
  getMissionPhase,
  type AdventurerMissionSupplies,
} from "@medieval-realm/shared/data/missions";
import { getEnemy } from "@medieval-realm/shared/data/enemies";
import { forageBloomNow } from "~/data/weather";
import { pickAdultPortrait, pickPuppyPortrait, breedAptitude, DOG_BREED_KEYS, DOG_NAMES, type DogBreed } from "~/data/dogBreeds";
import {
  getMissionXp,
  applyXp,
  RANK_NAMES,
  getZoomedPortraitUrl,
} from "@medieval-realm/shared/data/adventurers";
import {
  type InventoryItem,
  type ItemSlot,
  getItem,
  getItemByRecipe,
  getMaxStack,
  clampStackAdd,
  getEquipmentStats,
  getPotionInfo,
  MATCHED_FOOD_LOYALTY_BONUS,
  getArmorAccess,
  getWeaponAccess,
  slotAccepts,
  isRingSlot,
} from "@medieval-realm/shared/data/items";
import {
  calcStats as calcAdvStats,
  getUnspentStatPoints,
  type AdventurerStats,
  STAT_KEYS,
  getLoyaltyRank,
  FOOD_PREFERENCES,
  ORIGIN_RECIPES,
} from "@medieval-realm/shared/data/adventurers";
import {
  type IncomingRaid,
  getRaid,
  calcDefense,
  calcWarningTime,
  spawnRaid,
  getRaidChance,
  RAID_POOL,
  type DefenseBreakdown,
} from "~/data/raids";

import {
  QUEST_DEFINITIONS,
  isQuestTriggered,
  isChapterComplete,
} from "~/data/quests";
import { getReadyEvents } from "~/data/events";
import { TRAVELING_MERCHANTS, getMerchant, merchantIntervalDays } from "~/data/merchants";
import { calcTavern, tavernRooms, REPUTATION_DRIFT_PER_HOUR, TAVERN_FOOD_PER_ROOM_PER_HOUR, MENU_STAPLE_IDS, serversNeeded, menuCapacity, TAVERN_COMMODITY_DRINKS, getCommodityDrink, type TavernCommodityDrink } from "~/data/tavern";
import { HERBS } from "@medieval-realm/shared/data/herbs";
import { AILMENTS, getAilment, type BuildingAilment } from "@medieval-realm/shared/data/ailments";
import { brew as brewAlchemy, recipeIdFor, brewRarity, clampPlacements } from "@medieval-realm/shared/data/alchemy/brew";
import { getIngredient as getAlchemyIngredient } from "@medieval-realm/shared/data/alchemy/ingredients";
import { matchNamedRecipe } from "@medieval-realm/shared/data/alchemy/named_recipes";
import { summarizeRecovery, easeHoursFor } from "@medieval-realm/shared/data/alchemy/apply";
import type { Placement as AlchemyPlacement, StoredAlchemyRecipe } from "@medieval-realm/shared/data/alchemy/types";
import { resolveDish, matchNamedDish } from "@medieval-realm/shared/data/kitchen/named_dishes";
import { clampPlacements as clampCookPlacements, dishIdFor } from "@medieval-realm/shared/data/kitchen/cook";
import { getFoodIngredient } from "@medieval-realm/shared/data/kitchen/ingredients";
import type { CookPlacement, StoredDish } from "@medieval-realm/shared/data/kitchen/types";
import { EXOTIC_IDS } from "@medieval-realm/shared/data/exotics";
import { ALCHEMY_RECIPES, getDiscoverableRecipes, RESEARCH_BASE_COST } from "@medieval-realm/shared/data/alchemy_recipes";
import { getDeity, getCurrentDeity } from "~/data/deities";
import { simulateCombat, buildAdventurerUnit, type LootResult } from "@medieval-realm/shared/data/combat";
import type { CombatUnit } from "@medieval-realm/shared/data/combat";
import { simulateRaidCombat } from "@medieval-realm/shared/data/raidCombat";
import { canUnlockTalent } from "~/data/talents";
import { getEnchantment } from "~/data/enchantments";
import {
  listSettlements,
  loadSettlement as loadSettlementApi,
  saveSettlement as saveSettlementApi,
  createSettlement as createSettlementApi,
  peekSettlementUpdatedAt,
  getExpectedUpdatedAt,
} from "~/api/settlement";
import { isLoggedIn } from "~/api/auth";

// ─── Types ───────────────────────────────────────────────────────

// ─── Event Log ──────────────────────────────────────────────────

/** Build the captain (Gareth at the watchtower, Morgause at the barracks) as a
 *  raid combat unit — but ONLY when they're home (alive, not on a mission). A
 *  captain away on a mission simply isn't in the fight, so takes no wound. Their
 *  presence also lends the hired stack a +1-trained-level command buff, applied
 *  separately at the call site. */
export function buildRaidCaptainUnit(advs: Adventurer[], kind: "watchtower" | "barracks"): CombatUnit | null {
  const adv = advs.find((a) => a.premadeId === TRAINER_ID[kind] && a.alive && !a.onMission);
  return adv ? buildAdventurerUnit(adv) : null;
}

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
  timestamp: number; // game tick when it happened
}

import { type CraftingRecipe, type ActiveCraft, CRAFTING_RECIPES, passiveCookTime, isRecipeDiscovered, getBuildingToolByRecipe, getBuildingTool, getRequiredTool, type BuildingToolDef } from "./crafting";
import { playSound } from "./sounds";
import {
  calcAdventurerMaxHp,
  resolveEventSlot,
  resolveExpeditionEvent,
  applyBetweenEventHeal,
  applyRecoveryItems,
  isTeamWiped,
} from "@medieval-realm/shared/data/expeditionEngine";
export type { CraftingRecipe, ActiveCraft, BuildingToolDef };
export { CRAFTING_RECIPES, passiveCookTime, isRecipeDiscovered, getBuildingTool, getBuildingToolByRecipe, getRequiredTool };

/** How many dishes a kitchen can keep-cooking at once: one per level (naturally
 *  capped by the number of food recipes it has unlocked). */
export function cookSlotsForLevel(level: number): number {
  return Math.max(1, level);
}
export { getBuildingToolsForBuilding, BUILDING_TOOLS } from "./crafting";

export interface ResourceState {
  gold: number;
  wood: number;
  stone: number;
  /** Stored water — filled by the stream + wells + rain-catching cisterns, drunk
   *  by folk/livestock/crops. Capped by cistern storage; drained by the sluice. */
  water: number;
}

export interface StorageCaps {
  gold: number;
  wood: number;
  stone: number;
  food: number;
  water: number;
}

export interface PlayerField {
  id: string;
  crop: CropId | null;          // currently-growing crop; null = empty
  harvested: boolean;           // already harvested this year, wait for spring
  lastCrop: CropId | null;      // last crop planted — drives rotation tracking
  sameCropStreak: number;       // consecutive same-crop years (0 = fresh/rotated)
  restBonus: boolean;           // +15% yield next harvest (field was idle a year)
  hay?: number;                 // straw rick left after harvest — winter grazer fodder; cleared at spring replant
  weatherLoss?: number;         // 0-1 fraction of this planting's crop lost to harsh weather (heat waves / downpours); scales the harvest, cleared at replant
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

export interface PlayerGarden {
  id: string;
  veggie: VeggieId;
  level: number;          // 0 = unbuilt
  upgrading: boolean;
  upgradeRemaining?: number;
  plantedYear: number | null; // null = needs replanting; else the year we sowed
  seedsPlanted: number;       // seeds committed this cycle (the "sown" tally; grows on re-sow)
  /** Seeds that germinated into standing plants this cycle (per-seed roll at sow).
   *  The denominator for "alive"; distinguishes a seed that never came up from a
   *  plant that later died. */
  sprouted: number;
  /** Currently-living plants — germination successes minus any lost to weather or
   *  a sustained water deficit. Drives yield + water draw; empty slots (failed to
   *  germinate OR died) can be re-sown during the plant season. */
  plantsAlive: number;
}

export interface PlayerPen {
  id: string;
  animal: AnimalId;
  /** Capacity tier (0 = not built). Sets how many animals fit, not production. */
  level: number;
  /** Headcount — animals in the pen (0..capacity). Bought with gold; production scales with it. */
  count: number;
  upgrading: boolean;
  upgradeRemaining?: number;
  /** True when the pen didn't cover its food need last tick. Production = 0 while starving. */
  starving?: boolean;
  /** Accumulated game-hours of starvation; an animal dies each time it crosses
   *  the death threshold, then it resets. Cleared once the flock is fed. */
  starveHours?: number;
}

export type AnimalSpecies = "dog" | "cat";
export type AnimalJob = "idle" | "guard" | "hunt" | "mouse";
export type AnimalOrigin = "stray" | "thornwoods" | "bred";
/** A named working animal the settlement keeps (dogs now, cats later). See
 *  docs/DESIGN_KEPT_ANIMALS.md. `idle` = at the fire (pet/charm, no effect). */
export interface KeptAnimal {
  id: string;
  name: string;
  species: AnimalSpecies;
  breed: DogBreed;       // drives portrait + aptitude; inherited from a parent when bred
  portrait: string;      // the specific adult portrait assigned to this dog
  isPuppy?: boolean;     // a young dog: shows the puppy portrait, can't work until grown
  nameFixed?: boolean;   // a fixed-name dog (gift/companion) can't be renamed
  origin: AnimalOrigin;  // drives the card description
  sireId?: string;       // parents (by id) when origin === "bred"
  damId?: string;
  /** Owner-bound: this dog belongs to a named character (e.g. Nessa's hound),
   *  not the settlement's managed pack. Excluded from Kennel capacity and can't
   *  be reassigned or recalled by the player. Holds the owner's name. */
  keeper?: string;
  job: AnimalJob;
  penId?: string;        // when job === "guard"
  guardLevel: number;    // 0..5 skill at guarding (0 = untrained)
  huntLevel: number;     // 0..5 skill at hunting
  jobHours: number;      // game-hours on the current job
  happiness: number;     // 0..100
}

export interface PlayerHive {
  id: string;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

// ─── Defenses (rework v1) ─────────────────────────────────────────
// Multi-instance walls/watchtowers/barracks organized by ring.
// See docs/DESIGN_DEFENSES.md.

export type DefenseRing = "outer" | "middle" | "inner";

export interface PlayerWall {
  ring: DefenseRing;
  level: number;       // 0 = unbuilt
  hp: number;          // current HP (0 when unbuilt; full = level * WALL_BASE_HP)
  upgrading: boolean;
  upgradeRemaining?: number;
}

/**
 * Per-building garrison: a roster of trained units stationed at this watchtower
 * or barracks. Headcount caps at the building's level (see capacity formulas in
 * defenses.ts). All units in a garrison level together; trainedLevel is shared.
 *
 * Combat is resolved at the squad level (one CombatUnit per garrison with HP
 * pooled across the headcount) — see raidCombat.ts when Phase 2 lands.
 */
export interface Garrison {
  /** Current headcount stationed here. Capped by the building level. */
  count: number;
  /** Collective level of every unit in this garrison. New recruits join at this
   *  level (cost scales) — keeps the squad uniform without per-unit bookkeeping.
   *  Capped at the building's level. */
  trainedLevel: number;
  /** Active drill. Started by the building's trainer-coordinator (Gareth /
   *  Morgause); `trainerId` is that adventurer's roster id, which marks them
   *  busy (can't be sent on a mission until the drill finishes). trainedLevel
   *  rises by 1 once remainingSeconds hits 0. Auto-paused while a raid is
   *  incoming (not ticked but not cleared). */
  training?: { targetLevel: number; remainingSeconds: number; trainerId?: string };
}

export interface PlayerWatchtower {
  ring: DefenseRing;
  level: number;       // 0 = unbuilt
  damaged: boolean;
  upgrading: boolean;
  upgradeRemaining?: number;
  /** Archer roster stationed here. Defaults to { count: 0, trainedLevel: 0 }. */
  garrison: Garrison;
}

export interface PlayerBarracks {
  ring: DefenseRing;
  level: number;       // 0 = unbuilt
  damaged: boolean;
  upgrading: boolean;
  upgradeRemaining?: number;
  /** Soldier roster stationed here. Defaults to { count: 0, trainedLevel: 0 }. */
  garrison: Garrison;
}

/** Base wall HP per level. Full HP = level × this. Tune during playtest. */
export const WALL_BASE_HP = 100;

/** Mage Tower: single instance, lives at the Inner ring (Town tier). Gates
 *  enchanting recipes by level. Doesn't fight in raids — purely a research
 *  building stationed inside the keep. */
export interface PlayerMageTower {
  level: number;       // 0 = unbuilt
  damaged: boolean;
  upgrading: boolean;
  upgradeRemaining?: number;
}

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

export interface GameState {
  resources: ResourceState;
  /** Net food change per hour from the last tick (production minus citizen +
   *  animal consumption). Derived/transient — surfaced so quest triggers and UI
   *  can gate on a genuine food surplus/deficit rather than raw stock. */
  netFoodPerHour?: number;
  /** Net water change per hour from the last tick (waterBalance().net). Derived;
   *  surfaced so the cistern nudge can fire on a genuine water DEFICIT. */
  netWaterPerHour?: number;
  /** Storage caps from the last tick. Derived; surfaced so the pantry/warehouse
   *  nudges can fire when a resource is near its cap (overflow) without
   *  reimplementing calcStorageCaps in the quest layer. */
  storageCaps?: StorageCaps;
  buildings: PlayerBuilding[];
  fields: PlayerField[];
  gardens: PlayerGarden[];
  seeds: Record<VeggieId, number>; // per-crop seed stock for sowing gardens
  seedsUnlocked: VeggieId[]; // crops the player can grow (staples always; specialty crops unlock on seed acquisition)
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
  /** Cumulative garden plants killed by environmental stress (heat / drowning /
   *  thirst). The away digest diffs this to report how many wilted offline. */
  plantsWiltedEnv?: number;
  /** Most recent environmental cause of a garden wilt, for the digest wording. */
  lastWiltCause?: "heat" | "drown" | "thirst";
  /** High-water mark of plantsWiltedEnv already surfaced in the event log, so a
   *  long dry/hot stretch logs one throttled line per few losses, not per tick. */
  plantsWiltedLogged?: number;
  honey: number;
  /** Per-type food stockpiles — total capped by pantry */
  foods: Record<FoodItemType, number>;
  /** Per-category population breakdown. Read totals via totalPopulation();
   *  combat eligibility is `citizens.adults`. See data/citizens.ts. */
  citizens: CitizenCounts;
  /** Citizens assigned to work each production building (by buildingId), incl.
   *  bench beyond capacity. Drawn from the shared adult pool. */
  buildingWorkers?: Record<string, number>;
  /** Live founder ailments (injury/illness) keyed by building id — a hurt/sick
   *  founder works their building at reduced pace until they recover. See
   *  DESIGN_WORKERS_PLAGUES §illness and shared/data/ailments. */
  buildingAilments?: Record<string, BuildingAilment>;
  /** "The household" — named, protected residents (founders + named arrivals
   *  like the Thornwood boy), by age. A subset of `citizens`: it's the death
   *  floor (RNG never kills named folk) and the reserve that stays out of the
   *  militia. Generic townsfolk = citizens − namedResidents. Named people age
   *  via scripted beats, not the statistical aging tick. */
  namedResidents: CitizenCounts;
  // ── Defenses (rework v1): multi-instance walls/towers/barracks per ring,
  //    plus counters for recruited soldier-citizens. See DESIGN_DEFENSES.md.
  walls: PlayerWall[];
  watchtowers: PlayerWatchtower[];
  barracks: PlayerBarracks[];
  /** Inner-ring-only spire of arcane research. Gates enchanting recipes. */
  mageTower: PlayerMageTower;
  /** Recruited melee soldiers stationed in barracks. Subset of population. */
  soldiers: number;
  /** Recruited archers stationed in watchtowers. Subset of population. */
  archers: number;
  season: Season;
  seasonElapsed: number;
  year: number;
  /** Global year at founding. Lets `year` read as SETTLEMENT AGE while the season
   *  stays global/shared: in prod, year = global.year - foundingYear + 1. */
  foundingYear: number;
  /** Latched on the first tick: did the settlement begin in winter? While true, a
   *  food-rationing grace eases consumption; it goes false the moment the
   *  settlement leaves that first winter (so it only ever helps the opening). */
  foundingWinterGrace?: boolean;
  lastTick: number;
  gameSpeed: number;
  /** Cistern sluice gate: open = stop banking water and drain the reserve low
   *  (flood-safe in a wet year); shut/undefined = bank a buffer (drought-safe). */
  cisternSluiceOpen?: boolean;
  villageName: string;
  // Adventurer's Guild
  adventurers: Adventurer[];
  /** Story-chain timers: real-ms deadlines for `awaitDelay` steps, keyed
   *  `${chainId}:${key}` (see engine/story/chains.ts). Undefined until a chain
   *  first reaches a delay step. */
  storyTimers?: Record<string, number>;
  activeMissions: ActiveMission[];
  completedMissions: CompletedMission[]; // recent results (cleared on read)
  /** Durable per-mission success counts (unlike completedMissions, never cleared).
   *  Drives count-gated chains + mission requirements. */
  missionCompletions: Record<string, number>;
  missionBoard: MissionTemplate[];
  missionRefreshIn: number; // game-hours until next mission board refresh
  // Harvest tracking
  yearHarvest: Record<string, number>; // { "wheat": 120, "flax": 60 }
  // Materials & Crafting
  wool: number;
  fiber: number;
  leather: number;
  /** Bone — from culling livestock + the hunting camp. Feeds bone broth (and,
   *  later, fertilizer / bone tools like needles / buttons). A crafting material like leather. */
  bone: number;
  clothing: number;
  iron: number;
  tools: number;
  weapons: number;
  armor: number;
  potions: number;
  gems: number;
  ironMinedTotal: number; // tracks total iron for gem proc
  // Herbs
  herbs: Record<string, number>; // { chamomile: 5, mugwort: 3, ... }
  foragedTotal: number; // tracks total food foraged for herb procs
  // Exotic goods — caravan/escort drops only, used in Kitchen + a few Alchemy recipes
  exotics: Record<string, number>; // { pepper: 5, cinnamon: 2, tea: 1, ... }
  // Alchemy research
  discoveredRecipes: string[]; // recipe IDs discovered through research
  /** Free-form alchemy: recipe cards the player has brewed (keyed by the
   *  deterministic recipeIdFor). A brewed potion in inventory uses this id as
   *  its itemId; this store is what the potion DOES. See DESIGN_APOTHECARY. */
  alchemyRecipes?: Record<string, StoredAlchemyRecipe>;
  /** Free-form cooking: discovered dishes (the cookbook) + how many of each the
   *  player has prepared (the pantry stock a later economy pass will draw on). */
  kitchenDishes?: Record<string, StoredDish>;
  cookedDishes?: Record<string, number>;
  alchemyResearchAvailable: boolean; // resets daily
  // Shrine blessing
  activeBlessing: { deityId: string; effect: string } | null;
  // Marketplace
  lastTradeAt: number; // timestamp of last trade
  inventory: InventoryItem[];
  /** One-time flag so the starting medical supplies (bandages) are granted once
   *  — to new games and, via migration, to saves that predate them. */
  startingSuppliesGiven?: boolean;
  craftingQueue: ActiveCraft[];
  /** Passive "keep cooking" assignments: buildingId → recipeId. While set, the
   *  building auto-re-crafts that recipe whenever it's idle and has ingredients
   *  (and, for the Kitchen, wood to burn). Empty = nothing auto-running. */
  autoCook: Record<string, string[]>;
  /** Building tool slots: buildingId → installed tool IDs */
  buildingTools: Record<string, string[]>;
  /** Enemy IDs the player has encountered on missions */
  discoveredEnemies: string[];
  // Event log
  eventLog: GameEvent[];
  // Ale & Happiness
  ale: number;
  /** Mead — brewed from honey at the Brewery, served at the tavern like ale. */
  mead: number;
  /** Cider — pressed from orchard apples at the Brewery (Lv.3). */
  cider: number;
  /** Per-drink brewery pause switches, keyed by drink id ("ale", "mead", later
   *  "beer"/"wine"). Missing/false = brewing; true = paused. */
  brewingPaused?: Record<string, boolean>;
  happiness: number; // 0-100
  lastRaidOutcome: "none" | "victory" | "defeat";
  lastRaidTime: number; // game-hours elapsed since last raid outcome
  starvationPenalty: number; // 0-75, decays over 24h after food is restored
  starvationHours: number; // game-hours of continuous starvation; ramps the famine work penalty, recovers 2x speed once fed
  /** Settlement morale bump after a newborn — 0-10, decays linearly over 24
   *  game-hours (a full season). Stacked births don't compound past the cap. */
  newbornGlow: number;
  /** Year of the most recent birth-roll attempt. Birth rolls fire at most
   *  once per game-year, gated by adults/food/happiness/housing eligibility. */
  lastBirthYear: number;
  // Raids
  incomingRaids: IncomingRaid[];
  hoursSinceLastRaid: number; // game-hours until next raid spawns
  /** Total raids that have resolved (victory + defeat). Persistent counter,
   *  used by quests like Baptism of Fire that need to fire on first encounter
   *  regardless of outcome and survive the lastRaidOutcome decay window. */
  raidsResolvedCount: number;
  /** Deepest quarry level whose spiders have been cleared. The quarry yields at
   *  min(quarry.level, this) — dig past the spiders and output stays at the
   *  previous level until the "Clear the Diggings" mission is done. Starts at 1
   *  (the surface quarry has no dig-in). See the quarry-spider gate. */
  quarrySpidersClearedLevel: number;
  // Astral Shards (premium currency)
  astralShards: number;
  lastDailyLogin: number; // real-world timestamp of last daily reward claim
  missionRerollToday: boolean | number;
  lastRerollReset: number; // real-world timestamp of last reroll reset (daily)
  lastGuildVisit: number; // timestamp of last guild page visit
  lastMissionRefresh: number; // timestamp when missions last refreshed
  scoutingBoardSeeded?: boolean; // true once the board has been opened by completing scouting

  // Quest system
  questRewardsClaimed: string[];
  /** Per-storyline chapter state. Drives chapter unlocks and the quest log. */
  chapters: import("~/data/quests").ChapterState[];
  /** Narrative events that have already fired (one-shot). */
  firedEvents: string[];
  /** Traveling-merchant visits that have already happened (one-shot per merchant). */
  merchantVisitsFired: string[];
  /** Dishes currently featured on the tavern menu (food ids). Drives menu variety. */
  tavernMenu: string[];
  /** Adults assigned to serve at the tavern (shares the garrison adult pool). */
  tavernServers: number;
  /** Tavern pricing lever: trades occupancy for margin. */
  tavernPricing: import("~/data/tavern").TavernPricing;
  /** Tavern reputation 0-100 — the tavern's own bar; raises the occupancy ceiling. */
  tavernReputation: number;
  /** The merchant currently visiting (drives the first-visit modal); undefined when none. */
  pendingMerchantVisitId?: string;
  /** A recurring merchant's lingering stall at the marketplace (return visits).
   *  `expiresAt` is the next-morning (3AM-UTC) timestamp the stall closes at.
   *  One stall at a time; others queue until it closes. */
  merchantStall?: { merchantId: string; expiresAt: number; takenOffers: string[] };
  /** Per-merchant next-arrival timestamps (3AM-UTC boundaries) for recurring
   *  visits; keyed by merchant id. Absent until that merchant's recurrence starts. */
  merchantSchedule?: Record<string, number>;
  /** Narrative events queued for the player to read; cleared on dismiss. */
  pendingEvents: string[];
  /** Quest IDs the player has already glanced at since they became claimable.
   *  Drives the red sidebar notification badge — count is unseen-claimable.
   *  Hovering a quest card in the Quest Log adds the id to this list. */
  questsClaimableSeen: string[];
  /** Building IDs the player has hovered/visited since unlock. Drives the
   *  blue "newly unlocked" highlight in the Buildings page. */
  buildingsSeen: string[];
  /** Recipe IDs the player has hovered. Drives the blue "newly available"
   *  highlight on RecipeCards + the per-crafting-building sidebar badge. */
  recipesSeen: string[];
  /** Adventurer IDs the player has glanced at in the Roster. A newly-arrived
   *  character not in this list shows an "unread" highlight (and drives the
   *  Roster tab dot + the sidebar guild "new!" pulse) until the Roster is viewed. */
  adventurersSeen: string[];
  firstMissionSent: boolean;
  introSeen: boolean;
  // Story missions
  completedStoryMissions: string[];
  /** Ids of one-time (`unique`) missions completed successfully. Filtered out
   *  of future board generation so a resolved personal/narrative beat never
   *  reappears. (Recurring "chore" missions are never added here.) */
  completedUniqueMissionIds: string[];
  /** Robin events queued for the player to acknowledge — sidebar banner shown
   *  while non-empty. Acknowledging applies unlocks and moves the id to
   *  firedRobins. Each event fires once per save. */
  pendingRobins: string[];
  /** Robin events the player has already acknowledged. Prevents re-fire and
   *  re-applying unlocks if the same trigger conditions hold again. */
  firedRobins: string[];
  // Chronicle (Lord's journal) — entries that have fired and bio fragments unlocked
  chronicleEntriesFired: string[];
  /** Chronicle entries a story chain wants surfaced as a beat modal, waiting to
   *  be drained by the UI. Distinct from chronicleEntriesFired (the archive). */
  pendingChronicleBeats: string[];
  /** Entries the player has visited in the Journal archive. Used to power the "new!" sidebar pulse. */
  chronicleEntriesSeen: string[];
  unlockedBioFragments: string[];
  /** Bio fragments the player has visited in the Cast archive. Parallel to chronicleEntriesSeen. */
  bioFragmentsSeen: string[];
}

export interface FoodSource {
  type: FoodType | string;
  label: string;
  icon: string;
  rate: number;
  building: string;
  /** True for foraged/hunted/fished food (not farmed) — lets the Farming page
   *  sum only the farm's own output. */
  wild?: boolean;
}

export interface TavernDish {
  id: string;
  name: string;
  icon: string;
  image?: string;
  kind: DishKind;
  unlocked: boolean;   // kitchen high enough + recipe discovered
  onMenu: boolean;
  available: boolean;  // unlocked AND ingredients in stock (cookable now)
  missing: string[];   // ingredient resources short of a batch
  costs: { resource: string; amount: number }[]; // the recipe's ingredients
  /** True for stored-commodity drinks (ale, later wine/mead) poured from stock
   *  rather than cooked to order — drives "from the barrel" labelling. */
  commodity?: boolean;
}

export interface GameActions {
  upgradeBuilding: (buildingId: string) => boolean;
  panicBuildBuilding: (buildingId: string) => boolean;
  canAfford: (cost: BuildingCost) => boolean;
  getBuildingEffect: (buildingId: string, nextLevel: number) => string | null;
  buildField: () => boolean;
  plantField: (fieldId: string, crop: CropId) => boolean;
  upgradeField: (fieldId: string) => boolean;
  removeField: (fieldId: string) => void;
  upgradeGarden: (gardenId: string) => boolean;
  /** Pay seed gold to sow the garden for this cycle. Only valid during the veggie's plantSeasons. */
  plantGarden: (gardenId: string) => boolean;
  upgradePen: (penId: string) => boolean;
  /** Buy `qty` animals for a built pen with gold, up to its capacity. */
  buyLivestock: (penId: string, qty?: number) => boolean;
  /** Deliberately slaughter `qty` animals from a pen for meat + leather. */
  cullLivestock: (penId: string, qty?: number) => boolean;
  /** Post a kept animal to a job (guard a pen, work the hunting camp, or idle). */
  assignAnimal: (animalId: string, job: AnimalJob, penId?: string) => boolean;
  /** Rename a kept animal (rejected for name-fixed ones like the Thornwoods' dog). */
  renameAnimal: (animalId: string, name: string) => boolean;
  /** Open/shut the cistern sluice. Open = stop banking + drain low (flood-safe);
   *  shut = bank a buffer (drought-safe). Pass a value or omit to toggle. */
  toggleSluice: (open?: boolean) => void;
  upgradeHive: (hiveId: string) => boolean;
  upgradeOrchard: (orchardId: string) => boolean;
  /** Plant one sapling/vine into a free slot of an orchard (gold cost). */
  plantSapling: (orchardId: string) => boolean;
  setGameSpeed: (speed: number) => void;
  renameVillage: (name: string) => void;
  resetGame: () => void;
  markIntroSeen: () => void;
  /** Remove a chronicle beat from the pending-modal queue once the UI has shown it. */
  dismissChronicleBeat: (entryId: string) => void;
  /** Close the traveling-merchant visit (he leaves). */
  dismissMerchantVisit: () => void;
  /** Take one of the lingering merchant stall's offers (instant trade, once). */
  takeMerchantStallOffer: (offerId: string) => boolean;
  /** Toggle a dish on/off the tavern menu. */
  toggleTavernDish: (dishId: string) => void;
  /** Replace the whole tavern menu (menu editor's Apply); clamped to capacity. */
  setTavernMenu: (dishIds: string[]) => void;
  /** Pause/resume brewing a commodity drink at the Brewery (e.g. "ale"). */
  toggleBrewingPaused: (drinkId: string) => void;
  /** Whether a commodity drink is currently paused at the Brewery. */
  isBrewingPaused: (drinkId: string) => boolean;
  /** Staffing readout for a production building (capacity, named staff, active,
   *  coverage multiplier) — powers the Manage modal + the coverage tick. */
  getBuildingStaffing: (buildingId: string) => BuildingStaffing;
  /** Assign one townsfolk (from the shared adult pool) to a building's staff,
   *  incl. bench beyond capacity. Returns false if no adult is spare. */
  assignBuildingWorker: (buildingId: string) => boolean;
  /** Pull one assigned townsfolk off a building (back to the pool). */
  unassignBuildingWorker: (buildingId: string) => boolean;
  /** Assign N adults to serve at the tavern (clamped to available adults + slots). */
  setTavernServers: (n: number) => void;
  /** Set the tavern pricing lever. */
  setTavernPricing: (pricing: import("~/data/tavern").TavernPricing) => void;
  skipSeason: () => void;
  getProductionRates: () => { gold: number; wood: number; stone: number; food: number };
  getMaxPopulation: () => number;
  /** The "while you were away" digest, or null if there's nothing to show. */
  getAwayReport: () => AwayReport | null;
  dismissAwayReport: () => void;
  /** Food projection at current buildings + population as if `season` were in
   *  effect, for the season-change warning. net < 0 means a deficit; hoursToEmpty
   *  is how long current stores would last at that season's rates (Infinity if
   *  no deficit). */
  getSeasonFoodOutlook: (season: Season) => { net: number; hoursToEmpty: number; prod: number };
  /** Dev-only: inject a sample away report so the digest card can be eyeballed. */
  devPreviewAwayReport: () => void;
  getFoodConsumption: () => number;
  getAnimalFoodConsumption: () => number;
  /** Food-value per hour the tavern burns cooking dishes to order (0 if no
   *  tavern or nothing servable). Competes with feeding the settlement. */
  getTavernFoodConsumption: () => number;
  /** At-a-glance tavern readout for the building modal (beds filled, reputation,
   *  gold/day, food burn). 0s when the tavern is unbuilt or damaged. */
  getTavernReadout: () => { rooms: number; occupiedRooms: number; occupancy: number; goldPerDay: number; serversNeeded: number; servers: number; reputation: number; foodPerHour: number; damaged: boolean };
  /** Honey gathered per hour across all active hives (seasonal — 0 in winter). */
  getHoneyProduction: () => number;
  /** Net food/h added by passive cooking (produced minus ingredients eaten),
   *  counting only pots that can actually run right now. Shared so the top bar
   *  and the Overview panel report the same surplus/deficit. */
  getCookingFoodNet: () => number;
  getFoodBreakdown: () => FoodSource[];
  /** Tavern menu dishes (cook-to-order): every menu-eligible kitchen recipe with
   *  its unlock/on-menu/availability state, for the tavern UI. */
  getTavernDishes: () => TavernDish[];
  getStorageCaps: () => StorageCaps;
  getSettlementTier: () => SettlementTier;
  getTownHallLevel: () => number;
  /** This year's climate band for the Farming readout (grace-aware: Year 1 = normal). */
  getClimateBand: () => ClimateBand;
  /** Dev: apply a drought plant-kill right now (test tool). */
  /** Dev: run a full drought spell (forces the drought band + plant-kill) for a
   *  few real seconds, then hands the climate back to the world year. */
  triggerDrought: () => void;
  /** Net water change per hour (stream + well + rain + runoff − draws). */
  getWaterRate: () => number;
  /** The stream's status (drives its water yield + the fishing hut's catch). */
  getStreamStatus: () => StreamStatus;
  /** Water sources/sinks per hour for the top-bar dropdown. */
  getWaterBreakdown: () => { stream: number; well: number; rain: number; citizens: number; animals: number; crops: number; cropDraw: number; raining: boolean; coverage: number; sluiceOpen: boolean; sluiceDrain: number; hasCistern: boolean; reserve: number; weather: WeatherType; streamStatus: StreamStatus; net: number };
  /** Effective crop-yield multiplier (1 = full): dry years thirst once the
   *  reserve runs dry, wet years carry a waterlogging penalty. */
  getCropYieldMult: () => number;
  isHarvesting: () => boolean;
  getMasonBonuses: () => MasonBonuses;
  getMasonLevel: () => number;
  getActiveQueueCount: () => number;
  getEffectiveMaxLevel: (buildingId: string) => number;
  cancelBuild: (buildingId: string) => boolean;
  // Adventurer's Guild
  getGuildLevel: () => number;
  dismissAdventurer: (adventurerId: string) => boolean;
  /** Use a recovery item (e.g. a Bandage) on a resting hero at home: consumes
   *  one from inventory and heals its healPct of max HP. No-op if the hero is
   *  away, already full, or there's none in stock. */
  useRecoveryItem: (adventurerId: string, itemId: string) => boolean;
  /** The founder ailment sitting on a building (if any), plus the owned cure
   *  items that can clear it — drives the building-card cure UI. Null if well. */
  getBuildingAilment: (buildingId: string) => {
    name: string; icon: string; kind: "injury" | "illness"; who: string; hoursRemaining: number;
    cures: { id: string; name: string; icon: string; qty: number }[];
  } | null;
  /** Apply an owned cure item to a building's founder ailment. Clears it and
   *  consumes one. No-op if there's no ailment or the item doesn't cure it. */
  cureBuildingAilment: (buildingId: string, itemId: string) => boolean;
  /** How many of a free-form alchemy ingredient the player owns (herb / honey /
   *  inventory item). Drives the lab's availability + brew gating. */
  getBrewIngredientQty: (ingredientId: string) => number;
  /** Brew a free-form combo: consumes 1 of each ingredient, computes the result,
   *  saves the recipe card (state.alchemyRecipes), and adds the brewed potion to
   *  inventory. Returns false if any ingredient is short. */
  brewPotion: (placements: AlchemyPlacement[]) => boolean;
  /** A saved recipe card (what a brewed-potion inventory item does), or undefined. */
  getAlchemyRecipe: (recipeId: string) => StoredAlchemyRecipe | undefined;
  /** How many of a cooking ingredient the player owns (food / herb / resource). */
  getCookIngredientQty: (ingredientId: string) => number;
  /** Cook a free-form dish: consumes 1 of each ingredient, records the dish in
   *  the cookbook (state.kitchenDishes) + the prepared-dish stock, and discovers
   *  it if new. Returns false if any ingredient is short. */
  cookDish: (placements: CookPlacement[]) => boolean;
  deployMission: (missionId: string, adventurerIds: string[], adventurerSupplies?: Record<string, { potion?: string; food?: string; recovery?: string }>, precomputedSuccess?: number) => boolean;
  /** Current quantity of any resource/item/herb/material (for deploy-item costs). */
  resourceQty: (res: string) => number;
  collectCompletedMissions: () => CompletedMission[];
  getAvailableAdventurers: () => Adventurer[];
  getRosterSize: () => { current: number; max: number };
  grantResources: (amount: number) => void;
  // Dev-only test snapshot: stash the current save and roll back to it.
  saveDevSnapshot: () => void;
  restoreDevSnapshot: () => void;
  hasDevSnapshot: () => boolean;
  devSnapshotTime: () => number | null;
  // Ale & Happiness
  /** Barrel readout for a commodity drink (ale/mead/cider/…) by id. */
  getDrinkInfo: (id: string) => { current: number; cap: number; production: number; consumption: number };
  startCraft: (recipeId: string, quantity?: number) => boolean;
  /** Toggle passive "keep cooking": pass a recipeId to auto-run it at its
   *  building, or null to stop. One auto-recipe per building. */
  /** Toggle a recipe in/out of a building's "keep cooking" set. Adding is capped
   *  at the building's cook-slot count (kitchen level); toggling an active recipe
   *  removes it. */
  setAutoCook: (buildingId: string, recipeId: string) => void;
  /** How many dishes this building can keep-cooking simultaneously (by level). */
  getAutoCookSlots: (buildingId: string) => number;
  getAvailableRecipes: () => CraftingRecipe[];
  installBuildingTool: (toolId: string, targetBuildingId: string) => boolean;
  getInstalledTools: (buildingId: string) => string[];
  enchantItem: (enchantId: string, adventurerId: string | null, slot: string | null, inventoryIdx: number | null) => boolean;
  getClothingInfo: () => { current: number; needed: number };
  allocateStat: (adventurerId: string, stat: keyof AdventurerStats) => boolean;
  unlockTalent: (adventurerId: string, talentId: string) => boolean;
  resetTalents: (adventurerId: string) => boolean;
  equipItem: (adventurerId: string, itemId: string, targetSlot?: ItemSlot) => boolean;
  unequipItem: (adventurerId: string, slot: ItemSlot) => boolean;
  getInventoryCount: (itemId: string) => number;
  getHappinessModifier: () => number;
  getHappinessBreakdown: () => { label: string; value: number }[];
  repairBuilding: (buildingId: string) => boolean;
  // ── Defenses (rework v1) ─────────────────────────────────────
  buildOrUpgradeWall: (ring: DefenseRing) => boolean;
  buildOrUpgradeWatchtower: (ring: DefenseRing) => boolean;
  buildOrUpgradeBarracks: (ring: DefenseRing) => boolean;
  buildOrUpgradeMageTower: () => boolean;
  repairWall: (ring: DefenseRing) => boolean;
  repairWatchtower: (ring: DefenseRing) => boolean;
  repairBarracks: (ring: DefenseRing) => boolean;
  repairMageTower: () => boolean;
  recruitSoldier: (ring: DefenseRing) => boolean;
  recruitArcher: (ring: DefenseRing) => boolean;
  dismissSoldier: (ring: DefenseRing) => boolean;
  dismissArcher: (ring: DefenseRing) => boolean;
  /** Begin a training cycle on a watchtower or barracks. Pays the gold cost
   *  up-front and starts the timer. trainedLevel rises by 1 on completion. */
  startTraining: (kind: "watchtower" | "barracks", ring: DefenseRing) => boolean;
  // Raids
  getDefense: () => DefenseBreakdown;
  triggerRaid: () => boolean;
  spawnTestMissions: (...missionIds: string[]) => void;
  recallAdventurers: () => { recalled: number; instant: boolean };
  // Astral Shards
  claimDailyLogin: () => boolean;
  canClaimDailyLogin: () => boolean;
  visitGuild: () => void;
  hasNewGuildContent: () => boolean;
  hasNewAdventurers: () => boolean;
  markAdventurersSeen: () => void;
  visitChronicleJournal: () => void;
  visitChronicleCast: () => void;
  /** Mark a single chronicle entry as glanced-at — clears its highlight and
   *  ticks the sidebar badge down by one. Used by per-card hover. */
  markChronicleEntrySeen: (entryId: string) => void;
  /** Mark a single bio fragment (memory) as glanced-at. */
  markBioFragmentSeen: (fragmentId: string) => void;
  hasNewChronicleContent: () => boolean;
  countUnseenJournalEntries: () => number;
  countUnseenMemories: () => number;
  rerollMissions: () => boolean;
  /** Dev-only: replace the mission board with every novice mission, ignoring prerequisites. */
  devSpawnAllNoviceMissions: () => void;
  /** Dev-only: replace the board with the veteran (expert-pool) missions — for previewing high-rank frames. */
  devSpawnVeteranMissions: () => void;
  claimQuestReward: (questId: string) => boolean;
  startAlchemyResearch: () => boolean;
  startAlchemyCraft: (recipeId: string, quantity?: number) => boolean;
  getHerbCount: (herbId: string) => number;
  makeOffering: (deityId: string) => boolean;
  claimMissionReward: (index: number) => void;
  /** Acknowledge a pending robin event — applies its unlocks (recipes/cast/
   *  quests), removes it from pendingRobins, adds it to firedRobins. */
  acknowledgeRobin: (robinId: string) => void;
  /** Dismiss a pending narrative event banner. Unlocks were already applied
   *  when the event fired; this only removes the banner from the queue. */
  dismissEvent: (eventId: string) => void;
  /** Mark a claimable quest as glanced-at. The red sidebar notification clears
   *  for that quest until a new one becomes claimable. */
  markQuestClaimableSeen: (questId: string) => void;
  /** Mark a building as glanced-at. Clears the blue "newly unlocked" highlight
   *  on its card in the Buildings page. */
  markBuildingSeen: (buildingId: string) => void;
  /** Mark a recipe as glanced-at. Clears its blue highlight + ticks the
   *  crafting-building sidebar badge down. */
  markRecipeSeen: (recipeId: string) => void;
  /** Dev-only: queue the placeholder robin event so the banner / sidebar pill
   *  / Overview card can be tested without completing a story mission. Idempotent
   *  — clears prior fired state so the button works repeatedly across sessions. */
  devTriggerRobin: () => void;
  applyCoopClaim: (response: import("@medieval-realm/shared").CoopClaimResponse, expeditionId: string) => import("@medieval-realm/shared/data/missions").CompletedMission;
  skipRaidTimer: () => void;
  skipMissionTimers: () => void;
  markCombatViewed: (missionId: string) => void;
  acknowledgeWipeCompletion: (missionId: string) => void;
  acknowledgeRaidCombat: (raidId: string) => void;
  devAddShards: (amount: number) => void;
  trade: (give: string, giveAmount: number, receive: string, receiveAmount: number, allowWithoutMarket?: boolean) => boolean;
}

// ─── Constants ───────────────────────────────────────────────────

const STORAGE_KEY = "medieval-realm-save";
/** Dev-only manual snapshot slot — a copy of the save blob the player can stash
 *  and roll back to while testing. Separate from the live save key. */
const SNAPSHOT_KEY = "medieval-realm-dev-snapshot";
const SNAPSHOT_META_KEY = "medieval-realm-dev-snapshot-meta";
const TICK_INTERVAL_MS = 1000;
let idCounter = 1;

function nextId(prefix: string): string {
  return `${prefix}_${idCounter++}`;
}

/** Clothing a newcomer brings with them (they arrive dressed, like the founders).
 *  Small — clothing degrades ~1/day, so this covers the new head with a little
 *  buffer without removing the need to weave replacements over time. */
const CLOTHING_PER_ARRIVAL = 2;

/** Auto-join the curated cast: any character whose scripted arrival condition
 *  is now met joins the roster directly — free, no roster cap. The cast is a
 *  finite collection you assemble over the game (paced by arrival conditions),
 *  not a managed-size pool. A character already on the roster (alive OR dead —
 *  permadeath is permanent) never re-arrives. Idempotent + cheap each tick.
 *  New arrivals are "unread" until the player views the roster (adventurersSeen). */
function syncArrivals(s: GameState): void {
  const builtBuildingIds = new Set(s.buildings.filter((b) => b.level > 0).map((b) => b.buildingId));
  const loyaltyByPremadeId: Record<string, number> = {};
  for (const a of s.adventurers) {
    if (a.alive && a.premadeId) {
      loyaltyByPremadeId[a.premadeId] = Math.max(loyaltyByPremadeId[a.premadeId] ?? 0, a.loyalty ?? 0);
    }
  }
  const arrived = getArrivedPremades({
    guildBuilt: builtBuildingIds.has("adventurers_guild"),
    completedStoryMissions: s.completedStoryMissions,
    completedQuests: s.questRewardsClaimed,
    completedUniqueMissionIds: s.completedUniqueMissionIds,
    builtBuildingIds,
    loyaltyByPremadeId,
  });
  const havePremadeIds = new Set(s.adventurers.map((a) => a.premadeId).filter(Boolean) as string[]);
  for (const c of arrived) {
    if (!havePremadeIds.has(c.id)) {
      const rec = buildRecruitFromPremadeId(nextId("adv"), c.id, 1);
      if (rec) {
        s.adventurers.push(rec);
        havePremadeIds.add(c.id);
        // Newcomers arrive with their own clothes (like the founders) — a small
        // clothing bump so early settlements aren't in a clothing crisis. It
        // still decays, so the tailor stays relevant for replacements.
        s.clothing += CLOTHING_PER_ARRIVAL;
      }
    }
  }
  // NOTE: the scripted narrative beats that used to live here (the Thornwoods'
  // arrival chronicle, and Hester's timed return + reveal) now run in the story
  // "director" layer — see runStoryChains() / engine/story/chains.ts. syncArrivals
  // is back to its one job: adding curated cast whose arrival condition is met.
}

const NAME_PREFIXES = [
  "Oak", "Iron", "Storm", "Shadow", "Golden", "Silver", "Raven", "Wolf",
  "Frost", "Ember", "Thorn", "Stone", "Moss", "Cedar", "Amber", "Copper",
  "Willow", "Elder", "Ashen", "Bright", "Dark", "Red", "White", "Black",
  "Moon", "Sun", "Star", "Dawn", "Dusk", "Mist", "River", "Lake",
];
const NAME_SUFFIXES = [
  "hold", "haven", "dale", "ford", "stead", "watch", "keep", "fall",
  "wood", "field", "bridge", "vale", "crest", "hollow", "glen", "moor",
  "shire", "brook", "marsh", "ridge", "peak", "gate", "wall", "helm",
];

/** Names reserved for canon NPC neighbour settlements (see
 *  docs/DESIGN_ACT1_SETTING.md). A player town must never be auto-named one of
 *  these, so generateSettlementName() re-rolls on a hit. Lowercased for
 *  case-insensitive comparison. None are currently producible by the
 *  prefix+suffix generator, but this guards against future pool drift. */
const CANON_NEIGHBOUR_NAMES = new Set(["greyford"]);

function generateSettlementName(): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
    const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
    const name = prefix + suffix;
    if (!CANON_NEIGHBOUR_NAMES.has(name.toLowerCase())) return name;
  }
  // Astronomically unlikely fallback (every roll hit a reserved name).
  return "Newhold";
}

export function createInitialState(): GameState {
  // Travel rations the founders arrived with. After a ~47-day walk from
  // Ashwick the perishables are gone; what's left is dried/preserved food:
  // grain (their bread/hardtack stash), dried meat strips, dried fish, a few
  // handfuls of nuts and dried berries off the road. A modest buffer (~a week)
  // that makes the food deficit a COUNTDOWN, not instant starvation — and it
  // seeds every kitchen staple so the player can "keep cooking" from day one
  // (porridge from grain, Hearth Stew from meat+forage, River Stew from fish).
  const initialFoods = emptyFoods();
  initialFoods.wheat = 30;
  initialFoods.meat = 15;
  initialFoods.fish = 10;
  initialFoods.nuts = 10;
  initialFoods.berries = 8;
  return {
    resources: { gold: 50, wood: 300, stone: 200, water: 0 },
    foods: initialFoods,
    buildings: BUILDINGS.map((b) => ({
      buildingId: b.id,
      level: b.id === "town_hall" ? 1 : 0,
      upgrading: false,
      damaged: false,
    })),
    fields: [],
    // Pre-spawn one unbuilt slot per veggie so the player sees the full
    // garden shape immediately (cabbages / turnips / peas / squash / fava).
    gardens: VEGGIES.map((v) => ({
      id: nextId("garden"),
      veggie: v.id,
      level: 0,
      upgrading: false,
      plantedYear: null,
      seedsPlanted: 0,
      sprouted: 0,
      plantsAlive: 0,
    })),
    // The crew arrived with seed — enough to sow a first plot of each crop.
    seeds: makeStartingSeeds(),
    seedsUnlocked: startingUnlockedSeeds(),
    // Pre-spawn one pen per animal (chickens / goats / pigs / sheep).
    pens: ANIMALS.map((a) => ({
      id: nextId("pen"),
      animal: a.id,
      level: 0,
      count: 0,
      upgrading: false,
    })),
    // No dogs to start. The Thornwoods' hound (Rowan) arrives the moment the
    // player builds a Kennel to house her; strays/pups follow once there's room.
    keptAnimals: [],
    // Pre-spawn apiary slots — all identical, no type variants.
    hives: Array.from({ length: MAX_HIVES }, () => ({
      id: nextId("hive"),
      level: 0,
      upgrading: false,
    })),
    // Pre-spawn one orchard per fruit (apples / pears / cherries / grapes).
    orchards: FRUITS.map((f) => ({
      id: nextId("orchard"),
      fruit: f.id,
      level: 0,
      upgrading: false,
      matureTrees: 0,
      saplings: [],
    })),
    fruitSeeds: startingFruitSeeds(),
    fruitsUnlocked: startingUnlockedFruits(),
    honey: 0,
    // Bio-accurate founder mapping: Edda + Father Corin elderly,
    // Jory + Tomas adults, Nell child. See docs/DESIGN_CITIZEN_CATEGORIES.md.
    citizens: founderCitizens(),
    buildingWorkers: {},
    namedResidents: founderHousehold(),
    // Defenses: 3 unbuilt slots per type (one per ring). All locked behind
    // settlement tier in the UI; only Outer is buildable from Camp.
    walls: [
      { ring: "outer", level: 0, hp: 0, upgrading: false },
      { ring: "middle", level: 0, hp: 0, upgrading: false },
      { ring: "inner", level: 0, hp: 0, upgrading: false },
    ],
    watchtowers: [
      { ring: "outer", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
      { ring: "middle", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
      { ring: "inner", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
    ],
    barracks: [
      { ring: "outer", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
      { ring: "middle", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
      { ring: "inner", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
    ],
    mageTower: { level: 0, damaged: false, upgrading: false },
    soldiers: 0,
    archers: 0,
    // Dev runs its own fast local calendar (starts in spring). Prod seeds the
    // fresh settlement AT the current shared-world season/progress, so the very
    // first tick doesn't fast-forward spring -> now and fire a burst of stale
    // season banners ("Spring has arrived" followed instantly by summer).
    season: IS_DEV ? "spring" : getGlobalSeason().season,
    seasonElapsed: IS_DEV ? 0 : getGlobalSeason().progress * SEASON_ELAPSED_SPAN,
    year: 1,
    foundingYear: getGlobalSeason().year,
    // foundingWinterGrace left undefined — latched on the first tick.
    lastTick: Date.now(),
    gameSpeed: 1,
    villageName: generateSettlementName(),
    yearHarvest: {},
    wool: 0,
    fiber: 0,
    leather: 0,
    bone: 0,
    // Founders arrive with their own clothes (like later newcomers do) — enough
    // to cover the household so a fresh settlement doesn't open on a "poorly
    // clothed" debuff. Still decays, so the tailor loop matters later.
    clothing: 8,
    iron: 0,
    tools: 0,
    weapons: 0,
    armor: 0,
    potions: 0,
    gems: 0,
    ironMinedTotal: 0,
    herbs: {},
    foragedTotal: 0,
    exotics: {},
    discoveredRecipes: [],
    alchemyResearchAvailable: true,
    activeBlessing: null,
    lastTradeAt: 0,
    // The crew arrived with basic medical supplies — bandages to take on missions.
    inventory: [{ itemId: "bandage", quantity: 5 }],
    startingSuppliesGiven: true,
    craftingQueue: [],
    autoCook: {},
    buildingTools: {},
    discoveredEnemies: [],
    eventLog: [],
    ale: 0,
    mead: 0,
    cider: 0,
    happiness: 50,
    lastRaidOutcome: "none",
    lastRaidTime: 0,
    starvationPenalty: 0,
    starvationHours: 0,
    newbornGlow: 0,
    lastBirthYear: 0,
    adventurers: [],
    activeMissions: [],
    completedMissions: [],
    missionCompletions: {},
    missionBoard: [],
    missionRefreshIn: 0,
    incomingRaids: [],
    hoursSinceLastRaid: 48, // start with 48h of calm
    raidsResolvedCount: 0,
    quarrySpidersClearedLevel: 1,
    astralShards: 0,
    lastDailyLogin: 0,
    lastGuildVisit: 0,
    lastMissionRefresh: 0,
    scoutingBoardSeeded: false,
    missionRerollToday: 0,
    lastRerollReset: Date.now(),
    questRewardsClaimed: [],
    chapters: [
      { storyline: "settlement", current: 1, completedChapters: [] },
      { storyline: "guild", current: 0, completedChapters: [] },
      { storyline: "story", current: 1, completedChapters: [] },
      { storyline: "defense", current: 0, completedChapters: [] },
      { storyline: "social", current: 1, completedChapters: [] },
    ],
    firedEvents: [],
    merchantVisitsFired: [],
    tavernMenu: [...MENU_STAPLE_IDS],
    tavernServers: 0,
    tavernPricing: "fair",
    tavernReputation: 0,
    pendingEvents: [],
    questsClaimableSeen: [],
    buildingsSeen: [],
    recipesSeen: [],
    adventurersSeen: [],
    firstMissionSent: false,
    introSeen: false,
    completedStoryMissions: [],
    completedUniqueMissionIds: [],
    pendingRobins: [],
    firedRobins: [],
    chronicleEntriesFired: [],
    pendingChronicleBeats: [],
    chronicleEntriesSeen: [],
    unlockedBioFragments: [],
    bioFragmentsSeen: [],
  };
}

// ─── Persistence ─────────────────────────────────────────────────

function saveGameLocal(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

let _settlementId: string | null = null;

export function getSettlementId(): string | null {
  return _settlementId;
}

function saveGame(state: GameState) {
  saveGameLocal(state);
  if (_settlementId) {
    saveSettlementApi(_settlementId, state).catch(() => { /* silent fail, will retry */ });
  }
}

// Debounced save: coalesces rapid actions into one API call within 1 second
let _debouncedSaveTimer: ReturnType<typeof setTimeout> | null = null;
let _latestStateGetter: (() => GameState) | null = null;

function scheduleSave() {
  if (_debouncedSaveTimer) clearTimeout(_debouncedSaveTimer);
  _debouncedSaveTimer = setTimeout(() => {
    _debouncedSaveTimer = null;
    if (_settlementId && _latestStateGetter) {
      saveSettlementApi(_settlementId, JSON.parse(JSON.stringify(_latestStateGetter()))).catch(() => {});
    }
  }, 1000);
}

/** Canonical save-migration / backfill pass. Brings any older save — local OR
 *  server — up to the current GameState shape: adds fields that postdate the
 *  save, migrates renamed/legacy structures, and restores the id counter. MUST
 *  run on BOTH load paths; skipping it (as the server path historically did)
 *  leaves new fields undefined and crashes the tick. Mutates and returns `saved`. */
export function migrateSaveState(saved: GameState): GameState {
    for (const def of BUILDINGS) {
      if (!saved.buildings.find((b) => b.buildingId === def.id)) {
        saved.buildings.push({ buildingId: def.id, level: 0, upgrading: false, damaged: false });
      }
    }
    saved.buildings = saved.buildings.filter((b) => b.buildingId !== "farm");
    if ("mana" in saved.resources) delete (saved.resources as any)["mana"];
    if (typeof (saved.resources as any).water !== "number") (saved.resources as any).water = 0;
    // Citizen-categories migration (Phase B). Old saves stored a scalar
    // `population: number`; new shape is `citizens: CitizenCounts`. Preserve
    // the total — exactly-5 starter saves get the founder slice, others get
    // the default 60/20/12/8 split.
    if (!(saved as any).citizens) {
      const legacy = (saved as any).population;
      const total = legacy === undefined
        ? BASE_POPULATION + (HOUSING_POP[saved.buildings.find((b) => b.buildingId === "houses")?.level ?? 0] ?? 0)
        : Math.floor(legacy);
      (saved as any).citizens = migrateLegacyPopulation(total);
      delete (saved as any).population;
    }
    // "The household" (named/protected residents). Legacy saves predate it —
    // seed the founder composition. Named arrivals that already happened aren't
    // reconstructed (alpha: disposable saves); a fresh game is exact.
    if (!(saved as any).buildingWorkers) (saved as any).buildingWorkers = {};
    if (!(saved as any).namedResidents) {
      (saved as any).namedResidents = founderHousehold();
    }
    // Year-as-settlement-age: backfill foundingYear so the displayed year is
    // preserved (year = global.year - foundingYear + 1). And established saves
    // never get the founding-winter grace (they're past their opening).
    if ((saved as any).foundingYear === undefined) {
      (saved as any).foundingYear = getGlobalSeason().year - (((saved as any).year ?? 1) - 1);
    }
    if ((saved as any).foundingWinterGrace === undefined) {
      (saved as any).foundingWinterGrace = false;
    }
    if (!saved.fields) saved.fields = [];
    if (!saved.gardens) saved.gardens = [];

    // Recovery system (Model C): persistent HP. Backfill legacy saves so every
    // hero starts at full; conditions default to none. maxHp stays derived.
    for (const a of saved.adventurers ?? []) {
      if (a.currentHp == null) a.currentHp = calcAdventurerMaxHp(a);
    }

    // Defenses rework migration (April 2026): create the 3-ring slot layout
    // for walls/watchtowers/barracks. Old single-instance buildings (lookup
    // by buildingId in saved.buildings) are mapped onto the Outer ring.
    // The old entries in saved.buildings stay for now — consumers will be
    // rewired in subsequent commits. See docs/DESIGN_DEFENSES.md.
    if (!saved.walls) {
      const oldWalls = saved.buildings?.find((b: any) => b.buildingId === "walls");
      const lvl = oldWalls?.level ?? 0;
      saved.walls = [
        {
          ring: "outer",
          level: lvl,
          // Carry over the old "damaged" flag as half-HP if set; otherwise full.
          hp: lvl > 0 ? (oldWalls?.damaged ? Math.floor(lvl * WALL_BASE_HP / 2) : lvl * WALL_BASE_HP) : 0,
          upgrading: oldWalls?.upgrading ?? false,
          upgradeRemaining: oldWalls?.upgradeRemaining,
        },
        { ring: "middle", level: 0, hp: 0, upgrading: false },
        { ring: "inner", level: 0, hp: 0, upgrading: false },
      ];
    }
    if (!saved.watchtowers) {
      const oldTower = saved.buildings?.find((b: any) => b.buildingId === "watchtower");
      saved.watchtowers = [
        {
          ring: "outer",
          level: oldTower?.level ?? 0,
          damaged: oldTower?.damaged ?? false,
          upgrading: oldTower?.upgrading ?? false,
          upgradeRemaining: oldTower?.upgradeRemaining,
          garrison: { count: 0, trainedLevel: 0 },
        },
        { ring: "middle", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
        { ring: "inner", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
      ];
    }
    if (!saved.barracks || !Array.isArray(saved.barracks)) {
      const oldBarracks = saved.buildings?.find((b: any) => b.buildingId === "barracks");
      saved.barracks = [
        {
          ring: "outer",
          level: oldBarracks?.level ?? 0,
          damaged: oldBarracks?.damaged ?? false,
          upgrading: oldBarracks?.upgrading ?? false,
          upgradeRemaining: oldBarracks?.upgradeRemaining,
          garrison: { count: 0, trainedLevel: 0 },
        },
        { ring: "middle", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
        { ring: "inner", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
      ];
    }
    if (saved.soldiers === undefined) saved.soldiers = 0;
    if (saved.archers === undefined) saved.archers = 0;
    // Backfill garrison fields onto towers/barracks loaded from older saves
    // (pre-garrison-rework). Then redistribute the legacy global archers /
    // soldiers totals across the rings (outer first, then middle, then inner)
    // so the new per-building model matches what the player had before.
    for (const t of saved.watchtowers) if (!t.garrison) t.garrison = { count: 0, trainedLevel: 0 };
    for (const b of saved.barracks) if (!b.garrison) b.garrison = { count: 0, trainedLevel: 0 };
    distributeLegacyGarrison(saved.watchtowers, saved.archers, getWatchtowerArcherCap);
    distributeLegacyGarrison(saved.barracks, saved.soldiers, getBarracksSoldierCap);
    if (!saved.mageTower) {
      const oldMage = saved.buildings?.find((b: any) => b.buildingId === "mage_tower");
      saved.mageTower = {
        level: oldMage?.level ?? 0,
        damaged: oldMage?.damaged ?? false,
        upgrading: oldMage?.upgrading ?? false,
        upgradeRemaining: oldMage?.upgradeRemaining,
      };
    }
    // Defense category moved to dedicated /defenses page state — drop the
    // now-removed building entries from older saves so they don't ghost
    // around in iteration. Levels already migrated into walls/watchtowers/
    // barracks/mageTower above. Runs AFTER those migrations so the lookups
    // above still find the legacy entries.
    {
      const REMOVED_DEFENSE_IDS = new Set(["walls", "watchtower", "barracks", "mage_tower"]);
      saved.buildings = saved.buildings.filter((b) => !REMOVED_DEFENSE_IDS.has(b.buildingId));
    }
    // Garden migration: add plantedYear on each, and ensure one slot per veggie
    // exists so the pre-attributed 4-slot layout works on old saves.
    for (const g of saved.gardens) {
      if ((g as any).plantedYear === undefined) (g as any).plantedYear = null;
      // Seed system: a garden planted under the old gold-cost system counts as
      // fully sown so its rate doesn't drop to zero on load; empty plots get 0.
      if ((g as any).seedsPlanted === undefined) {
        (g as any).seedsPlanted = (g as any).plantedYear != null ? getSeedCapacity((g as any).level ?? 0) : 0;
      }
      // Living-plant model: older saves derived the plant count from seedsPlanted
      // on the fly — seed plantsAlive/sprouted once from that so a standing crop
      // survives the load with the same count + yield (and can then die/re-sow).
      if ((g as any).plantsAlive === undefined || (g as any).sprouted === undefined) {
        const s0 = (g as any).plantedYear != null
          ? getSproutedPlants(getVeggie((g as any).veggie), (g as any).seedsPlanted ?? 0)
          : 0;
        (g as any).sprouted = s0;
        (g as any).plantsAlive = s0;
      }
    }
    for (const v of VEGGIES) {
      if (!saved.gardens.some((g: any) => g.veggie === v.id)) {
        saved.gardens.push({
          id: nextId("garden"),
          veggie: v.id,
          level: 0,
          upgrading: false,
          plantedYear: null,
          seedsPlanted: 0,
          sprouted: 0,
          plantsAlive: 0,
        });
      }
    }
    // Per-crop seed stock: existing saves get the same starting pouch the crew
    // would have brought, so planting works immediately after the update.
    if (!(saved as any).seeds) {
      (saved as any).seeds = makeStartingSeeds();
    } else {
      for (const v of VEGGIES) {
        if (typeof (saved as any).seeds[v.id] !== "number") (saved as any).seeds[v.id] = 0;
      }
    }
    // Unlocked crops: old saves get the staples unlocked; specialty crops
    // (e.g. strawberries) stay locked until their seed is acquired.
    if (!(saved as any).seedsUnlocked) {
      (saved as any).seedsUnlocked = startingUnlockedSeeds();
    }
    // Fruit seeds + unlocked fruits (orchard seed model). Old saves get the
    // founders' apple pack; apple is the only unlocked fruit until a seed stall.
    if (!(saved as any).fruitSeeds) (saved as any).fruitSeeds = startingFruitSeeds();
    if (!(saved as any).fruitsUnlocked) (saved as any).fruitsUnlocked = startingUnlockedFruits();
    // Lavender became a specialty (acquired) crop — clear any legacy free
    // starter stock from saves that got it before the flip, unless the player
    // has since unlocked it for real. Idempotent; safe to delete post-alpha.
    if (!(saved as any).seedsUnlocked.includes("lavender")) {
      (saved as any).seeds.lavender = 0;
    }
    if (!saved.pens) saved.pens = [];
    // Dogs are earned now (built the Kennel), not seeded — see createDefaultState.
    if (!saved.keptAnimals) saved.keptAnimals = [];
    // Backfill kept animals from earlier increments (single `level`, no origin/
    // breed) so their stars and portraits render.
    const usedPortraits = new Set<string>();
    for (const a of saved.keptAnimals as any[]) {
      if (typeof a.guardLevel !== "number") a.guardLevel = typeof a.level === "number" ? a.level : 0;
      if (typeof a.huntLevel !== "number") a.huntLevel = 0;
      if (!a.origin) a.origin = "stray";
      if (typeof a.happiness !== "number") a.happiness = 70;
      if (typeof a.jobHours !== "number") a.jobHours = 0;
      if (!a.breed) a.breed = DOG_BREED_KEYS[Math.floor(Math.random() * DOG_BREED_KEYS.length)];
      if (!a.portrait) a.portrait = pickAdultPortrait(a.breed, usedPortraits);
      usedPortraits.add(a.portrait);
    }
    // Population model: default a headcount on any pre-count pen (no NaN in food math).
    for (const p of saved.pens) if (typeof (p as any).count !== "number") (p as any).count = 0;
    if (!saved.hives) saved.hives = [];
    if (!saved.orchards) saved.orchards = [];
    // Pens: ensure one pre-attributed slot per animal
    for (const a of ANIMALS) {
      if (!saved.pens.some((p: any) => p.animal === a.id)) {
        saved.pens.push({
          id: nextId("pen"),
          animal: a.id,
          level: 0,
          count: 0,
          upgrading: false,
        });
      }
    }
    // Orchards: migrate the old whole-orchard maturity (seasonsGrown/mature) to
    // the tree-count model. A mature orchard becomes a full grove; a growing one
    // becomes a sapling cohort at the same age.
    for (const o of saved.orchards as any[]) {
      if (o.matureTrees === undefined) {
        const slots = getOrchardTreeSlots(o.level ?? 0);
        if (o.mature) {
          o.matureTrees = slots;
          o.saplings = [];
        } else if ((o.seasonsGrown ?? 0) > 0 && (o.level ?? 0) > 0) {
          o.matureTrees = 0;
          o.saplings = [{ count: Math.max(slots, 1), seasonsGrown: o.seasonsGrown }];
        } else {
          o.matureTrees = 0;
          o.saplings = [];
        }
        delete o.seasonsGrown;
        delete o.mature;
      }
      if (!Array.isArray(o.saplings)) o.saplings = [];
    }
    // Ensure one pre-attributed slot per fruit (adds grapes to old saves).
    for (const f of FRUITS) {
      if (!saved.orchards.some((o: any) => o.fruit === f.id)) {
        saved.orchards.push({
          id: nextId("orchard"),
          fruit: f.id,
          level: 0,
          upgrading: false,
          matureTrees: 0,
          saplings: [],
        });
      }
    }
    // Hives: collapse legacy multi-hive saves to the single apiary, keeping the
    // player's best (highest-level) hive so no upgrade progress is lost.
    if (saved.hives && saved.hives.length > MAX_HIVES) {
      const best = saved.hives.reduce((a, b) => (b.level > a.level ? b : a));
      saved.hives = [best];
    }
    // Backfill up to MAX_HIVES slots
    while (saved.hives.length < MAX_HIVES) {
      saved.hives.push({
        id: nextId("hive"),
        level: 0,
        upgrading: false,
      });
    }
    if (saved.honey === undefined) saved.honey = 0;
    // Migrate legacy `fruit` bucket → split evenly across apples/pears/cherries in the typed pantry
    if ((saved as any).fruit !== undefined && (saved as any).fruit > 0) {
      const legacy = (saved as any).fruit;
      if (!saved.foods) (saved as any).foods = {};
      const each = legacy / 3;
      (saved.foods as any).apples = ((saved.foods as any).apples ?? 0) + each;
      (saved.foods as any).pears = ((saved.foods as any).pears ?? 0) + each;
      (saved.foods as any).cherries = ((saved.foods as any).cherries ?? 0) + each;
    }
    delete (saved as any).fruit;
    if (!saved.season) { saved.season = "spring"; saved.seasonElapsed = 0; saved.year = 1; }
    // Adventurer's Guild migration
    if (!saved.adventurers) saved.adventurers = [];
    if (!saved.activeMissions) saved.activeMissions = [];
    // Migrate old flat supplies to new per-adventurer shape (drop old data — low cost)
    for (const am of saved.activeMissions) {
      if ((am as any).supplies !== undefined) delete (am as any).supplies;
      if (!(am as any).adventurerSupplies) (am as any).adventurerSupplies = {};
    }
    if (!saved.completedMissions) saved.completedMissions = [];
    if (!saved.missionCompletions) saved.missionCompletions = {};
    if (!saved.missionBoard) saved.missionBoard = [];
    if (saved.missionRefreshIn === undefined) saved.missionRefreshIn = 0;
    // Force mission board refresh if missions lack tags (old save format)
    if (saved.missionBoard?.length > 0 && !(saved.missionBoard[0] as any).tags) {
      saved.missionBoard = [];
      saved.missionRefreshIn = 0;
    }
    // Rehydrate mission board from source data (picks up CDN image URLs etc.)
    if (saved.missionBoard?.length > 0) {
      saved.missionBoard = saved.missionBoard.map((m: any) => getMission(m.id) ?? m);
      // Force refresh if any mission still has old local image paths
      if (saved.missionBoard.some((m: any) => m.image && !m.image.startsWith("http"))) {
        saved.missionBoard = [];
        saved.missionRefreshIn = 0;
      }
    }
    // Chapel → Shrine rename
    for (const pb of saved.buildings) {
      if (pb.buildingId === "chapel") pb.buildingId = "shrine";
    }
    // Building damage migration
    for (const pb of saved.buildings) {
      if ((pb as any).damaged === undefined) (pb as any).damaged = false;
    }
    // Materials migration
    if (saved.wool === undefined) saved.wool = 0;
    if (saved.leather === undefined) saved.leather = 0;
    if (saved.bone === undefined) saved.bone = 0;
    if (saved.fiber === undefined) saved.fiber = 0;
    if (!saved.yearHarvest) saved.yearHarvest = {};
    for (const f of saved.fields) {
      if ((f as any).harvested === undefined) (f as any).harvested = false;
      // Migrate away from the forced-fallow counter — fallow is now a strategic choice.
      delete (f as any).harvestsBeforeFallow;
      delete (f as any).fallow;
      if ((f as any).lastCrop === undefined) (f as any).lastCrop = null;
      if ((f as any).sameCropStreak === undefined) (f as any).sameCropStreak = 0;
      if ((f as any).restBonus === undefined) (f as any).restBonus = false;
    }
    if (saved.clothing === undefined) saved.clothing = 0;
    if (saved.iron === undefined) saved.iron = 0;
    if (saved.tools === undefined) saved.tools = 0;
    if (saved.weapons === undefined) saved.weapons = 0;
    if (saved.armor === undefined) saved.armor = 0;
    if (saved.potions === undefined) saved.potions = 0;
    if (saved.gems === undefined) saved.gems = 0;
    if (!saved.herbs) saved.herbs = {};
    if (saved.foragedTotal === undefined) saved.foragedTotal = 0;
    if (!saved.exotics) saved.exotics = {};
    if (!saved.discoveredRecipes) saved.discoveredRecipes = [];
    if (saved.alchemyResearchAvailable === undefined) saved.alchemyResearchAvailable = true;
    if (saved.activeBlessing === undefined) saved.activeBlessing = null;
    if (saved.lastTradeAt === undefined) saved.lastTradeAt = 0;
    if (saved.ironMinedTotal === undefined) saved.ironMinedTotal = 0;
    if (!saved.inventory) saved.inventory = [];
    // One-time starting medical supplies for saves that predate them (bandages
    // to take on missions / use at home). Flag-guarded so it never re-grants.
    if (!(saved as any).startingSuppliesGiven) {
      const b = saved.inventory.find((i) => i.itemId === "bandage");
      if (b) b.quantity += 5; else saved.inventory.push({ itemId: "bandage", quantity: 5 });
      (saved as any).startingSuppliesGiven = true;
    }
    // Equipment migration: old 3-slot → new 11-slot
    const migrateEquipment = (adv: any) => {
      if (!adv.equipment) {
        adv.equipment = { head: null, chest: null, legs: null, boots: null, gloves: null, cloak: null, mainHand: null, offHand: null, ring1: null, ring2: null, amulet: null, trinket: null };
      } else if (adv.equipment.weapon !== undefined || adv.equipment.armor !== undefined) {
        // Old format — migrate
        adv.equipment = {
          head: null, chest: adv.equipment.armor ?? null, legs: null, boots: null,
          cloak: null, mainHand: adv.equipment.weapon ?? null, offHand: null,
          ring1: null, ring2: null, amulet: null, trinket: adv.equipment.trinket ?? null,
        };
      }
      if (!adv.bonusStats) adv.bonusStats = {};
    };
    for (const adv of saved.adventurers) migrateEquipment(adv);
    if (!saved.craftingQueue) saved.craftingQueue = [];
    if (!saved.buildingTools) saved.buildingTools = {};
    if (!saved.discoveredEnemies) saved.discoveredEnemies = [];
    // Migrate renamed enemy ids (2026-06-22) so the Bestiary keeps prior discoveries.
    {
      const ENEMY_ID_RENAMES: Record<string, string> = {
        wolf_pup: "gaunt_wolf",
        spooked_boar: "wild_boar",
        orc_warrior: "gharkal_raider",
        orc_warlord: "gharkal_warlord",
      };
      saved.discoveredEnemies = Array.from(
        new Set(saved.discoveredEnemies.map((id: string) => ENEMY_ID_RENAMES[id] ?? id)),
      );
    }
    // Migrate old resources.food to typed foods map
    if (!saved.foods) {
      const legacyFood = (saved.resources as any)?.food;
      saved.foods = migrateFoodsFromLegacy(typeof legacyFood === "number" ? legacyFood : 0);
    }
    if (saved.resources && "food" in saved.resources) {
      delete (saved.resources as any).food;
    }
    // Event log migration
    if (!saved.eventLog) saved.eventLog = [];
    // Ale & Happiness migration
    if (saved.ale === undefined) saved.ale = 0;
    if (saved.mead === undefined) saved.mead = 0;
    if (saved.cider === undefined) saved.cider = 0;
    if (saved.happiness === undefined) saved.happiness = 50;
    if (!saved.lastRaidOutcome) saved.lastRaidOutcome = "none";
    if (saved.lastRaidTime === undefined) saved.lastRaidTime = 0;
    // raidsResolvedCount is durable (doesn't decay). Backfill from event log
    // for older saves so quests like Baptism of Fire don't soft-lock players
    // who already weathered a raid before this counter existed.
    if (saved.raidsResolvedCount === undefined) {
      const priorRaids = (saved.eventLog ?? []).filter(
        (e: any) => e?.type === "raid_victory" || e?.type === "raid_defeat",
      ).length;
      saved.raidsResolvedCount = priorRaids;
    }
    // Backfill the quarry-spider gate to the CURRENT quarry level so existing
    // saves aren't retro-infested (they'd otherwise show a spider mission and
    // drop to previous-level yield on load).
    if (saved.quarrySpidersClearedLevel === undefined) {
      saved.quarrySpidersClearedLevel = saved.buildings?.find((b: any) => b.buildingId === "quarry")?.level ?? 1;
    }
    if (saved.starvationPenalty === undefined) saved.starvationPenalty = 0;
    if (saved.starvationHours === undefined) saved.starvationHours = 0;
    if (saved.newbornGlow === undefined) saved.newbornGlow = 0;
    // Initialize birth-roll tracker to current year so existing saves don't
    // immediately fire a make-up birth roll on first tick after upgrade.
    if (saved.lastBirthYear === undefined) saved.lastBirthYear = saved.year ?? 0;
    // Raid migration
    if (!saved.incomingRaids) saved.incomingRaids = [];
    if (saved.hoursSinceLastRaid === undefined) saved.hoursSinceLastRaid = 48;
    // Astral Shards migration
    if (saved.astralShards === undefined) saved.astralShards = 0;
    if (saved.lastDailyLogin === undefined) saved.lastDailyLogin = 0;
    if (saved.lastGuildVisit === undefined) saved.lastGuildVisit = 0;
    if (saved.lastMissionRefresh === undefined) saved.lastMissionRefresh = 0;
    if (saved.missionRerollToday === undefined) saved.missionRerollToday = false;
    if (saved.lastRerollReset === undefined) saved.lastRerollReset = Date.now();
    // Quest system migration
    if (!saved.questRewardsClaimed) saved.questRewardsClaimed = [];
    if (saved.firstMissionSent === undefined) saved.firstMissionSent = false;
    if (saved.introSeen === undefined) saved.introSeen = true; // existing saves have already "seen" the intro
    // Event system migration (May 2026): start fresh — events that should
    // have fired already will fire on next state evaluation. Banners are
    // ephemeral; replaying them on legacy saves is acceptable.
    if (!saved.firedEvents) saved.firedEvents = [];
    if (!saved.merchantVisitsFired) saved.merchantVisitsFired = [];
    if (!saved.tavernMenu) saved.tavernMenu = [...MENU_STAPLE_IDS];
    if (saved.tavernServers === undefined) saved.tavernServers = 0;
    if (!saved.tavernPricing) saved.tavernPricing = "fair";
    if (saved.tavernReputation === undefined) saved.tavernReputation = 0;
    if (!saved.pendingEvents) saved.pendingEvents = [];
    if (!saved.autoCook) saved.autoCook = {};
    else {
      // Multi-cook migration: autoCook went from one recipe per building
      // (string) to a slot list (string[]). Wrap any legacy string values.
      for (const k of Object.keys(saved.autoCook)) {
        const v = (saved.autoCook as any)[k];
        if (typeof v === "string") (saved.autoCook as any)[k] = [v];
      }
    }
    if (!saved.questsClaimableSeen) saved.questsClaimableSeen = [];
    // Existing saves: treat everyone already on the roster as "seen" so old
    // saves don't light up blue. New arrivals after this point will be unread.
    if (!saved.adventurersSeen) saved.adventurersSeen = (saved.adventurers ?? []).map((a: any) => a.id);
    if (!saved.buildingsSeen) {
      // Existing save — assume the player has already seen anything they could
      // possibly have built. We mark all currently-unlocked buildings as seen
      // so older saves don't suddenly light up blue everywhere.
      saved.buildingsSeen = BUILDINGS
        .filter((b) => isBuildingUnlocked(b, getTownHallLevel(saved.buildings)) &&
          isBuildingChapterUnlocked(b, saved as any))
        .map((b) => b.id);
    }
    if (!saved.recipesSeen) {
      // Same backfill story as buildingsSeen: any recipe whose building is at
      // the right level today is treated as already-seen on the legacy save.
      saved.recipesSeen = CRAFTING_RECIPES
        .filter((r) => {
          const b = saved.buildings.find((bb) => bb.buildingId === r.building);
          return (b?.level ?? 0) >= r.minLevel;
        })
        .map((r) => r.id);
    }
    // Chapter system migration (May 2026): backfill chapter state from existing
    // quest claims. Each storyline starts with chapter 1 (or 0 if locked) and
    // every chapter whose quests are all claimed is marked completed.
    if (!saved.chapters) {
      saved.chapters = [
        { storyline: "settlement", current: 1, completedChapters: [] },
        { storyline: "guild", current: 0, completedChapters: [] },
        { storyline: "story", current: 1, completedChapters: [] },
        { storyline: "defense", current: 0, completedChapters: [] },
        { storyline: "social", current: 1, completedChapters: [] },
      ];
      // Walk each storyline and mark chapters completed based on existing claims.
      for (const cs of saved.chapters) {
        const chaptersInStoryline = new Set(
          QUEST_DEFINITIONS
            .filter((q) => q.storyline === cs.storyline)
            .map((q) => q.chapter),
        );
        for (const chapter of [...chaptersInStoryline].sort((a, b) => a - b)) {
          const allClaimed = QUEST_DEFINITIONS
            .filter((q) => q.storyline === cs.storyline && q.chapter === chapter)
            .every((q) => saved.questRewardsClaimed.includes(q.id));
          if (allClaimed) {
            cs.completedChapters.push(chapter);
            cs.current = chapter + 1;
          } else if (cs.current === 0 && saved.questRewardsClaimed.some((id) =>
            QUEST_DEFINITIONS.find((q) => q.id === id)?.storyline === cs.storyline)) {
            // Storyline has at least one claimed quest; activate it.
            cs.current = chapter;
            break;
          } else {
            break;
          }
        }
      }
    }
    // Backfill the "social" storyline (The Folk) for saves made before it existed.
    if (saved.chapters && !saved.chapters.some((c) => c.storyline === "social")) {
      saved.chapters.push({ storyline: "social", current: 1, completedChapters: [] });
    }
    if (!saved.completedStoryMissions) saved.completedStoryMissions = [];
    if (!saved.completedUniqueMissionIds) saved.completedUniqueMissionIds = [];
    if (!saved.pendingRobins) saved.pendingRobins = [];
    if (!saved.firedRobins) saved.firedRobins = [];

    // Chapter pointer recompute (May 2026, idempotent). Legacy saves whose
    // pre-chapter linear quests are already done don't have any of the new
    // chapter-quest IDs in `questRewardsClaimed`, so the one-shot migration
    // above leaves their pointer stuck at chapter 1 even though they have
    // a sheep pen, tailoring shop, or upgraded Town Hall in their world.
    // This pass uses state evidence (built buildings, TH level) to bump
    // each storyline's `current` forward — never backward — so already-
    // earned content unlocks. Runs every load; cheap and safe.
    {
      const buildLvl = (id: string) =>
        saved.buildings?.find((b: any) => b.buildingId === id)?.level ?? 0;
      const hasPen = (animal: string) =>
        (saved.pens ?? []).some((p: any) => p.animal === animal && (p.level ?? 0) >= 1);
      const bumpTo = (storyline: string, target: number) => {
        const cs = saved.chapters?.find((c: any) => c.storyline === storyline);
        if (cs && cs.current < target) cs.current = target;
      };
      // Settlement storyline
      if (
        buildLvl("houses") >= 1 ||
        buildLvl("hunting_camp") >= 1 ||
        buildLvl("pantry") >= 1
      ) bumpTo("settlement", 2);
      if (
        hasPen("sheep") ||
        buildLvl("tailoring_shop") >= 1 ||
        buildLvl("shrine") >= 1
      ) bumpTo("settlement", 3);
      if (
        buildLvl("town_hall") >= 2 ||
        buildLvl("marketplace") >= 1 ||
        buildLvl("masons_guild") >= 1
      ) bumpTo("settlement", 4);
      // Guild storyline
      if (buildLvl("adventurers_guild") >= 1) bumpTo("guild", 1);
      if (buildLvl("woodworker") >= 1) bumpTo("guild", 2);
      // Defense storyline — any defense investment activates ch.1
      const hasDefense =
        ((saved as any).walls ?? []).some((w: any) => (w.level ?? 0) >= 1) ||
        ((saved as any).watchtowers ?? []).some((t: any) => (t.level ?? 0) >= 1) ||
        (saved.raidsResolvedCount ?? 0) > 0;
      if (hasDefense) bumpTo("defense", 1);
    }
    // Chronicle migration — entries fired and bio fragments unlocked
    if (!saved.chronicleEntriesFired) saved.chronicleEntriesFired = [];
    if (!saved.pendingChronicleBeats) saved.pendingChronicleBeats = [];
    if (!saved.chronicleEntriesSeen) saved.chronicleEntriesSeen = [];
    if (!saved.unlockedBioFragments) saved.unlockedBioFragments = [];
    if (!saved.bioFragmentsSeen) saved.bioFragmentsSeen = [];
    // Backfill the Arrival entry for players who already saw the intro
    if (saved.introSeen && !saved.chronicleEntriesFired.includes("ch1_arrival")) {
      saved.chronicleEntriesFired.push("ch1_arrival");
    }
    // Restructure (April 2026): "Edda's Cup" moved from journal entry to character fragment.
    // Players who completed the campfire quest before this change get the fragment backfilled.
    if (
      saved.questRewardsClaimed.includes("the_first_fire") &&
      !saved.unlockedBioFragments.includes("edda_first_fire")
    ) {
      saved.unlockedBioFragments.push("edda_first_fire");
    }
    // Rename (April 2026): edda_first_cup → edda_first_fire (fragment rewrite).
    const cupIdx = saved.unlockedBioFragments.indexOf("edda_first_cup");
    if (cupIdx !== -1) {
      saved.unlockedBioFragments.splice(cupIdx, 1);
      if (!saved.unlockedBioFragments.includes("edda_first_fire")) {
        saved.unlockedBioFragments.push("edda_first_fire");
      }
    }
    // Migrate adventurers missing xp/level fields
    for (const adv of saved.adventurers) {
      if ((adv as any).level === undefined) { (adv as any).level = 1; (adv as any).xp = 0; }
    }
    // Race/origin/backstory migration — backfill existing adventurers
    const backfillOrigin = (adv: any) => {
      if (adv.race) return; // already has origin data
      // Use name hash for deterministic assignment
      const hash = adv.name.split("").reduce((h: number, c: string) => h + c.charCodeAt(0), 0);
      // Pick race weighted by hash
      const raceRoll = (hash % 100) / 100;
      const race: Race = raceRoll < RACE_WEIGHTS.elf ? "elf" : raceRoll < RACE_WEIGHTS.elf + RACE_WEIGHTS.dwarf ? "dwarf" : "human";
      const origins = getOriginsForRace(race);
      const origin = origins[hash % origins.length];
      // Pick backstory, quirk, trait deterministically from hash
      const backstoryKeys = Object.keys(origin.backstories) as (keyof typeof origin.backstories)[];
      const backstory = origin.backstories[backstoryKeys[hash % backstoryKeys.length]];
      const quirk = PERSONALITY_QUIRKS[hash % PERSONALITY_QUIRKS.length];
      const trait = BACKSTORY_TRAITS[hash % BACKSTORY_TRAITS.length];
      adv.race = race;
      adv.origin = origin.id;
      adv.backstory = backstory;
      adv.quirk = quirk;
      adv.trait = trait.id;
    };
    for (const adv of saved.adventurers) backfillOrigin(adv);
    // Talent migration
    for (const adv of saved.adventurers) { if (!adv.talents) adv.talents = []; }
    // Food preference & loyalty migration
    const backfillFoodLoyalty = (adv: any) => {
      if (adv.foodPreference === undefined) {
        const hash = adv.name.split("").reduce((h: number, c: string) => h + c.charCodeAt(0), 0);
        adv.foodPreference = FOOD_PREFERENCES[hash % FOOD_PREFERENCES.length].id;
      }
      if (adv.loyalty === undefined) adv.loyalty = 0;
    };
    for (const adv of saved.adventurers) backfillFoodLoyalty(adv);
    // Match premade characters by backstory to fix renamed names/portraits
    const migratePremadeByBackstory = (adv: any) => {
      if (!adv.backstory) return;
      const match = PREMADE_CHARACTERS.find((c) => c.backstory === adv.backstory);
      if (!match) return;
      if (adv.name !== match.name) adv.name = match.name;
      if (adv.portrait !== match.portrait) adv.portrait = match.portrait;
    };
    for (const adv of saved.adventurers) migratePremadeByBackstory(adv);
    for (const pb of saved.buildings) {
      if (pb.upgrading && (pb as any).upgradeFinishTime) {
        pb.upgradeRemaining = Math.max(0, ((pb as any).upgradeFinishTime - Date.now()) / 1000);
        delete (pb as any).upgradeFinishTime;
      }
    }
    // Restore the ID counter past EVERY id-bearing collection. keptAnimals (+
    // hives/orchards) were missing, and seed dogs are created LAST (highest ids),
    // so the counter reset too low and a new stray collided with a seed dog.
    let maxId = 0;
    const idColls: ({ id: string }[] | undefined)[] = [saved.fields, saved.gardens, saved.pens, saved.hives, saved.orchards, saved.keptAnimals, saved.adventurers];
    for (const coll of idColls) {
      for (const item of coll ?? []) {
        const num = parseInt(item.id.replace(/^[a-z]+_/, ""), 10);
        if (!Number.isNaN(num) && num > maxId) maxId = num;
      }
    }
    idCounter = maxId + 1;
    // Repair any pre-existing duplicate ids (legacy saves): keep the first, give
    // later collisions a fresh id so lookups (e.g. assignAnimal) hit the right one.
    const seenIds = new Set<string>();
    for (const coll of idColls) {
      for (const item of coll ?? []) {
        if (seenIds.has(item.id)) item.id = nextId(item.id.replace(/_\d+$/, ""));
        seenIds.add(item.id);
      }
    }
    return saved;
}

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateSaveState(JSON.parse(raw) as GameState);
  } catch {
    return null;
  }
}

// ─── Season helpers ──────────────────────────────────────────────

const MAX_EVENT_LOG = 50;
/** Build the context object for a mission board refresh from current state.
 *  Both refresh sites (daily timer + paid reroll) need the same shape;
 *  caller provides the seed for determinism + the guild level. */
function buildMissionBoardContext(s: GameState, guildLevel: number, seed: number) {
  const aliveRanks = s.adventurers.filter((a) => a.alive).map((a) => a.rank);
  const bestRank = aliveRanks.length > 0 ? Math.max(...aliveRanks) : 1;
  return {
    guildLevel,
    count: getMissionBoardSize(guildLevel),
    seed,
    maxDifficulty: Math.min(5, bestRank + 1),
    completedStoryMissions: s.completedStoryMissions,
    completedUniqueMissionIds: s.completedUniqueMissionIds,
    buildings: s.buildings,
    pens: s.pens,
    adventurerRanks: aliveRanks,
    tavernReputation: s.tavernReputation ?? 0,
    missionCompletions: s.missionCompletions ?? {},
    rosterClasses: [...new Set(s.adventurers.filter((a) => a.alive).map((a) => a.class))],
    chronicleEntriesFired: s.chronicleEntriesFired,
    season: s.season,
  };
}

/** Capitalize the first letter (ring names like "outer"/"inner" read as sentence
 *  starts in event-log lines). */
function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function pushEvent(s: GameState, type: GameEventType, icon: string, message: string) {
  s.eventLog.unshift({ type, icon, message, timestamp: Date.now() });
  if (s.eventLog.length > MAX_EVENT_LOG) s.eventLog.length = MAX_EVENT_LOG;
}

/** Check whether a traveling merchant should arrive. One-shot per merchant,
 *  one visit open at a time. Sets pendingMerchantVisitId, which drives the
 *  visit modal. Mutates the state draft; call once per tick. */
function checkMerchantVisits(s: GameState): void {
  if (s.pendingMerchantVisitId) return; // a visit is already open
  const th = getTownHallLevel(s.buildings);
  for (const m of TRAVELING_MERCHANTS) {
    if (!m.requires) continue; // no first-passing-visit (e.g. mission-unlocked merchants)
    if ((s.merchantVisitsFired ?? []).includes(m.id)) continue;
    if (m.requires.thLevel && th < m.requires.thLevel) continue;
    s.merchantVisitsFired = s.merchantVisitsFired ?? [];
    s.merchantVisitsFired.push(m.id);
    s.pendingMerchantVisitId = m.id;
    return; // one visit at a time
  }
}

/** Recurring merchant visits: once the player has BOTH a marketplace and a
 *  tavern (and Cobb's first pass has happened), he comes back on a cadence and
 *  sets up a stall at the marketplace that lingers ~until morning. A better
 *  tavern (reputation) brings him sooner. Game-hour countdowns, so it behaves
 *  in dev fast-mode and prod alike. Mutates the draft; call once per tick. */
function updateMerchantRecurrence(s: GameState): void {
  // Each recurring merchant's visits begin once their unlock mission is done
  // (Cobb: the escort; Maren: the Road to Greyford). They return every 2-3 days
  // (reputation shortens it), keying off the daily 3AM-UTC boundary. One stall
  // at a time — a second due merchant queues until the first leaves, which
  // naturally offsets them so visits fill the gaps between each other.
  const done = new Set(s.completedUniqueMissionIds ?? []);
  const active = TRAVELING_MERCHANTS.filter((m) => m.returnUnlock && done.has(m.returnUnlock.missionDone));
  if (active.length === 0) return;

  const now = Date.now();
  s.merchantSchedule = s.merchantSchedule ?? {};
  // Newly-active merchants first return the next morning.
  for (const m of active) {
    if (s.merchantSchedule[m.id] === undefined) s.merchantSchedule[m.id] = next3amUTC(now);
  }

  // Close an expired stall; if one's still open, everyone else waits.
  if (s.merchantStall) {
    if (now >= s.merchantStall.expiresAt) s.merchantStall = undefined;
    else return;
  }

  // The earliest merchant whose arrival is due takes the (now free) stall.
  const due = active
    .filter((m) => (s.merchantSchedule![m.id] ?? Infinity) <= now)
    .sort((a, b) => s.merchantSchedule![a.id] - s.merchantSchedule![b.id]);
  if (due.length === 0) return;

  const m = due[0];
  const scheduled = s.merchantSchedule[m.id];
  const expiry = next3amUTC(scheduled);
  if (now < expiry) {
    s.merchantStall = { merchantId: m.id, expiresAt: expiry, takenOffers: [] };
  }
  // Reschedule this merchant 2-3 days on, skipping windows fully in the past.
  const intervalMs = merchantIntervalDays(s.tavernReputation ?? 0) * 86_400_000;
  let nextAt = scheduled + intervalMs;
  while (next3amUTC(nextAt) <= now) nextAt += intervalMs;
  s.merchantSchedule[m.id] = nextAt;
}

/** Run the narrative-event evaluator against a state draft. Fires any events
 *  whose triggers are now satisfied, queues their banners in pendingEvents,
 *  and applies their unlocks (storyline activation, chronicle entries).
 *  Loops to fixpoint so cascading unlocks resolve in one call. */
function applyEventEvaluation(s: GameState): void {
  for (let iter = 0; iter < 10; iter++) {
    const ready = getReadyEvents(s);
    if (ready.length === 0) return;
    for (const event of ready) {
      s.firedEvents.push(event.id);
      if (!event.silent) s.pendingEvents.push(event.id);
      if (event.unlocks?.activateStoryline) {
        const { storyline, chapter } = event.unlocks.activateStoryline;
        const cs = s.chapters.find((c) => c.storyline === storyline);
        if (cs && cs.current < chapter) {
          cs.current = chapter;
        }
      }
      if (event.unlocks?.chronicleEntryId) {
        if (!s.chronicleEntriesFired.includes(event.unlocks.chronicleEntryId)) {
          s.chronicleEntriesFired.push(event.unlocks.chronicleEntryId);
        }
      }
      if (event.unlocks?.addCitizens || event.unlocks?.addNamedResidents) {
        const genericAdd = event.unlocks.addCitizens;
        const namedAdd = event.unlocks.addNamedResidents;
        let totalAdded = 0;
        for (const cat of ["toddlers", "children", "adults", "elderly"] as const) {
          const g = genericAdd?.[cat] ?? 0;
          const nmd = namedAdd?.[cat] ?? 0;
          // Generic settlers join the anonymous pool. Named residents ("the
          // household") also raise the protected floor so RNG can't kill them.
          if (g > 0) {
            s.citizens[cat] += g;
            totalAdded += g;
          }
          if (nmd > 0) {
            s.citizens[cat] += nmd;
            s.namedResidents[cat] += nmd;
            totalAdded += nmd;
          }
        }
        if (totalAdded > 0) {
          // Build a "bringing X and Y" fragment from whatever the event also
          // adds (food + non-food resources). Keeps the log line specific to
          // what the player actually received, not a generic "joined" line.
          const bringings: string[] = [];
          if (event.unlocks.addFood) {
            for (const [type, amount] of Object.entries(event.unlocks.addFood)) {
              if (amount && amount > 0) bringings.push(`${amount} ${type}`);
            }
          }
          if (event.unlocks.addResources) {
            for (const [type, amount] of Object.entries(event.unlocks.addResources)) {
              if (amount && amount > 0) bringings.push(`${amount} ${type}`);
            }
          }
          // English list joiner with Oxford comma: one item stays as-is,
          // two items use "X and Y", three or more use "X, Y, and Z".
          const joinList = (items: string[]): string => {
            if (items.length <= 1) return items.join("");
            if (items.length === 2) return `${items[0]} and ${items[1]}`;
            return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
          };
          const tail = bringings.length > 0
            ? `, bringing ${joinList(bringings)}`
            : "";
          pushEvent(s, "citizen_born", "👤", `${totalAdded} new ${totalAdded === 1 ? "settler" : "settlers"} joined the camp${tail}.`);
        }
      }
      if (event.unlocks?.addFood) {
        const caps = calcStorageCaps(s.buildings);
        for (const [type, amount] of Object.entries(event.unlocks.addFood)) {
          if (amount && amount > 0 && isFoodItemType(type)) {
            addFood(s.foods, type, amount, caps.food);
          }
        }
      }
      if (event.unlocks?.addResources) {
        const r = event.unlocks.addResources;
        if (r.clothing) s.clothing += r.clothing;
        if (r.iron) s.iron += r.iron;
        if (r.wood) s.resources.wood += r.wood;
        if (r.stone) s.resources.stone += r.stone;
        if (r.gold) s.resources.gold += r.gold;
      }
      if (event.unlocks?.recruitPremadeIds) {
        // Roster named cast the moment the event fires (e.g. the Thornwood
        // siblings walking in with the family), rather than waiting on an
        // arrival condition. Idempotent: skip anyone already on the roster.
        const have = new Set(s.adventurers.map((a) => a.premadeId).filter(Boolean) as string[]);
        for (const pid of event.unlocks.recruitPremadeIds) {
          if (have.has(pid)) continue;
          const rec = buildRecruitFromPremadeId(nextId("adv"), pid, 1);
          if (rec) {
            s.adventurers.push(rec);
            have.add(pid);
          }
        }
      }
      if (event.unlocks?.raidSpawn) {
        const raid = RAID_POOL.find((r) => r.id === event.unlocks!.raidSpawn!.raidId);
        if (raid) {
          const yearBonus = 1 + (s.year - 1) * 0.20;
          const strength = Math.floor(raid.strength * yearBonus);
          const wtLevel = s.watchtowers
            .filter((t) => !t.damaged)
            .reduce((max, t) => Math.max(max, t.level), 0);
          const warningHours = calcWarningTime(raid.baseWarning, wtLevel);
          const scriptedWarning = event.unlocks!.raidSpawn!.warningSeconds;
          s.incomingRaids.push({
            raidId: raid.id,
            remaining: scriptedWarning ?? warningHours * 3600,
            strength,
            warned: true,
          });
          // Reset the probability timer so a random raid doesn't pile up on
          // this scripted one within the same window.
          s.hoursSinceLastRaid = 0;
          pushEvent(s, "raid_incoming", "⚠️", `${raid.name} approaching!`);
        }
      }
    }
  }
}

function isHarvestTime(season: Season, seasonElapsed: number): boolean {
  return season === "autumn" && seasonElapsed < HARVEST_DURATION_HOURS;
}

/** The damp aftermath of rain sprouts mushrooms at the Forager's Hut — a bonus
 *  yield in ANY season (the wet ground doesn't care what month it is), on top of
 *  the seasonal gather. A fraction of the hut's base rate, NOT scaled by the
 *  season modifier. Fires AFTER the rain (see forageBloomNow), not during. */
export const RAIN_FORAGE_MUSHROOM_FRACTION = 0.5;
export function isForagerBlooming(state: GameState): boolean {
  return forageBloomNow(state.season, state.seasonElapsed, state.year);
}

// ─── Derived calculations ────────────────────────────────────────

export interface BuildingStaffMember {
  id?: string;
  name: string;
  kind: "founder" | "adventurer";
  present: boolean;
  reason?: string;      // why absent OR working reduced (e.g. "away on a mission", "hurt")
  portrait?: string;
  /** How much of a full worker's pace this member is pulling right now, 0..1.
   *  A healthy present worker is 1; a wounded one scales down with HP; one
   *  carrying a serious cure-only condition (venom/froth) is bedridden → 0. */
  effectiveness: number;
}

/** A present worker's pace as a function of their HP fraction: full while
 *  healthy (a scratch doesn't slow the work), then ramping down once genuinely
 *  wounded, to 0 at death's door. The knee lets minor wounds pass while a badly
 *  hurt worker clearly drags their building. Tunable. */
const HEALTHY_WORK_HP = 0.5;
export function workEffectiveness(hpFrac: number): number {
  if (hpFrac >= HEALTHY_WORK_HP) return 1;
  return Math.max(0, hpFrac / HEALTHY_WORK_HP);
}
export interface BuildingStaffing {
  staffable: boolean;
  capacity: number;
  named: BuildingStaffMember[];
  kids: string[];       // flavour labels, 0 slots
  citizens: number;     // assigned townsfolk (incl. bench)
  active: number;       // present-named + citizens, capped at capacity
  multiplier: number;   // production multiplier (floored at prev level's full)
}

/** Coverage-model staffing for a production building. Founders are always
 *  present; adventurers are present unless deployed. Output floors at the
 *  previous level's full yield, so leveling never nerfs. Non-staffable
 *  buildings return multiplier 1 (untouched). */
export function getBuildingStaffing(s: GameState, buildingId: string, level: number): BuildingStaffing {
  const cfg = BUILDING_STAFF[buildingId];
  if (!cfg || level <= 0) {
    return { staffable: false, capacity: 0, named: [], kids: [], citizens: 0, active: 0, multiplier: 1 };
  }
  const capacity = staffCapacity(level);
  const named: BuildingStaffMember[] = [];
  for (const fid of cfg.founders ?? []) {
    const f = FOUNDING_CHARACTERS.find((x) => x.id === fid);
    // A hurt/sick founder still shows up but works reduced — the same lever a
    // wounded adventurer pulls, driven here by a building ailment.
    const ail = s.buildingAilments?.[buildingId];
    const ailDef = ail && ail.founderId === fid ? getAilment(ail.ailmentId) : undefined;
    const effectiveness = ailDef ? Math.max(0, 1 - ailDef.workPenalty) : 1;
    const reason = ailDef ? `${f?.name ?? fid} has ${ailDef.name.toLowerCase()}` : undefined;
    named.push({ id: fid, name: f?.name ?? fid, kind: "founder", present: true, portrait: f?.portrait, effectiveness, reason });
  }
  for (const aid of cfg.adventurers ?? []) {
    const adv = s.adventurers.find((a) => a.premadeId === aid && a.alive);
    const present = !!adv && !adv.onMission;
    // A present adventurer still works, but not at full pace if they're hurt: a
    // serious cure-only wound (venom/froth) benches them entirely, otherwise
    // their HP scales the share. So a wounded hunter brings home less.
    let effectiveness = 0;
    let reason: string | undefined;
    if (!adv) {
      reason = "not yet arrived";
    } else if (adv.onMission) {
      reason = `${adv.name} is away on a mission`;
    } else if (adv.conditions?.some((c) => c.type === "venom" || c.type === "froth")) {
      reason = `${adv.name} is too ill to work`;
    } else {
      const maxHp = calcAdventurerMaxHp(adv);
      const hpFrac = maxHp > 0 ? (adv.currentHp ?? maxHp) / maxHp : 1;
      effectiveness = workEffectiveness(hpFrac);
      if (effectiveness < 1) reason = `${adv.name} is hurt and working slow`;
    }
    named.push({
      id: aid, name: adv?.name ?? aid, kind: "adventurer", present, reason,
      portrait: adv ? getPortraitUrl(adv) : undefined, effectiveness,
    });
  }
  const presentNamed = named.filter((n) => n.present).length;
  const citizens = s.buildingWorkers?.[buildingId] ?? 0;
  // Bodies present (integer) drive the "Staff X/Y" display; effective share (a
  // hurt worker counts as a fraction) drives the production multiplier.
  const active = Math.min(presentNamed + citizens, capacity);
  const namedEffective = named.reduce((sum, n) => sum + n.effectiveness, 0);
  const effectiveStaff = Math.min(namedEffective + citizens, capacity);
  const raw = capacity > 0 ? effectiveStaff / capacity : 1;
  // Floor at the previous level's full yield (or the lvl-1 "folk pitch in" floor).
  let floor = STAFF_LVL1_FLOOR;
  if (level > 1) {
    const def = BUILDINGS.find((b) => b.id === buildingId);
    const cur = def?.levels[level - 1]?.production?.rate ?? 0;
    const prev = def?.levels[level - 2]?.production?.rate ?? 0;
    floor = cur > 0 ? Math.min(1, prev / cur) : STAFF_LVL1_FLOOR;
  }
  const multiplier = Math.max(floor, Math.min(1, raw));
  return { staffable: true, capacity, named, kids: cfg.kids ?? [], citizens, active, multiplier };
}

/** This year's climate band (drought/dry/normal/wet/deluge). GLOBAL: keyed to
 *  the world/wall-clock year (getGlobalSeason), so every player at the same real
 *  time gets the same good/bad year — the shared basis the water storage/trade
 *  economy needs. No backend: it's a pure function of the clock, like the
 *  ambient weather. */
function cropClimateBand(_state: GameState): ClimateBand {
  return climateOverrideBand() ?? getClimate(getGlobalSeason().year);
}
function buildingLevel(s: GameState, id: string): number {
  return s.buildings.find((b) => b.buildingId === id)?.level ?? 0;
}

/** Total water the growing crops want per hour — scales with how much is
 *  actually growing (field acreage, sprouted garden plants, bearing trees). */
function cropWaterDemand(s: GameState): number {
  let d = 0;
  for (const f of s.fields) if (f.level > 0 && f.crop) d += fieldWaterDemand(f.level);
  for (const g of s.gardens) {
    if (g.level > 0 && g.plantedYear != null) {
      d += gardenWaterDemand(g.veggie, g.plantsAlive ?? 0);
    }
  }
  for (const o of s.orchards) if (o.level > 0 && (o.matureTrees ?? 0) > 0) d += orchardWaterDemand(o.matureTrees);
  return d;
}

/** The sky right now (drives the momentary rain boost on cistern catch). */
function currentWeatherOf(s: GameState) {
  return resolveCurrentWeather(s.season, s.seasonElapsed, getGlobalSeason().year);
}
/** Water the livestock drink each hour (year-round, per head). */
function animalWaterDemand(s: GameState): number {
  let d = 0;
  for (const p of s.pens) if (p.level > 0) d += penWaterDemand(p.count);
  return d;
}
// Founding-year water grace (year 1): the folk drink less and the stream runs
// fuller, so a summer start has breathing room before a well/cistern exists.
const FOUNDING_WATER_DEMAND_GRACE = 0.6;
const FOUNDING_WATER_STREAM_GRACE = 1.4;
/** Water the settlement's folk drink each hour (year-round, spikes in summer). */
function citizenWaterDemand_(s: GameState): number {
  const c = s.citizens;
  const pop = c.toddlers + c.children + c.adults + c.elderly;
  // Founding-year grace: the folk are few and frugal while the settlement finds
  // its feet (mirrors the year-1 crop grace), so a summer start isn't instantly
  // in the red before there's a well or cistern to dig.
  const grace = s.year <= 1 ? FOUNDING_WATER_DEMAND_GRACE : 1;
  return Math.round(citizenWaterDemand(pop, s.season, cropClimateBand(s)) * grace);
}
/** The stream's status this tick — drives its water yield AND the fishing catch
 *  (same low water, fewer fish): flowing / low (summer, dry) / frozen / dry. */
function streamStatusOf(s: GameState): StreamStatus {
  return streamStatus(cropClimateBand(s), s.season);
}

/** One place computing the water flows this tick (water/hour). The stream + well
 *  + caught rain FILL the reserve; citizens, livestock and the crops DRAW it.
 *  Crops drink continuously EXCEPT while it's raining (the sky waters them then),
 *  thirstier in a dry-year heat. When the reserve runs dry the crops go short
 *  (citizens and livestock have priority).
 *
 *  The cistern's SLUICE flips the whole model: open, intake to the reserve is
 *  paused and it drains out (the settlement drinks from the live flow instead of
 *  the store), so the reserve runs low and a downpour can't back up and drown
 *  the fields. Shut (default) it banks a buffer for the dry years. */
function waterBalance(s: GameState) {
  const band = cropClimateBand(s);
  const weather = currentWeatherOf(s);
  const raining = isRainingNow(s);
  // A damaged cistern holds/catches as if a level lower, and its sluice can't be
  // worked until repaired; a damaged well gives no water at all.
  const cisternBldg = s.buildings.find((b) => b.buildingId === CISTERN_ID);
  const cisternDamaged = cisternBldg?.damaged ?? false;
  const cisternLvl = Math.max(0, (cisternBldg?.level ?? 0) - (cisternDamaged ? 1 : 0));
  const sluiceOpen = (s.cisternSluiceOpen ?? false) && cisternLvl > 0 && !cisternDamaged;

  // Live sources. Shut, they fill the reserve; open, they flow straight past it
  // (still there to drink, just not banked — shown as "paused" in the breakdown).
  // Founding-year grace: the springs run a touch fuller the first year (see
  // citizenWaterDemand_ for the paired demand grace).
  const streamGrace = s.year <= 1 ? FOUNDING_WATER_STREAM_GRACE : 1;
  const stream = STREAM_YIELD * streamFactor(streamStatus(band, s.season)) * streamGrace;
  const wellBldg = s.buildings.find((b) => b.buildingId === WELL_ID);
  const well = wellBldg?.damaged ? 0 : getWellOutput(wellBldg?.level ?? 0) * wellFactor(band);
  const rain = getCisternRainCatch(cisternLvl) * climateRainFactor(band) * ambientRainFactor(weather);
  const liveInflow = stream + well + rain;
  const banked = sluiceOpen ? 0 : liveInflow; // what actually enters the reserve
  const sluiceDrain = sluiceOpen ? getSluiceDrain(cisternLvl) : 0;

  const citizens = citizenWaterDemand_(s);
  const animals = animalWaterDemand(s);
  // What the crops want per hour (thirstier in the heat), and what they draw now
  // (nothing while it's raining — the sky waters them).
  const cropNeed = cropWaterDemand(s) * cropHeatFactor(band);
  const cropDraw = raining ? 0 : cropNeed;

  // Coverage: shut, crops are watered while the reserve holds; once empty they
  // get only the inflow left after citizens + livestock. Open, there IS no store
  // to fall back on, so the live flow covers folk/livestock first, then crops.
  const reserve = s.resources.water ?? 0;
  let cropCoverage: number;
  if (raining || cropDraw <= 0) cropCoverage = 1;
  else if (!sluiceOpen && reserve > 0.0001) cropCoverage = 1;
  else cropCoverage = Math.min(1, Math.max(0, liveInflow - citizens - animals) / cropDraw);

  // Net change to the STORED reserve: shut, inflow minus the draws; open, just
  // the sluice bleeding it down (draws are met by the live flow, not the store).
  const net = sluiceOpen ? -sluiceDrain : banked - citizens - animals - cropDraw;

  return { band, weather, raining, cisternLvl, cisternDamaged, sluiceOpen, sluiceDrain,
    stream, well, rain, inflow: liveInflow,
    citizens, animals, cropNeed, cropDraw, cropCoverage,
    streamStatus: streamStatus(band, s.season), net };
}

/** Is it actively raining right now? (Rain waters the crops directly, pausing
 *  their draw on the reserve.) */
function isRainingNow(s: GameState): boolean {
  const w = currentWeatherOf(s);
  return w === "rain" || w === "heavy_rain" || w === "storm" || w === "unnatural_storm";
}
/** Crop-yield multiplier. First year is graced (×1). Wet years carry a
 *  waterlogging penalty on the whole year's yield (the cistern sluice handles
 *  the momentary DROWNING of a downpour, not this baseline). The dry side is
 *  MOMENTARY: rain waters the crops for free right now, and the rest of the time
 *  they drink the reserve — full yield while it holds, thirsty once it runs dry. */
function cropYieldMult(state: GameState): number {
  if (state.year <= 1) return 1;
  const band = cropClimateBand(state);
  if (isWetBand(band)) return getClimateYield(band);
  return waterBalance(state).cropCoverage;
}

/** Apply a survival fraction to a garden's living plants, never taking the LAST
 *  one from environmental death: a hardy plant always pulls through, so an away
 *  player returns to a thinned plot they can re-sow, never a graveyard. */
function wiltGardenPlants(g: PlayerGarden, survive: number): number {
  const alive = g.plantsAlive ?? 0;
  if (alive <= 1) return 0;
  const next = Math.max(1, Math.floor(alive * survive));
  g.plantsAlive = next;
  return alive - next;
}

/** Momentary crop damage from a harsh WEATHER event (heat wave / downpour),
 *  per game-hour while the event lasts. A heat wave carries a small heat toll
 *  even when watered (the deficit half is handled by applyDeficitWilt). A
 *  downpour drowns the roots in proportion to how full the reserve is (a low
 *  cistern / open sluice sheds the flood). Gardens + orchard saplings lose living
 *  plants (a garden never below its last plant); fields accrue a harvest-loss
 *  fraction. Mature orchard trees weather it untouched. */
function applyWeatherCropDamage(s: GameState, weather: WeatherType, elapsedHours: number): void {
  if (elapsedHours <= 0 || s.year <= 1) return;
  if (s.season === "winter") return; // nothing standing to lose
  let rate = 0;
  if (weather === "heat_wave") {
    rate = HEATWAVE_HEAT_KILL_PER_HOUR; // heat toll only — thirst is applyDeficitWilt
  } else if (weather === "heavy_rain") {
    // Drowning scales with how full the reserve is: a full cistern backs up onto
    // the fields, a low one (sluice open) sheds the flood harmlessly. Keeping the
    // cistern low in a wet spell is the whole defence.
    const cb = s.buildings.find((x) => x.buildingId === CISTERN_ID);
    const cap = getWaterCap(Math.max(0, (cb?.level ?? 0) - (cb?.damaged ? 1 : 0)));
    const fill = cap > 0 ? (s.resources.water ?? 0) / cap : 0;
    rate = DELUGE_DROWN_KILL_PER_HOUR * delugeDrownFactor(fill);
    if (rate <= 0) return;
  } else {
    return;
  }
  const survive = Math.pow(1 - rate, elapsedHours);
  if (survive >= 1) return;
  let lost = 0;
  for (const g of s.gardens) {
    if (g.plantedYear != null) lost += wiltGardenPlants(g, survive);
  }
  if (lost > 0) {
    s.plantsWiltedEnv = (s.plantsWiltedEnv ?? 0) + lost;
    s.lastWiltCause = weather === "heat_wave" ? "heat" : "drown";
  }
  for (const o of s.orchards) {
    if (o.saplings?.length) {
      for (const c of o.saplings) c.count = Math.floor(c.count * survive);
      o.saplings = o.saplings.filter((c) => c.count > 0);
    }
  }
  for (const f of s.fields) {
    if (f.level > 0 && f.crop) {
      const prev = f.weatherLoss ?? 0;
      f.weatherLoss = Math.min(1, 1 - (1 - prev) * survive);
    }
  }
}

/** A SUSTAINED water deficit slowly wilts standing crops, whatever the weather —
 *  the deficit half of crop stress (what the old heat-wave "thirst" term did),
 *  generalised to any time coverage < 1. Rate scales with how far below full
 *  coverage you are, so covering crop demand (cistern/well/water runs) is the
 *  whole defence; a bone-dry plot in a dry summer thins over many hours, slow
 *  enough to answer with a water run and never a wipe (the last plant holds).
 *  Yield already falls with coverage; this is the death half. */
function applyDeficitWilt(s: GameState, coverage: number, elapsedHours: number): void {
  if (elapsedHours <= 0 || s.year <= 1 || s.season === "winter") return;
  const shortfall = 1 - Math.min(1, Math.max(0, coverage));
  if (shortfall <= 0) return;
  const survive = Math.pow(1 - CHRONIC_WILT_PER_HOUR * shortfall, elapsedHours);
  if (survive >= 1) return;
  let lost = 0;
  for (const g of s.gardens) {
    if (g.plantedYear != null) lost += wiltGardenPlants(g, survive);
  }
  if (lost > 0) {
    s.plantsWiltedEnv = (s.plantsWiltedEnv ?? 0) + lost;
    s.lastWiltCause = "thirst";
  }
  for (const o of s.orchards) {
    if (o.saplings?.length) {
      for (const c of o.saplings) c.count = Math.floor(c.count * survive);
      o.saplings = o.saplings.filter((c) => c.count > 0);
    }
  }
}

/** Are the people fed this tick? True while the larder holds real food OR there
 *  is honey — honey is eaten like any other food, drawn down alongside the larder
 *  in proportion to the stock (see the tick's food consumption). */
function peopleAreFed(s: GameState): boolean {
  return getTotalFood(s.foods) > 0 || (s.honey ?? 0) > 0;
}

/** What a food-gathering building brings home per hour, broken into its parts. */
export interface GatheredFood {
  /** Which pantry item it fills (meat/fish/berries/mushrooms/nuts). */
  type: FoodItemType;
  label: string;
  icon: string;
  /** Base level rate before any modifier — the "full N/h" hint. */
  full: number;
  seasonMod: number;
  staffMult: number;
  /** Hunting-dog boost fraction (camp only; 0 elsewhere). */
  huntBoost: number;
  /** THE effective rate: season -> staffing -> dogs, floored stepwise the way
   *  the tick applies them. Every surface reads this so nothing can drift. */
  rate: number;
  /** Forager-only: extra mushrooms after rain, off the full (unstaffed) rate. */
  rainMushrooms: number;
}

/** Single source of truth for a food-gathering building's yield — the hunting
 *  camp, forager's hut, and fishing hut. The tick, the netFoodPerHour
 *  projection, the Overview food dropdown, and the building card all read this,
 *  so a short-handed or dog-boosted camp reads the same number everywhere.
 *  Returns null for anything that isn't one of the three gatherers; callers skip
 *  damaged buildings (a wrecked camp brings nothing home). */
export function gatheredFoodRate(state: GameState, pb: PlayerBuilding): GatheredFood | null {
  const def = BUILDINGS.find((b) => b.id === pb.buildingId);
  const levelDef = def?.levels[pb.level - 1];
  if (!def || !levelDef?.production || levelDef.production.resource !== "food") return null;
  const { season } = state;
  const full = levelDef.production.rate;
  // The seasonal curve lives in ONE place (GATHERING_SEASON_MOD via
  // gatheringSeasonMod) instead of tables re-typed in each caller.
  const seasonMod = gatheringSeasonMod(pb.buildingId, season) ?? 1;

  let type: FoodItemType;
  let icon: string;
  let label: string;
  let rainMushrooms = 0;
  if (pb.buildingId === "hunting_camp") {
    type = "meat"; icon = "🍖"; label = "Meat";
  } else if (pb.buildingId === "forager_hut") {
    if (season === "autumn") { type = "mushrooms"; icon = "🍄"; label = "Mushrooms"; }
    else if (season === "winter") { type = "nuts"; icon = "🌰"; label = "Nuts"; }
    else { type = "berries"; icon = "🫐"; label = "Berries"; }
    // Rain sprouts a mushroom bonus in any season, off the FULL (unstaffed) rate,
    // exactly as the tick adds it.
    if (isForagerBlooming(state)) rainMushrooms = Math.floor(full * RAIN_FORAGE_MUSHROOM_FRACTION);
  } else if (pb.buildingId === "fishing_hut") {
    type = "fish"; icon = "🐟"; label = "Fish";
  } else {
    return null;
  }

  const staffMult = isStaffable(pb.buildingId)
    ? getBuildingStaffing(state, pb.buildingId, pb.level).multiplier
    : 1;
  const huntBoost = pb.buildingId === "hunting_camp"
    ? Math.min(0.5, state.keptAnimals.reduce((b, a) => a.job === "hunt" ? b + 0.08 * Math.max(1, a.huntLevel) : b, 0))
    : 0;

  let rate = Math.floor(full * seasonMod);
  rate = Math.floor(rate * staffMult);
  if (huntBoost > 0) rate = Math.floor(rate * (1 + huntBoost));

  return { type, label, icon, full, seasonMod, staffMult, huntBoost, rate, rainMushrooms };
}

function calcProductionRates(state: GameState): { gold: number; wood: number; stone: number; food: number } {
  const { buildings, fields, gardens, pens, citizens, season, seasonElapsed } = state;
  const rates = { gold: 0, wood: 0, stone: 0, food: 0 };

  // Citizen tax — only adults pay (children and elderly don't generate the
  // same tax base; toddlers obviously not).
  rates.gold += citizens.adults * GOLD_TAX_PER_CITIZEN_PER_HOUR;

  // Building production — damaged buildings don't produce. Food-gathering
  // buildings carry seasonal + staffing + dog modifiers via gatheredFoodRate().
  for (const pb of buildings) {
    if (pb.level === 0 || pb.damaged) continue;
    const def = BUILDINGS.find((b) => b.id === pb.buildingId);
    if (!def) continue;
    let levelDef = def.levels[pb.level - 1];
    // Quarry-spider gate: the quarry yields at its deepest SPIDER-CLEARED level.
    // Upgrading past the spiders gives the new building level, but stone output
    // holds at the previous level's rate until "Clear the Diggings" is done.
    // NOTE: clear_diggings missions exist for L2-L3 only, which matches Ch1's
    // tier cap (buildings max L3 before Village). Deeper levels (L4+) don't
    // unlock in the alpha; wire their spider content when higher tiers ship.
    if (pb.buildingId === "quarry") {
      const eff = Math.min(pb.level, state.quarrySpidersClearedLevel ?? pb.level);
      levelDef = def.levels[eff - 1] ?? levelDef;
    }
    if (levelDef?.production) {
      const res = levelDef.production.resource as keyof typeof rates;
      // Food gatherers (hunting/forager/fishing) get season + staffing + dogs
      // from the shared gatheredFoodRate() helper — the one source of truth.
      const gathered = gatheredFoodRate(state, pb);
      if (gathered) {
        rates.food += gathered.rate;
      } else {
        let rate = levelDef.production.rate;
        // Staff coverage — non-gathering staffable buildings still scale by staffing.
        if (isStaffable(pb.buildingId)) {
          rate = Math.floor(rate * getBuildingStaffing(state, pb.buildingId, pb.level).multiplier);
        }
        if (res in rates) rates[res] += rate;
      }
    }
  }

  // Climate multiplier scales all crop yields (fields/gardens/orchards) this year.
  const cm = cropYieldMult(state);

  // Fields — harvest burst in autumn
  if (isHarvestTime(season, seasonElapsed)) {
    for (const field of fields) {
      if (field.level === 0 || !field.crop) continue;
      const crop = getCrop(field.crop);
      if (crop.isFood) {
        rates.food += (getSeasonYield(crop, field.level) / HARVEST_DURATION_HOURS) * cm;
      }
    }
  }

  // Gardens — produce only if planted this cycle and in a produce season
  for (const garden of gardens) {
    if (garden.level === 0) continue;
    if (garden.plantedYear == null) continue;
    const veggie = getVeggie(garden.veggie);
    if (isVeggieProducing(veggie, season)) {
      rates.food += getLiveGardenRate(garden.level, garden.plantsAlive ?? 0) * cm;
    }
  }

  // Pens — produce year-round, but also consume food
  for (const pen of pens) {
    if (pen.level === 0) continue;
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.count);
    rates.food += prod.produced;
  }

  return rates;
}

function calcAnimalFoodConsumption(pens: PlayerPen[]): number {
  let total = 0;
  for (const pen of pens) {
    if (pen.level === 0) continue;
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.count);
    total += prod.consumed;
  }
  return total;
}

/** Drain up to `amount` units of hay from the field ricks (mutating), taking
 *  from the fullest rick first so a near-empty one isn't stranded with a scrap.
 *  Returns how much hay was actually eaten. */
function consumeHayFromFields(fields: PlayerField[], amount: number): number {
  let need = amount;
  let taken = 0;
  const ricks = fields
    .filter((f) => (f.hay ?? 0) > 0)
    .sort((a, b) => (b.hay ?? 0) - (a.hay ?? 0));
  for (const f of ricks) {
    if (need <= 0) break;
    const t = Math.min(f.hay ?? 0, need);
    f.hay = (f.hay ?? 0) - t;
    need -= t;
    taken += t;
  }
  return taken;
}

/** Feed each pen and return its per-pen fedRatio (0-1). Grazers (sheep/goats)
 *  live off free wild grass spring→autumn; in winter the grass is gone and they
 *  eat the hay ricked on the fields at harvest, then fall back to larder
 *  grain/veggies, then starve. Non-grazers always eat from the larder.
 *  Mutates pen.starving and field.hay. */
function applyAnimalFeed(s: GameState, elapsedHours: number): Map<string, number> {
  const fedRatios = new Map<string, number>();
  if (!s.pens.length || elapsedHours <= 0) return fedRatios;

  const isWinter = s.season === "winter";

  // Winter only: split the finite hay stock across grazing flocks by consumption.
  let totalGrazerDemand = 0;
  let totalHay = 0;
  if (isWinter) {
    for (const pen of s.pens) {
      if (pen.level === 0 || !isGrazer(pen.animal)) continue;
      totalGrazerDemand += getPenProduction(getAnimal(pen.animal), pen.count).consumed;
    }
    for (const f of s.fields) totalHay += f.hay ?? 0;
  }

  for (const pen of s.pens) {
    if (pen.level === 0) {
      fedRatios.set(pen.id, 1);
      pen.starving = false;
      continue;
    }
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.count);
    const baseNeed = prod.consumed * elapsedHours;
    if (baseNeed <= 0) {
      fedRatios.set(pen.id, 1);
      pen.starving = false;
      continue;
    }

    let covered = 0;

    if (isGrazer(pen.animal)) {
      if (!isWinter) {
        // Free wild grass covers the whole flock in the warm seasons.
        covered = baseNeed;
      } else if (totalGrazerDemand > 0 && totalHay > 0) {
        // This flock's fair slice of the winter hay ricks.
        const share = prod.consumed / totalGrazerDemand;
        const want = Math.min(baseNeed, totalHay * share);
        covered += consumeHayFromFields(s.fields, want);
      }
    }

    // Larder covers any shortfall — all of it for non-grazers, and for grazers
    // the winter gap once grass and hay run out.
    const remaining = Math.max(0, baseNeed - covered);
    if (remaining > 0 && s.foods) {
      covered += consumeFromCategories(s.foods, ANIMAL_FEED[pen.animal], remaining);
    }

    const ratio = Math.max(0, Math.min(1, covered / baseNeed));
    fedRatios.set(pen.id, ratio);

    const wasStarving = pen.starving === true;
    pen.starving = ratio < 0.5;
    if (pen.starving && !wasStarving) {
      pushEvent(s, "pen_starving", "🥀", `The ${animal.name.toLowerCase()} pen is starving — no food to see it through.`);
    }
  }

  return fedRatios;
}

/** Flock population change each tick (livestock slice 2): a fed flock breeds in
 *  the warm seasons (needs a pair + room, never past capacity); an unfed flock
 *  loses head to hunger. Mutates pen.count. Never auto-culls — shrinkage is only
 *  starvation; deliberate culling is a separate player action. See DESIGN_LIVESTOCK.md. */
// ── Kept animals: the living layer (leveling, growth, happiness, breeding, strays) ──
/** Room for dogs is set by the Kennel (none without one). Owner-bound dogs (a
 *  character's own hound, e.g. Nessa's) don't live in the kennel and so don't
 *  count against it. */
function dogCapacity(s: GameState): number {
  return kennelDogCapacity(buildingLevel(s, "kennel"));
}
/** Dogs in the settlement's OWN managed pack (excludes owner-bound hounds). */
function packDogCount(s: GameState): number {
  return s.keptAnimals.filter((a) => a.species === "dog" && !a.keeper).length;
}
const DOG_IMG = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/dogs";
/** Nessa's own hunting hound — Ser Sniffsalot, a scent-tracker — arrives with
 *  the Hunting Camp, auto-posted to the hunt. Owner-bound (Nessa's), so he's
 *  outside the Kennel and can't be reassigned. Idempotent by name. */
function grantHuntingCampDog(s: GameState): void {
  if (s.keptAnimals.some((a) => a.name === "Ser Sniffsalot")) return;
  s.keptAnimals.push({
    id: nextId("animal"), name: "Ser Sniffsalot", species: "dog", breed: "scent_hound",
    portrait: `${DOG_IMG}/scent_hound.png`,
    nameFixed: true, keeper: "Nessa", origin: "thornwoods", job: "hunt",
    guardLevel: 0, huntLevel: 3, jobHours: 0, happiness: 88,
  });
  pushEvent(s, "animal_stray", "🐕", "Nessa's hound, Ser Sniffsalot, has taken up at the hunting camp and works the hunt at her heel.");
}
/** Truffle, a mongrel stray Nell took in, gets a proper home the first time a
 *  Kennel is raised. He arrives idle so the player picks his job. Idempotent by name. */
function grantStrayTruffle(s: GameState): void {
  if (s.keptAnimals.some((a) => a.name === "Truffle")) return;
  s.keptAnimals.push({
    id: nextId("animal"), name: "Truffle", species: "dog", breed: "mongrel",
    portrait: pickAdultPortrait("mongrel", usedDogPortraits(s)),
    nameFixed: true, origin: "stray", job: "idle", guardLevel: 0, huntLevel: 1, jobHours: 0, happiness: 74,
  });
  pushEvent(s, "animal_stray", "🐕", "Truffle has a proper place at last. The stray is yours to put to work now, on the hunt or guarding a fold.");
}
/** A posted houndsman speeds the dogs' training by this factor. */
const HOUNDSMAN_TRAIN_SPEEDUP = 1.5;
const PUPPY_GROW_HOURS = 48;      // ~2 growing seasons to grow up
const SKILL_LEVEL_HOURS = 24;     // ~a season on the job per skill level
const APTITUDE_SPEEDUP = 1.6;     // a breed levels its favored skill this much faster
const DOG_HAPPY_THRESHOLD = 60;   // a dog must be this happy to breed
const BREED_CHANCE_PER_HOUR = 0.012;
const STRAY_CHANCE_PER_HOUR = 0.005;

/** Parent-child or shared-parent (siblings) — the pairs breeding must avoid. */
function keptAnimalsRelated(a: KeptAnimal, b: KeptAnimal): boolean {
  if (a.sireId === b.id || a.damId === b.id) return true;
  if (b.sireId === a.id || b.damId === a.id) return true;
  if (a.sireId && (a.sireId === b.sireId || a.sireId === b.damId)) return true;
  if (a.damId && (a.damId === b.sireId || a.damId === b.damId)) return true;
  return false;
}

/** Starting skills for a newly-arrived adult, biased by its breed's aptitude. */
function aptitudeStartSkills(breed: string): { guardLevel: number; huntLevel: number } {
  const apt = breedAptitude(breed);
  if (apt === "guard") return { guardLevel: 1 + Math.floor(Math.random() * 2), huntLevel: 0 };
  if (apt === "hunt") return { guardLevel: 0, huntLevel: 1 + Math.floor(Math.random() * 2) };
  return Math.random() < 0.5 ? { guardLevel: 1, huntLevel: 0 } : { guardLevel: 0, huntLevel: 1 };
}

const usedDogPortraits = (s: GameState) => new Set(s.keptAnimals.map((a) => a.portrait));
function pickDogName(s: GameState): string {
  const used = new Set(s.keptAnimals.map((a) => a.name));
  const free = DOG_NAMES.filter((n) => !used.has(n));
  const pool = free.length ? free : DOG_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Per-tick: puppies grow, working dogs level their skill, happiness drifts, and
 *  two happy unrelated adults may have a pup / a stray may wander in (both capped). */
function applyKeptAnimalTick(s: GameState, elapsedHours: number): void {
  if (elapsedHours <= 0 || !s.keptAnimals) return;
  const dogs = s.keptAnimals.filter((a) => a.species === "dog");
  // A houndsman posted at the Kennel trains the pack faster.
  const kennelLvl = buildingLevel(s, "kennel");
  const houndsman = getBuildingStaffing(s, "kennel", kennelLvl).active > 0;
  const trainSpeed = houndsman ? HOUNDSMAN_TRAIN_SPEEDUP : 1;

  for (const d of dogs) {
    const apt = breedAptitude(d.breed ?? "");
    // Happiness drifts toward a target set by the dog's situation.
    let target: number;
    if (d.isPuppy) target = 78;
    else if (d.job === "idle") target = 55;
    else if ((d.job === "guard" && apt === "guard") || (d.job === "hunt" && apt === "hunt")) target = 92;
    else target = 74;
    d.happiness = Math.max(0, Math.min(100, d.happiness + (target - d.happiness) * Math.min(1, 0.08 * elapsedHours)));

    if (d.isPuppy) {
      d.jobHours += elapsedHours;
      if (d.jobHours >= PUPPY_GROW_HOURS) {
        d.isPuppy = false;
        d.jobHours = 0;
        d.portrait = pickAdultPortrait(d.breed ?? "mongrel", usedDogPortraits(s));
        pushEvent(s, "animal_grown", "🐕", `${d.name} has grown into a fine dog.`);
      }
      continue; // pups don't work, so they don't level
    }
    // Passive leveling on the current job (favored breed levels faster, and a
    // houndsman at the Kennel speeds it further).
    if (d.job === "guard" && d.guardLevel < 5) {
      d.jobHours += elapsedHours;
      const need = SKILL_LEVEL_HOURS / (apt === "guard" ? APTITUDE_SPEEDUP : 1) / trainSpeed;
      if (d.jobHours >= need) { d.guardLevel++; d.jobHours -= need; }
    } else if (d.job === "hunt" && d.huntLevel < 5) {
      d.jobHours += elapsedHours;
      const need = SKILL_LEVEL_HOURS / (apt === "hunt" ? APTITUDE_SPEEDUP : 1) / trainSpeed;
      if (d.jobHours >= need) { d.huntLevel++; d.jobHours -= need; }
    }
  }

  // Breeding — a happy, unrelated adult pair may have a litter (needs Kennel
  // room; owner-bound hounds aren't the settlement's to breed).
  if (packDogCount(s) < dogCapacity(s)) {
    const adults = dogs.filter((d) => !d.isPuppy && !d.keeper && d.happiness >= DOG_HAPPY_THRESHOLD);
    const pairs: [KeptAnimal, KeptAnimal][] = [];
    for (let i = 0; i < adults.length; i++)
      for (let j = i + 1; j < adults.length; j++)
        if (!keptAnimalsRelated(adults[i], adults[j])) pairs.push([adults[i], adults[j]]);
    if (pairs.length > 0 && Math.random() < 1 - Math.pow(1 - BREED_CHANCE_PER_HOUR, elapsedHours)) {
      const [sire, dam] = pairs[Math.floor(Math.random() * pairs.length)];
      const breed = (Math.random() < 0.5 ? sire.breed : dam.breed) ?? "mongrel";
      const name = pickDogName(s);
      s.keptAnimals.push({
        id: nextId("animal"), name, species: "dog", breed: breed as DogBreed,
        portrait: pickPuppyPortrait(breed, usedDogPortraits(s)),
        isPuppy: true, origin: "bred", sireId: sire.id, damId: dam.id,
        job: "idle", guardLevel: 0, huntLevel: 0, jobHours: 0, happiness: 78,
      });
      pushEvent(s, "animal_born", "🐶", `A litter! ${name} was born to ${sire.name} and ${dam.name}.`);
    }
  }

  // Strays — the odd dog wanders in and stays (only where there's a Kennel with
  // room; no home, no strays).
  if (packDogCount(s) < dogCapacity(s) && Math.random() < 1 - Math.pow(1 - STRAY_CHANCE_PER_HOUR, elapsedHours)) {
    const breed = DOG_BREED_KEYS[Math.floor(Math.random() * DOG_BREED_KEYS.length)];
    const name = pickDogName(s);
    s.keptAnimals.push({
      id: nextId("animal"), name, species: "dog", breed,
      portrait: pickAdultPortrait(breed, usedDogPortraits(s)),
      origin: "stray", job: "idle", ...aptitudeStartSkills(breed), jobHours: 0, happiness: 62,
    });
    pushEvent(s, "animal_stray", "🐕", `A stray dog wandered in. ${name} has stayed.`);
  }
}

function applyFlockDynamics(s: GameState, fedRatios: Map<string, number>, elapsedHours: number): void {
  if (elapsedHours <= 0) return;
  const breeding = (LIVESTOCK_BREEDING_SEASONS as readonly string[]).includes(s.season);
  // Pens a kept dog is posted to guard (on top of the legacy gold-bought dog).
  const dogGuarded = new Set(s.keptAnimals.filter((a) => a.job === "guard" && a.penId).map((a) => a.penId!));
  for (const pen of s.pens) {
    if (pen.level === 0 || pen.count <= 0) continue;
    const capacity = getPenCapacity(pen.level);
    const ratio = fedRatios.get(pen.id) ?? 1;

    // Predation — wolves thin an UNDEFENDED fold (fed or not), worse in the lean
    // seasons. A posted guard dog stops it entirely. At most one raid per tick;
    // the chance compounds over elapsed hours so an offline stretch isn't a wipe.
    if (!dogGuarded.has(pen.id)) {
      const mod = PREDATION_SEASON_MOD[s.season] ?? 1;
      const raidChance = 1 - Math.pow(1 - PREDATION_PER_HOUR * mod, elapsedHours);
      if (Math.random() < raidChance) {
        const lost = Math.min(pen.count, 1 + Math.floor(Math.random() * PREDATION_MAX_LOSS));
        pen.count -= lost;
        pushEvent(s, "pen_predation", "🐺", `Wolves took ${lost} from the ${getAnimal(pen.animal).name.toLowerCase()} pen in the night.`);
        if (pen.count <= 0) continue;
      }
    }

    // Starvation deaths — accumulate game-hours of hunger (scaled by how unfed);
    // each full threshold kills one animal. Accumulating (not per-tick rounding)
    // so tiny ticks still add up over time. Reset once the flock is fed again.
    if (ratio < 0.5) {
      const severity = Math.min(1, (0.5 - ratio) / 0.5);
      pen.starveHours = (pen.starveHours ?? 0) + severity * elapsedHours;
      let deaths = 0;
      while (pen.starveHours >= LIVESTOCK_STARVE_DEATH_HOURS && pen.count - deaths > 0) {
        pen.starveHours -= LIVESTOCK_STARVE_DEATH_HOURS;
        deaths++;
      }
      if (deaths > 0) {
        pen.count -= deaths;
        if (pen.count <= 0) pen.starveHours = 0;
        pushEvent(s, "pen_deaths", "💀", `Hunger took ${deaths} from the ${getAnimal(pen.animal).name.toLowerCase()} pen.`);
      }
      continue; // a starving flock doesn't breed
    }
    if (pen.starveHours) pen.starveHours = 0; // fed again — the starvation clock resets
    // Breeding — a fed flock (not just a pair) grows toward capacity in the warm
    // seasons. Two animals never breed alone (inbreeding optic + forces buying in).
    if (breeding && pen.count >= LIVESTOCK_MIN_BREEDING_FLOCK && pen.count < capacity) {
      const births = Math.min(capacity - pen.count, Math.round(pen.count * LIVESTOCK_BREED_PER_HOUR * elapsedHours));
      if (births > 0) {
        pen.count += births;
        pushEvent(s, "pen_births", "🐣", `${births} born in the ${getAnimal(pen.animal).name.toLowerCase()} pen.`);
      }
    }
  }
}

/** Per-food-type production rates, used to add to the typed foods map each tick.
 *  Pass `fedRatios` to scale per-pen food output (starving pens produce less). */
function calcFoodRates(state: GameState, fedRatios?: Map<string, number>): Record<FoodItemType, number> {
  const rates = emptyFoods();
  const { buildings, fields, gardens, pens, orchards, season, seasonElapsed } = state;

  // Climate multiplier scales all crop yields (fields/gardens/orchards).
  const cm = cropYieldMult(state);

  // Fields — harvest season only
  if (isHarvestTime(season, seasonElapsed)) {
    for (const field of fields) {
      if (field.level === 0 || !field.crop) continue;
      const crop = getCrop(field.crop);
      if (!crop.isFood) continue;
      const rate = (getSeasonYield(crop, field.level) / HARVEST_DURATION_HOURS) * cm;
      if (crop.id in rates) rates[crop.id as FoodItemType] += rate;
    }
  }

  // Gardens — active season only, and only if planted this cycle
  for (const garden of gardens) {
    if (garden.level === 0) continue;
    if (garden.plantedYear == null) continue;
    const veggie = getVeggie(garden.veggie);
    if (!isVeggieProducing(veggie, season)) continue;
    const rate = getLiveGardenRate(garden.level, garden.plantsAlive ?? 0) * cm;
    if (veggie.id in rates) rates[veggie.id as FoodItemType] += rate;
  }

  // Orchards — mature trees in their harvest season, per-fruit. Yield scales
  // with the number of bearing trees (saplings don't count yet).
  for (const orchard of orchards ?? []) {
    if (orchard.level === 0 || orchard.upgrading || (orchard.matureTrees ?? 0) <= 0) continue;
    const fruitDef = getFruit(orchard.fruit);
    if (!isOrchardActive(fruitDef, season)) continue;
    const rate = getOrchardRate(fruitDef, orchard.matureTrees) * cm;
    if (fruitDef.id in rates) rates[fruitDef.id as FoodItemType] += rate;
  }

  // Pens — animal products by foodLabel (Meat/Eggs/Milk → meat/eggs/milk)
  for (const pen of pens) {
    if (pen.level === 0) continue;
    const ratio = fedRatios ? (fedRatios.get(pen.id) ?? 0) : 1;
    if (ratio <= 0) continue;
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.count);
    const type = animal.foodLabel.toLowerCase() as FoodItemType;
    if (type in rates) rates[type] += prod.produced * ratio;
  }

  // Buildings — hunting, forager, fishing (season + staffing + dogs via helper)
  for (const pb of buildings) {
    if (pb.level === 0 || pb.damaged) continue;
    const gathered = gatheredFoodRate(state, pb);
    if (!gathered) continue;
    rates[gathered.type] += gathered.rate;
    // Rain's mushroom bonus rides on top of the seasonal gather.
    if (gathered.rainMushrooms > 0) rates.mushrooms += gathered.rainMushrooms;
  }

  return rates;
}

function calcFoodBreakdown(state: GameState): FoodSource[] {
  const { buildings, fields, gardens, pens, season, seasonElapsed } = state;
  const sources: FoodSource[] = [];

  const cm = cropYieldMult(state);

  // Fields (harvest only) — use crop.id (wheat/barley) as the food type
  if (isHarvestTime(season, seasonElapsed)) {
    for (const field of fields) {
      if (field.level === 0 || !field.crop) continue;
      const crop = getCrop(field.crop);
      if (!crop.isFood) continue;
      const rate = Math.round((getSeasonYield(crop, field.level) / HARVEST_DURATION_HOURS) * cm);
      sources.push({ type: crop.id, label: crop.name, icon: crop.icon, rate, building: `${crop.name} Field Lv${field.level}` });
    }
  }

  // Gardens — use veggie.id (cabbages/turnips/peas/squash/fava)
  for (const garden of gardens) {
    if (garden.level === 0) continue;
    if (garden.plantedYear == null) continue;
    const veggie = getVeggie(garden.veggie);
    if (!isVeggieProducing(veggie, season)) continue;
    const rate = getLiveGardenRate(garden.level, garden.plantsAlive ?? 0) * cm;
    sources.push({ type: veggie.id, label: veggie.name, icon: veggie.icon, rate, building: `${veggie.name} Garden Lv${garden.level}` });
  }

  // Pens — meat/eggs/milk
  for (const pen of pens) {
    if (pen.level === 0) continue;
    const animal = getAnimal(pen.animal);
    const prod = getPenProduction(animal, pen.count);
    sources.push({ type: animal.foodLabel.toLowerCase(), label: animal.foodLabel, icon: animal.icon, rate: prod.produced, building: `${animal.name} Pen Lv${pen.level}` });
  }

  // Buildings — hunting (meat), forager (seasonal berries/mushrooms/nuts),
  // fishing (fish). All numbers come from the shared gatheredFoodRate() helper,
  // so this dropdown always agrees with the tick and the building card.
  for (const pb of buildings) {
    if (pb.level === 0 || pb.damaged) continue;
    const gathered = gatheredFoodRate(state, pb);
    if (!gathered) continue;
    const def = BUILDINGS.find((b) => b.id === pb.buildingId)!;
    if (gathered.rate > 0) {
      sources.push({ type: gathered.type, label: gathered.label, icon: gathered.icon, rate: gathered.rate, building: def.name, wild: true });
    }
    // Rain's mushroom bonus is a separate line (summed with the seasonal one).
    if (gathered.rainMushrooms > 0) {
      sources.push({ type: "mushrooms", label: "Mushrooms", icon: "🍄", rate: gathered.rainMushrooms, building: `${def.name} · rain`, wild: true });
    }
  }

  return sources;
}

// Population per housing level — escalates with tier progression
const HOUSING_POP: number[] = [
  0,    // lvl 0: no houses
  5,    // lvl 1: camp — small shelters
  10,   // lvl 2: camp
  18,   // lvl 3: village — proper cottages
  28,   // lvl 4: village
  40,   // lvl 5: village
  55,   // lvl 6: village
  75,   // lvl 7: town — multi-family housing
  100,  // lvl 8: town
  130,  // lvl 9: town
  170,  // lvl 10: town
  220,  // lvl 11: city — dense housing blocks
  280,  // lvl 12: city
  350,  // lvl 13: city
  440,  // lvl 14: city
  550,  // lvl 15: city
  700,  // lvl 16: city
  880,  // lvl 17: city
  1100, // lvl 18: city
  1400, // lvl 19: city
  1800, // lvl 20: city — metropolis
];

function calcMaxPopulation(buildings: PlayerBuilding[]): number {
  const houses = buildings.find((b) => b.buildingId === "houses");
  const level = houses?.level ?? 0;
  // Damaged houses shelter as if a level lower — a raid puts some folk in the
  // streets (overcrowding, and cold deaths once that lands) until repaired.
  const effLevel = houses?.damaged ? Math.max(0, level - 1) : level;
  return BASE_POPULATION + (HOUSING_POP[effLevel] ?? 0);
}

/** Adventurers eat less than a townsfolk — they're hardy and forage/provision on
 *  the side. Keeps the early game (when the 3 Thornwood adventurers are a big
 *  share of the mouths) from tipping into a long deficit that blocks arrivals. */
export const ADVENTURER_FOOD_MULTIPLIER = 0.5;
/** Consumption multiplier while the founding-winter rationing grace is active —
 *  a settlement founded in winter tightens its belts through that first winter. */
export const FOUNDING_WINTER_RATION = 0.7;

// ── Famine mechanics ──────────────────────────────────────────────
// When the larder runs low the settlement tightens its belts (eats less, so a
// thin store stretches further), and starving folk can't do heavy work. Neither
// touches food GATHERING — hungry people still forage/hunt/fish, so recovery is
// always possible and a famine never becomes an inescapable death spiral.
/** Rations tighten to this fraction once the larder holds under
 *  FAMINE_RATION_THRESHOLD_HOURS of food — buys recovery time before it hits 0. */
export const FAMINE_RATION = 0.6;
export const FAMINE_RATION_THRESHOLD_HOURS = 6;
/** Larder is in deficit AND under this many game-hours from empty → the Wild
 *  Boar Hunt is forced onto the board (meat on four legs). Tunable; a touch
 *  tighter than the famine-ration threshold so it reads as the emergency. */
export const WILD_BOAR_HUNT_FOOD_HOURS = 3;
/** Water reserve running out within this many hours (and in deficit) surfaces the
 *  North Stream haul — a touch more lead time than the food hunt, since a dry
 *  spell wilts crops gradually rather than starving folk outright. */
export const WATER_FETCH_HOURS = 8;
/** Hours of continuous starvation for the work penalty to reach its floor, and
 *  the floor itself (10% = a 90% cut to wood/stone/gold production). */
export const FAMINE_WORK_RAMP_HOURS = 12;
export const FAMINE_WORK_FLOOR = 0.1;

export function calcFoodConsumption(citizens: CitizenCounts, adventurerMouths = 0, rationMult = 1): number {
  // Per-category multipliers: toddlers 0.5×, children 0.75×, adults 1.0×, elderly 0.75×.
  // Adventurers eat at ADVENTURER_FOOD_MULTIPLIER of an adult, home or away — away
  // rations are a separate mission concern, so the town food readout stays steady.
  // rationMult applies the founding-winter grace (< 1 = everyone eats less).
  return (effectiveFoodMouths(citizens) + adventurerMouths * ADVENTURER_FOOD_MULTIPLIER) * FOOD_PER_CITIZEN_PER_HOUR * rationMult;
}

/** Living adventurers count as townsfolk for housing + food: they take a bed and
 *  eat from stores. Derived from the roster (the source of truth) so the count
 *  can never desync from who's actually alive. */
function countLivingAdventurers(adventurers: Array<{ alive: boolean }>): number {
  return adventurers.filter((a) => a.alive).length;
}

/** Scaled overcrowding happiness penalty (returns a magnitude, apply as negative).
 *  Grows with how far over the housing cap the settlement is, capped so crowding
 *  alone can't fully tank happiness. Shared by the tick and the breakdown. */
function overcrowdingPenalty(occupancy: number, maxPop: number): number {
  const over = occupancy - maxPop;
  return over > 0 ? Math.min(45, over * 8) : 0;
}

/** Pre-computed lookup sets for reward dispatch — used by grantReward below.
 *  Module-level so they're built once at import time, not per-claim. */
const _HERB_IDS = new Set(HERBS.map((h) => h.id));
const _EXOTIC_IDS = new Set(EXOTIC_IDS);

/** Add `amount` of an item/material to inventory, respecting its per-stack cap
 *  (getMaxStack; Infinity when uncapped, the common case). Overflow beyond the
 *  cap is discarded, mirroring how settlement storage caps clamp wood/food.
 *  Use for ACQUISITION only (loot, craft output, mission loot) — never for
 *  equip/unequip round-trips, which must never lose the player's own gear.
 *  Returns the amount actually added. */
function addInventoryItem(s: GameState, itemId: string, amount: number): number {
  const existing = s.inventory.find((i) => i.itemId === itemId);
  const added = clampStackAdd(existing?.quantity ?? 0, amount, getMaxStack(itemId));
  if (added <= 0) return 0;
  if (existing) existing.quantity += added;
  else s.inventory.push({ itemId, quantity: added });
  return added;
}

/** Grant a single reward to the state, dispatching by resource type. Shared
 *  by quest-claim and mission-claim paths so they stay in sync (previously
 *  the quest path only handled gold/wood/stone/wool/astralShards and
 *  silently dropped food/herb/material/inventory rewards into NaN). */
function grantReward(
  s: GameState,
  reward: { resource: string; amount: number },
  caps: StorageCaps,
): void {
  const res = reward.resource;
  if (res === "astralShards") {
    s.astralShards += reward.amount;
  } else if (_HERB_IDS.has(res)) {
    if (!s.herbs) s.herbs = {};
    s.herbs[res] = (s.herbs[res] ?? 0) + reward.amount;
  } else if (_EXOTIC_IDS.has(res)) {
    if (!s.exotics) s.exotics = {};
    s.exotics[res] = (s.exotics[res] ?? 0) + reward.amount;
  } else if (res === "gold" || res === "wood" || res === "stone") {
    const key = res as keyof typeof s.resources;
    s.resources[key] = Math.min(caps[key], s.resources[key] + reward.amount);
  } else if (res === "water") {
    // Hauled water tops up the reserve, capped by the cistern (or the base
    // barrels without one) — overflow spills, like any full store.
    const cb = s.buildings.find((x) => x.buildingId === CISTERN_ID);
    const cap = getWaterCap(Math.max(0, (cb?.level ?? 0) - (cb?.damaged ? 1 : 0)));
    s.resources.water = Math.min(cap, (s.resources.water ?? 0) + reward.amount);
  } else if (res === "food") {
    addFood(s.foods, "wheat", reward.amount, caps.food);
  } else if (isFoodItemType(res)) {
    addFood(s.foods, res, reward.amount, caps.food);
  } else if (res === "wool") {
    s.wool = Math.min(craftingMaterialCap(s.buildings), s.wool + reward.amount);
  } else if (res === "fiber") {
    s.fiber = Math.min(craftingMaterialCap(s.buildings), s.fiber + reward.amount);
  } else if (res === "leather") {
    s.leather = Math.min(craftingMaterialCap(s.buildings), s.leather + reward.amount);
  } else if (res === "iron") {
    s.iron = Math.min(craftingMaterialCap(s.buildings), s.iron + reward.amount);
  } else if (res === "honey") {
    s.honey = s.honey + reward.amount;
  } else {
    // Unknown to the resource counters — treat as a material/item entry
    // (monster-drop materials, gear). Respects the item's maxStack.
    addInventoryItem(s, res, reward.amount);
  }
}

/** How much of a given resource/item the player currently has. Mirror of
 *  grantReward's dispatch (read side). Used to check + display deploy-item
 *  (barter/offering) costs. */
function getResourceQty(s: GameState, res: string): number {
  if (res === "astralShards") return s.astralShards;
  if (_HERB_IDS.has(res)) return s.herbs?.[res] ?? 0;
  if (_EXOTIC_IDS.has(res)) return s.exotics?.[res] ?? 0;
  if (res === "gold" || res === "wood" || res === "stone") return s.resources[res as keyof typeof s.resources];
  if (res === "food") return s.foods.wheat ?? 0;
  if (isFoodItemType(res)) return s.foods[res] ?? 0;
  if (res === "wool") return s.wool;
  if (res === "fiber") return s.fiber;
  if (res === "leather") return s.leather;
  if (res === "bone") return s.bone;
  if (res === "iron") return s.iron;
  if (res === "honey") return s.honey;
  if (res === "ale") return s.ale ?? 0;
  if (res === "mead") return s.mead ?? 0;
  if (res === "cider") return s.cider ?? 0;
  return s.inventory.find((i) => i.itemId === res)?.quantity ?? 0;
}

/** Consume a resource/item (deploy-item cost). Mirror of grantReward (spend
 *  side); floors at 0. */
function spendResource(s: GameState, res: string, amount: number): void {
  if (res === "astralShards") { s.astralShards = Math.max(0, s.astralShards - amount); return; }
  if (_HERB_IDS.has(res)) { if (!s.herbs) s.herbs = {}; s.herbs[res] = Math.max(0, (s.herbs[res] ?? 0) - amount); return; }
  if (_EXOTIC_IDS.has(res)) { if (!s.exotics) s.exotics = {}; s.exotics[res] = Math.max(0, (s.exotics[res] ?? 0) - amount); return; }
  if (res === "gold" || res === "wood" || res === "stone") { const k = res as keyof typeof s.resources; s.resources[k] = Math.max(0, s.resources[k] - amount); return; }
  if (res === "food") { s.foods.wheat = Math.max(0, (s.foods.wheat ?? 0) - amount); return; }
  if (isFoodItemType(res)) { s.foods[res] = Math.max(0, (s.foods[res] ?? 0) - amount); return; }
  if (res === "wool") { s.wool = Math.max(0, s.wool - amount); return; }
  if (res === "fiber") { s.fiber = Math.max(0, s.fiber - amount); return; }
  if (res === "leather") { s.leather = Math.max(0, s.leather - amount); return; }
  if (res === "bone") { s.bone = Math.max(0, s.bone - amount); return; }
  if (res === "iron") { s.iron = Math.max(0, s.iron - amount); return; }
  if (res === "honey") { s.honey = Math.max(0, s.honey - amount); return; }
  if (res === "ale") { s.ale = Math.max(0, s.ale - amount); return; }
  if (res === "mead") { s.mead = Math.max(0, (s.mead ?? 0) - amount); return; }
  if (res === "cider") { s.cider = Math.max(0, (s.cider ?? 0) - amount); return; }
  const inv = s.inventory.find((i) => i.itemId === res);
  if (inv) inv.quantity = Math.max(0, inv.quantity - amount);
}

/** Brew + pour one commodity drink for this tick. Generic over ale/mead/cider/…:
 *  produce into the barrel (up to cap) when the building is high enough, not
 *  paused, and its input is in stock; then pour menu-driven from the barrel.
 *  Returns whether it's on the menu and how much was needed/poured (for the
 *  tavern happiness read). The drink's stock lives on s[cfg.resource]. */
function tickDrink(
  s: GameState,
  cfg: TavernCommodityDrink,
  hours: number,
): { onMenu: boolean; needed: number; consumed: number } {
  const brewBldg = s.buildings.find((b) => b.buildingId === cfg.requiresBuilding);
  const buildingLvl = brewBldg?.damaged ? 0 : (brewBldg?.level ?? 0); // a damaged brewery brews nothing
  const tavernBldg = s.buildings.find((b) => b.buildingId === "tavern");
  // A damaged tavern pours nothing (it serves no one until repaired).
  const tavernLvl = tavernBldg?.damaged ? 0 : (tavernBldg?.level ?? 0);
  const cap = cfg.storageBase + buildingLvl * cfg.storagePerBuildingLevel;
  const stock = () => ((s as unknown as Record<string, number>)[cfg.resource] ?? 0);
  const setStock = (v: number) => { (s as unknown as Record<string, number>)[cfg.resource] = v; };

  // Produce (only when unlocked, not paused, and the barrel has room).
  if (buildingLvl >= (cfg.minBuildingLevel ?? 1) && !s.brewingPaused?.[cfg.id] && stock() < cap) {
    const produced = cfg.producePerBuildingLevel * buildingLvl * hours;
    const inputNeeded = cfg.inputPerBuildingLevel * buildingLvl * hours;
    // "food" draws the whole larder (spread across food types); anything else is
    // a specific stored resource.
    const haveInput = cfg.inputResource === "food"
      ? getTotalFood(s.foods) >= inputNeeded
      : getResourceQty(s, cfg.inputResource) >= inputNeeded;
    if (haveInput) {
      if (cfg.inputResource === "food") consumeFood(s.foods, inputNeeded);
      else spendResource(s, cfg.inputResource, inputNeeded);
      setStock(Math.min(cap, stock() + produced));
    }
  }

  // Pour — only when featured on the tavern menu (off the menu the barrel rests).
  const onMenu = (s.tavernMenu ?? []).includes(cfg.id);
  const needed = tavernLvl > 0 && onMenu ? cfg.consumePerTavernLevel * tavernLvl * hours : 0;
  let consumed = 0;
  if (needed > 0) {
    consumed = Math.min(stock(), needed);
    setStock(Math.max(0, stock() - consumed));
  }
  return { onMenu, needed, consumed };
}

function calcStorageCaps(buildings: PlayerBuilding[]): StorageCaps {
  const warehouse = buildings.find((b) => b.buildingId === "warehouse");
  const pantry = buildings.find((b) => b.buildingId === "pantry");
  const th = buildings.find((b) => b.buildingId === "town_hall");
  // A damaged warehouse holds as if a level lower — the overflow above the
  // lowered cap spills and is lost (raiders scatter/burn the exposed stores).
  const whLevel = warehouse?.damaged ? Math.max(0, (warehouse.level ?? 0) - 1) : (warehouse?.level ?? 0);
  const materialCap = BASE_MATERIAL_STORAGE + whLevel * MATERIAL_STORAGE_PER_WAREHOUSE_LEVEL;
  // Same for a damaged pantry — the broken cellar keeps a level less, and food
  // over that spoils away.
  const pantryLevel = pantry?.damaged ? Math.max(0, (pantry.level ?? 0) - 1) : (pantry?.level ?? 0);
  const cistern = buildings.find((b) => b.buildingId === CISTERN_ID);
  const cisternLevel = cistern?.damaged ? Math.max(0, (cistern.level ?? 0) - 1) : (cistern?.level ?? 0);
  return {
    gold: BASE_GOLD_STORAGE + (th?.level ?? 0) * GOLD_STORAGE_PER_TH_LEVEL,
    wood: materialCap,
    stone: materialCap,
    food: BASE_FOOD_STORAGE + pantryLevel * FOOD_STORAGE_PER_PANTRY_LEVEL,
    water: getWaterCap(cisternLevel),
  };
}

// ─── Tavern dishes (cook-to-order) ───────────────────────────────
// EVERY kitchen recipe is a tavern menu dish; its `kind` picks the column
// (meal/drink/dessert), defaulting to "meal" when untagged. The tavern cooks
// them TO ORDER — a dish is available when its ingredients are in stock, and
// serving guests consumes those ingredients (mirrors the craft path's grain/
// wild aliases). No pre-cooked stock.
const KITCHEN_DISHES: CraftingRecipe[] = CRAFTING_RECIPES.filter((r) => r.building === "kitchen");
const KITCHEN_DISH_BY_ID = new Map(KITCHEN_DISHES.map((r) => [r.id, r]));

function readDishCost(s: GameState, res: string): number {
  return res === "grain" || res === "wild" || isFoodItemType(res)
    ? getFoodCostAmount(s.foods, res)
    : getResourceQty(s, res);
}
function spendDishCost(s: GameState, res: string, amount: number): void {
  if (res === "grain" || res === "wild" || isFoodItemType(res)) consumeFoodCost(s.foods, res, amount);
  else spendResource(s, res, amount);
}
/** Kitchen level (0 = no kitchen). Dishes need a kitchen to be cooked. */
function kitchenLevel(s: GameState): number {
  return s.buildings.find((b) => b.buildingId === "kitchen")?.level ?? 0;
}
/** Kitchen recipe ids that must be DISCOVERED before use (origin/culture dishes
 *  unlocked via adventurer loyalty). Staples aren't here → always known. */
const ORIGIN_GATED_RECIPE_IDS = new Set(
  Object.values(ORIGIN_RECIPES).flat().map((x: { recipeId: string }) => x.recipeId),
);
/** A dish's recipe is unlocked (kitchen high enough; origin recipes also need
 *  to have been discovered via loyalty). */
function dishUnlocked(s: GameState, r: CraftingRecipe): boolean {
  if (r.minLevel > kitchenLevel(s)) return false;
  if (ORIGIN_GATED_RECIPE_IDS.has(r.id)) return (s.discoveredRecipes ?? []).includes(r.id);
  return true;
}
/** Enough ingredients in stock to cook at least one batch right now. */
function dishAvailable(s: GameState, r: CraftingRecipe): boolean {
  return r.costs.every((c) => readDishCost(s, c.resource) >= c.amount);
}

function getTownHallLevel(buildings: PlayerBuilding[]): number {
  return buildings.find((b) => b.buildingId === "town_hall")?.level ?? 0;
}

function calcBuildingEffect(buildingId: string, nextLevel: number): string | null {
  const currentLevel = nextLevel - 1;
  switch (buildingId) {
    case "warehouse": {
      const cur = BASE_MATERIAL_STORAGE + Math.max(0, currentLevel) * MATERIAL_STORAGE_PER_WAREHOUSE_LEVEL;
      const next = BASE_MATERIAL_STORAGE + nextLevel * MATERIAL_STORAGE_PER_WAREHOUSE_LEVEL;
      const curCraft = BASE_CRAFTING_STORAGE + Math.max(0, currentLevel) * CRAFTING_STORAGE_PER_WAREHOUSE_LEVEL;
      const nextCraft = BASE_CRAFTING_STORAGE + nextLevel * CRAFTING_STORAGE_PER_WAREHOUSE_LEVEL;
      return `Wood & Stone: ${cur.toLocaleString()} → ${next.toLocaleString()}\nCrafting materials: ${curCraft.toLocaleString()} → ${nextCraft.toLocaleString()}`;
    }
    case "pantry": {
      const cur = BASE_FOOD_STORAGE + Math.max(0, currentLevel) * FOOD_STORAGE_PER_PANTRY_LEVEL;
      const next = BASE_FOOD_STORAGE + nextLevel * FOOD_STORAGE_PER_PANTRY_LEVEL;
      return `Food storage: ${cur.toLocaleString()} → ${next.toLocaleString()}`;
    }
    case "houses": {
      const cur = BASE_POPULATION + (HOUSING_POP[Math.max(0, currentLevel)] ?? 0);
      const next = BASE_POPULATION + (HOUSING_POP[nextLevel] ?? 0);
      return `Max population: ${cur} → ${next}`;
    }
    case "town_hall": {
      const curGold = BASE_GOLD_STORAGE + Math.max(0, currentLevel) * GOLD_STORAGE_PER_TH_LEVEL;
      const nextGold = BASE_GOLD_STORAGE + nextLevel * GOLD_STORAGE_PER_TH_LEVEL;
      const curTier = getSettlementTier(Math.max(0, currentLevel));
      const nextTier = getSettlementTier(nextLevel);
      const tierChange = curTier !== nextTier ? ` — Evolves to ${getSettlementName(nextTier)}!` : "";
      return `Treasury: ${curGold.toLocaleString()} → ${nextGold.toLocaleString()}${tierChange}`;
    }
    case "masons_guild": {
      const curBonuses = getMasonBonuses(Math.max(0, currentLevel));
      const nextBonuses = getMasonBonuses(nextLevel);
      return `Queue slots: ${curBonuses.queueSlots} → ${nextBonuses.queueSlots} · Cost/time reduction: ${Math.round(curBonuses.costReduction * 100)}% → ${Math.round(nextBonuses.costReduction * 100)}%`;
    }
    case "well": {
      const cur = getWellOutput(Math.max(0, currentLevel));
      const next = getWellOutput(nextLevel);
      return `Water supply: +${cur}/h → +${next}/h`;
    }
    case "cistern": {
      const cur = getWaterCap(Math.max(0, currentLevel));
      const next = getWaterCap(nextLevel);
      return `Water storage: ${cur} → ${next}\nRain caught: +${getCisternRainCatch(Math.max(0, currentLevel))}/h → +${getCisternRainCatch(nextLevel)}/h (while it rains)`;
    }
    case "woodworker":
    case "blacksmith":
    case "alchemy_lab": {
      return `Crafting slots: ${Math.max(0, currentLevel)} → ${nextLevel} (1 per level)`;
    }
    case "iron_mine": {
      const cur = Math.max(0, currentLevel) * 8;
      const next = nextLevel * 8;
      return `Iron: +${cur}/h → +${next}/h\nMore ore worked turns up gems & astral shards more often`;
    }
    case "forager_hut": {
      const b = BUILDINGS.find((x) => x.id === "forager_hut");
      const cur = currentLevel >= 1 ? (b?.levels[currentLevel - 1]?.production?.rate ?? 0) : 0;
      const next = b?.levels[nextLevel - 1]?.production?.rate ?? 0;
      return `Foraged food: +${cur}/h → +${next}/h\nMore foraging turns up more fiber and medicinal herbs`;
    }
    case "tailoring_shop": {
      return `Crafting slots: ${Math.max(0, currentLevel)} → ${nextLevel} (1 per level)`;
    }
    case "shrine": {
      const cur = Math.max(0, currentLevel) * SHRINE_HAPPINESS_PER_LEVEL;
      const next = nextLevel * SHRINE_HAPPINESS_PER_LEVEL;
      return `Happiness: +${cur} → +${next}`;
    }
    case "brewery": {
      // Output/consumption depend on WHICH drink is brewing (grain→ale, honey→mead,
      // apples→cider), so the per-drink numbers live in the brewing panel. Here we
      // just note the level payoff: faster brewing, bigger barrels, and any unlock.
      const unlocking = TAVERN_COMMODITY_DRINKS.find(
        (d) => d.requiresBuilding === "brewery" && (d.minBuildingLevel ?? 1) === nextLevel,
      );
      const unlockNote = unlocking ? `Unlocks ${unlocking.icon} ${unlocking.name.toLowerCase()} (from ${unlocking.brewedFrom})\n` : "";
      return `${unlockNote}Every drink brews faster and its barrel holds more`;
    }
    case "tavern": {
      const cur = Math.max(0, currentLevel) * TAVERN_HAPPINESS_PER_LEVEL;
      const next = nextLevel * TAVERN_HAPPINESS_PER_LEVEL;
      return `Happiness: +${cur} → +${next} · Beds: ${tavernRooms(Math.max(0, currentLevel))} → ${tavernRooms(nextLevel)} · ${serversNeeded(nextLevel)} servers`;
    }
    case "adventurers_guild": {
      const curRoster = getMaxRoster(Math.max(0, currentLevel));
      const nextRoster = getMaxRoster(nextLevel);
      return `Max roster: ${curRoster} → ${nextRoster}`;
    }
    default: {
      // Generic producer (lumber mill, quarry, gathering huts): show output climbing
      // in the same green box every other building uses.
      const b = BUILDINGS.find((x) => x.id === buildingId);
      const nextP = b?.levels[nextLevel - 1]?.production;
      if (!nextP) return null;
      const curP = currentLevel >= 1 ? b?.levels[currentLevel - 1]?.production : undefined;
      return `Production: +${curP?.rate ?? 0}/h → +${nextP.rate}/h ${nextP.resource}`;
    }
  }
}

// ─── Context ─────────────────────────────────────────────────────

const GameContext = createContext<{ state: GameState; actions: GameActions }>();

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────

/** A "while you were away" summary of what an offline stretch did to the
 *  settlement. Built during catch-up, stashed in sessionStorage so an accidental
 *  refresh (which has nothing left to catch up) still shows it, and surfaced as a
 *  dismissible card on the Overview. Session-scoped by design: it's a return
 *  greeting, not save data. */
export interface AwayReport {
  hoursAway: number;
  seasonBefore: Season;
  seasonAfter: Season;
  yearBefore: number;
  yearAfter: number;
  popBefore: number;
  popAfter: number;
  foodBefore: number;
  foodAfter: number;
  foodProdAfter: number;
  waterAfter: number;
  woodAfter: number;
  happinessBefore: number;
  happinessAfter: number;
  /** Garden plants that withered to weather/thirst while away, and why. */
  plantsWilted: number;
  wiltCause?: "heat" | "drown" | "thirst";
  severity: "calm" | "warn" | "loss";
}

const AWAY_REPORT_KEY = "valenheart.awayReport";

/** Project the food balance as if a given season were in effect right now, at
 *  the current buildings + population (same calcProductionRates the tick uses, on
 *  a season-overridden copy): harvest only in autumn, forage/hunt/fish scale by
 *  season, gardens/orchards yield only in their seasons. Drives the season-change
 *  food warning. Consumption uses full rations (the scarcity ration only kicks in
 *  once stores are actually low, which a forward projection shouldn't assume). */
function computeSeasonFoodOutlook(s: GameState, season: Season) {
  const prod = calcProductionRates({ ...s, season, seasonElapsed: 0 } as GameState).food;
  const rationMult = s.foundingWinterGrace ? FOUNDING_WINTER_RATION : 1;
  const citizenFood = calcFoodConsumption(s.citizens, countLivingAdventurers(s.adventurers), rationMult);
  const animalFood = calcAnimalFoodConsumption(s.pens);
  const net = prod - citizenFood - animalFood;
  const food = getTotalFood(s.foods);
  return { prod, citizenFood, animalFood, net, food, hoursToEmpty: net < 0 ? food / -net : Infinity };
}

export function GameProvider(props: ParentProps) {
  const [loaded, setLoaded] = createSignal(false);
  // Set after auto-retry exhausts, so the UI can show a real error screen
  // instead of falling through to a phantom blank state (which would fire
  // the intro cinematic on what looks like a brand new account).
  const [loadError, setLoadError] = createSignal<string | null>(null);
  // In production, always start with a blank state — the server load will overwrite it.
  // In dev, load from localStorage for offline play.
  const initial = IS_DEV ? (loadGame() ?? createInitialState()) : createInitialState();
  const [state, setState] = createStore<GameState>(initial);
  _latestStateGetter = () => state;

  // While-you-were-away digest. Seeded from sessionStorage so it survives a
  // refresh (a second page load has no offline time left to recompute it).
  const readAwayReport = (): AwayReport | null => {
    try {
      const raw = sessionStorage.getItem(AWAY_REPORT_KEY);
      return raw ? (JSON.parse(raw) as AwayReport) : null;
    } catch {
      return null;
    }
  };
  const [awayReport, setAwayReport] = createSignal<AwayReport | null>(readAwayReport());
  const storeAwayReport = (r: AwayReport | null) => {
    try {
      if (r) sessionStorage.setItem(AWAY_REPORT_KEY, JSON.stringify(r));
      else sessionStorage.removeItem(AWAY_REPORT_KEY);
    } catch { /* private mode / disabled storage — signal still works in-session */ }
    setAwayReport(r);
  };

  // Load state from server on mount
  onMount(async () => {
    if (!isLoggedIn()) {
      setLoaded(true);
      return;
    }
    async function loadFromServer() {
      const list = await listSettlements();
      let settlement;
      if (list.settlements.length > 0) {
        // Load first settlement
        const res = await loadSettlementApi(list.settlements[0].id);
        settlement = res.settlement;
      } else {
        // Create first settlement
        const res = await createSettlementApi();
        settlement = res.settlement;
      }

      _settlementId = settlement.id;

      // If server has game state (not empty), use it as source of truth
      const serverState = settlement.gameState as GameState;
      if (serverState && serverState.resources) {
        // Canonical backfill — the single source of truth shared with the local
        // load path. Runs FIRST so every field added since this save was written
        // exists before the tick (or anything else) reads it. This is the P0 fix:
        // the server path used to backfill only a subset, leaving fields like
        // craftingQueue/autoCook/discoveredEnemies undefined → the tick threw
        // every frame and the game silently froze. The inline migration below
        // predates this call and is now largely redundant (every step is guarded
        // or idempotent); it's slated for removal in a separate dedup pass.
        migrateSaveState(serverState as GameState);
        // Migrate missing fields for old saves
        if (!serverState.questRewardsClaimed) serverState.questRewardsClaimed = [];
        if (serverState.firstMissionSent === undefined) serverState.firstMissionSent = false;
        if (!serverState.completedStoryMissions) serverState.completedStoryMissions = [];
        if (!(serverState as any).pendingRobins) (serverState as any).pendingRobins = [];
        if (!(serverState as any).firedRobins) (serverState as any).firedRobins = [];
        if (!serverState.herbs) serverState.herbs = {};
        if (serverState.foragedTotal === undefined) serverState.foragedTotal = 0;
        if (!serverState.exotics) serverState.exotics = {};
        if (serverState.starvationPenalty === undefined) serverState.starvationPenalty = 0;
        if (serverState.starvationHours === undefined) serverState.starvationHours = 0;
        if ((serverState as any).newbornGlow === undefined) (serverState as any).newbornGlow = 0;
        if ((serverState as any).lastBirthYear === undefined) (serverState as any).lastBirthYear = serverState.year ?? 0;
        // raidsResolvedCount: durable raid counter for quest progress.
        // Backfill from event log so already-stuck cloud saves unstick on
        // next load (Baptism of Fire was checking lastRaidOutcome which decays).
        if ((serverState as any).raidsResolvedCount === undefined) {
          const priorRaids = (serverState.eventLog ?? []).filter(
            (e: any) => e?.type === "raid_victory" || e?.type === "raid_defeat",
          ).length;
          (serverState as any).raidsResolvedCount = priorRaids;
        }
        // Defenses rework: migrate legacy single-instance defense buildings
        // (walls / watchtower / barracks / mage_tower) into the new ring-keyed
        // state slots. Cloud saves that pre-date the rework keep their progress.
        if (!(serverState as any).walls) {
          const oldWalls = serverState.buildings?.find((b: any) => b.buildingId === "walls");
          const lvl = oldWalls?.level ?? 0;
          (serverState as any).walls = [
            { ring: "outer", level: lvl, hp: lvl > 0 ? (oldWalls?.damaged ? Math.floor(lvl * WALL_BASE_HP / 2) : lvl * WALL_BASE_HP) : 0, upgrading: oldWalls?.upgrading ?? false, upgradeRemaining: oldWalls?.upgradeRemaining },
            { ring: "middle", level: 0, hp: 0, upgrading: false },
            { ring: "inner", level: 0, hp: 0, upgrading: false },
          ];
        }
        if (!(serverState as any).watchtowers) {
          const oldTower = serverState.buildings?.find((b: any) => b.buildingId === "watchtower");
          (serverState as any).watchtowers = [
            { ring: "outer", level: oldTower?.level ?? 0, damaged: oldTower?.damaged ?? false, upgrading: oldTower?.upgrading ?? false, upgradeRemaining: oldTower?.upgradeRemaining, garrison: { count: 0, trainedLevel: 0 } },
            { ring: "middle", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
            { ring: "inner", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
          ];
        }
        if (!(serverState as any).barracks || !Array.isArray((serverState as any).barracks)) {
          const oldBarracks = serverState.buildings?.find((b: any) => b.buildingId === "barracks");
          (serverState as any).barracks = [
            { ring: "outer", level: oldBarracks?.level ?? 0, damaged: oldBarracks?.damaged ?? false, upgrading: oldBarracks?.upgrading ?? false, upgradeRemaining: oldBarracks?.upgradeRemaining, garrison: { count: 0, trainedLevel: 0 } },
            { ring: "middle", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
            { ring: "inner", level: 0, damaged: false, upgrading: false, garrison: { count: 0, trainedLevel: 0 } },
          ];
        }
        if ((serverState as any).soldiers === undefined) (serverState as any).soldiers = 0;
        if ((serverState as any).archers === undefined) (serverState as any).archers = 0;
        // Garrison rework: backfill the per-building roster on saves loaded
        // from the server, then redistribute the legacy global totals across
        // the rings (outer first). Mirrors the local-save migration earlier.
        for (const t of (serverState as any).watchtowers) if (!t.garrison) t.garrison = { count: 0, trainedLevel: 0 };
        for (const b of (serverState as any).barracks) if (!b.garrison) b.garrison = { count: 0, trainedLevel: 0 };
        distributeLegacyGarrison((serverState as any).watchtowers, (serverState as any).archers, getWatchtowerArcherCap);
        distributeLegacyGarrison((serverState as any).barracks, (serverState as any).soldiers, getBarracksSoldierCap);
        if (!(serverState as any).mageTower) {
          const oldMage = serverState.buildings?.find((b: any) => b.buildingId === "mage_tower");
          (serverState as any).mageTower = {
            level: oldMage?.level ?? 0,
            damaged: oldMage?.damaged ?? false,
            upgrading: oldMage?.upgrading ?? false,
            upgradeRemaining: oldMage?.upgradeRemaining,
          };
        }
        // Backfill any new buildings that were added since this save was created.
        // Skip the now-removed defense category — those live on the Defenses page.
        const REMOVED_BUILDING_IDS = new Set(["walls", "watchtower", "barracks", "mage_tower"]);
        for (const def of BUILDINGS) {
          if (!serverState.buildings.find((b: any) => b.buildingId === def.id)) {
            serverState.buildings.push({ buildingId: def.id, level: 0, upgrading: false, damaged: false });
          }
        }
        // Strip removed defense buildings from saves that still have them so
        // they stop appearing in any iteration over state.buildings. Runs
        // AFTER the per-ring migration so the lookups above still find them.
        serverState.buildings = serverState.buildings.filter((b: any) => !REMOVED_BUILDING_IDS.has(b.buildingId));
        // Citizen-categories migration (Phase B). Convert legacy scalar
        // population to per-category breakdown — same as the local-save path.
        if (!(serverState as any).citizens) {
          const legacy = (serverState as any).population;
          (serverState as any).citizens = migrateLegacyPopulation(legacy ?? BASE_POPULATION);
          delete (serverState as any).population;
        }
        // Chapter system migration — same logic as loadGame (localStorage path).
        // Cloud-loaded saves bypassed this entirely, so a player whose cloud
        // save predates the chapter rework would land here without a chapters
        // field; farming and other chapter-gated content stayed locked even
        // after they'd claimed every chapter quest.
        if (!(serverState as any).chapters) {
          (serverState as any).chapters = [
            { storyline: "settlement", current: 1, completedChapters: [] },
            { storyline: "guild", current: 0, completedChapters: [] },
            { storyline: "story", current: 1, completedChapters: [] },
            { storyline: "defense", current: 0, completedChapters: [] },
            { storyline: "social", current: 1, completedChapters: [] },
          ];
          for (const cs of (serverState as any).chapters) {
            const chaptersInStoryline = new Set(
              QUEST_DEFINITIONS
                .filter((q) => q.storyline === cs.storyline)
                .map((q) => q.chapter),
            );
            for (const chapter of [...chaptersInStoryline].sort((a, b) => a - b)) {
              const allClaimed = QUEST_DEFINITIONS
                .filter((q) => q.storyline === cs.storyline && q.chapter === chapter)
                .every((q) => (serverState.questRewardsClaimed ?? []).includes(q.id));
              if (allClaimed) {
                cs.completedChapters.push(chapter);
                cs.current = chapter + 1;
              } else if (cs.current === 0 && (serverState.questRewardsClaimed ?? []).some((id: string) =>
                QUEST_DEFINITIONS.find((q) => q.id === id)?.storyline === cs.storyline)) {
                cs.current = chapter;
                break;
              } else {
                break;
              }
            }
          }
        }
        // Backfill the "social" storyline for cloud saves made before it existed.
        if ((serverState as any).chapters && !(serverState as any).chapters.some((c: any) => c.storyline === "social")) {
          (serverState as any).chapters.push({ storyline: "social", current: 1, completedChapters: [] });
        }
        if (!(serverState as any).firedEvents) (serverState as any).firedEvents = [];
        if (!(serverState as any).pendingEvents) (serverState as any).pendingEvents = [];
        // Idempotent chapter pointer recompute — same as loadGame. Bumps
        // `current` forward based on state evidence for legacy linear-quest
        // saves whose chapter pointers don't match what they've actually built.
        {
          const buildLvl = (id: string) =>
            (serverState.buildings ?? []).find((b: any) => b.buildingId === id)?.level ?? 0;
          const hasPen = (animal: string) =>
            ((serverState as any).pens ?? []).some((p: any) => p.animal === animal && (p.level ?? 0) >= 1);
          const bumpTo = (storyline: string, target: number) => {
            const cs = (serverState as any).chapters?.find((c: any) => c.storyline === storyline);
            if (cs && cs.current < target) cs.current = target;
          };
          if (
            buildLvl("houses") >= 1 ||
            buildLvl("hunting_camp") >= 1 ||
            buildLvl("pantry") >= 1
          ) bumpTo("settlement", 2);
          if (
            hasPen("sheep") ||
            buildLvl("tailoring_shop") >= 1 ||
            buildLvl("shrine") >= 1
          ) bumpTo("settlement", 3);
          if (
            buildLvl("town_hall") >= 2 ||
            buildLvl("marketplace") >= 1 ||
            buildLvl("masons_guild") >= 1
          ) bumpTo("settlement", 4);
          if (buildLvl("adventurers_guild") >= 1) bumpTo("guild", 1);
          if (buildLvl("woodworker") >= 1) bumpTo("guild", 2);
          const hasDefense =
            ((serverState as any).walls ?? []).some((w: any) => (w.level ?? 0) >= 1) ||
            ((serverState as any).watchtowers ?? []).some((t: any) => (t.level ?? 0) >= 1) ||
            ((serverState as any).raidsResolvedCount ?? 0) > 0;
          if (hasDefense) bumpTo("defense", 1);
        }
        // Re-apply leveling in case XP curve changed
        for (const adv of serverState.adventurers ?? []) {
          applyXp(adv, 0);
        }
        // Self-heal stuck onMission flags. If a mission resolved without
        // freeing an adventurer (botched completion path, partial save),
        // they'd vanish from the team-assembly panel forever. Clear the
        // flag for anyone not actually present in an active mission.
        const activeAdvIds = new Set<string>();
        for (const m of serverState.activeMissions ?? []) {
          for (const id of m.adventurerIds ?? []) activeAdvIds.add(id);
        }
        for (const adv of serverState.adventurers ?? []) {
          if (adv.onMission && !activeAdvIds.has(adv.id)) {
            adv.onMission = false;
          }
        }
        // Restore ID counter past EVERY id-bearing collection + fix duplicates.
        let maxId = 0;
        const idColls: ({ id: string }[] | undefined)[] = [serverState.fields, serverState.gardens, serverState.pens, serverState.hives, serverState.orchards, serverState.keptAnimals, serverState.adventurers];
        for (const coll of idColls) {
          for (const item of coll ?? []) {
            const num = parseInt(item.id.replace(/^[a-z]+_/, ""), 10);
            if (!Number.isNaN(num) && num > maxId) maxId = num;
          }
        }
        idCounter = maxId + 1;
        const dupSeen = new Set<string>();
        for (const coll of idColls) {
          for (const item of coll ?? []) {
            if (dupSeen.has(item.id)) item.id = nextId(item.id.replace(/_\d+$/, ""));
            dupSeen.add(item.id);
          }
        }
        // Gardens: add plantedYear + ensure one pre-attributed slot per veggie
        serverState.gardens = serverState.gardens ?? [];
        for (const g of serverState.gardens) {
          if ((g as any).plantedYear === undefined) (g as any).plantedYear = null;
          if ((g as any).seedsPlanted === undefined) {
            (g as any).seedsPlanted = (g as any).plantedYear != null ? getSeedCapacity((g as any).level ?? 0) : 0;
          }
          if ((g as any).plantsAlive === undefined || (g as any).sprouted === undefined) {
            const s0 = (g as any).plantedYear != null
              ? getSproutedPlants(getVeggie((g as any).veggie), (g as any).seedsPlanted ?? 0)
              : 0;
            (g as any).sprouted = s0;
            (g as any).plantsAlive = s0;
          }
        }
        for (const v of VEGGIES) {
          if (!serverState.gardens.some((g: any) => g.veggie === v.id)) {
            serverState.gardens.push({
              id: nextId("garden"),
              veggie: v.id,
              level: 0,
              upgrading: false,
              plantedYear: null,
              seedsPlanted: 0,
              sprouted: 0,
              plantsAlive: 0,
            });
          }
        }
        if (!(serverState as any).seeds) {
          (serverState as any).seeds = makeStartingSeeds();
        } else {
          for (const v of VEGGIES) {
            if (typeof (serverState as any).seeds[v.id] !== "number") (serverState as any).seeds[v.id] = 0;
          }
        }
        if (!(serverState as any).seedsUnlocked) {
          (serverState as any).seedsUnlocked = startingUnlockedSeeds();
        }
        if (!(serverState as any).fruitSeeds) (serverState as any).fruitSeeds = startingFruitSeeds();
        if (!(serverState as any).fruitsUnlocked) (serverState as any).fruitsUnlocked = startingUnlockedFruits();
        // Pens: ensure one pre-attributed slot per animal
        serverState.pens = serverState.pens ?? [];
        for (const a of ANIMALS) {
          if (!serverState.pens.some((p: any) => p.animal === a.id)) {
            serverState.pens.push({
              id: nextId("pen"),
              animal: a.id,
              level: 0,
              count: 0,
              upgrading: false,
            });
          }
        }
        // Orchards: migrate old maturity shape, then ensure a slot per fruit.
        serverState.orchards = serverState.orchards ?? [];
        for (const o of serverState.orchards as any[]) {
          if (o.matureTrees === undefined) {
            const slots = getOrchardTreeSlots(o.level ?? 0);
            if (o.mature) {
              o.matureTrees = slots;
              o.saplings = [];
            } else if ((o.seasonsGrown ?? 0) > 0 && (o.level ?? 0) > 0) {
              o.matureTrees = 0;
              o.saplings = [{ count: Math.max(slots, 1), seasonsGrown: o.seasonsGrown }];
            } else {
              o.matureTrees = 0;
              o.saplings = [];
            }
            delete o.seasonsGrown;
            delete o.mature;
          }
          if (!Array.isArray(o.saplings)) o.saplings = [];
        }
        for (const f of FRUITS) {
          if (!serverState.orchards.some((o: any) => o.fruit === f.id)) {
            serverState.orchards.push({
              id: nextId("orchard"),
              fruit: f.id,
              level: 0,
              upgrading: false,
              matureTrees: 0,
              saplings: [],
            });
          }
        }
        // Hives: collapse legacy multi-hive saves to the single apiary (keep best).
        serverState.hives = serverState.hives ?? [];
        if (serverState.hives.length > MAX_HIVES) {
          const best = serverState.hives.reduce((a: PlayerHive, b: PlayerHive) => (b.level > a.level ? b : a));
          serverState.hives = [best];
        }
        while (serverState.hives.length < MAX_HIVES) {
          serverState.hives.push({
            id: nextId("hive"),
            level: 0,
            upgrading: false,
          });
        }
        // Legacy fruit bucket → split into typed pantry (apples/pears/cherries)
        if ((serverState as any).fruit !== undefined && (serverState as any).fruit > 0) {
          const legacy = (serverState as any).fruit;
          if (!serverState.foods) (serverState as any).foods = {};
          const each = legacy / 3;
          (serverState.foods as any).apples = ((serverState.foods as any).apples ?? 0) + each;
          (serverState.foods as any).pears = ((serverState.foods as any).pears ?? 0) + each;
          (serverState.foods as any).cherries = ((serverState.foods as any).cherries ?? 0) + each;
        }
        delete (serverState as any).fruit;
        // Equipment migration: old 3-slot → new 11-slot
        const migrateEq = (adv: any) => {
          if (adv.equipment?.weapon !== undefined || adv.equipment?.armor !== undefined) {
            adv.equipment = {
              head: null, chest: adv.equipment.armor ?? null, legs: null, boots: null,
              cloak: null, mainHand: adv.equipment.weapon ?? null, offHand: null,
              ring1: null, ring2: null, amulet: null, trinket: adv.equipment.trinket ?? null,
            };
          } else if (!adv.equipment?.head && adv.equipment?.head !== null) {
            adv.equipment = { head: null, chest: null, legs: null, boots: null, gloves: null, cloak: null, mainHand: null, offHand: null, ring1: null, ring2: null, amulet: null, trinket: null };
          }
        };
        for (const adv of serverState.adventurers ?? []) migrateEq(adv);

        // Rename chapel → shrine for old saves
        for (const b of serverState.buildings ?? []) {
          if (b.buildingId === "chapel") b.buildingId = "shrine";
        }
        // Fix duplicate adventurer IDs (from previous bug)
        const seenIds = new Set<string>();
        for (const adv of serverState.adventurers ?? []) {
          if (seenIds.has(adv.id)) {
            adv.id = `adv_${idCounter++}`;
          }
          seenIds.add(adv.id);
        }
        // Ensure lastTick is valid (prevents NaN in tick loop if server state lost the field)
        if (!serverState.lastTick || typeof serverState.lastTick !== "number") {
          serverState.lastTick = Date.now();
        }
        // Resolve expired raids directly (server tick counts down but never resolves)
        // This runs BEFORE setState to guarantee resolution even if applyTicks throws later.
        // Offline-resolved raids skip playback — too disruptive to bury the
        // returning player in N replay overlays. Apply outcomes silently.
        if (serverState.incomingRaids?.length) {
          for (let i = serverState.incomingRaids.length - 1; i >= 0; i--) {
            const ir = serverState.incomingRaids[i];
            if (ir.remaining <= 0) {
              const template = getRaid(ir.raidId);
              if (template && template.encounters?.length) {
                const sim = simulateRaidCombat({
                  raidId: ir.raidId,
                  encounters: template.encounters,
                  walls: (serverState.walls ?? []).map((w: any) => ({ ring: w.ring, level: w.level, hp: w.hp, maxHp: w.level * WALL_BASE_HP })),
                  watchtowers: (serverState.watchtowers ?? []).map((t: any) => ({ ring: t.ring, level: t.level, damaged: t.damaged, archerCount: t.garrison?.count ?? 0, trainedLevel: (t.garrison?.trainedLevel ?? 0) + (trainerHome(serverState.adventurers ?? [], "watchtower") ? 1 : 0) })),
                  barracks: (serverState.barracks ?? []).map((b: any) => ({ ring: b.ring, level: b.level, damaged: b.damaged, soldierCount: b.garrison?.count ?? 0, trainedLevel: (b.garrison?.trainedLevel ?? 0) + (trainerHome(serverState.adventurers ?? [], "barracks") ? 1 : 0) })),
                  militiaCount: militiaCount(serverState as GameState),
                  watchtowerCaptain: buildRaidCaptainUnit(serverState.adventurers ?? [], "watchtower"),
                  barracksCaptain: buildRaidCaptainUnit(serverState.adventurers ?? [], "barracks"),
                });

                // Apply sim after-state
                for (const wf of sim.wallFinalHp) {
                  const w = serverState.walls?.find((x: any) => x.ring === wf.ring);
                  if (w) w.hp = wf.hp;
                }
                for (const ring of sim.damagedTowerRings) {
                  const t = serverState.watchtowers?.find((x: any) => x.ring === ring);
                  if (t) t.damaged = true;
                }
                for (const ring of sim.damagedBarracksRings) {
                  const b = serverState.barracks?.find((x: any) => x.ring === ring);
                  if (b) b.damaged = true;
                }
                // Per-building casualties — same as the client-tick path.
                for (const c of sim.archerCasualtiesByRing) {
                  const t = serverState.watchtowers?.find((x: any) => x.ring === c.ring);
                  if (t?.garrison) t.garrison.count = Math.max(0, t.garrison.count - c.lost);
                }
                for (const c of sim.soldierCasualtiesByRing) {
                  const b = serverState.barracks?.find((x: any) => x.ring === c.ring);
                  if (b?.garrison) b.garrison.count = Math.max(0, b.garrison.count - c.lost);
                }
                serverState.archers = Math.max(0, (serverState.archers ?? 0) - sim.archersLost);
                serverState.soldiers = Math.max(0, (serverState.soldiers ?? 0) - sim.soldiersLost);
                // Captain wounds — same as the live path, floored at 1.
                for (const oc of [sim.watchtowerCaptainOutcome, sim.barracksCaptainOutcome]) {
                  if (!oc) continue;
                  const adv = (serverState.adventurers ?? []).find((a: any) => a.id === oc.advId);
                  if (adv) adv.currentHp = Math.max(1, Math.round(oc.hp));
                }
                // Soldier/archer casualties = adult deaths. Reduce adults by the
                // exact loss count, clamped so total never drops below BASE.
                const totalAdultLoss = sim.archersLost + sim.soldiersLost;
                if (totalAdultLoss > 0) {
                  const popTotal = (serverState as any).citizens
                    ? (serverState as any).citizens.toddlers + (serverState as any).citizens.children + (serverState as any).citizens.adults + (serverState as any).citizens.elderly
                    : 0;
                  const allowed = Math.max(0, popTotal - BASE_POPULATION);
                  const actual = Math.min(totalAdultLoss, allowed);
                  if (actual > 0 && (serverState as any).citizens) {
                    (serverState as any).citizens.adults = Math.max(0, (serverState as any).citizens.adults - actual);
                  }
                }

                const raidName = template.name ?? ir.raidId;
                if (sim.victory) {
                  for (const loot of template.victoryLoot) {
                    if (loot.resource === "astralShards") {
                      serverState.astralShards += loot.amount;
                    } else {
                      const key = loot.resource as keyof typeof serverState.resources;
                      serverState.resources[key] += loot.amount;
                    }
                  }
                } else {
                  const stealPct = template.resourceStealPercent;
                  serverState.resources.gold = Math.max(0, serverState.resources.gold - Math.floor(serverState.resources.gold * stealPct));
                  serverState.resources.wood = Math.max(0, serverState.resources.wood - Math.floor(serverState.resources.wood * stealPct));
                  serverState.resources.stone = Math.max(0, serverState.resources.stone - Math.floor(serverState.resources.stone * stealPct));
                  if (serverState.foods) consumeFood(serverState.foods, Math.floor(getTotalFood(serverState.foods) * stealPct));
                  if (template.killsCitizens) {
                    const c = (serverState as any).citizens;
                    const popTotal = c ? c.toddlers + c.children + c.adults + c.elderly : 0;
                    const extra = Math.min(template.maxCitizenLoss, Math.max(1, Math.floor(popTotal * 0.1)));
                    const allowed = Math.max(0, popTotal - BASE_POPULATION);
                    const actual = Math.min(extra, allowed);
                    if (actual > 0 && c) {
                      // Adults first (defenders), then elderly, children, toddlers.
                      let remaining = actual;
                      for (const cat of ["adults", "elderly", "children", "toddlers"] as const) {
                        if (remaining <= 0) break;
                        const take = Math.min(c[cat], remaining);
                        c[cat] -= take;
                        remaining -= take;
                      }
                    }
                  }
                  // Damage 1-3 random buildings
                  const damageable = serverState.buildings.filter((b: any) => b.level > 0 && !b.damaged && b.buildingId !== "town_hall");
                  const damageCount = Math.min(damageable.length, 1 + Math.floor(Math.random() * 3));
                  for (let d = 0; d < damageCount; d++) {
                    if (damageable.length === 0) break;
                    const idx = Math.floor(Math.random() * damageable.length);
                    damageable[idx].damaged = true;
                    damageable.splice(idx, 1);
                  }
                }

                serverState.lastRaidOutcome = sim.victory ? "victory" : "defeat";
                serverState.lastRaidTime = 0;
                serverState.raidsResolvedCount = (serverState.raidsResolvedCount ?? 0) + 1;
                if (!serverState.eventLog) serverState.eventLog = [];
                serverState.eventLog.unshift({
                  type: sim.victory ? "raid_victory" : "raid_defeat",
                  icon: sim.victory ? "🛡️" : "💔",
                  message: sim.victory
                    ? `Repelled ${raidName} while you were away! Loot: ${template.victoryLoot.map((l) => `+${l.amount} ${l.resource}`).join(", ")}`
                    : `Defeated by ${raidName} while you were away! Resources stolen, buildings damaged.`,
                  timestamp: Date.now(),
                });
              }
              serverState.incomingRaids.splice(i, 1);
            }
          }
        }
        // Race/origin/backstory backfill for adventurers from older saves
        const backfillOriginServer = (adv: any) => {
          if (adv.race) return;
          const hash = adv.name.split("").reduce((h: number, c: string) => h + c.charCodeAt(0), 0);
          const raceRoll = (hash % 100) / 100;
          const race: Race = raceRoll < RACE_WEIGHTS.elf ? "elf" : raceRoll < RACE_WEIGHTS.elf + RACE_WEIGHTS.dwarf ? "dwarf" : "human";
          const origins = getOriginsForRace(race);
          const origin = origins[hash % origins.length];
          const backstoryKeys = Object.keys(origin.backstories) as (keyof typeof origin.backstories)[];
          adv.race = race;
          adv.origin = origin.id;
          adv.backstory = origin.backstories[backstoryKeys[hash % backstoryKeys.length]];
          adv.quirk = PERSONALITY_QUIRKS[hash % PERSONALITY_QUIRKS.length];
          adv.trait = BACKSTORY_TRAITS[hash % BACKSTORY_TRAITS.length].id;
        };
        for (const adv of serverState.adventurers ?? []) backfillOriginServer(adv);

        setState(reconcile(serverState));
        // Catch up for time spent offline
        const offlineMs = Date.now() - serverState.lastTick;
        if (offlineMs > 2000) {
          try {
            offlineCatchUp(offlineMs, "server-load");
          } catch (err) {
            console.error("Offline catch-up error:", err);
            setState("lastTick", Date.now());
          }
        }
        // Resolve any missions/crafts with negative remaining (server tick counted down but didn't resolve)
        const hasUnresolved = serverState.activeMissions?.some((m) => m.remaining <= 0)
          || serverState.craftingQueue?.some((c) => c.remaining <= 0);
        if (hasUnresolved) {
          try { applyTicks(1000); } catch { /* already logged above */ }
        }
        logWinterOutlook();
      } else {
        // New settlement — start with a fresh initial state, not localStorage
        const fresh = createInitialState();
        setState(reconcile(fresh));
        saveSettlementApi(settlement.id, fresh).catch(() => {});
      }
    }
    // Auto-retry with backoff. Mobile networks blip; a single failure used
    // to fall through to the blank initial state, which fired the intro
    // cinematic and looked exactly like the user had lost their save.
    // 4 attempts, ~11s worst case before we surface an error screen.
    const RETRY_DELAYS_MS = [0, 1000, 3000, 7000];
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
      if (RETRY_DELAYS_MS[attempt] > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      }
      try {
        await loadFromServer();
        setLoaded(true);
        return;
      } catch (err) {
        lastErr = err;
        console.warn(
          `Settlement load attempt ${attempt + 1}/${RETRY_DELAYS_MS.length} failed:`,
          err,
        );
      }
    }
    const msg = (lastErr as any)?.message ?? String(lastErr ?? "Could not reach server");
    setLoadError(msg);
  });

  /** Check and unlock origin recipes when an adventurer's loyalty rank increases */
  function unlockOriginRecipes(s: GameState, adv: { name: string; origin: string }, newRank: { rank: number }) {
    const recipes = ORIGIN_RECIPES[adv.origin];
    if (!recipes) return;
    for (const { rank, recipeId } of recipes) {
      if (rank === newRank.rank && !s.discoveredRecipes.includes(recipeId)) {
        s.discoveredRecipes.push(recipeId);
        const recipeName = recipeId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        pushEvent(s, "loot_drop", "🍳", `${adv.name} shared the recipe for ${recipeName} with the kitchens!`);
      }
    }
  }

  function advanceSeason(s: GameState) {
    const prev = s.season;
    const next = nextSeason(s.season);
    s.season = next;
    s.seasonElapsed = 0;
    if (next === "spring") {
      s.year += 1;
      pushEvent(s, "building_completed", "🌱", "Spring has arrived — time to plant your fields!");
      // Aging tick: once per game-year. Toddlers age into children, children
      // into adults, adults into elderly, and a slice of the elderly pass on.
      // Deterministic fractions — no RNG, behaviour is reproducible.
      const aging = ageStep(s.citizens);
      s.citizens = aging.next;
      const g = aging.graduated;
      if (g.childToAdult > 0) {
        pushEvent(s, "citizen_born", "🧑", `${g.childToAdult} child${g.childToAdult > 1 ? "ren" : ""} came of age`);
      }
      if (g.adultToElderly > 0) {
        pushEvent(s, "citizen_born", "👵", `${g.adultToElderly} citizen${g.adultToElderly > 1 ? "s" : ""} entered their twilight years`);
      }
      if (aging.deaths > 0) {
        pushEvent(s, "citizen_died", "🪦", `${aging.deaths} elder${aging.deaths > 1 ? "s" : ""} passed peacefully over the winter`);
      }
    }
    // Record harvest totals and clear crops when entering winter
    if (next === "winter") {
      s.yearHarvest = {};
      for (const field of s.fields) {
        if (field.crop && field.level > 0) {
          // Planted this year — harvest with soil + climate multipliers applied
          const crop = getCrop(field.crop);
          const base = getSeasonYield(crop, field.level);
          const mult = getSoilMultiplier(field.sameCropStreak, field.restBonus);
          const amount = Math.max(0, Math.floor(base * mult * cropYieldMult(s)));
          s.yearHarvest[crop.name] = (s.yearHarvest[crop.name] ?? 0) + amount;
          field.harvested = true;
          field.crop = null;
          // Rest bonus is consumed by this harvest
          field.restBonus = false;
          // Straw byproduct — a hay rick stays on the field for the flock to eat
          // through winter (grain crops only; flax leaves nothing).
          field.hay = getHayFromHarvest(crop, amount);
        } else if (field.level > 0 && field.lastCrop !== null) {
          // Field was left idle through this growing season — grant rest bonus
          // for the next harvest. Only applies if there's been a previous crop
          // (fresh fields already have full yield).
          field.restBonus = true;
        }
      }
    }
    // Reset per-year UI flag in spring
    if (next === "spring") {
      for (const field of s.fields) {
        field.harvested = false;
        // Any hay not eaten over winter rots off — fields start the year clean.
        field.hay = 0;
      }
    }
    // A finished crop is cleared for replanting when its plant season comes
    // round again. That's also when we harvest seed: a steady plot returns its
    // sown seed plus a surplus (getSeedReturn), so it self-sustains and slowly
    // funds expansion. Skipped if the plot was never sown (seedsPlanted 0).
    for (const garden of s.gardens) {
      if (garden.plantedYear == null) continue;
      const veggie = getVeggie(garden.veggie);
      if (veggie.plantSeasons.includes(next) && garden.plantedYear < s.year) {
        if (garden.seedsPlanted > 0) {
          // Only the seeds that sprouted set new seed — germination losses carry
          // through, so the plot returns less than the raw sown count.
          const returned = getSeedReturn(garden.plantsAlive ?? 0);
          s.seeds[garden.veggie] = (s.seeds[garden.veggie] ?? 0) + returned;
          if (returned > 0) {
            pushEvent(s, "building_completed", veggie.icon, `Saved ${returned} ${veggie.name.toLowerCase()} seed from the ${veggie.name.toLowerCase()} crop`);
          }
        }
        garden.plantedYear = null;
        garden.seedsPlanted = 0;
        garden.sprouted = 0;
        garden.plantsAlive = 0;
      }
    }
    // Orchards save seed each spring — a bearing grove drops enough pips/cuttings
    // to slowly fund its own expansion (one per mature tree), like the garden
    // harvest surplus.
    if (next === SAPLING_PLANT_SEASON && s.fruitSeeds) {
      for (const orchard of s.orchards) {
        const returned = getOrchardSeedReturn(orchard.matureTrees);
        if (returned > 0) {
          s.fruitSeeds[orchard.fruit] = (s.fruitSeeds[orchard.fruit] ?? 0) + returned;
          const fruitDef = getFruit(orchard.fruit);
          pushEvent(s, "building_completed", fruitDef.icon, `Saved ${returned} ${fruitDef.name.toLowerCase()} seed from the grove`);
        }
      }
    }
    if (prev === "summer") {
      pushEvent(s, "building_completed", "🍂", "Autumn is here — harvest season begins!");
    }

    // Orchard maturation — age each sapling cohort a season; cohorts that reach
    // maturity join the bearing trees.
    for (const orchard of s.orchards) {
      if (orchard.upgrading || !orchard.saplings || orchard.saplings.length === 0) continue;
      const fruitDef = getFruit(orchard.fruit);
      let matured = 0;
      const stillGrowing: typeof orchard.saplings = [];
      for (const cohort of orchard.saplings) {
        const age = cohort.seasonsGrown + 1;
        if (age >= fruitDef.maturationSeasons) {
          matured += cohort.count;
        } else {
          stillGrowing.push({ count: cohort.count, seasonsGrown: age });
        }
      }
      orchard.saplings = stillGrowing;
      if (matured > 0) {
        const wasBearing = orchard.matureTrees > 0;
        orchard.matureTrees += matured;
        pushEvent(s, "building_completed", fruitDef.icon,
          wasBearing
            ? `${matured} more ${fruitDef.name} came into bearing.`
            : `Your ${fruitDef.name} are now bearing fruit!`);
      }
    }

    // Passive loyalty gain — +0.5 per season for alive, idle adventurers
    for (const adv of s.adventurers) {
      if (adv.alive && !adv.onMission) {
        const oldLoyalty = adv.loyalty ?? 0;
        const oldRank = getLoyaltyRank(oldLoyalty);
        adv.loyalty = Math.min(100, oldLoyalty + 0.5);
        const newRank = getLoyaltyRank(adv.loyalty);
        if (newRank.rank > oldRank.rank) {
          pushEvent(s, "loyalty_rankup", "💛", `${adv.name} is now ${newRank.title}!`);
          unlockOriginRecipes(s, adv as any, newRank);
        }
      }
    }
  }

  function applyTicks(elapsedMs: number, live: boolean = false) {
    // `live` distinguishes the foreground tick (player is watching) from the
    // offline catch-up. Audio cues only fire when live, so a player who
    // returns after a day doesn't get a barrage of "plop"s for every queued
    // upgrade that completed while they were away.
    const elapsedHours = elapsedMs / 3_600_000;
    const elapsedSeconds = elapsedMs / 1000;
    if (elapsedHours <= 0) return;

    // Chunk long offline catch-ups so feedback loops can self-balance: when
    // famine kills citizens, food consumption drops, and production can pull
    // the settlement out of deficit. Without chunking, 24h of offline decay
    // is applied in one shot and wipes a settlement that would have stabilized.
    // 1 game-hour per chunk is fine-grained enough for the dynamics; tens of
    // chunks are still cheap (each just reapplies the rate × elapsedHours math).
    const MAX_CHUNK_MS = 3_600_000; // 1 game-hour
    if (elapsedMs > MAX_CHUNK_MS) {
      let remaining = elapsedMs;
      while (remaining > 0) {
        const step = Math.min(remaining, MAX_CHUNK_MS);
        applyTicks(step, live);
        remaining -= step;
      }
      return;
    }

    setState(
      produce((s) => {
        // Advance season
        if (IS_DEV) {
          // Dev mode: season driven by game ticks (affected by speed)
          s.seasonElapsed += elapsedHours;
          while (s.seasonElapsed >= SEASON_ELAPSED_SPAN) {
            s.seasonElapsed -= SEASON_ELAPSED_SPAN;
            advanceSeason(s);
          }
        } else {
          // Production: season derived from real-world time (global for all players)
          const global = getGlobalSeason();
          if (global.season !== s.season) {
            // Season changed — trigger season-change logic
            while (s.season !== global.season) {
              advanceSeason(s);
            }
          }
          s.seasonElapsed = global.progress * SEASON_ELAPSED_SPAN;
          // Season is global/shared, but YEAR is local = settlement age.
          s.year = Math.max(1, global.year - (s.foundingYear ?? global.year) + 1);

          // No year-type forecast: the year is unpredictable, discovered as it's
          // lived. Its character comes through the weather it throws (a dry year
          // bakes with heat waves, a wet one floods) and the harvest that comes
          // in, not an announcement. The band still scales yield under the hood.

          // Clear blessing if the deity has rotated
          if (s.activeBlessing) {
            const currentDeity = getCurrentDeity(s.season, global.progress);
            if (currentDeity.id !== s.activeBlessing.deityId) {
              s.activeBlessing = null;
            }
          }
        }

        // A traveling merchant may arrive once the settlement is worth the trip.
        checkMerchantVisits(s);
        updateMerchantRecurrence(s);

        // Founding-winter grace: latch on the first tick whether the settlement
        // began in winter, then lift it the moment it leaves that first winter,
        // so the rationing help only ever eases the opening.
        if (s.foundingWinterGrace === undefined) s.foundingWinterGrace = s.season === "winter";
        else if (s.foundingWinterGrace && s.season !== "winter") s.foundingWinterGrace = false;

        const rates = calcProductionRates(s);
        // Animals eat from their preferred categories (and graze fallow fields) FIRST.
        // This drains the pantry in-place and returns a fedRatio per pen so
        // starving pens don't produce food/wool/leather this tick.
        const fedRatios = applyAnimalFeed(s, elapsedHours);
        applyFlockDynamics(s, fedRatios, elapsedHours);
        applyKeptAnimalTick(s, elapsedHours);
        const foodRates = calcFoodRates(s, fedRatios);

        // Lavender (a cultivated HERB, not food) yields to the herb stock — the
        // food loops skip it (its id isn't a FoodItemType). Grown for the tavern
        // tea/cake + calming draught.
        for (const g of s.gardens) {
          if (g.level === 0 || g.plantedYear == null || g.veggie !== "lavender") continue;
          const veg = getVeggie(g.veggie);
          if (!isVeggieProducing(veg, s.season)) continue;
          const rate = getLiveGardenRate(g.level, g.plantsAlive ?? 0);
          s.herbs.lavender = (s.herbs.lavender ?? 0) + rate * elapsedHours;
        }
        // Rationing: the founding-winter grace, plus a general belt-tightening
        // once the larder holds less than FAMINE_RATION_THRESHOLD_HOURS of food
        // (people eat less in a shortage, so a thin store stretches further and
        // buys recovery time before it hits zero). Take the more generous of the
        // two so they don't compound into an unintended deep cut.
        const advMouths = countLivingAdventurers(s.adventurers);
        const fullConsumption = calcFoodConsumption(s.citizens, advMouths, 1);
        const foodHoursLeft = fullConsumption > 0 ? getTotalFood(s.foods) / fullConsumption : Infinity;
        const scarcityRation = foodHoursLeft < FAMINE_RATION_THRESHOLD_HOURS ? FAMINE_RATION : 1;
        const rationMult = Math.min(s.foundingWinterGrace ? FOUNDING_WINTER_RATION : 1, scarcityRation);
        const citizenFood = calcFoodConsumption(s.citizens, advMouths, rationMult);
        const animalFood = calcAnimalFoodConsumption(s.pens);
        const caps = calcStorageCaps(s.buildings);
        s.storageCaps = caps; // surfaced for near-cap storage nudges (pantry/warehouse)
        const maxPop = calcMaxPopulation(s.buildings);
        const netFoodRate = rates.food - citizenFood - animalFood;
        s.netFoodPerHour = netFoodRate; // surfaced for surplus-gated quests + UI

        // Happiness production modifier: 100% baseline, drops below 50 happiness, bonus above 80
        const happinessMod = s.happiness >= 80 ? 1 + (s.happiness - 80) / 100  // 80→100% = 1.0→1.2
          : s.happiness >= 50 ? 1.0  // 50-79 = normal
          : 0.6 + (s.happiness / 50) * 0.4; // 0-49 = 0.6→1.0

        // Famine work penalty: starving folk can't do heavy labour. Ramps from
        // full to FAMINE_WORK_FLOOR over FAMINE_WORK_RAMP_HOURS of continuous
        // starvation (updated in the happiness block below), so wood/stone/gold
        // grind to a near-halt — you can't build your way through a famine, you
        // have to fix food first. NOT applied to food gathering (rates.food),
        // so foragers keep working and recovery stays possible.
        const famineFrac = Math.min(1, s.starvationHours / FAMINE_WORK_RAMP_HOURS);
        const famineMod = 1 - (1 - FAMINE_WORK_FLOOR) * famineFrac;

        s.resources.gold = Math.min(caps.gold, Math.max(0, s.resources.gold + rates.gold * happinessMod * famineMod * elapsedHours));
        s.resources.wood = Math.min(caps.wood, Math.max(0, s.resources.wood + rates.wood * happinessMod * famineMod * elapsedHours));
        s.resources.stone = Math.min(caps.stone, Math.max(0, s.resources.stone + rates.stone * happinessMod * famineMod * elapsedHours));

        // Enforce the crafting-material cap every tick (not just on production),
        // so a lowered cap — e.g. a damaged warehouse holding a level less —
        // spills the overflow instead of silently keeping over-cap stock.
        {
          const ccap = craftingMaterialCap(s.buildings);
          s.wool = Math.min(ccap, s.wool);
          s.fiber = Math.min(ccap, s.fiber);
          s.leather = Math.min(ccap, s.leather);
          s.iron = Math.min(ccap, s.iron);
          s.bone = Math.min(ccap, s.bone);
          // Same for food — a damaged pantry spoils the overflow (spilled
          // proportionally across the food types).
          const foodOver = getTotalFood(s.foods) - caps.food;
          if (foodOver > 0) consumeFood(s.foods, foodOver);
        }

        // ── Water — stream + wells + rain-catching cisterns fill the reserve
        // (unless the sluice is open, when it drains instead). A harsh weather
        // event then damages standing crops for as long as it lasts. ──
        {
          const wb = waterBalance(s);
          s.netWaterPerHour = wb.net; // surfaced for the deficit-gated cistern nudge
          const water = (s.resources.water ?? 0) + wb.net * elapsedHours;
          s.resources.water = Math.min(getWaterCap(wb.cisternLvl), Math.max(0, water));
          // A harsh weather event (heat wave / downpour) damages standing crops
          // while it lasts. The year type only scales yield (getClimateYield);
          // the killing lives here, on the momentary weather.
          applyWeatherCropDamage(s, wb.weather, elapsedHours);
          applyDeficitWilt(s, wb.cropCoverage, elapsedHours);
          // Surface sustained crop losses in the event log. This is the surface
          // that covers the tab-left-open case (a background catch-up applies
          // the wilt but builds no "while you were away" digest). Throttled to
          // one line per few plants lost, tagged with the cause, so a long heat
          // wave or dry spell doesn't spam a line every tick/chunk.
          const wilted = s.plantsWiltedEnv ?? 0;
          if (wilted - (s.plantsWiltedLogged ?? 0) >= 3) {
            const n = wilted - (s.plantsWiltedLogged ?? 0);
            const plural = n > 1 ? "s" : "";
            const [icon, msg] = s.lastWiltCause === "drown"
              ? ["🌊", `A downpour drowned ${n} garden plant${plural} in the sodden beds.`]
              : s.lastWiltCause === "thirst"
                ? ["🥀", `${n} garden plant${plural} wilted from thirst while the reserve ran low.`]
                : ["🥵", `The heat withered ${n} garden plant${plural}, even the watered beds.`];
            pushEvent(s, "drought", icon, msg);
            s.plantsWiltedLogged = wilted;
          }
        }

        // Food: add per-type production (capped at pantry total), then citizens eat proportionally.
        // Animal consumption already happened above in applyAnimalFeed.
        if (!s.foods) s.foods = emptyFoods();
        for (const [type, rate] of Object.entries(foodRates) as [FoodItemType, number][]) {
          if (rate > 0) addFood(s.foods, type, rate * happinessMod * elapsedHours, caps.food);
        }
        const foodToConsume = citizenFood * elapsedHours;
        if (foodToConsume > 0) {
          // Honey is eaten like any other food (in recipes, as a sweet with fruit
          // or cheese), so it's drawn down alongside the larder in proportion to
          // how much of the total stock it is.
          const larder = getTotalFood(s.foods);
          const honey = s.honey ?? 0;
          const pool = larder + honey;
          if (pool > 0) {
            const toConsume = Math.min(foodToConsume, pool);
            const honeyShare = (honey / pool) * toConsume;
            if (honeyShare > 0) s.honey = Math.max(0, honey - honeyShare);
            consumeFood(s.foods, toConsume - honeyShare);
          }
        }

        // ── Wool from sheep pens (seasonal) ──
        const woolSeasonMod = getWoolSeasonMod(s.season);
        for (const pen of s.pens) {
          if (pen.level === 0) continue;
          const ratio = fedRatios.get(pen.id) ?? 1;
          if (ratio <= 0) continue;
          const animal = getAnimal(pen.animal);
          const prod = getPenProduction(animal, pen.count);
          if (prod.secondary && prod.secondary.resource === "wool" && woolSeasonMod > 0) {
            s.wool = Math.min(craftingMaterialCap(s.buildings), s.wool + prod.secondary.amount * woolSeasonMod * ratio * elapsedHours);
          }
        }

        // ── Leather + bone from the hunting camp ──
        // Animal leather/bone otherwise comes only from CULLING now — a living
        // flock sheds wool, not hides (hunters, by contrast, bring skins home).
        const huntCampBldg = s.buildings.find((b) => b.buildingId === "hunting_camp");
        const huntingCampLvl = huntCampBldg?.damaged ? 0 : (huntCampBldg?.level ?? 0);
        if (huntingCampLvl > 0) {
          // Leather + bone track the food catch — scaled by season, staffing and
          // any hunting dogs posted (a damaged camp brings nothing home).
          const huntSeason = gatheringSeasonMod("hunting_camp", s.season) ?? 1;
          const huntStaff = getBuildingStaffing(s, "hunting_camp", huntingCampLvl).multiplier;
          const huntBoost = Math.min(0.5, s.keptAnimals.reduce((b, a) => a.job === "hunt" ? b + 0.08 * Math.max(1, a.huntLevel) : b, 0));
          const huntMult = huntSeason * huntStaff * (1 + huntBoost);
          s.leather = Math.min(craftingMaterialCap(s.buildings), s.leather + huntingCampLvl * 1.0 * huntMult * elapsedHours);
          s.bone = Math.min(craftingMaterialCap(s.buildings), s.bone + huntingCampLvl * 0.6 * huntMult * elapsedHours);
        }

        // ── Fiber from forager's hut (wild flax and plant fibers) ──
        const foragerBldg = s.buildings.find((b) => b.buildingId === "forager_hut");
        const foragerLvl = foragerBldg?.damaged ? 0 : (foragerBldg?.level ?? 0);
        if (foragerLvl > 0) {
          // Fiber + herb finds scale with season and staffing, like the catch.
          const foragerMult = (gatheringSeasonMod("forager_hut", s.season) ?? 1) * getBuildingStaffing(s, "forager_hut", foragerLvl).multiplier;
          s.fiber = Math.min(craftingMaterialCap(s.buildings), s.fiber + foragerLvl * 1.5 * foragerMult * elapsedHours);

          // ── Herb procs from foraging ──
          const foodForaged = foragerLvl * 8 * foragerMult * elapsedHours; // approximate food gathered
          s.foragedTotal = (s.foragedTotal ?? 0) + foodForaged;
          for (const herb of HERBS) {
            const herbChance = foodForaged * herb.dropRate;
            if (Math.random() < herbChance) {
              s.herbs[herb.id] = (s.herbs[herb.id] ?? 0) + 1;
              if (herb.rarity === "rare" || herb.rarity === "legendary") {
                pushEvent(s, "building_completed", herb.icon, `Your foragers found a rare ${herb.name}!`);
              }
            }
          }
        }

        // ── Fiber from flax harvest ──
        if (isHarvestTime(s.season, s.seasonElapsed)) {
          for (const field of s.fields) {
            if (field.level === 0 || !field.crop) continue;
            const crop = getCrop(field.crop);
            if (!crop.isFood && crop.foodType === "fiber") {
              const fiberRate = getSeasonYield(crop, field.level) / HARVEST_DURATION_HOURS;
              s.fiber = Math.min(craftingMaterialCap(s.buildings), s.fiber + fiberRate * elapsedHours);
            }
          }
        }

        // ── Adventurer recovery (Model C) ──────────────────────────
        // Wounded heroes regenerate HP over game-time while resting at home.
        // Lingering wounds (bleed/poison) block regen until they decay (later:
        // until treated by a potion / Edda / the Infirmary). Tunable.
        const REGEN_PCT_PER_HOUR = 0.12;       // full from empty in ~8 game-hours
        const HOURS_PER_CONDITION_ROUND = 1.5; // a 3-round wound lingers ~4.5 game-hours
        const FROTH_DRAIN_PCT_PER_HOUR = 0.08; // the froth worsens — ~12h from full to KO
        const VENOM_DRAIN_PCT_PER_HOUR = 0.05; // the fen's venom worsens SLOWER — ~20h to KO (time to brew a cure)
        for (const adv of s.adventurers) {
          if (!adv.alive || adv.onMission) continue;
          const advMaxHp = calcAdventurerMaxHp(adv);
          if (adv.currentHp == null) adv.currentHp = advMaxHp;
          if (adv.conditions?.length) {
            // The froth AND the fen's venom never fade on their own — only their
            // cures clear them (Boar's-Bane Salve / Herbal Antidote). The DoT
            // wounds (bleed/poison) decay over time as before.
            for (const c of adv.conditions) {
              if (c.type !== "froth" && c.type !== "venom") c.remainingRounds -= elapsedHours / HOURS_PER_CONDITION_ROUND;
            }
            const live = adv.conditions.filter((c) => c.type === "froth" || c.type === "venom" || c.remainingRounds > 0);
            adv.conditions = live.length ? live : undefined;
          }
          const hasFroth = adv.conditions?.some((c) => c.type === "froth");
          const hasVenom = adv.conditions?.some((c) => c.type === "venom");
          if (hasFroth) {
            // The froth worsens: it drains HP toward a KO floor (1) until treated.
            adv.currentHp = Math.max(1, adv.currentHp - advMaxHp * FROTH_DRAIN_PCT_PER_HOUR * elapsedHours);
          } else if (hasVenom) {
            // The fen's venom worsens too, but slower — time to brew and get an
            // antidote into them before it takes them to the KO floor.
            adv.currentHp = Math.max(1, adv.currentHp - advMaxHp * VENOM_DRAIN_PCT_PER_HOUR * elapsedHours);
          } else if (!adv.conditions?.length && adv.currentHp < advMaxHp) {
            adv.currentHp = Math.min(advMaxHp, adv.currentHp + advMaxHp * REGEN_PCT_PER_HOUR * elapsedHours);
          }
        }

        // ── Founder ailments (injury / illness) ────────────────────
        // A named founder can be hurt or fall sick, working their building at
        // reduced pace (via the staffing lever) until they recover. ALWAYS heals
        // by rest (restHours); a cure item just clears it early. Gated on having
        // SPARE citizens — no ailments while the founders are the only workforce
        // (no answer yet); seasonal; contagious illnesses raise the next's odds.
        {
          // Escalate + recover each active ailment.
          if (s.buildingAilments) {
            for (const [bid, ail] of Object.entries(s.buildingAilments)) {
              const def = getAilment(ail.ailmentId);
              const who = () => FOUNDING_CHARACTERS.find((f) => f.id === ail.founderId)?.name ?? ail.founderId;
              // Worsen: an untreated illness can settle deeper (a chill into the
              // chest → the deep-cough), likelier in the cold. Only while active,
              // so the player always had a window to treat it first.
              if (def?.escalatesTo) {
                const eh = (def.escalateHourly ?? 0) * (def.escalateSeasonWeight?.[s.season] ?? 1);
                if (eh > 0 && Math.random() < 1 - Math.pow(1 - eh, elapsedHours)) {
                  const worse = getAilment(def.escalatesTo);
                  if (worse) {
                    ail.ailmentId = worse.id;
                    ail.hoursRemaining = worse.restHours;
                    const from = def.name.toLowerCase().replace(/^(a|the) /, "");
                    pushEvent(s, "adventurer_wounded", worse.icon, `${who()}'s ${from} has settled into the chest — it is the deep-cough now.`);
                    continue; // worsened this tick; don't also tick recovery
                  }
                }
              }
              // Recover: rest ticks the countdown down; at zero it clears itself.
              ail.hoursRemaining -= elapsedHours;
              if (ail.hoursRemaining <= 0) {
                if (def) pushEvent(s, "building_completed", "💪", def.recovered(who()));
                delete s.buildingAilments[bid];
              }
            }
          }
          // Catch: only once there are spare (unassigned generic) adults — the
          // player has hands to shuffle and a way to brew medicine, so it's fair.
          const genericAdults = Math.max(0, s.citizens.adults - (s.namedResidents?.adults ?? 0));
          const assigned = Object.values(s.buildingWorkers ?? {}).reduce((a, b) => a + b, 0);
          const spareCitizens = genericAdults - assigned;
          if (spareCitizens > 0) {
            s.buildingAilments ??= {};
            const AILMENT_BASE_HOURLY = 0.0015; // mild — a few % per building per game-day
            const CONTAGION_K = 0.8;            // each active illness makes the next likelier
            const activeIllnesses = Object.values(s.buildingAilments)
              .filter((a) => getAilment(a.ailmentId)?.contagious).length;
            for (const [bid, cfg] of Object.entries(BUILDING_STAFF)) {
              const fid = cfg.founders?.[0];
              if (!fid) continue;                                  // adventurer-staffed → HP system, not this
              if (s.buildingAilments[bid]) continue;               // already ailing
              if ((s.buildings.find((b) => b.buildingId === bid)?.level ?? 0) <= 0) continue; // not built
              for (const a of AILMENTS.filter((x) => x.buildings.includes(bid) && x.catchable !== false)) {
                let hourly = AILMENT_BASE_HOURLY * (a.seasonWeight?.[s.season] ?? 1);
                if (a.contagious) hourly *= 1 + CONTAGION_K * activeIllnesses;
                const p = 1 - Math.pow(1 - hourly, elapsedHours);
                if (Math.random() < p) {
                  const who = FOUNDING_CHARACTERS.find((f) => f.id === fid)?.name ?? fid;
                  const where = BUILDINGS.find((b) => b.id === bid)?.name ?? bid;
                  s.buildingAilments[bid] = { ailmentId: a.id, founderId: fid, hoursRemaining: a.restHours };
                  pushEvent(s, "adventurer_wounded", a.icon, a.onset(who, where));
                  break; // one ailment per building per tick
                }
              }
            }
          }
        }

        // ── Honey from apiaries (seasonal) ──
        // Producing lavender gardens boost the yield — the bees forage the blooms.
        const LAVENDER_HONEY_BONUS = 0.15; // +15% honey per producing lavender garden
        const lavenderGardens = s.gardens.filter((g) =>
          g.level > 0 && g.plantedYear != null && g.veggie === "lavender" && isVeggieProducing(getVeggie(g.veggie), s.season),
        ).length;
        const lavenderHoneyMult = 1 + LAVENDER_HONEY_BONUS * lavenderGardens;
        const honeyCap = getHoneyStorageCap(s.hives);
        for (const hive of s.hives) {
          if (hive.level === 0 || hive.upgrading) continue;
          const rate = Math.floor(getHoneyRate(hive.level, s.season) * lavenderHoneyMult);
          if (rate > 0) {
            s.honey = Math.min(honeyCap, s.honey + rate * elapsedHours);
          }
        }

        // Orchards no longer use a separate state.fruit bucket — per-fruit
        // production is added via calcFoodRates above, into the typed pantry.

        // ── Iron production + gem/shard procs ──
        const ironMineLvl = s.buildings.find((b) => b.buildingId === "iron_mine")?.level ?? 0;
        const ironMineDamaged = s.buildings.find((b) => b.buildingId === "iron_mine")?.damaged ?? false;
        if (ironMineLvl > 0 && !ironMineDamaged) {
          const ironRate = 8 * ironMineLvl * getBuildingStaffing(s, "iron_mine", ironMineLvl).multiplier;
          const ironMined = ironRate * elapsedHours;
          s.iron = Math.min(craftingMaterialCap(s.buildings), s.iron + ironMined);

          // 0.5% chance per iron unit for gem, 0.5% for shard
          const gemChance = ironMined * 0.005;
          const shardChance = ironMined * 0.005;
          if (Math.random() < gemChance) {
            s.gems += 1;
            pushEvent(s, "building_completed", "💎", "Your miners unearthed a rare gem!");
          }
          if (Math.random() < shardChance) {
            s.astralShards += 1;
            pushEvent(s, "building_completed", "💠", "Your miners found an astral shard in the depths!");
          }
        }

        // ── Crafting queue tick ──
        // Only active (non-pending) entries tick. When an active one finishes
        // its last item, a pending entry in the SAME building gets promoted.
        for (let i = s.craftingQueue.length - 1; i >= 0; i--) {
          const craft = s.craftingQueue[i];
          if (craft.pending) continue;
          craft.remaining -= elapsedSeconds;
          if (craft.remaining <= 0) {
            const recipe = CRAFTING_RECIPES.find((r) => r.id === craft.recipeId);
            let completedBuilding: string | null = null;
            if (recipe) {
              const res = recipe.produces.resource;
              const amt = recipe.produces.amount;
              // Add to stockpile counters
              if (res === "clothing") s.clothing += amt;
              else if (res === "tools") s.tools += amt;
              else if (res === "weapons") s.weapons += amt;
              else if (res === "armor") s.armor += amt;
              else if (res === "potions") s.potions += amt;
              else if (res === "gold") s.resources.gold += amt;
              else if (res === "wool") s.wool += amt;
              else if (res === "fiber") s.fiber += amt;
              // Cooked meals (porridge/stew/...) are real food types — they land
              // in the larder and feed citizens (+ count toward diversity).
              else if (isFoodItemType(res)) addFood(s.foods, res, amt, caps.food);
              // Legacy generic "food" recipes land in inventory as mission supplies
              // (handled by getItemByRecipe below).
              else if (res === "food") { /* no-op */ }
              // Raw crafting materials (e.g. steel) — no category counter, no
              // equippable item; they live in the generic inventory.
              else {
                addInventoryItem(s, res, amt);
              }
              // Also add equippable item or building tool to inventory
              const itemDef = getItemByRecipe(recipe.id);
              if (itemDef) {
                addInventoryItem(s, itemDef.id, amt);
              }
              const toolDef = getBuildingToolByRecipe(recipe.id);
              if (toolDef) {
                addInventoryItem(s, toolDef.id, amt);
              }
              const remaining = (craft.quantity ?? 1) - 1;
              pushEvent(s, "building_completed", recipe.icon, `Crafted ${recipe.name}${remaining > 0 ? ` (${remaining} remaining)` : ""}`);
              // If more to craft, reset timer; otherwise remove from queue
              if (remaining > 0) {
                craft.remaining = recipe.craftTime;
                craft.quantity = remaining;
              } else {
                completedBuilding = recipe.building;
                s.craftingQueue.splice(i, 1);
              }
            } else {
              // Check alchemy recipes (herb-based potions)
              const alchRecipe = ALCHEMY_RECIPES.find((r) => r.id === craft.recipeId);
              if (alchRecipe) {
                const existing = s.inventory.find((i) => i.itemId === alchRecipe.id);
                if (existing) existing.quantity += 1;
                else s.inventory.push({ itemId: alchRecipe.id, quantity: 1 });
                s.potions += 1;
                const remaining = (craft.quantity ?? 1) - 1;
                pushEvent(s, "building_completed", alchRecipe.icon, `Brewed ${alchRecipe.name}${remaining > 0 ? ` (${remaining} remaining)` : ""}`);
                if (remaining > 0) {
                  craft.remaining = alchRecipe.craftTime;
                  craft.quantity = remaining;
                } else {
                  completedBuilding = "alchemy_lab";
                  s.craftingQueue.splice(i, 1);
                }
              } else {
                s.craftingQueue.splice(i, 1);
              }
            }
            // Promote the next pending entry in the same building (if any)
            if (completedBuilding) {
              const nextPending = s.craftingQueue.find((c) => {
                if (!c.pending) return false;
                const r = CRAFTING_RECIPES.find((cr) => cr.id === c.recipeId);
                if (r) return r.building === completedBuilding;
                // Alchemy recipes share a single "alchemy_lab" slot pool
                return completedBuilding === "alchemy_lab" && ALCHEMY_RECIPES.some((ar) => ar.id === c.recipeId);
              });
              if (nextPending) {
                nextPending.pending = false;
                // Reset the timer now that it's starting
                const r = CRAFTING_RECIPES.find((cr) => cr.id === nextPending.recipeId)
                  ?? (ALCHEMY_RECIPES.find((ar) => ar.id === nextPending.recipeId) as any);
                if (r) nextPending.remaining = r.craftTime;
              }
            }
          }
        }

        // ── Passive cooking: "keep the fire lit" while ingredients + wood last ──
        // Each autoCook building re-starts its recipe whenever it's idle, paying a
        // small wood fuel cost per game-hour while a batch actually cooks. The
        // completion loop above routes the cooked food into the larder. (Cooking
        // recipe costs are food-type only, so getFoodCostAmount covers them.)
        const FUEL_WOOD_PER_HOUR = 1;
        for (const [autoBuildingId, autoRecipeIds] of Object.entries(s.autoCook ?? {})) {
          const autoBldg = s.buildings.find((b) => b.buildingId === autoBuildingId);
          if (!autoBldg || autoBldg.damaged) continue;
          // Each kept-cooking dish is its own pot: re-starts when idle and burns
          // its own fuel while lit, so N pots burn N× the wood.
          for (const autoRecipeId of autoRecipeIds ?? []) {
            const autoRecipe = CRAFTING_RECIPES.find((r) => r.id === autoRecipeId);
            if (!autoRecipe || autoBldg.level < autoRecipe.minLevel) continue;
            const cooking = s.craftingQueue.some((c) => c.recipeId === autoRecipeId && !c.pending);
            if (cooking) {
              s.resources.wood = Math.max(0, s.resources.wood - FUEL_WOOD_PER_HOUR * elapsedHours);
            } else {
              const canAfford = autoRecipe.costs.every((c) => getFoodCostAmount(s.foods, c.resource) >= c.amount);
              if (s.resources.wood > 0 && canAfford) {
                for (const c of autoRecipe.costs) consumeFoodCost(s.foods, c.resource, c.amount);
                // Passive pots run on a slow, sustainable cadence (much longer
                // than the snappy active craft) so they trickle food instead of
                // draining the larder's raw ingredients in minutes.
                s.craftingQueue.push({ recipeId: autoRecipeId, remaining: passiveCookTime(autoRecipe), quantity: 1 });
              }
            }
          }
        }

        // ── Clothing degradation ──
        s.clothing = Math.max(0, s.clothing - (CLOTHING_DEGRADE_PER_DAY / 24) * elapsedHours);

        // ── Tavern drinks (ale/mead/cider/…) ── Brew each into its barrel and
        //    pour it menu-driven — all generic over TAVERN_COMMODITY_DRINKS (see
        //    tickDrink). Off the menu the barrel fills to cap and rests, so the
        //    brewery stops drawing its input (the runaway-drain fix).
        const tavernBldg = s.buildings.find((b) => b.buildingId === "tavern");
        const tavernLvl = tavernBldg?.level ?? 0;
        const tavernDamaged = tavernBldg?.damaged ?? false;
        const drinkResults = TAVERN_COMMODITY_DRINKS.map((cfg) => tickDrink(s, cfg, elapsedHours));

        // ── Winter cold (clothing reduces wood needed) ──
        const isWinter = s.season === "winter";
        if (isWinter) {
          const popTotal = totalPopulation(s.citizens);
          const clothingNeeded = Math.ceil(popTotal / CLOTHING_PER_CITIZENS);
          const clothingRatio = Math.min(1, s.clothing / Math.max(1, clothingNeeded));
          const woodReduction = clothingRatio * CLOTHING_WINTER_WOOD_REDUCTION;
          const woodNeeded = WINTER_WOOD_PER_CITIZEN_PER_HOUR * (1 - woodReduction) * popTotal * elapsedHours;
          if (s.resources.wood >= woodNeeded) {
            s.resources.wood -= woodNeeded;
          } else {
            s.resources.wood = 0;
            // Freezing — vulnerable categories die first (elderly + toddlers
            // before children + adults). Total clamped to BASE_POPULATION.
            const frozenBefore = totalPopulation(s.citizens);
            const rawDeaths = WINTER_NO_WOOD_DEATH_RATE * elapsedHours;
            const allowed = Math.max(0, frozenBefore - BASE_POPULATION);
            const deaths = Math.floor(Math.min(rawDeaths, allowed));
            if (deaths > 0) {
              s.citizens = reduceByPriority(s.citizens, deaths, ["elderly", "toddlers", "children", "adults"], s.namedResidents);
              pushEvent(s, "winter_freezing", "🥶", `${deaths} citizen${deaths > 1 ? "s" : ""} froze to death`);
            }
          }
        }

        // ── Happiness calculation ──
        let happiness = 50; // baseline

        // Food surplus/deficit — deficit is punishing; surplus caps modestly
        if (netFoodRate > 0) happiness += Math.min(15, netFoodRate / 5);
        else if (netFoodRate < 0) happiness -= Math.min(40, Math.abs(netFoodRate) / 2);

        // Starvation penalty — resets to 75 when people starve, decays over 24h after food is restored
        if (!peopleAreFed(s)) {
          s.starvationPenalty = 75; // hold at max while starving
          // Hunger deepens with time — drives the famine work penalty above.
          s.starvationHours += elapsedHours;
        } else if (s.starvationPenalty > 0) {
          // Decay: lose 75 points over 24 hours = ~3.125 per hour
          s.starvationPenalty = Math.max(0, s.starvationPenalty - (75 / 24) * elapsedHours);
          // Strength returns roughly twice as fast as it drained once fed.
          s.starvationHours = Math.max(0, s.starvationHours - elapsedHours * 2);
        } else {
          s.starvationHours = 0;
        }
        if (s.starvationPenalty > 0) happiness -= Math.round(s.starvationPenalty);

        // Newborn glow — fades over 24 game-hours.
        if (s.newbornGlow > 0) {
          s.newbornGlow = Math.max(0, s.newbornGlow - (10 / 24) * elapsedHours);
          happiness += Math.round(s.newbornGlow);
        }

        // Winter cold
        if (isWinter) {
          happiness += WINTER_HAPPINESS_PENALTY;
          if (s.resources.wood <= 0) happiness += WINTER_NO_WOOD_HAPPINESS;
        }

        // Housing — real overcrowding penalty, scaled by the overflow. Beds are
        // shared: living adventurers occupy them too, home or away.
        const occupancy = totalPopulation(s.citizens) + countLivingAdventurers(s.adventurers);
        happiness -= overcrowdingPenalty(occupancy, maxPop);

        // Shrine — a desecrated (damaged) shrine gives no comfort until restored.
        const shrineB = s.buildings.find((b) => b.buildingId === "shrine");
        if (shrineB && shrineB.level > 0 && !shrineB.damaged) happiness += shrineB.level * SHRINE_HAPPINESS_PER_LEVEL;

        // Tavern happiness. Drinks are opt-in: if any drink is on the menu, at
        // least one flowing barrel cheers the settlement and an all-dry board
        // disappoints; feature no drinks and there's no drink-driven swing.
        if (tavernLvl > 0 && (tavernDamaged || drinkResults.some((r) => r.onMenu))) {
          // Damaged → the dry floor (folk barely gather at a broken tavern);
          // otherwise the usual swing (a flowing barrel cheers, all-dry disappoints).
          const anyFlowing = !tavernDamaged && drinkResults.some((r) => r.onMenu && r.consumed / (r.needed || 1) > 0.5);
          happiness += anyFlowing ? tavernLvl * TAVERN_HAPPINESS_PER_LEVEL : tavernLvl * TAVERN_HAPPINESS_DRY;
        }

        // Clothing — scaled penalty when underclothed, doubled in winter
        const clothingNeededHappy = Math.ceil(totalPopulation(s.citizens) / CLOTHING_PER_CITIZENS);
        if (clothingNeededHappy > 0) {
          const clothRatio = Math.min(1, s.clothing / clothingNeededHappy);
          if (clothRatio >= 1) {
            happiness += CLOTHING_HAPPINESS_BONUS;
          } else if (clothRatio < 0.5) {
            // Scale from -5 (at 50%) to -15 (at 0%), doubled in winter
            const penalty = -Math.round(5 + 10 * (1 - clothRatio * 2));
            happiness += isWinter ? penalty * 2 : penalty;
          }
        }

        // Food diversity
        const foodSources = new Set<string>();
        for (const pb of s.buildings) {
          if (pb.level === 0 || pb.damaged) continue;
          const def = BUILDINGS.find((b) => b.id === pb.buildingId);
          if (def) {
            const lvlDef = def.levels[pb.level - 1];
            if (lvlDef?.production?.foodType) foodSources.add(lvlDef.production.foodType);
          }
        }
        for (const garden of s.gardens) {
          if (garden.level > 0) foodSources.add("veggies");
        }
        for (const pen of s.pens) {
          if (pen.level > 0) {
            const animal = getAnimal(pen.animal);
            foodSources.add(animal.foodLabel.toLowerCase());
          }
        }
        const foodTypes = foodSources.size;
        if (getTotalFood(s.foods) > 0) {
          if (foodTypes <= 1) happiness -= 12;
          else if (foodTypes === 2) happiness -= 5;
          else if (foodTypes === 3) happiness += 3;
          else if (foodTypes === 4) happiness += 6;
          else if (foodTypes >= 5) happiness += 10;
        }

        // Damaged buildings
        const damagedCount = s.buildings.filter((b) => b.damaged).length;
        if (damagedCount > 0) happiness -= damagedCount * 3;

        // Raid morale (decays over 48 game-hours)
        s.lastRaidTime += elapsedHours;
        if (s.lastRaidOutcome !== "none") {
          const decay = Math.max(0, 1 - s.lastRaidTime / 48);
          if (s.lastRaidOutcome === "victory") happiness += Math.round(10 * decay);
          else if (s.lastRaidOutcome === "defeat") happiness -= Math.round(15 * decay);
          if (decay <= 0) s.lastRaidOutcome = "none";
        }

        s.happiness = Math.max(0, Math.min(100, Math.round(happiness)));

        // ── Tavern: traveler gold + reputation drift ──
        // Staffing gates whether beds can be served, pricing trades crowd for
        // margin, reputation raises the ceiling. Uses the finalized happiness so
        // occupancy tracks the real mood. calcTavern is the shared source of truth.
        if (tavernLvl > 0 && !tavernDamaged) {
          // Cook-to-order: a featured dish is served only if its recipe is
          // unlocked AND its ingredients are in stock. Serving consumes those
          // ingredients (no pre-cooked stock). Unavailable dishes drop off and
          // stop counting toward variety.
          const servable = (s.tavernMenu ?? [])
            .map((id) => KITCHEN_DISH_BY_ID.get(id))
            .filter((r): r is CraftingRecipe => !!r && dishUnlocked(s, r) && dishAvailable(s, r));
          const t = calcTavern({
            level: tavernLvl,
            happiness: s.happiness,
            townHallLevel: getTownHallLevel(s.buildings),
            menuVariety: servable.length,
            servers: s.tavernServers ?? 0,
            pricing: s.tavernPricing ?? "fair",
            reputation: s.tavernReputation ?? 0,
          });
          const travelerGold = (t.goldPerDay / 24) * elapsedHours;
          if (travelerGold > 0) {
            const goldCap = calcStorageCaps(s.buildings).gold;
            s.resources.gold = Math.min(goldCap, s.resources.gold + travelerGold);
          }
          // Reputation eases toward the current service quality (bounded step).
          const target = t.serviceQuality * 100;
          const step = REPUTATION_DRIFT_PER_HOUR * elapsedHours;
          const rep = s.tavernReputation ?? 0;
          s.tavernReputation = Math.max(0, Math.min(100,
            rep + Math.max(-step, Math.min(step, target - rep)),
          ));
          // Guests are fed by cooking the featured dishes to order — the total
          // "food eaten" is split across what's servable, and each dish's share
          // is turned into ingredient consumption via its recipe (cost ÷ yield).
          if (servable.length > 0) {
            const eaten = t.rooms * t.occupancy * TAVERN_FOOD_PER_ROOM_PER_HOUR * elapsedHours;
            const perDish = eaten / servable.length;
            for (const r of servable) {
              const batches = perDish / (r.produces.amount || 1);
              for (const c of r.costs) spendDishCost(s, c.resource, c.amount * batches);
            }
          }
        }

        // Tick upgrades — buildings, fields, gardens, pens, hives, orchards
        // Tracks whether anything finished this tick so we can re-evaluate
        // narrative events afterwards (events with building_built triggers
        // would otherwise sit dormant until the next quest claim).
        let buildingFinishedThisTick = false;
        for (const list of [s.buildings, s.fields, s.gardens, s.pens, s.hives, s.orchards]) {
          for (const item of list) {
            if (item.upgrading && item.upgradeRemaining !== undefined) {
              item.upgradeRemaining -= elapsedSeconds;
              if (item.upgradeRemaining <= 0) {
                item.level += 1;
                item.upgrading = false;
                item.upgradeRemaining = undefined;
                buildingFinishedThisTick = true;
                // Log building completion
                if ("buildingId" in item) {
                  const def = BUILDINGS.find((b) => b.id === (item as any).buildingId);
                  if (def) pushEvent(s, "building_completed", def.icon, `${def.name} upgraded to level ${item.level}`);
                  const doneId = (item as any).buildingId;
                  // The Hunting Camp comes with Nessa's hound; a raised Kennel
                  // takes in Truffle the stray.
                  if (doneId === "hunting_camp" && item.level === 1) grantHuntingCampDog(s);
                  if (doneId === "kennel" && item.level === 1) grantStrayTruffle(s);
                }
                if (live) playSound("plop");
              }
            }
          }
        }

        // Tick in-progress building repairs — mending keeps the building
        // `damaged` (reduced function) until the timer runs out, then restores it.
        for (const b of s.buildings) {
          if (b.repairRemaining == null) continue;
          b.repairRemaining -= elapsedSeconds;
          if (b.repairRemaining <= 0) {
            b.repairRemaining = undefined;
            b.damaged = false;
            const def = BUILDINGS.find((d) => d.id === b.buildingId);
            if (def) pushEvent(s, "building_repaired", "🔨", `${def.name} repaired`);
            if (live) playSound("plop");
          }
        }

        // Tick defense upgrades — walls, watchtowers, barracks, mage tower.
        // Walls also need their HP refilled to the new full value when the
        // upgrade completes, so they can't share the generic loop above.
        for (const w of s.walls) {
          if (w.upgrading && w.upgradeRemaining !== undefined) {
            w.upgradeRemaining -= elapsedSeconds;
            if (w.upgradeRemaining <= 0) {
              w.level += 1;
              w.hp = w.level * WALL_BASE_HP;
              w.upgrading = false;
              w.upgradeRemaining = undefined;
              buildingFinishedThisTick = true;
              pushEvent(s, "building_completed", "🧱", `${capitalize(w.ring)} wall raised to level ${w.level}`);
              if (live) playSound("plop");
            }
          }
        }
        for (const t of s.watchtowers) {
          if (t.upgrading && t.upgradeRemaining !== undefined) {
            t.upgradeRemaining -= elapsedSeconds;
            if (t.upgradeRemaining <= 0) {
              t.level += 1;
              t.upgrading = false;
              t.upgradeRemaining = undefined;
              buildingFinishedThisTick = true;
              pushEvent(s, "building_completed", "🏰", `${capitalize(t.ring)} watchtower raised to level ${t.level}`);
              if (live) playSound("plop");
            }
          }
        }
        for (const b of s.barracks) {
          if (b.upgrading && b.upgradeRemaining !== undefined) {
            b.upgradeRemaining -= elapsedSeconds;
            if (b.upgradeRemaining <= 0) {
              b.level += 1;
              b.upgrading = false;
              b.upgradeRemaining = undefined;
              buildingFinishedThisTick = true;
              pushEvent(s, "building_completed", "⚔️", `${capitalize(b.ring)} barracks raised to level ${b.level}`);
              if (live) playSound("plop");
            }
          }
        }
        if (s.mageTower.upgrading && s.mageTower.upgradeRemaining !== undefined) {
          s.mageTower.upgradeRemaining -= elapsedSeconds;
          if (s.mageTower.upgradeRemaining <= 0) {
            s.mageTower.level += 1;
            s.mageTower.upgrading = false;
            s.mageTower.upgradeRemaining = undefined;
            buildingFinishedThisTick = true;
            pushEvent(s, "building_completed", "🗼", `Mage Tower raised to level ${s.mageTower.level}`);
            if (live) playSound("plop");
          }
        }

        // Run the narrative event evaluator if any building finished —
        // events with building_built triggers (like event_hunters_volunteer,
        // which fires when Houses + Hunter Camp are both up) would otherwise
        // sit dormant until the next quest claim or story-mission completion.
        if (buildingFinishedThisTick) {
          applyEventEvaluation(s);
        }

        // ── Yearly birth roll ──
        // Fires at most once per game-year, gated by adults / food / happy /
        // housing. Up to 2 newborns per year — one 50% roll per adult pair,
        // capped at 2. Each birth grants a fading happiness bonus.
        if (s.year > (s.lastBirthYear ?? 0)) {
          s.lastBirthYear = s.year;
          // Occupancy (citizens + adventurers sharing beds) gates growth: a town
          // whose beds are full of adventurers has no room for new families.
          const occupancy = totalPopulation(s.citizens) + countLivingAdventurers(s.adventurers);
          const eligible =
            s.citizens.adults >= 2 &&
            netFoodRate > 0 &&
            s.happiness >= 60 &&
            occupancy < 0.9 * maxPop;
          if (eligible) {
            const pairs = Math.floor(s.citizens.adults / 2);
            let births = 0;
            for (let i = 0; i < pairs && births < 2; i++) {
              if (Math.random() < 0.5) births++;
            }
            if (births > 0) {
              s.citizens.toddlers += births;
              // Stack-cap: multiple births don't compound the buff.
              s.newbornGlow = Math.max(s.newbornGlow, 10);
              const msg = births === 1
                ? "A baby has been born — the settlement welcomes a new life."
                : `${births} babies have been born — the settlement welcomes new life.`;
              pushEvent(s, "citizen_born", "👶", msg);
            }
          }
        }

        // Villager growth / decline
        const popBefore = totalPopulation(s.citizens);
        const occupancyBefore = popBefore + countLivingAdventurers(s.adventurers);
        if (netFoodRate > 0 && occupancyBefore < maxPop && s.happiness >= 20) {
          // Growth fires as a low-probability event per tick — when it lands,
          // it's a weighted family unit (drifter / couple / family / elder),
          // not a flat +1 adult. See data/citizens.ts for the table.
          const growthMod = s.happiness >= 70 ? 1.5 : s.happiness >= 40 ? 1.0 : 0.5;
          const arrivalChance = (1 / VILLAGER_GROWTH_INTERVAL_HOURS) * elapsedHours * growthMod;
          if (Math.random() < arrivalChance) {
            const arrival = rollArrival(s.happiness);
            s.citizens = addCitizens(s.citizens, arrival.delta);
            // Cap at maxPop — if the arrival would overflow, scale the delta.
            const newTotal = totalPopulation(s.citizens);
            if (newTotal > maxPop) {
              const overflow = newTotal - maxPop;
              s.citizens = reduceByPriority(s.citizens, overflow, ["toddlers", "children", "elderly", "adults"], s.namedResidents);
            }
            // Newcomers arrive with their own clothes (scaled to how many came).
            s.clothing += CLOTHING_PER_ARRIVAL * Math.max(1, totalPopulation(arrival.delta));
            pushEvent(s, "citizen_born", "👤", arrival.flavor);
          }
        } else if (popBefore > BASE_POPULATION) {
          // Starvation and unhappiness stack — percentage-based so it scales with population.
          // Unhappiness-departure is gated to Village+ tier: at Camp tier the
          // player has very few happiness levers (no ale chain, no church,
          // limited food variety) so losing citizens to a happiness dip would
          // be a frustrating "step forward, step back" loop right when new
          // arrivals show up. Starvation still applies at Camp — that's a
          // binary "have food or don't" mechanic the player can directly act on.
          const currentTier = getSettlementTier(getTownHallLevel(s.buildings));
          let ratePct = 0;
          if (!peopleAreFed(s)) ratePct += 0.10; // 10%/hour — brutal, but self-correcting as pop drops
          if (s.happiness < 20 && currentTier !== "camp") ratePct += 0.02;      // 2%/hour fleeing (Village+)
          if (ratePct > 0) {
            // Exponential decay applied as a survival ratio across every
            // category. Clamped so total never drops below BASE_POPULATION.
            const tickSurvival = Math.pow(1 - ratePct, elapsedHours);
            const minRatio = popBefore > 0 ? BASE_POPULATION / popBefore : 1;
            const ratio = Math.max(tickSurvival, minRatio);
            const before = { ...s.citizens };
            s.citizens = applySurvivalRatio(s.citizens, ratio, s.namedResidents);
            // Soldiers/archers are citizens too — match the adult-survival ratio
            // for per-building garrisons + global totals.
            if (before.adults > 0) {
              const adultRatio = s.citizens.adults / before.adults;
              const archersBefore = s.archers;
              const soldiersBefore = s.soldiers;
              for (const t of s.watchtowers) t.garrison.count = Math.floor(t.garrison.count * adultRatio);
              for (const b of s.barracks) b.garrison.count = Math.floor(b.garrison.count * adultRatio);
              s.archers = s.watchtowers.reduce((sum, t) => sum + t.garrison.count, 0);
              s.soldiers = s.barracks.reduce((sum, b) => sum + b.garrison.count, 0);
              const archersLost = archersBefore - s.archers;
              const soldiersLost = soldiersBefore - s.soldiers;
              if (archersLost > 0) {
                const word = archersLost === 1 ? "archer" : "archers";
                pushEvent(s, "citizen_died", "🏹", `${archersLost} ${word} lost to the famine`);
              }
              if (soldiersLost > 0) {
                const word = soldiersLost === 1 ? "soldier" : "soldiers";
                pushEvent(s, "citizen_died", "⚔️", `${soldiersLost} ${word} lost to the famine`);
              }
            }
          }
        }
        const popAfter = totalPopulation(s.citizens);
        if (popAfter < popBefore) {
          const lost = popBefore - popAfter;
          if (!peopleAreFed(s)) {
            pushEvent(s, "citizen_died", "💀", `${lost} citizen${lost > 1 ? "s" : ""} starved to death`);
          } else if (s.happiness < 20) {
            pushEvent(s, "citizen_left", "🚶", `${lost} citizen${lost > 1 ? "s" : ""} left (unhappy)`);
          }
        }

        // ── Adventurer's Guild tick ──
        const guildLvl = s.buildings.find((b) => b.buildingId === "adventurers_guild")?.level ?? 0;
        if (guildLvl > 0) {
          // Tick active missions
          for (let i = s.activeMissions.length - 1; i >= 0; i--) {
            const am = s.activeMissions[i];
            am.remaining -= elapsedSeconds;

            // ── Expedition event ticking ──────────────────────────
            const expTemplate = getMission(am.missionId);
            if (expTemplate && isExpedition(expTemplate) && am.expeditionResolvedEvents && am.initialDuration) {
              const events = am.expeditionResolvedEvents;
              const totalEvents = events.length;
              // How many events should have fired by now? Evenly spaced across duration.
              const elapsed = am.initialDuration - Math.max(0, am.remaining);
              const shouldHaveFired = Math.min(totalEvents, Math.floor((elapsed / am.initialDuration) * totalEvents + 0.0001) + 1);

              const team = am.adventurerIds.map((id) => s.adventurers.find((a) => a.id === id)).filter(Boolean) as Adventurer[];
              const hpMap = am.expeditionHp ?? {};
              const maxHpMap = am.expeditionMaxHp ?? {};
              const rewards = am.expeditionRewards ?? [];
              const log = am.expeditionLog ?? [];
              const supplies = am.adventurerSupplies ?? {};

              while ((am.expeditionEventIndex ?? 0) < Math.min(shouldHaveFired, totalEvents)) {
                const eventIdx = am.expeditionEventIndex ?? 0;
                const ev = events[eventIdx];

                // Between-event heal (skipped before first event — team starts fresh)
                if (eventIdx > 0) {
                  applyBetweenEventHeal(team, hpMap, maxHpMap);
                  applyRecoveryItems(team, hpMap, maxHpMap, supplies);
                }

                // Seed for deterministic combat simulation in expeditions
                let seed = 0;
                const seedStr = am.missionId + "|" + eventIdx;
                for (let j = 0; j < seedStr.length; j++) seed = ((seed << 5) - seed + seedStr.charCodeAt(j)) | 0;

                resolveExpeditionEvent(ev, {
                  template: expTemplate as any,
                  team,
                  hpMap,
                  maxHpMap,
                  rewards,
                  log,
                  supplies,
                  seed,
                  eventIndex: eventIdx,
                });

                am.expeditionEventIndex = eventIdx + 1;

                // If team wiped, fast-forward to mission completion
                if (isTeamWiped(team, hpMap)) {
                  am.remaining = 0;
                  break;
                }
              }

              // Persist back
              am.expeditionHp = hpMap;
              am.expeditionRewards = rewards;
              am.expeditionLog = log;
              am.adventurerSupplies = supplies;
            }

            // Wipe shortcut: a non-expedition mission whose entire team will
            // permadie has no team to make the return trip. Two cases:
            //   - Player engaged with the watch modal → wait for them to
            //     close it before zeroing (handled by acknowledgeWipeCompletion
            //     action); this gate prevents the modal from being unmounted
            //     mid-watch when phase shifts to homeward.
            //   - AFK / 2-min cap fired → combatViewed stays false; we zero
            //     here so the mission still wraps up.
            if (am.wiped && am.remaining > 0 && !am.combatViewed) {
              const phase = getMissionPhase(am);
              if (phase === "homeward") am.remaining = 0;
            }

            if (am.remaining <= 0) {
              // Mission complete — resolve
              const template = getMission(am.missionId);
              const team = am.adventurerIds.map((id) => s.adventurers.find((a) => a.id === id)).filter(Boolean) as Adventurer[];

              const isExped = template && isExpedition(template);

              // Combat simulation for single-encounter missions; expeditions use pre-resolved event data; stat-based for the rest.
              // Use pre-rolled result from deploy time when available (so the player
              // can watch the playback mid-mission via the active card). Old saves
              // without prerolledCombat fall back to compute-at-completion.
              const combatResult = (isExped || !template)
                ? null
                : (am.prerolledCombat ?? (template.encounters?.length ? simulateCombat(template, team, am.adventurerSupplies) : null));
              // Discovery missions succeed on the objective (what the team learns)
              // even if the fight is lost — the combat still ran, so survivors
              // come home wounded via the HP block below, but the mission completes
              // and the death block is skipped (a scripted retreat, no permadeath).
              const success = template?.discoveryMission
                // Discovery scouts can't win the fight; completion rides on the
                // headcount success chance (teamSizeSuccess) rather than combat.
                // Legacy discovery missions (no teamSizeSuccess) still auto-complete.
                ? (template.teamSizeSuccess ? Math.random() * 100 < am.successChance : true)
                : isExped
                ? !isTeamWiped(team, am.expeditionHp ?? {})
                : (combatResult ? combatResult.victory : Math.random() * 100 < am.successChance);

              const casualties: string[] = [];
              const revived: string[] = [];
              const levelUps: string[] = [];
              const rankUps: { name: string; newRank: string }[] = [];
              // ID-based set of dead adventurers, used by all the post-death
              // gates below (XP, loyalty, assassin survivor rewards). The
              // pre-existing `casualties.includes(adv.id)` checks were buggy
              // because casualties stores names, not IDs.
              const deadIdsSet = new Set<string>();

              // Snapshot each deployed hero's vitals BEFORE any mutation (deaths,
              // XP, HP write-home all mutate the live adventurer in place). Powers
              // the loot modal's team strip: hp/xp animate from these to the after
              // values assembled at the result push below.
              const rosterBefore = new Map<string, { hp: number; xp: number; level: number }>();
              for (const adv of team) {
                rosterBefore.set(adv.id, {
                  hp: Math.round(adv.currentHp ?? calcAdventurerMaxHp(adv)),
                  xp: adv.xp,
                  level: adv.level,
                });
              }

              // Expeditions: compute fallen from HP at end of mission. Regular missions: use combat result.
              const expeditionFallenIds = isExped
                ? new Set(team.filter((a) => (am.expeditionHp?.[a.id] ?? 0) <= 0).map((a) => a.id))
                : null;

              // Discovery scouts never permadeath, even on a failed headcount
              // roll: the fight is unwinnable by design, so a loss is a wounded
              // retreat, never a grave.
              if ((!success || (isExped && expeditionFallenIds && expeditionFallenIds.size > 0)) && template && !template.discoveryMission) {
                // Prefer deploy-time prerolled deaths (regular missions ran
                // rollPermanentDeaths at deploy and stamped log entries).
                // For paths that don't preroll (expeditions, legacy saves)
                // we run the same helper now so death chance honors supplies
                // and the warrior/priest rules stay in lock-step.
                let deadIds: string[];
                if (am.prerolledCombat?.permanentDeaths) {
                  deadIds = [...am.prerolledCombat.permanentDeaths];
                  for (const id of am.prerolledCombat.revivedAdventurerIds ?? []) revived.push(id);
                } else {
                  const fallenIds = expeditionFallenIds
                    ? [...expeditionFallenIds]
                    : (combatResult?.fallenAdventurerIds ?? []);
                  const result = rollPermanentDeaths(fallenIds, team, template, am.adventurerSupplies);
                  deadIds = result.dead;
                  for (const id of result.revived) revived.push(id);
                }

                // Apply deaths. Stamps the death record onto the adventurer
                // so the pantheon page can read it later. Season/year are
                // captured here (at completion) since they reflect when the
                // settlement actually receives the news.
                const records = am.deathRecords ?? {};
                for (const id of deadIds) {
                  deadIdsSet.add(id);
                  const advInState = s.adventurers.find((a) => a.id === id);
                  casualties.push(advInState?.name ?? id);
                  if (advInState) {
                    advInState.alive = false;
                    if (records[id]) {
                      advInState.deathRecord = {
                        ...records[id],
                        season: s.season,
                        year: s.year,
                      };
                    }
                    // Equipment lost on death
                    advInState.equipment = { head: null, chest: null, legs: null, boots: null, gloves: null, cloak: null, mainHand: null, offHand: null, ring1: null, ring2: null, amulet: null, trinket: null };
                  }
                }
              }

              // Calculate rewards with class passives.
              // VIP-fallen path skips ALL rewards (including assassin salvage) — when
              // the locked NPC dies, the mission's purpose is forfeit. This is distinct
              // from a team wipe, where the assassin still extracts partial loot.
              const vipFallen = combatResult?.vipFallen;
              let rewards: MissionReward[] = [];
              if (template && !vipFallen) {
                if (success) {
                  rewards = calcAssassinBonusRewards(template, team);
                } else {
                  // Assassin partial loot on failure
                  const survivors = team.filter((a) => !deadIdsSet.has(a.id));
                  rewards = calcAssassinFailRewards(template, team, survivors);
                }
                // Expeditions: add rewards accumulated from events (treasure, encounter outcomes, combat loot)
                if (isExped && am.expeditionRewards?.length) {
                  for (const r of am.expeditionRewards) {
                    const existing = rewards.find((x) => x.resource === r.resource);
                    if (existing) existing.amount += r.amount;
                    else rewards.push({ ...r });
                  }
                }
              }

              // Combat loot from killed enemies (resources AND items) is kept
              // SEPARATE from the base rewards and NOT applied here — it's held
              // on the completed mission and revealed/granted when the player
              // opens the loot chest and claims. Duplicate drops are merged so
              // the chest reads clean. Skipped on VIP-fallen (no loot).
              const loot: LootResult[] = [];
              if (!vipFallen && combatResult?.loot?.length) {
                for (const drop of combatResult.loot) {
                  const same = loot.find((x) => x.type === drop.type &&
                    (drop.type === "item" ? x.itemId === drop.itemId : x.resource === drop.resource));
                  if (same) same.amount += drop.amount;
                  else loot.push({ ...drop });
                }
              }

              // Grant XP — the mission has `slots × baseXp` total XP, split among the deployed team.
              // Going in with fewer adventurers than slots = bigger individual share (risk/reward).
              const baseXp = template ? getMissionXp(template.difficulty, success) : 0;
              const totalSlots = template?.slots.length ?? 1;
              const deployedSize = Math.max(1, team.length);
              const perAdvBase = (baseXp * totalSlots) / deployedSize;
              for (const adv of team) {
                if (!deadIdsSet.has(adv.id)) {
                  const advInState = s.adventurers.find((a) => a.id === adv.id);
                  if (advInState) {
                    const equipStats = getEquipmentStats(advInState.equipment);
                    const stats = calcAdvStats(advInState, equipStats);
                    const wisBonus = 1 + stats.wis * 0.02; // +2% XP per WIS point
                    const traitBonus = advInState.trait === "quick_learner" ? 1.10 : 1;
                    const xpGain = Math.floor(perAdvBase * wisBonus * traitBonus);
                    const result = applyXp(advInState, xpGain);
                    if (result.leveled) levelUps.push(advInState.name);
                    if (result.rankUp && advInState.rank !== result.oldRank) {
                      rankUps.push({ name: advInState.name, newRank: RANK_NAMES[advInState.rank] });
                    }
                  }
                }
              }

              // Grant loyalty to surviving adventurers
              const isDangerous = template ? template.difficulty >= 4 : false;
              for (const adv of team) {
                if (!deadIdsSet.has(adv.id)) {
                  const advInState = s.adventurers.find((a) => a.id === adv.id);
                  if (advInState) {
                    const oldLoyalty = advInState.loyalty ?? 0;
                    const oldRank = getLoyaltyRank(oldLoyalty);
                    let gain = success ? 2 : 0;
                    if (isDangerous) gain += 1; // bonus for surviving dangerous missions
                    // Matched food bonus: +1 loyalty when eaten food matches preference on success
                    if (success) {
                      const foodId = am.adventurerSupplies?.[adv.id]?.food;
                      if (foodId) {
                        const foodItem = getItem(foodId);
                        if (foodItem?.foodFlavors && advInState.foodPreference &&
                            foodItem.foodFlavors.includes(advInState.foodPreference as any)) {
                          gain += MATCHED_FOOD_LOYALTY_BONUS;
                        }
                      }
                    }
                    advInState.loyalty = Math.min(100, oldLoyalty + gain);
                    const newRank = getLoyaltyRank(advInState.loyalty);
                    if (newRank.rank > oldRank.rank) {
                      pushEvent(s, "loyalty_rankup", "💛", `${advInState.name} is now ${newRank.title}!`);
                      unlockOriginRecipes(s, advInState as any, newRank);
                    }
                  }
                }
              }

              // Free surviving adventurers, and write their HP + lingering
              // wounds home (Model C recovery). Survivors who were KO'd but not
              // slain come home critically wounded (clamped to 1 HP, never 0).
              for (const id of am.adventurerIds) {
                const adv = s.adventurers.find((a) => a.id === id);
                if (!adv) continue;
                adv.onMission = false;
                if (!adv.alive) continue; // the fallen are handled by the death roll above
                const maxHp = calcAdventurerMaxHp(adv);
                if (isExped) {
                  const hp = am.expeditionHp?.[id];
                  if (hp != null) adv.currentHp = Math.max(1, Math.min(maxHp, Math.round(hp)));
                } else if (combatResult) {
                  const hp = combatResult.finalHp?.[id];
                  if (hp != null) adv.currentHp = Math.max(1, Math.min(maxHp, Math.round(hp)));
                  const conds = combatResult.finalConditions?.[id];
                  adv.conditions = conds && conds.length ? conds.map((c) => ({ ...c })) : undefined;
                }
                // No-encounter missions don't damage HP — leave currentHp as-is.
              }

              // Slow Venom (Ch1 beat): the marsh adders leave the survivor who took
              // the worst of the fen with a lingering venom that won't fade on its
              // own — it needs a brewed Herbal Antidote (recipe unlocked here so the
              // cure is reachable). The Slow Venom quest keys off the venom condition
              // existing; the beat text names whoever's bitten.
              if (success && am.missionId === "marsh_clearing") {
                const bitten = am.adventurerIds
                  .map((id) => s.adventurers.find((a) => a.id === id))
                  .filter((a): a is Adventurer => !!a && a.alive && !a.conditions?.some((c) => c.type === "venom"))
                  .sort((a, b) => (a.currentHp ?? calcAdventurerMaxHp(a)) - (b.currentHp ?? calcAdventurerMaxHp(b)))[0];
                if (bitten) {
                  bitten.conditions = [...(bitten.conditions ?? []), { type: "venom", remainingRounds: 99 }];
                  if (!s.discoveredRecipes.includes("herbal_antidote")) s.discoveredRecipes.push("herbal_antidote");
                  pushEvent(s, "adventurer_wounded", "🐍", `${bitten.name.split(" ")[0]} came home from the fen with an adder-bite that will not close. Edda needs a Herbal Antidote brewed to draw the venom.`);
                }
              }

              // Rewards are NOT auto-granted — player claims them via the Guild page

              // Log events
              const missionName = template?.name ?? am.missionId;
              if (success) {
                const rewardStr = rewards.map((r) => formatReward(r)).join(", ");
                pushEvent(s, "mission_success", "✅", `Mission "${missionName}" succeeded! ${rewardStr}`);
              } else if (vipFallen) {
                const npc = getNpcAlly(vipFallen);
                pushEvent(s, "mission_failed", "💔", `${npc?.name ?? "The ally"} fell on mission "${missionName}". The team retreated.`);
              } else {
                pushEvent(s, "mission_failed", "❌", `Mission "${missionName}" failed`);
              }
              for (const name of levelUps) {
                pushEvent(s, "adventurer_levelup", "⬆️", `${name} leveled up!`);
              }
              for (const ru of rankUps) {
                pushEvent(s, "adventurer_rankup", "🌟", `${ru.name} promoted to ${ru.newRank}!`);
              }
              for (const id of casualties) {
                const deadAdv = team.find((a) => a.id === id);
                if (deadAdv) pushEvent(s, "adventurer_died", "⚰️", `${deadAdv.name} fell on mission "${missionName}"`);
              }

              // Mark story mission as completed on success, and fire its
              // chronicle entry into the archive so the journal updates.
              if (success && STORY_MISSIONS.some((sm) => sm.id === am.missionId)) {
                if (!s.completedStoryMissions.includes(am.missionId)) {
                  s.completedStoryMissions.push(am.missionId);
                }
                const sm = STORY_MISSIONS.find((m) => m.id === am.missionId);
                if (sm?.chronicleEntryId && !s.chronicleEntriesFired.includes(sm.chronicleEntryId)) {
                  // Record it in the archive on completion, but do NOT pop the
                  // beat modal here: the story chronicle opens when the player
                  // clicks "Claim & Continue Story" (the AdventurersGuild claim
                  // handler, gated on chronicleEntriesSeen). Queuing it on
                  // completion fired it early — e.g. right when a mid-mission
                  // "watch combat" resolved the fight, before the loot/claim —
                  // which spoiled the beat.
                  s.chronicleEntriesFired.push(sm.chronicleEntryId);
                }
                // Bridge chronicles that follow this mission's completion
                // (breath beats, narrative follow-ups). Fired all at once for
                // now; proper pacing/delays is a future feature.
                if (sm?.additionalChronicleEntryIds) {
                  for (const id of sm.additionalChronicleEntryIds) {
                    if (!s.chronicleEntriesFired.includes(id)) {
                      s.chronicleEntriesFired.push(id);
                    }
                  }
                }
                // Robin event hook — if a robin is bound to this story
                // mission, queue it so the sidebar pill can surface it.
                // One-shot per save (firedRobins blocks re-fire).
                const robin = getRobinForStoryMission(am.missionId);
                if (robin && !s.firedRobins.includes(robin.id) && !s.pendingRobins.includes(robin.id)) {
                  s.pendingRobins.push(robin.id);
                }
                // Narrative event evaluator: story-mission triggers may now
                // satisfy events like the three-reports banner.
                applyEventEvaluation(s);
              }

              // One-time missions: on success, retire from the board forever.
              if (success && template?.unique && !s.completedUniqueMissionIds.includes(am.missionId)) {
                s.completedUniqueMissionIds.push(am.missionId);
              }

              // Quarry-spider gate cleared: advance quarrySpidersClearedLevel to
              // the mission's target depth (the number in "clear_diggings_${N}"),
              // so the quarry now yields at that level and the mission stops being
              // forced onto the board.
              if (success && am.missionId.startsWith("clear_diggings_")) {
                const target = parseInt(am.missionId.slice("clear_diggings_".length), 10);
                if (!Number.isNaN(target)) {
                  s.quarrySpidersClearedLevel = Math.max(s.quarrySpidersClearedLevel ?? 1, target);
                }
              }

              // Recruitment quests: on success the named premades JOIN the roster
              // (earned — bypasses the browse cap; skips any already recruited).
              if (success && template?.recruitsOnSuccess?.length) {
                for (const pid of template.recruitsOnSuccess) {
                  if (s.adventurers.some((a) => a.premadeId === pid)) continue;
                  const rec = buildRecruitFromPremadeId(nextId("adv"), pid, 1);
                  if (rec) {
                    s.adventurers.push(rec);
                    pushEvent(s, "mission_success", "🫂", `${rec.name} has joined the settlement.`);
                  }
                }
              }

              // Record discovered enemies — success or failure, the player has now seen them.
              // Capture the genuine "???" surprises (first seen AND not already known by
              // reputation) for the loot modal's "New foes faced" reveal.
              const revealedEnemies: string[] = [];
              if (template?.encounters) {
                if (!s.discoveredEnemies) s.discoveredEnemies = [];
                for (const enc of template.encounters) {
                  if (!s.discoveredEnemies.includes(enc.enemyId)) {
                    const def = getEnemy(enc.enemyId);
                    if (def && !def.revealPortrait && !revealedEnemies.includes(enc.enemyId)) {
                      revealedEnemies.push(enc.enemyId);
                    }
                    s.discoveredEnemies.push(enc.enemyId);
                  }
                }
              }

              // Per-adventurer before/after for the loot modal's team strip.
              // team members are the live adventurers, now carrying their after
              // values; rosterBefore holds the deploy-time snapshot.
              const roster = team.map((adv) => {
                const before = rosterBefore.get(adv.id);
                const maxHp = calcAdventurerMaxHp(adv);
                const died = deadIdsSet.has(adv.id);
                return {
                  id: adv.id,
                  name: adv.name,
                  portrait: getZoomedPortraitUrl(adv),
                  advClass: adv.class,
                  level: adv.level,
                  hpMax: maxHp,
                  hpBefore: before?.hp ?? maxHp,
                  hpAfter: died ? 0 : Math.round(adv.currentHp ?? maxHp),
                  xpBefore: before?.xp ?? adv.xp,
                  xpAfter: adv.xp,
                  leveledUp: (before?.level ?? adv.level) < adv.level,
                  died,
                  revived: revived.includes(adv.id),
                  // Lingering wounds applied just above (adv.conditions) — pass a
                  // copy so the loot modal can warn about e.g. the froth.
                  conditions: adv.conditions?.map((c) => ({ ...c })),
                };
              });

              // Record result
              // A pure-tracker story quest (rewards:[] + no chronicle) this
              // mission completes: surface it as a "Quest accomplished" line in
              // the LootModal. It auto-completes on claim (claimMissionReward),
              // so it never lingers as a "done" click in the quest log.
              const trackerQuest = success
                ? QUEST_DEFINITIONS.find(
                    (q) => q.completedByMission === am.missionId && q.rewards.length === 0 && !q.chronicleEntryId,
                  )
                : undefined;
              s.completedMissions.push({
                missionId: am.missionId,
                success,
                rewards,
                casualties,
                revived,
                xpGained: baseXp,
                levelUps,
                rankUps,
                roster,
                ...(combatResult ? {
                  combatLog: combatResult.log,
                  combatRoster: combatResult.roster,
                  combatPositions: combatResult.positions,
                  combatRounds: combatResult.rounds,
                  combatVictory: combatResult.victory,
                  ...(combatResult.retreated ? { retreated: true } : {}),
                } : {}),
                ...(vipFallen ? { vipFallen } : {}),
                ...(revealedEnemies.length ? { revealedEnemies } : {}),
                ...(loot.length ? { loot } : {}),
                ...(trackerQuest ? { storyQuestAccomplished: trackerQuest.title } : {}),
              });

              // Durable per-mission success tally (completedMissions is cleared on
              // read; this persists — drives count-gated chains + requirements,
              // e.g. "after 3 fen barters the witch's offering changes").
              if (success) {
                s.missionCompletions = s.missionCompletions ?? {};
                s.missionCompletions[am.missionId] = (s.missionCompletions[am.missionId] ?? 0) + 1;
              }

              // Remove from active
              s.activeMissions.splice(i, 1);
            }
          }

          // Refresh missions daily at 3 AM UTC
          const now = Date.now();
          const today3am = new Date();
          today3am.setUTCHours(3, 0, 0, 0);
          if (today3am.getTime() > now) today3am.setUTCDate(today3am.getUTCDate() - 1);
          // The rotating board opens the moment the scouts return. Pre-scouting
          // generateMissionBoard yields nothing (the world isn't charted yet), so
          // the first time scouting is done we force a one-off reroll — otherwise
          // a mid-day completion would leave the board empty until the next 3AM.
          // The flag makes it fire exactly once (also covers saves that scouted
          // before this gate existed).
          if (!s.scoutingBoardSeeded && (s.completedStoryMissions ?? []).includes("story_1_scouting")) {
            s.lastMissionRefresh = 0;
            s.scoutingBoardSeeded = true;
          }
          const lastRefresh = s.lastMissionRefresh;
          // A newly-eligible pinned chain beat (e.g. Hester's Run Down the moment
          // the Old Watch is done) shouldn't wait for the daily 3AM reroll — inject
          // any that aren't on the board (and aren't already out on a mission).
          {
            const boardCtx = buildMissionBoardContext(s, guildLvl, now + s.year * 777);
            const onBoard = new Set(s.missionBoard.map((m) => m.id));
            const active = new Set(s.activeMissions.map((m) => m.missionId));
            for (const m of eligiblePinnedMissions(boardCtx)) {
              if (!onBoard.has(m.id) && !active.has(m.id)) s.missionBoard.push(m);
            }
          }
          // Soft-lock recovery: if the player has no working way to PRODUCE a core
          // building resource (mill/quarry unbuilt or damaged) AND no way to BUY it
          // (no working marketplace) AND is effectively out of it, force the relevant
          // gathering mission onto the board so they can dig themselves out (e.g. a
          // raid rubbles the lumber mill and steals all the wood, no marketplace yet —
          // 0 wood means the repair is unaffordable). Injected immediately like the
          // pinned beats above, bypassing the daily 3AM reroll.
          {
            const onBoard = new Set(s.missionBoard.map((m) => m.id));
            const active = new Set(s.activeMissions.map((m) => m.missionId));
            const doneUnique = new Set(s.completedUniqueMissionIds ?? []);
            const producing = (id: string) =>
              s.buildings.some((b) => b.buildingId === id && b.level > 0 && !b.damaged);
            const marketOk = producing("marketplace");
            const forceMission = (id: string) => {
              if (onBoard.has(id) || active.has(id)) return;
              const m = MISSION_POOL.find((mm) => mm.id === id);
              if (!m || m.staged) return;
              if (guildLvl < (m.minGuildLevel ?? 1)) return; // no guild, no injection
              if (m.unique && doneUnique.has(id)) return;
              s.missionBoard.push(m);
              onBoard.add(id);
            };
            if (!marketOk && !producing("lumber_mill") && s.resources.wood < 40) {
              forceMission("gather_timber");
            }
            if (!marketOk && !producing("quarry") && s.resources.stone < 40) {
              forceMission(doneUnique.has("quarry_expedition_first") ? "quarry_expedition" : "quarry_expedition_first");
            }
            // Quarry-spider gate: while we've dug deeper than the spiders are
            // cleared, keep the level-scaled "Clear the Diggings" mission on the
            // board (forced past its sentinel requires). The quarry yields at the
            // previous level until it's done. Re-forced each tick if wiped.
            {
              const quarry = s.buildings.find((b) => b.buildingId === "quarry" && b.level > 0);
              if (quarry && quarry.level > (s.quarrySpidersClearedLevel ?? 1)) {
                forceMission(`clear_diggings_${quarry.level}`);
              }
            }
            // Food crisis: larder in deficit AND running out within
            // WILD_BOAR_HUNT_FOOD_HOURS → surface a scarcity HUNT so the survival
            // loop has an active answer. Pick from a small pool (boar any season,
            // the deer yard only in winter) so a recurring crisis varies instead
            // of always being the same hunt. One at a time.
            {
              const net = s.netFoodPerHour ?? 0;
              const hoursLeft = net < 0 ? getTotalFood(s.foods) / -net : Infinity;
              if (hoursLeft < WILD_BOAR_HUNT_FOOD_HOURS) {
                const HUNTS: { id: string; season: string | null }[] = [
                  { id: "wild_boar_hunt", season: null },
                  { id: "deer_yard", season: "winter" },
                ];
                const anyUp = HUNTS.some((h) => onBoard.has(h.id) || active.has(h.id));
                const eligible = HUNTS.filter((h) => !h.season || h.season === s.season);
                if (!anyUp && eligible.length > 0) {
                  forceMission(eligible[Math.floor(Math.random() * eligible.length)].id);
                }
              }
            }
            // Water crisis: reserve in deficit AND running out within
            // WATER_FETCH_HOURS → surface a water haul so a dry spell has an active
            // answer. In SUMMER it's The North Stream (our stream runs shallow in
            // the heat → haul from the fuller northern one); any other season
            // (winter's frozen stream, a dry year, any dip) it's the source-
            // agnostic Fill the Barrels. The real fix is a well/cistern; this is
            // the tide-over. One at a time (neither fires while the other is up).
            {
              const net = s.netWaterPerHour ?? 0;
              const hoursLeft = net < 0 ? (s.resources.water ?? 0) / -net : Infinity;
              const anyUp = onBoard.has("north_stream") || active.has("north_stream")
                || onBoard.has("fill_barrels") || active.has("fill_barrels");
              if (hoursLeft < WATER_FETCH_HOURS && !anyUp) {
                forceMission(s.season === "summer" ? "north_stream" : "fill_barrels");
              }
            }
          }
          if (lastRefresh < today3am.getTime()) {
            // Missions — cap difficulty at best adventurer's rank + 1
            s.missionBoard = generateMissionBoard(buildMissionBoardContext(s, guildLvl, now + s.year * 777));
            s.lastMissionRefresh = now;
          }
          // Newly-arrived curated characters join the roster automatically.
          syncArrivals(s);
          // Auto-settle opt-in objective beats (autoComplete: reward-less +
          // chronicle-less + memory-less) the instant their condition is met, so a
          // chain gated on the beat's completion (the Stonebridges wait on
          // slow_venom) fires without the player clicking a redundant "done".
          // Mirrors the mission-tied tracker auto-advance in claimMissionReward,
          // but for condition-based beats. Runs before the chains so it lands the
          // same tick.
          for (const q of QUEST_DEFINITIONS) {
            if (!q.autoComplete) continue;
            if (q.rewards.length > 0 || q.chronicleEntryId || (q.unlocksBioFragments?.length ?? 0) > 0) continue;
            if (s.questRewardsClaimed.includes(q.id)) continue;
            if (!isQuestTriggered(q, s) || !q.condition(s)) continue;
            s.questRewardsClaimed.push(q.id);
            if (s.chapters) {
              const cs = s.chapters.find((c) => c.storyline === q.storyline);
              if (cs && !cs.completedChapters.includes(q.chapter) && isChapterComplete(s, q.storyline, q.chapter)) {
                cs.completedChapters.push(q.chapter);
                cs.current = q.chapter + 1;
              }
            }
          }
          // Story "director" layer: run the scripted narrative chains (fires
          // chronicle beats, recruits scripted arrivals like Hester on their
          // timed return). Re-entrant + idempotent; safe to run every tick.
          runStoryChains(s, STORY_CHAINS, {
            now: Date.now(),
            recruit: (pid) => {
              const rec = buildRecruitFromPremadeId(nextId("adv"), pid, 1);
              if (rec) { s.adventurers.push(rec); s.clothing += CLOTHING_PER_ARRIVAL; }
            },
            unlockSeed: (vid) => {
              const v = vid as VeggieId;
              if (!s.seedsUnlocked.includes(v)) {
                s.seedsUnlocked.push(v);
                s.seeds[v] = (s.seeds[v] ?? 0) + STARTING_SEED_PER_CROP;
              }
            },
            unlockRecipe: (rid) => {
              if (!s.discoveredRecipes.includes(rid)) s.discoveredRecipes.push(rid);
            },
          });
        }

        // Dead adventurers are kept in state.adventurers (with alive: false)
        // so the Pantheon can read them. All live-roster queries already
        // filter on `alive` so they don't appear in the active guild list.

        // ── Raid system tick ──
        const tier = getSettlementTier(getTownHallLevel(s.buildings));

        // Countdown incoming raids
        for (let i = s.incomingRaids.length - 1; i >= 0; i--) {
          const ir = s.incomingRaids[i];
          // Already-resolved raids stay in the panel until the player watches /
          // dismisses the playback. Don't tick or re-resolve them.
          if (ir.combatLog) continue;
          ir.remaining -= elapsedSeconds;
          if (ir.remaining <= 0) {
            const template = getRaid(ir.raidId);
            if (template && template.encounters?.length) {
              // ── Run the siege sim ────────────────────────────────
              const sim = simulateRaidCombat({
                raidId: ir.raidId,
                encounters: template.encounters,
                walls: s.walls.map((w) => ({ ring: w.ring, level: w.level, hp: w.hp, maxHp: w.level * WALL_BASE_HP })),
                // Trainer coordination buff: +1 effective trained level while the
                // building's trainer (Gareth / Morgause) is home.
                watchtowers: s.watchtowers.map((t) => ({ ring: t.ring, level: t.level, damaged: t.damaged, archerCount: t.garrison.count, trainedLevel: t.garrison.trainedLevel + (trainerHome(s.adventurers, "watchtower") ? 1 : 0) })),
                barracks: s.barracks.map((b) => ({ ring: b.ring, level: b.level, damaged: b.damaged, soldierCount: b.garrison.count, trainedLevel: b.garrison.trainedLevel + (trainerHome(s.adventurers, "barracks") ? 1 : 0) })),
                militiaCount: militiaCount(s),
                watchtowerCaptain: buildRaidCaptainUnit(s.adventurers, "watchtower"),
                barracksCaptain: buildRaidCaptainUnit(s.adventurers, "barracks"),
              });

              // ── Apply sim after-state ────────────────────────────
              for (const wf of sim.wallFinalHp) {
                const w = s.walls.find((x) => x.ring === wf.ring);
                if (w) w.hp = wf.hp;
              }
              for (const ring of sim.damagedTowerRings) {
                const t = s.watchtowers.find((x) => x.ring === ring);
                if (t) t.damaged = true;
              }
              for (const ring of sim.damagedBarracksRings) {
                const b = s.barracks.find((x) => x.ring === ring);
                if (b) b.damaged = true;
              }
              // Apply casualties per-building so each garrison's count drops by
              // its own losses. Totals + population shrink alongside.
              for (const c of sim.archerCasualtiesByRing) {
                const t = s.watchtowers.find((x) => x.ring === c.ring);
                if (t) t.garrison.count = Math.max(0, t.garrison.count - c.lost);
              }
              for (const c of sim.soldierCasualtiesByRing) {
                const b = s.barracks.find((x) => x.ring === c.ring);
                if (b) b.garrison.count = Math.max(0, b.garrison.count - c.lost);
              }
              s.archers = Math.max(0, s.archers - sim.archersLost);
              s.soldiers = Math.max(0, s.soldiers - sim.soldiersLost);
              // Captain wounds — Gareth / Morgause come home at their own final
              // HP, floored at 1. They never die at the wall (the roster and
              // townsfolk take the deaths); the captain carries the wound. Only
              // set when they actually fought (were home + held a ring).
              for (const oc of [sim.watchtowerCaptainOutcome, sim.barracksCaptainOutcome]) {
                if (!oc) continue;
                const adv = s.adventurers.find((a) => a.id === oc.advId);
                if (!adv) continue;
                adv.currentHp = Math.max(1, Math.round(oc.hp));
                if (oc.fell) {
                  pushEvent(s, "adventurer_wounded", "🩸", `${adv.name} was dragged from the wall, gravely wounded`);
                }
              }
              // Soldier + archer + militia casualties = adult deaths. Total
              // clamped so we never drop below the BASE_POPULATION floor.
              // The household (founders + named) is protected by the
              // s.namedResidents floor on the reducer.
              {
                const totalLoss = sim.archersLost + sim.soldiersLost + sim.militiaLost;
                const popTotal = totalPopulation(s.citizens);
                const allowed = Math.max(0, popTotal - BASE_POPULATION);
                const actual = Math.min(totalLoss, allowed);
                if (actual > 0) {
                  s.citizens = reduceByPriority(s.citizens, actual, ["adults"], s.namedResidents);
                }
              }

              const raidName = template.name ?? ir.raidId;

              // Per-casualty event lines so the player can see the breakdown
              // beyond the summary. Pushed before the summary so the summary
              // ends up at the top of the log.
              if (sim.soldiersLost > 0) {
                const word = sim.soldiersLost === 1 ? "soldier" : "soldiers";
                pushEvent(s, "citizen_died", "⚔️", `${sim.soldiersLost} ${word} fell defending the walls`);
              }
              if (sim.archersLost > 0) {
                const word = sim.archersLost === 1 ? "archer" : "archers";
                pushEvent(s, "citizen_died", "🏹", `${sim.archersLost} ${word} fell at the watchtower`);
              }
              if (sim.militiaLost > 0) {
                const word = sim.militiaLost === 1 ? "villager" : "villagers";
                pushEvent(s, "citizen_died", "🍞", `${sim.militiaLost} ${word} fell with pitchforks in hand`);
              }

              if (sim.victory) {
                // ── Victory: grant loot ────────────────────────────
                const resCaps = calcStorageCaps(s.buildings);
                for (const loot of template.victoryLoot) {
                  if (loot.resource === "astralShards") {
                    s.astralShards += loot.amount;
                  } else {
                    const key = loot.resource as keyof ResourceState;
                    s.resources[key] = Math.min(resCaps[key], s.resources[key] + loot.amount);
                  }
                }
                const lootStr = template.victoryLoot.map((l) => `+${l.amount} ${l.resource}`).join(", ");
                const parts = [`Repelled ${raidName}!`, `Loot: ${lootStr}`];
                const losses = sim.archersLost + sim.soldiersLost + sim.militiaLost;
                if (losses > 0) parts.push(`Casualties: ${losses}`);
                pushEvent(s, "raid_victory", "🛡️", parts.join(" · "));
              } else {
                // ── Defeat: plunder on top of sim attrition ────────
                const stealPct = template.resourceStealPercent;
                const stolen = {
                  gold: Math.floor(s.resources.gold * stealPct),
                  wood: Math.floor(s.resources.wood * stealPct),
                  stone: Math.floor(s.resources.stone * stealPct),
                  food: Math.floor(getTotalFood(s.foods) * stealPct),
                };
                s.resources.gold = Math.max(0, s.resources.gold - stolen.gold);
                s.resources.wood = Math.max(0, s.resources.wood - stolen.wood);
                s.resources.stone = Math.max(0, s.resources.stone - stolen.stone);
                if (stolen.food > 0) consumeFood(s.foods, stolen.food);

                let extraCitizensLost = 0;
                if (template.killsCitizens) {
                  const popTotal = totalPopulation(s.citizens);
                  const proposed = Math.min(template.maxCitizenLoss, Math.max(1, Math.floor(popTotal * 0.1)));
                  const allowed = Math.max(0, popTotal - BASE_POPULATION);
                  extraCitizensLost = Math.min(proposed, allowed);
                  if (extraCitizensLost > 0) {
                    // Adults first (defenders / labor), then elderly, children, toddlers.
                    s.citizens = reduceByPriority(s.citizens, extraCitizensLost, ["adults", "elderly", "children", "toddlers"], s.namedResidents);
                    const word = extraCitizensLost === 1 ? "citizen" : "citizens";
                    pushEvent(s, "citizen_died", "💀", `${extraCitizensLost} ${word} taken in the plunder`);
                  }
                }

                // Damage 1-3 random buildings (legacy plunder mechanic).
                const damageable = s.buildings.filter((b) => b.level > 0 && !b.damaged && b.buildingId !== "town_hall");
                const damageCount = Math.min(damageable.length, 1 + Math.floor(Math.random() * 3));
                let damagedBuildings = 0;
                for (let d = 0; d < damageCount; d++) {
                  if (damageable.length === 0) break;
                  const idx = Math.floor(Math.random() * damageable.length);
                  damageable[idx].damaged = true;
                  damagedBuildings++;
                  const def = BUILDINGS.find((b) => b.id === (damageable[idx] as any).buildingId);
                  if (def) pushEvent(s, "building_damaged", "🔧", `${def.name} was damaged in the raid`);
                  damageable.splice(idx, 1);
                }

                const lostParts: string[] = [];
                if (stolen.gold > 0) lostParts.push(`${stolen.gold}g`);
                if (stolen.wood > 0) lostParts.push(`${stolen.wood}w`);
                if (stolen.stone > 0) lostParts.push(`${stolen.stone}s`);
                if (stolen.food > 0) lostParts.push(`${stolen.food}f`);
                const parts = [`Defeated by ${raidName}!`];
                if (lostParts.length > 0) parts.push(`Lost: ${lostParts.join(", ")}`);
                const totalCitizensLost = extraCitizensLost + sim.archersLost + sim.soldiersLost;
                if (totalCitizensLost > 0) parts.push(`Citizens lost: ${totalCitizensLost}`);
                if (damagedBuildings > 0) parts.push(`Buildings damaged: ${damagedBuildings}`);
                pushEvent(s, "raid_defeat", "💔", parts.join(" · "));
              }

              // Stash combat log on the raid for playback. Card stays in the
              // panel until acknowledgeRaidCombat() splices it.
              ir.combatLog = sim.log;
              ir.combatRoster = sim.roster;
              ir.combatVictory = sim.victory;
              ir.combatViewed = false;
              s.lastRaidOutcome = sim.victory ? "victory" : "defeat";
              s.lastRaidTime = 0;
              s.raidsResolvedCount = (s.raidsResolvedCount ?? 0) + 1;
            } else {
              // No template or no encounters — splice silently. Shouldn't
              // happen now that all raid templates carry encounter sets.
              s.incomingRaids.splice(i, 1);
            }
          }
        }

        // ── Garrison training tick ──
        // Auto-pause any training queue while a real raid is incoming
        // (post-resolution awaiting-acknowledgement raids don't count).
        const raidPending = s.incomingRaids.some((ir) => !ir.combatLog);
        if (!raidPending) {
          const tickGarrison = (kind: "watchtower" | "barracks", arr: PlayerWatchtower[] | PlayerBarracks[]) => {
            for (const item of arr) {
              const tq = item.garrison.training;
              if (!tq) continue;
              tq.remainingSeconds -= elapsedSeconds;
              if (tq.remainingSeconds <= 0) {
                item.garrison.trainedLevel = tq.targetLevel;
                item.garrison.training = undefined;
                const where = kind === "watchtower"
                  ? `${item.ring} watchtower archers`
                  : `${item.ring} barracks soldiers`;
                pushEvent(s, "building_completed", "🎖️", `${where} reached training level ${tq.targetLevel}`);
              }
            }
          };
          tickGarrison("watchtower", s.watchtowers);
          tickGarrison("barracks", s.barracks);
        }

        // Spawn new raids (probability-based, checked each tick). Raids only
        // once there's something to defend: gate on the defense storyline being
        // open (opens after the first scouting, via event_three_reports). While
        // it's closed, pin the raid clock at 0 so a fresh grace period starts the
        // moment it opens (giving the player time to raise walls / a watchtower).
        const defenseOpen = (s.chapters?.find((c) => c.storyline === "defense")?.current ?? 0) >= 1;
        if (defenseOpen) s.hoursSinceLastRaid += elapsedHours;
        else s.hoursSinceLastRaid = 0;
        const raidChance = defenseOpen ? getRaidChance(tier, s.hoursSinceLastRaid) : 0;
        if (raidChance > 0 && Math.random() < raidChance * elapsedHours) {
          s.hoursSinceLastRaid = 0; // reset timer
          const spawn = spawnRaid(tier, s.year);
          if (spawn) {
            // Use the highest tower level across rings — narratively, the
            // tallest tower has the longest line of sight.
            const wtLevel = s.watchtowers
              .filter((t) => !t.damaged)
              .reduce((max, t) => Math.max(max, t.level), 0);
            const warningHours = calcWarningTime(spawn.raid.baseWarning, wtLevel);
            s.incomingRaids.push({
              raidId: spawn.raid.id,
              remaining: warningHours * 3600,
              strength: spawn.strength,
              warned: true,
            });
            pushEvent(s, "raid_incoming", "⚠️", `${spawn.raid.name} approaching!`);
          }
        }

        // Reset daily rerolls at midnight (real-world time)
        const now = Date.now();
        const lastResetDay = new Date(s.lastRerollReset).toDateString();
        const todayStr = new Date(now).toDateString();
        if (lastResetDay !== todayStr) {
          s.missionRerollToday = 0;
          s.alchemyResearchAvailable = true;
          s.lastRerollReset = now;
        }

        s.lastTick = now;
      }),
    );
  }

  // Snapshot the handful of numbers that matter for understanding what an
  // offline stretch did to the settlement. Cheap; only called around catch-ups.
  function catchUpSnapshot() {
    const rates = calcProductionRates(state);
    return {
      season: state.season,
      year: state.year,
      pop: totalPopulation(state.citizens),
      advs: state.adventurers.filter((a) => a.alive).length,
      food: Math.round(getTotalFood(state.foods)),
      foodProd: Math.round(rates.food * 10) / 10,
      water: Math.round(state.resources.water ?? 0),
      wood: Math.round(state.resources.wood),
      happiness: state.happiness,
      plantsWilted: state.plantsWiltedEnv ?? 0,
      wiltCause: state.lastWiltCause,
    };
  }

  // Diagnostic wrapper around every offline catch-up. Snapshots before/after and
  // prints one grouped report so we can see exactly what a night (or a phone
  // asleep) did: elapsed time, season flips, settler losses, food/water drain.
  // Purely observational — the actual simulation is untouched. Remove once the
  // while-you-were-away digest UI lands.
  function offlineCatchUp(offlineMs: number, source: string) {
    const before = catchUpSnapshot();
    const leftAt = state.lastTick;
    applyTicks(offlineMs);
    const after = catchUpSnapshot();
    const hrs = offlineMs / 3_600_000;
    const dPop = after.pop - before.pop;
    /* eslint-disable no-console */
    console.group(`🌙 Offline catch-up [${source}] — ${hrs.toFixed(2)}h away`);
    console.log(`Left:    ${new Date(leftAt).toLocaleString()}`);
    console.log(`Back:    ${new Date().toLocaleString()}`);
    console.log(`Season:  ${before.season} (y${before.year}) → ${after.season} (y${after.year})${before.season !== after.season ? "   ❄️ SEASON CHANGED" : ""}`);
    console.log(`Pop:     ${before.pop} → ${after.pop}   (${dPop >= 0 ? "+" : ""}${dPop})${dPop < 0 ? `   💀 ${-dPop} lost` : ""}`);
    console.log(`Advs:    ${before.advs} → ${after.advs}`);
    console.log(`Food:    ${before.food} → ${after.food}   (production now ${after.foodProd}/h)${after.food <= 0 ? "   ⚠️ EMPTY" : ""}`);
    console.log(`Water:   ${before.water} → ${after.water}${after.water <= 0 ? "   ⚠️ EMPTY" : ""}`);
    console.log(`Wood:    ${before.wood} → ${after.wood}${after.wood <= 0 ? "   ⚠️ EMPTY (no heating)" : ""}`);
    console.log(`Happy:   ${before.happiness}% → ${after.happiness}%`);
    console.table({ before, after });
    console.groupEnd();
    /* eslint-enable no-console */

    // Turn the snapshot diff into a return greeting. Only stash it when the
    // stretch is worth mentioning (long enough, or something actually changed),
    // so a quick reload doesn't nag with an empty "nothing happened" card.
    const emptied =
      (after.food <= 0 && before.food > 0) ||
      (after.water <= 0 && before.water > 0) ||
      (after.wood <= 0 && before.wood > 0);
    const seasonFlipped = before.season !== after.season;
    const plantsWilted = Math.max(0, after.plantsWilted - before.plantsWilted);
    const notable = hrs >= 1 || dPop !== 0 || seasonFlipped || emptied || plantsWilted > 0;
    if (notable) {
      const severity: AwayReport["severity"] =
        dPop < 0 ? "loss" : emptied || plantsWilted > 0 || (seasonFlipped && after.season === "winter") ? "warn" : "calm";
      storeAwayReport({
        hoursAway: hrs,
        seasonBefore: before.season,
        seasonAfter: after.season,
        yearBefore: before.year,
        yearAfter: after.year,
        popBefore: before.pop,
        popAfter: after.pop,
        foodBefore: before.food,
        foodAfter: after.food,
        foodProdAfter: after.foodProd,
        waterAfter: after.water,
        woodAfter: after.wood,
        happinessBefore: before.happiness,
        happinessAfter: after.happiness,
        plantsWilted,
        wiltCause: after.wiltCause,
        severity,
      });
    }
  }

  // One-shot forward look: if winter fell right now, at the current buildings +
  // population, would the settlement run a food deficit, and how long until the
  // stores empty? Printed on load so tomorrow we can check the estimate against
  // what the night actually did. Winter is a global real-date event in prod, so
  // this is the *next* winter, same for everyone. Read-only; a shallow copy of
  // state with season overridden feeds the same production math the tick uses.
  function logWinterOutlook() {
    const { prod, citizenFood, animalFood, net, food } = computeSeasonFoodOutlook(state, "winter");
    /* eslint-disable no-console */
    console.group(`❄️ Winter outlook (projected from ${state.season} y${state.year})`);
    console.log(`Winter food production: ${prod.toFixed(1)}/h  (harvest stops, forage/hunt/fish drop)`);
    console.log(`Eaters: citizens ${citizenFood.toFixed(1)}/h + animals ${animalFood.toFixed(1)}/h`);
    if (net >= 0) {
      console.log(`✅ Winter net: +${net.toFixed(1)}/h — stores hold, no deficit.`);
    } else {
      const hrs = food / -net;
      console.log(`⚠️ Winter net: ${net.toFixed(1)}/h DEFICIT — current stores ${food.toFixed(0)} food would empty in ~${hrs.toFixed(1)}h once winter hits.`);
    }
    console.groupEnd();
    /* eslint-enable no-console */
  }

  // Offline catch-up: in dev mode, run immediately.
  // In production, this runs after server state loads (see onMount above).
  if (IS_DEV) {
    const offlineMs = Date.now() - state.lastTick;
    if (offlineMs > 2000) offlineCatchUp(offlineMs, "dev-load");
    logWinterOutlook();
  }

  // In production, speed is always 1. In dev, player can adjust.
  const getSpeed = () => IS_DEV ? state.gameSpeed : 1;

  // Stale-state detection on resume. Mobile tabs (and laptops) can sleep for
  // hours; on resume, our local state may be older than what another device
  // wrote in the interim. The visibilitychange event is unreliable on phones
  // (the tab is often "visible" the whole time the screen is off), so the
  // tick loop itself does the check: when it sees a long gap since lastTick,
  // it verifies the server etag before applying the catch-up. If stale, we
  // reload immediately, not 30s later when the next save would have 409'd.
  let _staleReloadFired = false;
  let _wakeupCheckInFlight = false;
  const ensureNotStale = async (): Promise<boolean> => {
    if (_staleReloadFired) return false;
    if (!_settlementId || !getExpectedUpdatedAt()) return true;
    _wakeupCheckInFlight = true;
    try {
      const serverUpdatedAt = await peekSettlementUpdatedAt(_settlementId);
      if (serverUpdatedAt !== getExpectedUpdatedAt()) {
        // The server changed under us. If we have queued-but-unsaved local
        // changes (a debounced save still pending — e.g. a fresh sow), FLUSH
        // them first rather than reloading, or the reload would pull the
        // pre-action server state and silently discard the action. After a
        // successful flush our state is authoritative again, so no reload.
        if (_debouncedSaveTimer && _latestStateGetter && _settlementId) {
          clearTimeout(_debouncedSaveTimer);
          _debouncedSaveTimer = null;
          try {
            await saveSettlementApi(_settlementId, JSON.parse(JSON.stringify(_latestStateGetter())));
            return true;
          } catch { /* flush failed — fall through to the safe reload */ }
        }
        console.warn("[settlement] etag mismatch on resume, reloading before stale play accumulates");
        _staleReloadFired = true;
        window.location.reload();
        return false;
      }
      return true;
    } catch {
      // Network failure on the wake-up check. Fall through to local catch-up.
      // Worst case the periodic save still hits 409 and reloads as before.
      return true;
    } finally {
      _wakeupCheckInFlight = false;
    }
  };

  // Use real elapsed time since lastTick, not fixed interval — handles browser throttling
  const tickInterval = setInterval(async () => {
    if (_wakeupCheckInFlight || _staleReloadFired) return;
    const now = Date.now();
    const elapsed = now - state.lastTick;
    if (Number.isNaN(elapsed) || elapsed < 0) {
      // lastTick is invalid — reset it so the tick loop can resume
      setState("lastTick", now);
      return;
    }
    if (elapsed > 30000) {
      const ok = await ensureNotStale();
      if (!ok) return;
    }
    if (elapsed > 500) {
      try {
        applyTicks(elapsed * getSpeed(), true);
      } catch (err) {
        console.error("Tick error:", err);
        // Reset lastTick so the next tick doesn't accumulate a huge elapsed
        setState("lastTick", Date.now());
      }
    }
  }, TICK_INTERVAL_MS);

  // Belt-and-suspenders: also do the check on visibilitychange for desktop tabs
  // where the event is reliable. On mobile this rarely fires correctly, but on
  // desktop it lets us pre-empt a wake-up check before the next tick fires.
  const handleVisibility = async () => {
    if (document.hidden) return;
    if (_wakeupCheckInFlight || _staleReloadFired) return;
    const offlineMs = Date.now() - state.lastTick;
    if (offlineMs > 30000) {
      const ok = await ensureNotStale();
      if (!ok) return;
    }
    if (offlineMs > 2000) {
      try {
        offlineCatchUp(offlineMs, "visibility-resume");
      } catch (err) {
        console.error("Visibility catch-up error:", err);
        setState("lastTick", Date.now());
      }
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);
  const localSaveInterval = IS_DEV
    ? setInterval(() => saveGameLocal(JSON.parse(JSON.stringify(state))), 5000)
    : null;
  const apiSaveInterval = setInterval(() => {
    if (_settlementId) {
      saveSettlementApi(_settlementId, JSON.parse(JSON.stringify(state))).catch(() => {});
    }
  }, 15000);

  // Save when tab becomes hidden (user switches away)
  const handleVisibilitySave = () => {
    if (document.hidden && _settlementId) {
      saveSettlementApi(_settlementId, JSON.parse(JSON.stringify(state))).catch(() => {});
    }
  };
  document.addEventListener("visibilitychange", handleVisibilitySave);

  // Save on page refresh/close — keepalive ensures the request survives page unload
  const handleBeforeUnload = () => {
    if (!_settlementId) return;
    const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";
    const token = localStorage.getItem("medieval-realm-token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${apiBase}/settlement/${_settlementId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ gameState: JSON.parse(JSON.stringify(state)) }),
      keepalive: true,
    }).catch(() => {});
  };
  window.addEventListener("beforeunload", handleBeforeUnload);

  onCleanup(() => {
    clearInterval(tickInterval);
    if (localSaveInterval) clearInterval(localSaveInterval);
    clearInterval(apiSaveInterval);
    if (_debouncedSaveTimer) clearTimeout(_debouncedSaveTimer);
    document.removeEventListener("visibilitychange", handleVisibility);
    document.removeEventListener("visibilitychange", handleVisibilitySave);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    _latestStateGetter = null;
    saveGame(JSON.parse(JSON.stringify(state)));
  });

  const actions: GameActions = {
    upgradeBuilding(buildingId) {
      const pb = state.buildings.find((b) => b.buildingId === buildingId);
      if (!pb || pb.upgrading) return false;
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def || !isBuildingUnlocked(def, getTownHallLevel(state.buildings))) return false;
      // Chapter gate: building hidden until its storyline chapter is reached.
      if (!isBuildingChapterUnlocked(def, state)) return false;

      // Check Town Hall-gated level cap (no building may exceed TH level)
      const thLevel = getTownHallLevel(state.buildings);
      const effectiveMax = getEffectiveMaxLevel(def, thLevel);
      if (pb.level >= effectiveMax) return false;

      // Check tier upgrade prerequisites for Town Hall
      if (buildingId === "town_hall") {
        const { met } = getTierPrerequisitesMet(pb.level + 1, state.buildings);
        if (!met) return false;
      }

      const levelDef = def.levels[pb.level];
      if (!levelDef) return false;

      // Check queue slots
      const masonLvl = state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
      const bonuses = getMasonBonuses(masonLvl);
      const activeBuilds = state.buildings.filter((b) => b.upgrading).length;
      if (activeBuilds >= bonuses.queueSlots) return false;

      // Apply Mason's Guild cost/time reduction (not on the guild itself)
      const effectiveMasonLvl = buildingId === "masons_guild" ? 0 : masonLvl;
      const adjustedCost = applyMasonCostReduction(levelDef.cost, effectiveMasonLvl);
      const adjustedTime = applyMasonTimeReduction(levelDef.buildTime, effectiveMasonLvl);

      if (state.resources.wood < adjustedCost.wood || state.resources.stone < adjustedCost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= adjustedCost.wood;
        s.resources.stone -= adjustedCost.stone;
        const b = s.buildings.find((b) => b.buildingId === buildingId)!;
        b.upgrading = true;
        b.upgradeRemaining = adjustedTime;
      }));
      scheduleSave();
      return true;
    },

    panicBuildBuilding(buildingId) {
      // Soft-lock recovery: spend astral shards to instantly raise a Lv.1
      // lumber mill or quarry when the player can't afford the regular cost
      // and has no recovery path (no marketplace, no guild). Only fires when
      // the normal cost is genuinely unaffordable — guards against wasting
      // shards on a building you could already build.
      if (!PANIC_BUILD_IDS.includes(buildingId)) return false;
      const pb = state.buildings.find((b) => b.buildingId === buildingId);
      if (!pb || pb.level > 0 || pb.upgrading) return false;
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def) return false;
      const levelDef = def.levels[0];
      if (!levelDef) return false;
      const masonLvl = state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
      const cost = applyMasonCostReduction(levelDef.cost, masonLvl);
      // Only allow if the player can't actually afford the normal build.
      const canAffordNormal = state.resources.wood >= cost.wood && state.resources.stone >= cost.stone;
      if (canAffordNormal) return false;
      if (state.astralShards < PANIC_BUILD_SHARD_COST) return false;
      setState(produce((s) => {
        s.astralShards -= PANIC_BUILD_SHARD_COST;
        const b = s.buildings.find((x) => x.buildingId === buildingId)!;
        b.level = 1;
        pushEvent(s, "building_completed", "✨", `${def.name} raised to Lv.1 with astral shards`);
        // Building leveled — re-evaluate narrative events that might depend
        // on building_built triggers.
        applyEventEvaluation(s);
      }));
      scheduleSave();
      return true;
    },

    buildField() {
      if (state.fields.length >= MAX_FIELDS) return false;
      const cost = getFieldCost(0);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      const id = nextId("field");
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.fields.push({
          id, level: 0,
          upgrading: true, upgradeRemaining: getFieldBuildTime(0),
          crop: null, harvested: false,
          lastCrop: null, sameCropStreak: 0, restBonus: false,
        });
      }));
      scheduleSave();
      return true;
    },

    plantField(fieldId, crop) {
      if (state.season !== "spring") return false;
      const field = state.fields.find((f) => f.id === fieldId);
      if (!field || field.upgrading || field.level === 0) return false;
      if (field.crop !== null) return false; // already planted
      setState(produce((s) => {
        const f = s.fields.find((f) => f.id === fieldId)!;
        f.crop = crop;
        f.harvested = false;
        f.weatherLoss = 0; // a fresh planting starts undamaged
        // Update rotation tracking: same crop in a row = depleted streak grows,
        // different crop = streak resets. This determines yield at harvest.
        if (f.lastCrop === crop) {
          f.sameCropStreak += 1;
        } else {
          f.sameCropStreak = 0;
        }
        f.lastCrop = crop;
      }));
      scheduleSave();
      return true;
    },

    upgradeField(fieldId) {
      const field = state.fields.find((f) => f.id === fieldId);
      if (!field || field.upgrading || field.level >= FIELD_MAX_LEVEL) return false;
      // Can only upgrade empty or fallow fields (not planted ones)
      if (field.crop !== null) return false;
      // Winter-only: fields can only be worked when the ground is dormant.
      // Creates a yearly cycle — winter upgrades, spring plants, etc.
      if (state.season !== "winter") return false;
      // TH-gated: fields can't exceed the current Town Hall level, same rule as buildings.
      if (field.level >= getTownHallLevel(state.buildings)) return false;
      const cost = getFieldCost(field.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const f = s.fields.find((f) => f.id === fieldId)!;
        f.upgrading = true;
        f.upgradeRemaining = getFieldBuildTime(field.level);
      }));
      scheduleSave();
      return true;
    },

    removeField(fieldId) {
      setState(produce((s) => {
        const idx = s.fields.findIndex((f) => f.id === fieldId);
        if (idx !== -1) s.fields.splice(idx, 1);
      }));
      scheduleSave();
    },

    // Gardens use fixed pre-attributed slots (one per veggie), so there's no
    // build-by-type action. upgradeGarden handles both the initial 0→1 build
    // (available any season) and subsequent level-ups (winter + TH gated).

    upgradeGarden(gardenId) {
      const garden = state.gardens.find((g) => g.id === gardenId);
      if (!garden || garden.upgrading || garden.level >= GARDEN_MAX_LEVEL) return false;
      // Building (level 0 → 1): the crop must be UNLOCKED (staple, or a specialty
      // whose seed you've acquired) and in its planting season — no point raising
      // a plot you can't sow yet (mirrors the Farming UI gates).
      if (garden.level === 0) {
        const v = getVeggie(garden.veggie);
        if (!isSeedUnlocked(v, state.seedsUnlocked)) return false;
        if (!canPlantVeggie(v, state.season)) return false;
      }
      // Level 1+ upgrades mirror the field rules: winter only, TH-capped.
      if (garden.level >= 1) {
        if (state.season !== "winter") return false;
        if (garden.level >= getTownHallLevel(state.buildings)) return false;
      }
      const cost = getGardenCost(garden.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const g = s.gardens.find((g) => g.id === gardenId)!;
        g.upgrading = true;
        g.upgradeRemaining = getGardenBuildTime(garden.level);
      }));
      scheduleSave();
      return true;
    },

    plantGarden(gardenId) {
      const garden = state.gardens.find((g) => g.id === gardenId);
      if (!garden || garden.upgrading || garden.level === 0) return false;
      const veggie = getVeggie(garden.veggie);
      if (!isSeedUnlocked(veggie, state.seedsUnlocked)) return false;
      if (!canPlantVeggie(veggie, state.season)) return false;
      // Sow from the per-crop seed stock into the plot's EMPTY slots. "Empty" =
      // capacity minus LIVING plants, so both a seed that never germinated AND a
      // plant that later died open room to re-sow (during the plant season). Each
      // seed makes its own germination roll, so a sow lands in a natural range,
      // not a flat fraction.
      const cap = getSeedCapacity(garden.level);
      const fresh = garden.plantedYear !== state.year;
      const alive = fresh ? 0 : (garden.plantsAlive ?? 0);
      const room = cap - alive;
      if (room <= 0) return false; // plot already full of living plants
      const stock = state.seeds?.[garden.veggie] ?? 0;
      const sow = Math.min(stock, room);
      if (sow <= 0) return false;
      const germRate = getGerminationRate(veggie);
      // Per-seed germination roll at sow time (a player action, not a replayed
      // tick — Math.random is fine; the outcome is stored in sprouted/plantsAlive).
      let sprouts = 0;
      for (let i = 0; i < sow; i++) if (Math.random() < germRate) sprouts++;
      setState(produce((s) => {
        s.seeds[garden.veggie] -= sow;
        const g = s.gardens.find((g) => g.id === gardenId)!;
        g.plantedYear = s.year;
        g.seedsPlanted = (fresh ? 0 : (g.seedsPlanted ?? 0)) + sow;
        g.sprouted = (fresh ? 0 : (g.sprouted ?? 0)) + sprouts;
        g.plantsAlive = (fresh ? 0 : (g.plantsAlive ?? 0)) + sprouts;
        const partial = sprouts < sow ? ` (${sprouts} of ${sow} seeds took)` : "";
        const verb = fresh ? `Sowed ${sow}` : `Sowed ${sow} more`;
        pushEvent(s, "building_completed", veggie.icon, `${verb} ${veggie.name.toLowerCase()} seed${partial}`);
      }));
      scheduleSave();
      return true;
    },

    // Pens use pre-attributed slots (one per animal). upgradePen handles 0→1
    // build (any season) and level-ups (winter + TH capped, mirrors gardens).
    upgradePen(penId) {
      const pen = state.pens.find((p) => p.id === penId);
      if (!pen || pen.upgrading || pen.level >= PEN_MAX_LEVEL) return false;
      if (pen.level >= 1) {
        if (state.season !== "winter") return false;
        if (pen.level >= getTownHallLevel(state.buildings)) return false;
      }
      const base = getPenCost(pen.level);
      // Shepherd brings her own flock — first sheep pen doesn't cost gold.
      const goldCost = pen.animal === "sheep" && pen.level === 0 ? 0 : base.gold;
      if (state.resources.wood < base.wood || state.resources.stone < base.stone || state.resources.gold < goldCost) return false;
      setState(produce((s) => {
        s.resources.wood -= base.wood;
        s.resources.stone -= base.stone;
        s.resources.gold -= goldCost;
        const p = s.pens.find((p) => p.id === penId)!;
        p.upgrading = true;
        p.upgradeRemaining = getPenBuildTime(pen.level);
      }));
      scheduleSave();
      return true;
    },

    // Buy livestock (gold per head) to fill a built pen toward its capacity.
    // The animals appear instantly — the pen must exist (level >= 1) and have room.
    buyLivestock(penId, qty = 1) {
      const pen = state.pens.find((p) => p.id === penId);
      if (!pen || pen.level < 1) return false;
      const room = getPenCapacity(pen.level) - pen.count;
      const n = Math.min(qty, room);
      if (n <= 0) return false;
      const cost = getAnimalBuyCost(pen.animal) * n;
      if (state.resources.gold < cost) return false;
      setState(produce((s) => {
        s.resources.gold -= cost;
        const p = s.pens.find((p) => p.id === penId)!;
        p.count += n;
      }));
      scheduleSave();
      return true;
    },

    // Keep a guard dog with a pen (one-off gold cost) — stops wolf predation there.

    // Deliberate cull — the player's choice to slaughter for meat + leather.
    // Never automatic (the flock only shrinks otherwise via hunger/predation).
    cullLivestock(penId, qty = 1) {
      const pen = state.pens.find((p) => p.id === penId);
      if (!pen || pen.count <= 0) return false;
      const n = Math.min(qty, pen.count);
      if (n <= 0) return false;
      const y = getCullYield(pen.animal);
      setState(produce((s) => {
        const p = s.pens.find((p) => p.id === penId)!;
        p.count -= n;
        const caps = calcStorageCaps(s.buildings);
        if (!s.foods) s.foods = emptyFoods();
        if (y.meat > 0) addFood(s.foods, "meat", y.meat * n, caps.food);
        if (y.leather > 0) s.leather = Math.min(craftingMaterialCap(s.buildings), s.leather + y.leather * n);
        if (y.bone > 0) s.bone = Math.min(craftingMaterialCap(s.buildings), s.bone + y.bone * n);
      }));
      scheduleSave();
      return true;
    },

    assignAnimal(animalId, job, penId) {
      const animal = state.keptAnimals.find((a) => a.id === animalId);
      if (!animal) return false;
      if (animal.keeper) return false; // owner-bound hound (e.g. Nessa's) isn't the player's to move
      if (animal.isPuppy && job !== "idle") return false; // pups can't work until grown
      // v1: dogs take idle/guard/hunt; cats idle/mouse. Guard needs a real pen.
      const dogJobs: AnimalJob[] = ["idle", "guard", "hunt"];
      const catJobs: AnimalJob[] = ["idle", "mouse"];
      const allowed = animal.species === "dog" ? dogJobs : catJobs;
      if (!allowed.includes(job)) return false;
      if (job === "guard") {
        const pen = state.pens.find((p) => p.id === penId);
        if (!pen || pen.level < 1) return false;
        // One guard dog watches a fold.
        const guarding = state.keptAnimals.filter((a) => a.species === "dog" && a.job === "guard" && a.penId === penId && a.id !== animalId).length;
        if (guarding >= 1) return false;
      }
      if (job === "hunt") {
        // The hunting camp holds only so many dogs (one slot per level).
        const campLvl = state.buildings.find((b) => b.buildingId === "hunting_camp")?.level ?? 0;
        const posted = state.keptAnimals.filter((a) => a.species === "dog" && a.job === "hunt" && a.id !== animalId).length;
        if (posted >= animalSlots("hunting_camp", campLvl)) return false;
      }
      setState(produce((s) => {
        const a = s.keptAnimals.find((x) => x.id === animalId)!;
        a.job = job;
        a.penId = job === "guard" ? penId : undefined;
        a.jobHours = 0; // a new posting builds its efficiency from scratch
      }));
      scheduleSave();
      return true;
    },

    renameAnimal(animalId, name) {
      const animal = state.keptAnimals.find((a) => a.id === animalId);
      if (!animal || animal.nameFixed) return false;
      const clean = name.trim().slice(0, 24);
      if (!clean) return false;
      setState(produce((s) => {
        const a = s.keptAnimals.find((x) => x.id === animalId)!;
        a.name = clean;
      }));
      scheduleSave();
      return true;
    },

    toggleSluice(open) {
      setState(produce((s) => {
        s.cisternSluiceOpen = open ?? !(s.cisternSluiceOpen ?? false);
      }));
      scheduleSave();
    },

    // ── Hives (Apiary) ──
    upgradeHive(hiveId) {
      const hive = state.hives.find((h) => h.id === hiveId);
      if (!hive || hive.upgrading || hive.level >= HIVE_MAX_LEVEL) return false;
      // Town-Hall cap only — a hive can be worked up any season (expanding one is
      // groundwork, not planting; no need to wait for the winter cluster).
      if (hive.level >= 1 && hive.level >= getTownHallLevel(state.buildings)) return false;
      const cost = getHiveCost(hive.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone || state.resources.gold < cost.gold) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.resources.gold -= cost.gold;
        const h = s.hives.find((h) => h.id === hiveId)!;
        h.upgrading = true;
        h.upgradeRemaining = getHiveBuildTime(hive.level);
      }));
      scheduleSave();
      return true;
    },

    // ── Orchards ──
    upgradeOrchard(orchardId) {
      const orchard = state.orchards.find((o) => o.id === orchardId);
      if (!orchard || orchard.upgrading || orchard.level >= ORCHARD_MAX_LEVEL) return false;
      // Can't raise a plot for a fruit you haven't acquired yet (locked "???").
      if (!isFruitUnlocked(getFruit(orchard.fruit), state.fruitsUnlocked)) return false;
      // Expanding the grove (more tree slots) is allowed any season — it's
      // groundwork, not planting. Planting saplings is what's gated to spring.
      if (orchard.level >= 1) {
        if (orchard.level >= getTownHallLevel(state.buildings)) return false;
      }
      const cost = getOrchardCost(orchard.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone || state.resources.gold < cost.gold) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.resources.gold -= cost.gold;
        const o = s.orchards.find((o) => o.id === orchardId)!;
        o.upgrading = true;
        o.upgradeRemaining = getOrchardBuildTime(orchard.level);
      }));
      scheduleSave();
      return true;
    },

    // Plant one sapling/vine into a free slot. Costs a fruit seed (like sowing a
    // garden), spring only, and the fruit must be unlocked. Starts as a season-0
    // cohort and ages to a bearing tree over the fruit's maturation window.
    plantSapling(orchardId) {
      const orchard = state.orchards.find((o) => o.id === orchardId);
      if (!orchard || orchard.level < 1 || orchard.upgrading) return false;
      if (state.season !== SAPLING_PLANT_SEASON) return false;
      if (!isFruitUnlocked(getFruit(orchard.fruit), state.fruitsUnlocked)) return false;
      const planted = orchard.matureTrees + orchard.saplings.reduce((n, c) => n + c.count, 0);
      if (planted >= getOrchardTreeSlots(orchard.level)) return false;
      if ((state.fruitSeeds?.[orchard.fruit] ?? 0) <= 0) return false;
      setState(produce((s) => {
        s.fruitSeeds[orchard.fruit] -= 1;
        const o = s.orchards.find((o) => o.id === orchardId)!;
        // Merge into a just-planted (season-0) cohort so they mature together.
        const fresh = o.saplings.find((c) => c.seasonsGrown === 0);
        if (fresh) fresh.count += 1;
        else o.saplings.push({ count: 1, seasonsGrown: 0 });
      }));
      scheduleSave();
      return true;
    },

    setGameSpeed(speed) { setState("gameSpeed", speed); },
    renameVillage(name) {
      const trimmed = name.trim();
      if (trimmed.length > 0 && trimmed.length <= 30) {
        setState("villageName", trimmed);
        scheduleSave();
      }
    },

    resetGame() {
      idCounter = 1;
      const fresh = createInitialState();
      setState(reconcile(fresh));
      // A brand-new game has no "while you were away" — drop any digest stashed
      // from the previous session's offline catch-up (else it shows the old
      // game's stores over the fresh camp).
      storeAwayReport(null);
      saveGame(fresh);
    },

    markIntroSeen() {
      setState(produce((s) => {
        s.introSeen = true;
        // Fire the opening Chronicle entry on intro completion
        if (!s.chronicleEntriesFired.includes("ch1_arrival")) {
          s.chronicleEntriesFired.push("ch1_arrival");
        }
      }));
      scheduleSave();
    },

    dismissChronicleBeat(entryId: string) {
      setState(produce((s) => {
        s.pendingChronicleBeats = (s.pendingChronicleBeats ?? []).filter((id) => id !== entryId);
      }));
      scheduleSave();
    },

    dismissMerchantVisit() {
      setState(produce((s) => { s.pendingMerchantVisitId = undefined; }));
      scheduleSave();
    },

    takeMerchantStallOffer(offerId: string) {
      const stall = state.merchantStall;
      if (!stall || stall.takenOffers.includes(offerId)) return false;
      const merchant = getMerchant(stall.merchantId);
      const offer = (merchant?.returnOffers ?? merchant?.offers ?? []).find((o) => o.id === offerId);
      if (!offer) return false;
      const ok = actions.trade(offer.give, offer.giveAmount, offer.receive, offer.receiveAmount, true);
      if (ok) {
        setState(produce((s) => {
          if (s.merchantStall && !s.merchantStall.takenOffers.includes(offerId)) {
            s.merchantStall.takenOffers.push(offerId);
          }
        }));
        playSound("coins");
      }
      return ok;
    },

    toggleTavernDish(dishId: string) {
      setState(produce((s) => {
        const menu = s.tavernMenu ?? [];
        s.tavernMenu = menu.includes(dishId) ? menu.filter((d) => d !== dishId) : [...menu, dishId];
      }));
      scheduleSave();
    },
    toggleBrewingPaused(drinkId: string) {
      setState(produce((s) => {
        if (!s.brewingPaused) s.brewingPaused = {};
        s.brewingPaused[drinkId] = !s.brewingPaused[drinkId];
      }));
      scheduleSave();
    },
    isBrewingPaused(drinkId: string) {
      return state.brewingPaused?.[drinkId] ?? false;
    },

    getBuildingStaffing(buildingId: string) {
      const pb = state.buildings.find((b) => b.buildingId === buildingId);
      return getBuildingStaffing(state, buildingId, pb?.level ?? 0);
    },
    assignBuildingWorker(buildingId: string) {
      if (!isStaffable(buildingId)) return false;
      if (availableCitizens(state) <= 0) return false;
      setState(produce((s) => {
        if (!s.buildingWorkers) s.buildingWorkers = {};
        s.buildingWorkers[buildingId] = (s.buildingWorkers[buildingId] ?? 0) + 1;
      }));
      scheduleSave();
      return true;
    },
    unassignBuildingWorker(buildingId: string) {
      if ((state.buildingWorkers?.[buildingId] ?? 0) <= 0) return false;
      setState(produce((s) => {
        if (!s.buildingWorkers) s.buildingWorkers = {};
        s.buildingWorkers[buildingId] = Math.max(0, (s.buildingWorkers[buildingId] ?? 0) - 1);
      }));
      scheduleSave();
      return true;
    },

    setTavernMenu(dishIds: string[]) {
      // Replace the whole menu (used by the menu editor's Apply). Clamp to the
      // tavern's capacity so it can never exceed the available slots.
      const cap = menuCapacity(state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0);
      setState("tavernMenu", [...new Set(dishIds)].slice(0, cap));
      scheduleSave();
    },

    setTavernServers(n: number) {
      setState(produce((s) => {
        const level = s.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
        const need = serversNeeded(level);
        // Assignable adults = the shared pool minus standing garrison + named
        // (NOT minus current servers — we're reassigning within this budget).
        const assignable = Math.max(0, s.citizens.adults - s.soldiers - s.archers - s.namedResidents.adults);
        s.tavernServers = Math.max(0, Math.min(Math.floor(n), need, assignable));
      }));
      scheduleSave();
    },

    setTavernPricing(pricing) {
      setState(produce((s) => { s.tavernPricing = pricing; }));
      scheduleSave();
    },

    skipSeason() { setState(produce((s) => { advanceSeason(s); })); },

    getProductionRates() { return calcProductionRates(state); },
    getMaxPopulation() { return calcMaxPopulation(state.buildings); },
    getAwayReport() { return awayReport(); },
    dismissAwayReport() { storeAwayReport(null); },
    getSeasonFoodOutlook(season) {
      const { net, prod, hoursToEmpty } = computeSeasonFoodOutlook(state, season);
      return { net, prod, hoursToEmpty };
    },
    devPreviewAwayReport() {
      const pop = totalPopulation(state.citizens);
      storeAwayReport({
        hoursAway: 8.3,
        seasonBefore: "autumn", seasonAfter: "winter",
        yearBefore: state.year, yearAfter: state.year,
        popBefore: pop + 2, popAfter: pop,
        foodBefore: 260, foodAfter: 34,
        foodProdAfter: Math.round(calcProductionRates(state).food * 10) / 10,
        waterAfter: Math.round(state.resources.water ?? 0),
        woodAfter: Math.round(state.resources.wood),
        happinessBefore: 82, happinessAfter: 47,
        plantsWilted: 6, wiltCause: "heat",
        severity: "loss",
      });
    },
    getFoodConsumption() { return calcFoodConsumption(state.citizens, countLivingAdventurers(state.adventurers), state.foundingWinterGrace ? FOUNDING_WINTER_RATION : 1); },
    getAnimalFoodConsumption() { return calcAnimalFoodConsumption(state.pens); },
    getTavernFoodConsumption() {
      const tavernLvl = state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
      if (tavernLvl <= 0) return 0;
      const servable = (state.tavernMenu ?? [])
        .map((id) => KITCHEN_DISH_BY_ID.get(id))
        .filter((r): r is CraftingRecipe => !!r && dishUnlocked(state, r) && dishAvailable(state, r));
      if (servable.length === 0) return 0;
      const t = calcTavern({
        level: tavernLvl, happiness: state.happiness, townHallLevel: getTownHallLevel(state.buildings),
        menuVariety: servable.length, servers: state.tavernServers ?? 0,
        pricing: state.tavernPricing ?? "fair", reputation: state.tavernReputation ?? 0,
      });
      return t.rooms * t.occupancy * TAVERN_FOOD_PER_ROOM_PER_HOUR;
    },
    getTavernReadout() {
      const tavern = state.buildings.find((b) => b.buildingId === "tavern");
      const lvl = tavern?.level ?? 0;
      const damaged = tavern?.damaged ?? false;
      const rooms = tavernRooms(lvl);
      const servers = state.tavernServers ?? 0;
      const reputation = state.tavernReputation ?? 0;
      if (lvl <= 0 || damaged) {
        return { rooms, occupiedRooms: 0, occupancy: 0, goldPerDay: 0, serversNeeded: serversNeeded(lvl), servers, reputation, foodPerHour: 0, damaged };
      }
      const servable = (state.tavernMenu ?? [])
        .map((id) => KITCHEN_DISH_BY_ID.get(id))
        .filter((r): r is CraftingRecipe => !!r && dishUnlocked(state, r) && dishAvailable(state, r));
      const t = calcTavern({
        level: lvl, happiness: state.happiness, townHallLevel: getTownHallLevel(state.buildings),
        menuVariety: servable.length, servers, pricing: state.tavernPricing ?? "fair", reputation,
      });
      return { rooms: t.rooms, occupiedRooms: t.occupiedRooms, occupancy: t.occupancy, goldPerDay: t.goldPerDay, serversNeeded: t.serversNeeded, servers, reputation, foodPerHour: t.rooms * t.occupancy * TAVERN_FOOD_PER_ROOM_PER_HOUR, damaged };
    },
    getHoneyProduction() {
      return state.hives.reduce(
        (sum, h) => (h.level > 0 && !h.upgrading ? sum + getHoneyRate(h.level, state.season) : sum),
        0,
      );
    },
    getCookingFoodNet() {
      let net = 0;
      for (const rids of Object.values(state.autoCook ?? {})) {
        for (const rid of rids ?? []) {
          const r = CRAFTING_RECIPES.find((cr) => cr.id === rid);
          if (!r) continue;
          // Only count a pot that can actually simmer now (ingredients + wood).
          const inputsOk = r.costs.every((c) => getFoodCostAmount(state.foods, c.resource) >= c.amount);
          if (!inputsOk || state.resources.wood <= 0) continue;
          // Passive pots use the slow sustainable cadence, not craftTime.
          const perHour = 3600 / passiveCookTime(r);
          let netBatch = r.produces.amount;
          for (const c of r.costs) netBatch -= c.amount;
          net += netBatch * perHour;
        }
      }
      return net;
    },
    useRecoveryItem(adventurerId, itemId) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || !adv.alive || adv.onMission) return false;
      // A brewed potion heals flat HP (its heal_hp) and/or clears the adventurer
      // conditions its cure_* effects name (bleed / poison / venom).
      const brewed = state.alchemyRecipes?.[itemId];
      if (brewed) {
        const sum = summarizeRecovery(brewed.effects);
        const inv0 = state.inventory.find((i) => i.itemId === itemId);
        const maxHp0 = calcAdventurerMaxHp(adv);
        const wounded = (adv.currentHp ?? maxHp0) < maxHp0;
        const healUseful = sum.healHp > 0 && wounded;
        const cureUseful = (adv.conditions ?? []).some((c) => sum.cures.includes(c.type));
        if ((!healUseful && !cureUseful) || !inv0 || inv0.quantity <= 0) return false;
        setState(produce((s) => {
          const a = s.adventurers.find((x) => x.id === adventurerId)!;
          if (sum.healHp > 0) a.currentHp = Math.min(calcAdventurerMaxHp(a), (a.currentHp ?? calcAdventurerMaxHp(a)) + sum.healHp);
          if (sum.cures.length) {
            const rest = (a.conditions ?? []).filter((c) => !sum.cures.includes(c.type));
            a.conditions = rest.length ? rest : undefined;
          }
          s.inventory.find((i) => i.itemId === itemId)!.quantity -= 1;
        }));
        scheduleSave();
        return true;
      }
      const recovery = getPotionInfo(itemId)?.recovery;
      if (!recovery) return false; // not an at-home recovery item
      const inv = state.inventory.find((i) => i.itemId === itemId);
      if (!inv || inv.quantity <= 0) return false;
      const healPct = recovery.healPct ?? 0;
      const cures = recovery.cures ?? [];
      const maxHp = calcAdventurerMaxHp(adv);
      const needsHeal = healPct > 0 && (adv.currentHp ?? maxHp) < maxHp;
      const hasCurable = (adv.conditions ?? []).some((c) => cures.includes(c.type));
      // Nothing to do (full HP and no condition this item can clear) — don't waste it.
      if (!needsHeal && !hasCurable) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((x) => x.id === adventurerId)!;
        const m = calcAdventurerMaxHp(a);
        if (healPct > 0) a.currentHp = Math.min(m, (a.currentHp ?? m) + (m * healPct) / 100);
        // Clear only the conditions this item is meant to cure (a bandage dresses
        // a wound → bleed; an antidote → poison; a plain salve cures nothing).
        if (cures.length) {
          const remaining = (a.conditions ?? []).filter((c) => !cures.includes(c.type));
          a.conditions = remaining.length ? remaining : undefined;
        }
        const it = s.inventory.find((i) => i.itemId === itemId)!;
        it.quantity -= 1;
      }));
      scheduleSave();
      return true;
    },
    getBuildingAilment(buildingId) {
      const ail = state.buildingAilments?.[buildingId];
      if (!ail) return null;
      const def = getAilment(ail.ailmentId);
      if (!def) return null;
      const who = FOUNDING_CHARACTERS.find((f) => f.id === ail.founderId)?.name ?? ail.founderId;
      // Resolve a cure item's display across the registries it might live in.
      const display = (id: string): { name: string; icon: string } => {
        const it = getItem(id);
        if (it) return { name: it.name, icon: it.icon };
        const alch = ALCHEMY_RECIPES.find((r) => r.id === id);
        if (alch) return { name: alch.name, icon: alch.icon };
        const craft = CRAFTING_RECIPES.find((r) => r.id === id);
        if (craft) return { name: craft.name, icon: craft.icon };
        const brewed = state.alchemyRecipes?.[id];
        if (brewed) return { name: brewed.name, icon: "🧪" };
        return { name: id, icon: "❓" };
      };
      const owned = (id: string) => state.inventory.find((i) => i.itemId === id)?.quantity ?? 0;
      const cures = def.cures
        .map((id) => ({ id, qty: owned(id) }))
        .filter((c) => c.qty > 0)
        .map((c) => ({ id: c.id, qty: c.qty, ...display(c.id) }));
      // Brewed potions that ease this ailment's line also cure/speed it — list any owned.
      for (const r of Object.values(state.alchemyRecipes ?? {})) {
        if (owned(r.id) <= 0) continue;
        if (cures.some((c) => c.id === r.id)) continue;
        if (easeHoursFor(summarizeRecovery(r.effects), def.line) > 0) {
          cures.push({ id: r.id, qty: owned(r.id), ...display(r.id) });
        }
      }
      return { name: def.name, icon: def.icon, kind: def.kind, who, hoursRemaining: ail.hoursRemaining, cures };
    },
    cureBuildingAilment(buildingId, itemId) {
      const ail = state.buildingAilments?.[buildingId];
      if (!ail) return false;
      const def = getAilment(ail.ailmentId);
      if (!def) return false;
      const inv = state.inventory.find((i) => i.itemId === itemId);
      if (!inv || inv.quantity <= 0) return false;
      // A fixed cure item (def.cures) clears it outright. A brewed potion instead
      // eases the line by its ease-hours: enough → cured, otherwise accelerated.
      const isFixedCure = def.cures.includes(itemId);
      const brewed = state.alchemyRecipes?.[itemId];
      const easeHours = brewed ? easeHoursFor(summarizeRecovery(brewed.effects), def.line) : 0;
      if (!isFixedCure && easeHours <= 0) return false;
      const who = FOUNDING_CHARACTERS.find((f) => f.id === ail.founderId)?.name ?? ail.founderId;
      setState(produce((s) => {
        const it = s.inventory.find((i) => i.itemId === itemId)!;
        it.quantity -= 1;
        const live = s.buildingAilments?.[buildingId];
        if (!live) return;
        if (isFixedCure || easeHours >= live.hoursRemaining) {
          delete s.buildingAilments![buildingId];
          pushEvent(s, "building_completed", "💪", def.recovered(who));
        } else {
          live.hoursRemaining -= easeHours;
          pushEvent(s, "building_completed", "🧪", `${who} is on the mend — the ${def.name.toLowerCase().replace(/^(a|the) /, "")} should pass sooner now.`);
        }
      }));
      scheduleSave();
      return true;
    },
    getBrewIngredientQty(ingredientId) {
      return getResourceQty(state, ingredientId);
    },
    getAlchemyRecipe(recipeId) {
      return state.alchemyRecipes?.[recipeId];
    },
    getCookIngredientQty(ingredientId) {
      return getResourceQty(state, ingredientId);
    },
    cookDish(placements) {
      const filled = clampCookPlacements(placements).filter((p) => getFoodIngredient(p.ingredientId));
      if (filled.length === 0) return false;
      const cost = new Map<string, number>();
      for (const p of filled) cost.set(p.ingredientId, (cost.get(p.ingredientId) ?? 0) + 1);
      for (const [id, n] of cost) if (getResourceQty(state, id) < n) return false;
      const dish = resolveDish(filled);
      const id = matchNamedDish(filled)?.id ?? dishIdFor(filled);
      setState(produce((s) => {
        for (const [ingId, n] of cost) spendResource(s, ingId, n);
        s.kitchenDishes ??= {};
        if (!s.kitchenDishes[id]) {
          s.kitchenDishes[id] = {
            id, name: dish.name, placements: filled, effects: dish.effects,
            quality: dish.quality, discoveredDay: s.year,
          };
          pushEvent(s, "building_completed", "📖", `New dish discovered: ${dish.name}.`);
        }
        s.cookedDishes ??= {};
        s.cookedDishes[id] = (s.cookedDishes[id] ?? 0) + 1;
        pushEvent(s, "building_completed", "🍲", `Cooked ${dish.name}.`);
      }));
      scheduleSave();
      return true;
    },
    brewPotion(placements) {
      // Clamp to the per-plant cap first, so we never charge for (or count)
      // more of a plant than actually helps the brew.
      const filled = clampPlacements(placements).filter((p) => getAlchemyIngredient(p.ingredientId));
      if (filled.length === 0) return false;
      // Cost = 1 of each ingredient (sum duplicates just in case).
      const cost = new Map<string, number>();
      for (const p of filled) cost.set(p.ingredientId, (cost.get(p.ingredientId) ?? 0) + 1);
      for (const [id, n] of cost) if (getResourceQty(state, id) < n) return false;
      const result = brewAlchemy(filled);
      // A curated combo takes its lore name (a known recipe is always "fine").
      const named = matchNamedRecipe(filled);
      const name = named?.name ?? result.name;
      const quality = named ? "fine" as const : result.quality;
      const id = recipeIdFor(filled);
      setState(produce((s) => {
        for (const [ingId, n] of cost) spendResource(s, ingId, n);
        s.alchemyRecipes ??= {};
        if (!s.alchemyRecipes[id]) {
          s.alchemyRecipes[id] = {
            id, name, placements: filled, effects: result.effects,
            quality, rarity: brewRarity(filled), discoveredDay: s.year,
          };
          pushEvent(s, "building_completed", "📖", `New recipe discovered: ${name}.`);
        } else {
          // Re-brewing a known recipe: take the STRONGER of the two per effect,
          // so a bigger batch upgrades the stored potency and a smaller one never
          // downgrades it (quantity = potency, and the stack is fungible).
          const prev = s.alchemyRecipes[id];
          const byKey = new Map(prev.effects.map((e) => [`${e.channel}|${e.shape ?? "sustained"}`, e]));
          for (const e of result.effects) {
            const k = `${e.channel}|${e.shape ?? "sustained"}`;
            const cur = byKey.get(k);
            if (!cur || Math.abs(e.amount) > Math.abs(cur.amount)) byKey.set(k, e);
          }
          prev.effects = [...byKey.values()].sort((a, b) => b.amount - a.amount);
        }
        const inv = s.inventory.find((i) => i.itemId === id);
        if (inv) inv.quantity += 1;
        else s.inventory.push({ itemId: id, quantity: 1 });
        s.potions += 1;
        pushEvent(s, "building_completed", "🧪", `Brewed ${name}.`);
      }));
      scheduleSave();
      return true;
    },
    getFoodBreakdown() { return calcFoodBreakdown(state); },
    getTavernDishes() {
      const kitchen = KITCHEN_DISHES.map((r) => {
        const unlocked = dishUnlocked(state, r);
        const available = unlocked && dishAvailable(state, r);
        const missing = r.costs.filter((c) => readDishCost(state, c.resource) < c.amount).map((c) => c.resource);
        return {
          id: r.id, name: r.name, icon: r.icon, image: r.image, kind: r.kind ?? "meal",
          unlocked, onMenu: (state.tavernMenu ?? []).includes(r.id), available, missing,
          costs: r.costs,
        };
      });
      // Commodity drinks (ale, later wine/mead): poured from a stored resource,
      // not cooked. Unlocked once the source building exists; available while the
      // barrel has stock.
      const commodity: TavernDish[] = TAVERN_COMMODITY_DRINKS.map((d) => {
        const unlocked = (state.buildings.find((b) => b.buildingId === d.requiresBuilding)?.level ?? 0) >= (d.minBuildingLevel ?? 1);
        const stock = getResourceQty(state, d.resource);
        return {
          id: d.id, name: d.name, icon: d.icon, image: d.image, kind: "drink" as DishKind,
          unlocked, onMenu: (state.tavernMenu ?? []).includes(d.id),
          available: unlocked && stock > 0, missing: stock > 0 ? [] : [d.resource],
          costs: [], commodity: true,
        };
      });
      return [...kitchen, ...commodity];
    },
    getStorageCaps() { return calcStorageCaps(state.buildings); },
    getSettlementTier() { return getSettlementTier(getTownHallLevel(state.buildings)); },
    getTownHallLevel() { return getTownHallLevel(state.buildings); },
    getClimateBand() { return state.year <= 1 ? "normal" : cropClimateBand(state); },
    getCropYieldMult() { return cropYieldMult(state); },
    triggerDrought() {
      // Force the drought band so the whole system reacts (yields fall, the
      // stream dries, wells dip, the reserve drains). No one-shot plant kill: a
      // dry year cuts yield, and the sustained water deficit wilts crops slowly
      // (applyDeficitWilt) with heat-wave spikes on top — all via the live tick.
      setClimateOverride("drought");
      setState(produce((s) => {
        pushEvent(s, "drought", "🥵", "A drought swept the land — the stream runs to a trickle and the crops thirst.");
      }));
      scheduleSave();
      // Let it pass after a few real seconds, like any weather event.
      setTimeout(() => setClimateOverride(null), 20000);
    },
    getWaterRate() { return waterBalance(state).net; },
    getStreamStatus() { return streamStatusOf(state); },
    getWaterBreakdown() {
      const wb = waterBalance(state);
      return {
        stream: wb.stream, well: wb.well, rain: wb.rain,
        citizens: wb.citizens, animals: wb.animals, crops: wb.cropNeed,
        cropDraw: wb.cropDraw, raining: wb.raining, coverage: wb.cropCoverage,
        sluiceOpen: wb.sluiceOpen, sluiceDrain: wb.sluiceDrain,
        hasCistern: wb.cisternLvl > 0 && !wb.cisternDamaged, reserve: state.resources.water ?? 0,
        weather: wb.weather, streamStatus: wb.streamStatus, net: wb.net,
      };
    },
    canAfford(cost) { return state.resources.wood >= cost.wood && state.resources.stone >= cost.stone; },
    getBuildingEffect(buildingId, nextLevel) { return calcBuildingEffect(buildingId, nextLevel); },
    isHarvesting() { return isHarvestTime(state.season, state.seasonElapsed); },
    getMasonLevel() {
      return state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
    },
    getMasonBonuses() {
      return getMasonBonuses(this.getMasonLevel());
    },
    getActiveQueueCount() {
      return state.buildings.filter((b) => b.upgrading).length;
    },
    getEffectiveMaxLevel(buildingId) {
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def) return 0;
      return getEffectiveMaxLevel(def, getTownHallLevel(state.buildings));
    },
    getGuildLevel() {
      return state.buildings.find((b) => b.buildingId === "adventurers_guild")?.level ?? 0;
    },
    dismissAdventurer(adventurerId) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      setState(produce((s) => {
        s.adventurers = s.adventurers.filter((a) => a.id !== adventurerId);
      }));
      scheduleSave();
      return true;
    },
    resourceQty(res: string) {
      return getResourceQty(state, res);
    },
    deployMission(missionId, adventurerIds, adventurerSupplies = {}, precomputedSuccess?: number) {
      const guildLvl = this.getGuildLevel();
      if (guildLvl === 0) return false;

      const template = getMission(missionId);
      if (!template || template.minGuildLevel > guildLvl) return false;
      if (adventurerIds.length === 0 || adventurerIds.length > template.slots.length) return false;

      // Check adventurers are available
      const team: Adventurer[] = [];
      for (const id of adventurerIds) {
        const adv = state.adventurers.find((a) => a.id === id && a.alive && !a.onMission);
        if (!adv) return false;
        // Froth and the fen's venom are KO conditions — too sick to deploy until cured.
        if (adv.conditions?.some((c) => c.type === "froth" || c.type === "venom")) return false;
        team.push(adv);
      }

      // Check deploy cost — sum of the team's per-adventurer wages by rank.
      const deployCost = getDeployCost(team);
      if (state.resources.gold < deployCost) return false;

      // Check barter / offering cost (deploy items): must have all of them
      if (template.deployItems) {
        for (const cost of template.deployItems) {
          if (getResourceQty(state, cost.resource) < cost.amount) return false;
        }
      }

      const successChance = precomputedSuccess ?? calcSuccessChance(template, team, 0, adventurerSupplies);
      let effectiveDuration = calcEffectiveDuration(template, team);

      // Apply equipment duration/loot mods
      for (const adv of team) {
        for (const slot of ["head", "chest", "legs", "boots", "cloak", "mainHand", "offHand", "ring1", "ring2", "amulet", "trinket"] as const) {
          const itemId = adv.equipment[slot];
          if (itemId) {
            const itemDef = getItem(itemId);
            if (itemDef) {
              effectiveDuration = Math.floor(effectiveDuration * itemDef.durationMod);
            }
          }
        }
      }

      setState(produce((s) => {
        s.resources.gold -= deployCost;
        // Consume the barter / offering cost (deploy items)
        if (template.deployItems) {
          for (const cost of template.deployItems) spendResource(s, cost.resource, cost.amount);
        }
        // Mark adventurers as on mission
        for (const id of adventurerIds) {
          const adv = s.adventurers.find((a) => a.id === id);
          if (adv) adv.onMission = true;
        }
        // Consume per-adventurer supplies from inventory
        for (const advId of adventurerIds) {
          const sup = adventurerSupplies[advId];
          if (!sup) continue;
          for (const itemId of [sup.potion, sup.food, sup.recovery]) {
            if (!itemId) continue;
            const inv = s.inventory.find((i) => i.itemId === itemId);
            if (inv && inv.quantity > 0) inv.quantity -= 1;
          }
          // A brewed potion in the potion slot: resolve its effect vector so the
          // combat sim can apply its buffs at combat start.
          const brewed = sup.potion ? s.alchemyRecipes?.[sup.potion] : undefined;
          if (brewed) (sup as AdventurerMissionSupplies).brewEffects = brewed.effects;
        }
        const activeMission: any = {
          missionId: template.id,
          adventurerIds: [...adventurerIds],
          remaining: effectiveDuration,
          successChance,
          adventurerSupplies: { ...adventurerSupplies },
          initialDuration: effectiveDuration,
        };

        // Pre-roll combat for non-expedition missions with encounters. Storing
        // the result on the active mission lets the UI surface it once the
        // mission passes its halfway/combat phase, and avoids re-rolling at
        // completion. Expeditions have their own per-event resolution and
        // skip this path.
        if (!isExpedition(template) && template.encounters?.length) {
          // Start each hero from current HP so the rolled outcome matches the
          // HP-aware preview the player just saw.
          const deployHpOverride: Record<string, number> = {};
          for (const a of team) deployHpOverride[a.id] = a.currentHp ?? calcAdventurerMaxHp(a);
          const combat = simulateCombat(template, team, adventurerSupplies, undefined, { hpOverride: deployHpOverride });
          if (!combat) {
            // Shouldn't happen — encounters non-empty and team non-empty —
            // but guard the type narrowing so TS lets us use combat below.
          } else {

          // Roll permadeath at deploy (so the playback log can show KO vs slain,
          // and so wipe detection can drive return-travel skipping). Logic
          // extracted to rollPermanentDeaths so the team-assembly preview can
          // run the same path under Monte Carlo.
          const fallenSet = new Set(combat.fallenAdventurerIds);
          const { dead: deadIds, revived: revivedIds } = rollPermanentDeaths(
            combat.fallenAdventurerIds, team, template, adventurerSupplies,
          );
          combat.permanentDeaths = deadIds;
          combat.revivedAdventurerIds = revivedIds;

          // Stamp permanentDeath onto the killing-blow log entries so the
          // renderer can show "(slain!)" vs "(unconscious)".
          const deadSet = new Set(deadIds);
          const advNameToId: Record<string, string> = {};
          for (const a of team) advNameToId[a.name] = a.id;
          // entry.isEnemy = ATTACKER side. When an enemy kills, the target is
          // an adventurer — those are the entries that get the permanentDeath flag.
          for (const entry of combat.log) {
            if (entry.killed && entry.isEnemy && entry.targetName) {
              const id = advNameToId[entry.targetName];
              if (id && fallenSet.has(id)) entry.permanentDeath = deadSet.has(id);
            }
            if (entry.targets) {
              for (const t of entry.targets) {
                if (!t.killed) continue;
                const id = advNameToId[t.name];
                if (id && fallenSet.has(id)) t.permanentDeath = deadSet.has(id);
              }
            }
          }

          activeMission.prerolledCombat = combat;

          // Build death records for the pantheon
          const deathRecords: Record<string, any> = {};
          if (deadIds.length > 0) {
            const findKillingBlow = (advName: string) => {
              for (let i = combat.log.length - 1; i >= 0; i--) {
                const e = combat.log[i];
                if (e.killed && e.targetName === advName) {
                  return { attackerName: e.attackerName, ability: e.abilityName, round: e.round };
                }
                if (e.targets?.some((t) => t.killed && t.name === advName)) {
                  return { attackerName: e.attackerName, ability: e.abilityName, round: e.round };
                }
              }
              return null;
            };
            for (const advId of deadIds) {
              const adv = team.find((a) => a.id === advId);
              if (!adv) continue;
              const blow = findKillingBlow(adv.name);
              deathRecords[advId] = {
                missionId: template.id,
                missionName: template.name,
                killedBy: blow?.attackerName ?? "an unknown foe",
                killedByAbility: blow?.ability,
                round: blow?.round ?? combat.rounds,
                diedAt: Date.now(),
              };
            }
            activeMission.deathRecords = deathRecords;
          }

          // Wipe = every adventurer perma-dies. Triggers the no-return-travel
          // tick logic — mission completes the moment combat resolves.
          if (deadIds.length > 0 && deadIds.length === team.length) {
            activeMission.wiped = true;
          }

          } // close: else (combat is non-null)
        }

        // Expedition-specific state: snapshot resolved events, init HP maps, initialDuration
        if (isExpedition(template)) {
          const expTemplate = template;
          const resolvedEvents: any[] = [];
          // Use a deterministic seed per mission so resolution is stable across reloads
          let seed = 0;
          const seedStr = template.id + "|" + adventurerIds.join(",");
          for (let i = 0; i < seedStr.length; i++) seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;
          let s2 = seed;
          const rand = () => { s2 = (s2 * 1664525 + 1013904223) & 0x7fffffff; return s2 / 0x7fffffff; };
          for (const slot of expTemplate.events) {
            const chosen = resolveEventSlot(slot, rand);
            if (chosen) resolvedEvents.push(chosen);
          }
          const hpMap: Record<string, number> = {};
          const maxHpMap: Record<string, number> = {};
          for (const adv of team) {
            const m = calcAdventurerMaxHp(adv);
            // Enter the expedition at current HP (wounded heroes start wounded).
            hpMap[adv.id] = Math.min(m, adv.currentHp ?? m);
            maxHpMap[adv.id] = m;
          }
          activeMission.expeditionEventIndex = 0;
          activeMission.expeditionHp = hpMap;
          activeMission.expeditionMaxHp = maxHpMap;
          activeMission.expeditionResolvedEvents = resolvedEvents;
          activeMission.initialDuration = effectiveDuration;
          activeMission.expeditionLog = [];
          activeMission.expeditionRewards = [];
        }

        s.activeMissions.push(activeMission);
        // Remove from mission board so it can't be repeated
        s.missionBoard = s.missionBoard.filter((m) => m.id !== template.id);
        s.firstMissionSent = true;
      }));
      scheduleSave();
      return true;
    },
    collectCompletedMissions() {
      const completed = [...state.completedMissions];
      if (completed.length > 0) {
        setState(produce((s) => { s.completedMissions = []; }));
        scheduleSave();
      }
      return completed;
    },
    getAvailableAdventurers() {
      // A trainer mid-drill is occupied and can't be sent on a mission.
      const drilling = new Set<string>();
      for (const x of [...state.watchtowers, ...state.barracks]) {
        const id = x.garrison.training?.trainerId;
        if (id) drilling.add(id);
      }
      return state.adventurers.filter((a) => a.alive && !a.onMission && !drilling.has(a.id));
    },
    getRosterSize() {
      const guildLvl = this.getGuildLevel();
      // Only the living count toward the cap; the fallen are memorial-only.
      const current = state.adventurers.filter((a) => a.alive).length;
      return { current, max: getMaxRoster(guildLvl) };
    },
    getDrinkInfo(id) {
      const cfg = getCommodityDrink(id);
      if (!cfg) return { current: 0, cap: 0, production: 0, consumption: 0 };
      const buildingLvl = state.buildings.find((b) => b.buildingId === cfg.requiresBuilding)?.level ?? 0;
      const tavernLvl = state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
      const unlocked = buildingLvl >= (cfg.minBuildingLevel ?? 1);
      const onMenu = (state.tavernMenu ?? []).includes(id);
      const stock = (state as unknown as Record<string, number>)[cfg.resource] ?? 0;
      return {
        current: Math.floor(stock),
        cap: unlocked ? cfg.storageBase + buildingLvl * cfg.storagePerBuildingLevel : 0,
        production: unlocked && !state.brewingPaused?.[id] ? buildingLvl * cfg.producePerBuildingLevel : 0,
        consumption: onMenu ? tavernLvl * cfg.consumePerTavernLevel : 0,
      };
    },
    setAutoCook(buildingId, recipeId) {
      setState(produce((s) => {
        if (!s.autoCook[buildingId]) s.autoCook[buildingId] = [];
        const arr = s.autoCook[buildingId];
        const idx = arr.indexOf(recipeId);
        if (idx >= 0) {
          arr.splice(idx, 1); // toggle off
        } else {
          const level = s.buildings.find((b) => b.buildingId === buildingId)?.level ?? 1;
          if (arr.length < cookSlotsForLevel(level)) arr.push(recipeId); // add if a slot's free
        }
        if (arr.length === 0) delete s.autoCook[buildingId];
      }));
      scheduleSave();
    },
    getAutoCookSlots(buildingId) {
      const level = state.buildings.find((b) => b.buildingId === buildingId)?.level ?? 1;
      return cookSlotsForLevel(level);
    },
    startCraft(recipeId, quantity = 1) {
      const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
      if (!recipe || quantity < 1) return false;
      const building = state.buildings.find((b) => b.buildingId === recipe.building);
      if (!building || building.level < recipe.minLevel || building.damaged) return false;
      // Check building tool requirements
      const missingTool = getRequiredTool(recipe, state.buildingTools?.[recipe.building] ?? []);
      if (missingTool) return false;
      // Queue is unlimited. Slots just gate how many items in this building
      // can be PARALLEL-crafted — any overflow enters the queue as `pending`
      // and picks up automatically when a peer finishes.
      // Check costs for total quantity
      const getResourceAmount = (res: string): number => {
        if (res === "wool") return state.wool;
        if (res === "fiber") return state.fiber;
        if (res === "iron") return state.iron;
        if (res === "leather") return state.leather;
        if (res === "gold") return state.resources.gold;
        if (res === "wood") return state.resources.wood;
        if (res === "stone") return state.resources.stone;
        if (res === "food") return getTotalFood(state.foods);
        if (res === "honey") return state.honey;
        if (res === "astralShards") return state.astralShards;
        // Food items (wheat, meat, eggs, ...) and the "grain" alias
        if (res === "grain" || res === "wild" || isFoodItemType(res)) return getFoodCostAmount(state.foods, res);
        // Exotic goods (pepper, cinnamon, tea, chili, saffron)
        if (EXOTIC_IDS.includes(res)) return state.exotics?.[res] ?? 0;
        const inv = state.inventory.find((i) => i.itemId === res);
        return inv?.quantity ?? 0;
      };
      for (const cost of recipe.costs) {
        if (getResourceAmount(cost.resource) < cost.amount * quantity) return false;
      }
      setState(produce((s) => {
        // Deduct total cost upfront
        for (const cost of recipe.costs) {
          const total = cost.amount * quantity;
          const res = cost.resource;
          if (res === "wool") s.wool -= total;
          else if (res === "fiber") s.fiber -= total;
          else if (res === "iron") s.iron -= total;
          else if (res === "leather") s.leather -= total;
          else if (res === "gold") s.resources.gold -= total;
          else if (res === "wood") s.resources.wood -= total;
          else if (res === "stone") s.resources.stone -= total;
          else if (res === "food") consumeFood(s.foods, total);
          else if (res === "honey") s.honey = Math.max(0, s.honey - total);
          else if (res === "astralShards") s.astralShards -= total;
          else if (res === "grain" || res === "wild" || isFoodItemType(res)) consumeFoodCost(s.foods, res, total);
          else if (EXOTIC_IDS.includes(res)) {
            if (!s.exotics) s.exotics = {};
            s.exotics[res] = Math.max(0, (s.exotics[res] ?? 0) - total);
          }
          else {
            const inv = s.inventory.find((i) => i.itemId === res);
            if (inv) inv.quantity -= total;
          }
        }
        // Stack onto the existing entry if one's already crafting this recipe,
        // otherwise push a new queue entry — active if a slot's free in this
        // building, pending otherwise.
        const existing = s.craftingQueue.find((c) => c.recipeId === recipeId);
        if (existing) {
          existing.quantity = (existing.quantity ?? 1) + quantity;
        } else {
          const activeInBuilding = s.craftingQueue.filter((c) => {
            if (c.pending) return false;
            const r = CRAFTING_RECIPES.find((cr) => cr.id === c.recipeId);
            return r?.building === recipe.building;
          }).length;
          const consumableBonus = recipe.building === "kitchen" ? 1 : 0;
          const maxSlots = building.level + consumableBonus;
          const pending = activeInBuilding >= maxSlots;
          s.craftingQueue.push({
            recipeId,
            remaining: recipe.craftTime,
            quantity,
            pending,
          });
        }
      }));
      scheduleSave();
      return true;
    },
    getAvailableRecipes() {
      return CRAFTING_RECIPES.filter((r) => {
        const building = state.buildings.find((b) => b.buildingId === r.building);
        return building && building.level >= r.minLevel;
      });
    },
    installBuildingTool(toolId: string, targetBuildingId: string) {
      const toolDef = getBuildingTool(toolId);
      if (!toolDef || toolDef.targetBuilding !== targetBuildingId) return false;
      // Check tool is in inventory
      const inv = state.inventory.find((i) => i.itemId === toolId);
      if (!inv || inv.quantity < 1) return false;
      // Check target building exists
      const building = state.buildings.find((b) => b.buildingId === targetBuildingId);
      if (!building || building.level < 1) return false;
      // Check not already installed
      const installed = state.buildingTools?.[targetBuildingId] ?? [];
      if (installed.includes(toolId)) return false;
      setState(produce((s) => {
        // Remove from inventory
        const inv = s.inventory.find((i) => i.itemId === toolId);
        if (inv) {
          inv.quantity -= 1;
          if (inv.quantity <= 0) {
            s.inventory.splice(s.inventory.indexOf(inv), 1);
          }
        }
        // Install in building
        if (!s.buildingTools) s.buildingTools = {};
        if (!s.buildingTools[targetBuildingId]) s.buildingTools[targetBuildingId] = [];
        s.buildingTools[targetBuildingId].push(toolId);
        const buildingName = BUILDINGS.find((b) => b.id === targetBuildingId)?.name ?? targetBuildingId;
        pushEvent(s, "building_completed", toolDef.icon, `Installed ${toolDef.name} at ${buildingName}`);
      }));
      scheduleSave();
      return true;
    },
    getInstalledTools(buildingId: string) {
      return state.buildingTools?.[buildingId] ?? [];
    },
    enchantItem(enchantId, adventurerId, slot, inventoryIdx) {
      const ench = getEnchantment(enchantId);
      if (!ench) return false;
      const enchantShopLevel = state.buildings.find((b) => b.buildingId === "enchanting_shop")?.level ?? 0;
      if (enchantShopLevel < ench.minShopLevel) return false;

      // Check valid slot
      if (slot && !ench.validSlots.includes(slot as any)) return false;

      // Check costs
      for (const cost of ench.costs) {
        const inv = state.inventory.find((i) => i.itemId === cost.resource);
        if (!inv || inv.quantity < cost.amount) return false;
      }

      setState(produce((s) => {
        // Deduct costs
        for (const cost of ench.costs) {
          const inv = s.inventory.find((i) => i.itemId === cost.resource);
          if (inv) inv.quantity -= cost.amount;
        }

        if (adventurerId && slot) {
          // Enchant equipped item
          const adv = s.adventurers.find((a) => a.id === adventurerId);
          if (!adv) return;
          if (!adv.equipmentEnchants) adv.equipmentEnchants = {};
          if (!adv.equipmentEnchants[slot]) adv.equipmentEnchants[slot] = [];
          adv.equipmentEnchants[slot]!.push(enchantId);
        } else if (inventoryIdx !== null && inventoryIdx >= 0) {
          // Enchant inventory item — unstack if qty > 1
          const inv = s.inventory[inventoryIdx];
          if (!inv) return;
          if (inv.quantity > 1) {
            // Unstack: reduce qty by 1, create new entry with enchantment
            inv.quantity -= 1;
            s.inventory.push({ itemId: inv.itemId, quantity: 1, enchantments: [...(inv.enchantments ?? []), enchantId] });
          } else {
            // Single item: add enchantment in place
            if (!inv.enchantments) inv.enchantments = [];
            inv.enchantments.push(enchantId);
          }
        }
      }));
      scheduleSave();
      return true;
    },
    getClothingInfo() {
      return {
        current: Math.round(state.clothing),
        needed: Math.ceil(totalPopulation(state.citizens) / CLOTHING_PER_CITIZENS),
      };
    },
    allocateStat(adventurerId, stat) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv) return false;
      if (getUnspentStatPoints(adv) <= 0) return false;
      if (!STAT_KEYS.includes(stat)) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((a) => a.id === adventurerId)!;
        a.bonusStats[stat] = (a.bonusStats[stat] ?? 0) + 1;
      }));
      scheduleSave();
      return true;
    },
    unlockTalent(adventurerId, talentId) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      if (!canUnlockTalent(adv, talentId)) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((a) => a.id === adventurerId)!;
        if (!a.talents) a.talents = [];
        a.talents.push(talentId);
      }));
      scheduleSave();
      return true;
    },
    resetTalents(adventurerId) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      if (!adv.talents?.length) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((a) => a.id === adventurerId)!;
        a.talents = [];
      }));
      scheduleSave();
      return true;
    },
    equipItem(adventurerId, itemId, targetSlot) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      const itemDef = getItem(itemId);
      if (!itemDef) return false;
      // Items without a slot are pure consumables (foods, recovery items) or
      // materials — they don't go through equipment, they route via mission
      // supplies / inventory. Reject any attempt to equip them.
      if (!itemDef.slot) return false;
      // Rings fit either ring slot: honour the clicked slot if valid, else drop
      // into the first free ring slot (ring1, then ring2). Everything else uses
      // its own defined slot.
      let slot: ItemSlot = itemDef.slot;
      if (targetSlot && slotAccepts(itemDef.slot, targetSlot)) {
        slot = targetSlot;
      } else if (isRingSlot(itemDef.slot)) {
        slot = !adv.equipment.ring1 ? "ring1" : !adv.equipment.ring2 ? "ring2" : "ring1";
      }
      // Weapons gate by weapon-family CATEGORY (+ talent grants), not per-item
      // class — mirrors armor. A stale `classes` list on a weapon is ignored.
      if (slot === "mainHand" && itemDef.weaponType) {
        if (!getWeaponAccess(adv.class, adv.talents).has(itemDef.weaponType)) return false;
      } else if (itemDef.classes.length > 0 && !itemDef.classes.includes(adv.class)) {
        // Class restriction for themed non-weapons (wizard_hat, priest_circlet…).
        return false;
      }
      // Armor type restriction — check base class access + talent grants
      if (itemDef.armorType) {
        const access = getArmorAccess(adv.class, adv.talents);
        if (!access.has(itemDef.armorType)) return false;
      }
      // Unique-equip: can't wear a second copy (e.g. two Stranger's Signets
      // across ring1/ring2). Holding extras is fine — they sell/trade.
      if (itemDef.uniqueEquip && Object.entries(adv.equipment).some(([sl, id]) => sl !== slot && id === itemId)) {
        return false;
      }
      const inv = state.inventory.find((i) => i.itemId === itemId);
      if (!inv || inv.quantity <= 0) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((a) => a.id === adventurerId)!;
        // Unequip current item in that slot first (return to inventory)
        const currentItemId = a.equipment[slot];
        if (currentItemId) {
          const curInv = s.inventory.find((i) => i.itemId === currentItemId);
          if (curInv) curInv.quantity += 1;
          else s.inventory.push({ itemId: currentItemId, quantity: 1 });
        }
        // Equip new item
        a.equipment[slot] = itemId;
        // 2H weapon clears offHand
        if (slot === "mainHand" && itemDef.twoHanded && a.equipment.offHand) {
          const offId = a.equipment.offHand;
          a.equipment.offHand = null;
          const offInv = s.inventory.find((i) => i.itemId === offId);
          if (offInv) offInv.quantity += 1;
          else s.inventory.push({ itemId: offId, quantity: 1 });
        }
        // Equipping offHand clears 2H mainHand
        if (slot === "offHand" && a.equipment.mainHand) {
          const mainItem = getItem(a.equipment.mainHand);
          if (mainItem?.twoHanded) {
            const mainId = a.equipment.mainHand;
            a.equipment.mainHand = null;
            const mainInv = s.inventory.find((i) => i.itemId === mainId);
            if (mainInv) mainInv.quantity += 1;
            else s.inventory.push({ itemId: mainId, quantity: 1 });
          }
        }
        const newInv = s.inventory.find((i) => i.itemId === itemId)!;
        newInv.quantity -= 1;
      }));
      scheduleSave();
      return true;
    },
    unequipItem(adventurerId, slot) {
      const adv = state.adventurers.find((a) => a.id === adventurerId);
      if (!adv || adv.onMission) return false;
      const currentItemId = adv.equipment[slot];
      if (!currentItemId) return false;
      setState(produce((s) => {
        const a = s.adventurers.find((a) => a.id === adventurerId)!;
        a.equipment[slot] = null;
        const inv = s.inventory.find((i) => i.itemId === currentItemId);
        if (inv) inv.quantity += 1;
        else s.inventory.push({ itemId: currentItemId, quantity: 1 });
      }));
      scheduleSave();
      return true;
    },
    getInventoryCount(itemId) {
      return state.inventory.find((i) => i.itemId === itemId)?.quantity ?? 0;
    },
    getHappinessModifier() {
      const h = state.happiness;
      return h >= 80 ? 1 + (h - 80) / 100 : h >= 50 ? 1.0 : 0.6 + (h / 50) * 0.4;
    },
    getHappinessBreakdown() {
      const factors: { label: string; value: number }[] = [];
      factors.push({ label: "Baseline", value: 50 });

      const rates = calcProductionRates(state);
      const foodCons = calcFoodConsumption(state.citizens, countLivingAdventurers(state.adventurers), state.foundingWinterGrace ? FOUNDING_WINTER_RATION : 1);
      const animalFood = calcAnimalFoodConsumption(state.pens);
      const netFood = rates.food - foodCons - animalFood;
      if (netFood > 0) factors.push({ label: "Food surplus", value: Math.min(15, Math.round(netFood / 5)) });
      else if (netFood < 0) factors.push({ label: "Food deficit", value: -Math.min(40, Math.round(Math.abs(netFood) / 2)) });
      if (state.starvationPenalty > 0) {
        const val = -Math.round(state.starvationPenalty);
        factors.push({ label: !peopleAreFed(state) ? "Starvation" : "Famine recovery (fading)", value: val });
      }
      if (state.newbornGlow > 0) {
        factors.push({ label: "👶 Newborn glow (fading)", value: Math.round(state.newbornGlow) });
      }

      const maxPop = calcMaxPopulation(state.buildings);
      const occupancy = totalPopulation(state.citizens) + countLivingAdventurers(state.adventurers);
      const overcrowd = overcrowdingPenalty(occupancy, maxPop);
      if (overcrowd > 0) factors.push({ label: "Overcrowded", value: -overcrowd });

      const shrineHB = state.buildings.find((b) => b.buildingId === "shrine");
      if (shrineHB && shrineHB.level > 0 && !shrineHB.damaged) factors.push({ label: `Shrine Lv.${shrineHB.level}`, value: shrineHB.level * SHRINE_HAPPINESS_PER_LEVEL });

      // Solara's blessing
      if (state.activeBlessing?.effect?.startsWith("happiness:")) {
        const bonus = parseInt(state.activeBlessing.effect.split(":")[1]);
        if (bonus) factors.push({ label: "Solara's Warmth", value: bonus });
      }

      const tavernLvl = state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
      if (tavernLvl > 0) {
        const hasAle = state.ale > 0;
        factors.push({ label: `Tavern Lv.${tavernLvl}${hasAle ? "" : " (dry)"}`, value: tavernLvl * (hasAle ? TAVERN_HAPPINESS_PER_LEVEL : TAVERN_HAPPINESS_DRY) });
      }

      // Clothing
      const clothNeeded = Math.ceil(totalPopulation(state.citizens) / CLOTHING_PER_CITIZENS);
      if (clothNeeded > 0) {
        const clothRatio = Math.min(1, state.clothing / clothNeeded);
        if (clothRatio >= 1) {
          factors.push({ label: `Well-clothed (${Math.round(state.clothing)}/${clothNeeded})`, value: CLOTHING_HAPPINESS_BONUS });
        } else if (clothRatio < 0.5) {
          const penalty = -Math.round(5 + 10 * (1 - clothRatio * 2));
          const winterPenalty = state.season === "winter" ? penalty * 2 : penalty;
          factors.push({ label: `Poorly clothed (${Math.round(state.clothing)}/${clothNeeded})${state.season === "winter" ? " — freezing" : ""}`, value: winterPenalty });
        }
      }

      // Food diversity
      const foodSources = new Set<string>();
      for (const pb of state.buildings) {
        if (pb.level === 0 || pb.damaged) continue;
        const def = BUILDINGS.find((b) => b.id === pb.buildingId);
        if (def) {
          const lvlDef = def.levels[pb.level - 1];
          if (lvlDef?.production?.foodType) foodSources.add(lvlDef.production.foodType);
        }
      }
      for (const garden of state.gardens) { if (garden.level > 0) foodSources.add("veggies"); }
      for (const pen of state.pens) {
        if (pen.level > 0) { const animal = getAnimal(pen.animal); foodSources.add(animal.foodLabel.toLowerCase()); }
      }
      const ft = foodSources.size;
      if (getTotalFood(state.foods) > 0) {
        if (ft <= 1) factors.push({ label: `Monotonous diet (${ft} type)`, value: -12 });
        else if (ft === 2) factors.push({ label: `Bland diet (${ft} types)`, value: -5 });
        else if (ft === 3) factors.push({ label: `Good diet (${ft} types)`, value: 3 });
        else if (ft === 4) factors.push({ label: `Varied diet (${ft} types)`, value: 6 });
        else if (ft >= 5) factors.push({ label: `Diverse feast (${ft} types)`, value: 10 });
      }

      const damagedCount = state.buildings.filter((b) => b.damaged).length;
      if (damagedCount > 0) factors.push({ label: `${damagedCount} damaged building${damagedCount > 1 ? "s" : ""}`, value: -damagedCount * 3 });

      if (state.lastRaidOutcome !== "none") {
        const decay = Math.max(0, 1 - state.lastRaidTime / 48);
        if (decay > 0) {
          const val = state.lastRaidOutcome === "victory" ? Math.round(10 * decay) : -Math.round(15 * decay);
          if (val !== 0) factors.push({ label: `Raid ${state.lastRaidOutcome} morale (fading)`, value: val });
        }
      }

      if (state.season === "winter") {
        factors.push({ label: "Winter cold", value: WINTER_HAPPINESS_PENALTY });
        if (state.resources.wood <= 0) factors.push({ label: "No wood (freezing)", value: WINTER_NO_WOOD_HAPPINESS });
      }

      return factors;
    },
    repairBuilding(buildingId) {
      const pb = state.buildings.find((b) => b.buildingId === buildingId);
      if (!pb || !pb.damaged || pb.repairRemaining != null) return false; // not damaged, or already under repair
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def) return false;
      const cost = getRepairCost(def, pb.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const b = s.buildings.find((b) => b.buildingId === buildingId)!;
        // Stays damaged (reduced function) while the mending is underway; the
        // tick clears `damaged` when repairRemaining hits 0.
        b.repairRemaining = getRepairTime(def, pb.level);
        pushEvent(s, "building_repaired", "🔨", `Repairs begun on the ${def.name}`);
      }));
      scheduleSave();
      return true;
    },
    getDefense() {
      const homeAdvs = state.adventurers.filter((a) => a.alive && !a.onMission);
      return calcDefense(state.walls, state.watchtowers, state.barracks, homeAdvs, militiaCount(state));
    },

    // ── Defenses (rework v1): build/upgrade/repair/recruit actions ──
    // Instant for v1 — no construction queue. We can layer queue + mason
    // bonuses later if it feels right after playtest.

    buildOrUpgradeWall(ring) {
      const slot = state.walls.find((w) => w.ring === ring);
      if (!slot || slot.upgrading) return false;
      // Damaged (hp below full for its level) must be repaired before upgrading.
      if (slot.level > 0 && slot.hp < slot.level * WALL_BASE_HP) return false;
      const tier = this.getSettlementTier();
      if (!ringUnlocked(ring, tier)) return false;
      const masonLvl = state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
      const cost = applyMasonCostReduction(getWallCost(slot.level), masonLvl);
      const buildTime = applyMasonTimeReduction(getWallBuildTime(slot.level), masonLvl);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const w = s.walls.find((x) => x.ring === ring)!;
        w.upgrading = true;
        w.upgradeRemaining = buildTime;
      }));
      scheduleSave();
      return true;
    },

    buildOrUpgradeWatchtower(ring) {
      const slot = state.watchtowers.find((t) => t.ring === ring);
      if (!slot || slot.upgrading) return false;
      if (slot.damaged) return false; // repair before upgrading
      const tier = this.getSettlementTier();
      if (!ringUnlocked(ring, tier)) return false;
      const masonLvl = state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
      const cost = applyMasonCostReduction(getWatchtowerCost(slot.level), masonLvl);
      const buildTime = applyMasonTimeReduction(getWatchtowerBuildTime(slot.level), masonLvl);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const t = s.watchtowers.find((x) => x.ring === ring)!;
        t.upgrading = true;
        t.upgradeRemaining = buildTime;
      }));
      scheduleSave();
      return true;
    },

    buildOrUpgradeBarracks(ring) {
      const slot = state.barracks.find((b) => b.ring === ring);
      if (!slot || slot.upgrading) return false;
      if (slot.damaged) return false; // repair before upgrading
      const tier = this.getSettlementTier();
      if (!ringUnlocked(ring, tier)) return false;
      const masonLvl = state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
      const baseCost = getBarracksCost(slot.level);
      const cost = applyMasonCostReduction({ wood: baseCost.wood, stone: baseCost.stone }, masonLvl);
      const buildTime = applyMasonTimeReduction(getBarracksBuildTime(slot.level), masonLvl);
      if (
        state.resources.wood < cost.wood ||
        state.resources.stone < cost.stone ||
        state.iron < baseCost.iron
      ) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.iron -= baseCost.iron;
        const b = s.barracks.find((x) => x.ring === ring)!;
        b.upgrading = true;
        b.upgradeRemaining = buildTime;
      }));
      scheduleSave();
      return true;
    },

    buildOrUpgradeMageTower() {
      // Inner-ring-locked: only buildable once the Inner ring itself is
      // unlocked (Town tier per ringUnlocked). Single instance.
      if (state.mageTower.upgrading) return false;
      if (state.mageTower.damaged) return false; // repair before upgrading
      const tier = this.getSettlementTier();
      if (!ringUnlocked("inner", tier)) return false;
      const masonLvl = state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0;
      const cost = applyMasonCostReduction(getMageTowerCost(state.mageTower.level), masonLvl);
      const buildTime = applyMasonTimeReduction(getMageTowerBuildTime(state.mageTower.level), masonLvl);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.mageTower.upgrading = true;
        s.mageTower.upgradeRemaining = buildTime;
      }));
      scheduleSave();
      return true;
    },

    repairWall(ring) {
      const slot = state.walls.find((w) => w.ring === ring);
      if (!slot || slot.level === 0) return false;
      const fullHp = slot.level * WALL_BASE_HP;
      if (slot.hp >= fullHp) return false;
      const cost = getWallRepairCost(slot.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const w = s.walls.find((x) => x.ring === ring)!;
        w.hp = w.level * WALL_BASE_HP;
      }));
      scheduleSave();
      return true;
    },

    repairWatchtower(ring) {
      const slot = state.watchtowers.find((t) => t.ring === ring);
      if (!slot || !slot.damaged) return false;
      const cost = getDefensiveRepairCost(slot.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const t = s.watchtowers.find((x) => x.ring === ring)!;
        t.damaged = false;
      }));
      scheduleSave();
      return true;
    },

    repairBarracks(ring) {
      const slot = state.barracks.find((b) => b.ring === ring);
      if (!slot || !slot.damaged) return false;
      const cost = getDefensiveRepairCost(slot.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        const b = s.barracks.find((x) => x.ring === ring)!;
        b.damaged = false;
      }));
      scheduleSave();
      return true;
    },

    repairMageTower() {
      if (!state.mageTower.damaged) return false;
      const cost = getDefensiveRepairCost(state.mageTower.level);
      if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
      setState(produce((s) => {
        s.resources.wood -= cost.wood;
        s.resources.stone -= cost.stone;
        s.mageTower.damaged = false;
      }));
      scheduleSave();
      return true;
    },

    recruitSoldier(ring) {
      const slot = state.barracks.find((b) => b.ring === ring);
      if (!slot || slot.damaged || slot.level === 0) return false;
      // Per-building cap (not the global cap) — each barracks is its own roster.
      if (slot.garrison.count >= getBarracksSoldierCap(slot.level)) return false;
      if (availableCitizens(state) <= 0) return false;
      if (state.resources.gold < SOLDIER_COST.gold) return false;
      setState(produce((s) => {
        s.resources.gold -= SOLDIER_COST.gold;
        const b = s.barracks.find((x) => x.ring === ring)!;
        b.garrison.count += 1;
        s.soldiers += 1; // mirror in the global total (kept in sync until phase 2 wires raid losses per-building)
      }));
      scheduleSave();
      return true;
    },

    recruitArcher(ring) {
      const slot = state.watchtowers.find((t) => t.ring === ring);
      if (!slot || slot.damaged || slot.level === 0) return false;
      if (slot.garrison.count >= getWatchtowerArcherCap(slot.level)) return false;
      if (availableCitizens(state) <= 0) return false;
      if (state.resources.gold < ARCHER_COST.gold) return false;
      setState(produce((s) => {
        s.resources.gold -= ARCHER_COST.gold;
        const t = s.watchtowers.find((x) => x.ring === ring)!;
        t.garrison.count += 1;
        s.archers += 1;
      }));
      scheduleSave();
      return true;
    },

    dismissSoldier(ring) {
      const slot = state.barracks.find((b) => b.ring === ring);
      if (!slot || slot.garrison.count <= 0) return false;
      setState(produce((s) => {
        const b = s.barracks.find((x) => x.ring === ring)!;
        b.garrison.count -= 1;
        s.soldiers = Math.max(0, s.soldiers - 1);
      }));
      scheduleSave();
      return true;
    },

    dismissArcher(ring) {
      const slot = state.watchtowers.find((t) => t.ring === ring);
      if (!slot || slot.garrison.count <= 0) return false;
      setState(produce((s) => {
        const t = s.watchtowers.find((x) => x.ring === ring)!;
        t.garrison.count -= 1;
        s.archers = Math.max(0, s.archers - 1);
      }));
      scheduleSave();
      return true;
    },

    startTraining(kind, ring) {
      const slot = kind === "watchtower"
        ? state.watchtowers.find((t) => t.ring === ring)
        : state.barracks.find((b) => b.ring === ring);
      if (!slot || slot.level === 0 || slot.damaged) return false;
      if (slot.garrison.training) return false;        // already in progress
      // Units sit at base level 1 (= displayed trainedLevel+1); drilling raises
      // them toward the building's level, so trainedLevel caps at level-1. A
      // Lv.1 building can't drill at all (base Lv.1 units); Lv.2 drills to Lv.2.
      if (slot.garrison.trainedLevel >= slot.level - 1) return false;
      // Drilling is done BY the building's trainer-coordinator (Gareth / Morgause),
      // not with gold. They must be home and not already drilling elsewhere.
      const trainer = state.adventurers.find(
        (a) => a.alive && a.premadeId === TRAINER_ID[kind] && !a.onMission,
      );
      if (!trainer) return false;
      const busy = [...state.watchtowers, ...state.barracks].some(
        (x) => x.garrison.training?.trainerId === trainer.id,
      );
      if (busy) return false;
      const target = slot.garrison.trainedLevel + 1;
      const seconds = getTrainTime(target);
      setState(produce((s) => {
        const arr = kind === "watchtower" ? s.watchtowers : s.barracks;
        const item = arr.find((x) => x.ring === ring)!;
        item.garrison.training = { targetLevel: target, remainingSeconds: seconds, trainerId: trainer.id };
      }));
      scheduleSave();
      return true;
    },

    recallAdventurers() {
      const missions = state.activeMissions;
      if (missions.length === 0) return { recalled: 0, instant: false };

      let hasWizard = false;
      let recalledCount = 0;

      setState(produce((s) => {
        for (const mission of s.activeMissions) {
          // Check if any party has a wizard (for partial loot save)
          const team = mission.adventurerIds.map((id) => s.adventurers.find((a) => a.id === id)).filter(Boolean);
          if (team.some((a) => a!.class === "wizard")) hasWizard = true;

          // Free all adventurers
          for (const id of mission.adventurerIds) {
            const adv = s.adventurers.find((a) => a.id === id);
            if (adv) {
              adv.onMission = false;
              recalledCount++;
            }
          }

          // Wizard saves 30% of mission loot on recall
          if (hasWizard) {
            const template = getMission(mission.missionId);
            if (template) {
              const caps = calcStorageCaps(s.buildings);
              for (const reward of template.rewards) {
                if (reward.resource === "astralShards") {
                  s.astralShards += Math.floor(reward.amount * 0.3);
                } else {
                  const key = reward.resource as keyof ResourceState;
                  s.resources[key] = Math.min(caps[key], s.resources[key] + Math.floor(reward.amount * 0.3));
                }
              }
            }
          }
        }
        // Cancel all missions
        s.activeMissions = [];
      }));

      scheduleSave();
      return { recalled: recalledCount, instant: hasWizard };
    },
    spawnTestMissions(...missionIds: string[]) {
      const missions = missionIds.length > 0
        ? missionIds.map((id) => MISSION_POOL.find((m) => m.id === id)).filter(Boolean) as MissionTemplate[]
        : MISSION_POOL; // no args = all missions
      if (missions.length === 0) return;
      setState(produce((s) => {
        s.missionBoard = [...missions];
      }));
    },
    triggerRaid() {
      const tier = getSettlementTier(getTownHallLevel(state.buildings));
      const spawn = spawnRaid(tier, state.year);
      if (!spawn) return false;
      setState(produce((s) => {
        s.incomingRaids.push({
          raidId: spawn.raid.id,
          remaining: 60, // 1 minute warning for testing
          strength: spawn.strength,
          warned: true,
        });
      }));
      return true;
    },
    visitGuild() {
      setState("lastGuildVisit", Date.now());
      scheduleSave();
    },
    hasNewGuildContent() {
      return state.lastMissionRefresh > state.lastGuildVisit && state.missionBoard.length > 0;
    },
    hasNewAdventurers() {
      // No "new!" nudge before the guild is raised: the roster page only shows
      // "build the Adventurer's Guild" until then, so pinging the player there
      // is a dead end. The Thornwoods can arrive (and staff their camps) before
      // the guild exists — they surface on the roster once it's built.
      if ((state.buildings.find((b) => b.buildingId === "adventurers_guild")?.level ?? 0) <= 0) return false;
      const seen = new Set(state.adventurersSeen ?? []);
      return state.adventurers.some((a) => a.alive && !seen.has(a.id));
    },
    markAdventurersSeen() {
      const seen = new Set(state.adventurersSeen ?? []);
      if (state.adventurers.every((a) => seen.has(a.id))) return;
      setState(produce((s) => {
        if (!s.adventurersSeen) s.adventurersSeen = [];
        for (const a of s.adventurers) {
          if (!s.adventurersSeen.includes(a.id)) s.adventurersSeen.push(a.id);
        }
      }));
      scheduleSave();
    },
    visitChronicleJournal() {
      // Mark all currently-fired entries as seen
      const fired = state.chronicleEntriesFired ?? [];
      const seen = new Set(state.chronicleEntriesSeen ?? []);
      const anyNew = fired.some((id) => !seen.has(id));
      if (!anyNew) return;
      setState(produce((s) => {
        if (!s.chronicleEntriesSeen) s.chronicleEntriesSeen = [];
        for (const id of fired) {
          if (!s.chronicleEntriesSeen.includes(id)) {
            s.chronicleEntriesSeen.push(id);
          }
        }
      }));
      scheduleSave();
    },
    visitChronicleCast() {
      // Mark all currently-unlocked bio fragments as seen
      const unlocked = state.unlockedBioFragments ?? [];
      const seen = new Set(state.bioFragmentsSeen ?? []);
      const anyNew = unlocked.some((id) => !seen.has(id));
      if (!anyNew) return;
      setState(produce((s) => {
        if (!s.bioFragmentsSeen) s.bioFragmentsSeen = [];
        for (const id of unlocked) {
          if (!s.bioFragmentsSeen.includes(id)) {
            s.bioFragmentsSeen.push(id);
          }
        }
      }));
      scheduleSave();
    },
    markChronicleEntrySeen(entryId) {
      setState(produce((s) => {
        if (!s.chronicleEntriesSeen) s.chronicleEntriesSeen = [];
        if (!s.chronicleEntriesSeen.includes(entryId)) {
          s.chronicleEntriesSeen.push(entryId);
        }
      }));
      scheduleSave();
    },
    markBioFragmentSeen(fragmentId) {
      setState(produce((s) => {
        if (!s.bioFragmentsSeen) s.bioFragmentsSeen = [];
        if (!s.bioFragmentsSeen.includes(fragmentId)) {
          s.bioFragmentsSeen.push(fragmentId);
        }
      }));
      scheduleSave();
    },
    hasNewChronicleContent() {
      const entriesFired = state.chronicleEntriesFired ?? [];
      const entriesSeen = new Set(state.chronicleEntriesSeen ?? []);
      if (entriesFired.some((id) => !entriesSeen.has(id))) return true;
      const fragsUnlocked = state.unlockedBioFragments ?? [];
      const fragsSeen = new Set(state.bioFragmentsSeen ?? []);
      return fragsUnlocked.some((id) => !fragsSeen.has(id));
    },
    countUnseenJournalEntries() {
      const fired = state.chronicleEntriesFired ?? [];
      const seen = new Set(state.chronicleEntriesSeen ?? []);
      return fired.filter((id) => !seen.has(id)).length;
    },
    countUnseenMemories() {
      const unlocked = state.unlockedBioFragments ?? [];
      const seen = new Set(state.bioFragmentsSeen ?? []);
      return unlocked.filter((id) => !seen.has(id)).length;
    },
    canClaimDailyLogin() {
      if (state.lastDailyLogin === 0) return true;
      const lastDay = new Date(state.lastDailyLogin).toDateString();
      const today = new Date().toDateString();
      return lastDay !== today;
    },
    claimDailyLogin() {
      if (!this.canClaimDailyLogin()) return false;
      setState(produce((s) => {
        s.astralShards += 10;
        s.lastDailyLogin = Date.now();
      }));
      scheduleSave();
      return true;
    },
    rerollMissions() {
      const rerollCount = typeof state.missionRerollToday === "number" ? state.missionRerollToday : 0;
      const cost = 10 * Math.pow(2, rerollCount);
      if (state.astralShards < cost) return false;
      const guildLvl = this.getGuildLevel();
      if (guildLvl === 0) return false;
      setState(produce((s) => {
        s.astralShards -= cost;
        s.missionRerollToday = rerollCount + 1;
        s.missionBoard = generateMissionBoard(buildMissionBoardContext(s, guildLvl, Date.now()));
      }));
      scheduleSave();
      return true;
    },
    devSpawnAllNoviceMissions() {
      setState(produce((s) => {
        s.missionBoard = [...NOVICE_MISSIONS];
      }));
      scheduleSave();
    },
    devSpawnVeteranMissions() {
      setState(produce((s) => {
        s.missionBoard = [...EXPERT_MISSIONS];
      }));
      scheduleSave();
    },
    grantResources(amount) {
      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);
        s.resources.gold = Math.min(caps.gold, s.resources.gold + amount);
        s.resources.wood = Math.min(caps.wood, s.resources.wood + amount);
        s.resources.stone = Math.min(caps.stone, s.resources.stone + amount);
        addFood(s.foods, "wheat", amount, caps.food);
        s.wool = Math.min(craftingMaterialCap(s.buildings), s.wool + amount);
      }));
    },
    saveDevSnapshot() {
      try {
        // Persist the live state to the save slot, then copy it into the
        // snapshot slot so the blob goes through the same shape as a real save.
        saveGameLocal(JSON.parse(JSON.stringify(state)));
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          localStorage.setItem(SNAPSHOT_KEY, raw);
          localStorage.setItem(SNAPSHOT_META_KEY, String(Date.now()));
        }
      } catch (e) {
        console.error("Dev snapshot save failed:", e);
      }
    },
    restoreDevSnapshot() {
      try {
        const snap = localStorage.getItem(SNAPSHOT_KEY);
        if (!snap) return;
        // Drop the snapshot into the live save slot and reload, so the whole
        // normal load + migration pipeline runs against it — no state surgery.
        localStorage.setItem(STORAGE_KEY, snap);
        location.reload();
      } catch (e) {
        console.error("Dev snapshot restore failed:", e);
      }
    },
    hasDevSnapshot() {
      try { return localStorage.getItem(SNAPSHOT_KEY) != null; } catch { return false; }
    },
    devSnapshotTime() {
      try {
        const t = localStorage.getItem(SNAPSHOT_META_KEY);
        return t ? Number(t) : null;
      } catch { return null; }
    },
    cancelBuild(buildingId) {
      const pb = state.buildings.find((b) => b.buildingId === buildingId);
      if (!pb || !pb.upgrading) return false;
      const def = BUILDINGS.find((b) => b.id === buildingId);
      if (!def) return false;
      const levelDef = def.levels[pb.level];
      if (!levelDef) return false;
      // Refund adjusted cost
      const masonLvl = buildingId === "masons_guild" ? 0 :
        (state.buildings.find((b) => b.buildingId === "masons_guild")?.level ?? 0);
      const adjustedCost = applyMasonCostReduction(levelDef.cost, masonLvl);
      setState(produce((s) => {
        const b = s.buildings.find((b) => b.buildingId === buildingId)!;
        b.upgrading = false;
        b.upgradeRemaining = undefined;
        s.resources.wood += adjustedCost.wood;
        s.resources.stone += adjustedCost.stone;
      }));
      scheduleSave();
      return true;
    },
    claimQuestReward(questId) {
      const quest = QUEST_DEFINITIONS.find((q) => q.id === questId);
      if (!quest) return false;
      if (state.questRewardsClaimed.includes(questId)) return false;
      // Quest must be currently triggered (active in the chapter system).
      if (!isQuestTriggered(quest, state)) return false;
      if (!quest.condition(state)) return false;
      setState(produce((s) => {
        s.questRewardsClaimed.push(questId);
        const caps = calcStorageCaps(s.buildings);
        for (const reward of quest.rewards) {
          grantReward(s, reward, caps);
        }

        // Fire Chronicle entry + unlock bio fragments if the quest has them
        if (quest.chronicleEntryId && !s.chronicleEntriesFired.includes(quest.chronicleEntryId)) {
          s.chronicleEntriesFired.push(quest.chronicleEntryId);
        }
        if (quest.unlocksBioFragments) {
          for (const fragId of quest.unlocksBioFragments) {
            if (!s.unlockedBioFragments.includes(fragId)) {
              s.unlockedBioFragments.push(fragId);
            }
          }
        }
        // Unlock specialty crop seeds: mark the seed as unlocked (its garden
        // becomes buildable/sowable) and grant a starter stock to sow with.
        if (quest.unlocksSeeds) {
          for (const seedId of quest.unlocksSeeds) {
            if (!s.seedsUnlocked.includes(seedId)) {
              s.seedsUnlocked.push(seedId);
              s.seeds[seedId] = (s.seeds[seedId] ?? 0) + STARTING_SEED_PER_CROP;
            }
          }
        }

        // Brigand-raid trigger has moved to the event-banner system (Phase 2)
        // and is no longer driven by the quest chain. The deferred event will
        // spawn the raid based on TH level + game-day thresholds. The legacy
        // `triggersRaid` field has been removed from the quest schema.

        // Chapter advancement: if claiming this quest completes its chapter,
        // mark the chapter as completed and advance the storyline pointer.
        // Multiple chapters can advance in one claim if the previous chapter
        // was already empty (e.g. a guild chapter unlocking when its first
        // quest is claimed). Each storyline tracks its own progression.
        if (s.chapters) {
          const cs = s.chapters.find((c) => c.storyline === quest.storyline);
          if (cs && !cs.completedChapters.includes(quest.chapter)) {
            // Inline-check chapter completion against the post-claim state.
            // (We just pushed questId into questRewardsClaimed above, so the
            // subsequent isChapterComplete call sees the claim.)
            if (isChapterComplete(s, quest.storyline, quest.chapter)) {
              cs.completedChapters.push(quest.chapter);
              cs.current = quest.chapter + 1;
            }
          }
        }

        // Run narrative event evaluator: chapter completion may have triggered
        // cross-storyline events (e.g. settlement Ch.2 done → guild activates).
        applyEventEvaluation(s);
      }));
      scheduleSave();
      return true;
    },
    getHerbCount(herbId) {
      return state.herbs?.[herbId] ?? 0;
    },
    makeOffering(deityId) {
      const deity = getDeity(deityId);
      if (!deity) return false;
      const shrineB = state.buildings.find((b) => b.buildingId === "shrine");
      if (!shrineB || shrineB.level === 0 || shrineB.damaged) return false; // no shrine, or desecrated

      // Check if player can afford offering
      for (const cost of deity.offeringCost) {
        const res = cost.resource;
        if (res === "gold" && state.resources.gold < cost.amount) return false;
        if (res === "food" && getTotalFood(state.foods) < cost.amount) return false;
        if (res === "wood" && state.resources.wood < cost.amount) return false;
        if (res === "stone" && state.resources.stone < cost.amount) return false;
        if (res === "wool" && state.wool < cost.amount) return false;
        if (res === "iron" && state.iron < cost.amount) return false;
        if (res === "weapons" && state.weapons < cost.amount) return false;
        if (res === "clothing" && state.clothing < cost.amount) return false;
        if (res === "astralShards" && state.astralShards < cost.amount) return false;
      }

      setState(produce((s) => {
        // Deduct offering costs
        for (const cost of deity.offeringCost) {
          const res = cost.resource;
          if (res === "gold") s.resources.gold -= cost.amount;
          else if (res === "food") consumeFood(s.foods, cost.amount);
          else if (res === "wood") s.resources.wood -= cost.amount;
          else if (res === "stone") s.resources.stone -= cost.amount;
          else if (res === "wool") s.wool -= cost.amount;
          else if (res === "iron") s.iron -= cost.amount;
          else if (res === "weapons") s.weapons -= cost.amount;
          else if (res === "clothing") s.clothing -= cost.amount;
          else if (res === "astralShards") s.astralShards -= cost.amount;
        }
        // Set blessing
        s.activeBlessing = { deityId: deity.id, effect: deity.blessingEffect };
        pushEvent(s, "building_completed", deity.icon, `${deity.name}'s blessing received: ${deity.blessingDescription}`);
      }));
      scheduleSave();
      return true;
    },
    startAlchemyResearch() {
      const labLvl = state.buildings.find((b) => b.buildingId === "alchemy_lab")?.level ?? 0;
      if (labLvl === 0) return false;
      if (!state.alchemyResearchAvailable) return false;
      if (state.resources.gold < RESEARCH_BASE_COST) return false;

      const discoverable = getDiscoverableRecipes(labLvl, state.discoveredRecipes ?? []);
      if (discoverable.length === 0) return false;

      setState(produce((s) => {
        s.resources.gold -= RESEARCH_BASE_COST;
        s.alchemyResearchAvailable = false;

        // Roll for discovery
        for (const recipe of discoverable) {
          if (Math.random() < recipe.discoveryChance) {
            s.discoveredRecipes = [...(s.discoveredRecipes ?? []), recipe.id];
            pushEvent(s, "building_completed", recipe.icon, `Alchemy breakthrough! Discovered: ${recipe.name}`);
            break; // only discover one per research
          }
        }
      }));
      scheduleSave();
      return true;
    },
    startAlchemyCraft(recipeId: string, quantity = 1) {
      if (quantity < 1) return false;
      const labLvl = state.buildings.find((b) => b.buildingId === "alchemy_lab")?.level ?? 0;
      if (labLvl === 0) return false;
      const lab = state.buildings.find((b) => b.buildingId === "alchemy_lab");
      if (lab?.damaged) return false;

      const recipe = ALCHEMY_RECIPES.find((r) => r.id === recipeId);
      if (!recipe || recipe.minLabLevel > labLvl) return false;

      // Must be a starter recipe or discovered
      if (!recipe.starterRecipe && !(state.discoveredRecipes ?? []).includes(recipeId)) return false;

      // Check ingredient costs for the full quantity. Generic resolver so a
      // recipe can spend herbs, exotics, or materials (e.g. tusk_shard).
      for (const cost of recipe.costs) {
        if (getResourceQty(state, cost.resource) < cost.amount * quantity) return false;
      }

      setState(produce((s) => {
        for (const cost of recipe.costs) {
          spendResource(s, cost.resource, cost.amount * quantity);
        }
        // Stack onto existing alchemy queue entry, or push new (pending if over slot cap)
        const existing = s.craftingQueue.find((c) => c.recipeId === recipeId);
        if (existing) {
          existing.quantity = (existing.quantity ?? 1) + quantity;
        } else {
          const activeAlchemy = s.craftingQueue.filter((c) =>
            !c.pending && ALCHEMY_RECIPES.some((r) => r.id === c.recipeId)
          ).length;
          const pending = activeAlchemy >= labLvl + 1;
          s.craftingQueue.push({ recipeId, remaining: recipe.craftTime, quantity, pending });
        }
      }));
      scheduleSave();
      return true;
    },
    claimMissionReward(index) {
      const mission = state.completedMissions[index];
      if (!mission) return;
      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);
        for (const reward of mission.rewards) {
          grantReward(s, reward as { resource: string; amount: number }, caps);
        }
        // Enemy loot is granted here, on claim (resources to stores, items to
        // the pack), so the chest reveal actually hands over the drops.
        for (const l of mission.loot ?? []) {
          if (l.type === "item" && l.itemId) {
            addInventoryItem(s, l.itemId, l.amount);
          } else if (l.resource) {
            grantReward(s, { resource: l.resource, amount: l.amount }, caps);
          }
        }
        s.completedMissions.splice(index, 1);

        // Auto-complete the paired pure-tracker story quest (rewards:[] + no
        // chronicle). Finishing the mission IS its completion, so we don't make
        // the player click a redundant second "done" in the quest log — the next
        // beat appears on its own. The LootModal already surfaced "Quest
        // accomplished". Reward/chronicle story beats keep their normal claim.
        const tracker = QUEST_DEFINITIONS.find(
          (q) => q.completedByMission === mission.missionId && q.rewards.length === 0 && !q.chronicleEntryId,
        );
        if (
          tracker &&
          !s.questRewardsClaimed.includes(tracker.id) &&
          isQuestTriggered(tracker, s) &&
          tracker.condition(s)
        ) {
          s.questRewardsClaimed.push(tracker.id);
          // Mirror claimQuestReward's chapter-advancement so the storyline
          // pointer keeps up when a tracker beat closes out a chapter.
          if (s.chapters) {
            const cs = s.chapters.find((c) => c.storyline === tracker.storyline);
            if (cs && !cs.completedChapters.includes(tracker.chapter) && isChapterComplete(s, tracker.storyline, tracker.chapter)) {
              cs.completedChapters.push(tracker.chapter);
              cs.current = tracker.chapter + 1;
            }
          }
          applyEventEvaluation(s);
        }
      }));
      scheduleSave();
    },
    devTriggerRobin() {
      setState(produce((s) => {
        s.firedRobins = (s.firedRobins ?? []).filter((id) => id !== "robin_dev");
        s.pendingRobins = s.pendingRobins ?? [];
        if (!s.pendingRobins.includes("robin_dev")) s.pendingRobins.push("robin_dev");
      }));
      scheduleSave();
    },
    acknowledgeRobin(robinId) {
      const robin = getRobinEvent(robinId);
      if (!robin) return;
      setState(produce((s) => {
        s.pendingRobins = s.pendingRobins.filter((id) => id !== robinId);
        if (!s.firedRobins.includes(robinId)) s.firedRobins.push(robinId);
        // Apply unlocks. Currently: alchemy recipes pushed into discoveredRecipes.
        // Cast / quest unlocks are extension points (see RobinUnlocks type).
        for (const recipeId of robin.unlocks?.recipes ?? []) {
          if (!s.discoveredRecipes.includes(recipeId)) s.discoveredRecipes.push(recipeId);
        }
        // Fire the chronicle entry into the journal so it's archived.
        if (!s.chronicleEntriesFired.includes(robin.chronicleEntryId)) {
          s.chronicleEntriesFired.push(robin.chronicleEntryId);
        }
      }));
      scheduleSave();
    },
    dismissEvent(eventId) {
      setState(produce((s) => {
        s.pendingEvents = (s.pendingEvents ?? []).filter((id) => id !== eventId);
      }));
      scheduleSave();
    },
    markQuestClaimableSeen(questId) {
      setState(produce((s) => {
        if (!s.questsClaimableSeen) s.questsClaimableSeen = [];
        if (!s.questsClaimableSeen.includes(questId)) s.questsClaimableSeen.push(questId);
      }));
      scheduleSave();
    },
    markBuildingSeen(buildingId) {
      setState(produce((s) => {
        if (!s.buildingsSeen) s.buildingsSeen = [];
        if (!s.buildingsSeen.includes(buildingId)) s.buildingsSeen.push(buildingId);
      }));
      scheduleSave();
    },
    markRecipeSeen(recipeId) {
      setState(produce((s) => {
        if (!s.recipesSeen) s.recipesSeen = [];
        if (!s.recipesSeen.includes(recipeId)) s.recipesSeen.push(recipeId);
      }));
      scheduleSave();
    },
    applyCoopClaim(response, expeditionId) {
      // Apply server-authoritative coop results: rewards to resources, deaths to
      // adventurers, XP + potential level/rank ups. Returns a CompletedMission
      // shape so the caller can hand it to the existing LootModal.
      const herbIds = new Set(HERBS.map((h) => h.id));
      const exoticIds = new Set(EXOTIC_IDS);
      const casualties: string[] = [];
      const levelUps: string[] = [];
      const rankUps: { name: string; newRank: string }[] = [];
      let totalXp = 0;

      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);
        for (const reward of response.rewards) {
          if (reward.resource === "astralShards") {
            s.astralShards += reward.amount;
          } else if (herbIds.has(reward.resource)) {
            if (!s.herbs) s.herbs = {};
            s.herbs[reward.resource] = (s.herbs[reward.resource] ?? 0) + reward.amount;
          } else if (exoticIds.has(reward.resource)) {
            if (!s.exotics) s.exotics = {};
            s.exotics[reward.resource] = (s.exotics[reward.resource] ?? 0) + reward.amount;
          } else {
            const key = reward.resource as keyof typeof s.resources;
            if (key in s.resources) {
              s.resources[key] = Math.min(caps[key], s.resources[key] + reward.amount);
            }
          }
        }

        for (const outcome of response.myAdventurers) {
          const adv = s.adventurers.find((a) => a.id === outcome.id);
          if (!adv) continue;
          if (outcome.died) {
            adv.alive = false;
            casualties.push(adv.name);
            continue;
          }
          if (outcome.xpGained > 0) {
            const oldRank = adv.rank;
            const result = applyXp(adv, outcome.xpGained);
            totalXp += outcome.xpGained;
            if (result.leveled) levelUps.push(adv.name);
            if (result.rankUp && adv.rank !== oldRank) {
              rankUps.push({ name: adv.name, newRank: RANK_NAMES[adv.rank] });
            }
          }
        }
      }));
      scheduleSave();

      return {
        missionId: expeditionId,
        success: response.success,
        rewards: response.rewards.map((r) => ({ resource: r.resource as any, amount: r.amount })),
        casualties,
        revived: [],
        xpGained: totalXp,
        levelUps,
        rankUps,
      };
    },
    skipRaidTimer() {
      if (state.incomingRaids.length === 0) return;
      setState(produce((s) => {
        for (const raid of s.incomingRaids) {
          raid.remaining = 0;
        }
      }));
    },
    skipMissionTimers() {
      if (state.activeMissions.length === 0) return;
      setState(produce((s) => {
        for (const m of s.activeMissions) {
          m.remaining = 0;
        }
      }));
    },
    markCombatViewed(missionId) {
      setState(produce((s) => {
        const m = s.activeMissions.find((am) => am.missionId === missionId);
        if (!m) return;
        // Regular mission: stamp the mission-level flag.
        m.combatViewed = true;
        // Expedition: stamp the most recent combat event in the log so the
        // red pulse releases for *that* fight specifically. The next
        // combat event in the same expedition will set its own flag back
        // to false on resolution and start the cycle again.
        const log = m.expeditionLog;
        if (log) {
          for (let i = log.length - 1; i >= 0; i--) {
            if (log[i].kind === "combat") {
              log[i].combatViewed = true;
              break;
            }
          }
        }
      }));
      scheduleSave();
    },
    acknowledgeWipeCompletion(missionId) {
      // Called when the player closes the combat playback modal for a wiped
      // mission. Zeros remaining so the mission completes; the modal has
      // already closed so the unmount doesn't surprise the player.
      setState(produce((s) => {
        const m = s.activeMissions.find((am) => am.missionId === missionId);
        if (m?.wiped) {
          m.combatViewed = true;
          m.remaining = 0;
        }
      }));
      scheduleSave();
    },
    acknowledgeRaidCombat(raidId) {
      // Called when the player closes the raid combat playback modal. The
      // raid's outcome was already applied when the timer hit 0 — this just
      // splices the resolved card from the threats panel.
      setState(produce((s) => {
        const idx = s.incomingRaids.findIndex((ir) => ir.raidId === raidId && ir.combatLog);
        if (idx >= 0) s.incomingRaids.splice(idx, 1);
      }));
      scheduleSave();
    },
    devAddShards(amount) {
      setState(produce((s) => { s.astralShards += amount; }));
      scheduleSave();
    },
    trade(give, giveAmount, receive, receiveAmount, allowWithoutMarket = false) {
      const marketLevel = state.buildings.find((b) => b.buildingId === "marketplace")?.level ?? 0;
      // A traveling merchant who is physically here IS the trade window, so those
      // trades bypass the marketplace requirement (allowWithoutMarket). The market
      // is still required for the standing marketplace offer board.
      if (marketLevel === 0 && !allowWithoutMarket) return false;

      // Read current stock of a tradable resource (handles base resources, food total,
      // and top-level fields like wool/fiber/iron/ale/honey/fruit).
      const readAmount = (key: string): number => {
        if (key === "gold" || key === "wood" || key === "stone") {
          return state.resources[key as keyof ResourceState] ?? 0;
        }
        if (key === "food")  return getTotalFood(state.foods);
        if (key === "iron")  return state.iron ?? 0;
        if (key === "wool")  return state.wool ?? 0;
        if (key === "fiber") return state.fiber ?? 0;
        if (key === "ale")   return state.ale ?? 0;
        if (key === "honey") return state.honey ?? 0;
        if (key === "fruit") {
          const f = state.foods ?? {};
          return (f.apples ?? 0) + (f.pears ?? 0) + (f.cherries ?? 0);
        }
        if (EXOTIC_IDS.includes(key)) return state.exotics?.[key] ?? 0;
        return 0;
      };

      if (readAmount(give) < giveAmount) return false;

      setState(produce((s) => {
        const caps = calcStorageCaps(s.buildings);

        // Deduct the "give" side
        if (give === "gold" || give === "wood" || give === "stone") {
          s.resources[give as keyof ResourceState] -= giveAmount;
        } else if (give === "food") {
          consumeFood(s.foods, giveAmount);
        } else if (give === "iron")  s.iron -= giveAmount;
        else if (give === "wool")    s.wool -= giveAmount;
        else if (give === "fiber")   s.fiber -= giveAmount;
        else if (give === "ale")     s.ale = Math.max(0, s.ale - giveAmount);
        else if (give === "honey")   s.honey = Math.max(0, s.honey - giveAmount);
        else if (give === "fruit") {
          // Proportionally drain apples/pears/cherries
          const f = s.foods ?? emptyFoods();
          const total = (f.apples ?? 0) + (f.pears ?? 0) + (f.cherries ?? 0);
          if (total > 0) {
            const toTake = Math.min(total, giveAmount);
            for (const k of ["apples", "pears", "cherries"] as const) {
              const share = (f[k] ?? 0) / total;
              f[k] = Math.max(0, (f[k] ?? 0) - toTake * share);
            }
          }
        }
        else if (EXOTIC_IDS.includes(give)) {
          if (!s.exotics) s.exotics = {};
          s.exotics[give] = Math.max(0, (s.exotics[give] ?? 0) - giveAmount);
        }

        // Credit the "receive" side (respecting caps where applicable)
        if (receive === "gold" || receive === "wood" || receive === "stone") {
          const key = receive as keyof ResourceState;
          s.resources[key] = Math.min(caps[key], s.resources[key] + receiveAmount);
        } else if (receive === "food") {
          addFood(s.foods, "wheat", receiveAmount, caps.food);
        } else if (receive === "iron")  s.iron = Math.min(craftingMaterialCap(s.buildings), s.iron + receiveAmount);
        else if (receive === "wool")    s.wool = Math.min(craftingMaterialCap(s.buildings), s.wool + receiveAmount);
        else if (receive === "fiber")   s.fiber = Math.min(craftingMaterialCap(s.buildings), s.fiber + receiveAmount);
        else if (receive === "ale") {
          const breweryLvl = s.buildings.find((b) => b.buildingId === "brewery")?.level ?? 0;
          const aleCap = ALE_STORAGE_BASE + breweryLvl * ALE_STORAGE_PER_BREWERY_LEVEL;
          s.ale = Math.min(aleCap, s.ale + receiveAmount);
        }
        else if (receive === "honey")   s.honey = s.honey + receiveAmount;
        else if (receive === "fruit") {
          // Split incoming fruit evenly across the three types
          const each = receiveAmount / 3;
          addFood(s.foods, "apples", each, caps.food);
          addFood(s.foods, "pears", each, caps.food);
          addFood(s.foods, "cherries", each, caps.food);
        }
        else if (EXOTIC_IDS.includes(receive)) {
          if (!s.exotics) s.exotics = {};
          s.exotics[receive] = (s.exotics[receive] ?? 0) + receiveAmount;
        }

        s.lastTradeAt = Date.now();
      }));
      scheduleSave();
      return true;
    },
  };

  return (
    <Show when={loadError()} fallback={
      <Show when={loaded()} fallback={
        <div style={{
          display: "flex", "align-items": "center", "justify-content": "center",
          height: "100dvh", color: "var(--text-secondary)", "font-family": "var(--font-heading)",
          "font-size": "1.4rem", background: "var(--bg-primary)",
        }}>
          Loading your settlement...
        </div>
      }>
        <GameContext.Provider value={(() => { if (IS_DEV) (window as any).__game = { state, actions }; return { state, actions }; })()}>
          {props.children}
        </GameContext.Provider>
      </Show>
    }>
      <div style={{
        display: "flex", "flex-direction": "column", "align-items": "center", "justify-content": "center",
        height: "100dvh", padding: "24px", "text-align": "center",
        color: "var(--text-secondary)", background: "var(--bg-primary)",
      }}>
        <div style={{ "font-family": "var(--font-heading)", "font-size": "1.4rem", "margin-bottom": "12px", color: "var(--text-primary)" }}>
          Couldn't reach the server
        </div>
        <div style={{ "font-size": "0.9rem", "margin-bottom": "20px", "max-width": "320px" }}>
          We tried a few times and gave up. Check your connection and try again. Your settlement is safe on the server.
        </div>
        <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-bottom": "24px", "max-width": "320px", "word-break": "break-word" }}>
          {loadError()}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 24px",
            background: "var(--accent-gold)",
            color: "#1a1a1a",
            border: "none",
            "border-radius": "6px",
            "font-size": "1rem",
            "font-weight": 600,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    </Show>
  );
}
