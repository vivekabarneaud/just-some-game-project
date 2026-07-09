# Anachronism Ledger

A living list of Earth-historical anachronisms in the game's diegetic content
(foods, materials, tech, and player-facing prose), with the decision on each.

## The principle (fantasy latitude)
This is an invented world with distant cultures, so it earns latitude: anything
framed as coming *from* a foreign culture (Meridian, Tianzhou, Khor'vani, the
eastern trade roads) can be a foreign luxury without being an "Earth
anachronism." The slips that actually read wrong are **New World (post-1492)
items appearing as ordinary, local things in the player's own
medieval-European-style frontier**, and **modern words/idioms in the diegetic
prose** (the chronicle journal, mission cards, quests). System/UI labels (menu,
recipe, etc.) get a pass unless they surface inside in-world prose.

## Status key
- **FIXED** — changed.
- **SET ASIDE** — known slip, deliberately kept (taste / fantasy latitude / art cost). Revisit anytime.
- **OPEN** — flagged, no decision yet.

## Ledger

| Item | Where | Type | Status | Notes |
|---|---|---|---|---|
| Chili Peppers → **Long Pepper** | `shared/src/data/exotics.ts`, `Marketplace.tsx` | New World plant | **FIXED** | Renamed to a real medieval Old-World hot spice (eastern trade). Internal id stays `chili`. |
| "picnic" → **"supper table"** | `quests.ts` (Edda's line) | 18th-c. word | **FIXED** | |
| **Squash** (garden crop + food) | `gardens.ts`, `foods.ts`, `items/foods.ts` | New World plant | **SET ASIDE** | Pumpkin is the same New World family, so it's not a fix. Period options that fill squash's summer-sown / autumn-winter-storage niche: **leeks** (rec — allium, also the planned "aromatic" crop) or **parsnips**. Needs new art (`garden_squash.png` + seed icon). User likes the pumpkin/gourd visual — worth finding a period gourd that looks similar (bottle gourd/calabash *is* Old World) if we want to keep the look. |
| **"tea"** (the WORD, for herbal infusions in prose) | `chronicle_entries.ts` (Edda's chamomile, Aldith's fen) | modern word usage | **SET ASIDE** | The exotic *tea leaf* item (Camellia, from Tianzhou, late-game) is fine — keep. Only the prose using "tea" for the settlement's own herbal infusions is loose; medieval folk would say a tisane / name the herb / "her cup." Common in period fiction (Sword of Truth uses it), so deliberately kept for now. If revisited: reserve "tea" for the Tianzhou leaf, use "tisane"/"chamomile"/"her cup" for the local infusions. |

## Sweep findings (to be triaged)
_A broader subagent sweep across all diegetic content is running; findings land here for line-by-line ruling._
