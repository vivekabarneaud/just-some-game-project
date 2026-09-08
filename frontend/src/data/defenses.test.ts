import { describe, it, expect } from "vitest";
import { availableCitizens,
  militiaCount,
  trainerHome,
  TRAINER_ID,
  getWatchtowerArcherCap,
  getBarracksSoldierCap,
} from "./defenses";
import type { GameState } from "~/engine/gameState";

// Minimal GameState stub — only the fields the pure helpers touch.
const stateWith = (over: Partial<GameState>): GameState =>
  ({
    citizens: { toddlers: 0, children: 0, adults: 0, elderly: 0 },
    namedResidents: { toddlers: 0, children: 1, adults: 2, elderly: 2 },
    soldiers: 0,
    archers: 0,
    adventurers: [],
    ...over,
  } as unknown as GameState);

const adv = (over: Record<string, unknown>) =>
  ({ id: "a1", alive: true, onMission: false, premadeId: undefined, ...over }) as any;

describe("availableCitizens", () => {
  it("reserves the household's adults from the muster", () => {
    // 5 adults, household reserves 2 → 3 conscriptable.
    const s = stateWith({ citizens: { toddlers: 0, children: 0, adults: 5, elderly: 0 } });
    expect(availableCitizens(s)).toBe(3);
  });

  it("subtracts already-committed soldiers and archers too", () => {
    const s = stateWith({
      citizens: { toddlers: 0, children: 0, adults: 6, elderly: 0 },
      soldiers: 1,
      archers: 1,
    });
    // 6 - 1 - 1 - 2 (household) = 2
    expect(availableCitizens(s)).toBe(2);
  });

  it("never goes negative (all adults are household founders)", () => {
    const s = stateWith({ citizens: { toddlers: 0, children: 0, adults: 2, elderly: 0 } });
    expect(availableCitizens(s)).toBe(0);
  });

  it("militiaCount matches availableCitizens", () => {
    const s = stateWith({ citizens: { toddlers: 0, children: 0, adults: 4, elderly: 0 } });
    expect(militiaCount(s)).toBe(availableCitizens(s));
  });
});

describe("trainerHome", () => {
  it("true when the matching trainer is alive and not on a mission", () => {
    const advs = [adv({ premadeId: TRAINER_ID.watchtower })];
    expect(trainerHome(advs, "watchtower")).toBe(true);
  });

  it("false while the trainer is away on a mission", () => {
    const advs = [adv({ premadeId: TRAINER_ID.watchtower, onMission: true })];
    expect(trainerHome(advs, "watchtower")).toBe(false);
  });

  it("false when the trainer is dead or not present", () => {
    expect(trainerHome([adv({ premadeId: TRAINER_ID.watchtower, alive: false })], "watchtower")).toBe(false);
    expect(trainerHome([], "watchtower")).toBe(false);
  });

  it("keys off the right trainer per building (Gareth vs Morgause)", () => {
    const gareth = [adv({ premadeId: TRAINER_ID.watchtower })];
    expect(trainerHome(gareth, "watchtower")).toBe(true);
    expect(trainerHome(gareth, "barracks")).toBe(false); // Gareth doesn't man the barracks
  });
});

describe("garrison caps rise with building level", () => {
  it("more capacity at higher levels; barracks denser than towers", () => {
    expect(getWatchtowerArcherCap(2)).toBeGreaterThan(getWatchtowerArcherCap(1));
    expect(getBarracksSoldierCap(2)).toBeGreaterThan(getBarracksSoldierCap(1));
    expect(getBarracksSoldierCap(1)).toBeGreaterThanOrEqual(getWatchtowerArcherCap(1));
  });
});
