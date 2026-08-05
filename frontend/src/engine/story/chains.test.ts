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
    unlockSeed: (vid) => log.push(`seed:${vid}`),
    unlockRecipe: (rid) => log.push(`recipe:${rid}`),
    assignDogToFold: (name) => log.push(`fold:${name}`),
    woundDog: (name, ailmentId) => log.push(`wound:${name}:${ailmentId}`),
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

  it("awaitSeason halts until season AND year are both met", () => {
    const chain: StoryChain = { id: "t", run: (a) => { a.awaitSeason("summer", 2); a.fireChronicle("c1"); } };
    const s = makeState({ season: "spring", year: 1 });
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]); // wrong season + wrong year

    s.season = "summer"; // right season, still year 1
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]); // year too early

    s.year = 2; // summer, year 2 — fires
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["c1"]);
  });

  it("the strawberry patch: village + season gate → worry → mission → found → seed unlock", () => {
    const log: string[] = [];
    const chain = STORY_CHAINS.find((c) => c.id === "the_strawberry_patch")!;
    const s = makeState({ season: "summer", year: 2 });

    // Summer + year 2, but still a tiny camp (no Village) — held on the Town Hall gate.
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(s.chronicleEntriesFired).toEqual([]);

    // Grown to a Village (Town Hall 3) — now the worry beat fires.
    (s.buildings as { buildingId: string; level: number }[]).push({ buildingId: "town_hall", level: 3 });
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(s.chronicleEntriesFired).toEqual(["ch2_nell_wandering"]); // worry fired, waiting on the mission
    expect(log).not.toContain("seed:strawberries");

    s.completedUniqueMissionIds = ["find_nell"];
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(s.chronicleEntriesFired).toContain("ch2_nell_found");
    expect(log).toContain("seed:strawberries");
    expect(log).toContain("recipe:strawberry_jam");
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

  it("awaitMissionCount halts until the durable tally reaches the count", () => {
    const chain: StoryChain = { id: "t", run: (a) => { a.awaitMissionCount("m1", 3); a.fireChronicle("c1"); } };
    const s = makeState({ missionCompletions: { m1: 2 } });
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);       // 2 < 3, still halted

    s.missionCompletions = { m1: 3 };
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["c1"]);   // reached the count
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
  it("the_thornwoods fires ch1_thornwoods (as a beat modal) once the Thornwoods are present and the merged 'A Home for the Hunters' quest is claimed", () => {
    const chain = STORY_CHAINS.find((c) => c.id === "the_thornwoods")!;
    const s = makeState();

    // No one present yet.
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    // Thornwoods arrive — still awaiting the family to be settled.
    (s.adventurers as { premadeId?: string }[]).push({ premadeId: "char_005" });
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    // The merged settle-the-family quest is claimed (its own condition already
    // required houses AND the hunting camp) — the beat lands, archived AND queued.
    s.questRewardsClaimed = ["a_roof_over_their_heads"];
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

  it("the_poisoner_and_the_gambler: settle beat on join, reflection next morning", () => {
    const chain = STORY_CHAINS.find((c) => c.id === "the_poisoner_and_the_gambler")!;
    const s = makeState();
    const now0 = Date.UTC(2026, 6, 6, 15, 0, 0);

    // Not present yet.
    runStoryChains(s, [chain], makeDeps(s, now0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    // Elspeth + Edmund join (together, via A Mother's Errand) — settle beat fires.
    (s.adventurers as { premadeId?: string }[]).push({ premadeId: "char_007" }, { premadeId: "char_009" });
    runStoryChains(s, [chain], makeDeps(s, now0, []));
    expect(s.chronicleEntriesFired).toEqual(["ch2_mothers_errand"]);
    const deadline = s.storyTimers!["the_poisoner_and_the_gambler:elspethReflect"];
    expect(deadline).toBeGreaterThan(now0);

    // Before morning — no second beat.
    runStoryChains(s, [chain], makeDeps(s, deadline - 1, []));
    expect(s.chronicleEntriesFired).toEqual(["ch2_mothers_errand"]);

    // Next morning — the reflection lands.
    runStoryChains(s, [chain], makeDeps(s, deadline, []));
    expect(s.chronicleEntriesFired).toEqual(["ch2_mothers_errand", "ch2_whose_blood"]);
  });

  it("the_bog_witch: bargain beat after clearing, price beat after the barter", () => {
    const chain = STORY_CHAINS.find((c) => c.id === "the_bog_witch")!;
    const s = makeState();

    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([]);

    // Cleared the adders + got fenbalm — the bargaining voice beat lands.
    s.completedUniqueMissionIds = ["marsh_clearing"];
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["ch1_reeds_voice"]);

    // Paid the offering (the barter) — the "what it cost" beat lands.
    s.completedUniqueMissionIds = ["marsh_clearing", "reeds_bargain"];
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["ch1_reeds_voice", "ch1_reeds_price"]);

    // Two routine barters — not yet three, so the drift beat holds.
    s.missionCompletions = { fen_barter: 2 };
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual(["ch1_reeds_voice", "ch1_reeds_price"]);

    // Third routine barter — the tea beat lands (she learns of Nell); the drift
    // asks (tusks → hooves → skull) hold until each is delivered in turn.
    s.missionCompletions = { fen_barter: 3 };
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toContain("ch1_reeds_tea");
    expect(s.chronicleEntriesFired).not.toContain("ch1_reeds_doubt");

    // Fangs then hooves delivered — still no decision beat until the skull.
    s.completedUniqueMissionIds = ["marsh_clearing", "reeds_bargain", "reeds_tusks", "reeds_hooves"];
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).not.toContain("ch1_reeds_doubt");

    // Skull delivered — the line-drawing beat lands.
    s.completedUniqueMissionIds = ["marsh_clearing", "reeds_bargain", "reeds_tusks", "reeds_hooves", "reeds_skull"];
    runStoryChains(s, [chain], makeDeps(s, 0, []));
    expect(s.chronicleEntriesFired).toEqual([
      "ch1_reeds_voice", "ch1_reeds_price", "ch1_reeds_tea", "ch1_reeds_doubt",
    ]);
  });
});

describe("the_stonebridges — Aldwin arrives after Slow Venom; Magnus unlocks later", () => {
  const chain = STORY_CHAINS.find((c) => c.id === "the_stonebridges")!;
  const loyaltyOf = (s: ChainState, pid: string, v: number) => {
    const a = (s.adventurers as { premadeId?: string; loyalty?: number }[]).find((x) => x.premadeId === pid);
    if (a) a.loyalty = v;
  };

  it("halts until slow_venom is claimed", () => {
    const s = makeState();
    const log: string[] = [];
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(log).toEqual([]); // nothing yet
    expect(s.chronicleEntriesFired).toEqual([]);
  });

  it("Aldwin arrives on slow_venom; Magnus stays hidden behind the Bad Blood gate", () => {
    const s = makeState({ questRewardsClaimed: ["slow_venom"] });
    const log: string[] = [];

    // Arrival: Aldwin recruited + the gate beat, nothing further (loyalty 0).
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(log).toEqual(["char_017"]);
    expect(s.chronicleEntriesFired).toEqual(["ch1_stonebridge_arrival"]);

    // A few missions in (loyalty 8): the Lord's hunch fires.
    loyaltyOf(s, "char_017", 8);
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(s.chronicleEntriesFired).toContain("ch1_stonebridge_hunch");

    // Even at Familiar (15) the confession is HELD behind the Ch2 miracle
    // sentinel, so Magnus does not unlock yet.
    loyaltyOf(s, "char_017", 15);
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(s.chronicleEntriesFired).not.toContain("ch1_stonebridge_confession");
    expect(log).toEqual(["char_017"]); // Magnus not yet unlocked

    // Once the (placeholder) Ch2 miracle gate clears, the tail runs: confession,
    // Magnus joins, plea + aftermath.
    s.completedUniqueMissionIds = ["__aldwin_ch2_miracle_gate__"];
    runStoryChains(s, [chain], makeDeps(s, 0, log));
    expect(log).toEqual(["char_017", "char_029"]); // Magnus unlocked
    expect(s.chronicleEntriesFired).toEqual([
      "ch1_stonebridge_arrival",
      "ch1_stonebridge_hunch",
      "ch1_stonebridge_confession",
      "ch1_stonebridge_plea",
      "ch1_stonebridge_aftermath",
    ]);
  });
});
