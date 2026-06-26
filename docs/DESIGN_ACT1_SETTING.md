# Act 1 — The Settlement's Surroundings (setting bible)

**Status:** the frame for redesigning Act 1 missions. Decisions locked 2026-06-22. Most existing missions are old placeholders; redesign them *against this*, don't polish them one-by-one.

## The condition: a young, ISOLATED frontier grant
The Crown reopened the southern frontier with **land grants**, then largely **forgot it** (institutional amnesia). So Act 1's defining condition is **isolation**: a young Camp→Village on granted land, a distant and inattentive Dominion to the north, the wild all around, the dread to the south. *Connection* (trade, Crown attention, neighbour ties) **builds over time** — isolation is the starting state, and the thing later acts pay off against.

## What's around (cardinal model)
- **NORTH — the Dominion, the distant lifeline.** The King's Road back to the Ashenmark heartlands; source of supplies, news, new settlers, and (later) the Crown's tithe-collector. Far; the Crown barely looks your way yet.
- **NEARBY — other land-grant settlements (NEIGHBOURS).** The same grant-push founded others around you. **BOTH NPC** (single-player society + missions now; the Marketplace's NPC trades already fit this) **AND player settlements** (multiplayer / world-map). Your real nearby society: barter, mutual aid, rivalry, news, a neighbour who didn't make it.
  - **Named neighbours:** **Greyford** — a half-day downriver, founded the same spring as us; their fields drowned but they struck good stone, so they trade stone for our grain. The first neighbour you meet (via "The Road to Greyford"). *(Name provisional — easy to rename.)*
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

## Two-track mission model (LOCKED 2026-06-22)
Missions are now one of:
- **Chore (recurring, default):** no flag. Standing settlement labor (timber, stone, foraging, herbs, patrols, livestock threats). Keeps reappearing on the board.
- **Unique (`unique: true`):** one-time personal/narrative beat. On *success* its id lands in `state.completedUniqueMissionIds` and it never returns. (Rescues, found keepsakes, neighbour pleas, side-story triggers.)
- **Seasonal (future):** recurring per season (spring berries / autumn mushrooms). Designed, not built.

**Discovery → routine pattern (BUILT 2026-06-22):** where a chore's *first* run is a genuine discovery, split it into a `unique` "first" mission that, on success, unlocks the recurring version via `requires: { missionDone: "<first_id>" }` (gate checks `completedUniqueMissionIds`). The two never coexist on the board (first retires, recurring is gated). The recurring keeps the canonical id + art; the discovery gets `<id>_first`. Applied to `foraging_run` (Nell's hollow) + `quarry_expedition` (the stone seam). NOT applied to pure chores like `gather_timber`. The "memory" is `completedUniqueMissionIds`; a chronicle line on the flip is deferred (silent for now).

Mechanism: `unique?` on `MissionTemplate`; `completedUniqueMissionIds` in game state (+ save migration); `generateMissionBoard` filters completed uniques; completion block marks them on success. All three packages typecheck.

## Current novice missions, mapped (2026-06-22)
- **① Taming your ground (rich ✓):** gather_timber, quarry_expedition, foraging_run, herb_gathering, first_patrol, lost_flock, chicken_coop_raiders *(chores)* · **old_bridge, lost_child, hunter_keepsake `unique`** · ~~cellar_rats~~ **CUT** (vermin = Cat Shelter's job; art `cellar_rats.png` banked for that feature). Dropped stray `giant_rat` from old_bridge (vermin rule).
- **② Surroundings safe (rich ✓):** The Tainted Spring, bear_den, boar_hunt, marsh_clearing, alpha_wolf_hunt, spider_hollow, night_howling, stranger_tracks, hunter_keepsake. ⚠ goblin_shaman_camp (goblins deferred).
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
