import { createSignal, For, Show } from "solid-js";
import type { CompletedMission } from "@medieval-realm/shared/data/missions";
import { formatReward, getMission } from "@medieval-realm/shared/data/missions";
import { STORY_CINEMATICS } from "~/data/cinematics";

interface Props {
  result: CompletedMission;
  /** Optional override for the title — used by co-op to show the friend's name. */
  subtitle?: string;
  /** Called when the player accepts — this is when rewards should be applied by the caller. */
  onConfirm: () => void;
  onClose: () => void;
}

/** Exit animation duration — keep in sync with .loot-card.exiting in global.css.
 *  Used to delay the parent's close callback until the reverse animation has
 *  played, so the modal doesn't just vanish. */
const EXIT_ANIMATION_MS = 240;

export default function LootModal(props: Props) {
  const template = () => getMission(props.result.missionId) ?? { name: props.result.missionId, icon: "📜" };
  const hasRewards = () => props.result.rewards.length > 0;
  const hasStoryCinematic = () => !!STORY_CINEMATICS[props.result.missionId];

  const [logExpanded, setLogExpanded] = createSignal(false);
  // Suppress the card's scrollbar during the entry animation — content briefly
  // reflows as sections/chips settle, which otherwise flashes a scrollbar on
  // the right even when final content fits. Enabled after the animation ends.
  const [settled, setSettled] = createSignal(false);
  setTimeout(() => setSettled(true), 1200);

  // Exit animation state. When set, the backdrop/card play their reverse
  // animations; once that finishes we call the parent's close handler.
  const [exiting, setExiting] = createSignal(false);
  /** Play the exit animation then invoke the parent handler. `kind` picks
   *  which handler (close = just dismiss; confirm = apply rewards). Re-entrant
   *  calls short-circuit so double-clicks don't fire the handler twice. */
  const dismissWith = (kind: "close" | "confirm") => {
    if (exiting()) return;
    setExiting(true);
    setTimeout(() => {
      if (kind === "confirm") props.onConfirm();
      else props.onClose();
    }, EXIT_ANIMATION_MS);
  };

  const r = () => props.result;

  return (
    <div
      class="loot-backdrop"
      classList={{ exiting: exiting() }}
      onClick={() => dismissWith("close")}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        "z-index": 1000,
        display: "flex", "align-items": "center", "justify-content": "center",
        padding: "20px",
        overflow: "hidden", // prevent animation transforms from triggering page/backdrop scroll
      }}
    >
      <div
        class="loot-card"
        classList={{ exiting: exiting() }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-secondary)",
          border: `2px solid ${r().success ? "var(--accent-green)" : "var(--accent-red)"}`,
          "border-radius": "10px",
          "max-width": "560px",
          width: "100%",
          "max-height": "85vh",
          "overflow-y": settled() ? "auto" : "hidden",
          "overflow-x": "hidden",
          "box-shadow": "0 10px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header */}
        <div class="loot-section" style={{
          padding: "16px 20px",
          background: r().success ? "rgba(46, 204, 113, 0.1)" : "rgba(231, 76, 60, 0.1)",
          "border-bottom": `1px solid ${r().success ? "var(--accent-green)" : "var(--accent-red)"}`,
          "animation-delay": "100ms",
        }}>
          <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
            <span style={{ "font-size": "2rem" }}>{template().icon}</span>
            <div>
              <div style={{
                "font-size": "0.8rem",
                "text-transform": "uppercase",
                "letter-spacing": "1px",
                color: r().success ? "var(--accent-green)" : "var(--accent-red)",
                "font-weight": "bold",
              }}>
                {r().success ? "Success" : "Failed"}
              </div>
              <div style={{ "font-family": "var(--font-heading)", "font-size": "1.3rem", color: "var(--text-primary)" }}>
                {template().name}
              </div>
              <Show when={props.subtitle}>
                <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>{props.subtitle}</div>
              </Show>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", display: "flex", "flex-direction": "column", gap: "14px" }}>
          {/* Rewards */}
          <Show when={hasRewards()} fallback={
            <div class="loot-section" style={{
              color: "var(--text-muted)", "font-style": "italic", "font-size": "0.9rem",
              "animation-delay": "180ms",
            }}>
              No loot recovered.
            </div>
          }>
            <div class="loot-section" style={{ "animation-delay": "180ms" }}>
              <div style={{
                "font-size": "0.75rem", "text-transform": "uppercase", "letter-spacing": "1px",
                color: "var(--text-muted)", "margin-bottom": "6px",
              }}>
                Loot
              </div>
              <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                <For each={r().rewards}>
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
                      {formatReward(reward)}
                    </span>
                  )}
                </For>
                <Show when={!r().success && r().rewards.length > 0}>
                  <span style={{ "font-size": "0.75rem", color: "var(--accent-purple)", "align-self": "center" }}>
                    (assassin salvage)
                  </span>
                </Show>
              </div>
            </div>
          </Show>

          {/* XP & level/rank ups */}
          <Show when={r().xpGained > 0 || r().levelUps.length > 0 || r().rankUps.length > 0}>
            <div class="loot-section" style={{ "animation-delay": "540ms" }}>
              <div style={{
                "font-size": "0.75rem", "text-transform": "uppercase", "letter-spacing": "1px",
                color: "var(--text-muted)", "margin-bottom": "6px",
              }}>
                Experience
              </div>
              <div style={{ display: "flex", "flex-direction": "column", gap: "4px", "font-size": "0.88rem" }}>
                <Show when={r().xpGained > 0}>
                  <div style={{ color: "var(--text-secondary)" }}>+{r().xpGained} XP gained</div>
                </Show>
                <Show when={r().levelUps.length > 0}>
                  <div style={{ color: "var(--accent-blue)" }}>
                    Level up: <strong>{r().levelUps.join(", ")}</strong>
                  </div>
                </Show>
                <Show when={r().rankUps.length > 0}>
                  <div style={{ color: "var(--accent-gold)" }}>
                    Rank up: <strong>{r().rankUps.map((rk) => `${rk.name} → ${rk.newRank}`).join(", ")}</strong>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* Casualties & revives */}
          <Show when={r().casualties.length > 0 || r().revived.length > 0}>
            <div class="loot-section" style={{ "animation-delay": "640ms" }}>
              <div style={{
                "font-size": "0.75rem", "text-transform": "uppercase", "letter-spacing": "1px",
                color: "var(--text-muted)", "margin-bottom": "6px",
              }}>
                Casualties
              </div>
              <div style={{ display: "flex", "flex-direction": "column", gap: "4px", "font-size": "0.88rem" }}>
                <Show when={r().casualties.length > 0}>
                  <div style={{ color: "var(--accent-red)" }}>
                    🪦 Fallen: <strong>{r().casualties.join(", ")}</strong>
                  </div>
                </Show>
                <Show when={r().revived.length > 0}>
                  <div style={{ color: "#9b59b6" }}>
                    ✨ Revived by priest: <strong>{r().revived.length}</strong>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* Combat summary */}
          <Show when={r().combatRounds}>
            <div class="loot-section" style={{
              "font-size": "0.85rem", color: "var(--text-muted)", "animation-delay": "720ms",
            }}>
              {r().combatVictory ? "⚔️ Victory" : "💀 Defeated"} in {r().combatRounds} rounds
              <Show when={r().combatLog?.length}>
                {" · "}
                <button
                  onClick={() => setLogExpanded(!logExpanded())}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--accent-blue)", "font-size": "0.85rem",
                    padding: 0, "text-decoration": "underline",
                  }}
                >
                  {logExpanded() ? "Hide combat log" : "Show combat log"}
                </button>
              </Show>
            </div>
            <Show when={logExpanded() && r().combatLog}>
              <div style={{
                padding: "8px 10px",
                background: "rgba(0, 0, 0, 0.3)",
                "border-radius": "4px",
                "max-height": "240px",
                overflow: "auto",
                "font-size": "0.75rem",
                "line-height": "1.6",
              }}>
                {(() => {
                  let lastRound = 0;
                  return r().combatLog!.map((entry) => {
                    const showRound = entry.round !== lastRound;
                    lastRound = entry.round;
                    return (
                      <>
                        {showRound && (
                          <div style={{ color: "var(--text-muted)", "font-weight": "bold", "margin-top": entry.round > 1 ? "4px" : "0" }}>
                            Round {entry.round}
                          </div>
                        )}
                        <div style={{ color: entry.isEnemy ? "var(--accent-red)" : "var(--text-secondary)" }}>
                          {entry.attackerIcon} <strong>{entry.attackerName}</strong>
                          {entry.targetName && <> → <strong>{entry.targetName}</strong></>}
                          {entry.damage != null && <> · <span style={{ color: "var(--accent-gold)" }}>{entry.damage} dmg</span></>}
                          {entry.killed && <span style={{ color: "var(--accent-red)" }}> (killed)</span>}
                        </div>
                      </>
                    );
                  });
                })()}
              </div>
            </Show>
          </Show>
        </div>

        {/* Footer */}
        <div class="loot-section" style={{
          padding: "14px 20px",
          "border-top": "1px solid var(--border-color)",
          display: "flex", "justify-content": "flex-end", gap: "8px",
          "animation-delay": "800ms",
        }}>
          <button
            onClick={() => dismissWith("confirm")}
            class="upgrade-btn"
            style={{ padding: "8px 20px", "font-size": "0.95rem" }}
          >
            {hasRewards()
              ? (hasStoryCinematic() ? "Claim & Continue Story" : "Claim rewards")
              : "Dismiss"}
          </button>
        </div>
      </div>
    </div>
  );
}
