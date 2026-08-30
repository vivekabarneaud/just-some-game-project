import { describe, it, expect } from "vitest";
import { buildEnemyUnits, setCombatSeed, pickTarget, type CombatUnit } from "@medieval-realm/shared/data/combat";
import { resolveAI, DEFAULT_AI, acceptsTaunt, canBreak } from "@medieval-realm/shared/data/combat/ai/profile";
import { ENEMIES } from "@medieval-realm/shared/data/enemies";

// Composable AI knobs (DESIGN_TIER1_ENEMIES §1). The load-bearing property is
// BEHAVIOUR PRESERVATION: every enemy authored the old way (aiTier /
// tauntImmunity / routsAt) must resolve to the knobs that reproduce exactly what
// it shipped with. The new modes are additive and opt-in.

describe("legacy fields resolve without changing behaviour", () => {
  it("maps the three shipped tiers onto their existing targeting", () => {
    // feral was RE-POINTED 2026-08-19: random → nearest. Random predates
    // positions; an animal bites what's in front of it.
    expect(resolveAI({ aiTier: "feral" }).targeting).toBe("nearest");
    expect(resolveAI({ aiTier: "tactical" }).targeting).toBe("threat");
    expect(resolveAI({ aiTier: "cunning" }).targeting).toBe("backline");
  });

  it("maps taunt immunity onto the tauntable knob", () => {
    expect(resolveAI({ tauntImmunity: "none" }).tauntable).toBe("obeys");
    expect(resolveAI({ tauntImmunity: "normal" }).tauntable).toBe("ignores-generic");
    expect(resolveAI({ tauntImmunity: "all" }).tauntable).toBe("ignores");
  });

  it("derives fear from routsAt — no threshold has always meant fights-to-the-end", () => {
    expect(resolveAI({ routsAt: 0.3 }).fear).toBe("routs");
    expect(resolveAI({}).fear).toBe("fearless");
  });

  it("an un-authored unit gets the documented defaults", () => {
    expect(resolveAI({ aiTier: "tactical", tauntImmunity: "none", routsAt: 0.2 })).toEqual(DEFAULT_AI);
  });

  it("every enemy in the catalog resolves to a legal profile", () => {
    const targetings = new Set(["random", "nearest", "threat", "squishiest", "opportunist", "gang-up", "backline"]);
    for (const def of ENEMIES) {
      const p = resolveAI({ ai: def.ai, aiTier: def.aiTier ?? "tactical", tauntImmunity: def.tauntImmunity, routsAt: def.routsAt });
      expect(targetings.has(p.targeting), `${def.id}: ${p.targeting}`).toBe(true);
      // A routing creature must carry a threshold, or it can never actually break.
      if (p.fear === "routs") expect(def.routsAt, `${def.id} routs with no routsAt`).toBeTypeOf("number");
    }
  });
});

describe("authored knobs override the legacy mapping", () => {
  it("fear: fearless keeps a beast on the field despite its routsAt", () => {
    const wolf = buildEnemyUnits([{ enemyId: "wild_wolf", count: 1 }])[0];
    expect(wolf.routsAt).toBeTypeOf("number");
    expect(canBreak(wolf)).toBe(true);
    const maddened: CombatUnit = { ...wolf, ai: { ...wolf.ai!, fear: "fearless" } };
    expect(canBreak(maddened)).toBe(false);
  });

  it("tauntable gates the warrior taunt by kind", () => {
    const base = buildEnemyUnits([{ enemyId: "wild_wolf", count: 1 }])[0];
    const obeys: CombatUnit = { ...base, ai: { ...base.ai!, tauntable: "obeys" } };
    const generic: CombatUnit = { ...base, ai: { ...base.ai!, tauntable: "ignores-generic" } };
    const never: CombatUnit = { ...base, ai: { ...base.ai!, tauntable: "ignores" } };
    expect(acceptsTaunt(obeys, "generic")).toBe(true);
    expect(acceptsTaunt(generic, "generic")).toBe(false);
    expect(acceptsTaunt(generic, "elite")).toBe(true); // an elite pull still reaches it
    expect(acceptsTaunt(never, "elite")).toBe(false);
  });
});

describe("the new targeting modes", () => {
  /** A bare combatant with nothing inherited. Built by hand rather than cloned
   *  from a catalog enemy: a cloned wolf drags in `elusiveAtRange`, raw dodge and
   *  a weapon band, any of which would quietly decide these tests for us. */
  function unit(id: string, over: Partial<CombatUnit>): CombatUnit {
    return {
      id, name: id, icon: "", kind: "adventurer", isEnemy: false,
      hp: 100, maxHp: 100, str: 10, dex: 10, int: 10, vit: 10, wis: 10,
      isMagical: false, gearDefense: 0, dmgMin: 2, dmgMax: 4,
      canAct: true, canBeHealed: true, isTauntable: true,
      cooldowns: {}, slowed: 0, poisonTicks: [],
      ...over,
    };
  }

  /** A plated, parrying tank closest, a soft archer just behind it — BOTH inside
   *  the attacker's melee reach, because targeting only ever chooses among what it
   *  can actually reach. (Spread them further and the positional gate decides for
   *  us, which is a different rule and already tested elsewhere.) The tank is the
   *  harder target on both axes, armour and avoidance, which is exactly the
   *  discrimination `opportunist` exists to make. */
  function field() {
    const attacker = unit("wolf", { isEnemy: true, kind: "enemy", x: 0, threatTable: {}, ai: { targeting: "threat", tauntable: "obeys", fear: "routs" } });
    const tank = unit("tank", { x: 2, gearDefense: 400, str: 30, class: "warrior" });
    const archer = unit("archer", { x: 5, gearDefense: 0, str: 2, dex: 2, class: "archer" });
    return { attacker, allies: [tank, archer] };
  }

  it("nearest takes the closest, ignoring how soft the far one is", () => {
    const { attacker, allies } = field();
    attacker.ai = { ...attacker.ai!, targeting: "nearest" };
    setCombatSeed(1);
    expect(pickTarget(attacker, allies)?.id).toBe("tank");
  });

  it("squishiest is about DEFENCE, not distance — it takes the soft one over the near one", () => {
    // The tank stands closer; squishiest still walks past it.
    const { attacker, allies } = field();
    attacker.ai = { ...attacker.ai!, targeting: "squishiest" };
    setCombatSeed(1);
    expect(pickTarget(attacker, allies)?.id).toBe("archer");
  });

  it("opportunist takes the straggler — the one cut off from their line", () => {
    const attacker = unit("wolf", { isEnemy: true, kind: "enemy", x: 0, combatRole: "back", threatTable: {}, ai: { targeting: "opportunist", tauntable: "obeys", fear: "routs" } });
    // Two holding formation, one drifted far off on their own.
    const tank = unit("tank", { x: 2, gearDefense: 400 });
    const archer = unit("archer", { x: 5 });
    const straggler = unit("straggler", { x: 60, gearDefense: 400 }); // armoured: softness must NOT decide this
    setCombatSeed(1);
    expect(pickTarget(attacker, [tank, archer, straggler])?.id).toBe("straggler");
  });

  it("opportunist finishes the wounded when nobody is isolated", () => {
    const attacker = unit("wolf", { isEnemy: true, kind: "enemy", x: 0, combatRole: "back", threatTable: {}, ai: { targeting: "opportunist", tauntable: "obeys", fear: "routs" } });
    const tank = unit("tank", { x: 2 });
    const archer = unit("archer", { x: 5 });
    const bleeding = unit("bleeding", { x: 8, hp: 12 }); // same formation, nearly down
    setCombatSeed(1);
    expect(pickTarget(attacker, [tank, archer, bleeding])?.id).toBe("bleeding");
  });

  it("gang-up piles onto whatever packmates already committed to", () => {
    const attacker = unit("wolf3", { isEnemy: true, kind: "enemy", x: 0, threatTable: {}, ai: { targeting: "gang-up", tauntable: "obeys", fear: "routs" } });
    const tank = unit("tank", { x: 2 });      // nearer
    const archer = unit("archer", { x: 5 });  // but the pack is already on this one
    const mate1 = unit("wolf1", { isEnemy: true, kind: "enemy", x: 1, lastTargetId: "archer" });
    const mate2 = unit("wolf2", { isEnemy: true, kind: "enemy", x: 1, lastTargetId: "archer" });
    setCombatSeed(1);
    expect(pickTarget(attacker, [tank, archer], [attacker, mate1, mate2])?.id).toBe("archer");
  });

  it("gang-up falls back to nearest when the pack has not committed yet", () => {
    const attacker = unit("wolf1", { isEnemy: true, kind: "enemy", x: 0, threatTable: {}, ai: { targeting: "gang-up", tauntable: "obeys", fear: "routs" } });
    const tank = unit("tank", { x: 2 });
    const archer = unit("archer", { x: 5 });
    setCombatSeed(1);
    expect(pickTarget(attacker, [tank, archer], [attacker])?.id).toBe("tank");
  });

  it("picking a target records the commitment, so the next packmate can read it", () => {
    const { attacker, allies } = field();
    attacker.ai = { ...attacker.ai!, targeting: "nearest" };
    setCombatSeed(1);
    expect(attacker.lastTargetId).toBeUndefined();
    pickTarget(attacker, allies);
    expect(attacker.lastTargetId).toBe("tank");
  });

  it("a taunt still overrides every mode", () => {
    const { attacker, allies } = field();
    attacker.ai = { ...attacker.ai!, targeting: "squishiest" };
    attacker.tauntedBy = "tank";
    setCombatSeed(1);
    expect(pickTarget(attacker, allies)?.id).toBe("tank");
  });
});
