import { Show, createSignal, onMount, onCleanup } from "solid-js";
import { A, useLocation, useNavigate } from "@solidjs/router";
import { useGame, CRAFTING_RECIPES } from "~/engine/gameState";
import { isMuted, toggleMuted } from "~/engine/sounds";
import { SEASON_META, HOURS_PER_SEASON, IS_DEV, getGlobalSeason } from "~/data/seasons";
import { logout, getUsername } from "~/api/auth";
import { QUEST_DEFINITIONS, isQuestTriggered } from "~/data/quests";
// (Robin pill removed from sidebar — robin notifications surface via the
//  Overview badge + the Overview page's robin card instead.)
import { fetchLeaderboard } from "~/api/leaderboard";
import { fetchFriends } from "~/api/friends";
import { fetchCoops } from "~/api/coop";
import { wsClient } from "~/api/ws";
import { FIELD_MAX_LEVEL } from "~/data/crops";

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Village",
    items: [
      { path: "/", icon: "🏘️", label: "Overview" },
      { path: "/quests", icon: "📋", label: "Quests" },
      { path: "/buildings", icon: "🏗️", label: "Buildings" },
      { path: "/farming", icon: "🌾", label: "Farming" },
      { path: "/guild", icon: "🏰", label: "Adventurers" },
      { path: "/inventory", icon: "🎒", label: "Inventory" },
    ],
  },
  {
    title: "Crafting",
    items: [
      { path: "/tailoring", icon: "🧵", label: "Tailoring" },
      { path: "/woodworker", icon: "🪚", label: "Woodworker" },
      { path: "/blacksmith", icon: "🔨", label: "Blacksmith" },
      { path: "/leatherworking", icon: "🪡", label: "Leatherworking" },
      { path: "/alchemy", icon: "🧪", label: "Alchemy" },
      { path: "/enchanting", icon: "✨", label: "Enchanting" },
      { path: "/jewelcrafting", icon: "💎", label: "Jewelcrafting" },
      { path: "/kitchen", icon: "🍳", label: "The Kitchens" },
    ],
  },
  {
    title: "Economy",
    items: [
      { path: "/marketplace", icon: "🏪", label: "Marketplace" },
    ],
  },
  {
    title: "Military",
    items: [
      { path: "/defenses", icon: "🛡️", label: "Defenses" },
    ],
  },
  {
    title: "World",
    items: [
      { path: "/map", icon: "🗺️", label: "World Map" },
      { path: "/leaderboard", icon: "🏆", label: "Leaderboard" },
      { path: "/shrine", icon: "🔮", label: "Shrine" },
      { path: "/chronicle", icon: "📖", label: "Chronicle" },
      { path: "/friends", icon: "👥", label: "Friends" },
      { path: "/events", icon: "📣", label: "Events" },
    ],
  },
];

const SPEEDS = [1, 2, 5, 10, 50];

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
    // until the player claims it.
    const seen = state.questsClaimableSeen ?? [];
    let n = 0;
    for (const q of QUEST_DEFINITIONS) {
      if (state.questRewardsClaimed?.includes(q.id)) continue;
      if (!isQuestTriggered(q, state)) continue;
      if (!seen.includes(q.id) || q.condition(state)) n++;
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
      if (state.season === "spring" && hasEmptyFields) return { color: "#7CFC00", text: "plant!" };
      if (state.season === "autumn" && state.seasonElapsed < 6) return { color: "#d4831a", text: "harvest!" };
      if (state.season === "winter" && hasUpgradableFields) return { color: "#a5d8ff", text: "upgrade!" };
      return null;
    }
    if (path === "/guild") {
      if (incomingCoopInvites() > 0) return { color: "var(--accent-blue)", text: "coop!" };
      if (actions.hasNewGuildContent()) return { color: "var(--accent-blue)", text: "new!" };
      return null;
    }
    if (path === "/friends" && incomingFriendRequests() > 0) {
      return { color: "var(--accent-gold)", text: `+${incomingFriendRequests()}` };
    }
    return null;
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
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
        <h1>Valenheart</h1>
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
              <div
                class="village-name"
                onClick={startEditing}
                title="Click to rename"
                style={{ cursor: "pointer" }}
              >
                Village of {state.villageName} <span style={{ "font-size": "0.65rem", opacity: 0.5 }}>✏</span>
              </div>
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
      <nav class="sidebar-nav">
        {navSections.map((section) => (
          <>
            <div class="nav-section-title">{section.title}</div>
            {section.items.map((item) => {
              const badge = badgeCountFor(item.path);
              const pulse = pulseFor(item.path);
              return (
                <A
                  href={item.path}
                  class="nav-link"
                  classList={{ active: isActive(item.path) }}
                  style={{ animation: pulse ? "pulse 2s infinite" : undefined }}
                >
                  <span class="nav-icon">{item.icon}</span>
                  {item.label}
                  {item.path === "/leaderboard" && myRank() && (
                    <span style={{ "margin-left": "auto", "font-size": "0.7rem", color: "var(--accent-gold)" }}>
                      #{myRank()}
                    </span>
                  )}
                  {badge > 0 && (
                    <span class="notification-badge" style={{ "margin-left": "auto" }}>{badge}</span>
                  )}
                  {pulse && (
                    <span style={{ "margin-left": "auto", "font-size": "0.7rem", color: pulse.color }}>
                      {pulse.text}
                    </span>
                  )}
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
          const seasonInfo = () => IS_DEV
            ? { season: state.season, progress: state.seasonElapsed / HOURS_PER_SEASON, year: state.year }
            : getGlobalSeason();
          return (
            <>
              <div class="season-display">
                <span class="season-icon">{SEASON_META[seasonInfo().season].icon}</span>
                <span class="season-name" style={{ color: SEASON_META[seasonInfo().season].color }}>
                  {SEASON_META[seasonInfo().season].name}
                </span>
                <span class="season-year">Year {seasonInfo().year}</span>
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
          <button class="skip-season-btn" onClick={() => actions.skipSeason()}>
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
          <button class="skip-season-btn" onClick={() => actions.grantResources(100)}>
            +100 all resources
          </button>
          <button class="skip-season-btn" onClick={() => actions.triggerRaid()}>
            Trigger raid (1min)
          </button>
          <button class="reset-btn" onClick={() => {
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
        <button
          class="account-btn"
          onClick={toggleMuted}
          title={isMuted() ? "Unmute sound effects" : "Mute sound effects"}
          style={{ "margin-bottom": "6px" }}
          data-no-click-sound
        >
          <span style={{ "margin-right": "6px" }}>{isMuted() ? "🔇" : "🔊"}</span>
          {isMuted() ? "Sound off" : "Sound on"}
        </button>
        <button
          class="account-btn"
          onClick={() => {
            if (confirm("Log out of your account?")) logout();
          }}
        >
          <span style={{ "margin-right": "6px" }}>🚪</span> Log out
        </button>
      </div>
    </aside>
  );
}
