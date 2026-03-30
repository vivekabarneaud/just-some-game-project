export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];

export const SEASON_META: Record<Season, { name: string; icon: string; color: string }> = {
  spring: { name: "Spring", icon: "🌱", color: "#7CFC00" },
  summer: { name: "Summer", icon: "☀️", color: "#f5c542" },
  autumn: { name: "Autumn", icon: "🍂", color: "#d4831a" },
  winter: { name: "Winter", icon: "❄️", color: "#87CEEB" },
};

// Game-hours per season. At 1x speed this is real hours.
// 24h = 1 day per season for dev/testing. Change to 168 (1 week) for real game.
export const HOURS_PER_SEASON = 24;

// During autumn, fields yield their harvest over this many game-hours
export const HARVEST_DURATION_HOURS = 6;

export function nextSeason(current: Season): Season {
  const idx = SEASON_ORDER.indexOf(current);
  return SEASON_ORDER[(idx + 1) % SEASON_ORDER.length];
}

export function getSeasonProgress(elapsed: number): number {
  return Math.min(1, elapsed / HOURS_PER_SEASON);
}
