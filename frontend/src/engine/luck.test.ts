import { describe, it, expect } from "vitest";
import { simulateCombat, buildAdventurerUnit } from "@medieval-realm/shared/data/combat";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import { getItem } from "@medieval-realm/shared/data/items";
import { NOVICE_MISSIONS } from "@medieval-realm/shared/data/missions";

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

  it("party luck lifts total loot drops across many fights", () => {
    const enc = { encounters: [{ enemyId: "bandit_thug", count: 3 }] };
    let lucky = 0, base = 0;
    for (let s = 0; s < 150; s++) {
      const L = simulateCombat(NOVICE_MISSIONS[0], [signetWearer("a"), signetWearer("b"), signetWearer("c")], undefined, s, enc);
      const B = simulateCombat(NOVICE_MISSIONS[0], [plain("a"), plain("b"), plain("c")], undefined, s, enc);
      if (L) lucky += L.loot.length;
      if (B) base += B.loot.length;
    }
    // 3 signets = +15 luck => ~+15% relative drop chance. Over this many rolls
    // the luckier party reliably out-loots the plain one.
    expect(lucky).toBeGreaterThan(base);
  });
});
