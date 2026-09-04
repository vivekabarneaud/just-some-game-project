# Rout and flight

- **Status:** designed 2026-09-04, unbuilt. Came out of playtesting Lean Times,
  where the boars routed and the larder filled anyway.
- **Cross-refs:** `shared/src/data/combat/ai/profile.ts` (the knobs),
  `ai/types.ts` (the state machine, built and unused), `retreat.ts` (morale +
  the hero-side flee), `round/actions.ts:98` (the beast rout check),
  `positional.ts` (`mobilityOf`, the 0-100 field).

## The test this design is held to

**Does it change a decision the player makes OUTSIDE combat?**

This is an idle game. Combat is watched at most a few times and then skimmed, so
spectacle is the wrong thing to buy. Movement-based rout passes the test because
whether the quarry escapes becomes a consequence of *who you deployed* -- an
assassin has mobility 22, a ranged unit 7 -- and the player feels that on the
results screen (20 meat or 10) whether or not they watch a single round.
Prettier flight animations fail the test. Apply it to any future combat system.

## What is actually wrong today

Nothing about the loot. `keepOnRout` already exists on drops, and the boar's
meat deliberately lacks it, so a boar that flees already yields nothing. **The
only thing ignoring the rout is Lean Times' flat `{ resource: "boar", amount: 20 }`.**

What IS wrong is an asymmetry. Heroes flee by movement: `attemptFlee` spends the
turn trying to break contact, rolls, and repeated failures are "the
cornered-death vector". Enemies get `routEnemy`, which is instant -- they
vanish. The hero side already has the interesting version; enemies got the
shortcut.

## Flight is a knob, not a behaviour

`AIProfile.fear` is currently `"fearless" | "routs"`. It becomes the **shape of
the exit**, and nothing else:

| `fear` | who, from today's roster | behaviour |
|---|---|---|
| `fearless` | undead, constructs, zealots | never breaks. Exists today |
| `bolts` | wild_boar, and prey generally | turns and runs flat out for its field edge. Only something fast catches it |
| `withdraws` | grey/gaunt/starving wolf, forest_bear | backs off still facing you, slower, easier to catch |
| `yields` | displaced_brigand, tollman, dominion_tough, poacher, cutthroat | **does not run.** A person who breaks throws down their weapon and stays |

`yields` is the cheapest and the most interesting: no movement code at all, and
a surrendered human is a *choice* -- spare or kill -- which reaches the Lord's
faith arc from the opposite side to "animals aren't kill-on-sight". It also
explains an existing asymmetry in the data: a bandit's gold is `keepOnRout: true`
while a boar's meat is not, because the man is still standing there.

**Why the knob stays about movement only.** If `fear` encoded tactics ("casts
slows while retreating") it would need a variant per spell list and the set
explodes. Restricted to the exit shape it stays at four -- the same reason
`targeting` has 7 modes and not 70.

## Tactics while retreating live in the state machine

A cunning mage does not simply walk backwards; it frost-novas and knocks back as
it goes. That is **per-enemy**, not a knob:

```
fear: "withdraws"                    <- the knob: how it moves
aiBehavior: "hedge_mage"             <- the behaviour: what it spends the turn on
  states.fleeing.preferredAbilities: ["frost_nova", "chill"]
```

The state machine in `ai/types.ts` is **built and entirely unused** -- one
`default` behaviour wrapping existing logic -- and its own docstring already
lists these shapes ("adventurer danger mode: healthy → wounded → critical",
"enraged berserker"). A `fleeing` state is smaller than either.

⚠ **Gap:** `AIState.preferredAbilities` is declared and documented but **nothing
reads it**; only `onTurn` is consumed by the round pipeline. Wiring it is small
and already designed, but it is not there. Not needed for v1 -- boars and wolves
want no abilities while fleeing.

## Two things, and they do not mix

The knobs describe the creature's **mind** and are static. A transformation
describes what is true of it **right now**, and stamps modifiers. Keeping these
apart is the whole design; an earlier draft had transformation states
re-authoring the knobs, which was wrong (see below).

| | what it is | authored as | example |
|---|---|---|---|
| **AI knobs** | intrinsic, never changes during a fight | `ai: {}` on the enemy | `{ targeting: "backline", tauntable: "ignores-generic", fear: "withdraws" }` |
| **Transformation** | temporary, a state that stamps modifiers | an `aiBehavior` state | `+30% str`, `tauntImmune`, `-mobility`, `+regen`, preferred spells |

`resolveAI` keeps its existing two-layer `??` chain (authored `ai` → defaults)
and gains **nothing**. A transformation never touches it.

### Why modifiers and not state-scoped knobs

Because the codebase already does exactly this, twice, and a third mechanism for
the same job would be waste. `modifiers.ts` says it outright: *"State is stamped
onto units; damage.ts and other consumers read the flags rather than the
modifiers list directly"* — re-evaluated each round so gates can flip mid-fight.
And `round/status.ts` already ticks per-unit temporary state: `slowed` counting
down, stat debuffs, poison DoTs, `focusRounds`, `tauntedBy` cleared each round.

A transformation is therefore a **modifier bundle on a timer/threshold**, which
also means the same bundle can be granted by a spell, a potion or a talent. That
composability is free; state-scoped knobs would not have had it.

### `tauntable` and `tauntImmune` are NOT the same thing

An earlier draft conflated them. They are different in kind:

- **`tauntable`** (knob, intrinsic): wolves ignore a warrior's generic taunt
  because that is what wolves are. Three values, so an elite pull can land where
  a generic one does not.
- **`tauntImmune`** (flag, temporary): *currently* too far gone to be pulled.
  Granted by a berserk, and equally grantable by anything else.

### Worked examples

**Greyfang, cornered** — `enraged`: str ×1.3, `tauntImmune`, mobility up. Fires
at the same threshold his `routsAt` would, so **the enrage races the rout**: the
pack leader snaps where the boar bolts, and which one a creature does becomes its
character rather than a flag. `routsAt` stays in the data and simply never fires.

**Treant, rooting** — `rooted`: mobility → 0, HP regen per round,
`preferredAbilities: [...]`. A transformation that *costs* something is the more
interesting kind, and it shows the bundle is not merely "buff".

The only genuinely new piece in either is **HP regen** — poison DoT already
ticks in `tickStatusEffects`, so regen is its mirror.

## Delete `aiTier` — do not rename it

An earlier draft proposed renaming it to `instinct` and keeping it as a preset.
**That was wrong, and the roster disproves it:** the justification was that a
preset would bundle targeting *and* flight, but the wolves and the boar are all
`aiTier: "feral"` while the wolves withdraw and the boar bolts. One preset cannot
determine flight. Reduced to setting `targeting` alone, `instinct` is a pure
alias — just write `targeting: "nearest"`.

So: delete the field, migrate the 14 enemies to explicit `targeting` (12 feral →
`nearest`, 1 tactical → `threat`, 1 cunning → `backline`), and set `fear` per
creature. The knobs are the system. This is also what the code already wanted —
it is called legacy in four files, and `EnemyDefinition` carries `tier: 1|2|3|4|5`
for POWER on the same object, which forces a disambiguating comment at
`enemies.ts:136`.

## Build order

1. `fear` gains `bolts` / `withdraws` / `yields`; fleeing becomes movement with a
   mobility multiplier. No behaviours needed.
2. Fleeing units are catchable -- this is what makes Nessa's talents and assassin
   mobility matter, and it is the whole point per the test above.
3. Lean Times' reward follows the kills.
4. Delete `aiTier`; the 14 enemies get explicit `targeting`.
5. `AIState` gains a declarative modifier bundle + `preferredAbilities` wired,
   when the first transformation or cunning retreat is authored.

## Deliberately NOT in v1

- **Returning to the fight** (flee, heal, come back). This is where the
  oscillation risk lives -- the charge tuning already carries a "loop-safe (no
  charge->shove->charge spiral)" comment, so it has bitten once -- and its payoff
  is pure spectacle: the loot is identical whether the wolf left for good or came
  back and died. Highest cost, lowest score against the test.
- **Global no-rout on boars.** A boar fleeing a fight it is losing is right in
  every context except a hunt.
- **A `noRout` mission flag.** Works, but it is a patch that removes the drama.
  Save it for scripted lethal story beats, where it is already banked.
- **A kill-everything win condition for hunts.** The most dramatic and the
  harshest: Lean Times exists to answer a famine *now*, so a mission that can
  outright fail turns the food supply into a coin flip.
