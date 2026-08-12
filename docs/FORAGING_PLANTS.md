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

### ✅ Field mushroom
- **Is:** *Agaricus campestris*, the *rosé des prés* — clean white cap, gills pink turning brown. The common one, and genuinely good.
- **Season / terrain:** spring through autumn · litter, grass
- **Kitchen: NOTHING, deliberately** — and this is structural, not neglect. Specific dishes out-rank generic ones, so if *every* mushroom had a signature then `any(mushroom)` would never fire and *Mushroom Pottage*, *Forager's Pot* and *Fire-Charred Mushrooms* would become dead content. **The generic dishes need at least one mushroom with nothing of its own**, and the common one is exactly right to be it. The generic dish IS its dish. It also teaches the pattern from the other side: the ordinary mushroom gives the ordinary dish, and a chanterelle instead gives something with a name.
- **Its real identity is its twin.** The most ordinary mushroom in the wood has the deadliest lookalike there is, which is a better use of it than any dish.

### ⏳ Death cap — the decoy
- **Is:** *Amanita phalloides*. Kills more people than every other mushroom combined, and does it by looking unremarkable.
- **Tells that work on a standing sprite:** a faint **olive-green wash** on the cap where the field mushroom is clean white, and a **volva** — a pale cup at the foot, like an egg it climbed out of. (The textbook tell, permanently white gills against pink-to-brown, is underneath, so it'd only be available on a tipped variant.)
- **Yields nothing. Ever.** The one plant in the game with no use whatsoever, which is more frightening than giving it a recipe.
- **Edda should not be wry here:**
  > A death cap. There is no worse thing in the wood, and it looks like nothing at all. Mark it: the good one is clean white with pink gills, this one has a green cast and sits in a little cup at the foot, like an egg it climbed out of.

- **💭 If it ever needs a poison,** the thing it has that no other does is that amatoxins are **slow and deceptive** — nothing at the time, a brief illness later, a false recovery, then the real damage days on. That is a genuine mechanical niche: a **delayed** poison, where every other one acts now, and the assassin's tool by definition since you are long gone before it works. But it only earns its place if a poisoning *plot* ever exists — a target you cannot fight, a cup you get near once. Until then, no use at all is the stronger choice.

### ✅ Ramsons
- **Is:** *Allium ursinum*, wild garlic, *ail des ours* — broad leaves each on its own stalk, white star flowers, and it reeks of garlic. Carpets damp woodland floors.
- **Season / terrain:** spring only · litter, wood
- **Decoy:** lily of the valley ✅ *(painted, 3 shapes each)* — the deadliest pair in the game, and the reason is that they share this exact habitat.
- **Also foraged passively by the hut**, not only in the minigame, so it's the most abundant thing on this list. Which is partly why it has so many dishes already.
- **Kitchen — it is the AMPLIFIER, not a star.** Already in seven dishes (Bolete Fry, Green Omelet, Ramsons Broth, Goat and Garlic, Pike in Broth, Green Board, Spring Omelet) and the only non-spice in the game carrying `amplify`. Its identity is *lifting whatever it touches* — the same shape as the field mushroom's, where a plant is defined by what it does to everything else. **No new signature needed**; adding one would make it a star instead of a lifter.
- **But one dish it genuinely wants:**

  **Fish in Green Sauce** · `any(fish, boil)` + `one(ramsons, chop)` + `one(nuts, chop)` · *camp* · NEW
  A pounded green sauce is genuinely period and specifically **coastal** — *moretum* is Roman (a poem attributed to Virgil describes pounding garlic, herbs, cheese and oil in a mortar), and *agliata*, garlic pounded with nuts, is documented medieval Genoese. Fish and green sauce is *the* recorded pairing. Taught by a **Meridian**, which is why it arrives from outside rather than being invented here.
  Mechanically it's a **cold** dish — `chop` means no fire in this engine, exactly what a mortar sauce is — and it uses `chop`, which is badly underused (12 uses against boil's 83).
  > Poached fish under a cold green sauce of wild garlic and pounded nuts. The Meridians eat it with everything.

  **Pasta with Green Sauce** · `one(wheat, preserve)` + `one(ramsons, chop)` + `one(nuts, chop)` · LATER
  Needs the Meridians to have taught pasta. See the intermediate rule below — no pasta *item* is required.

- **Alchemy: NOT a wound remedy.** Garlic really is antiseptic, and "keeps a wound from festering" was the obvious brew — but **healing is already cheap** in this game (bandages, several HP potions), so nobody would ever brew a prevention when a cure is to hand. Rejected 2026-08-12.
- **💭 Instead: the charm.** The folk hang ramsons over a door against ill luck. Feeds the **luck** stat, which already exists and raises loot chances for the whole party.

  And the reason it *works* is already in the lore: **intention shapes unwitting magic.** It isn't the garlic — it's that they meant it. Nobody in the settlement understands this. Edda swears by it, is wrong about why, and right about the result — the same joke as the priests calling their own Aether the Radiant One's blessing, told very small.

---

## Two rules that came out of the ramsons

**An intermediate item earns its place only if it does something a technique can't.** The kitchen already treats technique as transformation: *Apple Pie* uses `one(wheat, roast)` to mean **a crust**, with no dough item anywhere. So pasta needs no item either — `one(wheat, preserve)` says it, and finally gives `preserve` a job after sitting unused in the type union since the beginning. Jam *does* qualify, because it's a different food with its own effects rather than fruit-in-a-jar. Green sauce does not, and never kept anyway: it's made fresh in a mortar and eaten that day.

**Merchants can teach RECIPES, not just sell goods.** A dish arriving with a culture is pure content and never power, which is exactly what the traveling-merchant system should be handing out. The Meridians bringing the green sauce and the pasta technique is the first instance.

---

## 💭 The Works — one building where raw things become useful

Came out of asking where flour should come from. The problem: making the player click wheat→flour→bread is tedious after twice, but a pie made of **whole wheat berries** breaks immersion.

**The answer is to put the transformation in a BUILDING, not in the player's hands** — toggled and passive, exactly like the brewery's tick (input per hour, output into a capped store, pausable). One switch, then flour simply accumulates, and dishes ask for flour because that is what a pie is made of.

And it shouldn't be called a mill, because it does more than grind. Historically that's accurate: a watermill site wasn't one machine, it was **power** — the same wheel ground grain, pressed oil, fulled cloth and drove hammers.

| At the works | From | To | Connects to |
| --- | --- | --- | --- |
| grind | any grain | **flour** | pies (see below), bread |
| grind | chestnut | chestnut flour | *only if it gets its own dish — otherwise it's a second name for flour* |
| grind | acorn | acorn flour | *only if famine food becomes a real mechanic* |
| press | linseed, walnut | **oil** | the kitchen has NO fat at all today |
| churn | milk | **butter** | the fat that costs no life |
| scutch | flax | **fiber** | closes a loop: `fiber` currently has no farm source |
| full | wool | cloth | the tailor |
| grind | oak bark | tanbark | leatherworking |

**Yield, not friction.** A measure of grain should give *more* as flour than as porridge — milling doesn't create matter, but flour feeds further than boiled whole grain. So the works is a **multiplier**, never a tax. If it ever reads as a mandatory extra step, it's wrong.

**Consequence:** the six dishes using wheat-as-crust (Apple Pie, Cherry Cobbler, Game Pie, Fish Pie, Eel Pie, Pear Pie) would switch to flour, which gates pies behind the works. Arguably correct — a pie is settlement food, not camp food.

**Flour should be a `food`**, not a material, so the kitchen needs no special case and a settlement with a full flour store isn't starving beside it. The citizens can cook with it themselves.

**The three fats, with distinct identities:**

| Fat | From | Feels like |
| --- | --- | --- |
| **Butter** | churned milk | everyday, gentle, costs nothing but time |
| **Lard** | a culled pig | plentiful, and you paid for it |
| **Olive oil** | Meridian ships | southern, fine, expensive |

Regionally honest, too: in the Mediterranean south butter was scarce and oil was the fat, while butter belonged to the north. Butter being a little precious and olive oil arriving by ship is right for this country.

*Not sunflower or rapeseed. Sunflower is New World (16th century, and not pressed for oil until 19th-century Russia); rapeseed was grown medievally but for **lamp** oil, being bitter until modern breeding.*

### ✅ Blackberry
- **Is:** *Rubus fruticosus*, the bramble. Painted into the scene ✅, fruit hanging at violet anchors on the mask. The only forage that fights back.
- **Season / terrain:** the bush is there all year (it passes the winter test); the **fruit** is late summer into autumn.
- **Kitchen: NOTHING NEW, and it is already the best-served wild plant in the game.** *Venison in Berries* names it specifically. *Blackberry Crumble* is **Ashwick's rank-4 loyalty recipe**, so an adventurer already teaches it. It feeds four generic berry dishes (Pottage, Wildberry Porridge, Fool, Fisher's Berry Broth), the hut forages it passively, and a mission hands over twelve. The most abundant berry being the only one with its name in a dish is exactly right.
- **Tavern: BRAMBLE WINE.** Its one unclaimed slot, and it splits cleanly from the sloe: sloe becomes a **spirit** (sharp, strong, slow, a winter treat), bramble becomes a **wine** (soft, everyday, autumn, the thing actually poured by the cup). Blackberry is *the* country wine fruit, the one every hedgerow made. Also gives an autumn glut somewhere to go.
- **Alchemy: rejected.** Bramble leaf is genuinely astringent, the old gargle and flux remedy — but `ease_gut` is wildmint's entire reason to exist and `cure_bleed` is yarrow's. A second weaker copy of each blurs three plants instead of sharpening one.

#### The Shepherd's share — the game's first self-decoy

The English folk law is that you don't pick blackberries after Michaelmas, because the Devil spat on them. It is one of the best-attested scraps of country belief there is, and it is also simply true: late blackberries go grey, soft and fly-blown as the damp comes.

**The mechanic, which is better than a date rule:** the same bush bears different fruit. Glossy and dark in summer, dull grey-brown and spoiled in autumn. Still there, still pickable, worth nothing.

That makes it **the only decoy in the game that is its own lookalike.** Every other pair is two species standing side by side, solvable by comparison. This one is a single species separated by a calendar, so the tell cannot be checked against the thing next to it, only against the memory of what a good one looked like two seasons ago. Which is the real lesson of foraging: *when* matters as much as *what*.

It costs nothing but a slot in the basket, per the rule already set for the false chanterelle. Some mistakes should just be disappointing.

**No devil, though.** The Hearthlands reframed Netheron as the devil who rebelled against the Radiant One, and believe him dead. That is the better culprit anyway, because decay genuinely *is* his leaked function — his corpse rots into the earth with no mind left to shepherd it. The folk are wrong about the reason and right about the fact, the same joke as the ramsons charm.

**And it lands on Edda's fault line.** Nordveld reveres Netheron `[LOCKED]`: death is sacred, the Shepherd is owed reverence not blame — and this is precisely what the Church calls devil-worship. Edda's canon practice is *"small offerings, quiet rituals, names of plants in the old tongue."* So two people say nearly the same words over the same spoiled fruit and mean opposite things:

> **The common version, a curse:** Netheron's share. Let the dead god have them.

> **Edda's version, an offering, and she will not explain it:** Leave the last of them. They are the Shepherd's.

She is not dismissing the fruit, she is leaving it deliberately — which is also the old rule that you never strip a hedge bare. Her Nordveld crumb passes as the settlement's curse. Deniable, which is the point, given what the Inquisition does with Nordveld practice.

**The player finds out through Nell**, who reports what she sees without understanding it:
> Edda would not let me pick the grey ones. She said to leave the last of them, they are the Shepherd's. Then she put one back on the cane, which I did not understand, because it was already spoiled.

Putting one *back* is the tell. Nell misses it. The player may too. A seed for the chapter-3 faith arc, planted in chapter 1, in a hedge.

*Grace note:* blackberry in Norwegian is **bjørnebær**, bear-berry. Ramsons is bear's garlic in the same wood. Edda naming both after the bear in the old tongue costs nothing and makes her sound like she learned this wood from someone else.

**Not ink.** Spoiled blackberries really do make dye and ink, and the Lord keeps a journal, so it is tempting. But the moment late brambles yield anything they stop being a mistake and become a second harvest, and the lesson dies. **Oak gall** is the historically correct ink anyway, and the old oakwood is already location 5.

**Build note:** the anchor daub stays one colour, one blackberry spot. The season decides what grows there. The painted mask needs no changes.

**💭 The thorns, still open.** The ingredient note already reads *"paid for in scratched arms."* Leaning towards flavour only — a line in the day's report, not a cost — because a real HP nick would turn the cosiest plant into the one you avoid. But the bramble is the only thing on this list that could justify one.

### ⏳ Bilberry
Kitchen, plus the most gameable alchemy on the list: bilberry is famously an **eyesight** remedy. In a game about searching a painting for half-hidden things, that could do something rather lovely. Painted-in mats.

### ⏳ Hazelnut
Kitchen only, fat and keeping. Infrastructure rather than a star — but it would finally give the generic `nuts` a real source.

## Fungi on standing wood
*Anchored plants, using the yellow `#FFE800` daub on painted trunks and stumps. Most fruit in **winter**, which is the season with almost nothing in it — so this whole group earns its place twice.*

### ✅ Oyster mushroom
- **Is:** *Pleurotus ostreatus*, the *pleurote en huître* — grey fan-shaped shelves on dead beech and poplar, gills running down. Fruits **through the cold**, which few do.
- **Kitchen:**

  **Winter Pottage** · `one(chestnut, boil)` + `one(oyster_mushroom, boil)` · *camp* · NEW
  Both halves are the same idea: chestnuts gathered in autumn and kept, oyster mushrooms still growing in the frost. The winter-provision fantasy on a plate, and an answer to the standing question of what a settlement eats in January. Camp tier deliberately — winter is when you are poorest, and needing a town oven to eat your own stores would be backwards. Chestnut is the starch, so it wants no grain.
  > Chestnuts and oyster mushrooms boiled down thick. The pot that gets a settlement through January.

  *Depends on chestnut existing (location 4). Roasted chestnuts are the more iconic image and could be a Town dish later, but the pottage is what people actually lived on.*

### ⏳ Judas ear
*Auricularia auricula-judae*, the *oreille de Judas* — brown, gelatinous, genuinely ear-shaped, and it grows on **elder**, which is already on the list. So the elder planted for berries also gives something in January. Winter. Strange enough to be memorable.

### ⏳ Chicken of the woods
*Laetiporus*, the *polypore soufré* — great slabs of sulphur-orange bracket on oak. Summer, unmistakable, delicious young. Pure visual value; nothing else in the wood looks like it.

### ⏳ Tinder fungus *(not food)*
*Fomes fomentarius*, **amadou** — hoof-shaped brackets on birch and beech, and it is **how you carry fire**. Ötzi had some in his pouch. A genuinely different kind of forage: not supper, but the means to make supper anywhere. Worth having precisely because it isn't a meal.

### ⏳ Sulphur tuft — a decoy
*Hypholoma fasciculare*, the *hypholome en touffe* — dense clusters on stumps, much like honey fungus, bitter and mildly toxic. Same shelf, same wood, wrong mushroom.

---

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
| **Spoiled blackberry** | **Nothing, and it isn't a species.** The same bush, two seasons on. The only decoy you can't solve by comparison, because its good half isn't on screen. See *The Shepherd's share*. |

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
- **The tavern has two drinks waiting** and no system yet: bramble wine (soft, autumn, everyday) and sloe spirit (sharp, winter, a treat). Both are foraged, both keep, and neither is a dish. Worth remembering when `DESIGN_TAVERN` is picked back up.
- **A plant can hold a story beat.** The Shepherd's share puts a chapter-3 faith seed in a chapter-1 hedge, at no cost and with no gate. If other plants can carry a beat that quietly, they should.
