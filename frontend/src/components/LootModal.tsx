import { createSignal, For, Show, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { playSound } from "~/engine/sounds";
import type { CompletedMission } from "@medieval-realm/shared/data/missions";
import { formatReward, getMission } from "@medieval-realm/shared/data/missions";
import { getEnemy } from "@medieval-realm/shared/data/enemies";
import { getItem } from "@medieval-realm/shared/data/items";
import type { LootResult } from "@medieval-realm/shared/data/combat";
import { STORY_CINEMATICS } from "~/data/cinematics";
import CombatLog from "~/components/CombatLog";
import CombatPlayback from "~/components/CombatPlayback";
import EnemyCard from "~/components/EnemyCard";
import TreasureChest from "~/components/TreasureChest";
import { CardFrame } from "~/components/CardFrame";
import { missionFrameAssets } from "~/data/constants";
import MissionRosterStrip from "~/components/MissionRosterStrip";

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
  onMount(() => playSound("notify"));
  // NOTE: the story-mission chronicle entry is intentionally NOT opened here.
  // It fires after the player clicks "Claim & Continue Story" — the LootModal
  // closes, then AdventurersGuild opens the ChronicleEntryModal (its after-claim
  // handler, guarded by chronicleEntriesSeen). This keeps the narrative beat as
  // a deliberate "continue" step rather than popping over the unclaimed loot.
  const template = () => getMission(props.result.missionId) ?? { name: props.result.missionId, icon: "📜" };
  const hasRewards = () => props.result.rewards.length > 0;
  // Enemy loot (the chest's surprise) is separate from the known mission pay.
  const hasLoot = () => (props.result.loot?.length ?? 0) > 0;
  const formatLoot = (l: LootResult): string => {
    if (l.type === "item" && l.itemId) {
      const it = getItem(l.itemId);
      return it ? `${it.icon} ${l.amount} ${it.name}` : `${l.amount} ${l.itemId}`;
    }
    return formatReward({ resource: l.resource as any, amount: l.amount });
  };
  // Outcome is three-way under Model C: success / retreated (broke off, came
  // home wounded) / failed (wiped). Retreat reads amber, not the wipe red.
  const retreated = () => !props.result.success && !!props.result.retreated;
  const outcomeColor = () => props.result.success ? "var(--accent-green)" : retreated() ? "#d4831a" : "var(--accent-red)";
  const outcomeTint = () => props.result.success ? "rgba(46, 204, 113, 0.1)" : retreated() ? "rgba(212, 131, 26, 0.12)" : "rgba(231, 76, 60, 0.1)";
  const outcomeLabel = () => props.result.success ? "Success" : retreated() ? "Retreated" : "Failed";
  const hasStoryCinematic = () => !!STORY_CINEMATICS[props.result.missionId];
  // The story-mission chronicle entry is opened by AdventurersGuild after the
  // player claims (see its after-claim handler), not from inside this modal.

  const [logExpanded, setLogExpanded] = createSignal(false);
  const [showPlayback, setShowPlayback] = createSignal(false);
  // The loot arrives as a closed chest the player opens. The roll already
  // happened at mission completion; this is just the reveal beat. Claim stays
  // gated until it's open so the reward is always seen, never skipped.
  const [chestOpened, setChestOpened] = createSignal(false);
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
  // The modal wears the mission's RANK frame (matching the team-assembly panel):
  // novice=common … veteran=epic, story=legendary, with flourishes on the higher
  // ranks. Falls back to common for an unknown mission.
  const frame = () => {
    const m = getMission(props.result.missionId);
    return m ? missionFrameAssets(m) : { rarity: "common", frameUrl: "/images/frames/item_frame_common.png", slice: 34, ornamentV: undefined, ornamentH: undefined };
  };

  return (
    <>
    <div
      class="loot-backdrop modal-overlay"
      classList={{ exiting: exiting() }}
      onClick={() => dismissWith("close")}
      style={{ overflow: "hidden" }}
    >
      {/* Non-scrolling wrapper carries the difficulty frame overlay; the card
          inside scrolls beneath it (an inset frame would otherwise scroll away). */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          "max-width": "560px",
          width: "100%",
          "box-shadow": "0 10px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
      <div
        class="loot-card"
        classList={{ exiting: exiting() }}
        style={{
          background: "var(--bg-secondary)",
          "border-radius": "0",
          "max-height": "85vh",
          "overflow-y": settled() ? "auto" : "hidden",
          "overflow-x": "hidden",
        }}
      >
        {/* Header */}
        <div class="loot-section" style={{
          padding: "16px 20px",
          background: outcomeTint(),
          "border-bottom": `1px solid ${outcomeColor()}`,
          "animation-delay": "100ms",
        }}>
          <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
            <span style={{ "font-size": "2rem" }}>{template().icon}</span>
            <div>
              <div class="section-label" style={{
                "font-size": "0.8rem",
                color: outcomeColor(),
                "margin-bottom": "0",
              }}>
                {outcomeLabel()}
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
          {/* Rewards — the known, upfront mission pay. Shown plainly (the player
              already knew these going in, so they aren't the chest's surprise). */}
          <Show when={hasRewards()}>
            <div class="loot-section" style={{ "animation-delay": "180ms" }}>
              <div class="section-label">
                Rewards{!r().success ? " · assassin salvage" : ""}
              </div>
              <div style={{ display: "flex", "flex-wrap": "wrap", gap: "10px 16px", "font-size": "0.95rem", color: "var(--text-primary)" }}>
                <For each={r().rewards}>
                  {(rw) => <span>{formatReward(rw)}</span>}
                </For>
              </div>
            </div>
          </Show>

          {/* Loot — the surprise: what the team pulled off the enemies. This is
              the chest, and claim stays gated until it's opened. */}
          <Show when={hasLoot()}>
            <div class="loot-section" style={{ "animation-delay": "220ms" }}>
              <div class="section-label">Your team brought back extra loot!</div>
              <TreasureChest
                labels={r().loot!.map(formatLoot)}
                onOpened={() => setChestOpened(true)}
              />
            </div>
          </Show>

          <Show when={!hasRewards() && !hasLoot()}>
            <div class="loot-section" style={{
              color: "var(--text-muted)", "font-style": "italic", "font-size": "0.9rem",
              "animation-delay": "180ms",
            }}>
              No loot recovered.
            </div>
          </Show>

          {/* The team — how they came home. Portrait + HP drain + XP fill,
              below the chest per the reveal order (loot, then the people). */}
          <Show when={r().roster?.length}>
            <div class="loot-section" style={{ "animation-delay": "260ms" }}>
              <div class="section-label">The team</div>
              <MissionRosterStrip roster={r().roster!} />
            </div>
          </Show>

          {/* The chronicle entry now fires directly on top of this modal (see
              onMount), so it no longer shows as a card here. It stays available
              in the Chronicle journal afterwards. */}

          {/* XP & level/rank ups */}
          <Show when={r().xpGained > 0 || r().levelUps.length > 0 || r().rankUps.length > 0}>
            <div class="loot-section" style={{ "animation-delay": "540ms" }}>
              <div class="section-label">
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
              <div class="section-label">
                Casualties
              </div>
              <div style={{ display: "flex", "flex-direction": "column", gap: "4px", "font-size": "0.88rem" }}>
                <Show when={r().casualties.length > 0}>
                  <div style={{ color: "var(--accent-red)" }}>
                    🪦 Fallen: <strong>{r().casualties.join(", ")}</strong>
                  </div>
                  <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "font-style": "italic" }}>
                    {r().casualties.length === 1 ? "They have" : "They have"} been laid to rest.{" "}
                    <A href="/shrine" style={{ color: "var(--accent-gold)" }}>
                      Visit the shrine →
                    </A>
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

          {/* New foes faced — the reveal payoff for the "???" cards. Only genuine
              surprises land here (reputation-known foes were never hidden). */}
          <Show when={r().revealedEnemies?.length}>
            <div class="loot-section" style={{ "animation-delay": "700ms" }}>
              <div class="section-label">New foes faced</div>
              <div style={{ display: "flex", gap: "10px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
                <For each={r().revealedEnemies}>
                  {(id) => {
                    const enemy = getEnemy(id);
                    return enemy ? (
                      <div style={{ display: "flex", "flex-direction": "column", "align-items": "center", gap: "3px" }}>
                        <EnemyCard enemy={enemy} reveal="full" />
                        <div style={{
                          "font-size": "0.62rem", "font-style": "italic", "text-align": "center",
                          color: enemy.boss ? "var(--accent-gold)" : "var(--text-muted)",
                        }}>
                          {enemy.boss ? "A foe you won't forget" : "new · in the Bestiary"}
                        </div>
                      </div>
                    ) : null;
                  }}
                </For>
              </div>
              <div style={{ "font-size": "0.72rem", "margin-top": "6px" }}>
                <A href="/chronicle" style={{ color: "var(--accent-gold)" }}>Find them in the Chronicle's Bestiary →</A>
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
                  class="btn-secondary"
                  onClick={() => setShowPlayback(true)}
                  style={{ "font-size": "0.85rem" }}
                >
                  ▶ Watch combat
                </button>
                {" · "}
                <button
                  onClick={() => setLogExpanded(!logExpanded())}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--accent-blue)", "font-size": "0.85rem",
                    padding: 0, "text-decoration": "underline",
                  }}
                >
                  {logExpanded() ? "Hide log" : "Show log"}
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
              }}>
                <CombatLog log={r().combatLog!} />
              </div>
            </Show>
            <Show when={showPlayback() && r().combatLog?.length}>
              <CombatPlayback
                log={r().combatLog!}
                title={template().name}
                victory={r().combatVictory}
                onClose={() => setShowPlayback(false)}
              />
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
            disabled={hasLoot() && !chestOpened()}
            style={{
              padding: "8px 20px",
              "font-size": "0.95rem",
              opacity: hasLoot() && !chestOpened() ? 0.5 : 1,
              cursor: hasLoot() && !chestOpened() ? "not-allowed" : "pointer",
            }}
          >
            {!hasRewards() && !hasLoot()
              ? (r().casualties.length > 0 ? "Close" : "Dismiss")
              : hasLoot() && !chestOpened()
              ? "Open the chest first"
              : (hasStoryCinematic() ? "Claim & Continue Story" : "Claim rewards")}
          </button>
        </div>
      </div>
      {/* Rank frame — drawn over the card edges; flourishes on higher ranks. */}
      <CardFrame rarity={frame().rarity} border={20} />
      </div>
    </div>
    </>
  );
}
