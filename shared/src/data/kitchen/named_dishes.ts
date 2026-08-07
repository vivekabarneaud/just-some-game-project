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

import type { CookPlacement, CookTechnique, DishResult } from "./types.js";
import { getFoodIngredient } from "./ingredients.js";
import { cook } from "./cook.js";

/** Ingredient groups, so a slot can say "any red meat" without repetition. */
// EXPANDED by the food-subcategory pass (2026-08-07): these used to resolve to
// the single generic "meat"/"fish"/"berries"/"mushrooms". Now they list the real
// cuts, and every dish written against a group accepted the split with no
// rewrite — exactly as this file was designed for.
export const FOOD_GROUPS = {
  /** The big, filling meats. A stew takes any of them. */
  redMeat: ["venison", "boar", "wisent", "pork", "mutton", "goat"],
  /** Birds. */
  poultry: ["chicken", "wild_fowl"],
  /** Wild-caught — what the hunters bring in, as opposed to what the pens give. */
  game: ["venison", "boar", "wisent", "rabbit", "wild_fowl"],
  /** Any flesh at all. */
  anyMeat: ["venison", "boar", "wisent", "pork", "mutton", "goat", "chicken", "wild_fowl", "rabbit"],
  fish: ["trout", "pike", "eel", "salmon"],
  grain: ["wheat", "barley"], // the real grains today (oats/rye come later)
  /** WILD berries only. Cultivated strawberries are their own thing. */
  berry: ["blackberry", "blueberry", "raspberry"],
  mushroom: ["field_mushroom", "morel", "chanterelle", "cepe"],
  /** Foraged leaves. Wild carrot is a root and sits with the veg instead. */
  greens: ["dandelion", "sorrel", "ramsons"],
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
  /** Shown in the cookbook from the start (the settlement already knows it).
   *  Others stay hidden until the player cooks the combo once (discovery). */
  preknown?: boolean;
}

const one = (ingredientId: string, technique: CookTechnique): DishSlot => ({ anyOf: [ingredientId], technique });
const any = (anyOf: readonly string[], technique: CookTechnique): DishSlot => ({ anyOf, technique });

export const NAMED_DISHES: NamedDish[] = [
  // ── Tier-1 staples (forgiving where it makes sense) ──
  { id: "dish_porridge", name: "Porridge", icon: "🥣", preknown: true,
    slots: [any(FOOD_GROUPS.grain, "boil")],
    note: "Plain boiled grain, warm and filling. The daily staple." },
  { id: "dish_hearth_stew", name: "Hearth Stew", icon: "🍲", preknown: true,
    slots: [any(FOOD_GROUPS.redMeat, "boil"), one("nuts", "boil")],
    note: "Meat and nuts simmered slow. Keeps the table full through a hard week." },
  { id: "dish_river_stew", name: "River Stew", icon: "🍲", preknown: true,
    slots: [any(FOOD_GROUPS.fish, "boil"), any(FOOD_GROUPS.berry, "boil")],
    note: "Fish and foraged berries in a thin, honest broth." },
  { id: "dish_bone_broth", name: "Bone Broth", icon: "🍜", preknown: true,
    slots: [one("bone", "boil")],
    note: "Bones simmered long into a rich, marrowy broth. Nothing goes to waste." },

  // ── Cold-weather comfort ──
  { id: "dish_harvest_roast", name: "Harvest Roast", icon: "🍖",
    slots: [any(FOOD_GROUPS.redMeat, "roast"), one("squash", "roast"), any(FOOD_GROUPS.grain, "boil")],
    note: "Roast meat and sweet gourd with a grain on the side. A small feast." },
  { id: "dish_ploughmans_broth", name: "Ploughman's Broth", icon: "🍲",
    slots: [any(FOOD_GROUPS.redMeat, "boil"), one("turnips", "boil"), any(FOOD_GROUPS.grain, "boil")],
    note: "Meat, root and grain in one honest pot. A humble winter keeper." },
  { id: "dish_shepherds_roast", name: "Shepherd's Roast", icon: "🍖",
    slots: [any(FOOD_GROUPS.redMeat, "roast"), one("turnips", "roast"), one("squash", "roast")],
    note: "Roast meat and roots, the 'we survived the week' dinner." },

  // ── Everyday & foraged ──
  { id: "dish_fishermans_fry", name: "Fisherman's Fry", icon: "🍳",
    slots: [any(FOOD_GROUPS.fish, "fry"), one("eggs", "fry")],
    note: "Fish and eggs quick in the pan. Humble and filling." },
  { id: "dish_mushroom_omelet", name: "Mushroom Omelet", icon: "🍳",
    slots: [one("eggs", "fry"), any(FOOD_GROUPS.mushroom, "fry")],
    note: "Eggs and mushrooms quick in the pan, a good morning." },
  { id: "dish_foragers_pot", name: "Forager's Pot", icon: "🍄",
    slots: [any(FOOD_GROUPS.mushroom, "boil"), one("nuts", "boil"), any(FOOD_GROUPS.grain, "boil")],
    note: "Mushroom, nuts and grain, a quiet-day meal from the woods." },
  { id: "dish_pease_porridge", name: "Pease Porridge", icon: "🥣",
    slots: [one("peas", "boil")],
    note: "Pease porridge hot, pease porridge cold. Humble and old." },
  { id: "dish_fava_mash", name: "Fava Mash", icon: "🫘",
    slots: [one("fava", "boil")],
    note: "Broad beans mashed soft. Peasant fare, before the herd." },

  // ── Sweet things ──
  { id: "dish_berry_pottage", name: "Berry Pottage", icon: "🥣",
    slots: [any(FOOD_GROUPS.grain, "boil"), any(FOOD_GROUPS.berry, "boil"), one("honey", "boil")],
    note: "Grain and foraged berries simmered sweet. A warming breakfast." },
  { id: "dish_wildberry_porridge", name: "Wildberry Porridge", icon: "🥣",
    slots: [any(FOOD_GROUPS.grain, "boil"), any(FOOD_GROUPS.berry, "boil"), one("nuts", "boil"), one("honey", "boil")],
    note: "Grain simmered with wild berries, nuts and honey. A treat of a breakfast." },
  { id: "dish_summer_fool", name: "Summer Fool", icon: "🍓",
    slots: [one("strawberries", "chop"), one("milk", "boil"), one("honey", "boil")],
    note: "Crushed strawberries folded through sweet cream. A fleeting summer joy." },
  { id: "dish_baked_apples", name: "Baked Apples", icon: "🍎",
    slots: [one("apples", "roast"), one("honey", "boil")],
    note: "Apples baked soft and honeyed, cozy on an autumn night." },
  { id: "dish_apple_pie", name: "Apple Pie", icon: "🥧",
    slots: [one("apples", "roast"), one("wheat", "roast"), one("honey", "boil")],
    note: "Apples baked in a wheat crust, sweet with honey." },
  { id: "dish_cherry_cobbler", name: "Cherry Cobbler", icon: "🥧",
    slots: [one("cherries", "roast"), one("wheat", "roast"), one("honey", "boil")],
    note: "Tart cherries under a sweet wheat crust." },

  // ── The grill (camp skewer — smoky) ──
  { id: "dish_skewered_game", name: "Skewered Game", icon: "🍢", preknown: true,
    slots: [any(FOOD_GROUPS.redMeat, "skewer")],
    note: "Meat grilled on a stick over the fire. The hunter's supper." },
  { id: "dish_grilled_catch", name: "Grilled Catch", icon: "🐟",
    slots: [any(FOOD_GROUPS.fish, "skewer")],
    note: "The day's catch charred over the coals, smoky and quick." },
  { id: "dish_charred_mushrooms", name: "Fire-Charred Mushrooms", icon: "🍄", preknown: true,
    slots: [any(FOOD_GROUPS.mushroom, "skewer")],
    note: "Mushrooms blistered on the fire. Humble, earthy, smoky." },
  { id: "dish_hunters_skewer", name: "Hunter's Skewer", icon: "🍢",
    slots: [any(FOOD_GROUPS.redMeat, "skewer"), any(FOOD_GROUPS.mushroom, "skewer"), one("turnips", "skewer")],
    note: "Meat, mushroom and root threaded on a stick and grilled. A real meal off the fire." },
  { id: "dish_honey_glazed_skewer", name: "Honey-Glazed Skewer", icon: "🍢",
    slots: [any(FOOD_GROUPS.redMeat, "skewer"), one("honey", "boil")],
    note: "Grilled meat brushed with warm honey. Sweet, smoky, a little indulgent." },

  // ── More boils ──
  { id: "dish_frumenty", name: "Frumenty", icon: "🥣",
    slots: [one("wheat", "boil"), one("milk", "boil"), one("honey", "boil")],
    note: "Wheat simmered soft in sweet milk. A creamy, comforting old dish." },
  { id: "dish_root_barley_pottage", name: "Root & Barley Pottage", icon: "🍲",
    slots: [one("turnips", "boil"), one("barley", "boil")],
    note: "Root and grain in an honest pot. Humble and warming." },
  { id: "dish_egg_broth", name: "Egg Broth", icon: "🍜",
    slots: [one("bone", "boil"), one("eggs", "boil")],
    note: "Egg stirred through a marrow broth. Restorative and rich." },

  // ── A cold board (chop — fresh) ──
  { id: "dish_foragers_board", name: "Forager's Board", icon: "🥬",
    slots: [one("cabbages", "chop"), one("apples", "chop"), one("nuts", "chop")],
    note: "Crisp leaf, apple and nuts, no fire needed. Cool and fresh." },

  // FUTURE (return when the ingredients exist — recorded in DESIGN_KITCHEN §9):
  //   Honeyed Ham   → needs the pork split
  //   Golden Fowl   → needs poultry (chicken) + saffron
  //   Marrow & Rye  → needs the rye grain
  //   Honey Oats    → needs the oats grain
  //   Summer/Orchard/Green boards → need cheese as a cook-with ingredient + wild mint
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

/** The dish a pot resolves to for DISPLAY / use: cook() for the boons, the named
 *  dish's name when it matches, and a quality FLOOR — a recognised named dish is
 *  a proper dish, so it never reads "thin/plain" (only unnamed experiments do). */
export function resolveDish(placements: CookPlacement[]): DishResult & { named: boolean } {
  const result = cook(placements);
  const named = matchNamedDish(placements);
  const quality: DishResult["quality"] =
    named && (result.quality === "rough" || result.quality === "plain") ? "fine" : result.quality;
  return { ...result, name: named?.name ?? result.name, quality, named: !!named };
}
