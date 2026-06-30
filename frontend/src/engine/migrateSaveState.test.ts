// @vitest-environment happy-dom
// gameState.tsx also defines the <GameProvider> JSX component, whose compiled
// Solid output touches `window` at import. Until the pure save logic is split
// into its own module (audit's migration-extraction refactor), this one file
// runs in a DOM env. The pure suites stay in the fast `node` env.
import { describe, it, expect } from "vitest";
import { createInitialState, migrateSaveState } from "./gameState";

// Sentinel for the June 2026 P0: the server load path skipped most of the
// backfill, so fields added over time loaded as `undefined` — and the tick
// reads some (e.g. craftingQueue) unguarded, which froze the game loop.
// We simulate an "old save" by taking a current state and stripping the
// fields that postdate it, then assert migrateSaveState restores them.

function oldSave(): any {
  const s: any = createInitialState();
  // Tick-critical fields the server path used to miss.
  delete s.craftingQueue;
  delete s.autoCook;
  delete s.discoveredEnemies;
  delete s.completedUniqueMissionIds;
  delete s.buildingTools;
  delete s.questsClaimableSeen;
  delete s.buildingsSeen;
  delete s.recipesSeen;
  delete s.adventurersSeen;
  // Seed system (latest addition).
  delete s.seeds;
  for (const g of s.gardens) delete g.seedsPlanted;
  return s;
}

describe("migrateSaveState", () => {
  it("does not throw on a save missing newer fields", () => {
    expect(() => migrateSaveState(oldSave())).not.toThrow();
  });

  it("restores the tick-critical fields the P0 left undefined", () => {
    const s: any = migrateSaveState(oldSave());
    // craftingQueue is the one that actually froze the tick (read at .length).
    expect(Array.isArray(s.craftingQueue)).toBe(true);
    expect(Array.isArray(s.discoveredEnemies)).toBe(true);
    expect(Array.isArray(s.completedUniqueMissionIds)).toBe(true);
    expect(s.autoCook).toBeDefined();
    expect(s.buildingTools).toBeDefined();
    expect(s.questsClaimableSeen).toBeDefined();
    expect(s.buildingsSeen).toBeDefined();
    expect(s.recipesSeen).toBeDefined();
    expect(s.adventurersSeen).toBeDefined();
  });

  it("restores the seed-system fields", () => {
    const s: any = migrateSaveState(oldSave());
    expect(s.seeds).toBeDefined();
    expect(typeof s.seeds.turnips).toBe("number");
    for (const g of s.gardens) expect(typeof g.seedsPlanted).toBe("number");
  });

  it("leaves an already-current state intact (idempotent backfill)", () => {
    const fresh: any = createInitialState();
    const migrated: any = migrateSaveState(createInitialState());
    // Same shape — no field that exists fresh should go missing after migrating.
    for (const key of Object.keys(fresh)) {
      expect(migrated[key]).toBeDefined();
    }
  });
});
