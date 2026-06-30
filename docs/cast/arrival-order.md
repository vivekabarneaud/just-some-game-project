# Act 1 — Arrival Order & Logic (summary)
- **Status:** framework / summary (2026-06-29). The detailed story-beat-by-beat map (story 1-14 + settlement tier at each + precise unlock points) is **TBD** — this is the principle and the rough order it produces.

## The principle
A character arrives **only when there's a believable reason for *this* person to come to *this* place at *this* stage of its growth.** Arrivals aren't a flat list; they're driven by what the settlement *is* yet. Gated by **settlement tier** (Camp → Village → Town), **buildings**, **reputation**, and **story**.

## Three arrival engines
1. **The displaced who found it** — seeking *any* ground; arrive at/near the founding.
2. **The hunted/lost, running south to the frontier** — they arrive *by chance / proximity* because the frontier is the edge of the Crown's reach, NOT (for now) because they heard of a haven. The **"haven reputation" is DEFERRED** to a later, deliberate beat (see Concrete changes): a ten-person camp isn't a haven, and *declaring* itself one means openly siding against Church + Dominion — a political turn that should land with weight, later, not a silent early flag.
3. **The opportunity-seekers, drawn by growth** — come only when the settlement is big/established enough to *offer what they want* (command, a tavern, work).

## Rough Act-1 order
- **Camp (founding):** the 6 founders + Nell + the Thornwood boy. **The hunters (Brenna, Gareth, Godric)** arrive — the displaced Thornwoods — and the guild opens. Two archers + a warrior cover the early board. **No assassins/casters needed yet.**
- **Early Village — Hester first (LOCKED 2026-06-30):** **Hester Ironbark** is the first of the hunted. Beat 1: the team (Gareth) rescues her from the foreman's crew in the field. Beat 2: days later she returns to the lumber mill (the phantom-woodpile arc) and stays; her arrival **unlocks the Woodworker** (the family's good bows/shields). See [hester-ironbark.md](hester-ironbark.md). *Then* **Aldwin + Magnus** flee in (Inquisition refugees; arrive **by chance**, road south, needing refuge). [Magnus loyalty-gated off Aldwin — see [stonebridge-arrival.md](stonebridge-arrival.md).]
- **Village:** more of the hunted drift in **by chance** (frontier = edge of reach) — the **Foxgloves** (Isla + Elara, Inquisition refugees) and **Sable** (a feral runaway the no-questions shelter disarms). No reputation gate for now.
- **Town (big enough to need/offer):** **Morgause** (comes when there's word the place needs a *commander* — defense/militia online), **Edmund + Elspeth** (need a **tavern** + citizens for a gambling milieu).
- **Story ~12 (Town, Thornveil alliance):** Rowena's visit → the **Ashfords** (Cedric, Bronwyn).

## Per-character arrival reasons
- **Thornwoods (hunters):** displaced, lost the farm, seeking ground no one can take → arrive at founding. *(Engine 1.)*
- **Aldwin + Magnus:** fleeing the Inquisition, road south, arrive by chance; their sheltering **seeds the haven.** *(Engine 2, the seed.)*
- **Foxgloves (Isla + Elara):** fleeing the Inquisition; arrive *after* the haven's seeded (the precedent makes the Lord's shelter easier). *(Engine 2.)*
- **Sable:** a feral 14-15-year-old who survived by killing and made enemies a city won't forgive; **running to the frontier because it's where the city's reach ends.** Drifts in wary, meaning to pass through — the no-questions shelter disarms her; she stays because it's the first place that never tries to *use* or *hurt* her. Her "Nothing to Lose" cracks: the haven gives her something to lose. *(Engine 2.)*
- **Morgause:** drawn by **purpose** — word of a settlement that *needs* a commander. Requires the place to be advanced/threatened enough to need military leadership. Her arrival is the answer to her wound. *(Engine 3.)*
- **Edmund + Elspeth:** need a **tavern + citizens** (a gambling milieu; a son cornered by gamblers). *(Engine 3.)*

## Concrete changes to make (when we build the progression)
- **Re-gate "A Mother's Errand"** (Edmund/Elspeth): from `requires: { story: "story_1_scouting" }` → require a **Tavern built** (+ a later story beat). Currently far too early. **[TODO]**
- **Morgause unlock:** gate on the **Barracks / garrison coming online** (the player's first trained troops). A commander arrives when there are troops to command — both her mechanical relevance *and* her in-world draw (word of a frontier post raising a militia and needing someone who can hold a wall). **[TODO]**
- **Hester (LOCKED 2026-06-30, building now):** two-beat — Beat 1 rescue mission (Gareth's report → subdue the crew → flag, no recruit); Beat 2 return arc days later (phantom woodpile → Lord's-tent recognition → recruit + **unlock the Woodworker**). **Re-gate Village tier off the Woodworker onto the Lumber Mill** (so the Woodworker can be Hester-gated without a circular dependency). Arrives **before** the Stonebridges. See [hester-ironbark.md](hester-ironbark.md).
- **Sable + Foxgloves:** gate on **Village tier + story progress** — they arrive **by chance**, running south; **NO haven flag** (deferred). **[TODO]**
- **Haven-reputation flag — DEFERRED (keep the idea).** Build later as a deliberate *political* turn: once the settlement is big enough, sheltering the hunted becomes a *known stance* = an open enemy of Church + Dominion (with consequences). Not an early silent boolean. For now, hunted arrivals are gated by chance / tier / story.

## TBD (next task)
The detailed **story-beat map** — story 1-14, the settlement tier at each beat, and the precise unlock point for every character. This summary is the framework; the beat map pins the numbers and unblocks [[project_chapter_3_defense_quest]].

## Cross-refs
- [stonebridge-arrival.md](stonebridge-arrival.md); [[project_settlement_tiers]]; [[project_chapter_3_defense_quest]]; `LORE_TIMELINE.md`.
