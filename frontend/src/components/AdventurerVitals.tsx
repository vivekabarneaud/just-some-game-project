import { For, Show } from "solid-js";
import type { Adventurer } from "@medieval-realm/shared/data/adventurers";
import { calcAdventurerMaxHp } from "@medieval-realm/shared/data/expeditionEngine";
import HpBar from "./HpBar";
import Tooltip from "./Tooltip";

export const CONDITION_META: Record<string, { icon: string; label: string }> = {
  bleed: { icon: "🩸", label: "Bleeding" },
  poison: { icon: "☣️", label: "Poisoned" },
  froth: { icon: "🤢", label: "Frothing — worsens, can't deploy (cure: Boar's-Bane Salve)" },
  venom: { icon: "🐍", label: "Venomed — worsens, can't deploy (cure: Herbal Antidote)" },
};

// Conditions that DON'T fade on their own — they worsen (drain HP) until the
// right cure is applied; a bandage does nothing for them. Each gets a distinct
// red "cure-only" chip instead of the generic fading-wound countdown.
const WORSENING: Record<string, { chip: string; tip: string }> = {
  froth: {
    chip: "froth",
    tip: "The froth — a rabid-boar bite-sickness. It worsens (drains HP) until treated with a 🐗 Boar's-Bane Salve, and the hero can't be deployed until then.",
  },
  venom: {
    chip: "venomed",
    tip: "The slow venom — an adder-bite from the fen that won't close. It worsens (drains HP, blocks regen) until drawn out with a 🧪 Herbal Antidote. A bandage won't touch it, and the hero can't be deployed until it's cured.",
  },
};

// Mirrors of the recovery-tick constants in gameState. Heroes heal this fraction
// of max HP per game-hour while resting at home; a condition blocks regen and
// decays over ~this many game-hours per remaining round.
const REGEN_PCT_PER_HOUR = 0.12;
const HOURS_PER_CONDITION_ROUND = 1.5;

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
      {/* At full HP in the at-home (showRegen) view, a lingering condition only
          blocks regen you don't need — hide it so the card reads "healthy". It
          still shows everywhere else (assembly/combat) and whenever wounded. */}
      <Show when={!props.showRegen || current() < maxHp() || conditions().some((c) => c.type === "froth")}>
        <For each={conditions()}>
          {(c) => {
            const meta = CONDITION_META[c.type] ?? { icon: "❓", label: c.type };
            // Worsening cure-only wounds (froth, the fen's venom) never fade —
            // distinct red chip with the real cure, not the "fades / bandage" path.
            const worse = WORSENING[c.type];
            if (worse) {
              return (
                <Tooltip text={worse.tip}>
                  <span style={{ "font-size": "0.72rem", "line-height": 1, color: "var(--accent-red)", "white-space": "nowrap", cursor: "help" }}>
                    {meta.icon} {worse.chip}
                  </span>
                </Tooltip>
              );
            }
            const hrsLeft = () => Math.max(1, Math.round(c.remainingRounds * HOURS_PER_CONDITION_ROUND));
            return (
              <Tooltip text={`${meta.label} — fades on its own in about ${hrsLeft()}h (or use a Bandage). Blocks HP regen until it does.`}>
                <span style={{ "font-size": "0.72rem", "line-height": 1, color: "#d4831a", "white-space": "nowrap", cursor: "help" }}>
                  {meta.icon} ~{hrsLeft()}h
                </span>
              </Tooltip>
            );
          }}
        </For>
      </Show>
      <Show when={props.showRegen && !props.adventurer.onMission && !conditions().length && current() < maxHp()}>
        <Tooltip text="Rests to heal at home. Bring a 🩹 Bandage on missions — or use one here — to heal faster.">
          <span style={{ color: "var(--accent-green)", "font-size": "0.7rem", "white-space": "nowrap", cursor: "help" }}>
            +{Math.round(maxHp() * REGEN_PCT_PER_HOUR)}/h
          </span>
        </Tooltip>
      </Show>
    </span>
  );
}
