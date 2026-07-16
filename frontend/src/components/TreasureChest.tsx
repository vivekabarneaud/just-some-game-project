import { createSignal, For, Show } from "solid-js";
import { playSound } from "~/engine/sounds";

interface Props {
  /** Pre-formatted reward labels to reveal. The chest knows nothing about the
   *  mission system on purpose, so expedition treasure can reuse it verbatim
   *  with its own labels (and, later, per-item colours). */
  labels: string[];
  /** Optional note under the chips (e.g. the assassin's partial-salvage tag). */
  note?: string;
  /** Fired once, the moment the player opens the chest. */
  onOpened?: () => void;
}

/** A closed chest the player clicks to reveal loot. Pure presentation: the loot
 *  is already rolled and fixed before this mounts (see LootModal). The click is
 *  the reveal beat, not the roll. */
export default function TreasureChest(props: Props) {
  const [opened, setOpened] = createSignal(false);
  const open = () => {
    if (opened()) return;
    setOpened(true);
    playSound("coins");
    props.onOpened?.();
  };

  return (
    <div class="treasure-chest">
      <div
        class="tc-stage"
        classList={{ "tc-closed": !opened() }}
        onClick={() => !opened() && open()}
        role="button"
        tabindex={opened() ? -1 : 0}
        aria-label={opened() ? "Chest opened" : "Open the chest"}
        onKeyDown={(e) => {
          if (!opened() && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            open();
          }
        }}
      >
        <div class="tc-glow" classList={{ opened: opened() }} />
        <div class="tc-figure">
          <div class="tc-lid" classList={{ opened: opened() }}>
            <div class="tc-strap" />
          </div>
          <div class="tc-body">
            <div class="tc-strap" />
            <div class="tc-lock" />
          </div>
        </div>
      </div>

      <Show
        when={opened()}
        fallback={<div class="tc-hint">Open the chest</div>}
      >
        <div class="tc-loot">
          <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap", "justify-content": "center" }}>
            <For each={props.labels}>
              {(label, i) => (
                <span
                  class="loot-chip"
                  style={{
                    padding: "6px 12px",
                    background: "rgba(212, 175, 55, 0.12)",
                    border: "1px solid var(--accent-gold)",
                    "border-radius": "4px",
                    color: "var(--accent-gold)",
                    "font-size": "0.9rem",
                    "font-weight": "600",
                    "animation-delay": `${i() * 70}ms`,
                  }}
                >
                  {label}
                </span>
              )}
            </For>
          </div>
          <Show when={props.note}>
            <div style={{ "font-size": "0.75rem", color: "var(--accent-purple)", "text-align": "center", "margin-top": "6px" }}>
              {props.note}
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
