# Godric Thornwood
- **Status:** locked 2026-06-28
- **Recruit ID:** char_021
- **Portrait file:** godric_thornwood
- **Class / Race / Origin:** Warrior / Human / Ashwick
- **Food preference:** spicy *(notably **not** sweet — he never knew his mother, never tasted her honey)*
- **Trait(s):** none assigned yet (TBD)
- **Family:** Youngest of the three Thornwoods; brother of Nessa and Gareth; Nessa raised him. See [thornwood-family.md](thornwood-family.md).

## Recruit-card bio (public surface)
> Godric never knew his mother. She died bringing him into the world, and he has only the stories Nessa tells, which are kind, and the way his father could never quite hold his eye, which was not. He grew up knowing without being told that he was the reason for a grief the family carried, and he grew huge as if to be worth it, taking the blows so the others would not have to and giving his food away before anyone could offer him theirs. When the levy took him for the northern war they put him at the front, big as he was, and he killed more than he will ever say and hated it every time, telling himself each time that he was only protecting the boys beside him. He never struck first, and gave any man the chance to run before he made him fight. Then came the day the killing stopped being protection and turned to something else, men who threatened no one put down because the war wanted it, and the one lie that held him together came apart in his hands. He laid down his spear and walked. Nessa raised him and her word is still law to him; he will tell you he is the least of the three Thornwoods, and not one of them will let that stand.

## Deep lore (discovery-only)
- **Born into grief.** His birth killed his mother; his father could never quite look at him. He grew up sensing he was the cause of a sorrow no one named, and **grew huge as if to be worth the cost of himself.**
- **He has killed many** — he is a real, weathered warrior, not an innocent. He hated it every time, and held himself together with one telling: *I am only protecting.* **He broke when that stopped being true** — ordered to put down men who threatened no one. The lie came apart in his hands and he walked. (He was **levied at 16** right after the winter, broke fast, deserted ~18.)
- **The food-giving runs straight back to the father:** he watched his father give away his own food in the killing winter and die of it. Godric gives his food away without thinking — arguably the one lesson the father who couldn't look at him ever taught him, taught by dying of it. *(Optional to surface; not in the card bio.)*

## Personality & tells
- Huge, quiet, **self-effacing** — calls himself "the least of the three Thornwoods" (and the family won't let it stand).
- **Gives his food away** before anyone can offer him theirs. **Takes the blows** so others don't have to.
- **Restraint in violence:** never strikes first, gives any man the chance to run before he makes him fight. (This is the grounded version of an earlier "knock them out instead of killing" idea — kept as discipline, not a non-lethal gimmick. It also echoes the settlement's own ethos: drive off, don't slaughter.)

## Relationships
- **Nessa** — his real mother; her word is law to him.
- **Gareth** — older brother, fellow deserter.

## Preferences & specificities
- Spicy food (no sweet-tooth — no memory of the mother's honey). Self-denying to a fault.

## Combat identity & talents (design, 2026-06-29)
**Archetype: the Wall (warrior tank) — locked.** Takes the hits so others don't; **high aggro** (the biggest thing on the field); **high VIT/survivability**; shield-bearer; signature **Last Stand**; and crucially **he doesn't finish people** — the killing is *Nessa's* job. They complement exactly: Godric softens + pins enemies on himself, Nessa executes the low-HP ones he leaves. His combat role **is his wound**: worth = protecting others; the player slowly discovers the man who calls himself "the least of the three" is the reason the team comes home.

**Talent system (simplified, project-wide — supersedes the pentagon):** the old 5-class-pentagon 3-column trees are **dropped**. Each character gets **one** vanilla-WoW-style tree, **archetype-locked** (talents *tune* the identity, never redefine it): a few tiers, mostly **ranked passives** (+X%/point, including the raw-stat minors), a couple of **keystone abilities**, and a few real **either/or choices**. Spend points as you level; the choice is mostly *what to prioritize*. Uses the existing `talents` + talent-point system.

**Base kit & unlock rule (project-wide):** L1 = **auto-attack + the character's signature passive**. Passives are **per-character, not class-wide** (decided 2026-06-29): Shield Wall is *Godric's* passive, not every warrior's (it would be noise on Hester, who wants an axe/execute passive). The old class passives (Shield Wall, priest revive, assassin loot, wizard speed) survive only as the **default for generic/non-curated recruits**. Class still drives the *chassis* (base stats, growth, attack stat, role/targeting). *All* other abilities come from the **tree** (single unlock channel); tiers gated by points spent (≈ level), so capstones land late automatically. The intimate capstone is additionally **loyalty-gated**. Abilities are **AI-driven** (auto-combat), not player-pressed buttons. (Option held in reserve: a small per-character L1 signature if a recruit should feel distinct the instant they join; default is the class innate + let the tree carry personality.)

**Godric's tree — "The Wall"** *(layout 2026-06-29; vanilla-WoW tiers — minors are the connective tissue + the gates you spend points on to reach the keystones ⭐):*
- *Signature passive (free, L1):* **Shield Wall** — throws himself in front of a killing blow meant for an ally. His base identity; the tree builds on it. (NB: the earlier "Aegis = a better Shield Wall" fork was redundant and is **cut** — Shield-Wall upgrades live in the **Shield Training** minor instead.)
- **Tier 1** (minors; ~5 pts to open T2): **Thick Hide** (+mitigation/rank), **Broad Shoulders** (+max HP/rank).
- **Tier 2** (5 pts): **Unmissable** (+threat/rank), **Provoke** ⭐ (active taunt), **Shield Training** (+Shield Wall trigger chance/rank).
- **Tier 3** (10 pts): **Iron Grip** (taunts stick longer/rank), **Stagger** ⭐ (the peel/stun — interrupts an enemy attacking a weaker ally, stuns it a turn, dumps huge aggro on it), **Heavy Frame** (can't be knocked / feared / pulled off-target).
- **Tier 4 — the fork** (15 pts): **Iron Resolve** ⭐ (mitigation rises as HP drops → survive being the last one standing) **OR** **Bodyguard** ⭐ (aura: the nearest lowest-HP ally takes less damage → shield others wider).
- **Tier 5 — capstones** (20 pts): **Last Stand** ⭐ (refuse to flee, plant, pull all aggro, huge defense, buy the family's escape) and **The Gentle Giant** ⭐ (loyalty-gated: won't finish a fleeing/low-HP foe; spared foes break and run; hits harder purely defending).

*Placement principle (the thing that unblocks drawing):* keystones ⭐ are the landmarks; the ranked minors fill the early rows and gate access to the deeper tiers, so the choice is "how much do I invest to path toward which keystone." ~11 nodes, vanilla-WoW scale.

**Design tension to preserve:** Last Stand + his self-worthlessness means he *wants* to be the one left behind; Iron Resolve, the family, and the player have to keep the wall alive *despite* him. Echoes the bio — *"not one of them will let that stand."*

## Open threads / TBD
- **Wanted-deserter hook** (shared with Gareth).
- Whether to thread the explicit father-food line into discoverable dialogue.
- Assign a backstory trait.

## Cross-refs
- [thornwood-family.md](thornwood-family.md); `premade-characters.ts` char_021; `lore/TIMELINE.md` (levy/conscription, the northern war).
