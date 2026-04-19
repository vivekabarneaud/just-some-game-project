import { For, Show } from "solid-js";
import { RESOURCES } from "~/data/resources";
import { HERBS } from "@medieval-realm/shared/data/herbs";
import { EXOTICS } from "@medieval-realm/shared/data/exotics";
import { useGame } from "~/engine/gameState";
import { FOOD_ITEMS, FOOD_CATEGORIES, getTotalFood, type FoodItemType, type FoodCategoryId } from "~/data/foods";
import FoodIcon from "~/components/FoodIcon";

export default function ResourceBar() {
  const { state, actions } = useGame();
  const rates = () => actions.getProductionRates();
  const foodCons = () => actions.getFoodConsumption();
  const animalCons = () => actions.getAnimalFoodConsumption();
  const caps = () => actions.getStorageCaps();
  const foodBreakdown = () => actions.getFoodBreakdown();

  const getAmount = (id: string) => {
    // For food, show the sum of per-type floors so the total always matches what's visible in the dropdown
    if (id === "food") {
      return FOOD_ITEMS.reduce((sum, fi) => sum + Math.floor(state.foods?.[fi.id] ?? 0), 0);
    }
    return Math.floor(state.resources[id as keyof typeof state.resources] as number);
  };

  const getCap = (id: string) => {
    const c = caps();
    return c[id as keyof typeof c];
  };

  const getRate = (id: string) => {
    const r = rates();
    const base = r[id as keyof typeof r] as number;
    if (id === "food") return base - foodCons() - animalCons();
    return base;
  };

  const isNearCap = (id: string) => getAmount(id) >= getCap(id) * 0.9;

  return (
    <div class="resource-bar">
      <For each={RESOURCES}>
        {(res) => {
          const rate = () => getRate(res.id);
          return (
            <div class="resource-item" classList={{ "has-dropdown": res.id === "food" }}>
              <span class="resource-icon">{res.icon}</span>
              <span
                class="resource-amount"
                classList={{ "near-cap": isNearCap(res.id) }}
              >
                {getAmount(res.id).toLocaleString()}
              </span>
              <span class="resource-cap">/ {getCap(res.id).toLocaleString()}</span>
              <span
                class="resource-rate"
                classList={{
                  "rate-positive": rate() > 0,
                  "rate-negative": rate() < 0,
                  "rate-zero": rate() === 0,
                }}
              >
                {rate() >= 0 ? "+" : ""}
                {Math.round(rate())}/h
              </span>

              <Show when={res.id === "food"}>
                <div class="resource-dropdown">
                  <div class="dropdown-title">Food Stockpile</div>
                  {/* Per-type stocks grouped by category — only categories with any stock/production show up */}
                  <For each={FOOD_CATEGORIES}>
                    {(cat) => {
                      const itemsInCat = () => FOOD_ITEMS
                        .filter((fi) => fi.category === cat.id)
                        .sort((a, b) => a.order - b.order);
                      const visibleItems = () => itemsInCat().filter((fi) => {
                        const stock = Math.floor(state.foods?.[fi.id] ?? 0);
                        const rate = foodBreakdown().find((s) => s.type === fi.id)?.rate ?? 0;
                        return stock > 0 || rate > 0;
                      });
                      return (
                        <Show when={visibleItems().length > 0}>
                          <div class="dropdown-category-header">{cat.icon} {cat.label}</div>
                          <For each={visibleItems()}>
                            {(fi) => {
                              const stock = () => Math.floor(state.foods?.[fi.id] ?? 0);
                              const rate = () => foodBreakdown().find((s) => s.type === fi.id)?.rate ?? 0;
                              return (
                                <div class="dropdown-row">
                                  <span style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                                    <FoodIcon id={fi.id} size={16} /> {fi.label}
                                  </span>
                                  <span style={{ display: "flex", gap: "8px", "align-items": "center" }}>
                                    <span style={{ color: "var(--text-primary)" }}>{stock()}</span>
                                    <Show when={rate() > 0} fallback={
                                      <span style={{ "min-width": "64px", "text-align": "right", color: "var(--text-muted)", "font-size": "0.72rem" }}>
                                        (dormant)
                                      </span>
                                    }>
                                      <span class="rate-positive" style={{ "min-width": "64px", "text-align": "right" }}>+{rate()}/h</span>
                                    </Show>
                                  </span>
                                </div>
                              );
                            }}
                          </For>
                        </Show>
                      );
                    }}
                  </For>
                  {/* Pantry: honey lives outside the typed foods map but belongs with food */}
                  <Show when={state.honey > 0}>
                    <div class="dropdown-category-header">🍯 Pantry</div>
                    <div class="dropdown-row">
                      <span>🍯 Honey</span>
                      <span style={{ color: "var(--text-primary)" }}>{Math.floor(state.honey)}</span>
                    </div>
                  </Show>
                  <Show when={foodBreakdown().length === 0 && getTotalFood(state.foods) === 0 && state.honey === 0}>
                    <div class="dropdown-row" style={{ color: "var(--text-muted)" }}>No food stockpile</div>
                  </Show>
                  <div class="dropdown-row dropdown-total">
                    <span>👤 Citizens</span>
                    <span class="rate-negative">-{Math.round(foodCons())}/h</span>
                  </div>
                  <Show when={animalCons() > 0}>
                    <div class="dropdown-row">
                      <span>🐄 Animal feed</span>
                      <span class="rate-negative">-{Math.round(animalCons())}/h</span>
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
          );
        }}
      </For>
      <div class="resource-item has-dropdown">
        <span class="resource-icon">{state.happiness >= 70 ? "😊" : state.happiness >= 40 ? "😐" : "😟"}</span>
        <span class="resource-amount" style={{
          color: state.happiness >= 70 ? "var(--accent-green)" : state.happiness >= 40 ? "var(--accent-gold)" : "var(--accent-red)",
        }}>
          {state.happiness}%
        </span>
        <span class="resource-rate" style={{
          color: actions.getHappinessModifier() >= 1 ? "var(--accent-green)" : "var(--accent-red)",
        }}>
          {Math.round(actions.getHappinessModifier() * 100)}% prod
        </span>
        <div class="resource-dropdown">
          <div class="dropdown-title">Happiness Breakdown</div>
          <For each={actions.getHappinessBreakdown()}>
            {(factor) => (
              <div class="dropdown-row">
                <span>{factor.label}</span>
                <span classList={{
                  "rate-positive": factor.value > 0,
                  "rate-negative": factor.value < 0,
                }}>
                  {factor.value > 0 ? "+" : ""}{factor.value}
                </span>
              </div>
            )}
          </For>
          <div class="dropdown-row dropdown-total">
            <span>Total</span>
            <span>{state.happiness}</span>
          </div>
        </div>
      </div>
      <Show when={state.wool > 0 || state.fiber > 0 || state.leather > 0 || state.iron > 0 || state.gems > 0}>
        <div class="resource-item has-dropdown">
          <span class="resource-icon">🧵</span>
          <span class="resource-amount">{Math.floor(state.wool) + Math.floor(state.fiber) + Math.floor(state.leather ?? 0) + Math.floor(state.iron)}</span>
          <div class="resource-dropdown">
            <div class="dropdown-title">Crafting Materials</div>
            <div class="dropdown-row">
              <span>🐑 Wool</span>
              <span>{Math.floor(state.wool)}/200</span>
            </div>
            <div class="dropdown-row">
              <span>🪻 Fiber</span>
              <span>{Math.floor(state.fiber)}/200</span>
            </div>
            <div class="dropdown-row">
              <span>🐄 Leather</span>
              <span>{Math.floor(state.leather ?? 0)}/200</span>
            </div>
            <div class="dropdown-row">
              <span>⚒️ Iron</span>
              <span>{Math.floor(state.iron)}/200</span>
            </div>
            <Show when={state.gems > 0}>
              <div class="dropdown-row">
                <span>💎 Gems</span>
                <span>{state.gems}</span>
              </div>
            </Show>
          </div>
        </div>
      </Show>
      {/* Herbs */}
      <Show when={state.herbs && Object.values(state.herbs).some((v) => (v as number) > 0)}>
        <div class="resource-item has-dropdown">
          <span class="resource-icon">🌿</span>
          <span class="resource-amount">{Object.values(state.herbs ?? {}).reduce((sum, v) => sum + (v as number), 0)}</span>
          <div class="resource-dropdown">
            <div class="dropdown-title">Herbs</div>
            <For each={HERBS}>
              {(herb) => (
                <Show when={(state.herbs?.[herb.id] ?? 0) > 0}>
                  <div class="dropdown-row">
                    <span>{herb.icon} {herb.name}</span>
                    <span>{state.herbs?.[herb.id] ?? 0}</span>
                  </div>
                </Show>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Exotic goods — caravan-only spices & tea */}
      <Show when={state.exotics && Object.values(state.exotics).some((v) => (v as number) > 0)}>
        <div class="resource-item has-dropdown">
          <span class="resource-icon">🌶️</span>
          <span class="resource-amount">{Object.values(state.exotics ?? {}).reduce((sum, v) => sum + (v as number), 0)}</span>
          <div class="resource-dropdown">
            <div class="dropdown-title">Exotic Goods</div>
            <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-bottom": "6px", "padding-bottom": "4px", "border-bottom": "1px solid var(--border-default)" }}>
              From caravan & escort missions only
            </div>
            <For each={EXOTICS}>
              {(ex) => (
                <Show when={(state.exotics?.[ex.id] ?? 0) > 0}>
                  <div class="dropdown-row">
                    <span>{ex.icon} {ex.name}</span>
                    <span>{state.exotics?.[ex.id] ?? 0}</span>
                  </div>
                </Show>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={state.clothing > 0 || actions.getClothingInfo().needed > 0}>
        <div class="resource-item">
          <span class="resource-icon">👕</span>
          <span class="resource-amount" style={{
            color: actions.getClothingInfo().current >= actions.getClothingInfo().needed ? "var(--accent-green)" : "var(--accent-red)",
          }}>
            {actions.getClothingInfo().current}/{actions.getClothingInfo().needed}
          </span>
        </div>
      </Show>
      <Show when={actions.getAleInfo().cap > 0}>
        <div class="resource-item">
          <span class="resource-icon">🍺</span>
          <span class="resource-amount">{actions.getAleInfo().current}</span>
          <span class="resource-cap">/ {actions.getAleInfo().cap}</span>
          {(() => {
            const ale = actions.getAleInfo();
            // Don't show consumption if there's no ale and no production
            const effectiveConsumption = (ale.current <= 0 && ale.production <= 0) ? 0 : ale.consumption;
            const net = ale.production - effectiveConsumption;
            return net !== 0 ? (
              <span class="resource-rate" classList={{
                "rate-positive": net > 0,
                "rate-negative": net < 0,
              }}>
                {net >= 0 ? "+" : ""}{net}/h
              </span>
            ) : null;
          })()}
        </div>
      </Show>
      <div class="resource-item" style={{ "border-left": "1px solid var(--border-default)", "padding-left": "12px" }}>
        <span class="resource-icon">💠</span>
        <span class="resource-amount" style={{ color: "#a78bfa" }}>
          {state.astralShards}
        </span>
        <Show when={actions.canClaimDailyLogin()}>
          <button
            onClick={() => actions.claimDailyLogin()}
            style={{
              "margin-left": "6px",
              padding: "2px 8px",
              background: "rgba(167, 139, 250, 0.2)",
              border: "1px solid #a78bfa",
              color: "#a78bfa",
              "border-radius": "4px",
              cursor: "pointer",
              "font-size": "0.7rem",
              "white-space": "nowrap",
            }}
          >
            +10 daily
          </button>
        </Show>
      </div>
      <div class="resource-item pop-display">
        <span class="resource-icon">👤</span>
        <span class="resource-amount">
          {Math.floor(state.population)}/{actions.getMaxPopulation()}
        </span>
      </div>
    </div>
  );
}
