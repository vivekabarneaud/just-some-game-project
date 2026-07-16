import { createSignal, onCleanup, onMount } from "solid-js";
import { useGame } from "~/engine/gameState";
import { resolveCurrentWeather } from "~/data/weather";
import { ambientVolume, masterVolume, isMuted } from "~/engine/sounds";

/**
 * Lightning for storms. An edge-only glow (the inverse of the vignette:
 * transparent in the centre, tinted at the frame) whose opacity is pulsed by JS
 * at irregular intervals, so the periphery briefly lights up like a strike seen
 * through the window — without washing out the content in the middle. Most
 * strikes are dim distant flickers; occasionally a brighter close one
 * double-flashes. Cold blue-white for a natural storm, violet for the aether one.
 */
const STORM_TINT = "212, 226, 255"; // cold blue-white
const AETHER_TINT = "172, 120, 240"; // eerie violet
const MIN_GAP_MS = 7000;
const EXTRA_GAP_MS = 16000; // a strike every ~7..23s
const CLOSE_CHANCE = 0.3; // fraction of strikes that are bright + close

// Thunder follows the flash by a light-then-sound gap (close = ~1s + loud roll,
// distant = later + quiet, and not every distant flicker gets audible thunder).
// On the `ambient` mixer channel. CC0 (bajko / netaj) — see CREDITS.md.
const R2_SFX = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/sfx";
const THUNDER_NEAR_URL = `${R2_SFX}/thunder_near.m4a`; // big roll — close strikes
const THUNDER_FAR_URL = `${R2_SFX}/thunder_far.m4a`; // smaller clap — distant
const FAR_THUNDER_CHANCE = 0.7; // distant strikes that are close enough to hear

export default function Lightning() {
  const { state } = useGame();
  const [flash, setFlash] = createSignal(0);

  const weather = () => resolveCurrentWeather(state.season, state.seasonElapsed, state.year);
  const stormKind = (): "storm" | "aether" | null => {
    const w = weather();
    if (w === "storm") return "storm";
    if (w === "unnatural_storm") return "aether";
    return null;
  };

  onMount(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let timer = 0;
    let pulses: number[] = [];
    const clearPulses = () => {
      pulses.forEach((id) => window.clearTimeout(id));
      pulses = [];
    };

    const playThunder = (close: boolean) => {
      if (isMuted() || ambientVolume() <= 0 || masterVolume() <= 0) return;
      const a = new Audio(close ? THUNDER_NEAR_URL : THUNDER_FAR_URL);
      const base = close ? 0.6 + Math.random() * 0.25 : 0.18 + Math.random() * 0.14;
      a.volume = Math.min(1, base * ambientVolume() * masterVolume());
      a.play().catch(() => {});
    };

    const strike = () => {
      // Close strikes are rarer, brighter, and double-flash; distant ones are a
      // single dim flicker. Peaks stay subtle so it lights the scene, not blinds.
      const close = Math.random() < CLOSE_CHANCE;
      const peak = close ? 0.26 + Math.random() * 0.18 : 0.09 + Math.random() * 0.09;
      // A close strike double-flashes (peak, dip, secondary, out); a distant one
      // is a single quick flicker.
      const seq: Array<[number, number]> = close
        ? [[0, peak], [70, peak * 0.2], [120, peak * 0.85], [280, 0]]
        : [[0, peak], [90, 0]];
      clearPulses();
      for (const [t, v] of seq) {
        pulses.push(window.setTimeout(() => setFlash(v), t));
      }
      // Thunder trails the flash: close ~0.9-1.5s, distant ~2.5-4.5s (and only
      // some distant strikes are near enough to hear). Fires before the next
      // strike (min gap 7s), so it never overlaps the following clearPulses.
      if (close || Math.random() < FAR_THUNDER_CHANCE) {
        const delay = close ? 900 + Math.random() * 600 : 2500 + Math.random() * 2000;
        pulses.push(window.setTimeout(() => playThunder(close), delay));
      }
    };

    const schedule = () => {
      const gap = MIN_GAP_MS + Math.random() * EXTRA_GAP_MS;
      timer = window.setTimeout(() => {
        if (!reduce && stormKind()) strike();
        schedule();
      }, gap);
    };
    schedule();

    onCleanup(() => {
      window.clearTimeout(timer);
      clearPulses();
    });
  });

  return (
    <div
      aria-hidden="true"
      class="storm-lightning"
      style={{
        opacity: `${flash()}`,
        background: `radial-gradient(ellipse at center, transparent 82%, rgb(${stormKind() === "aether" ? AETHER_TINT : STORM_TINT}) 100%)`,
      }}
    />
  );
}
