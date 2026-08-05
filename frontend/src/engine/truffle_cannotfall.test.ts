import { describe, it, expect } from "vitest";
import { simulateCombat } from "@medieval-realm/shared/data/combat";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import { NOVICE_MISSIONS } from "@medieval-realm/shared/data/missions";

// The Greyfang arc's escorts field Truffle as a cannotFall ally: the pack can
// never actually put the good boy down (his fall is reserved for a scripted
// beat). This guards that, and prints his HP floor + win rate so we can judge
// whether he ever needs the guard-instinct disengage.
describe("Truffle — the good boy cannot fall in the fold escorts", () => {
  const team = () => [
    buildRecruitFromPremadeId("a", "char_000", 3)!, // Brenna, archer
    buildRecruitFromPremadeId("b", "char_021", 3)!, // Godric, warrior
  ];

  for (const missionId of ["fold_vigil", "night_howling"]) {
    it(`${missionId}: Truffle never goes down`, () => {
      const mission = NOVICE_MISSIONS.find((m) => m.id === missionId)!;
      let runs = 0, wins = 0, downed = 0, minHp = Infinity;
      for (let s = 0; s < 200; s++) {
        const res = simulateCombat(mission, team(), undefined, s);
        if (!res) continue;
        runs++;
        if (res.victory) wins++;
        for (const e of res.log) {
          if (!e.targetName?.startsWith("Truffle")) continue;
          if (typeof e.targetHp === "number") minHp = Math.min(minHp, e.targetHp);
          if (e.killed) downed++;
        }
      }
      // eslint-disable-next-line no-console
      console.log(`${missionId}: runs=${runs} winRate=${(wins / runs).toFixed(2)} truffleDowned=${downed} truffleMinHp=${minHp === Infinity ? "n/a" : minHp}`);
      expect(runs).toBeGreaterThan(0);
      expect(downed).toBe(0); // the good boy always makes it home
    });
  }
});
