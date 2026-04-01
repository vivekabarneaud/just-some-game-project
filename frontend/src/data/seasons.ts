export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];

export const SEASON_META: Record<Season, { name: string; icon: string; color: string }> = {
  spring: { name: "Spring", icon: "🌱", color: "#7CFC00" },
  summer: { name: "Summer", icon: "☀️", color: "#f5c542" },
  autumn: { name: "Autumn", icon: "🍂", color: "#d4831a" },
  winter: { name: "Winter", icon: "❄️", color: "#87CEEB" },
};

// ─── Dev vs Production mode ─────────────────────────────────────
export const IS_DEV = import.meta.env.VITE_DEV_MODE === "true";

// In dev: 24 game-hours per season (fast, for testing)
// In prod: seasons are derived from real-world time (4 real days per season)
export const HOURS_PER_SEASON = 24;

// During autumn, fields yield their harvest over this many game-hours
export const HARVEST_DURATION_HOURS = IS_DEV ? 6 : 12;

// ─── Global calendar (production) ───────────────────────────────
// Spring starts on April 1, 2026 00:00 UTC. Every 4 real days = 1 season.
const CALENDAR_EPOCH = Date.UTC(2026, 3, 1); // April 1, 2026
const SEASON_DURATION_MS = 4 * 24 * 60 * 60 * 1000; // 4 days in ms

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
  return Math.min(1, elapsed / HOURS_PER_SEASON);
}
