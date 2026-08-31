// ─── The world calendar — ONE definition ────────────────────────
// This used to live twice, and the two copies disagreed:
//   frontend/src/data/seasons.ts   epoch May 2 2026, 3-day seasons
//   backend/src/services/tick.ts   epoch Apr 1 2026, 4-day seasons
// On 2026-08-31 that meant the client said "spring, year 11" while the server
// said "autumn, year 10" — and they fought, because the backend tick walked
// s.season forward to ITS answer and the client's next tick snapped it back to
// its own. A player's season ping-ponged across every save/load.
//
// The frontend's numbers won (user call, 2026-08-31). Both sides import from
// here now, so they cannot drift again. The epoch is still provisional: pick a
// permanent one when prod actually launches.

import type { Season } from "../gameState.js";

export const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];

export const CALENDAR_EPOCH = Date.UTC(2026, 4, 2); // May 2, 2026 00:00 UTC
/** A season lasts this many REAL days. Every player flips on the same date. */
export const SEASON_DAYS = 3;
export const SEASON_DURATION_MS = SEASON_DAYS * 24 * 60 * 60 * 1000;

/** Scale of the `seasonElapsed` counter, which runs 0 → SEASON_ELAPSED_SPAN in
 *  every mode. In prod it is the real season's progress (0..1) projected onto
 *  this range; in dev it is accumulated game-hours, scaled so that x1 matches
 *  the world clock. Harvest and forage windows are measured against it, so
 *  changing this number silently rescales them — don't retune it to change
 *  pacing, change SEASON_DAYS instead. */
export const SEASON_ELAPSED_SPAN = 24;

/** Real hours in one season. Dev scales its game-hour accumulation by
 *  SEASON_ELAPSED_SPAN / REAL_SEASON_HOURS, so at x1 a dev season takes exactly
 *  as long as a production one and the speed buttons multiply from there. */
export const REAL_SEASON_HOURS = SEASON_DAYS * 24;

/** The shared world season, derived purely from the wall clock — no server
 *  round-trip needed, which is why both sides can compute it. */
export function getGlobalSeason(now: number = Date.now()): { season: Season; progress: number; year: number } {
  const elapsed = now - CALENDAR_EPOCH;
  const totalSeasons = Math.floor(elapsed / SEASON_DURATION_MS);
  const seasonIndex = ((totalSeasons % 4) + 4) % 4; // handle negative just in case
  const progress = (elapsed % SEASON_DURATION_MS) / SEASON_DURATION_MS;
  return {
    season: SEASON_ORDER[seasonIndex],
    progress: Math.min(1, Math.max(0, progress)),
    year: Math.floor(totalSeasons / 4) + 1,
  };
}

/** A settlement's year is its own AGE, not the world year: two players who
 *  founded a year apart are in different years on the same date. The backend
 *  used to assign the world year here, which is the other half of the desync. */
export function settlementYear(worldYear: number, foundingYear: number | undefined): number {
  return Math.max(1, worldYear - (foundingYear ?? worldYear) + 1);
}

export function nextSeason(current: Season): Season {
  return SEASON_ORDER[(SEASON_ORDER.indexOf(current) + 1) % SEASON_ORDER.length];
}
