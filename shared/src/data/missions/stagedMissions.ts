import type { MissionTemplate } from "./types.js";

/**
 * The holding pen.
 *
 * Old placeholder missions pulled off the active board to keep the slate
 * clean while we give Act 1 missions real meaning. Each is marked
 * `staged: true`, so:
 *   - getMission() STILL resolves them (a save mid-flight won't break), but
 *   - generateMissionBoard() NEVER puts them on the board.
 *
 * To bring one back: move its entry into the right tier array
 * (noviceMissions.ts etc.), drop the `staged` flag, and rework the text so it
 * fits the world (see docs/DESIGN_ACT1_SETTING.md — the 6 mission categories).
 *
 * Why parked (2026-06-22):
 *   - boar_hunt          replaced by the "Bad Water" boar chain (bad_blood →
 *                        bad_season_boars → what_scouts_saw → … → the spring);
 *                        its text also leaked the cause + misplaced the Wastes.
 *   - tavern_intel       generic "gather rumors"; reframe as frontier news (④).
 *   - wilderness_trek    generic "survive a week"; also carried a stray rat.
 *   - smuggler_deal      "docks"/smuggling overstate an isolated frontier.
 *   - goblin_shaman_camp goblins deferred to a later tier (Act 1 stays beasts
 *                        + dead).
 */
export const STAGED_MISSIONS: MissionTemplate[] = [
  {
    id: "boar_hunt",
    name: "Rabid Boar Hunt",
    description: "Something in the water near the Wastes is driving the boars mad. One charged through the vegetable gardens last night. Time to put it down before the herd follows.",
    icon: "🐗",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/rabid_boar_hunt.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 500,
    rewards: [{ resource: "meat", amount: 50 }],
    deployCost: 3,
    difficulty: 3,
    minGuildLevel: 1,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "rabid_boar", count: 1 }],
    staged: true,
  },
  {
    id: "tavern_intel",
    name: "Tavern Intelligence",
    description: "Gather rumors and secrets from the local tavern. A sharp ear and a loose tongue go a long way.",
    icon: "🍺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/tavern_intel.png",
    slots: [{ class: "any" }],
    duration: 480,
    rewards: [{ resource: "gold", amount: 25 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["spying"],
    staged: true,
  },
  {
    id: "wilderness_trek",
    name: "Wilderness Trek",
    description: "Survive a week in the untamed wilds. Return with whatever you can forage and hunt.",
    icon: "🏕️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/wilderness_trek.png",
    slots: [{ class: "archer" }, { class: "any" }],
    duration: 1500,
    rewards: [{ resource: "meat", amount: 80 }, { resource: "mushrooms", amount: 40 }, { resource: "berries", amount: 30 }, { resource: "wood", amount: 60 }],
    deployCost: 10,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["survival", "outdoor"],
    encounters: [{ enemyId: "wild_wolf", count: 1 }, { enemyId: "giant_rat", count: 1 }],
    staged: true,
  },
  {
    id: "smuggler_deal",
    name: "Smuggler's Deal",
    description: "Meet a shady contact at the docks. They have rare goods, if the price is right and no one follows.",
    icon: "🌙",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/smuggler_deal.png",
    slots: [{ class: "assassin" }, { class: "any" }],
    duration: 900,
    rewards: [{ resource: "gold", amount: 70 }, { resource: "stone", amount: 50 }, { resource: "wood", amount: 50 }],
    deployCost: 15,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["stealth", "spying"],
    staged: true,
  },
  {
    id: "goblin_shaman_camp",
    name: "The Shaman's Hex",
    description: "Livestock are sickening. Crops are wilting in one specific field. The trail leads to a goblin camp with a shaman who's been hexing your settlement for sport.",
    icon: "🧙",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/shamans_hex.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1000,
    rewards: [{ resource: "gold", amount: 60 }, { resource: "chamomile", amount: 4 }, { resource: "mugwort", amount: 3 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "magical"],
    encounters: [{ enemyId: "goblin_shaman", count: 2 }, { enemyId: "goblin_scout", count: 3 }],
    staged: true,
  },
];
