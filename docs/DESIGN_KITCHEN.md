# DESIGN — The Kitchen (free-form cooking)

**Status:** design / not built. Sibling to the free-form alchemy lab (see
`DESIGN_APOTHECARY.md`), reusing its engine shape, its `FramedItemCard` /
`FramedModal` components, and its "recipe book on the left" layout. This doc is
the plan for a **full refont** of the current fixed-recipe kitchen into a
free-form cooking desk, agreed with the owner 2026-08-03.

Player-facing flavor (dish names, descriptions) in this doc is **draft** and
gets approved in chat before it goes in-game (house rule: approve flavor first).

---

## 1. Pillars

1. **Same engine as alchemy.** ROLE (a pantry shelf you grab from) × TECHNIQUE
   (how you PREPARE each ingredient — per-ingredient, like alchemy: roast the
   meat, boil the staple, combine) → a dish with effects. Discover recipes;
   known dishes are pre-filled cards in the cookbook.
2. **Effects stay MILD.** Cooking is comfort, warmth, and discovery, never a
   min-max obligation (house rule: mild food effects). A good meal is cozy and
   immersive; it never becomes a stat you're forced to grind.
3. **It still feeds the settlement.** Unlike potions (discrete items with no
   economy role), cooking is load-bearing for survival. A cooked batch still
   stocks the larder and can go on the tavern menu — the refont changes the
   *recipe system*, not the food loop.
4. **Three paths, like alchemy.** Cook a known dish, invent a new one, or (later)
   buy a recipe card. Invention is only slightly better than following a card,
   so it's opt-in delight, not a chore.

---

## 2. The two axes

### Preps (how each ingredient is prepared → what it contributes)

Per-ingredient, like alchemy (you can roast the meat and boil the staple in one
dish). Gated by **settlement tier**, same as alchemy's crush/boil → steep →
distil → char reveal, with a crafted tool as the in-world reason.

| Prep | Feel | Boon lean | Unlock | Tool |
|---|---|---|---|---|
| 🍲 **Boil** (pot over the fire) | hearty, warming | **nourishment** + **warmth** | **camp** (start) | a pot |
| 🔪 **Chop** (raw prep) | fresh, cold, light | **freshness** (eases summer heat) | **camp** (start) | knife; cutting board later *boosts* it |
| 🍳 **Fry / Griddle** | quick, savoury | modest **nourishment** + **comfort** | **village** | **frying pan @ blacksmith** |
| 🔥 **Roast / Bake** (oven) | rich, celebratory | **comfort** spike | **town** | oven |
| 🥓 **Preserve / Smoke** | travel rations | keeps long → **mission food** slot | city (later) | — |

Boil + Chop are there from day one (a pot and a knife); the equipment methods
open with the tier AND the crafted tool (frying pan at the blacksmith → the
woodworker's **cutting board** becomes a Chop *boost*, not a gate). This keeps
the tool-making concept meaningful and ties blacksmith/woodworker → kitchen. The
sandbox exposes all preps for tuning; gating lands in Phase C.

### Shelves (ingredient role → what it contributes)

| Shelf | Role parallel | Example ingredients |
|---|---|---|
| 🌾 **Staple** | *base* — a meal wants one | wheat, barley, (bread) |
| 🍖 **Protein** | *hero* — the substance | game/venison, pork, chicken, fish, eggs, fava/peas |
| 🥬 **Veg** | body | cabbage, turnips, gourd, mushrooms |
| 🍎 **Fruit** | sweet | apples, pears, cherries, berries |
| 🧀 **Dairy** | body — enriches, great for baking | milk, cheese, butter |
| 🌶️ **Spices** | *catalyst* — amplifies, no line of its own | long pepper, saffron, wildmint, salt, honey |

Six shelves (a kitchen is a bigger pantry than an alchemist's bench). **Spices**
is the catalyst — split out from dairy, which was awkward together. If Dairy
feels like one shelf too many early, it can fold back under Protein/animal.

**Food subcategories:** the Protein shelf above already shows the planned split
(meat → game/pork/chicken…). That's an economy-wide change (each meat needs a
source: pens, coop, hunt), so it's a **Phase-B pass**; the sandbox uses split
*placeholders* to feel it out. See the `project_food_subcategories` memo.

**The base lever (straight from alchemy):** protein/veg with **no staple** =
"a snack, not a proper meal" — thin nourishment + a note ("wants some grain or
bread to make a proper meal"). Intuitive and cozy; mirrors alchemy's "harsh
without a base."

---

## 3. Effect palette (mild, cozy channels)

Grounded in systems that already exist (happiness, food diversity, winter cold,
mission food slot), never combat stats.

| Channel | What it does | Which technique leans into it |
|---|---|---|
| `nourishment` | how long/how well it satisfies (satiety) | simmer, roast |
| `comfort` | the joy of a good meal → a small happiness lift | roast, bake, fry |
| `warmth` | eases winter cold for a while (hot food only) | simmer, roast |
| `freshness` | eases summer heat (a cold board on a hot day) | assemble |
| `diversity` | feeds the existing food-variety delight | breadth of shelves used |

Same math as the brew engine: sum per channel, **diminishing returns**, a mild
**per-channel cap**, and the **per-plant cap (5)** carries over as a per-
ingredient cap so you can't dump the whole larder into one pot.

---

## 4. Tier-1 dishes as pre-known cards

Kept from the current kitchen (the higher-tier recipes are placeholders and get
dropped/reworked). Each becomes a **pre-known cookbook card**, expressed as a
free-form combo:

| Dish | Combo | Notes |
|---|---|---|
| 🥣 Porridge | Boil(grain) | the daily staple |
| 🍲 Hearth Stew | Boil(meat + nuts) | hearty week-keeper |
| 🍲 River Stew | Boil(fish + berries) | lean-larder stretcher |
| 🍜 Bone Broth | Boil(bone) | nothing wasted |

These are the survival **food multiplier** — see §5.

---

## 5. THE key reconciliation — passive staples vs one-off dishes

The current tier-1 staples are not one-shot crafts: they run on a **passive
"keep a pot on" auto-cook tick** (burns wood/hr, stretches raw food into more
citizen portions over 10–15 game-min batches). Alchemy's "click Brew once → get
one item" model would **break the food multiplier** if applied naively.

**Resolution (proposed):**
- **Staple cards keep a "keep cooking" toggle.** A pre-known staple card in the
  cookbook has, in addition to a one-off "cook a batch" action, the existing
  passive **auto-cook toggle** — leave a pot of porridge on and it feeds the
  settlement exactly as today. The engine underneath is unchanged; only its
  surface moves into the cookbook card.
- **Invented / special dishes are one-off cooks.** They produce a batch that
  stocks the larder (as a "cooked" food type or a generic cooked-food add) and
  becomes tavern-menu-eligible, and they carry the mild cozy boons + discovery.
  No passive toggle (you don't leave a feast roasting forever).

So: **free-form UI and discovery on top; the survival food-multiplier loop
underneath is preserved.** This is the one decision to confirm before the
economy phase — the sandbox (Phase A) doesn't touch it.

---

## 6. Economy integration (later phases, not the sandbox)

- A cooked batch still `produces` larder food (keeps citizens fed) and is
  menu-eligible at the tavern — reuse the current cooked-food + `TavernDish`
  plumbing; the free-form desk just replaces how a dish is *chosen/made*.
- Mild boons attach to the dish and surface where food already matters: the
  adventurer **mission food slot** (a packed meal), a settlement-wide comfort/
  warmth nudge when it's on the menu, seasonal fit (a cold board reads better in
  summer; a hot stew in winter).
- **Effect model (agreed):** same opt-in shape as alchemy. A cooked/invented
  dish packed for an adventure gives mild boons and can be **slightly better
  than the fixed staple recipes** (reward for cooking well), never mandatory.
  **Diversity** is mostly for fun/immersion, with a minor effect at most.
- **Seasonality is emergent:** the boons don't change, but their VALUE does
  (freshness matters in a summer heat wave, warmth in winter). No extra data.
- Ingredient shelves read from the existing **`FoodItemType` larder stocks** +
  herbs/honey/dairy — no new stockpile system.

### Naming flourishes
- **Golden ___:** a prestige spice (saffron) tips an INVENTED dish's name to
  "Golden Roast", etc. (a named dish keeps its own name). Flavour + status in one
  lever. Built.
- **Trade spices:** saffron + cinnamon are "trade spices" (arrive via
  travelling merchants, not grown) — a natural rapport/economy hook later.

---

## 7. Build phases (mirrors the alchemy path)

- **Phase A — design doc + `/dev-kitchen` sandbox (NOW).** Placeholder
  ingredients, Simmer + Fry stations, the assemble→dish→effects interaction, the
  cookbook on the left. Pure feel; no economy, no save. Same as `/dev-alchemy`.
- **Phase B — real content.** Map real `FoodItemType`s onto shelves, author the
  effect values, wire the tier-1 known cards.
- **Phase C — economy refont.** Move the real Kitchen/Tavern page onto the desk,
  fold in the staple auto-cook toggle (§5), stock the larder + tavern menu,
  retire the old fixed recipe-crafting UI.
- **Phase D — polish.** Rarity/quality on dish cards, seasonal fit, cast-tie
  dishes, mission packed-meal boons.

---

## 8. Open questions

1. Confirm the §5 reconciliation (staples keep the passive toggle; special
   dishes are one-off). **This gates Phase C, not the sandbox.**
2. Effect values + exact channel list — tune in Phase B against real play.
3. Do dishes get a **rarity/quality** frame like potions, or a simpler "how it
   turned out" read? (Lean: quality yes, rarity maybe not — food isn't loot.)
4. Cast ties (e.g. a Nell / Edda signature dish) — draft in chat when Phase B
   flavor is written.
5. **Named dishes and the base lever:** a canonical staple with no grain (Hearth
   Stew = meat + nuts) currently reads "thin/rough" from the base lever. Like
   alchemy forces a named recipe to "fine", a MATCHED named dish should probably
   floor at fine (it's a known proper dish). Decide in Phase B.
6. **Milestones/achievements** (see `project_achievements_milestones`): reward
   demonstrated love (discover N recipes → a cook's side-quest recipe), never
   power. Game-wide, cozy. Park until there's real progression to count.

---

## 9. Future flavours & hooks (brainstorm 2026-08-03, not scheduled)

Fun ideas to draw from later. NB: cherries/fava/strawberries already exist
(cherry orchard, fava + strawberry gardens), so they map straight through.

- **Legumes as early protein.** Fava + peas feed you before livestock. Dishes:
  Fava Mash (ful), Bean Pottage (fava + barley), **Pease Porridge** (and the
  "hot / cold" rhyme rides the emergent seasonality — warmth dish hot, fresh
  dish cold).
- **Subcategory splits** (Phase-B, per `project_food_subcategories`). Priority:
  **mushrooms first** — they span kitchen (chanterelle/morel/field) AND alchemy
  (witch's cap, puffball/vesse de loup), so one split feeds two systems. Then
  berries (bilberry/blackberry/wild strawberry/**elderberry** → alchemy cordial
  crossover), meat (add **mutton** → bouzelouf, rabbit, fowl), dairy (cream,
  curds, skyr).
- **Preserves** (the Preserve technique): jams (strawberry, apple butter w/
  cinnamon), pickles/kraut, smoked fish, jerky, aged cheese. Serve three needs
  at once — winter stores, mission rations, trade goods.
- **Cultural cuisine.** Each culture a signature dish/ingredient, learned via
  rapport/recipe. **Nordveld** = skyr + smoked fish + rye (an **Edda** thread);
  Zah'kari = spices + sweets; Meridian = imports; Ashwick/Feldgrund = the
  stew/pie/porridge baseline. Ties `project_races_origins`.
- **Merchants sell recipes** — the "buy" path (alchemy has brew/invent/buy).
  Recipe cards as merchant goods makes culture rapport *taste* like something.
  Ties `project_traveling_merchants` + `project_loot_recipes`.
- **Exotic imports / cocoa.** Late-game luxury tier above the trade spices
  (saffron/cinnamon already seed it). **Meridian** sails cocoa in (sourced
  Zah'kari / far south) → Spiced Cocoa (cocoa + cinnamon + honey + milk),
  Chocolate Tart.
- **Garden expansion** for cooking: a culinary **herb garden** (thyme/sage/dill
  — feeds kitchen seasoning AND alchemy), a bean field, a berry patch, a saffron
  crocus specialty crop. Ties `project_garden_expansion`.
- **Aromatics** juniper + laurel (bay): bay in any stew, juniper with game and
  kraut; juniper crosses into alchemy (medicinal). Park with the herb/spice pass.

---

## 10. Locked cultural recipes — "discover vs learn" (design agreed 2026-08-03)

A dish has two separable parts: its **boons** (engine-computed from
ingredients + prep) and its **identity** (name, card, the culture behind it).
Cultural/gated recipes lock only the IDENTITY.

- **Common dishes** name-match on cook (as today). **Locked dishes** (e.g.
  **skyr**) do NOT name-match until *learned* (Nordveld merchant / Edda / story).
- Experiment into a locked combo → the **generic emergent dish + its boons**
  (e.g. "Soured Curds"), optionally a **teaser** line ("tangy and foreign… a
  knack you haven't learned"). You get the food, never the identity. So a player
  cannot self-discover a cultural dish's name.
- Learn the recipe → the SAME combo now resolves to the named dish (blessed
  "fine", proper card, flavour, cookbook entry). Framing: "you'd been making a
  rough version all along; now you know its name and its people."
- **No chooser needed:** a pot resolves to the best name the player is ENTITLED
  to (learned-cultural > common > generic; ties broken by specificity, as
  already). A prior generic entry is superseded. A chooser is only warranted if
  one combo makes two genuinely different real dishes (rare; add narrowly if so).
- The purchase is never wasted: the reward is the name + connection (recognise,
  repeat, teach), not the calories.
- Impl later: `locked?: boolean` + `learnedVia` on a NamedDish, a
  `state.knownDishes` set, and `matchNamedDish` skips locked-unless-known.

Related: the Preserve technique is effectively **blocked on a food-spoilage /
expiration mechanic** (preserves only matter if other food spoils) — the owner
wants that discussion later, so Preserve stays defined-but-dark for now.
