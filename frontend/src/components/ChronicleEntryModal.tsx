// ─── Chronicle Entry Modal ─────────────────────────────────────
// Standalone viewer for a single chronicle entry. Used by the Chronicle
// Journal page (click an entry card) and by post-mission / robin-event flows
// that need to surface a narrative beat without taking the player off-page.
//
// The entry turns like a book: its authored slides (split on "---") are laid
// out as a PageFlip book — the same 3D page-turn the intro cinematic uses —
// on aged parchment. Single-slide entries render as one static page (with
// internal scroll if long). Dismiss folds the whole thing into the sidebar
// Chronicle link so the player sees where it "lives".

import { For, Show, createSignal, createMemo, onMount, onCleanup } from "solid-js";
import { PageFlip } from "page-flip";
import { type ChronicleEntry, splitChronicleSlides } from "~/data/chronicle_entries";
import { useGame } from "~/engine/gameState";
import { playSound } from "~/engine/sounds";

interface Props {
  entry: ChronicleEntry;
  onClose: () => void;
}

const INK = "#2a2012";
const INK_STRONG = "#17100a";
const INK_SOFT = "#6b5636";
const parchmentSrc = "/images/parchment/parchment_square.png";

export default function ChronicleEntryModal(props: Props) {
  const { actions } = useGame();
  // Authored slides: a paragraph that is just "---" marks a page-turn. Entries
  // with no marker parse to a single slide.
  const slides = createMemo(() => splitChronicleSlides(props.entry.fullText));
  const slideCount = () => slides().length;
  const [slide, setSlide] = createSignal(0);
  const isLast = () => slide() >= slideCount() - 1;

  const [size, setSize] = createSignal(540);
  let flipContainerRef: HTMLDivElement | undefined;
  let foldRef: HTMLDivElement | undefined;
  let pageFlip: PageFlip | undefined;
  const [folding, setFolding] = createSignal(false);

  // One page per slide (no interleaved backs) so PageFlip's flipNext/flipPrev
  // turn a single adjacent page in the natural direction — Back no longer flies
  // the page in from off-screen.
  const next = () => {
    if (slide() >= slideCount() - 1) return;
    playSound("page_turn");
    setSlide(slide() + 1);
    pageFlip?.flipNext();
  };
  const back = () => {
    if (slide() <= 0) return;
    // Jump instantly (no fold) — the backward flip read strangely, so Back just
    // returns to the previous page while only Next plays the page-turn.
    setSlide(slide() - 1);
    (pageFlip as any)?.turnToPrevPage();
  };

  onMount(() => {
    playSound("page_turn");
    actions.markChronicleEntrySeen(props.entry.id);
    if (!flipContainerRef) return;
    // Square page sized to fit the viewport (matches the square parchment).
    const s = Math.floor(Math.min(window.innerWidth * 0.9, window.innerHeight * 0.78, 560));
    setSize(s);
    const pages = flipContainerRef.querySelectorAll(".chronicle-page") as NodeListOf<HTMLElement>;
    pages.forEach((p) => { p.style.width = `${s}px`; p.style.height = `${s}px`; });
    // Only build the flip book when there's more than one page to turn.
    if (slideCount() > 1) {
      pageFlip = new PageFlip(flipContainerRef, {
        width: s,
        height: s,
        showCover: false,
        maxShadowOpacity: 0.4,
        mobileScrollSupport: false,
        flippingTime: 900,
        useMouseEvents: false,
        drawShadow: true,
        autoSize: false,
        startZIndex: 10,
      } as any);
      pageFlip.loadFromHTML(Array.from(pages));
    }
  });

  onCleanup(() => pageFlip?.destroy());

  // Dismiss = fold the whole book down into the sidebar Chronicle link, so the
  // player sees where the entry lives. Falls back to a plain close if the link
  // isn't on screen.
  const handleDismiss = () => {
    if (folding()) return;
    const card = foldRef;
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
    playSound("nav");
    card.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.5s ease-in";
    card.style.transformOrigin = "center center";
    requestAnimationFrame(() => {
      card.style.transform = `translate(${dx}px, ${dy}px) scale(0.06)`;
      card.style.opacity = "0";
    });
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
        ref={foldRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          gap: "16px",
        }}
      >
        {/* Book — a fixed square page (or a PageFlip book of several) on parchment. */}
        <div style={{ position: "relative", width: `${size()}px`, height: `${size()}px` }}>
          <button
            onClick={handleDismiss}
            style={{
              position: "absolute", top: "12px", right: "16px", "z-index": 200,
              background: "transparent", border: "none",
              color: INK_SOFT, "font-size": "1.4rem",
              cursor: "pointer", "line-height": "1",
            }}
            aria-label="Close"
          >
            ×
          </button>
          <div ref={flipContainerRef} style={{ position: "absolute", inset: 0 }}>
            <For each={slides()}>
              {(paras, i) => (
                <div
                  class="chronicle-page"
                  style={{
                    width: `${size()}px`, height: `${size()}px`,
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {/* Parchment as an <img>, not a CSS background — PageFlip
                      re-parents the page elements and drops background-image,
                      so it must be a real child (same as the cinematic). */}
                  <img src={parchmentSrc} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", "object-fit": "cover" }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    "z-index": 1,
                    padding: "44px 48px",
                    overflow: "auto",
                    display: "flex", "flex-direction": "column",
                  }}>
                    <div class="section-label" style={{ "font-size": "0.7rem", color: INK_SOFT, "letter-spacing": "0.08em" }}>
                      {slideCount() > 1 ? `Page ${i() + 1} of ${slideCount()}` : `Page ${props.entry.order}`}
                    </div>
                    <Show when={i() === 0}>
                      <h2 style={{
                        "font-size": "1.35rem", color: INK_STRONG,
                        "margin-bottom": "18px", "font-family": "var(--font-heading)",
                      }}>
                        {props.entry.title}
                      </h2>
                    </Show>
                    <div style={{ "font-size": "0.95rem", color: INK, "font-style": "italic", "line-height": "1.7" }}>
                      <For each={paras}>
                        {(p) => <p style={{ "margin-bottom": "14px" }}>{p}</p>}
                      </For>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Controls — below the book, on the backdrop (like the cinematic). */}
        <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
          <Show when={props.entry.cinematicId === "intro"}>
            <button
              style={{
                padding: "8px 14px", background: "rgba(167, 139, 250, 0.15)",
                border: "1px solid rgba(167, 139, 250, 0.4)", color: "#e8dcc0",
                "border-radius": "6px", cursor: "pointer", "font-size": "0.85rem",
              }}
              onClick={() => alert("Replay cinematic: " + props.entry.cinematicId + " (not wired yet)")}
            >
              ▶ Replay cinematic
            </button>
          </Show>
          <Show when={slideCount() > 1}>
            <button
              onClick={back}
              disabled={slide() === 0}
              style={{
                padding: "8px 14px", background: "rgba(20, 14, 6, 0.5)",
                border: `1px solid ${INK_SOFT}`, color: "#e8dcc0",
                "border-radius": "6px", cursor: slide() === 0 ? "default" : "pointer",
                opacity: slide() === 0 ? "0.35" : "1", "font-size": "0.85rem",
              }}
            >
              ← Back
            </button>
            <div style={{ display: "flex", gap: "6px", "align-items": "center" }}>
              <For each={slides()}>
                {(_, i) => (
                  <span style={{
                    width: "7px", height: "7px", "border-radius": "50%",
                    background: i() === slide() ? "#d8c79c" : "rgba(216, 199, 156, 0.35)",
                    transition: "background 0.2s ease",
                  }} />
                )}
              </For>
            </div>
          </Show>
          <button
            onClick={() => (isLast() ? handleDismiss() : next())}
            style={{
              padding: "9px 18px",
              background: isLast() ? "rgba(20, 14, 6, 0.5)" : "#5f4a2a",
              border: `1px solid ${isLast() ? INK_SOFT : "#5f4a2a"}`,
              color: isLast() ? "#e8dcc0" : "#f3ead4",
              "border-radius": "6px", cursor: "pointer", "font-size": "0.85rem",
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
