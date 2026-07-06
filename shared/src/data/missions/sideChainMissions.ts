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
    duration: 60, // a boar in the vegetable rows — it's right here, not a trek
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
    description: "We hauled one of the wrong ones back so it could be studied. The priest turns it with a rod and will not touch it bare: the rot, they say, is not rot, it is the ground gone wrong, something pulled up from underneath. Father Corin stands a long while over the thing and says only that the beast did not rest easy. Both of them look the same way when they say it, upriver, to the old spring. Send them to be sure.",
    icon: "🕯️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/rabid_boar_hunt.png",
    slots: [{ class: "priest", required: true }, { class: "any" }],
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
    description: "The trail the priest and Father Corin pointed to ends at a spring in the deep wood, glowing faint and wrong, the water tasting of cold metal, the ground around it grey and dead. This is where the boars drank. The worst of them has denned by the water, a great patriarch more than half turned, and it will not let anyone near. We cannot make the water clean again, not with what we have. Put down what the spring has ruined, then cap the spring and mark it wide, so nothing drinks here again. We hold this; we do not win it.",
    icon: "💧",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/enchanted_spring.png",
    slots: [{ class: "priest", required: true }, { class: "any" }, { class: "any" }],
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
    // Pinned so the hook reliably appears, but WITHOUT a chain banner — it must
    // read as an ordinary herb-errand. The_bog_witch chain fires the beat on it.
    pinned: true,
  },
  // ── The bog-witch front, step 2: the bargain. After clearing the adders once,
  //    a voice in the reeds offered terms. Bring the offering and the gatherers
  //    walk safe — a non-combat barter. (The_bog_witch chain fires the beats.) ──
  {
    id: "reeds_bargain",
    name: "The Reeds' Price",
    description: "The old woman in the reeds kept her word before, so Edda says: leave what she asked at the flat stone by the water, and the adders will let the gatherers cut fenbalm in peace. A strange arrangement, and I do not much like owing a marsh. But it is cheaper than sending armed men every time the fevers come. Take her offering in, leave it where she said, and bring the herb home. No blades needed, if she is honest.",
    icon: "🕯️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/clear_marshes.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 600,
    deployItems: [{ resource: "wheat", amount: 20 }],
    rewards: [{ resource: "fenbalm", amount: 5 }, { resource: "nettle", amount: 3 }],
    deployCost: 3,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
    guaranteed: true,
    requires: { missionDone: "marsh_clearing" },
    unique: true,
    sideChain: { id: "the_bog_witch", name: "The Reeds" },
  },

  // ── Recruitment quest: save the hunted gambler → Edmund + Elspeth join ──
  //    (recruitsOnSuccess; Elspeth gives the plea, both join on the win.) ──
  {
    id: "a_mothers_errand",
    name: "A Mother's Errand",
    description: "A woman came to the gate before dawn, grey-faced and giving no name, only this: her son is cornered at the old ford, a pack of men closing in over money he won that he maybe should not have. She cannot reach him in time, and she is begging. Whatever he did or did not do at the table, no one deserves to be beaten to death over a hand of cards. Get there, drive them off, and bring the fool home. His mother will not leave the gate until you do.",
    icon: "🃏",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 600,
    rewards: [{ resource: "gold", amount: 20 }],
    recruitsOnSuccess: ["char_009", "char_007"],
    deployCost: 5,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "escort"],
    // Hired toughs over a card debt (Dominion Toughs), not desperate displaced
    // farmers — fits the fiction, and they're weaker in a pack.
    encounters: [{ enemyId: "dominion_thug", count: 3 }],
    // "The haven's name spreads." Gated on tavern reputation, not just a built
    // tavern — the hunted only come once the settlement is genuinely running as a
    // waystation (ale, staffing, a full house are what build reputation). Placeholder 40.
    requires: { tavernReputation: 40 },
    unique: true,
  },

  // ── "The Woodcutter" — Hester Ironbark's arrival, Beat 1 (the rescue) ──
  //    Gareth-driven field rescue of a woman run down by the foreman's crew.
  //    She is deliberately NOT recruited here (no recruitsOnSuccess): she flees
  //    the moment she's free. Completing this records missionDone "hester_rescue",
  //    which later gates Beat 2 — her peaceful return + recruitment + the
  //    Woodworker unlock (see docs/cast/hester-ironbark.md). The crew reuse the
  //    bandit enemies; the team subdues them (drive-off-don't-slaughter ethic)
  //    and lets them go. ──
  {
    id: "hester_rescue",
    name: "Run Down",
    description: "Gareth came back from the south trees with his jaw set in a way we have learned not to argue with. A woman, alone, run down through the brush by a pack of men the way you would course a deer. We do not know her, and we do not know what she did to set a mob on her heels. But we know what many against one looks like, and we did not come to the edge of the world to look away from it. Go down there. Put the men on their knees, not in the ground, and send them off with nothing but a story to tell. Let the woman go where she will.",
    icon: "🪓",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/hester_rescue.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 180, // a rescue in the south trees, close to home — not a trek
    rewards: [{ resource: "gold", amount: 45 }],
    deployCost: 6,
    difficulty: 2,
    // Guild Lv.1 (was 2): the story gate (Old Watch done) is the real pacing
    // lever — a guild-2 requirement on top was silently withholding the whole
    // Hester → Woodworker chain from players who hadn't upgraded the guild yet.
    minGuildLevel: 1,
    tags: ["combat", "outdoor"],
    // A mob of hired toughs, not organized bandits — many but weak, so it reads
    // as a novice-tier fight (2 stars) rather than a real brigand engagement.
    encounters: [{ enemyId: "dominion_thug", count: 5 }],
    requires: { story: "story_2_ruins" },
    unique: true,
    sideChain: { id: "the_woodcutter", name: "The Woodcutter" },
    chronicleEntryId: "ch1_hester_rescue", // Beat 1: she flees, "murderer" hangs
  },
  // ── "The Woodcutter" Beat 1.5 — the uneasy patrol (paces Beat 2) ──
  //    Only appears AFTER the rescue (requires hester_rescue), so it guarantees
  //    a gap. The camp is rattled — armed men in their woods, a hunted stranger
  //    loose — so the team walks the approaches. No real threat (the relief of
  //    a quiet wood; one lone wolf so combat still resolves). Its completion
  //    fires the ghost-puzzle chronicle (Beat 2a) and starts the timed return.
  {
    id: "quiet_the_woods",
    name: "No One Followed",
    description: "The chase left us uneasy. We put those men on their knees and let them walk, but they were armed and in our woods, and the woman we pulled out of it went into the trees without a word, a price on her we cannot guess and one word hanging off her we cannot unhear. Nobody says it plainly. Nobody sleeps easy either. Walk the approaches. Make sure that crew kept moving, that nothing and no one followed us home, and come back able to tell the camp the woods are quiet. That is all we want to hear.",
    icon: "🌲",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/first_patrol.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 180, // our own approaches — a short walk, not a trek
    rewards: [{ resource: "wood", amount: 20 }, { resource: "meat", amount: 10 }],
    deployCost: 4,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor", "survival"],
    encounters: [{ enemyId: "wild_wolf", count: 1 }],
    requires: { missionDone: "hester_rescue" },
    unique: true,
    sideChain: { id: "the_woodcutter", name: "The Woodcutter" },
    chronicleEntryId: "ch1_woodcutter_ghost", // Beat 2a: the ghost puzzle
  },
];
