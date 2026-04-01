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
}

const bldg = (state: GameState, id: string) =>
  state.buildings.find((b) => b.buildingId === id);

export const QUEST_CHAIN: QuestDefinition[] = [
  // 1 — Lumber Mill
  {
    id: "first_things_first",
    title: "First Things First",
    narrative:
      "The forest stands tall and untouched. Your people will need timber if they're to sleep under anything sturdier than stars.",
    objective: "Build a Lumber Mill",
    icon: "🪓",
    condition: (s) => (bldg(s, "lumber_mill")?.level ?? 0) >= 1,
    rewards: [{ resource: "wood", amount: 100, label: "Wood" }],
    targetBuildingId: "lumber_mill",
  },
  // 2 — Stone Quarry
  {
    id: "foundation_of_stone",
    title: "Foundation of Stone",
    narrative:
      "Wood alone won't hold against the wind. Send your strongest to the quarry — stone is the backbone of civilization.",
    objective: "Build a Stone Quarry",
    icon: "⛏️",
    condition: (s) => (bldg(s, "quarry")?.level ?? 0) >= 1,
    rewards: [{ resource: "stone", amount: 100, label: "Stone" }],
    targetBuildingId: "quarry",
  },
  // 3 — Forager's Hut
  {
    id: "the_foragers_path",
    title: "The Forager's Path",
    narrative:
      "An army marches on its stomach, and so does a village. The woods are full of berries and wild herbs — if you know where to look.",
    objective: "Build a Forager's Hut",
    icon: "🫐",
    condition: (s) => (bldg(s, "forager_hut")?.level ?? 0) >= 1,
    rewards: [{ resource: "food", amount: 100, label: "Food" }],
    targetBuildingId: "forager_hut",
  },
  // 4 — Hunting Camp
  {
    id: "the_hunt_begins",
    title: "The Hunt Begins",
    narrative:
      "The deer trails are fresh and the boar are fat this season. A hunting camp will keep bellies full and spirits high.",
    objective: "Build a Hunting Camp",
    icon: "🏹",
    condition: (s) => (bldg(s, "hunting_camp")?.level ?? 0) >= 1,
    rewards: [{ resource: "food", amount: 150, label: "Food" }],
    targetBuildingId: "hunting_camp",
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
  },
  // 7 — Houses
  {
    id: "a_roof_over_their_heads",
    title: "A Roof Over Their Heads",
    narrative:
      "Your people huddle around the campfire, dreaming of walls and warmth. Give them homes, and they will give you loyalty.",
    objective: "Build Houses",
    icon: "🏠",
    condition: (s) => (bldg(s, "houses")?.level ?? 0) >= 1,
    rewards: [{ resource: "food", amount: 50, label: "Food" }],
    targetBuildingId: "houses",
  },
  // 8 — Fishing Hut
  {
    id: "from_the_deep",
    title: "From the Deep",
    narrative:
      "The rivers teem with silver-scaled fish. A humble dock and some nets — that's all it takes to feed a growing village.",
    objective: "Build a Fishing Hut",
    icon: "🐟",
    condition: (s) => (bldg(s, "fishing_hut")?.level ?? 0) >= 1,
    rewards: [{ resource: "food", amount: 100, label: "Food" }],
    targetBuildingId: "fishing_hut",
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
    rewards: [{ resource: "food", amount: 100, label: "Food" }],
    targetBuildingId: "pantry",
  },
  // 10 — Adventurer's Guild (the big early unlock!)
  {
    id: "heroes_wanted",
    title: "Heroes Wanted",
    narrative:
      "A weathered sign appears at your gate: 'Adventurers Sought — Fame, Fortune, and Certain Peril.' Even a humble camp needs brave souls to scout the wilds.",
    objective: "Build the Adventurer's Guild",
    icon: "🏰",
    condition: (s) => (bldg(s, "adventurers_guild")?.level ?? 0) >= 1,
    targetBuildingId: "adventurers_guild",
    rewards: [
      { resource: "gold", amount: 200, label: "Gold" },
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
    rewards: [{ resource: "gold", amount: 200, label: "Gold" }],
    targetPage: "/guild",
  },
  // 12 — Send mission
  {
    id: "into_the_unknown",
    title: "Into the Unknown",
    narrative:
      "The mission board is nailed to the wall, ink still wet. Your adventurer adjusts their pack and glances back one last time. Send them forth!",
    objective: "Send your first mission",
    icon: "🗺️",
    condition: (s) => s.firstMissionSent === true,
    rewards: [{ resource: "astralShards", amount: 10, label: "Astral Shards" }],
    targetPage: "/guild",
  },
  // 13 — Field or Garden
  {
    id: "seeds_of_prosperity",
    title: "Seeds of Prosperity",
    narrative:
      "The soil here is dark and rich — perfect for planting. Build a field and sow your first crop. If it's not the right season for grain, try planting a garden instead!",
    objective: "Build a Field or a Garden",
    icon: "🌾",
    condition: (s) => s.fields.length >= 1 || s.gardens.length >= 1,
    rewards: [{ resource: "food", amount: 200, label: "Food" }],
    targetPage: "/farming",
  },
  // 14 — Sheep Pen
  {
    id: "woolly_friends",
    title: "Woolly Friends",
    narrative:
      "A shepherd arrives at your gate with a small flock, looking for pasture. Wool for clothing, milk for the table — these creatures earn their keep.",
    objective: "Build a Sheep Pen",
    icon: "🐑",
    condition: (s) => s.pens.length >= 1,
    rewards: [{ resource: "food", amount: 100, label: "Food" }],
    targetPage: "/farming",
  },
  // 15 — Town Hall lvl 2
  {
    id: "ambition_rises",
    title: "Ambition Rises",
    narrative:
      "Your camp grows restless with potential. Upgrade the Town Hall and watch your settlement transform into something greater.",
    objective: "Upgrade Town Hall to level 2",
    icon: "🏛️",
    condition: (s) => (bldg(s, "town_hall")?.level ?? 0) >= 2,
    rewards: [{ resource: "gold", amount: 300, label: "Gold" }],
    targetBuildingId: "town_hall",
  },
  // 16 — Build a Marketplace
  {
    id: "merchants_welcome",
    title: "Merchants Welcome",
    narrative:
      "Travellers pass through your settlement more often now. A marketplace would give them reason to stop — and give you access to goods you can't produce yourself.",
    objective: "Build a Marketplace",
    icon: "🏪",
    condition: (s) => (bldg(s, "marketplace")?.level ?? 0) >= 1,
    rewards: [
      { resource: "gold", amount: 150, label: "Gold" },
      { resource: "wood", amount: 100, label: "Wood" },
    ],
    targetBuildingId: "marketplace",
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
    rewards: [{ resource: "gold", amount: 100, label: "Gold" }],
    targetPage: "/woodworker",
  },
  // 19 — Build a Chapel
  {
    id: "faith_and_solace",
    title: "Faith and Solace",
    narrative:
      "Your people work hard, but their spirits grow weary. A humble chapel would lift their hearts — and a happier village is a more productive one.",
    objective: "Build a Chapel",
    icon: "⛪",
    condition: (s) => (bldg(s, "chapel")?.level ?? 0) >= 1,
    rewards: [{ resource: "gold", amount: 150, label: "Gold" }],
    targetBuildingId: "chapel",
  },
  // 20 — Town Hall lvl 3
  {
    id: "the_road_to_greatness",
    title: "The Road to Greatness",
    narrative:
      "Word of your settlement is spreading far and wide. Upgrade the Town Hall once more and unlock the full potential of your realm.",
    objective: "Upgrade Town Hall to level 3",
    icon: "⭐",
    condition: (s) => (bldg(s, "town_hall")?.level ?? 0) >= 3,
    targetBuildingId: "town_hall",
    rewards: [
      { resource: "gold", amount: 300, label: "Gold" },
      { resource: "astralShards", amount: 5, label: "Astral Shards" },
    ],
  },
];
