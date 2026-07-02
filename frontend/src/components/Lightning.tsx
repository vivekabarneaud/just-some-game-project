import { createSignal, onCleanup, onMount } from "solid-js";
import { useGame } from "~/engine/gameState";
import { HOURS_PER_SEASON, IS_DEV, getGlobalSeason } from "~/data/seasons";
import { resolveWeather } from "~/data/weather";

/**
 * Scene-wide lightning for storms. A full-screen, screen-blended overlay whose
 * opacity is pulsed by JS at irregular intervals, so the whole UI briefly lights
 * up like a real strike — replacing the old fixed 6s CSS loop. Most strikes are
 * dim distant flickers; occasionally a brighter close one double-flashes. Tinted
 * cold blue-white for a natural storm, violet for the unnatural (aether) storm.
 */
const STORM_TINT = "212, 226, 255"; // cold blue-white
const AETHER_TINT = "172, 120, 240"; // eerie violet
const MIN_GAP_MS = 7000;
const EXTRA_GAP_MS = 16000; // a strike every ~7..23s
const CLOSE_CHANCE = 0.3; // fraction of strikes that are bright + close

export default function Lightning() {
  const { state } = useGame();
  const [flash, setFlash] = createSignal(0);

  const weather = () => {
    const info = IS_DEV
      ? { season: state.season, progress: state.seasonElapsed / HOURS_PER_SEASON, year: state.year }
      : getGlobalSeason();
    return resolveWeather(info.season, info.progress, info.year);
  };
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

    const strike = () => {
      // Close strikes are rarer, brighter, and double-flash; distant ones are a
      // single dim flicker. Peaks stay subtle so it lights the scene, not blinds.
      const close = Math.random() < CLOSE_CHANCE;
      const peak = close ? 0.35 + Math.random() * 0.25 : 0.12 + Math.random() * 0.13;
      const seq: Array<[number, number]> = close
        ? [[0, peak], [70, peak * 0.2], [120, peak * 0.85], [280, 0]]
        : [[0, peak], [90, 0]];
      clearPulses();
      for (const [t, v] of seq) {
        pulses.push(window.setTimeout(() => setFlash(v), t));
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
      style={{
        position: "fixed",
        inset: "0",
        "pointer-events": "none",
        "z-index": "400", // above content, below modals (1100)
        opacity: `${flash()}`,
        background: `rgb(${stormKind() === "aether" ? AETHER_TINT : STORM_TINT})`,
        "mix-blend-mode": "screen",
        transition: "opacity 90ms ease-out",
      }}
    />
  );
}
