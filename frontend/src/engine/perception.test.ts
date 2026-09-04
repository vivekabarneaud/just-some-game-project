import { describe, it, expect } from "vitest";
import {
  perceivable, perceive, applySmoke, anyConcealment, pickTarget,
  pickTargetForAdventurer, setCombatSeed, type CombatUnit,
} from "@medieval-realm/shared/data/combat";
import { computeHolds } from "@medieval-realm/shared/data/combat/positional";
import type { CombatContext } from "@medieval-realm/shared/data/combat";

// Perception (docs/design/combat/TARGETING.md): the filter in FRONT of the
// scorer. Two flags, because the asymmetry is the whole point —
//   concealed = nobody sees THEM (invisibility, or standing in smoke)
//   blinded   = THEY see nothing (a blinding effect, or standing in smoke)
// and contact always reveals, so concealment is never absolute.

const u = (id: string, over: Partial<CombatUnit> = {}): CombatUnit =>
  ({ id, name: id, hp: 40, maxHp: 40, x: 30, kind: "adventurer", isEnemy: false,
     str: 5, dex: 5, int: 3, vit: 4, wis: 3, gearDefense: 0, cooldowns: {},
     slowed: 0, poisonTicks: [], statDebuffs: [], threatTable: {},
     weapons: [{ kind: "primary", minRange: 0, maxRange: 5, dmgMin: 2, dmgMax: 4 }],
     ...over }) as CombatUnit;
const foe = (over: Partial<CombatUnit> = {}) => u("foe", { isEnemy: true, kind: "enemy", x: 68, ...over });

describe("the predicate", () => {
  it("plain sight both ways when nothing is hidden", () => {
    expect(perceivable(foe(), u("t", { x: 30 }))).toBe(true);
  });

  it("a concealed target is unseen — but CONTACT always reveals", () => {
    const watcher = foe({ x: 68 });
    expect(perceivable(watcher, u("ghost", { x: 30, concealed: true }))).toBe(false);
    // Right on top of it: you hear it, smell it, feel it.
    expect(perceivable(watcher, u("ghost", { x: 67, concealed: true }))).toBe(true);
  });

  it("a blinded observer sees nothing beyond arm's reach", () => {
    const blind = foe({ x: 68, blinded: true });
    expect(perceivable(blind, u("t", { x: 30 }))).toBe(false);
    expect(perceivable(blind, u("t", { x: 66 }))).toBe(true);
  });

  it("invisibility is ASYMMETRIC: the hidden one still sees everyone", () => {
    const assassin = u("assassin", { x: 30, concealed: true });
    const enemy = foe({ x: 68 });
    expect(perceivable(enemy, assassin)).toBe(false);  // they cannot see her
    expect(perceivable(assassin, enemy)).toBe(true);   // she sees them fine
  });

  it("position-less units (raid sims, hand-built) are all mutually visible", () => {
    const a = foe({ x: undefined }), b = u("t", { x: undefined, concealed: true });
    expect(perceivable(a, b)).toBe(true);
  });
});

describe("smoke stamps both flags, and cleans up after itself", () => {
  const ctxWith = (smoke: any, units: CombatUnit[]) =>
    ({ adventurers: units.filter((x) => !x.isEnemy), enemies: units.filter((x) => x.isEnemy), smoke } as unknown as CombatContext);

  it("standing in a cloud conceals AND blinds — it blocks sight both ways", () => {
    const inside = u("inside", { x: 40 });
    const outside = u("outside", { x: 10 });
    applySmoke(ctxWith([{ from: 35, to: 45, rounds: 2 }], [inside, outside]));
    expect(inside.concealed).toBe(true);
    expect(inside.blinded).toBe(true);
    expect(outside.concealed).toBeFalsy();
    expect(outside.blinded).toBeFalsy();
  });

  it("walking out of the cloud clears it — but does NOT strip real invisibility", () => {
    const walker = u("walker", { x: 40 });
    const vanished = u("vanished", { x: 40, invisible: true });
    const ctx = ctxWith([{ from: 35, to: 45, rounds: 2 }], [walker, vanished]);
    applySmoke(ctx);
    expect(walker.concealed).toBe(true);
    // both step clear
    walker.x = 10; vanished.x = 10;
    applySmoke(ctx);
    expect(walker.concealed).toBe(false);
    expect(walker.blinded).toBe(false);
    // Vanish is not smoke's to take away.
    expect(vanished.concealed).toBe(true);
    expect(vanished.blinded).toBe(false);
  });

  it("anyConcealment is the cheap skip for the overwhelmingly common case", () => {
    const clear = ctxWith(undefined, [u("a"), foe()]);
    expect(anyConcealment(clear)).toBe(false);
    const murky = ctxWith(undefined, [u("a", { concealed: true }), foe()]);
    expect(anyConcealment(murky)).toBe(true);
  });
});

describe("perception runs AHEAD of the forced overrides", () => {
  it("you cannot be taunted by someone you cannot see", () => {
    // The review catch: taunt used to short-circuit against the raw pool, so an
    // invisible taunter would still yank enemies onto itself.
    const taunter = u("taunter", { x: 30, concealed: true });
    const other = u("other", { x: 30 });
    const enemy = foe({ x: 68, tauntedBy: "taunter" });
    setCombatSeed(1);
    expect(pickTarget(enemy, [taunter, other])?.id).toBe("other");
  });

  it("a visible taunter still works, so the override itself is intact", () => {
    const taunter = u("taunter", { x: 30 });
    const other = u("other", { x: 30, hp: 2 }); // juicier, and still ignored
    const enemy = foe({ x: 68, tauntedBy: "taunter" });
    setCombatSeed(1);
    expect(pickTarget(enemy, [taunter, other])?.id).toBe("taunter");
  });

  it("perceiving nobody means holding, not flailing at everyone", () => {
    const enemy = foe({ x: 68, blinded: true });
    expect(pickTarget(enemy, [u("a", { x: 20 }), u("b", { x: 24 })])).toBeNull();
  });

  it("and it is symmetric — heroes get no godlike sight", () => {
    const hero = u("hero", { x: 30, class: "archer" });
    expect(pickTargetForAdventurer(hero, [foe({ id: "hidden", concealed: true })])).toBeNull();
  });
});

describe("nothing unseen holds a line", () => {
  it("a concealed assassin does not body-block the front", () => {
    const warrior = u("w", { x: 30, class: "warrior" });
    const blocker = foe({ id: "blocker", x: 60 });
    const ctx = { adventurers: [warrior], enemies: [blocker] } as unknown as CombatContext;
    expect(computeHolds(ctx).has("w")).toBe(true);
    blocker.concealed = true;
    expect(computeHolds(ctx).has("w")).toBe(false);
  });
});

describe("perceive()", () => {
  it("filters to what can be assessed, keeping order", () => {
    const watcher = foe({ x: 68 });
    const pool = [u("seen", { x: 30 }), u("hidden", { x: 30, concealed: true }), u("near", { x: 66, concealed: true })];
    expect(perceive(watcher, pool).map((t) => t.id)).toEqual(["seen", "near"]);
  });
});
