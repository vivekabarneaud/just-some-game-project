import { For, Show, onMount, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import BreweryManageModal from "~/components/BreweryManageModal";
import StaffManageModal from "~/components/StaffManageModal";
import { BUILDINGS, isBuildingUnlocked, isBuildingChapterUnlocked, getUnlockRequirement, getUnlockReasons, getUnlockConditions, getNextLevelRequirement, applyMasonCostReduction, applyMasonTimeReduction, getTierPrerequisitesMet, getRepairCost, getBuildingImage, isStaffable, PANIC_BUILD_IDS, PANIC_BUILD_SHARD_COST, type BuildingDefinition } from "~/data/buildings";
import { QUEST_DEFINITIONS, isQuestActive } from "~/data/quests";
import { useGame, isForagerBlooming, RAIN_FORAGE_MUSHROOM_FRACTION } from "~/engine/gameState";
import { playSound } from "~/engine/sounds";
import Countdown from "~/components/Countdown";
import Tooltip from "~/components/Tooltip";

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
  const [manageBrewery, setManageBrewery] = createSignal(false);
  const [manageStaff, setManageStaff] = createSignal<string | null>(null);

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
      <Show when={manageBrewery()}>
        <BreweryManageModal onClose={() => setManageBrewery(false)} />
      </Show>
      <Show when={manageStaff()}>
        {(id) => <StaffManageModal buildingId={id()} onClose={() => setManageStaff(null)} />}
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
                    <A href={`/buildings/${building.id}`} id={`building-${building.id}`} style={{ "text-decoration": "none" }}>
                      <div
                        class="building-card"
                        classList={{ upgrading: isUpgrading(), "quest-target": isQuestTarget() }}
                        onMouseEnter={() => {
                          if (isNewlyUnlocked()) actions.markBuildingSeen(building.id);
                        }}
                        style={{
                          opacity: pb()?.damaged ? 0.7 : 1,
                          position: "relative",
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
                        {currentLevel()?.production && (() => {
                          const FOOD_GATHERING: Record<string, Record<string, number>> = {
                            hunting_camp: { spring: 1, summer: 1, autumn: 0.75, winter: 0.5 },
                            fishing_hut: { spring: 1, summer: 1, autumn: 0.75, winter: 0.5 },
                            forager_hut: { spring: 1, summer: 1, autumn: 0.75, winter: 0.25 },
                          };
                          const seasonMod = FOOD_GATHERING[building.id]?.[state.season];
                          const baseRate = currentLevel()!.production!.rate;
                          const effectiveRate = seasonMod != null ? Math.floor(baseRate * seasonMod) : baseRate;
                          const isReduced = seasonMod != null && seasonMod < 1;
                          const FORAGER_FOOD: Record<string, string> = { spring: "berries", summer: "berries", autumn: "mushrooms", winter: "nuts" };
                          // Food-gathering buildings produce a generic "food" resource but yield a
                          // specific type — label it so (meat/fish/seasonal forage), not "food".
                          const GATHERED_FOOD: Record<string, string> = { hunting_camp: "meat", fishing_hut: "fish" };
                          const foodLabel = building.id === "forager_hut"
                            ? (FORAGER_FOOD[state.season] ?? "food")
                            : (GATHERED_FOOD[building.id] ?? currentLevel()!.production!.resource);
                          return (
                            <div class="building-card-production">
                              Producing: +{effectiveRate}/h{" "}
                              {foodLabel}
                              {isReduced && (
                                <span style={{ color: "var(--accent-gold)", "font-size": "0.7rem", "margin-left": "4px" }}>
                                  ({Math.round(seasonMod! * 100)}% — {state.season})
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        {building.id === "forager_hut" && level() > 0 && currentLevel()?.production && isForagerBlooming(state) && (
                          <div class="building-card-production" style={{ color: "#d4831a" }}>
                            🍄 It rained, and your gatherers found bonus mushrooms! (+{Math.floor(currentLevel()!.production!.rate * RAIN_FORAGE_MUSHROOM_FRACTION)}/h)
                          </div>
                        )}
                        {building.id === "forager_hut" && level() > 0 && (
                          <div class="building-card-production">
                            +{(level() * 1.5).toFixed(1)}/h fiber (wild flax)
                          </div>
                        )}
                        {building.id === "hunting_camp" && level() > 0 && (
                          <div class="building-card-production">
                            +{(level() * 1.0).toFixed(1)}/h leather (hides)
                          </div>
                        )}
                        {building.id === "brewery" && level() > 0 && (
                          <button
                            class="btn-tertiary"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setManageBrewery(true); }}
                            style={{
                              "margin-top": "6px", "font-size": "0.78rem",
                              "align-self": "flex-start",
                            }}
                          >
                            ⚙ Manage brewing
                          </button>
                        )}
                        {isStaffable(building.id) && level() > 0 && (() => {
                          const st = () => actions.getBuildingStaffing(building.id);
                          const short = () => st().active < st().capacity;
                          return (
                            <button
                              class="btn-tertiary"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setManageStaff(building.id); }}
                              style={{
                                "margin-top": "6px", "font-size": "0.78rem",
                                color: short() ? "var(--accent-red)" : undefined,
                                "align-self": "flex-start",
                              }}
                            >
                              ⚙ Manage staff · {st().active}/{st().capacity}
                            </button>
                          );
                        })()}
                        {pb()?.damaged && (
                          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "8px" }}>
                            <div class="building-card-upgrading" style={{ color: "var(--accent-red)" }}>
                              Damaged — Inactive
                            </div>
                            {(() => {
                              const cost = getRepairCost(building, level());
                              const canRepair = () => state.resources.wood >= cost.wood && state.resources.stone >= cost.stone;
                              return (
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
                              );
                            })()}
                          </div>
                        )}
                        {isUpgrading() && pb()?.upgradeRemaining && (
                          <div class="building-card-upgrading">
                            Upgrading to Lv. {level() + 1} —{" "}
                            <Countdown remainingSeconds={pb()!.upgradeRemaining!} />
                          </div>
                        )}
                      </div>
                    </A>
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
