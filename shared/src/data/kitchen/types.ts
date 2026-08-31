import type { FoodPreference } from "../adventurers.js";
// ─── Free-form cooking — types ──────────────────────────────────────────────
// Sibling to the alchemy engine (see ../alchemy/types.ts). A DISH is cooked with
// ONE technique (you simmer the whole pot) over a handful of ingredients; the
// technique shapes WHICH mild boons come out. See docs/IDEAS.md (Kitchen).

/** The pantry shelf an ingredient sits on (its cooking role). */
export type FoodRole = "staple" | "protein" | "veg" | "fruit" | "dairy" | "spice";

/** How an ingredient is PREPARED (per-ingredient, like alchemy: roast the meat,
 *  boil the staple, combine). Gated by settlement tier: boil + chop + skewer at
 *  camp, fry at village, roast at town; preserve is a later town method. */
export type CookTechnique = "boil" | "skewer" | "fry" | "roast" | "chop" | "preserve";

/** Taste tags — a dish's taste emerges from its ingredients (weighted by amount)
 *  + its prep (skewer→smoky, chop→fresh). Matches an adventurer's foodPreference
 *  for the "❤ favourite" bonus, same as the fixed foods. */
/** Same five tags as an adventurer's FoodPreference — one union, so a new
 *  flavour can never exist on a dish but not on a palate. */
export type FoodFlavor = FoodPreference;

/** One prepared ingredient going into the dish. */
export interface CookPlacement {
  ingredientId: string;
  technique: CookTechnique;
}

/** Mild, cozy boon channels — never combat stats (house rule: mild food).
 *  Variety is NOT a channel: a spread of different ingredients acts like a hidden
 *  catalyst that lifts every boon (see cook()), so the player sees the numbers
 *  grow without a "diversity" line. */
export type DishChannel = "nourishment" | "comfort" | "warmth" | "freshness";

export interface DishEffect {
  channel: DishChannel;
  amount: number;
}

/** A pantry ingredient. Base properties are small; the technique + diminishing
 *  returns + caps turn them into the final boons. `amplify` marks a catalyst
 *  (spices) that boosts the rest instead of adding a line of its own. */
export interface FoodIngredient {
  id: string;
  name: string;
  icon: string;
  role: FoodRole;
  /** The natural way to prepare it (defaults the technique when picked). */
  signature?: CookTechnique;
  /** Which preps make sense for this ingredient. Omitted = all of them.
   *  Not a difficulty knob: it exists so the pantry can't produce nonsense
   *  (raw meat, raw grain, fried wheat). `chop` means NO FIRE in this engine
   *  (see the Forager's Board), so anything that must be cooked simply leaves
   *  `chop` off its list. Be generous here — the kitchen is a sandbox, and the
   *  point is to block category errors, not to prune odd-but-defensible ideas. */
  techniques?: readonly CookTechnique[];
  /** Taste tags this ingredient carries (weighted by amount into the dish). */
  flavors?: FoodFlavor[];
  /** How filling. */
  nourish?: number;
  /** How pleasurable a mouthful. */
  comfort?: number;
  /** Raw crispness — only pays off when assembled cold. */
  fresh?: number;
  /** Catalyst boost (fraction, e.g. 0.2), spices only. */
  amplify?: number;
  /** A one-line pantry note for the card. */
  note: string;
}

/** A discovered dish, stored in the cookbook (mirrors StoredAlchemyRecipe). */
export interface StoredDish {
  id: string;
  name: string;
  placements: CookPlacement[];
  effects: DishEffect[];
  quality: "plain" | "rough" | "fine" | "seasoned";
  discoveredDay: number;
}

export interface DishResult {
  name: string;
  effects: DishEffect[];
  /** plain (nothing), rough (thin — no staple), fine (a proper meal), seasoned
   *  (fine + a seasoning/aromatic — a notch better). Cosmetic + a small boon via
   *  the spice's amplify; never a min-max obligation. */
  quality: "plain" | "rough" | "fine" | "seasoned";
  notes: string[];
}
