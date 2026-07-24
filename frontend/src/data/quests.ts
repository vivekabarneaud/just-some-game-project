import type { GameState } from "~/engine/gameState";
import { getItem } from "@medieval-realm/shared/data/items";
import { getTotalFood } from "~/data/foods";
import type { VeggieId } from "./gardens";

// ─── Storyline / chapter taxonomy ────────────────────────────────

export type StorylineId = "settlement" | "guild" | "story" | "defense" | "social";

export const STORYLINE_LABELS: Record<StorylineId, string> = {
  settlement: "Settlement",
  guild: "Adventurer's Guild",
  story: "The Main Story",
  defense: "Defense",
  social: "The Folk",
};

export const STORYLINE_ICONS: Record<StorylineId, string> = {
  settlement: "🏘️",
  guild: "🏰",
  story: "📖",
  defense: "🛡️",
  social: "🕯️",
};

/** Per-storyline chapter state. Drives chapter unlocks + the quest log. */
export interface ChapterState {
  storyline: StorylineId;
  /** Currently-active chapter (0 = locked, 1+ = active chapter index). */
  current: number;
  /** Chapters that have been completed (all quests in them claimed). */
  completedChapters: number[];
}

export const INITIAL_CHAPTER_STATE: ChapterState[] = [
  { storyline: "settlement", current: 1, completedChapters: [] },
  { storyline: "guild", current: 0, completedChapters: [] },
  { storyline: "story", current: 1, completedChapters: [] },
  { storyline: "defense", current: 0, completedChapters: [] },
  { storyline: "social", current: 1, completedChapters: [] },
];

// ─── Trigger system ──────────────────────────────────────────────

export type QuestTrigger =
  | { type: "game_start" }
  | { type: "chapter_unlocked"; storyline: StorylineId; chapter: number }
  | { type: "quest_completed"; questId: string }
  | { type: "building_built"; buildingId: string; level?: number }
  | { type: "story_mission_completed"; missionId: string }
  | { type: "th_level"; level: number }
  | { type: "raid_resolved" }
  | { type: "custom"; check: (state: GameState) => boolean };

// ─── Quest definition ────────────────────────────────────────────

export interface QuestReward {
  resource: "gold" | "wood" | "stone" | "wheat" | "fish" | "wool" | "astralShards";
  amount: number;
  label: string;
}

export interface QuestPrerequisite {
  /** True when this prerequisite is satisfied. */
  met: (state: GameState) => boolean;
  /** Short label shown on the locked card, e.g. "an Adventurer's Guild". */
  label: string;
}

export interface QuestDefinition {
  id: string;
  storyline: StorylineId;
  chapter: number;
  /** The storyline's pinned "main quest" — the standing goal shown at the top of
   *  its category (there should be at most one un-claimed main per storyline).
   *  Secondary quests are the steps toward it. */
  main?: boolean;
  title: string;
  narrative: string;
  /** Short vignette shown while the quest is active. Preferred over `narrative` when present. */
  startNarrative?: string;
  objective: string;
  icon: string;

  /** Activates when ANY trigger fires (OR semantics). For AND, set `requiresAll`. */
  triggers: QuestTrigger[];
  requiresAll?: boolean;

  /** Optional "shown but locked" gate. An active quest whose prerequisites are
   *  not all met is displayed (so the player sees the beat is coming) but
   *  rendered LOCKED — greyed, its requirements listed, not yet actionable.
   *  Used for the main-story opener (Scouting, visible from the start, locked
   *  until there's a guild to send scouts from). */
  prerequisites?: QuestPrerequisite[];

  /** Completion condition. */
  condition: (state: GameState) => boolean;

  rewards: QuestReward[];
  targetBuildingId?: string;
  targetPage?: string;
  image?: string;
  hint?: string;
  hintLink?: string;

  /** Chronicle entry fired into the archive when the reward is claimed. */
  chronicleEntryId?: string;
  /** Founding-cast bio fragment IDs unlocked when the reward is claimed. */
  unlocksBioFragments?: string[];
  /** Building IDs unlocked when this quest's reward is claimed. */
  unlocksBuildings?: string[];
  /** Specialty crop seed IDs unlocked when this quest's reward is claimed —
   *  makes their garden buildable/sowable and grants a starter seed stock. */
  unlocksSeeds?: VeggieId[];
  /** Narrative event banner ID fired on completion. */
  triggersEvent?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────

const bldg = (state: GameState, id: string) =>
  state.buildings.find((b) => b.buildingId === id);

const chapterCompleted = (
  state: GameState,
  storyline: StorylineId,
  chapter: number,
): boolean => {
  const cs = state.chapters?.find((c) => c.storyline === storyline);
  return cs ? cs.completedChapters.includes(chapter) : false;
};

const chapterUnlocked = (
  state: GameState,
  storyline: StorylineId,
  chapter: number,
): boolean => {
  const cs = state.chapters?.find((c) => c.storyline === storyline);
  if (!cs) return false;
  // A chapter is unlocked if the storyline's current pointer has reached it,
  // or if that chapter has been explicitly completed (defensive: should be
  // impossible to complete a chapter without unlocking it first, but guards
  // legacy save backfills).
  return cs.current >= chapter || cs.completedChapters.includes(chapter);
};

/** All of a quest's prerequisites satisfied? Quests with none are always "met". */
export function questPrerequisitesMet(quest: QuestDefinition, state: GameState): boolean {
  return (quest.prerequisites ?? []).every((p) => p.met(state));
}

/** Labels of the prerequisites NOT yet satisfied — shown on the locked card. */
export function unmetPrerequisiteLabels(quest: QuestDefinition, state: GameState): string[] {
  return (quest.prerequisites ?? []).filter((p) => !p.met(state)).map((p) => p.label);
}

export const evalTrigger = (trigger: QuestTrigger, state: GameState): boolean => {
  switch (trigger.type) {
    case "game_start":
      return true;
    case "chapter_unlocked":
      return chapterUnlocked(state, trigger.storyline, trigger.chapter);
    case "quest_completed":
      return state.questRewardsClaimed?.includes(trigger.questId) ?? false;
    case "building_built": {
      const b = bldg(state, trigger.buildingId);
      const requiredLevel = trigger.level ?? 1;
      return (b?.level ?? 0) >= requiredLevel;
    }
    case "story_mission_completed":
      return state.completedStoryMissions?.includes(trigger.missionId) ?? false;
    case "th_level":
      return (bldg(state, "town_hall")?.level ?? 0) >= trigger.level;
    case "raid_resolved":
      return (state.raidsResolvedCount ?? 0) > 0;
    case "custom":
      return trigger.check(state);
  }
};

/** Is this quest's trigger satisfied (i.e. should the player see it)? */
export function isQuestTriggered(
  quest: QuestDefinition,
  state: GameState,
): boolean {
  if (quest.triggers.length === 0) return true;
  if (quest.requiresAll) {
    return quest.triggers.every((t) => evalTrigger(t, state));
  }
  return quest.triggers.some((t) => evalTrigger(t, state));
}

/** Quest has been claimed (rewards collected). */
export function isQuestClaimed(quest: QuestDefinition, state: GameState): boolean {
  return state.questRewardsClaimed?.includes(quest.id) ?? false;
}

/** Is this quest currently active (triggered, not yet claimed)? */
export function isQuestActive(quest: QuestDefinition, state: GameState): boolean {
  return isQuestTriggered(quest, state) && !isQuestClaimed(quest, state);
}

/** Has the quest's completion condition been met (player can claim)? */
export function isQuestClaimable(
  quest: QuestDefinition,
  state: GameState,
): boolean {
  return isQuestActive(quest, state) && quest.condition(state);
}

/** All currently active quests (not yet claimed), optionally filtered by storyline. */
export function getActiveQuests(
  state: GameState,
  storyline?: StorylineId,
): QuestDefinition[] {
  return QUEST_DEFINITIONS.filter(
    (q) =>
      (!storyline || q.storyline === storyline) && isQuestActive(q, state),
  );
}

/** First active quest (back-compat for "current quest" UI patterns). */
export function getCurrentQuest(state: GameState): QuestDefinition | null {
  for (const q of QUEST_DEFINITIONS) {
    if (isQuestActive(q, state)) return q;
  }
  return null;
}

/** All quests in a specific chapter of a storyline. */
export function getQuestsInChapter(
  storyline: StorylineId,
  chapter: number,
): QuestDefinition[] {
  return QUEST_DEFINITIONS.filter(
    (q) => q.storyline === storyline && q.chapter === chapter,
  );
}

/** Are all quests in this chapter claimed? */
export function isChapterComplete(
  state: GameState,
  storyline: StorylineId,
  chapter: number,
): boolean {
  const quests = getQuestsInChapter(storyline, chapter);
  if (quests.length === 0) return false;
  return quests.every((q) => isQuestClaimed(q, state));
}

// ─── Quest data ───────────────────────────────────────────────────

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  // ╔══════════════════════════════════════════════════════════════╗
  // ║ SETTLEMENT — Chapter 1: Foundation                          ║
  // ╚══════════════════════════════════════════════════════════════╝

  {
    id: "the_first_fire",
    storyline: "settlement",
    chapter: 1,
    title: "The First Fire",
    narrative:
      "Edda has stood over the empty firepit twice this morning with her arms crossed. She has not said anything. She has looked at me three times. I know what that means.",
    objective: "Build the Kitchens, a cookfire at least.",
    icon: "🔥",
    // Fires once the Forager's Hut is up — Edda has herbs and mushrooms but
    // nowhere to cook them. That setup matches her bio fragment (she's at the
    // mortar crushing herbs the moment the fire catches), and grilled_mushrooms
    // becomes a craftable recipe the player can actually use day one.
    triggers: [{ type: "building_built", buildingId: "forager_hut" }],
    condition: (s) => (bldg(s, "kitchen")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 20, label: "Wood" },
      { resource: "stone", amount: 10, label: "Stone" },
    ],
    targetBuildingId: "kitchen",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/the_first_fire.png",
    // edda_first_fire memory deferred to the "See to Edda" social check-in.
  },
  {
    id: "settlement_base_needs",
    storyline: "settlement",
    chapter: 1,
    title: "Putting Down Roots",
    narrative:
      "Tents and a wagon are not a home. Before this camp is anything, it has to work: timber to build with, stone to build from, and, above all, food we are not chasing down every morning. Get a mill, a quarry, and a forager's hut standing, and we have a footing. Everything else grows from there.",
    objective: "Build a Lumber Mill, a Stone Quarry, and a Forager's Hut",
    icon: "🏕️",
    // Merged (2026-07) from the old three build quests (The Sawhorse / The First
    // Cut / The Forager's Path). Their founder-memory beats now live in the
    // "See to X" social check-ins, so the opener is one line, not three nagging
    // build cards, at the very start.
    triggers: [{ type: "game_start" }],
    condition: (s) =>
      (bldg(s, "lumber_mill")?.level ?? 0) >= 1 &&
      (bldg(s, "quarry")?.level ?? 0) >= 1 &&
      (bldg(s, "forager_hut")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 60, label: "Wood" },
      { resource: "stone", amount: 40, label: "Stone" },
    ],
    targetPage: "/buildings",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/the_sawhorse.png",
  },
  // NOTE: "The Growing Pile" (Warehouse) used to gate Ch1 here as the 5th
  // consecutive "build a thing" quest — cut 2026-07-09 (a storage chore doesn't
  // belong in the founding beat). It has since been RE-ADDED (2026-07) further
  // down as a reward-less, need-fired nudge (`growing_pile`) that appears only
  // when wood/stone overflow — the "near-overflow-triggered nudge" that cut
  // envisioned. It no longer gates Ch1 or the hunters.

  // ╔══════════════════════════════════════════════════════════════╗
  // ║ SETTLEMENT — Chapter 2: The Hunters                         ║
  // ║ Triggered by event_hunters_arriving (after settlement Ch.1) ║
  // ╚══════════════════════════════════════════════════════════════╝

  {
    id: "a_roof_over_their_heads",
    storyline: "settlement",
    chapter: 2,
    title: "A Roof Over Their Heads",
    narrative:
      "A family of hunters walked in from the wilds yesterday, lean and asking for shelter; no one sent them, they simply found us. The tents we have will not hold them. Edda has been saying for weeks that a settlement of six is a supper table, not a village; she will now say it with more conviction.",
    objective: "Build Houses",
    icon: "🏠",
    triggers: [{ type: "chapter_unlocked", storyline: "settlement", chapter: 2 }],
    condition: (s) => (bldg(s, "houses")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 60, label: "Wood" },
      { resource: "stone", amount: 40, label: "Stone" },
    ],
    targetBuildingId: "houses",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/houses_camp.png",
  },
  {
    id: "the_new_hunter",
    storyline: "settlement",
    chapter: 2,
    title: "The New Hunters",
    narrative:
      "A family arrived this week, hunters by trade, with two good bows between them, and they have already brought in more meat than Edda can salt. We need a hunting camp, if only to keep the smoke out of our sleeping tents.",
    objective: "Build a Hunting Camp",
    icon: "🏹",
    triggers: [{ type: "chapter_unlocked", storyline: "settlement", chapter: 2 }],
    condition: (s) => (bldg(s, "hunting_camp")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 40, label: "Wood" },
      { resource: "stone", amount: 10, label: "Stone" },
    ],
    targetBuildingId: "hunting_camp",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_4.png",
  },
  {
    id: "a_dog_without_a_home",
    storyline: "settlement",
    chapter: 2,
    title: "A Dog Without a Home",
    narrative:
      "A stray dog wandered in out of the wet and would not be shooed off. He has slept by our fire twice now and trailed Nell to the well and back, and she has named him Truffle, which rather settles whether he stays. We have not the coin to keep the idle fed, dog or man, so he had best earn his bread. Raise a kennel and we can give him a proper place, and a job of his own.",
    objective: "Build a Kennel and give the dog a job",
    icon: "🐕",
    // Fires once the first flock is bought — a guard dog earns its keep when
    // there are animals to guard, and it gives Truffle a real job (the fold).
    triggers: [{ type: "custom", check: (s) => (s.pens ?? []).some((p) => p.count > 0) }],
    // Not just built — the player must also post the dog (teaches assignment
    // without spelling out where the control is).
    condition: (s) =>
      (bldg(s, "kennel")?.level ?? 0) >= 1 &&
      s.keptAnimals.some((a) => a.species === "dog" && !a.keeper && a.job !== "idle"),
    rewards: [
      { resource: "wood", amount: 30, label: "Wood" },
      { resource: "stone", amount: 15, label: "Stone" },
    ],
    targetBuildingId: "kennel",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/kennel_camp.png",
  },
  {
    id: "stockpile_for_winter",
    storyline: "settlement",
    // Chapter 4 (terminal, non-gating): a NEED-fired nudge must never sit in a
    // chapter whose completion gates progression, or it deadlocks it (the
    // fishing-quest lesson). Only settlement ch1 & ch3 completions are gated.
    chapter: 4,
    title: "A Proper Pantry",
    narrative:
      "Edda has taken to hanging onions from a tent pole and calling it a pantry. It is not a pantry. The one in Ashwick was a stone room that smelled of root vegetables and salt; ours will be wood-floored and smell of nothing yet. Tomas says the cellar can go down four feet before we hit the water table. That will do.",
    objective: "Build a Pantry",
    icon: "🥫",
    // Need-fired nudge: appears ONLY when the larder is brimming (food near its
    // cap, about to spoil). Reward-less. It clears when the need is addressed —
    // building the pantry raises the cap, so "near cap" goes false — which reads
    // as "done" because it happens right as you build it, and it re-appears if
    // the need recurs. It never shows for a player who built a pantry before ever
    // overflowing (no need = no nudge).
    triggers: [{ type: "custom", check: (s) => getTotalFood(s.foods) >= (s.storageCaps?.food ?? Infinity) * 0.9 }],
    condition: (s) => (bldg(s, "pantry")?.level ?? 0) >= 1,
    rewards: [],
    targetBuildingId: "pantry",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/pantry.png",
    // edda_pantry memory parked — re-home to a "See to Edda" check-in round
    // (same as edda_forager_hut), so this stays a reward/ceremony-free nudge.
  },
  {
    id: "growing_pile",
    storyline: "settlement",
    chapter: 4, // terminal, non-gating (need-fired nudge — see the pantry note)
    title: "The Growing Pile",
    narrative:
      "Wood and stone are stacking up faster than we can shelter them, and what sits out in the weather is half-spoiled by the next rain. A proper warehouse would keep it dry and let us bank more against all the building still to come.",
    objective: "Build a Warehouse",
    icon: "📦",
    // Need-fired ONLY: wood or stone brimming at its cap (overflow being wasted).
    // Reward-less; clears when you build the warehouse (cap rises), re-appears if
    // it overflows again, and never shows just because a warehouse exists. This
    // is the exact revival the earlier cut left open: "a near-overflow nudge."
    triggers: [{ type: "custom", check: (s) =>
      s.resources.wood >= (s.storageCaps?.wood ?? Infinity) * 0.9 ||
      s.resources.stone >= (s.storageCaps?.stone ?? Infinity) * 0.9 }],
    condition: (s) => (bldg(s, "warehouse")?.level ?? 0) >= 1,
    rewards: [],
    targetBuildingId: "warehouse",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/warehouse.png",
  },
  {
    id: "catch_the_rain",
    storyline: "settlement",
    chapter: 4, // terminal, non-gating (need-fired nudge — see the pantry note)
    title: "A Cistern for the Dry Days",
    narrative:
      "The gardens drink more than the stream gives back, and the reserve drops a little each day. A stone cistern would bank the rain when it falls and carry us through the dry stretches, instead of watching the level fall and hoping for a cloud.",
    objective: "Build a Cistern",
    icon: "💧",
    // Need-fired ONLY: net water in DEFICIT (draws outpace inflow — the "just
    // planted and the reserve is draining" moment, matching the resource bar's
    // water/h). Reward-less; clears when the deficit is resolved (a cistern's
    // capacity + rain-catch), and never shows just because a cistern exists.
    triggers: [{ type: "custom", check: (s) => (s.netWaterPerHour ?? 0) < 0 }],
    condition: (s) => (bldg(s, "cistern")?.level ?? 0) >= 1,
    rewards: [],
    targetBuildingId: "cistern",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/cistern_camp.png",
  },
  {
    id: "eddas_garden",
    storyline: "settlement",
    chapter: 2,
    title: "Edda's Garden",
    narrative:
      "Edda has been eyeing a sunny patch behind the cook tent for a week, and Nell pockets seeds from half of what she forages. A kitchen garden would put both to use: greens we can pull through the season instead of waiting on whatever the woods decide to give us. Something to tend, too, while the scouts are away.",
    objective: "Build a garden and plant it",
    icon: "🥬",
    // Fires the moment the first scouts go out, so the camp has something to
    // do during the wait. Gated on Ch.2 as well, since that's when fields and
    // gardens unlock — the trigger can't outrun the unlock.
    triggers: [
      { type: "custom", check: (s) => s.firstMissionSent === true },
      { type: "chapter_unlocked", storyline: "settlement", chapter: 2 },
    ],
    requiresAll: true,
    condition: (s) => s.gardens.some((g) => g.level >= 1 && g.plantedYear === s.year),
    rewards: [
      { resource: "gold", amount: 20, label: "Gold" },
      { resource: "wood", amount: 20, label: "Wood" },
    ],
    targetPage: "/farming",
  },
  // NOTE: the "A Sweeter Patch" quest was pulled — it handed the strawberry seed
  // instantly after Edda's Garden, which spoiled the "???" mystery patch. The
  // strawberry unlock is being redesigned as a later, summer-firing adventurer
  // mission ("find Nell asleep in the wild strawberries"). Until that lands,
  // strawberries stay locked (their garden shows as "???"). See
  // docs/DESIGN_FARMING_EXPANSION.md §5.

  // ╔══════════════════════════════════════════════════════════════╗
  // ║ SETTLEMENT — Chapter 3: The Shepherd                        ║
  // ║ Triggered by event_shepherd_arrives (timing TBD)            ║
  // ╚══════════════════════════════════════════════════════════════╝

  {
    id: "woolly_friends",
    storyline: "settlement",
    chapter: 3,
    title: "Woolly Friends",
    narrative:
      "A shepherd arrives at your gate with a small flock, looking for pasture. No gold needed, just wood and stone to build a pen. Wool for clothing, meat for the table. These creatures earn their keep.",
    objective: "Build a Sheep Pen",
    icon: "🐑",
    // Deferred to Village tier (TH3): a shepherd + flock + wool is incoherent at
    // a 3-minute camp. Waits for both chapter 3 AND Village so it never fires early.
    triggers: [{ type: "chapter_unlocked", storyline: "settlement", chapter: 3 }, { type: "th_level", level: 3 }],
    requiresAll: true,
    condition: (s) => s.pens.some((p) => p.animal === "sheep" && p.level >= 1),
    rewards: [
      { resource: "wheat", amount: 50, label: "Wheat" },
      { resource: "wool", amount: 10, label: "Wool" },
      { resource: "wood", amount: 50, label: "Wood" },
    ],
    targetPage: "/farming#pen-sheep",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_14.png",
  },
  {
    id: "warm_and_proper",
    storyline: "settlement",
    chapter: 3,
    title: "Warm and Proper",
    narrative:
      "Your settlers shiver in patched-together rags. With wool from your sheep, a proper tailor could clothe them, and warm clothes mean happy citizens, especially when winter comes.",
    objective: "Build a Tailoring Shop",
    icon: "🧵",
    // Deferred to Village tier (TH3): first-year arrivals brought their own
    // clothes; a camp shouldn't be manufacturing clothing before it can feed
    // itself. Waits for both chapter 3 AND Village.
    triggers: [{ type: "chapter_unlocked", storyline: "settlement", chapter: 3 }, { type: "th_level", level: 3 }],
    requiresAll: true,
    condition: (s) => (bldg(s, "tailoring_shop")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 50, label: "Wood" },
      { resource: "stone", amount: 30, label: "Stone" },
    ],
    targetBuildingId: "tailoring_shop",
  },
  // NOTE: "The First Stitch" (craft clothing) was pulled — the founders arrive
  // clothed, so a "your people shiver in rags" beat lands wrong in year 1. The
  // Tailoring Shop still exists for later clothing/armor crafting; only the
  // early make-clothes-now quest was removed.

  // ╔══════════════════════════════════════════════════════════════╗
  // ║ SETTLEMENT — Chapter 4: Growing Up                          ║
  // ║ Triggered by event_outgrowing_canvas (after Ch.3 + raid?)   ║
  // ╚══════════════════════════════════════════════════════════════╝

  {
    id: "ambition_rises",
    storyline: "settlement",
    chapter: 4,
    title: "Ambition Rises",
    narrative:
      "Your camp grows restless with potential. Upgrade the Town Hall and watch your settlement transform into something greater.",
    objective: "Upgrade Town Hall to level 2",
    icon: "🏛️",
    triggers: [{ type: "chapter_unlocked", storyline: "settlement", chapter: 4 }],
    condition: (s) => (bldg(s, "town_hall")?.level ?? 0) >= 2,
    rewards: [
      { resource: "wood", amount: 108, label: "Wood" },
      { resource: "stone", amount: 108, label: "Stone" },
    ],
    targetBuildingId: "town_hall",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/settlement_camp.png",
  },
  {
    id: "merchants_welcome",
    storyline: "settlement",
    chapter: 4,
    title: "Merchants Welcome",
    narrative:
      "The Dominion trader left us a challenge on his way south: build a proper market and he'll bring a wagon next time, not a mule. \"No one unloads in the mud,\" he said. He may be right. Coin spends the same wherever it comes from.",
    objective: "Give the road-traders somewhere to unload",
    icon: "🏪",
    // After Cobb's first visit (the trader who dares us to build a market). His
    // pass now comes at Village tier, so this lands later than the old TH2 gate.
    triggers: [{ type: "custom", check: (s) => (s.merchantVisitsFired ?? []).includes("dominion_peddler_first") }],
    condition: (s) => (bldg(s, "marketplace")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 60, label: "Wood" },
      { resource: "stone", amount: 40, label: "Stone" },
    ],
    targetBuildingId: "marketplace",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/marketplace.png",
  },
  {
    id: "the_road_to_greatness",
    storyline: "settlement",
    chapter: 4,
    main: true,
    title: "The Road to Greatness",
    narrative:
      "We came to this valley with a wagon and a hope, and hope alone does not weather a winter. What we raise here, we raise to last: a village worth the name first, then a town, then a place travellers speak of by name at far-off fires. This is the whole of it, the reason behind every roof and furrow and late night at the wall. One step at a time, and we get there.",
    objective: "Grow into a village (raise the Town Hall to level 3)",
    icon: "⭐",
    // The standing goal — no gates. It's pinned as the settlement's main quest
    // and shown from the start (empty triggers = always active), so the player
    // always has a direction; it simply completes when the village is reached.
    triggers: [],
    condition: (s) => (bldg(s, "town_hall")?.level ?? 0) >= 3,
    rewards: [
      { resource: "wood", amount: 167, label: "Wood" },
      { resource: "stone", amount: 167, label: "Stone" },
      { resource: "astralShards", amount: 5, label: "Astral Shards" },
    ],
    targetBuildingId: "town_hall",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/settlement_village.png",
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║ ADVENTURER'S GUILD — Chapter 1: First Heroes                ║
  // ║ Triggered by event_hunters_volunteer (after settlement Ch.2)║
  // ╚══════════════════════════════════════════════════════════════╝

  {
    id: "heroes_wanted",
    storyline: "guild",
    chapter: 1,
    main: true,
    title: "Heroes Wanted",
    narrative:
      "A family of hunters walked in from the wilds and stayed: two good bows and a big quiet one who carries half the camp without being asked.\n\nThey have been pacing the edge of the camp like dogs that need walking, and there will be more drifting in after them. A proper guild hall would give them somewhere to gather, and us a way to ask what they can do and send them out to do it.",
    objective: "Build the Adventurer's Guild",
    icon: "🏰",
    triggers: [{ type: "chapter_unlocked", storyline: "guild", chapter: 1 }],
    condition: (s) => (bldg(s, "adventurers_guild")?.level ?? 0) >= 1,
    targetBuildingId: "adventurers_guild",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_10.png",
    rewards: [
      { resource: "gold", amount: 40, label: "Gold" },
      { resource: "astralShards", amount: 5, label: "Astral Shards" },
      { resource: "stone", amount: 25, label: "Stone" },
    ],
  },
  // "Into the Unknown" (send your first mission) removed 2026-07 — the Main Story
  // panel's Scouting beat now drives the first scouting mission, so this guild
  // breadcrumb was pure duplication.
  {
    id: "investigate_old_watch",
    storyline: "guild",
    chapter: 1,
    main: true,
    title: "The Old Watch",
    narrative:
      "The scouts came back with a map and a knot in their story: an old watchtower to the south, stone that has outlived whoever raised it. Worth walking its halls, if the place is as empty as it looks. Send a team, and send someone who can hold a line, just in case it is not.",
    objective: "Send a team to investigate the Old Watch",
    icon: "🏚️",
    // Pure guide breadcrumb for the Old Watch (story_2). DEFERRED to Chapter 2
    // along with that mission (see storyMissions.ts CH2_GATE): triggers on the
    // ch2_gate sentinel, which never completes in the current build, so it stays
    // dormant instead of dangling as an uncompletable Chapter-1 quest.
    triggers: [{ type: "story_mission_completed", missionId: "ch2_gate" }],
    condition: (s) => (s.completedStoryMissions ?? []).includes("story_2_ruins"),
    rewards: [],
    targetPage: "/guild",
  },
  {
    id: "count_the_days",
    storyline: "guild",
    chapter: 1,
    main: true,
    title: "Past the Ruins",
    narrative:
      "The old watch is behind us, and the story it told is not finished. The team came back saying the trees go wrong a few days further south than they walked, and that they felt it before they saw it. I need to know how far, and what walks there. So I am sending them south again, past the ruins, to count the days honestly this time, and I will send someone with them who can deal with what does not bleed.",
    objective: "Send a team past the ruins to count the days",
    icon: "🌑",
    // Pure guide quest — no reward, just a breadcrumb so the quest log points at
    // the story_3 mission during the lull after the Old Watch. Mirrors
    // investigate_old_watch (which pointed at story_2).
    triggers: [{ type: "story_mission_completed", missionId: "story_2_ruins" }],
    condition: (s) => (s.completedStoryMissions ?? []).includes("story_3_dark_treeline"),
    rewards: [],
    targetPage: "/guild",
  },
  {
    id: "good_fishing_water",
    storyline: "settlement",
    // Chapter 4 (terminal), NOT 1 — deliberately. This quest can't fire until
    // AFTER Scouting (which needs the guild, which comes after the Thornwoods),
    // and `isChapterComplete` counts every quest in a chapter (even untriggered
    // ones) + claiming auto-advances. Parking it in ch1 made ch1 permanently
    // incompletable → the hunters, gated on ch1-done, never arrived. Only ch1 &
    // ch3 completions are gated by events, and ch4 is terminal, so a late nudge
    // here blocks no progression. (The Fishing Hut unlock keys off this quest
    // being *triggered*, not claimed, so the chapter is irrelevant to that.)
    chapter: 4,
    title: "A Bend in the River",
    narrative:
      "The scouts marked a slow bend where the river pools deep and the fish all but crowd the shallows. A dock and a few nets there, and we would not go hungry through the cold, when the game thins and the ground gives nothing. Worth the wood.",
    objective: "Build a Fishing Hut",
    icon: "🐟",
    // Fires off the first scouting run (the river-bend find) and gates the
    // Fishing Hut, so the hut surfaces as a consequence of the discovery rather
    // than of the Kitchen going up.
    triggers: [{ type: "story_mission_completed", missionId: "story_1_scouting" }],
    condition: (s) => (bldg(s, "fishing_hut")?.level ?? 0) >= 1,
    rewards: [{ resource: "fish", amount: 20, label: "Fish" }],
    targetBuildingId: "fishing_hut",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/fishing_hut.png",
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║ THE MAIN STORY — the narrative spine (its own panel)         ║
  // ║ Beat 1: Scouting (below). Beat 2: "Hold the Treeline" (the    ║
  // ║ wolf defense) lives further down, tagged storyline "story".   ║
  // ║ Later beats (the Old Watch, Past the Ruins) still live under  ║
  // ║ "guild" for now and move here when their chapter is authored. ║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    id: "spine_scouting",
    storyline: "story",
    chapter: 1,
    main: true,
    title: "Scouting the Surroundings",
    narrative:
      "We came here half-blind, on a clerk's map that never felt this ground. The camp has its first roofs up now, and before we push out any further I want to know what is truly around us: water, game, stone, and whatever is out there that would rather we had not come. The moment the guild can spare a team, we send them.",
    objective: "Send scouts to map the surroundings",
    icon: "🗺️",
    // The spine's opener. Visible from the very start so the player always sees
    // where the story begins, but LOCKED until there is a guild to send scouts
    // from (which itself opens once the Thornwoods arrive).
    triggers: [{ type: "game_start" }],
    prerequisites: [
      { met: (s) => (bldg(s, "adventurers_guild")?.level ?? 0) >= 1, label: "an Adventurer's Guild" },
    ],
    condition: (s) => (s.completedStoryMissions ?? []).includes("story_1_scouting"),
    rewards: [],
    targetPage: "/guild",
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║ ADVENTURER'S GUILD — Chapter 2: Wolves on the Ridge         ║
  // ║ Triggered by event_three_reports (after story_1_scouting)   ║
  // ╚══════════════════════════════════════════════════════════════╝

  {
    id: "tools_of_the_trade",
    storyline: "guild",
    chapter: 2,
    title: "Tools of the Trade",
    narrative:
      "With Hester taking the lumber mill, Jory can finally put down the felling axe and pick up the work he keeps muttering about. Give him a proper bench and good wood, and he'll turn out bows for the archers, staves for the casters, shields for the rest.",
    objective: "Build a Woodworker",
    icon: "🪚",
    // Gated on the same condition the Woodworker building reads — Hester
    // (char_019) actually joining (Beat 2b of the Woodcutter chain) — so the
    // quest can't ask the player to build something still locked, and its
    // "With Hester taking the lumber mill" narrative is true when it appears.
    triggers: [
      { type: "chapter_unlocked", storyline: "guild", chapter: 2 },
      { type: "custom", check: (s) => s.adventurers.some((a) => a.premadeId === "char_019" && a.alive !== false) },
    ],
    requiresAll: true,
    condition: (s) => (bldg(s, "woodworker")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 60, label: "Wood" },
      { resource: "stone", amount: 20, label: "Stone" },
    ],
    targetBuildingId: "woodworker",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/woodworker.png",
  },
  {
    id: "arm_the_brave",
    storyline: "guild",
    chapter: 2,
    title: "Arm the Brave",
    narrative:
      "Your adventurers eye the new workshop with interest. A proper weapon could mean the difference between victory and a shallow grave. Craft something worthy of a hero.",
    objective: "Craft a weapon at the Woodworker",
    icon: "🪄",
    triggers: [{ type: "quest_completed", questId: "tools_of_the_trade" }],
    condition: (s) =>
      s.weapons >= 1 ||
      s.inventory.some((i) => {
        if (i.quantity <= 0) return false;
        const item = getItem(i.itemId);
        return item?.slot === "mainHand" || item?.slot === "offHand";
      }),
    rewards: [{ resource: "gold", amount: 20, label: "Gold" }],
    targetPage: "/woodworker",
  },
  {
    id: "ready_for_battle",
    storyline: "guild",
    chapter: 2,
    title: "Ready for Battle",
    narrative:
      "A weapon in the stockpile does no good. Put it in the hands of someone who knows how to use it. Visit an adventurer's detail page and equip their new gear.",
    objective: "Equip a weapon on an adventurer",
    icon: "⚔️",
    triggers: [{ type: "quest_completed", questId: "arm_the_brave" }],
    condition: (s) =>
      s.adventurers.some(
        (a) =>
          a.equipment && Object.values(a.equipment).some((slot) => slot !== null),
      ),
    rewards: [{ resource: "gold", amount: 20, label: "Gold" }],
    targetPage: "/guild?tab=roster",
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║ DEFENSE — Chapter 1: Threats on the Horizon                 ║
  // ║ Triggered by event_three_reports (after story_1_scouting)   ║
  // ╚══════════════════════════════════════════════════════════════╝

  // The Main Story's second beat: the wolf-defense. Lives in the "story"
  // storyline (Main Story panel), main-flagged so it becomes the pinned beat
  // once Scouting is done. Merges the old walls + watchtower defense pair into
  // one "build both" beat; its narrative IS the wolf warning (no separate banner
  // needed). "Man the Wall" (Gareth drilling the watch) follows off this.
  {
    id: "the_first_threat",
    storyline: "story",
    chapter: 1,
    main: true,
    title: "Hold the Treeline",
    narrative:
      "The pack the scouts drove off has not gone far; it circles the camp after dark, bolder each night, and hunger will make it bolder still. A fence and a wall turn a hungry wolf where an open camp only invites it, and a tower gives us eyes on the dark before it reaches the gate. Raise both while the nights are still quiet — Gareth will take the watch himself, and a hired bow or two beside him would not go amiss.",
    objective: "Build Walls and a Watchtower",
    icon: "🧱",
    triggers: [{ type: "story_mission_completed", missionId: "story_1_scouting" }],
    condition: (s) => s.walls.some((w) => w.level > 0) && s.watchtowers.some((t) => t.level > 0),
    rewards: [
      { resource: "wood", amount: 40, label: "Wood" },
      { resource: "stone", amount: 120, label: "Stone" },
    ],
    targetPage: "/defenses",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/walls.png",
  },
  {
    // Main-story beat 3: the payoff of Hold the Treeline. Appears the moment the
    // treeline wolves are dispatched (the_first_threat claimed → the raid spawns
    // with a short warning), points the player at the Overview threats panel to
    // watch it land, and becomes claimable once the raid has resolved.
    id: "baptism_of_fire",
    storyline: "story",
    chapter: 1,
    main: true,
    title: "Baptism of Fire",
    narrative:
      "They are coming out of the trees now, low and fast, and the wall we raised is about to earn its keep. Gareth has the watch and the first arrow nocked; the others are ready behind him. There is nothing left to build and nowhere better to be than steady. Watch it unfold from the Overview — the threats panel counts them down and shows how the walls hold.",
    objective: "Weather the wolves at the wall",
    icon: "⚔️",
    targetPage: "/",
    // Fires when Hold the Treeline is claimed (the wolves are now inbound), and
    // becomes claimable once that first raid has resolved.
    triggers: [{ type: "quest_completed", questId: "the_first_threat" }],
    condition: (s) => (s.raidsResolvedCount ?? 0) > 0,
    chronicleEntryId: "ch1_the_wall_held",
    rewards: [
      { resource: "gold", amount: 60, label: "Gold" },
      { resource: "astralShards", amount: 3, label: "Astral Shards" },
    ],
  },
  {
    // Main-story beat 4: the payoff for holding the wall points Gareth's eyes
    // outward, and the first thing the watch turns up is a woman being run down.
    // Breadcrumb into the Hester side-chain's opening mission (hester_rescue),
    // which is now gated on the wall-held chronicle so it lands right here.
    id: "spine_run_down",
    storyline: "story",
    chapter: 1,
    main: true,
    title: "Run Down",
    narrative:
      "The wall bought us a quiet week, and Gareth has spent most of it on the watch, learning the shape of our own horizon. This morning it gave him something to see: a woman, alone, run down through the scrub to the north the way you course a deer, a knot of men closing on her. We do not know her and we do not know her crime, but we know what many-against-one looks like, and we did not come this far to watch it from a tower. Send a team out before they take her.",
    objective: "Send a team to drive off the men",
    icon: "🪓",
    triggers: [{ type: "quest_completed", questId: "baptism_of_fire" }],
    condition: (s) => (s.completedUniqueMissionIds ?? []).includes("hester_rescue"),
    rewards: [],
    targetPage: "/guild",
  },
  // "Eyes on the Horizon" (build a watchtower) removed 2026-07 — folded into the
  // "Hold the Treeline" main-story beat above (which now asks for walls AND the
  // watchtower). "Man the Wall" below re-gates onto that.
  {
    id: "man_the_wall",
    storyline: "defense",
    chapter: 1,
    title: "Man the Wall",
    narrative:
      "Stone and a tower keep nothing out on their own. They want people on them who know the horizon and will not sleep through it. Gareth soldiered before he ever felled a tree, and he can drill a proper watch if we give him a tower worth standing on. Raise the watchtower another level and let him train the ones who will hold it.",
    objective: "Raise a watchtower to level 2 and train its watch",
    icon: "🏹",
    // Chained by quest off the main-story defense beat (Hold the Treeline, which
    // builds the walls + the watchtower), NOT chapter — flows straight into
    // Gareth drilling the watch. Teaches the startTraining garrison drill:
    // drilling needs a level-2 watchtower (level-1 units can't drill) plus Gareth
    // (the watchtower trainer, present from guild_open). trainedLevel >= 1 needs both.
    triggers: [{ type: "quest_completed", questId: "the_first_threat" }],
    condition: (s) => s.watchtowers.some((t) => (t.garrison?.trainedLevel ?? 0) >= 1),
    rewards: [
      { resource: "gold", amount: 40, label: "Gold" },
      { resource: "stone", amount: 40, label: "Stone" },
    ],
    targetPage: "/defenses",
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║ DEFENSE — Chapter 3: Watch the Walls                        ║
  // ║ Triggered by completion of story_11_second_inch.            ║
  // ║ Gates story_12_hands_beside_ours (the Rowena visit, fired   ║
  // ║ via this quest's chronicleEntryId on completion).           ║
  // ║                                                              ║
  // ║ TODO progression-alignment: the condition is placeholder.   ║
  // ║ Currently requires outer wall AND outer watchtower built.   ║
  // ║ When progression-alignment design lands, tune to expected   ║
  // ║ player state at this story milestone.                       ║
  // ╚══════════════════════════════════════════════════════════════╝

  {
    id: "watch_the_walls",
    storyline: "defense",
    chapter: 3,
    title: "Watch the Walls",
    narrative:
      "Niamh is away. The work inside the gate has been waiting. While I cannot ride after her or mend a stone without her, I can ask my settlement whether everything inside it is as ready as it ought to be.",
    startNarrative:
      "A patrol returned with a stone that should have been standing. I cannot send anyone to look more closely. What I can do, while I wait, is turn my hand back to the work inside my own gate.",
    objective: "Strengthen the settlement's defenses: build the outer wall and a watchtower.",
    icon: "🛡️",
    triggers: [{ type: "story_mission_completed", missionId: "story_11_second_inch" }],
    condition: (s) =>
      (s.walls.find((w) => w.ring === "outer")?.level ?? 0) >= 1 &&
      s.watchtowers.some((t) => t.level >= 1),
    rewards: [
      { resource: "gold", amount: 80, label: "Gold" },
      { resource: "astralShards", amount: 1, label: "Astral Shards" },
    ],
    targetPage: "/defenses",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/watch_the_walls.png",
    chronicleEntryId: "ch3_hands_beside_ours",
  },

  // ╔══════════════════════════════════════════════════════════════╗
  // ║ THE FOLK — check-ins that surface deferred cast memories      ║
  // ║ Fire in the first real lull (first mission sent, scouts out). ║
  // ║ completes on click; the memory shows on claim. Scripted here  ║
  // ║ off a quest gap; later rounds can hang off chapter milestones.║
  // ╚══════════════════════════════════════════════════════════════╝
  {
    id: "see_to_edda",
    storyline: "social",
    chapter: 1,
    title: "See to Edda",
    narrative:
      "We have done good work these first weeks, and I have hardly looked up to see how the folk who followed me are holding up. Time I sat with each of them a while. I will start with Edda, who will tell me how everyone else is faring long before she says a word about herself. She always does.",
    objective: "Sit a while with Edda",
    icon: "🕯️",
    triggers: [{ type: "custom", check: (s) => s.firstMissionSent === true }],
    condition: () => true,
    rewards: [],
    unlocksBioFragments: ["edda_first_fire"],
  },
  {
    id: "see_to_jory",
    storyline: "social",
    chapter: 1,
    title: "See to Jory",
    narrative:
      "I find Jory at the mill, and he sets down the felling axe when he sees me, rolling his shoulder. \"You know what I dream about?\" he says. \"The day someone else can run this place, so I can put the axe down and pick a knife up. Give me a good piece of wood and the time to carve it, and I would never fell another tree.\" He says it lightly. He is not being light.",
    objective: "Share a word with Jory",
    icon: "🕯️",
    triggers: [{ type: "custom", check: (s) => s.firstMissionSent === true }],
    condition: () => true,
    rewards: [],
    unlocksBioFragments: ["jory_sawhorse"],
  },
  {
    id: "see_to_tomas",
    storyline: "social",
    chapter: 1,
    title: "See to Tomas",
    narrative:
      "I go looking for Tomas and find him at the quarry face, sighting a cut nobody has asked him for yet. He gives me a grunt, which from him is a long and warm conversation. He stands differently here than he did in Ashwick. I know better than to say so.",
    objective: "Look in on Tomas",
    icon: "🕯️",
    triggers: [{ type: "custom", check: (s) => s.firstMissionSent === true }],
    condition: () => true,
    rewards: [],
    unlocksBioFragments: ["tomas_quarry"],
  },
];

// (The legacy `QUEST_CHAIN` back-compat alias was removed in Phase 2 once all
//  consumers migrated to the chapter-based helpers above.)
