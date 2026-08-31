import { describe, it, expect } from "vitest";
import { calcDamageResult, setCombatSeed, buildEnemyUnits,
  ATTACK_STAT_SCALE, rarityWeaponRange, derivedDamageRange,
} from "@medieval-realm/shared/data/combat";

// Phase 1 weapon-damage model: a physical hit rolls the attacker's weapon range,
// then scales by the primary stat. See docs/design/combat/NOVICE_ITEMS.md §2.

/** Average physical damage of `attacker` vs `defender` across many seeds. */
function avgDamage(attacker: any, defender: any, n = 400): number {
  let total = 0;
  for (let seed = 0; seed < n; seed++) {
    setCombatSeed(seed);
    total += calcDamageResult(attacker, defender).damage;
  }
  return total / n;
}
// Two identical wolves, mutated per test (classless → power = max(str,dex)).
const freshWolf = () => buildEnemyUnits([{ enemyId: "grey_wolf", count: 1 }])[0];

describe("rarityWeaponRange", () => {
  it("climbs with rarity", () => {
    const c = rarityWeaponRange("common"), u = rarityWeaponRange("uncommon");
    const r = rarityWeaponRange("rare"), e = rarityWeaponRange("epic");
    const mid = (x: { min: number; max: number }) => (x.min + x.max) / 2;
    expect(mid(u)).toBeGreaterThan(mid(c));
    expect(mid(r)).toBeGreaterThan(mid(u));
    expect(mid(e)).toBeGreaterThan(mid(r));
  });
  it("defaults an unset rarity to the common range", () => {
    expect(rarityWeaponRange(undefined)).toEqual(rarityWeaponRange("common"));
  });
});

describe("derivedDamageRange is behavior-preserving", () => {
  it("range × stat-scale reconstructs the old power×[0.7,1.3] band", () => {
    for (const power of [3, 5, 8, 12]) {
      const { min, max } = derivedDamageRange(power);
      const scale = 1 + power * ATTACK_STAT_SCALE;
      // Old damage was power×0.7 … power×1.3; the derived range rebuilds it (±1 rounding).
      expect(Math.abs(min * scale - power * 0.7)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(max * scale - power * 1.3)).toBeLessThanOrEqual(1.5);
    }
  });
});

describe("calcDamageResult — weapon range + stat scaling", () => {
  it("a bigger weapon range hits harder (same wielder)", () => {
    const weak = freshWolf(); weak.dmgMin = 2; weak.dmgMax = 4;
    const strong = freshWolf(); strong.dmgMin = 8; strong.dmgMax = 12;
    const target = freshWolf();
    expect(avgDamage(strong, target)).toBeGreaterThan(avgDamage(weak, target) * 1.5);
  });

  it("a stronger wielder hits harder (same weapon range)", () => {
    const weakling = freshWolf(); weakling.str = 2; weakling.dex = 2; weakling.dmgMin = 4; weakling.dmgMax = 6;
    const brute = freshWolf(); brute.str = 12; brute.dex = 12; brute.dmgMin = 4; brute.dmgMax = 6;
    const target = freshWolf();
    expect(avgDamage(brute, target)).toBeGreaterThan(avgDamage(weakling, target));
  });

  it("unarmed fists are weaker than a real weapon", () => {
    const fists = freshWolf(); fists.dmgMin = 1; fists.dmgMax = 3;
    const armed = freshWolf(); armed.dmgMin = 6; armed.dmgMax = 9;
    const target = freshWolf();
    expect(avgDamage(armed, target)).toBeGreaterThan(avgDamage(fists, target));
  });
});
