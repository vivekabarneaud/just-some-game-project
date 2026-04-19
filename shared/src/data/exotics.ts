// ─── Exotic Goods ───────────────────────────────────────────────
// Spices and trade goods that cannot be grown locally.
// Sourced exclusively from caravan / merchant escort missions and
// player-to-player trade. Consumed by Kitchen recipes (and a couple
// of Alchemy recipes for tea).

export interface ExoticDefinition {
  id: string;
  name: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  description: string;
}

export const EXOTICS: ExoticDefinition[] = [
  {
    id: "pepper",
    name: "Pepper",
    icon: "🌶️",
    rarity: "common",
    description: "Sharp black peppercorns, the most-traded spice on the road. Wakes up any stew.",
  },
  {
    id: "cinnamon",
    name: "Cinnamon",
    icon: "🟫",
    rarity: "common",
    description: "Curls of fragrant bark from the southern trade lanes. The baker's secret.",
  },
  {
    id: "tea",
    name: "Tea Leaves",
    icon: "🍵",
    rarity: "uncommon",
    description: "Dried leaves from terraced eastern hills. Steeped for clarity, brewed into delicate dishes.",
  },
  {
    id: "chili",
    name: "Chili Peppers",
    icon: "🥵",
    rarity: "uncommon",
    description: "Dried red pods that burn going down and warm long after. A favourite of winter cooks.",
  },
  {
    id: "saffron",
    name: "Saffron",
    icon: "🌸",
    rarity: "rare",
    description: "Crimson threads worth their weight in gold. The signature of refined city cuisine.",
  },
];

export const EXOTIC_IDS = EXOTICS.map((e) => e.id);

export function getExotic(id: string): ExoticDefinition | undefined {
  return EXOTICS.find((e) => e.id === id);
}

export function isExoticId(id: string): boolean {
  return EXOTICS.some((e) => e.id === id);
}
