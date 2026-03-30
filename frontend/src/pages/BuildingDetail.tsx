import { Show } from "solid-js";
import { A, useParams } from "@solidjs/router";
import {
  BUILDINGS,
  isBuildingUnlocked,
  getUnlockRequirement,
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

  const nextLevel = () => {
    const pb = playerBuilding();
    const b = building();
    if (!b) return null;
    const lvl = pb?.level ?? 0;
    if (lvl >= b.maxLevel) return null;
    return b.levels[lvl];
  };

  const canAffordRes = (resourceId: string) => {
    const next = nextLevel();
    if (!next) return true;
    const cost = next.cost[resourceId as keyof typeof next.cost];
    if (cost === undefined) return true;
    const have = state.resources[resourceId as keyof typeof state.resources] as number;
    return have >= cost;
  };

  const canUpgrade = () => {
    if (!unlocked()) return false;
    const next = nextLevel();
    if (!next) return false;
    const pb = playerBuilding();
    if (pb?.upgrading) return false;
    if (state.buildings.some((b) => b.upgrading)) return false;
    return actions.canAfford(next.cost);
  };

  const handleUpgrade = () => {
    actions.upgradeBuilding(params.id);
  };

  return (
    <div>
      <A href="/buildings" class="back-link">
        ← Back to Buildings
      </A>

      <Show when={building()} fallback={<p>Building not found.</p>}>
        {(b) => (
          <div class="building-detail">
            <div class="building-detail-header">
              <div class="building-detail-icon">{b().icon}</div>
              <div>
                <div class="building-detail-title">{b().name}</div>
                <div style={{ color: "var(--text-secondary)", "font-size": "0.85rem" }}>
                  {!unlocked()
                    ? getUnlockRequirement(b())
                    : (playerBuilding()?.level ?? 0) === 0
                      ? "Not yet built"
                      : `Level ${playerBuilding()!.level} / ${b().maxLevel}`}
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
                  </div>
                )}
              </Show>

              <Show when={nextLevel()?.production && currentLevel()?.production}>
                {() => (
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
                )}
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
                  }}
                >
                  Upgrading to Level {(playerBuilding()?.level ?? 0) + 1} —{" "}
                  <Countdown remainingSeconds={playerBuilding()!.upgradeRemaining!} /> remaining
                </div>
              </Show>

              <Show when={state.buildings.some((b) => b.upgrading) && !playerBuilding()?.upgrading}>
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
                  Build queue full — another building is under construction
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
                        const cost = next().cost[res.id as keyof typeof next.cost];
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
                              {cost.toLocaleString()}
                            </div>
                            <div class="cost-item-label">{res.name}</div>
                          </div>
                        );
                      })}
                    </div>

                    <Show when={next().production && !currentLevel()?.production}>
                      {() => (
                        <div class="stat-row">
                          <span class="stat-label">Production</span>
                          <span class="stat-value" style={{ color: "var(--accent-green)" }}>
                            +{next().production!.rate}/h {next().production!.resource}
                          </span>
                        </div>
                      )}
                    </Show>

                    <Show when={actions.getBuildingEffect(params.id, (playerBuilding()?.level ?? 0) + 1)}>
                      {(effect) => (
                        <div class="building-effect">
                          {effect()}
                        </div>
                      )}
                    </Show>

                    <div class="build-time">Build time: {formatTime(next().buildTime)}</div>

                    <div style={{ "margin-top": "20px" }}>
                      <button class="upgrade-btn" disabled={!canUpgrade()} onClick={handleUpgrade}>
                        {(playerBuilding()?.level ?? 0) === 0
                          ? `Build ${b().name}`
                          : `Upgrade to Level ${(playerBuilding()?.level ?? 0) + 1}`}
                      </button>
                    </div>
                  </>
                )}
              </Show>

              <Show when={(playerBuilding()?.level ?? 0) >= b().maxLevel}>
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
                  Maximum Level Reached
                </div>
              </Show>
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
}
