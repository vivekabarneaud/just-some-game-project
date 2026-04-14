import { Show } from "solid-js";
import {
  getPortrait,
  getXpForLevel,
  RANK_NAMES,
  RANK_COLORS,
  CLASS_COLORS,
  type Adventurer,
} from "~/data/adventurers";

interface AdventurerPickerCardProps {
  adventurer: Adventurer;
  selected: boolean;
  onClick: () => void;
}

export default function AdventurerPickerCard(props: AdventurerPickerCardProps) {
  const adv = () => props.adventurer;
  const classColor = () => CLASS_COLORS[adv().class] ?? "var(--border-color)";
  const xpNeeded = () => getXpForLevel(adv().level);
  const xpPct = () => xpNeeded() > 0 ? Math.min(100, Math.round((adv().xp / xpNeeded()) * 100)) : 0;

  return (
    <div
      onClick={props.onClick}
      style={{
        display: "flex",
        gap: "8px",
        width: "200px",
        height: "64px",
        background: props.selected ? `${classColor()}18` : "rgba(255, 255, 255, 0.03)",
        border: `1px solid ${classColor()}`,
        "border-radius": "6px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.15s",
        opacity: props.selected ? "1" : "0.75",
        position: "relative",
      }}
    >
      <Show when={props.selected}>
        <div style={{
          position: "absolute", top: "3px", right: "3px", "z-index": 1,
          background: classColor(), color: "#fff",
          "font-size": "0.55rem", "font-weight": "bold",
          width: "16px", height: "16px", "border-radius": "50%",
          display: "flex", "align-items": "center", "justify-content": "center",
        }}>✓</div>
      </Show>
      <img
        src={getPortrait(adv().name, adv().class, adv().origin, adv().age ?? "middle", adv().portrait)}
        alt={adv().name}
        style={{ width: "64px", height: "64px", "object-fit": "cover", display: "block", "flex-shrink": "0" }}
      />
      <div style={{ padding: "6px 8px 6px 0", display: "flex", "flex-direction": "column", "justify-content": "center", flex: "1", "min-width": "0" }}>
        <div style={{ "font-size": "0.75rem", color: "var(--text-primary)", "font-weight": props.selected ? "bold" : "normal", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>
          {adv().name}
        </div>
        <div style={{ "font-size": "0.65rem", color: RANK_COLORS[adv().rank], "margin-top": "-1px" }}>
          {RANK_NAMES[adv().rank]} · Lv.{adv().level}
        </div>
        <div style={{ "margin-top": "auto", position: "relative" }}>
          <span style={{ "font-size": "0.45rem", color: "var(--text-muted)", position: "absolute", top: "-8px", left: "0" }}>EXP</span>
          <div style={{ height: "3px", background: "var(--bg-primary)", "border-radius": "2px" }}>
            <div style={{ height: "100%", width: `${xpPct()}%`, background: "var(--accent-blue)", "border-radius": "2px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
