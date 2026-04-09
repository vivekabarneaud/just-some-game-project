// ─── Combat Abilities ───────────────────────────────────────────
// Each class has 2 active abilities that auto-trigger based on combat state.
// Abilities have cooldowns and trigger conditions.

import type { AdventurerClass } from "./adventurers";
import type { CombatUnit } from "./combat";

export interface AbilityDefinition {
  id: string;
  name: string;
  icon: string;
  class: AdventurerClass;
  cooldown: number; // rounds between uses (0 = available immediately after use)
  description: string;
}

export const ABILITIES: AbilityDefinition[] = [
  // ── Warrior ───────────────────────────────────────────────────
  {
    id: "cleave",
    name: "Cleave",
    icon: "⚔️",
    class: "warrior",
    cooldown: 3,
    description: "Strike 2 enemies at once for 70% damage each.",
  },
  {
    id: "taunt",
    name: "Taunt",
    icon: "🛡️",
    class: "warrior",
    cooldown: 4,
    description: "Force all enemies to attack the warrior next round.",
  },

  // ── Wizard ────────────────────────────────────────────────────
  {
    id: "fireball",
    name: "Fireball",
    icon: "🔥",
    class: "wizard",
    cooldown: 3,
    description: "Hit all enemies for 50% magic damage.",
  },
  {
    id: "frost_bolt",
    name: "Frost Bolt",
    icon: "❄️",
    class: "wizard",
    cooldown: 2,
    description: "130% magic damage + halves target initiative for 2 rounds.",
  },

  // ── Priest ────────────────────────────────────────────────────
  {
    id: "group_heal",
    name: "Group Heal",
    icon: "💚",
    class: "priest",
    cooldown: 4,
    description: "Heal all allies for 40% of normal heal amount.",
  },
  {
    id: "smite",
    name: "Smite",
    icon: "✝️",
    class: "priest",
    cooldown: 2,
    description: "Holy damage that ignores physical defense.",
  },

  // ── Archer ────────────────────────────────────────────────────
  {
    id: "multi_shot",
    name: "Multi-Shot",
    icon: "🏹",
    class: "archer",
    cooldown: 3,
    description: "Hit 3 random enemies for 60% damage each.",
  },
  {
    id: "aimed_shot",
    name: "Aimed Shot",
    icon: "🎯",
    class: "archer",
    cooldown: 4,
    description: "Guaranteed critical hit on highest-HP enemy.",
  },

  // ── Assassin ──────────────────────────────────────────────────
  {
    id: "backstab",
    name: "Backstab",
    icon: "🗡️",
    class: "assassin",
    cooldown: 2,
    description: "200% damage to lowest HP enemy.",
  },
  {
    id: "poison",
    name: "Poison",
    icon: "☠️",
    class: "assassin",
    cooldown: 4,
    description: "Apply poison: 30% of attack power per round for 3 rounds.",
  },
];

export function getAbilitiesForClass(cls: AdventurerClass): AbilityDefinition[] {
  return ABILITIES.filter((a) => a.class === cls);
}

export function getAbility(id: string): AbilityDefinition | undefined {
  return ABILITIES.find((a) => a.id === id);
}
