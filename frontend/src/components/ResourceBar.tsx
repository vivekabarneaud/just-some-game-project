import { For } from "solid-js";
import { RESOURCES } from "~/data/resources";
import { useGame } from "~/engine/gameState";

export default function ResourceBar() {
  const { state, actions } = useGame();
  const rates = () => actions.getProductionRates();
  const foodCons = () => actions.getFoodConsumption();
  const caps = () => actions.getStorageCaps();

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
    if (id === "food") return base - foodCons();
    return base;
  };

  const isNearCap = (id: string) => getAmount(id) >= getCap(id) * 0.9;

  return (
    <div class="resource-bar">
      <For each={RESOURCES}>
        {(res) => {
          const rate = () => getRate(res.id);
          return (
            <div class="resource-item">
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
            </div>
          );
        }}
      </For>
      <div class="resource-item pop-display">
        <span class="resource-icon">👤</span>
        <span class="resource-amount">
          {Math.floor(state.population)}/{actions.getMaxPopulation()}
        </span>
      </div>
    </div>
  );
}
