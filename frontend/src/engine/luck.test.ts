import { describe, it, expect } from "vitest";
import { buildAdventurerUnit, luckLootMultiplier } from "@medieval-realm/shared/data/combat";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import { getItem } from "@medieval-realm/shared/data/items";

const signetWearer = (id: string) => {
  const a = buildRecruitFromPremadeId(id, "char_021", 3)!; // warrior
  a.equipment.ring1 = "stranger_signet";
  return a;
};
const plain = (id: string) => buildRecruitFromPremadeId(id, "char_021", 3)!;

describe("Luck stat + Stranger's Signet", () => {
  it("the signet is a rare, unique-equip +luck ring (non-craftable find)", () => {
    const s = getItem("stranger_signet")!;
    expect(s.rarity).toBe("rare");
    expect(s.raw?.luck).toBe(5);
    expect(s.uniqueEquip).toBe(true);
    expect(s.slot).toBe("ring1");
  });

  it("gear luck is stamped on the combat unit (the hook Edmund can read)", () => {
    expect(buildAdventurerUnit(signetWearer("a")).luck).toBe(5);
    expect(buildAdventurerUnit(plain("b")).luck).toBe(0);
  });

  it("party luck lifts every drop's chance (relative), and 0 luck is neutral", () => {
    // rollLoot scales each drop.chance by this multiplier. Deterministic — no
    // combat-noise flake (a full sim depends on Math.random in recruit-building).
    expect(luckLootMultiplier(0)).toBe(1);
    expect(luckLootMultiplier(5)).toBeCloseTo(1.05);   // one Stranger's Signet
    expect(luckLootMultiplier(15)).toBeCloseTo(1.15);  // three of them, party-summed
    expect(luckLootMultiplier(15)).toBeGreaterThan(luckLootMultiplier(5)); // more luck, more drops
  });
});
