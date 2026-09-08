# Kitchen Art — Dish Sprite Prompts

- **Companion to:** `DESIGN_KITCHEN.md` (the free-form kitchen) · `FORAGING_PLANTS.md` (where most of these dishes were designed) · `ANACHRONISMS.md` (read before adding a vessel).
- **Status:** working sheet. These are the dishes designed during the plant catalogue, none of which have art yet.
- **Where files go:** `images/items/kitchens/<recipe_id>.png` on R2, matching the existing food items (e.g. `blackberry_crumble.png`).

---

## House style

> painterly oil study, warm hearth light, plain dark background, no text

and always `--style raw --ar 1:1`. Same family as the foraging sheet, so plants and the dishes made from them look like one game.

**Cut out and feather the edges**, as with the plant sprites.

### The vessel says the tier

This is the useful trick: **let the serving tell you how far the settlement has come**, with no words at all.

| Tier | Serve it | Reads as |
| --- | --- | --- |
| **Camp** | a green stick, a rough wooden bowl, a blackened iron pot straight off the fire | eaten where it was made |
| **Village** | glazed earthenware, a shallow pan, a wooden trencher | a kitchen exists |
| **Town** | a carved board, a pewter dish, a cloth under it | somebody set a table |

### Anachronisms to avoid

**No forks.** No white porcelain, no clear glass, no printed linen, no stainless anything, no modern garnish. Wooden spoons, horn, treen, earthenware, iron, pewter. Bread is a dark wheel or a flat cake, never a modern loaf. When in doubt, append:

`--no fork, porcelain, glass, modern plate, garnish, restaurant plating`

---

# The dishes

## Chanterelles on the Coals · camp
`one(chanterelle, skewer)`

> golden chanterelle mushrooms threaded on a green stick and held over glowing coals, painterly oil study, edges just catching and browning, embers below, warm firelight, plain dark background, no text --ar 1:1 --style raw

## Bolete Broth · camp
`one(cepe, boil)` + `one(bone, boil)`

> a rough wooden bowl of dark mushroom broth, painterly oil study, almost black like strong tea, a marrow bone and slices of pale bolete showing under the surface, steam rising, warm hearth light, plain dark background, no text --ar 1:1 --style raw

## Winter Pottage · camp
`one(chestnut, boil)` + `one(oyster_mushroom, boil)`

> a blackened iron pot of thick pale pottage, painterly oil study, chestnuts broken down into it and grey fan-shaped oyster mushrooms folded through, dense enough to stand a spoon in, a wooden spoon resting inside, cold light from outside meeting warm firelight, plain dark background, no text --ar 1:1 --style raw

## Fish in Green Sauce · camp
`any(fish, boil)` + `one(ramsons, chop)` + `one(nuts, chop)`

Cold, and it should look it. The point is the sauce.

> a whole poached river fish on a wooden trencher under a coarse green sauce, painterly oil study, the sauce roughly pounded from wild garlic leaves and nuts, flecked and rustic, a stone mortar just behind, cool even daylight rather than firelight, plain dark background, no text --ar 1:1 --style raw

## Spring Omelet · village
`one(eggs, fry)` + `one(morel, fry)` + `one(ramsons, chop)`

> a folded omelet in a shallow iron pan, painterly oil study, dark honeycomb-pitted morels showing through the eggs, raw chopped wild garlic scattered over the top, pale spring light, plain dark background, no text --ar 1:1 --style raw

## Bilberry Tart · village
`one(bilberry, roast)` + `one(wheat, roast)` + `one(honey, boil)`

> a small rustic tart of wild bilberries in a thick hand-raised crust, painterly oil study, the fruit collapsed dark purple and glossy with honey, one slice cut away, crumbs on the board, warm light, plain dark background, no text --ar 1:1 --style raw

## Bilberry Soup · village *(Nordveld)*
`one(bilberry, boil)` + …

Drunk hot from the cup, not eaten from a bowl. Northern.

> a horn cup of hot dark bilberry soup, painterly oil study, thin and deep purple, steam rising off it, held in cold blue daylight against snow rather than by a fire, plain dark background, no text --ar 1:1 --style raw

## Wild Fowl and Chanterelles · town
`one(wild_fowl, roast)` + `one(chanterelle, fry)`

The grand one. Let the vessel say so.

> a whole roasted wild bird on a carved wooden board, painterly oil study, golden chanterelles fried and heaped alongside glistening in the fat, a cloth beneath the board, rich warm candlelight, plain dark background, no text --ar 1:1 --style raw

---

## Waiting on decisions

- **Pasta with Green Sauce** — needs the Meridians to have taught pasta.
- **Nettle Pottage** — nettle is still an idea, not a settled plant.
- **Roast chestnuts** — the iconic image, but the pottage is the dish people lived on. Town version if it happens.
