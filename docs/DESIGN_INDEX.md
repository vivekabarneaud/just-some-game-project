# Design Doc Index

**What each doc in `docs/` is, and whether it describes something real.** Rebuilt
2026-08-31 after the big cleanup; the doc-vs-code sweep behind it was 2026-08-14.

**Read this when** you're about to open a design doc and want to know whether it's
a plan or a description. **Don't trust a doc's own status line** — that's the
failure mode this file exists to catch. Twice now, docs have claimed "not built"
about systems that shipped months earlier.

- `ROADMAP.md` — the plan · `IDEAS.md` — the pile · `TECH_DEBT.md` — the debt

---

## The rule the folder now follows

**A design doc for a system that's already built is redundant with the code.**
When something ships, its open remainder moves to `ROADMAP.md` or `IDEAS.md` and
the doc is deleted. So the docs that survive are mostly **plans for things that
don't exist yet** — read them to build from, not to learn what the game does.

Two exceptions kept on purpose: **principle docs** (rules that govern future
authoring) and **lore canon** (creative source material, not specs).

## Plans — things not built yet

| Doc | What it's for |
|---|---|
| DESIGN_MARSH.md | The snake family, Blind, grapple-at-range-0, venom carried home. The fenbalm/reeds economy around it already exists — read before redesigning. |
| DESIGN_SPIDERS.md | Web-root, ambush, brood mother. `silk` still doesn't exist as a material. The quarry spider-gate is built. |
| DESIGN_ENCHANTED_SCROLLS.md | Five recipes, complete to the numbers. **Parked** — every one needs Mage Tower 2+ and Act 1 has no reachable magic. |
| DESIGN_TRAVELING_MERCHANTS.md | Culture shelves, route progression, rotation, rapport. Slice 1 (Cobb + the Lammast wagon) is built. |
| DESIGN_KEPT_ANIMALS.md | Cats + the vermin loop. Dogs are built — note its "breeds deferred" line is **stale**, breeds shipped. |
| DESIGN_APOTHECARY.md | Tier-gated stations, offensive channels, plant gating. The brew engine and desk are built. |
| DESIGN_WEATHER.md | Storms, blizzards, Layer-3 aether storms. Layers 1–2 are built (merged from the deleted WEATHER_YIELD). |
| DESIGN_BUILDING_TOOLS.md | ~18 tools + buff slots. Only `cutting_board` exists. |
| DESIGN_ROSTER_ECONOMY.md | Wages, states, retirement. Must key off the arrival model now — the cap is already bypassed. |
| DESIGN_FACTION_BALANCE.md | Church + Thornveil escalation. Zero mechanical state in code; needs the Chapel→Shrine rethink first. |
| DESIGN_RAID_REINFORCEMENTS.md | Call-for-help + Pigeon Loft. For the multiplayer push. |
| DESIGN_WORKERS_PLAGUES.md | §2 plague events. Staffing + ailments shipped (as named-hands coverage, not the doc's pool model). |
| DESIGN_QUIRKS_REWORK.md | A quirk-text bank. Its premise drifted — under a curated cast, quirks want to be per-character. |
| DESIGN_FORAGING_MINIGAME.md | **In progress** on `feat/foraging-minigame`. Data + sandbox built; trip economy, herbier and larder wiring open. |

## Partial — shipped core, live remainder

| Doc | Remainder |
|---|---|
| DESIGN_COMBAT_FOUNDATION.md | The stat schema is the **authoring contract** and still accurate. Open: damage schools (declared, never applied), the movement knob, spell/heal power, the VIT×8-vs-×10 reconciliation. §"current reality" is obsolete. |
| DESIGN_TIER1_ENEMIES.md | Zone hazards, knockback immunity, breakthrough charge, the rest of the roster. Charge, knockback, packs, morale and the AI knobs shipped. |
| DESIGN_POSITIONAL_COMBAT.md | P3 (raids get positions), P4 talents, enemy flanking, pull/reach/leap. P1+P2 shipped for missions. |
| DESIGN_RECOVERY_AND_RETREAT.md | Rescue/drag-out, the Infirmary (**better as Edda than a building**), the log-union refactor, per-mission `noRetreat`. |
| DESIGN_NOVICE_ITEMS.md | Phase 2 caster spell-weapons. Phase 1 (weapon damage, rarity) shipped. |
| DESIGN_EXPEDITIONS.md | Phase 5 authored expeditions, the volatility badge, pause-with-choice, in-expedition retreat. Only **one** expedition remains authored. |
| DESIGN_TALENT_TREES.md | Trees display; combat reads ~3 ids. Blocked on the per-character-trees decision. |
| DESIGN_MISSION_MAP.md | Pin authoring, and Phase-3 climate (field exists, nothing sets it). |
| DESIGN_SEASONAL_GATHERS.md | **Winter has no gather.** First Greens, Mushroom Foraging, the specials. |
| DESIGN_SIDE_STORIES.md | The Bog Witch back half — and Aldith now needs a purpose-built enemy. |
| DESIGN_ROSTER_CURATION.md | The 229→~50 pool cut never happened. The recruitment rework (scripted arrivals) shipped. |
| DESIGN_CONTENT_EXPANSION.md | Gems/Jewelcrafter/rings built. Its Act-1 palette proposal is now **ratified** — see ROADMAP reference. |
| DESIGN_BALANCE_PASS.md | Open ledger, ~2 of 9 landed. |
| DESIGN_SCARCITY_MISSIONS.md | Built via engine `forceMission`, with the once-per-board guardrail. |

## Built — kept only as reference

DESIGN_DEFENSES.md (ring sim; the tier→ring table was corrected) ·
DESIGN_CITIZEN_CATEGORIES.md (code added a founder floor) ·
DESIGN_RACES_ORIGINS.md (the per-tag resist multiplier table is the one gap) ·
DESIGN_TIER1_GEAR.md (11 items, test-locked; sidearm shipped)

## Principles — rules for future authoring

DESIGN_ACT1_SETTING.md (what's around the settlement) ·
DESIGN_ENEMY_AUDIT_METHOD.md (work **vertically**: a family top-to-bottom, enemies and missions together — its §Families table is the live tracker) ·
DESIGN_CRAFTING_PROGRESSION.md (leather→mail→plate by material and craft, not slot-locks) ·
ANACHRONISMS.md (a decision log, not a checklist — it's why jollof keeps its tomato)

## Lore canon

**`LORE_TIMELINE.md` is the single top authority.** `FOUNDING_CHARACTERS.md` is
the parallel authority for the six founders; `docs/cast/` covers the recruitable
cast and NPCs (non-overlapping, and its README defers upward).

LORE_TIMELINE.md · FOUNDING_CHARACTERS.md · docs/cast/ ·
LORE_FINAL.md + LORE_EIGHTH_GOD.md (canon-partial; **the fold into TIMELINE is approved and pending**) ·
LORE_OPEN_IDEAS.md (holding) · LORE_AUDIT_2026-06-11.md · DESIGN_LORE_EXPANSION.md (Varek's court — **zero of it in code**, and its header flags 5 canon breaks: resolve before using)

## Story & art

STORY_PLAYER_SCRIPT.md — Stories 2–13, **authored but dormant behind `CH2_GATE`**. Good prose to draw on; its combat content is placeholder. The shipped Ch1 isn't in it.
PROMPTS.md / PROMPTS_DONE.md — the art backlog and its done-log.

---

## Removed, and how to get it back

`docs/archive/` (14 files) and the built-system docs were deleted rather than
parked, because a parked doc still costs attention every time the folder opens.

```
git log --diff-filter=D --oneline -- docs/     # find the deleting commit
git show <commit>^:docs/FILE.md > FILE.md      # restore one
```

Notable: `GAME_DESIGN.md` (the founding doc; held the resource taxonomy and the
dragon sketch) · `NOVEL.md` (three chapters of prose, pre-rewrite canon) ·
`DESIGN_KITCHEN` / `TAVERN` / `FARMING_EXPANSION` / `LIVESTOCK` / `WEATHER_YIELD` /
`FOOD_SCROLLS_LOYALTY` (all shipped; remainders in `IDEAS.md`).

*Rebuilt 2026-08-31. Rebuild again when the code/doc gap grows — and check it against the code, never against the docs' own claims.*
