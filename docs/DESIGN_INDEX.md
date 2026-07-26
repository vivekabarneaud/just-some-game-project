# Design Doc Index

**Purpose:** one-screen map of every doc in `docs/` — what it is, whether it's actually built, and what to do with it. Built from a full sweep cross-checking each doc against the codebase on **2026-06-05**.

**The big finding:** the code raced ahead of the docs. ~8 docs marked "not yet implemented" (or carrying no status line) are in fact **built**. Several others are partially built. The genuine backlog is much smaller than the doc pile suggests.

**Status legend:**
`BUILT` shipped & matches · `PARTIAL` some shipped · `BACKLOG` designed, not built · `STALE` doc describes a now-changed reality · `CANON`/`REF` lore source · `HOLDING` parked ideas

---

## Systems / mechanics design

| Doc | Real status | Note → action |
| --- | --- | --- |
| DESIGN_TAVERN.md | **BACKLOG** (spine) | Hospitality layer on the existing passive ale→happiness tavern: rooms/travelers (exponential 1/2/4/8), menu (staples now, adventurer dishes later), occupancy-from-prosperity, cozy conversations. Locked July 2026. → **Build phase 1 (Tavern page UI prototype).** |
| EARLY_PACING_MAP.html | **REF** (visual) | Standalone board of every early-game narrative lane (settlement/guild/defense/social) over the story-mission spine, with cross-lane unlocks + gaps. Open in a browser. Built 2026-07 during the defense-lane breadcrumb pass. → **Keep as the pacing source-of-truth; re-render if lanes change.** |
| DESIGN_BACKEND_SLICE.md | **STALE** (built, diverged) | Full backend exists (`backend/`, `prisma/schema.prisma`, routes, ws, tick). Schema diverged: Adventurer/ActiveMission never got their own tables (stayed in the `gameState` blob). → **Update status + reconcile or archive.** |
| DESIGN_CITIZEN_CATEGORIES.md | **BUILT** | `CitizenCounts`, `founderCitizens()`, `ageStep`, food multipliers, defense-eligibility all live. Adds a founder-floor not in the doc. → **Update status to BUILT.** |
| DESIGN_DEFENSES.md | **BUILT** | Ring combat sim (`raidCombat.ts`), Defenses page, garrison modal all shipped. **Contradiction:** doc's ring→tier unlock table is wrong vs `ringUnlocked` (Middle at Town, Inner at City). → **Update status + fix the table.** |
| DESIGN_COMBAT_FOUNDATION.md | **PLANNED** (new) · **SOURCE OF TRUTH** | Uniform stat + weapon layer for ALL combatants (enemy + adventurer): canonical stat schema (STR/DEX/INT/VIT/WIS primaries; secondary = derived floor + raw bonus: maxHP/crit/dodge/**parry**(STR)/mobility/initiative/armor; resistances default 0); weapons carry `minRange`/`maxRange` bands + a new `sidearm` slot (out-of-band → sidearm, replacing the pinned=dagger hack); ability `range` (default = creature basic band) fixes range-cheating; effect flags like `ignoreArmor` (wolf Throat Tear). Spell/heal power DEFERRED (no magic yet). Written 2026-07-25. → **Build the foundation before authoring the Tier-1 enemy pass.** |
| DESIGN_POSITIONAL_COMBAT.md | **PLANNED** (new) | 1D position axis for the auto-resolved sim: mobility, move-then-act, range/exposure, engagement-vs-threat ("highest-threat *reachable*"), AI-tier discipline (feral/tactical/cunning), assassin bypass/flank + peel-off dilemma. Fixes exposed-archer imbalance; unlocks charge/knockback/pull/reach/leap talents. Stage-v2 (wide battlefield) reuses `CombatantCard`. Adjacent raw-secondary stat system (crit/dodge/mobility) flagged separate. Written 2026-07-25. → **Build P1 MVP (mission combat) after the combat-log stage lands.** |
| DESIGN_CRAFTING_PROGRESSION.md | **PRINCIPLE** (new) | Armor advances by material + craft complexity (**leather → mail → plate**), gated by building level + resources, NOT hard slot-locks. Early blacksmith = mail, not plate; plate is late (steel + town + master smith, Khazdurim flavour). The "no good head/leg armor early" feel emerges from world-gating, not arbitrary rules. Complements DESIGN_NOVICE_ITEMS (day-one loadout + rarity=stat-budget). Written 2026-07-26. |
| DESIGN_SCARCITY_MISSIONS.md | **IDEA parked** (new) | Missions that appear when a **resource runs low** — a never-soft-locked safety valve (low food -> a meat hunt, low wood/stone -> emergency gather). Needs a new resource-below `MissionRequirements` gate wired to existing scarcity signals (famine ration threshold). First instance = the Wild Boar Hunt. Guardrails: genuine-shortage-only, cooldown, situation-aware narration. Written 2026-07-26. |
| DESIGN_ENEMY_AUDIT_METHOD.md | **METHOD** (new) | How we work through enemies: **vertically**, one family top-to-bottom (1. place & missions, 2. kit, 3. loot, 4. the loop = what the loot is FOR — recipe/quest sink or cut it), not horizontally. Horizontal was for shared machinery (built). New gear should exploit the raw sub-stats (fang→crit, hide→mobility, sinew→accuracy). Group families by biome, build enemies + missions together. Written 2026-07-26. |
| DESIGN_MARSH.md | **DESIGNING, not built** (new) | The Ch1 marsh biome: the **snake family** (Venom archetype — Reed Adder swarm, Marsh Adder, Spitting Adder w/ Blind, Bog Constrictor grapple-via-range-0, tainted apex) + the **Fenbalm economy** (life-or-death deep-cough remedy, no alternative; wild-forage -> cultivate -> the taint blights the garden). New mechanics: Blind CC, grapple=range-0+taunt+ramping-squeeze, venom carry-home, tickPoison Nature-resist. Loot loop: snake_oil->antivenom, serpent_hide->Nature-resist armour. Ch1 = living fen only (no undead/ghosts). Narrative spine (Bog Witch) in DESIGN_SIDE_STORIES. Written 2026-07-26. |
| DESIGN_TIER1_GEAR.md | **DESIGNED, not built** (new) | Wolf + boar loot->gear loops: material->sub-stat identity (wolves=agility dodge/mobility/crit/accuracy/-Presence; boars=toughness armour/STR/VIT/+Presence), the 11-item spec (Pack Hunter set + boar tank set), material ladders (fang/alpha_fang, tusk_shard/boar_tusk, wolfhide/bristlehide), loot fixes, and the build checklist (gear->raw wiring, Presence stat, gloves slot, daggers-in-offhand, new boar_tusk material). Written 2026-07-26. |
| DESIGN_TIER1_ENEMIES.md | **PLANNED** (new) | Enemy-authoring/bestiary pass on the foundation. Reusable mechanics: **Charge** (position-aware gap-close+hit, distance-scaled, cooldown-gated), **Knockback** (small/capped shove, loop-safe), **Zone hazards** (interval-DoT ground band, reusable renderer), **composable AI knobs** (targeting/tauntable/fear/movement, replacing single `aiTier`; `opportunist` = max-damage reachable target). **Boar family** = Charger archetype: Tier-1 Wild (charge+routs) & Rabid (frenzied charge + Nature froth, fearless); parked **Undead** + **Patriarch** (Hollow bite bypassing armor, knockback-immune, breakthrough charge-through-line, opportunist, death-vomit zone) for the Hollow story beat. Wolves = Flanker (transcribe TODO). Written 2026-07-25. → **Build after foundation weapon/hit-resolution; author wolves→boars.** |
| DESIGN_RAID_REINFORCEMENTS.md | **PLANNED** (new) | "Call for help" mutual-aid on incoming raids: allies dispatch troops with a distance-based ETA, joining the ally pool if they beat the raid. Rides existing coop/world/ws + trade-caravan rails; new Pigeon Loft building gates + scales reach/speed. Written 2026-07. → **Build MVP (friends-only, client-resolved) when the multiplayer push resumes.** |
| DESIGN_KEPT_ANIMALS.md | **PLANNED** (new) | One shared "kept animals" model for dogs + cats — named companions with moods, posted to jobs (dog→flock-guard/hunting-camp, cat→mouser), passive leveling, light happiness, modest upkeep, roster at a Kennel / Cat Shelter. Strays + story firsts (Thornwoods' dog, the Lord's "His Lordship"). Supersedes the guard-dog gold toggle + the cat half of WORKERS_PLAGUES. Written 2026-07. → **Build dogs first (camp-tier, buildable now); cats join with the vermin loop.** |
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
| DESIGN_ACT1_SETTING.md | **DESIGN** | What's around the Act 1 settlement (isolated frontier grant; Dominion north, neighbours nearby NPC+player, dread south, wild all around, Thornveil in the woods); trade is thin/dangerous; 6 mission categories. The frame for redesigning Act 1 missions. |
| DESIGN_SIDE_STORIES.md | **IDEA** | Optional side-story chains (mission → scout-report vignette → follow-up mission), reusing the story/quest/chronicle machinery; lighter presentation than the main spine. Prototype: the Bog Witch chain. Post-prune/post-alpha. |
| DESIGN_ROSTER_CURATION.md | **DESIGN** | Cut ~229 premades → ~45-50 curated cast (weighted by origin prominence) + replenishing reserve pool; drop daily rotation. Unifies PREMADE_CHARACTERS + QUIRKS_REWORK + ROSTER_ECONOMY. → **The live roster spec; those three are now sub-concerns.** |
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
