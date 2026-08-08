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

/** Exported for the sandbox's mask-preview overlay. */
export const TERRAIN_SWATCH: Record<TerrainId, string> = {
  wood: "#c0392b",
  grass: "#27ae60",
  litter: "#2980b9",
};
