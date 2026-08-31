// ─── Free-form alchemy — ingredient property tables ─────────────────────────
// ONE effect per (ingredient, technique) — a plant does one clear thing per
// prep; a dual-nature plant splits its two things across two techniques.
// Catalysts only MODIFY (amplify/extend), never add their own effect line.
// So a brew's effect count = its non-catalyst ingredients (2 early, 3-4 late).
// Rough, tunable magnitudes. ⭐ signature = identity/early, not "biggest number".
// A technique absent for an ingredient yields only a faint generic effect (brew.ts).

import type { Ingredient } from "./types.js";

export const INGREDIENTS: Ingredient[] = [
  // ── BASE — gentle carriers; a brew wants one ────────────────────────────────
  {
    id: "chamomile", name: "Chamomile", icon: "🌼", role: "base", rarity: "common", signature: "steep",
    note: "The gentle rounder — softens harsh combos.",
    techniques: {
      crush: [{ channel: "heal_hp", amount: 6, shape: "topical" }],
      steep: [{ channel: "general_recovery", amount: 2 }],
    },
  },
  {
    id: "lavender", name: "Lavender", icon: "🪻", role: "base", rarity: "uncommon", signature: "steep",
    note: "A calming base — steadies and clears the mind.",
    techniques: {
      steep: [{ channel: "wis", amount: 1 }],
      dry: [{ channel: "wis", amount: 2 }],
    },
  },
  {
    id: "bone", name: "Bone", icon: "🦴", role: "base", rarity: "common", signature: "boil",
    note: "Boiled to a broth, it nourishes; ground, it fortifies.",
    techniques: {
      boil: [{ channel: "general_recovery", amount: 2 }],
      crush: [{ channel: "vit", amount: 1 }],
    },
  },
  {
    id: "snake_oil", name: "Snake Oil", icon: "🧪", role: "base", rarity: "uncommon", signature: "boil",
    note: "The alchemist's universal solvent — a ready liquid to carry a brew.",
    techniques: {
      boil: [{ channel: "general_recovery", amount: 1 }],
    },
  },

  // ── HERO — the star effect you build around ────────────────────────────────
  {
    id: "mugwort", name: "Mugwort", icon: "🌿", role: "hero", rarity: "common", signature: "boil",
    note: "The witch's herb — mind, magic, and warding smoke.",
    techniques: {
      boil: [{ channel: "int", amount: 2 }],
      steep: [{ channel: "wis", amount: 1 }],
      distil: [{ channel: "int", amount: 4, shape: "burst", rounds: 2 }],
      char: [{ channel: "resist_undead", amount: 25 }],
    },
  },
  {
    id: "feverfew", name: "Feverfew", icon: "🌼", role: "hero", rarity: "common", signature: "steep",
    note: "The fever-breaker.",
    techniques: {
      boil: [{ channel: "ease_fever", amount: 2 }],
      steep: [{ channel: "ease_fever", amount: 3 }],
      distil: [{ channel: "ease_fever", amount: 6, shape: "burst", rounds: 1 }],
    },
  },
  {
    id: "yarrow", name: "Yarrow", icon: "🌾", role: "hero", rarity: "common", signature: "crush",
    note: "Woundwort — mends a cut; steeped, it staunches bleeding.",
    techniques: {
      crush: [{ channel: "ease_wound", amount: 3 }],
      steep: [{ channel: "cure_bleed", amount: 1 }],
      distil: [{ channel: "heal_hp", amount: 20, shape: "burst" }],
    },
  },
  {
    id: "comfrey", name: "Comfrey", icon: "🌿", role: "hero", rarity: "uncommon", signature: "crush",
    note: "Knitbone — mends sprains and bones.",
    techniques: {
      crush: [{ channel: "ease_wound", amount: 3 }],
      boil: [{ channel: "ease_wound", amount: 2 }],
    },
  },
  {
    id: "wildmint", name: "Wildmint", icon: "🌱", role: "hero", rarity: "common", signature: "steep",
    note: "Settles a turned stomach.",
    techniques: {
      steep: [{ channel: "ease_gut", amount: 3 }],
      crush: [{ channel: "ease_gut", amount: 2 }],
    },
  },
  {
    id: "willowbark", name: "Willowbark", icon: "🪵", role: "hero", rarity: "uncommon", signature: "boil",
    note: "Bitter bark — cools a fever; a poultice dulls an ache.",
    techniques: {
      boil: [{ channel: "ease_fever", amount: 3 }],
      crush: [{ channel: "defense_pct", amount: 8 }],
      distil: [{ channel: "ease_fever", amount: 6, shape: "burst", rounds: 2 }],
    },
  },
  {
    id: "nightbloom", name: "Nightbloom", icon: "🌺", role: "hero", rarity: "rare", signature: "distil",
    note: "A moonlit flower — potent for the caster.",
    techniques: {
      steep: [{ channel: "int", amount: 3 }],
      distil: [{ channel: "int", amount: 6, shape: "burst", rounds: 2 }],
    },
  },
  {
    id: "fenbalm", name: "Fenbalm", icon: "🌾", role: "hero", rarity: "uncommon", signature: "boil",
    note: "Edda's marsh cure-all — the deep-cough (boiled), the fen's slow venom (a crushed poultice).",
    techniques: {
      boil: [{ channel: "ease_fever", amount: 5 }],
      crush: [{ channel: "cure_venom", amount: 1 }, { channel: "cure_poison", amount: 1 }],
    },
  },

  // ── CATALYST — no effect of its own; boosts/extends the rest ────────────────
  {
    id: "honey", name: "Honey", icon: "🍯", role: "catalyst", rarity: "common", signature: "steep",
    note: "Stir in (steep) to AMPLIFY the brew; boil to syrup to EXTEND it.",
    techniques: {
      steep: [{ channel: "amplify", amount: 0.25 }],
      boil: [{ channel: "extend", amount: 1 }],
    },
  },

  // ── TOXIN — offensive on purpose (poisons, coatings) ───────────────────────
  {
    id: "nettle", name: "Nettle", icon: "🍃", role: "toxin", rarity: "common", signature: "boil",
    note: "Boil it and the sting cooks out to a nourishing tonic; crush the raw sting and it bites.",
    techniques: {
      boil: [{ channel: "vit", amount: 2 }],
      crush: [{ channel: "poison", amount: 2, shape: "sustained", rounds: 3 }],
      distil: [{ channel: "poison", amount: 4, shape: "sustained", rounds: 3 }],
    },
  },
  {
    id: "nightshade", name: "Nightshade", icon: "🖤", role: "toxin", rarity: "rare", signature: "crush",
    note: "Deadly — a potent poison and the assassin's friend.",
    techniques: {
      crush: [{ channel: "poison", amount: 3, shape: "sustained", rounds: 3 }],
      boil: [{ channel: "weaken", amount: 15 }],
      distil: [{ channel: "poison", amount: 6, shape: "sustained", rounds: 4 }],
    },
  },
  {
    id: "serpent_fang", name: "Serpent Fang", icon: "🐍", role: "toxin", rarity: "uncommon", signature: "crush",
    note: "Still glistening with venom — crushed, it makes a wicked coating.",
    techniques: {
      crush: [{ channel: "poison", amount: 3, shape: "sustained", rounds: 3 }],
      distil: [{ channel: "poison", amount: 5, shape: "sustained", rounds: 4 }],
    },
  },

  // ── WILDCARD — potent, a little unruly ─────────────────────────────────────
  {
    id: "witchs_cap", name: "Witch's-Cap", icon: "🍄", role: "wildcard", rarity: "rare", signature: "boil",
    note: "An odd mushroom — a lot of power, a little unruly.",
    techniques: {
      boil: [{ channel: "int", amount: 3 }],
      char: [{ channel: "confuse", amount: 25 }],
    },
  },
  {
    id: "moonpetal", name: "Moonpetal", icon: "🪷", role: "wildcard", rarity: "legendary", signature: "distil",
    note: "Legendary aether-petal — rare and unpredictably strong.",
    techniques: {
      steep: [{ channel: "heal_hp", amount: 6 }],
      distil: [{ channel: "int", amount: 6, shape: "burst", rounds: 2 }],
    },
  },

  // ── MATERIALS (tier-1 monster parts as role-ingredients) ───────────────────
  {
    id: "tusk_shard", name: "Tusk Shard", icon: "🦷", role: "hero", rarity: "common", signature: "crush",
    note: "A broken boar tusk. Crushed to powder, it draws the froth out of a rabid bite.",
    techniques: {
      crush: [{ channel: "cure_froth", amount: 1 }],
    },
  },
];

export function getIngredient(id: string): Ingredient | undefined {
  return INGREDIENTS.find((i) => i.id === id);
}
