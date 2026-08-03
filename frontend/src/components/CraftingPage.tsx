import { For, Show, onMount, type JSX } from "solid-js";
import { A } from "@solidjs/router";
import { useGame, CRAFTING_RECIPES, isRecipeDiscovered, getBuildingToolsForBuilding, getRequiredTool, type CraftingRecipe } from "~/engine/gameState";
import { playSound, type SoundId } from "~/engine/sounds";
import { getItemByRecipe, ARMOR_TYPE_META, isFoodItem, getFoodEffect } from "@medieval-realm/shared/data/items";
import { getTotalFood, isFoodItemType, getFoodCostAmount, getFoodMeta, type FoodItemType } from "~/data/foods";
import { BUILDINGS, getRepairCost } from "~/data/buildings";
import Countdown from "~/components/Countdown";
import Tooltip from "~/components/Tooltip";
import RecipeCard from "~/components/RecipeCard";
import FoodIcon from "~/components/FoodIcon";
import { formatTimeShort } from "~/utils/format";

// THROWAWAY PREVIEW: hand-drawn ornament frames, cycled across crafted gear
// icons so the look can be judged in context. To be replaced by a real
// per-item rarity system when the items list is reworked. Safe to delete.
const PREVIEW_EQUIP_FRAMES = [
  "/images/frames/item_frame_common.png",
  "/images/frames/item_frame_uncommon.png",
  "/images/frames/item_frame_rare.png",
  "/images/frames/item_frame_epic.png",
  "/images/frames/item_frame_legendary.png",
];

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
  /** SFX fired when a craft starts. Set per-building (e.g. Kitchen → "dagger"
   *  for the chopping cue). Omit for silent crafts. */
  craftSound?: SoundId;
}

/** Display-friendly name for produced resource */
function formatResource(resource: string, _buildingId: string): string {
  if (resource === "food") return "meal";
  if (resource === "grain") return "grain";
  if (resource === "wild") return "foraged food";
  if (isFoodItemType(resource)) return getFoodMeta(resource as FoodItemType).label;
  return resource.replace(/_/g, " ");
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
  if (resource === "wild") {
    return <span style={{ display: "inline-flex", "align-items": "center", gap: "4px" }}>
      {amount} <span style={{ "font-size": "14px" }}>🍄</span> foraged
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

/** Stat key → label (kept short for crafting card chips). */
const STAT_LABELS: Record<string, string> = {
  str: "STR", dex: "DEX", int: "INT", vit: "VIT", wis: "WIS",
};

/** Render the visual for a recipe in a queue row: the item's image if it has
 *  one, otherwise the recipe's emoji icon. Used by both the active and pending
 *  queue lists so the visual stays consistent. Building tools don't have a
 *  recipe-to-image mapping yet — they fall through to the emoji path. */
function recipeQueueIcon(recipe: CraftingRecipe, size: number = 24): JSX.Element {
  const img = recipe.image ?? getItemByRecipe(recipe.id)?.image;
  if (img) {
    return <img
      src={img}
      alt=""
      style={{
        width: `${size}px`, height: `${size}px`,
        "object-fit": "cover",
        "border-radius": "4px",
        "flex-shrink": "0",
      }}
    />;
  }
  return <span style={{ "font-size": `${Math.round(size * 0.75)}px` }}>{recipe.icon}</span>;
}

/** Info panel content for item-bearing recipes (stats, armor type, classes, consumable, flavor) */
function itemInfoPanel(recipeId: string, hideConsumableTag: boolean = false) {
  const item = getItemByRecipe(recipeId);
  if (!item) return null;

  // Food items use a structured layout: stats come from item.stats + the
  // FOOD_EFFECTS hpBonus, flavor tags from foodFlavors, description is
  // pure flavor at the bottom. Other items keep the legacy
  // splitDescription path which assumes "+N STAT, ...  Flavor sentence."
  // formatted descriptions.
  if (isFoodItem(item.id)) {
    const food = getFoodEffect(item.id);
    const statEntries = Object.entries(item.stats).filter(([, v]) => v && v > 0);
    const hpBonus = food?.hpBonus ?? 0;
    return (
      <div style={{ "margin-top": "4px", padding: "4px 8px", background: "var(--bg-primary)", "border-radius": "4px", "font-size": "0.75rem" }}>
        <div style={{ display: "flex", gap: "6px", "flex-wrap": "wrap", "align-items": "center" }}>
          {statEntries.map(([stat, amount]) => (
            <span style={{ color: "var(--accent-green)" }}>
              +{amount} {STAT_LABELS[stat] ?? stat.toUpperCase()}
            </span>
          ))}
          {hpBonus > 0 && (
            <span style={{ color: "var(--accent-green)" }}>+{hpBonus} HP</span>
          )}
          {statEntries.length === 0 && hpBonus === 0 && (
            <span style={{ color: "var(--text-muted)" }}>No stat bonus</span>
          )}
        </div>
        {item.foodFlavors && item.foodFlavors.length > 0 && (
          <div style={{ display: "flex", gap: "4px", "margin-top": "4px", "flex-wrap": "wrap" }}>
            {item.foodFlavors.map((f) => (
              <span style={{
                "font-size": "0.65rem", padding: "1px 6px",
                background: "rgba(96, 165, 250, 0.12)",
                border: "1px solid rgba(96, 165, 250, 0.35)",
                "border-radius": "3px",
                color: "var(--accent-blue)",
              }}>
                {f}
              </span>
            ))}
          </div>
        )}
        <div style={{ color: "var(--text-muted)", "font-style": "italic", "margin-top": "4px", "font-size": "0.7rem" }}>
          {item.description}
        </div>
      </div>
    );
  }

  const { stats, flavor } = splitDescription(item.description);
  const armorMeta = item.armorType ? ARMOR_TYPE_META[item.armorType] : null;
  return (
    <div style={{ "margin-top": "4px", padding: "4px 8px", background: "var(--bg-primary)", "border-radius": "4px", "font-size": "0.75rem" }}>
      {stats.trim() && (
        <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
          {stats.split(", ").filter((s) => s.trim()).map((s) => (
            <span style={{ color: "var(--accent-green)" }}>{s.trim()}</span>
          ))}
        </div>
      )}
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
  const repairCost = () => {
    const def = BUILDINGS.find((b) => b.id === props.buildingId);
    return def ? getRepairCost(def, buildingLevel()) : { wood: 0, stone: 0 };
  };
  const canRepair = () => state.resources.wood >= repairCost().wood && state.resources.stone >= repairCost().stone;

  // "You haven't built this yet" cue — fire the error SFX on mount when the
  // page lands in its empty state. Skipped if the player already has it built.
  onMount(() => {
    if (buildingLevel() === 0) playSound("error");
  });

  const installedToolIds = () => state.buildingTools?.[props.buildingId] ?? [];
  const availableTools = () => getBuildingToolsForBuilding(props.buildingId);
  const hasToolSlots = () => availableTools().length > 0;

  // Recipes where building level is met (includes both tool-available and tool-locked)
  // Unlocked recipes first, tool-locked at the end
  const recipes = () => {
    const ids = installedToolIds();
    return CRAFTING_RECIPES
      .filter((r) => r.building === props.buildingId && buildingLevel() >= r.minLevel
        && isRecipeDiscovered(r, state.discoveredRecipes ?? []))
      .sort((a, b) => {
        const aLocked = getRequiredTool(a, ids) ? 1 : 0;
        const bLocked = getRequiredTool(b, ids) ? 1 : 0;
        return aLocked - bLocked;
      });
  };

  const lockedRecipes = () => CRAFTING_RECIPES.filter((r) => {
    // Level-locked recipes still show (as a teaser), but an undiscovered
    // discovery-recipe stays fully hidden until it's unlocked.
    return r.building === props.buildingId && buildingLevel() < r.minLevel
      && isRecipeDiscovered(r, state.discoveredRecipes ?? []);
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
    if (res === "grain" || res === "wild" || isFoodItemType(res)) return getFoodCostAmount(state.foods, res);
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
    // Name the material when exactly one is short; a generic note when several
    // are, so the tooltip stays readable instead of listing every shortfall.
    const missing: string[] = [];
    for (const cost of recipe.costs) {
      const have = getResourceAmount(cost.resource);
      if (have < cost.amount * qty) {
        if (cost.resource === "grain") missing.push("grain (wheat or barley)");
        else if (cost.resource === "wild") missing.push("foraged food (berries, mushrooms, or nuts)");
        else if (isFoodItemType(cost.resource)) missing.push(getFoodMeta(cost.resource as FoodItemType).label.toLowerCase());
        else missing.push(cost.resource.replace(/_/g, " "));
      }
    }
    if (missing.length === 1) return `Not enough ${missing[0]}`;
    if (missing.length > 1) return "Not enough materials";
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

  // Shared display props for the two RecipeCard sections (unlocked + locked).
  // Subtitle and action differ between the call sites and are spread separately.
  const recipeDisplayProps = (recipe: CraftingRecipe) => {
    const item = getItemByRecipe(recipe.id);
    return {
      icon: recipe.icon,
      image: recipe.image ?? item?.image,
      title: recipe.name,
      costs: <>Cost: <For each={recipe.costs}>{(c, i) => <>{i() > 0 ? ", " : ""}{renderCost(c.resource, c.amount)}</>}</For></>,
    };
  };
  const recipeProduces = (recipe: CraftingRecipe) =>
    `+${recipe.produces.amount}x ${formatResource(recipe.produces.resource, props.buildingId)}`;
  // Kitchen dishes aren't ITEMs, so itemInfoPanel returns null for them. Give
  // them their own panel: a "Staple" badge for the food-that-feeds-citizens
  // dishes (the keep-cookable ones), plus the recipe's flavor description.
  const dishInfoPanel = (recipe: CraftingRecipe) => {
    const isStaple = props.buildingId === "kitchen" && isFoodItemType(recipe.produces.resource);
    if (!recipe.description && !isStaple) return null;
    return (
      <div style={{ "margin-top": "4px", padding: "4px 8px", background: "var(--bg-primary)", "border-radius": "4px", "font-size": "0.75rem" }}>
        <Show when={isStaple}>
          <div style={{
            display: "inline-block", "font-size": "0.65rem", padding: "1px 6px", "margin-bottom": "4px",
            background: "rgba(212, 175, 55, 0.15)", border: "1px solid var(--accent-gold)",
            "border-radius": "3px", color: "var(--accent-gold)",
          }}>🍲 Staple · feeds the settlement</div>
        </Show>
        <Show when={recipe.description}>
          <div style={{ color: "var(--text-muted)", "font-style": "italic", "font-size": "0.7rem" }}>{recipe.description}</div>
        </Show>
      </div>
    );
  };
  /** Info panel for a recipe: the item stats panel if it maps to an item,
   *  otherwise the dish panel (staple badge + flavor). */
  const recipeInfoPanel = (recipe: CraftingRecipe, hideConsumable: boolean) =>
    itemInfoPanel(recipe.id, hideConsumable) ?? dishInfoPanel(recipe);
  const toolLockedBadge = (icon: string, name: string) => (
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
      <span>{icon}</span>
      Requires {name}
    </div>
  );
  const levelLockedBadge = (minLevel: number, buildingName: string, currentLevel: number) => (
    <div style={{
      padding: "4px 8px",
      "border-radius": "4px",
      background: "rgba(245, 197, 66, 0.1)",
      border: "1px solid var(--accent-gold)",
      "font-size": "0.75rem",
      color: "var(--accent-gold)",
    }}>
      Requires {buildingName} Lv.{minLevel}
      {currentLevel > 0 && ` (currently Lv.${currentLevel})`}
    </div>
  );

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
          <A href={`/buildings#building-${props.buildingId}`} style={{ color: "var(--accent-gold)" }}>
            Go to Buildings →
          </A>
        </div>
      </Show>

      <Show when={buildingLevel() > 0}>
        {/* Materials header — uses same flex layout as content to align with recipes column */}
        <div style={{ display: "flex", gap: "20px", "margin-bottom": "16px" }}>
          <div
            class="crafting-materials-bar"
            style={{
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
            }}
          >
            <div class="crafting-materials-meta">
              <span>{props.buildingName} Lv.{buildingLevel()}</span>
            </div>
            <div class="crafting-materials-list">
              <For each={props.materials}>
                {(mat) => (
                  <span class="crafting-mat">
                    <span class="crafting-mat-icon">{mat.icon}</span>
                    <span class="crafting-mat-label">{mat.label}:</span>
                    <span class="crafting-mat-value">{mat.value()}</span>
                  </span>
                )}
              </For>
            </div>

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
          <div class="crafting-queue-spacer" style={{ "min-width": "220px", "max-width": "280px" }} />
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
            display: "flex", "align-items": "center", "justify-content": "space-between", gap: "10px", "flex-wrap": "wrap",
          }}>
            <span>Building is damaged. Crafting is disabled until it is repaired.</span>
            <button
              class="upgrade-btn"
              disabled={!canRepair()}
              onClick={() => { if (actions.repairBuilding(props.buildingId)) playSound("build"); }}
              title={canRepair() ? undefined : "Not enough wood or stone"}
              style={{ "font-size": "0.8rem", padding: "4px 12px", "white-space": "nowrap", opacity: canRepair() ? "1" : "0.5", cursor: canRepair() ? "pointer" : "not-allowed" }}
            >
              🔧 Repair (🪵{repairCost().wood} 🪨{repairCost().stone})
            </button>
          </div>
        </Show>

        <div class="crafting-layout" style={{ display: "flex", gap: "20px", "align-items": "flex-start" }}>
          {/* Recipes */}
          <div style={{ flex: 1, "min-width": "0" }}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
              Recipes
            </h3>
            <div class="buildings-grid">
              <For each={recipes()}>
                {(recipe, i) => {
                  const missingTool = () => getRequiredTool(recipe, installedToolIds());
                  const isToolLocked = () => !!missingTool();
                  // Preview frame: only on crafted GEAR (recipe → item with an
                  // equipment slot), cycling the three ornament tiers by index.
                  const previewFrame = () => {
                    const it = getItemByRecipe(recipe.id);
                    return it?.slot ? PREVIEW_EQUIP_FRAMES[i() % PREVIEW_EQUIP_FRAMES.length] : undefined;
                  };
                  // Passive "keep cooking" toggle — kitchen staples that feed
                  // citizens (food-type produce). Sits next to Cook (extraAction);
                  // burns ~1 wood/hr while lit. Null for non-staple / other buildings.
                  const keepCookingBtn = (): JSX.Element => {
                    if (!(props.buildingId === "kitchen" && isFoodItemType(recipe.produces.resource) && !isToolLocked())) return null;
                    const active = () => state.autoCook?.[props.buildingId] ?? [];
                    const isOn = () => active().includes(recipe.id);
                    const slots = () => actions.getAutoCookSlots(props.buildingId);
                    const slotsFull = () => !isOn() && active().length >= slots();
                    const startBlocked = () => craftDisabledReason(recipe.id, 1);
                    const stallReason = (): string => {
                      if (state.resources.wood <= 0) return "no wood to burn";
                      const r = craftDisabledReason(recipe.id, 1);
                      return r ? r.toLowerCase() : "";
                    };
                    const disabled = () => !isOn() && (!!startBlocked() || slotsFull());
                    const stalled = () => isOn() && !!stallReason();
                    const label = () =>
                      !isOn() ? (slotsFull() ? `🔥 Kitchen full (${active().length}/${slots()})` : "🔥 Keep cooking")
                      : stalled() ? `⏸ Paused — ${stallReason()}`
                      : "🔥 Cooking — tap to stop";
                    const title = () =>
                      slotsFull() ? "All cook slots are in use — upgrade the Kitchen to keep more dishes going at once."
                      : disabled() ? startBlocked()!
                      : "Keep cooking this while there are ingredients and wood to burn";
                    return (
                      <Tooltip text={title()}>
                        <button
                          class="btn-secondary"
                          disabled={disabled()}
                          onClick={() => { if (!disabled()) actions.setAutoCook(props.buildingId, recipe.id); }}
                          style={{
                            "font-size": "0.72rem",
                            "white-space": "nowrap",
                          }}
                        >
                          {label()}
                        </button>
                      </Tooltip>
                    );
                  };
                  return (
                    <RecipeCard
                      {...recipeDisplayProps(recipe)}
                      subtitle={`${formatTimeShort(recipe.craftTime)} · ${recipeProduces(recipe)}`}
                      info={recipeInfoPanel(recipe, isToolLocked())}
                      isUnseen={!(state.recipesSeen ?? []).includes(recipe.id)}
                      onSeen={() => actions.markRecipeSeen(recipe.id)}
                      frameUrl={previewFrame()}
                      extraAction={keepCookingBtn()}
                      action={
                        isToolLocked()
                          ? { type: "locked", badge: toolLockedBadge(missingTool()!.icon, missingTool()!.name) }
                          : {
                              type: "craft",
                              maxQty: () => maxCraftable(recipe.id),
                              canCraft: (qty) => canCraft(recipe.id, qty),
                              disabledReason: (qty) => craftDisabledReason(recipe.id, qty),
                              onCraft: (qty) => {
                                if (props.craftSound) playSound(props.craftSound);
                                actions.startCraft(recipe.id, qty);
                              },
                              verb: props.craftVerb,
                              silentClick: !!props.craftSound,
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
                  {(recipe) => (
                    <RecipeCard
                      {...recipeDisplayProps(recipe)}
                      subtitle={recipeProduces(recipe)}
                      info={recipeInfoPanel(recipe, true)}
                      action={{
                        type: "locked",
                        badge: levelLockedBadge(recipe.minLevel, props.buildingName, buildingLevel()),
                      }}
                    />
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
          <div class="crafting-queue" style={{ "min-width": "220px", "max-width": "280px" }}>
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
                    <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                      <Show when={recipe()}>{(r) => recipeQueueIcon(r(), 28)}</Show>
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
                      <div style={{ display: "flex", "align-items": "center", gap: "8px" }}>
                        <span style={{ "font-size": "0.7rem", color: "var(--text-muted)", "min-width": "18px" }}>#{i() + 1}</span>
                        <Show when={recipe()}>{(r) => recipeQueueIcon(r(), 22)}</Show>
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
