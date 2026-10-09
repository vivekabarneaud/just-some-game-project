// ─── Scenarios: start the game at a chosen point ────────────────────────────
//
// Testing a change used to mean replaying from the first winter. A scenario is
// a short RECIPE for a point in the game, applied over a fresh state.
//
// A recipe, deliberately, and not a saved blob. A blob of a real save rots the
// moment SAVE_VERSION moves, and the house rule for this alpha is to bump the
// version rather than write a migration. A recipe says "the guild stands at
// level 1 and the wolves are dead", which stays true whatever the save shape
// becomes, because it is re-derived from today's `createInitialState()`.
//
// A scenario never invents a mechanism. It only sets the fields the game
// already reads: a building level, a completed story mission, a hero on the
// roster. Anything a recipe cannot say goes in `tweak`.

import { createInitialState, type GameState } from "~/engine/gameState";
import { BUILDINGS } from "./buildings";
import { buildRecruitFromPremadeId } from "@medieval-realm/shared/data/adventurers";
import type { Season } from "./seasons";

export interface Scenario {
  id: string;
  name: string;
  /** One line on what this point of the game feels like. */
  blurb: string;
  /** Buildings to raise: building id to level. The Town Hall starts at 1. */
  buildings?: Record<string, number>;
  /** Story missions already behind you. Drives `getCurrentStoryMission`. */
  storyDone?: string[];
  /** Quests already claimed. Some story missions gate on one. */
  questsDone?: string[];
  /** The roster: premade id to the level the hero joins at. */
  roster?: Record<string, number>;
  /** Merged over the starting store. */
  resources?: Partial<GameState["resources"]>;
  /** Merged over the travel rations, by food id. */
  foods?: Record<string, number>;
  /** Merged over the six founders. */
  citizens?: Partial<GameState["citizens"]>;
  /** Who is ill, and with what: person id to ailment id. */
  ailments?: Record<string, string>;
  season?: Season;
  year?: number;
  /** Whatever the fields above cannot say. Runs last, over the built state. */
  tweak?: (s: GameState) => void;
}

/** Turn a recipe into a save-shaped state. Pure: it touches no storage. */
export function buildScenario(sc: Scenario): GameState {
  const s = createInitialState();

  // A dev jump never wants the opening cinematic again.
  s.introSeen = true;

  for (const [id, level] of Object.entries(sc.buildings ?? {})) {
    const slot = s.buildings.find((b) => b.buildingId === id);
    if (slot) slot.level = level;
    else console.warn(`[scenario ${sc.id}] no such building: ${id}`);
  }

  s.completedStoryMissions = [...(sc.storyDone ?? [])];
  // A story mission is unique: once done it must not come back on the board.
  s.completedUniqueMissionIds = [...(sc.storyDone ?? [])];
  s.questRewardsClaimed = [...(sc.questsDone ?? [])];

  s.adventurers = Object.entries(sc.roster ?? {})
    .map(([premadeId, level], i) => buildRecruitFromPremadeId(`scn_${i}`, premadeId, level))
    .filter((a): a is NonNullable<typeof a> => {
      if (!a) console.warn(`[scenario ${sc.id}] no such premade on the roster`);
      return !!a;
    });

  Object.assign(s.resources, sc.resources ?? {});
  Object.assign(s.foods, sc.foods ?? {});
  Object.assign(s.citizens, sc.citizens ?? {});

  if (sc.ailments) {
    s.folkAilments = {};
    for (const [personId, ailmentId] of Object.entries(sc.ailments)) {
      s.folkAilments[personId] = { ailmentId, hoursRemaining: 8 };
    }
  }

  if (sc.season) {
    // Land at the START of the season asked for. seasonElapsed is the same
    // 0..span scale in both modes, so zero is the first day of it.
    s.season = sc.season;
    s.seasonElapsed = 0;
  }
  if (sc.year) s.year = sc.year;

  // The clock must not think the settlement sat empty since the epoch, or the
  // first tick fast-forwards through every season at once.
  s.lastTick = Date.now();

  sc.tweak?.(s);
  return s;
}

// ─── The points worth starting from ─────────────────────────────────────────
// Each one answers "I want to test X without playing to X". Keep the list
// short: a scenario nobody starts from is a fixture that silently goes stale.

/** The food buildings the settlement needs before anything else is affordable. */
const FED = { houses: 2, hunting_camp: 1, forager_hut: 1, lumber_mill: 1, quarry: 1, well: 1 };
/** Everything a Village-tier settlement has standing. */
const VILLAGE = {
  ...FED, town_hall: 4, houses: 4, warehouse: 2, pantry: 2, kitchen: 1,
  fishing_hut: 1, marketplace: 1, tavern: 1, adventurers_guild: 2, kennel: 1,
  blacksmith: 1, tailoring_shop: 1, woodworker: 1, shrine: 1, alchemy_lab: 1,
};
/** The two Thornwoods who staff the camps. */
const THORNWOODS = { char_000: 3, char_021: 3 };

export const SCENARIOS: Scenario[] = [
  {
    id: "day_one",
    name: "Day one",
    blurb: "The wagon is unpacked and nothing is built. The fresh start, for when you want it back.",
  },
  {
    id: "fed_and_housed",
    name: "Fed and housed",
    blurb: "The first hour is done: roofs up, the camps working, a week of food in the pantry. No guild yet.",
    buildings: FED,
    resources: { gold: 150, wood: 600, stone: 400 },
    foods: { wheat: 80, venison: 40, trout: 30 },
    citizens: { adults: 6, children: 2 },
  },
  {
    id: "the_guild_opens",
    name: "The guild opens",
    blurb: "The hall stands and the Thornwoods have arrived. The scouting is done and the wolves are next.",
    buildings: { ...FED, adventurers_guild: 1, houses: 3, kennel: 1 },
    storyDone: ["story_1_scouting"],
    roster: THORNWOODS,
    resources: { gold: 250, wood: 800, stone: 500 },
    foods: { wheat: 100, venison: 50, trout: 40 },
    citizens: { adults: 8, children: 3 },
  },
  {
    id: "village",
    name: "A village",
    blurb: "Town Hall 4, the trades open, a full larder and a roster of five. The middle of Act 1.",
    buildings: VILLAGE,
    storyDone: ["story_1_scouting"],
    roster: { ...THORNWOODS, char_001: 4, char_002: 4, char_003: 3 },
    resources: { gold: 1200, wood: 2500, stone: 2000, water: 200 },
    foods: { wheat: 300, venison: 150, trout: 120, nuts: 60, blueberry: 50 },
    citizens: { adults: 14, children: 5, elderly: 3 },
    season: "summer",
    year: 2,
  },
  {
    id: "winter_bites",
    name: "Winter bites",
    blurb: "A village on the first day of winter with a thin larder. For testing the pinch and the food loop.",
    buildings: VILLAGE,
    storyDone: ["story_1_scouting"],
    roster: THORNWOODS,
    resources: { gold: 400, wood: 900, stone: 700 },
    foods: { wheat: 40, venison: 10 },
    citizens: { adults: 14, children: 5, elderly: 3 },
    season: "winter",
    year: 2,
  },
  {
    id: "the_sick_house",
    name: "The sick house",
    blurb: "Four of the six are ailing at once, two of them with no trade. For the Folk page and the cures.",
    buildings: VILLAGE,
    roster: THORNWOODS,
    resources: { gold: 400, wood: 900, stone: 700 },
    citizens: { adults: 14, children: 5, elderly: 3 },
    ailments: {
      jory: "bad_cut",
      tomas: "wrenched_back",
      the_lord: "winter_chill",
      nell: "summer_gripe",
    },
    tweak: (s) => {
      // Cures on the shelf, or the buttons have nothing to offer and the
      // scenario tests only half of what it is for. A cure id can come from
      // the item list OR from the alchemy recipes, and the inventory holds
      // both, so these are a dressing and three brews.
      s.inventory = [
        { itemId: "bandage", quantity: 5 },
        { itemId: "woundwort_salve", quantity: 2 },
        { itemId: "knitbone_poultice", quantity: 2 },
        { itemId: "fever_tonic", quantity: 2 },
        { itemId: "settling_draught", quantity: 2 },
      ];
    },
  },
];

export const getScenario = (id: string) => SCENARIOS.find((s) => s.id === id);
