import { For, Show } from "solid-js";
import { useGame, BUILDING_TOOLS, getBuildingTool } from "~/engine/gameState";
import { ITEMS, MATERIALS, getItem, getMaterial, getPotionInfo, isSupplyItem, ARMOR_TYPE_META } from "@medieval-realm/shared/data/items";
import { ALCHEMY_RECIPES } from "@medieval-realm/shared/data/alchemy_recipes";
import { BUILDINGS } from "~/data/buildings";

export default function Inventory() {
  const { state } = useGame();

  const ownedItems = () => state.inventory.filter((i) => i.quantity > 0);

  // Count equipped items across all adventurers
  const equippedCount = (itemId: string) =>
    state.adventurers.filter((a) => a.alive &&
      Object.values(a.equipment).some((id) => id === itemId)
    ).length;

  return (
    <div>
      <h1 class="page-title">Inventory</h1>

      {/* Stockpile summary */}
      <div style={{
        display: "flex",
        gap: "16px",
        "margin-bottom": "20px",
        padding: "10px 14px",
        background: "var(--bg-secondary)",
        "border-radius": "6px",
        "font-size": "0.85rem",
        color: "var(--text-secondary)",
        "flex-wrap": "wrap",
      }}>
        <span>🐑 Wool: {Math.floor(state.wool)}</span>
        <span>🪻 Fiber: {Math.floor(state.fiber)}</span>
        <span>⚒️ Iron: {Math.floor(state.iron)}</span>
        <span>👕 Clothing: {Math.floor(state.clothing)}</span>
        <span>🧪 Potions: {state.potions}</span>
        <span>💎 Gems: {state.gems}</span>
      </div>

      {/* Building Tools in inventory */}
      {(() => {
        const toolsInInventory = () => state.inventory
          .filter((inv) => inv.quantity > 0 && getBuildingTool(inv.itemId))
          .map((inv) => ({ inv, tool: getBuildingTool(inv.itemId)! }));
        const installedTools = () => {
          const result: { buildingId: string; tool: NonNullable<ReturnType<typeof getBuildingTool>> }[] = [];
          const tools = state.buildingTools ?? {};
          for (const buildingId of Object.keys(tools)) {
            for (const toolId of tools[buildingId]) {
              const tool = getBuildingTool(toolId);
              if (tool) result.push({ buildingId, tool });
            }
          }
          return result;
        };
        return (
          <Show when={toolsInInventory().length > 0 || installedTools().length > 0}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "10px", color: "var(--text-primary)" }}>
              Building Tools
            </h3>
            <div class="buildings-grid" style={{ "margin-bottom": "20px" }}>
              <For each={toolsInInventory()}>
                {({ inv, tool }) => (
                  <div class="building-card">
                    <span class="building-card-category">tool</span>
                    <div class="building-card-header" style={{ "margin-top": "4px" }}>
                      <div class="building-card-icon">{tool.icon}</div>
                      <div>
                        <div class="building-card-title">{tool.name}</div>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                          For: {BUILDINGS.find((b) => b.id === tool.targetBuilding)?.name ?? tool.targetBuilding}
                        </div>
                      </div>
                    </div>
                    <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-top": "4px" }}>
                      {tool.description}
                    </div>
                    <div style={{ "margin-top": "6px", "font-size": "0.85rem", color: "var(--text-secondary)" }}>
                      In stock: <strong>{inv.quantity}</strong>
                    </div>
                  </div>
                )}
              </For>
              <For each={installedTools()}>
                {({ buildingId, tool }) => (
                  <div class="building-card" style={{ opacity: 0.7 }}>
                    <span class="building-card-category">installed</span>
                    <div class="building-card-header" style={{ "margin-top": "4px" }}>
                      <div class="building-card-icon">{tool.icon}</div>
                      <div>
                        <div class="building-card-title">{tool.name}</div>
                        <div style={{ "font-size": "0.8rem", color: "var(--accent-green)" }}>
                          Installed at {BUILDINGS.find((b) => b.id === buildingId)?.name ?? buildingId}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        );
      })()}

      {/* Potions (combat + mission supplies) */}
      {(() => {
        const potionItems = () => state.inventory
          .filter((inv) => inv.quantity > 0 && isSupplyItem(inv.itemId))
          .map((inv) => {
            const item = getItem(inv.itemId);
            if (item) return { inv, name: item.name, icon: item.icon, image: item.image, description: item.description };
            const alch = ALCHEMY_RECIPES.find((r) => r.id === inv.itemId);
            if (alch) return { inv, name: alch.name, icon: alch.icon, image: alch.image, description: alch.description };
            return null;
          })
          .filter(Boolean) as { inv: { itemId: string; quantity: number }; name: string; icon: string; image?: string; description: string }[];
        return (
          <Show when={potionItems().length > 0}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "10px", color: "var(--text-primary)" }}>
              Potions
            </h3>
            <div class="buildings-grid" style={{ "margin-bottom": "20px" }}>
              <For each={potionItems()}>
                {(p) => {
                  const info = getPotionInfo(p.inv.itemId);
                  const categoryLabel = info?.category === "combat" ? "combat" : "mission";
                  return (
                    <div class="building-card">
                      <span class="building-card-category">{categoryLabel}</span>
                      <div class="building-card-header" style={{ "margin-top": "4px" }}>
                        {p.image
                          ? <img src={p.image} alt="" style={{ width: "40px", height: "40px", "object-fit": "cover", "border-radius": "6px", "flex-shrink": "0" }} />
                          : <div class="building-card-icon">{p.icon}</div>
                        }
                        <div>
                          <div class="building-card-title">{p.name}</div>
                          <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                            {categoryLabel === "combat" ? "Used during combat" : "Non-combat missions"}
                          </div>
                        </div>
                      </div>
                      <div style={{ "font-size": "0.8rem", color: "var(--accent-green)", "margin-top": "4px" }}>
                        {p.description}
                      </div>
                      <div style={{ "margin-top": "6px", "font-size": "0.85rem", color: "var(--text-secondary)" }}>
                        In stock: <strong>{p.inv.quantity}</strong>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        );
      })()}

      {/* Equipment items */}
      <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "10px", color: "var(--text-primary)" }}>
        Equipment
      </h3>
      <Show when={ownedItems().length === 0}>
        <div style={{ color: "var(--text-muted)", "font-size": "0.85rem", "margin-bottom": "20px" }}>
          No items yet. Craft weapons, armor, and potions at the Blacksmith, Tailoring Shop, or Alchemy Lab.
        </div>
      </Show>
      <div class="buildings-grid">
        <For each={ownedItems()}>
          {(inv) => {
            const item = () => getItem(inv.itemId);
            const equipped = () => equippedCount(inv.itemId);
            return (
              <Show when={item()}>
                {(it) => {
                  const armorMeta = () => it().armorType ? ARMOR_TYPE_META[it().armorType!] : null;
                  return (
                  <div class="building-card">
                    <span class="building-card-category">{it().slot}</span>
                    <div class="building-card-header" style={{ "margin-top": "4px" }}>
                      {it().image
                        ? <img src={it().image} alt="" style={{ width: "40px", height: "40px", "object-fit": "cover", "border-radius": "6px", "flex-shrink": "0" }} />
                        : <div class="building-card-icon">{it().icon}</div>
                      }
                      <div>
                        <div class="building-card-title">{it().name}</div>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                          {it().slot} {it().consumable && "· consumable"}
                        </div>
                      </div>
                    </div>
                    <div style={{ "font-size": "0.8rem", color: "var(--accent-green)", "margin-top": "4px" }}>
                      {it().description}
                    </div>
                    <Show when={armorMeta() || it().classes.length > 0}>
                      <div style={{ display: "flex", gap: "6px", "margin-top": "4px", "flex-wrap": "wrap" }}>
                        <Show when={armorMeta()}>
                          <span style={{
                            "font-size": "0.65rem", padding: "1px 5px",
                            background: "rgba(120, 120, 140, 0.2)",
                            border: "1px solid var(--border-color)",
                            "border-radius": "3px",
                            color: "var(--text-secondary)",
                          }}>
                            {armorMeta()!.icon} {armorMeta()!.label}
                          </span>
                        </Show>
                        <Show when={it().classes.length > 0}>
                          <span style={{
                            "font-size": "0.65rem", padding: "1px 5px",
                            background: "rgba(245, 197, 66, 0.12)",
                            border: "1px solid rgba(245, 197, 66, 0.35)",
                            "border-radius": "3px",
                            color: "var(--accent-gold)",
                          }}>
                            {it().classes.join(", ")} only
                          </span>
                        </Show>
                      </div>
                    </Show>
                    <div style={{ "margin-top": "6px", "font-size": "0.85rem", display: "flex", gap: "12px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>
                        In stock: <strong>{inv.quantity}</strong>
                      </span>
                      <Show when={equipped() > 0}>
                        <span style={{ color: "var(--accent-blue)" }}>
                          Equipped: {equipped()}
                        </span>
                      </Show>
                    </div>
                  </div>
                  );
                }}
              </Show>
            );
          }}
        </For>
      </div>

      {/* Crafting Materials — looted from missions, spent in workshop recipes */}
      {(() => {
        const ownedMaterials = () => state.inventory
          .filter((inv) => inv.quantity > 0 && getMaterial(inv.itemId))
          .map((inv) => ({ inv, mat: getMaterial(inv.itemId)! }))
          .sort((a, b) => a.mat.tier - b.mat.tier || a.mat.name.localeCompare(b.mat.name));
        return (
          <Show when={ownedMaterials().length > 0}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-top": "24px", "margin-bottom": "10px", color: "var(--text-primary)" }}>
              Crafting Materials
            </h3>
            <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "10px" }}>
              Looted from missions. Used by blacksmiths, tailors, and alchemists.
            </div>
            <div class="buildings-grid">
              <For each={ownedMaterials()}>
                {({ inv, mat }) => (
                  <div class="building-card">
                    <span class="building-card-category">{mat.category} · tier {mat.tier}</span>
                    <div class="building-card-header" style={{ "margin-top": "4px" }}>
                      {mat.image
                        ? <img src={mat.image} alt="" style={{ width: "40px", height: "40px", "object-fit": "cover", "border-radius": "6px", "flex-shrink": "0" }} />
                        : <div class="building-card-icon">{mat.icon}</div>
                      }
                      <div>
                        <div class="building-card-title">{mat.name} <span style={{ color: "var(--accent-gold)", "font-weight": 600 }}>×{inv.quantity}</span></div>
                        <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "font-style": "italic" }}>
                          {mat.description}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        );
      })()}

      {/* All known items reference — equipment only; consumables (potions,
          elixirs, food) live in the Potions section above. */}
      <h3 style={{ "font-family": "var(--font-heading)", "margin-top": "24px", "margin-bottom": "10px", color: "var(--text-primary)" }}>
        Item Catalog
      </h3>
      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "10px" }}>
        All craftable equipment. Items are crafted at their respective workshops.
      </div>
      <div class="buildings-grid">
        <For each={ITEMS.filter((i) => !i.consumable)}>
          {(item) => {
            const owned = () => state.inventory.find((i) => i.itemId === item.id)?.quantity ?? 0;
            return (
              <div class="building-card" style={{ opacity: owned() > 0 ? 1 : 0.5 }}>
                <span class="building-card-category">{item.slot}</span>
                <div class="building-card-header" style={{ "margin-top": "4px" }}>
                  {item.image
                    ? <img src={item.image} alt="" style={{ width: "40px", height: "40px", "object-fit": "cover", "border-radius": "6px", "flex-shrink": "0" }} />
                    : <div class="building-card-icon">{item.icon}</div>
                  }
                  <div>
                    <div class="building-card-title">{item.name}</div>
                    <div style={{ "font-size": "0.8rem", color: "var(--accent-green)" }}>
                      {item.description}
                    </div>
                  </div>
                </div>
                <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "4px" }}>
                  {item.consumable ? "Consumable · " : ""}{owned() > 0 ? `Owned: ${owned()}` : "Not crafted yet"}
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
