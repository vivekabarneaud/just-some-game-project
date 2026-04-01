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
  targetBuildingId?: string; // building to highlight on the Buildings page
}

const bldg = (state: GameState, id: string) =>
  state.buildings.find((b) => b.buildingId === id);

export const QUEST_CHAIN: QuestDefinition[] = [
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
  {
    id: "ambition_rises",
    title: "Ambition Rises",
    narrative:
      "Your camp grows restless with potential. Upgrade the Town Hall and watch your settlement transform into something greater.",
    objective: "Upgrade Town Hall to level 2",
    icon: "🏛️",
    condition: (s) => (bldg(s, "town_hall")?.level ?? 0) >= 2,
    rewards: [{ resource: "gold", amount: 200, label: "Gold" }],
    targetBuildingId: "town_hall",
  },
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
  {
    id: "the_road_to_greatness",
    title: "The Road to Greatness",
    narrative:
      "Word of your settlement is spreading. Upgrade the Town Hall once more and the Adventurer's Guild will take notice...",
    objective: "Upgrade Town Hall to level 3",
    icon: "⭐",
    condition: (s) => (bldg(s, "town_hall")?.level ?? 0) >= 3,
    targetBuildingId: "town_hall",
    rewards: [
      { resource: "gold", amount: 200, label: "Gold" },
      { resource: "astralShards", amount: 5, label: "Astral Shards" },
    ],
  },
  {
    id: "heroes_wanted",
    title: "Heroes Wanted",
    narrative:
      "A weathered sign appears at your gate: 'Adventurers Sought — Fame, Fortune, and Certain Peril.' Build the Guild and see who answers the call.",
    objective: "Build the Adventurer's Guild",
    icon: "🏰",
    condition: (s) => (bldg(s, "adventurers_guild")?.level ?? 0) >= 1,
    targetBuildingId: "adventurers_guild",
    rewards: [
      { resource: "gold", amount: 300, label: "Gold" },
      { resource: "astralShards", amount: 5, label: "Astral Shards" },
    ],
  },
  {
    id: "a_brave_soul",
    title: "A Brave Soul",
    narrative:
      "The Guild's doors creak open. Rough-looking warriors, secretive mages, and sharp-eyed archers crowd the hall. Choose your first champion wisely.",
    objective: "Recruit an adventurer",
    icon: "⚔️",
    condition: (s) => s.adventurers.length >= 1,
    rewards: [{ resource: "gold", amount: 200, label: "Gold" }],
  },
  {
    id: "into_the_unknown",
    title: "Into the Unknown",
    narrative:
      "The mission board is nailed to the wall, ink still wet. Your adventurer adjusts their pack and glances back one last time. Send them forth!",
    objective: "Send your first mission",
    icon: "🗺️",
    condition: (s) => s.firstMissionSent === true,
    rewards: [{ resource: "astralShards", amount: 10, label: "Astral Shards" }],
  },
];
