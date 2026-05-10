import { For, Show } from "solid-js";
import type { EnemyDefinition, EnemyAbility } from "@medieval-realm/shared/data/enemies";
import Tooltip from "./Tooltip";

interface MissionEnemyCardProps {
  enemy: EnemyDefinition;
  count?: number;
  /** True when the enemy hasn't been encountered yet — render as ??? portrait
   *  with hidden abilities. Same gating as the small EnemyCard. */
  hidden?: boolean;
}

/** Bigger enemy card used inside the Mission Assembly Panel only.
 *  Mirrors the team-member card layout (140px wide, square portrait,
 *  name overlay, ability squares row) so the assembly panel reads as a
 *  single visual language. The smaller EnemyCard is still used elsewhere
 *  (mission preview lists, loot modal, combat playback). */
export default function MissionEnemyCard(props: MissionEnemyCardProps) {
  const borderColor = () =>
    props.hidden ? "rgba(150, 150, 150, 0.35)"
    : props.enemy.boss ? "var(--accent-gold)"
    : "rgba(231, 76, 60, 0.45)";
  const bg = () =>
    props.hidden ? "rgba(60, 60, 70, 0.2)"
    : props.enemy.boss ? "rgba(245, 197, 66, 0.08)"
    : "rgba(231, 76, 60, 0.06)";
  const nameColor = () =>
    props.hidden ? "var(--text-muted)"
    : props.enemy.boss ? "var(--accent-gold)"
    : "#f5b8b0";

  return (
    <div style={{
      display: "flex", "flex-direction": "column",
      background: bg(),
      border: `1px solid ${borderColor()}`,
      "border-radius": "10px",
      width: "140px",
    }}>
      {/* Portrait area + name overlay. Same shape as the team card. */}
      <div style={{
        position: "relative", width: "100%", height: "140px",
        overflow: "hidden",
        "border-radius": "10px 10px 0 0",
      }}>
        <Show
          when={!props.hidden && props.enemy.image}
          fallback={
            <div style={{
              width: "100%", height: "100%",
              display: "flex", "align-items": "center", "justify-content": "center",
              "font-size": "2.4rem",
              color: props.hidden ? "var(--text-muted)" : "var(--text-secondary)",
              opacity: props.hidden ? "0.5" : "1",
              background: "rgba(0, 0, 0, 0.25)",
            }}>
              {props.hidden ? "?" : props.enemy.icon}
            </div>
          }
        >
          <img
            src={props.enemy.image!}
            alt={props.enemy.name}
            style={{ width: "100%", height: "100%", "object-fit": "cover", display: "block" }}
          />
        </Show>
        {/* Count badge top-left, mirrors the original EnemyCard. */}
        <Show when={props.count != null}>
          <div style={{
            position: "absolute", top: "6px", left: "6px",
            background: "rgba(0, 0, 0, 0.7)", color: "var(--text-primary)",
            "font-size": "0.75rem", "font-weight": "bold",
            padding: "2px 6px", "border-radius": "4px",
            "line-height": "1.3",
          }}>
            {props.count}x
          </div>
        </Show>
        {/* Name overlay — building-card-style gradient, left-aligned. */}
        <div class="building-card-image-overlay" style={{ padding: "8px 10px" }}>
          <div style={{
            "font-family": "var(--font-heading)",
            "font-size": "0.9rem",
            "line-height": "1.15",
            color: nameColor(),
            "text-align": "left",
            "text-shadow": "0 1px 2px rgba(0,0,0,0.8)",
          }}>
            {props.hidden ? "Unknown Creature" : props.enemy.name}
          </div>
        </div>
      </div>
      {/* Abilities row — squares mirror the team card's supply slots, so
       *  enemies and adventurers visually rhyme. Hidden enemies show
       *  question-mark squares; otherwise we render up to 3 ability icons.
       *  Hover shows the ability name + a short description. */}
      <div style={{
        padding: "8px 8px 4px",
        display: "flex", gap: "6px", "justify-content": "center",
        "min-height": "44px",
      }}>
        <Show
          when={!props.hidden && props.enemy.abilities?.length}
          fallback={
            <Show
              when={props.hidden}
              fallback={
                <span style={{ "font-size": "0.65rem", color: "var(--text-muted)", "align-self": "center", "font-style": "italic" }}>
                  no special attacks
                </span>
              }
            >
              {/* Hidden — three placeholder squares */}
              <For each={[0, 1, 2]}>
                {() => (
                  <Tooltip text="Encounter this creature to learn its tricks." position="bottom">
                    <div style={{
                      width: "32px", height: "32px",
                      "border-radius": "4px",
                      border: "1px dashed var(--border-color)",
                      background: "rgba(0, 0, 0, 0.25)",
                      display: "flex", "align-items": "center", "justify-content": "center",
                      "font-size": "0.85rem",
                      color: "var(--text-muted)",
                      opacity: "0.6",
                    }}>
                      ?
                    </div>
                  </Tooltip>
                )}
              </For>
            </Show>
          }
        >
          <For each={props.enemy.abilities!.slice(0, 3)}>
            {(ability) => (
              <Tooltip
                content={() => <AbilityTooltip ability={ability} />}
                position="bottom"
              >
                <div style={{
                  width: "32px", height: "32px",
                  "border-radius": "4px",
                  border: "1px solid rgba(231, 76, 60, 0.45)",
                  background: "rgba(231, 76, 60, 0.12)",
                  display: "flex", "align-items": "center", "justify-content": "center",
                  "font-size": "1rem",
                  "line-height": "1",
                }}>
                  {ability.icon}
                </div>
              </Tooltip>
            )}
          </For>
        </Show>
      </div>
      {/* Phantom row to match the team card's "Risk of permanent death" line.
       *  Keeps enemy and team cards at identical heights when laid out side
       *  by side. */}
      <div style={{
        padding: "0 8px 8px",
        "font-size": "0.7rem",
        color: "transparent",
        "text-align": "center",
      }}>
        Risk of permanent death: —
      </div>
    </div>
  );
}

/** Small tooltip body for one ability — name + a short description of what
 *  it does, derived from the effect shape. Same content idea as the original
 *  EnemyTooltipContent, scaled down to a single ability. */
function AbilityTooltip(props: { ability: EnemyAbility }) {
  const desc = () => describeAbility(props.ability);
  return (
    <div style={{ "min-width": "180px", "max-width": "240px" }}>
      <div style={{
        "font-weight": "bold",
        color: "var(--text-primary)",
        "margin-bottom": "4px",
      }}>
        {props.ability.icon} {props.ability.name}
      </div>
      <div style={{
        "font-size": "0.75rem",
        color: "var(--text-secondary)",
        "line-height": "1.4",
      }}>
        {desc()}
      </div>
      <div style={{
        "font-size": "0.7rem",
        color: "var(--text-muted)",
        "margin-top": "4px",
        "font-style": "italic",
      }}>
        Cooldown: {props.ability.cooldown} round{props.ability.cooldown === 1 ? "" : "s"}
        {props.ability.trigger !== "always" && ` · ${humanTrigger(props.ability.trigger)}`}
      </div>
    </div>
  );
}

function describeAbility(a: EnemyAbility): string {
  const e = a.effect;
  switch (e.type) {
    case "bleed":   return `Inflicts bleed: ${e.pctPerRound}% max HP per round for ${e.rounds} rounds.`;
    case "poison":  return `Inflicts poison: ${e.pctPerRound}% max HP per round for ${e.rounds} rounds.`;
    case "heal_self": return `Heals self for ${e.pct}% of max HP.`;
    case "heal_ally": return `Heals an ally for ${e.pct}% of their max HP.`;
    case "summon":  return `Summons ${e.count}× reinforcements.`;
    case "aoe_damage": return `${e.magical ? "Magical" : "Physical"} area attack — ${e.pct}% damage to the whole team.`;
    case "mind_control": return `Mind-controls a target for ${e.rounds} round${e.rounds === 1 ? "" : "s"}.`;
    case "buff_allies": return `Buffs allies' ${e.stat.toUpperCase()} by ${e.pct}% for ${e.rounds} rounds.`;
    case "debuff_target": return `Debuffs target's ${e.stat.toUpperCase()} by ${e.pct}% for ${e.rounds} rounds.`;
    case "revive_ally": return `Revives a fallen ally at ${e.hpPct}% HP.`;
    case "damage_mult": return `Hits ${e.targets} target${e.targets === 1 ? "" : "s"} for ${Math.round(e.mult * 100)}% damage.`;
  }
}

function humanTrigger(t: EnemyAbility["trigger"]): string {
  switch (t) {
    case "always": return "any round";
    case "hp_below_50": return "when below 50% HP";
    case "ally_dead": return "when an ally falls";
    case "round_start": return "round start";
    case "any_ally_below_30": return "when an ally drops below 30% HP";
  }
}
