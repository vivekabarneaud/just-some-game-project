import { A, useParams } from "@solidjs/router";
import { For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import {
  getClassMeta,
  RANK_NAMES,
  RANK_COLORS,
  getXpForLevel,
  calcStats,
  getUnspentStatPoints,
  STAT_META,
  type AdventurerRank,
  type AdventurerClass,
  type AdventurerStats,
  getPortrait,
} from "~/data/adventurers";
import { getItem, getItemsForSlot, getEquipmentStats, ITEMS, type ItemSlot, isSupplyItem } from "~/data/items";

// ─── Equipment slot types ───────────────────────────────────────

const EQUIPMENT_SLOTS = [
  { id: "head", name: "Head", icon: "🪖" },
  { id: "chest", name: "Chest", icon: "🦺" },
  { id: "legs", name: "Legs", icon: "👖" },
  { id: "boots", name: "Boots", icon: "🥾" },
  { id: "cloak", name: "Cloak", icon: "🧣" },
  { id: "mainHand", name: "Main Hand", icon: "⚔️" },
  { id: "offHand", name: "Off Hand", icon: "🛡️" },
  { id: "ring1", name: "Ring", icon: "💍" },
  { id: "ring2", name: "Ring", icon: "💍" },
  { id: "amulet", name: "Amulet", icon: "📿" },
  { id: "trinket", name: "Trinket", icon: "🔮" },
];

// Character doll layout positions
const GEAR_GRID = [
  //         left        center      right
  /* row1 */ [null,       "head",     null],
  /* row2 */ ["cloak",    "chest",    "offHand"],
  /* row3 */ ["ring1",    "legs",     "mainHand"],
  /* row4 */ ["ring2",    "boots",    "trinket"],
  /* row5 */ [null,       "amulet",   null],
];

export default function AdventurerDetail() {
  const params = useParams<{ id: string }>();
  const { state, actions } = useGame();

  const adventurer = () => state.adventurers.find((a) => a.id === params.id);

  return (
    <div>
      <A href="/guild?tab=roster" class="back-link" onClick={() => actions.visitGuild()}>
        ← Back to Roster
      </A>

      <Show when={adventurer()} fallback={<p>Adventurer not found.</p>}>
        {(adv) => {
          const cls = () => getClassMeta(adv().class);
          const equipStats = () => getEquipmentStats(adv().equipment);
          const stats = () => calcStats(adv(), equipStats());
          const unspentPoints = () => getUnspentStatPoints(adv());
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
                  width: "80px",
                  height: "80px",
                  "border-radius": "12px",
                  overflow: "hidden",
                  border: `2px solid ${RANK_COLORS[adv().rank]}`,
                  "flex-shrink": "0",
                }}>
                  <img
                    src={getPortrait(adv().name, adv().class)}
                    alt={adv().name}
                    style={{ width: "100%", height: "100%", "object-fit": "cover", "object-position": "top" }}
                  />
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
                  <Show when={unspentPoints() > 0}>
                    <div style={{
                      padding: "6px 10px",
                      "margin-bottom": "10px",
                      "border-radius": "6px",
                      background: "rgba(46, 204, 113, 0.1)",
                      border: "1px solid var(--accent-green)",
                      "font-size": "0.85rem",
                      color: "var(--accent-green)",
                    }}>
                      {unspentPoints()} stat point{unspentPoints() > 1 ? "s" : ""} to allocate!
                    </div>
                  </Show>
                  {STAT_META.map((stat) => {
                    const val = () => stats()[stat.key];
                    const maxStat = 30;
                    const pct = () => Math.min(100, (val() / maxStat) * 100);
                    const bonus = () => adv().bonusStats[stat.key] ?? 0;
                    return (
                      <div style={{ "margin-bottom": "10px" }}>
                        <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "font-size": "0.85rem", "margin-bottom": "3px" }}>
                          <span style={{ color: "var(--text-secondary)" }} title={stat.description}>
                            {stat.icon} {stat.name}
                          </span>
                          <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                            <span style={{ color: stat.color, "font-weight": "bold" }}>
                              {val()}
                              {bonus() > 0 && <span style={{ "font-size": "0.7rem", color: "var(--accent-green)" }}> (+{bonus()})</span>}
                            </span>
                            <Show when={unspentPoints() > 0 && !adv().onMission}>
                              <button
                                onClick={() => actions.allocateStat(params.id, stat.key)}
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  padding: 0,
                                  background: "rgba(46, 204, 113, 0.2)",
                                  border: "1px solid var(--accent-green)",
                                  color: "var(--accent-green)",
                                  "border-radius": "4px",
                                  cursor: "pointer",
                                  "font-size": "0.75rem",
                                  "line-height": "1",
                                }}
                              >
                                +
                              </button>
                            </Show>
                          </div>
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
                        <div style={{ "font-size": "0.65rem", color: "var(--text-muted)", "margin-top": "1px" }}>
                          {stat.description}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Equipment — Character Doll */}
                <div class="overview-panel">
                  <h2>Equipment</h2>
                  <div class="gear-doll">
                    {GEAR_GRID.map((row) => (
                      <div class="gear-doll-row">
                        {row.map((slotId) => {
                          if (!slotId) return <div class="gear-slot-empty-space" />;
                          const slotDef = EQUIPMENT_SLOTS.find((s) => s.id === slotId)!;
                          const equippedId = () => adv().equipment[slotId as ItemSlot];
                          const equippedItem = () => equippedId() ? getItem(equippedId()!) : null;
                          const availableItems = () => getItemsForSlot(slotId as ItemSlot, adv().class)
                            .filter((item) => actions.getInventoryCount(item.id) > 0 && !isSupplyItem(item.id));

                          return (
                            <div
                              class="gear-slot"
                              classList={{ equipped: !!equippedItem() }}
                              title={equippedItem() ? `${equippedItem()!.name}\n${equippedItem()!.description}` : `${slotDef.name} — empty`}
                            >
                              <div class="gear-slot-icon">
                                {equippedItem()?.icon ?? slotDef.icon}
                              </div>
                              <div class="gear-slot-label">
                                {equippedItem()?.name ?? slotDef.name}
                              </div>
                              <Show when={equippedItem()}>
                                <div class="gear-slot-stats">{equippedItem()!.description}</div>
                              </Show>
                              {/* Actions */}
                              <Show when={!adv().onMission}>
                                <Show when={equippedItem()}>
                                  <button
                                    class="gear-slot-action unequip"
                                    onClick={() => actions.unequipItem(params.id, slotId as ItemSlot)}
                                  >×</button>
                                </Show>
                                <Show when={!equippedItem() && availableItems().length > 0}>
                                  <div class="gear-slot-options">
                                    <For each={availableItems()}>
                                      {(item) => (
                                        <button
                                          class="gear-slot-option"
                                          onClick={() => actions.equipItem(params.id, item.id)}
                                          title={`${item.name}: ${item.description}`}
                                        >
                                          {item.icon}
                                        </button>
                                      )}
                                    </For>
                                  </div>
                                </Show>
                              </Show>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <Show when={adv().onMission}>
                    <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-top": "8px", "text-align": "center" }}>
                      Cannot change equipment while on a mission.
                    </div>
                  </Show>
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
