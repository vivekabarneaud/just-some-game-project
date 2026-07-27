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
  // ── Quarry-spider gate (the "dig deeper, wake worse things" loop). These are
  //    FORCED-ONLY: the unsatisfiable `requires` keeps them off the random board
  //    and the pinned pool; the engine's forceMission injects `clear_diggings_${N}`
  //    while quarry.level > quarrySpidersClearedLevel, and the quarry yields at the
  //    previous level until it's cleared. Short duration — it's right in the pit.
  //    XP-only (internal settlement defence; materials come off the spiders). Each
  //    higher level fields worse spiders. See docs/DESIGN_SPIDERS.md. ──
  {
    id: "clear_diggings_2",
    name: "Clear the Diggings",
    description: "The deeper cut woke something. Tomas came up white to the elbows saying the fresh face of the pit is boiling with spiders, hand-sized and legion, pouring out of a crack the picks opened. Nobody wants the stone badly enough to lose a hand for it. Send a couple down to stand with the crew and drive the things back into the dark. It is their rock; we only want the seam. Make it safe and the cutters can work the new depth.",
    icon: "🕷️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/clear_marshes.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 90, // right in the settlement's own pit — a quick response, not a trek
    rewards: [], // XP only; the yield unlock is the reward, materials come off the spiders
    deployCost: 3,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "survival"],
    encounters: [{ enemyId: "rock_skitter", count: 5 }],
    urgent: true, // distinct outline — it's blocking the quarry
    requires: { missionDone: "__quarry_spider_gate__" }, // sentinel: never met → forced-only
  },
  {
    id: "clear_diggings_3",
    name: "The Deeper Cut",
    description: "Deeper again, and the spiders came bigger. Tomas says the skittering ones still boil up in their tide, but among them now are the dog-sized spinners, slow and venomous, the kind that do not run. The crew have pulled back to the second gallery and will not go down until it is done. Send a team to hold the crew and clear the dark ahead of the picks. Same as before, only meaner: drive them down, do not chase them into their holes, and make the new seam safe to work.",
    icon: "🕷️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/clear_marshes.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 120,
    rewards: [],
    deployCost: 4,
    difficulty: 3,
    minGuildLevel: 1,
    tags: ["combat", "survival"],
    encounters: [{ enemyId: "rock_skitter", count: 3 }, { enemyId: "cave_spider", count: 2 }],
    urgent: true,
    requires: { missionDone: "__quarry_spider_gate__" }, // sentinel: never met → forced-only
  },
  // ── Wild Boar Hunt — FORCED on food scarcity (larder in deficit + nearly
  //    empty). The survival loop's answer to a food crisis: meat on four legs.
  //    Forced-only (sentinel requires); recurring (NOT unique) so it can return
  //    each time the food runs low. Rewards meat (a hunt legitimately does), plus
  //    the wild boar's own loot. See docs/DESIGN_TIER1_GEAR.md §Boar missions. ──
  {
    id: "wild_boar_hunt",
    name: "Lean Times",
    description: "The larder is down to scrapings and nothing is coming in. But Gareth came down off the watchtower swearing he had glassed a sounder of wild boar rooting the thornbrake past the old field: meat on four legs, enough to carry us a while yet. Send a team to bring some down before they move on. It is a fair hunt, not a cull. Take what the larder needs and let the rest run.",
    icon: "🐗",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/boar_hunt.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 300, // a hunt out past the old field — quick, the larder can't wait
    rewards: [{ resource: "meat", amount: 20 }],
    deployCost: 5,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "outdoor", "survival"],
    encounters: [{ enemyId: "wild_boar", count: 2 }],
    urgent: true, // distinct outline — the food crisis needs an answer now
    requires: { missionDone: "__forced_only__" }, // sentinel: never met → forced-only
  },

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

  // ── "The Bog Witch" front. Its opener, "Clear the Marshes" (marsh_clearing),
  //    was PROMOTED into the golden story spine (STORY_MISSIONS, Chapter 1 beat 4)
  //    on 2026-07-27 — it reads as the main questline now, not a side errand. It
  //    still opens this front: reeds_bargain gates on missionDone "marsh_clearing"
  //    (completedUniqueMissionIds), which the story mission still populates. ──
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
    deployItems: [{ resource: "wheat", amount: 5 }],
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
  // ── The routine, once the bargain is proven. Repeatable, deliberately light:
  //    no chronicle beat — it just establishes the pattern (a normal, safe trade)
  //    so the drift, when it comes later, lands against something familiar. ──
  {
    id: "fen_barter",
    name: "Tea at Aldith's",
    description: "The old woman keeps her bargain, and Edda's fenbalm stores run low again. Leave the grain at the flat stone, cut the herb, and not a snake will stir. Aldith, the gatherers call her now, and she will have whoever we send in for tea and send them home with a full belly besides. Routine now. Send someone to make the trade.",
    icon: "🍵",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/clear_marshes.png",
    slots: [{ class: "any" }],
    duration: 500,
    deployItems: [{ resource: "wheat", amount: 3 }],
    rewards: [{ resource: "fenbalm", amount: 4 }],
    deployCost: 2,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
    guaranteed: true,
    // Repeatable (not unique, no beat) — the safe recurring gather.
    requires: { missionDone: "reeds_bargain" },
  },
  // ── The drift. After the tea (fen_barter ×3, where she learns of Nell), the
  //    asking stops being grain and starts to read like a recipe: a precise,
  //    symbolic COUNT of humble parts she could not take herself, the number
  //    shrinking as the thing grows grimmer — three tusks, two hooves, one skull.
  //    Each is compliable on its own; the pattern is the horror. The chain fires
  //    ch1_reeds_tea before the tusks and ch1_reeds_doubt (the line drawn) after
  //    the skull. The dark descent is still deferred. ──
  {
    id: "reeds_tusks",
    name: "Three Tusks",
    description: "The old woman sent her asking back with the last of the fenbalm, and it is not grain this time. Three boar tusks, she wants, no more and no fewer, left at the flat stone by dark. Edda says the old have their cures and their charms and it is not for us to know the reason of them, so do as she asks and think nothing of it. I will send them, and gladly: we grind boar tusk for the salve against the froth, and there are shards enough in the store to spare her three. It is only the exactness of it, three and not four, that sits oddly with me.",
    icon: "🦷",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/clear_marshes.png",
    slots: [{ class: "any" }],
    duration: 500,
    deployItems: [{ resource: "tusk_shard", amount: 3 }],
    rewards: [{ resource: "fenbalm", amount: 5 }, { resource: "nettle", amount: 3 }],
    deployCost: 2,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
    guaranteed: true,
    requires: { missionCount: { id: "fen_barter", count: 3 } },
    unique: true,
    sideChain: { id: "the_bog_witch", name: "The Reeds" },
  },
  {
    id: "reeds_hooves",
    name: "Two Hooves",
    description: "The tusks went to the stone and the herb came home, and I had half forgotten it when her next asking came back. Two cloven hooves this time, off a boar, left at the flat stone by dark. Fewer than the tusks, and stranger. Edda still says think nothing of it, an old woman's remedy, and I want to believe her. I will send them, because the fenbalm keeps my people through the winter. But a body does not put hooves in a poultice, and I have started to wonder what she does put them in.",
    icon: "🐐",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/clear_marshes.png",
    slots: [{ class: "any" }],
    duration: 500,
    deployItems: [{ resource: "cloven_hoof", amount: 2 }],
    rewards: [{ resource: "fenbalm", amount: 5 }, { resource: "nettle", amount: 3 }],
    deployCost: 2,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
    guaranteed: true,
    requires: { missionDone: "reeds_tusks" },
    unique: true,
    sideChain: { id: "the_bog_witch", name: "The Reeds" },
  },
  {
    id: "reeds_skull",
    name: "One Skull",
    description: "And now the last of it, or so I will make it the last. One boar's skull, she wants, picked clean, left at the flat stone by dark. Three, then two, then one, and each thing worse than the last. This is no longer a remedy and we both know it, whatever Edda says. I will send the skull, this once, because I will not break faith over a thing that costs us nothing and leave my people short of fenbalm on a suspicion. But I mean to send word with it: grain, from here, and only grain. One more asking like this and we are done with the reeds.",
    icon: "💀",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/clear_marshes.png",
    slots: [{ class: "any" }],
    duration: 500,
    deployItems: [{ resource: "boar_skull", amount: 1 }],
    rewards: [{ resource: "fenbalm", amount: 5 }, { resource: "nettle", amount: 3 }],
    deployCost: 2,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
    guaranteed: true,
    requires: { missionDone: "reeds_hooves" },
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

  // ── "The Woodcutter" — Hester Ironbark's arrival. Its first two beats,
  //    "Run Down" (hester_rescue) and "No One Followed" (quiet_the_woods), were
  //    PROMOTED into the golden story spine (STORY_MISSIONS, Chapter 1 beats 2–3)
  //    on 2026-07-27, so they read as the main questline. Her quiet return +
  //    recruitment + the Woodworker unlock are handled by the "the_woodcutter"
  //    director chain (engine/story/chains.ts), which awaits those missions via
  //    completedUniqueMissionIds — still populated because both keep
  //    `unique: true`. See docs/cast/hester-ironbark.md. ──
  {
    id: "find_nell",
    name: "Where's Nell?",
    description: "Nell slipped away from Edda's herb beds sometime after breakfast, and no one has seen her since. She does not answer when she is called, she never has, and the woods run a long way south. We would all rest easier with someone out there who can follow a small pair of footprints through the summer grass before the light goes.",
    icon: "🧺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/first_patrol.png",
    slots: [{ class: "any" }],
    duration: 120, // our own south woods — a search before dusk, not a trek
    rewards: [{ resource: "berries", amount: 10 }], // the wild berries she'd gathered, brought home
    deployCost: 3,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["exploration", "peaceful"],
    guaranteed: true,
    // Opened by the worry beat (fired by the_strawberry_patch chain in summer,
    // year 2). The chain fires the "found" beat + the seed unlock on completion,
    // so this mission carries no chronicleEntryId of its own.
    requires: { chronicleFired: "ch2_nell_wandering" },
    unique: true,
    sideChain: { id: "the_strawberry_patch", name: "The Strawberry Patch" },
  },
  // ── "The Tollman's Road" — the road turns organized, and we take it back ──
  // Follows the merchant arc (gated on Cobb's first escort). Robbed → held → the
  // nest broken. Merciful throughout: we drive off, we do not slaughter; the
  // Tollman routs at 30% and his company scatters, and we bury no one. The camp
  // hoard (kept on the captain's rout) yields captains_steel → the Roadwarden
  // sword, and a lucky rare leather coat. Chronicle beats fire from the_tollmans_road.
  {
    id: "see_cobb_home",
    name: "See Cobb Home",
    description: "Cobb came in on foot, at dusk, with no wagon and no mules and no boots. They took the lot on the downriver road: the goods, the beasts, the coat off his back, and left him the walk. He is shaken more than hurt, and ashamed of the shaking. Walk him the rest of the way in, and go back down that road for whatever they dropped in their hurry. The men who did it are desperate, not cruel, but desperate men with a full haul do not scare easy. Go in pairs.",
    icon: "👞",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/merchant_escort.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 720,
    rewards: [{ resource: "gold", amount: 30 }, { resource: "pepper", amount: 2 }],
    deployCost: 8,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["outdoor", "combat", "escort"],
    encounters: [{ enemyId: "bandit_thug", count: 2 }],
    // Not the moment Cobb first arrives: let the road become a working thing first
    // (his first caravan escorted, then at least one more trader run) so the
    // robbery lands as an escalation, not an opening.
    requires: { missionCount: { id: "merchant_escort", count: 1 } },
    unique: true,
    sideChain: { id: "tollmans_road", name: "The Tollman's Road" },
  },
  {
    id: "hold_the_road",
    name: "Hold the Road",
    description: "Robbing Cobb taught them the road pays, and now they work it in earnest, turning back every trader who tries the downriver track to us. This does not mend by waiting. Ride down and meet them, and drive them off hard enough that the next wagon gets through, hard enough that they think twice before the one after. Driving off is the whole of it. We want the road open, not a pile of bodies at the boundary marker.",
    icon: "🛡️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/caravan_guard.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 900,
    rewards: [{ resource: "gold", amount: 45 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["outdoor", "combat"],
    encounters: [{ enemyId: "bandit_thug", count: 3 }],
    requires: { missionDone: "see_cobb_home" },
    unique: true,
    sideChain: { id: "tollmans_road", name: "The Tollman's Road" },
  },
  {
    id: "break_the_nest",
    name: "Break the Nest",
    description: "Driving them off the road only sends them home to whatever gully they hole up in, and they always come again. Brenna and the scouts followed the last lot back: a camp a half-day down, and a man at the head of it who set a price on our road and calls it a toll. Go and end the arrangement. Break the Tollman in front of his company and the company comes apart, for it is the toll they follow, not the man. Scare the rest off our country for good. What they stole is piled in that camp, ours and other folk's both, so bring it home. We would rather not bury any of them. We would rather they were simply gone.",
    icon: "🪖",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/bandit_camp.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 1500,
    rewards: [{ resource: "gold", amount: 60 }, { resource: "pepper", amount: 3 }, { resource: "cinnamon", amount: 4 }],
    deployCost: 15,
    difficulty: 3,
    minGuildLevel: 1,
    tags: ["outdoor", "combat"],
    encounters: [{ enemyId: "reaver_captain", count: 1 }, { enemyId: "bandit_thug", count: 2 }],
    requires: { missionDone: "hold_the_road" },
    unique: true,
    sideChain: { id: "tollmans_road", name: "The Tollman's Road" },
  },
];
