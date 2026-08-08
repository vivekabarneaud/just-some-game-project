import { describe, it, expect } from "vitest";
import { FORAGE_PLANTS, getForagePlant, isDecoy } from "@medieval-realm/shared/data/foraging/plants";
import { buildScene, fullStock, pick, regrow, seasonCap } from "@medieval-realm/shared/data/foraging/scene";

describe("foraging — the woods' stock", () => {
  it("a fresh wood sits at its seasonal cap", () => {
    const s = fullStock("autumn");
    expect(s.chanterelle).toBe(seasonCap("chanterelle", "autumn"));
    // Blueberries are a summer thing; autumn holds none at all.
    expect(s.blueberry).toBe(0);
  });

  it("picking depletes, and floors at zero", () => {
    let s = fullStock("summer");
    const before = s.blueberry;
    s = pick(s, "blueberry");
    expect(s.blueberry).toBe(before - 1);
    for (let i = 0; i < 100; i++) s = pick(s, "blueberry");
    expect(s.blueberry).toBe(0);
  });

  it("regrows toward the cap and never past it", () => {
    let s = fullStock("summer");
    for (let i = 0; i < 20; i++) s = pick(s, "blueberry");
    expect(s.blueberry).toBe(0);
    s = regrow(s, "summer", 4);
    expect(s.blueberry).toBeGreaterThan(0);
    s = regrow(s, "summer", 10_000);
    expect(s.blueberry).toBe(seasonCap("blueberry", "summer"));
  });

  it("plants regrow at different speeds — a King Bolete is not a blackberry", () => {
    const empty = Object.fromEntries(FORAGE_PLANTS.map((p) => [p.id, 0]));
    const after = regrow(empty, "autumn", 5);
    expect(after.blackberry).toBeGreaterThan(after.cepe);
  });

  // The whole reason stock is a plain record rather than persisted patches:
  // a season change must need no migration and must not be able to go stale.
  it("a season change needs no reconciliation — out-of-season stock cannot linger", () => {
    const summer = fullStock("summer");
    expect(summer.blueberry).toBeGreaterThan(0);
    const nowWinter = regrow(summer, "winter", 24);
    expect(nowWinter.blueberry).toBe(0); // winter has no cap for it
  });
});

describe("foraging — scene generation", () => {
  it("is stable for the same seed, so picking one plant can't reshuffle the rest", () => {
    const s = fullStock("autumn");
    expect(buildScene(s, "autumn", 42)).toEqual(buildScene(s, "autumn", 42));
  });

  it("a different seed lays the wood out differently", () => {
    const s = fullStock("autumn");
    expect(buildScene(s, "autumn", 1)).not.toEqual(buildScene(s, "autumn", 2));
  });

  it("an emptied wood shows nothing — that IS the rate limit", () => {
    const empty = Object.fromEntries(FORAGE_PLANTS.map((p) => [p.id, 0]));
    expect(buildScene(empty, "autumn", 7)).toHaveLength(0);
  });

  it("never places a plant that is out of season", () => {
    for (const placed of buildScene(fullStock("winter"), "winter", 3)) {
      expect(seasonCap(placed.plantId, "winter")).toBeGreaterThan(0);
    }
  });

  it("keeps sprites inside the frame and off each other", () => {
    const scene = buildScene(fullStock("summer"), "summer", 11);
    for (const p of scene) {
      expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(100);
      expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(100);
    }
    for (let i = 0; i < scene.length; i++) {
      for (let j = i + 1; j < scene.length; j++) {
        expect(Math.hypot(scene[i].x - scene[j].x, scene[i].y - scene[j].y)).toBeGreaterThan(8);
      }
    }
  });
});

describe("foraging — decoys", () => {
  it("decoys yield nothing and name what they mimic", () => {
    for (const p of FORAGE_PLANTS.filter((x) => x.yields === null)) {
      expect(isDecoy(p.id)).toBe(true);
      expect(p.mimics, `${p.name} must say what it is mistaken for`).toBeTruthy();
      expect(getForagePlant(p.mimics!), `${p.name} mimics an unknown plant`).toBeTruthy();
    }
  });

  it("every decoy shares a season with the plant it mimics, or it can never fool anyone", () => {
    for (const p of FORAGE_PLANTS.filter((x) => x.yields === null)) {
      const real = getForagePlant(p.mimics!)!;
      const shared = (["spring", "summer", "autumn", "winter"] as const)
        .filter((s) => (p.cap[s] ?? 0) > 0 && (real.cap[s] ?? 0) > 0);
      expect(shared.length, `${p.name} never grows alongside ${real.name}`).toBeGreaterThan(0);
    }
  });

  it("hemlock is a real item, not a decoy — we want it in the basket", () => {
    expect(isDecoy("hemlock")).toBe(false);
    expect(getForagePlant("hemlock")!.yields).toBe("hemlock");
    expect(getForagePlant("hemlock")!.mimics).toBe("wild_carrot");
  });

  it("every plant has a note, since that is what Edda says over the basket", () => {
    for (const p of FORAGE_PLANTS) expect(p.note.length).toBeGreaterThan(10);
  });
});

describe("foraging — sprite variants", () => {
  it("picks a variant within the declared range, and only for plants that have art", () => {
    for (const placed of buildScene(fullStock("autumn"), "autumn", 5)) {
      const plant = getForagePlant(placed.plantId)!;
      const n = plant.artVariants ?? 0;
      expect(placed.variant).toBeGreaterThanOrEqual(1);
      // No art declared → variant is a harmless 1 and the emoji is drawn instead.
      if (n > 0) expect(placed.variant).toBeLessThanOrEqual(n);
      else expect(placed.variant).toBe(1);
    }
  });

  it("variant choice is stable for a seed, so a sprite can't swap on re-render", () => {
    const s = fullStock("autumn");
    const a = buildScene(s, "autumn", 99).map((p) => p.variant);
    const b = buildScene(s, "autumn", 99).map((p) => p.variant);
    expect(a).toEqual(b);
  });

  // A pair only works if both halves are drawn. One painted and one emoji would
  // give the answer away instantly, which is worse than no art at all.
  it("a decoy and the plant it mimics both have art, or neither does", () => {
    for (const p of FORAGE_PLANTS.filter((x) => x.mimics)) {
      const real = getForagePlant(p.mimics!)!;
      expect(
        (p.artVariants ?? 0) > 0,
        `${p.name} and ${real.name} must both be painted or both be placeholders`,
      ).toBe((real.artVariants ?? 0) > 0);
    }
  });
});

describe("foraging — terrain masks", () => {
  // A synthetic mask: left half is wood, right half grass, and a blocked band
  // down the middle. Lets us test the rule without a canvas.
  const split = (x: number) => (x < 45 ? "wood" as const : x > 55 ? "grass" as const : null);

  it("never places anything on blocked ground", () => {
    for (const p of buildScene(fullStock("autumn"), "autumn", 4, { terrainAt: split })) {
      expect(split(p.x)).not.toBeNull();
    }
  });

  it("places each plant only on ground it will grow on", () => {
    for (const p of buildScene(fullStock("autumn"), "autumn", 8, { terrainAt: split })) {
      const wants = getForagePlant(p.plantId)!.grows;
      if (wants) expect(wants).toContain(split(p.x));
    }
  });

  it("a mask that blocks everything yields an empty scene rather than cheating", () => {
    expect(buildScene(fullStock("autumn"), "autumn", 9, { terrainAt: () => null })).toHaveLength(0);
  });

  it("without a mask the whole frame is fair game (masks are optional)", () => {
    expect(buildScene(fullStock("autumn"), "autumn", 4).length).toBeGreaterThan(0);
  });

  // If a decoy grew somewhere its twin never does, its position would give it
  // away without the player ever having to look at it.
  it("a decoy can grow everywhere the plant it mimics can", () => {
    for (const p of FORAGE_PLANTS.filter((x) => x.mimics)) {
      const real = getForagePlant(p.mimics!)!;
      for (const ground of real.grows ?? []) {
        expect(
          p.grows ?? [],
          `${p.name} cannot grow on ${ground}, but ${real.name} can — its position would betray it`,
        ).toContain(ground);
      }
    }
  });
});
