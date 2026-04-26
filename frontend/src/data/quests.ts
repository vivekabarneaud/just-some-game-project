import type { GameState } from "~/engine/gameState";
import { getItem } from "@medieval-realm/shared/data/items";

export interface QuestReward {
  resource: "gold" | "wood" | "stone" | "wheat" | "wool" | "astralShards";
  amount: number;
  label: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  narrative: string;
  objective: string;
  icon: string;
  condition: (state: GameState) => boolean;
  rewards: QuestReward[];
  targetBuildingId?: string;
  targetPage?: string; // route path for the "Go to X" link
  image?: string; // optional quest illustration
  triggersRaid?: boolean; // spawns a weak raid when this quest becomes active
  hint?: string; // extra hint text shown below the narrative
  hintLink?: string; // optional link for the hint
  /** Short vignette shown while the quest is active. Preferred over `narrative` when present. */
  startNarrative?: string;
  /** Chronicle entry fired into the archive when the reward is claimed. */
  chronicleEntryId?: string;
  /** Founding-cast bio fragment IDs unlocked when the reward is claimed. */
  unlocksBioFragments?: string[];
}

const bldg = (state: GameState, id: string) =>
  state.buildings.find((b) => b.buildingId === id);

export const QUEST_CHAIN: QuestDefinition[] = [
  // ── Chapter 1 — The First Camp ──────────────────────────────────
  // 1 — Campfire (The Kitchens at level 1 is just a cookfire and a pot).
  {
    id: "the_first_fire",
    title: "The First Fire",
    narrative:
      "Edda has stood over the empty firepit twice this morning with her arms crossed. She has not said anything. She has looked at me three times. I know what that means.",
    startNarrative:
      "Edda has stood over the empty firepit twice this morning with her arms crossed. She has not said anything. She has looked at me three times. I know what that means.",
    objective: "Build the Kitchens, a cookfire at least.",
    icon: "🔥",
    condition: (s) => (bldg(s, "kitchen")?.level ?? 0) >= 1,
    // Refund-style reward: matches the lvl 1 build cost
    rewards: [{ resource: "wood", amount: 20, label: "Wood" }, { resource: "stone", amount: 10, label: "Stone" }],
    targetBuildingId: "kitchen",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/the_first_fire.png",
    unlocksBioFragments: ["edda_first_fire"],
  },
  // 2 — Lumber Mill (Jory)
  {
    id: "the_sawhorse",
    title: "The Sawhorse",
    narrative:
      "Jory walked the tree line this morning with the back of his axe, tapping trunks and listening. He has returned with a list of three good pines and a muttered opinion about the others. I promised him a proper mill before the week is out.",
    startNarrative:
      "Jory walked the tree line this morning with the back of his axe, tapping trunks and listening. He has returned with a list of three good pines and a muttered opinion about the others. I promised him a proper mill before the week is out.",
    objective: "Build a Lumber Mill",
    icon: "🪓",
    condition: (s) => (bldg(s, "lumber_mill")?.level ?? 0) >= 1,
    // Refund-style reward: matches the lvl 1 build cost
    rewards: [{ resource: "wood", amount: 30, label: "Wood" }, { resource: "stone", amount: 40, label: "Stone" }],
    targetBuildingId: "lumber_mill",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/the_sawhorse.png",
    unlocksBioFragments: ["jory_sawhorse"],
  },
  // 3 — Stone Quarry (Tomas)
  {
    id: "the_first_cut",
    title: "The First Cut",
    narrative:
      "Tomas sharpened his chisel twice before lunch and asked me nothing. That is how he asks for a proper quarry: quietly, and without waiting for permission. The ridge of stone to the north will do.",
    startNarrative:
      "Tomas sharpened his chisel twice before lunch and asked me nothing. That is how he asks for a proper quarry: quietly, and without waiting for permission. The ridge of stone to the north will do.",
    objective: "Open the Stone Quarry",
    icon: "⛏️",
    condition: (s) => (bldg(s, "quarry")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 60, label: "Wood" }, { resource: "stone", amount: 10, label: "Stone" }],
    targetBuildingId: "quarry",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/the_first_cut.png",
    unlocksBioFragments: ["tomas_quarry"],
  },
  // 4 — Forager's Hut (Edda + Nell; reframe only, no memory)
  {
    id: "the_foragers_path",
    title: "The Forager's Path",
    narrative:
      "The forest gives more than we can carry. Edda brings back mushrooms; Nell brings back everything she finds, including the things Edda tells her to put back. We need a hut. A roof and a table and a door that closes. Things spoil, and we are not yet wealthy enough to waste anything.",
    startNarrative:
      "The forest gives more than we can carry. Edda brings back mushrooms; Nell brings back everything she finds, including the things Edda tells her to put back. We need a hut. A roof and a table and a door that closes. Things spoil, and we are not yet wealthy enough to waste anything.",
    objective: "Build a Forager's Hut",
    icon: "🫐",
    condition: (s) => (bldg(s, "forager_hut")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 30, label: "Wood" }, { resource: "stone", amount: 5, label: "Stone" }],
    targetBuildingId: "forager_hut",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/the_foragers_path.png",
    unlocksBioFragments: ["edda_forager_hut"],
  },
  // 5 — Houses (settlement grows — first new citizens arrive after this)
  {
    id: "a_roof_over_their_heads",
    title: "A Roof Over Their Heads",
    narrative:
      "A raven arrived yesterday from the Crown's land office: two more families are on the road, due within the week. The tents we have will not hold them. Edda has been saying for weeks that a settlement of six is a picnic, not a village; she will now say it with more conviction.",
    startNarrative:
      "A raven arrived yesterday from the Crown's land office: two more families are on the road, due within the week. The tents we have will not hold them. Edda has been saying for weeks that a settlement of six is a picnic, not a village; she will now say it with more conviction.",
    objective: "Build Houses",
    icon: "🏠",
    condition: (s) => (bldg(s, "houses")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 60, label: "Wood" }, { resource: "stone", amount: 40, label: "Stone" }],
    targetBuildingId: "houses",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/houses_camp.png",
  },
  // 6 — Hunting Camp (new citizen brought a bow; reframe only, no memory)
  {
    id: "the_new_hunter",
    title: "The New Hunter",
    narrative:
      "Two new families arrived this week. One of them has a son with a bow, and he has already brought in more meat than Edda can salt. We need a hunting camp, if only to keep the smoke out of our sleeping tents.",
    startNarrative:
      "Two new families arrived this week. One of them has a son with a bow, and he has already brought in more meat than Edda can salt. We need a hunting camp, if only to keep the smoke out of our sleeping tents.",
    objective: "Build a Hunting Camp",
    icon: "🏹",
    condition: (s) => (bldg(s, "hunting_camp")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 40, label: "Wood" }, { resource: "stone", amount: 10, label: "Stone" }],
    targetBuildingId: "hunting_camp",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_4.png",
  },
  // 7 — Fishing Hut (filler reframe, no memory)
  {
    id: "from_the_deep",
    title: "From the Deep",
    narrative:
      "The river runs clear and cold from the mountains, and Edda has been eyeing it like a larder. A hut and some salt, and we can eat from it through winter.",
    startNarrative:
      "The river runs clear and cold from the mountains, and Edda has been eyeing it like a larder. A hut and some salt, and we can eat from it through winter.",
    objective: "Build a Fishing Hut",
    icon: "🐟",
    condition: (s) => (bldg(s, "fishing_hut")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 35, label: "Wood" }, { resource: "stone", amount: 10, label: "Stone" }],
    targetBuildingId: "fishing_hut",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_8.png",
  },
  // 8 — Pantry (fires Entry VI — Nell's Notebook, quiet pre-winter reflection)
  {
    id: "stockpile_for_winter",
    title: "A Proper Pantry",
    narrative:
      "Edda has taken to hanging onions from a tent pole and calling it a pantry. It is not a pantry. The one in Ashwick was a stone room that smelled of root vegetables and salt; ours will be wood-floored and smell of nothing yet. Tomas says the cellar can go down four feet before we hit the water table. That will do.",
    startNarrative:
      "Edda has taken to hanging onions from a tent pole and calling it a pantry. It is not a pantry. The one in Ashwick was a stone room that smelled of root vegetables and salt; ours will be wood-floored and smell of nothing yet. Tomas says the cellar can go down four feet before we hit the water table. That will do.",
    objective: "Build a Pantry",
    icon: "🥫",
    condition: (s) => (bldg(s, "pantry")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 50, label: "Wood" }, { resource: "stone", amount: 30, label: "Stone" }],
    targetBuildingId: "pantry",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/pantry.png",
    chronicleEntryId: "ch1_nell_notebook",
    unlocksBioFragments: ["edda_pantry"],
  },
  // 9 — The Rough Altar (Father Corin)
  {
    id: "the_rough_altar",
    title: "The Rough Altar",
    narrative:
      "Father Corin has been carrying his hymnal under his cloak all week, saying nothing, smiling at anyone who asks. He asked me tonight if we had space for a proper place of worship. \"The Radiant One does not need a grand temple,\" he said, \"but He does need somewhere to be.\"",
    startNarrative:
      "Father Corin has been carrying his hymnal under his cloak all week, saying nothing, smiling at anyone who asks. He asked me tonight if we had space for a proper place of worship. \"The Radiant One does not need a grand temple,\" he said, \"but He does need somewhere to be.\"",
    objective: "Build the Shrine",
    icon: "🕯️",
    condition: (s) => (bldg(s, "shrine")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 40, label: "Wood" }, { resource: "stone", amount: 60, label: "Stone" }],
    targetBuildingId: "shrine",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/the_rough_altar.png",
    unlocksBioFragments: ["corin_altar"],
  },
  // 10 — Adventurer's Guild (first wanderer already arrived; formalize the system)
  {
    id: "heroes_wanted",
    title: "Heroes Wanted",
    narrative:
      "Two travelers have knocked at our gate this month: one left, one stayed, and the one who stayed is sharpening arrows in the yard. More will come. A proper guild hall will give them somewhere to gather, and us a way to ask what they can do.",
    startNarrative:
      "Two travelers have knocked at our gate this month: one left, one stayed, and the one who stayed is sharpening arrows in the yard. More will come. A proper guild hall will give them somewhere to gather, and us a way to ask what they can do.",
    objective: "Build the Adventurer's Guild",
    icon: "🏰",
    condition: (s) => (bldg(s, "adventurers_guild")?.level ?? 0) >= 1,
    targetBuildingId: "adventurers_guild",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_10.png",
    rewards: [
      { resource: "gold", amount: 40, label: "Gold" },
      { resource: "astralShards", amount: 5, label: "Astral Shards" },
      { resource: "stone", amount: 25, label: "Stone" }
    ],
  },
  // 11 — Recruit
  {
    id: "a_brave_soul",
    title: "A Brave Soul",
    narrative:
      "The Guild's doors are open, and more have come than I expected. A woman from Nordveld with a bow she will not put down. A priest's apprentice who will not say which parish. Two others who walked in without speaking. I cannot keep them all. I must choose.",
    startNarrative:
      "The Guild's doors are open, and more have come than I expected. A woman from Nordveld with a bow she will not put down. A priest's apprentice who will not say which parish. Two others who walked in without speaking. I cannot keep them all. I must choose.",
    objective: "Recruit an adventurer",
    icon: "⚔️",
    condition: (s) => s.adventurers.length >= 1,
    rewards: [{ resource: "gold", amount: 40, label: "Gold" }, { resource: "wood", amount: 25, label: "Wood" }],
    targetPage: "/guild?tab=recruit",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_11.png",
  },
  // 10 — Send mission
  {
    id: "into_the_unknown",
    title: "Into the Unknown",
    narrative:
      "The mission board is nailed to the wall, ink still wet. The southern frontier is full of ruins, rumours, and things that the Dominion's maps don't show. Time to find out what's really out here.",
    objective: "Send your first mission",
    icon: "🗺️",
    condition: (s) => s.firstMissionSent === true,
    rewards: [{ resource: "astralShards", amount: 10, label: "Astral Shards" }, { resource: "wood", amount: 25, label: "Wood" }],
    targetPage: "/guild",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_12.png",
  },
  // 11 — Field or Garden
  {
    id: "seeds_of_prosperity",
    title: "Seeds of Prosperity",
    narrative:
      "The soil here is dark and rich, perfect for planting. Fields can only be sown in spring. Each garden veggie has its own planting season too: check the cards to find one you can plant right now.",
    objective: "Plant seeds in a Field or a Garden",
    icon: "🌾",
    condition: (s) =>
      s.fields.some((f) => f.level >= 1 && f.crop !== null) ||
      s.gardens.some((g) => g.level >= 1 && g.plantedYear != null),
    // Refund matches a field's build cost (gardens are cheaper; field is the common case)
    rewards: [{ resource: "wood", amount: 40, label: "Wood" }, { resource: "stone", amount: 10, label: "Stone" }],
    targetPage: "/farming",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_13.png",
  },
  // 12 — Sheep Pen
  {
    id: "woolly_friends",
    title: "Woolly Friends",
    narrative:
      "A shepherd arrives at your gate with a small flock, looking for pasture. No gold needed, just wood and stone to build a pen. Wool for clothing, meat for the table. These creatures earn their keep.",
    objective: "Build a Sheep Pen",
    icon: "🐑",
    condition: (s) => s.pens.some((p) => p.animal === "sheep" && p.level >= 1),
    rewards: [{ resource: "wheat", amount: 50, label: "Wheat" }, { resource: "wool", amount: 10, label: "Wool" }, { resource: "wood", amount: 50, label: "Wood" }],
    targetPage: "/farming#pen-sheep",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_14.png",
  },
  // 13 — Tailoring Shop
  {
    id: "warm_and_proper",
    title: "Warm and Proper",
    narrative:
      "Your settlers shiver in patched-together rags. With wool from your sheep, a proper tailor could clothe them, and warm clothes mean happy citizens, especially when winter comes.",
    objective: "Build a Tailoring Shop",
    icon: "🧵",
    condition: (s) => (bldg(s, "tailoring_shop")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 50, label: "Wood" }, { resource: "stone", amount: 30, label: "Stone" }],
    targetBuildingId: "tailoring_shop",
  },
  // 14 — Craft clothing
  {
    id: "first_stitch",
    title: "The First Stitch",
    narrative:
      "Your tailor examines the wool and nods approvingly. 'Good fiber. I can make proper clothes from this. Your people are shivering in rags. Clothe them and they'll be happier, especially come winter. Robes and armor can wait. Warmth first.'",
    objective: "Craft Wool or Linen Clothing for your citizens",
    icon: "🧥",
    condition: (s) => Math.round(s.clothing) >= 1,
    // Refund the wool spent on the first clothing craft
    rewards: [
      { resource: "wool", amount: 5, label: "Wool" },
    ],
    targetPage: "/tailoring",
  },
  // ── Wave 2 — Town Hall 2 unlocks upgrade levels ───────────────
  // 15 — Town Hall lvl 2
  {
    id: "ambition_rises",
    title: "Ambition Rises",
    narrative:
      "Your camp grows restless with potential. Upgrade the Town Hall and watch your settlement transform into something greater.",
    objective: "Upgrade Town Hall to level 2",
    icon: "🏛️",
    condition: (s) => (bldg(s, "town_hall")?.level ?? 0) >= 2,
    // Refund the TH lvl 2 upgrade cost
    rewards: [{ resource: "wood", amount: 108, label: "Wood" }, { resource: "stone", amount: 108, label: "Stone" }],
    targetBuildingId: "town_hall",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/settlement_camp.png",
  },
  // 16 — Upgrade Lumber Mill to lvl 2 (needs TH 2)
  {
    id: "sharper_axes",
    title: "Sharper Axes",
    narrative:
      "Jory has stopped tapping trunks with the back of his axe and started marking them with chalk: a sign he has learned which pines here are worth felling and which are not. He says the mill needs a proper pit-saw and a second horse, and he announces it over breakfast in front of everyone, which is how Jory gets things done.",
    startNarrative:
      "Jory has stopped tapping trunks with the back of his axe and started marking them with chalk: a sign he has learned which pines here are worth felling and which are not. He says the mill needs a proper pit-saw and a second horse, and he announces it over breakfast in front of everyone, which is how Jory gets things done.",
    objective: "Upgrade Lumber Mill to level 2",
    icon: "🪓",
    condition: (s) => (bldg(s, "lumber_mill")?.level ?? 0) >= 2,
    rewards: [{ resource: "wood", amount: 40, label: "Wood" }, { resource: "stone", amount: 54, label: "Stone" }],
    targetBuildingId: "lumber_mill",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_5.png",
    unlocksBioFragments: ["jory_old_songs"],
  },
  // 17 — Upgrade Stone Quarry to lvl 2 (needs TH 2)
  {
    id: "deeper_veins",
    title: "Deeper Veins",
    narrative:
      "Tomas has been sleeping at the quarry two nights a week, coming back with dust in his beard and a list of what the surface ledge cannot give us. He wants to cut down: proper steps, a winch, maybe a second face. He says the good stone is just below, and he says it like a man who can already hear it.",
    startNarrative:
      "Tomas has been sleeping at the quarry two nights a week, coming back with dust in his beard and a list of what the surface ledge cannot give us. He wants to cut down: proper steps, a winch, maybe a second face. He says the good stone is just below, and he says it like a man who can already hear it.",
    objective: "Upgrade Stone Quarry to level 2",
    icon: "⛏️",
    condition: (s) => (bldg(s, "quarry")?.level ?? 0) >= 2,
    rewards: [{ resource: "wood", amount: 81, label: "Wood" }, { resource: "stone", amount: 13, label: "Stone" }],
    targetBuildingId: "quarry",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_6.png",
    unlocksBioFragments: ["tomas_quarry_shack"],
  },
  // 18 — Build a Marketplace
  {
    id: "merchants_welcome",
    title: "Merchants Welcome",
    narrative:
      "A Dominion trader stopped through yesterday with two mules and more opinions than cargo. \"You have grown enough to be worth a second visit,\" she said, \"if you build a proper market. No one unloads in the mud.\" She may be right. Coin spends the same wherever it comes from.",
    startNarrative:
      "A Dominion trader stopped through yesterday with two mules and more opinions than cargo. \"You have grown enough to be worth a second visit,\" she said, \"if you build a proper market. No one unloads in the mud.\" She may be right. Coin spends the same wherever it comes from.",
    objective: "Build a Marketplace",
    icon: "🏪",
    condition: (s) => (bldg(s, "marketplace")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 60, label: "Wood" },
      { resource: "stone", amount: 40, label: "Stone" },
    ],
    targetBuildingId: "marketplace",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/marketplace.png",
  },
  // 19 — Build a Woodworker
  {
    id: "tools_of_the_trade",
    title: "Tools of the Trade",
    narrative:
      "A travelling carpenter offers to stay if you build him a workshop. With the right wood, he can craft staves for your wizards, bows for your archers, and shields for your warriors.",
    objective: "Build a Woodworker",
    icon: "🪚",
    condition: (s) => (bldg(s, "woodworker")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 60, label: "Wood" }, { resource: "stone", amount: 20, label: "Stone" }],
    targetBuildingId: "woodworker",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/woodworker.png",
  },
  // 20 — Craft a weapon
  {
    id: "arm_the_brave",
    title: "Arm the Brave",
    narrative:
      "Your adventurers eye the new workshop with interest. A proper weapon could mean the difference between victory and a shallow grave. Craft something worthy of a hero.",
    objective: "Craft a weapon at the Woodworker",
    icon: "🪄",
    condition: (s) => s.weapons >= 1 || s.inventory.some((i) => {
      if (i.quantity <= 0) return false;
      const item = getItem(i.itemId);
      return item?.slot === "mainHand" || item?.slot === "offHand";
    }),
    rewards: [{ resource: "gold", amount: 20, label: "Gold" }],
    targetPage: "/woodworker",
  },
  // 21 — Equip an adventurer
  {
    id: "ready_for_battle",
    title: "Ready for Battle",
    narrative:
      "A weapon in the stockpile does no good. Put it in the hands of someone who knows how to use it. Visit an adventurer's detail page and equip their new gear.",
    objective: "Equip a weapon on an adventurer",
    icon: "⚔️",
    condition: (s) => s.adventurers.some((a) => a.equipment && Object.values(a.equipment).some((slot) => slot !== null)),
    rewards: [{ resource: "gold", amount: 20, label: "Gold" }],
    targetPage: "/guild?tab=roster",
  },
  // ── Wave 3 — Town Hall 3 ──────────────────────────────────────
  // 23 — Town Hall lvl 3 (Camp → Village tier-up; fires Entry VII — Chapter 1 close)
  {
    id: "the_road_to_greatness",
    title: "The Road to Greatness",
    narrative:
      "The Town Hall is too small now. Edda has taken to calling it \"the cupboard.\" We have outgrown this camp: tents on every level stretch of ground, two wells, a shrine, a mission board, and more names on the roster than I can list from memory. The canvas will not last another winter. It is time to raise a proper hall, and then to trade tents for walls.",
    startNarrative:
      "The Town Hall is too small now. Edda has taken to calling it \"the cupboard.\" We have outgrown this camp: tents on every level stretch of ground, two wells, a shrine, a mission board, and more names on the roster than I can list from memory. The canvas will not last another winter. It is time to raise a proper hall, and then to trade tents for walls.",
    objective: "Upgrade Town Hall to level 3",
    icon: "⭐",
    condition: (s) => (bldg(s, "town_hall")?.level ?? 0) >= 3,
    targetBuildingId: "town_hall",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/settlement_village.png",
    // Refund TH lvl 3 cost + shards as a milestone bonus
    rewards: [
      { resource: "wood", amount: 167, label: "Wood" },
      { resource: "stone", amount: 167, label: "Stone" },
      { resource: "astralShards", amount: 5, label: "Astral Shards" },
    ],
    chronicleEntryId: "ch1_stable_now",
  },
  // 24 — Bandits spotted (triggers a weak, slow raid)
  {
    id: "the_first_threat",
    title: "The First Threat",
    narrative:
      "Your adventurers return from their last mission with troubling news: they spotted a group of armed men in the hills, watching your settlement. They're poorly equipped, desperate, not organized, but they're heading this way. Your scouts estimate twelve hours before they arrive. Build walls. Now.",
    hint: "Short on stone? Trade for some at the Marketplace.",
    hintLink: "/marketplace",
    objective: "Build Walls",
    icon: "🧱",
    condition: (s) => (bldg(s, "walls")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 40, label: "Wood" }, { resource: "stone", amount: 120, label: "Stone" }],
    targetBuildingId: "walls",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/walls.png",
    triggersRaid: true, // special flag — spawns a weak raid when quest appears
  },
  // 25 — Survive the raid
  {
    id: "baptism_of_fire",
    title: "Baptism of Fire",
    narrative:
      "They're here. A ragged band of hungry bandits, driven south by Dominion taxes and hard winters. They're not evil, just desperate. But desperate men with swords are still dangerous. Your walls will be tested for the first time.",
    objective: "Survive the raid",
    icon: "⚔️",
    condition: (s) => s.lastRaidOutcome === "victory",
    rewards: [
      { resource: "gold", amount: 60, label: "Gold" },
      { resource: "astralShards", amount: 3, label: "Astral Shards" },
    ],
  },
  // 26 — Build a Watchtower (lesson learned)
  {
    id: "eyes_on_the_horizon",
    title: "Eyes on the Horizon",
    narrative:
      "We saw them in time, but only because a returning patrol heard the brush move. Next raid, we might not be so lucky. A proper watchtower would give us hours of warning instead of minutes. No one else is getting inside our fence unnoticed.",
    objective: "Build a Watchtower",
    icon: "🏰",
    condition: (s) => (bldg(s, "watchtower")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 60, label: "Wood" }, { resource: "stone", amount: 120, label: "Stone" }],
    targetBuildingId: "watchtower",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/watchtower.png",
  },
];
