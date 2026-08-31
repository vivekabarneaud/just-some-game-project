// @vitest-environment happy-dom
// (importing gameState-adjacent shared modules is fine, but keep the env
// consistent with the other combat tests that touch adventurer builders)
import { describe, it, expect } from "vitest";
import {
  buildAdventurerUnit, buildEnemyUnits, weaponAt, inReach,
  weaponBand, MELEE_BAND, RANGED_BAND, CLOSE_IN_FRACTION,
  type CombatUnit,
} from "@medieval-realm/shared/data/combat";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";

// Weapon range bands + the sidearm slot (Combat Foundation §3): range comes
// from the weapon, not the role. The swing uses the FIRST profile whose band
// fits the gap — primary → sidearm → fists.

const archer = (equip?: { mainHand?: string; sidearm?: string }) => {
  const adv = buildRecruitFromPremadeId("test_nessa", "char_000")!; // Nessa — archer
  if (equip?.mainHand !== undefined) adv.equipment.mainHand = equip.mainHand;
  if (equip?.sidearm !== undefined) adv.equipment.sidearm = equip.sidearm;
  return buildAdventurerUnit(adv);
};

/** Place two units `gap` paces apart on the axis. */
const apart = (a: CombatUnit, b: CombatUnit, gap: number) => { a.x = 10; b.x = 10 + gap; };

describe("weaponBand defaults", () => {
  it("bows fight at range, blades in contact; authored bands win", () => {
    expect(weaponBand({ weaponType: "bow" })).toEqual(RANGED_BAND);
    expect(weaponBand({ weaponType: "sword" })).toEqual(MELEE_BAND);
    expect(weaponBand(undefined)).toEqual(MELEE_BAND); // fists
    expect(weaponBand({ weaponType: "bow", minRange: 3, maxRange: 15 })).toEqual({ min: 3, max: 15 });
  });

  it("there is no dead gap between the ranged minimum and melee maximum", () => {
    expect(RANGED_BAND.min).toBe(MELEE_BAND.max + 1);
  });
});

describe("adventurer weapon profiles", () => {
  it("bow + belt dagger + fists, preference-ordered", () => {
    const u = archer({ mainHand: "short_bow", sidearm: "crude_fang_dagger" });
    expect(u.weapons?.map((w) => w.kind)).toEqual(["primary", "sidearm", "fists"]);
    expect(u.weapons![0].minRange).toBe(RANGED_BAND.min); // the bow's band
    expect(u.weapons![1].maxRange).toBe(MELEE_BAND.max);  // the knife's band
  });

  it("picks the bow at range, the sidearm in contact, fists when the belt is empty", () => {
    const armed = archer({ mainHand: "short_bow", sidearm: "crude_fang_dagger" });
    expect(weaponAt(armed, 30)?.kind).toBe("primary");
    expect(weaponAt(armed, 3)?.kind).toBe("sidearm");
    const bare = archer({ mainHand: "short_bow" });
    expect(weaponAt(bare, 3)?.kind).toBe("fists");
  });

  it("nothing fits in the transient closing gap — no swing that beat", () => {
    const u = archer({ mainHand: "short_bow" });
    expect(weaponAt(u, 5.5)).toBeNull();
  });

  it("inReach is band-based: a melee unit can't strike at range, an archer can", () => {
    const bow = archer({ mainHand: "short_bow" });
    const knife = archer({ mainHand: "crude_fang_dagger" }); // archers may wield daggers
    const wolf = buildEnemyUnits([{ enemyId: "grey_wolf", count: 1 }])[0];
    apart(bow, wolf, 30);
    expect(inReach(bow, wolf)).toBe(true);
    apart(knife, wolf, 30);
    expect(inReach(knife, wolf)).toBe(false);
    apart(knife, wolf, 3);
    expect(inReach(knife, wolf)).toBe(true);
  });
});

describe("enemy natural-attack profiles", () => {
  it("a melee creature carries one contact profile", () => {
    const wolf = buildEnemyUnits([{ enemyId: "grey_wolf", count: 1 }])[0];
    expect(wolf.weapons?.length).toBe(1);
    expect(wolf.weapons![0]).toMatchObject({ kind: "primary", minRange: MELEE_BAND.min, maxRange: MELEE_BAND.max });
  });

  it("a back-row creature fights at range with a claws fallback at the close-in fraction", () => {
    const poacher = buildEnemyUnits([{ enemyId: "poacher", count: 1 }])[0]; // combatRole "back"
    expect(poacher.weapons?.map((w) => w.kind)).toEqual(["primary", "sidearm"]);
    const [shot, knife] = poacher.weapons!;
    expect(shot.minRange).toBe(RANGED_BAND.min);
    expect(knife.maxRange).toBe(MELEE_BAND.max);
    expect(knife.dmgMax).toBe(Math.max(1, Math.round(shot.dmgMax * CLOSE_IN_FRACTION)));
    // Pinned or free, it always has SOMETHING to swing.
    expect(weaponAt(poacher, 0)?.kind).toBe("sidearm");
    expect(weaponAt(poacher, 40)?.kind).toBe("primary");
  });
});
