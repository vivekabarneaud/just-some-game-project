import { For, Show, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { useGame, CRAFTING_RECIPES, getBuildingToolsForBuilding, getBuildingTool, getRequiredTool } from "~/engine/gameState";
import { getItemByRecipe } from "~/data/items";
import { BUILDINGS } from "~/data/buildings";
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

/** Display-friendly name for produced resource */
function formatResource(resource: string, buildingId: string): string {
  if (resource === "potions" && buildingId === "kitchen") return "meal";
  return resource;
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

  const installedToolIds = () => state.buildingTools?.[props.buildingId] ?? [];
  const availableTools = () => getBuildingToolsForBuilding(props.buildingId);
  const hasToolSlots = () => availableTools().length > 0;

  // Recipes where building level is met (includes both tool-available and tool-locked)
  // Unlocked recipes first, tool-locked at the end
  const recipes = () => {
    const ids = installedToolIds();
    return CRAFTING_RECIPES
      .filter((r) => r.building === props.buildingId && buildingLevel() >= r.minLevel)
      .sort((a, b) => {
        const aLocked = getRequiredTool(a, ids) ? 1 : 0;
        const bLocked = getRequiredTool(b, ids) ? 1 : 0;
        return aLocked - bLocked;
      });
  };

  const lockedRecipes = () => CRAFTING_RECIPES.filter((r) => {
    return r.building === props.buildingId && buildingLevel() < r.minLevel;
  });

  const activeCrafts = () => state.craftingQueue.filter((c) => {
    const r = CRAFTING_RECIPES.find((cr) => cr.id === c.recipeId);
    return r?.building === props.buildingId;
  });

  const getResourceAmount = (res: string): number => {
    if (res === "wool") return state.wool;
    if (res === "fiber") return state.fiber;
    if (res === "iron") return state.iron;
    if (res === "leather") return state.leather;
    if (res === "gold") return state.resources.gold;
    if (res === "wood") return state.resources.wood;
    if (res === "stone") return state.resources.stone;
    if (res === "food") return state.resources.food;
    if (res === "astralShards") return state.astralShards;
    const inv = state.inventory.find((i) => i.itemId === res);
    return inv?.quantity ?? 0;
  };

  const canCraft = (recipeId: string, qty: number = 1) => !craftDisabledReason(recipeId, qty);

  const craftDisabledReason = (recipeId: string, qty: number = 1): string | null => {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return "Recipe not found";
    const b = building();
    if (!b || b.level < recipe.minLevel) return `Requires ${props.buildingName} Lv.${recipe.minLevel}`;
    if (b.damaged) return "Building is damaged";
    const missingTool = getRequiredTool(recipe, installedToolIds());
    if (missingTool) return `Requires ${missingTool.name}`;
    const slotsUsed = activeCrafts().length;
    const maxSlots = b.level + (props.buildingId === "kitchen" ? 1 : 0);
    if (slotsUsed >= maxSlots) return `Queue full — upgrade ${props.buildingName} for more slots`;
    for (const cost of recipe.costs) {
      const have = getResourceAmount(cost.resource);
      if (have < cost.amount * qty) return `Not enough ${cost.resource.replace(/_/g, " ")}`;
    }
    return null;
  };

  /** Max quantity affordable for a recipe */
  const maxCraftable = (recipeId: string): number => {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return 0;
    let max = 99;
    for (const cost of recipe.costs) {
      const have = getResourceAmount(cost.resource);
      max = Math.min(max, Math.floor(have / cost.amount));
    }
    return Math.max(1, max);
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
        {/* Materials header — uses same flex layout as content to align with recipes column */}
        <div style={{ display: "flex", gap: "20px", "margin-bottom": "16px" }}>
          <div style={{
            flex: 1,
            display: "flex",
            gap: "16px",
            padding: "10px 14px",
            background: "var(--bg-secondary)",
            "border-radius": "6px",
            "font-size": "0.85rem",
            color: "var(--text-secondary)",
            "flex-wrap": "wrap",
            "align-items": "center",
          }}>
            <span>{props.buildingName} Lv.{buildingLevel()}</span>
            <span>Slots: {activeCrafts().length}/{buildingLevel() + (props.buildingId === "kitchen" ? 1 : 0)}</span>
            <For each={props.materials}>
              {(mat) => <span>{mat.icon} {mat.label}: {mat.value()}</span>}
            </For>

            {/* Tool slots — aligned with right edge of recipes column */}
            <Show when={hasToolSlots()}>
              <div style={{
                "margin-left": "auto",
                display: "flex",
                "align-items": "center",
                gap: "6px",
              }}>
                <span style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>Tools:</span>
                <For each={availableTools()}>
                  {(tool) => {
                    const isInstalled = () => installedToolIds().includes(tool.id);
                    const inInventory = () => (state.inventory.find((i) => i.itemId === tool.id)?.quantity ?? 0) > 0;
                    return (
                      <Show when={isInstalled()} fallback={
                        <Tooltip text={inInventory() ? `Click to install ${tool.name}` : `${tool.name} — craft at the ${
                          (() => {
                            const recipe = CRAFTING_RECIPES.find((r) => r.id === tool.recipeId);
                            if (!recipe) return "???";
                            return BUILDINGS.find((b) => b.id === recipe.building)?.name ?? recipe.building;
                          })()
                        }`} position="bottom">
                          <button
                            onClick={() => {
                              if (inInventory()) {
                                actions.installBuildingTool(tool.id, props.buildingId);
                              }
                            }}
                            style={{
                              width: "36px",
                              height: "36px",
                              "border-radius": "6px",
                              border: "2px dashed var(--border-color)",
                              background: "var(--bg-primary)",
                              cursor: inInventory() ? "pointer" : "default",
                              display: "flex",
                              "align-items": "center",
                              "justify-content": "center",
                              "font-size": "1rem",
                              color: inInventory() ? "var(--accent-gold)" : "var(--text-muted)",
                              opacity: inInventory() ? 1 : 0.5,
                              transition: "border-color 0.2s",
                            }}
                          >
                            {inInventory() ? tool.icon : "+"}
                          </button>
                        </Tooltip>
                      }>
                        <Tooltip text={`${tool.name} — ${tool.description}`} position="bottom">
                          <div style={{
                            width: "36px",
                            height: "36px",
                            "border-radius": "6px",
                            border: "2px solid var(--accent-green)",
                            background: "rgba(46, 204, 113, 0.1)",
                            display: "flex",
                            "align-items": "center",
                            "justify-content": "center",
                            "font-size": "1.1rem",
                          }}>
                            {tool.icon}
                          </div>
                        </Tooltip>
                      </Show>
                    );
                  }}
                </For>
              </div>
            </Show>
          </div>
          {/* Invisible spacer matching queue sidebar width */}
          <div style={{ "min-width": "220px", "max-width": "280px" }} />
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
                {(recipe) => {
                  const recipeItem = () => getItemByRecipe(recipe.id);
                  const missingTool = () => getRequiredTool(recipe, installedToolIds());
                  const isToolLocked = () => !!missingTool();
                  return (
                  <div class="building-card" style={{ opacity: isToolLocked() ? 0.5 : 1 }}>
                    <div class="building-card-header">
                      {recipeItem()?.image
                        ? <img src={recipeItem()!.image} alt="" style={{ width: "40px", height: "40px", "object-fit": "cover", "border-radius": "6px", "flex-shrink": "0" }} />
                        : <div class="building-card-icon">{recipe.icon}</div>
                      }
                      <div>
                        <div class="building-card-title">{recipe.name}</div>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                          {formatTime(recipe.craftTime)} · +{recipe.produces.amount}x {formatResource(recipe.produces.resource, props.buildingId)}
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
                          {item.consumable && !isToolLocked() && <div style={{ color: "var(--accent-gold)", "margin-top": "2px", "font-size": "0.7rem" }}>consumable</div>}
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
                    <Show when={isToolLocked()} fallback={
                      (() => {
                        const [qty, setQty] = createSignal(1);
                        const max = () => maxCraftable(recipe.id);
                        return (
                          <div style={{ "margin-top": "auto", "padding-top": "8px", display: "flex", "align-items": "center", gap: "6px" }}>
                            <div style={{ display: "flex", "align-items": "center", gap: "2px", "border-radius": "4px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                              <button
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                style={{ width: "24px", height: "28px", background: "var(--bg-primary)", border: "none", color: "var(--text-muted)", cursor: "pointer", "font-size": "0.85rem" }}
                              >−</button>
                              <span style={{ width: "28px", "text-align": "center", "font-size": "0.8rem", color: "var(--text-primary)" }}>{qty()}</span>
                              <button
                                onClick={() => setQty((q) => Math.min(max(), q + 1))}
                                style={{ width: "24px", height: "28px", background: "var(--bg-primary)", border: "none", color: "var(--text-muted)", cursor: "pointer", "font-size": "0.85rem" }}
                              >+</button>
                            </div>
                            <button
                              onClick={() => setQty(max())}
                              style={{
                                padding: "4px 8px",
                                background: "transparent",
                                border: "1px solid var(--border-color)",
                                color: "var(--text-muted)",
                                "border-radius": "4px",
                                cursor: "pointer",
                                "font-size": "0.7rem",
                                "white-space": "nowrap",
                              }}
                            >Max</button>
                            <Tooltip text={craftDisabledReason(recipe.id, qty())} position="bottom">
                              <button
                                class="upgrade-btn"
                                disabled={!canCraft(recipe.id, qty())}
                                onClick={() => { actions.startCraft(recipe.id, qty()); setQty(1); }}
                                style={{ "font-size": "0.85rem", padding: "6px 14px" }}
                              >
                                Craft{qty() > 1 ? ` ×${qty()}` : ""}
                              </button>
                            </Tooltip>
                          </div>
                        );
                      })()
                    }>
                      <div style={{ "margin-top": "auto", "padding-top": "6px" }}>
                        <div style={{
                          padding: "4px 8px",
                          "border-radius": "4px",
                          background: "rgba(230, 126, 34, 0.1)",
                          border: "1px solid #e67e22",
                          "font-size": "0.75rem",
                          color: "#e67e22",
                          display: "flex",
                          "align-items": "center",
                          gap: "4px",
                        }}>
                          <span>{missingTool()?.icon}</span>
                          Requires {missingTool()?.name}
                        </div>
                      </div>
                    </Show>
                  </div>
                  );
                }}
              </For>
            </div>
            <Show when={recipes().length === 0}>
              <div style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
                No recipes unlocked yet. Upgrade the {props.buildingName} for more.
              </div>
            </Show>

            {/* Level-locked recipes */}
            <Show when={lockedRecipes().length > 0}>
              <h3 style={{ "font-family": "var(--font-heading)", "margin-top": "20px", "margin-bottom": "8px", color: "var(--text-muted)" }}>
                Locked Recipes
              </h3>
              <div class="buildings-grid">
                <For each={lockedRecipes()}>
                  {(recipe) => {
                    const recipeItem = () => getItemByRecipe(recipe.id);
                    return (
                    <div class="building-card" style={{ opacity: 0.5 }}>
                      <div class="building-card-header">
                        {recipeItem()?.image
                          ? <img src={recipeItem()!.image} alt="" style={{ width: "40px", height: "40px", "object-fit": "cover", "border-radius": "6px", "flex-shrink": "0" }} />
                          : <div class="building-card-icon">{recipe.icon}</div>
                        }
                        <div>
                          <div class="building-card-title">{recipe.name}</div>
                          <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                            +{recipe.produces.amount}x {formatResource(recipe.produces.resource, props.buildingId)}
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
                    );
                  }}
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
                      <span style={{ "font-size": "0.85rem", color: "var(--text-primary)" }}>
                        {recipe()?.name}
                        {(craft.quantity ?? 1) > 1 && <span style={{ color: "var(--accent-gold)", "margin-left": "4px" }}>×{craft.quantity}</span>}
                      </span>
                    </div>
                    <div style={{ color: "var(--accent-blue)", "font-size": "0.8rem", "margin-top": "4px" }}>
                      <Countdown remainingSeconds={craft.remaining} />
                      {(craft.quantity ?? 1) > 1 && <span style={{ color: "var(--text-muted)", "margin-left": "6px" }}>({craft.quantity} left)</span>}
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
