import { describe, it, expect } from "vitest";
import { simulateCombat, pickTargetForAdventurer, type CombatUnit, type CombatContext } from "@medieval-realm/shared/data/combat";
import { FLIGHT, POS, mobilityOf, computeHolds } from "@medieval-realm/shared/data/combat/positional";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import { NOVICE_MISSIONS } from "@medieval-realm/shared/data/missions";

// Rout as MOVEMENT (ROUT_AND_FLIGHT): a broken enemy's fear style shapes its
// exit. bolts = flat-out run for its own field edge, elusive vs ranged;
// withdraws = a wary backstep, hittable, still bites; yields = the weapon goes
// down where they stand. The sim is stochastic, so integration cases run many
// seeds and assert what must hold on every outcome.

const mission = NOVICE_MISSIONS[0]; // any template — encounters are overridden
const warrior = buildRecruitFromPremadeId("test_warrior", "char_018", 1)!;
// The archer matters: a lone warrior (mobility 12) can NEVER catch a bolting
// boar (~16/round) — which is the design working, not a bug — so slaying one
// mid-flight takes ranged damage. Nessa shooting the running boar is the
// motivating scene of the whole feature.
const archer = buildRecruitFromPremadeId("test_nessa", "char_000", 1)!;

const run = (enemyId: string, seed: number, quarter: "given" | "none" = "none") =>
  simulateCombat(mission, [warrior, archer], undefined, seed, { encounters: [{ enemyId, count: 1 }], quarter });

describe("bolts — the boar runs and the fight chases it off the field", () => {
  // Run them down: the chase is only a fight when the team was told to make it
  // one. Under the merciful default the same boar is simply let go — that case
  // is the "quarter" block below.
  it("a broken boar turns tail, then either escapes into the wilds or dies running", () => {
    let broke = 0, escaped = 0, slainAfterBreaking = 0;
    for (let seed = 0; seed < 60; seed++) {
      const res = run("wild_boar", seed);
      if (!res) continue;
      expect(res.victory).toBe(true); // routed-or-killed is a win either way
      const turnRound = res.log.find((e) => e.beat === "turns_tail")?.round;
      if (turnRound == null) continue; // killed before its nerve broke
      broke++;
      const gone = res.log.find((e) => e.beat === "flee_success" && e.isEnemy);
      const slain = res.log.some((e) => e.isEnemy === false && e.killed);
      // No instant vanish: escaping takes actual rounds of running.
      if (gone) {
        escaped++;
        expect(gone.round).toBeGreaterThanOrEqual(turnRound);
      } else {
        expect(slain, `seed ${seed}: boar broke but neither escaped nor died`).toBe(true);
        slainAfterBreaking++;
      }
    }
    // Across 60 seeds all three outcomes occur: the mechanic fires, some get
    // away, and some are run down — the chase is real in both directions.
    expect(broke).toBeGreaterThan(0);
    expect(escaped).toBeGreaterThan(0);
    expect(slainAfterBreaking).toBeGreaterThan(0);
  });
});

describe("yields — a broken human stops fighting where they stand", () => {
  it("the brigand throws down their weapon: no flight, out of the fight, a win", () => {
    let yielded = 0;
    for (let seed = 0; seed < 60; seed++) {
      const res = run("displaced_brigand", seed, "none");
      if (!res) continue;
      const y = res.log.find((e) => e.beat === "yields");
      if (!y) continue;
      yielded++;
      expect(y.note).toContain("throws down their weapon");
      // Yielding is instant — no turns_tail, no flight rounds, and a win.
      expect(res.log.some((e) => e.beat === "turns_tail")).toBe(false);
      expect(res.victory).toBe(true);
    }
    expect(yielded).toBeGreaterThan(0);
  });
});

describe("flight tuning invariants", () => {
  it("bolting is strictly faster than withdrawing, and the elusion peak is real", () => {
    expect(FLIGHT.boltMult).toBeGreaterThan(FLIGHT.withdrawMult);
    // Denied quarter, a creature runs for its life rather than breaking off.
    expect(FLIGHT.deniedBoost).toBeGreaterThan(1);
    expect(FLIGHT.boltElusion).toBeGreaterThan(0);
  });

  it("a bolting boar clears the field before the round cap with rounds to spare", () => {
    // Worst case: broken at the ally front line, running to fieldMax.
    const boar = { class: undefined, dex: 3, raw: {} } as unknown as CombatUnit;
    const perRound = Math.max(4, Math.round(mobilityOf(boar) * FLIGHT.boltMult));
    const worstDistance = POS.fieldMax - POS.allyFront;
    expect(Math.ceil(worstDistance / perRound)).toBeLessThanOrEqual(6);
  });
});

describe("a runner holds nothing", () => {
  // computeHolds counts non-ranged units as holders of the opposing front. It
  // filters `fled` via living(), but a unit MID-flight is still on the field —
  // so without excluding `fleeing` a boar running for the treeline would keep
  // contributing hold capacity and pin the very people chasing it.
  const mk = (id: string, over: Partial<CombatUnit>): CombatUnit =>
    ({ id, name: id, hp: 20, maxHp: 20, x: 60, kind: "enemy", isEnemy: true,
       str: 5, dex: 5, int: 1, vit: 5, wis: 1, cooldowns: {}, slowed: 0,
       poisonTicks: [], statDebuffs: [], threatTable: {}, ...over }) as CombatUnit;

  it("a fleeing enemy stops holding the line, so pursuers are free to advance", () => {
    const warrior = mk("w", { kind: "adventurer", isEnemy: false, class: "warrior", x: 30 });
    const boar = mk("boar", { x: 60 });
    const ctx = { adventurers: [warrior], enemies: [boar] } as unknown as CombatContext;

    // Standing: the boar is the front line, so it holds the advancing warrior.
    expect(computeHolds(ctx).has("w")).toBe(true);

    // Turned tail: nothing with its back turned holds anyone.
    boar.fleeing = true;
    expect(computeHolds(ctx).has("w")).toBe(false);
  });
});

describe("threats first, runners after", () => {
  const foe = (id: string, over: Partial<CombatUnit>): CombatUnit =>
    ({ id, name: id, hp: 20, maxHp: 20, x: 70, isEnemy: true, kind: "enemy",
       str: 5, dex: 5, int: 1, vit: 5, wis: 1, cooldowns: {}, slowed: 0,
       poisonTicks: [], statDebuffs: [], threatTable: {}, ...over }) as CombatUnit;
  const archer = { id: "a", name: "a", hp: 30, maxHp: 30, x: 20, kind: "adventurer",
       class: "archer", str: 3, dex: 8, int: 2, vit: 4, wis: 3, cooldowns: {},
       slowed: 0, poisonTicks: [], statDebuffs: [], threatTable: {} } as unknown as CombatUnit;

  it("a fleeing enemy is ignored while its mate still fights", () => {
    const fighter = foe("fighter", {});
    const runner = foe("runner", { fleeing: true, hp: 2 }); // nearly dead — juicier, and still ignored
    for (let i = 0; i < 20; i++) {
      expect(pickTargetForAdventurer(archer, [fighter, runner])?.id).toBe("fighter");
    }
  });

  it("once only runners remain, the chase is the fight", () => {
    const runner = foe("runner", { fleeing: true });
    expect(pickTargetForAdventurer(archer, [runner], "none")?.id).toBe("runner");
  });

  it("given quarter, a field of runners is nobody to swing at", () => {
    const runner = foe("runner", { fleeing: true });
    expect(pickTargetForAdventurer(archer, [runner], "given")).toBeNull();
  });

  it("a man who threw down his weapon is not a target unless no quarter was given", () => {
    const kneeling = foe("kneeling", { yielded: true });
    expect(pickTargetForAdventurer(archer, [kneeling], "given")).toBeNull();
    expect(pickTargetForAdventurer(archer, [kneeling], "none")?.id).toBe("kneeling");
  });
});

// The Quarter order is the player's, and it is the whole point of the feature:
// the settlement drives enemies off rather than slaughtering them, unless the
// Lord says otherwise. These assert the RULE, never a balance number.
describe("quarter — what the team does with an enemy who breaks", () => {
  it("given quarter, a boar that breaks is let go: alive, unhurt further, and still a win", () => {
    let spared = 0;
    for (let seed = 0; seed < 60; seed++) {
      const res = run("wild_boar", seed, "given");
      if (!res) continue;
      const turned = res.log.findIndex((e) => e.beat === "turns_tail");
      if (turned < 0) continue; // killed before its nerve broke
      spared++;
      // Nothing lands on it after it breaks. This is the bug the feature fixes.
      const struckAfter = res.log.slice(turned + 1).some((e) => e.isEnemy === false && e.damage > 0);
      expect(struckAfter, `seed ${seed}: the team kept hitting a boar that had already broken`).toBe(false);
      expect(res.log.some((e) => e.beat === "quarter_given")).toBe(true);
      // A cleared field is a win either way, and the runner still counts defeated.
      expect(res.victory).toBe(true);
    }
    expect(spared).toBeGreaterThan(0);
  });

  it("given quarter, a brigand who surrenders lives", () => {
    let knelt = 0;
    for (let seed = 0; seed < 60; seed++) {
      const res = run("displaced_brigand", seed, "given");
      if (!res) continue;
      const y = res.log.findIndex((e) => e.beat === "yields");
      if (y < 0) continue;
      knelt++;
      expect(res.log.slice(y + 1).some((e) => e.beat === "no_quarter")).toBe(false);
      expect(res.log.slice(y + 1).some((e) => e.isEnemy === false && e.killed)).toBe(false);
      expect(res.victory).toBe(true);
    }
    expect(knelt).toBeGreaterThan(0);
  });

  it("no quarter, the same brigand can be cut down where he knelt", () => {
    let executed = 0;
    for (let seed = 0; seed < 60; seed++) {
      const res = run("displaced_brigand", seed, "none");
      if (!res) continue;
      if (res.log.some((e) => e.beat === "no_quarter")) executed++;
    }
    expect(executed).toBeGreaterThan(0);
  });

  it("only the runners leave the field; a man who knelt stays where he is", () => {
    for (let seed = 0; seed < 30; seed++) {
      const res = run("displaced_brigand", seed, "given");
      if (!res) continue;
      const sweep = res.log.find((e) => e.beat === "quarter_given");
      if (!sweep) continue;
      const kneelerId = res.log.find((e) => e.beat === "yields")?.attackerId;
      if (kneelerId) expect(sweep.leaves ?? []).not.toContain(kneelerId);
    }
  });

  it("breaking is a state, and the two exits are different states", () => {
    const boar = run("wild_boar", 3, "given");
    const brigand = run("displaced_brigand", 3, "given");
    // A beast never surrenders and a man of this kind never bolts: which exit a
    // creature takes is its authored `fear`, not a runtime coin-flip.
    expect(boar?.log.some((e) => e.beat === "yields")).toBe(false);
    expect(brigand?.log.some((e) => e.beat === "turns_tail")).toBe(false);
  });
});
