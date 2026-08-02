import { Show, type JSX } from "solid-js";

/** A reusable item card: a hand-drawn rarity frame around a square icon box,
 *  a title + optional subtitle, and optional extra content below — content laid
 *  out top-left. Used by the alchemy recipe book + plant picker; meant to be the
 *  standard card look for items/recipes across the game. */

export const itemFrameUrl = (rarity?: string) => `/images/frames/item_frame_${rarity ?? "common"}.png`;
/** Grade sheen over the frame (brew quality): fine bright, rough dulled, dubious grey. */
export const gradeFilter = (q?: string) =>
  q === "dubious" ? "grayscale(0.7) brightness(0.82)" : q === "rough" ? "saturate(0.65)" : "none";

export default function FramedItemCard(props: {
  rarity?: string;
  /** Optional brew quality → grade sheen. */
  quality?: string;
  icon: JSX.Element;
  title: JSX.Element;
  subtitle?: JSX.Element;
  onClick?: () => void;
  /** Native tooltip. */
  hoverTitle?: string;
  /** Parchment variant — dark ink text + light icon backing. */
  dark?: boolean;
  minHeight?: string;
  iconSize?: number;
  /** Extra content below the header (description, effect lines…). */
  children?: JSX.Element;
}) {
  const size = () => props.iconSize ?? 52;
  return (
    <button onClick={props.onClick} title={props.hoverTitle}
      style={{
        "text-align": "left", padding: "6px", cursor: props.onClick ? "pointer" : "default",
        color: props.dark ? "#2a2012" : "var(--text-primary)", "min-height": props.minHeight,
        background: props.dark ? "rgba(255,255,255,0.14)" : "var(--bg-card)",
        border: "12px solid transparent", "border-image": `url(${itemFrameUrl(props.rarity)}) 34 stretch`,
        filter: gradeFilter(props.quality),
        display: "flex", "flex-direction": "column", "align-items": "flex-start", "justify-content": "flex-start", gap: "4px",
      }}>
      <div style={{ display: "flex", gap: "8px", "align-items": "flex-start", width: "100%" }}>
        <div style={{
          width: `${size()}px`, height: `${size()}px`, "flex-shrink": 0,
          background: props.dark ? "rgba(42,32,18,0.12)" : "rgba(0,0,0,0.25)",
          display: "flex", "align-items": "center", "justify-content": "center", "font-size": `${size() * 0.035}rem`,
        }}>{props.icon}</div>
        <div style={{ flex: 1, "min-width": "0" }}>
          <div style={{ "font-size": "0.84rem", "font-weight": 700, "line-height": 1.15 }}>{props.title}</div>
          <Show when={props.subtitle}>
            <div style={{ "font-size": "0.66rem", opacity: 0.78, "margin-top": "2px" }}>{props.subtitle}</div>
          </Show>
        </div>
      </div>
      {props.children}
    </button>
  );
}
