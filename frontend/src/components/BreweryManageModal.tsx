import { createSignal, createEffect, onCleanup, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useGame } from "~/engine/gameState";
import { TAVERN_COMMODITY_DRINKS } from "~/data/tavern";

interface Props {
  onClose: () => void;
}

/**
 * Brewery management: a pause toggle per brewed drink. Paused drinks stop
 * converting grain, so the player can keep the barrel from draining the larder.
 * One row per commodity drink sourced from the brewery (ale now; beer/wine/mead
 * slot in as they're added to TAVERN_COMMODITY_DRINKS). Same shell as the
 * garrison manager: closed by the X, clicking outside, or Escape.
 */
export default function BreweryManageModal(props: Props) {
  const { state, actions } = useGame();
  const [exiting, setExiting] = createSignal(false);

  const close = () => {
    setExiting(true);
    setTimeout(() => props.onClose(), 200);
  };

  createEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  const breweryDrinks = () => TAVERN_COMMODITY_DRINKS.filter((d) => d.requiresBuilding === "brewery");
  // Only ale has a dedicated store today; read it directly. Other drinks read 0
  // until their own stores land, which is fine — the toggle still works.
  const stockOf = (resource: string) => (resource === "ale" ? state.ale : 0);
  const onMenu = (id: string) => (state.tavernMenu ?? []).includes(id);

  return (
    <Portal>
      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.78)", "z-index": 1100,
          display: "flex", "align-items": "center", "justify-content": "center", padding: "24px",
          opacity: exiting() ? 0 : 1, transition: "opacity 0.2s ease",
        }}
        onClick={close}
      >
        <div
          style={{
            "max-width": "420px", width: "100%", background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)", "border-radius": "8px", padding: "20px",
            color: "var(--text-primary)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "6px" }}>
            <h3 style={{ margin: 0, "font-family": "var(--font-heading)", color: "var(--accent-gold)" }}>🍺 Brewery</h3>
            <button onClick={close} style={{ background: "none", border: "none", color: "var(--text-muted)", "font-size": "1.2rem", cursor: "pointer", "line-height": 1 }}>✕</button>
          </div>
          <p style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-bottom": "16px" }}>
            Pause a drink to stop it drawing grain. The tavern only pours a drink when it's on the menu, so an unfeatured barrel fills once and then rests.
          </p>

          <div style={{ display: "flex", "flex-direction": "column", gap: "10px" }}>
            <For each={breweryDrinks()}>
              {(d) => {
                const paused = () => actions.isBrewingPaused(d.id);
                return (
                  <div style={{
                    display: "flex", "align-items": "center", gap: "10px", padding: "10px 12px",
                    background: "var(--bg-card)", border: "1px solid var(--border-color)", "border-radius": "8px",
                  }}>
                    <span style={{ "font-size": "1.4rem" }}>{d.icon}</span>
                    <div style={{ flex: "1", "min-width": "0" }}>
                      <div style={{ "font-size": "0.9rem" }}>{d.name}</div>
                      <div style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>
                        In the barrel: {Math.floor(stockOf(d.resource))}
                        {" · "}
                        {onMenu(d.id) ? "on the tavern menu" : "not on the menu"}
                      </div>
                    </div>
                    <button
                      onClick={() => actions.toggleBrewingPaused(d.id)}
                      style={{
                        padding: "6px 12px", "font-size": "0.8rem", "font-weight": 600,
                        border: "1px solid var(--border-color)", "border-radius": "6px", cursor: "pointer",
                        background: paused() ? "var(--accent-gold)" : "transparent",
                        color: paused() ? "#1a1a1a" : "var(--text-secondary)",
                        "white-space": "nowrap",
                      }}
                    >
                      {paused() ? "▶ Resume" : "⏸ Pause"}
                    </button>
                  </div>
                );
              }}
            </For>
            <Show when={breweryDrinks().length === 0}>
              <p style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>Nothing brewing here yet.</p>
            </Show>
          </div>
        </div>
      </div>
    </Portal>
  );
}
