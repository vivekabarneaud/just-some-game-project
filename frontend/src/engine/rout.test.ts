import { describe, it, expect } from "vitest";
import { simulateCombat } from "@medieval-realm/shared/data/combat";
import { getEnemy } from "@medieval-realm/shared/data/enemies";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import { NOVICE_MISSIONS } from "@medieval-realm/shared/data/missions";

// Any template works — we override its encounters. gather_timber is [0].
const mission = NOVICE_MISSIONS[0];
// A modest rank-1 warrior (Bronwyn). Beats a lone wolf easily; small per-hit
// damage means the wolf's HP passes through the rout window most fights.
const warrior = buildRecruitFromPremadeId("test_warrior", "char_018", 1)!;

describe("enemy rout — beasts break and run", () => {
  it("beasts carry a routsAt; maddened beasts and undead fight to the end", () => {
    expect(getEnemy("gaunt_wolf")?.routsAt).toBeGreaterThan(0);
    expect(getEnemy("wild_wolf")?.routsAt).toBeGreaterThan(0);
    expect(getEnemy("alpha_wolf")?.routsAt).toBeGreaterThan(0);
    // Maddened (rabid / tainted) and undead have no fear to break — no rout.
    expect(getEnemy("rabid_boar")?.routsAt).toBeUndefined();
    expect(getEnemy("tainted_patriarch_boar")?.routsAt).toBeUndefined();
    expect(getEnemy("cursed_spirit")?.routsAt).toBeUndefined();
  });

  it("a shed fang survives a rout; the hide and sinew do not", () => {
    const wolf = getEnemy("wild_wolf")!;
    const fang = wolf.loot!.find((d) => d.type === "resource" && d.resource === "fang");
    const hide = wolf.loot!.find((d) => d.type === "resource" && d.resource === "wolfhide_strip");
    const sinew = wolf.loot!.find((d) => d.type === "resource" && d.resource === "sinew_cord");
    expect(fang?.keepOnRout).toBe(true);
    expect(hide?.keepOnRout).toBeFalsy();
    expect(sinew?.keepOnRout).toBeFalsy();
  });

  it("wolves break and run in normal fights — a win without a kill", () => {
    let routs = 0;
    for (let seed = 0; seed < 50; seed++) {
      const res = simulateCombat(mission, [warrior], undefined, seed, {
        encounters: [{ enemyId: "wild_wolf", count: 1 }],
      });
      if (!res) continue;
      // A rank-1 warrior always beats one lone wolf (routed or killed = win).
      expect(res.victory).toBe(true);
      if (res.log.some((e) => e.beat === "flee_success" && e.isEnemy === true)) routs++;
    }
    // Across 50 seeds the rout mechanic fires (most fights end in a break).
    expect(routs).toBeGreaterThan(0);
  });
});
