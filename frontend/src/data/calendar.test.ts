import { describe, it, expect } from "vitest";
import {
  getGlobalSeason, settlementYear, SEASON_ORDER, SEASON_DAYS,
  SEASON_ELAPSED_SPAN, REAL_SEASON_HOURS, CALENDAR_EPOCH,
} from "@medieval-realm/shared/data/calendar";
import { HARVEST_DURATION_HOURS } from "./seasons";
import * as seasonsFacade from "./seasons";

// The frontend and backend each carried their own copy of the world calendar,
// and on 2026-08-31 they disagreed: client "spring, year 11" vs server
// "autumn, year 10". They also fought — the backend tick walked the season
// forward to its answer, the client's next tick snapped it back — so a
// player's season ping-ponged across every save/load. These guard the fix.

describe("the world calendar is single-sourced", () => {
  it("the frontend re-exports the shared calendar rather than owning a copy", () => {
    // Identity, not equality: if seasons.ts ever grows its own getGlobalSeason
    // again these stop being the same function object. The backend is covered
    // by its typecheck — its local CALENDAR_EPOCH / SEASON_DURATION_MS are
    // gone, so tick.ts only compiles by importing from shared.
    expect(seasonsFacade.getGlobalSeason).toBe(getGlobalSeason);
    expect(seasonsFacade.settlementYear).toBe(settlementYear);
    expect(seasonsFacade.SEASON_ORDER).toBe(SEASON_ORDER);
    expect(seasonsFacade.SEASON_ELAPSED_SPAN).toBe(SEASON_ELAPSED_SPAN);
    expect(seasonsFacade.REAL_SEASON_HOURS).toBe(REAL_SEASON_HOURS);
  });

  it("agrees with itself: progress, season and year come from one formula", () => {
    // Exactly on the epoch: the first moment of spring, year 1.
    const at = (ms: number) => getGlobalSeason(CALENDAR_EPOCH + ms);
    expect(at(0)).toEqual({ season: "spring", progress: 0, year: 1 });
    const seasonMs = SEASON_DAYS * 24 * 3600 * 1000;
    expect(at(seasonMs).season).toBe("summer");
    expect(at(2 * seasonMs).season).toBe("autumn");
    expect(at(3 * seasonMs).season).toBe("winter");
    // A full turn of four seasons is one year.
    expect(at(4 * seasonMs)).toEqual({ season: "spring", progress: 0, year: 2 });
    // Halfway through a season reads as halfway.
    expect(at(seasonMs / 2).progress).toBeCloseTo(0.5, 5);
    expect(SEASON_ORDER).toEqual(["spring", "summer", "autumn", "winter"]);
  });
});

describe("a settlement's year is its own age, not the world's", () => {
  it("counts from founding, so two players founded apart differ on the same date", () => {
    expect(settlementYear(11, 11)).toBe(1);  // founded this year
    expect(settlementYear(11, 10)).toBe(2);  // founded a year earlier
    expect(settlementYear(11, 1)).toBe(11);
    expect(settlementYear(11, undefined)).toBe(1); // no founding year = brand new
    expect(settlementYear(5, 9)).toBe(1);    // never negative or zero
  });
});

describe("dev at x1 tracks the world clock", () => {
  it("one season of accumulated game-hours equals one real season", () => {
    // The dev tick adds elapsedHours * (SPAN / REAL_SEASON_HOURS), and 1
    // game-hour = 1 real hour at x1, so a full season must take exactly
    // REAL_SEASON_HOURS of real time.
    const perRealHour = SEASON_ELAPSED_SPAN / REAL_SEASON_HOURS;
    expect(perRealHour * REAL_SEASON_HOURS).toBe(SEASON_ELAPSED_SPAN);
    expect(REAL_SEASON_HOURS).toBe(SEASON_DAYS * 24);
  });

  it("harvest is half of autumn in both modes now", () => {
    expect(HARVEST_DURATION_HOURS / SEASON_ELAPSED_SPAN).toBe(0.5);
  });
});
