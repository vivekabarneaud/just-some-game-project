// ─── Chronicle Entry Modal ─────────────────────────────────────
// Standalone viewer for a single chronicle entry. Used by the Chronicle
// Journal page (click an entry card) and by post-mission / robin-event flows
// that need to surface a narrative beat without taking the player off-page.
//
// Extracted from ChronicleJournal.tsx so it can be opened from anywhere.

import { For, Show, createSignal, onMount } from "solid-js";
import { type ChronicleEntry, splitChronicleSlides } from "~/data/chronicle_entries";
import { useGame } from "~/engine/gameState";
import { playSound } from "~/engine/sounds";

interface Props {
  entry: ChronicleEntry;
  onClose: () => void;
}

export default function ChronicleEntryModal(props: Props) {
  const { actions } = useGame();
  // Authored slides: a paragraph that is just "---" marks a page-turn. Entries
  // with no marker parse to a single slide (unchanged from the old scroll view);
  // long, dramatic entries turn like journal pages, landing a beat per page.
  const slides = () => splitChronicleSlides(props.entry.fullText);
  const [slide, setSlide] = createSignal(0);
  const slideCount = () => slides().length;
  const current = () => slides()[Math.min(slide(), slideCount() - 1)] ?? [];
  const isLast = () => slide() >= slideCount() - 1;

  let cardRef: HTMLDivElement | undefined;
  const [folding, setFolding] = createSignal(false);

  const turnTo = (i: number) => {
    setSlide(i);
    playSound("page_turn");
    cardRef?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => { if (!isLast()) turnTo(slide() + 1); };
  const back = () => { if (slide() > 0) turnTo(slide() - 1); };

  onMount(() => {
    playSound("page_turn");
    actions.markChronicleEntrySeen(props.entry.id);
  });

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

  // Parchment page look (UX refont): dark ink on aged paper, the texture's own
  // edges ARE the border, so no gold frame here. Two portrait variants (one has
  // a torn cut) picked deterministically per entry so pages feel handmade.
  const INK = "#3a2e1c";
  const INK_STRONG = "#241a0e";
  const INK_SOFT = "#6b5636";
  const parchmentSrc = ([...props.entry.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 2 === 0
    ? "/images/parchment/parchment_page.png"
    : "/images/parchment/parchment_page_cut.png");

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
          // Aged-paper surface, stretched to fill so its darkened edges sit at
          // the card boundary (they are the border — no frame, no rounded box).
          background: `url(${parchmentSrc}) 0 0 / 100% 100% no-repeat`,
          border: "none",
          "border-radius": "0",
          padding: "42px 46px",
          "box-shadow": "0 12px 40px rgba(0,0,0,0.55)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDismiss}
          style={{
            position: "absolute", top: "12px", right: "16px",
            background: "transparent", border: "none",
            color: INK_SOFT, "font-size": "1.4rem",
            cursor: "pointer", "line-height": "1",
          }}
          aria-label="Close"
        >
          ×
        </button>

        <div class="section-label" style={{ "font-size": "0.7rem", color: INK_SOFT, "letter-spacing": "0.08em" }}>
          Page {props.entry.order}
        </div>
        <h2 style={{
          "font-size": "1.35rem",
          color: INK_STRONG,
          "margin-bottom": "18px",
          "font-family": "var(--font-heading)",
        }}>
          {props.entry.title}
        </h2>

        <div style={{
          "font-size": "0.95rem",
          color: INK,
          "font-style": "italic",
          "line-height": "1.7",
        }}>
          <For each={current()}>
            {(p) => <p style={{ "margin-bottom": "14px" }}>{p}</p>}
          </For>
        </div>

        <div style={{
          "margin-top": "20px",
          "padding-top": "16px",
          "border-top": "1px solid rgba(90, 74, 48, 0.3)",
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
          {/* Page-turn controls — only when the entry is authored into slides */}
          <Show when={slideCount() > 1}>
            <button
              onClick={back}
              disabled={slide() === 0}
              style={{
                padding: "8px 14px",
                background: "transparent",
                border: `1px solid ${INK_SOFT}`,
                color: INK,
                "border-radius": "6px",
                cursor: slide() === 0 ? "default" : "pointer",
                opacity: slide() === 0 ? "0.35" : "1",
                "font-size": "0.85rem",
              }}
            >
              ← Back
            </button>
            <div style={{ display: "flex", gap: "6px", "align-items": "center" }}>
              <For each={slides()}>
                {(_, i) => (
                  <span style={{
                    width: "7px", height: "7px", "border-radius": "50%",
                    background: i() === slide() ? INK_STRONG : "rgba(90, 74, 48, 0.35)",
                    transition: "background 0.2s ease",
                  }} />
                )}
              </For>
            </div>
          </Show>
          <button
            onClick={() => (isLast() ? handleDismiss() : next())}
            style={{
              "margin-left": "auto",
              padding: "8px 16px",
              background: isLast() ? "transparent" : "#5f4a2a",
              border: `1px solid ${isLast() ? INK_SOFT : "#5f4a2a"}`,
              color: isLast() ? INK : "#f3ead4",
              "border-radius": "6px",
              cursor: "pointer",
              "font-size": "0.85rem",
              "font-weight": isLast() ? 400 : 600,
            }}
          >
            {isLast() ? "Dismiss" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
