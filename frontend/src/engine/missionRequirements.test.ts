import { describe, it, expect } from "vitest";
import { meetsRequirements } from "@medieval-realm/shared/data/missions";
import type { MissionBoardContext } from "@medieval-realm/shared/data/missions";

const base: MissionBoardContext = { guildLevel: 1 };

describe("meetsRequirements — new gates", () => {
  it("missionCount: gated until the tally reaches the count", () => {
    const req = { missionCount: { id: "fen_barter", count: 3 } };
    expect(meetsRequirements(req, base)).toBe(false);                                   // no completions
    expect(meetsRequirements(req, { ...base, missionCompletions: { fen_barter: 2 } })).toBe(false);
    expect(meetsRequirements(req, { ...base, missionCompletions: { fen_barter: 3 } })).toBe(true);
    expect(meetsRequirements(req, { ...base, missionCompletions: { fen_barter: 9 } })).toBe(true);
  });

  it("hasClass: gated until an alive adventurer of that class is on the roster", () => {
    const req = { hasClass: "priest" as const };
    expect(meetsRequirements(req, base)).toBe(false);                                   // empty roster
    expect(meetsRequirements(req, { ...base, rosterClasses: ["warrior", "archer"] })).toBe(false);
    expect(meetsRequirements(req, { ...base, rosterClasses: ["archer", "priest"] })).toBe(true);
  });

  it("tavernReputation: gated below the threshold", () => {
    const req = { tavernReputation: 40 };
    expect(meetsRequirements(req, { ...base, tavernReputation: 39 })).toBe(false);
    expect(meetsRequirements(req, { ...base, tavernReputation: 40 })).toBe(true);
  });

  it("no requirements → always met; multiple gates must ALL pass", () => {
    expect(meetsRequirements(undefined, base)).toBe(true);
    const req = { hasClass: "priest" as const, missionCount: { id: "fen_barter", count: 3 } };
    expect(meetsRequirements(req, { ...base, rosterClasses: ["priest"] })).toBe(false); // count unmet
    expect(meetsRequirements(req, {
      ...base, rosterClasses: ["priest"], missionCompletions: { fen_barter: 3 },
    })).toBe(true);
  });
});
