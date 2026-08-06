import { For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import { getFoodCostAmount } from "~/data/foods";
import KitchenDesk from "~/components/KitchenDesk";

/** The Kitchen page — the free-form cooking desk IS the kitchen now (Phase C3).
 *  The old fixed-recipe crafting UI is retired; the recipe DATA stays, so the
 *  staple auto-cook (the "keep a pot on" toggle on the desk cards) still feeds
 *  citizens and the tavern still cooks its menu to order. */
export default function Kitchen() {
  const { state } = useGame();
  const f = () => state.foods ?? ({} as any);
  const level = () => state.buildings.find((b) => b.buildingId === "kitchen")?.level ?? 0;
  const summary = () => [
    { icon: "🌾", label: "Grain", v: Math.floor((f().wheat ?? 0) + (f().barley ?? 0)) },
    { icon: "🍖", label: "Meat", v: Math.floor(getFoodCostAmount(f(), "meat")) },
    { icon: "🐟", label: "Fish", v: Math.floor(getFoodCostAmount(f(), "fish")) },
    { icon: "🥚", label: "Eggs", v: Math.floor(f().eggs ?? 0) },
    { icon: "🥛", label: "Milk", v: Math.floor(f().milk ?? 0) },
    { icon: "🥬", label: "Veg", v: Math.floor((f().cabbages ?? 0) + (f().turnips ?? 0) + (f().peas ?? 0) + (f().squash ?? 0) + (f().fava ?? 0)) },
    { icon: "🍎", label: "Fruit", v: Math.floor((f().apples ?? 0) + (f().pears ?? 0) + (f().cherries ?? 0) + (f().strawberries ?? 0)) },
    { icon: "🍄", label: "Wild", v: Math.floor((f().berries ?? 0) + (f().mushrooms ?? 0) + (f().nuts ?? 0)) },
    { icon: "🍯", label: "Honey", v: Math.floor(state.honey) },
  ];
  return (
    <div>
      <h1 class="page-title">🍳 The Kitchens{level() > 0 ? ` · Lv.${level()}` : ""}</h1>
      <Show
        when={level() > 0}
        fallback={
          <div style={{ padding: "24px", background: "var(--bg-secondary)", "border-radius": "8px", "text-align": "center", color: "var(--text-muted)" }}>
            Build the Kitchen to start cooking — then bring your larder here to prepare meals for the settlement and the road.
          </div>
        }
      >
        {/* Larder totals (the old crafting summary, kept as a quick overview). */}
        <div style={{ display: "flex", "flex-wrap": "wrap", gap: "14px", padding: "10px 14px", "margin-bottom": "12px", background: "var(--bg-secondary)", "border-radius": "6px", "font-size": "0.85rem", color: "var(--text-secondary)" }}>
          <For each={summary()}>{(m) => <span>{m.icon} {m.label}: {m.v}</span>}</For>
        </div>
        <KitchenDesk />
      </Show>
    </div>
  );
}
