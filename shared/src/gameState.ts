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
  food: number;
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
}

// ─── Farming ────────────────────────────────────────────────────

export type CropId = "wheat" | "barley" | "flax";

export interface PlayerField {
  id: string;
  crop: CropId | null;
  harvested: boolean;
  harvestsBeforeFallow: number;
  fallow: boolean;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

export type VeggieId = "cabbages" | "turnips" | "peas" | "squash";

export interface PlayerGarden {
  id: string;
  veggie: VeggieId;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

export type AnimalId = "chickens" | "pigs" | "goats" | "sheep";

export interface PlayerPen {
  id: string;
  animal: AnimalId;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

// ─── Adventurers ────────────────────────────────────────────────

export type AdventurerClass = "warrior" | "wizard" | "priest" | "archer" | "assassin";

export type AdventurerRank = 1 | 2 | 3 | 4 | 5;

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

export type ItemSlot = "head" | "chest" | "legs" | "boots" | "cloak" | "mainHand" | "offHand" | "ring1" | "ring2" | "amulet" | "trinket";

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

// ─── Missions ───────────────────────────────────────────────────

export type RewardType = "gold" | "wood" | "stone" | "food" | "astralShards"
  | "chamomile" | "mugwort" | "nettle" | "nightbloom" | "moonpetal"; // herbs

export interface MissionReward {
  resource: RewardType;
  amount: number;
}

export interface MissionSlot {
  class: AdventurerClass | "any";
}

export type MissionTag = "combat" | "exploration" | "magical" | "outdoor" | "stealth" | "escort" | "spying" | "assassination" | "dungeon" | "survival";

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

export interface ActiveMission {
  missionId: string;
  adventurerIds: string[];
  remaining: number;
  successChance: number;
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
}

// ─── Raids ──────────────────────────────────────────────────────

export interface IncomingRaid {
  raidId: string;
  remaining: number;
  strength: number;
  warned: boolean;
}

export interface RaidResult {
  raidId: string;
  victory: boolean;
  defenseScore: number;
  raidStrength: number;
  resourcesLost: { gold: number; wood: number; stone: number; food: number };
  citizensLost: number;
  defendersInjured: string[];
  loot: { resource: string; amount: number }[];
  buildingsDamaged?: number;
}

// ─── Crafting ───────────────────────────────────────────────────

export interface ActiveCraft {
  recipeId: string;
  remaining: number;
}

// ─── Events ─────────────────────────────────────────────────────

export type GameEventType =
  | "citizen_born" | "citizen_died" | "citizen_left"
  | "building_completed" | "building_damaged" | "building_repaired"
  | "mission_success" | "mission_failed" | "adventurer_died" | "adventurer_levelup" | "adventurer_rankup"
  | "raid_victory" | "raid_defeat" | "raid_incoming"
  | "winter_freezing"
  | "loot_drop";

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
  population: number;
  season: Season;
  seasonElapsed: number;
  year: number;
  lastTick: number;
  gameSpeed: number;
  villageName: string;
  // Adventurer's Guild
  adventurers: Adventurer[];
  activeMissions: ActiveMission[];
  completedMissions: CompletedMission[];
  recruitCandidates: Adventurer[];
  missionBoard: MissionTemplate[];
  recruitRefreshIn: number;
  missionRefreshIn: number;
  // Harvest tracking
  yearHarvest: Record<string, number>;
  // Materials & Crafting
  wool: number;
  fiber: number;
  leather: number;
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
  // Event log
  eventLog: GameEvent[];
  // Ale & Happiness
  ale: number;
  happiness: number;
  lastRaidOutcome: "none" | "victory" | "defeat";
  lastRaidTime: number;
  starvationPenalty: number;
  // Raids
  incomingRaids: IncomingRaid[];
  raidLog: RaidResult[];
  hoursSinceLastRaid: number;
  // Astral Shards
  astralShards: number;
  lastDailyLogin: number;
  missionRerollToday: boolean | number;
  recruitRerollToday: boolean | number;
  lastRerollReset: number;
  lastGuildVisit: number;
  lastMissionRefresh: number;
  lastRecruitRefresh: number;
  // Quest system
  questRewardsClaimed: string[];
  firstMissionSent: boolean;
  // Story missions
  completedStoryMissions: string[];
}
