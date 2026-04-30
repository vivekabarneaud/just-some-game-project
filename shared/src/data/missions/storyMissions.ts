import type { StoryMission } from "./types.js";

export const STORY_MISSIONS: StoryMission[] = [
  {
    id: "story_1_scouting",
    storyOrder: 1,
    chapter: "Chapter 1: Ashes and Dust",
    name: "Scouting the Surroundings",
    description:
      "Time to find out what's around us. Send scouts to map the area: water sources, game trails, anything useful. And anything dangerous.",
    icon: "🗺️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/scouting_the_surroundings.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 900,
    rewards: [
      { resource: "gold", amount: 50 },
      { resource: "wood", amount: 50 },
    ],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["exploration", "outdoor"],
    encounters: [{ enemyId: "wild_wolf", count: 2 }],
    chronicleEntryId: "ch1_first_scouts",
  },
  {
    id: "story_2_ruins",
    storyOrder: 2,
    prerequisite: "story_1_scouting",
    chapter: "Chapter 1: Ashes and Dust",
    name: "The Hilltop Ruins",
    description:
      "Those ruins your scouts found, they need a closer look. Send a team to search the buildings. Bring someone who can handle a fight. Whatever drove the previous settlers out might still be there.",
    icon: "🏚️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/hilltop_ruins.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1200,
    rewards: [
      { resource: "gold", amount: 80 },
      { resource: "stone", amount: 60 },
    ],
    deployCost: 10,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["exploration", "combat"],
    encounters: [{ enemyId: "skeleton", count: 2 }, { enemyId: "giant_rat", count: 2 }],
  },
  {
    id: "story_3_dark_treeline",
    storyOrder: 3,
    prerequisite: "story_2_ruins",
    chapter: "Chapter 1: Ashes and Dust",
    name: "The Silent Forest",
    description:
      "The journal from the ruins mentions a treeline to the south where 'the birds don't sing.' Your scouts confirmed it. A stretch of forest where everything is quiet. Too quiet. Investigate, but be careful.",
    icon: "🌑",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/silent_forest.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 1800,
    rewards: [
      { resource: "gold", amount: 100 },
      { resource: "wood", amount: 80 },
    ],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["exploration", "outdoor", "survival"],
    encounters: [{ enemyId: "cursed_spirit", count: 3 }, { enemyId: "skeleton", count: 3 }],
  },
  {
    id: "story_4_thornveil_ranger",
    storyOrder: 4,
    prerequisite: "story_3_dark_treeline",
    chapter: "Chapter 2: The Boundary",
    name: "A Ranger's Warning",
    description:
      "A stranger arrived at dawn. A Thornveil Ranger, hooded and armed, asking to speak with whoever's in charge. She says she's been watching your settlement. She says you need to hear what she knows.",
    icon: "🌿",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/rangers_warning.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1500,
    rewards: [
      { resource: "gold", amount: 120 },
      { resource: "wheat", amount: 80 },
    ],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["exploration", "outdoor"],
    encounters: [{ enemyId: "wild_wolf", count: 2 }, { enemyId: "orc_warrior", count: 1 }],
  },
  {
    id: "story_5_ward_stone",
    storyOrder: 5,
    prerequisite: "story_4_thornveil_ranger",
    chapter: "Chapter 2: The Boundary",
    name: "The Cracked Ward-Stone",
    description:
      "Kess leads you to the nearest ward-stone, a moss-covered monolith in a forest clearing. It's cracked. The runes are fading. She says it needs to be cleansed and reactivated. The dead know when a ward weakens. They'll come.",
    icon: "🪨",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/cracked_wardstone.png",
    slots: [{ class: "wizard" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [
      { resource: "gold", amount: 150 },
      { resource: "stone", amount: 100 },
      { resource: "astralShards", amount: 2 },
    ],
    deployCost: 25,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["combat", "magical", "survival"],
    encounters: [{ enemyId: "skeleton", count: 3 }, { enemyId: "cursed_spirit", count: 2 }, { enemyId: "wailing_phantom", count: 1 }],
  },
  {
    id: "story_6_the_robin",
    storyOrder: 6,
    prerequisite: "story_5_ward_stone",
    chapter: "Chapter 2: The Boundary",
    name: "The Robin's Message",
    description:
      "A robin landed on your settlement's watchtower this morning. Just a bird, except it carried a tiny scroll, sealed with wax that shimmered faintly. The seal bears no sigil. The handwriting inside is precise but shaky, as if written by someone very old or very tired.",
    icon: "🐦",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/robins_message.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [
      { resource: "gold", amount: 200 },
      { resource: "astralShards", amount: 3 },
    ],
    deployCost: 30,
    difficulty: 3,
    minGuildLevel: 2,
    tags: ["exploration", "combat", "outdoor"],
    encounters: [{ enemyId: "orc_warrior", count: 2 }, { enemyId: "orc_warlord", count: 1 }],
  },
];

/** Get the current story mission available to the player, or null */
export function getCurrentStoryMission(
  guildLevel: number,
  completedStoryMissions: string[],
): StoryMission | null {
  const completed = new Set(completedStoryMissions);
  for (const m of STORY_MISSIONS) {
    if (completed.has(m.id)) continue;
    if (m.minGuildLevel > guildLevel) return null;
    if (m.prerequisite && !completed.has(m.prerequisite)) return null;
    return m;
  }
  return null;
}
