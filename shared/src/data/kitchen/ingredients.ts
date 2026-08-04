// ─── Free-form cooking — the pantry (real game foods) ──────────────────────
// Phase B: mapped onto the REAL economy. Bodies are FoodItemTypes from the
// larder (frontend data/foods.ts) + a couple of resources (honey, bone); the
// spice shelf is the culinary herb (lavender) + honey + the trade spices that
// arrive via merchants (saffron/cinnamon/long pepper). Meat/fish are single
// types today — the split meats (venison/pork/…) come with the food-subcategory
// economy pass, and the FOOD_GROUPS layer folds them in without dish rework.
// See docs/DESIGN_KITCHEN.md.

import type { FoodIngredient } from "./types.js";

export const FOOD_INGREDIENTS: FoodIngredient[] = [
  // ── Staple (grain — the base) ──
  { id: "wheat", name: "Wheat", icon: "🌾", role: "staple", signature: "boil", nourish: 4, comfort: 2, flavors: ["hearty"], note: "The fine grain — bread and refinement." },
  { id: "barley", name: "Barley", icon: "🌿", role: "staple", signature: "boil", nourish: 4, comfort: 1, flavors: ["hearty"], note: "Plain grain, filling and humble." },

  // ── Protein (animal + wild + bone) ──
  { id: "meat", name: "Meat", icon: "🍖", role: "protein", signature: "skewer", nourish: 5, comfort: 3, flavors: ["hearty"], note: "Good red meat from pen or hunt." },
  { id: "fish", name: "Fish", icon: "🐟", role: "protein", signature: "skewer", nourish: 3, comfort: 2, fresh: 1, flavors: ["fresh"], note: "From the river, light and quick." },
  { id: "eggs", name: "Eggs", icon: "🥚", role: "protein", signature: "fry", nourish: 3, comfort: 2, flavors: ["hearty"], note: "Binds and enriches a dish." },
  { id: "nuts", name: "Nuts", icon: "🌰", role: "protein", signature: "boil", nourish: 3, comfort: 1, flavors: ["hearty"], note: "Foraged, fat and keeping." },
  { id: "bone", name: "Bone", icon: "🦴", role: "protein", signature: "boil", nourish: 3, comfort: 1, flavors: ["hearty"], note: "Marrow for a long, rich broth." },

  // ── Veg (body; peas + fava are the early legumes) ──
  { id: "cabbages", name: "Cabbage", icon: "🥬", role: "veg", signature: "chop", nourish: 2, comfort: 1, fresh: 2, flavors: ["fresh"], note: "Hardy leaf, good raw or cooked." },
  { id: "turnips", name: "Turnips", icon: "🥕", role: "veg", signature: "boil", nourish: 3, comfort: 1, flavors: ["hearty"], note: "Earthy root, keeps the pot honest." },
  { id: "squash", name: "Gourd", icon: "🎃", role: "veg", signature: "roast", nourish: 3, comfort: 2, flavors: ["sweet"], note: "Sweetens as it cooks down." },
  { id: "peas", name: "Peas", icon: "🫛", role: "veg", signature: "boil", nourish: 3, comfort: 1, flavors: ["fresh"], note: "Legume — pease porridge hot or cold." },
  { id: "fava", name: "Fava Beans", icon: "🫘", role: "veg", signature: "boil", nourish: 3, comfort: 1, flavors: ["hearty"], note: "Broad beans — early protein before the herd." },
  { id: "mushrooms", name: "Mushrooms", icon: "🍄", role: "veg", signature: "fry", nourish: 2, comfort: 2, flavors: ["hearty"], note: "Foraged, savoury depth." },

  // ── Fruit (sweet) ──
  { id: "apples", name: "Apples", icon: "🍎", role: "fruit", signature: "chop", nourish: 1, comfort: 3, fresh: 3, flavors: ["sweet"], note: "Crisp and cheering." },
  { id: "pears", name: "Pears", icon: "🍐", role: "fruit", signature: "chop", nourish: 1, comfort: 3, fresh: 2, flavors: ["sweet"], note: "Soft, honeyed." },
  { id: "cherries", name: "Cherries", icon: "🍒", role: "fruit", signature: "chop", nourish: 1, comfort: 4, fresh: 2, flavors: ["sweet"], note: "Bright and tart, a summer joy." },
  { id: "strawberries", name: "Strawberries", icon: "🍓", role: "fruit", signature: "chop", nourish: 1, comfort: 4, fresh: 3, flavors: ["sweet"], note: "Fleeting early-summer sweetness." },
  { id: "berries", name: "Berries", icon: "🫐", role: "fruit", signature: "chop", nourish: 1, comfort: 3, fresh: 3, flavors: ["sweet"], note: "Foraged sweetness." },

  // ── Dairy (enriches, bakes) ──
  { id: "milk", name: "Milk", icon: "🥛", role: "dairy", signature: "boil", nourish: 2, comfort: 3, flavors: ["sweet"], note: "Enriches and softens." },

  // ── Spice (catalyst — honey + the culinary herb + trade spices) ──
  { id: "honey", name: "Honey", icon: "🍯", role: "spice", signature: "boil", amplify: 0.2, comfort: 1, flavors: ["sweet"], note: "Sweetens and rounds it out." },
  { id: "lavender", name: "Lavender", icon: "💜", role: "spice", signature: "chop", amplify: 0.15, fresh: 1, flavors: ["fresh"], note: "Fragrant blooms — teas and honey-cakes." },
  // Trade spices — arrive via merchants (Zah'kari, Meridian), not grown here.
  { id: "saffron", name: "Saffron", icon: "🧡", role: "spice", signature: "boil", amplify: 0.3, flavors: ["spicy"], note: "Precious threads, a golden luxury (a trade spice)." },
  { id: "cinnamon", name: "Cinnamon", icon: "🟤", role: "spice", signature: "boil", amplify: 0.2, comfort: 1, flavors: ["spicy"], note: "A far-traded bark, sweet and warming (a trade spice)." },
  { id: "long_pepper", name: "Long Pepper", icon: "🌶️", role: "spice", signature: "boil", amplify: 0.2, flavors: ["spicy"], note: "A warming bite that lifts a dish (a trade spice)." },
];

const BY_ID = new Map(FOOD_INGREDIENTS.map((i) => [i.id, i]));
export const getFoodIngredient = (id: string): FoodIngredient | undefined => BY_ID.get(id);
export const foodByRole = (role: FoodIngredient["role"]) => FOOD_INGREDIENTS.filter((i) => i.role === role);
