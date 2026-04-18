import { createSignal, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { getUnlockedEntries, CATEGORY_INFO, type ChronicleEntry } from "~/data/chronicle";

type Category = ChronicleEntry["category"] | "all";

export default function ChronicleLore() {
  const { state } = useGame();
  const [filter, setFilter] = createSignal<Category>("all");
  const [expanded, setExpanded] = createSignal<string | null>(null);

  const entries = () => getUnlockedEntries(state.questRewardsClaimed ?? []);
  const filtered = () => {
    const f = filter();
    return f === "all" ? entries() : entries().filter((e) => e.category === f);
  };

  const categories = () => {
    const cats = new Set(entries().map((e) => e.category));
    return Object.entries(CATEGORY_INFO).filter(([key]) => cats.has(key as ChronicleEntry["category"]));
  };

  return (
    <div>
      <p style={{
        color: "var(--text-secondary)",
        "font-style": "italic",
        "margin-bottom": "20px",
        "font-size": "0.9rem",
      }}>
        Everything you've learned about the world, its history, and its people. New entries appear as you explore and complete quests.
      </p>

      {/* Category filters */}
      <div style={{ "margin-bottom": "20px", display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
        <button
          class="trade-filter-btn"
          classList={{ active: filter() === "all" }}
          onClick={() => setFilter("all")}
        >
          All ({entries().length})
        </button>
        <For each={categories()}>
          {([key, info]) => {
            const count = () => entries().filter((e) => e.category === key).length;
            return (
              <button
                class="trade-filter-btn"
                classList={{ active: filter() === key }}
                onClick={() => setFilter(key as Category)}
              >
                {info.icon} {info.label} ({count()})
              </button>
            );
          }}
        </For>
      </div>

      {/* Entries */}
      <div class="chronicle-entries">
        <For each={filtered()}>
          {(entry) => {
            const catInfo = CATEGORY_INFO[entry.category];
            const isExpanded = () => expanded() === entry.id;

            return (
              <div
                class="chronicle-entry"
                classList={{ expanded: isExpanded() }}
                onClick={() => setExpanded(isExpanded() ? null : entry.id)}
              >
                <div class="chronicle-entry-header">
                  <span class="chronicle-entry-cat" style={{ color: catInfo.color }}>
                    {catInfo.icon}
                  </span>
                  <div class="chronicle-entry-title">{entry.title}</div>
                  <span class="chronicle-entry-cat-label" style={{ color: catInfo.color }}>
                    {catInfo.label}
                  </span>
                </div>
                <Show when={isExpanded()}>
                  <div class="chronicle-entry-text">
                    {entry.text}
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      <Show when={filtered().length === 0}>
        <div style={{ color: "var(--text-muted)", "text-align": "center", padding: "40px" }}>
          No entries yet in this category. Keep exploring!
        </div>
      </Show>
    </div>
  );
}
