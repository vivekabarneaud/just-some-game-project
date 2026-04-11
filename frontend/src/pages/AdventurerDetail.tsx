import { A, useParams, useNavigate } from "@solidjs/router";
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
import { getItem, getItemsForSlot, getEquipmentStats, isSupplyItem, type ItemSlot } from "~/data/items";
import { getTalentsForClass, getTalentPoints, getUnspentTalentPoints, canUnlockTalent, getEarnedTitle, getTalent, type TalentNode } from "~/data/talents";
import Tooltip from "~/components/Tooltip";
import TraitBadge from "~/components/TraitBadge";

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
                        src={getPortrait(adv().name, adv().class, adv().origin)}
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

                      {/* Backstory & Quirk — grouped tighter */}
                      <Show when={adv().backstory || adv().quirk}>
                        <div style={{ display: "flex", "flex-direction": "column", gap: "4px" }}>
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
                          <Show when={adv().quirk}>
                            <div style={{ "font-size": "0.85rem", color: "var(--text-muted)", "padding-left": "12px" }}>
                              {adv().quirk}
                            </div>
                          </Show>
                        </div>
                      </Show>

                      {/* Trait Badge — pinned to bottom */}
                      <Show when={traitDef()}>
                        <div style={{ "margin-top": "auto" }}>
                          <TraitBadge traitId={adv().trait} />
                          <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "3px", "font-style": "italic" }}>
                            "{traitDef()!.flavor}"
                          </div>
                        </div>
                      </Show>

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
                <div class="overview-panel" style={{ padding: "20px 32px" }}>
                  <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "12px" }}>
                    <h2 style={{ margin: 0 }}>Talents</h2>
                    <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
                      <Show when={getEarnedTitle(adv())}>
                        <span style={{ color: "var(--accent-gold)", "font-style": "italic", "font-size": "0.85rem" }}>
                          "{getEarnedTitle(adv())}"
                        </span>
                      </Show>
                      <span style={{ "font-size": "0.85rem", color: getUnspentTalentPoints(adv()) > 0 ? "var(--accent-green)" : "var(--text-muted)" }}>
                        {getUnspentTalentPoints(adv())} / {getTalentPoints(adv().level)} points
                      </span>
                    </div>
                  </div>

                  <Show when={adv().onMission}>
                    <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "8px", "font-style": "italic" }}>
                      Cannot change talents while on a mission.
                    </div>
                  </Show>

                  {(() => {
                    const allTalents = () => getTalentsForClass(adv().class);
                    const maxRow = () => Math.max(...allTalents().map((t) => t.row));
                    const rows = () => {
                      const r: TalentNode[][] = [];
                      for (let i = 0; i <= maxRow(); i++) {
                        r.push(allTalents().filter((t) => t.row === i));
                      }
                      return r;
                    };

                    const getNodeState = (id: string) => {
                      if (adv().talents?.includes(id)) return "unlocked";
                      if (!adv().onMission && canUnlockTalent(adv(), id)) return "available";
                      return "locked";
                    };

                    // Build parent→child connections for SVG lines
                    const connections = () => {
                      const conns: { parentId: string; childId: string; unlocked: boolean }[] = [];
                      for (const t of allTalents()) {
                        for (const childId of t.children) {
                          conns.push({ parentId: t.id, childId, unlocked: adv().talents?.includes(t.id) ?? false });
                        }
                      }
                      return conns;
                    };

                    // Node positions: computed per row, centered
                    const NODE_W = 64;
                    const NODE_H = 64;
                    const ROW_GAP = 24;
                    const COL_GAP = 24;

                    const nodePositions = () => {
                      const pos: Record<string, { x: number; y: number }> = {};
                      const rs = rows();
                      const maxNodesInRow = Math.max(...rs.map((r) => r.length));
                      const totalW = maxNodesInRow * NODE_W + (maxNodesInRow - 1) * COL_GAP;
                      for (let ri = 0; ri < rs.length; ri++) {
                        const row = rs[ri];
                        const rowW = row.length * NODE_W + (row.length - 1) * COL_GAP;
                        const offsetX = (totalW - rowW) / 2;
                        for (let ci = 0; ci < row.length; ci++) {
                          pos[row[ci].id] = {
                            x: offsetX + ci * (NODE_W + COL_GAP),
                            y: ri * (NODE_H + ROW_GAP),
                          };
                        }
                      }
                      return pos;
                    };

                    const totalHeight = () => (maxRow() + 1) * (NODE_H + ROW_GAP) - ROW_GAP;
                    const rs = () => rows();
                    const maxNodesInRow = () => Math.max(...rs().map((r) => r.length));
                    const totalWidth = () => maxNodesInRow() * NODE_W + (maxNodesInRow() - 1) * COL_GAP;

                    const pathInfo: Record<string, { labels: [string, string, string]; leftColor: string; rightColor: string }> = {
                      warrior:  { labels: ["Paladin", "Warlord", "Shadowblade"],       leftColor: "#3498db", rightColor: "#f5c542" },
                      priest:   { labels: ["Paladin", "Archpriest", "Inquisitor"],     leftColor: "#e74c3c", rightColor: "#9b59b6" },
                      wizard:   { labels: ["Primalist", "Archmage", "Inquisitor"],     leftColor: "#2ecc71", rightColor: "#3498db" },
                      archer:   { labels: ["Primalist", "Sharpshooter", "Hunter"],     leftColor: "#9b59b6", rightColor: "#f5c542" },
                      assassin: { labels: ["Hunter", "Shadowmaster", "Shadowblade"],   leftColor: "#2ecc71", rightColor: "#e74c3c" },
                    };
                    const pInfo = pathInfo[adv().class] ?? pathInfo.warrior;
                    const [leftLabel, centerLabel, rightLabel] = pInfo.labels;
                    const lc = pInfo.leftColor;
                    const rc = pInfo.rightColor;

                    return (
                      <div>
                        <div style={{ display: "flex", "justify-content": "space-between", "margin": "0 auto 8px", width: `${totalWidth() + 64}px`, "font-size": "0.6rem", "text-transform": "uppercase", "letter-spacing": "1px" }}>
                          <span style={{ color: lc, opacity: "0.6" }}>{leftLabel}</span>
                          <span style={{ color: "var(--text-muted)", opacity: "0.4" }}>{centerLabel}</span>
                          <span style={{ color: rc, opacity: "0.6" }}>{rightLabel}</span>
                        </div>
                      <div style={{
                        position: "relative", height: `${totalHeight() + 16}px`, "margin": "0 auto", width: `${totalWidth() + 64}px`,
                        background: `linear-gradient(to right, ${lc}1F 0%, transparent 30%, transparent 70%, ${rc}1F 100%)`,
                        "border-radius": "8px",
                      }}>
                        {/* SVG connection lines */}
                        <svg style={{
                          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                          "pointer-events": "none", "z-index": 0,
                        }}>
                          <For each={connections()}>
                            {(conn) => {
                              const pos = nodePositions();
                              const from = pos[conn.parentId];
                              const to = pos[conn.childId];
                              if (!from || !to) return null;
                              return (
                                <line
                                  x1={from.x + NODE_W / 2 + 32} y1={from.y + NODE_H + 8}
                                  x2={to.x + NODE_W / 2 + 32} y2={to.y + 8}
                                  stroke={conn.unlocked ? "rgba(245, 197, 66, 0.6)" : "rgba(255, 255, 255, 0.1)"}
                                  stroke-width={conn.unlocked ? "2" : "1"}
                                  stroke-dasharray={conn.unlocked ? "" : "4 4"}
                                />
                              );
                            }}
                          </For>
                        </svg>

                        {/* Talent nodes */}
                        <For each={allTalents()}>
                          {(talent) => {
                            const st = () => getNodeState(talent.id);
                            const pos = () => nodePositions()[talent.id];
                            return (
                              <Tooltip content={
                                <div style={{ "min-width": "140px" }}>
                                  <div style={{ "font-weight": "bold", color: "var(--text-primary)" }}>{talent.icon} {talent.name}</div>
                                  <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "margin-top": "4px" }}>{talent.description}</div>
                                  <Show when={talent.isCapstone}>
                                    <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)", "margin-top": "4px" }}>Capstone — Earns title: {talent.title}</div>
                                  </Show>
                                </div>
                              } position="right">
                                <div
                                  class="talent-node"
                                  classList={{
                                    locked: st() === "locked",
                                    available: st() === "available",
                                    unlocked: st() === "unlocked",
                                    capstone: !!talent.isCapstone,
                                  }}
                                  style={{
                                    position: "absolute",
                                    left: `${(pos()?.x ?? 0) + 32}px`,
                                    top: `${(pos()?.y ?? 0) + 8}px`,
                                    width: `${NODE_W}px`,
                                    height: `${NODE_H}px`,
                                  }}
                                  onClick={() => {
                                    if (st() === "available") {
                                      actions.unlockTalent(params.id, talent.id);
                                    }
                                  }}
                                >
                                  <span style={{ "font-size": "1.3rem" }}>{talent.icon}</span>
                                  <span style={{
                                    "font-size": "0.55rem",
                                    color: st() === "unlocked" ? "var(--text-primary)" : st() === "available" ? "var(--accent-gold)" : "var(--text-muted)",
                                    "text-align": "center",
                                    "line-height": "1.1",
                                    "margin-top": "2px",
                                  }}>
                                    {talent.name}
                                  </span>
                                  <Show when={st() === "unlocked"}>
                                    <div style={{ position: "absolute", top: "2px", right: "4px", "font-size": "0.55rem", color: "var(--accent-green)" }}>
                                      ✓
                                    </div>
                                  </Show>
                                </div>
                              </Tooltip>
                            );
                          }}
                        </For>
                      </div>
                      </div>
                    );
                  })()}

                  <Show when={adv().talents?.length > 0 && !adv().onMission}>
                    <button
                      onClick={() => {
                        if (confirm("Reset all talents? Points will be refunded.")) {
                          actions.resetTalents(params.id);
                        }
                      }}
                      style={{
                        "margin-top": "12px",
                        padding: "4px 12px",
                        background: "transparent",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-muted)",
                        "border-radius": "4px",
                        cursor: "pointer",
                        "font-size": "0.75rem",
                      }}
                    >
                      Reset Talents
                    </button>
                  </Show>
                </div>

                {/* Dismiss */}
                <Show when={!adv().onMission}>
                  <div style={{ "margin-top": "24px", "text-align": "right" }}>
                    <button
                      onClick={() => {
                        if (confirm(`Dismiss ${adv().name}? This cannot be undone.`)) {
                          actions.dismissAdventurer(params.id);
                          useNavigate()("/guild?tab=roster");
                        }
                      }}
                      style={{
                        padding: "6px 14px",
                        background: "none",
                        border: "1px solid rgba(231, 76, 60, 0.3)",
                        color: "var(--accent-red)",
                        "border-radius": "4px",
                        cursor: "pointer",
                        "font-size": "0.8rem",
                        opacity: "0.6",
                      }}
                    >
                      Dismiss Adventurer
                    </button>
                  </div>
                </Show>
              </div>
            </div>
          );
        }}
      </Show>
    </div>
  );
}
