import { createSignal, For, Show, onCleanup } from "solid-js";

/**
 * Generic toast — non-blocking notification that auto-dismisses.
 *
 * Usage:
 *   showToast({ title: "Quest complete", body: "First Things First", icon: "🎯",
 *               actionLabel: "Claim", onAction: () => ... });
 *
 * Each toast gets a timer bar at the top that shrinks visually over `duration` ms,
 * then the toast fades out. Click the × to dismiss early.
 */

export interface Toast {
  id: number;
  title: string;
  body?: string;
  icon?: string;
  duration?: number; // ms, default 10000
  actionLabel?: string;
  onAction?: () => void;
  /** Color accent for the toast border/bar. Defaults to accent-gold. */
  accent?: string;
}

const [toasts, setToasts] = createSignal<Toast[]>([]);
let nextId = 1;

/** Push a toast onto the stack. Returns its id so callers can dismiss it early. */
export function showToast(t: Omit<Toast, "id">): number {
  const id = nextId++;
  const toast: Toast = { duration: 10000, accent: "var(--accent-gold)", ...t, id };
  setToasts((prev) => [...prev, toast]);
  return id;
}

export function dismissToast(id: number): void {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

/** Toast container — mount once at app root. Renders active toasts. */
export default function ToastContainer() {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        "z-index": 2000,
        display: "flex",
        "flex-direction": "column",
        gap: "10px",
        "pointer-events": "none", // container doesn't intercept; children do
        "max-width": "90vw",
      }}
    >
      <For each={toasts()}>
        {(toast) => <ToastCard toast={toast} />}
      </For>
    </div>
  );
}

function ToastCard(props: { toast: Toast }) {
  const duration = props.toast.duration ?? 10000;

  const timer = setTimeout(() => dismissToast(props.toast.id), duration);
  onCleanup(() => clearTimeout(timer));

  return (
    <div
      class="quest-toast"
      style={{
        "pointer-events": "auto",
        background: "var(--bg-secondary)",
        border: `2px solid ${props.toast.accent}`,
        "border-radius": "8px",
        "min-width": "320px",
        "max-width": "480px",
        "box-shadow": "0 8px 24px rgba(0, 0, 0, 0.5)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Shrinking timer bar — CSS animation over `duration` ms */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "3px",
          background: props.toast.accent,
          width: "100%",
          animation: `toast-timer-bar ${duration}ms linear forwards`,
          "transform-origin": "left center",
        }}
      />

      <div style={{ padding: "12px 16px 14px", display: "flex", "align-items": "flex-start", gap: "10px" }}>
        <Show when={props.toast.icon}>
          <span style={{ "font-size": "1.4rem", "line-height": "1" }}>{props.toast.icon}</span>
        </Show>
        <div style={{ flex: 1 }}>
          <div style={{
            "font-family": "var(--font-heading)",
            "font-size": "0.95rem",
            color: "var(--text-primary)",
            "font-weight": "bold",
          }}>
            {props.toast.title}
          </div>
          <Show when={props.toast.body}>
            <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-top": "2px" }}>
              {props.toast.body}
            </div>
          </Show>
        </div>
        <div style={{ display: "flex", gap: "6px", "align-items": "center" }}>
          <Show when={props.toast.actionLabel && props.toast.onAction}>
            <button
              onClick={() => {
                props.toast.onAction!();
                dismissToast(props.toast.id);
              }}
              class="upgrade-btn"
              style={{ padding: "4px 12px", "font-size": "0.8rem" }}
            >
              {props.toast.actionLabel}
            </button>
          </Show>
          <button
            onClick={() => dismissToast(props.toast.id)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              "font-size": "1rem",
              padding: "2px 6px",
              "line-height": "1",
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
