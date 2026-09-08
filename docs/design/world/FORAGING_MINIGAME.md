# Foraging Minigame — Design + Plant Register

- **Status (2026-09-08):** WIRED INTO THE GAME on `feat/foraging-wiring`. The trip is a daily mission card on the board (§3d) that routes straight into the wood, and the basket now reaches the larder via `completeForagingTrip` (honest about what did not fit: larder full, or no pantry home yet). `<ForagingScene>` is shared by the real trip and the dev sandbox. **Built:** stocking/decay/seasonal handover/rain flush, ~23 plants with decoys, terrain mask + scene anchors, board entry + routing + distinct card/pin styling, yield->larder, the trip economy (free via the board's 3AM refresh and its existing 10*2^n shard reroll). **NOT built:** the herbier, multiple regions beyond the near fold, the "next map" push-further step, escort/dog (IDEAS), and most art.
- **Purpose:** the "nothing left to do" valve for idle downtime, and the home for plant *variety* that a passive building can't carry.
- **Cross-refs:** [[project_foraging_minigame]], `docs/IDEAS.md` (Alchemy), the retired Farming Expansion doc (in git), the retired seasonal-gathers doc (in git), the retired Tavern doc (in git).

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

> ⚠ **SUPERSEDED 2026-09-08 — see §3d.** The stored stock is gone: the daily
> mission gates re-entry, and the basket cap is what makes picking a choice.

**Rejected: daily resets and charge/ticket counters.** Anything that expires creates guilt ("I forgot to forage today"), which is the exact opposite of a cozy downtime valve. Anything with a visible counter turns a walk in the woods into an errand.

> ⚠ **The CAPS below are superseded by §3c (2026-08-13).** Stock is no longer a ceiling per plant; the wood holds slots filled by a weighted lottery, so a full autumn no longer holds the same four cepes every time. Everything else here — stock not patches, the season needing no migration, rain bumping the stock — still stands.

**Instead, the limit lives in the world.** The woods hold a **stock per plant**, and picking depletes it:

```
woodsStock: Record<plantId, number>   // { blackberry: 12, chanterelle: 3, ramsons: 0, ... }
```

- **Scene generation reads the stock.** Lots of blackberry → many blackberry sprites scattered about. Zero → none appear at all.
- **Picking decrements it.** Strip the blackberries today, and tomorrow's wood is visibly thin on blackberries while everything else is still there.
- **Regrowth is a rate per plant, ticked** toward a seasonal cap.

**This replaces the ticket system entirely.** You may walk into the woods as often as you like; the limit is simply that you already picked everything and it has not grown back. No counter in the UI, no expiry, no guilt, and stripping a patch teaches the forager's ethic through the world instead of through a number.

> ⚠ **OVERTURNED 2026-08-12 — see §3b.** The no-tickets rule was decided while thinking only about *pacing*, and it is right about pacing. What it did not know is that **identification needs a scarce trip**: if entering is free, a player takes everything and sorts it in the larder, and the game's central mechanic never fires. Stock depletion still stands and still does its job, which is capping the economy. It simply is not the whole limit.

---

## 3b. One trip a day, and the wood remembers *(2026-08-12, after a long argument)*

> ⚠ **SUPERSEDED 2026-09-08 — see §3d.** The conclusion held (a scarce trip is
> what makes a basket slot valuable); the bespoke machinery did not need
> building. The mission board already refreshes daily and already prices
> rerolls exponentially. Read this section for the ARGUMENT, not the plan.

### The hole in §3a

Stock depletion caps the **economy**. It does nothing for the **game**.

If entering is free, a player picks everything in sight, walks home, walks back, and repeats — **and never once identifies anything.** The sorting happens in the larder instead of in the wood. It's the same failure as un-pickable scenery: the thing the design is *about* stops being required.

And the deciding argument, which took a long time to reach:

> **A false morel left in the wood is a false morel in the wood. Picking it or leaving it is the same thing, unless the trip was scarce.**

Everything downstream of a free entry is just accounting. Only a scarce trip makes a basket slot valuable, and only a valuable slot makes anyone look closely. **Identification cannot be produced by any rule that doesn't make the trip cost something.**

### The model

- **One trip a day.** Not a charge that accumulates, not a meter. A fact about the man: the Lord goes to the woods in the afternoon.
- **One basket, fixed slots, always the same basket.** It never grows or shrinks. The basket is the choosing.
- **Renewable with Orison Shards, on an exponential curve**, exactly like the adventurer mission board refresh. Reuses a pattern the player already knows, so it needs no explaining.
- **The stock model of §3a stays exactly as it is.** It still caps the economy and still teaches the forager's ethic.

Nobody is ever told *no*. They're told what it costs. The exponential curve makes a second trip an indulgence and a sixth absurd, without any number ever declaring a maximum.

### Why the shard price is not pay-to-win

Two reasons, and the second is a design constraint rather than an opinion:

**It buys optional fun, not power.** The same category as a cosmetic. Nobody needs to forage, and nothing behind the trip is required to progress.

**⚠ And the wood is already picked over, which is the real guard.** A second trip on the same day walks into a wood you just emptied, so the marginal yield of a paid trip falls off hard. That is what keeps the purchase honest, and it means:

> **The shard buys THE TRIP. It must never refresh the wood.**

If a paid trip ever reset the stock, this would become paying for resources on the spot. The temptation will be real, because a paid trip into a bare wood *feels* bad. Resist it. Feeling thin is the mechanism, not a bug.

### The stacking lives in the wood, not in a counter

He goes once a day, but **the wood remembers**. Skip three days and you walk into a wood grown back thick.

So a day you didn't play made your next trip *better* rather than costing you a trip. That kills the guilt problem §3a was right to worry about, with **no stack counter, no accumulated charges, no expiry and nothing in the UI**. A missed day is a gift.

It's also self-capping: `seasonCap` already bounds how thick the wood can get, so a fortnight away gives a **full** wood rather than an ever-growing one.

### Show capacity, never time

Entirely a presentation question, and it decides whether the feature works.

**Time scarcity makes people hurry. Capacity scarcity makes them selective.** Nobody panics because a bag is filling up; they get pickier about what goes in it. Same limit, opposite behaviour.

So the gauge is **the basket**, which already exists and already has slots. A player who can see three slots left thinks *those had better be good* — the exact behaviour the design wants, produced by the interface rather than by willpower. Nothing anywhere says *hurry*.

> ❌ **Rejected: escalating wolf howls as a countdown.** It was the first idea and it is actively harmful. A signal that says *your time is running out* makes players grab everything in reach, which is precisely what the feature exists to prevent. A meter that induces panic-clicking in an identification game is worse than no meter at all.

### The wolves are the door closing, not a countdown

They keep their place, at the end, **after** the decision is already made. The basket fills, the Lord notices the light has gone amber, something moves in the trees, and he decides he is a schoolmaster two miles from home and that this is enough for today.

**He is not driven out. He is finished, and then notices he'd rather not be here after dark.** If it ever reads as *you have been cut off*, it's wrong.

### Open

- Does a day he *couldn't* go (illness, a raid) give the trip back?
- Threshold for the second ending: if the wood is picked over, he should be able to come home early with *"there's nothing here worth the walk"*, which is its own quiet lesson about what you did last time.

### Rejected, with reasons worth keeping

| Approach | Why it failed |
| --- | --- |
| **Gate on the settlement being idle** (open the woods when the sidebar sparks go dark) | Elegant and nearly free, and wrong: it refuses a player who is *excited* to go. It also solves nothing, since a gated player who can take everything still never identifies. |
| **Seasonal budget** — stock set once per season, no regrowth within it | Makes a wrong pick permanently costly, which is right, but it turns the wood into a depleting bar and kills the fast respawn that makes the place feel alive. **Abundance was never the problem.** |
| **A daily budget of PICKS, tied to the wood's standing stock** | Very nearly worked, and stacking fell out of it for free. Died on the false-morel argument above: without a scarce trip, spending "budget" on rubbish is an abstraction the player never feels. Also made the basket's slot count vary day to day, which is incoherent — a basket is a basket. |
| **A deadly pick spoils the whole basket** (Edda burns it) | The best fiction anyone proposed, and it punishes carelessness in exact proportion to it. Rejected on feel: it turns a cozy walk into something that can be *lost*, and each plant already carries plenty of outcomes. **Kept on file** in case one trip a day proves too gentle. |
| **Identify on use rather than on pick** | Makes identification unavoidable, but a basket of question marks is a second puzzle nobody asked for, on top of an already-large roster. |
| **"He gets lost and can't return to a map"** | Doesn't limit anything, since a new map is a new wood. **But keep the fiction:** the Lord is no forager, he wanders, he comes out somewhere he didn't plan. That's a better explanation for the re-rolled scene layout than the layout deserves, and it costs nothing. |

---

## 3c. Slots and a lottery *(2026-08-13 — replaces the caps in §3a)*

### What was wrong with caps

Per-plant caps meant **a full autumn had exactly four cepes. Every time. Forever.** No bad years, no lucky mornings, and no reason for two full woods to differ. The cap *was* the answer, so the wood had no opinion.

### The model

**The wood holds SLOTS. Every free slot is filled by a weighted draw.**

| | |
| --- | --- |
| `SEASON_CAPACITY` | How many things the wood holds when full. **One number per season** (`spring 60, summer 75, autumn 85, winter 8`) instead of a cap for every plant. |
| `weight` | A plant's share of the draw, per season. Not a quantity, a **likelihood**. Relative, normalised, `0` = not growing. |
| `decay` | Per plant, per hour. Its job is **churn**, not scarcity. |
| `FILL_HOURS` | How long an empty wood takes to fill: 60, so a few days away really does give you a full wood. |
| `OFF_SEASON_FADE` | 0.15/h. Out-of-season stock fades and frees its slots. |

**A draw places a CLUMP, not a single plant**, using the `clump` value that already existed. Which is how a wood works: you find a patch of chanterelles, not a chanterelle. It's also what makes two full woods genuinely different rather than merely shuffled.

### What this buys

**Bad years.** Sampled over 200 autumns at these weights:

```
blackberry        15.9      bitter_bolete      3.8
chanterelle       14.7      wild_carrot        3.2
field_mushroom    12.2      cepe               2.1
false_chanterelle  7.9      hemlock            2.0

cepe: NONE in 26% of autumns, best ever 9
```

A quarter of autumns have no cepes. Most have one to three. Once in a long while, nine. **There is a test that fails if anyone reintroduces a cap**, because this is the whole reason the model changed.

**Stripping something has a consequence beyond absence.** Take every chanterelle and those slots come back as whatever wins the next draws, which may well be false chanterelles. The wood does not owe you what you removed.

**The season handover comes free.** Ramsons fading frees slots; summer draws fill them. Spring doesn't end so much as get replaced, plant by plant.

**Winter is fixed structurally**, by one number, rather than by authoring twenty small caps that all say "almost nothing".

**Rain is trivial**: extra draws weighted by `weight × rainFlush`, allowed past capacity to `RAIN_CEILING`. So a wet autumn is a *mushroom* autumn, not merely a fuller one.

### A daub marks a PLACE, not an answer

The yellow `wood_fungus` daub is shared by every fungus that grows on standing wood: oyster mushroom, judas ear, velvet shank and the funeral bell all sit on it, and which one a marked trunk bears is drawn from what the wood currently holds.

**This is not a convenience, it is the pair working at all.** If the artist had to mark velvet shank and Galerina separately, a given scene would show the same species in the same place every time, and its tell would be worth learning exactly once. **The same trunk has to be able to bear supper one winter and poison the next.** Two tests hold that line.

Any future family that shares a habitat should share a daub for the same reason. `anchorKind` on a plant says which one it uses; it defaults to the plant's own id, which is why blackberries still take violet daubs of their own.

### The rule that keeps it honest

> **Left alone, the wood must fill up.** Filling outpaces fading by design, so a few days away gives a full wood back. Scarcity comes from a plant's **weight**, never from a ceiling and never from an equilibrium below capacity.

An earlier tuning pass got this exactly backwards, holding the cepe at 2 forever by balancing its regrowth against its decay. That made the prize scarce and quietly broke the promise the entire no-tickets design rests on. **Scarcity is a likelihood, not a limit.**

### Two traps, both hit once already

**Never step the decay maths linearly.** `dS/dt = regrow − decay·S` integrated with one big step inverts on long spans: a 300-hour offline catch-up subtracts more than the stock ever held and lands on zero, so a player returning after a week would find a **dead wood instead of a full one**. Solve it, or advance in bounded chunks. There's a test.

**Never let out-of-season stock snap to zero.** It fades, and the safety property survives because it only ever decreases, so it still converges and cannot go stale. The hard reset looks like a simplification and is a regression.


## 3d. The trip IS a daily mission *(2026-09-08 — supersedes the bespoke economy in §3b and the persistent stock in §3a)*

The entry point is a **mission on the adventurers' board**, visually distinct from
the combat cards, sitting on the map. Click it and you arrive in the forest
directly — no deploy panel, no adventurer occupied, no duration, no failure
state. You go; the card is only the door.

**This deletes three systems instead of building them**, because the board
already does the work §3b specified by hand:

| §3b wanted | the board already has |
| --- | --- |
| one free trip a day | the board refreshes daily at 3am (`lastMissionRefresh < today3am`) |
| extra trips at an exponential price | `rerollMissions()` costs `10 * 2^rerollCount` shards |
| a daily counter that resets | `missionRerollToday` |

So the trip economy needs no new code. What it needs is one small thing the
board cannot do yet: a mission that **routes to a screen instead of deploying**.

### The wood is full every time, and there is no persistent stock

§3a made picking decrement a stored stock so that passing on a cepe might mean
losing it. That was solving a problem created by *free re-entry* — walk home,
walk back, strip it again. The daily mission solves that problem instead, and
the **basket cap (`BASKET_SIZE = 10`) is what makes picking a choice**: one trip,
ten slots, more plants in front of you than you can carry.

So the wood starts full on every trip. What varies is the **map** — different
scenes drawn from the region you are in, and unlocking new map regions through
the story unlocks new forests to walk into. Within a single trip you can press
**"next map"** to go further out, which is where an escort and real danger would
eventually attach.

Deleted by this: `woodsStock` in the save, the SAVE_VERSION bump it needed, the
tick integration for regrow/decay, and per-region stock bookkeeping. The pure
functions `advance()` and `rain()` stay in `shared/src/data/foraging/` — they are
tested and harmless, and a future "the near wood is tired" rule may want them.

### ⚠ What this costs, stated plainly

§3b's stated guard against shard-rerolling-for-resources was that *"the wood is
already picked over"* — a paid trip walked into a wood you had just stripped.
A wood that is always full removes that guard, so the rule
**"the shard buys THE TRIP, it must never refresh the wood"** no longer protects
itself structurally. What holds instead is economic:

- the basket caps a trip at **10 plants**, no matter how many trips you buy
- rerolls cost 10, then 20, 40, 80 shards
- quests pay 3–5 shards, so a second trip is several quests' worth of shards for
  at most ten low-yield plants

That is a bad enough trade to be safe, but it is now the *only* thing making it
safe. If shards ever get cheap, or foraging yields ever get generous, this is the
line that breaks — check it then.

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
