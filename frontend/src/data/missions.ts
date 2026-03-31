import type { AdventurerClass, AdventurerRank, Adventurer } from "./adventurers";

// ─── Mission types ──────────────────────────────────────────────

export type RewardType = "gold" | "wood" | "stone" | "food";

export interface MissionReward {
  resource: RewardType;
  amount: number;
}

export interface MissionSlot {
  class: AdventurerClass | "any"; // "any" means any class fills it
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
  rewards: MissionReward[]; // actual rewards earned (empty on fail)
  casualties: string[]; // adventurer IDs who died
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
  },

  // ── Tier 3: Hard (guild Lv3, specific comps) ──────────────────
  {
    id: "dragon_cave",
    name: "Dragon's Cave",
    description: "Rumors speak of a young drake hoarding gold in the eastern caves. High risk, high reward.",
    icon: "🐉",
    slots: [{ class: "warrior" }, { class: "wizard" }, { class: "priest" }],
    duration: 3600, // 1 hour
    rewards: [{ resource: "gold", amount: 300 }, { resource: "stone", amount: 100 }],
    deployCost: 50,
    difficulty: 4,
    minGuildLevel: 3,
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
  },

  // ── Tier 4: Very Hard (guild Lv4+) ────────────────────────────
  {
    id: "ancient_vault",
    name: "Ancient Vault",
    description: "A sealed vault from a forgotten age. Untold riches await those brave enough to break the seal.",
    icon: "🏛️",
    slots: [{ class: "wizard" }, { class: "warrior" }, { class: "assassin" }, { class: "priest" }],
    duration: 5400, // 1.5 hours
    rewards: [{ resource: "gold", amount: 500 }, { resource: "stone", amount: 200 }, { resource: "wood", amount: 200 }],
    deployCost: 80,
    difficulty: 5,
    minGuildLevel: 4,
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
  },
];

// ─── Success calculation ────────────────────────────────────────

/**
 * Calculate success chance for a team assigned to a mission.
 * - Each filled slot adds to base success
 * - Matching the required class gives a bonus
 * - Average adventurer rank vs mission difficulty matters
 * - Returns 0-100
 */
export function calcSuccessChance(
  mission: MissionTemplate,
  team: Adventurer[],
): number {
  if (team.length === 0) return 0;

  const totalSlots = mission.slots.length;
  let matchScore = 0;

  // For each slot, check if we have a matching adventurer
  const assigned = [...team];
  for (const slot of mission.slots) {
    if (slot.class === "any") {
      // Any adventurer fills it fully
      if (assigned.length > 0) {
        matchScore += 1;
        assigned.shift(); // consume one
      }
    } else {
      const idx = assigned.findIndex((a) => a.class === slot.class);
      if (idx !== -1) {
        matchScore += 1; // perfect match
        assigned.splice(idx, 1);
      } else if (assigned.length > 0) {
        matchScore += 0.5; // wrong class fills the slot at half efficiency
        assigned.shift();
      }
    }
  }

  // Base success from slot matching (0-70%)
  const slotPercent = (matchScore / totalSlots) * 70;

  // Rank bonus: average team rank vs difficulty (0-30%)
  const avgRank = team.reduce((sum, a) => sum + a.rank, 0) / team.length;
  const rankRatio = avgRank / mission.difficulty;
  const rankPercent = Math.min(30, rankRatio * 15);

  return Math.min(100, Math.round(slotPercent + rankPercent));
}

// ─── Death chance ───────────────────────────────────────────────

/**
 * On mission failure, each adventurer has a chance to die.
 * Base death chance depends on difficulty. Healers in the team reduce it.
 */
export function calcDeathChance(
  mission: MissionTemplate,
  team: Adventurer[],
  adventurer: Adventurer,
): number {
  // Base death chance: 5% per difficulty level
  let chance = mission.difficulty * 5;

  // Healers reduce death chance significantly
  const healerCount = team.filter((a) => a.class === "priest" && a.id !== adventurer.id).length;
  chance *= Math.pow(0.4, healerCount); // each healer reduces by 60%

  // Healers themselves are less likely to die (they stay in the back)
  if (adventurer.class === "priest") chance *= 0.5;

  // Higher rank = better survival
  chance *= Math.max(0.2, 1 - (adventurer.rank - 1) * 0.15);

  return Math.min(50, Math.max(1, Math.round(chance))); // 1-50% range
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
