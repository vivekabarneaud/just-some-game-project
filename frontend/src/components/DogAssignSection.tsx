import { For, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { useGame } from "~/engine/gameState";

interface Props {
  /** "hunt" (hunting camp) or "guard" (a pen). */
  job: "hunt" | "guard";
  /** Required for guard — which pen the dog watches. */
  penId?: string;
  /** How many dogs this post can hold. */
  slots: number;
  /** Section heading, e.g. "Hunting dogs" / "Guard dogs". */
  label: string;
  /** Picker button + modal title, e.g. "Send a dog to the hunt". */
  sendLabel: string;
}

const stars = (l: number) => "★".repeat(Math.max(0, l)) + "☆".repeat(Math.max(0, 5 - l));

/**
 * Reusable dog-posting UI: shows only the dogs on THIS post (portrait + skill
 * stars + Recall), a "N / slots" count, and a "＋" that opens a visual face-picker
 * (idle dogs sendable, others shown dimmed with their current post). Used by the
 * hunting camp (job="hunt") and pens (job="guard", penId set).
 */
export default function DogAssignSection(props: Props) {
  const { state, actions } = useGame();
  const [pickerOpen, setPickerOpen] = createSignal(false);

  const dogs = () => state.keptAnimals.filter((a) => a.species === "dog");
  const hasKennel = () => (state.buildings.find((b) => b.buildingId === "kennel")?.level ?? 0) > 0;
  const onThisPost = (d: { job: string; penId?: string }) =>
    d.job === props.job && (props.job !== "guard" || d.penId === props.penId);
  const assigned = () => dogs().filter(onThisPost);
  const skill = (d: { guardLevel: number; huntLevel: number }) => props.job === "guard" ? d.guardLevel : d.huntLevel;
  const skillIcon = props.job === "guard" ? "🛡️" : "🏹";
  // Everything not already on this post (idle = sendable; the rest shown dimmed).
  // Owner-bound hounds (e.g. Nessa's) aren't the player's to post, so they
  // never show in the picker.
  const pickerDogs = () => dogs().filter((d) => !d.isPuppy && !d.keeper && !onThisPost(d));
  const post = (job: string) => job === "hunt" ? "on the hunt" : job === "guard" ? "guarding a flock" : job === "mouse" ? "on the prowl" : "resting";

  const recall = (id: string) => actions.assignAnimal(id, "idle");
  const send = (id: string) => { actions.assignAnimal(id, props.job, props.penId); if (assigned().length >= props.slots) setPickerOpen(false); };

  return (
    <div>
      <div style={{ "font-size": "0.9rem", "margin-bottom": "8px" }}>
        🐕 {props.label} <span style={{ color: "var(--text-muted)", "font-weight": 400 }}>({assigned().length} / {props.slots})</span>
      </div>

      <For each={assigned()}>
        {(d) => (
          <div style={{ display: "flex", "align-items": "center", gap: "10px", padding: "4px 0" }}>
            <Show when={d.portrait} fallback={<span style={{ "font-size": "1.4rem" }}>🐕</span>}>
              <img src={d.portrait} alt={d.name} style={{ width: "40px", height: "40px", "border-radius": "50%", "object-fit": "cover", "object-position": "center 20%" }} />
            </Show>
            <div style={{ flex: "1", "min-width": "0" }}>
              <div style={{ "font-size": "0.85rem" }}>{d.name}</div>
              <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)" }}>{skillIcon} {stars(skill(d))}</div>
            </div>
            <Show
              when={!d.keeper}
              fallback={<span style={{ "font-size": "0.72rem", color: "var(--text-muted)", "font-style": "italic", "white-space": "nowrap" }}>{d.keeper}'s hound</span>}
            >
              <button
                onClick={() => recall(d.id)}
                style={{
                  "font-size": "0.76rem", padding: "5px 10px", cursor: "pointer",
                  border: "1px solid var(--border-color)", color: "var(--text-secondary)",
                  background: "transparent", "border-radius": "0", "white-space": "nowrap",
                }}
              >Recall</button>
            </Show>
          </div>
        )}
      </For>

      <Show when={assigned().length === 0}>
        <div style={{ "font-size": "0.74rem", color: "var(--text-muted)", "font-style": "italic" }}>None posted yet.</div>
      </Show>

      <Show when={assigned().length < props.slots}>
        <Show
          when={pickerDogs().some((d) => d.job === "idle")}
          fallback={
            <div style={{ "font-size": "0.74rem", color: "var(--text-muted)", "font-style": "italic", "margin-top": "8px" }}>
              {!hasKennel()
                ? "Build a Kennel to take in a dog you can post here."
                : "No idle dogs to post. Raise or free one at the Kennel."}
            </div>
          }
        >
          <button
            onClick={() => setPickerOpen(true)}
            style={{
              "margin-top": "8px", "font-size": "0.8rem", padding: "6px 12px", cursor: "pointer",
              border: "1px solid var(--accent-gold)", color: "var(--accent-gold)",
              background: "rgba(212, 175, 55, 0.08)", "border-radius": "0",
            }}
          >＋ {props.sendLabel}</button>
        </Show>
      </Show>

      {/* Visual face-picker (styled after the tavern menu editor). */}
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
                <h3 style={{ margin: 0, "font-family": "var(--font-heading)", color: "var(--accent-gold)" }}>🐕 {props.sendLabel}</h3>
                <button onClick={() => setPickerOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", "font-size": "1.2rem", cursor: "pointer", "line-height": 1 }}>✕</button>
              </div>
              <p style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-bottom": "14px" }}>
                {assigned().length} / {props.slots} posted. Idle dogs can be sent; the others show where they're working.
              </p>
              <div style={{ display: "flex", "flex-wrap": "wrap", gap: "10px", "align-content": "flex-start" }}>
                <For each={pickerDogs()}>
                  {(d) => {
                    const sendable = () => d.job === "idle" && assigned().length < props.slots;
                    return (
                      <button
                        disabled={!sendable()}
                        onClick={() => send(d.id)}
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
                        <div style={{ "font-size": "0.7rem", color: "var(--accent-gold)" }}>{skillIcon} {stars(skill(d))}</div>
                        <Show when={d.job !== "idle"}>
                          <div style={{ "font-size": "0.66rem", color: "var(--text-muted)" }}>{post(d.job)}</div>
                        </Show>
                      </button>
                    );
                  }}
                </For>
                <Show when={pickerDogs().length === 0}>
                  <p style={{ "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic" }}>No dogs to post. Take one in or raise one at the Kennel.</p>
                </Show>
              </div>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
