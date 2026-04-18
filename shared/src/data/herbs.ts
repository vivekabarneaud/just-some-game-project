export interface HerbDefinition {
  id: string;
  name: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  description: string;
  /** Chance per unit of food foraged (0-1). Higher = more common. */
  dropRate: number;
}

export const HERBS: HerbDefinition[] = [
  {
    id: "chamomile",
    name: "Chamomile",
    icon: "🌼",
    rarity: "common",
    description: "A gentle flower with soothing properties. The staple of any healer's kit.",
    dropRate: 0.05, // ~1 per 20 food foraged
  },
  {
    id: "mugwort",
    name: "Mugwort",
    icon: "🌿",
    rarity: "common",
    description: "A bitter herb used in tonics and elixirs. Said to sharpen the mind.",
    dropRate: 0.04, // ~1 per 25 food foraged
  },
  {
    id: "nettle",
    name: "Nettle",
    icon: "🍃",
    rarity: "uncommon",
    description: "A stinging plant with powerful medicinal properties. Handle with care.",
    dropRate: 0.025, // ~1 per 40 food foraged
  },
  {
    id: "nightbloom",
    name: "Nightbloom",
    icon: "🌺",
    rarity: "rare",
    description: "A dark flower that only blooms under moonlight. Prized by alchemists for its potent essence.",
    dropRate: 0.01, // ~1 per 100 food foraged
  },
  {
    id: "moonpetal",
    name: "Moonpetal",
    icon: "🪷",
    rarity: "legendary",
    description: "An ethereal petal that shimmers with faint Aether. Legends say it grows only where the old gods once walked.",
    dropRate: 0.003, // ~1 per 300 food foraged (gem-tier)
  },
];

export function getHerb(id: string): HerbDefinition | undefined {
  return HERBS.find((h) => h.id === id);
}
