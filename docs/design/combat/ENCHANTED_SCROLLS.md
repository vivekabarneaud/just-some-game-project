# Enchanted Team Scrolls

**Status:** PARKED (2026-08-19) — the spec below is complete and buildable today,
but every scroll is gated behind **Mage Tower 2+**, and Act 1 has no reachable
magic: no caster, no Mage Tower, no mana crystals. Building it now would add five
recipes nobody can touch for hours, and imply the settlement has arcane craft
when the story says it doesn't.

**Unpark when** magic becomes player-facing — most likely alongside the caster
spell-weapon work (`DESIGN_NOVICE_ITEMS` Phase 2).

**One thing needs re-fitting:** the deploy screen went **per-adventurer**, so the
"team scroll slot" is now one shared slot beside the per-hero ones, not the old
three-shared-potion area the original doc described.

*Extracted from the retired Food Scrolls Loyalty doc (in git) (deleted 2026-08-19; its food
and loyalty halves shipped, and its farming section duplicated
`DESIGN_FARMING_EXPANSION`). Recover the original from git if needed.*

---


> **PARKED 2026-08-19 — blocked on magic existing, not on build effort.** The
> spec below is complete and buildable today (every ingredient, tower level and
> effect is decided), but all five scrolls are gated behind **Mage Tower 2+**,
> and the player has no magic anywhere near the early game — Act 1 is a survival
> chapter with no caster, no Mage Tower, and no mana crystals in reach. Building
> it now would add five recipes nobody can touch for many hours, and it would
> quietly imply the settlement has arcane craft when the story says it doesn't.
>
> **Unpark when** the Mage Tower is a real mid-game building the player actually
> raises, i.e. alongside the caster/spell-weapon work (DESIGN_NOVICE_ITEMS
> Phase 2) or whenever magic first becomes player-facing. The team scroll slot
> also needs re-fitting: the deploy screen went **per-adventurer**, so "the team
> slot" is now one shared slot beside the per-hero ones, not the old 3-potion
> shared area this doc describes.

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

