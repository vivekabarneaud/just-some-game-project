# Workers & Plagues — Design Spec

## 1. Worker System

### Concept
Each production building requires a fixed number of **workers** (citizens) to operate. If the settlement's population drops below the total workers needed, buildings lose efficiency proportionally. This creates a meaningful connection between population management and production.

### How It Works

**Worker assignment:**
- Each building has a `workersRequired` field per level (e.g., Lumber Mill Lv.1 = 2 workers, Lv.5 = 6 workers)
- Total workers needed = sum of all buildings' worker requirements
- Available workers = population minus a minimum reserve (citizens who don't work: children, elderly, etc.)
- If available workers < total needed, all production buildings operate at reduced efficiency: `efficiency = availableWorkers / totalWorkersNeeded`

**Display:**
- Each building card shows "Workers: 3/3" (green) or "Workers: 2/3" (orange, understaffed)
- Overview page shows total worker allocation and any shortage
- Sidebar notification when understaffed: "Not enough workers! Production reduced."

**Design notes:**
- Workers are NOT manually assigned (too micromanage-y for this game). They auto-distribute evenly.
- Alternatively: priority system where the player can drag buildings into a priority order, and workers fill from top to bottom. This gives control without per-building micromanagement.
- A future "Foreman" building or upgrade could increase efficiency per worker (same workers, more output).

### Worker Counts by Building (suggested)

| Building | Workers per Level | Notes |
|----------|------------------|-------|
| Lumber Mill | 2 | Physical labor |
| Quarry | 3 | Heavy labor |
| Iron Mine | 3 | Dangerous work |
| Farm (per field) | 1 | Seasonal |
| Garden (per garden) | 1 | Light work |
| Pen (per pen) | 1 | Animal care |
| Hive (per hive) | 0 | Bees work for free |
| Orchard (per orchard) | 1 | Seasonal care |
| Hunting Camp | 2 | Skilled hunters |
| Fishing Hut | 2 | |
| Forager's Hut | 1 | |
| Blacksmith | 2 | Skilled craft |
| Tailoring | 1 | |
| Leatherworking | 1 | |
| Woodworker | 1 | |
| Jewelcrafter | 1 | Skilled precision |
| Alchemy Lab | 1 | |
| Brewery | 1 | |
| Kitchen | 2 | Cooking for adventurers |
| Mage Tower | 1 | Scholarly |

**Interaction with happiness:** Happy citizens work harder (existing happiness production modifier). Unhappy citizens might "refuse to work" if happiness drops very low — effectively reducing available workers even if population is sufficient.

---

## 2. Plague System

### Concept
Periodic plague events that reduce population and/or make workers sick, reducing production. Preventable through preparation (cats, cleanliness, medicine) and curable through alchemy/magic.

### Plague Types

| Plague | Severity | Effect | Prevention | Cure |
|--------|----------|--------|------------|------|
| **Rat Fever** | Mild | 5-10% workers sick for 1 season | Cat Shelter building (cats kill rats) | Healing Potion at Alchemy Lab |
| **Wastes Chill** | Moderate | 10-20% workers sick, 1-3 citizen deaths | Apothecary building, warm clothing | Mage Tower Lv.3+ cleansing spell |
| **The Grey Plague** | Severe | 20-30% workers sick, 3-8 citizen deaths, lasts 2 seasons | Apothecary Lv.3+, clean water (well upgrade) | Rare cure potion (moonpetal + nettle + nightbloom) |
| **Hollow Sickness** | Rare/Story | Workers go mad near the Wastes boundary, wander off | Ward-stones maintained (Thornveil quest) | Story mission resolution |

### Plague Mechanics

**Trigger:**
- Random chance per season, modified by:
  - Population density (more people = higher chance)
  - Cleanliness (Apothecary/Cat Shelter reduce chance)
  - Season (winter = higher chance for Wastes Chill)
  - Proximity to Wastes (story progression increases risk)

**"Sick" workers:**
- Sick workers don't count toward available workforce
- They still consume food
- They recover automatically after the plague duration, OR faster with medicine
- Some plagues have a death chance per sick worker per season tick

**Prevention buildings:**
- **Cat Shelter** — new building. Cats reduce rat population, preventing Rat Fever. Also: adorable. Cats visible on the overview page.
- **Apothecary** — new building (or upgrade to Alchemy Lab). Produces medicine passively, reduces plague severity and duration.
- **Well upgrade** — existing well/water source, higher level = cleaner water = lower plague chance.

**Player agency:**
- Plagues are NOT random disasters that punish the player. They're **manageable risks** that reward preparation.
- A player who builds the Cat Shelter and Apothecary early barely notices plagues.
- A player who ignores them will face real production crises.
- Cure potions give an active response: "My people are sick — I need to craft medicine NOW."

### Cat Shelter Building

| Property | Value |
|----------|-------|
| Name | Cat Shelter |
| Category | Settlement |
| Unlock | Village tier |
| Max Level | 5 |
| Effect | -15% plague chance per level, prevents Rat Fever at Lv.3+ |
| Description | "A warm corner of the settlement where cats gather, breed, and earn their keep. Every rat they catch is a fever prevented." |
| Cosmetic | Cats appear on the overview page. More cats at higher levels. |

### Event Log Integration
- "A plague of Rat Fever has struck! 8 workers are sick."
- "Your cats caught the rats before they spread disease. Plague averted!"
- "The Grey Plague is spreading. Craft a cure at the Alchemy Lab or it will worsen."
- "Your Apothecary distributed medicine. The plague is subsiding."

---

## Implementation Order

1. **Worker system first** — it's simpler and creates the foundation for plagues
2. **Plague system** — builds on workers, adds Cat Shelter and Apothecary
3. **Cat Shelter** — new building, cosmetic cats on overview
4. **Cure recipes** — new Alchemy Lab recipes for plague cures
