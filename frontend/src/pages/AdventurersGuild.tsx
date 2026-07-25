import { createSignal, createMemo, createResource, createEffect, For, Show, onCleanup, onMount } from "solid-js";
import { A, useSearchParams } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { IS_DEV } from "~/data/seasons";
import {
  ADVENTURER_CLASSES,
  getClassMeta,
  RANK_NAMES,
  RANK_COLORS,
  getXpForLevel,
  getPortraitUrl,
  getOrigin,
  RACE_NAMES,
  getCharacterSummary,
} from "@medieval-realm/shared/data/adventurers";
import { getUnspentTalentPoints } from "~/data/talents";
import { getItem } from "@medieval-realm/shared/data/items";
import {
  type MissionTemplate,
  getMission,
  formatReward,
  getCurrentStoryMission,
  getLockedStoryMission,
  isExpedition,
  getMissionPhase,
} from "@medieval-realm/shared/data/missions";
import type { CinematicSlide } from "~/components/CinematicOverlay";
import CinematicOverlay from "~/components/CinematicOverlay";
import { STORY_CINEMATICS } from "~/data/cinematics";
import Countdown from "~/components/Countdown";
import Tooltip from "~/components/Tooltip";
import MissionCard from "~/components/MissionCard";
import TraitBadge from "~/components/TraitBadge";
import AdventurerVitals from "~/components/AdventurerVitals";
import RecoveryActions from "~/components/RecoveryActions";
import MissionAssemblyPanel from "~/components/MissionAssemblyPanel";
import LootModal from "~/components/LootModal";
import ChronicleEntryModal from "~/components/ChronicleEntryModal";
import { getChronicleEntry, type ChronicleEntry } from "~/data/chronicle_entries";
import CombatLog from "~/components/CombatLog";
import { playSound, playPageMountSound } from "~/engine/sounds";
import CombatPlayback from "~/components/CombatPlayback";
import { fetchCoops, respondCoop, cancelCoop, fetchCoopDetail, claimCoop } from "~/api/coop";
import { wsClient } from "~/api/ws";
import { CardFrame } from "~/components/CardFrame";
import type { CompletedMission } from "@medieval-realm/shared/data/missions";

type Tab = "missions" | "roster";

// Rank (1..5) → rarity name for the roster card frame; CardFrame does the rest.
const RANK_FRAME = ["", "common", "uncommon", "rare", "epic", "legendary"];



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


export default function AdventurersGuild() {
  const { state, actions } = useGame();
  actions.visitGuild();
  onMount(() => {
    playPageMountSound("metal");
    // Deep-linked straight to the Roster: snapshot new arrivals, then mark seen.
    if (tab() === "roster") {
      const seen = new Set(state.adventurersSeen ?? []);
      setNewlyArrivedIds(state.adventurers.filter((a) => a.alive && !seen.has(a.id)).map((a) => a.id));
      actions.markAdventurersSeen();
    }
  });
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.tab === "roster" ? "roster" : "missions";
  const [tab, setTab] = createSignal<Tab>(initialTab);
  // Adventurers that were "new" when the Roster was opened — drives the blue
  // outline this visit (captured before they're marked seen, or it'd vanish instantly).
  const [newlyArrivedIds, setNewlyArrivedIds] = createSignal<string[]>([]);
  const [selectedMission, setSelectedMission] = createSignal<MissionTemplate | null>(null);
  const [selectedTeam, setSelectedTeam] = createSignal<string[]>([]);
  const [selectedSupplies, setSelectedSupplies] = createSignal<string[]>([]);
  // Helpers for the mission card toggle pattern (shared between story + regular
  // missions). `clearSelection` also drops the team + supplies, since they're
  // always tied to the currently-selected mission.
  const clearSelection = () => {
    setSelectedMission(null);
    setSelectedTeam([]);
    setSelectedSupplies([]);
  };
  const toggleMissionSelect = (mission: MissionTemplate) => {
    if (selectedMission()?.id === mission.id) clearSelection();
    else { setSelectedMission(mission); setSelectedTeam([]); setSelectedSupplies([]); }
  };

  // Co-op expeditions (polled from backend)
  const [coopData, { refetch: refetchCoops }] = createResource(() => fetchCoops());
  const [selectedCoopId, setSelectedCoopId] = createSignal<string | null>(null);

  // Ticking "now" for coop countdowns (local render only, no state churn)
  const [nowMs, setNowMs] = createSignal(Date.now());
  const nowTimer = setInterval(() => setNowMs(Date.now()), 1000);
  onCleanup(() => clearInterval(nowTimer));

  // Expedition IDs that have an in-flight coop — hide them from the main mission list
  const coopActiveExpeditionIds = createMemo(() => {
    const s = new Set<string>();
    for (const c of coopData()?.coops ?? []) {
      if (c.status === "preparing" || c.status === "active") s.add(c.expeditionId);
    }
    return s;
  });

  // Fetch coop detail for all preparing/active coops to compute the locked-adv set.
  // Simple approach: for each coop in preparing/active, fetch its detail and union the MY-side adv IDs.
  const [coopLockedAdvIds, setCoopLockedAdvIds] = createSignal<Set<string>>(new Set());
  const refreshLockedAdvIds = async () => {
    const coops = coopData()?.coops ?? [];
    const active = coops.filter((c) => c.status === "preparing" || c.status === "active");
    if (active.length === 0) { setCoopLockedAdvIds(new Set<string>()); return; }
    try {
      const details = await Promise.all(active.map((c) => fetchCoopDetail(c.id).catch(() => null)));
      const locked = new Set<string>();
      for (const d of details) {
        if (!d) continue;
        const mine = d.coop.iAmHost ? d.coop.hostRoster : d.coop.guestRoster;
        for (const id of mine.adventurerIds) locked.add(id);
      }
      setCoopLockedAdvIds(locked);
    } catch { /* silent */ }
  };
  // Refresh whenever coopData updates
  createEffect(() => { coopData(); refreshLockedAdvIds(); });
  // Slow fallback poll — WS pushes are primary. Catches missed events if socket drops.
  const coopPollTimer = setInterval(() => refetchCoops(), 120_000);
  onCleanup(() => clearInterval(coopPollTimer));

  // Realtime: refetch the coop list on any coop event
  const offCoopInvite = wsClient.on("coop:invite", () => refetchCoops());
  const offCoopUpdate = wsClient.on("coop:update", () => refetchCoops());
  const offCoopCancelled = wsClient.on("coop:cancelled", () => refetchCoops());
  onCleanup(() => { offCoopInvite(); offCoopUpdate(); offCoopCancelled(); });
  const handleRespondCoop = async (id: string, accept: boolean) => {
    try { await respondCoop(id, accept); refetchCoops(); } catch (e: any) { console.error(e.message); }
  };
  const handleCancelCoop = async (id: string) => {
    if (!confirm("Cancel this co-op expedition?")) return;
    try { await cancelCoop(id); refetchCoops(); } catch (e: any) { console.error(e.message); }
  };
  const [storyCinematic, setStoryCinematic] = createSignal<CinematicSlide[] | null>(null);
  /** Chronicle entry shown in the post-mission narrative modal. Set when the
   *  player claims a story mission tagged with chronicleEntryId. Replaces the
   *  cinematic playback as the post-mission story beat. */
  const [openChronicleEntry, setOpenChronicleEntry] = createSignal<ChronicleEntry | null>(null);
  const [lootModalIndex, setLootModalIndex] = createSignal<number | null>(null);
  /** Snapshot of the completed mission shown in the modal — used so the modal
   *  can display data even after the underlying card has been dismissed
   *  (failure path) or claimed (success path). */
  const [lootResult, setLootResult] = createSignal<import("@medieval-realm/shared/data/missions").CompletedMission | null>(null);
  /** Pending coop claim awaiting user confirm in the loot modal — null when not showing. */
  const [coopClaimModal, setCoopClaimModal] = createSignal<CompletedMission | null>(null);

  const handleClaimCoop = async (coopId: string, expeditionId: string) => {
    try {
      const response = await claimCoop(coopId);
      // Only apply if this is the first claim — alreadyClaimed handles crash-recovery
      // cases where the server thinks we claimed but the client didn't save yet.
      // The modal still shows so the user sees what they got.
      if (!response.alreadyClaimed) {
        const completed = actions.applyCoopClaim(response, expeditionId);
        setCoopClaimModal(completed);
      } else {
        // Build a display-only CompletedMission from the server payload
        setCoopClaimModal({
          missionId: expeditionId,
          success: response.success,
          rewards: response.rewards.map((r) => ({ resource: r.resource as any, amount: r.amount })),
          casualties: response.myAdventurers.filter((a) => a.died).map((a) => {
            const adv = state.adventurers.find((x) => x.id === a.id);
            return adv?.name ?? a.id;
          }),
          revived: [],
          xpGained: response.myAdventurers.reduce((s, a) => s + a.xpGained, 0),
          levelUps: [],
          rankUps: [],
        });
      }
      refetchCoops();
    } catch (e: any) {
      console.error("Claim failed:", e.message);
    }
  };

  /** Open the loot modal for a completed mission.
   *  - Success (has rewards): keep the card around; Claim applies rewards on confirm.
   *  - Failure (no rewards): dismiss the card immediately so it disappears from
   *    the results list. The modal stays open with a snapshot so the player
   *    can still review combat/casualties before closing.
   */
  const handleClaim = (index: number) => {
    const result = state.completedMissions[index];
    if (!result) return;
    // Nothing to hand over (no pay, no loot) → snapshot for the modal (casualties
    // etc.) and dismiss the card immediately. Otherwise keep it and let the modal
    // gate the claim (opening the chest for any loot).
    const hasClaim = result.rewards.length > 0 || (result.loot?.length ?? 0) > 0;
    if (!hasClaim) {
      setLootResult({ ...result });
      setLootModalIndex(null);
      actions.claimMissionReward(index);
    } else {
      setLootResult(result);
      setLootModalIndex(index);
    }
  };

  const confirmLootClaim = () => {
    const idx = lootModalIndex();
    // Failure path already dismissed the card on open — just close the modal.
    if (idx === null) {
      setLootResult(null);
      return;
    }
    const result = state.completedMissions[idx];
    if (!result) { setLootModalIndex(null); setLootResult(null); return; }
    actions.claimMissionReward(idx);
    setLootModalIndex(null);
    setLootResult(null);
    // STORY_CINEMATICS playback is intentionally NOT triggered here. Cinematic
    // art has been deferred; the chronicle entry modal serves as the post-
    // mission narrative beat instead. Data + intro-cinematic path stay intact.
    // Auto-open the chronicle entry tied to this story mission, if any.
    // Skip if the player already previewed it inside the LootModal (in which
    // case it's already in chronicleEntriesSeen) — avoids reopening the same
    // modal twice in a row.
    const chronicleEntryId = (getMission(result.missionId) as { chronicleEntryId?: string } | undefined)?.chronicleEntryId;
    if (chronicleEntryId && !(state.chronicleEntriesSeen ?? []).includes(chronicleEntryId)) {
      const entry = getChronicleEntry(chronicleEntryId);
      if (entry) setOpenChronicleEntry(entry);
    }
  };
  const guildLevel = () => actions.getGuildLevel();
  const storyMission = () => getCurrentStoryMission(guildLevel(), state.completedStoryMissions ?? [], state.questRewardsClaimed ?? []);
  const lockedStoryMission = () => getLockedStoryMission(guildLevel(), state.completedStoryMissions ?? [], state.questRewardsClaimed ?? []);
  // Roster tab shows only living adventurers; the fallen live on the
  // Pantheon memorial inside the Shrine (frontend/src/components/Pantheon.tsx).
  const roster = () => state.adventurers.filter((a) => a.alive);
  const rosterSize = () => actions.getRosterSize();

  const switchTab = (t: Tab) => {
    setTab(t);
    setSelectedMission(null);
    setSelectedTeam([]);
    // Viewing the roster clears the "new arrival" markers, but snapshot who was
    // new first so this visit can still show their blue outline.
    if (t === "roster") {
      const seen = new Set(state.adventurersSeen ?? []);
      setNewlyArrivedIds(state.adventurers.filter((a) => a.alive && !seen.has(a.id)).map((a) => a.id));
      actions.markAdventurersSeen();
    }
  };


  return (
    <>
      {/* Story mission cinematic overlay — kept for the intro path / future
          re-introduction; story-mission claim no longer auto-plays this. */}
      <Show when={storyCinematic()}>
        {(slides) => (
          <CinematicOverlay
            slides={slides()}
            villageName={state.villageName}
            onComplete={() => setStoryCinematic(null)}
          />
        )}
      </Show>

      {/* Post-mission chronicle entry — auto-opens after the LootModal closes
          when the completed mission has a chronicleEntryId. */}
      <Show when={openChronicleEntry()}>
        {(entry) => (
          <ChronicleEntryModal entry={entry()} onClose={() => setOpenChronicleEntry(null)} />
        )}
      </Show>

      {/* Loot modal for completed missions — driven by the snapshot signal so
          it survives the underlying card being removed (failure path). */}
      <Show when={lootResult()}>
        {(result) => (
          <LootModal
            result={result()}
            onConfirm={confirmLootClaim}
            onClose={() => { setLootModalIndex(null); setLootResult(null); }}
          />
        )}
      </Show>

      {/* Loot modal for completed coop expeditions — rewards already applied when the modal opens */}
      <Show when={coopClaimModal()}>
        {(result) => (
          <LootModal
            result={result()}
            subtitle="Co-op expedition"
            onConfirm={() => setCoopClaimModal(null)}
            onClose={() => setCoopClaimModal(null)}
          />
        )}
      </Show>

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
          <A href="/buildings#building-adventurers_guild" style={{ color: "var(--accent-gold)" }}>
            Go to Buildings →
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
          <span>Active missions: {state.activeMissions.length}</span>
          <span>Roster: {rosterSize().current}</span>
          <span>Refresh in: {(() => {
            const now = new Date();
            const next3am = new Date();
            next3am.setUTCHours(3, 0, 0, 0);
            if (next3am.getTime() <= now.getTime()) next3am.setUTCDate(next3am.getUTCDate() + 1);
            return Math.ceil((next3am.getTime() - now.getTime()) / 3_600_000);
          })()}h</span>
        </div>

        <div style={{ display: "flex", gap: "4px", "margin-bottom": "16px" }}>
          {(["missions", "roster"] as Tab[]).map((t) => (
            <button
              class="speed-btn"
              classList={{ active: tab() === t }}
              onClick={() => switchTab(t)}
              style={{ padding: "8px 16px", "font-size": "0.9rem" }}
            >
              {t === "missions" ? "Missions" : "Roster"}
              <Show when={t === "roster" && actions.hasNewAdventurers()}>
                <Tooltip text="New arrival" style={{ "margin-left": "6px", "vertical-align": "middle" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", "border-radius": "50%", background: "var(--accent-blue)" }} />
                </Tooltip>
              </Show>
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
                      </span>
                      {(() => {
                        // The rewards, XP, level-ups and casualties are deliberately
                        // NOT spoiled here — claiming opens the loot modal, which is
                        // the reveal (base pay shown, enemy loot in the chest).
                        const hasClaim = result.rewards.length > 0 || (result.loot?.length ?? 0) > 0;
                        return (
                          <button
                            classList={{ "btn-primary": hasClaim, "btn-tertiary": !hasClaim }}
                            onClick={() => handleClaim(i())}
                            style={{ "font-size": "0.8rem", "white-space": "nowrap" }}
                          >
                            {hasClaim
                              ? (STORY_CINEMATICS[result.missionId] ? "Claim & Continue Story" : "Claim rewards")
                              : "Dismiss"}
                          </button>
                        );
                      })()}
                    </div>
                    {/* Combat log — collapsible + playback */}
                    <Show when={result.combatLog?.length}>
                      {(() => {
                        const [expanded, setExpanded] = createSignal(false);
                        const [playbackOpen, setPlaybackOpen] = createSignal(false);
                        const missionTpl = getMission(result.missionId);
                        return (
                          <div style={{ "margin-top": "4px", display: "flex", gap: "10px", "align-items": "center", "flex-wrap": "wrap" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setPlaybackOpen(true); }}
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "var(--accent-gold)", "font-size": "0.75rem",
                                padding: "2px 0", "text-decoration": "underline",
                              }}
                            >
                              ▶ Watch combat
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded()); }}
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "var(--text-muted)", "font-size": "0.75rem",
                                padding: "2px 0", "text-decoration": "underline",
                              }}
                            >
                              {expanded() ? "Hide log" : "Show log"}
                            </button>
                            <Show when={expanded()}>
                              <div style={{
                                "margin-top": "4px", padding: "6px 8px",
                                background: "rgba(0, 0, 0, 0.2)", "border-radius": "4px",
                                "max-height": "200px", overflow: "auto",
                                width: "100%",
                              }}>
                                <CombatLog log={result.combatLog!} compact />
                              </div>
                            </Show>
                            <Show when={playbackOpen()}>
                              <CombatPlayback
                                log={result.combatLog!}
                                roster={result.combatRoster}
                                positions={result.combatPositions}
                                title={missionTpl?.name}
                                onClose={() => setPlaybackOpen(false)}
                              />
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
          {/* ── Co-op Expeditions ── */}
          <Show when={(coopData()?.coops ?? []).length > 0}>
            <div style={{ "margin-bottom": "20px" }}>
              <h3 style={{ "font-family": "var(--font-heading)", color: "#a78bfa", "margin-bottom": "8px" }}>
                ⚔️ Co-op Expeditions
              </h3>
              <For each={coopData()!.coops}>
                {(c) => {
                  const tpl = getMission(c.expeditionId);
                  const otherName = c.iAmHost ? c.guestUsername : c.hostUsername;
                  const isIncoming = !c.iAmHost && c.status === "pending";
                  return (
                    <div style={{
                      padding: "10px 14px",
                      "margin-bottom": "6px",
                      background: "rgba(167, 139, 250, 0.05)",
                      border: `1px solid ${isIncoming ? "#a78bfa" : "rgba(167, 139, 250, 0.3)"}`,
                      "border-radius": "6px",
                    }}>
                      <div style={{ display: "flex", "align-items": "center", gap: "10px", "flex-wrap": "wrap" }}>
                        <div style={{ "font-size": "1.3rem" }}>{tpl?.icon ?? "⚔️"}</div>
                        <div>
                          <div style={{ color: "var(--text-primary)", "font-weight": "bold", "font-size": "0.95rem" }}>
                            {tpl?.name ?? c.expeditionId}
                          </div>
                          <div style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>
                            {c.iAmHost ? "You invited" : "Invited by"} <span style={{ color: "var(--accent-gold)" }}>{otherName}</span>
                            {" · "}
                            <span style={{
                              color: c.status === "pending" ? "var(--accent-gold)" :
                                c.status === "preparing" ? "#a78bfa" :
                                c.status === "active" ? "var(--accent-green)" : "var(--text-muted)",
                            }}>
                              {c.status === "pending" ? (isIncoming ? "Awaiting your response" : "Awaiting response") :
                                c.status === "preparing" ? "Preparing" :
                                c.status === "active" ? "In progress" : c.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ "margin-left": "auto", display: "flex", gap: "6px" }}>
                          <Show when={isIncoming}>
                            <button
                              class="upgrade-btn"
                              onClick={() => handleRespondCoop(c.id, true)}
                              style={{ padding: "4px 12px", "font-size": "0.8rem" }}
                            >
                              Accept
                            </button>
                            <button
                              class="btn-secondary"
                              onClick={() => handleRespondCoop(c.id, false)}
                              style={{ "font-size": "0.8rem" }}
                            >
                              Decline
                            </button>
                          </Show>
                          <Show when={c.status === "preparing"}>
                            <button
                              class="upgrade-btn"
                              onClick={() => {
                                // Load the expedition template and open the assembly panel in coop mode
                                const tpl = getMission(c.expeditionId);
                                if (tpl) {
                                  setSelectedMission(tpl);
                                  setSelectedCoopId(c.id);
                                }
                              }}
                              style={{ padding: "4px 12px", "font-size": "0.8rem" }}
                            >
                              Open
                            </button>
                          </Show>
                          <Show when={c.status === "active"}>
                            {(() => {
                              const remaining = () => {
                                if (!c.deployedAt || !tpl) return 0;
                                const endMs = new Date(c.deployedAt).getTime() + tpl.duration * 1000;
                                return Math.max(0, (endMs - nowMs()) / 1000);
                              };
                              return (
                                <span style={{ "font-size": "0.75rem", color: "var(--accent-green)" }}>
                                  ⏳ <Countdown remainingSeconds={remaining()} />
                                </span>
                              );
                            })()}
                          </Show>
                          <Show when={c.status === "pending" && !isIncoming}>
                            <button
                              class="btn-secondary"
                              onClick={() => handleCancelCoop(c.id)}
                              style={{ "font-size": "0.8rem" }}
                            >
                              Cancel
                            </button>
                          </Show>
                          <Show when={c.status === "complete" && !c.iAmClaimed}>
                            <button
                              class="upgrade-btn"
                              onClick={() => handleClaimCoop(c.id, c.expeditionId)}
                              style={{ padding: "4px 12px", "font-size": "0.8rem" }}
                            >
                              Claim rewards
                            </button>
                          </Show>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>

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
                  const phase = () => getMissionPhase(am);
                  const phaseLabel = () => {
                    const p = phase();
                    if (p === "outbound") return { text: "Traveling out", color: "var(--accent-blue)", icon: "🚶" };
                    if (p === "combat") return { text: "Combat!", color: "var(--accent-red)", icon: "⚔️" };
                    if (p === "homeward") return { text: "Returning home", color: "var(--accent-green)", icon: "🏡" };
                    return null;
                  };
                  // Resolve the combat log to play back. Regular missions store
                  // it once on prerolledCombat; expeditions store one per
                  // combat event on expeditionLog. Show the *most recent*
                  // combat event for an expedition.
                  const currentCombat = () => {
                    if (am.expeditionLog) {
                      for (let i = am.expeditionLog.length - 1; i >= 0; i--) {
                        const ev = am.expeditionLog[i];
                        if (ev.kind === "combat" && ev.combatLog?.length) {
                          return { log: ev.combatLog, victory: !!ev.combatVictory, roster: ev.combatRoster, positions: ev.combatPositions };
                        }
                      }
                      return null;
                    }
                    if (am.prerolledCombat?.log?.length) {
                      return { log: am.prerolledCombat.log, victory: am.prerolledCombat.victory, roster: am.prerolledCombat.roster, positions: am.prerolledCombat.positions };
                    }
                    return null;
                  };
                  const [playbackOpen, setPlaybackOpen] = createSignal(false);
                  return (
                    <div
                      class="building-card"
                      classList={{ "active-mission-combat": phase() === "combat" }}
                      style={{ "margin-bottom": "8px" }}
                    >
                      <div class="building-card-header">
                        <div class="building-card-icon">{template().icon}</div>
                        <div>
                          <div class="building-card-title">{template().name}</div>
                          <div style={{ color: "var(--accent-blue)", "font-size": "0.85rem", display: "flex", "align-items": "center", gap: "8px", "flex-wrap": "wrap" }}>
                            <Countdown remainingSeconds={am.remaining} /> remaining
                            <Show when={phaseLabel()}>
                              {(lbl) => (
                                <span style={{
                                  "font-size": "0.78rem",
                                  color: lbl().color,
                                  background: "rgba(0, 0, 0, 0.3)",
                                  padding: "1px 8px",
                                  "border-radius": "10px",
                                  border: `1px solid ${lbl().color}`,
                                }}>
                                  {lbl().icon} {lbl().text}
                                </span>
                              )}
                            </Show>
                          </div>
                        </div>
                      </div>
                      <div style={{ "font-size": "0.8rem", "margin-top": "4px", display: "flex", gap: "6px", "flex-wrap": "wrap", "align-items": "center" }}>
                        <span style={{ color: "var(--text-muted)" }}>Team:</span>
                        {teamAdvs().map((a) => {
                          const cls = getClassMeta(a!.class);
                          return <Tooltip text={`${a!.name} (${cls.name} Lv.${a!.level})`}><span>{cls.icon}</span></Tooltip>;
                        })}
                        <span style={{
                          "margin-left": "auto",
                          color: am.successChance >= 70 ? "var(--accent-green)" : am.successChance >= 40 ? "var(--accent-gold)" : "var(--accent-red)",
                        }}>
                          {am.successChance}% success
                        </span>
                      </div>
                      <Show when={phase() === "combat" && currentCombat()}>
                        <div style={{ "margin-top": "6px" }}>
                          <button
                            class="btn-secondary"
                            onClick={(e) => { e.stopPropagation(); setPlaybackOpen(true); }}
                            style={{ "font-size": "0.82rem" }}
                          >
                            ▶ Watch combat
                          </button>
                        </div>
                      </Show>
                      {/* Modal lives outside the combat-phase Show so it stays open
                          after onFinished marks the phase as homeward. The player
                          dismisses via the Close button at their leisure. */}
                      <Show when={playbackOpen() && currentCombat()}>
                        {(combat) => (
                          <CombatPlayback
                            log={combat().log}
                            roster={combat().roster}
                            positions={combat().positions}
                            title={template().name}
                            victory={combat().victory}
                            onFinished={() => actions.markCombatViewed(am.missionId)}
                            onClose={() => {
                              setPlaybackOpen(false);
                              // For a wiped mission, the engine's tick is waiting
                              // on this close before zeroing remaining (so the
                              // modal didn't unmount mid-watch). Zero it now.
                              if (am.wiped) actions.acknowledgeWipeCompletion(am.missionId);
                            }}
                          />
                        )}
                      </Show>
                      <Show when={template().rewards?.length > 0}>
                        <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "2px" }}>
                          Rewards: {template().rewards.map((r: any) => formatReward(r)).join(", ")}
                        </div>
                      </Show>

                      {/* Expedition timeline */}
                      <Show when={isExpedition(template())}>
                        {(() => {
                          const totalEvents = () => am.expeditionResolvedEvents?.length ?? 0;
                          const currentIdx = () => am.expeditionEventIndex ?? 0;
                          const lastLog = () => {
                            const log = am.expeditionLog;
                            return log && log.length > 0 ? log[log.length - 1] : null;
                          };
                          return (
                            <div style={{ "margin-top": "8px", padding: "8px", background: "rgba(167, 139, 250, 0.05)", "border-radius": "4px", border: "1px solid rgba(167, 139, 250, 0.2)" }}>
                              <div style={{ display: "flex", "align-items": "center", gap: "6px", "margin-bottom": "6px" }}>
                                <span style={{ color: "#a78bfa", "font-size": "0.75rem", "font-weight": "bold" }}>
                                  ⚔️ Expedition · Event {Math.min(currentIdx() + 1, totalEvents())}/{totalEvents()}
                                </span>
                              </div>
                              {/* Timeline dots */}
                              <div style={{ display: "flex", gap: "4px", "align-items": "center", "margin-bottom": "6px" }}>
                                <For each={am.expeditionResolvedEvents ?? []}>
                                  {(_, i) => {
                                    const idx = i();
                                    const done = idx < currentIdx();
                                    const isCurrent = idx === currentIdx();
                                    const logEntry = am.expeditionLog?.[idx];
                                    return (
                                      <div style={{
                                        width: "20px", height: "20px", "border-radius": "50%",
                                        display: "flex", "align-items": "center", "justify-content": "center",
                                        "font-size": "0.7rem",
                                        background: done
                                          ? (logEntry?.success ? "rgba(46, 204, 113, 0.3)" : "rgba(231, 76, 60, 0.3)")
                                          : isCurrent ? "rgba(167, 139, 250, 0.4)" : "var(--bg-primary)",
                                        border: isCurrent
                                          ? "1px solid #a78bfa"
                                          : done
                                            ? `1px solid ${logEntry?.success ? "var(--accent-green)" : "var(--accent-red)"}`
                                            : "1px solid var(--border-color)",
                                        color: done ? "var(--text-primary)" : "var(--text-muted)",
                                      }}>
                                        {done ? (logEntry?.icon ?? "·") : isCurrent ? "·" : "?"}
                                      </div>
                                    );
                                  }}
                                </For>
                              </div>
                              <Show when={lastLog()}>
                                <div style={{ "font-size": "0.7rem", color: "var(--text-secondary)", "font-style": "italic" }}>
                                  Last: {lastLog()!.summary}
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

          <div style={{ display: "flex", "align-items": "center", "flex-wrap": "wrap", gap: "8px 12px", "margin-bottom": "8px" }}>
            <h3 style={{ "font-family": "var(--font-heading)", color: "var(--text-primary)", margin: 0, "white-space": "nowrap" }}>
              Mission Board
            </h3>
            {(() => {
              const count = typeof state.missionRerollToday === "number" ? state.missionRerollToday : 0;
              const cost = 10 * Math.pow(2, count);
              const canAfford = state.astralShards >= cost;
              return (
            <button
              class="btn-secondary"
              onClick={() => actions.rerollMissions()}
              disabled={!canAfford}
              style={{ "font-size": "0.75rem" }}
            >
              Reroll ({cost} 💠)
            </button>
              );
            })()}
            <Show when={IS_DEV}>
              <button
                onClick={() => actions.devSpawnAllNoviceMissions()}
                class="skip-season-btn"
                style={{ "font-size": "0.7rem", padding: "3px 10px" }}
              >
                Spawn all novice
              </button>
              <button
                onClick={() => actions.devSpawnVeteranMissions()}
                class="skip-season-btn"
                style={{ "font-size": "0.7rem", padding: "3px 10px" }}
              >
                Spawn veteran
              </button>
              <Tooltip text="Queue a placeholder robin to test the banner/sidebar/Overview flow">
              <button
                onClick={() => actions.devTriggerRobin()}
                class="skip-season-btn"
                style={{ "font-size": "0.7rem", padding: "3px 10px" }}
              >
                🐦 Trigger robin
              </button>
              </Tooltip>
            </Show>
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
              {(story) => (
                <MissionCard
                  mission={story()}
                  selected={selectedMission()?.id === story().id}
                  storyChapter={(story() as any).chapter}
                  onClick={() => toggleMissionSelect(story())}
                />
              )}
            </Show>
            {/* Locked story mission placeholder: shown when the next story
                mission is gated by a parallel quest that hasn't completed
                yet. Renders as a "???" card with the unlock hint, similar
                to the bestiary's "???" enemy cards. */}
            <Show when={lockedStoryMission()}>
              {(locked) => (
                <div class="building-card dimmed" style={{ cursor: "default" }}>
                  <span class="building-card-category">{(locked().mission as any).chapter}</span>
                  <div class="building-card-header" style={{ "margin-top": "4px" }}>
                    <div class="building-card-icon" style={{ "font-size": "2rem" }}>❓</div>
                    <div>
                      <div class="building-card-title">???</div>
                      <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>
                        Complete the active quest to unlock the next story mission.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Show>
            <For each={state.missionBoard.filter((m) => !coopActiveExpeditionIds().has(m.id))}>
              {(saved) => {
                const mission = getMission(saved.id) ?? saved;
                return (
                  <MissionCard
                    mission={mission}
                    selected={selectedMission()?.id === mission.id}
                    onClick={() => toggleMissionSelect(mission)}
                  />
                );
              }}
            </For>
          </div>

          {/* Mission assembly panel */}
          <Show when={selectedMission()}>
            {(mission) => (
              <MissionAssemblyPanel
                mission={mission()}
                coopId={selectedCoopId() ?? undefined}
                coopLockedAdvIds={coopLockedAdvIds()}
                onCancel={() => { setSelectedMission(null); setSelectedTeam([]); setSelectedSupplies([]); setSelectedCoopId(null); }}
                onCoopInvited={(coopId) => { setSelectedCoopId(coopId); refetchCoops(); }}
                onCoopEnded={() => {
                  setSelectedCoopId(null);
                  setSelectedMission(null);
                  refetchCoops();
                }}
                onGoRecruit={() => {
                  setSelectedMission(null);
                  setSelectedTeam([]);
                  setSelectedSupplies([]);
                  setTab("roster");
                }}
                onDeploy={(missionId, teamIds, adventurerSupplies, successPct) => {
                  if (actions.deployMission(missionId, teamIds, adventurerSupplies, successPct)) {
                    playSound("metal");
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
              No adventurers yet. Newcomers arrive as your settlement grows.
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
                const unspentTalents = () => getUnspentTalentPoints(adv);
                return (
                  <A href={`/guild/${adv.id}`} style={{ "text-decoration": "none", display: "flex" }}>
                    <div class="building-card adv-card"
                      onMouseEnter={() => setNewlyArrivedIds((prev) => prev.filter((id) => id !== adv.id))}
                      style={{
                      cursor: "pointer",
                      position: "relative",
                      width: "100%",
                      opacity: adv.onMission ? 0.7 : 1,
                      background: adv.onMission ? "var(--bg-secondary)" : "var(--bg-card)",
                      "box-shadow": newlyArrivedIds().includes(adv.id) ? "0 0 0 1px var(--accent-blue), 0 0 12px rgba(96, 165, 250, 0.25)" : undefined,
                    }}>
                      {/* Rarity frame + flourishes, drawn OVER the card so the
                          portrait stays flush to the edge. */}
                      <CardFrame rarity={RANK_FRAME[adv.rank] ?? "common"} border={24} ornamentSize={28} ornamentInset={8} z={3} />
                      <span class="building-card-category" style={{ color: RANK_COLORS[adv.rank] }}>
                        {RANK_NAMES[adv.rank]}
                      </span>
                      <div class="adv-card-portrait">
                        <img src={getPortraitUrl(adv)} alt={adv.name} loading="lazy" />
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
                        <div style={{ "margin-top": "4px" }}>
                          <AdventurerVitals adventurer={adv} width="100%" showText showRegen />
                        </div>
                        {/* Patch up a resting hero with any owned recovery item
                            (bandage, healing salve, antidote…). */}
                        <RecoveryActions adventurer={adv} />
                        <Show when={adv.backstory}>
                          <div class="roster-card-backstory" style={{
                            "font-size": "0.78rem",
                            color: "var(--text-secondary)",
                            "font-style": "italic",
                            "line-height": "1.4",
                            "padding-left": "8px",
                            "border-left": "2px solid var(--border-color)",
                          }}>
                            "{getCharacterSummary(adv.premadeId) ?? adv.backstory}"
                          </div>
                        </Show>
                        <TraitBadge traitId={adv.trait} />
                        <div style={{ "margin-top": "auto", "padding-top": "8px", "font-size": "0.75rem", display: "flex", gap: "6px", "flex-wrap": "wrap", "align-items": "center" }}>
                          {equippedItems().map((item) => <Tooltip text={item!.name}><span>{item!.icon}</span></Tooltip>)}
                          {emptySlotCount() > 0 && (
                            <span style={{ color: "var(--accent-gold)", "font-size": "0.7rem" }}>
                              {emptySlotCount()} empty gear slot{emptySlotCount() > 1 ? "s" : ""}
                            </span>
                          )}
                          <Show when={unspentTalents() > 0}>
                            <Tooltip text="This adventurer has unspent talent points">
                            <span
                              style={{
                                padding: "2px 8px",
                                "border-radius": "4px",
                                background: "rgba(52, 152, 219, 0.18)",
                                border: "1px solid var(--accent-blue)",
                                color: "var(--accent-blue)",
                                "font-size": "0.7rem",
                                "font-weight": "bold",
                                animation: "pulse 2s infinite",
                              }}
                            >
                              ⭐ {unspentTalents()} talent point{unspentTalents() > 1 ? "s" : ""}
                            </span>
                            </Tooltip>
                          </Show>
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

      </Show>
    </div>
    </>
  );
}
