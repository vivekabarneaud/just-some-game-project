import { type JSX, type ParentProps, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";

interface TooltipProps extends ParentProps {
  text?: string | null | undefined;
  /** JSX element OR a thunk that returns one. Thunk form is preferred when the
   *  content depends on reactive signals — it defers evaluation to render time
   *  so the inner JSX doesn't create orphaned computations inside event handlers. */
  content?: JSX.Element | (() => JSX.Element);
  /** Position relative to the anchor element, OR "cursor" to follow the mouse. */
  position?: "top" | "bottom" | "left" | "right" | "cursor";
  maxWidth?: number;
  /** When true, the anchor renders as `display: block` so it fills its
   *  parent's width. Default `inline-block` (shrinks to content). */
  block?: boolean;
}

export default function Tooltip(props: TooltipProps) {
  const [visible, setVisible] = createSignal(false);
  const [anchor, setAnchor] = createSignal<DOMRect | null>(null);
  const [cursor, setCursor] = createSignal<{ x: number; y: number } | null>(null);

  // Avoid triggering the JSX getter on `props.content` — accessing an inline
  // JSX prop forces eager evaluation of its reactive inserts. We only care
  // whether content was provided at all, not its value.
  const hasContent = () => !!(props.text || (props.content != null));

  const show = (e: MouseEvent) => {
    if (!hasContent()) return;
    const target = e.currentTarget as HTMLElement;
    setAnchor(target.getBoundingClientRect());
    setCursor({ x: e.clientX, y: e.clientY });
    setVisible(true);
  };

  const move = (e: MouseEvent) => {
    if (props.position !== "cursor") return;
    if (!visible()) return;
    setCursor({ x: e.clientX, y: e.clientY });
  };

  const hide = () => setVisible(false);

  const maxW = () => props.maxWidth ?? 300;
  const pos = () => props.position ?? "top";

  const tooltipStyle = (): Record<string, string> => {
    const s: Record<string, string> = {};
    if (pos() === "cursor") {
      const c = cursor();
      if (!c) return {};
      // Offset slightly below-right so the tooltip doesn't sit on top of the
      // cursor. Clamp to viewport so it doesn't escape on right/bottom edges.
      const offsetX = 14;
      const offsetY = 18;
      const tipW = maxW();
      const x = Math.min(c.x + offsetX, window.innerWidth - tipW - 8);
      const y = Math.min(c.y + offsetY, window.innerHeight - 60);
      s.left = `${x}px`;
      s.top = `${y}px`;
      return s;
    }
    const a = anchor();
    if (!a) return {};
    switch (pos()) {
      case "top":
        s.bottom = `${window.innerHeight - a.top + 8}px`;
        s.left = `${a.left + a.width / 2}px`;
        s.transform = "translateX(-50%)";
        break;
      case "bottom":
        s.top = `${a.bottom + 8}px`;
        s.left = `${a.left + a.width / 2}px`;
        s.transform = "translateX(-50%)";
        break;
      case "left":
        s.right = `${window.innerWidth - a.left + 8}px`;
        s.top = `${a.top + a.height / 2}px`;
        s.transform = "translateY(-50%)";
        break;
      case "right":
        s.left = `${a.right + 8}px`;
        s.top = `${a.top + a.height / 2}px`;
        s.transform = "translateY(-50%)";
        break;
    }
    return s;
  };

  return (
    <span
      onMouseEnter={show}
      onMouseMove={move}
      onMouseLeave={hide}
      style={{ display: props.block ? "block" : "inline-block" }}
    >
      {props.children}
      <Show when={visible() && hasContent()}>
        <Portal>
          <div
            style={{
              position: "fixed",
              "z-index": "9999",
              "pointer-events": "none",
              padding: "5px 10px",
              background: "rgba(20, 20, 35, 0.95)",
              border: "1px solid rgba(180, 150, 100, 0.4)",
              "border-radius": "4px",
              "font-size": "0.78rem",
              color: "var(--text-secondary)",
              "max-width": `${maxW()}px`,
              "white-space": "normal",
              "word-wrap": "break-word",
              "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.4)",
              ...tooltipStyle(),
            }}
          >
            {typeof props.content === "function"
              ? (props.content as () => JSX.Element)()
              : (props.content ?? props.text)}
          </div>
        </Portal>
      </Show>
    </span>
  );
}
