import { For, Show } from "solid-js";
import { RESOURCES } from "~/data/resources";
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
