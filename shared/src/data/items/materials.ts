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
  /** Per-stack inventory cap. Unset = uncapped. Set on curios that shouldn't
   *  pile up (e.g. the bog-witch's hooves/skull); overflow on acquisition is
   *  discarded. Value TBD for cloven_hoof/boar_skull during the ch2 pacing pass. */
  maxStack?: number;
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

  // ── Metal & Salvage ──────────────────────────────────────────
  {
    id: "alpha_sinew", name: "Alpha's Sinew", icon: "🪢",
    description: "Sinew from a pack leader, long, strong, and springy. Strung on a bow it throws an arrow like nothing else. The other half of the alpha's worth (see the fang).",
    category: "bone", tier: 1,
  },
  {
    id: "steel", name: "Steel", icon: "⚙️",
    description: "Iron carburized in the forge, harder than plain iron, and it keeps an edge. The backbone of any decent blade.",
    category: "metal", tier: 1,
  },
  {
    id: "captains_steel", name: "Captain's Steel", icon: "🗡️",
    description: "Fine, close-grained steel the bandit captain had hoarded, worth more than the men he led. Enough to forge one exceptional blade.",
    category: "metal", tier: 2,
  },
  {
    id: "highwaymans_steel", name: "Highwayman's Steel", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/highwaymans_steel.png", icon: "🔩",
    description: "Rusty, chipped, but serviceable. Melt it down and the iron remembers its shape.",
    category: "metal", tier: 1,
  },

  // ── Cloth & Thread ───────────────────────────────────────────
  {
    id: "ghostweave", name: "Ghostweave", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/ghostweave.png", icon: "🕸️",
    description: "Thread spun from spectral residue. Nearly invisible, cold as moonlight, and impossibly strong.",
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

  // ── Enchanting Essences ──────────────────────────────────────
  {
    id: "veilmist", name: "Veilmist", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/veilmist.png", icon: "🌫️",
    description: "Mist from the other side of the boundary. Collected in a sealed flask, it swirls endlessly. The dead breathe this.",
    category: "enchanting", tier: 2,
  },
  {
    id: "soul_shard", name: "Soul Shard", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/soul_shard.png", icon: "💎",
    description: "A splinter of crystallized life-force. It pulses faintly. The Thornveil say it's not a thing, it's a person.",
    category: "enchanting", tier: 2,
  },

  // ── Gems & Divine ────────────────────────────────────────────

  // ── Dragon-specific ──────────────────────────────────────────

  // ── New Materials — Content Expansion ──────────────────────────

  // Hides
  { id: "thick_pelt", name: "Thick Pelt", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/thick_pelt.png", icon: "🐻", description: "Heavy bear fur, tough enough to turn a blade. Smells worse than it looks.", category: "hide", tier: 1 },
  { id: "bristlehide", name: "Bristlehide", icon: "🐗", description: "Coarse boar skin covered in needle-sharp bristles. Makes surprisingly good padding.", category: "hide", tier: 1 },

  // Bones & Parts
  { id: "bear_claw", name: "Bear Claw", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/materials/bear_claw.png", icon: "🐾", description: "Curved, sharp, and the size of a dagger. The hunters mount them as trophies. The Jewelcrafters see raw material.", category: "bone", tier: 1 },
  { id: "serpent_fang", name: "Serpent Fang", icon: "🐍", description: "Hollow, curved, and still glistening with venom. Handle with thick gloves.", category: "bone", tier: 1 },
  { id: "tusk_shard", name: "Tusk Shard", icon: "🦷", description: "A broken boar tusk, dense as stone. The Khazdurim use them for practice scrimshaw.", category: "bone", tier: 1 },
  { id: "boar_tusk", name: "Boar Tusk", icon: "🦷", description: "A whole, intact tusk — long, curved, and dense as horn. Come out clean, it's a rare prize: ground to an edge it makes a wicked blade, and left whole a pair of them crowns a fearsome helm.", category: "bone", tier: 1 },
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
