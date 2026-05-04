import { Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { getEvent } from "~/data/events";

/** Modal that shows the next pending narrative event banner.
 *  Auto-renders when state.pendingEvents has items; player dismisses to advance. */
export default function EventModal() {
  const { state, actions } = useGame();

  const currentEventId = () => state.pendingEvents?.[0] ?? null;
  const currentEvent = () => {
    const id = currentEventId();
    return id ? getEvent(id) : null;
  };

  return (
    <Show when={currentEvent()}>
      {(eventGetter) => {
        const event = eventGetter();
        return (
          <div
            style={{
              "position": "fixed",
              "inset": 0,
              "background": "rgba(0,0,0,0.6)",
              "display": "flex",
              "align-items": "center",
              "justify-content": "center",
              "z-index": 1000,
              "padding": "20px",
            }}
            onClick={(e) => {
              // Click outside the panel dismisses too.
              if (e.target === e.currentTarget) {
                actions.dismissEvent(event.id);
              }
            }}
          >
            <div
              style={{
                "background": "var(--bg-secondary)",
                "border": "1px solid var(--accent-gold)",
                "border-radius": "10px",
                "max-width": "560px",
                "padding": "28px 32px",
                "box-shadow": "0 8px 32px rgba(0,0,0,0.5)",
                "font-family": "var(--font-body)",
              }}
            >
              <div
                style={{
                  "font-family": "var(--font-heading)",
                  "color": "var(--accent-gold)",
                  "font-size": "0.85rem",
                  "letter-spacing": "0.08em",
                  "text-transform": "uppercase",
                  "margin-bottom": "12px",
                }}
              >
                A new beat
              </div>
              <p
                style={{
                  "color": "var(--text-primary)",
                  "font-size": "1.05rem",
                  "line-height": 1.55,
                  "margin": "0 0 24px",
                }}
              >
                {event.banner}
              </p>
              <div style={{ "text-align": "right" }}>
                <button
                  onClick={() => actions.dismissEvent(event.id)}
                  style={{
                    "padding": "10px 24px",
                    "background": "var(--accent-gold)",
                    "color": "#000",
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
