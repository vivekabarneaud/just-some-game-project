# Recovery & Retreat — the combat-stakes model (Model C)
**Status (2026-08-14 audit):** PARTIAL — Phases 1–2 + most of 4 BUILT (`combat/retreat.ts`: full flee/panic/rout model, broken/fled states, home recovery + conditions, tests). NOT built: rescue/drag-out, the Infirmary building (healing is items-only), Rearguard/feign-death/commander talents, the combat-log union refactor, per-mission noRetreat.
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

## Banked refinements (NOT building yet)
- **Conditions decay over real time.** When a hero comes home still bleeding/poisoned, carry the DoT's *remaining rounds* home and let the condition fade on its own — rough idea **~30 real minutes per remaining tick/round**. So a nearly-faded bleed clears soon; a fresh deep wound lingers. Pairs with "block passive regen": while the condition is active it blocks regen, then it expires (or a potion/Edda clears it early) and regen resumes. *v1 stores the remaining-rounds on the condition so the data is there, but behaves as persist-until-treated; wire the timed decay later.* (User idea, 2026-06-29, "not sure yet.")
- **Adventurers can die at home (untreated wounds worsen).** The "slowly drain HP at home" option — an untreated bleed/poison ticks down even in the settlement and can push a hero to critical/death. Realistic and good for tension, but deliberately *deferred*: it conflicts with "losses are survivable" unless paired with reliable treatment (Infirmary), so it belongs to a later, harder difficulty pass. (User: "realistic and good but I don't feel we should implement it right now.")

## Flee / rescue / commander — design in progress (2026-06-29)
**Engine slice BUILT 2026-06-29** (`shared/src/data/combat/retreat.ts` + round/actions/targeting/result/units/types wiring; smoke-tested). Done: survival reflex + broken state, crude panic rout + Morgause's deterministic TTK Hold/Fall-back projection, per-unit flee check (coordinated +18, outnumbered −8, broken −10, init duel), fled vs downed-abandoned result classification, retreat disabled on expeditions. **Interim simplifications to revisit:** (1) overkill is detected by *overshoot* below 0 (≥50% maxHp) rather than raw single-hit size — a reconciliation-friendly proxy; (2) story/special missions currently have retreat ON (need a per-mission `noRetreat` flag for the lethal ones, e.g. the cult assault); (3) commander recognized by premadeId char_020 until a "commander_tactics" talent exists. **Still pending (next slices):** the combat-log discriminated-union UI refactor (engine emits interim `beat`/`note` fields already), and the talents (Rearguard, feign-death, Last Stand, Drag-Out) + the rescue mechanic.

Detailed design conversation for Phase 2. Decisions so far:

**Trigger = hybrid (team rout + individual overrides).** Each round the engine asks "are we losing?"; a clearly-lost beat routs the whole team together (clean, reads great in the log). Individual overrides layer on via talents/traits (Last Stand = refuse to run; low-loyalty panic = bolt early). Fits the existing per-unit AI state machine (`AIState.onTurn`) — flee and rescue are new states; "the team ran" is a new combat-end reason (precedent: `vipFallen` already ends combat in a retreat).

**Commander = Morgause (signature mechanic).** Without a commander the rout check is panic-grade. With Morgause it gets smart. Mechanizes her whole identity ("only good at commanding and war"). She doesn't add power — she cuts losses to bad judgment. Generalize later into a small "tactics" quality; Morgause stays the gold standard. (User idea, developed together.)

*Her brain = a deterministic time-to-kill projection (cheap, no nested sims, runs each round):*
- **our rounds-to-win** = total enemy effective HP ÷ team effective DPS (alive, non-broken; engine has getAttackPower/getMagicPower).
- **their rounds-to-break-us** = our HP (down to the rout point) ÷ enemy effective DPS.
- We win comfortably → **Hold!** (suppress panic, finish). They win → **Fall back!** now, while whole + flee odds good. Borderline → lean cautious (don't gamble the team).
- Cuts losses both ends: Hold saves victories a jumpy team throws away; Fall back pulls them out before the wipe (vs crude AI that fights to wipe THEN flees with terrible odds). Emergent timing: holding one more round to drop enemies = fewer pursuers (−8 each) when the retreat is called.

*Her perks:* (1) **coordinated retreat** — her Fall back! is what grants the **+18** flee bonus (panic rout never gets it); (2) **discipline** — suppresses premature individual panic-bolts (individual overrides like feign-death still fire); (3) **if she falls, command breaks** → team reverts to panic rout (+ brief disorder), so she's a protect-the-commander priority and a juicy target for `cunning` backline-hunters.

*Implementation flags:* default = the deterministic projection (honors "she reads the battle" narratively, ~free, runs each round). Shallow rollouts (the literal "run a few sims") are LATER polish and carry a **recursion trap** — a rollout containing Morgause spawns its own look-ahead forever; any rollout must run with commander-logic DISABLED inside it.

*No-commander baseline (for contrast):* panic rout when team HP < ~30% of total OR half the team broken/down. Deliberately noisy (too-late / too-jumpy) — the noise Morgause removes.

*Teaches itself:* all of this lives in simulateCombat, so the 200× deploy preview visibly shows better survival odds with Morgause on the team — the player learns "bring the commander, lose fewer people" from the numbers.

**Flee = risky check, not free.** Escape odds scale with team (DEX/initiative, coordinated Morgause retreat, Rearguard-type cover talents) vs enemy (fast/cunning/`feral` swarms harder to shake; numbers matter). Fail = parting blows / another exposed round. Rearguard + coordinated retreat earn their keep here.

**Survival reflex (the safety net — unlocks solo missions).** Once per mission per hero: the first blow that would drop them to 0, *if not overkill*, leaves them at **1 HP** and they immediately try to flee. **Overkill** (single hit ≥ ~50% max HP — crit, dragon bite) bypasses it and downs them. After it's spent, the next lethal blow downs them for real. Effect: solo heroes flee at 1 HP instead of dying (death only from overkill or being cornered), and on team missions most "deaths" convert to "fled wounded" — so the truly *downed* (overkilled) are the only rescue candidates. VIT / "survivor" trait / Last Stand can raise the overkill threshold or repurpose the reflex. **Weakened/disabled on expeditions + special missions** so those stay genuinely lethal (ties to the permadeath-scope lever above).

**Abandonment = death (confirmed), but bites rarely** because the reflex means heroes usually flee rather than get downed. Death = overkill, cornered-while-fleeing (flee check keeps failing), or abandoned after a real takedown.

**"Broken" state (fixes the priest-heal exploit).** The survival reflex doesn't just set HP to 1 — it applies a sticky **broken** (reeling) status: that hero is OUT of the fighting line for the rest of combat and can only try to flee. A heal restores their HP (worth it — keeps them alive through the retreat + parting blows) but does NOT un-break them. So the reflex always has a consequence; a priest can't erase the "run now" moment. Two crisp tiers + two distinct priest jobs:
- **Broken (1 HP, conscious):** flees on its own; heals help it survive the run; NOT returned to the fight.
- **Downed (overkilled, 0 HP):** unconscious; needs rescue (drag-out) or priest Divine Grace revive — and a revive brings them back **broken** (up only to flee), never fighting-fit.

**Feign death (talent, assassin signature).** An individual-override talent: when a feign-death hero would break/go down, they drop off enemy target lists ("he's dead") and get a near-automatic individual escape — huge bonus / auto-pass on their OWN flee check. Shines exactly in the solo-at-1-HP case; pairs with broken (it's HOW a broken assassin reliably gets out).

**Flee-check formula (per-round, per-unit roll — per-unit, not one team roll, so the nimble slip out while the slow get caught + Rearguard matters).** Starting shape (numbers tunable):
```
escape% = 50 (base)
        + (unit initiative − avg pursuer initiative) × 2   // mobility duel
        − (alive pursuers − 1) × 8                          // outnumbered/surrounded
        + 18 if coordinated retreat (Morgause "Fall back!")
        + 20 to allies if a Rearguard is covering
        − penalties for slowed / broken
        + huge/auto if feign death
clamp [10%, 95%]   // never sure, never hopeless
```
Success = out (survives, comes home wounded, leaves the fight). Fail = parting blows that round + reroll next round; repeated fails = the cornered-death vector. Rearguard uses the existing threat system to hold pursuers' attention and soak the parting blows so others escape clean, at their own risk (heroic-sacrifice talent). Open dials to tune by feel: the base (50, how forgiving) and the outnumbered penalty (−8/extra pursuer, how deadly being swarmed is).

**Combat log = DECIDED (Phase 2): discriminated-union schema + highlighted dramatic beats.** Un-defers the banked combat-log-upgrade plan. The retreat beats are structurally NOT attacks (often no target/damage), so move CombatLogEntry to a discriminated union (`entry.kind: "attack" | "order" | "flee" | "rescue" | "broken" | "abandoned" | "feign" | "rearguard" | "commandLost" | …`), each kind carrying only its own fields. Dramatic beats render as **highlighted narrative lines** (centered, icon + color, a beat of emphasis in playback) distinct from the quiet attack chatter. Beats to surface: commander Hold/Fall-back orders, survival-reflex/broken ("reels, barely standing"), flee success/fail (+parting blow), rescue/drag-out ("hauls X clear"), abandonment death ("no one could reach X…"), feign death ("drops as if dead"), rearguard ("plants herself at the rear"), command-lost ("the line dissolves into panic").

**Open / parked:** rescue specifics (who drags whom, what it costs — lightened by the reflex, so deferred); exact tuning of overkill % + flee-check formula.

## Notes
- The current code's forgiving death *roll* is a reasonable **interim** under C (losses rarely kill), so no urgent change is needed before the build — the "0% success → ~10% death" the user flagged is actually *fine* under C (you flee and mostly survive); it just needs **reframing the outcome as "failed, team wounded"** rather than a death percentage, which Phase 1/2 does.
- Cross-refs: [[project_adventurer_recovery]] (the original recovery memo), `design/roster/ROSTER_ECONOMY.md` (the superseded 100%-on-KO), the retired expeditions doc (in git) (Adrenaline), the retired talent-trees doc (in git — per-character trees live in docs/cast/) (bespoke trees — the talent home), the death-confirm modal (already built).
