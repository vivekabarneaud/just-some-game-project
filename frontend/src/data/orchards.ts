import type { Season } from "./seasons";
import { growth } from "@medieval-realm/shared/data/farmingMath";

export type FruitId = "apples" | "pears" | "cherries" | "grapes";

export interface FruitDefinition {
  id: FruitId;
  name: string;
  icon: string;
  description: string;
  harvestSeasons: Season[];
  baseRate: number; // fruit per hour, PER MATURE TREE, when in season
  maturationSeasons: number; // seasons a sapling takes to bear
  image?: string;
  /** Specialty fruit — its orchard shows as a "???" mystery slot and can't be
   *  planted until the vine/sapling is brought home (a merchant or quest).
   *  Mirrors the garden specialty-seed gate. */
  specialty?: boolean;
}

export const FRUITS: FruitDefinition[] = [
  {
    id: "apples",
    name: "Apple Trees",
    icon: "🍎",
    description: "The backbone of any orchard. Reliable autumn harvest, keeps well through winter.",
    harvestSeasons: ["autumn"],
    baseRate: 5,
    maturationSeasons: 4,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/orchard_apples.png",
  },
  {
    id: "pears",
    name: "Pear Trees",
    icon: "🍐",
    description: "Elegant fruit trees. Bear fruit from late summer through autumn.",
    harvestSeasons: ["summer", "autumn"],
    baseRate: 3,
    maturationSeasons: 4,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/orchard_pears.png",
    specialty: true,
  },
  {
    id: "cherries",
    name: "Cherry Trees",
    icon: "🍒",
    description: "Beautiful blossoms in spring, precious fruit in summer. Short harvest window, but prized for sweets.",
    harvestSeasons: ["summer"],
    baseRate: 3,
    maturationSeasons: 4,
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/orchard_cherries.png",
    specialty: true,
  },
  {
    id: "grapes",
    name: "Grape Vines",
    icon: "🍇",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/farming/orchard_grapes.png",
    // Vines, not trees, but they belong with the orchard: planted once, trained
    // over years, then cropped each autumn. A specialty — the cuttings must be
    // brought home before they can be grown.
    description: "Trained vines that take years to establish, then crop richly each autumn. Pressed for wine, or dried into raisins for the winter store.",
    harvestSeasons: ["autumn"],
    baseRate: 4,
    maturationSeasons: 4,
    specialty: true,
  },
];

export function getFruit(id: FruitId): FruitDefinition {
  return FRUITS.find((f) => f.id === id)!;
}

// ─── Seeds ───────────────────────────────────────────────────────
// Saplings are planted from a fruit-seed stock (like sowing a garden), not
// bought with gold. Apple is the founders' starter; the rest are specialty and
// unlock once their seed/cutting is acquired (a market seed stall — later).

/** Season saplings can be planted — like fields, trees go in in spring. */
export const SAPLING_PLANT_SEASON: Season = "spring";

/** The founders' pack: only apple survived the road, and only a few sprouted. */
export function startingFruitSeeds(): Record<FruitId, number> {
  return { apples: 3, pears: 0, cherries: 0, grapes: 0 };
}

/** Fruits the player can plant from the start (non-specialty). */
export function startingUnlockedFruits(): FruitId[] {
  return FRUITS.filter((f) => !f.specialty).map((f) => f.id);
}

export function isFruitUnlocked(fruit: FruitDefinition, unlocked: readonly FruitId[]): boolean {
  return !fruit.specialty || unlocked.includes(fruit.id);
}

/** Seeds a bearing grove saves back each year — one per mature tree, so a grove
 *  slowly funds its own expansion (mirrors the garden harvest surplus). */
export function getOrchardSeedReturn(matureTrees: number): number {
  return matureTrees;
}

// Costs
export const ORCHARD_BASE_COST = { wood: 25, stone: 10, gold: 40 };
export const ORCHARD_COST_MULTIPLIER = 1.3;
export const ORCHARD_GOLD_PER_LEVEL = 25;
export const ORCHARD_BASE_BUILD_TIME = 5; // seconds
export const ORCHARD_BUILD_TIME_MULTIPLIER = 1.4;
export const MAX_ORCHARDS = 4;
export const ORCHARD_MAX_LEVEL = 6;
export const FRUIT_BASE_STORAGE = 50;
export const FRUIT_STORAGE_PER_LEVEL = 20;

export function getOrchardCost(level: number): { wood: number; stone: number; gold: number } {
  return {
    wood: growth(ORCHARD_BASE_COST.wood, ORCHARD_COST_MULTIPLIER, level),
    stone: growth(ORCHARD_BASE_COST.stone, ORCHARD_COST_MULTIPLIER, level),
    gold: ORCHARD_BASE_COST.gold + level * ORCHARD_GOLD_PER_LEVEL,
  };
}

export function getOrchardBuildTime(level: number): number {
  return growth(ORCHARD_BASE_BUILD_TIME, ORCHARD_BUILD_TIME_MULTIPLIER, level);
}

/** Planting capacity: how many trees/vines an orchard of this level can hold.
 *  Level 0 (unbuilt) holds none; each level adds two slots. Upgrading makes
 *  ROOM — the player still plants saplings into the new slots themselves. */
export function getOrchardTreeSlots(level: number): number {
  return level <= 0 ? 0 : level * 2;
}

/** Gold to plant one sapling/cutting. Scales with the fruit's richness. */
export function getSaplingCost(fruit: FruitDefinition): number {
  return fruit.baseRate * 3;
}

/** Fruit per hour from a single MATURE tree, in season. Total orchard yield is
 *  this times the number of mature trees. */
export function getFruitPerTreeRate(fruit: FruitDefinition): number {
  return fruit.baseRate;
}

/** Total in-season yield for an orchard with `matureTrees` bearing trees. */
export function getOrchardRate(fruit: FruitDefinition, matureTrees: number): number {
  return getFruitPerTreeRate(fruit) * matureTrees;
}

export function isOrchardActive(fruit: FruitDefinition, season: Season): boolean {
  return fruit.harvestSeasons.includes(season);
}

export function isOrchardBlossoming(fruit: FruitDefinition, season: Season): boolean {
  return season === "spring" && !fruit.harvestSeasons.includes("spring");
}

/** Card status line, driven by the tree counts. */
export function getOrchardStatus(
  fruit: FruitDefinition, season: Season, matureTrees: number, saplingsGrowing: number,
): string {
  if (matureTrees === 0 && saplingsGrowing === 0) return "No trees planted";
  if (matureTrees === 0) return `${saplingsGrowing} ${saplingsGrowing === 1 ? "sapling" : "saplings"} growing`;
  if (isOrchardBlossoming(fruit, season)) return "Blossoming";
  if (isOrchardActive(fruit, season)) return "Harvesting";
  return "Dormant";
}

export function getFruitStorageCap(orchards: { level: number }[]): number {
  const totalLevels = orchards.reduce((sum, o) => sum + o.level, 0);
  return FRUIT_BASE_STORAGE + totalLevels * FRUIT_STORAGE_PER_LEVEL;
}
