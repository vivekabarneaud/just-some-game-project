import { getMissionRank, type MissionRank, type MissionTemplate } from "@medieval-realm/shared/data/missions";

// ─── Asset CDN ──────────────────────────────────────────────────
// All images are served from Cloudflare R2. Set to "" for local dev fallback.
export const CDN_BASE = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev";

/** Prefix an image path with the CDN base URL */
export function cdnUrl(path: string): string {
  return CDN_BASE + path;
}

// ─── Shared UI Constants ────────────────────────────────────────

// Legacy labels — kept for migrations or places where a raw difficulty number is
// the only thing available. New UI should use RANK_LABELS + a star count instead.
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Novice", 2: "Apprentice", 3: "Journeyman", 4: "Veteran", 5: "Elite",
};

export const DIFFICULTY_COLORS: Record<number, string> = {
  1: "var(--accent-green)", 2: "var(--accent-blue)", 3: "var(--accent-gold)", 4: "#e67e22", 5: "var(--accent-red)",
};

// Mission rank — derived from the pool a mission lives in, not its difficulty number.
// `difficulty` (1-3) is the sub-star count within a rank.
// Prefixed `MISSION_RANK_` to avoid colliding with adventurers' `RANK_COLORS`/`RANK_NAMES`.
export const MISSION_RANK_LABELS: Record<string, string> = {
  novice: "Novice",
  apprentice: "Apprentice",
  journeyman: "Journeyman",
  veteran: "Veteran",
  story: "Story",
  expedition: "Expedition",
};

export const MISSION_RANK_COLORS: Record<string, string> = {
  novice: "var(--accent-green)",
  apprentice: "var(--accent-blue)",
  journeyman: "var(--accent-gold)",
  veteran: "#e67e22",
  story: "var(--accent-gold)",
  expedition: "#a78bfa",
};

// Mission RANK → rarity frame (novice=common … veteran=epic; story/expedition
// are the top, legendary). Higher ranks (rare+) also carry the mid-edge
// ornament flourishes, same art the roster/kennel cards use.
const RANK_FRAME_RARITY: Record<MissionRank, string> = {
  novice: "common",
  apprentice: "uncommon",
  journeyman: "rare",
  veteran: "epic",
  story: "legendary",
  expedition: "legendary",
};
const DIFFICULTY_TO_RANK: Record<number, MissionRank> = {
  1: "novice", 2: "novice", 3: "apprentice", 4: "journeyman", 5: "veteran",
};

// The frame art's corner ornament grows with rarity, so each needs its own
// border-image slice (a fixed slice cuts through the bigger corners — the epic
// "mashup"). Values are px in the 512x512 source art.
export const RARITY_SLICE: Record<string, number> = {
  common: 34, uncommon: 40, rare: 66, epic: 95, legendary: 95,
};
/** Rarity → mid-edge ornament art (below rare: none). Horizontal twin is the
 *  same path with `_h` before `.png` (see CardFrame). */
export const RARITY_ORNAMENT: Record<string, string | undefined> = {
  rare: "/images/frames/ornament_rare.png",
  epic: "/images/frames/ornament_epic.png",
  legendary: "/images/frames/ornament_epic.png",
};
const RARITY_BY_TIER = ["", "common", "uncommon", "rare", "epic", "legendary"];

/** Rarity frame for a plain 1..5 tier/rank (enemy tier, adventurer rank):
 *  1=common … 5=legendary. Returns the art URL + its border-image slice. */
export function tierFrame(tier: number): { rarity: string; frameUrl: string; slice: number } {
  const rarity = RARITY_BY_TIER[Math.max(1, Math.min(5, tier))];
  return { rarity, frameUrl: `/images/frames/item_frame_${rarity}.png`, slice: RARITY_SLICE[rarity] ?? 34 };
}

// Boss frames — hand-drawn, downscaled to 512 like the item frames. Only
// novice/apprentice/journeyman (enemy tiers 1-3) exist so far; higher-tier
// bosses fall back to the plain rarity frame until their art is drawn.
const BOSS_RANK = ["", "novice", "apprentice", "journeyman"];
const BOSS_ORNAMENT: Record<string, string | undefined> = {
  apprentice: "/images/frames/ornament_apprentice_boss.png",
  journeyman: "/images/frames/ornament_journeyman_boss.png",
};
/** Boss frame assets for an enemy tier, or null if no boss frame exists yet. */
export function bossFrameAssets(tier: number): { frameUrl: string; slice: number; ornament?: string } | null {
  if (tier < 1 || tier > 3) return null;
  const rank = BOSS_RANK[tier];
  return { frameUrl: `/images/frames/boss_frame_${rank}.png`, slice: 77, ornament: BOSS_ORNAMENT[rank] };
}

/** Frame assets for a mission, keyed to its RANK (rank-neutral side-chains fall
 *  back to a difficulty→rank guess). Returns the border-image frame plus the
 *  mid-edge ornament art for the higher ranks (undefined below rare). */
export function missionFrameAssets(mission: MissionTemplate): {
  rarity: string; frameUrl: string; slice: number; ornamentV?: string; ornamentH?: string;
} {
  const poolRank = getMissionRank(mission.id);
  // Story missions frame by their DIFFICULTY, not a flat legendary — a legendary
  // frame on an easy story beat (e.g. a difficulty-2 "Past the Ruins") overstates
  // the challenge and reads as misleading. Other pools keep their rank frame.
  const rank = (!poolRank || poolRank === "story")
    ? (DIFFICULTY_TO_RANK[Math.max(1, Math.min(5, mission.difficulty))] ?? "novice")
    : poolRank;
  const rarity = RANK_FRAME_RARITY[rank] ?? "common";
  const orn = RARITY_ORNAMENT[rarity];
  return {
    rarity,
    frameUrl: `/images/frames/item_frame_${rarity}.png`,
    slice: RARITY_SLICE[rarity] ?? 34,
    ornamentV: orn,
    ornamentH: orn?.replace(".png", "_h.png"),
  };
}
