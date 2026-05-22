// ─── Citizen categories (Phase B) ──────────────────────────────
// Per-category population state. Replaces the old scalar `state.population`
// with a breakdown that maps onto recognisable life stages — toddlers / kids
// / adults / elderly. Combat eligibility, food consumption, and growth events
// all derive from this shape; the topbar dropdown surfaces the breakdown for
// the player.
//
// See docs/DESIGN_CITIZEN_CATEGORIES.md for the full design.

export interface CitizenCounts {
  toddlers: number;  // 0-4 years, 0.5× food, no combat
  children: number;  // 5-15 years, 0.75× food, no combat
  adults: number;    // 16-60 years, 1.0× food, COMBAT-ELIGIBLE (the labor/military pool)
  elderly: number;   // 61+ years, 0.75× food, no combat
}

export type CitizenCategory = keyof CitizenCounts;

export const CITIZEN_CATEGORIES: CitizenCategory[] = ["toddlers", "children", "adults", "elderly"];

/** Display metadata for the topbar / event log. */
export const CITIZEN_META: Record<CitizenCategory, { icon: string; label: string; singular: string }> = {
  toddlers: { icon: "👶", label: "toddlers", singular: "toddler" },
  children: { icon: "🧒", label: "children",  singular: "child"   },
  adults:   { icon: "🧑", label: "adults",    singular: "adult"   },
  elderly:  { icon: "👵", label: "elderly",   singular: "elder"   },
};

/** Per-category food multiplier applied to FOOD_PER_CITIZEN_PER_HOUR. */
export const FOOD_MULTIPLIER: Record<CitizenCategory, number> = {
  toddlers: 0.5,
  children: 0.75,
  adults: 1.0,
  elderly: 0.75,
};

/** Empty cohort — used for fresh state and as a fallback. */
export function emptyCitizens(): CitizenCounts {
  return { toddlers: 0, children: 0, adults: 0, elderly: 0 };
}

/** Founder mapping — bio-accurate slice of the 5 starting characters.
 *  Edda (71) + Father Corin (68) elderly. Jory (36) + Tomas (48) adults.
 *  Nell (11) child. */
export function founderCitizens(): CitizenCounts {
  return { toddlers: 0, children: 1, adults: 2, elderly: 2 };
}

/** Per-category floor that protects the founding cast from ever being
 *  silently killed by starvation, freezing, raids, or unhappiness-departure.
 *  Same shape as founderCitizens — Nell, Jory, Tomas, Edda, Corin will
 *  always survive until the named-founder rework lets them die for real
 *  story reasons. Passed to reduceByPriority as the `floor` argument. */
export const FOUNDER_FLOOR: Partial<CitizenCounts> = {
  toddlers: 0,
  children: 1,
  adults: 2,
  elderly: 2,
};

/** Total population — what `state.population` used to be. */
export function totalPopulation(c: CitizenCounts): number {
  return c.toddlers + c.children + c.adults + c.elderly;
}

/** Effective food-mouth count: weighted sum where each category eats more or
 *  less than a baseline adult. Multiply by FOOD_PER_CITIZEN_PER_HOUR for the
 *  per-hour consumption. */
export function effectiveFoodMouths(c: CitizenCounts): number {
  return (
    c.toddlers * FOOD_MULTIPLIER.toddlers +
    c.children * FOOD_MULTIPLIER.children +
    c.adults * FOOD_MULTIPLIER.adults +
    c.elderly * FOOD_MULTIPLIER.elderly
  );
}

/** Apply a survival ratio (0..1) to every category, flooring to keep counts
 *  integer. Used for famine / freeze / unhappiness — losses spread across
 *  the whole population uniformly.
 *
 *  Optional `floor` clamps each category from below: useful with
 *  FOUNDER_FLOOR so the founding cast (Nell, Jory, Tomas, Edda, Corin)
 *  is never silently killed by ratio-based attrition. */
export function applySurvivalRatio(c: CitizenCounts, ratio: number, floor: Partial<CitizenCounts> = {}): CitizenCounts {
  const r = Math.max(0, Math.min(1, ratio));
  return {
    toddlers: Math.max(floor.toddlers ?? 0, Math.floor(c.toddlers * r)),
    children: Math.max(floor.children ?? 0, Math.floor(c.children * r)),
    adults: Math.max(floor.adults ?? 0, Math.floor(c.adults * r)),
    elderly: Math.max(floor.elderly ?? 0, Math.floor(c.elderly * r)),
  };
}

/** Subtract `count` citizens, drawing from categories in priority order.
 *  Used by raid casualties (defenders die first → adults, then elderly,
 *  children, toddlers). Returns a NEW counts object. */
export function reduceByPriority(
  c: CitizenCounts,
  count: number,
  priority: CitizenCategory[] = ["adults", "elderly", "children", "toddlers"],
  floor: Partial<CitizenCounts> = {},
): CitizenCounts {
  if (count <= 0) return c;
  const out: CitizenCounts = { ...c };
  let remaining = count;
  for (const cat of priority) {
    if (remaining <= 0) break;
    const floorVal = floor[cat] ?? 0;
    const reducible = Math.max(0, out[cat] - floorVal);
    const take = Math.min(reducible, remaining);
    out[cat] -= take;
    remaining -= take;
  }
  return out;
}

// ─── Migration ──────────────────────────────────────────────────
// Converts a legacy scalar `population` into a CitizenCounts breakdown.
//   - Exactly 5 → assume starter game, apply the founder mapping.
//   - Otherwise apply default 60/20/12/8 split (adults / children / elderly / toddlers).
// Total is preserved.

const DEFAULT_SPLIT: Record<CitizenCategory, number> = {
  adults: 0.6, children: 0.2, elderly: 0.12, toddlers: 0.08,
};

export function migrateLegacyPopulation(legacy: number): CitizenCounts {
  const total = Math.max(0, Math.floor(legacy));
  if (total === 5) return founderCitizens();
  // Floor each category, then dump the rounding remainder into adults so
  // the total matches exactly.
  const tod = Math.floor(total * DEFAULT_SPLIT.toddlers);
  const ch = Math.floor(total * DEFAULT_SPLIT.children);
  const eld = Math.floor(total * DEFAULT_SPLIT.elderly);
  const ad = total - tod - ch - eld;
  return { toddlers: tod, children: ch, adults: ad, elderly: eld };
}

// ─── Aging tick (yearly cohort step) ──────────────────────────
// Deterministic fractions — reproducible, no RNG. Fires once per game-year
// (called from the spring transition).
//   Toddler → Child: 25% / year (avg 4 years as toddler)
//   Child → Adult: 10% / year (avg 10 years as child)
//   Adult → Elderly: 2% / year (avg 50 years as adult)
//   Elderly mortality: 5% / year baseline

export const AGING_RATES = {
  toddlerToChild: 0.25,
  childToAdult: 0.10,
  adultToElderly: 0.02,
  elderlyMortality: 0.05,
};

export interface AgingResult {
  next: CitizenCounts;
  graduated: { toddlerToChild: number; childToAdult: number; adultToElderly: number };
  deaths: number;
}

export function ageStep(c: CitizenCounts): AgingResult {
  const tToC = Math.round(c.toddlers * AGING_RATES.toddlerToChild);
  const cToA = Math.round(c.children * AGING_RATES.childToAdult);
  const aToE = Math.round(c.adults * AGING_RATES.adultToElderly);
  const deaths = Math.round(c.elderly * AGING_RATES.elderlyMortality);
  return {
    next: {
      toddlers: Math.max(0, c.toddlers - tToC),
      children: Math.max(0, c.children + tToC - cToA),
      adults: Math.max(0, c.adults + cToA - aToE),
      elderly: Math.max(0, c.elderly + aToE - deaths),
    },
    graduated: { toddlerToChild: tToC, childToAdult: cToA, adultToElderly: aToE },
    deaths,
  };
}

// ─── Weighted arrival composition ──────────────────────────────
// Replaces the flat "+1 adult" growth with a roll for what kind of group
// joined the settlement. Probabilities slide a little with happiness — happy
// villages pull families more, unhappy ones get drifters.

export type ArrivalKind = "drifter" | "couple" | "family_baby" | "family_child" | "elder";

export interface ArrivalEntry {
  kind: ArrivalKind;
  delta: CitizenCounts;
  flavor: string;
}

const ARRIVAL_TABLE: Record<ArrivalKind, { delta: CitizenCounts; flavor: string }> = {
  drifter:      { delta: { toddlers: 0, children: 0, adults: 1, elderly: 0 }, flavor: "A drifter has joined the settlement." },
  couple:       { delta: { toddlers: 0, children: 0, adults: 2, elderly: 0 }, flavor: "A young couple has joined the settlement." },
  family_baby:  { delta: { toddlers: 1, children: 0, adults: 2, elderly: 0 }, flavor: "A family with a baby has joined the settlement." },
  family_child: { delta: { toddlers: 0, children: 1, adults: 2, elderly: 0 }, flavor: "A family with a child has joined the settlement." },
  elder:        { delta: { toddlers: 0, children: 0, adults: 0, elderly: 1 }, flavor: "An old wanderer has come seeking a quiet place." },
};

/** Roll a weighted arrival. Happiness 50 = baseline weights. >50 favors
 *  families slightly; <50 favors drifters. RNG injected so tests can pin it. */
export function rollArrival(happiness: number, rand: () => number = Math.random): ArrivalEntry {
  // Baseline weights (sum = 100): drifter 50 / couple 25 / family_baby 15 /
  // family_child 8 / elder 2.
  const happinessShift = (Math.max(0, Math.min(100, happiness)) - 50) / 50; // -1..+1
  const w = {
    drifter:      Math.max(5, 50 - happinessShift * 20),
    couple:       Math.max(5, 25 + happinessShift * 5),
    family_baby:  Math.max(2, 15 + happinessShift * 10),
    family_child: Math.max(2, 8 + happinessShift * 5),
    elder:        2,
  };
  const total = w.drifter + w.couple + w.family_baby + w.family_child + w.elder;
  let roll = rand() * total;
  for (const kind of Object.keys(w) as ArrivalKind[]) {
    roll -= w[kind];
    if (roll <= 0) {
      const e = ARRIVAL_TABLE[kind];
      return { kind, delta: e.delta, flavor: e.flavor };
    }
  }
  // Floating-point fallthrough — shouldn't happen but return a drifter.
  return { kind: "drifter", delta: ARRIVAL_TABLE.drifter.delta, flavor: ARRIVAL_TABLE.drifter.flavor };
}

/** Compose two cohorts together. */
export function addCitizens(a: CitizenCounts, b: CitizenCounts): CitizenCounts {
  return {
    toddlers: a.toddlers + b.toddlers,
    children: a.children + b.children,
    adults: a.adults + b.adults,
    elderly: a.elderly + b.elderly,
  };
}
