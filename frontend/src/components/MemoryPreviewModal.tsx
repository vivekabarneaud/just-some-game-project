// ─── Memory Preview Modal ─────────────────────────────────────
// Standalone viewer for a single unlocked bio fragment. Mirrors
// ChronicleEntryModal so memories and journal entries feel like the
// same kind of thing: a page from the Lord's book.
//
// Opening this modal marks the fragment as seen so the "New" highlight
// on the Cast page clears.

import { For, onMount } from "solid-js";
import type { BioFragment, FoundingCharacter } from "~/data/founding_characters";
import { useGame } from "~/engine/gameState";
import { playSound } from "~/engine/sounds";

interface Props {
  character: FoundingCharacter;
  fragment: BioFragment;
  onClose: () => void;
}

export default function MemoryPreviewModal(props: Props) {
  const { actions } = useGame();
  const paragraphs = () => props.fragment.text.split("\n\n");
  onMount(() => {
    playSound("page_turn");
    actions.markBioFragmentSeen(props.fragment.id);
  });

  return (
    <div class="modal-overlay page-modal-backdrop" onClick={props.onClose} style={{ "z-index": "1100" }}>
      <div
        class="page-modal-card"
        style={{
          "max-width": "620px",
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

        <div style={{ display: "flex", "align-items": "center", gap: "14px", "margin-bottom": "18px" }}>
          <img
            src={props.character.portrait}
            alt={props.character.name}
            style={{
              width: "56px", height: "56px",
              "border-radius": "8px",
              "object-fit": "cover",
              border: "1px solid rgba(96, 165, 250, 0.4)",
            }}
          />
          <div>
            <div class="section-label" style={{
              "font-size": "0.7rem",
              color: "var(--accent-blue)",
              "letter-spacing": "0.08em",
            }}>
              A memory
            </div>
            <h2 style={{
              "font-size": "1.35rem",
              color: "var(--text-primary)",
              "font-family": "var(--font-heading)",
              margin: 0,
            }}>
              {props.character.name}
            </h2>
          </div>
        </div>

        <div style={{
          "font-size": "0.95rem",
          color: "var(--text-secondary)",
          "font-style": "italic",
          "line-height": "1.7",
        }}>
          <For each={paragraphs()}>
            {(p) => <p style={{ "margin-bottom": "14px" }}>{p}</p>}
          </For>
        </div>

        <div style={{
          "margin-top": "20px",
          "padding-top": "16px",
          "border-top": "1px solid var(--border-color)",
          display: "flex",
          "justify-content": "flex-end",
        }}>
          <button
            onClick={props.onClose}
            style={{
              padding: "8px 16px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              "border-radius": "6px",
              cursor: "pointer",
              "font-size": "0.85rem",
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
