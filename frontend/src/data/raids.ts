import type { Adventurer } from "./adventurers";
import type { PlayerBuilding } from "./buildings";
import type { SettlementTier } from "./buildings";

// ─── Raid tags ──────────────────────────────────────────────────

export type RaidTag = "bandits" | "monsters" | "undead" | "siege" | "horde";

// ─── Raid template ──────────────────────────────────────────────

export interface RaidTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: RaidTag[];
  strength: number; // base attack power
  /** What the raid targets on success */
  stealsResources: boolean; // takes % of stockpile
  resourceStealPercent: number; // 0-1
  killsCitizens: boolean; // kills citizens
  maxCitizenLoss: number; // max citizens killed
  /** Min settlement tier to trigger */
  minTier: SettlementTier;
  /** Warning time in game-hours (before Watchtower bonus) */
  baseWarning: number;
}

export interface IncomingRaid {
  raidId: string;
  remaining: number; // game-seconds until arrival
  strength: number; // actual strength (scaled)
  warned: boolean; // has the player been warned?
}

export interface RaidResult {
  raidId: string;
  victory: boolean;
  defenseScore: number;
  raidStrength: number;
  resourcesLost: { gold: number; wood: number; stone: number; food: number };
  citizensLost: number;
  defendersInjured: string[]; // adventurer names that got hurt
}

// ─── Raid pool ──────────────────────────────────────────────────

export const RAID_POOL: RaidTemplate[] = [
  // ── Camp-tier raids (easy, bandits) ───────────────────────────
  {
    id: "hungry_bandits",
    name: "Hungry Bandits",
    description: "A small group of desperate bandits looking for an easy meal.",
    icon: "🗡️",
    tags: ["bandits"],
    strength: 10,
    stealsResources: true,
    resourceStealPercent: 0.05,
    killsCitizens: false,
    maxCitizenLoss: 0,
    minTier: "camp",
    baseWarning: 4,
  },
  {
    id: "wolf_pack",
    name: "Wolf Pack",
    description: "A pack of starving wolves has been drawn by the scent of food.",
    icon: "🐺",
    tags: ["monsters"],
    strength: 8,
    stealsResources: false,
    resourceStealPercent: 0,
    killsCitizens: true,
    maxCitizenLoss: 2,
    minTier: "camp",
    baseWarning: 3,
  },
  {
    id: "petty_thieves",
    name: "Petty Thieves",
    description: "Sneaky pickpockets try to raid your supply carts under cover of night.",
    icon: "🌙",
    tags: ["bandits"],
    strength: 6,
    stealsResources: true,
    resourceStealPercent: 0.03,
    killsCitizens: false,
    maxCitizenLoss: 0,
    minTier: "camp",
    baseWarning: 2,
  },

  // ── Village-tier raids ────────────────────────────────────────
  {
    id: "bandit_raid",
    name: "Bandit Raid",
    description: "An organized band of outlaws, armed and dangerous. They want your gold.",
    icon: "🏴",
    tags: ["bandits"],
    strength: 25,
    stealsResources: true,
    resourceStealPercent: 0.10,
    killsCitizens: true,
    maxCitizenLoss: 3,
    minTier: "village",
    baseWarning: 6,
  },
  {
    id: "goblin_scouts",
    name: "Goblin Scouts",
    description: "A scouting party of goblins, testing your defenses for a larger force.",
    icon: "👺",
    tags: ["monsters"],
    strength: 20,
    stealsResources: true,
    resourceStealPercent: 0.05,
    killsCitizens: true,
    maxCitizenLoss: 2,
    minTier: "village",
    baseWarning: 5,
  },
  {
    id: "wild_boars",
    name: "Wild Boar Stampede",
    description: "A stampede of wild boars charges through the settlement, trampling everything.",
    icon: "🐗",
    tags: ["monsters"],
    strength: 15,
    stealsResources: false,
    resourceStealPercent: 0,
    killsCitizens: true,
    maxCitizenLoss: 4,
    minTier: "village",
    baseWarning: 2,
  },

  // ── Town-tier raids ───────────────────────────────────────────
  {
    id: "skeleton_horde",
    name: "Skeleton Horde",
    description: "The dead rise from a nearby burial ground, marching toward your settlement.",
    icon: "💀",
    tags: ["undead", "horde"],
    strength: 45,
    stealsResources: false,
    resourceStealPercent: 0,
    killsCitizens: true,
    maxCitizenLoss: 8,
    minTier: "town",
    baseWarning: 8,
  },
  {
    id: "mercenary_company",
    name: "Mercenary Company",
    description: "A well-equipped mercenary band demands tribute. Pay up or fight.",
    icon: "⚔️",
    tags: ["bandits", "siege"],
    strength: 50,
    stealsResources: true,
    resourceStealPercent: 0.15,
    killsCitizens: true,
    maxCitizenLoss: 5,
    minTier: "town",
    baseWarning: 10,
  },
  {
    id: "troll_attack",
    name: "Troll Attack",
    description: "A massive troll has wandered down from the mountains, hungry and angry.",
    icon: "👹",
    tags: ["monsters"],
    strength: 40,
    stealsResources: true,
    resourceStealPercent: 0.08,
    killsCitizens: true,
    maxCitizenLoss: 6,
    minTier: "town",
    baseWarning: 6,
  },

  // ── City-tier raids ───────────────────────────────────────────
  {
    id: "orc_warband",
    name: "Orc Warband",
    description: "A fearsome orc warband, siege engines in tow. They come to conquer.",
    icon: "🔥",
    tags: ["horde", "siege"],
    strength: 80,
    stealsResources: true,
    resourceStealPercent: 0.20,
    killsCitizens: true,
    maxCitizenLoss: 12,
    minTier: "city",
    baseWarning: 12,
  },
  {
    id: "necromancer",
    name: "Necromancer's Army",
    description: "A dark wizard raises an army of undead to siege your city walls.",
    icon: "🧙‍♂️",
    tags: ["undead", "horde", "siege"],
    strength: 90,
    stealsResources: true,
    resourceStealPercent: 0.15,
    killsCitizens: true,
    maxCitizenLoss: 15,
    minTier: "city",
    baseWarning: 14,
  },
  {
    id: "dragon_attack",
    name: "Dragon Attack",
    description: "A wild dragon descends from the sky, raining fire. Only a dragon of your own can truly stop it.",
    icon: "🐉",
    tags: ["monsters"],
    strength: 120,
    stealsResources: true,
    resourceStealPercent: 0.25,
    killsCitizens: true,
    maxCitizenLoss: 20,
    minTier: "city",
    baseWarning: 8,
  },
];

// ─── Defense calculation ────────────────────────────────────────

export interface DefenseBreakdown {
  total: number;
  watchtower: number;
  barracks: number;
  walls: number;
  adventurers: number;
  population: number;
}

/**
 * Calculate total defense score.
 * - Watchtower: 5 per level (also extends warning time)
 * - Barracks: 12 per level (main military building)
 * - Walls: 8 per level (passive defense)
 * - Adventurers at home: level * 2 each
 * - Population: 0.5 per citizen (they help defend)
 */
export function calcDefense(
  buildings: PlayerBuilding[],
  adventurers: Adventurer[],
  population: number,
): DefenseBreakdown {
  const watchtowerLvl = buildings.find((b) => b.buildingId === "watchtower")?.level ?? 0;
  const barracksLvl = buildings.find((b) => b.buildingId === "barracks")?.level ?? 0;
  const wallsLvl = buildings.find((b) => b.buildingId === "walls")?.level ?? 0;

  const homeAdventurers = adventurers.filter((a) => a.alive && !a.onMission);
  const adventurerDef = homeAdventurers.reduce((sum, a) => sum + a.level * 2, 0);

  const watchtower = watchtowerLvl * 5;
  const barracks = barracksLvl * 12;
  const walls = wallsLvl * 8;
  const pop = Math.floor(population * 0.5);

  return {
    total: watchtower + barracks + walls + adventurerDef + pop,
    watchtower,
    barracks,
    walls,
    adventurers: adventurerDef,
    population: pop,
  };
}

/**
 * Watchtower extends warning time: +2 hours per level.
 */
export function calcWarningTime(baseWarning: number, watchtowerLevel: number): number {
  return baseWarning + watchtowerLevel * 2;
}

// ─── Raid resolution ────────────────────────────────────────────

export interface RaidResolutionInput {
  raid: RaidTemplate;
  raidStrength: number;
  defense: DefenseBreakdown;
  resources: { gold: number; wood: number; stone: number; food: number };
  population: number;
  homeAdventurers: Adventurer[];
}

export function resolveRaid(input: RaidResolutionInput): RaidResult {
  const { raid, raidStrength, defense, resources, population, homeAdventurers } = input;
  const victory = defense.total >= raidStrength;

  const result: RaidResult = {
    raidId: raid.id,
    victory,
    defenseScore: defense.total,
    raidStrength,
    resourcesLost: { gold: 0, wood: 0, stone: 0, food: 0 },
    citizensLost: 0,
    defendersInjured: [],
  };

  if (victory) {
    // Won! Minor adventurer injury chance (10%)
    for (const adv of homeAdventurers) {
      if (Math.random() < 0.10) {
        result.defendersInjured.push(adv.name);
      }
    }
    return result;
  }

  // Lost — calculate damage
  const overpower = Math.min(1, (raidStrength - defense.total) / raidStrength);

  if (raid.stealsResources) {
    const stealPct = raid.resourceStealPercent * (0.5 + overpower * 0.5);
    result.resourcesLost = {
      gold: Math.floor(resources.gold * stealPct),
      wood: Math.floor(resources.wood * stealPct),
      stone: Math.floor(resources.stone * stealPct),
      food: Math.floor(resources.food * stealPct),
    };
  }

  if (raid.killsCitizens) {
    const maxLoss = Math.min(raid.maxCitizenLoss, Math.floor(population * 0.3));
    result.citizensLost = Math.floor(maxLoss * overpower);
  }

  // Defending adventurers have a 20% injury chance on loss
  for (const adv of homeAdventurers) {
    if (Math.random() < 0.20) {
      result.defendersInjured.push(adv.name);
    }
  }

  return result;
}

// ─── Raid spawning ──────────────────────────────────────────────

const TIER_ORDER: SettlementTier[] = ["camp", "village", "town", "city"];

/**
 * Get available raids for current tier.
 */
export function getAvailableRaids(tier: SettlementTier): RaidTemplate[] {
  const tierIdx = TIER_ORDER.indexOf(tier);
  return RAID_POOL.filter((r) => TIER_ORDER.indexOf(r.minTier) <= tierIdx);
}

/**
 * Pick a random raid for the current tier, with strength scaling.
 * Strength scales up over time (year) for progression.
 */
export function spawnRaid(tier: SettlementTier, year: number): { raid: RaidTemplate; strength: number } | null {
  const available = getAvailableRaids(tier);
  if (available.length === 0) return null;

  const raid = available[Math.floor(Math.random() * available.length)];
  // Scale strength: +10% per year
  const yearBonus = 1 + (year - 1) * 0.10;
  const strength = Math.floor(raid.strength * yearBonus);

  return { raid, strength };
}

/**
 * Chance per game-hour that a raid spawns.
 * Increases the longer it's been since the last raid (hoursSinceLast).
 * Returns 0-1.
 */
export function getRaidChance(tier: SettlementTier, hoursSinceLast: number): number {
  // Minimum hours before any chance (grace period)
  const grace: Record<SettlementTier, number> = {
    camp: 48,
    village: 36,
    town: 24,
    city: 16,
  };
  if (hoursSinceLast < grace[tier]) return 0;

  // After grace, chance ramps up. By 2x the grace period, it's very likely.
  const elapsed = hoursSinceLast - grace[tier];
  const rampHours: Record<SettlementTier, number> = {
    camp: 48,    // ramps over 48h after grace
    village: 36,
    town: 24,
    city: 16,
  };
  // Chance per hour: starts near 0, reaches ~8% per hour at full ramp
  const ramp = Math.min(1, elapsed / rampHours[tier]);
  return ramp * 0.08;
}

export function getRaid(raidId: string): RaidTemplate | undefined {
  return RAID_POOL.find((r) => r.id === raidId);
}

// ─── Success chance ─────────────────────────────────────────────

/**
 * Calculate defense success chance as a percentage.
 * 100% when defense >= strength. Drops off below that.
 */
export function calcRaidSuccessChance(defenseTotal: number, raidStrength: number): number {
  if (raidStrength <= 0) return 100;
  const ratio = defenseTotal / raidStrength;
  if (ratio >= 1) return 100;
  // Smooth curve: 50% at half strength, drops sharply below
  return Math.max(0, Math.min(99, Math.round(ratio * ratio * 100)));
}

// ─── Defense tips ───────────────────────────────────────────────

export interface DefenseTip {
  icon: string;
  text: string;
  actionLink?: string; // optional link to a page
}

export function getDefenseTips(
  defense: DefenseBreakdown,
  raidStrength: number,
  buildings: PlayerBuilding[],
  adventurersOnMission: number,
): DefenseTip[] {
  const tips: DefenseTip[] = [];
  const gap = raidStrength - defense.total;

  if (gap <= 0) {
    tips.push({ icon: "✅", text: "Your defenses are strong enough. Hold the line!" });
    return tips;
  }

  // Adventurers on mission
  if (adventurersOnMission > 0) {
    tips.push({
      icon: "🏰",
      text: `${adventurersOnMission} adventurer${adventurersOnMission > 1 ? "s" : ""} on missions — recall them for extra defense!`,
    });
  }

  // Walls
  const wallsLvl = buildings.find((b) => b.buildingId === "walls")?.level ?? 0;
  if (wallsLvl === 0) {
    tips.push({ icon: "🧱", text: "Build Walls for +8 defense per level.", actionLink: "/buildings/walls" });
  } else if (gap > 8) {
    tips.push({ icon: "🧱", text: `Upgrade Walls (Lv.${wallsLvl}) for more defense.`, actionLink: "/buildings/walls" });
  }

  // Barracks
  const barracksLvl = buildings.find((b) => b.buildingId === "barracks")?.level ?? 0;
  if (barracksLvl === 0) {
    tips.push({ icon: "⚔️", text: "Build Barracks for +12 defense per level.", actionLink: "/buildings/barracks" });
  } else if (gap > 12) {
    tips.push({ icon: "⚔️", text: `Upgrade Barracks (Lv.${barracksLvl}) for +12 defense.`, actionLink: "/buildings/barracks" });
  }

  // Watchtower
  const wtLvl = buildings.find((b) => b.buildingId === "watchtower")?.level ?? 0;
  if (wtLvl === 0) {
    tips.push({ icon: "🏰", text: "Build a Watchtower for defense and earlier raid warnings.", actionLink: "/buildings/watchtower" });
  }

  if (tips.length === 0) {
    tips.push({ icon: "⚠️", text: "Brace for impact — do what you can to strengthen defenses!" });
  }

  return tips;
}
