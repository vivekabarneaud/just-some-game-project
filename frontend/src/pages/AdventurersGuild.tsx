import { createSignal, createMemo, For, Show } from "solid-js";
import { A, useSearchParams } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { IS_DEV } from "~/data/seasons";
import {
  ADVENTURER_CLASSES,
  getClassMeta,
  RANK_NAMES,
  RANK_COLORS,
  getRecruitCost,
  getXpForLevel,
  getMissionXp,
  getUnspentStatPoints,
  getPortrait,
  getOrigin,
  RACE_NAMES,
  type Adventurer,
  type AdventurerRank,
} from "~/data/adventurers";
import { getItem } from "~/data/items";
import {
  type MissionTemplate,
  type MissionSlot,
  getMission,
  formatReward,
  getCurrentStoryMission,
} from "~/data/missions";
import Countdown from "~/components/Countdown";
import Tooltip from "~/components/Tooltip";
import EnemyCard from "~/components/EnemyCard";
import TraitBadge from "~/components/TraitBadge";
import MissionAssemblyPanel from "~/components/MissionAssemblyPanel";
import { getEnemy } from "~/data/enemies";
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "~/data/constants";

type Tab = "missions" | "roster" | "recruit";



/** Get the image for a mission from source data (avoids stale paths in saved state) */
function getMissionImage(missionId: string): string | undefined {
  return getMission(missionId)?.image;
}

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
  const storyMission = () => getCurrentStoryMission(guildLevel(), state.completedStoryMissions ?? []);
  const CLASS_ORDER: Record<string, number> = { warrior: 0, priest: 1, wizard: 2, archer: 3, assassin: 4 };
  const availableIds = createMemo(() =>
    state.adventurers
      .filter((a) => a.alive && !a.onMission)
      .sort((a, b) => (CLASS_ORDER[a.class] ?? 9) - (CLASS_ORDER[b.class] ?? 9) || b.level - a.level)
      .map((a) => a.id)
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


  /** Assign team members to mission slots optimally — class matches first, then "any" slots */

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
                            {result.rewards.map((r) => formatReward(r)).join(", ")}
                            {!result.success && <span style={{ color: "var(--accent-purple)", "margin-left": "4px" }}>(assassin salvage)</span>}
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
                      {[
                        result.combatRounds ? <span>{result.combatVictory ? "Victory" : "Defeated"} in {result.combatRounds} rounds</span> : null,
                        result.xpGained > 0 ? <span>+{result.xpGained} XP</span> : null,
                        result.levelUps.length > 0 ? <span style={{ color: "var(--accent-blue)" }}>Level up: {result.levelUps.join(", ")}</span> : null,
                        result.rankUps.length > 0 ? <span style={{ color: "var(--accent-gold)" }}>Rank up: {result.rankUps.map((r) => `${r.name} → ${r.newRank}`).join(", ")}</span> : null,
                        result.casualties.length > 0 ? <span style={{ color: "var(--accent-red)" }}>Fallen: {result.casualties.join(", ")}</span> : null,
                        result.revived.length > 0 ? <span style={{ color: "#9b59b6" }}>Revived: {result.revived.length}</span> : null,
                      ].filter(Boolean).map((el, idx, arr) => <>{el}{idx < arr.length - 1 ? " · " : ""}</>)}
                    </div>
                    {/* Combat log — collapsible */}
                    <Show when={result.combatLog?.length}>
                      {(() => {
                        const [expanded, setExpanded] = createSignal(false);
                        return (
                          <div style={{ "margin-top": "4px" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded()); }}
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "var(--text-muted)", "font-size": "0.75rem",
                                padding: "2px 0", "text-decoration": "underline",
                              }}
                            >
                              {expanded() ? "Hide combat log" : "Show combat log"}
                            </button>
                            <Show when={expanded()}>
                              <div style={{
                                "margin-top": "4px", padding: "6px 8px",
                                background: "rgba(0, 0, 0, 0.2)", "border-radius": "4px",
                                "max-height": "200px", overflow: "auto",
                                "font-size": "0.72rem", "line-height": "1.6",
                              }}>
                                {(() => {
                                  let lastRound = 0;
                                  return result.combatLog!.map((entry) => {
                                    const showRound = entry.round !== lastRound;
                                    lastRound = entry.round;
                                    return (
                                      <>
                                        {showRound && (
                                          <div style={{ color: "var(--text-muted)", "font-weight": "bold", "margin-top": entry.round > 1 ? "4px" : "0" }}>
                                            Round {entry.round}
                                          </div>
                                        )}
                                        <div style={{ color: entry.isPoisonTick ? "#9b59b6" : entry.isEnemy ? "var(--accent-red)" : "var(--text-secondary)" }}>
                                          {entry.attackerIcon}{" "}
                                          {entry.abilityName && <span style={{ color: "var(--accent-gold)" }}>[{entry.abilityName}] </span>}
                                          {entry.isPoisonTick
                                            ? <><strong>{entry.targetName}</strong> takes <span style={{ color: "#9b59b6" }}>{entry.damage} poison damage</span>
                                                    {entry.targetHp != null && !entry.killed && <span style={{ color: "var(--text-muted)" }}> ({entry.targetHp}/{entry.targetMaxHp})</span>}
                                                    {entry.killed && <span style={{ color: "var(--accent-red)" }}> — killed!</span>}
                                                  </>
                                            : <><strong>{entry.attackerName}</strong>
                                              {entry.isTaunt
                                                ? <> taunts all enemies — <span style={{ color: "var(--accent-blue)" }}>they must attack {entry.attackerName} next round!</span></>
                                                : entry.isShieldWall
                                                  ? <> absorbs the blow meant for <strong>{entry.targetName}</strong>! <span style={{ color: "var(--accent-red)" }}>{entry.damage} damage taken</span>
                                                      {entry.killed && <span> — {entry.attackerName} falls!</span>}
                                                    </>
                                                  : entry.targets
                                                  ? <> hits {entry.targets.map((t, i) => (
                                                      <span>
                                                        {i > 0 && ", "}
                                                        <strong>{t.name}</strong> for {entry.healed
                                                          ? <span style={{ color: "var(--accent-green)" }}>+{Math.abs(t.damage)} HP</span>
                                                          : <span style={{ color: "var(--accent-gold)" }}>{t.damage}</span>
                                                        }
                                                        {t.killed && <span style={{ color: "var(--accent-red)" }}> (killed!)</span>}
                                                      </span>
                                                    ))}</>
                                                  : entry.healed
                                                    ? <> heals <strong>{entry.targetName}</strong> for <span style={{ color: "var(--accent-green)" }}>+{entry.healAmount} HP</span>
                                                        {entry.targetHp != null && <span style={{ color: "var(--text-muted)" }}> ({entry.targetHp}/{entry.targetMaxHp})</span>}
                                                      </>
                                                    : entry.dodged
                                                      ? <> attacks <strong>{entry.targetName}</strong> — <span style={{ color: "var(--accent-blue)" }}>dodged!</span></>
                                                      : <> {entry.crit ? <span style={{ color: "#f39c12" }}>CRIT! </span> : ""}hits <strong>{entry.targetName}</strong> for <span style={{ color: entry.isEnemy ? "var(--accent-red)" : "var(--accent-gold)" }}>{entry.damage} damage</span>
                                                        {entry.targetHp != null && !entry.killed && <span style={{ color: "var(--text-muted)" }}> ({entry.targetHp}/{entry.targetMaxHp})</span>}
                                                        {entry.killed && <span style={{ color: "var(--accent-red)" }}> — killed!</span>}
                                                      </>
                                              }</>
                                          }
                                        </div>
                                      </>
                                    );
                                  });
                                })()}
                              </div>
                            </Show>
                          </div>
                        );
                      })()}
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>

        {/* ── Missions tab ── */}
        <Show when={tab() === "missions"}>
          <Show when={state.activeMissions.length > 0}>
            <div style={{ display: "flex", "align-items": "center", gap: "10px", "margin-bottom": "8px" }}>
              <h3 style={{ "font-family": "var(--font-heading)", margin: 0, color: "var(--text-primary)" }}>
                Active Missions
              </h3>
              <Show when={IS_DEV}>
                <button
                  class="skip-season-btn"
                  onClick={() => actions.skipMissionTimers()}
                  style={{ "font-size": "0.7rem", padding: "2px 8px" }}
                >
                  Skip all ⏩
                </button>
              </Show>
            </div>
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
                          Rewards: {template().rewards.map((r: any) => formatReward(r)).join(", ")}
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
            {(() => {
              const count = typeof state.missionRerollToday === "number" ? state.missionRerollToday : 0;
              const cost = 10 * Math.pow(2, count);
              const canAfford = state.astralShards >= cost;
              return (
            <button
              onClick={() => actions.rerollMissions()}
              disabled={!canAfford}
              style={{
                padding: "3px 10px",
                background: canAfford ? "rgba(167, 139, 250, 0.2)" : "var(--bg-secondary)",
                border: `1px solid ${canAfford ? "#a78bfa" : "var(--border-default)"}`,
                color: canAfford ? "#a78bfa" : "var(--text-muted)",
                "border-radius": "4px",
                cursor: canAfford ? "pointer" : "default",
                "font-size": "0.75rem",
              }}
            >
              Reroll ({cost} 💠)
            </button>
              );
            })()}
          </div>
          <Show when={state.missionBoard.length === 0}>
            <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
              No missions available. The board refreshes daily.
            </p>
          </Show>
          <div class="buildings-grid">
            {/* Story mission — pinned at top */}
            <Show when={(() => {
              const sm = storyMission();
              return sm && !state.activeMissions.some((am) => am.missionId === sm.id) ? sm : null;
            })()}>
              {(story) => {
                const isSelected = () => selectedMission()?.id === story().id;
                const freshStory = () => getMission(story().id) ?? story();
                const storyImage = () => getMissionImage(story().id) ?? story().image;
                return (
                  <div
                    class="building-card"
                    classList={{ upgrading: isSelected() }}
                    onClick={() => {
                      if (isSelected()) { setSelectedMission(null); setSelectedTeam([]); setSelectedSupplies([]); }
                      else { setSelectedMission(story()); setSelectedTeam([]); setSelectedSupplies([]); }
                    }}
                    style={{ cursor: "pointer", border: "2px solid var(--accent-gold)", padding: "0", overflow: "hidden" }}
                  >
                    <Show when={storyImage()}>
                      <div class="building-card-image" style={{ margin: "0", "border-radius": "0" }}>
                        <img src={storyImage()} alt={story().name} loading="lazy" />
                        <div style={{
                          position: "absolute", top: "6px", left: "6px",
                          padding: "2px 8px", "border-radius": "4px",
                          background: "rgba(0, 0, 0, 0.7)",
                          "font-size": "0.6rem", "line-height": "1.4",
                          color: "var(--accent-gold)", "text-transform": "uppercase", "letter-spacing": "0.5px",
                        }}>
                          Story Mission · {(story() as any).chapter}
                        </div>
                        <div style={{
                          position: "absolute", top: "6px", right: "6px",
                          padding: "2px 8px", "border-radius": "4px",
                          background: "rgba(0, 0, 0, 0.7)",
                          "font-size": "0.65rem", "line-height": "1.4",
                        }}>
                          <span style={{ color: DIFFICULTY_COLORS[story().difficulty] }}>
                            {DIFFICULTY_LABELS[story().difficulty]}
                          </span>
                        </div>
                        <div class="building-card-image-overlay">
                          <div class="building-card-title" style={{ color: "var(--accent-gold)" }}>{story().name}</div>
                        </div>
                      </div>
                    </Show>
                    <div style={{ padding: storyImage() ? "8px 16px 16px" : "10px 16px 16px", flex: "1", display: "flex", "flex-direction": "column" }}>
                      <Show when={!storyImage()}>
                        <div style={{ "font-size": "0.6rem", color: "var(--accent-gold)", "text-transform": "uppercase", "letter-spacing": "0.5px", "margin-bottom": "4px" }}>
                          Story Mission · {(story() as any).chapter}
                        </div>
                        <div class="building-card-title" style={{ color: "var(--accent-gold)", "margin-bottom": "4px" }}>{story().icon} {story().name}</div>
                      </Show>
                      <div class="building-card-desc" style={{ "font-style": "italic" }}>{story().description}</div>
                      <Show when={freshStory().encounters?.length}>
                        <div style={{ "margin-top": "14px", display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                          {freshStory().encounters!.map((enc) => {
                            const enemy = getEnemy(enc.enemyId);
                            if (!enemy) return null;
                            return <EnemyCard enemy={enemy} count={enc.count} />;
                          })}
                        </div>
                      </Show>
                      <div style={{ "margin-top": "auto", "padding-top": "12px" }}>
                        <div style={{ "margin-top": "8px", "font-size": "0.8rem", color: "var(--accent-green)" }}>
                          Rewards: {story().rewards.map((r: any) => formatReward(r)).join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            </Show>
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
                    style={{ cursor: "pointer", ...(getMissionImage(mission.id) ? { padding: "0", overflow: "hidden" } : {}) }}
                  >
                    <Show when={getMissionImage(mission.id)}>
                      <div class="building-card-image" style={{ margin: "0", "border-radius": "0" }}>
                        <img src={getMissionImage(mission.id)} alt={mission.name} loading="lazy" />
                        <div style={{
                          position: "absolute", top: "6px", right: "6px",
                          padding: "2px 8px", "border-radius": "4px",
                          background: "rgba(0, 0, 0, 0.7)",
                          "font-size": "0.65rem", "line-height": "1.4",
                        }}>
                          <span style={{ color: DIFFICULTY_COLORS[mission.difficulty] }}>
                            {DIFFICULTY_LABELS[mission.difficulty]}
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>{" · "}{mission.tags.join(", ")}</span>
                        </div>
                        <div class="building-card-image-overlay">
                          <div class="building-card-title">{mission.name}</div>
                        </div>
                      </div>
                    </Show>
                    <div style={{ padding: getMissionImage(mission.id) ? "8px 16px 16px" : undefined, flex: "1", display: "flex", "flex-direction": "column" }}>
                    <Show when={!getMissionImage(mission.id)}>
                      <span class="building-card-category">
                        <span style={{ color: DIFFICULTY_COLORS[mission.difficulty] }}>
                          {DIFFICULTY_LABELS[mission.difficulty]}
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
                    </Show>
                    <div class="building-card-desc">{mission.description}</div>
                    <Show when={mission.encounters?.length}>
                      <div style={{ "margin-top": "14px", display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                        {mission.encounters!.map((enc) => {
                          const enemy = getEnemy(enc.enemyId);
                          if (!enemy) return null;
                          return (
                            <EnemyCard enemy={enemy} count={enc.count} />
                          );
                        })}
                      </div>
                    </Show>
                    <div style={{ "margin-top": "auto", "padding-top": "12px" }}>
                      <div style={{ "font-size": "0.8rem", color: "var(--accent-green)" }}>
                        Rewards: {mission.rewards.map((r) => formatReward(r)).join(", ")}
                      </div>
                      <div style={{ "font-size": "0.75rem", color: "var(--accent-blue)", "margin-top": "2px" }}>
                        +{getMissionXp(mission.difficulty, true)} XP on success · +{getMissionXp(mission.difficulty, false)} XP on failure
                      </div>
                    </div>
                    </div>{/* end content wrapper */}
                  </div>
                );
              }}
            </For>
          </div>

          {/* Mission assembly panel */}
          <Show when={selectedMission()}>
            {(mission) => (
              <MissionAssemblyPanel
                mission={mission()}
                onCancel={() => { setSelectedMission(null); setSelectedTeam([]); setSelectedSupplies([]); }}
                onDeploy={(missionId, teamIds, supplyIds) => {
                  if (actions.deployMission(missionId, teamIds, supplyIds)) {
                    setSelectedMission(null);
                    setSelectedTeam([]);
                    setSelectedSupplies([]);
                    return true;
                  }
                  return false;
                }}
              />
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
                  <div class="recruit-grid">
                    <For each={classAdvs()}>
              {(adv) => {
                const cls = getClassMeta(adv.class);

                const equippedItems = () => {
                  const eq = adv.equipment;
                  return [eq.mainHand, eq.offHand, eq.head, eq.chest, eq.legs, eq.boots, eq.cloak, eq.trinket]
                    .filter(Boolean)
                    .map((id) => getItem(id!))
                    .filter(Boolean);
                };
                const totalSlots = 11;
                const emptySlotCount = () => totalSlots - Object.values(adv.equipment).filter(Boolean).length;
                const unspent = () => getUnspentStatPoints(adv);
                return (
                  <A href={`/guild/${adv.id}`} style={{ "text-decoration": "none", display: "flex" }}>
                    <div class="building-card adv-card" style={{
                      cursor: "pointer",
                      position: "relative",
                      width: "100%",
                      opacity: adv.onMission ? 0.7 : 1,
                      background: adv.onMission ? "var(--bg-secondary)" : "var(--bg-card)",
                      "border-color": adv.onMission ? "var(--accent-blue)" : undefined,
                    }}>
                      <span class="building-card-category" style={{ color: RANK_COLORS[adv.rank] }}>
                        {RANK_NAMES[adv.rank]}
                      </span>
                      <div class="adv-card-portrait">
                        <img src={getPortrait(adv.name, adv.class, adv.origin)} alt={adv.name} loading="lazy" />
                      </div>
                      <div class="adv-card-content">
                        <div class="building-card-title">{adv.name}</div>
                        <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>
                          {adv.race ? `${RACE_NAMES[adv.race]} ` : ""}{cls.name} · Lv.{adv.level}
                        </div>
                        <Show when={adv.origin}>
                          <div style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>
                            {getOrigin(adv.origin)?.name} — {getOrigin(adv.origin)?.region}
                          </div>
                        </Show>
                        <XpBar xp={adv.xp} level={adv.level} />
                        <Show when={adv.backstory}>
                          <div style={{
                            "font-size": "0.78rem",
                            color: "var(--text-secondary)",
                            "font-style": "italic",
                            "line-height": "1.4",
                            "padding-left": "8px",
                            "border-left": "2px solid var(--border-color)",
                          }}>
                            "{adv.backstory}"
                          </div>
                        </Show>
                        <TraitBadge traitId={adv.trait} />
                        <div style={{ "margin-top": "auto", "padding-top": "8px", "font-size": "0.75rem", display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
                          {equippedItems().map((item) => <span title={item!.name}>{item!.icon}</span>)}
                          {emptySlotCount() > 0 && (
                            <span style={{ color: "var(--accent-gold)", "font-size": "0.7rem" }}>
                              {emptySlotCount()} empty gear slot{emptySlotCount() > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
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
            {(() => {
              const count = typeof state.recruitRerollToday === "number" ? state.recruitRerollToday : 0;
              const cost = 10 * Math.pow(2, count);
              const canAfford = state.astralShards >= cost;
              return (
            <button
              onClick={() => actions.rerollRecruits()}
              disabled={!canAfford}
              style={{
                padding: "3px 10px",
                background: canAfford ? "rgba(167, 139, 250, 0.2)" : "var(--bg-secondary)",
                border: `1px solid ${canAfford ? "#a78bfa" : "var(--border-default)"}`,
                color: canAfford ? "#a78bfa" : "var(--text-muted)",
                "border-radius": "4px",
                cursor: canAfford ? "pointer" : "default",
                "font-size": "0.75rem",
              }}
            >
              Reroll ({cost} 💠)
            </button>
              );
            })()}
            <Show when={IS_DEV}>
              <button
                onClick={() => actions.devAddShards(1000)}
                style={{ "font-size": "0.7rem", padding: "2px 8px", "margin-left": "8px" }}
                class="skip-season-btn"
              >
                +1000 💠
              </button>
            </Show>
          </div>
          <Show when={state.recruitCandidates.length === 0}>
            <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
              No candidates available right now. New candidates appear daily.
            </p>
          </Show>
          <div class="recruit-grid">
            <For each={state.recruitCandidates}>
              {(candidate) => {
                const cls = getClassMeta(candidate.class);
                const cost = getRecruitCost(candidate.rank);
                const canAfford = () => state.resources.gold >= cost;
                const rosterFull = () => rosterSize().current >= rosterSize().max;
                return (
                  <div class="building-card adv-card">
                    <span class="building-card-category" style={{ color: RANK_COLORS[candidate.rank] }}>
                      {RANK_NAMES[candidate.rank]}
                    </span>
                    <div class="adv-card-portrait">
                      <img src={getPortrait(candidate.name, candidate.class, candidate.origin)} alt={candidate.name} loading="lazy" />
                    </div>
                    <div class="adv-card-content">
                      <div class="building-card-title">{candidate.name}</div>
                      <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>
                        {candidate.race ? `${RACE_NAMES[candidate.race]} ` : ""}{cls.name} · Lv.{candidate.level}
                      </div>
                      <Show when={candidate.origin}>
                        <div style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>
                          {getOrigin(candidate.origin)?.name} — {getOrigin(candidate.origin)?.region}
                        </div>
                      </Show>
                      <Show when={candidate.backstory}>
                        <div style={{
                          "font-size": "0.78rem",
                          color: "var(--text-secondary)",
                          "font-style": "italic",
                          "line-height": "1.4",
                          "margin-top": "4px",
                          "padding-left": "8px",
                          "border-left": "2px solid var(--border-color)",
                        }}>
                          "{candidate.backstory}"
                        </div>
                      </Show>
                      <Show when={candidate.trait} fallback={
                        <div style={{ "font-size": "0.78rem", color: "var(--text-muted)" }}>
                          {cls.passive.name}: {cls.passive.description}
                        </div>
                      }>
                        {(() => {
                          return <TraitBadge traitId={candidate.trait} />;
                        })()}
                      </Show>
                    <div style={{ "margin-top": "auto", "padding-top": "10px" }}>
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
                    </div>{/* end adv-card-content */}
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
