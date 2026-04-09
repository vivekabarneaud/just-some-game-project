import { type ParentProps, Show, createSignal } from "solid-js";

interface TooltipProps extends ParentProps {
  text: string | null | undefined;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip(props: TooltipProps) {
  const [visible, setVisible] = createSignal(false);
  const [style, setStyle] = createSignal<Record<string, string>>({});
  let tooltipRef: HTMLDivElement | undefined;

  const show = (e: MouseEvent) => {
    if (!props.text) return;
    setVisible(true);
    // Position after the tooltip renders so we can measure it
    requestAnimationFrame(() => {
      const target = e.currentTarget as HTMLElement;
      if (!target || !tooltipRef) return;
      const hoverRect = target.getBoundingClientRect();
      const tipRect = tooltipRef.getBoundingClientRect();
      const pos = props.position ?? "top";
      const s: Record<string, string> = {};

      switch (pos) {
        case "top":
          s.top = `${hoverRect.y - tipRect.height - 8}px`;
          s.left = `${hoverRect.x + hoverRect.width / 2 - tipRect.width / 2}px`;
          break;
        case "bottom":
          s.top = `${hoverRect.y + hoverRect.height + 8}px`;
          s.left = `${hoverRect.x + hoverRect.width / 2 - tipRect.width / 2}px`;
          break;
        case "left":
          s.left = `${hoverRect.x - tipRect.width - 8}px`;
          s.top = `${hoverRect.y + hoverRect.height / 2 - tipRect.height / 2}px`;
          break;
        case "right":
          s.left = `${hoverRect.x + hoverRect.width + 8}px`;
          s.top = `${hoverRect.y + hoverRect.height / 2 - tipRect.height / 2}px`;
          break;
      }
      setStyle(s);
    });
  };

  const hide = () => setVisible(false);

  return (
    <span
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{ display: "inline-block", width: "100%" }}
    >
      {props.children}
      <Show when={visible() && props.text}>
        <div
          ref={tooltipRef}
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
            "white-space": "nowrap",
            "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.4)",
            ...style(),
          }}
        >
          {props.text}
        </div>
      </Show>
    </span>
  );
}
