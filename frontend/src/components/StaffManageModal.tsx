import { createSignal, createEffect, onCleanup, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useGame } from "~/engine/gameState";
import { availableCitizens } from "~/data/defenses";
import { BUILDINGS } from "~/data/buildings";

interface Props {
  buildingId: string;
  onClose: () => void;
}

/**
 * Per-building staff manager. Coverage model, not optimization: a staffable
 * building runs at full tilt while its named hands (a founder, an adventurer)
 * are home. When the adventurer deploys, output dips toward a floor — and the
 * player can bench a townsfolk to hold the post until they're back. Kids are
 * flavour only (no slots). Same shell as the brewery/garrison managers.
 */
export default function StaffManageModal(props: Props) {
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

  const def = () => BUILDINGS.find((b) => b.id === props.buildingId);
  const staffing = () => actions.getBuildingStaffing(props.buildingId);
  const free = () => availableCitizens(state);
  const coverage = () => Math.round(staffing().multiplier * 100);
  const understaffed = () => staffing().active < staffing().capacity;

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
            "max-width": "440px", width: "100%", background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)", "border-radius": "8px", padding: "20px",
            color: "var(--text-primary)", "max-height": "88vh", overflow: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "6px" }}>
            <h3 style={{ margin: 0, "font-family": "var(--font-heading)", color: "var(--accent-gold)" }}>
              {def()?.icon} {def()?.name} — Staff
            </h3>
            <button onClick={close} style={{ background: "none", border: "none", color: "var(--text-muted)", "font-size": "1.2rem", cursor: "pointer", "line-height": 1 }}>✕</button>
          </div>

          {/* Coverage summary */}
          <div style={{
            display: "flex", "align-items": "baseline", gap: "12px", "flex-wrap": "wrap",
            padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border-color)",
            "border-radius": "8px", "margin-bottom": "14px",
          }}>
            <span style={{ "font-size": "1.05rem", "font-weight": 600 }}>
              {staffing().active} / {staffing().capacity} <span style={{ "font-size": "0.8rem", color: "var(--text-muted)", "font-weight": 400 }}>staffed</span>
            </span>
            <span style={{ "font-size": "0.9rem", color: understaffed() ? "var(--accent-red)" : "var(--accent-green, #4a9)" }}>
              {coverage()}% output
            </span>
          </div>

          {/* Named staff */}
          <For each={staffing().named}>
            {(m) => (
              <div style={{
                display: "flex", "align-items": "center", gap: "10px", padding: "8px 10px",
                background: "var(--bg-card)", border: "1px solid var(--border-color)", "border-radius": "8px",
                "margin-bottom": "8px", opacity: m.present ? "1" : "0.55",
              }}>
                <Show when={m.portrait} fallback={<span style={{ "font-size": "1.6rem" }}>{m.kind === "founder" ? "🧑‍🌾" : "🗡️"}</span>}>
                  <img src={m.portrait} alt={m.name} style={{ width: "38px", height: "38px", "border-radius": "50%", "object-fit": "cover", filter: m.present ? undefined : "grayscale(0.7)" }} />
                </Show>
                <div style={{ flex: "1", "min-width": "0" }}>
                  <div style={{ "font-size": "0.9rem" }}>{m.name}</div>
                  <div style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>
                    {m.present ? (m.kind === "founder" ? "at their post" : "home, on the roster") : (m.reason ?? "away")}
                  </div>
                </div>
                <span style={{ "font-size": "0.78rem", color: m.present ? "var(--accent-green, #4a9)" : "var(--text-muted)" }}>
                  {m.present ? "● here" : "○ away"}
                </span>
              </div>
            )}
          </For>

          {/* Kids — flavour only */}
          <Show when={staffing().kids.length > 0}>
            <p style={{ "font-size": "0.74rem", color: "var(--text-muted)", "font-style": "italic", margin: "2px 2px 12px" }}>
              {staffing().kids.join(" and ")} {staffing().kids.length > 1 ? "help out" : "helps out"} underfoot — more heart than hands.
            </p>
          </Show>

          {/* Townsfolk assignment */}
          <div style={{
            padding: "12px", background: "var(--bg-card)", border: "1px solid var(--border-color)",
            "border-radius": "8px",
          }}>
            <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "10px" }}>
              <div>
                <div style={{ "font-size": "0.9rem" }}>Townsfolk on this post</div>
                <div style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>{free()} spare in the settlement</div>
              </div>
              <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                <button
                  onClick={() => actions.unassignBuildingWorker(props.buildingId)}
                  disabled={staffing().citizens <= 0}
                  style={{
                    width: "30px", height: "30px", "font-size": "1.1rem", "line-height": 1,
                    border: "1px solid var(--border-color)", "border-radius": "6px",
                    background: "transparent", color: "var(--text-secondary)",
                    cursor: staffing().citizens <= 0 ? "default" : "pointer", opacity: staffing().citizens <= 0 ? "0.4" : "1",
                  }}
                >−</button>
                <span style={{ "min-width": "20px", "text-align": "center", "font-weight": 600 }}>{staffing().citizens}</span>
                <button
                  onClick={() => actions.assignBuildingWorker(props.buildingId)}
                  disabled={free() <= 0}
                  style={{
                    width: "30px", height: "30px", "font-size": "1.1rem", "line-height": 1,
                    border: "1px solid var(--border-color)", "border-radius": "6px",
                    background: "transparent", color: "var(--text-secondary)",
                    cursor: free() <= 0 ? "default" : "pointer", opacity: free() <= 0 ? "0.4" : "1",
                  }}
                >+</button>
              </div>
            </div>
            <p style={{ "font-size": "0.72rem", color: "var(--text-muted)", margin: "10px 0 0" }}>
              {understaffed()
                ? "Short a pair of hands. Bench a townsfolk to hold the post and keep output up while the regular is away."
                : "Fully covered. Extra hands sit ready in case someone falls ill or ships out."}
            </p>
          </div>
        </div>
      </div>
    </Portal>
  );
}
