import { createSignal, createMemo, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import {
  ADVENTURER_CLASSES,
  getClassMeta,
  CLASS_COLORS,
  getPortrait,
  getXpForLevel,
  RANK_NAMES,
  RANK_COLORS,
  type Adventurer,
  type AdventurerClass,
} from "~/data/adventurers";
import { getItem, getAvailableSupplies, getSupplyEffect, getCombatPotionEffect, MAX_MISSION_SUPPLIES } from "~/data/items";
import {
  type MissionTemplate,
  calcSuccessChance,
  calcDeathChance,
  calcEffectiveDuration,
  getMission,
  getMissionStatWeights,
  getMissionStatHint,
  formatReward,
  areRequiredSlotsFilled,
} from "~/data/missions";
import { getEnemy } from "~/data/enemies";
import { simulateCombat } from "~/data/combat";
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "~/data/constants";
import EnemyCard from "./EnemyCard";
import TeamSlot from "./TeamSlot";
import AdventurerPickerCard from "./AdventurerPickerCard";
import Tooltip from "./Tooltip";

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

interface Props {
  mission: MissionTemplate;
  onCancel: () => void;
  onDeploy: (missionId: string, teamIds: string[], supplies: string[]) => boolean;
}

export default function MissionAssemblyPanel(props: Props) {
  const { state, actions } = useGame();
  const [teamIds, setTeamIds] = createSignal<string[]>([]);
  const [supplies, setSupplies] = createSignal<string[]>([]);
  const [cachedSuccess, setCachedSuccess] = createSignal<{ key: string; pct: number }>({ key: "", pct: 0 });

  const mission = () => props.mission;
  const freshMission = () => getMission(mission().id) ?? mission();
  const slotInfo = () => actions.getMissionSlotInfo();

  // ─── Available adventurers ────────────────────────────────────
  const CLASS_ORDER: Record<string, number> = { warrior: 0, priest: 1, wizard: 2, archer: 3, assassin: 4 };
  const availableAdvs = createMemo(() =>
    state.adventurers
      .filter((a) => a.alive && !a.onMission)
      .sort((a, b) => (CLASS_ORDER[a.class] ?? 9) - (CLASS_ORDER[b.class] ?? 9) || b.level - a.level)
  );

  // ─── Team management ──────────────────────────────────────────
  const canFitInSlots = (advIds: string[]): boolean => {
    const slots = mission().slots;
    const candidates = advIds.map((id) => state.adventurers.find((a) => a.id === id)).filter(Boolean) as Adventurer[];
    const remaining = [...candidates];
    const assigned: (Adventurer | undefined)[] = new Array(slots.length).fill(undefined);
    for (let si = 0; si < slots.length; si++) {
      const slot = slots[si];
      if (!slot.required || slot.class === "any") continue;
      const idx = remaining.findIndex((a) => a.class === slot.class);
      if (idx !== -1) { assigned[si] = remaining[idx]; remaining.splice(idx, 1); }
    }
    for (let si = 0; si < slots.length; si++) {
      if (assigned[si]) continue;
      const slot = slots[si];
      if (slot.required && slot.class !== "any") continue;
      if (remaining.length > 0) { assigned[si] = remaining.shift(); }
    }
    return remaining.length === 0;
  };

  const toggleTeam = (advId: string) => {
    setTeamIds((prev) => {
      if (prev.includes(advId)) return prev.filter((id) => id !== advId);
      if (prev.length < mission().slots.length && canFitInSlots([...prev, advId])) {
        return [...prev, advId];
      }
      for (let ri = prev.length - 1; ri >= 0; ri--) {
        const replaced = [...prev];
        replaced[ri] = advId;
        if (canFitInSlots(replaced)) return replaced;
      }
      return prev;
    });
  };

  const team = createMemo(() =>
    teamIds().map((id) => state.adventurers.find((a) => a.id === id)).filter(Boolean) as Adventurer[]
  );

  // ─── Slot assignments (for display) ───────────────────────────
  const slotAssignments = createMemo(() => {
    const slots = mission().slots;
    const assignments: (Adventurer | undefined)[] = new Array(slots.length).fill(undefined);
    const remaining = [...team()];
    for (let si = 0; si < slots.length; si++) {
      const s = slots[si];
      if (!s.required || s.class === "any") continue;
      const idx = remaining.findIndex((a) => a.class === s.class);
      if (idx !== -1) { assignments[si] = remaining[idx]; remaining.splice(idx, 1); }
    }
    for (let si = 0; si < slots.length; si++) {
      if (assignments[si]) continue;
      const s = slots[si];
      if (s.required && s.class !== "any") continue;
      if (remaining.length > 0) { assignments[si] = remaining.shift(); }
    }
    return assignments;
  });

  // ─── Success chance (cached, no reactive loop) ────────────────
  const successChance = () => {
    const ids = teamIds();
    if (ids.length === 0) return 0;
    const key = `${mission().id}:${ids.join(",")}`;
    if (cachedSuccess().key === key) return cachedSuccess().pct;

    const fm = freshMission();
    let pct: number;

    if (fm.encounters?.length) {
      const plainTeam = team().map((a) => JSON.parse(JSON.stringify(a)));
      let wins = 0;
      for (let i = 0; i < 25; i++) {
        if (simulateCombat(fm, plainTeam, supplies())?.victory) wins++;
      }
      pct = Math.round((wins / 25) * 100);
    } else {
      // Non-combat: stat-based check with potion stat bonuses
      let statBonus = 0;
      for (const sid of supplies()) {
        const eff = getSupplyEffect(sid);
        if (eff) statBonus += eff.successBonus;
      }
      pct = calcSuccessChance(fm, team(), statBonus);
    }

    setCachedSuccess({ key, pct });
    return pct;
  };

  const successColor = () =>
    successChance() >= 70 ? "var(--accent-green)" :
    successChance() >= 40 ? "var(--accent-gold)" : "var(--accent-red)";

  // ─── Supplies ─────────────────────────────────────────────────
  const toggleSupply = (itemId: string) => {
    setSupplies((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      if (prev.length >= MAX_MISSION_SUPPLIES) return prev;
      return [...prev, itemId];
    });
  };

  // ─── Duration ─────────────────────────────────────────────────
  const effectiveDuration = () => calcEffectiveDuration(mission(), team());

  // ─── Deploy ───────────────────────────────────────────────────
  const handleDeploy = () => {
    if (props.onDeploy(mission().id, teamIds(), supplies())) {
      setTeamIds([]);
      setSupplies([]);
    }
  };

  // ─── Stat info ────────────────────────────────────────────────
  const STAT_LABELS: Record<string, string> = { str: "STR", int: "INT", dex: "DEX", vit: "VIT", wis: "WIS" };
  const topStats = () => {
    const w = getMissionStatWeights(mission().tags);
    return Object.entries(w).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0)).slice(0, 2).map(([k]) => STAT_LABELS[k]);
  };

  return (
    <div
      class="mission-assembly"
      classList={{ "has-bg": !!getMissionImage(mission().id) }}
      ref={(el) => setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50)}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Background image */}
      <Show when={getMissionImage(mission().id)}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          "z-index": 0, "pointer-events": "none",
        }}>
          <img
            src={getMissionImage(mission().id)}
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

        <p style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "font-style": "italic", margin: "10px 0" }}>
          {mission().description}
        </p>
        <Show when={!freshMission().encounters?.length}>
          <div style={{ "font-size": "0.8rem", color: "var(--accent-blue)", "font-style": "italic", "margin-bottom": "8px" }}>
            {getMissionStatHint(mission().tags)}
          </div>
        </Show>

        <Show when={freshMission().encounters?.length}>
          <div class="mission-detail-section">
            <div class="mission-detail-label">Encounters</div>
            <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
              {freshMission().encounters!.map((enc) => {
                const enemy = getEnemy(enc.enemyId);
                return enemy ? <EnemyCard enemy={enemy} count={enc.count} /> : null;
              })}
            </div>
          </div>
        </Show>

        <div class="mission-detail-section">
          <div class="mission-detail-label">Team ({teamIds().length}/{mission().slots.length})</div>
          <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
            <For each={mission().slots}>
              {(slot, i) => (
                <TeamSlot
                  slot={slot}
                  adventurer={slotAssignments()[i()]}
                  onClick={() => {
                    const adv = slotAssignments()[i()];
                    if (adv) toggleTeam(adv.id);
                  }}
                />
              )}
            </For>
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
          <div><span class="mission-detail-label">Key stats</span> {topStats().join(", ")}</div>
        </div>

        <button
          style={{
            "margin-top": "12px", padding: "6px 14px", background: "none",
            border: "1px solid var(--border-color)", "border-radius": "4px",
            color: "var(--text-muted)", cursor: "pointer", "font-size": "0.8rem",
          }}
          onClick={props.onCancel}
        >
          Cancel
        </button>
      </div>

      {/* Right: Team assembly */}
      <div class="team-panel" style={{ position: "relative", "z-index": 1 }}>
        <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "10px", color: "var(--text-primary)" }}>
          Assemble Your Team
        </h3>

        <Show when={availableAdvs().length === 0}>
          <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
            No adventurers available. Recruit some from the Recruit tab!
          </p>
        </Show>

        <For each={ADVENTURER_CLASSES.filter((cls) => availableAdvs().some((a) => a.class === cls.id))}>
          {(classInfo) => {
            const classAdvs = () => availableAdvs().filter((a) => a.class === classInfo.id);
            return (
              <div style={{ "margin-bottom": "10px" }}>
                <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-bottom": "4px", "text-transform": "uppercase", "letter-spacing": "1px" }}>
                  {classInfo.icon} {classInfo.name}s
                </div>
                <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                  <For each={classAdvs()}>
                    {(adv) => (
                      <AdventurerPickerCard
                        adventurer={adv}
                        selected={teamIds().includes(adv.id)}
                        onClick={() => toggleTeam(adv.id)}
                      />
                    )}
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
            <span class="team-success-value" style={{ color: successColor() }}>
              {successChance()}%
            </span>
          </div>
          <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)" }}>
            Duration: {formatDuration(effectiveDuration())}
            {effectiveDuration() < mission().duration && (
              <span style={{ color: "var(--accent-blue)", "margin-left": "4px" }}>
                (Wizard -{Math.round((1 - effectiveDuration() / mission().duration) * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* Team passives */}
        <Show when={teamIds().length > 0}>
          <div class="team-passives">
            <For each={team()}>
              {(adv) => {
                const cls = getClassMeta(adv.class);
                return <div>{cls.icon} <strong>{cls.passive.name}</strong>: {cls.passive.description}</div>;
              }}
            </For>
          </div>
        </Show>

        {/* Supplies */}
        {(() => {
          const isCombat = () => !!freshMission().encounters?.length;
          const potionCat = () => isCombat() ? "combat" as const : "mission" as const;
          return (
        <div style={{ "margin-top": "12px" }}>
          <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "8px" }}>
            🧪 {isCombat() ? "Combat Potions" : "Mission Supplies"} ({supplies().length}/{MAX_MISSION_SUPPLIES})
          </div>

          <Show when={supplies().length > 0}>
            <div style={{ display: "flex", gap: "6px", "margin-bottom": "10px", "flex-wrap": "wrap" }}>
              <For each={supplies()}>
                {(supplyId) => {
                  const allSupplies = () => getAvailableSupplies(state.inventory, potionCat());
                  const info = () => allSupplies().find((s) => s.item.id === supplyId)?.item ?? getItem(supplyId);
                  const effect = () => getSupplyEffect(supplyId);
                  return (
                    <div
                      onClick={() => toggleSupply(supplyId)}
                      style={{
                        display: "flex", "align-items": "center", gap: "6px",
                        padding: "4px 10px 4px 6px",
                        background: "rgba(167, 139, 250, 0.1)",
                        border: "1px solid rgba(167, 139, 250, 0.3)",
                        "border-radius": "6px", cursor: "pointer", "font-size": "0.75rem",
                      }}
                    >
                      <span style={{ "font-size": "1.1rem" }}>{info()?.icon}</span>
                      <div>
                        <div style={{ color: "var(--text-primary)" }}>{info()?.name}</div>
                        <div style={{ "font-size": "0.65rem", color: "var(--accent-green)" }}>
                          {effect()?.successBonus ? `+${effect()!.successBonus} stat ` : ""}
                          {(effect()?.deathReduction ?? 1) < 1 ? `☠-${Math.round((1 - (effect()?.deathReduction ?? 1)) * 100)}%` : ""}
                          {(() => { const cp = getCombatPotionEffect(supplyId); return cp ? `+${cp.value}% ${cp.type.replace("_", " ")}` : ""; })()}
                        </div>
                      </div>
                      <span style={{ color: "var(--text-muted)", "margin-left": "4px" }}>✕</span>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>

          {(() => {
            const availableSupplies = () => getAvailableSupplies(state.inventory, potionCat());
            return (
              <Show when={availableSupplies().length > 0}>
                <div style={{
                  display: "grid", "grid-template-columns": "repeat(auto-fill, minmax(48px, 1fr))",
                  gap: "6px", padding: "8px", background: "var(--bg-primary)",
                  "border-radius": "6px", border: "1px solid var(--border-color)",
                }}>
                  <For each={availableSupplies()}>
                    {(s) => {
                      const used = () => supplies().includes(s.item.id);
                      const full = () => supplies().length >= MAX_MISSION_SUPPLIES;
                      return (
                        <Tooltip content={
                          <div>
                            <div style={{ "font-weight": "bold", color: "var(--text-primary)" }}>{s.item.icon} {s.item.name}</div>
                            <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "2px" }}>{s.item.description}</div>
                            <div style={{ "font-size": "0.65rem", color: "var(--text-muted)", "margin-top": "2px" }}>Qty: {s.qty}</div>
                          </div>
                        } position="bottom">
                          <div
                            onClick={() => { if (!used() && !full()) toggleSupply(s.item.id); }}
                            style={{
                              width: "48px", height: "48px",
                              display: "flex", "flex-direction": "column",
                              "align-items": "center", "justify-content": "center",
                              background: used() ? "rgba(167, 139, 250, 0.15)" : "rgba(255, 255, 255, 0.03)",
                              border: `1px solid ${used() ? "rgba(167, 139, 250, 0.4)" : "var(--border-color)"}`,
                              "border-radius": "6px",
                              cursor: used() || full() ? "default" : "pointer",
                              opacity: used() ? "0.5" : full() ? "0.4" : "1",
                              position: "relative",
                            }}
                          >
                            <span style={{ "font-size": "1.2rem" }}>{s.item.icon}</span>
                            <span style={{ position: "absolute", bottom: "2px", right: "4px", "font-size": "0.5rem", color: "var(--text-muted)" }}>{s.qty}</span>
                          </div>
                        </Tooltip>
                      );
                    }}
                  </For>
                </div>
              </Show>
            );
          })()}
        </div>
          );
        })()}

        <button
          class="upgrade-btn"
          style={{ width: "100%", "margin-top": "12px" }}
          disabled={teamIds().length === 0 || slotInfo().used >= slotInfo().max || state.resources.gold < mission().deployCost || !areRequiredSlotsFilled(mission(), team())}
          onClick={handleDeploy}
        >
          Deploy Team ({mission().deployCost}g)
        </button>
        <Show when={teamIds().length > 0 && !areRequiredSlotsFilled(mission(), team())}>
          <div style={{ color: "var(--accent-red)", "font-size": "0.8rem", "text-align": "center", "margin-top": "6px" }}>
            Required class slot not filled
          </div>
        </Show>
        <Show when={slotInfo().used >= slotInfo().max}>
          <div style={{ color: "var(--accent-gold)", "font-size": "0.85rem", "text-align": "center", "margin-top": "6px" }}>
            All mission slots in use
          </div>
        </Show>
      </div>
    </div>
  );
}
