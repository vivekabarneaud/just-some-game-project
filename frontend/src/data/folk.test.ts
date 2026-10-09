// @vitest-environment happy-dom
// (gameState.tsx carries the Solid GameProvider template, which needs a DOM)
import { describe, it, expect } from "vitest";
import {
  settlers, adventurers, visitors, awayReason, buildingOfAdventurer, type FolkPerson,
} from "~/data/folk";
import { buildingOfFounder, founderOfBuilding, catchablePoolFor, type GameState } from "~/engine/gameState";
import { FOUNDING_CHARACTERS } from "~/data/founding_characters";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import { calcAdventurerMaxHp } from "@medieval-realm/shared/data/expeditionEngine";

// The Folk page gathers people from four registries that share no id-space.
// These tests guard the gathering, not the drawing: who appears, who is left
// out, and that nobody appears twice.

const nessa = () => buildRecruitFromPremadeId("a1", "char_000", 3)!;
const stateWith = (patch: Partial<GameState> = {}): GameState =>
  ({ adventurers: [], buildings: [], folkAilments: {}, ...patch } as unknown as GameState);

describe("settlers — the six are always here", () => {
  it("lists every founder, in the order the cast file gives", () => {
    const list = settlers(stateWith());
    expect(list.map((p) => p.id)).toEqual(FOUNDING_CHARACTERS.map((f) => f.id));
  });

  it("never marks a settler away: a founder does not leave", () => {
    for (const p of settlers(stateWith())) expect(p.away).toBeUndefined();
  });

  it("an illness shows on the card but does not send them away", () => {
    const s = stateWith({ folkAilments: { edda: { ailmentId: "bad_cut", hoursRemaining: 6 } } });
    const edda = settlers(s).find((p) => p.id === "edda")!;
    expect(edda.ailment?.id).toBe("bad_cut");
    expect(edda.away).toBeUndefined();
  });

  it("names the workplace with the share of a day's pace they pull", () => {
    const bid = buildingOfFounder("jory")!;
    const s = stateWith({ buildings: [{ buildingId: bid, level: 1 }] as never });
    const jory = settlers(s).find((p) => p.id === "jory")!;
    expect(jory.work.text).toMatch(/\(\d+%\)$/);
    expect(jory.work.dot).toBe("good");
  });

  it("says a founder has no trade rather than inventing one", () => {
    const nell = settlers(stateWith()).find((p) => p.id === "nell")!;
    expect(nell.work.dot).toBe("idle");
    expect(nell.work.text).toMatch(/no set trade/i);
  });

  it("does not promise a job at a building that is not raised yet", () => {
    const jory = settlers(stateWith()).find((p) => p.id === "jory")!;
    expect(jory.work.dot).toBe("idle");
    expect(jory.work.text).toMatch(/not built yet/);
  });

  it("reads healthy by default, and names the ailment with its hours left", () => {
    expect(settlers(stateWith()).find((p) => p.id === "edda")!.health)
      .toEqual({ dot: "good", text: "Healthy" });
    const s = stateWith({ folkAilments: { edda: { ailmentId: "bad_cut", hoursRemaining: 6 } } });
    const edda = settlers(s).find((p) => p.id === "edda")!;
    expect(edda.health.dot).not.toBe("good");
    expect(edda.health.text).toBe("Has a bad cut, 6h left");
  });
});

describe("workplaces — three founders have no job at all", () => {
  // This is the whole reason illness moved off the building key. While an
  // ailment sat on a building, a founder with no building could never catch one.
  it("the Lord, Nell and Father Corin work nowhere", () => {
    expect(buildingOfFounder("the_lord")).toBeUndefined();
    expect(buildingOfFounder("nell")).toBeUndefined();
    expect(buildingOfFounder("father_corin")).toBeUndefined();
  });

  it("a founder with a workplace round-trips back to themselves", () => {
    for (const f of FOUNDING_CHARACTERS) {
      const bid = buildingOfFounder(f.id);
      if (!bid) continue;
      expect(founderOfBuilding(bid)).toBe(f.id);
    }
  });
});

describe("awayReason — why a hero cannot work", () => {
  it("says nothing about a hale hero standing in the settlement", () => {
    const a = nessa();
    a.currentHp = calcAdventurerMaxHp(a);
    expect(awayReason(a)).toBeUndefined();
  });

  it("a hero on a mission is away", () => {
    const a = nessa();
    a.currentHp = calcAdventurerMaxHp(a);
    a.onMission = true;
    expect(awayReason(a)).toBe("away on a mission");
  });

  it("venom benches a hero outright, ahead of any wound", () => {
    const a = nessa();
    a.currentHp = calcAdventurerMaxHp(a);
    a.conditions = [{ type: "venom" } as never];
    expect(awayReason(a)).toBe("too ill to work");
  });

  it("a wound slows a hero without sending them away", () => {
    const a = nessa();
    a.currentHp = Math.max(1, Math.floor(calcAdventurerMaxHp(a) / 2));
    expect(awayReason(a)).toBe("hurt, and working slow");
  });
});

describe("adventurers — the roster, the living only", () => {
  it("leaves out the fallen: they are remembered at the shrine, not here", () => {
    const alive = nessa();
    const dead = buildRecruitFromPremadeId("a2", "char_001", 3)!;
    dead.alive = false;
    const list = adventurers(stateWith({ adventurers: [alive, dead] }));
    expect(list.map((p) => p.id)).toEqual(["a1"]);
  });

  it("carries the live record through, so the card can draw their bars", () => {
    const a = nessa();
    expect(adventurers(stateWith({ adventurers: [a] }))[0].adventurer).toBe(a);
  });

  it("reads healthy at full HP, and gives the percentage once hurt", () => {
    const a = nessa();
    a.currentHp = calcAdventurerMaxHp(a);
    expect(adventurers(stateWith({ adventurers: [a] }))[0].health)
      .toEqual({ dot: "good", text: "Healthy" });

    a.currentHp = Math.floor(calcAdventurerMaxHp(a) / 2);
    const hurt = adventurers(stateWith({ adventurers: [a] }))[0].health;
    expect(hurt.dot).toBe("fair");
    expect(hurt.text).toMatch(/^Wounded \(\d+% health\)$/);
  });

  it("a hero on a mission says so instead of naming a post", () => {
    const a = nessa();
    a.onMission = true;
    const s = stateWith({
      adventurers: [a],
      buildings: [{ buildingId: buildingOfAdventurer(a.premadeId)!, level: 1 }] as never,
    });
    expect(adventurers(s)[0].work.text).toBe("Away on a mission");
  });

  it("names the post and the pace for a hero standing at their building", () => {
    const a = nessa();
    a.currentHp = calcAdventurerMaxHp(a);
    const bid = buildingOfAdventurer(a.premadeId);
    expect(bid).toBeDefined();
    const s = stateWith({ adventurers: [a], buildings: [{ buildingId: bid!, level: 1 }] as never });
    expect(adventurers(s)[0].work).toEqual({ dot: "good", text: expect.stringMatching(/\(100%\)$/) });
  });

  it("a hurt hero at their post shows the pace drop before the yield falls", () => {
    const a = nessa();
    a.currentHp = Math.max(1, Math.floor(calcAdventurerMaxHp(a) * 0.3));
    const bid = buildingOfAdventurer(a.premadeId)!;
    const s = stateWith({ adventurers: [a], buildings: [{ buildingId: bid, level: 1 }] as never });
    expect(adventurers(s)[0].work.dot).not.toBe("good");
  });
});

describe("visitors — only whoever stands at the stall", () => {
  it("is empty when no stall stands", () => {
    expect(visitors(stateWith())).toEqual([]);
  });

  it("names the merchant whose stall stands now", () => {
    const s = stateWith({ merchantStall: { merchantId: "lammast_wagon" } as never });
    expect(visitors(s).map((p) => p.id)).toEqual(["lammast_wagon"]);
  });

  it("stays empty for a merchant id the registry does not know", () => {
    const s = stateWith({ merchantStall: { merchantId: "nobody" } as never });
    expect(visitors(s)).toEqual([]);
  });
});

describe("the whole page — one person, one card", () => {
  // Father Corin exists twice in the game: as the founder `father_corin` and as
  // the NPC ally `corin`. The page must never show him twice.
  it("gives every person a key of their own across the three groups", () => {
    const a = nessa();
    const s = stateWith({
      adventurers: [a],
      merchantStall: { merchantId: "lammast_wagon" } as never,
    });
    const all: FolkPerson[] = [...settlers(s), ...adventurers(s), ...visitors(s)];
    const keys = all.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every person carries a name to draw", () => {
    const s = stateWith({ adventurers: [nessa()] });
    for (const p of [...settlers(s), ...adventurers(s)]) {
      expect(p.name.length).toBeGreaterThan(0);
    }
  });
});

describe("catchablePoolFor — illness reaches a person, not a building", () => {
  it("a founder with no trade can still catch what spreads", () => {
    // The point of the whole change. While the key was a building, these three
    // could never fall ill, because they work nowhere.
    const pool = catchablePoolFor(undefined);
    expect(pool.length).toBeGreaterThan(0);
    for (const a of pool) expect(a.contagious).toBe(true);
  });

  it("a founder with a trade catches the hazards of that trade", () => {
    const bid = buildingOfFounder("jory");
    expect(bid).toBeDefined();
    const pool = catchablePoolFor(bid);
    expect(pool.length).toBeGreaterThan(0);
    for (const a of pool) expect(a.buildings).toContain(bid);
  });

  it("never offers an ailment you can only reach by escalation", () => {
    for (const bid of [undefined, buildingOfFounder("jory"), buildingOfFounder("tomas")]) {
      for (const a of catchablePoolFor(bid)) expect(a.catchable).not.toBe(false);
    }
  });
});
