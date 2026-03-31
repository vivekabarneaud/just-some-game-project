// ─── Adventurer classes ─────────────────────────────────────────

export type AdventurerClass = "warrior" | "mage" | "healer" | "scout" | "ranger";

export const ADVENTURER_CLASSES: {
  id: AdventurerClass;
  name: string;
  icon: string;
  description: string;
}[] = [
  { id: "warrior", name: "Warrior", icon: "⚔️", description: "Frontline fighter. Increases success on combat missions." },
  { id: "mage", name: "Mage", icon: "🔮", description: "Arcane caster. Essential for magical and exploration missions." },
  { id: "healer", name: "Healer", icon: "💚", description: "Keeps the party alive. Greatly reduces death chance on failure." },
  { id: "scout", name: "Scout", icon: "🗺️", description: "Fast and stealthy. Reduces mission duration and boosts gathering." },
  { id: "ranger", name: "Ranger", icon: "🏹", description: "Versatile survivalist. Good all-rounder for any mission." },
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
  alive: boolean;
  onMission: boolean; // true while deployed
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

  return {
    id,
    name: generateName(),
    class: randomFrom(ADVENTURER_CLASSES).id,
    rank,
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
