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
  getFoodPref,
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
  rollPermanentDeaths,
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
import { getNpcAlly } from "@medieval-realm/shared/data/npcs";
import { simulateCombat } from "@medieval-realm/shared/data/combat";
import { resolveFullExpedition, calcAdventurerMaxHp } from "@medieval-realm/shared/data/expeditionEngine";
import { MISSION_RANK_LABELS, MISSION_RANK_COLORS } from "~/data/constants";
import MissionEnemyCard from "./MissionEnemyCard";
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
  /** Called when the player clicks through to the recruitment tab from the
   *  empty-roster state (first guild visit: missions exist, no one to send). */
  onGoRecruit?: () => void;
}

export default function MissionAssemblyPanel(props: Props) {
  const { state, actions } = useGame();
  const [teamIds, setTeamIds] = createSignal<string[]>([]);
  const [adventurerSupplies, setAdventurerSupplies] = createSignal<Record<string, AdventurerMissionSupplies>>({});
  const mission = () => props.mission;
  const freshMission = () => getMission(mission().id) ?? mission();
  const isCoop = () => !!props.coopId;
  // Barter/offering cost (deployItems): the ones the player can't currently afford.
  const deployItemsShort = () =>
    (freshMission().deployItems ?? []).filter((c) => actions.resourceQty(c.resource) < c.amount);

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
  // Counts of alive-but-hidden adventurers, broken down by reason. Surfaced
  // below the picker so a missing recruit isn't a mystery — used to be silent.
  const hiddenBreakdown = createMemo(() => {
    let onMission = 0;
    let coopLocked = 0;
    for (const a of state.adventurers) {
      if (!a.alive) continue;
      if (a.onMission) onMission++;
      else if (props.coopLockedAdvIds?.has(a.id)) coopLocked++;
    }
    return { onMission, coopLocked, total: onMission + coopLocked };
  });

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
  // Per-adventurer permadeath risk shown next to each TeamSlot. Computed by
  // Monte Carlo on the same loop as successPct (shared sim work) — counts
  // how many of N seeded sims permadied each adventurer through the full
  // path: combat sim → rollPermanentDeaths (calcDeathChance × 1.5 + Warrior
  // Shield Wall + Priest Divine Grace).
  const [deathRisks, setDeathRisks] = createSignal<Record<string, number>>({});

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

    if (snapshot.length === 0) { setSuccessPct(0); setDeathRisks({}); return; }

    const fm = freshMission();

    // Run 200 seeded simulations for ~3.4% standard error at 90% success.
    // Tight enough that two similarly-equipped adventurers read similar odds.
    // Same loop drives the death-risk preview by counting permadeaths.
    const SIMS = 200;
    const deathCounts: Record<string, number> = {};
    for (const a of snapshot) deathCounts[a.id] = 0;

    if (isExpedition(fm)) {
      // Expedition Monte Carlo. resolveFullExpedition runs the whole event
      // chain (combat, treasure, traps, encounters) and returns final HP +
      // wiped flag. We treat "wiped" as failure and "not wiped" as success;
      // anyone with HP ≤ 0 at the end rolls permadeath via the same helper.
      // Without this branch, expeditions fall through to the no-encounter
      // baseline and players see meaningless 0% death risks for fights
      // that may actually be punishing.
      const seedStr = ids.sort().join(",") + "|" + fm.id;
      let seed = 0;
      for (let i = 0; i < seedStr.length; i++) seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;

      let wins = 0;
      for (let i = 0; i < SIMS; i++) {
        const result = resolveFullExpedition(fm, snapshot, sups, seed + i);
        if (!result.wiped) wins++;
        // Anyone whose HP ended ≤ 0 fell during the expedition — they're
        // the candidates for the permadeath roll, just like fallenAdventurerIds
        // for combat missions.
        const fallenIds: string[] = [];
        for (const adv of snapshot) {
          if ((result.hpMap[adv.id] ?? calcAdventurerMaxHp(adv)) <= 0) fallenIds.push(adv.id);
        }
        const { dead } = rollPermanentDeaths(fallenIds, snapshot, fm, sups);
        for (const id of dead) deathCounts[id] = (deathCounts[id] ?? 0) + 1;
      }
      setSuccessPct(Math.round((wins / SIMS) * 100));
    } else if (fm.encounters?.length) {
      // Encounter missions: simulate combat, then run the same permadeath
      // helper used at deploy time so the preview stays exact.
      const seedStr = ids.sort().join(",") + "|" + fm.id;
      let seed = 0;
      for (let i = 0; i < seedStr.length; i++) seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;

      let wins = 0;
      for (let i = 0; i < SIMS; i++) {
        const combat = simulateCombat(fm, snapshot, sups, seed + i);
        if (!combat) continue;
        if (combat.victory) wins++;
        const { dead } = rollPermanentDeaths(combat.fallenAdventurerIds, snapshot, fm, sups);
        for (const id of dead) deathCounts[id] = (deathCounts[id] ?? 0) + 1;
      }
      setSuccessPct(Math.round((wins / SIMS) * 100));
    } else {
      // No-encounter missions (herb_gathering, tavern_intel, smuggler_deal):
      // success comes straight from calcSuccessChance; permadeath rolls per
      // adventurer at baseline. Run rollPermanentDeaths in the same loop so
      // warrior Shield Wall and priest Divine Grace are factored in.
      setSuccessPct(calcSuccessChance(fm, snapshot, 0, sups));
      for (let i = 0; i < SIMS; i++) {
        const { dead } = rollPermanentDeaths([], snapshot, fm, sups);
        for (const id of dead) deathCounts[id] = (deathCounts[id] ?? 0) + 1;
      }
    }

    const risks: Record<string, number> = {};
    for (const id of Object.keys(deathCounts)) {
      risks[id] = Math.round((deathCounts[id] / SIMS) * 100);
    }
    setDeathRisks(risks);
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

  /** Helper text rendered under the success % to nudge the player about
   *  what to do when odds look bad. Red tier surfaces every lever the
   *  player has (level, gear, supplies, talents) plus the permadeath
   *  warning so a brand-new player isn't blindsided. Orange tier focuses
   *  on supplies since the team is roughly viable. Returns null when the
   *  team is empty (nothing actionable yet) or the odds are good. */
  const successTip = (): { main: string; warning?: string } | null => {
    const teamCount = teamIds().length;
    if (teamCount === 0) return null;
    const slotsCount = freshMission().slots.length;
    const hasOpenSlots = teamCount < slotsCount;
    const slotsHint = hasOpenSlots
      ? " Adding another adventurer would help too."
      : "";
    const pct = successPct();
    if (pct >= 70) return null;
    if (pct >= 40) {
      return {
        main: "Odds are uncertain. Packing food and combat potions, and equipping gear, can tip the fight your way." + slotsHint,
      };
    }
    return {
      main: "Your team is likely not ready. Build experience on easier missions, equip gear, pack food and combat potions, and spend talent points before sending them out." + slotsHint,
      warning: "Adventurers who fall on a mission may not return.",
    };
  };

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
            <div class="assembly-card-row" style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
              {freshMission().encounters!.map((enc) => {
                const enemy = getEnemy(enc.enemyId);
                const discovered = (state.discoveredEnemies ?? []).includes(enc.enemyId);
                return enemy ? <MissionEnemyCard enemy={enemy} count={enc.count} hidden={!discovered} /> : null;
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
            <div class="assembly-card-row" style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
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
                    display: "flex", "flex-direction": "column",
                    background: "var(--bg-secondary)",
                    border: "1px dashed var(--border-color)",
                    "border-radius": "10px",
                    opacity: 0.55,
                    width: "var(--assembly-card-width, 140px)",
                  }}>
                    <div style={{
                      position: "relative", width: "100%", height: "140px",
                      overflow: "hidden",
                      "border-radius": "10px 10px 0 0",
                    }}>
                      <div style={{
                        width: "100%", height: "100%",
                        display: "flex", "align-items": "center", "justify-content": "center",
                        "font-size": "2.4rem", color: "var(--text-muted)",
                      }}>
                        👤
                      </div>
                      <div class="building-card-image-overlay" style={{ padding: "8px 10px" }}>
                        <div style={{
                          "font-family": "var(--font-heading)",
                          "font-size": "0.85rem",
                          color: "var(--text-muted)",
                          "text-align": "left",
                          "text-shadow": "0 1px 2px rgba(0,0,0,0.8)",
                        }}>
                          Empty slot
                        </div>
                      </div>
                    </div>
                    {/* Supplies-row equivalent so the empty card matches a
                     * filled card's height. */}
                    <div style={{
                      padding: "8px 8px 4px",
                      display: "flex", "align-items": "center", "justify-content": "center",
                      "min-height": "52px",
                      "font-size": "0.7rem",
                      color: "var(--text-muted)",
                    }}>
                      unfilled
                    </div>
                    {/* Phantom risk-row to match the filled card's bottom row height. */}
                    <div style={{
                      padding: "0 8px 8px",
                      "font-size": "0.7rem",
                      color: "transparent",
                      "text-align": "center",
                    }}>
                      Risk of permanent death: —
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
          <div class="assembly-card-row" style={{ display: "flex", gap: "10px", "flex-wrap": "wrap" }}>
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
                        const risk = () => deathRisks()[advId] ?? 0;
                        const riskColor = () =>
                          risk() >= 15 ? "var(--accent-red)" :
                          risk() >= 5 ? "var(--accent-gold)" :
                          "var(--accent-green)";
                        return (
                          <div
                            style={{
                              display: "flex", "flex-direction": "column",
                              background: "var(--bg-secondary)",
                              border: `1px solid ${CLASS_COLORS[adv()!.class] ?? "var(--border-color)"}`,
                              "border-radius": "10px",
                              width: "var(--assembly-card-width, 140px)",
                            }}
                          >
                            <div
                              style={{
                                position: "relative", width: "100%", height: "140px",
                                overflow: "hidden",
                                "border-radius": "10px 10px 0 0",
                                cursor: "pointer",
                              }}
                              onClick={() => toggleTeam(advId)}
                              title={`Click to remove ${adv()!.name}`}
                            >
                              <img
                                src={getZoomedPortraitUrl(adv()!)}
                                alt={adv()!.name}
                                style={{ width: "100%", height: "100%", "object-fit": "cover", display: "block" }}
                              />
                              <Show when={getFoodPref(adv()!.foodPreference)}>
                                <div
                                  title={getFoodPref(adv()!.foodPreference)!.trait}
                                  style={{
                                    position: "absolute",
                                    top: "6px",
                                    right: "6px",
                                    width: "22px",
                                    height: "22px",
                                    "border-radius": "50%",
                                    background: "rgba(0, 0, 0, 0.7)",
                                    display: "flex",
                                    "align-items": "center",
                                    "justify-content": "center",
                                    "font-size": "0.75rem",
                                    "line-height": "1",
                                  }}
                                >
                                  {getFoodPref(adv()!.foodPreference)!.icon}
                                </div>
                              </Show>
                              <div class="building-card-image-overlay" style={{ padding: "8px 10px" }}>
                                <div style={{
                                  "font-family": "var(--font-heading)",
                                  "font-size": "0.9rem",
                                  "line-height": "1.15",
                                  color: CLASS_COLORS[adv()!.class] ?? "var(--text-primary)",
                                  "text-align": "left",
                                  "text-shadow": "0 1px 2px rgba(0,0,0,0.8)",
                                }}>
                                  {adv()!.name}
                                </div>
                              </div>
                            </div>
                            {/* Supplies row */}
                            <div style={{ padding: "8px 8px 4px", display: "flex", gap: "8px", "justify-content": "center" }}>
                              <SupplySlot kind="potion" size={36}
                                value={adventurerSupplies()[advId]?.potion}
                                options={potionOptions()}
                                onChange={(id) => setAdvSupply(advId, "potion", id)} />
                              <SupplySlot kind="food" size={36}
                                value={adventurerSupplies()[advId]?.food}
                                options={foodOptions()}
                                onChange={(id) => setAdvSupply(advId, "food", id)} />
                              <Show when={isExpedition(freshMission())}>
                                <SupplySlot kind="recovery" size={36}
                                  value={adventurerSupplies()[advId]?.recovery}
                                  options={recoveryOptions()}
                                  onChange={(id) => setAdvSupply(advId, "recovery", id)} />
                              </Show>
                            </div>
                            {/* Death-risk text (coop). Same shape as solo. */}
                            <div style={{
                              padding: "0 8px 8px",
                              "font-size": "0.7rem",
                              color: "var(--text-muted)",
                              "text-align": "center",
                            }}>
                              Risk of permanent death:{" "}
                              <span style={{ color: riskColor(), "font-weight": "bold" }}>
                                {risk()}%
                              </span>
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
                    display: "flex", "flex-direction": "column",
                    background: "var(--bg-secondary)",
                    border: "1px dashed var(--border-color)",
                    "border-radius": "10px",
                    opacity: 0.55,
                    width: "var(--assembly-card-width, 140px)",
                  }}>
                    <div style={{
                      position: "relative", width: "100%", height: "140px",
                      overflow: "hidden",
                      "border-radius": "10px 10px 0 0",
                    }}>
                      <div style={{
                        width: "100%", height: "100%",
                        display: "flex", "align-items": "center", "justify-content": "center",
                        "font-size": "2.4rem", color: "var(--text-muted)",
                      }}>
                        👤
                      </div>
                      <div class="building-card-image-overlay" style={{ padding: "8px 10px" }}>
                        <div style={{
                          "font-family": "var(--font-heading)",
                          "font-size": "0.85rem",
                          color: "var(--text-muted)",
                          "text-align": "left",
                          "text-shadow": "0 1px 2px rgba(0,0,0,0.8)",
                        }}>
                          Empty slot
                        </div>
                      </div>
                    </div>
                    {/* Supplies-row equivalent so the empty card matches a
                     * filled card's height. */}
                    <div style={{
                      padding: "8px 8px 4px",
                      display: "flex", "align-items": "center", "justify-content": "center",
                      "min-height": "52px",
                      "font-size": "0.7rem",
                      color: "var(--text-muted)",
                    }}>
                      unfilled
                    </div>
                    {/* Phantom risk-row to match the filled card's bottom row height. */}
                    <div style={{
                      padding: "0 8px 8px",
                      "font-size": "0.7rem",
                      color: "transparent",
                      "text-align": "center",
                    }}>
                      Risk of permanent death: —
                    </div>
                  </div>
                ));
              })()}
            </Show>
            <Show when={!isCoop()}>
            {/* Locked NPC ally slot — non-recruitable companion fixed to this mission. */}
            <Show when={freshMission().npcAlly}>
              {(() => {
                const npc = () => getNpcAlly(freshMission().npcAlly!.npcId);
                return (
                  <Show when={npc()}>
                    <div
                      title={`${npc()!.name} — ${npc()!.title}\n${npc()!.description}`}
                      style={{
                        width: "80px", height: "110px",
                        background: "rgba(167, 139, 250, 0.08)",
                        border: "1px solid #a78bfa",
                        "border-radius": "6px",
                        overflow: "hidden",
                        cursor: "default",
                        display: "flex",
                        "flex-direction": "column",
                        position: "relative",
                      }}
                    >
                      <div style={{
                        position: "absolute", top: "3px", right: "3px",
                        width: "16px", height: "16px",
                        "border-radius": "50%",
                        background: "rgba(0, 0, 0, 0.7)",
                        display: "flex",
                        "align-items": "center", "justify-content": "center",
                        "font-size": "0.7rem",
                        "z-index": 1,
                      }} title="Locked — fixed companion">
                        🔒
                      </div>
                      <div style={{
                        width: "80px", height: "80px",
                        display: "flex", "align-items": "center", "justify-content": "center",
                        "font-size": "2.4rem",
                        background: "rgba(167, 139, 250, 0.04)",
                        "flex-shrink": 0,
                        overflow: "hidden",
                      }}>
                        <Show when={npc()!.portrait} fallback={<>{npc()!.icon}</>}>
                          <img
                            src={npc()!.portrait}
                            alt={npc()!.name}
                            style={{ width: "100%", height: "100%", "object-fit": "cover" }}
                          />
                        </Show>
                      </div>
                      <div style={{
                        padding: "2px 4px",
                        "text-align": "center",
                        "font-size": "0.6rem",
                        color: "#a78bfa",
                        "line-height": "1.15",
                        flex: "1",
                        display: "flex", "align-items": "center", "justify-content": "center",
                      }}>
                        {npc()!.name}
                      </div>
                    </div>
                  </Show>
                );
              })()}
            </Show>
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
                // Reactive accessors — must be called inside JSX so Solid
                // tracks updates. Capturing `const a = adv()` at the top of
                // the For child snapshots the value once and never re-renders
                // when the team changes.
                const requiredClass = () => slot.required && slot.class !== "any"
                  ? getClassMeta(slot.class as AdventurerClass)
                  : null;
                const cardBorder = () => {
                  const a = adv();
                  if (a) return `1px solid ${CLASS_COLORS[a.class] ?? "var(--border-color)"}`;
                  const rc = requiredClass();
                  return `1px dashed ${rc ? CLASS_COLORS[slot.class as keyof typeof CLASS_COLORS] : "var(--border-color)"}`;
                };
                const risk = () => {
                  const a = adv();
                  return a ? (deathRisks()[a.id] ?? 0) : 0;
                };
                const riskColor = () =>
                  risk() >= 15 ? "var(--accent-red)" :
                  risk() >= 5 ? "var(--accent-gold)" :
                  "var(--accent-green)";
                return (
                  <div style={{
                    display: "flex", "flex-direction": "column",
                    background: "var(--bg-secondary)",
                    border: cardBorder(),
                    "border-radius": "10px",
                    /* overflow stays visible so SupplySlot dropdowns and
                     * tooltips can extend past the card edges. The portrait
                     * div below carries its own overflow:hidden + rounded
                     * top corners to clip the image. */
                    width: "var(--assembly-card-width, 140px)",
                  }}>
                    <div
                      style={{
                        position: "relative", width: "100%", height: "140px",
                        overflow: "hidden",
                        "border-radius": "10px 10px 0 0",
                        cursor: adv() ? "pointer" : "default",
                      }}
                      onClick={() => { const a = adv(); if (a) toggleTeam(a.id); }}
                      title={adv() ? `Click to remove ${adv()!.name}` : undefined}
                    >
                      <Show when={adv()} fallback={
                        <div style={{
                          width: "100%", height: "100%",
                          display: "flex", "align-items": "center", "justify-content": "center",
                          "font-size": "2.4rem", color: "var(--text-muted)", opacity: "0.3",
                        }}>
                          {requiredClass()?.icon ?? "👤"}
                        </div>
                      }>
                        {(a) => (
                          <>
                            <img
                              src={getZoomedPortraitUrl(a())}
                              alt={a().name}
                              style={{ width: "100%", height: "100%", "object-fit": "cover", display: "block" }}
                            />
                            <Show when={getFoodPref(a().foodPreference)}>
                              <div
                                title={getFoodPref(a().foodPreference)!.trait}
                                style={{
                                  position: "absolute",
                                  top: "6px",
                                  right: "6px",
                                  width: "22px",
                                  height: "22px",
                                  "border-radius": "50%",
                                  background: "rgba(0, 0, 0, 0.7)",
                                  display: "flex",
                                  "align-items": "center",
                                  "justify-content": "center",
                                  "font-size": "0.75rem",
                                  "line-height": "1",
                                }}
                              >
                                {getFoodPref(a().foodPreference)!.icon}
                              </div>
                            </Show>
                          </>
                        )}
                      </Show>
                      {/* Name overlay — left-aligned in the gradient. */}
                      <div class="building-card-image-overlay" style={{ padding: "8px 10px" }}>
                        <div style={{
                          "font-family": "var(--font-heading)",
                          "font-size": "0.9rem",
                          "line-height": "1.15",
                          color: adv() ? (CLASS_COLORS[adv()!.class] ?? "var(--text-primary)") : "var(--text-muted)",
                          "text-align": "left",
                          "text-shadow": "0 1px 2px rgba(0,0,0,0.8)",
                        }}>
                          {adv()?.name ?? (requiredClass()?.name ?? "Empty slot")}
                        </div>
                      </div>
                    </div>
                    {/* Supplies row */}
                    <div style={{
                      padding: "8px 8px 4px",
                      display: "flex", gap: "8px", "justify-content": "center",
                      "min-height": adv() ? undefined : "52px",
                    }}>
                      <Show when={adv()} fallback={
                        <span style={{ "font-size": "0.7rem", color: "var(--text-muted)", "align-self": "center" }}>
                          unfilled
                        </span>
                      }>
                        {(a) => (
                          <>
                            <SupplySlot
                              kind="potion"
                              size={36}
                              value={adventurerSupplies()[a().id]?.potion}
                              options={potionOptions()}
                              onChange={(id) => setAdvSupply(a().id, "potion", id)}
                            />
                            <SupplySlot
                              kind="food"
                              size={36}
                              value={adventurerSupplies()[a().id]?.food}
                              options={foodOptions()}
                              onChange={(id) => setAdvSupply(a().id, "food", id)}
                            />
                            <Show when={isExpedition(freshMission())}>
                              <SupplySlot
                                kind="recovery"
                                size={36}
                                value={adventurerSupplies()[a().id]?.recovery}
                                options={recoveryOptions()}
                                onChange={(id) => setAdvSupply(a().id, "recovery", id)}
                              />
                            </Show>
                          </>
                        )}
                      </Show>
                    </div>
                    {/* Death-risk text. Always rendered so filled and empty
                     * cards stay the same height; the copy goes transparent
                     * when no adventurer is assigned. */}
                    <div style={{
                      padding: "0 8px 8px",
                      "font-size": "0.7rem",
                      color: adv() ? "var(--text-muted)" : "transparent",
                      "text-align": "center",
                    }}>
                      <Show when={adv()} fallback={<>Risk of permanent death: —</>}>
                        Risk of permanent death:{" "}
                        <span style={{ color: riskColor(), "font-weight": "bold" }}>
                          {risk()}%
                        </span>
                      </Show>
                    </div>
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
          <Show when={freshMission().deployItems?.length}>
            <div>
              <span class="mission-detail-label">Bring</span>{" "}
              <For each={freshMission().deployItems!}>
                {(c, i) => (
                  <span style={{ color: actions.resourceQty(c.resource) < c.amount ? "var(--accent-red, #e05a5a)" : undefined }}>
                    {i() > 0 ? ", " : ""}{formatReward(c)} ({actions.resourceQty(c.resource)} on hand)
                  </span>
                )}
              </For>
            </div>
          </Show>
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
          <Show
            when={state.adventurers.some((a) => a.alive)}
            fallback={
              /* First visit: the guild stands, but nobody has been hired yet. */
              <div style={{
                border: "1px dashed var(--border-highlight)",
                "border-radius": "8px",
                padding: "18px 16px",
                "text-align": "center",
                "margin-bottom": "12px",
              }}>
                <div style={{ "font-size": "1.6rem", "margin-bottom": "6px" }}>🪶</div>
                <p style={{ color: "var(--text-primary)", "font-size": "0.9rem", margin: "0 0 4px" }}>
                  The guild roster is empty.
                </p>
                <p style={{ color: "var(--text-muted)", "font-size": "0.8rem", margin: "0 0 12px", "line-height": "1.5" }}>
                  Missions need a team. Hire your first adventurers at the recruitment board.
                </p>
                <Show when={props.onGoRecruit}>
                  <button
                    class="upgrade-btn"
                    style={{ padding: "8px 18px", "font-size": "0.85rem" }}
                    onClick={props.onGoRecruit}
                  >
                    Go to recruitment
                  </button>
                </Show>
              </div>
            }
          >
            <p style={{ color: "var(--text-muted)", "font-size": "0.85rem", "line-height": "1.5" }}>
              Everyone is out.
              {hiddenBreakdown().onMission > 0 && ` ${hiddenBreakdown().onMission} on missions.`}
              {hiddenBreakdown().coopLocked > 0 && ` ${hiddenBreakdown().coopLocked} pledged to a co-op expedition.`}
              {" "}They will return. Or{" "}
              <span
                style={{ color: "var(--accent-gold)", cursor: "pointer", "text-decoration": "underline" }}
                onClick={props.onGoRecruit}
              >recruit more hands</span>.
            </p>
          </Show>
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

        <Show when={hiddenBreakdown().total > 0}>
          <div style={{
            "font-size": "0.7rem", color: "var(--text-muted)",
            "margin-top": "8px", "padding-top": "8px",
            "border-top": "1px dashed var(--border-default)",
          }}>
            {hiddenBreakdown().total} hidden:
            {hiddenBreakdown().onMission > 0 && ` ${hiddenBreakdown().onMission} on a mission`}
            {hiddenBreakdown().onMission > 0 && hiddenBreakdown().coopLocked > 0 && ","}
            {hiddenBreakdown().coopLocked > 0 && ` ${hiddenBreakdown().coopLocked} reserved for a co-op`}
          </div>
        </Show>

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
        {/* Contextual tip when the odds are uncertain or worse. Red tier
            surfaces all levers + permadeath warning; orange focuses on
            supplies; green shows nothing. */}
        <Show when={successTip()}>
          {(tip) => (
            <div style={{
              "margin-top": "8px",
              "padding": "8px 12px",
              "background": "rgba(0, 0, 0, 0.2)",
              "border-left": `3px solid ${successColor()}`,
              "border-radius": "4px",
              "font-size": "0.8rem",
              "font-style": "italic",
              "color": "var(--text-secondary)",
              "line-height": "1.5",
            }}>
              {tip().main}
              <Show when={tip().warning}>
                {(warning) => (
                  <>
                    {" "}
                    <span style={{ "font-weight": "600", color: "var(--text-primary)" }}>
                      {warning()}
                    </span>
                  </>
                )}
              </Show>
            </div>
          )}
        </Show>

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
            disabled={teamIds().length === 0 || state.resources.gold < freshMission().deployCost || deployItemsShort().length > 0 || !areRequiredSlotsFilled(freshMission(), team())}
            onClick={handleDeploy}
            data-no-click-sound
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
