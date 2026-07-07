// ─── Equipment items ───────────────────────────────────────────
// All items with an equipment slot (weapons, armor, jewelry, trinkets).
// Consumables (foods, potions, bandages) live in their own files.

import type { ItemDefinition } from "./types.js";

export const EQUIPMENT_ITEMS: ItemDefinition[] = [
  // ── Swords (Blacksmith) — warrior, assassin ───────────────────
  {
    id: "iron_sword", name: "Iron Sword", icon: "⚔️", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/iron_sword.png",
    description: "+1 STR",
    classes: ["warrior", "assassin"],
    stats: { str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_sword", consumable: false,
  },
  {
    id: "steel_sword", name: "Steel Sword", icon: "🗡️", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/steel_sword.png",
    description: "+3 STR, +1 DEX",
    classes: ["warrior", "assassin"],
    stats: { str: 3, dex: 1 }, durationMod: 1, lootMod: 1.05,
    recipeId: "steel_sword", consumable: false,
  },

  // ── Staves (Woodworker) — wizard, priest ──────────────────────
  {
    id: "wooden_staff", name: "Wooden Staff", icon: "🪄", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woodworker/wooden_staff.png",
    description: "+1 INT",
    classes: ["wizard", "priest"],
    stats: { int: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "wooden_staff", consumable: false, twoHanded: true,
  },
  {
    id: "enchanted_staff", name: "Enchanted Staff", icon: "✨", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woodworker/enchanted_staff.png",
    description: "+4 INT, +2 WIS, -15% duration", twoHanded: true,
    classes: ["wizard", "priest"],
    stats: { int: 4, wis: 2 }, durationMod: 0.85, lootMod: 1,
    recipeId: "enchanted_staff", consumable: false,
  },

  // ── Bows (Woodworker) — archer ────────────────────────────────
  {
    id: "short_bow", name: "Short Bow", icon: "🏹", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woodworker/short_bow.png",
    description: "+1 DEX (basic)",
    classes: ["archer"],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "short_bow", consumable: false, twoHanded: true,
  },
  {
    id: "hunting_bow", name: "Hunting Bow", icon: "🏹", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woodworker/hunting_bow.png",
    description: "+1 DEX",
    classes: ["archer"],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "hunting_bow", consumable: false, twoHanded: true,
  },
  {
    id: "longbow", name: "Longbow", icon: "🎯", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woodworker/longbow.png",
    description: "+3 DEX, +1 STR",
    classes: ["archer"],
    stats: { dex: 3, str: 1 }, durationMod: 1, lootMod: 1.05,
    recipeId: "longbow", consumable: false, twoHanded: true,
  },

  // ── Plate armor (Blacksmith) ──────────────────────────────────
  // Plate items no longer class-restricted — anyone with plate access (warriors + Blessed Armor priests) can wear.
  {
    id: "iron_shield", name: "Iron Shield", icon: "🛡️", slot: "offHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/iron_shield.png",
    description: "+2 VIT, 45 DEF",
    classes: [], armorType: "plate",
    stats: { vit: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_shield", consumable: false, defense: 45,
  },
  {
    id: "iron_armor", name: "Iron Armor", icon: "🦺", slot: "chest",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/iron_armor.png",
    description: "+3 VIT, +1 STR, 65 DEF",
    classes: [], armorType: "plate",
    stats: { vit: 3, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_armor", consumable: false, defense: 65,
  },

  // ── Mail armor (Blacksmith) — medium armor, dex-flavored ──────
  {
    id: "chainmail", name: "Chainmail Armor", icon: "⛓️", slot: "chest",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/chainmail_armor.png",
    description: "+3 VIT, +2 DEX, 55 DEF. Flexible rings — protects without sacrificing speed.",
    classes: [], armorType: "mail",
    stats: { vit: 3, dex: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "chainmail", consumable: false, defense: 55,
  },

  // ── Light armor (Woodworker) ──────────────────────────────────
  {
    id: "wooden_shield", name: "Wooden Shield", icon: "🪵", slot: "offHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woodworker/wooden_shield.png",
    description: "+1 VIT, 25 DEF",
    classes: ["warrior", "archer", "assassin"],
    stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "wooden_shield", consumable: false, defense: 25,
  },

  // ── Cloth armor (Tailoring) ───────────────────────────────────
  {
    id: "woolen_robe", name: "Woolen Robe", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/woolen_robe.png", icon: "🧶", slot: "chest",
    description: "+1 VIT, +1 WIS, 10 DEF",
    classes: [], armorType: "cloth",
    stats: { vit: 1, wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "woolen_robe", consumable: false, defense: 10,
  },
  {
    id: "priest_robes", name: "Priest Robes", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/priest_robes.png", icon: "🥋", slot: "chest",
    description: "+2 VIT, +1 WIS, 18 DEF",
    classes: ["priest"], armorType: "cloth",
    stats: { vit: 2, wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "priest_robes", consumable: false, defense: 18,
  },
  {
    id: "wizard_robes", name: "Wizard Robes", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/wizard_robes.png", icon: "🧙", slot: "chest",
    description: "+2 VIT, +2 INT, -10% duration, 18 DEF",
    classes: ["wizard"], armorType: "cloth",
    stats: { vit: 2, int: 2 }, durationMod: 0.9, lootMod: 1,
    recipeId: "wizard_robes", consumable: false, defense: 18,
  },

  // ── Trinkets — all classes ────────────────────────────────────
  {
    id: "iron_dagger_equip", name: "Iron Dagger", icon: "🗡️", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/iron_dagger.png",
    description: "+1 DEX. A simple but sharp blade — every adventurer's first real weapon.",
    classes: [],
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "iron_dagger", consumable: false,
  },
  // ── Leather armor (Leatherworking) ────────────────────────────
  {
    id: "leather_vest", name: "Leather Vest", icon: "🦺", slot: "chest",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/leather_vest.png",
    description: "+1 DEX, 30 DEF",
    classes: [], armorType: "leather",
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_vest", consumable: false, defense: 30,
  },
  {
    id: "leather_boots", name: "Leather Boots", icon: "🥾", slot: "boots",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/leather_boots.png",
    description: "+1 DEX, 15 DEF",
    classes: [], armorType: "leather",
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_boots", consumable: false, defense: 15,
  },
  {
    id: "leather_hood", name: "Leather Hood", icon: "🪖", slot: "head",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/leather_hood.png",
    description: "+1 DEX, 15 DEF",
    classes: [], armorType: "leather",
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_hood", consumable: false, defense: 15,
  },
  {
    id: "leather_pants", name: "Leather Pants", icon: "👖", slot: "legs",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/leather_pants.png",
    description: "+1 VIT, 20 DEF",
    classes: [], armorType: "leather",
    stats: { vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_pants", consumable: false, defense: 20,
  },
  {
    id: "leather_cloak", name: "Leather Cloak", icon: "🧥", slot: "cloak",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/leather_cloak.png",
    description: "+1 DEX, 12 DEF",
    classes: [], armorType: "leather",
    stats: { dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "leather_cloak", consumable: false, defense: 12,
  },
  {
    id: "rangers_garb", name: "Ranger's Garb", icon: "🏹", slot: "chest",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/rangers_garb.png",
    description: "+2 DEX, +1 VIT, 40 DEF",
    classes: ["archer"], armorType: "leather",
    stats: { dex: 2, vit: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "rangers_garb", consumable: false, defense: 40,
  },
  {
    id: "shadow_mantle", name: "Shadow Mantle", icon: "🗡️", slot: "cloak",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/shadow_mantle.png",
    description: "+2 DEX, +1 STR, 22 DEF",
    classes: ["assassin"], armorType: "leather",
    stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "shadow_mantle", consumable: false, defense: 22,
  },

  // ── Material-crafted equipment ────────────────────────────────

  // Blacksmith — material weapons & armor
  {
    id: "orc_cleaver", name: "Orc Cleaver", icon: "🪓", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/orc_cleaver.png",
    description: "+3 STR. Crude but brutally effective.",
    classes: ["warrior"],
    stats: { str: 3 }, durationMod: 1, lootMod: 1,
    recipeId: "orc_cleaver", consumable: false,
  },
  {
    id: "cursed_blade", name: "Cursed Blade", icon: "⚔️", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/cursed_blade.png",
    description: "+2 STR, +2 INT. The edge never dulls. It whispers when drawn.",
    classes: ["warrior", "assassin"],
    stats: { str: 2, int: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "cursed_blade", consumable: false,
  },
  {
    id: "dragonbone_sword", name: "Dragonbone Sword", icon: "🗡️", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/dragonbone_sword.png",
    description: "+5 STR, +2 DEX. Forged with dragon fang — it cuts through armor like parchment.",
    classes: ["warrior", "assassin"],
    stats: { str: 5, dex: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "dragonbone_sword", consumable: false,
  },
  {
    id: "infernal_mail", name: "Infernal Mail", icon: "⛓️", slot: "chest",
    description: "+2 VIT, +1 STR, 65 DEF. Demon-forged links that radiate heat.",
    classes: ["warrior"],
    stats: { vit: 2, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "infernal_mail", consumable: false, defense: 65,
  },
  {
    id: "fang_necklace", name: "Fang Necklace", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/fang_necklace.png", icon: "🦷", slot: "amulet",
    description: "+1 STR, +1 DEX. Zah'kari courage charm — wolf fangs on sinew cord.",
    classes: [],
    stats: { str: 1, dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "fang_necklace", consumable: false,
  },

  // Leatherworking — material armor
  {
    id: "wolfhide_armor", name: "Wolfhide Armor", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/wolfhide_armor.png", icon: "🐺", slot: "chest",
    description: "+1 VIT, +1 DEX, 25 DEF. Tough and pungent. The frontier's favorite.",
    classes: [], armorType: "leather",
    stats: { vit: 1, dex: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "wolfhide_armor", consumable: false, defense: 25,
  },
  {
    id: "chitin_vest", name: "Chitin Vest", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/chitin_vest.png", icon: "🕷️", slot: "chest",
    description: "+2 DEX, 35 DEF. Light as wood, hard as iron. Spider-silk stitching.",
    classes: [], armorType: "leather",
    stats: { dex: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "chitin_vest", consumable: false, defense: 35,
  },
  {
    id: "trollhide_cloak", name: "Trollhide Cloak", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/trollhide_cloak.png", icon: "🧌", slot: "cloak",
    description: "+2 VIT, +1 STR, 30 DEF. Still warm. The regeneration lingers.",
    classes: [], armorType: "leather",
    stats: { vit: 2, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "trollhide_cloak", consumable: false, defense: 30,
  },
  {
    id: "wyrmscale_armor", name: "Wyrmscale Armor", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/wyrmscale_armor.png", icon: "🐉", slot: "chest",
    description: "+3 VIT, +2 STR, 70 DEF. Dragon scales over leather. Forge-resistant and magnificent.",
    classes: [], armorType: "plate",
    stats: { vit: 3, str: 2 }, durationMod: 1, lootMod: 1,
    recipeId: "wyrmscale_armor", consumable: false, defense: 70,
  },

  // Tailoring — material robes & cloaks
  {
    id: "ghostweave_cloak", name: "Ghostweave Cloak", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/shadow_cloak.png", icon: "👻", slot: "cloak",
    description: "+2 INT, +1 WIS, 15 DEF. Nearly invisible. Cold as moonlight.",
    classes: [], armorType: "cloth",
    stats: { int: 2, wis: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "ghostweave_cloak", consumable: false, defense: 15,
  },
  {
    id: "windweave_robe", name: "Windweave Robe", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/windweave_robe.png", icon: "💨", slot: "chest",
    description: "+3 INT, +1 DEX, 20 DEF. Weighs nothing. Dries instantly. 5% faster missions.",
    classes: ["wizard"], armorType: "cloth",
    stats: { int: 3, dex: 1 }, durationMod: 0.95, lootMod: 1,
    recipeId: "windweave_robe", consumable: false, defense: 20,
  },
  {
    id: "war_banner", name: "War Banner", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/war_banner.png", icon: "🏴", slot: "trinket",
    description: "+1 STR to entire party. Orc warlord's standard, restitched and blessed.",
    classes: [],
    stats: { str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "war_banner", consumable: false,
  },

  // Woodworker — material weapons
  {
    id: "sinew_bow", name: "Sinew Bow", icon: "🏹", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woodworker/sinew_bow.png",
    description: "+2 DEX, +1 STR. Wolf-sinew string. Never snaps in the cold.",
    classes: ["archer"],
    stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1,
    recipeId: "sinew_bow", consumable: false,
  },
  {
    id: "dragonfire_staff", name: "Dragonfire Staff", icon: "🔥", slot: "mainHand",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woodworker/dragonfire_staff.png",
    description: "+5 INT, +2 WIS. The tip smolders permanently. Ink evaporates near it.",
    classes: ["wizard"],
    stats: { int: 5, wis: 2 }, durationMod: 0.9, lootMod: 1,
    recipeId: "dragonfire_staff", consumable: false, twoHanded: true,
  },

  // ── New Equipment — Content Expansion ──────────────────────────

  // ── Rings (Jewelcrafter) ─────────────────────────────────────────
  {
    id: "copper_band", name: "Copper Band", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/copper_band.png", icon: "💍", slot: "ring1",
    description: "+1 VIT. Simple copper ring, polished smooth. Better than nothing.",
    classes: [], stats: { vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "copper_band", consumable: false,
  },
  {
    id: "bone_ring", name: "Bone Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/bone_ring.png", icon: "💍", slot: "ring1",
    description: "+1 STR. Carved from barrowfield bone. The dead don't need it anymore.",
    classes: ["warrior", "assassin"], stats: { str: 1 }, durationMod: 1, lootMod: 1, recipeId: "bone_ring", consumable: false,
  },
  {
    id: "woven_vine_ring", name: "Woven Vine Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/woven_vine_ring.png", icon: "💍", slot: "ring1",
    description: "+1 WIS. Living vine twisted into a ring. It grows tighter on your finger — but not uncomfortably.",
    classes: ["priest", "wizard"], stats: { wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "woven_vine_ring", consumable: false,
  },
  {
    id: "ruby_signet", name: "Ruby Signet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/ruby_signet.png", icon: "💍", slot: "ring1",
    description: "+2 STR, +1 VIT. A fire ruby set in iron. Warm to the touch, always.",
    classes: ["warrior"], stats: { str: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "ruby_signet", consumable: false,
  },
  {
    id: "sapphire_ring", name: "Sapphire Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/sapphire_ring.png", icon: "💍", slot: "ring1",
    description: "+2 INT, +1 WIS. A frost sapphire in silver. Keeps your mind clear and your fingers cold.",
    classes: ["wizard", "priest"], stats: { int: 2, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "sapphire_ring", consumable: false,
  },
  {
    id: "topaz_band", name: "Topaz Band", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/storm_ring.png", icon: "💍", slot: "ring1",
    description: "+2 DEX, +1 STR. A storm topaz in copper. Crackles faintly when you move fast.",
    classes: ["archer", "assassin"], stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "topaz_band", consumable: false,
  },
  {
    id: "emerald_loop", name: "Emerald Loop", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/emerald_band.png", icon: "💍", slot: "ring1",
    description: "+2 WIS, +1 VIT. An emerald shard in twisted silver. Smells faintly of forest rain.",
    classes: ["priest"], stats: { wis: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "emerald_loop", consumable: false,
  },
  {
    id: "moonstone_seal", name: "Moonstone Seal", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/moonstone_ring.png", icon: "💍", slot: "ring1",
    description: "+3 WIS, +2 INT, +1 VIT. Divine light trapped in stone. The priests weep when they see it.",
    classes: ["priest", "wizard"], stats: { wis: 3, int: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "moonstone_seal", consumable: false,
  },
  {
    id: "void_band", name: "Void Band", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/void_ring.png", icon: "💍", slot: "ring1",
    description: "+3 DEX, +2 STR. The shadows seem darker near your hand. You move faster. You don't question why.",
    classes: ["assassin"], stats: { dex: 3, str: 2 }, durationMod: 1, lootMod: 1, recipeId: "void_band", consumable: false,
  },
  {
    id: "dragonfire_ring", name: "Dragonfire Ring", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/dragonscale_ring.png", icon: "💍", slot: "ring1",
    description: "+3 STR, +2 VIT. Dragon blood fused with ruby. It pulses like a second heartbeat.",
    classes: ["warrior"], stats: { str: 3, vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "dragonfire_ring", consumable: false,
  },

  // ── Head Armor ──────────────────────────────────────────────────
  {
    id: "iron_helm", name: "Iron Helm", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/steel_helm.png", icon: "🪖", slot: "head",
    description: "+2 VIT, +1 STR, 35 DEF. Heavy, hot, and the reason you still have a skull.",
    classes: [], armorType: "plate",
    stats: { vit: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "iron_helm", consumable: false, defense: 35,
  },
  {
    id: "chainmail_coif", name: "Chainmail Coif", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/chainmail_coif.png", icon: "⛓️", slot: "head",
    description: "+1 VIT, +1 DEX, 25 DEF. Iron rings woven tight. Light enough to turn your head in.",
    classes: [], armorType: "mail",
    stats: { vit: 1, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "chainmail_coif", consumable: false, defense: 25,
  },
  {
    id: "wizard_hat", name: "Wizard's Hat", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/wizard_hat.png", icon: "🎩", slot: "head",
    description: "+2 INT, 8 DEF. Tall, pointed, and embroidered with arcane sigils. Yes, it's a bit much.",
    classes: ["wizard"], armorType: "cloth",
    stats: { int: 2 }, durationMod: 1, lootMod: 1, recipeId: "wizard_hat", consumable: false, defense: 8,
  },
  {
    id: "priest_circlet", name: "Priest's Circlet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/moonstone_circlet.png", icon: "👑", slot: "head",
    description: "+1 WIS, +1 INT, 12 DEF. A simple gold band set with a moonstone chip. Consecrated.",
    classes: ["priest"], armorType: "cloth",
    stats: { wis: 1, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "priest_circlet", consumable: false, defense: 12,
  },
  {
    id: "shadow_cowl", name: "Shadow Cowl", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/assassin_hood.png", icon: "🥷", slot: "head",
    description: "+2 DEX, +1 STR, 18 DEF. Dark leather hood that covers everything but the eyes. The eyes are the point.",
    classes: ["assassin"], armorType: "leather",
    stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "shadow_cowl", consumable: false, defense: 18,
  },
  {
    id: "bear_skull_helm", name: "Bear-Skull Helm", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/beast_skull_helm.png", icon: "💀", slot: "head",
    description: "+1 STR, +1 VIT, +1 DEX, 30 DEF. A dire bear skull, hollowed and lined with fur. Terrifying to enemies. Uncomfortable for you.",
    classes: [], armorType: "mail",
    stats: { str: 1, vit: 1, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "bear_skull_helm", consumable: false, defense: 30,
  },

  // ── Leg Armor ───────────────────────────────────────────────────
  {
    id: "iron_greaves", name: "Iron Greaves", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/steel_greaves.png", icon: "🦵", slot: "legs",
    description: "+2 VIT, +1 STR, 40 DEF. Plate leg armor. Loud, heavy, and reassuringly solid.",
    classes: [], armorType: "plate",
    stats: { vit: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "iron_greaves", consumable: false, defense: 40,
  },
  {
    id: "cloth_leggings", name: "Cloth Leggings", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/priest_vestments_legs.png", icon: "👖", slot: "legs",
    description: "+1 VIT, +1 WIS, 8 DEF. Reinforced linen with prayer-stitched hems. Comfortable for long rituals.",
    classes: [], armorType: "cloth",
    stats: { vit: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "cloth_leggings", consumable: false, defense: 8,
  },
  {
    id: "ranger_trousers", name: "Ranger's Trousers", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/ranger_trousers.png", icon: "👖", slot: "legs",
    description: "+1 DEX, +1 VIT, 22 DEF. Leather-reinforced at the knees. Built for running and crouching.",
    classes: [], armorType: "leather",
    stats: { dex: 1, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "ranger_trousers", consumable: false, defense: 22,
  },
  {
    id: "wyrmscale_greaves", name: "Wyrmscale Greaves", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/dragonscale_greaves.png", icon: "🐉", slot: "legs",
    description: "+3 VIT, +1 STR, 50 DEF. Dragon-scale leg plates. Worth more than most houses.",
    classes: [], armorType: "plate",
    stats: { vit: 3, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "wyrmscale_greaves", consumable: false, defense: 50,
  },

  // ── Boots ───────────────────────────────────────────────────────
  {
    id: "iron_sabatons", name: "Iron Sabatons", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/steel_boots.png", icon: "🥾", slot: "boots",
    description: "+1 VIT, +1 STR, 30 DEF. Plated boots. Every step sounds like a hammer.",
    classes: [], armorType: "plate",
    stats: { vit: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "iron_sabatons", consumable: false, defense: 30,
  },
  {
    id: "soft_shoes", name: "Soft Shoes", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/pilgrim_sandals.png", icon: "👟", slot: "boots",
    description: "+1 DEX, +1 WIS, 5 DEF. Cloth shoes with cork soles. Quiet, comfortable, terrible in mud.",
    classes: [], armorType: "cloth",
    stats: { dex: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "soft_shoes", consumable: false, defense: 5,
  },
  {
    id: "scout_boots", name: "Scout's Boots", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/stalker_boots.png", icon: "🥾", slot: "boots",
    description: "+2 DEX, 18 DEF. Supple leather, silent on any surface. The archer's best friend.",
    classes: [], armorType: "leather",
    stats: { dex: 2 }, durationMod: 1, lootMod: 1, recipeId: "scout_boots", consumable: false, defense: 18,
  },
  {
    id: "trollhide_boots", name: "Trollhide Boots", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/troll_stompers.png", icon: "🥾", slot: "boots",
    description: "+2 VIT, +1 DEX, 25 DEF. Tough as stone, ugly as sin. They'll outlast you.",
    classes: [], armorType: "leather",
    stats: { vit: 2, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "trollhide_boots", consumable: false, defense: 25,
  },

  // ── Amulets (Jewelcrafter) ──────────────────────────────────────
  {
    id: "holy_pendant", name: "Holy Pendant", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/moonstone_pendant.png", icon: "✝️", slot: "amulet",
    description: "+2 WIS, +1 VIT. A moonstone set in silver, blessed by three priests. Warm against the skin.",
    classes: ["priest"], stats: { wis: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "holy_pendant", consumable: false,
  },
  {
    id: "amber_charm", name: "Amber Charm", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/amber_amulet.png", icon: "🟠", slot: "amulet",
    description: "+2 INT, +1 WIS. Ancient amber with a perfect insect inside. The Silvaneth say it thinks.",
    classes: ["wizard"], stats: { int: 2, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "amber_charm", consumable: false,
  },
  {
    id: "predator_tooth", name: "Predator's Tooth", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/alpha_fang_amulet.png", icon: "🦷", slot: "amulet",
    description: "+2 DEX, +1 STR. An alpha wolf's fang on braided sinew. The pack respects the kill.",
    classes: ["archer", "assassin"], stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "predator_tooth", consumable: false,
  },
  {
    id: "warlord_chain", name: "Warlord's Chain", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/warlord_chain.png", icon: "⛓️", slot: "amulet",
    description: "+2 STR, +2 VIT. Orc-steel links and a fire ruby clasp. Taken from a chief who doesn't need it anymore.",
    classes: ["warrior"], stats: { str: 2, vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "warlord_chain", consumable: false,
  },
  {
    id: "ghostveil_locket", name: "Ghostveil Locket", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/spirit_locket.png", icon: "👻", slot: "amulet",
    description: "+2 INT, +1 DEX. A locket that holds a wisp of ghostweave. The dead don't notice you as easily.",
    classes: [], stats: { int: 2, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "ghostveil_locket", consumable: false,
  },

  // ── Off-Hand — New ──────────────────────────────────────────────
  {
    id: "arcane_focus", name: "Arcane Focus", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/woodworker/crystal_orb.png", icon: "🔮", slot: "offHand",
    description: "+2 INT, +1 WIS. A crystal orb that floats beside your hand. Show-off? Maybe. Effective? Definitely.",
    classes: ["wizard"], stats: { int: 2, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "arcane_focus", consumable: false,
  },
  {
    id: "prayer_book", name: "Prayer Book", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/tome_of_power.png", icon: "📖", slot: "offHand",
    description: "+2 WIS, +1 INT. Leather-bound, well-thumbed, with annotations in three languages.",
    classes: ["priest"], stats: { wis: 2, int: 1 }, durationMod: 1, lootMod: 1, recipeId: "prayer_book", consumable: false,
  },
  {
    id: "parrying_dagger", name: "Parrying Dagger", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/parrying_dagger.png", icon: "🗡️", slot: "offHand",
    description: "+1 DEX, +1 STR, 15 DEF. A wide-bladed dagger built for catching swords, not throwing.",
    classes: ["assassin"], stats: { dex: 1, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "parrying_dagger", consumable: false, defense: 15,
  },
  {
    id: "quiver_precision", name: "Quiver of Precision", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/leatherworking/enchanted_quiver.png", icon: "🏹", slot: "offHand",
    description: "+2 DEX. Enchanted quiver — arrows slide out nocked and ready. Faster than thinking.",
    classes: ["archer"], stats: { dex: 2 }, durationMod: 1, lootMod: 1, recipeId: "quiver_precision", consumable: false,
  },

  // ── Assassin Daggers (mainHand) ─────────────────────────────────
  {
    id: "stiletto", name: "Stiletto", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/stiletto.png", icon: "🗡️", slot: "mainHand",
    description: "+2 DEX, +1 STR. Needle-thin, whisper-quiet. Made for gaps in armor, not fair fights.",
    classes: ["assassin"], stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1, recipeId: "stiletto", consumable: false,
  },
  {
    id: "poisoned_blade", name: "Poisoned Blade", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/venom_blade.png", icon: "🗡️", slot: "mainHand",
    description: "+3 DEX, +2 STR. The groove along the blade holds venom. The nick is worse than the cut.",
    classes: ["assassin"], stats: { dex: 3, str: 2 }, durationMod: 1, lootMod: 1, recipeId: "poisoned_blade", consumable: false,
  },
  {
    id: "shadow_dagger", name: "Shadow Dagger", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/void_dagger.png", icon: "🗡️", slot: "mainHand",
    description: "+4 DEX, +3 STR. Void-touched steel that drinks the light. The wound hurts before the blade arrives.",
    classes: ["assassin"], stats: { dex: 4, str: 3 }, durationMod: 1, lootMod: 1, recipeId: "shadow_dagger", consumable: false,
  },

  // ── Priest Weapons (mainHand) ───────────────────────────────────
  {
    id: "iron_mace", name: "Iron Mace", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/war_mace.png", icon: "🔨", slot: "mainHand",
    description: "+1 STR, +1 WIS. Heavy, blunt, and sanctioned by the Church. For when prayer isn't enough.",
    classes: ["priest", "warrior"], stats: { str: 1, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "iron_mace", consumable: false,
  },
  {
    id: "blessed_mace", name: "Blessed Mace", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/blacksmith/holy_mace.png", icon: "🔨", slot: "mainHand",
    description: "+2 WIS, +2 STR, +1 VIT. Moonstone-capped and consecrated. The undead hate it. So does everything else you hit with it.",
    classes: ["priest"], stats: { wis: 2, str: 2, vit: 1 }, durationMod: 1, lootMod: 1, recipeId: "blessed_mace", consumable: false,
  },

  // ── Boss Loot Equipment (not craftable) ─────────────────────────
  {
    id: "alpha_fang_amulet", name: "Alpha's Fang", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/alpha_fang_amulet.png", icon: "🐺", slot: "amulet",
    description: "+2 STR, +1 DEX. The pack leader's broken fang, still warm. Wearing it feels like being watched by yellow eyes.",
    classes: [], stats: { str: 2, dex: 1 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "witch_eye_trinket", name: "Witch's Eye", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/witch_eye_pendant.png", icon: "👁️", slot: "trinket",
    description: "+2 INT, +1 WIS, -5% duration. It sees what you can't. Don't ask what it shows the witch.",
    classes: ["wizard", "priest"], stats: { int: 2, wis: 1 }, durationMod: 0.95, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "goblin_crown", name: "Goblin Crown", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/goblin_crown.png", icon: "👑", slot: "head",
    description: "+2 DEX, +1 STR, +10% loot. Bent copper and stolen gems. It's ugly. It's also lucky.",
    classes: [], stats: { dex: 2, str: 1 }, durationMod: 1, lootMod: 1.10, recipeId: "", consumable: false,
  },
  {
    id: "necromancer_cowl", name: "Necromancer's Cowl", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/necromancer_cowl.png", icon: "🧥", slot: "head",
    description: "+3 INT, +1 WIS. The fabric whispers when you put it on. Best not to listen.",
    classes: ["wizard"], stats: { int: 3, wis: 1 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false, defense: 10,
  },
  {
    id: "beast_heart_charm", name: "Beast Heart Charm", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/beast_heart_charm.png", icon: "❤️", slot: "trinket",
    description: "+2 VIT, +2 STR. A dire bear's heart, dried and bound in leather. Courage you can wear.",
    classes: [], stats: { vit: 2, str: 2 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "infernal_signet", name: "Infernal Signet", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/jewelcrafting/infernal_signet.png", icon: "💍", slot: "ring1",
    description: "+3 STR, +2 VIT. Demon-forged iron and fire ruby. Burns cold. Grants strength at a cost nobody can name.",
    classes: ["warrior", "assassin"], stats: { str: 3, vit: 2 }, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },

  // ── Starter / worn gear ───────────────────────────────────────
  // The kit newcomers arrive with — their own worn belongings, not issued gear.
  // NO stat bonuses (pure immersion, no early power creep); armor gives only a
  // little defense, well under crafted pieces. Not craftable (no recipe) and
  // never dropped (loot comes from enemies). The player replaces these with
  // crafted gear, which is where the stats live. See project_weapon_combat for
  // the future weapon-damage/spell direction — worn weapons stay 0-stat for now.
  {
    id: "worn_bow", name: "Worn Bow", icon: "🏹", slot: "mainHand", weaponType: "bow",
    description: "", flavor: "A well-worn hunting bow. It has kept crows off the barley and meat on the table.",
    classes: ["archer"], stats: {}, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "plain_sword", name: "Plain Sword", icon: "⚔️", slot: "mainHand", weaponType: "sword",
    description: "", flavor: "A plain, notched blade. Nothing fine about it, but it holds an edge.",
    classes: ["warrior"], stats: {}, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "worn_dagger", name: "Worn Dagger", icon: "🔪", slot: "mainHand", weaponType: "dagger",
    description: "", flavor: "A worn utility knife, kept sharp out of habit.",
    classes: ["assassin"], stats: {}, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "plain_staff", name: "Plain Staff", icon: "🪵", slot: "mainHand", weaponType: "staff", twoHanded: true,
    description: "", flavor: "A plain walking staff, smooth where a hand has held it for years.",
    classes: ["wizard", "priest"], stats: {}, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "cloth_hood", name: "Cloth Hood", icon: "🧢", slot: "head", armorType: "cloth",
    description: "+2 DEF", flavor: "A simple cloth hood against the weather.",
    classes: [], stats: {}, defense: 2, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "patched_leather", name: "Patched Leathers", icon: "🟫", slot: "chest", armorType: "leather",
    description: "+6 DEF", flavor: "A patched leather jerkin, much mended. It has seen a few winters.",
    classes: [], stats: {}, defense: 6, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "worn_chainmail", name: "Worn Chainmail", icon: "⛓️", slot: "chest", armorType: "mail",
    description: "+10 DEF", flavor: "An old coat of mail, rings gone dull. Heavier than it protects, but better than cloth.",
    classes: [], stats: {}, defense: 10, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
  {
    id: "homespun_robe", name: "Homespun Robe", icon: "🧶", slot: "chest", armorType: "cloth",
    description: "+4 DEF", flavor: "A plain homespun robe, warm enough and no more.",
    classes: ["wizard", "priest"], stats: {}, defense: 4, durationMod: 1, lootMod: 1, recipeId: "", consumable: false,
  },
];
