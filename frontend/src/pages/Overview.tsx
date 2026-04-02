import { createSignal, For, Show, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { BUILDINGS, getSettlementName, SETTLEMENT_TIERS } from "~/data/buildings";
import { RESOURCES } from "~/data/resources";
import { SEASON_META } from "~/data/seasons";
import { getRaid, calcRaidSuccessChance, getDefenseTips } from "~/data/raids";
import { QUEST_CHAIN } from "~/data/quests";
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

  // Collect stale raid logs on mount (clear them from state)
  onMount(() => {
    actions.collectRaidLog();
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
    if (id === "food") return base - foodCons() - actions.getAnimalFoodConsumption();
    return base;
  };

  const nextTier = () => {
    const current = tier();
    const idx = SETTLEMENT_TIERS.findIndex((t) => t.tier === current);
    if (idx < SETTLEMENT_TIERS.length - 1) return SETTLEMENT_TIERS[idx + 1];
    return null;
  };

  const hasThreats = () => state.incomingRaids.length > 0;

  // Quest system
  const claimed = () => state.questRewardsClaimed ?? [];
  const currentQuest = () => {
    const c = claimed();
    const idx = QUEST_CHAIN.findIndex((q) => !c.includes(q.id));
    return idx >= 0 ? QUEST_CHAIN[idx] : null;
  };
  const isQuestComplete = () => {
    const quest = currentQuest();
    return quest ? quest.condition(state) : false;
  };
  const questProgress = () => claimed().length;
  const allQuestsComplete = () => questProgress() >= QUEST_CHAIN.length;
  const [dismissedCongrats, setDismissedCongrats] = createSignal(localStorage.getItem("quest-congrats-dismissed") === "true");

  return (
    <div>
      <h1 class="page-title">
        {getSettlementName(tier())} of {state.villageName}
      </h1>

      {/* Quest Panel */}
      <Show when={!allQuestsComplete() && currentQuest()}>
        {(quest) => (
          <div class="quest-panel">
            <div class="quest-header">
              <span class="quest-icon">{quest().icon}</span>
              <div>
                <h2>Quest: {quest().title}</h2>
                <p class="quest-narrative">"{quest().narrative}"</p>
              </div>
              <span class="quest-progress">{questProgress() + 1} / {QUEST_CHAIN.length}</span>
            </div>
            <div class="quest-body">
              <div class="quest-objective">
                <span class="quest-objective-label">Objective: </span>
                {quest().objective}
                <Show when={isQuestComplete()}>
                  <span class="quest-check"> — Complete!</span>
                </Show>
              </div>
              <div class="quest-rewards">
                <span class="quest-reward-label">Reward: </span>
                {quest().rewards.map((r) => (
                  <span class="quest-reward-item">+{r.amount} {r.label}</span>
                ))}
              </div>
            </div>
            <div class="quest-actions">
              <Show when={isQuestComplete()}>
                <button class="quest-claim-btn" onClick={() => actions.claimQuestReward(quest().id)}>
                  Claim Reward
                </button>
              </Show>
              <Show when={!isQuestComplete()}>
                {(() => {
                  const bid = quest().targetBuildingId;
                  const page = quest().targetPage ?? (bid ? "/buildings" : null);
                  const href = bid ? `/buildings#building-${bid}` : page;
                  const labels: Record<string, string> = {
                    "/buildings": "Go to Buildings",
                    "/farming": "Go to Farming",
                    "/guild": "Go to Adventurer's Guild",
                  };
                  const label = bid ? `Go to Buildings` : (labels[page ?? ""] ?? "Go");
                  return href ? <A href={href} class="quest-link">{label} →</A> : null;
                })()}
              </Show>
            </div>
          </div>
        )}
      </Show>

      <Show when={allQuestsComplete() && !dismissedCongrats()}>
        <div class="quest-panel">
          <div class="quest-complete-banner">
            <h2>All Quests Complete!</h2>
            <p>You have proven yourself a worthy ruler. Your settlement thrives under your leadership. The realm awaits your next move.</p>
            <button
              class="quest-claim-btn"
              style={{ "margin-top": "10px" }}
              onClick={() => { setDismissedCongrats(true); localStorage.setItem("quest-congrats-dismissed", "true"); }}
            >
              Onward!
            </button>
          </div>
        </div>
      </Show>

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
          <div class="stat-row" style={{ "margin-top": "-1px", "border-top": "1px solid var(--border-highlight)", "padding-top": "8px" }}>
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

                    {/* Expected consequences */}
                    <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-top": "6px" }}>
                      <Show when={successPct() < 100}>
                        <span>If defeated: </span>
                        {raid()?.stealsResources && <span style={{ color: "var(--accent-red)" }}>~{Math.round((raid()!.resourceStealPercent) * 100)}% resources stolen </span>}
                        {raid()?.killsCitizens && <span style={{ color: "var(--accent-red)" }}>· up to {raid()!.maxCitizenLoss} citizen deaths </span>}
                        <span>· 1-3 buildings damaged</span>
                      </Show>
                      <Show when={successPct() >= 100}>
                        <span style={{ color: "var(--accent-green)" }}>Expected loot: {raid()!.victoryLoot.map((l) => `+${l.amount} ${l.resource}`).join(", ")}</span>
                      </Show>
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

        {/* Event Log */}
        <Show when={state.eventLog.length > 0}>
          <div class="overview-panel">
            <h2>Event Log</h2>
            <div style={{ "max-height": "300px", overflow: "auto" }}>
              <For each={state.eventLog.slice(0, 20)}>
                {(event) => {
                  const color = () => {
                    if (event.type.includes("died") || event.type.includes("defeat") || event.type.includes("failed") || event.type.includes("left") || event.type.includes("damaged") || event.type.includes("freezing")) return "var(--accent-red)";
                    if (event.type.includes("victory") || event.type.includes("success") || event.type.includes("born") || event.type.includes("completed") || event.type.includes("repaired")) return "var(--accent-green)";
                    if (event.type.includes("levelup") || event.type.includes("rankup")) return "var(--accent-blue)";
                    if (event.type.includes("incoming")) return "var(--accent-gold)";
                    return "var(--text-secondary)";
                  };
                  return (
                    <div style={{
                      padding: "4px 0",
                      "border-bottom": "1px solid var(--border-default)",
                      "font-size": "0.8rem",
                      display: "flex",
                      gap: "6px",
                      "align-items": "flex-start",
                    }}>
                      <span>{event.icon}</span>
                      <span style={{ color: color() }}>{event.message}</span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
