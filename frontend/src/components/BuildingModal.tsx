import { Show, createSignal, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { A } from "@solidjs/router";
import {
  BUILDINGS,
  isBuildingUnlocked,
  isBuildingChapterUnlocked,
  getTierPrerequisitesMet,
  getUnlockRequirement,
  getNextLevelRequirement,
  applyMasonCostReduction,
  applyMasonTimeReduction,
  getRepairCost,
  getBuildingImage,
  isStaffable,
  buildingWorkspace,
  PANIC_BUILD_IDS,
  PANIC_BUILD_SHARD_COST,
} from "~/data/buildings";
import { RESOURCES } from "~/data/resources";
import { useGame } from "~/engine/gameState";
import Countdown from "~/components/Countdown";
import Tooltip from "~/components/Tooltip";
import BuildingStaffSection from "~/components/BuildingStaffSection";
import BreweryManageModal from "~/components/BreweryManageModal";
import { formatTimeLong as formatTime } from "~/utils/format";

const COST_RESOURCES = RESOURCES.filter((r) => r.id === "wood" || r.id === "stone");

interface Props {
  buildingId: string;
  onClose: () => void;
}

/**
 * The building hub — one modal for every building, opened from its card. Holds
 * everything the old /buildings/:id page did (build/upgrade/repair/panic/cancel,
 * production preview) plus the staff section and any building-specific control
 * (the cistern sluice). Buildings with a dedicated workspace page (crafting,
 * tavern, guild, market) get a summary + an "Open ..." link instead of an embed.
 */
export default function BuildingModal(props: Props) {
  const { state, actions } = useGame();
  const [exiting, setExiting] = createSignal(false);
  const [breweryOpen, setBreweryOpen] = createSignal(false);

  const close = () => { setExiting(true); setTimeout(() => props.onClose(), 180); };
  createEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  const id = () => props.buildingId;
  const building = () => BUILDINGS.find((b) => b.id === id());
  const playerBuilding = () => state.buildings.find((b) => b.buildingId === id());
  const level = () => playerBuilding()?.level ?? 0;

  const unlocked = () => {
    const b = building();
    return b ? isBuildingUnlocked(b, actions.getTownHallLevel()) && isBuildingChapterUnlocked(b, state) : false;
  };

  const currentLevel = () => {
    const pb = playerBuilding();
    const b = building();
    if (!b || !pb || pb.level === 0) return null;
    return b.levels[pb.level - 1];
  };

  const effectiveMax = () => actions.getEffectiveMaxLevel(id());

  const nextLevel = () => {
    const b = building();
    if (!b) return null;
    if (level() >= effectiveMax()) return null;
    return b.levels[level()];
  };

  const masonLevel = () => actions.getMasonLevel();
  const effectiveMasonLvl = () => id() === "masons_guild" ? 0 : masonLevel();

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

  const queueFull = () => actions.getActiveQueueCount() >= actions.getMasonBonuses().queueSlots;

  const tierPrereqs = () => id() === "town_hall"
    ? getTierPrerequisitesMet(level() + 1, state.buildings)
    : { met: true, missing: [] as string[] };

  const canUpgrade = () => {
    if (!unlocked()) return false;
    const cost = adjustedCost();
    if (!cost) return false;
    if (playerBuilding()?.upgrading) return false;
    if (queueFull()) return false;
    if (!tierPrereqs().met) return false;
    return actions.canAfford(cost);
  };

  const panicEligible = () => {
    if (!PANIC_BUILD_IDS.includes(id())) return false;
    const pb = playerBuilding();
    if (!pb || pb.level > 0 || pb.upgrading) return false;
    if (!tierPrereqs().met) return false;
    const cost = adjustedCost();
    if (!cost) return false;
    return !actions.canAfford(cost);
  };
  const canPanicBuild = () => panicEligible() && state.astralShards >= PANIC_BUILD_SHARD_COST;

  const nextLevelReq = () => {
    const b = building();
    if (!b) return null;
    return getNextLevelRequirement(b, actions.getTownHallLevel());
  };

  const image = () => getBuildingImage(building()!, level());
  const workspace = () => buildingWorkspace(id());
  const sluiceOpen = () => state.cisternSluiceOpen ?? false;

  return (
    <Portal>
      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.78)", "z-index": 1050,
          display: "flex", "align-items": "center", "justify-content": "center", padding: "24px",
          opacity: exiting() ? 0 : 1, transition: "opacity 0.18s ease",
        }}
        onClick={close}
      >
        <Show when={building()}>
          {(b) => (
            <div
              style={{
                "max-width": "480px", width: "100%", background: "var(--bg-secondary)",
                border: "2px solid var(--accent-gold)", "border-radius": "0",
                color: "var(--text-primary)", "max-height": "88vh", overflow: "auto",
                "box-shadow": "0 10px 40px rgba(0, 0, 0, 0.6)",
                transform: exiting() ? "scale(0.98)" : "scale(1)", transition: "transform 0.18s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — image banner when we have art, else icon. */}
              <div style={{ position: "relative" }}>
                <Show when={image()}>
                  <div style={{ position: "relative", height: "128px", overflow: "hidden", "border-bottom": "1px solid var(--accent-gold)" }}>
                    <img src={image()!} alt="" style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1))" }} />
                  </div>
                </Show>
                <button
                  onClick={close}
                  style={{
                    position: "absolute", top: "8px", right: "10px", background: "rgba(0,0,0,0.4)",
                    border: "none", color: "var(--text-secondary)", "font-size": "1.2rem", cursor: "pointer",
                    "line-height": 1, width: "28px", height: "28px", "border-radius": "0",
                  }}
                >✕</button>
                <div style={{
                  display: "flex", "align-items": "center", gap: "12px", padding: "14px 20px",
                  ...(image() ? { position: "absolute", bottom: 0, left: 0, right: 0 } : {}),
                }}>
                  <Show when={!image()}>
                    <div style={{ "font-size": "2rem" }}>{b().icon}</div>
                  </Show>
                  <div>
                    <div style={{ "font-family": "var(--font-heading)", "font-size": "1.3rem", color: "var(--text-primary)" }}>{b().name}</div>
                    <div style={{ color: "var(--text-secondary)", "font-size": "0.8rem" }}>
                      {!unlocked()
                        ? getUnlockRequirement(b())
                        : level() === 0
                          ? "Not yet built"
                          : `Level ${level()} / ${effectiveMax()}${effectiveMax() < b().maxLevel ? ` (max ${b().maxLevel})` : ""}`}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "16px 20px 20px" }}>
                <p style={{ color: "var(--text-secondary)", "font-size": "0.88rem", "line-height": 1.5, "margin-bottom": "18px" }}>
                  {b().description}
                </p>

                <Show when={!unlocked()}>
                  <div style={{
                    padding: "12px", background: "rgba(106, 100, 88, 0.1)", border: "1px solid var(--text-muted)",
                    color: "var(--text-muted)", "text-align": "center", "font-size": "0.85rem",
                  }}>
                    {getUnlockRequirement(b())}
                  </div>
                </Show>

                <Show when={unlocked()}>
                  {/* Workspace link — dense pages stay pages; the modal just points there. */}
                  <Show when={workspace() && level() > 0}>
                    <A
                      href={workspace()!.route}
                      style={{
                        display: "flex", "align-items": "center", "justify-content": "center", gap: "6px",
                        "margin-bottom": "18px", padding: "10px", "text-decoration": "none",
                        background: "rgba(212, 175, 55, 0.12)", border: "1px solid var(--accent-gold)",
                        color: "var(--accent-gold)", "font-size": "0.9rem",
                      }}
                    >
                      {workspace()!.label} →
                    </A>
                  </Show>

                  {/* Cistern sluice — the one live control on a built cistern. */}
                  <Show when={id() === "cistern" && level() > 0}>
                    <div style={{
                      "margin-bottom": "18px", padding: "14px", background: "var(--bg-card)",
                      border: `1px solid ${sluiceOpen() ? "var(--accent-blue)" : "var(--accent-gold)"}`,
                    }}>
                      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", gap: "12px", "flex-wrap": "wrap" }}>
                        <div>
                          <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>🚪 The Sluice Gate</div>
                          <div style={{ "font-size": "1.05rem", color: sluiceOpen() ? "var(--accent-blue)" : "var(--accent-gold)" }}>
                            {sluiceOpen() ? "Open — running the reserve low" : "Shut — banking water"}
                          </div>
                        </div>
                        <button class="upgrade-btn" onClick={() => actions.toggleSluice()} style={{ "font-size": "0.85rem", padding: "8px 16px" }}>
                          {sluiceOpen() ? "Shut the sluice" : "Open the sluice"}
                        </button>
                      </div>
                      <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-top": "10px", "font-style": "italic", "line-height": 1.4 }}>
                        {sluiceOpen()
                          ? "The stream and rain flow past instead of banking, and the reserve drains low. A downpour can't back up and drown the fields, but you hold no buffer against a heat wave."
                          : "The stream and rain fill the reserve, a buffer to see the crops through dry spells and heat waves. But a downpour landing on a full cistern backs up and drowns the fields."}
                      </div>
                      <div style={{ "font-size": "0.74rem", color: "var(--text-muted)", "margin-top": "6px" }}>
                        Read the year: shut it against a dry year's heat, open it in a wet year's downpours.
                      </div>
                    </div>
                  </Show>

                  {/* Brewery — its own manager (stacked modal). */}
                  <Show when={id() === "brewery" && level() > 0}>
                    <button class="btn-secondary" onClick={() => setBreweryOpen(true)} style={{ "margin-bottom": "18px" }}>
                      ⚙ Manage brewing
                    </button>
                  </Show>

                  {/* Staff section (folded in from the old StaffManageModal). */}
                  <Show when={isStaffable(id()) && level() > 0}>
                    <BuildingStaffSection buildingId={id()} />
                  </Show>

                  {/* Current production. */}
                  <Show when={currentLevel()?.production}>
                    {(prod) => (
                      <div style={{ "margin-bottom": "18px", padding: "10px", background: "var(--bg-card)" }}>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>Current Production</div>
                        <div style={{ "font-size": "1.1rem", color: "var(--accent-green)" }}>+{prod().rate}/h {prod().resource}</div>
                        <Show when={id() === "forager_hut"}>
                          <div style={{ "font-size": "0.9rem", color: "var(--accent-green)", "margin-top": "4px" }}>
                            +{(level() * 1.5).toFixed(1)}/h fiber (wild flax)
                          </div>
                        </Show>
                      </div>
                    )}
                  </Show>

                  {/* Active upgrade with cancel. */}
                  <Show when={playerBuilding()?.upgrading && playerBuilding()?.upgradeRemaining}>
                    <div style={{
                      "margin-bottom": "18px", padding: "12px", background: "rgba(52, 152, 219, 0.1)",
                      border: "1px solid var(--accent-blue)", color: "var(--accent-blue)",
                      display: "flex", "justify-content": "space-between", "align-items": "center",
                    }}>
                      <span>
                        Upgrading to Level {level() + 1} — <Countdown remainingSeconds={playerBuilding()!.upgradeRemaining!} /> remaining
                      </span>
                      <button class="btn-secondary" onClick={() => actions.cancelBuild(id())} style={{ "font-size": "0.8rem" }}>Cancel</button>
                    </div>
                  </Show>

                  {/* Damaged → repair. */}
                  <Show when={playerBuilding()?.damaged}>
                    <div style={{ "margin-bottom": "18px", padding: "12px", background: "rgba(231, 76, 60, 0.1)", border: "1px solid var(--accent-red)" }}>
                      <div style={{ color: "var(--accent-red)", "margin-bottom": "8px" }}>
                        This building is damaged and inactive. Repair it to restore function.
                      </div>
                      <button
                        class="upgrade-btn"
                        disabled={
                          state.resources.wood < getRepairCost(building()!, level()).wood ||
                          state.resources.stone < getRepairCost(building()!, level()).stone
                        }
                        onClick={() => actions.repairBuilding(id())}
                        style={{ "font-size": "0.85rem", padding: "6px 14px" }}
                      >
                        Repair ({getRepairCost(building()!, level()).wood} wood, {getRepairCost(building()!, level()).stone} stone)
                      </button>
                    </div>
                  </Show>

                  {/* Queue full note. */}
                  <Show when={queueFull() && !playerBuilding()?.upgrading}>
                    <div style={{
                      "margin-bottom": "18px", padding: "10px", background: "rgba(245, 197, 66, 0.1)",
                      border: "1px solid var(--accent-gold)", color: "var(--accent-gold)", "font-size": "0.85rem",
                    }}>
                      Build queue full ({actions.getActiveQueueCount()}/{actions.getMasonBonuses().queueSlots})
                      {masonLevel() === 0 ? " — Build a Mason's Guild to unlock more slots" : " — Upgrade Mason's Guild for more slots"}
                    </div>
                  </Show>

                  {/* Build / upgrade. */}
                  <Show when={nextLevel()}>
                    {(next) => (
                      <>
                        <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "12px", color: "var(--text-primary)" }}>
                          {level() === 0 ? "Build Cost" : `Upgrade to Level ${level() + 1}`}
                        </h3>

                        <div class="cost-grid cost-grid-2">
                          {COST_RESOURCES.map((res) => {
                            const resId = res.id as "wood" | "stone";
                            return (
                              <div class="cost-item">
                                <div class="cost-item-icon">{res.icon}</div>
                                <div class="cost-item-amount" classList={{ affordable: canAffordRes(res.id), "too-expensive": !canAffordRes(res.id) }}>
                                  {adjustedCost()![resId] < next().cost[resId] && (
                                    <span style={{ "text-decoration": "line-through", opacity: 0.5, "margin-right": "4px", "font-size": "0.8em" }}>
                                      {next().cost[resId].toLocaleString()}
                                    </span>
                                  )}
                                  {adjustedCost()![resId].toLocaleString()}
                                </div>
                                <div class="cost-item-label">{res.name}</div>
                              </div>
                            );
                          })}
                        </div>

                        <Show when={next().production && !currentLevel()?.production}>
                          <div class="stat-row">
                            <span class="stat-label">Production</span>
                            <span class="stat-value" style={{ color: "var(--accent-green)" }}>
                              +{next().production!.rate}/h {next().production!.resource}
                            </span>
                          </div>
                        </Show>

                        <Show when={actions.getBuildingEffect(id(), level() + 1)}>
                          {(effect) => <div class="building-effect">{effect()}</div>}
                        </Show>

                        <div class="build-time">
                          Build time:{" "}
                          {adjustedTime()! < next().buildTime && (
                            <span style={{ "text-decoration": "line-through", opacity: 0.5, "margin-right": "4px" }}>{formatTime(next().buildTime)}</span>
                          )}
                          {formatTime(adjustedTime()!)}
                        </div>

                        <div style={{ "margin-top": "18px" }}>
                          <Show when={!tierPrereqs().met}>
                            <div style={{
                              "margin-bottom": "10px", padding: "10px", background: "rgba(245, 197, 66, 0.1)",
                              border: "1px solid var(--accent-gold)", color: "var(--accent-gold)", "font-size": "0.85rem",
                            }}>
                              🔒 Requires: {tierPrereqs().missing.join(", ")}
                            </div>
                          </Show>
                          <button class="upgrade-btn" disabled={!canUpgrade()} onClick={() => actions.upgradeBuilding(id())}>
                            {level() === 0 ? `Build ${b().name}` : `Upgrade to Level ${level() + 1}`}
                          </button>
                          <Show when={panicEligible()}>
                            <Tooltip block style={{ "margin-top": "8px" }} text={canPanicBuild()
                              ? `Soft-lock recovery: spend ${PANIC_BUILD_SHARD_COST} astral shards to build instantly`
                              : `Need ${PANIC_BUILD_SHARD_COST - state.astralShards} more astral shards`}>
                              <button
                                class="btn-secondary"
                                disabled={!canPanicBuild()}
                                onClick={() => actions.panicBuildBuilding(id())}
                                style={{ width: "100%", "justify-content": "center" }}
                              >
                                ✨ Use {PANIC_BUILD_SHARD_COST} Astral Shards to build instantly
                              </button>
                            </Tooltip>
                            <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "4px", "text-align": "center" }}>
                              Stuck? This skips the resource cost.
                            </div>
                          </Show>
                        </div>
                      </>
                    )}
                  </Show>

                  <Show when={level() >= effectiveMax() && !nextLevel()}>
                    <div style={{
                      padding: "12px", background: "rgba(245, 197, 66, 0.1)", border: "1px solid var(--accent-gold)",
                      color: "var(--accent-gold)", "text-align": "center", "font-family": "var(--font-heading)",
                    }}>
                      {level() >= b().maxLevel
                        ? "Maximum Level Reached"
                        : `Capped by Town Hall — upgrade Town Hall to lvl ${nextLevelReq()?.requiredTownHallLevel} to raise this cap`}
                    </div>
                  </Show>
                </Show>
              </div>
            </div>
          )}
        </Show>
      </div>
      <Show when={breweryOpen()}>
        <BreweryManageModal onClose={() => setBreweryOpen(false)} />
      </Show>
    </Portal>
  );
}
