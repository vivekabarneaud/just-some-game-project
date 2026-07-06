import { For, Match, Switch, createMemo, createEffect } from "solid-js";
import { useGame } from "~/engine/gameState";
import { resolveCurrentWeather } from "~/data/weather";
import RainCanvas from "./RainCanvas";
import SnowCanvas from "./SnowCanvas";

/**
 * Subtle ambient weather strip that sits behind the top resource bar. Cosmetic
 * (Layer 1); weather is DERIVED from the season, so no save state. Rain is now
 * drawn by the shared <RainCanvas> (particle streaks) instead of CSS droplets;
 * snow / fog / clear stay CSS. pointer-events are disabled so it never blocks
 * the bar's controls.
 *
 * This component also stamps the resolved weather onto <html data-weather="…">,
 * which drives the weather UI mood (subtle per-weather palette shifts in
 * global.css). One source of truth for "what's the weather right now".
 */

// Deterministic per-index spread so particles keep positions across re-renders.
const spread = (i: number, salt: number) => {
  const v = Math.sin((i + 1) * (12.9898 + salt)) * 43758.5453;
  return v - Math.floor(v); // 0..1
};

type Particle = { left: number; delay: number; duration: number; scale: number };

const makeParticles = (count: number, minDur: number, maxDur: number): Particle[] =>
  Array.from({ length: count }, (_, i) => ({
    left: spread(i, 0) * 100,
    delay: spread(i, 7) * -maxDur,
    duration: minDur + spread(i, 3) * (maxDur - minDur),
    scale: 0.7 + spread(i, 11) * 0.7,
  }));

const MOTES = makeParticles(9, 6, 12);
const FOG = makeParticles(3, 14, 22);

export default function WeatherAmbience() {
  const { state } = useGame();

  const weather = createMemo(() =>
    resolveCurrentWeather(state.season, state.seasonElapsed, state.year),
  );

  // Drive the weather UI mood: <html data-weather="rain"> etc. → palette shift.
  createEffect(() => {
    document.documentElement.setAttribute("data-weather", weather());
  });

  return (
    <div class={`weather-ambience weather-${weather()}`} aria-hidden="true">
      {/* Rain / storm / unnatural-storm are drawn by the canvas (it self-detects
          intensity + tint). Storm lightning is a separate scene-wide overlay
          (<Lightning/>, mounted at app root). The Switch handles other moods. */}
      <RainCanvas variant="strip" />
      <SnowCanvas variant="strip" />
      <Switch>
        <Match when={weather() === "fog"}>
          <For each={FOG}>
            {(p) => (
              <span
                class="wx-fog"
                style={{
                  "animation-delay": `${p.delay}s`,
                  "animation-duration": `${p.duration}s`,
                  top: `${p.left % 60}%`,
                }}
              />
            )}
          </For>
        </Match>

        <Match when={weather() === "overcast"}>
          <span class="wx-overcast" />
        </Match>

        <Match when={weather() === "clear"}>
          <span class="wx-sun-glow" />
          <For each={MOTES}>
            {(p) => (
              <span
                class="wx-mote"
                style={{
                  left: `${p.left}%`,
                  "animation-delay": `${p.delay}s`,
                  "animation-duration": `${p.duration}s`,
                  width: `${p.scale * 4}px`,
                  height: `${p.scale * 4}px`,
                }}
              />
            )}
          </For>
        </Match>
      </Switch>
    </div>
  );
}
