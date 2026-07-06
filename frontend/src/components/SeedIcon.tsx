import { Show, createSignal, createEffect } from "solid-js";
import { getVeggie, type VeggieId } from "~/data/gardens";

/**
 * Renders a crop's SEED icon. Uses the custom PNG (VeggieDefinition.seedImage)
 * if set, otherwise falls back to the crop's emoji. If the PNG fails to load
 * (e.g. not yet uploaded to R2), it also falls back to the emoji rather than
 * showing a broken image.
 *
 * Keep `size` in px — the image is square. Emoji scales with fontSize.
 */
export default function SeedIcon(props: { id: VeggieId; size?: number; class?: string }) {
  const veggie = () => getVeggie(props.id);
  const size = () => props.size ?? 18;
  const [failed, setFailed] = createSignal(false);
  createEffect(() => { veggie().seedImage; props.id; setFailed(false); });
  return (
    <Show when={veggie().seedImage && !failed()} fallback={
      <span class={props.class} style={{ "font-size": `${size()}px`, "line-height": "1" }}>
        {veggie().icon}
      </span>
    }>
      <img
        src={veggie().seedImage}
        alt={`${veggie().name} seed`}
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
