import { For, Show } from "solid-js";
import type { CombatantSnapshot } from "@medieval-realm/shared/data/combat";

/**
 * One combatant on the combat stage: the hand-drawn wing card (combatant_card.png)
 * with a circular portrait, level notch, name + class glyph, an HP bar in the
 * middle rail, and a row of status-effect squares (status_slot.png) along the
 * bottom. Enemies render the whole card mirrored (portrait on the outer edge,
 * banner streaming toward the center clash); text/portraits/HP are counter-flipped
 * so they read normally.
 *
 * Structure: an OUTER box holds the (constant) mirror for enemies; an INNER
 * "motion" layer holds the lunge/flee animation so the lunge keyframe can play
 * without clobbering the mirror. The frame art lives in the top ~40% of a 1024²
 * canvas, so we crop to its bounding box (ART) and place every live element as a
 * % of that box. ART + SLOTS are the ONLY numbers to tune against the art.
 */

// ── Frame art bounding box, in px within the 1024² canvas (TUNE to the art) ──
const CANVAS = 1024;
const ART = { l: 20, r: 1012, t: 30, b: 452 };
const ART_W = ART.r - ART.l;
const ART_H = ART.b - ART.t;

// ── Slot rectangles, as % of the cropped card box (TUNE against the art) ──
// Overridable via the `slots` prop so the dev preview can tune them live.
export const DEFAULT_SLOTS = {
  portrait: { cx: 21, cy: 51, d: 92.5 },   // d = % of card HEIGHT (circle)
  level:    { cx: 33.5, cy: 81.5, d: 20 }, // d = backdrop size, % of card HEIGHT
  glyph:    { cx: 43, cy: 20.5 },
  name:     { l: 51, t: 10.5, w: 41.5, h: 17 },
  hp:       { l: 40, t: 34.5, w: 53.5, h: 12.5, bevel: 4.5 }, // bevel = % of bar width slanted off the outer edge
  status:   { l: 41, slotW: 9.5, gap: 1.5, top: 59, h: 24, count: 3 },
};
export type CardSlots = typeof DEFAULT_SLOTS;

const CLASS_GLYPH: Record<string, string> = {
  warrior: "⚔️", archer: "🏹", assassin: "🗡️", wizard: "🔥", priest: "✨",
};

function hpColor(pct: number): string {
  return pct > 50 ? "var(--accent-green)" : pct > 20 ? "#d4831a" : "var(--accent-red)";
}

export interface CombatStatus {
  icon: string;
  label?: string;
}

export default function CombatantCard(props: {
  snapshot: CombatantSnapshot;
  hp: number;
  statuses?: CombatStatus[];
  /** Lunge toward the foe (who just attacked). Bump `actKey` to re-fire the jab
   *  when the same unit acts on consecutive steps. */
  acting?: boolean;
  actKey?: number;
  /** Vertical component of the lunge (px) — nudges the jab toward the target's
   *  row on the battlefield. Defaults to 0 (pure horizontal jab). */
  lungeY?: number;
  /** Seconds to delay the lunge — used so a CHARGE reads as "arrive, THEN gore"
   *  (the jab waits for the slide to finish) instead of striking mid-slide. 0 for
   *  a normal in-place attack. */
  actDelay?: number;
  /** Fled the field — slide off-side and fade. */
  fleeing?: boolean;
  /** Down (hp<=0) — dim and desaturate. */
  fallen?: boolean;
  /** Card display width in px. Height derives from the art aspect. */
  width?: number;
  /** Override slot positions (dev tuning). Defaults to DEFAULT_SLOTS. */
  slots?: CardSlots;
}) {
  const S = () => props.slots ?? DEFAULT_SLOTS;
  const mirror = () => props.snapshot.side === "enemy";
  const W = () => props.width ?? 250;
  const scale = () => W() / ART_W;
  const H = () => ART_H * scale();
  const pct = () => (props.snapshot.maxHp <= 0 ? 0 : Math.max(0, Math.min(100, (props.hp / props.snapshot.maxHp) * 100)));

  const frameStyle = () => ({
    position: "absolute" as const,
    width: `${(CANVAS / ART_W) * 100}%`,
    height: `${(CANVAS / ART_H) * 100}%`,
    left: `${(-ART.l / ART_W) * 100}%`,
    top: `${(-ART.t / ART_H) * 100}%`,
    "pointer-events": "none" as const,
  });

  const counterFlip = () => (mirror() ? "scaleX(-1)" : undefined);
  const zoomedPortrait = () => props.snapshot.portrait?.replace(".png", "_zoomed.png");

  const statusList = () => (props.statuses ?? []).slice(0, S().status.count);

  return (
    <div style={{
      position: "relative",
      width: `${W()}px`, height: `${H()}px`,
      transform: mirror() ? "scaleX(-1)" : undefined,
      "flex-shrink": 0,
    }}>
      {/* Rout flash — a brief "Routs!" over the card as it breaks off, so a morale
          break reads as a decision, not a card vanishing "for no reason". Sits
          outside the sliding motion layer so it stays put, and fades itself out. */}
      <Show when={props.fleeing}>
        <div style={{
          position: "absolute", inset: "0", "z-index": 6,
          display: "flex", "align-items": "center", "justify-content": "center",
          "pointer-events": "none", transform: counterFlip(),
          animation: "combat-rout-flash 1.6s ease-out forwards",
        }}>
          <span style={{
            background: "rgba(20,20,35,0.92)", color: "#e74c3c",
            "font-size": `${H() * 0.13}px`, "font-weight": 700,
            padding: "2px 8px", "border-radius": "4px",
            border: "1px solid rgba(231,76,60,0.6)", "white-space": "nowrap",
          }}>🏃 Routs!</span>
        </div>
      </Show>
      {/* Motion layer — lunge (one-shot keyframe) + flee (slide off) + fade. */}
      <div
        style={{
          position: "absolute", inset: "0",
          "--lunge-y": `${props.lungeY ?? 0}px`,
          transform: props.fleeing ? "translateX(-120%)" : undefined,
          transition: "transform 0.35s ease-in, opacity 0.35s ease",
          opacity: props.fleeing ? 0 : props.fallen ? 0.4 : 1,
          filter: props.fallen ? "grayscale(0.8)" : undefined,
          animation: props.acting && !props.fleeing ? `combat-lunge 0.32s ease-out ${props.actDelay ?? 0}s` : undefined,
        }}
        // Key on actKey so a repeat act on the same unit replays the jab.
        data-act={props.actKey ?? 0}
      >
        {/* Frame art — ABOVE everything, so the gold ring/filigree draws over the
            portrait edge and content sits inside the frame's windows. */}
        <div style={{ position: "absolute", inset: "0", overflow: "hidden", "z-index": 3, "pointer-events": "none" }}>
          <img src="/images/frames/combatant_card.png" alt="" style={frameStyle()} />
        </div>

        {/* Portrait / icon in the circle — at the very back, behind the frame ring. */}
        <div style={{
          position: "absolute", "z-index": 1,
          left: `${S().portrait.cx}%`, top: `${S().portrait.cy}%`,
          width: `${(S().portrait.d * ART_H) / ART_W}%`, height: `${S().portrait.d}%`,
          transform: "translate(-50%, -50%)",
          "border-radius": "50%", overflow: "hidden",
          display: "flex", "align-items": "center", "justify-content": "center",
          background: "rgba(0,0,0,0.25)",
        }}>
          <Show
            when={props.snapshot.portrait}
            fallback={<span style={{ "font-size": `${H() * 0.4}px`, transform: counterFlip() }}>{props.snapshot.icon || "❓"}</span>}
          >
            <img
              src={zoomedPortrait()}
              alt={props.snapshot.name}
              onError={(e) => { const el = e.currentTarget; if (el.src.includes("_zoomed")) el.src = props.snapshot.portrait!; }}
              style={{ width: "100%", height: "100%", "object-fit": "cover", transform: counterFlip() }}
            />
          </Show>
        </div>

        {/* Level notch — a dark backdrop fills the frame's little square so the
            number reads over black instead of the portrait behind it. */}
        <Show when={props.snapshot.level != null}>
          <div style={{
            position: "absolute", "z-index": 2,
            left: `${S().level.cx}%`, top: `${S().level.cy}%`,
            width: `${(S().level.d * ART_H) / ART_W}%`, height: `${S().level.d}%`,
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.72)", "border-radius": "2px",
            display: "flex", "align-items": "center", "justify-content": "center",
          }}>
            <span style={{
              "font-size": `${H() * 0.13}px`, color: "var(--accent-gold)", "font-weight": "bold",
              "font-family": "var(--font-heading)", "line-height": 1,
              transform: counterFlip(),
            }}>
              {props.snapshot.level}
            </span>
          </div>
        </Show>

        {/* Class glyph */}
        <div style={{
          position: "absolute", "z-index": 2,
          left: `${S().glyph.cx}%`, top: `${S().glyph.cy}%`,
          transform: `translate(-50%, -50%) ${mirror() ? "scaleX(-1)" : ""}`,
          "font-size": `${H() * 0.11}px`, "line-height": 1,
        }}>
          {props.snapshot.class ? (CLASS_GLYPH[props.snapshot.class] ?? props.snapshot.icon) : props.snapshot.icon}
        </div>

        {/* Name */}
        <div style={{
          position: "absolute", "z-index": 2,
          left: `${S().name.l}%`, top: `${S().name.t}%`,
          width: `${S().name.w}%`, height: `${S().name.h}%`,
          display: "flex", "align-items": "center",
          transform: counterFlip(), "transform-origin": "center",
        }}>
          <span style={{
            "font-family": "var(--font-heading)", color: "var(--text-primary)",
            "font-size": `${Math.max(9, H() * 0.11)}px`, "white-space": "nowrap",
            overflow: "hidden", "text-overflow": "ellipsis", width: "100%",
            "text-align": mirror() ? "right" : "left",
          }}>
            {props.snapshot.name}
          </span>
        </div>

        {/* HP bar in the middle rail — sits BEHIND the portrait (z below it) so the
            circle hides its straight inner edge, and is beveled on the outer edge.
            NOT counter-flipped: the card mirror carries the bevel (and fill anchor)
            to the enemy's outer side, matching the wing taper. */}
        <div style={{
          position: "absolute", "z-index": 0,
          left: `${S().hp.l}%`, top: `${S().hp.t}%`,
          width: `${S().hp.w}%`, height: `${S().hp.h}%`,
          background: "rgba(0,0,0,0.45)", overflow: "hidden",
          "clip-path": `polygon(0 0, 100% 0, ${100 - (S().hp.bevel ?? 0)}% 100%, 0 100%)`,
        }}>
          <div style={{
            width: `${pct()}%`, height: "100%",
            background: hpColor(pct()),
            transition: "width 0.4s ease, background 0.4s ease",
          }} />
        </div>

        {/* Status squares */}
        <For each={statusList()}>
          {(st, i) => (
            <div style={{
              position: "absolute", "z-index": 2,
              left: `${S().status.l + i() * (S().status.slotW + S().status.gap)}%`,
              top: `${S().status.top}%`,
              width: `${S().status.slotW}%`, height: `${S().status.h}%`,
              "background-image": "url(/images/frames/status_slot.png)",
              "background-size": "100% 100%",
              display: "flex", "align-items": "center", "justify-content": "center",
            }}>
              <span style={{ "font-size": `${H() * 0.11}px`, transform: counterFlip() }} title={st.label}>{st.icon}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
