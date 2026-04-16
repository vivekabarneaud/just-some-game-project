import { Show } from "solid-js";
import { A, useParams } from "@solidjs/router";
import {
  BUILDINGS,
  isBuildingUnlocked,
  getTierPrerequisitesMet,
  type SettlementTier,
  getUnlockRequirement,
  getNextTierForLevels,
  applyMasonCostReduction,
  applyMasonTimeReduction,
  getRepairCost,
  getBuildingImage,
} from "~/data/buildings";
import { RESOURCES } from "~/data/resources";
import { useGame } from "~/engine/gameState";
import Countdown from "~/components/Countdown";

const COST_RESOURCES = RESOURCES.filter((r) => r.id === "wood" || r.id === "stone");

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}


export default function BuildingDetail() {
  const params = useParams<{ id: string }>();
  const { state, actions } = useGame();

  const building = () => BUILDINGS.find((b) => b.id === params.id);
  const playerBuilding = () => state.buildings.find((b) => b.buildingId === params.id);
  const unlocked = () => {
    const b = building();
    return b ? isBuildingUnlocked(b, actions.getTownHallLevel()) : false;
  };

  const currentLevel = () => {
    const pb = playerBuilding();
    const b = building();
    if (!b || !pb || pb.level === 0) return null;
    return b.levels[pb.level - 1];
  };

  const effectiveMax = () => actions.getEffectiveMaxLevel(params.id);

  const nextLevel = () => {
    const pb = playerBuilding();
    const b = building();
    if (!b) return null;
    const lvl = pb?.level ?? 0;
    if (lvl >= effectiveMax()) return null;
    return b.levels[lvl];
  };

  const masonLevel = () => actions.getMasonLevel();
  const effectiveMasonLvl = () => params.id === "masons_guild" ? 0 : masonLevel();

  const adjustedCost = () => {
    const next = nextLevel();
    if (!next) return null;
    return applyMasonCostReduction(next.cost, effectiveMasonLvl());
  };

  const adjustedTime = () => {
    const next = nextLevel();
    if (!next) return null;
    return applyMasonTimeReduction(next.buildTime, effectiveMasonLvl());
  };

  const canAffordRes = (resourceId: string) => {
    const cost = adjustedCost();
    if (!cost) return true;
    const amount = cost[resourceId as keyof typeof cost];
    if (amount === undefined) return true;
    const have = state.resources[resourceId as keyof typeof state.resources] as number;
    return have >= amount;
  };

  const queueFull = () => {
    const bonuses = actions.getMasonBonuses();
    return actions.getActiveQueueCount() >= bonuses.queueSlots;
  };

  const tierPrereqs = () => params.id === "town_hall"
    ? getTierPrerequisitesMet((playerBuilding()?.level ?? 0) + 1, state.buildings)
    : { met: true, missing: [] as string[] };

  const canUpgrade = () => {
    if (!unlocked()) return false;
    const cost = adjustedCost();
    if (!cost) return false;
    const pb = playerBuilding();
    if (pb?.upgrading) return false;
    if (queueFull()) return false;
    if (!tierPrereqs().met) return false;
    return actions.canAfford(cost);
  };

  const handleUpgrade = () => {
    actions.upgradeBuilding(params.id);
  };

  const handleCancel = () => {
    actions.cancelBuild(params.id);
  };

  const tierCapInfo = () => {
    const b = building();
    if (!b) return null;
    const tier = actions.getSettlementTier();
    return getNextTierForLevels(b, tier);
  };

  return (
    <div>
      <A href="/buildings" class="back-link">
        ← Back to Buildings
      </A>

      <Show when={building()} fallback={<p>Building not found.</p>}>
        {(b) => {
          const effectiveImage = () => getBuildingImage(b(), actions.getSettlementTier());
          return (<>
          <Show when={effectiveImage()}>
            <div class="building-page-bg">
              <img src={effectiveImage()!} alt="" />
              <div class="building-page-bg-overlay" />
            </div>
          </Show>

          <div class="building-detail">
            <div class="building-detail-content">
              <div class="building-detail-header">
                <Show when={!effectiveImage()}>
                  <div class="building-detail-icon">{b().icon}</div>
                </Show>
                <div>
                  <div class="building-detail-title">{b().name}</div>
                  <div style={{ color: "var(--text-secondary)", "font-size": "0.85rem" }}>
                    {!unlocked()
                      ? getUnlockRequirement(b())
                      : (playerBuilding()?.level ?? 0) === 0
                        ? "Not yet built"
                        : `Level ${playerBuilding()!.level} / ${effectiveMax()}${effectiveMax() < b().maxLevel ? ` (max ${b().maxLevel})` : ""}`}
                  </div>
                </div>
              </div>

              <p class="building-detail-desc">{b().description}</p>

            <Show when={!unlocked()}>
              <div
                style={{
                  padding: "12px",
                  background: "rgba(106, 100, 88, 0.1)",
                  border: "1px solid var(--text-muted)",
                  "border-radius": "6px",
                  color: "var(--text-muted)",
                  "text-align": "center",
                }}
              >
                {getUnlockRequirement(b())}
              </div>
            </Show>

            <Show when={unlocked()}>
              <Show when={currentLevel()?.production}>
                {(prod) => (
                  <div
                    style={{
                      "margin-bottom": "20px",
                      padding: "10px",
                      background: "var(--bg-secondary)",
                      "border-radius": "6px",
                    }}
                  >
                    <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                      Current Production
                    </div>
                    <div style={{ "font-size": "1.1rem", color: "var(--accent-green)" }}>
                      +{prod().rate}/h {prod().resource}
                    </div>
                    <Show when={params.id === "forager_hut"}>
                      <div style={{ "font-size": "0.9rem", color: "var(--accent-green)", "margin-top": "4px" }}>
                        +{((playerBuilding()?.level ?? 0) * 1.5).toFixed(1)}/h fiber (wild flax)
                      </div>
                    </Show>
                  </div>
                )}
              </Show>

              <Show when={nextLevel()?.production && currentLevel()?.production}>
                <div
                  style={{
                    "margin-bottom": "20px",
                    padding: "10px",
                    background: "var(--bg-secondary)",
                    "border-radius": "6px",
                  }}
                >
                  <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                    After Upgrade
                  </div>
                  <div style={{ "font-size": "1.1rem", color: "var(--accent-green)" }}>
                    +{nextLevel()!.production!.rate}/h {nextLevel()!.production!.resource}{" "}
                    <span style={{ "font-size": "0.8rem", color: "var(--text-secondary)" }}>
                      (+{nextLevel()!.production!.rate - currentLevel()!.production!.rate}/h)
                    </span>
                  </div>
                </div>
              </Show>

              <Show when={playerBuilding()?.upgrading && playerBuilding()?.upgradeRemaining}>
                <div
                  style={{
                    "margin-bottom": "20px",
                    padding: "12px",
                    background: "rgba(52, 152, 219, 0.1)",
                    border: "1px solid var(--accent-blue)",
                    "border-radius": "6px",
                    color: "var(--accent-blue)",
                    display: "flex",
                    "justify-content": "space-between",
                    "align-items": "center",
                  }}
                >
                  <span>
                    Upgrading to Level {(playerBuilding()?.level ?? 0) + 1} —{" "}
                    <Countdown remainingSeconds={playerBuilding()!.upgradeRemaining!} /> remaining
                  </span>
                  <button
                    onClick={handleCancel}
                    style={{
                      background: "rgba(231, 76, 60, 0.2)",
                      border: "1px solid var(--accent-red)",
                      color: "var(--accent-red)",
                      padding: "4px 10px",
                      "border-radius": "4px",
                      cursor: "pointer",
                      "font-size": "0.8rem",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </Show>

              <Show when={playerBuilding()?.damaged}>
                <div style={{
                  "margin-bottom": "20px",
                  padding: "12px",
                  background: "rgba(231, 76, 60, 0.1)",
                  border: "1px solid var(--accent-red)",
                  "border-radius": "6px",
                }}>
                  <div style={{ color: "var(--accent-red)", "margin-bottom": "8px" }}>
                    This building is damaged and not producing! Repair it to restore function.
                  </div>
                  <button
                    class="upgrade-btn"
                    disabled={
                      state.resources.wood < getRepairCost(building()!, playerBuilding()!.level).wood ||
                      state.resources.stone < getRepairCost(building()!, playerBuilding()!.level).stone
                    }
                    onClick={() => actions.repairBuilding(params.id)}
                    style={{ "font-size": "0.85rem", padding: "6px 14px" }}
                  >
                    Repair ({getRepairCost(building()!, playerBuilding()!.level).wood} wood, {getRepairCost(building()!, playerBuilding()!.level).stone} stone)
                  </button>
                </div>
              </Show>

              <Show when={queueFull() && !playerBuilding()?.upgrading}>
                <div
                  style={{
                    "margin-bottom": "20px",
                    padding: "10px",
                    background: "rgba(245, 197, 66, 0.1)",
                    border: "1px solid var(--accent-gold)",
                    "border-radius": "6px",
                    color: "var(--accent-gold)",
                    "font-size": "0.85rem",
                  }}
                >
                  Build queue full ({actions.getActiveQueueCount()}/{actions.getMasonBonuses().queueSlots})
                  {masonLevel() === 0
                    ? " — Build a Mason's Guild to unlock more slots"
                    : " — Upgrade Mason's Guild for more slots"}
                </div>
              </Show>

              <Show when={nextLevel()}>
                {(next) => (
                  <>
                    <h3
                      style={{
                        "font-family": "var(--font-heading)",
                        "margin-bottom": "12px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {(playerBuilding()?.level ?? 0) === 0
                        ? "Build Cost"
                        : `Upgrade to Level ${(playerBuilding()?.level ?? 0) + 1}`}
                    </h3>

                    <div class="cost-grid cost-grid-2">
                      {COST_RESOURCES.map((res) => {
                        const resId = res.id as "wood" | "stone";
                        return (
                          <div class="cost-item">
                            <div class="cost-item-icon">{res.icon}</div>
                            <div
                              class="cost-item-amount"
                              classList={{
                                affordable: canAffordRes(res.id),
                                "too-expensive": !canAffordRes(res.id),
                              }}
                            >
                              {adjustedCost()![resId] < nextLevel()!.cost[resId] && (
                                <span style={{ "text-decoration": "line-through", opacity: 0.5, "margin-right": "4px", "font-size": "0.8em" }}>
                                  {nextLevel()!.cost[resId].toLocaleString()}
                                </span>
                              )}
                              {adjustedCost()![resId].toLocaleString()}
                            </div>
                            <div class="cost-item-label">{res.name}</div>
                          </div>
                        );
                      })}
                    </div>

                    <Show when={nextLevel()?.production && !currentLevel()?.production}>
                      <div class="stat-row">
                        <span class="stat-label">Production</span>
                        <span class="stat-value" style={{ color: "var(--accent-green)" }}>
                          +{nextLevel()!.production!.rate}/h {nextLevel()!.production!.resource}
                        </span>
                      </div>
                    </Show>

                    <Show when={actions.getBuildingEffect(params.id, (playerBuilding()?.level ?? 0) + 1)}>
                      {(effect) => (
                        <div class="building-effect">
                          {effect()}
                        </div>
                      )}
                    </Show>

                    <div class="build-time">
                      Build time:{" "}
                      {adjustedTime()! < next().buildTime && (
                        <span style={{ "text-decoration": "line-through", opacity: 0.5, "margin-right": "4px" }}>
                          {formatTime(next().buildTime)}
                        </span>
                      )}
                      {formatTime(adjustedTime()!)}
                    </div>

                    <div style={{ "margin-top": "20px" }}>
                      <Show when={!tierPrereqs().met}>
                      <div style={{
                        "margin-bottom": "10px",
                        padding: "10px",
                        background: "rgba(245, 197, 66, 0.1)",
                        border: "1px solid var(--accent-gold)",
                        "border-radius": "6px",
                        color: "var(--accent-gold)",
                        "font-size": "0.85rem",
                      }}>
                        🔒 Requires: {tierPrereqs().missing.join(", ")}
                      </div>
                    </Show>
                    <button class="upgrade-btn" disabled={!canUpgrade()} onClick={handleUpgrade}>
                        {(playerBuilding()?.level ?? 0) === 0
                          ? `Build ${b().name}`
                          : `Upgrade to Level ${(playerBuilding()?.level ?? 0) + 1}`}
                      </button>
                    </div>
                  </>
                )}
              </Show>

              <Show when={(playerBuilding()?.level ?? 0) >= effectiveMax() && !nextLevel()}>
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(245, 197, 66, 0.1)",
                    border: "1px solid var(--accent-gold)",
                    "border-radius": "6px",
                    color: "var(--accent-gold)",
                    "text-align": "center",
                    "font-family": "var(--font-heading)",
                  }}
                >
                  {(playerBuilding()?.level ?? 0) >= b().maxLevel
                    ? "Maximum Level Reached"
                    : `Level cap reached — Upgrade to ${tierCapInfo()?.name} to unlock up to Level ${tierCapInfo()?.maxLevel}`}
                </div>
              </Show>
            </Show>
            </div>{/* end building-detail-content */}
          </div>
        </>)}}
      </Show>
    </div>
  );
}
