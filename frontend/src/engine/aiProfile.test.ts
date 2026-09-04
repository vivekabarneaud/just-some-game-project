import { describe, it, expect } from "vitest";
import { buildEnemyUnits, setCombatSeed, pickTarget, type CombatUnit } from "@medieval-realm/shared/data/combat";
import { resolveAI, DEFAULT_AI, acceptsTaunt, canBreak } from "@medieval-realm/shared/data/combat/ai/profile";
import { ENEMIES } from "@medieval-realm/shared/data/enemies";

// Composable AI knobs (TIER1_ENEMIES §1 + ROUT_AND_FLIGHT). Every enemy authors
// its `ai` block directly; fear is the shape of the exit, inferred from routsAt
// when unset. The suite pins the resolution rules and the roster's exit styles.

/** A bare unit for scoring fixtures. Shared by both describe blocks. */
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

describe("resolution: authored knobs, the routsAt inference, the defaults", () => {
  // The legacy aiTier / tauntImmunity fields were DELETED 2026-09-04
  // (ROUT_AND_FLIGHT): every enemy authors `ai` directly now, so resolution is
  // just: authored knob → default (with fear inferred from routsAt).

  it("an un-authored unit gets the documented defaults", () => {
    expect(resolveAI({ routsAt: 0.2 })).toEqual(DEFAULT_AI);
  });

  it("fear infers from routsAt: no threshold has always meant fights-to-the-end", () => {
    expect(resolveAI({}).fear).toBe("fearless");
    // A threshold with no authored style gets the plain beast exit.
    expect(resolveAI({ routsAt: 0.3 }).fear).toBe("withdraws");
    // The authored style wins over the inference, both ways.
    expect(resolveAI({ routsAt: 0.3, ai: { fear: "bolts" } }).fear).toBe("bolts");
    expect(resolveAI({ ai: { fear: "fearless" }, routsAt: 0.3 }).fear).toBe("fearless");
  });

  it("every enemy in the catalog resolves to a legal profile", () => {
    // Targeting is a WEIGHT VECTOR now, not one of seven names, so "legal"
    // means: only known dimensions, and every weight in a sane 0..1-ish range.
    // A typo'd key would otherwise sit there silently contributing nothing.
    const dims = new Set(["roles", "condition", "isolation", "softness", "threat", "ganged", "sticky", "erratic"]);
    const roles = new Set(["healer", "caster", "ranged", "frontline", "skirmisher"]);
    const fears = new Set(["fearless", "bolts", "withdraws", "yields"]);
    for (const def of ENEMIES) {
      const p = resolveAI({ ai: def.ai, routsAt: def.routsAt });
      for (const [k, v] of Object.entries(p.targeting)) {
        expect(dims.has(k), `${def.id}: unknown targeting dimension "${k}"`).toBe(true);
        if (k === "roles") {
          for (const [r, rv] of Object.entries(v as Record<string, number>)) {
            expect(roles.has(r), `${def.id}: unknown role "${r}"`).toBe(true);
            expect(rv, `${def.id}.roles.${r}`).toBeGreaterThan(0);
            expect(rv, `${def.id}.roles.${r}`).toBeLessThanOrEqual(1);
          }
        } else if (k !== "erratic") {
          expect(v, `${def.id}.${k}`).toBeGreaterThan(0);
          expect(v, `${def.id}.${k}`).toBeLessThanOrEqual(2);
        }
      }
      expect(fears.has(p.fear), `${def.id}: ${p.fear}`).toBe(true);
      // A creature with an exit style must carry a threshold or morale, or it
      // can never actually break; and the reverse — a threshold with no
      // non-fearless style — cannot happen since the inference fills withdraws.
      if (p.fear !== "fearless") {
        expect(def.routsAt != null || def.morale != null, `${def.id} can break but has no trigger`).toBe(true);
      }
    }
  });

  it("anything with a MIND weighs threat — or Presence quietly stops working", () => {
    // Learned the hard way while authoring (2026-09-04): the first pass gave
    // most creatures no threat term, which silently disabled the whole
    // Presence system — the warrior's threatMultiplier 1.5 and the assassin's
    // 0.25 mean nothing if nothing reads threat, and the tank stops being able
    // to hold blows off the squishy. "No tactics" means no clever backline
    // hunting; it does NOT mean ignoring who is stabbing you.
    const mindful = [
      "displaced_brigand", "tollman", "dominion_tough", "poacher", "cutthroat",
      "dominion_deserter", "captain_hale_stub", "goblin_runt",
    ];
    for (const id of mindful) {
      const def = ENEMIES.find((e) => e.id === id)!;
      const w = resolveAI({ ai: def.ai, routsAt: def.routsAt }).targeting;
      expect(w.threat, `${id} has a mind and must weigh threat`).toBeGreaterThan(0);
    }
    // And the mindless deliberately do NOT: a maddened boar has no grudge.
    for (const id of ["rabid_boar", "tainted_boar", "tainted_patriarch", "grief_bound_spirit", "wild_boar"]) {
      const def = ENEMIES.find((e) => e.id === id)!;
      const w = resolveAI({ ai: def.ai, routsAt: def.routsAt }).targeting;
      expect(w.threat ?? 0, `${id} is mindless and should not weigh threat`).toBe(0);
    }
  });

  it("the showcase: Greyfang hunts the backline BECAUSE he has the legs for it", () => {
    // The design's whole claim (TARGETING.md): the same weights on slow legs
    // would take the body in front instead. His mobility is what makes the
    // taste actionable, and it is authored on him, not on the weights.
    const gf = ENEMIES.find((e) => e.id === "greyfang")!;
    const w = resolveAI({ ai: gf.ai, routsAt: gf.routsAt }).targeting;
    expect(w.roles?.healer).toBeGreaterThan(0);
    expect(w.roles?.healer!).toBeGreaterThanOrEqual(w.roles?.caster ?? 0); // priest first

    // Asserted as BEHAVIOUR, not as a stat: build him and check he actually
    // walks past the warrior for the priest at real battlefield distances.
    const [alpha] = buildEnemyUnits([{ enemyId: "greyfang", count: 1 }]);
    alpha.x = 68;
    // The real tactical question: the wall is IN HIS FACE and the priest is
    // behind it. (An earlier fixture put both far away — at gaps of 36 vs 48
    // the priest is only 25% further, and a role weight of 1 is 4x the base, so
    // it pays for that walk on any legs. The choice only bites when the near
    // target is actually engaged.)
    const line = [
      { ...unit("tank", { x: 64, class: "warrior", gearDefense: 300 }) },   // in contact
      { ...unit("priest", { x: 20, class: "priest" }) },                    // across the field
    ] as CombatUnit[];
    // Asserted as a MAJORITY over many seeds, not a single pick: the scorer
    // deliberately takes its second choice ~15% of the time so combat does not
    // read as robotic, which makes any one-shot assertion flaky by design.
    const share = (a: CombatUnit, id: string) => {
      let hits = 0;
      for (let seed = 0; seed < 60; seed++) {
        setCombatSeed(seed);
        if (pickTarget({ ...a, lastTargetId: undefined }, line)?.id === id) hits++;
      }
      return hits / 60;
    };
    expect(share(alpha, "priest")).toBeGreaterThan(0.7);

    // And the inverse, which is the design's actual claim: the SAME taste on
    // slow legs takes the body in front instead.
    // NB mobilityOf gives a classless creature a base of 10 with a floor of 4,
    // so raw.mobility must go NEGATIVE to model something genuinely shambling.
    // (A small authoring wart: there is no other way to author a slow creature.)
    const slow: CombatUnit = { ...alpha, id: "slow", raw: { ...alpha.raw, mobility: -8 }, dex: 1 };
    expect(share(slow, "tank")).toBeGreaterThan(0.7);
  });

  it("the roster carries the intended exit styles (ROUT_AND_FLIGHT)", () => {
    const fearOf = (id: string) => {
      const def = ENEMIES.find((e) => e.id === id)!;
      return resolveAI({ ai: def.ai, routsAt: def.routsAt }).fear;
    };
    expect(fearOf("wild_boar")).toBe("bolts");                 // prey: turns and runs flat out
    for (const w of ["grey_wolf", "gaunt_wolf", "starving_wolf", "forest_bear"]) {
      expect(fearOf(w), w).toBe("withdraws");                  // backs off facing you
    }
    for (const h of ["displaced_brigand", "tollman", "dominion_tough", "poacher", "cutthroat"]) {
      expect(fearOf(h), h).toBe("yields");                     // throws down the weapon, stays
    }
    expect(fearOf("greyfang")).toBe("fearless");               // the pack leader stands
  });
});

describe("authored knobs behave in combat", () => {
  it("fear: fearless keeps a beast on the field despite its routsAt", () => {
    const wolf = buildEnemyUnits([{ enemyId: "grey_wolf", count: 1 }])[0];
    expect(wolf.routsAt).toBeTypeOf("number");
    expect(canBreak(wolf)).toBe(true);
    const maddened: CombatUnit = { ...wolf, ai: { ...wolf.ai!, fear: "fearless" } };
    expect(canBreak(maddened)).toBe(false);
  });

  it("tauntable gates the warrior taunt by kind", () => {
    const base = buildEnemyUnits([{ enemyId: "grey_wolf", count: 1 }])[0];
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


  /** A plated, parrying tank closest, a soft archer just behind it — BOTH inside
   *  the attacker's melee reach, because targeting only ever chooses among what it
   *  can actually reach. (Spread them further and the positional gate decides for
   *  us, which is a different rule and already tested elsewhere.) The tank is the
   *  harder target on both axes, armour and avoidance, which is exactly the
   *  discrimination `opportunist` exists to make. */
  function field() {
    const attacker = unit("wolf", { isEnemy: true, kind: "enemy", x: 0, threatTable: {}, ai: { targeting: { threat: 1, softness: 1, condition: 0.2, sticky: 0.2 }, tauntable: "obeys", fear: "withdraws" } });
    const tank = unit("tank", { x: 2, gearDefense: 400, str: 30, class: "warrior" });
    const archer = unit("archer", { x: 5, gearDefense: 0, str: 2, dex: 2, class: "archer" });
    return { attacker, allies: [tank, archer] };
  }

  it("nearest takes the closest, ignoring how soft the far one is", () => {
    const { attacker, allies } = field();
    attacker.ai = { ...attacker.ai!, targeting: {} };
    setCombatSeed(1);
    expect(pickTarget(attacker, allies)?.id).toBe("tank");
  });

  it("squishiest is about DEFENCE, not distance — it takes the soft one over the near one", () => {
    // The tank stands closer; squishiest still walks past it.
    const { attacker, allies } = field();
    attacker.ai = { ...attacker.ai!, targeting: { softness: 1 } };
    setCombatSeed(1);
    expect(pickTarget(attacker, allies)?.id).toBe("archer");
  });

  it("opportunist takes the straggler — the one cut off from their line", () => {
    // Positions are the REAL battlefield (POS: ally line ~18-32, enemy front 68),
    // not a synthetic 0-vs-60 spread. That matters now: the reach factor
    // discounts distance, where the old opportunist ignored it entirely, so a
    // straggler on the far side of the field would rightly lose to the body in
    // front of you. A straggler is someone who broke from THEIR line — which in
    // practice means drifted toward the enemy, so isolation and proximity agree.
    const attacker = unit("wolf", { isEnemy: true, kind: "enemy", x: 68, threatTable: {}, ai: { targeting: { isolation: 1, condition: 0.5 }, tauntable: "obeys", fear: "withdraws" } });
    const tank = unit("tank", { x: 30, gearDefense: 400 });
    const archer = unit("archer", { x: 24 });
    const straggler = unit("straggler", { x: 52, gearDefense: 400 }); // armoured: softness must NOT decide this
    setCombatSeed(1);
    expect(pickTarget(attacker, [tank, archer, straggler])?.id).toBe("straggler");
  });

  it("...but a SLOW opportunist takes what is in front of it instead", () => {
    // The reach factor is normalised by the attacker's own mobility, so the same
    // weights produce different behaviour for different legs. This is the design
    // property, asserted: a shambling thing cannot afford the straggler.
    const slow = unit("shambler", { isEnemy: true, kind: "enemy", x: 68, dex: 1, threatTable: {}, ai: { targeting: { isolation: 1, condition: 0.5 }, tauntable: "obeys", fear: "fearless" } });
    const tank = unit("tank", { x: 66, gearDefense: 400 });   // right on top of it
    const straggler = unit("straggler", { x: 20 });            // isolated, but a long walk
    setCombatSeed(1);
    expect(pickTarget(slow, [tank, straggler])?.id).toBe("tank");
  });

  it("opportunist finishes the wounded when nobody is isolated", () => {
    const attacker = unit("wolf", { isEnemy: true, kind: "enemy", x: 0, combatRole: "back", threatTable: {}, ai: { targeting: { isolation: 1, condition: 0.5 }, tauntable: "obeys", fear: "withdraws" } });
    const tank = unit("tank", { x: 2 });
    const archer = unit("archer", { x: 5 });
    const bleeding = unit("bleeding", { x: 8, hp: 12 }); // same formation, nearly down
    setCombatSeed(1);
    expect(pickTarget(attacker, [tank, archer, bleeding])?.id).toBe("bleeding");
  });

  it("gang-up piles onto whatever packmates already committed to", () => {
    const attacker = unit("wolf3", { isEnemy: true, kind: "enemy", x: 0, threatTable: {}, ai: { targeting: { ganged: 1 }, tauntable: "obeys", fear: "withdraws" } });
    const tank = unit("tank", { x: 2 });      // nearer
    const archer = unit("archer", { x: 5 });  // but the pack is already on this one
    const mate1 = unit("wolf1", { isEnemy: true, kind: "enemy", x: 1, lastTargetId: "archer" });
    const mate2 = unit("wolf2", { isEnemy: true, kind: "enemy", x: 1, lastTargetId: "archer" });
    setCombatSeed(1);
    expect(pickTarget(attacker, [tank, archer], [attacker, mate1, mate2])?.id).toBe("archer");
  });

  it("gang-up falls back to nearest when the pack has not committed yet", () => {
    const attacker = unit("wolf1", { isEnemy: true, kind: "enemy", x: 0, threatTable: {}, ai: { targeting: { ganged: 1 }, tauntable: "obeys", fear: "withdraws" } });
    const tank = unit("tank", { x: 2 });
    const archer = unit("archer", { x: 5 });
    setCombatSeed(1);
    expect(pickTarget(attacker, [tank, archer], [attacker])?.id).toBe("tank");
  });

  it("picking a target records the commitment, so the next packmate can read it", () => {
    const { attacker, allies } = field();
    attacker.ai = { ...attacker.ai!, targeting: {} };
    setCombatSeed(1);
    expect(attacker.lastTargetId).toBeUndefined();
    pickTarget(attacker, allies);
    expect(attacker.lastTargetId).toBe("tank");
  });

  it("a taunt still overrides every mode", () => {
    const { attacker, allies } = field();
    attacker.ai = { ...attacker.ai!, targeting: { softness: 1 } };
    attacker.tauntedBy = "tank";
    setCombatSeed(1);
    expect(pickTarget(attacker, allies)?.id).toBe("tank");
  });
});
