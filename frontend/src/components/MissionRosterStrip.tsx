import { createSignal, onMount, For, Show } from "solid-js";
import { getXpForLevel, CLASS_COLORS } from "@medieval-realm/shared/data/adventurers";
import type { MissionRosterEntry } from "@medieval-realm/shared/data/missions";
import HpBar from "./HpBar";

interface Props {
  roster: MissionRosterEntry[];
}

/** The team strip shown under the loot chest: one card per deployed hero with
 *  their portrait, an HP bar that drains to what came home, and an XP bar that
 *  fills toward the gain. Reuses the assembly-panel framing (portrait + bars)
 *  and the shared HpBar. Animation is driven by flipping `animate` after mount,
 *  which lets the bars' width transitions play from before -> after. */
export default function MissionRosterStrip(props: Props) {
  const [animate, setAnimate] = createSignal(false);
  onMount(() => setTimeout(() => setAnimate(true), 90));

  return (
    <div style={{ display: "flex", "flex-wrap": "wrap", gap: "8px", "justify-content": "flex-start" }}>
      <For each={props.roster}>
        {(e) => {
          const color = CLASS_COLORS[e.advClass] ?? "var(--border-color)";
          const xpMax = Math.max(1, getXpForLevel(e.level));
          const hpNow = () => (animate() ? e.hpAfter : e.hpBefore);
          // On a level-up the before-xp belongs to the old level's scale, so we
          // start the bar empty in the new level and fill to the new remainder.
          const xpStart = e.leveledUp ? 0 : e.xpBefore;
          const xpPct = () => Math.min(100, Math.round(((animate() ? e.xpAfter : xpStart) / xpMax) * 100));

          return (
            <div
              style={{
                display: "flex",
                gap: "8px",
                width: "218px",
                height: "62px",
                background: e.died ? "rgba(231, 76, 60, 0.06)" : "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${e.died ? "var(--accent-red)" : color}`,
                overflow: "hidden",
                position: "relative",
                opacity: e.died ? "0.75" : "1",
              }}
            >
              <div style={{ position: "relative", width: "62px", height: "62px", "flex-shrink": "0" }}>
                <img
                  src={e.portrait}
                  alt={e.name}
                  style={{ width: "62px", height: "62px", "object-fit": "cover", display: "block", filter: e.died ? "grayscale(1)" : "none" }}
                />
                <Show when={e.died}>
                  <div style={{ position: "absolute", inset: "0", display: "flex", "align-items": "center", "justify-content": "center", "font-size": "1.6rem" }}>🪦</div>
                </Show>
              </div>

              <div style={{ padding: "6px 8px 6px 0", display: "flex", "flex-direction": "column", "justify-content": "center", flex: "1", "min-width": "0", gap: "3px" }}>
                <div style={{ display: "flex", "align-items": "center", gap: "5px", "min-width": "0" }}>
                  <span style={{ "font-size": "0.75rem", color: "var(--text-primary)", "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" }}>{e.name}</span>
                  <span style={{ "font-size": "0.6rem", color: "var(--text-muted)", "flex-shrink": "0" }}>Lv.{e.level}</span>
                  <Show when={e.leveledUp}>
                    <span style={{ "font-size": "0.55rem", "font-weight": "700", color: "#1a1208", background: "var(--accent-gold)", padding: "1px 5px", "border-radius": "3px", "flex-shrink": "0" }}>LEVEL UP</span>
                  </Show>
                  <Show when={e.revived}>
                    <span title="Revived by a priest" style={{ "font-size": "0.7rem", "flex-shrink": "0" }}>✨</span>
                  </Show>
                </div>

                <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
                  <span style={{ "font-size": "0.5rem", color: "var(--text-muted)", width: "16px", "flex-shrink": "0" }}>HP</span>
                  <div style={{ flex: "1", "min-width": "0" }}>
                    <HpBar current={hpNow()} max={e.hpMax} width="100%" height="5px" />
                  </div>
                </div>

                <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
                  <span style={{ "font-size": "0.5rem", color: "var(--text-muted)", width: "16px", "flex-shrink": "0" }}>XP</span>
                  <span style={{ display: "flex", flex: "1", "min-width": "0", height: "5px", background: "rgba(0, 0, 0, 0.45)", "border-radius": "3px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span style={{ display: "block", width: `${xpPct()}%`, height: "100%", background: "var(--accent-blue)", transition: "width 0.9s ease-out" }} />
                  </span>
                </div>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
