import { createSignal, For, Show, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";

interface SelectOption {
  value: string;
  label: string;
}

/** A small custom dropdown styled to match the game — dark, gold-accented,
 *  squared, animated chevron. The open menu renders through a Portal with fixed
 *  positioning so it escapes any `overflow: hidden` parent (e.g. framed cards).
 *  Closes on outside click, Escape, or scroll. */
export default function Select(props: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  width?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = createSignal(false);
  const [rect, setRect] = createSignal<{ top: number; left: number; width: number } | null>(null);
  let btn: HTMLButtonElement | undefined;
  let menu: HTMLDivElement | undefined;
  const current = () => props.options.find((o) => o.value === props.value);

  const onDocDown = (e: MouseEvent) => {
    const t = e.target as Node;
    if (btn?.contains(t) || menu?.contains(t)) return;
    close();
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
  const onReflow = () => close();
  const listen = () => {
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
  };
  const unlisten = () => {
    document.removeEventListener("mousedown", onDocDown);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onReflow, true);
    window.removeEventListener("resize", onReflow);
  };
  const close = () => { setOpen(false); unlisten(); };
  const toggle = () => {
    if (props.disabled) return;
    if (open()) { close(); return; }
    if (btn) {
      const r = btn.getBoundingClientRect();
      setRect({ top: r.bottom + 2, left: r.left, width: r.width });
    }
    setOpen(true);
    listen();
  };
  const pick = (value: string) => { props.onChange(value); close(); };
  onCleanup(unlisten);

  return (
    <div style={{ width: props.width ?? "100%" }}>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        disabled={props.disabled}
        style={{
          width: "100%", display: "flex", "align-items": "center", "justify-content": "space-between", gap: "8px",
          padding: "6px 10px", "font-size": "0.82rem", "text-align": "left",
          cursor: props.disabled ? "default" : "pointer", opacity: props.disabled ? "0.5" : "1",
          background: "var(--bg-primary)", color: "var(--text-primary)",
          border: `1px solid ${open() ? "var(--accent-gold)" : "var(--border-color)"}`,
        }}
      >
        <span style={{ overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>{current()?.label ?? "…"}</span>
        <span aria-hidden="true" style={{ color: "var(--text-muted)", "font-size": "0.7rem", transform: open() ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
      </button>
      <Show when={open() && rect()}>
        <Portal>
          <div
            ref={menu}
            style={{
              position: "fixed", top: `${rect()!.top}px`, left: `${rect()!.left}px`, width: `${rect()!.width}px`, "z-index": "2000",
              background: "var(--bg-secondary)", border: "1px solid var(--accent-gold)",
              "max-height": "240px", overflow: "auto", "box-shadow": "0 8px 22px rgba(0, 0, 0, 0.55)",
            }}
          >
            <For each={props.options}>
              {(o) => {
                const active = () => o.value === props.value;
                return (
                  <div
                    onClick={() => pick(o.value)}
                    style={{
                      padding: "7px 10px", "font-size": "0.82rem", cursor: "pointer",
                      background: active() ? "rgba(212, 175, 55, 0.12)" : "transparent",
                      color: active() ? "var(--accent-gold)" : "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => { if (!active()) e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = active() ? "rgba(212, 175, 55, 0.12)" : "transparent"; }}
                  >
                    {o.label}
                  </div>
                );
              }}
            </For>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
