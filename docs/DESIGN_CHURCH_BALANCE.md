# Church / Dominion Balance — Design Spec

## Overview

A mirror mechanic to the Thornveil forest balance. The Church of the Radiant One watches for excessive magic use. If the player's Mage Tower gets too powerful without a Chapel to "sanctify" the settlement, the Inquisition takes notice.

This creates a triangle of tensions:
- **Thornveil** watches your Lumber Mill → offset with Regrowth Spell (Mage Tower)
- **Church** watches your Mage Tower → offset with Chapel
- The player balances nature vs magic vs faith

---

## Mechanic: Faith Balance

### The Formula

```
heresyScore = mageTowerLevel - chapelLevel
```

- **Mage Tower level** = how much "unsanctioned magic" you're practicing
- **Chapel level** = how much you're demonstrating faith to appease the Church
- **Heresy score** = how suspicious the Inquisition is

### Chapel Building

| Property | Value |
|----------|-------|
| Name | Chapel of the Radiant One |
| Category | Settlement |
| Unlock | Village tier |
| Max Level | 10 |
| Effect | Passive — offsets Mage Tower heresy score. Also provides small happiness bonus (+1/level) |
| Description | "A modest place of worship. The Church requires it. The faithful appreciate it. The Inquisition counts the candles." |

The Chapel doesn't just offset heresy — it provides happiness too (faith comforts the people). This makes it useful even without the Church threat, unlike a pure "protection racket" mechanic.

### Escalation Stages

| Heresy Score | Duration | Response | Event |
|-------------|----------|----------|-------|
| 3+ | Immediate | **Census notice** from the Dominion | "📜 A courier delivers a sealed letter from the Dominion: 'The Crown has noted your settlement's growing interest in arcane studies. A census of magical activity is being prepared.'" |
| 4+ | 2 seasons | **Inquisitor visit** — Maren Ashvale sends an observer | "⚠️ An Inquisitor's aide has arrived to 'observe and document.' She's polite. She writes down everything." |
| 5+ | 2 more seasons | **Formal demand** — build a Chapel or face consequences | "📜 Inquisitor Maren Ashvale writes directly: 'I do not burn people. I present evidence. The evidence suggests your settlement requires spiritual guidance. Build a chapel. This is not optional.'" |
| 6+ | 1 more season | **Church raid** — Dawn Knights arrive | Dawn Knights and Inquisition forces raid. Damages the Mage Tower specifically. Confiscates some mana crystals and enchanting materials. |

### Warning Flavor

The Church escalation is different from the Thornveil — it's bureaucratic, not personal:

**Stage 1 — Census notice (bureaucratic):**
A form letter. Cold, official, slightly threatening in its politeness. The Church tracks magic use with maps and data.

**Stage 2 — Observer (surveillance):**
An Inquisitor's aide arrives. She doesn't threaten — she just watches and takes notes. The implication is clear. (Could be a small negative happiness modifier: "People feel watched.")

**Stage 3 — Maren Ashvale's letter (direct):**
Maren herself writes. She's the "reasonable Inquisitor" from the lore — she doesn't burn people, she shows evidence. Her letter is calm, data-driven, and absolutely chilling in its rationality. "Build a chapel. This is not optional."

**Stage 4 — Dawn Knights (military):**
Dawn Knights (heavy cavalry + warrior-priests) attack. They target the Mage Tower specifically and confiscate magical materials. They're "purifying heresy," not destroying a settlement. After the raid, they leave a Church banner planted at the gate — a humiliation.

### Player Resolution

Build or upgrade the Chapel to reduce heresy score. Getting to parity clears warnings:

"📜 The Inquisition has noted your settlement's renewed devotion. The observer has been recalled. May the Radiant One's light guide your works."

### Bonus for Over-Investment (Chapel > Mage Tower)

| Surplus | Bonus |
|---------|-------|
| +1 | +2 happiness ("Faithful community") |
| +2 | Dominion trade prices reduced (Church endorsement) |
| +3+ | Dominion reputation bonus (future faction system) |

---

## The Triangle

The beauty of this system is the triangle it creates:

```
        Thornveil
       (forest/nature)
        /           \
       /    PLAYER    \
      /                \
   Mage Tower ---- Chapel
   (magic)         (faith)
      \                /
       \              /
        \            /
         Church/Dominion
         (order/control)
```

- **Build Mage Tower** → Thornveil happy (Regrowth spell), Church angry (heresy)
- **Build Chapel** → Church happy (faith), but doesn't help the forest
- **Build Lumber Mill** → Economy grows, Thornveil angry
- **Balance all three** → You're safe, but your resources are stretched thin

The player who over-invests in one direction gets punished by the faction on the other side. The player who balances everything has less raw power but more stability. This is the kind of tension that makes 4X games interesting.

---

## Mage Tower / Enchanting Shop Split

### Current State
The Mage Tower handles everything magical: enchanting equipment, producing mana crystals, and (future) spells.

### New Split

**Mage Tower** — Military/utility magic building:
- Produces mana crystals (existing)
- Sylvan Regrowth spell (forest balance)
- Active defense spell (future: magical barrier during raids)
- Scrying spell (future: reveals upcoming raids/events)
- Ward maintenance (future: ties to Thornveil story missions)
- Category: **Defense/Magic**

**Enchanting Shop** — Crafting magic building:
- Enchant equipment (existing — fire/frost/shadow/holy enchantments)
- Craft scrolls (future — team-wide mission buffs, from food/scrolls/loyalty design)
- Category: **Crafting**

### Implementation
- Enchanting Shop becomes its own building (currently uses Mage Tower level for requirements)
- Enchanting recipes get `building: "enchanting_shop"` instead of `building: "mage_tower"`
- Mage Tower keeps mana crystal production and gains the spell system
- Both require mana crystals as a shared resource — creating tension over where to spend them

### Building Definitions

**Mage Tower (revised):**
- Category: defense
- Unlock: Village tier
- Description: "A tower of arcane study and practical magic. Produces mana crystals and houses defensive and restorative spells. The Church disapproves. The Thornveil approves. Everyone wants the crystals."

**Enchanting Shop (new or split):**
- Category: crafting
- Unlock: Village tier (requires Mage Tower Lv 1)
- Description: "A workshop where Aether is woven into steel and thread. Enchant weapons and armor, or craft scrolls of power for your adventurers."
