import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import {
  CHRONICLE_CHAPTERS,
  CHRONICLE_ENTRIES,
  getEntriesByChapter,
  type ChronicleEntry,
} from "~/data/chronicle_entries";

export default function ChronicleJournal() {
  const { state, actions } = useGame();
  const [openEntryId, setOpenEntryId] = createSignal<string | null>(null);
  const [searchParams] = useSearchParams();

  // Snapshot of entries that were unseen when this page was mounted. Drives the
  // light-blue "new" highlight on entry cards. Does not update while the page
  // is open — the next visit will find these marked seen and skip the highlight.
  const freshOnMount = new Set<string>();
  {
    const firedAtMount = state.chronicleEntriesFired ?? [];
    const seenAtMount = new Set(state.chronicleEntriesSeen ?? []);
    for (const id of firedAtMount) {
      if (!seenAtMount.has(id)) freshOnMount.add(id);
    }
  }
  const isFresh = (id: string) => freshOnMount.has(id);

  onMount(() => {
    // Now mark everything seen — clears the sidebar pulse for next time.
    actions.visitChronicleJournal();
    // Auto-scroll to the targeted entry if ?entry=<id> was passed in the URL
    const targetId = typeof searchParams.entry === "string" ? searchParams.entry : undefined;
    if (targetId) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`chronicle-entry-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  });

  const fired = createMemo(() => new Set(state.chronicleEntriesFired ?? []));
  const isFired = (id: string) => fired().has(id);

  const totalCount = CHRONICLE_ENTRIES.length;
  const firedCount = () => CHRONICLE_ENTRIES.filter((e) => fired().has(e.id)).length;

  const openEntry = () =>
    openEntryId() ? CHRONICLE_ENTRIES.find((e) => e.id === openEntryId()) ?? null : null;

  return (
    <div>
      <p style={{ color: "var(--text-muted)", "margin-bottom": "16px", "font-size": "0.85rem" }}>
        The Lord's journal. Pages appear as the story unfolds.
      </p>

      {/* Progress counter */}
      <div style={{
        display: "flex", gap: "12px", "align-items": "center", "margin-bottom": "20px",
      }}>
        <div style={{
          padding: "6px 12px",
          background: "rgba(167, 139, 250, 0.1)",
          border: "1px solid rgba(167, 139, 250, 0.3)",
          "border-radius": "6px",
          "font-size": "0.85rem",
          color: "var(--text-secondary)",
        }}>
          📖 {firedCount()} / {totalCount} entries
        </div>
      </div>

      {/* Chapters */}
      <For each={CHRONICLE_CHAPTERS}>
        {(chapter) => {
          const entries = () => getEntriesByChapter(chapter.id);
          const chapterFired = () => entries().filter((e) => fired().has(e.id)).length;
          return (
            <div style={{ "margin-bottom": "28px" }}>
              {/* Chapter card */}
              <div style={{
                padding: "14px 18px",
                background: "rgba(212, 163, 115, 0.08)",
                border: "1px solid rgba(212, 163, 115, 0.25)",
                "border-radius": "8px",
                "margin-bottom": "14px",
              }}>
                <div style={{
                  "font-size": "0.75rem",
                  color: "var(--accent-gold)",
                  "letter-spacing": "0.08em",
                  "text-transform": "uppercase",
                  "margin-bottom": "4px",
                }}>
                  Chapter {chapter.number}
                </div>
                <h2 style={{
                  "font-size": "1.2rem",
                  color: "var(--text-primary)",
                  "margin-bottom": "6px",
                  "font-family": "var(--font-heading)",
                }}>
                  {chapter.title}
                </h2>
                <div style={{
                  "font-size": "0.85rem",
                  color: "var(--text-secondary)",
                  "font-style": "italic",
                  "line-height": "1.5",
                  "margin-bottom": "8px",
                }}>
                  {chapter.tagline}
                </div>
                <div style={{
                  "font-size": "0.75rem",
                  color: "var(--text-muted)",
                }}>
                  {chapterFired()} of {entries().length} pages
                </div>
              </div>

              {/* Entry grid */}
              <div style={{
                display: "grid",
                "grid-template-columns": "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "12px",
              }}>
                <For each={entries()}>
                  {(entry) => {
                    const unlocked = () => isFired(entry.id);
                    const fresh = () => unlocked() && isFresh(entry.id);
                    return (
                      <div
                        id={`chronicle-entry-${entry.id}`}
                        class="building-card"
                        style={{
                          opacity: unlocked() ? 1 : 0.55,
                          cursor: unlocked() ? "pointer" : "default",
                          transition: "transform 0.15s, opacity 0.15s",
                          ...(fresh()
                            ? {
                                border: "1px solid var(--accent-blue)",
                                "box-shadow": "0 0 0 1px var(--accent-blue), 0 0 12px rgba(96, 165, 250, 0.25)",
                                background: "rgba(96, 165, 250, 0.06)",
                              }
                            : {}),
                        }}
                        onClick={() => { if (unlocked()) setOpenEntryId(entry.id); }}
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
                          }}>
                            New
                          </div>
                        </Show>
                        <div style={{
                          "font-size": "0.7rem",
                          color: "var(--text-muted)",
                          "letter-spacing": "0.06em",
                          "text-transform": "uppercase",
                          "margin-bottom": "4px",
                        }}>
                          Page {entry.order}
                        </div>
                        <div class="building-card-title" style={{
                          "font-style": unlocked() ? "normal" : "italic",
                          color: unlocked() ? "var(--text-primary)" : "var(--text-muted)",
                          "margin-bottom": "6px",
                        }}>
                          {unlocked() ? entry.title : "???"}
                        </div>
                        <Show when={unlocked()} fallback={
                          <div style={{
                            "font-size": "0.75rem",
                            color: "var(--text-muted)",
                            "font-style": "italic",
                          }}>
                            Not yet written.
                          </div>
                        }>
                          <div style={{
                            "font-size": "0.8rem",
                            color: "var(--text-secondary)",
                            "font-style": "italic",
                            "line-height": "1.45",
                          }}>
                            {entry.teaser}
                          </div>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          );
        }}
      </For>

      {/* Entry modal */}
      <Show when={openEntry()}>
        {(entry) => <EntryModal entry={entry()} onClose={() => setOpenEntryId(null)} />}
      </Show>
    </div>
  );
}

// ─── Entry detail modal ───────────────────────────────────────────

function EntryModal(props: { entry: ChronicleEntry; onClose: () => void }) {
  const paragraphs = () => props.entry.fullText.split("\n\n");

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

        <div style={{
          "font-size": "0.7rem",
          color: "var(--accent-gold)",
          "letter-spacing": "0.08em",
          "text-transform": "uppercase",
          "margin-bottom": "6px",
        }}>
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

        <Show when={props.entry.cinematicId}>
          <div style={{ "margin-top": "20px", "padding-top": "16px", "border-top": "1px solid var(--border-color)" }}>
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
                // TODO: wire cinematic replay — depends on cinematicId routing
                alert("Replay cinematic: " + props.entry.cinematicId + " (not wired yet)");
              }}
            >
              ▶ Replay cinematic
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}
