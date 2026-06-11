# Lore & Coherence Audit — 2026-06-11

Full sweep: cross-doc lore contradictions, in-game text vs canon, story-arc continuity, project health. Three deep parallel audits + typecheck/health pass. Authority rules applied: **LORE_TIMELINE.md wins** world canon; **FOUNDING_CHARACTERS.md wins** founder facts.

**Overall verdict:** the spine is sound. All five locked canon decisions (Hale's 47 days, Crown-forgot-not-lied, two-zone Wastes, Eighth perpetual-attempt, Edda-as-Nordveld-bridge) are respected in shipped text — "the Crown forgot" is even verbatim in a cinematic. Voice is consistent; robin/raven mechanics track; Niamh's comings/goings track. The drift concentrates in **four fixable pockets**: (1) `DESIGN_LORE_EXPANSION.md` (most-forgotten doc), (2) `frontend/src/data/chronicle.ts` (pre-canon-lock draft), (3) premade adventurer backstories (predate the lore + style locks), (4) the ruins-ward retcon never back-propagated to Stories 2–4.

**Health:** frontend, shared, and backend all typecheck clean. Zero TODO/FIXME/HACK in the entire codebase. All work committed/pushed except the known working-tree edits (STORY_PLAYER_SCRIPT, chronicle_entries, ROSTER_ECONOMY doc, lore genericization).

---

## A. Shipped bugs players can SEE (fix first)

1. **"Kess" in live mission text** — `shared/src/data/missions/expertMissions.ts:169` "Kess found a nest that's wrong" while `shared/src/data/npcs.ts:34` ships "Warden Niamh". → rename to Niamh. *(Mechanical)*
2. **Story 7 mission event contradicts its own chronicle** — `storyMissions.ts:216` "two stones flanking the Hilltop Ruins are broken…" vs the chronicle it unlocks (`chronicle_entries.ts:260`) "Both stones were standing. Both whole." Event text is stale pre-retcon prose (and still says "Hilltop Ruins"). → rewrite event text. *(Mechanical once retcon decided, see C1)*
3. **Player never sees Rowena's letter** — `ch3_watch_the_walls_start` (`chronicle_entries.ts:375`) and `ch3_inside_the_gate` (`:389`) are defined but referenced nowhere; `quests.ts:788` jumps straight to `ch3_hands_beside_ours`, which opens "In the eleven days between the letter and her arrival…" — a letter never shown. Also `quests.ts:758` comment references nonexistent mission `story_12_hands_beside_ours`. → wire the two entries into the quest flow.
4. **Story 13 chapter label** — `storyMissions.ts:380` `"Chapter 4: Hands Beside Ours"` reuses ch3's subtitle; ch4 is "The Hand That Broke It" (`chronicle_entries.ts:54`). *(Mechanical)*
5. **Ashford recruits not gated** — script says Cedric/Bronwyn/Roderick Ashford unlock with story 12; code (`adventurers.ts:264-270`) gates only the `silvaneth` origin — the Ashfords are origin `ashwick` (base pool), so "Grandson of Elder Rowena" can appear before the player meets Rowena. (Typo "Ashfork" at `adventurers.ts:268`.)
6. **Land grant attribution** — `frontend/src/data/chronicle.ts:33` says the **Corsair League** "gave you your land grant"; canon everywhere (incl. `chronicle_entries.ts:464` "given this land by King Aldren"): the **Crown** did. Same file: ":27 you left their territory", ":39 no king, no taxes" (canon has the Crown tithe), ":45 'seven deities' then lists six". `chronicle.ts` is a pre-lock draft → needs a wipe-and-rebuild pass.

## B. Canon drift in player-facing text

7. **Corin's coreBio invents a Church conflict** — `founding_characters.ts:146` "the Church ordered him to a retirement cloister, he refused"; canon: he retired **voluntarily**, beloved, handed parish to Brother Aelric. His arc is expansive faith, NOT institutional friction.
8. **Stoic-Jory residue in Nell's coreBio** — `founding_characters.ts:164` "her father went quiet" + "Edda and the Lord filled the edges"; canon (retcon): Jory is the jokester who "refuses to make the house a tomb," and the two who reach Nell are **Jory and Edda**. (All other Jory text is on-retcon.)
9. **Impossible elf memories** — `premade-characters.ts:172` Sionaeve "remembers when her people did not die of old age"; `:183` Maelorin "old enough to remember casting spells that drew on the death god's power." Le Déclin was ~2000 years ago; elves live 300–500 years. No living elf remembers immortality. (Maelorin also frames magic as god-power vs locked Aether-manipulation.)
10. **Unexplained "falling star"** — `premade-characters.ts:90,105` (Yasmin, Hari) reference a recent prophesied falling star. Canon: only Netheron ever fell, 2000 years ago. Either an undeclared invention or needs a lore decision.
11. **Name collisions with canon characters** — recruit "Niamh Nightbloom" (Silvaneth, like Warden Niamh!) `premade-characters.ts:169`; "Lyra Emberheart" vs Jory's dead wife Lyra `:26`; "Captain Mira Stormglass" (`chronicle.ts:97`) vs Edda's dead daughter Mira; random female pool (`adventurers.ts:48`) contains Rowena/Mira/Lyra/Maren/Elara. Priest named "Odin" (`:152`) — real-world name, no in-world referent; "Ullvar" (`:138`) is an unlocked god-name invention.
12. **Em dashes (style rule: none in player-facing prose)** — `premade-characters.ts` **82**, `chronicle.ts` **14**, `storyMissions.ts` **2**. Hand-written story prose (chronicle_entries, cinematics, founder fragments) is perfectly clean — the rule was never applied to the bulk content. *(Mechanical sweep)*
13. **Smaller drifts:** Lord taught "fourteen years" (`cinematics.ts:65`) vs canon "a decade"; Jory "cast a bell from an old kettle" (`chronicle_entries.ts:396`) — carpenter doing smith work; ch2_old_tongue Feldgrund played reserved vs canon "cheerful, loud"; the Lord "never heard of a Nereia" + teaches "saints" (`founding_characters.ts:79`) — debatable for a schoolmaster, "saints" is new ecclesiology.

## C. Story-arc continuity (needs ONE reconciling decision)

14. **THE BIG ONE — the ruins-ward retcon seam.** Three incompatible accounts coexist:
    - Story 3 (`chronicle_entries.ts:148-151`): ONE ward near the ruins, "older than the Pact," "reset after [Hale] fell."
    - Story 7/"An inch" (`:260-261, 332`): TWO flanking stones, "always been standing," never broken; the failure that killed Hale was further south, "we will not mend any of these."
    - `LORE_TIMELINE.md:135-136`: one ward **placed after** Hale fell ("Hale's men had no ward").
    Plus Story 2 says "His gate is the old watch" while Story 7 says "Hale's garrison was farther down." → **Decide the single true account**, then one pass over Story 2-4 text + Story 7 event + TIMELINE.
15. **Geography/number nits:** ruins distance is "a day's" / "two days'" / "a few days'" march in different places (`cinematics.ts:34`, `events.ts:159` vs `chronicle_entries.ts:84`); Story 4's one-day round trip across ~3 days of geography; broken stones "two" (Story 7) → "three" (Story 8) with nothing in between; "the note was five lines" but the quoted note has six sentences; Story 13 "a month ago" vs ch4 "four months ago" (the break predates Rowena's visit); cinematic "seven days from his gate / three from mine" breaks the "four days in 150 years" math (mixed reference points); "47 days" title vs journal ending day 45 (days 46-47 unexplained — needs a one-line reconciling detail); Hale's courier north (game) vs south (TIMELINE — likely doc typo).
16. **Script lags code** — the "old watch" rename (commit `6358055`) was never back-fed into STORY_PLAYER_SCRIPT.md (still "Hilltop Ruins" throughout); story 10 east-stone sentence dropped in code chronicle but kept in code mission; story 12 exists as a mission in the script but as a quest-completion chronicle in code.
17. **Niamh characterization** — `LORE_TIMELINE.md:463` "hot-headed and impatient" vs the script's defining *patience*. One is stale (probably TIMELINE).

## D. Cross-doc lore contradictions (docs only)

18. **`DESIGN_LORE_EXPANSION.md` is the most-forgotten file** (no canon banner at all): old "Dryven" (`:117`), old Deep Seals cosmology (Netheron+Ferros essence, `:187`) vs Eighth-God canon, **Aelindra the 487-year-old elf who "remembers Le Déclin"** (~2000 yrs ago — mathematically impossible, `:174`), five-year Zah'kari ground war (`:36`) vs TIMELINE's locked "conquest does not reach them in force" (`:406`), pre-Varek Nordveld colony (`:18`) vs TIMELINE's `[PROPOSAL]` invasion-during-Varek (`:339`) — the April Nordveld canon gap, still needs a lock.
19. **`LORE_EIGHTH_GOD.md` still says "Status: Canonical"** but is superseded on: Sundering mechanism (Severance-ritual-misfire vs TIMELINE's locked Cassandra-Netheron Option D), First Breach scale ("a single greater demon" vs locked "army pours out"), agent persistence ("no active network" vs locked infiltration at 500-1000 AS), Cult seeding (lists as open a thread TIMELINE closed). → needs a supersession banner like LORE_FINAL has.
20. **`LORE_TIMELINE.md` self-contradiction** — Khor'vani Alchemy parked at `:64` ("do not rely on for canon") but treated as locked at `:391-397`. → either promote (delete OPEN_IDEAS entry) or strip from the locked section.
21. **Nordveld geography** — TIMELINE: northern **island**; `DESIGN_RACES_ORIGINS.md:76` + LORE_FINAL: "cold northwest, Thornveil-adjacent" **borderlands**. Irreconcilable; affects live recruit flavor. TIMELINE wins → RACES_ORIGINS + origin blurb need the island.
22. **Halldora** — FINAL: survived the Sundering "crawled from the wreckage" + "last master of the Academy" vs TIMELINE locked: she was **elsewhere**, arrived days later; other Archmagi survived; she's last of her *school*. TIMELINE wins.
23. **Cult of the Hollow** — FINAL: "settlements are overrun" + fringe-group origin vs TIMELINE locked: research-oriented, "a few hundred willing deaths total," founded by Halldora's Vigil circle. TIMELINE wins (mission-tone matters here).
24. **Dragon eggs** — FINAL: deepest Hollow Wastes vs TIMELINE: leading edge (required for retrievability). TIMELINE wins.
25. **Cosmetic:** "Human Origins (7)" header lists 6 (`RACES_ORIGINS:66`); Zah'kari came "west" vs "north"; Church collapses "seven"→Radiant One (EIGHTH_GOD) vs locked **six** (Netheron excluded); Varek "rules parts of Meridian/Nordveld coast" (TIMELINE:265) overstates vs his own campaign record; "Ashford" oddly present in the **Nordveld** surname pool (`RACES_ORIGINS:84`); Jory widowed "three years ago" (`FOUNDING_CHARACTERS:94`) vs Nell's "four years ago" (`:62`) — **the 4 is right** (Nell is 11, mother died at 7); Edda's "'47" date doesn't work against any defined calendar.

## E. Verified non-issues (don't re-worry)

Hale's garrison facts consistent everywhere; Rowena/Aldren ages & genealogy consistent; Le Déclin/elf lifespans consistent across docs; robins-vs-ravens clean; founder math (except Jory's one line) checks out; Helga corroborated in the Nordveld name pool; Frostvik place/family name corroborates Halldora's lineage; Varek's assassination consistent; Edda/Helga timeline fits any Nordveld version; chronicle entries + cinematics + founder fragments contain **zero** em dashes (the style pass was applied rigorously where it was applied).

## Suggested order of attack

1. **Mechanical, no decisions** (one sitting): Kess→Niamh in expertMissions; story 13 chapter label; "Ashfork" typo; Jory "three"→"four years ago" (doc + code); EIGHTH_GOD supersession banner; DESIGN_LORE_EXPANSION canon-note banner; RACES_ORIGINS header count; em-dash sweep of premades/chronicle.ts/storyMissions.
2. **Small decisions, then mechanical:** rename recruit Niamh Nightbloom + Lyra Emberheart (or accept collision); Odin/Ullvar; falling-star pair; Corin + Nell coreBio rewrites; Ashford recruit gating.
3. **One design decision each:** the ruins-ward retcon (C14 — biggest, blocks Story 14); Nordveld island-vs-borderlands + invasion sequence lock; Khor'vani Alchemy promote-or-park; chronicle.ts rebuild.
4. **Back-feed the script** with the old-watch rename once the above settle.
