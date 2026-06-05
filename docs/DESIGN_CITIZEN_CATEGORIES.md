# Citizen Categories — Design

Replace the single `state.population: number` with a per-category breakdown so the player can see *who* makes up the settlement and the game can model lifecycle, food, and combat eligibility differently per group. Going straight to **Phase B** (real per-category state, aging, differential food, weighted births) — Phase A (cosmetic ratios) skipped per discussion 2026-04-29.

**Status:** BUILT (2026-06-05 audit). `CitizenCounts`, `founderCitizens()`, `ageStep`, per-category food multipliers, and adults-only defense eligibility are all live. Implementation adds a founder-floor/reserve (founders can't die yet) not described below.
**Trigger:** Defenses page reads "Available citizens: 4" with a 5-citizen starter, with no breakdown to explain it.
**Touches:** population state, food consumption, growth/decline tick, defense recruit eligibility, topbar UI, event log copy.

---

## Goals

- **The 5 starting citizens have faces.** Edda is elderly; Nell is a child; Jory/Tomas/Corin are adults (with Corin sitting near the elderly bracket). The Defenses page showing "available: 4" should be self-explanatory: Nell can't pick up a spear.
- **Population gains flavor without UI clutter.** New arrivals come as couples or families, babies are born, the elderly pass away — the event log tells a story. The dropdown shows the breakdown when the player wants the detail.
- **Combat eligibility is a derived property of the population shape, not a separate counter.** No more "available citizens" magic number — it's just `adults - soldiers - archers`.

---

## Categories

Four buckets. Aging moves citizens up the chain, never back.

| Category | Symbol | In-game age range | Combat eligible | Food consumption | Notes |
|---|---|---|---|---|---|
| Toddler | 👶 | 0-4 | No | 0.5× | Born; transitions to Child after ~4 game-years. |
| Child | 🧒 | 5-15 | No | 0.75× | Aged from Toddler; transitions to Adult after ~10 game-years. |
| Adult | 🧑 | 16-60 | **Yes** | 1.0× | The labor + military pool. |
| Elderly | 👵 | 61+ | No | 0.75× | Eat less; eventually pass away. Mortality kicks in. |

Numbers are starter values — tune in playtest.

### Why these brackets

- Three is too few (children and toddlers feel different — a toddler is dependent, a child can fetch water).
- Five is too many (no need for separate "young adult" / "middle adult"; combat eligibility is binary).
- Four maps cleanly onto recognisable life stages and gives growth events texture.

### Starter cast mapping

Hardcoded for the five founding NPCs so the opening matches the bios:
- Edda (71): Elderly
- Father Corin (68): Elderly
- Jory (36): Adult
- Tomas (48): Adult
- Nell (11): Child

Total adults: 2. **Defenses "available citizens" reads 2 from a fresh game**, not 4 — and the dropdown explains why. (The current "4" we see today is a quirk of the scalar math, not intentional.)

---

## State model

```ts
export interface CitizenCounts {
  toddlers: number;
  children: number;
  adults: number;
  elderly: number;
}

// Replace `state.population: number` with:
state.citizens: CitizenCounts;
```

`state.population` becomes a derived getter for backwards-compat:
```ts
function totalPopulation(c: CitizenCounts): number {
  return c.toddlers + c.children + c.adults + c.elderly;
}
```

### Migration

Old saves with `state.population: number`:
- Apply a default split (60% adult / 20% child / 12% elderly / 8% toddler) and round.
- For exactly-5 starter saves, apply the hardcoded founder mapping (2 adults / 1 child / 2 elderly).
- The total never changes — what was 5 stays 5, just sliced.

---

## Food consumption

Food is consumed per-category with a multiplier:

```ts
function calcFoodConsumption(c: CitizenCounts): number {
  return (
    c.toddlers * 0.5 +
    c.children * 0.75 +
    c.adults * 1.0 +
    c.elderly * 0.75
  ) * FOOD_PER_CITIZEN_PER_HOUR;
}
```

Effect: a settlement of 4 adults + 1 child eats less than 5 raw adults; a settlement leaning elderly drinks less ale. Subtle but tangible.

Tax revenue (gold per citizen per hour) — keep flat for now. Can add per-category rates later if needed.

---

## Aging tick

Once per in-game year (or scaled if tickrate is finer), advance the cohort:

1. A fraction of toddlers becomes children.
2. A fraction of children becomes adults.
3. A fraction of adults becomes elderly.
4. A fraction of elderly passes away (mortality scales with cohort size).

Use deterministic fractions (not RNG) to keep behaviour predictable:
```ts
function ageStep(c: CitizenCounts): { next: CitizenCounts; events: AgingEvent[] }
```

Aging fractions tuned so the population doesn't collapse in 5 years but also doesn't ossify into a permanent shape. Starter values:
- Toddler → Child: 25% / year (avg ~4 years as toddler).
- Child → Adult: 10% / year (avg ~10 years as child).
- Adult → Elderly: 2% / year (avg ~50 years as adult — consistent with 60+ for elderly bracket).
- Elderly mortality: 5% / year baseline, scaling with low food / cold winter.

### Death events

Elderly death generates a **named** event when possible (uses the founder cast for special saves; otherwise generic). For Phase B, generic is fine — a Phase C polish pass could pull from a name pool.

---

## Growth: arrivals and births

Two paths add citizens:

### Arrivals (current "1 citizen joined")
When the food/happiness conditions are met, a new arrival is rolled. Instead of always adding 1 adult, roll a weighted family unit:

| Roll | Composition | Probability | Event flavor |
|---|---|---|---|
| Solo adult | +1 adult | 50% | "A drifter has joined the settlement." |
| Young couple | +2 adults | 25% | "A young couple has joined the settlement." |
| Family with toddler | +2 adults, +1 toddler | 15% | "A family with a baby has joined the settlement." |
| Family with child | +2 adults, +1 child | 8% | "A family with a child has joined the settlement." |
| Elder seeking refuge | +1 elderly | 2% | "An old wanderer has come seeking a quiet place." |

The probabilities slide a little with the settlement state — a happy, well-fed village pulls families more than an unhappy one (which favors solo drifters).

### Births (new path)
A small chance per game-year to add a toddler, gated on:
- At least 2 adults present (couple).
- Food net rate > 0.
- Happiness ≥ 50.

Per-year probability scales with adult-pair count: `min(0.6, adult_pairs * 0.15)`. Event: "A baby has been born — the settlement welcomes [name]!"

---

## Defense recruitment

The Defenses page reads adults only:

```ts
export function availableCitizens(state: GameState): number {
  return Math.max(0, state.citizens.adults - state.soldiers - state.archers);
}
```

Soldier/archer recruit decrements `adults`, increments `soldiers` or `archers`. On death (raid casualty), `adults` decrements (the soldier/archer's underlying citizen also dies).

Tooltip on the recruit button when blocked reads "Need an adult — only 2 of your 5 citizens are eligible (3 are children or elderly)" rather than the current generic "no spare citizens".

---

## Topbar dropdown

The citizen count in the topbar gets a hover/tap dropdown like the resources panel does. Layout sketch:

```
👤 5 citizens ▾
─────────────────
👶 0 toddlers
🧒 1 child       — Nell
🧑 2 adults      — Jory, Tomas
👵 2 elderly     — Edda, Father Corin
─────────────────
Net food: +12/h
```

When founder names are still in the cohort, show them inline (small flavor touch). After they age out / die, fall back to the count alone.

---

## Defenses Summary line

Update from "👤 Available citizens: N" to "👤 Adults available: N / total adults" — explicit about the eligibility filter so the breakdown matches the topbar.

---

## Implementation order (rough)

1. **State + migration.** Add `CitizenCounts`, replace `state.population` reads (most call `totalPopulation()`), migrate old saves.
2. **Food consumption rewrite.** Plug per-category multipliers into `calcFoodConsumption`.
3. **Aging tick.** Yearly cohort step. Deterministic for now.
4. **Defense recruit eligibility.** `availableCitizens` reads `adults`. Recruit/dismiss/death paths target adults.
5. **Growth event rework.** Weighted arrival composition + named birth event.
6. **Topbar dropdown.** Hover/tap panel showing the breakdown.
7. **Defenses Summary copy.** Updated label.
8. **Founder hardcoding.** Starter cast initialised with the bio-accurate mapping (Edda + Corin elderly, Jory + Tomas adult, Nell child).

Probably 3-4 focused sittings.

---

## Open questions

1. **Toddler immobility on missions.** Adventurers are a separate roster from population — none of this directly touches them. Confirmed.
2. **Adult cap on housing.** Should max-population still be a flat number, or split per category (e.g. houses limit total occupants but not the shape)? Lean: flat total, internal shape is whatever the lifecycle produces.
3. **Visual icon size on the topbar.** Four sub-icons + names in the dropdown might wrap on phone. Probably fine to drop the names on narrow screens and just show counts.
4. **Multiplayer co-op.** Categories sync the same way population does today — no extra complication.

---

*Last updated: 2026-04-29. Update as implementation progresses or scope shifts.*
