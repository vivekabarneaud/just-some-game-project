// ─── What a reward can name — ONE definition ────────────────────
// This union was declared twice, byte for byte, 65 members each:
// shared/src/gameState.ts and shared/src/data/missions/types.ts. Both were
// hand-synced, which is how a 65-member union quietly drifts.
//
// It lives in its own module rather than in either of those, because
// missions/types.ts already imports `Season` FROM gameState.ts — so having
// either one import the other would close a cycle. Both import from here
// instead, and gameState.ts re-exports it so the package's root barrel
// (`export * from "./gameState.js"`) keeps exactly the surface it had.
//
// Note this is the vocabulary the five resource dispatchers in TECH_DEBT 4.3
// each re-implement by hand. If those are ever unified, this is where the
// unified one belongs.

export type RewardType = "gold" | "wood" | "stone" | "water" | "food" | "astralShards"
  // Typed foods (post-food-refactor missions reward specific items)
  | "wheat" | "barley"
  | "cabbages" | "turnips" | "peas" | "squash" | "fava"
  | "apples" | "pears" | "cherries"
  // "meat"/"fish" are aliases (grant the default cut); the specific cuts let a
  // mission reward exactly its quarry (boar hunt → boar, salmon run → salmon).
  | "meat" | "venison" | "boar" | "wisent" | "pork" | "mutton" | "goat" | "chicken" | "wild_fowl" | "rabbit"
  | "eggs" | "milk"
  | "fish" | "trout" | "pike" | "eel" | "salmon"
  | "berries" | "mushrooms" | "nuts" | "honey"
  // Herbs
  | "chamomile" | "mugwort" | "nettle" | "nightbloom" | "moonpetal" | "greymantle" | "fenbalm"
  // Exotic goods (caravan/escort drops only, non-growable)
  | "pepper" | "cinnamon" | "tea" | "chili" | "saffron"
  // Crafting materials (also drop via combat loot; can be guaranteed mission rewards too)
  | "wolfhide_strip" | "fang" | "sinew_cord"
  | "thick_pelt" | "bear_claw"
  | "bristlehide" | "tusk_shard" | "boar_tusk" | "cloven_hoof" | "boar_skull"
  | "chitin_plate" | "spinners_bile"
  | "serpent_fang" | "snake_oil"
  | "gnawed_marrow" | "bonewalk_shard";
