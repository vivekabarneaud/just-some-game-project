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
  | "build"
  | "bubbles"
  | "kitchen"
  | "bell"
  | "nav"
  | "confirm"
  | "error"
  | "notify";

/** Mixer channels. Each has its own player-set volume (see settings). `ui`
 *  is the default for one-shot interface SFX; `ambient` is for looping weather
 *  /environment beds; `music` is reserved for a future score. */
export type SoundChannel = "ui" | "ambient" | "music";

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
  /** Mixer channel. Defaults to "ui". */
  channel?: SoundChannel;
}

// Sourced from the "Ultimate Medieval Fantasy UI Sounds" pack, mapped by theme
// to each action (Wood = clicks, Coins = rewards, Metal = martial, Magic =
// arcane, Stone = denied, Paper = pages). Multi-URL entries get a random variant
// per play. `kitchen` keeps its original sizzle — the pack has no cooking sound.
const SOUNDS: Record<SoundId, SoundDef> = {
  page_turn: { url: [`${R2_BASE}/ui_page_turn_1.wav`, `${R2_BASE}/ui_page_turn_2.wav`], volume: 0.6 },
  plop:      { url: `${R2_BASE}/ui_plop.wav`,   volume: 0.7 },
  dagger:    { url: `${R2_BASE}/ui_dagger.wav`, volume: 0.8 },
  build:     { url: [`${R2_BASE}/ui_build_1.wav`, `${R2_BASE}/ui_build_2.wav`], volume: 0.7 },
  bubbles:   { url: `${R2_BASE}/ui_bubbles.wav`, volume: 0.6 },
  kitchen:   { url: `${R2_BASE}/kitchen.wav`,   volume: 0.7 },
  bell:      { url: `${R2_BASE}/ui_bell.wav`,   volume: 0.5 },
  // Semantic UI sounds:
  //   notify  → reward jingle (loot / quest-claim modal)
  //   error   → dull stone thud (failure, empty/locked state)
  //   confirm → meaty wood+metal click (golden upgrade-btn: claim, craft, upgrade)
  //   nav     → light wood click (sidebar nav-link)
  notify:  { url: `${R2_BASE}/ui_notify.wav`, volume: 0.6 },
  error:   { url: `${R2_BASE}/ui_error.wav`,  volume: 0.6 },
  confirm: { url: [`${R2_BASE}/ui_confirm_1.wav`, `${R2_BASE}/ui_confirm_2.wav`], volume: 0.6 },
  nav:     { url: [`${R2_BASE}/ui_nav_misc_1.wav`, `${R2_BASE}/ui_nav_misc_2.wav`], volume: 0.5 },
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

// ─── Mixer channel volumes ──────────────────────────────────────
// Player-set gains in [0, 1], persisted. Final play volume is:
//   clip.volume × channelVolume × masterVolume   (then gated by mute).
// `ambient` and `music` have no assets wired yet, but the controls persist so
// they take effect the moment looping beds / a score are added.
const VOL_KEYS = {
  master: "valenheart.vol.master",
  ui: "valenheart.vol.ui",
  ambient: "valenheart.vol.ambient",
  music: "valenheart.vol.music",
} as const;

function loadVol(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
  } catch {
    return fallback;
  }
}

const [masterVol, setMasterVolSignal] = createSignal(loadVol(VOL_KEYS.master, 1));
const [uiVol, setUiVolSignal] = createSignal(loadVol(VOL_KEYS.ui, 1));
const [ambientVol, setAmbientVolSignal] = createSignal(loadVol(VOL_KEYS.ambient, 0.7));
const [musicVol, setMusicVolSignal] = createSignal(loadVol(VOL_KEYS.music, 0.6));

export const masterVolume = masterVol;
export const uiVolume = uiVol;
export const ambientVolume = ambientVol;
export const musicVolume = musicVol;

function persistVol(key: string, value: number) {
  try { localStorage.setItem(key, String(value)); } catch { /* private mode */ }
}

export function setMasterVolume(v: number) { const c = Math.min(1, Math.max(0, v)); setMasterVolSignal(c); persistVol(VOL_KEYS.master, c); }
export function setUiVolume(v: number) { const c = Math.min(1, Math.max(0, v)); setUiVolSignal(c); persistVol(VOL_KEYS.ui, c); }
export function setAmbientVolume(v: number) { const c = Math.min(1, Math.max(0, v)); setAmbientVolSignal(c); persistVol(VOL_KEYS.ambient, c); }
export function setMusicVolume(v: number) { const c = Math.min(1, Math.max(0, v)); setMusicVolSignal(c); persistVol(VOL_KEYS.music, c); }

/** Effective gain for a channel, before the clip's own volume. */
export function channelVolume(channel: SoundChannel): number {
  const ch = channel === "ambient" ? ambientVol() : channel === "music" ? musicVol() : uiVol();
  return ch * masterVol();
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
  const base = volumeOverride ?? def.volume ?? 0.6;
  target.volume = Math.min(1, Math.max(0, base * channelVolume(def.channel ?? "ui")));
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
