import { Show, For, createSignal } from "solid-js";
import Tooltip from "./Tooltip";
import type { EnemyDefinition } from "@medieval-realm/shared/data/enemies";
import { CardFrame } from "./CardFrame";
import { tierFrame, bossFrameAssets } from "~/data/constants";

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

/** How much of the enemy to reveal:
 *  - "full": portrait + name + combat measure (HP/hints). Post-encounter.
 *  - "portrait": portrait + name + lore, but combat measure withheld. A foe
 *    known by reputation (revealPortrait) that hasn't been fought yet.
 *  - "none": a "???" card — an unknown creature. */
export type EnemyReveal = "full" | "portrait" | "none";

interface EnemyCardProps {
  enemy: EnemyDefinition;
  count?: number;
  /** Defaults to "full". Use "none" for undiscovered creatures, "portrait" for
   *  a known-by-reputation foe not yet fought. */
  reveal?: EnemyReveal;
}

function EnemyImage(props: { src: string }) {
  const zoomed = props.src.replace(".png", "_zoomed.png");
  const [src, setSrc] = createSignal(zoomed);
  return <img src={src()} alt="" class="enemy-card-image" onError={() => setSrc(props.src)} />;
}

function HiddenEnemyTooltipContent() {
  return (
    <div style={{ "min-width": "140px" }}>
      <div style={{ "font-weight": "bold", color: "var(--text-primary)", "margin-bottom": "4px" }}>
        Unknown Creature
      </div>
      <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "font-style": "italic" }}>
        You haven't encountered this creature yet.
      </div>
    </div>
  );
}

/** Known-by-reputation tooltip: name + tags + lore, but the combat measure
 *  (HP, stat hints) is withheld until the foe is actually fought. */
function ReputationTooltipContent(props: { enemy: EnemyDefinition }) {
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
      <div style={{ "font-size": "0.72rem", color: "var(--text-muted)", "font-style": "italic", "margin-bottom": "4px" }}>
        {props.enemy.description}
      </div>
      <div style={{ "font-size": "0.72rem", color: "var(--accent-gold)", "font-style": "italic" }}>
        Known by reputation. Its measure in a fight is unknown until you face it.
      </div>
    </div>
  );
}

export default function EnemyCard(props: EnemyCardProps) {
  const reveal = () => props.reveal ?? "full";
  const known = () => reveal() !== "none"; // portrait + name visible
  const bg = () =>
    !known() ? "rgba(60, 60, 70, 0.2)"
    : props.enemy.boss ? "rgba(245, 197, 66, 0.08)"
    : "rgba(231, 76, 60, 0.06)";
  // Rarity frame keyed to the enemy's tier (bosses get their bespoke frame where
  // the art exists), matching the mission-panel / loot-modal frame language.
  // Undiscovered foes always use the plain common frame so the frame can't leak
  // how dangerous the hidden creature is. Ornament flourishes are suppressed
  // (ornamentRarity "common") — they'd swamp a card this small.
  const tier = () => props.enemy.tier ?? 1;
  const bossFrame = () => (known() && props.enemy.boss ? bossFrameAssets(tier()) : null);
  const rarityFrame = () => tierFrame(known() ? tier() : 1);
  const tooltip = () =>
    reveal() === "none" ? <HiddenEnemyTooltipContent />
    : reveal() === "portrait" ? <ReputationTooltipContent enemy={props.enemy} />
    : <EnemyTooltipContent enemy={props.enemy} />;
  return (
    <Tooltip content={tooltip}>
      <div
        class="enemy-card"
        style={{ background: bg() }}
      >
        <Show when={props.count != null}>
          <div style={{
            position: "absolute", top: "3px", left: "3px", "z-index": 6,
            background: "rgba(0, 0, 0, 0.7)", color: "var(--text-primary)",
            "font-size": "0.75rem", "font-weight": "bold",
            padding: "1px 5px", "border-radius": "4px",
            "line-height": "1.3",
          }}>
            {props.count}x
          </div>
        </Show>
        <Show when={known()} fallback={
          <div class="enemy-card-image enemy-card-image-hidden">?</div>
        }>
          {props.enemy.image
            ? <EnemyImage src={props.enemy.image} />
            : <div class="enemy-card-image enemy-card-image-icon">{props.enemy.icon}</div>}
        </Show>
        <div style={{
          padding: "2px 4px",
          "text-align": "center",
          "font-size": "0.6rem",
          color: !known() ? "var(--text-muted)"
            : props.enemy.boss ? "var(--accent-gold)"
            : "var(--text-secondary)",
          "line-height": "1.15",
          flex: "1",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "font-style": !known() ? "italic" : "normal",
        }}>
          {known() ? props.enemy.name : "???"}
        </div>
        {/* Rarity/boss frame overlay — the same visual language as the mission
            panel and loot modal, scaled down (thin border, no flourishes). */}
        <Show
          when={bossFrame()}
          fallback={<CardFrame rarity={rarityFrame().rarity} slice={rarityFrame().slice} ornamentRarity="common" border={9} />}
        >
          <CardFrame frameSrc={bossFrame()!.frameUrl} slice={bossFrame()!.slice} ornamentRarity="common" border={9} />
        </Show>
      </div>
    </Tooltip>
  );
}
