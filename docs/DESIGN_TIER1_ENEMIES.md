# DESIGN: Tier-1 Enemy Authoring (bestiary pass)

**Status (2026-08-14 audit):** PARTIAL — the wolves/boars/outlaws slice SHIPPED (charge + knockback, packs/morale/routs, ignoreArmor, stun/slow); the in-doc §Build status is current, trust it over older lines. **Composable AI knobs BUILT 2026-08-19** (3 of the 4 knobs — see that section). NOT built: zone hazards (the patriarch death-vomit is a code TODO), the `movement` knob, knockback-immunity/breakthrough, and the rest of the Tier-1 roster.

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

#### ✅ BUILT 2026-08-19 — three knobs wired, one deferred

`shared/src/data/combat/ai/profile.ts` is the single place where an enemy's
authored `ai` block, the legacy fields, and the defaults collapse into one
resolved profile (`resolveAI`); consumers read the resolved profile and nothing
else. Guarded by `frontend/src/engine/aiProfile.test.ts`.

- **`targeting`** — all six modes live in `targeting.ts`. **`opportunist`** and
  **`squishiest`** are new and authorable now; `opportunist` weighs armour/resist
  AND the target's dodge/parry, so it declines to chase a tank it cannot land on.
- **`tauntable`** — `obeys` / `ignores-generic` / `ignores`, via `acceptsTaunt(unit, kind)`.
  The warrior taunt asks for `"generic"`; the future elite pull asks for `"elite"`
  and the plumbing is already there.
- **`fear`** — `canBreak(unit)` gates BOTH break paths (the `routsAt` threshold and
  the morale snap), so authoring `fear: "fearless"` makes a unit hold even with a
  threshold set. Previously fearlessness could only be expressed by *omitting*
  `routsAt`, which conflated "brave" with "never authored".
- **`movement`** (charger/kiter/holder/flanker) is **deliberately NOT wired**: it
  means replacing the positional layer's role-derived `isRanged`/`canBypass`, which
  is its own piece of work. Three knobs wired beats four half-wired, and a declared-
  but-unread field is exactly the debt we keep finding elsewhere. `charge` and
  `combatRole` still carry this behaviour.

**Zero behaviour change**: `aiTier` maps exactly onto `targeting`
(feral→`random`, tactical→`threat`, cunning→`backline`), `tauntImmunity` onto
`tauntable`, and a missing `routsAt` onto `fearless` — which is what the data has
always meant. All 223 tests pass untouched.

⚠ **One discrepancy surfaced, left for a play decision:** production has always
read `feral` as **random** reachable target, while this doc's table and the
positional prototype both read feral as **"maul nearest"**. Rather than silently
re-target every beast, `feral` still maps to `random` and `nearest` ships as its
own mode. Flip the wolves to `nearest` deliberately if it reads better in play —
it is a one-line change per enemy now.

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

## 3b. Outlaws — the Morale archetype

Humans (bandits / the Dominion's hired muscle). Where beasts rout on **HP** (fear of pain), men rout on **courage** — and *that* is the whole faction. They also **fight dirty** (bleed / slow / stun / debuff, not clean beast bites).

**Morale** (per morale-unit, each round; breaks when it drops below 0):
```
morale = courage + (leader alive ? LEADER : 0)
       − LOSS × (their fallen ÷ starting number)   ← mates dropping
       − OUTNUM × (your living − their living, >0)   ← outnumbered
       + PRESS × (1 − your side's HP fraction)       ← smelling the kill
```
Constants in `retreat.ts` (`MORALE = {leader:40, loss:70, outnum:12, press:45}`). The **"kill the leader"** tactic falls out of it: a living leader adds a big cushion, so dropping the captain collapses the rabble. And they *press on* despite losses if you're near death. Units may ALSO carry `routsAt` (HP self-preservation) on top.

| Enemy | id | Role | Dirty trick | Morale |
|---|---|---|---|---|
| **Dominion Tough** | `dominion_thug` | rabble, melee | **Sucker Punch** (dex debuff) | courage 16, routsAt 0.5 — glass nerve |
| **Displaced Brigand** | `bandit_thug` | fighter, melee | **Gutting Strike** (bleed) | courage 45, routsAt 0.3 — desperate |
| **Poacher** *(new)* | `bandit_poacher` | archer (`combatRole: back`) | **Hamstring Shot** (slow) | courage 35, routsAt 0.4 |
| **Cutthroat** *(new)* | `bandit_cutthroat` | melee, `cunning` | **Garrote** (stun) | courage 40, routsAt 0.35 |
| **The Tollman** | `reaver_captain` | T1 leader | Rally (buff) | `leader` — anchors, no morale rout |
| **Dominion Deserter** | `bandit_captain` | T2 boss, ex-soldier | Hold the Line (buff) + raw dodge | `leader`, boss |

Reusable mechanics this pass added: **`stun`** (skip-turn CC — also the Pack-Howl counter), **`slow`** (halved initiative as an ability), tighter **range-gating** (`stun`/`slow`/`debuff_target` now reach-gated). Deferred: a true **flanking Cutthroat** (needs an enemy bypass flag) and **STR-parry** on the Deserter (waits on hit-resolution — raw dodge stands in).

### Outlaw missions, loot & the luck ring (the "place & loop" steps)

**Missions** (the mid-tier bandit missions above novice are **placeholder** — don't trust them). Real coverage: **Run Down** (Toughs — a moral, non-lethal rescue) + **The Tollman's Road** side-chain (drive them off the road → break the Tollman's camp → recover the stolen hoard). Add **one more: a recurring Greyford escort** — the discovery→routine follow-up to the existing *"The Road to Greyford"* (the first trade). Ride shotgun on **Maren's grain-carter / Cobb** on the river-road runs and break the bandits working it. **This homes the new Poacher + Cutthroat** — add them to the road-bandit encounters *and* to the Tollman's camp (an organized company has a sniper + a knife-man). The far-capital **Tessoria** escort is a *later, rep-gated* tier.

**Loot loop — humans drop STOLEN GOODS, not crafting mats:**
- **Gold** — robbed from outsiders (economy-consistent), but kept **scarce**.
- **Stolen gear** — tidy the Brigand's 8-item piñata *by type*: Brigand keeps swords/axe/armour, **knife → Cutthroat**, **bow → Poacher**. Bandits stay the early gear source without one enemy dropping everything.
- **A Stranger's Signet** *(new)* — ✅ **BUILT 2026-07-27.** The thrill jackpot: **rare** (a rare *find*, not a power tier — see [[DESIGN_CRAFTING_PROGRESSION]]), a **+5 Luck** ring, **1% off all four bandits**, non-craftable, tradeable, `uniqueEquip` (no double-signet). *"A traveller's signet, taken off them on the road north. It fit someone once, and they had a name. Now it just fits you."*
  - **Luck stat (BUILT):** a `raw.luck` sub-stat (Combat Foundation), summed across the party → lifts every drop's chance by `LUCK_CHANCE_PER_POINT` (0.01) per point in `rollLoot` (+10 luck → 1% drop becomes 1.1%; deliberately gentle, tune the constant). Also stamped live on the combat unit (`CombatUnit.luck`) as the hook for **Edmund Blackwood** (the gambler) to read in combat later — mechanic TBD. The old per-item `lootMod` field is confirmed vestigial and superseded (not removed, to avoid churn).
  - **`uniqueEquip` (BUILT):** a general ItemDefinition flag; `equipItem` blocks a second copy across slots. *Aside:* `ring2` is currently a dead slot — all rings are `slot: "ring1"`, so `getItemsForSlot("ring2")` returns nothing. Wiring rings into both slots is a separate fix; `uniqueEquip` is already correct for when it lands.

**Greyford escort rewards** — they're poor (a year ahead of us, not rich): ~**5 gold** + **grain** (they pay in kind — farmers) + **the bandit loot** (the real payoff — you get rich off the *bandits*, not off poor neighbours). Reinforces scarce gold; builds **Greyford rapport**.

**New systems this needs (not built):**
- **Luck stat** — lootMod for everyone; **Edmund alone** turns luck into **combat** luck (his gambler's luck is *real* — a luck-scaled chance to shrug a killing blow / a lucky crit). Characterful: the ring's worth depends on *who* wears it.
- **Greyford reputation** — designed-only (Greyford is narrative-only; a Tessoria rep-gate is planned). Add a light rapport counter, or ship the escort's gold/grain/loot first and defer rep.
- **Discovery→routine wiring** off "The Road to Greyford" for the recurring escort.

## 4. Remaining Tier-1 roster — TODO

Author the rest one by one on the foundation (stats + band + only the distinct exceptions): the other Tier-1 beasts/vermin, then Nessa / Gareth / Godric as the uniform-schema reference builds. Track against the enemy list in `shared/src/data/enemies.ts`.

---

## 5. Build order — the wolves + boars vertical slice

Rather than build the whole abstract foundation first, we're doing **both families end-to-end**, adding only the mechanics they need (these are contact biters — no weapon-band/hit-resolution refactor required yet):

1. **Stats + `routsAt` + raw mobility** — the low-risk base. ✅ **DONE** (see §6).
2. **Throat Tear (`ignoreArmor`) + Pack Tactics** (shared-target passive). ✅ **DONE** (see §6).
3. **Position-aware Charge** (gap-close + distance-scaled damage) **+ Knockback** (small, capped). ✅ **DONE** (see §6). Also range-gated abilities (the bite-from-afar fix).
4. **Alpha focus-fire** (Pack Howl targeting override) — first user of the composable-AI targeting knob. ✅ **DONE** (see §6).

Sandbox-tune after each. Undead boars + patriarch (Hollow bite, breakthrough, death-vomit zone) wait for the Hollow story beat.

## 6. Build status

- **2026-07-25 — Step ① shipped.** Added `raw` sub-stats to `EnemyDefinition` (mirrors `RawSubStats`); flows into `CombatUnit` via `buildEnemyUnits`; `mobilityOf` now consumes `raw.mobility`. Tuned the six: wolves got raw mobility (+1/+2/+2/+3) + raw dodge; Wild Boar → `str5 vit6` + `routsAt 0.30`; Rabid Boar → `dex4`. `shared` typechecks clean, 110/110 tests green.
- **2026-07-25 — Wolf mobility re-tune.** A warrior's base mobility (12) out-ran the wolf's +2 raw. Bumped raw mobility so wolves clearly out-pace: Grey +9 (~18 paces/rd vs Godric's ~14), Alpha +10, Gaunt +6, Starving +3 (still > a boar's ~8). Added `/dev-battle` dev page — runs the real engine on picked encounters (wolf/boar presets, the Godric/Nessa/Gareth trio) into the actual CombatPlayback stage, for eyeballing without grinding a mission.
- **2026-07-26 — Outlaw faction (Morale archetype).** New `morale` model (`moraleBreaks` in retreat.ts: courage + leader − losses − outnumbered + smell-blood, wired into the break-and-run check alongside beast `routsAt`) + `leader` flag. New CC: **`stun`** (skip-turn — `stunned` on CombatUnit, burned at turn start; 💫) and **`slow`** ability (halved initiative). Range-gating tightened (`stun`/`slow`/`debuff_target`). Wired the six outlaws + 2 new units (Poacher archer, Cutthroat garrote); `/dev-battle` got outlaw presets. Verified in-sim: leaderless mobs break and run; bleed/slow/stun/debuff all fire. Deferred: flanking Cutthroat (needs enemy bypass), STR-parry (hit-resolution).
- **2026-07-26 — Step ④ shipped: Alpha Pack Howl (focus-fire).** New `pack_howl` ability effect: the alpha marks the **weakest prey** (lowest *current* HP — the pack smells blood: frail archer/mage early, the wounded hero as the fight wears on) and locks the whole pack (self + allies) onto it for 2 rounds with +20% damage. **Temporary taunt-immunity:** while `focusRounds > 0` the pack ignores taunts (new `focusTarget`/`focusRounds` on `CombatUnit`; checked BEFORE taunt in `pickTarget`, only when the prey is in reach). The pack obeys the alpha — counter with **CC/stuns (Nessa's traps) or burst**, not taunt. Combos with Pack Tactics (all on one target → +15% each). Ticks down in `tickStatusEffects`. Rendered as a narration line ("Alpha Wolf howls — the pack turns on Nessa"). This is the first use of the composable-AI **targeting override** knob + the reusable **duration-based taunt-immunity** the roster audit will lean on. Verified in-sim: fires, marks a frail archer, pack piles on. **Wolf family now complete.**
- **2026-07-25 — Round model + charge presentation.** (1) **Interleaved turns:** each unit moves+acts on its own turn (initiative order) instead of two global phases, so a charge flows straight into its gore; the playback folds per-entry `moves` so each unit slides on its own beat. (2) **Chargers act FIRST** (`chargePlan` at round start) — a boar barrels across the field before the slower tank walks up, instead of the tank closing the gap and the boar charging from near-melee. (3) **Charge = one line:** dropped the separate move entry; the gore/dodge entry carries the full sentence ("X charges N paces at Y and gores for D damage") + the run-up slide + the knockback shove, rendered as a single narration line. Knockback confirmed landing (was only ever dodged/defused before).
- **2026-07-25 — Step ③ shipped.**
  - **Range-gated abilities:** `range?` on `EnemyAbility` (default = creature's basic reach). Damage abilities (bleed/poison/infect/damage_mult/aoe) now only strike targets within range; no in-range target → the ability is *held* (no fire, no cooldown burn) and the creature moves/basic-attacks. Fixes the wolf biting the far backline archer (and the Marsh-Adder-from-across-the-field class of bug). Verified: 0 round-1 hits on the backline archer.
  - **Charge:** `charge?: {range, cooldown}` on the enemy + `CHARGE` tuning in positional.ts. In the Move phase a charger with room (gap > contact + minRunup) and cooldown ready barrels up to `range` paces to contact (`chargedThisRound` recorded, cooldown tracked in `cooldowns.charge`). In the action phase the gore's bonus damage (+2.5%/pace, cap +100%) **and** a small capped **knockback** (0.12 pace/pace, cap 6) both scale with distance charged; a charging unit skips other abilities to drive home the gore. Held/engaged units can't charge (gap too small) — engagement defuses it. Verified: Goring Charge fires in boar fights.
  - Boars converted from the placeholder `damage_mult` to real charge: Wild (range40/cd99 — one charge), Rabid (range40/cd2 — frenzied). Tainted + Patriarch also moved to charge config (range40, cd2/3) as placeholders; their Hollow bite / breakthrough / death-vomit stay parked for the Hollow beat.
- **2026-07-25 — Step ② shipped.** `ignoreArmor` primitive on `DamageOptions` (physical hit skips armor reduction). **Throat Tear** = a `damage_mult` ability with `ignoreArmor: true` — on Grey Wolf (1.2×) + Alpha (1.4×). Gaunt Wolf gained its weak Rending Bite (10%/2rd) to complete the gradient. **Pack Tactics**: new `pack?` tag on `EnemyDefinition`/`CombatUnit` (wolves all `pack: "wolves"`); `hasPackmateOn()` in positional.ts; `basicAttack` adds `PACK_TACTICS_BONUS` (+15%) when a living packmate is in reach of the same target. Verified in-sim (Throat Tear fires in 3-wolf fights). tsc clean both packages, 110/110 tests green. **Known gap:** Pack Tactics currently boosts *basic attacks* only, not ability-bites — a later refinement.
