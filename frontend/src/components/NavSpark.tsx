import { SPARK_GOLD, SPARK_RED } from "~/data/navWidgets";

/** Sidebar notification spark — a hand-drawn four-point star that sits at rest
 *  while a ghost of itself blooms outward and fades (a "halo"), replacing the
 *  old numbered pill. Gold by default; `urgent` recolours it red and speeds the
 *  halo up for immediate-danger nudges. Carries no count by design — it just
 *  says "something new here". Motion tuning lives in .nav-spark (global.css). */
export function NavSpark(props: { urgent?: boolean }) {
  return (
    <span
      class="nav-spark"
      classList={{ urgent: props.urgent }}
      style={{ "--spark-img": `url(${props.urgent ? SPARK_RED : SPARK_GOLD})` }}
      aria-hidden="true"
    >
      <span class="nav-spark-halo" />
      <span class="nav-spark-halo h2" />
      <span class="nav-spark-core" />
    </span>
  );
}
