import type { GameState } from "~/engine/gameState";
import type { QuestTrigger, StorylineId } from "./quests";
import { QUEST_DEFINITIONS, isChapterComplete } from "./quests";

// ─── Narrative event system ──────────────────────────────────────
//
// Events bridge chapters and storylines. They fire automatically when their
// triggers are satisfied, queue a banner for the player to read, and apply
// unlocks (storyline activation, chronicle entries, etc.).
//
// Each event fires at most once per save (tracked via `firedEvents`).
// Banners queue into `pendingEvents` and are dismissed by the player.

export interface EventUnlocks {
  /** Activate a storyline at a specific chapter (sets chapters[storyline].current). */
  activateStoryline?: { storyline: StorylineId; chapter: number };
  /** Chronicle entry to fire on event acknowledgement. */
  chronicleEntryId?: string;
  /** Queue a specific raid for arrival alongside the banner. Used to make
   *  scripted story raids land deterministically instead of relying on the
   *  probabilistic spawner. The raid uses its template baseWarning (adjusted
   *  by current watchtower level) for its warning timer. */
  raidSpawn?: { raidId: string };
  /** Add citizens to the settlement when the event fires. Used to make story
   *  arrivals (families arriving, refugees joining, etc.) actually materialize
   *  on the population counter instead of staying purely narrative. */
  addCitizens?: Partial<{ toddlers: number; children: number; adults: number; elderly: number }>;
  /** Named, protected residents ("the household") — same shape as addCitizens
   *  but these also raise the protected floor (RNG never kills them). */
  addNamedResidents?: Partial<{ toddlers: number; children: number; adults: number; elderly: number }>;
  /** Add typed food units to the settlement (wheat / meat / fish / etc.).
   *  Used when story arrivals bring their own rations — softens the food
   *  pressure spike of new mouths without erasing it. */
  addFood?: Partial<Record<string, number>>;
  /** Add non-food stockpile resources brought along by the arrival.
   *  Currently supports clothing — extend as future events bring tools,
   *  weapons, materials, etc. Recipe bring-alongs will live in their own
   *  field once the loot-recipe system lands (see project_loot_recipes). */
  addResources?: Partial<{
    clothing: number;
    wood: number;
    stone: number;
    iron: number;
    gold: number;
  }>;
  /** Premade IDs to roster the moment this event fires, instead of waiting on
   *  an arrival condition. Idempotent (skips anyone already recruited). Lets a
   *  story arrival (e.g. the Thornwood siblings) show up as adventurers right
   *  when the family walks in, not later when the guild is raised. */
  recruitPremadeIds?: string[];
}

export interface NarrativeEvent {
  id: string;
  /** Triggers — fires when ANY satisfied (OR), or ALL if `requiresAll`. */
  triggers: QuestTrigger[];
  requiresAll?: boolean;
  /** Sentence-or-two banner shown to the player on fire. */
  banner: string;
  unlocks?: EventUnlocks;
}

// ─── Event triggers ──────────────────────────────────────────────

const evalTrigger = (trigger: QuestTrigger, state: GameState): boolean => {
  switch (trigger.type) {
    case "game_start":
      return true;
    case "chapter_unlocked": {
      const cs = state.chapters?.find((c) => c.storyline === trigger.storyline);
      if (!cs) return false;
      return cs.current >= trigger.chapter || cs.completedChapters.includes(trigger.chapter);
    }
    case "quest_completed":
      return state.questRewardsClaimed?.includes(trigger.questId) ?? false;
    case "building_built": {
      const b = state.buildings.find((bb) => bb.buildingId === trigger.buildingId);
      const requiredLevel = trigger.level ?? 1;
      return (b?.level ?? 0) >= requiredLevel;
    }
    case "story_mission_completed":
      return state.completedStoryMissions?.includes(trigger.missionId) ?? false;
    case "th_level": {
      const th = state.buildings.find((bb) => bb.buildingId === "town_hall");
      return (th?.level ?? 0) >= trigger.level;
    }
    case "raid_resolved":
      return (state.raidsResolvedCount ?? 0) > 0;
    case "custom":
      return trigger.check(state);
  }
};

export function isEventTriggered(
  event: NarrativeEvent,
  state: GameState,
): boolean {
  if (event.triggers.length === 0) return false;
  if (event.requiresAll) {
    return event.triggers.every((t) => evalTrigger(t, state));
  }
  return event.triggers.some((t) => evalTrigger(t, state));
}

/** Find all events that should fire now (triggered + not yet fired). */
export function getReadyEvents(state: GameState): NarrativeEvent[] {
  const fired = new Set(state.firedEvents ?? []);
  return NARRATIVE_EVENTS.filter(
    (e) => !fired.has(e.id) && isEventTriggered(e, state),
  );
}

// ─── Event data ──────────────────────────────────────────────────

/** Custom check helper: settlement Ch.X complete. */
const settlementChapterDone = (chapter: number) =>
  ({ type: "custom", check: (s: GameState) => isChapterComplete(s, "settlement", chapter) }) as const;

export const NARRATIVE_EVENTS: NarrativeEvent[] = [
  // ── Settlement Ch.1 → Ch.2: hunters arrive ────────────────────
  // The whole Thornwood family materializes the moment they walk in — the three
  // siblings join the ADVENTURER roster (counted once, via the roster, never
  // double-counted as citizens) and the adopted boy joins the household. They
  // arrive over-cap on purpose (the tents will not hold them), which drives the
  // player to raise Houses + a Hunting Camp next. The guild still comes later
  // (event_hunters_volunteer): they are HERE now; the hall to command them is
  // what's missing.
  {
    id: "event_hunters_arriving",
    triggers: [settlementChapterDone(1)],
    banner:
      "A family walked out of the trees this morning, hunters by their gear, road-worn and asking for nothing but a place to stand. No one sent them, and no one knew they were coming. The tents we have will not hold them, and I will not turn them back into the wild.",
    unlocks: {
      // Brenna, Gareth, Godric — rostered here, not at guild_open, so their
      // hunting camp / fishing hut read as staffed the moment they're built.
      recruitPremadeIds: ["char_000", "char_005", "char_021"],
      // The adopted boy runs the camp, loud where Nell is silent; Nell barely
      // notices, absorbed in Edda's herb patch. Named resident (the household),
      // protected from RNG death, shows under "The household".
      addNamedResidents: { children: 1 },
      // What they walked here with: meat the hunters preserved on the road,
      // a few smoked fish. A buffer while the player scales production.
      addFood: { meat: 15, fish: 5 },
      // The clothes on their backs — modest, one comfort bump.
      addResources: { clothing: 1 },
    },
  },

  // ── Houses + Hunter Camp built → the guild activates ──
  // The family is already here (event_hunters_arriving). Fires once both Houses
  // and the Hunter Camp are up, activating guild Ch1 so Heroes Wanted surfaces:
  // a hall to gather the hunters in and send them out.
  {
    id: "event_hunters_volunteer",
    triggers: [
      { type: "building_built", buildingId: "hunting_camp" },
      { type: "building_built", buildingId: "houses" },
    ],
    requiresAll: true,
    banner:
      "The south is still unknown to us, and we should not stay ignorant of it for long.\n\n" +
      "But Edda is up to her elbows in herbs and Nell, Jory is married to the mill, and Tomas has barely climbed out of the quarry since we broke ground. I am not much better. Father Corin would gladly read about it, which is about the best he could offer.\n\n" +
      "The family of hunters who walked in off the road have been pacing the edge of the camp like dogs that have not been walked. They need a hall to gather in, and someone with the patience to send them out.",
    unlocks: {
      activateStoryline: { storyline: "guild", chapter: 1 },
    },
  },

  // ── Story Mission 1 complete: three reports (wolves/brigands/ruins)
  {
    id: "event_three_reports",
    triggers: [{ type: "story_mission_completed", missionId: "story_1_scouting" }],
    // The detailed wolf warning now lives in the "Hold the Treeline" quest and
    // the scouting chronicle, so this is just a short "scouts are back" beat that
    // points at the work and the southern mystery, without repeating it.
    banner:
      "The scouts are back, and their full account is in the book. It leaves us plain work to do before the season turns — and something two days south that nobody can explain.",
    unlocks: {
      activateStoryline: { storyline: "defense", chapter: 1 },
    },
  },

  // ── "Hold the Treeline" claimed → the wolves come to test the wall ──
  // The small gaunt_wolf_pack (2 gaunt wolves) is the deliberate payoff for
  // raising walls + a watchtower: winnable by Gareth at the tower alone, no
  // hired archers required. Its warning timer (raid baseWarning, adjusted by
  // watchtower level) gives the player a beat to hire or drill if they want.
  {
    id: "event_treeline_wolves",
    triggers: [{ type: "quest_completed", questId: "the_first_threat" }],
    banner:
      "The wall is barely settled on its footings when the first of them slips out of the trees — a lean grey shape, then more behind it, noses to the wind. The treeline has teeth after all. Gareth is already climbing to the watch.",
    unlocks: {
      raidSpawn: { raidId: "gaunt_wolf_pack" },
    },
  },

  // ── Settlement Ch.3 → Ch.4: outgrowing canvas ─────────────────
  // Nudges the player to raise a proper hall (upgrade TH to Village/Lv.3). Since
  // the Town Hall is no longer story-gated, a player can already BE at Village by
  // the time Ch.3 completes — so only fire this beat if they haven't outrun it.
  {
    id: "event_outgrowing_canvas",
    triggers: [
      settlementChapterDone(3),
      { type: "custom", check: (s) => (s.buildings.find((b) => b.buildingId === "town_hall")?.level ?? 0) < 3 },
    ],
    requiresAll: true,
    banner:
      "Edda calls the Town Hall \"the cupboard.\" Tents on every level stretch of ground, two wells, a mission board, and a roster I cannot hold in my head. The canvas leaks when it rains hard, the firepit is the only place we gather, and decisions made standing in the wet do not hold long. It is time to raise a proper hall.",
  },

  // ── A trader passes through → now the traveling-merchant VISIT modal
  //    (checkMerchantVisits in gameState, fires at th_level 2), which carries
  //    this beat plus instant trade. The old banner-only event_trader_visits
  //    was replaced by that two-panel visit. Pairs with merchants_welcome. ──

  // ── The brigand raid — DEFERRED (July 2026) ───────────────────
  // Disabled until the defense chapter is properly built: walls deal no damage
  // and the garrison/adventurer-assignment model is half-finished, so a raid
  // now is an unwinnable, janky first fight. The brigands stay a WATCHED threat
  // (event_three_reports foreshadows them; The First Threat is reframed as
  // prudent prep). Re-enable — and add the "walls held" overview beat — when the
  // defense system lands. See the defense-chapter progression-alignment note.
  /*
  {
    id: "event_brigand_raid",
    triggers: [
      { type: "th_level", level: 2 },
      { type: "quest_completed", questId: "the_first_threat" },
    ],
    requiresAll: true,
    banner:
      "The brigands the scouts saw are no longer waiting. A ragged column is forming at the eastern ridge, half a day off. They will be at the gate by dusk.",
    unlocks: {
      raidSpawn: { raidId: "hungry_bandits" },
    },
  },
  */
];

export function getEvent(id: string): NarrativeEvent | undefined {
  return NARRATIVE_EVENTS.find((e) => e.id === id);
}
