import { describe, it, expect } from "vitest";
import {
  runStoryChains,
  STORY_CHAINS,
  HESTER_RETURN_DELAY_MS,
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
    chronicleEntriesFired: [],
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
  it("the_thornwoods fires ch1_thornwoods once a Thornwood is present", () => {
    const chain = STORY_CHAINS.find((c) => c.id === "the_thornwoods")!;
    const s = makeState();
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    (s.adventurers as { premadeId?: string }[]).push({ premadeId: "char_005" });
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["ch1_thornwoods"]);
  });

  it("the_woodcutter walks rescue → patrol → delay → recruit + reveal", () => {
    const chain = STORY_CHAINS.find((c) => c.id === "the_woodcutter")!;
    const s = makeState();
    const log: string[] = [];

    // Nothing done yet.
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(log).toEqual([]);
    expect(s.chronicleEntriesFired).toEqual([]);

    // Rescue done — still awaiting the patrol.
    s.completedUniqueMissionIds = ["hester_rescue"];
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(log).toEqual([]);

    // Patrol done — the delay is stamped, she hasn't returned yet.
    s.completedUniqueMissionIds = ["hester_rescue", "quiet_the_woods"];
    runStoryChains(s, [chain], makeDeps(s, 1000, log));
    expect(s.storyTimers!["the_woodcutter:hesterReturn"]).toBe(1000 + HESTER_RETURN_DELAY_MS);
    expect(log).toEqual([]);
    expect(s.chronicleEntriesFired).toEqual([]);

    // Delay elapsed — she returns: recruited + the reveal chronicle fires.
    runStoryChains(s, [chain], makeDeps(s, 1000 + HESTER_RETURN_DELAY_MS, log));
    expect(log).toEqual(["char_019"]);
    expect(s.chronicleEntriesFired).toEqual(["ch1_woodcutter"]);

    // Replay after completion — no double recruit, no double fire.
    runStoryChains(s, [chain], makeDeps(s, 1000 + HESTER_RETURN_DELAY_MS + 5000, log));
    expect(log).toEqual(["char_019"]);
    expect(s.chronicleEntriesFired).toEqual(["ch1_woodcutter"]);
  });
});
