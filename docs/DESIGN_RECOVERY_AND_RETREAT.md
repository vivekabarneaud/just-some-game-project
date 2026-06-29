# Recovery & Retreat — the combat-stakes model (Model C)
- **Status:** DECIDED direction 2026-06-29 (supersedes the old "100% permadeath on KO" in `DESIGN_ROSTER_ECONOMY.md`). Big multi-phase build; design locked here, build after the Model-B roster work.
- **Why:** with a finite, collectible, no-cap cast ("the player should be able to have them all"), 100% permadeath would only ever *erode* the collection — one bad deploy permanently deletes a beloved character. That fights the whole feeling. So losses should be *survivable* by default, and death should be the rare, earned exception.

## The principle
**Combat is about *retreat*, not death.** You lose a mission by being *routed* — your team flees, the mission fails, and they come home **wounded but alive.** You only *die* when retreat or rescue fails (left behind, overwhelmed) or on content where retreat isn't an option (expeditions, special/story missions). **You die because you were abandoned — not just because you lost.**

## The pieces

### 1. Recovery (HP persists + heals)
- **HP persists between missions.** A team comes home at whatever HP they ended on (not auto-reset to full).
- **Passive regeneration** — slow, over game-time. A wounded adventurer recovers on their own, but it takes a while.
- **Accelerated healing** — potions (alchemy), priest spells, bandages, recipes, and an **Infirmary / hospital building** speed it up. This gives the **alchemy lab real purpose** and justifies a new care building.
- **Consequence layer:** you shouldn't redeploy the wounded (low HP = high flee/fall risk), so healing becomes a *pacing* decision — rest and mend, or push your healthy people. Wounds matter without being fatal.

### 2. Flee (combat AI)
- Units assess the fight; at **low HP and/or a clearly-losing position**, they **attempt to flee.**
- A flee attempt can **succeed** (escape → mission fails, everyone comes home wounded) or be **harder** when the enemy is fast/surrounding (you don't always get out clean).
- A badly-losing team **routs** together. Modifiable by traits/talents (cover the retreat, better escape odds).

### 3. Fallen = *downed*, not dead — and the rescue
- A fallen ally (HP 0) is **downed, not killed.** During a retreat, teammates can enter a **fallback / rescue** behavior: break off and **drag the downed ally out.**
- **Rescued → comes home wounded** (recoverable, the recovery system above).
- **Not rescued → permadeath.** Left behind because everyone else was also down or had to flee without them. *This is the death condition:* abandonment / total overwhelm, not merely losing.

### 4. Permadeath scope (where stakes stay real)
- **Normal missions:** death is *rare* (only the abandoned/overwhelmed case). Losing = flee + wounds.
- **Expeditions & special/story missions** (e.g. the cult assault): retreat may not be possible / the stakes are explicitly lethal. This is where permadeath is *on the table* by design — so the game still has teeth where it matters.
- Mitigation everywhere: **Phoenix Tears** (revive), priest **Divine Grace** (revive roll).

### 5. Talent / trait hooks (this unlocks a lot)
The retreat/rescue/heal layer is rich bespoke-tree fuel:
- **Rearguard** — covers the retreat; improves the team's flee odds, draws aggro while others escape.
- **Comrade / Drag-Out** — much better at pulling downed allies out; can rescue under fire.
- **Field Medic** — heals teammates mid-mission and/or speeds post-mission recovery.
- **Adrenaline** (assassin, already designed in DESIGN_EXPEDITIONS) — low-HP buff; pairs with the bandage-or-fight choice.
- **Last Stand / others** — refuse to flee, etc.

## Phasing (build after Model B)
1. **Recovery foundation** — persist current HP on the roster; passive regen; a normal-mission *loss* yields **wounds, not a death roll** (drop the permadeath roll on ordinary losses). *This alone delivers the core feeling.*
2. **Flee & downed/rescue AI** — the retreat behavior + downed-not-dead + the rescue/abandonment death condition.
3. **Healing systems** — potions/spells/bandages/recipes + the **Infirmary** building; the talents above.
4. **Permadeath scope** — wire the lethal exceptions (expeditions, special missions).

## Notes
- The current code's forgiving death *roll* is a reasonable **interim** under C (losses rarely kill), so no urgent change is needed before the build — the "0% success → ~10% death" the user flagged is actually *fine* under C (you flee and mostly survive); it just needs **reframing the outcome as "failed, team wounded"** rather than a death percentage, which Phase 1/2 does.
- Cross-refs: [[project_adventurer_recovery]] (the original recovery memo), `DESIGN_ROSTER_ECONOMY.md` (the superseded 100%-on-KO), `DESIGN_EXPEDITIONS.md` (Adrenaline), `DESIGN_TALENT_TREES.md` (bespoke trees — the talent home), the death-confirm modal (already built).
