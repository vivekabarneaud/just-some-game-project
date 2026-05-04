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
      "A raven arrived from the Crown's land office this morning. Two more families are on the road, due within the week. The tents will not hold them.",
  },

  // ── Settlement Ch.2 → guild Ch.1: hunters volunteer to scout ──
  {
    id: "event_hunters_volunteer",
    triggers: [settlementChapterDone(2)],
    banner:
      "Some of the hunters who arrived are restless. Two of them want to scout the south for whatever is out there. They are asking for somewhere to gather, and someone to send them.",
    unlocks: {
      activateStoryline: { storyline: "guild", chapter: 1 },
    },
  },

  // ── Story Mission 1 complete: three reports (wolves/brigands/ruins)
  {
    id: "event_three_reports",
    triggers: [{ type: "story_mission_completed", missionId: "story_1_scouting" }],
    banner:
      "The scouts came back with three reports. A wolf pack on the ridge. A band of brigands camped two ridges east, watching us. And ruins, a day's march south, that nobody can explain.",
    unlocks: {
      activateStoryline: { storyline: "defense", chapter: 1 },
    },
  },

  // ── Settlement Ch.3 → Ch.4: outgrowing canvas ─────────────────
  {
    id: "event_outgrowing_canvas",
    triggers: [settlementChapterDone(3)],
    banner:
      "Edda calls the Town Hall \"the cupboard.\" Tents on every level stretch of ground. Two wells. A shrine. A mission board. The canvas will not last another winter. It is time to raise a proper hall.",
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
  },
];

export function getEvent(id: string): NarrativeEvent | undefined {
  return NARRATIVE_EVENTS.find((e) => e.id === id);
}
