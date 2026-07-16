// ─── Crafting Materials ────────────────────────────────────────
// Monster drops and rare finds. Stored in inventory, used in crafting recipes.

export type MaterialCategory = "hide" | "bone" | "metal" | "cloth" | "alchemy" | "enchanting" | "gem" | "dragon";

export interface MaterialDefinition {
  id: string;
  name: string;
  icon: string;
  image?: string;
  description: string;   // flavor text
  category: MaterialCategory;
  tier: 1 | 2 | 3 | 4 | 5;  // rarity tier, matches enemy tiers
}

export const MATERIALS: MaterialDefinition[] = [
  // ── Hides & Leather ──────────────────────────────────────────
  {
    id: "wolfhide_strip", name: "Wolfhide Strip", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/wolfhide_strip.png", icon: "🐺",
    description: "Tough and pungent. The frontier tanners prefer it to cattle leather.",
    category: "hide", tier: 1,
  },
  {
    id: "chitin_plate", name: "Chitin Plate", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/chitin_plate.png", icon: "🕷️",
    description: "Peeled from a cave spider's back. Light as wood, hard as iron.",
    category: "hide", tier: 2,
  },
  {
    id: "trollhide", name: "Trollhide", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/trollhide.png", icon: "🧌",
    description: "Still warm hours after skinning. The regeneration lingers in the leather.",
    category: "hide", tier: 3,
  },
  {
    id: "wyrmshell_plate", name: "Wyrmshell Plate", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/wyrmshell_plate.png", icon: "🐉",
    description: "A dragon scale the size of a dinner plate. Forge-resistant — you'll need dragonfire to shape it.",
    category: "hide", tier: 3,
  },
  {
    id: "wyrm_scale", name: "Wyrm Scale", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/wyrm_scale.png", icon: "🐲",
    description: "From an ancient wyrm. Iridescent, warm to the touch, and harder than any steel the Khazdurim have forged.",
    category: "hide", tier: 5,
  },

  // ── Bone & Sinew ─────────────────────────────────────────────
  {
    id: "gnawed_marrow", name: "Gnawed Marrow", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/gnawed_marrow.png", icon: "🦴",
    description: "Cracked open and half-eaten. Still useful for bone meal and alchemical grinding.",
    category: "bone", tier: 1,
  },
  {
    id: "bonewalk_shard", name: "Bonewalk Shard", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/bonewalk_shard.png", icon: "💀",
    description: "A piece of a skeleton that kept walking after death. The marrow hums faintly.",
    category: "bone", tier: 1,
  },
  {
    id: "sinew_cord", name: "Sinew Cord", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/sinew_cord.png", icon: "🪢",
    description: "Dried wolf tendon, twisted tight. Makes a bowstring that won't snap in the cold.",
    category: "bone", tier: 1,
  },
  {
    id: "fang", name: "Fang", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/fang.png", icon: "🦷",
    description: "Long, curved, and still sharp. The Zah'kari string them on necklaces for courage.",
    category: "bone", tier: 1,
  },
  {
    id: "dragon_fang", name: "Dragon Fang", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/dragon_fang.png", icon: "🦷",
    description: "Hot to the touch even weeks after extraction. A Blacksmith's dream — and nightmare.",
    category: "bone", tier: 4,
  },

  // ── Metal & Salvage ──────────────────────────────────────────
  {
    id: "steel", name: "Steel", icon: "⚙️",
    description: "Iron carburized in the forge — harder than plain iron, and it keeps an edge. The backbone of any decent blade.",
    category: "metal", tier: 1,
  },
  {
    id: "highwaymans_steel", name: "Highwayman's Steel", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/highwaymans_steel.png", icon: "🔩",
    description: "Rusty, chipped, but serviceable. Melt it down and the iron remembers its shape.",
    category: "metal", tier: 1,
  },
  {
    id: "cursed_iron", name: "Cursed Iron", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/cursed_iron.png", icon: "⛓️",
    description: "Taken from an undead archer's quiver. Cold to the touch, always. The Blacksmith says it holds an edge forever.",
    category: "metal", tier: 2,
  },
  {
    id: "orc_steel", name: "Orc Steel", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/orc_steel.png", icon: "⚔️",
    description: "Crude but brutally effective. Heavier than Dominion steel, with an ugly green tint.",
    category: "metal", tier: 2,
  },
  {
    id: "infernal_link", name: "Infernal Link", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/infernal_link.png", icon: "🔗",
    description: "A single chain link from a demon's armor. It doesn't rust, doesn't cool, and hums when holy water is near.",
    category: "metal", tier: 4,
  },

  // ── Cloth & Thread ───────────────────────────────────────────
  {
    id: "torn_banner", name: "Torn Banner", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/torn_banner.png", icon: "🏴",
    description: "Ripped from an orc warlord's standard. The dye is surprisingly fine — the Tailors can work with this.",
    category: "cloth", tier: 2,
  },
  {
    id: "ghostweave", name: "Ghostweave", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/ghostweave.png", icon: "🕸️",
    description: "Thread spun from spectral residue. Nearly invisible, cold as moonlight, and impossibly strong.",
    category: "cloth", tier: 3,
  },
  {
    id: "windweave_fiber", name: "Windweave Fiber", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/windweave_fiber.png", icon: "💨",
    description: "Harvested from a storm sprite's wake. Cloth made from this weighs nothing and dries instantly.",
    category: "cloth", tier: 3,
  },

  // ── Alchemy Ingredients ──────────────────────────────────────
  {
    id: "spinners_bile", name: "Spinner's Bile", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/spinners_bile.png", icon: "🧪",
    description: "Venom from a cave spider. The frontier folk call them Spinners. Don't drink this. Obviously.",
    category: "alchemy", tier: 2,
  },
  {
    id: "barrow_ash", name: "Barrow Ash", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/barrow_ash.png", icon: "⚱️",
    description: "Grey dust from where the dead walked. Alchemists say it stabilizes volatile mixtures. Nobody asks why.",
    category: "alchemy", tier: 2,
  },
  {
    id: "war_paint", name: "War Paint", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/war_paint.png", icon: "🎨",
    description: "Scraped from an orc's face. The pigment is mixed with something alchemical — it numbs the skin and dulls pain.",
    category: "alchemy", tier: 2,
  },
  {
    id: "dragon_blood", name: "Dragon Blood", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/dragon_blood.png", icon: "🩸",
    description: "Thick, hot, and luminous. A single vial can fuel a dozen potions. Handle with gloves.",
    category: "alchemy", tier: 4,
  },
  {
    id: "dragonfire_ash", name: "Dragonfire Ash", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/dragonfire_ash.png", icon: "🔥",
    description: "What's left after dragonfire burns the air itself. Smells like a forge and a thunderstorm had a child.",
    category: "alchemy", tier: 2,
  },
  {
    id: "ashblood", name: "Ashblood", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/ashblood.png", icon: "🩸",
    description: "Demon blood. It smells like burning hair and moves on its own when left in a bowl. The Khor'vani pay well for this.",
    category: "alchemy", tier: 4,
  },
  {
    id: "hellite", name: "Hellite", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/hellite.png", icon: "💜",
    description: "Crystallized brimstone from the demon realm. Burns cold. The Alchemists say it's 'theoretically useful and practically terrifying.'",
    category: "alchemy", tier: 4,
  },

  // ── Enchanting Essences ──────────────────────────────────────
  {
    id: "veilmist", name: "Veilmist", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/veilmist.png", icon: "🌫️",
    description: "Mist from the other side of the boundary. Collected in a sealed flask, it swirls endlessly. The dead breathe this.",
    category: "enchanting", tier: 2,
  },
  {
    id: "soul_shard", name: "Soul Shard", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/soul_shard.png", icon: "💎",
    description: "A splinter of crystallized life-force. It pulses faintly. The Thornveil say it's not a thing — it's a person.",
    category: "enchanting", tier: 2,
  },
  {
    id: "shimmer", name: "Shimmer", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/shimmer.png", icon: "✨",
    description: "Pure Aether dust. Weightless, warm, and faintly luminous. The base ingredient for any serious enchantment.",
    category: "enchanting", tier: 4,
  },
  {
    id: "livingflame_bead", name: "Livingflame Bead", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/livingflame_bead.png", icon: "🔴",
    description: "The core of a flame wisp, still glowing. It never cools. Keep it away from parchment.",
    category: "enchanting", tier: 3,
  },
  {
    id: "thunderglass", name: "Thunderglass", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/thunderglass.png", icon: "⚡",
    description: "Lightning crystallized into smooth, dark glass. It crackles when you hold it. Don't hold it for long.",
    category: "enchanting", tier: 3,
  },
  {
    id: "frozen_droplet", name: "Frozen Droplet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/frozen_droplet.png", icon: "❄️",
    description: "Water from a tide serpent, frozen solid and refusing to melt. The cold radiates outward like a tiny winter.",
    category: "enchanting", tier: 3,
  },
  {
    id: "heartstone", name: "Heartstone", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/heartstone.png", icon: "🗿",
    description: "The core of a stone golem. It hums with the memory of wanting to move. Warm despite being rock.",
    category: "enchanting", tier: 3,
  },
  {
    id: "voidthorn", name: "Voidthorn", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/voidthorn.png", icon: "🖤",
    description: "A shard of crystallized darkness from beyond the boundary. It drinks light and pricks like a needle that isn't there.",
    category: "enchanting", tier: 5,
  },
  {
    id: "shadow_fragment", name: "Shadow Fragment", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/shadow_fragment.png", icon: "🌑",
    description: "A piece of a Shadow Lord. It exists and doesn't. Looking at it too long gives you a headache shaped like a scream.",
    category: "enchanting", tier: 5,
  },

  // ── Gems & Divine ────────────────────────────────────────────
  {
    id: "keening_shard", name: "Keening Shard", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/keening_shard.png", icon: "💠",
    description: "Crystallized from a banshee's scream. It hums a single note, always. Jewelcrafters say it's beautiful. Everyone else says it's unsettling.",
    category: "gem", tier: 4,
  },
  {
    id: "godspark", name: "Godspark", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/godspark.png", icon: "⭐",
    description: "A fragment of dormant divine essence. Warm, golden, and faintly aware. The Church would kill to have this. The Cult would kill to use it.",
    category: "gem", tier: 4,
  },
  {
    id: "dormant_sigil", name: "Dormant Sigil", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/dormant_sigil.png", icon: "⚜️",
    description: "Pried from a temple guardian's chest. The runes are dark now, but they flicker when you pray.",
    category: "gem", tier: 4,
  },
  {
    id: "seraphs_grief", name: "Seraph's Grief", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/seraphs_grief.png", icon: "💧",
    description: "Liquid light, pooled from a fallen seraph's eyes. It's warm. It's sad. And it remembers being righteous.",
    category: "gem", tier: 5,
  },
  {
    id: "aether_core", name: "Aether Core", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/aether_core.png", icon: "💠",
    description: "The heart of an Aether Colossus. Pure crystallized magic, dense as lead, bright as noon. The Hauts-Cieux would weep to hold this.",
    category: "gem", tier: 5,
  },

  // ── Dragon-specific ──────────────────────────────────────────
  {
    id: "pyrewing_core", name: "Pyrewing Core", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/pyrewing_core.png", icon: "🔥",
    description: "The furnace inside an ancient wyrm. It still burns. It will burn for centuries. Handle with something that isn't your hands.",
    category: "dragon", tier: 5,
  },
  {
    id: "wyrm_heart", name: "Wyrm Heart", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/wyrm_heart.png", icon: "❤️‍🔥",
    description: "Massive, slow-beating, and too hot to carry bare-handed. The Tianzhou scholars say a wyrm heart can power a city. Nobody has tested this.",
    category: "dragon", tier: 5,
  },
  {
    id: "lichglass", name: "Lichglass", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/lichglass.png", icon: "🔮",
    description: "A fragment of a lich's phylactery. Looks like glass, feels like ice, and whispers equations when the moon is full.",
    category: "enchanting", tier: 4,
  },

  // ── New Materials — Content Expansion ──────────────────────────

  // Hides
  { id: "thick_pelt", name: "Thick Pelt", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/thick_pelt.png", icon: "🐻", description: "Heavy bear fur, tough enough to turn a blade. Smells worse than it looks.", category: "hide", tier: 1 },
  { id: "bristlehide", name: "Bristlehide", icon: "🐗", description: "Coarse boar skin covered in needle-sharp bristles. Makes surprisingly good padding.", category: "hide", tier: 1 },

  // Bones & Parts
  { id: "bear_claw", name: "Bear Claw", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/bear_claw.png", icon: "🐾", description: "Curved, sharp, and the size of a dagger. The hunters mount them as trophies. The Jewelcrafters see raw material.", category: "bone", tier: 1 },
  { id: "serpent_fang", name: "Serpent Fang", icon: "🐍", description: "Hollow, curved, and still glistening with venom. Handle with thick gloves.", category: "bone", tier: 1 },
  { id: "tusk_shard", name: "Tusk Shard", icon: "🦷", description: "A broken boar tusk, dense as stone. The Khazdurim use them for practice scrimshaw.", category: "bone", tier: 1 },
  { id: "cloven_hoof", name: "Cloven Hoof", icon: "🐐", description: "The split black hoof of a boar, hard as horn. Of no use to anyone, which is what makes it strange that someone asked.", category: "bone", tier: 1 },
  { id: "boar_skull", name: "Boar Skull", icon: "💀", description: "The long, heavy skull of a boar, tusks still socketed, picked clean. A hunter's trophy, or a butcher's leaving. Nothing more, unless someone wants it.", category: "bone", tier: 1 },
  { id: "alpha_fang", name: "Alpha Fang", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/alpha_fang.png", icon: "🐺", description: "The largest fang from the pack leader's jaw. Warm to the touch, as if the beast's fury persists.", category: "bone", tier: 2 },
  { id: "beast_heart", name: "Beast Heart", icon: "❤️", description: "Massive, still faintly warm. The old hunters say eating it raw gives you the bear's courage. Don't.", category: "alchemy", tier: 3 },

  // Alchemy
  { id: "snake_oil", name: "Snake Oil", icon: "🧪", description: "Rendered from marsh adder venom. The alchemists call it a universal solvent. Everyone else calls it poison.", category: "alchemy", tier: 1 },
  { id: "glowcap_spore", name: "Glowcap Spore", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/glowcap_spore.png", icon: "🍄", description: "Luminous fungal spores that glow blue-green in the dark. Mildly hallucinogenic if inhaled. Useful for alchemy.", category: "alchemy", tier: 1 },
  { id: "ghoul_marrow", name: "Ghoul Marrow", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/ghoul_marrow.png", icon: "🦴", description: "Grey, cold, and faintly luminescent. The alchemists want it. The priests want it burned. The alchemists are more persuasive.", category: "alchemy", tier: 2 },
  { id: "grave_dust", name: "Grave Dust", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/grave_dust.png", icon: "💀", description: "Fine grey powder from where the undead walk. Disturbing to collect, invaluable to enchanters.", category: "alchemy", tier: 2 },
  { id: "witch_eye", name: "Witch's Eye", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/witch_eye.png", icon: "👁️", description: "A glass eye that isn't glass. It blinks when you're not looking. The witch says she has a spare.", category: "enchanting", tier: 2 },
  { id: "hex_fetish", name: "Hex Fetish", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/hex_fetish.png", icon: "🪬", description: "A crude totem of bone and feathers, still humming with hedge-magic. The goblins hang them from their belts like lucky charms.", category: "enchanting", tier: 2 },

  // Nature
  { id: "living_heartwood", name: "Living Heartwood", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/living_heartwood.png", icon: "🪵", description: "Cut from the core of a corrupted treant. It's warm, it bleeds sap, and if you leave it in soil it tries to grow roots overnight.", category: "enchanting", tier: 3 },
  { id: "amber_resin", name: "Amber Resin", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/amber_resin.png", icon: "🟠", description: "Golden tree-blood hardened into crystal. Ancient insects trapped inside sometimes still move.", category: "gem", tier: 3 },
  { id: "charite", name: "Charite", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/charite.png", icon: "🔶", description: "Crystallized fire-ash from the bones of a Burnt Skeleton. It's always warm and glows faintly in the dark.", category: "enchanting", tier: 2 },

  // Elemental Gems
  { id: "crude_ruby", name: "Crude Ruby", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/crude_ruby.png", icon: "🔴", description: "An uncut fire-touched gemstone, cloudy and rough. A Jewelcrafter could refine it into something beautiful.", category: "gem", tier: 2 },
  { id: "fire_ruby", name: "Fire Ruby", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/fire_ruby.png", icon: "❤️‍🔥", description: "A deep red gem that pulses with inner heat. Cut properly, it holds fire magic like a lantern holds flame.", category: "gem", tier: 3 },
  { id: "frost_sapphire", name: "Frost Sapphire", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/frost_sapphire.png", icon: "💎", description: "Blue as a winter sky, cold to the touch even in summer. Water beads and freezes on its surface.", category: "gem", tier: 3 },
  { id: "storm_topaz", name: "Storm Topaz", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/storm_topaz.png", icon: "⚡", description: "Yellow-white and crackling with static. Touch it and your hair stands on end for an hour.", category: "gem", tier: 3 },
  { id: "void_topaz", name: "Void Topaz", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/void_topaz.png", icon: "🟣", description: "Black as a moonless night with faint purple veins. It absorbs light rather than reflecting it. Unsettling to hold.", category: "gem", tier: 4 },
  { id: "emerald_shard", name: "Emerald Shard", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/emerald_shard.png", icon: "💚", description: "A fragment of living crystal, green as new growth. Plants lean toward it. The Silvaneth say it remembers being a forest.", category: "gem", tier: 3 },
  { id: "moonstone", name: "Moonstone", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/moonstone_gem.png", icon: "🌙", description: "White as milk with an inner shimmer like captured moonlight. The priests say it's a fragment of divine attention. The enchanters say it's useful. Both are right.", category: "gem", tier: 4 },
];

export function getMaterial(id: string): MaterialDefinition | undefined {
  return MATERIALS.find((m) => m.id === id);
}
