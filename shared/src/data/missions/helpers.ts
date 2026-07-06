import type { AdventurerStats, Adventurer } from "../adventurers.js";
import { calcStats } from "../adventurers.js";
import { getEquipmentStats, getSupplyEffect, getFoodEffect, MATCHED_FOOD_HP_BONUS, getMaterial, getItem } from "../items/index.js";
import { getHerb } from "../herbs.js";
import type { MissionReward, MissionTemplate, MissionTag, MissionRequirements, AdventurerMissionSupplies } from "./types.js";
import { NOVICE_MISSIONS } from "./noviceMissions.js";
import { APPRENTICE_MISSIONS } from "./apprenticeMissions.js";
import { JOURNEYMAN_MISSIONS } from "./journeymanMissions.js";
import { EXPERT_MISSIONS } from "./expertMissions.js";
import { STORY_MISSIONS } from "./storyMissions.js";
import { EXPEDITION_POOL } from "./expeditions.js";
import { STAGED_MISSIONS } from "./stagedMissions.js";
import { SIDE_CHAIN_MISSIONS } from "./sideChainMissions.js";

/** Pool used for the natural mission-board rotation AND for getMission lookup.
 *  When engine-test stubs need to live alongside real missions again, split
 *  this back into a ROTATION_POOL (rotation only) + ALL_MISSIONS (lookup). */
const ALL_MISSIONS: MissionTemplate[] = [
  ...NOVICE_MISSIONS,
  ...APPRENTICE_MISSIONS,
  ...JOURNEYMAN_MISSIONS,
  ...EXPERT_MISSIONS,
  // Side-story chains: rank-neutral (getMissionRank returns undefined), so the
  // board quota treats them like story/expedition content — always eligible
  // when their gates open, balanced by their own difficulty, never tier-filed.
  ...SIDE_CHAIN_MISSIONS,
  // Staged placeholders: included for getMission() lookup only (a save with one
  // mid-flight still resolves). generateMissionBoard filters out `staged`.
  ...STAGED_MISSIONS,
];

// ─── Reward formatting ─────────────────────────────────────────

const RESOURCE_LABELS: Record<string, { icon: string; name: string }> = {
  gold: { icon: "🪙", name: "Gold" },
  wood: { icon: "🪵", name: "Wood" },
  stone: { icon: "🪨", name: "Stone" },
  food: { icon: "🍖", name: "Food" },
  wool: { icon: "🐑", name: "Wool" },
  fiber: { icon: "🪻", name: "Fiber" },
  leather: { icon: "🐄", name: "Leather" },
  iron: { icon: "⚒️", name: "Iron" },
  honey: { icon: "🍯", name: "Honey" },
  astralShards: { icon: "💎", name: "Astral Shards" },
};

const FOOD_ITEM_LABELS: Record<string, { icon: string; name: string }> = {
  wheat: { icon: "🌾", name: "Wheat" },
  barley: { icon: "🌿", name: "Barley" },
  cabbages: { icon: "🥬", name: "Cabbages" },
  turnips: { icon: "🥕", name: "Turnips" },
  peas: { icon: "🫛", name: "Peas" },
  squash: { icon: "🎃", name: "Squash" },
  apples: { icon: "🍎", name: "Apples" },
  pears: { icon: "🍐", name: "Pears" },
  cherries: { icon: "🍒", name: "Cherries" },
  meat: { icon: "🍖", name: "Meat" },
  eggs: { icon: "🥚", name: "Eggs" },
  milk: { icon: "🥛", name: "Milk" },
  fish: { icon: "🐟", name: "Fish" },
  berries: { icon: "🫐", name: "Berries" },
  mushrooms: { icon: "🍄", name: "Mushrooms" },
  nuts: { icon: "🌰", name: "Nuts" },
};

/** Format a mission reward as "icon amount Name" */
export function formatReward(r: MissionReward): string {
  const herb = getHerb(r.resource);
  if (herb) return `${herb.icon} ${r.amount} ${herb.name}`;
  const info = RESOURCE_LABELS[r.resource];
  if (info) return `${info.icon} ${r.amount} ${info.name}`;
  const food = FOOD_ITEM_LABELS[r.resource];
  if (food) return `${food.icon} ${r.amount} ${food.name}`;
  const material = getMaterial(r.resource);
  if (material) return `${material.icon} ${r.amount} ${material.name}`;
  const item = getItem(r.resource);
  if (item) return `${item.icon} ${r.amount} ${item.name}`;
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
  // Death is a COMBAT outcome. Missions with no encounters carry only a light
  // "wilderness mishap" risk that starts at ZERO for difficulty 1 (a safe
  // errand like herb gathering must not threaten a permanent death) and scales
  // up for riskier no-combat jobs. Encounter missions use the full 8%/difficulty.
  const noEncounters = !mission.encounters?.length;
  const hasOverride = typeof mission.deathRisk === "number";
  let chance = hasOverride
    ? mission.deathRisk!
    : noEncounters ? Math.max(0, (mission.difficulty - 1) * 4) : mission.difficulty * 8;

  // VIT reduces death chance: each point of VIT above 10 reduces by 0.8%
  const equipStats = getEquipmentStats(adventurer.equipment);
  const stats = calcStats(adventurer, equipStats);
  chance -= Math.max(0, (stats.vit - 10) * 0.8);

  // Floor: encounter missions keep a meaningful minimum VIT can't erase. An
  // explicit override or a no-encounter mission may legitimately reach 0.
  chance = (hasOverride || noEncounters)
    ? Math.max(chance, 0)
    : Math.max(chance, 2 + mission.difficulty * 2);

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

/**
 * Resolve permadeath for a finished combat. Single source of truth for both
 * the actual deploy-time roll and the team-assembly preview's Monte Carlo.
 *
 * Inputs: who fell during combat (HP ≤ 0), the team, the mission, supplies.
 * Output: ids that permanently died (Pantheon entries) and ids whose roll
 * was undone by a priest revive (loot-modal "X was revived" line).
 *
 * Roll order:
 *   1. Per-fallen death roll: `Math.random() * 100 < calcDeathChance × 1.5`.
 *   2. Warrior Shield Wall — soaks one ally death; 50% chance the warrior
 *      dies in their place.
 *   3. Priest Divine Grace — each non-dead priest gets one revive attempt
 *      per remaining death, at PRIEST_REVIVE_CHANCE.
 *
 * Uses Math.random() (not the seeded combat PRNG), so callers running this
 * inside a Monte-Carlo loop get fresh variance per iteration.
 */
export interface PermadeathResult {
  /** Adventurer ids that permanently died (Pantheon entries). */
  dead: string[];
  /** Adventurer ids whose death roll was undone by a priest's revive. */
  revived: string[];
}

export function rollPermanentDeaths(
  fallenAdventurerIds: string[],
  team: Adventurer[],
  mission: MissionTemplate,
  adventurerSupplies?: Record<string, AdventurerMissionSupplies>,
): PermadeathResult {
  // No-encounter missions (herb_gathering, tavern_intel, smuggler_deal):
  // every adventurer rolls at baseline (no fall gating, no 1.5× multiplier
  // because nobody actually collapsed in combat). Encounter missions: only
  // those who fell are at risk, multiplied by 1.5×.
  const noEncounters = !mission.encounters?.length;
  const fallenSet = new Set(fallenAdventurerIds);
  const deadIds: string[] = [];
  for (const adv of team) {
    if (!noEncounters && !fallenSet.has(adv.id)) continue;
    const baseChance = calcDeathChance(mission, team, adv, adventurerSupplies);
    const chance = noEncounters ? baseChance : baseChance * 1.5;
    if (Math.random() * 100 < chance) deadIds.push(adv.id);
  }
  // Warrior Shield Wall: soak one death, 50% the warrior dies in their place.
  const warriors = team.filter((a) => a.class === "warrior" && !deadIds.includes(a.id));
  for (const warrior of warriors) {
    const protectable = deadIds.filter((id) => id !== warrior.id);
    if (protectable.length > 0) {
      const savedId = protectable[0];
      deadIds.splice(deadIds.indexOf(savedId), 1);
      if (Math.random() > 0.5) deadIds.push(warrior.id);
      break;
    }
  }
  // Priest Divine Grace: per-priest revive roll on each remaining death.
  const priests = team.filter((a) => a.class === "priest" && !deadIds.includes(a.id));
  const revived: string[] = [];
  for (const deadId of [...deadIds]) {
    for (const _priest of priests) {
      if (Math.random() < PRIEST_REVIVE_CHANCE) {
        deadIds.splice(deadIds.indexOf(deadId), 1);
        revived.push(deadId);
        break;
      }
    }
  }
  return { dead: deadIds, revived };
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
  /** Alive adventurers' ranks (1-5). Drives the rank-floor + below-reference
   *  quota so a senior team isn't drowning in novice missions. Optional —
   *  when missing or empty, board generation behaves as before (no quota). */
  adventurerRanks?: number[];
  /** Ids of one-time (`unique`) missions already completed. They're filtered
   *  out so a resolved personal/narrative beat never returns to the board. */
  completedUniqueMissionIds?: string[];
  /** Current tavern reputation (0-100). Gates "the haven draws the hunted"
   *  arrivals (e.g. A Mother's Errand) behind a settlement that's become known. */
  tavernReputation?: number;
  /** Durable per-mission success counts (never cleared). Gates count-based
   *  requirements, e.g. "appears after 3 fen barters." */
  missionCompletions?: Record<string, number>;
  /** Classes of alive adventurers on the roster. Gates `hasClass` requirements
   *  so a mission that NEEDS a class (e.g. a priest for ghosts) doesn't surface
   *  before that class exists. */
  rosterClasses?: string[];
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
  if (req.buildings) {
    const allBuilt = req.buildings.every((id) => ctx.buildings?.some((b) => b.buildingId === id && b.level > 0));
    if (!allBuilt) return false;
  }
  if (req.pen) {
    const hasPen = ctx.pens?.some((p) => p.animal === req.pen && p.level > 0);
    if (!hasPen) return false;
  }
  if (req.missionDone) {
    const done = new Set(ctx.completedUniqueMissionIds ?? []);
    if (!done.has(req.missionDone)) return false;
  }
  if (req.tavernReputation && (ctx.tavernReputation ?? 0) < req.tavernReputation) return false;
  if (req.missionCount && (ctx.missionCompletions?.[req.missionCount.id] ?? 0) < req.missionCount.count) return false;
  if (req.hasClass && !(ctx.rosterClasses ?? []).includes(req.hasClass)) return false;
  return true;
}

/** Pick random missions for the board based on guild level and requirements.
 *  Adds expedition slots on top: +1 expedition every 2 guild levels (lvl 2=1, lvl 4=2, lvl 6=3). */
/** Numeric rank of a mission for quota purposes — only the four standard
 *  pools are ranked (story + expedition are handled separately). */
function missionRankNumeric(missionId: string): number | null {
  const r = getMissionRank(missionId);
  if (r === "novice") return 1;
  if (r === "apprentice") return 2;
  if (r === "journeyman") return 3;
  if (r === "veteran") return 4;
  return null;
}

/** How many regular slots may go to missions whose rank is below the team's
 *  reference rank. Catch-up filler for the lowest adventurer; senior team
 *  shouldn't be drowning in trivial missions either way. */
const BELOW_REFERENCE_QUOTA = 2;

/** How many regular slots reserved for a stretch mission one rank above the
 *  team's highest rank. A risky reward run that demands real preparation —
 *  good to keep one always present so there's something to grow into. */
const STRETCH_QUOTA = 1;

/** Highest mission rank that exists as a tier (veteran). Anything above
 *  caps here for stretch purposes — there are no "elite" mission pools. */
const MAX_MISSION_RANK = 4;

/** Eligible unique side-chain missions (narrative chain beats like Hester's
 *  rescue). These are PINNED — always shown when eligible, never left to random
 *  filler. Exported so the engine can also inject a newly-eligible one onto the
 *  current board immediately (between daily refreshes) rather than making a
 *  story-critical beat wait for the next reroll. */
export function eligiblePinnedMissions(ctx: MissionBoardContext): MissionTemplate[] {
  const { guildLevel, maxDifficulty = 5 } = ctx;
  const completedUnique = new Set(ctx.completedUniqueMissionIds ?? []);
  return ALL_MISSIONS.filter((m) =>
    m.unique && (!!m.sideChain || !!m.pinned) &&
    !m.staged &&
    m.minGuildLevel <= guildLevel &&
    m.difficulty <= maxDifficulty &&
    !completedUnique.has(m.id) &&
    meetsRequirements(m.requires, ctx),
  );
}

export function generateMissionBoard(ctx: MissionBoardContext): MissionTemplate[] {
  const { guildLevel, count = 4, seed = Date.now(), maxDifficulty = 5 } = ctx;
  const completedUnique = new Set(ctx.completedUniqueMissionIds ?? []);
  const available = ALL_MISSIONS.filter((m) =>
    !m.staged &&
    m.minGuildLevel <= guildLevel &&
    m.difficulty <= maxDifficulty &&
    !(m.unique && completedUnique.has(m.id)) &&
    meetsRequirements(m.requires, ctx),
  );

  // Pinned beats always claim a slot instead of competing with filler.
  const pinned = eligiblePinnedMissions(ctx);
  const pinnedIds = new Set(pinned.map((m) => m.id));
  const pool = available.filter((m) => !pinnedIds.has(m.id));
  const regularSlots = Math.max(0, count - pinned.length);

  // Seeded shuffle
  let s = seed;
  function rand(): number {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  }

  // Rank quota — only applies when we have alive adventurer ranks. Floor =
  // lowest alive adventurer's rank (so a fresh recruit unlocks novice
  // missions). Reference = mode (most common rank); ties prefer the higher
  // rank. Stretch = one rank above the team's highest, capped at veteran
  // (no elite missions exist). Anything below floor is dropped; up to
  // BELOW_REFERENCE_QUOTA slots may go to ranks in [floor, reference);
  // STRETCH_QUOTA slots reserved for stretch rank if any exist; the rest
  // fill at-or-above reference.
  const ranks = ctx.adventurerRanks ?? [];
  const useQuota = ranks.length > 0;

  let regular: MissionTemplate[];
  if (useQuota) {
    const floor = Math.min(...ranks);
    const highest = Math.max(...ranks);
    const stretch = Math.min(highest + 1, MAX_MISSION_RANK);
    const hasStretch = stretch > highest;

    const counts = new Map<number, number>();
    for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
    let reference = floor;
    let bestCount = -1;
    for (const [r, c] of counts) {
      if (c > bestCount || (c === bestCount && r > reference)) {
        bestCount = c;
        reference = r;
      }
    }

    const eligible = pool.filter((m) => {
      const r = missionRankNumeric(m.id);
      return r === null || r >= floor; // null = story/expedition, not subject to quota
    });

    // Below-reference: prefer ranks closer to reference (apprentice before
    // novice for a journeyman team) so catch-up slots aren't stuck at the
    // lowest tier when something more useful is available.
    const belowPool = eligible.filter((m) => {
      const r = missionRankNumeric(m.id);
      return r !== null && r < reference;
    });
    const below = [...belowPool]
      .sort(() => rand() - 0.5)
      .sort((a, b) => (missionRankNumeric(b.id) ?? 0) - (missionRankNumeric(a.id) ?? 0))
      .slice(0, Math.min(BELOW_REFERENCE_QUOTA, belowPool.length));

    // Stretch: one rank above the team's highest rank.
    const stretchPool = hasStretch
      ? eligible.filter((m) => missionRankNumeric(m.id) === stretch)
      : [];
    const stretchSlots = [...stretchPool]
      .sort(() => rand() - 0.5)
      .slice(0, Math.min(STRETCH_QUOTA, stretchPool.length));

    // Remainder: at-or-above reference, excluding stretch (already picked).
    const taken = new Set([...below, ...stretchSlots].map((m) => m.id));
    const middlePool = eligible.filter((m) => !taken.has(m.id) && !belowPool.some((b) => b.id === m.id));
    const middleSlots = Math.max(0, regularSlots - below.length - stretchSlots.length);
    const middle = [...middlePool]
      .sort(() => rand() - 0.5)
      .slice(0, Math.min(middleSlots, middlePool.length));

    regular = [...middle, ...stretchSlots, ...below];
  } else {
    const shuffledRegular = [...pool].sort(() => rand() - 0.5);
    regular = shuffledRegular.slice(0, Math.min(regularSlots, pool.length));
  }

  // Pinned chain beats always ride along, ahead of the filler.
  regular = [...pinned, ...regular];

  // Expeditions: +1 per 2 guild levels (not subject to the rank quota)
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
