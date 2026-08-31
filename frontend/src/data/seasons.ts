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


/** Shared copy for the season-change food warning (Overview card + top banner),
 *  so the two surfaces never drift. Returns null when the next season holds a
 *  surplus (nothing to say). tone "danger" = stores run dry before the season
 *  ends; "ok" = a deficit the stores outlast, so it reassures rather than alarms.
 *  Framing shifts by season: winter reads as survival, autumn as the harvest's
 *  end, spring/summer stay generic (they almost never trip, production rises). */
export function seasonFoodOutlookNote(
  next: Season,
  opts: { net: number; hoursToEmpty: number; hoursToNext: number; seasonHours: number },
): { tone: "danger" | "ok"; headline: string; detail: string } | null {
  if (opts.net >= 0) return null;
  const tone: "danger" | "ok" = opts.hoursToEmpty <= opts.seasonHours ? "danger" : "ok";
  const eta = opts.hoursToNext > 0 ? ` (in about ${Math.round(opts.hoursToNext)}h)` : "";
  const empty = Number.isFinite(opts.hoursToEmpty) ? `about ${Math.round(opts.hoursToEmpty)}h` : "a while";
  const headline = `${SEASON_META[next].name} is coming${eta}`;
  if (next === "winter") {
    return {
      tone, headline,
      detail: tone === "danger"
        ? `Foraging and the hunt thin out in winter, and at those rates our stores would run dry in ${empty} — before spring. Stock up while the harvest holds.`
        : `Foraging and the hunt will thin, but our stores should see us through to spring. Keep the larder topped up and we will be fine.`,
    };
  }
  if (next === "autumn") {
    return {
      tone, headline,
      detail: tone === "danger"
        ? `Summer crops stop yielding and foraging thins, and our stores would run dry in ${empty}. Plant autumn crops (turnips, cabbage, gourds) or stock up now.`
        : `Summer crops give out and foraging thins, but our stores should carry us through.`,
    };
  }
  return {
    tone, headline,
    detail: tone === "danger"
      ? `Our food is set to fall short — stores would run dry in ${empty}. Plant crops for the season or stock up now.`
      : `Our food dips next season, but the stores should cover the gap.`,
  };
}
