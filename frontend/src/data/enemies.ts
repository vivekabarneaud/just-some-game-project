// ─── Enemy Definitions ──────────────────────────────────────────
// Enemies appear in mission encounters. Stats drive combat simulation.
// Enemy HP = VIT * 10. Natural armor = VIT / 3.
// Designed so unequipped adventurers struggle; gear makes the difference.

export interface EnemyDefinition {
  id: string;
  name: string;
  icon: string;
  image?: string;
  description: string;
  tier: 1 | 2 | 3 | 4 | 5;
  stats: {
    str: number;
    dex: number;
    int: number;
    vit: number;
    wis: number;
  };
  tags: string[]; // "undead", "beast", "humanoid", "magical", "demon"
  boss?: boolean;
}

export const ENEMIES: EnemyDefinition[] = [
  // ── Tier 1 — Common threats ───────────────────────────────────
  // Challenging for level 1-3 with no gear. Beatable with basic gear.
  {
    id: "goblin_scout",
    name: "Goblin Scout",
    icon: "👺",
    description: "Small, sneaky, and cowardly alone — but they never come alone.",
    tier: 1,
    stats: { str: 8, dex: 10, int: 2, vit: 10, wis: 2 },
    tags: ["humanoid"],
  },
  {
    id: "bandit_thug",
    name: "Bandit Thug",
    icon: "🗡️",
    description: "A desperate man with a rusty blade. Not skilled, but dangerous when cornered.",
    tier: 1,
    stats: { str: 10, dex: 6, int: 2, vit: 12, wis: 3 },
    tags: ["humanoid"],
  },
  {
    id: "wild_wolf",
    name: "Wild Wolf",
    icon: "🐺",
    description: "Lean, hungry, and hunting in packs. They smell fear.",
    tier: 1,
    stats: { str: 9, dex: 11, int: 1, vit: 10, wis: 3 },
    tags: ["beast"],
  },
  {
    id: "giant_rat",
    name: "Giant Rat",
    icon: "🐀",
    description: "Bloated and disease-ridden. They infest every ruin in the frontier.",
    tier: 1,
    stats: { str: 7, dex: 9, int: 1, vit: 8, wis: 1 },
    tags: ["beast"],
  },
  {
    id: "skeleton",
    name: "Skeleton",
    icon: "💀",
    description: "Bones held together by old magic. They don't tire and they don't stop.",
    tier: 1,
    stats: { str: 9, dex: 5, int: 3, vit: 14, wis: 1 },
    tags: ["undead"],
  },

  // ── Tier 2 — Organized threats ────────────────────────────────
  // Require level 4-6 WITH basic gear. Dangerous without.
  {
    id: "orc_warrior",
    name: "Orc Warrior",
    icon: "👹",
    description: "Broad-shouldered and battle-scarred. Orcs fight to kill, not to wound.",
    tier: 2,
    stats: { str: 18, dex: 7, int: 2, vit: 20, wis: 3 },
    tags: ["humanoid"],
  },
  {
    id: "skeleton_archer",
    name: "Skeleton Archer",
    icon: "🏹",
    description: "Dead eyes, steady aim. They never miss twice.",
    tier: 2,
    stats: { str: 6, dex: 16, int: 3, vit: 12, wis: 2 },
    tags: ["undead"],
  },
  {
    id: "bandit_captain",
    name: "Bandit Captain",
    icon: "⚔️",
    description: "A former soldier turned outlaw. Dangerous because he still fights like a soldier.",
    tier: 2,
    stats: { str: 16, dex: 11, int: 5, vit: 18, wis: 5 },
    tags: ["humanoid"],
    boss: true,
  },
  {
    id: "cave_spider",
    name: "Cave Spider",
    icon: "🕷️",
    description: "Silent, venomous, and the size of a dog. Their webs can stop a knight.",
    tier: 2,
    stats: { str: 10, dex: 16, int: 1, vit: 12, wis: 2 },
    tags: ["beast"],
  },
  {
    id: "cursed_spirit",
    name: "Cursed Spirit",
    icon: "👻",
    description: "A restless soul bound to this place by old grief. Its wail chills the blood.",
    tier: 2,
    stats: { str: 4, dex: 8, int: 16, vit: 14, wis: 10 },
    tags: ["undead", "magical"],
  },

  // ── Tier 3 — Dangerous foes ───────────────────────────────────
  // Require level 6-10 with decent gear. Party composition matters.
  {
    id: "orc_warlord",
    name: "Orc Warlord",
    icon: "🔱",
    description: "Commands through strength alone. If you kill the warlord, the warband scatters.",
    tier: 3,
    stats: { str: 26, dex: 8, int: 3, vit: 28, wis: 5 },
    tags: ["humanoid"],
    boss: true,
  },
  {
    id: "dark_mage",
    name: "Dark Mage",
    icon: "🧙",
    description: "A scholar of forbidden texts. The air crackles and tastes of copper near him.",
    tier: 3,
    stats: { str: 4, dex: 7, int: 26, vit: 14, wis: 18 },
    tags: ["humanoid", "magical"],
    boss: true,
  },
  {
    id: "wraith",
    name: "Wraith",
    icon: "👤",
    description: "Not quite alive, not quite dead. Steel passes through it — you need silver or faith.",
    tier: 3,
    stats: { str: 10, dex: 12, int: 20, vit: 16, wis: 14 },
    tags: ["undead", "magical"],
  },
  {
    id: "troll",
    name: "Troll",
    icon: "🧌",
    description: "Massive, foul-smelling, and nearly impossible to kill. They regenerate wounds in minutes.",
    tier: 3,
    stats: { str: 28, dex: 4, int: 1, vit: 35, wis: 2 },
    tags: ["beast"],
    boss: true,
  },

  // ── Tier 4 — Elite threats ────────────────────────────────────
  // Require level 10-15 with good gear. Full party required.
  {
    id: "dragon_hatchling",
    name: "Dragon Hatchling",
    icon: "🐉",
    description: "Only a year old and already deadly. Its breath singes stone. Imagine the mother.",
    tier: 4,
    stats: { str: 24, dex: 12, int: 16, vit: 30, wis: 10 },
    tags: ["beast", "magical"],
    boss: true,
  },
  {
    id: "lich_apprentice",
    name: "Lich Apprentice",
    icon: "☠️",
    description: "A mage who traded his life for power. Not yet a true lich — but getting there.",
    tier: 4,
    stats: { str: 8, dex: 8, int: 30, vit: 22, wis: 20 },
    tags: ["undead", "magical"],
    boss: true,
  },
  {
    id: "demon_scout",
    name: "Demon Scout",
    icon: "😈",
    description: "A minor fiend sent to test the mortal realm's defenses. Its masters are watching.",
    tier: 4,
    stats: { str: 22, dex: 16, int: 14, vit: 24, wis: 12 },
    tags: ["demon", "magical"],
  },

  // ── Tier 5 — Legendary ────────────────────────────────────────
  // Require level 18+ fully geared elite party. Expect casualties.
  {
    id: "ancient_wyrm",
    name: "Ancient Wyrm",
    icon: "🐲",
    description: "A thousand years of hunger, rage, and fire. Kingdoms have fallen to lesser dragons.",
    tier: 5,
    stats: { str: 40, dex: 14, int: 22, vit: 50, wis: 16 },
    tags: ["beast", "magical"],
    boss: true,
  },
  {
    id: "shadow_lord",
    name: "Shadow Lord",
    icon: "🌑",
    description: "A being of pure darkness from beyond the veil. Reality bends in its presence.",
    tier: 5,
    stats: { str: 28, dex: 18, int: 35, vit: 38, wis: 24 },
    tags: ["demon", "magical"],
    boss: true,
  },
];

export function getEnemy(id: string): EnemyDefinition | undefined {
  return ENEMIES.find((e) => e.id === id);
}
