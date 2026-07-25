# DESIGN: Positional Combat (1D)

**Status:** Design agreed, not built. Drafted 2026-07-25.
**One-line:** Give the auto-resolved combat sim a single position axis (X), so distance, formation, and movement become real — and the combat stage we just built becomes a true picture of the fight rather than a decorated list.

---

## 1. Why

The current sim is position-less: targeting is pure threat/AI, and an archer shoots at point-blank exactly as well as at range. That produces the problem we hit in playtest (two archers casually holding off five melee, firing "as if far away") and it leaves the combat stage as decoration rather than information.

A **1D position axis** fixes the felt problems and opens a large design space, without turning combat into a game the player pilots turn-by-turn.

**Goals**
- Make the archer/backline problem solve itself: unprotected ranged units get closed on and suffer.
- Give classes and *individuals* positional identity (a fast flanker vs. a slow anchor).
- Unlock a rich, legible talent space: charge, knockback, pull, reach, leap, flank.
- Make the stage represent reality: screen-X = combat-X.

**Non-goals**
- Not Dofus. No 2D grid, no pathfinding, no area shapes, no player-piloted turns.
- The player's agency stays in **preparation** (team composition, talents, gear), not in-fight micro.

---

## 2. Load-bearing decisions (locked)

1. **Auto-resolved, not player-piloted.** Combat is still pre-resolved and played back ("pure playback theatre"). Positioning is AI-driven and deterministic (seeded). This preserves the idle/watch loop the whole game rests on, and it is why the stage is the right display for it.
2. **One axis (X).** Allies advance from low X, enemies from high X, closing toward the middle. Units at a similar X form a **rank** and are drawn pooled together (this is also the "swarm pool" — it is not a separate feature, it is what "five enemies piled on the front" looks like).
3. **Threat and engagement are separate systems that compose** (see §4). This is the conceptual core.

---

## 3. The movement model

**Battlefield.** A line, e.g. X from 0 (ally back edge) to 100 (enemy back edge). Allies start clustered low (~15–25), enemies high (~75–85), with a gap between. The first ~1–2 rounds are the **approach**: archers and casters get their justified opening volleys while melee closes. Starting pre-engaged would throw that away.

**Mobility (new per-unit stat).** How far a unit moves per turn. The main lever for class identity:
- Assassins / skirmishers: high — they dart across the field.
- Warriors: medium — march up and hold.
- Archers / casters: low — they do not want to close; they hold and kite.
- Heavy/lumbering enemies: low.

For the MVP, mobility is derived: `f(dex, class)`. The raw-boostable version arrives with the stat-system project (§8).

**Turn = move (up to mobility) THEN act. Both, every turn.** The cap on movement is what keeps positioning meaningful: a slow unit cannot both chase a kiter *and* hit it. Melee close then strike; archers drift back then loose; both happen in one turn so fights do not drag while everyone shuffles (important for auto-resolve pacing).

**Range & exposure.**
- Melee attacks require **contact** (Δx ≈ 0).
- Ranged/casters have **long reach** (can hit across the field).
- A ranged unit is **exposed** when an enemy reaches melee contact with it: accuracy/damage penalty, and it takes more. This is the archer problem, solved organically.

---

## 4. Threat vs. engagement — the conceptual core

Two separate systems that compose into targeting:

- **Threat / aggro** (already exists, WoW-style): *who an enemy wants* — preference. High damage/healing/output generates threat, scaled by per-unit threat multipliers (a tank generates more per point; a glass cannon that "goes too hard" pulls aggro onto itself).
- **Engagement / position** (new): *who an enemy can reach* — access.

> **The rule: an enemy attacks the highest-threat target it can reach.**

Consequences that fall out of that one rule:
- A backline caster (Magnus) who out-threats everyone is still safe from **melee** enemies as long as the front (Godric) blocks the way — they cannot reach him, so they hit Godric. *Threat lost the argument to a wall.*
- But a **ranged** enemy has line of sight regardless of the wall — it *will* shoot Magnus if he out-threats. Against ranged, protection is not the wall, it is **taunt**: Godric taunts the enemy caster and it shoots *him* instead.

So the tank has **two protection tools, one per threat type:**
- **Engagement** blocks *melee* physically.
- **Taunt / threat** redirects *ranged*.

**Taunt is targeting-only.** Taunt does NOT reposition anyone (correction from an earlier draft). A taunted caster shoots the taunter from range and stays put. "Pull to the front" is a *separate* ability (§6), not what taunt does.

### AI tier → positional discipline

The existing `aiTier` maps cleanly onto "how much does this enemy respect the front":

| Tier | Targeting | Front discipline |
|---|---|---|
| **feral** | nearest reachable, ignores threat | never bypasses — mauls whatever is in front (a dumb wolf) |
| **tactical** | highest-threat *reachable* | respects the wall — hits the front when it cannot reach the juicier target |
| **cunning** | highest-threat, will spend mobility to reach it | **bypasses** the front to dive the backline — the mirror of the player's assassin |

---

## 5. Bypass & flanking (the assassin fantasy)

"Behind an enemy" = the attacker's X is on the **far side** of the target (a negative delta from the attacker's frame). This is the mechanical home for "assassins hunt the backline."

- **Most units are held** by the front (engagement blocks passage).
- **High-mobility / evasive units can slip past** the line to reach the enemy back rank. Gated on **mobility (+ a talent), not class** — assassins do it naturally; a mobile warrior with a "flanker" talent does it too. (Individual identity over rigid class.)
- Striking from behind grants a **flank / backstab bonus**.
- The cost: deep behind enemy lines = **surrounded** (enemies on both sides, more exposed). Dive in, gut the caster, maybe do not come back.

### Aggro is positional, and it creates the best moment

Because targeting is "highest threat I can **reach**," aggro is naturally *local* even with a global threat table. When the assassin dives the enemy backline:
- The **enemy backline** can now reach (and is being hit by) the assassin → they turn on it, or panic and flee.
- The **enemy front**, engaged with Godric, stays locked on Godric… *unless* a **cunning/tactical** front enemy **peels off** — disengages and turns back to save its casters.

That peel-off is the payoff: the assassin behind the lines forces the enemy into a **dilemma** — chase the assassin (relieving pressure on your front) or ignore it (and lose their casters). **AI tier decides.** Emergent, legible, and exactly the "assassin changes the shape of the fight" fantasy.

---

## 6. Ability & talent space (the point of all this)

Positions turn the ability list from stat-mods into tactics. A non-exhaustive menu, to be phased in:

- **Charge** (warrior/boar): dash a long distance + hit; closes on a kiter or crashes the line.
- **Knockback / shove**: push a target back along X — peel an enemy off your archer, or make room.
- **Pull**: yank an enemy toward you — the wizard drags the enemy caster into the melee's reach. (This is the "pull to the front" idea, as its own ability, *not* taunt.)
- **Reach weapons**: attack from one rank back (a spear behind the shield wall).
- **Leap / shadowstep**: gap-close or bypass; the assassin's signature.
- **Bodyguard / intercept**: a unit that steps in front to hold an extra attacker (raises how many the front can hold).
- **Formation buffs**: bonuses for staying back / holding the line / being flanked.

This is where the "character-specific combat style within a class" philosophy lives: two archers can play completely differently depending on mobility and which of these they have.

---

## 7. Display: stage v2

The combat stage becomes a **wide battlefield** instead of two edge-hugging columns. Units are placed by their **X** (absolute positioning along the field), and a rank of same-X units pools together vertically (the swarm pool).

- **The `CombatantCard` we built is reused as-is** — it is the unit. Only the *layout engine* changes (X-driven placement instead of the two-column stack). None of that work is wasted.
- The modal gets **much wider** to give the axis room to read.
- Movement animates as cards sliding along X; charge = a long lunge; knockback = a shove back; flee = off the far edge; the assassin's dive = a card knifing through to the back row.
- The roster snapshot + id-stamped log (already built) still drive it; we add per-round **position** to the log/replay so the stage can place cards each step. (Positions become part of what the sim records per round, alongside HP.)

---

## 8. Adjacent project: the stat system (do NOT block on this)

Today, crit (`5 + dex×0.5`), dodge (`dex×1.0`), and initiative (`dex + wis/2`) are **pure functions of DEX** — there is no way to put raw +crit on a ring.

The desired model (WoW/PoE style): **DEX gives a floor for crit / dodge / mobility, but each is also a first-class stat that gear and talents can raise raw.** Richer loot ("boots of +2 mobility"), and it enables individual builds (a high-mobility warrior).

This touches gear, the character sheet, talents, and UI — it is **its own project, adjacent to positional combat.** For the positional MVP, mobility starts pure-derived; the raw-secondary layer lands when we do the gear/talent pass. Mobility is a *new* stat (distance), separate from initiative (turn order), though both lean on DEX.

---

## 9. Engine integration (why it is feasible)

Grounded in the current code:
- **Rounds are a list of phases** over a shared `CombatContext`; the code says "adding a new phase = write a phase function and slot it in." → a **Move phase** drops in cleanly.
- **All targeting funnels through `pickTarget(attacker, targets)`**, which already has a "cunning = hunt the backline" notion. → making targeting reach-aware is a *contained* change: gate the candidate list by reachability, keep the threat scoring.
- **`aiTier`** already exists (feral/tactical/cunning) → it becomes positional discipline for free.
- **Retreat / Model-C flee** already exists → flee = move off the axis (the stage already has the flee-slide).
- **NPC allies** (Niamh, passive ritualists) get a protected backline slot.

### The two-sims caveat
Mission combat (`simulateCombat`) and raid combat (`raidCombat`) are **separate engines**. Raids map beautifully (a wall literally *is* a fixed frontline, archers behind it) but it is a second rework. **Do mission combat first; adapt raids after.**

### Other reconciliations
- Monte-Carlo success estimates re-run the sim (200×/mission, 50×/raid). 1D movement is cheap (no pathfinding), so cost should be fine — verify.
- Every existing encounter was tuned position-less; positions change outcomes → a real **re-balance pass** is the long tail (the estimates keep the numbers honest as we go).

---

## 10. Open tuning knobs (numbers, not architecture)

1. **Engagement capacity** — how many enemies can one frontliner hold before overflow slips past? (1? scaling with a stat/talent?) *The single most important number for feel.*
2. **Mobility values** per class/enemy, and the **bypass threshold** (mobility level, or talent-only?).
3. **Battlefield width + starting gap** → how many rounds the approach takes (target ~1–2).
4. **Backstab bonus size**, and how punishing "surrounded" is.
5. **Exposure penalty** magnitude for a closed-on archer.
6. **Threat weights** revisited now that reachability gates them.

---

## 11. Phased build plan

- **P1 — MVP (mission combat only).** Add X + mobility + Move phase + range-gating/exposure + engagement-with-overflow. No new abilities. This alone fixes the archer problem and creates hold-the-line. Ships the reach-aware `pickTarget` and the AI-tier→discipline mapping.
- **P2 — Stage v2 + position-aware abilities.** Wide battlefield layout; charge, knockback, pull, reach, leap; flank/backstab; the assassin bypass + peel-off dilemma.
- **P3 — Raids positional.** Rework `raidCombat` onto the axis (walls as fixed frontline).
- **P4 — Positional talents + the raw-secondary stat system.** The deep talent trees that exploit position, and gear/talents that grant raw mobility/crit/dodge.

Re-balance runs continuously alongside each phase.

---

## 12. Risks

- **Engagement rules** are the real design risk (knob #1). Too generous = trivially safe; too harsh = swingy chaos. Prototype and feel it early.
- **Balance long tail** — every encounter shifts. Budget for a re-tune pass.
- **Two sims** — double the surface; mitigated by doing missions first.
- **Scope creep into player-piloted** — resist. The moment the player is moving units each turn, it is a different game.
