import { onCleanup, onMount } from "solid-js";
import { useGame } from "~/engine/gameState";
import { resolveCurrentWeather } from "~/data/weather";
import { ambientVolume, masterVolume, isMuted } from "~/engine/sounds";

/**
 * Weather-driven rain ambience on the `ambient` mixer channel. Loops a rain bed
 * while the (season-derived) weather is wet, pausing otherwise. Volume tracks
 * the ambient + master sliders and the mute toggle, reactively.
 *
 * Source: "light forest rain" by tim.kahn (freesound.org), CC-BY 4.0 — see CREDITS.md.
 */
const RAIN_AMBIENT_URL = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/sfx/rain_ambient.m4a";
const CLIP_VOLUME = 0.6; // per-clip baseline, before channel × master

export default function AmbientRain() {
  const { state } = useGame();

  const weather = () => resolveCurrentWeather(state.season, state.seasonElapsed, state.year);
  const isWet = () => {
    const w = weather();
    return w === "rain" || w === "storm" || w === "unnatural_storm";
  };

  onMount(() => {
    const audio = new Audio(RAIN_AMBIENT_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;

    // Where the volume WANTS to be right now: the mixer target while wet, else 0.
    const target = () => (isMuted() ? 0 : CLIP_VOLUME * ambientVolume() * masterVolume());

    // A small rAF loop eases a 0..1 fade "level" toward its goal over a fixed
    // time, so rain fades IN when the weather turns wet and OUT (then pauses)
    // when it clears. Level is decoupled from the mixer target, so the fade
    // always takes ~FADE_SECONDS regardless of how loud the sliders are.
    const FADE_SECONDS = 6;
    let level = 0;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000 || 0);
      last = t;
      const goal = isWet() ? 1 : 0;
      const step = dt / FADE_SECONDS;
      if (level < goal) level = Math.min(goal, level + step);
      else if (level > goal) level = Math.max(goal, level - step);
      audio.volume = level * target();
      // play() may reject before the first user gesture (autoplay policy) —
      // harmless; it starts on the next tick after any click.
      if (isWet() && audio.paused) audio.play().catch(() => {});
      else if (!isWet() && level <= 0.001 && !audio.paused) audio.pause();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    onCleanup(() => { cancelAnimationFrame(raf); audio.pause(); audio.src = ""; });
  });

  return null;
}
