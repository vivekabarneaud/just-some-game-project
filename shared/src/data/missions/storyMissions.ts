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
  {
    id: "story_5_old_tongue",
    storyOrder: 5,
    prerequisite: "story_4_captains_rest",
    chapter: "Chapter 2: Our Own Hands",
    name: "North of the Road",
    description:
      "Edda needs more of the herb the robin's salve was made from. She has drawn a careful picture of it. The plant grows in Feldgrund hills, off the road, north and east. The road is long, the country is rough, and the people up there are private. Bring civility, and bring someone who can handle wolves.",
    icon: "🌾",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/the_old_tongue.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [
      { resource: "gold", amount: 80 },
      { resource: "greymantle", amount: 6 },
    ],
    deployCost: 12,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["exploration", "outdoor", "combat"],
    biome: "Forest",
    events: [
      // Outbound — wolves on the forest road. Warm-up fight.
      { type: "fixed", event: { kind: "combat", encounters: [{ enemyId: "wild_wolf", count: 3 }] } },
      // Outbound — the dangerous slot. Bear, brigands, or a heavier wolf pack.
      { type: "random", pool: [
        { weight: 2, event: { kind: "combat", encounters: [{ enemyId: "forest_bear", count: 1 }] } },
        { weight: 2, event: { kind: "combat", encounters: [{ enemyId: "bandit_thug", count: 3 }] } },
        { weight: 1, event: { kind: "combat", encounters: [{ enemyId: "wild_wolf", count: 3 }] } },
      ]},
      // Return — lighter. Stragglers, an angry bear, or a herder's thanks.
      { type: "random", pool: [
        { weight: 2, event: { kind: "combat", encounters: [{ enemyId: "bandit_thug", count: 2 }] } },
        { weight: 1, event: { kind: "combat", encounters: [{ enemyId: "forest_bear", count: 1 }] } },
        { weight: 1, event: { kind: "treasure", rewards: [{ resource: "wheat", amount: 10 }] } },
      ]},
      // Return — the peaks vision. Pure flavor, no mechanical effect.
      { type: "fixed", event: { kind: "encounter", text: "On a clear afternoon, the team crests a ridge.", outcomes: [
        { weight: 1, text: "The boy riding lead pulls up and looks for a long time. He had not believed mountains were real before he saw them.", effect: { type: "nothing" } },
      ]}},
    ],
    chronicleEntryId: "ch2_old_tongue",
  },
  {
    id: "story_6_broken_stone",
    storyOrder: 6,
    prerequisite: "story_5_old_tongue",
    chapter: "Chapter 2: Our Own Hands",
    name: "The Broken Stone",
    description:
      "A wounded dwarf at our gate. Three of her people are still down there, pinned around a broken stone south-east of here. The country has gone bad in a way no one warned us about. Ride hard. Bring them home if you can.",
    icon: "🪦",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/the_broken_stone.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 1800,
    rewards: [
      { resource: "gold", amount: 100 },
      { resource: "astralShards", amount: 1 },
    ],
    deployCost: 15,
    difficulty: 3,
    minGuildLevel: 1,
    tags: ["exploration", "combat", "magical"],
    encounters: [
      { enemyId: "wailing_phantom", count: 1 },
      { enemyId: "wraith", count: 2 },
      { enemyId: "cursed_spirit", count: 4 },
    ],
    chronicleEntryId: "ch2_broken_stone",
  },
  {
    id: "story_7_walking_the_line",
    storyOrder: 7,
    prerequisite: "story_6_broken_stone",
    chapter: "Chapter 2: Our Own Hands",
    name: "Walking the Line",
    description:
      "I have asked the team to walk the line. Map the stones. Mark which are standing and which have fallen. Bring back enough that I can see the shape of the thing we have apparently been sitting inside.",
    icon: "🗺️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/walking_the_line.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [
      { resource: "gold", amount: 80 },
      { resource: "astralShards", amount: 1 },
    ],
    deployCost: 12,
    difficulty: 3,
    minGuildLevel: 1,
    tags: ["exploration", "combat", "magical"],
    biome: "Thinning Edge",
    events: [
      // Event 1 — east intact stone (atmospheric, no combat)
      { type: "fixed", event: { kind: "encounter", text: "The east stone stands on a low ridge a day east of the settlement. The air around it is still in a way that does not feel empty.", outcomes: [
        { weight: 1, text: "The team approaches without difficulty. Birds rest at the base. They mark it standing on the parchment.", effect: { type: "nothing" } },
      ]}},
      // Event 2 — Ruins area, the two flanking broken stones. Random pool.
      { type: "random", pool: [
        { weight: 2, event: { kind: "combat", encounters: [{ enemyId: "wraith", count: 1 }, { enemyId: "cursed_spirit", count: 2 }] } },
        { weight: 1, event: { kind: "encounter", text: "The two stones flanking the Hilltop Ruins are broken and have been for a long time. Niamh's binding at the captain's grave still holds the worst of it down. The team passes through with eyes down.", outcomes: [
          { weight: 1, text: "Nothing rises. The Ruins stay quiet today. The team marks both stones and rides on.", effect: { type: "nothing" } },
        ]}},
        { weight: 1, event: { kind: "combat", encounters: [{ enemyId: "cursed_spirit", count: 3 }] } },
      ]},
      // Event 3 — west intact stone (atmospheric, no combat)
      { type: "fixed", event: { kind: "encounter", text: "The west stone stands beyond the line of any country the settlement has walked before. It hums faintly when the wind moves through the trees nearby.", outcomes: [
        { weight: 1, text: "The team marks it standing. The pattern is starting to make sense.", effect: { type: "nothing" } },
      ]}},
      // Event 4 — left X (deep west), hard combat at the new sabotaged stone
      { type: "fixed", event: { kind: "combat", encounters: [{ enemyId: "wailing_phantom", count: 1 }, { enemyId: "wraith", count: 1 }, { enemyId: "cursed_spirit", count: 3 }] } },
      // Event 5 — return home with the map (atmospheric wrap-up)
      { type: "fixed", event: { kind: "encounter", text: "On the seventh day the team rides for home with the parchment safe inside an oiled cloth. The country between them and the settlement runs gentle and quiet.", outcomes: [
        { weight: 1, text: "They eat well, sleep soundly, and ride through the gate at first light.", effect: { type: "nothing" } },
      ]}},
    ],
    chronicleEntryId: "ch2_walking_the_line",
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
