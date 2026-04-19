import { createSignal, For, Show } from "solid-js";
import type { QuestDefinition } from "~/data/quests";
import { getChronicleEntry } from "~/data/chronicle_entries";
import { getCharactersForFragments } from "~/data/founding_characters";

interface Props {
  quest: QuestDefinition;
  onClaim: () => void;
  onClose: () => void;
}

/** Exit animation duration — keep in sync with .loot-card.exiting in global.css. */
const EXIT_ANIMATION_MS = 240;

/**
 * Celebratory modal shown when the player completes a tutorial quest.
 * Reuses the loot-modal keyframes (`loot-backdrop`, `loot-card`, `loot-section`,
 * `loot-chip`) from global.css so the entry/exit animations are consistent.
 */
export default function QuestClaimModal(props: Props) {
  const [exiting, setExiting] = createSignal(false);
  const dismissWith = (kind: "close" | "claim") => {
    if (exiting()) return;
    setExiting(true);
    setTimeout(() => {
      if (kind === "claim") props.onClaim();
      else props.onClose();
    }, EXIT_ANIMATION_MS);
  };

  return (
    <div
      class="loot-backdrop"
      classList={{ exiting: exiting() }}
      onClick={() => dismissWith("close")}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        "z-index": 1000,
        display: "flex", "align-items": "center", "justify-content": "center",
        padding: "20px",
        overflow: "hidden",
      }}
    >
      <div
        class="loot-card"
        classList={{ exiting: exiting() }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-secondary)",
          border: "2px solid var(--accent-gold)",
          "border-radius": "10px",
          "max-width": "460px",
          width: "100%",
          "max-height": "85vh",
          "overflow-y": "hidden",
          "overflow-x": "hidden",
          "box-shadow": "0 10px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header */}
        <div class="loot-section" style={{
          padding: "16px 20px",
          background: "rgba(212, 175, 55, 0.1)",
          "border-bottom": "1px solid var(--accent-gold)",
          "animation-delay": "100ms",
        }}>
          <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
            <span style={{ "font-size": "2rem" }}>{props.quest.icon}</span>
            <div>
              <div style={{
                "font-size": "0.75rem",
                "text-transform": "uppercase",
                "letter-spacing": "1px",
                color: "var(--accent-gold)",
                "font-weight": "bold",
              }}>
                Quest Complete
              </div>
              <div style={{ "font-family": "var(--font-heading)", "font-size": "1.3rem", color: "var(--text-primary)" }}>
                {props.quest.title}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", display: "flex", "flex-direction": "column", gap: "14px" }}>
          <div class="loot-section" style={{ "animation-delay": "180ms" }}>
            <div style={{
              "font-size": "0.75rem", "text-transform": "uppercase", "letter-spacing": "1px",
              color: "var(--text-muted)", "margin-bottom": "6px",
            }}>
              Rewards
            </div>
            <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
              <For each={props.quest.rewards}>
                {(reward, i) => (
                  <span class="loot-chip" style={{
                    padding: "6px 12px",
                    background: "rgba(212, 175, 55, 0.12)",
                    border: "1px solid var(--accent-gold)",
                    "border-radius": "4px",
                    color: "var(--accent-gold)",
                    "font-size": "0.9rem",
                    "font-weight": "600",
                    "animation-delay": `${280 + i() * 55}ms`,
                  }}>
                    +{reward.amount} {reward.label}
                  </span>
                )}
              </For>
            </div>
          </div>

          {/* New journal entry note — shown only if this quest unlocks a Chronicle entry */}
          <Show when={props.quest.chronicleEntryId && getChronicleEntry(props.quest.chronicleEntryId)}>
            {(entry) => (
              <div class="loot-section" style={{
                "animation-delay": "380ms",
                padding: "10px 14px",
                background: "rgba(96, 165, 250, 0.08)",
                border: "1px solid var(--accent-blue)",
                "border-radius": "6px",
              }}>
                <div style={{
                  "font-size": "0.7rem",
                  "text-transform": "uppercase",
                  "letter-spacing": "1px",
                  color: "var(--accent-blue)",
                  "font-weight": "bold",
                  "margin-bottom": "4px",
                }}>
                  📖 New journal entry
                </div>
                <div style={{
                  "font-size": "0.95rem",
                  color: "var(--text-primary)",
                  "font-family": "var(--font-heading)",
                }}>
                  {entry().title}
                </div>
                <div style={{
                  "font-size": "0.8rem",
                  color: "var(--text-secondary)",
                  "font-style": "italic",
                  "line-height": "1.45",
                  "margin-top": "4px",
                }}>
                  {entry().teaser}
                </div>
              </div>
            )}
          </Show>

          {/* New memory notes — one per character whose fragment was unlocked */}
          <Show when={props.quest.unlocksBioFragments && props.quest.unlocksBioFragments.length > 0}>
            <For each={getCharactersForFragments(props.quest.unlocksBioFragments ?? [])}>
              {(char, i) => (
                <div class="loot-section" style={{
                  "animation-delay": `${380 + i() * 80}ms`,
                  padding: "10px 14px",
                  background: "rgba(96, 165, 250, 0.08)",
                  border: "1px solid var(--accent-blue)",
                  "border-radius": "6px",
                  display: "flex",
                  "align-items": "center",
                  gap: "12px",
                }}>
                  <img
                    src={char.portrait}
                    alt={char.name}
                    style={{
                      width: "48px", height: "48px",
                      "border-radius": "6px",
                      "object-fit": "cover",
                      "flex-shrink": "0",
                      border: "1px solid rgba(96, 165, 250, 0.4)",
                    }}
                  />
                  <div style={{ "min-width": "0" }}>
                    <div style={{
                      "font-size": "0.7rem",
                      "text-transform": "uppercase",
                      "letter-spacing": "1px",
                      color: "var(--accent-blue)",
                      "font-weight": "bold",
                      "margin-bottom": "2px",
                    }}>
                      📖 New memory
                    </div>
                    <div style={{
                      "font-size": "0.95rem",
                      color: "var(--text-primary)",
                      "font-family": "var(--font-heading)",
                    }}>
                      {char.name}
                    </div>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>

        {/* Footer */}
        <div class="loot-section" style={{
          padding: "14px 20px",
          "border-top": "1px solid var(--border-color)",
          display: "flex", "justify-content": "flex-end", gap: "8px",
          "animation-delay": "500ms",
        }}>
          <button
            class="upgrade-btn"
            onClick={() => dismissWith("claim")}
            style={{ padding: "8px 20px", "font-size": "0.95rem" }}
          >
            Claim
          </button>
        </div>
      </div>
    </div>
  );
}
