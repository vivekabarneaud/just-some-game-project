# Design Doc Index

**Purpose:** one-screen map of every doc in `docs/` — what it is, whether it's actually built, and what to do with it. Built from a full sweep cross-checking each doc against the codebase on **2026-06-05**.

**The big finding:** the code raced ahead of the docs. ~8 docs marked "not yet implemented" (or carrying no status line) are in fact **built**. Several others are partially built. The genuine backlog is much smaller than the doc pile suggests.

**Status legend:**
`BUILT` shipped & matches · `PARTIAL` some shipped · `BACKLOG` designed, not built · `STALE` doc describes a now-changed reality · `CANON`/`REF` lore source · `HOLDING` parked ideas

---

## Systems / mechanics design

| Doc | Real status | Note → action |
| --- | --- | --- |
| DESIGN_BACKEND_SLICE.md | **STALE** (built, diverged) | Full backend exists (`backend/`, `prisma/schema.prisma`, routes, ws, tick). Schema diverged: Adventurer/ActiveMission never got their own tables (stayed in the `gameState` blob). → **Update status + reconcile or archive.** |
| DESIGN_CITIZEN_CATEGORIES.md | **BUILT** | `CitizenCounts`, `founderCitizens()`, `ageStep`, food multipliers, defense-eligibility all live. Adds a founder-floor not in the doc. → **Update status to BUILT.** |
| DESIGN_DEFENSES.md | **BUILT** | Ring combat sim (`raidCombat.ts`), Defenses page, garrison modal all shipped. **Contradiction:** doc's ring→tier unlock table is wrong vs `ringUnlocked` (Middle at Town, Inner at City). → **Update status + fix the table.** |
| DESIGN_EXPEDITIONS.md | **BUILT** (core) | `expeditionEngine.ts`, expedition content, recovery slot, timeline UI, even co-op resolution. Phase 5 (authored expeditions) + deferred polish remain. → **Update status; keep Phase 5 as the open part.** |
| DESIGN_FARMING_EXPANSION.md | **BUILT** | Apiary/honey, orchards/fruit, forager mushrooms, cheese all live. Duplicates the farming section of FOOD_SCROLLS_LOYALTY. → **Add BUILT status; dedupe vs that doc.** |
| DESIGN_CONTENT_EXPANSION.md | **BUILT** | New enemies, gems, Jewelcrafter building + page, rings all shipped. → **Add BUILT status; keep as reference.** |
| DESIGN_RACES_ORIGINS.md | **BUILT** (mostly) | Races/origins, stat mods, enemy tags, backstory-trait passives, ghost/aether immunities live. Full weakness/resist multiplier table only partial. → **Add status; trim shipped "future" section.** |
| DESIGN_TALENT_TREES.md | **BUILT** | `talents.ts` (651 lines) has full per-class trees + hybrid-title capstones. Doc claims "structure deferred" — the biggest accuracy gap. → **Update status; note remaining advanced mechanics.** |
| DESIGN_FOOD_SCROLLS_LOYALTY.md | **PARTIAL** | Food crafting + loyalty + per-adventurer slots BUILT; **enchanted team scrolls NOT.** Farming section duplicates FARMING_EXPANSION. → **Trim to the scrolls backlog; dedupe farming.** |
| DESIGN_WEATHER.md | **PARTIAL** (accurate) | Layer 1 (ambient) shipped this session; Layers 2/3 (drought/storm, aether storms) designed only. → **Keep — status is correct.** |
| DESIGN_PREMADE_CHARACTERS.md | **PARTIAL** | ~219-character pool + Pantheon shipped; family/rarity/unlock-condition fields NOT. → **Update status to PARTIAL.** |
| DESIGN_BUILDING_TOOLS.md | **BACKLOG** (accurate) | Only `cutting_board` exists; full ~18-tool roster + buff/secondary slots unbuilt. → **Keep.** |
| DESIGN_ROSTER_ECONOMY.md | **BACKLOG** (accurate) | Wages/states/vacation/retirement unbuilt; hard cap `3+guildLevel×2` still enforced. Loyalty model overlaps the shipped 0-100 loyalty. → **Keep; reconcile loyalty model when built.** |
| DESIGN_WORKERS_PLAGUES.md | **BACKLOG** | Worker-staffing + plague events unbuilt. Depends on citizen-categories. → **Add explicit BACKLOG status line.** |
| DESIGN_QUIRKS_REWORK.md | **BACKLOG** | Still a flat `PERSONALITY_QUIRKS: string[]`; tagged system unbuilt. → **Add status line.** |
| DESIGN_FACTION_BALANCE.md | **BACKLOG** | Merged Church + Thornveil escalation (2026-06-05); originals in `archive/`. Neither built; Church side needs a Chapel→Shrine rethink. → **The live faction-balance spec.** |
| DESIGN_LORE_EXPANSION.md | **REF / BACKLOG** | Varek's ghost court lore (reference); its boss-progression + missions unbuilt. → **Keep as lore ref; cross-link to LORE_TIMELINE.** |

## Lore canon (hierarchy)

**`LORE_TIMELINE.md` is the single top authority.** `FOUNDING_CHARACTERS.md` is the parallel authority for the founder cast. Everything else is legacy or parked.

| Doc | Role | Note → action |
| --- | --- | --- |
| LORE_TIMELINE.md | **CANON** (top) | Working-canon synthesis; locked cosmology (Eighth God, Cassandra-Netheron Sundering, two-zone Wastes). → **Assert primacy in its status line.** |
| FOUNDING_CHARACTERS.md | **REF** (authoritative) | Source-of-truth for the six founders; no cosmology conflict. → **Keep; ensure TIMELINE points here.** |
| LORE_OPEN_IDEAS.md | **HOLDING** | Working as intended. Khor'vani Alchemy is parked here but already treated as canon in FINAL/TIMELINE. → **Reconcile that one item.** |
| LORE_FINAL.md | **CANON-PARTIAL** | Still owns factions/NPCs/races; cosmology stale. Name drift: **Dryven→Drayven, Kess→Niamh** (TIMELINE wins). → **Update status + note name drift.** |
| LORE_EIGHTH_GOD.md | **CANON-PARTIAL** | Introduced the reframe; overtaken by TIMELINE (Severance-misfire vs Cassandra-Netheron). → **Cross-ref TIMELINE; fold in eventual consolidation.** |
| ~~LORE_DEEP_SEALS.md~~ → `archive/` | **SUPERSEDED** | Contradicted the Eighth-God canon. Bahruun/Hammerfall detail migrated to `LORE_EIGHTH_GOD.md` §6; archived 2026-06-05. |

## Meta / story / tracking

| Doc | Currency | Note → action |
| --- | --- | --- |
| STORY_PLAYER_SCRIPT.md | **CURRENT** | Most up-to-date story doc (through Story 13). → **Treat as the primary story source.** |
| PROMPTS_DONE.md | **CURRENT** | Done-log half of the art-prompt pair; consistent with shipped assets. → **Keep.** |
| PROMPTS.md | **PARTIAL-STALE** | Live art backlog, but story-slide titles drifted vs code. → **Reconcile slide titles; prune completed.** |
| ~~STORY_MISSIONS.md~~ → `archive/` | **RETIRED** | Superseded by STORY_PLAYER_SCRIPT (Story 13) + `storyMissions.ts`; archived 2026-06-05. |
| GAME_DESIGN.md | **PARTIAL-STALE** | Oldest doc; still titled "Medieval Realm" (now Valenheart); predates lore/story/guild/talents/weather. → **Retitle + scope to economy/systems, point lore at TIMELINE.** |
| ROADMAP.md | **STALE** | Last updated 2026-04-29; lists Defenses/Citizen-categories/Expeditions/Talents as pending though they shipped. → **Refresh against this index.** |

---

## What's actually left to build (the payoff)

Distilled from the above — the real backlog, not the doc count:

**Designed & ready to build:**
- Enchanted team scrolls (FOOD_SCROLLS_LOYALTY, the unbuilt third)
- Weather Layers 2 & 3 — drought/storm/blizzard + aether storms (WEATHER)
- Roster economy — wages/states/retirement (ROSTER_ECONOMY)
- Building tools full roster (BUILDING_TOOLS)
- Workers & plagues (WORKERS_PLAGUES) — depends on citizen-categories (now built)
- Quirks rework — tagged personality system (QUIRKS_REWORK)
- Faction balance — Church + Thornveil escalation (needs merge + a Chapel/Shrine rethink)
- Premade characters — family/rarity/unlock layer (PREMADE_CHARACTERS)
- Expeditions Phase 5 — authored multi-day expeditions (EXPEDITIONS)

**Doc hygiene — DONE 2026-06-05:**
- ✓ Marked the stale "not implemented" docs BUILT/PARTIAL/BACKLOG
- ✓ Flagged contradictions: Defenses ring→tier table; Backend schema; Church Chapel→Shrine; lore name drift (Drayven/Niamh)
- ✓ Archived LORE_DEEP_SEALS (salvaged Bahruun first); merged Church+Thornveil → DESIGN_FACTION_BALANCE; retired STORY_MISSIONS; refreshed ROADMAP

**Doc hygiene — still pending:**
- Reconcile Khor'vani Alchemy (parked in LORE_OPEN_IDEAS but treated as canon in FINAL/TIMELINE)
- Retitle/scope GAME_DESIGN.md (still "Medieval Realm"; predates the lore/story layer)
- Eventual lore consolidation: fold FINAL + EIGHTH_GOD into LORE_TIMELINE

---

*Generated 2026-06-05 from a full doc-vs-code sweep. Regenerate when the code/doc gap grows again.*
