import { Show } from "solid-js";
import {
  getClassMeta,
  getZoomedPortraitUrl,
  CLASS_COLORS,
  getFoodPref,
  type Adventurer,
  type AdventurerClass,
} from "@medieval-realm/shared/data/adventurers";
import type { MissionSlot } from "@medieval-realm/shared/data/missions";

interface TeamSlotProps {
  slot: MissionSlot;
  adventurer: Adventurer | undefined;
  onClick: () => void;
}

export default function TeamSlot(props: TeamSlotProps) {
  const assigned = () => props.adventurer;
  const requiredClass = () =>
    props.slot.required && props.slot.class !== "any"
      ? getClassMeta(props.slot.class as AdventurerClass)
      : null;

  const borderColor = () => {
    if (assigned()) return CLASS_COLORS[assigned()!.class] ?? "var(--border-color)";
    if (requiredClass()) return CLASS_COLORS[props.slot.class as keyof typeof CLASS_COLORS] ?? "var(--border-color)";
    return "var(--border-color)";
  };

  return (
    <div
      onClick={() => { if (assigned()) props.onClick(); }}
      style={{
        width: "80px", height: "110px",
        background: "rgba(255, 255, 255, 0.03)",
        border: assigned() ? `1px solid ${borderColor()}` : `1px dashed ${borderColor()}`,
        "border-radius": "6px",
        overflow: "hidden",
        cursor: assigned() ? "pointer" : "default",
        display: "flex",
        "flex-direction": "column",
        position: "relative",
      }}
    >
      <Show when={assigned()} fallback={
        <div style={{
          width: "80px", height: "80px",
          display: "flex", "flex-direction": "column", "align-items": "center", "justify-content": "center",
          "font-size": requiredClass() ? "1.5rem" : "2rem", color: "var(--text-muted)", opacity: "0.3",
        }}>
          {requiredClass() ? requiredClass()!.icon : "👤"}
        </div>
      }>
        <div style={{ position: "relative", width: "80px", height: "80px", "flex-shrink": "0" }}>
          <img
            src={getZoomedPortraitUrl(assigned()!)}
            alt={assigned()!.name}
            style={{ width: "80px", height: "80px", "object-fit": "cover", display: "block" }}
          />
          <Show when={getFoodPref(assigned()!.foodPreference)}>
            <div
              title={getFoodPref(assigned()!.foodPreference)!.trait}
              style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                width: "18px",
                height: "18px",
                "border-radius": "50%",
                background: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                "font-size": "0.65rem",
                "line-height": "1",
              }}
            >
              {getFoodPref(assigned()!.foodPreference)!.icon}
            </div>
          </Show>
        </div>
      </Show>
      <div style={{
        padding: "2px 4px",
        "text-align": "center",
        "font-size": "0.6rem",
        color: assigned() ? CLASS_COLORS[assigned()!.class] ?? "var(--text-secondary)" : requiredClass() ? borderColor() : "var(--text-muted)",
        "line-height": "1.15",
        flex: "1",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
      }}>
        {assigned() ? assigned()!.name.split(" ")[0] : requiredClass() ? requiredClass()!.name : "Any"}
      </div>
    </div>
  );
}
