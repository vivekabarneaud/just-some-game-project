import { Show, For } from "solid-js";
import Tooltip from "./Tooltip";
import HpBar from "./HpBar";
import {
  getZoomedPortraitUrl,
  getXpForLevel,
  RANK_NAMES,
  RANK_COLORS,
  CLASS_COLORS,
  type Adventurer,
} from "@medieval-realm/shared/data/adventurers";
import { calcAdventurerMaxHp } from "@medieval-realm/shared/data/expeditionEngine";

interface AdventurerPickerCardProps {
  adventurer: Adventurer;
  selected: boolean;
  onClick: () => void;
  /** When set, the card is shown greyed + non-selectable (e.g. away on a
   *  mission, laid up with the froth, too wounded to march). The reason is
   *  surfaced as a hover tooltip so a missing recruit is never a mystery. */
  disabled?: boolean;
  disabledReason?: string;
}

export default function AdventurerPickerCard(props: AdventurerPickerCardProps) {
  const adv = () => props.adventurer;
  const classColor = () => CLASS_COLORS[adv().class] ?? "var(--border-color)";
  const xpNeeded = () => getXpForLevel(adv().level);
  const xpPct = () => xpNeeded() > 0 ? Math.min(100, Math.round((adv().xp / xpNeeded()) * 100)) : 0;
  const maxHp = () => calcAdventurerMaxHp(adv());
  const hasConditions = () => (adv().conditions?.length ?? 0) > 0;

  return (
    <Tooltip text={props.disabled ? props.disabledReason : undefined} position="top">
    <div
      onClick={() => { if (!props.disabled) props.onClick(); }}
      style={{
        display: "flex",
        gap: "8px",
        width: "200px",
        height: "74px",
        background: props.selected ? `${classColor()}18` : "rgba(255, 255, 255, 0.03)",
        border: `1px solid ${props.disabled ? "var(--border-default)" : classColor()}`,
        "border-radius": "0",
        overflow: "hidden",
        cursor: props.disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        opacity: props.disabled ? "0.4" : props.selected ? "1" : "0.75",
        filter: props.disabled ? "grayscale(0.7)" : "none",
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
        src={getZoomedPortraitUrl(adv())}
        alt={adv().name}
        style={{ width: "74px", height: "74px", "object-fit": "cover", display: "block", "flex-shrink": "0" }}
      />
      <div style={{ padding: "6px 8px 6px 0", display: "flex", "flex-direction": "column", "justify-content": "center", flex: "1", "min-width": "0" }}>
        <div style={{ "font-size": "0.75rem", color: "var(--text-primary)", "font-weight": props.selected ? "bold" : "normal", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>
          {adv().name}
        </div>
        <div style={{ "font-size": "0.65rem", color: RANK_COLORS[adv().rank], "margin-top": "-1px", display: "flex", gap: "5px", "align-items": "center", "white-space": "nowrap" }}>
          <span>{RANK_NAMES[adv().rank]} · Lv.{adv().level}</span>
          <Show when={hasConditions()}>
            <For each={adv().conditions ?? []}>
              {(c) => <Tooltip text={c.type === "bleed" ? "Bleeding — won't heal until it fades" : c.type === "poison" ? "Poisoned — won't heal until it fades" : c.type === "venom" ? "Venomed — worsens until cured with a Herbal Antidote (a bandage won't touch it)" : "Frothing — worsens until cured with a Boar's-Bane Salve"}><span>{c.type === "bleed" ? "🩸" : c.type === "poison" ? "☣️" : c.type === "venom" ? "🐍" : "🤢"}</span></Tooltip>}
            </For>
          </Show>
        </div>
        <div style={{ "margin-top": "auto", display: "flex", "flex-direction": "column", gap: "3px" }}>
          <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
            <span style={{ "font-size": "0.45rem", color: "var(--text-muted)", width: "14px", "flex-shrink": "0" }}>HP</span>
            <div style={{ flex: "1", "min-width": "0" }}>
              <HpBar current={adv().currentHp ?? maxHp()} max={maxHp()} width="100%" height="4px" />
            </div>
          </div>
          <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
            <span style={{ "font-size": "0.45rem", color: "var(--text-muted)", width: "14px", "flex-shrink": "0" }}>EXP</span>
            {/* Mirror HpBar's track exactly (bg, border, radius, height) so HP and EXP read as one set. */}
            <span style={{ display: "flex", flex: "1", "min-width": "0", height: "4px", background: "rgba(0, 0, 0, 0.45)", "border-radius": "3px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <span style={{ display: "block", width: `${xpPct()}%`, height: "100%", background: "var(--accent-blue)" }} />
            </span>
          </div>
        </div>
      </div>
    </div>
    </Tooltip>
  );
}
