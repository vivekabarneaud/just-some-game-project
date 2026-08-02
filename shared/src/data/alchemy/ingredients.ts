// ─── Free-form alchemy — ingredient property tables ─────────────────────────
// Per-technique effect vectors. Rough, tunable magnitudes (see DESIGN_APOTHECARY
// "Magnitudes are placeholders"). Signature technique ⭐ = identity/early, NOT the
// biggest number. Advanced (dry/distil) = burst/narrow, gated by lab level later.
// A technique absent for an ingredient yields only a faint generic effect (brew.ts).

import type { Ingredient } from "./types.js";

export const INGREDIENTS: Ingredient[] = [
  // ── BASE — gentle carriers; a brew wants one ────────────────────────────────
  {
    id: "chamomile", name: "Chamomile", icon: "🌼", role: "base", signature: "steep",
    note: "The gentle rounder — softens harsh combos.",
    techniques: {
      steep: [
        { channel: "ease_gut", amount: 2 },
        { channel: "general_recovery", amount: 1 },
        { channel: "happiness", amount: 1 },
        { channel: "wis", amount: 1 },
      ],
      crush: [{ channel: "heal_hp", amount: 6, shape: "topical" }, { channel: "ease_wound", amount: 1 }],
      distil: [{ channel: "wis", amount: 2, shape: "burst", rounds: 2 }],
    },
  },
  {
    id: "lavender", name: "Lavender", icon: "🪻", role: "base", signature: "steep",
    note: "A calming base — steadies the mind.",
    techniques: {
      steep: [
        { channel: "happiness", amount: 2 },
        { channel: "wis", amount: 1 },
        { channel: "resist_confuse", amount: 15 },
        { channel: "general_recovery", amount: 1 },
      ],
      dry: [{ channel: "happiness", amount: 3 }, { channel: "wis", amount: 1 }],
    },
  },

  // ── HERO — the star effect you build around ────────────────────────────────
  {
    id: "mugwort", name: "Mugwort", icon: "🌿", role: "hero", signature: "boil",
    note: "The witch's herb — mind, magic, and warding smoke.",
    techniques: {
      boil: [{ channel: "int", amount: 2 }, { channel: "ease_gut", amount: 1 }],
      steep: [{ channel: "wis", amount: 1 }, { channel: "general_recovery", amount: 1 }],
      crush: [{ channel: "heal_hp", amount: 6, shape: "topical" }, { channel: "ease_wound", amount: 1 }],
      char: [{ channel: "resist_undead", amount: 25 }, { channel: "resist_confuse", amount: 20, rounds: 2 }],
      distil: [{ channel: "int", amount: 4, shape: "burst", rounds: 2 }],
    },
  },
  {
    id: "feverfew", name: "Feverfew", icon: "🌼", role: "hero", signature: "steep",
    note: "The fever-breaker.",
    techniques: {
      steep: [{ channel: "ease_fever", amount: 3 }, { channel: "heal_hp", amount: 4, shape: "topical" }],
      boil: [{ channel: "ease_fever", amount: 1 }],
      distil: [{ channel: "ease_fever", amount: 6, shape: "burst", rounds: 1 }],
    },
  },
  {
    id: "yarrow", name: "Yarrow", icon: "🌾", role: "hero", signature: "crush",
    note: "Woundwort — staunches a cut and stops bleeding.",
    techniques: {
      crush: [{ channel: "ease_wound", amount: 3 }, { channel: "heal_hp", amount: 8, shape: "topical" }, { channel: "cure_bleed", amount: 1 }],
      steep: [{ channel: "general_recovery", amount: 1 }, { channel: "ease_fever", amount: 1 }],
      distil: [{ channel: "heal_hp", amount: 20, shape: "burst" }],
    },
  },
  {
    id: "comfrey", name: "Comfrey", icon: "🌿", role: "hero", signature: "crush",
    note: "Knitbone — mends sprains and bones.",
    techniques: {
      crush: [{ channel: "ease_wound", amount: 3 }, { channel: "heal_hp", amount: 8, shape: "topical" }],
      boil: [{ channel: "ease_wound", amount: 2 }],
    },
  },
  {
    id: "wildmint", name: "Wildmint", icon: "🌱", role: "hero", signature: "steep",
    note: "Settles a turned stomach.",
    techniques: {
      steep: [{ channel: "ease_gut", amount: 3 }, { channel: "general_recovery", amount: 1 }],
      crush: [{ channel: "ease_gut", amount: 2 }],
    },
  },
  {
    id: "willowbark", name: "Willowbark", icon: "🪵", role: "hero", signature: "boil",
    note: "Bitter bark — cools a fever, dulls an ache.",
    techniques: {
      boil: [{ channel: "ease_fever", amount: 3 }, { channel: "defense_pct", amount: 8 }],
      distil: [{ channel: "ease_fever", amount: 6, shape: "burst", rounds: 2 }],
    },
  },
  {
    id: "nightbloom", name: "Nightbloom", icon: "🌺", role: "hero", signature: "distil",
    note: "A moonlit flower — potent for the caster.",
    techniques: {
      steep: [{ channel: "int", amount: 3 }],
      distil: [{ channel: "int", amount: 6, shape: "burst", rounds: 2 }, { channel: "wis", amount: 2, shape: "burst", rounds: 2 }],
    },
  },
  {
    id: "fenbalm", name: "Fenbalm", icon: "🌾", role: "hero", signature: "boil",
    note: "Edda's marsh cure-all — the deep-cough, and the fen's own venom.",
    techniques: {
      boil: [{ channel: "ease_fever", amount: 5 }, { channel: "general_recovery", amount: 1 }],
      steep: [{ channel: "ease_fever", amount: 3 }, { channel: "cure_venom", amount: 1 }, { channel: "cure_poison", amount: 1 }],
    },
  },

  // ── CATALYST — little of its own; boosts/extends the rest ───────────────────
  {
    id: "honey", name: "Honey", icon: "🍯", role: "catalyst", signature: "steep",
    note: "Stir in raw to AMPLIFY; boil to syrup to EXTEND.",
    techniques: {
      steep: [{ channel: "amplify", amount: 0.25 }, { channel: "happiness", amount: 1 }],
      boil: [{ channel: "extend", amount: 1 }, { channel: "ease_fever", amount: 1 }],
      ferment: [{ channel: "happiness", amount: 2 }], // → mead (a spirit base; role-shift is a later thread)
    },
  },

  // ── TOXIN — offensive on purpose (poisons, coatings, bombs) ─────────────────
  {
    id: "nettle", name: "Nettle", icon: "🍃", role: "toxin", signature: "boil",
    note: "Sting or tonic — the technique decides. Boil it and it nourishes; crush the raw sting and it bites.",
    techniques: {
      boil: [{ channel: "vit", amount: 1 }, { channel: "general_recovery", amount: 2 }], // the sting cooked out → a nourishing tonic
      crush: [{ channel: "poison", amount: 2, shape: "sustained", rounds: 3 }],           // raw sting → a mild coating
      distil: [{ channel: "poison", amount: 4, shape: "sustained", rounds: 3 }],
    },
  },
  {
    id: "nightshade", name: "Nightshade", icon: "🖤", role: "toxin", signature: "distil",
    note: "Deadly — a potent poison and the assassin's friend.",
    techniques: {
      crush: [{ channel: "poison", amount: 3, shape: "sustained", rounds: 3 }],  // blade/arrow coating
      distil: [{ channel: "poison", amount: 6, shape: "sustained", rounds: 4 }, { channel: "weaken", amount: 10 }],
      boil: [{ channel: "weaken", amount: 15 }],
    },
  },

  // ── WILDCARD — volatile; potent or dubious ─────────────────────────────────
  {
    id: "witchs_cap", name: "Witch's-Cap", icon: "🍄", role: "wildcard", signature: "boil",
    note: "An odd mushroom — a lot of power, and a lot of risk.",
    techniques: {
      boil: [{ channel: "int", amount: 3 }, { channel: "poison", amount: 2, shape: "sustained", rounds: 2 }], // potency laced with risk
      char: [{ channel: "confuse", amount: 25 }], // shroom-fog (thrown → confuse the enemy)
    },
  },
  {
    id: "moonpetal", name: "Moonpetal", icon: "🪷", role: "wildcard", signature: "distil",
    note: "Legendary aether-petal — rare and unpredictably strong.",
    techniques: {
      steep: [{ channel: "int", amount: 3 }, { channel: "heal_hp", amount: 6 }],
      distil: [{ channel: "int", amount: 6, shape: "burst", rounds: 2 }, { channel: "amplify", amount: 0.3 }, { channel: "heal_hp", amount: 20, shape: "burst" }],
    },
  },
];

export function getIngredient(id: string): Ingredient | undefined {
  return INGREDIENTS.find((i) => i.id === id);
}
export function ingredientsByRole(role: Ingredient["role"]): Ingredient[] {
  return INGREDIENTS.filter((i) => i.role === role);
}
