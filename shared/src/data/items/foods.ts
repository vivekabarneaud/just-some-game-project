// ─── Foods ──────────────────────────────────────────────────────
// Kitchen-crafted meals. Equipped per-mission via AdventurerMissionSupplies
// (the food slot in MissionAssemblyPanel), consumed on mission start. Each
// food carries flavor tags that can match an adventurer's foodPreference for
// bonus HP + loyalty.

import type { ItemDefinition, InventoryItem } from "./types.js";

export const FOOD_ITEMS: ItemDefinition[] = [
  // ── Kitchen — Mission Food (consumable) ─────────────────────────
  // Food items are consumed on mission deploy. They give small stat bonuses,
  // boosted if the food's flavor matches the adventurer's foodPreference.

  // Tier 1 — Simple (1 tag, Kitchen Lv 1-2)
  {
    id: "honeycake", name: "Honeycake", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/honeycake.png", icon: "🍯",
    description: "Sweet golden cake made with fresh honey. Adventurers with a sweet tooth love it.",
    classes: [], stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "honeycake", consumable: true, foodFlavors: ["sweet"],
  },
  {
    id: "peppered_jerky", name: "Peppered Jerky", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/peppered_jerky.png", icon: "🌶️",
    description: "Dried meat rubbed with wild herbs and crushed peppers. Burns going down.",
    classes: [], stats: { str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "peppered_jerky", consumable: true, foodFlavors: ["spicy"],
  },
  {
    id: "herb_salad", name: "Fresh Herb Salad", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/herb_salad.png", icon: "🥬",
    description: "Wild herbs, cabbages, and berries tossed with a light dressing. Refreshing.",
    classes: [], stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "herb_salad", consumable: true, foodFlavors: ["fresh"],
  },
  {
    id: "smoked_fish", name: "Smoked Fish", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/smoked_fish.png", icon: "🐟",
    description: "River fish smoked over applewood. The campfire crowd's favorite.",
    classes: [], stats: { wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "smoked_fish", consumable: true, foodFlavors: ["smoky"],
  },
  {
    id: "meat_pie", name: "Meat Pie", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/meat_pie.png", icon: "🥧",
    description: "A thick, filling pie stuffed with seasoned meat and gravy. Stick-to-your-ribs good.",
    classes: [], stats: { vit: 1, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "meat_pie", consumable: true, foodFlavors: ["hearty"],
  },
  {
    id: "cheese_bread", name: "Cheese Bread", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/cheese_bread.png", icon: "🧀",
    description: "Warm bread stuffed with melted goat cheese. Simple and satisfying.",
    classes: [], stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "cheese_bread", consumable: true, foodFlavors: ["hearty"],
  },
  {
    id: "grilled_mushrooms", name: "Grilled Mushrooms", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/grilled_mushrooms.png", icon: "🍄",
    description: "Forest mushrooms charred over an open flame with herbs. Earthy and rich.",
    classes: [], stats: { int: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "grilled_mushrooms", consumable: true, foodFlavors: ["smoky"],
  },
  {
    id: "fruit_tart", name: "Fruit Tart", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/fruit_tart.png", icon: "🍎",
    description: "Pastry shell filled with fresh fruit and honey glaze. A rare treat on the frontier.",
    classes: [], stats: { wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "fruit_tart", consumable: true, foodFlavors: ["sweet"],
  },

  // Tier 2 — Complex (2 tags, Kitchen Lv 3-4)
  {
    id: "hunters_stew", name: "Hunter's Stew", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/hunters_stew.png", icon: "🍲",
    description: "Slow-cooked meat with root vegetables and mushrooms. Smells like the campfire after a good hunt.",
    classes: [], stats: { str: 1, vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "hunters_stew", consumable: true, foodFlavors: ["hearty", "smoky"],
  },
  {
    id: "spiced_honeycake", name: "Spiced Honeycake", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/spiced_honeycake.png", icon: "🍰",
    description: "Honeycake with crushed herbs and pepper. Sweet heat that lingers.",
    classes: [], stats: { wis: 1, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "spiced_honeycake", consumable: true, foodFlavors: ["sweet", "spicy"],
  },
  {
    id: "pea_mint_bowl", name: "Pea & Mint Bowl", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/pea_mint_bowl.png", icon: "🫛",
    description: "Fresh peas with mint and a kick of pepper. Light but energizing.",
    classes: [], stats: { dex: 1, int: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "pea_mint_bowl", consumable: true, foodFlavors: ["fresh", "spicy"],
  },
  {
    id: "cherry_cheese_plate", name: "Cherry Cheese Plate", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/cherry_cheese_plate.png", icon: "🍒",
    description: "Goat cheese with fresh fruit and wild berries. Elegant for the frontier.",
    classes: [], stats: { wis: 1, dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "cherry_cheese_plate", consumable: true, foodFlavors: ["sweet", "fresh"],
  },
  {
    id: "smoked_pork_roast", name: "Smoked Pork Roast", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/smoked_pork_roast.png", icon: "🍖",
    description: "Thick-cut pork smoked with squash and hardwood. A meal that fights back.",
    classes: [], stats: { str: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "smoked_pork_roast", consumable: true, foodFlavors: ["smoky", "hearty"],
  },
  {
    id: "fishermans_broth", name: "Fisherman's Broth", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/fishermans_broth.png", icon: "🥣",
    description: "Fish, cabbage, and herbs in a clear broth. Light, warm, and keeps death at bay.",
    classes: [], stats: { vit: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "fishermans_broth", consumable: true, foodFlavors: ["fresh", "hearty"],
  },
  // ── Origin Recipes — Loyalty Unlocked ──────────────────────────

  // Ashwick
  { id: "shepherds_pie", name: "Shepherd's Pie", icon: "🥧",
    description: "Ashwick comfort food — meat and mashed roots under a golden crust. Tastes like home.",
    classes: [], stats: { vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "shepherds_pie", consumable: true, foodFlavors: ["hearty"] },
  { id: "ashwick_ale_stew", name: "Ashwick Ale Stew", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/ashwick_ale_stew.png", icon: "🍺",
    description: "Slow-cooked in dark ale until the meat falls apart. The Hearthlands in a bowl.",
    classes: [], stats: { str: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "ashwick_ale_stew", consumable: true, foodFlavors: ["hearty", "smoky"] },
  { id: "blackberry_crumble", name: "Blackberry Crumble", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/blackberry_crumble.png", icon: "🫐",
    description: "Wild blackberries under a buttery oat crust with honey drizzle. Grandma's recipe.",
    classes: [], stats: { wis: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "blackberry_crumble", consumable: true, foodFlavors: ["sweet"] },

  // Nordveld
  { id: "smoked_elk_berries", name: "Smoked Elk & Cloudberries", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/smoked_elk_berries.png", icon: "🫐",
    description: "Elk smoked over pine coals, served with tart cloudberries. A Nordveld jarl's meal.",
    classes: [], stats: { str: 2 }, durationMod: 1, lootMod: 1, recipeId: "smoked_elk_berries", consumable: true, foodFlavors: ["smoky", "sweet"] },
  { id: "nordveld_porridge", name: "Nordveld Barley Porridge", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/nordveld_porridge.png", icon: "🥣",
    description: "Thick barley porridge with honey and salt. Keeps you warm through any blizzard.",
    classes: [], stats: { vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "nordveld_porridge", consumable: true, foodFlavors: ["hearty", "sweet"] },
  { id: "pickled_herring", name: "Pickled Herring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/pickled_herring.png", icon: "🐟",
    description: "Herring preserved in brine and herbs. An acquired taste. The Nordveld never acquired any other.",
    classes: [], stats: { dex: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "pickled_herring", consumable: true, foodFlavors: ["fresh"] },

  // Meridian
  { id: "saffron_fish_stew", name: "Saffron Fish Stew", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/saffron_fish_stew.png", icon: "🍲",
    description: "A Corsair captain's recipe — white fish in saffron broth with lemon and peppers.",
    classes: [], stats: { int: 1, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "saffron_fish_stew", consumable: true, foodFlavors: ["fresh", "spicy"] },
  { id: "grilled_octopus", name: "Grilled Octopus", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/grilled_octopus.png", icon: "🐙",
    description: "Charred over driftwood with sea salt and olive oil. The harbor smells like this on good days.",
    classes: [], stats: { dex: 2 }, durationMod: 1, lootMod: 1, recipeId: "grilled_octopus", consumable: true, foodFlavors: ["smoky", "fresh"] },
  { id: "fig_honey_toast", name: "Fig & Honey Toast", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/fig_honey_toast.png", icon: "🍯",
    description: "Toasted bread with ripe figs, honey, and a whisper of sea salt. Meridian mornings in a bite.",
    classes: [], stats: { wis: 2 }, durationMod: 1, lootMod: 1, recipeId: "fig_honey_toast", consumable: true, foodFlavors: ["sweet"] },

  // Zah'kari
  { id: "groundnut_spice_bowl", name: "Groundnut Spice Bowl", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/groundnut_spice_bowl.png", icon: "🥜",
    description: "Crushed groundnuts in a thick spiced sauce over grain. A Zah'kari council-day staple.",
    classes: [], stats: { str: 1, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "groundnut_spice_bowl", consumable: true, foodFlavors: ["spicy", "hearty"] },
  { id: "jollof_rice", name: "Zah'kari Jollof", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/jollof_rice.png", icon: "🍚",
    description: "Tomato-spiced rice with smoked meat. Every Zah'kari family claims theirs is the best.",
    classes: [], stats: { str: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "jollof_rice", consumable: true, foodFlavors: ["spicy", "smoky"] },
  { id: "plantain_pepper_fry", name: "Plantain Pepper Fry", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/plantain_pepper_fry.png", icon: "🍌",
    description: "Fried plantain with crushed peppers and palm oil. Sweet heat that makes you sweat.",
    classes: [], stats: { dex: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "plantain_pepper_fry", consumable: true, foodFlavors: ["sweet", "spicy"] },

  // Tianzhou
  { id: "steamed_dumplings", name: "Steamed Dumplings", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/steamed_dumplings.png", icon: "🥟",
    description: "Delicate pork dumplings in paper-thin wrappers. A Tianzhou scholar's working lunch.",
    classes: [], stats: { int: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "steamed_dumplings", consumable: true, foodFlavors: ["fresh"] },
  { id: "five_spice_duck", name: "Five-Spice Duck", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/five_spice_duck.png", icon: "🦆",
    description: "Slow-roasted duck glazed in five imperial spices. An entire afternoon of cooking for one perfect meal.",
    classes: [], stats: { str: 1, int: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "five_spice_duck", consumable: true, foodFlavors: ["smoky", "spicy"] },
  { id: "jade_tea_soup", name: "Jade Tea Soup", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/jade_tea_soup.png", icon: "🍵",
    description: "A clear broth infused with green tea and ginger. Tianzhou monks drink this before meditation.",
    classes: [], stats: { wis: 2 }, durationMod: 1, lootMod: 1, recipeId: "jade_tea_soup", consumable: true, foodFlavors: ["fresh"] },

  // Khor'vani
  { id: "lamb_tagine", name: "Lamb Tagine", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/lamb_tagine.png", icon: "🍲",
    description: "Slow-cooked lamb with dried fruit and twelve spices in a clay pot. The Crossroads' signature dish.",
    classes: [], stats: { str: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "lamb_tagine", consumable: true, foodFlavors: ["smoky", "spicy"] },
  { id: "saffron_rice_pilaf", name: "Saffron Rice Pilaf", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/saffron_rice_pilaf.png", icon: "🍚",
    description: "Golden rice studded with dried fruits and toasted nuts. Every grain worth its weight.",
    classes: [], stats: { int: 2 }, durationMod: 1, lootMod: 1, recipeId: "saffron_rice_pilaf", consumable: true, foodFlavors: ["sweet", "spicy"] },
  { id: "rosewater_pastries", name: "Rosewater Pastries", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/rosewater_pastries.png", icon: "🌹",
    description: "Flaky pastry soaked in rosewater and honey. The Khor'vani serve these to honored guests.",
    classes: [], stats: { wis: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "rosewater_pastries", consumable: true, foodFlavors: ["sweet"] },

  // Silvaneth
  { id: "honeyed_acorn_bread", name: "Honeyed Acorn Bread", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/honeyed_acorn_bread.png", icon: "🌰",
    description: "Dense nutty bread sweetened with wild honey. The Silvaneth bake it in hot stones.",
    classes: [], stats: { vit: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "honeyed_acorn_bread", consumable: true, foodFlavors: ["sweet", "fresh"] },
  { id: "elderflower_broth", name: "Elderflower Broth", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/elderflower_broth.png", icon: "🌸",
    description: "A delicate clear broth with elderflower and forest herbs. Heals what ails you.",
    classes: [], stats: { wis: 2 }, durationMod: 1, lootMod: 1, recipeId: "elderflower_broth", consumable: true, foodFlavors: ["fresh"] },
  { id: "moss_wrapped_trout", name: "Moss-Wrapped Trout", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/moss_wrapped_trout.png", icon: "🐟",
    description: "River trout wrapped in damp moss and slow-steamed over coals. Tastes of the forest itself.",
    classes: [], stats: { dex: 1, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "moss_wrapped_trout", consumable: true, foodFlavors: ["smoky", "fresh"] },

  // Hauts-Cieux
  { id: "starfruit_meringue", name: "Starfruit Meringue", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/starfruit_meringue.png", icon: "⭐",
    description: "Whipped cloud-light meringue with crystallized starfruit. It tastes like the sky looks at dawn.",
    classes: [], stats: { int: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "starfruit_meringue", consumable: true, foodFlavors: ["sweet"] },
  { id: "crystal_consomme", name: "Crystal Consommé", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/crystal_consomme.png", icon: "🥣",
    description: "A broth so clear you can read through it. The Hauts-Cieux consider cloudy soup a moral failing.",
    classes: [], stats: { int: 2 }, durationMod: 1, lootMod: 1, recipeId: "crystal_consomme", consumable: true, foodFlavors: ["fresh"] },
  { id: "moonpetal_sorbet", name: "Moonpetal Sorbet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/moonpetal_sorbet.png", icon: "🍨",
    description: "Frozen sorbet made with moonpetal essence. Glows faintly silver. Tastes of starlight and regret.",
    classes: [], stats: { wis: 2, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "moonpetal_sorbet", consumable: true, foodFlavors: ["sweet", "fresh"] },

  // Khazdurim
  { id: "forge_roasted_boar", name: "Forge-Roasted Boar", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/forge_roasted_boar.png", icon: "🐗",
    description: "Whole boar roasted in forge heat until the fat crackles. The Khazdurim eat this before battle.",
    classes: [], stats: { str: 2 }, durationMod: 1, lootMod: 1, recipeId: "forge_roasted_boar", consumable: true, foodFlavors: ["smoky", "hearty"] },
  { id: "deep_mushroom_stew", name: "Deep Mushroom Stew", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/deep_mushroom_stew.png", icon: "🍄",
    description: "Mushrooms from the third level, slow-cooked in dark ale. Don't ask what level means.",
    classes: [], stats: { vit: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "deep_mushroom_stew", consumable: true, foodFlavors: ["hearty", "smoky"] },
  { id: "iron_bread", name: "Iron Bread", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/iron_bread.png", icon: "🍞",
    description: "Bread so dense you could hammer nails with it. The Khazdurim consider this a feature.",
    classes: [], stats: { vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "iron_bread", consumable: true, foodFlavors: ["hearty"] },

  // Feldgrund
  { id: "harvest_ale_stew", name: "Harvest Ale Stew", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/harvest_ale_stew.png", icon: "🍺",
    description: "Root vegetables and sausage in golden ale broth. The Feldgrund version of fine dining.",
    classes: [], stats: { vit: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "harvest_ale_stew", consumable: true, foodFlavors: ["hearty"] },
  { id: "cheese_and_onion_pie", name: "Cheese & Onion Pie", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/cheese_and_onion_pie.png", icon: "🥧",
    description: "Flaky crust packed with caramelized onions and three kinds of cheese. Pub perfection.",
    classes: [], stats: { vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "cheese_and_onion_pie", consumable: true, foodFlavors: ["hearty", "smoky"] },
  { id: "apple_butter_toast", name: "Apple Butter Toast", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/kitchens/apple_butter_toast.png", icon: "🍎",
    description: "Thick toast with spiced apple butter. A Feldgrund child's first breakfast and an elder's last comfort.",
    classes: [], stats: { wis: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "apple_butter_toast", consumable: true, foodFlavors: ["sweet", "hearty"] },
];

// ─── Food Effects ──────────────────────────────────────────────
// Food items are equipped in an adventurer's food slot. Effects apply only to
// that adventurer. Matching the adv's foodPreference grants a bonus (+10 HP on
// top of the base effect, and +1 loyalty on successful mission completion).

export interface FoodEffect {
  /** Stat bonus to a specific stat (non-combat and combat both benefit). */
  statBonus?: { stat: "str" | "dex" | "int" | "vit" | "wis"; amount: number };
  /** Flat HP bonus applied before combat starts. */
  hpBonus?: number;
}

export const FOOD_EFFECTS: Record<string, FoodEffect> = {
  // Campfire recipes (Lv 1-2)
  peppered_jerky: { statBonus: { stat: "str", amount: 1 } },
  herb_salad: { statBonus: { stat: "dex", amount: 1 } },
  smoked_fish: { statBonus: { stat: "int", amount: 1 } },
  grilled_mushrooms: { hpBonus: 5 },
};

/** Bonus when the food's flavor matches the adventurer's preference. */
export const MATCHED_FOOD_HP_BONUS = 10;
export const MATCHED_FOOD_LOYALTY_BONUS = 1;

export function getFoodEffect(itemId: string): FoodEffect | undefined {
  return FOOD_EFFECTS[itemId];
}

export function isFoodItem(itemId: string): boolean {
  return FOOD_ITEMS.some((i) => i.id === itemId);
}

export function getAvailableFood(inventory: InventoryItem[]): { item: ItemDefinition; qty: number }[] {
  return inventory
    .filter((inv) => inv.quantity > 0 && isFoodItem(inv.itemId))
    .map((inv) => {
      const item = FOOD_ITEMS.find((i) => i.id === inv.itemId);
      return item ? { item, qty: inv.quantity } : null;
    })
    .filter(Boolean) as { item: ItemDefinition; qty: number }[];
}
