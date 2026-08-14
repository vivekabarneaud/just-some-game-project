# Roster Curation — fewer, better adventurers

**Status (2026-08-14 audit):** PARTIAL — the recruitment UX rework SHIPPED (daily rotation + recruit tab gone; scripted `ArrivalCondition` + `syncArrivals`; quest recruits; the roster cap is bypassed by arrivals). The pool cut NOT done: 229 premades still in data, only 4 arrivals and 3 signature traits authored, no reserve pool, CHAR_RELATIONSHIPS unpruned. `generateCandidate()`/`getCandidateCount()` are now dead code.

## The decision

Cut the ~229-character premade pool to a small, **curated, hand-authored cast**. The game's identity is handcrafted / personal / paper-theater; 229 adventurers (many filler-quality) contradicts that. A small known cast also supercharges already-built systems: **loyalty, tavern conversations, the Pantheon memorial** — all far stronger with people the player actually knows. Losing a named character to permadeath should be grief, not a rounding error.

This also unifies three previously-separate backlog docs (premade pool, quirks, roster economy) into one coherent pass.

## Two rosters

1. **Main roster (named).** The curated survivors: real backstories, fitting special abilities, distinct character design, true permadeath stakes. Recruited by browsing (no rotation), gated by origin unlock.
2. **Reserve / common pool.** A small set of plainer recruits (lighter identity, no signature ability) that **replenishes** — the anti-soft-lock insurance so a player who loses their team can never get permanently stuck. Keeps the named cast special by contrast. *Exact model (always-available? trickle? lower stats?) — DECIDE LATER.*

## Size & distribution — weight by prominence, NOT class balance

No forced "one-of-each-class per origin." Keep only characters who make sense; weight counts by how common/early the origin is. Starting proposal (~45–50 total, tunable):

| Origin | ~Count | Notes |
| --- | --- | --- |
| Ashwick | ~12 | Starting/common heartland; must cover all 5 classes (early playability). |
| Feldgrund | ~6 | Unlocks after Story 6 (Marigold's rescue). Keep the story survivors. |
| Silvaneth | ~5 | Thornveil tie (Niamh's world). |
| Nordveld | ~5 | |
| Meridian | ~4 | |
| Khor'vani | ~4 | |
| Hautscieux | ~4 | |
| Khazdurim | ~3 | |
| Tianzhou | ~2–3 | Endgame/exotic — player already has a deep roster by unlock. |
| Zah'kari | ~2–3 | Endgame/exotic — same. |

Lore-friendly: a frontier settlement near the Hearthlands *should* be mostly Ashwick faces, with exotic origins rare and late. **Keep all canon-load-bearing characters regardless of count** (the Ashford grandchildren Cedric/Bronwyn/Roderick, any Niamh/Thornveil ties, the Feldgrund story-6 survivors).

## Permadeath & revival — levers already exist

Decide the exact model later (leaning: named = true permadeath, reserve = replenishable). Mitigation is already partly built:
- **Phoenix Tears** alchemy recipe (`shared/src/data/alchemy_recipes.ts`) — the revival item. Gives the alchemy tree real late-game purpose; death becomes costly-but-recoverable, not purely brutal.
- Priest **"Divine Grace"** passive: party death-risk reduction + revive chance; `revived: string[]` already tracked in game state.

## Recruitment UX — drop the daily rotation

Show the whole available cast, grouped by origin (Ashwick first, then origins as they unlock). Removes the gacha-flavored daily rotation/reroll (fights the cozy-co-op tone); replaces it with a collection pleasure — the roster *grows* as you unlock origins through progression. The origin-gating scaffold already exists (`ORIGINS_BY_GUILD_LEVEL`, `STORY_UNLOCKED_ORIGINS`, `QUEST_UNLOCKED_ORIGINS` in `adventurers.ts`).

## Special abilities

Each main-roster character gets a signature ability that fits their backstory + class (ties into the talent/class-passive systems). Part of the per-character authoring pass.

## Cosmetic skins (LATER)

Buyable cosmetic-only skins for adventurers. A small known cast is exactly what *makes skins viable* — players buy costumes for characters they love, not for rando #147. Pay-cosmetic-only fits the friendly co-op ethos. Blocked on payment backend; park until post-alpha.

## Migration safety

Existing saves reference culled character IDs. A removed character in someone's save must NOT crash the game — graceful fallback (keep the saved instance as a grandfathered entry, or convert to a reserve recruit). Low-stakes pre-launch, but required.

## Phasing (small bites — respects the director-not-laborer workflow)

1. **Lock design** — this doc. ✓
2. **Keep/cut triage** — Claude proposes a per-origin survivor list (the clearly-good + the canon-tied), user reacts/adjusts. Pure taste calls; no testing.
3. **Rewrite survivors' backstories** to top quality (the user's voice; em-dash-clean).
4. **Design fitting special abilities** per survivor.
5. **Recruitment UI rework** — show-all-by-origin, drop rotation.
6. **Reserve pool + revival balancing**; later: skins.

## Phase 2/3 working log (decisions as they're made)

- **Triage done (2026-06-22):** ~52 keepers chosen (see the agent triage; Ashwick 12, Feldgrund 6, Silvaneth 5, Nordveld 5, Meridian 4, Khor'vani 6, Hautscieux 6, Khazdurim 5, Tianzhou 3, Zah'kari 3). Lore landmines cut (Odin, pre-Sundering-memory elves, name collisions). `CHAR_RELATIONSHIPS` needs pruning for cut IDs when surgery happens.
- **Rescued from the cut pile:** **Thrain Fireaxe** (Khazdurim assassin, the "drinks because of what's behind the third Seal" one — among the best in the file). **Lyra Emberheart** → renamed **Sable** (first name only; "Lyra" collided with canon Lyra/Jory's wife). Sable is a **mononym** on purpose — fits "no name worth keeping". **Celeste Aubepine** (Hautscieux princess) — rescued for her aureole/signature-item potential (needs the small pre-Sundering lore fix above). Hautscieux now ~7, running total ~53-54.
- **Cedric Ashford:** backstory kept as-is (canon, excellent). Ability proposed: new trait **"Thornveil-Taught"** (+6% dmg vs ghost & aether). Not yet wired.
- **Ability approach (proposed, awaiting confirmation):** each curated character gets a story-fitting `trait` (reuse `BACKSTORY_TRAITS` where one fits; bespoke new traits for standouts; flag any needing engine wiring beyond the data tables). Pace (one-at-a-time vs batch) TBD — user was too tired to continue 2026-06-22.
- **Coldwells PARKED (2026-06-28).** Leofric / Ellie / Finley set aside, NOT deepened. Leofric wasn't sparking: his portrait reads "commander" (we already have Morgause there), the warrior role is well-covered by 3 distinct archetypes (Morgause = commander, Hester = damage/axe, Godric = protector), and "a peace-wanting smith who forged himself a prize sword" didn't cohere. **If revived, Leofric's real angle is a *forge / settlement-perk* smith (buffs home crafting/gear), NOT a 4th frontline warrior.** The **evolving signature weapon** (level-scaling + gem sockets) and the **paladin** concept are reserved for *future* characters, not Leofric. Parked ≠ cut — promotable if inspiration strikes.

### Ashwick ability drafts (2026-06-22, awaiting user reaction)

`[existing]` = reuses a current `BACKSTORY_TRAITS` entry, ready as data. `[new-data]` = new trait that's just a tag-bonus table entry (trivial). `[new-wire]` = new trait needing a little combat/deploy wiring.

1. **Cedric Ashford** (archer) → **Thornveil-Taught** `[new-data]` — +6% dmg vs ghost & aether. (His Silvaneth upbringing = fights the Wastes-things.)
2. **Bronwyn Ashford** (warrior) → **First Through the Gate** `[new-wire]` — draws enemy focus (taunt), protects the party. ("see what else is worth defending.")
3. **Roderick Ashford** (assassin) → **lucky** (+3% crit) `[existing]` — the court's precise problem-solver. (Bespoke "Clean Work" possible later.)
4. **Elspeth Ravencroft** (assassin) → **survivor** `[existing]` **✅ DONE** — recharacterized: not a black-widow but a *reluctant poisoner-mother* who killed one violent man (Edmund's father) to survive + shield her son, no fighter, here **only for Edmund** (won't let him adventure alone), crochets for the settlement's children (soft tell). Backstory + trait written.
5. ~~Helga Ironbark~~ → **Hester Ironbark** (warrior) → **Felling Arm** (`axe_master`, +12% dmg with an axe) **✅ DONE (weapon-affinities branch)** — renamed (collided with canon Helga/Edda's grandmother), backstory deepened (she broke once; the iron is the wall she built; she whittles birds from offcuts, keeps the axe that did both jobs sharp), trait wired. *Bonus dormant until a craftable axe exists (follow-up).*
6. **Morgause Dunwall** (warrior) → **veteran_campaigner** (+5% vs humanoid) `[existing]` — 30 years on the border garrisons.
7. **Isla Foxglove** (archer) → **beast_tracker** (+5% vs beast) `[existing]` — poached deer to feed her sisters.
8. **Elara Foxglove** (wizard) → **quick_learner** (+10% XP) `[existing]` — sixteen and learning fast on the run.
9. **Elinor Whitmore** (priest) → **pious_heart** (+5% vs demon & divine) `[existing]` — devout parish healer.
10. **Oswin Holloway** (priest) → **Folk Remedy** `[new-wire]` — +potion/consumable effectiveness (cured fevers with his brother's brews). Fallback: existing **bread_savant**.
11. **Gwendolen Hearthwood** (wizard) → **elemental_attuned** (+5% vs elemental) `[existing]` — hearth-fire bends to her hands.
12. **Leofric Coldwell** (warrior) → **Last Blade** `[new-wire]` — small flat damage bonus (carries the last sword he forged). Fallback: existing **offering_keeper** (+1 all stats).

Tally: 8 ready-as-data (incl. Cedric's trivial new tag), 3 new-wire (Bronwyn taunt, Oswin consumables, Leofric weapon) + their existing-trait fallbacks if we want zero engine work for now.

### Weapon affinities — BUILT (2026-06, `weapon-affinities` branch) ⭐
A new **signature-feature category**: a `weaponType` tag on mainHand weapons (axe/sword/dagger/…) + a trait that boosts damage with a matching family (`combat/traits.ts` `TRAIT_WEAPON_BONUSES` → `getWeaponTraitBonus` → applied in `damage.ts`; `CombatUnit.weaponType` resolved in `buildAdventurerUnit`). First user: **Hester's `axe_master` / "Felling Arm"** (+12% with an axe; `weight: 0` so never randomly rolled; assigned via `premade.trait`). **Reusable** for future cast (a bow-deadly archer, a dagger duelist). **Follow-up:** add craftable **axe items** (tag `weaponType: "axe"`) so Hester's bonus activates — until then it's a dormant, visible "string."

### Sable (ex-Lyra Emberheart) — ability options (2026-06-22)
- **lone_wolf** (existing, +2 stats solo) — fits "raised herself, no family." Zero code.
- **"Nothing to Lose"** (new, light wiring) — crit/damage spike at low HP; the cornered street-fighter. *(User leaning here; pending confirm.)*

### Signature items — bound evolving gear (IDEA, post-alpha)

User's idea (2026-06-22), and it's the real payoff of the small-cast decision: a few characters get a **bound signature item that grows with them** (WoW-heirloom-style) — stats scale with the owner's level, and it **gains gem sockets** at level thresholds. Reuses existing tech (gems from Content Expansion, the Jewelcrafter, equipment slots).

Design guardrails:
- **Rare, not universal** — only a handful of characters. Scarcity keeps them special and bounds scope.
- **Powerful is OK** (user call 2026-06-22): these are the character's *special ability*, and this is cozy co-op PvE, not competitive — a power-fantasy signature item is a feature, not a balance problem. (Earlier "reliable not optimal" guardrail RELAXED.) The depth/personalization, not the rarity of power, is the point.
- It's a real subsystem (bound items, level-scaling, **gem sockets with effects** — note: socket *effects* don't exist yet, gems are currently only crafting ingredients), NOT a trait. **Design now, build after the Act 1 alpha** — must not block story/balance work.
- **Not always a weapon.** Signature items are a category of "special thing per character":
  - **Leofric** (smith) — bound **weapon** that scales with his level + gains gem sockets. Placeholder "Last Blade" trait until built. Extra-strong is fine (his ability).
  - **Celeste Aubepine** (Hautscieux, RESCUED 2026-06-22) — her **aureole / Circlet of Light** (a worn trinket or party aura). Was cut for a lore snag (crown "passed mother-to-daughter since before the Sundering" implies an unbroken elven line across the die-off). **Lore fix on the rewrite pass:** make the dynasty "older than the city kept records" rather than explicitly pre-Sundering; keep "a circlet of light no living mage knows how to forge" (lost art ≠ memory). Backstory otherwise kept.

**Gem → effect mapping** (reuses existing gems in `materials.ts` + the combat engine's element/tag damage). Socketing a gem into a signature item grants:
| Gem | Effect |
|---|---|
| charite | +dmg vs demons |
| moonstone | holy damage |
| frost_sapphire | frost damage |
| fire_ruby (/ crude_ruby) | fire damage |
| storm_topaz | lightning damage |
| void_topaz | void / aether damage |
| emerald_shard | nature / vs-beast |
This could later generalize to a game-wide equipment-socket feature, not just signature items.

This expresses the curation thesis: per-character bespoke mechanics are only affordable BECAUSE the cast is small. Related: gem/Jewelcrafter content (DESIGN_CONTENT_EXPANSION, shipped).

### Signature-feature taxonomy (2026-06-22) — "it doesn't have to be a weapon"

A character's special thing can be any of: (1) signature weapon [Leofric], (2) worn regalia/trinket [Celeste's aureole], (3) **bespoke consumable set** [Elspeth's poisons], (4) named combat companion [the `dog_companion` trait already does this], (5) personal aura/passive, (6) **pair/family synergy** — deploy two related characters together for a bonus, (7) **settlement perk** — their presence at home buffs the town (Leofric→forge, Elspeth→alchemy lab), (8) unique mechanic.

**#6 (pair/family synergy) is high-value & cheap** and fits the family clusters all over the roster (Ashford siblings, Foxglove sisters, Ravencroft mother-son, Hawthorn, Meadbrook). Only feasible because the cast is small enough to know.

### Per-character signature designs (drafts, 2026-06-22)
- **Sable** — ability **"Nothing to Lose"** CONFIRMED (low-HP crit/damage spike). **Trinket = her one soft tell** (she's still a child): a useless, pretty/funny stolen object she kept when she sold everything else, even her name. The deliberate LIE in "Nothing to Lose" — she has exactly one thing to lose and would deny it. Keep it ARMORED, not sweet (no family ⇒ no sentimental keepsake; funny/absurd beats a locket). Leading option: a fat brass frog stolen "because its face was stupid" (alt: a cracked glass bead that throws rainbows). Make it **narrative, not a stat** — its job is to anchor her tavern-conversation scene (the line where the armor slips). Resolves the earlier owns-nothing tension: it's a story object, not gear.
- **Cedric + Bronwyn** — **sibling synergy** (raised sparring in the Thornveil → +stats deployed together). Optional **Ashford signet** = a *settlement perk* (name opens doors: small trade/reputation bonus), not raw power. Royalty as influence, not a bigger sword.
- **Elspeth** — **poison master**. Cool version: an **extra Elspeth-only mission supply slot** stocked with her own bespoke strong potions, chosen pre-mission (e.g. Widow's Kiss = heavy DoT, Dead Man's Draught = cheat death once, Quietus = burst). Reuses the existing per-adventurer supply-slot tech. Simple fallback: trait = +poison/DoT damage.

### Ashwick rebalance (proposed 2026-06-22, pending confirm)
13 current keepers (incl. Sable) skew: 4 warrior, **3 assassin** (Roderick/Elspeth/Sable), 2 archer, 2 wizard, 2 priest. **CONFIRMED (2026-06-22): cut Roderick Ashford, add back Edmund Blackwood** (Elspeth's son — matched mother-son assassin pair, enables a synergy duo, better story than the cousin; Cedric+Bronwyn already carry the Ashford canon). Keeps assassins at 3. Edmund: assassin, "everything Edmund knows, his mother taught him."

### Loyalty as the signature-progression spine (2026-06-22) ⭐

The framework already exists: `LOYALTY_RANKS` (Familiar +1 stat, Trusted +2% crit, Devoted +3% success, Bonded +5% loot) — but it's GENERIC (same flat bumps for everyone). **Upgrade (user's idea):** make loyalty the track along which each character's *signature feature* deepens, not just flat stats. Loyalty becomes the single spine unifying three things: generic rank bonuses (built), bespoke signatures (designing now), and tavern conversations (already loyalty-gated).

Per-character examples:
- **Sable** — her trinket/soft-side reveal is loyalty-gated: at high loyalty she shows you the frog (her tavern scene). Narratively her bond *rewrites her own ability*: "Nothing to Lose" was true as a Stranger; Bonded, she has something to lose (you).
- **Leofric** — signature blade deepens at loyalty milestones (re-forges it sharper as he believes in the cause), atop level-scaling.
- **Elspeth** — unlocks her deadlier bespoke poisons as loyalty climbs (a poisoner guards her real recipes from strangers).
- **Cedric/Bronwyn** — Thornveil/Ashford "doors" open wider with loyalty.

Flags: (1) permadeath stakes — bonding into a character who can permadie is high-risk/high-reward; cushion with revival/reserve. (2) No grind — loyalty rises from *playing with them* (missions, preferred food), never a chore.

### Hammerfall sisters (Khazdurim) — canon-tied demon-hunting duo (2026-06-22)
Both kept. Brunhild (priest, prayer-wards) + Magna (wizard, rune-locks) held the second Seal 30 years until **Bahruun** broke through, killed their team, and dismissed them ("Go home, grandmothers"). **Now canon-tied:** Bahruun + the Hammerfalls live in `LORE_EIGHTH_GOD` §6 (salvaged from the archived Deep Seals doc) — they're named survivors of a named lore demon. Signature kit, almost zero invention needed:
- **`demon_hunter` trait** on both (+dmg vs demon) — they left the mountain to hunt what humiliated them.
- **Pair synergy** (category #6): deployed together they recreate the prayer+runes partnership → bonus. The synergy *is* their 30 years.
- **Magna's vengeance** (signature): she keeps a list of every name lost that night; grows stronger per demon killed ("take something back for each one"). Bahruun as a possible late-game boss they get a bonus against.

### Signature companions — pets (2026-06-22)

Category #4 of the signature taxonomy. Builds on the existing `dog_companion` trait. **Keep rare** (a couple of characters); generic `dog_companion`/`cat_parent` traits stay as the light version. **Pets are KO, not permadeath** (cozy/found-family tone) — knocked out for the mission, recover after. Heroic Guard-sacrifice death DEFERRED (and the cat's "nine lives" idea parks with it).

**Isla Foxglove — the lurcher (functional companion).** She's a poacher; a silent hunting dog completes her. Personalized by **training/role, not gems** (a creature is trained, not socketed): Maul (fights), Guard (shields/draws hits for owner), Flush (cuts ambush/trap risk), Fetch (extra loot/materials). Grows with level; can deepen with loyalty.

**Nettle Meadbrook — the cat (emotional companion). The cat is NOT magic — Nettle just loves it.** Her power is love, not arcana (same grounded-feeling-dressed-as-magic aesthetic as Sable's frog / real-finger snaps). The cat doesn't fight (naps on her spellbook, winds her ankles — combat whimsy). Mechanic = a **two-mode flip on the cat's state**, NOT a power up/down (KO shouldn't make her weaker — it makes her *furious*). Her name encodes it: *Meadbrook* (sweet) ↔ *Nettle* (stings):
- **Cat safe → "Meadbrook" (tending):** warm, *protective/supportive* magic — wards, shields, steady hearth-warmth, control.
- **Cat KO → "Nettle" (roused):** fierce *offensive* magic — burst/raw fury (hearth-fire roars to a blaze; or thorn/sting DoT, playing on her name). NOT aether (aether = Wastes/corruption in canon, wrong for a cozy grandma).
- **Balance guardrail:** Nettle-mode is a SIDEGRADE, not an upgrade — high damage but reckless/exposed (drops wards, takes more hits), so players never KO their own cat on purpose. The cat getting hurt is a crisis to fight through, not a combo to set up.

Contrast worth keeping: Isla's dog = *trained/functional*, Nettle's cat = *loved/emotional*. Proves the signature-companion idea has range. **Names TBD** (user to name the dog + cat).

### Quest-unlock recruitment — Edmund & Elspeth as the flagship (2026-06-28) ⭐
A new recruitment axis from a dream: some standout characters aren't browsed at the guild desk, they're **earned through a side-quest that *is* their backstory** (so the player actually lives the story instead of skimming a recruit card). NOT all characters — the standouts. Buildable on the existing quest-unlock machinery (one notch finer than `QUEST_UNLOCKED_ORIGINS`). **New bit to build:** a mission/quest whose completion **recruits a specific character**.
- **Edmund Blackwood — the gambler-assassin.** DONE (backstory + `lucky` interim trait). His real signature is a **momentum/luck mechanic** (lucky streaks → crits, cold streaks → misses) + a momentum talent branch (amplify the swing vs. soften the cold streak) — **banked as a real combat feature**, too big for now; `lucky` holds the seat. Hook: *is the luck real, or is he the best cheat alive?* (never answered).
- **Elspeth gives the quest, the pair joins together.** Answers "why is a reluctant non-fighter in the guild?": she isn't there for herself, she's there for **him**. She arrives undone (*"my son's gotten himself hunted, I can't reach him in time"*) → you **drive off the sore-loser thugs** hunting Edmund (combat-extraction mission, NOT a stealth minigame) → Edmund joins (the danger suits him), Elspeth joins (she won't let him go alone). The mother-son synergy becomes *literal*. The chase from the dream = chronicle flavor; the gameplay is a justified fight.
- **Broader principle:** not everyone walks up to the guild desk — some arrive through **relationships and stories** (Elspeth via her son).
- **BUILT (2026-06-28):** the system — premade `questOnly` (excluded from the browse pool) + mission `recruitsOnSuccess` (named premades join on success, bypass the browse cap, dedup, event-logged) + a spoiler-free "🫂 Recruit a new ally" card hint. Edmund + Elspeth are `questOnly`; the quest **"A Mother's Errand"** (SIDE_CHAIN_MISSIONS) — Elspeth's nameless plea → drive off 3 thugs → both join. *Art TODO: quest image. Follow-up: Edmund's momentum mechanic; possibly a chronicle vignette on completion.*

### Co-op duplicates (consequence of the small pool) — 2026-06-22
A small curated pool means co-op allies will often field **duplicate named characters** (two Elara Foxgloves), which breaks immersion (they're specific people).
- **DON'T client-side-rename the ally's duplicate.** Problems: desync (different name per client in a shared mission/log), identity-mismatch (Elara's portrait/story/class ≠ a renamed "Maren" — you'd show Elara's face under Maren's name), and it re-introduces cut characters as costumes.
- **DO: dedupe at contribution.** You can't field a character an ally already brought to the shared mission — extend the existing `coopLockedAdvIds` mechanic from "locked" to "locked by identity." Lore-clean, consistent across clients, and good co-op design (nudges complementary teams). Plus: tag contributed adventurers with the ally's settlement name; in-world, names repeat across frontier settlements, you just don't field the same person twice in one fight.
- **Scope:** co-op is post-alpha (alpha = single-player Act 1), so this doesn't bite the alpha. Design now, build when co-op lands.

*Created 2026-06-22 from the weekend "fewer, better adventurers" idea.*
