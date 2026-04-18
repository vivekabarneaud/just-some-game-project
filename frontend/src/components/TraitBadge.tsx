import { Show } from "solid-js";
import { BACKSTORY_TRAITS } from "@medieval-realm/shared/data/adventurers";

interface TraitBadgeProps {
  traitId: string;
  showDescription?: boolean;
}

export default function TraitBadge(props: TraitBadgeProps) {
  const trait = () => BACKSTORY_TRAITS.find((t) => t.id === props.traitId);
  return (
    <Show when={trait()}>
      <div style={{
        display: "inline-block",
        padding: "3px 8px",
        "border-radius": "4px",
        background: "rgba(167, 139, 250, 0.1)",
        border: "1px solid rgba(167, 139, 250, 0.2)",
        "font-size": "0.75rem",
      }}>
        <span style={{ color: "#a78bfa", "font-weight": "bold" }}>{trait()!.name}</span>
        <Show when={props.showDescription !== false}>
          <span style={{ color: "var(--text-muted)", "margin-left": "6px" }}>{trait()!.description}</span>
        </Show>
      </div>
    </Show>
  );
}
