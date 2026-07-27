# DESIGN: Seasonal Gathers & Scarcity Hunts

**Status:** Designing 2026-07-27. **Season gate + The Bee-Tree (Old Honeypaw A/B) BUILT.** Rest designed, not built. Grew out of the Wild Boar Hunt ([[DESIGN_TIER1_GEAR]] §Boar missions) + the forced-mission pattern ([[project_forced_missions]]).

**One-line:** The food loop shouldn't be one repeated scenario. Give it a *seasonal* pool of gathers + hunts — and let the recurring ones become *places and creatures the player grows fond of*, so the taint can later break their hearts with them.

---

## The two lanes

1. **Seasonal gathers** — peaceful foraging, live in the **normal board pool**, gated to a season (`requires.season`). They're the rhythm of the year, crisis or not. This is what guarantees the player *meets the recurring ones often* → attachment. (Fish run, berries, the bee-tree, the apple tree, mushrooms…)
2. **Scarcity hunts** — combat, **forced onto the board only when food is running out** (`forceMission`, see [[project_forced_missions]]). The emergency. (Wild Boar Hunt built; Deer Yard designed.)

Thematically: gathers = *the comfort of the seasons turning*; hunts = *the emergency*.

**Cadence:** the once-a-day cap matters for the forced hunts (they re-check every tick) → a daily cooldown. **The astral-shard board refresh resets that cooldown** (paying to reroll should re-summon the emergency you're desperate for — a fair premium sink). Pool gathers are naturally capped by the daily board refresh.

**Two happy synergies:** (a) a varied pool feeds the **food-diversity happiness** bonus — variety is mechanically rewarded; (b) leaning spring/summer *peaceful* and winter *combat* gives the loop a **seasonal tone rhythm**.

## The season gate (BUILT)
`MissionRequirements.season?: Season` + `MissionBoardContext.season` + the `meetsRequirements` check + `buildMissionBoardContext` populating it from `s.season`. Any pool mission can now be season-locked. Guarded by `seasonGather.test.ts`.

---

## The Bee-Tree — Old Honeypaw (BUILT)

An **evolving relationship**, built as the codebase's discovery→routine pattern:
- **A · `bee_tree_first`** (spring, unique, combat): gatherers are smoking the hive when a spring-hungry bear (`forest_bear`) comes straight at them. Self-defence — he **routs, wounded but alive** (routsAt 0.3), may shed a `bear_claw` (`keepOnRout`). Ethos-clean: he attacked *us*; we drove him off, didn't kill him. Reward: honey.
- **B · `bee_tree`** (spring, recurring, peaceful, gated on A): he's not stupid — he doesn't try that twice. Now they see him across the clearing, cut the settlement's share, and **leave the rest on the stump for him.** Nell names him Old Honeypaw. Pure flavor, no mechanical hook. `guaranteed`, no combat.

**Deferred payoff:** one spring Honeypaw is *tainted* — he won't take his share and **won't rout**. You have to put the old bear down. (Parallels the apple tree; both keyed off *years* of familiarity, so defer the turn.)

## The Old Apple Tree (A/B BUILT 2026-07-27)

Honeypaw's sibling and opposite temperament: an **unconditional provider** — a lone wild apple far south, heavy every autumn, no bargain, no danger.
- **A · `apple_tree_first`** (autumn, unique, peaceful/`guaranteed`): the discovery — scouts find the laden old tree, a mercy before winter; a big generous first pick (**20 apples**), worth the long trip south.
- **B · `apple_tree`** (autumn, recurring, peaceful/`guaranteed`, gated on A): the yearly return, still generous (**16 apples**); flavor notes the folk speak of it fondly, "like an old neighbour who never asks for anything."
- Kept **pure peaceful** both states (no wolves) — the one mission that's a genuine exhale. Reward is plain **apples** for now.
- **Still open (deepeners, deferred):** a first-find/naming chronicle; **what the apples become** (cider for the brewery / winter stores you eat through the cold — makes the tree *present* all year, so losing it costs something you can taste); the optional "wolves at the windfall" variant.
- **Deferred payoff:** the tree goes black and weeping, sick dead things in the windfall → a tainted-creatures mission → the tragic *put-it-down* choice. Strong Ch2 taint material (NOT the Ch1→Ch2 bridge — deferred so the bond sets over multiple autumns).

## The roster (brainstorm — to design one by one)

| Season | Gather (peaceful, pool) | Hunt (combat, scarcity) |
|---|---|---|
| Spring (the hungry gap) | **Bee-Tree** ✅ · Fish Run · First Greens | — |
| Summer | Berry Thickets (a bear wants them too) · Wild Honey | — |
| Autumn | **Apple Tree** ✅⭐ · Mushroom Foraging | — |
| Winter | — | **Wild Boar Hunt** ✅ · The Deer Yard |

**Specials (not season-locked):** Greyford Shares (neighbour sends food — peaceful, builds rapport); Follow the Wolves (take a starving pack's kill — grim, the mercy tension); The Larder Thief (scarcity by *leak* not lack — vermin raiding stores).

**Arc-seeds (recurring → story):** Apple Tree → the taint; Honeypaw → the taint; Mushroom Foraging → a poisoning / the deferred fungal thread; First Greens → a wrong-greens scare (Edda's lore); Follow the Wolves → the pack's fate.

**Reward rule:** modest — a *few* apples/fish/honey. Enough to ease a lean spell, never to end scarcity, or the bond (and the tension) goes slack.
