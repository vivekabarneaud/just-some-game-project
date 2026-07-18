import { For, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { useGame } from "~/engine/gameState";
import { availableCitizens } from "~/data/defenses";
import { animalSlots } from "~/data/buildings";

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
  // Hunting-dog posting: show only the dogs on the hunt + a picker to send more,
  // capped by the camp's level (one dog slot per level).
  const campLvl = () => state.buildings.find((b) => b.buildingId === "hunting_camp")?.level ?? 0;
  const dogSlots = () => animalSlots("hunting_camp", campLvl());
  const assignedDogs = () => dogs().filter((d) => d.job === "hunt");
  const availableDogs = () => dogs().filter((d) => d.job === "idle" && !d.isPuppy);
  // Picker modal: idle dogs are sendable; the rest show their post for reference.
  const [pickerOpen, setPickerOpen] = createSignal(false);
  const pickerDogs = () => dogs().filter((d) => !d.isPuppy && d.job !== "hunt");
  const dogPost = (job: string) => job === "guard" ? "guarding a flock" : job === "mouse" ? "on the prowl" : "resting";

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
                {/* Use the zoomed (face) portrait; fall back to the full one if none. */}
                <img
                  src={m.portrait!.replace(".png", "_zoomed.png")}
                  alt={m.name}
                  onError={(e) => { const el = e.currentTarget; if (el.src.includes("_zoomed")) el.src = m.portrait!; }}
                  style={{ width: "44px", height: "44px", "border-radius": "50%", "object-fit": "cover", filter: m.present ? undefined : "grayscale(0.7)" }}
                />
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

        {/* Hunting dogs — the dogs on the hunt + a picker to send more, capped by
            the camp's level (one slot per level). Full roster lives at the Kennel. */}
        <Show when={props.buildingId === "hunting_camp"}>
          <div style={divider}>
            <div style={{ "font-size": "0.9rem", "margin-bottom": "8px" }}>
              🐕 Hunting dogs <span style={{ color: "var(--text-muted)", "font-weight": 400 }}>({assignedDogs().length} / {dogSlots()})</span>
            </div>

            <For each={assignedDogs()}>
              {(d) => (
                <div style={{ display: "flex", "align-items": "center", gap: "10px", padding: "4px 0" }}>
                  <Show when={d.portrait} fallback={<span style={{ "font-size": "1.4rem" }}>🐕</span>}>
                    <img src={d.portrait} alt={d.name} style={{ width: "40px", height: "40px", "border-radius": "50%", "object-fit": "cover", "object-position": "center 20%" }} />
                  </Show>
                  <div style={{ flex: "1", "min-width": "0" }}>
                    <div style={{ "font-size": "0.85rem" }}>{d.name}</div>
                    <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)" }}>🏹 {stars(d.huntLevel)}</div>
                  </div>
                  <button
                    onClick={() => actions.assignAnimal(d.id, "idle")}
                    style={{
                      "font-size": "0.76rem", padding: "5px 10px", cursor: "pointer",
                      border: "1px solid var(--border-color)", color: "var(--text-secondary)",
                      background: "transparent", "border-radius": "0", "white-space": "nowrap",
                    }}
                  >Recall</button>
                </div>
              )}
            </For>

            <Show when={assignedDogs().length === 0}>
              <div style={{ "font-size": "0.74rem", color: "var(--text-muted)", "font-style": "italic" }}>No dogs on the hunt yet.</div>
            </Show>

            {/* Post another dog — only while a slot is free. */}
            <Show when={assignedDogs().length < dogSlots()}>
              <Show
                when={availableDogs().length > 0}
                fallback={<div style={{ "font-size": "0.74rem", color: "var(--text-muted)", "font-style": "italic", "margin-top": "8px" }}>No idle dogs to send — raise or free one at the Kennel.</div>}
              >
                <button
                  onClick={() => setPickerOpen(true)}
                  style={{
                    "margin-top": "8px", "font-size": "0.8rem", padding: "6px 12px", cursor: "pointer",
                    border: "1px solid var(--accent-gold)", color: "var(--accent-gold)",
                    background: "rgba(212, 175, 55, 0.08)", "border-radius": "0",
                  }}
                >＋ Send a dog to the hunt</button>
              </Show>
            </Show>
          </div>
        </Show>
      </div>

      {/* Dog picker — a visual card grid of faces (idle = sendable, others shown
          for reference), styled after the tavern's menu editor. */}
      <Show when={pickerOpen()}>
        <Portal>
          <div
            onClick={() => setPickerOpen(false)}
            style={{ position: "fixed", inset: "0", background: "rgba(0,0,0,0.7)", display: "flex", "align-items": "center", "justify-content": "center", "z-index": "1200", padding: "20px" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: "var(--bg-secondary)", border: "2px solid var(--accent-gold)", "max-width": "560px", width: "100%", "max-height": "85vh", overflow: "auto", padding: "20px 24px", color: "var(--text-primary)" }}
            >
              <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "4px" }}>
                <h3 style={{ margin: 0, "font-family": "var(--font-heading)", color: "var(--accent-gold)" }}>🐕 Send a dog to the hunt</h3>
                <button onClick={() => setPickerOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", "font-size": "1.2rem", cursor: "pointer", "line-height": 1 }}>✕</button>
              </div>
              <p style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-bottom": "14px" }}>
                {assignedDogs().length} / {dogSlots()} posted. Idle dogs can be sent; the others show where they're working.
              </p>
              <div style={{ display: "flex", "flex-wrap": "wrap", gap: "10px", "align-content": "flex-start" }}>
                <For each={pickerDogs()}>
                  {(d) => {
                    const sendable = () => d.job === "idle" && assignedDogs().length < dogSlots();
                    return (
                      <button
                        disabled={!sendable()}
                        onClick={() => { actions.assignAnimal(d.id, "hunt"); if (assignedDogs().length >= dogSlots()) setPickerOpen(false); }}
                        style={{
                          width: "108px", padding: "12px 8px", cursor: sendable() ? "pointer" : "default",
                          background: "var(--bg-card)", "border-radius": "0", color: "var(--text-primary)",
                          border: `1px solid ${sendable() ? "var(--accent-gold)" : "var(--border-color)"}`,
                          opacity: d.job === "idle" ? "1" : "0.55",
                          display: "flex", "flex-direction": "column", "align-items": "center", gap: "6px",
                        }}
                      >
                        <Show when={d.portrait} fallback={<span style={{ "font-size": "2.6rem" }}>🐕</span>}>
                          <img src={d.portrait} alt={d.name} style={{ width: "68px", height: "68px", "border-radius": "50%", "object-fit": "cover", "object-position": "center 20%" }} />
                        </Show>
                        <div style={{ "font-size": "0.85rem" }}>{d.name}</div>
                        <div style={{ "font-size": "0.7rem", color: "var(--accent-gold)" }}>🏹 {stars(d.huntLevel)}</div>
                        <Show when={d.job !== "idle"}>
                          <div style={{ "font-size": "0.66rem", color: "var(--text-muted)" }}>{dogPost(d.job)}</div>
                        </Show>
                      </button>
                    );
                  }}
                </For>
                <Show when={pickerDogs().length === 0}>
                  <p style={{ "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic" }}>No dogs to send. Take one in or raise one at the Kennel.</p>
                </Show>
              </div>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
