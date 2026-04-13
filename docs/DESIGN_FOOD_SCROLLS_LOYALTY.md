# Food, Scrolls & Loyalty — Design Spec

## Overview

Interconnected systems that deepen the player's relationship with their adventurers and give new purpose to the farming economy:

1. **New Farming Additions** — Beehives (honey), orchards (fruit), cheese processing, mushroom foraging
2. **Tavern Food Crafting** — Cook meals at the Tavern, give them to individual adventurers before missions
3. **Enchanted Scrolls** — Craft scrolls at the Enchanter, apply them as team-wide mission buffs
4. **Loyalty System** — A per-adventurer bond score that grows over time, unlocking small permanent bonuses

None of the mission buffs are mandatory. Combined, food + potions + scroll contribute roughly 5-8% total success chance, making them a nice-to-have, not a gate.

---

## Mission Deploy Screen Rework

### Current Layout
- Left side: adventurer portraits in assigned class slots
- Right side: team supply area (up to 3 shared potions)

### New Layout

**Left side — Per-adventurer slots (under each portrait):**
| Slot | Source | Effect | Scope |
|------|--------|--------|-------|
| Potion | Alchemy Lab | Combat/survival buff | Individual |
| Food | Tavern | Small stat/success buff | Individual |

- Both slots are optional — empty by default
- Click a slot to open a picker showing available items from inventory
- Potions work exactly as they do today (healing, antidote, strength, etc.)
- Food adds a small success bonus (+1-2%), boosted if it matches the adventurer's food preference (+1% extra)
- Visual: potion slot has a flask icon placeholder, food slot has a plate icon placeholder

**Right side — Team scroll slot:**
| Slot | Source | Effect | Scope |
|------|--------|--------|-------|
| Scroll | Enchanter | Small buff to the whole team | All adventurers on mission |

- One scroll slot for the entire mission (not per adventurer)
- Scrolls are consumable — consumed from inventory on deploy
- Scroll buffs are modest: +2-3% success chance, or a specific tactical effect
- Visual: parchment/scroll icon placeholder, shows scroll name + effect when filled

### Buff Budget
The goal is that a fully prepared team (potions + favorite food + scroll) gets a meaningful but not game-breaking edge:

| Source | Bonus | Notes |
|--------|-------|-------|
| Potion (per adventurer) | Existing effects | Death reduction, combat boosts — unchanged |
| Food (per adventurer) | +1-2% success | +1% bonus if matches preference |
| Scroll (team-wide) | +2-3% success | Flat team buff |
| **Total from new systems** | **~5-8%** | Feels rewarding, not mandatory |

---

## 1. New Farming Additions

Four new ingredient sources that expand the farming page and feed into Tavern recipes. Each follows existing patterns (livestock pens, gardens) so they slot into the current UI naturally.

### 1a. Beehives (Honey)

A new section on the farming page, or a new pen type alongside livestock.

**Building:** Apiary (beehive pen)
- Unlocks at: Village tier
- Max hives: 4
- Max level: 5

**Production:**
- Produces: **Honey** (new resource)
- Base rate: 2 honey/hour per hive level
- Consumes: nothing (bees forage freely) — or optionally 1 berry/hour for flavor ("wildflower foraging")
- Storage: base 50 honey, +20 per hive level

**Seasonal modifiers:**
| Season | Production | Notes |
|--------|-----------|-------|
| Spring | 100% | Blossoms everywhere, peak foraging |
| Summer | 100% | Full production |
| Autumn | 50% | Flowers fading |
| Winter | 0% | Bees hibernate |

**Design notes:**
- Honey is a luxury ingredient — used in sweet recipes (honeycake, fruit tarts, mead)
- Low maintenance, slow yield — a "set and forget" farm addition
- Could later feed into a **Mead** recipe at the Brewery (honey ale variant, stronger happiness boost?)
- Follows the livestock pen data pattern: `AnimalId | "bees"`, with `AnimalDefinition` fields

### 1b. Orchards (Fruit)

A new section on the farming page alongside fields and gardens. Fruit trees are long-term investments — slow to mature, but once grown they produce seasonally for free.

**Building:** Orchard plot
- Unlocks at: Village tier
- Max orchards: 4
- Max level: 8

**Fruit types:**

| Fruit | Icon | Harvest Season | Base yield/hour | Notes |
|-------|------|---------------|-----------------|-------|
| **Apples** | Apple | Autumn | 4 | The staple — reliable, versatile in recipes |
| **Pears** | Pear | Late Summer–Autumn | 3 | Slightly rarer, pairs well with cheese |
| **Cherries** | Cherries | Early Summer | 3 | Short harvest window, prized for sweets |

**Seasonal production:**

| Fruit | Spring | Summer | Autumn | Winter |
|-------|--------|--------|--------|--------|
| Apples | 0% (blossoming) | 0% | 100% | 0% |
| Pears | 0% (blossoming) | 50% (late summer) | 100% | 0% |
| Cherries | 0% (blossoming) | 100% (early) | 0% | 0% |

**Maturation mechanic (optional, adds depth):**
- Newly planted orchards take 1 full in-game year before first harvest
- During year 1: "Sapling — not yet bearing fruit"
- After year 1: produces normally each season
- This makes orchards a long-term investment, unlike gardens which produce immediately
- If this feels too punishing, could reduce to 1 season instead of 1 year

**Data pattern:** Follows the garden model:
```
type FruitId = "apples" | "pears" | "cherries"
interface FruitDefinition {
  id: FruitId
  name: string
  icon: string
  description: string
  harvestSeasons: Season[]
  baseRate: number
}
```

**Resource:** All fruits contribute to a single **Fruit** resource type (like how all vegetables are "vegetables" for food diversity purposes), but recipes can require specific fruit types where it matters flavor-wise. Alternatively, keep it simple: just one `fruit` resource, recipe names imply the specific fruit.

### 1c. Cheese (Processed from Milk)

A new processed good, not a new building — cheese is made at the Tavern kitchen or automatically at a dairy building.

**Option A — Tavern kitchen recipe (simpler):**
- Cheese is a crafting recipe at the Tavern, like cooking
- 3 Milk → 1 Cheese
- Available at Tavern Lv 2+

**Option B — Automatic conversion (like grain→ale):**
- A new processing step: goat pens produce milk, milk auto-converts to cheese at a rate
- Would need a "Dairy" building or just a Tavern upgrade

**Recommendation:** Option A — keeps it simple, cheese is just another Tavern recipe alongside food. The player crafts cheese when they need it for recipes.

**Usage:** Cheese is a cooking ingredient used in savory/hearty recipes (cheese pie, cheese and bread, fondue). It's also a food type that contributes to food diversity happiness.

### 1d. Mushrooms (Forager Secondary)

**Source:** Forager's Hut produces mushrooms as a secondary product (like how Hunting Camp produces meat + leather).

**Production:**
- Rate: 2 mushrooms/hour per forager hut level
- Seasonal: 50% spring, 100% summer, 100% autumn, 0% winter
- Storage: shared with general food or a small dedicated cap (100)

**Usage:** Cooking ingredient with an earthy, umami quality. Used in hearty/smoky recipes (mushroom stew, grilled mushrooms). Also contributes to food diversity.

**Alternative:** Mushrooms could come from a dedicated "Mushroom Cave" or "Root Cellar" building, but the forager secondary is simpler and gives the Forager's Hut more value.

### Summary of New Resources

| Resource | Source | Type | Used In |
|----------|--------|------|---------|
| Honey | Apiary (beehives) | Raw ingredient | Sweet recipes, mead (future) |
| Apples / Pears / Cherries (→ Fruit) | Orchards | Raw ingredient | Sweet/fresh recipes |
| Cheese | Tavern kitchen (from milk) | Processed good | Hearty/smoky recipes |
| Mushrooms | Forager's Hut (secondary) | Raw ingredient | Hearty/smoky recipes |

---

## 2. Tavern Food Crafting

### Concept
The Tavern gains a crafting tab (similar to Blacksmith/Alchemy). Players cook meals using food resources (grain, meat, berries, herbs, vegetables). Meals are stored in inventory and can be assigned to adventurers on the deploy screen.

### Building Requirement
- Tavern Level 2+ unlocks the kitchen (crafting tab)
- Higher Tavern levels unlock more recipes

### Food Flavor Tags
Every food item has one or more flavor tags. Every adventurer has one food preference (a flavor they love). A food matches if **any** of its tags matches the adventurer's preference — multi-tag foods are more versatile but not strictly stronger (single-tag foods are cheaper to craft).

| Tag | Description | Personality Trait | Icon |
|-----|-------------|-------------------|------|
| `sweet` | Honey, fruit, pastries, candied things | "Has a sweet tooth" | Honey pot |
| `spicy` | Peppered, fiery, bold, chili-laced | "Loves the burn" | Chili pepper |
| `hearty` | Thick stews, meat pies, filling comfort food | "Big appetite" | Stew pot |
| `smoky` | Grilled, charred, smoked meats, campfire-cooked | "Campfire soul" | Campfire |
| `fresh` | Herb salads, raw berries, spring greens, light | "Likes it light" | Leaf sprig |

### Recipes

Simple recipes (1 tag) are cheap and unlock early. Complex recipes (2 tags) cost more, unlock later, and are more versatile but not more powerful. This rewards players who learn their team's preferences while giving a fallback for those who want to cook one dish for everyone.

**Tier 1 — Simple (1 tag, Tavern Lv 2-3):**

| Recipe | Tags | Ingredients | Tavern Lv | Effect |
|--------|------|-------------|-----------|--------|
| Honeycake | sweet | 2 Wheat, 1 Honey | 2 | +1% success |
| Peppered Jerky | spicy | 2 Meat, 1 Wild Herbs | 2 | +1% success |
| Fresh Herb Salad | fresh | 1 Wild Herbs, 1 Cabbages, 1 Berries | 2 | +1% success |
| Smoked Fish | smoky | 2 Fish, 1 Wood | 2 | +1% success |
| Meat Pie | hearty | 2 Meat, 2 Wheat | 3 | +1% success |
| Cheese Bread | hearty | 1 Cheese, 2 Wheat | 3 | +1% success |
| Grilled Mushrooms | smoky | 2 Mushrooms, 1 Wild Herbs | 3 | +1% success |
| Fruit Tart | sweet | 2 Fruit, 1 Wheat, 1 Honey | 3 | +1% success |

**Tier 2 — Complex (2 tags, Tavern Lv 4-5):**

| Recipe | Tags | Ingredients | Tavern Lv | Effect |
|--------|------|-------------|-----------|--------|
| Hunter's Stew | hearty, smoky | 2 Meat, 1 Mushrooms, 1 Turnips | 4 | +1% success |
| Spiced Honeycake | sweet, spicy | 2 Wheat, 1 Honey, 1 Wild Herbs | 4 | +1% success |
| Pea & Mint Bowl | fresh, spicy | 2 Peas, 1 Wild Herbs, 1 Eggs | 4 | +1% success |
| Cherry Cheese Plate | sweet, fresh | 1 Fruit, 1 Cheese, 1 Wild Berries | 5 | +1% success |
| Smoked Pork Roast | smoky, hearty | 2 Meat, 1 Squash, 1 Wood | 5 | +1% success |
| Fisherman's Broth | fresh, hearty | 2 Fish, 1 Cabbages, 1 Wild Herbs | 5 | +1% success, -10% death chance |

**Special recipe — Cheese (processed good):**

| Recipe | Ingredients | Tavern Lv | Notes |
|--------|-------------|-----------|-------|
| Cheese | 3 Milk | 2 | Not a mission food — a crafting ingredient for other recipes |

**Design note on multi-tag balance:** Dual-tag recipes cost more ingredients and require higher Tavern levels, but their effect is the same or weaker than single-tag equivalents. The advantage is purely in versatility — one recipe covers two preference types. A player who knows their team's preferences and crafts targeted single-tag foods is just as effective.

**Ingredient coverage:** The 14 recipes across both tiers create demand for nearly every food source:

| Source | Ingredients Used | Recipes |
|--------|-----------------|---------|
| Farms (wheat) | Wheat | Honeycake, Meat Pie, Cheese Bread, Fruit Tart, Spiced Honeycake |
| Hunting Camp | Meat | Peppered Jerky, Meat Pie, Hunter's Stew, Smoked Pork Roast |
| Fishing Hut | Fish | Smoked Fish, Fisherman's Broth |
| Chicken Pens | Eggs | Pea & Mint Bowl |
| Goat Pens | Milk (→ Cheese) | Cheese Bread, Cherry Cheese Plate |
| Gardens | Cabbages, Turnips, Peas, Squash | Herb Salad, Hunter's Stew, Pea & Mint Bowl, Smoked Pork Roast, Fisherman's Broth |
| Forager's Hut | Berries, Mushrooms | Herb Salad, Grilled Mushrooms, Hunter's Stew, Cherry Cheese Plate |
| Herbalist | Wild Herbs | Peppered Jerky, Herb Salad, Grilled Mushrooms, Spiced Honeycake, Pea & Mint Bowl, Fisherman's Broth |
| Apiary | Honey | Honeycake, Fruit Tart, Spiced Honeycake |
| Orchards | Fruit | Fruit Tart, Cherry Cheese Plate |

### Favorite Food Matching
- Each adventurer is assigned a `foodPreference` tag on generation (one of the 5 flavor tags)
- When **any** of the food's tags matches the adventurer's preference: **+1% additional success bonus**
- The preference is visible on the adventurer's portrait/card as a small icon
- The food picker on the deploy screen highlights matching foods with a subtle glow or heart icon
- Multiple matching tags don't stack — it's a binary match/no-match

### Future Expansion
- **Tier 3 recipes** at Tavern Lv 6+ with rare mission-drop ingredients (e.g., "Dragon Pepper Roast" — spicy+smoky, requires dragon peppers from expeditions)
- **Seasonal recipes** unlocked only during specific seasons (e.g., Cherry Clafoutis in summer, Winter Comfort Stew)
- **Mead** at the Brewery (honey + malt → mead, stronger happiness boost than ale)
- **Three-tag recipes** as rare/legendary unlocks from special events
- **Specific fruit sub-recipes** if orchards warrant it (apple pie vs cherry tart vs pear compote)

---

## 2. Enchanted Scrolls

### Concept
The Enchanting shop gains a "Scrolls" crafting tab alongside its existing equipment enchantment UI. Scrolls are consumable team-wide buffs applied in the mission scroll slot.

### Building Requirement
- Mage Tower Level 2+ unlocks scroll crafting
- Higher levels unlock more powerful scrolls

### Scroll Recipes (5 base scrolls)

| Scroll | Ingredients | Mage Tower Level | Effect |
|--------|-------------|------------------|--------|
| Scroll of Fortitude | 2 Mana Crystals, 1 Iron Bars | 2 | +2% team success, +10% team defense (combat) |
| Scroll of Swiftness | 2 Mana Crystals, 1 Wild Herbs | 2 | -10% mission duration |
| Scroll of Warding | 3 Mana Crystals, 1 Heartstone | 3 | -25% team death chance |
| Scroll of Insight | 2 Mana Crystals, 1 Shimmer | 3 | +3% team success |
| Scroll of Bounty | 3 Mana Crystals, 2 Gold | 4 | +15% mission loot |

### Design Notes
- Scrolls are **consumable** — crafted, stored in inventory, consumed when the mission deploys (same as food and potions)
- Scrolls use Mana Crystals as a base ingredient (ties them to the Mage Tower economy)
- Some scrolls require rare enchanting materials (heartstone, shimmer) — shared economy with gear enchanting
- Only one scroll per mission — the player chooses which buff matters most
- Scrolls are team-wide, so they don't interact with individual adventurer preferences (no matching game — that's the food's job)
- A scroll should never be strictly better than all others — each has a niche

---

## 3. Loyalty System

### Concept
Each adventurer has a `loyalty` score (0-100) that represents their bond with the settlement. Loyalty grows slowly over time through positive interactions and unlocks small permanent stat bonuses at milestone ranks.

### Loyalty Ranks

| Rank | Threshold | Title | Bonus |
|------|-----------|-------|-------|
| 0 | 0 | Stranger | — |
| 1 | 15 | Familiar | +1 to primary stat |
| 2 | 35 | Trusted | +2% crit chance |
| 3 | 60 | Devoted | +3% success on all missions |
| 4 | 85 | Bonded | +5% loot, cosmetic title ("Loyal [Name]") |

### Loyalty Sources

| Action | Loyalty Gained | Notes |
|--------|---------------|-------|
| Successful mission | +2 | Base gain per completed mission |
| Fed favorite food | +3 | Only when the food matches their preference |
| Fed any food | +1 | Still rewards caring, even without matching |
| Surviving a dangerous mission | +1 | Bonus for red/orange difficulty missions |
| Time in roster (per game-week) | +0.5 | Passive — just for keeping them around |

### Loyalty Decay
- **None by default.** Loyalty only goes up. The tension comes from permadeath — if an adventurer dies, all that loyalty is lost forever. That's punishment enough.
- A future negative event (e.g., "tavern brawl") could reduce loyalty slightly, but not in the initial version.

### Design Philosophy
Loyalty bonuses are deliberately small. The real reward is emotional:
- Seeing "Bonded" next to a veteran adventurer's name
- The gut-punch when a Bonded adventurer dies on a risky mission
- The satisfaction of a full roster of Devoted+ adventurers after careful play

Loyalty should feel like a **journal of your care**, not a power curve to optimize.

### Display
- Loyalty bar on the adventurer detail page (similar to XP bar, but separate)
- Current rank title shown on the roster card, next to their name
- Rank-up notification in the event log: "[Name] is now Trusted!"
- Loyalty rank icon on the deploy screen portrait (subtle, like a small shield or heart)

---

## Interaction Between Systems

### Synergies
- Feeding favorite food grows loyalty faster, which unlocks permanent bonuses — rewards learning each adventurer's preference
- Scrolls pair well with any team — no per-adventurer optimization needed, good for players who want simpler prep
- Potions remain the "insurance" slot (death reduction, combat survival), food is the "care" slot, scrolls are the "strategy" slot

### Assassin "Poisoner's Touch" Talent
- Existing talent idea: assassin boosts potion efficiency for the group
- Food and scrolls are intentionally NOT affected by this — keeps the talent focused on potions

### Economy Impact
- Food recipes create demand across **nearly every food source** — wheat, meat, fish, eggs, milk, vegetables, berries, herbs, honey, fruit, mushrooms. Currently most of these just feed the generic food pool; now players have a reason to diversify production
- Honey and fruit are new resources that only matter for cooking — they give beehives and orchards a clear purpose
- Cheese creates a milk→cheese processing chain that adds depth to goat farming
- Scroll recipes consume mana crystals + enchanting materials — competes with gear enchanting, creating meaningful resource allocation decisions
- The cooking system turns surplus food into mission consumables, giving farmers a late-game purpose beyond just "feed citizens"

---

## Implementation Notes

### New Data Fields

**Adventurer:**
```
foodPreference: "sweet" | "spicy" | "hearty" | "smoky" | "fresh"
loyalty: number          // 0-100
loyaltyRank: number      // 0-4, derived from loyalty thresholds
```

**ActiveMission (reworked supplies):**
```
// Replace current flat supplies array with:
adventurerSupplies: Record<string, {    // keyed by adventurer ID
  potion?: string       // item ID
  food?: string         // item ID
}>
scroll?: string         // item ID, team-wide
```

**New Item Fields:**
```
foodFlavors?: ("sweet" | "spicy" | "hearty" | "smoky" | "fresh")[]  // one or more tags
scrollEffect?: { ... }  // team-wide buff definition
```

### New UI Components
- Tavern crafting tab (reuse CraftingPage pattern)
- Enchanter scroll crafting tab (new tab on Enchanting page)
- Per-adventurer supply slots on MissionAssemblyPanel (replaces current shared supply picker)
- Team scroll slot on MissionAssemblyPanel
- Loyalty bar + rank display on AdventurerDetail
- Food preference icon on adventurer portrait/card

### New Resource Types
```
honey: number        // from apiaries
fruit: number        // from orchards (apples, pears, cherries combined)
cheese: number       // processed from milk at Tavern
mushrooms: number    // forager's hut secondary product
```

### Suggested Implementation Order
1. **Loyalty system** — simplest, no new UI crafting needed, just a score + display
2. **Food preference field** — add to adventurer generation, display icon on cards
3. **Farming additions** — beehives, orchards, mushroom foraging, cheese recipe (new resources needed before food crafting)
4. **Per-adventurer supply slots** — refactor MissionAssemblyPanel layout (moves existing potion logic)
5. **Tavern food crafting** — new recipes, crafting tab, food items in inventory
6. **Scroll crafting** — new Enchanting tab, scroll items, team scroll slot
7. **Wire it all together** — food preference matching bonus, loyalty gain from feeding, scroll effects in mission resolution
