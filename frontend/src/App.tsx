import { Show, createEffect, onMount, onCleanup, type ParentProps } from "solid-js";
import { useNavigate, useLocation } from "@solidjs/router";
import Sidebar from "./components/Sidebar";
import ResourceBar from "./components/ResourceBar";
import CinematicOverlay from "./components/CinematicOverlay";
import ToastContainer from "./components/Toast";
import EventBanner, { showEvent } from "./components/EventBanner";
import { INTRO_CINEMATIC } from "./data/cinematics";
import { QUEST_CHAIN } from "./data/quests";
import { SEASON_META } from "./data/seasons";
import { getMission } from "@medieval-realm/shared/data/missions";
import { useGame } from "./engine/gameState";
import { wsClient } from "./api/ws";
import { fetchCoops } from "./api/coop";

/** Season → banner accent. Drives the color of the announcement when the season changes. */
const SEASON_ACCENT: Record<string, string> = {
  spring: "var(--accent-green)",
  summer: "#e6c619",
  autumn: "#d4831a",
  winter: "#a5d8ff",
};

export default function App(props: ParentProps) {
  const { state, actions } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  let contentRef: HTMLElement | undefined;

  // Reset the main scroll area to the top on every route change. The sidebar is
  // separate so it keeps its own scroll; only the content pane is reset.
  createEffect(() => {
    location.pathname; // track
    if (contentRef) contentRef.scrollTop = 0;
  });

  // Quest-completion watcher: when the current (unclaimed) quest's condition
  // transitions false → true, broadcast it via the event banner. Deduped by id
  // — won't re-fire for the same quest if the condition briefly toggles.
  let lastCompletedQuestId: string | null = null;
  createEffect(() => {
    const claimed = state.questRewardsClaimed ?? [];
    const idx = QUEST_CHAIN.findIndex((q) => !claimed.includes(q.id));
    if (idx < 0) return;
    const current = QUEST_CHAIN[idx];
    if (!current.condition(state)) return;
    if (lastCompletedQuestId === current.id) return;
    lastCompletedQuestId = current.id;
    showEvent({
      type: "quest",
      icon: current.icon,
      message: `Quest complete — ${current.title}. Visit the Overview to claim your reward!`,
      onClick: () => navigate("/"),
    });
  });

  // Season-change watcher: announce each new season with its thematic accent.
  // Skip the first reactive run (no transition has occurred yet) by tracking
  // the last seen season — initial load shouldn't fire a banner.
  let lastSeason: string | null = null;
  createEffect(() => {
    const s = state.season;
    if (lastSeason === null) { lastSeason = s; return; }
    if (lastSeason === s) return;
    lastSeason = s;
    const meta = SEASON_META[s];
    showEvent({
      type: "season",
      icon: meta?.icon,
      message: `${meta?.name ?? s} has arrived. The wheel of the year turns.`,
      accent: SEASON_ACCENT[s],
    });
  });

  // Raid-incoming watcher: when a new raid is added to the queue, warn loudly.
  // Track the count rather than ids — new raid = count increases (raids are
  // removed on resolution, not flagged). On first run, record the baseline.
  let lastRaidCount: number | null = null;
  createEffect(() => {
    const count = state.incomingRaids.length;
    if (lastRaidCount === null) { lastRaidCount = count; return; }
    if (count <= lastRaidCount) { lastRaidCount = count; return; }
    lastRaidCount = count;
    showEvent({
      type: "raid",
      icon: "⚔️",
      message: "Incoming threat! Scouts report hostiles closing on the settlement. Ready the defenses!",
      onClick: () => navigate("/"),
    });
  });

  // Mission-return watcher: announce each freshly-completed mission that
  // landed on the claim pile. Track the length of completedMissions; when it
  // grows, the new entries are at the end.
  let lastCompletedLen: number | null = null;
  createEffect(() => {
    const completed = state.completedMissions ?? [];
    if (lastCompletedLen === null) { lastCompletedLen = completed.length; return; }
    if (completed.length <= lastCompletedLen) { lastCompletedLen = completed.length; return; }
    const newEntries = completed.slice(lastCompletedLen);
    lastCompletedLen = completed.length;
    for (const entry of newEntries) {
      const tpl = getMission(entry.missionId);
      const name = tpl?.name ?? entry.missionId;
      showEvent({
        type: "mission",
        icon: entry.success ? "🏆" : "💀",
        message: entry.success
          ? `Your adventurers have returned victorious from ${name}! Rewards await at the Guild.`
          : `Grim news — the mission "${name}" has failed. Your adventurers return wounded.`,
        onClick: () => navigate("/guild"),
      });
    }
  });

  // Co-op watchers — driven by WS events.
  // `coop:invite` → fire the moment someone invites us.
  // `coop:complete` → detected by refetching the coop list on `coop:update` and
  // spotting any that transitioned to `status=complete`. We seed the known-
  // complete set on mount so pre-existing unclaimed completions don't spam.
  const seenCompletedCoops = new Set<string>();
  onMount(async () => {
    try {
      const data = await fetchCoops();
      for (const c of data.coops) {
        if (c.status === "complete") seenCompletedCoops.add(c.id);
      }
    } catch { /* silent — user may not be logged in yet */ }
  });

  const offCoopInvite = wsClient.on("coop:invite", () => {
    showEvent({
      type: "coop",
      icon: "📨",
      message: "You've been invited to a co-op expedition! Visit the Guild to respond.",
      onClick: () => navigate("/guild"),
    });
  });
  const offCoopUpdate = wsClient.on("coop:update", async () => {
    try {
      const data = await fetchCoops();
      for (const c of data.coops) {
        if (c.status !== "complete") continue;
        if (seenCompletedCoops.has(c.id)) continue;
        seenCompletedCoops.add(c.id);
        const partner = c.iAmHost ? c.guestUsername : c.hostUsername;
        showEvent({
          type: "coop",
          icon: "⚔️",
          message: `Your co-op expedition with ${partner} is complete! Claim your share at the Guild.`,
          onClick: () => navigate("/guild"),
        });
      }
    } catch { /* silent */ }
  });
  onCleanup(() => { offCoopInvite(); offCoopUpdate(); });

  return (
    <>
      {/* Intro cinematic — shows once for new settlements */}
      <Show when={!state.introSeen}>
        <CinematicOverlay
          slides={INTRO_CINEMATIC}
          villageName={state.villageName}
          onComplete={() => {
            actions.markIntroSeen();
            showEvent({
              type: "info",
              icon: "📖",
              message: "New journal entry — Arrival",
              accent: "var(--accent-blue)",
              onClick: () => navigate("/chronicle?entry=ch1_arrival"),
            });
          }}
        />
      </Show>

      <ToastContainer />

      <div class="app-layout">
        <Sidebar />
        <header class="topbar">
          <ResourceBar />
          {/* Announcement banner descends from the topbar, overlaying content briefly */}
          <EventBanner />
        </header>
        <main class="content" ref={contentRef}>{props.children}</main>
      </div>
    </>
  );
}
