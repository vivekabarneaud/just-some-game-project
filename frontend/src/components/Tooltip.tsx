import { type JSX, type ParentProps, Show, createSignal, onCleanup } from "solid-js";

interface TooltipProps extends ParentProps {
  text: string | null | undefined;
  /** Position relative to the trigger element */
  position?: "top" | "bottom";
}

export default function Tooltip(props: TooltipProps) {
  const [visible, setVisible] = createSignal(false);
  const [coords, setCoords] = createSignal({ x: 0, y: 0 });
  let triggerRef: HTMLDivElement | undefined;

  const show = () => {
    if (!props.text) return;
    if (triggerRef) {
      const rect = triggerRef.getBoundingClientRect();
      const pos = props.position ?? "top";
      setCoords({
        x: rect.left + rect.width / 2,
        y: pos === "top" ? rect.top : rect.bottom,
      });
    }
    setVisible(true);
  };

  const hide = () => setVisible(false);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusIn={show}
      onFocusOut={hide}
      style={{ display: "contents" }}
    >
      {props.children}
      <Show when={visible() && props.text}>
        <div
          style={{
            position: "fixed",
            left: `${coords().x}px`,
            top: props.position === "bottom" ? `${coords().y + 6}px` : `${coords().y - 6}px`,
            transform: props.position === "bottom" ? "translateX(-50%)" : "translateX(-50%) translateY(-100%)",
            "z-index": "9999",
            "pointer-events": "none",
            padding: "5px 10px",
            background: "rgba(20, 20, 35, 0.95)",
            border: "1px solid rgba(180, 150, 100, 0.4)",
            "border-radius": "4px",
            "font-size": "0.78rem",
            color: "var(--text-secondary)",
            "white-space": "nowrap",
            "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.4)",
          }}
        >
          {props.text}
        </div>
      </Show>
    </div>
  );
}
