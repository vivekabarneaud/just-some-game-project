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
import { STORY_MISSIONS } from "@medieval-realm/shared/data/missions";
import { SEASON_META, SEASON_ELAPSED_SPAN, IS_DEV, nextSeason, seasonFoodOutlookNote, getGlobalSeason } from "./data/seasons";
import { resolveCurrentWeather, type WeatherType } from "./data/weather";
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

  // (Quest-completion banners removed — too frequent to be worth interrupting
  // for. Claimable quests already pulse the sidebar spark and list in the Quest
  // Log, which carry the signal without a center-screen banner.)

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
      // Winter gets its own cold stinger; the other seasons keep the soft chime.
      sound: s === "winter" ? "winter_is_coming" : undefined,
    });
  });

  // Season-change food watcher: in the last third of a season, if the NEXT
  // season's rates would run the stores dry before it ends, fire a top-of-screen
  // banner (a deficit the stores can outlast reassures on the Overview card, but
  // isn't worth interrupting for). Deduped per year+next-season so autumn's and
  // winter's warnings can each fire once a year. A season is one full span:
  // SEASON_ELAPSED_SPAN game-hours in dev, 72h in prod.
  const SEASON_DURATION_HOURS = IS_DEV ? SEASON_ELAPSED_SPAN : 72;
  let lastSeasonWarnKey: string | null = null;
  createEffect(() => {
    if (state.seasonElapsed < SEASON_ELAPSED_SPAN * 0.66) return;
    const next = nextSeason(state.season);
    const key = `${state.year}:${next}`;
    if (lastSeasonWarnKey === key) return;
    const outlook = actions.getSeasonFoodOutlook(next);
    const hoursToNext = Math.max(0, SEASON_ELAPSED_SPAN - state.seasonElapsed) * (IS_DEV ? 1 : 3);
    const note = seasonFoodOutlookNote(next, {
      net: outlook.net,
      hoursToEmpty: outlook.hoursToEmpty,
      hoursToNext,
      seasonHours: SEASON_DURATION_HOURS,
    });
    if (!note || note.tone !== "danger") return;
    lastSeasonWarnKey = key;
    // A long "… is coming" warning: a slow single scroll pass so it reads
    // comfortably. scrollMs = the pass speed; durationMs matches it so the banner
    // leaves exactly as the text finishes (no gap). Bump durationMs above scrollMs
    // if you want it to hold after scrolling off.
    showEvent({
      type: "season",
      icon: SEASON_META[next].icon,
      message: `${note.headline}. ${note.detail}`,
      accent: "var(--accent-gold)",
      scrollMs: 16000,
      durationMs: 14000,
      // A winter shortfall gets the cold stinger; other seasons a general alert.
      sound: next === "winter" ? "winter_is_coming" : "alert2",
      onClick: () => navigate("/"),
    });
  });

  // Harsh-weather watcher: heat waves and heavy rain damage standing crops
  // (applyWeatherCropDamage), so fire a banner when the weather turns into one,
  // deduped by only firing on the transition INTO it (not every window while it
  // lasts). Skipped in year 1, when crop damage doesn't apply yet. Uses the same
  // weather resolution the chip/ambience do, so it can't disagree with them.
  let lastHarshWeather: WeatherType | null = null;
  createEffect(() => {
    const w = resolveCurrentWeather(state.season, state.seasonElapsed, getGlobalSeason().year);
    if (lastHarshWeather === null) { lastHarshWeather = w; return; }
    if (w === lastHarshWeather) return;
    lastHarshWeather = w;
    if (state.year <= 1) return;
    if (w === "heat_wave") {
      showEvent({
        type: "season",
        icon: "🥵",
        message: "A heat wave settles over the valley. Crops wilt in the dry heat — see to your water while it lasts.",
        accent: "#e67e22",
        sound: "alert2",
        onClick: () => navigate("/farming"),
      });
    } else if (w === "heavy_rain") {
      showEvent({
        type: "season",
        icon: "🌧️",
        message: "Heavy rain batters the fields. A brimming cistern backs up onto the crops — keep the reserve low until it passes.",
        accent: "var(--accent-blue)",
        sound: "alert2",
        onClick: () => navigate("/farming"),
      });
    }
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

  // Mission-return watcher: banner only for STORY missions — rare, narratively
  // weighty, and the moment a new player most needs to know their team is back.
  // Regular missions are too frequent to interrupt for; the sidebar Guild spark +
  // the claim pile already signal them. Track completedMissions length; new
  // entries are at the end.
  let lastCompletedLen: number | null = null;
  createEffect(() => {
    const completed = state.completedMissions ?? [];
    if (lastCompletedLen === null) { lastCompletedLen = completed.length; return; }
    if (completed.length <= lastCompletedLen) { lastCompletedLen = completed.length; return; }
    const newEntries = completed.slice(lastCompletedLen);
    lastCompletedLen = completed.length;
    for (const entry of newEntries) {
      if (!STORY_MISSIONS.some((sm) => sm.id === entry.missionId)) continue;
      const tpl = getMission(entry.missionId);
      const name = tpl?.name ?? entry.missionId;
      showEvent({
        type: "mission",
        icon: entry.success ? "🏆" : "💀",
        message: entry.success
          ? `Your adventurers have returned victorious from ${name}! Rewards await at the Guild.`
          : `Grim news — the mission "${name}" has failed. Your adventurers return wounded.`,
        // A failed story mission gets a heavier stinger than the reward chime.
        sound: entry.success ? undefined : "alert3",
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
          const seasonSrc = () => EMBLEM[state.season];
          // A heat wave morphs the watermark to the angry-sun ("drought") art — a
          // page-filling signal the crops are under a weather emergency. Both
          // backdrops are mounted, stacked; a pure opacity crossfade in place makes
          // the season sun *become* angry rather than swap.
          const heat = () => resolveCurrentWeather(state.season, state.seasonElapsed, state.year) === "heat_wave";
          return (
            <>
              <Show when={seasonSrc()}>
                <div class="season-emblem-backdrop" classList={{ "emblem-hidden": heat() }} aria-hidden="true" style={{ "background-image": `url(${seasonSrc()})` }} />
              </Show>
              <div class="season-emblem-backdrop" classList={{ "emblem-hidden": !heat() }} aria-hidden="true" style={{ "background-image": "url(/images/seasons/season_drought.png)" }} />
            </>
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
