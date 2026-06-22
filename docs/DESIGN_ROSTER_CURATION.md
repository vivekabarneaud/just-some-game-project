# Roster Curation — fewer, better adventurers

**Status:** DESIGN (locked decisions 2026-06-22, execution phased & pending). Supersedes the open parts of `DESIGN_PREMADE_CHARACTERS.md` (family/rarity/unlock), folds in `DESIGN_QUIRKS_REWORK.md` and `DESIGN_ROSTER_ECONOMY.md` — those become sub-concerns of this one.

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

### Ashwick ability drafts (2026-06-22, awaiting user reaction)

`[existing]` = reuses a current `BACKSTORY_TRAITS` entry, ready as data. `[new-data]` = new trait that's just a tag-bonus table entry (trivial). `[new-wire]` = new trait needing a little combat/deploy wiring.

1. **Cedric Ashford** (archer) → **Thornveil-Taught** `[new-data]` — +6% dmg vs ghost & aether. (His Silvaneth upbringing = fights the Wastes-things.)
2. **Bronwyn Ashford** (warrior) → **First Through the Gate** `[new-wire]` — draws enemy focus (taunt), protects the party. ("see what else is worth defending.")
3. **Roderick Ashford** (assassin) → **lucky** (+3% crit) `[existing]` — the court's precise problem-solver. (Bespoke "Clean Work" possible later.)
4. **Elspeth Ravencroft** (assassin) → **survivor** (-15% death on failure) `[existing]` — outlived three husbands; watches the exits.
5. **Helga Ironbark** (warrior) → **iron_will** (+10% fear/taunt resist) `[existing]` — the trait's own flavor ("didn't break") is literally her.
6. **Morgause Dunwall** (warrior) → **veteran_campaigner** (+5% vs humanoid) `[existing]` — 30 years on the border garrisons.
7. **Isla Foxglove** (archer) → **beast_tracker** (+5% vs beast) `[existing]` — poached deer to feed her sisters.
8. **Elara Foxglove** (wizard) → **quick_learner** (+10% XP) `[existing]` — sixteen and learning fast on the run.
9. **Elinor Whitmore** (priest) → **pious_heart** (+5% vs demon & divine) `[existing]` — devout parish healer.
10. **Oswin Holloway** (priest) → **Folk Remedy** `[new-wire]` — +potion/consumable effectiveness (cured fevers with his brother's brews). Fallback: existing **bread_savant**.
11. **Gwendolen Hearthwood** (wizard) → **elemental_attuned** (+5% vs elemental) `[existing]` — hearth-fire bends to her hands.
12. **Leofric Coldwell** (warrior) → **Last Blade** `[new-wire]` — small flat damage bonus (carries the last sword he forged). Fallback: existing **offering_keeper** (+1 all stats).

Tally: 8 ready-as-data (incl. Cedric's trivial new tag), 3 new-wire (Bronwyn taunt, Oswin consumables, Leofric weapon) + their existing-trait fallbacks if we want zero engine work for now.

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

*Created 2026-06-22 from the weekend "fewer, better adventurers" idea.*
