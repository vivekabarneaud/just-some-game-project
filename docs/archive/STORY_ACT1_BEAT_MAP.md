# Valenheart — Act 1 Story Beat Map
- **Status:** draft 2026-06-29. Built from the **built** spine (`shared/src/data/missions/storyMissions.ts`) + `STORY_PLAYER_SCRIPT.md`, with **settlement tiers** and **cast arrivals** slotted in. Iterate freely.
- **Purpose:** one view of the Act-1 progression — each story beat, the settlement's tier there, and which cast member arrives when (and why). Turns the arrival-logic framework ([cast/arrival-order.md](cast/arrival-order.md)) into concrete gates against the real story, and unblocks the Watch-the-Walls quest leveling + every cast unlock point.

## The spine (built)
The Act-1 throughline is the **ward-stone / Thornveil arc**: the settlement discovers it sits inside an ancient ward-stone belt holding back the Wastes; allies with the Thornveil (Niamh, then Rowena); learns the stones are being **broken** (sabotage); and Chapter 4 brings the **Cult** raid home. Ghosts, magic, and the Doctrine all enter through this spine.

## Chapter 1: Ashes and Dust — **CAMP**
*Settlement: a brand-new camp. The Lord + 5 founders (Edda, Nell, Jory, Tomas, Corin).*
- **Banner — Two more families on the road** (a raven; arrivals incoming).
- **Banner — The hunters volunteer** → **the Adventurer's Guild opens.** **ARRIVAL: the Thornwoods** (Nessa, Gareth, Godric + the boy), the hunters. *[Engine 1 — the displaced who found it.]*
- **Story 1 — Scouting the Surroundings** (wolves).
- **Story 2 — The Hilltop Ruins** (Hale's garrison; the journal; the child's-stitching cloth).
- **Story 3 — Past the Ruins** (the **first ghosts**). **ALLY: Niamh, Warden of the Thornveil** walks the team home — *the first magic-user the Lord works with* (protective Primal ward-craft; an external ally, **not a recruit**).
- **Story 4 — The Captain's Rest** (Niamh binds Captain Hale; her presence lets steel cut ghosts). **The anti-undead problem is solved here, early, by Niamh.**
- **Bridge — the robin / salve** (Halldora's anonymous gift).
- *Cast by end of Ch1: founders + Thornwoods (2 archers + warrior + boy). Covers the early board. No casters/assassins needed.*

## Chapter 2: Our Own Hands — **VILLAGE** *(growing; "we learn to do this ourselves")*
- **Story 5 — North of the Road** (Feldgrund hills; the herb for the salve).
- **Story 6 — The Broken Stone.** **ARRIVAL: Marigold Hawthorn** (wounded Feldgrund at the gate) → **Feldgrund origin unlocks** (dwarven recruits).
- **Story 7 — Walking the Line** (map the ward-stone belt).
- **Story 8 — The Silver Birches** (fetch Niamh; she names the stones as wards, agrees to partnership).
- **Story 9 — The First Inch** (Niamh mends the east stone; escort/defend).
- **Closing — "An inch"** (the mended stone holds; the Lord claims an inch).
- **ARRIVALS to slot here (the haven engine begins):** once the world is clearly strange and the settlement is known, the **Stonebridges** flee in — **Aldwin recruits**, and sheltering them **seeds the haven** (Magnus loyalty-gated, unlocks later; see [cast/stonebridge-arrival.md](cast/stonebridge-arrival.md)). Once a **Tavern** is built, **Edmund + Elspeth** become reachable via "A Mother's Errand." The haven reputation begins to draw the hunted (**Sable**, the **Foxgloves**) across Ch2–3.

## Chapter 3: Hands Beside Ours — **VILLAGE → TOWN** *("the world is bigger, and it is starting to look back")*
- **Story 10 — Post the Line** (mark the boundary; the line is **moving** — voices closer than before).
- **Story 11 — The Second Inch** (mend the deep-west stone; *"we are losing this line faster than we are mending it. I will send word."*).
- **Bridge — Watch the Walls quest** — the Lord turns to his **own defenses** while waiting. **Troops / walls come online.** **ARRIVAL: Morgause** — word of a frontier post raising a militia and needing a commander draws her here. *[Engine 3 — opportunity-seeker, gated on first troops.]*
- **Raven — Rowena intends to call.**
- **Story 12 — Hands Beside Ours** (Chapter 3 **climax**; Rowena's visit; partnership). **ARRIVAL/UNLOCK: Cedric, Bronwyn, Roderick Ashford + the Silvaneth origin pool.**

## Chapter 4: The Hand That Broke It — **TOWN** *(the war comes home)*
- **Story 13 — The Hand That Broke It** (gated by the Watch-the-Walls quest; mend the broken stone; the saboteur's work).
- **Closing** — the Cult is named; the incoming raid.
- **Story 14 — the Cult assault** *(UNDRAFTED — the Act-1 finale).*

## Cast arrival summary (against the spine)
| Who | Arrives | Gate / reason |
|---|---|---|
| Founders | start | the founding |
| Thornwoods (+ boy) | Ch1, guild opens | the hunters volunteer *(displaced)* |
| **Niamh** (ally, not recruit) | Ch1, Story 3 | the Thornveil; first magic the Lord *works with* |
| Marigold + **Feldgrund** pool | Ch2, Story 6 | the wounded dwarf; Feldgrund unlock |
| **Aldwin** (Magnus loyalty-gated) | Ch2 | fleeing the Inquisition; seeds the haven |
| **Edmund + Elspeth** | Ch2–3 | needs a **Tavern**; "A Mother's Errand" |
| **Sable**, **Foxgloves** | Ch2–3 | drawn by the **haven** reputation |
| **Morgause** | Ch3, Watch-the-Walls | **first troops/militia**; needs a commander |
| **Ashfords** + Silvaneth | Ch3, Story 12 | Rowena's visit |

## Corrections this map forces
- **Niamh is Chapter 1 (Story 3–4), not ~Story 12.** She's the early Thornveil ally and the anti-undead enabler. *(Fix the stale "~Story 12+" note in `cast/stonebridge-arrival.md`.)*
- **The Stonebridges are NOT the player's "first magic" — Niamh is.** Reframe: **Niamh = the first magic-user the Lord *allies with*** (protective, external, Thornveil ward-craft against the obvious evil). **The Stonebridges = the first magic the Lord *harbors*** (a hunted *Arcane* heretic taken into the settlement as family, with the Inquisition death-sentence attached). Niamh having softened him first **sets up** the Stonebridge beat — he has already seen magic do good; *harboring a wizard* is the deeper, personal test of the Doctrine.

## TBD
- Pin **settlement-tier thresholds** per chapter (Camp→Village→Town) against the building/tier system.
- **Watch-the-Walls quest levels** (now unblockable: it sits Ch3, troops-online).
- **Story 14** (the Cult assault) is undrafted.
- Precise **unlock triggers** (building flags, loyalty thresholds, story flags) per arrival — tracked in [cast/arrival-order.md](cast/arrival-order.md).

## Cross-refs
- `STORY_PLAYER_SCRIPT.md` (the drafted narrative), `shared/src/data/missions/storyMissions.ts` (the built spine), [cast/arrival-order.md](cast/arrival-order.md), [cast/stonebridge-arrival.md](cast/stonebridge-arrival.md), [[project_settlement_tiers]], [[project_chapter_3_defense_quest]].
