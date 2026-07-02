import { onCleanup, onMount, createEffect, createMemo } from "solid-js";
import { useGame } from "~/engine/gameState";
import { HOURS_PER_SEASON, IS_DEV, getGlobalSeason } from "~/data/seasons";
import { resolveWeather } from "~/data/weather";

/**
 * Rain drawn on a <canvas> — a particle system with parallax depth, a wind
 * slant, and streak-blur, which reads far better than animated DOM droplets.
 * Reusable at any size: it sizes to its OWN element, so the same component is
 * the thin top-bar strip (`variant="strip"`) and, later, a full-screen backdrop
 * (`variant="screen"`). Purely cosmetic, pointer-events:none, self-activating on
 * wet weather, paused on a hidden tab, and disabled under reduced-motion.
 */

type Layer = {
  count: number;
  speed: [number, number];  // px/sec
  length: [number, number]; // px streak
  width: number;
  alpha: number;
};

// Full-screen: fast, deep, three parallax layers.
const LAYERS_SCREEN: Layer[] = [
  { count: 45, speed: [700, 900],   length: [7, 12],  width: 0.8, alpha: 0.16 },
  { count: 30, speed: [1050, 1350], length: [12, 20], width: 1.1, alpha: 0.24 },
  { count: 18, speed: [1500, 1900], length: [20, 32], width: 1.5, alpha: 0.34 },
];
// Thin top-bar strip: gentler + shorter streaks, a touch more opaque so the
// small area still reads. Tuned to feel like the old droplet strip, but nicer.
const LAYERS_STRIP: Layer[] = [
  { count: 14, speed: [90, 140],  length: [4, 7],   width: 0.8, alpha: 0.25 },
  { count: 10, speed: [150, 210], length: [6, 10],  width: 1.0, alpha: 0.35 },
  { count: 7,  speed: [220, 300], length: [9, 14],  width: 1.2, alpha: 0.45 },
];

const WIND = 0.20;            // horizontal drift as a fraction of fall speed (the slant)
const STORM_DENSITY = 1.9;    // extra drops in a storm
const STORM_SPEED = 1.7;      // noticeably faster, driving fall in a storm
const RAIN_RGB = "200, 218, 255";       // cool desaturated blue
const AETHER_RGB = "196, 170, 255";     // eerie violet for the unnatural storm
const MAX_DT = 0.05;          // clamp frame delta so a paused tab doesn't teleport drops

type Drop = { x: number; y: number; speed: number; len: number; width: number; alpha: number };
type Intensity = { active: false } | { active: true; heavy: boolean; rgb: string };

function intensityFor(weather: string): Intensity {
  if (weather === "rain") return { active: true, heavy: false, rgb: RAIN_RGB };
  if (weather === "storm") return { active: true, heavy: true, rgb: RAIN_RGB };
  if (weather === "unnatural_storm") return { active: true, heavy: true, rgb: AETHER_RGB };
  return { active: false };
}

export default function RainCanvas(props: { variant?: "screen" | "strip" }) {
  const { state } = useGame();
  const layers = () => (props.variant === "strip" ? LAYERS_STRIP : LAYERS_SCREEN);
  let canvas!: HTMLCanvasElement;

  const weather = () => {
    const info = IS_DEV
      ? { season: state.season, progress: state.seasonElapsed / HOURS_PER_SEASON, year: state.year }
      : getGlobalSeason();
    return resolveWeather(info.season, info.progress, info.year);
  };
  // Memoized weather TYPE so the render effect only re-runs on an actual weather
  // change, not every tick (weather() reads seasonElapsed) — otherwise the drop
  // set re-seeds ~1×/sec.
  const wx = createMemo(weather);

  onMount(() => {
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    let W = 0, H = 0, dpr = 1;
    let drops: Drop[] = [];
    let rafId = 0;
    let running = false;
    let last = 0;
    let rgb = RAIN_RGB;
    let heavy = false;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR — crisp enough, cheaper
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS px
    };

    // (Re)build the drop set for the current intensity. Heavy weather adds density.
    const build = () => {
      const mult = heavy ? STORM_DENSITY : 1;
      const spd = heavy ? STORM_SPEED : 1;
      drops = [];
      for (const L of layers()) {
        const n = Math.round(L.count * mult);
        for (let i = 0; i < n; i++) {
          drops.push({
            x: Math.random() * W,
            y: Math.random() * H,
            speed: rand(L.speed[0], L.speed[1]) * spd,
            len: rand(L.length[0], L.length[1]),
            width: L.width,
            alpha: L.alpha,
          });
        }
      }
    };

    // Streak direction follows velocity (down + wind), normalized to drop length.
    const norm = Math.hypot(WIND, 1);
    const ux = WIND / norm, uy = 1 / norm;

    const frame = (t: number) => {
      if (!running) return;
      const dt = Math.min(MAX_DT, (t - last) / 1000 || 0);
      last = t;
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      for (const d of drops) {
        d.y += d.speed * dt;
        d.x += d.speed * WIND * dt;
        if (d.y - d.len > H) { d.y = -d.len; d.x = Math.random() * (W + 200) - 100; }
        else if (d.x > W + 20) d.x = -20;
        ctx.strokeStyle = `rgba(${rgb}, ${d.alpha})`;
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - ux * d.len, d.y - uy * d.len);
        ctx.stroke();
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
      else if (intensityFor(wx()).active && !reduce?.matches) { running = true; loop(); }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // React to weather: (re)build for the right intensity/tint, or stop.
    createEffect(() => {
      const it = intensityFor(wx());
      if (!it.active || reduce?.matches) { stop(); return; }
      rgb = it.rgb;
      heavy = it.heavy;
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