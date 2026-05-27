// ─── Overview flavor entries ────────────────────────────────────
// One-or-two-sentence Lord-voice lines that surface on the Overview
// page's "Matters to attend to today" card. Unlike chronicle entries
// (which are *reflective* — looking back at moments that have passed),
// these are *agenda-shaped*: the Lord narrating what feels pressing
// right now. Adds a layer of "where am I in the story" mood to the
// otherwise mechanical quest-count card.
//
// Authoring: each entry has a category (settlement / adventurers /
// defense) and a trigger. Within a category, the latest matching
// flavor wins. Across categories, every active flavor renders as its
// own paragraph — so the player sees parallel priorities (e.g. "scout
// the south" AND "raise a hall") at the same time. Keep entries
// sparse: one per real mood shift, not one per quest.

import type { GameState } from "~/engine/gameState";
import { evalTrigger, type QuestTrigger } from "./quests";

/** Top-level concerns the Lord narrates about. Each category tracks its own
 *  latest-matching flavor independently, so the Overview card can surface
 *  parallel priorities — "we need to scout the south" AND "we need a proper
 *  hall" at the same time. Mirrors the storyline split on the quest log. */
export type FlavorCategory = "settlement" | "adventurers" | "defense";

export interface OverviewFlavor {
  id: string;
  /** Which concern this flavor belongs to. Flavors within a category
   *  supersede each other; flavors across categories coexist. */
  category: FlavorCategory;
  triggers: QuestTrigger[];
  /** Default OR — set true to require every trigger satisfied. */
  requiresAll?: boolean;
  /** 1-2 short sentences in the Lord's voice. Italic-muted on the card. */
  text: string;
}

export const OVERVIEW_FLAVORS: OverviewFlavor[] = [
  {
    id: "fresh_start",
    category: "settlement",
    triggers: [{ type: "game_start" }],
    text:
      "Edda counted the rations again this morning. Jory is at the tree line, Tomas at the ridge. The work is plain enough: timber, stone, food before the frost. The rest will come.",
  },
  {
    id: "foundations_set",
    category: "settlement",
    triggers: [
      { type: "building_built", buildingId: "lumber_mill" },
      { type: "building_built", buildingId: "quarry" },
      { type: "building_built", buildingId: "forager_hut" },
    ],
    requiresAll: true,
    text:
      "The mill hums, the quarry knocks, the forest gives more than we expected. Edda has herbs to crush but no fire to cook them on, and the piles outside Jory's shop grow faster than the shelves inside.",
  },
  {
    id: "hunters_arriving",
    category: "settlement",
    triggers: [{ type: "chapter_unlocked", storyline: "settlement", chapter: 2 }],
    text:
      "A raven brought word: two families on the road, due within the week. Edda walked the tents this morning, counting, and shook her head. The shape is set. What comes next is making room.",
  },
  {
    id: "hunters_settling",
    category: "settlement",
    triggers: [
      { type: "building_built", buildingId: "hunting_camp" },
      { type: "building_built", buildingId: "houses" },
    ],
    requiresAll: true,
    text:
      "The new families have settled in. The hunters bring meat enough to salt twice over. A new child runs the camp, smaller than Nell and louder; Nell barely looks up from Edda's herbs. The ration count is heavier by four. We will need more, faster.",
  },
  {
    // Single merged flavor covering the guild-built / scouts-needed arc.
    // Forward-looking and explicit about what scouting is for, so the player
    // doesn't just see "we need scouts" without knowing why.
    id: "guild_open_scouts_needed",
    category: "adventurers",
    triggers: [{ type: "quest_completed", questId: "heroes_wanted" }],
    text:
      "The guild hall is up. The country around us is still unknown. We will need to send scouts: to see what lives in the forest, where food can be gathered, and where the south might hold a threat we have not yet met.",
  },
  {
    // Fires when the first scouting mission completes — the three-reports
    // event banner has just played. Defense track points the player at
    // walls; adventurers track shifts to "more recruits, longer missions"
    // (supersedes guild_open_scouts_needed, which would otherwise sit
    // stale saying "we need scouts" after the scouts have returned).
    id: "scouts_returned_defense",
    category: "defense",
    triggers: [{ type: "story_mission_completed", missionId: "story_1_scouting" }],
    text:
      "The scouts have returned. The south is not empty, and what is in it is not friendly. We will need walls before the brigands come for us. The old watch, for now, can wait.",
  },
  {
    id: "scouts_returned_adventurers",
    category: "adventurers",
    triggers: [{ type: "story_mission_completed", missionId: "story_1_scouting" }],
    text:
      "The first scouts proved themselves and came home. The next expedition will need more hands. We will keep recruiting, and we will send them further.",
  },
  {
    id: "cloth_for_winter",
    category: "settlement",
    triggers: [{ type: "quest_completed", questId: "the_first_stitch" }],
    text:
      "The shepherd's flock has settled and the loom has finally turned. The first cloak is on a shoulder. One is not enough. Winter will come whatever the calendar says, and there are more shoulders in the camp than cloaks. We will need to keep weaving.",
  },
  {
    id: "more_raids_coming",
    category: "defense",
    triggers: [{ type: "quest_completed", questId: "baptism_of_fire" }],
    text:
      "The walls held. Tomas walked the perimeter twice before sleep, then twice more before dawn. The brigands were the lightest thing the south can send. They will come back, and angrier, and not alone next time. The walls will need to be higher, and we will need more hands on them.",
  },
  {
    // Fires the moment settlement Ch4 opens (the canvas-outgrowing event
    // banner just played). Forward-looking: the hall is the next big
    // settlement project, and the mill/quarry/market will need to grow
    // alongside it. Stays active through the Ambition Rises and Road to
    // Greatness chain — no later settlement flavor supersedes it yet.
    id: "village_in_the_making",
    category: "settlement",
    triggers: [{ type: "chapter_unlocked", storyline: "settlement", chapter: 4 }],
    text:
      "The camp has outgrown its tents. Edda calls the Town Hall 'the cupboard' and she is not joking. A proper hall is the next thing we need: somewhere indoors to decide things, somewhere the records keep. After that, the mill, the quarry, and the market will all need to grow with us.",
  },
];

/** Returns the latest matching flavor per category. Categories with no
 *  matching flavor return undefined for that key. The UI iterates the
 *  result in a fixed display order. */
export function getCurrentOverviewFlavors(state: GameState): Partial<Record<FlavorCategory, OverviewFlavor>> {
  const result: Partial<Record<FlavorCategory, OverviewFlavor>> = {};
  for (const f of OVERVIEW_FLAVORS) {
    const fired = f.requiresAll
      ? f.triggers.every((t) => evalTrigger(t, state))
      : f.triggers.some((t) => evalTrigger(t, state));
    if (fired) result[f.category] = f;
  }
  return result;
}

/** Display order on the Overview card. Settlement first because it's the
 *  primary loop; adventurers and defense come after as side concerns. */
export const FLAVOR_CATEGORY_ORDER: FlavorCategory[] = ["settlement", "adventurers", "defense"];
