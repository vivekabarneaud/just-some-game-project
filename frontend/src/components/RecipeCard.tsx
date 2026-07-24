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
      /** Skip the global confirm SFX on click — set when onCraft already
       *  plays its own themed sound (kitchen, bubbles, plop), to avoid
       *  doubling up. */
      silentClick?: boolean;
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
  /** Recipe is "newly available" — gets the blue highlight until the player
   *  hovers it. Caller drives the unseen state via state.recipesSeen. */
  isUnseen?: boolean;
  /** Called on `mouseenter` — caller marks the recipe as seen. */
  onSeen?: () => void;
  /** Optional control rendered in the action row, next to the craft button
   *  (e.g. the kitchen's "keep cooking" toggle). Wraps below on narrow cards. */
  extraAction?: JSX.Element;
  /** Optional ornamental frame (URL) drawn around the item icon — a throwaway
   *  preview of the hand-drawn rarity frames. Remove when the real item/rarity
   *  rework lands. */
  frameUrl?: string;
}

export default function RecipeCard(props: RecipeCardProps) {
  const isLocked = () => props.action.type === "locked";
  const highlight = () => !!props.isUnseen;

  return (
    <div
      class="building-card"
      onMouseEnter={() => props.onSeen?.()}
      style={{
        // Dim locked recipes with a filter, not opacity — opacity would make the
        // whole card see-through and let the weather backdrop show through it.
        // Shared --locked-dim value so all locked cards match (tuned in global.css).
        filter: isLocked() ? "var(--locked-dim)" : "none",
        position: "relative",
        ...(highlight() ? {
          "box-shadow": "0 0 0 1px var(--accent-blue), 0 0 12px rgba(91, 155, 213, 0.35)",
          background: "linear-gradient(180deg, rgba(91, 155, 213, 0.08), transparent 70%), var(--bg-secondary)",
        } : {}),
        // Rarity frame drawn around the whole CARD (the item icon stays
        // frameless). Falls back to the uncommon ornament when no rarity URL is
        // given. Same 9-slice (55) / 20px border as the other card frames.
        border: "var(--ornament-w) solid transparent",
        "border-image": `${props.frameUrl ? `url(${props.frameUrl})` : "var(--ornament-src)"} var(--ornament-slice) stretch`,
      }}
    >
      <Show when={highlight()}>
        <div class="notification-badge is-tag" style={{ position: "absolute", top: "6px", right: "6px" }}>NEW</div>
      </Show>
      <div class="building-card-header">
        {/* Frameless icon — the rarity frame lives on the card now, so the image
            fills its box instead of being shrunk inside an icon-sized frame. */}
        {props.image
          ? <img src={props.image} alt="" style={{ width: "40px", height: "40px", "object-fit": "cover", "border-radius": "6px", "flex-shrink": "0" }} />
          : <div class="building-card-icon">{props.icon}</div>}
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
          // True craftable count: maxQty() floors to 1, so fall back to 0 when the
          // player can't even afford one. Drives the Max button's label + disabled
          // state (and reuses the craft button's own reason for the tooltip).
          const realMax = () => (action.canCraft(1) ? max() : 0);
          const verb = () => action.verb ?? "Craft";
          return (
            <div class="recipe-card-actions" style={{ "margin-top": "auto", "padding-top": "8px", display: "flex", "align-items": "center", gap: "6px", "flex-wrap": "wrap" }}>
              {/* Framed ± on a dark grouped pill, with an editable qty input. */}
              <div style={{ display: "flex", "align-items": "center", gap: "2px", background: "var(--bg-primary)", padding: "3px 5px", "border-radius": "3px" }}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{ width: "30px", height: "30px", background: "transparent", border: "3px solid transparent", "border-image": "url(/images/frames/item_frame_common.png) 40 stretch", "border-radius": "0", color: "var(--text-muted)", cursor: "pointer", "font-size": "0.85rem" }}
                >−</button>
                <input
                  class="qty-input"
                  type="number"
                  min="1"
                  value={qty()}
                  onInput={(e) => {
                    const v = parseInt(e.currentTarget.value, 10);
                    setQty(Number.isNaN(v) ? 1 : Math.max(1, Math.min(max(), v)));
                  }}
                  style={{ width: "34px", "text-align": "center", background: "transparent", border: "none", color: "var(--text-primary)", "font-size": "0.85rem", "font-family": "inherit" }}
                />
                <button
                  onClick={() => setQty((q) => Math.min(max(), q + 1))}
                  style={{ width: "30px", height: "30px", background: "transparent", border: "3px solid transparent", "border-image": "url(/images/frames/item_frame_common.png) 40 stretch", "border-radius": "0", color: "var(--text-muted)", cursor: "pointer", "font-size": "0.85rem" }}
                >+</button>
              </div>
              <Tooltip text={action.disabledReason(1)} position="bottom">
                <button
                  class="btn-tertiary"
                  disabled={realMax() === 0}
                  onClick={() => setQty(max())}
                  style={{ padding: "4px 14px", "font-size": "0.72rem", "white-space": "nowrap" }}
                >Max ({realMax()})</button>
              </Tooltip>
              <Tooltip text={action.disabledReason(qty())} position="bottom">
                <button
                  class="upgrade-btn"
                  disabled={!action.canCraft(qty())}
                  onClick={() => { action.onCraft(qty()); setQty(1); }}
                  style={{ "font-size": "0.85rem", padding: "6px 14px" }}
                  {...(action.silentClick ? { "data-no-click-sound": "" } : {})}
                >
                  {verb()}{qty() > 1 ? ` ×${qty()}` : ""}
                </button>
              </Tooltip>
              {props.extraAction}
            </div>
          );
        })()}
      </Show>
    </div>
  );
}
