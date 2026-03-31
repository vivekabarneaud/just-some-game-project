import { For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { ITEMS, getItem } from "~/data/items";

export default function Inventory() {
  const { state } = useGame();

  const ownedItems = () => state.inventory.filter((i) => i.quantity > 0);

  // Count equipped items across all adventurers
  const equippedCount = (itemId: string) =>
    state.adventurers.filter((a) => a.alive && (
      a.equipment.weapon === itemId || a.equipment.armor === itemId || a.equipment.trinket === itemId
    )).length;

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
      </div>

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
                      <div class="building-card-icon">{it().icon}</div>
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
                  <div class="building-card-icon">{item.icon}</div>
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
