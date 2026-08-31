// The frontend's view of the calendar. The CALENDAR ITSELF now lives in
// shared/src/data/calendar.ts so the backend cannot disagree with it (it used
// to: 4-day seasons from April 1 against these 3-day ones from May 2). What
// stays here is frontend-only presentation and the dev/prod mode flag.

export type { Season } from "@medieval-realm/shared";
import type { Season } from "@medieval-realm/shared";
export {
  SEASON_ORDER,
  SEASON_ELAPSED_SPAN,
  REAL_SEASON_HOURS,
  SEASON_DAYS,
  getGlobalSeason,
  settlementYear,
  nextSeason,
} from "@medieval-realm/shared/data/calendar";

// `icon` is the emoji fallback; `image` is the hand-drawn season icon (autumn
// art is still to come, so it has no image and falls back to the emoji).
export const SEASON_META: Record<Season, { name: string; icon: string; color: string; image?: string }> = {
  spring: { name: "Spring", icon: "\u{1F331}", color: "#7CFC00", image: "/images/seasons/season_spring.png" },
  summer: { name: "Summer", icon: "\u2600\uFE0F", color: "#f5c542", image: "/images/seasons/season_summer.png" },
  autumn: { name: "Autumn", icon: "\u{1F342}", color: "#d4831a" },
  winter: { name: "Winter", icon: "\u2744\uFE0F", color: "#87CEEB", image: "/images/seasons/season_winter.png" },
};

// ─── Dev vs Production mode ─────────────────────────────────────
export const IS_DEV = import.meta.env.VITE_DEV_MODE === "true";

// ─── The one thing that still differs between the modes ─────────
// It is NOT where the season starts (both seed from the world calendar now) and
// it is NOT how long a season lasts (dev at x1 matches the world clock). It is
// only the SOURCE of advancement:
//   PROD: re-derived from the wall clock every tick, so game speed cannot move
//         it — the season is shared by every player on the same real date.
//   DEV:  accumulated from game-hours, scaled by
//         SEASON_ELAPSED_SPAN / REAL_SEASON_HOURS so x1 tracks the world clock
//         exactly, which is what lets the speed buttons move seasons at all.

/** During autumn, fields yield their harvest over this many game-hours (on the
 *  0..SEASON_ELAPSED_SPAN scale, so it is half of autumn). Was 6 in dev while
 *  dev seasons ran 3x fast; now that dev at x1 matches the world clock, both
 *  modes use the same window and dev harvest behaves like the real thing. */
export const HARVEST_DURATION_HOURS = 12;



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
