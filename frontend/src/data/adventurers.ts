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
}

// ─── XP & Leveling ─────────────────────────────────────────────

/** XP needed to reach next level (exponential curve) */
export function getXpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.4, level - 1));
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
  const BASE = 20;
  return Math.floor(BASE * Math.pow(2, rank - 1)); // 20, 40, 80, 160, 320
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

  // Set starting level to the rank threshold so recruited adventurers match their rank
  const level = RANK_LEVEL_THRESHOLDS[rank];
  return {
    id,
    name: generateName(),
    class: randomFrom(ADVENTURER_CLASSES).id,
    rank,
    level,
    xp: 0,
    alive: true,
    onMission: false,
  };
}

/** Max adventurer rank available based on guild level */
export function getMaxRecruitRank(guildLevel: number): AdventurerRank {
  if (guildLevel >= 5) return 5;
  if (guildLevel >= 4) return 4;
  if (guildLevel >= 3) return 3;
  if (guildLevel >= 2) return 2;
  return 1;
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
  return Math.min(1 + Math.floor(guildLevel / 1), 5); // 1 at Lv0 (not built), 2 at Lv1, ... 6 at Lv5
}

// ─── Recruitment refresh interval (game-hours) ──────────────────

export const RECRUIT_REFRESH_HOURS = 24; // 1 game-day
export const MISSION_REFRESH_HOURS = 24; // 1 game-day
