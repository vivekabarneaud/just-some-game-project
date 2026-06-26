import type { MissionTemplate } from "./types.js";

/**
 * Side-story chain missions.
 *
 * These are gated narrative beats (linked by `requires.missionDone` and story
 * gates), NOT generic tier content. They live here, out of the NOVICE/APPRENTICE/…
 * arrays, on purpose:
 *   - `getMissionRank()` returns undefined for them, so the board's rank-quota
 *     treats them like story/expedition missions: always ELIGIBLE when their
 *     gates open, never crowded out or filtered by the team's rank.
 *   - Each beat still carries its own `difficulty` (1-5), which is what actually
 *     sets the challenge (success threshold = difficulty × 8) and the board's
 *     appearance filter (a ★★★ beat won't surface until the team is strong
 *     enough). So a chain can escalate freely without being mis-filed under a tier.
 *   - Every beat carries `sideChain { id, name }` → the teal frame + banner.
 *
 * Add new chains here. See docs/DESIGN_ACT1_SETTING.md + docs/DESIGN_SIDE_STORIES.md.
 */
export const SIDE_CHAIN_MISSIONS: MissionTemplate[] = [
  // ── "The Maddened Herd" — rabid boars → the Tainted Spring ──
  {
    id: "bad_blood",
    name: "Bad Blood",
    description: "A boar came out of the tree line at dusk, foaming and wild, and tore through the vegetable rows before anyone could turn it. A sick beast, nothing more, but a sick beast with tusks. Put it down before it gores someone, and let the poor thing rest.",
    icon: "🐗",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/rabid_boar_hunt.png",
    slots: [{ class: "any" }],
    duration: 480,
    rewards: [{ resource: "gold", amount: 20 }, { resource: "meat", amount: 20 }],
    deployCost: 3,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "rabid_boar", count: 1 }],
    requires: { story: "story_1_scouting" },
    unique: true,
    sideChain: { id: "maddened_herd", name: "The Maddened Herd" },
  },
  {
    id: "bad_season_boars",
    name: "A Bad Season for Boars",
    description: "That makes the fourth this month, all of them frothing, all of them charging the fields instead of fleeing them. Boars do not sicken in numbers like this. Clear the ones that have come down from the tree line, and have someone keep a tally, because this is starting to feel like more than a bad season.",
    icon: "🐗",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/rabid_boar_hunt.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 540,
    rewards: [{ resource: "gold", amount: 30 }, { resource: "meat", amount: 25 }],
    deployCost: 5,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "rabid_boar", count: 3 }],
    requires: { missionDone: "bad_blood" },
    unique: true,
    sideChain: { id: "maddened_herd", name: "The Maddened Herd" },
  },
  {
    id: "what_scouts_saw",
    name: "What the Scouts Saw",
    description: "The scouts who walked the deep tree line came back short on nerve. The boars out there are worse: grey-mottled, weeping black, reeking of cold metal, and one took a spear clean through and kept coming as if it had not noticed dying. Whatever has taken them, they are past saving and in pain. Go and give them a clean end, before they wander down onto the trails where our people walk.",
    icon: "🐗",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/rabid_boar_hunt.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 720,
    rewards: [{ resource: "gold", amount: 45 }, { resource: "bristlehide", amount: 1 }],
    deployCost: 8,
    difficulty: 3,
    minGuildLevel: 1,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "tainted_boar", count: 2 }, { enemyId: "rabid_boar", count: 1 }],
    requires: { missionDone: "bad_season_boars", story: "story_2_ruins" },
    unique: true,
    sideChain: { id: "maddened_herd", name: "The Maddened Herd" },
  },
  {
    id: "reading_the_carcass",
    name: "Reading the Carcass",
    description: "We hauled one of the wrong ones back so it could be studied. The wizard turns it with a rod and will not touch it bare: the rot, they say, is not rot, it is the ground gone wrong, something pulled up from underneath. Father Corin stands a long while over the thing and says only that the beast did not rest easy. Both of them look the same way when they say it, upriver, to the old spring. Send them to be sure.",
    icon: "🕯️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/rabid_boar_hunt.png",
    slots: [{ class: "wizard", required: true }, { class: "any" }],
    duration: 120,
    rewards: [{ resource: "gold", amount: 15 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["exploration", "peaceful"],
    guaranteed: true,
    requires: { missionDone: "what_scouts_saw", story: "story_4_captains_rest" },
    unique: true,
    sideChain: { id: "maddened_herd", name: "The Maddened Herd" },
    npcAlly: { npcId: "corin", passive: true },
  },
  {
    id: "tainted_spring",
    name: "The Tainted Spring",
    description: "The trail the wizard and Father Corin pointed to ends at a spring in the deep wood, glowing faint and wrong, the water tasting of cold metal, the ground around it grey and dead. This is where the boars drank. The worst of them has denned by the water, a great patriarch more than half turned, and it will not let anyone near. We cannot make the water clean again, not with what we have. Put down what the spring has ruined, then cap the spring and mark it wide, so nothing drinks here again. We hold this; we do not win it.",
    icon: "💧",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/enchanted_spring.png",
    slots: [{ class: "wizard", required: true }, { class: "any" }, { class: "any" }],
    duration: 900,
    rewards: [{ resource: "gold", amount: 70 }, { resource: "astralShards", amount: 1 }],
    deployCost: 12,
    difficulty: 3,
    minGuildLevel: 1,
    tags: ["combat", "magical", "outdoor"],
    encounters: [{ enemyId: "tainted_patriarch_boar", count: 1 }, { enemyId: "tainted_boar", count: 2 }],
    requires: { missionDone: "reading_the_carcass" },
    unique: true,
    sideChain: { id: "maddened_herd", name: "The Maddened Herd" },
  },

  // ── "The Bog Witch" front — UNTAGGED on purpose (no sideChain banner): reads
  //    as an ordinary errand. Its completion is the hook that later opens
  //    "The Cabin in the Reeds." Full chain design in docs/DESIGN_SIDE_STORIES.md. ──
  {
    id: "marsh_clearing",
    name: "Clear the Marshes",
    description: "Edda needs fenbalm before the winter fevers come, and it grows nowhere but the wet ground past the reeds. The trouble is the adders, long as a man and quick to strike, that have made the fen their own. We will not put a marsh to the sword for being a marsh. Walk Edda's gatherers in along the firm ground, keep them whole while they cut what they need, turn back the snakes that come at you, and leave the fen to its keepers.",
    icon: "🐍",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/clear_marshes.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 700,
    rewards: [{ resource: "fenbalm", amount: 4 }, { resource: "nettle", amount: 4 }, { resource: "gold", amount: 40 }],
    deployCost: 5,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "outdoor", "escort"],
    encounters: [{ enemyId: "marsh_adder", count: 3 }],
    requires: { story: "story_1_scouting" },
    unique: true,
  },
];
