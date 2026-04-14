import type { AdventurerClass, Adventurer, AdventurerStats } from "./adventurers";
import { calcStats } from "./adventurers";
import { getEquipmentStats } from "./items";
import { getHerb } from "./herbs";

// ─── Mission types ──────────────────────────────────────────────

export type RewardType = "gold" | "wood" | "stone" | "food" | "astralShards"
  | "chamomile" | "mugwort" | "nettle" | "nightbloom" | "moonpetal"; // herbs

export interface MissionReward {
  resource: RewardType;
  amount: number;
}

export interface MissionSlot {
  class: AdventurerClass | "any"; // "any" means any class fills it
  required?: boolean; // if true, must be filled with the specified class to deploy
}

export type MissionTag = "combat" | "exploration" | "magical" | "outdoor" | "stealth" | "escort" | "spying" | "assassination" | "dungeon" | "survival";

export interface MissionEncounter {
  enemyId: string;
  count: number;
}

export interface MissionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  slots: MissionSlot[];
  duration: number; // game-seconds
  rewards: MissionReward[];
  deployCost: number; // gold to send the team
  difficulty: 1 | 2 | 3 | 4 | 5;
  minGuildLevel: number;
  tags: MissionTag[];
  image?: string; // optional mission illustration
  encounters?: MissionEncounter[]; // enemies faced during the mission
  guaranteed?: boolean; // always ~98% success regardless of stats
}

export interface ActiveMission {
  missionId: string;
  adventurerIds: string[];
  remaining: number; // game-seconds remaining
  successChance: number; // 0-100, locked in at deploy
  supplies?: string[];   // potion IDs brought on the mission
}

export interface CompletedMission {
  missionId: string;
  success: boolean;
  rewards: MissionReward[]; // actual rewards earned (empty on fail for non-assassin teams)
  casualties: string[]; // adventurer IDs who died
  revived: string[]; // adventurer IDs revived by priests
  xpGained: number;
  levelUps: string[]; // adventurer names that leveled up
  rankUps: { name: string; newRank: string }[]; // adventurers that ranked up
  combatLog?: import("./combat").CombatLogEntry[];
  combatRounds?: number;
  combatVictory?: boolean; // distinct from success — success is the overall mission outcome
}

const RESOURCE_LABELS: Record<string, { icon: string; name: string }> = {
  gold: { icon: "🪙", name: "Gold" },
  wood: { icon: "🪵", name: "Wood" },
  stone: { icon: "🪨", name: "Stone" },
  food: { icon: "🍖", name: "Food" },
  astralShards: { icon: "💎", name: "Astral Shards" },
};

/** Format a mission reward as "icon amount Name" */
export function formatReward(r: MissionReward): string {
  const herb = getHerb(r.resource);
  if (herb) return `${herb.icon} ${r.amount} ${herb.name}`;
  const info = RESOURCE_LABELS[r.resource];
  if (info) return `${info.icon} ${r.amount} ${info.name}`;
  return `+${r.amount} ${r.resource}`;
}

// ─── Mission pool ───────────────────────────────────────────────

export const MISSION_POOL: MissionTemplate[] = [
  // ── Tier 1: Easy gathering (guild Lv1, short, any class) ──────
  {
    id: "gather_timber",
    name: "Gather Timber",
    description: "Send a team to collect wood from the nearby forest.",
    icon: "🪵",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/gather_timber.png",
    slots: [{ class: "any" }],
    duration: 600,
    rewards: [{ resource: "wood", amount: 80 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
    encounters: [{ enemyId: "wild_wolf", count: 2 }],
  },
  {
    id: "quarry_expedition",
    name: "Quarry Expedition",
    description: "Scout the hills for loose stone and haul it back to the settlement.",
    icon: "🪨",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/quarry_expedition.png",
    slots: [{ class: "any" }],
    duration: 600,
    rewards: [{ resource: "stone", amount: 60 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor", "exploration"],
    encounters: [{ enemyId: "giant_rat", count: 3 }],
  },
  {
    id: "foraging_run",
    name: "Foraging Run",
    description: "Gather wild berries, roots, and game from the surrounding lands.",
    icon: "🍖",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/foraging_run.png",
    slots: [{ class: "any" }],
    duration: 480,
    rewards: [{ resource: "food", amount: 100 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
    encounters: [{ enemyId: "wild_wolf", count: 1 }],
  },
  {
    id: "merchant_escort",
    name: "Merchant Escort",
    description: "Guard a traveling merchant along the trade road for a share of their profits.",
    icon: "💰",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/merchant_escort.png",
    slots: [{ class: "any" }],
    duration: 720,
    rewards: [{ resource: "gold", amount: 40 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor", "combat"],
    encounters: [{ enemyId: "bandit_thug", count: 2 }],
  },
  {
    id: "herb_gathering",
    name: "Herb Gathering",
    description: "The meadows beyond the tree line are dotted with wildflowers and fragrant herbs. Your adventurer returns with bundles of chamomile and mugwort — and a handful of berries for the road.",
    icon: "🌿",
    slots: [{ class: "any" }],
    duration: 540,
    rewards: [{ resource: "food", amount: 30 }, { resource: "chamomile", amount: 3 }, { resource: "mugwort", amount: 2 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
    guaranteed: true,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/herb_gathering.png",
  },

  // ── Tier 2: Moderate (guild Lv2, class preferences) ───────────
  {
    id: "bandit_camp",
    name: "Clear Bandit Camp",
    description: "A group of bandits has been raiding caravans. Clear them out and claim their stash.",
    icon: "🏴",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/bandit_camp.png",
    slots: [{ class: "warrior" }, { class: "any" }],
    duration: 1200,
    rewards: [{ resource: "gold", amount: 80 }, { resource: "wood", amount: 50 }],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "bandit_thug", count: 3 }, { enemyId: "bandit_captain", count: 1 }],
  },
  {
    id: "deep_forest",
    name: "Deep Forest Expedition",
    description: "Venture deep into the old forest where ancient trees yield valuable timber.",
    icon: "🌲",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/deep_forest.png",
    slots: [{ class: "assassin" }, { class: "any" }],
    duration: 1500,
    rewards: [{ resource: "wood", amount: 200 }],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["outdoor", "exploration"],
    encounters: [{ enemyId: "wild_wolf", count: 3 }, { enemyId: "cave_spider", count: 1 }],
  },
  {
    id: "abandoned_mine",
    name: "Abandoned Mine",
    description: "Explore a collapsed mine shaft. Rich deposits remain if you can clear the rubble.",
    icon: "⛏️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/abandoned_mine.png",
    slots: [{ class: "warrior" }, { class: "assassin" }],
    duration: 1800,
    rewards: [{ resource: "stone", amount: 180 }, { resource: "gold", amount: 30 }],
    deployCost: 20,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["exploration", "stealth"],
    encounters: [{ enemyId: "giant_rat", count: 4 }, { enemyId: "skeleton", count: 2 }],
  },
  {
    id: "river_crossing",
    name: "River Crossing Patrol",
    description: "Patrol the river fords and fish along the way.",
    icon: "🌊",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/river_crossing.png",
    slots: [{ class: "archer" }, { class: "any" }],
    duration: 1200,
    rewards: [{ resource: "food", amount: 150 }, { resource: "gold", amount: 20 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["outdoor"],
    encounters: [{ enemyId: "goblin_scout", count: 3 }],
  },

  // ── Tier 3: Hard (guild Lv3, specific comps) ──────────────────
  {
    id: "dragon_cave",
    name: "Dragon's Cave",
    description: "Rumors speak of a young drake hoarding gold in the eastern caves. High risk, high reward.",
    icon: "🐉",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/dragon_cave.png",
    slots: [{ class: "warrior" }, { class: "wizard" }, { class: "priest" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 300 }, { resource: "stone", amount: 100 }, { resource: "astralShards", amount: 2 }],
    deployCost: 50,
    difficulty: 4,
    minGuildLevel: 3,
    tags: ["combat", "exploration"],
    encounters: [{ enemyId: "orc_warrior", count: 3 }, { enemyId: "feral_drake", count: 1 }],
  },
  {
    id: "haunted_ruins",
    name: "Haunted Ruins",
    description: "Ancient ruins infested with restless spirits. A mage is essential to deal with them.",
    icon: "👻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/haunted_ruins.png",
    slots: [{ class: "wizard", required: true }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 150 }, { resource: "stone", amount: 120 }],
    deployCost: 35,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["magical", "exploration"],
    encounters: [{ enemyId: "skeleton", count: 4 }, { enemyId: "skeleton_archer", count: 2 }, { enemyId: "wraith", count: 1 }],
  },
  {
    id: "kings_bounty",
    name: "King's Bounty Hunt",
    description: "The King has posted a bounty on a dangerous beast terrorizing the countryside.",
    icon: "👑",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/kings_bounty.png",
    slots: [{ class: "warrior" }, { class: "archer" }, { class: "priest" }],
    duration: 2700,
    rewards: [{ resource: "gold", amount: 200 }, { resource: "food", amount: 100 }],
    deployCost: 40,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "troll", count: 1 }, { enemyId: "orc_warrior", count: 2 }, { enemyId: "wild_wolf", count: 4 }],
  },
  {
    id: "lumber_contract",
    name: "Royal Lumber Contract",
    description: "The crown needs a large shipment of quality timber. Fulfill the order for a generous payment.",
    icon: "📜",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/lumber_contract.png",
    slots: [{ class: "assassin" }, { class: "archer" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "wood", amount: 400 }, { resource: "gold", amount: 80 }],
    deployCost: 30,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["outdoor"],
    encounters: [{ enemyId: "wild_wolf", count: 2 }, { enemyId: "orc_warrior", count: 1 }],
  },

  // ── Tier 4: Very Hard (guild Lv4+) ────────────────────────────
  {
    id: "ancient_vault",
    name: "Ancient Vault",
    description: "A sealed vault from a forgotten age. Untold riches await those brave enough to break the seal.",
    icon: "🏛️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/ancient_vault.png",
    slots: [{ class: "wizard" }, { class: "warrior" }, { class: "assassin" }, { class: "priest" }],
    duration: 5400,
    rewards: [{ resource: "gold", amount: 500 }, { resource: "stone", amount: 200 }, { resource: "wood", amount: 200 }, { resource: "astralShards", amount: 5 }],
    deployCost: 80,
    difficulty: 5,
    minGuildLevel: 4,
    tags: ["exploration", "magical", "stealth"],
    encounters: [{ enemyId: "skeleton", count: 6 }, { enemyId: "skeleton_archer", count: 3 }, { enemyId: "lich_apprentice", count: 1 }, { enemyId: "cursed_spirit", count: 2 }],
  },
  {
    id: "enchanted_grove",
    name: "Enchanted Grove",
    description: "A grove shimmering with magical energy. Harvest rare resources but beware the guardians.",
    icon: "✨",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/enchanted_grove.png",
    slots: [{ class: "wizard" }, { class: "archer" }, { class: "priest" }],
    duration: 3600,
    rewards: [{ resource: "food", amount: 300 }, { resource: "wood", amount: 300 }, { resource: "gold", amount: 100 }],
    deployCost: 60,
    difficulty: 4,
    minGuildLevel: 4,
    tags: ["magical", "outdoor"],
    encounters: [{ enemyId: "wraith", count: 3 }, { enemyId: "cursed_spirit", count: 2 }, { enemyId: "dark_mage", count: 1 }],
  },

  // ── Early magical missions ─────────────────────────────────────
  {
    id: "enchanted_spring",
    name: "Enchanted Spring",
    description: "A spring in the forest glows with faint magical energy. A wizard might be able to harness it.",
    icon: "💧",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/enchanted_spring.png",
    slots: [{ class: "wizard", required: true }],
    duration: 540,
    rewards: [{ resource: "food", amount: 60 }, { resource: "gold", amount: 20 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["magical", "outdoor"],
    encounters: [{ enemyId: "cursed_spirit", count: 1 }],
  },
  {
    id: "wandering_spirit",
    name: "Wandering Spirit",
    description: "A restless spirit haunts the old crossroads. A priest or wizard could put it to rest.",
    icon: "👻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/wandering_spirit.png",
    slots: [{ class: "any" }],
    duration: 600,
    rewards: [{ resource: "gold", amount: 35 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["magical"],
    encounters: [{ enemyId: "skeleton", count: 2 }],
  },
  {
    id: "herb_witch",
    name: "Visit the Herb Witch",
    description: "An old witch in the swamp trades knowledge for favors. Bring a wizard to translate her riddles.",
    icon: "🧙‍♀️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/herb_witch.png",
    slots: [{ class: "wizard", required: true }, { class: "any" }],
    duration: 900,
    rewards: [{ resource: "food", amount: 80 }, { resource: "gold", amount: 40 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["magical", "exploration"],
    encounters: [{ enemyId: "cave_spider", count: 2 }, { enemyId: "giant_rat", count: 3 }],
  },
  {
    id: "cursed_well",
    name: "Cleanse the Cursed Well",
    description: "The village well has been cursed. Only a priest's blessing or a wizard's dispel can purify it.",
    icon: "🕳️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/cursed_well.png",
    slots: [{ class: "priest", required: true }, { class: "any" }],
    duration: 720,
    rewards: [{ resource: "gold", amount: 50 }, { resource: "stone", amount: 30 }],
    deployCost: 8,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["magical", "survival"],
    encounters: [{ enemyId: "cursed_spirit", count: 1 }],
  },

  // ── Escort missions ───────────────────────────────────────────
  {
    id: "caravan_guard",
    name: "Caravan Guard Duty",
    description: "A merchant caravan needs protection along the bandit-infested trade route.",
    icon: "🐴",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/caravan_guard.png",
    slots: [{ class: "warrior" }, { class: "any" }],
    duration: 900,
    rewards: [{ resource: "gold", amount: 50 }, { resource: "food", amount: 30 }],
    deployCost: 10,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["escort", "combat"],
    encounters: [{ enemyId: "bandit_thug", count: 2 }],
  },
  {
    id: "noble_escort",
    name: "Noble's Escort",
    description: "A minor lord requires safe passage to the capital. Discretion and strength are both needed.",
    icon: "👑",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/noble_escort.png",
    slots: [{ class: "warrior" }, { class: "assassin" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 180 }],
    deployCost: 30,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["escort", "combat", "stealth"],
    encounters: [{ enemyId: "bandit_thug", count: 2 }, { enemyId: "bandit_captain", count: 1 }, { enemyId: "orc_warrior", count: 1 }],
  },
  {
    id: "refugee_convoy",
    name: "Refugee Convoy",
    description: "Lead a group of displaced villagers to safety through dangerous territory. A priest brings hope.",
    icon: "🚶",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/refugee_convoy.png",
    slots: [{ class: "warrior" }, { class: "priest" }, { class: "any" }],
    duration: 1800,
    rewards: [{ resource: "food", amount: 120 }, { resource: "gold", amount: 60 }],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["escort", "survival"],
    encounters: [{ enemyId: "wild_wolf", count: 3 }, { enemyId: "bandit_thug", count: 2 }],
  },

  // ── Spying missions ───────────────────────────────────────────
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
  },
  {
    id: "rival_settlement",
    name: "Scout Rival Settlement",
    description: "Infiltrate a nearby settlement and map their defenses. Don't get caught.",
    icon: "🕵️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/rival_settlement.png",
    slots: [{ class: "assassin" }, { class: "any" }],
    duration: 1500,
    rewards: [{ resource: "gold", amount: 100 }, { resource: "wood", amount: 80 }],
    deployCost: 20,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["spying", "stealth"],
    encounters: [{ enemyId: "bandit_thug", count: 2 }],
  },
  {
    id: "intercept_courier",
    name: "Intercept the Courier",
    description: "An enemy courier carries valuable intelligence. Intercept them before they reach the border.",
    icon: "📨",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/intercept_courier.png",
    slots: [{ class: "assassin" }, { class: "archer" }],
    duration: 1200,
    rewards: [{ resource: "gold", amount: 120 }, { resource: "stone", amount: 60 }],
    deployCost: 25,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["spying", "stealth", "combat"],
    encounters: [{ enemyId: "bandit_thug", count: 2 }, { enemyId: "orc_warrior", count: 1 }],
  },
  {
    id: "double_agent",
    name: "Plant a Double Agent",
    description: "Infiltrate an enemy faction and feed false information. Extremely dangerous if discovered.",
    icon: "🎭",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/double_agent.png",
    slots: [{ class: "assassin" }, { class: "wizard" }, { class: "priest" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 350 }, { resource: "wood", amount: 150 }, { resource: "astralShards", amount: 3 }],
    deployCost: 60,
    difficulty: 4,
    minGuildLevel: 4,
    tags: ["spying", "stealth"],
    encounters: [{ enemyId: "dark_mage", count: 1 }, { enemyId: "orc_warrior", count: 3 }, { enemyId: "bandit_captain", count: 1 }],
  },

  // ── Assassination missions ────────────────────────────────────
  {
    id: "bandit_leader",
    name: "Eliminate the Bandit Leader",
    description: "The bandit raids will stop if their leader is dealt with. Quietly.",
    icon: "💀",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/bandit_leader.png",
    slots: [{ class: "assassin" }, { class: "warrior" }],
    duration: 1800,
    rewards: [{ resource: "gold", amount: 140 }, { resource: "stone", amount: 80 }],
    deployCost: 25,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["assassination", "stealth", "combat"],
    encounters: [{ enemyId: "bandit_thug", count: 4 }, { enemyId: "bandit_captain", count: 1 }],
  },
  {
    id: "corrupt_official",
    name: "The Corrupt Tax Collector",
    description: "A tax collector has been skimming gold from the crown. Make sure he stops. Permanently.",
    icon: "🗡️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/corrupt_official.png",
    slots: [{ class: "assassin" }],
    duration: 1200,
    rewards: [{ resource: "gold", amount: 200 }],
    deployCost: 20,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["assassination", "stealth"],
    encounters: [{ enemyId: "bandit_thug", count: 2 }],
  },

  // ── Dungeon missions ──────────────────────────────────────────
  {
    id: "goblin_warren",
    name: "Goblin Warren",
    description: "A network of tunnels infested with goblins. Clear them out and claim whatever they've hoarded.",
    icon: "🕳️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/goblin_warren.png",
    slots: [{ class: "warrior" }, { class: "archer" }, { class: "any" }],
    duration: 2100,
    rewards: [{ resource: "gold", amount: 100 }, { resource: "stone", amount: 100 }, { resource: "wood", amount: 60 }],
    deployCost: 25,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["dungeon", "combat"],
    encounters: [{ enemyId: "goblin_scout", count: 6 }, { enemyId: "orc_warrior", count: 2 }],
  },
  {
    id: "flooded_crypt",
    name: "The Flooded Crypt",
    description: "An ancient crypt partially submerged in groundwater. Undead stir in the deep chambers.",
    icon: "🪦",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/flooded_crypt.png",
    slots: [{ class: "wizard" }, { class: "priest" }, { class: "warrior" }],
    duration: 3000,
    rewards: [{ resource: "gold", amount: 200 }, { resource: "stone", amount: 150 }],
    deployCost: 40,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["dungeon", "combat", "magical"],
    encounters: [{ enemyId: "skeleton", count: 5 }, { enemyId: "skeleton_archer", count: 3 }, { enemyId: "wraith", count: 2 }],
  },
  {
    id: "crystal_caverns",
    name: "Crystal Caverns",
    description: "Deep beneath the mountains lie caverns of shimmering crystal. Beautiful — and well-guarded.",
    icon: "💎",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/crystal_caverns.png",
    slots: [{ class: "wizard" }, { class: "assassin" }, { class: "warrior" }, { class: "priest" }],
    duration: 4800,
    rewards: [{ resource: "gold", amount: 400 }, { resource: "stone", amount: 300 }, { resource: "astralShards", amount: 4 }],
    deployCost: 70,
    difficulty: 5,
    minGuildLevel: 4,
    tags: ["dungeon", "exploration", "combat"],
    encounters: [{ enemyId: "orc_warrior", count: 4 }, { enemyId: "orc_warlord", count: 1 }, { enemyId: "demon_scout", count: 2 }, { enemyId: "dark_mage", count: 1 }],
  },

  // ── Survival missions ─────────────────────────────────────────
  {
    id: "wilderness_trek",
    name: "Wilderness Trek",
    description: "Survive a week in the untamed wilds. Return with whatever you can forage and hunt.",
    icon: "🏕️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/wilderness_trek.png",
    slots: [{ class: "archer" }, { class: "any" }],
    duration: 1500,
    rewards: [{ resource: "food", amount: 200 }, { resource: "wood", amount: 80 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["survival", "outdoor"],
    encounters: [{ enemyId: "wild_wolf", count: 2 }, { enemyId: "giant_rat", count: 2 }],
  },
  {
    id: "winter_expedition",
    name: "Winter Expedition",
    description: "Brave the frozen passes to reach a hidden valley rich with resources. Many have tried; few return.",
    icon: "🏔️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/winter_expedition.png",
    slots: [{ class: "warrior" }, { class: "priest" }, { class: "archer" }],
    duration: 3600,
    rewards: [{ resource: "wood", amount: 250 }, { resource: "stone", amount: 200 }, { resource: "food", amount: 150 }],
    deployCost: 45,
    difficulty: 4,
    minGuildLevel: 3,
    tags: ["survival", "outdoor", "exploration"],
    encounters: [{ enemyId: "troll", count: 2 }, { enemyId: "orc_warrior", count: 3 }, { enemyId: "wild_wolf", count: 4 }],
  },
  {
    id: "monster_hunt",
    name: "Monster Hunt",
    description: "A fearsome creature has been spotted near the settlement. Track it down before it strikes.",
    icon: "🐺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/monster_hunt.png",
    slots: [{ class: "warrior" }, { class: "archer" }],
    duration: 1800,
    rewards: [{ resource: "food", amount: 180 }, { resource: "gold", amount: 50 }],
    deployCost: 20,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["combat", "outdoor", "survival"],
    encounters: [{ enemyId: "wild_wolf", count: 4 }, { enemyId: "cave_spider", count: 2 }],
  },

  // ── Mixed/special missions ────────────────────────────────────
  {
    id: "lost_library",
    name: "The Lost Library",
    description: "Legends tell of a library buried beneath the old ruins, filled with forgotten knowledge and enchanted tomes.",
    icon: "📚",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/lost_library.png",
    slots: [{ class: "wizard" }, { class: "assassin" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 160 }, { resource: "wood", amount: 100 }],
    deployCost: 30,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["exploration", "magical", "dungeon"],
    encounters: [{ enemyId: "skeleton", count: 3 }, { enemyId: "cursed_spirit", count: 2 }],
  },
  {
    id: "smuggler_deal",
    name: "Smuggler's Deal",
    description: "Meet a shady contact at the docks. They have rare goods — if the price is right and no one follows.",
    icon: "🌙",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/smuggler_deal.png",
    slots: [{ class: "assassin" }, { class: "any" }],
    duration: 900,
    rewards: [{ resource: "gold", amount: 70 }, { resource: "stone", amount: 50 }, { resource: "wood", amount: 50 }],
    deployCost: 15,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["stealth", "spying"],
  },
  {
    id: "sacred_shrine",
    name: "Pilgrimage to the Sacred Shrine",
    description: "A holy site deep in the wilderness. The journey is perilous but the blessings are bountiful.",
    icon: "⛪",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/sacred_shrine.png",
    slots: [{ class: "priest" }, { class: "warrior" }, { class: "any" }],
    duration: 2100,
    rewards: [{ resource: "gold", amount: 120 }, { resource: "food", amount: 120 }],
    deployCost: 25,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["exploration", "survival", "outdoor"],
    encounters: [{ enemyId: "wild_wolf", count: 2 }, { enemyId: "skeleton", count: 2 }],
  },
  {
    id: "arcane_rift",
    name: "Seal the Arcane Rift",
    description: "A tear in reality has opened, spewing magical energy. Only a skilled wizard can close it safely.",
    icon: "🌀",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/arcane_rift.png",
    slots: [{ class: "wizard", required: true }, { class: "wizard", required: true }, { class: "any" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 280 }, { resource: "stone", amount: 180 }, { resource: "astralShards", amount: 3 }],
    deployCost: 55,
    difficulty: 4,
    minGuildLevel: 4,
    tags: ["magical", "combat", "survival"],
    encounters: [{ enemyId: "demon_scout", count: 3 }, { enemyId: "dark_mage", count: 2 }, { enemyId: "shadow_lord", count: 1 }],
  },

  // ── Ghost missions ────────────────────────────────────────────
  {
    id: "restless_graveyard",
    name: "The Restless Graveyard",
    description: "The old settlement graveyard has grown noisy at night. The boundary is thinning — spirits wander freely. Bring someone who can actually hit them.",
    icon: "👻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/restless_graveyard.png",
    slots: [{ class: "wizard" }, { class: "priest" }],
    duration: 1800,
    rewards: [{ resource: "gold", amount: 120 }, { resource: "astralShards", amount: 1 }],
    deployCost: 25,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["magical", "combat"],
    encounters: [{ enemyId: "cursed_spirit", count: 3 }],
  },
  {
    id: "hollow_crossing",
    name: "Hollow Crossing",
    description: "A trade route passes close to the Wastes. Merchants report whispers and cold hands in the fog. The phantoms don't understand they're dead — they think the travelers are the ghosts.",
    icon: "🌫️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/hollow_crossing.png",
    slots: [{ class: "priest" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 180 }, { resource: "food", amount: 100 }],
    deployCost: 35,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["escort", "magical"],
    encounters: [{ enemyId: "wailing_phantom", count: 2 }, { enemyId: "cursed_spirit", count: 2 }],
  },
  {
    id: "banshee_tower",
    name: "The Banshee's Tower",
    description: "A ruined watchtower on the Wastes border. Something screams from the top floor every night. The Thornveil say it's a spirit so old it remembers the Sundering. Spirit-touched weapons or don't bother.",
    icon: "💀",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/banshee_tower.png",
    slots: [{ class: "wizard" }, { class: "priest" }, { class: "warrior" }, { class: "any" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 300 }, { resource: "astralShards", amount: 3 }],
    deployCost: 60,
    difficulty: 4,
    minGuildLevel: 4,
    tags: ["combat", "magical", "dungeon"],
    encounters: [{ enemyId: "wailing_phantom", count: 3 }, { enemyId: "banshee", count: 1 }],
  },

  // ── Elemental missions ────────────────────────────────────────
  {
    id: "fire_spring",
    name: "The Burning Spring",
    description: "A natural spring has caught fire. Not the water — the Aether underneath. Living flames dance on the surface. The Thornveil want it contained before it spreads to the forest.",
    icon: "🔥",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/fire_spring.png",
    slots: [{ class: "wizard" }, { class: "any" }],
    duration: 1800,
    rewards: [{ resource: "gold", amount: 100 }, { resource: "stone", amount: 80 }],
    deployCost: 20,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["magical", "outdoor"],
    encounters: [{ enemyId: "flame_wisp", count: 3 }],
  },
  {
    id: "stone_quarry_golem",
    name: "Quarry Guardian",
    description: "The old quarry south of the settlement has a new occupant. Something massive, made of stone, that reshapes itself when struck. Magic barely scratches it — bring hammers.",
    icon: "🗿",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/stone_quarry_golem.png",
    slots: [{ class: "warrior" }, { class: "warrior" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "stone", amount: 250 }, { resource: "gold", amount: 150 }],
    deployCost: 40,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "stone_golem", count: 1 }],
  },
  {
    id: "storm_peak",
    name: "Storm Peak",
    description: "Lightning strikes the same hilltop every night. The Khor'vani say it's an elemental convergence. Storm sprites swarm anyone who climbs. Fast, erratic, and arrows pass right through them.",
    icon: "⚡",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/storm_peak.png",
    slots: [{ class: "wizard" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 200 }, { resource: "astralShards", amount: 2 }],
    deployCost: 40,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["magical", "outdoor", "exploration"],
    encounters: [{ enemyId: "storm_sprite", count: 4 }],
  },
  {
    id: "flooded_mine",
    name: "The Flooded Mine",
    description: "A Khazdurim mining shaft flooded years ago. The water moves on its own now — tide serpents formed from the stagnant Aether. The dwarves want their mine back.",
    icon: "🌊",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/flooded_mine.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 160 }, { resource: "stone", amount: 120 }],
    deployCost: 35,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["combat", "dungeon"],
    encounters: [{ enemyId: "tide_serpent", count: 2 }, { enemyId: "giant_rat", count: 3 }],
  },
  {
    id: "aether_convergence",
    name: "Aether Convergence",
    description: "Pure crystallized Aether has formed into something alive. Magic dissolves against it. The Hauts-Cieux have never seen anything like this — they want samples. Your warriors want to hit it.",
    icon: "✨",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/aether_convergence.png",
    slots: [{ class: "warrior" }, { class: "archer" }, { class: "warrior" }, { class: "priest" }],
    duration: 3600,
    rewards: [{ resource: "astralShards", amount: 5 }, { resource: "gold", amount: 250 }],
    deployCost: 65,
    difficulty: 4,
    minGuildLevel: 4,
    tags: ["combat", "magical"],
    encounters: [{ enemyId: "aether_wraith", count: 1 }, { enemyId: "flame_wisp", count: 2 }],
  },
  {
    id: "magma_depths",
    name: "The Magma Depths",
    description: "Deep below the Ironspine, the Khazdurim sealed something that burns. The seals are weakening. Stone and fire fused into a walking furnace — the ground melts where it treads.",
    icon: "🌋",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/magma_depths.png",
    slots: [{ class: "warrior" }, { class: "wizard" }, { class: "priest" }, { class: "any" }],
    duration: 4800,
    rewards: [{ resource: "gold", amount: 400 }, { resource: "stone", amount: 300 }, { resource: "astralShards", amount: 4 }],
    deployCost: 80,
    difficulty: 5,
    minGuildLevel: 5,
    tags: ["combat", "dungeon", "survival"],
    encounters: [{ enemyId: "flame_wisp", count: 3 }, { enemyId: "magma_golem", count: 1 }],
  },

  // ── Divine missions ───────────────────────────────────────────
  {
    id: "abandoned_shrine",
    name: "The Abandoned Shrine",
    description: "An ancient shrine to Korrath, overgrown and forgotten. Something still guards it — a sentinel that doesn't know the war is over. It attacks anyone who approaches, divine or otherwise.",
    icon: "⚜️",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 200 }, { resource: "astralShards", amount: 2 }],
    deployCost: 40,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["combat", "exploration"],
    encounters: [{ enemyId: "skeleton", count: 3 }, { enemyId: "temple_guardian", count: 1 }],
  },
  {
    id: "fallen_seraph_hunt",
    name: "The Weeping Light",
    description: "Something fell from the Hauts-Cieux sky-ruins. It still glows. It still weeps. And it still believes it's righteous. The Hauts-Cieux elves are terrified — they say it's a fragment of divine will, corrupted beyond recognition.",
    icon: "👼",
    slots: [{ class: "warrior" }, { class: "wizard" }, { class: "priest" }, { class: "assassin" }],
    duration: 5400,
    rewards: [{ resource: "gold", amount: 500 }, { resource: "astralShards", amount: 6 }],
    deployCost: 100,
    difficulty: 5,
    minGuildLevel: 5,
    tags: ["combat", "magical", "survival"],
    encounters: [{ enemyId: "seraph_fallen", count: 1 }],
  },

  // ── Dragon missions ───────────────────────────────────────────
  {
    id: "dragon_nest",
    name: "The Wyrm's Nest",
    description: "Scouts found a nest near the Wastes border. The hatchlings are small, but their mother hasn't been seen. Either she's dead or she's hunting. Either way, the nest is a threat.",
    icon: "🐉",
    slots: [{ class: "warrior" }, { class: "archer" }, { class: "priest" }],
    duration: 3000,
    rewards: [{ resource: "gold", amount: 250 }, { resource: "food", amount: 150 }, { resource: "astralShards", amount: 2 }],
    deployCost: 50,
    difficulty: 3,
    minGuildLevel: 3,
    tags: ["combat", "exploration", "outdoor"],
    encounters: [{ enemyId: "dragon_hatchling", count: 2 }],
  },
  {
    id: "ancient_wyrm_lair",
    name: "The Ancient Wyrm's Lair",
    description: "A thousand years of hunger, rage, and fire. The Thornveil scouts found her lair in the mountains — volcanic vents, charred bones, and the stench of sulfur. Kingdoms have fallen to lesser dragons. Bring your best.",
    icon: "🐲",
    slots: [{ class: "warrior" }, { class: "wizard" }, { class: "priest" }, { class: "archer" }, { class: "any" }],
    duration: 7200,
    rewards: [{ resource: "gold", amount: 800 }, { resource: "astralShards", amount: 10 }],
    deployCost: 150,
    difficulty: 5,
    minGuildLevel: 5,
    tags: ["combat", "survival"],
    encounters: [{ enemyId: "feral_drake", count: 2 }, { enemyId: "ancient_wyrm", count: 1 }],
  },

  {
    id: "wyrmling_den",
    name: "Wyrmling Den",
    description: "Farmers found scorched chicken coops and tiny claw marks. Something hatched in the hills nearby — small, scared, and breathing fire. Handle it before it grows.",
    icon: "🦎",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/wyrmling_den.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1500,
    rewards: [{ resource: "gold", amount: 80 }, { resource: "food", amount: 60 }],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "wyrmling", count: 3 }],
  },
  {
    id: "feral_drake_hunt",
    name: "The Feral Drake",
    description: "Something large has been hunting along the Wastes border. Livestock vanished. A woodcutter found claw marks in granite. An adolescent dragon, wild-born and vicious. It's never known anything but the dead zone.",
    icon: "🐉",
    slots: [{ class: "warrior" }, { class: "wizard" }, { class: "priest" }, { class: "any" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 300 }, { resource: "astralShards", amount: 3 }],
    deployCost: 60,
    difficulty: 4,
    minGuildLevel: 4,
    tags: ["combat", "outdoor", "survival"],
    encounters: [{ enemyId: "wyrmling", count: 2 }, { enemyId: "feral_drake", count: 1 }],
  },
  {
    id: "wasteland_wyrm_lair",
    name: "The Corrupted Nest",
    description: "Deep in the grey zone, Kess found a nest that's wrong. The eggs are black. The drake guarding them has scales like charcoal and breath that rots instead of burns. It was born in the Wastes. It IS the Wastes.",
    icon: "🐲",
    slots: [{ class: "warrior" }, { class: "wizard" }, { class: "priest" }, { class: "any" }, { class: "any" }],
    duration: 5400,
    rewards: [{ resource: "gold", amount: 500 }, { resource: "astralShards", amount: 5 }],
    deployCost: 100,
    difficulty: 5,
    minGuildLevel: 5,
    tags: ["combat", "survival", "magical"],
    encounters: [{ enemyId: "feral_drake", count: 1 }, { enemyId: "wasteland_wyrm", count: 1 }],
  },

  // ── Lore-flavored regular missions ────────────────────────────
  {
    id: "corsair_smugglers",
    name: "Corsair Smugglers",
    description: "A Meridian trader tipped you off: smugglers from Saltmere are moving contraband through your territory. Intercept them — keep what you find.",
    icon: "🏴‍☠️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/corsair_smugglers.png",
    slots: [{ class: "assassin" }, { class: "any" }],
    duration: 1800,
    rewards: [{ resource: "gold", amount: 200 }, { resource: "food", amount: 80 }],
    deployCost: 25,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["stealth", "combat"],
    encounters: [{ enemyId: "bandit_thug", count: 3 }, { enemyId: "bandit_captain", count: 1 }],
  },
  {
    id: "thornveil_patrol",
    name: "Thornveil Border Patrol",
    description: "The Thornveil Rangers ask for help. Their ward-line is thinning and something is testing it from the other side. Walk the patrol, reinforce what you can, fight what comes through.",
    icon: "🌿",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/thornveil_patrol.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "wood", amount: 150 }, { resource: "gold", amount: 120 }],
    deployCost: 30,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["combat", "outdoor", "exploration"],
    encounters: [{ enemyId: "wild_wolf", count: 2 }, { enemyId: "cursed_spirit", count: 1 }, { enemyId: "skeleton", count: 2 }],
  },
  {
    id: "khorvani_caravan",
    name: "Khor'vani Caravan Escort",
    description: "A Khor'vani spice caravan is passing through — rare goods, wealthy merchants, and zero protection. Escort them safely and they'll pay generously. Lose the cargo and they'll remember your name.",
    icon: "🐪",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/khorvani_caravan.png",
    slots: [{ class: "warrior" }, { class: "archer" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 250 }],
    deployCost: 30,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["escort", "combat", "outdoor"],
    encounters: [{ enemyId: "bandit_thug", count: 4 }, { enemyId: "bandit_captain", count: 1 }],
  },
  {
    id: "zahkari_expedition",
    name: "Zah'kari Expedition",
    description: "A Zah'kari griot says there are ruins east of the settlement that match songs from the old kingdoms. She wants to see them. The ruins are infested with undead, but she says the songs are worth it.",
    icon: "📜",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/zahkari_expedition.png",
    slots: [{ class: "any" }, { class: "any" }, { class: "priest" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 180 }, { resource: "astralShards", amount: 1 }],
    deployCost: 30,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["exploration", "combat"],
    encounters: [{ enemyId: "skeleton", count: 3 }, { enemyId: "skeleton_archer", count: 2 }],
  },
  {
    id: "dominion_deserters",
    name: "Dominion Deserters",
    description: "A band of Dominion soldiers deserted their post and set up camp in the hills. They're raiding farms. They're well-armed, well-trained, and desperate. Former soldiers are the most dangerous kind.",
    icon: "⚔️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/dominion_deserters.png",
    slots: [{ class: "warrior" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 180 }, { resource: "wood", amount: 100 }],
    deployCost: 35,
    difficulty: 3,
    minGuildLevel: 2,
    tags: ["combat"],
    encounters: [{ enemyId: "bandit_thug", count: 3 }, { enemyId: "orc_warrior", count: 2 }, { enemyId: "bandit_captain", count: 1 }],
  },
  {
    id: "tianzhou_scholar",
    name: "The Tianzhou Cartographer",
    description: "A Tianzhou cartographer is mapping the Wastes border and needs protection. She pays well and shares what she finds. The border is dangerous — the dead don't respect academic curiosity.",
    icon: "🗺️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/tianzhou_scholar.png",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 200 }, { resource: "astralShards", amount: 1 }],
    deployCost: 30,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["escort", "exploration", "outdoor"],
    encounters: [{ enemyId: "skeleton", count: 2 }, { enemyId: "cursed_spirit", count: 2 }],
  },

  // ── New Missions — Content Expansion ────────────────────────────
  {
    id: "bear_den",
    name: "The Bear's Den",
    description: "A forest bear has denned up near the lumber road. The woodcutters refuse to work until it's dealt with. It's got cubs, so it'll fight to the death.",
    icon: "🐻",
    slots: [{ class: "any" }],
    duration: 600,
    rewards: [{ resource: "food", amount: 40 }, { resource: "wood", amount: 20 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "forest_bear", count: 2 }],
  },
  {
    id: "boar_hunt",
    name: "Rabid Boar Hunt",
    description: "Something in the water near the Wastes is driving the boars mad. Three of them charged through the vegetable gardens last night. Time to thin the herd.",
    icon: "🐗",
    slots: [{ class: "any" }],
    duration: 500,
    rewards: [{ resource: "food", amount: 50 }],
    deployCost: 3,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "rabid_boar", count: 3 }],
  },
  {
    id: "marsh_clearing",
    name: "Clear the Marshes",
    description: "The herbalists need safe access to the marsh herbs, but the adders have multiplied. Clear a path and watch where you step.",
    icon: "🐍",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 700,
    rewards: [{ resource: "food", amount: 30 }, { resource: "gold", amount: 30 }],
    deployCost: 5,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "marsh_adder", count: 3 }, { enemyId: "fungal_crawler", count: 2 }],
  },
  {
    id: "goblin_shaman_camp",
    name: "The Shaman's Hex",
    description: "Livestock are sickening. Crops are wilting in one specific field. The trail leads to a goblin camp with a shaman who's been hexing your settlement for sport.",
    icon: "🧙",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1000,
    rewards: [{ resource: "gold", amount: 60 }, { resource: "food", amount: 40 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "magical"],
    encounters: [{ enemyId: "goblin_shaman", count: 2 }, { enemyId: "goblin_scout", count: 3 }],
  },
  {
    id: "ghoul_infestation",
    name: "Ghoul Infestation",
    description: "Something is digging up the old cemetery at night. The gravedigger found claw marks and half-eaten remains. Ghouls — and they're getting bolder.",
    icon: "🧟",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1200,
    rewards: [{ resource: "gold", amount: 70 }],
    deployCost: 10,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "dungeon"],
    encounters: [{ enemyId: "ghoul", count: 3 }, { enemyId: "skeleton", count: 2 }],
  },
  {
    id: "alpha_wolf_hunt",
    name: "The Pack Leader",
    description: "The alpha has organized the wolves into coordinated raids on your livestock. Kill the leader and the pack scatters. Miss, and next time they come for the children.",
    icon: "🐺",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1500,
    rewards: [{ resource: "gold", amount: 80 }, { resource: "food", amount: 60 }],
    deployCost: 15,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "alpha_wolf", count: 1 }, { enemyId: "wild_wolf", count: 4 }],
  },
  {
    id: "bog_witch_lair",
    name: "The Bog Witch's Lair",
    description: "The witch in the marsh has graduated from cursing livestock to cursing people. A hunter came back with grey skin and couldn't remember his own name. End this.",
    icon: "🧙‍♀️",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 1800,
    rewards: [{ resource: "gold", amount: 120 }, { resource: "astralShards", amount: 1 }],
    deployCost: 20,
    difficulty: 2,
    minGuildLevel: 2,
    tags: ["combat", "magical", "outdoor"],
    encounters: [{ enemyId: "bog_witch", count: 1 }, { enemyId: "marsh_adder", count: 2 }, { enemyId: "fungal_crawler", count: 2 }],
  },
  {
    id: "burnt_crypt",
    name: "The Burning Crypt",
    description: "An old crypt near the Wastes border has caught fire — from the inside. Burnt skeletons walk out at night trailing flames. The crypt needs clearing before the fire spreads to the forest.",
    icon: "🔥",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1200,
    rewards: [{ resource: "gold", amount: 80 }, { resource: "stone", amount: 40 }],
    deployCost: 12,
    difficulty: 2,
    minGuildLevel: 1,
    tags: ["combat", "dungeon"],
    encounters: [{ enemyId: "burnt_skeleton", count: 4 }, { enemyId: "skeleton", count: 2 }],
  },
  {
    id: "corrupted_grove",
    name: "The Corrupted Grove",
    description: "The Silvaneth report a sacred grove has turned. Trees walking, roots grasping, the earth itself hostile. Whatever the Wastes corruption touches, it twists.",
    icon: "🌳",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "wood", amount: 100 }, { resource: "gold", amount: 100 }],
    deployCost: 20,
    difficulty: 3,
    minGuildLevel: 2,
    tags: ["combat", "outdoor", "magical"],
    encounters: [{ enemyId: "corrupted_treant", count: 2 }, { enemyId: "fungal_crawler", count: 3 }],
  },
  {
    id: "necromancer_tower",
    name: "The Necromancer's Tower",
    description: "A ruined tower on the Wastes border has new occupants. Lights at night, and the dead rising in the surrounding fields. Someone is practicing the forbidden arts.",
    icon: "💀",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 150 }, { resource: "astralShards", amount: 2 }],
    deployCost: 25,
    difficulty: 3,
    minGuildLevel: 2,
    tags: ["combat", "magical", "dungeon"],
    encounters: [{ enemyId: "necromancer_acolyte", count: 1 }, { enemyId: "skeleton", count: 4 }, { enemyId: "ghoul", count: 2 }],
  },
  {
    id: "elemental_rift",
    name: "Elemental Rift",
    description: "A crack in the earth is leaking raw Aether. Fire and frost elementals are forming from the discharge, fighting each other and everything else nearby. Seal the rift before it widens.",
    icon: "🌋",
    slots: [{ class: "wizard" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "gold", amount: 130 }, { resource: "stone", amount: 80 }],
    deployCost: 25,
    difficulty: 3,
    minGuildLevel: 2,
    tags: ["combat", "magical"],
    encounters: [{ enemyId: "ember_elemental", count: 2 }, { enemyId: "frost_elemental", count: 2 }],
  },
  {
    id: "dire_bear_territory",
    name: "The Mountain King",
    description: "A dire bear has claimed the eastern pass. Caravans are rerouting, adding days to every journey. The hunters say it's the biggest they've ever seen.",
    icon: "🐻",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }],
    duration: 2400,
    rewards: [{ resource: "food", amount: 120 }, { resource: "gold", amount: 100 }],
    deployCost: 25,
    difficulty: 3,
    minGuildLevel: 2,
    tags: ["combat", "outdoor"],
    encounters: [{ enemyId: "dire_bear", count: 1 }, { enemyId: "forest_bear", count: 2 }],
  },
  {
    id: "swamp_haunt",
    name: "The Drowned Patrol",
    description: "An entire Dominion patrol vanished in the swamp last month. Now the marsh-folk report figures walking the old paths at night, trailing weeds and lantern-light.",
    icon: "👻",
    slots: [{ class: "any" }, { class: "any" }],
    duration: 1800,
    rewards: [{ resource: "gold", amount: 100 }],
    deployCost: 15,
    difficulty: 3,
    minGuildLevel: 2,
    tags: ["combat", "outdoor", "survival"],
    encounters: [{ enemyId: "swamp_revenant", count: 3 }, { enemyId: "ghoul", count: 2 }],
  },
  {
    id: "goblin_fortress",
    name: "The Goblin Fortress",
    description: "The warchief has united the goblin tribes and built a fortress in the hills. If we don't strike now, his warband will be at our gates by winter.",
    icon: "👑",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }, { class: "any" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 250 }, { resource: "astralShards", amount: 3 }],
    deployCost: 40,
    difficulty: 4,
    minGuildLevel: 3,
    tags: ["combat"],
    encounters: [{ enemyId: "goblin_warchief", count: 1 }, { enemyId: "goblin_shaman", count: 2 }, { enemyId: "goblin_scout", count: 4 }],
  },
  {
    id: "storm_peak",
    name: "Storm Peak Ascent",
    description: "A storm elemental has settled on the mountain peak, and the constant lightning is setting fires across the foothills. The Thornveil say it'll keep growing until something stops it.",
    icon: "⛈️",
    slots: [{ class: "wizard" }, { class: "any" }, { class: "any" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 200 }, { resource: "astralShards", amount: 2 }],
    deployCost: 35,
    difficulty: 4,
    minGuildLevel: 3,
    tags: ["combat", "magical", "outdoor"],
    encounters: [{ enemyId: "storm_elemental", count: 1 }, { enemyId: "storm_sprite", count: 3 }],
  },
  {
    id: "infernal_breach",
    name: "The Infernal Breach",
    description: "A knight walked through the boundary — wreathed in hellfire, wearing stolen plate fused to its body. It's burning a path toward the settlement. This is not a patrol. This is an invasion of one.",
    icon: "🔥",
    slots: [{ class: "any" }, { class: "any" }, { class: "any" }, { class: "any" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 300 }, { resource: "astralShards", amount: 3 }],
    deployCost: 50,
    difficulty: 4,
    minGuildLevel: 3,
    tags: ["combat"],
    encounters: [{ enemyId: "infernal_knight", count: 1 }, { enemyId: "demon_scout", count: 2 }, { enemyId: "burnt_skeleton", count: 3 }],
  },
  {
    id: "arch_necromancer_sanctum",
    name: "The Necromancer's Sanctum",
    description: "The tower was just a workshop. The real laboratory is underground — and the arch-necromancer has been busy. The dead are organized down there. They have ranks.",
    icon: "☠️",
    slots: [{ class: "priest" }, { class: "any" }, { class: "any" }, { class: "any" }],
    duration: 3600,
    rewards: [{ resource: "gold", amount: 280 }, { resource: "astralShards", amount: 3 }],
    deployCost: 45,
    difficulty: 4,
    minGuildLevel: 3,
    tags: ["combat", "magical", "dungeon"],
    encounters: [{ enemyId: "arch_necromancer", count: 1 }, { enemyId: "skeleton", count: 4 }, { enemyId: "skeleton_archer", count: 2 }, { enemyId: "ghoul", count: 3 }],
  },
];

// ─── Class passive helpers ──────────────────────────────────────

/** Warrior: flat +10% success */
// Class bonuses removed — success is driven by stats + combat simulation
/** Wizard: reduces mission duration by 10% per wizard */
export const WIZARD_DURATION_REDUCTION = 0.10;
/** Assassin: +20% bonus rewards on success, 30% partial loot on failure */
export const ASSASSIN_LOOT_BONUS = 0.20;
export const ASSASSIN_FAIL_LOOT = 0.30;
/** Priest: 15% chance to revive a fallen ally */
export const PRIEST_REVIVE_CHANCE = 0.15;

// ─── Success calculation ────────────────────────────────────────

/**
 * Get the primary stat(s) for a mission based on its tags.
 */
export function getMissionStatWeights(tags: MissionTag[]): Partial<Record<keyof AdventurerStats, number>> {
  const weights: Partial<Record<keyof AdventurerStats, number>> = {};
  if (tags.some((t) => t === "combat" || t === "escort")) weights.str = (weights.str ?? 0) + 1;
  if (tags.some((t) => t === "magical" || t === "exploration")) weights.int = (weights.int ?? 0) + 1;
  if (tags.some((t) => t === "stealth" || t === "outdoor" || t === "spying" || t === "assassination")) weights.dex = (weights.dex ?? 0) + 1;
  if (tags.some((t) => t === "survival" || t === "dungeon")) {
    weights.str = (weights.str ?? 0) + 0.5;
    weights.vit = (weights.vit ?? 0) + 0.5;
  }
  if (Object.keys(weights).length === 0) {
    weights.str = 0.5; weights.int = 0.5; weights.dex = 0.5;
  }
  return weights;
}

/** Flavor hint telling the player which stat matters for a non-combat mission */
export function getMissionStatHint(tags: MissionTag[]): string {
  const hints: string[] = [];
  if (tags.some((t) => t === "combat" || t === "escort")) hints.push("strength and endurance");
  if (tags.some((t) => t === "magical" || t === "exploration")) hints.push("intelligence and arcane knowledge");
  if (tags.some((t) => t === "stealth" || t === "spying" || t === "assassination")) hints.push("cunning and stealth");
  if (tags.some((t) => t === "outdoor")) hints.push("survival instincts");
  if (tags.some((t) => t === "survival" || t === "dungeon")) hints.push("toughness and resilience");
  if (hints.length === 0) return "Success depends on your team's overall ability.";
  return `This mission requires ${hints.join(" and ")}.`;
}

/**
 * Calculate success chance for non-combat missions.
 * Purely stat-based: team's relevant stats vs difficulty threshold.
 */
export function calcSuccessChance(
  mission: MissionTemplate,
  team: Adventurer[],
  statBonuses?: number, // flat bonus from potions (e.g. +10 to relevant stat)
): number {
  if (team.length === 0) return 0;
  if (mission.guaranteed) return 98;

  const statWeights = getMissionStatWeights(mission.tags);

  // Sum the team's weighted stats
  let teamPower = 0;
  for (const adv of team) {
    const equipStats = getEquipmentStats(adv.equipment);
    const stats = calcStats(adv, equipStats);
    let advPower = 0;
    let weightSum = 0;
    for (const [stat, weight] of Object.entries(statWeights)) {
      advPower += (stats[stat as keyof AdventurerStats] ?? 0) * (weight ?? 0);
      weightSum += weight ?? 0;
    }
    if (weightSum > 0) teamPower += advPower / weightSum;
  }

  // Add potion stat bonuses
  if (statBonuses) teamPower += statBonuses;

  // Difficulty threshold: how much weighted stat total is needed
  // Difficulty 1 = 8, difficulty 3 = 24, difficulty 5 = 40
  const threshold = mission.difficulty * 8;

  // Calculate % based on how much the team exceeds (or falls short of) the threshold
  // At threshold = 50%, at 2x threshold = ~95%, at 0.5x = ~15%
  const ratio = teamPower / threshold;
  const pct = Math.round(50 + (ratio - 1) * 40);

  return Math.min(98, Math.max(2, pct));
}

/**
 * Calculate effective mission duration after wizard speed bonus.
 */
export function calcEffectiveDuration(mission: MissionTemplate, team: Adventurer[]): number {
  const wizardCount = team.filter((a) => a.class === "wizard").length;
  const reduction = Math.min(0.45, wizardCount * WIZARD_DURATION_REDUCTION); // cap at 45%
  return Math.floor(mission.duration * (1 - reduction));
}

/**
 * Calculate assassin bonus loot on success.
 * Returns multiplied rewards.
 */
/** Check if all required slots are satisfied by the team */
export function areRequiredSlotsFilled(mission: MissionTemplate, team: Adventurer[]): boolean {
  const available = [...team];
  for (const slot of mission.slots) {
    if (!slot.required || slot.class === "any") continue;
    const idx = available.findIndex((a) => a.class === slot.class);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

export function calcAssassinBonusRewards(mission: MissionTemplate, team: Adventurer[]): MissionReward[] {
  const assassinCount = team.filter((a) => a.class === "assassin").length;
  if (assassinCount === 0) return mission.rewards;
  const bonus = 1 + ASSASSIN_LOOT_BONUS * assassinCount;
  return mission.rewards.map((r) => ({ ...r, amount: Math.floor(r.amount * bonus) }));
}

/**
 * Calculate assassin partial loot on failure.
 * Returns reduced rewards (only if an assassin survives).
 */
export function calcAssassinFailRewards(mission: MissionTemplate, team: Adventurer[], survivors: Adventurer[]): MissionReward[] {
  const assassinSurvived = survivors.some((a) => a.class === "assassin");
  if (!assassinSurvived) return [];
  return mission.rewards.map((r) => ({ ...r, amount: Math.floor(r.amount * ASSASSIN_FAIL_LOOT) }));
}

// ─── Death chance ───────────────────────────────────────────────

/**
 * On mission failure, each adventurer has a chance to die.
 * Priest passive reduces death chance for the whole party.
 * Warrior passive: can protect one ally (handled at resolution time).
 */
export function calcDeathChance(
  mission: MissionTemplate,
  team: Adventurer[],
  adventurer: Adventurer,
): number {
  // Base death chance: 8% per difficulty level
  let chance = mission.difficulty * 8;

  // VIT reduces death chance: each point of VIT above 10 reduces by 0.8%
  const equipStats = getEquipmentStats(adventurer.equipment);
  const stats = calcStats(adventurer, equipStats);
  chance -= Math.max(0, (stats.vit - 10) * 0.8);

  // Floor: VIT can't reduce below a meaningful threshold
  chance = Math.max(chance, 2 + mission.difficulty * 2);

  // Priest passive: each priest reduces death chance by 60%
  const priestCount = team.filter((a) => a.class === "priest" && a.id !== adventurer.id).length;
  chance *= Math.pow(0.4, priestCount);

  // Priests stay in the back — lower personal risk
  if (adventurer.class === "priest") chance *= 0.5;

  // Survivor trait: -15% death chance
  if (adventurer.trait === "survivor") chance *= 0.85;

  return Math.min(50, Math.max(1, Math.round(chance)));
}

// ─── Mission board generation ───────────────────────────────────

/** Pick random missions for the board based on guild level */
export function generateMissionBoard(guildLevel: number, count: number = 4, seed: number = Date.now(), maxDifficulty: number = 5): MissionTemplate[] {
  const available = MISSION_POOL.filter((m) => m.minGuildLevel <= guildLevel && m.difficulty <= maxDifficulty);
  if (available.length <= count) return [...available];

  // Seeded shuffle
  let s = seed;
  function rand(): number {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  }

  const shuffled = [...available].sort(() => rand() - 0.5);
  return shuffled.slice(0, count);
}

/** Number of missions shown on board per refresh */
export function getMissionBoardSize(guildLevel: number): number {
  return Math.min(4 + guildLevel, 10); // 5 at Lv1, up to 10
}

/** Get a mission template by ID (searches both regular and story pools) */
export function getMission(missionId: string): MissionTemplate | undefined {
  return MISSION_POOL.find((m) => m.id === missionId)
    ?? STORY_MISSIONS.find((m) => m.id === missionId);
}

// ─── Story missions ─────────────────────────────────────────────

export interface StoryMission extends MissionTemplate {
  storyOrder: number;
  prerequisite?: string; // ID of previous story mission that must be completed
  lore: string; // lore text revealed on completion
  chapter: string;
}

export const STORY_MISSIONS: StoryMission[] = [
  {
    id: "story_1_scouting",
    storyOrder: 1,
    chapter: "Chapter 1: Ashes and Dust",
    name: "Scouting the Surroundings",
    description:
      "Time to find out what's around us. Send scouts to map the area — water sources, game trails, anything useful. And anything dangerous.",
    icon: "🗺️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/missions/story_1_scouting.png",
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
    encounters: [{ enemyId: "cursed_spirit", count: 2 }, { enemyId: "skeleton", count: 2 }],
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
