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
