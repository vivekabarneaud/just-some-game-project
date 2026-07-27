import { describe, it, expect } from "vitest";
import { MISSION_POOL, generateMissionBoard } from "@medieval-realm/shared/data/missions";

const byId = (id: string) => MISSION_POOL.find((m) => m.id === id);

describe("Quarry-spider gate missions", () => {
  it("clear_diggings_2/3 exist, are XP-only, and escalate in difficulty + venom", () => {
    const l2 = byId("clear_diggings_2")!;
    const l3 = byId("clear_diggings_3")!;
    expect(l2).toBeTruthy();
    expect(l3).toBeTruthy();
    expect(l2.rewards).toEqual([]); // XP only — the reward is the unlocked yield
    expect(l3.rewards).toEqual([]);
    expect(l2.difficulty).toBeLessThan(l3.difficulty!); // deeper = worse spiders
    expect(l2.duration).toBeLessThanOrEqual(120); // it's right in the pit — short
    expect(l2.encounters?.some((e) => e.enemyId === "rock_skitter")).toBe(true);
    // depth brings the venomous Cave Spinners in on top of the skitter tide
    expect(l3.encounters?.some((e) => e.enemyId === "cave_spider")).toBe(true);
  });

  it("are FORCED-ONLY: never surface on the random board, even with a deep quarry", () => {
    const ctx: any = {
      guildLevel: 5,
      seed: 12345,
      completedStoryMissions: [],
      completedUniqueMissionIds: [],
      buildings: [{ buildingId: "quarry", level: 3, damaged: false }],
    };
    const boardIds = new Set(generateMissionBoard(ctx).map((m) => m.id));
    expect(boardIds.has("clear_diggings_2")).toBe(false);
    expect(boardIds.has("clear_diggings_3")).toBe(false);
  });
});
