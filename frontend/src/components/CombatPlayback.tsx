import { createSignal, createEffect, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";
import type { CombatLogEntry, CombatantSnapshot } from "@medieval-realm/shared/data/combat";
import CombatLog from "./CombatLog";
import CombatStage from "./CombatStage";

interface CombatPlaybackProps {
  log: CombatLogEntry[];
  onClose: () => void;
  /** Fires once when the last entry has been revealed (whether by natural
   *  pacing or via Skip). Called BEFORE the modal closes — the caller can use
   *  this to advance state immediately while the modal stays open for the
   *  player to re-read. */
  onFinished?: () => void;
  /** Title shown at the top of the playback (e.g., mission name). Optional. */
  title?: string;
  /** Starting-state roster — when present, the animated combat stage renders
   *  sticky above the scrolling text log. Absent → text log only (legacy). */
  roster?: CombatantSnapshot[];
  /** Combat outcome — when set and playback is finished, a Victory/Defeat
   *  banner appears in the footer. */
  victory?: boolean;
}

/**
 * Modal overlay that plays the combat log entry-by-entry at human-reading
 * speed (~1.8s per line). Skip button reveals the full log immediately.
 *
 * Combat is deterministic and already resolved at the engine level; this is
 * pure playback theatre. The player can skip at any time without affecting
 * the outcome.
 */
export default function CombatPlayback(props: CombatPlaybackProps) {
  const [shownCount, setShownCount] = createSignal(0);
  const [exiting, setExiting] = createSignal(false);
  let scrollRef: HTMLDivElement | undefined;

  const PLAYBACK_INTERVAL_MS = 1800;

  // Reveal next entry on a tick
  createEffect(() => {
    if (exiting()) return;
    const total = props.log.length;
    const current = shownCount();
    if (current >= total) return;

    const t = setTimeout(() => {
      setShownCount((c) => Math.min(total, c + 1));
    }, current === 0 ? 200 : PLAYBACK_INTERVAL_MS);

    onCleanup(() => clearTimeout(t));
  });

  // Auto-scroll to bottom as new entries appear
  createEffect(() => {
    shownCount();
    if (scrollRef) {
      requestAnimationFrame(() => {
        if (scrollRef) scrollRef.scrollTop = scrollRef.scrollHeight;
      });
    }
  });

  // Fire onFinished exactly once when all entries have been revealed.
  let finishedFired = false;
  createEffect(() => {
    if (!finishedFired && shownCount() >= props.log.length && props.log.length > 0) {
      finishedFired = true;
      props.onFinished?.();
    }
  });

  const visibleLog = () => props.log.slice(0, shownCount());
  const finished = () => shownCount() >= props.log.length;

  const skip = () => setShownCount(props.log.length);
  const close = () => {
    setExiting(true);
    setTimeout(() => props.onClose(), 200);
  };

  return (
    <Portal>
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.78)",
        "z-index": 1100,
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        padding: "24px",
        opacity: exiting() ? 0 : 1,
        transition: "opacity 0.2s ease",
      }}
      onClick={close}
    >
      <div
        style={{
          "max-width": props.roster && props.roster.length > 0 ? "720px" : "560px",
          width: "100%",
          "max-height": "82vh",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          "border-radius": "10px",
          "box-shadow": "0 12px 40px rgba(0, 0, 0, 0.5)",
          display: "flex",
          "flex-direction": "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "14px 18px",
          "border-bottom": "1px solid var(--border-color)",
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          gap: "12px",
        }}>
          <div>
            <div style={{
              "font-family": "var(--font-heading)",
              "font-size": "1.05rem",
              color: "var(--accent-gold)",
            }}>
              ⚔️ {props.title ?? "Combat"}
            </div>
            <div style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>
              {finished()
                ? `${props.log.length} actions · complete`
                : `${shownCount()} / ${props.log.length}`}
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              "font-size": "1.4rem",
              cursor: "pointer",
              "line-height": 1,
              padding: "4px 8px",
            }}
          >
            ×
          </button>
        </div>

        {/* Animated combat stage — sticky above the scrolling log. */}
        <Show when={props.roster && props.roster.length > 0}>
          <div style={{ "border-bottom": "1px solid var(--border-color)", background: "rgba(0,0,0,0.15)" }}>
            <CombatStage roster={props.roster!} log={props.log} shownCount={shownCount()} maxHeight={300} />
          </div>
        </Show>

        {/* Log scroll area */}
        <div
          ref={scrollRef}
          style={{
            padding: "12px 16px",
            overflow: "auto",
            flex: 1,
            "min-height": "200px",
            "scroll-behavior": "smooth",
          }}
        >
          <Show when={visibleLog().length > 0} fallback={
            <div style={{ color: "var(--text-muted)", "font-style": "italic", "text-align": "center", "margin-top": "40px" }}>
              The fight is about to begin…
            </div>
          }>
            <CombatLog log={visibleLog()} />
          </Show>
        </div>

        {/* Footer controls */}
        <div style={{
          padding: "10px 14px",
          "border-top": "1px solid var(--border-color)",
          display: "flex",
          gap: "10px",
          "align-items": "center",
          "justify-content": "space-between",
          background: "rgba(0, 0, 0, 0.15)",
        }}>
          {/* Outcome banner — only when finished AND victory prop was passed */}
          <Show when={finished() && props.victory != null} fallback={<div />}>
            <span style={{
              "font-family": "var(--font-heading)",
              "font-size": "1rem",
              "font-weight": "bold",
              color: props.victory ? "var(--accent-green)" : "var(--accent-red)",
            }}>
              {props.victory ? "🛡️ Victory" : "💀 Defeated"}
            </span>
          </Show>

          <Show when={!finished()} fallback={
            <button
              onClick={close}
              class="upgrade-btn"
              style={{ padding: "6px 16px", "font-size": "0.85rem" }}
            >
              Close
            </button>
          }>
            <button
              onClick={skip}
              style={{
                padding: "6px 14px",
                background: "transparent",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                "border-radius": "4px",
                cursor: "pointer",
                "font-size": "0.82rem",
              }}
            >
              Skip
            </button>
          </Show>
        </div>
      </div>
    </div>
    </Portal>
  );
}
