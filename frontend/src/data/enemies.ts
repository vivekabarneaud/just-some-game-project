// ─── Enemy Definitions ──────────────────────────────────────────
// Enemies appear in mission encounters. Stats drive combat simulation.
// Enemy HP = VIT * 10. Natural armor = VIT / 3.
// Designed so unequipped adventurers struggle; gear makes the difference.

export type EnemyTag =
  | "humanoid" | "beast" | "undead" | "ghost" | "demon" | "divine" | "dragon"
  | "elemental_fire" | "elemental_water" | "elemental_earth" | "elemental_wind" | "elemental_aether"
  | "magical";

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
  tags: EnemyTag[];
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
    tags: ["ghost", "magical"],
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
    tags: ["ghost", "magical"],
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

  // ── Tier 3 — Elemental threats ──────────────────────────────
  {
    id: "flame_wisp",
    name: "Flame Wisp",
    icon: "🔥",
    description: "A dancing mote of living fire. Small, but it sets everything it touches ablaze.",
    tier: 3,
    stats: { str: 14, dex: 18, int: 16, vit: 14, wis: 6 },
    tags: ["elemental_fire", "magical"],
  },
  {
    id: "stone_golem",
    name: "Stone Golem",
    icon: "🗿",
    description: "A hulk of animated granite. It doesn't think, doesn't feel, and doesn't stop walking forward.",
    tier: 3,
    stats: { str: 28, dex: 2, int: 1, vit: 32, wis: 1 },
    tags: ["elemental_earth"],
    boss: true,
  },
  {
    id: "storm_sprite",
    name: "Storm Sprite",
    icon: "⚡",
    description: "A crackling ball of wind and lightning. Arrows pass through it. Swords find only air.",
    tier: 3,
    stats: { str: 6, dex: 24, int: 14, vit: 10, wis: 8 },
    tags: ["elemental_wind", "magical"],
  },
  {
    id: "tide_serpent",
    name: "Tide Serpent",
    icon: "🌊",
    description: "Born from stagnant river-Aether. Its body flows like water because it is water.",
    tier: 3,
    stats: { str: 16, dex: 14, int: 12, vit: 20, wis: 8 },
    tags: ["elemental_water", "magical"],
  },

  // ── Tier 3 — Ghost threats ────────────────────────────────────
  {
    id: "wailing_phantom",
    name: "Wailing Phantom",
    icon: "👻",
    description: "The boundary is thin here. This one remembers how it died — and wants you to share the experience.",
    tier: 3,
    stats: { str: 8, dex: 14, int: 22, vit: 12, wis: 16 },
    tags: ["ghost"],
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
    tags: ["dragon", "magical"],
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
  {
    id: "magma_golem",
    name: "Magma Golem",
    icon: "🌋",
    description: "Stone and fire fused into a walking furnace. The ground melts where it treads.",
    tier: 4,
    stats: { str: 30, dex: 4, int: 8, vit: 34, wis: 4 },
    tags: ["elemental_fire", "elemental_earth"],
    boss: true,
  },
  {
    id: "aether_wraith",
    name: "Aether Wraith",
    icon: "✨",
    description: "Pure crystallized magic given form. Spells dissolve against it. Only steel and fists will do.",
    tier: 4,
    stats: { str: 12, dex: 20, int: 28, vit: 20, wis: 18 },
    tags: ["elemental_aether", "magical"],
    boss: true,
  },
  {
    id: "temple_guardian",
    name: "Temple Guardian",
    icon: "⚜️",
    description: "A corrupted divine sentinel, still guarding a shrine whose god sleeps. It doesn't know the war is over.",
    tier: 4,
    stats: { str: 26, dex: 10, int: 18, vit: 28, wis: 22 },
    tags: ["divine", "magical"],
    boss: true,
  },
  {
    id: "banshee",
    name: "Banshee",
    icon: "💀",
    description: "Her scream kills. Not metaphorically. The sound stops hearts. Spirit-touched weapons or don't bother.",
    tier: 4,
    stats: { str: 4, dex: 16, int: 28, vit: 18, wis: 20 },
    tags: ["ghost", "magical"],
    boss: true,
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
    tags: ["dragon", "magical"],
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
  {
    id: "seraph_fallen",
    name: "Fallen Seraph",
    icon: "👼",
    description: "Once a fragment of divine will. Now corrupted, weeping light and fury. It still believes it's righteous.",
    tier: 5,
    stats: { str: 32, dex: 16, int: 30, vit: 36, wis: 28 },
    tags: ["divine", "magical"],
    boss: true,
  },
  {
    id: "aether_colossus",
    name: "Aether Colossus",
    icon: "💠",
    description: "A towering construct of pure crystallized Aether. Magic is meaningless against it. Bring hammers.",
    tier: 5,
    stats: { str: 20, dex: 8, int: 38, vit: 44, wis: 26 },
    tags: ["elemental_aether"],
    boss: true,
  },
];

export function getEnemy(id: string): EnemyDefinition | undefined {
  return ENEMIES.find((e) => e.id === id);
}
