import { JSX, Show, createSignal } from "solid-js";
import Tooltip from "./Tooltip";

/** Action config for a RecipeCard. Either craftable (with quantity controls) or locked (shows a badge). */
export type RecipeCardAction =
  | {
      type: "craft";
      maxQty: () => number;
      canCraft: (qty: number) => boolean;
      disabledReason: (qty: number) => string | null;
      onCraft: (qty: number) => void;
      /** Verb for the action button — e.g., "Craft", "Brew", "Cook!" */
      verb?: string;
    }
  | {
      type: "locked";
      /** Badge shown instead of craft controls (e.g., "Requires Cutting Board") */
      badge: JSX.Element;
    };

export interface RecipeCardProps {
  /** Fallback icon when no image */
  icon: string;
  /** Optional image URL */
  image?: string;
  title: string;
  /** Small text under title, e.g., "30s · +1x meal" or "45s · Tier 2" */
  subtitle: string;
  /** Optional info panel (stats, description, indicators) */
  info?: JSX.Element;
  /** Cost display (rendered below info panel) */
  costs: JSX.Element;
  /** Action — either craft controls or a locked badge */
  action: RecipeCardAction;
}

export default function RecipeCard(props: RecipeCardProps) {
  const isLocked = () => props.action.type === "locked";

  return (
    <div class="building-card" style={{ opacity: isLocked() ? 0.5 : 1 }}>
      <div class="building-card-header">
        {props.image
          ? <img src={props.image} alt="" style={{ width: "40px", height: "40px", "object-fit": "cover", "border-radius": "6px", "flex-shrink": "0" }} />
          : <div class="building-card-icon">{props.icon}</div>
        }
        <div>
          <div class="building-card-title">{props.title}</div>
          <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
            {props.subtitle}
          </div>
        </div>
      </div>

      {props.info}

      <div style={{ "margin-top": "6px", "font-size": "0.8rem", color: "var(--text-secondary)" }}>
        {props.costs}
      </div>

      <Show when={props.action.type === "craft"} fallback={
        <div style={{ "margin-top": "auto", "padding-top": "6px" }}>
          {(props.action as Extract<RecipeCardAction, { type: "locked" }>).badge}
        </div>
      }>
        {(() => {
          const action = props.action as Extract<RecipeCardAction, { type: "craft" }>;
          const [qty, setQty] = createSignal(1);
          const max = () => action.maxQty();
          const verb = () => action.verb ?? "Craft";
          return (
            <div style={{ "margin-top": "auto", "padding-top": "8px", display: "flex", "align-items": "center", gap: "6px" }}>
              <div style={{ display: "flex", "align-items": "center", gap: "2px", "border-radius": "4px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{ width: "24px", height: "28px", background: "var(--bg-primary)", border: "none", color: "var(--text-muted)", cursor: "pointer", "font-size": "0.85rem" }}
                >−</button>
                <span style={{ width: "28px", "text-align": "center", "font-size": "0.8rem", color: "var(--text-primary)" }}>{qty()}</span>
                <button
                  onClick={() => setQty((q) => Math.min(max(), q + 1))}
                  style={{ width: "24px", height: "28px", background: "var(--bg-primary)", border: "none", color: "var(--text-muted)", cursor: "pointer", "font-size": "0.85rem" }}
                >+</button>
              </div>
              <button
                onClick={() => setQty(max())}
                style={{
                  padding: "4px 8px",
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-muted)",
                  "border-radius": "4px",
                  cursor: "pointer",
                  "font-size": "0.7rem",
                  "white-space": "nowrap",
                }}
              >Max</button>
              <Tooltip text={action.disabledReason(qty())} position="bottom">
                <button
                  class="upgrade-btn"
                  disabled={!action.canCraft(qty())}
                  onClick={() => { action.onCraft(qty()); setQty(1); }}
                  style={{ "font-size": "0.85rem", padding: "6px 14px" }}
                >
                  {verb()}{qty() > 1 ? ` ×${qty()}` : ""}
                </button>
              </Tooltip>
            </div>
          );
        })()}
      </Show>
    </div>
  );
}
