import { createSignal, For, Show, createMemo } from "solid-js";
import { useGame } from "~/engine/gameState";
import { ENEMIES, type EnemyTag, type EnemyDefinition } from "@medieval-realm/shared/data/enemies";
import Tooltip from "~/components/Tooltip";

const TAG_FILTERS: { id: EnemyTag | "all"; label: string; icon: string }[] = [
  { id: "all",              label: "All",        icon: "🌐" },
  { id: "humanoid",         label: "Humanoid",   icon: "👤" },
  { id: "beast",            label: "Beast",      icon: "🐺" },
  { id: "undead",           label: "Undead",     icon: "💀" },
  { id: "ghost",            label: "Ghost",      icon: "👻" },
  { id: "demon",            label: "Demon",      icon: "😈" },
  { id: "divine",           label: "Divine",     icon: "✨" },
  { id: "dragon",           label: "Dragon",     icon: "🐉" },
  { id: "elemental_fire",   label: "Fire",       icon: "🔥" },
  { id: "elemental_water",  label: "Water",      icon: "💧" },
  { id: "elemental_earth",  label: "Earth",      icon: "🪨" },
  { id: "elemental_wind",   label: "Wind",       icon: "💨" },
  { id: "elemental_aether", label: "Aether",     icon: "🌌" },
  { id: "magical",          label: "Magical",    icon: "🔮" },
];

const TIER_LABELS: Record<number, string> = {
  1: "Tier 1 — Common Threats",
  2: "Tier 2 — Seasoned Foes",
  3: "Tier 3 — Dangerous",
  4: "Tier 4 — Deadly",
  5: "Tier 5 — Legendary",
};

export default function ChronicleBestiary() {
  const { state } = useGame();
  const [filterTag, setFilterTag] = createSignal<EnemyTag | "all">("all");
  const [showUndiscovered, setShowUndiscovered] = createSignal(true);

  const discovered = () => new Set(state.discoveredEnemies ?? []);

  const filtered = createMemo(() => {
    const tag = filterTag();
    const disc = discovered();
    return ENEMIES.filter((e) => {
      if (!showUndiscovered() && !disc.has(e.id)) return false;
      if (tag !== "all" && !e.tags.includes(tag)) return false;
      return true;
    });
  });

  const grouped = () => {
    const groups: Record<number, EnemyDefinition[]> = {};
    for (const e of filtered()) {
      if (!groups[e.tier]) groups[e.tier] = [];
      groups[e.tier].push(e);
    }
    return groups;
  };

  const totalCount = ENEMIES.length;
  const discoveredCount = () => ENEMIES.filter((e) => discovered().has(e.id)).length;

  const tagCount = (tag: EnemyTag | "all") => {
    if (tag === "all") return ENEMIES.length;
    return ENEMIES.filter((e) => e.tags.includes(tag)).length;
  };

  return (
    <div>
      <p style={{ color: "var(--text-muted)", "margin-bottom": "16px", "font-size": "0.85rem" }}>
        Creatures your scouts and adventurers have encountered. New entries appear as you discover them on missions.
      </p>

      {/* Counter + toggle */}
      <div style={{
        display: "flex", gap: "12px", "align-items": "center", "margin-bottom": "14px",
        "flex-wrap": "wrap",
      }}>
        <div style={{
          padding: "6px 12px",
          background: "rgba(167, 139, 250, 0.1)",
          border: "1px solid rgba(167, 139, 250, 0.3)",
          "border-radius": "6px",
          "font-size": "0.85rem",
          color: "var(--text-primary)",
        }}>
          <span style={{ color: "var(--accent-gold)", "font-weight": "bold" }}>{discoveredCount()}</span>
          <span style={{ color: "var(--text-muted)" }}> / {totalCount} discovered</span>
        </div>
        <label style={{
          display: "flex", "align-items": "center", gap: "6px",
          "font-size": "0.8rem", color: "var(--text-secondary)", cursor: "pointer",
        }}>
          <input
            type="checkbox"
            checked={showUndiscovered()}
            onChange={(e) => setShowUndiscovered(e.currentTarget.checked)}
            style={{ cursor: "pointer" }}
          />
          Show undiscovered silhouettes
        </label>
      </div>

      {/* Tag filters */}
      <div style={{ "margin-bottom": "20px", display: "flex", gap: "6px", "flex-wrap": "wrap" }}>
        <For each={TAG_FILTERS}>
          {(tf) => {
            const count = () => tagCount(tf.id);
            const discInTag = () => {
              if (tf.id === "all") return discoveredCount();
              return ENEMIES.filter((e) => e.tags.includes(tf.id as EnemyTag) && discovered().has(e.id)).length;
            };
            return (
              <Show when={count() > 0}>
                <button
                  class="trade-filter-btn"
                  classList={{ active: filterTag() === tf.id }}
                  onClick={() => setFilterTag(tf.id)}
                >
                  {tf.icon} {tf.label} ({discInTag()}/{count()})
                </button>
              </Show>
            );
          }}
        </For>
      </div>

      {/* Tiers */}
      <For each={[1, 2, 3, 4, 5]}>
        {(tier) => {
          const enemies = () => grouped()[tier] ?? [];
          return (
            <Show when={enemies().length > 0}>
              <div style={{ "margin-bottom": "28px" }}>
                <h2 style={{
                  "font-size": "1.05rem", color: "var(--accent-gold)", "margin-bottom": "12px",
                  "padding-bottom": "6px", "border-bottom": "1px solid var(--border-color)",
                }}>
                  {TIER_LABELS[tier]}
                  <span style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-left": "8px" }}>
                    ({enemies().filter((e) => discovered().has(e.id)).length}/{enemies().length})
                  </span>
                </h2>
                <div style={{
                  display: "grid",
                  "grid-template-columns": "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "12px",
                }}>
                  <For each={enemies()}>
                    {(enemy) => {
                      const isDiscovered = () => discovered().has(enemy.id);
                      return (
                        <div class="building-card" style={{ opacity: isDiscovered() ? 1 : 0.65 }}>
                          <Show when={enemy.boss}>
                            <span class="building-card-category" style={{ color: "var(--accent-gold)" }}>
                              ⭐ Boss
                            </span>
                          </Show>
                          {/* Portrait */}
                          <div style={{
                            position: "relative", width: "100%",
                            height: "140px", "border-radius": "6px", overflow: "hidden",
                            background: "rgba(0, 0, 0, 0.4)",
                            display: "flex", "align-items": "center", "justify-content": "center",
                            "margin-top": enemy.boss ? "4px" : "0",
                          }}>
                            <Show when={isDiscovered()} fallback={
                              <span style={{
                                "font-size": "3.5rem",
                                color: "rgba(200, 200, 210, 0.4)",
                                "text-shadow": "0 0 8px rgba(0,0,0,0.7)",
                              }}>?</span>
                            }>
                              {enemy.image
                                ? <img src={enemy.image} alt={enemy.name} loading="lazy" style={{
                                    width: "100%", height: "100%", "object-fit": "cover",
                                  }} />
                                : <span style={{ "font-size": "3rem" }}>{enemy.icon}</span>
                              }
                            </Show>
                          </div>

                          <div style={{ "margin-top": "8px" }}>
                            <div class="building-card-title" style={{
                              "font-style": isDiscovered() ? "normal" : "italic",
                              color: isDiscovered() ? "var(--text-primary)" : "var(--text-muted)",
                            }}>
                              {isDiscovered() ? enemy.name : "???"}
                            </div>

                            <Show when={isDiscovered()}>
                              <div style={{
                                "font-size": "0.7rem", color: "var(--text-muted)",
                                "margin-top": "2px",
                              }}>
                                {enemy.tags.map((t) => {
                                  const f = TAG_FILTERS.find((x) => x.id === t);
                                  return f ? `${f.icon} ${f.label}` : t;
                                }).join(" · ")}
                              </div>
                              <div style={{
                                display: "flex", gap: "10px", "margin-top": "6px",
                                "font-size": "0.75rem",
                              }}>
                                <span style={{ color: "var(--accent-red)" }}>❤ {enemy.stats.vit * 10} HP</span>
                                <span style={{ color: "var(--text-muted)" }}>STR {enemy.stats.str} · DEX {enemy.stats.dex}</span>
                              </div>
                              <div style={{
                                "margin-top": "6px", "font-size": "0.75rem",
                                color: "var(--text-secondary)", "line-height": "1.4",
                                "font-style": "italic",
                              }}>
                                {enemy.description}
                              </div>
                              <Show when={enemy.abilities?.length}>
                                <div style={{ "margin-top": "6px", display: "flex", gap: "4px", "flex-wrap": "wrap" }}>
                                  <For each={enemy.abilities}>
                                    {(ab) => (
                                      <Tooltip text={ab.name} position="top">
                                        <span style={{
                                          padding: "2px 6px",
                                          background: "rgba(231, 76, 60, 0.1)",
                                          border: "1px solid rgba(231, 76, 60, 0.3)",
                                          "border-radius": "4px",
                                          "font-size": "0.7rem",
                                          color: "var(--accent-red)",
                                        }}>
                                          {ab.icon} {ab.name}
                                        </span>
                                      </Tooltip>
                                    )}
                                  </For>
                                </div>
                              </Show>
                            </Show>
                            <Show when={!isDiscovered()}>
                              <div style={{
                                "font-size": "0.75rem", color: "var(--text-muted)",
                                "font-style": "italic", "margin-top": "4px",
                              }}>
                                Not yet encountered.
                              </div>
                            </Show>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>
            </Show>
          );
        }}
      </For>

      <Show when={filtered().length === 0}>
        <div style={{ color: "var(--text-muted)", "text-align": "center", padding: "40px" }}>
          No creatures match this filter.
        </div>
      </Show>
    </div>
  );
}
