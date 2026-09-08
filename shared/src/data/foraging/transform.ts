// ─── One description of how a sprite is placed ──────────────────────────────
// A plant's placement used to be written twice: once as a CSS transform in the
// renderer, and once as arithmetic in the generator that worked out where a
// painted berry spot landed. They drifted — the sprite could be mirrored while
// the spot maths could not — and berries hung in mid-air beside flipped bushes.
//
// So the transform is described ONCE, as an ordered list of operations, and
// then rendered two ways: `toCss` for the browser, `applyToPoint` for anything
// that needs to know where a point on the sprite actually ended up. Adding a
// new operation (a sway, a skew, a perspective squeeze) means adding it to
// `spriteOps` and handling it in both renderers, which sit next to each other
// here — rather than editing one and forgetting the other exists.

import type { PlacedPlant } from "./types.js";

export type TransformOp =
  | { op: "translate"; x: number; y: number }
  | { op: "scale"; x: number; y: number }
  | { op: "rotate"; deg: number };

/** A sprite's drawn size, in percent of the (square) scene. */
export interface SpriteBox { w: number; h: number }

/** How much of a sprite sits ABOVE its position. A plant stands on its spot
 *  rather than hovering centred over it, and this is also the point it turns
 *  about, so a lean pivots at the base like a real stem. */
export const ANCHOR_Y = 0.88;

export function spriteBox(p: PlacedPlant, spriteHeightPct: number, aspect: number): SpriteBox {
  const h = spriteHeightPct * p.scale;
  return { w: h * aspect, h };
}

/** The operations that place this sprite, in CSS order (left to right, so the
 *  LAST is applied to the element first). `magnify` is a render-only flourish
 *  for hovering; it must not be passed when resolving spots, or a bush would
 *  fling its berries about as the cursor crossed it. */
export function spriteOps(p: PlacedPlant, magnify = 1): TransformOp[] {
  return [
    { op: "translate", x: -50, y: -ANCHOR_Y * 100 },
    { op: "scale", x: magnify, y: magnify },
    { op: "rotate", deg: p.rotate },
    { op: "scale", x: p.flip ? -1 : 1, y: 1 },
  ];
}

/** For the browser. Percentages here are of the ELEMENT's own size, which is
 *  what CSS translate does with them. */
export function toCss(ops: TransformOp[]): string {
  return ops.map((o) =>
    o.op === "translate" ? `translate(${o.x}%,${o.y}%)`
      : o.op === "scale" ? (o.y === o.x ? `scale(${o.x})` : `scale(${o.x},${o.y})`)
      : `rotate(${o.deg}deg)`,
  ).join(" ");
}

/** Where a point on the sprite lands in the scene.
 *
 *  `sx`/`sy` are in the sprite's own 0..1 space (0,0 top-left). The result is in
 *  scene percent. Mirrors `toCss` exactly: the same ops, applied in the same
 *  order, about the same origin. */
export function applyToPoint(
  ops: TransformOp[],
  box: SpriteBox,
  at: { x: number; y: number },
  sx: number,
  sy: number,
): { x: number; y: number } {
  // Start in the sprite's own space, measured from the transform origin — which
  // is the anchor, the point the CSS translate puts exactly on `at`.
  let px = (sx - 0.5) * box.w;
  let py = (sy - ANCHOR_Y) * box.h;

  // CSS applies the rightmost function to the element first, so walk backwards.
  for (let i = ops.length - 1; i >= 0; i--) {
    const o = ops[i];
    if (o.op === "scale") {
      px *= o.x; py *= o.y;
    } else if (o.op === "rotate") {
      const r = (o.deg * Math.PI) / 180;
      const c = Math.cos(r), s = Math.sin(r);
      [px, py] = [px * c - py * s, px * s + py * c];
    }
    // `translate` is the one that puts the origin on `at`, and is already
    // accounted for by measuring from the anchor above.
  }
  return { x: at.x + px, y: at.y + py };
}
