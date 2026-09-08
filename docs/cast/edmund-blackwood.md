# Edmund Blackwood
- **Status:** locked 2026-06-28
- **Recruit ID:** char_009
- **Portrait file:** edmund_blackwood
- **Class / Race / Origin:** Assassin / Human / Ashwick
- **Food preference:** fresh
- **Trait(s):** lucky
- **Flags:** `questOnly: true` — excluded from the random recruit pool. He joins **only** via the quest "A Mother's Errand" (see Recruitment).

## Recruit-card bio (public surface)
> His mother taught him to defend himself the way she'd had to: blades, patience, quiet. He learned it well. What she never taught him, what she cannot forgive herself for, is that he loves it. The danger, the table, the long odds, the moment it is all on the line. He bets coin he does not have and his own skin like it is worth nothing, and grins the whole way down. Whether the luck is real or he is the best cheat alive, no one can say, least of all the men he leaves at empty tables. His mother watches him run toward every cliff she spent his childhood dragging him back from, and wonders whose blood is doing it: hers, or his father's.

## Recruitment
- Unlocked by the side-chain quest **`a_mothers_errand` ("A Mother's Errand")** in `sideChainMissions.ts`. On success it recruits **Edmund (char_009) and Elspeth (char_007) together** (`recruitsOnSuccess: ["char_009", "char_007"]`).
- The setup: a woman comes to the gate before dawn, grey-faced and giving no name. Her son is cornered at the old ford by a pack of men closing in over money he won that he maybe should not have. She cannot reach him in time, so she begs. The player drives the men off and brings him home. **Edmund is the "fool" you go rescue;** the nameless woman is his mother, Elspeth Ravencroft.
- Quest specifics: difficulty 2, duration 600, deploy cost 5, reward 20 gold, encounters 3x `bandit_thug`, `requires: story_1_scouting`, `unique: true`, two `any`-class slots.

## Deep lore (discovery-only)
- **The gambler-assassin.** Elspeth taught him to defend himself the way she'd had to: blades, patience, quiet. He learned it well. What she never taught him, and cannot forgive herself for, is that **he loves it** — the danger, the table, the long odds, the moment it is all on the line. He bets coin he does not have and his own skin like it is worth nothing, and grins the whole way down.
- **The luck question.** Whether his luck is real or he is simply the best cheat alive, no one can say, least of all the men he leaves at empty tables. (His mechanical trait is `lucky`; the in-fiction ambiguity is deliberately unresolved.)
- **His father was a violent Blackwood** — the man Elspeth poisoned to escape (see her bio: "a pinch in his cup, then the road, her boy on her hip"). Edmund's mother watches him run toward every cliff she spent his childhood dragging him back from, and wonders **whose blood is doing it: hers, or his father's.** That dread is the emotional core of the pair.
- **Surname caution:** Blackwood is a common Hearthlands name. Edmund is **NOT** related to Aldric Blackwood the gamekeeper. Do not connect the two.

## Personality & tells
- Reckless joy under pressure: he grins widest when the odds are worst. The thrill, not the coin, is the point.
- Carries a gambler's cool at the table and an assassin's quiet in a fight — same skillset, opposite advertisement.
- He leaves men at empty tables (cleaned out, or cheated, or both) and never quite settles which it was.

## Relationships
- **Elspeth Ravencroft** (char_007) — his mother. They join together and she comes to the guild only because he does; she will not let him walk into danger alone. Cross-link: [cast/elspeth-ravencroft.md](cast/elspeth-ravencroft.md).
- **His father** — a violent Blackwood, dead by Elspeth's hand. Never named on the card; the shadow over both of them.

## Preferences & specificities
- Food preference: `fresh`.
- A gambler's kit: cards, dice, whatever's at the table. (Specific carried object TBD.)

## Talent / ability ideas
- **BANKED, NOT BUILT — momentum / luck system.** Design seed for his bespoke tree: a **momentum** resource that swings between **lucky and unlucky streaks**, with a **momentum-based talent branch** unique to Edmund. Mechanically this would make his combat output volatile and self-reinforcing (winning builds momentum toward bigger payoffs; losing drags into an unlucky streak). This is **unbuilt** — no implementation exists yet. Treat as a future direction only.
- Class chassis is assassin (blades, patience, quiet, per the bio); the momentum branch would sit on top of that as his signature.

## Arrival arc — DEEPENED 2026-07-08 (design locked, not yet wired)
See [cast/elspeth-ravencroft.md](cast/elspeth-ravencroft.md) for the full arc; Edmund's side:
- **The rescue is a stall, not an execution.** He is cornered/held over a card debt but NOT seconds from death — the toughs want their money or to make an example, and he is buying minutes the only way he knows (a grin, a promise of coin he can't make). Peak Edmund: talking his way along the cliff-edge, one bad beat from the drop. This gives the team a believable window to ride out. Reframe `a_mothers_errand`'s setup accordingly (currently reads "beaten to death").
- **His mother does NOT adventure with him** — she's lab-bound (see her file), so the bond is expressed at home + in his kit, not as a deploy-together pair.
- **"Mom's Poisons" — a path in his (future) talent tree.** His tree is the "whose blood is doing it" question made mechanical: a **gambler's luck / momentum** branch (his father's blood?) beside a **Mom's Poisons** branch (her survival craft she taught him), keystoned by **Dead Man's Draught (cheat-death-once)**. Not a packed consumable — a permanent part of who he is. Banks until the talent-tree system is built.
- **The payoff is emergent:** the day his luck runs thin, her poison (the Mom's-Poisons keystone) either pulls him back or it doesn't. No scripted death; the dread is player-authored. (The momentum/luck combat mechanic remains banked-not-built.)

## Open threads / TBD
- **Momentum/luck combat mechanic is unbuilt** (see Talent ideas). Flagged here so it is not mistaken for shipped canon.
- Specific carried object / table-tells — TBD.
- Whether the luck is genuinely supernatural or pure skill is **intentionally left open** in fiction; do not resolve without a decision.

## Cross-refs
- `shared/src/data/premade-characters.ts` — char_009 (bio, class/race/origin, `questOnly`, trait `lucky`); `CHAR_RELATIONSHIPS` char_009 = "Son of Elspeth Ravencroft".
- `shared/src/data/missions/sideChainMissions.ts` — `a_mothers_errand` ("A Mother's Errand").
- [cast/elspeth-ravencroft.md](cast/elspeth-ravencroft.md) — his mother (char_007).
- `lore/TIMELINE.md` — world facts (always wins on Crown/Church/magic/Wastes).
