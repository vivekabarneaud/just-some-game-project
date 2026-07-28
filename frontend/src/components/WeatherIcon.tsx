import { Show } from "solid-js";
import { WEATHER_META, type WeatherType } from "~/data/weather";

/**
 * Renders a weather's hand-drawn emblem, falling back to its emoji where there's
 * no art yet. Mirror of <SeasonIcon>. One place to swap emoji → emblem for the
 * weather (heat wave has the angry-sun emblem; the rest are still emoji).
 */
export default function WeatherIcon(props: { weather: WeatherType; size?: number }) {
  const meta = () => WEATHER_META[props.weather];
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
