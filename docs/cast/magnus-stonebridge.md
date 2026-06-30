# Magnus Stonebridge
- **Status:** locked 2026-06-29 *(renamed from "Alaric" — the user associates this portrait with "Magnus" from their first-ever playthrough)*
- **Recruit ID:** char_029
- **Portrait file:** `alaric_stonebridge` — **MISMATCH:** asset keeps the old name; the picture is the one the user pictures as Magnus. Rename asset or accept (same as Hester / Sable).
- **Class / Race / Origin:** Wizard / Human / Ashwick
- **Age:** ~20 *(his brother Aldwin is ~35; the ~15-year gap means Aldwin all but raised him — see [aldwin-stonebridge.md](aldwin-stonebridge.md))*
- **Food preference:** fresh
- **Trait(s):** TBD — leaning a bespoke "raw prodigy" direction (high power, shaky control) over plain `quick_learner`.
- **Family:** Younger brother of **Aldwin Stonebridge** (char_017). **Parents alive but left behind** — see Family, below.
- **Role:** Half the **magic-unlock pair** — your first wizard. The hunted child whose human face cracks the Lord's Doctrine-belief.

## Recruit-card bio (public surface)
> Magnus's gift came early and came strong, the kind that cannot be hidden no matter who tries, and in the Hearthlands a boy like that is a death sentence waiting to be read aloud. Old Bede, the quiet teacher his brother found for him, taught him what little control he could, until the Inquisition took the old man, and once they had the teacher they came looking for the pupil. He knows precisely what he costs the brother who will not stop shielding him; he has offered to leave and take the danger with him, and Aldwin has refused every time. So he stays, and makes himself small, and carries a power he never asked for like a debt he cannot repay. He is younger than his gift makes people expect, and more frightened than he lets Aldwin see.

## Deep lore (discovery-only)
- **An innate prodigy — power he never asked for, too strong to hide.** In the Hearthlands that isn't a gift, it's a death sentence. He is largely *untrained*, which makes him powerful and unsteady, not polished. ("Prodigy" here = a curse, not a credential.)
- **The guilt.** He knows exactly what he costs Aldwin. He has offered to leave and take the danger with him; Aldwin refuses every time. So he stays and makes himself small — a child carrying a power like an unpayable debt.

## Old Bede (the teacher) — the bond and the loss
- **Bede was an old hedge-mage who survived to be old by mastering the one skill that keeps a wizard alive in the Hearthlands: not power, *concealment.*** Sixty years of being no one. He spent that long life as a quiet shepherd of hidden magic-children — **many pupils across the years, kept carefully apart so no caught child could ever name the others.**
- To Magnus he was **the grandfather he never had** — patient, warm, unhurried. He taught Magnus not to throw fire but to *swallow* it. His refrain, the reason Magnus "makes himself small": ***"Be a sparrow, lad. No one hunts a sparrow."*** (A sparrow is Magnus's quiet motif.)
- **How he was caught:** not through Magnus, and not betrayal — *another* of his pupils was taken, somewhere else, and whether by torture or by what the Inquisitors found in the child's hidden things, the trail led back to Bede's door. They **burned him in a public square.** Magnus stood in the crowd, hood up, hands shaking, and *did nothing*, because doing something would have killed them both. That is the moment that put the brothers on the road.
- **What it left him:** a little control, a great grief, and a **fatalism** — *if a lifetime of hiding wasn't enough to save Bede, it won't be enough to save me.* That dread lives under everything he does.
- **Future hook:** the cracking of Bede's network exposed Magnus *and* the other pupils. Magnus **never met the others and doesn't know if any are still alive** — a scattered "family" of Bede's children out there, hunted. (A thread, and a way to seed future magic-characters as Bede's lost pupils.)

## Family (parents)
- **Parents alive, left behind — exiles, not orphans.** Ordinary working-poor folk back in the Hearthlands. When Magnus's gift endangered everyone (the Inquisition punishes a wizard's whole *family*), the brothers fled **partly to protect them**, and can never safely return or even send word. Magnus's gift cost them a living family they can't go back to.

## Personality & tells
- Tries to be invisible; makes himself small (Bede's sparrow). Carries guilt and the loneliness of a hunted child.
- **Younger and more frightened than his power makes people assume** — people meet the gift and forget there's a scared kid holding it.

## Relationships
- **Aldwin** — brother and the man who raised him; won't let him leave to "spare" him. The bond is the spine of both characters.
- **The dramatic irony he can't see:** Aldwin does magic too (unwitting Primal healing) — they're the same force, sorted by the Church into "holy" and "damned." (See Aldwin's file + `LORE_TIMELINE.md`.)

## Combat identity & talents (parked 2026-06-29)
**Archetype: the caged firestorm (wizard) — restraint vs unleash.** Default = he **throttles** himself: small, controlled, *low-attention* magic (makes himself small, stays hidden). **Unleash** is a deliberate, devastating choice he only takes **when it's safe — when the enemies' attention is elsewhere** (mechanically: when his own threat/aggro is low because Godric/Gareth hold the line). So he's a **team payoff**: the tank pulls eyes, Aldwin shields his back, *then* the boy levels the field. The firestorm needs cover — the brothers' whole life in one mechanic. Talent model = Godric's template (see [godric-thornwood.md](godric-thornwood.md)).
- **Magic = a mix of pure Aether + Wind** (user call, 2026-06-29). Both are real combat elements (`elemental_aether`, `elemental_wind`) and both are *invisible*, so his restraint/unleash is **doubly literal**: nothing to see until the storm lands (a draft draws no eye; a gale can't be hidden). **Aether is neutral** — the raw substrate of *all* magic (LORE_TIMELINE: "all magic flows from the Aether") — which fits his early, raw, can't-be-hidden power; **Wind** gives it form and motion. NB: the *corruption* is **Hollow** magic (dead/stagnant Aether — the Cult, the Wastes), nothing to do with Magnus; he channels *living, raw* Aether shaped as wind. Default small/unseen; the unleash is a visible storm.
- *Signature mechanic — Restraint / Unleash:* low, safe output by default; an **Unleash** (big AoE storm) that fires when his threat is low / he's unobserved, **loyalty-gated** (he only dares cut loose for people he trusts).
- *Prodigy-control arc:* very high raw power, shaky control early → *gains* control as he levels / with loyalty (Bede's lessons finally taking root) — a literal wild-to-disciplined arc.
**Tree layout (2026-06-30):**
- *Signature passive (free, L1):* **Held Breath** — throttled by default: low output, **low threat** (he makes himself small).
- **T1 — Foundations** (minors): **Focus** (+INT/rank), **Control** (−wild-surge chance/rank).
- **T2 — The Draft:** **Whisperwind** (ranked — tiny near-invisible hits, almost no threat), **Stillness** ⭐ (while throttled he's nearly ignored — sets up the unleash).
- **T3 — The Gathering:** **Gale** ⭐ (the unleash — big AoE aether-wind storm, but *loud*: spikes his threat), **Updraft** (ranked — +radius/damage), **Eye of the Storm** (ranked — tame the unleash's downside).
- **T4 — fork:** **Tempest** ⭐ (cut loose — bigger Gale, more often, max devastation) **OR** **Zephyr** ⭐ (Bede's discipline — precise repeated bursts, low risk, stays hidden). His inner conflict *is* the fork.
- **T5 — capstones:** **Unleashed** ⭐ (loyalty — when safe, the boy stops being afraid and lets go *completely*) and **Brother's Shadow** ⭐ (codependency: while Aldwin's up + near, his unleash is empowered; if Aldwin falls → **Wild Surge**, uncontrolled, huge and indiscriminate).
- *Minors:* +INT, +control, +AoE radius.
- *Pair note:* Aldwin's **Brother's Keeper** + Magnus's **Brother's Shadow** are the same bond from both sides; and his restraint/unleash keys off the **threat system** — the team (Godric/Gareth aggro, Aldwin shields) keeps enemies off him so the unseen boy can level the field.

## The pair (with Aldwin) — codependency
- **Aldwin alive + near → Magnus dares to unleash** (he feels safe). **Aldwin falls → Magnus breaks**: a wild uncontrolled surge, or he panics and shuts down. Losing the brother unmakes him.
- Aldwin shields/heals Magnus **first**, so the firestorm survives to fire. They are only whole together. See [aldwin-stonebridge.md](aldwin-stonebridge.md), [stonebridge-arrival.md](stonebridge-arrival.md).

## Open threads / TBD
- Assign a trait / build the prodigy mechanic.
- **Portrait asset** still `alaric_stonebridge` — rename or accept.
- **Bede's lost pupils** — a future-character / story thread.
- A **control arc** (wild → disciplined) tied to loyalty/leveling.

## Cross-refs
- `premade-characters.ts` char_029; `LORE_TIMELINE.md` (the three magic traditions; the Doctrine); aldwin-stonebridge.md.
