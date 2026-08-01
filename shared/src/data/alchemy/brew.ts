// ─── Free-form alchemy — the brew engine ────────────────────────────────────
// Pure + deterministic (no RNG → stable live preview): placements in, a summed,
// capped BrewResult out. See docs/DESIGN_APOTHECARY.md. Wildcard "risk" is baked
// into the ingredient data (a wildcard contributes its own downside), so the
// engine stays deterministic while combos still surprise.

import type { Effect, EffectChannel, Placement, BrewResult, Technique } from "./types.js";
import { getIngredient } from "./ingredients.js";

/** A technique an ingredient doesn't define still yields a faint something. */
const GENERIC_WASTE: Effect = { channel: "general_recovery", amount: 1 };

/** Per-channel magnitude cap (mild by design; offensive a touch higher). */
const CAP: Partial<Record<EffectChannel, number>> = {
  str: 6, dex: 6, int: 6, vit: 6, wis: 6,
  crit: 30, accuracy: 30, dodge: 30, parry: 30, initiative: 6, mobility: 6, presence: 30, luck: 30,
  damage_pct: 40, defense_pct: 40,
  heal_hp: 60, ease_fever: 8, ease_gut: 8, ease_wound: 8, general_recovery: 6, happiness: 5,
  poison: 8, weaken: 40, slow: 40, confuse: 40, aoe_fire: 40, aoe_frost: 40,
};
const DEFAULT_CAP = 50;

/** Channels the engine treats as catalyst MODIFIERS, not summed output. */
const MODIFIER_CHANNELS = new Set<EffectChannel>(["amplify", "extend"]);

/** Diminishing returns on stacking the SAME channel: the biggest contribution
 *  counts full, each further one counts less. Rewards breadth over spamming. */
function diminish(amounts: number[]): number {
  const sorted = [...amounts].sort((a, b) => Math.abs(b) - Math.abs(a));
  const weights = [1, 0.6, 0.4, 0.25, 0.15];
  return sorted.reduce((sum, a, i) => sum + a * (weights[i] ?? 0.1), 0);
}

const HARSH_PENALTY = 0.6; // a brew of heroes/toxins with no base carries thin

/** Which output channels read as "the point" of the brew (for naming). */
const NAME_WORD: Partial<Record<EffectChannel, string>> = {
  int: "Mind", wis: "Clarity", str: "Might", dex: "Swift", vit: "Vigor",
  heal_hp: "Healing", ease_fever: "Fever", ease_gut: "Settling", ease_wound: "Wound",
  general_recovery: "Restorative", happiness: "Comfort",
  poison: "Venom", weaken: "Withering", slow: "Miring", confuse: "Bewildering",
  aoe_fire: "Burning", aoe_frost: "Chilling",
  resist_undead: "Warding", resist_confuse: "Steadying", defense_pct: "Guard", damage_pct: "Fury",
};

export function brew(placements: Placement[]): BrewResult {
  const notes: string[] = [];
  const filled = placements.filter((p) => p.ingredientId);
  if (filled.length === 0) {
    return { effects: [], name: "Empty Vessel", quality: "dubious", notes: ["Nothing in the pot."] };
  }

  // Collect raw effects + track roles/techniques present.
  const raw: Effect[] = [];
  let amplify = 0, extend = 0;
  const roles = new Set<string>();
  const techniques = new Set<Technique>();
  let hasWildcard = false;

  for (const p of filled) {
    const ing = getIngredient(p.ingredientId);
    if (!ing) continue;
    roles.add(ing.role);
    techniques.add(p.technique);
    if (ing.role === "wildcard") hasWildcard = true;
    const effects = ing.techniques[p.technique] ?? [{ ...GENERIC_WASTE }];
    if (!ing.techniques[p.technique]) {
      notes.push(`${ing.name} wasn't made for ${p.technique} — most of its virtue is lost.`);
    }
    for (const e of effects) {
      if (e.channel === "amplify") amplify += e.amount;
      else if (e.channel === "extend") extend += e.amount;
      else raw.push(e);
    }
  }

  // The base lever: heroes/toxins with no base carry thin and harsh.
  const wantsBase = roles.has("hero") || roles.has("toxin") || roles.has("wildcard");
  const harsh = wantsBase && !roles.has("base");
  const scale = (harsh ? HARSH_PENALTY : 1) * (1 + amplify);
  if (harsh) notes.push("Harsh and thin — it wants a base (chamomile, lavender) to carry it.");
  if (amplify > 0) notes.push(`Honey amplifies the brew (+${Math.round(amplify * 100)}%).`);
  if (extend > 0) notes.push(`Honey-syrup extends the timed effects (+${extend} rounds).`);

  // Merge by (channel, shape): diminish the stack, scale, cap, extend rounds.
  const groups = new Map<string, Effect[]>();
  for (const e of raw) {
    const key = `${e.channel}|${e.shape ?? "sustained"}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(e);
  }
  const effects: Effect[] = [];
  for (const [key, list] of groups) {
    const [channel, shape] = key.split("|") as [EffectChannel, Effect["shape"]];
    let amount = diminish(list.map((e) => e.amount)) * scale;
    const cap = CAP[channel] ?? DEFAULT_CAP;
    amount = Math.min(cap, Math.round(amount * 10) / 10);
    if (amount === 0) continue;
    const rounds = list.find((e) => e.rounds)?.rounds;
    const out: Effect = { channel, amount };
    if (shape && shape !== "sustained") out.shape = shape;
    if (rounds) out.rounds = rounds + extend;
    else if (extend && shape === "burst") out.rounds = extend;
    effects.push(out);
  }
  effects.sort((a, b) => b.amount - a.amount);

  // Quality + name.
  const quality: BrewResult["quality"] = effects.length === 0 ? "dubious" : harsh ? "rough" : "fine";
  if (hasWildcard) notes.push("A wildcard is in the mix — potent, and its own risk rides along.");

  return { effects, name: nameBrew(effects, techniques, quality), quality, notes };
}

function nameBrew(effects: Effect[], techniques: Set<Technique>, quality: BrewResult["quality"]): string {
  if (effects.length === 0) return "Murky Water";
  // Dominant "intent" effect = the biggest one that has a naming word.
  const dominant = effects.find((e) => NAME_WORD[e.channel]) ?? effects[0];
  const word = NAME_WORD[dominant.channel] ?? "Curious";

  // Form from the techniques used + the dominant channel/shape.
  const offensive = ["poison", "weaken", "slow", "confuse", "aoe_fire", "aoe_frost"].includes(dominant.channel);
  let form: string;
  if (techniques.has("char")) form = offensive ? "Bomb" : "Incense";
  else if (offensive) form = dominant.channel === "poison" ? "Poison" : "Flask";
  else if (techniques.has("crush")) form = "Salve";
  else if (techniques.has("distil")) form = "Essence";
  else if (techniques.has("ferment")) form = "Brew";
  else form = "Tonic";

  const adj = quality === "dubious" ? "Dubious " : quality === "rough" ? "Rough " : "";
  return `${adj}${word} ${form}`;
}
