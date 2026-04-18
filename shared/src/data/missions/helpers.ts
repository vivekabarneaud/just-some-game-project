import type { AdventurerStats, Adventurer } from "../adventurers.js";
import { calcStats } from "../adventurers.js";
import { getEquipmentStats, getSupplyEffect, getFoodEffect, MATCHED_FOOD_HP_BONUS } from "../items.js";
import { getHerb } from "../herbs.js";
import type { MissionReward, MissionTemplate, MissionTag, MissionRequirements, AdventurerMissionSupplies } from "./types.js";
import { NOVICE_MISSIONS } from "./noviceMissions.js";
import { APPRENTICE_MISSIONS } from "./apprenticeMissions.js";
import { JOURNEYMAN_MISSIONS } from "./journeymanMissions.js";
import { EXPERT_MISSIONS } from "./expertMissions.js";
import { STORY_MISSIONS } from "./storyMissions.js";
import { EXPEDITION_POOL } from "./expeditions.js";

const ALL_MISSIONS: MissionTemplate[] = [
  ...NOVICE_MISSIONS,
  ...APPRENTICE_MISSIONS,
  ...JOURNEYMAN_MISSIONS,
  ...EXPERT_MISSIONS,
];

// ─── Reward formatting ─────────────────────────────────────────

const RESOURCE_LABELS: Record<string, { icon: string; name: string }> = {
  gold: { icon: "🪙", name: "Gold" },
  wood: { icon: "🪵", name: "Wood" },
  stone: { icon: "🪨", name: "Stone" },
  food: { icon: "🍖", name: "Food" },
  astralShards: { icon: "💎", name: "Astral Shards" },
};

/** Format a mission reward as "icon amount Name" */
export function formatReward(r: MissionReward): string {
  const herb = getHerb(r.resource);
  if (herb) return `${herb.icon} ${r.amount} ${herb.name}`;
  const info = RESOURCE_LABELS[r.resource];
  if (info) return `${info.icon} ${r.amount} ${info.name}`;
  return `+${r.amount} ${r.resource}`;
}

// ─── Mission lookup ────────────────────────────────────────────

/** Get a mission template by ID (searches regular, story, and expedition pools) */
export function getMission(missionId: string): MissionTemplate | undefined {
  return ALL_MISSIONS.find((m) => m.id === missionId)
    ?? STORY_MISSIONS.find((m) => m.id === missionId)
    ?? EXPEDITION_POOL.find((m) => m.id === missionId);
}

export type MissionRank = "novice" | "apprentice" | "journeyman" | "veteran" | "story" | "expedition";

/**
 * A mission's rank is determined by which pool it lives in, not its `difficulty`
 * field. `difficulty` is the sub-star count (1-3) within a rank.
 *
 * Story missions and expeditions are their own "ranks" for UI purposes even
 * though they overlap in difficulty with the regular pools.
 */
export function getMissionRank(missionId: string): MissionRank | undefined {
  if (NOVICE_MISSIONS.some((m) => m.id === missionId)) return "novice";
  if (APPRENTICE_MISSIONS.some((m) => m.id === missionId)) return "apprentice";
  if (JOURNEYMAN_MISSIONS.some((m) => m.id === missionId)) return "journeyman";
  if (EXPERT_MISSIONS.some((m) => m.id === missionId)) return "veteran";
  if (STORY_MISSIONS.some((m) => m.id === missionId)) return "story";
  if (EXPEDITION_POOL.some((m) => m.id === missionId)) return "expedition";
  return undefined;
}

// ─── Class passive constants ───────────────────────────────────

/** Wizard: reduces mission duration by 10% per wizard */
export const WIZARD_DURATION_REDUCTION = 0.10;
/** Assassin: +20% bonus rewards on success, 30% partial loot on failure */
export const ASSASSIN_LOOT_BONUS = 0.20;
export const ASSASSIN_FAIL_LOOT = 0.30;
/** Priest: 15% chance to revive a fallen ally */
export const PRIEST_REVIVE_CHANCE = 0.15;

// ─── Success calculation ───────────────────────────────────────

/**
 * Get the primary stat(s) for a mission based on its tags.
 */
export function getMissionStatWeights(tags: MissionTag[]): Partial<Record<keyof AdventurerStats, number>> {
  const weights: Partial<Record<keyof AdventurerStats, number>> = {};
  if (tags.some((t) => t === "combat" || t === "escort")) weights.str = (weights.str ?? 0) + 1;
  if (tags.some((t) => t === "magical" || t === "exploration")) weights.int = (weights.int ?? 0) + 1;
  if (tags.some((t) => t === "stealth" || t === "outdoor" || t === "spying" || t === "assassination")) weights.dex = (weights.dex ?? 0) + 1;
  if (tags.some((t) => t === "survival" || t === "dungeon")) {
    weights.str = (weights.str ?? 0) + 0.5;
    weights.vit = (weights.vit ?? 0) + 0.5;
  }
  if (Object.keys(weights).length === 0) {
    weights.str = 0.5; weights.int = 0.5; weights.dex = 0.5;
  }
  return weights;
}

/** Flavor hint telling the player which stat matters for a non-combat mission */
export function getMissionStatHint(tags: MissionTag[]): string {
  const hints: string[] = [];
  if (tags.some((t) => t === "combat" || t === "escort")) hints.push("strength and endurance");
  if (tags.some((t) => t === "magical" || t === "exploration")) hints.push("intelligence and arcane knowledge");
  if (tags.some((t) => t === "stealth" || t === "spying" || t === "assassination")) hints.push("cunning and stealth");
  if (tags.some((t) => t === "outdoor")) hints.push("survival instincts");
  if (tags.some((t) => t === "survival" || t === "dungeon")) hints.push("toughness and resilience");
  if (hints.length === 0) return "Success depends on your team's overall ability.";
  return `This mission requires ${hints.join(" and ")}.`;
}

/**
 * Calculate success chance for non-combat missions.
 * Purely stat-based: team's relevant stats vs difficulty threshold.
 */
export function calcSuccessChance(
  mission: MissionTemplate,
  team: Adventurer[],
  flatStatBonus: number = 0,
  adventurerSupplies?: Record<string, AdventurerMissionSupplies>,
): number {
  if (team.length === 0) return 0;
  if (mission.guaranteed) return 98;

  const statWeights = getMissionStatWeights(mission.tags);

  // Sum the team's weighted stats
  let teamPower = 0;
  for (const adv of team) {
    const equipStats = getEquipmentStats(adv.equipment);
    const stats: AdventurerStats = { ...calcStats(adv, equipStats) };

    // Apply this adventurer's food stat bonus
    const sup = adventurerSupplies?.[adv.id];
    if (sup?.food) {
      const fx = getFoodEffect(sup.food);
      if (fx?.statBonus) stats[fx.statBonus.stat] += fx.statBonus.amount;
    }

    // Apply this adventurer's potion successBonus (flat bonus to their power)
    let personalBonus = 0;
    if (sup?.potion) {
      const eff = getSupplyEffect(sup.potion);
      if (eff) personalBonus += eff.successBonus;
    }

    let advPower = 0;
    let weightSum = 0;
    for (const [stat, weight] of Object.entries(statWeights)) {
      advPower += (stats[stat as keyof AdventurerStats] ?? 0) * (weight ?? 0);
      weightSum += weight ?? 0;
    }
    if (weightSum > 0) teamPower += advPower / weightSum + personalBonus;
  }

  // Legacy flat bonus (still accepted for callers that haven't migrated)
  if (flatStatBonus) teamPower += flatStatBonus;

  // Difficulty threshold: how much weighted stat total is needed
  // Difficulty 1 = 8, difficulty 3 = 24, difficulty 5 = 40
  const threshold = mission.difficulty * 8;

  // Calculate % based on how much the team exceeds (or falls short of) the threshold
  // At threshold = 50%, at 2x threshold = ~95%, at 0.5x = ~15%
  const ratio = teamPower / threshold;
  const pct = Math.round(50 + (ratio - 1) * 40);

  return Math.min(98, Math.max(2, pct));
}

/**
 * Calculate effective mission duration after wizard speed bonus.
 */
export function calcEffectiveDuration(mission: MissionTemplate, team: Adventurer[]): number {
  const wizardCount = team.filter((a) => a.class === "wizard").length;
  const reduction = Math.min(0.45, wizardCount * WIZARD_DURATION_REDUCTION); // cap at 45%
  return Math.floor(mission.duration * (1 - reduction));
}

/** Check if all required slots are satisfied by the team */
export function areRequiredSlotsFilled(mission: MissionTemplate, team: Adventurer[]): boolean {
  const available = [...team];
  for (const slot of mission.slots) {
    if (!slot.required || slot.class === "any") continue;
    const idx = available.findIndex((a) => a.class === slot.class);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

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

// ─── Death chance ──────────────────────────────────────────────

/**
 * On mission failure, each adventurer has a chance to die.
 * Priest passive reduces death chance for the whole party.
 */
export function calcDeathChance(
  mission: MissionTemplate,
  team: Adventurer[],
  adventurer: Adventurer,
  adventurerSupplies?: Record<string, AdventurerMissionSupplies>,
): number {
  // Base death chance: 8% per difficulty level
  let chance = mission.difficulty * 8;

  // VIT reduces death chance: each point of VIT above 10 reduces by 0.8%
  const equipStats = getEquipmentStats(adventurer.equipment);
  const stats = calcStats(adventurer, equipStats);
  chance -= Math.max(0, (stats.vit - 10) * 0.8);

  // Floor: VIT can't reduce below a meaningful threshold
  chance = Math.max(chance, 2 + mission.difficulty * 2);

  // Priest passive: each priest reduces death chance by 60%
  const priestCount = team.filter((a) => a.class === "priest" && a.id !== adventurer.id).length;
  chance *= Math.pow(0.4, priestCount);

  // Priests stay in the back — lower personal risk
  if (adventurer.class === "priest") chance *= 0.5;

  // Survivor trait: -15% death chance
  if (adventurer.trait === "survivor") chance *= 0.85;

  // Personal potion death reduction (e.g., healing potion in this adventurer's slot)
  const sup = adventurerSupplies?.[adventurer.id];
  if (sup?.potion) {
    const eff = getSupplyEffect(sup.potion);
    if (eff) chance *= eff.deathReduction;
  }

  return Math.min(50, Math.max(1, Math.round(chance)));
}

// ─── Mission board generation ──────────────────────────────────

export interface MissionBoardContext {
  guildLevel: number;
  count?: number;
  seed?: number;
  maxDifficulty?: number;
  completedStoryMissions?: string[];
  buildings?: { buildingId: string; level: number }[];
  pens?: { animal: string; level: number }[];
}

/** Check whether a mission's requirements are met */
function meetsRequirements(
  req: MissionRequirements | undefined,
  ctx: MissionBoardContext,
): boolean {
  if (!req) return true;
  if (req.story) {
    const completed = new Set(ctx.completedStoryMissions ?? []);
    if (!completed.has(req.story)) return false;
  }
  if (req.building) {
    const built = ctx.buildings?.some((b) => b.buildingId === req.building && b.level > 0);
    if (!built) return false;
  }
  if (req.pen) {
    const hasPen = ctx.pens?.some((p) => p.animal === req.pen && p.level > 0);
    if (!hasPen) return false;
  }
  return true;
}

/** Pick random missions for the board based on guild level and requirements.
 *  Adds expedition slots on top: +1 expedition every 2 guild levels (lvl 2=1, lvl 4=2, lvl 6=3). */
export function generateMissionBoard(ctx: MissionBoardContext): MissionTemplate[] {
  const { guildLevel, count = 4, seed = Date.now(), maxDifficulty = 5 } = ctx;
  const available = ALL_MISSIONS.filter((m) =>
    m.minGuildLevel <= guildLevel &&
    m.difficulty <= maxDifficulty &&
    meetsRequirements(m.requires, ctx),
  );

  // Seeded shuffle
  let s = seed;
  function rand(): number {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  }

  // Regular missions
  const shuffledRegular = [...available].sort(() => rand() - 0.5);
  const regular = shuffledRegular.slice(0, Math.min(count, available.length));

  // Expeditions: +1 per 2 guild levels
  const expeditionSlots = getExpeditionSlotCount(guildLevel);
  const availableExpeditions = EXPEDITION_POOL.filter((e) =>
    e.minGuildLevel <= guildLevel &&
    e.difficulty <= maxDifficulty &&
    meetsRequirements(e.requires, ctx),
  );
  const shuffledExpeditions = [...availableExpeditions].sort(() => rand() - 0.5);
  const expeditions = shuffledExpeditions.slice(0, Math.min(expeditionSlots, availableExpeditions.length));

  return [...regular, ...expeditions];
}

/** Number of missions shown on board per refresh */
export function getMissionBoardSize(guildLevel: number): number {
  return Math.min(4 + guildLevel, 10); // 5 at Lv1, up to 10
}

/** Number of expedition slots on the board per refresh. +1 every 2 guild levels. */
export function getExpeditionSlotCount(guildLevel: number): number {
  return Math.floor(guildLevel / 2); // 0 at lvl 1, 1 at lvl 2–3, 2 at lvl 4–5, 3 at lvl 6+
}
