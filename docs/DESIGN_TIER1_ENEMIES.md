# DESIGN: Tier-1 Enemy Authoring (bestiary pass)

**Status:** Design in progress. Drafted 2026-07-25. Builds on [[DESIGN_COMBAT_FOUNDATION.md]] (stats/weapons/schools) and [[DESIGN_POSITIONAL_COMBAT.md]] (the 1D layer). Nothing here is built until the foundation's weapon-band + hit-resolution steps land (Foundation §4 steps 2-3).

**One-line:** Author each enemy on the uniform foundation — stats, weapon band, and *only* the exceptions (abilities, raw sub-stats, resistances) that make it distinct. Along the way we introduce a handful of **reusable mechanics** (charge, knockback, zone hazards, composable AI) that later enemies and talents reuse.

---

## 1. Reusable mechanics introduced by this pass

These are *systems*, not one-off enemy tricks. Author once, reuse everywhere (enemies, talents, traps).

### Charge (position-aware ability)
A gap-close + heavy hit. When the unit has **room** (not engaged), it barrels toward its target: a big mobility burst to contact, goring on impact for bonus damage that **scales with the distance charged**. A unit already in melee can't charge (no run-up).
- **On a cooldown, never every turn** — this is the primary loop-guard. Between charges the unit just attacks (in melee) or repositions.
- **Counterplay = engagement.** A charger held in melee can't get a run-up. Hold the line and you defuse the charge; let it break free and you eat the slam.
- Poster child: boars. Also the basis for a future warrior "Charge" talent.

### Knockback (position-aware effect)
Shove the target back along X. **Small and capped, scaled to the charge** (`shove ≈ chargeDistance × small factor, capped low` — a ~30-pace charge → a ~4-5-pace *stumble*, not a launch). Mass-scaled: a wild boar barely nudges, a big undead patriarch really launches you.
- **Loop-safe by construction:** knockback is small enough not to open a free re-charge, and charge is on cooldown anyway, so you never get charge→shove→charge→shove. The rhythm is charge → gore → gore → charge.
- Some heavy/undead units are **knockback-*immune*** themselves (they shove you, you can't shove them).

### Zone hazards (reusable ground-effect layer)
A damaging **interval `[xA, xB]`** on the battlefield: each round, any unit whose `x` is inside it takes damage of some school; it lasts a few rounds, then fades. The point is a **reason to move that isn't attacking** — stand in it and you cook, so you reposition out.
- **Rendering:** a translucent **ground band** behind the units — `left = leftPct(xA)`, `width = leftPct(xB) − leftPct(xA)`, a roiling gradient (drifting motes / vapor), opacity ramping down as it dissipates. One `<div>` on the stage floor layer.
- **Generalizes:** fire patches, frost, caltrops, a priest's healing circle all reuse the same band renderer. First user = the undead patriarch's death-vomit.

### Composable AI (knobs, not one tier)
A unit's brain is a small set of **orthogonal knobs**, not a single `aiTier` string. Defaults + opt-in exceptions, same philosophy as the stat schema.

| Knob | Values |
|---|---|
| **targeting** | `nearest` (default/feral) · `opportunist` (most damage to a *reachable* target, weighing armor/resist/dodge) · `squishiest` · `bypass-backline` |
| **tauntable** | `obeys` · `obeys-but-finishes-committed-action` · `ignores` |
| **fear** | `routs` (at X%) · `fearless` |
| **movement** | `charger` · `kiter` · `holder` · `flanker` (+ `breakthrough` flag) |

Named presets (`feral`, `opportunist`, …) are just shorthand bundles. A unit inherits the `feral` default and overrides only the knobs that make it distinct. **Keep the set small and flat — four knobs, not a behavior-tree engine.**

- **`opportunist`** guardrail: it still weighs **reachability**, so the counter is the usual lesson — body-block + taunt. Without them it charges your squishiest; with them you've earned the protection.

---

## 2. The Boar family — the Charger archetype

Where wolves are flankers, boars are **momentum**. The whole family is charge + knockback; each tier adds one mechanic. **Armor fully protects from a boar's body (pure momentum — no armor-pierce; piercing is the wolves' thing).**

| Boar | Charge | Knockback | Fear | Signature | Tier |
|---|---|---|---|---|---|
| **Wild** | once / long cd | tiny | **routs when hurt** | mundane bruiser | **Tier 1** |
| **Rabid** | frenzied (short cd) | small | fearless | **Froth** (Nature disease bite) | **Tier 1** |
| **Undead** | frenzied | small | fearless | **Hollow** bite (bypasses armor) + relentless | **later** |
| **Undead Patriarch** (boss) | frenzied | *big* | fearless | Hollow **death-vomit** zone | **later** |

### Tier 1 — ship on the foundation

**Wild Boar** — `str4 dex3 vit4`, beast, meat loot.
- **Goring Charge** (once, or long ~5-round cd). Tiny/no knockback. Plain tusks otherwise (contact band).
- AI: `targeting: nearest · fear: routs (~0.3) · movement: charger`. A wild animal — charges in, but breaks and runs when the fight turns (per the "animals aren't kill-on-sight" ethos).

**Rabid Boar** — `str7 dex5 vit8`, beast. The bad-water bruiser (**alive**, maddened).
- **Frenzied Charge** (short cd, ~every 2-3 rounds — *not* every turn). Small knockback.
- **Frothing Bite** — the froth is a **living** affliction (Nature/disease, carried home, cured by Boar's-Bane Salve). Keep the ~10% infect.
- AI: `targeting: nearest · fear: fearless · movement: charger`. Red-eyed, charges anything, fights to the death.

### Later tier — parked until Hollow/undeath enters the story

Reframe: a boar that charges *with a spear through its skull* isn't "tainted," it's **undead** — reanimated by Hollow. Reads to the player as plain **death** (the symptom) without naming the 8th god / the seals (the cause), so it foreshadows without spoiling. Because it's dead, it's **past disease** — no froth; its bite carries **Hollow rot** instead. And it's a **mid-game horror**, not a starter: it arrives with the witchcraft/cult beat, aligned with the storyline+pacing rewrite (Act 1 Ch1 = living beasts only).

**Undead Boar** — everything rabid does, plus:
- **Hollow bite** — part of its damage is **Hollow** (death school). **Armor doesn't stop it** — you'd need Hollow resistance. (A rabid boar you can armor up against; an undead one gets through your plate.)
- **Relentless** — **knockback-immune** ("took a spear and kept coming"), fearless.
- AI: `targeting: opportunist · tauntable: obeys-but-finishes-committed-action (or ignores) · fear: fearless · movement: charger + breakthrough`. Mindless — it charges the nearest thing (Godric), and **can charge *through* the front line and keep going to gore a backline ally** (uses the breakthrough mechanic we built). Terrifying, and the counter is still body-block + taunt.

**Undead Patriarch (boss)** — all of the above at boss scale (~1.2×, tankier), plus:
- **Hollow death-vomit** — on death (or below 50%) leaves a **Hollow zone hazard** `[xA, xB]` for a few rounds (see §1). Melee who were fighting it are standing in the patch and must step out. "Contain, don't cure" made literal — killing it *spreads* the corruption for a beat.

---

## 3. Wolves — the Flanker archetype (Tier 1)

Designed in-session; **transcribe the full kit here** (throat-tear/`ignoreArmor` new effect flag, Grey keeps Rending Bite, Gaunt weaker Rending Bite, Starving plain, all fast via raw mobility, pack tactics). Identity vs boars: wolves **slip your armor** (throat), boars **bowl you over** (momentum). TODO: fill from session notes before building.

---

## 4. Remaining Tier-1 roster — TODO

Author the rest one by one on the foundation (stats + band + only the distinct exceptions): the other Tier-1 beasts/vermin, then Brenna / Gareth / Godric as the uniform-schema reference builds. Track against the enemy list in `shared/src/data/enemies.ts`.

---

## 5. Build order (honest)

1. Foundation §4 steps 2-3 — weapon bands + sidearm, then hit-resolution + **range-gated abilities** (the thing that stops range-cheating and lets charge/knockback/zone have real reach).
2. The **effect-schema extensions** these enemies need: `ignoreArmor` (wolf), charge (move+hit+distance-scaling), knockback (shove X, capped), zone hazard (interval DoT), Hollow/Nature schools in damage resolution.
3. The **composable-AI knobs** (§1) — replace the single `aiTier` field with the four-knob brain + presets.
4. Author **wolves → boars (wild, rabid)** on top. Undead boars + patriarch wait for the Hollow story beat.
