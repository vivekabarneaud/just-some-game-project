import { describe, it, expect } from "vitest";
import {
  runStoryChains,
  STORY_CHAINS,
  type StoryChain,
  type ChainState,
  type ChainDeps,
} from "./chains";

// Pure-runner tests — the over-fit guard for the director layer. They exercise
// the primitives against synthetic scripts + the real chains, and pin the two
// properties the whole pattern relies on: it HALTS at unmet awaits, and every
// effect is idempotent under replay (the runner re-runs each chain every tick).

function makeState(over: Partial<ChainState> = {}): ChainState {
  return {
    completedUniqueMissionIds: [],
    adventurers: [],
    buildings: [],
    questRewardsClaimed: [],
    chronicleEntriesFired: [],
    pendingChronicleBeats: [],
    storyTimers: {},
    ...over,
  };
}

/** Deps whose `recruit` also reflects the join into `s.adventurers`, so the
 *  runner's "already present?" guard sees it on the next run (mirrors the real
 *  engine, which pushes onto state.adventurers). */
function makeDeps(s: ChainState, now: number, log: string[]): ChainDeps {
  return {
    now,
    recruit: (pid) => {
      log.push(pid);
      (s.adventurers as { premadeId?: string }[]).push({ premadeId: pid });
    },
  };
}

describe("runStoryChains — primitives", () => {
  it("awaitMissionDone halts until the mission is done, then fires", () => {
    const chain: StoryChain = { id: "t", run: (a) => { a.awaitMissionDone("m1"); a.fireChronicle("c1"); } };
    const s = makeState();
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]); // halted

    s.completedUniqueMissionIds = ["m1"];
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["c1"]);
  });

  it("is idempotent under replay — no double-fire", () => {
    const chain: StoryChain = { id: "t", run: (a) => { a.fireChronicle("c1"); } };
    const s = makeState();
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["c1"]);
  });

  it("awaitDelay stamps a deadline, halts until real time passes it", () => {
    const chain: StoryChain = { id: "d", run: (a) => { a.awaitDelay("k", 1000); a.fireChronicle("done"); } };
    const s = makeState();

    runStoryChains(s, [chain], makeDeps(s, 0, []));       // first reach: stamp + halt
    expect(s.storyTimers!["d:k"]).toBe(1000);
    expect(s.chronicleEntriesFired).toEqual([]);

    runStoryChains(s, [chain], makeDeps(s, 999, []));     // before deadline
    expect(s.chronicleEntriesFired).toEqual([]);

    runStoryChains(s, [chain], makeDeps(s, 1000, []));    // at deadline
    expect(s.chronicleEntriesFired).toEqual(["done"]);
  });

  it("awaitPremadePresent halts until one of the ids is on the roster", () => {
    const chain: StoryChain = { id: "p", run: (a) => { a.awaitPremadePresent(["cX", "cY"]); a.fireChronicle("hi"); } };
    const s = makeState();
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    (s.adventurers as { premadeId?: string }[]).push({ premadeId: "cY" });
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["hi"]);
  });

  it("awaitQuestClaimed halts until the quest reward is claimed", () => {
    const chain: StoryChain = { id: "q", run: (a) => { a.awaitQuestClaimed("q1"); a.fireChronicle("c1"); } };
    const s = makeState();
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    s.questRewardsClaimed = ["q1"];
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["c1"]);
  });

  it("awaitBuilding halts until the building reaches the level", () => {
    const chain: StoryChain = { id: "b", run: (a) => { a.awaitBuilding("hut", 2); a.fireChronicle("c1"); } };
    const s = makeState();
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    (s.buildings as { buildingId: string; level: number }[]).push({ buildingId: "hut", level: 1 });
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]); // level too low

    (s.buildings as { buildingId: string; level: number }[])[0].level = 2;
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["c1"]);
  });

  it("fireChronicleModal archives AND enqueues a beat, once", () => {
    const chain: StoryChain = { id: "m", run: (a) => { a.fireChronicleModal("c1"); } };
    const s = makeState();
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["c1"]);
    expect(s.pendingChronicleBeats).toEqual(["c1"]);

    // Replay: already archived — no double-enqueue.
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.pendingChronicleBeats).toEqual(["c1"]);
  });

  it("recruit fires once, then no-ops (guarded on presence)", () => {
    const chain: StoryChain = { id: "r", run: (a) => { a.recruit("cZ"); } };
    const s = makeState();
    const log: string[] = [];
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(log).toEqual(["cZ"]);
  });

  it("a chain that halts does not block a later chain in the list", () => {
    const chains: StoryChain[] = [
      { id: "blocked", run: (a) => { a.awaitMissionDone("never"); a.fireChronicle("nope"); } },
      { id: "free", run: (a) => { a.fireChronicle("yes"); } },
    ];
    const s = makeState();
    runStoryChains(s, chains, makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["yes"]);
  });
});

describe("real chains", () => {
  it("the_thornwoods fires ch1_thornwoods (as a beat modal) once the Thornwoods are present, the roof quest is claimed, and the hunting camp is built", () => {
    const chain = STORY_CHAINS.find((c) => c.id === "the_thornwoods")!;
    const s = makeState();

    // No one present yet.
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    // Thornwoods arrive — still awaiting the settlement to take shape.
    (s.adventurers as { premadeId?: string }[]).push({ premadeId: "char_005" });
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    // Roof quest claimed — still awaiting the hunting camp.
    s.questRewardsClaimed = ["a_roof_over_their_heads"];
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    // Hunting camp raised — the beat lands, archived AND queued as a modal.
    (s.buildings as { buildingId: string; level: number }[]).push({ buildingId: "hunting_camp", level: 1 });
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["ch1_thornwoods"]);
    expect(s.pendingChronicleBeats).toEqual(["ch1_thornwoods"]);
  });

  it("the_woodcutter walks rescue → patrol → next morning → recruit + reveal", () => {
    const chain = STORY_CHAINS.find((c) => c.id === "the_woodcutter")!;
    const s = makeState();
    const log: string[] = [];
    const now0 = Date.UTC(2026, 6, 6, 15, 0, 0); // some afternoon

    // Nothing done yet.
    runStoryChains(s, [chain], makeDeps(s, now0, log));
    expect(log).toEqual([]);
    expect(s.chronicleEntriesFired).toEqual([]);

    // Rescue done — still awaiting the patrol.
    s.completedUniqueMissionIds = ["hester_rescue"];
    runStoryChains(s, [chain], makeDeps(s, now0, log));
    expect(log).toEqual([]);

    // Patrol done — the "next morning" deadline is stamped (a future 3AM), no return yet.
    s.completedUniqueMissionIds = ["hester_rescue", "quiet_the_woods"];
    runStoryChains(s, [chain], makeDeps(s, now0, log));
    const deadline = s.storyTimers!["the_woodcutter:hesterReturn"];
    expect(deadline).toBeGreaterThan(now0);
    expect(new Date(deadline).getUTCHours()).toBe(3); // it's a 3AM boundary
    expect(log).toEqual([]);
    expect(s.chronicleEntriesFired).toEqual([]);

    // Just before morning — still waiting.
    runStoryChains(s, [chain], makeDeps(s, deadline - 1, log));
    expect(log).toEqual([]);

    // Morning arrives — she returns: recruited + the reveal chronicle fires.
    runStoryChains(s, [chain], makeDeps(s, deadline, log));
    expect(log).toEqual(["char_019"]);
    expect(s.chronicleEntriesFired).toEqual(["ch1_woodcutter"]);

    // Replay after completion — no double recruit, no double fire.
    runStoryChains(s, [chain], makeDeps(s, deadline + 5000, log));
    expect(log).toEqual(["char_019"]);
    expect(s.chronicleEntriesFired).toEqual(["ch1_woodcutter"]);
  });

  it("the_returning_trader fires the return beat once the escort mission is done", () => {
    const chain = STORY_CHAINS.find((c) => c.id === "the_returning_trader")!;
    const s = makeState();

    // Escort not done — nothing yet.
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);
    expect(s.pendingChronicleBeats).toEqual([]);

    // Escort completed — the "road opens" beat fires as a modal.
    s.completedUniqueMissionIds = ["merchant_escort_first"];
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["ch1_cobb_returns"]);
    expect(s.pendingChronicleBeats).toEqual(["ch1_cobb_returns"]);

    // Replay — no double fire.
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.pendingChronicleBeats).toEqual(["ch1_cobb_returns"]);
  });
});
