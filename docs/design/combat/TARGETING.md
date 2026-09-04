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
design:

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
| **reach** | **gate (multiplier)** | turns-to-arrive, given MY mobility |

Note that "position" splits in two: **isolation** is a scored term, **distance**
is the gate. Same word, two jobs.

### Normalisation

Every dimension returns **0–1**. All magnitude lives in the weight. This is not
cosmetic — it is the fix for the 100-vs-20 bug above, and without it one
dimension silently owns the decision.

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

## Held to the outside-combat test

Does this change a decision the player makes OUTSIDE combat? **Yes, strongly.**
If cultists hunt healers, wolves hunt stragglers, and smoke breaks line of
sight, then *who you bring and where they stand* both matter. That is the test
ROUT_AND_FLIGHT set, and this passes it — unlike prettier animations, which do
not.
