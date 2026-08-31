# Elspeth Ravencroft
- **Status:** in progress
- **Recruit ID:** char_007
- **Portrait file:** elspeth_ravencroft
- **Class / Race / Origin:** assassin / human / Ashwick
- **Food preference:** hearty
- **Trait(s):** survivor
- **Recruitment:** quest-only (`questOnly: true`). She is **excluded from the random recruit pool** and the guild browse list. She joins only by completing the side-chain mission **"A Mother's Errand"** (`a_mothers_errand`), which recruits her son Edmund and Elspeth together (`recruitsOnSuccess: ["char_009", "char_007"]`).

## Recruit-card bio (public surface)
> Elspeth never wanted to be what she is. There was a man once, Edmund's father, and a woman alone with him learned to make herself dangerous or learned to take what he gave. She chose dangerous, the quiet way: a pinch in his cup, then the road, her boy on her hip. She is no fighter, only a poisoner, and only because she had to be, and she watches the exits in every room she enters. She does not come to the guild for coin or glory; she comes because her son does, and she will not let him walk into danger alone. Between watching his back, she crochets small soft things for the settlement's children: the patient mothering she never had the quiet to give her own.

## Deep lore (discovery-only)
Elspeth is a **reluctant poisoner-mother**, not a career killer. She did not choose the assassin's road; it was the only road that kept her and her son alive. Edmund's father was a violent man, and a woman alone with such a man learns to be dangerous or learns to endure what he hands her. She chose dangerous, in the only way available to someone who could never out-muscle him: a pinch in his cup, the quiet way out, and then the road with her boy on her hip.

She is **no fighter, only a poisoner**, and only because she had to be. She has killed exactly one man, by necessity, to survive and to shield her son. That is the whole of her violence, and it is enough to have remade her: she watches the exits in every room she enters.

She did not come to the guild for coin or glory. She came because **Edmund** did, and she will not let him walk into danger alone. Her presence in an adventuring company is, in her own eyes, an absurdity she tolerates only because the alternative is letting her son adventure without her at his back.

The **mystery on the quest card is deliberate**: the woman who comes to the gate before dawn is grey-faced and gives no name. The player does not learn she is Edmund's mother until the boy is saved. Preserve that reveal — the card never says "mother" in her own voice; the title "A Mother's Errand" carries the only hint.

## Personality & tells
- **Watches the exits.** The card-canon tell: in any room she enters, she has already mapped how to leave it. A survivor's reflex, never fully switched off.
- **Quiet and indirect.** Her one killing was a pinch in a cup, not a blade in the dark. She solves problems the soft, deniable way.
- **Crochets** small soft things for the settlement's children. This is her central soft tell: the patient, gentle mothering she never had the quiet or safety to give her own son. The needles are always moving when she is sitting still.
- Comes alive only around **Edmund** — her whole reason for being there. Her watchfulness sharpens to fear whenever he runs toward a risk.

## Relationships
- **Edmund Blackwood** (char_009) — her son. See [cast/edmund-blackwood.md](cast/edmund-blackwood.md). The defining bond of her life and her only reason for being in the guild. Cross-link both ways. Everything Edmund knows of blades, patience, and quiet, **she taught him** — the survival craft she'd been forced to learn. What she cannot forgive herself is that he came to *love* the danger she meant only to protect him from.
- **Edmund's father (a Blackwood)** — the violent man she poisoned. Dead. The wound under everything. (Per `CHAR_RELATIONSHIPS` note: "Edmund's father was a Blackwood, Edmund is their son.") Name and details TBD.

## Preferences & specificities
- **Food:** hearty.
- **Carries / does:** crochet work, always — yarn and small finished pieces for the town's children.
- **Habit:** maps the exits of every room on entry.
- **Method:** poison, the quiet way. She is not a duelist and does not pretend to be.

## Talent / ability ideas
Bespoke **assassin / poisoner** tree on the assassin chassis (class is the frame; per-character talent rework pending). Direction from the retired roster-curation doc (in git — superseded by per-character introduction):
- **Poison master.** Leading design: an **extra Elspeth-only mission supply slot** stocked with her own bespoke strong potions, chosen pre-mission (working names: Widow's Kiss = heavy DoT; Dead Man's Draught = cheat death once; Quietus = burst). Reuses the existing per-adventurer supply-slot tech.
- **Simple fallback:** a trait granting +poison / DoT damage.
- **Interim trait shipped:** `survivor` (fits "she survives because she had to learn to").
- **Loyalty-gated depth (per the curation spine):** she unlocks her deadlier bespoke poisons as loyalty climbs — a poisoner guards her real recipes from strangers.
- **Pair / family synergy (category #6):** deploying Elspeth and Edmund together gives a mother-son bonus — the synergy is literally why she's there.

## Arrival arc — DEEPENED 2026-07-08 (design locked, not yet wired)
The single-mission recruit was under-cooked; deepened into a proper little arc. Decisions:
- **Rescue reframed (fixes the timing):** Edmund is NOT seconds from death (an acute cornering can't survive the beg-muster-ride-out loop). He is **held and stalling** — debt-collectors who cornered him over cards want their money or to make an example, and he is talking his way along the edge (peak Edmund), which won't last the night. That gives a believable window. Elspeth can't pay and can't break a pack of toughs alone, so she runs for the guild's blades. The reveal (the nameless grey-faced woman is his mother) is preserved.
- **Elspeth is LAB-BOUND / non-combat.** She joins via the rescue but does NOT adventure. Reasons: (1) solves the assassin glut (Sable + Edmund already); (2) fits "no fighter, only a poisoner" — a poisoner *is* an alchemist, the lab is where she belongs; (3) it hands the arc its emotional payoff — the **waiting mother** who armed her son and now must stay behind, brewing the potions that might bring him home, needles moving while she waits. Her presence **unlocks her bespoke poison recipes** at the Alchemy Lab. **Depends on the staff system** (a named character running a building) — the user chose to **build the staff system FIRST** (2026-07-08).
- **The bond → "Mom's Poisons" path in EDMUND's talent tree** (NOT a player-packed consumable). His tree reads as the two bloods: a gambler's luck/momentum branch and a **Mom's Poisons** branch (her survival craft), with **Dead Man's Draught (cheat-death-once)** as the keystone — the "whose blood is doing it" question rendered as a talent fork. Banks until the talent-tree system is built (like Godric's shield tree).
- **Payoff = EMERGENT, not scripted.** No death-cutscene. The dread is dramatized in play: the day Edmund's luck runs thin on a mission, either her poison (his Mom's-Poisons talent) pulls him back or it doesn't. Player-authored, gutting, alpha-friendly; the "whose blood" question stays a wound answered differently each run.
- **The father stays a shadow:** dead, unnamed (she poisoned him). Do NOT name him or connect to Aldric Blackwood the gamekeeper.
- **v1 wire scope (later):** reframe `a_mothers_errand` description (Edmund stalling) + add a `chronicleEntryId` arrival/reveal journal beat + Elspeth non-deployable/lab-bound (via the staff system) + her poison recipes unlocked by her presence. Reconcile the stale mission details in the cast files (they say bandit_thug / story_1 gate; the code is dominion_thug + tavernReputation 40).

## Open threads / TBD
- Edmund's father's name and the specifics of his death — **TBD** (only "a Blackwood, a violent man" is canon).
- Whether her poisoner supply-slot ability or the simple +DoT-trait fallback ships — **TBD** (design not yet built).
- The exact bespoke-poison names (Widow's Kiss / Dead Man's Draught / Quietus) are **working-name drafts**, not locked.
- Elspeth's age and where she's from within Ashwick — **TBD** (not in the data or timeline).
- **Edmund's cast file ([cast/edmund-blackwood.md](cast/edmund-blackwood.md)) is indexed but not yet written** — cross-links assume it lands.

## Cross-refs
- Data: `shared/src/data/premade-characters.ts` (char_007; `CHAR_RELATIONSHIPS` char_007 / char_009).
- Mission: `shared/src/data/missions/sideChainMissions.ts` → `a_mothers_errand` ("A Mother's Errand").
- Design: the retired roster-curation doc (in git — superseded by per-character introduction) — Ashwick ability drafts (#4 Elspeth), signature-feature taxonomy (#3 bespoke consumable set, #6 pair synergy), loyalty-as-spine, quest-unlock recruitment flagship (Edmund & Elspeth).
- Cast: [cast/edmund-blackwood.md](cast/edmund-blackwood.md) (son, char_009).
- World facts defer to `docs/lore/TIMELINE.md`.
