# Foraging Art — Midjourney Prompt Sheet

- **Status:** working sheet. Tick things off as they land; this is several days of work, not a sprint.
- **Companion to:** `DESIGN_FORAGING_MINIGAME.md` (why any of this exists).
- **Sandbox:** `/dev-foraging` (dev only). Everything below works the moment the file appears — no code changes needed except bumping a count.

---

## Where files go

```
frontend/public/images/foraging/
  scenes/   spring1.png   spring1_mask.png    ← backgrounds + optional terrain masks
            autumn1.png   autumn1_mask.png
  plants/   chanterelle1.png  chanterelle2.png  ← sprites, numbered from 1
```

After adding art, two small edits:
- a new **scene** → bump `SCENE_COUNT` in `ForagingDev.tsx`
- a new **sprite variant** → bump `artVariants` for that plant in `shared/src/data/foraging/plants.ts`

## The two rules that constrain everything

1. **A pair must be painted together, or not at all.** A painted chanterelle beside an emoji false chanterelle gives the answer away instantly. There is a test enforcing this.
2. **The tell must be visible on a plant standing in the ground.** Anything you can only see by turning the mushroom over is useless for the default sprite. (Tipped variants are how you get at those — see below.)

## House style (append to any prompt)

> painterly oil study, soft even light, plain dark background, no text

and always `--style raw`. Sprites want `--ar 1:1` or `3:2` for a pair; scenes want `--ar 1:1`.

**Cut out, then feather the edges** the way you did the camp painting. A soft edge blends into any ground; a hard cutout reads as collage.

---

# PART 1 — Sprites

Ordered by value. Each **pair** is one identification test, and a pair is worth more than several safe plants.

## ✅ Done
- **Chanterelle / False Chanterelle** — 3 shapes each
- **King Bolete / Bitter Bolete** — 3 shapes each *(art named `king_bolete*`; the plant's id is `cepe` for economy reasons, handled by `artId`)*
- **Ramsons / Lily of the Valley** — 3 shapes each

## ~~1. King Bolete + Bitter Bolete~~ ✅ *(autumn's second test — done)*

The tell is the **stalk net**, since pores can't be seen on a standing mushroom.

> two similar brown boletus mushrooms standing side by side on dark forest litter, painterly oil study, the left one a king bolete with a thick pale bulbous stalk and a fine white net only near its top, the right one a bitter bolete with a slimmer stalk covered in a coarse dark brown net running all the way down, both with rounded brown caps, soft even light, plain dark background, no text --ar 3:2 --style raw

Load-bearing words: **"fine white net only near its top"** vs **"coarse dark brown net running all the way down"**. If MJ blurs them together, generate separately but feed the first back with `--iw 0.5` to lock the lighting.

## 2. Parasol + Deadly Dapperling  *(size is the tell)*

The one pair where the two are deliberately **very different sizes**, exactly as in life — this is how people actually avoid being poisoned. The code already draws the parasol at 1.9× and the dapperling at 0.7×, so let the art match that.

> a tall parasol mushroom standing in rough grass, painterly oil study, a wide shaggy scaly cap like an open umbrella on a long slender stalk patterned like snakeskin, a loose ring around the stalk, soft even light, plain dark background, no text --ar 1:1 --style raw

> a small squat dapperling mushroom in rough grass, painterly oil study, a low scaly brownish cap on a short thick stalk, a tight fixed ring, altogether small and stunted, soft even light, plain dark background, no text --ar 1:1 --style raw

## ~~3. Ramsons + Lily of the Valley~~ ✅ *(spring's test — done, 3 shapes each)*

Both are broad green leaves rising from the litter, which is exactly why people die of this one. The tell is **one leaf per stalk (ramsons) vs paired leaves (lily)**.

> a clump of wild garlic ramsons growing from woodland leaf litter, painterly oil study, broad pointed green leaves each rising on its own separate stalk from the ground, soft even light, plain dark background, no text --ar 1:1 --style raw

> a clump of lily of the valley growing from woodland leaf litter, painterly oil study, broad green leaves in close pairs sharing a single stem, soft even light, plain dark background, no text --ar 1:1 --style raw

## 4. Morel + False Morel

> a morel mushroom standing on forest floor, painterly oil study, a tall cap deeply pitted like a honeycomb on a pale hollow stalk, soft even light, plain dark background, no text --ar 1:1 --style raw

> a false morel mushroom on forest floor, painterly oil study, an irregular reddish-brown cap lobed and folded like a brain rather than pitted, on a short stout stalk, soft even light, plain dark background, no text --ar 1:1 --style raw

## 5. Wild Carrot + Hemlock  *(the poison you actually want)*

Hemlock **yields** — it's an alchemy ingredient, not a decoy. Same height as wild carrot on purpose: the **stem** is the tell.

> a wild carrot plant in a grassy clearing, painterly oil study, a flat white umbrella of tiny flowers with a single dark floret at its centre, on a slender hairy green stem, soft even light, plain dark background, no text --ar 1:1 --style raw

> a hemlock plant in a grassy clearing, painterly oil study, a flat white umbrella of tiny flowers on a smooth hairless stem blotched with purple, soft even light, plain dark background, no text --ar 1:1 --style raw

## 6. The safe plants  *(no pair, lower priority — do these when you want a break)*

| Plant | Prompt core |
| --- | --- |
| `field_mushroom` | a common field mushroom, white domed cap, short stout stalk, on grass |
| `dandelion` | a dandelion plant, jagged toothed leaves in a low rosette, one yellow flower |
| `sorrel` | a sorrel plant, arrow-shaped bright green leaves in a low clump |
| `blackberry` | a small bramble sprig with ripe dark blackberries and thorny stem |
| `blueberry` | a low bilberry sprig with small round blue berries and neat oval leaves |
| `raspberry` | a raspberry sprig with soft red berries and pale undersides to the leaves |
| `rosehip` | a wild rose stem with scarlet rosehips and a few thorns, leaves turning |

---

# PART 2 — Tipped variants  *(the payoff variant)*

Once a plant has its standing sprite, a **second variant lying on its side** buys three things: the patch stops looking stamped, the underside tell becomes available *some* of the time, and a player who learned both tells gets rewarded for spotting whichever the scene happens to offer.

> a single brown bolete mushroom lying tipped on its side on forest litter, its underside showing, painterly oil study, pale cream pores beneath the cap, soft even light, plain dark background, no text --ar 1:1 --style raw

Same again with **"pores flushed dull pink"** for the bitter bolete.

---

# PART 3 — Scenes

Ground-level only. Bushes and trees are parked: one bush is one plant, which breaks the "choose what to take" mechanic (see the design doc).

## ✅ Done
- `spring1` (+ mask) — deep wood, litter and fallen timber. *No grass, so no dandelion or sorrel here, which is authentic for a shady wood.*
- `autumn1` — currently a **duplicate of spring1**, standing in until a real one exists.

## Wanted

**Autumn (the mushroom flush) — the priority, since that's where the painted pairs live:**
> a close view of the forest floor at your feet in late autumn, steep downward angle, the ground filling the whole frame, thick fallen leaves in ochre and rust over damp dark earth, moss on a rotting log, low misty light, open patches between the leaf drifts, painterly oil study --ar 1:1 --style raw --no sky, horizon, treeline, distant trees, background, mushrooms, berries, flowers, people, text

**A grassy clearing — needed, because greens have nowhere to grow right now:**
> a close view of a woodland clearing floor at your feet, steep downward angle, the ground filling the whole frame, low tangled grass and weeds over damp earth, open patches of bare soil showing through between the growth, a mossy stone, soft spring light, painterly oil study --ar 1:1 --style raw --no sky, horizon, treeline, distant trees, background, flowers, mushrooms, berries, people, text

**Summer:**
> a close view of a sunlit woodland floor at your feet in high summer, steep downward angle, the ground filling the whole frame, dry earth and dappled light, scattered dry leaves and a fallen branch, open uncluttered ground, painterly oil study --ar 1:1 --style raw --no sky, horizon, treeline, distant trees, background, mushrooms, berries, flowers, people, text

**Winter (stark on purpose — the design wants it nearly empty):**
> a close view of a bare winter woodland floor at your feet, steep downward angle, the ground filling the whole frame, frozen dark earth with a dusting of snow, black wet twigs and dead bracken, cold blue light, painterly oil study --ar 1:1 --style raw --no sky, horizon, treeline, distant trees, background, people, text

### What keeps a scene usable
- **"at your feet" + "the ground filling the whole frame"** stop it becoming a landscape.
- **`--no sky, horizon`** is what actually holds the line. Drop it and trees creep back in.
- **Forbid mushrooms and berries** — anything painted in will clash with the sprites placed on top.
- **Open patches matter.** Sprites need somewhere to land that isn't busy.

---

# PART 4 — Terrain masks  *(optional, per scene)*

Paint as a layer over the background, export as `{scene}_mask.png`. Three brush colours, classified by **dominant channel**, so soft edges and approximate swatches are fine.

| Colour | Terrain | What grows |
| --- | --- | --- |
| 🔴 **red** | `wood` | trunk bases, roots, fallen logs → chanterelles, boletes, morels |
| 🟢 **green** | `grass` | weedy clearing, ground cover → dandelion, sorrel, wild carrot, hemlock, parasol |
| 🔵 **blue** | `litter` | leaf litter, open earth → most things |
| ⚫ **black / transparent** | blocked | rock, water, deep shadow → nothing at all |

### Anchor daubs — where a specific thing grows

Bushes are **painted into the scene**, not cut out as sprites: a bramble stands in the same corner for twenty years, so it belongs to the picture. Only the fruit is a sprite, and it appears where you mark it. Same mask file, one small daub per spot:

| Colour | Marks |
| --- | --- |
| 🟣 `#7B00D4` | a blackberry cluster |
| 🔵 `#00C8FF` | juniper berries |
| 🟠 `#FF7A00` | rosehips |
| 🩷 `#FF00C8` | elderberries |
| 🟡 `#FFE800` | fungus on standing wood (a trunk face, a stump) |

Approximate is fine, nearest colour wins. A daub of any size gives **one** spot, so mark each cluster separately. These are read *before* the terrain colours, so a violet daub won't be mistaken for leaf litter.

**Why this beats cutting bushes out:** no transparency work, and a painted-in bush needs no contact shadow, no light-matching and no depth sorting, because it *is* the painting. Variety comes from more scenes rather than from moving one bush around — which is also the honest model, since a thicket doesn't wander.

The **mask toggle** in the sandbox overlays it at 45% with a legend, so you can see where things are allowed while you paint. Masks are entirely optional: no file simply means the whole frame is fair game.

---

# PART 5 — Entering the woods  *(a nice-to-have)*

The wide atmospheric landscapes from the early rounds are lovely and shouldn't be wasted. They'd work as the **setting-out** image shown when you walk into the woods, before it cuts down to the ground you actually search — immersion from the wide shot, usability from the close-up, instead of choosing.

No code for this yet. Keep the good ones.
