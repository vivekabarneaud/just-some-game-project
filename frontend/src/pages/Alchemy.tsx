import { For, Show, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import { HERBS } from "@medieval-realm/shared/data/herbs";
import { ALCHEMY_RECIPES, getAvailableAlchemyRecipes, getDiscoverableRecipes, RESEARCH_BASE_COST } from "@medieval-realm/shared/data/alchemy_recipes";
import { getPotionInfo, getMaterial } from "@medieval-realm/shared/data/items";
import { BUILDINGS, getRepairCost } from "~/data/buildings";
import Countdown from "~/components/Countdown";
import RecipeCard from "~/components/RecipeCard";
import PotionEffects from "~/components/PotionEffects";
import { formatTimeShort as formatTime } from "~/utils/format";
import { playSound } from "~/engine/sounds";

export default function Alchemy() {
  const { state, actions } = useGame();
  const [researchResult, setResearchResult] = createSignal<string | null>(null);

  const labLevel = () => state.buildings.find((b) => b.buildingId === "alchemy_lab")?.level ?? 0;
  const labDamaged = () => state.buildings.find((b) => b.buildingId === "alchemy_lab")?.damaged ?? false;
  const repairCost = () => {
    const def = BUILDINGS.find((b) => b.id === "alchemy_lab");
    return def ? getRepairCost(def, labLevel()) : { wood: 0, stone: 0 };
  };
  const canRepair = () => state.resources.wood >= repairCost().wood && state.resources.stone >= repairCost().stone;

  const availableRecipes = () => getAvailableAlchemyRecipes(labLevel(), state.discoveredRecipes ?? []);

  const lockedRecipes = () => ALCHEMY_RECIPES.filter((r) =>
    r.minLabLevel > labLevel() || (!r.starterRecipe && !(state.discoveredRecipes ?? []).includes(r.id))
  ).filter((r) => !availableRecipes().some((a) => a.id === r.id));

  const activeCrafts = () => state.craftingQueue.filter((c) =>
    ALCHEMY_RECIPES.some((r) => r.id === c.recipeId)
  );

  // How many of an ingredient the player has. Recipes may cost herbs, exotics,
  // or materials (e.g. tusk_shard) — resolve across all three buckets.
  const have = (id: string) =>
    state.herbs?.[id] ?? state.exotics?.[id] ?? (state.inventory.find((i) => i.itemId === id)?.quantity ?? 0);

  // Display name + icon for an ingredient, herb or material.
  const ingredientMeta = (id: string): { name: string; icon: string } => {
    const herb = HERBS.find((h) => h.id === id);
    if (herb) return { name: herb.name, icon: herb.icon };
    const mat = getMaterial(id);
    if (mat) return { name: mat.name, icon: mat.icon };
    return { name: id, icon: "" };
  };

  const canCraft = (recipeId: string, qty: number = 1) => {
    if (labDamaged()) return false;
    const recipe = ALCHEMY_RECIPES.find((r) => r.id === recipeId);
    if (!recipe || recipe.minLabLevel > labLevel()) return false;
    if (activeCrafts().length >= labLevel() + 1) return false;
    for (const cost of recipe.costs) {
      if (have(cost.resource) < cost.amount * qty) return false;
    }
    return true;
  };

  const maxBrewable = (recipeId: string): number => {
    const recipe = ALCHEMY_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return 0;
    let max = 99;
    for (const cost of recipe.costs) {
      max = Math.min(max, Math.floor(have(cost.resource) / cost.amount));
    }
    return Math.max(1, max);
  };

  const brewDisabledReason = (recipeId: string, qty: number): string | null => {
    if (labDamaged()) return "Lab is damaged";
    const recipe = ALCHEMY_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return "Recipe not found";
    if (recipe.minLabLevel > labLevel()) return `Requires Lab Lv.${recipe.minLabLevel}`;
    if (activeCrafts().length >= labLevel() + 1) return "Brewing queue full. Upgrade the Lab to brew more.";
    // Name the material when exactly one is short; generic note when several.
    const missing: string[] = [];
    for (const cost of recipe.costs) {
      if (have(cost.resource) < cost.amount * qty) missing.push(ingredientMeta(cost.resource).name);
    }
    if (missing.length === 1) return `Not enough ${missing[0]}`;
    if (missing.length > 1) return "Not enough materials";
    return null;
  };

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
    <div style={{ position: "relative", "min-height": "calc(100vh - var(--topbar-height))", overflow: "hidden" }}>
      {/* Immersive background — absolute within page content, not fixed over sidebar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        "z-index": 0, "pointer-events": "none",
      }}>
        <img
          src="https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/alchemy_lab.png"
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
            <A href="/buildings#building-alchemy_lab" style={{ color: "var(--accent-gold)" }}>
              Go to Buildings →
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
            <span>Brewing: {activeCrafts().length}/{labLevel() + 1}</span>
            <span style={{ "border-left": "1px solid var(--border-default)", "padding-left": "12px" }}>Herbs:</span>
            <For each={HERBS}>
              {(herb) => (
                <span style={{ color: have(herb.id) > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {herb.icon} {have(herb.id)}
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
              display: "flex", "align-items": "center", "justify-content": "space-between", gap: "10px", "flex-wrap": "wrap",
            }}>
              <span>Lab is damaged. Brewing is disabled until it is repaired.</span>
              <button
                class="upgrade-btn"
                disabled={!canRepair()}
                onClick={() => { if (actions.repairBuilding("alchemy_lab")) playSound("build"); }}
                title={canRepair() ? undefined : "Not enough wood or stone"}
                style={{ "font-size": "0.8rem", padding: "4px 12px", "white-space": "nowrap", opacity: canRepair() ? "1" : "0.5", cursor: canRepair() ? "pointer" : "not-allowed" }}
              >
                🔧 Repair (🪵{repairCost().wood} 🪨{repairCost().stone})
              </button>
            </div>
          </Show>

          {/* Research panel — prominent, full-width */}
          <div style={{
            padding: "16px 20px", "margin-bottom": "20px",
            background: "rgba(30, 30, 50, 0.85)",
            "border-radius": "8px",
            border: "1px solid rgba(138, 122, 62, 0.4)",
            "backdrop-filter": "blur(4px)",
            display: "flex", gap: "20px", "align-items": "center", "flex-wrap": "wrap",
          }}>
            <div style={{ flex: "1 1 200px" }}>
              <div style={{ "font-family": "var(--font-heading)", "font-size": "1rem", color: "var(--text-primary)", "margin-bottom": "4px" }}>
                📜 Daily Research
              </div>
              <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)" }}>
                <Show when={discoverable().length > 0} fallback={
                  <span>All available recipes discovered!</span>
                }>
                  {discoverable().length} recipe{discoverable().length > 1 ? "s" : ""} left to discover.
                  Spend <span style={{ color: "var(--accent-gold)" }}>{RESEARCH_BASE_COST}g</span> to attempt a breakthrough.
                </Show>
              </div>
              <Show when={!state.alchemyResearchAvailable}>
                <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-top": "4px" }}>
                  Already researched today. Resets at 3 AM UTC.
                </div>
              </Show>
              <Show when={researchResult()}>
                <div style={{
                  "margin-top": "8px", padding: "6px 10px",
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
            <button
              class="upgrade-btn"
              disabled={!canResearch()}
              onClick={doResearch}
            >
              🔬 Research ({RESEARCH_BASE_COST}g)
            </button>
          </div>

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
                        {recipe()?.image
                          ? <img src={recipe()!.image} alt="" style={{ width: "28px", height: "28px", "object-fit": "cover", "border-radius": "4px" }} />
                          : <span style={{ "font-size": "1.2rem" }}>{recipe()?.icon}</span>
                        }
                        <span style={{ color: "var(--text-primary)" }}>
                          {recipe()?.name}
                          {(craft.quantity ?? 1) > 1 && <span style={{ color: "var(--accent-gold)", "margin-left": "4px" }}>×{craft.quantity}</span>}
                        </span>
                        <span style={{ color: "var(--accent-gold)" }}>
                          <Countdown remainingSeconds={craft.remaining} />
                          {(craft.quantity ?? 1) > 1 && <span style={{ color: "var(--text-muted)", "margin-left": "6px" }}>({craft.quantity} left)</span>}
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
                    <RecipeCard
                      icon={recipe.icon}
                      image={recipe.image}
                      title={recipe.name}
                      subtitle={`${formatTime(recipe.craftTime)} · ${recipe.tier}`}
                      info={
                        <div style={{ "margin-top": "4px", padding: "6px 10px", background: "var(--bg-primary)", "border-radius": "4px", "font-size": "0.75rem", color: "var(--accent-green)" }}>
                          <PotionEffects itemId={recipe.id} fallback={recipe.description} />
                          {(() => {
                            const info = getPotionInfo(recipe.id);
                            const hasMission = !!info?.mission;
                            const hasCombat = !!info?.combat;
                            const hasRecovery = !!info?.recovery;
                            let label = "";
                            let color = "var(--accent-blue)";
                            if (hasRecovery) { label = "❤️‍🩹 Recovery"; color = "var(--accent-blue)"; }
                            else if (hasMission && hasCombat) { label = "📋 Any mission"; color = "var(--accent-blue)"; }
                            else if (hasCombat) { label = "⚔️ Combat only"; color = "var(--accent-red)"; }
                            else if (hasMission) { label = "📋 Non-combat only"; color = "var(--accent-blue)"; }
                            return (
                              <div style={{ "margin-top": "3px", "font-size": "0.65rem", color }}>
                                {label}
                              </div>
                            );
                          })()}
                        </div>
                      }
                      costs={
                        <>
                          Cost:{" "}
                          {recipe.costs.map((c) => {
                            const meta = ingredientMeta(c.resource);
                            const held = have(c.resource);
                            const enough = held >= c.amount;
                            return (
                              <span style={{ color: enough ? "var(--text-secondary)" : "var(--accent-red)", "margin-right": "6px" }}>
                                {meta.icon} {c.amount} {meta.name}
                                <span style={{ color: "var(--text-muted)" }}> ({held})</span>
                              </span>
                            );
                          })}
                        </>
                      }
                      action={{
                        type: "craft",
                        maxQty: () => maxBrewable(recipe.id),
                        canCraft: (qty) => canCraft(recipe.id, qty),
                        disabledReason: (qty) => brewDisabledReason(recipe.id, qty),
                        // Finger-snap placeholder: the bubbles clip doesn't read as brewing.
                        // Swap back to a proper bubbling SFX once we have one.
                        onCraft: (qty) => { playSound("nav"); actions.startAlchemyCraft(recipe.id, qty); },
                        verb: "Brew",
                        silentClick: true,
                      }}
                    />
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
                        <div class="building-card dimmed">
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

            {/* Potion stock sidebar */}
            <div style={{ flex: "0 0 280px", "min-width": "250px" }}>
              <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
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
                              padding: "6px 0", "border-bottom": "1px solid var(--border-default)",
                              "font-size": "0.85rem",
                            }}>
                              <div>
                                <span>{recipe.icon} {recipe.name}</span>
                                <div style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>{recipe.description}</div>
                              </div>
                              <span style={{ color: "var(--accent-gold)", "font-weight": "bold" }}>x{inv.quantity}</span>
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
