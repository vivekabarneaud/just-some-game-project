// @vitest-environment happy-dom
// (importing gameState.tsx pulls in the Solid GameProvider template, which needs a DOM)
import { describe, it, expect } from "vitest";
import { MISSION_POOL, generateMissionBoard } from "@medieval-realm/shared/data/missions";
import { SCARCITY_ONCE_PER_BOARD } from "./gameState";

const byId = (id: string) => MISSION_POOL.find((m) => m.id === id);

describe("Quarry-spider gate missions", () => {
  it("clear_diggings_2/3 exist, are XP-only, and escalate in difficulty + venom", () => {
    const l2 = byId("clear_the_diggings")!;
    const l3 = byId("the_deeper_cut")!;
    expect(l2).toBeTruthy();
    expect(l3).toBeTruthy();
    expect(l2.rewards).toEqual([]); // XP only — the reward is the unlocked yield
    expect(l3.rewards).toEqual([]);
    expect(l2.difficulty).toBeLessThan(l3.difficulty!); // deeper = worse spiders
    expect(l2.duration).toBeLessThanOrEqual(120); // it's right in the pit — short
    expect(l2.encounters?.some((e) => e.enemyId === "rock_skitter")).toBe(true);
    // depth brings the venomous Cave Spinners in on top of the skitter tide
    expect(l3.encounters?.some((e) => e.enemyId === "cave_spinner")).toBe(true);
  });

  it("are FORCED-ONLY and flagged urgent (distinct outline)", () => {
    const ctx: any = {
      guildLevel: 5,
      seed: 12345,
      completedStoryMissions: [],
      completedUniqueMissionIds: [],
      buildings: [{ buildingId: "quarry", level: 3, damaged: false }],
    };
    const boardIds = new Set(generateMissionBoard(ctx).map((m) => m.id));
    expect(boardIds.has("clear_the_diggings")).toBe(false);
    expect(boardIds.has("the_deeper_cut")).toBe(false);
    expect((byId("clear_the_diggings") as any).urgent).toBe(true);
    expect((byId("the_deeper_cut") as any).urgent).toBe(true);
  });
});

describe("Wild Boar Hunt (food-scarcity mission)", () => {
  it("rewards boar, is urgent, and is forced-only (off the random board)", () => {
    const hunt = byId("lean_times")!;
    expect(hunt).toBeTruthy();
    expect(hunt.rewards?.some((r) => r.resource === "boar")).toBe(true);
    expect((hunt as any).urgent).toBe(true);
    expect(hunt.encounters?.some((e) => e.enemyId === "wild_boar")).toBe(true);
    const ctx: any = {
      guildLevel: 5, seed: 999, completedStoryMissions: [], completedUniqueMissionIds: [],
      buildings: [{ buildingId: "adventurers_guild", level: 3, damaged: false }],
    };
    expect(new Set(generateMissionBoard(ctx).map((m) => m.id)).has("lean_times")).toBe(false);
  });

  it("the Deer Yard is the winter alternate: meat, urgent, forced-only, vs wolves", () => {
    const d = byId("the_deer_yard")!;
    expect(d).toBeTruthy();
    expect(d.rewards?.some((r) => r.resource === "meat")).toBe(true);
    expect((d as any).urgent).toBe(true);
    expect(d.encounters?.some((e) => e.enemyId === "gaunt_wolf" || e.enemyId === "starving_wolf")).toBe(true);
    const ctx: any = { guildLevel: 5, seed: 7, completedStoryMissions: [], completedUniqueMissionIds: [], buildings: [] };
    expect(new Set(generateMissionBoard(ctx).map((m) => m.id)).has("the_deer_yard")).toBe(false);
  });

  it("every once-per-board id names a real, repeatable mission", () => {
    // The set is keyed by raw strings — a typo would silently disable the
    // back-off for that mission. Unique missions never repeat, so listing
    // one here would be dead weight.
    for (const id of SCARCITY_ONCE_PER_BOARD) {
      const m = byId(id);
      expect(m, `unknown mission id in SCARCITY_ONCE_PER_BOARD: ${id}`).toBeTruthy();
      expect(m!.unique ?? false).toBe(false);
    }
  });
});
