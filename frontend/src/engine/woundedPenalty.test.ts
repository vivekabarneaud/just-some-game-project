import { describe, it, expect } from "vitest";
import { woundedDamageMult } from "@medieval-realm/shared/data/combat";
import type { CombatUnit } from "@medieval-realm/shared/data/combat/types";

// woundedDamageMult only reads hp/maxHp/headcount/talents — build minimal units.
const unit = (over: Partial<CombatUnit>): CombatUnit => ({ maxHp: 100, hp: 100, ...over } as CombatUnit);

describe("woundedDamageMult — wounded fighters hit softer", () => {
  it("no penalty at or above 40% HP", () => {
    expect(woundedDamageMult(unit({ hp: 100 }))).toBe(1);
    expect(woundedDamageMult(unit({ hp: 40 }))).toBe(1);
    expect(woundedDamageMult(unit({ hp: 41 }))).toBe(1);
  });

  it("scales down below 40%, to a 0.5 floor at death's door", () => {
    expect(woundedDamageMult(unit({ hp: 20 }))).toBeCloseTo(0.75); // halfway into the band
    expect(woundedDamageMult(unit({ hp: 0.01 }))).toBeGreaterThan(0.5);
    expect(woundedDamageMult(unit({ hp: 0.01 }))).toBeLessThan(0.55);
    // Monotonic: more wounded → lower multiplier.
    expect(woundedDamageMult(unit({ hp: 10 }))).toBeLessThan(woundedDamageMult(unit({ hp: 30 })));
  });

  it("'unflinching' talent ignores the penalty", () => {
    expect(woundedDamageMult(unit({ hp: 10, talents: ["unflinching"] }))).toBe(1);
  });

  it("'last_stand' inverts it — harder as they bleed", () => {
    expect(woundedDamageMult(unit({ hp: 10, talents: ["last_stand"] }))).toBeGreaterThan(1);
    // Fully bled → +50%.
    expect(woundedDamageMult(unit({ hp: 0.0001, talents: ["last_stand"] }))).toBeCloseTo(1.5, 1);
  });

  it("headcount stacks are exempt (they scale by hp fraction elsewhere)", () => {
    expect(woundedDamageMult(unit({ hp: 10, headcount: 5, hpPerUnit: 20 }))).toBe(1);
  });
});
