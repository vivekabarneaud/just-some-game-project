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
Sibling to the Bog Witch; same *family* (the thinning seeping into the everyday — into a person / into the water). **Supplies the missing CAUSE for an effect already in the game:** `rabid_boar`'s flavor is "something in the bad water drives them mad" — the tainted spring is *why*. Seeded now by the refined novice mission **`enchanted_spring` → "The Tainted Spring"** (a spring glowing wrong, water tasting of metal, deer gone, a boar came back foaming; a wizard reads it; a cursed spirit drawn to the bad water). The chain (later): discover the wrong water → connect it to the maddened animals (rabid boars) → trace the source → cleanse / cap it (a ward? a wizard rite?) or learn it's beyond fixing and fear it. Two-track knowledge: commoners see rabid beasts + a pretty glowing spring; the truth is the bad ground bleeding up through the water table. Possible Edda/Niamh tie (they'd recognize the taint).

## Why it's worth building (later)
Emergent-feeling world, optional content + replayability without bloating the main spine, and it turns existing flavor (the Bog Witch, and others) into playable arcs. Candidates beyond the witch: anything atmospheric the scouts could "find" in the Act 1 forest/river.

*Banked 2026-06-22. Focus stays on Act 1 pruning first.*
