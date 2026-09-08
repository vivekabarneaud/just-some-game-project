# Hester Ironbark
- **Status:** in progress
- **Recruit ID:** char_019
- **Portrait file:** `helga_ironbark` (NAME MISMATCH: she was renamed from "Helga" because canon Helga is Edda's Nordveld grandmother. The portrait asset still uses the old `helga_ironbark` filename. Either rename the asset or leave it as a known-mismatch; flagged under Open threads.)
- **Class / Race / Origin:** warrior / human / Ashwick
- **Food preference:** fresh
- **Trait(s):** `axe_master` — "Felling Arm" (weapon-affinity: +12% damage when wielding an axe; `weight: 0` so it only appears on fixed premades, never randomly rolled). She is the FIRST weapon-affinity character.

## Recruit-card bio (public surface)
> Hester hauled ironbark alongside men who never let her forget she wasn't one of them. Years of it, until the last foreman who put his hands on her didn't get up. She tells herself she didn't mean to kill him; what frightens her is how easy it was. The iron she's known for is a wall she built that day, so she never has to learn that about herself twice. She still works wood, only quietly now: she whittles little birds from the offcuts, keeps the axe that did both jobs sharp, and does not talk about either.

## Deep lore (discovery-only)
The wound, in plain terms: she spent years hauling ironbark among men who never let her forget she wasn't one of them. It ended when the last foreman who put his hands on her didn't get up. She tells herself she didn't mean to kill him. What actually frightens her is not the death; it's how *easy* it was.

"The iron" everyone praises in her, the flat hardness, the unbothered quiet, is not her nature. It is a wall she built that single day, deliberately, so she would never again have to learn what she learned about herself. The calm reads as strength from outside. From inside it is a containment measure.

She did not stop working wood, she only went quiet about it. The same axe did both jobs, the felling and the killing, and she keeps it sharp. She does not talk about either thing, and she would rather no one connect the two.

## Personality & tells
- Reads as iron: flat, unbothered, hard to provoke. This is the constructed wall, not the woman.
- Avoids men and hates to be touched. A hand on her shoulder is the worst thing you can do; the body remembers the foreman.
- Whittles small birds from wood offcuts. This is the soft tell, the part of her the wall is protecting. She does it quietly and does not advertise it.
- Keeps her axe sharp as a matter of course. Treats it as a tool, not a trophy. The fact that it did "both jobs" is something she will never volunteer.
- Does not talk about the killing or the whittling. Both are off-limits; a player should have to earn either through loyalty/tavern beats, not get them from the card.

## Relationships
No family or bond entries in `CHAR_RELATIONSHIPS` (she is a curated solo character with no clan). Her defining relationship is to herself: the day she discovered what she was capable of, and the wall she has lived behind since. Her instinctive distance from men and from touch shapes every other relationship before it starts.

## Preferences & specificities
- **Food:** fresh.
- **Carries:** the axe that did both jobs (felling timber and killing the foreman), always kept sharp.
- **Habit:** whittles little birds from wood offcuts, quietly.
- **Boundaries:** avoids men, hates being touched.

## Talent / ability ideas
- **Current trait:** `axe_master` / "Felling Arm" — +12% damage with an axe. Implemented on the `weapon-affinities` branch via the `weaponType` tag on mainHand weapons plus `combat/traits.ts` `TRAIT_WEAPON_BONUSES` → `getWeaponTraitBonus` → applied in `damage.ts`; `CombatUnit.weaponType` is resolved in `buildAdventurerUnit`. Assigned through `premade.trait` (weight 0).
**Tree layout — "The Felling Arm" (2026-06-30):**
- *Signature passive (free, L1):* **Felling Arm** — +damage with an axe (her `axe_master` trait). The **damage** warrior — the anti-Godric (he tanks + won't kill; she *fells*).
- **T1 Foundations** (minors): **Heavy Swings** (+axe dmg/rank), **Calloused** (+slight mitigation/rank — the laborer's toughness).
- **T2 The Feller:** **Cleave** ⭐ (the axe carries through to adjacent foes), **Momentum** (ranked — consecutive hits/kills ramp her damage).
- **T3 The Work:** **Sunder** ⭐ (armor-break — splits shields/armor, fells the toughest), **Overhead** (ranked — +big-hit/crit), **Bloodied** (ranked — hits harder as the fight wears on).
- **T4 — the fork** (literally her wound): **The Feller** ⭐ (sustained cleave — mow through groups; timber-work, *impersonal*) **OR** **The Executioner** ⭐ (single-target burst — the killing blow she's terrified she's so good at; *personal*). The axe did both jobs; you choose which she leans into.
- **T5 — capstones:** **The Iron Wall** ⭐ (her constructed calm, mechanized — hard to provoke, immune to fear/stun/taunt; she just keeps swinging) and **What She Learned That Day** ⭐ (loyalty-gated — on a killing blow, a brief cold lethal surge; *"how easy it was,"* as power). ⚠️ *"What She Learned" likely needs tempering on real numbers (cf. Nessa's One Shot).*
- *Mirror:* one **shield** capstone (Iron Wall — the calm she built to survive herself) + one **wound** capstone (the cold ease of killing). **Proof-of-concept:** first weapon-affinity character; this axe tree is the template a bow-deadly archer / dagger duelist can reuse.

## Arrival & role (BUILT July 2026 — see wiring note)
- **BUILT (July 2026).** The two-beat arrival is now wired as a 3-part chain:
  **Run Down** (`hester_rescue`, Beat 1 — fires `ch1_hester_rescue`, she flees) →
  **No One Followed** (`quiet_the_woods`, the uneasy patrol that guarantees a gap;
  requires `hester_rescue`; fires `ch1_woodcutter_ghost`, Beat 2a "it's a ghost")
  → a real-time delay (`HESTER_RETURN_DELAY_MS`; ~18h prod / 90s dev) → she
  "returns" (Beat 2b): joins via a bespoke block in `syncArrivals` (her premade
  `arrival` is now `{ type: "scripted" }` so `getArrivedPremades` never adds her),
  firing `ch1_woodcutter` (the reveal). Woodworker + `tools_of_the_trade` re-gated
  from `hester_rescue` → `quiet_the_woods`. State: `hesterReturnAt`.

- **Arrival — a two-beat field rescue + a return (LOCKED 2026-06-30).** A runaway like Sable: she killed the foreman (her bio), hunted by the law *and* the dead man's crew (the foreman's sort — bad men, out for revenge). NOT a gate defense (that staged it). Instead:
  - **Beat 1 — the rescue (she vanishes).** A **rescue mission**: **Gareth**, scouting, finds a lone woman run down by a pack of men and *cannot* ride past it (his "starts fights over anyone pushed around" + the deserter who wouldn't fire on the fleeing — his fury is the engine; this is as much a Gareth beat as a Hester beat). The team **puts the crew on their knees** (KO'd, conscious, subdued — the Thornwood/settlement drive-off-don't-slaughter ethic + Model-C rout). One spits: *"Why would you save this murderer?"* then bitterly *"She didn't even say thank you — already gone."* Because **Hester has already run** (the iron-wall: trusts no one, knows they'll brand her). The **Lord isn't there** (field missions are the team's — he stays home, "you'd be a liability"), so what to do with the kneeling crew is the *team's* call, and they just **let them go**: nothing to do with them, nowhere to hold them, the woman already fled. The Lord learns the whole thing from the team's **report** back home. Mission success does NOT recruit her — it sets a flag. The word "murderer" hangs unresolved.
  - **Beat 2 — the return (a slow arc, days later, on her terms).** She'd watched from the trees, testing them with distance. She does NOT reveal herself — instead **wood starts appearing on the mill stack, a little more each day, unseen**: clean-felled timber, no one knowing who cut it or how it got there. **Jory** marvels at the cuts and tells the Lord about the phantom woodpile; the Lord, dry, says **"guess it's a ghost"** — a throwaway joke, *before anyone knows the ghosts to the south are real* (dramatic irony the player only feels in hindsight). The mill-hands puzzle over the ghost-woodcutter; no one claims the credit. Only after days of this — once she's sure they're kind — is she finally **seen** (Jory catches her at dawn, or she just stays one morning instead of slipping off). **The recognition scene (in the Lord's tent):** Jory, who does NOT know her (he wasn't at the chase), ushers her in proud — a marvel of a woodcutter he's found, gentle approach (she's a man-wary wall). **Gareth is already there** (settlement matters with the Lord), looks up, and *recognizes* her — not as a threat but as the woman he rode in for: *"…That's you. The one from the chase."* That snaps the two beats together in the room, so the Lord (who knows the rescue from the team's report) connects it on the spot. **Hester's reaction:** not shy — *braced*. Being named is the exact thing she fled; she's waiting for "murderer" to land and for this to go bad. A single **guarded nod** (a clipped "yes" at most), no explanation, no plea, no thanks — she confirms it and waits. It doesn't come: the Lord weighs the rumor against the **silent gifts of timber** and takes her on her **deeds, not the men's word**; Gareth's quiet gladness vouches without a speech. The brace eases, barely. She stays. Four people, no one makes a speech. **Her thank-you was the wood all along** (pays off the crew's "she didn't even say thank you"). She **joins the roster** + her arrival **unlocks the Woodworker** (Jory's carving bench; she takes the Lumber Mill). Wants a **chronicle beat** (the phantom woodpile + the "ghost" who turned out to be a woman who came back, said nothing, and stayed).
  - *Note:* NOT the first human enemy (brigand raiders already exist); the weight is **moral** (defending a self-confessed-by-rumor killer), not novelty. The deep truth (the foreman abused her; what terrifies her is how *easy* the killing was) stays a loyalty-earned **discovery**.
  - *Gate:* Village tier + the haven seeded (post-Stonebridges) + the lumber mill built (so Jory's there for Beat 2). Haven-flag is a known TODO.
- **Jory/Hester building swap (user idea, 2026-06-30 — adopted).** Hester takes the **Lumber Mill** (felling/hauling timber — literally her past as an ironbark hauler; solitary rough work suits a woman who avoids men + touch), which **frees Jory to move to the Woodworker** (fine carving — bows, staves, shields, his instruments — what he prefers; he was "married to the mill" as a burden). Both characters get a quiet payoff.
- **Arms the family.** The chain: **Hester fells/supplies the ironbark → Jory carves it into better bows** (Nessa, Gareth) **and shields** (Godric). Her namesake hardwood becomes the family's gear. (NB: it's *Jory* who carves the bows/shields at the Woodworker; Hester is the feller/supplier + possibly unlocks an **ironbark** hardwood material for sturdier wooden gear. Exact mechanic flexible.) Pairs with the "adventurers should arrive with basic starter gear" idea — arrive rough, upgrade via this chain.

## Open threads / TBD
- **Banked TODO — Felling Arm is currently DORMANT.** No craftable axe items exist yet, so her +12% bonus never activates in play. Follow-up: add craftable axe items tagged `weaponType: "axe"`. Until then the bonus is a visible-but-inert "string" on her sheet.
- **Portrait filename mismatch.** Asset is still `helga_ironbark` after the Helga → Hester rename. Decide whether to rename the asset or accept the mismatch.
- **Per-character talent tree.** The bespoke axe/weapon-affinity warrior tree is a future pass, gated on the talent rework; not yet specced.

## Cross-refs
- `shared/src/data/premade-characters.ts` — char_019 (verbatim bio, class/race/origin/food/trait/portrait).
- the retired roster-curation doc (in git — superseded by per-character introduction) — curated-cast deepening note (item 5) + "Weapon affinities — BUILT" section (the `weaponType` / `TRAIT_WEAPON_BONUSES` system, first user = Hester, dormant-until-craftable-axe follow-up).
- Combat wiring: `combat/traits.ts` (`TRAIT_WEAPON_BONUSES`, `getWeaponTraitBonus`), `damage.ts`, `buildAdventurerUnit` (`CombatUnit.weaponType`).
- Memory: "Roster curation" (curated cast direction), "Origin tiers by guild level" (Ashwick is a Lv.1 origin).
