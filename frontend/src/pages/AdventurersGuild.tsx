import { createSignal, createMemo, For, Index, Show } from "solid-js";
import { A, useNavigate, useSearchParams } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import {
  ADVENTURER_CLASSES,
  getClassMeta,
  RANK_NAMES,
  RANK_COLORS,
  getRecruitCost,
  getXpForLevel,
  getMissionXp,
  getUnspentStatPoints,
  type Adventurer,
  type AdventurerRank,
} from "~/data/adventurers";
import { getItem } from "~/data/items";
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
  return <span style={{ color: color(), "font-size": "0.75rem" }}>({props.chance}% death risk on failure)</span>;
}

export default function AdventurersGuild() {
  const { state, actions } = useGame();
  actions.visitGuild();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.tab === "roster" || searchParams.tab === "recruit") ? searchParams.tab as Tab : "missions";
  const [tab, setTab] = createSignal<Tab>(initialTab);
  const [selectedMission, setSelectedMission] = createSignal<MissionTemplate | null>(null);
  const [selectedTeam, setSelectedTeam] = createSignal<string[]>([]);
  const guildLevel = () => actions.getGuildLevel();
  const availableIds = createMemo(() =>
    state.adventurers.filter((a) => a.alive && !a.onMission).map((a) => a.id)
  );
  const available = () => availableIds().map((id) => state.adventurers.find((a) => a.id === id)!);
  const roster = () => state.adventurers;
  const slotInfo = () => actions.getMissionSlotInfo();
  const rosterSize = () => actions.getRosterSize();

  const switchTab = (t: Tab) => {
    setTab(t);
    setSelectedMission(null);
    setSelectedTeam([]);
  };

  const toggleTeamMember = (advId: string) => {
    const mission = selectedMission();
    if (!mission) return;
    setSelectedTeam((prev) => {
      if (prev.includes(advId)) return prev.filter((id) => id !== advId);
      if (prev.length >= mission.slots.length) {
        // Team full — replace the last selected member
        return [...prev.slice(0, -1), advId];
      }
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

  /** Assign team members to mission slots optimally — class matches first, then "any" slots */
  const assignTeamToSlots = () => {
    const mission = selectedMission();
    if (!mission) return [];
    const team = currentTeam();
    const result: (Adventurer | null)[] = mission.slots.map(() => null);
    const unassigned = [...team];

    // First pass: fill specific class slots with matching adventurers
    for (let i = 0; i < mission.slots.length; i++) {
      const slot = mission.slots[i];
      if (slot.class === "any") continue;
      const idx = unassigned.findIndex((a) => a.class === slot.class);
      if (idx !== -1) {
        result[i] = unassigned[idx];
        unassigned.splice(idx, 1);
      }
    }

    // Second pass: fill remaining slots (any + unmatched specific) with leftover adventurers
    for (let i = 0; i < mission.slots.length; i++) {
      if (result[i] !== null) continue;
      if (unassigned.length > 0) {
        result[i] = unassigned.shift()!;
      }
    }

    return result;
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
          <span>Refresh in: {Math.ceil(state.recruitRefreshIn)}h</span>
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
        <Show when={state.completedMissions.length > 0}>
          <div style={{ "margin-bottom": "16px" }}>
            <For each={state.completedMissions}>
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
                        onClick={() => actions.claimMissionReward(i())}
                        style={{
                          padding: "4px 12px",
                          background: result.rewards.length > 0 ? "var(--accent-gold)" : "transparent",
                          color: result.rewards.length > 0 ? "#1a1a1a" : "var(--text-muted)",
                          border: result.rewards.length > 0 ? "none" : "1px solid var(--border-color)",
                          "border-radius": "4px",
                          cursor: "pointer",
                          "font-size": "0.8rem",
                          "font-weight": "600",
                          "white-space": "nowrap",
                        }}
                      >
                        {result.rewards.length > 0 ? "Claim" : "Dismiss"}
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
                    { name: am.missionId, icon: "📜", rewards: [] } as any;
                  const teamAdvs = () => am.adventurerIds
                    .map((id) => state.adventurers.find((a) => a.id === id))
                    .filter(Boolean);
                  return (
                    <div class="building-card" style={{ "margin-bottom": "8px" }}>
                      <div class="building-card-header">
                        <div class="building-card-icon">{template().icon}</div>
                        <div>
                          <div class="building-card-title">{template().name}</div>
                          <div style={{ color: "var(--accent-blue)", "font-size": "0.85rem" }}>
                            <Countdown remainingSeconds={am.remaining} /> remaining
                          </div>
                        </div>
                      </div>
                      <div style={{ "font-size": "0.8rem", "margin-top": "4px", display: "flex", gap: "6px", "flex-wrap": "wrap", "align-items": "center" }}>
                        <span style={{ color: "var(--text-muted)" }}>Team:</span>
                        {teamAdvs().map((a) => {
                          const cls = getClassMeta(a!.class);
                          return <span title={`${a!.name} (${cls.name} Lv.${a!.level})`}>{cls.icon}</span>;
                        })}
                        <span style={{
                          "margin-left": "auto",
                          color: am.successChance >= 70 ? "var(--accent-green)" : am.successChance >= 40 ? "var(--accent-gold)" : "var(--accent-red)",
                        }}>
                          {am.successChance}% success
                        </span>
                      </div>
                      <Show when={template().rewards?.length > 0}>
                        <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "2px" }}>
                          Rewards: {template().rewards.map((r: any) => `${r.amount} ${r.resource}`).join(", ")}
                        </div>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>

          <div style={{ display: "flex", "align-items": "center", gap: "12px", "margin-bottom": "8px" }}>
            <h3 style={{ "font-family": "var(--font-heading)", color: "var(--text-primary)", margin: 0 }}>
              Mission Board
            </h3>
            <button
              onClick={() => actions.rerollMissions()}
              disabled={state.missionRerollToday || state.astralShards < 10}
              style={{
                padding: "3px 10px",
                background: state.missionRerollToday ? "var(--bg-secondary)" : "rgba(167, 139, 250, 0.2)",
                border: `1px solid ${state.missionRerollToday ? "var(--border-default)" : "#a78bfa"}`,
                color: state.missionRerollToday ? "var(--text-muted)" : "#a78bfa",
                "border-radius": "4px",
                cursor: state.missionRerollToday ? "default" : "pointer",
                "font-size": "0.75rem",
              }}
            >
              {state.missionRerollToday ? "Rerolled today" : "Reroll (10 💠)"}
            </button>
          </div>
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
                      <span style={{ color: [, "#aaa", "#7CFC00", "#3498db", "#9b59b6", "#f5c542"][mission.difficulty] }}>
                        {["", "Novice", "Apprentice", "Journeyman", "Veteran", "Elite"][mission.difficulty]}
                      </span>
                      {" · "}{mission.tags.join(", ")}
                    </span>
                    <div class="building-card-header" style={{ "margin-top": "14px" }}>
                      <div class="building-card-icon">{mission.icon}</div>
                      <div>
                        <div class="building-card-title">{mission.name}</div>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                          {formatDuration(mission.duration)} · {mission.deployCost}g deploy cost
                        </div>
                      </div>
                    </div>
                    <div class="building-card-desc">{mission.description}</div>
                    <div style={{ display: "flex", gap: "6px", "margin-top": "8px", "flex-wrap": "wrap" }}>
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
                    <div style={{ "font-size": "0.75rem", color: "var(--accent-blue)", "margin-top": "2px" }}>
                      +{getMissionXp(mission.difficulty, true)} XP on success · +{getMissionXp(mission.difficulty, false)} XP on failure
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
                <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
                  Assemble Team for: {mission().name}
                </h3>

                {/* Slot requirements */}
                <div style={{ display: "flex", gap: "6px", "margin-bottom": "10px", "flex-wrap": "wrap" }}>
                  {mission().slots.map((slot, i) => {
                    const assigned = () => assignTeamToSlots()[i];
                    const isMatched = () => {
                      const adv = assigned();
                      if (!adv) return false;
                      return slot.class === "any" || adv.class === slot.class;
                    };
                    return (
                      <div style={{
                        padding: "4px 10px",
                        "border-radius": "6px",
                        border: `1px solid ${assigned() ? (isMatched() ? "var(--accent-green)" : "var(--accent-gold)") : "var(--border-default)"}`,
                        background: assigned() ? (isMatched() ? "rgba(46, 204, 113, 0.1)" : "rgba(245, 197, 66, 0.1)") : "var(--bg-primary)",
                        "font-size": "0.8rem",
                        display: "flex",
                        "align-items": "center",
                        gap: "4px",
                      }}>
                        <span>{slot.class === "any" ? "👤" : getClassMeta(slot.class).icon}</span>
                        <span style={{ color: assigned() ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {assigned()
                            ? assigned()!.name.split(" ")[0]
                            : slot.class === "any" ? "Any" : getClassMeta(slot.class).name}
                        </span>
                        {assigned() && !isMatched() && (
                          <span style={{ "font-size": "0.65rem", color: "var(--accent-gold)" }}>mismatch</span>
                        )}
                      </div>
                    );
                  })}
                </div>

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
                  <For each={availableIds()}>
                    {(advId) => {
                      const adv = () => state.adventurers.find((a) => a.id === advId)!;
                      const isInTeam = () => selectedTeam().includes(advId);
                      const cls = () => getClassMeta(adv().class);
                      return (
                        <button
                          onClick={() => toggleTeamMember(advId)}
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
                            {cls().icon} {adv().name}
                            <span style={{ color: RANK_COLORS[adv().rank], "margin-left": "6px", "font-size": "0.75rem" }}>
                              {RANK_NAMES[adv().rank]} Lv.{adv().level}
                            </span>
                          </div>
                          {isInTeam() && selectedTeam().length > 0 && (
                            <div style={{ "margin-top": "2px" }}>
                              <DeathRisk chance={getAdvDeathRisk(adv())} />
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
                    {(() => {
                      const names = currentTeam().map((a) => a.name.split(" ").slice(1).join(" "));
                      const counts = new Map<string, number>();
                      for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
                      const families = [...counts.entries()].filter(([, c]) => c > 1);
                      return families.length > 0 ? (
                        <div style={{ "margin-top": "4px", color: "#e91e63" }}>
                          💕 <strong>Family bond</strong>: The {families.map(([name]) => name).join(", ")} family fights together! (+{families.reduce((s, [, c]) => s + (c - 1) * 5, 0)}% success)
                        </div>
                      ) : null;
                    })()}
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
          <For each={ADVENTURER_CLASSES.filter((cls) => roster().some((a) => a.class === cls.id))}>
            {(cls) => {
              const classAdvs = () => roster()
                .filter((a) => a.class === cls.id)
                .sort((a, b) => b.level - a.level);
              return (
                <>
                  <h3 style={{
                    "font-family": "var(--font-heading)",
                    "margin-top": "16px",
                    "margin-bottom": "8px",
                    color: "var(--text-secondary)",
                    "font-size": "0.9rem",
                  }}>
                    {cls.icon} {cls.name}s ({classAdvs().length})
                  </h3>
                  <div class="buildings-grid">
                    <For each={classAdvs()}>
              {(adv) => {
                const cls = getClassMeta(adv.class);
                const weapon = () => adv.equipment.weapon ? getItem(adv.equipment.weapon) : null;
                const armor = () => adv.equipment.armor ? getItem(adv.equipment.armor) : null;
                const trinket = () => adv.equipment.trinket ? getItem(adv.equipment.trinket) : null;
                const emptySlots = () => [!weapon() && "weapon", !armor() && "armor", !trinket() && "trinket"].filter(Boolean);
                const unspent = () => getUnspentStatPoints(adv);
                return (
                  <A href={`/guild/${adv.id}`} style={{ "text-decoration": "none", display: "flex" }}>
                    <div class="building-card" style={{
                      cursor: "pointer",
                      position: "relative",
                      display: "flex",
                      "flex-direction": "column",
                      width: "100%",
                      opacity: adv.onMission ? 0.7 : 1,
                      background: adv.onMission ? "var(--bg-secondary)" : "var(--bg-card)",
                      "border-color": adv.onMission ? "var(--accent-blue)" : undefined,
                    }}>
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
                      <div style={{ flex: 1 }} />
                      <div style={{ "margin-top": "4px", "font-size": "0.75rem", display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
                        {weapon() && <span title={weapon()!.name}>{weapon()!.icon}</span>}
                        {armor() && <span title={armor()!.name}>{armor()!.icon}</span>}
                        {trinket() && <span title={trinket()!.name}>{trinket()!.icon}</span>}
                        {emptySlots().length > 0 && (
                          <span style={{ color: "var(--accent-gold)", "font-size": "0.7rem" }}>
                            {emptySlots().length} empty gear slot{emptySlots().length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {unspent() > 0 && (
                        <div style={{
                          "margin-top": "6px",
                          padding: "3px 8px",
                          "border-radius": "4px",
                          background: "rgba(46, 204, 113, 0.15)",
                          border: "1px solid var(--accent-green)",
                          color: "var(--accent-green)",
                          "font-size": "0.75rem",
                          animation: "pulse 2s infinite",
                        }}>
                          {unspent()} stat point{unspent() > 1 ? "s" : ""} available!
                        </div>
                      )}
                      {adv.onMission && (
                        <div style={{
                          "margin-top": "6px",
                          padding: "3px 8px",
                          "border-radius": "4px",
                          background: "rgba(52, 152, 219, 0.15)",
                          border: "1px solid var(--accent-blue)",
                          color: "var(--accent-blue)",
                          "font-size": "0.75rem",
                          "text-align": "center",
                        }}>
                          On mission
                        </div>
                      )}
                    </div>
                  </A>
                );
              }}
            </For>
                  </div>
                </>
              );
            }}
          </For>
        </Show>

        {/* ── Recruit tab ── */}
        <Show when={tab() === "recruit"}>
          <div style={{ display: "flex", "align-items": "center", gap: "12px", "margin-bottom": "12px", "font-size": "0.85rem", color: "var(--text-secondary)" }}>
            <span>
              Roster: {rosterSize().current}/{rosterSize().max} ·
              New candidates in {Math.ceil(state.recruitRefreshIn)}h
            </span>
            <button
              onClick={() => actions.rerollRecruits()}
              disabled={state.recruitRerollToday || state.astralShards < 10}
              style={{
                padding: "3px 10px",
                background: state.recruitRerollToday ? "var(--bg-secondary)" : "rgba(167, 139, 250, 0.2)",
                border: `1px solid ${state.recruitRerollToday ? "var(--border-default)" : "#a78bfa"}`,
                color: state.recruitRerollToday ? "var(--text-muted)" : "#a78bfa",
                "border-radius": "4px",
                cursor: state.recruitRerollToday ? "default" : "pointer",
                "font-size": "0.75rem",
              }}
            >
              {state.recruitRerollToday ? "Rerolled today" : "Reroll (10 💠)"}
            </button>
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
                        <span style={{ "font-size": "0.8rem", "margin-left": "8px" }}>
                          <span style={{ color: "var(--accent-red)" }}>Roster full</span>
                          {" — "}
                          <A href="/buildings/adventurers_guild" style={{ color: "var(--accent-gold)", "font-size": "0.8rem" }}>
                            Upgrade guild for more slots
                          </A>
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
