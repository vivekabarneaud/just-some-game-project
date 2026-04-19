import { createSignal, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import ChronicleJournal from "./chronicle/ChronicleJournal";
import ChronicleCast from "./chronicle/ChronicleCast";
import ChronicleCharacters from "./chronicle/ChronicleCharacters";
import ChronicleBestiary from "./chronicle/ChronicleBestiary";

type Tab = "journal" | "cast" | "adventurers" | "bestiary";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "journal", label: "Journal", icon: "📖" },
  { id: "cast", label: "Cast", icon: "👥" },
  { id: "adventurers", label: "Adventurers", icon: "⚔️" },
  { id: "bestiary", label: "Bestiary", icon: "🐉" },
];

export default function Chronicle() {
  const { actions } = useGame();
  const [tab, setTab] = createSignal<Tab>("journal");

  const tabBadgeCount = (tabId: Tab): number => {
    if (tabId === "journal") return actions.countUnseenJournalEntries();
    if (tabId === "cast") return actions.countUnseenMemories();
    return 0;
  };

  return (
    <div>
      <h1 class="page-title">Chronicle of the Realm</h1>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: "4px", "margin-bottom": "20px",
        "border-bottom": "1px solid var(--border-color)",
      }}>
        {TABS.map((t) => {
          const active = () => tab() === t.id;
          const badge = () => tabBadgeCount(t.id);
          return (
            <button
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 16px",
                background: active() ? "var(--bg-secondary)" : "transparent",
                border: "none",
                "border-bottom": active() ? "2px solid var(--accent-gold)" : "2px solid transparent",
                color: active() ? "var(--text-primary)" : (badge() > 0 ? "var(--accent-blue)" : "var(--text-muted)"),
                cursor: "pointer",
                "font-family": "var(--font-heading)",
                "font-size": "0.95rem",
                "margin-bottom": "-1px",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {t.icon} {t.label}
              {badge() > 0 && (
                <span style={{
                  "margin-left": "6px",
                  padding: "1px 7px",
                  "border-radius": "10px",
                  background: "var(--accent-blue)",
                  color: "#fff",
                  "font-size": "0.7rem",
                  "font-weight": "bold",
                }}>
                  {badge()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Show when={tab() === "journal"}>
        <ChronicleJournal />
      </Show>
      <Show when={tab() === "cast"}>
        <ChronicleCast />
      </Show>
      <Show when={tab() === "adventurers"}>
        <ChronicleCharacters />
      </Show>
      <Show when={tab() === "bestiary"}>
        <ChronicleBestiary />
      </Show>
    </div>
  );
}
