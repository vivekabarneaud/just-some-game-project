import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import {
  tavernRooms,
  calcTavernOccupancyForTownHall,
  tavernTravelerGoldPerHour,
  MENU_STAPLE_IDS,
} from "~/data/tavern";
import { getFoodMeta, type FoodItemType } from "~/data/foods";
import FoodIcon from "~/components/FoodIcon";

export default function Tavern() {
  const { state, actions } = useGame();

  const level = () => state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
  const townHallLvl = () => state.buildings.find((b) => b.buildingId === "town_hall")?.level ?? 1;
  const rooms = () => tavernRooms(level());
  const menu = () => state.tavernMenu ?? [];
  const occupancy = () => calcTavernOccupancyForTownHall(state.happiness, menu().length, townHallLvl());
  const occupiedRooms = () => Math.round(rooms() * occupancy());
  const goldPerDay = () => Math.round(tavernTravelerGoldPerHour(level(), occupancy()) * 24);

  const statBox = {
    flex: "1 1 120px", padding: "12px 14px", background: "var(--bg-card)",
    border: "1px solid var(--border-color)", "border-radius": "8px", "text-align": "center" as const,
  };
  const statNum = { "font-size": "1.5rem", "font-weight": "bold" as const, color: "var(--accent-gold)" };
  const statLabel = { "font-size": "0.72rem", color: "var(--text-muted)", "text-transform": "uppercase" as const, "letter-spacing": "0.5px" };

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
        {/* ── Rooms & travelers ── */}
        <div class="building-card" style={{ "margin-bottom": "16px" }}>
          <div class="building-card-title" style={{ "margin-bottom": "4px" }}>Rooms & travelers</div>
          <p style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "12px" }}>
            Travelers rent beds by the night. A happier, better-stocked, more established
            settlement fills more rooms.
          </p>
          <div style={{ display: "flex", gap: "10px", "flex-wrap": "wrap" }}>
            <div style={statBox}><div style={statNum}>{rooms()}</div><div style={statLabel}>Rooms</div></div>
            <div style={statBox}><div style={statNum}>{Math.round(occupancy() * 100)}%</div><div style={statLabel}>Occupancy</div></div>
            <div style={statBox}><div style={statNum}>{occupiedRooms()}</div><div style={statLabel}>Beds filled</div></div>
            <div style={statBox}><div style={statNum}>+{goldPerDay()}</div><div style={statLabel}>Gold / day</div></div>
          </div>
          <div style={{ "margin-top": "12px", padding: "10px 12px", background: "var(--bg-primary)", "border-radius": "6px", "font-size": "0.82rem", color: "var(--text-secondary)" }}>
            🧳 A bed for the night makes traders more likely to stop here, and to come back with
            more than a mule can carry.
          </div>
        </div>

        {/* ── The menu ── */}
        <div class="building-card" style={{ "margin-bottom": "16px" }}>
          <div class="building-card-title" style={{ "margin-bottom": "4px" }}>The menu</div>
          <p style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "12px" }}>
            What the tavern sets on its tables. A varied menu cheers the settlement and draws more
            travelers. (More dishes to feature, from your adventurers' homelands, coming soon.)
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
