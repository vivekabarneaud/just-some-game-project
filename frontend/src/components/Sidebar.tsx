import { Show, createSignal } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { SEASON_META, HOURS_PER_SEASON, IS_DEV, getGlobalSeason } from "~/data/seasons";
import { logout } from "~/api/auth";
import { QUEST_CHAIN } from "~/data/quests";

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
      { path: "/inventory", icon: "🎒", label: "Inventory" },
    ],
  },
  {
    title: "Crafting",
    items: [
      { path: "/tailoring", icon: "🧵", label: "Tailoring" },
      { path: "/woodworker", icon: "🪚", label: "Woodworker" },
      { path: "/blacksmith", icon: "🔨", label: "Blacksmith" },
      { path: "/alchemy", icon: "🧪", label: "Alchemy" },
      { path: "/enchanting", icon: "✨", label: "Enchanting" },
      { path: "/jewelcrafting", icon: "💎", label: "Jewelcrafting" },
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
              const hasEmptyFields = () => state.fields.some((f) => !f.crop && !f.fallow && f.level > 0 && !f.upgrading);
              const hasClaimableQuest = () => {
                const c = state.questRewardsClaimed ?? [];
                const idx = QUEST_CHAIN.findIndex((q) => !c.includes(q.id));
                return idx >= 0 && QUEST_CHAIN[idx].condition(state);
              };
              const shouldBlink = () =>
                (item.path === "/" && hasClaimableQuest()) ||
                (item.path === "/farming" && (
                  (state.season === "spring" && hasEmptyFields()) ||
                  (state.season === "autumn" && state.seasonElapsed < 6)
                )) ||
                (item.path === "/guild" && actions.hasNewGuildContent());
              return (
                <A
                  href={item.path}
                  class="nav-link"
                  classList={{ active: isActive(item.path) }}
                  style={{ animation: shouldBlink() ? "pulse 2s infinite" : undefined }}
                >
                  <span class="nav-icon">{item.icon}</span>
                  {item.label}
                  {shouldBlink() && (
                    <span style={{ "margin-left": "auto", "font-size": "0.7rem", color:
                      item.path === "/" ? "var(--accent-gold)" :
                      item.path === "/guild" ? "var(--accent-blue)" :
                      state.season === "spring" ? "#7CFC00" : "#d4831a"
                    }}>
                      {item.path === "/" ? "quest!"
                        : item.path === "/guild" ? "new!"
                        : state.season === "spring" ? "plant!" : "harvest!"}
                    </span>
                  )}
                </A>
              );
            })}
          </>
        ))}
      </nav>

      <Show when={state.incomingRaids.length > 0}>
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
            Incoming threat{state.incomingRaids.length > 1 ? "s" : ""}! — View Overview
          </div>
        </A>
      </Show>

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
          <button class="skip-season-btn" onClick={() => actions.grantResources(10)}>
            +10 all resources
          </button>
          <button class="skip-season-btn" onClick={() => actions.triggerRaid()}>
            Trigger raid (1min)
          </button>
          <button class="reset-btn" onClick={() => {
            if (confirm("Start a new game? All progress will be lost.")) {
              actions.resetGame();
            }
          }}>
            New Game
          </button>
        </Show>
      </div>

      <div class="sidebar-account">
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
