import { describe, it, expect } from "vitest";
import { applySupplies } from "@medieval-realm/shared/data/combat/setup";
import type { CombatUnit } from "@medieval-realm/shared/data/combat/types";
import type { AdventurerMissionSupplies } from "@medieval-realm/shared/data/missions";

// A brewed potion carried into combat applies its buffs at fight start (via the
// supply's resolved brewEffects). First slice: stats, +damage%, +defense%, heal.

const unit = (over: Partial<CombatUnit>): CombatUnit =>
  ({ id: "a1", name: "Hero", icon: "🗡️", kind: "adventurer", isEnemy: false,
     hp: 50, maxHp: 100, str: 5, dex: 5, int: 5, vit: 5, wis: 5, ...over } as CombatUnit);
const withBrew = (effects: AdventurerMissionSupplies["brewEffects"]): CombatUnit => {
  const u = unit({});
  applySupplies([u], [{ id: "a1" } as any], { a1: { brewEffects: effects } }, true);
  return u;
};

describe("brewed potion buffs applied at combat start", () => {
  it("a +INT brew raises the unit's INT for the fight", () => {
    const u = withBrew([{ channel: "int", amount: 3 }]);
    expect(u.int).toBe(8); // 5 + 3
  });

  it("a +damage% brew sets a damage boost", () => {
    const u = withBrew([{ channel: "damage_pct", amount: 15 }]);
    expect(u.damageBoost?.pct).toBe(15);
  });

  it("a +defense% brew sets a defense boost", () => {
    const u = withBrew([{ channel: "defense_pct", amount: 20 }]);
    expect(u.defenseBoost?.pct).toBe(20);
  });

  it("a heal brew heals the wounded unit at the start", () => {
    const u = withBrew([{ channel: "heal_hp", amount: 20 }]); // 50 → 70
    expect(u.hp).toBe(70);
  });

  it("a sub-stat brew raises the raw sub-stat", () => {
    const u = withBrew([{ channel: "crit", amount: 10 }]);
    expect(u.raw?.crit).toBe(10);
  });

  it("offensive channels are ignored in this slice (no crash, no buff)", () => {
    const u = withBrew([{ channel: "poison", amount: 5, rounds: 3 }]);
    expect(u.int).toBe(5); // untouched
    expect(u.damageBoost).toBeUndefined();
  });
});
