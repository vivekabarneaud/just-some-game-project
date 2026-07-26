# DESIGN: The Marsh (Chapter-1 biome — snakes + Fenbalm)

**Status:** Designing 2026-07-26, not built. The marsh's *narrative* spine (Bog Witch) lives in [[DESIGN_SIDE_STORIES]]; this doc holds the **Chapter-1 ecosystem + the Fenbalm economy**. Follows [[DESIGN_ENEMY_AUDIT_METHOD]].

**One-line:** The marsh is where the game **turns** — a real venom-and-spore ecosystem you'd rather *avoid*, over a thinning-edge that slowly turns it hostile. Ch1 = the **living fen only** (no undead/ghosts — those are Wastes-grade, later). Compassion-framed: it's the creatures' home; the *offering* lets you pass without a fight.

---

## The snake family — the Venom archetype

Fast, fragile, strike-and-**linger**: the danger is venom that **stacks per-bite** (the `poisonTicks` array already sums) and **follows you home** (resolves to an *envenomed* recovery condition).

| Snake | Role | Kit |
|---|---|---|
| **Reed Adder** | the swarm | str2 **dex9** vit3 (30 HP), +5 dodge; **Reed Bite** poison 4%/2rd, **cd1**. Trivial alone, lethal in a knot — swarm identity falls out of *weak bite + fragile + uncapped stacking + hard to hit*. routsAt 0.4. |
| **Marsh Adder** *(exists)* | the anchor | man-length venom biter (poison 8%/3rd). |
| **Spitting Adder** | backline poisoner | `combatRole: back`; ranged **Venom Spit** (poison) + **Spit in the Eyes** → **Blind**. A positioning problem (break through or eat poison+blind). snake_oil 35%. |
| **Bog Constrictor** | the grab | **str8 dex4 vit12** (120 HP), **slow** (low mobility — lumbers up late). **Constrict** (see below). The *physical* exception — **no venom** → drops **serpent_hide** + meat, NOT venom mats. |
| **Tainted Apex serpent** *(late)* | the threat | the corruption's apex — see the spine. Distinct from the tier-3 **Aether Serpent** (`tide_serpent`, elemental). |

**New mechanics the marsh brings** (the *control* biome — a counterpoint to the frontier's charge/morale/pack):
- **Blind** — a real CC: the blinded unit's attacks roll a **miss chance**. Joins stun/slow/root as the marsh's toolkit (and a tool the player wants later).
- **Constrict / grapple = range 0, not a special lock.** The victim is pulled to **range 0**, so **weapon-bands** decide: dagger (0–3) works, longsword/bow don't → sidearm/fists. It's also a **taunt on the victim** (forced onto the Constrictor, can't swing at another foe) + **both immobilised** (no repositioning) + **squeeze DoT that ramps each turn**. Lasts **3 turns or until the Constrictor dies** (no STR roll — the escape is the party focus-killing it). Emergent: **assassins shrug it** (dagger main-hand), a **grabbed mage is fists-only, no spells** — terrifying, teaches "arm the squishy + free her fast." *Motivates building the deferred weapon-band/sidearm system.*
- **Venom carry-home** — stacks resolve into one *envenomed* condition (worse the more stacks), cured by the antivenom.
- **`tickPoison` → Nature-resist** — venom IS the Nature school + resistances exist (default 0), but the DoT doesn't yet *check* resist. One line: scale venom by `(1 − natureResist)`. Then serpent_hide armour works.

## The loot loop (venom in, cure out)
- **snake_oil** → **antivenom** (cures *envenomed*), with **Fenbalm** as the base. Snakes hand you the ailment AND the cure ingredient.
- **serpent_fang** → the offensive side (a **venom coating** for your own blade, or alchemy) — pin on build.
- **serpent_hide** *(constrictor)* → light snakeskin armour with **+Nature resistance** — *gear that helps you survive the marsh you got it from.* The Venom archetype's armour line.

---

## The Fenbalm spine — why you brave it, and how it twists

**The stakes are life-or-death, and there's no alternative.** Fenbalm isn't a cold-cure — it's the frontier's **only** remedy for **deep-cough / winter-fever** (pneumonia with no doctor; it kills the old and the young). No apothecary, nothing to buy — *you're nobody at the edge of the world.* The alternative to gathering it is watching someone's child cough themselves into a grave. It's **Edda's** (midwife/healer) — personal, cast-tied.

**Could they grow it? Yes — and that's the arc, not a plot hole:**
1. **Wild-forage (early, desperate).** Fenbalm is a **bog plant** — wants fen muck + stagnant water; dies in a dry field, naive transplant fails; and a year-old settlement has no wet plot, no glasshouse, nobody who's learned the trick. So the marsh is the **only source.** → **Write a mission line so the player gets it:** something like *"we've no way to grow it at home yet — the marsh is the only place it takes."*
2. **Cultivate (mid, the reward).** A **bog-garden / wet plot** (ties into the gardens/farming system) + Edda's herb-knowledge + carried-home seeds → a **home supply.** Satisfying: you graduate from bleeding people into the marsh to growing your own.
3. **The taint takes even that (late).** As the Thinning creeps: the marsh turns **hostile** (the full snake family → **tainted** ones → the tainted apex), the harder remedies need **potent wild Fenbalm** (antivenom vs tainted snakes, a taint-borne sickness), and eventually the Thinning **blights the home garden** — your safe supply fails when you need it most, driving you back to a marsh that's now a *front*, not a herb-patch.

**Escalation ties to world-state:** `marsh_clearing` stays light early (compassion front, ~a lone Spitter); after Aldith it reverts to calm (adders only, per canon); *later*, as the taint spreads, the fen-gather scales to the full hostile family — **our hard snakes' home.** Need and danger rise **in lockstep**, so the risk/reward holds all the way up.

## Fenbalm's uses (multiplying the essentialness) — it's the whole medicine chest
- **Deep-cough / winter-fever remedy** *(established)*.
- **Antivenom base** (+ snake_oil) — cures *envenomed*.
- **Wound-salve / poultice** — speeds adventurer **recovery** (KO/bleed/wounds). The constant-demand use: every mission comes home hurt, so you're *always* burning it — running out is scary.
- **Midwifery** — **Edda's** herb; keeps mothers + newborns alive through a hard frontier birth (ties to citizen-growth). Deeply cast-tied and the rawest stakes (the settlement's *future*).
- *(late)* a **taint-borne sickness** treatment the garden crop can't touch — a reason to gather *wild* Fenbalm once cultivation exists.

*(Detailed recipes/values TBD — design with the alchemy/recovery touch, per the "don't add a mat's source without its use" rule.)*
