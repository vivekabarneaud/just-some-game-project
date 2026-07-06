import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { calcTavern, serversNeeded, PRICING, MENU_STAPLE_IDS, type TavernPricing } from "~/data/tavern";
import { getFoodMeta, type FoodItemType } from "~/data/foods";
import FoodIcon from "~/components/FoodIcon";

const PRICING_ORDER: TavernPricing[] = ["generous", "fair", "steep"];

export default function Tavern() {
  const { state, actions } = useGame();

  const level = () => state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
  const townHallLvl = () => state.buildings.find((b) => b.buildingId === "town_hall")?.level ?? 1;
  const menu = () => state.tavernMenu ?? [];
  const servers = () => state.tavernServers ?? 0;
  const pricing = () => state.tavernPricing ?? "fair";
  const reputation = () => state.tavernReputation ?? 0;

  const t = () => calcTavern({
    level: level(), happiness: state.happiness, townHallLevel: townHallLvl(),
    menuVariety: menu().length, servers: servers(), pricing: pricing(), reputation: reputation(),
  });

  // Shared adult pool (same one the garrison draws from).
  const assignableAdults = () =>
    Math.max(0, state.citizens.adults - state.soldiers - state.archers - state.namedResidents.adults);
  const canAddServer = () => servers() < serversNeeded(level()) && servers() < assignableAdults();

  const statBox = {
    flex: "1 1 110px", padding: "12px 14px", background: "var(--bg-card)",
    border: "1px solid var(--border-color)", "border-radius": "8px", "text-align": "center" as const,
  };
  const statNum = { "font-size": "1.5rem", "font-weight": "bold" as const, color: "var(--accent-gold)" };
  const statLabel = { "font-size": "0.72rem", color: "var(--text-muted)", "text-transform": "uppercase" as const, "letter-spacing": "0.5px" };
  const stepBtn = {
    width: "34px", height: "34px", "border-radius": "6px", cursor: "pointer",
    background: "var(--bg-card)", border: "1px solid var(--border-color)", color: "var(--text-primary)",
    "font-size": "1.2rem", "line-height": "1",
  };

  return (
    <div style={{ padding: "16px" }}>
      <h1 class="page-title">🍻 Tavern</h1>

      <Show
        when={level() > 0}
        fallback={
          <div style={{ padding: "24px", background: "var(--bg-secondary)", "border-radius": "8px", "text-align": "center", color: "var(--text-muted)" }}>
            <div style={{ "font-size": "2rem", "margin-bottom": "8px" }}>🍻</div>
            <p>Build the Tavern to open its doors to travelers.</p>
            <A href="/buildings/tavern" style={{ color: "var(--accent-gold)" }}>Go to building →</A>
          </div>
        }
      >
        {/* ── Reputation ── */}
        <div class="building-card" style={{ "margin-bottom": "16px" }}>
          <div style={{ display: "flex", "justify-content": "space-between", "align-items": "baseline", "margin-bottom": "6px" }}>
            <span class="building-card-title">The tavern's name</span>
            <span style={{ color: "var(--accent-gold)", "font-weight": "bold" }}>{Math.round(reputation())} / 100</span>
          </div>
          <div style={{ height: "10px", background: "var(--bg-primary)", "border-radius": "5px", overflow: "hidden" }}>
            <div style={{ width: `${reputation()}%`, height: "100%", background: "var(--accent-gold)", transition: "width 0.4s" }} />
          </div>
          <p style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-top": "8px", "margin-bottom": "0" }}>
            A known, well-run house draws more of the world to its door: reputation raises how
            full the tavern can get, and (soon) how often merchants come and how far they travel.
            Full beds, a varied table, being staffed, and fair prices build it; a dark, empty
            tavern lets it fade.
          </p>
        </div>

        {/* ── Rooms & travelers ── */}
        <div class="building-card" style={{ "margin-bottom": "16px" }}>
          <div class="building-card-title" style={{ "margin-bottom": "12px" }}>Rooms & travelers</div>
          <div style={{ display: "flex", gap: "10px", "flex-wrap": "wrap" }}>
            <div style={statBox}><div style={statNum}>{t().rooms}</div><div style={statLabel}>Rooms</div></div>
            <div style={statBox}><div style={statNum}>{Math.round(t().occupancy * 100)}%</div><div style={statLabel}>Occupancy</div></div>
            <div style={statBox}><div style={statNum}>{t().occupiedRooms}</div><div style={statLabel}>Beds filled</div></div>
            <div style={statBox}><div style={statNum}>+{t().goldPerDay}</div><div style={statLabel}>Gold / day</div></div>
          </div>

          {/* Pricing lever */}
          <div style={{ "margin-top": "16px" }}>
            <div style={statLabel}>Pricing</div>
            <div style={{ display: "flex", gap: "8px", "margin-top": "6px", "flex-wrap": "wrap" }}>
              <For each={PRICING_ORDER}>
                {(p) => (
                  <button
                    class="field-upgrade-btn"
                    style={{
                      "font-size": "0.8rem", padding: "5px 14px",
                      background: pricing() === p ? "var(--accent-gold)" : "var(--bg-card)",
                      color: pricing() === p ? "#1a1a1a" : "var(--text-secondary)",
                      border: `1px solid ${pricing() === p ? "var(--accent-gold)" : "var(--border-color)"}`,
                    }}
                    onClick={() => actions.setTavernPricing(p)}
                  >
                    {PRICING[p].label}
                  </button>
                )}
              </For>
            </div>
            <p style={{ "font-size": "0.78rem", color: "var(--text-muted)", "margin-top": "6px", "margin-bottom": "0" }}>
              {PRICING[pricing()].blurb}
            </p>
          </div>

          <div style={{ "margin-top": "14px", padding: "10px 12px", background: "var(--bg-primary)", "border-radius": "6px", "font-size": "0.82rem", color: "var(--text-secondary)" }}>
            🧳 A bed for the night makes traders more likely to stop here, and to come back with
            more than a mule can carry.
          </div>
        </div>

        {/* ── Staffing ── */}
        <div class="building-card" style={{ "margin-bottom": "16px" }}>
          <div class="building-card-title" style={{ "margin-bottom": "4px" }}>Serving the tables</div>
          <p style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "12px" }}>
            Someone has to pour the ale and carry the plates. Servers are drawn from your adults,
            the same folk who could stand a watchtower, so a full tavern means fewer hands on the
            walls. An unstaffed tavern serves no one.
          </p>
          <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
            <button style={stepBtn} disabled={servers() <= 0} onClick={() => actions.setTavernServers(servers() - 1)}>−</button>
            <div style={{ "text-align": "center", "min-width": "90px" }}>
              <div style={statNum}>{servers()} / {serversNeeded(level())}</div>
              <div style={statLabel}>Servers</div>
            </div>
            <button style={stepBtn} disabled={!canAddServer()} onClick={() => actions.setTavernServers(servers() + 1)}>+</button>
            <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-left": "8px" }}>
              {assignableAdults()} adult{assignableAdults() === 1 ? "" : "s"} free to assign
              {t().staffingRatio < 1 ? " · understaffed (occupancy capped)" : ""}
            </div>
          </div>
        </div>

        {/* ── The menu ── */}
        <div class="building-card" style={{ "margin-bottom": "16px" }}>
          <div class="building-card-title" style={{ "margin-bottom": "4px" }}>The menu</div>
          <p style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "12px" }}>
            What the tavern sets on its tables. A varied menu cheers the settlement and draws more
            travelers. (Dishes from your adventurers' homelands, coming soon.)
          </p>
          <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
            <For each={MENU_STAPLE_IDS as FoodItemType[]}>
              {(dishId) => {
                const served = () => menu().includes(dishId);
                const meta = getFoodMeta(dishId);
                return (
                  <div style={{
                    display: "flex", "align-items": "center", gap: "10px", padding: "8px 12px",
                    background: served() ? "var(--bg-card)" : "var(--bg-secondary)",
                    border: `1px solid ${served() ? "var(--accent-gold)" : "var(--border-color)"}`,
                    "border-radius": "8px", opacity: served() ? "1" : "0.65",
                  }}>
                    <FoodIcon id={dishId} size={28} />
                    <span style={{ flex: "1", color: "var(--text-primary)", "font-size": "0.9rem" }}>{meta.label}</span>
                    <button
                      class="field-upgrade-btn"
                      style={{ "font-size": "0.78rem", padding: "4px 12px", opacity: served() ? "0.75" : "1" }}
                      onClick={() => actions.toggleTavernDish(dishId)}
                    >
                      {served() ? "On the menu" : "Serve"}
                    </button>
                  </div>
                );
              }}
            </For>
          </div>
          <div style={{ "margin-top": "10px", "font-size": "0.78rem", color: "var(--text-muted)" }}>
            {menu().length} of {MENU_STAPLE_IDS.length} dishes served.
          </div>
        </div>

        {/* ── The common room (conversations teaser) ── */}
        <div class="building-card" style={{ opacity: "0.8" }}>
          <div class="building-card-title" style={{ "margin-bottom": "4px" }}>The common room</div>
          <p style={{ "font-size": "0.85rem", color: "var(--text-muted)", margin: "0" }}>
            🪑 Soon: invite one of your folk to share a meal and a story here. (Coming in a later
            pass.)
          </p>
        </div>
      </Show>
    </div>
  );
}
