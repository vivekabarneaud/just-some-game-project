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
   (a cooking station you place onto) → a dish with effects. Assemble
   ingredients, the technique shapes the result, discover recipes, known dishes
   are pre-filled cards in the cookbook.
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

### Stations (cooking method → the dish's *character*)

| Station | Feel | Boon shape | Unlock |
|---|---|---|---|
| 🍲 **Simmer** (pot) | hearty, warming, sustaining | long **nourishment** + **warmth** | camp |
| 🍳 **Fry / Griddle** (pan) | quick, savory | fast, modest **nourishment** + **comfort** | camp |
| 🔥 **Roast / Bake** (oven) | rich, celebratory | **comfort** spike (a small feast) | village |
| 🥗 **Assemble** (board) | fresh, light | **freshness** (eases summer heat) | village |
| 🥓 **Preserve / Smoke** | travel rations | keeps long → **mission food** slot | town (later) |

Start the sandbox with **Simmer + Fry** shown; Roast/Assemble/Preserve are
defined but hidden, unlocked by settlement tier later (same "reveal by tier"
plan as alchemy's steep/distil/char).

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
| 🥣 Porridge | Simmer(grain) | the daily staple |
| 🍲 Hearth Stew | Simmer(meat + nuts) | hearty week-keeper |
| 🍲 River Stew | Simmer(fish + berries) | lean-larder stretcher |
| 🍜 Bone Broth | Simmer(bone) | nothing wasted |

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
- Ingredient shelves read from the existing **`FoodItemType` larder stocks** +
  herbs/honey/dairy — no new stockpile system.

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
