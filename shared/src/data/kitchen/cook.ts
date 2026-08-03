// ─── Free-form cooking — the cook engine ────────────────────────────────────
// Pure + deterministic (stable live preview). Each ingredient is PREPARED its
// own way (roast the meat, boil the staple, combine), exactly like the alchemy
// brew engine — the technique shapes what that ingredient contributes. Spices
// amplify; a meal wants a staple or it comes out thin. See docs/DESIGN_KITCHEN.md.

import type { CookTechnique, DishChannel, DishEffect, DishResult, CookPlacement } from "./types.js";
import { getFoodIngredient } from "./ingredients.js";

/** Most of one (ingredient, technique) that counts (matches the alchemy per-plant
 *  cap): the diminish weights run out at 5, so a 6th adds ~nothing. */
export const MAX_PER_INGREDIENT = 5;

/** Diminishing returns on stacking the same channel — biggest counts full, each
 *  further one counts less. Same curve as the brew engine. */
function diminish(amounts: number[]): number {
  const sorted = [...amounts].sort((a, b) => b - a);
  const weights = [1, 0.6, 0.4, 0.25, 0.15];
  return sorted.reduce((sum, a, i) => sum + a * (weights[i] ?? 0.1), 0);
}

/** Per-channel mild cap (cozy by design). */
const CAP: Record<DishChannel, number> = {
  nourishment: 12, comfort: 12, warmth: 10, freshness: 10,
};

/** Variety catalyst: each distinct BODY shelf beyond the first lifts every boon
 *  a little (spices amplify separately). Unlabelled — the numbers just grow. */
const VARIETY_PER_SHELF = 0.05;

/** How each PREP turns an ingredient's raw properties into boons. Warmth is a
 *  fraction of that ingredient's nourishment (only HOT food warms); fresh only
 *  pays off raw (chop). */
const TECH: Record<CookTechnique, { nourish: number; comfort: number; warmth: number; fresh: number }> = {
  boil:     { nourish: 1.2, comfort: 0.8, warmth: 0.6, fresh: 0 },
  fry:      { nourish: 1.0, comfort: 1.1, warmth: 0.2, fresh: 0 },
  roast:    { nourish: 1.0, comfort: 1.4, warmth: 0.4, fresh: 0 },
  chop:     { nourish: 0.6, comfort: 1.0, warmth: 0,   fresh: 1.2 },
  preserve: { nourish: 1.0, comfort: 0.6, warmth: 0,   fresh: 0 },
};

/** An order- AND quantity-independent id for a dish (which ingredients, prepared
 *  which way), so a dish is one recipe whatever the amounts. */
export function dishIdFor(placements: CookPlacement[]): string {
  const key = [...new Set(
    placements.filter((p) => p.ingredientId).map((p) => `${p.ingredientId}:${p.technique}`),
  )].sort().join("+");
  return `dish_${key}`;
}

/** Trim to at most MAX_PER_INGREDIENT of each (ingredient, technique). */
export function clampPlacements(placements: CookPlacement[]): CookPlacement[] {
  const seen = new Map<string, number>();
  const out: CookPlacement[] = [];
  for (const p of placements) {
    if (!p.ingredientId) continue;
    const k = `${p.ingredientId}:${p.technique}`;
    const n = seen.get(k) ?? 0;
    if (n >= MAX_PER_INGREDIENT) continue;
    seen.set(k, n + 1);
    out.push(p);
  }
  return out;
}

const ADJ: Partial<Record<DishChannel, string>> = {
  nourishment: "Hearty", comfort: "Comforting", warmth: "Warming", freshness: "Fresh",
};

/** Prestige spices tip an invented dish into a "Golden ___" — a flavour-AND-
 *  status flourish (a named dish keeps its own name). */
const PRESTIGE_SPICES = new Set(["saffron"]);

export function cook(placements: CookPlacement[]): DishResult {
  const notes: string[] = [];
  const filled = clampPlacements(placements);
  if (filled.length === 0) return { name: "Empty Pot", effects: [], quality: "plain", notes: ["Nothing in the pot."] };

  const roles = new Set<string>();
  const techniques = new Set<CookTechnique>();
  const nourishParts: number[] = [], comfortParts: number[] = [], warmthParts: number[] = [], freshParts: number[] = [];
  let amplify = 0;
  for (const p of filled) {
    const ing = getFoodIngredient(p.ingredientId);
    if (!ing) continue;
    roles.add(ing.role);
    techniques.add(p.technique);
    if (ing.amplify) amplify += ing.amplify;
    const t = TECH[p.technique];
    if (ing.nourish) { nourishParts.push(ing.nourish * t.nourish); warmthParts.push(ing.nourish * t.warmth); }
    if (ing.comfort) comfortParts.push(ing.comfort * t.comfort);
    if (ing.fresh) freshParts.push(ing.fresh * t.fresh);
  }

  // The base lever: substance (protein/veg/fruit/dairy) but no staple → thin.
  const wantsMeal = roles.has("protein") || roles.has("veg") || roles.has("fruit") || roles.has("dairy");
  const thin = wantsMeal && !roles.has("staple");
  const mealScale = thin ? 0.7 : 1;
  if (thin) notes.push("A snack, not a proper meal — it wants some grain or bread.");
  if (amplify > 0) notes.push(`Spices lift it (+${Math.round(amplify * 100)}%).`);

  // Variety acts like a hidden catalyst: a spread of DIFFERENT body ingredients
  // lifts every boon a little (no line — the player just sees the numbers grow).
  const bodyRoles = [...roles].filter((r) => r !== "spice").length;
  const variety = VARIETY_PER_SHELF * Math.max(0, bodyRoles - 1);
  const boost = mealScale * (1 + amplify + variety);
  const raw: Record<DishChannel, number> = {
    nourishment: diminish(nourishParts) * boost,
    comfort: diminish(comfortParts) * boost,
    warmth: diminish(warmthParts) * boost,
    freshness: diminish(freshParts) * boost,
  };
  const effects: DishEffect[] = [];
  for (const ch of Object.keys(raw) as DishChannel[]) {
    const amount = Math.min(CAP[ch], Math.round(raw[ch] * 10) / 10);
    if (amount > 0) effects.push({ channel: ch, amount });
  }
  effects.sort((a, b) => b.amount - a.amount);

  // A seasoning/aromatic lifts a proper meal to "seasoned" (the amplify already
  // nudged the boons; this is the read that says "you cooked it well").
  let quality: DishResult["quality"] = effects.length === 0 ? "plain" : thin ? "rough" : "fine";
  if (quality === "fine" && roles.has("spice")) quality = "seasoned";
  const golden = (quality === "fine" || quality === "seasoned") && filled.some((p) => PRESTIGE_SPICES.has(p.ingredientId));
  return { name: nameDish(techniques, effects, quality, golden), effects, quality, notes };
}

function nameDish(techniques: Set<CookTechnique>, effects: DishEffect[], quality: DishResult["quality"], golden: boolean): string {
  if (effects.length === 0) return "Watery Pot";
  // Form from the "headline" prep (roast > fry > chop > boil).
  const form = techniques.has("roast") ? "Roast"
    : techniques.has("fry") ? "Fry"
    : techniques.size === 1 && techniques.has("chop") ? "Board"
    : "Pot";
  // A prestige spice makes it "Golden ___" — the flourish replaces the adjective.
  if (golden) return `Golden ${form}`;
  const dominant = effects.find((e) => ADJ[e.channel]) ?? effects[0];
  const adj = ADJ[dominant.channel] ?? "Curious";
  const roughPrefix = quality === "rough" ? "Thin " : "";
  return `${roughPrefix}${adj} ${form}`;
}
