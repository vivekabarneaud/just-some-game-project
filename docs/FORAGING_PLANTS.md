# Foraging — Plant Catalogue

- **Status:** living working sheet, filled in plant by plant. Started 2026-08-12.
- **Companions:** `DESIGN_FORAGING_MINIGAME.md` (why the minigame exists, how it works) · `FORAGING_PROMPTS.md` (the art backlog).
- **How to use:** work down a location, decide one plant at a time, write it up here. `✅` means settled and ready to build; `⏳` means it still wants a conversation.

---

## The rules we're working to

**One identity each, not a full set.** A plant earns a signature **dish**, *or* a **tavern drink**, *or* an **alchemy use**, *or* it's a **decoy**. Crossover only where it's genuinely both — which is rare, because the delicious plants and the medicinal ones are mostly different plants. Forcing a potion out of a chanterelle is exactly the clutter this catalogue exists to prevent.

**The winter test** decides how a plant is drawn. *Would you see it in the woods in January?*
- **Yes** → it's part of the place. **Painted into the scene**, with its fruit hanging at anchors on the mask. Brambles, bilberry mats, hazel, wild rose, elder.
- **No** → it comes and goes. **A sprite**, scattered on terrain. Mushrooms, wild greens.

**Discipline in the gathering, freedom in the pot.** Foraging is where the player must be careful — identify it or waste the slot. Cooking is the opposite: permissive, experimental, closer to Breath of the Wild, where throwing things together and being surprised is the point. Those two wanting opposite things is not a contradiction; it is what makes them different activities rather than one long chore.

**Every plant earns its slot with a source and a season.** If it doesn't grow somewhere specific at some specific time, it's a name rather than a plant.

**Decoy pairs must share a season, a terrain, and a size range** (unless size *is* the tell), and both halves must be painted or neither. The tests enforce this.

---

## Locations

| # | Place | Character | Gate |
| --- | --- | --- | --- |
| 1 | **The near wood** | damp deciduous floor, litter and fallen timber | start |
| 2 | **The clearing and wood edge** | sunny, grassy, scrubby | forager's hut |
| 3 | **The hills** | dry, stony, garrigue | forager's hut |
| 4 | **The chestnut grove** | hill groves, autumn harvest | forager's hut |
| 5 | **The old oakwood** | late, and the dog finds things | late / story |

*The fen is deliberately absent.* It's full of adders and the Lord has neither the time nor the reason to go picking there — and treating it as a safe gathering spot would undercut the danger the marsh missions establish.

---

# 1 · The near wood

### ✅ Chanterelle
- **Is:** *Cantharellus cibarius*, the **girolle** — golden, firm, blunt forked ridges running down the stem, smells faintly of apricots.
- **Naming, settled:** English "chanterelle" = French "girolle". The brown one with the hollow orange foot that French calls *chanterelle en tube* is a **different species** and is catalogued separately as **Yellowfoot** below. English-first, same reasoning as King Bolete over Cèpe.
- **Season / terrain:** summer into autumn · wood, litter
- **Decoy:** false chanterelle ✅ *(painted, 3 shapes each)*
- **Kitchen — two dishes, deliberately:**

  **Chanterelles on the Coals** · `one(chanterelle, skewer)` · *camp*
  One ingredient, one stick, available from the first hour. Exploits the specific-beats-general rule: *Fire-Charred Mushrooms* is `any(mushroom, skewer)` and preknown, so grilling **chanterelles** resolves to this instead. The player already knows how to char a mushroom, goes foraging, finds the good one, and the fire hands back something with its own name. Not preknown — it should be a discovery.
  > Threaded on a green stick and held over the coals. The finest thing in the wood, eaten where it was found.

  **Wild Fowl and Chanterelles** · `one(wild_fowl, roast)` + `one(chanterelle, fry)` · *town*
  The later, grander one. Two stations, so it reads as real cooking. Names the bird specifically, since wild fowl comes from the hunting camp's autumn basket and the pairing is the point.
  > Chanterelles fried in the bird's own fat while it roasts. The whole kitchen smells of apricots.

- **Alchemy:** none. Not a medicinal mushroom, and inventing a use would be clutter.

### ✅ King Bolete
- **Is:** *Boletus edulis*, the cèpe — fat pale bulbous stalk with a fine net near the top, brown cap, cream pores. The meatiest mushroom there is.
- **Season / terrain:** autumn only · wood. The **slowest-regrowing plant in the game** (0.06/h), so a bolete you take is one you won't see again soon.
- **Decoy:** bitter bolete ✅ *(painted, 3 shapes each)* — the *pissacan*, which ruins a pot rather than killing you.
- **Kitchen — two dishes:**

  **Bolete Broth** · `one(cepe, boil)` + `one(bone, boil)` · *camp* · NEW
  Upgrades *Bone Broth* the way the chanterelle upgrades the charred mushrooms. Deliberately not another stick-over-the-fire dish: a cepe's character is depth and savour, not char, and it makes an extraordinary dark stock. Also gives the bolete something to be at camp, since its existing dish needs the Village pan.
  > The king of the wood boiled down with marrow bones. Dark as tea, and it warms you from the inside out.

  **Bolete Fry** · `one(cepe, fry)` + `one(ramsons, fry)` · *village* · EXISTS
  Worth knowing: cepes are autumn and ramsons is spring, so this can only be cooked by holding wild garlic from spring through to autumn. That's a *planned* dish rather than an impossible one (the larder keeps food), and arguably a nice one — but flag it if it ever reads as a bug.

- **Alchemy:** none. It's food, and gloriously so.

### ✅ Morel
- **Is:** *Morchella* — a cap pitted like a honeycomb, hollow all the way down. Spring's prize, and toxic raw.
- **Season / terrain:** spring only · wood, litter
- **Decoy:** false morel *(unpainted)* — lobed and brain-like rather than pitted, and the one decoy that yields (see above).
- **Kitchen:**

  **Morel Cream** · `one(morel, fry)` + `one(milk, boil)` · *village* · EXISTS

  **Spring Omelet** · `one(eggs, fry)` + `one(morel, fry)` + `one(ramsons, chop)` · *village* · NEW
  Everything in it is spring: morels are spring-only, ramsons is spring-only, and the hens lay hardest then. A dish that can only exist for about three weeks of the year, out of things gathered on the same walk. The ramsons goes in chopped and raw at the end, which is both how you'd do it and a second station, so it reads as cooking rather than dumping.
  > Morels and wild garlic folded through eggs. Everything in it came out of the same three weeks of the year.

- **No camp dish, deliberately.** Morels cook fine in the generic pots, they just aren't *special* until there's a pan — which suits a spring luxury.
- **Alchemy:** none. Food, and the never-raw rule already gives it an edge most mushrooms lack.

### 🍲 Fowl in Cream — nobody's signature
`any(poultry, boil)` + `any(mushroom, fry)` + `one(milk, boil)` · *village*

Deliberately generic on both counts, because the kitchen needs **forgiving everyday dishes** as much as it needs signatures — something you can make with whatever the wood gave up. Three slots, so it out-ranks *Morel Cream* when a bird is added, which is right.
> A bird stewed pale in milk with whatever mushrooms the wood gave up. Rich, and quietly grand.

**Poultry is emotionally expensive**, and the mechanics agree: a pig produces nothing while it lives ("pays off when it's culled, not while it lives"), whereas a hen is a *producer* — culling one costs eggs forever. So chicken meat should read as an occasion rather than a staple, and dishes built on it should be rare and worth it. Noted for when we reach the poultry.

### ⏳ Field mushroom
The humble one. Being common may be identity enough — no signature dish needed.

### ⏳ Ramsons
The first real crossover: kitchen (it already lifts a dish) **and** alchemy, since garlic is a genuine antiseptic — a **hero** in a wound-wash or fever brew. Decoy: lily of the valley ✅ *(painted, 3 shapes each)*.

### ⏳ Blackberry
Kitchen (jam, pottage). But the **leaf** is the medicine — bramble leaf is astringent, the old remedy for sore throats. Same bush, two harvests. Painted-in bush ✅ *(bramble painted)*.

### ⏳ Bilberry
Kitchen, plus the most gameable alchemy on the list: bilberry is famously an **eyesight** remedy. In a game about searching a painting for half-hidden things, that could do something rather lovely. Painted-in mats.

### ⏳ Hazelnut
Kitchen only, fat and keeping. Infrastructure rather than a star — but it would finally give the generic `nuts` a real source.

### ⏳ Yellowfoot *(new)*
*Craterellus tubaeformis* — brown cap, hollow orange-yellow stem, delicate. **Late autumn into winter**, after the first frosts. A second prized mushroom with no decoy needed, and it fills the emptiest season in the game.

### ⏳ Death cap
Pure poison, no dish ever. The assassin's ingredient, and the most frightening thing here because it looks so ordinary — a decoy for the field mushroom.

### ⏳ Fly agaric
Alchemy only, never food. Deliriant and visions, which speaks to the Chapter 2 madness thread. Would give **`witchs_cap`** — an alchemy ingredient currently with *no source at all* — its source at last.

---

# 2 · The clearing and wood edge

⏳ Dandelion · Sorrel · Wild carrot *(+ hemlock)* · Parasol *(+ deadly dapperling)* · Elder *(+ danewort, its poisonous twin)* · Wild rose (rosehip) · Raspberry · Hawthorn *(haws + a real heart remedy)* · Crabapple *(verjuice, jelly)* · Nettle *(already a herb — this would become its source)*

# 3 · The hills

⏳ Juniper *(kitchen spice + alchemy — with game meat)* · Bay *(kitchen spice)* · Wild thyme · Rosemary · Savory · Blackthorn *(sloe → a tavern drink)* · Saffron milk cap *(the **sanguin**, bleeds orange, grilled with garlic)* · Monkshood *(alchemy, the most poisonous plant in Europe)*

# 4 · The chestnut grove

⏳ **Chestnut** *(a larder **staple**, not a garnish — l'arbre à pain)* · Walnut *(kitchen, oil, brown dye for tailoring)* · **Acorn** *(pig mast — pannage is real practice and there is already a pig pen with a feed cost; plus famine flour)*

# 5 · The old oakwood

⏳ **Truffle**, found by the dog. Which is called Truffle.

---

## Cut, and why

- **Wild strawberry** — strawberries already exist as a cultivated fruit.
- **Guelder rose, honeysuckle berries** — redundant once danewort is the red-berry decoy.
- **Pine nuts** — fiddly to gather, adds nothing the other nuts don't.
- **Watercress, fenbalm** — need the fen, which is out.

---

## Decoys: what they're worth

**The cost of a mistake is the BASKET, not waste.** Ten slots means every one spent on the wrong thing is one not spent on supper. That holds even for decoys that yield something, so no further penalty is needed — and it turns a mistake into an opportunity cost, which is a choice rather than a punishment.

**Gating a decoy's use on "knowing what it is" doesn't work.** Edda names everything the first time she goes through the basket, so one mistake teaches you forever and the gate opens immediately. Decided against 2026-08-12.

| Decoy | Worth |
| --- | --- |
| **False chanterelle** | **Nothing.** Not even poisonous — just bland and faintly unpleasant, not worth the fire. Some decoys should simply be disappointing, or every mistake pays. |
| **Bitter bolete** | **Nothing.** Tempting, since bitterness is a real herbal category (gentian, wormwood, digestive tonics) — but it isn't toxic, alchemy has heroes enough, and its identity is *ruining supper*. Let that be enough. |
| **False morel** | **A real poison.** *Gyromitra esculenta* contains gyromitrin, which the body converts to something closely related to rocket fuel. Still eaten in Scandinavia after long parboiling; still occasionally kills people. |

One decoy in three being secretly useful feels like the right ratio: enough that knowing your plants pays, not so much that carelessness does.

### 💭 The false morel draught

Rocket fuel suggests a **risky** potion rather than a straightforwardly good one: burn hot, pay for it. A genuine choice instead of a strict upgrade, which suits a game with no min-max obligation — you take it when the fight warrants it, not every time.

Two shapes for the cost, and probably not both:
- **A drain during the fight.** More damage or speed, and it burns the drinker each round. Tactical: a race against your own draught.
- **Illness the day after.** Full strength in the fight, then the adventurer is laid up and can't deploy. Strategic: a cost you plan a week around.

The day-after version pairs better with the existing recovery and wound systems; the drain version is more exciting moment to moment. Belongs with the parked **offensive alchemy slice** (poisons, throwables, the *vesse-de-loup* smoke bomb) rather than as a one-off.

---

## Dreaming: drying

**`preserve` is documented as "a later town method", and that is backwards.** Sun and air drying is the most primitive preservation there is — a string, a rack, good weather. Older than the pan, far older than the oven. What actually needs a settlement is *salting* (needs salt, a trade good) and *smoking* (needs a smokehouse). So drying belongs at **camp**, possibly as the first technique of all.

**As an upgrade, not an insurance policy.** Drying earns its place the same way jam does: rosehips didn't need to rot for rosehip jam to be worth making, the jam is simply better than the raw hip. Dried cepes are genuinely *more* intense than fresh — one of the few preservations that improves a thing rather than merely saving it. So it reads as "drying makes it better", never "not drying makes it worse".

That means it needs **no new systems**: kitchen recipes already produce foods, so `cepe → dried cepe` is the same shape as `rosehip → rosehip jam`, and dried cepe simply cooks with more punch.

**Spoilage: decided against (2026-08-12).** It would punish exactly the way this game is meant to be played — a browser game you tab into on a break, with offline progression, so coming back after a day away would routinely mean loss. There are already three food pressures (hourly consumption, the famine threshold, winter cold, raids) and spoilage would be a fourth and the fiddliest, the one demanding constant attention rather than occasional decisions. It also cuts against mild-effects and cozy: it is the one system that would nag.

**Freshness decay: parked, softer, and cheaper than it looks.** Food never disappears, but its `fresh` contribution fades, so berries eaten soon give a boon that month-old ones don't. The obvious implementation needs the larder to become *batches* with timestamps, which ripples through consumption, caps and UI — too much for a mild effect. But a cheap approximation exists: **one freshness number per food type**, decaying over time and rising when new stock is added, weighted by amount. A larder you keep topping up stays fresh; one untouched for weeks goes dull. One extra number, no batches. Worth remembering if the seasons ever feel flat.

**What drying would be FOR, if it lands:** winter. The wood is bare by design, so winter is not for gathering — it is for eating what you kept. That pairs with the medlar, which only ripens after frost. Two different kinds of patience, both pointing at the same quiet season.

## Open threads

- Two aromatics (juniper, bay) would **double the local spice shelf**, which currently holds only honey and lavender — every other spice is merchant-only and unobtainable, leaving four dishes permanently theoretical.
- Several catalogued plants **already exist as herbs** (nettle, yarrow, comfrey, chamomile, mugwort, willowbark, wildmint, feverfew) and currently rain from the forager's hut by RNG from turn one, which the notes already call overwhelming. The minigame could **become their source** and fix that rather than adding to it.
- **`nightshade` and `witchs_cap`** are alchemy ingredients with no source anywhere. Belladonna and fly agaric would give them one.
