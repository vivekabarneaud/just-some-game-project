// ─── Chronicle Entry Modal ─────────────────────────────────────
// Standalone viewer for a single chronicle entry. Used by the Chronicle
// Journal page (click an entry card) and by post-mission / robin-event flows
// that need to surface a narrative beat without taking the player off-page.
//
// Extracted from ChronicleJournal.tsx so it can be opened from anywhere.

import { For, Show, onMount } from "solid-js";
import type { ChronicleEntry } from "~/data/chronicle_entries";
import { playSound } from "~/engine/sounds";

interface Props {
  entry: ChronicleEntry;
  onClose: () => void;
}

export default function ChronicleEntryModal(props: Props) {
  const paragraphs = () => props.entry.fullText.split("\n\n");
  onMount(() => playSound("page_turn"));

  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div
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
            onClick={props.onClose}
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
