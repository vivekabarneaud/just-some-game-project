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
3. **Meet her** → uncover the tragedy: a hedge-witch the **thinning got *into*.** A dark mirror of **Edda** (the spine — see below).
4. **The end (linear, merciful):** she can't be saved; the demand for Nell turns her; the team puts her down. *(Earlier "a small choice to bring her back" is dropped — a real branch needs choice-plumbing; ship linear first.)*
- **Double duty / the payoff:** Edda recognizes it — *"That's not witchery gone bad. That's the bad ground talking through her."* So the cozy side-quest becomes the **first human-scale hint of what the Wastes do to a mind** (foreshadows the Hollow Sickness / the cosmic threat). A side story that quietly feeds the main one. Possible reward: a recipe / Greymantle / a small boon.

**Built so far (2026-06):**
- **The front is BUILT:** `marsh_clearing` (reworked) is the invisible front — `unique` but *untagged* (reads as an ordinary errand: get Edda her **Fenbalm** while the man-length adders strike). Its completion is the hook that later opens "The Cabin in the Reeds." Compassion-framed (the marsh is the adders' home; protect the gatherers, don't purge).
- **Fenbalm needs a renewable source + a use → banked PAIR:** a recurring "gather at the fen" chore (discovery→routine: unlocks via `missionDone: marsh_clearing`) *and* a Fenbalm remedy recipe (winter-fever/deep-cough). Build them together when alchemy is touched — don't add the recurring source for an unused herb. (Post-chain that fen-gather is **adders only** — see the marsh section.)
- **Mechanic (A) — "bring an offering" deploy cost (reusable, general):** a mission that costs an *item/resource* to deploy, not just gold (`deployItems`). Killer app is **trade** — turns the Greyford barter into a real exchange (bring grain, return with stone) — plus tribute/bribe/ritual. Worth building as a general system; the witch-offering is one user of it.
- **Mechanic (B) — "offering → peaceful" tradeoff (the witch's spell):** bring an offering and the marsh creatures let you pass; come empty-handed and they swarm. Spend resources to skip the fight, or risk it to save them. Built on (A), **post-reveal only** → a *later* Bog Witch beat, not the front.

*(The full chain design — Aldith & Ada, the bargain/tea/turn, the marsh, the letters, the end, the Edda mirror, the lingering — is below.)*

### Aldith & Ada — the tragic core (LOCKED 2026-06)
The witch is **Aldith**; her dead granddaughter is **Ada**. She isn't extending her *own* life — she's a grandmother trying to **bring Ada back**, and the craft she's slid into needs a living child's **body as a vessel** (Ada's spirit poured in, the host child *erased*). On-canon that's **resurrection-via-sacrifice** — the path Halldora refused and her circle took into the Cult ([[project_magic_rules]]). Aldith is **not** Cult; she's an independent ruin who stumbled grief-blind onto the same sin. Foreshadows Story 14, lands retroactively. **Never stated in-game** — folk voice only (no Halldora / Cult / Hollow / Aether on screen).
- **Why a child:** hollowed and decaying, she needs *living* Aether; a child has the most. The folk word is "pure"; the truth is Aether (two-track).
- **Why secluded:** a hedge-witch at the village's edge (canon enemy line: "the villagers used to trade with her") who, after Ada died, **withdrew deeper into the marsh** to be alone with the grief. The thinning-edge was waiting where she went.
- **The ambiguity (keep):** the Ada she hears **may not be real** — the bad ground *wearing the girl's voice*, feeding on her grief. She might erase Nell for a ghost that isn't even Ada. Neither she nor the player can ever be sure.

### The bargain, the tea, the turn
- **The bargain** (mechanic A, "bring an offering"): offerings buy the gatherers safe passage. The visits include Aldith's **tea**, which softly charms the team into talking — so she mines them for the settlement's secrets, including the children. Offerings **drift** mundane→strange (herbs → grain → a coin → bone → grave-dust → a thing with a name on it), spent from real inventory so each *feels* like it leaves your hand.
- **The "off" tell is doubled:** the offerings turning *and* the gatherers coming back having said too much (the tea). Plus the drowned dead rising (see the marsh section).
- **The turn:** at tea they notice a **portrait** of Aldith and a young girl → *"…she looks like Nell"* (that is *why* Nell). She begins asking about Nell. The demand: Nell's **body as a vessel** (erased). The Lord's flat refusal is the mask slipping. **Nell never goes to the marsh — the asking is the horror, not the act.**

### The marsh — why killing her IS the containment
The marsh is a **thinning-edge Aldith *deepened*.** Her rituals were the *engine*: they concentrated dead Aether and **woke the drowned dead** (the `swamp_revenant`s are *her footprint*, not the marsh's nature — full undead is Wastes-grade). So her death removes the engine: the concentration fades, the revenants settle, and the marsh **reverts to its thinning-edge baseline** (adders, voices, unease — no walking dead). You **can't cleanse** it (the edge stays; contain-not-cleanse), but you need **no separate "cap the marsh" mission** the way the spring did — *the spring was an impersonal wound; the marsh's worsening was a person.* End the person, end the worsening.
- **Marsh arc: calm (adders) → corrupted (adders + revenants) → calm (adders).** Full circle to `marsh_clearing`'s framing: the adders' home.
- **Recurring fen-gather (post-chain): adders only** — the revenants are gone with her. Fenbalm keeps flowing; the dread recedes to a background hum. (A proper Primal ward to fully quiet the edge = optional Niamh callback later, like the spring; not needed for alpha.)

### The letters (quoted in the journal, like Hale's)
They **knew her name** (weeks of tea and bargaining) — the reveal is her *story*, not her name; humanize through the heart. The team carries the letters home and the **journal quotes fragments** of Aldith writing to dead Ada, the descent visible across them: love → grief → temptation → the marsh exploiting the love → the terrible tender plan.
> *Ada. I made too much bread again. Forty years feeding two and I cannot unlearn it. I left the little loaf on the sill for the birds. You would have laughed at me for that.*
>
> *Ada. The house keeps too quiet. I talk to you the whole day through. I know it is foolish. It answers the quiet better than anything else does, so I have stopped minding.*
>
> *Ada. There are voices in the reeds now, after dark. One of them carries your sound. I know it is not you. But I am so tired, and it is so near your voice, and I have so little of you left to hold.*
>
> *Ada. The voice knew about the blue flowers by the door. It knew about the loaf on the sill. How could it know those things, if it were not you? I was wrong to doubt. Forgive an old woman her doubting. I am listening now.*
>
> *Ada. I have learned what the water can do. Be patient now. I will find you your way back, and a warm place to keep you, and you will never lie cold in the ground again.*

The **fourth is the bridge** (fixes "I know it is not you" → belief): the voice *proves* itself with her own memories (the marsh wearing Ada's voice, turning Aldith's grief against her). Every step is love, twisted.

### The end — and who carries what
Linear + merciful (can't save her). The refusal **turns her** (she attacks); the team does the grim necessary thing in the marsh. **No magic, no Edda at the fen.** The **dying clarity is natural** — the corruption rode her living mind, and as she dies its grip loosens and she's herself for one breath, horrified: *"I buried her. I wept. I never once thought to bring her back. What did I let it make of me?"* (A real branch — try to reach her and fail — needs choice-plumbing; ship linear first.)
- **Custody + the Lord's omission:** the team brings the letters to **the Lord** (he reads them first). He gives Edda the letters but **shields her from the Nell-demand.** It's an *omission, not a lie*: "she'd gone wrong, the marsh was in her, she turned on us" is *true* (she did attack); he simply never says *why*. Journal gut-punch: *"I told Edda she turned on us. That much is true. I did not tell her why. I will not."*

### The Edda mirror + Edda's memory (the spine)
**Aldith is Edda's dark mirror, literally.** Canon (FOUNDING_CHARACTERS): Edda lost daughter **Mira** and granddaughter **Mae** to fever in '47 — that hole is *why she came south for Nell.* Two grandmothers, each lost a granddaughter; **Edda grieved and turned toward life** (herbs, Nell), **Aldith could not let go.** Aldith is who Edda could have become. **No date/illness rhyme** — the mirror is the *kind* of loss, not matching calendars; '47 stays Edda's private fact, not a shared "fever year."
- **Vehicle = an Edda *memory* (founder vignette), NOT the Lord's journal:** Edda, at home, with Aldith's letters, **prays for Aldith and Ada** in Helga's old folk way (canon: she does her quiet rituals in corners) — a *prayer*, not a working rite, grandmother to grandmother. This is where the player learns about **Mira and Mae** (Edda confiding to the Lord). Her hope: the two girls *"found each other, wherever the good dead go, and are laughing somewhere."*
- **Canon care:** (1) Mae and Ada most likely **did cross** (ordinary deaths away from the thinning) — so Edda's hope is plausible *and* sharpens the horror (Aldith ruined herself chasing a child already at peace). (2) **Nell must NOT learn this** (she doesn't know about Mira/Mae) — strictly Edda↔Lord.
- **Pattern:** side-stories **unlock founder memories** (Corin from the boars, Edda from the witch). The optional threads are where the cast deepens.

### Does she pass? No → the later ally payoff (banked)
She dies in the thinning, and **canon is explicit: those who die there don't cross — they join its voice-population** (LORE_TIMELINE death section). So she **lingers** — but **as herself**, because the corruption rode her *living* flesh and death frees the spirit of it (not of the thinning's hold; no rite needed). Lucid, grief-quieted.
- **Payoff (LATER — when the thinning reaches the settlement, the deferred home-invasion beat):** the lingering dead become perceptible at home and **she returns as an ALLY** — grateful for the mercy, knowing the thinning from inside. Redemption across death; an emotional anchor for that beat.
- **Craft:** end the side-story **clean** (the kill, the letters, Edda's prayer, silence). **No hint** she lingers — the seed is in the *mechanics* (died in the thinning), never the text, so the return is a true surprise.

### Dependencies + tone
Design-now, build-later. Needs: the **offering/`deployItems`** mechanic (A) + the **offering→peaceful** tradeoff (B); **chronicle letter-quoting**; **founder-memory vignettes**. Build the **offering mechanic first** — it also upgrades Greyford into real barter. **Tone:** the darkest beat we've drawn; user OK'd (adults + a 15-yr-old; the threat to Nell is never realized; folk-horror register).

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
