# Nessa Thornwood
- **Status:** locked 2026-06-28
- **Recruit ID:** char_000
- **Portrait file:** nessa_thornwood
- **Class / Race / Origin:** Archer / Human / Ashwick
- **Food preference:** sweet *(her mother's honey and sweet things — a sensory ghost)*
- **Trait(s):** none assigned yet (TBD)
- **Family:** Eldest of the three Thornwoods; sister of Gareth and Godric; mother-in-all-but-blood to the adopted boy. See [cast/thornwood-family.md](cast/thornwood-family.md).

## Recruit-card bio (public surface)
> Nessa was twelve when her mother died bringing Godric into the world, and from that morning she was the mother of the house: she raised the baby her father could not bring himself to look at, and decided who ate in the lean years, which on a failing farm is the same as deciding who lives. She learned the bow keeping crows off the barley, because a bird in the field was bread off the table, and she got so she never missed. Then came the winter that killed her father and the harvest both, and the rent did not soften for a dead season, so the land went too; in that same grief, with the ground still hard over her father, she took in a child the cold had orphaned, a starving scrap she had no way to feed and fed anyway. She carried that boy through every cold mile of the years that followed, and keeps a twist of barley seed from the old field she will neither plant nor throw away. She has been a mother her whole life and never once a wife or a child, and if that has cost her something she does not say so, because there has never been anyone whose job it was to ask.

## Deep lore (discovery-only)
- She has been **a mother since she was twelve** — first to Godric (whom the father could not look at), then to the foundling boy. She has never been a wife and never, really, got to be a child. **No one has ever mothered her**, and that is the ache she will not name.
- The **crow-shooting → deadeye** came from hungry winters: a missed crow was lost grain was a hungry sibling, so she got so she never misses, because missing had a cost she could count.
- She is the one who held the remnant family together through ~5 homeless years after the farm fell, drifting with the boy, living by the bow.

## Personality & tells
- Steady, practical, the one who decides. Rations everything out of lifelong habit; **her jaw tightens when she sees food wasted.**
- Mothers everyone, whether or not they want it. Doesn't know how to stop.
- Carries a **twist of barley seed** from the old field that she will neither plant nor throw away.

## Relationships
- **Godric** — she raised him; she is effectively his mother. Her word is law to him.
- **Gareth** — the brother closest to her in age; they share the memory of their mother.
- **The boy** — her child in all but blood.

## Preferences & specificities
- Sweet tooth (the mother's honey). The barley-seed pouch. Never misses a shot.

## Combat identity & talents (parked 2026-06-29)
**Archetype: Survival Hunter — the finisher + family anchor (archer).** Light woodland hunter: hides / uses terrain (**low aggro**), places **traps**, **evasive** (good dodge + flee), higher DEX/WIS, and **targets low-HP first** — she *finishes* exactly what Godric softens and pins on himself. Thematically she does the killing so the gentle giant doesn't have to ("she decided who ate, which is who lives"). She also **commands the Thornwoods only** — informal, family-scoped (Morgause commands anyone; Nessa just *her* three, because she raised them). Talent model = Godric's template (signature passive → minors-as-gates → fork → capstones; see [cast/godric-thornwood.md](cast/godric-thornwood.md)).
**Tree layout (2026-06-29):**
- *Signature passive (free, L1):* **Cull** — bonus damage to low-HP enemies; she never wastes a shot. Her targeting eye + the finisher who cleans up what Godric pins.
- **Tier 1 — Foundations** (minors): **Keen Eye** (+DEX/rank), **Patience** (+WIS/rank).
- **Tier 2 — Unseen** (woodcraft / low aggro): **From the Trees** (ranked — generates *less* threat, enemies overlook her; bonus damage from concealment), **Trapper** ⭐ (lay a snare — root + damage a foe; field control).
- **Tier 3 — The Hunt**: **Light-Footed** (ranked — +dodge, +flee escape), **Cull Mastery** (ranked — deepens Cull), **Finishing Shot** ⭐ (execute: big bonus / guaranteed crit vs low-HP — the cleanup).
- **Tier 4 — the fork** (her dual nature): **Provider** ⭐ (the mother — small protective aura: allies near her take less first-hit damage / a trickle of sustain; keeps people *standing*) **OR** **Hunter** ⭐ (the killer — max lethality, bigger Cull + crit vs wounded). Nurture vs kill, the same act in her.
- **Tier 5 — capstones**: **Thornwood Command** ⭐ (family-only — when Nessa's alive the Thornwoods get the coordinated-retreat bonus + a steadying nerve; the informal matriarch) and **One Shot** ⭐ (loyalty-gated — one unerring, guaranteed-lethal shot per fight on a non-boss target). ⚠️ **One Shot likely OP as written** (a guaranteed kill once/fight) — flagged to retune when we draw the real tree (cooldown? charge-up? non-elite only? big chunk instead of instakill? — revisit, may find a better idea).
- *Mirror to Godric:* she's the inverse — high-aggro-won't-kill vs low-aggro-IS-the-kill — and her two capstones echo his shape: one **family** capstone (Command ≈ his Last Stand) + one **essence** capstone (One Shot, her "never misses" ≈ his Gentle Giant pacifism).

## Open threads / TBD
- Assign a backstory trait (something matching "steady provider / protector").
- Whether her drifting-with-the-boy years surface as a tavern conversation.

## Cross-refs
- [cast/thornwood-family.md](cast/thornwood-family.md); `premade-characters.ts` char_000.

## Talent tree — the shape (designed 2026-09-04, unbuilt)

Her spine is **not** "archer damage". It comes straight out of her own lore:

> "a missed crow was lost grain was a hungry sibling, so she got so she never
> misses, because *missing had a cost*"
> "her jaw tightens when she sees food wasted"

So the tree is **nothing gets away, nothing is wasted.** A creature that escapes
wounded is a meal lost, and that is the thing she has organised her whole life
around. It also makes her the answer to the rout problem
(`docs/design/combat/ROUT_AND_FLIGHT.md`) without gating anything behind her.

| talent | what it does | engine hook |
|---|---|---|
| **Clean Kill** ⭐ | bonus damage to a beast already inside its flee window, so she takes it before it turns | mirrors `woundedDamageMult` in `damage.ts`, reads the target's `routsAt` |
| **Nothing Gets Away** | beasts cannot enter `fleeing` while she is on the field | gate the rout check at `round/actions.ts:98` |
| **Pursuit** | a free shot at anything running | needs flight-as-movement first |
| **Nothing Wasted** ⭐ | beasts she kills herself yield their full drop table instead of rolling it | loot, not damage |
| **The Rationer** | the team eats less on her missions | her mothering; non-combat |

**Build Clean Kill first.** It does not disable a mechanic, it *interacts* with
one: the boar tries to flee at 30% HP and she kills it at 30% HP. Lean Times
feels different with her along without needing her.

**Nothing Wasted is the most her**, and it fits the mild-effects rule — it
touches the larder rather than combat maths. Good capstone candidate.

Talents already reach combat by an established route: `CombatUnit.talents:
string[]` is carried in, and `damage.ts` reads it directly
(`talents.includes("last_stand")`). So these are small, not new plumbing.
