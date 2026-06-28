# Faction Balance — Thornveil & Church (Design Spec)

**Status:** BACKLOG (merged 2026-06-05 from `DESIGN_THORNVEIL_BALANCE.md` + `DESIGN_CHURCH_BALANCE.md`, both archived). Neither side is built. ⚠️ The Church side needs a rethink first: the "Chapel" it relied on was renamed to **Shrine** with a deity-offering role, so the faith-offset building no longer exists as designed.

## Overview — the triangle

Two mirror mechanics that turn the player's build choices into faction tension: cut too much forest and the **Thornveil** comes; lean too hard into magic without faith and the **Church/Dominion** comes. Together with the Mage Tower they form a triangle the player must balance:

```
        Thornveil
       (forest/nature)
        /           \
       /    PLAYER    \
      /                \
   Mage Tower ---- (faith offset)
   (magic)          (faith)
      \                /
       \              /
        Church / Dominion
        (order/control)
```

- Build **Mage Tower** → Thornveil happy (Regrowth spell), Church suspicious (heresy).
- Build the **faith offset** → Church happy, but doesn't help the forest.
- Build **Lumber Mill** → economy grows, Thornveil angry.
- Balance all three → safe but resource-stretched. Over-invest one way → punished by the faction on the other side.

## Shared pattern

Both instances use the same shape:
1. An **imbalance score** = `extractionBuildingLevel − offsetLevel`.
2. If it stays above a threshold for N seasons, **escalating warnings** fire (gentle → formal → personal threat → targeted raid).
3. The raid **targets the offending building** specifically (not the whole settlement) and repeats until resolved.
4. **Over-investment** (offset > extraction) grants small bonuses.

---

## A. Thornveil — Forest Balance

`forestDebt = lumberMillLevel − regrowthSpellLevel`

**Sylvan Regrowth** — a passive Mage Tower spell (unlock at Mage Tower Lv2, max 10 to match the Lumber Mill). At parity the forest is balanced; below, it shrinks; above, it grows (small bonus).

| Forest Debt | Duration | Response | Event |
|---|---|---|---|
| 2+ | immediate | Friendly note from Rowena | "🌿 A robin delivers a small scroll: 'Dear neighbor, the trees remember every axe stroke. A little magic goes a long way. — R.A.'" |
| 3+ | 2 seasons | Formal warning (a Thornveil Ranger) | "🌿 'Elder Rowena asks that you restore what you take from the forest. This is not a request.'" |
| 4+ | 2 more seasons | Final warning — **Warden Niamh** in person | "⚠️ Warden Niamh stands at your gate: 'Rowena was polite. I'm not. Regrow the trees, or we'll regrow them over your lumber mill.'" |
| 5+ | 1 more season | **Thornveil raid** | Silvaneth archers + Thornveil Rangers attack, damage the Lumber Mill, repeat each season until resolved. |

*(Name note: "Warden Niamh" was "Kess" in older drafts — current lore canon renamed her. See `LORE_TIMELINE.md`.)*

**Resolution:** upgrade Sylvan Regrowth to parity → clears warnings + a positive event ("🌿 The forest sighs. Green shoots push through the stumps..."). **Over-investment:** +1 → +2 happiness; +2 → +10% forager output; +3 → Thornveil reputation (future faction system).

---

## B. Church / Dominion — Faith Balance

`heresyScore = mageTowerLevel − faithOffsetLevel`

⚠️ **Open design problem:** the original spec used a **Chapel** building as the offset, but the game renamed Chapel → **Shrine** (a deity-offering building with a different role). Pick one before building: (a) reintroduce a distinct Chapel, (b) repurpose Shrine devotion/level as the faith signal, or (c) a new "registered with the Dominion" mechanic. The escalation below assumes some faith-offset level exists.

| Heresy Score | Duration | Response | Event |
|---|---|---|---|
| 3+ | immediate | Census notice (Dominion) | "📜 'The Crown has noted your settlement's growing interest in arcane studies. A census of magical activity is being prepared.'" |
| 4+ | 2 seasons | Inquisitor's aide observes | "⚠️ An Inquisitor's aide has arrived to 'observe and document.' She's polite. She writes down everything." |
| 5+ | 2 more seasons | Formal demand — Inquisitor Selwyn Crane | "📜 'I do not burn people. I present evidence. The evidence suggests your settlement requires spiritual guidance. Build a chapel. This is not optional.'" |
| 6+ | 1 more season | **Church raid** — Radiant Knights | Radiant Knights + Inquisition raid; damage the Mage Tower specifically, confiscate mana crystals + enchanting materials, leave a Church banner at the gate. |

The Church escalation is **bureaucratic and cold** (forms, surveillance, data-driven), in deliberate contrast to the Thornveil's personal/grandmotherly tone. **Resolution:** raise the faith offset to parity → warnings clear. **Over-investment:** +1 → +2 happiness; +2 → reduced Dominion trade prices; +3 → Dominion reputation (future faction system).

---

## Mage Tower / Enchanting Shop split (supporting change)

To make both mechanics legible, split the overloaded Mage Tower:

- **Mage Tower** (Defense/Magic) — produces mana crystals; houses spells: Sylvan Regrowth (forest), future active defense/scrying/ward spells.
- **Enchanting Shop** (Crafting) — enchant equipment (existing), craft scrolls (the unbuilt third of `DESIGN_FOOD_SCROLLS_LOYALTY.md`). Unlocks at Village tier requiring Mage Tower Lv1; enchanting recipes move to `building: "enchanting_shop"`. Both draw on shared mana crystals → tension over where to spend.

---

## Implementation notes (shared)

**Game state:**
```
thornveilWarningStage: 0|1|2|3|4;  thornveilWarningSeasons: number;  regrowthSpellLevel: number;
churchWarningStage:    0|1|2|3|4;  churchWarningSeasons:    number;  faithOffsetLevel: number;
```
**Per-season tick (advanceSeason):** compute each imbalance; if ≥ threshold, increment the season counter and advance stages / push events; at the top stage trigger the targeted raid; if below threshold, reset that side to 0.

**UI:** Mage Tower gains a "Spells" tab (Sylvan Regrowth first). Overview shows two small indicators — 🌲 forest (green/yellow/red) and a faith/heresy marker. Warning events use faction-styled entries in the log.

**Raids:** add Thornveil (Silvaneth archers + Rangers, targets Lumber Mill, low strength, loot = wood/herbs) and Church (Radiant Knights + Inquisition, targets Mage Tower, confiscates magical materials) raid types.
