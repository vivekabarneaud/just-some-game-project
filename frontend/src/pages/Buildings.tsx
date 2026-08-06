import { For, Show, onMount, createSignal } from "solid-js";
import BuildingModal from "~/components/BuildingModal";
import { BUILDINGS, isBuildingUnlocked, isBuildingChapterUnlocked, getUnlockRequirement, getUnlockReasons, getUnlockConditions, getNextLevelRequirement, applyMasonCostReduction, applyMasonTimeReduction, getTierPrerequisitesMet, getRepairCost, getBuildingImage, isStaffable, gatheringSeasonMod, animalSlots, PANIC_BUILD_IDS, PANIC_BUILD_SHARD_COST, type BuildingDefinition } from "~/data/buildings";
import { QUEST_DEFINITIONS, isQuestActive } from "~/data/quests";
import { useGame, isForagerBlooming, RAIN_FORAGE_MUSHROOM_FRACTION, gatheredFoodRate } from "~/engine/gameState";
import { playSound } from "~/engine/sounds";
import Countdown from "~/components/Countdown";
import Tooltip from "~/components/Tooltip";
import type { JSX } from "solid-js";

// Framed "Produces" box for gathering buildings — mirrors the farming page's
// stat boxes (common frame, uppercase label) so the settlement's raw-goods
// output reads in the same visual language as the farm's harvests.
const PRODUCE_BOX: JSX.CSSProperties = {
  padding: "10px 12px", background: "var(--bg-card)",
  // 6px so the stretched top/bottom hairline doesn't drop out (see STAT_BOX).
  border: "6px solid transparent",
  "border-image": "url(/images/frames/item_frame_common.png) 40 stretch",
  "box-sizing": "border-box", "margin-top": "8px", "text-align": "center",
};
const PRODUCE_LABEL: JSX.CSSProperties = {
  "font-size": "0.66rem", color: "var(--text-muted)", "text-transform": "uppercase",
  "letter-spacing": "0.6px", "margin-bottom": "6px", "text-align": "center",
};

// Defense buildings (walls / watchtower / barracks / mage tower) live on the
// dedicated /defenses page now, not as a section here.
const SECTIONS: { key: BuildingDefinition["category"]; label: string; icon: string }[] = [
  { key: "settlement", label: "Settlement", icon: "🏘️" },
  { key: "gathering", label: "Gathering", icon: "⛏️" },
  { key: "crafting", label: "Crafting", icon: "🧵" },
  { key: "guild", label: "Guilds", icon: "🏛️" },
  { key: "trade", label: "Trade", icon: "🏪" },
];


export default function Buildings() {
  const { state, actions } = useGame();
  const thLevel = () => actions.getTownHallLevel();
  const [selectedBuilding, setSelectedBuilding] = createSignal<string | null>(null);

  onMount(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  });
  const isQuestTargeted = (buildingId: string) => {
    // Multiple chapter quests can be active at once, each with its own
    // target. Highlight every building that has an active, not-yet-met
    // quest pointing at it. Drop the highlight once the condition is
    // satisfied — no need to nudge toward what's already done.
    return QUEST_DEFINITIONS.some(
      (q) =>
        q.targetBuildingId === buildingId &&
        isQuestActive(q, state) &&
        !q.condition(state),
    );
  };

  const getPlayerBuilding = (buildingId: string) =>
    state.buildings.find((b) => b.buildingId === buildingId);

  const buildingsInSection = (category: string) =>
    BUILDINGS.filter((b) => b.category === category);

  /** First building currently in progress, resolved to {name, remaining}.
   *  Shown next to the queue counter so the player sees the timer at a
   *  glance instead of scrolling to find the upgrading card. */
  const currentBuild = () => {
    const pb = state.buildings.find((b) => b.upgrading);
    if (!pb) return null;
    const def = BUILDINGS.find((b) => b.id === pb.buildingId);
    if (!def) return null;
    return { name: def.name, remaining: pb.upgradeRemaining ?? 0 };
  };

  return (
    <div>
      <Show when={selectedBuilding()}>
        {(id) => <BuildingModal buildingId={id()} onClose={() => setSelectedBuilding(null)} />}
      </Show>
      <h1 class="page-title">Buildings</h1>
      <div style={{
        "margin-bottom": "16px",
        padding: "8px 12px",
        background: "var(--bg-secondary)",
        "border-radius": "6px",
        "font-size": "0.85rem",
        color: "var(--text-secondary)",
        display: "flex",
        "justify-content": "space-between",
      }}>
        <span>
          Build Queue: {actions.getActiveQueueCount()} / {actions.getMasonBonuses().queueSlots}
          <Show when={currentBuild()}>
            {(b) => (
              <span style={{ "margin-left": "8px", color: "var(--accent-gold)" }}>
                · {b().name}: <Countdown remainingSeconds={b().remaining} />
              </span>
            )}
          </Show>
        </span>
        <Show when={actions.getMasonLevel() > 0}>
          <span style={{ color: "var(--accent-green)" }}>
            🧱 Mason's Guild Lv.{actions.getMasonLevel()} · −{Math.round(actions.getMasonBonuses().costReduction * 100)}% cost & time
          </span>
        </Show>
      </div>

      <For each={SECTIONS}>
        {(section) => (
          <div class="ornament-frame" style={{
            background: "var(--bg-secondary)",
            padding: "4px 16px 16px",
            "margin-bottom": "16px",
          }}>
            <h2 style={{
              "font-family": "var(--font-heading)",
              "margin-top": "8px",
              "margin-bottom": "10px",
              color: "var(--text-primary)",
              "font-size": "1rem",
              "border-bottom": "1px solid var(--border-default)",
              "padding-bottom": "6px",
            }}>
              {section.icon} {section.label}
            </h2>
            {/* grid-auto-rows: 1fr → every card in the section shares the
                tallest card's height (scoped inline so it doesn't touch the
                crafting pages, which reuse .buildings-grid). */}
            <div class="buildings-grid" style={{ "grid-auto-rows": "1fr" }}>
              <For each={buildingsInSection(section.key)}>
                {(building) => {
                  const pb = () => getPlayerBuilding(building.id);
                  const level = () => pb()?.level ?? 0;
                  const isUpgrading = () => pb()?.upgrading ?? false;
                  const currentLevel = () => (level() > 0 ? building.levels[level() - 1] : null);
                  const unlocked = () => {
                    // "Already built" → always show as upgradeable, even past a
                    // narrative gate. The bar is `level > defaultLevel` so that
                    // Town Hall (which starts at L1 by default) stays locked
                    // behind its ch.4 gate, while a player-built warehouse
                    // remains visible regardless of its prereq state.
                    const defaultLvl = building.defaultLevel ?? 0;
                    if ((pb()?.level ?? 0) > defaultLvl) return true;
                    return isBuildingUnlocked(building, thLevel()) &&
                      isBuildingChapterUnlocked(building, state);
                  };
                  const effMax = () => actions.getEffectiveMaxLevel(building.id);

                  const nextLevelDef = () => {
                    const lvl = level();
                    if (lvl >= effMax()) return null;
                    return building.levels[lvl];
                  };
                  const masonLvl = () => actions.getMasonLevel();
                  const effMason = () => building.id === "masons_guild" ? 0 : masonLvl();
                  const tierPrereqs = () => building.id === "town_hall"
                    ? getTierPrerequisitesMet(level() + 1, state.buildings)
                    : { met: true, missing: [] as string[] };
                  const canUpgradeNow = () => {
                    if (isUpgrading() || pb()?.damaged) return false;
                    const next = nextLevelDef();
                    if (!next) return false;
                    if (!tierPrereqs().met) return false;
                    const cost = applyMasonCostReduction(next.cost, effMason());
                    if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
                    if (actions.getActiveQueueCount() >= actions.getMasonBonuses().queueSlots) return false;
                    return true;
                  };
                  // Panic-build (soft-lock recovery): Lv.0 lumber mill / quarry the
                  // player can't afford because of a *resource shortage*. Other
                  // blockers (queue full, upgrade in progress, tier prereqs) are
                  // self-correcting and don't represent a soft-lock — using
                  // `!canUpgradeNow()` here would over-fire on those.
                  const cantAffordCost = () => {
                    const next = nextLevelDef();
                    if (!next) return false;
                    const cost = applyMasonCostReduction(next.cost, effMason());
                    return state.resources.wood < cost.wood || state.resources.stone < cost.stone;
                  };
                  const panicEligible = () =>
                    PANIC_BUILD_IDS.includes(building.id) &&
                    level() === 0 &&
                    !isUpgrading() &&
                    !pb()?.damaged &&
                    tierPrereqs().met &&
                    cantAffordCost();
                  const canPanicBuild = () =>
                    panicEligible() && state.astralShards >= PANIC_BUILD_SHARD_COST;
                  const upgradeReason = () => {
                    if (isUpgrading()) return "Upgrading...";
                    if (pb()?.damaged) return "Damaged — repair first";
                    if (level() >= effMax()) {
                      const req = getNextLevelRequirement(building, thLevel());
                      return req ? `Upgrade Town Hall to lvl ${req.requiredTownHallLevel}` : "Max level reached";
                    }
                    const next = nextLevelDef();
                    if (!next) return "Max level";
                    const cost = applyMasonCostReduction(next.cost, effMason());
                    if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) {
                      return `Need ${cost.wood}w ${cost.stone}s`;
                    }
                    if (actions.getActiveQueueCount() >= actions.getMasonBonuses().queueSlots) return "Queue full";
                    return "";
                  };
                  const upgradeCostTip = () => {
                    const next = nextLevelDef();
                    if (!next) return "";
                    const cost = applyMasonCostReduction(next.cost, effMason());
                    const time = applyMasonTimeReduction(next.buildTime, effMason());
                    const m = Math.floor(time / 60);
                    const s = time % 60;
                    return `🪵 ${cost.wood}  🪨 ${cost.stone}  ⏱️ ${m > 0 ? `${m}m` : ""}${s > 0 ? `${s}s` : ""}`;
                  };
                  const upgradeReasonFull = () => {
                    if (isUpgrading()) return "Upgrading...";
                    if (pb()?.damaged) return "🔧 Damaged — repair first";
                    if (level() >= effMax()) {
                      const req = getNextLevelRequirement(building, thLevel());
                      return req ? `🔒 Upgrade Town Hall to lvl ${req.requiredTownHallLevel}` : "🏆 Max level reached";
                    }
                    const next = nextLevelDef();
                    if (!next) return "🏆 Max level";
                    const prereqs = tierPrereqs();
                    if (!prereqs.met) return `🔒 Requires: ${prereqs.missing.join(", ")}`;
                    const cost = applyMasonCostReduction(next.cost, effMason());
                    const parts = [];
                    if (state.resources.wood < cost.wood) parts.push(`🪵 ${cost.wood - Math.floor(state.resources.wood)} more wood`);
                    if (state.resources.stone < cost.stone) parts.push(`🪨 ${cost.stone - Math.floor(state.resources.stone)} more stone`);
                    if (parts.length > 0) return `Need ${parts.join(", ")}`;
                    if (actions.getActiveQueueCount() >= actions.getMasonBonuses().queueSlots) return "🏗️ Build queue full";
                    return "";
                  };

                  const isQuestTarget = () => isQuestTargeted(building.id);

                  const isNewlyUnlocked = () => {
                    if (!unlocked()) return false;
                    const seen = state.buildingsSeen ?? [];
                    return !seen.includes(building.id);
                  };
                  return unlocked() ? (
                    <Tooltip text="Click to manage" position="cursor" block style={{ height: "100%" }}>
                    <div
                        class="building-card"
                        id={`building-${building.id}`}
                        classList={{ upgrading: isUpgrading(), "quest-target": isQuestTarget(), damaged: !!pb()?.damaged }}
                        onClick={() => setSelectedBuilding(building.id)}
                        onMouseEnter={() => {
                          if (isNewlyUnlocked()) actions.markBuildingSeen(building.id);
                        }}
                        style={{
                          position: "relative",
                          cursor: "pointer",
                          height: "100%",
                          // Quest-target gold border takes priority over the
                          // newly-unlocked blue highlight when both apply.
                          ...(isNewlyUnlocked() && !isQuestTarget()
                            ? {
                                border: "1px solid var(--accent-blue)",
                                "box-shadow": "0 0 0 1px var(--accent-blue), 0 0 12px rgba(96, 165, 250, 0.25)",
                                background: "rgba(96, 165, 250, 0.06)",
                              }
                            : {}),
                          "transition": "border-color 0.25s, box-shadow 0.25s, background 0.25s",
                        }}
                      >
                        {/* Upgrade indicator with tooltip (non-image cards only) */}
                        <Show when={!isUpgrading() && !getBuildingImage(building, level())}>
                          <div
                            class="upgrade-indicator"
                            style={{
                              position: "absolute",
                              ...(getBuildingImage(building, level())
                                ? { bottom: "8px", right: "8px" }
                                : { top: "8px", right: "8px" }),
                              "z-index": "5",
                            }}
                            onClick={(e) => {
                              if (canUpgradeNow()) {
                                e.preventDefault();
                                e.stopPropagation();
                                playSound("build");
                                actions.upgradeBuilding(building.id);
                              } else if (canPanicBuild()) {
                                e.preventDefault();
                                e.stopPropagation();
                                playSound("build");
                                actions.panicBuildBuilding(building.id);
                              }
                            }}
                          >
                            <div style={{
                              width: "22px",
                              height: "22px",
                              "border-radius": "4px",
                              display: "flex",
                              "align-items": "center",
                              "justify-content": "center",
                              "font-size": "0.75rem",
                              background: canUpgradeNow()
                                ? "rgba(46, 204, 113, 0.2)"
                                : panicEligible()
                                  ? "rgba(167, 139, 250, 0.2)"
                                  : "rgba(106, 100, 88, 0.15)",
                              border: `1px solid ${canUpgradeNow()
                                ? "var(--accent-green)"
                                : panicEligible()
                                  ? (canPanicBuild() ? "#a78bfa" : "var(--text-muted)")
                                  : "var(--text-muted)"}`,
                              color: canUpgradeNow()
                                ? "var(--accent-green)"
                                : panicEligible()
                                  ? (canPanicBuild() ? "#a78bfa" : "var(--text-muted)")
                                  : "var(--text-muted)",
                              cursor: (canUpgradeNow() || canPanicBuild()) ? "pointer" : "default",
                            }}>
                              {panicEligible() ? "✨" : (level() === 0 ? "+" : "↑")}
                            </div>
                            <div class="upgrade-tooltip" style={{
                              position: "absolute",
                              right: 0,
                              top: "28px",
                              "min-width": "160px",
                              padding: "6px 10px",
                              background: "var(--bg-panel)",
                              border: `1px solid ${canUpgradeNow()
                                ? "var(--accent-green)"
                                : panicEligible()
                                  ? "#a78bfa"
                                  : "var(--border-default)"}`,
                              "border-radius": "6px",
                              "font-size": "0.75rem",
                              color: "var(--text-secondary)",
                              "z-index": 10,
                              display: "none",
                              "box-shadow": "0 4px 12px rgba(0,0,0,0.3)",
                              "white-space": "nowrap",
                            }}>
                              <Show when={canUpgradeNow()}>
                                <div style={{ color: "var(--accent-green)", "font-weight": "bold", "margin-bottom": "2px" }}>
                                  {level() === 0 ? "Build" : `Upgrade to Lv.${level() + 1}`}
                                </div>
                                <div>{upgradeCostTip()}</div>
                                <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "2px" }}>Click to upgrade</div>
                              </Show>
                              <Show when={!canUpgradeNow() && panicEligible()}>
                                <div style={{ color: "#a78bfa", "font-weight": "bold", "margin-bottom": "2px" }}>
                                  Use {PANIC_BUILD_SHARD_COST} ✨ to build instantly
                                </div>
                                <div style={{ "font-size": "0.7rem", color: "var(--text-muted)" }}>
                                  Soft-lock recovery — skip the resource cost.
                                </div>
                                <Show when={!canPanicBuild()}>
                                  <div style={{ color: "var(--accent-red)", "margin-top": "2px" }}>
                                    Need {PANIC_BUILD_SHARD_COST - state.astralShards} more shards
                                  </div>
                                </Show>
                              </Show>
                              <Show when={!canUpgradeNow() && !panicEligible()}>
                                <div style={{ color: "var(--accent-gold)" }}>{upgradeReasonFull()}</div>
                                <Show when={nextLevelDef()}>
                                  <div style={{ "margin-top": "2px" }}>{upgradeCostTip()}</div>
                                </Show>
                              </Show>
                            </div>
                          </div>
                        </Show>
                        <Show when={getBuildingImage(building, level())}>
                          <div class="building-card-image">
                            <img src={getBuildingImage(building, level())!} alt={building.name} loading="lazy" />
                            <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
                              <div>
                                <div class="building-card-title">{building.name}</div>
                                <div class="building-card-level" classList={{ "not-built": level() === 0 }}>
                                  {level() === 0 ? "Not built" : `Level ${level()} / ${effMax()}`}
                                </div>
                              </div>
                              <Show when={!isUpgrading() && nextLevelDef()}>
                                <div
                                  class="upgrade-indicator"
                                  style={{ position: "relative", top: "auto", right: "auto", "z-index": "5" }}
                                  onClick={(e) => {
                                    if (canUpgradeNow()) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      playSound("build");
                                      actions.upgradeBuilding(building.id);
                                    } else if (canPanicBuild()) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      playSound("build");
                                      actions.panicBuildBuilding(building.id);
                                    }
                                  }}
                                >
                                  <div style={{
                                    width: "22px",
                                    height: "22px",
                                    "border-radius": "4px",
                                    display: "flex",
                                    "align-items": "center",
                                    "justify-content": "center",
                                    "font-size": "0.75rem",
                                    background: canUpgradeNow()
                                      ? "rgba(46, 204, 113, 0.3)"
                                      : panicEligible()
                                        ? "rgba(167, 139, 250, 0.35)"
                                        : "rgba(106, 100, 88, 0.3)",
                                    border: `1px solid ${canUpgradeNow()
                                      ? "var(--accent-green)"
                                      : panicEligible()
                                        ? (canPanicBuild() ? "#a78bfa" : "var(--text-muted)")
                                        : "var(--text-muted)"}`,
                                    color: canUpgradeNow()
                                      ? "var(--accent-green)"
                                      : panicEligible()
                                        ? (canPanicBuild() ? "#a78bfa" : "var(--text-muted)")
                                        : "var(--text-muted)",
                                    cursor: (canUpgradeNow() || canPanicBuild()) ? "pointer" : "default",
                                  }}>
                                    {panicEligible() ? "✨" : (level() === 0 ? "+" : "↑")}
                                  </div>
                                  <div class="upgrade-tooltip" style={{
                                    position: "absolute",
                                    right: 0,
                                    bottom: "28px",
                                    "min-width": "160px",
                                    padding: "6px 10px",
                                    background: "var(--bg-panel)",
                                    border: `1px solid ${canUpgradeNow()
                                      ? "var(--accent-green)"
                                      : panicEligible()
                                        ? "#a78bfa"
                                        : "var(--border-default)"}`,
                                    "border-radius": "6px",
                                    "font-size": "0.75rem",
                                    color: "var(--text-secondary)",
                                    "z-index": 10,
                                    display: "none",
                                    "box-shadow": "0 4px 12px rgba(0,0,0,0.3)",
                                    "white-space": "nowrap",
                                  }}>
                                    <Show when={canUpgradeNow()}>
                                      <div style={{ color: "var(--accent-green)", "font-weight": "bold", "margin-bottom": "2px" }}>
                                        {level() === 0 ? "Build" : `Upgrade to Lv.${level() + 1}`}
                                      </div>
                                      <div>{upgradeCostTip()}</div>
                                    </Show>
                                    <Show when={!canUpgradeNow() && panicEligible()}>
                                      <div style={{ color: "#a78bfa", "font-weight": "bold", "margin-bottom": "2px" }}>
                                        Use {PANIC_BUILD_SHARD_COST} ✨ to build instantly
                                      </div>
                                      <div style={{ "font-size": "0.7rem", color: "var(--text-muted)" }}>
                                        Soft-lock recovery — skip the resource cost.
                                      </div>
                                      <Show when={!canPanicBuild()}>
                                        <div style={{ color: "var(--accent-red)", "margin-top": "2px" }}>
                                          Need {PANIC_BUILD_SHARD_COST - state.astralShards} more shards
                                        </div>
                                      </Show>
                                    </Show>
                                    <Show when={!canUpgradeNow() && !panicEligible()}>
                                      <div style={{ color: "var(--accent-gold)" }}>{upgradeReasonFull()}</div>
                                      <Show when={nextLevelDef()}>
                                        <div style={{ "margin-top": "2px" }}>{upgradeCostTip()}</div>
                                      </Show>
                                    </Show>
                                  </div>
                                </div>
                              </Show>
                            </div>
                          </div>
                        </Show>
                        <Show when={!getBuildingImage(building, level())}>
                          <div class="building-card-header">
                            <div class="building-card-icon">{building.icon}</div>
                            <div>
                              <div class="building-card-title">{building.name}</div>
                              <div class="building-card-level" classList={{ "not-built": level() === 0 }}>
                                {level() === 0 ? "Not built" : `Level ${level()} / ${effMax()}`}
                              </div>
                            </div>
                          </div>
                        </Show>
                        <div class="building-card-desc">{building.description}</div>
                        {/* A short staff-coverage line stays on the card (managed
                            in the building modal now, not a separate button). */}
                        {isStaffable(building.id) && level() > 0 && (() => {
                          const st = () => actions.getBuildingStaffing(building.id);
                          const short = () => st().active < st().capacity;
                          // Present but reduced (a wounded/ill worker still shows up,
                          // just slower) — distinct from an empty slot.
                          const hurt = () => !short() && st().multiplier < 1;
                          const hurtReason = () => st().named.find((n) => n.present && n.effectiveness < 1)?.reason;
                          return (
                            <div style={{
                              "margin-top": "6px", "font-size": "0.75rem",
                              color: short() || hurt() ? "var(--accent-red)" : "var(--text-muted)",
                            }}>
                              👤 Staff {st().active}/{st().capacity}{short() ? " · short-handed" : hurt() ? ` · ${hurtReason() ?? "working hurt"}` : ""}
                            </div>
                          );
                        })()}
                        {/* Founder ailment — a hurt/sick founder mends on their own;
                            a dressing/remedy speeds it. Cure buttons for owned items. */}
                        {level() > 0 && (() => {
                          const ail = () => actions.getBuildingAilment(building.id);
                          return (
                            <Show when={ail()}>
                              {(a) => (
                                <div style={{
                                  "margin-top": "6px", padding: "6px 8px", "border-radius": "4px",
                                  background: "rgba(231, 76, 60, 0.08)", border: "1px solid var(--accent-red)",
                                }}>
                                  <div style={{ "font-size": "0.78rem", color: "var(--accent-red)" }}>
                                    {a().icon} {a().who} has {a().name.toLowerCase()}
                                  </div>
                                  <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "2px" }}>
                                    Mending on their own (~{Math.max(1, Math.round(a().hoursRemaining))}h). {a().kind === "injury" ? "A dressing" : "A remedy"} sets it right sooner.
                                  </div>
                                  <Show
                                    when={a().cures.length > 0}
                                    fallback={
                                      <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "font-style": "italic", "margin-top": "4px" }}>
                                        Nothing on hand to treat it — they'll rest it off.
                                      </div>
                                    }
                                  >
                                    <div style={{ display: "flex", "flex-wrap": "wrap", gap: "4px", "margin-top": "5px" }}>
                                      <For each={a().cures}>
                                        {(c) => (
                                          <button
                                            class="btn-tertiary"
                                            style={{ "font-size": "0.7rem", padding: "3px 8px" }}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); actions.cureBuildingAilment(building.id, c.id); }}
                                          >
                                            {c.icon} {c.name} ({c.qty})
                                          </button>
                                        )}
                                      </For>
                                    </div>
                                  </Show>
                                </div>
                              )}
                            </Show>
                          );
                        })()}
                        {/* Hunting camp: a dog boosts the catch. Nudge that the
                            slot exists (assigned in the building modal on click). */}
                        {building.id === "hunting_camp" && level() > 0 && (() => {
                          const slots = () => animalSlots(building.id, level());
                          const posted = () => state.keptAnimals.filter((a) => a.job === "hunt").length;
                          const free = () => posted() < slots();
                          return (
                            <div style={{
                              "margin-top": "4px", "font-size": "0.75rem",
                              color: free() ? "var(--accent-gold)" : "var(--text-muted)",
                            }}>
                              🐕 Dogs {posted()}/{slots()}{free() ? " · click to assign one and boost the catch" : ""}
                            </div>
                          );
                        })()}
                        {/* Gathering output, wrapped in a framed "Produces" box that
                            mirrors the farming cards. Only gathering buildings carry a
                            passive `production`, so non-gathering cards render nothing here. */}
                        {(() => {
                          // Preview at level 1 when unbuilt (mirrors the unbuilt pen preview).
                          const prodLevel = () => (level() > 0 ? level() : 1);
                          const built = () => level() > 0;
                          // Production def for the current level, or level 1 as a preview.
                          const prodDef = () => currentLevel()?.production ?? building.levels[0]?.production;
                          // Iron mine has no `production` field — its ore is a hardcoded
                          // 8/level tick, so it needs special handling to show at all.
                          const isIron = () => building.id === "iron_mine";
                          const showBox = () => building.category === "gathering" && (!!prodDef() || isIron());

                          const mainLine = () => {
                            if (isIron()) {
                              return <div class="building-card-production">+{8 * prodLevel()}/h iron</div>;
                            }
                            const def = prodDef();
                            if (!def) return null;
                            const seasonMod = gatheringSeasonMod(building.id, state.season);
                            const seasonRate = seasonMod != null ? Math.floor(def.rate * seasonMod) : def.rate;
                            // A BUILT food gatherer reads its numbers straight from the shared
                            // gatheredFoodRate() helper — the same one the tick, the net-food
                            // projection and the Overview dropdown use — so the card can't drift.
                            // An unbuilt preview has no staffing yet, so it keeps the full-rate path.
                            const pb = built() ? state.buildings.find((b) => b.buildingId === building.id) : undefined;
                            const gathered = pb ? gatheredFoodRate(state, pb) : null;
                            // Short-staffing (e.g. a founder away on a mission) scales output too,
                            // the same way the tick does — reflect it so the card matches reality.
                            const staff = isStaffable(building.id) && built() ? actions.getBuildingStaffing(building.id) : null;
                            const staffMult = gathered ? gathered.staffMult : (staff?.multiplier ?? 1);
                            const shortStaffed = !!staff && staff.active < staff.capacity && staffMult < 1;
                            // Present but reduced — a wounded/ill worker still shows up, just slower.
                            const hurtStaffed = !!staff && !shortStaffed && staffMult < 1;
                            const hurtLabel = staff?.named.find((n) => n.present && n.effectiveness < 1)?.reason ?? "worker hurt";
                            // Hunting dogs posted to the camp boost its whole catch (matches the tick + modal).
                            const huntDogBoost = gathered ? gathered.huntBoost
                              : (building.id === "hunting_camp"
                                  ? Math.min(0.5, state.keptAnimals.reduce((b, a) => a.job === "hunt" ? b + 0.08 * Math.max(1, a.huntLevel) : b, 0))
                                  : 0);
                            const effectiveRate = gathered ? gathered.rate : Math.floor(seasonRate * staffMult * (1 + huntDogBoost));
                            const isReduced = seasonMod != null && seasonMod < 1;
                            const FORAGER_FOOD: Record<string, string> = { spring: "berries", summer: "berries", autumn: "mushrooms", winter: "nuts" };
                            // Food-gathering buildings produce a generic "food" resource but yield a
                            // specific type — prefer the live seasonal catch (gathered.label: venison/
                            // rabbit/wild fowl for the hunt, forage for the forager), and fall back to a
                            // static label for the not-yet-built preview.
                            const GATHERED_FOOD: Record<string, string> = { hunting_camp: "game", fishing_hut: "fish" };
                            const foodLabel = gathered
                              ? gathered.label.toLowerCase()
                              : building.id === "forager_hut"
                                ? (FORAGER_FOOD[state.season] ?? "food")
                                : (GATHERED_FOOD[building.id] ?? def.resource);
                            const reduced = isReduced || shortStaffed || hurtStaffed;
                            return (
                              <div style={{ display: "flex", "flex-direction": "column", "align-items": "center", gap: "2px" }}>
                                <div class="building-card-production">
                                  +{effectiveRate}/h {foodLabel}
                                  {reduced && (
                                    <span style={{ color: "var(--text-muted)", "font-size": "0.72rem", "font-weight": "normal", "margin-left": "6px" }}>
                                      (full {def.rate}/h)
                                    </span>
                                  )}
                                </div>
                                {gathered && gathered.extras.length > 0 && (
                                  <div class="building-card-production" style={{ "font-size": "0.72rem", color: "var(--text-secondary)" }}>
                                    {gathered.extras.map((e) => `+${e.rate}/h ${e.label.toLowerCase()}`).join(" · ")}
                                  </div>
                                )}
                                {building.id === "hunting_camp" && (
                                  <div class="building-card-production">
                                    +{(prodLevel() * 1.0 * (seasonMod ?? 1) * staffMult * (1 + huntDogBoost)).toFixed(1)}/h leather · +{(prodLevel() * 0.6 * (seasonMod ?? 1) * staffMult * (1 + huntDogBoost)).toFixed(1)}/h bone
                                  </div>
                                )}
                                {building.id === "forager_hut" && (
                                  <>
                                    <div class="building-card-production">
                                      +{(prodLevel() * 1.5 * (seasonMod ?? 1) * staffMult).toFixed(1)}/h fiber (wild flax)
                                    </div>
                                    <div style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>· sometimes turns up medicinal herbs</div>
                                  </>
                                )}
                                {reduced && (
                                  <div style={{ "font-size": "0.72rem", "margin-top": "2px", color: shortStaffed || hurtStaffed ? "var(--accent-red)" : "var(--accent-gold)" }}>
                                    {[
                                      isReduced ? `${Math.round(seasonMod! * 100)}% yield in ${state.season}` : null,
                                      shortStaffed ? `short-handed (${Math.round(staffMult * 100)}%)` : null,
                                      hurtStaffed ? `${hurtLabel} (${Math.round(staffMult * 100)}%)` : null,
                                    ].filter(Boolean).join(" · ")}
                                  </div>
                                )}
                              </div>
                            );
                          };
                          const extraLines = () => (
                            <>
                              {building.id === "forager_hut" && built() && currentLevel()?.production && isForagerBlooming(state) && (
                                <div class="building-card-production" style={{ color: "#d4831a" }}>
                                  🍄 It rained, and your gatherers found bonus mushrooms! (+{Math.floor(currentLevel()!.production!.rate * RAIN_FORAGE_MUSHROOM_FRACTION)}/h)
                                </div>
                              )}
                              {isIron() && (
                                <div class="building-card-production" style={{ color: "var(--text-muted)", "font-size": "0.72rem" }}>
                                  · a chance of gems & shards
                                </div>
                              )}
                            </>
                          );

                          return (
                            <Show when={showBox()}>
                              <div style={{ ...PRODUCE_BOX, ...(built() ? {} : { opacity: 0.55 }) }}>
                                <div style={PRODUCE_LABEL}>Produces</div>
                                {mainLine()}
                                {extraLines()}
                                <Show when={!built()}>
                                  <div style={{ "font-size": "0.66rem", color: "var(--text-muted)", "margin-top": "6px" }}>
                                    at level 1 — build to start
                                  </div>
                                </Show>
                              </div>
                            </Show>
                          );
                        })()}
                        {pb()?.damaged && (() => {
                          const cost = getRepairCost(building, level());
                          const canRepair = () => state.resources.wood >= cost.wood && state.resources.stone >= cost.stone;
                          const repairing = () => pb()?.repairRemaining != null;
                          return (
                            <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "8px" }}>
                              <div class="building-card-upgrading" style={{ color: repairing() ? "var(--text-secondary)" : "var(--accent-red)" }}>
                                {repairing() ? "Repairing" : "Damaged — Inactive"}
                              </div>
                              <Show
                                when={repairing()}
                                fallback={
                                  <button
                                    class="btn-primary"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); actions.repairBuilding(building.id); }}
                                    disabled={!canRepair()}
                                    style={{
                                      "font-size": "0.72rem",
                                      "white-space": "nowrap",
                                      "flex-shrink": 0,
                                    }}
                                  >
                                    🔧 Repair (🪵{cost.wood} 🪨{cost.stone})
                                  </button>
                                }
                              >
                                <div class="building-card-upgrading" style={{ "flex-shrink": 0, "white-space": "nowrap" }}>
                                  🔨 <Countdown remainingSeconds={pb()!.repairRemaining!} /> left
                                </div>
                              </Show>
                            </div>
                          );
                        })()}
                        {isUpgrading() && pb()?.upgradeRemaining && (
                          <div class="building-card-upgrading">
                            Upgrading to Lv. {level() + 1} —{" "}
                            <Countdown remainingSeconds={pb()!.upgradeRemaining!} />
                          </div>
                        )}
                      </div>
                    </Tooltip>
                  ) : (
                    (() => {
                      const reasons = getUnlockReasons(building, state);
                      const conditions = getUnlockConditions(building, state);
                      const primaryReason = reasons[0] ?? getUnlockRequirement(building);
                      const tooltipContent = () => (
                        <div style={{ "min-width": "200px" }}>
                          <div class="section-label" style={{ "font-size": "0.7rem", "letter-spacing": "0.06em" }}>
                            Unlock conditions
                          </div>
                          <ul style={{
                            "list-style": "none",
                            "margin": 0,
                            "padding": 0,
                          }}>
                            <For each={conditions.length > 0 ? conditions : [{ label: getUnlockRequirement(building), met: false }]}>
                              {(c) => (
                                <li style={{
                                  "padding": "2px 0",
                                  "color": c.met ? "var(--accent-green)" : "var(--accent-red)",
                                  "font-size": "0.8rem",
                                }}>
                                  <span style={{ "margin-right": "6px" }}>{c.met ? "✓" : "✗"}</span>
                                  {c.label}
                                </li>
                              )}
                            </For>
                          </ul>
                        </div>
                      );
                      return (
                        <Tooltip content={tooltipContent} position="cursor" block style={{ height: "100%" }}>
                          <div class="building-card locked" id={`building-${building.id}`} style={{ height: "100%" }}>
                            <Show when={getBuildingImage(building, level())}>
                              <div class="building-card-image locked-image">
                                <img src={getBuildingImage(building, level())!} alt={building.name} loading="lazy" />
                                <div class="building-card-image-overlay">
                                  <div class="building-card-title locked-title">{building.name}</div>
                                  <div class="building-card-level locked-req">
                                    {primaryReason}
                                  </div>
                                </div>
                              </div>
                            </Show>
                            <Show when={!getBuildingImage(building, level())}>
                              <div class="building-card-header">
                                <div class="building-card-icon locked-icon">{building.icon}</div>
                                <div>
                                  <div class="building-card-title locked-title">{building.name}</div>
                                  <div class="building-card-level locked-req">
                                    {primaryReason}
                                  </div>
                                </div>
                              </div>
                            </Show>
                            <div class="building-card-desc">{building.description}</div>
                          </div>
                        </Tooltip>
                      );
                    })()
                  );
                }}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
