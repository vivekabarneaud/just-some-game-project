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

export const ALL_TALENTS: TalentNode[] = [...WARRIOR_TALENTS, ...PRIEST_TALENTS];

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
