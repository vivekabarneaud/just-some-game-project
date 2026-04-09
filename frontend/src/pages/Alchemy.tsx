import { For, Show, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { HERBS } from "~/data/herbs";
import { ALCHEMY_RECIPES, getAvailableAlchemyRecipes, getDiscoverableRecipes, RESEARCH_BASE_COST } from "~/data/alchemy_recipes";
import Countdown from "~/components/Countdown";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function Alchemy() {
  const { state, actions } = useGame();
  const [researchResult, setResearchResult] = createSignal<string | null>(null);

  const labLevel = () => state.buildings.find((b) => b.buildingId === "alchemy_lab")?.level ?? 0;
  const labDamaged = () => state.buildings.find((b) => b.buildingId === "alchemy_lab")?.damaged ?? false;

  const availableRecipes = () => getAvailableAlchemyRecipes(labLevel(), state.discoveredRecipes ?? []);

  const lockedRecipes = () => ALCHEMY_RECIPES.filter((r) =>
    r.minLabLevel > labLevel() || (!r.starterRecipe && !(state.discoveredRecipes ?? []).includes(r.id))
  ).filter((r) => !availableRecipes().some((a) => a.id === r.id));

  const activeCrafts = () => state.craftingQueue.filter((c) =>
    ALCHEMY_RECIPES.some((r) => r.id === c.recipeId)
  );

  const canCraft = (recipeId: string) => {
    if (labDamaged()) return false;
    const recipe = ALCHEMY_RECIPES.find((r) => r.id === recipeId);
    if (!recipe || recipe.minLabLevel > labLevel()) return false;
    if (activeCrafts().length >= labLevel()) return false;
    for (const cost of recipe.costs) {
      if ((state.herbs?.[cost.resource] ?? 0) < cost.amount) return false;
    }
    return true;
  };

  const herbCount = (id: string) => state.herbs?.[id] ?? 0;

  const discoverable = () => getDiscoverableRecipes(labLevel(), state.discoveredRecipes ?? []);
  const canResearch = () =>
    state.alchemyResearchAvailable &&
    state.resources.gold >= RESEARCH_BASE_COST &&
    discoverable().length > 0 &&
    !labDamaged();

  const doResearch = () => {
    const before = [...(state.discoveredRecipes ?? [])];
    const success = actions.startAlchemyResearch();
    if (success) {
      const after = state.discoveredRecipes ?? [];
      const newRecipe = after.find((id: string) => !before.includes(id));
      if (newRecipe) {
        const recipe = ALCHEMY_RECIPES.find((r) => r.id === newRecipe);
        setResearchResult(`Discovered: ${recipe?.icon} ${recipe?.name}!`);
      } else {
        setResearchResult("No discovery this time. Try again tomorrow.");
      }
      setTimeout(() => setResearchResult(null), 5000);
    }
  };

  return (
    <div style={{ position: "relative", "min-height": "calc(100vh - 60px)", overflow: "hidden" }}>
      {/* Immersive background */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        "z-index": 0, "pointer-events": "none",
      }}>
        <img
          src="/images/buildings/alchemy_lab.png"
          alt=""
          style={{ width: "100%", height: "100%", "object-fit": "cover", "object-position": "center 30%", opacity: "0.25" }}
        />
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(to bottom, rgba(26, 26, 46, 0.9) 0%, rgba(26, 26, 46, 0.4) 30%, rgba(26, 26, 46, 0.7) 100%)",
        }} />
      </div>

      <div style={{ position: "relative", "z-index": 1, padding: "0 16px 32px" }}>
        <h1 class="page-title">🧪 Alchemy Lab</h1>

        <Show when={labLevel() === 0}>
          <div style={{
            padding: "24px",
            background: "var(--bg-secondary)",
            "border-radius": "8px",
            "text-align": "center",
            color: "var(--text-muted)",
          }}>
            <div style={{ "font-size": "2rem", "margin-bottom": "8px" }}>🧪</div>
            <p>Build the Alchemy Lab to unlock potion brewing.</p>
            <A href="/buildings/alchemy_lab" style={{ color: "var(--accent-gold)" }}>
              Go to building →
            </A>
          </div>
        </Show>

        <Show when={labLevel() > 0}>
          {/* Header bar */}
          <div style={{
            display: "flex", gap: "16px", "margin-bottom": "16px",
            padding: "10px 14px", background: "rgba(30, 30, 50, 0.85)",
            "border-radius": "6px", "font-size": "0.85rem",
            color: "var(--text-secondary)", "flex-wrap": "wrap",
            "backdrop-filter": "blur(4px)",
            "align-items": "center",
          }}>
            <span>Lab Lv.{labLevel()}</span>
            <span>Brewing: {activeCrafts().length}/{labLevel()}</span>
            <span style={{ "border-left": "1px solid var(--border-default)", "padding-left": "12px" }}>Herbs:</span>
            <For each={HERBS}>
              {(herb) => (
                <span style={{ color: herbCount(herb.id) > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {herb.icon} {herbCount(herb.id)}
                </span>
              )}
            </For>
          </div>

          <Show when={labDamaged()}>
            <div style={{
              padding: "10px", "margin-bottom": "16px",
              background: "rgba(231, 76, 60, 0.1)",
              border: "1px solid var(--accent-red)",
              "border-radius": "6px", color: "var(--accent-red)", "font-size": "0.85rem",
            }}>
              Lab is damaged — brewing disabled until repaired.{" "}
              <A href="/buildings/alchemy_lab" style={{ color: "var(--accent-gold)" }}>Repair →</A>
            </div>
          </Show>

          {/* Active brews */}
          <Show when={activeCrafts().length > 0}>
            <div style={{ "margin-bottom": "20px" }}>
              <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
                Brewing
              </h3>
              <div style={{ display: "flex", gap: "10px", "flex-wrap": "wrap" }}>
                <For each={activeCrafts()}>
                  {(craft) => {
                    const recipe = () => ALCHEMY_RECIPES.find((r) => r.id === craft.recipeId);
                    return (
                      <div style={{
                        padding: "8px 14px", background: "rgba(30, 30, 50, 0.85)",
                        "border-radius": "6px", border: "1px solid var(--accent-gold)",
                        display: "flex", gap: "8px", "align-items": "center",
                        "font-size": "0.85rem", "backdrop-filter": "blur(4px)",
                      }}>
                        <span style={{ "font-size": "1.2rem" }}>{recipe()?.icon}</span>
                        <span style={{ color: "var(--text-primary)" }}>{recipe()?.name}</span>
                        <span style={{ color: "var(--accent-gold)" }}>
                          <Countdown remainingSeconds={craft.remaining} />
                        </span>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          </Show>

          <div style={{ display: "flex", gap: "20px", "align-items": "flex-start", "flex-wrap": "wrap" }}>
            {/* Recipes */}
            <div style={{ flex: "1 1 400px", "min-width": "300px" }}>
              <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
                Recipes
              </h3>
              <div class="buildings-grid">
                <For each={availableRecipes()}>
                  {(recipe) => (
                    <div class="building-card">
                      <div class="building-card-header">
                        <div class="building-card-icon">{recipe.icon}</div>
                        <div>
                          <div class="building-card-title">{recipe.name}</div>
                          <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                            {formatTime(recipe.craftTime)} · {recipe.tier}
                          </div>
                        </div>
                      </div>
                      <div style={{ "margin-top": "4px", padding: "4px 8px", background: "var(--bg-primary)", "border-radius": "4px", "font-size": "0.75rem" }}>
                        <span style={{ color: "var(--accent-green)" }}>{recipe.description}</span>
                      </div>
                      <div style={{ "margin-top": "6px", "font-size": "0.8rem", color: "var(--text-secondary)" }}>
                        Cost:{" "}
                        {recipe.costs.map((c) => {
                          const herb = HERBS.find((h) => h.id === c.resource);
                          const have = herbCount(c.resource);
                          const enough = have >= c.amount;
                          return (
                            <span style={{ color: enough ? "var(--text-secondary)" : "var(--accent-red)", "margin-right": "6px" }}>
                              {herb?.icon ?? ""} {c.amount} {herb?.name ?? c.resource}
                              <span style={{ color: "var(--text-muted)" }}> ({have})</span>
                            </span>
                          );
                        })}
                      </div>
                      <button
                        class="btn-primary"
                        disabled={!canCraft(recipe.id)}
                        onClick={() => actions.startAlchemyCraft(recipe.id)}
                        style={{ "margin-top": "8px", width: "100%" }}
                      >
                        Brew
                      </button>
                    </div>
                  )}
                </For>
              </div>

              {/* Locked recipes */}
              <Show when={lockedRecipes().length > 0}>
                <h4 style={{ "font-family": "var(--font-heading)", "margin-top": "20px", "margin-bottom": "8px", color: "var(--text-muted)" }}>
                  Undiscovered
                </h4>
                <div class="buildings-grid">
                  <For each={lockedRecipes()}>
                    {(recipe) => {
                      const needsLevel = recipe.minLabLevel > labLevel();
                      const needsResearch = !recipe.starterRecipe && !(state.discoveredRecipes ?? []).includes(recipe.id);
                      return (
                        <div class="building-card" style={{ opacity: 0.5 }}>
                          <div class="building-card-header">
                            <div class="building-card-icon">❓</div>
                            <div>
                              <div class="building-card-title" style={{ color: "var(--text-muted)" }}>
                                {needsLevel ? `Requires Lab Lv.${recipe.minLabLevel}` : "Undiscovered"}
                              </div>
                              <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                                {recipe.tier}
                                {needsResearch && !needsLevel && " · research to discover"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </div>

            {/* Research panel */}
            <div style={{ flex: "0 0 280px", "min-width": "250px" }}>
              <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
                Daily Research
              </h3>
              <div style={{
                padding: "16px", background: "rgba(30, 30, 50, 0.85)",
                "border-radius": "8px", border: "1px solid var(--border-default)",
                "backdrop-filter": "blur(4px)",
              }}>
                <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "12px" }}>
                  Spend <span style={{ color: "var(--accent-gold)" }}>{RESEARCH_BASE_COST}g</span> to attempt discovering a new recipe. One attempt per day.
                </div>
                <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "12px" }}>
                  <Show when={discoverable().length > 0} fallback={
                    <span>All available recipes discovered!</span>
                  }>
                    {discoverable().length} recipe{discoverable().length > 1 ? "s" : ""} left to discover
                  </Show>
                </div>
                <Show when={!state.alchemyResearchAvailable}>
                  <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "8px" }}>
                    Already researched today. Resets at 3 AM UTC.
                  </div>
                </Show>
                <button
                  class="btn-primary"
                  disabled={!canResearch()}
                  onClick={doResearch}
                  style={{ width: "100%" }}
                >
                  Research ({RESEARCH_BASE_COST}g)
                </button>
                <Show when={researchResult()}>
                  <div style={{
                    "margin-top": "10px", padding: "8px",
                    background: researchResult()!.startsWith("Discovered")
                      ? "rgba(46, 204, 113, 0.15)" : "rgba(255, 200, 50, 0.1)",
                    "border-radius": "4px", "font-size": "0.85rem",
                    color: researchResult()!.startsWith("Discovered")
                      ? "var(--accent-green)" : "var(--accent-gold)",
                  }}>
                    {researchResult()}
                  </div>
                </Show>
              </div>

              {/* Potion inventory */}
              <h3 style={{ "font-family": "var(--font-heading)", "margin-top": "20px", "margin-bottom": "8px", color: "var(--text-primary)" }}>
                Potion Stock
              </h3>
              <div style={{
                padding: "12px", background: "rgba(30, 30, 50, 0.85)",
                "border-radius": "8px", border: "1px solid var(--border-default)",
                "backdrop-filter": "blur(4px)",
              }}>
                {(() => {
                  const potionItems = state.inventory.filter((inv) =>
                    ALCHEMY_RECIPES.some((r) => r.id === inv.itemId) && inv.quantity > 0
                  );
                  return (
                    <Show when={potionItems.length > 0} fallback={
                      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                        No potions brewed yet.
                      </div>
                    }>
                      <For each={potionItems}>
                        {(inv) => {
                          const recipe = ALCHEMY_RECIPES.find((r) => r.id === inv.itemId);
                          return recipe ? (
                            <div style={{
                              display: "flex", "justify-content": "space-between", "align-items": "center",
                              padding: "4px 0", "border-bottom": "1px solid var(--border-default)",
                              "font-size": "0.85rem",
                            }}>
                              <span>{recipe.icon} {recipe.name}</span>
                              <span style={{ color: "var(--accent-gold)" }}>x{inv.quantity}</span>
                            </div>
                          ) : null;
                        }}
                      </For>
                    </Show>
                  );
                })()}
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
