import { For, Show } from "solid-js";

interface MenuDishCardProps {
  name: string;
  icon: string;
  image?: string;
  costs: { resource: string; amount: number }[];
  /** In the staged selection (will be on the menu). */
  selected: boolean;
  /** Recipe not yet unlocked (kitchen too low / recipe undiscovered). */
  locked?: boolean;
  /** Ingredients in stock right now (cook-ready). */
  available?: boolean;
  onClick?: () => void;
}

const prettyRes = (r: string) =>
  r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** A selectable dish card for the tavern menu editor — square image on the
 *  left, name + ingredients on the right, an outline when selected. Mirrors the
 *  mission-assembly card language (square art, gold/tinted selected state). */
export default function MenuDishCard(props: MenuDishCardProps) {
  // Parchment-toned (UX refont): dish cards sit on the aged-paper menu, so they
  // read as ink-on-cream, not dark cards.
  const border = () =>
    props.locked ? "rgba(120, 100, 70, 0.3)"
    : props.selected ? "#4a7c3a"
    : "rgba(120, 100, 70, 0.5)";
  const bg = () =>
    props.selected ? "rgba(74, 124, 58, 0.16)" : "rgba(255, 250, 235, 0.35)";
  return (
    <div
      onClick={() => !props.locked && props.onClick?.()}
      style={{
        display: "flex", "align-items": "center", gap: "10px",
        width: "230px", padding: "8px", "border-radius": "10px",
        border: `2px solid ${border()}`, background: bg(),
        cursor: props.locked ? "default" : "pointer",
        opacity: props.locked ? "0.55" : "1",
        transition: "border-color 120ms ease, background 120ms ease",
      }}
    >
      {/* Square art */}
      <div style={{
        width: "48px", height: "48px", "flex-shrink": "0", "border-radius": "8px",
        overflow: "hidden", background: "rgba(90, 74, 48, 0.18)",
        display: "flex", "align-items": "center", "justify-content": "center", "font-size": "1.7rem",
      }}>
        <Show when={props.image} fallback={<span>{props.icon}</span>}>
          <img src={props.image} alt="" style={{ width: "100%", height: "100%", "object-fit": "cover" }} />
        </Show>
      </div>
      {/* Name + ingredients */}
      <div style={{ flex: "1", "min-width": "0" }}>
        <div style={{ color: "#241a0e", "font-size": "0.88rem", "font-weight": "600", display: "flex", "align-items": "center", gap: "5px" }}>
          <Show when={props.locked}><span style={{ "font-size": "0.75rem" }}>🔒</span></Show>
          <span style={{ overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>{props.name}</span>
        </div>
        <div style={{
          "font-size": "0.68rem", "line-height": "1.3", "margin-top": "2px",
          color: props.locked ? "#8a7550"
            : props.available === false ? "#a33"
            : "#6b5636",
        }}>
          <Show when={props.costs.length > 0} fallback="no ingredients">
            <For each={props.costs}>
              {(c, i) => <span>{i() > 0 ? " · " : ""}{c.amount}× {prettyRes(c.resource)}</span>}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
}
