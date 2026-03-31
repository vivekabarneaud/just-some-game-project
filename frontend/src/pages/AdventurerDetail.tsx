import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import {
  getClassMeta,
  RANK_NAMES,
  RANK_COLORS,
  getXpForLevel,
  type AdventurerRank,
  type AdventurerClass,
} from "~/data/adventurers";

// ─── Stats derived from class + level ───────────────────────────

interface Stats {
  str: number;
  int: number;
  dex: number;
  vit: number;
}

const CLASS_BASE_STATS: Record<AdventurerClass, Stats> = {
  warrior: { str: 12, int: 4, dex: 6, vit: 10 },
  wizard: { str: 4, int: 14, dex: 5, vit: 5 },
  priest: { str: 5, int: 10, dex: 4, vit: 9 },
  archer: { str: 6, int: 5, dex: 14, vit: 6 },
  assassin: { str: 8, int: 6, dex: 12, vit: 5 },
};

const CLASS_STAT_GROWTH: Record<AdventurerClass, Stats> = {
  warrior: { str: 3, int: 0.5, dex: 1, vit: 2.5 },
  wizard: { str: 0.5, int: 3.5, dex: 0.5, vit: 1 },
  priest: { str: 0.5, int: 2.5, dex: 0.5, vit: 2 },
  archer: { str: 1, int: 1, dex: 3, vit: 1.5 },
  assassin: { str: 2, int: 1, dex: 3, vit: 1 },
};

function calcStats(cls: AdventurerClass, level: number): Stats {
  const base = CLASS_BASE_STATS[cls];
  const growth = CLASS_STAT_GROWTH[cls];
  return {
    str: Math.floor(base.str + growth.str * (level - 1)),
    int: Math.floor(base.int + growth.int * (level - 1)),
    dex: Math.floor(base.dex + growth.dex * (level - 1)),
    vit: Math.floor(base.vit + growth.vit * (level - 1)),
  };
}

const STAT_META: { key: keyof Stats; name: string; icon: string; color: string }[] = [
  { key: "str", name: "Strength", icon: "💪", color: "#e74c3c" },
  { key: "int", name: "Intelligence", icon: "🧠", color: "#3498db" },
  { key: "dex", name: "Dexterity", icon: "🏃", color: "#2ecc71" },
  { key: "vit", name: "Vitality", icon: "❤️", color: "#e67e22" },
];

// ─── Equipment slot types ───────────────────────────────────────

const EQUIPMENT_SLOTS = [
  { id: "weapon", name: "Weapon", icon: "⚔️" },
  { id: "armor", name: "Armor", icon: "🛡️" },
  { id: "trinket", name: "Trinket", icon: "💍" },
];

export default function AdventurerDetail() {
  const params = useParams<{ id: string }>();
  const { state } = useGame();

  const adventurer = () => state.adventurers.find((a) => a.id === params.id);

  return (
    <div>
      <A href="/guild" class="back-link">
        ← Back to Guild
      </A>

      <Show when={adventurer()} fallback={<p>Adventurer not found.</p>}>
        {(adv) => {
          const cls = () => getClassMeta(adv().class);
          const stats = () => calcStats(adv().class, adv().level);
          const xpNeeded = () => getXpForLevel(adv().level);
          const xpPct = () => Math.min(100, (adv().xp / xpNeeded()) * 100);

          return (
            <div>
              {/* Header */}
              <div style={{
                display: "flex",
                gap: "16px",
                "align-items": "center",
                "margin-bottom": "20px",
              }}>
                <div style={{
                  "font-size": "3rem",
                  width: "64px",
                  height: "64px",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  background: "var(--bg-secondary)",
                  "border-radius": "12px",
                  border: `2px solid ${RANK_COLORS[adv().rank]}`,
                }}>
                  {cls().icon}
                </div>
                <div>
                  <h1 class="page-title" style={{ "margin-bottom": "2px" }}>{adv().name}</h1>
                  <div style={{ "font-size": "0.9rem", color: "var(--text-secondary)" }}>
                    {cls().name} ·{" "}
                    <span style={{ color: RANK_COLORS[adv().rank] }}>
                      {RANK_NAMES[adv().rank]}
                    </span>
                    {" "}· Level {adv().level}
                  </div>
                  {adv().onMission && (
                    <div style={{ "font-size": "0.85rem", color: "var(--accent-blue)", "margin-top": "4px" }}>
                      Currently on a mission
                    </div>
                  )}
                </div>
              </div>

              {/* XP Bar */}
              <div style={{
                "margin-bottom": "20px",
                padding: "12px",
                background: "var(--bg-secondary)",
                "border-radius": "8px",
              }}>
                <div style={{ display: "flex", "justify-content": "space-between", "font-size": "0.85rem", "margin-bottom": "6px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Experience</span>
                  <span style={{ color: "var(--text-muted)" }}>{adv().xp} / {xpNeeded()} XP</span>
                </div>
                <div style={{ height: "8px", background: "var(--bg-primary)", "border-radius": "4px" }}>
                  <div style={{
                    height: "100%",
                    width: `${xpPct()}%`,
                    background: "var(--accent-blue)",
                    "border-radius": "4px",
                    transition: "width 0.3s",
                  }} />
                </div>
              </div>

              {/* Class Passive */}
              <div style={{
                "margin-bottom": "20px",
                padding: "12px",
                background: "var(--bg-secondary)",
                "border-radius": "8px",
              }}>
                <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "4px" }}>
                  Class Passive
                </div>
                <div style={{ "font-size": "0.95rem", color: "var(--text-primary)" }}>
                  <strong>{cls().passive.name}</strong>
                </div>
                <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-top": "2px" }}>
                  {cls().passive.description}
                </div>
              </div>

              <div class="overview-grid">
                {/* Stats */}
                <div class="overview-panel">
                  <h2>Stats</h2>
                  {STAT_META.map((stat) => {
                    const val = () => stats()[stat.key];
                    const maxStat = 50;
                    const pct = () => Math.min(100, (val() / maxStat) * 100);
                    return (
                      <div style={{ "margin-bottom": "10px" }}>
                        <div style={{ display: "flex", "justify-content": "space-between", "font-size": "0.85rem", "margin-bottom": "3px" }}>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {stat.icon} {stat.name}
                          </span>
                          <span style={{ color: stat.color, "font-weight": "bold" }}>{val()}</span>
                        </div>
                        <div style={{ height: "6px", background: "var(--bg-primary)", "border-radius": "3px" }}>
                          <div style={{
                            height: "100%",
                            width: `${pct()}%`,
                            background: stat.color,
                            "border-radius": "3px",
                            transition: "width 0.3s",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "8px" }}>
                    Stats increase with each level. Future updates will allow stat customization via talents.
                  </div>
                </div>

                {/* Equipment */}
                <div class="overview-panel">
                  <h2>Equipment</h2>
                  {EQUIPMENT_SLOTS.map((slot) => (
                    <div style={{
                      display: "flex",
                      "align-items": "center",
                      gap: "10px",
                      padding: "10px",
                      "margin-bottom": "8px",
                      background: "var(--bg-primary)",
                      "border-radius": "6px",
                      border: "1px dashed var(--border-default)",
                      opacity: 0.5,
                    }}>
                      <span style={{ "font-size": "1.4rem" }}>{slot.icon}</span>
                      <div>
                        <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>{slot.name}</div>
                        <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "font-style": "italic" }}>Empty slot</div>
                      </div>
                    </div>
                  ))}
                  <div style={{
                    padding: "10px",
                    "text-align": "center",
                    "border-radius": "6px",
                    background: "rgba(167, 139, 250, 0.08)",
                    border: "1px solid rgba(167, 139, 250, 0.2)",
                    color: "#a78bfa",
                    "font-size": "0.8rem",
                  }}>
                    Equipment crafting coming soon — Blacksmith required
                  </div>
                </div>

                {/* Talent Tree */}
                <div class="overview-panel">
                  <h2>Talents</h2>
                  <div style={{
                    display: "grid",
                    "grid-template-columns": "repeat(3, 1fr)",
                    gap: "8px",
                    "margin-bottom": "12px",
                  }}>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div style={{
                        "aspect-ratio": "1",
                        background: "var(--bg-primary)",
                        "border-radius": "8px",
                        border: "1px dashed var(--border-default)",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                        opacity: 0.3,
                        "font-size": "1.2rem",
                        color: "var(--text-muted)",
                      }}>
                        {i === 4 ? cls().icon : "?"}
                      </div>
                    ))}
                  </div>
                  <div style={{
                    padding: "10px",
                    "text-align": "center",
                    "border-radius": "6px",
                    background: "rgba(167, 139, 250, 0.08)",
                    border: "1px solid rgba(167, 139, 250, 0.2)",
                    color: "#a78bfa",
                    "font-size": "0.8rem",
                  }}>
                    Talent tree under construction — Unlock unique abilities as your adventurer grows
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      </Show>
    </div>
  );
}
