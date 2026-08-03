// ─── Named dishes — the tier-1 staples the settlement already knows ─────────
// Kept from the current fixed kitchen (the higher tiers were placeholders). Each
// is a specific set of prepared ingredients with a lore name; when the desk's
// current pot matches one (order- and quantity-independent), the dish takes its
// name instead of a generated one, and the cookbook shows it as a known card.
// Their EFFECTS still come from cook() (single source of truth).

import type { CookPlacement, CookTechnique } from "./types.js";
import { dishIdFor } from "./cook.js";

export interface NamedDish {
  name: string;
  icon: string;
  placements: CookPlacement[];
  note: string;
}

const P = (ingredientId: string, technique: CookTechnique): CookPlacement => ({ ingredientId, technique });

export const NAMED_DISHES: NamedDish[] = [
  { name: "Porridge", icon: "🥣", placements: [P("barley", "boil")],
    note: "Plain boiled grain, warm and filling — the daily staple." },
  { name: "Hearth Stew", icon: "🍲", placements: [P("venison", "boil"), P("nuts", "boil")],
    note: "Meat and nuts simmered slow — keeps the table full through a hard week." },
  { name: "River Stew", icon: "🍲", placements: [P("fish", "boil"), P("berries", "boil")],
    note: "Fish and foraged berries in a thin, honest broth." },
  { name: "Bone Broth", icon: "🍜", placements: [P("bone", "boil")],
    note: "Bones simmered long into a rich, marrowy broth. Nothing goes to waste." },
];

const BY_ID = new Map(NAMED_DISHES.map((d) => [dishIdFor(d.placements), d]));

/** The named dish a pot matches (ingredients + preps, order/quantity
 *  independent), or undefined. */
export function matchNamedDish(placements: CookPlacement[]): NamedDish | undefined {
  return BY_ID.get(dishIdFor(placements));
}

export const namedDishId = (d: NamedDish): string => dishIdFor(d.placements);
