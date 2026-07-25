import type { Adventurer } from "@medieval-realm/shared/data/adventurers";
import type { MissionEncounter } from "@medieval-realm/shared/data/missions";
import type { CombatLogEntry, CombatantSnapshot } from "@medieval-realm/shared/data/combat";
import type { SettlementTier } from "./buildings";
import type { PlayerWall, PlayerWatchtower, PlayerBarracks } from "~/engine/gameState";

// ─── Raid tags ──────────────────────────────────────────────────

export type RaidTag = "bandits" | "monsters" | "undead" | "siege" | "horde";

// ─── Raid template ──────────────────────────────────────────────

export interface RaidTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: RaidTag[];
  strength: number; // base attack power (legacy; combat sim will switch to encounters)
  /** Force composition for the combat sim. Same shape as mission encounters
   *  so the existing enemy DB and combat engine carry over directly. */
  encounters: MissionEncounter[];
  /** What the raid targets on success */
  stealsResources: boolean; // takes % of stockpile
  resourceStealPercent: number; // 0-1
  killsCitizens: boolean; // kills citizens
  maxCitizenLoss: number; // max citizens killed
  /** Min settlement tier to trigger */
  minTier: SettlementTier;
  /** Warning time in game-hours (before Watchtower bonus) */
  baseWarning: number;
  /** Loot dropped on victory */
  victoryLoot: { resource: string; amount: number }[];
  /** Optional background image for the invasion panel */
  image?: string;
}

export interface IncomingRaid {
  raidId: string;
  remaining: number; // game-seconds until arrival
  strength: number; // actual strength (scaled)
  warned: boolean; // has the player been warned?
  /** Combat log emitted by simulateRaidCombat once the timer hits 0.
   *  Present → raid resolved, "Watch combat" CTA appears on the threats card. */
  combatLog?: CombatLogEntry[];
  /** Starting-state roster for the combat stage (defenders + raiders at t0). */
  combatRoster?: CombatantSnapshot[];
  /** Sim outcome — true when defenders held. */
  combatVictory?: boolean;
  /** Once the player has watched / dismissed playback, the raid card clears. */
  combatViewed?: boolean;
}

// ─── Raid pool ──────────────────────────────────────────────────

export const RAID_POOL: RaidTemplate[] = [
  // ── Camp-tier raids ───────────────────────────────────────────
  {
    id: "hungry_bandits",
    name: "Hungry Bandits",
    description: "A small group of desperate bandits looking for an easy meal.",
    icon: "🗡️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/hungry_bandits.png",
    tags: ["bandits"],
    strength: 25,
    encounters: [{ enemyId: "bandit_thug", count: 3 }],
    stealsResources: true,
    resourceStealPercent: 0.15,
    killsCitizens: true,
    maxCitizenLoss: 2,
    minTier: "camp",
    baseWarning: 4,
    victoryLoot: [{ resource: "gold", amount: 15 }],
  },
  {
    id: "wolf_pack",
    name: "Wolf Pack",
    description: "A pack of starving wolves has been drawn by the scent of food. They are vicious.",
    icon: "🐺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/wolf_pack.png",
    tags: ["monsters"],
    strength: 20,
    encounters: [{ enemyId: "wild_wolf", count: 2 }, { enemyId: "gaunt_wolf", count: 3 }],
    stealsResources: false,
    resourceStealPercent: 0,
    killsCitizens: true,
    maxCitizenLoss: 4,
    minTier: "camp",
    baseWarning: 3,
    victoryLoot: [{ resource: "meat", amount: 40 }],
  },
  {
    // The "Hold the Treeline" payoff — a lean pack of half-starved wolves testing
    // the new wall. starving_wolf is weak enough that a trained archer two-shots
    // it, so five still read as a pack yet stay winnable by Gareth (+ a Lv1 wall)
    // alone, no hired archers needed. The full wolf_pack (wild + gaunt) stays the
    // bigger later threat.
    id: "gaunt_wolf_pack",
    name: "A Lean Pack",
    description: "A pack of starving wolves has crept up to the treeline, testing the new wall. Thin and wary — but there are several of them, and they are hungry.",
    icon: "🐺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/wolf_pack.png",
    tags: ["monsters"],
    strength: 12,
    encounters: [{ enemyId: "starving_wolf", count: 5 }],
    stealsResources: false,
    resourceStealPercent: 0,
    killsCitizens: false,
    maxCitizenLoss: 0,
    minTier: "camp",
    baseWarning: 3,
    victoryLoot: [{ resource: "meat", amount: 12 }],
  },
  {
    id: "petty_thieves",
    name: "Petty Thieves",
    description: "Sneaky pickpockets try to raid your supply carts under cover of night.",
    icon: "🌙",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/petty_thieves.png",
    tags: ["bandits"],
    strength: 15,
    encounters: [{ enemyId: "bandit_thug", count: 2 }, { enemyId: "goblin_runt", count: 2 }],
    stealsResources: true,
    resourceStealPercent: 0.10,
    killsCitizens: false,
    maxCitizenLoss: 0,
    minTier: "camp",
    baseWarning: 2,
    victoryLoot: [{ resource: "gold", amount: 10 }],
  },

  // ── Village-tier raids ────────────────────────────────────────
  {
    id: "bandit_raid",
    name: "Bandit Raid",
    description: "An organized band of outlaws, armed and dangerous. They want your gold.",
    icon: "🏴",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/bandit_raid.png",
    tags: ["bandits"],
    strength: 60,
    encounters: [{ enemyId: "bandit_thug", count: 4 }, { enemyId: "bandit_captain", count: 1 }],
    stealsResources: true,
    resourceStealPercent: 0.20,
    killsCitizens: true,
    maxCitizenLoss: 5,
    minTier: "village",
    baseWarning: 6,
    victoryLoot: [{ resource: "gold", amount: 50 }, { resource: "wood", amount: 30 }],
  },
  {
    id: "goblin_scouts",
    name: "Goblin Scouts",
    description: "A scouting party of goblins, testing your defenses for a larger force.",
    icon: "👺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/goblin_scouts.png",
    tags: ["monsters"],
    strength: 45,
    encounters: [{ enemyId: "goblin_scout", count: 4 }, { enemyId: "goblin_shaman", count: 1 }],
    stealsResources: true,
    resourceStealPercent: 0.15,
    killsCitizens: true,
    maxCitizenLoss: 3,
    minTier: "village",
    baseWarning: 5,
    victoryLoot: [{ resource: "gold", amount: 30 }, { resource: "stone", amount: 20 }],
  },
  {
    id: "wild_boars",
    name: "Wild Boar Stampede",
    description: "A stampede of wild boars charges through the settlement, trampling everything.",
    icon: "🐗",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/wild_boars.png",
    tags: ["monsters"],
    strength: 35,
    encounters: [{ enemyId: "wild_boar", count: 3 }, { enemyId: "rabid_boar", count: 2 }],
    stealsResources: false,
    resourceStealPercent: 0,
    killsCitizens: true,
    maxCitizenLoss: 6,
    minTier: "village",
    baseWarning: 2,
    victoryLoot: [{ resource: "meat", amount: 80 }],
  },

  // ── Town-tier raids ───────────────────────────────────────────
  {
    id: "skeleton_horde",
    name: "Skeleton Horde",
    description: "The dead rise from a nearby burial ground, marching toward your settlement.",
    icon: "💀",
    tags: ["undead", "horde"],
    strength: 90,
    encounters: [{ enemyId: "skeleton", count: 6 }, { enemyId: "skeleton_archer", count: 3 }, { enemyId: "burnt_skeleton", count: 1 }],
    stealsResources: false,
    resourceStealPercent: 0,
    killsCitizens: true,
    maxCitizenLoss: 10,
    minTier: "town",
    baseWarning: 8,
    victoryLoot: [{ resource: "stone", amount: 60 }, { resource: "gold", amount: 40 }],
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/skeleton_horde.png",
  },
  {
    id: "mercenary_company",
    name: "Mercenary Company",
    description: "A well-equipped mercenary band demands tribute. Pay up or fight.",
    icon: "⚔️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/mercenary_company.png",
    tags: ["bandits", "siege"],
    strength: 100,
    encounters: [{ enemyId: "bandit_thug", count: 4 }, { enemyId: "bandit_captain", count: 2 }, { enemyId: "dark_mage", count: 1 }],
    stealsResources: true,
    resourceStealPercent: 0.25,
    killsCitizens: true,
    maxCitizenLoss: 8,
    minTier: "town",
    baseWarning: 10,
    victoryLoot: [{ resource: "gold", amount: 120 }, { resource: "wood", amount: 50 }],
  },
  {
    id: "troll_attack",
    name: "Troll Attack",
    description: "A massive troll has wandered down from the mountains, hungry and angry.",
    icon: "👹",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/troll_attack.png",
    tags: ["monsters"],
    strength: 80,
    encounters: [{ enemyId: "troll", count: 1 }, { enemyId: "cave_spider", count: 2 }],
    stealsResources: true,
    resourceStealPercent: 0.15,
    killsCitizens: true,
    maxCitizenLoss: 8,
    minTier: "town",
    baseWarning: 6,
    victoryLoot: [{ resource: "meat", amount: 100 }, { resource: "stone", amount: 40 }],
  },

  // ── City-tier raids ───────────────────────────────────────────
  {
    id: "orc_warband",
    name: "Orc Warband",
    description: "A fearsome orc warband, siege engines in tow. They come to conquer.",
    icon: "🔥",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/orc_warband.png",
    tags: ["horde", "siege"],
    strength: 160,
    encounters: [{ enemyId: "gharkal_raider", count: 4 }, { enemyId: "gharkal_warlord", count: 1 }, { enemyId: "goblin_scout", count: 3 }],
    stealsResources: true,
    resourceStealPercent: 0.30,
    killsCitizens: true,
    maxCitizenLoss: 40,
    minTier: "city",
    baseWarning: 12,
    victoryLoot: [{ resource: "gold", amount: 200 }, { resource: "wood", amount: 100 }, { resource: "stone", amount: 100 }],
  },
  {
    id: "necromancer",
    name: "Necromancer's Army",
    description: "A dark wizard raises an army of undead to siege your city walls.",
    icon: "🧙‍♂️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/necromancer.png",
    tags: ["undead", "horde", "siege"],
    strength: 180,
    encounters: [{ enemyId: "skeleton", count: 6 }, { enemyId: "skeleton_archer", count: 3 }, { enemyId: "necromancer_acolyte", count: 2 }, { enemyId: "lich_apprentice", count: 1 }],
    stealsResources: true,
    resourceStealPercent: 0.25,
    killsCitizens: true,
    maxCitizenLoss: 50,
    minTier: "city",
    baseWarning: 14,
    victoryLoot: [{ resource: "gold", amount: 250 }, { resource: "astralShards", amount: 5 }],
  },
  {
    id: "dragon_attack",
    name: "Dragon Attack",
    description: "A wild dragon descends from the sky, raining fire. Only a dragon of your own can truly stop it.",
    icon: "🐉",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/raids/dragon_attack.png",
    tags: ["monsters"],
    strength: 120,
    encounters: [{ enemyId: "feral_drake", count: 1 }, { enemyId: "dragon_hatchling", count: 2 }],
    stealsResources: true,
    resourceStealPercent: 0.25,
    killsCitizens: true,
    maxCitizenLoss: 20,
    minTier: "city",
    baseWarning: 8,
    victoryLoot: [{ resource: "gold", amount: 300 }, { resource: "wheat", amount: 150 }, { resource: "astralShards", amount: 8 }],
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
 * - Militia: 2 per uncommitted adult (pitchforks at the outer wall)
 *
 * The "population" field on the breakdown is actually the militia value —
 * kept under the same name so the Overview UI keeps working without label
 * gymnastics. The label in the UI now reads as "Militia" or similar; pass
 * militiaCount (not total population) when calling.
 */
export function calcDefense(
  walls: PlayerWall[],
  watchtowers: PlayerWatchtower[],
  barracks: PlayerBarracks[],
  adventurers: Adventurer[],
  militiaCount: number,
): DefenseBreakdown {
  // Sum levels across all rings. Walls with hp <= 0 (breached/unbuilt) and
  // damaged towers/barracks contribute zero. Existing per-level multipliers
  // (12/8/15) preserved for backward compatibility — a Lv.3 outer wall
  // matches the old single-instance Lv.3 wall, then Middle/Inner add on top.
  const wallsLvl = walls
    .filter((w) => w.hp > 0)
    .reduce((sum, w) => sum + w.level, 0);
  const watchtowerLvl = watchtowers
    .filter((t) => !t.damaged)
    .reduce((sum, t) => sum + t.level, 0);
  const barracksLvl = barracks
    .filter((b) => !b.damaged)
    .reduce((sum, b) => sum + b.level, 0);

  const homeAdventurers = adventurers.filter((a) => a.alive && !a.onMission);
  // Adventurers give a small bonus — buildings are the main defense
  const adventurerDef = homeAdventurers.reduce((sum, a) => sum + 1 + Math.floor(a.level / 3), 0);

  // Per-level multipliers preserved from the old single-instance model.
  const watchtowerDef = watchtowerLvl * 8;
  const barracksDef = barracksLvl * 15;
  const wallsDef = wallsLvl * 12;
  // Militia value: 2 per uncommitted adult. Rough estimator of their
  // contribution; the real sim consumes the actual militiaCount.
  const popDef = militiaCount * 2;

  return {
    total: watchtowerDef + barracksDef + wallsDef + adventurerDef + popDef,
    watchtower: watchtowerDef,
    barracks: barracksDef,
    walls: wallsDef,
    adventurers: adventurerDef,
    population: popDef,
  };
}

/**
 * Watchtower extends warning time: +2 hours per level.
 */
export function calcWarningTime(baseWarning: number, watchtowerLevel: number): number {
  return baseWarning + watchtowerLevel * 2;
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
  // Scale strength: +20% per year
  const yearBonus = 1 + (year - 1) * 0.20;
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

// ─── Defense tips ───────────────────────────────────────────────

export interface DefenseTip {
  icon: string;
  text: string;
  actionLink?: string; // optional link to a page
}

export function getDefenseTips(
  successPct: number,
  walls: PlayerWall[],
  watchtowers: PlayerWatchtower[],
  barracks: PlayerBarracks[],
  adventurersOnMission: number,
): DefenseTip[] {
  const tips: DefenseTip[] = [];

  if (successPct >= 85) {
    tips.push({ icon: "✅", text: `Strong position (${successPct}% chance). But nothing is guaranteed — fortify further.` });
  } else if (successPct >= 60) {
    tips.push({ icon: "⚠️", text: `Decent odds (${successPct}% chance) but risky. Strengthen your defenses.` });
  } else if (successPct >= 40) {
    tips.push({ icon: "🔶", text: `Dangerous (${successPct}% chance). You need more defense or this will hurt.` });
  } else {
    tips.push({ icon: "🔴", text: `Desperate situation (${successPct}% chance). Prepare for heavy losses.` });
  }

  // Adventurers on mission
  if (adventurersOnMission > 0) {
    tips.push({
      icon: "🏰",
      text: `${adventurersOnMission} adventurer${adventurersOnMission > 1 ? "s" : ""} on missions — recall them for extra defense!`,
    });
  }

  // Walls — total level across all rings. Breached walls (hp <= 0) excluded.
  const wallsLvl = walls.filter((w) => w.hp > 0).reduce((s, w) => s + w.level, 0);
  if (wallsLvl === 0) {
    tips.push({ icon: "🧱", text: "Build a Wall to soak the assault.", actionLink: "/defenses" });
  } else if (successPct < 85) {
    tips.push({ icon: "🧱", text: `Reinforce your Walls (Lv.${wallsLvl} total) for more HP under siege.`, actionLink: "/defenses" });
  }

  // Barracks — total level across all rings. Damaged excluded. Only nudged when
  // the odds are actually shaky: the watchtower captain + archers already fight,
  // so a barracks is reinforcement, not a prerequisite.
  const barracksLvl = barracks.filter((b) => !b.damaged).reduce((s, b) => s + b.level, 0);
  if (successPct < 60) {
    if (barracksLvl === 0) {
      tips.push({ icon: "⚔️", text: "Build a Barracks — soldiers hold the line when the wall breaks.", actionLink: "/defenses" });
    } else {
      tips.push({ icon: "⚔️", text: `Recruit more Soldiers at the Barracks (Lv.${barracksLvl} total).`, actionLink: "/defenses" });
    }
  }

  // Watchtower — any tower at all gives early warnings.
  const wtMaxLvl = watchtowers.filter((t) => !t.damaged).reduce((m, t) => Math.max(m, t.level), 0);
  if (wtMaxLvl === 0) {
    tips.push({ icon: "🏰", text: "Build a Watchtower for defense and earlier raid warnings.", actionLink: "/defenses" });
  }

  if (tips.length === 0) {
    tips.push({ icon: "⚠️", text: "Brace for impact — do what you can to strengthen defenses!" });
  }

  return tips;
}
