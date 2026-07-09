import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import {
  CHRONICLE_CHAPTERS,
  CHRONICLE_ENTRIES,
  getEntriesByChapter,
} from "~/data/chronicle_entries";
import ChronicleEntryModal from "~/components/ChronicleEntryModal";
import Tooltip from "~/components/Tooltip";
import { playPageMountSound } from "~/engine/sounds";

export default function ChronicleJournal() {
  const { state, actions } = useGame();
  const [openEntryId, setOpenEntryId] = createSignal<string | null>(null);
  const [dismissedFresh, setDismissedFresh] = createSignal(new Set<string>());
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
    playPageMountSound("page_turn");
    // Per-entry hover marks each entry seen individually (see onMouseEnter
    // below). The page-level visit no longer mass-clears the sidebar badge,
    // so entries the player skips past stay unseen until they actually look.
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
                "border-radius": "0",
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
                // Equal-height cards across ALL rows (not just within a row):
                // every implicit row is 1fr, and the content floor lifts them
                // all to the tallest card's height.
                "grid-auto-rows": "1fr",
                gap: "12px",
              }}>
                <For each={entries()}>
                  {(entry) => {
                    const unlocked = () => isFired(entry.id);
                    const fresh = () => unlocked() && isFresh(entry.id) && !dismissedFresh().has(entry.id);
                    const dismissFresh = () => {
                      if (!fresh()) return;
                      setDismissedFresh((prev) => {
                        if (prev.has(entry.id)) return prev;
                        const next = new Set(prev);
                        next.add(entry.id);
                        return next;
                      });
                      // Per-entry seen marker — drops the sidebar badge by one.
                      actions.markChronicleEntrySeen(entry.id);
                    };
                    const cardOnClick = () => {
                      if (!unlocked()) return;
                      setOpenEntryId(entry.id);
                      dismissFresh();
                    };
                    const card = (
                      <div
                        id={`chronicle-entry-${entry.id}`}
                        class="building-card"
                        classList={{ "chronicle-entry-card": unlocked(), dimmed: !unlocked(), "ornament-frame": true, "ornament-frame--common": !unlocked() }}
                        style={{
                          cursor: unlocked() ? "pointer" : "default",
                          transition: "transform 0.15s, filter 0.15s, border-color 0.25s, box-shadow 0.25s, background 0.25s",
                          // Fresh highlight uses box-shadow + tint only (no
                          // `border`, which would override the ornament frame's
                          // border-width and kill the frame).
                          ...(fresh()
                            ? {
                                "box-shadow": "0 0 0 1px var(--accent-blue), 0 0 12px rgba(96, 165, 250, 0.25)",
                                background: "rgba(96, 165, 250, 0.06)",
                              }
                            : {}),
                        }}
                        onMouseEnter={dismissFresh}
                        onClick={cardOnClick}
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
                    return unlocked() ? (
                      <Tooltip text="Click to read" position="cursor-top" block>
                        {card}
                      </Tooltip>
                    ) : card;
                  }}
                </For>
              </div>
            </div>
          );
        }}
      </For>

      {/* Entry modal */}
      <Show when={openEntry()}>
        {(entry) => <ChronicleEntryModal entry={entry()} onClose={() => setOpenEntryId(null)} />}
      </Show>
    </div>
  );
}
