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

