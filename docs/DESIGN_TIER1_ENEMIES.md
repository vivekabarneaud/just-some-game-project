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

**Wild Boar** — `str5 dex3 vit6` (out-muscles + out-tanks a lone Grey Wolf), beast, meat loot. **`routsAt 0.30`** (was missing — now flees like an animal).
- **Goring Charge** (once, or long ~5-round cd). Tiny/no knockback. Plain tusks otherwise (contact band).
- AI: `targeting: nearest · fear: routs (0.3) · movement: charger`. A wild animal — charges in, but breaks and runs when the fight turns (per the "animals aren't kill-on-sight" ethos).

**Rabid Boar** — `str7 dex4 vit8` (clumsy but brutal — low DEX, rides its charge + bulk), beast. The bad-water bruiser (**alive**, maddened).
- **Frenzied Charge** (short cd, ~every 2-3 rounds — *not* every turn). Small knockback.
- **Frothing Bite** — the froth is a **living** affliction (Nature/disease, carried home, cured by Boar's-Bane Salve). Keep the ~10% infect.
- AI: `targeting: nearest · fear: fearless · movement: charger`. Red-eyed, charges anything, fights to the death.

*(Base primary stats, raw mobility, and `routsAt` are BUILT — see §6. Charge/knockback abilities are still the placeholder `damage_mult`; the position-aware version is pending.)*

### Later tier — parked until Hollow/undeath enters the story

Reframe: a boar that charges *with a spear through its skull* isn't "tainted," it's **undead** — reanimated by Hollow. Reads to the player as plain **death** (the symptom) without naming the 8th god / the seals (the cause), so it foreshadows without spoiling. Because it's dead, it's **past disease** — no froth; its bite carries **Hollow rot** instead. And it's a **mid-game horror**, not a starter: it arrives with the witchcraft/cult beat, aligned with the storyline+pacing rewrite (Act 1 Ch1 = living beasts only).

**Undead Boar** — everything rabid does, plus:
- **Hollow bite** — part of its damage is **Hollow** (death school). **Armor doesn't stop it** — you'd need Hollow resistance. (A rabid boar you can armor up against; an undead one gets through your plate.)
- **Relentless** — **knockback-immune** ("took a spear and kept coming"), fearless.
- AI: `targeting: opportunist · tauntable: obeys-but-finishes-committed-action (or ignores) · fear: fearless · movement: charger + breakthrough`. Mindless — it charges the nearest thing (Godric), and **can charge *through* the front line and keep going to gore a backline ally** (uses the breakthrough mechanic we built). Terrifying, and the counter is still body-block + taunt.

**Undead Patriarch (boss)** — all of the above at boss scale (~1.2×, tankier), plus:
- **Hollow death-vomit** — on death (or below 50%) leaves a **Hollow zone hazard** `[xA, xB]` for a few rounds (see §1). Melee who were fighting it are standing in the patch and must step out. "Contain, don't cure" made literal — killing it *spreads* the corruption for a beat.

---

## 3. Wolves — the Flanker archetype

Fast, nimble, fragile, and deadly **in numbers**. Identity vs boars: wolves **slip your armor** (throat), boars **bowl you over** (momentum). All wolves get **raw mobility** (fast without being critty) and share the **Pack Tactics** passive.

| Wolf | STR | DEX | VIT | raw mob | raw dodge | routsAt | abilities | tier |
|---|---|---|---|---|---|---|---|---|
| **Starving** | 2 | 3 | 2 | +1 | — | 0.45 | plain bite + Pack Tactics | 1 |
| **Gaunt** | 3 | 4 | 3 | +2 | +3 | 0.35 | Rending Bite (weak 10%/2rd) + Pack Tactics | 1 |
| **Grey** (`wild_wolf`) | 4 | 5 | 5 | +2 | +5 | 0.30 | Rending Bite (20%/2rd) + **Throat Tear** + Pack Tactics | 1 |
| **Alpha** (boss) | 16 | 14 | 18 | +3 | +5 | — | Throat Tear + **Pack Howl** + Pack Tactics | 2 |

**Gradient:** Starving (plain) → Gaunt (weak bleed) → Grey (bleed + throat) → Alpha (boss + coordinator).

- **Rending Bite** — a bleed DoT. *(already in-engine.)*
- **Throat Tear** *(new: `ignoreArmor`)* — goes for the neck; armor is no help. On Grey + Alpha. Barely matters at Tier 1 (adventurers wear little armor) but keeps wolves relevant as armor grows — it *ages well* instead of being a Tier-1 spike.
- **Pack Tactics** *(new: family passive)* — a wolf hits ~+15% harder when **another wolf shares its target**. Lone wolves are weak; a pack ganging up is lethal. Rewards flanking/surrounding.
- **Pack Howl** *(Alpha, new: focus-fire)* — marks one prey; the whole pack **focus-fires** it for a few rounds **and** gains a damage buff. Combos viciously with Pack Tactics (all wolves on one target → every bite amplified). Counter = body-block + peel. The Alpha is "a bigger Grey Wolf that runs the pack."

*(Base primary stats + raw mobility + raw dodge + `routsAt` are BUILT — see §6. Throat Tear, Pack Tactics, and Pack Howl focus-fire are pending engine work.)*

---

## 4. Remaining Tier-1 roster — TODO

Author the rest one by one on the foundation (stats + band + only the distinct exceptions): the other Tier-1 beasts/vermin, then Brenna / Gareth / Godric as the uniform-schema reference builds. Track against the enemy list in `shared/src/data/enemies.ts`.

---

## 5. Build order — the wolves + boars vertical slice

Rather than build the whole abstract foundation first, we're doing **both families end-to-end**, adding only the mechanics they need (these are contact biters — no weapon-band/hit-resolution refactor required yet):

1. **Stats + `routsAt` + raw mobility** — the low-risk base. ✅ **DONE** (see §6).
2. **Throat Tear (`ignoreArmor`) + Pack Tactics** (shared-target passive).
3. **Position-aware Charge** (gap-close + distance-scaled damage) **+ Knockback** (small, capped).
4. **Alpha focus-fire** (Pack Howl targeting override) — first user of the composable-AI targeting knob.

Sandbox-tune after each. Undead boars + patriarch (Hollow bite, breakthrough, death-vomit zone) wait for the Hollow story beat.

## 6. Build status

- **2026-07-25 — Step ① shipped.** Added `raw` sub-stats to `EnemyDefinition` (mirrors `RawSubStats`); flows into `CombatUnit` via `buildEnemyUnits`; `mobilityOf` now consumes `raw.mobility`. Tuned the six: wolves got raw mobility (+1/+2/+2/+3) + raw dodge; Wild Boar → `str5 vit6` + `routsAt 0.30`; Rabid Boar → `dex4`. `shared` typechecks clean, 110/110 tests green. Abilities (Throat Tear / Pack Tactics / Charge / Knockback / focus-fire) still pending — steps ②-④.
