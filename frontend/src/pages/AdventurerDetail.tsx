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
  getOrigin,
  RACE_NAMES,
  BACKSTORY_TRAITS,
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

// Character doll layout — body shape with weapons to the side
const GEAR_GRID = [
  //         left        center      right
  /* row1 */ [null,       "head",     null],
  /* row2 */ ["cloak",    "amulet",   null],
  /* row3 */ ["ring1",    "chest",    "ring2"],
  /* row4 */ [null,       "legs",     null],
  /* row5 */ [null,       "boots",    null],
];

// Weapons & trinket shown separately
const SIDE_SLOTS = [
  { id: "mainHand", name: "Main Hand", icon: "⚔️" },
  { id: "offHand", name: "Off Hand", icon: "🛡️" },
  { id: "trinket", name: "Trinket", icon: "🔮" },
];

const SLOT_NAMES: Record<string, string> = {
  head: "Head", chest: "Chest", legs: "Legs", boots: "Boots", cloak: "Cloak",
  mainHand: "Main Hand", offHand: "Off Hand", ring1: "Ring", ring2: "Ring",
  amulet: "Amulet", trinket: "Trinket",
};

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
              {/* Hero Section — large portrait + info */}
              {(() => {
                const traitDef = () => BACKSTORY_TRAITS.find((t) => t.id === adv().trait);
                return (
                  <div style={{
                    display: "flex",
                    gap: "24px",
                    "margin-bottom": "24px",
                    background: "var(--bg-secondary)",
                    "border-radius": "12px",
                    overflow: "hidden",
                    border: `1px solid ${RANK_COLORS[adv().rank]}33`,
                  }}>
                    {/* Large Portrait */}
                    <div style={{
                      width: "280px",
                      "min-height": "340px",
                      "flex-shrink": "0",
                      overflow: "hidden",
                      position: "relative",
                    }}>
                      <img
                        src={getPortrait(adv().name, adv().class)}
                        alt={adv().name}
                        style={{
                          width: "100%",
                          height: "100%",
                          "object-fit": "cover",
                          "object-position": "top",
                          display: "block",
                        }}
                      />
                      {/* Gradient fade on right edge */}
                      <div style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: "60px",
                        background: "linear-gradient(to right, transparent, var(--bg-secondary))",
                      }} />
                    </div>

                    {/* Info Panel */}
                    <div style={{
                      flex: 1,
                      padding: "24px 24px 24px 0",
                      display: "flex",
                      "flex-direction": "column",
                      gap: "16px",
                    }}>
                      {/* Name & Class */}
                      <div>
                        <h1 class="page-title" style={{ "margin-bottom": "4px", "font-size": "1.5rem" }}>{adv().name}</h1>
                        <div style={{ "font-size": "1rem", color: "var(--text-secondary)" }}>
                          {adv().race ? RACE_NAMES[adv().race] : ""} {cls().name} ·{" "}
                          <span style={{ color: RANK_COLORS[adv().rank], "font-weight": "bold" }}>
                            {RANK_NAMES[adv().rank]}
                          </span>
                          {" "}· Level {adv().level}
                        </div>
                        <Show when={adv().origin}>
                          <div style={{ "font-size": "0.85rem", color: "var(--text-muted)", "margin-top": "2px" }}>
                            {getOrigin(adv().origin)?.name} — {getOrigin(adv().origin)?.region}
                          </div>
                        </Show>
                      </div>

                      {/* Trait Badge */}
                      <Show when={traitDef()}>
                        <div>
                          <div style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            "border-radius": "5px",
                            background: "rgba(167, 139, 250, 0.1)",
                            border: "1px solid rgba(167, 139, 250, 0.25)",
                            "font-size": "0.85rem",
                          }}>
                            <span style={{ color: "#a78bfa", "font-weight": "bold" }}>{traitDef()!.name}</span>
                            <span style={{ color: "var(--text-secondary)", "margin-left": "8px" }}>{traitDef()!.description}</span>
                          </div>
                          <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "3px", "font-style": "italic" }}>
                            "{traitDef()!.flavor}"
                          </div>
                        </div>
                      </Show>

                      {/* Backstory */}
                      <Show when={adv().backstory}>
                        <div style={{
                          "font-size": "0.9rem",
                          color: "var(--text-secondary)",
                          "font-style": "italic",
                          "line-height": "1.5",
                          "padding-left": "12px",
                          "border-left": "2px solid var(--border-color)",
                        }}>
                          "{adv().backstory}"
                        </div>
                      </Show>

                      {/* Quirk */}
                      <Show when={adv().quirk}>
                        <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>
                          {adv().quirk}
                        </div>
                      </Show>

                      {/* Class Passive — pinned to bottom */}
                      <div style={{
                        "margin-top": "auto",
                        padding: "8px 12px",
                        background: "var(--bg-primary)",
                        "border-radius": "6px",
                      }}>
                        <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-bottom": "2px" }}>
                          Class Passive
                        </div>
                        <div style={{ "font-size": "0.85rem" }}>
                          <strong style={{ color: "var(--text-primary)" }}>{cls().passive.name}</strong>
                          <span style={{ color: "var(--text-secondary)", "margin-left": "8px" }}>{cls().passive.description}</span>
                        </div>
                      </div>

                      {adv().onMission && (
                        <div style={{
                          padding: "6px 12px",
                          "border-radius": "6px",
                          background: "rgba(52, 152, 219, 0.15)",
                          border: "1px solid var(--accent-blue)",
                          color: "var(--accent-blue)",
                          "font-size": "0.85rem",
                          "text-align": "center",
                        }}>
                          Currently on a mission
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div class="overview-grid">
                {/* Stats */}
                <div class="overview-panel">
                  <h2>Stats</h2>
                  {/* XP Bar */}
                  <div style={{ "margin-bottom": "12px" }}>
                    <div style={{ display: "flex", "justify-content": "space-between", "font-size": "0.8rem", "margin-bottom": "4px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Experience</span>
                      <span style={{ color: "var(--text-muted)" }}>{adv().xp} / {xpNeeded()} XP</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--bg-primary)", "border-radius": "3px" }}>
                      <div style={{
                        height: "100%",
                        width: `${xpPct()}%`,
                        background: "var(--accent-blue)",
                        "border-radius": "3px",
                        transition: "width 0.3s",
                      }} />
                    </div>
                  </div>
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
                  {(() => {
                    const renderSlot = (slotId: string) => {
                      const slotDef = EQUIPMENT_SLOTS.find((s) => s.id === slotId) ?? SIDE_SLOTS.find((s) => s.id === slotId);
                      if (!slotDef) return null;
                      const equippedId = () => adv().equipment[slotId as ItemSlot];
                      const equippedItem = () => equippedId() ? getItem(equippedId()!) : null;
                      const availableItems = () => getItemsForSlot(slotId as ItemSlot, adv().class)
                        .filter((item) => actions.getInventoryCount(item.id) > 0 && !isSupplyItem(item.id));

                      return (
                        <div
                          class="gear-slot"
                          classList={{ equipped: !!equippedItem(), "has-sprite": !!equippedItem()?.image }}
                          title={equippedItem() ? `${equippedItem()!.name}\n${equippedItem()!.description}` : `${slotDef.name} — empty`}
                        >
                          <Show when={equippedItem()?.image}>
                            <img src={equippedItem()!.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", "object-fit": "cover", "border-radius": "3px", "z-index": 1 }} />
                          </Show>
                          <div class="gear-slot-icon" style={{ "z-index": equippedItem()?.image ? 0 : 1 }}>
                            <Show when={!equippedItem()?.image}>
                              {equippedItem()?.icon ?? slotDef.icon}
                            </Show>
                          </div>
                          <div class="gear-slot-label">
                            {equippedItem()?.name ?? slotDef.name}
                          </div>
                          <Show when={equippedItem()}>
                            <div class="gear-slot-stats">{equippedItem()!.description}</div>
                          </Show>
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
                    };

                    return (
                      <div class="gear-layout">
                        {/* Body doll */}
                        <div class="gear-doll">
                          {GEAR_GRID.map((row) => (
                            <div class="gear-doll-row">
                              {row.map((slotId) =>
                                slotId ? renderSlot(slotId) : <div class="gear-slot-empty-space" />
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Weapons & trinket */}
                        <div class="gear-side">
                          <div class="gear-side-label">Weapons</div>
                          {SIDE_SLOTS.map((s) => renderSlot(s.id))}
                        </div>

                        {/* Inventory — available gear */}
                        <Show when={!adv().onMission}>
                          <div class="gear-inventory">
                            <div class="gear-side-label">Inventory</div>
                            <div class="gear-inventory-cards">
                              {(() => {
                                const items = state.inventory
                                  .filter((inv) => inv.quantity > 0 && !isSupplyItem(inv.itemId))
                                  .map((inv) => ({ item: getItem(inv.itemId)!, qty: inv.quantity }))
                                  .filter((x) => x.item);
                                if (items.length === 0) return (
                                  <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "font-style": "italic", padding: "8px" }}>
                                    No gear in inventory. Craft some at your workshops.
                                  </div>
                                );
                                return items.map(({ item, qty }) => {
                                  const canEquip = () => {
                                    if (item.classes.length > 0 && !item.classes.includes(adv().class)) return false;
                                    return true;
                                  };
                                  const slotLabel = SLOT_NAMES[item.slot] ?? item.slot;
                                  const handedness = item.twoHanded ? "2H" : (item.slot === "mainHand" || item.slot === "offHand") ? "1H" : null;
                                  return (
                                    <div
                                      class="gear-inv-card"
                                      classList={{ "can-equip": canEquip(), "wrong-class": !canEquip() }}
                                      onClick={() => { if (canEquip()) actions.equipItem(params.id, item.id); }}
                                    >
                                      <div class="gear-inv-card-header">
                                        <span class="gear-inv-card-icon">{item.icon}</span>
                                        <div style={{ flex: 1, "min-width": 0 }}>
                                          <div class="gear-inv-card-name">
                                            {item.name}
                                            <Show when={qty > 1}>
                                              <span class="gear-inv-card-qty">x{qty}</span>
                                            </Show>
                                          </div>
                                          <div class="gear-inv-card-slot">
                                            {slotLabel}{handedness ? ` (${handedness})` : ""}
                                            {item.consumable ? " · consumable" : ""}
                                          </div>
                                        </div>
                                      </div>
                                      <div class="gear-inv-card-stats">{item.description}</div>
                                      <Show when={item.classes.length > 0}>
                                        <div class="gear-inv-card-classes">
                                          {item.classes.join(", ")}
                                        </div>
                                      </Show>
                                      <Show when={!canEquip()}>
                                        <div class="gear-inv-card-classes" style={{ color: "var(--accent-red)" }}>
                                          Wrong class
                                        </div>
                                      </Show>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </Show>
                      </div>
                    );
                  })()}
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
