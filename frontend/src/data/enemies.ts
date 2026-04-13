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

// ─── Enemy Abilities ────────────────────────────────────────────

export interface EnemyAbility {
  id: string;
  name: string;
  icon: string;
  cooldown: number;
  /** When to use this ability */
  trigger: "always" | "hp_below_50" | "ally_dead" | "round_start" | "any_ally_below_30";
  /** What the ability does */
  effect:
    | { type: "bleed"; pctPerRound: number; rounds: number }
    | { type: "poison"; pctPerRound: number; rounds: number }
    | { type: "heal_self"; pct: number }
    | { type: "heal_ally"; pct: number }
    | { type: "summon"; enemyId: string; count: number }
    | { type: "aoe_damage"; pct: number; magical: boolean }
    | { type: "mind_control"; rounds: number }
    | { type: "buff_allies"; stat: "str" | "dex" | "int"; pct: number; rounds: number }
    | { type: "debuff_target"; stat: "str" | "dex" | "int"; pct: number; rounds: number }
    | { type: "revive_ally"; hpPct: number }
    | { type: "damage_mult"; mult: number; targets: number };
}

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
  abilities?: EnemyAbility[];
  loot?: LootDrop[];   // drops on kill — empty/undefined means no drops
}

export const ENEMIES: EnemyDefinition[] = [
  // ── Tier 1 — Common threats ───────────────────────────────────
  // Challenging for level 1-3 with no gear. Beatable with basic gear.
  {
    id: "goblin_scout",
    name: "Frontier Goblin",
    icon: "👺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/goblin_scout.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/bandit_thug.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/wild_wolf.png",
    description: "Lean, hungry, and hunting in packs. Since Le Declin, even the wolves have grown bolder.",
    tier: 1,
    stats: { str: 9, dex: 11, int: 1, vit: 10, wis: 3 },
    tags: ["beast"],
    abilities: [
      { id: "wolf_bite", name: "Rending Bite", icon: "🩸", cooldown: 3, trigger: "always",
        effect: { type: "bleed", pctPerRound: 10, rounds: 2 } },
    ],
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/giant_rat.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/skeleton.png",
    description: "Bones held together by Netheron's lingering death-magic. They don't tire and they don't stop.",
    tier: 1,
    stats: { str: 9, dex: 5, int: 3, vit: 14, wis: 1 },
    tags: ["undead"],
    abilities: [
      { id: "bone_reform", name: "Reassemble", icon: "💀", cooldown: 5, trigger: "hp_below_50",
        effect: { type: "heal_self", pct: 25 } },
    ],
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/orc_warrior.png",
    description: "Broad-shouldered and battle-scarred. Pushed south by the Wastes, they fight for territory now — kill or be displaced.",
    tier: 2,
    stats: { str: 18, dex: 7, int: 2, vit: 20, wis: 3 },
    tags: ["humanoid"],
    abilities: [
      { id: "orc_warcry", name: "War Cry", icon: "📯", cooldown: 4, trigger: "always",
        effect: { type: "buff_allies", stat: "str", pct: 20, rounds: 2 } },
    ],
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/skeleton_archer.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/bandit_captain.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/cave_spider.png",
    description: "Silent, venomous, and the size of a dog. The old Khazdurim mines are thick with them now.",
    tier: 2,
    stats: { str: 10, dex: 16, int: 1, vit: 12, wis: 2 },
    tags: ["beast"],
    abilities: [
      { id: "spider_venom", name: "Venomous Bite", icon: "☠️", cooldown: 3, trigger: "always",
        effect: { type: "poison", pctPerRound: 12, rounds: 3 } },
    ],
    loot: [
      { type: "resource", resource: "spinners_bile", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "chitin_plate", chance: 0.15, min: 1, max: 1 },
    ],
  },
  {
    id: "cursed_spirit",
    name: "Grief-Bound Spirit",
    icon: "👻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/cursed_spirit.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/orc_warlord.png",
    description: "Commands the displaced southern clans through strength alone. Kill the warlord and the warband scatters.",
    tier: 3,
    stats: { str: 26, dex: 8, int: 3, vit: 28, wis: 5 },
    tags: ["humanoid"],
    boss: true,
    abilities: [
      { id: "warlord_rally", name: "Rally the Clans", icon: "📯", cooldown: 4, trigger: "always",
        effect: { type: "buff_allies", stat: "str", pct: 30, rounds: 2 } },
      { id: "warlord_cleave", name: "Devastating Cleave", icon: "⚔️", cooldown: 3, trigger: "always",
        effect: { type: "damage_mult", mult: 2.0, targets: 2 } },
    ],
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/dark_mage.png",
    description: "A scholar who dug too deep into pre-Sundering texts. The air crackles and tastes of copper near him.",
    tier: 3,
    stats: { str: 4, dex: 7, int: 26, vit: 14, wis: 18 },
    tags: ["humanoid", "magical"],
    boss: true,
    abilities: [
      { id: "mind_control", name: "Dominate Mind", icon: "🧠", cooldown: 5, trigger: "always",
        effect: { type: "mind_control", rounds: 1 } },
      { id: "dark_bolt", name: "Dark Bolt", icon: "⚡", cooldown: 2, trigger: "always",
        effect: { type: "damage_mult", mult: 1.8, targets: 1 } },
    ],
    loot: [
      { type: "resource", resource: "astralShards", chance: 0.25, min: 1, max: 2 },
      { type: "item", itemId: "enchanted_staff", chance: 0.08 },
    ],
  },
  {
    id: "wraith",
    name: "Netheron's Shade",
    icon: "👤",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/wraith.png",
    description: "Not quite alive, not quite dead. Born where Netheron's death-essence seeps thickest. Steel passes through it.",
    tier: 3,
    stats: { str: 10, dex: 12, int: 20, vit: 16, wis: 14 },
    tags: ["ghost", "magical"],
    abilities: [
      { id: "life_drain", name: "Life Drain", icon: "💀", cooldown: 3, trigger: "always",
        effect: { type: "damage_mult", mult: 1.5, targets: 1 } },
      { id: "wail", name: "Chilling Wail", icon: "😱", cooldown: 4, trigger: "always",
        effect: { type: "debuff_target", stat: "str", pct: 30, rounds: 2 } },
    ],
    loot: [
      { type: "resource", resource: "ghostweave", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "veilmist", chance: 0.3, min: 1, max: 2 },
    ],
  },
  {
    id: "troll",
    name: "Thornveil Troll",
    icon: "🧌",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/troll.png",
    description: "Massive, foul-smelling, and nearly impossible to kill. The Thornveil Rangers say they've been pushing further from the Wastes each year.",
    tier: 3,
    stats: { str: 28, dex: 4, int: 1, vit: 35, wis: 2 },
    tags: ["beast"],
    boss: true,
    abilities: [
      { id: "troll_regen", name: "Regeneration", icon: "💚", cooldown: 0, trigger: "round_start",
        effect: { type: "heal_self", pct: 15 } },
      { id: "troll_slam", name: "Ground Slam", icon: "💥", cooldown: 4, trigger: "always",
        effect: { type: "aoe_damage", pct: 40, magical: false } },
    ],
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/flame_wisp.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/stone_golem.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/storm_sprite.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/tide_serpent.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/wailing_phantom.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/wyrmling.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/dragon_hatchling.png",
    description: "A few months old. Already singes stone. The Silvaneth warned us — the dragons are waking with the ley lines.",
    tier: 3,
    stats: { str: 18, dex: 10, int: 12, vit: 22, wis: 6 },
    tags: ["dragon", "magical"],
    abilities: [
      { id: "fire_breath_small", name: "Fire Breath", icon: "🔥", cooldown: 3, trigger: "always",
        effect: { type: "aoe_damage", pct: 35, magical: true } },
    ],
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/feral_drake.png",
    description: "An adolescent dragon that survived alone in the Hollow Wastes. Vicious, fast, and smart enough to ambush. It has never known kindness.",
    tier: 4,
    stats: { str: 26, dex: 16, int: 18, vit: 32, wis: 12 },
    tags: ["dragon", "magical"],
    boss: true,
    abilities: [
      { id: "drake_fire", name: "Inferno Breath", icon: "🔥", cooldown: 3, trigger: "always",
        effect: { type: "aoe_damage", pct: 50, magical: true } },
      { id: "drake_roar", name: "Terrifying Roar", icon: "😱", cooldown: 4, trigger: "always",
        effect: { type: "debuff_target", stat: "str", pct: 25, rounds: 2 } },
    ],
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/wasteland_wyrm.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/lich_apprentice.png",
    description: "A Hauts-Cieux scholar who traded his life for power. Not yet a true lich — but Netheron's whisper grows louder in him.",
    tier: 4,
    stats: { str: 8, dex: 8, int: 30, vit: 22, wis: 20 },
    tags: ["undead", "magical"],
    boss: true,
    abilities: [
      { id: "raise_dead", name: "Raise Dead", icon: "💀", cooldown: 5, trigger: "ally_dead",
        effect: { type: "revive_ally", hpPct: 40 } },
      { id: "death_bolt", name: "Death Bolt", icon: "⚡", cooldown: 2, trigger: "always",
        effect: { type: "damage_mult", mult: 2.0, targets: 1 } },
      { id: "summon_skeletons", name: "Summon Skeletons", icon: "💀", cooldown: 6, trigger: "always",
        effect: { type: "summon", enemyId: "skeleton", count: 2 } },
    ],
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/demon_scout.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/magma_golem.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/aether_wraith.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/temple_guardian.png",
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
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/enemies/banshee.png",
    description: "Her scream kills. Not metaphorically. A Silvaneth priestess who died in the Sundering and never forgave the world for surviving.",
    tier: 4,
    stats: { str: 4, dex: 16, int: 28, vit: 18, wis: 20 },
    tags: ["ghost", "magical"],
    boss: true,
    abilities: [
      { id: "banshee_scream", name: "Death Scream", icon: "💀", cooldown: 4, trigger: "always",
        effect: { type: "aoe_damage", pct: 45, magical: true } },
      { id: "banshee_wail", name: "Soul-Rending Wail", icon: "😱", cooldown: 5, trigger: "hp_below_50",
        effect: { type: "debuff_target", stat: "int", pct: 40, rounds: 3 } },
    ],
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
    abilities: [
      { id: "wyrm_inferno", name: "Ancient Inferno", icon: "🔥", cooldown: 3, trigger: "always",
        effect: { type: "aoe_damage", pct: 60, magical: true } },
      { id: "wyrm_crush", name: "Tail Crush", icon: "💥", cooldown: 2, trigger: "always",
        effect: { type: "damage_mult", mult: 2.5, targets: 2 } },
      { id: "wyrm_roar", name: "Primordial Roar", icon: "😱", cooldown: 5, trigger: "hp_below_50",
        effect: { type: "debuff_target", stat: "dex", pct: 40, rounds: 3 } },
    ],
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
    abilities: [
      { id: "void_dominate", name: "Dominate Will", icon: "🧠", cooldown: 5, trigger: "always",
        effect: { type: "mind_control", rounds: 2 } },
      { id: "void_blast", name: "Void Eruption", icon: "🌑", cooldown: 3, trigger: "always",
        effect: { type: "aoe_damage", pct: 55, magical: true } },
      { id: "reality_tear", name: "Reality Tear", icon: "💜", cooldown: 4, trigger: "hp_below_50",
        effect: { type: "summon", enemyId: "cursed_spirit", count: 2 } },
    ],
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
    abilities: [
      { id: "divine_wrath", name: "Divine Wrath", icon: "⚡", cooldown: 3, trigger: "always",
        effect: { type: "aoe_damage", pct: 55, magical: true } },
      { id: "seraph_heal", name: "Corrupted Blessing", icon: "💛", cooldown: 4, trigger: "any_ally_below_30",
        effect: { type: "heal_ally", pct: 40 } },
      { id: "judgment", name: "Righteous Judgment", icon: "👼", cooldown: 5, trigger: "hp_below_50",
        effect: { type: "damage_mult", mult: 3.0, targets: 1 } },
    ],
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

  // ── New Enemies — Content Expansion ────────────────────────────

  // ── Tier 1 — New Common Threats ─────────────────────────────────
  {
    id: "forest_bear",
    name: "Forest Bear",
    icon: "🐻",
    description: "A massive brown bear, territorial and aggressive. They don't hunt people — but they'll kill you if you're between them and their cubs.",
    tier: 1,
    stats: { str: 14, dex: 4, int: 2, vit: 16, wis: 3 },
    tags: ["beast"],
    abilities: [{ id: "maul", name: "Maul", icon: "🐾", cooldown: 2, trigger: "always", effect: { type: "damage_mult", mult: 1.5, targets: 1 } }],
    loot: [
      { type: "resource", resource: "food", chance: 0.5, min: 3, max: 8 },
      { type: "resource", resource: "thick_pelt", chance: 0.35, min: 1, max: 1 },
      { type: "resource", resource: "bear_claw", chance: 0.2, min: 1, max: 2 },
    ],
  },
  {
    id: "marsh_adder",
    name: "Marsh Adder",
    icon: "🐍",
    description: "Long as a man is tall, with venom that makes your blood burn. Settlers lose more livestock to these than to wolves.",
    tier: 1,
    stats: { str: 6, dex: 14, int: 2, vit: 8, wis: 2 },
    tags: ["beast"],
    abilities: [{ id: "venomous_strike", name: "Venomous Strike", icon: "☠️", cooldown: 2, trigger: "always", effect: { type: "poison", pctPerRound: 8, rounds: 3 } }],
    loot: [
      { type: "resource", resource: "serpent_fang", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "snake_oil", chance: 0.15, min: 1, max: 1 },
    ],
  },
  {
    id: "rabid_boar",
    name: "Rabid Boar",
    icon: "🐗",
    description: "Red-eyed and frothing. Something in the water near the Wastes drives them mad. They charge anything that moves.",
    tier: 1,
    stats: { str: 12, dex: 8, int: 1, vit: 14, wis: 1 },
    tags: ["beast"],
    abilities: [{ id: "charge", name: "Charge", icon: "💨", cooldown: 99, trigger: "round_start", effect: { type: "damage_mult", mult: 1.5, targets: 1 } }],
    loot: [
      { type: "resource", resource: "food", chance: 0.5, min: 2, max: 6 },
      { type: "resource", resource: "bristlehide", chance: 0.3, min: 1, max: 1 },
      { type: "resource", resource: "tusk_shard", chance: 0.2, min: 1, max: 1 },
    ],
  },
  {
    id: "fungal_crawler",
    name: "Fungal Crawler",
    icon: "🍄",
    description: "A dog-sized insect infested with luminous fungi. When threatened, it bursts spores that burn the lungs and blur the eyes.",
    tier: 1,
    stats: { str: 6, dex: 8, int: 4, vit: 10, wis: 2 },
    tags: ["beast", "magical"],
    abilities: [{ id: "spore_burst", name: "Spore Burst", icon: "💨", cooldown: 3, trigger: "always", effect: { type: "aoe_damage", pct: 15, magical: true } }],
    loot: [
      { type: "resource", resource: "glowcap_spore", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "chitin_plate", chance: 0.1, min: 1, max: 1 },
    ],
  },

  // ── Tier 2 — New Organized Threats ──────────────────────────────
  {
    id: "goblin_shaman",
    name: "Goblin Shaman",
    icon: "🧙",
    description: "Older, smarter, and meaner than the rank and file. Paints hexes on bones and screams at the sky until something listens.",
    tier: 2,
    stats: { str: 6, dex: 8, int: 16, vit: 12, wis: 10 },
    tags: ["humanoid", "magical"],
    abilities: [
      { id: "hex_bolt", name: "Hex Bolt", icon: "🔮", cooldown: 1, trigger: "always", effect: { type: "damage_mult", mult: 1.3, targets: 1 } },
      { id: "heal_ally_shaman", name: "Mend Flesh", icon: "💚", cooldown: 3, trigger: "any_ally_below_30", effect: { type: "heal_ally", pct: 25 } },
    ],
    loot: [
      { type: "resource", resource: "hex_fetish", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "crude_ruby", chance: 0.1, min: 1, max: 1 },
      { type: "resource", resource: "gold", chance: 0.3, min: 3, max: 8 },
    ],
  },
  {
    id: "ghoul",
    name: "Ghoul",
    icon: "🧟",
    description: "Not quite undead, not quite alive. Something that ate the wrong corpse near the Wastes and became this. It remembers being human. It doesn't care.",
    tier: 2,
    stats: { str: 14, dex: 10, int: 4, vit: 16, wis: 3 },
    tags: ["undead"],
    abilities: [{ id: "paralyzing_touch", name: "Paralyzing Touch", icon: "🥶", cooldown: 3, trigger: "always", effect: { type: "debuff_target", stat: "dex", pct: 50, rounds: 1 } }],
    loot: [
      { type: "resource", resource: "ghoul_marrow", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "grave_dust", chance: 0.2, min: 1, max: 2 },
    ],
  },
  {
    id: "alpha_wolf",
    name: "Alpha Wolf",
    icon: "🐺",
    description: "Twice the size of a Wastes Wolf, with scars from a dozen challengers. The pack follows where it leads, and it leads toward your livestock.",
    tier: 2,
    stats: { str: 16, dex: 14, int: 4, vit: 18, wis: 4 },
    tags: ["beast"],
    boss: true,
    abilities: [
      { id: "pack_howl", name: "Pack Howl", icon: "🌕", cooldown: 4, trigger: "round_start", effect: { type: "buff_allies", stat: "str", pct: 20, rounds: 2 } },
      { id: "lunge", name: "Lunge", icon: "💨", cooldown: 2, trigger: "always", effect: { type: "damage_mult", mult: 1.8, targets: 1 } },
    ],
    loot: [
      { type: "resource", resource: "alpha_fang", chance: 0.4, min: 1, max: 1 },
      { type: "resource", resource: "thick_pelt", chance: 0.6, min: 1, max: 2 },
      { type: "resource", resource: "sinew_cord", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "food", chance: 0.8, min: 4, max: 10 },
    ],
  },
  {
    id: "bog_witch",
    name: "Bog Witch",
    icon: "🧙‍♀️",
    description: "She lives in the marsh and talks to things that shouldn't talk back. The villagers used to trade with her. Then the livestock started dying.",
    tier: 2,
    stats: { str: 6, dex: 8, int: 18, vit: 14, wis: 14 },
    tags: ["humanoid", "magical"],
    boss: true,
    abilities: [
      { id: "curse_weakness", name: "Curse of Weakness", icon: "💀", cooldown: 3, trigger: "always", effect: { type: "debuff_target", stat: "str", pct: 25, rounds: 2 } },
      { id: "poison_cloud", name: "Poison Cloud", icon: "☁️", cooldown: 4, trigger: "always", effect: { type: "aoe_damage", pct: 20, magical: true } },
    ],
    loot: [
      { type: "resource", resource: "hex_fetish", chance: 0.5, min: 1, max: 2 },
      { type: "resource", resource: "witch_eye", chance: 0.2, min: 1, max: 1 },
      { type: "resource", resource: "nightbloom", chance: 0.15, min: 1, max: 1 },
      { type: "item", itemId: "witch_eye_trinket", chance: 0.08 },
    ],
  },
  {
    id: "burnt_skeleton",
    name: "Burnt Skeleton",
    icon: "🔥",
    description: "Blackened bones wreathed in sickly orange flame. Whatever killed them, the fire stayed. Touch them and you'll understand why.",
    tier: 2,
    stats: { str: 12, dex: 8, int: 8, vit: 10, wis: 2 },
    tags: ["undead", "elemental_fire"],
    abilities: [{ id: "self_immolate", name: "Self-Immolate", icon: "💥", cooldown: 99, trigger: "hp_below_50", effect: { type: "aoe_damage", pct: 20, magical: true } }],
    loot: [
      { type: "resource", resource: "charite", chance: 0.25, min: 1, max: 1 },
      { type: "resource", resource: "bonewalk_shard", chance: 0.2, min: 1, max: 2 },
      { type: "resource", resource: "crude_ruby", chance: 0.08, min: 1, max: 1 },
    ],
  },

  // ── Tier 3 — New Dangerous Foes ─────────────────────────────────
  {
    id: "corrupted_treant",
    name: "Corrupted Treant",
    icon: "🌳",
    description: "A tree that woke up angry. The Wastes corruption turned its roots to grasping hands and its sap to acid. It doesn't distinguish between threats and visitors.",
    tier: 3,
    stats: { str: 20, dex: 4, int: 12, vit: 28, wis: 8 },
    tags: ["beast", "magical", "elemental_earth"],
    abilities: [
      { id: "root_grasp", name: "Root Grasp", icon: "🌿", cooldown: 3, trigger: "always", effect: { type: "debuff_target", stat: "dex", pct: 50, rounds: 1 } },
      { id: "thorn_spray", name: "Thorn Spray", icon: "🌿", cooldown: 2, trigger: "always", effect: { type: "aoe_damage", pct: 30, magical: false } },
    ],
    loot: [
      { type: "resource", resource: "living_heartwood", chance: 0.3, min: 1, max: 1 },
      { type: "resource", resource: "amber_resin", chance: 0.2, min: 1, max: 2 },
      { type: "resource", resource: "emerald_shard", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "wood", chance: 0.8, min: 10, max: 25 },
    ],
  },
  {
    id: "necromancer_acolyte",
    name: "Necromancer Acolyte",
    icon: "💀",
    description: "A student of the forbidden arts, too clever for their own good. They raise the dead not out of malice but curiosity. That's worse.",
    tier: 3,
    stats: { str: 8, dex: 10, int: 22, vit: 16, wis: 16 },
    tags: ["humanoid", "undead", "magical"],
    boss: true,
    abilities: [
      { id: "raise_dead_acolyte", name: "Raise Dead", icon: "💀", cooldown: 5, trigger: "always", effect: { type: "summon", enemyId: "skeleton", count: 2 } },
      { id: "dark_bolt_acolyte", name: "Dark Bolt", icon: "⚡", cooldown: 1, trigger: "always", effect: { type: "damage_mult", mult: 1.5, targets: 1 } },
    ],
    loot: [
      { type: "resource", resource: "soul_shard", chance: 0.3, min: 1, max: 1 },
      { type: "resource", resource: "grave_dust", chance: 0.4, min: 1, max: 3 },
      { type: "resource", resource: "lichglass", chance: 0.1, min: 1, max: 1 },
      { type: "resource", resource: "gold", chance: 0.6, min: 10, max: 30 },
    ],
  },
  {
    id: "ember_elemental",
    name: "Ember Elemental",
    icon: "🔥",
    description: "A swirling column of living fire, born where ley lines crack and Aether bleeds into the world. It doesn't think. It just burns.",
    tier: 3,
    stats: { str: 16, dex: 12, int: 18, vit: 18, wis: 8 },
    tags: ["elemental_fire", "magical"],
    abilities: [
      { id: "flame_wave", name: "Flame Wave", icon: "🌊", cooldown: 3, trigger: "always", effect: { type: "aoe_damage", pct: 35, magical: true } },
      { id: "ignite", name: "Ignite", icon: "🔥", cooldown: 2, trigger: "always", effect: { type: "bleed", pctPerRound: 12, rounds: 3 } },
    ],
    loot: [
      { type: "resource", resource: "livingflame_bead", chance: 0.3, min: 1, max: 1 },
      { type: "resource", resource: "fire_ruby", chance: 0.15, min: 1, max: 1 },
    ],
  },
  {
    id: "frost_elemental",
    name: "Frost Elemental",
    icon: "❄️",
    description: "Where the Aether pools in cold places, ice takes shape and learns to hate warmth. It freezes the ground where it walks and the blood of anyone too slow to run.",
    tier: 3,
    stats: { str: 14, dex: 10, int: 20, vit: 20, wis: 10 },
    tags: ["elemental_water", "magical"],
    abilities: [
      { id: "frost_bolt", name: "Frost Bolt", icon: "❄️", cooldown: 1, trigger: "always", effect: { type: "damage_mult", mult: 1.5, targets: 1 } },
      { id: "freeze", name: "Freeze", icon: "🥶", cooldown: 4, trigger: "always", effect: { type: "debuff_target", stat: "dex", pct: 40, rounds: 1 } },
    ],
    loot: [
      { type: "resource", resource: "frozen_droplet", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "frost_sapphire", chance: 0.15, min: 1, max: 1 },
    ],
  },
  {
    id: "dire_bear",
    name: "Dire Bear",
    icon: "🐻",
    description: "The old hunters call them 'mountain kings.' Twice the size of a forest bear, scarred from a lifetime of fighting everything — including other dire bears. This one has claimed your territory.",
    tier: 3,
    stats: { str: 24, dex: 8, int: 4, vit: 30, wis: 6 },
    tags: ["beast"],
    boss: true,
    abilities: [
      { id: "savage_maul", name: "Savage Maul", icon: "🐾", cooldown: 2, trigger: "always", effect: { type: "damage_mult", mult: 2.0, targets: 1 } },
      { id: "roar", name: "Roar", icon: "🗣️", cooldown: 4, trigger: "round_start", effect: { type: "debuff_target", stat: "dex", pct: 30, rounds: 2 } },
    ],
    loot: [
      { type: "resource", resource: "thick_pelt", chance: 0.8, min: 2, max: 4 },
      { type: "resource", resource: "bear_claw", chance: 0.6, min: 1, max: 3 },
      { type: "resource", resource: "beast_heart", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "food", chance: 0.9, min: 8, max: 20 },
      { type: "item", itemId: "beast_heart_charm", chance: 0.08 },
    ],
  },
  {
    id: "swamp_revenant",
    name: "Swamp Revenant",
    icon: "👻",
    description: "Something drowned in the bog and didn't stay down. It rises from the black water trailing weeds and old rage. The locals say it's a Dominion soldier who deserted and was executed by his own unit.",
    tier: 3,
    stats: { str: 14, dex: 8, int: 14, vit: 20, wis: 10 },
    tags: ["undead", "ghost"],
    abilities: [
      { id: "drain_life", name: "Drain Life", icon: "💜", cooldown: 2, trigger: "always", effect: { type: "damage_mult", mult: 1.3, targets: 1 } },
    ],
    loot: [
      { type: "resource", resource: "ghostweave", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "grave_dust", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "snake_oil", chance: 0.2, min: 1, max: 1 },
    ],
  },

  // ── Tier 4 — New Elite Threats ──────────────────────────────────
  {
    id: "goblin_warchief",
    name: "Goblin Warchief",
    icon: "👑",
    description: "A goblin who killed enough other goblins to call himself king. He wears a crown of bent copper and commands a warband of hundreds. Underestimate him at your peril — he didn't survive this long by being stupid.",
    tier: 4,
    stats: { str: 22, dex: 18, int: 12, vit: 26, wis: 10 },
    tags: ["humanoid"],
    boss: true,
    abilities: [
      { id: "war_drums", name: "War Drums", icon: "🥁", cooldown: 4, trigger: "round_start", effect: { type: "buff_allies", stat: "str", pct: 25, rounds: 2 } },
      { id: "poison_blade_gc", name: "Poisoned Blade", icon: "🗡️", cooldown: 2, trigger: "always", effect: { type: "poison", pctPerRound: 15, rounds: 3 } },
      { id: "call_reinforcements", name: "Call Reinforcements", icon: "📯", cooldown: 99, trigger: "hp_below_50", effect: { type: "summon", enemyId: "goblin_scout", count: 2 } },
    ],
    loot: [
      { type: "resource", resource: "hex_fetish", chance: 0.6, min: 2, max: 4 },
      { type: "resource", resource: "crude_ruby", chance: 0.3, min: 1, max: 2 },
      { type: "resource", resource: "war_paint", chance: 0.5, min: 1, max: 3 },
      { type: "resource", resource: "gold", chance: 0.9, min: 30, max: 80 },
      { type: "item", itemId: "goblin_crown", chance: 0.06 },
    ],
  },
  {
    id: "arch_necromancer",
    name: "Arch-Necromancer",
    icon: "☠️",
    description: "The acolyte's master. Decades of studying death magic have left them barely human — skin like parchment, eyes like candleflame, and a soul that's been dead longer than some of the things they raise.",
    tier: 4,
    stats: { str: 10, dex: 12, int: 32, vit: 24, wis: 22 },
    tags: ["humanoid", "undead", "magical"],
    boss: true,
    abilities: [
      { id: "mass_raise", name: "Mass Raise", icon: "💀", cooldown: 5, trigger: "always", effect: { type: "summon", enemyId: "skeleton", count: 3 } },
      { id: "soul_harvest", name: "Soul Harvest", icon: "💜", cooldown: 3, trigger: "always", effect: { type: "aoe_damage", pct: 40, magical: true } },
      { id: "death_grip", name: "Death Grip", icon: "✊", cooldown: 4, trigger: "hp_below_50", effect: { type: "damage_mult", mult: 2.0, targets: 1 } },
    ],
    loot: [
      { type: "resource", resource: "lichglass", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "soul_shard", chance: 0.5, min: 1, max: 3 },
      { type: "resource", resource: "shadow_fragment", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "void_topaz", chance: 0.1, min: 1, max: 1 },
      { type: "item", itemId: "necromancer_cowl", chance: 0.06 },
    ],
  },
  {
    id: "storm_elemental",
    name: "Storm Elemental",
    icon: "⛈️",
    description: "A howling vortex of wind and lightning given malicious purpose. It moves faster than you can swing and hits everything at once. The Thornveil say they form where three ley lines cross during a thunderstorm.",
    tier: 4,
    stats: { str: 18, dex: 24, int: 26, vit: 22, wis: 14 },
    tags: ["elemental_wind", "magical"],
    abilities: [
      { id: "chain_lightning", name: "Chain Lightning", icon: "⚡", cooldown: 2, trigger: "always", effect: { type: "aoe_damage", pct: 30, magical: true } },
      { id: "static_field", name: "Static Field", icon: "⚡", cooldown: 4, trigger: "round_start", effect: { type: "debuff_target", stat: "dex", pct: 20, rounds: 2 } },
      { id: "thunder_crash", name: "Thunder Crash", icon: "💥", cooldown: 99, trigger: "hp_below_50", effect: { type: "aoe_damage", pct: 45, magical: true } },
    ],
    loot: [
      { type: "resource", resource: "thunderglass", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "storm_topaz", chance: 0.15, min: 1, max: 1 },
      { type: "resource", resource: "windweave_fiber", chance: 0.3, min: 1, max: 2 },
    ],
  },
  {
    id: "infernal_knight",
    name: "Infernal Knight",
    icon: "🔥",
    description: "A demon in stolen plate armor, wreathed in hellfire. It walked through the boundary like a door and hasn't stopped killing since. The armor is fused to its body — or its body grew to fill the armor. Hard to tell.",
    tier: 4,
    stats: { str: 28, dex: 14, int: 18, vit: 30, wis: 12 },
    tags: ["demon", "humanoid"],
    boss: true,
    abilities: [
      { id: "hellfire_slash", name: "Hellfire Slash", icon: "🔥", cooldown: 1, trigger: "always", effect: { type: "damage_mult", mult: 1.8, targets: 1 } },
      { id: "summon_flames", name: "Summon Flames", icon: "🔥", cooldown: 99, trigger: "hp_below_50", effect: { type: "aoe_damage", pct: 35, magical: true } },
    ],
    loot: [
      { type: "resource", resource: "ashblood", chance: 0.5, min: 1, max: 3 },
      { type: "resource", resource: "hellite", chance: 0.4, min: 1, max: 2 },
      { type: "resource", resource: "infernal_link", chance: 0.3, min: 1, max: 1 },
      { type: "resource", resource: "fire_ruby", chance: 0.2, min: 1, max: 1 },
      { type: "item", itemId: "infernal_signet", chance: 0.06 },
    ],
  },
];

export function getEnemy(id: string): EnemyDefinition | undefined {
  return ENEMIES.find((e) => e.id === id);
}
