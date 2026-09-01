// ─── The pantry vocabulary ──────────────────────────────────────
// Every id the settlement can hold a stockpile OF. Lives in shared because the
// backend and shared data need it too: without it `shared` degraded to plain
// `string` (CULL_MEAT was `Record<AnimalId, string>`) and every consumer cast
// back to the real type at the call site. TECH_DEBT 4.5.
//
// NOT the same thing as two neighbours it is easy to confuse:
//   - `data/items/foods.ts` is mission FOOD ITEMS (honeycake, equipped per
//     mission and consumed on deploy).
//   - `data/rewards.ts` RewardType is what a reward can NAME, which uses
//     generic aliases ("meat", "berries", "mushrooms") that grantReward maps
//     onto a specific pantry id. This file has the specific ones instead
//     (venison, blackberry, cepe) plus the cooked dishes.

export type FoodItemType =
  | "wheat" | "barley"
  | "cabbages" | "turnips" | "peas" | "squash" | "fava"
  | "apples" | "pears" | "cherries" | "strawberries"
  | "venison" | "boar" | "wisent" | "pork" | "mutton" | "goat" | "chicken" | "wild_fowl" | "rabbit"
  | "eggs" | "milk"
  | "trout" | "pike" | "eel" | "salmon"
  | "blackberry" | "blueberry" | "raspberry" | "nuts"
  | "dandelion" | "sorrel" | "ramsons" | "wild_carrot"
  | "field_mushroom" | "morel" | "chanterelle" | "cepe"
  | "porridge" | "hearth_stew" | "river_stew" | "bone_broth";
