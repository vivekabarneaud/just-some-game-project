import type { JSX } from "solid-js";

/** Mid-edge frame flourishes, reusable on ANY framed rectangle (narrow, wide,
 *  square). Drop it inside a `position: relative` element and it places one
 *  flourish centered on each edge, inset to sit on the frame's rule line.
 *
 *  Two images are needed because CSS-rotating a flourish then centering it is
 *  fiddly: pass the vertical art (`vUrl`, used on the left/right edges, flipped
 *  for the right) and its pre-rotated horizontal twin (`hUrl`, used on top/
 *  bottom, flipped for the bottom). `size` is the flourish length along the
 *  edge; `inset` is its distance from the card edge (match the frame's rule). */
export function FrameOrnaments(props: {
  vUrl: string;
  hUrl: string;
  size?: number;
  inset?: number;
  opacity?: number;
}) {
  const size = () => props.size ?? 56;
  const inset = () => props.inset ?? 8;
  const base = (): JSX.CSSProperties => ({
    position: "absolute",
    "pointer-events": "none",
    "z-index": "4",
    opacity: `${props.opacity ?? 0.95}`,
  });
  return (
    <>
      {/* left / right — vertical art, centered on the edge */}
      <img aria-hidden="true" src={props.vUrl} style={{ ...base(), height: `${size()}px`, width: "auto", left: `${inset()}px`, top: "50%", transform: "translateY(-50%)" }} />
      <img aria-hidden="true" src={props.vUrl} style={{ ...base(), height: `${size()}px`, width: "auto", right: `${inset()}px`, top: "50%", transform: "translateY(-50%) scaleX(-1)" }} />
      {/* top / bottom — pre-rotated horizontal art, centered on the edge */}
      <img aria-hidden="true" src={props.hUrl} style={{ ...base(), width: `${size()}px`, height: "auto", top: `${inset()}px`, left: "50%", transform: "translateX(-50%)" }} />
      <img aria-hidden="true" src={props.hUrl} style={{ ...base(), width: `${size()}px`, height: "auto", bottom: `${inset()}px`, left: "50%", transform: "translateX(-50%) scaleY(-1)" }} />
    </>
  );
}
