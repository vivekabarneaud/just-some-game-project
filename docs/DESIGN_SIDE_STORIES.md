# Side-Story Chains — Design (IDEA)

**Status:** IDEA / banked 2026-06-22. Post-prune, likely post-alpha. The chronicle/discovery approach shrunk to optional, bite-sized arcs.

## Concept
Optional narrative chains delivered through the existing mission/quest/chronicle systems, **distinct from the main story** (Story 1–14). The world reveals little stories as you play: a regular mission's scouts notice *something*, a quiet journal vignette opens, and a follow-up mission appears. You uncover a small, self-contained tale and often make a choice.

## Technically feasible — it reuses machinery already built
- Story missions already chain via `prerequisite` / `prerequisiteQuest` and fire chronicle entries on completion (`storyMissions.ts`).
- Quests already gate content and drop chronicle entries (`quests.ts`; e.g. *Watch the Walls* → `ch3_hands_beside_ours`).
- Mission completion already unlocks things (`STORY_UNLOCKED_ORIGINS`, etc.).
- **A side-chain = those pieces rearranged.** New bits are modest: (1) a **discovery trigger** on an ordinary mission's completion (a "scout report" epilogue — flagged on the mission, or a low-chance roll), (2) a **side-chapter** chronicle category, (3) **follow-up-mission spawning** (gated by the discovery flag), (4) optional small **branching choices** at the end.

## Presentation (must feel LIGHTER than main story)
- No cinematics, no "Chapter X" banners. A quiet journal **vignette** + a subtly-flagged board mission (e.g. a "📜 something here" marker).
- **Main story = the spine you must walk; side stories = pockets you stumble into.** The lighter touch is what keeps them distinct and keeps both special.

## Prototype chain — The Bog Witch
Uses lore that already exists (the Bog Witch enemy: *"lives in the marsh and talks to things that shouldn't talk back; the villagers used to trade with her, then the livestock started dying"*).
1. **Trigger:** a marsh-side patrol/gather mission completes → scout-report epilogue: a cabin past the reeds, effigies in the yard, smoke from the chimney, no one answers.
2. **Vignette** (side-chronicle) + follow-up mission **"The Cabin in the Reeds."**
3. **Meet her** → uncover the tragedy: a trade-with-her hedge-witch the **thinning got *into*.** A dark mirror of Edda/Nettle.
4. **A small choice:** try to bring her back (maybe with Edda's help), drive her off, or accept she's beyond saving.
- **Double duty / the payoff:** Edda recognizes it — *"That's not witchery gone bad. That's the bad ground talking through her."* So the cozy side-quest becomes the **first human-scale hint of what the Wastes do to a mind** (foreshadows the Hollow Sickness / the cosmic threat). A side story that quietly feeds the main one. Possible reward: a recipe / Greymantle / a small boon.

## Second prototype chain — The Tainted Spring (2026-06-22)
Sibling to the Bog Witch; same *family* (the thinning seeping into the everyday — into a person / into the water). **Supplies the missing CAUSE for an effect already in the game:** `rabid_boar`'s flavor is "something in the bad water drives them mad" — the tainted spring is *why*. Seeded now by the refined novice mission **`enchanted_spring` → "The Tainted Spring"** (a spring glowing wrong, water tasting of metal, deer gone, a boar came back foaming; a wizard reads it; a cursed spirit drawn to the bad water). The chain (later): discover the wrong water → connect it to the maddened animals (rabid boars) → trace the source → cleanse / cap it (a ward? a wizard rite?) or learn it's beyond fixing and fear it. Two-track knowledge: commoners see rabid beasts + a pretty glowing spring; the truth is the bad ground bleeding up through the water table. Possible Edda/Niamh tie (they'd recognize the taint). **Pacing (user, 2026-06-22):** the spring is "out there" (wilds) = Act 1 OK; the thinning reaching HOME (the village water/well) is a LATER-act escalation, NOT novice — the alpha keeps the dread distant. Saved bridge vignette for that later beat: *"The wizard we sent came back with the water stoppered in a jar... It was not poison. This was underneath the water... the ground had carried it. I asked how far the ground runs. She did not answer... Tonight Edda drew a cup from the village well, held it to the light, said nothing, and poured it back."* Note: a tainted spring (taint/madness) ≠ a cursed well (a haunting) — different threads; don't conflate. The novice `cursed_well` stays a contained local haunting (a reused old well, a death, a grief-bound spirit), unrelated to the thinning.

## Third prototype chain — A Wide Berth / The Bear (2026-06-22)
A *gentle* sibling to the others: no thinning, no dread, just the frontier's ethic of coexistence. Carries the **animals-aren't-kill-on-sight** principle (`[[feedback_animals_not_kill_on_sight]]`) and rhymes with **④ Neighbours** (a wild thing with its own territory, treated like a neutral neighbour, not warred on). Born from the user riffing 2026-06-22.
1. **`bear_den` → "A Wide Berth" (BUILT, unique, peaceful):** the cutters come back spooked, want the bear dead; we refuse, frame the den as "a neighbour's land, not friendly, not at war," mark its bounds so no one blunders in, and scout a fresh timber stand clear of it. Reward = wood, no kill. (Implicitly a follow-up of the first timber gathering.)
2. **Follow-up (banked):** the marked range becomes a known feature; maybe a beat where someone ignores the warning and has to be pulled out, reinforcing *why* we mark and respect it.
3. **Late payoff — the Thornveil accord (banked, much later, gated on Thornveil unlock / Niamh):** a Thornveil warden, keepers of the wild line, broker an *accord* with the bear via their old craft of moving among beasts. **Tone guard against Disney:** it is a **truce, not a pet** — the bear stays wild and dangerous; the Thornveil can walk the marked path unharmed / the bear tolerates the border / in a late beat its range overlapping our line means it drives off *other* intruders. Dignified coexistence, not a cuddly sidekick. This is the seed of a broader "wild things as allies through the Thornveil" thread. Possibly ties to the companion/adoption motif but in a higher register (accord ≠ adoption).

## The boar chain — symptom-half of the Tainted Spring, BUILT 2026-06
The rabid-boar → Tainted Spring arc is now built as a 5-beat `unique`+`missionDone` chain (see docs/DESIGN_ACT1_SETTING.md for the beat list + gates). It's the worked example of this whole doc's idea: an ordinary problem (sick boars) that escalates into a thinning glimpse, contained not cured. Canon it rests on is locked in `[[project_magic_rules]]` (contain-don't-cleanse, casters carry their own power, priests = unwitting Primal) and the boar tells (mad + water-marked + "the death doesn't take"). **Two follow-ups banked:** (a) **chronicle-firing for regular missions** — beat 4 (`reading_the_carcass`) wants to drop a journal vignette, which needs `chronicleEntryId` added to `MissionTemplate` + completion wiring (currently only StoryMission fires chronicles); (b) a **Father Corin memory/conversation** off beat 4 (we're thin on Corin content). Plus the **Niamh ward** callback (the *proper* containment of the spring, once the Thornveil's unlocked).

## Why it's worth building (later)
Emergent-feeling world, optional content + replayability without bloating the main spine, and it turns existing flavor (the Bog Witch, and others) into playable arcs. Candidates beyond the witch: anything atmospheric the scouts could "find" in the Act 1 forest/river.

*Banked 2026-06-22. Focus stays on Act 1 pruning first.*
