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

## Three layers, each optional

1. **preset** (today's `aiTier`) -- a named bundle: `feral` = nearest + bolts,
   `tactical` = threat + withdraws, `cunning` = backline + withdraws
2. **knobs** (`ai: {}`) -- override the preset knob-by-knob. `resolveAI` already
   resolves `u.ai?.fear ?? preset ?? default`, so **a cunning enemy that bolts is
   just `aiTier: "cunning", ai: { fear: "bolts" }`**
3. **behaviour** (`aiBehavior`) -- authored states for the handful that deserve one

Most enemies need only layer 1. Nothing needs layer 3 yet.

### Rename `aiTier` (decision pending)

The field is documented as legacy in four files ("Preferred over `aiTier` for new
enemies"), yet **14 enemies use it and zero use `ai: {}`** -- so the legacy field
is currently the only field. And `EnemyDefinition` already has `tier: 1|2|3|4|5`
for POWER on the same object, which forces a disambiguating comment at
`enemies.ts:136`. "Tier" also implies a ladder, and a feral wolf is not a weaker
cunning goblin.

Keep the preset (it now bundles two knobs, which is design intent, not
shorthand), rename the field. Candidates: **`instinct`** (evocative, fits a
bestiary; slight friction that "tactical" is not an instinct) or
**`disposition`** (handles all three values cleanly, less flavourful). Migration
is 14 one-line changes: 12 `feral`, 1 `tactical`, 1 `cunning`.

## Build order

1. `fear` gains `bolts` / `withdraws` / `yields`; fleeing becomes movement with a
   mobility multiplier. No behaviours needed.
2. Fleeing units are catchable -- this is what makes Nessa's talents and assassin
   mobility matter, and it is the whole point per the test above.
3. Lean Times' reward follows the kills.
4. `preferredAbilities` wired, when the first cunning retreat is authored.

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
