import { For, Show } from "solid-js";
import { useGame, BUILDING_TOOLS, getBuildingTool } from "~/engine/gameState";
import { ITEMS, getItem } from "~/data/items";
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
                {(it) => (
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
                )}
              </Show>
            );
          }}
        </For>
      </div>

      {/* All known items reference */}
      <h3 style={{ "font-family": "var(--font-heading)", "margin-top": "24px", "margin-bottom": "10px", color: "var(--text-primary)" }}>
        Item Catalog
      </h3>
      <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "10px" }}>
        All craftable equipment. Items are crafted at their respective workshops.
      </div>
      <div class="buildings-grid">
        <For each={ITEMS}>
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
