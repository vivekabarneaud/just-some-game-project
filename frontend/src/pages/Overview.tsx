import { createSignal, For, Show, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { BUILDINGS, getSettlementName, SETTLEMENT_TIERS } from "~/data/buildings";
import { RESOURCES } from "~/data/resources";
import { SEASON_META } from "~/data/seasons";
import { getRaid } from "~/data/raids";
import { useGame } from "~/engine/gameState";
import Countdown from "~/components/Countdown";

export default function Overview() {
  const { state, actions } = useGame();

  const rates = () => actions.getProductionRates();
  const foodCons = () => actions.getFoodConsumption();
  const caps = () => actions.getStorageCaps();
  const tier = () => actions.getSettlementTier();
  const thLevel = () => actions.getTownHallLevel();
  const defense = () => actions.getDefense();

  const [raidResults, setRaidResults] = createSignal<ReturnType<typeof actions.collectRaidLog>>([]);

  onMount(() => {
    const log = actions.collectRaidLog();
    if (log.length > 0) setRaidResults(log);
  });

  const upgradingBuildings = () =>
    state.buildings.filter((b) => b.upgrading && b.upgradeRemaining);

  const topBuildings = () =>
    [...state.buildings]
      .filter((b) => b.level > 0)
      .sort((a, b) => b.level - a.level)
      .slice(0, 5);

  const netRate = (id: string) => {
    const r = rates();
    const base = r[id as keyof typeof r] as number;
    if (id === "food") return base - foodCons();
    return base;
  };

  const nextTier = () => {
    const current = tier();
    const idx = SETTLEMENT_TIERS.findIndex((t) => t.tier === current);
    if (idx < SETTLEMENT_TIERS.length - 1) return SETTLEMENT_TIERS[idx + 1];
    return null;
  };

  return (
    <div>
      <h1 class="page-title">
        {getSettlementName(tier())} of {state.villageName}
      </h1>
      <div class="overview-grid">
        <div class="overview-panel">
          <h2>Production Overview</h2>
          <For each={RESOURCES}>
            {(res) => {
              const rate = () => netRate(res.id);
              return (
                <div class="stat-row">
                  <span class="stat-label">
                    {res.icon} {res.name}
                  </span>
                  <span
                    class="stat-value"
                    style={{
                      color:
                        rate() > 0
                          ? "var(--accent-green)"
                          : rate() < 0
                            ? "var(--accent-red)"
                            : "var(--text-secondary)",
                    }}
                  >
                    {rate() >= 0 ? "+" : ""}
                    {Math.round(rate())}/h
                  </span>
                </div>
              );
            }}
          </For>
          <div class="stat-row" style={{ "margin-top": "8px", "border-top": "1px solid var(--border-highlight)" }}>
            <span class="stat-label">Material Storage</span>
            <span class="stat-value">{caps().wood.toLocaleString()}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Food Storage</span>
            <span class="stat-value">{caps().food.toLocaleString()}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Treasury</span>
            <span class="stat-value">{caps().gold.toLocaleString()}</span>
          </div>
        </div>

        <div class="overview-panel">
          <h2>Building Activity</h2>
          <div class="stat-row" style={{ "margin-bottom": "8px" }}>
            <span class="stat-label">Queue</span>
            <span class="stat-value">
              {actions.getActiveQueueCount()} / {actions.getMasonBonuses().queueSlots}
            </span>
          </div>
          <Show
            when={upgradingBuildings().length > 0}
            fallback={
              <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
                No construction in progress
              </p>
            }
          >
            <For each={upgradingBuildings()}>
              {(pb) => {
                const def = BUILDINGS.find((b) => b.id === pb.buildingId)!;
                return (
                  <div class="stat-row">
                    <span class="stat-label">
                      {def.icon} {def.name} → Lv. {pb.level + 1}
                    </span>
                    <span class="stat-value" style={{ color: "var(--accent-blue)" }}>
                      <Countdown remainingSeconds={pb.upgradeRemaining!} />
                    </span>
                  </div>
                );
              }}
            </For>
          </Show>
        </div>

        <div class="overview-panel">
          <h2>Top Buildings</h2>
          <For each={topBuildings()}>
            {(pb) => {
              const def = BUILDINGS.find((b) => b.id === pb.buildingId)!;
              return (
                <div class="stat-row">
                  <span class="stat-label">
                    {def.icon} {def.name}
                  </span>
                  <span class="stat-value">Level {pb.level}</span>
                </div>
              );
            }}
          </For>
          <div style={{ "margin-top": "12px" }}>
            <A href="/buildings" style={{ color: "var(--accent-gold)", "font-size": "0.85rem" }}>
              View all buildings →
            </A>
          </div>
        </div>

        <div class="overview-panel">
          <h2>Settlement Status</h2>
          <div class="stat-row">
            <span class="stat-label">Settlement</span>
            <span class="stat-value" style={{ color: "var(--accent-gold)" }}>
              {getSettlementName(tier())}
            </span>
          </div>
          <Show when={nextTier()}>
            {(nt) => (
              <div class="stat-row">
                <span class="stat-label">Next tier</span>
                <span class="stat-value">
                  {nt().name} (TH {nt().minTownHall})
                </span>
              </div>
            )}
          </Show>
          <div class="stat-row">
            <span class="stat-label">Population</span>
            <span class="stat-value">
              {Math.floor(state.population)} / {actions.getMaxPopulation()}
            </span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Food Balance</span>
            <span
              class="stat-value"
              style={{
                color: netRate("food") >= 0 ? "var(--accent-green)" : "var(--accent-red)",
              }}
            >
              {netRate("food") >= 0 ? "Surplus" : "Deficit"} ({Math.round(netRate("food"))}/h)
            </span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Season</span>
            <span class="stat-value" style={{ color: SEASON_META[state.season].color }}>
              {SEASON_META[state.season].icon} {SEASON_META[state.season].name}, Year {state.year}
            </span>
          </div>
        </div>

        {/* Threats & Defense */}
        <div class="overview-panel">
          <h2>Threats & Defense</h2>
          <div class="stat-row">
            <span class="stat-label">Defense Score</span>
            <span class="stat-value" style={{ color: defense().total > 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
              {defense().total}
            </span>
          </div>
          <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-bottom": "8px" }}>
            {defense().watchtower > 0 && <span>Watchtower +{defense().watchtower} · </span>}
            {defense().barracks > 0 && <span>Barracks +{defense().barracks} · </span>}
            {defense().walls > 0 && <span>Walls +{defense().walls} · </span>}
            {defense().adventurers > 0 && <span>Adventurers +{defense().adventurers} · </span>}
            <span>Citizens +{defense().population}</span>
          </div>

          <Show when={state.incomingRaids.length > 0} fallback={
            <div style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
              No threats detected. Next scout report in ~{Math.ceil(state.nextRaidIn)}h.
            </div>
          }>
            <For each={state.incomingRaids}>
              {(ir) => {
                const raid = () => getRaid(ir.raidId);
                const isWinnable = () => defense().total >= ir.strength;
                return (
                  <div style={{
                    padding: "8px 10px",
                    "margin-bottom": "6px",
                    "border-radius": "6px",
                    background: "rgba(231, 76, 60, 0.1)",
                    border: "1px solid var(--accent-red)",
                  }}>
                    <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                      <span style={{ color: "var(--accent-red)", "font-size": "0.9rem" }}>
                        {raid()?.icon} {raid()?.name ?? ir.raidId}
                      </span>
                      <span style={{ color: "var(--accent-red)", "font-size": "0.85rem" }}>
                        <Countdown remainingSeconds={ir.remaining} />
                      </span>
                    </div>
                    <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-top": "4px" }}>
                      {raid()?.description}
                    </div>
                    <div style={{ "font-size": "0.8rem", "margin-top": "4px" }}>
                      <span style={{ color: "var(--text-muted)" }}>
                        Strength: {ir.strength} vs your defense: {defense().total}
                      </span>
                      {" — "}
                      <span style={{ color: isWinnable() ? "var(--accent-green)" : "var(--accent-red)" }}>
                        {isWinnable() ? "Defendable" : "Overwhelmed!"}
                      </span>
                    </div>
                    <Show when={raid()?.tags}>
                      <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "2px" }}>
                        {raid()!.tags.join(", ")}
                      </div>
                    </Show>
                  </div>
                );
              }}
            </For>
          </Show>
        </div>

        {/* Raid Results */}
        <Show when={raidResults().length > 0}>
          <div class="overview-panel">
            <h2>Recent Raid Results</h2>
            <For each={raidResults()}>
              {(result) => {
                const raid = () => getRaid(result.raidId);
                return (
                  <div style={{
                    padding: "8px 10px",
                    "margin-bottom": "6px",
                    "border-radius": "6px",
                    background: result.victory ? "rgba(46, 204, 113, 0.1)" : "rgba(231, 76, 60, 0.1)",
                    border: `1px solid ${result.victory ? "var(--accent-green)" : "var(--accent-red)"}`,
                    "font-size": "0.85rem",
                  }}>
                    <div style={{ color: result.victory ? "var(--accent-green)" : "var(--accent-red)" }}>
                      {result.victory ? "Victory" : "Defeated"}: {raid()?.icon} {raid()?.name ?? result.raidId}
                      <span style={{ color: "var(--text-muted)", "margin-left": "8px" }}>
                        (def {result.defenseScore} vs str {result.raidStrength})
                      </span>
                    </div>
                    <Show when={!result.victory}>
                      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-top": "4px" }}>
                        {(result.resourcesLost.gold + result.resourcesLost.wood + result.resourcesLost.stone + result.resourcesLost.food) > 0 && (
                          <span>
                            Lost: {result.resourcesLost.gold > 0 && `${result.resourcesLost.gold}g `}
                            {result.resourcesLost.wood > 0 && `${result.resourcesLost.wood}w `}
                            {result.resourcesLost.stone > 0 && `${result.resourcesLost.stone}s `}
                            {result.resourcesLost.food > 0 && `${result.resourcesLost.food}f `}
                          </span>
                        )}
                        {result.citizensLost > 0 && (
                          <span style={{ color: "var(--accent-red)" }}>
                            · {result.citizensLost} citizen{result.citizensLost > 1 ? "s" : ""} lost
                          </span>
                        )}
                      </div>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
}
