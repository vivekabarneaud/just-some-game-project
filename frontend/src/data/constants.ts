// ─── Asset CDN ──────────────────────────────────────────────────
// All images are served from Cloudflare R2. Set to "" for local dev fallback.
export const CDN_BASE = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev";

/** Prefix an image path with the CDN base URL */
export function cdnUrl(path: string): string {
  return CDN_BASE + path;
}

// ─── Shared UI Constants ────────────────────────────────────────

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Novice", 2: "Apprentice", 3: "Journeyman", 4: "Veteran", 5: "Elite",
};

export const DIFFICULTY_COLORS: Record<number, string> = {
  1: "var(--accent-green)", 2: "var(--accent-blue)", 3: "var(--accent-gold)", 4: "#e67e22", 5: "var(--accent-red)",
};
