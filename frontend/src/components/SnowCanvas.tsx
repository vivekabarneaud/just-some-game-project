import { onCleanup, onMount, createEffect, createMemo } from "solid-js";
import { useGame } from "~/engine/gameState";
import { HOURS_PER_SEASON, IS_DEV, getGlobalSeason } from "~/data/seasons";
import { resolveWeather } from "~/data/weather";

/**
 * Snow drawn on a <canvas> — soft round flakes that fall slowly and sway on a
 * sine drift, with parallax depth (the rain's calm sibling). Sizes to its own
 * element (same as RainCanvas), self-activates on snow weather, pauses on a
 * hidden tab, and disables under reduced-motion. Purely cosmetic.
 */

type Layer = {
  count: number;
  speed: [number, number]; // px/sec fall
  radius: [number, number]; // px flake radius
  sway: [number, number]; // px horizontal sway amplitude
  alpha: number;
};

// Full-screen (reserved): more, deeper flakes.
const LAYERS_SCREEN: Layer[] = [
  { count: 40, speed: [18, 30], radius: [1.0, 1.8], sway: [10, 22], alpha: 0.35 },
  { count: 26, speed: [30, 46], radius: [1.6, 2.6], sway: [16, 30], alpha: 0.55 },
  { count: 16, speed: [46, 66], radius: [2.4, 3.6], sway: [22, 40], alpha: 0.8 },
];
// Thin top-bar strip: gentler, fewer, a touch more opaque so the small area reads.
const LAYERS_STRIP: Layer[] = [
  { count: 10, speed: [12, 20], radius: [1.0, 1.7], sway: [7, 14], alpha: 0.5 },
  { count: 8, speed: [20, 32], radius: [1.5, 2.4], sway: [11, 20], alpha: 0.7 },
  { count: 5, speed: [32, 46], radius: [2.2, 3.2], sway: [15, 26], alpha: 0.9 },
];

const FLAKE_RGB = "236, 244, 255"; // soft cold white
const MAX_DT = 0.05; // clamp frame delta so a paused tab doesn't teleport flakes

type Flake = {
  x: number;
  y: number;
  r: number;
  speed: number;
  swayAmp: number;
  swayPhase: number;
  swaySpeed: number;
  alpha: number;
};

export default function SnowCanvas(props: { variant?: "screen" | "strip" }) {
  const { state } = useGame();
  const layers = () => (props.variant === "strip" ? LAYERS_STRIP : LAYERS_SCREEN);
  let canvas!: HTMLCanvasElement;

  const weather = () => {
    const info = IS_DEV
      ? { season: state.season, progress: state.seasonElapsed / HOURS_PER_SEASON, year: state.year }
      : getGlobalSeason();
    return resolveWeather(info.season, info.progress, info.year);
  };
  // Memoized so the render effect only re-runs when the weather TYPE flips to/from
  // snow — not on every game tick (weather() reads seasonElapsed, which changes
  // constantly and would otherwise re-seed all flakes ~1×/sec, causing a "jump").
  const snowing = createMemo(() => weather() === "snow");

  onMount(() => {
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    let W = 0, H = 0, dpr = 1;
    let flakes: Flake[] = [];
    let rafId = 0;
    let running = false;
    let last = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const build = () => {
      flakes = [];
      for (const L of layers()) {
        for (let i = 0; i < L.count; i++) {
          flakes.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: rand(L.radius[0], L.radius[1]),
            speed: rand(L.speed[0], L.speed[1]),
            swayAmp: rand(L.sway[0], L.sway[1]),
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: rand(0.6, 1.4),
            alpha: L.alpha,
          });
        }
      }
    };

    const frame = (t: number) => {
      if (!running) return;
      const dt = Math.min(MAX_DT, (t - last) / 1000 || 0);
      last = t;
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        f.y += f.speed * dt;
        f.swayPhase += f.swaySpeed * dt;
        const x = f.x + Math.sin(f.swayPhase) * f.swayAmp;
        if (f.y - f.r > H) {
          f.y = -f.r;
          f.x = Math.random() * W;
        }
        ctx.fillStyle = `rgba(${FLAKE_RGB}, ${f.alpha})`;
        ctx.beginPath();
        ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = requestAnimationFrame(frame);
    };

    const loop = () => { last = performance.now(); rafId = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(rafId); ctx.clearRect(0, 0, W, H); };

    resize();
    const ro = new ResizeObserver(() => { resize(); if (running) build(); });
    ro.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(rafId); }
      else if (snowing() && !reduce?.matches) { running = true; loop(); }
    };
    document.addEventListener("visibilitychange", onVisibility);

    createEffect(() => {
      if (!snowing() || reduce?.matches) { stop(); return; }
      build();
      if (!running) { running = true; loop(); }
    });

    onCleanup(() => {
      stop();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    });
  });

  return (
    <canvas
      ref={canvas}
      class={props.variant === "strip" ? "rain-canvas rain-canvas--strip" : "rain-canvas rain-canvas--screen"}
      aria-hidden="true"
    />
  );
}
