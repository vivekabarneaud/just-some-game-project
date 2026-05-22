import { createSignal, For, Show, onMount } from "solid-js";
import type { QuestDefinition } from "~/data/quests";
import { getChronicleEntry, type ChronicleEntry } from "~/data/chronicle_entries";
import { resolveFragments, type BioFragment, type FoundingCharacter } from "~/data/founding_characters";
import { playSound } from "~/engine/sounds";
import UnlockCard from "~/components/UnlockCard";
import ChronicleEntryModal from "~/components/ChronicleEntryModal";
import MemoryPreviewModal from "~/components/MemoryPreviewModal";

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
  onMount(() => playSound("notify"));
  const [exiting, setExiting] = createSignal(false);
  const [previewEntry, setPreviewEntry] = createSignal<ChronicleEntry | null>(null);
  const [previewMemory, setPreviewMemory] = createSignal<{ character: FoundingCharacter; fragment: BioFragment } | null>(null);
  const dismissWith = (kind: "close" | "claim") => {
    if (exiting()) return;
    setExiting(true);
    setTimeout(() => {
      if (kind === "claim") props.onClaim();
      else props.onClose();
    }, EXIT_ANIMATION_MS);
  };

  /** First paragraph of a memory fragment, used as the card teaser. */
  const fragmentTeaser = (text: string) => text.split("\n\n")[0] ?? text;
  const unlockedMemories = () => resolveFragments(props.quest.unlocksBioFragments ?? []);

  return (
    <>
    <div
      class="loot-backdrop modal-overlay"
      classList={{ exiting: exiting() }}
      onClick={() => dismissWith("close")}
      style={{ overflow: "hidden" }}
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
              <div class="section-label" style={{ color: "var(--accent-gold)", "margin-bottom": "0" }}>
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
            <div class="section-label">
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

          {/* New journal entry — clickable, opens preview */}
          <Show when={props.quest.chronicleEntryId ? getChronicleEntry(props.quest.chronicleEntryId) : null}>
            {(entry) => (
              <UnlockCard
                image={{ kind: "icon", emoji: "📖" }}
                label="New journal entry"
                title={entry().title}
                teaser={entry().teaser}
                onClick={() => setPreviewEntry(entry())}
                animationDelay="380ms"
              />
            )}
          </Show>

          {/* New memory notes — one card per unlocked fragment */}
          <For each={unlockedMemories()}>
            {(item, i) => (
              <UnlockCard
                image={{ kind: "portrait", src: item.character.portrait, alt: item.character.name }}
                label="New memory"
                title={item.character.name}
                teaser={fragmentTeaser(item.fragment.text)}
                onClick={() => setPreviewMemory(item)}
                animationDelay={`${460 + i() * 80}ms`}
              />
            )}
          </For>
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

    {/* Nested preview modals. Mounting them as siblings of the loot-backdrop
        so they overlay it via their own modal-overlay (z-index 1100). */}
    <Show when={previewEntry()}>
      {(entry) => <ChronicleEntryModal entry={entry()} onClose={() => setPreviewEntry(null)} />}
    </Show>
    <Show when={previewMemory()}>
      {(item) => (
        <MemoryPreviewModal
          character={item().character}
          fragment={item().fragment}
          onClose={() => setPreviewMemory(null)}
        />
      )}
    </Show>
    </>
  );
}
