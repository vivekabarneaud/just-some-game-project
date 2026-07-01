import { onCleanup, onMount } from "solid-js";
import { useGame } from "~/engine/gameState";
import { HOURS_PER_SEASON, IS_DEV, getGlobalSeason } from "~/data/seasons";
import { resolveWeather } from "~/data/weather";
import { ambientVolume, masterVolume, isMuted } from "~/engine/sounds";

/**
 * Weather-driven nature ambience on the `ambient` mixer channel, layered so it
 * never sounds like a loop:
 *  - a strong STORM wind that loops constantly during storms (a storm should
 *    howl), layered under the rain;
 *  - BIRD one-shots fired at random gaps with random volume + pitch while clear,
 *    so no repetition is perceptible.
 *
 * Sources (freesound.org): storm wind + robins by InspectorJ — see CREDITS.md.
 */
const R2 = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/sfx";
const WIND_STORM_URL = `${R2}/wind_storm.m4a`; // strong gust — storms (constant)
const BIRD_URLS = [`${R2}/bird_robin_a.m4a`, `${R2}/bird_robin_b.m4a`];
const STORM_WIND_VOLUME = 0.45;
const BIRD_VOLUME = 0.5;
const FADE_SECONDS = 6;
const BIRD_MIN_GAP_MS = 12000;
const BIRD_EXTRA_GAP_MS = 18000; // gap = 12..30s

interface Bed {
  audio: HTMLAudioElement;
  volume: number;
  active: () => boolean;
  level: number;
}

export default function AmbientNature() {
  const { state } = useGame();

  const weather = () => {
    const info = IS_DEV
      ? { season: state.season, progress: state.seasonElapsed / HOURS_PER_SEASON, year: state.year }
      : getGlobalSeason();
    return resolveWeather(info.season, info.progress, info.year);
  };
  const isStormy = () => {
    const w = weather();
    return w === "storm" || w === "unnatural_storm";
  };
  const isClear = () => weather() === "clear";
  const audible = () => !isMuted() && ambientVolume() > 0 && masterVolume() > 0;

  onMount(() => {
    // ── Wind beds: each eases its own 0..1 level toward its weather goal over
    //    ~FADE_SECONDS (duration-based, so the fade is consistent at any volume).
    //    They never overlap in practice — clear/overcast vs storm are disjoint. ──
    const makeBed = (url: string, volume: number, active: () => boolean): Bed => {
      const audio = new Audio(url);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
      return { audio, volume, active, level: 0 };
    };
    // Only the storm wind is a constant bed. The gentle clear-weather wind is
    // played as occasional gusts (below), not a steady loop.
    const beds: Bed[] = [
      makeBed(WIND_STORM_URL, STORM_WIND_VOLUME, isStormy),
    ];

    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000 || 0);
      last = t;
      const step = dt / FADE_SECONDS;
      for (const b of beds) {
        const on = b.active();
        const goal = on ? 1 : 0;
        if (b.level < goal) b.level = Math.min(goal, b.level + step);
        else if (b.level > goal) b.level = Math.max(goal, b.level - step);
        const target = isMuted() ? 0 : b.volume * ambientVolume() * masterVolume();
        b.audio.volume = b.level * target;
        if (on && b.audio.paused) b.audio.play().catch(() => {});
        else if (!on && b.level <= 0.001 && !b.audio.paused) b.audio.pause();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // ── Bird one-shots: a fresh Audio per chirp (the file is browser-cached), so
    //    overlapping calls can't clip each other. Random volume + playbackRate
    //    multiply variety out of just two samples. Autoplay may block the first
    //    chirp before any user gesture — harmless, the next one plays. ──
    let birdTimer = 0;
    const playBird = () => {
      const url = BIRD_URLS[Math.floor(Math.random() * BIRD_URLS.length)];
      const a = new Audio(url);
      a.volume = BIRD_VOLUME * (0.6 + Math.random() * 0.4) * ambientVolume() * masterVolume();
      a.playbackRate = 0.92 + Math.random() * 0.16; // subtle pitch variation
      a.play().catch(() => {});
    };
    const scheduleBird = () => {
      const delay = BIRD_MIN_GAP_MS + Math.random() * BIRD_EXTRA_GAP_MS;
      birdTimer = window.setTimeout(() => {
        if (isClear() && audible()) playBird();
        scheduleBird();
      }, delay);
    };
    scheduleBird();

    onCleanup(() => {
      cancelAnimationFrame(raf);
      window.clearTimeout(birdTimer);
      for (const b of beds) {
        b.audio.pause();
        b.audio.src = "";
      }
    });
  });

  return null;
}
