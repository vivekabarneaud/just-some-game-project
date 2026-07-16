import { Show } from "solid-js";
import { SEASON_META, type Season } from "~/data/seasons";

/**
 * Renders a season's hand-drawn icon, falling back to its emoji where there's
 * no art yet (autumn). One place to swap emoji → icon everywhere.
 */
export default function SeasonIcon(props: { season: Season; size?: number }) {
  const meta = () => SEASON_META[props.season];
  const px = () => `${props.size ?? 18}px`;
  return (
    <Show
      when={meta().image}
      fallback={<span style={{ "font-size": px(), "line-height": "1" }}>{meta().icon}</span>}
    >
      <img
        src={meta().image!}
        alt={meta().name}
        style={{
          width: px(), height: px(), "object-fit": "contain",
          display: "inline-block", "vertical-align": "middle", "flex-shrink": "0",
        }}
      />
    </Show>
  );
}
