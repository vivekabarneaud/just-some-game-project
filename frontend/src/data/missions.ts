import type { AdventurerClass, Adventurer, AdventurerStats } from "./adventurers";
import { calcStats } from "./adventurers";
import { getEquipmentStats } from "./items";

// ─── Mission types ──────────────────────────────────────────────

export type RewardType = "gold" | "wood" | "stone" | "food" | "astralShards";

export interface MissionReward {
  resource: RewardType;
  amount: number;
}

export interface MissionSlot {
  class: AdventurerClass | "any"; // "any" means any class fills it
}

export type MissionTag = "combat" | "exploration" | "magical" | "outdoor" | "stealth" | "escort" | "spying" | "assassination" | "dungeon" | "survival";

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
}

export interface ActiveMission {
  missionId: string;
  adventurerIds: string[];
  remaining: number; // game-seconds remaining
  successChance: number; // 0-100, locked in at deploy
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
}

// ─── Mission pool ───────────────────────────────────────────────

export const MISSION_POOL: MissionTemplate[] = [
  // ── Tier 1: Easy gathering (guild Lv1, short, any class) ──────
  {
    id: "gather_timber",
    name: "Gather Timber",
    description: "Send a team to collect wood from the nearby forest.",
    icon: "🪵",
    slots: [{ class: "any" }],
    duration: 600, // 10 min
    rewards: [{ resource: "wood", amount: 80 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
  },
  {
    id: "quarry_expedition",
    name: "Quarry Expedition",
    description: "Scout the hills for loose stone and haul it back to the settlement.",
    icon: "🪨",
    slots: [{ class: "any" }],
    duration: 600,
    rewards: [{ resource: "stone", amount: 60 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor", "exploration"],
  },
  {
    id: "foraging_run",
    name: "Foraging Run",
    description: "Gather wild berries, roots, and game from the surrounding lands.",
    icon: "🍖",
    slots: [{ class: "any" }],
    duration: 480, // 8 min
    rewards: [{ resource: "food", amount: 100 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
  },
  {
    id: "merchant_escort",
    name: "Merchant Escort",
    description: "Guard a traveling merchant along the trade road for a share of their profits.",
    icon: "💰",
    slots: [{ class: "any" }],
    duration: 720, // 12 min
    rewards: [{ resource: "gold", amount: 40 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor", "combat"],
  },
  {
    id: "herb_gathering",
    name: "Herb Gathering",
    description: "Search the meadows for useful herbs and wild plants.",
    icon: "🌿",
    slots: [{ class: "any" }],
    duration: 540, // 9 min
    rewards: [{ resource: "food", amount: 70 }, { resource: "gold", amount: 10 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor", "exploration"],
  },

  // ── Tier 2: Moderate (guild Lv2, class preferences) ───────────
  {
    id: "bandit_camp",
    name: "Clear Bandit Camp",
    description: "A group of bandits has been raiding caravans. Clear them out and claim their stash.",
    icon: "🏴",
    slots: [{ class: "warrior" }, { class: "any" }],
    duration: 1200, // 20 min
    rewards: [{ resource: "gold", amount: 80 }, { resource: "wood", amount: 50 }],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["combat", "outdoor"],
  },
  {
    id: "deep_forest",
    name: "Deep Forest Expedition",
    description: "Venture deep into the old forest where ancient trees yield valuable timber.",
    icon: "🌲",
    slots: [{ class: "assassin" }, { class: "any" }],
    duration: 1500, // 25 min
    rewards: [{ resource: "wood", amount: 200 }],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["outdoor", "exploration"],
  },
  {
    id: "abandoned_mine",
    name: "Abandoned Mine",
    description: "Explore a collapsed mine shaft. Rich deposits remain if you can clear the rubble.",
    icon: "⛏️",
    slots: [{ class: "warrior" }, { class: "assassin" }],
    duration: 1800, // 30 min
    rewards: [{ resource: "stone", amount: 180 }, { resource: "gold", amount: 30 }],
    deployCost: 20,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["exploration", "stealth"],
  },
  {
    id: "river_crossing",
    name: "River Crossing Patrol",
    description: "Patrol the river fords and fish along the way.",
    icon: "🌊",
    slots: [{ class: "archer" }, { class: "any" }],
    duration: 1200,
    rewards: [{ resource: "food", amount: 150 }, { resource: "gold", amount: 20 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["outdoor"],
  },

  // ── Tier 3: Hard (guild Lv3, specific comps) ──────────────────
  {
    id: "dragon_cave",
    name: "Dragon's Cave",
    description: "Rumors speak of a young drake hoarding gold in the eastern caves. High risk, high reward.",
    icon: "🐉",
    slots: [{ class: "warrior" }, { class: "wizard" }, { class: "priest" }],
    duration: 3600, // 1 hour
    rewards: [{ resource: "gold", amount: 300 }, { resource: "stone", amount: 100 }, { resource: "astralShards", amount: 2 }],
    deployCost: 50,
    difficulty: 4,
    minGuildLevel: 3,
    tags: ["combat", "exploration"],
  },
  {
    id: "haunted_ruins",
    name: "Haunted Ruins",
    description: "Ancient ruins infested with restless spirits. A mage is essential to deal with them.",
    icon: "👻",
    slots: [{ class: "wizard" }, { class: "priest" }],
    duration: 2400, // 40 min
    rewards: [{ resource: "gold", amount: 150 }, { resource: "stone", amount: 120 }],
    deployCost: 35,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["magical", "exploration"],
  },
  {
    id: "kings_bounty",
    name: "King's Bounty Hunt",
    description: "The King has posted a bounty on a dangerous beast terrorizing the countryside.",
    icon: "👑",
    slots: [{ class: "warrior" }, { class: "archer" }, { class: "priest" }],
    duration: 2700, // 45 min
    rewards: [{ resource: "gold", amount: 200 }, { resource: "food", amount: 100 }],
    deployCost: 40,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["combat", "outdoor"],
  },
  {
    id: "lumber_contract",
    name: "Royal Lumber Contract",
    description: "The crown needs a large shipment of quality timber. Fulfill the order for a generous payment.",
    icon: "📜",
    slots: [{ class: "assassin" }, { class: "archer" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "wood", amount: 400 }, { resource: "gold", amount: 80 }],
    deployCost: 30,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["outdoor"],
  },

  // ── Tier 4: Very Hard (guild Lv4+) ────────────────────────────
  {
    id: "ancient_vault",
    name: "Ancient Vault",
    description: "A sealed vault from a forgotten age. Untold riches await those brave enough to break the seal.",
    icon: "🏛️",
    slots: [{ class: "wizard" }, { class: "warrior" }, { class: "assassin" }, { class: "priest" }],
    duration: 5400, // 1.5 hours
    rewards: [{ resource: "gold", amount: 500 }, { resource: "stone", amount: 200 }, { resource: "wood", amount: 200 }, { resource: "astralShards", amount: 5 }],
    deployCost: 80,
    difficulty: 5,
    minGuildLevel: 4,
    tags: ["exploration", "magical", "stealth"],
  },
  {
    id: "enchanted_grove",
    name: "Enchanted Grove",
    description: "A grove shimmering with magical energy. Harvest rare resources but beware the guardians.",
    icon: "✨",
    slots: [{ class: "wizard" }, { class: "archer" }, { class: "priest" }],
    duration: 3600,
    rewards: [{ resource: "food", amount: 300 }, { resource: "wood", amount: 300 }, { resource: "gold", amount: 100 }],
    deployCost: 60,
    difficulty: 4,
    minGuildLevel: 4,
    tags: ["magical", "outdoor"],
  },

  // ── Early magical missions ─────────────────────────────────────
  {
    id: "enchanted_spring",
    name: "Enchanted Spring",
    description: "A spring in the forest glows with faint magical energy. A wizard might be able to harness it.",
    icon: "💧",
    slots: [{ class: "wizard" }],
    duration: 540, // 9 min
    rewards: [{ resource: "food", amount: 60 }, { resource: "gold", amount: 20 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["magical", "outdoor"],
  },
  {
    id: "wandering_spirit",
    name: "Wandering Spirit",
    description: "A restless spirit haunts the old crossroads. A priest or wizard could put it to rest.",
    icon: "👻",
    slots: [{ class: "any" }],
    duration: 600,
    rewards: [{ resource: "gold", amount: 35 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["magical"],
  },
  {
    id: "herb_witch",
    name: "Visit the Herb Witch",
    description: "An old witch in the swamp trades knowledge for favors. Bring a wizard to translate her riddles.",
    icon: "🧙‍♀️",
    slots: [{ class: "wizard" }, { class: "any" }],
    duration: 900,
    rewards: [{ resource: "food", amount: 80 }, { resource: "gold", amount: 40 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["magical", "exploration"],
  },
  {
    id: "cursed_well",
    name: "Cleanse the Cursed Well",
    description: "The village well has been cursed. Only a priest's blessing or a wizard's dispel can purify it.",
    icon: "🕳️",
    slots: [{ class: "priest" }, { class: "any" }],
    duration: 720,
    rewards: [{ resource: "gold", amount: 50 }, { resource: "stone", amount: 30 }],
    deployCost: 8,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["magical", "survival"],
  },

  // ── Escort missions ───────────────────────────────────────────
  {
    id: "caravan_guard",
    name: "Caravan Guard Duty",
    description: "A merchant caravan needs protection along the bandit-infested trade route.",
    icon: "🐴",
    slots: [{ class: "warrior" }, { class: "any" }],
    duration: 900, // 15 min
    rewards: [{ resource: "gold", amount: 50 }, { resource: "food", amount: 30 }],
    deployCost: 10,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["escort", "combat"],
  },
  {
    id: "noble_escort",
    name: "Noble's Escort",
    description: "A minor lord requires safe passage to the capital. Discretion and strength are both needed.",
    icon: "👑",
    slots: [{ class: "warrior" }, { class: "assassin" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 180 }],
    deployCost: 30,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["escort", "combat", "stealth"],
  },
  {
    id: "refugee_convoy",
    name: "Refugee Convoy",
    description: "Lead a group of displaced villagers to safety through dangerous territory. A priest brings hope.",
    icon: "🚶",
    slots: [{ class: "warrior" }, { class: "priest" }, { class: "any" }],
    duration: 1800,
    rewards: [{ resource: "food", amount: 120 }, { resource: "gold", amount: 60 }],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["escort", "survival"],
  },

  // ── Spying missions ───────────────────────────────────────────
  {
    id: "tavern_intel",
    name: "Tavern Intelligence",
    description: "Gather rumors and secrets from the local tavern. A sharp ear and a loose tongue go a long way.",
    icon: "🍺",
    slots: [{ class: "any" }],
    duration: 480, // 8 min
    rewards: [{ resource: "gold", amount: 25 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["spying"],
  },
  {
    id: "rival_settlement",
    name: "Scout Rival Settlement",
    description: "Infiltrate a nearby settlement and map their defenses. Don't get caught.",
    icon: "🕵️",
    slots: [{ class: "assassin" }, { class: "any" }],
    duration: 1500,
    rewards: [{ resource: "gold", amount: 100 }, { resource: "wood", amount: 80 }],
    deployCost: 20,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["spying", "stealth"],
  },
  {
    id: "intercept_courier",
    name: "Intercept the Courier",
    description: "An enemy courier carries valuable intelligence. Intercept them before they reach the border.",
    icon: "📨",
    slots: [{ class: "assassin" }, { class: "archer" }],
    duration: 1200,
    rewards: [{ resource: "gold", amount: 120 }, { resource: "stone", amount: 60 }],
    deployCost: 25,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["spying", "stealth", "combat"],
  },
  {
    id: "double_agent",
    name: "Plant a Double Agent",
    description: "Infiltrate an enemy faction and feed false information. Extremely dangerous if discovered.",
    icon: "🎭",
    slots: [{ class: "assassin" }, { class: "wizard" }, { class: "priest" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 350 }, { resource: "wood", amount: 150 }, { resource: "astralShards", amount: 3 }],
    deployCost: 60,
    difficulty: 4,
    minGuildLevel: 4,
    tags: ["spying", "stealth"],
  },

  // ── Assassination missions ────────────────────────────────────
  {
    id: "bandit_leader",
    name: "Eliminate the Bandit Leader",
    description: "The bandit raids will stop if their leader is dealt with. Quietly.",
    icon: "💀",
    slots: [{ class: "assassin" }, { class: "warrior" }],
    duration: 1800,
    rewards: [{ resource: "gold", amount: 140 }, { resource: "stone", amount: 80 }],
    deployCost: 25,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["assassination", "stealth", "combat"],
  },
  {
    id: "corrupt_official",
    name: "The Corrupt Tax Collector",
    description: "A tax collector has been skimming gold from the crown. Make sure he stops. Permanently.",
    icon: "🗡️",
    slots: [{ class: "assassin" }],
    duration: 1200,
    rewards: [{ resource: "gold", amount: 200 }],
    deployCost: 20,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["assassination", "stealth"],
  },

  // ── Dungeon missions ──────────────────────────────────────────
  {
    id: "goblin_warren",
    name: "Goblin Warren",
    description: "A network of tunnels infested with goblins. Clear them out and claim whatever they've hoarded.",
    icon: "🕳️",
    slots: [{ class: "warrior" }, { class: "archer" }, { class: "any" }],
    duration: 2100,
    rewards: [{ resource: "gold", amount: 100 }, { resource: "stone", amount: 100 }, { resource: "wood", amount: 60 }],
    deployCost: 25,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["dungeon", "combat"],
  },
  {
    id: "flooded_crypt",
    name: "The Flooded Crypt",
    description: "An ancient crypt partially submerged in groundwater. Undead stir in the deep chambers.",
    icon: "🪦",
    slots: [{ class: "wizard" }, { class: "priest" }, { class: "warrior" }],
    duration: 3000,
    rewards: [{ resource: "gold", amount: 200 }, { resource: "stone", amount: 150 }],
    deployCost: 40,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["dungeon", "combat", "magical"],
  },
  {
    id: "crystal_caverns",
    name: "Crystal Caverns",
    description: "Deep beneath the mountains lie caverns of shimmering crystal. Beautiful — and well-guarded.",
    icon: "💎",
    slots: [{ class: "wizard" }, { class: "assassin" }, { class: "warrior" }, { class: "priest" }],
    duration: 4800,
    rewards: [{ resource: "gold", amount: 400 }, { resource: "stone", amount: 300 }, { resource: "astralShards", amount: 4 }],
    deployCost: 70,
    difficulty: 5,
    minGuildLevel: 4,
    tags: ["dungeon", "exploration", "combat"],
  },

  // ── Survival missions ─────────────────────────────────────────
  {
    id: "wilderness_trek",
    name: "Wilderness Trek",
    description: "Survive a week in the untamed wilds. Return with whatever you can forage and hunt.",
    icon: "🏕️",
    slots: [{ class: "archer" }, { class: "any" }],
    duration: 1500,
    rewards: [{ resource: "food", amount: 200 }, { resource: "wood", amount: 80 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["survival", "outdoor"],
  },
  {
    id: "winter_expedition",
    name: "Winter Expedition",
    description: "Brave the frozen passes to reach a hidden valley rich with resources. Many have tried; few return.",
    icon: "🏔️",
    slots: [{ class: "warrior" }, { class: "priest" }, { class: "archer" }],
    duration: 3600,
    rewards: [{ resource: "wood", amount: 250 }, { resource: "stone", amount: 200 }, { resource: "food", amount: 150 }],
    deployCost: 45,
    difficulty: 4,
    minGuildLevel: 3,
    tags: ["survival", "outdoor", "exploration"],
  },
  {
    id: "monster_hunt",
    name: "Monster Hunt",
    description: "A fearsome creature has been spotted near the settlement. Track it down before it strikes.",
    icon: "🐺",
    slots: [{ class: "warrior" }, { class: "archer" }],
    duration: 1800,
    rewards: [{ resource: "food", amount: 180 }, { resource: "gold", amount: 50 }],
    deployCost: 20,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["combat", "outdoor", "survival"],
  },

  // ── Mixed/special missions ────────────────────────────────────
  {
    id: "lost_library",
    name: "The Lost Library",
    description: "Legends tell of a library buried beneath the old ruins, filled with forgotten knowledge and enchanted tomes.",
    icon: "📚",
    slots: [{ class: "wizard" }, { class: "assassin" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 160 }, { resource: "wood", amount: 100 }],
    deployCost: 30,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["exploration", "magical", "dungeon"],
  },
  {
    id: "smuggler_deal",
    name: "Smuggler's Deal",
    description: "Meet a shady contact at the docks. They have rare goods — if the price is right and no one follows.",
    icon: "🌙",
    slots: [{ class: "assassin" }, { class: "any" }],
    duration: 900,
    rewards: [{ resource: "gold", amount: 70 }, { resource: "stone", amount: 50 }, { resource: "wood", amount: 50 }],
    deployCost: 15,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["stealth", "spying"],
  },
  {
    id: "sacred_shrine",
    name: "Pilgrimage to the Sacred Shrine",
    description: "A holy site deep in the wilderness. The journey is perilous but the blessings are bountiful.",
    icon: "⛪",
    slots: [{ class: "priest" }, { class: "warrior" }, { class: "any" }],
    duration: 2100,
    rewards: [{ resource: "gold", amount: 120 }, { resource: "food", amount: 120 }],
    deployCost: 25,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["exploration", "survival", "outdoor"],
  },
  {
    id: "arcane_rift",
    name: "Seal the Arcane Rift",
    description: "A tear in reality has opened, spewing magical energy. Only a skilled wizard can close it safely.",
    icon: "🌀",
    slots: [{ class: "wizard" }, { class: "wizard" }, { class: "priest" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 280 }, { resource: "stone", amount: 180 }, { resource: "astralShards", amount: 3 }],
    deployCost: 55,
    difficulty: 4,
    minGuildLevel: 4,
    tags: ["magical", "combat", "survival"],
  },
];

// ─── Class passive helpers ──────────────────────────────────────

/** Warrior: flat +10% success */
const WARRIOR_SUCCESS_BONUS = 10;
/** Archer: +8% success, +5% extra on outdoor/exploration */
const ARCHER_SUCCESS_BONUS = 8;
const ARCHER_TAG_BONUS = 5;
/** Wizard: +0% flat, but +10% on magical missions */
const WIZARD_TAG_BONUS = 10;
/** Wizard: reduces mission duration by 15% per wizard */
export const WIZARD_DURATION_REDUCTION = 0.15;
/** Assassin: +20% bonus rewards on success, 30% partial loot on failure */
export const ASSASSIN_LOOT_BONUS = 0.20;
export const ASSASSIN_FAIL_LOOT = 0.30;
/** Priest: 15% chance to revive a fallen ally */
export const PRIEST_REVIVE_CHANCE = 0.15;

// ─── Success calculation ────────────────────────────────────────

/**
 * Get the relevant stat for a mission based on its tags.
 * Returns which stat keys contribute to success.
 */
function getMissionStatWeights(tags: MissionTag[]): Partial<Record<keyof AdventurerStats, number>> {
  const weights: Partial<Record<keyof AdventurerStats, number>> = {};
  if (tags.some((t) => t === "combat" || t === "escort")) weights.str = (weights.str ?? 0) + 1;
  if (tags.some((t) => t === "magical" || t === "exploration")) weights.int = (weights.int ?? 0) + 1;
  if (tags.some((t) => t === "stealth" || t === "outdoor" || t === "spying" || t === "assassination")) weights.dex = (weights.dex ?? 0) + 1;
  if (tags.some((t) => t === "survival" || t === "dungeon")) {
    weights.str = (weights.str ?? 0) + 0.5;
    weights.vit = (weights.vit ?? 0) + 0.5;
  }
  // If no specific tags, use a balanced mix
  if (Object.keys(weights).length === 0) {
    weights.str = 0.5; weights.int = 0.5; weights.dex = 0.5;
  }
  return weights;
}

/**
 * Calculate success chance for a team assigned to a mission.
 * Uses adventurer stats, slot matching, and class passives.
 */
export function calcSuccessChance(
  mission: MissionTemplate,
  team: Adventurer[],
): number {
  if (team.length === 0) return 0;

  const totalSlots = mission.slots.length;
  let matchScore = 0;

  const assigned = [...team];
  for (const slot of mission.slots) {
    if (slot.class === "any") {
      if (assigned.length > 0) { matchScore += 1; assigned.shift(); }
    } else {
      const idx = assigned.findIndex((a) => a.class === slot.class);
      if (idx !== -1) { matchScore += 1; assigned.splice(idx, 1); }
      else if (assigned.length > 0) { matchScore += 0.5; assigned.shift(); }
    }
  }

  // Slot matching (0-40%)
  const slotPercent = (matchScore / totalSlots) * 40;

  // Stat-based success (0-45%)
  const statWeights = getMissionStatWeights(mission.tags);
  let totalWeightedStat = 0;
  let totalWeight = 0;
  for (const adv of team) {
    const equipStats = getEquipmentStats(adv.equipment);
    const stats = calcStats(adv, equipStats);
    for (const [stat, weight] of Object.entries(statWeights)) {
      totalWeightedStat += (stats[stat as keyof AdventurerStats] ?? 0) * (weight ?? 0);
      totalWeight += weight ?? 0;
    }
  }
  const avgStat = totalWeight > 0 ? totalWeightedStat / totalWeight : 0;
  // Scale: 20 stat points = roughly max contribution per difficulty level
  const statRatio = avgStat / (mission.difficulty * 20);
  const statPercent = Math.min(45, statRatio * 30);

  // Class passive bonuses (0-15%)
  let classBonus = 0;
  for (const adv of team) {
    if (adv.class === "warrior") {
      classBonus += WARRIOR_SUCCESS_BONUS;
      if (mission.tags.some((t) => t === "escort" || t === "combat")) classBonus += 5;
    }
    if (adv.class === "archer") {
      classBonus += ARCHER_SUCCESS_BONUS;
      if (mission.tags.some((t) => t === "outdoor" || t === "exploration")) classBonus += ARCHER_TAG_BONUS;
    }
    if (adv.class === "wizard" && mission.tags.includes("magical")) classBonus += WIZARD_TAG_BONUS;
    if (adv.class === "assassin" && mission.tags.some((t) => t === "spying" || t === "assassination" || t === "stealth")) classBonus += 8;
    if (adv.class === "priest" && mission.tags.includes("survival")) classBonus += 5;
  }

  return Math.min(100, Math.round(slotPercent + statPercent + classBonus));
}

/**
 * Calculate effective mission duration after wizard speed bonus.
 */
export function calcEffectiveDuration(mission: MissionTemplate, team: Adventurer[]): number {
  const wizardCount = team.filter((a) => a.class === "wizard").length;
  const reduction = Math.min(0.45, wizardCount * WIZARD_DURATION_REDUCTION); // cap at 45%
  return Math.floor(mission.duration * (1 - reduction));
}

/**
 * Calculate assassin bonus loot on success.
 * Returns multiplied rewards.
 */
export function calcAssassinBonusRewards(mission: MissionTemplate, team: Adventurer[]): MissionReward[] {
  const assassinCount = team.filter((a) => a.class === "assassin").length;
  if (assassinCount === 0) return mission.rewards;
  const bonus = 1 + ASSASSIN_LOOT_BONUS * assassinCount;
  return mission.rewards.map((r) => ({ ...r, amount: Math.floor(r.amount * bonus) }));
}

/**
 * Calculate assassin partial loot on failure.
 * Returns reduced rewards (only if an assassin survives).
 */
export function calcAssassinFailRewards(mission: MissionTemplate, team: Adventurer[], survivors: Adventurer[]): MissionReward[] {
  const assassinSurvived = survivors.some((a) => a.class === "assassin");
  if (!assassinSurvived) return [];
  return mission.rewards.map((r) => ({ ...r, amount: Math.floor(r.amount * ASSASSIN_FAIL_LOOT) }));
}

// ─── Death chance ───────────────────────────────────────────────

/**
 * On mission failure, each adventurer has a chance to die.
 * Priest passive reduces death chance for the whole party.
 * Warrior passive: can protect one ally (handled at resolution time).
 */
export function calcDeathChance(
  mission: MissionTemplate,
  team: Adventurer[],
  adventurer: Adventurer,
): number {
  // Base death chance: 5% per difficulty level
  let chance = mission.difficulty * 5;

  // VIT reduces death chance: each point of VIT above 10 reduces by 1%
  const equipStats = getEquipmentStats(adventurer.equipment);
  const stats = calcStats(adventurer, equipStats);
  chance -= Math.max(0, (stats.vit - 10) * 0.8);

  // Priest passive: each priest reduces death chance by 60%
  const priestCount = team.filter((a) => a.class === "priest" && a.id !== adventurer.id).length;
  chance *= Math.pow(0.4, priestCount);

  // Priests stay in the back — lower personal risk
  if (adventurer.class === "priest") chance *= 0.5;

  return Math.min(50, Math.max(1, Math.round(chance)));
}

// ─── Mission board generation ───────────────────────────────────

/** Pick random missions for the board based on guild level */
export function generateMissionBoard(guildLevel: number, count: number = 4, seed: number = Date.now()): MissionTemplate[] {
  const available = MISSION_POOL.filter((m) => m.minGuildLevel <= guildLevel);
  if (available.length <= count) return [...available];

  // Seeded shuffle
  let s = seed;
  function rand(): number {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  }

  const shuffled = [...available].sort(() => rand() - 0.5);
  return shuffled.slice(0, count);
}

/** Number of missions shown on board per refresh */
export function getMissionBoardSize(guildLevel: number): number {
  return Math.min(3 + guildLevel, 8); // 4 at Lv1, up to 8
}

/** Get a mission template by ID */
export function getMission(missionId: string): MissionTemplate | undefined {
  return MISSION_POOL.find((m) => m.id === missionId);
}
