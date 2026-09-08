# Building Tools — Expansion

**Status:** Design doc, not yet implemented (extends the live tool-slot system).
**Prerequisites:** Existing `BUILDING_TOOLS` system in `frontend/src/engine/crafting.ts`; Cutting Board already ships and gates Kitchen Lv 3+ recipes.
e
## Overview

Crafting buildings have tool slots. Tools are crafted at building A, installed at building B, and either **unlock** higher-tier recipes or **buff** the building's output. The current system has one tool (Cutting Board, Woodworker → Kitchen). This doc proposes the full roster.

## The homestead insight

The player is a commoner frontier settler, not a noble. The settlers packed for a homestead — they did not arrive empty-handed. A family carting their lives into the Thornveil brought knives, a cooking pot, a needle and thread, a whittling knife, a pestle and mortar. What they **did not** bring is infrastructure: an anvil, a loom, a forge bellows, a clay oven big enough to feed a village. Those are things you build up to.

This reframes the tool system into three tiers:

1. **Homestead tools** — implicit. No slot, no craft. The building's starter recipes (Lv 1–2) assume these exist. A Kitchen at Lv 1 already has a cutting board, a pot, a knife. A Tailoring Shop has needles and thread.
2. **Upgrade tools** — the crafted, installed, recipe-gating tools this doc covers. They represent the settlement growing into real infrastructure. This is where gameplay lives.
3. **Masterwork tools** (future) — rare late-game tools with multiplier effects (batch crafting, speed, quality). Out of scope for Phase 1.

## Migration: the current Cutting Board

Under the current system, Cutting Board is a crafted upgrade tool gating Kitchen Lv 3+. Under the homestead frame, a basic cutting board should already be in the Kitchen — a Lv 3 Kitchen is the *village* tier, and the restriction it represents is not "no cutting board" but "no proper prep station."

**Proposed migration:**
- Rename Cutting Board → **Prep Station** (or keep as-is, rename later). It's a proper butcher's block + hanging knife rack + prep counter, not just a chopping board.
- Keep Woodworker Lv 1 as source, same cost. Flavour the recipe description as "upgrading the kitchen's prep area," not inventing chopping.
- Keep Kitchen Lv 3+ gating. (The homestead cutting board covers Lv 1–2.)
- Migrate existing saves: anyone who already crafted + installed Cutting Board keeps it installed as Prep Station (ID stays `cutting_board` to avoid migration code, just rename display strings).

## Slot model

Two slot categories per crafting building — keep unlock tools and buff tools from competing:

- **Primary slot** — unlock tool (gates recipes via `unlocksMinLevel`). One per building.
- **Secondary slot** — buff tool (+X% speed, +1 batch output, -10% cost). One per building. Unlocked when building reaches Lv 4 (mid-game progression hook).

Primary slot exists from Lv 1. Secondary slot is hidden until Lv 4.

## Tool roster

**Craft-source shorthand:** `[source building + cost hint]`. All unlock tools assume `unlocksMinLevel` gating; all buff tools assume secondary slot.

### Kitchen

| Tool | Type | Source | Gates / Effect |
|---|---|---|---|
| Prep Station (née Cutting Board) | unlock | Woodworker [wood] | Lv 3+ (village cooking) |
| Iron Pot | unlock | Blacksmith [iron] | Lv 5+ (stews, broths, slow-cooked) |
| Clay Oven | unlock | Woodworker [wood+stone] | Lv 4+ (bread, cakes, pies) |
| Spice Grinder | unlock | Woodworker [wood+stone] | Gates ALL exotic-spice recipes regardless of Kitchen level (natural gate for the spice system) |
| Smoking Rack | buff | Woodworker [wood] | Meat/fish recipes get +1 output |

Note: Spice Grinder is the special case — it gates by **ingredient tag**, not by level. A Lv 7 Kitchen can cook a Royal Feast only if the grinder is installed.

### Tailoring Shop

| Tool | Type | Source | Gates / Effect |
|---|---|---|---|
| Loom | unlock | Woodworker [wood+iron] | Lv 3+ (woven cloth) |
| Tailor's Shears | unlock | Blacksmith [iron] | Lv 5+ (fitted armor cloth, quilted garments) |
| Dye Vat | unlock | Woodworker [wood+fiber] | Noble/ceremonial clothing (Wizard's Hat, Prayer Book) |
| Spinning Wheel | buff | Woodworker [wood] | Wool→yarn +1 output |

### Blacksmith

| Tool | Type | Source | Gates / Effect |
|---|---|---|---|
| Forge Bellows | unlock | Woodworker + Leather [wood+leather] | Lv 4+ (steel work, proper swords) |
| Power Hammer | unlock | Woodworker [wood+iron] | Lv 6+ (plate armor, heavy weapons) |
| Whetstone Wheel | buff | Mason [stone] | Weapon recipes: +10% output chance |

### Alchemy Lab

| Tool | Type | Source | Gates / Effect |
|---|---|---|---|
| Alembic | unlock | Blacksmith [iron] (flavoured as copper) | Apprentice-tier+ (distilled potions) |
| Grimoire Stand | unlock | Tailoring + Woodworker [fiber+wood] | Veteran-tier recipes |
| Brass Scales | buff | Blacksmith [iron] | +10% research discovery chance |

### Leatherworking

| Tool | Type | Source | Gates / Effect |
|---|---|---|---|
| Curing Vats | unlock | Woodworker [wood] | Lv 3+ (proper leather from hides) |
| Awl & Punch Set | unlock | Blacksmith [iron] | Lv 5+ (stitched armor, saddles) |

### Woodworker

| Tool | Type | Source | Gates / Effect |
|---|---|---|---|
| Quality Saw | unlock | Blacksmith [iron] | Lv 3+ (large-lumber items) |
| Lathe | unlock | Blacksmith [iron] | Lv 5+ (turned work: staves, bowls, arcane focus) |

### Brewery

| Tool | Type | Source | Gates / Effect |
|---|---|---|---|
| Copper Kettle | unlock | Blacksmith [iron] (flavoured copper) | Lv 3+ (stronger ales) |
| Oak Barrels | buff | Woodworker [wood] | +5 ale cap, enables aged drinks |

## Cross-building dependency graph

The pattern this creates:

- **Blacksmith** feeds tools to: Kitchen, Alchemy, Tailoring, Leatherworking, Woodworker, Brewery
- **Woodworker** feeds tools to: Kitchen, Tailoring, Blacksmith, Leatherworking, Brewery
- **Mason's Guild** feeds tools to: Blacksmith (Whetstone)
- **Tailoring Shop** feeds tools to: Alchemy (Grimoire Stand)

Blacksmith and Woodworker become natural hub buildings — you want both early, because they unlock upgrades everywhere else. Tailoring gets a late-game role (Alchemy Grimoire) to avoid it being purely a clothing factory.

## Phase plan

- **Phase 1** — schema + migration. Rename Cutting Board display → Prep Station. Add secondary slot (Lv 4+) to `buildingTools` state. UI: tool slot headers split into Primary / Secondary.
- **Phase 2** — Kitchen roster (Iron Pot, Clay Oven, Spice Grinder, Smoking Rack). Wire Spice Grinder as an ingredient-tag gate (new field on recipe: `requiredTool?: string[]`).
- **Phase 3** — Tailoring + Blacksmith roster.
- **Phase 4** — Alchemy + Leatherworking + Woodworker + Brewery. Grimoire Stand = cross-building sink for Tailoring's late game.
- **Phase 5** — Masterwork tier (future, scope TBD).

Total new tools across Phases 2–4: ~18.

## Open questions

1. Should buff tools stack with Shrine blessings (shrine production bonus + whetstone wheel)? Default: yes, multiplicative, no cap.
2. Tool durability? Default: **no**. Tools are permanent once installed. Simpler and matches the homestead-infrastructure fantasy.
3. Can tools be **uninstalled** (e.g. to swap for a buff tool)? Default: yes, but tool returns to inventory and recipes re-lock immediately. Prevents cheese strategies.
4. Do tools survive a **raid that damages the building**? Default: yes (they're inside). Raids damage the building's production, not its installed tools.
5. Should **Spice Grinder's ingredient-tag gating** also apply to Alchemy recipes that use exotic ingredients (Clarity Brew, Focus Elixir use tea)? Default: no — tea in potions is delicate steeping, not grinding. Keeps the Spice Grinder exclusively Kitchen-flavoured.

---

## Parking lot — ideas to explore later

Not ready to implement. These are sketches to build on when the roster above is live.

### Ingredient-tag gating as a general pattern

The Spice Grinder pattern generalizes. Any tool can be an **ingredient-tag gate** rather than a level gate. Proposed shape: a recipe can declare `requiredIngredientTools?: string[]`, and any recipe whose costs include a tagged ingredient requires the matching tool installed.

Candidate applications across buildings:

| Building | Tool | Gates ingredients |
|---|---|---|
| Kitchen | Spice Grinder | Exotic spices (pepper, cinnamon, chili, saffron) |
| Kitchen | Tea Brewer | Tea-based recipes |
| Alchemy | Crystal Mortar | Gem-based reagents |
| Alchemy | Moonstill | Moonpetal / rare-herb distillations |
| Blacksmith | Jeweler's Setting | Gem-inlaid weapons/armor |
| Tailoring | Jewel Loom | Gem-threaded / sequined garments |
| Leatherworking | Scalework Frame | Dragon/wyrm scale armor |
| Woodworker | Resin Press | Livingflame / enchanted-wood items |

Why it works: lets us add rare ingredients without having to fragment recipe tiers by level. A Lv 3 kitchen with a Spice Grinder can cook Spiced Stew; a Lv 7 kitchen *without* one cannot. Mirrors real craft — "I can cook anything, but not without the right gear for this ingredient."

### Self-made tools (intra-building bootstrap)

Every crafting building should be able to make at least one of its own tools. Creates a satisfying bootstrap loop and prevents dead-ends where Building A can't function until Building B is built.

Candidates:

- **Blacksmith → Blacksmith**: Forging Hammer (unlocks Lv 3+ metalwork), Tongs (buff: -10% craft time), Anvil Upgrade (batch +1)
- **Woodworker → Woodworker**: Whittling Knife (homestead, implicit), Drawknife (unlocks Lv 3+ shaped wood)
- **Alchemy → Alchemy**: Herb Press (buff: +1 output on herb potions), Crystal Mortar (gem-ingredient gate)
- **Tailoring → Tailoring**: Pattern Book (buff: +10% fitted cloth yield)
- **Leatherworking → Leatherworking**: Flesher (unlocks Lv 3+ hide processing)
- **Brewery → Brewery**: Wort Paddle (buff: +1 ale per batch)

Blacksmith is special because it makes the *metal parts* of everyone else's tools — its self-made tools unblock the whole tree. That's already the case implicitly (most unlock tools cost iron). Making the hammer an actual installable tool makes the bootstrap explicit.

### Component / sub-material chains

Distinct from tools. A **component** is a crafted intermediate good that gets consumed per-craft at another building, like how wool → cloth → clothing already works. Tools sit in slots; components get spent.

Candidate chains:

- **Wooden Sword Handle** (Woodworker) → consumed by Blacksmith sword recipes. Upgrade tier: carved hardwood handle with grip.
- **Leather Grip Wrap** (Leatherworking) → consumed by Blacksmith weapon recipes at Lv 4+. Distinguishes "rough iron club" from "fitted sword."
- **Iron Nails** (Blacksmith) → consumed by Woodworker for fine furniture, chests, fittings.
- **Brass Fittings** (Blacksmith) → required for Alchemy's Alembic and Brewery's Copper Kettle recipes.
- **Dyed Thread** (Tailoring) → consumed by Leatherworking for decorative armor stitching.

This turns weapons into multi-building crafts: a proper sword is iron (mine) + Wooden Handle (Woodworker) + Leather Grip (Leatherworking) + Blacksmith time. Slow to set up, rewarding once the chain is running.

### Gemcutting — new building, new component tier

New building proposal: **Gemcutter** (or Jeweler), unlocked at Town tier. Consumes raw `gems` (which already exist via iron-mining procs) and produces:

- **Cut Gem** (base component) — consumed by Blacksmith, Tailoring, Alchemy recipes as an optional premium input
- **Faceted Sigil** (higher tier) — consumed by enchanting recipes, trinket slots

Knock-on recipes this enables:

- Blacksmith: **Gem-Inlaid Sword** (iron + wooden handle + cut gem) — unique stat bonus
- Tailoring: **Jeweled Circlet** — ceremonial, noble-visitor-event fodder
- Alchemy: **Focus Crystal** — trinket-slot item with stat boost
- Jewelry trinket slot items in general — a whole new item subcategory for the adventurer equipment system

This is a meaningful chunk of content. Probably its own design doc when it gets closer.

### Tag taxonomy

If we're going to use ingredient tags for gating, we should define them once and reuse everywhere. Draft tags:

- `exotic_spice` — pepper, cinnamon, chili, saffron
- `tea_leaf` — tea
- `rare_herb` — nightbloom, moonpetal
- `gem_material` — cut gem, faceted sigil (when Gemcutter exists)
- `enchanted_wood` — livingflame bead, resin-bound items
- `dragon_part` — wyrmshell plate, dragon scale (if/when dragons drop materials)
- `spirit_essence` — ghost / phantom drops

Each tool declares which tags it unlocks. Each ingredient declares its tags. Recipe is craftable if **all** its ingredient tags are covered by installed tools (or the ingredient has no tag).

This is the cleanest long-term shape. Worth landing the taxonomy early so we don't have to retrofit.
