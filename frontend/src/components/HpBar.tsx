interface HpBarProps {
  current: number;
  max: number;
  /** Bar width. Default 60px */
  width?: string;
  /** Bar height. Default 8px */
  height?: string;
  /** Show "current/max" text alongside the bar. Default false. */
  showText?: boolean;
}

/**
 * Small reusable HP bar with threshold-based color:
 *   > 50% green, 20–50% orange, < 20% red.
 *
 * Inline by default — drop into combat log lines, character cards, etc.
 */
export default function HpBar(props: HpBarProps) {
  const pct = () => {
    if (props.max <= 0) return 0;
    return Math.max(0, Math.min(100, (props.current / props.max) * 100));
  };
  const color = () =>
    pct() > 50 ? "var(--accent-green)"
    : pct() > 20 ? "#d4831a"
    : "var(--accent-red)";

  return (
    <span style={{ display: "inline-flex", "align-items": "center", gap: "5px" }}>
      <span style={{
        display: "inline-block",
        width: props.width ?? "60px",
        height: props.height ?? "8px",
        background: "rgba(0, 0, 0, 0.45)",
        "border-radius": "3px",
        overflow: "hidden",
        "vertical-align": "middle",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}>
        <span style={{
          display: "block",
          width: `${pct()}%`,
          height: "100%",
          background: color(),
          transition: "width 0.25s, background 0.2s",
        }} />
      </span>
      {props.showText && (
        <span style={{ color: "var(--text-muted)", "font-size": "0.7rem" }}>
          {Math.max(0, Math.floor(props.current))}/{Math.floor(props.max)}
        </span>
      )}
    </span>
  );
}
