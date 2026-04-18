import { For, Show, type JSX } from "solid-js";
import { A } from "@solidjs/router";
import { useGame, CRAFTING_RECIPES, getBuildingToolsForBuilding, getRequiredTool } from "~/engine/gameState";
import { getItemByRecipe, ARMOR_TYPE_META } from "@medieval-realm/shared/data/items";
import { getTotalFood, isFoodItemType, getFoodCostAmount, getFoodMeta, type FoodItemType } from "~/data/foods";
import { BUILDINGS } from "~/data/buildings";
import Countdown from "~/components/Countdown";
import Tooltip from "~/components/Tooltip";
import RecipeCard from "~/components/RecipeCard";
import FoodIcon from "~/components/FoodIcon";

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
  /** Verb for the craft button (default: "Craft") */
  craftVerb?: string;
}

/** Display-friendly name for produced resource */
function formatResource(resource: string, buildingId: string): string {
  if (resource === "potions" && buildingId === "kitchen") return "meal";
  return resource;
}

const RESOURCE_ICON: Record<string, string> = {
  gold: "🪙", wood: "🪵", stone: "🪨",
  wool: "🐑", fiber: "🪻", leather: "🐄", iron: "⚒️",
  honey: "🍯", astralShards: "🌟",
  grain: "🌾",
};

/** Render a recipe cost with an icon — uses the FoodIcon (image-aware) for
 *  food items, a small emoji span for other resources. */
function renderCost(resource: string, amount: number): JSX.Element {
  const label = (text: string) => (
    <span style={{ display: "inline-flex", "align-items": "center", gap: "4px" }}>{text}</span>
  );
  if (resource === "grain") {
    return <span style={{ display: "inline-flex", "align-items": "center", gap: "4px" }}>
      {amount} <span style={{ "font-size": "14px" }}>🌾</span> grain
    </span>;
  }
  if (isFoodItemType(resource)) {
    const meta = getFoodMeta(resource as FoodItemType);
    return <span style={{ display: "inline-flex", "align-items": "center", gap: "4px" }}>
      {amount} <FoodIcon id={resource as FoodItemType} size={16} /> {meta.label.toLowerCase()}
    </span>;
  }
  const icon = RESOURCE_ICON[resource];
  if (icon) return label(`${amount} ${icon}`);
  return label(`${amount} ${resource.replace(/_/g, " ")}`);
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Info panel content for item-bearing recipes (stats, armor type, classes, consumable, flavor) */
function itemInfoPanel(recipeId: string, hideConsumableTag: boolean = false) {
  const item = getItemByRecipe(recipeId);
  if (!item) return null;
  const { stats, flavor } = splitDescription(item.description);
  const armorMeta = item.armorType ? ARMOR_TYPE_META[item.armorType] : null;
  return (
    <div style={{ "margin-top": "4px", padding: "4px 8px", background: "var(--bg-primary)", "border-radius": "4px", "font-size": "0.75rem" }}>
      <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
        {stats.split(", ").map((s) => (
          <span style={{ color: "var(--accent-green)" }}>{s.trim()}</span>
        ))}
      </div>
      {(armorMeta || item.classes.length > 0) && (
        <div style={{ display: "flex", gap: "6px", "margin-top": "3px", "flex-wrap": "wrap" }}>
          {armorMeta && (
            <span style={{
              "font-size": "0.65rem", padding: "1px 5px",
              background: "rgba(120, 120, 140, 0.2)",
              border: "1px solid var(--border-color)",
              "border-radius": "3px",
              color: "var(--text-secondary)",
            }}>
              {armorMeta.icon} {armorMeta.label}
            </span>
          )}
          {item.classes.length > 0 && (
            <span style={{
              "font-size": "0.65rem", padding: "1px 5px",
              background: "rgba(245, 197, 66, 0.12)",
              border: "1px solid rgba(245, 197, 66, 0.35)",
              "border-radius": "3px",
              color: "var(--accent-gold)",
            }}>
              {item.classes.join(", ")} only
            </span>
          )}
        </div>
      )}
      {item.consumable && !hideConsumableTag && <div style={{ color: "var(--accent-gold)", "margin-top": "2px", "font-size": "0.7rem" }}>consumable</div>}
      {flavor && (
        <div style={{ color: "var(--text-muted)", "font-style": "italic", "margin-top": "4px", "font-size": "0.7rem" }}>
          {flavor}
        </div>
      )}
    </div>
  );
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

  /** All entries in this building's queue — active and pending. */
  const buildingCrafts = () => state.craftingQueue.filter((c) => {
    const r = CRAFTING_RECIPES.find((cr) => cr.id === c.recipeId);
    return r?.building === props.buildingId;
  });
  /** Just the entries currently being worked on (pending are waiting in line). */
  const activeCrafts = () => buildingCrafts().filter((c) => !c.pending);
  const pendingCrafts = () => buildingCrafts().filter((c) => c.pending);

  const getResourceAmount = (res: string): number => {
    if (res === "wool") return state.wool;
    if (res === "fiber") return state.fiber;
    if (res === "iron") return state.iron;
    if (res === "leather") return state.leather;
    if (res === "gold") return state.resources.gold;
    if (res === "wood") return state.resources.wood;
    if (res === "stone") return state.resources.stone;
    if (res === "food") return getTotalFood(state.foods);
    if (res === "honey") return state.honey;
    if (res === "astralShards") return state.astralShards;
    if (res === "grain" || isFoodItemType(res)) return getFoodCostAmount(state.foods, res);
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
    // No queue limit — any overflow just enters as pending and picks up when
    // a slot frees. Slot count still informs display ("active vs. pending").
    for (const cost of recipe.costs) {
      const have = getResourceAmount(cost.resource);
      if (have < cost.amount * qty) {
        if (cost.resource === "grain") return "Not enough grain (wheat or barley)";
        if (isFoodItemType(cost.resource)) {
          const meta = getFoodMeta(cost.resource as FoodItemType);
          return `Not enough ${meta.label.toLowerCase()}`;
        }
        return `Not enough ${cost.resource.replace(/_/g, " ")}`;
      }
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
                  const missingTool = () => getRequiredTool(recipe, installedToolIds());
                  const isToolLocked = () => !!missingTool();
                  const item = getItemByRecipe(recipe.id);
                  return (
                    <RecipeCard
                      icon={recipe.icon}
                      image={item?.image}
                      title={recipe.name}
                      subtitle={`${formatTime(recipe.craftTime)} · +${recipe.produces.amount}x ${formatResource(recipe.produces.resource, props.buildingId)}`}
                      info={itemInfoPanel(recipe.id, isToolLocked())}
                      costs={<>Cost: <For each={recipe.costs}>{(c, i) => <>{i() > 0 ? ", " : ""}{renderCost(c.resource, c.amount)}</>}</For></>}
                      action={
                        isToolLocked()
                          ? {
                              type: "locked",
                              badge: <div style={{
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
                              </div>,
                            }
                          : {
                              type: "craft",
                              maxQty: () => maxCraftable(recipe.id),
                              canCraft: (qty) => canCraft(recipe.id, qty),
                              disabledReason: (qty) => craftDisabledReason(recipe.id, qty),
                              onCraft: (qty) => actions.startCraft(recipe.id, qty),
                              verb: props.craftVerb,
                            }
                      }
                    />
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
                    const item = getItemByRecipe(recipe.id);
                    return (
                      <RecipeCard
                        icon={recipe.icon}
                        image={item?.image}
                        title={recipe.name}
                        subtitle={`+${recipe.produces.amount}x ${formatResource(recipe.produces.resource, props.buildingId)}`}
                        info={itemInfoPanel(recipe.id, true)}
                        costs={<>Cost: <For each={recipe.costs}>{(c, i) => <>{i() > 0 ? ", " : ""}{renderCost(c.resource, c.amount)}</>}</For></>}
                        action={{
                          type: "locked",
                          badge: <div style={{
                            padding: "4px 8px",
                            "border-radius": "4px",
                            background: "rgba(245, 197, 66, 0.1)",
                            border: "1px solid var(--accent-gold)",
                            "font-size": "0.75rem",
                            color: "var(--accent-gold)",
                          }}>
                            Requires {props.buildingName} Lv.{recipe.minLevel}
                            {buildingLevel() > 0 && ` (currently Lv.${buildingLevel()})`}
                          </div>,
                        }}
                      />
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
            <Show when={buildingCrafts().length === 0}>
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
            <Show when={pendingCrafts().length > 0}>
              <div style={{
                "font-size": "0.72rem", "text-transform": "uppercase",
                "letter-spacing": "1px", color: "var(--text-muted)",
                "margin-top": "10px", "margin-bottom": "6px",
              }}>
                Up next
              </div>
              <For each={pendingCrafts()}>
                {(craft, i) => {
                  const recipe = () => CRAFTING_RECIPES.find((r) => r.id === craft.recipeId);
                  return (
                    <div style={{
                      padding: "6px 10px",
                      "margin-bottom": "4px",
                      background: "var(--bg-secondary)",
                      "border-radius": "6px",
                      border: "1px dashed var(--border-default)",
                      opacity: 0.7,
                    }}>
                      <div style={{ display: "flex", "align-items": "center", gap: "6px" }}>
                        <span style={{ "font-size": "0.7rem", color: "var(--text-muted)", "min-width": "18px" }}>#{i() + 1}</span>
                        <span>{recipe()?.icon}</span>
                        <span style={{ "font-size": "0.82rem", color: "var(--text-secondary)" }}>
                          {recipe()?.name}
                          {(craft.quantity ?? 1) > 1 && <span style={{ color: "var(--accent-gold)", "margin-left": "4px" }}>×{craft.quantity}</span>}
                        </span>
                      </div>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
