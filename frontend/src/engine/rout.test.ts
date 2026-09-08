import { describe, it, expect } from "vitest";
import { simulateCombat } from "@medieval-realm/shared/data/combat";
import { getEnemy } from "@medieval-realm/shared/data/enemies";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import { NOVICE_MISSIONS } from "@medieval-realm/shared/data/missions";

// Any template works — we override its encounters. gather_timber is [0].
const mission = NOVICE_MISSIONS[0];
// A modest rank-1 warrior (Bronwyn) in the starter kit. He does NOT reliably
// beat a lone wolf — measured 80% over 200 seeds once the wolf family was tuned
// (2026-09-05), which is the intended shape: one man alone against a wolf is a
// real risk. This suite asserts the rout MECHANIC, never the win rate.
const warrior = buildRecruitFromPremadeId("test_warrior", "char_018", 1)!;

describe("enemy rout — beasts break and run", () => {
  it("beasts carry a routsAt; boss/maddened beasts and undead fight to the end", () => {
    expect(getEnemy("gaunt_wolf")?.routsAt).toBeGreaterThan(0);
    expect(getEnemy("grey_wolf")?.routsAt).toBeGreaterThan(0);
    // The alpha is the deliberate reckoning — it stands and fights, no rout.
    expect(getEnemy("greyfang")?.routsAt).toBeUndefined();
    // Maddened (rabid / tainted) and undead have no fear to break — no rout.
    expect(getEnemy("rabid_boar")?.routsAt).toBeUndefined();
    expect(getEnemy("tainted_patriarch")?.routsAt).toBeUndefined();
    expect(getEnemy("grief_bound_spirit")?.routsAt).toBeUndefined();
  });

  it("a shed fang survives a rout; the hide and sinew do not", () => {
    const wolf = getEnemy("grey_wolf")!;
    const fang = wolf.loot!.find((d) => d.type === "resource" && d.resource === "fang");
    const hide = wolf.loot!.find((d) => d.type === "resource" && d.resource === "wolfhide_strip");
    const sinew = wolf.loot!.find((d) => d.type === "resource" && d.resource === "sinew_cord");
    expect(fang?.keepOnRout).toBe(true);
    expect(hide?.keepOnRout).toBeFalsy();
    expect(sinew?.keepOnRout).toBeFalsy();
  });

  it("wolves break and run in normal fights — a win without a kill", () => {
    let routs = 0, fought = 0, endedWithWolfAlive = 0;
    for (let seed = 0; seed < 50; seed++) {
      const res = simulateCombat(mission, [warrior], undefined, seed, {
        encounters: [{ enemyId: "grey_wolf", count: 1 }],
      });
      if (!res) continue;
      fought++;
      if (res.log.some((e) => e.beat === "flee_success" && e.isEnemy === true)) {
        routs++;
        // The point of the mechanic: the fight can END without the wolf dying.
        if (res.victory) endedWithWolfAlive++;
      }
    }
    expect(fought).toBeGreaterThan(0);
    // The rout mechanic fires, and a break can win the fight without a kill.
    expect(routs).toBeGreaterThan(0);
    expect(endedWithWolfAlive).toBeGreaterThan(0);
  });
});
