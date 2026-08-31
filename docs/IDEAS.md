# Ideas

Every parked idea, in one place. **This is the pile, not the plan** — `ROADMAP.md`
is what we're actually doing next, and it stays short. Scan this when you want
something to pick up; nothing here is a commitment.

Ideas are grouped by the part of the game they touch. Each is one line: what it
is, and why it's interesting or what it's waiting on. When one gets built, delete
its line — the code becomes the documentation.

> **Where the detail went.** Most of these were extracted from design docs that
> were deleted once the system they described had shipped. The docs are all in
> git: `git log --diff-filter=D --oneline -- docs/` finds the deleting commit,
> and `git show <commit>^:docs/FILE.md > FILE.md` brings one back.

---

## Alchemy

- ⭐ **Herbalist discovery** — a plant starts "unstudied": you learn its best technique and full effect table by *using* it, rather than being shown from the start. Almost certainly the same system as the foraging **herbier** — worth designing them together.
- **Techniques beyond crush + boil** — `steep`, `dry`, `distil`, `char`, `ferment` all exist in ingredient data but the desk only offers two, so five techniques are unreachable in game. The design was "stations unlock by settlement tier"; that gate was never wired.
- **Offensive brews** — poison coatings and throwables. The channels (`poison`, `weaken`, `slow`, `confuse`, `aoe_fire/frost`) are defined and *priced* in the brew engine, and combat ignores them entirely. Either build it or delete the channels; inert-but-priced is the worst state. Pairs with the puffball-as-carrier idea (any brew becomes an area effect).
- **Deliberate plant gating** — introduce the plant roster gradually via foraging and tier, instead of the whole shelf being available at once.
- **Shareable recipes** — brews are personal today; trading them between players is a multiplayer-era thought.

## Kitchen

- **Mission climate** — cold north / hot south missions with a seasonal debuff that warm, fresh food mitigates. This is *the* payoff that makes the kitchen's warmth and freshness channels matter. The `climate` field exists on missions; no mission sets it and no debuff is wired.
- **Cultural ingredient imports** — Nordveld / Tianzhou / Meridian / Zah'kari / Khor'vani ingredient waves arriving by trade. Blocked on merchant rapport existing.
- **Legumes as early protein** — fava and peas feed the settlement before livestock does. A genuine early-game food gap.
- **Preserves** — a Preserve technique: jams, apple butter. Wants the foraging fruit to land first.
- **Cultural cuisine** — a signature dish and ingredient per culture. Partly shipped already via loyalty-locked origin recipes; worth checking what's actually left.
- **Merchants sell recipes** — the "buy" path for dishes, mirroring alchemy's brew / invent / buy.
- **Per-dish gold value** — a sell hook for cooked dishes (Kitchen phase C2c).
- **Rarity frames on dish cards** — quality tint + ornament frame, matching the item cards.

## Farming

- **Buying seed at market / rare seeds by culture** — how specialty crops get acquired. Today seeds only unlock via quests, so pear, cherry and grapes are locked teasers with no path to them.
- **Calming Draught** — needs a new `regenBoost` effect type (speeds hourly HP regen). Current alchemy effects can't express it.
- **Hops → a tavern drink tier** — *probably answered*: drinks shipped as ale / mead / cider without hops ever existing.

## Animals

- **Cats + the vermin loop** — vermin quietly eat stored food; a Cat Shelter with cats posted as mousers suppresses it. "His Lordship", a stray the Lord adopts, brings him a rat and *that* earns the building. The `mouse` job already exists in the data, unused.
- **Working animals** — oxen and horses (livestock phase 2).
- **Raised litters** — the Kennel / Cat Shelter raising pups and kittens as a managed activity. Note dogs already breed on their own, and breeds already exist — what's missing is choosing to raise a litter, plus cats entirely.

## Weather

- **Storm mechanics** — `storm` exists as vocabulary and art with no mechanics behind it.
- **Blizzard** — doesn't exist at all.
- **Layer 3: aether storms** — unnatural weather as a story tell, tied to the ward-stone line. The sky being *the wrong colour* is the tell that something has failed.
- **Locust / pest raid** — a crop-destroying event, sibling to the weather events.
- **Water trade** — buying and selling water in a dry year.
- **Germination lever** — climate affecting *whether seeds take* as a separate axis from how much they yield.

## Tavern & merchants

- **Tavern conversations** — JRPG-style support chats with adventurers, gated on loyalty and missions, one-time each. The common room already has a teaser block waiting for it.
- **Rapport with recurring merchants** — a relationship that improves prices, and the thing that unblocks cultural ingredient imports.
- **Culture shelves** — merchants carrying goods by origin, so who visits determines what you can buy.
- **Route progression** — farther cultures dare the journey as fame and settlement tier rise and the roads steady. First arrival of a new culture fires a small event: *"word has reached the Meridian valleys…"* The trade mirror of recruit origin-tiers.
- **Rotation + seasonal rhythm** — who's in town changes with the season, instead of one merchant slot.
- **Adventurer & culture featured dishes** — extra menu slots beyond the staples.
- **Tavern economy tuning** — the numbers in `tavern.ts` are explicitly placeholder, waiting on play.

## Combat

- **Enchanted team scrolls** — five recipes, fully specced with exact ingredients and effects, in `DESIGN_ENCHANTED_SCROLLS.md`. Parked because every one is gated behind Mage Tower 2+ and Act 1 has no reachable magic. Unpark when magic becomes player-facing.

## Later acts (pulled out of Act 1, 2026-08-31)

> **The big cleanup.** The codebase now holds only content that Act 1 can
> actually reach. Removed on `chore/big-cleanup`: **24 enemies** (64 → 40),
> **27 journeyman + expert missions** (124 → 97), **18 materials** (44 → 26),
> 6 late-game recipes and the 6 items they made. Nothing referenced any of it.
> The names below are the index — git holds the definitions.
>
> **Deleted enemy roster, for when later acts need a starting point:** ancient_wyrm,
> arch_necromancer, banshee, demon_scout, goblin_warchief, infernal_knight,
> seraph_fallen, shadow_lord, stone_golem, storm_elemental, storm_sprite,
> temple_guardian, tide_serpent, wasteland_wyrm, aether_colossus, aether_wraith,
> magma_golem, wyrmling, flame_wisp, ember_elemental, frost_elemental,
> corrupted_treant, fungal_crawler, bog_witch.
>
> **Kept deliberately:** `bandit_cutthroat` ("goes for whoever looks softest" —
> which is now literally the `squishiest` targeting knob) and `bandit_poacher`
> (the back-row outlaw). Both are authored Tier-1 content waiting for a mission,
> not placeholders.
>
> **Aldith needs a new enemy.** The old `bog_witch` — *"she lives in the marsh and
> talks to things that shouldn't talk back"* — was the placeholder that inspired
> the marsh chain, and it went with the rest. The chain's unbuilt finale needs a
> purpose-built Aldith, not that stub.
>
> **`arcane_focus` went too** (2026-08-31). I first repaired its recipe, then it
> turned out to be a placeholder like the rest: there are **no wizards yet** —
> Magnus arrives later in Act 1, after the Tier-1 stretch — so a wizard off-hand
> had nobody to equip it. Worth knowing for whenever he does arrive: **wizards
> now have no off-hand at all** (the remaining five are shields, a priest's
> prayer book, an assassin's parrying dagger and an archer's quiver). And
> `crude_ruby`, the material I briefly repointed it to, is a 10%/8% drop from
> `goblin_shaman` and `burnt_skeleton` — not obviously early-game, so the repair
> was shaky anyway. Deleting was the right call.

Act 1's palette is the grounded one: wolves, boars, bears, cave spiders, marsh
adders, rats, the thinning's dead. The exotics below leapfrogged that tone, so
their **missions were deleted** and their **bestiary entries kept** — an undiscovered
enemy stays hidden, so it costs nothing to leave a designed creature waiting for
the act it belongs to.

- **Dragons** — `wyrmling`, `dragon_hatchling`. Missions removed: `wyrmling_den`, `dragon_nest`, `feral_drake_hunt`. Ties into the long-term dragon system.
- **Elementals** — `flame_wisp`, `ember_elemental`, `frost_elemental`. Missions removed: `fire_spring`, `elemental_rift`, `aether_convergence`, `magma_depths`. Note `flame_wisp` and `ember_elemental` are near-identical fire elementals: **merge them, or make one a fast swarm-add**, before either returns.
- **Corrupted treant** — mission removed: `corrupted_grove`. The one exotic worth reconsidering for Act 1's *edge*: a single sickening tree near the thinning as a glimpse of deeper horror. Would need the "home is safe" rule respected — out there, never at the hearth.
- **Fungal crawler** — cool, no home yet. Shared `corrupted_grove` with the treant. Drops `glowcap_spore`, which nothing crafts.
- **Dormant gear that came with them** — `dragonbone_sword`, `dragonfire_staff`, `wyrmscale_armor`, `wyrmscale_greaves` and friends are still craftable-in-principle, but their materials (`dragonfire_ash`, `wyrmshell_plate`, `livingflame_bead`) now have no source. They wake up together with the enemies.
- **A real Wastes wolf** — the name freed up by the Tier-1 pass. Undead wolves, or living wolves that scavenged corpses and aether at the Wastes' edge and came back wrong.
- **`captain_hale_stub`** — flagged in-file as an npc-escort test stub, but referenced live in `storyMissions`. Resolve with the story thread it belongs to.
- **Enemy naming polish** — the flatly descriptive ones (Forest Bear, Marsh Adder, Dire/Frost/Storm Elemental) could take place or faction flavour to match the rest of the roster.

## Rescued from deleted missions

Seeds worth keeping from missions that were themselves placeholders. The mission
was wrong; the idea underneath wasn't.

- **Frontier news** — from the deleted `tavern_intel` ("gather rumours", too generic). Reframe as *news from the road*, which now has a natural home: the tavern's rooms-and-travellers system is built, and travellers are exactly who would carry it.
- **The Shaman's Hex** — from the deleted `goblin_shaman_camp`. *Livestock sickening, crops wilting in one specific field, and the trail leads to whoever is doing it.* A good mystery structure that survives losing the goblins entirely — swap the culprit for something Act-1-appropriate and the shape still works.
- **The Burning Crypt** — from the deleted `burnt_crypt`. *A crypt has caught fire from the inside; burnt skeletons walk out at night trailing flames.* Too early and far too close to home for Act 1, but a real image, and Wastes-grade content for later.

## The raid roster (cut back 2026-08-31)

Applying the home-is-safe rule to raids: **supernatural things should not reach
the hearth.** A skeleton horde besieging your settlement is exactly the thing the
rule forbids, so the undead raids went, along with the ones no Act-1 settlement
will ever see.

**Removed:** `skeleton_horde`, `necromancer` (both undead at the gate),
`dragon_attack`, `orc_warband` (city-tier siege scale), and `goblin_scouts` —
that last one because goblins are deferred out of Act 1 by your own note
("Act 1 stays beasts + dead"), and village tier *is* reachable.

**Also removed** (2026-08-31, second pass): `troll_attack` and `mercenary_company`.
I had kept these as a town-tier ceiling, but they were placeholders like the
rest — better raids get written for that tier when a settlement can actually
reach it.

**What the roster is now:** four camp raids (hungry_bandits, wolf_pack,
gaunt_wolf_pack, petty_thieves) and two village (bandit_raid, wild_boars).
Bandits and beasts, which is exactly the Act-1 palette. **Nothing above village
tier** — so a town or city settlement currently faces only village-tier raids
until that content is written. That's a deliberate gap, not an oversight.

**Wanted: town and city raids that make sense.** Mundane, human or animal, and
scaled to a settlement with real walls. The siege mechanics already exist (rings,
walls, watchtowers, barracks, garrisons) and are unused above village tier.

**Enemies that went with them:** dragon_hatchling, feral_drake, gharkal_warlord,
goblin_shaman, lich_apprentice.

**One inconsistency left on purpose:** `petty_thieves` (camp tier) still fields a
`goblin_runt` alongside the bandit thug. By the strict reading of "Act 1 stays
beasts + dead" that goblin shouldn't be there either — but a runt pinching
turnips is a nuisance rather than a fantasy escalation, so it's an encounter
tweak to make deliberately, not cleanup.

## Novice missions cut while mid-rework (2026-08-31)

Six novice missions carried `staged: true` — not placeholders, but **work in
progress** pulled off the board and never finished. The writing was good, so the
premises are kept here even though the missions are gone.

- **The Miller's Boy** — *the miller's son went to check the fish traps at dawn and hasn't come back. The creek runs past the boar wallows, and the boy is seven.* A search against a clock, not a fight you pick.
- **Spider Hollow** — *silk on the bucket rope of the eastern well, and something moving in the dark below.* A nest under the water the whole camp drinks, which is a real reason to go down there — the animals-aren't-kill-on-sight rule satisfied properly.
- **The Old Bridge** — *a fallen oak has choked the only dry path to the hunting grounds, and two boars have taken to the wreckage, frothing.* Clearing work that turns into a fight because of what moved in.
- **The Northern Bounds** — *a pair of young wolves worrying the trap line, thin-ribbed and skittish. No need for blood: walk the bounds, see them off, and come back having proven you can hold a line without drawing one.* A no-combat patrol. Was also the map-reveal trigger for the east reach.
- **Tracks at the Treeline** — *deep claw marks near the woodcutters' worksite. Track it far enough to know what it is, no closer.* It proves a bear's day-bed rather than a hunt; you mark the ground and move the work. The rule stated as a mission.
- **Wandering Spirit** — *two restless spirits at the old crossroads, close enough in the dark to seem like one. Only a priest's blessing can lay them to rest; mundane weapons pass through bone and cloth alike.* **Unbuildable until a priest exists** — Act 1's roster is two archers, two warriors and two assassins, so this was unwinnable by design.

Two of these (The Miller's Boy, The Old Bridge) had both been renamed **"The Fold"**,
which looks like an abandoned merge into the fold chain that `fold_vigil` now holds.

**⭐ Wanted: an eastward exploration mission.** `east_reach` (map region 5) was
revealed only by The Northern Bounds, and it now stays **deliberately fogged** —
its `revealedBy` points at a sentinel id (`east_reach_exploration`) that nothing
satisfies. Repointing it at an existing mission was the wrong fix: the obvious
candidate is Cobb's escort, and Cobb travels the **north** road, so uncovering
the east by walking north with a merchant is geography nobody would believe.

So the east is closed until something earns it. What it wants is a genuine
*exploration* mission — go and look, come back knowing what's out there — which
is a mission type Act 1 doesn't have yet and probably should. When it exists,
put its id in the region's trigger.

## Novice tier — gaps found in the audit (2026-08-31)

The 22 surviving novice missions are healthy. Four things the audit turned up:

- ⭐ **Winter has no gather.** Season gates across the tier run spring ×3, autumn ×3, summer ×1, **winter ×0**. Winter is the season the whole game is about surviving, and it's the only one where the player has nothing to *choose* — they only get the forced `deer_yard` once the larder is already failing. The single most useful mission you could add: ice fishing, a cellar dig, snared hares, sloes after the first frost.
- **Summer is thin** — one mission (`berry_thickets`) against three each for spring and autumn.
- **`merchant_escort_first` gates on a marketplace *and* a tavern**, which is deep for novice tier, and it's Cobb's *return* — while the merchant design says his first arrival is what prompts building the marketplace. Worth checking that ordering can't deadlock.
- **`hunter_keepsake` deleted** — a placeholder that never got the `staged` flag. One adventurer, difficulty 1, against a mandatory forest bear encounter. Compare `bear_den`: same bear, two slots, and no encounter at all because the point is walking away. `DESIGN_BALANCE_PASS` had flagged this exact shape under "Tracks at the Treeline"; the problem had simply moved house. Old Bram's pocketwatch is a fine premise if it ever comes back — just not as a one-star solo bear fight.

## The apprentice tier — deleted whole (2026-08-31)

All 22 apprentice missions gone, plus their enemies, materials and crafts. No
premises kept: it was pre-rewrite filler, and a clean slate is worth more than
salvage.

Why it went, in its own words: `corsair_smugglers` needed a coast the frontier
doesn't have (the same mistake that got `smuggler_deal` parked); `khorvani_caravan`,
`zahkari_expedition` and `tianzhou_scholar` staged expeditions from three distant
cultures across a frontier the setting doc calls isolated with thin, dangerous
trade; `corrupt_official`, `intercept_courier` and `rival_settlement` ran political
intrigue past a settlement of six people in a clearing; and `monster_hunt`,
`deep_forest` and `bandit_camp` could have belonged to any fantasy game. **Zero of
the 22 had a map pin**, which is most of what made the "Close to home" dock feel
load-bearing.

**Gone with them:** dire_bear, gharkal_raider, ghoul, giant_rat, goblin_scout,
necromancer_acolyte, skeleton_archer, swamp_revenant · 11 materials · 10 recipes
and the gear they made (dragonbone sword, wyrmscale armour and greaves, trollhide
boots and cloak, cursed blade, dragonfire ring, orc cleaver, warlord chain, war
banner).

**Consequence:** guild level 2 has no tier of its own now. Level-2 players draw
the same novice and side-chain pool as level 1 (the board filters on
`minGuildLevel <= guildLevel`, so nothing breaks — the tier is simply empty until
it's rewritten).

