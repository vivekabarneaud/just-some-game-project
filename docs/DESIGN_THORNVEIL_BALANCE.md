# Thornveil Forest Balance — Design Spec

## Overview

A mechanic that ties deforestation (Lumber Mill) to magical reforestation (Mage Tower spell), with the Thornveil Pact as the enforcer. If the player cuts too many trees without regrowing them, they receive escalating warnings from Elder Rowena Ashford, culminating in Thornveil raids.

This creates:
- A meaningful connection between production and magical infrastructure
- A reason to invest in the Mage Tower beyond enchanting
- Lore-driven consequences that make the world feel alive
- A natural progression gate that teaches players about the Thornveil

---

## Mechanic: Forest Balance

### The Formula

```
forestDebt = lumberMillLevel - regrowthSpellLevel
```

- **Lumber Mill level** = how fast you're cutting trees
- **Regrowth Spell level** = how fast you're regrowing them
- **Forest debt** = the gap between destruction and restoration

If `forestDebt` stays above a threshold for too long, the Thornveil responds.

### Regrowth Spell

A new spell at the Mage Tower:

| Property | Value |
|----------|-------|
| Name | Sylvan Regrowth |
| Building | Mage Tower |
| Max Level | 10 (matches Lumber Mill max) |
| Unlock | Mage Tower Level 2 |
| Upgrade Cost | Mana Crystals + Wood + Gold (scaling) |
| Effect | Passive — offsets lumber mill deforestation |

The spell doesn't produce anything directly — it's a passive offset. At equal levels with the Lumber Mill, the forest is in balance. Below, the forest shrinks. Above, the forest actually grows (could provide a small bonus — maybe +happiness from "lush surroundings" or +forager output).

### Escalation Stages

| Forest Debt | Duration | Response | Event |
|-------------|----------|----------|-------|
| 2+ | Immediate | **Friendly note** from Rowena | "🌿 A robin delivers a small scroll: 'Dear neighbor, the trees remember every axe stroke. A little magic goes a long way. — R.A.'" |
| 3+ | 2 seasons | **Formal warning** from the Thornveil | "🌿 A Thornveil Ranger arrives with a message: 'Elder Rowena asks that you restore what you take from the forest. This is not a request.'" |
| 4+ | 2 more seasons | **Final warning** — Kess delivers it personally | "⚠️ Warden Kess stands at your gate: 'Rowena was polite. I'm not. Regrow the trees, or we'll regrow them over your lumber mill.'" |
| 5+ | 1 more season | **Thornveil raid** | Silvaneth archers and Thornveil Rangers attack. Damages the Lumber Mill specifically. Repeats each season until debt is resolved. |

### Warning Flavor

The warnings come from different people and escalate in tone:

**Stage 1 — Rowena (gentle):**
The message arrives via robin (callback to the story missions). It's warm, slightly amused, grandmotherly. She's giving you a chance.

**Stage 2 — Thornveil formal:**
A Ranger delivers a written message. Official Thornveil Pact language. Polite but firm. The subtext: "We like you, but we like the forest more."

**Stage 3 — Kess (threatening):**
Kess shows up in person. She's not diplomatic. This is the "last chance before violence" moment. Her dialogue should be memorable — the contrast between Rowena's gentle robin and Kess's direct threat tells you about both characters.

**Stage 4 — Raid:**
Thornveil Rangers (Silvaneth archers + Nordveld warriors) attack. They specifically target the Lumber Mill — damaging it, reducing its level or output. They don't burn your settlement; they're not invaders. They just want the forest to live. After the raid, the cycle resets — you get warnings again before the next raid.

### Player Resolution

The player can resolve the debt at any time by upgrading the Regrowth spell. Each level reduces the debt by 1. Getting to parity (spell level = mill level) clears all warnings immediately and triggers a positive event:

"🌿 The forest sighs. Green shoots push through the stumps. A robin lands on your windowsill with a tiny acorn — a gift from the Elder."

### Bonus for Over-Investment

If the player's Regrowth spell exceeds their Lumber Mill level:

| Surplus | Bonus |
|---------|-------|
| +1 | +2 happiness ("Lush surroundings") |
| +2 | +10% forager output (richer forest) |
| +3+ | Thornveil reputation bonus (future faction system) |

This rewards players who care about the forest — and it's thematically perfect for the Rowena connection.

---

## Implementation Notes

### Game State
```
thornveilWarningStage: 0 | 1 | 2 | 3 | 4;
thornveilWarningSeasons: number;  // seasons at current stage
regrowthSpellLevel: number;       // Mage Tower spell level
```

### Tick Logic (per season in advanceSeason)
1. Calculate `forestDebt = lumberMillLevel - regrowthSpellLevel`
2. If `forestDebt >= 2`, increment `thornveilWarningSeasons`
3. If warning threshold reached, advance to next stage + push event
4. If stage 4 reached, trigger Thornveil raid
5. If `forestDebt < 2`, reset warnings to 0

### UI
- Mage Tower page gets a "Spells" tab with Sylvan Regrowth as the first (and initially only) spell
- The spell shows current level, upgrade cost, and current forest balance
- A small forest indicator on the Overview page: 🌲 green (balanced), 🌲 yellow (debt 2-3), 🌲 red (debt 4+)
- Warning events appear in the event log with Thornveil styling

### Raid Definition
Add a new raid type for Thornveil raids:
- Silvaneth Archers (T2-3) + Thornveil Rangers (Nordveld warriors, T2)
- Targets Lumber Mill specifically (damages building, not resources)
- Lower strength than NPC raids — they're making a point, not destroying you
- Victory loot: wood (they brought saplings), herbs (peace offering)
