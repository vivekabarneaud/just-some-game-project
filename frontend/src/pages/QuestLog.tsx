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
  questPrerequisitesMet,
  unmetPrerequisiteLabels,
  type QuestDefinition,
  type StorylineId,
} from "~/data/quests";
import QuestClaimModal from "~/components/QuestClaimModal";
import MemoryPreviewModal from "~/components/MemoryPreviewModal";
import { CardFrame } from "~/components/CardFrame";
import Tooltip from "~/components/Tooltip";
import { resolveFragments } from "~/data/founding_characters";

/** Gold-C tint for the Main Story panel frame (chosen on /dev-frames): the
 *  uncommon frame nudged warmer/brighter so the spine reads as "this matters"
 *  without the full legendary treatment. Applied to the frame layer only. */
const MAIN_STORY_FRAME_TINT = "saturate(1.5) brightness(1.08) hue-rotate(-4deg)";

const STORYLINE_ORDER: StorylineId[] = ["settlement", "guild", "story", "defense", "social"];
// "story" (the main-story spine) is hoisted OUT of the columns into its own
// full-width panel at the top. The rest sit in a two-column desk layout:
// domestic (settlement + defense) on the left, outward + personal (guild + the
// folk) on the right.
const LEFT_COLUMN: StorylineId[] = ["settlement", "defense"];
const RIGHT_COLUMN: StorylineId[] = ["guild", "social"];

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
  // Reward-less "The Folk" check-ins skip the reward modal entirely: claiming
  // files the memory + completes the quest, then we open the memory viewer
  // directly. Each check-in surfaces a single fragment.
  const [checkinMemory, setCheckinMemory] =
    createSignal<ReturnType<typeof resolveFragments>[number] | null>(null);
  const openCheckinMemory = (quest: QuestDefinition) => {
    actions.claimQuestReward(quest.id);
    const mems = resolveFragments(quest.unlocksBioFragments ?? []);
    if (mems.length > 0) setCheckinMemory(mems[0]);
  };

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
  const renderStorylinePane = (storylineId: StorylineId, opts?: { mainStory?: boolean }) => {
    const mainStory = !!opts?.mainStory;
    const active = () => activeQuests(storylineId);
    const completed = () => completedQuests(storylineId);
    const isCollapsed = () => collapsed()[storylineId];
    const chapterState = () =>
      state.chapters?.find((c) => c.storyline === storylineId);
    // The storyline's standing goal, pinned at the top. Prefer the currently
    // ACTIVE main-flagged quest, so a spine that advances beat by beat (the
    // guild's story breadcrumbs) evolves as each one completes. A single always-
    // active main (settlement's Road to Greatness, empty triggers) just stays.
    const main = () => questsByStoryline(storylineId).find((q) => q.main && isQuestActive(q, state));
    const secondary = () => active().filter((q) => !q.main);

    const renderCard = (quest: QuestDefinition, isMain: boolean) => {
      const seen = () => state.questsClaimableSeen ?? [];
      return (
        <QuestCard
          quest={quest}
          main={isMain}
          claimable={isQuestClaimable(quest, state) && questPrerequisitesMet(quest, state)}
          locked={!questPrerequisitesMet(quest, state)}
          lockReasons={unmetPrerequisiteLabels(quest, state)}
          isUnseen={!isMain && !seen().includes(quest.id)}
          onClaim={() => {
            const noReward = quest.rewards.length === 0;
            const hasMemory = (quest.unlocksBioFragments?.length ?? 0) > 0;
            const hasChronicle = !!quest.chronicleEntryId;
            if (noReward && hasMemory) openCheckinMemory(quest);
            else if (noReward && !hasChronicle) actions.claimQuestReward(quest.id);
            else setClaimingQuest(quest);
          }}
          onSeen={() => actions.markQuestClaimableSeen(quest.id)}
        />
      );
    };

    return (
      <Show when={active().length > 0 || completed().length > 0 || !!main()}>
        <div
          classList={{ "ornament-frame": !mainStory }}
          style={{
            "background": "var(--bg-secondary)",
            "margin-bottom": "16px",
            "overflow": "hidden",
            ...(mainStory ? { "position": "relative" } : {}),
          }}
        >
          {/* Main Story panel wears the uncommon frame tinted gold-C, drawn on
              its own layer so only the frame is tinted, not the text. */}
          <Show when={mainStory}>
            <div style={{
              "position": "absolute", "inset": "0",
              "filter": MAIN_STORY_FRAME_TINT,
              "pointer-events": "none", "z-index": 5,
            }}>
              <CardFrame rarity="uncommon" slice={34} border={20} ornamentRarity="common" />
            </div>
          </Show>
          <div style={mainStory ? { "position": "relative", "z-index": 1, "padding": "16px" } : {}}>
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
              {/* Pinned main quest — the standing goal for this storyline. */}
              {/* keyed: the pinned main quest changes value as the spine
                  advances (e.g. Heroes Wanted → Into the Unknown on claim). A
                  non-keyed Show wouldn't re-render on a truthy→truthy value
                  change, leaving the just-claimed quest stuck on screen until a
                  page refresh. keyed re-renders when the quest identity changes. */}
              <Show when={main()} keyed>
                {(mq) => renderCard(mq, true)}
              </Show>
              <Show when={secondary().length === 0 && !main()}>
                <p style={{ "color": "var(--text-muted)", "font-style": "italic" }}>
                  No active quests in this storyline.
                </p>
              </Show>
              {/* Secondary quests — the steps along the way. */}
              <Show when={main() && secondary().length > 0}>
                <div style={{
                  "font-size": "0.68rem",
                  "letter-spacing": "0.08em",
                  "text-transform": "uppercase",
                  "color": "var(--text-muted)",
                  "margin": "14px 0 6px",
                }}>
                  Along the way
                </div>
              </Show>
              <For each={secondary()}>
                {(quest) => renderCard(quest, false)}
              </For>
            </div>
          </Show>
          </div>
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

      {/* Direct memory viewer for reward-less check-ins — the claim already
          fired when the card's objective was clicked. */}
      <Show when={checkinMemory()}>
        {(m) => (
          <MemoryPreviewModal
            character={m().character}
            fragment={m().fragment}
            onClose={() => setCheckinMemory(null)}
          />
        )}
      </Show>

      <h1 class="page-title">📋 Quest Log</h1>

      <p style={{ "color": "var(--text-muted)", "margin-bottom": "16px" }}>
        {totalActive() === 0
          ? "All caught up. Nothing waiting for you."
          : `${totalActive()} quest${totalActive() === 1 ? "" : "s"} active across your storylines.`}
      </p>

      {/* The main-story spine — full parent width, its own gold-tinted frame,
          pinned above the rest so it always reads as the throughline. */}
      {renderStorylinePane("story", { mainStory: true })}

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
  main?: boolean;
  /** Shown but not yet actionable — prerequisites unmet. Renders dimmed with the
   *  requirements listed instead of a clickable objective. */
  locked?: boolean;
  lockReasons?: string[];
  onClaim: () => void;
  onSeen?: () => void;
}) {
  // Memory check-ins (the "The Folk" quests) are personal beats, not
  // transactions: no reward, but they surface a cast memory. The objective line
  // itself becomes the button that opens the memory, and we drop the standalone
  // Claim button. A reward-less quest WITHOUT a memory (e.g. a pure guide quest)
  // is not a check-in and behaves like a normal quest.
  const isMemoryCheckin = () =>
    props.quest.rewards.length === 0 && (props.quest.unlocksBioFragments?.length ?? 0) > 0;
  // Blue highlight = freshly active (not yet hovered) OR ready to claim. Memory
  // check-ins are permanently "claimable" but have nothing to claim, so their
  // claim half is dropped (matching the corner badge) — otherwise the outline
  // would never fade after hover. Unseen-only highlights fade on hover.
  const locked = () => !!props.locked;
  // A locked card never glows — it's a preview of a beat that isn't live yet.
  const highlight = () => !locked() && (props.isUnseen || (props.claimable && !isMemoryCheckin()));
  return (
    <div
      onMouseEnter={() => props.onSeen?.()}
      style={{
        "position": "relative",
        // Dim when locked (prerequisites unmet), same treatment as locked cards
        // elsewhere.
        "filter": locked() ? "var(--locked-dim)" : "none",
        // The pinned main quest wears a gold frame (the standing goal); other
        // cards highlight blue via highlight().
        "border": props.main
          ? "1px solid var(--accent-gold)"
          : highlight()
          ? "1px solid var(--accent-blue)"
          : "1px solid var(--border-color)",
        // Square corners to sit consistently inside the squared chapter frame.
        "border-radius": "0",
        "margin-bottom": "10px",
        "background": props.main
          ? "rgba(212, 175, 55, 0.05)"
          : highlight()
          ? "rgba(96, 165, 250, 0.06)"
          : "var(--bg-primary)",
        "box-shadow": props.main
          ? "0 0 0 1px var(--accent-gold), 0 0 14px rgba(212, 175, 55, 0.22)"
          : highlight()
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

      <Show when={highlight()}>
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
          <Show when={props.main}>
            <div style={{
              "font-size": "0.62rem",
              "letter-spacing": "0.1em",
              "text-transform": "uppercase",
              "color": "var(--accent-gold)",
              "font-weight": "bold",
              "margin-bottom": "4px",
            }}>
              ★ Main quest
            </div>
          </Show>
          <h3 style={{
            "margin": "0 0 6px",
            "font-family": "var(--font-heading)",
            "font-size": props.main ? "1.15rem" : "1.05rem",
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
            // Locked: the beat is visible but not yet actionable. Show the
            // objective greyed with a lock icon; the requirement lives in a
            // hover tooltip rather than a nagging inline line.
            if (locked()) {
              const lockText = () =>
                props.lockReasons && props.lockReasons.length > 0
                  ? `🔒 Locked — requires ${props.lockReasons.join(", ")}`
                  : "🔒 Locked";
              return (
                <Tooltip text={lockText()}>
                  <p style={{
                    "margin": "8px 0 4px",
                    "color": "var(--text-muted)",
                    "font-size": "0.9rem",
                    "cursor": "help",
                  }}>
                    🔒 {props.quest.objective}
                  </p>
                </Tooltip>
              );
            }
            // Memory-only check-ins: the objective IS the action. Clicking it
            // opens the memory modal (no separate Claim button on the card).
            if (isMemoryCheckin() && props.claimable) {
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
          <Show when={props.quest.rewards.length > 0}>
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
          <Show when={props.claimable && !isMemoryCheckin()}>
            <button
              class="btn-primary"
              onClick={props.onClaim}
              style={{
                "margin-top": "auto",
                "font-size": "0.85rem",
                "white-space": "nowrap",
                "justify-content": "center",
              }}
            >
              {/* Reward-less quests (e.g. the storage/infra nudges) are dismissed,
                  not "claimed" — a Done button reads right and avoids implying a
                  reward that isn't there. */}
              {props.quest.rewards.length === 0 ? "Done" : "Claim"}
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
}
