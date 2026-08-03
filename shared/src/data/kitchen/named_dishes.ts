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
import { getFoodIngredient } from "./ingredients.js";

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
    note: "Pork roasted and glazed with honey, a feast-day joint, and only pork will do." },

  // ── Cold-weather comfort ──
  { id: "dish_ploughmans_broth", name: "Ploughman's Broth", icon: "🍲",
    slots: [any(FOOD_GROUPS.redMeat, "boil"), one("turnip", "boil"), any(FOOD_GROUPS.grain, "boil")],
    note: "Meat, root and grain in one honest pot. A humble winter keeper." },
  { id: "dish_marrow_rye", name: "Marrow & Rye", icon: "🍜",
    slots: [one("bone", "boil"), one("rye", "boil")],
    note: "Marrow broth and dark bread. A woodcutter's meal against the cold." },
  { id: "dish_shepherds_roast", name: "Shepherd's Roast", icon: "🍖",
    slots: [any(FOOD_GROUPS.redMeat, "roast"), one("turnip", "roast"), one("gourd", "roast")],
    note: "Roast meat and roots, the 'we survived the week' dinner." },

  // ── High summer (cold, fresh boards) ──
  { id: "dish_orchard_board", name: "Orchard Board", icon: "🍐",
    slots: [one("apple", "chop"), one("pear", "chop"), one("cheese", "chop")],
    note: "Crisp fruit and cheese, cool and light on a hot day." },
  { id: "dish_green_table", name: "Green Table", icon: "🥬",
    slots: [one("cabbage", "chop"), one("wildmint", "chop"), one("cheese", "chop")],
    note: "Bright leaf and herb with a little cheese, barely cooked at all." },

  // ── Feast / luxury (saffron reads precious) ──
  { id: "dish_golden_fowl", name: "Golden Fowl", icon: "🍗",
    slots: [one("chicken", "roast"), one("saffron", "boil")],
    note: "Fowl roasted golden with saffron, a table set for a guest." },

  // ── Everyday & foraged ──
  { id: "dish_mushroom_omelet", name: "Mushroom Omelet", icon: "🍳",
    slots: [one("eggs", "fry"), one("mushroom", "fry")],
    note: "Eggs and mushrooms quick in the pan, a good morning." },
  { id: "dish_foragers_pot", name: "Forager's Pot", icon: "🍄",
    slots: [one("mushroom", "boil"), one("nuts", "boil"), any(FOOD_GROUPS.grain, "boil")],
    note: "Mushroom, nuts and grain, a quiet-day meal from the woods." },

  // ── Sweet things ──
  { id: "dish_wildberry_porridge", name: "Wildberry Porridge", icon: "🥣",
    slots: [any(FOOD_GROUPS.grain, "boil"), one("berries", "boil"), one("nuts", "boil"), one("honey", "boil")],
    note: "Grain simmered with wild berries, nuts and honey. A treat of a breakfast." },
  { id: "dish_baked_apples", name: "Baked Apples", icon: "🍎",
    slots: [one("apple", "roast"), one("honey", "boil")],
    note: "Apples baked soft and honeyed, cozy on an autumn night." },
  { id: "dish_honey_oats", name: "Honey Oats", icon: "🥣",
    slots: [one("oats", "boil"), one("honey", "boil")],
    note: "Oats and honey, a gentle start to the day." },
  { id: "dish_apple_pie", name: "Apple Pie", icon: "🥧",
    slots: [one("apple", "roast"), one("wheat", "roast"), one("honey", "boil")],
    note: "Apples baked in a wheat crust, sweet with honey." },
  { id: "dish_cherry_cobbler", name: "Cherry Cobbler", icon: "🥧",
    slots: [one("cherries", "roast"), one("oats", "roast"), one("honey", "boil")],
    note: "Tart cherries under a sweet oat crust." },
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

const isSpice = (id: string) => getFoodIngredient(id)?.role === "spice";
const slotIsSpice = (slot: DishSlot) => isSpice(slot.anyOf[0]);

/** Can EVERY slot be matched to a DISTINCT pair (each pair used at most once)?
 *  `exact` requires the counts to be equal (the body must be filled precisely);
 *  otherwise extra pairs are allowed (garnishes beyond required seasonings). */
function matchSlots(pairs: CookPlacement[], slots: DishSlot[], exact: boolean): boolean {
  if (exact && pairs.length !== slots.length) return false;
  if (pairs.length < slots.length) return false;
  const used = new Array(pairs.length).fill(false);
  const assign = (s: number): boolean => {
    if (s === slots.length) return true;
    for (let i = 0; i < pairs.length; i++) {
      if (used[i]) continue;
      if (slots[s].technique === pairs[i].technique && slots[s].anyOf.includes(pairs[i].ingredientId)) {
        used[i] = true;
        if (assign(s + 1)) return true;
        used[i] = false;
      }
    }
    return false;
  };
  return assign(0);
}

/** How specific a dish's ingredients are (fewer accepted = more specific). */
const breadth = (d: NamedDish) => d.slots.reduce((n, s) => n + s.anyOf.length, 0);

/** The named dish a pot matches. Body ingredients (non-spice) must fill the
 *  dish's body slots EXACTLY; required seasoning slots must be present; EXTRA
 *  seasonings are garnishes (they don't break the identity). When several match,
 *  the dish that claims the MOST ingredients as identity wins (so adding the
 *  right spice upgrades a plain roast into Golden Fowl), then the most specific. */
export function matchNamedDish(placements: CookPlacement[]): NamedDish | undefined {
  const pairs = distinctPairs(placements);
  if (pairs.length === 0) return undefined;
  const bodyPairs = pairs.filter((p) => !isSpice(p.ingredientId));
  const spicePairs = pairs.filter((p) => isSpice(p.ingredientId));
  let best: NamedDish | undefined;
  for (const d of NAMED_DISHES) {
    const bodySlots = d.slots.filter((s) => !slotIsSpice(s));
    const spiceSlots = d.slots.filter((s) => slotIsSpice(s));
    if (!matchSlots(bodyPairs, bodySlots, true)) continue;      // body must be exact
    if (!matchSlots(spicePairs, spiceSlots, false)) continue;   // required spices present, extras ok
    if (!best
      || d.slots.length > best.slots.length                    // claims more of the pot as identity
      || (d.slots.length === best.slots.length && breadth(d) < breadth(best))) {
      best = d;
    }
  }
  return best;
}

export const namedDishId = (d: NamedDish): string => d.id;
