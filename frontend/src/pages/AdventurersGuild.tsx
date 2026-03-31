import { createSignal, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import {
  getClassMeta,
  RANK_NAMES,
  RANK_COLORS,
  getRecruitCost,
  getXpForLevel,
  type Adventurer,
  type AdventurerRank,
} from "~/data/adventurers";
import {
  type MissionTemplate,
  type MissionSlot,
  calcSuccessChance,
  calcDeathChance,
  calcEffectiveDuration,
  getMission,
} from "~/data/missions";
import Countdown from "~/components/Countdown";

type Tab = "missions" | "roster" | "recruit";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function XpBar(props: { xp: number; level: number }) {
  const needed = () => getXpForLevel(props.level);
  const pct = () => Math.min(100, (props.xp / needed()) * 100);
  return (
    <div style={{ "margin-top": "6px" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "font-size": "0.7rem", color: "var(--text-muted)" }}>
        <span>Lv.{props.level}</span>
        <span>{props.xp}/{needed()} XP</span>
      </div>
      <div style={{ height: "4px", background: "var(--bg-primary)", "border-radius": "2px", "margin-top": "2px" }}>
        <div style={{ height: "100%", width: `${pct()}%`, background: "var(--accent-blue)", "border-radius": "2px", transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function DeathRisk(props: { chance: number }) {
  const color = () => props.chance <= 5 ? "var(--accent-green)" : props.chance <= 15 ? "var(--accent-gold)" : "var(--accent-red)";
  return <span style={{ color: color(), "font-size": "0.75rem" }}>({props.chance}% death risk)</span>;
}

export default function AdventurersGuild() {
  const { state, actions } = useGame();
  const [tab, setTab] = createSignal<Tab>("missions");
  const [selectedMission, setSelectedMission] = createSignal<MissionTemplate | null>(null);
  const [selectedTeam, setSelectedTeam] = createSignal<string[]>([]);
  const [results, setResults] = createSignal<ReturnType<typeof actions.collectCompletedMissions>>([]);

  const guildLevel = () => actions.getGuildLevel();
  const available = () => actions.getAvailableAdventurers();
  const roster = () => state.adventurers;
  const slotInfo = () => actions.getMissionSlotInfo();
  const rosterSize = () => actions.getRosterSize();

  const checkResults = () => {
    const completed = actions.collectCompletedMissions();
    if (completed.length > 0) setResults((prev) => [...completed, ...prev].slice(0, 10));
  };

  const switchTab = (t: Tab) => {
    checkResults();
    setTab(t);
    setSelectedMission(null);
    setSelectedTeam([]);
  };

  const toggleTeamMember = (advId: string) => {
    const mission = selectedMission();
    if (!mission) return;
    setSelectedTeam((prev) => {
      if (prev.includes(advId)) return prev.filter((id) => id !== advId);
      if (prev.length >= mission.slots.length) return prev;
      return [...prev, advId];
    });
  };

  const currentTeam = (): Adventurer[] =>
    selectedTeam().map((id) => state.adventurers.find((a) => a.id === id)).filter(Boolean) as Adventurer[];

  const teamSuccessChance = () => {
    const mission = selectedMission();
    if (!mission) return 0;
    return calcSuccessChance(mission, currentTeam());
  };

  const teamEffectiveDuration = () => {
    const mission = selectedMission();
    if (!mission) return 0;
    return calcEffectiveDuration(mission, currentTeam());
  };

  const getAdvDeathRisk = (adv: Adventurer) => {
    const mission = selectedMission();
    if (!mission) return 0;
    return calcDeathChance(mission, currentTeam(), adv);
  };

  const handleDeploy = () => {
    const mission = selectedMission();
    if (!mission) return;
    const team = selectedTeam();
    if (team.length === 0) return;
    if (actions.deployMission(mission.id, team)) {
      setSelectedMission(null);
      setSelectedTeam([]);
    }
  };

  const slotIcon = (slot: MissionSlot) => {
    if (slot.class === "any") return "👤";
    return getClassMeta(slot.class).icon;
  };

  const slotLabel = (slot: MissionSlot) => {
    if (slot.class === "any") return "Any";
    return getClassMeta(slot.class).name;
  };

  return (
    <div>
      <A href="/buildings" class="back-link">
        ← Back to Buildings
      </A>
      <h1 class="page-title">Adventurer's Guild</h1>

      <Show when={guildLevel() === 0}>
        <div style={{
          padding: "24px",
          background: "var(--bg-secondary)",
          "border-radius": "8px",
          "text-align": "center",
          color: "var(--text-muted)",
        }}>
          <div style={{ "font-size": "2rem", "margin-bottom": "8px" }}>🏰</div>
          <p>Build the Adventurer's Guild to recruit heroes and send them on missions.</p>
          <A href="/buildings/adventurers_guild" style={{ color: "var(--accent-gold)" }}>
            Go to building →
          </A>
        </div>
      </Show>

      <Show when={guildLevel() > 0}>
        <div style={{
          display: "flex",
          gap: "16px",
          "margin-bottom": "16px",
          "font-size": "0.85rem",
          color: "var(--text-secondary)",
          "flex-wrap": "wrap",
        }}>
          <span>Guild Lv.{guildLevel()}</span>
          <span>Missions: {slotInfo().used}/{slotInfo().max}</span>
          <span>Roster: {rosterSize().current}/{rosterSize().max}</span>
          <span>Recruit refresh: {Math.ceil(state.recruitRefreshIn)}h</span>
          <span>Mission refresh: {Math.ceil(state.missionRefreshIn)}h</span>
        </div>

        <div style={{ display: "flex", gap: "4px", "margin-bottom": "16px" }}>
          {(["missions", "roster", "recruit"] as Tab[]).map((t) => (
            <button
              class="speed-btn"
              classList={{ active: tab() === t }}
              onClick={() => switchTab(t)}
              style={{ padding: "8px 16px", "font-size": "0.9rem" }}
            >
              {t === "missions" ? "Missions" : t === "roster" ? "Roster" : "Recruit"}
            </button>
          ))}
        </div>

        {/* Results banner */}
        <Show when={results().length > 0}>
          <div style={{ "margin-bottom": "16px" }}>
            <For each={results()}>
              {(result, i) => {
                const template = () => getMission(result.missionId) ?? { name: result.missionId, icon: "📜" };
                return (
                  <div style={{
                    padding: "8px 12px",
                    "margin-bottom": "4px",
                    "border-radius": "6px",
                    background: result.success ? "rgba(46, 204, 113, 0.1)" : "rgba(231, 76, 60, 0.1)",
                    border: `1px solid ${result.success ? "var(--accent-green)" : "var(--accent-red)"}`,
                    color: result.success ? "var(--accent-green)" : "var(--accent-red)",
                    "font-size": "0.85rem",
                  }}>
                    <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center" }}>
                      <span>
                        {result.success ? "Success" : "Failed"}: {template().name}
                        {result.rewards.length > 0 && (
                          <span style={{ color: "var(--text-secondary)", "margin-left": "8px" }}>
                            +{result.rewards.map((r) => `${r.amount} ${r.resource}`).join(", ")}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => setResults((prev) => prev.filter((_, idx) => idx !== i()))}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                      >
                        ×
                      </button>
                    </div>
                    {/* XP, level ups, rank ups, casualties, revives */}
                    <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-top": "2px" }}>
                      {result.xpGained > 0 && <span>+{result.xpGained} XP · </span>}
                      {result.levelUps.length > 0 && (
                        <span style={{ color: "var(--accent-blue)" }}>
                          Level up: {result.levelUps.join(", ")} ·{" "}
                        </span>
                      )}
                      {result.rankUps.length > 0 && (
                        <span style={{ color: "var(--accent-gold)" }}>
                          Rank up: {result.rankUps.map((r) => `${r.name} → ${r.newRank}`).join(", ")} ·{" "}
                        </span>
                      )}
                      {result.casualties.length > 0 && (
                        <span style={{ color: "var(--accent-red)" }}>
                          Fallen: {result.casualties.length} ·{" "}
                        </span>
                      )}
                      {result.revived.length > 0 && (
                        <span style={{ color: "#9b59b6" }}>
                          Revived by priest: {result.revived.length}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>

        {/* ── Missions tab ── */}
        <Show when={tab() === "missions"}>
          <Show when={state.activeMissions.length > 0}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
              Active Missions
            </h3>
            <div style={{ "margin-bottom": "20px" }}>
              <For each={state.activeMissions}>
                {(am) => {
                  const template = () => getMission(am.missionId) ??
                    { name: am.missionId, icon: "📜" } as any;
                  return (
                    <div class="building-card" style={{ "margin-bottom": "8px" }}>
                      <div class="building-card-header">
                        <div class="building-card-icon">{template().icon}</div>
                        <div>
                          <div class="building-card-title">{template().name}</div>
                          <div style={{ color: "var(--accent-blue)", "font-size": "0.85rem" }}>
                            <Countdown remainingSeconds={am.remaining} /> remaining · {am.successChance}% success
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>

          <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
            Mission Board
          </h3>
          <Show when={state.missionBoard.length === 0}>
            <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
              No missions available. The board refreshes daily.
            </p>
          </Show>
          <div class="buildings-grid">
            <For each={state.missionBoard}>
              {(mission) => {
                const isSelected = () => selectedMission()?.id === mission.id;
                return (
                  <div
                    class="building-card"
                    classList={{ upgrading: isSelected() }}
                    onClick={() => {
                      if (isSelected()) { setSelectedMission(null); setSelectedTeam([]); }
                      else { setSelectedMission(mission); setSelectedTeam([]); }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <span class="building-card-category">
                      {"★".repeat(mission.difficulty)}
                    </span>
                    <div class="building-card-header">
                      <div class="building-card-icon">{mission.icon}</div>
                      <div>
                        <div class="building-card-title">{mission.name}</div>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                          {formatDuration(mission.duration)} · {mission.deployCost}g deploy cost
                        </div>
                      </div>
                    </div>
                    <div class="building-card-desc">{mission.description}</div>
                    <div style={{ "margin-top": "4px", "font-size": "0.75rem", color: "var(--text-muted)" }}>
                      {mission.tags.join(", ")}
                    </div>
                    <div style={{ display: "flex", gap: "6px", "margin-top": "6px", "flex-wrap": "wrap" }}>
                      <For each={mission.slots}>
                        {(slot) => (
                          <span style={{
                            padding: "2px 8px",
                            background: "var(--bg-secondary)",
                            "border-radius": "4px",
                            "font-size": "0.8rem",
                          }}>
                            {slotIcon(slot)} {slotLabel(slot)}
                          </span>
                        )}
                      </For>
                    </div>
                    <div style={{ "margin-top": "8px", "font-size": "0.8rem", color: "var(--accent-green)" }}>
                      Rewards: {mission.rewards.map((r) => `${r.amount} ${r.resource}`).join(", ")}
                    </div>
                  </div>
                );
              }}
            </For>
          </div>

          {/* Team selection panel */}
          <Show when={selectedMission()}>
            {(mission) => (
              <div style={{
                "margin-top": "20px",
                padding: "16px",
                background: "var(--bg-secondary)",
                "border-radius": "8px",
                border: "1px solid var(--border-highlight)",
              }}>
                <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "12px", color: "var(--text-primary)" }}>
                  Assemble Team for: {mission().name}
                </h3>
                <div style={{ "margin-bottom": "8px", "font-size": "0.85rem", color: "var(--text-secondary)" }}>
                  Slots: {selectedTeam().length}/{mission().slots.length} ·
                  Success: <span style={{
                    color: teamSuccessChance() >= 70 ? "var(--accent-green)" :
                      teamSuccessChance() >= 40 ? "var(--accent-gold)" : "var(--accent-red)",
                  }}>{teamSuccessChance()}%</span> ·
                  Duration: {formatDuration(teamEffectiveDuration())}
                  {teamEffectiveDuration() < mission().duration && (
                    <span style={{ color: "var(--accent-blue)", "margin-left": "4px" }}>
                      (Wizard -{ Math.round((1 - teamEffectiveDuration() / mission().duration) * 100)}%)
                    </span>
                  )} ·
                  Cost: {mission().deployCost}g
                </div>

                <Show when={available().length === 0}>
                  <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
                    No adventurers available. Recruit some from the Recruit tab!
                  </p>
                </Show>

                <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap", "margin-bottom": "12px" }}>
                  <For each={available()}>
                    {(adv) => {
                      const isInTeam = () => selectedTeam().includes(adv.id);
                      const cls = getClassMeta(adv.class);
                      return (
                        <button
                          onClick={() => toggleTeamMember(adv.id)}
                          style={{
                            padding: "8px 12px",
                            background: isInTeam() ? "rgba(52, 152, 219, 0.2)" : "var(--bg-primary)",
                            border: `1px solid ${isInTeam() ? "var(--accent-blue)" : "var(--border-default)"}`,
                            "border-radius": "6px",
                            cursor: "pointer",
                            color: "var(--text-primary)",
                            "font-size": "0.85rem",
                            "text-align": "left",
                          }}
                        >
                          <div>
                            {cls.icon} {adv.name}
                            <span style={{ color: RANK_COLORS[adv.rank], "margin-left": "6px", "font-size": "0.75rem" }}>
                              {RANK_NAMES[adv.rank]} Lv.{adv.level}
                            </span>
                          </div>
                          {isInTeam() && selectedTeam().length > 0 && (
                            <div style={{ "margin-top": "2px" }}>
                              <DeathRisk chance={getAdvDeathRisk(adv)} />
                            </div>
                          )}
                        </button>
                      );
                    }}
                  </For>
                </div>

                {/* Team class passive summary */}
                <Show when={selectedTeam().length > 0}>
                  <div style={{
                    padding: "8px 10px",
                    "margin-bottom": "12px",
                    background: "var(--bg-primary)",
                    "border-radius": "6px",
                    "font-size": "0.8rem",
                    color: "var(--text-muted)",
                  }}>
                    <strong style={{ color: "var(--text-secondary)" }}>Team passives:</strong>
                    <For each={currentTeam()}>
                      {(adv) => {
                        const cls = getClassMeta(adv.class);
                        return (
                          <div style={{ "margin-top": "2px" }}>
                            {cls.icon} <strong>{cls.passive.name}</strong>: {cls.passive.description}
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>

                <button
                  class="upgrade-btn"
                  disabled={selectedTeam().length === 0 || slotInfo().used >= slotInfo().max || state.resources.gold < mission().deployCost}
                  onClick={handleDeploy}
                >
                  Deploy Team ({mission().deployCost}g)
                </button>
                <Show when={slotInfo().used >= slotInfo().max}>
                  <span style={{ color: "var(--accent-gold)", "font-size": "0.85rem", "margin-left": "12px" }}>
                    All mission slots in use
                  </span>
                </Show>
              </div>
            )}
          </Show>
        </Show>

        {/* ── Roster tab ── */}
        <Show when={tab() === "roster"}>
          <Show when={roster().length === 0}>
            <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
              No adventurers yet. Visit the Recruit tab to hire heroes!
            </p>
          </Show>
          <div class="buildings-grid">
            <For each={roster()}>
              {(adv) => {
                const cls = getClassMeta(adv.class);
                return (
                  <div class="building-card" classList={{ upgrading: adv.onMission }}>
                    <span class="building-card-category" style={{ color: RANK_COLORS[adv.rank] }}>
                      {RANK_NAMES[adv.rank]}
                    </span>
                    <div class="building-card-header">
                      <div class="building-card-icon">{cls.icon}</div>
                      <div>
                        <div class="building-card-title">{adv.name}</div>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                          {cls.name} · Lv.{adv.level}
                        </div>
                      </div>
                    </div>
                    <XpBar xp={adv.xp} level={adv.level} />
                    <div style={{
                      "margin-top": "6px",
                      padding: "4px 8px",
                      background: "var(--bg-primary)",
                      "border-radius": "4px",
                      "font-size": "0.75rem",
                      color: "var(--text-muted)",
                    }}>
                      {cls.passive.name}: {cls.passive.description}
                    </div>
                    {adv.onMission && (
                      <div class="building-card-upgrading">On mission</div>
                    )}
                    {!adv.onMission && (
                      <button
                        onClick={() => {
                          if (confirm(`Dismiss ${adv.name}? This cannot be undone.`)) {
                            actions.dismissAdventurer(adv.id);
                          }
                        }}
                        style={{
                          "margin-top": "8px",
                          background: "rgba(231, 76, 60, 0.1)",
                          border: "1px solid var(--accent-red)",
                          color: "var(--accent-red)",
                          padding: "4px 10px",
                          "border-radius": "4px",
                          cursor: "pointer",
                          "font-size": "0.8rem",
                        }}
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                );
              }}
            </For>
          </div>
        </Show>

        {/* ── Recruit tab ── */}
        <Show when={tab() === "recruit"}>
          <div style={{ "margin-bottom": "12px", "font-size": "0.85rem", color: "var(--text-secondary)" }}>
            Roster: {rosterSize().current}/{rosterSize().max} ·
            New candidates in {Math.ceil(state.recruitRefreshIn)}h
          </div>
          <Show when={state.recruitCandidates.length === 0}>
            <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
              No candidates available right now. New candidates appear daily.
            </p>
          </Show>
          <div class="buildings-grid">
            <For each={state.recruitCandidates}>
              {(candidate) => {
                const cls = getClassMeta(candidate.class);
                const cost = getRecruitCost(candidate.rank);
                const canAfford = () => state.resources.gold >= cost;
                const rosterFull = () => rosterSize().current >= rosterSize().max;
                return (
                  <div class="building-card">
                    <span class="building-card-category" style={{ color: RANK_COLORS[candidate.rank] }}>
                      {RANK_NAMES[candidate.rank]}
                    </span>
                    <div class="building-card-header">
                      <div class="building-card-icon">{cls.icon}</div>
                      <div>
                        <div class="building-card-title">{candidate.name}</div>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                          {cls.name} · Lv.{candidate.level}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      "margin-top": "4px",
                      "font-size": "0.75rem",
                      color: "var(--text-muted)",
                    }}>
                      {cls.passive.name}: {cls.passive.description}
                    </div>
                    <div style={{ "margin-top": "8px" }}>
                      <button
                        class="upgrade-btn"
                        disabled={!canAfford() || rosterFull()}
                        onClick={() => actions.recruitAdventurer(candidate.id)}
                        style={{ "font-size": "0.85rem", padding: "6px 14px" }}
                      >
                        Recruit ({cost}g)
                      </button>
                      <Show when={rosterFull()}>
                        <span style={{ color: "var(--accent-red)", "font-size": "0.8rem", "margin-left": "8px" }}>
                          Roster full
                        </span>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}
