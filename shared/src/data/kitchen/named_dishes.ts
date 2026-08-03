// ─── Named dishes — the curated combos the settlement knows ─────────────────
// A named dish is a set of SLOTS: each slot is a prep (technique) + the
// ingredient(s) that fill it. A slot can be a single ingredient (a signature
// dish — "a ham needs pork") or an `anyOf` list (a forgiving dish — "a stew
// takes any red meat"). This is what lets the meat-split feel good: substitute
// freely where it doesn't matter, demand the real thing where it does.
//
// A named dish has its OWN stable id, so every variant (venison stew, pork stew)
// stacks under the one name. Effects still come from cook() (single source of
// truth); the name is a blessed label on a matching pot.

import type { CookPlacement, CookTechnique } from "./types.js";

/** Ingredient groups, so a slot can say "any red meat" without repetition. */
export const FOOD_GROUPS = {
  redMeat: ["venison", "pork"],
  anyMeat: ["venison", "pork", "chicken"],
  grain: ["wheat", "barley", "oats", "rye", "bread"],
  berry: ["berries"],
} as const;

/** A slot the pot must fill: one ingredient from `anyOf`, prepared `technique`. */
export interface DishSlot {
  anyOf: readonly string[];
  technique: CookTechnique;
}

export interface NamedDish {
  id: string;
  name: string;
  icon: string;
  slots: DishSlot[];
  note: string;
}

const one = (ingredientId: string, technique: CookTechnique): DishSlot => ({ anyOf: [ingredientId], technique });
const any = (anyOf: readonly string[], technique: CookTechnique): DishSlot => ({ anyOf, technique });

export const NAMED_DISHES: NamedDish[] = [
  // ── Tier-1 staples (forgiving where it makes sense) ──
  { id: "dish_porridge", name: "Porridge", icon: "🥣",
    slots: [any(FOOD_GROUPS.grain, "boil")],
    note: "Plain boiled grain, warm and filling — the daily staple." },
  { id: "dish_hearth_stew", name: "Hearth Stew", icon: "🍲",
    slots: [any(FOOD_GROUPS.redMeat, "boil"), one("nuts", "boil")],
    note: "Red meat and nuts simmered slow — keeps the table full through a hard week." },
  { id: "dish_river_stew", name: "River Stew", icon: "🍲",
    slots: [one("fish", "boil"), any(FOOD_GROUPS.berry, "boil")],
    note: "Fish and foraged berries in a thin, honest broth." },
  { id: "dish_bone_broth", name: "Bone Broth", icon: "🍜",
    slots: [one("bone", "boil")],
    note: "Bones simmered long into a rich, marrowy broth. Nothing goes to waste." },

  // ── Discoverable dishes ──
  { id: "dish_harvest_roast", name: "Harvest Roast", icon: "🍖",
    slots: [any(FOOD_GROUPS.redMeat, "roast"), one("gourd", "roast"), any(FOOD_GROUPS.grain, "boil")],
    note: "Roast meat and sweet gourd with a grain on the side — a small feast." },
  { id: "dish_summer_board", name: "Summer Board", icon: "🧀",
    slots: [one("cheese", "chop"), one("apple", "chop"), one("cabbage", "chop")],
    note: "A cold board of cheese, crisp apple and leaf — welcome on a hot day." },
  { id: "dish_berry_pottage", name: "Berry Pottage", icon: "🥣",
    slots: [any(FOOD_GROUPS.grain, "boil"), one("berries", "boil"), one("honey", "boil")],
    note: "Grain and foraged berries simmered sweet — a warming breakfast." },
  { id: "dish_fishermans_fry", name: "Fisherman's Fry", icon: "🍳",
    slots: [one("fish", "fry"), one("eggs", "fry")],
    note: "Fish and eggs quick in the pan — humble and filling." },

  // ── A signature that demands its meat (the "only one type" case) ──
  { id: "dish_honeyed_ham", name: "Honeyed Ham", icon: "🍖",
    slots: [one("pork", "roast"), one("honey", "boil")],
    note: "Pork roasted and glazed with honey — a feast-day joint, and only pork will do." },
];

/** The distinct (ingredient, technique) pairs in a pot — quantity-independent. */
function distinctPairs(placements: CookPlacement[]): CookPlacement[] {
  const seen = new Set<string>();
  const out: CookPlacement[] = [];
  for (const p of placements) {
    if (!p.ingredientId) continue;
    const k = `${p.ingredientId}:${p.technique}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ ingredientId: p.ingredientId, technique: p.technique });
  }
  return out;
}

/** Can these pot pairs fill exactly these slots (a one-to-one matching)? */
function fills(pairs: CookPlacement[], slots: DishSlot[]): boolean {
  if (pairs.length !== slots.length) return false;
  const used = new Array(slots.length).fill(false);
  const assign = (i: number): boolean => {
    if (i === pairs.length) return true;
    for (let s = 0; s < slots.length; s++) {
      if (used[s]) continue;
      if (slots[s].technique === pairs[i].technique && slots[s].anyOf.includes(pairs[i].ingredientId)) {
        used[s] = true;
        if (assign(i + 1)) return true;
        used[s] = false;
      }
    }
    return false;
  };
  return assign(0);
}

/** How specific a dish is (fewer accepted ingredients = more specific). Used to
 *  prefer a signature match over a generic one when a pot fits both. */
const specificity = (d: NamedDish) => d.slots.reduce((n, s) => n + s.anyOf.length, 0);

/** The named dish a pot matches (order/quantity independent, slots filled). When
 *  a pot fits more than one, the MORE SPECIFIC dish wins (a ham over a roast). */
export function matchNamedDish(placements: CookPlacement[]): NamedDish | undefined {
  const pairs = distinctPairs(placements);
  if (pairs.length === 0) return undefined;
  let best: NamedDish | undefined;
  for (const d of NAMED_DISHES) {
    if (fills(pairs, d.slots) && (!best || specificity(d) < specificity(best))) best = d;
  }
  return best;
}

export const namedDishId = (d: NamedDish): string => d.id;
