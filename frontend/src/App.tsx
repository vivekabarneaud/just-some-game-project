import { Show, createEffect, createSignal, onMount, onCleanup, type ParentProps } from "solid-js";
import { useNavigate, useLocation } from "@solidjs/router";
import Sidebar from "./components/Sidebar";
import ResourceBar from "./components/ResourceBar";
import WeatherAmbience from "./components/WeatherAmbience";
import AmbientRain from "./components/AmbientRain";
import AmbientNature from "./components/AmbientNature";
import Lightning from "./components/Lightning";
import CinematicOverlay from "./components/CinematicOverlay";
import ChronicleEntryModal from "./components/ChronicleEntryModal";
import TravelingMerchantModal from "./components/TravelingMerchantModal";
import { getMerchant } from "~/data/merchants";
import { openChronicleEntry, setOpenChronicleEntry } from "./data/robins";
import { getChronicleEntry } from "./data/chronicle_entries";
import ToastContainer from "./components/Toast";
import EventBanner, { showEvent } from "./components/EventBanner";
import EventModal from "./components/EventModal";
import SettingsModal from "./components/SettingsModal";
import { installGlobalClickSound } from "./engine/sounds";
import { INTRO_CINEMATIC } from "./data/cinematics";
import { QUEST_DEFINITIONS, isQuestClaimable } from "./data/quests";
import { SEASON_META, SEASON_ELAPSED_SPAN, IS_DEV } from "./data/seasons";
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

  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  // Reset the main scroll area to the top on every route change. The sidebar is
  // separate so it keeps its own scroll; only the content pane is reset.
  // Also closes the mobile drawer if it was open.
  createEffect(() => {
    location.pathname; // track
    if (contentRef) contentRef.scrollTop = 0;
    setSidebarOpen(false);
  });

  // Quest-completion watcher: whenever any active quest transitions to a
  // claimable state, broadcast a one-shot toast. Deduped by id so each quest
  // fires at most once per session even if its condition briefly toggles.
  // Multiple concurrent quests are handled — one toast per newly-claimable id.
  const announcedQuests = new Set<string>();
  createEffect(() => {
    for (const quest of QUEST_DEFINITIONS) {
      if (!isQuestClaimable(quest, state)) continue;
      if (announcedQuests.has(quest.id)) continue;
      announcedQuests.add(quest.id);
      // Memory check-ins (reward-less, surface a cast memory) are quiet personal
      // beats, not urgent matters — skip the top-of-screen banner entirely. They
      // still show in the Quest Log and pulse the sidebar; the banner is reserved
      // for things worth interrupting the player for.
      const isMemoryOnly = quest.rewards.length === 0 && (quest.unlocksBioFragments?.length ?? 0) > 0;
      if (isMemoryOnly) continue;
      showEvent({
        type: "quest",
        icon: quest.icon,
        message: `Quest complete — ${quest.title}. Visit the Quest Log to claim your reward!`,
        onClick: () => navigate("/quests"),
      });
    }
  });

  // Robin-arrival watcher: surface a one-shot toast whenever a new robin lands
  // (state.pendingRobins gains an entry that wasn't there last tick). Deduped
  // per-robin so the toast doesn't repeat while the player is busy.
  const announcedRobins = new Set<string>();
  createEffect(() => {
    const pending = state.pendingRobins ?? [];
    for (const id of pending) {
      if (announcedRobins.has(id)) continue;
      announcedRobins.add(id);
      // Only fire for robins the player hasn't already cleared in this session.
      // Loaded saves with a stale pending entry should still announce on first
      // load — that's a feature, not a bug.
      showEvent({
        type: "info",
        icon: "🐦",
        message: "A robin landed on the watchtower this morning.",
        accent: "var(--accent-blue)",
        onClick: () => navigate("/"),
      });
    }
  });

  // Story-chain beat watcher: when a chain enqueues a chronicle entry to
  // surface as a beat modal (state.pendingChronicleBeats), pop it — once, and
  // only when no other chronicle modal is already open (so beats don't stack on
  // an intro/robin entry). The entry is already in the archive; we drain it from
  // the queue as we show it, so it never re-pops on the next tick or reload.
  createEffect(() => {
    const pending = state.pendingChronicleBeats ?? [];
    if (pending.length === 0) return;
    if (openChronicleEntry()) return;
    const id = pending[0];
    const entry = getChronicleEntry(id);
    actions.dismissChronicleBeat(id);
    if (entry) setOpenChronicleEntry(entry);
  });

  // Traveling-merchant return watcher: when a recurring merchant sets up a stall
  // at the market (state.merchantStall appears), toast the player so they don't
  // miss the visit. Deduped by the stall's expiry, so it fires once per return
  // (and once on a load that finds a stall already standing).
  let announcedStallExpiry: number | null = null;
  createEffect(() => {
    const stall = state.merchantStall;
    if (!stall) return;
    if (announcedStallExpiry === stall.expiresAt) return;
    announcedStallExpiry = stall.expiresAt;
    const m = getMerchant(stall.merchantId);
    showEvent({
      type: "info",
      icon: "🧳",
      message: `${m?.name ?? "A trader"} has set up a stall at the market — trading until morning.`,
      accent: "var(--accent-gold)",
      onClick: () => navigate("/marketplace"),
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

  // Pre-winter watcher: once per autumn, fire a top-of-screen banner ONLY when
  // the stores wouldn't outlast winter (a deficit the harvest surplus can absorb
  // isn't worth interrupting for). Fires in the last third of autumn (actionable,
  // not a whole season early) and is deduped per year. Winter is one full season:
  // SEASON_ELAPSED_SPAN game-hours in dev, 72h in prod.
  const WINTER_DURATION_HOURS = IS_DEV ? SEASON_ELAPSED_SPAN : 72;
  let lastWinterWarnYear: number | null = null;
  createEffect(() => {
    if (state.season !== "autumn") return;
    if (state.seasonElapsed < SEASON_ELAPSED_SPAN * 0.66) return;
    if (lastWinterWarnYear === state.year) return;
    const outlook = actions.getWinterFoodOutlook();
    if (outlook.winterNet >= 0 || outlook.hoursToEmpty > WINTER_DURATION_HOURS) return;
    lastWinterWarnYear = state.year;
    const empty = Number.isFinite(outlook.hoursToEmpty) ? `about ${Math.round(outlook.hoursToEmpty)}h` : "a while";
    showEvent({
      type: "season",
      icon: "❄️",
      message: `Winter is coming, and our stores won't last it. Foraging and the hunt thin out, and at those rates the larder runs dry in ${empty} — before spring. Stock up while the harvest holds.`,
      accent: "var(--accent-gold)",
      onClick: () => navigate("/"),
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
    installGlobalClickSound();
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
            // Auto-open the first chronicle entry so new players meet the journal
            // right away (once, straight after the intro). Dismissing it folds it
            // into the sidebar Chronicle link, teaching where to find it later.
            const entry = getChronicleEntry("ch1_arrival");
            if (entry) setOpenChronicleEntry(entry);
          }}
        />
      </Show>

      <ToastContainer />

      {/* Global chronicle modal — opened by the robin sidebar pill (or any
          other cross-page chronicle hook). Story-mission claim still uses
          its own page-level modal in AdventurersGuild. */}
      <Show when={openChronicleEntry()}>
        {(entry) => <ChronicleEntryModal entry={entry()} onClose={() => setOpenChronicleEntry(null)} />}
      </Show>

      {/* Narrative event banner modal — auto-shows when state.pendingEvents
          has items. Each event is read-and-dismissed by the player. */}
      <EventModal />
      <SettingsModal />

      {/* A traveling merchant is passing through — two-panel visit + instant trade. */}
      <Show when={state.pendingMerchantVisitId}>
        {(id) => <TravelingMerchantModal merchantId={id()} onClose={() => actions.dismissMerchantVisit()} />}
      </Show>

      {/* Weather backdrop layers (static images, behind everything). Two layers
          — rain-on-glass + iced-window — each fading its own opacity so switching
          between wet and snowy weather cross-fades instead of popping. */}
      <div class="weather-glass" aria-hidden="true" />
      <div class="weather-glass weather-glass-snow" aria-hidden="true" />
      {/* Weather mood vignette — darkens the frame edges in wet weather. */}
      <div class="weather-vignette" aria-hidden="true" />
      {/* Farming season emblem — a faint watermark on the content pane, layered
          just above the weather rain but below the cards, and fixed so it stays
          put while the page scrolls. Farming page only. Autumn borrows the
          summer art until its own emblem is drawn. */}
      <Show when={location.pathname.startsWith("/farming")}>
        {(() => {
          const EMBLEM: Record<string, string> = {
            spring: "/images/seasons/season_spring.png",
            summer: "/images/seasons/season_summer.png",
            winter: "/images/seasons/season_winter.png",
            autumn: "/images/seasons/season_summer.png", // TEMP stand-in until autumn art
          };
          const src = () => EMBLEM[state.season];
          return (
            <Show when={src()}>
              <div class="season-emblem-backdrop" aria-hidden="true" style={{ "background-image": `url(${src()})` }} />
            </Show>
          );
        })()}
      </Show>
      {/* Rain ambience on the audio `ambient` channel (weather-driven loop). */}
      <AmbientRain />
      {/* Fair-weather ambience: wind bed + randomized bird chirps (clear/overcast). */}
      <AmbientNature />
      {/* Scene-wide lightning during storms (screen-blended, irregular strikes). */}
      <Lightning />

      <div class="app-layout" classList={{ "sidebar-open": sidebarOpen() }}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
        <button
          class="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
        <header class="topbar">
          <WeatherAmbience />
          <button
            class="hamburger-btn"
            aria-label="Open menu"
            aria-expanded={sidebarOpen()}
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
          <ResourceBar />
          {/* Announcement banner descends from the topbar, overlaying content briefly */}
          <EventBanner />
        </header>
        <main class="content" ref={contentRef}>{props.children}</main>
      </div>
    </>
  );
}
