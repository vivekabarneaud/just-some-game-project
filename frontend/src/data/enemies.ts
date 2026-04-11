// ─── Enemy Definitions ──────────────────────────────────────────
// Enemies appear in mission encounters. Stats drive combat simulation.
// Enemy HP = VIT * 10. Natural armor = VIT / 3.
// Designed so unequipped adventurers struggle; gear makes the difference.

export type EnemyTag =
  | "humanoid" | "beast" | "undead" | "ghost" | "demon" | "divine" | "dragon"
  | "elemental_fire" | "elemental_water" | "elemental_earth" | "elemental_wind" | "elemental_aether"
  | "magical";

// ─── Loot Tables ────────────────────────────────────────────────
// Each enemy can drop resources (common) or items (rare, mostly bosses).
// `chance` is 0-1 probability per kill. `min`/`max` is amount range.

export interface ResourceDrop {
  type: "resource";
  resource: string;    // "gold", "wood", "stone", "food", "astralShards", herb IDs, etc.
  chance: number;      // 0-1 probability per kill
  min: number;
  max: number;
}

export interface ItemDrop {
  type: "item";
  itemId: string;      // item ID from items.ts
  chance: number;      // 0-1 probability per kill (typically low for bosses)
}

export type LootDrop = ResourceDrop | ItemDrop;

// ─── Enemy Definitions ─────────────────────────────────────────

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
  loot?: LootDrop[];   // drops on kill — empty/undefined means no drops
}

export const ENEMIES: EnemyDefinition[] = [
  // ── Tier 1 — Common threats ───────────────────────────────────
  // Challenging for level 1-3 with no gear. Beatable with basic gear.
  {
    id: "goblin_scout",
    name: "Frontier Goblin",
    icon: "👺",
    image: "/images/enemies/goblin_scout.png",
    description: "Small, sneaky, and cowardly alone — but they never come alone. The frontier breeds them like flies.",
    tier: 1,
    stats: { str: 8, dex: 10, int: 2, vit: 10, wis: 2 },
    tags: ["humanoid"],
    loot: [
      { type: "resource", resource: "gold", chance: 0.4, min: 2, max: 8 },
    ],
  },
  {
    id: "bandit_thug",
    name: "Displaced Brigand",
    icon: "🗡️",
    image: "/images/enemies/bandit_thug.png",
    description: "A desperate man with a rusty blade. Probably a farmer before the Sundering took his land.",
    tier: 1,
    stats: { str: 10, dex: 6, int: 2, vit: 12, wis: 3 },
    tags: ["humanoid"],
    loot: [
      { type: "resource", resource: "gold", chance: 0.5, min: 3, max: 10 },
    ],
  },
  {
    id: "wild_wolf",
    name: "Wastes Wolf",
    icon: "🐺",
    image: "/images/enemies/wild_wolf.png",
    description: "Lean, hungry, and hunting in packs. Since Le Declin, even the wolves have grown bolder.",
    tier: 1,
    stats: { str: 9, dex: 11, int: 1, vit: 10, wis: 3 },
    tags: ["beast"],
    loot: [
      { type: "resource", resource: "food", chance: 0.4, min: 2, max: 6 },
      { type: "resource", resource: "wolfhide_strip", chance: 0.3, min: 1, max: 1 },
      { type: "resource", resource: "fang", chance: 0.2, min: 1, max: 2 },
      { type: "resource", resource: "sinew_cord", chance: 0.15, min: 1, max: 1 },
    ],
  },
  {
    id: "giant_rat",
    name: "Ruin Rat",
    icon: "🐀",
    image: "/images/enemies/giant_rat.png",
    description: "Bloated and disease-ridden. They breed in every ruin the Sundering left behind.",
    tier: 1,
    stats: { str: 7, dex: 9, int: 1, vit: 8, wis: 1 },
    tags: ["beast"],
    loot: [
      { type: "resource", resource: "food", chance: 0.2, min: 1, max: 3 },
      { type: "resource", resource: "gnawed_marrow", chance: 0.2, min: 1, max: 1 },
    ],
  },
  {
    id: "skeleton",
    name: "Barrowfield Walker",
    icon: "💀",
    image: "/images/enemies/skeleton.png",
    description: "Bones held together by Netheron's lingering death-magic. They don't tire and they don't stop.",
    tier: 1,
    stats: { str: 9, dex: 5, int: 3, vit: 14, wis: 1 },
    tags: ["undead"],
    loot: [
      { type: "resource", resource: "bonewalk_shard", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "barrow_ash", chance: 0.15, min: 1, max: 1 },
    ],
  },

  // ── Tier 2 — Organized threats ────────────────────────────────
  // Require level 4-6 WITH basic gear. Dangerous without.
  {
    id: "orc_warrior",
    name: "Ghar'kal Raider",
    icon: "👹",
    image: "/images/enemies/orc_warrior.png",
    description: "Broad-shouldered and battle-scarred. Pushed south by the Wastes, they fight for territory now — kill or be displaced.",
    tier: 2,
    stats: { str: 18, dex: 7, int: 2, vit: 20, wis: 3 },
    tags: ["humanoid"],
    loot: [
      { type: "resource", resource: "gold", chance: 0.5, min: 5, max: 15 },
      { type: "resource", resource: "orc_steel", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "war_paint", chance: 0.1, min: 1, max: 1 },
    ],
  },
  {
    id: "skeleton_archer",
    name: "Barrowfield Archer",
    icon: "🏹",
    image: "/images/enemies/skeleton_archer.png",
    description: "Dead eyes, steady aim. Barrowfield archers who kept their skill past death. They never miss twice.",
    tier: 2,
    stats: { str: 6, dex: 16, int: 3, vit: 12, wis: 2 },
    tags: ["undead"],
    loot: [
      { type: "resource", resource: "cursed_iron", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "bonewalk_shard", chance: 0.3, min: 1, max: 2 },
    ],
  },
  {
    id: "bandit_captain",
    name: "Dominion Deserter",
    icon: "⚔️",
    image: "/images/enemies/bandit_captain.png",
    description: "A former Dominion soldier turned outlaw. Dangerous because he still fights like one.",
    tier: 2,
    stats: { str: 16, dex: 11, int: 5, vit: 18, wis: 5 },
    tags: ["humanoid"],
    boss: true,
    loot: [
      { type: "resource", resource: "gold", chance: 0.8, min: 15, max: 40 },
      { type: "item", itemId: "iron_sword", chance: 0.10 },
    ],
  },
  {
    id: "cave_spider",
    name: "Khazdurim Spinner",
    icon: "🕷️",
    image: "/images/enemies/cave_spider.png",
    description: "Silent, venomous, and the size of a dog. The old Khazdurim mines are thick with them now.",
    tier: 2,
    stats: { str: 10, dex: 16, int: 1, vit: 12, wis: 2 },
    tags: ["beast"],
    loot: [
      { type: "resource", resource: "spinners_bile", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "chitin_plate", chance: 0.15, min: 1, max: 1 },
    ],
  },
  {
    id: "cursed_spirit",
    name: "Grief-Bound Spirit",
    icon: "👻",
    image: "/images/enemies/cursed_spirit.png",
    description: "A restless soul from before the Sundering, bound to this place by old grief. Its wail chills the blood.",
    tier: 2,
    stats: { str: 4, dex: 8, int: 16, vit: 14, wis: 10 },
    tags: ["ghost", "magical"],
    loot: [
      { type: "resource", resource: "veilmist", chance: 0.20, min: 1, max: 1 },
      { type: "resource", resource: "soul_shard", chance: 0.08, min: 1, max: 1 },
    ],
  },

  // ── Tier 3 — Dangerous foes ───────────────────────────────────
  // Require level 6-10 with decent gear. Party composition matters.
  {
    id: "orc_warlord",
    name: "Ghar'kal Warlord",
    icon: "🔱",
    image: "/images/enemies/orc_warlord.png",
    description: "Commands the displaced southern clans through strength alone. Kill the warlord and the warband scatters.",
    tier: 3,
    stats: { str: 26, dex: 8, int: 3, vit: 28, wis: 5 },
    tags: ["humanoid"],
    boss: true,
    loot: [
      { type: "resource", resource: "gold", chance: 0.9, min: 30, max: 80 },
      { type: "resource", resource: "orc_steel", chance: 0.5, min: 1, max: 3 },
      { type: "resource", resource: "torn_banner", chance: 0.3, min: 1, max: 1 },
      { type: "item", itemId: "iron_armor", chance: 0.08 },
    ],
  },
  {
    id: "dark_mage",
    name: "Veil-Touched Scholar",
    icon: "🧙",
    image: "/images/enemies/dark_mage.png",
    description: "A scholar who dug too deep into pre-Sundering texts. The air crackles and tastes of copper near him.",
    tier: 3,
    stats: { str: 4, dex: 7, int: 26, vit: 14, wis: 18 },
    tags: ["humanoid", "magical"],
    boss: true,
    loot: [
      { type: "resource", resource: "astralShards", chance: 0.25, min: 1, max: 2 },
      { type: "item", itemId: "enchanted_staff", chance: 0.08 },
    ],
  },
  {
    id: "wraith",
    name: "Netheron's Shade",
    icon: "👤",
    image: "/images/enemies/wraith.png",
    description: "Not quite alive, not quite dead. Born where Netheron's death-essence seeps thickest. Steel passes through it.",
    tier: 3,
    stats: { str: 10, dex: 12, int: 20, vit: 16, wis: 14 },
    tags: ["ghost", "magical"],
    loot: [
      { type: "resource", resource: "ghostweave", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "veilmist", chance: 0.3, min: 1, max: 2 },
    ],
  },
  {
    id: "troll",
    name: "Thornveil Troll",
    icon: "🧌",
    image: "/images/enemies/troll.png",
    description: "Massive, foul-smelling, and nearly impossible to kill. The Thornveil Rangers say they've been pushing further from the Wastes each year.",
    tier: 3,
    stats: { str: 28, dex: 4, int: 1, vit: 35, wis: 2 },
    tags: ["beast"],
    boss: true,
    loot: [
      { type: "resource", resource: "trollhide", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "gnawed_marrow", chance: 0.6, min: 2, max: 4 },
      { type: "resource", resource: "gold", chance: 0.5, min: 10, max: 30 },
    ],
  },

  // ── Tier 3 — Elemental threats ──────────────────────────────
  {
    id: "flame_wisp",
    name: "Ley-Flame Wisp",
    icon: "🔥",
    image: "/images/enemies/flame_wisp.png",
    description: "A mote of living Aether-fire, born where the ley lines broke during the Sundering. Small, but it sets everything ablaze.",
    tier: 3,
    stats: { str: 14, dex: 18, int: 16, vit: 14, wis: 6 },
    tags: ["elemental_fire", "magical"],
    loot: [
      { type: "resource", resource: "livingflame_bead", chance: 0.25, min: 1, max: 1 },
    ],
  },
  {
    id: "stone_golem",
    name: "Aether-Hewn Golem",
    icon: "🗿",
    image: "/images/enemies/stone_golem.png",
    description: "A hulk of animated granite, shaped by Aether leaking from a shattered ley line. It doesn't think, doesn't feel, and doesn't stop.",
    tier: 3,
    stats: { str: 28, dex: 2, int: 1, vit: 32, wis: 1 },
    tags: ["elemental_earth"],
    boss: true,
    loot: [
      { type: "resource", resource: "heartstone", chance: 0.3, min: 1, max: 1 },
      { type: "resource", resource: "stone", chance: 0.9, min: 20, max: 50 },
    ],
  },
  {
    id: "storm_sprite",
    name: "Sky-Thorn",
    icon: "⚡",
    image: "/images/enemies/storm_sprite.png",
    description: "A crackling ball of wind and lightning. The Khor'vani call them sky-thorns — they swarm where Aether converges.",
    tier: 3,
    stats: { str: 6, dex: 24, int: 14, vit: 10, wis: 8 },
    tags: ["elemental_wind", "magical"],
    loot: [
      { type: "resource", resource: "thunderglass", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "windweave_fiber", chance: 0.15, min: 1, max: 1 },
    ],
  },
  {
    id: "tide_serpent",
    name: "Aether Serpent",
    icon: "🌊",
    image: "/images/enemies/tide_serpent.png",
    description: "Born from stagnant Aether pooling in old Khazdurim waterways. Its body flows like water because it is water.",
    tier: 3,
    stats: { str: 16, dex: 14, int: 12, vit: 20, wis: 8 },
    tags: ["elemental_water", "magical"],
    loot: [
      { type: "resource", resource: "frozen_droplet", chance: 0.2, min: 1, max: 1 },
    ],
  },

  // ── Tier 3 — Ghost threats ────────────────────────────────────
  {
    id: "wailing_phantom",
    name: "Wastes Phantom",
    icon: "👻",
    image: "/images/enemies/wailing_phantom.png",
    description: "The boundary between realms is thin near the Wastes. This one remembers how it died — and wants you to share the experience.",
    tier: 3,
    stats: { str: 8, dex: 14, int: 22, vit: 12, wis: 16 },
    tags: ["ghost"],
    loot: [
      { type: "resource", resource: "veilmist", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "ghostweave", chance: 0.10, min: 1, max: 1 },
    ],
  },

  // ── Dragon threats (spread across tiers) ───────────────────────
  {
    id: "wyrmling",
    name: "Stray Wyrmling",
    icon: "🦎",
    image: "/images/enemies/wyrmling.png",
    description: "Barely hatched and confused. The Thornveil scouts say dragon clutches are appearing further from the mountains each season.",
    tier: 2,
    stats: { str: 12, dex: 14, int: 6, vit: 14, wis: 4 },
    tags: ["dragon", "magical"],
    loot: [
      { type: "resource", resource: "dragonfire_ash", chance: 0.3, min: 1, max: 2 },
    ],
  },
  {
    id: "dragon_hatchling",
    name: "Ley-Woken Hatchling",
    icon: "🐉",
    image: "/images/enemies/dragon_hatchling.png",
    description: "A few months old. Already singes stone. The Silvaneth warned us — the dragons are waking with the ley lines.",
    tier: 3,
    stats: { str: 18, dex: 10, int: 12, vit: 22, wis: 6 },
    tags: ["dragon", "magical"],
    loot: [
      { type: "resource", resource: "wyrmshell_plate", chance: 0.25, min: 1, max: 2 },
      { type: "resource", resource: "dragonfire_ash", chance: 0.4, min: 1, max: 3 },
    ],
  },

  // ── Tier 4 — Elite threats ────────────────────────────────────
  // Require level 10-15 with good gear. Full party required.
  {
    id: "feral_drake",
    name: "Hollow Drake",
    icon: "🐉",
    image: "/images/enemies/feral_drake.png",
    description: "An adolescent dragon that survived alone in the Hollow Wastes. Vicious, fast, and smart enough to ambush. It has never known kindness.",
    tier: 4,
    stats: { str: 26, dex: 16, int: 18, vit: 32, wis: 12 },
    tags: ["dragon", "magical"],
    boss: true,
    loot: [
      { type: "resource", resource: "wyrmshell_plate", chance: 0.5, min: 2, max: 4 },
      { type: "resource", resource: "dragon_blood", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "dragon_fang", chance: 0.2, min: 1, max: 1 },
    ],
  },
  {
    id: "wasteland_wyrm",
    name: "Netheron's Wyrm",
    icon: "🐲",
    image: "/images/enemies/wasteland_wyrm.png",
    description: "A dragon born too close to Netheron's corpse. Its scales are blackened, its breath is necrotic. The land dies where it rests.",
    tier: 4,
    stats: { str: 30, dex: 12, int: 22, vit: 36, wis: 14 },
    tags: ["dragon", "magical", "undead"],
    boss: true,
    loot: [
      { type: "resource", resource: "wyrmshell_plate", chance: 0.6, min: 2, max: 5 },
      { type: "resource", resource: "dragon_blood", chance: 0.4, min: 1, max: 3 },
      { type: "resource", resource: "shadow_fragment", chance: 0.15, min: 1, max: 1 },
    ],
  },
  {
    id: "lich_apprentice",
    name: "Half-Lich",
    icon: "☠️",
    image: "/images/enemies/lich_apprentice.png",
    description: "A Hauts-Ciels scholar who traded his life for power. Not yet a true lich — but Netheron's whisper grows louder in him.",
    tier: 4,
    stats: { str: 8, dex: 8, int: 30, vit: 22, wis: 20 },
    tags: ["undead", "magical"],
    boss: true,
    loot: [
      { type: "resource", resource: "lichglass", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "shimmer", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "barrow_ash", chance: 0.5, min: 2, max: 4 },
      { type: "item", itemId: "enchanted_staff", chance: 0.06 },
    ],
  },
  {
    id: "demon_scout",
    name: "Ashland Fiend",
    icon: "😈",
    image: "/images/enemies/demon_scout.png",
    description: "A minor fiend slipping through cracks the Sundering left in the veil. Its masters in the Ashlands are watching.",
    tier: 4,
    stats: { str: 22, dex: 16, int: 14, vit: 24, wis: 12 },
    tags: ["demon", "magical"],
    loot: [
      { type: "resource", resource: "ashblood", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "hellite", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "infernal_link", chance: 0.15, min: 1, max: 1 },
    ],
  },
  {
    id: "magma_golem",
    name: "Ironspine Golem",
    icon: "🌋",
    image: "/images/enemies/magma_golem.png",
    description: "Stone and fire fused by raw Aether deep beneath the Ironspine. The Khazdurim sealed these things away. The seals are failing.",
    tier: 4,
    stats: { str: 30, dex: 4, int: 8, vit: 34, wis: 4 },
    tags: ["elemental_fire", "elemental_earth"],
    boss: true,
    loot: [
      { type: "resource", resource: "heartstone", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "livingflame_bead", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "stone", chance: 0.8, min: 30, max: 60 },
    ],
  },
  {
    id: "aether_wraith",
    name: "Crystalline Revenant",
    icon: "✨",
    image: "/images/enemies/aether_wraith.png",
    description: "Pure crystallized Aether given form. Spells dissolve on contact — it eats magic. Only steel and fists will do.",
    tier: 4,
    stats: { str: 12, dex: 20, int: 28, vit: 20, wis: 18 },
    tags: ["elemental_aether", "magical"],
    boss: true,
    loot: [
      { type: "resource", resource: "shimmer", chance: 0.5, min: 1, max: 3 },
      { type: "resource", resource: "astralShards", chance: 0.4, min: 1, max: 2 },
    ],
  },
  {
    id: "temple_guardian",
    name: "Korrath's Sentinel",
    icon: "⚜️",
    image: "/images/enemies/temple_guardian.png",
    description: "A divine sentinel of Korrath, still guarding his shrine after millennia. It doesn't know its god is dormant.",
    tier: 4,
    stats: { str: 26, dex: 10, int: 18, vit: 28, wis: 22 },
    tags: ["divine", "magical"],
    boss: true,
    loot: [
      { type: "resource", resource: "godspark", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "dormant_sigil", chance: 0.25, min: 1, max: 1 },
    ],
  },
  {
    id: "banshee",
    name: "Silvaneth Banshee",
    icon: "💀",
    image: "/images/enemies/banshee.png",
    description: "Her scream kills. Not metaphorically. A Silvaneth priestess who died in the Sundering and never forgave the world for surviving.",
    tier: 4,
    stats: { str: 4, dex: 16, int: 28, vit: 18, wis: 20 },
    tags: ["ghost", "magical"],
    boss: true,
    loot: [
      { type: "resource", resource: "keening_shard", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "ghostweave", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "veilmist", chance: 0.5, min: 1, max: 3 },
    ],
  },

  // ── Tier 5 — Legendary ────────────────────────────────────────
  // Require level 18+ fully geared elite party. Expect casualties.
  {
    id: "ancient_wyrm",
    name: "Elder Wyrm",
    icon: "🐲",
    description: "A thousand years of hunger, rage, and fire. It remembers the world before the Sundering. Kingdoms have fallen to lesser dragons.",
    tier: 5,
    stats: { str: 40, dex: 14, int: 22, vit: 50, wis: 16 },
    tags: ["dragon", "magical"],
    boss: true,
    loot: [
      { type: "resource", resource: "wyrm_scale", chance: 0.8, min: 3, max: 6 },
      { type: "resource", resource: "dragon_blood", chance: 0.7, min: 2, max: 5 },
      { type: "resource", resource: "wyrm_heart", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "astralShards", chance: 0.9, min: 3, max: 8 },
    ],
  },
  {
    id: "shadow_lord",
    name: "Voidwalker",
    icon: "🌑",
    description: "A being of pure darkness from beyond the veil the gods once maintained. With them dormant, it walks freely.",
    tier: 5,
    stats: { str: 28, dex: 18, int: 35, vit: 38, wis: 24 },
    tags: ["demon", "magical"],
    boss: true,
    loot: [
      { type: "resource", resource: "shadow_fragment", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "voidthorn", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "ashblood", chance: 0.6, min: 2, max: 4 },
      { type: "resource", resource: "astralShards", chance: 0.9, min: 3, max: 6 },
    ],
  },
  {
    id: "seraph_fallen",
    name: "Fallen Seraph",
    icon: "👼",
    description: "Once a fragment of divine will, abandoned when the gods fell dormant. Now corrupted, weeping light and fury. It still believes it's righteous.",
    tier: 5,
    stats: { str: 32, dex: 16, int: 30, vit: 36, wis: 28 },
    tags: ["divine", "magical"],
    boss: true,
    loot: [
      { type: "resource", resource: "seraphs_grief", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "godspark", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "astralShards", chance: 0.9, min: 4, max: 8 },
    ],
  },
  {
    id: "aether_colossus",
    name: "Aether Colossus of the Old Age",
    icon: "💠",
    description: "A towering construct of pure crystallized Aether from the age before the Sundering. Magic is meaningless against it. Bring hammers.",
    tier: 5,
    stats: { str: 20, dex: 8, int: 38, vit: 44, wis: 26 },
    tags: ["elemental_aether"],
    boss: true,
    loot: [
      { type: "resource", resource: "aether_core", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "shimmer", chance: 0.8, min: 3, max: 6 },
      { type: "resource", resource: "astralShards", chance: 0.9, min: 5, max: 10 },
    ],
  },
];

export function getEnemy(id: string): EnemyDefinition | undefined {
  return ENEMIES.find((e) => e.id === id);
}
