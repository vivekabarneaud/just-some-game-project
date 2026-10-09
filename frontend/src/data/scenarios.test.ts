// @vitest-environment happy-dom
// (gameState.tsx carries the Solid GameProvider template, which needs a DOM)
import { describe, it, expect } from "vitest";
import { SCENARIOS, buildScenario, getScenario } from "~/data/scenarios";
import { BUILDINGS } from "~/data/buildings";
import { createInitialState, SAVE_VERSION, calcMaxPopulation } from "~/engine/gameState";
import { PREMADE_CHARACTERS } from "@medieval-realm/shared/data/premade-characters";
import { STORY_MISSIONS, getCurrentStoryMission } from "@medieval-realm/shared/data/missions";
import { getAilment } from "@medieval-realm/shared/data/ailments";
import { getItem } from "@medieval-realm/shared/data/items";
import { ALCHEMY_RECIPES } from "@medieval-realm/shared/data/alchemy_recipes";
import { FOUNDING_CHARACTERS } from "~/data/founding_characters";
import { QUEST_DEFINITIONS } from "~/data/quests";

// A scenario is a recipe over the live `createInitialState()`, so it cannot
// drift out of the save shape. What it CAN do is name a building, a hero or a
// story mission that no longer exists. These tests are that guard, and they
// assert nothing about balance: only that every id a recipe names is real.

const ids = {
  buildings: new Set(BUILDINGS.map((b) => b.id)),
  premades: new Set(PREMADE_CHARACTERS.map((c) => c.id)),
  stories: new Set(STORY_MISSIONS.map((m) => m.id)),
  quests: new Set(QUEST_DEFINITIONS.map((q) => q.id)),
  founders: new Set(FOUNDING_CHARACTERS.map((f) => f.id)),
};

describe("every scenario names things that exist", () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s", (_id, sc) => {
    for (const b of Object.keys(sc.buildings ?? {})) expect(ids.buildings).toContain(b);
    for (const p of Object.keys(sc.roster ?? {})) expect(ids.premades).toContain(p);
    for (const m of sc.storyDone ?? []) expect(ids.stories).toContain(m);
    for (const q of sc.questsDone ?? []) expect(ids.quests).toContain(q);
    for (const [person, ailment] of Object.entries(sc.ailments ?? {})) {
      expect(ids.founders).toContain(person);
      expect(getAilment(ailment)).toBeDefined();
    }
  });

  it("gives every scenario an id of its own", () => {
    const list = SCENARIOS.map((s) => s.id);
    expect(new Set(list).size).toBe(list.length);
  });
});

describe("a built scenario is a save the game can load", () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s", (_id, sc) => {
    const s = buildScenario(sc);
    expect(s.saveVersion).toBe(SAVE_VERSION);
    // Every key the fresh state has, the built one still has. A recipe adds
    // and overwrites; it must never drop a field the loader expects.
    for (const k of Object.keys(createInitialState())) expect(s).toHaveProperty(k);
    // Everything a tweak puts in the bag has to resolve. A cure id lives in
    // the item list OR in the alchemy recipes, which is why this looks in both.
    for (const slot of s.inventory) {
      const known = !!getItem(slot.itemId) || ALCHEMY_RECIPES.some((r) => r.id === slot.itemId);
      expect(known, `unknown inventory id: ${slot.itemId}`).toBe(true);
    }
  });

  it("raises the buildings the recipe asks for, and leaves the rest alone", () => {
    const s = buildScenario({
      id: "t", name: "t", blurb: "t", buildings: { lumber_mill: 3 },
    });
    expect(s.buildings.find((b) => b.buildingId === "lumber_mill")!.level).toBe(3);
    expect(s.buildings.find((b) => b.buildingId === "quarry")!.level).toBe(0);
  });

  it("puts the story exactly where the recipe says", () => {
    const s = buildScenario({
      id: "t", name: "t", blurb: "t",
      buildings: { adventurers_guild: 1 },
      storyDone: ["story_1_scouting"],
    });
    const next = getCurrentStoryMission(1, s.completedStoryMissions, s.questRewardsClaimed);
    expect(next?.id).not.toBe("story_1_scouting");
  });

  it("never replays the opening cinematic", () => {
    for (const sc of SCENARIOS) expect(buildScenario(sc).introSeen).toBe(true);
  });

  it("starts the clock now, so the first tick does not race through the year", () => {
    const before = Date.now();
    expect(buildScenario(SCENARIOS[0]).lastTick).toBeGreaterThanOrEqual(before);
  });

  it("leaves day one untouched: it is the fresh state", () => {
    const fresh = createInitialState();
    const day1 = buildScenario(getScenario("day_one")!);
    expect(day1.buildings).toEqual(fresh.buildings);
    expect(day1.adventurers).toEqual([]);
    expect(day1.completedStoryMissions).toEqual([]);
  });

  it("puts a named person's ailment on the person, not on a building", () => {
    const sick = buildScenario(getScenario("the_sick_house")!);
    expect(Object.keys(sick.folkAilments ?? {}).sort())
      .toEqual(["jory", "nell", "the_lord", "tomas"]);
  });
});

describe("housing at level 1 holds the people you already have", () => {
  it("fits the six founders, the three Thornwoods and their boy, with no spare bed", () => {
    // A spare bed let a family arrive while food and water were still scarce,
    // which is a loss the player did not choose. Wanting newcomers means
    // raising the Houses.
    const s = buildScenario({ id: "t", name: "t", blurb: "t", buildings: { houses: 1 } });
    expect(calcMaxPopulation(s.buildings)).toBe(10);
  });
});
