# Livestock — a population you steward (design)

*Created 2026-07-10 from the "buy livestock like seeds?" discussion. Design only, not built.*

## Why
Today pens are **rate-based**: a pen at level N produces eggs/milk/meat at a flat rate and consumes feed; the `animalFeed` system "starves" it (halts production) if the larder is empty. There is **no count of actual animals**, so you can't buy them, lose them, or defend them.

Shift from *rate* to **population**: a pen is a flock you build with gold, that a hard winter or a bold pack can thin, and that you have reasons to protect. It makes the animals real, gives the flock missions (lost_flock, the fold vigil, Snowflake) genuine stakes, finally lets the wired starve system *bite*, and rhymes with two systems already liked: **seeds** (buy → fill capacity → yield) and the **cat shelter** (assign a creature to counter a pest).

## Locked decisions
- **Cull is a deliberate choice, never automatic.** Byproducts (milk, eggs, wool) are the sustainable, guilt-free draw. Slaughtering an animal is a *player action* with a cost (the flock shrinks by one) and a yield (**meat + pelt + bone**). Fits the Lord: honest homesteading, but always a considered choice, never casual. A good year, you never cull.
- **Pigs = the opt-in meat animal.** They alone have no byproduct, so keeping pigs *is* the "I intend to raise meat" choice, made at the pen. A player who wants a byproduct-only homestead simply doesn't keep them. (Historically also ate the settlement's scraps → waste-into-meat flavor, parked.)
- **Breeding replenishes the flock** (seasonal births), so culling is sustainable and not a re-buy grind.
- **Byproducts are seasonal**: wool at the spring/summer shearing; milk and eggs steadier but dipping in deep winter. A seasonal pulse like the fields.
- **Snowflake's name comes in writing.** Nell is mute (writes as her voice-substitute), so she chalks "Snowflake" on the pen board / presses a scrap into Edda's hand; the Lord finds the written name. More moving than a spoken one, and canon-safe.
- **Guard animals stay LIGHT** (see Phase 2): assign, light role-growth, minimal upkeep. No happiness meters, no breed catalog, no per-pet feeding minigame.

## Phase 1 — the food/byproduct population economy (the spine to build)
- **Pen = capacity (by level) + a per-species headcount** tracked in game state.
- **Buy livestock** with gold, up to capacity, appearing instantly (the seeds pattern). Price per head per species.
- **Production scales with headcount** (N × per-head byproduct rate), seasonal, replacing the flat level-rate.
- **Starvation now kills** (drops the count) instead of merely halting — the wired `animalFeed` system finally biting. (Open: instant death vs a grace period; see the winter-grace note in the balance pass.)
- **Predation**: wolves take livestock on undefended bad nights (a nightly risk / event). The reason the fold missions exist.
- **Cull** (player action): meat + a pelt (→ leatherworking) + bone (→ the Bone & Sinew materials). Real craft loop, not just food.
- **One guard dog** (light): assign to the fold to cut predation. The **A Wolf at the Fold** mission is the one-off adventurer version of the same protection.

## Phase 2 — working animals (later)
A separate "utility you assign" layer (essentially Manor Lords' draft animals):
- **Oxen** → faster building.
- **Horses** → faster missions and trades.
- **Dogs** (housed in a **kennel**, sibling to the cat shelter) → guard the fold *or* boost the hunting camp; a puppy slowly gets better at whichever role you use it for (light growth, small food upkeep). No breeds.

## Parked / later (captured so it's not lost, NOT in scope now)
- **Dog/cat breeds** — innate role specialization. Deferred; role-growth-by-use gives most of the charm without a catalog.
- **Deep pet care** — happiness meters, per-pet feeding as its own system.
- **Waste-eating pigs** — pigs consuming settlement scraps as a food-efficiency loop.
- **Pottery & vessels cluster** — a **pottery shop** producing: **reusable potion vials** (returned to store when a potion is drunk, so rebrewing needs only ingredients; dried gourds as the rustic alt — already banked in the tavern-entertainment notes), **fancy tavern tableware** (→ reputation), and **roof tiles** for houses. Coherent and appealing, but it's a whole crafting-buildings pass, one ring outside livestock.

## Flock missions that sit on this (build WITH Phase 1)
- `lost_flock` (already reframed) — now a real loss to prevent.
- `fold_vigil` "A Wolf at the Fold" (drafted) — the vigil; becomes the one-off protection beat.
- **"The Goat Who Wanted the Mountain"** (unique, goat pen) — Snowflake, named-in-writing by Nell. Ending TBD: **grit** (Séguin homage: she holds the wolf off all night, brought home at dawn) vs **understanding** (the fearless goat and the starving wolf reach a wary truce, no blood).
- **"The Keeper's Favorite"** (unique) — a beloved **ewe** strays; a warm, personal rescue.
- **"After the Storm"** — a gale breaks the fence, gather the scattered flock + mend it.
- **"The Pig That Dug Out"** — the escapee sow, comic with a thread of dusk-danger.

## Open tuning questions
- Meat granularity: one "meat", or split into mutton / pork / poultry (+ game) to feed the food-diversity happiness? (Start single, split if diversity needs it.)
- Prices per head, pen capacities, predation rate, breeding rate, winter byproduct dip, starvation grace period.

## Ties
seasons · food-diversity happiness · `animalFeed.ts` · materials (leather / bone) + crafting · the cat shelter / rat-rework (guard-animal sibling) · hunting camp · raids (predation) · tavern reputation (parked pottery plates).
