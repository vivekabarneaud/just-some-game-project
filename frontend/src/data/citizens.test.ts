import { describe, it, expect } from "vitest";
import { type CitizenCounts,
  totalPopulation,
  effectiveFoodMouths,
  founderCitizens,
  founderHousehold,
  reduceByPriority,
  applySurvivalRatio,
  ageStep,
} from "./citizens";

describe("totalPopulation", () => {
  it("sums every category", () => {
    expect(totalPopulation({ toddlers: 1, children: 2, adults: 3, elderly: 4 })).toBe(10);
  });
});

describe("effectiveFoodMouths", () => {
  it("weights each category (0.5 / 0.75 / 1.0 / 0.75)", () => {
    // 4*0.5 + 4*0.75 + 10*1.0 + 4*0.75 = 2 + 3 + 10 + 3 = 18
    expect(effectiveFoodMouths({ toddlers: 4, children: 4, adults: 10, elderly: 4 })).toBe(18);
  });
});

describe("founder shape", () => {
  it("founderCitizens and founderHousehold are the same {0,1,3,2}", () => {
    // Six founders: the Lord + Jory + Tomas (adults), Edda + Corin (elderly),
    // Nell (child). The Lord is a counted resident, never a drafted worker.
    const expected: CitizenCounts = { toddlers: 0, children: 1, adults: 3, elderly: 2 };
    expect(founderCitizens()).toEqual(expected);
    expect(founderHousehold()).toEqual(expected);
  });
});

describe("reduceByPriority", () => {
  it("draws from categories in the given priority order", () => {
    // default priority: adults, elderly, children, toddlers
    const out = reduceByPriority({ toddlers: 5, children: 5, adults: 5, elderly: 5 }, 3);
    expect(out).toEqual({ toddlers: 5, children: 5, adults: 2, elderly: 5 });
  });

  it("spills into the next category once the first is exhausted", () => {
    const out = reduceByPriority({ toddlers: 5, children: 5, adults: 5, elderly: 5 }, 7);
    // 5 adults gone, then 2 elderly
    expect(out).toEqual({ toddlers: 5, children: 5, adults: 0, elderly: 3 });
  });

  it("returns the input unchanged for count <= 0", () => {
    const c = { toddlers: 1, children: 1, adults: 1, elderly: 1 };
    expect(reduceByPriority(c, 0)).toEqual(c);
  });

  it("never drops any category below the floor, even under massive attrition", () => {
    // This is the guard the named-residents / founder protection relies on.
    const out = reduceByPriority(
      { toddlers: 0, children: 3, adults: 5, elderly: 2 },
      100,
      ["adults", "elderly", "children", "toddlers"],
      founderHousehold(),
    );
    expect(out).toEqual(founderHousehold());
  });
});

describe("applySurvivalRatio", () => {
  it("scales every category by the ratio (floored)", () => {
    expect(applySurvivalRatio({ toddlers: 0, children: 0, adults: 10, elderly: 0 }, 0.5))
      .toEqual({ toddlers: 0, children: 0, adults: 5, elderly: 0 });
  });

  it("respects the floor — famine can't wipe the protected cohort", () => {
    const out = applySurvivalRatio({ toddlers: 0, children: 1, adults: 2, elderly: 2 }, 0, founderHousehold());
    expect(out).toEqual(founderHousehold());
  });
});

describe("ageStep", () => {
  it("graduates cohorts by the fixed rates and conserves total minus deaths", () => {
    const before: CitizenCounts = { toddlers: 8, children: 10, adults: 50, elderly: 20 };
    const { next, graduated, deaths } = ageStep(before);
    // tToC=round(2)=2, cToA=round(1)=1, aToE=round(1)=1, deaths=round(1)=1
    expect(graduated).toEqual({ toddlerToChild: 2, childToAdult: 1, adultToElderly: 1 });
    expect(deaths).toBe(1);
    expect(next).toEqual({ toddlers: 6, children: 11, adults: 50, elderly: 20 });
    expect(totalPopulation(next)).toBe(totalPopulation(before) - deaths);
  });
});
