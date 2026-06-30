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
- **Direction:** a bespoke axe / weapon-affinity warrior tree once the per-character talent rework lands. The warrior class stays as the chassis + equipment frame; the tree leans into the axe identity and the "felling arm" fantasy. She is the proof-of-concept that the weapon-affinity category is reusable (a bow-deadly archer, a dagger duelist can follow the same pattern).

## Arrival & role (parked 2026-06-30)
- **Arrival — a two-beat field rescue + a return (LOCKED 2026-06-30).** A runaway like Sable: she killed the foreman (her bio), hunted by the law *and* the dead man's crew (the foreman's sort — bad men, out for revenge). NOT a gate defense (that staged it). Instead:
  - **Beat 1 — the rescue (she vanishes).** A **rescue mission**: **Gareth**, scouting, finds a lone woman run down by a pack of men and *cannot* ride past it (his "starts fights over anyone pushed around" + the deserter who wouldn't fire on the fleeing — his fury is the engine; this is as much a Gareth beat as a Hester beat). The team **puts the crew on their knees** (KO'd, conscious, subdued — the Thornwood/settlement drive-off-don't-slaughter ethic + Model-C rout). One spits: *"Why would you save this murderer?"* then bitterly *"She didn't even say thank you — already gone."* Because **Hester has already run** (the iron-wall: trusts no one, knows they'll brand her). Mission success does NOT recruit her — it sets a flag. The word "murderer" hangs unresolved.
  - **Beat 2 — the return (days later, on her terms).** A **peaceful return event** a few game-days after Beat 1: she'd watched from the trees, saw the settlement was kind, and comes to the **lumber mill** carrying **timber she felled herself** — her thank-you, said in clean-cut wood because she can't say it in words (pays off the crew's "she didn't say thank you" jeer: she did, just not aloud — her whole wordless-wall character in one gesture). **Jory** (at the mill) sees the strength + the clean cuts, knows master work, fetches the Lord. She's welcomed (haven ethic — the "murderer" charge unproven, sheltered anyway), **joins the roster**, and her arrival triggers the Jory/Hester swap. Wants a **chronicle beat** (the Lord on saving a stranger who fled, and the day she came back with wood and said nothing and stayed).
  - *Note:* NOT the first human enemy (brigand raiders already exist); the weight is **moral** (defending a self-confessed-by-rumor killer), not novelty. The deep truth (the foreman abused her; what terrifies her is how *easy* the killing was) stays a loyalty-earned **discovery**.
  - *Gate:* Village tier + the haven seeded (post-Stonebridges) + the lumber mill built (so Jory's there for Beat 2). Haven-flag is a known TODO.
- **Jory/Hester building swap (user idea, 2026-06-30 — adopted).** Hester takes the **Lumber Mill** (felling/hauling timber — literally her past as an ironbark hauler; solitary rough work suits a woman who avoids men + touch), which **frees Jory to move to the Woodworker** (fine carving — bows, staves, shields, his instruments — what he prefers; he was "married to the mill" as a burden). Both characters get a quiet payoff.
- **Arms the family.** The chain: **Hester fells/supplies the ironbark → Jory carves it into better bows** (Brenna, Gareth) **and shields** (Godric). Her namesake hardwood becomes the family's gear. (NB: it's *Jory* who carves the bows/shields at the Woodworker; Hester is the feller/supplier + possibly unlocks an **ironbark** hardwood material for sturdier wooden gear. Exact mechanic flexible.) Pairs with the "adventurers should arrive with basic starter gear" idea — arrive rough, upgrade via this chain.

## Open threads / TBD
- **Banked TODO — Felling Arm is currently DORMANT.** No craftable axe items exist yet, so her +12% bonus never activates in play. Follow-up: add craftable axe items tagged `weaponType: "axe"`. Until then the bonus is a visible-but-inert "string" on her sheet.
- **Portrait filename mismatch.** Asset is still `helga_ironbark` after the Helga → Hester rename. Decide whether to rename the asset or accept the mismatch.
- **Per-character talent tree.** The bespoke axe/weapon-affinity warrior tree is a future pass, gated on the talent rework; not yet specced.

## Cross-refs
- `shared/src/data/premade-characters.ts` — char_019 (verbatim bio, class/race/origin/food/trait/portrait).
- `docs/DESIGN_ROSTER_CURATION.md` — curated-cast deepening note (item 5) + "Weapon affinities — BUILT" section (the `weaponType` / `TRAIT_WEAPON_BONUSES` system, first user = Hester, dormant-until-craftable-axe follow-up).
- Combat wiring: `combat/traits.ts` (`TRAIT_WEAPON_BONUSES`, `getWeaponTraitBonus`), `damage.ts`, `buildAdventurerUnit` (`CombatUnit.weaponType`).
- Memory: "Roster curation" (curated cast direction), "Origin tiers by guild level" (Ashwick is a Lv.1 origin).
