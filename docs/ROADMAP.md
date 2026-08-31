# Roadmap

**The plan. Not the pile** — every parked idea lives in `IDEAS.md`, and this file
stays short enough to read in one sitting. If it grows past a screen or two,
something belongs in `IDEAS.md` instead.

- `IDEAS.md` — everything you *might* build, browsable, no commitment
- `DESIGN_INDEX.md` — which design doc is real, and how real
- `TECH_DEBT.md` — the debt register

---

## 🎯 Act 1 Alpha

A complete, balanced Act 1, good enough to hand to first outside players
(boyfriend → his friends; nephew later, via the French translation).

**Ch1 = survival only** — scouting → wolves → Run Down → marshes → Bad Blood. Shipped.
**Ch2 = witchcraft / maddened + the Old Watch climax.** The old Stories 2–13 are
parked behind `CH2_GATE`; they're good storytelling to draw on, but their combat
content is placeholder. Story 14 (the cult assault) is the Act-1 cliffhanger.

Working agreement: Claude executes, you decide, react and play. Nothing is
scheduled that requires you to grind.

**Milestones, in order**
1. Land the cleanup — merge the open branches.
2. **Author Chapter 2** — the witchcraft/maddened arc + the Old Watch. Close the Bog Witch back half. Decide what of Stories 2–13 survives.
3. **Progression & anti-softlock pass** — gates, costs and durations through Act 1. Get fresh-player signal; don't tune off dev self-play.
4. **Content quality pass** — the systems that are 90% built (see *Nearly done*).
5. **Alpha packaging** — first-hour polish, onboarding, the loot-chest reveal.
6. **French i18n** — tutorial slice first. Last thing before the nephew.

---

## Threads in flight

| Thread | Branch | Next concrete action |
|---|---|---|
| **The big cleanup** | `chore/big-cleanup` | Review and merge. 2,500 lines cut: enemies 64→22, missions 124→60, materials 44→15, raids 13→6. `SAVE_VERSION` bumped to 2, so your save resets on load. |
| **Tech debt B + C** | `chore/tech-debt-b-c` | **Needs one eyeball** — the CSS purge cut 1,468 lines with zero visual change *intended*. Check the login page, Farming, Defenses, Inventory and the quest panels, then merge. |
| **Foraging minigame** | `feat/foraging-minigame` (local only) | Data + sandbox built. Remaining: the trip economy (one a day + Orison Shard renewal), the herbier, yield→larder wiring, home-page placement. Art in `FORAGING_PROMPTS.md`. |

---

## Next up

Short and ordered. Everything else is in `IDEAS.md`.

1. **A winter gather.** Season coverage is spring ×3, autumn ×3, summer ×1, **winter ×0** — the season the whole game is about surviving is the only one where the player has nothing to *choose*. Ice fishing, a cellar dig, snared hares, sloes after frost.
2. **A new Aldith.** The old `bog_witch` was the placeholder that inspired the marsh chain and it's deleted. Her chain's unbuilt finale needs a purpose-built enemy.
3. **An eastward exploration mission.** `east_reach` on the map is deliberately fogged behind a sentinel — and Act 1 has *no exploration-type mission at all*, which is a gap for a game about a half-mapped frontier.
4. **Guild level 2 has no tier.** The apprentice tier is gone. Level-2 players draw the novice and side-chain pool, which works but is thin.
5. **Decide the three inert combat systems** (see the engine map, below): give the state machine the nerve/leader job, apply damage schools or delete them, build offensive alchemy or drop its channels.
6. **The Greyfang pack shouldn't rout while he stands** — extend `leader` to the beast rout path. Small, and it makes killing the alpha the felt win condition.

## Nearly done — one wire missing

- **Alchemy techniques** — `steep`/`dry`/`distil`/`char`/`ferment` exist in the data; the desk only offers crush and boil, so five are unreachable.
- **Mission-map pins** — roughly half the surviving missions are placed; the "Close to home" dock is still load-bearing.
- **Mission climate** — the field exists, nothing sets it, no debuff is wired. This is the payoff for the kitchen's warmth channel.
- **Talent engine** — the trees display ~150 nodes; combat reads about three. Blocked on the per-character-trees decision (only Godric is drawn).
- **Movement knob** — the fourth AI knob. Both Pack Howl and gang-up are waiting on it.

---

## Reference

- **Combat engine map** (what's live, half-wired, or inert): https://claude.ai/code/artifact/1baea44c-763d-4a6e-bf66-ca56682582ed
- **Act 1 palette (ratified):** wolves, boars, bears, spiders, rats, bandits and outlaws, ghosts. **The thinning has ghosts and tainted living things; the Wastes have the walking dead.** No elementals, dragons, orcs, goblins beyond the runt, or undead at the hearth.
- **Home is safe:** mundane threats may reach the homestead (a fox in the henhouse); supernatural ones may not.
- **Animals aren't kill-on-sight:** a beast needs a reason to be fought — it denned under the well, it's frothing, it's at the fold.
- **No mechanic without a user.** Build the venom resist when the marsh snakes land, not before. Unspent systems are what made the engine feel heavy.

## Open questions

- Talent trees: keep the class pentagon, or pivot to per-character bespoke trees?
- Foraging: where does it live on the page, and which fruit first?
- `captain_hale_stub` — a test stub referenced live in story missions. Resolve with its story thread.
- Chapel → Shrine faction rethink, before faction balance can be built.
- Real-prod vs preprod environment rename — deferred to launch.

## Recently shipped

- **The big cleanup** (Aug 31) — 2,500 lines of content that described a different game. Ids now match display names.
- **Composable AI knobs** — targeting/tauntable/fear, with `opportunist`, `squishiest` and `gang-up`; `feral` now bites nearest.
- **Weapon range bands + the belt sidearm** — range comes from the weapon, not the role.
- **CI** — typecheck across all three packages + the test suite, on push and PR.
- **Docs sweep** — `archive/` gone, the farming/food/weather cluster collapsed, `IDEAS.md` created.
- Earlier: free-form kitchen and apothecary, the mission map, side-story director layer, food splits, climate + water, positional combat P1/P2, retreat model, scripted arrivals.

---

*The rule that keeps this file useful: it answers "what am I doing next?" `IDEAS.md` answers "what could I do someday?"*
