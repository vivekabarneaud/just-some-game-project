// ─── Free-form alchemy — core types ─────────────────────────────────────────
// The emergent brew engine (see docs/DESIGN_APOTHECARY.md). A player places
// ingredients (grabbed from ROLE shelves) onto TECHNIQUE stations; each
// ingredient contributes effects KEYED BY its technique; the brew is the summed,
// capped profile. This file is the vocabulary; brew.ts is the engine.

/** How an ingredient is prepared — the lab station. Decides which of its effects
 *  come out, and (via the effect's shape) whether the result is sustained/burst. */
export type Technique = "crush" | "boil" | "steep" | "dry" | "distil" | "char" | "ferment";

/** Pantry shelf — organization + soft balance (a brew wants a base). */
export type Role = "base" | "hero" | "catalyst" | "toxin" | "wildcard";

/** What an effect DOES — grounded in real stats + real ailments (no fuzzy words).
 *  Kept as a flat string union so the engine can sum by channel and the UI can
 *  label each one. */
export type EffectChannel =
  // Attribute buffs (combat)
  | "str" | "dex" | "int" | "vit" | "wis"
  // Sub-stats (combat)
  | "crit" | "accuracy" | "dodge" | "parry" | "initiative" | "mobility" | "presence" | "luck"
  // Buff shapes
  | "damage_pct" | "defense_pct"
  // Healing / recovery
  | "heal_hp"            // HP restored (instant if shape burst/instant, per-turn if sustained)
  | "ease_fever"         // speeds/cures the fever line (chill / ague / deep-cough)
  | "ease_gut"           // summer gripe
  | "ease_wound"         // cut / wrenched back / bleed
  | "general_recovery"   // a little off any ailment / +regen
  | "happiness"          // settlement morale
  // Condition cures — clear a lingering adventurer condition outright
  | "cure_bleed" | "cure_poison" | "cure_venom" | "cure_froth"
  // Resistances (per damage school; "undead" = vs hollow/undead damage)
  | "resist_fire" | "resist_frost" | "resist_lightning" | "resist_aether"
  | "resist_light" | "resist_hollow" | "resist_nature" | "resist_undead"
  | "resist_confuse"
  // Offensive (toxin output)
  | "poison" | "weaken" | "slow" | "confuse"
  | "aoe_fire" | "aoe_frost"
  // Modifiers (catalyst) — handled specially by the engine, not summed as output
  | "amplify"            // ×(1+amount) on every other effect in the brew
  | "extend";            // +amount rounds on every timed effect

/** Sustained = whole fight / regen over turns; burst = a few strong rounds;
 *  instant = one-shot now; topical = an applied poultice (wounds). */
export type EffectShape = "sustained" | "burst" | "instant" | "topical";

export interface Effect {
  channel: EffectChannel;
  amount: number;
  shape?: EffectShape;   // default "sustained"
  rounds?: number;       // for burst/timed effects
}

export interface Ingredient {
  id: string;            // matches a herb/resource id where possible (chamomile, honey…)
  name: string;
  icon: string;
  role: Role;
  /** Effects produced under each technique. A technique absent here yields only a
   *  faint generic effect (see brew.ts) — "you wasted it, but not entirely". */
  techniques: Partial<Record<Technique, Effect[]>>;
  /** The plant's classic/identity prep (the ⭐ in the design doc). Display only. */
  signature: Technique;
  note?: string;
}

/** One ingredient placed on one station. */
export interface Placement {
  ingredientId: string;
  technique: Technique;
}

/** The engine's output: a summed, capped effect profile + narrative flags. */
export interface BrewResult {
  effects: Effect[];        // final, merged, capped
  name: string;             // generated (or a matched named recipe, later)
  quality: "fine" | "rough" | "dubious";  // dubious = heroes with no base, etc.
  notes: string[];          // human hints ("harsh — needs a base", "honey amplified…")
}

/** A discovered recipe saved to the player's book. Its `id` is the deterministic
 *  recipeIdFor(placements), so re-brewing the same combo re-finds the same card
 *  and stacks in the inventory. Stored in state.alchemyRecipes; a brewed potion
 *  in inventory uses this id as its itemId. */
export interface StoredAlchemyRecipe {
  id: string;
  name: string;
  placements: Placement[];
  effects: Effect[];
  quality: BrewResult["quality"];
  /** World-day the player first brewed it (for the book; set by the caller). */
  discoveredDay?: number;
}
