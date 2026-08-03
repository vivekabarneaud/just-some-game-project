// ─── Named dishes — the tier-1 staples the settlement already knows ─────────
// Kept from the current fixed kitchen (the higher tiers were placeholders). Each
// is a specific technique + ingredient set with a lore name; when the desk's
// current pot matches one (order- and quantity-independent), the dish takes its
// name instead of a generated one, and the cookbook shows it as a known card.
// Their EFFECTS still come from cook() (single source of truth).

import type { CookTechnique } from "./types.js";
import { dishIdFor } from "./cook.js";

export interface NamedDish {
  name: string;
  icon: string;
  technique: CookTechnique;
  ingredientIds: string[];
  note: string;
}

export const NAMED_DISHES: NamedDish[] = [
  { name: "Porridge", icon: "🥣", technique: "simmer", ingredientIds: ["barley"],
    note: "Plain boiled grain, warm and filling — the daily staple." },
  { name: "Hearth Stew", icon: "🍲", technique: "simmer", ingredientIds: ["venison", "nuts"],
    note: "Meat and nuts simmered slow — keeps the table full through a hard week." },
  { name: "River Stew", icon: "🍲", technique: "simmer", ingredientIds: ["fish", "berries"],
    note: "Fish and foraged berries in a thin, honest broth." },
  { name: "Bone Broth", icon: "🍜", technique: "simmer", ingredientIds: ["bone"],
    note: "Bones simmered long into a rich, marrowy broth. Nothing goes to waste." },
];

const BY_ID = new Map(NAMED_DISHES.map((d) => [dishIdFor(d.technique, d.ingredientIds), d]));

/** The named dish a pot matches (technique + ingredients, order/quantity
 *  independent), or undefined. */
export function matchNamedDish(technique: CookTechnique, ingredientIds: string[]): NamedDish | undefined {
  return BY_ID.get(dishIdFor(technique, ingredientIds));
}

export const namedDishId = (d: NamedDish): string => dishIdFor(d.technique, d.ingredientIds);
