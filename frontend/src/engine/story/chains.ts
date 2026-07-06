// ─── Story Chains — the "director" layer ───────────────────────────
// Sequenced narrative arcs, authored as re-entrant scripts. Each chain's `run`
// is re-executed every tick: it walks its beats top-to-bottom, skips the ones
// already satisfied (progress lives in game-state flags, NOT in this function),
// and HALTS at the first `await*` whose condition isn't met yet. That makes the
// scripts save-safe (no live coroutine state to serialize) while reading like a
// straight-line sequence: "do this, wait until the player does X, now do that".
//
// Effects (fireChronicle / recruit) MUST be idempotent — they re-run every tick
// until the script advances past them. They guard on existing state so re-runs
// are no-ops.
//
// The simulation never imports this file; the director reads the sim + writes
// narrative effects, one-way. See docs (narrative systems) when written.

/** The primitives a chain script may call. `await*` suspend the script (throw
 *  the runner's halt sentinel) until their condition holds; the rest are
 *  idempotent effects. Keep this surface small — add a primitive only when a
 *  real chain needs it. */
export interface StoryChainApi {
  /** Suspend until a unique/side-chain mission has been completed. */
  awaitMissionDone(missionId: string): void;
  /** Suspend until a mission has been completed at least `count` times (uses the
   *  durable per-mission tally, so it works for repeatable missions). */
  awaitMissionCount(missionId: string, count: number): void;
  /** Suspend until at least one of these premade characters is on the roster. */
  awaitPremadePresent(premadeId: string | string[]): void;
  /** Suspend until the player has CLAIMED the given quest's reward. */
  awaitQuestClaimed(questId: string): void;
  /** Suspend until the given building is built to at least `minLevel` (default 1). */
  awaitBuilding(buildingId: string, minLevel?: number): void;
  /** Suspend until `ms` real-world time has passed since the script first
   *  reached this step. `key` disambiguates multiple delays within one chain. */
  awaitDelay(key: string, ms: number): void;
  /** Suspend until the next morning — the next 3AM-UTC boundary after the script
   *  first reached this step (the same daily clock the mission board uses). A
   *  clean "come back tomorrow" beat. `key` disambiguates within one chain. */
  awaitNextMorning(key: string): void;
  /** Fire a chronicle entry into the archive (once). */
  fireChronicle(entryId: string): void;
  /** Fire a chronicle entry AND surface it as a beat modal the moment it
   *  fires (once). Use for beats the player should see pop, not just find in
   *  the journal. Idempotent: no-op if the entry has already fired. */
  fireChronicleModal(entryId: string): void;
  /** Recruit a premade to the roster (once; no-op if already present). */
  recruit(premadeId: string): void;
}

export interface StoryChain {
  id: string;
  run: (api: StoryChainApi) => void;
}

/** Minimal structural view of game-state the runner touches (avoids importing
 *  the full GameState, keeping this module engine-dependency-free). */
export interface ChainState {
  completedUniqueMissionIds?: string[];
  missionCompletions?: Record<string, number>;
  adventurers: ReadonlyArray<{ premadeId?: string }>;
  buildings: ReadonlyArray<{ buildingId: string; level: number }>;
  questRewardsClaimed?: string[];
  chronicleEntriesFired: string[];
  /** Queue of chronicle entries waiting to pop as a beat modal (drained by the
   *  UI). Distinct from `chronicleEntriesFired` (the permanent archive). */
  pendingChronicleBeats?: string[];
  storyTimers?: Record<string, number>;
}

/** Effects the engine injects (it has nextId / buildRecruit / clothing in scope);
 *  `now` is injected so tests are deterministic. */
export interface ChainDeps {
  now: number;
  /** Build + push the premade onto the roster (+ any arrival side effects).
   *  Only called when the character isn't already present. */
  recruit: (premadeId: string) => void;
}

/** Thrown by `await*` to stop a script at its first unmet step. Caught by the
 *  runner; never escapes. */
const HALT = Symbol("story-chain-halt");

/** The next 3AM-UTC boundary strictly after `afterMs` — the daily "morning" the
 *  mission board also refreshes on. Used by awaitNextMorning. */
export function next3amUTC(afterMs: number): number {
  const d = new Date(afterMs);
  d.setUTCHours(3, 0, 0, 0);
  if (d.getTime() <= afterMs) d.setUTCDate(d.getUTCDate() + 1);
  return d.getTime();
}

/** Run every chain against the current state. Re-entrant: call once per tick.
 *  Mutates `s` (fired chronicles, timers, recruited adventurers via deps). */
export function runStoryChains(s: ChainState, chains: StoryChain[], deps: ChainDeps): void {
  for (const chain of chains) {
    const api: StoryChainApi = {
      awaitMissionDone(id) {
        if (!(s.completedUniqueMissionIds ?? []).includes(id)) throw HALT;
      },
      awaitMissionCount(id, count) {
        if ((s.missionCompletions?.[id] ?? 0) < count) throw HALT;
      },
      awaitPremadePresent(pid) {
        const ids = Array.isArray(pid) ? pid : [pid];
        if (!s.adventurers.some((a) => !!a.premadeId && ids.includes(a.premadeId))) throw HALT;
      },
      awaitQuestClaimed(questId) {
        if (!(s.questRewardsClaimed ?? []).includes(questId)) throw HALT;
      },
      awaitBuilding(buildingId, minLevel = 1) {
        const b = s.buildings.find((bb) => bb.buildingId === buildingId);
        if (!b || b.level < minLevel) throw HALT;
      },
      awaitDelay(key, ms) {
        const k = `${chain.id}:${key}`;
        s.storyTimers = s.storyTimers ?? {};
        if (s.storyTimers[k] === undefined) {
          s.storyTimers[k] = deps.now + ms;
          throw HALT;
        }
        if (deps.now < s.storyTimers[k]) throw HALT;
      },
      awaitNextMorning(key) {
        const k = `${chain.id}:${key}`;
        s.storyTimers = s.storyTimers ?? {};
        if (s.storyTimers[k] === undefined) {
          s.storyTimers[k] = next3amUTC(deps.now);
          throw HALT;
        }
        if (deps.now < s.storyTimers[k]) throw HALT;
      },
      fireChronicle(entryId) {
        if (!s.chronicleEntriesFired.includes(entryId)) s.chronicleEntriesFired.push(entryId);
      },
      fireChronicleModal(entryId) {
        if (s.chronicleEntriesFired.includes(entryId)) return; // already fired — don't re-pop
        s.chronicleEntriesFired.push(entryId);
        s.pendingChronicleBeats = s.pendingChronicleBeats ?? [];
        s.pendingChronicleBeats.push(entryId);
      },
      recruit(premadeId) {
        if (s.adventurers.some((a) => a.premadeId === premadeId)) return;
        deps.recruit(premadeId);
      },
    };
    try {
      chain.run(api);
    } catch (e) {
      if (e !== HALT) throw e;
    }
  }
}

// ─── The chains ─────────────────────────────────────────────────────

export const STORY_CHAINS: StoryChain[] = [
  // ── The guild's first hands: the Thornwoods (simple, very early) ──
  // They join via the normal arrival system (guild_open). The Chronicle beat
  // ("Two bows, a strong back, and a loud boy") lands once the settlement has
  // taken shape around them: the surplus roofed (a_roof_over_their_heads) AND
  // the hunting camp raised (where the two archers put down roots). Surfaced as
  // a beat modal so the player meets it, rather than only finding it later in
  // the journal.
  {
    id: "the_thornwoods",
    run: (api) => {
      api.awaitPremadePresent(["char_000", "char_005", "char_021"]);
      api.awaitQuestClaimed("a_roof_over_their_heads");
      api.awaitBuilding("hunting_camp");
      api.fireChronicleModal("ch1_thornwoods");
    },
  },
  // ── The Woodcutter — Hester's rescue → ghost puzzle → timed return ──
  // Beats 1 (ch1_hester_rescue) and 2a (ch1_woodcutter_ghost) fire from their
  // MISSIONS' chronicleEntryId (nicer on-claim modal surfacing). This script
  // owns the sequencing, the timed return, the recruit, and the 2b reveal.
  {
    id: "the_woodcutter",
    run: (api) => {
      api.awaitMissionDone("hester_rescue");     // Beat 1 (mission fires its chronicle)
      api.awaitMissionDone("quiet_the_woods");   // Beat 2a (mission fires its chronicle)
      api.awaitNextMorning("hesterReturn");   // she returns the next morning
      api.recruit("char_019");                   // she "returns" — Beat 2b
      api.fireChronicle("ch1_woodcutter");       // the reveal
    },
  },
  // ── The Returning Trader — Cobb keeps his word ──
  // His first pass (the modal) fired at TH2. Once the settlement can host him
  // (marketplace + tavern), the escort mission "The First Merchant" appears; on
  // completing it, the road is open — a beat modal fires, and Cobb's recurring
  // marketplace stall begins (see updateMerchantRecurrence, gated on that mission).
  {
    id: "the_returning_trader",
    run: (api) => {
      api.awaitMissionDone("merchant_escort_first");
      api.fireChronicleModal("ch1_cobb_returns");
    },
  },
  // ── The bog witch — opening drip (mystery only; the dark descent is deferred).
  // marsh_clearing (an ordinary herb-errand) → a voice in the reeds offers a
  // bargain; the barter (reeds_bargain) → the offering drifts + she mines the
  // gatherers for the settlement's secrets. Folk voice, two-track; the horror
  // (the Cabin, the letters, the child) comes later. See cast/aldith-the-bog-witch.md.
  {
    id: "the_bog_witch",
    run: (api) => {
      api.awaitMissionDone("marsh_clearing");
      api.fireChronicleModal("ch1_reeds_voice");
      api.awaitMissionDone("reeds_bargain");
      api.fireChronicleModal("ch1_reeds_price");
      // The barter becomes routine (fen_barter ×3) → the tea beat (she learns of
      // Nell, cozy on the surface). Then the asking drifts into a recipe: a
      // symbolic count of parts, shrinking in number and worsening in kind —
      // three fangs, two hooves, one skull. Each is a light card; the pattern is
      // the horror. At the skull the Lord draws a line (grain only), and the
      // decision beat fires. The dark descent stays deferred.
      api.awaitMissionCount("fen_barter", 3);
      api.fireChronicleModal("ch1_reeds_tea");
      api.awaitMissionDone("reeds_fangs");
      api.awaitMissionDone("reeds_hooves");
      api.awaitMissionDone("reeds_skull");
      api.fireChronicleModal("ch1_reeds_doubt");
    },
  },
];
