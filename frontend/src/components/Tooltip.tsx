import { type JSX, type ParentProps, Show, createSignal } from "solid-js";
import { Portal } from "solid-js/web";

interface TooltipProps extends ParentProps {
  text?: string | null | undefined;
  /** JSX element OR a thunk that returns one. Thunk form is preferred when the
   *  content depends on reactive signals — it defers evaluation to render time
   *  so the inner JSX doesn't create orphaned computations inside event handlers. */
  content?: JSX.Element | (() => JSX.Element);
  position?: "top" | "bottom" | "left" | "right";
  maxWidth?: number;
}

export default function Tooltip(props: TooltipProps) {
  const [visible, setVisible] = createSignal(false);
  const [anchor, setAnchor] = createSignal<DOMRect | null>(null);

  // Avoid triggering the JSX getter on `props.content` — accessing an inline
  // JSX prop forces eager evaluation of its reactive inserts. We only care
  // whether content was provided at all, not its value.
  const hasContent = () => !!(props.text || (props.content != null));

  const show = (e: MouseEvent) => {
    if (!hasContent()) return;
    const target = e.currentTarget as HTMLElement;
    setAnchor(target.getBoundingClientRect());
    setVisible(true);
  };

  const hide = () => setVisible(false);

  const maxW = () => props.maxWidth ?? 300;
  const pos = () => props.position ?? "top";

  const tooltipStyle = (): Record<string, string> => {
    const a = anchor();
    if (!a) return {};
    const s: Record<string, string> = {};
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
      onMouseLeave={hide}
      style={{ display: "inline-block" }}
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
