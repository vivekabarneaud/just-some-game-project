// ─── Free-form alchemy — one place that turns an Effect into readable text ───
// So the sandbox, the lab desk, and (Phase 3) potion tooltips all phrase effects
// the same, honest way: recovery effects read as recovery (hours off / HP / a
// cure), combat buffs read with a real duration, offensive reads as an attack.
// No more "Settles the gut (whole fight)".

import type { Effect, EffectChannel } from "./types.js";

export type EffectKind = "recovery" | "combat" | "offensive";

const RECOVERY = new Set<EffectChannel>(["heal_hp", "ease_fever", "ease_gut", "ease_wound", "general_recovery", "happiness", "cure_bleed", "cure_poison", "cure_venom", "cure_froth"]);
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
  damage_pct: "Damage", defense_pct: "Defense",
};
const PCT = new Set<EffectChannel>(["crit", "accuracy", "dodge", "parry", "presence", "luck", "damage_pct", "defense_pct"]);

/** Combat duration phrase (combat effects only). */
function duration(e: Effect): string {
  if (e.shape === "burst") return ` for ${e.rounds ?? 2} turns`;
  return " for the whole fight";
}

/** One effect as a bold-able label + an optional detail clause (no em dashes).
 *  Displays bold the label; describeEffect joins them for plain-text uses. */
export function describeEffectParts(e: Effect): { label: string; detail?: string } {
  const n = e.amount;
  switch (e.channel) {
    // ── Recovery (home) — the number is game-HOURS of recovery removed;
    //    a dose that meets the ailment's remaining time cures it outright. ──
    case "heal_hp": return { label: e.shape === "sustained" ? `Heals ${n} HP per turn` : `Heals ${n} HP` };
    case "ease_fever": return { label: "Eases fever", detail: `about ${n}h off the recovery (cures if it's enough)` };
    case "ease_gut": return { label: "Settles the gut", detail: `about ${n}h off the recovery (cures if it's enough)` };
    case "ease_wound": return { label: "Mends wounds", detail: `about ${n}h off the recovery (cures if it's enough)` };
    case "general_recovery": return { label: "Speeds recovery", detail: `about ${n}h` };
    case "happiness": return { label: `+${n} happiness` };
    case "cure_bleed": return { label: "Stops bleeding" };
    case "cure_poison": return { label: "Cures poison" };
    case "cure_venom": return { label: "Cures the fen-venom" };
    case "cure_froth": return { label: "Cures the froth" };
    // ── Offensive ──
    case "poison": return { label: "Poison", detail: `${n} damage a turn for ${e.rounds ?? 3} turns` };
    case "weaken": return { label: "Weakens the foe", detail: `${n}% less damage` };
    case "slow": return { label: "Slows the foe", detail: `${n}%` };
    case "confuse": return { label: "Confuses the foe", detail: `${n}% chance` };
    case "aoe_fire": return { label: `${n} fire damage to the enemy group` };
    case "aoe_frost": return { label: `${n} frost damage to the enemy group`, detail: "and slows them" };
    // ── Combat buffs — the whole line reads as one label (with its duration) ──
    default: {
      if (e.channel.startsWith("resist_")) {
        const school = e.channel.replace("resist_", "");
        if (school === "confuse") return { label: `Resists confusion${duration(e)}` };
        if (school === "undead") return { label: `Wards ${n}% vs the undead${duration(e)}` };
        return { label: `+${n}% resist ${school}${duration(e)}` };
      }
      const label = STAT[e.channel] ?? e.channel;
      const val = PCT.has(e.channel) ? `+${n}%` : `+${n}`;
      return { label: `${val} ${label}${duration(e)}` };
    }
  }
}

/** A clear, human plain-text line for one effect (no em dashes). */
export function describeEffect(e: Effect): string {
  const { label, detail } = describeEffectParts(e);
  return detail ? `${label}: ${detail}` : label;
}
