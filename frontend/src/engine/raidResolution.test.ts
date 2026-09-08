// @vitest-environment happy-dom
// (importing gameState.tsx pulls in the Solid GameProvider template)
import { describe, it, expect } from "vitest";
import { createInitialState, resolveRaidAgainstState } from "./gameState";
import { RAID_POOL, getRaid } from "~/data/raids";
import { BASE_POPULATION } from "~/data/buildings";
import { getTotalFood, isFoodItemType } from "~/data/foods";
import { totalPopulation } from "~/data/citizens";

// The live tick and the offline server-load catch-up both resolve raids. They
// used to be ~115 lines of copy-paste, and their DRIFT was bugs 1.1-1.3:
// double-apply on reload, dropped militia losses, uncapped offline loot. One
// implementation now, so these lock the behaviour in place.
//
// Deliberately NOT tested: whether a given settlement wins. That is balance,
// it changes on purpose, and a test that needs a win to be meaningful would
// break every time the numbers move. Everything below either ignores the
// outcome or asserts something true of BOTH outcomes.

describe("raid victory loot is depositable", () => {
  // The bug this catches, found 2026-08-31: both resolvers inlined
  // `s.resources[key] = Math.min(cap, s.resources[key] + amount)`, which only
  // has buckets for gold/wood/stone. wolf_pack awards 40 MEAT, and meat is a
  // food (s.foods, not s.resources) — so the grant evaluated to NaN, the
  // player got nothing, and `resources.meat = NaN` was written to the save.
  // Loot now goes through grantReward. This is a pure data test: no sim, no
  // balance, and it fails the moment someone adds loot nothing can bank.
  const RESOURCE_KEYS = Object.keys((createInitialState() as any).resources);
  /** Generic aliases grantReward maps onto a specific food. */
  const FOOD_ALIASES = ["food", "meat", "fish", "mushrooms", "berries"];

  it("every raid's victoryLoot names something the game can actually bank", () => {
    const unbankable: string[] = [];
    for (const raid of RAID_POOL) {
      for (const loot of raid.victoryLoot ?? []) {
        const r = loot.resource;
        const ok = r === "astralShards" || RESOURCE_KEYS.includes(r)
          || FOOD_ALIASES.includes(r) || isFoodItemType(r);
        if (!ok) unbankable.push(`${raid.id} → ${r}`);
      }
    }
    expect(unbankable, "raid loot with no bucket to land in").toEqual([]);
  });

  it("meat is a food, not a resource — the trap that caused the bug", () => {
    expect(RESOURCE_KEYS).not.toContain("meat");
    expect(isFoodItemType("venison")).toBe(true);
    expect(getRaid("wolf_pack")?.victoryLoot.some((l) => l.resource === "meat")).toBe(true);
  });
});

describe("resolveRaidAgainstState — one resolver, two callers", () => {
  const template = getRaid("wolf_pack")!;
  const ROUNDS = 30;

  const settlement = () => {
    const s: any = createInitialState();
    s.resources.gold = 1000;
    s.resources.wood = 1000;
    s.resources.stone = 1000;
    return s;
  };

  /** Resolve the same raid against ROUNDS fresh settlements. Whatever the sim
   *  decides each time is fine — we only assert what must always be true. */
  const runs = () => Array.from({ length: ROUNDS }, () => {
    const s = settlement();
    const before = {
      pop: totalPopulation(s.citizens),
      gold: s.resources.gold, wood: s.resources.wood, stone: s.resources.stone,
      food: getTotalFood(s.foods), keys: Object.keys(s.resources).sort(),
    };
    return { s, before, r: resolveRaidAgainstState(s, template.id, template) };
  });

  it("is a single exported implementation driving a real raid", () => {
    expect(typeof resolveRaidAgainstState).toBe("function");
    expect(template.encounters.length).toBeGreaterThan(0);
    expect(template.victoryLoot.length).toBeGreaterThan(0);
  });

  it("never writes a NaN or invents a resource key", () => {
    for (const { s, before } of runs()) {
      for (const [k, v] of Object.entries(s.resources)) {
        expect(Number.isFinite(v), `resources.${k} is not a finite number`).toBe(true);
      }
      expect(Object.keys(s.resources).sort()).toEqual(before.keys);
      expect(Number.isFinite(getTotalFood(s.foods))).toBe(true);
    }
  });

  it("1.2 — militia deaths are counted, and the household floor always holds", () => {
    for (const { s, before, r } of runs()) {
      const after = totalPopulation(s.citizens);
      const killed = r.sim.archersLost + r.sim.soldiersLost + r.sim.militiaLost;
      expect(before.pop - after).toBeLessThanOrEqual(killed + r.extraCitizensLost);
      expect(after).toBeGreaterThanOrEqual(Math.min(before.pop, BASE_POPULATION));
    }
  });

  it("plunder only subtracts, and reports exactly what it took", () => {
    for (const { s, before, r } of runs()) {
      if (r.sim.victory) {
        expect(r.stolen).toEqual({ gold: 0, wood: 0, stone: 0, food: 0 });
        continue;
      }
      expect(s.resources.gold).toBe(before.gold - r.stolen.gold);
      expect(s.resources.wood).toBe(before.wood - r.stolen.wood);
      expect(s.resources.stone).toBe(before.stone - r.stolen.stone);
      for (const k of ["gold", "wood", "stone", "food"] as const) {
        expect(r.stolen[k]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("records the outcome itself, so neither caller has to remember to", () => {
    for (const { s, r } of runs()) {
      expect(s.lastRaidOutcome).toBe(r.sim.victory ? "victory" : "defeat");
      expect(s.lastRaidTime).toBe(0);
      expect(s.raidsResolvedCount).toBe(1);
    }
  });

  it("never damages the town hall, and names every building it damages", () => {
    for (const { s, r } of runs()) {
      for (const n of r.damagedBuildings) expect(n.length).toBeGreaterThan(0);
      const th = s.buildings.find((b: any) => b.buildingId === "town_hall");
      if (th) expect(th.damaged).toBe(false);
      expect(r.damagedBuildings.length).toBe(s.buildings.filter((b: any) => b.damaged).length);
    }
  });
});
