import { Show, createSignal, createEffect, onCleanup, untrack } from "solid-js";
import { playSound, type SoundId } from "~/engine/sounds";

/**
 * Announcement banner — a marquee that slides down from the topbar and scrolls
 * its message right-to-left. One event at a time, queued; each banner lives
 * until the marquee scroll animation completes, then plays its exit animation
 * and unmounts. Click-through actions supported.
 *
 * Use for broadcast-style notifications: quest completions, season changes,
 * incoming raids, returning adventurers, co-op/expedition results, etc.
 * In-band feedback (button click confirmations, etc.) should use the toast
 * system instead — banners are "the town crier", not a receipt.
 */

type EventType = "quest" | "season" | "raid" | "mission" | "coop" | "info";

export interface EventBannerItem {
  id: number;
  type: EventType;
  message: string;
  icon?: string;
  /** Called when the banner is clicked. Auto-dismisses after. */
  onClick?: () => void;
  /** Optional color override — lets callers pick e.g. a season-specific accent. */
  accent?: string;
  /** Optional stinger override. Defaults to raid_stinger for raids, notify_soft
   *  for everything else. Set for special beats (e.g. winter_is_coming). */
  sound?: SoundId;
  /** Scroll SPEED = the duration of the single scroll pass (ms). Every message
   *  scrolls once, sliding in from the right and out the left. Bigger = slower.
   *  Omit for DEFAULT_SCROLL_MS. */
  scrollMs?: number;
  /** How long the banner STAYS on screen (ms), independent of scroll speed.
   *  DEFAULTS to `scrollMs`, so the banner dismisses exactly as the pass finishes
   *  (no empty gap). Set LARGER to hold after the text scrolls off, SMALLER to
   *  cut the pass short. */
  durationMs?: number;
}

/** Default accents per event type. Callers can override via `accent`. */
const DEFAULT_ACCENTS: Record<EventType, string> = {
  quest: "var(--accent-gold)",
  season: "var(--accent-green)",
  raid: "var(--accent-red)",
  mission: "var(--accent-blue)",
  coop: "#a78bfa",
  info: "var(--text-secondary)",
};

const [queue, setQueue] = createSignal<EventBannerItem[]>([]);
let nextId = 1;

/** Enqueue a banner event. Returns its id in case the caller wants to dismiss early. */
export function showEvent(item: Omit<EventBannerItem, "id">): number {
  const id = nextId++;
  setQueue((prev) => [...prev, { ...item, id }]);
  return id;
}

export function dismissEvent(id: number): void {
  setQueue((prev) => prev.filter((e) => e.id !== id));
}

/** Duration of the slide-up-and-fade exit animation. Kept in JS so the dismiss
 *  timer can schedule the "exiting" flag just before the queue pop. Keep in
 *  sync with the CSS keyframe duration on `.event-banner.exiting`. */
const EXIT_ANIMATION_MS = 500;

/** Default scroll-pass duration (ms) = the scroll SPEED. Every banner scrolls
 *  once at this pace unless a per-banner `scrollMs` overrides it. On-screen time
 *  (`durationMs`) defaults to this, so by default there's no gap after the pass. */
const DEFAULT_SCROLL_MS = 7000;

/** Whether the viewer prefers reduced motion. When true the marquee does a
 *  single slow pass (CSS) instead of looping. */
const REDUCED_MOTION =
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Mount once near the topbar. Renders the currently-active banner if any. */
export default function EventBanner() {
  const current = () => queue()[0];
  // Tracks whether the current banner is in its exit animation. Set when the
  // marquee scroll finishes (animationend), so the collapse plays after the
  // text has fully exited instead of overlapping the scroll tail.
  const [exiting, setExiting] = createSignal(false);

  /** Begin the exit: flip the class, schedule the queue pop for once the
   *  slide-up-and-fade animation has completed. Safe to call multiple times
   *  (subsequent calls short-circuit via the `exiting` signal). */
  const startExit = (id: number) => {
    if (untrack(exiting)) return;
    setExiting(true);
    setTimeout(() => {
      setQueue((prev) => prev.filter((e) => e.id !== id));
    }, EXIT_ANIMATION_MS);
  };

  // Reset exiting when a new banner becomes current; arm a safety fallback in
  // case the marquee animationend somehow doesn't fire.
  createEffect(() => {
    const c = current();
    if (!c) return;
    untrack(() => setExiting(false));
    // Audible cue on appearance. An explicit `sound` wins; otherwise raids get
    // the dramatic stinger and everything else the soft neutral chime.
    playSound(c.sound ?? (c.type === "raid" ? "raid_stinger" : "notify_soft"));
    // On-screen time, defaulting to the scroll-pass duration so the banner leaves
    // exactly as the single pass finishes (no gap). A larger durationMs holds it
    // after the text scrolls off; a smaller one cuts the pass short.
    const showMs = c.durationMs ?? c.scrollMs ?? DEFAULT_SCROLL_MS;
    const timer = setTimeout(() => startExit(c.id), showMs);
    onCleanup(() => clearTimeout(timer));
  });

  // Keyed Show: when the queue advances, the DOM is rebuilt rather than
  // re-used. Without this, the CSS marquee/entry animations wouldn't
  // restart for the next banner — they'd still be in the final frame of
  // the previous one.
  return (
    <Show when={current()} keyed>
      {(item) => {
        const accent = () => item.accent ?? DEFAULT_ACCENTS[item.type];
        // Every message scrolls once at this pace, sliding in from the right.
        const scrollMs = item.scrollMs ?? DEFAULT_SCROLL_MS;
        return (
          <div
            class="event-banner"
            classList={{ exiting: exiting() }}
            onClick={() => {
              const cb = item.onClick;
              if (cb) {
                cb();
                dismissEvent(item.id);
              }
            }}
            style={{
              position: "absolute",
              // Descend from the top bar's VISUAL bottom. top:100% only reaches
              // the padding box, which stops --chrome-rule-w short (the ornament
              // rule is a transparent border), so add it back.
              top: "calc(100% + var(--chrome-rule-w))",
              left: 0,
              right: 0,
              height: "48px",
              background: `linear-gradient(90deg, color-mix(in srgb, ${accent()} 20%, var(--bg-secondary)) 0%, color-mix(in srgb, ${accent()} 35%, var(--bg-secondary)) 50%, color-mix(in srgb, ${accent()} 20%, var(--bg-secondary)) 100%)`,
              "border-bottom": `2px solid ${accent()}`,
              overflow: "hidden",
              "z-index": 9,
              cursor: item.onClick ? "pointer" : "default",
              // prevent content from briefly shifting when banner appears
              "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* The CSS mask fades both edges as text passes. If the message FITS
                it holds static + centered; if it OVERFLOWS it becomes a seamless
                loop (message rendered twice, the track scrolls exactly one copy). */}
            <div
              class="event-banner-mask"
              style={{
                height: "100%",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                "align-items": "center",
                "justify-content": REDUCED_MOTION ? "center" : "flex-start",
                // Real empty space on the right so text enters/exits inset from
                // the screen edge (the fade alone doesn't hold it back). Tune %.
                "margin-right": "8%",
              }}
            >
              {/* One pass, no loop, no differentiation by length. A full-width
                  lead-in (padding-left) slides the text in from an empty right;
                  it crosses once (0 to -100%), exits left, and holds off (forwards)
                  until the banner dismisses. Reduced motion shows it static. */}
              <div
                class="event-banner-marquee"
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "10px",
                  height: "100%",
                  "font-family": "var(--font-heading)",
                  "font-size": "1.15rem",
                  color: accent(),
                  "text-shadow": "0 1px 2px rgba(0, 0, 0, 0.5)",
                  "white-space": "nowrap",
                  "letter-spacing": "0.5px",
                  "max-width": REDUCED_MOTION ? "100%" : "none",
                  "padding-left": REDUCED_MOTION ? "0" : "100%",
                  "padding-right": REDUCED_MOTION ? "0" : "60px",
                  animation: REDUCED_MOTION ? "none" : `event-banner-scroll ${scrollMs}ms linear 1 forwards`,
                }}
              >
                <Show when={item.icon}>
                  <span style={{ "font-size": "1.35rem" }}>{item.icon}</span>
                </Show>
                <span>{item.message}</span>
              </div>
            </div>
          </div>
        );
      }}
    </Show>
  );
}
