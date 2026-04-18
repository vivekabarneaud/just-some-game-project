import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import { getItem } from "@medieval-realm/shared/data/items";
import { ALCHEMY_RECIPES } from "@medieval-realm/shared/data/alchemy_recipes";
import Tooltip from "./Tooltip";

export interface SupplyOption {
  id: string;
  name: string;
  icon: string;
  qty: number;
  /** Short description / effect hint for the dropdown row */
  hint?: string;
}

interface SupplySlotProps {
  /** Currently selected item ID (or undefined for empty slot) */
  value: string | undefined;
  /** Available options to show in the dropdown */
  options: SupplyOption[];
  /** Slot flavor — controls the hover tooltip + placeholder icon */
  kind: "potion" | "food" | "recovery";
  /** Called when the user picks an item (or clears). null means clear. */
  onChange: (itemId: string | null) => void;
  /** If non-empty, this slot is disabled and shows the reason on hover */
  disabledReason?: string;
}

const PLACEHOLDER_ICON = { potion: "🧪", food: "🍖", recovery: "🩹" } as const;
const LABEL = { potion: "Potion", food: "Food", recovery: "Bandage" } as const;

export default function SupplySlot(props: SupplySlotProps) {
  const [open, setOpen] = createSignal(false);
  let wrapperRef: HTMLDivElement | undefined;

  // Close dropdown on outside click
  const handleDocClick = (e: MouseEvent) => {
    if (!wrapperRef) return;
    if (!wrapperRef.contains(e.target as Node)) setOpen(false);
  };
  onMount(() => {
    document.addEventListener("mousedown", handleDocClick);
    onCleanup(() => document.removeEventListener("mousedown", handleDocClick));
  });

  const selectedItem = () => {
    if (!props.value) return null;
    return getItem(props.value) ?? (() => {
      const alch = ALCHEMY_RECIPES.find((r) => r.id === props.value);
      return alch ? { id: alch.id, name: alch.name, icon: alch.icon, description: alch.description } : null;
    })();
  };

  const tooltipText = () => {
    if (props.disabledReason) return props.disabledReason;
    const it = selectedItem();
    if (it) return `${it.icon} ${it.name}`;
    return `Add ${LABEL[props.kind]}`;
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      <Tooltip text={tooltipText()} position="right">
        <div
          onClick={() => {
            if (props.disabledReason) return;
            setOpen((o) => !o);
          }}
          style={{
            width: "20px",
            height: "20px",
            "border-radius": "4px",
            border: `1px ${props.value ? "solid" : "dashed"} var(--border-color)`,
            background: props.value ? "rgba(167, 139, 250, 0.15)" : "rgba(0, 0, 0, 0.25)",
            cursor: props.disabledReason ? "not-allowed" : "pointer",
            opacity: props.disabledReason ? 0.4 : 1,
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "font-size": "0.75rem",
            "line-height": "1",
          }}
        >
          <Show when={selectedItem()} fallback={
            <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>
              {PLACEHOLDER_ICON[props.kind]}
            </span>
          }>
            <span>{selectedItem()!.icon}</span>
          </Show>
        </div>
      </Tooltip>

      <Show when={open()}>
        <div style={{
          position: "absolute",
          top: "24px",
          left: "0",
          "z-index": "1000",
          "min-width": "170px",
          "max-height": "220px",
          "overflow-y": "auto",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          "border-radius": "6px",
          "box-shadow": "0 4px 12px rgba(0,0,0,0.4)",
          padding: "4px",
        }}>
          <Show when={props.value}>
            <div
              onClick={() => { props.onChange(null); setOpen(false); }}
              style={{
                padding: "4px 8px", "border-radius": "4px", cursor: "pointer",
                "font-size": "0.75rem", color: "var(--text-muted)",
                "border-bottom": "1px solid var(--border-default)",
                "margin-bottom": "2px",
              }}
            >
              ✕ Remove
            </div>
          </Show>
          <Show when={props.options.length === 0} fallback={
            <For each={props.options}>
              {(opt) => {
                const isSelected = () => opt.id === props.value;
                return (
                  <div
                    onClick={() => { props.onChange(opt.id); setOpen(false); }}
                    style={{
                      padding: "5px 8px",
                      "border-radius": "4px",
                      cursor: "pointer",
                      display: "flex",
                      "align-items": "center",
                      gap: "6px",
                      "font-size": "0.75rem",
                      background: isSelected() ? "rgba(167, 139, 250, 0.15)" : "transparent",
                    }}
                    onMouseEnter={(e) => { if (!isSelected()) (e.currentTarget as HTMLDivElement).style.background = "var(--bg-primary)"; }}
                    onMouseLeave={(e) => { if (!isSelected()) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <span style={{ "font-size": "0.9rem" }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "var(--text-primary)" }}>{opt.name}</div>
                      <Show when={opt.hint}>
                        <div style={{ color: "var(--accent-green)", "font-size": "0.65rem" }}>{opt.hint}</div>
                      </Show>
                    </div>
                    <span style={{ color: "var(--text-muted)", "font-size": "0.7rem" }}>x{opt.qty}</span>
                  </div>
                );
              }}
            </For>
          }>
            <div style={{ padding: "8px", color: "var(--text-muted)", "font-size": "0.75rem", "text-align": "center" }}>
              No {LABEL[props.kind].toLowerCase()} available
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
