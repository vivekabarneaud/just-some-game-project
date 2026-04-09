import type { GameState } from "~/engine/gameState";

export interface QuestReward {
  resource: "gold" | "wood" | "stone" | "food" | "astralShards";
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
}

const bldg = (state: GameState, id: string) =>
  state.buildings.find((b) => b.buildingId === id);

export const QUEST_CHAIN: QuestDefinition[] = [
  // 1 — Lumber Mill
  {
    id: "first_things_first",
    title: "First Things First",
    narrative:
      "The Corsair League promised fertile land and freedom from Dominion taxes. They didn't mention the silence. Your five settlers stare at the tree line, wondering what they've gotten into. Well — timber first, doubts later.",
    objective: "Build a Lumber Mill",
    icon: "🪓",
    condition: (s) => (bldg(s, "lumber_mill")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 100, label: "Wood" }],
    targetBuildingId: "lumber_mill",
    image: "/images/stories/quest_1.png",
  },
  // 2 — Stone Quarry
  {
    id: "foundation_of_stone",
    title: "Foundation of Stone",
    narrative:
      "Your woodcutters found something odd — old foundation stones buried in the undergrowth, from a settlement that was here before yours. It didn't last. Yours will. Start with the quarry.",
    objective: "Build a Stone Quarry",
    icon: "⛏️",
    condition: (s) => (bldg(s, "quarry")?.level ?? 0) >= 1,
    rewards: [{ resource: "stone", amount: 100, label: "Stone" }],
    targetBuildingId: "quarry",
    image: "/images/stories/quest_2.png",
  },
  // 3 — Forager's Hut
  {
    id: "the_foragers_path",
    title: "The Forager's Path",
    narrative:
      "The forest is generous — berries, mushrooms, wild herbs. One of your settlers claims the old folk used to say Sylvana's blessing made these woods grow thick. You're not sure who Sylvana is, but the berries are real enough.",
    objective: "Build a Forager's Hut",
    icon: "🫐",
    condition: (s) => (bldg(s, "forager_hut")?.level ?? 0) >= 1,
    rewards: [{ resource: "food", amount: 50, label: "Food" }],
    targetBuildingId: "forager_hut",
    image: "/images/stories/quest_3.png",
  },
  // 4 — Hunting Camp
  {
    id: "the_hunt_begins",
    title: "The Hunt Begins",
    narrative:
      "The game here is plentiful — almost too plentiful, as if nothing has hunted these woods in a long time. The deer don't even run from your scouts. Whatever drove the last settlers away, it wasn't starvation.",
    objective: "Build a Hunting Camp",
    icon: "🏹",
    condition: (s) => (bldg(s, "hunting_camp")?.level ?? 0) >= 1,
    rewards: [{ resource: "food", amount: 75, label: "Food" }],
    targetBuildingId: "hunting_camp",
    image: "/images/stories/quest_4.png",
  },
  // 5 — Upgrade Lumber Mill to lvl 2
  {
    id: "sharper_axes",
    title: "Sharper Axes",
    narrative:
      "Your woodcutters have learned the grain of every tree in the forest. With better tools and technique, the timber will flow twice as fast.",
    objective: "Upgrade Lumber Mill to level 2",
    icon: "🪓",
    condition: (s) => (bldg(s, "lumber_mill")?.level ?? 0) >= 2,
    rewards: [{ resource: "wood", amount: 150, label: "Wood" }],
    targetBuildingId: "lumber_mill",
    image: "/images/stories/quest_5.png",
  },
  // 6 — Upgrade Stone Quarry to lvl 2
  {
    id: "deeper_veins",
    title: "Deeper Veins",
    narrative:
      "The surface stone is running thin, but your miners swear they can hear richer deposits echoing below. Time to dig deeper.",
    objective: "Upgrade Stone Quarry to level 2",
    icon: "⛏️",
    condition: (s) => (bldg(s, "quarry")?.level ?? 0) >= 2,
    rewards: [{ resource: "stone", amount: 150, label: "Stone" }],
    targetBuildingId: "quarry",
    image: "/images/stories/quest_6.png",
  },
  // 7 — Houses
  {
    id: "a_roof_over_their_heads",
    title: "A Roof Over Their Heads",
    narrative:
      "Your people are tough — they left the Dominion's comforts for freedom. But freedom doesn't keep the rain out. Build them proper homes, and they'll stop muttering about going back north.",
    objective: "Build Houses",
    icon: "🏠",
    condition: (s) => (bldg(s, "houses")?.level ?? 0) >= 1,
    rewards: [{ resource: "food", amount: 25, label: "Food" }],
    targetBuildingId: "houses",
    image: "/images/stories/quest_7.png",
  },
  // 8 — Fishing Hut
  {
    id: "from_the_deep",
    title: "From the Deep",
    narrative:
      "The river runs clear and cold from the northern mountains. The old Corsair maps call it the Nereia's Vein — named after some goddess of water. The fish don't care what you call it. They're biting.",
    objective: "Build a Fishing Hut",
    icon: "🐟",
    condition: (s) => (bldg(s, "fishing_hut")?.level ?? 0) >= 1,
    rewards: [{ resource: "food", amount: 50, label: "Food" }],
    targetBuildingId: "fishing_hut",
    image: "/images/stories/quest_8.png",
  },
  // 9 — Pantry
  {
    id: "stockpile_for_winter",
    title: "Stockpile for Winter",
    narrative:
      "A wise leader plans for lean times. Build a pantry before the frost comes, or watch your harvest rot in the open air.",
    objective: "Build a Pantry",
    icon: "🥫",
    condition: (s) => (bldg(s, "pantry")?.level ?? 0) >= 1,
    rewards: [{ resource: "food", amount: 50, label: "Food" }],
    targetBuildingId: "pantry",
    image: "/images/stories/quest_9.png",
  },
  // 10 — Adventurer's Guild (the big early unlock!)
  {
    id: "heroes_wanted",
    title: "Heroes Wanted",
    narrative:
      "Word of your settlement is reaching the drifters and fortune-seekers who roam between the Dominion and the frontier. Some are running from something. Some are looking for something. All of them can fight. Build a guild hall and see who shows up.",
    objective: "Build the Adventurer's Guild",
    icon: "🏰",
    condition: (s) => (bldg(s, "adventurers_guild")?.level ?? 0) >= 1,
    targetBuildingId: "adventurers_guild",
    image: "/images/stories/quest_10.png",
    rewards: [
      { resource: "gold", amount: 40, label: "Gold" },
      { resource: "astralShards", amount: 5, label: "Astral Shards" },
    ],
  },
  // 11 — Recruit
  {
    id: "a_brave_soul",
    title: "A Brave Soul",
    narrative:
      "The Guild's doors creak open. Rough-looking warriors, secretive mages, and sharp-eyed archers crowd the hall. Choose your first champion wisely.",
    objective: "Recruit an adventurer",
    icon: "⚔️",
    condition: (s) => s.adventurers.length >= 1,
    rewards: [{ resource: "gold", amount: 40, label: "Gold" }],
    targetPage: "/guild",
    image: "/images/stories/quest_11.png",
  },
  // 12 — Send mission
  {
    id: "into_the_unknown",
    title: "Into the Unknown",
    narrative:
      "The mission board is nailed to the wall, ink still wet. The southern frontier is full of ruins, rumours, and things that the Dominion's maps don't show. Time to find out what's really out here.",
    objective: "Send your first mission",
    icon: "🗺️",
    condition: (s) => s.firstMissionSent === true,
    rewards: [{ resource: "astralShards", amount: 10, label: "Astral Shards" }],
    targetPage: "/guild",
    image: "/images/stories/quest_12.png",
  },
  // 13 — Field or Garden
  {
    id: "seeds_of_prosperity",
    title: "Seeds of Prosperity",
    narrative:
      "The soil here is dark and rich — perfect for planting. Fields can only be planted in spring, so if it's not the season, build a garden instead — they grow year-round except in winter.",
    objective: "Build a Field or a Garden",
    icon: "🌾",
    condition: (s) => s.fields.some((f) => f.level >= 1) || s.gardens.some((g) => g.level >= 1),
    rewards: [{ resource: "food", amount: 75, label: "Food" }],
    targetPage: "/farming",
    image: "/images/stories/quest_13.png",
  },
  // 14 — Sheep Pen
  {
    id: "woolly_friends",
    title: "Woolly Friends",
    narrative:
      "A shepherd arrives at your gate with a small flock, looking for pasture. Wool for clothing, milk for the table — these creatures earn their keep.",
    objective: "Build a Sheep Pen",
    icon: "🐑",
    condition: (s) => s.pens.some((p) => p.level >= 1),
    rewards: [{ resource: "food", amount: 50, label: "Food" }],
    targetPage: "/farming",
    image: "/images/stories/quest_14.png",
  },
  // 15 — Tailoring Shop
  {
    id: "warm_and_proper",
    title: "Warm and Proper",
    narrative:
      "Your settlers shiver in patched-together rags. With wool from your sheep, a proper tailor could clothe them — and warm clothes mean happy citizens, especially when winter comes.",
    objective: "Build a Tailoring Shop",
    icon: "🧵",
    condition: (s) => (bldg(s, "tailoring_shop")?.level ?? 0) >= 1,
    rewards: [{ resource: "gold", amount: 30, label: "Gold" }],
    targetBuildingId: "tailoring_shop",
  },
  // 16 — Craft clothing
  {
    id: "first_stitch",
    title: "The First Stitch",
    narrative:
      "Your tailor examines the wool and nods approvingly. 'Good fiber. I can make proper clothes from this — your people are shivering in rags. Clothe them and they'll be happier, especially come winter. Robes and armor can wait — warmth first.'",
    objective: "Craft Wool or Linen Clothing for your citizens",
    icon: "🧥",
    condition: (s) => s.clothing >= 1,
    rewards: [
      { resource: "gold", amount: 15, label: "Gold" },
    ],
    targetPage: "/tailoring",
  },
  // 17 — Town Hall lvl 2
  {
    id: "ambition_rises",
    title: "Ambition Rises",
    narrative:
      "Your camp grows restless with potential. Upgrade the Town Hall and watch your settlement transform into something greater.",
    objective: "Upgrade Town Hall to level 2",
    icon: "🏛️",
    condition: (s) => (bldg(s, "town_hall")?.level ?? 0) >= 2,
    rewards: [{ resource: "gold", amount: 40, label: "Gold" }],
    targetBuildingId: "town_hall",
    image: "/images/buildings/settlement_camp.png",
  },
  // 16 — Build a Marketplace
  {
    id: "merchants_welcome",
    title: "Merchants Welcome",
    narrative:
      "A Corsair trader passed through yesterday, impressed by your growth. 'Build a proper market,' she said, 'and I'll make sure the League's caravans know about you.' The Corsairs may be pirates, but their coin spends the same as anyone's.",
    objective: "Build a Marketplace",
    icon: "🏪",
    condition: (s) => (bldg(s, "marketplace")?.level ?? 0) >= 1,
    rewards: [
      { resource: "gold", amount: 30, label: "Gold" },
      { resource: "wood", amount: 100, label: "Wood" },
    ],
    targetBuildingId: "marketplace",
    image: "/images/buildings/marketplace.png",
  },
  // 17 — Build a Woodworker
  {
    id: "tools_of_the_trade",
    title: "Tools of the Trade",
    narrative:
      "A travelling carpenter offers to stay if you build him a workshop. With the right wood, he can craft staves for your wizards, bows for your archers, and shields for your warriors.",
    objective: "Build a Woodworker",
    icon: "🪚",
    condition: (s) => (bldg(s, "woodworker")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 200, label: "Wood" }],
    targetBuildingId: "woodworker",
    image: "/images/buildings/woodworker.png",
  },
  // 18 — Craft a weapon
  {
    id: "arm_the_brave",
    title: "Arm the Brave",
    narrative:
      "Your adventurers eye the new workshop with interest. A proper weapon could mean the difference between victory and a shallow grave. Craft something worthy of a hero.",
    objective: "Craft a weapon at the Woodworker",
    icon: "🪄",
    condition: (s) => s.weapons >= 1 || s.inventory.some((i) => i.quantity > 0),
    rewards: [{ resource: "gold", amount: 20, label: "Gold" }],
    targetPage: "/woodworker",
  },
  // 19 — Build a Chapel
  {
    id: "faith_and_solace",
    title: "Faith and Solace",
    narrative:
      "Some of your settlers follow the Church of the Radiant One. Others whisper the old names — Ferros, Sylvana, Solara. A few pray to no one at all. But everyone needs a place to find peace. Build a shrine, and let each soul find comfort in their own way.",
    objective: "Build a Shrine",
    icon: "🔮",
    condition: (s) => (bldg(s, "shrine")?.level ?? 0) >= 1,
    rewards: [{ resource: "gold", amount: 30, label: "Gold" }],
    targetBuildingId: "shrine",
    image: "/images/buildings/shrine.png",
  },
  // 20 — Town Hall lvl 3
  {
    id: "the_road_to_greatness",
    title: "The Road to Greatness",
    narrative:
      "New arrivals are coming — refugees from the Dominion's taxes, adventurers seeking fortune, families looking for a fresh start. Your little camp is becoming something real. The Dominion will notice soon. Best be ready.",
    objective: "Upgrade Town Hall to level 3",
    icon: "⭐",
    condition: (s) => (bldg(s, "town_hall")?.level ?? 0) >= 3,
    targetBuildingId: "town_hall",
    image: "/images/buildings/settlement_village.png",
    rewards: [
      { resource: "gold", amount: 60, label: "Gold" },
      { resource: "astralShards", amount: 5, label: "Astral Shards" },
    ],
  },
  // 21 — Bandits spotted (triggers a weak, slow raid)
  {
    id: "the_first_threat",
    title: "The First Threat",
    narrative:
      "Your adventurers return from their last mission with troubling news: they spotted a group of armed men in the hills, watching your settlement. They're poorly equipped — desperate, not organized — but they're heading this way. Your scouts estimate twelve hours before they arrive. Build walls. Now.",
    hint: "Short on stone? Trade for some at the Marketplace.",
    hintLink: "/marketplace",
    objective: "Build Walls",
    icon: "🧱",
    condition: (s) => (bldg(s, "walls")?.level ?? 0) >= 1,
    rewards: [{ resource: "stone", amount: 100, label: "Stone" }],
    targetBuildingId: "walls",
    image: "/images/buildings/walls.png",
    triggersRaid: true, // special flag — spawns a weak raid when quest appears
  },
  // 22 — Survive the raid
  {
    id: "baptism_of_fire",
    title: "Baptism of Fire",
    narrative:
      "They're here. A ragged band of hungry bandits, driven south by Dominion taxes and hard winters. They're not evil — just desperate. But desperate men with swords are still dangerous. Your walls will be tested for the first time.",
    objective: "Survive the raid",
    icon: "⚔️",
    condition: (s) => s.lastRaidOutcome === "victory",
    rewards: [
      { resource: "gold", amount: 60, label: "Gold" },
      { resource: "astralShards", amount: 3, label: "Astral Shards" },
    ],
  },
  // 23 — Build a Watchtower (lesson learned)
  {
    id: "eyes_on_the_horizon",
    title: "Eyes on the Horizon",
    narrative:
      "You survived — barely. But you were lucky this time. Your adventurers happened to spot them on a mission. Next time, you might not be so fortunate. A watchtower would give you proper warning — hours instead of minutes. You won't be caught off guard again.",
    objective: "Build a Watchtower",
    icon: "🏰",
    condition: (s) => (bldg(s, "watchtower")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 100, label: "Wood" }],
    targetBuildingId: "watchtower",
    image: "/images/buildings/watchtower.png",
  },
];
