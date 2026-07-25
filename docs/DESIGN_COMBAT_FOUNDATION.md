# DESIGN: Combat Foundation — Stats & Weapons (SOURCE OF TRUTH)

**Status:** Design agreed, not yet built. Drafted 2026-07-25.
**One-line:** One uniform stat + weapon layer shared by *every* combatant (adventurer and enemy), so positioning, gear, talents, and per-creature authoring all sit on the same base. This is the substrate the Tier-1 enemy pass and the talent trees build on.

Related: [[DESIGN_POSITIONAL_COMBAT.md]] (the 1D layer that consumes these), the enemy-by-enemy authoring pass.

---

## 1. Principles

1. **Uniform.** Adventurers and enemies use the *same* schema. A wolf and a warrior differ only in values, not in kind.
2. **Derived floor + raw bonus.** Every secondary stat = a floor derived from a primary attribute, PLUS a raw bonus from gear/talents/authoring. So DEX gives baseline crit, but a ring can add raw crit; a wolf can get raw mobility without inflating its DEX (and thus its crit/dodge). This decoupling is the whole point.
3. **Defaults everywhere.** Every stat has a default (usually the derived floor, or 0). You never *have* to author a value, so no combatant is ever missing a stat — but you only author the *exceptions* that make a creature distinct.
4. **Authored exceptions.** Ranges, resistances, raw sub-stats, and special effects are opt-in per creature/weapon. A plain melee mook inherits everything.

---

## 2. The canonical stat schema

### Primary attributes (authored per combatant)

| Attribute | Governs |
|---|---|
| **STR** | melee physical power · **Parry** |
| **DEX** | ranged/finesse power · Crit · Dodge · Mobility · Initiative |
| **INT** | *(magic power — DEFERRED, see §5)* |
| **VIT** | Max HP |
| **WIS** | magic resistance · part of Initiative · *(healing power — DEFERRED)* |

### Secondary stats — `derived floor + raw bonus`

| Stat | Floor from | Notes |
|---|---|---|
| **Max HP** | VIT | (VIT × n; adventurers and enemies may use different n — reconcile on build) |
| **Crit %** | DEX | chance to crit; raw crit on gear/talents |
| **Dodge %** | DEX | evade an attack entirely (get out of the way) |
| **Parry %** | STR | *(new)* deflect an incoming **physical** attack with your weapon; STR's defensive identity. Distinct from Dodge (DEX). Resolution order + whether it fully negates or reduces/counters → decide on build. |
| **Mobility** | DEX / class | paces moved per turn (positional). Raw mobility = "fast" without "critty" (wolves). |
| **Initiative** | DEX + WIS/2 | turn order |
| **Armor** | gear | physical mitigation. Raw armor on gear/talents. |

### Resistances (default 0, authored where they matter)

`physical · magic · fire · frost · poison · …` — extensible. Not the wolves; but the schema carries them so the skeleton resists physical, a fire creature resists fire, etc., at higher tiers.

---

## 3. Weapons & range bands

**Range comes from the weapon, not the role.** Every weapon carries a range band; a combatant uses the weapon whose band fits the current distance.

### Weapon fields (add to the item schema)
- **`minRange` / `maxRange`** (paces) — the band in which this weapon can strike.
- (existing) damage range, `weaponType`, stat scaling.

Reference bands (tune on build):

| Weapon | min–max (paces) |
|---|---|
| Bow | ~8 – 100 |
| Throwing knife | ~3 – 15 |
| Spear / polearm | ~2 – 8 (**reach**) |
| Longsword | ~1 – 5 |
| Dagger / sidearm | 0 – 3 |

### The sidearm slot (new gear slot)
A **secondary weapon** (usually a dagger or throwing knife) that everyone can carry. **The fallback when the primary's band doesn't fit the range.**

### Attack resolution (per swing)
1. Target within the **primary** weapon's `[minRange, maxRange]` → use primary.
2. Else, if a **sidearm** exists and the target is within *its* band → use sidearm.
3. Else → no attack this turn; the unit closes/repositions instead.

This **replaces two current hacks**:
- The hardcoded "pinned ranged → dagger" (exposure) → now just "below the bow's minRange → sidearm."
- Role-derived reach (`isRanged` → contact vs whole-field) → now the weapon's band.

Worked cases it answers:
- **Archer minRange:** enemy inside the bow's minRange → draw the dagger/throwing knife.
- **Grappled longsword:** enemy below the longsword's minRange → Godric draws his sidearm.
- **Reach weapon:** a spear strikes from 2–8, over the front line.

### Enemies as weapon-bearers
An enemy's **natural attack is a weapon profile** (band + damage): wolf bite `0–5`, a *spitting* adder `5–20`, a biting adder `0–5`. Most enemies need no sidearm. **Abilities carry their own `range`** (paces); default = the creature's basic band. So an ability is contact-gated unless authored as ranged — which is what stops the range-cheating we saw with the Marsh Adder.

### Effect-schema extensions (per creature, as needed)
New flags added when a creature calls for them, e.g.:
- **`ignoreArmor`** on a damaging effect — the wolf's **Throat Tear** (goes for the neck; chainmail is no help).
- (future) `ignoreDodge`, `trueDamage`, `pierceResist`, etc.

---

## 4. Build plan

1. **Stat schema** — formalize primary + secondary (derived floor + raw) + resistances, with defaults, unified across `CombatUnit` (adventurers + enemies). Add **Parry** and **raw sub-stats**. Enemies gain raw sub-stats (raw mobility for wolves).
2. **Weapon ranges + sidearm slot** — `minRange`/`maxRange` on weapons; the `sidearm` gear slot; retire the exposure/`isRanged` hacks in favour of band-based weapon selection.
3. **Range-gated attacks & abilities** — attack resolution picks primary/sidearm/none by band; abilities gated by their authored `range`.
4. **Author creatures** on top — starting with the wolves (already designed), then the rest of Tier 1.

Talents/gear then layer raw sub-stats and new weapon bands on this base.

---

## 5. Deferred / parked

- **Spell Power (INT) & Healing Power (WIS)** and their raw sub-stats — no magic at novice tier. Parked here so we remember to slot them into the same `derived floor + raw` pattern when casters arrive.
- **Parry resolution details** — full negate vs. reduce vs. counter, and its order relative to dodge — decide at build time.
- **Max-HP formula reconciliation** — adventurers (VIT×8) vs enemies (VIT×10) currently differ; unify or keep intentional on build.
- Resistance breadth (which elements) — grow as higher-tier enemies need them.

---

## 6. Current reality (so the doc is honest)

Today: primary STR/DEX/INT/VIT/WIS exist; crit (`5+DEX×0.5`), dodge (`DEX×1.0`), initiative (`DEX+WIS/2`) are **pure-derived, no raw layer**; HP = VIT×8 (advs) / ×10 (enemies); armor via gear `gearDefense`; magic resist via WIS/gear. **No** parry, **no** raw sub-stats, **no** authored weapon ranges (reach is role-derived), **no** sidearm slot, resistances only as physical/magic reduction. This doc is the target; §4 is the path.
