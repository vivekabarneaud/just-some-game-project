import { Show, createSignal, createEffect } from "solid-js";
import { getFoodMeta, type FoodItemType } from "~/data/foods";

/**
 * Renders a food item's icon. Uses the custom PNG if one is set in the food
 * meta (FoodItemMeta.iconImage), otherwise falls back to the emoji string.
 * If the PNG fails to load (e.g. not yet uploaded to R2), it also falls back
 * to the emoji instead of showing a broken image.
 *
 * Keep `size` in px — the image is square. Emoji scales with fontSize.
 */
export default function FoodIcon(props: { id: FoodItemType; size?: number; class?: string }) {
  const meta = () => getFoodMeta(props.id);
  const size = () => props.size ?? 18;
  const [failed, setFailed] = createSignal(false);
  // Reset the load-failed flag when the source changes (Solid may reuse the node).
  createEffect(() => { meta().iconImage; props.id; setFailed(false); });
  return (
    <Show when={meta().iconImage && !failed()} fallback={
      <span class={props.class} style={{ "font-size": `${size()}px`, "line-height": "1" }}>
        {meta().icon}
      </span>
    }>
      <img
        src={meta().iconImage}
        alt={meta().label}
        class={props.class}
        style={{
          width: `${size()}px`,
          height: `${size()}px`,
          display: "inline-block",
          "vertical-align": "middle",
          "object-fit": "contain",
        }}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </Show>
  );
}
