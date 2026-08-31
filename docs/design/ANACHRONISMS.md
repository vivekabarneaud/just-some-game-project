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
| **Squash → "Gourd"** (garden crop + food) | `gardens.ts`, `foods.ts`, `items/foods.ts`, `missions/helpers.ts` meta | New World plant | **FIXED (text) — art pending** | Renamed to **"Gourd"** (bottle-gourd framing). Player-facing name/label/desc + meta map + smoked-pork desc updated; internal id stays `squash`. Shell-use is flavor-only ("dried for flasks, bowls, dippers"). Interim art = existing squash icon/banner (placeholder); real gourd icon/banner still to come. Rename to (bottle gourd `Lagenaria siceraria` — Old-World, Mediterranean-ancient; pumpkin/pâtisson are the New World `Cucurbita`, rejected). Keep internal id `squash` (avoid RewardType cascade), change player-facing name/label/desc + the meta maps + the smoked-pork description. **Shell use = FLAVOR (no mechanic):** description says they're eaten fresh through the cellar-months AND the hard shells kept for flasks, bowls, dippers — which also resolves the "stores as winter food" bend honestly. Keeps summer-sown / autumn-winter niche. Interim art: reuse the squash icon/banner as placeholder (both cucurbits) until a real gourd icon/banner lands. **Parked mechanic ideas (not needed):** gourd floats → small Fishing Hut bonus (most period-authentic); or gourd vessels → small storage/pantry bump. |
| **"tea"** (the WORD, for herbal infusions in prose) | `chronicle_entries.ts` (Edda's chamomile, Aldith's fen) | modern word usage | **SET ASIDE** | The exotic *tea leaf* item (Camellia, from Tianzhou, late-game) is fine — keep. Only the prose using "tea" for the settlement's own herbal infusions is loose; medieval folk would say a tisane / name the herb / "her cup." Common in period fiction (Sword of Truth uses it), so deliberately kept for now. If revisited: reserve "tea" for the Tianzhou leaf, use "tisane"/"chamomile"/"her cup" for the local infusions. |

## Sweep findings (2026-07, done manually — the subagent stalled)
Combed the chronicle journal, quests, robins, overview flavors, all mission
text, item descriptions, exotics, foods/crops/gardens for New World foods,
modern idioms, post-medieval tech, and anachronistic materials.

**Result: remarkably clean.** The Lord's-journal prose and mission/quest text
have no modern idioms, no post-medieval tech, no bad materials. "half-mile" /
"miles" are period-fine; "schedule" hits were code comments, not prose.

Only New World foods found (beyond the already-handled squash/chili), both
**foreign-culture (Zah'kari) homage dishes** — **DECIDED: KEEP**:

| Item | Where | Ingredient | Decision | Why keep |
|---|---|---|---|---|
| **Zah'kari Jollof** | `items/foods.ts` | tomato (New World) | **KEEP** | Jollof rice IS defined by tomato — a loving homage to a real West African dish. Foreign-culture (latitude), has dedicated art. Stripping the tomato guts the homage for pedantry. |
| **Groundnut Spice Bowl** | `items/foods.ts` | groundnut/peanut (New World) | **KEEP** | Same: groundnut stew is a real West African staple defined by the peanut. Foreign-culture homage, own art. |

Nothing else surfaced. If we ever want a stricter pass, these two are the only
open New World items, and both are deliberate cultural flavor.
