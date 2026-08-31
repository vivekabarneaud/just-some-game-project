// ─── Jewelry (rings, amulets, trinkets) ───
// Split by item type (see items/equipment/index.ts). Rarity is the field.

import type { ItemDefinition } from "../types.js";

export const JEWELRY: ItemDefinition[] = [
  {
    id: "fang_necklace", rarity: "uncommon", name: "Fang Necklace", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/fang_necklace.png", icon: "🦷", slot: "amulet",
    description: "+1 STR, +1 DEX. Zah'kari courage charm — wolf fangs on sinew cord.",
    classes: [],
    stats: { str: 1, dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "fang_necklace", consumable: false,
  },
  {
    id: "war_banner", rarity: "rare", name: "War Banner", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/war_banner.png", icon: "🏴", slot: "trinket",
    description: "+1 STR to entire party. Orc warlord's standard, restitched and blessed.",
    classes: [],
    stats: { str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "war_banner", consumable: false,
  },
  {
    id: "copper_band", rarity: "common", name: "Copper Band", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/copper_band.png", icon: "💍", slot: "ring1",
    description: "+1 VIT. Simple copper ring, polished smooth. Better than nothing.",
    classes: [], stats: { vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "copper_band", consumable: false,
  },
  {
    id: "bone_ring", rarity: "common", name: "Bone Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/bone_ring.png", icon: "💍", slot: "ring1",
    description: "+1 STR. Carved from barrowfield bone. The dead don't need it anymore.",
    classes: ["warrior", "assassin"], stats: { str: 1 }, durationMod: 1, lootMod: 1, recipeId: "bone_ring", consumable: false,
  },
  {
    id: "woven_vine_ring", rarity: "common", name: "Woven Vine Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/woven_vine_ring.png", icon: "💍", slot: "ring1",
    description: "+1 WIS. Living vine twisted into a ring. It grows tighter on your finger — but not uncomfortably.",
    classes: ["priest", "wizard"], stats: { wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "woven_vine_ring", consumable: false,
  },
  {
    id: "ruby_signet", rarity: "uncommon", name: "Ruby Signet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/ruby_signet.png", icon: "💍", slot: "ring1",
    description: "+2 STR, +1 VIT. A fire ruby set in iron. Warm to the touch, always.",
    classes: ["warrior"], stats: { str: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "ruby_signet", consumable: false,
  },
  {
    id: "sapphire_ring", rarity: "uncommon", name: "Sapphire Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/sapphire_ring.png", icon: "💍", slot: "ring1",
    description: "+2 INT, +1 WIS. A frost sapphire in silver. Keeps your mind clear and your fingers cold.",
    classes: ["wizard", "priest"], stats: { int: 2, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "sapphire_ring", consumable: false,
  },
  {
    id: "topaz_band", rarity: "uncommon", name: "Topaz Band", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/storm_ring.png", icon: "💍", slot: "ring1",
    description: "+2 DEX, +1 STR. A storm topaz in copper. Crackles faintly when you move fast.",
    classes: ["archer", "assassin"], stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "topaz_band", consumable: false,
  },
  {
    id: "emerald_loop", rarity: "uncommon", name: "Emerald Loop", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/emerald_band.png", icon: "💍", slot: "ring1",
    description: "+2 WIS, +1 VIT. An emerald shard in twisted silver. Smells faintly of forest rain.",
    classes: ["priest"], stats: { wis: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "emerald_loop", consumable: false,
  },
  {
    // The thrill jackpot: a rare FIND (rarity = scarcity, not power), not craftable.
    // +Luck lifts the party's loot-drop chance; ~1% off any bandit. uniqueEquip
    // so you can't stack two. Luck value is a starting knob — tune with LUCK_*.
    id: "stranger_signet", rarity: "rare", name: "Stranger's Signet", icon: "💍", slot: "ring1",
    description: "+5 Luck. A traveller's signet, taken off them on the road north. It fit someone once, and they had a name. Now it just fits you.",
    classes: [], stats: {}, raw: { luck: 5 }, uniqueEquip: true, durationMod: 1, lootMod: 1, recipeId: "stranger_signet", consumable: false,
  },
  {
    id: "dragonfire_ring", rarity: "rare", name: "Dragonfire Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/dragonscale_ring.png", icon: "💍", slot: "ring1",
    description: "+3 STR, +2 VIT. Dragon blood fused with ruby. It pulses like a second heartbeat.",
    classes: ["warrior"], stats: { str: 3, vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "dragonfire_ring", consumable: false,
  },
  {
    id: "holy_pendant", rarity: "uncommon", name: "Holy Pendant", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/moonstone_pendant.png", icon: "✝️", slot: "amulet",
    description: "+2 WIS, +1 VIT. A moonstone set in silver, blessed by three priests. Warm against the skin.",
    classes: ["priest"], stats: { wis: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "holy_pendant", consumable: false,
  },
  {
    id: "amber_charm", rarity: "uncommon", name: "Amber Charm", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/amber_amulet.png", icon: "🟠", slot: "amulet",
    description: "+2 INT, +1 WIS. Ancient amber with a perfect insect inside. The Silvaneth say it thinks.",
    classes: ["wizard"], stats: { int: 2, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "amber_charm", consumable: false,
  },
  {
    id: "predator_tooth", rarity: "uncommon", name: "Predator's Tooth", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/alpha_fang_amulet.png", icon: "🦷", slot: "amulet",
    description: "+2 DEX, +1 STR. An alpha wolf's fang on braided sinew. The pack respects the kill.",
    classes: ["archer", "assassin"], stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "predator_tooth", consumable: false,
  },
  {
    id: "warlord_chain", rarity: "rare", name: "Warlord's Chain", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/warlord_chain.png", icon: "⛓️", slot: "amulet",
    description: "+2 STR, +2 VIT. Orc-steel links and a fire ruby clasp. Taken from a chief who doesn't need it anymore.",
    classes: ["warrior"], stats: { str: 2, vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "warlord_chain", consumable: false,
  },
  {
    id: "ghostveil_locket", rarity: "uncommon", name: "Ghostveil Locket", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/spirit_locket.png", icon: "👻", slot: "amulet",
    description: "+2 INT, +1 DEX. A locket that holds a wisp of ghostweave. The dead don't notice you as easily.",
    classes: [], stats: { int: 2, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "ghostveil_locket", consumable: false,
  },
  {
    id: "alpha_fang_amulet", rarity: "rare", name: "Alpha's Fang", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/alpha_fang_amulet.png", icon: "🐺", slot: "amulet",
    description: "+2 STR, +1 DEX. The pack leader's broken fang, still warm. Wearing it feels like being watched by yellow eyes.",
    classes: [], stats: { str: 2, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "witch_eye_trinket", rarity: "rare", name: "Witch's Eye", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/witch_eye_pendant.png", icon: "👁️", slot: "trinket",
    description: "+2 INT, +1 WIS, -5% duration. It sees what you can't. Don't ask what it shows the witch.",
    classes: ["wizard", "priest"], stats: { int: 2, wis: 1 }, durationMod: 0.95, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "beast_heart_charm", rarity: "rare", name: "Beast Heart Charm", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/beast_heart_charm.png", icon: "❤️", slot: "trinket",
    description: "+2 VIT, +2 STR. A dire bear's heart, dried and bound in leather. Courage you can wear.",
    classes: [], stats: { vit: 2, str: 2 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "infernal_signet", rarity: "epic", name: "Infernal Signet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/infernal_signet.png", icon: "💍", slot: "ring1",
    description: "+3 STR, +2 VIT. Demon-forged iron and fire ruby. Burns cold. Grants strength at a cost nobody can name.",
    classes: ["warrior", "assassin"], stats: { str: 3, vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
];
