import type { AdventurerClass } from "./adventurers";
import type { Adventurer } from "./adventurers";

// ─── Talent Tree Definitions ────────────────────────────────────
// Each node knows its children. Row index controls vertical position.
// Horizontal position is computed at render time from tree structure.

export interface TalentNode {
  id: string;
  name: string;
  icon: string;
  class: AdventurerClass;
  description: string;
  children: string[];   // IDs of next talents this unlocks
  row: number;          // vertical level (0 = top)
  isCapstone?: boolean;
  title?: string;       // earned title for capstones
}

// ─── Warrior Talent Tree ────────────────────────────────────────
//
//  Row 0:                    [STR +5]
//                          /    |    \
//  Row 1:            [INT +5] [STR +5] [DEX +5]
//                      |        |         |
//  Row 2:         [Holy Hit]  [Battle  [Keen Edge]
//                              Cry]
//                    / \       / \       / \
//  Row 3:      [HoT] [Intcpt][Plate][Stun][Bleed][Armor Pen]
//                |      |       |      |      |       |
//  Row 4:    [WIS+5] [VIT+5] [STR+5][STR+5][DEX+5] [DEX+5]
//                \     /        \    /        \      /
//  Row 5:      [Paladin]      [Warlord]    [Shadowblade]

export const WARRIOR_TALENTS: TalentNode[] = [
  // ── Row 0: Entry ──────────────────────────────────────────────
  { id: "w_str1", name: "Brute Force", icon: "💪", class: "warrior", row: 0,
    description: "+5 Strength",
    children: ["w_int1", "w_str2", "w_dex1"] },

  // ── Row 1: Path commitment ────────────────────────────────────
  { id: "w_int1", name: "Inner Light", icon: "🧠", class: "warrior", row: 1,
    description: "+5 Intelligence — Awaken the divine spark within",
    children: ["w_holy_hit"] },

  { id: "w_str2", name: "Raw Power", icon: "💪", class: "warrior", row: 1,
    description: "+5 Strength — Pure martial force",
    children: ["w_battlecry"] },

  { id: "w_dex1", name: "Quick Hands", icon: "🏃", class: "warrior", row: 1,
    description: "+5 Dexterity — Fight dirty, fight fast",
    children: ["w_keen_edge"] },

  // ── Row 2: First themed talent ────────────────────────────────
  { id: "w_holy_hit", name: "Blessed Strikes", icon: "✨", class: "warrior", row: 2,
    description: "30% chance attacks deal bonus holy damage (ignores physical defense)",
    children: ["w_hot", "w_intercept", "w_plate", "w_stun", "w_bleed", "w_armor_pen"] },

  { id: "w_battlecry", name: "Battle Cry", icon: "📯", class: "warrior", row: 2,
    description: "At the start of combat, all allies gain +15% damage for 2 rounds",
    children: ["w_hot", "w_intercept", "w_plate", "w_stun", "w_bleed", "w_armor_pen"] },

  { id: "w_keen_edge", name: "Keen Edge", icon: "🗡️", class: "warrior", row: 2,
    description: "+15% critical strike chance",
    children: ["w_hot", "w_intercept", "w_plate", "w_stun", "w_bleed", "w_armor_pen"] },

  // ── Row 3: Specialization branches ────────────────────────────
  // Paladin branches
  { id: "w_hot", name: "Renewing Faith", icon: "💚", class: "warrior", row: 3,
    description: "Heal 8% of max HP at the start of each combat round",
    children: ["w_wis1"] },

  { id: "w_intercept", name: "Divine Intercept", icon: "🛡️", class: "warrior", row: 3,
    description: "100% chance to absorb a killing blow meant for an ally (once per combat). Heals the ally for 30% max HP",
    children: ["w_vit1"] },

  // Warlord branches
  { id: "w_plate", name: "Iron Fortress", icon: "🏰", class: "warrior", row: 3,
    description: "+25% damage reduction. Can equip plate armor",
    children: ["w_str3"] },

  { id: "w_stun", name: "Shattering Blow", icon: "💥", class: "warrior", row: 3,
    description: "25% chance on hit to stun the target for 1 round (they skip their turn)",
    children: ["w_str4"] },

  // Shadowblade branches
  { id: "w_bleed", name: "Rending Strikes", icon: "🩸", class: "warrior", row: 3,
    description: "Attacks apply a bleed: 15% of attack power per round for 3 rounds",
    children: ["w_dex2"] },

  { id: "w_armor_pen", name: "Find Weakness", icon: "🎯", class: "warrior", row: 3,
    description: "Attacks ignore 50% of the target's physical defense",
    children: ["w_dex3"] },

  // ── Row 4: Final stat nodes ───────────────────────────────────
  // Paladin stats
  { id: "w_wis1", name: "Wisdom of Faith", icon: "📖", class: "warrior", row: 4,
    description: "+5 Wisdom — The divine rewards the devoted",
    children: ["w_cap_paladin"] },

  { id: "w_vit1", name: "Martyr's Endurance", icon: "❤️", class: "warrior", row: 4,
    description: "+5 Vitality — Those who sacrifice must endure",
    children: ["w_cap_paladin"] },

  // Warlord stats
  { id: "w_str3", name: "Unyielding Might", icon: "💪", class: "warrior", row: 4,
    description: "+5 Strength — An immovable force",
    children: ["w_cap_warlord"] },

  { id: "w_str4", name: "Conqueror's Force", icon: "💪", class: "warrior", row: 4,
    description: "+5 Strength — Break them before they break you",
    children: ["w_cap_warlord"] },

  // Shadowblade stats
  { id: "w_dex2", name: "Serpent's Reflexes", icon: "🏃", class: "warrior", row: 4,
    description: "+5 Dexterity — Strike the wound again and again",
    children: ["w_cap_shadow"] },

  { id: "w_dex3", name: "Predator's Instinct", icon: "🏃", class: "warrior", row: 4,
    description: "+5 Dexterity — Every armor has a gap",
    children: ["w_cap_shadow"] },

  // ── Row 5: Capstones ──────────────────────────────────────────
  { id: "w_cap_paladin", name: "Paladin's Oath", icon: "⚜️", class: "warrior", row: 5,
    description: "All allies gain +10% max HP while you live. Your holy damage heals the lowest-HP ally for the same amount.",
    children: [], isCapstone: true, title: "Paladin" },

  { id: "w_cap_warlord", name: "Warlord's Presence", icon: "👑", class: "warrior", row: 5,
    description: "All allies deal +15% damage while you live. Once per combat, when you drop below 25% HP, fully heal and become immune for 1 round.",
    children: [], isCapstone: true, title: "Warlord" },

  { id: "w_cap_shadow", name: "Shadowblade Mastery", icon: "🗡️", class: "warrior", row: 5,
    description: "Critical strikes deal triple damage (instead of 1.5x). Killing an enemy grants +30% attack power for the next round.",
    children: [], isCapstone: true, title: "Shadowblade" },
];

// ─── Priest Talent Tree ─────────────────────────────────────────
//
//  Row 0:                    [WIS +5]
//                          /    |    \
//  Row 1:            [STR +5] [WIS +5] [INT +5]
//                      |        |         |
//  Row 2:         [Shield   [Greater  [Holy Smite]
//                  of Faith]  Heal]
//                    / \       / \       / \
//  Row 3:    [Taunt] [Armor] [HoT] [GrpHeal] [HolyFire] [Expose]
//               |      |      |       |          |          |
//  Row 4:   [STR+5] [VIT+5] [WIS+5] [WIS+5]  [INT+5]   [INT+5]
//                \    /        \     /           \        /
//  Row 5:     [Templar]     [Archpriest]      [Inquisitor]

export const PRIEST_TALENTS: TalentNode[] = [
  // ── Row 0: Entry ──────────────────────────────────────────────
  { id: "p_wis1", name: "Divine Insight", icon: "📖", class: "priest", row: 0,
    description: "+5 Wisdom",
    children: ["p_str1", "p_wis2", "p_int1"] },

  // ── Row 1: Path commitment ────────────────────────────────────
  { id: "p_str1", name: "Strength of Faith", icon: "💪", class: "priest", row: 1,
    description: "+5 Strength — The body is a temple; make it a fortress",
    children: ["p_shield"] },

  { id: "p_wis2", name: "Deep Devotion", icon: "📖", class: "priest", row: 1,
    description: "+5 Wisdom — The deeper the faith, the greater the miracle",
    children: ["p_greater_heal"] },

  { id: "p_int1", name: "Burning Truth", icon: "🧠", class: "priest", row: 1,
    description: "+5 Intelligence — Knowledge of the divine burns away lies",
    children: ["p_holy_smite"] },

  // ── Row 2: First themed talent ────────────────────────────────
  { id: "p_shield", name: "Shield of Faith", icon: "🛡️", class: "priest", row: 2,
    description: "Can equip shields and one-handed swords. +15% physical defense",
    children: ["p_taunt", "p_armor", "p_hot", "p_group_heal", "p_holy_fire", "p_expose"] },

  { id: "p_greater_heal", name: "Greater Heal", icon: "💚", class: "priest", row: 2,
    description: "Single-target heal now restores 60% of target's max HP (up from 40%)",
    children: ["p_taunt", "p_armor", "p_hot", "p_group_heal", "p_holy_fire", "p_expose"] },

  { id: "p_holy_smite", name: "Empowered Smite", icon: "⚡", class: "priest", row: 2,
    description: "Smite deals 80% more damage and hits up to 2 targets",
    children: ["p_taunt", "p_armor", "p_hot", "p_group_heal", "p_holy_fire", "p_expose"] },

  // ── Row 3: Specialization branches ────────────────────────────
  // Templar branches
  { id: "p_taunt", name: "Righteous Challenge", icon: "📯", class: "priest", row: 3,
    description: "Taunt all enemies for 1 round, forcing them to attack you. Gain +20% damage reduction while taunting",
    children: ["p_str2"] },

  { id: "p_armor", name: "Blessed Armor", icon: "🏰", class: "priest", row: 3,
    description: "Can equip plate armor. Holy light absorbs 25% of damage taken as a shield",
    children: ["p_vit1"] },

  // Archpriest branches
  { id: "p_hot", name: "Renewing Prayer", icon: "🌿", class: "priest", row: 3,
    description: "At the start of each round, the lowest-HP ally heals for 12% of their max HP",
    children: ["p_wis3"] },

  { id: "p_group_heal", name: "Circle of Light", icon: "☀️", class: "priest", row: 3,
    description: "Group Heal now heals for 50% of normal heal (up from 40%) and removes one negative effect",
    children: ["p_wis4"] },

  // Inquisitor branches
  { id: "p_holy_fire", name: "Purifying Fire", icon: "🔥", class: "priest", row: 3,
    description: "New ability: deal 70% holy damage to all enemies. Undead and demons take double damage. Cooldown 4",
    children: ["p_int2"] },

  { id: "p_expose", name: "Expose Sin", icon: "👁️", class: "priest", row: 3,
    description: "Mark a target: all allies deal +25% damage to it for 2 rounds. Strips one buff from the target",
    children: ["p_int3"] },

  // ── Row 4: Final stat nodes ───────────────────────────────────
  // Templar stats
  { id: "p_str2", name: "Warrior's Faith", icon: "💪", class: "priest", row: 4,
    description: "+5 Strength — Pray with your sword arm",
    children: ["p_cap_paladin"] },

  { id: "p_vit1", name: "Unbreakable Spirit", icon: "❤️", class: "priest", row: 4,
    description: "+5 Vitality — The faithful do not fall easily",
    children: ["p_cap_paladin"] },

  // Archpriest stats
  { id: "p_wis3", name: "Wellspring of Grace", icon: "📖", class: "priest", row: 4,
    description: "+5 Wisdom — Your prayers reach further than your voice",
    children: ["p_cap_archpriest"] },

  { id: "p_wis4", name: "Shepherd's Wisdom", icon: "📖", class: "priest", row: 4,
    description: "+5 Wisdom — You carry every name you've ever healed",
    children: ["p_cap_archpriest"] },

  // Inquisitor stats
  { id: "p_int2", name: "Sacred Fury", icon: "🧠", class: "priest", row: 4,
    description: "+5 Intelligence — The fire that purifies is the fire that destroys",
    children: ["p_cap_inquisitor"] },

  { id: "p_int3", name: "Piercing Judgment", icon: "🧠", class: "priest", row: 4,
    description: "+5 Intelligence — No darkness survives scrutiny",
    children: ["p_cap_inquisitor"] },

  // ── Row 5: Capstones ──────────────────────────────────────────
  { id: "p_cap_paladin", name: "Paladin's Vow", icon: "⚜️", class: "priest", row: 5,
    description: "While you live, allies take 20% less damage. When an ally would die, sacrifice 50% of your HP to save them (once per combat).",
    children: [], isCapstone: true, title: "Paladin" },

  { id: "p_cap_archpriest", name: "Miracle", icon: "✝️", class: "priest", row: 5,
    description: "Once per combat, when an ally dies, resurrect them with 50% HP. All healing you do is increased by 30%.",
    children: [], isCapstone: true, title: "Archpriest" },

  { id: "p_cap_inquisitor", name: "Judgment Day", icon: "⚡", class: "priest", row: 5,
    description: "Your holy damage ignores all resistances. Once per combat, call down divine judgment: deal 100% INT as holy damage to all enemies.",
    children: [], isCapstone: true, title: "Inquisitor" },
];

// ─── Wizard Talent Tree ──────────────────────────────────────────
//
//  Row 0:                     [INT +5]
//                           /    |    \
//  Row 1:            [WIS +5] [INT +5] [WIS +5]
//                      |        |         |
//  Row 2:         [Elemental [Arcane   [Holy Fire]
//                   Surge]    Blast]
//                    / \       / \       / \
//  Row 3:    [Frost][NatureHeal][CDR][SpellAmp][Purify][Strip]
//               |      |        |      |        |       |
//  Row 4:   [WIS+5] [WIS+5] [INT+5] [INT+5] [WIS+5] [INT+5]
//                \    /        \    /          \      /
//  Row 5:    [Primalist]     [Archmage]     [Inquisitor]

export const WIZARD_TALENTS: TalentNode[] = [
  // ── Row 0: Entry ──────────────────────────────────────────────
  { id: "wz_int1", name: "Arcane Mind", icon: "🧠", class: "wizard", row: 0,
    description: "+5 Intelligence",
    children: ["wz_wis1", "wz_int2", "wz_wis2"] },

  // ── Row 1: Path commitment ────────────────────────────────────
  { id: "wz_wis1", name: "Primal Wisdom", icon: "📖", class: "wizard", row: 1,
    description: "+5 Wisdom — The old magic runs through root and stone, not through books",
    children: ["wz_elemental"] },

  { id: "wz_int2", name: "Aether Mastery", icon: "🧠", class: "wizard", row: 1,
    description: "+5 Intelligence — Pure arcane power, distilled and controlled",
    children: ["wz_arcane_blast"] },

  { id: "wz_wis2", name: "Sacred Knowledge", icon: "📖", class: "wizard", row: 1,
    description: "+5 Wisdom — Where faith meets intellect, fire follows",
    children: ["wz_holy_fire"] },

  // ── Row 2: First themed talent ────────────────────────────────
  { id: "wz_elemental", name: "Elemental Surge", icon: "🌊", class: "wizard", row: 2,
    description: "Spells cycle through elements: frost (slows), fire (DOT), lightning (chains to 2nd target)",
    children: ["wz_frost", "wz_nature_heal", "wz_cdr", "wz_spell_amp", "wz_purify", "wz_strip"] },

  { id: "wz_arcane_blast", name: "Arcane Blast", icon: "💎", class: "wizard", row: 2,
    description: "Basic attacks deal 50% more damage as pure Aether. Aether ignores elemental resistances",
    children: ["wz_frost", "wz_nature_heal", "wz_cdr", "wz_spell_amp", "wz_purify", "wz_strip"] },

  { id: "wz_holy_fire", name: "Holy Fire", icon: "🔥", class: "wizard", row: 2,
    description: "Fireball becomes Holy Fire: deals holy damage, 2x damage to undead and demons",
    children: ["wz_frost", "wz_nature_heal", "wz_cdr", "wz_spell_amp", "wz_purify", "wz_strip"] },

  // ── Row 3: Specialization branches ────────────────────────────
  // Primalist branches
  { id: "wz_frost", name: "Permafrost", icon: "❄️", class: "wizard", row: 3,
    description: "Frost Bolt now reduces target's Strength by 30% for 2 rounds. Frost damage slows initiative",
    children: ["wz_wis3"] },

  { id: "wz_nature_heal", name: "Nature's Mending", icon: "🌿", class: "wizard", row: 3,
    description: "At the start of each round, the two lowest-HP allies heal for 8% max HP from living earth",
    children: ["wz_wis4"] },

  // Archmage branches
  { id: "wz_cdr", name: "Temporal Warp", icon: "⏳", class: "wizard", row: 3,
    description: "All spell cooldowns reduced by 1. Spells have a 20% chance to not trigger cooldown at all",
    children: ["wz_int3"] },

  { id: "wz_spell_amp", name: "Spell Amplification", icon: "✨", class: "wizard", row: 3,
    description: "+30% spell damage. Critical spells deal double damage instead of 1.5x",
    children: ["wz_int4"] },

  // Inquisitor branches
  { id: "wz_purify", name: "Purifying Flames", icon: "☀️", class: "wizard", row: 3,
    description: "New ability: AOE holy fire dealing 60% INT as damage. Burns away 1 buff from each target. CD 3",
    children: ["wz_wis5"] },

  { id: "wz_strip", name: "Denounce", icon: "👁️", class: "wizard", row: 3,
    description: "Mark an enemy: they take +30% damage from all sources and their magic resistance is halved for 3 rounds",
    children: ["wz_int5"] },

  // ── Row 4: Final stat nodes ───────────────────────────────────
  // Primalist stats
  { id: "wz_wis3", name: "Voice of the Storm", icon: "📖", class: "wizard", row: 4,
    description: "+5 Wisdom — The wind speaks; you learned to answer",
    children: ["wz_cap_primalist"] },

  { id: "wz_wis4", name: "Heartwood Bond", icon: "📖", class: "wizard", row: 4,
    description: "+5 Wisdom — The forest remembers those who tend it",
    children: ["wz_cap_primalist"] },

  // Archmage stats
  { id: "wz_int3", name: "Infinite Focus", icon: "🧠", class: "wizard", row: 4,
    description: "+5 Intelligence — Time bends for those who understand it",
    children: ["wz_cap_archmage"] },

  { id: "wz_int4", name: "Aether Conduit", icon: "🧠", class: "wizard", row: 4,
    description: "+5 Intelligence — Your body is a lens; the Aether is the light",
    children: ["wz_cap_archmage"] },

  // Inquisitor stats
  { id: "wz_wis5", name: "Righteous Fury", icon: "📖", class: "wizard", row: 4,
    description: "+5 Wisdom — The flame that judges does not waver",
    children: ["wz_cap_inquisitor"] },

  { id: "wz_int5", name: "Truth Seeker", icon: "🧠", class: "wizard", row: 4,
    description: "+5 Intelligence — No lie survives the light of inquiry",
    children: ["wz_cap_inquisitor"] },

  // ── Row 5: Capstones ──────────────────────────────────────────
  { id: "wz_cap_primalist", name: "Primal Convergence", icon: "🌀", class: "wizard", row: 5,
    description: "Command all elements at once: each spell triggers frost slow + fire DOT + lightning chain simultaneously. Nature healing doubled.",
    children: [], isCapstone: true, title: "Primalist" },

  { id: "wz_cap_archmage", name: "Arcane Supremacy", icon: "💠", class: "wizard", row: 5,
    description: "All spell damage +50%. Once per combat, reset all cooldowns instantly. Your spells cannot be resisted.",
    children: [], isCapstone: true, title: "Archmage" },

  { id: "wz_cap_inquisitor", name: "Divine Judgment", icon: "⚡", class: "wizard", row: 5,
    description: "Holy fire ignores all resistances. Once per combat, deal 150% INT as holy damage to all enemies and heal all allies for the same amount.",
    children: [], isCapstone: true, title: "Inquisitor" },
];

// ─── Archer Talent Tree ──────────────────────────────────────────
//
//  Row 0:                     [DEX +5]
//                           /    |    \
//  Row 1:            [WIS +5] [DEX +5] [DEX +5]
//                      |        |         |
//  Row 2:         [Enchanted [Precision [Venomous
//                  Arrows]    Shot]      Tips]
//                    / \       / \       / \
//  Row 3:    [Thorns][Cauterize][Crit][AoEVolley][PoisonStun][Silence]
//               |      |        |      |          |           |
//  Row 4:   [WIS+5] [WIS+5] [DEX+5] [DEX+5]   [DEX+5]    [DEX+5]
//                \    /        \    /            \          /
//  Row 5:    [Primalist]    [Sharpshooter]      [Hunter]

export const ARCHER_TALENTS: TalentNode[] = [
  // ── Row 0: Entry ──────────────────────────────────────────────
  { id: "a_dex1", name: "Steady Hand", icon: "🏃", class: "archer", row: 0,
    description: "+5 Dexterity",
    children: ["a_wis1", "a_dex2", "a_dex3"] },

  // ── Row 1: Path commitment ────────────────────────────────────
  { id: "a_wis1", name: "Nature's Eye", icon: "📖", class: "archer", row: 1,
    description: "+5 Wisdom — The forest taught you to shoot before any master did",
    children: ["a_enchanted"] },

  { id: "a_dex2", name: "Dead Eye", icon: "🏃", class: "archer", row: 1,
    description: "+5 Dexterity — One arrow, one kill. No wasted motion",
    children: ["a_precision"] },

  { id: "a_dex3", name: "Viper's Touch", icon: "🏃", class: "archer", row: 1,
    description: "+5 Dexterity — The arrow is just the delivery method",
    children: ["a_venom"] },

  // ── Row 2: First themed talent ────────────────────────────────
  { id: "a_enchanted", name: "Enchanted Arrows", icon: "✨", class: "archer", row: 2,
    description: "Arrows cycle elements: frost (slows 2 rounds), fire (DOT 3 rounds), lightning (chains to adjacent enemy)",
    children: ["a_thorns", "a_cauterize", "a_crit", "a_volley", "a_poison_stun", "a_silence"] },

  { id: "a_precision", name: "Precision Shot", icon: "🎯", class: "archer", row: 2,
    description: "+20% critical strike chance. Critical hits deal 2x damage (up from 1.5x)",
    children: ["a_thorns", "a_cauterize", "a_crit", "a_volley", "a_poison_stun", "a_silence"] },

  { id: "a_venom", name: "Venomous Tips", icon: "☠️", class: "archer", row: 2,
    description: "All arrows apply poison: 10% attack power per round for 3 rounds. Stacks up to 3 times",
    children: ["a_thorns", "a_cauterize", "a_crit", "a_volley", "a_poison_stun", "a_silence"] },

  // ── Row 3: Specialization branches ────────────────────────────
  // Primalist branches
  { id: "a_thorns", name: "Thorn Wall", icon: "🌿", class: "archer", row: 3,
    description: "New ability: summon a wall of thorns. All enemies take 15% WIS as nature damage per round for 3 rounds. CD 4",
    children: ["a_wis2"] },

  { id: "a_cauterize", name: "Cauterizing Arrow", icon: "🔥", class: "archer", row: 3,
    description: "Fire arrows now remove bleeds and poisons from allies they pass near. Heals the cleansed ally for 10% max HP",
    children: ["a_wis3"] },

  // Sharpshooter branches
  { id: "a_crit", name: "Killing Blow", icon: "💀", class: "archer", row: 3,
    description: "Critical strikes against targets below 30% HP deal triple damage. Kills grant +15% attack for next round",
    children: ["a_dex4"] },

  { id: "a_volley", name: "Arrow Storm", icon: "🏹", class: "archer", row: 3,
    description: "Multi-Shot upgraded: hits ALL enemies for 50% damage. If 3+ enemies are hit, cooldown resets immediately",
    children: ["a_dex5"] },

  // Hunter branches
  { id: "a_poison_stun", name: "Paralyzing Venom", icon: "🕸️", class: "archer", row: 3,
    description: "At 3 poison stacks, the target is stunned for 1 round (skips turn). Stun clears the stacks",
    children: ["a_dex6"] },

  { id: "a_silence", name: "Numbing Toxin", icon: "🤐", class: "archer", row: 3,
    description: "Poisoned targets deal 25% less damage. Poisoned casters have a 40% chance to fail their spells",
    children: ["a_dex7"] },

  // ── Row 4: Final stat nodes ───────────────────────────────────
  // Primalist stats
  { id: "a_wis2", name: "Thornveil Bond", icon: "📖", class: "archer", row: 4,
    description: "+5 Wisdom — The forest fights through you",
    children: ["a_cap_primalist"] },

  { id: "a_wis3", name: "Living Arrow", icon: "📖", class: "archer", row: 4,
    description: "+5 Wisdom — Your arrows grow leaves before they land",
    children: ["a_cap_primalist"] },

  // Sharpshooter stats
  { id: "a_dex4", name: "Lethal Precision", icon: "🏃", class: "archer", row: 4,
    description: "+5 Dexterity — You don't aim anymore. Your body just knows",
    children: ["a_cap_sharpshooter"] },

  { id: "a_dex5", name: "Storm of Steel", icon: "🏃", class: "archer", row: 4,
    description: "+5 Dexterity — The sky darkens with arrows before they even see you",
    children: ["a_cap_sharpshooter"] },

  // Hunter stats
  { id: "a_dex6", name: "Patient Predator", icon: "🏃", class: "archer", row: 4,
    description: "+5 Dexterity — Wait for the poison to work. Then strike",
    children: ["a_cap_hunter"] },

  { id: "a_dex7", name: "Toxic Mastery", icon: "🏃", class: "archer", row: 4,
    description: "+5 Dexterity — Every scratch is a death sentence on a timer",
    children: ["a_cap_hunter"] },

  // ── Row 5: Capstones ──────────────────────────────────────────
  { id: "a_cap_primalist", name: "Warden of the Wild", icon: "🌀", class: "archer", row: 5,
    description: "Enchanted arrows trigger all three elements at once. Thorn Wall now also heals all allies for 10% max HP per round. Nature damage increased by 40%.",
    children: [], isCapstone: true, title: "Primalist" },

  { id: "a_cap_sharpshooter", name: "Perfect Shot", icon: "🎯", class: "archer", row: 5,
    description: "Critical strike chance +25%. Once per combat, fire a Perfect Shot: guaranteed critical that deals 5x damage to the highest-HP enemy and cannot miss.",
    children: [], isCapstone: true, title: "Sharpshooter" },

  { id: "a_cap_hunter", name: "Master Toxicologist", icon: "☠️", class: "archer", row: 5,
    description: "Poison stacks cap increased to 5. At 5 stacks, the target takes 50% of their max HP as immediate poison damage. Poisoned enemies cannot heal.",
    children: [], isCapstone: true, title: "Venomancer" },
];

// ─── Assassin Talent Tree ────────────────────────────────────────
//
//  Row 0:                     [DEX +5]
//                           /    |    \
//  Row 1:            [DEX +5] [DEX +5] [STR +5]
//                      |        |         |
//  Row 2:         [Toxic    [Ambush]   [Dirty
//                  Blade]               Fighting]
//                    / \       / \       / \
//  Row 3:    [Venom][NumbTox][Stealth][Garrote][Bleed][Brawl]
//               |      |       |       |        |       |
//  Row 4:   [DEX+5] [DEX+5] [DEX+5] [DEX+5] [STR+5] [VIT+5]
//                \    /        \    /          \      /
//  Row 5:     [Hunter]     [Shadowmaster]   [Shadowblade]

export const ASSASSIN_TALENTS: TalentNode[] = [
  // ── Row 0: Entry ──────────────────────────────────────────────
  { id: "as_dex1", name: "Quick Reflexes", icon: "🏃", class: "assassin", row: 0,
    description: "+5 Dexterity",
    children: ["as_dex2", "as_dex3", "as_str1"] },

  // ── Row 1: Path commitment ────────────────────────────────────
  { id: "as_dex2", name: "Poison Knowledge", icon: "🏃", class: "assassin", row: 1,
    description: "+5 Dexterity — Every plant is medicine or murder, depending on the dose",
    children: ["as_toxic"] },

  { id: "as_dex3", name: "Shadow Step", icon: "🏃", class: "assassin", row: 1,
    description: "+5 Dexterity — Move between heartbeats. Strike between breaths",
    children: ["as_ambush"] },

  { id: "as_str1", name: "Killer's Grip", icon: "💪", class: "assassin", row: 1,
    description: "+5 Strength — A dagger in the right place hits harder than any sword",
    children: ["as_dirty"] },

  // ── Row 2: First themed talent ────────────────────────────────
  { id: "as_toxic", name: "Toxic Blade", icon: "☠️", class: "assassin", row: 2,
    description: "All attacks apply stacking poison: 12% attack power per round for 3 rounds. Stacks up to 3 times",
    children: ["as_venom", "as_numb", "as_stealth", "as_garrote", "as_bleed", "as_brawl"] },

  { id: "as_ambush", name: "Ambush", icon: "🗡️", class: "assassin", row: 2,
    description: "First attack each combat is a guaranteed critical strike dealing 2.5x damage. +20% dodge chance",
    children: ["as_venom", "as_numb", "as_stealth", "as_garrote", "as_bleed", "as_brawl"] },

  { id: "as_dirty", name: "Dirty Fighting", icon: "💥", class: "assassin", row: 2,
    description: "Attacks have a 20% chance to apply a bleed: 20% attack power per round for 3 rounds. +10% damage to bleeding targets",
    children: ["as_venom", "as_numb", "as_stealth", "as_garrote", "as_bleed", "as_brawl"] },

  // ── Row 3: Specialization branches ────────────────────────────
  // Hunter branches
  { id: "as_venom", name: "Concentrated Venom", icon: "🧪", class: "assassin", row: 3,
    description: "Poison damage increased by 50%. At 3 stacks, target's healing received is halved",
    children: ["as_dex4"] },

  { id: "as_numb", name: "Crippling Poison", icon: "🕸️", class: "assassin", row: 3,
    description: "Poisoned targets deal 25% less damage and have -30% initiative. At 3 stacks, target is stunned 1 round",
    children: ["as_dex5"] },

  // Shadowmaster branches
  { id: "as_stealth", name: "Vanish", icon: "👤", class: "assassin", row: 3,
    description: "Once per combat, become untargetable for 1 round. Next attack after Vanish is a guaranteed critical",
    children: ["as_dex6"] },

  { id: "as_garrote", name: "Garrote", icon: "🤐", class: "assassin", row: 3,
    description: "New ability: silence a target for 2 rounds (no spells or abilities). Deals 80% damage. CD 4",
    children: ["as_dex7"] },

  // Shadowblade branches
  { id: "as_bleed", name: "Arterial Strike", icon: "🩸", class: "assassin", row: 3,
    description: "Backstab now applies a severe bleed: 25% attack power per round for 4 rounds. Bleed damage ignores armor",
    children: ["as_str2"] },

  { id: "as_brawl", name: "Duelist's Stance", icon: "⚔️", class: "assassin", row: 3,
    description: "+20% physical defense, +15% damage when fighting the same target as last round. Can equip medium armor",
    children: ["as_vit1"] },

  // ── Row 4: Final stat nodes ───────────────────────────────────
  // Hunter stats
  { id: "as_dex4", name: "Viper's Patience", icon: "🏃", class: "assassin", row: 4,
    description: "+5 Dexterity — Let the venom do the work",
    children: ["as_cap_hunter"] },

  { id: "as_dex5", name: "Slow Death", icon: "🏃", class: "assassin", row: 4,
    description: "+5 Dexterity — They won't know they're dead until they stop moving",
    children: ["as_cap_hunter"] },

  // Shadowmaster stats
  { id: "as_dex6", name: "Ghost Walk", icon: "🏃", class: "assassin", row: 4,
    description: "+5 Dexterity — You were never here",
    children: ["as_cap_shadowmaster"] },

  { id: "as_dex7", name: "Silent Killer", icon: "🏃", class: "assassin", row: 4,
    description: "+5 Dexterity — The last thing they hear is nothing",
    children: ["as_cap_shadowmaster"] },

  // Shadowblade stats
  { id: "as_str2", name: "Savage Edge", icon: "💪", class: "assassin", row: 4,
    description: "+5 Strength — Make the wound deep enough that it never closes",
    children: ["as_cap_shadowblade"] },

  { id: "as_vit1", name: "Survivor's Grit", icon: "❤️", class: "assassin", row: 4,
    description: "+5 Vitality — You've been stabbed before. You're still here",
    children: ["as_cap_shadowblade"] },

  // ── Row 5: Capstones ──────────────────────────────────────────
  { id: "as_cap_hunter", name: "Master Toxicologist", icon: "☠️", class: "assassin", row: 5,
    description: "Poison stacks cap increased to 5. At 5 stacks, deal 50% target's max HP as instant poison damage. Poisoned targets cannot be healed.",
    children: [], isCapstone: true, title: "Venomancer" },

  { id: "as_cap_shadowmaster", name: "Death's Shadow", icon: "🌑", class: "assassin", row: 5,
    description: "Vanish cooldown removed — can Vanish every 2 rounds. Attacks from Vanish deal 3x damage. +30% dodge chance permanently.",
    children: [], isCapstone: true, title: "Shadowmaster" },

  { id: "as_cap_shadowblade", name: "Blade Tempest", icon: "🗡️", class: "assassin", row: 5,
    description: "Bleeds deal double damage. Once per combat, strike every enemy simultaneously for 100% damage — each hit applies your bleeds and poisons.",
    children: [], isCapstone: true, title: "Shadowblade" },
];

export const ALL_TALENTS: TalentNode[] = [...WARRIOR_TALENTS, ...PRIEST_TALENTS, ...WIZARD_TALENTS, ...ARCHER_TALENTS, ...ASSASSIN_TALENTS];

// ─── Helpers ────────────────────────────────────────────────────

export function getTalentsForClass(cls: AdventurerClass): TalentNode[] {
  return ALL_TALENTS.filter((t) => t.class === cls);
}

export function getTalent(id: string): TalentNode | undefined {
  return ALL_TALENTS.find((t) => t.id === id);
}

/** Get the parent(s) of a talent — nodes whose children array includes this id */
export function getParents(id: string, talents: TalentNode[]): TalentNode[] {
  return talents.filter((t) => t.children.includes(id));
}

export function getTalentPoints(level: number): number {
  return Math.floor(level / 2);
}

export function getUnspentTalentPoints(adv: Adventurer): number {
  return getTalentPoints(adv.level) - (adv.talents?.length ?? 0);
}

export function canUnlockTalent(adv: Adventurer, talentId: string): boolean {
  const def = getTalent(talentId);
  if (!def || def.class !== adv.class) return false;
  if (adv.talents?.includes(talentId)) return false;
  if (getUnspentTalentPoints(adv) <= 0) return false;
  // Root nodes (no parent points to them) are always available
  const parents = getParents(talentId, getTalentsForClass(adv.class));
  if (parents.length === 0) return true;
  // Must have at least one parent unlocked
  return parents.some((p) => adv.talents?.includes(p.id));
}

export function getEarnedTitle(adv: Adventurer): string | null {
  for (const talentId of (adv.talents ?? [])) {
    const def = getTalent(talentId);
    if (def?.isCapstone && def.title) return def.title;
  }
  return null;
}
