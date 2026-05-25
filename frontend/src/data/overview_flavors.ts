// ─── Overview flavor entries ────────────────────────────────────
// One-or-two-sentence Lord-voice lines that surface on the Overview
// page's "Matters to attend to today" card. Unlike chronicle entries
// (which are *reflective* — looking back at moments that have passed),
// these are *agenda-shaped*: the Lord narrating what feels pressing
// right now. Adds a layer of "where am I in the story" mood to the
// otherwise mechanical quest-count card.
//
// Authoring: each entry has a trigger (same QuestTrigger types used
// by quests/events). The engine walks the list in order and returns
// the *last* entry whose trigger is satisfied — so later flavors
// supersede earlier ones as the settlement evolves. Keep entries
// sparse: one per real mood shift, not one per quest.

import type { GameState } from "~/engine/gameState";
import { evalTrigger, type QuestTrigger } from "./quests";

export interface OverviewFlavor {
  id: string;
  triggers: QuestTrigger[];
  /** Default OR — set true to require every trigger satisfied. */
  requiresAll?: boolean;
  /** 1-2 short sentences in the Lord's voice. Italic-muted on the card. */
  text: string;
}

export const OVERVIEW_FLAVORS: OverviewFlavor[] = [
  {
    id: "fresh_start",
    triggers: [{ type: "game_start" }],
    text:
      "Edda counted the rations again this morning. Jory is at the tree line, Tomas at the ridge. The work is plain enough: timber, stone, food before the frost. The rest will come.",
  },
  {
    id: "foundations_set",
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
    triggers: [{ type: "chapter_unlocked", storyline: "settlement", chapter: 2 }],
    text:
      "A raven brought word: two families on the road, due within the week. Edda walked the tents this morning, counting, and shook her head. The shape is set. What comes next is making room.",
  },
  {
    id: "hunters_settling",
    triggers: [
      { type: "building_built", buildingId: "hunting_camp" },
      { type: "building_built", buildingId: "houses" },
    ],
    requiresAll: true,
    text:
      "The new families have settled in. The hunters bring meat enough to salt twice over. A new child runs the camp, smaller than Nell and louder; Nell barely looks up from Edda's herbs. The ration count is heavier by four. We will need more, faster.",
  },
  // Add entries as new beats land. Examples to author later:
  //   first_raid_resolved — relief + new awareness
];

/** Latest flavor whose trigger is currently satisfied, or null. */
export function getCurrentOverviewFlavor(state: GameState): OverviewFlavor | null {
  let match: OverviewFlavor | null = null;
  for (const f of OVERVIEW_FLAVORS) {
    const fired = f.requiresAll
      ? f.triggers.every((t) => evalTrigger(t, state))
      : f.triggers.some((t) => evalTrigger(t, state));
    if (fired) match = f;
  }
  return match;
}
