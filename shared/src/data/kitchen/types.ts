// ─── Free-form cooking — types ──────────────────────────────────────────────
// Sibling to the alchemy engine (see ../alchemy/types.ts). A DISH is cooked with
// ONE technique (you simmer the whole pot) over a handful of ingredients; the
// technique shapes WHICH mild boons come out. See docs/DESIGN_KITCHEN.md.

/** The pantry shelf an ingredient sits on (its cooking role). */
export type FoodRole = "staple" | "protein" | "veg" | "fruit" | "dairy" | "spice";

/** How an ingredient is PREPARED (per-ingredient, like alchemy: roast the meat,
 *  boil the staple, combine). Heat methods gate by kitchen LEVEL — boil (Lv1) →
 *  fry (Lv2) → roast (Lv3); chop gates on the cutting-board TOOL (raw prep, no
 *  heat); preserve is a later town method. */
export type CookTechnique = "boil" | "fry" | "roast" | "chop" | "preserve";

/** One prepared ingredient going into the dish. */
export interface CookPlacement {
  ingredientId: string;
  technique: CookTechnique;
}

/** Mild, cozy boon channels — never combat stats (house rule: mild food). */
export type DishChannel = "nourishment" | "comfort" | "warmth" | "freshness" | "diversity";

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

export interface DishResult {
  name: string;
  effects: DishEffect[];
  quality: "fine" | "rough" | "plain";
  notes: string[];
}
