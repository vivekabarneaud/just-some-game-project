import { Show, createSignal, createEffect, onCleanup, untrack } from "solid-js";

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

export type EventType = "quest" | "season" | "raid" | "mission" | "coop" | "info";

export interface EventBannerItem {
  id: number;
  type: EventType;
  message: string;
  icon?: string;
  /** Called when the banner is clicked. Auto-dismisses after. */
  onClick?: () => void;
  /** Optional color override — lets callers pick e.g. a season-specific accent. */
  accent?: string;
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

/** Safety fallback — if the marquee's animationend never fires (backgrounded
 *  tab, browser quirk), force-dismiss after this long. */
const FALLBACK_MAX_MS = 20000;

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
    const fallback = setTimeout(() => startExit(c.id), FALLBACK_MAX_MS);
    onCleanup(() => clearTimeout(fallback));
  });

  return (
    <Show when={current()}>
      {(item) => {
        const accent = () => item().accent ?? DEFAULT_ACCENTS[item().type];
        return (
          <div
            class="event-banner"
            classList={{ exiting: exiting() }}
            onClick={() => {
              const cb = item().onClick;
              if (cb) {
                cb();
                dismissEvent(item().id);
              }
            }}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              height: "32px",
              background: `linear-gradient(90deg, color-mix(in srgb, ${accent()} 20%, var(--bg-secondary)) 0%, color-mix(in srgb, ${accent()} 35%, var(--bg-secondary)) 50%, color-mix(in srgb, ${accent()} 20%, var(--bg-secondary)) 100%)`,
              "border-bottom": `2px solid ${accent()}`,
              overflow: "hidden",
              "z-index": 9,
              cursor: item().onClick ? "pointer" : "default",
              // prevent content from briefly shifting when banner appears
              "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Asymmetric padding: margin only on the right so text appears to
                enter from mid-banner, but can scroll all the way to the
                banner's left edge before disappearing. The CSS mask softens
                both the entry (right fade-in) and exit (left fade-out). */}
            <div
              class="event-banner-mask"
              style={{
                height: "100%",
                "margin-right": "20%",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                class="event-banner-marquee"
                onAnimationEnd={(e) => {
                  // Several animations fire animationend — only the scroll one
                  // marks the banner as "done". Ignore entrance/exit frames.
                  if (e.animationName !== "event-banner-scroll") return;
                  startExit(item().id);
                }}
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "10px",
                  height: "100%",
                  "font-family": "var(--font-heading)",
                  "font-size": "0.95rem",
                  color: accent(),
                  "text-shadow": "0 1px 2px rgba(0, 0, 0, 0.5)",
                  "white-space": "nowrap",
                  "padding-left": "100%",
                  // Trailing padding extends the marquee past the wrapper's left
                  // edge as translateX(-100%) moves the element by its full
                  // rendered width — text continues sliding through the left
                  // fade zone rather than stopping inside it.
                  "padding-right": "60px",
                  "letter-spacing": "0.5px",
                }}
              >
                <Show when={item().icon}>
                  <span style={{ "font-size": "1.1rem" }}>{item().icon}</span>
                </Show>
                <span>{item().message}</span>
              </div>
            </div>
          </div>
        );
      }}
    </Show>
  );
}
