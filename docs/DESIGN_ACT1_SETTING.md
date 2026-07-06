# Act 1 — The Settlement's Surroundings (setting bible)

**Status:** the frame for redesigning Act 1 missions. Decisions locked 2026-06-22. Most existing missions are old placeholders; redesign them *against this*, don't polish them one-by-one.

## The condition: a young, ISOLATED frontier grant
The Crown reopened the southern frontier with **land grants**, then largely **forgot it** (institutional amnesia). So Act 1's defining condition is **isolation**: a young Camp→Village on granted land, a distant and inattentive Dominion to the north, the wild all around, the dread to the south. *Connection* (trade, Crown attention, neighbour ties) **builds over time** — isolation is the starting state, and the thing later acts pay off against.

## What's around (cardinal model)
- **NORTH — the Dominion, the distant lifeline.** The King's Road back to the Ashenmark heartlands; source of supplies, news, new settlers, and (later) the Crown's tithe-collector. Far; the Crown barely looks your way yet.
- **NEARBY — other land-grant settlements (NEIGHBOURS).** The same grant-push founded others around you. **BOTH NPC** (single-player society + missions now; the Marketplace's NPC trades already fit this) **AND player settlements** (multiplayer / world-map). Your real nearby society: barter, mutual aid, rivalry, news, a neighbour who didn't make it.
  - **Named neighbours:** **Greyford** — a half-day downriver, founded the same spring as us; their fields drowned but they struck good stone, so they trade stone for our grain. The first neighbour you meet (via "The Road to Greyford"). *(Name provisional — easy to rename.)*
  - **Map layer (decided 2026-06, see `[[project_npc_settlements]]`):** Greyford & co. are **local narrative-only** (no coordinates) for now/through alpha — so "half-day downriver" is true for every player and there's no spawn collision. Shared-map NPC towns are **wanted later** (real `Settlement` rows, absolute coords, collision-safe via the existing min-distance spawn), kept distinct from per-player story neighbours. Never project a relative neighbour onto the shared absolute map. Settlement names ARE procedurally generated (`generateSettlementName()`: prefix+suffix, 768 combos); "Greyford" is not auto-generable (no "Grey" prefix) but shares the style — guard future drift with a `CANON_NEIGHBOUR_NAMES` re-roll.
- **SOUTH — the dread.** Old watch (~2 days) → the thinning → the Wastes. The dangerous direction; the story spine.
- **ALL AROUND — the wild** (forest / meadow / river / hills): beasts (wolves, boars, bears, spiders), goblins (hills, deferred), bandits (the lawless frontier), and the restless dead **out there** (per the home-is-safe rule).
- **THE WOODS — the Thornveil** (Niamh, Rowena, the Silvaneth, the ward-stones). Future allies; keepers of the line.

## Trade = thin & dangerous, not bustling
Frontier-grade: a lone peddler daring the road, a rare Dominion supply wagon, barter with a neighbouring grant. The road's danger comes FROM the thinness — a single wagon is a target. The **Marketplace** = frontier barter / scarcity, not a market square.

## Mission categories (the generator — rebuild placeholders FROM these)
1. **Taming your ground** — wood, stone, food, vermin, livestock. The homestead. *(mundane threats may reach home)*
2. **Making the surroundings safe** — beasts, the tainted spring, (goblins later).
3. **The lifeline north** — escort thin/risky traffic to and from the Dominion (supplies, settlers, later the tithe).
4. **Neighbours** ← the richest, under-used one — help/barter/joint-defence/news with other grants (NPC + players). Justifies trade AND seeds multiplayer.
5. **Toward the dread** — scout south, the old watch, ward work with Niamh. The story.
6. **Hauntings, out there** — crossroads, cemetery, crypts. Supernatural kept *distant* (home-is-safe).

Each mission should answer: *which category, and what specifically out there does it engage?* If it can't, it's a placeholder.

## Voice: mission cards speak as the settlement, not about the Lord
Mission descriptions use the **settlement's present-tense voice** — observational, names the people involved (Jory, Edda, Bram, Tomas), uses **we/us/camp** for the collective, and gives soft imperatives ("Send a wizard," "Clear it out"). **The Lord is the implicit "we" and is NEVER named in the third person** ("the Lord will…" is wrong — the player *is* him; write "We will…"). First-person singular "I" is reserved for the **Chronicle journal** (the Lord's private, reflective voice). See `[[project_chronicle_journal]]`, `[[project_lord_character]]`.

## Principle: animals aren't kill-on-sight (the Lord's compassion)
Healthy wild animals are not enemies. Fighting a beast needs a *real reason*: it's **maddened** (the tainted water), **wounded**, **actively predating on people or livestock**, or you're **honestly hunting for meat**. A bear simply denning near the lumber road is none of those, so the Lord reroutes the cutters rather than kill it. This sharpens combat (bandits, the dead, the rabid boar, the livestock-raiding alpha wolf, venomous things nesting at the well all still stand) and only retires "it was in our way" kills. `bear_den` ("A Wide Berth") is the reframed example. Revisit `stranger_tracks` against this lens. See `[[project_lord_character]]`.

## Principle: near-home hauntings = spirits, not animated undead
The **thinning** (what reaches near home) makes the dead *perceptible* — **voices, grief-bound spirits**, laid to rest by a priest (`wandering_spirit`). **Animated undead** (ghouls, skeletons, revenants) need a **Hollow / negative-Aether concentration** — normally *only* the deep Wastes, or a *locally-engineered* pocket (a cultist, or a hollowed witch like Aldith). So a random home-area cemetery has **no source to animate the dead** → no ghouls. Near-home / Act 1 hauntings are **spirits**; animated undead belong in **Wastes-proximate / higher-tier** content (or where a Hollow source is *shown*). `ghoul_infestation` + `burnt_crypt` stashed for violating this. (Same canon line as the boars' "death doesn't take" vs full reanimation.) Corollary: undead near home *implies a cult* — which is **story territory** (the Story-14 raid), not throwaway side-content.

## Two-track mission model (LOCKED 2026-06-22)
Missions are now one of:
- **Chore (recurring, default):** no flag. Standing settlement labor (timber, stone, foraging, herbs, patrols, livestock threats). Keeps reappearing on the board.
- **Unique (`unique: true`):** one-time personal/narrative beat. On *success* its id lands in `state.completedUniqueMissionIds` and it never returns. (Rescues, found keepsakes, neighbour pleas, side-story triggers.)
- **Seasonal (future):** recurring per season (spring berries / autumn mushrooms). Designed, not built.

**Discovery → routine pattern (BUILT 2026-06-22):** where a chore's *first* run is a genuine discovery, split it into a `unique` "first" mission that, on success, unlocks the recurring version via `requires: { missionDone: "<first_id>" }` (gate checks `completedUniqueMissionIds`). The two never coexist on the board (first retires, recurring is gated). The recurring keeps the canonical id + art; the discovery gets `<id>_first`. Applied to `foraging_run` (Nell's hollow) + `quarry_expedition` (the stone seam). NOT applied to pure chores like `gather_timber`. The "memory" is `completedUniqueMissionIds`; a chronicle line on the flip is deferred (silent for now).

Mechanism: `unique?` on `MissionTemplate`; `completedUniqueMissionIds` in game state (+ save migration); `generateMissionBoard` filters completed uniques; completion block marks them on success. All three packages typecheck.

## Current novice missions, mapped (2026-06-22)
- **① Taming your ground (rich ✓):** gather_timber, quarry_expedition, foraging_run, herb_gathering, first_patrol, lost_flock, chicken_coop_raiders *(chores)* · **old_bridge, lost_child, hunter_keepsake `unique`** · ~~cellar_rats~~ **CUT** (vermin = Cat Shelter's job; art `cellar_rats.png` banked for that feature). Dropped stray `giant_rat` from old_bridge (vermin rule). **Sweep finished 2026-07-06:** the remaining early combat rats retired per the same rule — `story_2_ruins` ("The Old Watch") is now **non-combat exploration** (salvage + dread, no encounters); `chicken_coop_raiders` is a **non-combat trap-the-fox chore**; `wilderness_trek` lost its filler rat (now 2 wolves). `giant_rat` stays defined and lives on only in the later mine/cave missions (`flooded_mine`, `abandoned_mine`, `herb_witch`), not the home-facing board. Rats otherwise = the Cat Shelter nuisance layer (`DESIGN_WORKERS_PLAGUES.md`).
- **② Surroundings safe (rich ✓):** The Tainted Spring, `bear_den`→"A Wide Berth", marsh_clearing, alpha_wolf_hunt, spider_hollow, night_howling, stranger_tracks. ~~boar_hunt~~ **stashed**, replaced by the **"Maddened Herd" boar chain** (below). ~~goblin_shaman_camp~~ **staged** (goblins deferred).
- **The "Maddened Herd" chain (BUILT: all 5 beats, 2026-06):** the symptom-half of the Tainted Spring side-story.
  1. `bad_blood` — a sick boar, mundane. *(gate: story_1)*
  2. `bad_season_boars` — too many; the player starts to wonder. *(missionDone)*
  3. `what_scouts_saw` — the *wrong* ones, met out there ("the death doesn't take"; `tainted_boar`). *(missionDone + story_2)*
  4. `reading_the_carcass` — **narrative-only** (~2 min, no combat), a hired **wizard** reads it + **Father Corin** as `npcAlly` (portrait, passive, not a protect-target). Folk-level reveal, *no "Aether,"* points upriver. *(missionDone + story_4_captains_rest — gated behind the main story's supernatural reveal so it never spoils)*
  5. `enchanted_spring` "The Tainted Spring" — **boss** `tainted_patriarch_boar` + 2 `tainted_boar`, wizard required. **Contain, not cure** (cap/mark/cull; "we hold this, we do not win it"). *(missionDone)*
  Two-track + spoiler discipline held throughout (reveal rides behind the story; folk vocabulary). Mercy tone (boars are victims). New enemies `tainted_boar`, `tainted_patriarch_boar`. Niamh's proper ward = later callback. **Chain lives in its own `SIDE_CHAIN_MISSIONS` pool** (rank-neutral — not subject to the board's tier quota; balanced by each beat's `difficulty`; see `[[project_mission_mechanics]]`). Banner = "✦ The Maddened Herd" (teal frame); chain `id` `maddened_herd` (matches the name, kept non-spoilery). **Follow-ups banked:** (a) chronicle-firing for *regular* (non-story) missions so beat 4 can drop a journal vignette (needs `chronicleEntryId` on `MissionTemplate` + completion wiring; `chronicle_entries.ts` had unrelated uncommitted edits this session); (b) a **Father Corin memory/conversation** triggered off beat 4. **Art TODO:** `tainted_boar` + `tainted_patriarch_boar` portraits, a `reading_the_carcass` study image.
- **③ Lifeline north (thin/messy):** **merchant_escort REWORKED** — split into `merchant_escort_first` (unique milestone, gated on the Marketplace = the payoff of the `merchants_welcome` quest's "second visit" promise; fixes the bug where merchants reached a brand-new mud-camp) → recurring `merchant_escort`. caravan_guard (now the odd one out: still story_1-early, contradicts isolation — repurpose as ④ settler/neighbour escort or remove); ⚠ smuggler_deal ("docks"/smuggling overstate an isolated frontier — rework or park).
- **④ Neighbours (seeded):** **caravan_guard → "The Road to Greyford"** (unique first-contact: escort the first barter between us and the neighbour grant Greyford; bandits on the road). The first of the vein — still want: aid a struggling grant, carry news, joint defense, a recurring barter run, a neighbour gone silent.
- **⑤ Toward the dread: ~empty in novice** (Tainted Spring foreshadows; story missions carry it — fine).
- **⑥ Hauntings, out there (✓):** wandering_spirit, ghoul_infestation, burnt_crypt.

## Staged (holding pen) — `shared/src/data/missions/stagedMissions.ts`
Placeholders pulled off the board for a clean slate (2026-06-22). Mechanism: `staged: true` → still resolvable by `getMission()` (saves mid-flight survive) but never generated onto the board. Un-stage = move the entry back into its tier array, drop the flag, rework the text.
- `tavern_intel` — generic "gather rumors" → reframe as frontier news (④).
- `wilderness_trek` — generic "survive a week" (+ stray rat).
- `smuggler_deal` — "docks"/smuggling overstate an isolated frontier.
- `goblin_shaman_camp` — goblins deferred to a later tier.

**Inspiration / next moves:**
- ① and ② are the grounded heart and already strong — don't pad them.
- **Build category ④ (Neighbours):** help a struggling grant · carry a letter/news between settlements · joint defense vs a shared raid · a barter run · a neighbour gone silent · a boundary dispute.
- **Sub-vein "settler requests with heart"** — your warmest missions (lost_child, hunter_keepsake) are personal/human, not kill-X-for-loot. Make more.
- **Two-birds:** reframe `caravan_guard` as escorting incoming settlers / a neighbour barter run → kills the escort redundancy AND becomes the first ④ Neighbours mission.
- Minor flags: rats-as-wild-creature in wilderness_trek + old_bridge (rats are vermin, not wild monsters); smuggler_deal outlier; goblin_shaman_camp (deferred goblins).

*Created 2026-06-22 from the "what's actually around us in Act 1?" discussion.*
