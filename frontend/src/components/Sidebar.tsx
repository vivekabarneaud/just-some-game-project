import { Show } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { SEASON_META, HOURS_PER_SEASON } from "~/data/seasons";

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
      { path: "/buildings", icon: "🏗️", label: "Buildings" },
      { path: "/farming", icon: "🌾", label: "Farming" },
      { path: "/guild", icon: "🏰", label: "Adventurers" },
    ],
  },
  {
    title: "Economy",
    items: [
      { path: "/resources", icon: "📦", label: "Resources" },
      { path: "/marketplace", icon: "🏪", label: "Marketplace" },
    ],
  },
  {
    title: "Military",
    items: [
      { path: "/troops", icon: "⚔️", label: "Troops" },
      { path: "/defenses", icon: "🛡️", label: "Defenses" },
    ],
  },
  {
    title: "Arcane",
    items: [
      { path: "/research", icon: "📜", label: "Research" },
      { path: "/spells", icon: "🔮", label: "Spells" },
    ],
  },
  {
    title: "World",
    items: [
      { path: "/map", icon: "🗺️", label: "World Map" },
      { path: "/events", icon: "📣", label: "Events" },
    ],
  },
];

const SPEEDS = [1, 2, 5, 10, 50];

export default function Sidebar() {
  const location = useLocation();
  const { state, actions } = useGame();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>Medieval Realm</h1>
        <div class="village-name">Village of {state.villageName}</div>
      </div>
      <nav class="sidebar-nav">
        {navSections.map((section) => (
          <>
            <div class="nav-section-title">{section.title}</div>
            {section.items.map((item) => (
              <A
                href={item.path}
                class="nav-link"
                classList={{ active: isActive(item.path) }}
              >
                <span class="nav-icon">{item.icon}</span>
                {item.label}
              </A>
            ))}
          </>
        ))}
      </nav>

      <Show when={state.incomingRaids.length > 0}>
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
        }}>
          Incoming threat{state.incomingRaids.length > 1 ? "s" : ""}! ({state.incomingRaids.length})
        </div>
      </Show>

      <div class="sidebar-controls">
        <div class="nav-section-title">Season</div>
        <div class="season-display">
          <span class="season-icon">{SEASON_META[state.season].icon}</span>
          <span class="season-name" style={{ color: SEASON_META[state.season].color }}>
            {SEASON_META[state.season].name}
          </span>
          <span class="season-year">Year {state.year}</span>
        </div>
        <div class="season-progress-bar">
          <div
            class="season-progress-fill"
            style={{
              width: `${Math.min(100, (state.seasonElapsed / HOURS_PER_SEASON) * 100)}%`,
              background: SEASON_META[state.season].color,
            }}
          />
        </div>
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
        <button class="skip-season-btn" onClick={() => actions.grantResources(10)}>
          +10 all resources
        </button>
        <button class="reset-btn" onClick={() => {
          if (confirm("Start a new game? All progress will be lost.")) {
            actions.resetGame();
          }
        }}>
          New Game
        </button>
      </div>
    </aside>
  );
}
