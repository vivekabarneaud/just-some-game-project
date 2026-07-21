export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];

// `icon` is the emoji fallback; `image` is the hand-drawn season icon (autumn
// art is still to come, so it has no image and falls back to the emoji).
export const SEASON_META: Record<Season, { name: string; icon: string; color: string; image?: string }> = {
  spring: { name: "Spring", icon: "🌱", color: "#7CFC00", image: "/images/seasons/season_spring.png" },
  summer: { name: "Summer", icon: "☀️", color: "#f5c542", image: "/images/seasons/season_summer.png" },
  autumn: { name: "Autumn", icon: "🍂", color: "#d4831a" },
  winter: { name: "Winter", icon: "❄️", color: "#87CEEB", image: "/images/seasons/season_winter.png" },
};

// ─── Dev vs Production mode ─────────────────────────────────────
export const IS_DEV = import.meta.env.VITE_DEV_MODE === "true";

// ─── Two season systems — do not confuse them ───────────────────
// PROD: a season lasts 3 REAL-WORLD days, off the fixed global calendar
//   (SEASON_DURATION_MS below). Every player flips season on the same real
//   date. That is the real season length in production.
// DEV:  seasons advance from game ticks instead, one every SEASON_ELAPSED_SPAN
//   "game-hours" (fast, so a full year doesn't take 12 real days to test).
//
// SEASON_ELAPSED_SPAN is ALSO the scale of the `seasonElapsed` counter in BOTH
// modes: seasonElapsed runs 0 → SEASON_ELAPSED_SPAN. In dev it ticks up as real
// game-hours; in prod it's the 3-day progress (0..1) projected onto that same
// 0..SPAN range. So it is NOT a dev-only number — hence no DEV_ prefix.
export const SEASON_ELAPSED_SPAN = 24;

// During autumn, fields yield their harvest over this many game-hours
export const HARVEST_DURATION_HOURS = IS_DEV ? 6 : 12;

// ─── Global calendar (production) ───────────────────────────────
// Spring year 1 starts on May 2, 2026 00:00 UTC. Every 3 real days = 1 season.
// Calendar reset on 2026-05-02 to align with the 3-day cadence change. Pick a
// permanent epoch when prod actually launches.
const CALENDAR_EPOCH = Date.UTC(2026, 4, 2); // May 2, 2026
const SEASON_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

export function getGlobalSeason(): { season: Season; progress: number; year: number } {
  const elapsed = Date.now() - CALENDAR_EPOCH;
  const totalSeasons = Math.floor(elapsed / SEASON_DURATION_MS);
  const seasonIndex = ((totalSeasons % 4) + 4) % 4; // handle negative just in case
  const year = Math.floor(totalSeasons / 4) + 1;
  const progress = (elapsed % SEASON_DURATION_MS) / SEASON_DURATION_MS;
  return {
    season: SEASON_ORDER[seasonIndex],
    progress: Math.min(1, Math.max(0, progress)),
    year,
  };
}

export function nextSeason(current: Season): Season {
  const idx = SEASON_ORDER.indexOf(current);
  return SEASON_ORDER[(idx + 1) % SEASON_ORDER.length];
}

export function getSeasonProgress(elapsed: number): number {
  return Math.min(1, elapsed / SEASON_ELAPSED_SPAN);
}
