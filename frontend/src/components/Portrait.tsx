import { createSignal, Show, type JSX } from "solid-js";

/**
 * One portrait, drawn one way.
 *
 * Ten places in the game wrote their own <img> for a face, and only two of them
 * handled a missing file. This holds the URL rules and the fallback in one
 * place: ask for a face, get a face, or get the glyph when there is no art.
 *
 * `src` takes a ready URL. Most callers get one from `getPortraitUrl` or
 * `getZoomedPortraitUrl` (shared/data/adventurers.ts), but a founder carries a
 * plain URL field and a merchant may carry none, so a string is the only shape
 * every caller shares.
 *
 * The zoomed variant is the face crop, named `<name>_zoomed.png`. Not every
 * portrait has one, so a failed zoom drops back to the full picture before it
 * gives up and shows the glyph.
 */
export default function Portrait(props: {
  src?: string;
  alt: string;
  /** Box size in px. Square unless `height` says otherwise. Leave it out to
   *  fill the parent, which is what a card portrait frame wants. */
  size?: number;
  height?: number;
  /** "zoomed" asks for the face crop. */
  variant?: "full" | "zoomed";
  /** Shown when there is no art at all. */
  glyph?: JSX.Element;
  round?: boolean;
  /** Grey the picture out. Use it for a person who is away. */
  dim?: boolean;
  objectPosition?: string;
  style?: JSX.CSSProperties;
}) {
  // "zoom" tries the face crop, "full" the whole picture, "none" gives up.
  const [stage, setStage] = createSignal<"zoom" | "full" | "none">(
    props.variant === "zoomed" ? "zoom" : "full",
  );

  const url = () => {
    if (!props.src) return undefined;
    return stage() === "zoom" ? props.src.replace(".png", "_zoomed.png") : props.src;
  };

  const box = () => (props.size ? `${props.size}px` : "100%");
  const boxH = () => (props.height ? `${props.height}px` : box());

  const onError = () => {
    // A missing face crop is normal. A missing picture is not, so stop there.
    setStage((s) => (s === "zoom" ? "full" : "none"));
  };

  return (
    <Show
      when={props.src && stage() !== "none"}
      fallback={
        <span
          aria-label={props.alt}
          style={{
            width: box(), height: boxH(),
            display: "flex", "align-items": "center", "justify-content": "center",
            "font-size": props.size ? `${Math.round(props.size * 0.5)}px` : "2.5rem",
            background: "rgba(0,0,0,0.25)",
            "border-radius": props.round ? "50%" : "6px",
            ...props.style,
          }}
        >
          {props.glyph ?? "🙂"}
        </span>
      }
    >
      <img
        src={url()}
        alt={props.alt}
        loading="lazy"
        onError={onError}
        style={{
          width: box(), height: boxH(),
          "object-fit": "cover",
          "object-position": props.objectPosition ?? "top",
          "border-radius": props.round ? "50%" : "6px",
          filter: props.dim ? "grayscale(0.8) brightness(0.75)" : undefined,
          ...props.style,
        }}
      />
    </Show>
  );
}
