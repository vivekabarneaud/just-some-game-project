import { Show } from "solid-js";
import Tooltip from "~/components/Tooltip";

/**
 * Small 22×22 "+"/"↑" indicator with a hover tooltip. Anchored by the parent
 * (e.g. into a `.building-card-image-overlay` or a card corner). Matches the
 * pattern used by Buildings.tsx so farming cards feel the same as settlement
 * cards.
 *
 * The tooltip is rendered through the shared portaled Tooltip so it can't be
 * clipped by a card's `overflow: hidden` (which used to crop long blocked
 * reasons on the farming page).
 *
 * `level === 0` shows "+" (Build). Otherwise shows "↑" (Upgrade).
 */
export function UpgradeIndicator(props: {
  level: number;
  canAct: boolean;
  actionLabel?: string;       // e.g. "Build", "Upgrade to Lv.3" — defaults based on level
  costTip: string;            // e.g. "🪵 30 🪨 15 🪙 45"
  blockedReason?: string;     // shown when !canAct
  onClick: () => void;
  /** Place inside a banner overlay (bottom-right) vs. a plain card corner (top-right) */
  inOverlay?: boolean;
}) {
  const label = () => props.actionLabel ?? (props.level === 0 ? "Build" : `Upgrade to Lv.${props.level + 1}`);
  return (
    <div
      class="upgrade-indicator"
      style={{
        position: props.inOverlay ? "relative" : "absolute",
        ...(props.inOverlay ? {} : { top: "8px", right: "8px" }),
        "z-index": "5",
      }}
      onClick={(e) => {
        if (props.canAct) {
          e.preventDefault();
          e.stopPropagation();
          props.onClick();
        }
      }}
    >
      <Tooltip
        position={props.inOverlay ? "top" : "bottom"}
        content={() => (
          <>
            <Show when={props.canAct}>
              <div style={{ color: "var(--accent-green)", "font-weight": "bold", "margin-bottom": "2px" }}>
                {label()}
              </div>
              <div>{props.costTip}</div>
              <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-top": "2px" }}>Click to confirm</div>
            </Show>
            <Show when={!props.canAct}>
              <div style={{ color: "var(--accent-gold)" }}>{props.blockedReason || "Not available"}</div>
              <Show when={props.costTip}>
                <div style={{ "margin-top": "2px" }}>{props.costTip}</div>
              </Show>
            </Show>
          </>
        )}
      >
        <div style={{
          width: "22px",
          height: "22px",
          "border-radius": "4px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "font-size": "0.75rem",
          background: props.canAct
            ? (props.inOverlay ? "rgba(46, 204, 113, 0.3)" : "rgba(46, 204, 113, 0.2)")
            : (props.inOverlay ? "rgba(106, 100, 88, 0.3)" : "rgba(106, 100, 88, 0.15)"),
          border: `1px solid ${props.canAct ? "var(--accent-green)" : "var(--text-muted)"}`,
          color: props.canAct ? "var(--accent-green)" : "var(--text-muted)",
          cursor: props.canAct ? "pointer" : "default",
        }}>
          {props.level === 0 ? "+" : "↑"}
        </div>
      </Tooltip>
    </div>
  );
}
