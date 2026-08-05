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

export const CORIN: NPCAlly = {
  id: "corin",
  name: "Father Corin",
  title: "The Settlement's Retired Priest",
  icon: "🕯️",
  portrait: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/father_corin.png",
  // Frail and old, never meant for a fight. Missions that field him mark him
  // passive: he comes to read what the living cannot, not to swing.
  stats: { str: 3, dex: 4, int: 9, vit: 9, wis: 14 },
  class: "priest",
  description:
    "A retired village priest who reads scripture for its mercy, between the lines. Forty years quietly fascinated by the old rites, though he has never dared practice them.",
};

export const TRUFFLE: NPCAlly = {
  id: "truffle",
  name: "Truffle",
  title: "The Fold's Own",
  icon: "🐕",
  // Quick and scrappy, not a wall: high dex to dodge, modest str for the bite,
  // vit 12 → 96 HP so he looks healthy through a drive-off. No class = a plain
  // bite, no taunt or flank, "he fights like the wolves he faces." Low threat
  // (set per-mission) peels the pack onto the team; cannotFall (per-mission)
  // means the escorts can never actually put the good boy down.
  stats: { str: 8, dex: 14, int: 2, vit: 12, wis: 6 },
  class: undefined,
  description:
    "The stray Nell named, who took the fold for his own. He fights like the wolves he faces, all teeth and speed, and will not leave the gate while there is breath in him.",
};

export const NPC_ALLIES: NPCAlly[] = [NIAMH, CORIN, TRUFFLE];

export function getNpcAlly(id: string): NPCAlly | undefined {
  return NPC_ALLIES.find((n) => n.id === id);
}
