// ─── Free-form cooking — the pantry (real game foods) ──────────────────────
// Phase B: mapped onto the REAL economy. Bodies are FoodItemTypes from the
// larder (frontend data/foods.ts) + a couple of resources (honey, bone); the
// spice shelf is the culinary herb (lavender) + honey + the trade spices that
// arrive via merchants (saffron/cinnamon/long pepper).
// See docs/IDEAS.md (Kitchen).
// FOOD-SUBCATEGORY PASS LANDED (2026-08-07). The generic `meat`/`fish`/
// `berries`/`mushrooms` rows are GONE, replaced by the real split cuts, because
// the economy now sources every one of them (pens cull per-animal, the hunting
// camp's seasonal basket, the boar hunt, the wisent haul, the fishing basket,
// the Salmon Run, the forager's seasonal picks). Keeping both would double-count
// on the shelf: `getCookIngredientQty("meat")` resolves the ALIAS (the sum of
// all cuts), so "Meat" and "Venison" would each show the same stock.
// Forgiveness now lives in FOOD_GROUPS (named_dishes.ts) instead: a stew asks
// for `any(redMeat)` and takes all six, while a dish may still demand `one("pork")`.
// Technique notes:
//  · `signature` is authorial intent only — the engine never reads it. It says
//    what an ingredient is FOR, not what it's limited to.
//  · `techniques` DOES bind: it lists the preps that make sense (see types.ts).
//    Added 2026-08-07 because the pantry would otherwise serve raw venison and
//    fried wheat. Blocks category errors, not experiments.
//  · Techniques are also TIER-gated by the kitchen itself (boil/chop/skewer at
//    camp, fry at village, roast at town), so the everyday cuts sit on camp
//    preps and the richer ones (pork→fry, wisent→roast) reward growing.

import type { FoodIngredient } from "./types.js";

// ── Prep sets ───────────────────────────────────────────────────────────────
// `chop` = NO FIRE in this engine, so anything that must be cooked leaves it
// off. Generous by default: we block category errors (raw flesh, raw grain,
// fried wheat), not odd-but-defensible experiments.
/** Flesh: cook it any way you like, but never served raw. Curing is period-true. */
const FLESH = ["boil", "skewer", "fry", "roast", "preserve"] as const;
/** Grain wants a pot or an oven. Raw grain is not food; fried grain is not a thing. */
const GRAIN = ["boil", "roast"] as const;
/** Fungi: cooked only (morels are outright dangerous raw), and they dry well. */
const FUNGI = ["boil", "skewer", "fry", "roast", "preserve"] as const;
/** Wild leaves: a salad, a quick wilt, or the pan. Nothing to roast or skewer. */
const LEAF = ["boil", "fry", "chop"] as const;
/** Soft fruit: raw, simmered, or put by. Too delicate to grill. */
const SOFT_FRUIT = ["boil", "chop", "preserve"] as const;

export const FOOD_INGREDIENTS: FoodIngredient[] = [
  // ── Staple (grain — the base) ──
  { id: "wheat", name: "Wheat", icon: "🌾", role: "staple", signature: "boil", nourish: 4, comfort: 2, flavors: ["hearty"], techniques: GRAIN, note: "The fine grain — bread and refinement." },
  { id: "barley", name: "Barley", icon: "🌿", role: "staple", signature: "boil", nourish: 4, comfort: 1, flavors: ["hearty"], techniques: GRAIN, note: "Plain grain, filling and humble." },

  // ── Protein · red meat + game (hunt, pens, the boar hunt, the wisent haul) ──
  { id: "venison", name: "Venison", icon: "🦌", role: "protein", signature: "skewer", nourish: 5, comfort: 3, flavors: ["hearty"], techniques: FLESH, note: "Lean deer from the treeline, the hunters' bread and butter." },
  { id: "boar", name: "Boar", icon: "🐗", role: "protein", signature: "skewer", nourish: 5, comfort: 3, flavors: ["hearty", "smoky"], techniques: FLESH, note: "Dark and rich, and it fought before it fed us." },
  { id: "wisent", name: "Wisent", icon: "🦬", role: "protein", signature: "roast", nourish: 6, comfort: 4, flavors: ["hearty"], techniques: FLESH, note: "A whole forest bison. This is a feast, not a supper." },
  { id: "pork", name: "Pork", icon: "🥓", role: "protein", signature: "fry", nourish: 5, comfort: 4, flavors: ["hearty", "smoky"], techniques: FLESH, note: "The fat renders down and makes everything else taste better." },
  { id: "mutton", name: "Mutton", icon: "🐑", role: "protein", signature: "boil", nourish: 4, comfort: 3, flavors: ["hearty"], techniques: FLESH, note: "Strong stuff. Wants a long, slow pot and patience." },
  { id: "goat", name: "Goat", icon: "🐐", role: "protein", signature: "boil", nourish: 4, comfort: 2, flavors: ["hearty"], techniques: FLESH, note: "Lean and stubborn, alive and in the pot both." },

  // ── Protein · poultry ──
  { id: "chicken", name: "Chicken", icon: "🍗", role: "protein", signature: "boil", nourish: 3, comfort: 3, flavors: ["hearty"], techniques: FLESH, note: "Modest, quick, and always to hand." },
  { id: "wild_fowl", name: "Wild Fowl", icon: "🦆", role: "protein", signature: "skewer", nourish: 3, comfort: 3, flavors: ["hearty", "smoky"], techniques: FLESH, note: "Duck and pigeon off the marsh line." },
  { id: "rabbit", name: "Rabbit", icon: "🐰", role: "protein", signature: "boil", nourish: 3, comfort: 2, fresh: 1, flavors: ["fresh", "hearty"], techniques: FLESH, note: "Small and lean. It takes two to make a meal." },

  // ── Protein · fish (the hut's basket, the eel run, the Salmon Run) ──
  { id: "trout", name: "Trout", icon: "🐟", role: "protein", signature: "skewer", nourish: 3, comfort: 2, fresh: 2, flavors: ["fresh"], techniques: FLESH, note: "River-bright and delicate. Best eaten the day it is caught." },
  { id: "pike", name: "Pike", icon: "🐠", role: "protein", signature: "boil", nourish: 4, comfort: 2, flavors: ["hearty"], techniques: FLESH, note: "A big bony predator. Worth the picking." },
  { id: "eel", name: "Eel", icon: "🐍", role: "protein", signature: "skewer", nourish: 4, comfort: 3, flavors: ["smoky", "hearty"], techniques: FLESH, note: "Fatty and dark. It smokes beautifully, and it keeps." },
  { id: "salmon", name: "Salmon", icon: "🍥", role: "protein", signature: "skewer", nourish: 4, comfort: 3, fresh: 1, flavors: ["fresh", "smoky"], techniques: FLESH, note: "The autumn run, rich and prized. A season's worth in a single week." },

  // ── Protein · the rest ──
  { id: "eggs", name: "Eggs", icon: "🥚", role: "protein", signature: "fry", nourish: 3, comfort: 2, flavors: ["hearty"], techniques: ["boil", "fry", "roast"], note: "Binds and enriches a dish." },
  { id: "nuts", name: "Nuts", icon: "🌰", role: "protein", signature: "boil", nourish: 3, comfort: 1, flavors: ["hearty"], techniques: ["boil", "fry", "roast", "chop"], note: "Foraged, fat and keeping." },
  { id: "bone", name: "Bone", icon: "🦴", role: "protein", signature: "boil", nourish: 3, comfort: 1, flavors: ["hearty"], techniques: ["boil", "roast"], note: "Marrow for a long, rich broth." },

  // ── Veg (body; peas + fava are the early legumes) ──
  { id: "cabbages", name: "Cabbage", icon: "🥬", role: "veg", signature: "chop", nourish: 2, comfort: 1, fresh: 2, flavors: ["fresh"], techniques: ["boil", "fry", "roast", "chop", "preserve"], note: "Hardy leaf, good raw or cooked." },
  { id: "turnips", name: "Turnips", icon: "🥕", role: "veg", signature: "boil", nourish: 3, comfort: 1, flavors: ["hearty"], techniques: ["boil", "fry", "roast", "chop", "skewer", "preserve"], note: "Earthy root, keeps the pot honest." },
  { id: "squash", name: "Gourd", icon: "🎃", role: "veg", signature: "roast", nourish: 3, comfort: 2, flavors: ["sweet"], techniques: ["boil", "fry", "roast", "chop"], note: "Sweetens as it cooks down." },
  { id: "peas", name: "Peas", icon: "🫛", role: "veg", signature: "boil", nourish: 3, comfort: 1, flavors: ["fresh"], techniques: ["boil", "fry", "chop"], note: "Legume — pease porridge hot or cold." },
  { id: "fava", name: "Fava Beans", icon: "🫘", role: "veg", signature: "boil", nourish: 3, comfort: 1, flavors: ["hearty"], techniques: ["boil", "fry"], note: "Broad beans — early protein before the herd." },

  // ── Veg · mushrooms (the forager's seasonal picks + the rain flush) ──
  { id: "field_mushroom", name: "Field Mushroom", icon: "🍄", role: "veg", signature: "fry", nourish: 2, comfort: 2, flavors: ["hearty"], techniques: FUNGI, note: "Common as grass, and still good in the pan." },
  { id: "morel", name: "Morel", icon: "🍄", role: "veg", signature: "fry", nourish: 2, comfort: 3, flavors: ["hearty"], techniques: FUNGI, note: "Spring's honeycomb prize. Never eaten raw." },
  { id: "chanterelle", name: "Chanterelle", icon: "🍄", role: "veg", signature: "fry", nourish: 2, comfort: 3, fresh: 1, flavors: ["hearty", "fresh"], techniques: FUNGI, note: "Golden, and faintly of apricots. The forager's reward." },
  { id: "cepe", name: "King Bolete", icon: "🍄", role: "veg", signature: "fry", nourish: 3, comfort: 4, flavors: ["hearty"], techniques: FUNGI, note: "The king of the wood. Thick, nutty, and hoarded." },

  // ── Veg · wild greens + roots (foraged, mostly spring and summer) ──
  { id: "dandelion", name: "Dandelion", icon: "🌼", role: "veg", signature: "chop", nourish: 1, comfort: 1, fresh: 3, flavors: ["fresh"], techniques: LEAF, note: "Bitter leaves from the yard's edge. Better than it sounds, and better than nothing." },
  { id: "sorrel", name: "Sorrel", icon: "🌿", role: "veg", signature: "chop", nourish: 1, comfort: 1, fresh: 3, flavors: ["fresh"], techniques: LEAF, note: "Sharp and lemony. It wakes up a dull pot." },
  { id: "ramsons", name: "Ramsons", icon: "🧄", role: "veg", signature: "chop", nourish: 1, comfort: 2, fresh: 2, amplify: 0.1, flavors: ["fresh"], techniques: LEAF, note: "Wild garlic from the spring woods. It lifts whatever it touches." },
  { id: "wild_carrot", name: "Wild Carrot", icon: "🥕", role: "veg", signature: "boil", nourish: 2, comfort: 1, fresh: 1, flavors: ["hearty"], techniques: ["boil", "fry", "roast", "chop", "skewer"], note: "A thin, pale root. Sweeter than it looks." },

  // ── Fruit (sweet) ──
  { id: "apples", name: "Apples", icon: "🍎", role: "fruit", signature: "chop", nourish: 1, comfort: 3, fresh: 3, flavors: ["sweet"], techniques: ["boil", "fry", "roast", "chop", "preserve"], note: "Crisp and cheering." },
  { id: "pears", name: "Pears", icon: "🍐", role: "fruit", signature: "chop", nourish: 1, comfort: 3, fresh: 2, flavors: ["sweet"], techniques: ["boil", "fry", "roast", "chop", "preserve"], note: "Soft, honeyed." },
  { id: "cherries", name: "Cherries", icon: "🍒", role: "fruit", signature: "chop", nourish: 1, comfort: 4, fresh: 2, flavors: ["sweet"], techniques: ["boil", "roast", "chop", "preserve"], note: "Bright and tart, a summer joy." },
  { id: "strawberries", name: "Strawberries", icon: "🍓", role: "fruit", signature: "chop", nourish: 1, comfort: 4, fresh: 3, flavors: ["sweet"], techniques: SOFT_FRUIT, note: "Fleeting early-summer sweetness." },
  // Wild berries (foraged) — strawberries above stay a CULTIVATED fruit and are
  // deliberately not in the `berry` group.
  { id: "blackberry", name: "Blackberry", icon: "🫐", role: "fruit", signature: "chop", nourish: 1, comfort: 3, fresh: 2, flavors: ["sweet"], techniques: SOFT_FRUIT, note: "Hedgerow-dark and seedy, paid for in scratched arms." },
  { id: "blueberry", name: "Blueberry", icon: "🫐", role: "fruit", signature: "chop", nourish: 1, comfort: 3, fresh: 3, flavors: ["sweet"], techniques: SOFT_FRUIT, note: "Small, sweet, and blue to the fingers." },
  { id: "raspberry", name: "Raspberry", icon: "🫐", role: "fruit", signature: "chop", nourish: 1, comfort: 4, fresh: 3, flavors: ["sweet"], techniques: SOFT_FRUIT, note: "Soft and tart, and gone in a day." },

  // ── Dairy (enriches, bakes) ──
  { id: "milk", name: "Milk", icon: "🥛", role: "dairy", signature: "boil", nourish: 2, comfort: 3, flavors: ["sweet"], techniques: ["boil"], note: "Enriches and softens." },

  // ── Spice (catalyst — honey + the culinary herb + trade spices) ──
  { id: "honey", name: "Honey", icon: "🍯", role: "spice", signature: "boil", amplify: 0.2, comfort: 1, flavors: ["sweet"], techniques: ["boil", "fry", "roast", "chop"], note: "Sweetens and rounds it out." },
  { id: "lavender", name: "Lavender", icon: "💜", role: "spice", signature: "chop", amplify: 0.15, fresh: 1, flavors: ["fresh"], techniques: ["boil", "roast", "chop"], note: "Fragrant blooms — teas and honey-cakes." },
  // Trade spices — arrive via merchants (Zah'kari, Meridian), not grown here.
  { id: "saffron", name: "Saffron", icon: "🧡", role: "spice", signature: "boil", amplify: 0.3, flavors: ["spicy"], techniques: ["boil", "fry", "roast"], note: "Precious threads, a golden luxury (a trade spice)." },
  { id: "cinnamon", name: "Cinnamon", icon: "🟤", role: "spice", signature: "boil", amplify: 0.2, comfort: 1, flavors: ["spicy"], techniques: ["boil", "fry", "roast"], note: "A far-traded bark, sweet and warming (a trade spice)." },
  { id: "long_pepper", name: "Long Pepper", icon: "🌶️", role: "spice", signature: "boil", amplify: 0.2, flavors: ["spicy"], techniques: ["boil", "fry", "roast"], note: "A warming bite that lifts a dish (a trade spice)." },
];

const BY_ID = new Map(FOOD_INGREDIENTS.map((i) => [i.id, i]));
export const getFoodIngredient = (id: string): FoodIngredient | undefined => BY_ID.get(id);
export const foodByRole = (role: FoodIngredient["role"]) => FOOD_INGREDIENTS.filter((i) => i.role === role);

/** May this ingredient be prepared this way? (No `techniques` list = anything.) */
export function allowsTechnique(id: string, technique: string): boolean {
  const t = BY_ID.get(id)?.techniques;
  return !t || (t as readonly string[]).includes(technique);
}
