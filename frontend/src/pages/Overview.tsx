import { createSignal, For, Show, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { BUILDINGS, getSettlementName, SETTLEMENT_TIERS } from "~/data/buildings";
import { RESOURCES } from "~/data/resources";
import { SEASON_META } from "~/data/seasons";
import { getRaid, calcRaidSuccessChance, getDefenseTips } from "~/data/raids";
import { getMission } from "~/data/missions";
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
  const [missionResults, setMissionResults] = createSignal<ReturnType<typeof actions.collectCompletedMissions>>([]);

  const collectAll = () => {
    const raidLog = actions.collectRaidLog();
    if (raidLog.length > 0) setRaidResults((prev) => [...raidLog, ...prev].slice(0, 10));
    const missionLog = actions.collectCompletedMissions();
    if (missionLog.length > 0) setMissionResults((prev) => [...missionLog, ...prev].slice(0, 10));
  };

  onMount(collectAll);
  // Check periodically for new results
  const checkInterval = setInterval(collectAll, 3000);
  import("solid-js").then(({ onCleanup }) => onCleanup(() => clearInterval(checkInterval)));

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

  const hasThreats = () => state.incomingRaids.length > 0;

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
          <Show when={state.season === "winter"}>
            <div style={{
              padding: "6px 10px",
              "margin-bottom": "8px",
              "border-radius": "6px",
              background: "rgba(135, 206, 235, 0.1)",
              border: "1px solid #87CEEB",
              "font-size": "0.8rem",
              color: "#87CEEB",
            }}>
              ❄️ Winter cold: consuming wood for heating ({Math.round(state.population * 0.5)}/h).
              {state.resources.wood <= 0 && <span style={{ color: "var(--accent-red)" }}> No wood — citizens are freezing!</span>}
            </div>
          </Show>
          <Show when={state.buildings.some((b) => b.damaged)}>
            <div style={{
              padding: "6px 10px",
              "margin-bottom": "8px",
              "border-radius": "6px",
              background: "rgba(231, 76, 60, 0.1)",
              border: "1px solid var(--accent-red)",
              "font-size": "0.8rem",
              color: "var(--accent-red)",
            }}>
              🔧 {state.buildings.filter((b) => b.damaged).length} building{state.buildings.filter((b) => b.damaged).length > 1 ? "s" : ""} damaged!{" "}
              <A href="/buildings" style={{ color: "var(--accent-gold)" }}>Repair them →</A>
            </div>
          </Show>
          <div class="stat-row">
            <span class="stat-label">Happiness</span>
            <span class="stat-value" style={{
              color: state.happiness >= 70 ? "var(--accent-green)" : state.happiness >= 40 ? "var(--accent-gold)" : "var(--accent-red)",
            }}>
              {state.happiness >= 70 ? "😊" : state.happiness >= 40 ? "😐" : "😟"} {state.happiness}%
              <span style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-left": "4px" }}>
                ({Math.round(actions.getHappinessModifier() * 100)}% production)
              </span>
            </span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Season</span>
            <span class="stat-value" style={{ color: SEASON_META[state.season].color }}>
              {SEASON_META[state.season].icon} {SEASON_META[state.season].name}, Year {state.year}
            </span>
          </div>
        </div>

        {/* Threats & Defense — moves to top when raids incoming */}
        <div class="overview-panel" style={{ order: hasThreats() ? -1 : 0 }}>
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
              No threats detected. Calm for {Math.floor(state.hoursSinceLastRaid)}h.
            </div>
          }>
            <For each={state.incomingRaids}>
              {(ir) => {
                const raid = () => getRaid(ir.raidId);
                const successPct = () => calcRaidSuccessChance(defense().total, ir.strength);
                const successColor = () =>
                  successPct() >= 80 ? "var(--accent-green)" :
                  successPct() >= 50 ? "var(--accent-gold)" : "var(--accent-red)";
                const onMissionCount = () => state.adventurers.filter((a) => a.onMission).length;
                const tips = () => getDefenseTips(defense(), ir.strength, state.buildings, onMissionCount());
                return (
                  <div style={{
                    padding: "10px 12px",
                    "margin-bottom": "8px",
                    "border-radius": "6px",
                    background: "rgba(231, 76, 60, 0.1)",
                    border: "1px solid var(--accent-red)",
                  }}>
                    <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                      <span style={{ color: "var(--accent-red)", "font-size": "0.9rem", "font-weight": "bold" }}>
                        {raid()?.icon} {raid()?.name ?? ir.raidId}
                      </span>
                      <span style={{ color: "var(--accent-red)", "font-size": "0.9rem" }}>
                        <Countdown remainingSeconds={ir.remaining} />
                      </span>
                    </div>
                    <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-top": "4px" }}>
                      {raid()?.description}
                    </div>

                    {/* Success chance */}
                    <div style={{ "margin-top": "8px", display: "flex", "align-items": "center", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", "justify-content": "space-between", "font-size": "0.8rem", "margin-bottom": "3px" }}>
                          <span style={{ color: "var(--text-muted)" }}>
                            Defense {defense().total} vs Strength {ir.strength}
                          </span>
                          <span style={{ color: successColor(), "font-weight": "bold" }}>
                            {successPct()}% success
                          </span>
                        </div>
                        <div style={{ height: "6px", background: "var(--bg-primary)", "border-radius": "3px" }}>
                          <div style={{
                            height: "100%",
                            width: `${successPct()}%`,
                            background: successColor(),
                            "border-radius": "3px",
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <Show when={raid()?.tags}>
                      <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "6px" }}>
                        {raid()!.tags.join(", ")}
                        {raid()!.stealsResources && " · steals resources"}
                        {raid()!.killsCitizens && " · kills citizens"}
                      </div>
                    </Show>

                    {/* Tips */}
                    <div style={{ "margin-top": "8px" }}>
                      <For each={tips()}>
                        {(tip) => (
                          <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-bottom": "3px" }}>
                            {tip.icon}{" "}
                            {tip.actionLink ? (
                              <A href={tip.actionLink} style={{ color: "var(--accent-gold)" }}>{tip.text}</A>
                            ) : (
                              tip.text
                            )}
                          </div>
                        )}
                      </For>
                    </div>

                    {/* Recall button */}
                    <Show when={onMissionCount() > 0}>
                      <button
                        onClick={() => {
                          const hasWiz = state.activeMissions.some((m) =>
                            m.adventurerIds.some((id) => state.adventurers.find((a) => a.id === id)?.class === "wizard")
                          );
                          const msg = hasWiz
                            ? `Recall ${onMissionCount()} adventurer(s)? Missions cancelled, but your wizard will teleport 30% of the loot home.`
                            : `Recall ${onMissionCount()} adventurer(s)? All active missions will be cancelled and rewards forfeited.`;
                          if (confirm(msg)) {
                            const result = actions.recallAdventurers();
                            // Could show a toast here
                          }
                        }}
                        style={{
                          "margin-top": "8px",
                          padding: "6px 14px",
                          background: "rgba(231, 76, 60, 0.2)",
                          border: "1px solid var(--accent-red)",
                          color: "var(--accent-red)",
                          "border-radius": "4px",
                          cursor: "pointer",
                          "font-size": "0.85rem",
                          width: "100%",
                        }}
                      >
                        Recall All Adventurers ({onMissionCount()} on missions)
                      </button>
                    </Show>
                  </div>
                );
              }}
            </For>
          </Show>
        </div>

        {/* Report Log — missions and raids */}
        <Show when={raidResults().length > 0 || missionResults().length > 0}>
          <div class="overview-panel">
            <h2>Report Log</h2>
            {/* Raid results */}
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
                      {result.victory ? "Raid repelled" : "Raid defeat"}: {raid()?.icon} {raid()?.name ?? result.raidId}
                    </div>
                    <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-top": "3px" }}>
                      Defense {result.defenseScore} vs strength {result.raidStrength}
                      {result.victory && result.loot.length > 0 && (
                        <span style={{ color: "var(--accent-green)" }}>
                          {" "}· Loot: {result.loot.map((l) => `+${l.amount} ${l.resource}`).join(", ")}
                        </span>
                      )}
                      {!result.victory && (
                        <span>
                          {(result.resourcesLost.gold + result.resourcesLost.wood + result.resourcesLost.stone + result.resourcesLost.food) > 0 && (
                            <span style={{ color: "var(--accent-red)" }}>
                              {" "}· Stolen: {result.resourcesLost.gold > 0 && `${result.resourcesLost.gold}g `}
                              {result.resourcesLost.wood > 0 && `${result.resourcesLost.wood}w `}
                              {result.resourcesLost.stone > 0 && `${result.resourcesLost.stone}s `}
                              {result.resourcesLost.food > 0 && `${result.resourcesLost.food}f`}
                            </span>
                          )}
                          {result.citizensLost > 0 && (
                            <span style={{ color: "var(--accent-red)" }}>
                              {" "}· {result.citizensLost} citizen{result.citizensLost > 1 ? "s" : ""} lost
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }}
            </For>
            {/* Mission results */}
            <For each={missionResults()}>
              {(result) => {
                const template = () => getMission(result.missionId);
                return (
                  <div style={{
                    padding: "8px 10px",
                    "margin-bottom": "6px",
                    "border-radius": "6px",
                    background: result.success ? "rgba(52, 152, 219, 0.1)" : "rgba(231, 76, 60, 0.08)",
                    border: `1px solid ${result.success ? "var(--accent-blue)" : "rgba(231, 76, 60, 0.3)"}`,
                    "font-size": "0.85rem",
                  }}>
                    <div style={{ color: result.success ? "var(--accent-blue)" : "var(--accent-red)" }}>
                      {result.success ? "Mission success" : "Mission failed"}: {template()?.icon} {template()?.name ?? result.missionId}
                    </div>
                    <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-top": "3px" }}>
                      {result.rewards.length > 0 && (
                        <span style={{ color: "var(--accent-green)" }}>
                          +{result.rewards.map((r) => `${r.amount} ${r.resource}`).join(", ")}
                        </span>
                      )}
                      {result.xpGained > 0 && <span> · +{result.xpGained} XP</span>}
                      {result.levelUps.length > 0 && (
                        <span style={{ color: "var(--accent-blue)" }}> · Level up: {result.levelUps.join(", ")}</span>
                      )}
                      {result.casualties.length > 0 && (
                        <span style={{ color: "var(--accent-red)" }}> · {result.casualties.length} fallen</span>
                      )}
                    </div>
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
