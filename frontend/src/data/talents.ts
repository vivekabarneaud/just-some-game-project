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
//  Row 0:              [w_root]
//                     /   |   \
//  Row 1:         [w1]  [w2]  [w3]
//                 / \    |    / \
//  Row 2:     [w4] [w5] [w6] [w7] [w8]
//              |    |    |    |     |
//  Row 3:    [w9] [w10] [w11] [w12] [w13]
//              |         |          |
//  Row 4:  [capS]     [capW]     [capP]

export const WARRIOR_TALENTS: TalentNode[] = [
  // Row 0 — single root
  { id: "w_root", name: "Warrior's Resolve", icon: "⚔️", class: "warrior", row: 0,
    description: "The foundation of a warrior's strength",
    children: ["w1", "w2", "w3"] },

  // Row 1 — three main branches
  { id: "w1", name: "Talent 1", icon: "🗡️", class: "warrior", row: 1,
    description: "+10% crit chance",
    children: ["w4", "w5"] },
  { id: "w2", name: "Talent 2", icon: "🛡️", class: "warrior", row: 1,
    description: "+15% max HP",
    children: ["w6"] },
  { id: "w3", name: "Talent 3", icon: "✨", class: "warrior", row: 1,
    description: "Adds holy damage to attacks",
    children: ["w7", "w8"] },

  // Row 2 — branches widen
  { id: "w4", name: "Talent 4", icon: "💥", class: "warrior", row: 2,
    description: "First attack deals +50% damage",
    children: ["w9"] },
  { id: "w5", name: "Talent 5", icon: "🩸", class: "warrior", row: 2,
    description: "Attacks apply bleed damage",
    children: ["w10"] },
  { id: "w6", name: "Talent 6", icon: "🏰", class: "warrior", row: 2,
    description: "Shield Wall always triggers",
    children: ["w11"] },
  { id: "w7", name: "Talent 7", icon: "💛", class: "warrior", row: 2,
    description: "Heal 8% HP per round",
    children: ["w12"] },
  { id: "w8", name: "Talent 8", icon: "🌟", class: "warrior", row: 2,
    description: "30% chance for bonus holy strike",
    children: ["w13"] },

  // Row 3 — converging toward capstones
  { id: "w9", name: "Talent 9", icon: "🔥", class: "warrior", row: 3,
    description: "Killing blow grants +25% attack next round",
    children: ["w_cap_shadow"] },
  { id: "w10", name: "Talent 10", icon: "⚔️", class: "warrior", row: 3,
    description: "Cleave hits one additional target",
    children: ["w_cap_shadow"] },
  { id: "w11", name: "Talent 11", icon: "👑", class: "warrior", row: 3,
    description: "Allies deal +10% damage while you live",
    children: ["w_cap_warlord"] },
  { id: "w12", name: "Talent 12", icon: "🙏", class: "warrior", row: 3,
    description: "Below 50% HP, heal all allies once",
    children: ["w_cap_paladin"] },
  { id: "w13", name: "Talent 13", icon: "🛡️", class: "warrior", row: 3,
    description: "Shield Wall also heals protected ally",
    children: ["w_cap_paladin"] },

  // Row 4 — capstones
  { id: "w_cap_shadow", name: "Shadowblade", icon: "🗡️", class: "warrior", row: 4,
    description: "Master of shadow and steel",
    children: [], isCapstone: true, title: "Shadowblade" },
  { id: "w_cap_warlord", name: "Warlord", icon: "⚔️", class: "warrior", row: 4,
    description: "An unstoppable force on the battlefield",
    children: [], isCapstone: true, title: "Warlord" },
  { id: "w_cap_paladin", name: "Paladin", icon: "🛡️", class: "warrior", row: 4,
    description: "Blessed protector of the weak",
    children: [], isCapstone: true, title: "Paladin" },
];

export const ALL_TALENTS: TalentNode[] = [...WARRIOR_TALENTS];

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
