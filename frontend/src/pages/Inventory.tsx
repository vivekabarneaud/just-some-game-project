import { For, Show, type JSX } from "solid-js";
import FramedItemCard from "~/components/FramedItemCard";
import { useGame, BUILDING_TOOLS, getBuildingTool } from "~/engine/gameState";
import { ITEMS, MATERIALS, getItem, getMaterial, getPotionInfo, isSupplyItem, isFoodItem, getFoodEffect, MATCHED_FOOD_HP_BONUS, ARMOR_TYPE_META } from "@medieval-realm/shared/data/items";
import { ALCHEMY_RECIPES } from "@medieval-realm/shared/data/alchemy_recipes";
import { HERBS } from "@medieval-realm/shared/data/herbs";
import { getFoodIngredient } from "@medieval-realm/shared/data/kitchen/ingredients";
import { dishMissionBoons } from "@medieval-realm/shared/data/kitchen/mission";
import { describeEffectParts, effectKind } from "@medieval-realm/shared/data/alchemy/describe";
import WeaponDamage from "~/components/WeaponDamage";
import { BUILDINGS } from "~/data/buildings";
import { VEGGIES } from "~/data/gardens";
import SeedIcon from "~/components/SeedIcon";
import PotionEffects from "~/components/PotionEffects";

/** Every inventory item as a framed card (matches the alchemy/kitchen cards).
 *  Pass an emoji `icon` or an `image` URL; `count` shows as ×N; `category` is the
 *  little badge line; `children` is the per-item body (effects, flavour, etc.). */
function InvCard(props: { rarity?: string; icon?: string; image?: string; iconNode?: JSX.Element; name: JSX.Element; count?: number; category?: string; dim?: boolean; children?: JSX.Element }) {
  return (
    <FramedItemCard rarity={props.rarity ?? "common"} dim={props.dim} minHeight="118px"
      icon={props.iconNode
        ? props.iconNode
        : props.image
        ? <img src={props.image} alt="" style={{ width: "44px", height: "44px", "object-fit": "cover" }} />
        : <span style={{ "font-size": "1.5rem" }}>{props.icon}</span>}
      title={<>{props.name}{props.count != null ? <span style={{ color: "var(--accent-gold)", "font-weight": 400 }}> ×{props.count}</span> : null}</>}
      subtitle={props.category}
    >{props.children}</FramedItemCard>
  );
}

export default function Inventory() {
  const { state } = useGame();

  // Equipment section — excludes food (shown separately) and consumables/potions
  // (rendered in their own section above).
  const ownedItems = () => state.inventory.filter((i) => {
    if (i.quantity <= 0) return false;
    const item = getItem(i.itemId);
    if (!item) return false;
    return !isFoodItem(i.itemId) && !isSupplyItem(i.itemId) && !item.consumable;
  });

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
        <span>🧪 Potions: {(() => {
          let n = 0;
          for (const inv of state.inventory) {
            if (inv.quantity > 0 && (isSupplyItem(inv.itemId) || state.alchemyRecipes?.[inv.itemId])) n += inv.quantity;
          }
          return n;
        })()}</span>
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
                  <InvCard icon={tool.icon} name={tool.name} count={inv.quantity} category="tool">
                    <div style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>For: {BUILDINGS.find((b) => b.id === tool.targetBuilding)?.name ?? tool.targetBuilding}</div>
                    <div style={{ "font-size": "0.74rem", color: "var(--text-secondary)", "margin-top": "2px" }}>{tool.description}</div>
                  </InvCard>
                )}
              </For>
              <For each={installedTools()}>
                {({ buildingId, tool }) => (
                  <InvCard icon={tool.icon} name={tool.name} category="installed" dim>
                    <div style={{ "font-size": "0.72rem", color: "var(--accent-green)" }}>Installed at {BUILDINGS.find((b) => b.id === buildingId)?.name ?? buildingId}</div>
                  </InvCard>
                )}
              </For>
            </div>
          </Show>
        );
      })()}

      {/* Potions — supply items (fixed) AND brewed free-form potions. */}
      {(() => {
        const KIND_COLOR: Record<string, string> = { recovery: "var(--accent-green)", combat: "var(--accent-blue)", offensive: "var(--accent-red)" };
        type Row = { inv: { itemId: string; quantity: number }; name: string; icon: string; image?: string; description: string; brewed?: { effects: { channel: string; amount: number; shape?: string; rounds?: number }[]; quality: string } };
        const potionItems = (): Row[] => {
          const rows: Row[] = [];
          for (const inv of state.inventory) {
            if (inv.quantity <= 0) continue;
            const brewed = state.alchemyRecipes?.[inv.itemId];
            if (brewed) { rows.push({ inv, name: brewed.name, icon: "🧪", description: "", brewed }); continue; }
            if (!isSupplyItem(inv.itemId)) continue;
            const item = getItem(inv.itemId);
            if (item) { rows.push({ inv, name: item.name, icon: item.icon, image: item.image, description: item.description }); continue; }
            const alch = ALCHEMY_RECIPES.find((r) => r.id === inv.itemId);
            if (alch) rows.push({ inv, name: alch.name, icon: alch.icon, image: alch.image, description: alch.description });
          }
          return rows;
        };
        return (
          <Show when={potionItems().length > 0}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "10px", color: "var(--text-primary)" }}>
              Potions
            </h3>
            <div class="buildings-grid" style={{ "margin-bottom": "20px" }}>
              <For each={potionItems()}>
                {(p) => {
                  const info = getPotionInfo(p.inv.itemId);
                  const hasMission = !!info?.mission;
                  const hasCombat = !!info?.combat;
                  const hasRecovery = !!info?.recovery;
                  const categoryLabel = p.brewed ? `brewed · ${p.brewed.quality}` : hasRecovery ? "recovery" : (hasMission && hasCombat) ? "any" : hasCombat ? "combat" : "mission";
                  const usageHint = p.brewed ? "Brewed at the Alchemy Lab" : hasRecovery ? "Heals between encounters" : (hasMission && hasCombat) ? "Any mission" : hasCombat ? "Used during combat" : "Non-combat missions";
                  return (
                    <InvCard icon={p.icon} image={p.image} name={p.name} count={p.inv.quantity} category={categoryLabel}>
                      <div style={{ "font-size": "0.7rem", color: "var(--text-muted)" }}>{usageHint}</div>
                      <div style={{ "font-size": "0.76rem", "margin-top": "2px" }}>
                        <Show when={p.brewed} fallback={<span style={{ color: "var(--accent-green)" }}><PotionEffects itemId={p.inv.itemId} fallback={p.description} /></span>}>
                          <For each={p.brewed!.effects as any[]}>
                            {(e) => {
                              const pt = describeEffectParts(e);
                              return <div style={{ color: KIND_COLOR[effectKind(e.channel)] }}><b>{pt.label}</b>{pt.detail ? `: ${pt.detail}` : ""}</div>;
                            }}
                          </For>
                        </Show>
                      </div>
                    </InvCard>
                  );
                }}
              </For>
            </div>
          </Show>
        );
      })()}

      {/* Food */}
      {(() => {
        const foodItems = () => state.inventory
          .filter((inv) => inv.quantity > 0 && isFoodItem(inv.itemId))
          .map((inv) => ({ inv, item: getItem(inv.itemId)! }))
          .filter(({ item }) => !!item);
        const foodBuffParts = (itemId: string): string[] => {
          const fx = getFoodEffect(itemId);
          const parts: string[] = [];
          if (fx?.statBonus) parts.push(`+${fx.statBonus.amount} ${fx.statBonus.stat.toUpperCase()}`);
          if (fx?.hpBonus) parts.push(`+${fx.hpBonus} HP`);
          return parts;
        };
        return (
          <Show when={foodItems().length > 0}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-bottom": "10px", color: "var(--text-primary)" }}>
              Food
            </h3>
            <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "10px" }}>
              Carry one per adventurer. Matching the adventurer's flavor preference grants +{MATCHED_FOOD_HP_BONUS} HP and +1 loyalty on mission success.
            </div>
            <div class="buildings-grid" style={{ "margin-bottom": "20px" }}>
              <For each={foodItems()}>
                {({ inv, item }) => {
                  const buffs = foodBuffParts(item.id);
                  const flavors = item.foodFlavors ?? [];
                  return (
                    <InvCard icon={item.icon} image={item.image} name={item.name} count={inv.quantity} category={flavors.join(", ") || "food"}>
                      <div style={{ "font-size": "0.74rem", color: "var(--text-secondary)", "font-style": "italic" }}>{item.description}</div>
                      <Show when={buffs.length > 0}>
                        <div style={{ "font-size": "0.76rem", color: "var(--accent-green)", "margin-top": "2px" }}>{buffs.join(" · ")}</div>
                      </Show>
                    </InvCard>
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
                  <InvCard rarity={(it() as any).rarity} icon={it().icon} image={it().image} name={it().name} count={inv.quantity} category={`${it().slot}${it().consumable ? " · consumable" : ""}`}>
                    <div style={{ "font-size": "0.74rem", color: "var(--accent-green)" }}>{it().description}</div>
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
                    <Show when={equipped() > 0}>
                      <div style={{ "font-size": "0.74rem", color: "var(--accent-blue)", "margin-top": "3px" }}>Equipped: {equipped()}</div>
                    </Show>
                  </InvCard>
                  );
                }}
              </Show>
            );
          }}
        </For>
      </div>

      {/* Seeds — per-crop stock for sowing gardens. Saved from each harvest,
          topped up at the Marketplace. */}
      {(() => {
        const ownedSeeds = () => VEGGIES
          .map((v) => ({ v, n: state.seeds?.[v.id] ?? 0 }))
          .filter((s) => s.n > 0);
        return (
          <Show when={ownedSeeds().length > 0}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-top": "24px", "margin-bottom": "10px", color: "var(--text-primary)" }}>
              Seeds
            </h3>
            <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "10px" }}>
              Sown in gardens — each seed grows a plant that yields all season. A steady plot saves its own seed at year's end.
            </div>
            <div class="buildings-grid">
              <For each={ownedSeeds()}>
                {({ v, n }) => (
                  <InvCard iconNode={<SeedIcon id={v.id} size={44} />} name={`${v.name} Seed`} count={n} category="seed">
                    <div style={{ "font-size": "0.74rem", color: "var(--text-secondary)", "font-style": "italic" }}>Sow in {v.plantSeasons.join(", ")}.</div>
                  </InvCard>
                )}
              </For>
            </div>
          </Show>
        );
      })()}

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
                  <InvCard icon={mat.icon} image={mat.image} name={mat.name} count={inv.quantity} category={`${mat.category} · tier ${mat.tier}`}>
                    <div style={{ "font-size": "0.74rem", color: "var(--text-secondary)", "font-style": "italic" }}>{mat.description}</div>
                  </InvCard>
                )}
              </For>
            </div>
          </Show>
        );
      })()}

      {/* Herbs & Plants — foraged / mission-won, brewed at the Alchemy Lab.
          Read from state.herbs (their own store), shown here as a category. */}
      {(() => {
        const owned = () => HERBS
          .map((h) => ({ h, n: state.herbs?.[h.id] ?? 0 }))
          .filter((x) => x.n > 0)
          .sort((a, b) => a.h.name.localeCompare(b.h.name));
        return (
          <Show when={owned().length > 0}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-top": "24px", "margin-bottom": "10px", color: "var(--text-primary)" }}>
              Herbs & Plants
            </h3>
            <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "10px" }}>
              Foraged and won from the wilds. Brewed into remedies and draughts at the Alchemy Lab.
            </div>
            <div class="buildings-grid">
              <For each={owned()}>
                {({ h, n }) => (
                  <InvCard rarity={h.rarity} icon={h.icon} name={h.name} count={n} category={h.rarity}>
                    <div style={{ "font-size": "0.76rem", color: "var(--text-secondary)", "font-style": "italic" }}>{h.description}</div>
                  </InvCard>
                )}
              </For>
            </div>
          </Show>
        );
      })()}

      {/* Prepared Dishes — cooked at the Kitchen desk; pack them for an adventure
          or feature them at the tavern. Read from state.cookedDishes (own store). */}
      {(() => {
        const dishes = () => Object.entries(state.cookedDishes ?? {})
          .map(([id, n]) => ({ d: state.kitchenDishes?.[id], n: Math.floor(Number(n)) }))
          .filter((x) => !!x.d && x.n > 0)
          .sort((a, b) => a.d!.name.localeCompare(b.d!.name));
        return (
          <Show when={dishes().length > 0}>
            <h3 style={{ "font-family": "var(--font-heading)", "margin-top": "24px", "margin-bottom": "10px", color: "var(--text-primary)" }}>
              Prepared Dishes
            </h3>
            <div style={{ "font-size": "0.8rem", color: "var(--text-muted)", "margin-bottom": "10px" }}>
              Cooked at the Kitchen. Pack one for an adventure (a well-fed bonus) or feature it at the tavern.
            </div>
            <div class="buildings-grid">
              <For each={dishes()}>
                {(x) => {
                  const d = x.d!;
                  const b = dishMissionBoons(d.effects);
                  const icon = getFoodIngredient(d.placements[0]?.ingredientId)?.icon ?? "🍲";
                  const parts: string[] = [];
                  if (b.hpBonus) parts.push(`+${b.hpBonus} HP`);
                  if (b.loyalty) parts.push(`❤ +${b.loyalty} loyalty`);
                  return (
                    <InvCard icon={icon} name={d.name} count={x.n} category="meal">
                      <div style={{ "font-size": "0.76rem", color: "var(--accent-green)" }}>{parts.join(" · ") || "a good meal"}</div>
                    </InvCard>
                  );
                }}
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
              <InvCard rarity={(item as any).rarity} icon={item.icon} image={item.image} name={item.name} category={item.slot} dim={owned() === 0}>
                <div style={{ "font-size": "0.74rem", color: "var(--accent-green)" }}>{item.description}</div>
                <WeaponDamage item={item} />
                <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "3px" }}>
                  {owned() > 0 ? `Owned: ${owned()}` : "Not crafted yet"}
                </div>
              </InvCard>
            );
          }}
        </For>
      </div>
    </div>
  );
}
