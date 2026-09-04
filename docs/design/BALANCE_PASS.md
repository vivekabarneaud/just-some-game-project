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

