import type { TerrainId } from "@medieval-realm/shared/data/foraging/types";

/** Reads a scene's painted terrain mask so plants only sprout where they'd
 *  actually grow — mushrooms by trunks and fallen wood, greens on open grass,
 *  nothing out of a rock.
 *
 *  The mask is a PNG the artist paints as a layer over the background, using
 *  three pure brush colours. Classification is by DOMINANT CHANNEL rather than
 *  exact match, so a soft brush edge, a slightly-off swatch, or PNG compression
 *  all still read correctly:
 *
 *    RED   → "wood"    trunk bases, roots, fallen logs
 *    GREEN → "grass"   weedy clearing, low ground cover
 *    BLUE  → "litter"  leaf litter, open bare earth
 *    black / transparent / dim → BLOCKED (rock, water, deep shadow)
 *
 *  A scene with no mask file simply gets no sampler, and the whole frame is
 *  fair game — so masks are an enhancement, never a requirement. */

/** Below this, a pixel is treated as unpainted (blocked) rather than a colour. */
const MIN_INTENSITY = 40;
/** How much the winning channel must lead by, so muddy greys don't classify. */
const DOMINANCE = 1.25;

export type TerrainSampler = (x: number, y: number) => TerrainId | null;

function classify(r: number, g: number, b: number, a: number): TerrainId | null {
  if (a < 128) return null;
  // An anchor daub is not ground. Checked first because the vocabularies
  // overlap — violet's dominant channel is blue, which the rule below would
  // otherwise read as leaf litter.
  if (anchorOf(r, g, b, a)) return null;
  const max = Math.max(r, g, b);
  if (max < MIN_INTENSITY) return null;
  if (r === max && r >= g * DOMINANCE && r >= b * DOMINANCE) return "wood";
  if (g === max && g >= r * DOMINANCE && g >= b * DOMINANCE) return "grass";
  if (b === max && b >= r * DOMINANCE && b >= g * DOMINANCE) return "litter";
  return null; // ambiguous grey — safer to block than to guess
}

/** Load a mask and return a sampler, or null if there isn't one (404, decode
 *  failure, or a tainted canvas). Never throws: a missing mask is a normal,
 *  expected state while the art is being made. */
export async function loadTerrainMask(url: string): Promise<TerrainSampler | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous"; // R2-hosted masks still need to be readable
    const loaded = new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
    img.src = url;
    if (!(await loaded)) return null;

    // Downsample: we only ever ask "roughly what is here", so a small buffer is
    // plenty and keeps the read cheap.
    const W = 256, H = 256;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, W, H);

    const { data } = ctx.getImageData(0, 0, W, H);
    return (x: number, y: number) => {
      const px = Math.min(W - 1, Math.max(0, Math.round((x / 100) * (W - 1))));
      const py = Math.min(H - 1, Math.max(0, Math.round((y / 100) * (H - 1))));
      const i = (py * W + px) * 4;
      return classify(data[i], data[i + 1], data[i + 2], data[i + 3]);
    };
  } catch {
    return null; // e.g. a cross-origin taint on getImageData
  }
}

// ─── Anchors: exact spots where a specific thing grows ──────────────────────
// Terrain says what KIND of ground a region is. An anchor says "this precise
// spot bears blackberries", and is how fruit hangs on a bush that is part of
// the painting rather than a sprite — see DESIGN_FORAGING_MINIGAME.
//
// Anchors are matched by NEAREST COLOUR and tested BEFORE terrain, because the
// two vocabularies overlap: a violet daub's dominant channel is blue, so the
// terrain rule would happily read it as leaf litter.

/** Paint these. Approximate is fine — nearest wins, within ANCHOR_TOLERANCE. */
export const ANCHOR_COLOURS: Record<string, string> = {
  blackberry: "#7B00D4",   // violet
  juniper:    "#00C8FF",   // cyan
  rosehip:    "#FF7A00",   // orange
  elderberry: "#FF00C8",   // magenta
  /** Fungi growing ON standing wood — a trunk face, a rotting stump. */
  wood_fungus: "#FFE800",  // yellow
};
/** How far a painted colour may stray and still be recognised. Generous enough
 *  for a soft brush edge, tight enough that the terrain trio never matches. */
const ANCHOR_TOLERANCE = 95;

const hexRgb = (hex: string): [number, number, number] =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const ANCHOR_RGB = Object.entries(ANCHOR_COLOURS).map(([id, hex]) => [id, hexRgb(hex)] as const);

/** Which anchor a pixel is, if any. */
function anchorOf(r: number, g: number, b: number, a: number): string | null {
  if (a < 128) return null;
  let best: string | null = null, bestD = Infinity;
  for (const [id, [ar, ag, ab]] of ANCHOR_RGB) {
    const d = Math.hypot(r - ar, g - ag, b - ab);
    if (d < bestD) { bestD = d; best = id; }
  }
  return bestD <= ANCHOR_TOLERANCE ? best : null;
}

/** A painted spot, in scene percent. */
export interface SceneAnchor { plantId: string; x: number; y: number; }

/** Read every anchor daub on a scene mask, flood-filled so one brushstroke
 *  yields one point however raggedly it was made. */
export async function loadSceneAnchors(url: string): Promise<SceneAnchor[]> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const ok = await new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
    if (!ok) return [];

    const N = 256;
    const canvas = document.createElement("canvas");
    canvas.width = N; canvas.height = N;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, N, N);
    const { data } = ctx.getImageData(0, 0, N, N);

    const idAt = (x: number, y: number) => {
      const i = (y * N + x) * 4;
      return anchorOf(data[i], data[i + 1], data[i + 2], data[i + 3]);
    };
    const seen = new Uint8Array(N * N);
    const out: SceneAnchor[] = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const id = idAt(x, y);
        if (!id || seen[y * N + x]) continue;
        let sx = 0, sy = 0, n = 0;
        const stack = [[x, y]];
        while (stack.length) {
          const [cx, cy] = stack.pop()!;
          if (cx < 0 || cy < 0 || cx >= N || cy >= N) continue;
          if (seen[cy * N + cx] || idAt(cx, cy) !== id) continue;
          seen[cy * N + cx] = 1;
          sx += cx; sy += cy; n++;
          stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
        if (n >= 3) out.push({ plantId: id, x: (sx / n / (N - 1)) * 100, y: (sy / n / (N - 1)) * 100 });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** Exported for the sandbox's mask-preview overlay. */
export const TERRAIN_SWATCH: Record<TerrainId, string> = {
  wood: "#c0392b",
  grass: "#27ae60",
  litter: "#2980b9",
};

/** Reads how brightly lit the SCENE ITSELF is at a point, so a sprite dropped
 *  into a dark hollow can be darkened to match and one in a sunlit patch left
 *  alone. The painting already knows where its shadows are, so no second
 *  hand-painted light mask is needed.
 *
 *  Sampled from a deliberately tiny downsample: we want the local *mood* of the
 *  ground, not the brightness of one leaf. At 40px the browser's own filtering
 *  does the blurring for us, so a sprite standing on a bright fleck in a dark
 *  crevice still reads as being in shadow. */
export type LightSampler = (x: number, y: number) => number;

export async function loadLuminanceField(url: string): Promise<LightSampler | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const loaded = new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
    img.src = url;
    if (!(await loaded)) return null;

    const N = 40;
    const canvas = document.createElement("canvas");
    canvas.width = N; canvas.height = N;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, N, N);
    const { data } = ctx.getImageData(0, 0, N, N);

    return (x: number, y: number) => {
      const px = Math.min(N - 1, Math.max(0, Math.round((x / 100) * (N - 1))));
      const py = Math.min(N - 1, Math.max(0, Math.round((y / 100) * (N - 1))));
      const i = (py * N + px) * 4;
      // Rec. 601 luma — perceptual enough for this, and cheap.
      return (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    };
  } catch {
    return null;
  }
}

/** Turn local scene brightness into a sprite tint. Shadowed ground pulls a
 *  plant down and desaturates it; lit ground leaves it near its painted value.
 *  Bounded at both ends so nothing ever vanishes or blows out. */
export function lightTint(luma: number): { brightness: number; saturate: number } {
  const l = Math.min(1, Math.max(0, luma));
  return {
    brightness: 0.62 + 0.55 * l,   // ~0.62 in deep shadow, ~1.05 in bright light
    saturate: 0.72 + 0.36 * l,     // shadows drain colour, as they do in life
  };
}
