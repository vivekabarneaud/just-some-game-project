# Targeting: what a creature wants, and what it can see

- **Status:** designed 2026-09-04, unbuilt. Replaces the seven single-mode
  `targeting` knob with a weighted score, and adds a perception stage in front
  of it. Came out of asking whether the knob should be a ranked list.
- **Cross-refs:** `shared/src/data/combat/targeting.ts` (the modes + the
  existing `scoredPick`), `ai/profile.ts` (the knobs), `positional.ts`
  (`mobilityOf`, `paceGap`), `ROUT_AND_FLIGHT.md` (the outside-combat test).

## Why change it

`targeting` is currently one of seven labels. Two of those labels are already
**internally ranked cascades with hardcoded fallbacks**:

- `backline` → priests, else wizards, else a scored pick (threat as tiebreak
  *within* each tier)
- `gang-up` → whatever packmates committed to, else nearest

So ranking is already happening; it just isn't authorable. And every new taste
("wants the healer, but takes a straggler if there is one") needs a whole new
mode.

More importantly, `scoredPick` — the default path most enemies take — is
**already a weighted sum**:

```ts
score = (1 - armourReduction) * 100        // softness
      + (1 - hp/maxHp) * woundedWeight     // condition
      + threat * 0.5 * threatWeight        // threat
```

Two of its three weights are already parameters. This design is that scorer
generalised: more dimensions, and the weights lifted into each enemy's data.

⚠ **A live bug it inherits:** softness spans 0–100 while wounded spans 0–20, so
softness silently dominates 5:1. "Squishiest" behaviour is the de-facto default
today. The refactor must fix scales (see Normalisation).

## The score

Additive, with exactly one multiplier.

```
score(target) =
  ( w.role      * role(target)        // healer / caster / ranged / frontline
  + w.condition * condition(target)   // wounded, debuffed, unarmoured
  + w.isolation * isolation(target)   // cut off from their own line
  + w.softness  * softness(target)    // armour/resist AND hittability
  + w.threat    * threat(attacker, target)
  ) * reachFactor(attacker, target)
```

**Additive, not multiplicative**, for the terms. Multiplying means any zero
zeroes the target: a mage weighted only for healers would score a warrior at 0
and could then never attack anyone when no healer is present. Additive is
forgiving — the healer scores highest, everyone else still scores something.

**Reach is the exception and is a multiplier**, because it is a *capability*
gate rather than a taste. And it is normalised by the attacker's OWN mobility —
"how many turns until I can get there" — which is the best property in this
design.

⚠ **Band-aware, not contact-aware** (review 2026-09-04): "get there" means *into
my weapon band*, not into melee contact. The poacher is a back-row shooter whose
bow covers the whole field — for it, everyone is zero turns away and the gate
divides by ~1. Compute reach from `weaponAt`/band fit, or a ranged enemy's
scorer thinks every target is distant when none are:

> Greyfang wants Aldwin and at mobility 36 is one turn away, so the caster wins.
> A slow skeleton wants Aldwin just as much, but he is five turns off, so the
> damping sinks him and the nearest target wins.

**The same weights produce different behaviour depending on the creature's
legs.** "Dumb thing hits what is in front of it" falls out of its mobility
instead of being labelled `nearest`. That means FEWER authored numbers, not
more.

### The dimensions, and which kind each is

| dimension | kind | reads |
|---|---|---|
| role | scored | healer / caster / ranged / frontline |
| condition | scored | wounded, debuffed, unarmoured |
| isolation | scored | drifted from their own line |
| softness | scored | armour/resist × how hittable |
| threat | scored | what they have done to me |
| ganged | scored | how many packmates already committed to them |
| **reach** | **gate (multiplier)** | turns until they are inside MY weapon band |

Note that "position" splits in two: **isolation** is a scored term, **distance**
is the gate. Same word, two jobs.

### Normalisation

Every dimension returns **0–1**. All magnitude lives in the weight. This is not
cosmetic — it is the fix for the 100-vs-20 bug above, and without it one
dimension silently owns the decision.

Two dimensions need a definition to reach 0–1, decided here so the
implementation doesn't improvise: **threat** is unbounded (it accumulates and
decays ×0.9/round), so it normalises *relative to the attacker's
highest-threat candidate* (their max = 1); **ganged** likewise divides by the
number of living packmates.

## Perception: a creature scores what it can SEE

Today `choose()` receives the full target array with exact positions, HP and
armour. Perfect information. **A smoke bomb cannot work against that** — and
three things already in the backlog need it: the assassin's **Smoke Bomb**
(rescued into IDEAS), the **puffball** as an area-effect carrier (parked), and
**Blind** in the snake/marsh design.

So the pipeline gains one stage at the front. It already has stages of this
shape — `reachable()` filters, taunt and pack-howl short-circuit:

```
perceive(attacker, ctx)      -> who can I even assess?        NEW
forced overrides             -> pack howl, taunt              exists
weighted score * reachFactor -> how much do I want them?       new scorer
pick, with a miss chance     -> deliberate imperfection       exists
```

**Model VISIBILITY, not uncertainty.** Visibility is a filter on the candidate
pool: one function, legible in the log, composes with everything. Uncertainty
(jittered positions, fuzzy HP) is expensive and unreadable — neither the player
nor the author can tell what happened or why.

Blind and smoke then become the same thing: `perceive` returns only what is in
contact ("you can feel what is on top of you"), and a creature with nothing
perceivable flails at what it is touching, or holds.

**Two decisions taken:**

1. **Smoke blocks both ways.** Someone inside cannot be targeted, and cannot
   target out. That makes it a tactical object rather than a defensive buff, and
   it matches Smoke Bomb's intent — *breaking contact*. It also becomes a real
   escape tool, which composes with flight (ROUT_AND_FLIGHT).
2. **Perception is symmetric.** `pickTargetForAdventurer` gets the same stage,
   or the player's heroes have godlike sight while enemies grope in the dark.

## Migration (behaviour-preserving)

Each existing mode becomes a canned weight vector, so all 18 enemies keep
working unchanged and the diff is data, not behaviour:

| today | becomes |
|---|---|
| `nearest` | reach gate does it: all weights ~0, or a small softness term |
| `threat` | `{ threat: 1, softness: 1, condition: 0.2 }` (today's scoredPick) |
| `squishiest` | `{ softness: 1 }` |
| `opportunist` | `{ isolation: 1, condition: 0.5 }` |
| `backline` | `{ role: 1 }` with healer > caster in the role table |
| `gang-up` | needs a `ganged` term (packmate commitment), then `{ ganged: 1 }` |
| `random` | keep as a flag — erratic is not a weight |

## Risks, and the guards

**Legibility.** A weight vector is much harder to read than "hunts healers", for
the author *and* the player. This only works if the log says why: *"Greyfang
lunges past the shield wall for Aldwin."* Without that, nobody can tell what
happened. Treat the log line as part of the feature, not polish.

**The `aiTier` trap.** When per-enemy vectors get tedious the temptation is to
name presets — which is exactly how `aiTier` was born, and it was deleted on
2026-09-04 for exactly this reason. **Guard: presets may exist as authoring
sugar that expands into weights in the data, never as a field the engine reads.**

**Cost is not a risk.** Measured 2026-09-04: a whole fight is 0.16ms and
averages 4.5 rounds, about 27 target picks. Five dimensions might take it to
0.3ms. There is no N-simulation preview to multiply it (the card's success
chance is stat-based; `prerolledCombat` is a single sim at deploy). If it ever
mattered, memoise the per-round dimensions (isolation, softness) — but that is
premature.

## Open edges (review 2026-09-04)

Found by re-reading the doc against the code; each is small, but unstated they
would be improvised at implementation time.

- **Target stickiness.** Re-scoring every turn invites flip-flop: isolation and
  wounded values shift each round, so a wolf could switch targets every turn and
  never finish anything. The codebase has already learned this lesson once —
  `moveUnit` commits its breakthrough intent ONCE, with a comment about exactly
  this jitter. Give the current target a small commitment bonus (a `sticky`
  weight, default ~0.2) rather than a hard lock, so a genuinely better target
  can still peel the attacker off.
- **The rout exclusion stays a hard filter.** "Threats first, runners after"
  (ROUT_AND_FLIGHT) must NOT become a weight — a weighted version would let
  heroes plink a fleeing boar while its mate gores the line whenever the
  numbers said so. It remains a pool filter ahead of the scorer, and Nessa's
  Pursuit talent lifts the filter, not a weight.
- **Hero-side scoring stays fixed in v1.** Perception is symmetric (decided
  above), but the *weights* are not: `pickTargetForAdventurer` keeps its current
  scoredPick behaviour. Authorable hero weights arrive with talents (Pursuit,
  and any "hunter" style) — not before, or every adventurer needs numbers on
  day one.
- **Perception gates FOE-targeting only, v1.** Heals and buffs (priest
  `canBeHealed` path) keep full sight of allies. Whether a priest can heal into
  smoke is a real question — deferred, not decided, and cheap to add later since
  perceive() is one function.
- **AoE respects the pool it was given.** Cleave/Multi-Shot pick secondary
  targets from the same perceived pool, so smoke isn't defeated by an area
  swing. (NB those two abilities are already in the inbox for logging 0 damage —
  verify that first, or the AoE rule is being built on a possibly-broken floor.)

## Held to the outside-combat test

Does this change a decision the player makes OUTSIDE combat? **Yes, strongly.**
If cultists hunt healers, wolves hunt stragglers, and smoke breaks line of
sight, then *who you bring and where they stand* both matter. That is the test
ROUT_AND_FLIGHT set, and this passes it — unlike prettier animations, which do
not.
