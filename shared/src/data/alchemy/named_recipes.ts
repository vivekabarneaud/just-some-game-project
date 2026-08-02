// ─── Named recipes — the curated combos the settlement already knows ─────────
// The design's "fixed recipes = pre-known cards inside the free-form system":
// each is a specific set of placements with a lore name. When the desk's current
// placements match one (order-independent), the brew takes the lore name instead
// of a generated one, and the recipe book shows them as pre-known cards. Their
// EFFECTS still come from brewing the placements (single source of truth), so a
// named recipe is just a blessed, named shortcut — not a separate effect system.

import type { Placement } from "./types.js";
import { recipeIdFor } from "./brew.js";

export interface NamedRecipe {
  name: string;
  icon: string;
  placements: Placement[];
  note: string;
}

const P = (ingredientId: string, technique: Placement["technique"]): Placement => ({ ingredientId, technique });

export const NAMED_RECIPES: NamedRecipe[] = [
  // Camp-tier (boil + crush only) — the early cures.
  {
    name: "Bitterroot Tonic", icon: "🍶", note: "Cools a fever from aching bones.",
    placements: [P("willowbark", "boil"), P("chamomile", "crush")],
  },
  {
    name: "Woundwort Salve", icon: "🩹", note: "Staunches a bad cut.",
    placements: [P("yarrow", "crush"), P("chamomile", "crush")],
  },
  {
    name: "Knitbone Poultice", icon: "🌿", note: "Eases a wrenched back.",
    placements: [P("comfrey", "crush"), P("chamomile", "crush")],
  },
  {
    name: "Sharp-Mind Tonic", icon: "🧠", note: "Whets a caster's wits.",
    placements: [P("mugwort", "boil"), P("chamomile", "crush")],
  },
  {
    name: "Herbal Antidote", icon: "🧪", note: "Draws out the fen's slow venom or a poison.",
    placements: [P("fenbalm", "crush"), P("chamomile", "crush")],
  },
  {
    name: "Boar's-Bane Salve", icon: "🐗", note: "Crushed tusk draws the froth out of a rabid bite.",
    placements: [P("tusk_shard", "crush"), P("chamomile", "crush")],
  },
  // Village-tier and beyond (the steeping pot / still unlock the finer medicine).
  {
    name: "Fever Tonic", icon: "🍵", note: "Breaks a winter chill or a fen-ague.",
    placements: [P("feverfew", "steep"), P("chamomile", "steep")],
  },
  {
    name: "Settling Draught", icon: "🥤", note: "Settles the summer gripe.",
    placements: [P("wildmint", "steep"), P("chamomile", "steep")],
  },
  {
    name: "Calming Draught", icon: "🌙", note: "Steadies the nerves and clears the mind.",
    placements: [P("lavender", "steep"), P("chamomile", "steep")],
  },
  {
    name: "Deep-Cough Draught", icon: "🫖", note: "Edda's remedy for a cough gone to the chest.",
    placements: [P("fenbalm", "boil"), P("feverfew", "steep"), P("honey", "steep")],
  },
];

/** Precomputed recipe id → named recipe, for O(1) matching. */
const BY_ID = new Map(NAMED_RECIPES.map((r) => [recipeIdFor(r.placements), r]));

/** The named recipe a set of placements matches (order-independent), or undefined. */
export function matchNamedRecipe(placements: Placement[]): NamedRecipe | undefined {
  return BY_ID.get(recipeIdFor(placements));
}

export function namedRecipeId(r: NamedRecipe): string {
  return recipeIdFor(r.placements);
}
