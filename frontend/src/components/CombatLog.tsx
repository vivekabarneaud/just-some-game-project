import { Show } from "solid-js";
import type { CombatLogEntry } from "@medieval-realm/shared/data/combat";
import HpBar from "./HpBar";

interface CombatLogProps {
  log: CombatLogEntry[];
  /** Compact mode shrinks fonts/spacing for inline use (e.g., active mission card). */
  compact?: boolean;
}

/**
 * Renders a full combat log. Round headers separate rounds. Each entry gets
 * an event-shape-appropriate line: ability casts, dodges, AoE hits, taunts,
 * shield blocks, heals, DoT ticks. HP after each hit is shown as an inline
 * HpBar with threshold colors (green/orange/red) instead of a "56/120" text.
 *
 * Used by both the post-mission LootModal and the per-result Mission Results
 * panel on the Adventurer's Guild page.
 */
export default function CombatLog(props: CombatLogProps) {
  const fontSize = () => props.compact ? "0.72rem" : "0.78rem";
  const lineHeight = () => props.compact ? "1.55" : "1.7";

  let lastRound = 0;
  return (
    <div style={{
      "font-size": fontSize(),
      "line-height": lineHeight(),
    }}>
      {props.log.map((entry) => {
        const showRound = entry.round !== lastRound;
        lastRound = entry.round;
        return (
          <>
            <Show when={showRound}>
              <div style={{
                color: "var(--text-muted)",
                "font-weight": "bold",
                "margin-top": entry.round > 1 ? "6px" : "0",
                "margin-bottom": "2px",
              }}>
                Round {entry.round}
              </div>
            </Show>
            <CombatLogLine entry={entry} />
          </>
        );
      })}
    </div>
  );
}

/** Fallen-in-combat tag — distinguishes a permanent kill from an unconscious
 *  drop. permanent === undefined means the death roll wasn't applied (legacy);
 *  fall back to a generic "killed" tag. */
function FallenTag(props: { permanent?: boolean }) {
  if (props.permanent === undefined) {
    return <span style={{ color: "var(--accent-red)" }}>— killed!</span>;
  }
  if (props.permanent) {
    return <span style={{ color: "var(--accent-red)", "font-weight": "bold" }}>— slain!</span>;
  }
  return <span style={{ color: "var(--accent-gold)" }}>— unconscious</span>;
}

/** Friendly label + icon for a status effect type. */
export function statusLabel(type: string): { text: string; icon: string } {
  if (type === "bleed") return { text: "bleeding", icon: "🩸" };
  if (type === "poison") return { text: "poisoned", icon: "☠️" };
  if (type === "froth") return { text: "infected with the froth", icon: "🤢" };
  if (type === "slow") return { text: "slowed", icon: "❄️" };
  if (type.startsWith("debuff:")) {
    const stat = type.slice("debuff:".length);
    const labels: Record<string, string> = {
      str: "weakened", dex: "clumsy", int: "dazed", wis: "shaken", vit: "frail",
    };
    return { text: labels[stat] ?? `debuffed ${stat}`, icon: "🌀" };
  }
  if (type.startsWith("buff:")) {
    const stat = type.slice("buff:".length);
    const labels: Record<string, string> = {
      str: "strengthened", dex: "quickened", int: "focused", wis: "steeled", vit: "hardened",
    };
    return { text: labels[stat] ?? `buffed ${stat}`, icon: "💪" };
  }
  return { text: type, icon: "✨" };
}

/** Inline italic suffix that describes a freshly-applied status. */
function StatusAppliedNote(props: { applied: NonNullable<CombatLogEntry["statusApplied"]> }) {
  const lbl = statusLabel(props.applied.type);
  return (
    <span style={{
      color: "var(--text-muted)",
      "font-style": "italic",
      "font-size": "0.92em",
    }}>
      ({lbl.icon} {lbl.text}
      {props.applied.perRound != null && <>, {props.applied.perRound}/round</>}
      , {props.applied.rounds} rounds)
    </span>
  );
}

/** Visual treatment for a Model-C retreat beat (commander orders, broken, flee,
 *  abandonment). These are narrative moments, not attacks, so they render as
 *  centered highlighted lines that stand out from the damage chatter. */
const BEAT_STYLE: Record<string, { color: string; bg: string; weight: string }> = {
  order_hold:     { color: "var(--accent-gold)", bg: "rgba(212, 175, 55, 0.10)", weight: "600" },
  order_fallback: { color: "#d4831a",            bg: "rgba(212, 131, 26, 0.12)", weight: "700" },
  broken:         { color: "#d4831a",            bg: "rgba(212, 131, 26, 0.08)", weight: "600" },
  flee_success:   { color: "var(--accent-green)",bg: "rgba(46, 204, 113, 0.10)", weight: "600" },
  flee_fail:      { color: "var(--accent-red)",  bg: "rgba(231, 76, 60, 0.08)",  weight: "500" },
  abandoned:      { color: "var(--accent-red)",  bg: "rgba(231, 76, 60, 0.14)",  weight: "700" },
};

/** A retreat/recovery narrative beat — highlighted, centered, set apart. */
function BeatLine(props: { entry: CombatLogEntry }) {
  const e = props.entry;
  // Movement is a quiet, left-aligned aside — not a dramatic centered beat.
  if (e.beat === "move") {
    return (
      <div style={{ color: "var(--text-muted)", "font-style": "italic", "font-size": "0.92em", display: "flex", "align-items": "center", gap: "5px" }}>
        <span style={{ "font-style": "normal", opacity: 0.7 }}>{e.attackerIcon}</span>
        <span>{e.note}</span>
      </div>
    );
  }
  const s = BEAT_STYLE[e.beat ?? ""] ?? { color: "var(--text-secondary)", bg: "rgba(255,255,255,0.04)", weight: "600" };
  return (
    <div style={{
      display: "flex", "align-items": "center", "justify-content": "center", gap: "6px",
      margin: "3px 0", padding: "3px 8px", "border-radius": "4px",
      background: s.bg, color: s.color, "font-weight": s.weight, "font-style": "italic",
      "text-align": "center",
    }}>
      <span style={{ "font-style": "normal" }}>{e.attackerIcon}</span>
      <span>{e.note}</span>
    </div>
  );
}

/** A single entry. Picks the right shape based on the booleans/fields set. */
function CombatLogLine(props: { entry: CombatLogEntry }) {
  const e = props.entry;

  // Retreat beats render as their own highlighted narrative line.
  if (e.beat) return <BeatLine entry={e} />;

  const lineColor = e.isPoisonTick
    ? "#9b59b6"
    : e.isEnemy
      ? "var(--accent-red)"
      : "var(--text-secondary)";

  return (
    <div style={{ color: lineColor, display: "flex", "align-items": "center", "flex-wrap": "wrap", gap: "4px" }}>
      <span>{e.attackerIcon}</span>

      {/* Ability label — bracketed before the action */}
      <Show when={e.abilityName && !e.isPoisonTick}>
        <span style={{ color: "var(--accent-gold)" }}>[{e.abilityName}]</span>
      </Show>

      {/* DoT tick: "<target> takes X damage <hp-bar>" */}
      <Show when={e.isPoisonTick} fallback={<NonTickContent entry={e} />}>
        <strong>{e.targetName}</strong>
        <span> takes </span>
        <span style={{ color: "#9b59b6" }}>{e.damage} damage</span>
        <Show when={e.targetHp != null && !e.killed}>
          <HpBar current={e.targetHp!} max={e.targetMaxHp ?? e.targetHp!} width="46px" />
        </Show>
        <Show when={e.killed}>
          <FallenTag permanent={e.permanentDeath} />
        </Show>
      </Show>

      {/* Status applied (bleed/slow/etc) — appended inline as italic note */}
      <Show when={e.statusApplied && !e.isPoisonTick}>
        <StatusAppliedNote applied={e.statusApplied!} />
      </Show>
    </div>
  );
}

/** Everything except the dot-tick branch — keeping the JSX flatter than a giant ternary. */
function NonTickContent(props: { entry: CombatLogEntry }) {
  const e = props.entry;

  // Group buff (e.g. Captain's Command). Targets all allies, deals no damage,
  // status-applied tag describes the buff. Render without the misleading
  // "hits ... for 0 damage" template.
  if (e.statusApplied?.type.startsWith("buff:") && e.damage === 0 && !e.targets) {
    return (
      <>
        <strong>{e.attackerName}</strong>
        <span> rallies </span>
        <strong>{e.targetName}</strong>
      </>
    );
  }

  // Taunt
  if (e.isTaunt) {
    return (
      <>
        <strong>{e.attackerName}</strong>
        <span> taunts all enemies </span>
        <span style={{ color: "var(--accent-blue)" }}>— they must attack {e.attackerName} next round</span>
      </>
    );
  }

  // Shield Wall (warrior absorbs killing blow for an ally)
  if (e.isShieldWall) {
    return (
      <>
        <strong>{e.attackerName}</strong>
        <span> absorbs the blow meant for </span>
        <strong>{e.targetName}</strong>
        <span style={{ color: "var(--accent-red)" }}> — {e.damage} damage taken</span>
        <Show when={e.targetHp != null && !e.killed}>
          <HpBar current={e.targetHp!} max={e.targetMaxHp ?? e.targetHp!} width="46px" />
        </Show>
        <Show when={e.killed}>
          <span style={{ color: "var(--accent-red)" }}> — {e.attackerName} falls!</span>
        </Show>
      </>
    );
  }

  // AoE — multi-target
  if (e.targets) {
    return (
      <>
        <strong>{e.attackerName}</strong>
        <span> hits </span>
        {e.targets.map((t, i) => (
          <span style={{ display: "inline-flex", "align-items": "center", gap: "3px" }}>
            {i > 0 && <span>, </span>}
            <strong>{t.name}</strong>
            <span>for</span>
            <span style={{ color: e.healed ? "var(--accent-green)" : "var(--accent-gold)" }}>
              {e.healed ? `+${Math.abs(t.damage)} HP` : t.damage}
            </span>
            <Show when={!t.killed && t.hp != null}>
              <HpBar current={t.hp} max={t.maxHp ?? t.hp} width="36px" />
            </Show>
            <Show when={t.killed}>
              <FallenTag permanent={t.permanentDeath} />
            </Show>
          </span>
        ))}
      </>
    );
  }

  // Heal — single target
  if (e.healed) {
    return (
      <>
        <strong>{e.attackerName}</strong>
        <span> heals </span>
        <strong>{e.targetName}</strong>
        <span> for </span>
        <span style={{ color: "var(--accent-green)" }}>+{e.healAmount} HP</span>
        <Show when={e.targetHp != null}>
          <HpBar current={e.targetHp!} max={e.targetMaxHp ?? e.targetHp!} width="46px" />
        </Show>
      </>
    );
  }

  // Dodged
  if (e.dodged) {
    return (
      <>
        <strong>{e.attackerName}</strong>
        <span> attacks </span>
        <strong>{e.targetName}</strong>
        <span> — </span>
        <span style={{ color: "var(--accent-blue)" }}>dodged!</span>
      </>
    );
  }

  // Standard attack (single target, hit)
  return (
    <>
      <strong>{e.attackerName}</strong>
      <Show when={e.crit}>
        <span style={{ color: "#f39c12", "font-weight": "bold" }}> CRIT!</span>
      </Show>
      <span> hits </span>
      <strong>{e.targetName}</strong>
      <span> for </span>
      <span style={{ color: e.isEnemy ? "var(--accent-red)" : "var(--accent-gold)" }}>
        {e.damage} damage
      </span>
      <Show when={e.targetHp != null && !e.killed}>
        <HpBar current={e.targetHp!} max={e.targetMaxHp ?? e.targetHp!} width="46px" />
      </Show>
      <Show when={e.killed}>
        <FallenTag permanent={e.permanentDeath} />
      </Show>
    </>
  );
}
