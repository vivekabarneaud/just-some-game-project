# DESIGN: Tier-1 Gear & Materials (wolf + boar loot loops)

**Status:** Designed 2026-07-26. **Gear BUILT 2026-07-27** (all 11 items + recipes + Sinew Bow accuracy live; guarded by `beastGear.test.ts`). Loot fixes (§Loot) still TODO. The spec for the "make the wolf/boar gear live" build session. Follows [[DESIGN_ENEMY_AUDIT_METHOD]] (the loop step), [[DESIGN_CRAFTING_PROGRESSION]] (leather tier, rarity=power), [[DESIGN_NOVICE_ITEMS]] (day-one loadout).

**One-line:** Each Tier-1 family's drops craft gear that *is its identity*. **Wolves = agility** (dodge / mobility / crit / accuracy + −Presence), **boars = toughness** (armour / STR / VIT + +Presence). Hunt the beast → become the beast.

---

## Systems this needs (the build checklist)

1. **gear → raw sub-stats.** ✅ **BUILT** (2026-07-27). Items carry a `raw` block; `getEquipmentRaw` sums it; `buildAdventurerUnit` stamps `CombatUnit.raw`. crit/dodge/mobility work now; accuracy/parry inert until hit-resolution.
2. **Presence stat.** ✅ **BUILT** (2026-07-27). `classPresenceFloor` (warrior +10 · assassin −15 · archer −8 · wizard/priest −6) + gear `raw.presence`; `presenceToThreatMult` (0-presence → 1.0×, warrior → 1.5×, assassin → 0.25×) drives the ongoing threat multiplier, AND `applyPresenceBaselineThreat` seeds each enemy's threat at combat start (`K=10`) so the tank is the target from round 1 — overcoming the "hit the squishy" defence-pull. NOT attribute-derived. Verified: a tactical foe focuses the warrior over the assassin. (`K` + floors are tuning knobs.)
3. **Gloves slot** (new). ✅ **BUILT** (2026-07-27). Added to `ItemSlot`, `ALL_GEAR_SLOTS`, both `equipment` type defs + every init, and the AdventurerDetail doll/labels. Home for the Fang-Studded Gauntlets.
4. **Daggers as a belt sidearm** — **BUILT 2026-08-14** with the weapon-band work: a universal `sidearm` slot (any class carries a dagger), band-based swing fallback primary→sidearm→fists. The dedicated off-hand slot stays for shields/focuses.
5. **New material `boar_tusk`** (whole tusk). ✅ **BUILT** (2026-07-27). Material def + resource unions; drops on living boars only (wild 8%, rabid 10%) — tainted prestige stays parked.
6. **Loot fixes** — ✅ **mostly BUILT** (2026-07-27). Wolf meat inversion fixed (Grey now drops the best meat/hide; condition-scaled down through Gaunt→Starving), `keepOnRout` fang on all three wolves, Wild Boar given its materials (bristlehide + tusk_shard), Rabid drops **no meat** (diseased). **DEFERRED:** the `cloven_hoof`/`boar_skull` hygiene rewrite (§Loot) — turns out wild boars appear in NO mission, so rabid is the only early boar fought, and the L1 Reeds chain needs those parts early. Sourcing decided during the **ch2 pacing pass** (tainted boars + bog witch both turn at ch2). Rabid keeps cloven/skull for now so nothing's stranded.

Deferred: **set bonuses** (Pack Hunter / boar tank), **tainted/Hollow crafting** (the Patriarch's corrupted mats — unresolved worldbuilding), plate/mail lines. (Weapon-band auto-swap + the sidearm slot: BUILT 2026-08-14.)

## Material → sub-stat identity

| Wolf (agility) | | Boar (toughness) | |
|---|---|---|---|
| wolfhide | dodge / mobility | bristlehide | armour (DEF) / VIT / STR |
| fang | crit | tusk_shard | (accents, alchemy) |
| sinew | accuracy | boar_tusk | STR (a heavy blade) |

Presence sits at the two poles: the wolf **Hunter's Cloak = −Presence** (vanish), the boar **Hauberk + Hood = +Presence** (loom).

---

## Wolf gear — the "Pack Hunter" set (agility)

All Leatherworking unless noted, uncommon, guild L2–3, +1 primary. "Annotated" = raw sub-stat, pending gear→raw.

| Item | Slot | Recipe | Live | Annotated |
|---|---|---|---|---|
| **Greypelt Jerkin** | chest | wolfhide ×2 + leather ×2 + sinew_cord ×1 | 26 DEF, +1 DEX | +2 Dodge |
| **Wolfhide Treads** | boots | leather ×2 + wolfhide ×1 + sinew_cord ×1 | 12 DEF, +1 DEX | +2 Mobility |
| **Hunter's Cloak** | cloak | wolfhide ×2 + leather ×1 + sinew_cord ×1 | 10 DEF, +1 DEX | **−Presence** |
| **Fang-Studded Gauntlets** | gloves *(new slot)* | fang ×3 + wolfhide ×1 + leather ×1 + sinew_cord ×1 | 10 DEF, +1 DEX | +3 Crit |
| **Crude Fang Dagger** | main-hand · Blacksmith | fang ×1 + wood ×1 + fiber ×1 | dmg 2–5, **common** (rarity-rule: 0 sub-stat, the crude is cheap-damage-only) | — |
| **Fang Dagger** | main-hand · Blacksmith | fang ×1 + wood ×1 + sinew_cord ×1 | dmg 3–6 | +3 Crit |

*Naming note (build):* a pre-existing **rare** alpha-fang dagger already held the `fang_dagger` id — renamed to **Alpha Fang Dagger** (`alpha_fang_dagger`) to free the id for this regular one. Off-hand/dual-wield deferred with the weapon-band work; all three daggers are main-hand (archer/assassin) for now.

**Ranged piece already exists:** `sinew_bow` (Sinew Bow, woodworker, +1 DEX +1 STR draw, dmg 5–8) — **annotate +Accuracy**. Prestige `alpha_warbow` exists ("the bow's answer to the fang"). Alpha-fang masterwork sword exists. Set bonus concept: **2pc +Mobility, 4pc "Pack Hunter"** (bonus crit vs a target an ally is also engaging — the wolves' own Pack Tactics turned on them).

## Boar gear — the tank set (toughness)

Leatherworking, uncommon, guild L2–3. **Presence only on the two signature pieces**; the rest are honest toughness anyone (assassin/archer) can wear for STR/durability without pulling aggro.

| Item | Slot | Recipe | Live | Annotated |
|---|---|---|---|---|
| **Bristlehide Hauberk** | chest | bristlehide ×3 + leather ×2 | **38 DEF**, +1 STR | **+Presence** |
| **Bristlehide Greaves** | legs | bristlehide ×2 + leather ×2 | 24 DEF, +1 STR | none (broad-appeal) |
| **Tusked Boar-Hood** | head | **boar_tusk ×2** + bristlehide ×2 | 18 DEF, +1 VIT | **+Presence** |
| **Bristlehide Shoes** | feet | bristlehide ×1 + leather ×2 | 13 DEF, +1 VIT | none · pointedly **no mobility** ("planted") |
| **Tusk Dagger** | main/off-hand · Blacksmith | boar_tusk ×1 + wood ×1 + leather ×1 | dmg 3–6, **+1 STR** *(live!)* | — |

Fang = crit (finesse), Tusk = STR (raw power): two daggers, pick your build or dual-wield.

---

## Loot fixes & the material ladders

**Wolves** — fix the inverted meat + unify the drop set, condition-scaled; **`keepOnRout` on fang for ALL wolves**:

| | meat | wolfhide | fang (keepOnRout) | sinew |
|---|---|---|---|---|
| Grey (fed) | 0.5 (2–4) | 0.4 (1–2) | 0.5 (1–2) | 0.2 |
| Gaunt | 0.3 (1–2) | 0.25 | 0.35 | 0.12 |
| Starving | 0.15 | 0.12 | 0.3 | 0.1 |
Alpha: prestige oneOf alpha_fang / alpha_sinew (existing).

**Boars** — give Wild its materials, Rabid drops **no meat** (diseased), + the new tusk ladder:

| | meat | bristlehide | tusk_shard | **boar_tusk (new)** | cloven_hoof | boar_skull |
|---|---|---|---|---|---|---|
| **Wild** | 0.5 (2–4) | 0.35 | 0.8 | **0.08** | — | — |
| **Rabid** | — | 0.3 | 1.0 | **0.10** | — | — |
| **Tainted** *(parked)* | — | tainted | tainted | — | **1.0** (source) | — |
| **Patriarch** *(parked)* | — | tainted | tainted | — | — | **1.0** (source) |

- **`boar_tusk`** (whole, curved, dense) — the blade material. Rare drop (~8–10%) on **living** boars only; the tainted prestige tusk is **parked with Hollow crafting**.
- **Loot hygiene:** `cloven_hoof` (the witch's "useless" oddity) and `boar_skull` (bog-witch trophy) drop **only from their quest source at 100%** (tainted boars / Patriarch), removed from the low-% scatter on wild/rabid — no clutter. `tusk_shard` keeps a broad drop (alchemy sink). `bristlehide` now has a sink (the armour).

---

## Boar missions (the "place & missions" step)

Current coverage: the **Maddened Herd** side-chain (Bad Blood → A Bad Season for Boars → What the Scouts Saw → Reading the Carcass → **The Tainted Spring**, Patriarch climax) + two novice one-offs (The Miller's Boy, The Old Bridge) + a **staged** "Rabid Boar Hunt" (off-board). Wild boars had **no** mission at all. Two changes:

1. **Wild Boar Hunt ("Lean Times", recurring · survival).** ✅ **BUILT 2026-07-27.** Wild boars (`wild_boar ×2`), **meat** reward + the boar's own loot, **forced onto the board on food scarcity** — larder in deficit AND under `WILD_BOAR_HUNT_FOOD_HOURS` (3) from empty. Implemented via the engine's **`forceMission`** path (no new `MissionRequirements` field needed after all; requirements can't express "food-low", and forceMission bypasses requires) + a never-met sentinel `requires` for forced-only. Recurring (not `unique`) so it returns each crisis; flagged `urgent` (orange outline). See [[project_forced_missions]].

2. **Rabid Boar Hunt → the chain's opening beat.** *Un-stage* it (its narration is already "something in the water… before the herd follows") as the **first mission of the Maddened Herd chain**, NOT a separate recurring mission. So **all rabid/tainted content lives in the one escalating chain** (rabid → tainted → Patriarch) and there's never two look-alike boar-threat missions side by side. **No separate recurring rabid/tainted hunt** (add a light gap-filler later *only* if playtesting shows dead air).

**Reward rule (applies broadly):** gold is **external** income (trade, outsiders' bounties) — the settlement doesn't pay *itself*. So an **internal defense/survival** mission (culling maddened boars) rewards **XP only**; materials come from the encounter loot (skin what you kill). And you **can't eat diseased/tainted boars** → no meat from the threat hunt (consistent with rabid dropping no meat). The Wild Boar Hunt is the only boar mission that rewards meat.

**Taint pacing:** the Tainted Spring is the **contained first taste** of the taint. It blooms later (Wastes/Thinning expand, the bog witch, more tainted/revenant enemies) — so tainted boars + the parked undead-tier + tainted-crafting get their real payoff *then*. Introduce small now, escalate later.
