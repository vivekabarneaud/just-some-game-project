import { Show, onMount } from "solid-js";
import { useGame } from "~/engine/gameState";
import { getEvent } from "~/data/events";
import { playSound } from "~/engine/sounds";

/** Modal that shows the next pending narrative event banner.
 *  Auto-renders when state.pendingEvents has items; player dismisses to advance. */
export default function EventModal() {
  const { state, actions } = useGame();

  // Parchment palette — a beat is the Lord's writing, so it gets the same
  // page-from-the-book treatment as the Chronicle entries + memory check-ins.
  const INK = "#2a2012";
  const INK_STRONG = "#17100a";
  const INK_SOFT = "#6b5636";
  const parchmentSrc = "/images/parchment/parchment_square.png";

  const currentEventId = () => state.pendingEvents?.[0] ?? null;
  const currentEvent = () => {
    const id = currentEventId();
    return id ? getEvent(id) : null;
  };

  return (
    <Show when={currentEvent()} keyed>
      {(event) => {
        // `keyed` makes Solid re-run this function whenever the event
        // changes (not just when when goes truthy/falsy). Without it, a
        // chained queue of pending events would lock on the first one —
        // dismissing it removes it from `pendingEvents` but the children
        // function never re-runs to point at the next event, so clicking
        // Continue keeps trying to dismiss the already-gone first one.
        onMount(() => playSound("notify"));
        return (
          <div
            class="modal-overlay page-modal-backdrop"
            onClick={(e) => {
              // Click outside the panel dismisses too.
              if (e.target === e.currentTarget) {
                actions.dismissEvent(event.id);
              }
            }}
          >
            <div
              class="page-modal-card"
              style={{
                "background": `url(${parchmentSrc}) center / 100% 100% no-repeat`,
                "border": "none",
                "border-radius": "0",
                "max-width": "560px",
                "padding": "42px 46px",
                "box-shadow": "0 6px 20px rgba(0,0,0,0.35)",
                "font-family": "var(--font-body)",
              }}
            >
              <div
                style={{
                  "font-family": "var(--font-heading)",
                  "color": INK_SOFT,
                  "font-size": "0.85rem",
                  "letter-spacing": "0.08em",
                  "text-transform": "uppercase",
                  "margin-bottom": "12px",
                }}
              >
                A new beat
              </div>
              <div style={{
                "color": INK,
                "font-size": "0.95rem",
                "font-style": "italic",
                "line-height": 1.7,
                "margin": "0 0 24px",
              }}>
                {event.banner.split("\n\n").map((para) => (
                  <p style={{ margin: "0 0 14px" }}>{para}</p>
                ))}
              </div>
              <div style={{ "text-align": "right" }}>
                <button
                  onClick={() => actions.dismissEvent(event.id)}
                  style={{
                    "padding": "10px 24px",
                    "background": INK_STRONG,
                    "color": "#f4ecd8",
                    "border": "none",
                    "border-radius": "6px",
                    "cursor": "pointer",
                    "font-weight": "bold",
                    "font-family": "var(--font-heading)",
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        );
      }}
    </Show>
  );
}
