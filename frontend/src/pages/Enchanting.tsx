import { For, Show, createSignal, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { useGame } from "~/engine/gameState";
import {
  ENCHANTMENTS,
  getEnchantment,
  getEnchantmentsForSlot,
  type EnchantmentDefinition,
} from "~/data/enchantments";
import {
  getItem,
  getMaterial,
  type ItemSlot,
  type InventoryItem,
} from "@medieval-realm/shared/data/items";
import {
  getPortraitUrl,
  RANK_NAMES,
  RANK_COLORS,
  getClassMeta,
} from "@medieval-realm/shared/data/adventurers";
import type { Adventurer } from "@medieval-realm/shared/data/adventurers";
import Tooltip from "~/components/Tooltip";

const SLOT_ORDER: { id: ItemSlot; icon: string }[] = [
  { id: "mainHand", icon: "⚔️" },
  { id: "offHand", icon: "🛡️" },
  { id: "head", icon: "🪖" },
  { id: "chest", icon: "🦺" },
  { id: "legs", icon: "👖" },
  { id: "boots", icon: "🥾" },
  { id: "cloak", icon: "🧣" },
  { id: "ring1", icon: "💍" },
  { id: "ring2", icon: "💍" },
  { id: "amulet", icon: "📿" },
];

const SLOT_LABELS: Record<string, string> = {
  mainHand: "Main Hand",
  offHand: "Off Hand",
  head: "Head",
  chest: "Chest",
  legs: "Legs",
  boots: "Boots",
  cloak: "Cloak",
  ring1: "Ring",
  ring2: "Ring",
  amulet: "Amulet",
  trinket: "Trinket",
};

const ELEMENT_COLORS: Record<string, string> = {
  fire: "#e74c3c",
  frost: "#3498db",
  lightning: "#f1c40f",
  holy: "#f5e0a0",
  shadow: "#9b59b6",
  nature: "#2ecc71",
  arcane: "#a78bfa",
};

export default function Enchanting() {
  const { state, actions } = useGame();

  const [selectedEnchant, setSelectedEnchant] = createSignal<string | null>(null);

  const tower = () => state.buildings.find((b) => b.buildingId === "mage_tower");
  const towerLevel = () => tower()?.level ?? 0;

  const selectedDef = () => {
    const id = selectedEnchant();
    return id ? getEnchantment(id) : undefined;
  };

  // Available enchantments (tower level met)
  const availableEnchants = () => ENCHANTMENTS.filter((e) => towerLevel() >= e.minTowerLevel);
  const lockedEnchants = () => ENCHANTMENTS.filter((e) => towerLevel() < e.minTowerLevel);

  // Can we afford the selected enchantment?
  const canAffordSelected = () => {
    const ench = selectedDef();
    if (!ench) return false;
    for (const cost of ench.costs) {
      const inv = state.inventory.find((i) => i.itemId === cost.resource);
      if (!inv || inv.quantity < cost.amount) return false;
    }
    return true;
  };

  // Adventurers not on mission
  const enchantableAdventurers = () =>
    state.adventurers.filter((a) => a.alive && !a.onMission);

  // Check if a slot is eligible for the selected enchantment (ignoring cost)
  const isEligibleTarget = (adv: Adventurer, slotId: ItemSlot): boolean => {
    const ench = selectedDef();
    if (!ench) return false;
    const itemId = adv.equipment[slotId];
    if (!itemId) return false;
    return ench.validSlots.includes(slotId);
  };

  // Check if an inventory item is eligible (ignoring cost)
  const isEligibleInventoryTarget = (inv: InventoryItem): boolean => {
    const ench = selectedDef();
    if (!ench) return false;
    const item = getItem(inv.itemId);
    if (!item || item.consumable) return false;
    return ench.validSlots.includes(item.slot);
  };

  // Inventory items that are equipment (non-consumable, non-material)
  const equipmentInventory = createMemo(() =>
    state.inventory
      .map((inv, idx) => ({ inv, idx }))
      .filter(({ inv }) => {
        const item = getItem(inv.itemId);
        return item && !item.consumable && inv.quantity > 0;
      })
  );

  const handleEnchantEquipped = (adventurerId: string, slot: ItemSlot) => {
    const enchId = selectedEnchant();
    if (!enchId || !canAffordSelected()) return;
    if (!isEligibleTarget(
      state.adventurers.find((a) => a.id === adventurerId)!,
      slot,
    )) return;
    actions.enchantItem(enchId, adventurerId, slot, null);
  };

  const handleEnchantInventory = (inventoryIdx: number) => {
    const enchId = selectedEnchant();
    if (!enchId || !canAffordSelected()) return;
    actions.enchantItem(enchId, null, null, inventoryIdx);
  };

  const getEnchantCountOnSlot = (adv: Adventurer, slotId: string): string[] => {
    return adv.equipmentEnchants?.[slotId] ?? [];
  };

  const getEnchantCountOnItem = (inv: InventoryItem): string[] => {
    return inv.enchantments ?? [];
  };

  return (
    <div>
      <h1 class="page-title">✨ Enchanting</h1>

      <Show when={towerLevel() === 0}>
        <div style={{
          padding: "24px",
          background: "var(--bg-secondary)",
          "border-radius": "8px",
          "text-align": "center",
          color: "var(--text-muted)",
        }}>
          <div style={{ "font-size": "2rem", "margin-bottom": "8px" }}>🏰</div>
          <p>Build the Mage Tower to unlock enchanting.</p>
          <A href="/buildings/mage_tower" style={{ color: "var(--accent-gold)" }}>
            Go to building →
          </A>
        </div>
      </Show>

      <Show when={towerLevel() > 0}>
        {/* Header bar */}
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
          "align-items": "center",
        }}>
          <span>🏰 Mage Tower Lv.{towerLevel()}</span>
          <Show when={selectedDef()}>
            <span style={{ color: "var(--text-muted)" }}>|</span>
            <span>
              Selected: <strong style={{ color: ELEMENT_COLORS[selectedDef()!.element ?? ""] ?? "var(--text-primary)" }}>
                {selectedDef()!.icon} {selectedDef()!.name}
              </strong>
            </span>
            <Show when={!canAffordSelected()}>
              <span style={{ color: "var(--accent-red)", "font-size": "0.8rem" }}>
                (missing materials)
              </span>
            </Show>
          </Show>
        </div>

        <div class="enchanting-layout">
          {/* ── Left panel: recipes ─────────────────────────── */}
          <div class="enchanting-recipes">
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
              Recipes
            </h3>
            <div class="enchanting-recipe-list">
              <For each={availableEnchants()}>
                {(ench) => {
                  const isSelected = () => selectedEnchant() === ench.id;
                  const hasResources = () => {
                    for (const cost of ench.costs) {
                      const inv = state.inventory.find((i) => i.itemId === cost.resource);
                      if (!inv || inv.quantity < cost.amount) return false;
                    }
                    return true;
                  };
                  return (
                    <div
                      class={`enchanting-recipe ${isSelected() ? "selected" : ""} ${!hasResources() ? "insufficient" : ""}`}
                      onClick={() => setSelectedEnchant(isSelected() ? null : ench.id)}
                    >
                      <div class="enchanting-recipe-header">
                        <span class="enchanting-recipe-icon" style={{
                          color: ELEMENT_COLORS[ench.element ?? ""] ?? "var(--text-primary)",
                        }}>
                          {ench.icon}
                        </span>
                        <div>
                          <div class="enchanting-recipe-name">{ench.name}</div>
                          <div class="enchanting-recipe-desc">{ench.description}</div>
                        </div>
                      </div>
                      <div class="enchanting-recipe-meta">
                        <div class="enchanting-recipe-slots">
                          <For each={ench.validSlots}>
                            {(slot) => <span class="enchanting-slot-tag">{SLOT_LABELS[slot] ?? slot}</span>}
                          </For>
                        </div>
                        <div class="enchanting-recipe-costs">
                          <For each={ench.costs}>
                            {(cost) => {
                              const mat = () => getMaterial(cost.resource);
                              const have = () => state.inventory.find((i) => i.itemId === cost.resource)?.quantity ?? 0;
                              const enough = () => have() >= cost.amount;
                              return (
                                <Tooltip content={() => (
                                  <div>
                                    <strong>{mat()?.name ?? cost.resource.replace(/_/g, " ")}</strong>
                                    <Show when={mat()?.description}>
                                      <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)", "margin-top": "2px" }}>
                                        {mat()!.description}
                                      </div>
                                    </Show>
                                  </div>
                                )}>
                                  <span class={`enchanting-cost ${enough() ? "" : "missing"}`}>
                                    {mat()?.icon ?? "?"} {have()}/{cost.amount}
                                  </span>
                                </Tooltip>
                              );
                            }}
                          </For>
                        </div>
                      </div>
                    </div>
                  );
                }}
              </For>

              <Show when={lockedEnchants().length > 0}>
                <div style={{
                  "margin-top": "12px",
                  "padding-top": "12px",
                  "border-top": "1px solid var(--border-color)",
                }}>
                  <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "8px" }}>
                    Locked (requires higher tower level)
                  </div>
                  <For each={lockedEnchants()}>
                    {(ench) => (
                      <div class="enchanting-recipe locked">
                        <div class="enchanting-recipe-header">
                          <span class="enchanting-recipe-icon" style={{ opacity: 0.4 }}>
                            {ench.icon}
                          </span>
                          <div>
                            <div class="enchanting-recipe-name">{ench.name}</div>
                            <div class="enchanting-recipe-desc" style={{ color: "var(--text-muted)" }}>
                              Requires Mage Tower Lv.{ench.minTowerLevel}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>

          {/* ── Right panel: targets ──────────────────────── */}
          <div class="enchanting-targets">
            {/* Adventurer gear */}
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
              Equipped Gear
            </h3>
            <Show when={enchantableAdventurers().length === 0}>
              <div style={{ color: "var(--text-muted)", "font-size": "0.85rem", padding: "12px 0" }}>
                No adventurers available.
              </div>
            </Show>
            <div class="enchanting-adventurer-list">
              <For each={enchantableAdventurers()}>
                {(adv) => {
                  const cls = () => getClassMeta(adv.class);
                  return (
                    <div class="enchanting-adv-card">
                      <div class="enchanting-adv-info">
                        <img
                          src={getPortraitUrl(adv)}
                          alt={adv.name}
                          class="enchanting-adv-portrait"
                          loading="lazy"
                        />
                        <div>
                          <div style={{ "font-weight": "600", "font-size": "0.9rem" }}>{adv.name}</div>
                          <div style={{ "font-size": "0.78rem", color: "var(--text-muted)" }}>
                            <span style={{ color: RANK_COLORS[adv.rank] }}>{RANK_NAMES[adv.rank]}</span>
                            {" "}{cls()?.icon} {cls()?.name} · Lv.{adv.level}
                          </div>
                        </div>
                      </div>
                      <div class="enchanting-gear-row">
                        <For each={SLOT_ORDER}>
                          {(slotDef) => {
                            const itemId = () => adv.equipment[slotDef.id];
                            const item = () => itemId() ? getItem(itemId()!) : undefined;
                            const enchants = () => getEnchantCountOnSlot(adv, slotDef.id);
                            const eligible = () => selectedEnchant() !== null && isEligibleTarget(adv, slotDef.id);
                            const canEnchant = () => eligible() && canAffordSelected();
                            const faded = () => selectedEnchant() !== null && !eligible() && itemId() !== null;
                            return (
                              <Tooltip content={() => (
                                <div>
                                  <strong>{item()?.name ?? SLOT_LABELS[slotDef.id]}</strong>
                                  <Show when={enchants().length > 0}>
                                    <div style={{ "margin-top": "4px" }}>
                                      <For each={enchants()}>
                                        {(eId) => {
                                          const e = getEnchantment(eId);
                                          return <div style={{ "font-size": "0.8rem", color: ELEMENT_COLORS[e?.element ?? ""] ?? "#a78bfa" }}>{e?.icon} {e?.name}</div>;
                                        }}
                                      </For>
                                    </div>
                                  </Show>
                                </div>
                              )}>
                                <div
                                  class={`enchanting-gear-slot ${itemId() ? "filled" : "empty"} ${canEnchant() ? "valid-target" : ""} ${eligible() && !canAffordSelected() ? "eligible" : ""} ${faded() ? "faded" : ""}`}
                                  onClick={() => canEnchant() && handleEnchantEquipped(adv.id, slotDef.id)}
                                >
                                  <Show when={item()?.image} fallback={
                                    <span class="enchanting-gear-icon">{item()?.icon ?? slotDef.icon}</span>
                                  }>
                                    <img src={item()!.image} alt="" class="enchanting-gear-img" />
                                  </Show>
                                  <Show when={enchants().length > 0}>
                                    <span class="enchanting-badge">{enchants().length}</span>
                                  </Show>
                                </div>
                              </Tooltip>
                            );
                          }}
                        </For>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>

            {/* Divider */}
            <hr style={{
              border: "none",
              "border-top": "1px solid var(--border-color)",
              margin: "16px 0",
            }} />

            {/* Inventory equipment */}
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "8px", color: "var(--text-primary)" }}>
              Inventory
            </h3>
            <Show when={equipmentInventory().length === 0}>
              <div style={{ color: "var(--text-muted)", "font-size": "0.85rem", padding: "12px 0" }}>
                No equipment in inventory.
              </div>
            </Show>
            <div class="enchanting-inventory-grid">
              <For each={equipmentInventory()}>
                {({ inv, idx }) => {
                  const item = () => getItem(inv.itemId);
                  const enchants = () => getEnchantCountOnItem(inv);
                  const eligible = () => selectedEnchant() !== null && isEligibleInventoryTarget(inv);
                  const canEnchant = () => eligible() && canAffordSelected();
                  const faded = () => selectedEnchant() !== null && !eligible();
                  return (
                    <Tooltip content={() => (
                      <div>
                        <strong>{item()?.name}</strong>
                        {inv.quantity > 1 && <span> x{inv.quantity}</span>}
                        <div style={{ "font-size": "0.8rem", color: "var(--text-secondary)" }}>{item()?.description}</div>
                        <Show when={enchants().length > 0}>
                          <div style={{ "margin-top": "4px" }}>
                            <For each={enchants()}>
                              {(eId) => {
                                const e = getEnchantment(eId);
                                return <div style={{ "font-size": "0.8rem", color: ELEMENT_COLORS[e?.element ?? ""] ?? "#a78bfa" }}>{e?.icon} {e?.name}</div>;
                              }}
                            </For>
                          </div>
                        </Show>
                      </div>
                    )}>
                      <div
                        class={`enchanting-inv-slot ${canEnchant() ? "valid-target" : ""} ${eligible() && !canAffordSelected() ? "eligible" : ""} ${faded() ? "faded" : ""}`}
                        onClick={() => canEnchant() && handleEnchantInventory(idx)}
                      >
                        <Show when={item()?.image} fallback={
                          <span class="enchanting-inv-icon">{item()?.icon ?? "?"}</span>
                        }>
                          <img src={item()!.image} alt="" class="enchanting-inv-img" />
                        </Show>
                        <Show when={inv.quantity > 1}>
                          <span class="enchanting-qty">{inv.quantity}</span>
                        </Show>
                        <Show when={enchants().length > 0}>
                          <span class="enchanting-badge">{enchants().length}</span>
                        </Show>
                      </div>
                    </Tooltip>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
