// ─── Free-form cooking — the cook engine ────────────────────────────────────
// Pure + deterministic (stable live preview). A dish is cooked with ONE
// technique over a list of ingredient ids (repeats = quantity). The technique
// shapes which mild boons come out; spices amplify; a meal wants a staple or it
// comes out thin. Mirrors the alchemy brew() shape. See docs/DESIGN_KITCHEN.md.

import type { CookTechnique, DishChannel, DishEffect, DishResult } from "./types.js";
import { getFoodIngredient } from "./ingredients.js";

/** Most of one ingredient that counts in a dish (matches the alchemy per-plant
 *  cap): the diminish weights run out at 5, so a 6th adds ~nothing. */
export const MAX_PER_INGREDIENT = 5;

/** Diminishing returns on stacking the same property — biggest counts full,
 *  each further one counts less. Same curve as the brew engine. */
function diminish(amounts: number[]): number {
  const sorted = [...amounts].sort((a, b) => b - a);
  const weights = [1, 0.6, 0.4, 0.25, 0.15];
  return sorted.reduce((sum, a, i) => sum + a * (weights[i] ?? 0.1), 0);
}

/** Per-channel mild cap (cozy by design). */
const CAP: Record<DishChannel, number> = {
  nourishment: 12, comfort: 12, warmth: 10, freshness: 10, diversity: 4,
};

/** How each technique turns the raw properties into boons.
 *  nourish/comfort scale the summed properties; warmth is a fraction of the
 *  nourishment (only HOT food warms); fresh only pays off cold (assemble). */
const TECH: Record<CookTechnique, {
  form: string; nourish: number; comfort: number; warmth: number; fresh: number;
}> = {
  simmer:   { form: "Stew",  nourish: 1.2, comfort: 0.8, warmth: 0.6, fresh: 0 },
  fry:      { form: "Fry",   nourish: 1.0, comfort: 1.1, warmth: 0.2, fresh: 0 },
  roast:    { form: "Roast", nourish: 1.0, comfort: 1.4, warmth: 0.4, fresh: 0 },
  assemble: { form: "Board", nourish: 0.6, comfort: 1.0, warmth: 0,   fresh: 1.2 },
  preserve: { form: "Ration", nourish: 1.0, comfort: 0.6, warmth: 0,  fresh: 0 },
};

/** An order- AND quantity-independent id for a dish (technique + which
 *  ingredients), so a dish is one recipe whatever the amounts. */
export function dishIdFor(technique: CookTechnique, ingredientIds: string[]): string {
  const key = [...new Set(ingredientIds.filter(Boolean))].sort().join("+");
  return `dish_${technique}_${key}`;
}

/** Trim to at most MAX_PER_INGREDIENT of each id, dropping empties. */
export function clampIngredients(ingredientIds: string[]): string[] {
  const seen = new Map<string, number>();
  const out: string[] = [];
  for (const id of ingredientIds) {
    if (!id) continue;
    const n = seen.get(id) ?? 0;
    if (n >= MAX_PER_INGREDIENT) continue;
    seen.set(id, n + 1);
    out.push(id);
  }
  return out;
}

const ADJ: Partial<Record<DishChannel, string>> = {
  nourishment: "Hearty", comfort: "Comforting", warmth: "Warming", freshness: "Fresh",
};

export function cook(technique: CookTechnique, ingredientIds: string[]): DishResult {
  const notes: string[] = [];
  const ids = clampIngredients(ingredientIds);
  if (ids.length === 0) return { name: "Empty Pot", effects: [], quality: "plain", notes: ["Nothing in the pot."] };

  const roles = new Set<string>();
  const nourishParts: number[] = [], comfortParts: number[] = [], freshParts: number[] = [];
  let amplify = 0;
  for (const id of ids) {
    const ing = getFoodIngredient(id);
    if (!ing) continue;
    roles.add(ing.role);
    if (ing.amplify) amplify += ing.amplify;
    if (ing.nourish) nourishParts.push(ing.nourish);
    if (ing.comfort) comfortParts.push(ing.comfort);
    if (ing.fresh) freshParts.push(ing.fresh);
  }

  // The base lever: a dish with substance (protein/veg/fruit/dairy) but no
  // staple comes out thin — "a snack, not a proper meal".
  const wantsMeal = roles.has("protein") || roles.has("veg") || roles.has("fruit") || roles.has("dairy");
  const thin = wantsMeal && !roles.has("staple");
  const mealScale = thin ? 0.7 : 1;
  if (thin) notes.push("A snack, not a proper meal — it wants some grain or bread.");
  if (amplify > 0) notes.push(`Spices lift it (+${Math.round(amplify * 100)}%).`);

  const t = TECH[technique];
  const boost = mealScale * (1 + amplify);
  const nourish = diminish(nourishParts) * t.nourish * boost;
  const comfort = diminish(comfortParts) * t.comfort * boost;
  const warmth = nourish * t.warmth; // hot food warms in proportion to how hearty it is
  const fresh = diminish(freshParts) * t.fresh * boost;
  // Breadth: eating across several shelves is its own small delight.
  const diversity = Math.max(0, roles.size - 2);

  const raw: Record<DishChannel, number> = { nourishment: nourish, comfort, warmth, freshness: fresh, diversity };
  const effects: DishEffect[] = [];
  for (const ch of Object.keys(raw) as DishChannel[]) {
    const amount = Math.min(CAP[ch], Math.round(raw[ch] * 10) / 10);
    if (amount > 0) effects.push({ channel: ch, amount });
  }
  effects.sort((a, b) => b.amount - a.amount);

  const quality: DishResult["quality"] = effects.length === 0 ? "plain" : thin ? "rough" : "fine";
  return { name: nameDish(technique, effects, quality), effects, quality, notes };
}

function nameDish(technique: CookTechnique, effects: DishEffect[], quality: DishResult["quality"]): string {
  if (effects.length === 0) return "Watery Pot";
  const dominant = effects.find((e) => ADJ[e.channel]) ?? effects[0];
  const adj = ADJ[dominant.channel] ?? "Curious";
  const roughPrefix = quality === "rough" ? "Thin " : "";
  return `${roughPrefix}${adj} ${TECH[technique].form}`;
}
