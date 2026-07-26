# DESIGN: Enemy Audit Method (how we work through enemies)

**Status:** Working method, adopted 2026-07-26. Applies to every enemy family. See [[DESIGN_TIER1_ENEMIES]] for the families audited so far.

**One-line:** Audit enemies **vertically** — one family at a time, all the way down — not horizontally (one aspect across all enemies). A finished family is *complete content*: it has a place, a kit, loot, and a reason that loot exists.

---

## Why vertical

The **horizontal** pass was right for **shared machinery** — charge, morale, stun, pack tactics, focus-fire had to exist before any family could use them, so we built those across enemies first. That groundwork is done.

From here, horizontal ("loot for everyone, then missions for everyone") produces disconnected fragments: enemies with no missions, loot with no use. **Vertical produces shippable content** and surfaces the connections (loot → recipe → why you fight them) that the horizontal pass keeps skipping.

Rule of thumb: **build a mechanic horizontally the first time it's needed; audit the family that needs it vertically.**

---

## The per-family checklist

Work a family top to bottom. Don't move on until each step is answered.

1. **Place & missions.** Where do they live (biome)? What missions feature them *today* — across tiers? Is that coverage *enough*, or should we invent a unique one-off and/or a good repeatable? A family with no missions has no reason to exist.
2. **Kit.** Abilities + stats + AI. (Done for the built families; from-scratch for the rest — pick/extend an archetype: Flanker, Charger, Morale, …)
3. **Loot.** What drops, and does it make *sense*? Scale to the body/condition (a starving beast drops less; a healthy one more). Set `keepOnRout` on what a fleeing creature would leave behind (shed teeth, dropped gear) vs. carry off.
4. **The loop.** What is each drop *for* — which recipe or quest consumes it? **If a drop feeds nothing, add a sink (new recipe/quest) or cut it.** This is the step that turns loot from noise into economy. New gear should exploit the current stat system (e.g. the raw sub-stats: crit / accuracy / dodge / parry / mobility) so drops map to an identity — the predator's fang → crit, the fast beast's hide → mobility, etc.

---

## Families

| Family | Archetype | Place | Status |
|---|---|---|---|
| Wolves | Flanker | frontier fields/forest | kit ✅ · loot/loop in progress |
| Boars | Charger | frontier | kit ✅ · loot/loop TODO |
| Outlaws/bandits | Morale | roads/frontier | kit ✅ · loot/loop TODO |
| Adders (+ snakes?) | ? | **marsh** | used in missions; audit TODO |
| Spiders | ? | marsh? | audit TODO |
| Fungal crawler (+ family?) | ? | marsh / blight? | potential new family; audit TODO |
| Ruin Rats, etc. | ? | ruins | thin; audit TODO |

Biome thinking: group families by where they live and build the biome's enemies *and* its missions together (e.g. a Blackfen marsh: adders + spiders + fungal things — venom, webs, spores).
