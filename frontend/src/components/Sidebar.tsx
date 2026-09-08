import { Show, createSignal, onMount, onCleanup } from "solid-js";
import { A, useLocation, useNavigate } from "@solidjs/router";
import { useGame, CRAFTING_RECIPES, isRecipeDiscovered } from "~/engine/gameState";
import { setOpenSettings } from "~/components/SettingsModal";
import { SEASON_META, IS_DEV } from "~/data/seasons";
import { WEATHER_META, WEATHER_TYPES, resolveWeather, currentWeatherInfo, weatherOverride, setWeatherOverride } from "~/data/weather";
import { getWaterCap, CISTERN_ID, DELUGE_SAFE_FILL } from "~/data/water";
import { CLIMATE_META, climateOverrideBand, setClimateOverride, type ClimateBand } from "~/data/climate";
import { logout, getUsername } from "~/api/auth";
import { QUEST_DEFINITIONS, isQuestTriggered } from "~/data/quests";
import { totalPopulation } from "~/data/citizens";
// (Robin pill removed from sidebar — robin notifications surface via the
//  Overview badge + the Overview page's robin card instead.)
import { fetchLeaderboard } from "~/api/leaderboard";
import { NavSpark } from "~/components/NavSpark";
import { NAV_ARROW, NAV_GLYPH } from "~/data/navWidgets";
import { fetchFriends } from "~/api/friends";
import { fetchCoops } from "~/api/coop";
import { wsClient } from "~/api/ws";
import { FIELD_MAX_LEVEL } from "~/data/crops";
import Tooltip from "~/components/Tooltip";
import SeasonIcon from "~/components/SeasonIcon";
import WeatherIcon from "~/components/WeatherIcon";

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Settlement",
    items: [
      { path: "/", icon: "🏘️", label: "Overview" },
      { path: "/chronicle", icon: "📖", label: "Chronicle" },
      { path: "/quests", icon: "📋", label: "Quests" },
      { path: "/buildings", icon: "🏗️", label: "Buildings" },
      { path: "/farming", icon: "🌾", label: "Farming" },
      { path: "/guild", icon: "🏰", label: "Adventurers" },
    ],
  },
  {
    title: "Military",
    items: [
      { path: "/defenses", icon: "🛡️", label: "Defenses" },
    ],
  },
  {
    title: "Economy",
    items: [
      { path: "/marketplace", icon: "🏪", label: "Marketplace" },
      { path: "/tavern", icon: "🍻", label: "Tavern" },
    ],
  },
  {
    title: "Crafting",
    items: [
      { path: "/kitchen", icon: "🍳", label: "The Kitchens" },
      { path: "/alchemy", icon: "🧪", label: "Alchemy" },
      { path: "/tailoring", icon: "🧵", label: "Tailoring" },
      { path: "/woodworker", icon: "🪚", label: "Woodworker" },
      { path: "/blacksmith", icon: "🔨", label: "Blacksmith" },
      { path: "/leatherworking", icon: "🪡", label: "Leatherworking" },
      { path: "/enchanting", icon: "✨", label: "Enchanting" },
      { path: "/jewelcrafting", icon: "💎", label: "Jewelcrafting" },
    ],
  },
  {
    title: "World",
    items: [
      { path: "/inventory", icon: "🎒", label: "Inventory" },
      { path: "/map", icon: "🗺️", label: "World Map" },
      { path: "/leaderboard", icon: "🏆", label: "Leaderboard" },
      { path: "/shrine", icon: "🔮", label: "Shrine" },
      { path: "/friends", icon: "👥", label: "Friends" },
      { path: "/events", icon: "📣", label: "Events" },
    ],
  },
];

const SPEEDS = [1, 2, 5, 10, 50];

/** Crafting links whose page is useless until the building exists — these get
 *  DISABLED (greyed, non-clickable) rather than shown enabled with a "go build
 *  this first" message on click. Keeps the early-game sidebar legible. Keyed by
 *  nav path → the building that page needs (greyed until that building exists). */
const LINK_REQUIRED_BUILDING: Record<string, string> = {
  "/kitchen": "kitchen",
  "/tailoring": "tailoring_shop",
  "/woodworker": "woodworker",
  "/blacksmith": "blacksmith",
  "/leatherworking": "leatherworking",
  "/jewelcrafting": "jewelcrafter",
  "/alchemy": "alchemy_lab",
  "/enchanting": "enchanting_shop",
  "/marketplace": "marketplace",
  "/tavern": "tavern",
  "/shrine": "shrine",
};

/** Routes whose page plays its own themed mount sound (page_turn / dagger /
 *  bell). Suppress the generic nav click on these links so navigating to them
 *  doesn't fire two sounds at once — the themed page sound wins. */
const PATHS_WITH_MOUNT_SOUND = new Set([
  "/quests", "/chronicle", "/map", "/guild", "/defenses", "/shrine",
]);

/** Sidebar nav path → buildingId for crafting buildings.
 *  Drives the per-page "new recipes" badge. Pages without a building
 *  (e.g. /enchanting, not built yet) are simply omitted. */
const CRAFTING_PATH_TO_BUILDING_ID: Record<string, string> = {
  "/tailoring": "tailoring_shop",
  "/woodworker": "woodworker",
  "/blacksmith": "blacksmith",
  "/leatherworking": "leatherworking",
  "/alchemy": "alchemy_lab",
  "/jewelcrafting": "jewelcrafter",
  "/kitchen": "kitchen",
};

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar(props: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, actions } = useGame();
  const [myRank, setMyRank] = createSignal<number | null>(null);
  const [snapSaved, setSnapSaved] = createSignal(false);
  const [hasSnap, setHasSnap] = createSignal(actions.hasDevSnapshot());
  const [incomingFriendRequests, setIncomingFriendRequests] = createSignal(0);
  const [incomingCoopInvites, setIncomingCoopInvites] = createSignal(0);

  onMount(async () => {
    try {
      const entries = await fetchLeaderboard();
      const username = getUsername();
      if (username) {
        const idx = entries.findIndex((e) => e.playerName === username);
        if (idx >= 0) setMyRank(idx + 1);
      } else {
        // Fallback: match by settlement name
        const idx = entries.findIndex((e) => e.settlementName === state.villageName);
        if (idx >= 0) setMyRank(idx + 1);
      }
    } catch { /* silent */ }
  });

  // Poll incoming friend requests every 30s so the sidebar blinks when a request arrives
  const refreshFriendRequests = async () => {
    try {
      const data = await fetchFriends();
      setIncomingFriendRequests(data.incoming.length);
    } catch { /* silent */ }
  };
  // Poll incoming coop invites (pending, where I'm the guest)
  const refreshCoopInvites = async () => {
    try {
      const data = await fetchCoops();
      const myId = undefined; // we don't have the playerId in the sidebar directly; filter by iAmHost=false + status=pending
      const count = data.coops.filter((c) => !c.iAmHost && c.status === "pending").length;
      setIncomingCoopInvites(count);
    } catch { /* silent */ }
  };
  onMount(() => {
    refreshFriendRequests();
    refreshCoopInvites();
    // Slow fallback poll — WS pushes are the primary path. Catches missed events
    // if the socket ever drops and something arrived while disconnected.
    const timer = setInterval(() => {
      refreshFriendRequests();
      refreshCoopInvites();
    }, 120_000);
    onCleanup(() => clearInterval(timer));

    // Realtime: refresh immediately when the backend pushes
    const offFriend = wsClient.on("friend:update", () => refreshFriendRequests());
    const offInvite = wsClient.on("coop:invite", () => refreshCoopInvites());
    const offUpdate = wsClient.on("coop:update", () => refreshCoopInvites());
    const offCancelled = wsClient.on("coop:cancelled", () => refreshCoopInvites());
    onCleanup(() => { offFriend(); offInvite(); offUpdate(); offCancelled(); });
  });

  // ─── Per-nav signal helpers ────────────────────────────────────
  // The sidebar surfaces two kinds of attention signals: a numeric blue
  // badge (unseen counts) and a pulsing colored label (situational nudges).
  // Both are looked up by path so the JSX stays a flat map.

  const unseenQuestCount = () => {
    // Count of active quests that are either un-hovered or claim-ready.
    // Hovering only dismisses "new"; a claimable quest keeps signaling
    // until the player claims it — EXCEPT reward-less quests (e.g. the "social"
    // memory check-ins like "See to Edda"), which have no Claim action to ever
    // clear them and are permanently `condition: () => true`. For those, hover
    // is the only dismissal, so seen-is-enough — otherwise the badge nags forever.
    const seen = state.questsClaimableSeen ?? [];
    let n = 0;
    for (const q of QUEST_DEFINITIONS) {
      if (state.questRewardsClaimed?.includes(q.id)) continue;
      if (!isQuestTriggered(q, state)) continue;
      const claimable = q.rewards.length > 0 && q.condition(state);
      if (!seen.includes(q.id) || claimable) n++;
    }
    return n;
  };

  const unseenChronicleCount = () =>
    actions.countUnseenJournalEntries() + actions.countUnseenMemories();

  const unseenRecipeCount = (path: string) => {
    // Tool-locked recipes count too — the player still wants to know they
    // exist, even if a tool is needed before they can be crafted.
    const buildingId = CRAFTING_PATH_TO_BUILDING_ID[path];
    if (!buildingId) return 0;
    const b = state.buildings.find((bb) => bb.buildingId === buildingId);
    if (!b || b.level === 0) return 0;
    const seen = state.recipesSeen ?? [];
    let n = 0;
    for (const r of CRAFTING_RECIPES) {
      if (r.building !== buildingId) continue;
      if (b.level < r.minLevel) continue;
      // A discovery-gated recipe only counts once it's actually unlocked — no
      // badge teasing something the player can't see or make yet.
      if (!isRecipeDiscovered(r, state.discoveredRecipes ?? [])) continue;
      if (seen.includes(r.id)) continue;
      n++;
    }
    return n;
  };

  const badgeCountFor = (path: string): number => {
    if (path === "/") return state.pendingRobins?.length ?? 0;
    if (path === "/quests") return unseenQuestCount();
    if (path === "/chronicle") return unseenChronicleCount();
    if (path === "/guild") return state.completedMissions?.length ?? 0;
    if (CRAFTING_PATH_TO_BUILDING_ID[path]) return unseenRecipeCount(path);
    return 0;
  };

  const pulseFor = (path: string): { color: string; text: string } | null => {
    if (path === "/farming") {
      const hasEmptyFields = state.fields.some((f) => !f.crop && f.level > 0 && !f.upgrading);
      const hasUpgradableFields = state.fields.some((f) => f.level > 0 && f.level < FIELD_MAX_LEVEL && !f.upgrading);
      // Only nudge "harvest!" when there's an actual standing field crop to bring
      // in — a farm of gardens only (no grain fields) shouldn't ping every autumn.
      const hasStandingFieldCrop = state.fields.some((f) => f.level > 0 && !!f.crop);
      if (state.season === "spring" && hasEmptyFields) return { color: "#7CFC00", text: "plant!" };
      if (state.season === "autumn" && state.seasonElapsed < 6 && hasStandingFieldCrop) return { color: "#d4831a", text: "harvest!" };
      if (state.season === "winter" && hasUpgradableFields) return { color: "#a5d8ff", text: "upgrade!" };
      return null;
    }
    if (path === "/guild") {
      // No guild nudges before the hall is raised — the roster page only shows
      // "build the guild" until then, so any "new!"/"coop!" ping dead-ends there
      // (the Thornwoods can arrive and staff their camps pre-guild).
      if ((state.buildings.find((b) => b.buildingId === "adventurers_guild")?.level ?? 0) < 1) return null;
      if (incomingCoopInvites() > 0) return { color: "var(--accent-blue)", text: "coop!" };
      if (actions.hasNewAdventurers()) return { color: "var(--accent-blue)", text: "new!" };
      if (actions.hasNewGuildContent()) return { color: "var(--accent-blue)", text: "new!" };
      return null;
    }
    if (path === "/friends" && incomingFriendRequests() > 0) {
      return { color: "var(--accent-gold)", text: `+${incomingFriendRequests()}` };
    }
    return null;
  };

  /** A link whose required building isn't built yet → render disabled. */
  const isLinkDisabled = (path: string): boolean => {
    const bid = LINK_REQUIRED_BUILDING[path];
    if (!bid) return false;
    return (state.buildings.find((b) => b.buildingId === bid)?.level ?? 0) < 1;
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  /** Immediate-danger flag (renders as red "!" badge). Different from the
   *  blue notification badge and the pulse — this is "fix this NOW, citizens
   *  will die". Returns a one-word reason for the tooltip when active, or
   *  null when no danger applies to this nav item. */
  const dangerFor = (path: string): string | null => {
    if (path === "/farming") {
      // A heat wave with a standing crop = the food supply is actively dying —
      // an act-now threat, so it gets the red urgent spark (run water / let it
      // pass is the answer). No crop standing → nothing to lose, no spark.
      const info = currentWeatherInfo(state);
      const wx = resolveWeather(info.season, info.progress, info.year);
      const hasStandingCrop =
        state.gardens.some((g) => g.plantedYear != null && (g.plantsAlive ?? 0) > 0) ||
        state.fields.some((f) => !!f.crop && f.level > 0);
      if (!hasStandingCrop) return null;
      if (wx === "heat_wave") return "Crops wilting in the heat";
      // A downpour only drowns crops when the cistern backs up (fill above the
      // safe line); open the sluice / run it low and the flood sheds harmlessly.
      if (wx === "heavy_rain") {
        const cb = state.buildings.find((b) => b.buildingId === CISTERN_ID);
        const cap = getWaterCap(Math.max(0, (cb?.level ?? 0) - (cb?.damaged ? 1 : 0)));
        const fill = cap > 0 ? (state.resources.water ?? 0) / cap : 0;
        if (fill > DELUGE_SAFE_FILL) return "Crops drowning in the downpour";
      }
      return null;
    }
    if (path === "/") {
      // An incoming raid is the most acute thing on the Overview — surface it as
      // the red spark so the player doesn't have to scroll to the threat pill.
      const pendingRaids = state.incomingRaids.filter((r) => !r.combatLog).length;
      if (pendingRaids > 0) return pendingRaids > 1 ? `${pendingRaids} incoming threats` : "Incoming threat";
      const foods = state.foods;
      if (!foods) return null;
      const total = (Object.values(foods) as number[]).reduce((s, v) => s + v, 0);
      const pop = totalPopulation(state.citizens);
      if (pop === 0) return null;
      const rates = actions.getProductionRates();
      // Must match the Overview's netRate("food") exactly — including the
      // cooking net (porridge etc.) — or the badge fires while the Overview
      // shows no danger (cooking surplus the badge was ignoring).
      const net = rates.food - actions.getFoodConsumption() - actions.getAnimalFoodConsumption() + actions.getCookingFoodNet();
      // Match the Overview's `< 1` threshold so the sidebar badge label
      // doesn't bounce between "Out of food" and "Food running out" while
      // the stockpile oscillates near zero from float-point tick math.
      if (total < 1) return "Out of food";
      // Actively starving — stores hit zero AND food is still bleeding. Once
      // production turns positive the famine is over (morale recovers on its
      // own), so the red badge clears even while the penalty is still fading —
      // matches the Overview's foodDanger() exactly.
      if (state.starvationPenalty > 0 && net < 0) return "Citizens starving";
      if (net < 0 && total / Math.abs(net) < 12) return "Food running out";
      return null;
    }
    if (path === "/buildings") {
      // Raid damage is easy to miss — a destroyed building just goes inactive.
      // Surface the same red spark the Overview link uses so the player knows
      // there's a repair waiting.
      const n = state.buildings.filter((b) => b.damaged).length;
      if (n > 0) return n > 1 ? `${n} buildings damaged` : "Building damaged";
      return null;
    }
    return null;
  };

  return (
    <aside class="sidebar">
      <button
        class="sidebar-close-btn"
        aria-label="Close menu"
        onClick={() => props.onClose?.()}
      >
        ×
      </button>
      <div class="sidebar-header">
        <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "10px" }}>
          <h1>Valenheart</h1>
          {(() => {
            // Season emblem in the header — but during a HEAT WAVE, swap in the
            // angry-sun emblem so the player instantly reads the warm/brown UI as a
            // real weather emergency (crops wilting), not a theme change.
            const info = () => currentWeatherInfo(state);
            const wx = () => resolveWeather(info().season, info().progress, info().year);
            const heat = () => wx() === "heat_wave";
            return (
              <Tooltip text={heat() ? "Heat wave — crops are wilting" : SEASON_META[info().season].name} position="bottom">
                {/* Both emblems stacked and crossfaded: on a heat wave the angry
                    sun rises in from below as the season emblem fades out (and
                    back when it passes). */}
                <div class="header-emblem-xfade">
                  <div class="emblem-layer" classList={{ visible: !heat() }}>
                    <SeasonIcon season={info().season} size={48} />
                  </div>
                  <div class="emblem-layer" classList={{ visible: heat() }}>
                    <WeatherIcon weather="heat_wave" size={48} />
                  </div>
                </div>
              </Tooltip>
            );
          })()}
        </div>
        {(() => {
          const [editing, setEditing] = createSignal(false);
          const [draft, setDraft] = createSignal("");

          const startEditing = () => {
            setDraft(state.villageName);
            setEditing(true);
          };

          const save = () => {
            if (draft().trim()) actions.renameVillage(draft());
            setEditing(false);
          };

          return (
            <Show when={editing()} fallback={
              <Tooltip text="Click to rename">
              <div
                class="village-name"
                onClick={startEditing}
                style={{ cursor: "pointer" }}
              >
                {(() => { const t = actions.getSettlementTier(); return t.charAt(0).toUpperCase() + t.slice(1); })()} of {state.villageName} <span style={{ "font-size": "0.65rem", opacity: 0.5 }}>✏</span>
              </div>
              </Tooltip>
            }>
              <input
                class="village-name-input"
                value={draft()}
                onInput={(e) => setDraft(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                  if (e.key === "Escape") setEditing(false);
                }}
                onBlur={save}
                maxLength={30}
                ref={(el) => setTimeout(() => el.select(), 0)}
              />
            </Show>
          );
        })()}
      </div>
      <div class="sidebar-scroll">
      <nav class="sidebar-nav" style={{ "--nav-arrow-img": `url(${NAV_ARROW})`, "--nav-icon-img": `url(${NAV_GLYPH})` }}>
        {navSections.map((section) => (
          <>
            <div class="nav-section-title">{section.title}</div>
            {section.items.map((item) => {
              // Accessors (not plain values): the Sidebar renders once and lives
              // in the persistent layout, so these must stay reactive to reflect
              // live state (a famine that starts while you're sitting on a page,
              // new recipes, etc.). Read inside JSX below so Solid tracks them.
              const badge = () => badgeCountFor(item.path);
              const pulse = () => pulseFor(item.path);
              const danger = () => dangerFor(item.path);
              if (isLinkDisabled(item.path)) {
                return (
                  <Tooltip text="Build this first to use it" position="right" block>
                  <div
                    class="nav-link"
                    style={{ opacity: "0.4", cursor: "default", "pointer-events": "none" }}
                  >
                    <span class="nav-icon nav-icon-spark" aria-hidden="true" />
                    {item.label}
                  </div>
                  </Tooltip>
                );
              }
              return (
                <A
                  href={item.path}
                  class="nav-link"
                  classList={{ active: isActive(item.path) }}
                  data-nav-path={item.path}
                  data-no-click-sound={PATHS_WITH_MOUNT_SOUND.has(item.path) ? "" : undefined}
                >
                  <span class="nav-icon nav-icon-spark" aria-hidden="true" />
                  <span class="nav-arrow" aria-hidden="true" />
                  {item.label}
                  {item.path === "/leaderboard" && myRank() && (
                    <span style={{ "margin-left": "auto", "font-size": "0.7rem", color: "var(--accent-gold)" }}>
                      #{myRank()}
                    </span>
                  )}
                  {/* One spark for every "attention here" cue: red + fast for
                      immediate danger, gold for new-content / nudges (plant!,
                      new recipes, coop invite…). The old word keeps living in
                      the hover tooltip so nothing is lost. */}
                  {danger() ? (
                    <Tooltip text={danger()!} style={{ "margin-left": "auto" }}>
                      <NavSpark urgent />
                    </Tooltip>
                  ) : (badge() > 0 || pulse()) ? (
                    <Tooltip text={pulse()?.text ?? "Something new"} style={{ "margin-left": "auto" }}>
                      <NavSpark />
                    </Tooltip>
                  ) : null}
                </A>
              );
            })}
          </>
        ))}
      </nav>

      {(() => {
        // Pre-resolution raids = the actual incoming threat. Post-resolution
        // raids (have combatLog) are stuck in the array until the player
        // watches the playback — those should NOT pulse red. Two pills.
        const pendingRaids = () => state.incomingRaids.filter((r) => !r.combatLog);
        const resolvedRaids = () => state.incomingRaids.filter((r) => !!r.combatLog);
        return (
          <>
            <Show when={pendingRaids().length > 0}>
              <A href="/" style={{ "text-decoration": "none" }}>
                <div style={{
                  margin: "0 12px 8px",
                  padding: "8px 10px",
                  background: "rgba(231, 76, 60, 0.15)",
                  border: "1px solid var(--accent-red)",
                  "border-radius": "6px",
                  "font-size": "0.8rem",
                  color: "var(--accent-red)",
                  "text-align": "center",
                  animation: "pulse 2s infinite",
                  cursor: "pointer",
                }}>
                  Incoming threat{pendingRaids().length > 1 ? "s" : ""}! — View Overview
                </div>
              </A>
            </Show>
            <Show when={pendingRaids().length === 0 && resolvedRaids().length > 0}>
              <A href="/" style={{ "text-decoration": "none" }}>
                <div style={{
                  margin: "0 12px 8px",
                  padding: "8px 10px",
                  background: "rgba(218, 165, 32, 0.12)",
                  border: "1px solid var(--accent-gold)",
                  "border-radius": "6px",
                  "font-size": "0.8rem",
                  color: "var(--accent-gold)",
                  "text-align": "center",
                  cursor: "pointer",
                }}>
                  ⚔️ Watch raid combat — View Overview
                </div>
              </A>
            </Show>
          </>
        );
      })()}

      {/* (Robin sidebar pill removed — robin notifications now surface as the
           sidebar Overview badge, plus the dedicated robin card on the
           Overview page itself.) */}

      <div class="sidebar-controls">
        <div class="nav-section-title">Season</div>
        {(() => {
          // Season + progress follow the shared world clock in prod, but the
          // Weather source of truth (season/progress + the roll's year). The
          // displayed "Year N" below is the settlement's OWN age (state.year),
          // deliberately separate — it must NOT feed the weather roll, or the
          // chip desyncs from the rendered/audible weather.
          const seasonInfo = () => currentWeatherInfo(state);
          return (
            <>
              <div class="season-display">
                <span class="season-icon"><SeasonIcon season={seasonInfo().season} size={18} /></span>
                <span class="season-name" style={{ color: SEASON_META[seasonInfo().season].color }}>
                  {SEASON_META[seasonInfo().season].name}
                </span>
                {(() => {
                  const wx = () => resolveWeather(seasonInfo().season, seasonInfo().progress, seasonInfo().year);
                  return (
                    <span class="weather-chip" tabindex="0">
                      <span class="wx-chip-icon"><WeatherIcon weather={wx()} size={15} /></span>
                      <span class="wx-chip-name">{WEATHER_META[wx()].name}</span>
                      <span class="weather-tip">{WEATHER_META[wx()].blurb}</span>
                    </span>
                  );
                })()}
                <span class="season-year">Year {state.year}</span>
              </div>
              <div class="season-progress-bar">
                <div
                  class="season-progress-fill"
                  style={{
                    width: `${Math.min(100, seasonInfo().progress * 100)}%`,
                    background: SEASON_META[seasonInfo().season].color,
                  }}
                />
              </div>
            </>
          );
        })()}

        <Show when={IS_DEV}>
          <button class="btn-secondary" style={{ width: "100%", "justify-content": "center", "font-size": "0.82rem", "margin-top": "4px" }} onClick={() => actions.skipSeason()}>
            Skip to next season →
          </button>

          <div class="nav-section-title" style={{ "margin-top": "12px" }}>Game Speed</div>
          <div class="speed-buttons">
            {SPEEDS.map((s) => (
              <button
                class="speed-btn"
                classList={{ active: state.gameSpeed === s }}
                onClick={() => actions.setGameSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
          <div class="nav-section-title" style={{ "margin-top": "12px" }}>Dev Tools</div>
          <button class="btn-tertiary" style={{ width: "100%", "justify-content": "center" }} onClick={() => actions.grantResources(100)}>
            +100 all resources
          </button>
          <button class="btn-tertiary" style={{ width: "100%", "justify-content": "center" }} onClick={() => actions.triggerRaid()}>
            Trigger raid (1min)
          </button>
          <button class="btn-tertiary" style={{ width: "100%", "justify-content": "center" }} onClick={() => actions.devPreviewAwayReport()}>
            Preview away digest
          </button>
          <div class="dev-weather-row">
            <span class="dev-weather-label">Weather</span>
            <select
              class="dev-weather-select"
              value={weatherOverride() ?? "auto"}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setWeatherOverride(v === "auto" ? null : (v as any));
              }}
            >
              <option value="auto">Auto (ambient)</option>
              {WEATHER_TYPES.map((w) => (
                <option value={w}>{WEATHER_META[w].icon} {WEATHER_META[w].name}</option>
              ))}
            </select>
          </div>
          <div class="dev-weather-row">
            <span class="dev-weather-label">Climate</span>
            <select
              class="dev-weather-select"
              value={climateOverrideBand() ?? "auto"}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setClimateOverride(v === "auto" ? null : (v as ClimateBand));
              }}
            >
              <option value="auto">Auto (world year)</option>
              {(Object.keys(CLIMATE_META) as ClimateBand[]).map((b) => (
                <option value={b}>{CLIMATE_META[b].icon} {CLIMATE_META[b].name}</option>
              ))}
            </select>
          </div>
          <div class="nav-section-title" style={{ "margin-top": "12px" }}>Test Snapshot</div>
          <button class="btn-tertiary" style={{ width: "100%", "justify-content": "center" }} onClick={() => {
            actions.saveDevSnapshot();
            setHasSnap(true);
            setSnapSaved(true);
            setTimeout(() => setSnapSaved(false), 2000);
          }}>
            {snapSaved() ? "✓ Snapshot saved" : "💾 Save snapshot"}
          </button>
          <Show when={hasSnap()}>
            <button class="btn-tertiary" style={{ width: "100%", "justify-content": "center" }} onClick={() => {
              if (confirm("Restore the saved snapshot? Your current progress will be replaced by the snapshot and the page will reload.")) {
                actions.restoreDevSnapshot();
              }
            }}>
              ↩️ Restore snapshot
            </button>
          </Show>

          <button class="btn-tertiary" style={{ width: "100%", "justify-content": "center" }} onClick={() => {
            if (confirm("Start a new game? All progress will be lost.")) {
              actions.resetGame();
              // Send the player to the Overview — that's where a real new
              // game lands after the intro cinematic, and the dev shortcut
              // should mirror that flow.
              navigate("/", { replace: true });
            }
          }}>
            New Game
          </button>
        </Show>
      </div>

      </div>

      <div class="sidebar-account">
        <Show when={getUsername()}>
          <div
            style={{
              "font-size": "0.72rem",
              color: "var(--text-muted)",
              "margin-bottom": "6px",
              "text-align": "center",
              "word-break": "break-all",
            }}
          >
            Logged in as <span style={{ color: "var(--text-secondary)" }}>{getUsername()}</span>
          </div>
        </Show>
        <Tooltip text="Open settings" block style={{ "margin-bottom": "6px" }}>
        <button
          class="btn-tertiary"
          style={{ width: "100%", "justify-content": "center" }}
          onClick={() => setOpenSettings(true)}
        >
          Settings
        </button>
        </Tooltip>
        <button
          class="btn-tertiary"
          style={{ width: "100%", "justify-content": "center" }}
          onClick={() => {
            if (confirm("Log out of your account?")) logout();
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
