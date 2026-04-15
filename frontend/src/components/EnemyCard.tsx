import { Show, For, createSignal } from "solid-js";
import Tooltip from "./Tooltip";
import type { EnemyDefinition } from "~/data/enemies";

// ─── Stat hints ─────────────────────────────────────────────────

const STAT_HINTS: Record<string, string> = {
  str: "Strong attack", vit: "Strong defense", int: "Strong magic power",
  wis: "Strong magic defense", dex: "Fast",
};

function enemyHints(e: EnemyDefinition): string[] {
  const stats = Object.entries(e.stats) as [string, number][];
  const sorted = stats.sort(([, a], [, b]) => b - a);
  const median = sorted[Math.floor(sorted.length / 2)][1];
  return sorted
    .filter(([, v]) => v > median * 1.3)
    .slice(0, 2)
    .map(([k]) => STAT_HINTS[k])
    .filter(Boolean);
}

const TAG_LABELS: Record<string, string> = {
  humanoid: "Humanoid", beast: "Beast", undead: "Undead", ghost: "Ghost",
  demon: "Demon", divine: "Divine", dragon: "Dragon", magical: "Magical",
  elemental_fire: "Fire", elemental_water: "Water", elemental_earth: "Earth",
  elemental_wind: "Wind", elemental_aether: "Aether",
};

// ─── Tooltip content ────────────────────────────────────────────

function EnemyTooltipContent(props: { enemy: EnemyDefinition }) {
  const hp = () => props.enemy.stats.vit * 10;
  const hints = () => enemyHints(props.enemy);
  const tags = () => props.enemy.tags.map((t) => TAG_LABELS[t]).filter(Boolean);
  return (
    <div style={{ "min-width": "160px" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "4px" }}>
        <span style={{ "font-weight": "bold", color: "var(--text-primary)" }}>
          {props.enemy.icon} {props.enemy.name}
        </span>
        <span style={{ "font-size": "0.65rem", color: "var(--text-muted)" }}>
          {tags().join(", ")}
        </span>
      </div>
      <div style={{ "font-size": "0.75rem", color: "var(--accent-red)", "margin-bottom": "4px" }}>
        HP {hp()}
      </div>
      <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "font-style": "italic", "margin-bottom": hints().length ? "4px" : "0" }}>
        {props.enemy.description}
      </div>
      <For each={hints()}>
        {(h) => <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)" }}>· {h}</div>}
      </For>
    </div>
  );
}

// ─── Enemy Card ─────────────────────────────────────────────────

interface EnemyCardProps {
  enemy: EnemyDefinition;
  count?: number;
}

export default function EnemyCard(props: EnemyCardProps) {
  const borderColor = () => props.enemy.boss ? "var(--accent-gold)" : "rgba(231, 76, 60, 0.3)";
  return (
    <Tooltip content={<EnemyTooltipContent enemy={props.enemy} />}>
      <div style={{
        width: "80px",
        height: "110px",
        background: props.enemy.boss ? "rgba(245, 197, 66, 0.08)" : "rgba(231, 76, 60, 0.06)",
        border: `1px solid ${borderColor()}`,
        "border-radius": "6px",
        overflow: "hidden",
        cursor: "default",
        display: "flex",
        "flex-direction": "column",
        position: "relative",
      }}>
        <Show when={props.count != null}>
          <div style={{
            position: "absolute", top: "3px", left: "3px", "z-index": 1,
            background: "rgba(0, 0, 0, 0.7)", color: "var(--text-primary)",
            "font-size": "0.75rem", "font-weight": "bold",
            padding: "1px 5px", "border-radius": "4px",
            "line-height": "1.3",
          }}>
            {props.count}x
          </div>
        </Show>
        {props.enemy.image
          ? (() => {
              const zoomed = props.enemy.image!.replace(".png", "_zoomed.png");
              const [src, setSrc] = createSignal(zoomed);
              return <img src={src()} alt="" onError={() => setSrc(props.enemy.image!)} style={{
                width: "80px", height: "80px", "object-fit": "cover",
                display: "block", "flex-shrink": "0",
              }} />;
            })()
          : <div style={{
              width: "80px", height: "80px", "flex-shrink": "0",
              display: "flex", "align-items": "center", "justify-content": "center",
              background: "rgba(0, 0, 0, 0.2)", "font-size": "2.2rem",
            }}>{props.enemy.icon}</div>
        }
        <div style={{
          padding: "2px 4px",
          "text-align": "center",
          "font-size": "0.6rem",
          color: props.enemy.boss ? "var(--accent-gold)" : "var(--text-secondary)",
          "line-height": "1.15",
          flex: "1",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
        }}>
          {props.enemy.name}
        </div>
      </div>
    </Tooltip>
  );
}
