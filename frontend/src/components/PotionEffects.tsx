import { For, Show } from "solid-js";
import { getPotionEffectLines } from "@medieval-realm/shared/data/items";

/**
 * Renders a potion's effects as labelled lines grouped by context
 * ("In combat: …", "At home: …", "On a mission: …") instead of one cramped
 * prose blob. Derived from POTION_REGISTRY. Falls back to `fallback` prose for
 * anything that isn't a known supply item (so non-potion recipes still read).
 * Inherits text colour from its container.
 */
export default function PotionEffects(props: { itemId: string; fallback?: string }) {
  const lines = () => getPotionEffectLines(props.itemId);
  return (
    <Show when={lines().length > 0} fallback={<span>{props.fallback}</span>}>
      <div style={{ display: "flex", "flex-direction": "column", gap: "5px" }}>
        <For each={lines()}>
          {(l) => (
            <div><b>{l.label}:</b> {l.text}</div>
          )}
        </For>
      </div>
    </Show>
  );
}
