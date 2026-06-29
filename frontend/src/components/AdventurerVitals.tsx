import { For } from "solid-js";
import type { Adventurer } from "@medieval-realm/shared/data/adventurers";
import { calcAdventurerMaxHp } from "@medieval-realm/shared/data/expeditionEngine";
import HpBar from "./HpBar";

const CONDITION_META: Record<string, { icon: string; label: string }> = {
  bleed: { icon: "🩸", label: "Bleeding" },
  poison: { icon: "☣️", label: "Poisoned" },
};

interface Props {
  adventurer: Adventurer;
  /** HP bar width. Default 60px (HpBar's default). */
  width?: string;
  /** Show "current/max" text next to the bar. */
  showText?: boolean;
}

/**
 * Compact vitals strip: HP bar + lingering-condition chips. Reused on roster
 * cards, the team-assembly slots, the picker, and the detail page so a hero's
 * health reads the same everywhere. A lingering wound blocks passive regen
 * until it fades, so it's worth surfacing wherever the player picks a team.
 */
export default function AdventurerVitals(props: Props) {
  const maxHp = () => calcAdventurerMaxHp(props.adventurer);
  const current = () => Math.round(props.adventurer.currentHp ?? maxHp());
  const conditions = () => props.adventurer.conditions ?? [];
  return (
    <span style={{ display: "inline-flex", "align-items": "center", gap: "6px" }}>
      <HpBar current={current()} max={maxHp()} width={props.width} showText={props.showText} />
      <For each={conditions()}>
        {(c) => {
          const meta = CONDITION_META[c.type] ?? { icon: "❓", label: c.type };
          return (
            <span
              title={`${meta.label} — won't heal until the wound fades`}
              style={{ "font-size": "0.85rem", "line-height": 1, cursor: "help" }}
            >
              {meta.icon}
            </span>
          );
        }}
      </For>
    </span>
  );
}
