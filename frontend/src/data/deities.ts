import type { Season } from "./seasons";

export interface DeityDefinition {
  id: string;
  name: string;
  title: string;
  icon: string;
  description: string;
  offeringCost: { resource: string; amount: number }[];
  blessingName: string;
  blessingDescription: string;
  blessingEffect: string; // parseable effect key
}

export const DEITIES: DeityDefinition[] = [
  {
    id: "sylvana",
    name: "Sylvana",
    title: "the Green",
    icon: "🌿",
    description: "The Aether stirs with echoes of growth and renewal. Foragers return with fuller baskets. Seeds sprout faster. The land remembers its mother.",
    offeringCost: [{ resource: "food", amount: 50 }, { resource: "wool", amount: 20 }],
    blessingName: "Sylvana's Bounty",
    blessingDescription: "+25% food production",
    blessingEffect: "foodProduction:1.25",
  },
  {
    id: "solara",
    name: "Solara",
    title: "the Bright",
    icon: "☀️",
    description: "Warmth lingers longer than it should. People smile more easily. Even the cynics among your settlers feel a quiet hope they can't explain.",
    offeringCost: [{ resource: "gold", amount: 30 }, { resource: "clothing", amount: 5 }],
    blessingName: "Solara's Warmth",
    blessingDescription: "+15 happiness",
    blessingEffect: "happiness:15",
  },
  {
    id: "ferros",
    name: "Ferros",
    title: "the Smith",
    icon: "🔨",
    description: "The forge burns hotter. Metal bends easier. Your craftsmen work with a sureness they didn't have yesterday, as if guided by hands they cannot see.",
    offeringCost: [{ resource: "iron", amount: 30 }, { resource: "stone", amount: 20 }],
    blessingName: "Ferros's Forge",
    blessingDescription: "+30% crafting speed",
    blessingEffect: "craftingSpeed:0.7",
  },
  {
    id: "korrath",
    name: "Korrath",
    title: "the Shield",
    icon: "🛡️",
    description: "The air feels heavier, charged. Your walls seem taller. Your soldiers stand straighter. Something old and fierce watches over your borders.",
    offeringCost: [{ resource: "wood", amount: 20 }, { resource: "weapons", amount: 2 }],
    blessingName: "Korrath's Vigil",
    blessingDescription: "+40% defense score",
    blessingEffect: "defense:1.4",
  },
  {
    id: "lunara",
    name: "Lunara",
    title: "the Wise",
    icon: "🌙",
    description: "The night sky seems closer. Your scholars read faster. Your adventurers return with observations they can't quite explain — knowledge they didn't know they had.",
    offeringCost: [{ resource: "gold", amount: 30 }, { resource: "astralShards", amount: 3 }],
    blessingName: "Lunara's Insight",
    blessingDescription: "+30% adventurer XP",
    blessingEffect: "xpBonus:1.3",
  },
  {
    id: "nereia",
    name: "Nereia",
    title: "the Deep",
    icon: "🌊",
    description: "The rivers run fuller. Merchants arrive with better goods. Every venture seems to return a little more than expected. Fortune favours the faithful.",
    offeringCost: [{ resource: "gold", amount: 40 }],
    blessingName: "Nereia's Fortune",
    blessingDescription: "+20% mission loot",
    blessingEffect: "missionLoot:1.2",
  },
];

// Calendar: 2 deities per season, each lasts half the season (2 real days)
const SEASON_CALENDAR: Record<Season, [string, string]> = {
  spring: ["sylvana", "solara"],
  summer: ["ferros", "korrath"],
  autumn: ["lunara", "nereia"],
  winter: ["korrath", "solara"],
};

export function getCurrentDeity(season: Season, seasonProgress: number): DeityDefinition {
  const [first, second] = SEASON_CALENDAR[season];
  const deityId = seasonProgress < 0.5 ? first : second;
  return DEITIES.find((d) => d.id === deityId)!;
}

export function getSeasonDeities(season: Season): [DeityDefinition, DeityDefinition] {
  const [first, second] = SEASON_CALENDAR[season];
  return [DEITIES.find((d) => d.id === first)!, DEITIES.find((d) => d.id === second)!];
}

export function getDeity(id: string): DeityDefinition | undefined {
  return DEITIES.find((d) => d.id === id);
}
