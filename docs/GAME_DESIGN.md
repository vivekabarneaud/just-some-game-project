# Medieval Realm — Game Design Document

## Vision

A cooperative medieval fantasy city-builder browser game, blending OGame's UI-driven gameplay loop with Manor Lords' peaceful depth. Players build and manage a village through a static UI (no 3D, no animations), focusing on citizen management, supply chains, seasonal farming, and crafting. Cooperation over competition: players trade resources and face shared NPC threats together.

## Core Pillars

1. **Deep citizen life simulation** — Food diversity, happiness, health, seasonal rhythms
2. **Meaningful supply chains** — Raw resources → processed goods → crafted items
3. **Living world** — Seasons, pagan festivals, plagues, herbalist expeditions
4. **Charm & personality** — Dragon pet, cat anti-rat squads, ale-fueled happiness
5. **Cooperative play** — Trade routes, shared NPC threats, no PvP (for now)

---

## Resources

### Tier 1 — Raw Resources

Gathered or farmed directly. Require workers assigned to the appropriate building.

| Resource       | Source Building   | Category   | Notes                              |
|----------------|-------------------|------------|------------------------------------|
| Wheat          | Farm              | Crop       | Seasonal (spring plant, autumn harvest) |
| Barley         | Farm              | Crop       | Used for ale production            |
| Carrots        | Farm              | Crop       | Food variety, happiness boost      |
| Cabbages       | Farm              | Crop       | Food variety, winter-hardy         |
| Turnips        | Farm              | Crop       | Food variety, fast growing         |
| Linen          | Farm              | Crop       | Raw material for cloth             |
| Wood           | Lumber Mill       | Gathering  | Construction, fuel (winter heating)|
| Stone          | Quarry            | Gathering  | Construction                       |
| Iron Ore       | Iron Mine         | Gathering  | Smelting into iron bars            |
| Gold           | Gold Mine         | Gathering  | Currency, jewelcrafting            |
| Wild Herbs     | Herbalist (expedition) | Gathering | Alchemy, medicine              |
| Wild Berries   | Forager Hut       | Gathering  | Early-game food supplement         |
| Game Meat      | Hunting Camp      | Hunting    | High-quality food                  |
| Pelts          | Hunting Camp      | Hunting    | Leather production                 |
| Mana Crystals  | Mage Tower        | Magic      | Enchanting, spells                 |

### Tier 2 — Processed Goods

Require a processing building, workers, and Tier 1 inputs.

| Product   | Building      | Inputs              | Notes                           |
|-----------|---------------|----------------------|---------------------------------|
| Flour     | Mill          | Wheat                | Intermediate for bread          |
| Malt      | Mill          | Barley               | Intermediate for ale            |
| Bread     | Bakery        | Flour                | Staple food                     |
| Ale       | Brewery       | Malt                 | Major happiness boost           |
| Thread    | Weaver        | Linen                | Intermediate for cloth          |
| Cloth     | Weaver        | Thread               | Clothing, trade good            |
| Iron Bars | Smelter       | Iron Ore + Wood (fuel)| Weapons, armor, tools          |
| Leather   | Tannery       | Pelts                | Armor, equipment                |
| Potions   | Alchemy Lab   | Wild Herbs + Mana Crystals | Buffs, healing, enchanting |
| Medicine  | Apothecary    | Wild Herbs           | Plague cure, health             |

### Tier 3 — Crafted / Luxury

Endgame items. Require advanced buildings and multiple processed inputs.

| Product          | Building     | Inputs                      | Notes                        |
|------------------|--------------|-----------------------------|------------------------------|
| Weapons          | Blacksmith   | Iron Bars + Wood            | Troop equipment              |
| Armor            | Blacksmith   | Iron Bars + Leather         | Troop defense                |
| Tools            | Blacksmith   | Iron Bars                   | Worker efficiency boost      |
| Rings / Amulets  | Jewelcrafter | Gold + Mana Crystals        | Base jewelry                 |
| Enchanted Gear   | Enchanter    | Jewelry + Potions           | Troop magical buffs          |

---

## Buildings

### Production Buildings

| Building       | Category       | Function                                       | Max Level |
|----------------|----------------|-------------------------------------------------|-----------|
| Farm           | Production     | Grow crops (player chooses which). Needs workers and seasonal planning | 20 |
| Lumber Mill    | Production     | Produce wood from surrounding forest            | 20        |
| Quarry         | Production     | Extract stone                                   | 20        |
| Iron Mine      | Production     | Extract iron ore                                | 20        |
| Gold Mine      | Production     | Extract gold                                    | 20        |
| Hunting Camp   | Production     | Produce game meat and pelts                     | 15        |
| Forager Hut    | Production     | Gather wild berries and herbs (early game)      | 10        |

### Processing Buildings

| Building       | Category       | Function                                       | Max Level |
|----------------|----------------|-------------------------------------------------|-----------|
| Mill           | Processing     | Wheat → Flour, Barley → Malt                   | 15        |
| Bakery         | Processing     | Flour → Bread                                  | 15        |
| Brewery        | Processing     | Malt → Ale                                     | 15        |
| Weaver         | Processing     | Linen → Thread → Cloth                         | 15        |
| Smelter        | Processing     | Iron Ore → Iron Bars                           | 15        |
| Tannery        | Processing     | Pelts → Leather                                | 15        |
| Alchemy Lab    | Processing     | Herbs + Mana Crystals → Potions                | 15        |
| Apothecary     | Processing     | Herbs → Medicine                               | 10        |

### Crafting Buildings

| Building       | Category       | Function                                       | Max Level |
|----------------|----------------|-------------------------------------------------|-----------|
| Blacksmith     | Crafting       | Weapons, Armor, Tools                           | 20        |
| Jewelcrafter   | Crafting       | Rings, Amulets from Gold + Mana Crystals        | 15        |
| Enchanter      | Crafting       | Enchant jewelry with potions for troop buffs     | 15        |

### Infrastructure Buildings

| Building       | Category       | Function                                       | Max Level |
|----------------|----------------|-------------------------------------------------|-----------|
| Town Hall      | Infrastructure | Unlocks buildings, raises village cap            | 25        |
| Warehouse      | Infrastructure | Increases resource storage limits                | 20        |
| Marketplace    | Infrastructure | Trade with other players                         | 15        |
| Houses         | Infrastructure | Provide shelter, increase population cap         | 20        |

### Military Buildings

| Building       | Category       | Function                                       | Max Level |
|----------------|----------------|-------------------------------------------------|-----------|
| Barracks       | Military       | Train infantry                                  | 20        |
| Archery Range  | Military       | Train archers                                   | 15        |
| Stables        | Military       | Train cavalry                                   | 15        |
| Watchtower     | Military       | Early warning, passive defense                   | 15        |
| Walls          | Military       | Passive defense rating                           | 20        |

### Magic Buildings

| Building       | Category       | Function                                       | Max Level |
|----------------|----------------|-------------------------------------------------|-----------|
| Mage Tower     | Magic          | Produce mana crystals, unlock research           | 20        |
| Dragon Lair    | Magic          | House and care for the dragon                    | 10        |

### Building Prerequisites (Tech Tree)

Buildings unlock based on Town Hall level and other building requirements:

- **Town Hall 1:** Farm, Lumber Mill, Quarry, Forager Hut, Houses
- **Town Hall 3:** Hunting Camp, Mill, Bakery, Warehouse
- **Town Hall 5:** Iron Mine, Gold Mine, Smelter, Tannery, Barracks
- **Town Hall 7:** Weaver, Brewery, Blacksmith, Watchtower, Walls
- **Town Hall 10:** Marketplace, Archery Range, Stables, Mage Tower
- **Town Hall 13:** Alchemy Lab, Apothecary, Jewelcrafter
- **Town Hall 16:** Enchanter, Dragon Lair (also requires Mage Tower 10)

---

## Citizens

### Population

- Citizens are your primary workforce. Each building requires assigned workers to function.
- Population grows naturally based on housing capacity, food supply, and happiness.
- Each citizen consumes food daily. Starvation → population decline, unhappiness.

### Assignment

- Players assign citizens to buildings: e.g. "5 workers on Farm, 3 on Lumber Mill"
- More workers = higher output (with diminishing returns at high counts)
- Unassigned citizens are idle (unhappy if idle too long)

### Needs

| Need        | Satisfied By                        | Effect if Unmet                    |
|-------------|-------------------------------------|------------------------------------|
| Food        | Any food resource (bread, meat, etc)| Starvation, population loss        |
| Shelter     | Houses                              | Slower population growth           |
| Happiness   | Food variety, ale, festivals, low threat | Reduced productivity          |
| Health      | Medicine, apothecary                | Disease spreads, death             |

### Food Diversity & Happiness

Happiness is influenced by diet variety. A settlement eating only bread is functional but miserable. Adding meat, vegetables, and ale dramatically improves happiness.

| Diet Level           | Foods Available              | Happiness Modifier |
|----------------------|------------------------------|--------------------|
| Subsistence          | 1 food type (e.g. bread)     | -20%               |
| Basic                | 2 food types                 | +0%                |
| Varied               | 3-4 food types               | +10%               |
| Feast                | 5+ food types + ale          | +25%               |

---

## Seasons & Calendar

The game operates on a seasonal calendar. One full year = a configurable real-time period (e.g. 1 real day = 1 game season, so 4 days = 1 year, or adjustable).

### Spring
- Planting season: crops are sown
- Festival of Sowing: costs food + ale, grants +15% crop yield for the season
- Herbalists can be sent on expeditions (best herb yield)

### Summer
- Crops grow. No harvest yet.
- Peak gathering season for berries
- Longest days: +10% worker productivity

### Autumn
- **Harvest**: crops are collected. This is when you receive crop yields.
- Harvest Festival: costs food + ale, grants +20% harvest bonus
- Hunting season: +25% hunting yield
- Must begin storing food for winter

### Winter
- **No farming**. Live off stored food and hunting.
- Higher wood consumption (heating). Citizens without sufficient wood → unhappiness, health loss.
- Increased disease risk
- Reduced worker productivity (-15%)
- Winter Solstice Festival: costs ale + gold, grants happiness boost to survive the cold months

---

## Events & Threats

### Plague & Disease
- Random event, more likely in winter or with low hygiene
- Spreads through population if untreated
- Countered by: Medicine (apothecary), cleanliness (building upgrades), cats (rat control)
- Severe plague can kill citizens

### Rats
- Appear as an event. Eat stored food, spread disease.
- Countered by: Recruiting cats. Cats are a "unit" you purchase (gold) that passively reduce rat events.
- More cats = lower rat chance. Cats also provide a small happiness bonus (villagers like cats).

### NPC Raids
- Periodic goblin/bandit raids. Frequency and strength scale with village size.
- Players are warned in advance (watchtower level = more warning time)
- Defended by: troops, walls, watchtower, dragon (if friendly)
- Failed defense = resource loss, building damage, citizen casualties
- Cooperative: nearby players can send reinforcements

### Herbalist Expeditions
- Send herbalists into the wilds for a set duration (hours)
- Returns with wild herbs, rare ingredients
- Risk of failure (herbalist injured/lost), mitigated by escort troops
- Higher alchemy lab level = better expedition rewards

---

## Dragon System

Unlocked at Town Hall 16 + Mage Tower 10 by building the Dragon Lair.

### Dragon Needs (Tamagotchi-style)

| Need          | How to Satisfy                    | Decay Rate        |
|---------------|-----------------------------------|--------------------|
| Hunger        | Feed game meat (lots of it)       | Daily              |
| Comfort       | Dragon Lair level                 | Slow (building)    |
| Bond          | Visit/interact (manual) or hire NPC caretaker | Daily   |
| Health        | Potions if sick                   | Event-based        |

### Dragon Mood States

| State       | Condition                           | Effect                           |
|-------------|-------------------------------------|----------------------------------|
| Joyful      | All needs maxed                     | +30% army power, fire attacks    |
| Content     | Needs mostly met                    | +15% army power                  |
| Neutral     | Needs partially met                 | No combat bonus                  |
| Unhappy     | Needs neglected                     | Won't fight, may damage buildings|
| Gone        | Severely neglected for extended time| Dragon leaves. Must re-attract.  |

### NPC Caretaker

- Hire a dragon keeper for a recurring gold cost
- Keeper handles feeding and bonding automatically
- Quality of care depends on keeper tier (costs more gold for better care)
- Player can still visit manually for bonus bond points

---

## Cooperation & Multiplayer

### Trading
- Marketplace building enables trade
- Post trade offers: "Offering 500 wood for 300 stone"
- Other players can browse and accept offers
- Marketplace level determines: trade capacity, number of active offers, trade fee reduction

### Shared NPC Threats
- Regional boss events: "A dragon threatens the valley" or "Orc warband approaches"
- Multiple players contribute troops to a shared battle
- Rewards split based on contribution
- Failing to defeat the threat = regional debuff (reduced trade, increased raids)

### Alliances (future)
- Form alliances with other players
- Shared chat, coordinated defense
- Alliance-level research bonuses

---

## Progression Curve (Approximate)

| Phase      | Real Time    | Content                                          |
|------------|--------------|--------------------------------------------------|
| Early game | Day 1-3      | Basic buildings, farming, first harvest cycle     |
| Mid game   | Day 4-10     | Processing chains, military, first NPC raids      |
| Late game  | Day 11-20    | Magic, enchanting, jewelcrafting, dragon          |
| Endgame    | Day 20+      | Cooperative bosses, trade empire, max upgrades    |

*Note: Exact timing depends on tick rate / season length configuration.*

---

## Technical Notes

### Tick System
- OGame-style "calculate on access": server stores last-calculated timestamp and production rates
- When player loads a page, server computes elapsed resources since last access
- Seasonal transitions trigger on the calendar, affecting production modifiers
- No periodic server ticks needed for idle players

### Build Queue
- One building upgrade at a time (unless a second queue is unlocked via Town Hall)
- Build times scale exponentially with level (1.5x multiplier per level)
- Instant-complete not planned (no pay-to-win)

### Storage Limits
- Each resource has a storage cap (determined by Warehouse level)
- Production stops when storage is full (resources are lost — incentivizes upgrading warehouse)

---

## Implementation Phases

### Phase 1 — Core Resource Loop
- Tier 1 raw resources (wood, stone, gold, food as abstract, mana)
- Citizen assignment to buildings
- Basic food and happiness system
- Buildings: Farm, Lumber Mill, Quarry, Gold Mine, Hunting Camp, Houses, Town Hall, Warehouse

### Phase 2 — Processing & Seasons
- Tier 2 supply chains (mill, bakery, brewery, weaver, smelter, tannery)
- Seasonal calendar with planting/harvest cycle
- Crop selection on farms
- Food diversity affecting happiness
- Festivals (spring sowing, autumn harvest, winter solstice)

### Phase 3 — Military & Threats
- Troop training (barracks, archery range, stables)
- NPC raids with defense mechanics
- Blacksmith for weapons/armor
- Watchtower and walls

### Phase 4 — Magic & Expeditions
- Mage Tower, mana crystals
- Alchemy Lab, Apothecary
- Herbalist expeditions
- Plague/rats/cats system
- Medicine and health mechanics

### Phase 5 — Crafting & Dragon
- Jewelcrafter, Enchanter
- Enchanted gear for troops
- Dragon Lair, dragon pet system (tamagotchi mechanics)
- NPC caretaker hiring

### Phase 6 — Multiplayer & Cooperation
- Player authentication (email + Google SSO)
- Marketplace and trading
- Shared regional NPC threats / boss events
- Alliance system
