import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useGame, CRAFTING_RECIPES } from "~/engine/gameState";
import { getItemByRecipe } from "~/data/items";
import Countdown from "~/components/Countdown";
import Tooltip from "~/components/Tooltip";

/** Split item description into stats and flavor text */
function splitDescription(desc: string): { stats: string; flavor: string | null } {
  // Descriptions like "+3 STR, +1 DEX. Crude but effective."
  // Split at the first ". " that follows a stat-like pattern
  const match = desc.match(/^([^.]*(?:\+\d|DEF|duration)[^.]*)\.\s*(.+)$/);
  if (match) return { stats: match[1], flavor: match[2] };
  // No flavor — entire string is stats
  return { stats: desc, flavor: null };
}

interface CraftingPageProps {
  title: string;
  buildingId: string;
  buildingName: string;
  icon: string;
  /** Extra materials to show in the header */
  materials: { icon: string; label: string; value: () => number }[];
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function CraftingPage(props: CraftingPageProps) {
  const { state, actions } = useGame();

  const building = () => state.buildings.find((b) => b.buildingId === props.buildingId);
  const buildingLevel = () => building()?.level ?? 0;

  const recipes = () => CRAFTING_RECIPES.filter((r) => {
    return r.building === props.buildingId && buildingLevel() >= r.minLevel;
  });

  const lockedRecipes = () => CRAFTING_RECIPES.filter((r) => {
    return r.building === props.buildingId && buildingLevel() < r.minLevel;
  });

  const activeCrafts = () => state.craftingQueue.filter((c) => {
    const r = CRAFTING_RECIPES.find((cr) => cr.id === c.recipeId);
    return r?.building === props.buildingId;
  });

  const canCraft = (recipeId: string) => !craftDisabledReason(recipeId);

  const craftDisabledReason = (recipeId: string): string | null => {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return "Recipe not found";
    const b = building();
    if (!b || b.level < recipe.minLevel) return `Requires ${props.buildingName} Lv.${recipe.minLevel}`;
    if (b.damaged) return "Building is damaged";
    const slotsUsed = activeCrafts().length;
    if (slotsUsed >= b.level) return `Queue full — upgrade ${props.buildingName} for more slots`;
    for (const cost of recipe.costs) {
      if (cost.resource === "wool" && state.wool < cost.amount) return "Not enough wool";
      if (cost.resource === "fiber" && state.fiber < cost.amount) return "Not enough fiber";
      if (cost.resource === "iron" && state.iron < cost.amount) return "Not enough iron";
      if (cost.resource === "leather" && state.leather < cost.amount) return "Not enough leather";
      if (cost.resource === "gold" && state.resources.gold < cost.amount) return "Not enough gold";
      if (cost.resource === "wood" && state.resources.wood < cost.amount) return "Not enough wood";
      if (cost.resource === "stone" && state.resources.stone < cost.amount) return "Not enough stone";
      if (cost.resource === "food" && state.resources.food < cost.amount) return "Not enough food";
      if (cost.resource === "astralShards" && state.astralShards < cost.amount) return "Not enough astral shards";
    }
    return null;
  };

  return (
    <div>
      <h1 class="page-title">{props.icon} {props.title}</h1>

      <Show when={buildingLevel() === 0}>
        <div style={{
          padding: "24px",
          background: "var(--bg-secondary)",
          "border-radius": "8px",
          "text-align": "center",
          color: "var(--text-muted)",
        }}>
          <div style={{ "font-size": "2rem", "margin-bottom": "8px" }}>{props.icon}</div>
          <p>Build the {props.buildingName} to unlock crafting recipes.</p>
          <A href={`/buildings/${props.buildingId}`} style={{ color: "var(--accent-gold)" }}>
            Go to building →
          </A>
        </div>
      </Show>

      <Show when={buildingLevel() > 0}>
        {/* Materials header */}
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
          <span>{props.buildingName} Lv.{buildingLevel()}</span>
          <span>Slots: {activeCrafts().length}/{buildingLevel()}</span>
          <For each={props.materials}>
            {(mat) => <span>{mat.icon} {mat.label}: {mat.value()}</span>}
          </For>
        </div>

        <Show when={building()?.damaged}>
          <div style={{
            padding: "10px",
            "margin-bottom": "16px",
            background: "rgba(231, 76, 60, 0.1)",
            border: "1px solid var(--accent-red)",
            "border-radius": "6px",
            color: "var(--accent-red)",
            "font-size": "0.85rem",
          }}>
            Building is damaged — crafting disabled until repaired.{" "}
            <A href={`/buildings/${props.buildingId}`} style={{ color: "var(--accent-gold)" }}>Repair →</A>
          </div>
        </Show>

        <div style={{ display: "flex", gap: "20px", "align-items": "flex-start" }}>
          {/* Recipes */}
          <div style={{ flex: 1 }}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
              Recipes
            </h3>
            <div class="buildings-grid">
              <For each={recipes()}>
                {(recipe) => (
                  <div class="building-card">
                    <div class="building-card-header">
                      <div class="building-card-icon">{recipe.icon}</div>
                      <div>
                        <div class="building-card-title">{recipe.name}</div>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                          {formatTime(recipe.craftTime)} · +{recipe.produces.amount}x {recipe.produces.resource}
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const item = getItemByRecipe(recipe.id);
                      if (!item) return null;
                      const { stats, flavor } = splitDescription(item.description);
                      return (
                        <div style={{ "margin-top": "4px", padding: "4px 8px", background: "var(--bg-primary)", "border-radius": "4px", "font-size": "0.75rem" }}>
                          <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
                            {stats.split(", ").map((s) => (
                              <span style={{ color: "var(--accent-green)" }}>{s.trim()}</span>
                            ))}
                          </div>
                          {item.classes.length > 0 && (
                            <div style={{ color: "var(--text-muted)", "margin-top": "3px", "font-size": "0.7rem" }}>
                              {item.classes.join(", ")}
                            </div>
                          )}
                          {item.consumable && <div style={{ color: "var(--accent-gold)", "margin-top": "2px", "font-size": "0.7rem" }}>consumable</div>}
                          {flavor && (
                            <div style={{ color: "var(--text-muted)", "font-style": "italic", "margin-top": "4px", "font-size": "0.7rem" }}>
                              {flavor}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div style={{ "margin-top": "6px", "font-size": "0.8rem", color: "var(--text-secondary)" }}>
                      Cost: {recipe.costs.map((c) => `${c.amount} ${c.resource}`).join(", ")}
                    </div>
                    <Tooltip text={craftDisabledReason(recipe.id)} position="bottom">
                      <button
                        class="upgrade-btn"
                        disabled={!canCraft(recipe.id)}
                        onClick={() => actions.startCraft(recipe.id)}
                        style={{ "margin-top": "auto", "padding-top": "8px", "font-size": "0.85rem", padding: "6px 14px" }}
                      >
                        Craft
                      </button>
                    </Tooltip>
                  </div>
                )}
              </For>
            </div>
            <Show when={recipes().length === 0}>
              <div style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
                No recipes unlocked yet. Upgrade the {props.buildingName} for more.
              </div>
            </Show>

            <Show when={lockedRecipes().length > 0}>
              <h3 style={{ "font-family": "var(--font-heading)", "margin-top": "20px", "margin-bottom": "8px", color: "var(--text-muted)" }}>
                Locked Recipes
              </h3>
              <div class="buildings-grid">
                <For each={lockedRecipes()}>
                  {(recipe) => (
                    <div class="building-card" style={{ opacity: 0.5 }}>
                      <div class="building-card-header">
                        <div class="building-card-icon">{recipe.icon}</div>
                        <div>
                          <div class="building-card-title">{recipe.name}</div>
                          <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                            +{recipe.produces.amount}x {recipe.produces.resource}
                          </div>
                        </div>
                      </div>
                      {(() => {
                        const item = getItemByRecipe(recipe.id);
                        if (!item) return null;
                        const { stats, flavor } = splitDescription(item.description);
                        return (
                          <div style={{ "margin-top": "4px", padding: "4px 8px", background: "var(--bg-primary)", "border-radius": "4px", "font-size": "0.75rem" }}>
                            <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
                              {stats.split(", ").map((s) => (
                                <span style={{ color: "var(--accent-green)" }}>{s.trim()}</span>
                              ))}
                            </div>
                            {item.classes.length > 0 && (
                              <div style={{ color: "var(--text-muted)", "margin-top": "3px", "font-size": "0.7rem" }}>
                                {item.classes.join(", ")}
                              </div>
                            )}
                            {flavor && (
                              <div style={{ color: "var(--text-muted)", "font-style": "italic", "margin-top": "4px", "font-size": "0.7rem" }}>
                                {flavor}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      <div style={{ "margin-top": "6px", "font-size": "0.8rem", color: "var(--text-secondary)" }}>
                        Cost: {recipe.costs.map((c) => `${c.amount} ${c.resource}`).join(", ")}
                      </div>
                      <div style={{
                        "margin-top": "auto",
                        "padding-top": "6px",
                      }}>
                        <div style={{
                          padding: "4px 8px",
                          "border-radius": "4px",
                          background: "rgba(245, 197, 66, 0.1)",
                          border: "1px solid var(--accent-gold)",
                          "font-size": "0.75rem",
                          color: "var(--accent-gold)",
                        }}>
                          Requires {props.buildingName} Lv.{recipe.minLevel}
                          {buildingLevel() > 0 && ` (currently Lv.${buildingLevel()})`}
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <div style={{
              "margin-top": "16px",
              padding: "8px 12px",
              "border-radius": "6px",
              background: "rgba(167, 139, 250, 0.08)",
              border: "1px solid rgba(167, 139, 250, 0.2)",
              color: "#a78bfa",
              "font-size": "0.8rem",
            }}>
              Some rare recipes can be discovered during adventurer missions.
            </div>
          </div>

          {/* Queue */}
          <div style={{ "min-width": "220px", "max-width": "280px" }}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
              In Progress
            </h3>
            <Show when={activeCrafts().length === 0}>
              <div style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>No active crafts</div>
            </Show>
            <For each={activeCrafts()}>
              {(craft) => {
                const recipe = () => CRAFTING_RECIPES.find((r) => r.id === craft.recipeId);
                return (
                  <div style={{
                    padding: "8px 10px",
                    "margin-bottom": "6px",
                    background: "var(--bg-secondary)",
                    "border-radius": "6px",
                    border: "1px solid var(--border-default)",
                  }}>
                    <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                      <span>{recipe()?.icon}</span>
                      <span style={{ "font-size": "0.85rem", color: "var(--text-primary)" }}>{recipe()?.name}</span>
                    </div>
                    <div style={{ color: "var(--accent-blue)", "font-size": "0.8rem", "margin-top": "4px" }}>
                      <Countdown remainingSeconds={craft.remaining} />
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
