import { describe, it, expect } from "vitest";
import { buildResult } from "@medieval-realm/shared/data/combat/result";
import { setCombatSeed } from "@medieval-realm/shared/data/combat";
import type { CombatUnit } from "@medieval-realm/shared/data/combat/types";

// buildResult only reads id/kind/hp/maxHp/fled/poisonTicks/frothed off each unit —
// build minimal ones. An alive enemy means rollLoot has nothing to roll (killed
// enemies only), so the result is deterministic regardless of the seed.
const adv = (over: Partial<CombatUnit>): CombatUnit =>
  ({ id: "a", kind: "adventurer", hp: 60, maxHp: 100, poisonTicks: [], ...over } as CombatUnit);
const enemyAlive = (): CombatUnit =>
  ({ id: "e", kind: "enemy", hp: 10, maxHp: 10, poisonTicks: [] } as unknown as CombatUnit);

describe("The Froth — carried home by survivors", () => {
  it("a surviving frothed adventurer brings the froth home as a condition", () => {
    setCombatSeed(1);
    const res = buildResult([adv({ id: "a1", hp: 60, frothed: true })], [enemyAlive()], 1, [], 3);
    const conds = res.finalConditions?.["a1"] ?? [];
    expect(conds.some((c) => c.type === "froth")).toBe(true);
    // It doesn't decay on its own — carried with a live remainingRounds sentinel.
    const froth = conds.find((c) => c.type === "froth")!;
    expect(froth.remainingRounds).toBeGreaterThan(0);
  });

  it("an un-frothed survivor carries no froth", () => {
    setCombatSeed(1);
    const res = buildResult([adv({ id: "a2", hp: 60 })], [enemyAlive()], 1, [], 3);
    expect(res.finalConditions?.["a2"]?.some((c) => c.type === "froth") ?? false).toBe(false);
  });

  it("a fallen frothed adventurer does NOT carry it — the dead take the death roll, not a wound", () => {
    setCombatSeed(1);
    const res = buildResult([adv({ id: "a3", hp: 0, frothed: true })], [enemyAlive()], 1, [], 3);
    expect(res.finalConditions?.["a3"]?.some((c) => c.type === "froth") ?? false).toBe(false);
    // And it's correctly counted among the fallen (death-roll candidates).
    expect(res.fallenAdventurerIds).toContain("a3");
  });
});
