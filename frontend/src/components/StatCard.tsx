import type { JSX } from "solid-js";

/** A framed summary card with an uppercase label above its value, the whole
 *  group centered both horizontally and vertically — so a row of them lines up
 *  no matter how tall each value or label is. Reusable across pages. */
export default function StatCard(props: {
  label: JSX.Element;
  valueColor?: string;
  /** Flag an at-risk state (e.g. weather actively damaging crops) — pulses a
   *  red border to draw the eye. */
  danger?: boolean;
  children: JSX.Element;
}) {
  return (
    <div class="stat-card" classList={{ "stat-card-danger": props.danger }}>
      <div class="stat-card-label">{props.label}</div>
      <div class="stat-card-value" style={props.valueColor ? { color: props.valueColor } : undefined}>
        {props.children}
      </div>
    </div>
  );
}
