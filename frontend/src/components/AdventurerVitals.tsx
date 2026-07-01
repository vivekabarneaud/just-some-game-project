import { For, Show } from "solid-js";
import type { Adventurer } from "@medieval-realm/shared/data/adventurers";
import { calcAdventurerMaxHp } from "@medieval-realm/shared/data/expeditionEngine";
import HpBar from "./HpBar";

const CONDITION_META: Record<string, { icon: string; label: string }> = {
  bleed: { icon: "🩸", label: "Bleeding" },
  poison: { icon: "☣️", label: "Poisoned" },
};

// Mirror of the passive-regen rate in gameState's recovery tick. Heroes heal
// this fraction of max HP per game-hour while resting at home (blocked by a
// lingering condition until it fades).
const REGEN_PCT_PER_HOUR = 0.12;

interface Props {
  adventurer: Adventurer;
  /** HP bar width. Default 60px (HpBar's default). */
  width?: string;
  /** Show "current/max" text next to the bar. */
  showText?: boolean;
  /** Append the passive HP regen rate ("+N/h") while resting, or a blocked note
   *  when a wound is stopping regen. For at-home views like the roster. */
  showRegen?: boolean;
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
  // Full-width mode: lay out as a real flex row so the bar can grow and the
  // condition icons sit inside the row instead of overflowing (assembly-slot fix).
  const full = () => props.width === "100%";
  return (
    <span style={{ display: full() ? "flex" : "inline-flex", "align-items": "center", gap: "6px", width: full() ? "100%" : undefined, "min-width": full() ? "0" : undefined }}>
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
      <Show when={props.showRegen && !props.adventurer.onMission && current() < maxHp()}>
        <Show
          when={!conditions().length}
          fallback={
            <span style={{ color: "#d4831a", "font-size": "0.7rem", "white-space": "nowrap" }}
              title="A lingering wound stops regen. It heals on its own after a while; a Bandage taken on a mission can clear it sooner.">
              won't heal yet
            </span>
          }
        >
          <span style={{ color: "var(--accent-green)", "font-size": "0.7rem", "white-space": "nowrap" }}
            title="Rests to heal at home. Bring a 🩹 Bandage on missions to heal on the trip.">
            +{Math.round(maxHp() * REGEN_PCT_PER_HOUR)}/h
          </span>
        </Show>
      </Show>
    </span>
  );
}
