// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { MISSION_POOL, FORAGING_MISSIONS, isForagingMission, generateMissionBoard, getMission } from "@medieval-realm/shared/data/missions";
import { getForagePlant, FORAGE_PLANTS } from "@medieval-realm/shared/data/foraging/plants";
import { isFoodItemType } from "../data/foods";

// FORAGING_MINIGAME §3d: the trip IS a daily mission. These are structural
// invariants — a foraging card is a DOOR, so it must carry none of the things a
// deployment carries, or the guild UI will try to send a team into a minigame.

describe("a foraging card is a door, not a deployment", () => {
  it("carries no slots, no encounters, no rewards and no cost", () => {
    expect(FORAGING_MISSIONS.length).toBeGreaterThan(0);
    for (const m of FORAGING_MISSIONS) {
      expect(m.foraging, `${m.id} must carry the flag`).toBeTruthy();
      expect(m.foraging!.region, `${m.id} must name its region`).toBeTruthy();
      expect(m.slots, `${m.id}: nobody is sent`).toEqual([]);
      expect(m.encounters ?? [], `${m.id}: nothing is fought`).toEqual([]);
      expect(m.rewards, `${m.id}: the basket IS the reward`).toEqual([]);
      expect(m.deployCost, `${m.id}: costs no gold`).toBe(0);
      expect(m.duration, `${m.id}: nothing is waited for`).toBe(0);
    }
  });

  it("isForagingMission tells them apart from every other card", () => {
    for (const m of FORAGING_MISSIONS) expect(isForagingMission(m)).toBe(true);
    const others = MISSION_POOL.filter((m) => !m.foraging);
    expect(others.length).toBeGreaterThan(10);
    for (const m of others) expect(isForagingMission(m)).toBe(false);
    expect(isForagingMission(undefined)).toBe(false);
    expect(isForagingMission(null)).toBe(false);
  });

  it("is in the pool and resolvable by id, so a saved trip survives a reload", () => {
    for (const m of FORAGING_MISSIONS) {
      expect(MISSION_POOL.some((p) => p.id === m.id)).toBe(true);
      expect(getMission(m.id)).toBeTruthy();
    }
  });

  it("is repeatable — a daily trip that could only be taken once is not daily", () => {
    for (const m of FORAGING_MISSIONS) expect(m.unique ?? false).toBe(false);
  });
});

describe("the trip reaches the board", () => {
  const ctx = (done: string[]) => ({
    guildLevel: 3,
    seed: 4242,
    completedStoryMissions: done,
    completedUniqueMissionIds: [],
    buildings: [{ buildingId: "adventurers_guild", level: 2, damaged: false }],
  }) as never;

  it("appears once the near fold is charted, and not before", () => {
    const before = new Set(generateMissionBoard(ctx([])).map((m) => m.id));
    const after = new Set(generateMissionBoard(ctx(["story_1_scouting"])).map((m) => m.id));
    // You cannot walk into a wood nobody has charted.
    expect(before.has("forage_near_wood")).toBe(false);
    expect(after.has("forage_near_wood")).toBe(true);
  });

  it("is pinned, so it is reliably there rather than a lucky draw", () => {
    // The fiction is that the wood is simply there. A trip that only sometimes
    // appeared would read as a bug, so every seed must produce it.
    for (const seed of [1, 7, 99, 1234, 55555]) {
      const board = generateMissionBoard({ ...(ctx(["story_1_scouting"]) as object), seed } as never);
      expect(board.some((m) => m.id === "forage_near_wood"), `seed ${seed}`).toBe(true);
    }
  });
});

describe("what a basket can actually bring home", () => {
  it("every yield the near wood offers either stores or is a known orphan", () => {
    // Not a balance test: it asserts we KNOW which yields have no pantry home,
    // so a new plant cannot quietly become unpickable-in-practice.
    const ORPHANS = ["judas_ear", "velvet_shank", "parasol", "rosehip", "hemlock"];
    const yields = FORAGE_PLANTS.map((p) => p.yields).filter((y): y is string => !!y);
    expect(yields.length).toBeGreaterThan(10);
    for (const y of yields) {
      if (isFoodItemType(y)) continue;
      expect(ORPHANS, `${y} has no pantry home and is not a known orphan`).toContain(y);
    }
  });

  it("a decoy yields nothing, so it can never be stored", () => {
    const decoys = FORAGE_PLANTS.filter((p) => !p.yields);
    expect(decoys.length).toBeGreaterThan(0);
    for (const d of decoys) expect(getForagePlant(d.id)?.yields).toBeFalsy();
  });
});
