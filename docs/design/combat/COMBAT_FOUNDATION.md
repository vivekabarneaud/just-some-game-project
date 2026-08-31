# DESIGN: Combat Foundation — Stats & Weapons (SOURCE OF TRUTH)

**Status (2026-08-14):** §1–3 BUILT — stat schema + hit resolution (`combat/stats.ts`, locked by `hitResolution.test.ts`/`weaponDamage.test.ts`) AND the §3 weapon layer: range bands on weapons (`weaponBand`/`MELEE_BAND`/`RANGED_BAND`), the universal `sidearm` gear slot (daggers on any class), band-based swing selection primary→sidearm→fists (`weaponAt` in `positional.ts`, locked by `weaponBands.test.ts`), enemy natural attacks as profiles (`attackBand` + a claws fallback at the old exposure fraction), and the exposure/`isRanged`-reach hacks retired. Still open from §3: band-aware MOVEMENT (units still close to contact, so finer bands — dagger 0–3, spear 2–8 reach — wait on that), throwing knives. Damage schools/resistances remain schema-only: declared in types but never applied in `damage.ts`. §5 spell power still deferred.
**One-line:** One uniform stat + weapon layer shared by *every* combatant (adventurer and enemy), so positioning, gear, talents, and per-creature authoring all sit on the same base. This is the substrate the Tier-1 enemy pass and the talent trees build on.

Related: [[design/combat/POSITIONAL_COMBAT.md]] (the 1D layer that consumes these), the enemy-by-enemy authoring pass.

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
| **STR** | **all physical attack power — melee AND ranged** (draw the bow, drive the blade) · **Parry** |
| **DEX** | **Accuracy (hit) · Crit · Dodge · Mobility** — pure precision & agility, *no raw power* |
| **INT** | *(magic power — DEFERRED, see §5)* |
| **VIT** | Max HP |
| **WIS** | magic resistance · **Initiative (equal weight with DEX)** · *(healing power — DEFERRED)* |

**Rebalance (2026-07-25, LOCKED):** all physical power (melee *and* ranged) is **STR**. Power is cleanly STR-only — no finesse-damage on DEX; assassins ride **crit** instead (revisit only if they feel weak). DEX is the *precision & agility* stat: **Accuracy, Crit, Dodge, Mobility** — none of it raw damage. A pure-DEX archer is a nimble crit-fisher; a STR archer hits like a truck.

### Secondary stats — `derived floor + raw bonus`

| Stat | Floor from | Notes |
|---|---|---|
| **Max HP** | VIT | (VIT × n; adventurers and enemies may use different n — reconcile on build) |
| **Crit %** | DEX | chance to crit; raw crit on gear/talents |
| **Accuracy %** | DEX | *(new)* chance to LAND a hit — counters the defender's Dodge/Parry. This is what lets DEX beat evasive/parrying foes (enemies dodge + parry too — uniform schema). |
| **Dodge %** | DEX | evade an attack entirely (get out of the way) |
| **Parry %** | STR | *(new)* deflect an incoming **physical** attack with your weapon; STR's defensive identity. Distinct from Dodge (DEX). Resolution order + whether it fully negates or reduces/counters → decide on build. |
| **Mobility** | DEX / class | paces moved per turn (positional). Raw mobility = "fast" without "critty" (wolves). **Separate from Initiative** — a wizard is slow to move but quick to act. |
| **Initiative** | **DEX + WIS (equal weight)** | turn order. WIS no longer halved: an old wise wizard barely moves but casts the fastest spell and acts first. |
| **Armor** | gear | physical mitigation. Raw armor on gear/talents. |

### Hit resolution (attacker vs. defender) — ✅ BUILT 2026-07-27

Everyone attacks and defends with the same knobs (uniform schema — enemies dodge and parry too):

1. **Avoided?** effective avoidance = defender's **Dodge** (evade) + **Parry** (deflect, physical only), reduced by attacker's **Accuracy**. One roll; on avoid, no damage (flavor it "dodged" vs "parried"). *So DEX-Accuracy counters DEX-Dodge + STR-Parry.*
2. **Crit?** on a landed hit, roll the attacker's **Crit**.
3. **Damage** = STR-scaled weapon damage − Armor (physical) / Resistance (by school), × crit.

**Pinned at build (2026-07-27):** `getAvoidance = clamp(Dodge + Parry(physical only) − Accuracy, 0, 75)`; one roll, on avoid the attack **fully negates** (reduce/counter deferred, e.g. a future riposte talent). Parry gated on physical via `dealsMagicalDamage`. `raw.armor` now joins the physical mitigation pool in `getDefenseReduction`. Combat events carry a `parried` flag (alongside `dodged`) for "Parry!" vs "Dodge!" flavor. No separate miss — non-landing is always the defender's dodge/parry. `getAvoidance`/`MAX_AVOIDANCE` in combat/stats.ts; guarded by `hitResolution.test.ts`. Still inert: `accuracy`/`parry`/`armor` are now LIVE; magic power (INT) + resistances remain deferred (§5, no casters at novice tier).

### Damage types & resistances

**Physical is NOT a resistance** — it's mitigated by **Armor + Parry**. A stone golem just has huge armor; it needs no separate "physical resist." Resistances cover the magical/elemental schools only.

**Damage schools** (each has a matching resistance, default 0):

| School | Covers |
|---|---|
| **Aether** | **arcane** magic (wizards' formless force). NB: in the *lore* "aether" = all magic; as a combat *school* it means arcane specifically. |
| **Fire** | burning — magical *or* real (a torch reads the same as a firebolt) |
| **Frost** | cold — magical or real |
| **Lightning** | storm / shock — magical or real |
| **Light** | holy / radiant (priests, the Light — lore-locked force) |
| **Hollow** | death / void / decay (undead, Netheron's death-magic, the Malice/8th god — lore-locked force) |
| **Nature** | poison, venom, blight, disease (the froth, adder venom, rot) — the "green" school, à la WoW's Nature |

Not the wolves (bites are Physical). But the schema carries these so the skeleton resists Hollow, a fire elemental resists Fire, a plague-thing resists Nature, etc. (Light + Hollow are lore-locked forces; Aether/Fire/Frost/Lightning/Nature are ours to shape.)

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
Use the **best weapon whose band fits** the target's distance, in preference order:
1. **Primary** (in its band).
2. **Sidearm** (in its band).
3. **Fists** — unarmed, always available, weak. *No sidearm + pinned = a fist fight*, not "nothing happens."

**But attacking isn't always the play.** The movement/AI may instead **reposition to restore a better weapon's range** rather than settle for a feeble poke:
- An archer pinned with only a 1-damage dagger is often better off **backing away to get the bow into range** than trading knife-jabs.
- A grappled Godric might **shove/step back** to swing the longsword instead of dagger-poking.

So: the swing uses the best in-range weapon (primary → sidearm → fists), while movement weighs *"reposition for my real weapon"* vs *"attack now with the fallback."* That per-situation call is an AI/talent nuance (e.g. a "Kiting Shot" or "Disengage" talent tips it toward repositioning); the baseline is "attack with what's in range."

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
