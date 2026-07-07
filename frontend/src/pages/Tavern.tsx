import { For, Show, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { calcTavern, serversNeeded, menuCapacity, PRICING, type TavernPricing } from "~/data/tavern";
import { getFoodMeta, FOOD_ITEMS, type FoodItemType, type DishKind } from "~/data/foods";
import FoodIcon from "~/components/FoodIcon";

const PRICING_ORDER: TavernPricing[] = ["generous", "fair", "steep"];

/** The tavern menu's three columns, in display order. */
const MENU_COLUMNS: { kind: DishKind; label: string; icon: string }[] = [
  { kind: "meal", label: "Meals", icon: "🍲" },
  { kind: "drink", label: "Drinks", icon: "🍺" },
  { kind: "dessert", label: "Desserts", icon: "🍯" },
];
/** All cooked dishes of a kind (kind defaults to "meal"). */
const dishesOfKind = (k: DishKind): FoodItemType[] =>
  FOOD_ITEMS.filter((f) => f.category === "cooked" && (f.kind ?? "meal") === k).map((f) => f.id);

export default function Tavern() {
  const { state, actions } = useGame();

  const level = () => state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
  const townHallLvl = () => state.buildings.find((b) => b.buildingId === "town_hall")?.level ?? 1;
  const menu = () => state.tavernMenu ?? [];
  const servers = () => state.tavernServers ?? 0;
  const pricing = () => state.tavernPricing ?? "fair";
  const reputation = () => state.tavernReputation ?? 0;
  const stockOf = (dishId: string) => Math.floor((state.foods as Record<string, number>)[dishId] ?? 0);
  // Only dishes with cooked stock can actually be served (count toward variety).
  const servedInStock = () => menu().filter((d) => stockOf(d) > 0);

  const t = () => calcTavern({
    level: level(), happiness: state.happiness, townHallLevel: townHallLvl(),
    menuVariety: servedInStock().length, servers: servers(), pricing: pricing(), reputation: reputation(),
  });

  // Shared adult pool (same one the garrison draws from).
  const assignableAdults = () =>
    Math.max(0, state.citizens.adults - state.soldiers - state.archers - state.namedResidents.adults);
  const canAddServer = () => servers() < serversNeeded(level()) && servers() < assignableAdults();

  // Menu management
  const [addKind, setAddKind] = createSignal<DishKind | null>(null);
  const hasBrewery = () => (state.buildings.find((b) => b.buildingId === "brewery")?.level ?? 0) > 0;
  const atCapacity = () => menu().length >= menuCapacity(level());
  const onMenuOfKind = (k: DishKind) => dishesOfKind(k).filter((d) => menu().includes(d));
  const addableOfKind = (k: DishKind) => dishesOfKind(k).filter((d) => !menu().includes(d));

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
            <div style={statBox}>
              <div style={statNum}>{t().occupiedRooms} / {t().rooms}</div>
              <div style={statLabel}>Beds filled</div>
            </div>
            <div style={statBox}>
              <div style={statNum}>+{t().goldPerDay}</div>
              <div style={statLabel}>Gold / day</div>
            </div>
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
        <div class="building-card parchment-card" style={{ "margin-bottom": "16px" }}>
          <div class="building-card-title" style={{ "margin-bottom": "4px" }}>The menu</div>
          <p style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "12px" }}>
            What the tavern sets on its tables. A varied menu cheers the settlement and draws more travelers.
          </p>
          <div style={{ display: "flex", gap: "12px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
            <For each={MENU_COLUMNS}>
              {(col) => {
                const breweryLocked = () => col.kind === "drink" && !hasBrewery();
                return (
                  <div style={{ flex: "1 1 200px", "min-width": "180px", display: "flex", "flex-direction": "column", gap: "8px" }}>
                    <div style={{ "font-family": "var(--font-heading)", "font-size": "0.95rem", color: "var(--accent-gold)", "border-bottom": "1px solid var(--border-color)", "padding-bottom": "4px" }}>
                      {col.icon} {col.label}
                    </div>
                    <Show when={!breweryLocked()} fallback={
                      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "font-style": "italic", padding: "6px 0" }}>
                        Build a <A href="/buildings" style={{ color: "var(--accent-gold)" }}>Brewery</A> first.
                      </div>
                    }>
                      <For each={onMenuOfKind(col.kind)} fallback={
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "font-style": "italic", padding: "4px 0" }}>
                          Nothing on the board yet.
                        </div>
                      }>
                        {(dishId) => {
                          const stock = () => stockOf(dishId);
                          const out = () => stock() <= 0;
                          const meta = getFoodMeta(dishId);
                          return (
                            <div style={{ display: "flex", "align-items": "center", gap: "8px", padding: "6px 8px", background: "var(--bg-card)", border: `1px solid ${out() ? "var(--accent-red)" : "var(--accent-gold)"}`, "border-radius": "8px" }}>
                              <FoodIcon id={dishId} size={24} />
                              <div style={{ flex: "1", "min-width": "0" }}>
                                <div style={{ color: "var(--text-primary)", "font-size": "0.85rem" }}>{meta.label}</div>
                                <div style={{ "font-size": "0.7rem", color: out() ? "var(--accent-red)" : "var(--text-muted)" }}>
                                  {out() ? "out of stock" : `${stock()} in stock`}
                                </div>
                              </div>
                              <button title="Remove from the menu" style={{ background: "none", border: "none", cursor: "pointer", "font-size": "0.95rem" }} onClick={() => actions.toggleTavernDish(dishId)}>🗑</button>
                            </div>
                          );
                        }}
                      </For>
                      <button
                        class="field-upgrade-btn"
                        disabled={atCapacity()}
                        title={atCapacity() ? "Menu full — upgrade the tavern for more slots" : ""}
                        style={{ "font-size": "0.76rem", padding: "5px 10px", opacity: atCapacity() ? "0.5" : "1", "align-self": "flex-start" }}
                        onClick={() => setAddKind(col.kind)}
                      >
                        ＋ Add
                      </button>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
          <div style={{ "margin-top": "12px", "font-size": "0.78rem", color: "var(--text-muted)" }}>
            {servedInStock().length} of {menu().length} featured in stock · {menu().length}/{menuCapacity(level())} menu slots used. Serving draws from the kitchen's cooked meals — keep the pots on.
          </div>
        </div>

        {/* Add-dish modal — off-menu dishes of the chosen kind. */}
        <Show when={addKind()}>
          {(kind) => (
            <div onClick={() => setAddKind(null)} style={{ position: "fixed", inset: "0", background: "rgba(0,0,0,0.6)", display: "flex", "align-items": "center", "justify-content": "center", "z-index": "1000", padding: "16px" }}>
              <div onClick={(e) => e.stopPropagation()} class="building-card" style={{ "max-width": "420px", width: "100%", "max-height": "80vh", "overflow-y": "auto" }}>
                <div class="building-card-title" style={{ "margin-bottom": "10px" }}>
                  Add {MENU_COLUMNS.find((c) => c.kind === kind())?.label.toLowerCase()}
                </div>
                <For each={addableOfKind(kind())} fallback={
                  <p style={{ "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic", margin: "0" }}>
                    No more recipes yet. <A href="/buildings" style={{ color: "var(--accent-gold)" }}>Upgrade the Kitchens</A> to unlock more.
                  </p>
                }>
                  {(dishId) => {
                    const meta = getFoodMeta(dishId);
                    return (
                      <div style={{ display: "flex", "align-items": "center", gap: "10px", padding: "8px 4px", "border-bottom": "1px solid var(--border-color)" }}>
                        <FoodIcon id={dishId} size={26} />
                        <span style={{ flex: "1", color: "var(--text-primary)", "font-size": "0.9rem" }}>{meta.label}</span>
                        <button class="field-upgrade-btn" disabled={atCapacity()} title={atCapacity() ? "Menu full — upgrade the tavern" : ""} style={{ "font-size": "0.78rem", padding: "4px 12px", opacity: atCapacity() ? "0.5" : "1" }} onClick={() => actions.toggleTavernDish(dishId)}>Add</button>
                      </div>
                    );
                  }}
                </For>
                <button class="field-upgrade-btn" style={{ "margin-top": "12px", "font-size": "0.8rem", padding: "5px 14px" }} onClick={() => setAddKind(null)}>Done</button>
              </div>
            </div>
          )}
        </Show>

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
