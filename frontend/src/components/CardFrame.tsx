import { Show } from "solid-js";
import { FrameOrnaments } from "./FrameOrnaments";
import { RARITY_SLICE, RARITY_ORNAMENT } from "~/data/constants";

/**
 * The shared rarity frame + edge flourishes, drawn as an overlay over ANY
 * framed rectangle at any size. Drop it inside a `position: relative` element.
 *
 * It draws the gold border-image frame (slice matched per-rarity so the ornate
 * corners don't get sliced through) and, for rare and up, the mid-edge
 * flourishes (with their horizontal `_h` twin). Scale it to the card by passing
 * a smaller `border` / `ornamentSize` — the same art reads fine shrunk down.
 *
 * Consolidated from the roster/kennel card frames and the mission panel/loot
 * modal so every framed card speaks one visual language.
 */
export function CardFrame(props: {
  /** Frame ART rarity: "common" | "uncommon" | "rare" | "epic" | "legendary".
   *  Ignored when `frameSrc` is given (a custom frame, e.g. a boss frame). */
  rarity?: string;
  /** Flourish rarity, if it should differ from the frame art. Lets a container
   *  keep a consistent (e.g. uncommon) frame while its flourishes signal rank. */
  ornamentRarity?: string;
  /** Custom frame art URL (overrides `rarity`) — for boss/bespoke frames. */
  frameSrc?: string;
  /** border-image slice for a custom `frameSrc` (px in that art). */
  slice?: number;
  /** Custom vertical ornament URL (overrides the rarity ornament); its `_h`
   *  twin is derived automatically. */
  ornamentSrc?: string;
  /** border-image width in px — scale to the card (roster ~24, small cards ~13). */
  border?: number;
  /** Alternative to `border`: derive the border from the slice (border = slice ×
   *  scale). Because CSS border-image scales each corner into the border-width,
   *  a border proportional to the slice renders every rarity at the SAME visual
   *  scale (ornate frames just get a proportionally thicker ring). */
  scale?: number;
  ornamentSize?: number;
  ornamentInset?: number;
  /** Stacking order over the card content (default 5). */
  z?: number;
  /** Soft gradient fade along the bottom edge — so content dissolves into the
   *  lower frame rule instead of ending abruptly in the exposed strip below it.
   *  Opt-in (modals want it; small cards don't). */
  bottomFade?: boolean;
}) {
  const frameUrl = () => props.frameSrc ?? `/images/frames/item_frame_${props.rarity ?? "common"}.png`;
  const slice = () => props.slice ?? RARITY_SLICE[props.rarity ?? ""] ?? 34;
  const border = () => props.border ?? (props.scale != null ? Math.round(slice() * props.scale) : 20);
  const inset = () => props.ornamentInset ?? Math.round(border() * 0.16); // default: near the rule, not the inner edge
  const ornament = () => props.ornamentSrc ?? RARITY_ORNAMENT[props.ornamentRarity ?? props.rarity ?? ""];
  return (
    <>
      <div aria-hidden="true" style={{
        position: "absolute", inset: "0", "pointer-events": "none",
        "z-index": `${props.z ?? 5}`,
        border: `${border()}px solid transparent`,
        "border-image": `url(${frameUrl()}) ${slice()} stretch`,
      }} />
      <Show when={props.bottomFade}>
        <div aria-hidden="true" style={{
          position: "absolute", left: "0", right: "0", bottom: "0",
          height: `${Math.round(border() * 2.4)}px`,
          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.42))",
          "pointer-events": "none",
          "z-index": `${(props.z ?? 5) - 1}`,
        }} />
      </Show>
      <Show when={ornament()}>
        <FrameOrnaments
          vUrl={ornament()!}
          hUrl={ornament()!.replace(".png", "_h.png")}
          size={props.ornamentSize ?? 44}
          inset={inset()}
        />
      </Show>
    </>
  );
}
