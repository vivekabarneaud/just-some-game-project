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

### ⏳ Morel
Has *Morel Cream*. Carries the never-raw rule already. Decoy: false morel *(unpainted)*.

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
