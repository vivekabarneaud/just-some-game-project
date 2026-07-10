import { For, Show, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { calcTavern, serversNeeded, menuCapacity, PRICING, type TavernPricing } from "~/data/tavern";
import { type DishKind } from "~/data/foods";
import MenuDishCard from "~/components/MenuDishCard";
import { deriveTavernGuests } from "~/data/tavernGuests";

const PRICING_ORDER: TavernPricing[] = ["generous", "fair", "steep"];

/** The tavern menu's three columns, in display order. */
const MENU_COLUMNS: { kind: DishKind; label: string; icon: string }[] = [
  { kind: "meal", label: "Meals", icon: "🍲" },
  { kind: "drink", label: "Drinks", icon: "🍺" },
  { kind: "dessert", label: "Desserts", icon: "🍯" },
];
/** A small dish icon — the recipe's sprite if it has one, else its emoji. */
function DishIcon(props: { image?: string; icon: string; size?: number }) {
  const s = props.size ?? 24;
  return props.image
    ? <img src={props.image} alt="" style={{ width: `${s}px`, height: `${s}px`, "object-fit": "contain" }} />
    : <span style={{ "font-size": `${Math.round(s * 0.8)}px`, "line-height": "1" }}>{props.icon}</span>;
}

export default function Tavern() {
  const { state, actions } = useGame();

  const level = () => state.buildings.find((b) => b.buildingId === "tavern")?.level ?? 0;
  const townHallLvl = () => state.buildings.find((b) => b.buildingId === "town_hall")?.level ?? 1;
  const menu = () => state.tavernMenu ?? [];
  const servers = () => state.tavernServers ?? 0;
  const pricing = () => state.tavernPricing ?? "fair";
  const reputation = () => state.tavernReputation ?? 0;
  // Cook-to-order dishes (recipe-based). A dish counts toward variety only when
  // it's on the menu AND cookable right now (its ingredients are in stock).
  const dishes = () => actions.getTavernDishes();
  const onMenuOfKind = (k: DishKind) => dishes().filter((d) => d.onMenu && d.kind === k);
  const servableCount = () => dishes().filter((d) => d.onMenu && d.available).length;
  // Who's staying: the occupied beds as a small flavor roster (derived, stable
  // within a game-hour). Not persistent state — cosmetic colour over occupancy.
  const guests = () => deriveTavernGuests(Math.max(0, Math.round(t().occupiedRooms)), Math.floor(state.seasonElapsed));

  const t = () => calcTavern({
    level: level(), happiness: state.happiness, townHallLevel: townHallLvl(),
    menuVariety: servableCount(), servers: servers(), pricing: pricing(), reputation: reputation(),
  });

  // Shared adult pool (same one the garrison draws from).
  const assignableAdults = () =>
    Math.max(0, state.citizens.adults - state.soldiers - state.archers - state.namedResidents.adults);
  const canAddServer = () => servers() < serversNeeded(level()) && servers() < assignableAdults();

  // Menu editor (staged multi-select modal)
  const [editKind, setEditKind] = createSignal<DishKind | null>(null);
  const [staged, setStaged] = createSignal<string[]>([]);
  const cap = () => menuCapacity(level());
  const openEditor = (kind: DishKind) => {
    setStaged(dishes().filter((d) => d.onMenu && d.kind === kind).map((d) => d.id));
    setEditKind(kind);
  };
  const toggleStaged = (id: string) =>
    setStaged((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  // Slots taken by dishes of OTHER kinds (fixed while editing one kind), so the
  // counter reflects the whole menu, not just this column.
  const otherKindCount = (kind: DishKind) => dishes().filter((d) => d.onMenu && d.kind !== kind).length;
  const usedIfApplied = (kind: DishKind) => otherKindCount(kind) + staged().length;
  const applyEditor = (kind: DishKind) => {
    const otherIds = menu().filter((id) => (dishes().find((d) => d.id === id)?.kind ?? "meal") !== kind);
    actions.setTavernMenu([...otherIds, ...staged()]);
    setEditKind(null);
  };

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

        {/* ── Who's staying tonight ── */}
        <div class="building-card" style={{ "margin-bottom": "16px" }}>
          <div class="building-card-title" style={{ "margin-bottom": "8px" }}>Who's staying tonight</div>
          <Show when={guests().length > 0} fallback={
            <p style={{ "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic", margin: "0" }}>
              The rooms sit empty tonight. A fuller, better-fed, better-known tavern draws more custom.
            </p>
          }>
            <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
              <For each={guests()}>
                {(g) => (
                  <div style={{
                    display: "flex", "align-items": "center", gap: "9px", "font-size": "0.88rem",
                    color: g.kind === "notable" ? "var(--accent-gold)" : g.kind === "citizen" ? "#a5d8ff" : "var(--text-secondary)",
                  }}>
                    <span style={{ "font-size": "1.05rem", width: "20px", "text-align": "center" }}>{g.icon}</span>
                    <span>{g.label}</span>
                  </div>
                )}
              </For>
            </div>
          </Show>
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
        <div class="building-card parchment-panel" style={{ "margin-bottom": "16px", padding: "18px 46px" }}>
          <div class="building-card-title" style={{ "margin-bottom": "4px" }}>The menu</div>
          <p style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "12px" }}>
            What the tavern sets on its tables. A varied menu cheers the settlement and draws more travelers.
          </p>
          <div style={{ display: "flex", gap: "12px", "flex-wrap": "wrap", "align-items": "flex-start" }}>
            <For each={MENU_COLUMNS}>
              {(col) => (
                <div style={{ flex: "1 1 200px", "min-width": "180px", display: "flex", "flex-direction": "column", gap: "8px" }}>
                  <div style={{ "font-family": "var(--font-heading)", "font-size": "0.95rem", color: "var(--accent-gold)", "border-bottom": "1px solid var(--border-color)", "padding-bottom": "4px" }}>
                    {col.icon} {col.label}
                  </div>
                  <For each={onMenuOfKind(col.kind)} fallback={
                    <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "font-style": "italic", padding: "4px 0" }}>
                      Nothing on the board yet.
                    </div>
                  }>
                    {(dish) => (
                      <div style={{ display: "flex", "align-items": "center", gap: "8px", padding: "6px 8px", background: "var(--bg-card)", border: `1px solid ${dish.available ? "var(--accent-gold)" : "var(--accent-red)"}`, "border-radius": "8px" }}>
                        <DishIcon image={dish.image} icon={dish.icon} size={24} />
                        <div style={{ flex: "1", "min-width": "0" }}>
                          <div style={{ color: "var(--text-primary)", "font-size": "0.85rem" }}>{dish.name}</div>
                          <div style={{ "font-size": "0.7rem", color: dish.available ? "var(--text-muted)" : "var(--accent-red)" }}>
                            {dish.commodity
                              ? (dish.available ? "poured from the barrel" : "the barrel is dry")
                              : (dish.available ? "cooked to order" : `need ${dish.missing.join(", ")}`)}
                          </div>
                        </div>
                        <button title="Remove from the menu" style={{ background: "none", border: "none", cursor: "pointer", "font-size": "0.95rem" }} onClick={() => actions.toggleTavernDish(dish.id)}>🗑</button>
                      </div>
                    )}
                  </For>
                  <button
                    class="field-upgrade-btn"
                    style={{ "font-size": "0.76rem", padding: "5px 10px", "align-self": "flex-start" }}
                    onClick={() => openEditor(col.kind)}
                  >
                    ＋ Add {col.label.toLowerCase()}
                  </button>
                </div>
              )}
            </For>
          </div>
          <div style={{ "margin-top": "12px", "font-size": "0.78rem", color: "var(--text-muted)" }}>
            {servableCount()} of {menu().length} dishes cookable now · {menu().length}/{menuCapacity(level())} menu slots used. Dishes are cooked to order from the kitchen's ingredients.
          </div>
        </div>

        {/* Menu editor — a bigger modal of selectable dish cards for one column. */}
        <Show when={editKind()}>
          {(kind) => {
            const label = () => MENU_COLUMNS.find((c) => c.kind === kind())?.label ?? "Dishes";
            const all = () => dishes().filter((d) => d.kind === kind());
            const unlocked = () => all().filter((d) => d.unlocked);
            const locked = () => all().filter((d) => !d.unlocked);
            const used = () => usedIfApplied(kind());
            const over = () => used() > cap();
            return (
              <div onClick={() => setEditKind(null)} style={{ position: "fixed", inset: "0", background: "rgba(0,0,0,0.6)", display: "flex", "align-items": "center", "justify-content": "center", "z-index": "1000", padding: "16px" }}>
                <div onClick={(e) => e.stopPropagation()} class="building-card parchment-panel" style={{ "max-width": "760px", width: "100%", "max-height": "85vh", display: "flex", "flex-direction": "column", padding: "22px 46px" }}>
                  <div class="building-card-title" style={{ "margin-bottom": "4px" }}>{label()} on the menu</div>
                  <p style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-bottom": "12px" }}>
                    Tap dishes to set the menu. Each is cooked to order from its ingredients.
                  </p>
                  <div style={{ flex: "1", "overflow-y": "auto" }}>
                    {/* Hint sits ABOVE the card grid (full width), not inside it. */}
                    <Show when={all().length === 0}>
                      <p style={{ "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic", margin: "0 0 8px" }}>
                        No {label().toLowerCase()} recipes exist yet.
                      </p>
                    </Show>
                    <Show when={all().length > 0 && unlocked().length === 0}>
                      <p style={{ "font-size": "0.85rem", color: "var(--text-muted)", "font-style": "italic", margin: "0 0 10px" }}>
                        No {label().toLowerCase()} unlocked yet. <A href="/buildings" style={{ color: "var(--accent-gold)" }}>Upgrade the Kitchens</A> to unlock these.
                      </p>
                    </Show>
                    <div style={{ display: "flex", "flex-wrap": "wrap", gap: "10px", "align-content": "flex-start" }}>
                      <For each={unlocked()}>
                        {(dish) => (
                          <MenuDishCard
                            name={dish.name} icon={dish.icon} image={dish.image} costs={dish.costs}
                            selected={staged().includes(dish.id)} available={dish.available}
                            onClick={() => toggleStaged(dish.id)}
                          />
                        )}
                      </For>
                      {/* Locked recipes shown dimmed, as a taste of what's to come. */}
                      <For each={locked()}>
                        {(dish) => (
                          <MenuDishCard name={dish.name} icon={dish.icon} image={dish.image} costs={dish.costs} selected={false} locked />
                        )}
                      </For>
                    </div>
                  </div>
                  {/* Footer: slot counter + apply. */}
                  <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "12px", "margin-top": "14px", "padding-top": "12px", "border-top": "1px solid var(--border-color)" }}>
                    <div style={{ "font-size": "0.85rem", color: over() ? "var(--accent-red)" : "var(--text-secondary)" }}>
                      <strong>{used()}</strong> / {cap()} menu slots{over() ? " — remove some to apply" : ""}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button class="field-upgrade-btn" style={{ "font-size": "0.82rem", padding: "6px 14px", background: "var(--bg-card)" }} onClick={() => setEditKind(null)}>Cancel</button>
                      <button class="field-upgrade-btn" disabled={over()} style={{ "font-size": "0.82rem", padding: "6px 16px", opacity: over() ? "0.5" : "1" }} onClick={() => applyEditor(kind())}>Apply</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
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
