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

### 1. Progression is not gated on settlement HEALTH (highest priority)
You can race to Village (TH3) and unlock tavern / animal pens / orchards / apiaries
**while your citizens are starving to death.** Nothing ties tiering to the settlement
being stable. Building-prereqs + cost are the only gate (see `project_progression_gating`
— that ungating was deliberate and good), but there's no floor for *basic viability*.

Candidate fix (needs design decision): require a minimum stability to raise the Town Hall
tier — e.g. no active famine, population fed, happiness above a floor, for the last N
hours. Growth stays build-gated, but you can't crown yourself a village while the folk
starve. Keep it forgiving (a warning, then a soft block), not punishing.

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

### 6. Food economy / winter famine
Famine recurs at Village even with all food buildings at Lv.2. Likely (unconfirmed) the
**founding-winter grace never applies in dev** (dev starts in spring, so the 0.7× ration
never latches — it only triggers for a winter-founded settlement in prod). Confirm in
prod, or add a dev toggle to test the grace path. If famine persists WITH grace, the
winter food economy needs a real tuning look. See `project_early_defenses` (grace),
`calcFoodConsumption`.

### 7. Obsolete "recruit more hands" prompt (verify)
MissionAssemblyPanel's "Everyone is out… recruit more hands" empty state (when all
adventurers are on missions) is flagged as obsolete — reconcile with the current roster
model (`project_roster_curation`: curated cast, replenishing reserve, no daily rotation).
Confirm whether recruitment is still the right pointer, then fix the copy/link.

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
