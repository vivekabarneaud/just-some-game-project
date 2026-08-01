// ─── Free-form alchemy — one place that turns an Effect into readable text ───
// So the sandbox, the lab desk, and (Phase 3) potion tooltips all phrase effects
// the same, honest way: recovery effects read as recovery (hours off / HP / a
// cure), combat buffs read with a real duration, offensive reads as an attack.
// No more "Settles the gut (whole fight)".

import type { Effect, EffectChannel } from "./types.js";

export type EffectKind = "recovery" | "combat" | "offensive";

const RECOVERY = new Set<EffectChannel>(["heal_hp", "ease_fever", "ease_gut", "ease_wound", "general_recovery", "happiness"]);
const OFFENSIVE = new Set<EffectChannel>(["poison", "weaken", "slow", "confuse", "aoe_fire", "aoe_frost"]);

export function effectKind(ch: EffectChannel): EffectKind {
  if (RECOVERY.has(ch)) return "recovery";
  if (OFFENSIVE.has(ch)) return "offensive";
  return "combat";
}

const STAT: Partial<Record<EffectChannel, string>> = {
  str: "STR", dex: "DEX", int: "INT", vit: "VIT", wis: "WIS",
  crit: "Crit", accuracy: "Accuracy", dodge: "Dodge", parry: "Parry",
  initiative: "Initiative", mobility: "Mobility", presence: "Presence", luck: "Luck",
};
const PCT = new Set<EffectChannel>(["crit", "accuracy", "dodge", "parry", "presence", "luck", "damage_pct", "defense_pct"]);

/** Combat duration phrase (combat effects only). */
function duration(e: Effect): string {
  if (e.shape === "burst") return ` for ${e.rounds ?? 2} turns`;
  return " for the whole fight";
}

/** A clear, human line for one effect. */
export function describeEffect(e: Effect): string {
  const n = e.amount;
  switch (e.channel) {
    // ── Recovery (home) — the number is game-HOURS of recovery removed;
    //    a dose that meets the ailment's remaining time cures it outright. ──
    case "heal_hp":
      return e.shape === "sustained" ? `Heals ${n} HP per turn` : `Heals ${n} HP`;
    case "ease_fever": return `Eases fever — about ${n}h off the recovery (cures if it's enough)`;
    case "ease_gut": return `Settles the gut — about ${n}h off the recovery (cures if it's enough)`;
    case "ease_wound": return `Mends wounds — about ${n}h off the recovery (cures if it's enough)`;
    case "general_recovery": return `Speeds recovery — about ${n}h`;
    case "happiness": return `+${n} happiness`;
    // ── Offensive ──
    case "poison": return `Poison — ${n} damage a turn for ${e.rounds ?? 3} turns`;
    case "weaken": return `Weakens the foe (−${n}% their damage)`;
    case "slow": return `Slows the foe (−${n}%)`;
    case "confuse": return `Confuses the foe (${n}% chance)`;
    case "aoe_fire": return `${n} fire damage to the enemy group`;
    case "aoe_frost": return `${n} frost damage to the enemy group, and slows them`;
    // ── Combat buffs ──
    default: {
      if (e.channel.startsWith("resist_")) {
        const school = e.channel.replace("resist_", "");
        if (school === "confuse") return `Resists confusion${duration(e)}`;
        if (school === "undead") return `Wards ${n}% vs the undead${duration(e)}`;
        return `+${n}% resist ${school}${duration(e)}`;
      }
      const label = STAT[e.channel] ?? e.channel;
      const val = PCT.has(e.channel) ? `+${n}%` : `+${n}`;
      return `${val} ${label}${duration(e)}`;
    }
  }
}
