import { describe, it, expect } from "vitest";
import type { CombatUnit } from "@medieval-realm/shared/data/combat";
import {
  scoreTarget, reachFactor, conditionOf, isolationOf, softnessOf, threatOf, gangedOf,
  roleOf, BASE, REACH_FALLOFF, SUPPORT_RADIUS, type TargetWeights,
} from "@medieval-realm/shared/data/combat/targetScore";

// The weighted score (docs/design/combat/TARGETING.md). The load-bearing rule is
// that EVERY dimension returns 0..1 with all magnitude in the weight — the old
// scoredPick mixed a 0..100 term with a 0..20 one, so softness silently
// dominated 5:1 and "squishiest" was the de-facto default for every enemy.

const u = (id: string, over: Partial<CombatUnit> = {}): CombatUnit =>
  ({ id, name: id, hp: 40, maxHp: 40, x: 30, kind: "adventurer", isEnemy: false,
     str: 5, dex: 5, int: 3, vit: 4, wis: 3, gearDefense: 0, cooldowns: {},
     slowed: 0, poisonTicks: [], statDebuffs: [], threatTable: {}, ...over }) as CombatUnit;
const foe = (over: Partial<CombatUnit> = {}) =>
  u("foe", { isEnemy: true, kind: "enemy", x: 68, ...over });

describe("every dimension is 0..1", () => {
  it("condition: fresh reads 0, dead-ish reads ~1, and it never escapes the range", () => {
    expect(conditionOf(u("a"))).toBe(0);
    expect(conditionOf(u("a", { hp: 0 }))).toBeCloseTo(0.8, 5);
    expect(conditionOf(u("a", { hp: 0, slowed: 2 }))).toBe(1);
    // A debuff alone is a nudge, not a verdict.
    expect(conditionOf(u("a", { slowed: 1 }))).toBeCloseTo(0.2, 5);
  });

  it("isolation: 1 alone, 0.5 with one beside them, 0.33 with two", () => {
    const t = u("t", { x: 30 });
    expect(isolationOf(t, [t])).toBe(1);
    expect(isolationOf(t, [t, u("b", { x: 34 })])).toBeCloseTo(0.5, 5);
    expect(isolationOf(t, [t, u("b", { x: 34 }), u("c", { x: 26 })])).toBeCloseTo(1 / 3, 5);
    // Beyond the support radius they are not "beside" anyone.
    expect(isolationOf(t, [t, u("far", { x: 30 + SUPPORT_RADIUS + 5 })])).toBe(1);
    // The dead and the fled do not hold your hand.
    expect(isolationOf(t, [t, u("dead", { x: 32, hp: 0 })])).toBe(1);
    expect(isolationOf(t, [t, u("gone", { x: 32, fled: true })])).toBe(1);
  });

  it("softness: an armoured parrying tank scores below a cloth target", () => {
    const attacker = foe();
    const soft = softnessOf(attacker, u("cloth", { gearDefense: 0 }));
    const hard = softnessOf(attacker, u("plate", { gearDefense: 400 }));
    expect(soft).toBeGreaterThan(hard);
    for (const v of [soft, hard]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
  });

  it("threat normalises against the attacker's OWN angriest candidate", () => {
    const a = foe({ threatTable: { x: 500, y: 100 } });
    const x = u("x"), y = u("y"), z = u("z");
    expect(threatOf(a, x, [x, y, z])).toBe(1);        // the max reads 1, whatever the raw size
    expect(threatOf(a, y, [x, y, z])).toBeCloseTo(0.2, 5);
    expect(threatOf(a, z, [x, y, z])).toBe(0);
    // No threat anywhere: the dimension goes quiet rather than dividing by zero.
    expect(threatOf(foe({ threatTable: {} }), x, [x, y])).toBe(0);
  });

  it("ganged: the fraction of living packmates already committed", () => {
    const a = foe();
    const t = u("t");
    const mate = (id: string, on?: string) => foe({ id, lastTargetId: on }) as CombatUnit;
    expect(gangedOf(a, t, [])).toBe(0);
    expect(gangedOf(a, t, [mate("m1", "t"), mate("m2", "t")])).toBe(1);
    expect(gangedOf(a, t, [mate("m1", "t"), mate("m2", "other")])).toBeCloseTo(0.5, 5);
    // The attacker never counts itself.
    expect(gangedOf(a, t, [a])).toBe(0);
  });

  it("roles read intent, not class names", () => {
    expect(roleOf(u("p", { class: "priest" }))).toBe("healer");
    expect(roleOf(u("w", { class: "wizard" }))).toBe("caster");
    expect(roleOf(u("a", { class: "archer" }))).toBe("ranged");
    expect(roleOf(u("s", { class: "assassin" }))).toBe("skirmisher");
    expect(roleOf(u("f", { class: "warrior" }))).toBe("frontline");
    expect(roleOf(u("n", {}))).toBe("frontline"); // no class = a body in the line
  });
});

describe("reach is the one multiplier, and it is band-aware", () => {
  it("inside my weapon band reads 1", () => {
    const melee = foe({ x: 68, weapons: [{ kind: "primary", minRange: 0, maxRange: 5, dmgMin: 1, dmgMax: 2 }] as any });
    expect(reachFactor(melee, u("t", { x: 66 }))).toBe(1);
  });

  it("a whole-field bow makes everyone zero turns away — the band, not contact", () => {
    // This is the review catch: computing turns-to-CONTACT would make a back-row
    // shooter believe every target was distant.
    const archerFoe = foe({ x: 82, weapons: [{ kind: "primary", minRange: 6, maxRange: 100, dmgMin: 1, dmgMax: 2 }] as any });
    expect(reachFactor(archerFoe, u("near", { x: 70 }))).toBe(1);
    expect(reachFactor(archerFoe, u("far", { x: 20 }))).toBe(1);
  });

  it("falls off with turns-to-arrive, scaled by MY legs", () => {
    const slow = foe({ x: 68, dex: 1, raw: {} });
    const fast = foe({ x: 68, dex: 1, raw: { mobility: 30 } });
    const target = u("t", { x: 20 });
    expect(reachFactor(fast, target)).toBeGreaterThan(reachFactor(slow, target));
    for (const r of [reachFactor(fast, target), reachFactor(slow, target)]) {
      expect(r).toBeGreaterThan(0); expect(r).toBeLessThanOrEqual(1);
    }
    expect(REACH_FALLOFF).toBeGreaterThan(0);
  });
});

describe("the score composes", () => {
  it("BASE is calibrated so a weight of 1 is a real preference, not decoration", () => {
    // taste range = (BASE + w) / BASE. At BASE=1 a weight of 1 buys only 2:1
    // while reach spans up to ~7:1, so distance would drown every taste.
    expect((BASE + 1) / BASE).toBeGreaterThanOrEqual(4);
  });

  it("no weights at all = hit the closest thing I can reach", () => {
    // `nearest` is not a mode any more: it falls out of the creature's legs.
    const a = foe({ x: 68, raw: {} });
    const near = u("near", { x: 60 }), far = u("far", { x: 20 });
    const ctx = { line: [near, far], pool: [near, far] };
    expect(scoreTarget(a, near, {}, ctx)).toBeGreaterThan(scoreTarget(a, far, {}, ctx));
  });

  it("a zero in one dimension does NOT zero the target (additive, not multiplicative)", () => {
    // The reason terms are added: a healer-weighted mage must still be able to
    // attack a warrior when no healer is on the field.
    const a = foe();
    const warrior = u("w", { class: "warrior" });
    const w: TargetWeights = { roles: { healer: 1 } };
    expect(scoreTarget(a, warrior, w, { line: [warrior], pool: [warrior] })).toBeGreaterThan(0);
  });

  it("sticky nudges toward the current target without locking on", () => {
    const a = foe({ lastTargetId: "old", raw: { mobility: 30 } });
    const old = u("old", { x: 40 }), fresh = u("fresh", { x: 40 });
    const ctx = { line: [old, fresh], pool: [old, fresh] };
    const w: TargetWeights = { sticky: 0.2 };
    // All else equal, it keeps swinging at the same one...
    expect(scoreTarget(a, old, w, ctx)).toBeGreaterThan(scoreTarget(a, fresh, w, ctx));
    // ...but a genuinely juicier target still peels it off.
    const juicy = u("fresh", { x: 40, hp: 2 });
    const w2: TargetWeights = { sticky: 0.2, condition: 1 };
    expect(scoreTarget(a, juicy, w2, { line: [old, juicy], pool: [old, juicy] }))
      .toBeGreaterThan(scoreTarget(a, old, w2, { line: [old, juicy], pool: [old, juicy] }));
  });
});
