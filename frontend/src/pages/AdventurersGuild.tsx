import { createSignal, createMemo, For, Index, Show } from "solid-js";
import { A, useNavigate, useSearchParams } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { IS_DEV } from "~/data/seasons";
import {
  ADVENTURER_CLASSES,
  getClassMeta,
  RANK_NAMES,
  RANK_COLORS,
  CLASS_COLORS,
  getRecruitCost,
  getXpForLevel,
  getMissionXp,
  getUnspentStatPoints,
  getPortrait,
  getZoomedPortrait,
  getOrigin,
  RACE_NAMES,
  BACKSTORY_TRAITS,
  type Adventurer,
  type AdventurerRank,
} from "~/data/adventurers";
import { getItem, getAvailableSupplies, getSupplyEffect, isSupplyItem, MAX_MISSION_SUPPLIES } from "~/data/items";
import {
  type MissionTemplate,
  type MissionSlot,
  calcSuccessChance,
  calcDeathChance,
  calcEffectiveDuration,
  getMission,
  getMissionStatWeights,
  formatReward,
  getCurrentStoryMission,
} from "~/data/missions";
import Countdown from "~/components/Countdown";
import Tooltip from "~/components/Tooltip";
import { getEnemy, type EnemyDefinition } from "~/data/enemies";

type Tab = "missions" | "roster" | "recruit";

const STAT_HINTS: Record<string, string> = {
  str: "Strong attack", vit: "Strong defense", int: "Strong magic power",
  wis: "Strong magic defense", dex: "Fast",
};

function enemyHints(e: EnemyDefinition): string[] {
  // Show only the enemy's top 2 stats (excluding stats that are unremarkable)
  // This naturally scales with tier — a tier 5 with STR 40 and VIT 50
  // only highlights those two, not everything
  const stats = Object.entries(e.stats) as [string, number][];
  const sorted = stats.sort(([, a], [, b]) => b - a);
  // Only show hints for stats that are meaningfully above the enemy's own median
  const median = sorted[Math.floor(sorted.length / 2)][1];
  return sorted
    .filter(([, v]) => v > median * 1.3)
    .slice(0, 2)
    .map(([k]) => STAT_HINTS[k])
    .filter(Boolean);
}

const TAG_LABELS: Record<string, string> = {
  humanoid: "Humanoid", beast: "Beast", undead: "Undead", ghost: "Ghost",
  demon: "Demon", divine: "Divine", dragon: "Dragon", magical: "Magical",
  elemental_fire: "Fire", elemental_water: "Water", elemental_earth: "Earth",
  elemental_wind: "Wind", elemental_aether: "Aether",
};

function EnemyTooltipContent(props: { enemy: EnemyDefinition }) {
  const hp = () => props.enemy.stats.vit * 10;
  const hints = () => enemyHints(props.enemy);
  const tags = () => props.enemy.tags.map((t) => TAG_LABELS[t]).filter(Boolean);
  return (
    <div style={{ "min-width": "160px" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "4px" }}>
        <span style={{ "font-weight": "bold", color: "var(--text-primary)" }}>
          {props.enemy.icon} {props.enemy.name}
        </span>
        <span style={{ "font-size": "0.65rem", color: "var(--text-muted)" }}>
          {tags().join(", ")}
        </span>
      </div>
      <div style={{ "font-size": "0.75rem", color: "var(--accent-red)", "margin-bottom": "4px" }}>
        HP {hp()}
      </div>
      <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "font-style": "italic", "margin-bottom": hints().length ? "4px" : "0" }}>
        {props.enemy.description}
      </div>
      <For each={hints()}>
        {(h) => <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)" }}>· {h}</div>}
      </For>
    </div>
  );
}

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
    let chance = calcDeathChance(mission, currentTeam(), adv);
    // Apply supply death reduction
    for (const supplyId of selectedSupplies()) {
      const effect = getSupplyEffect(supplyId);
      if (effect) chance *= effect.deathReduction;
    }
    return Math.round(chance);
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
                return (
                  <div
                    class="building-card"
                    classList={{ upgrading: isSelected() }}
                    onClick={() => {
                      if (isSelected()) { setSelectedMission(null); setSelectedTeam([]); setSelectedSupplies([]); }
                      else { setSelectedMission(story()); setSelectedTeam([]); setSelectedSupplies([]); }
                    }}
                    style={{
                      cursor: "pointer",
                      border: "1px solid var(--accent-gold)",
                      padding: "0",
                      overflow: "hidden",
                    }}
                  >
                    <Show when={story().image}>
                      <div class="building-card-image" style={{ margin: "0", "border-radius": "0" }}>
                        <img src={story().image} alt={story().name} loading="lazy" />
                        <div class="building-card-image-overlay" style={{ display: "flex", "justify-content": "space-between", "align-items": "flex-end" }}>
                          <div>
                            <div style={{ "font-size": "0.6rem", color: "var(--accent-gold)", "margin-bottom": "2px", "text-transform": "uppercase", "letter-spacing": "0.5px", opacity: "0.8" }}>
                              Story Mission · {story().chapter}
                            </div>
                            <div class="building-card-title" style={{ color: "var(--accent-gold)" }}>{story().name}</div>
                          </div>
                        </div>
                      </div>
                    </Show>
                    <div style={{ padding: "10px 16px 16px", flex: "1", display: "flex", "flex-direction": "column" }}>
                      <div class="building-card-desc" style={{ "font-style": "italic" }}>{story().description}</div>
                      <div style={{ "margin-top": "auto", "padding-top": "12px" }}>
                        <div style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>
                          {formatDuration(story().duration)} · {story().deployCost}g deploy
                        </div>
                        <div style={{ display: "flex", gap: "6px", "margin-top": "8px", "flex-wrap": "wrap" }}>
                          <For each={story().slots}>
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
                    style={{ cursor: "pointer", ...(mission.image ? { padding: "0", overflow: "hidden" } : {}) }}
                  >
                    <Show when={mission.image}>
                      <div class="building-card-image" style={{ margin: "0", "border-radius": "0" }}>
                        <img src={mission.image} alt={mission.name} loading="lazy" />
                        <div style={{
                          position: "absolute", top: "6px", right: "6px",
                          padding: "2px 8px", "border-radius": "4px",
                          background: "rgba(0, 0, 0, 0.7)",
                          "font-size": "0.65rem", "line-height": "1.4",
                        }}>
                          <span style={{ color: [, "#aaa", "#7CFC00", "#3498db", "#9b59b6", "#f5c542"][mission.difficulty] }}>
                            {["", "Novice", "Apprentice", "Journeyman", "Veteran", "Elite"][mission.difficulty]}
                          </span>
                          <span style={{ color: "var(--text-muted)" }}>{" · "}{mission.tags.join(", ")}</span>
                        </div>
                        <div class="building-card-image-overlay">
                          <div class="building-card-title">{mission.name}</div>
                        </div>
                      </div>
                    </Show>
                    <div style={{ padding: mission.image ? "8px 16px 16px" : undefined, flex: "1", display: "flex", "flex-direction": "column" }}>
                    <Show when={!mission.image}>
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
                    </Show>
                    <div class="building-card-desc">{mission.description}</div>
                    <Show when={mission.encounters?.length}>
                      <div style={{ "margin-top": "14px", display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                        {mission.encounters!.map((enc) => {
                          const enemy = getEnemy(enc.enemyId);
                          if (!enemy) return null;
                          const borderColor = enemy.boss ? "var(--accent-gold)" : "rgba(231, 76, 60, 0.3)";
                          return (
                            <Tooltip content={<EnemyTooltipContent enemy={enemy} />}>
                              <div style={{
                                width: "80px",
                                height: "110px",
                                background: enemy.boss ? "rgba(245, 197, 66, 0.08)" : "rgba(231, 76, 60, 0.06)",
                                border: `1px solid ${borderColor}`,
                                "border-radius": "6px",
                                overflow: "hidden",
                                cursor: "default",
                                display: "flex",
                                "flex-direction": "column",
                                position: "relative",
                              }}>
                                <div style={{
                                  position: "absolute", top: "3px", left: "3px", "z-index": 1,
                                  background: "rgba(0, 0, 0, 0.7)", color: "var(--text-primary)",
                                  "font-size": "0.75rem", "font-weight": "bold",
                                  padding: "1px 5px", "border-radius": "4px",
                                  "line-height": "1.3",
                                }}>
                                  {enc.count}x
                                </div>
                                {enemy.image
                                  ? <img src={enemy.image} alt="" style={{
                                      width: "80px", height: "80px", "object-fit": "cover",
                                      display: "block", "flex-shrink": "0",
                                    }} />
                                  : <div style={{
                                      width: "80px", height: "80px", "flex-shrink": "0",
                                      display: "flex", "align-items": "center", "justify-content": "center",
                                      background: "rgba(0, 0, 0, 0.2)", "font-size": "2.2rem",
                                    }}>{enemy.icon}</div>
                                }
                                <div style={{
                                  padding: "2px 4px",
                                  "text-align": "center",
                                  "font-size": "0.6rem",
                                  color: enemy.boss ? "var(--accent-gold)" : "var(--text-secondary)",
                                  "line-height": "1.15",
                                  flex: "1",
                                  display: "flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                }}>
                                  {enemy.name}
                                </div>
                              </div>
                            </Tooltip>
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
                <div
                  class="mission-assembly"
                  classList={{ "has-bg": !!mission().image }}
                  ref={(el) => setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50)}
                  style={{ position: "relative", overflow: "hidden" }}
                >
                  {/* Immersive background image */}
                  <Show when={mission().image}>
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                      "z-index": 0, "pointer-events": "none",
                    }}>
                      <img
                        src={mission().image}
                        alt=""
                        style={{ width: "100%", height: "100%", "object-fit": "cover", "object-position": "center 30%", opacity: "0.5" }}
                      />
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(to bottom, rgba(26, 26, 46, 0.8) 0%, rgba(26, 26, 46, 0.3) 40%, rgba(26, 26, 46, 0.05) 100%)",
                      }} />
                    </div>
                  </Show>

                  {/* Left: Mission details */}
                  <div class="mission-detail-panel" style={{ position: "relative", "z-index": 1 }}>
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

                    <Show when={mission().encounters?.length}>
                      <div class="mission-detail-section">
                        <div class="mission-detail-label">Encounters</div>
                        <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                          {mission().encounters!.map((enc) => {
                            const enemy = getEnemy(enc.enemyId);
                            if (!enemy) return null;
                            const borderColor = enemy.boss ? "var(--accent-gold)" : "rgba(231, 76, 60, 0.3)";
                            return (
                              <Tooltip content={<EnemyTooltipContent enemy={enemy} />}>
                                <div style={{
                                  width: "80px",
                                  height: "110px",
                                  background: enemy.boss ? "rgba(245, 197, 66, 0.08)" : "rgba(231, 76, 60, 0.06)",
                                  border: `1px solid ${borderColor}`,
                                  "border-radius": "6px",
                                  overflow: "hidden",
                                  cursor: "default",
                                  display: "flex",
                                  "flex-direction": "column",
                                  position: "relative",
                                }}>
                                  <div style={{
                                    position: "absolute", top: "3px", left: "3px", "z-index": 1,
                                    background: "rgba(0, 0, 0, 0.7)", color: "var(--text-primary)",
                                    "font-size": "0.75rem", "font-weight": "bold",
                                    padding: "1px 5px", "border-radius": "4px",
                                    "line-height": "1.3",
                                  }}>
                                    {enc.count}x
                                  </div>
                                  {enemy.image
                                    ? <img src={enemy.image} alt="" style={{
                                        width: "80px", height: "80px", "object-fit": "cover",
                                        display: "block", "flex-shrink": "0",
                                      }} />
                                    : <div style={{
                                        width: "80px", height: "80px", "flex-shrink": "0",
                                        display: "flex", "align-items": "center", "justify-content": "center",
                                        background: "rgba(0, 0, 0, 0.2)", "font-size": "2.2rem",
                                      }}>{enemy.icon}</div>
                                  }
                                  <div style={{
                                    padding: "2px 4px",
                                    "text-align": "center",
                                    "font-size": "0.6rem",
                                    color: enemy.boss ? "var(--accent-gold)" : "var(--text-secondary)",
                                    "line-height": "1.15",
                                    flex: "1",
                                    display: "flex",
                                    "align-items": "center",
                                    "justify-content": "center",
                                  }}>
                                    {enemy.name}
                                  </div>
                                </div>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    </Show>

                    <div class="mission-detail-section">
                      <div class="mission-detail-label">Team ({selectedTeam().length}/{mission().slots.length})</div>
                      <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                        {mission().slots.map((_slot, i) => {
                          const assigned = () => {
                            const id = selectedTeam()[i];
                            return id ? state.adventurers.find((a) => a.id === id) : undefined;
                          };
                          return (
                            <div
                              onClick={() => { if (assigned()) toggleTeamMember(assigned()!.id); }}
                              style={{
                                width: "80px", height: "110px",
                                background: "rgba(255, 255, 255, 0.03)",
                                border: assigned() ? `1px solid ${CLASS_COLORS[assigned()!.class] ?? "var(--border-color)"}` : "1px dashed var(--border-color)",
                                "border-radius": "6px",
                                overflow: "hidden",
                                cursor: assigned() ? "pointer" : "default",
                                display: "flex",
                                "flex-direction": "column",
                                position: "relative",
                              }}
                            >
                              <Show when={assigned()} fallback={
                                <div style={{
                                  width: "80px", height: "80px",
                                  display: "flex", "align-items": "center", "justify-content": "center",
                                  "font-size": "2rem", color: "var(--text-muted)", opacity: "0.3",
                                }}>👤</div>
                              }>
                                <img
                                  src={getZoomedPortrait(assigned()!.name, assigned()!.class)}
                                  alt={assigned()!.name}
                                  style={{ width: "80px", height: "80px", "object-fit": "cover", display: "block", "flex-shrink": "0" }}
                                />
                              </Show>
                              <div style={{
                                padding: "2px 4px",
                                "text-align": "center",
                                "font-size": "0.6rem",
                                color: assigned() ? CLASS_COLORS[assigned()!.class] ?? "var(--text-secondary)" : "var(--text-muted)",
                                "line-height": "1.15",
                                flex: "1",
                                display: "flex",
                                "align-items": "center",
                                "justify-content": "center",
                              }}>
                                {assigned() ? assigned()!.name.split(" ")[0] : "Empty"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div class="mission-detail-section">
                      <div class="mission-detail-label">Rewards</div>
                      <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                        {mission().rewards.map((r) => (
                          <span class="quest-reward-item">{formatReward(r)}</span>
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
                  <div class="team-panel" style={{ position: "relative", "z-index": 1 }}>
                    <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "10px", color: "var(--text-primary)" }}>
                      Assemble Your Team
                    </h3>

                    <Show when={available().length === 0}>
                      <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
                        No adventurers available. Recruit some from the Recruit tab!
                      </p>
                    </Show>

                    <For each={ADVENTURER_CLASSES.filter((cls) => availableIds().some((id) => state.adventurers.find((a) => a.id === id)?.class === cls.id))}>
                      {(classInfo) => {
                        const classIds = () => availableIds().filter((id) => state.adventurers.find((a) => a.id === id)?.class === classInfo.id);
                        return (
                          <div style={{ "margin-bottom": "10px" }}>
                            <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-bottom": "4px", "text-transform": "uppercase", "letter-spacing": "1px" }}>
                              {classInfo.icon} {classInfo.name}s
                            </div>
                            <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                              <For each={classIds()}>
                                {(advId) => {
                                  const adv = () => state.adventurers.find((a) => a.id === advId)!;
                                  const isInTeam = () => selectedTeam().includes(advId);
                                  const classColor = () => CLASS_COLORS[adv().class] ?? "var(--border-color)";
                                  const xpNeeded = () => getXpForLevel(adv().level);
                                  const xpPct = () => xpNeeded() > 0 ? Math.min(100, Math.round((adv().xp / xpNeeded()) * 100)) : 0;

                                  return (
                                    <div
                                      onClick={() => toggleTeamMember(advId)}
                                      style={{
                                        display: "flex",
                                        gap: "8px",
                                        width: "200px",
                                        height: "64px",
                                        background: isInTeam() ? `${classColor()}18` : "rgba(255, 255, 255, 0.03)",
                                        border: `1px solid ${classColor()}`,
                                        "border-radius": "6px",
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        opacity: isInTeam() ? "1" : "0.75",
                                        position: "relative",
                                      }}
                                    >
                                      <Show when={isInTeam()}>
                                        <div style={{
                                          position: "absolute", top: "3px", right: "3px", "z-index": 1,
                                          background: classColor(), color: "#fff",
                                          "font-size": "0.55rem", "font-weight": "bold",
                                          width: "16px", height: "16px", "border-radius": "50%",
                                          display: "flex", "align-items": "center", "justify-content": "center",
                                        }}>✓</div>
                                      </Show>
                                      <img
                                        src={getPortrait(adv().name, adv().class)}
                                        alt={adv().name}
                                        style={{ width: "64px", height: "64px", "object-fit": "cover", display: "block", "flex-shrink": "0" }}
                                      />
                                      <div style={{ padding: "6px 8px 6px 0", display: "flex", "flex-direction": "column", "justify-content": "center", flex: "1", "min-width": "0" }}>
                                        <div style={{ "font-size": "0.75rem", color: "var(--text-primary)", "font-weight": isInTeam() ? "bold" : "normal", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>
                                          {adv().name}
                                        </div>
                                        <div style={{ "font-size": "0.65rem", color: RANK_COLORS[adv().rank] }}>
                                          {RANK_NAMES[adv().rank]} · Lv.{adv().level}
                                        </div>
                                        <div style={{ "margin-top": "4px", position: "relative" }}>
                                          <span style={{ "font-size": "0.45rem", color: "var(--text-muted)", position: "absolute", top: "-8px", left: "0" }}>EXP</span>
                                          <div style={{ height: "3px", background: "var(--bg-primary)", "border-radius": "2px" }}>
                                            <div style={{ height: "100%", width: `${xpPct()}%`, background: "var(--accent-blue)", "border-radius": "2px" }} />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                          </div>
                        );
                      }}
                    </For>

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
                    <div class="supply-slots-row">
                      <span class="supply-slots-label">🧪 Supplies</span>
                      {Array.from({ length: MAX_MISSION_SUPPLIES }).map((_, i) => {
                        const supplyId = () => selectedSupplies()[i];
                        const item = () => supplyId() ? getItem(supplyId()!) : null;
                        const effect = () => supplyId() ? getSupplyEffect(supplyId()!) : null;
                        const supplies = () => getAvailableSupplies(state.inventory);

                        return (
                          <div class="supply-slot-box" classList={{ filled: !!item() }}>
                            <Show when={item()} fallback={
                              <Show when={supplies().length > 0} fallback={
                                <span class="supply-slot-empty">—</span>
                              }>
                                <div class="supply-slot-picker">
                                  <For each={supplies()}>
                                    {(s) => {
                                      const alreadyUsed = () => selectedSupplies().includes(s.item.id);
                                      return (
                                        <button
                                          class="supply-pick-btn"
                                          disabled={alreadyUsed()}
                                          onClick={() => toggleSupply(s.item.id)}
                                          title={`${s.item.name} (${s.qty})`}
                                        >
                                          {s.item.icon}
                                        </button>
                                      );
                                    }}
                                  </For>
                                </div>
                              </Show>
                            }>
                              <button
                                class="supply-filled-btn"
                                onClick={() => toggleSupply(supplyId()!)}
                                title={`${item()!.name} — click to remove`}
                              >
                                <span style={{ "font-size": "1.2rem" }}>{item()!.icon}</span>
                                <span class="supply-filled-effect">
                                  {effect()?.successBonus ? `+${effect()!.successBonus}%` : ""}
                                  {(effect()?.deathReduction ?? 1) < 1 ? `☠-${Math.round((1 - (effect()?.deathReduction ?? 1)) * 100)}%` : ""}
                                </span>
                              </button>
                            </Show>
                          </div>
                        );
                      })}
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
                  <div class="recruit-grid">
                    <For each={classAdvs()}>
              {(adv) => {
                const cls = getClassMeta(adv.class);
                const traitDef = () => BACKSTORY_TRAITS.find((t) => t.id === adv.trait);
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
                        <img src={getPortrait(adv.name, adv.class)} alt={adv.name} loading="lazy" />
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
                        <Show when={traitDef()}>
                          <div style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            "border-radius": "4px",
                            background: "rgba(167, 139, 250, 0.1)",
                            border: "1px solid rgba(167, 139, 250, 0.2)",
                            "font-size": "0.75rem",
                          }}>
                            <span style={{ color: "#a78bfa", "font-weight": "bold" }}>{traitDef()!.name}</span>
                            <span style={{ color: "var(--text-muted)", "margin-left": "6px" }}>{traitDef()!.description}</span>
                          </div>
                        </Show>
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
                      <img src={getPortrait(candidate.name, candidate.class)} alt={candidate.name} loading="lazy" />
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
                          const traitDef = () => BACKSTORY_TRAITS.find((t) => t.id === candidate.trait);
                          return (
                            <Show when={traitDef()}>
                              <div style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                "border-radius": "4px",
                                background: "rgba(167, 139, 250, 0.1)",
                                border: "1px solid rgba(167, 139, 250, 0.2)",
                                "font-size": "0.75rem",
                                "margin-top": "2px",
                              }}>
                                <span style={{ color: "#a78bfa", "font-weight": "bold" }}>{traitDef()!.name}</span>
                                <span style={{ color: "var(--text-muted)", "margin-left": "6px" }}>{traitDef()!.description}</span>
                              </div>
                            </Show>
                          );
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
