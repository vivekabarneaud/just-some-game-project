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
- **Crop-choice, not crop-fixed.** Today each garden is tied to one veggie (5 veggies = 5 fixed slots, `MAX_GARDENS = VEGGIES.length`). Change to **generic plots**: a bare plot where the player sows a **season-appropriate seed of their choice**; it produces in that crop's produce-seasons; the light seasonal re-sow (self-sustaining seed) stays — that's the cosy ritual, already prompted by the farming pulse. Swapping a plot's crop = just sow a different seed next cycle. Not "stuck", no new chore.
- **Soft-limit plots by EXPONENTIAL cost, not a hard cap or a forced either/or** (same instinct as the marketplace rework). Start with ~1 plot; each additional plot costs exponentially more. Early game you naturally focus on a crop or two; late game you can afford to grow it all. The price curve decides variety, so the player never faces a punishing "give one up to gain one".
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
