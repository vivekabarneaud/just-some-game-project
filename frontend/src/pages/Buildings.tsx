import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { BUILDINGS, isBuildingUnlocked, getUnlockRequirement, getNextTierForLevels, applyMasonCostReduction, applyMasonTimeReduction, type BuildingDefinition } from "~/data/buildings";
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
                    return `${cost.wood}w ${cost.stone}s · ${m}m`;
                  };

                  return unlocked() ? (
                    <A href={`/buildings/${building.id}`} style={{ "text-decoration": "none" }}>
                      <div class="building-card" classList={{ upgrading: isUpgrading() }} style={{ opacity: pb()?.damaged ? 0.7 : 1, position: "relative" }}>
                        {/* Upgrade indicator */}
                        <Show when={!isUpgrading() && level() > 0}>
                          <div
                            title={canUpgradeNow() ? `Upgrade to Lv.${level() + 1} — ${upgradeCostTip()}` : upgradeReason()}
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
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
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              if (canUpgradeNow()) {
                                e.preventDefault();
                                e.stopPropagation();
                                actions.upgradeBuilding(building.id);
                              }
                            }}
                          >
                            ↑
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
