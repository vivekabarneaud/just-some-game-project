import { describe, it, expect } from "vitest";
import type { RewardType } from "@medieval-realm/shared";
import type { RewardType as FromMissions } from "@medieval-realm/shared/data/missions";

// RewardType was declared twice, byte for byte, 65 hand-synced members: once in
// shared/gameState.ts and once in shared/data/missions/types.ts. It now lives in
// shared/data/rewards.ts and both re-export it.
//
// This is a COMPILE-time test. The assignments below only typecheck while the
// two import paths resolve to the same union; if either grows its own copy
// again, `tsc --noEmit` fails here even though the runtime assertion passes.

describe("RewardType is one union, reachable from both barrels", () => {
  it("the root barrel and the missions barrel are mutually assignable", () => {
    const fromRoot: RewardType = "venison";
    const fromMissions: FromMissions = fromRoot; // fails if they diverge
    const backAgain: RewardType = fromMissions;  // fails in the other direction
    expect(backAgain).toBe("venison");
  });

  it("a member of one is a member of the other", () => {
    const samples: FromMissions[] = ["gold", "fenbalm", "saffron", "wild_fowl"];
    const asRoot: RewardType[] = samples;
    expect(asRoot).toHaveLength(4);
  });
});
