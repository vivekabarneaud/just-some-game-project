import { For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { availableCitizens } from "~/data/defenses";

interface Props {
  buildingId: string;
}

/**
 * Staff manager as an inline SECTION — one framed card with internal dividers
 * (coverage header, named hands, townsfolk +/-, and hunting dogs at the camp),
 * rather than three separate boxes. Coverage model: a staffable building runs at
 * full tilt while its named hands are home; when an adventurer deploys, output
 * dips toward a floor and the player can bench a townsfolk to hold the post.
 */
export default function BuildingStaffSection(props: Props) {
  const { state, actions } = useGame();

  const staffing = () => actions.getBuildingStaffing(props.buildingId);
  const free = () => availableCitizens(state);
  const coverage = () => Math.round(staffing().multiplier * 100);
  const understaffed = () => staffing().active < staffing().capacity;
  const dogs = () => state.keptAnimals.filter((a) => a.species === "dog");
  const stars = (l: number) => "★".repeat(Math.max(0, l)) + "☆".repeat(Math.max(0, 5 - l));

  const divider = { "border-top": "1px solid var(--border-color)", "margin-top": "10px", "padding-top": "10px" } as const;

  return (
    <div style={{ "margin-bottom": "20px" }}>
      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "0.6px", "margin-bottom": "8px" }}>
        Staff
      </div>

      <div style={{ padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        {/* Coverage header */}
        <div style={{ display: "flex", "align-items": "baseline", gap: "12px", "flex-wrap": "wrap" }}>
          <span style={{ "font-size": "1.05rem", "font-weight": 600 }}>
            {staffing().active} / {staffing().capacity} <span style={{ "font-size": "0.8rem", color: "var(--text-muted)", "font-weight": 400 }}>staffed</span>
          </span>
          <span style={{ "font-size": "0.9rem", color: understaffed() ? "var(--accent-red)" : "var(--accent-green, #4a9)" }}>
            {coverage()}% output
          </span>
        </div>

        {/* Named hands */}
        <For each={staffing().named}>
          {(m) => (
            <div style={{ display: "flex", "align-items": "center", gap: "10px", "margin-top": "10px", opacity: m.present ? "1" : "0.55" }}>
              <Show when={m.portrait} fallback={<span style={{ "font-size": "1.5rem" }}>{m.kind === "founder" ? "🧑‍🌾" : "🗡️"}</span>}>
                <img src={m.portrait} alt={m.name} style={{ width: "34px", height: "34px", "border-radius": "50%", "object-fit": "cover", filter: m.present ? undefined : "grayscale(0.7)" }} />
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
          <p style={{ "font-size": "0.74rem", color: "var(--text-muted)", "font-style": "italic", margin: "8px 0 0" }}>
            {staffing().kids.join(" and ")} {staffing().kids.length > 1 ? "help out" : "helps out"} underfoot — more heart than hands.
          </p>
        </Show>

        {/* Townsfolk assignment */}
        <div style={divider}>
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
                  border: "1px solid var(--border-color)", "border-radius": "0",
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
                  border: "1px solid var(--border-color)", "border-radius": "0",
                  background: "transparent", color: "var(--text-secondary)",
                  cursor: free() <= 0 ? "default" : "pointer", opacity: free() <= 0 ? "0.4" : "1",
                }}
              >+</button>
            </div>
          </div>
          <p style={{ "font-size": "0.72rem", color: "var(--text-muted)", margin: "8px 0 0" }}>
            {understaffed()
              ? "Short a pair of hands. Bench a townsfolk to hold the post and keep output up while the regular is away."
              : "Fully covered. Extra hands sit ready in case someone falls ill or ships out."}
          </p>
        </div>

        {/* Hunting dogs — post kept dogs here to boost the catch (mirrors the Kennel). */}
        <Show when={props.buildingId === "hunting_camp"}>
          <div style={divider}>
            <div style={{ "font-size": "0.9rem", "margin-bottom": "8px" }}>🐕 Hunting dogs</div>
            <Show
              when={dogs().length > 0}
              fallback={<div style={{ "font-size": "0.74rem", color: "var(--text-muted)", "font-style": "italic" }}>No dogs to send. Take one in or raise one at the Kennel first.</div>}
            >
              <For each={dogs()}>
                {(d) => (
                  <div style={{ display: "flex", "align-items": "center", gap: "10px", padding: "4px 0" }}>
                    <div style={{ flex: "1", "min-width": "0" }}>
                      <div style={{ "font-size": "0.85rem" }}>{d.name}</div>
                      <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)" }}>🏹 {stars(d.huntLevel)}</div>
                    </div>
                    <button
                      onClick={() => actions.assignAnimal(d.id, d.job === "hunt" ? "idle" : "hunt")}
                      style={{
                        "font-size": "0.76rem", padding: "5px 10px", cursor: "pointer",
                        border: d.job === "hunt" ? "1px solid var(--accent-gold)" : "1px solid var(--border-color)",
                        color: d.job === "hunt" ? "var(--accent-gold)" : "var(--text-secondary)",
                        background: d.job === "hunt" ? "rgba(212, 175, 55, 0.1)" : "transparent",
                        "border-radius": "0", "white-space": "nowrap",
                      }}
                    >
                      {d.job === "hunt" ? "On the hunt" : "Send"}
                    </button>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
