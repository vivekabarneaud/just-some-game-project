import { createSignal, For, Show, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { playPageMountSound, playSound } from "~/engine/sounds";
import {
  QUEST_DEFINITIONS,
  STORYLINE_LABELS,
  STORYLINE_ICONS,
  isQuestActive,
  isQuestClaimed,
  isQuestClaimable,
  type QuestDefinition,
  type StorylineId,
} from "~/data/quests";
import QuestClaimModal from "~/components/QuestClaimModal";

const STORYLINE_ORDER: StorylineId[] = ["settlement", "guild", "story", "defense", "social"];
// Two-column desk layout: domestic (settlement + defense) on the left,
// outward + personal (guild + story + the folk) on the right. Lets the player
// see all storylines at a glance without giant card widths.
const LEFT_COLUMN: StorylineId[] = ["settlement", "defense"];
const RIGHT_COLUMN: StorylineId[] = ["guild", "story", "social"];

export default function QuestLog() {
  const { state, actions } = useGame();
  onMount(() => playPageMountSound("page_turn"));

  // Per-storyline collapse state
  const [collapsed, setCollapsed] = createSignal<Record<StorylineId, boolean>>({
    settlement: false,
    guild: false,
    story: false,
    defense: false,
    social: false,
  });
  const toggle = (id: StorylineId) =>
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const [showCompleted, setShowCompleted] = createSignal(false);
  // Quest in the claim modal — set when player clicks Claim on a card. The
  // modal renders rewards, chronicle entry, and memory unlocks, then applies
  // the actual reward when the player confirms.
  const [claimingQuest, setClaimingQuest] = createSignal<QuestDefinition | null>(null);

  const questsByStoryline = (id: StorylineId): QuestDefinition[] =>
    QUEST_DEFINITIONS.filter((q) => q.storyline === id);

  const activeQuests = (id: StorylineId): QuestDefinition[] =>
    questsByStoryline(id).filter((q) => isQuestActive(q, state));

  const completedQuests = (id: StorylineId): QuestDefinition[] =>
    questsByStoryline(id).filter((q) => isQuestClaimed(q, state));

  const chaptersForStoryline = (id: StorylineId): number[] => {
    const set = new Set<number>();
    for (const q of activeQuests(id)) set.add(q.chapter);
    return [...set].sort((a, b) => a - b);
  };

  const totalActive = () =>
    QUEST_DEFINITIONS.filter((q) => isQuestActive(q, state)).length;

  // One storyline pane (header + collapsible body of cards). Defined inside
  // the component so it closes over state, actions, and the collapse signal.
  // Solid handles closures over reactive signals fine; just make sure the
  // signal accesses happen *inside* the returned JSX, not at function-call time.
  const renderStorylinePane = (storylineId: StorylineId) => {
    const active = () => activeQuests(storylineId);
    const completed = () => completedQuests(storylineId);
    const isCollapsed = () => collapsed()[storylineId];
    const chapterState = () =>
      state.chapters?.find((c) => c.storyline === storylineId);

    return (
      <Show when={active().length > 0 || completed().length > 0}>
        <div style={{
          "background": "var(--bg-secondary)",
          "border": "1px solid var(--border-color)",
          "border-radius": "8px",
          "margin-bottom": "16px",
          "overflow": "hidden",
        }}>
          <button
            onClick={() => toggle(storylineId)}
            style={{
              "width": "100%",
              "display": "flex",
              "align-items": "center",
              "justify-content": "space-between",
              "padding": "12px 16px",
              "background": "var(--bg-tertiary)",
              "border": "none",
              "cursor": "pointer",
              "color": "var(--text-primary)",
              "font-family": "var(--font-heading)",
              "font-size": "1rem",
            }}
          >
            <span>
              {STORYLINE_ICONS[storylineId]} {STORYLINE_LABELS[storylineId]}
              <Show when={chapterState() && chapterState()!.current > 0}>
                <span style={{
                  "color": "var(--text-muted)",
                  "font-size": "0.85rem",
                  "margin-left": "8px",
                }}>
                  Chapter {chapterState()!.current}
                </span>
              </Show>
            </span>
            <span style={{
              "display": "flex", "gap": "8px", "align-items": "center",
            }}>
              <Show when={active().length > 0}>
                <span style={{
                  "padding": "2px 8px",
                  "border-radius": "10px",
                  "background": "var(--accent-blue)",
                  "color": "#fff",
                  "font-size": "0.75rem",
                }}>
                  {active().length} active
                </span>
              </Show>
              <span>{isCollapsed() ? "▸" : "▾"}</span>
            </span>
          </button>

          <Show when={!isCollapsed()}>
            <div style={{ "padding": "12px 16px" }}>
              <Show when={active().length === 0}>
                <p style={{ "color": "var(--text-muted)", "font-style": "italic" }}>
                  No active quests in this storyline.
                </p>
              </Show>
              <For each={active()}>
                {(quest) => {
                  const seen = () => state.questsClaimableSeen ?? [];
                  return (
                    <QuestCard
                      quest={quest}
                      claimable={isQuestClaimable(quest, state)}
                      isUnseen={!seen().includes(quest.id)}
                      onClaim={() => setClaimingQuest(quest)}
                      onSeen={() => actions.markQuestClaimableSeen(quest.id)}
                    />
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    );
  };

  return (
    <div>
      {/* Claim modal — opens when the player clicks Claim on a card. Applies
          the reward via actions.claimQuestReward only on confirm. */}
      <Show when={claimingQuest()}>
        {(q) => (
          <QuestClaimModal
            quest={q()}
            onClaim={() => {
              actions.claimQuestReward(q().id);
              setClaimingQuest(null);
            }}
            onClose={() => setClaimingQuest(null)}
          />
        )}
      </Show>

      <h1 class="page-title">📋 Quest Log</h1>

      <p style={{ "color": "var(--text-muted)", "margin-bottom": "16px" }}>
        {totalActive() === 0
          ? "All caught up. Nothing waiting for you."
          : `${totalActive()} quest${totalActive() === 1 ? "" : "s"} active across your storylines.`}
      </p>

      {/* Two-column desk layout. Each side stacks its storylines vertically.
          Falls back to a single column on narrow viewports via auto-fit. */}
      <div style={{
        "display": "grid",
        "grid-template-columns": "repeat(auto-fit, minmax(380px, 1fr))",
        "gap": "16px",
        "align-items": "start",
      }}>
        <div>
          <For each={LEFT_COLUMN}>
            {(storylineId) => renderStorylinePane(storylineId)}
          </For>
        </div>
        <div>
          <For each={RIGHT_COLUMN}>
            {(storylineId) => renderStorylinePane(storylineId)}
          </For>
        </div>
      </div>

      {/* Completed archive */}
      <Show when={QUEST_DEFINITIONS.some((q) => isQuestClaimed(q, state))}>
        <div style={{ "margin-top": "24px" }}>
          <button
            onClick={() => setShowCompleted(!showCompleted())}
            style={{
              "background": "none",
              "border": "none",
              "color": "var(--text-muted)",
              "cursor": "pointer",
              "font-family": "var(--font-heading)",
              "font-size": "0.9rem",
              "padding": "8px 0",
            }}
          >
            {showCompleted() ? "▾" : "▸"} Completed quests
          </button>
          <Show when={showCompleted()}>
            <div style={{
              "background": "var(--bg-tertiary)",
              "border-radius": "8px",
              "padding": "12px 16px",
              "margin-top": "8px",
            }}>
              <For each={STORYLINE_ORDER}>
                {(storylineId) => (
                  <Show when={completedQuests(storylineId).length > 0}>
                    <div style={{ "margin-bottom": "12px" }}>
                      <h3 style={{
                        "font-size": "0.9rem",
                        "color": "var(--text-muted)",
                        "margin": "8px 0 4px",
                      }}>
                        {STORYLINE_ICONS[storylineId]} {STORYLINE_LABELS[storylineId]}
                      </h3>
                      <For each={completedQuests(storylineId)}>
                        {(q) => (
                          <div style={{
                            "padding": "4px 0",
                            "color": "var(--text-muted)",
                            "font-size": "0.9rem",
                          }}>
                            ✓ {q.icon} {q.title}
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

function QuestCard(props: {
  quest: QuestDefinition;
  claimable: boolean;
  isUnseen?: boolean;
  onClaim: () => void;
  onSeen?: () => void;
}) {
  // Reward-less quests (the "The Folk" check-ins) are personal beats, not
  // transactions: the objective line itself becomes the button that opens the
  // memory, and we drop the reward badge + standalone Claim button.
  const isMemoryOnly = () => props.quest.rewards.length === 0;
  return (
    <div
      onMouseEnter={() => props.onSeen?.()}
      style={{
        "position": "relative",
        // Highlight when the card is freshly active (not yet hovered) OR ready
        // to claim. Unseen-only highlights fade on hover; claimable highlights
        // stay until the player actually claims the reward.
        "border": (props.isUnseen || props.claimable)
          ? "1px solid var(--accent-blue)"
          : "1px solid var(--border-color)",
        "border-radius": "6px",
        "margin-bottom": "10px",
        "background": (props.isUnseen || props.claimable)
          ? "rgba(96, 165, 250, 0.06)"
          : "var(--bg-primary)",
        "box-shadow": (props.isUnseen || props.claimable)
          ? "0 0 0 1px var(--accent-blue), 0 0 12px rgba(96, 165, 250, 0.25)"
          : "none",
        "transition": "background 0.25s, border-color 0.25s, box-shadow 0.25s",
        "overflow": "hidden",
      }}
    >
      {/* Background image — left-aligned, fades into the card. Same pattern
          as the incoming-raid card: absolute layer at z-index 0, content above. */}
      <Show when={props.quest.image}>
        <div style={{
          "position": "absolute",
          "top": 0, "left": 0, "bottom": 0,
          "width": "55%",
          "z-index": 0,
          "pointer-events": "none",
        }}>
          <img
            src={props.quest.image!}
            alt=""
            loading="lazy"
            style={{
              "width": "100%",
              "height": "100%",
              "object-fit": "cover",
              "opacity": 0.35,
              "-webkit-mask-image": "linear-gradient(to right, black 40%, transparent 100%)",
              "mask-image": "linear-gradient(to right, black 40%, transparent 100%)",
            }}
          />
        </div>
      </Show>

      <Show when={props.isUnseen || (props.claimable && !isMemoryOnly())}>
        <div style={{
          "position": "absolute",
          "top": "8px",
          "right": "10px",
          "font-size": "0.65rem",
          "letter-spacing": "0.08em",
          "text-transform": "uppercase",
          "color": "var(--accent-blue)",
          "font-weight": "bold",
          "z-index": 2,
        }}>
          {props.isUnseen ? "New" : "Claim"}
        </div>
      </Show>

      <div style={{
        "position": "relative",
        "z-index": 1,
        "padding": "12px",
        "display": "flex",
        "justify-content": "space-between",
        "align-items": "stretch",
        "gap": "12px",
        // Subtle dark veil over the content side, stronger on the left where
        // the background image is most visible, fading out on the right where
        // the image already fades. Keeps text readable without hiding the art.
        "background":
          "linear-gradient(to right, rgba(0,0,0,0.25), rgba(0,0,0,0.10) 60%, rgba(0,0,0,0))",
      }}>
        <div style={{ "flex": 1 }}>
          <h3 style={{
            "margin": "0 0 6px",
            "font-family": "var(--font-heading)",
            "font-size": "1.05rem",
            "color": "var(--text-primary)",
          }}>
            {props.quest.icon} {props.quest.title}
          </h3>
          <p style={{
            "color": "var(--text-secondary)",
            "font-size": "0.9rem",
            "margin": "0 0 8px",
            "font-style": "italic",
          }}>
            {props.quest.startNarrative ?? props.quest.narrative}
          </p>
          {/* Objective line — clickable when the quest has a target. The
              hover underline + pointer cursor signal it's a link, replacing
              the previous "Go →" button. */}
          {(() => {
            // Memory-only check-ins: the objective IS the action. Clicking it
            // opens the memory modal (no separate Claim button on the card).
            if (isMemoryOnly() && props.claimable) {
              return (
                <button
                  type="button"
                  onClick={props.onClaim}
                  classList={{ "quest-objective-link": true }}
                  style={{
                    "display": "block",
                    "margin": "8px 0 4px",
                    "padding": "0",
                    "background": "none",
                    "border": "none",
                    "text-align": "left",
                    "color": "var(--accent-gold)",
                    "font-size": "0.9rem",
                    "font-family": "inherit",
                    "cursor": "pointer",
                  }}
                >
                  ▸ {props.quest.objective}
                </button>
              );
            }
            const targetHref = () => {
              if (props.quest.targetBuildingId) return `/buildings#building-${props.quest.targetBuildingId}`;
              if (props.quest.targetPage) return props.quest.targetPage;
              return null;
            };
            const href = targetHref();
            return href ? (
              <A
                href={href}
                onClick={() => playSound("nav")}
                style={{
                  "display": "block",
                  "margin": "8px 0 4px",
                  "color": "var(--accent-gold)",
                  "font-size": "0.9rem",
                  "text-decoration": "none",
                  "cursor": "pointer",
                }}
                classList={{ "quest-objective-link": true }}
              >
                ▸ {props.quest.objective}
              </A>
            ) : (
              <p style={{
                "margin": "8px 0 4px",
                "color": "var(--accent-gold)",
                "font-size": "0.9rem",
              }}>
                ▸ {props.quest.objective}
              </p>
            );
          })()}
          <Show when={props.quest.hint}>
            <p style={{
              "color": "var(--text-muted)",
              "font-size": "0.85rem",
              "margin": "4px 0",
            }}>
              💡 {props.quest.hint}
              <Show when={props.quest.hintLink}>
                {" "}<A href={props.quest.hintLink!} style={{ "color": "var(--accent-blue)" }}>→</A>
              </Show>
            </p>
          </Show>
          <Show when={!isMemoryOnly()}>
            <div style={{
              "margin-top": "8px",
              "color": "var(--text-secondary)",
              "font-size": "0.8rem",
              "display": "inline-block",
              "padding": "4px 8px",
              "background": "rgba(0, 0, 0, 0.45)",
              "border-radius": "4px",
            }}>
              Reward: {props.quest.rewards.map((r) =>
                `${r.amount} ${r.label}`).join(", ")}
            </div>
          </Show>
        </div>

        <div style={{ "display": "flex", "flex-direction": "column", "gap": "6px", "align-items": "stretch" }}>
          <Show when={props.claimable && !isMemoryOnly()}>
            <button
              onClick={props.onClaim}
              style={{
                "margin-top": "auto",
                "padding": "6px 12px",
                "background": "var(--accent-gold)",
                "color": "#000",
                "border": "none",
                "border-radius": "4px",
                "cursor": "pointer",
                "font-weight": "bold",
                "font-size": "0.85rem",
                "white-space": "nowrap",
              }}
            >
              Claim
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
}
