// ─── Free-form cooking — the placeholder pantry ────────────────────────────
// SANDBOX values (for /dev-kitchen). Not the real economy yet: the split meats
// (venison/pork/chicken) are here so we can FEEL whether food subcategories make
// cooking fun before we map their real sources (pens/coop/hunt). See
// docs/DESIGN_KITCHEN.md + the project_food_subcategories memo.

import type { FoodIngredient } from "./types.js";

export const FOOD_INGREDIENTS: FoodIngredient[] = [
  // ── Staple (the base — a proper meal wants one). Grain split: wheat/barley
  //    are the real economy today; oats/rye are the additions to feel out. ──
  { id: "wheat", name: "Wheat", icon: "🌾", role: "staple", signature: "boil", nourish: 4, comfort: 2, note: "The fine grain — bread and refinement." },
  { id: "barley", name: "Barley", icon: "🌿", role: "staple", signature: "boil", nourish: 4, comfort: 1, note: "Plain grain — filling and humble." },
  { id: "oats", name: "Oats", icon: "🥣", role: "staple", signature: "boil", nourish: 3, comfort: 2, note: "Soft grain, kind to a cold morning." },
  { id: "rye", name: "Rye", icon: "🌾", role: "staple", signature: "boil", nourish: 5, comfort: 1, note: "Dark, hearty grain — keeps a body going." },
  { id: "bread", name: "Bread", icon: "🍞", role: "staple", signature: "boil", nourish: 5, comfort: 2, note: "A loaf makes anything a meal." },

  // ── Protein (the substance — the split-meat idea, as placeholders) ──
  { id: "venison", name: "Venison", icon: "🦌", role: "protein", signature: "roast", nourish: 5, comfort: 3, note: "Lean game from the hunt." },
  { id: "pork", name: "Pork", icon: "🐖", role: "protein", signature: "roast", nourish: 5, comfort: 4, note: "Rich and fatty — a treat." },
  { id: "chicken", name: "Chicken", icon: "🐔", role: "protein", signature: "roast", nourish: 4, comfort: 3, note: "Gentle, everyday meat." },
  { id: "fish", name: "Fish", icon: "🐟", role: "protein", signature: "fry", nourish: 3, comfort: 2, fresh: 1, note: "From the river — light." },
  { id: "eggs", name: "Eggs", icon: "🥚", role: "protein", signature: "fry", nourish: 3, comfort: 2, note: "Binds and enriches a dish." },
  { id: "nuts", name: "Nuts", icon: "🌰", role: "protein", signature: "boil", nourish: 3, comfort: 1, note: "Foraged — fat and keeping." },
  { id: "bone", name: "Bone", icon: "🦴", role: "protein", signature: "boil", nourish: 3, comfort: 1, note: "Marrow for a long broth." },

  // ── Veg (body) ──
  { id: "cabbage", name: "Cabbage", icon: "🥬", role: "veg", signature: "chop", nourish: 2, comfort: 1, fresh: 2, note: "Hardy leaf, good raw or cooked." },
  { id: "turnip", name: "Turnip", icon: "🥕", role: "veg", signature: "boil", nourish: 3, comfort: 1, note: "Earthy root, keeps the pot honest." },
  { id: "gourd", name: "Gourd", icon: "🎃", role: "veg", signature: "roast", nourish: 3, comfort: 2, note: "Sweetens as it cooks down." },
  { id: "mushroom", name: "Mushrooms", icon: "🍄", role: "veg", signature: "fry", nourish: 2, comfort: 2, note: "Foraged — savoury depth." },

  // ── Fruit (sweet) ──
  { id: "apple", name: "Apples", icon: "🍎", role: "fruit", signature: "chop", nourish: 1, comfort: 3, fresh: 3, note: "Crisp and cheering." },
  { id: "berries", name: "Berries", icon: "🫐", role: "fruit", signature: "chop", nourish: 1, comfort: 3, fresh: 3, note: "Foraged sweetness." },
  { id: "pear", name: "Pears", icon: "🍐", role: "fruit", signature: "chop", nourish: 1, comfort: 3, fresh: 2, note: "Soft, honeyed." },

  // ── Dairy (body — enriches, bakes) ──
  { id: "milk", name: "Milk", icon: "🥛", role: "dairy", signature: "boil", nourish: 2, comfort: 3, note: "Enriches and softens." },
  { id: "cheese", name: "Cheese", icon: "🧀", role: "dairy", signature: "chop", nourish: 3, comfort: 4, note: "Rich — a little goes far." },
  { id: "butter", name: "Butter", icon: "🧈", role: "dairy", signature: "fry", nourish: 2, comfort: 3, note: "Makes everything better." },

  // ── Spice (catalyst — amplifies, no line of its own) ──
  { id: "long_pepper", name: "Long Pepper", icon: "🌶️", role: "spice", signature: "boil", amplify: 0.2, note: "A warming bite — lifts a dish." },
  { id: "saffron", name: "Saffron", icon: "🧡", role: "spice", signature: "boil", amplify: 0.3, note: "Precious threads — a golden luxury." },
  { id: "wildmint", name: "Wild Mint", icon: "🌿", role: "spice", signature: "chop", amplify: 0.15, fresh: 1, note: "Cooling green — brightens the plate." },
  { id: "salt", name: "Salt", icon: "🧂", role: "spice", signature: "boil", amplify: 0.15, note: "The oldest seasoning." },
  { id: "honey", name: "Honey", icon: "🍯", role: "spice", signature: "chop", amplify: 0.2, comfort: 1, note: "Sweetens and rounds it out." },
];

const BY_ID = new Map(FOOD_INGREDIENTS.map((i) => [i.id, i]));
export const getFoodIngredient = (id: string): FoodIngredient | undefined => BY_ID.get(id);
export const foodByRole = (role: FoodIngredient["role"]) => FOOD_INGREDIENTS.filter((i) => i.role === role);
