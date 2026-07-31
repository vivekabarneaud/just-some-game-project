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
    rarity: "common",
    description: "A stinging roadside weed that grows anywhere the ground is disturbed — and for all its sting, a powerful medicinal. Common, not precious.",
    dropRate: 0.045, // ~1 per 22 food foraged — as common as it is underfoot
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
  {
    id: "greymantle",
    name: "Greymantle",
    icon: "🌾",
    rarity: "rare",
    description:
      "A grey-leafed northern plant that thrives in cool hill country. Feldgrund herbalists use it for sleep and old grief; Nordveld matriarchs taught the same use in their old tongue. Does not grow this far south.",
    dropRate: 0, // not foraged locally — sourced via missions and trade only
  },
  {
    id: "fenbalm",
    name: "Fenbalm",
    icon: "🌿",
    rarity: "uncommon",
    description:
      "A grey-green marsh herb, bitter and cold to the touch. Edda steeps it against winter fevers and the deep-cough. It takes only in the standing water past the reeds, and withers in dry ground.",
    dropRate: 0, // marsh-only — never foraged at the hut; won from the fen via missions
  },
  {
    id: "lavender",
    name: "Lavender",
    icon: "🪻",
    rarity: "uncommon",
    description:
      "Fragrant purple blooms, cultivated in the settlement's gardens rather than foraged. Dried for soothing teas, honey-cakes, and calming draughts — and while it flowers, the bees work it hard.",
    dropRate: 0, // cultivated only — grown in a garden, never foraged at the hut
  },
  {
    id: "yarrow",
    name: "Yarrow",
    icon: "🌾",
    rarity: "common",
    description:
      "A feathery-leafed roadside weed the old folk call woundwort. Packed into a cut it staunches the bleeding and knits the skin — the first thing a working camp reaches for when a blade slips.",
    dropRate: 0.045, // as common as the ditches it grows in
  },
  {
    id: "comfrey",
    name: "Comfrey",
    icon: "🌿",
    rarity: "uncommon",
    description:
      "Broad-leafed and sticky, known to every herbwife as knitbone. Mashed into a poultice it eases a wrenched back or a bad sprain — the labourer's mercy after a hard day at the stone.",
    dropRate: 0.03,
  },
  {
    id: "feverfew",
    name: "Feverfew",
    icon: "🌼",
    rarity: "common",
    description:
      "Small white daisies with a bitter bite. Steeped hot, it breaks a fever and settles a pounding head — the cottage answer to a winter chill before it takes hold.",
    dropRate: 0.04,
  },
];

export function getHerb(id: string): HerbDefinition | undefined {
  return HERBS.find((h) => h.id === id);
}
