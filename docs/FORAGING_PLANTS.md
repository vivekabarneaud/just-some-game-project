# Foraging — Plant Catalogue

- **Status:** living working sheet, filled in plant by plant. Started 2026-08-12.
- **Companions:** `DESIGN_FORAGING_MINIGAME.md` (why the minigame exists, how it works) · `FORAGING_PROMPTS.md` (the art backlog).
- **How to use:** work down a location, decide one plant at a time, write it up here. `✅` means settled and ready to build; `⏳` means it still wants a conversation.

---

## The rules we're working to

**One IDEA each, not one slot.** *(Amended after the bilberry, 2026-08-12.)* A plant earns a signature **dish**, *or* a **tavern drink**, *or* an **alchemy use**, *or* it's a **decoy** — and usually one is plenty, because the delicious plants and the medicinal ones are mostly different plants. But a plant may carry the *same* idea into several places: bilberry means *you see further*, and it means that in the pantry, the pack and the workshop alike. What the rule exists to stop is a plant collecting four unrelated jobs because each sounded good on its own. Forcing a potion out of a chanterelle is exactly the clutter this catalogue exists to prevent.

**In the woods the scarce thing is your attention, not the wood.** The basket caps you, so nothing that adds *more* plants to the ground changes anything. Any effect that would help you forage can therefore only work by making identification easier — which is the one thing nothing may ever do, because identification is the whole game. So foraging boons must pay out **somewhere else**.

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
- **Season / terrain:** autumn only · wood. **The rarest draw in the game** (weight 3), so roughly a quarter of autumns hold none at all, most hold one to three, and once in a long while you walk into nine.
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
- **✅ Instead: the charm — and it's a TRINKET, not a fixture.** *(Settled 2026-08-12.)* Wearing garlic against ill luck is as well attested as hanging it over a door, and the worn version is better on every axis.

  **Edda's Charm** · `slot: "trinket"` · common · `raw: { luck: 1 }`
  > A bundle of wild garlic bound with red thread, small enough to hang inside a shirt. Edda makes them in spring and gives them to anyone who is leaving. She will not say what it is for.

  **Zero new systems.** The `trinket` slot exists and is nearly empty (two items, both rare), so a common early one fills a real gap instead of competing. A settlement fixture would have needed a building-buff path that doesn't exist.

  **+1 against the signet's +5 is the right size.** It becomes strictly worse gear eventually, and that is the point: it's the starter thing you keep wearing past the moment it made sense.

  **Given, never crafted.** No recipe, no purchase, no farming. Edda makes them in spring and hands them to whoever is leaving. This is the lore rule stated as a mechanic: a bundle of garlic you assemble yourself is a bundle of garlic; one she pressed into your hand at the gate because she was worried about you is the charm. It also answers *why not equip twenty* without a rule.

  **It coexists with the bilberry tart, deliberately.** Not two ways to buy the same number: the tart is **packed** (a consumable chosen for one mission, taking a food slot that could have held healing), the charm is **worn** (a slot given up for a whole expedition, and someone chose to). `luck` is already built to stack from several directions — the existing test asserts three signets summing to +15 — so gear, food and gift is a better spread than one source doing all the work.

  **Spring keeps the beat.** Ramsons is spring-only, so she makes a few each year. A recurring settlement moment that isn't a harvest.

  She's 71, she's a midwife, she's Nordveld-blooded, and this is what she does instead of saying goodbye.

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

⚠ **Edda's line above is PRIVATE.** She says it to Nell, or when she believes she is alone. Never in the hall. *The Shepherd* is Netheron's epithet and the Lord is a former schoolmaster: he would place it the first time he heard it, and her cover would be gone in a sentence.

#### The cast memory — picking the first spoiled blackberry

**Nell knows.** Edda is teaching her, deliberately (see the Edda/Nell/Corin thread). So Nell doesn't report this in confusion — she corrects the Lord, with the total confidence of a child who has the procedure exactly and the reason not at all. Which is how folk practice actually travels.

It has to stay **fully deniable**: no name, no old tongue, nothing an educated man can decode. He can write down every word and learn nothing.

> **"Oh. You've taken the grey ones."**
>
> She looked at the basket, then at me, and waited, so I asked what it was that I had done.
>
> **⬚ PLACEHOLDER — THE GESTURE.** *Nell shows him what you do with a spoiled berry instead of basketing it, and it should read as ritual rather than chore.*
>
> I asked her why. She said she didn't know, in the tone of a child who has never been given a reason and has never once needed one. Then she stood there until I had done it.
>
> So I [did it], and felt foolish, and it cost me nothing. It is a good thing for a child to have a grandmother in this world.

**What the placeholder has to satisfy:**
- **Deniable.** A schoolmaster watching sees ordinary country superstition and nothing else.
- **Arbitrary.** A habit is *"she puts one back"*; a rite has conditions nobody can justify. Precision is what separates them.
- **Small enough that a child does it exactly, every time**, which is the whole reason it survived Ashwick.
- **It should rhyme with Edda's other practice** (the thumb pressed into the soil, *gronmoder*) without simply repeating it.
- **It should mean *this is not ours*.** That is the content: you never take the last of anything.

**Tried and rejected:**
| Gesture | Why not |
| --- | --- |
| Put one back on the cane | Reads as a quirk. No weight, nothing ritual about it. |
| Press it into the ground with the thumb | Theologically perfect (Netheron shepherds what dies back into the soil) but it **reads as planting**. Too innocent. The picture says gardening. |
| Recite two arbitrary conditions ("not the one you picked first, and don't look at it after") | Arbitrary for its own sake. Sounds invented, because it was. |

**Keep these when the gesture lands:**
- **She makes him do it.** A child supervising an adult's compliance shows she takes it seriously with no theology spoken aloud, and it puts the Lord in the position of performing a rite to Netheron out of pure affection for a little girl.
- Which is not only irony. The locked rule is that **intention shapes unwitting magic**, and his intention is kindness. So it might actually count. The joke told a fourth time, and this time the player is in on it and the Lord never will be.
- *"and felt foolish, and it cost me nothing"* — the Lord being warm and missing everything.

**💭 Optional extra turn**, once the gesture exists:
> She said something under her breath while she did it. I did not catch it, and did not think to ask.

Tells the player there *was* a word without telling them the word, and his failure to ask is entirely in character. Leaves that word free to surface later, when it can cost something.

*Grace note:* blackberry in Norwegian is **bjørnebær**, bear-berry. Ramsons is bear's garlic in the same wood. Edda naming both after the bear in the old tongue costs nothing and makes her sound like she learned this wood from someone else.

**Not ink.** Spoiled blackberries really do make dye and ink, and the Lord keeps a journal, so it is tempting. But the moment late brambles yield anything they stop being a mistake and become a second harvest, and the lesson dies. **Oak gall** is the historically correct ink anyway, and the old oakwood is already location 5.

**Build note:** the anchor daub stays one colour, one blackberry spot. The season decides what grows there. The painted mask needs no changes.

**💭 The thorns, still open.** The ingredient note already reads *"paid for in scratched arms."* Leaning towards flavour only — a line in the day's report, not a cost — because a real HP nick would turn the cosiest plant into the one you avoid. But the bramble is the only thing on this list that could justify one.

### ✅ Bilberry
- **Is:** *Vaccinium myrtillus*, the wild European whortleberry. Low mats, painted into the scene, fruit at anchors. The picking is slow and you stoop for it.
- **Season / terrain:** high summer · litter, wood. Acid ground under trees.
- **Rename it.** The game currently calls it `blueberry`, but the American cultivated blueberry has **pale flesh and does not stain**. The wild European one is purple all the way through, which is why the folk medicine attached to it and why the tart comes out dark. The existing ingredient note already reads *"blue to the fingers"*, so it is describing a bilberry under the wrong name. Alpha, no save preservation, so the rename is cheap.
- **Its idea is: you see further.** All three uses below are that same idea in three places, which is what the amended rule allows.

#### Kitchen — Bilberry Tart

`one(bilberry, roast)` + `one(wheat, roast)` + `one(honey, boil)` · *village* · NEW
Same shape as Apple Pie and Cherry Cobbler, so it needs no new pattern.
> Wild bilberries baked dark under a honeyed crust. Purple to the fingers, and worth the stooping.

**It carries `raw: { luck: 3 }`, and that works today with no engine change.** Better eyesight, more found — and `luck` is the *live* path: `raw.luck` → `luckLootMultiplier()` → party-summed loot chance at +1% a point, already tested, already used by the Stranger's Signet. *(Note for whoever builds it: `lootMod` is the field that looks right and is dead. It is declared on 44 items and read by nothing, and `items/types.ts` says so outright.)*

Sized well under the signet, which is +5 and unique-equip, a thing you hunted for. The tart is +2 or +3, gone when eaten, and occupies a food slot that could have held healing. A nice thing to bake before a dig, never a reason to run back to the kitchen.

#### Kitchen — Bilberry Soup, and it comes from a Nordveld adventurer

*Blåbärssoppa* is drunk hot at the checkpoint so you can keep going; it is still handed out at the Vasaloppet. The game already has the hook — **Ashwick teaches Blackberry Crumble at rank 4** — so a **Nordveld recruit teaching this at rank 3** costs nothing to build and gives the north a kitchen of its own. Nordveld is 15 to 20% of human recruits, so it will actually come up.
> Bilberries simmered thin and drunk hot. The northerners swear it carries you the last mile.

**What it does: it is the cold-mission food** the parked mission-climate design is waiting for (hot soup against a northern march, which is what the real thing is for). If climate never lands, `durationMod` is the fallback, and that one *is* read by the engine.

This is the second instance of **recipes as content** after the Meridian green sauce — but taught by a *culture through a person* rather than bought from a merchant, which is better still.

#### Alchemy — the Sharp-Eye draught: a lens, not a multiplier

The obvious version (+20% yield for a few hours) is the wrong shape. It quietly becomes an obligation: once it exists an attentive player keeps it up, and a player who forgets feels they played badly. It also gives you nothing to look at, since all that happened is a number was bigger for a while.

So the draught doesn't make workers work harder. **It makes them notice.** One idea, three buildings, reading the same in all of them: *they saw something.*

| Given to | Not this | This |
| --- | --- | --- |
| **Forager's hut** | more herbs | the return contains something **off its usual table** — a herb they don't normally bring, a seed, something unseen |
| **Hunting camp** | more meat | a **sighting**: tracks, a bee-tree, Old Honeypaw. Feeds straight into `forceMission`, which is already built, and into the parked seasonal-gathers arcs |
| **The mines** | +% ore | a **seam**. Parked until gems and Orison shards exist, but the shape is decided so it needn't be re-argued later |

**No duration. One brew, one return, one extra find.** No timer, no uptime to maintain, nothing to feel bad about missing, and no buff state on buildings to build or persist. You brew it, you hand it over, the next thing they bring back has something in it. A small ceremony rather than a rotation.

**Bonus:** the open threads already complain that herbs rain from the forager's hut by RNG from turn one, which the notes call overwhelming. If the **rare** things moved behind the draught, the baseline could get quieter and finding a specialty herb would start to mean something. One change fixes an existing problem and creates a new pleasure.

**Cost, honestly:** alchemy today makes potions for adventurers, so *give a brew to a building* is a new path. Small, but new — and it opens a whole category, which is either the good news or the reason to be careful.

- **On sharing `luck` with the ramsons charm:** they coexist. One is packed and one is kept, and the stat is built to stack. See the ramsons entry.
- **💭 A decoy is available if ever wanted:** alder buckthorn. Same damp acid woodland, black berries, violently purgative, and its charcoal made gunpowder. But bilberry is painted-in, so a decoy needs its own anchor colour and its own art. Optional, and not a priority.

### ✅ Hazelnut — the larder plant
- **Is:** *Corylus avellana*, the *noisetier*, cobnut or filbert. A multi-stemmed shrub; the nuts ripen September into October.
- **Season / terrain:** autumn · litter, wood
- **Gathered off the GROUND, not the bush.** Hazel passes the winter test, so by the rules it should be painted in with nuts at anchors — but nuts hang high and at eye height you are looking at your feet, so what you actually gather is what has **fallen**. Fallen hazelnuts as ordinary sprites on litter is truer to the act *and* cheaper: no anchor colour, no mask work. The bush can be in the painting without being the source.
- **No signature dish, and not as a consolation.** `nuts` already appear in five named dishes plus the green sauce, which makes them the best-connected generic ingredient in the kitchen. Adding a hazelnut dish would make the plant *less* useful, by exactly the logic that keeps the field mushroom dishless.
- **Its identity is that it KEEPS.** Nuts store for months in the shell with no salt, no smoke and no technique at all, which is precisely why they mattered. Hazel isn't infrastructure, it's the larder: the thing you don't eat when you find it.

#### The winter lie this fixes

The forager's hut runs a seasonal primary — spring greens, summer berries, autumn mushrooms, **winter nuts** (`gameState.tsx` ~2219, mirrored in `Buildings.tsx`'s `FORAGER_FOOD`). Winter is also the only season with **no extras at all**.

Hazelnuts fall in September and October. By January they are gone, or the squirrels have them. Nobody gathers nuts in deep winter. The game does it because winter needs *something* and the wood is bare by design, so nuts were drafted as filler.

**But the catalogue already answers this in the drying section: winter is not for gathering, it is for eating what you kept.** So:

| | Now | Instead |
| --- | --- | --- |
| **What the hut FINDS in winter** | nuts (false) | **oyster mushroom** primary, with **judas ear** and **velvet shank** as extras. All three genuinely fruit in the cold. Winter stops being the one season with a single item and nothing beside it. |
| **What the settlement EATS in winter** | the same nuts | nuts and chestnuts **from the autumn store**. So the autumn nut extra should get *bigger*, not disappear — it sits at 15% today. |

Push autumn up and winter thin, and **the yield curve alone teaches "stock up in autumn"**: no new system, no UI, no warning. The lesson arrives as a number.

**The winter START keeps its own fix, though.** Nuts-in-winter is currently solving two problems at once, and the second one is that a game begun in winter has no buffer. That is a *start* problem and deserves a start answer — a larger opening larder for winter starts, which already has a story since they arrived carrying what they had. It sits beside the existing first-year grace. **Do not distort the ecology permanently to patch the first hour of one playthrough.**

#### The `nut` group

Same pattern as `berry`, so no new machinery:

```ts
nut: ["hazelnut", "walnut", "chestnut"]
```

`nuts` is renamed to **`hazelnut`**, and the five dishes using `one("nuts", …)` become `any(FOOD_GROUPS.nut, …)`. Identical in shape to the Phase B meat and fish split.

**But chestnut is not a nut like the others.** Roughly 45% starch and low in fat, which makes it *bread* rather than fat, where hazel and walnut are fat. That is exactly why it was *l'arbre à pain* and fed whole mountain populations, and it's already why Winter Pottage notes "chestnut is the starch, so it wants no grain". So chestnut sits in the group for generic dishes, does the grain's job in specific ones, and grinds to chestnut flour at the works. In the family without being interchangeable.

**Dependency:** neither chestnut nor walnut exists as an ingredient yet, so the group is gated behind location 4 or some other source. Until then the rename to `hazelnut` stands alone and adds nothing, which is fine but worth knowing before starting.

**Walnut earns its separate place** in the grove by doing things hazel can't: oil at the works, and brown dye for tailoring.

## Fungi on standing wood
*Anchored plants, using the yellow `#FFE800` daub on painted trunks and stumps. Most fruit in **winter**, which is the season with almost nothing in it — so this whole group earns its place twice.*

### ✅ Oyster mushroom
- **Is:** *Pleurotus ostreatus*, the *pleurote en huître* — grey fan-shaped shelves on dead beech and poplar, gills running down. Fruits **through the cold**, which few do.
- **Kitchen:**

  **Winter Pottage** · `one(chestnut, boil)` + `one(oyster_mushroom, boil)` · *camp* · NEW
  Both halves are the same idea: chestnuts gathered in autumn and kept, oyster mushrooms still growing in the frost. The winter-provision fantasy on a plate, and an answer to the standing question of what a settlement eats in January. Camp tier deliberately — winter is when you are poorest, and needing a town oven to eat your own stores would be backwards. Chestnut is the starch, so it wants no grain.
  > Chestnuts and oyster mushrooms boiled down thick. The pot that gets a settlement through January.

  *Depends on chestnut existing (location 4). Roasted chestnuts are the more iconic image and could be a Town dish later, but the pottage is what people actually lived on.*

  **Chestnut's techniques, settled 2026-08-12: `boil` and `skewer`, both camp.** Boiling was the everyday preparation, in water or in milk and then mashed, and skewer covers cooking it over the fire without needing a town oven — which matters, because winter is exactly when you are poorest. `roast` stays available for the grander town version. One detail worth keeping: a chestnut must be **pierced** or it bursts in the fire, which is the most skewer-ish fact about any ingredient in the game. *(Chestnuts boiled in milk is a real dish in its own right and worth a look later.)*

### ✅ Velvet shank — and winter finally gets a test
*(Built 2026-08-13: all four wood fungi are in `plants.ts`, sharing the `wood_fungus` daub. Winter capacity 26, sitting at roughly velvet shank 7, oyster 6, judas ear 4, rosehip 4, funeral bell 4. Art still to come.)*

- **Is:** *Flammulina velutipes*, the *collybie à pied velouté* — and the same species as cultivated enokitake, though nothing about the wild one looks like the supermarket bundle. Tawny-orange caps in tight clusters on dead hardwood, on a stem that darkens to near-black and velvety toward the base. Fruits **in frost**, when almost nothing does, and survives being frozen solid.
- **Season / terrain:** winter · anchored on standing wood (the yellow `#FFE800` daub)
- **Decoy: *Galerina marginata*, the funeral bell.** Same dead wood, same cold weeks, same size, same brown-orange cap. It carries **the same amatoxins as the death cap**, and it has killed people who were confident they had velvet shank.
- **Both tells work on a standing mushroom**, which is what the art rule demands: Galerina wears a **ring** on the stem and velvet shank never has one, and velvet shank's stem is **dark velvet at the base** where Galerina's stays pale and dry.
- **Why this is worth more than a mushroom.** Winter is the only season in the game with no identification test at all. Adding one means the season you most need food is the season getting it wrong kills you, which is both true to life and the best thing winter could be. It also gives the standing-wood group its pair, so the yellow daub starts earning real gameplay instead of decoration.
- **Kitchen identity: still open.** It is genuinely good, so a dish is available if wanted. The pair may well be enough on its own.
- **Art:** paint both or neither, per the pair rule. This one is unusually paintable — orange against snow and black wood is a gift.

### ⏳ Galerina — the funeral bell
Velvet shank's decoy, above. **Yields nothing, ever**, like the death cap. Two amatoxin mushrooms is not redundancy: the death cap catches you in a summer meadow reaching for a field mushroom, this one catches you on a trunk in January reaching for supper. Same poison, opposite circumstances, and the winter one is worse because you are hungrier.

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

### ✅ Fly agaric — already designed, it just had no source

- **Is:** *Amanita muscaria*. Scarlet cap flecked white, a ring, a bulbous foot. The most recognisable mushroom on earth.
- **Season / terrain:** autumn · litter, wood. Under birch and pine, which is where it belongs.
- **Never food. Ever.**

**It IS `witchs_cap`, which was already in the alchemy data all along** — and renamed to `fly_agaric` on 2026-08-12, since nothing else in the game hides behind an invented name:

```ts
fly_agaric — wildcard, rare, signature "boil"
  boil → int +3
  char → confuse 25
```

That is the real pharmacology, already written: psychoactive when boiled, confusing when charred. Its own note said *"a lot of power, a little unruly."* **So the plant needed no design at all. It needed to exist in the woods.** The rename was free: it appeared in exactly two files and no save data, because it had no source to be gathered from.

#### Its job is that it's FAMOUS

It's the one plant here that **cannot be a decoy**, because nobody in history has confused a scarlet cap with white spots for supper. Which turns out to be its value: every player already knows this mushroom before the game starts. Put one in the first scene and the game has said *things here can hurt you* in a single image, with no tutorial and no tell to learn. It teaches the **rule** rather than a fact.

#### `confuse` should make an enemy hit its own side

The channel is declared and does nothing — `setup.ts` files the offensive channels under *"later slice — coatings + throwables"*, the same dead-knob shape as `lootMod`. When it lands, random targeting is the right reading of it: skip-a-turn is a stun with extra words, reduced accuracy is invisible, and only *hits whatever is nearest* is legible in the combat log and funny. In 1D positional combat it is nearly free and genuinely positional, since a confused enemy in the front rank mauls its own front rank while one at the back savages its own archers. **Where it stands decides what the chaos costs them.**

Two guards:
- **A chance per turn, not a duration.** Half the time, say. A guaranteed multi-turn confusion is a stun-lock, and stun-locks are how a mild-effects game grows a mandatory opener.
- **Lean on `resist_confuse`**, which already exists as a school and is already special-cased in `setup.ts`. Bosses and the undead shrug it off, and nothing without a mind can be confused at all — a rule players work out for themselves and enjoy working out.

#### The `int` draught should be the unreliable one

`wildcard` is a role in the ingredient schema and currently means nothing mechanically. Fly agaric is where it could start meaning something: real power, delivered unpredictably. It also keeps a genuinely dangerous mushroom from reading as a free stat stick, and it differs from the parked false morel draught, which is *burn hot now and pay tomorrow* rather than *strong but you never know how strong*.

#### Lore

The only plant on this list that is **psychoactive rather than merely poisonous**, which is a different category from everything else here, and the lore has firm opinions about people seeing past the boundary. That belongs to the Nordveld *völva* tradition in general, **not to Edda**, who is a sad grandma and not a shroom-shaman.

#### 💭 The puffball, banked

A young *Amanita* still in its "egg" looks exactly like a **puffball**, and that confusion genuinely kills people. But the tell is that you slice it open and find a mushroom folded up inside, which breaks the standing-sprite rule and would need a *cut it open* interaction. It also arrives with the parked *vesse-de-loup* smoke bomb, so if puffballs ever come, this comes too. See the carrier idea in that memory: puffball as a **delivery**, turning any brew into an area effect.

---

## The green floor — pickable, and mostly worthless on purpose

### The rule this comes from

**Everything green in the frame must be pickable.** Not because it's generous, but because **un-pickable scenery is a tell.** If only the meaningful things answer the cursor, the player never has to identify anything — they hunt for interactive objects instead, and the whole game collapses. Every piece of inert decoration is quietly announcing *not this one*. So the only thing that should ever stop you picking something is knowing better.

**And the first pick of anything fills a page in the herbier.** So a useless plant is never a wasted slot, it's *of no use, but now I know*. You pay once, ever, and you get a page for it. After that, knowledge is what stops you — which is the cozy-discovery register rather than the punishment one.

*The five marked ⭐ are the starting set: two carpets, one useful, one nasty, one joke.*

### ⭐ Dog's mercury
*Mercurialis perennis.* Carpets shaded woodland in dull matte green, plain paired leaves on unbranched stems. Mildly poisonous, no use whatsoever — **and it is the classic indicator of ancient woodland**, so it says something true about where you are standing while doing nothing at all for you. The perfect worthless plant.

### ⭐ Wood anemone
*Anemone nemorosa.* The white spring carpet, nodding on thread-thin stalks above finely cut leaves. Faintly toxic, useless, and the visual signature of an April woodland floor. Another ancient-woodland plant, and the one that makes a spring scene *look* like spring.

### ⭐ Ground ivy, called **alehoof**
*Glechoma hederacea.* A creeping mat of small scalloped round leaves with tiny violet hooded flowers. **It flavoured ale before hops did**, which is not folklore, it is what the name means. You have a brewery. A woodland weed that quietly ties to it is close to free content.

### ⭐ Cuckoo pint, lords-and-ladies
*Arum maculatum.* **Two different-looking plants across the year:** glossy arrow-shaped leaves, some blotched purple-black, in spring — then in autumn a bare pale spike topped with dense scarlet berries and no leaves at all. Burns the mouth savagely; children are poisoned by the berries every year because they look like sweets. Very common, very nasty, no use. *(Its root really was used for laundry starch, which is a fine flavour note and not worth a mechanic.)*

### ⭐ Enchanter's nightshade
*Circaea lutetiana.* A thin wiry thing with a sparse spike of tiny white flowers, in deep shade. **Completely harmless and completely useless**, despite having the most alarming name in the wood. In a world with an Inquisition and a Doctrine of Silence that is a good joke, and it teaches the lesson the game most wants taught: **the name is not the tell.**

### Wood sorrel
*Oxalis acetosella.* Clover-like leaves of three folded heart-shaped leaflets, one white flower veined lilac. Genuinely edible and sharply lemony — the *woodland* sorrel, distinct from the common sorrel slated for the grassy clearing. A small safe reward for looking down.

### Woodruff
*Galium odoratum.* Narrow leaves in neat star-shaped whorls up a square stem. Smells of nothing at all fresh and strongly of new hay once dried, which is a real and slightly magical fact. A strewing herb, and it flavoured drink.

### Bracken
*Pteridium aquilinum.* Coarse triangular fronds, everywhere, and one of the few plants here whose real use points **away** from the pot: bedding and thatch. Carcinogenic, so never food. Good bulk for filling a scene.

### Keeping it affordable
Worthless plants want **one art variant, not three** — nobody memorises them for advantage, so variety buys nothing. Carpet plants can be drawn as small clumps that read fine at a glance, because nothing depends on reading them closely. The expensive art belongs to the pairs.

---

# 2 · The clearing and wood edge

⏳ Dandelion · Sorrel · Wild carrot *(+ hemlock)* · Parasol *(+ deadly dapperling)* · Elder *(+ danewort, its poisonous twin)* · Wild rose (rosehip) · Raspberry · Hawthorn *(haws + a real heart remedy)* · Crabapple *(verjuice, jelly)*

### 💭 Nettle — the hungry gap *(idea, to discuss properly later)*

*Written up 2026-08-12 as something to come back to, not as a settled plant.*

- **Is:** *Urtica dioica*. Already exists in the game as a `toxin`-role alchemy herb (`boil`), used in four recipes.
- **Where it grows:** disturbed, nitrogen-rich ground. Field edges, paths, middens. Not deep wood.

**Its idea is the hungry gap.** That's the real name for March into May: winter stores exhausted, nothing harvested yet. Historically the hungriest weeks of the year, worse than winter itself, because winter at least has a larder. Nettles are the classic answer — the first abundant green, genuinely nutritious, growing everywhere without being planted.

It answers the question the winter work left open. Autumn fills the store, winter eats what it kept, and then the store runs out. **Nettle arrives precisely when it's needed**, which is a good thing for a plant to mean.

**Kitchen: a nettle pottage.** `boil`, camp, spring. The sting is the counterpart to the bramble's thorns, the other plant that fights back — but where thorns are simply a price, **the sting is defeated by cooking.** Boiling destroys it completely. That's true, and it's exactly the kitchen's grammar of technique-as-transformation. The same fact points both ways: weaponised in alchemy, undone in the pot.

**Refused: fiber.** Nettle cloth is entirely real and was still being made into the twentieth century, but flax already owns `fiber` at the works, and a wild early version means two plants doing one job badly rather than one doing it well.

#### The part worth keeping: nettles grow where people have been

Nettles follow habitation. They mark old settlement for decades, and archaeologists genuinely use them as an indicator — **elder does the same job**, which is why the two together are a signal.

Which raises a real lore objection: **nobody has lived in this valley for a very long time.** The Old Watch is a hundred and fifty years gone and lies south, in the bad country. So there should be almost no nettles here.

That objection makes the idea better:

- **Nettles start scarce, and spread as the settlement establishes.** The beds thicken because *you* have been here. The plant becomes a record of your own presence, growing at the edges of a place that had none before you came.
- **So the first hungry gap has no nettles to save you.** By the second or third spring, there are. **The land starts feeding you back once you have lived on it**, which is a better story than a plant that was simply always there.
- **A nettle bed deep in the wood is a ruin marker.** A stand of nettle and elder together in the middle of nowhere is a house that isn't there any more. Not a decoy pair. A pair that *means* something.
- And a thread worth pulling much later: if nettle and elder mark where people were, that is exactly what would be growing over the Old Watch.

#### ⚠ It needs the herb cleanup first

**Nettle drops from five different enemies**, at 15 to 30%. So it currently rains from combat. Giving it a season, a place and a story means very little while killing wolves is a reliable nettle farm. Not a reason to skip it — it's the sharpest example of why the herb-sourcing cleanup in the open threads matters.

---

## 💭 Twelve days, twelve months — the calendar nobody is using

*(Idea, 2026-08-12. Not to be built yet.)*

A season is **three days**, so a year is **twelve days**, so **a day is a month**. The game already has that number and does nothing with it.

Which means the forager's hut's table could go from four entries to twelve, and the year would gain texture: early spring nettles, mid spring ramsons, late spring the first greens. Early autumn chanterelles, mid autumn cepes, late autumn the nut fall. A player logging in on different days sees a different wood.

**One rule to hold on to when it's built: phase the emphasis, not the availability.** If ramsons only *exists* on one day in twelve, the Spring Omelet becomes nearly impossible, since it wants morels and ramsons and eggs together. So let the season stay broad for what's obtainable, and let the twelve-part calendar decide only what the hut **leads with**. Same texture, no cliff.

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

## Staples and ingredients — why the citizens stop eating your boletes

*Settled 2026-08-12. Game-wide rather than foraging-only, but it surfaced here because it silently breaks everything this catalogue is for. Parked in memory too.*

**The bug.** `consumeFood` deducts **proportionally across every food type**:

```ts
const share = (stock / total) * toConsume;
```

So a king bolete saved for a recipe isn't merely at risk of being eaten. It drains every tick, forever, in fractions, until you are holding 0.87 of a bolete. **Nothing can be hoarded.** That kills cross-season cooking outright (a spring ingredient can never reach an autumn dish) and it would quietly eat everything the minigame ever hands the player.

**The fix: citizens eat STAPLES, not ingredients.** `consumeFood` draws only from a staple set (grain, meat, fish, roots, common berries). The rare foraged things sit untouched. It's also just true: three chanterelles are not dinner for eleven people, they're something set aside for the kitchen.

**And if the staples hit zero, they eat anything.** That's the *open the stores* beat as a single condition rather than a system. You lose what you were saving, and you lose it because people were starving, which is the right reason to lose it.

**What this replaces, and why those failed:**

| Considered | Why not |
| --- | --- |
| A larder / store split, with `preserve` as the verb that moves food between them | Genuinely elegant, and it gave `preserve` its long-missing job — but it's a second inventory with its own UI, save shape and caps. Kept for later, when preservation and trade actually matter. |
| *Who gathered it decides where it goes* — hut yield to the larder, the Lord's basket to inventory | Broke the famine-relief missions. The boar hunt and the honey raid exist **because** there is a famine; routing their food into a personal bag defeats the mission's only purpose. |
| Citizens eat the season's food first | Makes cross-season recipes nearly impossible, which is the kitchen's whole point. Costs more than the immersion it buys. |

**Two things it needs:**
- A data pass marking every food as staple or ingredient. Forty-odd judgement calls, cheap, and worth making anyway.
- **The famine threshold must count staples only.** Otherwise a pile of rare mushrooms masks a starving settlement and the game sits calmly while people die beside a shelf of truffles.

**Topbar: two numbers, not one total.** `🍞 142 · 🍄 18` — the first is what keeps people alive and what starvation and famine warnings read; the second is what the kitchen has to play with. A single total lies, and a staples-only total hides food you genuinely own.

**Deliberate consumption stays allowed.** If the player puts velvet shank on the tavern menu, spending it is the point: that's a decision with a screen and a price attached. The bug was only ever the invisible automatic drain.

**Bonus: the basket needs no special home.** With this in place, the minigame's yield can land in the larder like everything else and simply never be eaten — which deletes the second inventory, the provenance rule and the two-source kitchen question all at once.

*(Found alongside a second issue, parked separately: **food-diversity happiness counts standing BUILDINGS**, not what anyone ate. You are rewarded for owning a fishing hut that has produced nothing, and get nothing for a varied larder or for cooking.)*

## Dreaming: drying

**`preserve` is documented as "a later town method", and that is backwards.** Sun and air drying is the most primitive preservation there is — a string, a rack, good weather. Older than the pan, far older than the oven. What actually needs a settlement is *salting* (needs salt, a trade good) and *smoking* (needs a smokehouse). So drying belongs at **camp**, possibly as the first technique of all.

**As an upgrade, not an insurance policy.** Drying earns its place the same way jam does: rosehips didn't need to rot for rosehip jam to be worth making, the jam is simply better than the raw hip. Dried cepes are genuinely *more* intense than fresh — one of the few preservations that improves a thing rather than merely saving it. So it reads as "drying makes it better", never "not drying makes it worse".

That means it needs **no new systems**: kitchen recipes already produce foods, so `cepe → dried cepe` is the same shape as `rosehip → rosehip jam`, and dried cepe simply cooks with more punch.

**Spoilage: decided against (2026-08-12).** It would punish exactly the way this game is meant to be played — a browser game you tab into on a break, with offline progression, so coming back after a day away would routinely mean loss. There are already three food pressures (hourly consumption, the famine threshold, winter cold, raids) and spoilage would be a fourth and the fiddliest, the one demanding constant attention rather than occasional decisions. It also cuts against mild-effects and cozy: it is the one system that would nag.

**Freshness decay: parked, softer, and cheaper than it looks.** Food never disappears, but its `fresh` contribution fades, so berries eaten soon give a boon that month-old ones don't. The obvious implementation needs the larder to become *batches* with timestamps, which ripples through consumption, caps and UI — too much for a mild effect. But a cheap approximation exists: **one freshness number per food type**, decaying over time and rising when new stock is added, weighted by amount. A larder you keep topping up stays fresh; one untouched for weeks goes dull. One extra number, no batches. Worth remembering if the seasons ever feel flat.

**What drying would be FOR, if it lands:** winter. The wood is bare by design, so winter is not for gathering — it is for eating what you kept. That pairs with the medlar, which only ripens after frost. Two different kinds of patience, both pointing at the same quiet season.

## Open threads

- Two aromatics (juniper, bay) would **double the local spice shelf**, which currently holds only honey and lavender — every other spice is merchant-only and unobtainable, leaving four dishes permanently theoretical.
- Several catalogued plants **already exist as herbs** (nettle, yarrow, comfrey, chamomile, mugwort, willowbark, wildmint, feverfew) and currently rain from the forager's hut by RNG from turn one, which the notes already call overwhelming. The minigame could **become their source** and fix that rather than adding to it. *(The Sharp-Eye draught is now the other half of this: move the rare things behind it and the baseline can get quieter.)*
- **`lootMod` is dead weight.** Declared on 44 items, read by nothing, superseded by `raw.luck`. Either wire it or delete it; leaving it looks like a working knob and isn't one. Found while costing the bilberry tart.
- **`nightshade`** is an alchemy ingredient with no source anywhere; belladonna in location 2 would give it one. *(`witchs_cap` was the other orphan. It is now `fly_agaric` and settled — see its entry.)*
- **The technique tiers look wrong, twice.** `preserve` is filed as "a later town method" when sun-drying is the most primitive preservation there is, and `roast` is town-gated when roasting chestnuts in the embers is the oldest cooking there is. Both read as though the tiers were assigned by how sophisticated the *word* sounds rather than by how old the practice actually is. Two instances make it a pattern. **Noted only — not ready to be implemented, and re-tiering techniques touches every dish, so it wants its own pass.**
- **The tavern has two drinks waiting** and no system yet: bramble wine (soft, autumn, everyday) and sloe spirit (sharp, winter, a treat). Both are foraged, both keep, and neither is a dish. Worth remembering when `DESIGN_TAVERN` is picked back up.
- **A plant can hold a story beat.** The Shepherd's share puts a chapter-3 faith seed in a chapter-1 hedge, at no cost and with no gate. If other plants can carry a beat that quietly, they should.
