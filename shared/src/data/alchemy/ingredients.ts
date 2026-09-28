// ─── Free-form alchemy: ingredient property tables ─────────────────────────
// A PLANT HAS ONE THEME. THE TECHNIQUE DECIDES HOW THAT THEME ARRIVES.
// (Rewritten 2026-09-28. The old rule was "one effect per (ingredient,
// technique); a dual-nature plant splits its two things across two techniques",
// which had it backwards: it made the technique a MENU of unrelated boons
// rather than a preparation, and it was false to plants. Willow bark eases a
// fever and dulls an ache in the same cup; that is one bark doing one thing
// with two readings.)
//
//   crush   bruised to release the sap. Acts at once.
//   boil    a decoction. Steady, the whole fight.
//   steep   an infusion. Gentler and longer than boiling.
//   distil  an essence. Strong and brief (shape: "burst").
//
// SHAPE ONLY MEANS SOMETHING TO AN EFFECT THAT EXISTS DURING A FIGHT. The
// recovery channels (heal_hp, ease_fever, ease_gut, ease_wound,
// general_recovery) are summed by apply.ts and spent on an adventurer's
// recovery time between missions; there is no "during" for them. So a technique
// varies their AMOUNT, never their shape, and `shape`/`rounds` on one of those
// cells is noise. Four such cells were carrying it and have been cleaned up.
// (And it is right that some plants are for BETWEEN fights: that half of the
// craft is what serves a settlement rather than a war party.)
//
// The technique is what you do to the HERB, not what the product is: you crush
// one thing and boil another into the same vessel, the way a real herbalist
// would, and what comes out is one draught. (A salve as a separate KIND of
// product is a good idea and is written up in docs/IDEAS.md under Alchemy.)
//
// A cell may carry a SECOND effect only when the two are the same act seen
// twice, as fenbalm's poultice draws out venom and poison alike, because
// drawing out is one act. Never two unrelated boons: that is how a shelf of
// plants becomes a shelf of everything.
//
// Catalysts only MODIFY (amplify/extend), never add their own effect line.
// Rough, tunable magnitudes. Signature = identity/early, not "biggest number".
// A technique absent for an ingredient yields only a faint generic effect (brew.ts).

import type { Ingredient } from "./types.js";

export const INGREDIENTS: Ingredient[] = [
  // ── BASE — gentle carriers; a brew wants one ────────────────────────────────
  {
    id: "chamomile", name: "Chamomile", icon: "🌼", role: "base", rarity: "common", signature: "steep",
    note: "The gentle rounder. It softens a harsh mixture.",
    techniques: {
      crush: [{ channel: "heal_hp", amount: 6 }],
      steep: [{ channel: "general_recovery", amount: 2 }],
    },
  },
  {
    // The first plant to sit on BOTH shelves. Its stock is the larder's, so a
    // dandelion brewed is a dandelion nobody eats, which is a real choice and
    // costs nothing to stage.
    // It is also the only source of DEX in the game: int had four sources, wis
    // and vit two each, dex and str none at all. Lavender is the precedent for a
    // base carrying one mild stat.
    id: "dandelion", name: "Dandelion", icon: "🌼", role: "base", rarity: "common", signature: "boil",
    note: "The bitter base. It braces where chamomile soothes.",
    techniques: {
      boil: [{ channel: "dex", amount: 1 }],
      crush: [{ channel: "general_recovery", amount: 1 }],
    },
  },
  {
    // Winter's base, against dandelion's spring. ease_fever has three sources
    // already, but not one of them is a plant you can gather in the season you
    // actually need it: a hip hangs on the bush through the frost.
    id: "rosehip", name: "Rosehip", icon: "🌹", role: "base", rarity: "common", signature: "boil",
    note: "The winter cup. It keeps the cold months from getting into a house.",
    techniques: {
      boil: [{ channel: "ease_fever", amount: 2 }],
    },
  },
  {
    id: "lavender", name: "Lavender", icon: "🪻", role: "base", rarity: "uncommon", signature: "steep",
    note: "A calming base. It steadies and clears the mind.",
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
    note: "The alchemist's universal solvent, a ready liquid to carry a brew.",
    techniques: {
      boil: [{ channel: "general_recovery", amount: 1 }],
    },
  },

  // ── HERO — the star effect you build around ────────────────────────────────
  {
    id: "mugwort", name: "Mugwort", icon: "🌿", role: "hero", rarity: "common", signature: "boil",
    note: "The witch's herb: mind, magic, and warding smoke.",
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
      distil: [{ channel: "ease_fever", amount: 6 }],
    },
  },
  {
    id: "yarrow", name: "Yarrow", icon: "🌾", role: "hero", rarity: "common", signature: "crush",
    note: "Woundwort. It mends a cut, and steeped it staunches bleeding.",
    techniques: {
      crush: [{ channel: "ease_wound", amount: 3 }],
      steep: [{ channel: "cure_bleed", amount: 1 }],
      distil: [{ channel: "heal_hp", amount: 20 }],
    },
  },
  {
    // The bone herb, and the ONLY source of str in the game. It used to be a
    // strictly worse yarrow: identical crush cell (ease_wound 3), rarer, and
    // with less besides, so there was never a reason to reach for it. Their own
    // folk names carry the split that fixes it. Yarrow is Woundwort and keeps
    // cuts and bleeding entirely; comfrey is Knitbone and takes bone and sinew.
    id: "comfrey", name: "Comfrey", icon: "🌿", role: "hero", rarity: "uncommon", signature: "crush",
    note: "Knitbone. It sets what is broken and hardens what is whole.",
    techniques: {
      crush: [{ channel: "str", amount: 2 }],
      boil: [{ channel: "str", amount: 1 }],
      distil: [{ channel: "str", amount: 4, shape: "burst", rounds: 2 }],
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
    note: "Bitter bark. It cools a fever, and a poultice dulls an ache.",
    techniques: {
      boil: [{ channel: "ease_fever", amount: 3 }],
      crush: [{ channel: "defense_pct", amount: 8 }],
      distil: [{ channel: "ease_fever", amount: 6 }],
    },
  },
  {
    id: "nightbloom", name: "Nightbloom", icon: "🌺", role: "hero", rarity: "rare", signature: "distil",
    note: "A moonlit flower, potent for the caster.",
    techniques: {
      steep: [{ channel: "int", amount: 3 }],
      distil: [{ channel: "int", amount: 6, shape: "burst", rounds: 2 }],
    },
  },
  {
    id: "fenbalm", name: "Fenbalm", icon: "🌾", role: "hero", rarity: "uncommon", signature: "boil",
    note: "Edda's marsh cure-all: the deep-cough boiled, the fen's slow venom in a crushed poultice.",
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
    // The decoy that yields, and the only poison you gather on purpose. Its
    // `poison` is ADMINISTERED, not smeared on a blade: coniine has to be
    // swallowed in quantity, which is why Socrates drank it and why nobody ever
    // coated a sword with it. Venom (serpent_fang) is the realistic blade
    // poison. Hemlock belongs to a cup, a meal, or a sabotage mission.
    // `slow` because it kills by paralysis rather than by rot, and nothing else
    // in the game produces that channel.
    // `ease_wound` is the live cell: in small doses hemlock was a genuine
    // sedative and painkiller in the medieval pharmacopoeia. The dose makes the
    // poison, which is the most interesting thing about the plant.
    id: "hemlock", name: "Hemlock", icon: "☠️", role: "toxin", rarity: "uncommon", signature: "crush",
    note: "A little stills the pain. More stills the breath.",
    techniques: {
      crush: [{ channel: "poison", amount: 4, rounds: 3 }],
      boil: [{ channel: "slow", amount: 20 }],
      steep: [{ channel: "ease_wound", amount: 3 }],
    },
  },
  {
    id: "nightshade", name: "Nightshade", icon: "🖤", role: "toxin", rarity: "rare", signature: "crush",
    note: "Deadly. A potent poison, and the assassin's friend.",
    techniques: {
      crush: [{ channel: "poison", amount: 3, shape: "sustained", rounds: 3 }],
      boil: [{ channel: "weaken", amount: 15 }],
      distil: [{ channel: "poison", amount: 6, shape: "sustained", rounds: 4 }],
    },
  },
  {
    id: "serpent_fang", name: "Serpent Fang", icon: "🐍", role: "toxin", rarity: "uncommon", signature: "crush",
    note: "Still glistening with venom. Crushed, it makes a wicked coating.",
    techniques: {
      crush: [{ channel: "poison", amount: 3, shape: "sustained", rounds: 3 }],
      distil: [{ channel: "poison", amount: 5, shape: "sustained", rounds: 4 }],
    },
  },

  // ── WILDCARD — potent, a little unruly ─────────────────────────────────────
  {
    id: "fly_agaric", name: "Fly Agaric", icon: "🍄", role: "wildcard", rarity: "common", signature: "boil",
    note: "Scarlet and flecked white. A lot of power, and not much of it obedient.",
    techniques: {
      boil: [{ channel: "int", amount: 3 }],
      char: [{ channel: "confuse", amount: 25 }],
    },
  },
  {
    id: "moonpetal", name: "Moonpetal", icon: "🪷", role: "wildcard", rarity: "legendary", signature: "distil",
    note: "Legendary aether-petal, rare and unpredictably strong.",
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
