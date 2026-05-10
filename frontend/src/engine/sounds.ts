// ─── Sound engine ───────────────────────────────────────────────
// Tiny SFX player on top of HTMLAudioElement. Each registered clip is
// fetched once, then cloneNode'd per play so rapid triggers overlap
// instead of restarting. We use HTMLAudioElement (rather than Web Audio)
// because R2's public CDN does not send CORS headers — fetch+decodeAudioData
// would fail, but plain <audio> loading is not CORS-restricted.

import { createSignal } from "solid-js";

const R2_BASE = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/sfx";

export type SoundId =
  | "page_turn"
  | "plop"
  | "dagger"
  | "bubbles"
  | "kitchen"
  | "bell"
  | "nav"
  | "confirm"
  | "error"
  | "notify";

interface SoundDef {
  /** Single URL OR a list. When a list is set, each play picks one at
   *  random — gives organic variety to repeated triggers (e.g. button clicks). */
  url: string | string[];
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
  bubbles:   { url: `${R2_BASE}/bubbles.wav`,     volume: 0.7 },
  kitchen:   { url: `${R2_BASE}/kitchen.wav`,     volume: 0.7 },
  bell:      { url: `${R2_BASE}/bells_1.wav`,     volume: 0.6 },
  // Semantic UI sounds. Each maps to one of the four `soundN` variants:
  //   sound1 → notify (modal pop, banner)
  //   sound2 → error (failure, empty/locked state)
  //   sound3 → confirm (golden upgrade-btn click — claim, craft, upgrade)
  //   sound4 → nav (sidebar nav-link click)
  notify:  { url: `${R2_BASE}/sound1.wav`, volume: 0.5 },
  error:   { url: `${R2_BASE}/sound2.wav`, volume: 0.5 },
  confirm: { url: `${R2_BASE}/sound3.wav`, volume: 0.5 },
  nav:     { url: `${R2_BASE}/sound4.wav`, volume: 0.5 },
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

// Pool of pre-loaded Audio elements per source URL. cloneNode on an
// HTMLMediaElement creates a fresh node at readyState 0 — even with the
// file in the HTTP cache, the clone has to re-init before play, which
// adds visible latency. Pooled elements stay at readyState 4 after
// their initial load, so play() fires instantly. Sounds with multi-URL
// `url` lists keep one pool per variant; playSound picks a variant at
// random per call so consecutive triggers don't sound identical.
const POOL_SIZE = 4;
const pools = new Map<string, HTMLAudioElement[]>();

function getPoolFor(url: string): HTMLAudioElement[] {
  let arr = pools.get(url);
  if (!arr) {
    arr = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const a = new Audio(url);
      a.preload = "auto";
      a.load();
      arr.push(a);
    }
    pools.set(url, arr);
  }
  return arr;
}

function urlsFor(def: SoundDef): string[] {
  return Array.isArray(def.url) ? def.url : [def.url];
}

if (typeof window !== "undefined") {
  for (const def of Object.values(SOUNDS)) {
    for (const url of urlsFor(def)) getPoolFor(url);
  }
}

/** Global listener — semantic UI sounds keyed off CSS selectors.
 *    a.nav-link        → nav (sidebar)
 *    button.upgrade-btn → confirm (golden action buttons: claim, craft, upgrade)
 *  Opt out per-button via `data-no-click-sound` (kitchen/brew/deploy buttons
 *  whose action already plays a themed SFX, mute toggle).
 *  Idempotent: subsequent calls reuse the existing listener. */
let clickListenerInstalled = false;
export function installGlobalClickSound() {
  if (clickListenerInstalled || typeof document === "undefined") return;
  clickListenerInstalled = true;
  document.addEventListener("click", (e) => {
    const target = e.target as Element | null;
    if (!target) return;
    const opted = target.closest("[data-no-click-sound]");
    if (opted) return;
    if (target.closest("a.nav-link")) {
      playSound("nav");
      return;
    }
    if (target.closest("button.upgrade-btn")) {
      playSound("confirm");
    }
  });
}

/** Fire a registered SFX. `volumeOverride` replaces the per-sound default.
 *  Multi-URL sounds pick a random variant per call. Sounds are suppressed
 *  while the document is hidden (background tab, locked screen) — the
 *  player isn't there to hear them, and nothing should surprise them when
 *  they come back. */
export function playSound(id: SoundId, volumeOverride?: number) {
  if (muted()) return;
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
  const def = SOUNDS[id];
  const urls = urlsFor(def);
  const url = urls[Math.floor(Math.random() * urls.length)];
  const arr = getPoolFor(url);
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

/** Page-mount sound — fires a sound only on a real navigation, not on a
 *  reload. Uses sessionStorage to compare the previous pathname; if it
 *  matches the current one, the page reloaded (or the user re-entered
 *  the same page somehow), and we stay silent. Without this, the
 *  stale-state auto-reload (when laptop wakes from sleep with a 409)
 *  would replay every page-mount sound and surprise the player. */
const PAGE_MOUNT_KEY = "valenheart.sfx.lastPath";
export function playPageMountSound(id: SoundId, volumeOverride?: number) {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  let prev: string | null = null;
  try { prev = sessionStorage.getItem(PAGE_MOUNT_KEY); } catch { /* private mode */ }
  try { sessionStorage.setItem(PAGE_MOUNT_KEY, path); } catch { /* private mode */ }
  if (prev === path) return;
  playSound(id, volumeOverride);
}
