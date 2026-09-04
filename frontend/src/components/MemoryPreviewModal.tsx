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

  // Parchment palette — mirror ChronicleEntryModal so a memory reads as a page
  // from the same book (this module's header always intended that).
  const INK = "#2a2012";
  const INK_STRONG = "#17100a";
  const INK_SOFT = "#6b5636";
  const parchmentSrc = "/images/parchment/parchment_square.png";

  return (
    <div class="modal-overlay page-modal-backdrop" onClick={props.onClose} style={{ "z-index": "1100" }}>
      {/* The shell exists so the ✕ has something that does NOT scroll to anchor
          to. The card below is the scroller (max-height + overflow: auto), and
          the button used to be absolutely positioned inside it — so on a long
          memory it scrolled out of reach and you had to scroll back up to
          close. */}
      <div style={{ position: "relative", "max-width": "620px", width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={props.onClose}
          style={{
            position: "absolute", top: "10px", right: "12px", "z-index": "2",
            background: "transparent", border: "none",
            color: INK_SOFT, "font-size": "1.4rem",
            cursor: "pointer", "line-height": "1",
          }}
          aria-label="Close"
        >
          ×
        </button>
      <div
        class="page-modal-card"
        style={{
          "max-width": "620px",
          "max-height": "86vh",
          overflow: "auto",
          background: `url(${parchmentSrc}) center / 100% 100% no-repeat`,
          border: "none",
          "border-radius": "0",
          padding: "42px 46px",
          "box-shadow": "0 6px 20px rgba(0,0,0,0.35)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", "align-items": "center", gap: "14px", "margin-bottom": "18px" }}>
          <img
            src={props.character.portrait}
            alt={props.character.name}
            style={{
              width: "56px", height: "56px",
              "border-radius": "8px",
              "object-fit": "cover",
              border: "1px solid rgba(23, 16, 10, 0.25)",
            }}
          />
          <div>
            <div class="section-label" style={{
              "font-size": "0.7rem",
              color: INK_SOFT,
              "letter-spacing": "0.08em",
            }}>
              A memory
            </div>
            <h2 style={{
              "font-size": "1.35rem",
              color: INK_STRONG,
              "font-family": "var(--font-heading)",
              margin: 0,
            }}>
              {props.character.name}
            </h2>
          </div>
        </div>

        <div style={{
          "font-size": "0.95rem",
          color: INK,
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
          "border-top": "1px solid rgba(107, 86, 54, 0.35)",
          display: "flex",
          "justify-content": "flex-end",
        }}>
          <button
            onClick={props.onClose}
            style={{
              padding: "8px 16px",
              background: "rgba(23, 16, 10, 0.06)",
              border: "1px solid rgba(107, 86, 54, 0.5)",
              color: INK_STRONG,
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
    </div>
  );
}
