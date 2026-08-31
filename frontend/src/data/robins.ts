// ─── Robin events ──────────────────────────────────────────────
// Story-driven "the morning after" events that fire after specific story
// missions. Each robin lands as a sidebar banner; clicking it opens a
// chronicle entry and applies unlocks (recipes, cast fragments, etc.).
//
// First instance: robin_first, fires after story_4_captains_rest. Future
// robins reuse the same shape — define the event, the engine handles it.

import { createSignal } from "solid-js";
import type { ChronicleEntry } from "./chronicle_entries";

export interface RobinUnlocks {
  /** Alchemy recipe IDs to add to state.discoveredRecipes. */
  recipes?: string[];
  /** Founding-cast bio fragment IDs to surface — extension point. */
  cast?: string[];
  /** Quest IDs to unlock — extension point. */
  quests?: string[];
}

export interface RobinEvent {
  id: string;
  /** Story mission id whose claim triggers this robin. */
  triggerAfter: string;
  /** Subtle one-line copy shown on the sidebar pill. */
  bannerText: string;
  /** Chronicle entry opened when the player clicks the pill. */
  chronicleEntryId: string;
  /** Optional unlocks applied on click. */
  unlocks?: RobinUnlocks;
}

const ROBIN_EVENTS: RobinEvent[] = [
  {
    id: "robin_first",
    triggerAfter: "story_4_captains_rest",
    bannerText: "A robin landed on the watchtower this morning.",
    chronicleEntryId: "ch1_first_robin",
    unlocks: {
      recipes: ["wraithwound_salve"],
    },
  },
  // Dev-only placeholder. triggerAfter is a sentinel that no story mission
  // matches, so it never spawns naturally — only via the devTriggerRobin
  // action. Reuses ch1_first_robin's chronicle entry so the modal has content.
  {
    id: "robin_dev",
    triggerAfter: "__dev_only_never_triggers__",
    bannerText: "[DEV] A test robin landed with a placeholder message.",
    chronicleEntryId: "ch1_first_robin",
  },
];

export function getRobinEvent(id: string): RobinEvent | undefined {
  return ROBIN_EVENTS.find((r) => r.id === id);
}

/** Robin event whose trigger matches a given story mission id, if any.
 *  Used by the engine on story-mission claim. */
export function getRobinForStoryMission(missionId: string): RobinEvent | undefined {
  return ROBIN_EVENTS.find((r) => r.triggerAfter === missionId);
}

// ─── Cross-component UI signal ──────────────────────────────────
// Global signal so the robin pill (in Sidebar) can pop the chronicle modal
// (rendered in App) without prop-drilling. Same pattern as the garrison
// detail modal in Defenses.

export const [openChronicleEntry, setOpenChronicleEntry] = createSignal<ChronicleEntry | null>(null);
