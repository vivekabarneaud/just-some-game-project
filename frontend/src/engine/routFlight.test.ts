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

const run = (enemyId: string, seed: number) =>
  simulateCombat(mission, [warrior, archer], undefined, seed, { encounters: [{ enemyId, count: 1 }] });

describe("bolts — the boar runs and the fight chases it off the field", () => {
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
      const res = run("displaced_brigand", seed);
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
    expect(pickTargetForAdventurer(archer, [runner])?.id).toBe("runner");
  });
});
