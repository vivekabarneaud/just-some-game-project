# Design Doc Index

**Purpose:** one-screen map of every doc in `docs/` — what it is, whether it's actually built, and what to do with it. Regenerated from a full 4-agent doc-vs-code sweep on **2026-08-14** (previous sweep: 2026-06-05; ~728 commits in between).

**The big finding, again:** the code raced ahead of the docs, harder than last time. The mission map, side-story chains, scarcity missions, positional combat, the tavern spine, the free-form kitchen, building staffing, livestock, kept-animal dogs and weather Layer 2 all shipped while their docs still said "not built" / "IDEA". Status lines in every affected doc were corrected in this pass. Four superseded docs moved to `archive/`.

**What to build next lives in `ROADMAP.md`** — this file only maps docs to reality.

**Status legend:**
`BUILT` shipped & matches · `PARTIAL` some shipped · `BACKLOG` designed, not built · `IN PROGRESS` being built now · `REF` reference/canon · `METHOD` process doc · `STALE` describes a changed reality

---

## Built — keep as reference (remainders noted in each doc's status line)

| Doc | Note |
| --- | --- |
| DESIGN_KITCHEN.md | Free-form kitchen Phases A–C3 (69 dishes, boons, tavern menu, loyalty recipes). Open: per-dish gold value, cultural imports (needs merchant rapport). |
| DESIGN_TAVERN.md | Hospitality spine (rooms/staffing/pricing/reputation/menu). Open: conversations (teaser only), economy tuning. |
| DESIGN_MISSION_MAP.md | Shipped well past Phase 1 (fog reveal, dev placer, team tokens). Open: ~58/130 pins placed, climate is display-only. |
| DESIGN_SIDE_STORIES.md | 8 sideChains + the director layer (`story/chains.ts`) live. Open: Bog Witch back half. |
| DESIGN_SCARCITY_MISSIONS.md | Built via engine `forceMission` (wood/stone/food/water triggers). Open: no cooldown guardrail. |
| DESIGN_WEATHER_YIELD.md | Climate bands + water system. Year-band drought-kill superseded by momentary weather events. |
| DESIGN_FARMING_EXPANSION.md | Apiary/orchards/saplings/cheese. Leftover: hops, culture seeds. Mushroom-forager section superseded by the foraging minigame. |
| DESIGN_LIVESTOCK.md | Phase 1 (headcounts, buy/cull, predation, births). Phase 2 working animals later. Guard-dog toggle superseded by KEPT_ANIMALS. |
| DESIGN_DEFENSES.md | Ring combat sim + page. Ring→tier table corrected this pass (Town adds Middle, City adds Inner). |
| DESIGN_CITIZEN_CATEGORIES.md | Built; code added a founder floor not in the doc. |
| DESIGN_CONTENT_EXPANSION.md | Gems/Jewelcrafter/rings built — but a live Act-1 **enemy-roster backlog** is buried in it (palette ratify, PULL list, hale stub). |
| DESIGN_RACES_ORIGINS.md | Built except the per-tag weakness/resist multiplier table (only 2 binary immunities exist). |
| DESIGN_TIER1_GEAR.md | All 11 beast-gear items live + test-locked. Daggers-in-offhand blocked on the sidearm slot. |
| DESIGN_EXPEDITIONS.md | Engine + recovery slot + timeline. Phase 5 content open (only 2 authored expeditions). |

## Partial — shipped core, live remainder

| Doc | Note |
| --- | --- |
| DESIGN_COMBAT_FOUNDATION.md | Stats + hit resolution BUILT. **Weapon range bands + sidearm slot NOT** — the single biggest cross-doc blocker (gear, marsh, positional all wait on it). Damage schools declared, never applied. |
| DESIGN_POSITIONAL_COMBAT.md | P1+P2 built for missions (`positional.ts`, CombatBattlefield). Open: raids, positional talents, enemy flanking. |
| DESIGN_TIER1_ENEMIES.md | Wolves/boars/outlaws slice shipped. Open: zone hazards, composable AI knobs, rest of roster. |
| DESIGN_NOVICE_ITEMS.md | Weapon-damage model + rarity built. Open: caster spell-weapons (Phase 2). |
| DESIGN_RECOVERY_AND_RETREAT.md | Rout/flee/panic + home recovery built. Open: rescue/drag-out, Infirmary building, log-union refactor. |
| DESIGN_APOTHECARY.md | Brew engine + desk built, BUT only crush+boil stations reachable in-game; offensive channels inert; tier-gated station unlock unbuilt. |
| DESIGN_KEPT_ANIMALS.md | Dogs built (kennel, jobs, breeding, strays). Cats + vermin loop open. |
| DESIGN_WORKERS_PLAGUES.md | Staffing shipped (as named-hands coverage, not the doc's pool model) + ailments shipped. Plague events open; cat half superseded by KEPT_ANIMALS. |
| DESIGN_WEATHER.md | Layer 1 built; Layer 2 shipped via WEATHER_YIELD. Open: storm/blizzard mechanics, Layer 3 aether storms. |
| DESIGN_TRAVELING_MERCHANTS.md | Slice 1 (Cobb + Lammast wagon). Open: culture merchants, rotation, rapport. |
| DESIGN_FOOD_SCROLLS_LOYALTY.md | Food + loyalty + per-adventurer slots built. **Enchanted scrolls = the one remainder.** Farming section duplicates FARMING_EXPANSION. |
| DESIGN_ROSTER_CURATION.md | Recruitment UX rework shipped (scripted arrivals, rotation gone, cap bypassed). **The 229→~50 pool cut not done** (4 arrivals, 3 traits authored). |
| DESIGN_TALENT_TREES.md | Trees built & displayed — but only ~3 talent ids are read by the combat engine; most nodes stat/UI-only. Pentagon pending the bespoke-trees decision. |
| DESIGN_SEASONAL_GATHERS.md | Bee/apple/fish/berry pairs + scarcity hunts live. Open: daily cooldown (asserted, not implemented), First Greens, specials. |
| DESIGN_SPIDERS.md | Quarry spider-gating built. The spider family itself (web root, ambush, brood mother, silk) unbuilt. |

## Backlog / design-only

| Doc | Note |
| --- | --- |
| DESIGN_MARSH.md | Snake family + Blind/grapple/venom mechanics unbuilt. The fenbalm/reeds economy around it already exists — read before re-designing. |
| DESIGN_BUILDING_TOOLS.md | Still only `cutting_board`; full roster + buff slots unbuilt. |
| DESIGN_ROSTER_ECONOMY.md | Wages/states/retirement unbuilt. Must now key off the arrival model (cap already bypassed). |
| DESIGN_QUIRKS_REWORK.md | Premise drifted: curated cast → per-character authored quirks, not a tagged random pool. Keep as text bank. |
| DESIGN_FACTION_BALANCE.md | Church + Thornveil escalation; zero mechanical state in code. Chapel/Shrine rethink still required. |
| DESIGN_RAID_REINFORCEMENTS.md | Nothing built; coop/ws rails exist. For the multiplayer push. |
| DESIGN_BALANCE_PASS.md | Open ledger; ~2 of 9 landed. Two cheap wins flagged (stale recruitment strings, Treeline difficulty). |
| DESIGN_ACT1_SETTING.md | Accurate setting frame; mission categories 3 (lifeline north) and 6 (hauntings) are the thin ones now. |
| DESIGN_CRAFTING_PROGRESSION.md | Principle doc — adopted and visibly applied (leather→mail→plate is real). |
| DESIGN_ENEMY_AUDIT_METHOD.md | Method doc; its §Families table is the live per-family tracker. |

## In progress (branch `feat/foraging-minigame`)

| Doc | Note |
| --- | --- |
| DESIGN_FORAGING_MINIGAME.md | Data + sandbox layer built (scene engine, plants, mask, tests). Open: trip economy, herbier, larder wiring, home placement. |
| FORAGING_PLANTS.md | Working sheet — plant catalogue, one identity per plant. |
| FORAGING_PROMPTS.md | Working sheet — foraging art backlog. |

## Lore canon (hierarchy unchanged since 2026-06)

**`LORE_TIMELINE.md` is the single top authority.** `FOUNDING_CHARACTERS.md` is the parallel authority for the six founders; `docs/cast/` covers recruitable adventurers + NPCs (non-overlapping scope, and its README defers to TIMELINE).

| Doc | Role | Note |
| --- | --- | --- |
| LORE_TIMELINE.md | **CANON** (top) | Locked cosmology (Eighth God, Sundering, two-zone Wastes). |
| FOUNDING_CHARACTERS.md | **REF** | Six founders incl. Nell; matches `founding_characters.ts`. Known slip: `cast/arrival-order.md` counts "6 founders + Nell" — off by one, fix someday. |
| LORE_FINAL.md | CANON-PARTIAL | Owns factions/NPCs/races; cosmology stale; name drift (Dryven→Drayven, Kess→Niamh — TIMELINE wins). |
| LORE_EIGHTH_GOD.md | CANON-PARTIAL | Overtaken by TIMELINE on mechanics; keeps Bahruun detail. |
| LORE_OPEN_IDEAS.md | HOLDING | Khor'vani Alchemy still parked here but treated as canon in FINAL/TIMELINE — reconcile someday. |
| DESIGN_LORE_EXPANSION.md | REF | Varek ghost-court lore; **zero of it in code** (no court figures, no §5 bosses). Header flags 5 canon breaks vs TIMELINE — resolve into the body before using. |
| LORE_AUDIT_2026-06-11.md | REF | The alpha lore punch-list. |
| ANACHRONISMS.md | REF (decision log) | Mostly closed; zero OPEN rows. One loose end: gourd art still a squash placeholder. |
| docs/cast/*.md | REF | Recruitable cast + NPC canon. |

## Meta / story / tracking

| Doc | Currency | Note |
| --- | --- | --- |
| ROADMAP.md | **CURRENT** (rewritten 2026-08-14) | **The focus source of truth.** |
| TECH_DEBT.md | CURRENT (living) | Ranked debt register; check before refactors. |
| STORY_PLAYER_SCRIPT.md | PARTIAL-DORMANT | Stories 2–13 authored but gated off by `CH2_GATE`; shipped Ch1 (Run Down/Marshes/Bad Blood) isn't in it. Best prose source for deferred chapters only. |
| PROMPTS.md / PROMPTS_DONE.md | art backlog / done-log | Live pair. |
| KITCHEN_PROMPTS.md | art backlog | Kitchen/alchemy art. |
| EARLY_PACING_MAP.html | REF (visual) | Early-lane pacing board (2026-07); re-render if the Ch1 restructure moves lanes. |

## Archived this pass (2026-08-14, in `docs/archive/`)

- **DESIGN_PREMADE_CHARACTERS.md** — superseded by DESIGN_ROSTER_CURATION + code (`arrival` replaced `unlockCondition`; rarity/family/recruit-pool concepts dead).
- **DESIGN_BACKEND_SLICE.md** — backend shipped with a different shape (Player + blob + snapshots); table specs are historical.
- **GAME_DESIGN.md** — the founding doc, overtaken everywhere. Still holds the three-tier resource taxonomy + building tech-tree framing, and the dragon-system sketch (also in memory), if ever needed.
- **STORY_ACT1_BEAT_MAP.md** — claimed to map the built spine but predates the Ch1 restructure; presented dormant Stories 2–13 as live. Re-derive from code when Ch2 is authored.

---

## Cross-cutting findings from the sweep (small, real, easy to lose)

1. **Weapon range bands + sidearm slot** — highest-leverage unbuilt item; four docs blocked on it.
2. **Damage schools/resistances** — schema exists, `damage.ts` never applies them (still binary physical/magical). MARSH's "one-line" venom resist isn't one line.
3. **Alchemy techniques unreachable** — steep/dry/distil/char/ferment exist in data; the desk only offers crush+boil.
4. **Stale UI strings**: "Hire your first adventurers at the recruitment board" + "Go to recruitment" (`MissionAssemblyPanel.tsx`) — recruitment no longer exists.
5. **Dead code**: `generateCandidate()` / `getCandidateCount()` (`shared/src/data/adventurers.ts`) have zero callers.
6. **Orphaned comments**: guard-dog gold toggle (`gameState.tsx` ~6408), `weather.ts` header still says Layer 2 TODO.
7. **Marketplace contradiction**: comment says faceless random offers are retired; `merchantOffers()` still generates them.
8. **Forced scarcity missions** re-fire every tick while a shortage lasts (no cooldown).
9. `cast/arrival-order.md` founder count is off by one vs FOUNDING_CHARACTERS + code.

---

*Regenerated 2026-08-14 from a 4-agent doc-vs-code sweep. Regenerate when the code/doc gap grows again.*
