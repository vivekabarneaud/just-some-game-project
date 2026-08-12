# Foraging Minigame — Design + Plant Register

- **Status:** DESIGNING (2026-08-07). Concept agreed in discussion; nothing built.
- **Purpose:** the "nothing left to do" valve for idle downtime, and the home for plant *variety* that a passive building can't carry.
- **Cross-refs:** [[project_foraging_minigame]], `DESIGN_APOTHECARY.md`, `DESIGN_FARMING_EXPANSION.md`, `DESIGN_SEASONAL_GATHERS.md`, `DESIGN_TAVERN.md`.

---

## 1. The design job

The player has done the daily missions, every building is gated on resources, and there is nothing to do but wait. That is the moment this exists for. It is a **pacing valve**, not a content pillar.

Which fixes the constraints:

- **Rate-limited.** Never farmable — but by world state, not by a counter (§3a).
- **Low yield.** It must never become the optimal way to get resources, or it replaces the game instead of filling its gaps.
- **High charm.** The reward is the two minutes in the woods, not the eight blueberries.
- **Cozy, not twitchy.** No timers, no clicking speed. Tension comes from a limited basket and uncertain identification.

## 2. The core principle (the unlock)

> **Passive systems punish variety. Active systems reward it.**

A forager's hut auto-producing 15 plant types is noise: a wall of small numbers nobody asked for. A player choosing 10 things out of 30 possibilities is a *rich world*, because they curated it.

**Division of labour:**

| | Produces | Why |
| --- | --- | --- |
| **Forager's hut** (passive) | Food **staples** + common ditch herbs | Feeds the economy. Reliability is the point. |
| **Minigame** (active) | **Variety**: rare finds, poisons, oddities, one-off fruits | Every plant stops being clutter the moment picking it is a choice. |

## 3. Loop

1. Walk into the woods. **Always available** — no charges, no tickets, no daily reset (see §3a).
2. A **hand-painted forest scene**, one backdrop per season.
3. Plants are **sprites scattered procedurally** over that static backdrop, so the search is fresh every visit and 4 backdrops carry the whole system.
4. Click to gather into a **limited basket** (~10 slots).
5. **No labels in the scene. Ever.** (See §4.)
6. **Ends when the player says so, or when the basket fills.** You can "go deeper" to another scene, but the basket does not reset, so depth trades against what you already carry.
7. Basket resolves at the end: Edda names what you actually got; the herbier fills in.

**Seasonality** rides on the existing season system: spring greens and ramsons, summer berries, an autumn mushroom flush, a near-bare winter wood (see medlar, §6, for why winter still has a reason to exist).

## 3a. Rate limiting: the woods remember (no tickets)

**Rejected: daily resets and charge/ticket counters.** Anything that expires creates guilt ("I forgot to forage today"), which is the exact opposite of a cozy downtime valve. Anything with a visible counter turns a walk in the woods into an errand.

**Instead, the limit lives in the world.** The woods hold a **stock per plant**, and picking depletes it:

```
woodsStock: Record<plantId, number>   // { blackberry: 12, chanterelle: 3, ramsons: 0, ... }
```

- **Scene generation reads the stock.** Lots of blackberry → many blackberry sprites scattered about. Zero → none appear at all.
- **Picking decrements it.** Strip the blackberries today, and tomorrow's wood is visibly thin on blackberries while everything else is still there.
- **Regrowth is a rate per plant, ticked** toward a seasonal cap.

**This replaces the ticket system entirely.** You may walk into the woods as often as you like; the limit is simply that you already picked everything and it has not grown back. No counter in the UI, no expiry, no guilt, and stripping a patch teaches the forager's ethic through the world instead of through a number.

---

## 3b. The basket is the budget *(added 2026-08-12, after a long argument)*

### The hole in §3a

Stock depletion caps the *economy*. It does nothing for the *game*. If entering is free, a player can pick everything in sight, walk home, walk back, and repeat — **and never once identify anything.** Sorting happens in the larder instead of in the wood, and the entire mechanic evaporates. It's the same failure as un-pickable scenery: the thing the design is about stops being required.

The mistake in every early fix was **limiting the door**. Tickets, idle-gating, wolves-as-timer, cooldowns: they all decide *when* you may go, and a gated player who can still take everything still never identifies anything. They just do it on a schedule.

### The fix: limit taking, not entering

**Enter as often as you like. Carry out a fixed amount per day.**

That single move puts the cost on the right side of the door, and it works because **a careless pick spends the same budget as a good one.** Every mushroom grabbed without looking is a cepe you don't get today. That's the exclusivity nothing else produced.

- **The budget counts PICKS, not value.** Rubbish and treasure cost exactly the same. If it counted value, careless picking would be free again, which is the whole bug.
- **It stacks across days**, to a small cap (two or three days' worth). Enough that skipping a day costs nothing, not enough that a week away becomes one wood-stripping run.
- **It's tied to the wood's standing stock**, not a hand-tuned number, so it scales itself: a rich autumn gives long afternoons, a bare winter gives short ones.

### Show it as CAPACITY, never as time

This is the part that decides whether the design works, and it is entirely a presentation question.

**Time scarcity makes people hurry. Capacity scarcity makes people selective.** Nobody panics because a bag is filling up; they get pickier about what goes in it. Same limit, opposite behaviour.

So the gauge is **the basket**, which already exists and already has slots. A player who can see three slots left thinks *those had better be good* — the exact behaviour the design wants, produced by the interface rather than by willpower. Nothing anywhere says *hurry*.

> ❌ **Rejected: escalating wolf howls as a countdown.** It was the first idea and it is actively harmful. A signal that says *your time is running out* makes players grab everything in reach, which is precisely the behaviour the whole feature exists to prevent. A meter that induces panic-clicking in an identification game is worse than no meter.

### The wolves become the door closing, not a countdown

They keep their place, at the end, **after** the decision is already made. The basket fills, the Lord notices the light has gone amber, something moves in the trees, and he decides he is a schoolmaster two miles from home and that this is enough for today.

**He is not driven out. He is finished, and then notices he'd rather not be here after dark.** If it ever reads as *you have been cut off*, it's wrong. He's a schoolmaster who knows he isn't a woodsman, and going home is the correct decision by a sensible man.

### Two endings, and they should feel different

| Ending | Feels like |
| --- | --- |
| **The basket is full** | The ordinary one. A good afternoon, done. |
| **The wood is picked over** (stock below a threshold) | Rarer, and it should land differently: not *I'm done* but *there's nothing here worth carrying home*. Its own quiet lesson about what you did last time. |

### Plants need a duration, not only a respawn

A respawn rate alone means an absent player returns to an accumulated fortune. **Things should also go away.** Mushrooms genuinely rot in days.

So the wood doesn't bank value while you're gone: things come, and things go, and a week away means a **full** wood rather than a **stacked** one. It also gives the wood a heartbeat, so two visits a few days apart are genuinely different visits rather than the same one twice.

### Also rejected, with reasons worth keeping

| Approach | Why it failed |
| --- | --- |
| **Tickets / charges** | Guilt and expiry. The original §3a rejection stands. |
| **Gate on the settlement being idle** (open the woods when the sidebar sparks go dark) | Elegant, nearly free, and wrong: it refuses a player who is *excited* to go. It also doesn't solve anything, since a gated player who can take everything still never identifies. |
| **Seasonal budget** — stock set once per season, no regrowth within it | Makes a wrong pick permanently costly, which is right, but it makes the wood a depleting bar and kills the fast respawn that makes the place feel alive. Abundance is not the problem. |
| **A deadly pick spoils the whole basket** (Edda burns it) | Genuinely good fiction and it punishes carelessness in exact proportion to it. Rejected on feel: it turns a cozy walk into a thing that can be lost, and the catalogue already has plenty of outcomes to track per plant. Kept on file in case the budget alone proves too gentle. |
| **Identify on use rather than on pick** | Makes identification unavoidable, but a basket of question marks is a second puzzle nobody asked for, on top of an already-large plant roster. |

### Why store stock, not patches
Persisting individual patches (position + species + picked-at + per-patch respawn timer) is the complicated design, and it is the same class of stateful bug already biting the farm (fields still holding live crops in winter, see `TODOs`). A plain stock record avoids all of it, and every worry answers itself for free:

| Worry | Answer |
| --- | --- |
| Different plants regrow at different speeds | One regrow rate per plant. Berries return in days; a King Bolete takes far longer. One number each. |
| The season changes overnight | The scene is generated fresh from the **current** season every visit. Nothing is remembered, so nothing can go stale. Winter simply drops most caps near zero and the wood is bare. **This design cannot get the fields-in-winter bug.** |
| It rained, should mushrooms appear? | Bump the mushroom stock. **The mechanism already exists** — `rainMushrooms` / `rainCepe` in `gatheredFoodRate()`. Same idea, new home. |

## 4. Identification, not eyesight (the key mechanic)

The challenge is **knowing**, not spotting. Real foraging skill is identification.

**No label ever appears on a plant in the scene** — not a name, not a "???". Any label destroys the system: the moment a plant is marked, the player simply stops picking marked things, and one lesson kills the mechanic forever.

Instead, **the knowledge belongs to the player, not to a tooltip.** What fills in is a **herbier** (a field journal of pressed plants), recording each discovery's name *and how to tell it apart*: ramsons smell of garlic and grow one leaf per stem; lily of the valley has paired leaves and no scent. Consultable, but a deliberate act, never automatic help.

So the progression is real and lives in the player's eye. Your fourth trip is easier than your first because **you** got better.

**Art requirement (deliberate):** lookalike sprites must be genuinely distinguishable on a careful look. This is what makes the beautiful drawing *functional* instead of decorative.

### No fail state, only surprises
A misidentification is **never** damage or punishment. The decoy takes up a basket slot, Edda picks it out and tells you what it really was, and it is identified in the herbier forever after. You lose a slot, you gain knowledge. That is the loop, not a penalty.

For genuinely deadly plants, Edda's line does the safety framing for free and is dramatically good: *"That one would have killed you."*

---

## 5. Already in the game (keep as-is)

**Wild foods** (`frontend/src/data/foods.ts`, `category: "wild"`) — these came from the 2026-08 forager split and stay **hut-produced staples**:
`blackberry`, `blueberry`, `raspberry`, `dandelion`, `sorrel`, `ramsons`, `wild_carrot`, `field_mushroom`, `morel`, `chanterelle`, `cepe` (King Bolete), `nuts`.

They can *also* appear in the minigame as pickable variety; the hut keeps producing them for the food economy.

**Herbs** (`shared/src/data/herbs.ts`) — 14 exist:

| Herb | dropRate | Verdict |
| --- | --- | --- |
| chamomile, nettle, yarrow, wildmint | .045-.05 | **Stay passive.** Common as the ditches they grow in. |
| feverfew, mugwort | .04 | **Stay passive.** Workhorse commons. |
| comfrey, willowbark | .03 | Passive is fine; also good minigame picks. |
| rosehip, nightbloom | .012 / .01 | **Clutter candidates** → see §7. |
| moonpetal | .003 | Keep the rare passive thrill (gem-tier lottery). |
| greymantle, fenbalm, lavender | 0 | Correct as-is: mission/trade/cultivation only, never foraged. |

## 6. New plants (proposed)

### 6a. Fruits (flavour + diversity, never power)

The reward type is deliberately **a unique recipe**, which is the safest reward that exists here: the mild-food-effects rule already caps how strong any dish can ever be, so it *cannot* be OP.

| Plant | Real? | Use | Notes |
| --- | --- | --- | --- |
| **Medlar** *(nèfle commune, Mespilus germanica)* | Native/naturalized Europe, Roman times onward, hedgerows + medieval orchards. Vernacular: **"cul de chien"** (cf. rosehip's *gratte-cul*). | Bletted → eaten, or medlar jelly/conserve | **The pick.** Inedible until **bletted** (softened after the first frost), so you find it in autumn and *cannot eat it yet* — you store it and wait for the cold. **Gives the near-empty winter wood a reason to exist and rewards patience.** NOT the orange *nèfle du Japon* (loquat) — different fruit, Asian, 18th-19thc, excluded. |
| **Sloe** *(prunelle, blackthorn)* | Yes, hedgerow | **A tavern drink** | Harsh raw, lovely with time + honey. **Cheap to build: the tavern drink system is already generic over ale/mead/cider**, so a sloe drink is a config entry. NOTE: sloe *gin* is anachronistic (17thc Dutch) — use sloe **wine / cordial / honey-infusion**. |
| **Elderberry + elderflower** *(sureau)* | Yes | Cordial; two harvests | **Two harvests off one tree in two seasons** (flowers spring, berries autumn). Carries real folklore (the elder mother, a protective tree) if we want foraging to brush the world's stranger edges. Berries want cooking. |
| **Crabapple** *(pomme sauvage, Malus sylvestris)* | Yes — the true wild apple | Verjuice; jelly (huge pectin) | Far too sour to eat raw. The transformation angle again. |

### 6b. Poisons + the dangerous shelf

Poison stays **entirely mundane craft**. This keeps a sharp line between "dangerous knowledge" and magic, which the world's magic rules care about ([[project_magic_rules]]). It is **not** witch-flavoured: Aldith is a sad grandma, not a hag (user, 2026-08-07).

Destination: the **assassin toolkit** (Sable, Edmund) and **throwable potions** — pairs naturally with the parked *vesse de loup* smoke bomb ([[project_puffball_smokebomb]]) as one coherent **offensive alchemy slice**.

| Plant | Effect / role | Status |
| --- | --- | --- |
| **Hemlock** *(ciguë)* | The clean lethal one (Socrates' poison). Assassin's coating. | **NEW.** Long-wanted. Real item, because we want it in the basket. Lookalike of **wild carrot**. |
| **Nightshade / belladonna** *(belladone)* | Delirium + visions, not the heart. Name from Renaissance pupil-dilation ("beautiful lady"). | **ALREADY EXISTS** in `shared/src/data/alchemy/ingredients.ts` (`role: "toxin"`, rare, `crush`) — **but has NO source anywhere. Currently unobtainable.** The minigame is its home. See §7. |
| **Lily of the valley** *(muguet)* | Attacks the **heart**. | **DECOY ONLY** (§8) unless we later want it as a poison. Its leaves closely mimic **ramsons** — the single most common serious foraging mistake in Europe. |
| **Mandrake** *(mandragore)* | Deliriant; historically a surgical anaesthetic. Forked human-shaped root; the screaming-root folklore (medieval herbals genuinely advised tying a **dog** to it). | **NEW, but TRADED not foraged** — Mediterranean, wouldn't grow in the frontier woods. A southern merchant unrolls it from a cloth with too much ceremony. Ties [[project_traveling_merchants]]. |

## 7. Clutter audit — what moves to the minigame

Applying §2 to what already exists:

| Item | Today | Proposal |
| --- | --- | --- |
| **`nightshade`** | Alchemy toxin with **zero sources**. Unobtainable. | **→ minigame.** Perfect fit: a dangerous plant you pick deliberately. Fixes an orphan. |
| **`fly_agaric`** *(was `witchs_cap`, renamed 2026-08-12)* | Alchemy wildcard (rare, `boil`) with **zero sources**. Unobtainable. | **→ minigame.** It was always the fly agaric under an invented name; the real one gives it a source. Fixes an orphan. |
| **`rosehip`** (.012) | Rare passive trickle + the wild-tree find | **→ minigame-weighted.** A rare drip into the larder is the classic clutter pattern; picking it deliberately is better. Keep the wild-tree find. |
| **`nightbloom`** (.01) | Rare passive trickle | **→ minigame-weighted.** "Only blooms under moonlight" deserves to be *found*, not trickled. |
| **`morel`, `cepe`** | Hut-produced | Keep in the hut, but make them **prize picks** in the scene. Both are seasonal treasures; `cepe` already has the rain-flush event. |
| Common herbs (chamomile/nettle/yarrow/wildmint/feverfew/mugwort) | Passive | **Leave alone.** These are the ditch-weeds that *should* rain in passively. Reliability is their job. |

**Rule of thumb for future content:** if it is rare, characterful, or dangerous → the minigame. If it is common and feeds the economy → the hut.

## 8. Lookalike register

Two kinds, at wildly different build costs:

- **Real item** — something you *want* in the basket. Earns a full id, icon, and downstream use.
- **Decoy** — a scene sprite you can misclick. **Never touches `FOOD_ITEMS`, `RewardType`, the topbar, or the kitchen.** It is scene decoration with a name and one line of flavour. As cheap as content gets. Promotable to a real item later if a use appears.

| Real plant | Lookalike | Lookalike type | Tell |
| --- | --- | --- | --- |
| **Ramsons** *(ail des ours)* | **Lily of the valley** | Decoy | Ramsons smell of garlic, one leaf per stem; muguet has paired leaves, no scent. |
| **Wild carrot** | **Hemlock** | **Real item** (we want it) | Hemlock: smooth stem with purple blotches; wild carrot: hairy stem, one dark floret at the centre. |
| **Chanterelle** | **False chanterelle** | Decoy | True: forked blunt ridges running down the stem. False: true flat gills. |
| **King Bolete** *(cepe)* | **Bitter bolete** | Decoy | Pore colour + the bitter cousin's darker net on the stalk. |
| **Morel** | **False morel** | Decoy | True morel: pitted honeycomb cap, hollow throughout. False: lobed/brainlike, chambered. |

## 9. Explicitly NOT adding

- **Loquat** *(nèfle du Japon)* — the orange one. Asian, 18th-19thc, wrong setting. Only listed to prevent the medlar confusion recurring.
- **Sloe gin** — the drink is fine, the *gin* is anachronistic.
- Any lookalike as a **real item** unless it has a downstream use. Decoys first, promote on demand.

## 10. The dog

**Truffle should come foraging.** Truffle dogs find what you cannot see. Let him point at one hidden thing per scene, or sniff out the rare find. Thematically perfect, useful without being powerful, and it quietly ties this to the walking-the-bounds / companion thread ([[project_companion_app]], [[project_animal_companions]]).

## 11. Open questions

- **Basket stakes.** A cap alone is arithmetic. A soft request (*"Edda would be glad of anything for the winter fevers"*) gives the choice weight. Keep it a wish, never a chore.
- Which single fruit ships first? (Medlar recommended, for the winter payoff.)
- Does the minigame live at the forager's hut, or is it its own page?
- Tuning: regrow rates per plant, seasonal caps, basket size (~10?).
- Does a trip cost anything at all (time? the Lord's presence?), or is walking into the woods free with depletion as the only limit?
- Should the "go deeper" scenes be richer but further (tying to walking-the-bounds / escort), or just more of the same?
- Herbier: standalone page, or a Chronicle tab?
