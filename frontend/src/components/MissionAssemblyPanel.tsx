import { createSignal, createMemo, createEffect, createResource, untrack, For, Show, onCleanup } from "solid-js";
import { useGame } from "~/engine/gameState";
import {
  ADVENTURER_CLASSES,
  CLASS_COLORS,
  CLASS_BASE_STATS,
  CLASS_STAT_GROWTH,
  getXpForLevel,
  getClassMeta,
  getZoomedPortraitUrl,
  RANK_NAMES,
  RANK_COLORS,
  type Adventurer,
  type AdventurerClass,
} from "@medieval-realm/shared/data/adventurers";
import { getItem, getAvailableSupplies, getAvailableFood, getSupplyEffect, getCombatPotionEffect, getFoodEffect, getRecoveryEffect, MATCHED_FOOD_HP_BONUS } from "@medieval-realm/shared/data/items";
import type { AdventurerMissionSupplies } from "@medieval-realm/shared/data/missions";
import SupplySlot from "./SupplySlot";
import {
  type MissionTemplate,
  calcSuccessChance,
  calcDeathChance,
  calcEffectiveDuration,
  getMission,
  getMissionRank,
  getMissionStatWeights,
  getMissionStatHint,
  formatReward,
  areRequiredSlotsFilled,
  isExpedition,
} from "@medieval-realm/shared/data/missions";
import { getEnemy } from "@medieval-realm/shared/data/enemies";
import { simulateCombat } from "@medieval-realm/shared/data/combat";
import { MISSION_RANK_LABELS, MISSION_RANK_COLORS } from "~/data/constants";
import EnemyCard from "./EnemyCard";
import TeamSlot from "./TeamSlot";
import AdventurerPickerCard from "./AdventurerPickerCard";
import Tooltip from "./Tooltip";
import { fetchFriends } from "~/api/friends";
import { inviteCoop, fetchCoopDetail, updateCoopRoster, setCoopReady, cancelCoop } from "~/api/coop";
import { wsClient } from "~/api/ws";
import type { CoopAdventurerSummary } from "@medieval-realm/shared";

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
  onDeploy: (missionId: string, teamIds: string[], adventurerSupplies: Record<string, AdventurerMissionSupplies>, successPct: number) => boolean;
  /** Adventurer IDs locked into a coop expedition — shouldn't appear in solo deployment */
  coopLockedAdvIds?: Set<string>;
  /** When set, the panel is in coop mode — roster/supplies are persisted to the coop API instead of local state */
  coopId?: string;
  /** Called when the user invites a friend — parent should transition the panel into coop mode with the returned coop ID */
  onCoopInvited?: (coopId: string) => void;
  /** Called when coop is cancelled or completed, to clear the panel */
  onCoopEnded?: () => void;
}

export default function MissionAssemblyPanel(props: Props) {
  const { state, actions } = useGame();
  const [teamIds, setTeamIds] = createSignal<string[]>([]);
  const [adventurerSupplies, setAdventurerSupplies] = createSignal<Record<string, AdventurerMissionSupplies>>({});
  const mission = () => props.mission;
  const freshMission = () => getMission(mission().id) ?? mission();
  const isCoop = () => !!props.coopId;

  // ─── Coop mode: fetch + poll coop detail ────────────────────────
  const [coopDetail, { refetch: refetchCoop }] = createResource(
    () => props.coopId,
    (id) => id ? fetchCoopDetail(id).then((r) => r.coop) : null,
  );
  // Fallback poll — much slower now that WS pushes updates. Catches dropped sockets.
  const coopPollTimer = setInterval(() => { if (props.coopId) refetchCoop(); }, 15000);
  onCleanup(() => clearInterval(coopPollTimer));

  // Realtime refetch on push events for this coop
  const offCoopUpdate = wsClient.on("coop:update", (ev) => {
    if (ev.type === "coop:update" && props.coopId && ev.coopId === props.coopId) refetchCoop();
  });
  const offCoopCancelled = wsClient.on("coop:cancelled", (ev) => {
    if (ev.type === "coop:cancelled" && props.coopId && ev.coopId === props.coopId) {
      if (props.onCoopEnded) props.onCoopEnded();
    }
  });
  onCleanup(() => { offCoopUpdate(); offCoopCancelled(); });

  const iAmHost = () => !!coopDetail()?.iAmHost;
  const myCoopIds = (): string[] => (iAmHost() ? coopDetail()?.hostRoster?.adventurerIds : coopDetail()?.guestRoster?.adventurerIds) ?? [];
  const myCoopSupplies = (): Record<string, AdventurerMissionSupplies> => (iAmHost() ? coopDetail()?.hostRoster?.supplies : coopDetail()?.guestRoster?.supplies) ?? {};
  const friendCoopAdvs = (): CoopAdventurerSummary[] => (iAmHost() ? coopDetail()?.guestContributedAdvs : coopDetail()?.hostContributedAdvs) ?? [];
  const friendSupplies = (): Record<string, AdventurerMissionSupplies> => (iAmHost() ? coopDetail()?.guestRoster?.supplies : coopDetail()?.hostRoster?.supplies) ?? {};
  const friendUsername = () => iAmHost() ? coopDetail()?.guestUsername : coopDetail()?.hostUsername;
  const myReady = () => iAmHost() ? !!coopDetail()?.hostReady : !!coopDetail()?.guestReady;
  const friendReady = () => iAmHost() ? !!coopDetail()?.guestReady : !!coopDetail()?.hostReady;

  // Sync coop roster → local signals (so existing UI reading teamIds() / adventurerSupplies() keeps working)
  let lastCoopKey = "";
  createEffect(() => {
    if (!isCoop()) return;
    const ids = myCoopIds();
    const sups = myCoopSupplies();
    const key = JSON.stringify({ ids, sups });
    if (key === lastCoopKey) return;
    lastCoopKey = key;
    untrack(() => {
      setTeamIds([...ids]);
      setAdventurerSupplies({ ...sups });
    });
  });

  // Push local changes back to server (debounced)
  let coopPushTimer: number | undefined;
  const schedulePushToCoop = () => {
    if (!isCoop()) return;
    if (coopPushTimer) clearTimeout(coopPushTimer);
    coopPushTimer = window.setTimeout(async () => {
      try {
        await updateCoopRoster(props.coopId!, {
          adventurerIds: teamIds(),
          supplies: adventurerSupplies(),
        });
        lastCoopKey = JSON.stringify({ ids: teamIds(), sups: adventurerSupplies() });
        refetchCoop();
      } catch (e: any) {
        console.error("Coop roster update failed:", e.message);
      }
    }, 350);
  };

  // Clear team when mission changes (and not coop — coop state is server-driven)
  createEffect(() => {
    mission().id; // track mission change
    untrack(() => {
      if (!isCoop()) {
        setTeamIds([]);
        setAdventurerSupplies({});
      }
    });
  });

  // When an adv is removed from team, drop their supplies too
  createEffect(() => {
    const currentIds = new Set(teamIds());
    setAdventurerSupplies((prev) => {
      const next: Record<string, AdventurerMissionSupplies> = {};
      let changed = false;
      for (const [id, sup] of Object.entries(prev)) {
        if (currentIds.has(id)) next[id] = sup;
        else changed = true;
      }
      return changed ? next : prev;
    });
  });

  const setAdvSupply = (advId: string, kind: "potion" | "food" | "recovery", itemId: string | null) => {
    setAdventurerSupplies((prev) => {
      const current = prev[advId] ?? {};
      const updated = { ...current };
      if (itemId === null) delete updated[kind];
      else updated[kind] = itemId;
      return { ...prev, [advId]: updated };
    });
    schedulePushToCoop();
  };

  /** How many of `itemId` are already assigned across the team */
  const assignedCount = (itemId: string) => {
    let n = 0;
    const sups = adventurerSupplies();
    for (const s of Object.values(sups)) {
      if (s.potion === itemId) n++;
      if (s.food === itemId) n++;
      if (s.recovery === itemId) n++;
    }
    return n;
  };

  // ─── Available adventurers ────────────────────────────────────
  const CLASS_ORDER: Record<string, number> = { warrior: 0, priest: 1, wizard: 2, archer: 3, assassin: 4 };
  const availableAdvs = createMemo(() =>
    state.adventurers
      .filter((a) => a.alive && !a.onMission && !(props.coopLockedAdvIds?.has(a.id) ?? false))
      .sort((a, b) => (CLASS_ORDER[a.class] ?? 9) - (CLASS_ORDER[b.class] ?? 9) || b.level - a.level)
  );

  // ─── Team management ──────────────────────────────────────────
  const canFitInSlots = (advIds: string[]): boolean => {
    const slots = freshMission().slots;
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
      // Coop mode: no slot limit — just add
      if (isCoop()) return [...prev, advId];
      if (prev.length < freshMission().slots.length && canFitInSlots([...prev, advId])) {
        return [...prev, advId];
      }
      for (let ri = prev.length - 1; ri >= 0; ri--) {
        const replaced = [...prev];
        replaced[ri] = advId;
        if (canFitInSlots(replaced)) return replaced;
      }
      return prev;
    });
    // Drop supplies for adventurers no longer on the team + push to server in coop mode
    if (isCoop()) {
      setAdventurerSupplies((prev) => {
        const ids = new Set(teamIds());
        const next: Record<string, AdventurerMissionSupplies> = {};
        for (const [id, sup] of Object.entries(prev)) {
          if (ids.has(id)) next[id] = sup;
        }
        return next;
      });
      schedulePushToCoop();
    }
  };

  const team = createMemo(() =>
    teamIds().map((id) => state.adventurers.find((a) => a.id === id)).filter(Boolean) as Adventurer[]
  );

  // ─── Slot assignments (for display) ───────────────────────────
  const slotAssignments = createMemo(() => {
    const slots = freshMission().slots;
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

  // ─── Success chance ────────────────────────────────────────────
  // Computed outside of SolidJS reactivity entirely.
  // We store the result in a signal and only update it when team/supplies change.
  // ─── Success chance ────────────────────────────────────────────
  // Uses seeded PRNG: same team = same result. Single simulation, instant.
  const [successPct, setSuccessPct] = createSignal(0);

  /** Build a synthetic Adventurer from a friend's CoopAdventurerSummary so both clients
   *  compute the same success %. Stats are injected via bonusStats so calcStats() returns
   *  the same totals the server already resolved for this summary. */
  function synthFromSummary(s: CoopAdventurerSummary): Adventurer {
    const cls = s.class as AdventurerClass;
    const base = CLASS_BASE_STATS[cls];
    const growth = CLASS_STAT_GROWTH[cls];
    const derived = {
      str: Math.floor(base.str + growth.str * (s.level - 1)),
      int: Math.floor(base.int + growth.int * (s.level - 1)),
      dex: Math.floor(base.dex + growth.dex * (s.level - 1)),
      vit: Math.floor(base.vit + growth.vit * (s.level - 1)),
      wis: Math.floor(base.wis + growth.wis * (s.level - 1)),
    };
    return {
      id: s.id,
      name: s.name,
      class: cls,
      race: "human" as any,
      origin: "ashwick" as any, // has no statMods
      backstory: "", quirk: "", trait: "",
      rank: s.rank as any,
      level: s.level,
      xp: 0,
      alive: s.alive,
      onMission: false,
      bonusStats: {
        str: s.str - derived.str,
        int: s.int - derived.int,
        dex: s.dex - derived.dex,
        vit: s.vit - derived.vit,
        wis: s.wis - derived.wis,
      },
      equipment: {
        head: null, chest: null, legs: null, boots: null, cloak: null,
        mainHand: null, offHand: null, ring1: null, ring2: null, amulet: null, trinket: null,
      },
      talents: [],
    };
  }

  function recomputeSuccess() {
    const ids = [...teamIds()];
    const sups = { ...adventurerSupplies() };

    const snapshot: Adventurer[] = [];
    for (const id of ids) {
      const a = state.adventurers.find((x) => x.id === id);
      if (a) snapshot.push(JSON.parse(JSON.stringify(a)));
    }

    // Coop mode: merge friend's contributed adventurers + supplies so both clients see same %
    if (isCoop()) {
      for (const fs of friendCoopAdvs()) snapshot.push(synthFromSummary(fs));
      Object.assign(sups, friendSupplies());
    }

    if (snapshot.length === 0) { setSuccessPct(0); return; }

    const fm = freshMission();

    if (fm.encounters?.length) {
      // Generate a stable seed from team composition
      const seedStr = ids.sort().join(",") + "|" + fm.id;
      let seed = 0;
      for (let i = 0; i < seedStr.length; i++) seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;

      // Run 40 seeded simulations for 2.5% granularity (instant with seeded PRNG)
      let wins = 0;
      const SIMS = 40;
      for (let i = 0; i < SIMS; i++) {
        if (simulateCombat(fm, snapshot, sups, seed + i)?.victory) wins++;
      }
      setSuccessPct(Math.round((wins / SIMS) * 100));
    } else {
      setSuccessPct(calcSuccessChance(fm, snapshot, 0, sups));
    }
  }

  // Reactively recompute success when team or supplies change
  createEffect(() => {
    // Access reactive signals to track them
    const _ids = teamIds();
    const _sups = adventurerSupplies();
    // In coop mode, also track the friend's team + supplies so both clients stay in sync
    if (isCoop()) {
      const _fAdvs = friendCoopAdvs();
      const _fSups = friendSupplies();
    }
    // Recompute without tracking state.adventurers (which changes every tick)
    untrack(() => recomputeSuccess());
  });

  const successColor = () => {
    const pct = successPct();
    return pct >= 70 ? "var(--accent-green)" :
           pct >= 40 ? "var(--accent-gold)" : "var(--accent-red)";
  };

  // ─── Duration ─────────────────────────────────────────────────
  const effectiveDuration = () => calcEffectiveDuration(freshMission(), team());

  // ─── Deploy ───────────────────────────────────────────────────
  const handleDeploy = () => {
    if (props.onDeploy(mission().id, teamIds(), adventurerSupplies(), successPct())) {
      setTeamIds([]);
      setAdventurerSupplies({});
    }
  };

  // ─── Co-op invite (expeditions only) ──────────────────────────
  const [showCoopPicker, setShowCoopPicker] = createSignal(false);
  const [coopFriends, setCoopFriends] = createSignal<{ id: string; username: string }[]>([]);
  const [coopStatus, setCoopStatus] = createSignal<string | null>(null);

  const openCoopPicker = async () => {
    setCoopStatus(null);
    try {
      const data = await fetchFriends();
      setCoopFriends(data.friends.map((f) => ({ id: f.friendId, username: f.friendUsername })));
      setShowCoopPicker(true);
    } catch (e: any) {
      setCoopStatus(`Failed to load friends: ${e.message}`);
    }
  };

  const handleInviteFriend = async (username: string) => {
    setCoopStatus(null);
    try {
      const result = await inviteCoop({ expeditionId: mission().id, friendUsername: username });
      setCoopStatus(`✓ Invite sent to ${username}!`);
      setShowCoopPicker(false);
      setTimeout(() => setCoopStatus(null), 3000);
      // Transition panel into coop mode so sender stays put and sees the friend's team row
      if (props.onCoopInvited && result.coop?.id) {
        props.onCoopInvited(result.coop.id);
      }
    } catch (e: any) {
      setCoopStatus(`✗ ${e.message || "Failed to invite"}`);
    }
  };

  // ─── Stat info ────────────────────────────────────────────────
  const STAT_LABELS: Record<string, string> = { str: "STR", int: "INT", dex: "DEX", vit: "VIT", wis: "WIS" };
  const topStats = () => {
    const w = getMissionStatWeights(freshMission().tags);
    return Object.entries(w).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0)).slice(0, 2).map(([k]) => STAT_LABELS[k]);
  };

  return (
    <div
      class="mission-assembly"
      classList={{ "has-bg": !!getMissionImage(mission().id) }}
      ref={(el) => {
        // The ref callback only fires on mount, so we pair it with an effect
        // that re-runs when the selected mission changes — so swapping to a
        // different mission scrolls to the panel just like reopening it does.
        const scroll = () => setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        createEffect(() => { mission().id; scroll(); });
      }}
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
          <span style={{ "font-size": "2rem" }}>{freshMission().icon}</span>
          <div>
            <h3 style={{ "font-family": "var(--font-heading)", color: "var(--accent-gold)", margin: 0 }}>{freshMission().name}</h3>
            {(() => {
              const rank = getMissionRank(freshMission().id);
              const stars = "★".repeat(Math.max(1, Math.min(3, freshMission().difficulty)));
              return (
                <div style={{ "font-size": "0.8rem", color: rank ? MISSION_RANK_COLORS[rank] : "var(--text-muted)" }}>
                  {stars} {rank ? MISSION_RANK_LABELS[rank] : ""}
                </div>
              );
            })()}
          </div>
        </div>

        <p style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "font-style": "italic", margin: "10px 0" }}>
          {freshMission().description}
        </p>
        <Show when={!freshMission().encounters?.length}>
          <div style={{ "font-size": "0.8rem", color: "var(--accent-blue)", "font-style": "italic", "margin-bottom": "8px" }}>
            {getMissionStatHint(freshMission().tags)}
          </div>
        </Show>

        <Show when={freshMission().encounters?.length}>
          <div class="mission-detail-section">
            <div class="mission-detail-label">Encounters</div>
            <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
              {freshMission().encounters!.map((enc) => {
                const enemy = getEnemy(enc.enemyId);
                const discovered = (state.discoveredEnemies ?? []).includes(enc.enemyId);
                return enemy ? <EnemyCard enemy={enemy} count={enc.count} hidden={!discovered} /> : null;
              })}
            </div>
          </div>
        </Show>

        {/* Coop mode: friend's team row (read-only) */}
        <Show when={isCoop() && coopDetail()}>
          <div class="mission-detail-section">
            <div class="mission-detail-label">
              {friendUsername()}'s Team
              <span style={{
                "margin-left": "8px",
                "font-size": "0.75rem",
                color: friendReady() ? "var(--accent-green)" : "var(--text-muted)",
              }}>
                {friendReady() ? "✓ Ready" : `${friendCoopAdvs().length} adventurer${friendCoopAdvs().length === 1 ? "" : "s"}`}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
              <For each={friendCoopAdvs()}>
                {(a) => {
                  const cls = getClassMeta(a.class);
                  return (
                    <div style={{
                      width: "60px",
                      display: "flex", "flex-direction": "column", "align-items": "center", gap: "2px",
                    }} title={`${a.name} · ${cls.name} Lv.${a.level}`}>
                      <div style={{
                        width: "60px", height: "60px",
                        "border-radius": "4px",
                        background: "var(--bg-primary)",
                        border: `1px solid ${CLASS_COLORS[a.class] ?? "var(--border-color)"}`,
                        display: "flex", "align-items": "center", "justify-content": "center",
                        "font-size": "1.8rem",
                      }}>
                        {cls.icon}
                      </div>
                      <div style={{ "font-size": "0.65rem", color: "var(--text-muted)", "text-align": "center", "line-height": "1.1" }}>
                        {a.name.split(" ")[0]}
                      </div>
                    </div>
                  );
                }}
              </For>
              {/* Empty slots — pad up to mission slots.length */}
              {(() => {
                const emptyCount = Math.max(0, freshMission().slots.length - friendCoopAdvs().length);
                return Array.from({ length: emptyCount }, (_, i) => (
                  <div style={{
                    width: "60px",
                    display: "flex", "flex-direction": "column", "align-items": "center", gap: "2px",
                  }}>
                    <div style={{
                      width: "60px", height: "60px",
                      "border-radius": "4px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px dashed var(--border-color)",
                      display: "flex", "align-items": "center", "justify-content": "center",
                      "font-size": "1.4rem",
                      color: "var(--text-muted)",
                      opacity: 0.4,
                    }}>
                      👤
                    </div>
                    <div style={{ "font-size": "0.65rem", color: "var(--text-muted)", "text-align": "center", "line-height": "1.1", opacity: 0.6 }}>
                      empty
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </Show>

        <div class="mission-detail-section">
          <div class="mission-detail-label">
            {isCoop() ? (
              <>
                Your Team
                <span style={{
                  "margin-left": "8px",
                  "font-size": "0.75rem",
                  color: myReady() ? "var(--accent-green)" : "var(--text-muted)",
                }}>
                  {myReady() ? "✓ Ready" : `${teamIds().length} adventurer${teamIds().length === 1 ? "" : "s"}`}
                </span>
              </>
            ) : (
              <>Team ({teamIds().length}/{freshMission().slots.length})</>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", "flex-wrap": "wrap" }}>
            <Show when={isCoop()}>
              {/* Coop: free-form contributed adventurers */}
              <For each={teamIds()}>
                {(advId) => {
                  const adv = () => state.adventurers.find((a) => a.id === advId);
                  return (
                    <Show when={adv()}>
                      {(() => {
                        const isCombat = () => !!freshMission().encounters?.length || isExpedition(freshMission());
                        const potionOptions = () => {
                          const cat = isCombat() ? "combat" as const : "mission" as const;
                          return getAvailableSupplies(state.inventory, cat)
                            .map((s) => {
                              const current = adventurerSupplies()[advId]?.potion === s.item.id ? 1 : 0;
                              const remainingQty = s.qty - assignedCount(s.item.id) + current;
                              if (remainingQty <= 0) return null;
                              let hint = "";
                              if (isCombat()) {
                                const cp = getCombatPotionEffect(s.item.id);
                                if (cp) hint = `+${cp.value}% ${cp.type.replace("_", " ")}`;
                              } else {
                                const eff = getSupplyEffect(s.item.id);
                                if (eff) {
                                  const parts: string[] = [];
                                  if (eff.successBonus) parts.push(`+${eff.successBonus} stat`);
                                  if (eff.deathReduction < 1) parts.push(`☠-${Math.round((1 - eff.deathReduction) * 100)}%`);
                                  hint = parts.join(" ");
                                }
                              }
                              return { id: s.item.id, name: s.item.name, icon: s.item.icon, qty: remainingQty, hint };
                            })
                            .filter(Boolean) as { id: string; name: string; icon: string; qty: number; hint: string }[];
                        };
                        const foodOptions = () => getAvailableFood(state.inventory)
                          .map((s) => {
                            const current = adventurerSupplies()[advId]?.food === s.item.id ? 1 : 0;
                            const remainingQty = s.qty - assignedCount(s.item.id) + current;
                            if (remainingQty <= 0) return null;
                            const fx = getFoodEffect(s.item.id);
                            const parts: string[] = [];
                            if (fx?.statBonus) parts.push(`+${fx.statBonus.amount} ${fx.statBonus.stat.toUpperCase()}`);
                            if (fx?.hpBonus) parts.push(`+${fx.hpBonus} HP`);
                            const matches = !!(adv()?.foodPreference && s.item.foodFlavors?.includes(adv()!.foodPreference as any));
                            if (matches) parts.push(`❤ +${MATCHED_FOOD_HP_BONUS} HP`);
                            return { id: s.item.id, name: s.item.name, icon: s.item.icon, qty: remainingQty, hint: parts.join(" · ") };
                          })
                          .filter(Boolean) as { id: string; name: string; icon: string; qty: number; hint: string }[];
                        const recoveryOptions = () => getAvailableSupplies(state.inventory, "recovery")
                          .map((s) => {
                            const current = adventurerSupplies()[advId]?.recovery === s.item.id ? 1 : 0;
                            const remainingQty = s.qty - assignedCount(s.item.id) + current;
                            if (remainingQty <= 0) return null;
                            const eff = getRecoveryEffect(s.item.id);
                            const hint = eff ? `+${eff.healPct}% HP` : "";
                            return { id: s.item.id, name: s.item.name, icon: s.item.icon, qty: remainingQty, hint };
                          })
                          .filter(Boolean) as { id: string; name: string; icon: string; qty: number; hint: string }[];
                        return (
                          <div style={{ display: "flex", "align-items": "flex-start", gap: "4px" }}>
                            <div style={{ display: "flex", "flex-direction": "column", "align-items": "center", gap: "2px" }}>
                              <div
                                onClick={() => toggleTeam(advId)}
                                title="Click to remove"
                                style={{
                                  width: "60px", height: "60px",
                                  "border-radius": "4px", overflow: "hidden",
                                  border: `1px solid ${CLASS_COLORS[adv()!.class] ?? "var(--border-color)"}`,
                                  cursor: "pointer",
                                }}
                              >
                                <img
                                  src={getZoomedPortraitUrl(adv()!)}
                                  alt={adv()!.name}
                                  style={{ width: "100%", height: "100%", "object-fit": "cover" }}
                                />
                              </div>
                              <span style={{ "font-size": "0.65rem", color: "var(--text-muted)", "line-height": "1" }}>
                                {adv()!.name.split(" ")[0]}
                              </span>
                            </div>
                            <div style={{ display: "flex", "flex-direction": "column", gap: "3px", "margin-top": "2px" }}>
                              <SupplySlot kind="potion" value={adventurerSupplies()[advId]?.potion}
                                options={potionOptions()}
                                onChange={(id) => setAdvSupply(advId, "potion", id)} />
                              <SupplySlot kind="food" value={adventurerSupplies()[advId]?.food}
                                options={foodOptions()}
                                onChange={(id) => setAdvSupply(advId, "food", id)} />
                              <Show when={isExpedition(freshMission())}>
                                <SupplySlot kind="recovery" value={adventurerSupplies()[advId]?.recovery}
                                  options={recoveryOptions()}
                                  onChange={(id) => setAdvSupply(advId, "recovery", id)} />
                              </Show>
                            </div>
                          </div>
                        );
                      })()}
                    </Show>
                  );
                }}
              </For>
              {/* Empty slots — pad up to mission slots.length */}
              {(() => {
                const emptyCount = Math.max(0, freshMission().slots.length - teamIds().length);
                return Array.from({ length: emptyCount }, () => (
                  <div style={{
                    width: "60px",
                    display: "flex", "flex-direction": "column", "align-items": "center", gap: "2px",
                  }}>
                    <div style={{
                      width: "60px", height: "60px",
                      "border-radius": "4px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px dashed var(--border-color)",
                      display: "flex", "align-items": "center", "justify-content": "center",
                      "font-size": "1.4rem",
                      color: "var(--text-muted)",
                      opacity: 0.4,
                    }}>
                      👤
                    </div>
                    <div style={{ "font-size": "0.65rem", color: "var(--text-muted)", "text-align": "center", "line-height": "1.1", opacity: 0.6 }}>
                      empty
                    </div>
                  </div>
                ));
              })()}
            </Show>
            <Show when={!isCoop()}>
            <For each={freshMission().slots}>
              {(slot, i) => {
                const isCombat = () => !!freshMission().encounters?.length;
                const adv = () => slotAssignments()[i()];
                const potionOptions = () => {
                  const cat = isCombat() ? "combat" as const : "mission" as const;
                  return getAvailableSupplies(state.inventory, cat)
                    .map((s) => {
                      const remainingQty = s.qty - assignedCount(s.item.id) + (adv() && adventurerSupplies()[adv()!.id]?.potion === s.item.id ? 1 : 0);
                      if (remainingQty <= 0) return null;
                      let hint = "";
                      if (isCombat()) {
                        const cp = getCombatPotionEffect(s.item.id);
                        if (cp) hint = `+${cp.value}% ${cp.type.replace("_", " ")}`;
                      } else {
                        const eff = getSupplyEffect(s.item.id);
                        if (eff) {
                          const parts: string[] = [];
                          if (eff.successBonus) parts.push(`+${eff.successBonus} stat`);
                          if (eff.deathReduction < 1) parts.push(`☠-${Math.round((1 - eff.deathReduction) * 100)}%`);
                          hint = parts.join(" ");
                        }
                      }
                      return { id: s.item.id, name: s.item.name, icon: s.item.icon, qty: remainingQty, hint };
                    })
                    .filter(Boolean) as { id: string; name: string; icon: string; qty: number; hint: string }[];
                };
                const foodOptions = () => {
                  return getAvailableFood(state.inventory)
                    .map((s) => {
                      const remainingQty = s.qty - assignedCount(s.item.id) + (adv() && adventurerSupplies()[adv()!.id]?.food === s.item.id ? 1 : 0);
                      if (remainingQty <= 0) return null;
                      const fx = getFoodEffect(s.item.id);
                      const parts: string[] = [];
                      if (fx?.statBonus) parts.push(`+${fx.statBonus.amount} ${fx.statBonus.stat.toUpperCase()}`);
                      if (fx?.hpBonus) parts.push(`+${fx.hpBonus} HP`);
                      const matches = !!(adv()?.foodPreference && s.item.foodFlavors?.includes(adv()!.foodPreference as any));
                      if (matches) parts.push(`❤ +${MATCHED_FOOD_HP_BONUS} HP (preferred)`);
                      return { id: s.item.id, name: s.item.name, icon: s.item.icon, qty: remainingQty, hint: parts.join(" · ") };
                    })
                    .filter(Boolean) as { id: string; name: string; icon: string; qty: number; hint: string }[];
                };
                const recoveryOptions = () => {
                  return getAvailableSupplies(state.inventory, "recovery")
                    .map((s) => {
                      const remainingQty = s.qty - assignedCount(s.item.id) + (adv() && adventurerSupplies()[adv()!.id]?.recovery === s.item.id ? 1 : 0);
                      if (remainingQty <= 0) return null;
                      const eff = getRecoveryEffect(s.item.id);
                      const hint = eff ? `+${eff.healPct}% HP` : "";
                      return { id: s.item.id, name: s.item.name, icon: s.item.icon, qty: remainingQty, hint };
                    })
                    .filter(Boolean) as { id: string; name: string; icon: string; qty: number; hint: string }[];
                };
                return (
                  <div style={{ display: "flex", "align-items": "flex-start", gap: "4px" }}>
                    <div style={{ display: "flex", "flex-direction": "column", "align-items": "center", gap: "2px" }}>
                      <TeamSlot
                        slot={slot}
                        adventurer={adv()}
                        onClick={() => {
                          const a = adv();
                          if (a) toggleTeam(a.id);
                        }}
                      />
                      <Show when={adv()}>
                        {(() => {
                          const risk = () => calcDeathChance(freshMission(), team(), adv()!, adventurerSupplies());
                          return (
                            <span style={{
                              "font-size": "0.75rem",
                              color: risk() >= 15 ? "var(--accent-red)" : risk() >= 5 ? "var(--accent-gold)" : "var(--text-muted)",
                            }}>
                              ☠ <span style={{ "font-weight": "bold" }}>{risk()}%</span>
                            </span>
                          );
                        })()}
                      </Show>
                    </div>
                    {/* Per-adventurer supply slots */}
                    <Show when={adv()}>
                      <div style={{ display: "flex", "flex-direction": "column", gap: "4px", "margin-top": "2px" }}>
                        <SupplySlot
                          kind="potion"
                          value={adventurerSupplies()[adv()!.id]?.potion}
                          options={potionOptions()}
                          onChange={(id) => setAdvSupply(adv()!.id, "potion", id)}
                        />
                        <SupplySlot
                          kind="food"
                          value={adventurerSupplies()[adv()!.id]?.food}
                          options={foodOptions()}
                          onChange={(id) => setAdvSupply(adv()!.id, "food", id)}
                        />
                        <Show when={isExpedition(freshMission())}>
                          <SupplySlot
                            kind="recovery"
                            value={adventurerSupplies()[adv()!.id]?.recovery}
                            options={recoveryOptions()}
                            onChange={(id) => setAdvSupply(adv()!.id, "recovery", id)}
                          />
                        </Show>
                      </div>
                    </Show>
                  </div>
                );
              }}
            </For>
            </Show>
          </div>
        </div>

        <div class="mission-detail-section">
          <div class="mission-detail-label">Rewards</div>
          <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
            {freshMission().rewards.map((r) => (
              <span class="quest-reward-item">{formatReward(r)}</span>
            ))}
          </div>
        </div>

        <div class="mission-detail-stats">
          <div><span class="mission-detail-label">Duration</span> {formatDuration(freshMission().duration)}</div>
          <div><span class="mission-detail-label">Deploy cost</span> {freshMission().deployCost}g</div>
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
              {successPct()}%
            </span>
          </div>
          <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)" }}>
            Duration: {formatDuration(effectiveDuration())}
            {effectiveDuration() < freshMission().duration && (
              <span style={{ color: "var(--accent-blue)", "margin-left": "4px" }}>
                (Wizard -{Math.round((1 - effectiveDuration() / freshMission().duration) * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* Coop mode: Ready Up button */}
        <Show when={isCoop()}>
          <button
            class="upgrade-btn"
            style={{ width: "100%", "margin-top": "12px" }}
            disabled={!myReady() && teamIds().length === 0}
            onClick={async () => {
              try {
                const result = await setCoopReady(props.coopId!, !myReady());
                refetchCoop();
                if (result.deployed && props.onCoopEnded) {
                  setTimeout(() => props.onCoopEnded!(), 800);
                }
              } catch (e: any) {
                console.error("Ready failed:", e.message);
              }
            }}
          >
            {myReady() ? "Cancel ready" : "Ready up"}
          </button>
          <div style={{
            "margin-top": "8px",
            "font-size": "0.8rem",
            color: "var(--text-secondary)",
            "text-align": "center",
          }}>
            <Show when={myReady() && friendReady()}>
              <span style={{ color: "var(--accent-green)", "font-weight": "bold" }}>Both ready — deploying!</span>
            </Show>
            <Show when={myReady() && !friendReady()}>
              Waiting for <strong>{friendUsername()}</strong> to ready up…
            </Show>
            <Show when={!myReady() && friendReady()}>
              <strong>{friendUsername()}</strong> is ready — your move.
            </Show>
            <Show when={!myReady() && !friendReady()}>
              Both players must ready up to deploy.
            </Show>
          </div>
          <button
            onClick={async () => {
              if (!confirm("Cancel this co-op expedition?")) return;
              try {
                await cancelCoop(props.coopId!);
                if (props.onCoopEnded) props.onCoopEnded();
              } catch (e: any) { console.error(e.message); }
            }}
            style={{
              width: "100%",
              "margin-top": "8px",
              padding: "4px 12px",
              background: "transparent",
              border: "1px solid var(--accent-red)",
              "border-radius": "4px",
              color: "var(--accent-red)",
              cursor: "pointer",
              "font-size": "0.8rem",
            }}
          >
            Cancel coop
          </button>
        </Show>

        {/* Solo mode: Deploy Team button */}
        <Show when={!isCoop()}>
          <button
            class="upgrade-btn"
            style={{ width: "100%", "margin-top": "12px" }}
            disabled={teamIds().length === 0 || state.resources.gold < freshMission().deployCost || !areRequiredSlotsFilled(freshMission(), team())}
            onClick={handleDeploy}
          >
            Deploy Team ({freshMission().deployCost}g)
          </button>
        </Show>

        {/* Co-op invite button — expeditions only (hidden when already in coop) */}
        <Show when={isExpedition(freshMission()) && !isCoop()}>
          <button
            onClick={openCoopPicker}
            style={{
              width: "100%",
              "margin-top": "8px",
              padding: "6px 12px",
              background: "rgba(167, 139, 250, 0.12)",
              border: "1px solid #a78bfa",
              "border-radius": "4px",
              color: "#a78bfa",
              cursor: "pointer",
              "font-size": "0.85rem",
            }}
          >
            👥 Invite friend to co-op
          </button>
          <Show when={coopStatus()}>
            <div style={{
              "margin-top": "6px",
              "font-size": "0.75rem",
              "text-align": "center",
              color: coopStatus()!.startsWith("✓") ? "var(--accent-green)" : "var(--accent-red)",
            }}>
              {coopStatus()}
            </div>
          </Show>
        </Show>

        {/* Friend picker modal (inline) */}
        <Show when={showCoopPicker()}>
          <div style={{
            "margin-top": "10px",
            padding: "12px",
            background: "var(--bg-secondary)",
            border: "1px solid #a78bfa",
            "border-radius": "6px",
          }}>
            <div style={{ "font-size": "0.8rem", color: "#a78bfa", "margin-bottom": "8px", "font-weight": "bold" }}>
              Pick a friend to invite:
            </div>
            <Show when={coopFriends().length === 0}>
              <div style={{ color: "var(--text-muted)", "font-size": "0.8rem", "font-style": "italic" }}>
                No friends yet. Add some from the Friends page first.
              </div>
            </Show>
            <For each={coopFriends()}>
              {(friend) => (
                <div
                  onClick={() => handleInviteFriend(friend.username)}
                  style={{
                    padding: "6px 10px",
                    "margin-bottom": "4px",
                    background: "var(--bg-primary)",
                    "border-radius": "4px",
                    cursor: "pointer",
                    "font-size": "0.85rem",
                    color: "var(--text-primary)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "rgba(167, 139, 250, 0.1)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "var(--bg-primary)"}
                >
                  👤 {friend.username}
                </div>
              )}
            </For>
            <button
              onClick={() => setShowCoopPicker(false)}
              style={{
                "margin-top": "6px",
                padding: "4px 10px",
                background: "transparent",
                border: "1px solid var(--border-color)",
                "border-radius": "4px",
                color: "var(--text-muted)",
                cursor: "pointer",
                "font-size": "0.75rem",
              }}
            >
              Cancel
            </button>
          </div>
        </Show>

        <Show when={teamIds().length > 0 && !areRequiredSlotsFilled(freshMission(), team())}>
          <div style={{ color: "var(--accent-red)", "font-size": "0.8rem", "text-align": "center", "margin-top": "6px" }}>
            Required class slot not filled
          </div>
        </Show>
      </div>
    </div>
  );
}
