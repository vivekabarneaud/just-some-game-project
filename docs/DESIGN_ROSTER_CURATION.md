# Roster Curation — fewer, better adventurers

**Status:** DESIGN (locked decisions 2026-06-22, execution phased & pending). Supersedes the open parts of `DESIGN_PREMADE_CHARACTERS.md` (family/rarity/unlock), folds in `DESIGN_QUIRKS_REWORK.md` and `DESIGN_ROSTER_ECONOMY.md` — those become sub-concerns of this one.

## The decision

Cut the ~229-character premade pool to a small, **curated, hand-authored cast**. The game's identity is handcrafted / personal / paper-theater; 229 adventurers (many filler-quality) contradicts that. A small known cast also supercharges already-built systems: **loyalty, tavern conversations, the Pantheon memorial** — all far stronger with people the player actually knows. Losing a named character to permadeath should be grief, not a rounding error.

This also unifies three previously-separate backlog docs (premade pool, quirks, roster economy) into one coherent pass.

## Two rosters

1. **Main roster (named).** The curated survivors: real backstories, fitting special abilities, distinct character design, true permadeath stakes. Recruited by browsing (no rotation), gated by origin unlock.
2. **Reserve / common pool.** A small set of plainer recruits (lighter identity, no signature ability) that **replenishes** — the anti-soft-lock insurance so a player who loses their team can never get permanently stuck. Keeps the named cast special by contrast. *Exact model (always-available? trickle? lower stats?) — DECIDE LATER.*

## Size & distribution — weight by prominence, NOT class balance

No forced "one-of-each-class per origin." Keep only characters who make sense; weight counts by how common/early the origin is. Starting proposal (~45–50 total, tunable):

| Origin | ~Count | Notes |
| --- | --- | --- |
| Ashwick | ~12 | Starting/common heartland; must cover all 5 classes (early playability). |
| Feldgrund | ~6 | Unlocks after Story 6 (Marigold's rescue). Keep the story survivors. |
| Silvaneth | ~5 | Thornveil tie (Niamh's world). |
| Nordveld | ~5 | |
| Meridian | ~4 | |
| Khor'vani | ~4 | |
| Hautscieux | ~4 | |
| Khazdurim | ~3 | |
| Tianzhou | ~2–3 | Endgame/exotic — player already has a deep roster by unlock. |
| Zah'kari | ~2–3 | Endgame/exotic — same. |

Lore-friendly: a frontier settlement near the Hearthlands *should* be mostly Ashwick faces, with exotic origins rare and late. **Keep all canon-load-bearing characters regardless of count** (the Ashford grandchildren Cedric/Bronwyn/Roderick, any Niamh/Thornveil ties, the Feldgrund story-6 survivors).

## Permadeath & revival — levers already exist

Decide the exact model later (leaning: named = true permadeath, reserve = replenishable). Mitigation is already partly built:
- **Phoenix Tears** alchemy recipe (`shared/src/data/alchemy_recipes.ts`) — the revival item. Gives the alchemy tree real late-game purpose; death becomes costly-but-recoverable, not purely brutal.
- Priest **"Divine Grace"** passive: party death-risk reduction + revive chance; `revived: string[]` already tracked in game state.

## Recruitment UX — drop the daily rotation

Show the whole available cast, grouped by origin (Ashwick first, then origins as they unlock). Removes the gacha-flavored daily rotation/reroll (fights the cozy-co-op tone); replaces it with a collection pleasure — the roster *grows* as you unlock origins through progression. The origin-gating scaffold already exists (`ORIGINS_BY_GUILD_LEVEL`, `STORY_UNLOCKED_ORIGINS`, `QUEST_UNLOCKED_ORIGINS` in `adventurers.ts`).

## Special abilities

Each main-roster character gets a signature ability that fits their backstory + class (ties into the talent/class-passive systems). Part of the per-character authoring pass.

## Cosmetic skins (LATER)

Buyable cosmetic-only skins for adventurers. A small known cast is exactly what *makes skins viable* — players buy costumes for characters they love, not for rando #147. Pay-cosmetic-only fits the friendly co-op ethos. Blocked on payment backend; park until post-alpha.

## Migration safety

Existing saves reference culled character IDs. A removed character in someone's save must NOT crash the game — graceful fallback (keep the saved instance as a grandfathered entry, or convert to a reserve recruit). Low-stakes pre-launch, but required.

## Phasing (small bites — respects the director-not-laborer workflow)

1. **Lock design** — this doc. ✓
2. **Keep/cut triage** — Claude proposes a per-origin survivor list (the clearly-good + the canon-tied), user reacts/adjusts. Pure taste calls; no testing.
3. **Rewrite survivors' backstories** to top quality (the user's voice; em-dash-clean).
4. **Design fitting special abilities** per survivor.
5. **Recruitment UI rework** — show-all-by-origin, drop rotation.
6. **Reserve pool + revival balancing**; later: skins.

## Phase 2/3 working log (decisions as they're made)

- **Triage done (2026-06-22):** ~52 keepers chosen (see the agent triage; Ashwick 12, Feldgrund 6, Silvaneth 5, Nordveld 5, Meridian 4, Khor'vani 6, Hautscieux 6, Khazdurim 5, Tianzhou 3, Zah'kari 3). Lore landmines cut (Odin, pre-Sundering-memory elves, name collisions). `CHAR_RELATIONSHIPS` needs pruning for cut IDs when surgery happens.
- **Rescued from the cut pile:** **Thrain Fireaxe** (Khazdurim assassin, the "drinks because of what's behind the third Seal" one — among the best in the file). **Lyra Emberheart** → renamed **Sable** (first name only; "Lyra" collided with canon Lyra/Jory's wife). Sable is a **mononym** on purpose — fits "no name worth keeping"; characterizes the one person who erased her surname.
- **Cedric Ashford:** backstory kept as-is (canon, excellent). Ability proposed: new trait **"Thornveil-Taught"** (+6% dmg vs ghost & aether). Not yet wired.
- **Ability approach (proposed, awaiting confirmation):** each curated character gets a story-fitting `trait` (reuse `BACKSTORY_TRAITS` where one fits; bespoke new traits for standouts; flag any needing engine wiring beyond the data tables). Pace (one-at-a-time vs batch) TBD — user was too tired to continue 2026-06-22.

*Created 2026-06-22 from the weekend "fewer, better adventurers" idea.*
