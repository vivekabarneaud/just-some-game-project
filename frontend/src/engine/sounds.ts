// ─── Sound engine ───────────────────────────────────────────────
// Tiny SFX player on top of HTMLAudioElement. Each registered clip is
// fetched once, then cloneNode'd per play so rapid triggers overlap
// instead of restarting. We use HTMLAudioElement (rather than Web Audio)
// because R2's public CDN does not send CORS headers — fetch+decodeAudioData
// would fail, but plain <audio> loading is not CORS-restricted.

import { createSignal } from "solid-js";

const R2_BASE = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/sfx";

export type SoundId = "page_turn" | "plop" | "dagger";

interface SoundDef {
  url: string;
  /** Skip first N seconds on play. Cheap workaround for clips with leading
   *  silence; trim the source file when you can — this just hides it. */
  startOffset?: number;
  /** Default gain in [0, 1]. HTMLAudioElement caps at 1; quieter clips need
   *  amplification on the source file (or a Web Audio refactor + R2 CORS). */
  volume?: number;
}

const SOUNDS: Record<SoundId, SoundDef> = {
  page_turn: { url: `${R2_BASE}/page_turn.wav`,   volume: 0.7 },
  plop:      { url: `${R2_BASE}/object_drop.wav`, volume: 0.7 },
  // ?v=3 cache-busts the third dagger upload (Cache-Control on R2 is immutable).
  dagger:    { url: `${R2_BASE}/dagger.wav?v=3`,  volume: 1.0 },
};

const MUTE_KEY = "valenheart.sfx.muted";

const initialMuted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
})();

const [muted, setMutedSignal] = createSignal(initialMuted);

export const isMuted = muted;

export function setMuted(value: boolean) {
  setMutedSignal(value);
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch { /* private mode etc. */ }
}

export function toggleMuted() {
  setMuted(!muted());
}

// Pool of pre-loaded Audio elements per sound. cloneNode on an
// HTMLMediaElement creates a fresh node at readyState 0 — even with the
// file in the HTTP cache, the clone has to re-init before play, which
// adds visible latency. Pooled elements stay at readyState 4 after
// their initial load, so play() fires instantly.
const POOL_SIZE = 4;
const pool: Partial<Record<SoundId, HTMLAudioElement[]>> = {};

function buildPool(id: SoundId): HTMLAudioElement[] {
  const arr: HTMLAudioElement[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const a = new Audio(SOUNDS[id].url);
    a.preload = "auto";
    a.load();
    arr.push(a);
  }
  return arr;
}

function getPool(id: SoundId): HTMLAudioElement[] {
  let arr = pool[id];
  if (!arr) {
    arr = buildPool(id);
    pool[id] = arr;
  }
  return arr;
}

if (typeof window !== "undefined") {
  for (const id of Object.keys(SOUNDS) as SoundId[]) getPool(id);
}

/** Fire a registered SFX. `volumeOverride` replaces the per-sound default. */
export function playSound(id: SoundId, volumeOverride?: number) {
  if (muted()) return;
  const def = SOUNDS[id];
  const arr = getPool(id);
  // Pick an idle slot (paused or finished). If everything is mid-play
  // (rare), fall back to the oldest — better to cut off than to drop.
  const target = arr.find((a) => a.paused || a.ended) ?? arr[0];
  target.volume = volumeOverride ?? def.volume ?? 0.6;
  try {
    target.currentTime = def.startOffset ?? 0;
  } catch {
    // currentTime can throw if metadata isn't loaded yet — ignore and let
    // play() start from 0; the pool warms up after the first round.
  }
  void target.play().catch(() => { /* autoplay blocked or asset missing */ });
}
