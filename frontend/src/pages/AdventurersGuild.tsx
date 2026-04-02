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
import { getItem, getEquipmentStats, getAvailableSupplies, getSupplyEffect, isSupplyItem, MAX_MISSION_SUPPLIES } from "~/data/items";
import {
  type MissionTemplate,
  type MissionSlot,
  calcSuccessChance,
  calcDeathChance,
  calcEffectiveDuration,
  getMission,
  getMissionStatWeights,
} from "~/data/missions";
import { calcStats as calcAdvStats } from "~/data/adventurers";
import Countdown from "~/components/Countdown";

type Tab = "missions" | "roster" | "recruit";

const DIFFICULTY_LABELS: Record<number, string> = { 1: "Novice", 2: "Apprentice", 3: "Journeyman", 4: "Veteran", 5: "Elite" };
const DIFFICULTY_COLORS: Record<number, string> = { 1: "var(--accent-green)", 2: "var(--accent-blue)", 3: "var(--accent-gold)", 4: "#e67e22", 5: "var(--accent-red)" };

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
  const [selectedSupplies, setSelectedSupplies] = createSignal<string[]>([]);
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
    let chance = calcSuccessChance(mission, currentTeam());
    for (const supplyId of selectedSupplies()) {
      const effect = getSupplyEffect(supplyId);
      if (effect) chance = Math.min(100, chance + effect.successBonus);
    }
    return chance;
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

  const toggleSupply = (itemId: string) => {
    setSelectedSupplies((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      if (prev.length >= MAX_MISSION_SUPPLIES) return prev;
      return [...prev, itemId];
    });
  };

  const handleDeploy = () => {
    const mission = selectedMission();
    if (!mission) return;
    const team = selectedTeam();
    if (team.length === 0) return;
    if (actions.deployMission(mission.id, team, selectedSupplies())) {
      setSelectedMission(null);
      setSelectedTeam([]);
      setSelectedSupplies([]);
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
                      if (isSelected()) { setSelectedMission(null); setSelectedTeam([]); setSelectedSupplies([]); }
                      else { setSelectedMission(mission); setSelectedTeam([]); setSelectedSupplies([]); }
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

          {/* Two-column team assembly panel */}
          <Show when={selectedMission()}>
            {(mission) => {
              const statWeights = () => getMissionStatWeights(mission().tags);
              const topStats = () => {
                const w = statWeights();
                return Object.entries(w).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0)).slice(0, 2).map(([k]) => k);
              };
              const STAT_LABELS: Record<string, string> = { str: "STR", int: "INT", dex: "DEX", vit: "VIT", wis: "WIS" };

              return (
                <div class="mission-assembly" ref={(el) => setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50)}>
                  {/* Left: Mission details */}
                  <div class="mission-detail-panel">
                    <div class="mission-detail-header">
                      <span style={{ "font-size": "2rem" }}>{mission().icon}</span>
                      <div>
                        <h3 style={{ "font-family": "var(--font-heading)", color: "var(--accent-gold)", margin: 0 }}>{mission().name}</h3>
                        <div style={{ "font-size": "0.8rem", color: DIFFICULTY_COLORS[mission().difficulty] ?? "var(--text-muted)" }}>
                          {"★".repeat(mission().difficulty)} {DIFFICULTY_LABELS[mission().difficulty] ?? ""}
                        </div>
                      </div>
                    </div>

                    <p style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "font-style": "italic", "margin": "10px 0" }}>
                      {mission().description}
                    </p>

                    <div class="mission-detail-section">
                      <div class="mission-detail-label">Team Slots</div>
                      {mission().slots.map((slot, i) => {
                        const assigned = () => assignTeamToSlots()[i];
                        const isMatched = () => {
                          const adv = assigned();
                          return adv ? (slot.class === "any" || adv.class === slot.class) : false;
                        };
                        return (
                          <div
                            class="mission-slot"
                            classList={{ filled: !!assigned(), matched: isMatched(), empty: !assigned() }}
                            onClick={() => { if (assigned()) toggleTeamMember(assigned()!.id); }}
                            style={{ cursor: assigned() ? "pointer" : "default" }}
                          >
                            <span>{slot.class === "any" ? "👤" : getClassMeta(slot.class).icon}</span>
                            <span class="mission-slot-label">
                              {slot.class === "any" ? "Any class" : getClassMeta(slot.class).name}
                            </span>
                            <span class="mission-slot-arrow">→</span>
                            <span class="mission-slot-assigned">
                              {assigned() ? assigned()!.name : "Empty"}
                            </span>
                            {assigned() && !isMatched() && (
                              <span style={{ "font-size": "0.65rem", color: "var(--accent-gold)", "margin-left": "4px" }}>mismatch</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div class="mission-detail-section">
                      <div class="mission-detail-label">Rewards</div>
                      <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                        {mission().rewards.map((r) => (
                          <span class="quest-reward-item">+{r.amount} {r.resource}</span>
                        ))}
                      </div>
                    </div>

                    <div class="mission-detail-stats">
                      <div><span class="mission-detail-label">Duration</span> {formatDuration(mission().duration)}</div>
                      <div><span class="mission-detail-label">Deploy cost</span> {mission().deployCost}g</div>
                      <div><span class="mission-detail-label">Key stats</span> {topStats().map((s) => STAT_LABELS[s]).join(", ")}</div>
                    </div>

                    <button
                      style={{
                        "margin-top": "12px", padding: "6px 14px", background: "none",
                        border: "1px solid var(--border-color)", "border-radius": "4px",
                        color: "var(--text-muted)", cursor: "pointer", "font-size": "0.8rem",
                      }}
                      onClick={() => { setSelectedMission(null); setSelectedTeam([]); setSelectedSupplies([]); }}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Right: Team assembly */}
                  <div class="team-panel">
                    <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "10px", color: "var(--text-primary)" }}>
                      Assemble Your Team
                    </h3>

                    <Show when={available().length === 0}>
                      <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
                        No adventurers available. Recruit some from the Recruit tab!
                      </p>
                    </Show>

                    <div class="team-adv-grid">
                      <For each={availableIds()}>
                        {(advId) => {
                          const adv = () => state.adventurers.find((a) => a.id === advId)!;
                          const isInTeam = () => selectedTeam().includes(advId);
                          const cls = () => getClassMeta(adv().class);
                          const stats = () => {
                            const equipStats = getEquipmentStats(adv().equipment);
                            return calcAdvStats(adv(), equipStats);
                          };
                          const matchesSlot = () => mission().slots.some((s) => s.class === "any" || s.class === adv().class);

                          return (
                            <button
                              class="team-adv-card"
                              classList={{ assigned: isInTeam(), "class-match": matchesSlot() && !isInTeam() }}
                              onClick={() => toggleTeamMember(advId)}
                            >
                              <div class="team-adv-header">
                                <span class="team-adv-icon">{cls().icon}</span>
                                <div>
                                  <div class="team-adv-name">{adv().name}</div>
                                  <div class="team-adv-rank" style={{ color: RANK_COLORS[adv().rank] }}>
                                    {RANK_NAMES[adv().rank]} Lv.{adv().level}
                                  </div>
                                </div>
                                {isInTeam() && <span class="team-adv-check">✓</span>}
                              </div>
                              <div class="team-adv-stats">
                                {topStats().map((s) => (
                                  <span class="team-adv-stat">
                                    <span class="team-adv-stat-label">{STAT_LABELS[s]}</span>
                                    <span class="team-adv-stat-value">{stats()[s as keyof typeof stats]}</span>
                                  </span>
                                ))}
                              </div>
                              <Show when={adv().equipment.weapon || adv().equipment.armor || adv().equipment.trinket}>
                                <div class="team-adv-gear">
                                  {adv().equipment.weapon && <span title={getItem(adv().equipment.weapon!)?.name}>{getItem(adv().equipment.weapon!)?.icon}</span>}
                                  {adv().equipment.armor && <span title={getItem(adv().equipment.armor!)?.name}>{getItem(adv().equipment.armor!)?.icon}</span>}
                                  {adv().equipment.trinket && <span title={getItem(adv().equipment.trinket!)?.name}>{getItem(adv().equipment.trinket!)?.icon}</span>}
                                </div>
                              </Show>
                              {isInTeam() && (
                                <div class="team-adv-risk">
                                  <DeathRisk chance={getAdvDeathRisk(adv())} />
                                </div>
                              )}
                            </button>
                          );
                        }}
                      </For>
                    </div>

                    {/* Success summary */}
                    <div class="team-summary">
                      <div class="team-success">
                        <span class="team-success-label">Success</span>
                        <span class="team-success-value" style={{
                          color: teamSuccessChance() >= 70 ? "var(--accent-green)" :
                            teamSuccessChance() >= 40 ? "var(--accent-gold)" : "var(--accent-red)",
                        }}>
                          {teamSuccessChance()}%
                        </span>
                      </div>
                      <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)" }}>
                        Duration: {formatDuration(teamEffectiveDuration())}
                        {teamEffectiveDuration() < mission().duration && (
                          <span style={{ color: "var(--accent-blue)", "margin-left": "4px" }}>
                            (Wizard -{Math.round((1 - teamEffectiveDuration() / mission().duration) * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team passives */}
                    <Show when={selectedTeam().length > 0}>
                      <div class="team-passives">
                        <For each={currentTeam()}>
                          {(adv) => {
                            const cls = getClassMeta(adv.class);
                            return (
                              <div>{cls.icon} <strong>{cls.passive.name}</strong>: {cls.passive.description}</div>
                            );
                          }}
                        </For>
                        {(() => {
                          const names = currentTeam().map((a) => a.name.split(" ").slice(1).join(" "));
                          const counts = new Map<string, number>();
                          for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
                          const families = [...counts.entries()].filter(([, c]) => c > 1);
                          return families.length > 0 ? (
                            <div style={{ color: "#e91e63" }}>
                              💕 <strong>Family bond</strong>: {families.map(([name]) => name).join(", ")} (+{families.reduce((s, [, c]) => s + (c - 1) * 5, 0)}%)
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </Show>

                    {/* Mission supply slots */}
                    <div class="mission-supplies">
                      <div class="mission-supplies-label">
                        🧪 Supplies ({selectedSupplies().length}/{MAX_MISSION_SUPPLIES})
                      </div>
                      <div class="mission-supplies-slots">
                        {(() => {
                          const supplies = getAvailableSupplies(state.inventory);
                          if (supplies.length === 0) return (
                            <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "font-style": "italic" }}>
                              No potions available. Craft some at the Alchemy Lab.
                            </div>
                          );
                          return (
                            <For each={supplies}>
                              {(s) => {
                                const isSelected = () => selectedSupplies().includes(s.item.id);
                                const effect = getSupplyEffect(s.item.id);
                                return (
                                  <button
                                    class="supply-btn"
                                    classList={{ active: isSelected() }}
                                    disabled={!isSelected() && selectedSupplies().length >= MAX_MISSION_SUPPLIES}
                                    onClick={() => toggleSupply(s.item.id)}
                                  >
                                    <span class="supply-icon">{s.item.icon}</span>
                                    <span class="supply-info">
                                      <span class="supply-name">{s.item.name} ({s.quantity})</span>
                                      <span class="supply-effect">
                                        {effect?.successBonus ? `+${effect.successBonus}% success` : ""}
                                        {effect?.successBonus && (effect?.deathReduction ?? 1) < 1 ? " · " : ""}
                                        {(effect?.deathReduction ?? 1) < 1 ? `-${Math.round((1 - (effect?.deathReduction ?? 1)) * 100)}% death` : ""}
                                      </span>
                                    </span>
                                    {isSelected() && <span style={{ color: "var(--accent-green)" }}>✓</span>}
                                  </button>
                                );
                              }}
                            </For>
                          );
                        })()}
                      </div>
                    </div>

                    <button
                      class="upgrade-btn"
                      style={{ width: "100%", "margin-top": "12px" }}
                      disabled={selectedTeam().length === 0 || slotInfo().used >= slotInfo().max || state.resources.gold < mission().deployCost}
                      onClick={handleDeploy}
                    >
                      Deploy Team ({mission().deployCost}g)
                    </button>
                    <Show when={slotInfo().used >= slotInfo().max}>
                      <div style={{ color: "var(--accent-gold)", "font-size": "0.85rem", "text-align": "center", "margin-top": "6px" }}>
                        All mission slots in use
                      </div>
                    </Show>
                  </div>
                </div>
              );
            }}
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
