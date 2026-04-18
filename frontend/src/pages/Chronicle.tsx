import { createSignal, Show } from "solid-js";
import ChronicleLore from "./chronicle/ChronicleLore";
import ChronicleCharacters from "./chronicle/ChronicleCharacters";
import ChronicleBestiary from "./chronicle/ChronicleBestiary";

type Tab = "lore" | "characters" | "bestiary";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "lore", label: "Lore", icon: "📖" },
  { id: "characters", label: "Characters", icon: "👥" },
  { id: "bestiary", label: "Bestiary", icon: "🐉" },
];

export default function Chronicle() {
  const [tab, setTab] = createSignal<Tab>("lore");

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
          return (
            <button
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 16px",
                background: active() ? "var(--bg-secondary)" : "transparent",
                border: "none",
                "border-bottom": active() ? "2px solid var(--accent-gold)" : "2px solid transparent",
                color: active() ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                "font-family": "var(--font-heading)",
                "font-size": "0.95rem",
                "margin-bottom": "-1px",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      <Show when={tab() === "lore"}>
        <ChronicleLore />
      </Show>
      <Show when={tab() === "characters"}>
        <ChronicleCharacters />
      </Show>
      <Show when={tab() === "bestiary"}>
        <ChronicleBestiary />
      </Show>
    </div>
  );
}
