import type { MissionTemplate } from "./types.js";

// ─── Foraging trips ─────────────────────────────────────────────
// FORAGING_MINIGAME §3d (2026-09-08): the trip IS a daily mission. These cards
// are doors, not deployments — clicking one drops the player straight into the
// forest screen with no deploy panel, no adventurer occupied, no duration and no
// failure state. The basket carried home is the whole reward, so `rewards` is
// empty by design and `slots` is empty because nobody is sent.
//
// The board is the trip economy, for free: it refreshes daily at 3am (the one
// free trip a day) and `rerollMissions()` already charges 10*2^n shards for
// another roll. Nothing bespoke needed.
//
// `pinned` keeps a trip reliably on the board rather than leaving it to the
// board's random draw — a foraging trip that only sometimes appears would read
// as a bug, since the fiction is simply that the wood is there.
//
// One entry per region. Story map-unlocks widen which forests the player can
// walk into; each new region gets a card here with its own `foraging.region`.

export const FORAGING_MISSIONS: MissionTemplate[] = [
  {
    id: "forage_near_wood",
    name: "The Near Wood",
    description:
      "The wood at our back is close enough to walk before dark and back again after. Whatever the season is giving is out there for anyone willing to go and look for it.",
    icon: "🧺",
    // Nobody is sent, nothing is fought, nothing is waited for.
    slots: [],
    duration: 0,
    rewards: [],
    deployCost: 0,
    difficulty: 1,
    minGuildLevel: 1,
    tags: ["outdoor"],
    map: { x: 0.452, y: 0.598 }, // the near fold, west of the settlement
    pinned: true,
    foraging: { region: "near_fold" },
    // You cannot walk into a wood nobody has charted. story_1_scouting reveals
    // the near fold on the map, so it is the natural gate. NOTE it must be
    // `story`, not `missionDone` — the latter reads completedUniqueMissionIds,
    // which never contains story beats.
    requires: { story: "story_1_scouting" },
  },
];
