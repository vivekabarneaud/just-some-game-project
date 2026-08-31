# Aldith, the Bog Witch (& Ada)
- **Status:** in progress (design LOCKED 2026-06; chain build deferred, post-prune / likely post-alpha)
- **Recruit ID:** side-story NPC (not recruitable; no char id)
- **Portrait file:** `bog_witch.png` (enemy art, R2 `images/enemies/bog_witch.png`). The card name is the generic **"Bog Witch"**; "Aldith" is her real name, learned through the chain, not shown on the enemy/mission surface.
- **Class / Race / Origin:** N/A (hedge-witch, human; an independent ruin, **not** Cult). Mechanically rendered as the `bog_witch` boss enemy (int/wis/vit caster, tier 2, `humanoid`/`magical`).
- **Food preference:** N/A
- **Trait(s):** N/A (a tragic grandmother, not a quirked recruit)

## Recruit-card bio (public surface)
She is not recruitable, so she has no recruit-card bio. The closest public surface is the **enemy flavor** (verbatim, `enemies.ts` `bog_witch`):
> She lives in the marsh and talks to things that shouldn't talk back. The villagers used to trade with her. Then the livestock started dying.

And the **innocuous front** that hooks the chain, the `marsh_clearing` mission "Clear the Marshes" (verbatim, `sideChainMissions.ts`):
> Edda needs fenbalm before the winter fevers come, and it grows nowhere but the wet ground past the reeds. The trouble is the adders, long as a man and quick to strike, that have made the fen their own. We will not put a marsh to the sword for being a marsh. Walk Edda's gatherers in along the firm ground, keep them whole while they cut what they need, turn back the snakes that come at you, and leave the fen to its keepers.

> **Voice/canon guardrail:** the words **Hollow, Aether, Cult, Halldora, the thinning** are NEVER on screen for this chain. Folk voice only. The folk word for living Aether is **"pure"**; the truth (Aether) stays a design-layer fact. Two-track knowledge throughout.

## Deep lore (discovery-only)
**Who she is.** Aldith is a hedge-witch who lived at the village's edge; the canon enemy line "the villagers used to trade with her" is literally her. She is **not a villain. She is grief.** She is the darkest beat the project has drawn (user OK'd; folk-horror register; the threat to Nell is never realized).

**The tragedy.** Her granddaughter **Ada** died (ordinary death, away from the bad ground). Aldith could not let go. After Ada died she **withdrew deeper into the marsh** to be alone with the grief, and the thinning-edge was waiting where she went. Hearing what she thought was Ada's voice in the reeds, she slid grief-blind into a craft that, on canon, is **resurrection-via-sacrifice**: to bring Ada back she would need a **living child's body as a vessel** (Ada's spirit poured in, the host child *erased*). This is the exact sin Halldora refused and her circle took into the Cult (see `[[project_magic_rules]]`). Aldith reached it **independently**, not as Cult, which is *why* she foreshadows Story 14 and lands retroactively.

**Widow (LOCKED 2026-07-06).** Aldith is a **widow of a roughly forty-year marriage** — the *"forty years feeding two"* in the bread letter is her and her **late husband**, NOT Ada. She is **doubly bereaved**: she lost her husband (the decades-long habit of cooking for two she cannot unlearn → the compulsive baking, loaves left for the birds), and then, more recently, her granddaughter Ada. This is *why* she is utterly alone in the fen and *why* the baking-for-two persists. On the surface the player reads only "a lonely widow who bakes too much"; the grief-engine underneath is the husband-habit turned toward a dead grandchild.

**Why a child.** Hollowed and decaying, she needs *living* Aether to work, and a child has the most. Folk word: "pure." Truth: Aether. (Two-track.)

**The ambiguity (KEEP).** The "Ada" she hears **may not be Ada at all** — it may be the bad ground *wearing the girl's voice*, feeding on her grief. She might erase a living child for a ghost that isn't even her granddaughter. Neither Aldith nor the player can ever be certain.

**Why killing her IS the containment (contain, don't cleanse).** The marsh is a **thinning-edge Aldith deepened.** Her rituals were the *engine*: they concentrated dead Aether and **woke the drowned dead** (the `swamp_revenant`s are *her footprint*, not the marsh's nature — full undead is Wastes-grade). So her death removes the engine: the concentration fades, the revenants settle, and the marsh **reverts to its thinning-edge baseline** (adders, voices, unease, no walking dead). You **cannot cleanse** the marsh (the edge stays — consistent with LORE_TIMELINE "contain, don't cleanse" and "a broken ward returns the area to its underlying thinning state"), but you need **no separate "cap the marsh" mission** the way the tainted spring did: *the spring was an impersonal wound; the marsh's worsening was a person. End the person, end the worsening.*
- **Marsh arc:** calm (adders) → corrupted (adders + revenants) → calm (adders). Full circle back to `marsh_clearing`'s framing of the fen as the adders' home.

## Ada (the dead granddaughter)
- **Who she was:** Aldith's granddaughter, a young girl. The portrait at the cabin is Aldith and Ada together; the team's gut-punch realization at the tea is *"…she looks like Nell"* — which is *why* Nell becomes the target.
- **How she died:** an **ordinary death, away from the thinning** (not the bad ground). This matters twice: it makes Edda's hope plausible (Ada most likely **crossed properly**, unlike those who die in the thinning), and it sharpens the horror — **Aldith ruined herself chasing a child who was already at peace.**
- **Design fact (two-track):** because Ada died normally and away from the edge, she is NOT a lingering voice; the "Ada" in the reeds is the ambiguity above.

## Personality & tells
- **Register:** warm, hospitable, grandmotherly on the surface; the horror is *tenderness pointed wrong*. Every step of her descent is love, twisted.
- **The "off" tell is doubled (keep both):**
  1. **The offerings turn** — what she asks for drifts mundane → strange: herbs → grain → a coin → bone → grave-dust → *a thing with a name on it.* Spent from real inventory, so each leaving-the-hand *feels* like a small wrongness. **The full drift (coin / grave-dust / a named thing) is the DEFERRED deep version** — it belongs to the descent, when the Lord's alarm is high enough to carry it and the eerier sources (grave-dust from the restless dead, a shard of a grief-bound soul) are reliably available. The mid-descent eerie ask to bank: the **`cursed_spirit` ("a restless soul bound to this place by old grief") drops a `soul_shard`** — a grief-bound witch asking for a shard of a grief-bound soul.
  2. **The gatherers come back having said too much** — her **tea** softly charms the team into talking, and she mines them for the settlement's secrets, including the children.
  - Plus, in the deep marsh, **the drowned dead rising** (revenants).
- **The turn:** at tea she notices / shows the portrait → the "she looks like Nell" beat → she begins asking about Nell → the demand surfaces: Nell's **body as a vessel** (erased). The Lord's flat refusal is the mask slipping. **Nell never goes to the marsh — the asking is the horror, not the act.**
- **Dying clarity (natural, no magic):** the corruption rode her *living* mind; as she dies its grip loosens and she is herself for one breath, horrified:
  > *"I buried her. I wept. I never once thought to bring her back. What did I let it make of me?"*

## The letters (quoted in the journal, like Hale's)
The team carries her letters home; the **journal quotes fragments** of Aldith writing to dead Ada, the descent visible across them: love → grief → temptation → the marsh exploiting the love → the terrible tender plan. The reveal is her *story*, not her name (they knew her name from weeks of bargaining). Verbatim drafts (LOCKED 2026-06):
> *Ada. I made too much bread again. Forty years feeding two and I cannot unlearn it. I left the little loaf on the sill for the birds. You would have laughed at me for that.*
>
> *Ada. The house keeps too quiet. I talk to you the whole day through. I know it is foolish. It answers the quiet better than anything else does, so I have stopped minding.*
>
> *Ada. There are voices in the reeds now, after dark. One of them carries your sound. I know it is not you. But I am so tired, and it is so near your voice, and I have so little of you left to hold.*
>
> *Ada. The voice knew about the blue flowers by the door. It knew about the loaf on the sill. How could it know those things, if it were not you? I was wrong to doubt. Forgive an old woman her doubting. I am listening now.*
>
> *Ada. I have learned what the water can do. Be patient now. I will find you your way back, and a warm place to keep you, and you will never lie cold in the ground again.*

The **fourth letter is the bridge** (it flips "I know it is not you" → belief): the voice *proves* itself with her own memories, the marsh wearing Ada's voice and turning Aldith's grief against her.

## The end, and who carries what
- **Linear + merciful.** She cannot be saved. The refusal **turns her** (she attacks); the team does the grim necessary thing in the marsh. **No magic, no Edda at the fen.** (A real "try to reach her and fail" branch needs choice-plumbing; ship linear first.)
- **The Lord's omission (custody beat):** the team brings the letters to **the Lord**, who reads them first. He gives Edda the letters but **shields her from the Nell-demand.** It is an *omission, not a lie* — "she'd gone wrong, the marsh was in her, she turned on us" is *true* (she did attack); he simply never says *why.* Journal gut-punch:
  > *"I told Edda she turned on us. That much is true. I did not tell her why. I will not."*

## The Edda mirror + Edda's prayer-memory (the spine)
**Aldith is Edda's dark mirror, literally.** Canon (FOUNDING_CHARACTERS): Edda lost daughter **Mira** and granddaughter **Mae** to fever in '47 — that hole is *why she came south for Nell.* Two grandmothers, each lost a granddaughter; **Edda grieved and turned toward life** (herbs, Nell); **Aldith could not let go.** Aldith is who Edda could have become.
- **No date/illness rhyme.** The mirror is the *kind* of loss, not matching calendars; '47 stays Edda's private fact, not a shared "fever year."
- **Vehicle is an Edda memory (founder vignette), NOT the Lord's journal:** Edda, at home, with Aldith's letters, **prays for Aldith and Ada** in Helga's old folk way (canon: she does her quiet rituals in corners) — a *prayer*, not a working rite, grandmother to grandmother. This is where the player learns about **Mira and Mae** (Edda confiding to the Lord). Her hope: that the two girls *"found each other, wherever the good dead go, and are laughing somewhere."*
- **Canon care:** (1) Mae and Ada most likely **did cross** (ordinary deaths away from the thinning), so Edda's hope is plausible *and* sharpens the horror. (2) **Nell must NOT learn this** — she doesn't know about Mira/Mae; strictly Edda ↔ Lord.
- **Pattern:** side-stories **unlock founder memories** (Corin from the boars, Edda from the witch). The optional threads are where the cast deepens.
- **Double duty:** Edda recognizes it — *"That's not witchery gone bad. That's the bad ground talking through her."* So the cozy side-quest becomes the **first human-scale hint of what the Wastes do to a mind**, quietly foreshadowing the Hollow Sickness / the cosmic threat without naming it.

## Does she pass? No → the later ally payoff (banked)
She dies in the thinning, and **canon is explicit: those who die there do not cross — they join its voice-population** (LORE_TIMELINE death section). So she **lingers** — but **as herself**, because the corruption rode her *living* flesh and death frees the spirit of it (it does not free her of the thinning's hold; no rite needed). Lucid, grief-quieted.
- **Payoff (LATER — the deferred home-invasion beat, when the thinning reaches the settlement):** the lingering dead become perceptible at home and **Aldith returns as an ALLY** — grateful for the mercy, knowing the thinning from inside. Redemption across death; an emotional anchor for that beat.
- **Craft rule:** end the side-story **clean** (the kill, the letters, Edda's prayer, silence). **No hint** she lingers — the seed lives in the *mechanics* (she died in the thinning), never in the text, so the return is a true surprise.

## "Talent / ability" ideas
Not a recruit, so no talent tree. Combat is the existing `bog_witch` boss kit: **Curse of Weakness** (str debuff) + **Poison Cloud** (magical AoE), tier 2, with `marsh_adder` and (mid-arc) `swamp_revenant` support. Loot already includes `hex_fetish`, `witch_eye`, `nightbloom`, `mugwort`, `nettle`, `snake_oil`. Possible chain reward: a recipe / Greymantle / a small boon (TBD — see below).

## Relationships
- **Ada** — dead granddaughter; the entire engine of her grief and her sin.
- **Edda** (`[[founder_edda]]`) — her literal dark mirror; the one who prays for her; the one shielded from the Nell-demand.
- **Nell** (`[[founder_nell]]`) — the unwitting target (resembles Ada); never goes to the marsh; the asking is the horror.
- **The Lord** (`[[founder_the_lord]]`) — reads the letters first; commits the merciful omission.
- **Halldora / the Cult** — thematic mirror only; she is an **independent** ruin who reached the same sin, NEVER stated on screen.

## Preferences & specificities
- **Her tea** — the charm/extraction vector; hospitality as a trap.
- **Offerings she asks for** — the drift mundane → strange (herbs → grain → coin → bone → grave-dust → a named thing) is her signature tell.
- **The portrait** of her and Ada — the turn pivots on it.
- **Bread on the sill / the blue flowers by the door** — small domestic motifs from the letters the marsh later weaponizes as "proof."

## Opening arc — BUILT (alpha, 2026-07-06)
The `the_bog_witch` story-chain (`frontend/src/engine/story/chains.ts`) + missions (`sideChainMissions.ts`) + chronicle beats now ship the **whole opening drip**, mystery-only, dark descent still deferred:
1. `marsh_clearing` ("Clear the Marshes") → beat **ch1_reeds_voice** (a voice offers a bargain; settlers don't know her).
2. `reeds_bargain` ("The Reeds' Price", **5** wheat) → beat **ch1_reeds_price** (the easy trade; she stays distant).
3. `fen_barter` ("Tea at Aldith's", **3** wheat, repeatable) → after **×3**, beat **ch1_reeds_tea**: the tea softly mines the gatherers, Bett names her **Aldith**, the **widow** who bakes too much; the Lord offers to bring her behind the walls and she **refuses** (rooted to the fen); Bett blurts the **painting → "she's the image of our Nell"** and tells her everything. Cozy on the surface; dread is all the player's.
4. **The drift as a descending-count recipe** (each a light `deployItems` card, guaranteed, `unique`, teal `sideChain` "The Reeds"): `reeds_fangs` (**3** `fang`) → `reeds_hooves` (**2** `cloven_hoof`) → `reeds_skull` (**1** `boar_skull`). Numbers shrink, grimness rises; each is compliable alone, the *pattern* is the horror.
5. On the skull → beat **ch1_reeds_doubt** ("Grain, and only grain"): the Lord recaps the shape (3→2→1), notes he knows her name and *"nothing else true… not who it is she has lost,"* and **draws a line — grain only from here, one more such ask and we are done** — and does not tell Edda. **The cozy grain `fen_barter` stays live** (he capped the escalation, not the relationship), so no orphaned mission, and the line is the exact hook the deferred descent crosses.

Supporting build: durable `missionCompletions` tally + `MissionRequirements.missionCount` + `awaitMissionCount` chain primitive; new materials `cloven_hoof` / `boar_skull` (drop from boars; `fang` bumped to 0.5 and wolf grain-drop removed); chain + primitive tests.

## Open threads / TBD
- **The dark descent is design-locked but UNBUILT.** Banked 2026-06-22, post-alpha.
- **NOT yet built:** the discovery/scout-report epilogue on `marsh_clearing`; the **"The Cabin in the Reeds"** follow-up mission; the deeper offering drift (coin / grave-dust / `soul_shard` / a named thing); the side-chronicle vignettes + the **letter-quoting** in the journal; the **founder-memory vignette** system (Edda's prayer); the **offering→peaceful** tradeoff beat (mechanic B, post-reveal); the final kill mission; the later **ally-return** beat.
- **Stale placeholder to reconcile:** the existing apprentice mission **`bog_witch_lair` ("The Bog Witch's Lair")** is a generic "end this" kill quest that **predates** the Aldith/Ada narrative and contradicts its tone (linear-merciful, name-the-grief). Flag: when the chain is built, either retire/rework `bog_witch_lair` or fold it in, so there is one canonical Bog Witch, not two.
- **Fenbalm PAIR (banked):** a recurring "gather at the fen" chore (unlocks via `missionDone: marsh_clearing`) **and** a Fenbalm remedy recipe (winter-fever / deep-cough) — build together when alchemy is touched. **Post-chain, the fen-gather is adders only** (revenants gone with her).
- **Reward TBD:** recipe vs Greymantle vs small boon for completing the chain.
- **Dependencies:** offering/`deployItems` mechanic (A, BUILT — live on Greyford) → build the offering tradeoff (B) on top; chronicle letter-quoting; founder-memory vignettes. A proper **Niamh / Primal ward** to fully quiet the marsh edge is an **optional later callback** (like the spring), not needed for alpha.
- **Branch (dropped for now):** an earlier "small choice to bring her back / try to reach her and fail" needs choice-plumbing; ship **linear** first.

## Cross-refs
- **Design (primary source):** the retired side-stories doc (in git) — "Prototype chain — The Bog Witch" and the "Aldith & Ada" sections (all of it consolidated here).
- **Lore:** `docs/lore/TIMELINE.md` — Hollow magic, "contain, don't cleanse," the thinning vs the Wastes, death-in-the-thinning (voice-population), broken-ward = revert-to-thinning.
- **Magic rules memory:** `[[project_magic_rules]]` (resurrection-via-sacrifice = the path Halldora refused → Cult; casters carry their own power; priests = unwitting Light/Solara).
- **Code:** `shared/src/data/missions/sideChainMissions.ts` (`marsh_clearing`); `shared/src/data/herbs.ts` (`fenbalm`, marsh-only); `shared/src/data/enemies.ts` (`bog_witch`, `marsh_adder`, `swamp_revenant`); `shared/src/data/missions/apprenticeMissions.ts` (`bog_witch_lair` — stale placeholder, see TBD).
- **Cast:** `[[founder_edda]]`, `[[founder_nell]]`, `[[founder_the_lord]]`.
- **Sibling chains:** the Tainted Spring / boar chain (same "thinning into the everyday" family) — the retired side-stories doc (in git), `docs/DESIGN_ACT1_SETTING.md`.
- **Founder bios:** `docs/lore/FOUNDERS.md` (Edda's Mira/Mae loss, '47 fever).
