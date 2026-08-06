// @vitest-environment happy-dom
// gameState.tsx also defines the <GameProvider> JSX component, whose compiled
// Solid output touches `window` at import. Until the pure save logic is split
// into its own module (audit's migration-extraction refactor), this one file
// runs in a DOM env. The pure suites stay in the fast `node` env.
import { describe, it, expect } from "vitest";
import { createInitialState, migrateSaveState, calcFoodConsumption } from "./gameState";

// Post SAVE_VERSION guard: only current-schema saves reach migrateSaveState, so
// it no longer backfills fields — its sole job is to restore the id counter and
// repair duplicate ids. (The whole "old save missing fields" class is now handled
// by the guard discarding mismatched saves. See feedback_alpha_no_save_preservation.)

describe("migrateSaveState", () => {
  it("does not throw on a current state and returns it", () => {
    const s = createInitialState();
    expect(migrateSaveState(s)).toBe(s);
  });

  it("leaves an already-current state's fields intact", () => {
    const fresh: any = createInitialState();
    const migrated: any = migrateSaveState(createInitialState());
    for (const key of Object.keys(fresh)) {
      expect(migrated[key]).toBeDefined();
    }
  });

  it("repairs duplicate ids in an id-bearing collection", () => {
    // A legacy collision: two entries share an id. migrate gives the later one a
    // fresh id so lookups (e.g. assignAnimal) hit the right entry.
    const s: any = createInitialState();
    s.pens = [{ id: "pen_1" }, { id: "pen_1" }];
    migrateSaveState(s);
    expect(s.pens[0].id).not.toBe(s.pens[1].id);
  });
});

describe("calcFoodConsumption", () => {
  const adults = (n: number) => ({ toddlers: 0, children: 0, adults: n, elderly: 0 });

  it("citizens eat at an adult's full rate (5/hr)", () => {
    expect(calcFoodConsumption(adults(2))).toBe(10); // 2 * 5
  });

  it("adventurers eat half a townsfolk", () => {
    // 4 adventurer-mouths → 4 * 0.5 * 5 = 10, i.e. like 2 adults
    expect(calcFoodConsumption(adults(0), 4)).toBe(10);
  });

  it("the founding-winter ration trims the whole bill", () => {
    expect(calcFoodConsumption(adults(4), 0, 0.7)).toBeCloseTo(14); // 4 * 5 * 0.7
  });

  it("combines citizens + half-fed adventurers + the ration", () => {
    // (2 + 2*0.5) * 5 * 0.7 = 3 * 5 * 0.7 = 10.5
    expect(calcFoodConsumption(adults(2), 2, 0.7)).toBeCloseTo(10.5);
  });
});
