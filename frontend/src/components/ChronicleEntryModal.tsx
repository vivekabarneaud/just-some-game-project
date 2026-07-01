// ─── Chronicle Entry Modal ─────────────────────────────────────
// Standalone viewer for a single chronicle entry. Used by the Chronicle
// Journal page (click an entry card) and by post-mission / robin-event flows
// that need to surface a narrative beat without taking the player off-page.
//
// Extracted from ChronicleJournal.tsx so it can be opened from anywhere.

import { For, Show, createSignal, onMount } from "solid-js";
import type { ChronicleEntry } from "~/data/chronicle_entries";
import { useGame } from "~/engine/gameState";
import { playSound } from "~/engine/sounds";

interface Props {
  entry: ChronicleEntry;
  onClose: () => void;
}

export default function ChronicleEntryModal(props: Props) {
  const { actions } = useGame();
  const paragraphs = () => props.entry.fullText.split("\n\n");
  onMount(() => {
    playSound("page_turn");
    actions.markChronicleEntrySeen(props.entry.id);
  });

  let cardRef: HTMLDivElement | undefined;
  const [folding, setFolding] = createSignal(false);

  // Dismiss = fold the card down into the sidebar Chronicle link, so the player
  // sees where the entry "lives" and how to find it again. Falls back to a plain
  // close if the sidebar link isn't on screen (e.g. a collapsed layout).
  const handleDismiss = () => {
    if (folding()) return;
    const card = cardRef;
    const target = document.querySelector('[data-nav-path="/chronicle"]') as HTMLElement | null;
    if (!card || !target) {
      props.onClose();
      return;
    }
    const c = card.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const dx = t.left + t.width / 2 - (c.left + c.width / 2);
    const dy = t.top + t.height / 2 - (c.top + c.height / 2);

    setFolding(true);
    playSound("nav"); // the finger-snap, as it tucks into the sidebar
    // Clear the open-animation (fill: both) so it stops overriding our transform.
    card.style.animation = "none";
    card.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.5s ease-in";
    card.style.transformOrigin = "center center";
    requestAnimationFrame(() => {
      card.style.transform = `translate(${dx}px, ${dy}px) scale(0.06)`;
      card.style.opacity = "0";
    });
    // Flash the sidebar icon as the entry "lands" there.
    window.setTimeout(() => target.classList.add("nav-fold-land"), 420);
    window.setTimeout(() => target.classList.remove("nav-fold-land"), 1000);
    window.setTimeout(() => props.onClose(), 500);
  };

  return (
    <div
      class="modal-overlay page-modal-backdrop chronicle-entry-overlay"
      classList={{ folding: folding() }}
      onClick={handleDismiss}
      style={{ "z-index": "1100" }}
    >
      <div
        ref={cardRef}
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
          onClick={handleDismiss}
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

        <div class="section-label" style={{ "font-size": "0.7rem", color: "var(--accent-gold)", "letter-spacing": "0.08em" }}>
          Page {props.entry.order}
        </div>
        <h2 style={{
          "font-size": "1.35rem",
          color: "var(--text-primary)",
          "margin-bottom": "18px",
          "font-family": "var(--font-heading)",
        }}>
          {props.entry.title}
        </h2>

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
          "align-items": "center",
          gap: "12px",
        }}>
          {/* Replay is hidden for now except for the arrival intro — other
              cinematics are deferred (no art yet). */}
          <Show when={props.entry.cinematicId === "intro"}>
            <button
              style={{
                padding: "8px 14px",
                background: "rgba(167, 139, 250, 0.15)",
                border: "1px solid rgba(167, 139, 250, 0.4)",
                color: "var(--text-primary)",
                "border-radius": "6px",
                cursor: "pointer",
                "font-size": "0.85rem",
              }}
              onClick={() => {
                alert("Replay cinematic: " + props.entry.cinematicId + " (not wired yet)");
              }}
            >
              ▶ Replay cinematic
            </button>
          </Show>
          <button
            onClick={handleDismiss}
            style={{
              "margin-left": "auto",
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
