import type { StoryMission } from "./types";

export const STORY_MISSIONS: StoryMission[] = [
  {
    id: "story_1_scouting",
    storyOrder: 1,
    chapter: "Chapter 1: Ashes and Dust",
    name: "Scouting the Surroundings",
    description:
      "Time to find out what's around us. Send scouts to map the area — water sources, game trails, anything useful. And anything dangerous.",
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
    lore: "Your scouts return with a rough map and one unexpected finding: about a day's march south, on a hilltop, there are ruins. Stone foundations, a collapsed well, and a tower still partially standing. Whoever was here before you, they were organized. Military, maybe. And they left.",
  },
  {
    id: "story_2_ruins",
    storyOrder: 2,
    prerequisite: "story_1_scouting",
    chapter: "Chapter 1: Ashes and Dust",
    name: "The Hilltop Ruins",
    description:
      "Those ruins your scouts found — they need a closer look. Send a team to search the buildings. Bring someone who can handle a fight. Whatever drove the previous settlers out might still be there.",
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
    lore: "The ruins were a Dominion outpost — military cots, a collapsed armory, patrol logs carved into the walls. The last entry reads: 'Day 47. The whispering won't stop. Maren heard her name. We are leaving at dawn.' Below it, scratched in a different hand: 'They didn't all leave.' Your team also found bones. Not old bones. And a journal, water-damaged but partially legible. It mentions a 'dark treeline to the south where the birds don't sing.'",
  },
  {
    id: "story_3_dark_treeline",
    storyOrder: 3,
    prerequisite: "story_2_ruins",
    chapter: "Chapter 1: Ashes and Dust",
    name: "The Silent Forest",
    description:
      "The journal from the ruins mentions a treeline to the south where 'the birds don't sing.' Your scouts confirmed it — a stretch of forest where everything is quiet. Too quiet. Investigate, but be careful.",
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
    lore: "The forest is dying from the inside. Trees stand upright but the wood is grey, brittle, and cold to the touch. No insects. No birds. The ground feels wrong — soft, like walking on something that used to be alive.\n\nYour team pushed half a mile in before the air changed. A taste of copper. A pressure behind the eyes. And then the whispers — fragments of sentences in voices too faint to identify. One of your adventurers swears she heard her own mother, who died years ago.\n\nThey pulled back. At the treeline, looking south, they could see where the grey expands — miles of dead forest stretching toward the horizon. Whatever this is, it's not a local problem. It's a boundary. And it's closer than anyone told you it would be.",
  },
  {
    id: "story_4_thornveil_ranger",
    storyOrder: 4,
    prerequisite: "story_3_dark_treeline",
    chapter: "Chapter 2: The Boundary",
    name: "A Ranger's Warning",
    description:
      "A stranger arrived at dawn — a Thornveil Ranger, hooded and armed, asking to speak with whoever's in charge. She says she's been watching your settlement. She says you need to hear what she knows.",
    icon: "🌿",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/rangers_warning.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1500,
    rewards: [
      { resource: "gold", amount: 120 },
      { resource: "food", amount: 80 },
    ],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["exploration", "outdoor"],
    encounters: [{ enemyId: "wild_wolf", count: 2 }, { enemyId: "orc_warrior", count: 1 }],
    lore: "Her name is Kess. She's a Thornveil Ranger — one of the people who patrol the ancient ward-line between the living world and the Hollow Wastes.\n\nShe tells you bluntly: you built your settlement closer to the Wastes than you realize. The dead forest you found is the boundary's edge — and it's moving north. Slowly, but steadily. Each year it swallows a few more miles.\n\n'The Dominion didn't mention that in the land grants, did they?' she says.\n\nShe explains the wards — ancient stones that hold the boundary in place. The Thornveil maintains them. But they're failing. Too few druids, too much ground to cover, and the boundary pushes harder every year.\n\nShe offers a deal: help her reinforce the nearest ward-stone, and she'll teach your people what she knows about the Wastes. Refuse, and she'll move on. The boundary doesn't negotiate.\n\nYou notice she carries a blade etched with faintly glowing runes. When you ask about it, she says: 'Spirit-touched. For when the dead don't stay dead.'",
  },
  {
    id: "story_5_ward_stone",
    storyOrder: 5,
    prerequisite: "story_4_thornveil_ranger",
    chapter: "Chapter 2: The Boundary",
    name: "The Cracked Ward-Stone",
    description:
      "Kess leads you to the nearest ward-stone — a moss-covered monolith in a forest clearing. It's cracked. The runes are fading. She says it needs to be cleansed and reactivated. The dead know when a ward weakens. They'll come.",
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
    lore: "The ritual took hours. Your wizard channeled Aether into the stone while Kess chanted in a language older than the Dominion. The runes flickered, dimmed, and finally held — a faint blue glow that pushed back the grey.\n\nThe dead came, as she predicted. Not with malice — with confusion. Spirits that didn't understand why they were there, drawn to the weakening boundary like moths to a crack of light. Your team fought them off while the ritual completed.\n\nAfterward, Kess sat against the stone and told you what the Thornveil knows: the world is dying. Not today, not this year, but steadily. The god of death was destroyed thousands of years ago, and without him, the boundary between the living and the dead is failing.\n\n'Everyone has a theory,' she says. 'The Church says stop using magic. The Cult says resurrect the dead god. The Dominion says there's no problem. My people just patch the wards and hope someone smarter comes along.'\n\nShe looks at you. 'You're building something here. That takes a certain kind of stubborn. We could use stubborn.'",
  },
  {
    id: "story_6_the_robin",
    storyOrder: 6,
    prerequisite: "story_5_ward_stone",
    chapter: "Chapter 2: The Boundary",
    name: "The Robin's Message",
    description:
      "A robin landed on your settlement's watchtower this morning. Just a bird — except it carried a tiny scroll, sealed with wax that shimmered faintly. The seal bears no sigil. The handwriting inside is precise but shaky, as if written by someone very old or very tired.",
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
    lore: "The scroll read:\n\n'I have watched your settlement for some time. You reinforce wards. You fight what comes through. You ask questions instead of praying for answers. This is rare.\n\nI will not insult you with false hope. The boundary is failing. The wards slow the collapse but cannot stop it. The Thornveil are brave but they are bailing water from a sinking ship.\n\nI have spent a very long time studying why the ship is sinking. I know the problem. I do not yet know the solution. But I believe the answer is close — closer than it has been in millennia.\n\nI cannot come to you. I am old, and there are those who hunt me. But I am sending you something — a map to a place the Dominion has forgotten. What you find there may change what you understand about this world.\n\nFollow the robin when it flies south. It knows the way.\n\n— H.F.'\n\nKess, reading over your shoulder, frowns. 'A robin? The Thornveil elders say she used ravens.' A pause. Then understanding: 'She changed. Because someone was intercepting the ravens.'\n\nShe looks at you. 'H.F. Halldora Frostvik. They say she was alive before the Dominion existed. They say she knows why the world is broken.'\n\nThe robin is still perched on the watchtower. Small, ordinary, easily overlooked. It tilts its head at you. Waiting.",
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
