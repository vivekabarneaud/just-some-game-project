import { describe, it, expect } from "vitest";
import { getAvoidance, getDefenseReduction, MAX_AVOIDANCE } from "@medieval-realm/shared/data/combat";

// Minimal CombatUnit stand-ins — getAvoidance/getDefenseReduction only read
// dex/str/vit/raw/isMagical/isEnemy/gearDefense.
const unit = (over: Record<string, unknown>) =>
  ({ dex: 0, str: 0, vit: 0, raw: {}, isMagical: false, isEnemy: false, gearDefense: 0, ...over } as any);

describe("hit resolution — accuracy / parry / armor", () => {
  it("avoidance = dodge + parry − accuracy for a physical attacker", () => {
    const target = unit({ dex: 10, str: 10 });      // dodge 10, parry min(20,7)=7
    const attacker = unit({ dex: 4 });               // accuracy 4, physical
    const av = getAvoidance(attacker, target);
    expect(av.chance).toBe(13);                       // 10 + 7 − 4
    expect(av.parried).toBe(false);                   // dodge (10) > parry (7)
  });

  it("a magical attacker ignores parry (can't parry a fireball)", () => {
    const target = unit({ dex: 10, str: 10 });        // dodge 10, parry 7
    const caster = unit({ dex: 4, isMagical: true });
    expect(getAvoidance(caster, target).chance).toBe(6); // 10 + 0 − 4
  });

  it("labels it a parry when parry is the bigger contributor", () => {
    const target = unit({ dex: 2, str: 20 });         // dodge 2, parry min(20,14)=14
    const av = getAvoidance(unit({ dex: 0 }), target);
    expect(av.chance).toBe(16);                        // 2 + 14 − 0
    expect(av.parried).toBe(true);                     // parry (14) > dodge (2)
  });

  it("clamps to [0, MAX_AVOIDANCE]", () => {
    const dodgy = unit({ dex: 20, str: 20, raw: { dodge: 30, parry: 30 } });
    expect(getAvoidance(unit({}), dodgy).chance).toBe(MAX_AVOIDANCE); // way over → capped 75
    const precise = unit({ raw: { accuracy: 100 } });
    expect(getAvoidance(precise, unit({ dex: 10, str: 10 })).chance).toBe(0); // never below 0
  });

  it("raw.armor adds to the physical mitigation pool", () => {
    const bare = unit({ gearDefense: 100 });
    const armored = unit({ gearDefense: 100, raw: { armor: 50 } });
    expect(getDefenseReduction(armored)).toBeGreaterThan(getDefenseReduction(bare));
    expect(getDefenseReduction(armored)).toBeCloseTo(150 / 300); // 0.5
  });
});
