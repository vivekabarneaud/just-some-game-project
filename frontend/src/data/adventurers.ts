// ─── Adventurer classes ─────────────────────────────────────────

export type AdventurerClass = "warrior" | "wizard" | "priest" | "archer" | "assassin";

export interface ClassPassive {
  name: string;
  description: string;
}

export interface ClassMeta {
  id: AdventurerClass;
  name: string;
  icon: string;
  description: string;
  passive: ClassPassive;
}

export const ADVENTURER_CLASSES: ClassMeta[] = [
  {
    id: "warrior", name: "Warrior", icon: "⚔️",
    description: "Frontline fighter. Increases success on combat missions.",
    passive: { name: "Shield Wall", description: "+10% success (+15% on escort/combat). Can protect an ally from death." },
  },
  {
    id: "wizard", name: "Wizard", icon: "🔮",
    description: "Arcane caster. Essential for magical and exploration missions.",
    passive: { name: "Arcane Haste", description: "Reduces mission duration by 15%. Bonus success on magical missions." },
  },
  {
    id: "priest", name: "Priest", icon: "✝️",
    description: "Keeps the party alive. Greatly reduces death chance on failure.",
    passive: { name: "Divine Grace", description: "-60% party death risk. 15% revive chance. +5% success on survival missions." },
  },
  {
    id: "archer", name: "Archer", icon: "🏹",
    description: "Keen-eyed marksman. Good at scouting and ranged combat.",
    passive: { name: "Eagle Eye", description: "+8% success (+13% on outdoor/exploration). Bonus on outdoor/exploration missions." },
  },
  {
    id: "assassin", name: "Assassin", icon: "🗡️",
    description: "Fast and stealthy. Excels at infiltration and high-risk missions.",
    passive: { name: "Cunning", description: "+20% bonus loot on success. Partial loot on failure. +8% success on spying/assassination." },
  },
];

export function getClassMeta(cls: AdventurerClass) {
  return ADVENTURER_CLASSES.find((c) => c.id === cls)!;
}

// ─── Ranks ──────────────────────────────────────────────────────

export type AdventurerRank = 1 | 2 | 3 | 4 | 5;

export const RANK_NAMES: Record<AdventurerRank, string> = {
  1: "Novice",
  2: "Apprentice",
  3: "Journeyman",
  4: "Veteran",
  5: "Elite",
};

export const RANK_COLORS: Record<AdventurerRank, string> = {
  1: "#aaa",
  2: "#7CFC00",
  3: "#3498db",
  4: "#9b59b6",
  5: "#f5c542",
};

// ─── Adventurer type ────────────────────────────────────────────

export interface Adventurer {
  id: string;
  name: string;
  class: AdventurerClass;
  rank: AdventurerRank;
  level: number;
  xp: number;
  alive: boolean;
  onMission: boolean; // true while deployed
  bonusStats: Partial<AdventurerStats>; // player-allocated stat points
  equipment: {
    weapon: string | null;
    armor: string | null;
    trinket: string | null;
  };
}

// ─── Stats ──────────────────────────────────────────────────────

export interface AdventurerStats {
  str: number;
  int: number;
  dex: number;
  vit: number;
  wis: number;
}

export const STAT_KEYS: (keyof AdventurerStats)[] = ["str", "int", "dex", "vit", "wis"];

export const STAT_META: { key: keyof AdventurerStats; name: string; icon: string; color: string; description: string }[] = [
  { key: "str", name: "Strength", icon: "💪", color: "#e74c3c", description: "Combat & escort mission success" },
  { key: "int", name: "Intelligence", icon: "🧠", color: "#3498db", description: "Magical & exploration mission success" },
  { key: "dex", name: "Dexterity", icon: "🏃", color: "#2ecc71", description: "Stealth & outdoor mission success" },
  { key: "vit", name: "Vitality", icon: "❤️", color: "#e67e22", description: "Reduces death chance" },
  { key: "wis", name: "Wisdom", icon: "📖", color: "#9b59b6", description: "Bonus XP from missions" },
];

export const CLASS_BASE_STATS: Record<AdventurerClass, AdventurerStats> = {
  warrior: { str: 6, int: 2, dex: 3, vit: 5, wis: 1 },
  wizard:  { str: 2, int: 7, dex: 2, vit: 3, wis: 4 },
  priest:  { str: 2, int: 5, dex: 2, vit: 5, wis: 5 },
  archer:  { str: 3, int: 2, dex: 7, vit: 3, wis: 2 },
  assassin:{ str: 4, int: 3, dex: 6, vit: 3, wis: 1 },
};

export const CLASS_STAT_GROWTH: Record<AdventurerClass, AdventurerStats> = {
  warrior: { str: 1.5, int: 0.2, dex: 0.5, vit: 1.2, wis: 0.2 },
  wizard:  { str: 0.2, int: 1.8, dex: 0.2, vit: 0.5, wis: 0.8 },
  priest:  { str: 0.2, int: 1.2, dex: 0.2, vit: 1, wis: 1 },
  archer:  { str: 0.5, int: 0.5, dex: 1.5, vit: 0.7, wis: 0.2 },
  assassin:{ str: 1, int: 0.5, dex: 1.5, vit: 0.5, wis: 0.2 },
};

/** Stat points gained per level that player can allocate */
export const STAT_POINTS_PER_LEVEL = 1;

/** Calculate total stats for an adventurer (base + growth + bonus + equipment) */
export function calcStats(adv: Adventurer, equipmentStats?: Partial<AdventurerStats>): AdventurerStats {
  const base = CLASS_BASE_STATS[adv.class];
  const growth = CLASS_STAT_GROWTH[adv.class];
  const bonus = adv.bonusStats;
  const equip = equipmentStats ?? {};
  return {
    str: Math.floor(base.str + growth.str * (adv.level - 1)) + (bonus.str ?? 0) + (equip.str ?? 0),
    int: Math.floor(base.int + growth.int * (adv.level - 1)) + (bonus.int ?? 0) + (equip.int ?? 0),
    dex: Math.floor(base.dex + growth.dex * (adv.level - 1)) + (bonus.dex ?? 0) + (equip.dex ?? 0),
    vit: Math.floor(base.vit + growth.vit * (adv.level - 1)) + (bonus.vit ?? 0) + (equip.vit ?? 0),
    wis: Math.floor(base.wis + growth.wis * (adv.level - 1)) + (bonus.wis ?? 0) + (equip.wis ?? 0),
  };
}

/** Get unspent stat points */
export function getUnspentStatPoints(adv: Adventurer): number {
  const totalEarned = (adv.level - 1) * STAT_POINTS_PER_LEVEL;
  const b = adv.bonusStats;
  const totalSpent = (b.str ?? 0) + (b.int ?? 0) + (b.dex ?? 0) + (b.vit ?? 0) + (b.wis ?? 0);
  return totalEarned - totalSpent;
}

// ─── XP & Leveling ─────────────────────────────────────────────

/** XP needed to reach next level (exponential curve) */
export function getXpForLevel(level: number): number {
  // First levels are fast (15 for lvl 2), ramps up steeply
  return Math.floor(15 * Math.pow(1.5, level - 1));
}

/** Total XP accumulated across all levels */
export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += getXpForLevel(i);
  return total;
}

/** XP gained from a mission */
export function getMissionXp(difficulty: number, success: boolean): number {
  const base = difficulty * 15;
  return success ? base : Math.floor(base * 0.4);
}

/** Rank thresholds — auto rank-up at these levels */
export const RANK_LEVEL_THRESHOLDS: Record<AdventurerRank, number> = {
  1: 1,   // Novice: level 1+
  2: 4,   // Apprentice: level 4+
  3: 8,   // Journeyman: level 8+
  4: 13,  // Veteran: level 13+
  5: 20,  // Elite: level 20+
};

/** Get the rank for a given level */
export function getRankForLevel(level: number): AdventurerRank {
  if (level >= 20) return 5;
  if (level >= 13) return 4;
  if (level >= 8) return 3;
  if (level >= 4) return 2;
  return 1;
}

/** Apply XP to an adventurer — returns { leveled, newRank } for notifications */
export function applyXp(adv: Adventurer, xpGain: number): { leveled: boolean; rankUp: boolean; oldRank: AdventurerRank } {
  const oldRank = adv.rank;
  adv.xp += xpGain;
  let leveled = false;

  while (adv.xp >= getXpForLevel(adv.level)) {
    adv.xp -= getXpForLevel(adv.level);
    adv.level += 1;
    leveled = true;
  }

  adv.rank = getRankForLevel(adv.level);
  return { leveled, rankUp: adv.rank !== oldRank, oldRank };
}

// ─── Name generation ────────────────────────────────────────────

const FIRST_NAMES = [
  "Aldric", "Brenna", "Cedric", "Daria", "Elwin", "Freya", "Gareth", "Hilda",
  "Ivar", "Joanna", "Kael", "Lyra", "Magnus", "Nessa", "Osric", "Petra",
  "Quinlan", "Rowena", "Sigurd", "Thora", "Ulric", "Vara", "Wren", "Ysolde",
  "Zephyr", "Astrid", "Bjorn", "Cora", "Dorian", "Elara", "Finn", "Gwen",
  "Henrik", "Isla", "Jareth", "Kira", "Leif", "Mira", "Nolan", "Oona",
  "Pavel", "Rhea", "Soren", "Talia", "Ulf", "Vanya", "Wulf", "Xara",
];

const LAST_NAMES = [
  "Ashford", "Blackwood", "Coldwell", "Dawnforge", "Emberheart", "Foxglove",
  "Greystone", "Hawkwind", "Ironbark", "Juniper", "Kettleburn", "Larkstone",
  "Moonshadow", "Nighthollow", "Oakshield", "Pinefall", "Quicksilver",
  "Ravenscroft", "Stormveil", "Thornwood", "Underhill", "Valeheart",
  "Wintermere", "Yarrowfield", "Brightwater", "Copperfield", "Dunmere",
  "Eldergrove", "Flamecrest", "Goleli", "Hillcrest", "Ivywood",
];

// Simple seeded random for reproducibility within a session
let adventurerSeed = Date.now();
function seededRandom(): number {
  adventurerSeed = (adventurerSeed * 1664525 + 1013904223) & 0x7fffffff;
  return adventurerSeed / 0x7fffffff;
}

export function resetAdventurerSeed(seed: number) {
  adventurerSeed = seed;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

export function generateName(): string {
  return `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
}

// ─── Recruitment ────────────────────────────────────────────────

/** Gold cost to recruit an adventurer based on their rank */
export function getRecruitCost(rank: AdventurerRank): number {
  const COSTS: Record<AdventurerRank, number> = {
    1: 25,
    2: 75,
    3: 200,
    4: 500,
    5: 1200,
  };
  return COSTS[rank];
}

/** Generate a random adventurer candidate */
export function generateCandidate(id: string, maxRank: AdventurerRank = 2): Adventurer {
  // Higher ranks are rarer
  let rank: AdventurerRank = 1;
  const roll = seededRandom();
  if (maxRank >= 5 && roll > 0.97) rank = 5;
  else if (maxRank >= 4 && roll > 0.90) rank = 4;
  else if (maxRank >= 3 && roll > 0.75) rank = 3;
  else if (maxRank >= 2 && roll > 0.50) rank = 2;

  // Recruits start just below rank threshold — they're fresh at that rank
  const level = Math.max(1, RANK_LEVEL_THRESHOLDS[rank] - 1);
  return {
    id,
    name: generateName(),
    class: randomFrom(ADVENTURER_CLASSES).id,
    rank,
    level,
    xp: 0,
    alive: true,
    onMission: false,
    bonusStats: {},
    equipment: { weapon: null, armor: null, trinket: null },
  };
}

/** Max adventurer rank available — based on guild level AND average top-3 adventurer levels */
export function getMaxRecruitRank(guildLevel: number, adventurers?: Adventurer[]): AdventurerRank {
  // Guild level sets the hard cap
  const guildCap: AdventurerRank = guildLevel >= 5 ? 5 : guildLevel >= 4 ? 4 : guildLevel >= 3 ? 3 : guildLevel >= 2 ? 2 : 1;

  if (!adventurers || adventurers.length === 0) return Math.min(guildCap, 1) as AdventurerRank;

  // Average level of top 3 adventurers determines soft cap
  const sorted = [...adventurers].filter((a) => a.alive).sort((a, b) => b.level - a.level);
  const top3 = sorted.slice(0, 3);
  const avgLevel = top3.reduce((sum, a) => sum + a.level, 0) / top3.length;

  let levelCap: AdventurerRank = 1;
  if (avgLevel >= 16) levelCap = 5;
  else if (avgLevel >= 10) levelCap = 4;
  else if (avgLevel >= 6) levelCap = 3;
  else if (avgLevel >= 3) levelCap = 2;

  return Math.min(guildCap, levelCap) as AdventurerRank;
}

/** Number of recruitment candidates shown per refresh */
export function getCandidateCount(guildLevel: number): number {
  return Math.min(2 + guildLevel, 6); // 3 at Lv1, up to 6
}

/** Max roster size based on guild level */
export function getMaxRoster(guildLevel: number): number {
  return 3 + guildLevel * 2; // 5 at Lv1, 7 at Lv2, ... 13 at Lv5
}

/** Number of simultaneous mission slots */
export function getMissionSlots(guildLevel: number): number {
  // Lv1: 2 slots, Lv2: 3, Lv3: 4, Lv4: 5, Lv5: 6
  return Math.min(guildLevel + 1, 6);
}

// ─── Recruitment refresh interval (game-hours) ──────────────────

export const RECRUIT_REFRESH_HOURS = 6; // ~1 real day with 4-day seasons
export const MISSION_REFRESH_HOURS = 6; // ~1 real day with 4-day seasons
