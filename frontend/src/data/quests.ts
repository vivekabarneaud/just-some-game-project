import type { GameState } from "~/engine/gameState";
import { getItem } from "@medieval-realm/shared/data/items";
import type { VeggieId } from "./gardens";

// ─── Storyline / chapter taxonomy ────────────────────────────────

export type StorylineId = "settlement" | "guild" | "story" | "defense" | "social";

export const STORYLINE_LABELS: Record<StorylineId, string> = {
  settlement: "Settlement",
  guild: "Adventurer's Guild",
  story: "The Lord's Journal",
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
  resource: "gold" | "wood" | "stone" | "wheat" | "wool" | "astralShards";
  amount: number;
  label: string;
}

export interface QuestDefinition {
  id: string;
  storyline: StorylineId;
  chapter: number;
  title: string;
  narrative: string;
  /** Short vignette shown while the quest is active. Preferred over `narrative` when present. */
  startNarrative?: string;
  objective: string;
  icon: string;

  /** Activates when ANY trigger fires (OR semantics). For AND, set `requiresAll`. */
  triggers: QuestTrigger[];
  requiresAll?: boolean;

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
    id: "the_sawhorse",
    storyline: "settlement",
    chapter: 1,
    title: "The Sawhorse",
    narrative:
      "Jory walked the tree line this morning with the back of his axe, tapping trunks and listening. He has returned with a list of three good pines and a muttered opinion about the others. I promised him a proper mill before the week is out.",
    objective: "Build a Lumber Mill",
    icon: "🪓",
    triggers: [{ type: "game_start" }],
    condition: (s) => (bldg(s, "lumber_mill")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 30, label: "Wood" },
      { resource: "stone", amount: 40, label: "Stone" },
    ],
    targetBuildingId: "lumber_mill",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/the_sawhorse.png",
    // jory_sawhorse memory deferred to the "See to Jory" social check-in.
  },
  {
    id: "the_first_cut",
    storyline: "settlement",
    chapter: 1,
    title: "The First Cut",
    narrative:
      "Tomas sharpened his chisel twice before lunch and asked me nothing. That is how he asks for a proper quarry: quietly, and without waiting for permission. The ridge of stone to the north will do.",
    objective: "Open the Stone Quarry",
    icon: "⛏️",
    triggers: [{ type: "game_start" }],
    condition: (s) => (bldg(s, "quarry")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 60, label: "Wood" },
      { resource: "stone", amount: 10, label: "Stone" },
    ],
    targetBuildingId: "quarry",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/the_first_cut.png",
    // tomas_quarry memory deferred to the "See to Tomas" social check-in.
  },
  {
    id: "the_foragers_path",
    storyline: "settlement",
    chapter: 1,
    title: "The Forager's Path",
    narrative:
      "The forest gives more than we can carry. Edda brings back mushrooms; Nell brings back everything she finds, including the things Edda tells her to put back. We need a hut. A roof and a table and a door that closes. Things spoil, and we are not yet wealthy enough to waste anything.",
    objective: "Build a Forager's Hut",
    icon: "🫐",
    triggers: [{ type: "game_start" }],
    condition: (s) => (bldg(s, "forager_hut")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 30, label: "Wood" },
      { resource: "stone", amount: 5, label: "Stone" },
    ],
    targetBuildingId: "forager_hut",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/the_foragers_path.png",
    // edda_forager_hut memory is parked for now (no longer fires on the build);
    // it can be re-homed to a later check-in round when those land.
  },
  {
    id: "the_growing_pile",
    storyline: "settlement",
    chapter: 1,
    title: "The Growing Pile",
    narrative:
      "Jory is laughing about it, mostly. He says the wood pile in front of his shop has its own opinions now, and it tripped him yesterday when he was carrying a saw. Tomas does not laugh. He has been stacking quarry stone behind the workshop, neat as a wall, and waiting for me to notice. They are both right. We need a roof over the surplus before the rain teaches us a lesson.",
    objective: "Build a Warehouse",
    icon: "🏚️",
    triggers: [
      { type: "building_built", buildingId: "lumber_mill" },
      { type: "building_built", buildingId: "quarry" },
    ],
    requiresAll: true,
    condition: (s) => (bldg(s, "warehouse")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 50, label: "Wood" },
      { resource: "stone", amount: 30, label: "Stone" },
    ],
    targetBuildingId: "warehouse",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/warehouse.png",
  },

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
      "A family of hunters walked in from the wilds yesterday, lean and asking for shelter; no one sent them, they simply found us. The tents we have will not hold them. Edda has been saying for weeks that a settlement of six is a picnic, not a village; she will now say it with more conviction.",
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
    id: "stockpile_for_winter",
    storyline: "settlement",
    chapter: 2,
    title: "A Proper Pantry",
    narrative:
      "Edda has taken to hanging onions from a tent pole and calling it a pantry. It is not a pantry. The one in Ashwick was a stone room that smelled of root vegetables and salt; ours will be wood-floored and smell of nothing yet. Tomas says the cellar can go down four feet before we hit the water table. That will do.",
    objective: "Build a Pantry",
    icon: "🥫",
    // Gated on the Hunter Camp so meat surplus is actually a felt problem
    // when Edda complains about storage — not just an abstract worry on the
    // first morning of Ch2 alongside Houses + Hunter.
    triggers: [{ type: "building_built", buildingId: "hunting_camp" }],
    condition: (s) => (bldg(s, "pantry")?.level ?? 0) >= 1,
    rewards: [
      { resource: "wood", amount: 50, label: "Wood" },
      { resource: "stone", amount: 30, label: "Stone" },
    ],
    targetBuildingId: "pantry",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/pantry.png",
    unlocksBioFragments: ["edda_pantry"],
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
  {
    id: "a_sweeter_patch",
    storyline: "settlement",
    chapter: 2,
    title: "A Sweeter Patch",
    narrative:
      "Nell came back from the treeline with her apron gathered up in both hands, full of small wild berries and not saying a word, only holding them out. They are too few and too scattered to feed anyone, but Edda turned one over in her fingers and said the tame kind, coaxed and tended, comes up sweeter and larger than the woods will ever give. A row of our own, then. Something red to look forward to in the summer, for the child if no one else.",
    objective: "Take up Nell's strawberries",
    hint: "Claiming adds strawberry seed to your stores — a new crop you can sow in a garden come spring.",
    icon: "🍓",
    // A gentle follow-up once the first garden is planted: introduces the
    // specialty-seed system by handing over the strawberry seed. The condition
    // is already met (a garden is planted), so this reads as a narrative gift
    // the player claims rather than a fresh chore.
    triggers: [{ type: "quest_completed", questId: "eddas_garden" }],
    condition: (s) => s.gardens.some((g) => g.level >= 1 && g.plantedYear === s.year),
    rewards: [{ resource: "gold", amount: 15, label: "Gold" }],
    unlocksSeeds: ["strawberries"],
    targetPage: "/farming",
  },

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
  {
    id: "first_stitch",
    storyline: "settlement",
    chapter: 3,
    title: "The First Stitch",
    narrative:
      "Your tailor examines the wool and nods approvingly. 'Good fiber. I can make proper clothes from this. Your people are shivering in rags. Clothe them and they'll be happier, especially come winter. Robes and armor can wait. Warmth first.'",
    objective: "Craft Wool or Linen Clothing for your citizens",
    icon: "🧥",
    triggers: [{ type: "quest_completed", questId: "warm_and_proper" }],
    // Bumped from >= 1 to >= 2: the hunters arrival event brings 1 clothing
    // as part of "they bring their own clothes" flavor, which would otherwise
    // satisfy this quest before the player has used the tailor at all. The
    // bump forces at least one actual craft to learn the tailoring loop.
    condition: (s) => Math.round(s.clothing) >= 2,
    rewards: [{ resource: "wool", amount: 5, label: "Wool" }],
    targetPage: "/tailoring",
  },

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
    id: "sharper_axes",
    storyline: "settlement",
    chapter: 4,
    title: "Sharper Axes",
    narrative:
      "Jory has stopped tapping trunks with the back of his axe and started marking them with chalk: a sign he has learned which pines here are worth felling and which are not. He says the mill needs a proper pit-saw and a second horse, and he announces it over breakfast in front of everyone, which is how Jory gets things done.",
    objective: "Upgrade Lumber Mill to level 2",
    icon: "🪓",
    triggers: [{ type: "th_level", level: 2 }],
    condition: (s) => (bldg(s, "lumber_mill")?.level ?? 0) >= 2,
    rewards: [
      { resource: "wood", amount: 40, label: "Wood" },
      { resource: "stone", amount: 54, label: "Stone" },
    ],
    targetBuildingId: "lumber_mill",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_5.png",
    unlocksBioFragments: ["jory_old_songs"],
  },
  {
    id: "deeper_veins",
    storyline: "settlement",
    chapter: 4,
    title: "Deeper Veins",
    narrative:
      "Tomas has been sleeping at the quarry two nights a week, coming back with dust in his beard and a list of what the surface ledge cannot give us. He wants to cut down: proper steps, a winch, maybe a second face. He says the good stone is just below, and he says it like a man who can already hear it.",
    objective: "Upgrade Stone Quarry to level 2",
    icon: "⛏️",
    triggers: [{ type: "th_level", level: 2 }],
    condition: (s) => (bldg(s, "quarry")?.level ?? 0) >= 2,
    rewards: [
      { resource: "wood", amount: 81, label: "Wood" },
      { resource: "stone", amount: 13, label: "Stone" },
    ],
    targetBuildingId: "quarry",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_6.png",
    unlocksBioFragments: ["tomas_quarry_shack"],
  },
  {
    id: "merchants_welcome",
    storyline: "settlement",
    chapter: 4,
    title: "Merchants Welcome",
    narrative:
      "A Dominion trader stopped through yesterday with two mules and more opinions than cargo. \"You have grown enough to be worth a second visit,\" she said, \"if you build a proper market. No one unloads in the mud.\" She may be right. Coin spends the same wherever it comes from.",
    objective: "Build a Marketplace",
    icon: "🏪",
    triggers: [{ type: "th_level", level: 2 }],
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
    title: "The Road to Greatness",
    narrative:
      "The Town Hall is too small now. Edda has taken to calling it \"the cupboard.\" We have outgrown this camp: tents on every level stretch of ground, two wells, a mission board, and more names on the roster than I can list from memory. The canvas leaks when it rains hard. The firepit is the only place we gather, and decisions made standing in the wet do not hold long. It is time to raise a proper hall, and then to trade tents for walls.",
    objective: "Upgrade Town Hall to level 3",
    icon: "⭐",
    // Gated on the three Ch.4 prereq quests rather than firing the instant
    // Town Hall hits Lv.2 — gives the player room to actually upgrade the
    // mill, quarry, and marketplace before the next milestone surfaces.
    triggers: [
      { type: "quest_completed", questId: "sharper_axes" },
      { type: "quest_completed", questId: "deeper_veins" },
      { type: "quest_completed", questId: "merchants_welcome" },
    ],
    requiresAll: true,
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
  {
    id: "into_the_unknown",
    storyline: "guild",
    chapter: 1,
    title: "Into the Unknown",
    narrative:
      "The mission board is nailed to the wall, ink still wet. The southern frontier is full of ruins, rumours, and things that the Dominion's maps don't show. Time to find out what's really out here.",
    objective: "Send your first mission",
    icon: "🗺️",
    triggers: [{ type: "quest_completed", questId: "heroes_wanted" }],
    condition: (s) => s.firstMissionSent === true,
    rewards: [
      { resource: "astralShards", amount: 10, label: "Astral Shards" },
      { resource: "wood", amount: 25, label: "Wood" },
    ],
    targetPage: "/guild",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/stories/quest_12.png",
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
    // The Woodworker is gated on Hester's rescue (she frees Jory for the fine
    // carving), so this can't fire until then — otherwise it asks the player to
    // build something still locked. Gate it on the same hester_rescue flag the
    // building reads (completedUniqueMissionIds).
    triggers: [
      { type: "chapter_unlocked", storyline: "guild", chapter: 2 },
      { type: "custom", check: (s) => (s.completedUniqueMissionIds ?? []).includes("hester_rescue") },
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

  {
    id: "the_first_threat",
    storyline: "defense",
    chapter: 1,
    title: "The First Threat",
    narrative:
      "Your scouts spotted a band of armed men two ridges east, watching the settlement. Poorly equipped, desperate, not organized, and not moving on us yet. But a frontier holding without walls is an invitation. Raise walls while the quiet holds.",
    objective: "Build Walls",
    icon: "🧱",
    triggers: [
      { type: "chapter_unlocked", storyline: "defense", chapter: 1 },
      { type: "story_mission_completed", missionId: "story_1_scouting" },
    ],
    requiresAll: true,
    condition: (s) => s.walls.some((w) => w.level > 0),
    rewards: [
      { resource: "wood", amount: 40, label: "Wood" },
      { resource: "stone", amount: 120, label: "Stone" },
    ],
    targetPage: "/defenses",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/walls.png",
  },
  {
    id: "baptism_of_fire",
    storyline: "defense",
    chapter: 1,
    title: "Baptism of Fire",
    narrative:
      "They're here. The first raiders have found the fence, drawn by a lonely holding that looks like easy pickings on the edge of nowhere. Whoever they are, they mean to take what we have. Your walls will be tested for the first time.",
    objective: "Survive the raid",
    icon: "⚔️",
    // The scripted brigand raid is deferred (July 2026), so this fires on the
    // first resolved raid of ANY kind once walls are up — hence the neutral,
    // raid-type-agnostic narrative above.
    triggers: [
      {
        type: "custom",
        check: (s) =>
          s.walls.some((w) => w.level > 0) && (s.raidsResolvedCount ?? 0) > 0,
      },
    ],
    condition: (s) => (s.raidsResolvedCount ?? 0) > 0,
    rewards: [
      { resource: "gold", amount: 60, label: "Gold" },
      { resource: "astralShards", amount: 3, label: "Astral Shards" },
    ],
  },
  {
    id: "eyes_on_the_horizon",
    storyline: "defense",
    chapter: 1,
    title: "Eyes on the Horizon",
    narrative:
      "We saw them in time, but only because a returning patrol heard the brush move. Next raid, we might not be so lucky. A proper watchtower would give us hours of warning instead of minutes. No one else is getting inside our fence unnoticed.",
    objective: "Build a Watchtower",
    icon: "🏰",
    triggers: [{ type: "quest_completed", questId: "baptism_of_fire" }],
    condition: (s) => s.watchtowers.some((t) => t.level > 0),
    rewards: [
      { resource: "wood", amount: 60, label: "Wood" },
      { resource: "stone", amount: 120, label: "Stone" },
    ],
    targetPage: "/defenses",
    image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/buildings/watchtower.png",
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
