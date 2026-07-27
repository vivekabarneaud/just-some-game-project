import { describe, it, expect } from "vitest";
import { MISSION_POOL, meetsRequirements } from "@medieval-realm/shared/data/missions";

const byId = (id: string) => MISSION_POOL.find((m) => m.id === id);
const ctx = (over: any) => ({ guildLevel: 3, completedUniqueMissionIds: [], ...over });

describe("Season gate", () => {
  it("a spring mission is eligible in spring, not in other seasons", () => {
    const first = byId("bee_tree_first")!;
    expect(meetsRequirements(first.requires, ctx({ season: "spring" }))).toBe(true);
    expect(meetsRequirements(first.requires, ctx({ season: "winter" }))).toBe(false);
    expect(meetsRequirements(first.requires, ctx({ season: "autumn" }))).toBe(false);
  });
});

describe("The Bee-Tree (Old Honeypaw) — two-state arc", () => {
  it("A is a unique spring combat mission vs the bear, rewarding honey", () => {
    const a = byId("bee_tree_first")!;
    expect(a.unique).toBe(true);
    expect(a.requires?.season).toBe("spring");
    expect(a.encounters?.some((e) => e.enemyId === "forest_bear")).toBe(true);
    expect(a.rewards?.some((r) => r.resource === "honey")).toBe(true);
  });

  it("B is the recurring peaceful routine, gated on A + spring", () => {
    const b = byId("bee_tree")!;
    expect(b.unique).toBeFalsy(); // recurring
    expect(b.guaranteed).toBe(true); // peaceful, no fight
    expect(b.encounters ?? []).toHaveLength(0);
    expect(b.requires?.missionDone).toBe("bee_tree_first");
    // gated: not available in spring until A is done...
    expect(meetsRequirements(b.requires, ctx({ season: "spring", completedUniqueMissionIds: [] }))).toBe(false);
    // ...and available once A is done, in spring
    expect(meetsRequirements(b.requires, ctx({ season: "spring", completedUniqueMissionIds: ["bee_tree_first"] }))).toBe(true);
    // ...but never out of season, even after A
    expect(meetsRequirements(b.requires, ctx({ season: "summer", completedUniqueMissionIds: ["bee_tree_first"] }))).toBe(false);
  });
});

describe("The Fish Run — simple recurring spring gather (no arc)", () => {
  it("is a peaceful spring-gated recurring gather rewarding fish", () => {
    const f = byId("fish_run")!;
    expect(f.unique).toBeFalsy(); // recurring, no discovery arc
    expect(f.guaranteed).toBe(true);
    expect(f.encounters ?? []).toHaveLength(0);
    expect(f.rewards?.some((r) => r.resource === "fish")).toBe(true);
    expect(meetsRequirements(f.requires, ctx({ season: "spring" }))).toBe(true);
    expect(meetsRequirements(f.requires, ctx({ season: "autumn" }))).toBe(false);
  });
});

describe("The Berry Thickets — simple recurring summer gather (no arc)", () => {
  it("is a peaceful summer-gated recurring gather rewarding berries", () => {
    const b = byId("berry_thickets")!;
    expect(b.unique).toBeFalsy();
    expect(b.guaranteed).toBe(true);
    expect(b.encounters ?? []).toHaveLength(0);
    expect(b.rewards?.some((r) => r.resource === "berries")).toBe(true);
    expect(meetsRequirements(b.requires, ctx({ season: "summer" }))).toBe(true);
    expect(meetsRequirements(b.requires, ctx({ season: "spring" }))).toBe(false);
  });
});

describe("The Old Apple Tree — autumn gather, discovery → routine", () => {
  it("A is a unique, peaceful autumn discovery rewarding apples", () => {
    const a = byId("apple_tree_first")!;
    expect(a.unique).toBe(true);
    expect(a.guaranteed).toBe(true);
    expect(a.requires?.season).toBe("autumn");
    expect(a.encounters ?? []).toHaveLength(0); // pure peace — the exhale mission
    expect(a.rewards?.some((r) => r.resource === "apples")).toBe(true);
    expect(meetsRequirements(a.requires, ctx({ season: "winter" }))).toBe(false);
  });

  it("B is the recurring autumn return, gated on A", () => {
    const b = byId("apple_tree")!;
    expect(b.unique).toBeFalsy();
    expect(b.guaranteed).toBe(true);
    expect(meetsRequirements(b.requires, ctx({ season: "autumn", completedUniqueMissionIds: [] }))).toBe(false);
    expect(meetsRequirements(b.requires, ctx({ season: "autumn", completedUniqueMissionIds: ["apple_tree_first"] }))).toBe(true);
  });
});
