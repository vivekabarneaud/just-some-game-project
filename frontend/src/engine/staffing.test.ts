// @vitest-environment happy-dom
// (importing gameState.tsx pulls in the Solid GameProvider template, which needs a DOM)
import { describe, it, expect } from "vitest";
import { getBuildingStaffing, workEffectiveness, type GameState } from "~/engine/gameState";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import { calcAdventurerMaxHp } from "@medieval-realm/shared/data/expeditionEngine";

// A wounded or ill worker still shows up, but pulls less than a full share, so
// their building produces less. This guards that HP (and serious conditions)
// drive the staffing multiplier — not just deployment. Uses the hunting camp
// (staffed by Nessa, char_000) at level 1: capacity 1, floor 0.5.

const nessa = () => buildRecruitFromPremadeId("n", "char_000", 3)!;
// Minimal state: getBuildingStaffing for an adventurer-staffed building only
// reads s.adventurers + s.buildingWorkers (no founders on the hunting camp).
const stateWith = (adv: ReturnType<typeof nessa>): GameState =>
  ({ adventurers: [adv], buildingWorkers: {} } as unknown as GameState);
const mult = (adv: ReturnType<typeof nessa>) =>
  getBuildingStaffing(stateWith(adv), "hunting_camp", 1).multiplier;

describe("workEffectiveness — HP drives a worker's pace", () => {
  it("is full while healthy (a scratch doesn't slow the work)", () => {
    expect(workEffectiveness(1)).toBe(1);
    expect(workEffectiveness(0.5)).toBe(1);
  });
  it("ramps down once genuinely wounded, to 0 at death's door", () => {
    expect(workEffectiveness(0.25)).toBeCloseTo(0.5);
    expect(workEffectiveness(0.375)).toBeCloseTo(0.75);
    expect(workEffectiveness(0)).toBe(0);
  });
});

describe("getBuildingStaffing — a hurt worker produces less", () => {
  it("a healthy present adventurer staffs at full", () => {
    const a = nessa();
    a.currentHp = calcAdventurerMaxHp(a); // full HP
    expect(mult(a)).toBe(1);
  });

  it("a wounded (below the knee) adventurer drags the building below full", () => {
    const a = nessa();
    a.currentHp = calcAdventurerMaxHp(a) * 0.375; // → workEffectiveness 0.75
    const m = mult(a);
    expect(m).toBeLessThan(1);
    expect(m).toBeGreaterThan(0.5); // still above the empty-slot floor
    expect(m).toBeCloseTo(0.75);
  });

  it("a venomed adventurer is benched (down to the understaffed floor)", () => {
    const a = nessa();
    a.currentHp = calcAdventurerMaxHp(a);
    a.conditions = [{ type: "venom", remainingRounds: 99 }];
    expect(mult(a)).toBe(0.5); // floor — no better than an empty slot
  });

  it("a deployed adventurer floors the building, as before", () => {
    const a = nessa();
    a.currentHp = calcAdventurerMaxHp(a);
    a.onMission = true;
    expect(mult(a)).toBe(0.5);
  });
});

describe("getBuildingStaffing — a founder ailment dips the building", () => {
  // The quarry is staffed by the founder Tomas; an ailment on it reduces his
  // share (the same lever a wounded adventurer pulls).
  const quarry = (ailments?: GameState["buildingAilments"]): GameState =>
    ({ adventurers: [], buildingWorkers: {}, buildingAilments: ailments } as unknown as GameState);
  const qmult = (a?: GameState["buildingAilments"]) => getBuildingStaffing(quarry(a), "quarry", 1).multiplier;

  it("a well founder staffs at full", () => {
    expect(qmult()).toBe(1);
  });

  it("an injured founder drags the quarry below full", () => {
    const m = qmult({ quarry: { ailmentId: "bad_cut", founderId: "tomas", hoursRemaining: 12 } });
    expect(m).toBeLessThan(1);
    expect(m).toBeCloseTo(0.65); // 1 − bad_cut workPenalty (0.35)
  });
});
