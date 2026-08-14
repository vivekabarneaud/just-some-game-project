# Roadmap — the focus source of truth

Bird's-eye view of what to work on and in what order. One-or-two lines per item + a pointer to the design doc / memory note.
**Not** a duplicate of detailed designs — those live in `docs/DESIGN_*.md`; `docs/DESIGN_INDEX.md` is the doc-vs-code status map.

---

## 🎯 The goal: Act 1 Alpha (set 2026-06-11, structure revised 2026-07)

A complete, balanced Act 1, good enough to hand to first outside players (boyfriend → his friends; nephew later via the French translation). Chapter structure since the July revision: **Ch1 = survival only** (scouting → wolves → Run Down → marshes → Bad Blood, shipped), **Ch2 = witchcraft/maddened arc + the Old Watch climax** — the old Story 2–13 spine is parked behind the `CH2_GATE` sentinel and gets rewritten, not un-gated.

Working agreement: Claude executes, the user decides/reacts/plays. No task is scheduled that requires the user to grind.

**Milestones, in order:**
1. **Finish the foraging minigame slice** (in flight — see Now).
2. **Author Chapter 2** — the confirmed witchcraft/maddened + Old Watch arc; close the Bog Witch back half; decide what of dormant Stories 2–13 gets salvaged. Story 14 (cult assault) is the Act-1 cliffhanger target.
3. **Progression & anti-softlock pass** — gates/costs/durations through Act 1 (DESIGN_BALANCE_PASS is the ledger; get fresh-player signal, don't tune off dev self-play).
4. **Content quality pass** — loot/gear, potions, foods; wire the systems that are 90% built (see Quick wins + Nearly-done below).
5. **Alpha packaging** — first-hour polish, onboarding, loot-chest reveal (memory: `project_early_game_polish`).
6. **French translation (i18n)** — tutorial slice first, last step before the nephew.

---

## Now (in flight)

- **Foraging minigame** (`feat/foraging-minigame`) — scene engine + plants + sandbox built. Remaining: trip economy (one-a-day + Orison Shard renewal), the herbier, yield→larder wiring, home-page placement, art (`FORAGING_PROMPTS.md`). **Doc:** DESIGN_FORAGING_MINIGAME.
- **Farming detail modals** — FramedModal pass for fields/gardens/orchards (pens done, it's the template). **Memory:** `project_farming_modal_pass`.
- **Farming nudges rework** — per-card "new"-style seasonal outlines that clear on hover. **Memory:** `project_farming_nudges`.

## Quick wins (found by the 2026-08-14 sweep — small, visible, do while passing by)

- **Kill the dead recruitment strings** — "Hire your first adventurers at the recruitment board" / "Go to recruitment" in `MissionAssemblyPanel.tsx`; recruitment no longer exists.
- **"Tracks at the Treeline" difficulty bump** — still 1★ single-slot vs a bear+wolf fight.
- **Scarcity-mission cooldown** — forced hunts re-fire every tick while a shortage lasts; seasonal gathers also lack their asserted daily reset.
- **Delete dead code** — `generateCandidate()`/`getCandidateCount()`; orphaned guard-dog + weather-TODO comments; reconcile the `merchantOffers()` "retired" contradiction. (Also logged in TECH_DEBT.)

## Nearly done — the system shipped, one wire is missing

- **Alchemy stations beyond crush+boil** — steep/dry/distil/char/ferment exist in data but are unreachable; the tier-gated station unlock was never wired (DESIGN_APOTHECARY).
- **Mission-map pins** — ~58 of ~130 missions placed; the "Close to home" dock is still load-bearing (DESIGN_MISSION_MAP).
- **Mission climate** — the `climate` field exists, zero missions set it, no seasonal debuff wired. This is the payoff for kitchen warmth/freshness (DESIGN_MISSION_MAP §3, memory `project_mission_climate`).
- **Talent-engine wiring** — trees display ~150 nodes; the combat engine reads ~3 ids. Decide the per-character-bespoke-trees question before investing (DESIGN_TALENT_TREES).
- **Roster pool cut** — recruitment UX rework shipped; the actual 229→~50 cull + reserve pool never happened (DESIGN_ROSTER_CURATION).

## Next (designed & ready to build)

**Combat spine (ordered — the first unblocks the rest):**
1. **Weapon range bands + sidearm slot** — the single biggest cross-doc blocker (DESIGN_COMBAT_FOUNDATION §3); unblocks daggers-in-offhand, marsh grapple, band-driven reach.
2. **Zone hazards + composable AI knobs** — the unbuilt half of DESIGN_TIER1_ENEMIES (patriarch death-vomit, breakthrough).
3. **Marsh snake family** (DESIGN_MARSH) and **spider family** (DESIGN_SPIDERS) — next enemy verticals per DESIGN_ENEMY_AUDIT_METHOD; silk material still doesn't exist.
4. **Rescue/drag-out + Infirmary** (DESIGN_RECOVERY_AND_RETREAT); **positional raids + talents** (DESIGN_POSITIONAL_COMBAT P3/P4); **caster spell-weapons** (DESIGN_NOVICE_ITEMS Phase 2).

**Economy & settlement:**
- **Enchanted team scrolls** — the last third of DESIGN_FOOD_SCROLLS_LOYALTY.
- **Tavern conversations** — the cozy JRPG supports (DESIGN_TAVERN §7, memory `project_tavern_conversations`).
- **Traveling merchants phase 2** — culture merchants, rotation, rapport; unblocks kitchen cultural imports (DESIGN_TRAVELING_MERCHANTS).
- **Storm/blizzard mechanics + Layer 3 aether storms** (DESIGN_WEATHER); water trade + locust event (DESIGN_WEATHER_YIELD leftovers).
- **Cats + vermin loop** (DESIGN_KEPT_ANIMALS second half) and **plague events** (DESIGN_WORKERS_PLAGUES §2).
- **Building tools roster** (DESIGN_BUILDING_TOOLS); **roster economy** — wages must key off the arrival model now (DESIGN_ROSTER_ECONOMY).
- **Offensive alchemy slice** — channels priced but combat ignores them; goes with puffball-as-carrier (memory `project_puffball_smokebomb`).
- **Village tier → TH4 gate move** (memory `project_village_tier_th4`); **marketplace exponential pricing** (memory `project_marketplace_rework`).

**Story & content:**
- **Act-1 enemy palette ratify + PULL list** — buried in DESIGN_CONTENT_EXPANSION under a BUILT header.
- **Expeditions Phase 5** — authored multi-day expeditions; only 2 exist (DESIGN_EXPEDITIONS).
- **Seasonal-gather roster gaps** — First Greens, Mushroom Foraging, the specials (DESIGN_SEASONAL_GATHERS).
- **Faction balance** — needs the Chapel/Shrine rethink first (DESIGN_FACTION_BALANCE).
- **Founder bios revision** — all six parked post-restructure; mute swap Nell→Tomas under consideration (memory index ⚠ note).

## Later (bigger commitment / needs design alignment)

- **Guild full-screen rework** — user will draw it first (memory `project_guild_fullscreen_rework`).
- **Combat log discriminated-union refactor + per-event expedition playback** (memory `project_combat_log_plan`).
- **Custom hand-drawn icons** — art pass (`PROMPTS.md`).
- **Auth hardening** — email verification, password reset, optional Discord OAuth (Google OAuth shipped 2026-06-12).
- **Livestock population model** (DESIGN_LIVESTOCK phase 2 + memory `project_livestock_population`); **NPC settlements beyond Lammast**.
- **i18n (French)** — deferred until content stabilizes; last milestone before alpha handoff.

## Multiplayer (backend exists — needs frontend wiring, not a server build)

- **Co-op expeditions** — server resolution exists; verify/finish the client flow.
- **Cross-player raid defense** (memory `project_friend_raid_defense`) and **raid reinforcements + Pigeon Loft** (DESIGN_RAID_REINFORCEMENTS).
- **Player guilds** (memory `project_player_guilds`).

## Future (post-alpha horizon)

- **Dragon system** (memory `project_dragon_system`; sketch archived in `archive/GAME_DESIGN.md`).
- **Chapters 3+** — faith arc, Inquisition, ward-stone war (memories `project_faith_loyalty_arc`, `project_ward_stone_system`).
- **Companion app** (memory `project_companion_app`); **achievements/milestones** (memory `project_achievements_milestones`).

---

## Open questions / decisions pending

- Foraging home-page placement + first-fruit pick (DESIGN_FORAGING_MINIGAME open questions).
- Talent trees: keep the pentagon or pivot to per-character bespoke trees?
- Pantry/warehouse destructibility (leaning option A since 2026-04).
- Chapel→Shrine faction offset rethink.
- Roster cut list ratification (the ~52 keepers in DESIGN_ROSTER_CURATION).
- Real-prod vs preprod environment rename — deferred to launch.

---

## Recently shipped (2026-06-05 → 2026-08-14, ~728 commits)

- **Free-form kitchen** (Phases A–C3): cooking desk, 69 dishes, painted cookbook UI, tavern-menu + loyalty integration; old crafting UI retired.
- **Free-form apothecary**: brew engine, AlchemyDesk, named recipes, plant-quantity potency.
- **Mission map**: the board became a map — fog reveal regions, authored pins, marching/fighting tokens, travel-by-distance.
- **Side-story director layer**: 10 registered chains incl. Bog Witch front, Lammast, Tollman's Road, the Truffle/fold arc.
- **Food subcategory splits**: meat→9 cuts, fish→4, mushrooms→4, berries split; topbar aggregation.
- **Tavern spine**: rooms/travelers, staffing, pricing, reputation, menu editor.
- **Staffing + ailments**: named-hands coverage per building; fever/gut/wound lines.
- **Kept animals**: dogs (kennel, guard/hunt jobs, breeding, strays, Truffle onboarding).
- **Livestock phase 1**: headcounts, buy/cull with travel time, predation, births.
- **Climate + water**: per-year climate bands, wells/cisterns/sluice, weather crop events.
- **Positional combat P1+P2** + retreat/rout model + beast gear (11 items) + weapon damage model.
- **Recruitment rework**: scripted arrivals replaced the daily recruit rotation.
- **SAVE_VERSION reset-over-migrations**; scarcity forced missions; seasonal gathers; quarry spider gate.

---

*Last updated 2026-08-14 (full doc-vs-code sweep; see `DESIGN_INDEX.md`). Update when scope or status changes — don't let this drift.*
