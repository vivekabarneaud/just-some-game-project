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
  {
    id: "event_hunters_arriving",
    triggers: [settlementChapterDone(1)],
    banner:
      "A family walked out of the trees this morning, hunters by their gear, road-worn and asking for nothing but a place to stand. No one sent them, and no one knew they were coming. The tents we have will not hold them, and I will not turn them back into the wild.",
  },

  // ── Houses + Hunter Camp built → the family settles, guild activates ──
  // Fires once both Houses (somewhere for them to sleep) and Hunter Camp
  // (so their bows have a base) are built. The family actually
  // materializes on the population counter, and guild Ch1 activates so
  // Heroes Wanted surfaces — gives the player a juicier parallel track
  // alongside the lower-stakes Pantry quest.
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
      // The Thornwood family: three siblings (Brenna, Gareth, Godric = 3 adults)
      // and their adopted boy (1 child). The boy runs the camp, loud where Nell
      // is silent; Nell barely notices, absorbed in Edda's herb patch.
      addCitizens: { adults: 3, children: 1 },
      // What they walked here with: meat the hunters preserved on the road,
      // a few smoked fish. Not enough to cover the food curve for long,
      // just a buffer while the player scales production.
      addFood: { meat: 15, fish: 5 },
      // The clothes on their backs — modest, just enough to bump comforts
      // by one. They walked here with what they could carry, not a wardrobe.
      addResources: { clothing: 1 },
    },
  },

  // ── Story Mission 1 complete: three reports (wolves/brigands/ruins)
  {
    id: "event_three_reports",
    triggers: [{ type: "story_mission_completed", missionId: "story_1_scouting" }],
    banner:
      "The scouts came back with three reports. A wolf pack on the ridge. A band of brigands camped two ridges east, watching us. And an abandoned watchtower, a day's march south, that nobody can explain.",
    unlocks: {
      activateStoryline: { storyline: "defense", chapter: 1 },
    },
  },

  // ── Settlement Ch.3 → Ch.4: outgrowing canvas ─────────────────
  {
    id: "event_outgrowing_canvas",
    triggers: [settlementChapterDone(3)],
    banner:
      "Edda calls the Town Hall \"the cupboard.\" Tents on every level stretch of ground, two wells, a mission board, and a roster I cannot hold in my head. The canvas leaks when it rains hard, the firepit is the only place we gather, and decisions made standing in the wet do not hold long. It is time to raise a proper hall.",
  },

  // ── The deferred brigand raid ─────────────────────────────────
  // Fires when the player has reached TH 2 AND has built walls AND game has run
  // long enough. The brigand-sighting (the_first_threat quest) gives the
  // player time to prepare; this is when the brigands actually arrive.
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
      // Spawn the camp-tier brigand raid that the_first_threat warned about.
      // hungry_bandits matches the narrative: "poorly equipped, desperate".
      raidSpawn: { raidId: "hungry_bandits" },
    },
  },
];

export function getEvent(id: string): NarrativeEvent | undefined {
  return NARRATIVE_EVENTS.find((e) => e.id === id);
}
