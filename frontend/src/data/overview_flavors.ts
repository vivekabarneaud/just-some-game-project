// ─── Overview flavor entries ────────────────────────────────────
// Short Lord-voice lines on the Overview page's "Matters to attend to
// today" card. Agenda-shaped reminders — "here's where we are, here's
// what's next" — with the Lord's poetry kept, but brief. The full flavor
// lives in the Chronicle; this is the sticky-note, in his hand.
//
// AUTHORING RULE: one or two SHORT sentences. Keep the cadence, cut the
// length; if it wants a third sentence, that belongs in the chronicle.
//
// The card is a BOARD OF LIVE CONCERNS, and it changes shape as you play:
//  • settlement / defense are TEACHING tracks — they narrate the early
//    loops, then GRADUATE (go silent) once mastered (see CATEGORY_GRADUATION),
//    freeing the card. Within a category the latest match wins.
//  • adventurers is the STORY spine — it never graduates; it follows the
//    story missions onward.
//  • chain threads (category "chain") are the secondary quest chains — each
//    shows a one-line reminder WHILE it's open and disappears when resolved.
//    Multiple can show at once (they're a to-do list of open threads).

import type { GameState } from "~/engine/gameState";
import { evalTrigger, type QuestTrigger } from "./quests";

export type FlavorCategory = "settlement" | "adventurers" | "defense" | "chain";

export interface OverviewFlavor {
  id: string;
  category: FlavorCategory;
  triggers: QuestTrigger[];
  /** Default OR — set true to require every trigger satisfied. */
  requiresAll?: boolean;
  /** ONE or TWO short sentences in the Lord's voice. Italic-muted on the card. */
  text: string;
}

/** A teaching track goes silent once ANY of its graduation triggers fire —
 *  the player has clearly mastered it, so the card stops nagging and makes
 *  room for live threads. Story + chains never graduate. */
const CATEGORY_GRADUATION: Partial<Record<FlavorCategory, QuestTrigger[]>> = {
  // Reaching Town: the player knows how to grow, and how to hold a wall.
  // (Incoming raids still surface in the raids panel + the sidebar badge.)
  settlement: [{ type: "th_level", level: 5 }],
  defense: [{ type: "th_level", level: 5 }],
};

const OVERVIEW_FLAVORS: OverviewFlavor[] = [
  // ── Settlement (teaching track — graduates at Town) ──
  {
    id: "fresh_start",
    category: "settlement",
    triggers: [{ type: "game_start" }],
    text: "The work is plain: timber, stone, and food before the frost. The rest will keep until we are ready for it.",
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
    text: "The mill hums and the quarry knocks. Now for a hearth to cook on, and shelves for the plenty piling up at Jory's door.",
  },
  {
    id: "hunters_arriving",
    category: "settlement",
    triggers: [{ type: "chapter_unlocked", storyline: "settlement", chapter: 2 }],
    text: "A family of hunters walked in from the wilds, road-worn and asking shelter. The work now is making room.",
  },
  {
    id: "hunters_settling",
    category: "settlement",
    triggers: [
      { type: "building_built", buildingId: "hunting_camp" },
      { type: "building_built", buildingId: "houses" },
    ],
    requiresAll: true,
    text: "The hunters have settled, and their meat salts twice over. But four more mouths at the table means we must find more, and faster.",
  },
  {
    // Village tier (TH3). Superseded by village_in_the_making at settlement Ch4.
    id: "village_tier_reached",
    category: "settlement",
    triggers: [{ type: "th_level", level: 3 }],
    text: "The camp holds together as a village now, not just in name. The work is keeping every mouth fed through the winter.",
  },
  {
    id: "village_in_the_making",
    category: "settlement",
    triggers: [{ type: "chapter_unlocked", storyline: "settlement", chapter: 4 }],
    text: "We have outgrown our tents. A proper hall comes next, and the mill, the quarry, the market must all rise with it.",
  },
  {
    // Population nudge — LAST so it supersedes when genuinely short-handed
    // (few adults, guild built). Falls quiet once the settlement grows.
    id: "too_few_hands",
    category: "settlement",
    triggers: [
      {
        type: "custom",
        check: (s) =>
          (s.buildings.find((b) => b.buildingId === "adventurers_guild")?.level ?? 0) >= 1 &&
          s.citizens.adults < 4,
      },
    ],
    text: "We are still too few for the work ahead. Raise more roofs and keep the larder full, and folk will find their way to us.",
  },

  // ── Adventurers (the story spine — never graduates) ──
  {
    id: "guild_open_scouts_needed",
    category: "adventurers",
    triggers: [{ type: "quest_completed", questId: "heroes_wanted" }],
    text: "The guild hall stands. Send scouts to learn what lives in the forest, and what waits in the south.",
  },
  {
    id: "scouts_returned_adventurers",
    category: "adventurers",
    triggers: [{ type: "story_mission_completed", missionId: "story_1_scouting" }],
    text: "The first scouts came home proven. Gather more hands, and send them further out.",
  },
  {
    id: "old_watch_returned_adventurers",
    category: "adventurers",
    triggers: [{ type: "story_mission_completed", missionId: "story_2_ruins" }],
    text: "The old watch gave up a chest, and a colder story with it. We will want more hands, and steadier ones.",
  },
  {
    // Foreshadows the binding (story_4). Superseded by hale_bound below.
    id: "past_ruins_returned_adventurers",
    category: "adventurers",
    triggers: [{ type: "story_mission_completed", missionId: "story_3_dark_treeline" }],
    text: "What walks the deep south does not bleed; good steel passed through it like smoke. Whatever we send next cannot be more of the same.",
  },
  {
    id: "hale_bound",
    category: "adventurers",
    triggers: [{ type: "story_mission_completed", missionId: "story_4_captains_rest" }],
    text: "We laid Captain Hale to his rest at last. Niamh's binding lets our steel bite the dead, but only while she stands.",
  },
  {
    id: "feldgrund_road",
    category: "adventurers",
    triggers: [{ type: "story_mission_completed", missionId: "story_5_old_tongue" }],
    text: "The road north runs up to Feldgrund and its close, private folk. We go carefully, and we keep our word.",
  },

  // ── Defense (teaching track — graduates at Town) ──
  {
    id: "scouts_returned_defense",
    category: "defense",
    triggers: [{ type: "story_mission_completed", missionId: "story_1_scouting" }],
    text: "The scouts found the south neither empty nor kind. We raise walls while the quiet holds.",
  },
  {
    id: "old_watch_returned_defense",
    category: "defense",
    triggers: [{ type: "story_mission_completed", missionId: "story_2_ruins" }],
    text: "The old watch was built to last, and failed all the same. We raise ours higher, and keep the better watch.",
  },
  {
    id: "more_raids_coming",
    category: "defense",
    triggers: [{ type: "quest_completed", questId: "baptism_of_fire" }],
    text: "The walls held, and that was the lightest thing the south can send. It will come again angrier; we build them higher.",
  },

  // ── Chain threads (secondary quest chains — show while open, vanish when
  //    resolved; multiple can be live at once). One per chain with lore depth. ──
  {
    id: "thread_bog_witch",
    category: "chain",
    triggers: [{ type: "custom", check: (s) => s.completedUniqueMissionIds.includes("the_reeds_price") }],
    text: "The old woman in the fen still sends her askings across the reeds. Grain, and only grain.",
  },
  {
    id: "thread_tainted_spring",
    category: "chain",
    triggers: [{
      type: "custom",
      check: (s) =>
        s.completedUniqueMissionIds.includes("bad_blood") &&
        !s.completedUniqueMissionIds.includes("the_tainted_spring"),
    }],
    text: "Something in the bad water is turning the boars, and we have not yet found its source.",
  },
  {
    id: "thread_woodcutter",
    category: "chain",
    triggers: [{
      type: "custom",
      check: (s) =>
        s.completedUniqueMissionIds.includes("run_down") &&
        !s.completedUniqueMissionIds.includes("no_one_followed"),
    }],
    text: "Hester keeps to the tree line and her own silence. The woods past her are not yet quiet.",
  },
];

/** The card's live concerns, in display order: settlement → adventurers →
 *  defense (each the latest match, unless the track has graduated), then every
 *  open chain thread. Graduated teaching tracks and resolved chains drop out. */
export function getCurrentOverviewFlavors(state: GameState): OverviewFlavor[] {
  const perCat: Partial<Record<FlavorCategory, OverviewFlavor>> = {};
  const chains: OverviewFlavor[] = [];
  for (const f of OVERVIEW_FLAVORS) {
    const fired = f.requiresAll
      ? f.triggers.every((t) => evalTrigger(t, state))
      : f.triggers.some((t) => evalTrigger(t, state));
    if (!fired) continue;
    if (f.category === "chain") { chains.push(f); continue; }
    const grad = CATEGORY_GRADUATION[f.category];
    if (grad?.some((t) => evalTrigger(t, state))) continue; // track graduated → silent
    perCat[f.category] = f; // latest match within a category wins
  }
  const out: OverviewFlavor[] = [];
  for (const cat of FLAVOR_CATEGORY_ORDER) if (perCat[cat]) out.push(perCat[cat]!);
  out.push(...chains);
  return out;
}

/** Display order for the fixed teaching/story tracks. Settlement first (the
 *  primary loop); chain threads append after these. */
const FLAVOR_CATEGORY_ORDER: FlavorCategory[] = ["settlement", "adventurers", "defense"];
