import { describe, it, expect } from "vitest";
import { FORAGE_PLANTS, getForagePlant, isDecoy } from "@medieval-realm/shared/data/foraging/plants";
import { buildScene, fullStock, pick, rain, regrow, seasonCap, sizeRangesOverlap, DEFAULT_SIZE } from "@medieval-realm/shared/data/foraging/scene";

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

  it("keeps sprites inside the frame, and never stacks two on one spot", () => {
    const scene = buildScene(fullStock("summer"), "summer", 11);
    for (const p of scene) {
      expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(100);
      expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(100);
    }
    // Clump-mates sit close on purpose, so the floor is the intra-clump gap,
    // not the between-clump one. Each must still be its own clickable thing.
    for (let i = 0; i < scene.length; i++) {
      for (let j = i + 1; j < scene.length; j++) {
        expect(Math.hypot(scene[i].x - scene[j].x, scene[i].y - scene[j].y)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("fruits in company: a plant that clumps places neighbours near its own kind", () => {
    const scene = buildScene(fullStock("autumn"), "autumn", 21);
    const chants = scene.filter((p) => p.plantId === "chanterelle");
    expect(chants.length).toBeGreaterThan(1);
    // Every chanterelle should have another within a clump's reach.
    for (const c of chants) {
      const nearest = Math.min(...chants.filter((o) => o !== c)
        .map((o) => Math.hypot(o.x - c.x, o.y - c.y)));
      expect(nearest).toBeLessThan(16);
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

  // Sorting a pair by silhouette is not identifying it. Sizes must match unless
  // size is genuinely the real-world tell, in which case the note must say so.
  it("a decoy shares its twin's size range, unless size is the tell", () => {
    for (const p of FORAGE_PLANTS.filter((x) => x.mimics)) {
      const real = getForagePlant(p.mimics!)!;
      const a = p.size ?? DEFAULT_SIZE, b = real.size ?? DEFAULT_SIZE;
      if (a[0] === b[0] && a[1] === b[1]) continue;
      // Sizes differ, so size must BE the tell: the ranges must not overlap at
      // all, and the note must tell the player to go by it.
      expect(
        sizeRangesOverlap(a, b),
        `${p.name} and ${real.name} differ in size but their ranges overlap — a big impostor could pass for a small real one`,
      ).toBe(false);
      expect(
        p.note.toLowerCase(),
        `${p.name} differs in size from ${real.name}, so its note must tell the player to go by size`,
      ).toContain("size");
    }
  });

  // Memorising the smaller set is the exploit: if the impostor has three shapes
  // and the real thing has six, you can learn the three and call everything else
  // safe, without ever looking at a single ridge.
  it("a decoy has as many painted shapes as its twin", () => {
    for (const p of FORAGE_PLANTS.filter((x) => x.mimics)) {
      const real = getForagePlant(p.mimics!)!;
      expect(
        p.artVariants ?? 0,
        `${p.name} must offer as many shapes as ${real.name}, or its set is the easier one to memorise`,
      ).toBe(real.artVariants ?? 0);
    }
  });

  // The point of per-species ranges. Note we do NOT claim a total ordering:
  // a small bolete really can be smaller than a big chanterelle, and that is
  // fine because they are not a pair. Only the parasol's separation matters.
  it("a parasol out-tops every other mushroom, however small it grows", () => {
    const of = (id: string) => getForagePlant(id)!.size ?? DEFAULT_SIZE;
    const smallestParasol = of("parasol")[0];
    for (const id of ["cepe", "bitter_bolete", "chanterelle", "false_chanterelle",
                      "morel", "false_morel", "field_mushroom", "deadly_dapperling"]) {
      expect(smallestParasol, `a small parasol must still out-top the biggest ${id}`)
        .toBeGreaterThan(of(id)[1]);
    }
  });

  it("draws the same plant at visibly different sizes", () => {
    const scales = buildScene(fullStock("autumn"), "autumn", 55)
      .filter((p) => p.plantId === "chanterelle").map((p) => p.scale);
    expect(scales.length).toBeGreaterThan(2);
    expect(Math.max(...scales) - Math.min(...scales)).toBeGreaterThan(0.15);
  });

  it("mirrors and tones sprites, so painted quirks can't become the tell", () => {
    const scene = buildScene(fullStock("autumn"), "autumn", 31);
    expect(scene.length).toBeGreaterThan(4);
    // Both mirrorings occur, so "which way it leans" carries no information.
    expect(new Set(scene.map((p) => p.flip)).size).toBe(2);
    for (const p of scene) {
      expect(p.brightness).toBeGreaterThan(0.85);
      expect(p.brightness).toBeLessThan(1.15);
      expect(p.saturate).toBeGreaterThan(0.85);
      expect(p.saturate).toBeLessThan(1.2);
    }
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

describe("foraging — rain", () => {
  it("brings the mushrooms up, and past their usual ceiling", () => {
    const dry = fullStock("autumn");
    const wet = rain(dry, "autumn");
    expect(wet.chanterelle).toBeGreaterThan(seasonCap("chanterelle", "autumn"));
  });

  it("leaves plants that don't answer to weather alone", () => {
    const dry = fullStock("autumn");
    expect(rain(dry, "autumn").rosehip).toBe(dry.rosehip); // no rainFlush declared
  });

  it("does nothing out of season — no chanterelles in a winter downpour", () => {
    const winter = fullStock("winter");
    expect(rain(winter, "winter").chanterelle ?? 0).toBe(0);
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
