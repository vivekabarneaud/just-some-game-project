import { For, Match, Switch, createMemo } from "solid-js";
import { useGame } from "~/engine/gameState";
import { HOURS_PER_SEASON, IS_DEV, getGlobalSeason } from "~/data/seasons";
import { resolveWeather } from "~/data/weather";

/**
 * Subtle ambient weather strip that sits behind the top resource bar.
 * Purely cosmetic (Layer 1). The weather it draws is DERIVED from the season,
 * so it needs no save state. `storm` / `unnatural_storm` render cases are wired
 * up ready for the future event layers, even though ambient drift never picks
 * them. pointer-events are disabled so it never blocks the bar's controls.
 */

// Deterministic per-index spread so particles keep their positions across
// reactive re-renders (no Math.random reshuffles, no SSR concerns).
const spread = (i: number, salt: number) => {
  const v = Math.sin((i + 1) * (12.9898 + salt)) * 43758.5453;
  return v - Math.floor(v); // 0..1
};

type Particle = { left: number; delay: number; duration: number; scale: number };

const makeParticles = (count: number, minDur: number, maxDur: number): Particle[] =>
  Array.from({ length: count }, (_, i) => ({
    left: spread(i, 0) * 100,
    delay: spread(i, 7) * -maxDur, // negative => already mid-flight on mount
    duration: minDur + spread(i, 3) * (maxDur - minDur),
    scale: 0.7 + spread(i, 11) * 0.7,
  }));

const RAIN = makeParticles(16, 0.7, 1.4);
const HEAVY_RAIN = makeParticles(26, 0.4, 0.9);
const SNOW = makeParticles(14, 6, 11);
const MOTES = makeParticles(9, 6, 12);
const FOG = makeParticles(3, 14, 22);

function RainLayer(props: { particles: Particle[]; heavy?: boolean }) {
  return (
    <For each={props.particles}>
      {(p) => (
        <span
          class={props.heavy ? "wx-rain wx-rain-heavy" : "wx-rain"}
          style={{
            left: `${p.left}%`,
            "animation-delay": `${p.delay}s`,
            "animation-duration": `${p.duration}s`,
          }}
        />
      )}
    </For>
  );
}

export default function WeatherAmbience() {
  const { state } = useGame();

  const weather = createMemo(() => {
    const info = IS_DEV
      ? { season: state.season, progress: state.seasonElapsed / HOURS_PER_SEASON, year: state.year }
      : getGlobalSeason();
    return resolveWeather(info.season, info.progress, info.year);
  });

  return (
    <div class={`weather-ambience weather-${weather()}`} aria-hidden="true">
      <Switch>
        <Match when={weather() === "rain"}>
          <RainLayer particles={RAIN} />
        </Match>

        <Match when={weather() === "snow"}>
          <For each={SNOW}>
            {(p) => (
              <span
                class="wx-snow"
                style={{
                  left: `${p.left}%`,
                  "animation-delay": `${p.delay}s`,
                  "animation-duration": `${p.duration}s`,
                  width: `${2 + p.scale * 3}px`,
                  height: `${2 + p.scale * 3}px`,
                }}
              />
            )}
          </For>
        </Match>

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

        {/* Future event layers — ready, but ambient drift never selects these. */}
        <Match when={weather() === "storm"}>
          <RainLayer particles={HEAVY_RAIN} heavy />
          <span class="wx-flash" />
        </Match>

        <Match when={weather() === "unnatural_storm"}>
          <RainLayer particles={HEAVY_RAIN} heavy />
          <span class="wx-flash wx-flash-aether" />
        </Match>
      </Switch>
    </div>
  );
}
