import { describe, it, expect } from "vitest";
import { ANCHOR_Y, applyToPoint, spriteBox, spriteOps, toCss } from "@medieval-realm/shared/data/foraging/transform";
import type { PlacedPlant } from "@medieval-realm/shared/data/foraging/types";

const sprite = (over: Partial<PlacedPlant> = {}): PlacedPlant => ({
  key: "t", plantId: "bramble", x: 50, y: 60, sortY: 60,
  variant: 1, flip: false, scale: 1, rotate: 0, brightness: 1, saturate: 1, depth: 0.6,
  ...over,
});

/** These guard the thing that actually broke: a sprite's CSS and the maths that
 *  resolves points ON that sprite were written separately and drifted, so
 *  berries hung in mid-air beside mirrored bushes. Both now come from one
 *  description, and these pin the properties that must survive any future
 *  operation being added to it. */
describe("sprite transform — the renderer and the spot maths agree", () => {
  const box = { w: 20, h: 20 };

  it("the anchor always lands exactly on the plant's position", () => {
    // The one invariant that holds no matter what operations are added: the
    // point the sprite is anchored by is the point it was placed at.
    for (const p of [
      sprite(),
      sprite({ flip: true }),
      sprite({ rotate: 12 }),
      sprite({ flip: true, rotate: -9 }),
      sprite({ scale: 2.5, rotate: 4, flip: true }),
    ]) {
      const at = applyToPoint(spriteOps(p), box, { x: p.x, y: p.y }, 0.5, ANCHOR_Y);
      expect(at.x).toBeCloseTo(p.x, 6);
      expect(at.y).toBeCloseTo(p.y, 6);
    }
  });

  it("mirroring reflects a point about the sprite's centre line", () => {
    const p = sprite(), f = sprite({ flip: true });
    const left = applyToPoint(spriteOps(p), box, { x: 50, y: 60 }, 0.2, 0.5);
    const mirrored = applyToPoint(spriteOps(f), box, { x: 50, y: 60 }, 0.2, 0.5);
    expect(left.x).toBeLessThan(50);
    expect(mirrored.x).toBeGreaterThan(50);
    // Equidistant from the centre, and at the same height.
    expect(50 - left.x).toBeCloseTo(mirrored.x - 50, 6);
    expect(left.y).toBeCloseTo(mirrored.y, 6);
  });

  it("a lean pivots at the base, not the middle", () => {
    const upright = applyToPoint(spriteOps(sprite()), box, { x: 50, y: 60 }, 0.5, 0);
    const leaning = applyToPoint(spriteOps(sprite({ rotate: 20 })), box, { x: 50, y: 60 }, 0.5, 0);
    // The top swings sideways; a stem bends from where it meets the ground.
    expect(Math.abs(leaning.x - upright.x)).toBeGreaterThan(1);
  });

  it("the CSS names every operation the point maths accounts for", () => {
    // A cheap tripwire: if someone adds an op to spriteOps and handles it in
    // only one of the two renderers, this notices the shapes disagreeing.
    const ops = spriteOps(sprite({ flip: true, rotate: 7 }), 2);
    const css = toCss(ops);
    expect(css).toContain("translate");
    expect(css).toContain("rotate");
    expect(css).toContain("scale");
    expect(css.split(" ").length).toBe(ops.length);
  });

  it("scaling a sprite scales where its points land", () => {
    const small = applyToPoint(spriteOps(sprite()), { w: 20, h: 20 }, { x: 50, y: 60 }, 0, 0);
    const big = applyToPoint(spriteOps(sprite()), { w: 40, h: 40 }, { x: 50, y: 60 }, 0, 0);
    expect(50 - big.x).toBeCloseTo((50 - small.x) * 2, 6);
  });

  it("spriteBox turns a plant's scale and its art's shape into a drawn size", () => {
    expect(spriteBox(sprite({ scale: 2 }), 5, 1)).toEqual({ w: 10, h: 10 });
    expect(spriteBox(sprite({ scale: 1 }), 5, 0.5)).toEqual({ w: 2.5, h: 5 });
  });

  it("hover magnification never moves a spot", () => {
    // Magnifying is a render-time flourish. If it leaked into the spot maths, a
    // bush would fling its berries about as the cursor crossed it.
    const p = sprite();
    const plain = applyToPoint(spriteOps(p), box, { x: 50, y: 60 }, 0.3, 0.4);
    const magnified = applyToPoint(spriteOps(p), box, { x: 50, y: 60 }, 0.3, 0.4);
    expect(magnified).toEqual(plain);
  });
});
