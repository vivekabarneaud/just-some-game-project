import type { AdventurerClass } from "./adventurers";
import type { Adventurer } from "./adventurers";

// ─── Talent Tree Definitions ────────────────────────────────────
// Each node knows its children. Row index controls vertical position.
// 1 talent point per level. Trees have ~30 nodes per class.
// 3 columns per class: left (hybrid), center (pure), right (hybrid).

export interface TalentNode {
  id: string;
  name: string;
  icon: string;
  class: AdventurerClass;
  description: string;
  children: string[];
  row: number;
  isCapstone?: boolean;
  title?: string;
}

// ═══════════════════════════════════════════════════════════════════
//  WARRIOR — Paladin / Warlord / Shadowblade
// ═══════════════════════════════════════════════════════════════════

export const WARRIOR_TALENTS: TalentNode[] = [
  // Row 0: Entry
  { id: "w_str1", name: "Brute Force", icon: "💪", class: "warrior", row: 0,
    description: "+5 Strength",
    children: ["w_int1", "w_str2", "w_dex1"] },

  // Row 1: Path gate
  { id: "w_int1", name: "Inner Light", icon: "🧠", class: "warrior", row: 1,
    description: "+5 Intelligence",
    children: ["w_holy_hit", "w_wis_minor1"] },
  { id: "w_str2", name: "Raw Power", icon: "💪", class: "warrior", row: 1,
    description: "+5 Strength",
    children: ["w_battlecry", "w_vit_minor1"] },
  { id: "w_dex1", name: "Quick Hands", icon: "🏃", class: "warrior", row: 1,
    description: "+5 Dexterity",
    children: ["w_keen_edge", "w_str_minor1"] },

  // Row 2: Minor stat + path ability (sided)
  { id: "w_wis_minor1", name: "Meditation", icon: "📖", class: "warrior", row: 2,
    description: "+3 Wisdom — A quiet mind strikes true",
    children: ["w_holy_hit"] },
  { id: "w_vit_minor1", name: "Thick Skin", icon: "❤️", class: "warrior", row: 2,
    description: "+3 Vitality — Scars tell the story",
    children: ["w_battlecry"] },
  { id: "w_str_minor1", name: "Grip Strength", icon: "💪", class: "warrior", row: 2,
    description: "+3 Strength — Never lose your weapon",
    children: ["w_keen_edge"] },

  { id: "w_holy_hit", name: "Blessed Strikes", icon: "✨", class: "warrior", row: 2,
    description: "30% chance attacks deal bonus holy damage (ignores physical defense)",
    children: ["w_hot", "w_intercept"] },
  { id: "w_battlecry", name: "Battle Cry", icon: "📯", class: "warrior", row: 2,
    description: "All allies gain +15% damage for 2 rounds at combat start",
    children: ["w_plate", "w_stun"] },
  { id: "w_keen_edge", name: "Keen Edge", icon: "🗡️", class: "warrior", row: 2,
    description: "+15% critical strike chance",
    children: ["w_bleed", "w_armor_pen"] },

  // Row 3: Specialization branches (sided — 2 per path)
  { id: "w_hot", name: "Renewing Faith", icon: "💚", class: "warrior", row: 3,
    description: "Heal 8% of max HP at the start of each round",
    children: ["w_holy_aura"] },
  { id: "w_intercept", name: "Divine Intercept", icon: "🛡️", class: "warrior", row: 3,
    description: "Absorb a killing blow for an ally (once/combat). Heals them 30% max HP",
    children: ["w_holy_aura"] },
  { id: "w_plate", name: "Iron Fortress", icon: "🏰", class: "warrior", row: 3,
    description: "+25% damage reduction. Can equip plate armor",
    children: ["w_rally"] },
  { id: "w_stun", name: "Shattering Blow", icon: "💥", class: "warrior", row: 3,
    description: "25% chance on hit to stun target for 1 round",
    children: ["w_rally"] },
  { id: "w_bleed", name: "Rending Strikes", icon: "🩸", class: "warrior", row: 3,
    description: "Attacks apply bleed: 15% ATK/round for 3 rounds",
    children: ["w_exploit"] },
  { id: "w_armor_pen", name: "Find Weakness", icon: "🎯", class: "warrior", row: 3,
    description: "Attacks ignore 50% of target's physical defense",
    children: ["w_exploit"] },

  // Row 4: Bridge talents (1 per path)
  { id: "w_holy_aura", name: "Aura of Light", icon: "☀️", class: "warrior", row: 4,
    description: "Allies take 10% less damage while you live",
    children: ["w_wis1", "w_vit1"] },
  { id: "w_rally", name: "Rallying Shout", icon: "📯", class: "warrior", row: 4,
    description: "When an ally drops below 30% HP, all allies gain +10% ATK for 1 round (once/combat)",
    children: ["w_str3", "w_str4"] },
  { id: "w_exploit", name: "Twist the Blade", icon: "🔪", class: "warrior", row: 4,
    description: "Bleeding targets take 20% more damage from all sources",
    children: ["w_dex2", "w_dex3"] },

  // Row 5: Stat nodes (2 per path)
  { id: "w_wis1", name: "Wisdom of Faith", icon: "📖", class: "warrior", row: 5,
    description: "+5 Wisdom",
    children: ["w_pal_minor"] },
  { id: "w_vit1", name: "Martyr's Endurance", icon: "❤️", class: "warrior", row: 5,
    description: "+5 Vitality",
    children: ["w_pal_minor"] },
  { id: "w_str3", name: "Unyielding Might", icon: "💪", class: "warrior", row: 5,
    description: "+5 Strength",
    children: ["w_war_minor"] },
  { id: "w_str4", name: "Conqueror's Force", icon: "💪", class: "warrior", row: 5,
    description: "+5 Strength",
    children: ["w_war_minor"] },
  { id: "w_dex2", name: "Serpent's Reflexes", icon: "🏃", class: "warrior", row: 5,
    description: "+5 Dexterity",
    children: ["w_shd_minor"] },
  { id: "w_dex3", name: "Predator's Instinct", icon: "🏃", class: "warrior", row: 5,
    description: "+5 Dexterity",
    children: ["w_shd_minor"] },

  // Row 6: Pre-capstone passives
  { id: "w_pal_minor", name: "Blessed Resilience", icon: "✨", class: "warrior", row: 6,
    description: "+3 VIT, +3 WIS. Holy damage heals you for 25% of damage dealt",
    children: ["w_cap_paladin"] },
  { id: "w_war_minor", name: "Commanding Presence", icon: "👑", class: "warrior", row: 6,
    description: "+3 STR, +3 VIT. Battle Cry duration +1 round",
    children: ["w_cap_warlord"] },
  { id: "w_shd_minor", name: "Lethal Precision", icon: "🎯", class: "warrior", row: 6,
    description: "+3 DEX, +3 STR. Critical strikes apply bleed even without Rending Strikes",
    children: ["w_cap_shadow"] },

  // Row 7: Capstones
  { id: "w_cap_paladin", name: "Paladin's Oath", icon: "⚜️", class: "warrior", row: 7,
    description: "All allies +10% max HP while you live. Holy damage heals lowest-HP ally.",
    children: [], isCapstone: true, title: "Paladin" },
  { id: "w_cap_warlord", name: "Warlord's Presence", icon: "👑", class: "warrior", row: 7,
    description: "All allies +15% damage while you live. At 25% HP, full heal + immune 1 round (once/combat).",
    children: [], isCapstone: true, title: "Warlord" },
  { id: "w_cap_shadow", name: "Shadowblade Mastery", icon: "🗡️", class: "warrior", row: 7,
    description: "Crits deal 3x damage. Killing an enemy grants +30% ATK next round.",
    children: [], isCapstone: true, title: "Shadowblade" },
];

// ═══════════════════════════════════════════════════════════════════
//  PRIEST — Paladin / Archpriest / Inquisitor
// ═══════════════════════════════════════════════════════════════════

export const PRIEST_TALENTS: TalentNode[] = [
  // Row 0
  { id: "p_wis1", name: "Divine Insight", icon: "📖", class: "priest", row: 0,
    description: "+5 Wisdom",
    children: ["p_str1", "p_wis2", "p_int1"] },

  // Row 1
  { id: "p_str1", name: "Strength of Faith", icon: "💪", class: "priest", row: 1,
    description: "+5 Strength",
    children: ["p_shield", "p_vit_minor1"] },
  { id: "p_wis2", name: "Deep Devotion", icon: "📖", class: "priest", row: 1,
    description: "+5 Wisdom",
    children: ["p_greater_heal", "p_int_minor1"] },
  { id: "p_int1", name: "Burning Truth", icon: "🧠", class: "priest", row: 1,
    description: "+5 Intelligence",
    children: ["p_holy_smite", "p_wis_minor1"] },

  // Row 2
  { id: "p_vit_minor1", name: "Enduring Faith", icon: "❤️", class: "priest", row: 2,
    description: "+3 Vitality — The body endures what the spirit demands",
    children: ["p_shield"] },
  { id: "p_int_minor1", name: "Sacred Study", icon: "🧠", class: "priest", row: 2,
    description: "+3 Intelligence — Knowledge deepens the prayer",
    children: ["p_greater_heal"] },
  { id: "p_wis_minor1", name: "Righteous Focus", icon: "📖", class: "priest", row: 2,
    description: "+3 Wisdom — Judgment requires clarity",
    children: ["p_holy_smite"] },

  { id: "p_shield", name: "Shield of Faith", icon: "🛡️", class: "priest", row: 2,
    description: "Can equip shields and one-handed swords. +15% physical defense",
    children: ["p_taunt", "p_armor"] },
  { id: "p_greater_heal", name: "Greater Heal", icon: "💚", class: "priest", row: 2,
    description: "Single-target heal restores 60% of target's max HP (up from 40%)",
    children: ["p_hot", "p_group_heal"] },
  { id: "p_holy_smite", name: "Empowered Smite", icon: "⚡", class: "priest", row: 2,
    description: "Smite deals 80% more damage and hits up to 2 targets",
    children: ["p_holy_fire", "p_expose"] },

  // Row 3
  { id: "p_taunt", name: "Righteous Challenge", icon: "📯", class: "priest", row: 3,
    description: "Taunt all enemies 1 round, +20% DR while taunting",
    children: ["p_blessed_armor"] },
  { id: "p_armor", name: "Blessed Armor", icon: "🏰", class: "priest", row: 3,
    description: "Can equip plate. Holy light absorbs 25% of damage as shield",
    children: ["p_blessed_armor"] },
  { id: "p_hot", name: "Renewing Prayer", icon: "🌿", class: "priest", row: 3,
    description: "Each round, lowest-HP ally heals 12% max HP",
    children: ["p_prayer_circle"] },
  { id: "p_group_heal", name: "Circle of Light", icon: "☀️", class: "priest", row: 3,
    description: "Group Heal heals 50% (up from 40%), removes one debuff",
    children: ["p_prayer_circle"] },
  { id: "p_holy_fire", name: "Purifying Fire", icon: "🔥", class: "priest", row: 3,
    description: "AOE 70% holy damage. Undead/demons take 2x. CD 4",
    children: ["p_wrath"] },
  { id: "p_expose", name: "Expose Sin", icon: "👁️", class: "priest", row: 3,
    description: "Mark target: +25% damage from all, strip one buff, 2 rounds",
    children: ["p_wrath"] },

  // Row 4: Bridge talents
  { id: "p_blessed_armor", name: "Sanctified Body", icon: "✨", class: "priest", row: 4,
    description: "+3 STR, +3 VIT. Heals you receive are 20% more effective",
    children: ["p_str2", "p_vit1"] },
  { id: "p_prayer_circle", name: "Deepened Faith", icon: "🙏", class: "priest", row: 4,
    description: "+3 WIS, +3 INT. Healing spells have 15% chance to crit (double heal)",
    children: ["p_wis3", "p_wis4"] },
  { id: "p_wrath", name: "Holy Wrath", icon: "⚡", class: "priest", row: 4,
    description: "+3 INT, +3 WIS. Holy damage burns for 10% per round for 2 rounds",
    children: ["p_int2", "p_int3"] },

  // Row 5: Stat nodes
  { id: "p_str2", name: "Warrior's Faith", icon: "💪", class: "priest", row: 5,
    description: "+5 Strength",
    children: ["p_pal_minor"] },
  { id: "p_vit1", name: "Unbreakable Spirit", icon: "❤️", class: "priest", row: 5,
    description: "+5 Vitality",
    children: ["p_pal_minor"] },
  { id: "p_wis3", name: "Wellspring of Grace", icon: "📖", class: "priest", row: 5,
    description: "+5 Wisdom",
    children: ["p_arch_minor"] },
  { id: "p_wis4", name: "Shepherd's Wisdom", icon: "📖", class: "priest", row: 5,
    description: "+5 Wisdom",
    children: ["p_arch_minor"] },
  { id: "p_int2", name: "Sacred Fury", icon: "🧠", class: "priest", row: 5,
    description: "+5 Intelligence",
    children: ["p_inq_minor"] },
  { id: "p_int3", name: "Piercing Judgment", icon: "🧠", class: "priest", row: 5,
    description: "+5 Intelligence",
    children: ["p_inq_minor"] },

  // Row 6: Pre-capstone
  { id: "p_pal_minor", name: "Martyr's Shield", icon: "🛡️", class: "priest", row: 6,
    description: "+3 VIT, +3 STR. When you taunt, heal all allies 5% max HP",
    children: ["p_cap_paladin"] },
  { id: "p_arch_minor", name: "Grace Overflow", icon: "💚", class: "priest", row: 6,
    description: "+3 WIS, +3 VIT. Overhealing becomes a shield (up to 15% max HP)",
    children: ["p_cap_archpriest"] },
  { id: "p_inq_minor", name: "Burning Conviction", icon: "🔥", class: "priest", row: 6,
    description: "+3 INT, +3 WIS. Holy damage ignores 50% of magic resistance",
    children: ["p_cap_inquisitor"] },

  // Row 7: Capstones
  { id: "p_cap_paladin", name: "Paladin's Vow", icon: "⚜️", class: "priest", row: 7,
    description: "Allies take 20% less damage while you live. Sacrifice 50% HP to save dying ally (once/combat).",
    children: [], isCapstone: true, title: "Paladin" },
  { id: "p_cap_archpriest", name: "Miracle", icon: "✝️", class: "priest", row: 7,
    description: "Resurrect a dead ally at 50% HP (once/combat). All healing +30%.",
    children: [], isCapstone: true, title: "Archpriest" },
  { id: "p_cap_inquisitor", name: "Judgment Day", icon: "⚡", class: "priest", row: 7,
    description: "Holy ignores all resistance. Once/combat: 100% INT holy damage to all enemies.",
    children: [], isCapstone: true, title: "Inquisitor" },
];

// ═══════════════════════════════════════════════════════════════════
//  WIZARD — Primalist / Archmage / Inquisitor
// ═══════════════════════════════════════════════════════════════════

export const WIZARD_TALENTS: TalentNode[] = [
  // Row 0
  { id: "wz_int1", name: "Arcane Mind", icon: "🧠", class: "wizard", row: 0,
    description: "+5 Intelligence",
    children: ["wz_wis1", "wz_int2", "wz_wis2"] },

  // Row 1
  { id: "wz_wis1", name: "Primal Wisdom", icon: "📖", class: "wizard", row: 1,
    description: "+5 Wisdom",
    children: ["wz_elemental", "wz_dex_minor1"] },
  { id: "wz_int2", name: "Aether Mastery", icon: "🧠", class: "wizard", row: 1,
    description: "+5 Intelligence",
    children: ["wz_arcane_blast", "wz_wis_minor1"] },
  { id: "wz_wis2", name: "Sacred Knowledge", icon: "📖", class: "wizard", row: 1,
    description: "+5 Wisdom",
    children: ["wz_holy_fire", "wz_int_minor1"] },

  // Row 2
  { id: "wz_dex_minor1", name: "Wind Step", icon: "🏃", class: "wizard", row: 2,
    description: "+3 Dexterity — The elements move through you",
    children: ["wz_elemental"] },
  { id: "wz_wis_minor1", name: "Focus Crystal", icon: "💎", class: "wizard", row: 2,
    description: "+3 Wisdom — Channel the Aether, don't fight it",
    children: ["wz_arcane_blast"] },
  { id: "wz_int_minor1", name: "Scripture Study", icon: "📖", class: "wizard", row: 2,
    description: "+3 Intelligence — Holy texts burn brighter in educated hands",
    children: ["wz_holy_fire"] },

  { id: "wz_elemental", name: "Elemental Surge", icon: "🌊", class: "wizard", row: 2,
    description: "Spells cycle: frost (slow), fire (DOT), lightning (chains)",
    children: ["wz_frost", "wz_nature_heal"] },
  { id: "wz_arcane_blast", name: "Arcane Blast", icon: "💎", class: "wizard", row: 2,
    description: "+50% damage as pure Aether, ignores elemental resistances",
    children: ["wz_cdr", "wz_spell_amp"] },
  { id: "wz_holy_fire", name: "Holy Fire", icon: "🔥", class: "wizard", row: 2,
    description: "Fireball becomes Holy Fire: 2x damage to undead/demons",
    children: ["wz_purify", "wz_strip"] },

  // Row 3
  { id: "wz_frost", name: "Permafrost", icon: "❄️", class: "wizard", row: 3,
    description: "Frost Bolt reduces STR 30% for 2 rounds, slows initiative",
    children: ["wz_nature_shield"] },
  { id: "wz_nature_heal", name: "Nature's Mending", icon: "🌿", class: "wizard", row: 3,
    description: "Two lowest-HP allies heal 8% max HP/round",
    children: ["wz_nature_shield"] },
  { id: "wz_cdr", name: "Temporal Warp", icon: "⏳", class: "wizard", row: 3,
    description: "All cooldowns -1. 20% chance spells don't trigger cooldown",
    children: ["wz_overcharge"] },
  { id: "wz_spell_amp", name: "Spell Amplification", icon: "✨", class: "wizard", row: 3,
    description: "+30% spell damage. Spell crits deal 2x",
    children: ["wz_overcharge"] },
  { id: "wz_purify", name: "Purifying Flames", icon: "☀️", class: "wizard", row: 3,
    description: "AOE 60% INT holy damage, burns 1 buff each. CD 3",
    children: ["wz_divine_focus"] },
  { id: "wz_strip", name: "Denounce", icon: "👁️", class: "wizard", row: 3,
    description: "Mark: +30% damage, halve magic resistance, 3 rounds",
    children: ["wz_divine_focus"] },

  // Row 4: Bridge talents
  { id: "wz_nature_shield", name: "Bark Skin", icon: "🌳", class: "wizard", row: 4,
    description: "+3 VIT, +3 WIS. Nature magic grants a shield absorbing 10% max HP per round",
    children: ["wz_wis3", "wz_wis4"] },
  { id: "wz_overcharge", name: "Aether Overcharge", icon: "⚡", class: "wizard", row: 4,
    description: "+3 INT, +3 DEX. After casting 3 spells, next spell deals double damage",
    children: ["wz_int3", "wz_int4"] },
  { id: "wz_divine_focus", name: "Divine Focus", icon: "🔥", class: "wizard", row: 4,
    description: "+3 INT, +3 WIS. Holy fire leaves a burn: 10% INT/round for 2 rounds",
    children: ["wz_wis5", "wz_int5"] },

  // Row 5: Stat nodes
  { id: "wz_wis3", name: "Voice of the Storm", icon: "📖", class: "wizard", row: 5,
    description: "+5 Wisdom",
    children: ["wz_pri_minor"] },
  { id: "wz_wis4", name: "Heartwood Bond", icon: "📖", class: "wizard", row: 5,
    description: "+5 Wisdom",
    children: ["wz_pri_minor"] },
  { id: "wz_int3", name: "Infinite Focus", icon: "🧠", class: "wizard", row: 5,
    description: "+5 Intelligence",
    children: ["wz_arc_minor"] },
  { id: "wz_int4", name: "Aether Conduit", icon: "🧠", class: "wizard", row: 5,
    description: "+5 Intelligence",
    children: ["wz_arc_minor"] },
  { id: "wz_wis5", name: "Righteous Fury", icon: "📖", class: "wizard", row: 5,
    description: "+5 Wisdom",
    children: ["wz_inq_minor"] },
  { id: "wz_int5", name: "Truth Seeker", icon: "🧠", class: "wizard", row: 5,
    description: "+5 Intelligence",
    children: ["wz_inq_minor"] },

  // Row 6: Pre-capstone
  { id: "wz_pri_minor", name: "Primal Resonance", icon: "🌀", class: "wizard", row: 6,
    description: "+3 WIS, +3 VIT. Nature heals also cleanse one debuff",
    children: ["wz_cap_primalist"] },
  { id: "wz_arc_minor", name: "Arcane Mastery", icon: "💠", class: "wizard", row: 6,
    description: "+3 INT, +3 DEX. Spells cost no cooldown 30% of the time",
    children: ["wz_cap_archmage"] },
  { id: "wz_inq_minor", name: "Burning Conviction", icon: "🔥", class: "wizard", row: 6,
    description: "+3 INT, +3 WIS. Holy damage ignores 50% magic resistance",
    children: ["wz_cap_inquisitor"] },

  // Row 7: Capstones
  { id: "wz_cap_primalist", name: "Primal Convergence", icon: "🌀", class: "wizard", row: 7,
    description: "Each spell triggers all elements. Nature healing doubled.",
    children: [], isCapstone: true, title: "Primalist" },
  { id: "wz_cap_archmage", name: "Arcane Supremacy", icon: "💠", class: "wizard", row: 7,
    description: "All spell damage +50%. Once/combat: reset all cooldowns. Spells unresistable.",
    children: [], isCapstone: true, title: "Archmage" },
  { id: "wz_cap_inquisitor", name: "Divine Judgment", icon: "⚡", class: "wizard", row: 7,
    description: "Holy ignores all resistance. Once/combat: 150% INT holy AOE + heal all allies.",
    children: [], isCapstone: true, title: "Inquisitor" },
];

// ═══════════════════════════════════════════════════════════════════
//  ARCHER — Primalist / Sharpshooter / Venomancer
// ═══════════════════════════════════════════════════════════════════

export const ARCHER_TALENTS: TalentNode[] = [
  // Row 0
  { id: "a_dex1", name: "Steady Hand", icon: "🏃", class: "archer", row: 0,
    description: "+5 Dexterity",
    children: ["a_wis1", "a_dex2", "a_dex3"] },

  // Row 1
  { id: "a_wis1", name: "Nature's Eye", icon: "📖", class: "archer", row: 1,
    description: "+5 Wisdom",
    children: ["a_enchanted", "a_int_minor1"] },
  { id: "a_dex2", name: "Dead Eye", icon: "🏃", class: "archer", row: 1,
    description: "+5 Dexterity",
    children: ["a_precision", "a_str_minor1"] },
  { id: "a_dex3", name: "Viper's Touch", icon: "🏃", class: "archer", row: 1,
    description: "+5 Dexterity",
    children: ["a_venom", "a_dex_minor1"] },

  // Row 2
  { id: "a_int_minor1", name: "Ley Sense", icon: "🧠", class: "archer", row: 2,
    description: "+3 Intelligence — Feel the Aether in the wind",
    children: ["a_enchanted"] },
  { id: "a_str_minor1", name: "Draw Strength", icon: "💪", class: "archer", row: 2,
    description: "+3 Strength — Pull harder, hit harder",
    children: ["a_precision"] },
  { id: "a_dex_minor1", name: "Nimble Fingers", icon: "🏃", class: "archer", row: 2,
    description: "+3 Dexterity — Apply the poison mid-draw",
    children: ["a_venom"] },

  { id: "a_enchanted", name: "Enchanted Arrows", icon: "✨", class: "archer", row: 2,
    description: "Arrows cycle: frost (slow), fire (DOT), lightning (chain)",
    children: ["a_thorns", "a_cauterize"] },
  { id: "a_precision", name: "Precision Shot", icon: "🎯", class: "archer", row: 2,
    description: "+20% crit. Crits deal 2x (up from 1.5x)",
    children: ["a_crit", "a_volley"] },
  { id: "a_venom", name: "Venomous Tips", icon: "☠️", class: "archer", row: 2,
    description: "All arrows poison: 10% ATK/round, 3 rounds, stacks 3x",
    children: ["a_poison_stun", "a_silence"] },

  // Row 3
  { id: "a_thorns", name: "Thorn Wall", icon: "🌿", class: "archer", row: 3,
    description: "AOE: 15% WIS nature damage/round, 3 rounds. CD 4",
    children: ["a_nature_bond"] },
  { id: "a_cauterize", name: "Cauterizing Arrow", icon: "🔥", class: "archer", row: 3,
    description: "Fire arrows cleanse bleeds/poisons from allies, heal 10%",
    children: ["a_nature_bond"] },
  { id: "a_crit", name: "Killing Blow", icon: "💀", class: "archer", row: 3,
    description: "Crits vs targets <30% HP deal 3x. Kills grant +15% ATK",
    children: ["a_focus_fire"] },
  { id: "a_volley", name: "Arrow Storm", icon: "🏹", class: "archer", row: 3,
    description: "Multi-Shot hits ALL enemies 50%. CD resets on 3+ hits",
    children: ["a_focus_fire"] },
  { id: "a_poison_stun", name: "Paralyzing Venom", icon: "🕸️", class: "archer", row: 3,
    description: "3 poison stacks = stun 1 round (clears stacks)",
    children: ["a_toxic_mastery"] },
  { id: "a_silence", name: "Numbing Toxin", icon: "🤐", class: "archer", row: 3,
    description: "Poisoned targets -25% damage, casters 40% spell failure",
    children: ["a_toxic_mastery"] },

  // Row 4: Bridge talents
  { id: "a_nature_bond", name: "Woodland Bond", icon: "🌳", class: "archer", row: 4,
    description: "+3 WIS, +3 VIT. Thorn Wall now also heals allies 5%/round",
    children: ["a_wis2", "a_wis3"] },
  { id: "a_focus_fire", name: "Focus Fire", icon: "🎯", class: "archer", row: 4,
    description: "+3 DEX, +3 STR. Hitting the same target 3x in a row: +50% damage on 3rd hit",
    children: ["a_dex4", "a_dex5"] },
  { id: "a_toxic_mastery", name: "Improved Toxins", icon: "🧪", class: "archer", row: 4,
    description: "+3 DEX, +3 INT. Poison damage +30%, stack cap +1",
    children: ["a_dex6", "a_dex7"] },

  // Row 5: Stat nodes
  { id: "a_wis2", name: "Thornveil Bond", icon: "📖", class: "archer", row: 5,
    description: "+5 Wisdom",
    children: ["a_pri_minor"] },
  { id: "a_wis3", name: "Living Arrow", icon: "📖", class: "archer", row: 5,
    description: "+5 Wisdom",
    children: ["a_pri_minor"] },
  { id: "a_dex4", name: "Lethal Precision", icon: "🏃", class: "archer", row: 5,
    description: "+5 Dexterity",
    children: ["a_shr_minor"] },
  { id: "a_dex5", name: "Storm of Steel", icon: "🏃", class: "archer", row: 5,
    description: "+5 Dexterity",
    children: ["a_shr_minor"] },
  { id: "a_dex6", name: "Patient Predator", icon: "🏃", class: "archer", row: 5,
    description: "+5 Dexterity",
    children: ["a_ven_minor"] },
  { id: "a_dex7", name: "Toxic Expertise", icon: "🏃", class: "archer", row: 5,
    description: "+5 Dexterity",
    children: ["a_ven_minor"] },

  // Row 6: Pre-capstone
  { id: "a_pri_minor", name: "Warden's Blessing", icon: "🌿", class: "archer", row: 6,
    description: "+3 WIS, +3 DEX. Enchanted arrows also heal lowest ally 3%/hit",
    children: ["a_cap_primalist"] },
  { id: "a_shr_minor", name: "Eagle Eye", icon: "🦅", class: "archer", row: 6,
    description: "+3 DEX, +3 STR. +10% crit, guaranteed crit on first attack",
    children: ["a_cap_sharpshooter"] },
  { id: "a_ven_minor", name: "Virulent Strain", icon: "☠️", class: "archer", row: 6,
    description: "+3 DEX, +3 INT. Poison spreads to adjacent enemy on tick",
    children: ["a_cap_venomancer"] },

  // Row 7: Capstones
  { id: "a_cap_primalist", name: "Warden of the Wild", icon: "🌀", class: "archer", row: 7,
    description: "Enchanted arrows trigger all 3 elements. Thorns heal allies 10%/round. Nature +40%.",
    children: [], isCapstone: true, title: "Primalist" },
  { id: "a_cap_sharpshooter", name: "Perfect Shot", icon: "🎯", class: "archer", row: 7,
    description: "+25% crit. Once/combat: 5x guaranteed crit on highest-HP enemy.",
    children: [], isCapstone: true, title: "Sharpshooter" },
  { id: "a_cap_venomancer", name: "Master Toxicologist", icon: "☠️", class: "archer", row: 7,
    description: "5 stacks max. At 5: 50% max HP instant damage. Poisoned can't heal.",
    children: [], isCapstone: true, title: "Venomancer" },
];

// ═══════════════════════════════════════════════════════════════════
//  ASSASSIN — Venomancer / Shadowmaster / Shadowblade
// ═══════════════════════════════════════════════════════════════════

export const ASSASSIN_TALENTS: TalentNode[] = [
  // Row 0
  { id: "as_dex1", name: "Quick Reflexes", icon: "🏃", class: "assassin", row: 0,
    description: "+5 Dexterity",
    children: ["as_dex2", "as_dex3", "as_str1"] },

  // Row 1
  { id: "as_dex2", name: "Poison Knowledge", icon: "🏃", class: "assassin", row: 1,
    description: "+5 Dexterity",
    children: ["as_toxic", "as_int_minor1"] },
  { id: "as_dex3", name: "Shadow Step", icon: "🏃", class: "assassin", row: 1,
    description: "+5 Dexterity",
    children: ["as_ambush", "as_dex_minor1"] },
  { id: "as_str1", name: "Killer's Grip", icon: "💪", class: "assassin", row: 1,
    description: "+5 Strength",
    children: ["as_dirty", "as_vit_minor1"] },

  // Row 2
  { id: "as_int_minor1", name: "Alchemist's Eye", icon: "🧠", class: "assassin", row: 2,
    description: "+3 Intelligence — Know the compound, know the kill",
    children: ["as_toxic"] },
  { id: "as_dex_minor1", name: "Cat's Grace", icon: "🏃", class: "assassin", row: 2,
    description: "+3 Dexterity — Land without a sound",
    children: ["as_ambush"] },
  { id: "as_vit_minor1", name: "Pain Tolerance", icon: "❤️", class: "assassin", row: 2,
    description: "+3 Vitality — You've been stabbed before",
    children: ["as_dirty"] },

  { id: "as_toxic", name: "Toxic Blade", icon: "☠️", class: "assassin", row: 2,
    description: "All attacks poison: 12% ATK/round, 3 rounds, stacks 3x",
    children: ["as_venom", "as_numb"] },
  { id: "as_ambush", name: "Ambush", icon: "🗡️", class: "assassin", row: 2,
    description: "First attack guaranteed 2.5x crit. +20% dodge",
    children: ["as_stealth", "as_garrote"] },
  { id: "as_dirty", name: "Dirty Fighting", icon: "💥", class: "assassin", row: 2,
    description: "20% chance bleed: 20% ATK/round, 3 rounds. +10% vs bleeding",
    children: ["as_bleed", "as_brawl"] },

  // Row 3
  { id: "as_venom", name: "Concentrated Venom", icon: "🧪", class: "assassin", row: 3,
    description: "+50% poison damage. 3 stacks halves healing received",
    children: ["as_poison_master"] },
  { id: "as_numb", name: "Crippling Poison", icon: "🕸️", class: "assassin", row: 3,
    description: "Poisoned: -25% damage, -30% initiative. 3 stacks = stun",
    children: ["as_poison_master"] },
  { id: "as_stealth", name: "Vanish", icon: "👤", class: "assassin", row: 3,
    description: "Once/combat: untargetable 1 round, next attack guaranteed crit",
    children: ["as_shadow_dance"] },
  { id: "as_garrote", name: "Garrote", icon: "🤐", class: "assassin", row: 3,
    description: "Silence target 2 rounds. 80% damage. CD 4",
    children: ["as_shadow_dance"] },
  { id: "as_bleed", name: "Arterial Strike", icon: "🩸", class: "assassin", row: 3,
    description: "Backstab: severe bleed 25% ATK/round, 4 rounds, ignores armor",
    children: ["as_duelist"] },
  { id: "as_brawl", name: "Duelist's Stance", icon: "⚔️", class: "assassin", row: 3,
    description: "+20% phys def, +15% vs same target, medium armor",
    children: ["as_duelist"] },

  // Row 4: Bridge talents
  { id: "as_poison_master", name: "Lethal Dosage", icon: "💀", class: "assassin", row: 4,
    description: "+3 DEX, +3 INT. Poison ticks have 15% chance to apply extra stack",
    children: ["as_dex4", "as_dex5"] },
  { id: "as_shadow_dance", name: "Shadow Dance", icon: "🌑", class: "assassin", row: 4,
    description: "+3 DEX, +3 DEX. After killing, gain stealth for 1 round (free crit)",
    children: ["as_dex6", "as_dex7"] },
  { id: "as_duelist", name: "Riposte", icon: "⚔️", class: "assassin", row: 4,
    description: "+3 STR, +3 DEX. 25% chance to counter-attack when hit",
    children: ["as_str2", "as_vit1"] },

  // Row 5: Stat nodes
  { id: "as_dex4", name: "Viper's Patience", icon: "🏃", class: "assassin", row: 5,
    description: "+5 Dexterity",
    children: ["as_ven_minor"] },
  { id: "as_dex5", name: "Slow Death", icon: "🏃", class: "assassin", row: 5,
    description: "+5 Dexterity",
    children: ["as_ven_minor"] },
  { id: "as_dex6", name: "Ghost Walk", icon: "🏃", class: "assassin", row: 5,
    description: "+5 Dexterity",
    children: ["as_shm_minor"] },
  { id: "as_dex7", name: "Silent Killer", icon: "🏃", class: "assassin", row: 5,
    description: "+5 Dexterity",
    children: ["as_shm_minor"] },
  { id: "as_str2", name: "Savage Edge", icon: "💪", class: "assassin", row: 5,
    description: "+5 Strength",
    children: ["as_shb_minor"] },
  { id: "as_vit1", name: "Survivor's Grit", icon: "❤️", class: "assassin", row: 5,
    description: "+5 Vitality",
    children: ["as_shb_minor"] },

  // Row 6: Pre-capstone
  { id: "as_ven_minor", name: "Pandemic", icon: "☠️", class: "assassin", row: 6,
    description: "+3 DEX, +3 INT. When poisoned target dies, poison spreads to nearest enemy",
    children: ["as_cap_venomancer"] },
  { id: "as_shm_minor", name: "Death's Whisper", icon: "🌑", class: "assassin", row: 6,
    description: "+3 DEX, +3 DEX. Vanish CD -2 rounds. Attacks from stealth ignore 50% armor",
    children: ["as_cap_shadowmaster"] },
  { id: "as_shb_minor", name: "Blood Frenzy", icon: "🩸", class: "assassin", row: 6,
    description: "+3 STR, +3 DEX. Each bleed tick on target gives you +5% attack (stacks)",
    children: ["as_cap_shadowblade"] },

  // Row 7: Capstones
  { id: "as_cap_venomancer", name: "Master Toxicologist", icon: "☠️", class: "assassin", row: 7,
    description: "5 stacks max. At 5: 50% max HP burst. Poisoned can't heal.",
    children: [], isCapstone: true, title: "Venomancer" },
  { id: "as_cap_shadowmaster", name: "Death's Shadow", icon: "🌑", class: "assassin", row: 7,
    description: "Vanish every 2 rounds. Stealth attacks deal 3x. +30% dodge permanent.",
    children: [], isCapstone: true, title: "Shadowmaster" },
  { id: "as_cap_shadowblade", name: "Blade Tempest", icon: "🗡️", class: "assassin", row: 7,
    description: "Bleeds deal 2x. Once/combat: hit all enemies, apply all DOTs.",
    children: [], isCapstone: true, title: "Shadowblade" },
];

export const ALL_TALENTS: TalentNode[] = [
  ...WARRIOR_TALENTS, ...PRIEST_TALENTS, ...WIZARD_TALENTS, ...ARCHER_TALENTS, ...ASSASSIN_TALENTS,
];

// ─── Helpers ────────────────────────────────────────────────────

export function getTalentsForClass(cls: AdventurerClass): TalentNode[] {
  return ALL_TALENTS.filter((t) => t.class === cls);
}

export function getTalent(id: string): TalentNode | undefined {
  return ALL_TALENTS.find((t) => t.id === id);
}

export function getParents(id: string, talents: TalentNode[]): TalentNode[] {
  return talents.filter((t) => t.children.includes(id));
}

export function getTalentPoints(level: number): number {
  return level;
}

export function getUnspentTalentPoints(adv: Adventurer): number {
  return getTalentPoints(adv.level) - (adv.talents?.length ?? 0);
}

export function canUnlockTalent(adv: Adventurer, talentId: string): boolean {
  const def = getTalent(talentId);
  if (!def || def.class !== adv.class) return false;
  if (adv.talents?.includes(talentId)) return false;
  if (getUnspentTalentPoints(adv) <= 0) return false;
  const parents = getParents(talentId, getTalentsForClass(adv.class));
  if (parents.length === 0) return true;
  return parents.some((p) => adv.talents?.includes(p.id));
}

export function getEarnedTitle(adv: Adventurer): string | null {
  for (const talentId of (adv.talents ?? [])) {
    const def = getTalent(talentId);
    if (def?.isCapstone && def.title) return def.title;
  }
  return null;
}

export function hasTalent(adv: Adventurer, talentId: string): boolean {
  return adv.talents?.includes(talentId) ?? false;
}
