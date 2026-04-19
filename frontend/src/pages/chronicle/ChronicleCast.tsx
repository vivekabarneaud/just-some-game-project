import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { useGame } from "~/engine/gameState";
import {
  FOUNDING_CHARACTERS,
  getFragmentsForCharacter,
  type FoundingCharacter,
} from "~/data/founding_characters";

export default function ChronicleCast() {
  const { state, actions } = useGame();
  const [openCharId, setOpenCharId] = createSignal<string | null>(null);

  const unlocked = createMemo(() => new Set(state.unlockedBioFragments ?? []));

  // Snapshot of characters with unseen memories at mount. Drives the light-blue
  // card highlight. Does not update while the page is open — next visit will
  // find these marked seen.
  const charsWithFreshMemories = new Set<string>();
  {
    const unlockedAtMount = state.unlockedBioFragments ?? [];
    const seenAtMount = new Set(state.bioFragmentsSeen ?? []);
    const freshFragIds = new Set(unlockedAtMount.filter((id) => !seenAtMount.has(id)));
    if (freshFragIds.size > 0) {
      for (const c of FOUNDING_CHARACTERS) {
        if (c.fragments.some((f) => freshFragIds.has(f.id))) {
          charsWithFreshMemories.add(c.id);
        }
      }
    }
  }
  const isFreshChar = (id: string) => charsWithFreshMemories.has(id);

  onMount(() => {
    // Mark all currently-unlocked fragments as seen — clears the sidebar pulse
    // and tab badge for next time.
    actions.visitChronicleCast();
  });

  const fragmentCount = (char: FoundingCharacter) =>
    char.fragments.filter((f) => unlocked().has(f.id)).length;

  const openChar = () =>
    openCharId() ? FOUNDING_CHARACTERS.find((c) => c.id === openCharId()) ?? null : null;

  return (
    <div>
      <p style={{ color: "var(--text-muted)", "margin-bottom": "16px", "font-size": "0.85rem" }}>
        The six who came with the Lord from Ashwick. Each page grows as the story unfolds.
      </p>

      {/* Character grid */}
      <div style={{
        display: "grid",
        "grid-template-columns": "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "14px",
      }}>
        <For each={FOUNDING_CHARACTERS}>
          {(char) => {
            const fresh = () => isFreshChar(char.id);
            return (
            <div
              class="building-card"
              style={{
                cursor: "pointer",
                transition: "transform 0.15s",
                position: "relative",
                ...(fresh()
                  ? {
                      border: "1px solid var(--accent-blue)",
                      "box-shadow": "0 0 0 1px var(--accent-blue), 0 0 12px rgba(96, 165, 250, 0.25)",
                      background: "rgba(96, 165, 250, 0.06)",
                    }
                  : {}),
              }}
              onClick={() => setOpenCharId(char.id)}
            >
              <Show when={fresh()}>
                <div style={{
                  position: "absolute",
                  top: "8px",
                  right: "10px",
                  "font-size": "0.65rem",
                  "letter-spacing": "0.08em",
                  "text-transform": "uppercase",
                  color: "var(--accent-blue)",
                  "font-weight": "bold",
                  "z-index": "2",
                  background: "rgba(26, 26, 32, 0.75)",
                  padding: "2px 6px",
                  "border-radius": "4px",
                }}>
                  New
                </div>
              </Show>
              {/* Portrait */}
              <div style={{
                position: "relative", width: "100%",
                height: "180px", "border-radius": "6px", overflow: "hidden",
                background: "rgba(0, 0, 0, 0.4)",
                display: "flex", "align-items": "center", "justify-content": "center",
              }}>
                <img
                  src={char.portrait}
                  alt={char.name}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", "object-fit": "cover" }}
                />
              </div>

              <div style={{ "margin-top": "10px" }}>
                <div class="building-card-title">
                  {char.name}
                  <Show when={char.age}>
                    <span style={{
                      "font-size": "0.8rem",
                      color: "var(--text-muted)",
                      "margin-left": "6px",
                      "font-weight": "normal",
                    }}>
                      · {char.age}
                    </span>
                  </Show>
                </div>
                <div style={{
                  "font-size": "0.72rem",
                  color: "var(--text-muted)",
                  "margin-top": "2px",
                  "line-height": "1.4",
                }}>
                  {char.role}
                </div>
                <Show when={char.fragments.length > 0}>
                  <div style={{
                    "margin-top": "8px",
                    "font-size": "0.72rem",
                    color: "var(--accent-gold)",
                  }}>
                    📖 {fragmentCount(char)} / {char.fragments.length} memories
                  </div>
                </Show>
              </div>
            </div>
            );
          }}
        </For>
      </div>

      {/* Character detail modal */}
      <Show when={openChar()}>
        {(char) => (
          <CharacterModal
            character={char()}
            unlockedFragments={Array.from(unlocked())}
            onClose={() => setOpenCharId(null)}
          />
        )}
      </Show>
    </div>
  );
}

// ─── Character detail modal ───────────────────────────────────────

function CharacterModal(props: {
  character: FoundingCharacter;
  unlockedFragments: string[];
  onClose: () => void;
}) {
  const fragments = () => getFragmentsForCharacter(props.character.id, props.unlockedFragments);

  return (
    <div
      style={{
        position: "fixed", inset: "0",
        background: "rgba(0, 0, 0, 0.75)",
        "z-index": "1000",
        display: "flex", "align-items": "center", "justify-content": "center",
        padding: "24px",
      }}
      onClick={props.onClose}
    >
      <div
        style={{
          "max-width": "680px",
          "max-height": "86vh",
          overflow: "auto",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          "border-radius": "10px",
          padding: "28px 32px",
          "box-shadow": "0 12px 40px rgba(0,0,0,0.5)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={props.onClose}
          style={{
            position: "absolute", top: "10px", right: "12px",
            background: "transparent", border: "none",
            color: "var(--text-muted)", "font-size": "1.4rem",
            cursor: "pointer", "line-height": "1",
          }}
          aria-label="Close"
        >
          ×
        </button>

        {/* Header: portrait + name + role */}
        <div style={{ display: "flex", gap: "18px", "margin-bottom": "18px" }}>
          <div style={{
            "flex-shrink": "0",
            width: "140px", height: "140px",
            "border-radius": "8px", overflow: "hidden",
            background: "rgba(0,0,0,0.4)",
          }}>
            <img
              src={props.character.portrait}
              alt={props.character.name}
              style={{ width: "100%", height: "100%", "object-fit": "cover" }}
            />
          </div>
          <div style={{ "flex-grow": "1", "min-width": "0" }}>
            <h2 style={{
              "font-size": "1.4rem",
              color: "var(--text-primary)",
              "margin-bottom": "4px",
              "font-family": "var(--font-heading)",
            }}>
              {props.character.name}
              <Show when={props.character.age}>
                <span style={{
                  "font-size": "0.95rem",
                  color: "var(--text-muted)",
                  "margin-left": "8px",
                  "font-weight": "normal",
                }}>
                  · {props.character.age}
                </span>
              </Show>
            </h2>
            <div style={{
              "font-size": "0.85rem",
              color: "var(--accent-gold)",
              "font-style": "italic",
              "line-height": "1.4",
            }}>
              {props.character.role}
            </div>
          </div>
        </div>

        {/* Core bio */}
        <div style={{
          "font-size": "0.92rem",
          color: "var(--text-secondary)",
          "line-height": "1.65",
          "margin-bottom": "18px",
        }}>
          {props.character.coreBio}
        </div>

        {/* Fragments */}
        <Show when={props.character.fragments.length > 0}>
          <div style={{
            "padding-top": "14px",
            "border-top": "1px solid var(--border-color)",
          }}>
            <div style={{
              "font-size": "0.75rem",
              color: "var(--accent-gold)",
              "letter-spacing": "0.08em",
              "text-transform": "uppercase",
              "margin-bottom": "12px",
            }}>
              Memories ({fragments().length} / {props.character.fragments.length})
            </div>
            <Show
              when={fragments().length > 0}
              fallback={
                <div style={{
                  "font-size": "0.85rem",
                  color: "var(--text-muted)",
                  "font-style": "italic",
                }}>
                  No memories yet — the story has only begun.
                </div>
              }
            >
              <For each={fragments()}>
                {(frag) => (
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(212, 163, 115, 0.06)",
                    "border-left": "2px solid rgba(212, 163, 115, 0.35)",
                    "border-radius": "4px",
                    "margin-bottom": "10px",
                    "font-size": "0.88rem",
                    color: "var(--text-secondary)",
                    "font-style": "italic",
                    "line-height": "1.6",
                  }}>
                    {frag.text}
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
