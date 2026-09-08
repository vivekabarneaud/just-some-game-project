# Design: Balance & Pacing Pass

Status: **open backlog** — started July 2026 from a ~24h dev playtest. Purpose: collect
balance/pacing observations in ONE place so they're tackled as a single focused pass
rather than scattered knee-jerk tweaks.

**Audit ledger (2026-08-14):** landed — #4 durations partially (bad_blood 60s, hester_rescue 180s; the full audit not done); #7 recruit prompt half-fixed (delinked copy exists BUT "recruitment board" / "Go to recruitment" strings are still on screen in `MissionAssemblyPanel.tsx` with no recruitment left in the game — cheap visible win). Not landed — #3 difficulty stars (Tracks at the Treeline still 1★ vs bear+wolf), #5 gold-source principle (~60 flat gold rewards remain), #6 founding-winter grace still first-tick-latched, #1/#2 scarcity tuning.

## ⚠️ Read first: the dev-playtest caveat

The dev cannot reliably judge pacing from their own play, and will systematically
feel the game is **too easy / too abundant / too fast**, because:
- They idle for long stretches while building → resources pile up → no bottleneck felt.
- They're already invested → waiting doesn't register as friction like it would for a
  fresh player.
- **Dev mode inflates progression**: seasons are 24 in-game hours and resources accrue
  during idle; prod ties year to the real-world season clock (far slower).

**Do not re-tune rates/costs off dev self-play alone.** The rates were already swung UP
once from an unverifiable fear ("players will wait too long"); changing again from the
same seat risks oscillation. Get real signal first (see Method).

## Observations (from the 24h playtest)

### 1. You can grow to Village while your people starve → but it's a FOOD problem, not a gate problem
Observation: you can race to Village (TH3) and unlock tavern / pens / orchards / apiaries
while citizens starve to death.

**The paradox (dev's key insight, July 2026):** you can't gate the tier on settlement
health, because *the player upgrades specifically to be able to feed their people*.
Blocking the upgrade when starving would trap them (need village to fix food → can't
reach village because food is bad). So a "health floor on tiering" is the WRONG fix.

Reframe: the real issue is the **food economy** — basic survival (feeding a camp/village)
should be achievable without the tier-up being the escape hatch. Direction: make early
food reliably coverable (foragers/hunting/fishing/gardens/pens at low tiers), and fix the
winter squeeze (item 6). If anything, tiering up should *help* survival, not be gated by
it. So this collapses into items 2 + 6, not a new gate.

### 2. Resource abundance — mill/quarry never pinch
At Village with Lumber Mill + Quarry still Lv.1, wood/stone are effectively unlimited;
upgrading them feels pointless. Levers (pick after real signal): lower base gather
rates, raise building/upgrade costs, or — preferred — **make upgrades matter** (tie
something desirable to mill/quarry level so Lv.1 has a visible opportunity cost, making
scarcity a *choice* not a *wait*).

### 3. Difficulty stars ≠ real challenge
`difficulty` (stars) is a hand-set number that ignores **slot count and enemy strength**,
so same-labeled missions have wildly different success. Example: "Tracks at the Treeline"
(1 slot vs forest_bear + wild_wolf) reads 2★ but ~2% success, while "A Bad Season for
Boars" (2 slots vs 3 weak boars) also reads 2★ but ~100%. Fix options: sanity-pass every
mission's `difficulty` against its real encounter/slots, and/or lean the card UI on the
computed success % as the primary signal. ("Tracks" is clearly under-rated — bump it.)

### 4. Mission duration vs lore
Durations should reflect travel distance. A mission happening *near or in the settlement*
should be very short; a trek should be long. Already fixed: Bad Blood 480→60s (boar in
the vegetable rows), Run Down / hester_rescue 600→180s (rescue in the south trees). TODO:
audit ALL missions and set duration by fictional distance.

### 5. Mission rewards vs lore
Rewards should make fictional sense. A mission that **doesn't involve outsiders** probably
shouldn't pay **gold** (where would the coin come from?) — e.g. clearing a sick boar from
your own fields. Internal/defensive missions → resources/meat/materials, not coin. Trade/
escort/outsider missions → gold is fine. Audit rewards alongside the duration pass.

### 6. Food economy / winter famine (the real item-1 fix)
Famine recurs at Village even with all food buildings at Lv.2. Two compounding causes:
- **Founding-winter grace almost never applies.** It latches on the first tick only if
  the settlement's season is winter, AND the save migration backfills EXISTING saves to
  `foundingWinterGrace = false` — so any pre-existing save never gets it. A fresh save
  that starts in winter would. Test: fresh save, winter start, confirm grace + no famine.
- **Winter food is just tight** even at Lv.2 buildings. Likely needs a real tuning look
  (higher winter yields, cheaper storage, or a stronger grace) once the grace question
  is isolated. See `project_early_defenses` (grace), `calcFoodConsumption`.

### 8. Season/year model — dev vs prod (clarification, not necessarily a bug)
`IS_DEV = import.meta.env.VITE_DEV_MODE === "true"`. `frontend/.env.development` sets it
true, so **`pnpm dev` (localhost) → local fast seasons** (spring start, year climbs by
play, 24 game-hrs/season). The **deployed/prod build does NOT set it → `IS_DEV` false →
global/server seasons** (real-world 3-day seasons; `year = global.year - foundingYear + 1`).
So server-synced seasons in play = the prod build. A stale displayed year (e.g. "year 6")
is a leftover `foundingYear` offset from an earlier state; a fresh save resets it to 1.
Implication: if the dev has been on the prod build, their seasons were prod-like (NOT
dev-inflated), so the "too fast to Village" read is more trustworthy than first thought.
Seasons don't gate tiering regardless, so this is mostly cosmetic for pacing.

### 7. "recruit more hands" prompt — FIXED (copy)
The recruit *tab* was removed but the advice is fine; it was just wrong as a link.
Reworded MissionAssemblyPanel's "Everyone is out…" state to plain text: "They will
return. More hands find their way here as you take on adventures and quests." (delinked).
TODO (minor): the first-visit empty-roster state still says "recruitment board" / "Go to
recruitment" (→ roster tab) — reword to match the acquisition model when convenient.

## Method — how to get REAL signal
- **Fresh-player alpha** (boyfriend / friends / nephew): watch where they stall, coast,
  or bounce. Ground truth. Same principle parked for opening-notification density
  (`project_early_game_polish` §I).
- **Deliberate reference run**: dev plays 1× speed, hands-on, no long AFK, once, just to
  *feel* the intended cadence. 20 honest minutes > hours of coding-adjacent idle.
- **Light telemetry** later (time-to-village, resource-surplus curve, mission success
  distribution) once there are real players.

## Already shipped (context)
- Town Hall ungated from story chapters — growth is cost + tier build-prereqs
  (`project_progression_gating`). This is WORKING AS INTENDED; item 1 above is about
  adding a *health* floor on top, not re-gating growth on story.
- Duration fixes: Bad Blood 60s, Run Down 180s.
- Greyford trade reversed (bring stone → get grain) so it fits the early economy.

---

## Playtest signals — economy feels too loose (2026-07-07, dev self-play)

⚠️ **Caveat first (see this doc's top rule):** these are from dev self-play — idle-accelerated, invested, game-literate, dev-inflated saves. Treat as *hypotheses to verify with a fresh player*, not settled tuning. But two of them are **structural**, not just numbers, so they're worth designing around:

1. **Healing is trivially cheap.** Fiber → bandages and potions in large amounts, early. Wounds don't sting because you can top an adventurer to full from home for almost nothing. The new **wounded-damage penalty** (below-40%-HP softens output) makes wounds *matter* more in combat, but the *recovery* side is still too frictionless. Levers to consider: bandages heal less / cost more or gate behind a building; potions require brewed inputs (tie to the alchemy chain); a per-day heal cap or Infirmary throughput (see [[project_adventurer_recovery]] — Model C Infirmary was deferred). Don't nuke healing — make full-topping a *choice*, not a reflex.

2. **Gold is too abundant, and from the wrong source.** Quests/missions hand out too much gold. **Design principle the user wants:** gold should come from **outsiders — trade, merchants, the tavern, caravans** — NOT from the settlement's own missions/quests (except ones that explicitly involve outsiders: escorts, deliveries, bounties paid by a named party). Rationale: it makes the *tavern and merchants matter* (right now the player is so rich the tavern's gold is irrelevant), and it fits the fiction (your own folk clearing wolves don't mint coin; a Dominion trader does). Action when verified: strip/shrink flat `gold` rewards on non-outsider missions; lean gold income onto tavern gold/day + merchant trades + escort/delivery missions. Ties to [[project_traveling_merchants]] + [[project_tavern_system]].

**How to apply:** capture now, verify with a fresh-player session before re-tuning numbers. The *gold-source principle* (2) is safe to adopt as a design rule regardless; the *magnitudes* (1 & 2) wait for non-dev signal.

## Tier-1 enemy danger — measured 2026-09-04, unfixed

Every number here is measured, not felt. Against a **level-2 warrior (64 hp,
~13 effective damage a swing)**:

| enemy | hits to drop her | mobility |
|---|---|---|
| dominion_tough · starving_wolf | 26 | 8 · 16 |
| grey_wolf · goblin_runt · wild_boar · grief_bound_spirit | 22 | 36 · 8 · 8 · 9 |
| displaced_brigand · poacher · cutthroat | 16 | 8–9 |
| rock_skitter | 15 | 9 |
| tollman | 10 | 9 |

**A fight averages 4.5 rounds** (measured over 200 sims) and caps at 20. So
almost nothing in tier 1 can kill anyone — the fight is over long before they
get there. That is the "fights feel too easy" complaint, and it is systemic
rather than per-creature.

**Three structural findings that say HOW to fix it:**

1. **You cannot tune tier 1 by stats.** Enemy damage derives from
   `derivedDamageRange(max(str, dex))`, which rounds to integers — so at tier-1
   magnitudes str 6 and str 7 produce the *identical* range (3–5), and the whole
   tier shares three ranges (2–4, 3–5, 3–6). Doubling a wolf's strength from 4
   to 8 buys 2.4 → 5.3 effective damage.
2. **Authored damage is the lever.** Only **2 of 21** tier-1/2 enemies author
   `dmgMin`/`dmgMax`: `tollman` and `dominion_deserter`. The tollman is also the
   only tier-1 enemy that is actually threatening. That is not a coincidence.
3. **The boar is mis-shaped, not just weak.** 60 hp, pokes for 2–4, mobility 8
   (slower than the warrior's 11, and 4.5× slower than a grey wolf), and
   `charge: { cooldown: 99 }` — one charge per fight, then it walks. A 31-pace
   charge was measured goring for **4 damage**, 6% of her health. Agreed
   direction: ~32 hp, 7–11 damage, mobility ~20, charge cooldown 3. A real boar
   is burst, not attrition — and a *wounded* boar commits rather than flees,
   which wants the transformation system (ROUT_AND_FLIGHT's open remainder).

**Targets to design against:** an enemy should drop a warrior in **6–10 hits**
(so a pack of three is genuinely lethal), a warrior should kill one in **3–5**,
and a tier-1 fight should run **5–8 rounds with real damage taken**.

**Also found:** `cutthroat`, `goblin_runt` and `poacher` appear in **zero**
missions — defined but never fielded. Either give them a home or cut them.

**Sequencing note:** do this pass AFTER `TARGETING.md`, because tuning each
enemy's damage and its targeting weights in one audit is better than tuning
damage now and re-opening every enemy later.

**Knock-ons the danger pass must carry (review 2026-09-04):**

- **Raids move with it.** `raidCombat.ts` imports `buildEnemyUnits` — the raid
  sim is fed by the SAME enemy definitions. Buffing tier-1 damage makes every
  wolf/boar raid harder against the same walls; re-check garrison/wall numbers
  in the same pass, or defense difficulty drifts silently.
- **Recovery and the healing economy.** More damage taken means longer wounded
  time at home and more salve/potion demand. That is the intended pressure (it
  finally gives the apothecary a customer), but it should be *watched*, not
  discovered.
- **Mission previews.** The card's success % is stat-based (thr = diff×8) and
  does not read combat sims — after the pass, spot-check that a mission's stars
  still roughly match how dangerous it actually is.
- **The 20-round cap is an OPEN QUESTION.** Asked 2026-09-04, not yet answered:
  is the cap itself part of why nothing feels dangerous? With the target of
  5–8-round fights the cap stops binding either way, so decide it AFTER the
  pass, on post-pass data.

## Done 2026-09-05: VIT decoupled, the wolf family, and the real difficulty dial

### VIT is gone from creatures

A creature has no gear and no stat growth, so it does not need VIT. It used to
supply BOTH hp (`vit * 10`) and natural armour (`vit * 3`) — one stat doing two
jobs, which welded toughness to hide and made hp tunable only in steps of ten.
Measured cost of that coarseness: three grey wolves at 30 hp was an 82% win and
at 40 hp a 13% win. **The tuning target sat in a gap that could not be reached.**

Now `hp` and `raw.armor` are authored outright on all 22 enemies and `vit` is
gone from `EnemyDef` entirely. Mitigation collapsed to one branchless line:

```ts
let def = unit.gearDefense + (unit.raw?.armor ?? 0);
```

Converted as a provable no-op first (`hp = vit*10`, `armor = vit*3`) so the whole
pre-existing suite confirmed nothing moved, then tuned on top. Adventurers keep
`vit * 8` — for them VIT is still purely hp, and the gear double-dip it creates
is filed as debt, not fixed here.

Two stale comments died with it: `types.ts` called `raw.armor` INERT (it is read),
and the `enemies.ts` header called natural armour `VIT / 3` (it was `* 3`).

### The tuning baseline: common gear (decided 2026-09-05)

Tier-1 creatures are measured against **a real weapon plus a chest piece and
boots, all common rarity** — `iron_sword` / `short_bow`, `chainmail_shirt` /
`leather_vest`. Not the starter kit. Two settlers in patched leather losing to a
wolf pack is the correct and realistic outcome, and early missions reach for the
weaker family members instead of being propped up by weak creatures.

This was forced by measurement: at grey wolf hp 32, adding *only* a real weapon
took the fight from 63% to 100%, and adding *only* armour took it from 63% to
99%. Either half alone flips it. The starter kit is the outlier — `plain_sword`
(3-5) and `iron_sword` (4-7) are both labelled **common** yet differ by 37%.

### The wolf family

| | hp | dmg | armor | shape |
|---|---|---|---|---|
| grey_wolf | 30 | 6–9 | 6 | pack adult; survives by evasion (dodge 5, elusive 25), not bulk |
| gaunt_wolf | 22 | 4–6 | 4 | lean yearling, lighter and less sure of its bite |
| starving_wolf | 14 | 3–5 | 2 | the runt; one solid blow ends it |

Three greys against the baseline: **91% win, 5.0 rounds, 52% hp lost, 8 deaths
per 200.** You win, you are bloodied, and occasionally someone does not come
back. The bite sits deliberately under the boar's 7–11 gore — 40 kg of jaw is
not 100 kg of tusk — and the wolf's real lethality is its existing kit: Rending
Bite bleeds and Throat Tear ignores armour, which is how a wolf beats a man in
mail. It goes under it rather than through it.

### ⚠ The finding that outranks all of the above: bodies per slot

**Party size sets tier-1 difficulty, not enemy stats.** The same encounter, same
common gear, varying only the number of slots:

| encounter | 2 slots | 3 slots | 4 slots |
|---|---|---|---|
| 5x grey_wolf | **0%** win | 33% | **100%**, 17% hp |
| 3x rabid_boar | 0% | 72% | 100% |
| 5x rock_skitter | 11% | 94% | 100% |

Five bodies overwhelm two adventurers no matter *which* creatures they are — a
knot of six deliberately weak wolves (1 grey + 3 gaunt + 2 starving) still only
reached 71%. Action economy swamps every per-creature number.

**So per-creature stats should set HOW a thing fights (burst vs attrition, fast
vs slow, armoured vs evasive) and the encounter-to-slot ratio should set how
hard the mission is.** Tune shape per creature; tune difficulty per encounter.

Applied twice already: `story_1_scouting` (the first fight in the game, taken in
the starter kit) went from 3 greys — a 9% win and near-certain death at the
tuned numbers — to 3 gaunt yearlings, which is also the better opening animal
narratively. And `wolves_at_the_wall` went from 5 greys at 2 slots (0% win, 186
deaths per 200) to a realistic mixed pack of 2 greys + 3 gaunt at 3 slots: 79%
win, 46% hp lost.

### Landscape after the pass — what is still wrong

Measured at each mission's own slot count, common gear, 120 seeds.

**Too hard:**

| mission | slots | encounter | common gear |
|---|---|---|---|
| `a_bad_season_for_boars` | 2 | 3x rabid_boar | **0% win** — unwinnable |
| `clear_the_diggings` | 2 | 5x rock_skitter | 11% — and it is a FORCED urgent mission |
| `the_salmon_run` | 2 | 2x forest_bear | 31% |

**Too easy** — `dominion_tough` is the worst offender in the tier; five of them
cost a 3-slot party 2% of its health:

| mission | encounter | hp lost |
|---|---|---|
| `grain_for_the_north` | 2x dominion_tough | **0%** |
| `run_down` | 5x dominion_tough (3 slots) | 2% |
| `a_mothers_errand` | 3x dominion_tough | 4% |
| `foraging_run`, `no_one_followed` | 1x grey_wolf | 9% |
| `the_deer_yard` | 2x gaunt + 2x starving | 15% |
| `bee_tree_first` | 1x forest_bear | 19% |

**Families still untuned:** dominion_tough, rock_skitter, forest_bear,
marsh_adder, displaced_brigand, tollman, rabid/tainted boars, grief_bound_spirit,
plus goblin_runt / poacher / cutthroat which are still fielded nowhere.

## Done 2026-09-06: tier 1 is fully authored

Every one of the 15 tier-1 creatures now authors its `hp`, `dmgMin`/`dmgMax` and
`raw.armor`. **Nothing in tier 1 derives its damage any more** — the flat 2-4 /
3-5 / 3-6 cluster that made the whole tier feel identical is gone.

| creature | hp | armor | roll | real dmg | routs |
|---|---|---|---|---|---|
| starving_wolf | 14 | 2 | 3–5 | 4–6 | 0.45 |
| rock_skitter | 18 | 10 | 3–5 | 5–9 | none |
| goblin_runt | 20 | 6 | 5–8 | 7–11 | none |
| gaunt_wolf | 22 | 4 | 4–6 | 6–8 | 0.35 |
| marsh_adder | 28 | 4 | 4–6 | 7–11 | none |
| grey_wolf | 30 | 6 | 6–9 | 9–14 | 0.3 |
| cutthroat | 32 | 6 | 8–11 | 14–19 | 0.35 |
| poacher | 34 | 6 | 6–9 | 10–14 | 0.4 |
| wild_boar | 34 | 18 | 7–11 | 10–16 | 0.3 |
| rabid_boar | 36 | 18 | 7–11 | 12–19 | none |
| grief_bound_spirit | 40 | 12 | 6–9 | 9–14 | none |
| displaced_brigand | 40 | 6 | 5–8 | 8–13 | 0.3 |
| dominion_tough | 44 | 14 | 7–10 | 9–13 | 0.35 |
| forest_bear | 70 | 27 | 8–12 | 14–22 | 0.3 |
| tollman | 110 | 30 | 8–13 | 15–25 | 0.3 |

**"Real dmg" is the number that matters.** The authored roll is multiplied by
`(1 + max(str, dex) * 0.1)` before mitigation, so a 7–11 roll on a str-7 creature
lands as 12–19. Author against the *real* column, not the roll.

### The rule the numbers follow

Each creature's shape comes from what it IS, and the description was usually the
brief already:

- **A creature's armour is its hide or what it wears.** A boar's shoulder shield
  (18) is why hunters carried heavy spears; a wolf's coat is 6. `displaced_brigand`
  is "a desperate man with a rusty blade, probably a farmer" — he had 21 armour and
  70 hp, i.e. better protected than a boar. Now 6 and 40.
- **Madness is behavioural, not statistical.** `rabid_boar` was 80 hp poking for
  3–5. It is the SAME ANIMAL as a wild boar — identical tusks, identical hide. It
  is dangerous because it never routs and charges every second round, so it now
  carries the wild boar's exact 7–11 and a comparable 36 hp.
- **Size is hp, not armour.** `rock_skitter` is described as "hand-sized" and had
  50 hp with armour 15. It is 18/10 now — chitin is its only defence.
- **The glass cannon is allowed to be glass.** `cutthroat` ("a length of wire and a
  fast knife, goes for whoever looks softest") is 32 hp hitting for 14–19.

The behaviour layer needed no work — `packNerve` + courage 16 on the tough,
`softness: 1` on the cutthroat, `erratic` + no-rout on the rabid boar were all
already authored by the AI-knobs pass. Only the numbers were wrong.

### Landscape now (27 tier-1 missions, common gear, own slot counts)

Healthy: `hold_the_road` 84% -> 94%, `a_mothers_errand` 4% -> 24% hp lost,
`clear_the_marshes` 25% hp, `lean_times` 39% hp, `bee_tree_first` 34% hp (one
bear is now a real fight), `wolves_at_the_wall` 79% / 46% hp.

**Fixed by family tuning:** `clear_the_diggings` went from **10% to 100%** — it is
a FORCED urgent mission the player cannot decline, and it was very nearly
impossible because a tide of hand-sized bugs had 50 hp each.

**Still broken, and both for the same reason:**

| mission | slots | encounter | common |
|---|---|---|---|
| `a_bad_season_for_boars` | 2 | 3x rabid_boar | 0% |
| `the_salmon_run` | 2 | 2x forest_bear | 0% |

Neither is a stats problem. Three never-routing boars, or two bears, against two
adventurers is the action-economy wall — and *realistically it should be*. Both
want a third slot; measured at 3 slots, 3x rabid_boar is 72%. Left for
playtesting per the dev's call (2026-09-06): tune creatures globally, tune
individual missions when they are actually played.

**Still trivial** (all 1x encounters or swarms of the deliberately weak):
`grain_for_the_north` 3% hp, `foraging_run` / `no_one_followed` 9%,
`quarry_expedition` 10%, `run_down` 12%, `the_deer_yard` 15%,
`clear_the_diggings` 16%.

### Next: tier 2+ is untouched and much worse

The parked CH2_GATE story missions measure at **0% win with 340-440 deaths per
150 seeds** (`story_3_dark_treeline`, `story_4_captains_rest`, `story_6`, `9`,
`11`, `13`) — all `wastes_phantom` / `captain_hale_stub` encounters at tier 2-3,
still sponges with derived damage. `tainted_boar` (130 hp, derived 3-6) and
`tainted_patriarch` (180) need the same shape correction the tier-1 boars got.
Tier 2 also needs its own gear baseline decided before its numbers mean anything.

## Done 2026-09-04: the boar, and the level curve

**The boar** is burst instead of attrition: 30 hp (was 60) with an authored
7-11 gore (was a derived 2-4), mobility ~20 (was 8 — it was outrun by the
armoured warrior chasing it), and `charge.cooldown` 3 (was 99: one charge per
fight, then it walked). Against a level-1 warrior: drops her in 7 hits (was
21), she kills it in 5 (was 10), full charge ~31% of her health (was 10%).

**`CLASS_STAT_GROWTH` halved**, ~15 points a level to ~7 (+2 to the pair that
defines the class, +1 to the rest). The argument was not feel, it was that
`STAT_POINTS_PER_LEVEL`'s own comment says "gear is the main customization"
while the best tier-1 weapon carried +6 points against a level's +15 — gear was
noise. A steel sword is now worth two levels instead of two-thirds of one, and
warrior HP grows 64 -> 368 over twenty levels rather than 64 -> 824.

Effect on pacing, measured: tier 1 is now meaningful from L1 to L3 (boar needs
7 -> 10 hits, charge 31% -> 21%) where before it was finished by L2 (7 -> 15
hits). **No growth rate keeps a 30 hp boar relevant at L8** — fights average
4.5 rounds, so an enemy must land roughly a quarter of a hero's health per hit
to threaten at all. That is what enemy `tier` is for; this buys pacing, not
permanence.

⚠ **Accepted gap:** thinning stat growth thins what a level gives, and the other
two things it should give are unbuilt — see TECH_DEBT 1.16 (155 talent nodes,
zero combat reach, plus two dead hooks) and 1.17 (`statReq` authored by nothing).

### Corrections to the section above

The "hits to drop a warrior L2" table earlier in this doc was measured through
`buildRecruitFromPremadeId(..., 2)`, which rolled `Math.random()` for the
character's rank (TECH_DEBT 1.15) — so those figures are averages over teams of
**random** strength, not a level-2 warrior. Read them as level-1-ish and
directional. Everything under this heading is measured against a deterministic
hero built at an exact level.

