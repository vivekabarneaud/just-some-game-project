# Act 1 — The Settlement's Surroundings (setting bible)

**Status:** the frame for redesigning Act 1 missions. Decisions locked 2026-06-22. Most existing missions are old placeholders; redesign them *against this*, don't polish them one-by-one.

## The condition: a young, ISOLATED frontier grant
The Crown reopened the southern frontier with **land grants**, then largely **forgot it** (institutional amnesia). So Act 1's defining condition is **isolation**: a young Camp→Village on granted land, a distant and inattentive Dominion to the north, the wild all around, the dread to the south. *Connection* (trade, Crown attention, neighbour ties) **builds over time** — isolation is the starting state, and the thing later acts pay off against.

## What's around (cardinal model)
- **NORTH — the Dominion, the distant lifeline.** The King's Road back to the Ashenmark heartlands; source of supplies, news, new settlers, and (later) the Crown's tithe-collector. Far; the Crown barely looks your way yet.
- **NEARBY — other land-grant settlements (NEIGHBOURS).** The same grant-push founded others around you. **BOTH NPC** (single-player society + missions now; the Marketplace's NPC trades already fit this) **AND player settlements** (multiplayer / world-map). Your real nearby society: barter, mutual aid, rivalry, news, a neighbour who didn't make it.
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

## Two-track mission model (LOCKED 2026-06-22)
Missions are now one of:
- **Chore (recurring, default):** no flag. Standing settlement labor (timber, stone, foraging, herbs, patrols, livestock threats). Keeps reappearing on the board.
- **Unique (`unique: true`):** one-time personal/narrative beat. On *success* its id lands in `state.completedUniqueMissionIds` and it never returns. (Rescues, found keepsakes, neighbour pleas, side-story triggers.)
- **Seasonal (future):** recurring per season (spring berries / autumn mushrooms). Designed, not built.

Mechanism: `unique?` on `MissionTemplate`; `completedUniqueMissionIds` in game state (+ save migration); `generateMissionBoard` filters completed uniques; completion block marks them on success. All three packages typecheck.

## Current novice missions, mapped (2026-06-22)
- **① Taming your ground (rich ✓):** gather_timber, quarry_expedition, foraging_run, herb_gathering, first_patrol, lost_flock, chicken_coop_raiders *(chores)* · **old_bridge, lost_child, hunter_keepsake `unique`** · ~~cellar_rats~~ **CUT** (vermin = Cat Shelter's job; art `cellar_rats.png` banked for that feature). Dropped stray `giant_rat` from old_bridge (vermin rule).
- **② Surroundings safe (rich ✓):** The Tainted Spring, bear_den, boar_hunt, marsh_clearing, alpha_wolf_hunt, spider_hollow, night_howling, stranger_tracks, hunter_keepsake. ⚠ goblin_shaman_camp (goblins deferred).
- **③ Lifeline north (thin/messy):** merchant_escort ✓; caravan_guard (redundant twin — reframe); ⚠ smuggler_deal ("docks"/smuggling overstate an isolated frontier — rework or park).
- **④ Neighbours: EMPTY ← the gap + the richest vein.** Only tavern_intel is near (reframe → frontier news).
- **⑤ Toward the dread: ~empty in novice** (Tainted Spring foreshadows; story missions carry it — fine).
- **⑥ Hauntings, out there (✓):** wandering_spirit, ghoul_infestation, burnt_crypt.

**Inspiration / next moves:**
- ① and ② are the grounded heart and already strong — don't pad them.
- **Build category ④ (Neighbours):** help a struggling grant · carry a letter/news between settlements · joint defense vs a shared raid · a barter run · a neighbour gone silent · a boundary dispute.
- **Sub-vein "settler requests with heart"** — your warmest missions (lost_child, hunter_keepsake) are personal/human, not kill-X-for-loot. Make more.
- **Two-birds:** reframe `caravan_guard` as escorting incoming settlers / a neighbour barter run → kills the escort redundancy AND becomes the first ④ Neighbours mission.
- Minor flags: rats-as-wild-creature in wilderness_trek + old_bridge (rats are vermin, not wild monsters); smuggler_deal outlier; goblin_shaman_camp (deferred goblins).

*Created 2026-06-22 from the "what's actually around us in Act 1?" discussion.*
