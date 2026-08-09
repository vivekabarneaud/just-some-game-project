/** Berry spots painted onto a host sprite.
 *
 *  A bramble is scenery: you never pick the bush, you pick the fruit ON it. So
 *  the artist paints a companion mask beside the sprite —
 *  `{plant}{n}_mask.png` — daubing PURPLE wherever a berry cluster would
 *  plausibly hang. This reads those daubs back as attachment points.
 *
 *  Why a mask rather than scattering berries over the sprite's bounding box:
 *  a bramble is mostly air. Random placement would hang fruit off empty sky and
 *  bury it inside the leaf mass, where a bush painted by hand knows exactly
 *  which stems could bear it.
 *
 *  The payoff is that depletion becomes visible in the right place. Stock
 *  running low stops meaning "fewer bushes in the wood" and starts meaning
 *  "this bush is picked over", which is the far more legible lesson. */

/** A spot in the host sprite's own space: 0,0 top-left, 1,1 bottom-right. */
export interface HostSpot { sx: number; sy: number; }

/** Purple, loosely. Matched by relationship rather than exact value so the
 *  brush's soft edges and any compression still read. */
const isSpot = (r: number, g: number, b: number, a: number) =>
  a > 128 && b > 90 && g < 90 && b > g * 1.8 && r > g;

/** Read a host's spots, or null when it has no mask (which is fine — a host
 *  without one simply bears no fruit). Never throws. */
export async function loadHostSpots(url: string): Promise<HostSpot[] | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const ok = await new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
    if (!ok) return null;

    const N = 128; // plenty: we want a blob's centre, not its outline
    const canvas = document.createElement("canvas");
    canvas.width = N; canvas.height = N;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, N, N);
    const { data } = ctx.getImageData(0, 0, N, N);

    // Flood-fill each daub and take its centre, so one painted blob yields one
    // spot however big or ragged it was brushed.
    const seen = new Uint8Array(N * N);
    const spots: HostSpot[] = [];
    const at = (x: number, y: number) => {
      const i = (y * N + x) * 4;
      return isSpot(data[i], data[i + 1], data[i + 2], data[i + 3]);
    };
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (seen[y * N + x] || !at(x, y)) continue;
        let sumX = 0, sumY = 0, n = 0;
        const stack = [[x, y]];
        while (stack.length) {
          const [cx, cy] = stack.pop()!;
          if (cx < 0 || cy < 0 || cx >= N || cy >= N) continue;
          if (seen[cy * N + cx] || !at(cx, cy)) continue;
          seen[cy * N + cx] = 1;
          sumX += cx; sumY += cy; n++;
          stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
        // Ignore stray specks — a real daub covers a few pixels even at 128px.
        if (n >= 2) spots.push({ sx: sumX / n / (N - 1), sy: sumY / n / (N - 1) });
      }
    }
    return spots;
  } catch {
    return null;
  }
}
