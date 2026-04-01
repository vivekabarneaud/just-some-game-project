import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { BUILDINGS, isBuildingUnlocked, getUnlockRequirement, getNextTierForLevels, applyMasonCostReduction, applyMasonTimeReduction, type BuildingDefinition } from "~/data/buildings";
import { QUEST_CHAIN } from "~/data/quests";
import { useGame } from "~/engine/gameState";
import Countdown from "~/components/Countdown";

const SECTIONS: { key: BuildingDefinition["category"]; label: string; icon: string }[] = [
  { key: "settlement", label: "Settlement", icon: "🏘️" },
  { key: "gathering", label: "Gathering", icon: "⛏️" },
  { key: "crafting", label: "Crafting", icon: "🧵" },
  { key: "guild", label: "Guilds", icon: "🏛️" },
  { key: "defense", label: "Defense", icon: "🛡️" },
  { key: "magic", label: "Arcane", icon: "🔮" },
  { key: "trade", label: "Trade", icon: "🏪" },
];

export default function Buildings() {
  const { state, actions } = useGame();
  const thLevel = () => actions.getTownHallLevel();
  const questTarget = () => {
    const c = state.questRewardsClaimed ?? [];
    const idx = QUEST_CHAIN.findIndex((q) => !c.includes(q.id));
    return idx >= 0 ? QUEST_CHAIN[idx].targetBuildingId : null;
  };

  const getPlayerBuilding = (buildingId: string) =>
    state.buildings.find((b) => b.buildingId === buildingId);

  const buildingsInSection = (category: string) =>
    BUILDINGS.filter((b) => b.category === category);

  const sectionHasVisible = (category: string) =>
    buildingsInSection(category).some((b) => isBuildingUnlocked(b, thLevel()) || (getPlayerBuilding(b.id)?.level ?? 0) > 0);

  return (
    <div>
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
        </span>
        <Show when={actions.getMasonLevel() > 0}>
          <span style={{ color: "var(--accent-green)" }}>
            🧱 Mason's Guild Lv.{actions.getMasonLevel()} · −{Math.round(actions.getMasonBonuses().costReduction * 100)}% cost & time
          </span>
        </Show>
      </div>

      <For each={SECTIONS}>
        {(section) => (
          <Show when={sectionHasVisible(section.key)}>
            <h2 style={{
              "font-family": "var(--font-heading)",
              "margin-top": "20px",
              "margin-bottom": "10px",
              color: "var(--text-primary)",
              "font-size": "1rem",
              "border-bottom": "1px solid var(--border-default)",
              "padding-bottom": "6px",
            }}>
              {section.icon} {section.label}
            </h2>
            <div class="buildings-grid">
              <For each={buildingsInSection(section.key)}>
                {(building) => {
                  const pb = () => getPlayerBuilding(building.id);
                  const level = () => pb()?.level ?? 0;
                  const isUpgrading = () => pb()?.upgrading ?? false;
                  const currentLevel = () => (level() > 0 ? building.levels[level() - 1] : null);
                  const unlocked = () => isBuildingUnlocked(building, thLevel());
                  const effMax = () => actions.getEffectiveMaxLevel(building.id);

                  const nextLevelDef = () => {
                    const lvl = level();
                    if (lvl >= effMax()) return null;
                    return building.levels[lvl];
                  };
                  const masonLvl = () => actions.getMasonLevel();
                  const effMason = () => building.id === "masons_guild" ? 0 : masonLvl();
                  const canUpgradeNow = () => {
                    if (isUpgrading() || pb()?.damaged) return false;
                    const next = nextLevelDef();
                    if (!next) return false;
                    const cost = applyMasonCostReduction(next.cost, effMason());
                    if (state.resources.wood < cost.wood || state.resources.stone < cost.stone) return false;
                    if (actions.getActiveQueueCount() >= actions.getMasonBonuses().queueSlots) return false;
                    return true;
                  };
                  const upgradeReason = () => {
                    if (isUpgrading()) return "Upgrading...";
                    if (pb()?.damaged) return "Damaged — repair first";
                    if (level() >= effMax()) {
                      const tierInfo = getNextTierForLevels(building, actions.getSettlementTier());
                      return tierInfo ? `Max for tier — need ${tierInfo.name}` : "Max level reached";
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
                      const tierInfo = getNextTierForLevels(building, actions.getSettlementTier());
                      return tierInfo ? `🔒 Max for tier — need ${tierInfo.name}` : "🏆 Max level reached";
                    }
                    const next = nextLevelDef();
                    if (!next) return "🏆 Max level";
                    const cost = applyMasonCostReduction(next.cost, effMason());
                    const parts = [];
                    if (state.resources.wood < cost.wood) parts.push(`🪵 ${cost.wood - Math.floor(state.resources.wood)} more wood`);
                    if (state.resources.stone < cost.stone) parts.push(`🪨 ${cost.stone - Math.floor(state.resources.stone)} more stone`);
                    if (parts.length > 0) return `Need ${parts.join(", ")}`;
                    if (actions.getActiveQueueCount() >= actions.getMasonBonuses().queueSlots) return "🏗️ Build queue full";
                    return "";
                  };

                  const isQuestTarget = () => {
                    const qt = questTarget();
                    if (qt !== building.id) return false;
                    const c = state.questRewardsClaimed ?? [];
                    const idx = QUEST_CHAIN.findIndex((q) => !c.includes(q.id));
                    return idx >= 0 && !QUEST_CHAIN[idx].condition(state);
                  };

                  return unlocked() ? (
                    <A href={`/buildings/${building.id}`} style={{ "text-decoration": "none" }}>
                      <div
                        class="building-card"
                        classList={{ upgrading: isUpgrading(), "quest-target": isQuestTarget() }}
                        style={{ opacity: pb()?.damaged ? 0.7 : 1, position: "relative" }}
                      >
                        {/* Upgrade indicator with tooltip */}
                        <Show when={!isUpgrading()}>
                          <div
                            class="upgrade-indicator"
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                            }}
                            onClick={(e) => {
                              if (canUpgradeNow()) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.upgradeBuilding(building.id);
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
                              background: canUpgradeNow() ? "rgba(46, 204, 113, 0.2)" : "rgba(106, 100, 88, 0.15)",
                              border: `1px solid ${canUpgradeNow() ? "var(--accent-green)" : "var(--text-muted)"}`,
                              color: canUpgradeNow() ? "var(--accent-green)" : "var(--text-muted)",
                              cursor: canUpgradeNow() ? "pointer" : "default",
                            }}>
                              {level() === 0 ? "+" : "↑"}
                            </div>
                            <div class="upgrade-tooltip" style={{
                              position: "absolute",
                              right: 0,
                              top: "28px",
                              "min-width": "160px",
                              padding: "6px 10px",
                              background: "var(--bg-panel)",
                              border: `1px solid ${canUpgradeNow() ? "var(--accent-green)" : "var(--border-default)"}`,
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
                              <Show when={!canUpgradeNow()}>
                                <div style={{ color: "var(--accent-gold)" }}>{upgradeReasonFull()}</div>
                                <Show when={nextLevelDef()}>
                                  <div style={{ "margin-top": "2px" }}>{upgradeCostTip()}</div>
                                </Show>
                              </Show>
                            </div>
                          </div>
                        </Show>
                        <div class="building-card-header">
                          <div class="building-card-icon">{building.icon}</div>
                          <div>
                            <div class="building-card-title">{building.name}</div>
                            <div
                              class="building-card-level"
                              classList={{ "not-built": level() === 0 }}
                            >
                              {level() === 0
                                ? "Not built"
                                : `Level ${level()} / ${effMax()}`}
                            </div>
                          </div>
                        </div>
                        <div class="building-card-desc">{building.description}</div>
                        {currentLevel()?.production && (
                          <div class="building-card-production">
                            Producing: +{currentLevel()!.production!.rate}/h{" "}
                            {currentLevel()!.production!.resource}
                          </div>
                        )}
                        {pb()?.damaged && (
                          <div class="building-card-upgrading" style={{ color: "var(--accent-red)" }}>
                            Damaged — not producing
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
                    <div class="building-card locked">
                      <div class="building-card-header">
                        <div class="building-card-icon locked-icon">{building.icon}</div>
                        <div>
                          <div class="building-card-title locked-title">{building.name}</div>
                          <div class="building-card-level locked-req">
                            {getUnlockRequirement(building)}
                          </div>
                        </div>
                      </div>
                      <div class="building-card-desc">{building.description}</div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        )}
      </For>
    </div>
  );
}
