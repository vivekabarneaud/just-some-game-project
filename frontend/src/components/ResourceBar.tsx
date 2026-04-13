import { For, Show } from "solid-js";
import { RESOURCES } from "~/data/resources";
import { HERBS } from "~/data/herbs";
import { useGame } from "~/engine/gameState";

export default function ResourceBar() {
  const { state, actions } = useGame();
  const rates = () => actions.getProductionRates();
  const foodCons = () => actions.getFoodConsumption();
  const animalCons = () => actions.getAnimalFoodConsumption();
  const caps = () => actions.getStorageCaps();
  const foodBreakdown = () => actions.getFoodBreakdown();

  const getAmount = (id: string) => {
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
                  <div class="dropdown-title">Food Sources</div>
                  <Show when={foodBreakdown().length > 0}>
                    <For each={foodBreakdown()}>
                      {(source) => (
                        <div class="dropdown-row">
                          <span>{source.icon} {source.label}</span>
                          <span class="rate-positive">+{source.rate}/h</span>
                        </div>
                      )}
                    </For>
                  </Show>
                  <Show when={foodBreakdown().length === 0}>
                    <div class="dropdown-row" style={{ color: "var(--text-muted)" }}>No food production</div>
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
      <Show when={state.wool > 0 || state.fiber > 0 || state.leather > 0 || state.iron > 0 || state.gems > 0 || state.honey > 0 || state.fruit > 0}>
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
            <Show when={state.honey > 0}>
              <div class="dropdown-row">
                <span>🍯 Honey</span>
                <span>{Math.floor(state.honey)}</span>
              </div>
            </Show>
            <Show when={state.fruit > 0}>
              <div class="dropdown-row">
                <span>🍎 Fruit</span>
                <span>{Math.floor(state.fruit)}</span>
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
