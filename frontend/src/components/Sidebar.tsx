import { A, useLocation } from "@solidjs/router";
import { useGame } from "~/engine/gameState";

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

      <div class="sidebar-controls">
        <div class="nav-section-title">Game Speed</div>
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
