import type { StoryMission } from "./types.js";

export const STORY_MISSIONS: StoryMission[] = [
  {
    id: "story_1_scouting",
    storyOrder: 1,
    chapter: "Chapter 1: Ashes and Dust",
    name: "Scouting the Surroundings",
    description:
      "Time to know our land. Send scouts to map what's around us: water, game trails, stone, anything useful. And anything dangerous.",
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
    encounters: [{ enemyId: "wild_wolf", count: 3 }],
    chronicleEntryId: "ch1_first_scouts",
  },
  {
    id: "story_2_ruins",
    storyOrder: 2,
    prerequisite: "story_1_scouting",
    chapter: "Chapter 1: Ashes and Dust",
    name: "The Hilltop Ruins",
    description:
      "The hilltop ruins your scouts mapped. Stone foundations, a half-standing watchtower, a collapsed well: the work of someone who built to last. They still failed. Send a team in. Bring someone who can hold a line if the place is not as empty as it looks.",
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
    encounters: [{ enemyId: "giant_rat", count: 3 }, { enemyId: "wild_wolf", count: 1 }],
    chronicleEntryId: "ch1_garrison_ruins",
  },
  {
    id: "story_3_dark_treeline",
    storyOrder: 3,
    prerequisite: "story_2_ruins",
    chapter: "Chapter 1: Ashes and Dust",
    name: "Past the Ruins",
    description:
      "Send the team back south, past the ruins. Walk further this time and count the days honestly. I want to know what is really beyond. Bring someone who can deal with what does not bleed.",
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
    encounters: [{ enemyId: "wailing_phantom", count: 1 }, { enemyId: "cursed_spirit", count: 3 }],
    chronicleEntryId: "ch1_warden",
  },
  {
    id: "story_4_captains_rest",
    storyOrder: 4,
    prerequisite: "story_3_dark_treeline",
    chapter: "Chapter 1: Ashes and Dust",
    name: "The Captain's Rest",
    description:
      "Niamh has come back. The team rides with her at first light to bind the captain to his rest. Her work lets our weapons cut what should not bleed, but only while she stands. Keep her alive at any cost.",
    icon: "👻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/the_captains_rest.png",
    chronicleEntryId: "ch1_captains_rest",
    slots: [
      { class: "warrior" },
      { class: "any" },
      { class: "any" },
    ],
    duration: 1500,
    rewards: [
      { resource: "gold", amount: 100 },
      { resource: "astralShards", amount: 1 },
    ],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "magical", "escort"],
    encounters: [
      { enemyId: "captain_hale_stub", count: 1 },
      { enemyId: "wraith", count: 3 },
      { enemyId: "cursed_spirit", count: 5 },
    ],
    npcAlly: {
      npcId: "niamh",
      deathFailsMission: true,
      // Niamh stays passive — the binding rite consumes her turn. She holds
      // aggro through baseline threat against ghosts and the team has to
      // peel the minions off her while burning the boss.
      passive: true,
      baseThreatVsTag: { ghost: 80 },
    },
    // While Niamh's binding holds, ghosts can be struck physically. If she
    // dies, the binding fades and ghosts return to physical immunity.
    modifiers: [
      { type: "physical_pierces_tag", tag: "ghost", whileAllyAlive: "niamh" },
    ],
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
