import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useGame, CRAFTING_RECIPES } from "~/engine/gameState";
import Countdown from "~/components/Countdown";

export default function Crafting() {
  const { state, actions } = useGame();

  const recipes = () => actions.getAvailableRecipes();
  const activeCrafts = () => state.craftingQueue;
  const clothingInfo = () => actions.getClothingInfo();

  const canCraft = (recipeId: string) => {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;
    const building = state.buildings.find((b) => b.buildingId === recipe.building);
    if (!building || building.level < recipe.minLevel || building.damaged) return false;
    const activeCraftsForBuilding = state.craftingQueue.filter((c) => {
      const r = CRAFTING_RECIPES.find((cr) => cr.id === c.recipeId);
      return r?.building === recipe.building;
    }).length;
    if (activeCraftsForBuilding >= building.level) return false;
    for (const cost of recipe.costs) {
      if (cost.resource === "wool" && state.wool < cost.amount) return false;
      if (cost.resource === "fiber" && state.fiber < cost.amount) return false;
      if (cost.resource === "gold" && state.resources.gold < cost.amount) return false;
    }
    return true;
  };

  function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <div>
      <h1 class="page-title">Crafting</h1>

      {/* Materials overview */}
      <div style={{
        display: "flex",
        gap: "16px",
        "margin-bottom": "16px",
        padding: "10px 14px",
        background: "var(--bg-secondary)",
        "border-radius": "6px",
        "font-size": "0.85rem",
        color: "var(--text-secondary)",
        "flex-wrap": "wrap",
      }}>
        <span>🐑 Wool: {Math.floor(state.wool)}</span>
        <span>🪻 Fiber: {Math.floor(state.fiber)}</span>
        <span style={{
          color: clothingInfo().current >= clothingInfo().needed ? "var(--accent-green)" : "var(--accent-red)",
        }}>
          👕 Clothing: {clothingInfo().current}/{clothingInfo().needed} needed
        </span>
      </div>

      {/* Active crafts */}
      <Show when={activeCrafts().length > 0}>
        <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
          In Progress
        </h3>
        <div style={{ "margin-bottom": "20px" }}>
          <For each={activeCrafts()}>
            {(craft) => {
              const recipe = () => CRAFTING_RECIPES.find((r) => r.id === craft.recipeId);
              return (
                <div class="building-card" style={{ "margin-bottom": "8px" }}>
                  <div class="building-card-header">
                    <div class="building-card-icon">{recipe()?.icon}</div>
                    <div>
                      <div class="building-card-title">{recipe()?.name}</div>
                      <div style={{ color: "var(--accent-blue)", "font-size": "0.85rem" }}>
                        <Countdown remainingSeconds={craft.remaining} /> remaining
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      {/* Available recipes */}
      <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
        Recipes
      </h3>
      <Show when={recipes().length === 0}>
        <div style={{
          padding: "24px",
          background: "var(--bg-secondary)",
          "border-radius": "8px",
          "text-align": "center",
          color: "var(--text-muted)",
        }}>
          <p>No recipes available. Build a Tailoring Shop to start crafting!</p>
          <A href="/buildings/tailoring_shop" style={{ color: "var(--accent-gold)" }}>
            View Tailoring Shop →
          </A>
        </div>
      </Show>
      <div class="buildings-grid">
        <For each={recipes()}>
          {(recipe) => (
            <div class="building-card">
              <div class="building-card-header">
                <div class="building-card-icon">{recipe.icon}</div>
                <div>
                  <div class="building-card-title">{recipe.name}</div>
                  <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                    {formatTime(recipe.craftTime)} · Produces {recipe.produces.amount}x {recipe.produces.resource}
                  </div>
                </div>
              </div>
              <div style={{ "margin-top": "6px", "font-size": "0.8rem", color: "var(--text-secondary)" }}>
                Cost: {recipe.costs.map((c) => `${c.amount} ${c.resource}`).join(", ")}
              </div>
              <button
                class="upgrade-btn"
                disabled={!canCraft(recipe.id)}
                onClick={() => actions.startCraft(recipe.id)}
                style={{ "margin-top": "8px", "font-size": "0.85rem", padding: "6px 14px" }}
              >
                Craft
              </button>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
