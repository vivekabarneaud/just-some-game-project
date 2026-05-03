// ─── NPC Allies ─────────────────────────────────────────────────
// NPCs that fight alongside the player in specific missions. Distinct from
// Adventurer (no levels, no equipment, no roster, no encyclopedia entry).
// Combat-only: walls / ward stones / out-of-combat companions live elsewhere.

import type { AdventurerStats, AdventurerClass } from "./adventurers.js";

/**
 * A canonical NPC ally. The character itself is neutral — mission-specific
 * mechanics (high baseline threat vs ghosts, scripted abilities, etc.) live on
 * the mission template, NOT here. Same Niamh in two missions can have wildly
 * different combat behavior.
 */
export interface NPCAlly {
  id: string;
  name: string;
  /** Single-line label shown in the mission slot ("Silvaneth Warden") */
  title: string;
  /** Emoji fallback for the locked slot when no portrait loads */
  icon: string;
  /** Optional portrait URL — placeholder until art lands */
  portrait?: string;
  /** Base stat block. Combat HP = vit × 8 (same formula as adventurers). */
  stats: AdventurerStats;
  /** Class-style archetype — drives ability handlers (priest=heals, archer=ranged, etc.).
   *  Optional: NPCs can have `kind: "passive"` instead and skip class abilities entirely. */
  class?: AdventurerClass;
  /** Flavor description shown on-hover / in chronicle entries */
  description: string;
}

export const NIAMH: NPCAlly = {
  id: "niamh",
  name: "Warden Niamh",
  title: "Silvaneth Primalist of the Thornveil Rangers",
  icon: "🌿",
  portrait: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/characters/niamh_zoomed.png",
  // Tuned to roughly the durability of a level-5 hybrid caster — enough to soak
  // a few hits while the team peels aggro, but fragile enough that ignoring her
  // ends the mission. No class set: missions decide whether she takes turns.
  stats: { str: 4, dex: 8, int: 10, vit: 15, wis: 12 },
  class: undefined,
  description:
    "A primalist of the Thornveil, trained in old binding rites. She walks softly and speaks the names that hold spirits in place.",
};

export const NPC_ALLIES: NPCAlly[] = [NIAMH];

export function getNpcAlly(id: string): NPCAlly | undefined {
  return NPC_ALLIES.find((n) => n.id === id);
}
