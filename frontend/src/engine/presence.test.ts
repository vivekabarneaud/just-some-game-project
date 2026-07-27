import { describe, it, expect } from "vitest";
import { simulateCombat, buildAdventurerUnit } from "@medieval-realm/shared/data/combat";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import { NOVICE_MISSIONS } from "@medieval-realm/shared/data/missions";

const godric = () => buildRecruitFromPremadeId("g", "char_021", 3)!; // warrior
const maren = () => buildRecruitFromPremadeId("m", "char_006", 3)!;  // assassin
const brenna = () => buildRecruitFromPremadeId("b", "char_000", 3)!; // archer

describe("Presence — the tank draws aggro, the dps sheds it", () => {
  it("class floors set the threat multiplier", () => {
    expect(buildAdventurerUnit(godric()).threatMultiplier).toBeCloseTo(1.5);  // warrior +10
    expect(buildAdventurerUnit(maren()).threatMultiplier).toBeCloseTo(0.25);  // assassin -15
    expect(buildAdventurerUnit(brenna()).threatMultiplier).toBeCloseTo(0.6);  // archer -8
  });

  it("a tactical enemy focuses the warrior over the assassin from round 1", () => {
    let godricHits = 0, marenHits = 0;
    for (let s = 0; s < 40; s++) {
      // bandit_thug is tactical (follows threat); the Presence baseline seeds it round 1
      const res = simulateCombat(NOVICE_MISSIONS[0], [godric(), maren()], undefined, s, {
        encounters: [{ enemyId: "bandit_thug", count: 3 }],
      });
      if (!res) continue;
      for (const e of res.log) {
        if (!e.isEnemy || e.damage <= 0) continue;
        if (e.targetName.startsWith("Godric")) godricHits++;
        else if (e.targetName.startsWith("Maren")) marenHits++;
      }
    }
    expect(godricHits).toBeGreaterThan(marenHits); // the wall draws the blows
  });
});
