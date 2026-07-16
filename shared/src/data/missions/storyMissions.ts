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
    // The first story mission is the gate to the whole next quest wave
    // (Woodworker, Walls, story_2). Kept short (3 min) so the opening loop
    // closes fast and the camp doesn't sit idle waiting on it. Later missions
    // stretch back out to 10+ min.
    duration: 180,
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
    name: "The Old Watch",
    description:
      "The old watch your scouts mapped. Stone foundations, a half-standing tower, a collapsed well: the work of someone who built to last. They still failed. Send a team in to walk it and haul back what stone is worth carrying. No enemy that we know of, only whatever a dead place keeps. Tell them to note anything they cannot explain, and not to linger past dark.",
    icon: "🏚️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/hilltop_ruins.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 300,
    rewards: [
      { resource: "gold", amount: 80 },
      { resource: "stone", amount: 60 },
    ],
    deployCost: 10,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["exploration"],
    // A full team walks the dead place and hauls the stone home; too few and they
    // get spooked and come back with nothing. 1 of 2 slots = 50%, 2 of 2 = 100%.
    teamSizeSuccess: true,
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
    // The team can't hurt ghosts yet (no binding until Niamh, story_4). This is
    // a DISCOVERY: they meet the dead, steel does nothing. Completion rides on
    // headcount, not on winning the fight (which is impossible): a full team of
    // 3 gets the knowledge home (100%), too few and they scatter and return
    // empty-handed and wounded. Discovery keeps it permadeath-free either way.
    discoveryMission: true,
    teamSizeSuccess: true,
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
    // Interim alpha tuning: trimmed from boss + 3 wraiths + 5 spirits (an
    // untuned engine-test load) down to boss + 1 wraith + 3 spirits, so a
    // leveled team can win by protecting Niamh. Real Hale tuning comes when the
    // story thread authors him (captain_hale_stub is still a stub).
    encounters: [
      { enemyId: "captain_hale_stub", count: 1 },
      { enemyId: "wraith", count: 1 },
      { enemyId: "cursed_spirit", count: 3 },
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
        { weight: 1, event: { kind: "encounter", text: "The two stones flanking the old watch stand whole, the south one seamed with old mending. The ground between them is quiet. The ground south of their reach is not. The team passes the line of their protection with eyes down.", outcomes: [
          { weight: 1, text: "Nothing rises. The old watch stays quiet today. The team marks both stones and rides on.", effect: { type: "nothing" } },
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
  {
    id: "story_8_silver_birches",
    storyOrder: 8,
    prerequisite: "story_7_walking_the_line",
    chapter: "Chapter 2: Our Own Hands",
    name: "The Silver Birches",
    description:
      "Niamh is at the silver birches, three days east. The robin says she will not be there long. Send two riders, polite and quiet. The road is mostly safe but not all. Bring her home if she will come.",
    icon: "🌲",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/the_silver_birches.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1500,
    rewards: [
      { resource: "gold", amount: 60 },
      { resource: "astralShards", amount: 1 },
    ],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["exploration"],
    encounters: [
      { enemyId: "wild_wolf", count: 3 },
    ],
    chronicleEntryId: "ch2_silver_birches",
  },
  {
    id: "story_9_first_inch",
    storyOrder: 9,
    prerequisite: "story_8_silver_birches",
    chapter: "Chapter 2: Our Own Hands",
    name: "The First Inch",
    description:
      "Niamh meets us at the eastern broken stone in eight days. She will mend it. We are to keep her alive while she works. Send three. Bring everything we have.",
    icon: "🗿",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/the_first_inch.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 1800,
    rewards: [
      { resource: "gold", amount: 100 },
      { resource: "astralShards", amount: 1 },
    ],
    deployCost: 15,
    difficulty: 3,
    minGuildLevel: 1,
    tags: ["combat", "magical", "escort"],
    encounters: [
      { enemyId: "wailing_phantom", count: 1 },
      { enemyId: "wraith", count: 2 },
      { enemyId: "cursed_spirit", count: 5 },
    ],
    npcAlly: {
      npcId: "niamh",
      deathFailsMission: true,
      passive: true,
      baseThreatVsTag: { ghost: 80 },
    },
    modifiers: [
      { type: "physical_pierces_tag", tag: "ghost", whileAllyAlive: "niamh" },
    ],
    chronicleEntryId: "ch2_first_inch",
  },
  {
    id: "story_10_post_the_line",
    storyOrder: 10,
    prerequisite: "story_9_first_inch",
    chapter: "Chapter 3: Hands Beside Ours",
    name: "Post the Line",
    description:
      "Stones break. We cannot stop them from breaking. We can mark the line above them, so that whoever walks this country after us knows what we have learned. Send a team with stakes, rope, and a pot of red paint. Mark the boundary above every stone we have found, intact or broken.",
    icon: "🪧",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/post_the_line.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2100,
    rewards: [
      { resource: "gold", amount: 50 },
      { resource: "wood", amount: 10 },
    ],
    deployCost: 8,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["exploration"],
    biome: "Outer Belt",
    events: [
      // Event 1 — Ruins area: post markers above the two intact flanking stones
      { type: "fixed", event: { kind: "encounter", text: "The team works first at the two stones that flank the watchtower. The grass is long and the country has gone quiet again with summer.", outcomes: [
        { weight: 1, text: "They post markers in the long grass between the two stones, three to the north of each, well clear of the ruins themselves.", effect: { type: "nothing" } },
      ]}},
      // Event 2 — East intact + dwarves' mended stone. Random pool: env or light wolves.
      { type: "random", pool: [
        { weight: 2, event: { kind: "encounter", text: "They ride east and post markers above the east intact stone and the dwarves' mended stone. Birds are at the base of the mended one that were not at the base in summer. The team marks the line anyway.", outcomes: [
          { weight: 1, text: "We do not yet trust permanence.", effect: { type: "nothing" } },
        ]}},
        { weight: 1, event: { kind: "combat", encounters: [{ enemyId: "wild_wolf", count: 3 }] } },
      ]},
      // Event 3 — west intact stone (atmospheric)
      { type: "fixed", event: { kind: "encounter", text: "They turn west on the fifth day and post markers above the west intact stone without incident.", outcomes: [
        { weight: 1, text: "The line is taking shape on the parchment.", effect: { type: "nothing" } },
      ]}},
      // Event 4 — deep-west broken stone: voice-retreat beat. No combat; the team pulls back.
      { type: "fixed", event: { kind: "encounter", text: "Further west still, where the parchment showed the deep-west broken stone, the team approached the place we had drawn for them on the map and stopped before they reached it. The voices were closer than they had been when our team walked that ground last.", outcomes: [
        { weight: 1, text: "The team retreated a half-mile and posted the stake-line there instead, north of where the parchment had said. They marked the stake differently — a small notch above the red line — and wrote a note on the parchment: the line is a half-mile north of where we drew it last time.", effect: { type: "nothing" } },
      ]}},
    ],
    chronicleEntryId: "ch3_post_the_line",
  },
  {
    id: "story_11_second_inch",
    storyOrder: 11,
    prerequisite: "story_10_post_the_line",
    chapter: "Chapter 3: Hands Beside Ours",
    name: "The Second Inch",
    description:
      "Niamh returns with what she needs. The deep-west stone is the next one we can reach. The team rides west with her in three days. Bring the salve we have, and bring three you trust to keep her standing while she works.",
    icon: "🗿",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/the_second_inch.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [
      { resource: "gold", amount: 100 },
      { resource: "astralShards", amount: 1 },
    ],
    deployCost: 15,
    difficulty: 4,
    minGuildLevel: 1,
    tags: ["combat", "magical", "escort"],
    encounters: [
      { enemyId: "wailing_phantom", count: 1 },
      { enemyId: "wraith", count: 3 },
      { enemyId: "cursed_spirit", count: 4 },
    ],
    npcAlly: {
      npcId: "niamh",
      deathFailsMission: true,
      passive: true,
      baseThreatVsTag: { ghost: 80 },
    },
    modifiers: [
      { type: "physical_pierces_tag", tag: "ghost", whileAllyAlive: "niamh" },
    ],
    chronicleEntryId: "ch3_second_inch",
  },
  {
    id: "story_13_hand_that_broke_it",
    storyOrder: 13,
    prerequisite: "story_11_second_inch",
    prerequisiteQuest: "watch_the_walls",
    chapter: "Chapter 4: The Hand That Broke It",
    name: "The Hand That Broke It",
    description:
      "Niamh has come back from the north with a fresh case and very little patience for waiting. She wants to mend the broken stone east of the markers before the trail grows colder. Send three to ride with her. Bring what we have.",
    icon: "🪨",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/the_hand_that_broke_it.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2100,
    rewards: [
      { resource: "gold", amount: 100 },
      { resource: "astralShards", amount: 1 },
    ],
    deployCost: 15,
    difficulty: 4,
    minGuildLevel: 1,
    tags: ["combat", "magical", "escort"],
    encounters: [
      { enemyId: "wailing_phantom", count: 1 },
      { enemyId: "wraith", count: 3 },
      { enemyId: "cursed_spirit", count: 4 },
    ],
    npcAlly: {
      npcId: "niamh",
      deathFailsMission: true,
      passive: true,
      baseThreatVsTag: { ghost: 80 },
    },
    modifiers: [
      { type: "physical_pierces_tag", tag: "ghost", whileAllyAlive: "niamh" },
    ],
    chronicleEntryId: "ch4_hand_that_broke_it",
    // Bridge chronicles that follow story 13's completion. These should ideally
    // be paced over game-time (breath ~1 game-week later, Three nights ~1 week
    // after that), but the pacing mechanism does not yet exist. For now all
    // three chronicles fire at once on story 13 completion. The narrative
    // closes chapter 4 on the cliffhanger of the incoming Cult raid (story 14
    // remains undrafted).
    additionalChronicleEntryIds: ["ch4_what_the_margin_holds", "ch4_three_nights"],
  },
];

/** Get the next story mission that is currently locked specifically by a quest
 *  prerequisite — i.e. the player has met the prior-mission prerequisite and
 *  the guild-level requirement, but a parallel quest must still complete. Used
 *  by the UI to render a "???" placeholder card with the unlock hint. Returns
 *  null when no quest-locked story mission is next in line (which means either
 *  the current story mission is unlocked normally, or the chain has run out). */
export function getLockedStoryMission(
  guildLevel: number,
  completedStoryMissions: readonly string[],
  completedQuests: readonly string[] = [],
): { mission: StoryMission; lockedByQuest: string } | null {
  const completed = new Set(completedStoryMissions);
  const quests = new Set(completedQuests);
  for (const m of STORY_MISSIONS) {
    if (completed.has(m.id)) continue;
    if (m.minGuildLevel > guildLevel) return null;
    if (m.prerequisite && !completed.has(m.prerequisite)) return null;
    if (m.prerequisiteQuest && !quests.has(m.prerequisiteQuest)) {
      return { mission: m, lockedByQuest: m.prerequisiteQuest };
    }
    return null; // story mission is unlocked normally; no locked card to show
  }
  return null;
}

/** Get the current story mission available to the player, or null */
export function getCurrentStoryMission(
  guildLevel: number,
  completedStoryMissions: string[],
  completedQuests: readonly string[] = [],
): StoryMission | null {
  const completed = new Set(completedStoryMissions);
  const quests = new Set(completedQuests);
  for (const m of STORY_MISSIONS) {
    if (completed.has(m.id)) continue;
    if (m.minGuildLevel > guildLevel) return null;
    if (m.prerequisite && !completed.has(m.prerequisite)) return null;
    if (m.prerequisiteQuest && !quests.has(m.prerequisiteQuest)) return null;
    return m;
  }
  return null;
}
