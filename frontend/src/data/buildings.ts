import { QUEST_DEFINITIONS, isQuestTriggered } from "./quests";

export interface BuildingCost {
  wood: number;
  stone: number;
}

export type FoodType = "grain" | "meat" | "berries" | "fish" | "fiber";

export interface BuildingLevel {
  level: number;
  cost: BuildingCost;
  buildTime: number; // seconds
  production?: { resource: string; rate: number; foodType?: FoodType };
  description: string;
}

export type SettlementTier = "camp" | "village" | "town" | "city";

/** Two flavors:
 *  - **Chapter gate** — building is hidden until a storyline chapter unlocks.
 *  - **Buildings gate** — building is hidden until every listed building exists
 *    (level ≥ 1). Used for narrative gates like "you have surplus to store
 *    once both the lumber mill and quarry are running."
 *
 *  Discriminated by which keys are present (no `type` field). StorylineId is
 *  inlined as a literal union to avoid an import cycle with quests.ts.
 *
 *  `requiresQuestTriggered` gates the building on a specific quest being
 *  *visible* to the player (its triggers satisfied). Use when the building's
 *  natural narrative is "the quest tells you to build it" but tier/chapter
 *  gating isn't precise enough — e.g. a quest that fires at TH lvl 2 while
 *  the building would otherwise unlock at a later chapter. */
export type BuildingUnlockGate =
  | {
      storyline: "settlement" | "guild" | "story" | "defense";
      chapter: number;
    }
  | { requiresBuildings: string[] }
  | { requiresQuestTriggered: string }
  | { requiresMissionDone: string };  // a unique/side-chain mission completed (e.g. Hester's "hester_rescue" → unlocks the Woodworker)

export interface BuildingDefinition {
  id: string;
  name: string;
  category: "settlement" | "gathering" | "crafting" | "guild" | "magic" | "trade";
  description: string;
  icon: string;
  image?: string; // path to building illustration
  maxLevel: number;
  levels: BuildingLevel[];
  requiredTier: SettlementTier;
  /** Per-tier level caps — if set, the building can't exceed this level until the player reaches a higher tier */
  tierLevelCaps?: Partial<Record<SettlementTier, number>>;
  /** Quest-system chapter gate. If set, building is hidden in the picker until
   *  the corresponding storyline chapter is unlocked. Independent of tier — both
   *  must be satisfied. Buildings without `unlockedAt` are available from game start
   *  (subject only to tier). */
  unlockedAt?: BuildingUnlockGate;
  /** Starting level baked into a fresh save. Anything at or below this level
   *  is treated as default state (not "the player built this"), so the
   *  "already built → always visible" escape only fires above it. Town Hall
   *  uses `defaultLevel: 1` to stay locked behind its narrative gate even
   *  though every save begins with TH at L1. */
  defaultLevel?: number;
}

export interface PlayerBuilding {
  buildingId: string;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number; // seconds remaining (game-time)
  damaged: boolean;
}

/** Repair cost: 30% of current level's build cost */
export function getRepairCost(building: BuildingDefinition, level: number): BuildingCost {
  if (level <= 0) return { wood: 0, stone: 0 };
  const levelDef = building.levels[level - 1];
  if (!levelDef) return { wood: 0, stone: 0 };
  return {
    wood: Math.floor(levelDef.cost.wood * 0.3),
    stone: Math.floor(levelDef.cost.stone * 0.3),
  };
}

// ─── Settlement tiers ────────────────────────────────────────────

export const SETTLEMENT_TIERS: { tier: SettlementTier; name: string; minTownHall: number }[] = [
  { tier: "camp", name: "Camp", minTownHall: 1 },
  { tier: "village", name: "Village", minTownHall: 3 },
  { tier: "town", name: "Town", minTownHall: 5 },
  { tier: "city", name: "City", minTownHall: 7 },
];

// Prerequisites for upgrading Town Hall to the level that triggers a tier change
// Key = the TH level that triggers the new tier
export interface TierPrerequisite {
  buildingId: string;
  minLevel: number;
  label: string;
}

// Each Houses-level prereq must be reachable under the current Town Hall
// cap (`getEffectiveMaxLevel = min(TH, maxLevel)`). To upgrade TH from
// N → N+1, the player can have at most Houses L_N. So prereqs are pegged
// at `target TH − 1`.
export const TIER_UPGRADE_PREREQUISITES: Record<number, TierPrerequisite[]> = {
  // TH lvl 3 = village: need houses lvl 2 + lumber mill lvl 1.
  // (Was woodworker; moved to the Lumber Mill so the Woodworker can be locked
  // behind Hester's arrival without a circular dependency — raw lumber + houses
  // = a village; fine carving is a later luxury Hester unlocks.)
  3: [
    { buildingId: "houses", minLevel: 2, label: "Houses Lv.2" },
    { buildingId: "lumber_mill", minLevel: 1, label: "Lumber Mill Lv.1" },
  ],
  // TH lvl 5 = town: need houses lvl 4 + tailoring shop lvl 1
  5: [
    { buildingId: "houses", minLevel: 4, label: "Houses Lv.4" },
    { buildingId: "tailoring_shop", minLevel: 1, label: "Tailoring Shop" },
  ],
  // TH lvl 7 = city: need houses lvl 6 + blacksmith lvl 1
  7: [
    { buildingId: "houses", minLevel: 6, label: "Houses Lv.6" },
    { buildingId: "blacksmith", minLevel: 1, label: "Blacksmith" },
  ],
};

export function getTierPrerequisitesMet(targetTHLevel: number, buildings: PlayerBuilding[]): { met: boolean; missing: string[] } {
  const prereqs = TIER_UPGRADE_PREREQUISITES[targetTHLevel];
  if (!prereqs) return { met: true, missing: [] };
  const missing: string[] = [];
  for (const p of prereqs) {
    const b = buildings.find((b) => b.buildingId === p.buildingId);
    if (!b || b.level < p.minLevel) missing.push(p.label);
  }
  return { met: missing.length === 0, missing };
}

export function getSettlementTier(townHallLevel: number): SettlementTier {
  if (townHallLevel >= 7) return "city";
  if (townHallLevel >= 5) return "town";
  if (townHallLevel >= 3) return "village";
  return "camp";
}

export function getSettlementName(tier: SettlementTier): string {
  return SETTLEMENT_TIERS.find((t) => t.tier === tier)!.name;
}

export function isBuildingUnlocked(building: BuildingDefinition, townHallLevel: number): boolean {
  const currentTier = getSettlementTier(townHallLevel);
  const tierOrder: SettlementTier[] = ["camp", "village", "town", "city"];
  return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(building.requiredTier);
}

/** Narrative unlock check (chapter or building-prereq gate). Independent of
 *  tier — both gates must pass for the building to be available in the picker.
 *  Name kept as `isBuildingChapterUnlocked` for back-compat with existing
 *  call sites; covers both gate flavors. */
export function isBuildingChapterUnlocked(
  building: BuildingDefinition,
  state: {
    buildings?: PlayerBuilding[];
    chapters?: Array<{ storyline: string; current: number; completedChapters: number[] }>;
  },
): boolean {
  const gate = building.unlockedAt;
  if (!gate) return true;
  if ("requiresBuildings" in gate) {
    return gate.requiresBuildings.every(
      (id) => (state.buildings?.find((b) => b.buildingId === id)?.level ?? 0) >= 1,
    );
  }
  if ("requiresQuestTriggered" in gate) {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === gate.requiresQuestTriggered);
    if (!quest) return false;
    // Quest triggers evaluate against the full GameState. The slim state
    // type passed here doesn't claim all fields, but the values isQuestTriggered
    // actually reads (chapters, questRewardsClaimed, completedStoryMissions,
    // raidsResolvedCount, buildings) are present at runtime — cast to any.
    return isQuestTriggered(quest, state as any);
  }
  if ("requiresMissionDone" in gate) {
    // completedUniqueMissionIds isn't on the slim state type but is present at
    // runtime (same cast-to-any pattern as requiresQuestTriggered above).
    const done = (state as any).completedUniqueMissionIds as string[] | undefined;
    return Array.isArray(done) && done.includes(gate.requiresMissionDone);
  }
  const cs = state.chapters?.find((c) => c.storyline === gate.storyline);
  if (!cs) return false;
  return cs.current >= gate.chapter || cs.completedChapters.includes(gate.chapter);
}

export function getUnlockRequirement(building: BuildingDefinition): string {
  const tierInfo = SETTLEMENT_TIERS.find((t) => t.tier === building.requiredTier)!;
  return `Requires ${tierInfo.name} (Town Hall ${tierInfo.minTownHall})`;
}

/** Human-readable label for a chapter unlock gate. The building-prereq
 *  flavor is split into per-building rows by `getUnlockConditions`, so this
 *  helper handles the chapter case only. */
function chapterGateLabel(gate: { storyline: string; chapter: number }): string {
  const storylineLabels: Record<string, string> = {
    settlement: "Settlement",
    guild: "Adventurer's Guild",
    story: "Story",
    defense: "Defense",
  };
  return `Locked until ${storylineLabels[gate.storyline] ?? gate.storyline} chapter ${gate.chapter}`;
}

/** Returns every unmet prerequisite for a locked building, as human-readable
 *  strings. Used by the tooltip on locked building cards so the player sees
 *  the full list of conditions, not just the most prominent one. */
export function getUnlockReasons(
  building: BuildingDefinition,
  state: { buildings: PlayerBuilding[]; chapters?: Array<{ storyline: string; current: number; completedChapters: number[] }> },
): string[] {
  return getUnlockConditions(building, state).filter((c) => !c.met).map((c) => c.label);
}

export interface UnlockCondition {
  label: string;
  met: boolean;
}

/** Returns every unlock condition for a building, met or unmet. Drives the
 *  tooltip on locked cards so the player sees a checklist (green for met,
 *  red for outstanding). */
export function getUnlockConditions(
  building: BuildingDefinition,
  state: { buildings: PlayerBuilding[]; chapters?: Array<{ storyline: string; current: number; completedChapters: number[] }> },
): UnlockCondition[] {
  const conditions: UnlockCondition[] = [];
  const thLevel = state.buildings.find((b) => b.buildingId === "town_hall")?.level ?? 0;
  // Tier — only included as a condition when it actually gates this building
  // beyond the default. Otherwise we'd list "Requires Camp (Town Hall 1)" on
  // every camp-tier building, which is noise.
  if (building.requiredTier !== "camp") {
    conditions.push({
      label: getUnlockRequirement(building),
      met: isBuildingUnlocked(building, thLevel),
    });
  }
  // Narrative gate (chapter, building prereqs, or quest-triggered). Building
  // prereqs are split into one row per required building so the tooltip
  // checklist gives a green/red tick per dependency.
  const gate = building.unlockedAt;
  if (gate) {
    if ("requiresBuildings" in gate) {
      for (const id of gate.requiresBuildings) {
        const name = BUILDINGS.find((b) => b.id === id)?.name ?? id;
        const built = (state.buildings.find((b) => b.buildingId === id)?.level ?? 0) >= 1;
        conditions.push({ label: `Build a ${name}`, met: built });
      }
    } else if ("requiresQuestTriggered" in gate) {
      const quest = QUEST_DEFINITIONS.find((q) => q.id === gate.requiresQuestTriggered);
      const questTitle = quest?.title ?? gate.requiresQuestTriggered;
      conditions.push({
        label: `Unlocked when the "${questTitle}" quest appears`,
        met: isBuildingChapterUnlocked(building, state),
      });
    } else if ("requiresMissionDone" in gate) {
      conditions.push({
        label: "Unlocked once a master woodworker joins the settlement",
        met: isBuildingChapterUnlocked(building, state),
      });
    } else {
      conditions.push({
        label: chapterGateLabel(gate),
        met: isBuildingChapterUnlocked(building, state),
      });
    }
  }
  return conditions;
}

// ─── Level generation ────────────────────────────────────────────

function generateLevels(
  base: { wood: number; stone: number },
  buildTimeBase: number,
  production?: { resource: string; baseRate: number; foodType?: FoodType },
  maxLevel: number = 20,
): BuildingLevel[] {
  return Array.from({ length: maxLevel }, (_, i) => {
    const lvl = i + 1;
    // Costs: gentle for lvl 1-2, steeper for 3+
    const costMultiplier = lvl <= 2 ? Math.pow(1.35, lvl - 1) : Math.pow(1.35, 1) * Math.pow(1.55, lvl - 2);
    // Build time starts very short and ramps up — first levels feel instant
    const timeMultiplier = Math.pow(1.6, lvl - 1);
    return {
      level: lvl,
      cost: {
        wood: Math.floor(base.wood * costMultiplier),
        stone: Math.floor(base.stone * costMultiplier),
      },
      buildTime: Math.floor(buildTimeBase * timeMultiplier),
      production: production
        ? {
            resource: production.resource,
            rate: Math.floor(production.baseRate * lvl * 1.1),
            foodType: production.foodType,
          }
        : undefined,
      description: `Level ${lvl}`,
    };
  });
}

// ─── Building definitions ────────────────────────────────────────

export const BUILDINGS: BuildingDefinition[] = [
  // Town Hall growth is NOT story-gated. It used to be locked behind a
  // settlement chapter (which repeatedly deadlocked, since later chapters
  // needed a higher TH while the TH was gated on those chapters, and it also
  // trapped players who couldn't fix housing/food until finishing pantry/
  // warehouse quests). Now growth is driven purely by cost + the tier
  // build-prerequisites (TIER_UPGRADE_PREREQUISITES): TH2 is cost-only (still
  // Camp), TH3 = Village needs Houses Lv.2 + Lumber Mill, and so on. Story
  // chapters advance on their own triggers and guide the less-obvious systems
  // rather than blocking the settlement from growing.
  {
    id: "town_hall",
    name: "Town Hall",
    category: "settlement",
    description:
      "The heart of your settlement. Upgrading the Town Hall unlocks new buildings and evolves your settlement.",
    icon: "🏛️",
    maxLevel: 25,
    levels: generateLevels({ wood: 80, stone: 80 }, 60, undefined, 25),
    requiredTier: "camp",
    defaultLevel: 1,
  },
  {
    id: "houses",
    name: "Houses",
    category: "settlement",
    description:
      "Simple dwellings for your citizens. Each level provides housing for more people, allowing your settlement to grow.",
    icon: "🏠",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/houses.png",
    maxLevel: 20,
    levels: generateLevels({ wood: 60, stone: 40 }, 6),
    requiredTier: "camp",
    unlockedAt: { storyline: "settlement", chapter: 2 },
  },
  {
    id: "warehouse",
    name: "Warehouse",
    category: "settlement",
    description:
      "A sturdy storehouse for wood and stone. Without enough storage, excess materials are lost.",
    icon: "🏚️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/warehouse.png",
    maxLevel: 20,
    levels: generateLevels({ wood: 80, stone: 60 }, 7),
    requiredTier: "camp",
    unlockedAt: { requiresBuildings: ["lumber_mill", "quarry"] },
  },
  {
    id: "pantry",
    name: "Pantry",
    category: "settlement",
    description:
      "A cool cellar and salting room to preserve food. Without a pantry, surplus food spoils quickly.",
    icon: "🥫",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/pantry.png",
    maxLevel: 20,
    levels: generateLevels({ wood: 50, stone: 30 }, 6),
    requiredTier: "camp",
    // Mirrors A Proper Pantry quest trigger: surfaces once Hunter Camp is up
    // and there's actual meat surplus to motivate a cellar.
    unlockedAt: { requiresBuildings: ["hunting_camp"] },
  },

  // Camp tier — Woodworker (wood-based equipment)
  {
    id: "woodworker",
    name: "Woodworker",
    category: "crafting",
    description:
      "A skilled carpenter crafts staves, bows, and wooden equipment. Essential gear for wizards and archers.",
    icon: "🪚",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/woodworker.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 60, stone: 20 }, 15, undefined, 10),
    requiredTier: "camp",
    tierLevelCaps: { camp: 3, village: 6, town: 8, city: 10 },
    // Locked until Hester arrives: completing her rescue (Beat 1) → she returns
    // (Beat 2) → the Woodworker (fine carving: the family's good bows/shields)
    // opens, with Jory at the bench and Hester on the Lumber Mill. See
    // docs/cast/hester-ironbark.md.
    unlockedAt: { requiresMissionDone: "hester_rescue" },
  },

  // Camp tier — Shrine (happiness + deity blessings)
  {
    id: "shrine",
    name: "Shrine",
    category: "settlement",
    description:
      "A humble altar, then a proper shrine — dedicated to the saints of the Radiant One. Each day a different saint is honored; offer something of your stores to receive their blessing. Also improves settlement happiness.",
    icon: "🔮",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/shrine.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 40, stone: 60 }, 18, undefined, 10),
    requiredTier: "camp",
    tierLevelCaps: { camp: 2, village: 5, town: 8, city: 10 },
    unlockedAt: { storyline: "settlement", chapter: 3 },
  },

  // Camp tier — production basics
  {
    id: "lumber_mill",
    name: "Lumber Mill",
    category: "gathering",
    description:
      "Woodcutters fell trees from the surrounding forest and process them into usable timber.",
    icon: "🪓",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/lumber_mill.png",
    maxLevel: 20,
    levels: generateLevels({ wood: 30, stone: 40 }, 7, { resource: "wood", baseRate: 55 }),
    requiredTier: "camp",
  },
  {
    id: "quarry",
    name: "Stone Quarry",
    category: "gathering",
    description:
      "Miners extract stone from the nearby hills. Essential for constructing advanced buildings.",
    icon: "⛏️",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/quarry.png",
    maxLevel: 20,
    levels: generateLevels({ wood: 60, stone: 10 }, 7, { resource: "stone", baseRate: 40 }),
    requiredTier: "camp",
  },
  {
    id: "hunting_camp",
    name: "Hunting Camp",
    category: "gathering",
    description:
      "Skilled hunters venture into the wilds, bringing back game, pelts, and leather. Production is reduced in autumn (75%) and winter (50%) when game is scarce.",
    icon: "🏹",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/hunting_camp.png",
    maxLevel: 15,
    levels: generateLevels({ wood: 40, stone: 10 }, 6, { resource: "food", baseRate: 14, foodType: "meat" }, 15),
    requiredTier: "camp",
    unlockedAt: { storyline: "settlement", chapter: 2 },
  },

  {
    id: "forager_hut",
    name: "Forager's Hut",
    category: "gathering",
    description:
      "Gatherers scour the forest for food, fiber, and medicinal herbs. Berries in spring and summer, mushrooms in autumn (75%), and nuts in winter (25%) — they always find something.",
    icon: "🫐",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/forager_hut.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 30, stone: 5 }, 6, { resource: "food", baseRate: 8, foodType: "berries" }, 10),
    requiredTier: "camp",
  },

  {
    id: "fishing_hut",
    name: "Fishing Hut",
    category: "gathering",
    description:
      "A small dock on the river where fishermen cast their nets. Production is reduced in autumn (75%) and winter (50%) when rivers run cold.",
    icon: "🐟",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/fishing_hut.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 35, stone: 10 }, 6, { resource: "food", baseRate: 12, foodType: "fish" }, 10),
    requiredTier: "camp",
    // No dedicated quest — surfaces once the Kitchen is up. The player has
    // just had their first cooking experience (grilled_mushrooms) and is
    // looking at the smoked_fish recipe wondering where the fish come from;
    // the locked card flipping to buildable answers the question without
    // a quest. Fishing drops to 50% in winter, so picking it up early is
    // also a strategic hedge before the cold.
    unlockedAt: { requiresBuildings: ["kitchen"] },
  },

  // Village tier — Brewery & Tavern (ale chain + happiness)
  {
    id: "brewery",
    name: "Brewery",
    category: "gathering",
    description:
      "Converts grain into ale. A vital supply for the Tavern and a happy settlement.",
    icon: "🍺",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/brewery.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 60, stone: 40 }, 20, undefined, 10),
    requiredTier: "village",
    tierLevelCaps: { village: 3, town: 7, city: 10 },
  },
  {
    id: "tavern",
    name: "Tavern",
    category: "settlement",
    description:
      "A lively gathering place for citizens and travelers. Consumes ale and greatly boosts happiness.",
    icon: "🍻",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/tavern.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 80, stone: 50 }, 22, undefined, 10),
    requiredTier: "village",
    tierLevelCaps: { village: 3, town: 7, city: 10 },
  },

  // Camp tier — Tailoring Shop (clothing crafting)
  {
    id: "tailoring_shop",
    name: "Tailoring Shop",
    category: "crafting",
    description:
      "Skilled tailors craft clothing from wool and fiber. Citizens need clothes to stay warm, especially in winter.",
    icon: "🧵",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/tailoring_shop.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 50, stone: 30 }, 18, undefined, 10),
    // Deferred to Village tier (was camp): clothing is a first-year non-problem
    // (arrivals bring their own); the camp shouldn't make clothes before food.
    // Still gates the Town tier (TH5), so it's available at Village, in time.
    requiredTier: "village",
    tierLevelCaps: { village: 5, town: 8, city: 10 },
    unlockedAt: { storyline: "settlement", chapter: 3 },
  },

  // Village tier (TH 3+)
  {
    id: "gold_mine",
    name: "Gold Mine",
    category: "gathering",
    description: "Deep shafts delve into the earth seeking precious gold veins to fund your realm.",
    icon: "💰",
    maxLevel: 20,
    levels: generateLevels({ wood: 100, stone: 80 }, 22, { resource: "gold", baseRate: 15 }),
    requiredTier: "village",
  },
  {
    id: "iron_mine",
    name: "Iron Mine",
    category: "gathering",
    description: "Miners extract iron ore from deep veins. Essential for the Blacksmith to forge tools, weapons, and armor.",
    icon: "⚒️",
    maxLevel: 15,
    levels: generateLevels({ wood: 80, stone: 100 }, 22, undefined, 15),
    requiredTier: "village",
    tierLevelCaps: { village: 4, town: 10, city: 15 },
  },
  {
    id: "blacksmith",
    name: "Blacksmith",
    category: "crafting",
    description:
      "The ring of hammer on anvil echoes through the village. The blacksmith forges tools and weapons for your people.",
    icon: "🔨",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/blacksmith.png",
    maxLevel: 15,
    levels: generateLevels({ wood: 80, stone: 60 }, 25, undefined, 15),
    requiredTier: "village",
  },
  {
    id: "leatherworking",
    name: "Leatherworking",
    category: "crafting",
    description:
      "Hides and pelts are tanned, cut, and stitched into light armor. Assassins and archers swear by leather — flexible, quiet, and tougher than it looks.",
    icon: "🪡",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/leatherworking.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 50, stone: 25 }, 15, undefined, 10),
    requiredTier: "village",
    tierLevelCaps: { camp: 0, village: 3, town: 7, city: 10 },
  },
  {
    id: "kitchen",
    name: "The Kitchens",
    category: "crafting",
    description:
      "From a simple campfire to a proper cooking complex. Prepare meals for adventurers before missions — the right food for the right adventurer can make all the difference.",
    icon: "🍳",
    maxLevel: 8,
    levels: generateLevels({ wood: 20, stone: 10 }, 12, undefined, 8),
    requiredTier: "camp",
    tierLevelCaps: { camp: 2, village: 4, town: 6, city: 8 },
    // Gated behind the Forager's Hut: matches the First Fire quest's trigger
    // (Edda has herbs to cook, so the kitchen finally has a purpose). Prevents
    // a savvy player from building the Kitchen at game start and skipping the
    // quest narrative.
    unlockedAt: { requiresBuildings: ["forager_hut"] },
  },
  {
    id: "jewelcrafter",
    name: "Jewelcrafter",
    category: "crafting",
    description:
      "A precise artisan's workshop for cutting gems and setting them into rings, amulets, and charms. Requires rare gems from deep mines and slain elementals.",
    icon: "💎",
    maxLevel: 8,
    levels: generateLevels({ wood: 40, stone: 50 }, 25, undefined, 8),
    requiredTier: "town",
    tierLevelCaps: { camp: 0, village: 0, town: 5, city: 8 },
  },
  {
    id: "marketplace",
    name: "Marketplace",
    category: "trade",
    description:
      "A bustling bazaar where travelling merchants gather. Trade your surplus resources for what you need.",
    icon: "🏪",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/marketplace.png",
    maxLevel: 10,
    levels: generateLevels({ wood: 60, stone: 40 }, 25, undefined, 10),
    requiredTier: "camp",
    tierLevelCaps: { camp: 2, village: 5, town: 8, city: 10 },
    // Gated on the Merchants Welcome quest appearing (TH lvl 2). Was
    // previously settlement Ch4, which left the quest sitting in the log
    // with nothing the player could act on for a long time.
    unlockedAt: { requiresQuestTriggered: "merchants_welcome" },
  },

  // Defense buildings (walls, watchtower, barracks, mage tower) live on the
  // Defenses page now, as multi-instance ring slots — see PlayerWall etc.
  // in gameState.tsx and the simulateRaidCombat path in raidCombat.ts.

  // Camp tier — Adventurer's Guild (missions)
  {
    id: "adventurers_guild",
    name: "Adventurer's Guild",
    category: "guild",
    description:
      "A bustling hall where brave souls gather seeking fortune. Recruit adventurers and send them on missions to bring back resources and treasure.",
    icon: "🏰",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/adventurers_guild.png",
    maxLevel: 5,
    levels: [
      { level: 1, cost: { wood: 60, stone: 40 }, buildTime: 15, description: "2 mission slots, recruit Novices" },
      { level: 2, cost: { wood: 150, stone: 120 }, buildTime: 180, description: "3 mission slots, recruit up to Apprentice" },
      { level: 3, cost: { wood: 280, stone: 220 }, buildTime: 360, description: "4 mission slots, recruit up to Journeyman" },
      { level: 4, cost: { wood: 500, stone: 400 }, buildTime: 600, description: "5 mission slots, recruit up to Veteran" },
      { level: 5, cost: { wood: 900, stone: 700 }, buildTime: 900, description: "6 mission slots, recruit up to Elite" },
    ],
    requiredTier: "camp",
    tierLevelCaps: { camp: 2, village: 3, town: 4, city: 5 },
    unlockedAt: { storyline: "guild", chapter: 1 },
  },

  // Village tier — Mason's Guild (queue + build bonuses)
  {
    id: "masons_guild",
    name: "Mason's Guild",
    category: "guild",
    description:
      "Master builders coordinate construction across the settlement. Each level unlocks an extra build queue slot and reduces building costs and times.",
    icon: "🧱",
    maxLevel: 5,
    levels: [
      { level: 1, cost: { wood: 150, stone: 200 }, buildTime: 300, description: "Queue +1, costs & time −5%" },
      { level: 2, cost: { wood: 225, stone: 300 }, buildTime: 450, description: "Queue +1, costs & time −10%" },
      { level: 3, cost: { wood: 340, stone: 450 }, buildTime: 675, description: "Queue +1, costs & time −15%" },
      { level: 4, cost: { wood: 510, stone: 675 }, buildTime: 1012, description: "Queue +1, costs & time −20%" },
      { level: 5, cost: { wood: 765, stone: 1012 }, buildTime: 1518, description: "Queue +1, costs & time −25%" },
    ],
    requiredTier: "village",
    tierLevelCaps: { village: 2, town: 4, city: 5 },
  },

  {
    id: "alchemy_lab",
    name: "Alchemy Lab",
    category: "crafting",
    description:
      "A cauldron and some herbs are all it takes to brew a basic potion. Upgrade to unlock research and rarer recipes.",
    icon: "🧪",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/alchemy_lab.png",
    maxLevel: 15,
    levels: generateLevels({ wood: 15, stone: 10 }, 45, undefined, 15),
    requiredTier: "camp",
    unlockedAt: { storyline: "settlement", chapter: 4 },
  },
  {
    id: "enchanting_shop",
    name: "Enchanting Shop",
    category: "crafting",
    description:
      "A quiet workshop of chalk sigils, etched silver, and steady candlelight, where good steel is coaxed into something more: an edge that bites with frost or fire, a ward that turns a blow. The Mage Tower keeps the walls; this keeps the work.",
    icon: "✨",
    maxLevel: 8,
    levels: generateLevels({ wood: 40, stone: 50 }, 25, undefined, 8),
    requiredTier: "town",
    tierLevelCaps: { camp: 0, village: 0, town: 5, city: 8 },
  },
];

// ─── Default tier level caps ────────────────────────────────────
// Applied to any building that doesn't specify its own tierLevelCaps.
// Town Hall is exempt (no cap) since it IS the tier driver.

export const DEFAULT_TIER_LEVEL_CAPS: Record<SettlementTier, number> = {
  camp: 3,
  village: 6,
  town: 10,
  city: 999, // effectively uncapped
};

/**
 * Effective max level for a building = Town Hall level.
 *
 * Hard cap: nothing can exceed the Town Hall. Simplifies progression pacing —
 * the TH becomes the single lever, everything else follows. The legacy
 * `tierLevelCaps` per-building field is kept in the schema for future opt-in
 * overrides (e.g. a building that caps at TH − 1), but is otherwise unused.
 */
export function getEffectiveMaxLevel(building: BuildingDefinition, townHallLevel: number): number {
  if (building.id === "town_hall") return building.maxLevel;
  return Math.min(townHallLevel, building.maxLevel);
}

/** What the player needs to do to unlock the next level of this building, or null if already at max. */
export function getNextLevelRequirement(building: BuildingDefinition, townHallLevel: number): { requiredTownHallLevel: number } | null {
  if (building.id === "town_hall") return null;
  const currentCap = getEffectiveMaxLevel(building, townHallLevel);
  if (currentCap >= building.maxLevel) return null;
  return { requiredTownHallLevel: townHallLevel + 1 };
}

// ─── Mason's Guild helpers ──────────────────────────────────────

export interface MasonBonuses {
  queueSlots: number;      // total simultaneous builds allowed
  costReduction: number;    // 0.0 – 0.25
  timeReduction: number;    // 0.0 – 0.25
}

const MASON_BONUS_PER_LEVEL = 0.05; // 5% per level

export function getMasonBonuses(masonLevel: number): MasonBonuses {
  return {
    queueSlots: 1 + masonLevel,  // base 1 + 1 per level
    costReduction: masonLevel * MASON_BONUS_PER_LEVEL,
    timeReduction: masonLevel * MASON_BONUS_PER_LEVEL,
  };
}

/** Apply Mason's Guild cost reduction */
export function applyMasonCostReduction(cost: BuildingCost, masonLevel: number): BuildingCost {
  const { costReduction } = getMasonBonuses(masonLevel);
  return {
    wood: Math.floor(cost.wood * (1 - costReduction)),
    stone: Math.floor(cost.stone * (1 - costReduction)),
  };
}

/** Apply Mason's Guild time reduction */
export function applyMasonTimeReduction(buildTime: number, masonLevel: number): number {
  const { timeReduction } = getMasonBonuses(masonLevel);
  return Math.floor(buildTime * (1 - timeReduction));
}

// ─── Game constants ──────────────────────────────────────────────

// Population capacity per Houses level
export const HOUSES_POP_PER_LEVEL = 8;

// Base population (you always have some citizens even without houses)
export const BASE_POPULATION = 5;

// Food consumed per citizen per hour
export const FOOD_PER_CITIZEN_PER_HOUR = 5;

// ─── Panic-build (soft-lock recovery) ─────────────────────────────
// New players can soft-lock by spending all their stone before they have
// either a quarry, a marketplace (no trades), or a guild (no stone-fetching
// missions). Same shape exists on the wood side for the lumber mill. The
// panic-build escape hatch lets them spend astral shards to instantly raise
// a Lv.1 building when they can't afford the regular cost.
export const PANIC_BUILD_IDS: string[] = ["lumber_mill", "quarry"];
export const PANIC_BUILD_SHARD_COST = 10;

// Material storage (wood & stone) — Warehouse
export const BASE_MATERIAL_STORAGE = 500;
export const MATERIAL_STORAGE_PER_WAREHOUSE_LEVEL = 500;

// Crafting-material storage (wool, fiber, leather, iron) — also Warehouse,
// smaller numbers since crafting materials accumulate slower and a small
// stockpile is meaningful. L0 base = 100 grace so foragers/hunters don't
// overflow before the player builds a warehouse.
export const BASE_CRAFTING_STORAGE = 100;
export const CRAFTING_STORAGE_PER_WAREHOUSE_LEVEL = 100;

/** Effective crafting-material cap given current warehouse level. Single
 *  source of truth — replaces the scattered `Math.min(200, ...)` /
 *  `Math.min(300, ...)` magic numbers. */
export function craftingMaterialCap(buildings: PlayerBuilding[]): number {
  const warehouse = buildings.find((b) => b.buildingId === "warehouse");
  return BASE_CRAFTING_STORAGE + (warehouse?.level ?? 0) * CRAFTING_STORAGE_PER_WAREHOUSE_LEVEL;
}

// Food storage — Pantry
export const BASE_FOOD_STORAGE = 300;
export const FOOD_STORAGE_PER_PANTRY_LEVEL = 300;

// Gold storage — Town Hall treasury
export const BASE_GOLD_STORAGE = 200;
export const GOLD_STORAGE_PER_TH_LEVEL = 300;

// Villager growth: 1 new villager per this many game-hours, when conditions are met
export const VILLAGER_GROWTH_INTERVAL_HOURS = 0.083; // ~1 villager every 5 min

// Gold tax income per citizen per hour
export const GOLD_TAX_PER_CITIZEN_PER_HOUR = 1;

// Winter cold
export const WINTER_WOOD_PER_CITIZEN_PER_HOUR = 0.5; // wood consumed for heating
export const WINTER_HAPPINESS_PENALTY = -10; // base happiness penalty in winter
export const WINTER_NO_WOOD_HAPPINESS = -25; // extra penalty if wood runs out
export const WINTER_NO_WOOD_DEATH_RATE = 0.3; // citizens lost per hour if freezing

// Clothing
export const CLOTHING_PER_CITIZENS = 2; // 1 clothing per 2 citizens
export const CLOTHING_DEGRADE_PER_DAY = 1; // clothing lost per game-day (24h)
export const CLOTHING_WINTER_WOOD_REDUCTION = 0.3; // 30% less wood needed per clothed citizen
export const CLOTHING_HAPPINESS_BONUS = 5; // happiness when fully clothed
export const CLOTHING_HAPPINESS_PENALTY = -5; // happiness when not enough clothes

// Ale system
export const ALE_PRODUCTION_PER_BREWERY_LEVEL = 5; // ale/hour
export const ALE_FOOD_COST_PER_BREWERY_LEVEL = 3; // food consumed/hour to make ale
export const ALE_CONSUMED_PER_TAVERN_LEVEL = 4; // ale consumed/hour
export const ALE_STORAGE_BASE = 50;
export const ALE_STORAGE_PER_BREWERY_LEVEL = 30;

// Happiness
export const SHRINE_HAPPINESS_PER_LEVEL = 3;
export const TAVERN_HAPPINESS_PER_LEVEL = 5; // when ale is available
export const TAVERN_HAPPINESS_DRY = 1; // per level when no ale

// ─── Tier-aware building images ─────────────────────────────────

const CDN = "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings";

// Map of buildingId → tier → image filename (without extension)
const BUILDING_TIER_IMAGES: Record<string, Partial<Record<SettlementTier, string>>> = {
  town_hall:        { camp: "town_hall_camp", village: "town_hall_village", town: "town_hall_town", city: "town_hall_city" },
  houses:           { camp: "houses_camp", village: "houses_village", town: "houses_town", city: "houses_city" },
  warehouse:        { camp: "warehouse_camp", village: "warehouse_village", town: "warehouse_town", city: "warehouse_city" },
  pantry:           { camp: "pantry_camp", village: "pantry_village", town: "pantry_town", city: "pantry_city" },
  shrine:           { camp: "shrine_camp", village: "shrine_village", town: "shrine_town", city: "shrine_city" },
  lumber_mill:      { camp: "lumber_mill_camp", village: "lumber_mill_village", town: "lumber_mill_town", city: "lumber_mill_city" },
  quarry:           { camp: "quarry_camp", village: "quarry_village", town: "quarry_town", city: "quarry_city" },
  hunting_camp:     { camp: "hunting_camp_camp", village: "hunting_camp_village", town: "hunting_camp_town", city: "hunting_camp_city" },
  forager_hut:      { camp: "forager_hut_camp", village: "forager_hut_village", town: "forager_hut_town", city: "forager_hut_city" },
  fishing_hut:      { camp: "fishing_hut_camp", village: "fishing_hut_village", town: "fishing_hut_town", city: "fishing_hut_city" },
  kitchen:          { camp: "kitchen_camp", village: "kitchen_village", town: "kitchen_town", city: "kitchen_city" },
  woodworker:       { camp: "woodworker_camp", village: "woodworker_village", town: "woodworker_town", city: "woodworker_city" },
  walls:            { camp: "walls_camp", village: "walls_village", town: "walls_town", city: "walls_city" },
  alchemy_lab:      { camp: "alchemy_lab_camp", village: "alchemy_lab_village", town: "alchemy_lab_town", city: "alchemy_lab_city" },
  blacksmith:       { village: "blacksmith_village", town: "blacksmith_town", city: "blacksmith_city" },
  brewery:          { village: "brewery_village", town: "brewery_town", city: "brewery_city" },
  tavern:           { village: "tavern_village", town: "tavern_town", city: "tavern_city" },
  gold_mine:        { village: "gold_mine_village", town: "gold_mine_town", city: "gold_mine_city" },
  iron_mine:        { village: "iron_mine_village", town: "iron_mine_town", city: "iron_mine_city" },
  watchtower:       { village: "watchtower_village", town: "watchtower_town", city: "watchtower_city" },
  adventurers_guild:{ camp: "adventurers_guild_camp", village: "adventurers_guild_village", town: "adventurers_guild_town", city: "adventurers_guild_city" },
  tailoring_shop:   { camp: "tailoring_camp", village: "tailoring_village", town: "tailoring_town", city: "tailoring_city" },
  leatherworking:   { village: "leatherworking_village", town: "leatherworking_town", city: "leatherworking_city" },
  marketplace:      { camp: "marketplace_camp", village: "marketplace_village", town: "marketplace_town", city: "marketplace_city" },
  masons_guild:     { village: "masons_guild_village", town: "masons_guild_town", city: "masons_guild_city" },
  barracks:         { town: "barracks_town", city: "barracks_city" },
  mage_tower:       { town: "mage_tower_town", city: "mage_tower_city" },
  jewelcrafter:     { town: "jewelcrafter_town", city: "jewelcrafter_city" },
};

const TIER_ORDER: SettlementTier[] = ["camp", "village", "town", "city"];

/** Returns the best image for a building at the given level. The visual
 *  reflects the building's own progress: a level-1 alchemy lab shows the
 *  camp look even if the settlement is already a city. Threshold mapping
 *  matches `getSettlementTier` (L≥7 city, ≥5 town, ≥3 village, else camp).
 *  Falls back to the closest lower tier, then walks up (so locked previews
 *  and buildings missing camp art still resolve), then to the default. */
export function getBuildingImage(building: BuildingDefinition, level: number): string | undefined {
  const byId = getBuildingImageById(building.id, level);
  return byId ?? building.image;
}

/** Same lookup as getBuildingImage but keyed by id only — for callers that
 *  don't have a BuildingDefinition in hand (defense rings: walls, towers,
 *  barracks, mage tower). */
export function getBuildingImageById(id: string, level: number): string | undefined {
  const tierMap = BUILDING_TIER_IMAGES[id];
  if (!tierMap) return undefined;
  const tier = getSettlementTier(level);
  const idx = TIER_ORDER.indexOf(tier);
  for (let i = idx; i >= 0; i--) {
    const file = tierMap[TIER_ORDER[i]];
    if (file) return `${CDN}/${file}.png`;
  }
  for (let i = idx + 1; i < TIER_ORDER.length; i++) {
    const file = tierMap[TIER_ORDER[i]];
    if (file) return `${CDN}/${file}.png`;
  }
  return undefined;
}
