# Design: Balance & Pacing Pass

Status: **open backlog** — started July 2026 from a ~24h dev playtest. Purpose: collect
balance/pacing observations in ONE place so they're tackled as a single focused pass
rather than scattered knee-jerk tweaks.

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
