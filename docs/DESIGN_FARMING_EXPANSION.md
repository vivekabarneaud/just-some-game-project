# Farming Expansion — Beehives, Orchards, Mushrooms & Cheese

**Status:** BUILT (2026-06-05 audit). Apiary/honey, orchards/fruit, forager mushrooms, and kitchen cheese are all live. NOTE: this content is duplicated in DESIGN_FOOD_SCROLLS_LOYALTY.md §1 — treat this doc as the authoritative copy.

## Overview

Four additions to the farming system that create new resources for Tavern food crafting and add depth to the farming page. Each follows existing patterns (gardens, livestock pens) and fits into the current UI.

---

## 1. Beehives (Honey)

### Concept
Beehives are a new section on the farming page, visually alongside livestock pens. Bees produce honey — a luxury ingredient used in sweet recipes. Low-maintenance, seasonal, slow yield.

### Why a separate section (not a pen type)?
Bees don't eat grain like livestock. They don't produce "food" in the general sense (citizens don't eat honey for sustenance). Mixing them into pens would require special-casing the consumption/production logic. A separate "Apiary" section is cleaner and gives the farming page a 4th pillar: Fields, Gardens, Pens, Apiary.

### Data Model

```typescript
// New file: src/data/apiary.ts

export interface ApiaryDefinition {
  baseHoneyPerHour: number;
  seasonalModifiers: Record<Season, number>;
}

export const APIARY: ApiaryDefinition = {
  baseHoneyPerHour: 2,
  seasonalModifiers: {
    spring: 1.0,    // Full production — blossoms
    summer: 1.0,    // Full production
    autumn: 0.5,    // Reduced — flowers fading
    winter: 0,      // Dormant — bees hibernate
  },
};
```

```typescript
// In shared/src/gameState.ts — new state
export interface PlayerHive {
  id: string;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
}

// Add to GameState:
hives: PlayerHive[];
honey: number;  // stored honey resource
```

### Mechanics

| Property | Value | Notes |
|----------|-------|-------|
| Max hives | 4 | Enough to supply recipes without flooding |
| Max level | 5 | Smaller scale than pens (8) — honey is a luxury |
| Base production | 2 honey/hour/level | Slow but steady |
| Consumption | 0 | Bees forage on their own |
| Seasonal | 100%/100%/50%/0% | Spring/summer/autumn/winter |
| Storage | Base 30, +15 per hive level | Small cap — use it or lose it |
| Unlock | Village tier | Same as Tavern (needs both for food crafting) |

### Costs

| Level | Wood | Stone | Gold |
|-------|------|-------|------|
| Build (Lv 1) | 15 | 5 | 30 |
| Per upgrade | ×1.3 | ×1.3 | +20/level |

Cheaper than livestock pens — bees are low-investment.

### Production Scaling
```
honeyPerHour = APIARY.baseHoneyPerHour × hiveLevel × 1.1 × seasonalModifier
```
Same `level × 1.1` pattern as gardens and pens.

### UI on Farming Page
- New section header: "🐝 Apiary" between Pens and a future Orchards section
- Each hive shown as a card (same style as pen cards)
- Card shows: level, honey/hour, seasonal status
- "Dormant" badge in winter (like how gardens show "Off-season")
- Build button follows same pattern as "New Pen" / "New Garden"

---

## 2. Orchards (Fruit)

### Concept
Orchards are a new section on the farming page. Players plant fruit trees that take time to mature but then produce fruit seasonally. Three fruit types with different harvest windows.

### Why orchards feel different from gardens
Gardens produce continuously during active seasons. Orchards have a **maturation period** — newly planted trees don't bear fruit for their first year. This makes orchards a long-term investment, rewarding patient players. Once mature, they produce reliably each year with no replanting needed.

### Data Model

```typescript
// New file: src/data/orchards.ts

export type FruitId = "apples" | "pears" | "cherries";

export interface FruitDefinition {
  id: FruitId;
  name: string;
  icon: string;
  description: string;
  harvestSeasons: Season[];    // seasons when fruit is produced
  baseRate: number;            // fruit per hour when active
  maturationSeasons: number;   // seasons until first harvest (e.g., 4 = 1 year)
}

export const FRUITS: FruitDefinition[] = [
  {
    id: "apples",
    name: "Apple Trees",
    icon: "🍎",
    description: "The backbone of any orchard. Reliable autumn harvest, keeps well through winter.",
    harvestSeasons: ["autumn"],
    baseRate: 5,
    maturationSeasons: 4,  // 1 full year
  },
  {
    id: "pears",
    name: "Pear Trees",
    icon: "🍐",
    description: "Elegant fruit trees. Bear fruit from late summer through autumn.",
    harvestSeasons: ["summer", "autumn"],
    baseRate: 3,
    maturationSeasons: 4,
  },
  {
    id: "cherries",
    name: "Cherry Trees",
    icon: "🍒",
    description: "Beautiful blossoms in spring, precious fruit in summer. Short harvest window, but prized for sweets.",
    harvestSeasons: ["summer"],
    baseRate: 3,
    maturationSeasons: 4,
  },
];
```

```typescript
// In shared/src/gameState.ts
export interface PlayerOrchard {
  id: string;
  fruit: FruitId;
  level: number;
  upgrading: boolean;
  upgradeRemaining?: number;
  seasonsGrown: number;     // how many seasons since planting (maturation tracker)
  mature: boolean;          // true once seasonsGrown >= maturationSeasons
}

// Add to GameState:
orchards: PlayerOrchard[];
fruit: number;  // stored fruit resource (all types combined)
```

### Mechanics

| Property | Value | Notes |
|----------|-------|-------|
| Max orchards | 4 | Same as hives — luxury production |
| Max level | 6 | |
| Maturation | 4 seasons (1 year) | Newly planted trees are "Saplings" |
| Base production | 3-5 fruit/hour/level | Varies by fruit type |
| Consumption | 0 | Trees maintain themselves |
| Unlock | Village tier | |

### Maturation
- `seasonsGrown` increments by 1 each season transition in `advanceSeason()`
- Once `seasonsGrown >= maturationSeasons`, the orchard is marked `mature = true`
- Only mature orchards produce fruit during their harvest seasons
- UI shows "Sapling — [N] seasons until first harvest" for immature orchards
- This creates a nice moment: "My cherry trees are finally bearing fruit!"

### Seasonal Production

| Fruit | Spring | Summer | Autumn | Winter |
|-------|--------|--------|--------|--------|
| Apples | 0 (blossoming) | 0 | 100% | 0 |
| Pears | 0 (blossoming) | 100% | 100% | 0 |
| Cherries | 0 (blossoming) | 100% | 0 | 0 |

Spring could show a cosmetic "Blossoming" status on orchard cards — pure flavor, no production.

### Costs

| Level | Wood | Stone | Gold |
|-------|------|-------|------|
| Plant (Lv 1) | 25 | 10 | 40 |
| Per upgrade | ×1.3 | ×1.3 | +25/level |

Slightly more expensive than gardens (you're planting trees, not seeds).

### Single Resource or Per-Fruit?
**Recommendation: single `fruit` resource.** Same pattern as how all vegetables are just "food" for diversity purposes. Recipe names suggest specific fruits (Cherry Cheese Plate, Fruit Tart) but the ingredient is just "fruit." This keeps the resource UI clean and avoids 3 separate storage caps.

If later we want per-fruit recipes (apple pie specifically needs apples), we can split — but for now, simplicity wins.

### UI on Farming Page
- New section header: "🌳 Orchards" after Apiary
- Orchard cards show: fruit type, level, status (Sapling/Blossoming/Harvesting/Dormant)
- Immature orchards show a progress indicator: "Sapling — 2/4 seasons"
- Fruit picker modal when planting (same pattern as veggie picker for gardens)
- Build button: "Plant Orchard"

---

## 3. Mushrooms (Forager Secondary)

### Concept
The Forager's Hut gains mushrooms as a secondary product, alongside its existing berries (food) and fiber. No new building needed.

### Mechanics

| Property | Value | Notes |
|----------|-------|-------|
| Source | Forager's Hut | Secondary product |
| Base rate | 1.5 mushrooms/hour/level | Slower than berries |
| Seasonal | 25%/100%/100%/0% | Best in summer/autumn, some in spring, none in winter |
| Storage cap | 100 | Small cap, shared with general material storage pattern |

### Implementation
- Add `mushrooms: number` to GameState
- In the forager production tick, add mushroom production alongside fiber
- No new building, no new UI section — just a new resource line in the forager's output

### Resource Type
Mushrooms are a **material** (like herbs, leather, wool) — not a food type for diversity purposes. They're used only as a crafting ingredient in Tavern recipes. Citizens don't eat raw mushrooms for sustenance.

---

## 4. Cheese (Tavern Recipe)

### Concept
Cheese is a processed good crafted at the Tavern kitchen from goat milk. It's a cooking ingredient, not a standalone food.

### Mechanics

| Property | Value |
|----------|-------|
| Recipe | 3 Milk → 1 Cheese |
| Crafting location | Tavern kitchen (same tab as food recipes) |
| Tavern level required | 2 |
| Craft time | Same as other Tavern recipes |

### Resource Type
Cheese is stored as a **material** counter (`cheese: number` in GameState). It's consumed by recipes that use it (Cheese Bread, Cherry Cheese Plate).

### Alternative: Auto-conversion
If manual crafting feels tedious, cheese could auto-produce whenever the Tavern is active and milk is available (like how the Brewery converts grain to ale). But this removes player choice and creates a passive drain on milk. **Recommendation: manual crafting for now.** It's one extra recipe in the Tavern tab and gives the player control over their milk supply.

---

## Farming Page Layout (Updated)

Current:
```
🌾 Fields (8 max)
🥬 Gardens (6 max)
🐄 Livestock (6 max)
```

New:
```
🌾 Fields (8 max)
🥬 Gardens (6 max)
🐄 Livestock (6 max)
🐝 Apiary (4 max)
🌳 Orchards (4 max)
```

Each section follows the same card-grid pattern. The page grows vertically but stays consistent in style.

---

## Resource Summary

| New Resource | Source | Storage | Used For |
|-------------|--------|---------|----------|
| Honey | Apiary | 30 + 15/hive level | Sweet recipes (Honeycake, Fruit Tart, Spiced Honeycake) |
| Fruit | Orchards | 50 + 20/orchard level | Sweet/fresh recipes (Fruit Tart, Cherry Cheese Plate) |
| Mushrooms | Forager's Hut (secondary) | 100 (flat cap) | Hearty/smoky recipes (Grilled Mushrooms, Hunter's Stew) |
| Cheese | Tavern kitchen (from milk) | 50 (flat cap) | Hearty recipes (Cheese Bread, Cherry Cheese Plate) |

---

## Implementation Order

1. **Mushrooms** — simplest, just add a secondary resource to forager production tick
2. **Honey + Apiary** — new section on farming page, new resource, follows pen pattern
3. **Fruit + Orchards** — new section, maturation mechanic is the most complex part
4. **Cheese** — depends on Tavern kitchen tab (implemented alongside food crafting)

Steps 1-3 can be done independently of the food crafting system — they just produce resources that sit in storage until recipes exist to consume them. Step 4 is part of the Tavern crafting implementation.

---

## 5. Garden crops, recipes & rare seeds (design in progress, 2026-07-03)

Turning gardens from "basic food sources" into a **diversity + discovery** layer. Building on the seed system already shipped (per-crop seeds, seed-capacity, self-sustaining harvest).

### Decided
- **Staples stay; specialties unlock by SEED (DECIDED 2026-07-03 — supersedes the earlier "generic plots + exponential cost" idea).** Keep the current predefined veggies as the **staple gardens, exactly as they are** — no garden-creation refactor, the per-veggie slot model stays. NEW/specialty crops are **gated behind acquiring their seed** (market stock, mission rewards, rare drops): once you own a crop's seed, its garden becomes buildable + sowable. **Seed-unlock is the SOLE gate** — no exponential plot cost (that was the rejected framing). Scarcity/pacing come from *unlocking crops through play*, not from plot cost. Why this won: it's progression-y (unlock → grow), far lower-risk (reuses the shipped seed system + the existing per-veggie slots), and it keeps engagement flowing across the *whole* game (every scout/mission/market can drop a new seed → a new crop to add), not just the opening. The staples fill the early scout-wait; specialties are the ongoing carrot.
- The light seasonal **re-sow ritual stays** for all crops (self-sustaining seed, prompted by the farming pulse) — cosy, not a chore.
- **Every crop and recipe needs a SOURCE and a USE** (clutter guard). A crop justifies itself by feeding food-variety happiness, a recipe, a loyalty treat, or a trade good — not by existing.
- **Recipes are sourced DISCOVERIES, not a flat list.** Two channels: (a) **monster loot** — the existing loot-recipe drops; (b) **character-taught signature dishes** — an adventurer/founder teaches a dish as loyalty grows (e.g. **Brenna's honey cake, learned from her mother**). Ties cooking into the cast, the tavern-conversation/loyalty arc, and the cast files; every founder can own a dish.
- **Rare seeds** = a progression/collectible layer. Acquired via the market (occasional stock, exponential price) and **mission rewards** (à la loot recipes). Rare seed → rare crop → a recipe you earned → a dish with a real use. Rare seeds create the pressure that makes scarce early plots interesting.

### Open (reflecting)
- **The crop roster + each crop's purpose** — see the working list below; needs curation (start small, 2-3 new crops with real roles).
- The exponential plot-cost curve (base + multiplier; gold vs wood/stone).
- Whether **strawberries** are a garden crop (low, cultivated, distinct from the forager's *wild* berries) or belong with Orchards (§2). Leaning garden crop.
- How rare seeds gate (pure market luck vs mission-locked vs both — leaning both).
- Interaction with the already-planned honey/orchard/mushroom/cheese systems (recipes should span all of them).

### Working crop-purpose framework
Every crop slots into at least one PURPOSE so nothing is filler:
- **Staple food** (raw calories, seasonal stagger for year-round supply) — the current 5: peas, turnips, cabbages, squash, fava.
- **Sweet / treat** — e.g. strawberries → jam/dessert recipe + happiness/loyalty treat. Cultivated, distinct from foraged wild berries.
- **Aromatic / flavor base** — e.g. onions/garlic/herbs → unlock better dishes (recipe ingredient, cooking depth).
- **Preserving / winter security** — storage crops that carry the settlement past frost (squash/cabbage already lean this way).
- **Cash crop / trade good** — a high-value crop for the exponential marketplace.
- **Rare / progression** — rare-seed-only crops feeding prized recipes or a unique buff (the payoff of the rare-seed layer).

Current 5 veggies are all pure "staple food" (baseRate 4-5, no other role) — the expansion adds crops that hit the other purposes.

### Candidate crops (climate: cool-temperate, central-European-like)
- **Strawberries** (sweet/treat) — cultivated, distinct from the forager's WILD berries. Plant spring → produce summer. → strawberry jam + a happiness treat / gift. Pairs with Brenna's honey cake (honey + berries).
- **Onions / aromatics** (flavor base) — stores well. The recipe INGREDIENT that unlocks heartier cooked dishes; gives cooking its depth (a stew wants an aromatic).
- **Culinary herbs** (thyme/sage) — cooking flavor/quality. Kept DISTINCT from the forager's wild medicinal/alchemy herbs (cultivated-culinary vs foraged-medicinal — no niche overlap).
- **Hops** (cash / cross-system) — very on-climate (beer country). Feeds the existing brewery/ale chain + sells well. "My garden supplies my tavern."
- **Rare: saffron** (rare/progression, via rare seed) — historically a marginal-climate central-European *luxury* (Saffron Walden, Austrian saffron), worth its weight in gold. Reads as special *because* it's hard. → a feast dish + high trade value. Alternatives: grapes (wine chain), a noble melon, a prized medicinal.
- **Grapes** (cash / cross-system) → a **wine** chain. On-climate (Rhine-valley wine country).
- **Melon** (luxury/treat) — noble-garden luxury; a treat/trade crop.
- **Rare alchemy herb (garden, later)** — common alchemy herbs stay on the forager's hut; a *rare* one becomes a cultivable garden crop (rare seed), so the forager keeps its niche and gardens gain a rare-alchemy option. (Resolves the "alchemy herbs in gardens?" question without cannibalizing the forager.)

### Hops ≠ redundant with barley → a tavern DRINK TIER
Barley is the fermentable base; **hops** (houblon) add bitterness + flavor + *preservation* — historically the ale→beer transition. So the drink tier becomes: **Ale** (barley) → happiness; **Beer** (barley + hops) → more happiness / keeps longer; **Wine** (grapes) → premium, a *different* effect — good candidate: **accelerates home HP-regen** (ties to the recovery system, a good vintage speeds the wounded's mending). Each tavern drink = a distinct buff, which is what justifies hops + grapes.

### Seed-choice UI (the "sow" modal)
A modal, one button per seed: **icon + name + owned/capacity**. In-season seeds enabled + highlighted at top; off-season disabled with a tooltip ("Sown in autumn"). Show each crop's **produce window** on the button ("yields summer–autumn"). Undiscovered seeds render as **???**. Makes "only *this* is plantable right now" obvious to a new player.

### Loyalty via favorite food (NOT a new Edda mechanic — for now)
Everything the player does is still "the Lord" (no character-action layer yet), so the cozy gifting loop rides the EXISTING mission food-packing: flavor-matched food already buffs; add that packing an adventurer's **true favorite dish** for a mission gives a **bigger buff + a small loyalty bump.** Lord-consistent (provisioning your people well), reuses existing plumbing. Edda's daily cozy-gifting stays parked as a *future* layer if/when character-driven actions exist.

### Discovery surfacing: in-game ??? + external wiki
Recipes/crops/seeds use the existing **???-until-discovered** pattern (like monster discovery + the encyclopedia): the in-game list teases that content exists without spoiling it; a **separate community wiki** (wowhead-style) holds full details for completionists. In-game stays about discovery; the wiki is the reference.

### PARKED: Tavern travelers + custom menu → passive gold
With ale/beer/wine + dish diversity, give the tavern an *economic* role: travelers pass through, the player defines their own **menu** (drinks + dishes), and it earns **passive gold** scaled by variety/quality (a default menu so it's never mandatory). Turns the crop → drink/recipe web into an income engine. Late-game hook; design later.

*Economy-fiction note:* that gold (and all settlement gold) is the **common purse** the Lord *stewards*, not personal/noble wealth — the tavern's takings pool into the shared coffer like everything else. The internal gold-income "tax" (citizen adults) is really the folk's shared contribution — no internal levy on their own band; adventurers pay in via mission spoils. The **real** tax points *outward*: canon has a **Crown tithe** owed to the distant Crown (a cold-notice obligation, not "no taxes" — the "free settlement / fled taxes / Merchant-Republic grant" in `chronicle.ts` is stale v1 per LORE_AUDIT #6). Possible copy pass: rename the internal "tax" → "common purse", reserve "tithe" for the Crown obligation. See the Lord-character memory for the locked framing.

### Gifting is EDDA's domain (not the Lord's)
Cozy gifting (Animal-Crossing/Hello-Kitty inspiration): a cooked dish gifted for a small **loyalty** bump, ~once a day. The LORD handing out cakes reads wrong — but **Edda** (midwife, cellarer, keeper of the hearth) is exactly who does this. So the player grows the crop → cooks the dish → **Edda carries it round** → loyalty. This finally gives Edda a *mechanical verb* (she's currently all lore), and it anchors the whole crop→recipe→loyalty loop in the right character. Ties to [[project_tavern_conversations]] + her cast file.

---

## Lavender — cultivated flower (spec, July 2026)

A garden flower that **sweetens the honey and stocks the tavern's tea and cake**. Reuses the existing garden/seed system — NO new garden type, just a new **specialty crop** the player sows in any empty plot.

- **Grown, not foraged.** Foraged herbs (chamomile, dandelion, nettle…) stay at the Forager's Hut. Lavender is *cultivated*; its harvest is a **grown herb ingredient** (lands in the herb stock, usable by both alchemy and the kitchen — the craft cost path already handles herbs). It must NOT appear in the forager's gather pool.
- **Seed source: the marketplace board**, as a **Meridian** specialty good (lavender = Mediterranean). Buying the seed **unlocks** the crop (specialty-seed flow: `specialty: true`, starts locked/0 seed, `seedsUnlocked.push` on purchase). A Meridian traveling merchant could carry it later.
- **Seasons:** sow spring, bloom summer/autumn — lines up with when bees are active.
- **Two payoffs from one plot:**
  1. **Living blooms boost the apiary** — a passive honey multiplier while a lavender garden is *producing* (bees forage the blooms). Hook into the honey tick: `rate ×= (1 + bonus × #producing lavender gardens)`. No consumption.
  2. **Harvest = dried lavender** — the ingredient for the recipes below.
- **Recipes (the fun part):**
  - **Kitchen → Lavender Tea** (a **Drink** on the tavern menu) + **Lavender Honey Cake** (a **Dessert**; lavender + honey + grain) — fills the thin Drinks/Desserts columns.
  - **Alchemy → Calming Draught** — increases an adventurer's **hourly HP regen** (a recovery accelerant), NOT a flat %HP heal. Needs a **new alchemy effect type** (e.g. `regenBoost:X`) wired into potion consumption + the recovery/regen tick (`REGEN_PCT_PER_HOUR`).
- **Art (user provides, like the portraits):** `garden_lavender.png` (planted plot) + `lavender_seed.png`. Placeholder/emoji until then.
- **Systems touched:** gardens (specialty crop + non-food produce routing to herbs), herbs (new grown herb, excluded from foraging), marketplace (seed offer + unlock), apiary (honey multiplier), alchemy (new regen effect), kitchen (2 recipes), tavern (dishes flow in via existing `kind` tagging). A focused multi-step build, not a one-shot.

**STATUS (2026-07-07):**
- ✅ **Slice 1 BUILT** (commit `0fe8eee`): lavender crop reusing the garden system; a *grown herb* (`dropRate: 0` in HERBS, never foraged; added to VeggieId in both frontend + shared); garden produce routed to `herbs.lavender`; **apiary +15% honey per producing lavender garden**; kitchen recipes **Lavender Tea (drink)** + **Lavender Honey Cake (dessert)**, which auto-appear on the tavern menu via the Phase-2b `kind` tag. Art falls back to 🪻 until `garden_lavender.png` / `lavender_seed.png` are dropped in. **Lavender is NON-`specialty` for now** (sowable from the start).
- ⏸️ **Slice 2 PARKED (likely post-alpha):**
  1. **Market "buy seed" gate** — make lavender `specialty: true` and acquired by *buying the seed*. Seeds today only unlock via `quest.unlocksSeeds`; there's **no market buy-seed mechanism yet**, and the intended flavor source is a **Meridian merchant, which doesn't exist yet** (traveling-merchant roster is Dominion/Greyford only). So this waits on either a Meridian merchant or a generic marketplace-board seed offer. Until then, lavender stays sowable from the start.
  2. **Calming Draught (alchemy)** — a **new `regenBoost` effect type** (speeds hourly HP regen; current alchemy effects are strings like `healPct:25`). Needs the effect wired into potion consumption + the recovery/regen tick. Ties to [[project_adventurer_recovery]].

---

## Orchard Saplings — planting rework (spec, July 2026)

**Status:** DESIGNED. Build **post-alpha** (engine + save-state work; alpha saves are disposable so no migration). Makes orchards *feel planted* and stops an upgrade from conjuring a full-grown grove. Mirrors the garden seed/capacity model, adapted for perennials.

### The problem
Today an orchard is one abstract unit: `PlayerOrchard { level, seasonsGrown, mature }`. The whole orchard matures once (`seasonsGrown >= maturationSeasons → mature`), then produces at a level-scaled rate. There's **no planting act**, and **upgrading** just raises the rate as if new trees sprang up grown. Next to fields (sow in spring) and gardens (sow seeds into capacity), orchards read as strangely automatic.

### The model (saplings = seeds, tree-slots = capacity)
- **Level → tree slots.** `treeSlots(level)` is the orchard's capacity, exactly like a garden's seed capacity. Levelling up **adds empty slots**, it does not add grown trees.
- **Plant saplings into slots.** The player buys saplings (gold) and plants them into free slots — the orchard's equivalent of sowing. A sapling occupies a slot immediately but bears nothing yet.
- **Per-cohort maturation** (avoids per-tree records). Track sapling cohorts by plant time; reuse the existing `maturationSeasons`. Each season tick ages every cohort; a cohort that reaches `maturationSeasons` **converts to mature trees**. Because you plant at different times, groves mature in waves ("the cherries I planted last year are finally bearing").
- **Yield scales with mature trees**, not level. `fruitRate = matureTrees × perTreeRate(level)` during the fruit's `harvestSeasons`. Level can still buff `perTreeRate` (better husbandry) but **an unplanted orchard produces nothing**.
- **Perennial, not annual.** Unlike gardens (replant each spring), a mature tree keeps bearing every year — plant once, harvest for the settlement's life. Trees are self-maintaining (no upkeep, consistent with today).

### State shape (proposed)
```
interface OrchardCohort { count: number; seasonsGrown: number; }   // saplings still maturing
interface PlayerOrchard {
  id; fruit; level; upgrading; upgradeRemaining?;
  matureTrees: number;          // bearing trees
  saplings: OrchardCohort[];    // not yet bearing
  // (drop the old whole-orchard `seasonsGrown` / `mature`)
}
```
`treesPlanted = matureTrees + sum(saplings.count)`; free slots = `treeSlots(level) - treesPlanted`.

### Sapling acquisition
- **Buy on the orchard card** for gold (like `buyLivestock`), simplest first cut: "Plant sapling 💰X".
- **Later:** rare/culture saplings via the **marketplace board / traveling merchants** (e.g. a Meridian olive, a Zah'kari fig) — the same specialty-unlock flow the lavender seed wants. Ties to [[project_traveling_merchants]] and the seed-system design.

### UI (build alongside the mechanic)
Mirror the pen flock box / garden seed box that already exist:
- A framed **Grove box**: `Trees {matureTrees}/{treeSlots} · {saplingCount} growing`, a season/status nudge ("2 saplings — 3 seasons to bear" / "Blossoming" / "Harvesting"), and a **Plant sapling 💰X** button inside it (disabled when slots are full).
- Optionally a **Manage grove** modal (like `PenManageModal`) once bulk-plant or per-cohort detail is wanted.

### Build checklist (post-alpha)
1. `src/data/orchards.ts`: `treeSlots(level)`, `saplingCost(fruit)`, `perTreeRate(level)`.
2. State: `matureTrees` + `saplings[]` on `PlayerOrchard` (both shared + frontend copies); drop `seasonsGrown`/`mature`.
3. Actions: `plantSapling(orchardId)`, season-tick maturation (age cohorts → mature), fruit tick from `matureTrees`.
4. UI: orchard card Grove box + Plant button; "sapling/blossoming/harvesting" statuses from the new counts.
5. Migration: none — reset via SAVE_VERSION bump (alpha saves disposable, per [[feedback_alpha_no_save_preservation]]).
