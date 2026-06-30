import { For, Show } from "solid-js";
import { RESOURCES } from "~/data/resources";
import { HERBS } from "@medieval-realm/shared/data/herbs";
import { EXOTICS } from "@medieval-realm/shared/data/exotics";
import { useGame, CRAFTING_RECIPES } from "~/engine/gameState";
import { totalPopulation } from "~/data/citizens";
import { FOOD_ITEMS, FOOD_CATEGORIES, getTotalFood, getFoodCostAmount, type FoodItemType, type FoodCategoryId } from "~/data/foods";
import { craftingMaterialCap } from "~/data/buildings";
import FoodIcon from "~/components/FoodIcon";

export default function ResourceBar() {
  const { state, actions } = useGame();

  /** Passive-cooking contribution to the food economy. Only counts recipes that
   *  can actually run right now (all ingredients present + wood to burn), so a
   *  stalled pot doesn't claim a phantom rate. Returns the per-cooked-type
   *  production rate (/h), a per-cooked-type "hours until the limiting ingredient
   *  runs out", and the NET food rate (produced minus food eaten as inputs). */
  const cookingRates = () => {
    const produce: Record<string, number> = {};
    const hoursLeft: Record<string, number> = {};
    let net = 0;
    for (const rid of Object.values(state.autoCook ?? {})) {
      const r = CRAFTING_RECIPES.find((cr) => cr.id === rid);
      if (!r) continue;
      const inputsOk = r.costs.every((c) => getFoodCostAmount(state.foods, c.resource) >= c.amount);
      const woodOk = state.resources.wood > 0; // the fire needs fuel
      if (!inputsOk || !woodOk) continue; // stalled → no contribution
      const perHour = 3600 / r.craftTime;
      const outType = r.produces.resource;
      produce[outType] = (produce[outType] ?? 0) + r.produces.amount * perHour;
      let netBatch = r.produces.amount;
      let minHours = Infinity;
      for (const c of r.costs) {
        netBatch -= c.amount; // inputs are food → leave the larder
        const burn = c.amount * perHour;
        const stock = getFoodCostAmount(state.foods, c.resource);
        if (burn > 0) minHours = Math.min(minHours, stock / burn);
      }
      net += netBatch * perHour;
      hoursLeft[outType] = Math.min(hoursLeft[outType] ?? Infinity, minHours);
    }
    return { produce, hoursLeft, net };
  };
  /** Is a pot assigned to this food type at all? (Used for the stalled-pot
   *  fallback label when it isn't currently producing.) */
  const isCooking = (foodId: string): boolean =>
    Object.values(state.autoCook ?? {}).some((rid) =>
      CRAFTING_RECIPES.find((cr) => cr.id === rid)?.produces.resource === foodId);
  /** If a pot is assigned to this dish but can't run, why? ("no fuel" / "out of
   *  grain"). Empty string when it isn't assigned or is running fine. */
  const cookStallReason = (foodId: string): string => {
    const r = Object.values(state.autoCook ?? {})
      .map((rid) => CRAFTING_RECIPES.find((cr) => cr.id === rid))
      .find((cr) => cr?.produces.resource === foodId);
    if (!r) return "";
    if (state.resources.wood <= 0) return "no fuel";
    const missing = r.costs.find((c) => getFoodCostAmount(state.foods, c.resource) < c.amount);
    return missing ? `out of ${missing.resource}` : "";
  };
  /** "~4h left" style label, or "" when the supply is effectively open-ended. */
  const cookLeftLabel = (hours: number): string => {
    if (!isFinite(hours) || hours > 99) return "";
    if (hours < 1) return " (<1h left)";
    return ` (~${Math.round(hours)}h left)`;
  };
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
    // Fold passive cooking's NET (food produced minus food eaten as ingredients)
    // into the headline rate so the player sees -14/h climb when a pot is on.
    // The "how long until the larder runs dry" detail stays on the cooked-food
    // line only; here it'd be misleading (several pots, several timers).
    if (id === "food") return base - foodCons() - animalCons() + cookingRates().net;
    return base;
  };

  const isNearCap = (id: string) => getAmount(id) >= getCap(id) * 0.9;

  return (
    <div class="resource-bar">
      <For each={RESOURCES}>
        {(res) => {
          const rate = () => getRate(res.id);
          // Soft-lock nudge for wood / stone at 0/h. Empty string = no
          // dropdown shown. Round to match the displayed value (Math.round
          // of a 0.4 rate reads as 0/h but wouldn't pass strict equality).
          const noProductionMessage = (): string => {
            if (res.id !== "wood" && res.id !== "stone") return "";
            if (Math.round(rate()) !== 0) return "";
            const buildingId = res.id === "wood" ? "lumber_mill" : "quarry";
            const buildingName = res.id === "wood" ? "Lumber Mill" : "Stone Quarry";
            const pb = state.buildings.find((b) => b.buildingId === buildingId);
            if (!pb || pb.level === 0) {
              return `No ${res.id} production! Build a ${buildingName} in the Buildings page.`;
            }
            if (pb.damaged) {
              return `No ${res.id} production — your ${buildingName} is damaged. Repair it in the Buildings page.`;
            }
            return "";
          };
          const hasDropdown = () => res.id === "food" || noProductionMessage() !== "";
          return (
            <div
              class="resource-item"
              classList={{ "has-dropdown": hasDropdown() }}
              tabIndex={hasDropdown() ? 0 : undefined}
            >
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
                        // A pot currently simmering this dish counts, even from an empty larder.
                        return stock > 0 || rate > 0 || (cookingRates().produce[fi.id] ?? 0) > 0 || isCooking(fi.id);
                      });
                      return (
                        <Show when={visibleItems().length > 0}>
                          <div class="dropdown-category-header">{cat.icon} {cat.label}</div>
                          <For each={visibleItems()}>
                            {(fi) => {
                              const stock = () => Math.floor(state.foods?.[fi.id] ?? 0);
                              const rate = () => foodBreakdown().find((s) => s.type === fi.id)?.rate ?? 0;
                              const cookRate = () => cookingRates().produce[fi.id] ?? 0;
                              const totalRate = () => rate() + cookRate();
                              return (
                                <div class="dropdown-row">
                                  <span style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                                    <FoodIcon id={fi.id} size={16} /> {fi.label}
                                  </span>
                                  <span style={{ display: "flex", gap: "8px", "align-items": "center" }}>
                                    <span style={{ color: "var(--text-primary)" }}>{stock()}</span>
                                    <Show when={cookRate() > 0} fallback={
                                      <Show when={rate() > 0} fallback={
                                        <span style={{ "min-width": "64px", "text-align": "right", color: "var(--text-muted)", "font-size": "0.72rem", "white-space": "nowrap" }}>
                                          {isCooking(fi.id) ? `⏸ ${cookStallReason(fi.id) || "paused"}` : "(dormant)"}
                                        </span>
                                      }>
                                        <span class="rate-positive" style={{ "min-width": "64px", "text-align": "right" }}>+{rate()}/h</span>
                                      </Show>
                                    }>
                                      {/* Simmering: show the production rate and how long the
                                          larder will keep the fire fed (this line only). */}
                                      <span class="rate-positive" style={{ "text-align": "right", color: "var(--accent-gold)", "white-space": "nowrap" }}>
                                        🔥 +{Math.round(totalRate())}/h{cookLeftLabel(cookingRates().hoursLeft[fi.id] ?? Infinity)}
                                      </span>
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

              <Show when={noProductionMessage()}>
                <div class="resource-dropdown">
                  <div class="dropdown-row" style={{ color: "var(--accent-gold)" }}>
                    {noProductionMessage()}
                  </div>
                </div>
              </Show>
            </div>
          );
        }}
      </For>
      <Show when={
        state.wool > 0 || state.fiber > 0 || state.leather > 0 || state.iron > 0 || state.gems > 0
        || (state.herbs && Object.values(state.herbs).some((v) => (v as number) > 0))
      }>
        <div class="resource-item has-dropdown">
          <span class="resource-icon">🧵</span>
          <span class="resource-amount">{Math.floor(state.wool) + Math.floor(state.fiber) + Math.floor(state.leather ?? 0) + Math.floor(state.iron)}</span>
          <div class="resource-dropdown">
            <div class="dropdown-title">Crafting Materials</div>
            {(() => {
              const cap = craftingMaterialCap(state.buildings);
              return (
                <>
                  <div class="dropdown-row">
                    <span>🐑 Wool</span>
                    <span>{Math.floor(state.wool)}/{cap}</span>
                  </div>
                  <div class="dropdown-row">
                    <span>🪻 Fiber</span>
                    <span>{Math.floor(state.fiber)}/{cap}</span>
                  </div>
                  <div class="dropdown-row">
                    <span>🐄 Leather</span>
                    <span>{Math.floor(state.leather ?? 0)}/{cap}</span>
                  </div>
                  <div class="dropdown-row">
                    <span>⚒️ Iron</span>
                    <span>{Math.floor(state.iron)}/{cap}</span>
                  </div>
                </>
              );
            })()}
            <Show when={state.gems > 0}>
              <div class="dropdown-row">
                <span>💎 Gems</span>
                <span>{state.gems}</span>
              </div>
            </Show>
            <Show when={state.herbs && Object.values(state.herbs).some((v) => (v as number) > 0)}>
              <div class="dropdown-category-header">🌿 Herbs</div>
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
            </Show>
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

      <Show when={state.clothing > 0 || actions.getClothingInfo().needed > 0 || actions.getAleInfo().cap > 0}>
        {(() => {
          const clothing = () => actions.getClothingInfo();
          const ale = () => actions.getAleInfo();
          const hasClothing = () => clothing().needed > 0 || clothing().current > 0;
          const hasAle = () => ale().cap > 0;
          const aleNet = () => {
            const a = ale();
            const eff = (a.current <= 0 && a.production <= 0) ? 0 : a.consumption;
            return a.production - eff;
          };
          // Red only when something *vital* is unmet. Clothing is vital
          // (citizens need to stay warm / survive winter). Ale is a happiness
          // luxury — its rate indicator inside the dropdown is enough; not
          // having any ale shouldn't flag the comforts pill as a warning.
          const allMet = () =>
            (!hasClothing() || clothing().current >= clothing().needed);
          return (
            <div class="resource-item has-dropdown" tabIndex={0}>
              <span class="resource-icon">🛍️</span>
              {/* Total stockpile (clothing + ale units). Red when something
                  isn't met — matches the at-a-glance pattern of every other
                  resource pill, with the warning preserved as colour. */}
              <span class="resource-amount" style={{
                color: allMet() ? undefined : "var(--accent-red)",
              }}>
                {(clothing().current + ale().current).toLocaleString()}
              </span>
              <div class="resource-dropdown">
                <div class="dropdown-title">Comforts</div>
                <Show when={hasClothing()}>
                  <div class="dropdown-row">
                    <span>👕 Clothing</span>
                    <span style={{
                      color: clothing().current >= clothing().needed ? "var(--accent-green)" : "var(--accent-red)",
                    }}>
                      {clothing().current}/{clothing().needed}
                    </span>
                  </div>
                </Show>
                <Show when={hasAle()}>
                  <div class="dropdown-row">
                    <span>🍺 Ale</span>
                    <span>
                      {ale().current}/{ale().cap}
                      <Show when={aleNet() !== 0}>
                        <span classList={{
                          "rate-positive": aleNet() > 0,
                          "rate-negative": aleNet() < 0,
                        }} style={{ "margin-left": "6px", "font-size": "0.72rem" }}>
                          {aleNet() >= 0 ? "+" : ""}{aleNet()}/h
                        </span>
                      </Show>
                    </span>
                  </div>
                </Show>
              </div>
            </div>
          );
        })()}
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
      {/* Happiness — moved here to sit on the right next to the citizen count */}
      <div class="resource-item has-dropdown happiness-display">
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
      <div class="resource-item pop-display has-dropdown" tabIndex={0}>
        <span class="resource-icon">👤</span>
        <span class="resource-amount">
          {totalPopulation(state.citizens)}/{actions.getMaxPopulation()}
        </span>
        <div class="resource-dropdown">
          <div class="dropdown-title">Citizens</div>
          <div class="dropdown-row">
            <span>👶 Toddlers</span>
            <span>{state.citizens.toddlers}</span>
          </div>
          <div class="dropdown-row">
            <span>🧒 Children</span>
            <span>{state.citizens.children}</span>
          </div>
          <div class="dropdown-row">
            <span>🧑 Adults</span>
            <span>{state.citizens.adults}</span>
          </div>
          <div class="dropdown-row">
            <span>👵 Elderly</span>
            <span>{state.citizens.elderly}</span>
          </div>
          <div class="dropdown-row dropdown-total">
            <span>Total</span>
            <span>{totalPopulation(state.citizens)}</span>
          </div>
          <div class="dropdown-row" style={{ color: "var(--text-muted)", "font-size": "0.75rem", "margin-top": "4px", "font-style": "italic" }}>
            Adults are the labor and military pool. Children, toddlers,
            and elderly contribute differently to food and growth.
          </div>
        </div>
      </div>
    </div>
  );
}
