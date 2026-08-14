# Talent trees — design

> ⚠️ **UNDER RECONSIDERATION (2026-06-28).** With the roster cut to a small *curated* cast, the user leans strongly toward scrapping the class-pentagon for **per-character bespoke trees** — the characters already *are* their archetypes (Leofric = paladin, Elspeth = venomancer, Edmund = cheat), so the tree should *be* the character, not built-toward. Banked as a **major future project** (system rewrite + ~50 trees; heavier permadeath, resolved by Phoenix-Tears recovery). See [[project_talent_pentagon]] for the full reasoning. Don't deepen the pentagon further until this is decided.

**Status (2026-08-14 audit):** trees BUILT & displayed (651-line `talents.ts`, 30 hybrid-title capstones), BUT only ~3 talent ids are actually read by the combat engine (`unflinching`, `last_stand`, `commander_tactics`) — most nodes are stat/UI-only. Advanced mechanics (status_consumed, player summons, cross-tree synergy, gear-proficiency unlocks) unbuilt. The banked per-character-bespoke-trees pivot would invalidate the pentagon.
**Pentagon order (working assumption):** warrior — assassin — archer — wizard — priest — (warrior). Adjacent pairs produce hybrid titles. See [[project_talent_pentagon]] memory for the locked decisions.

## Design principles

- **PoE2-style organic tree.** Small nodes (raw stat / crit chance / +% damage) thread between big nodes (new spell or mechanic). Multiple paths reach most major nodes, so two adventurers with the same "spec" can still pathfind differently.
- **No locked specs.** The three columns per class are *thematic axes*, not WoW-style specializations. Soft gradient between flavors (visualised by color), not a hard boundary.
- **Geographic distance is the gate.** Mixing two adjacent flavors (e.g. Paladin-defensive + Warlord-tank) is possible but you spend points walking between them, so you forgo deeper-tier benefits on either side. The tree shape *encourages* identity without forbidding hybrids.
- **AFK combat compatibility.** Talents are one of:
  - Triggered AI abilities (some with cooldowns; some talents reduce CDs)
  - Always-on passives
  - One-per-combat consumes (rare — mostly potion territory)
- **Hybrid titles are identity labels, not separate classes.** An adventurer who leans hard left in the warrior tree displays "Paladin"; centered displays "Warlord"; far right displays "Shadowblade". No mechanical class change.
- **Cross-tree synergy in hybrid zones.** Hybrid talents in two adjacent class trees mechanically amplify each other *when both classes are in the same party*. E.g., an archer-Primalist's Fire Arrow and a wizard-Primalist's Fireball both benefit from a shared "fire-damage buff" cluster that triggers when either class invests in the Primalist edge. This turns hybrid identity into team-composition strategy — a feature the game otherwise lacks. The pattern generalises across all five hybrid zones (Paladin, Shadowblade, Venomancer, Primalist, Inquisitor).
- **Hybrids are complementary, not mirrored.** The two halves of a hybrid title share the *identity flavor* but offer *different gameplay loops* because of the starting kit. Canonical example: a warrior-Paladin tanks via physical defense + damage-threat; a priest-Paladin tanks via healing-threat. Same name, fundamentally different builds. This is the gameplay payoff of the pentagon-edge design.
- **Gear access as a talent unlock.** Equipment proficiency is itself a talent — e.g., a priest-Paladin must invest in *chainmail proficiency* and *sword & shield* talents to reach the armored healer-tank build; a wizard-Primalist similarly invests in chainmail to harden up. This gates hybrid identities by *cost* rather than class membership, and lets the same item (chainmail) be reached from two different class trees at different points along their respective paths.

## Class identities — Pass 1 (axes only, no node sketches)

### Warrior

Pentagon neighbors: **Priest** (left) and **Assassin** (right).

- **Left column — Paladin** (warrior × priest)
  Self-sacrifice, light healing, holy damage on strikes.
  - Sub-path *defensive shield*: taunt, mitigation, take hits for allies.
  - Sub-path *holy-striker*: extra damage vs undead/heretic enemy tags.

- **Middle column — Warlord**
  Raw physical damage, unmovable tank, war cries that buff the party. Honor-coded leader; party-aura territory the pure assassin or pure priest can't reach.

- **Right column — Shadowblade** (warrior × assassin)
  Dirty fighting, crit-fishing, armor-ignore, bleed stacks, hit-and-run. Borrows assassin combat tricks but with warrior survivability.

### Archer

Pentagon neighbors: **Assassin** (Venomancer side) and **Wizard** (Primalist side).

- **Venomancer-side column** (archer × assassin)
  Coated arrows, poison shots, debuff-via-arrow. Shares the plant-name aesthetic with the assassin tree's Venomancer column — this is the same hybrid identity approached from the ranged angle.
  *Not* traps or beast knowledge — those live in pure archer.

- **Middle column — Marksman**
  Pure ranged identity. DEX scaling, crits, aimed-shot charge-ups, raw damage, target unarmored spots (between-the-eyes / headshot mechanics). Hunter / tracker passives: traps as one-per-combat setups, beast lore feeding Monster Discovery (first-encounter weakness flagging for the party), study-the-prey ramps (damage scales the longer a target lives).

- **Primalist-side column** (archer × wizard)
  Elemental + nature magic. Several major nodes with strong mechanical identity:
  - **Fire Arrow** (paired with the wizard tree's **Fireball**) — both deal fire damage. Primalist passive cluster buffs *all* fire damage in the party, so an archer-Primalist and wizard-Primalist on the same team amplify each other (cross-tree synergy — see Design Principles).
  - **Frost Nova → Evaporate** combo. Frost applies, next turn fire detonates it for damage + burn application. Burn damage-over-time scales output further (chain mechanic; setup-and-payoff).
  - **Thorns Wall** — summons an HP entity that pulls aggro and damages physical attackers. Fire-vulnerable: instantly destroyed by fire, which is a deliberate counter-play hook (and a tension within Primalist itself: a Primalist who runs fire-flavor doesn't pair well with the thorns flavor).
  - **Spirit Beast** (deep node, late-tree) — summons a terrain-dependent companion (forest = wolf, mountain = eagle, etc.). Requires mission terrain to be exposed to the talent layer.

**Combat-engine prerequisites for the Primalist mechanics.** From `docs/ROADMAP.md`: needs `status_consumed` log events (Evaporate consumes Frost Nova → fire damage), `summon` / `entity_hit` (Thorns Wall), `stack` / `stack_explode` (planned for wizard Aether Crystals — also useful here). All deferred until the talents land.

### Assassin

Pentagon neighbors: **Archer** (left) and **Warrior** (right).
**Existing artifacts:** mermaid diagrams in `docs/talents/` — overview + per-column detail. See `docs/talents/README.md` for the cluster map and bridge list.

- **Left column — Venomancer** (assassin × archer)
  Plant-themed poison DOTs and enemy debuffs. Aesthetic: real botanical toxins (Wolfsbane Kiss, Atropa Delirium, …) — every ability in this column is plant-named for cohesion.
  Three poison archetypes are candidate sub-branches:
  - *Stacking* — repeated applications increase damage per stack.
  - *Exploding* — delayed burst at end of duration, big hit.
  - *Confusion* — enemy attacks randomly, can strike its own allies. (Needs ally-target combat support, currently absent.)
  Heavy debuff side: reduces enemy stats / accuracy / dodge.

  Bridges to CENTER (Pocket Sand / Smoke Bomb's blind currently also applies poison stack at the edge).

- **Middle column — Pure Assassin (Spine)**
  Iconic identity. Vanish, Ambush, Flurry, threat-reduction, dodge, CC. Anchored on the existing spine: Ambush + Vanish + Exploit Weakness. Every assassin walks down some part of this no matter which side they lean.

- **Right column — Shadowblade** (assassin × warrior)
  Dirty fighting, crit-fishing, armor-ignore, bleed stacks, hit-and-run + standard assassin tools accessible at shallower depth (vanish, ambush, flurry procs, auto-target casters). Existing cluster nodes per `assassin_right.mmd`: The Flurry, Opportunist (Backstab), Hunter's Eye (Shadow Instinct), Throat Crush, No Honor (Dirty Fighting).

**Note on Shadowblade in two trees.** The label appears on both the warrior tree (right edge) and assassin tree (right edge). Same hybrid title, accessed from either side. *Open: do they offer mirrored talents, or complementary mechanics that read as the same identity from different angles?* See open questions.

### Wizard

Pentagon neighbors: **Archer** (Primalist side) and **Priest** (Inquisitor side).

- **Primalist-side column** (wizard × archer)
  Primal magic. Wizard half of the cross-tree synergy described in the archer section: Fireball pairs with Fire Arrow (shared fire-damage buffs), Frost Nova → Evaporate combo, Thorns Wall summon. The wizard-Primalist invests deeper into the spell side of the partnership while the archer-Primalist invests into the ranged-physical side; the buff clusters in this column reward whichever the wizard specializes in.

- **Middle column — Aether**
  Pure-wizard identity. Aether crystallization (stack mechanic: crystals build up and auto-explode at N stacks — see `project_combat_log_plan.md` for the `stack_explode` log event), **Time Warp**, raw spell damage, big single-target nukes. Aether ties into existing lore ([[project_deep_seals]] aether cycle / aether raid threat).

  **Time Warp** spec: a save/restore mechanic. The wizard checkpoints party state (HP, statuses, all cooldowns, possibly position) on a fixed cadence or trigger. The AI fires Time Warp when a turn went badly (crits-on-ally cluster, ally death, big debuff stack). On use, the party reverts to the checkpoint — *only Time Warp's own cooldown does not revert*, so it can't infinite-loop. Engine work: a checkpoint frame on the combat state plus a restore call. Complements the planned `status_consumed` / combat-log refactor.

- **Inquisitor-side column** (wizard × priest)
  Holy/fire damage, light healing, magic shields. Identity: church fanatic crusader with a *narrative tension* — uses "hollow magic to counter hollow magic" (fight the corruption you hunt by wielding a controlled dose of it). "Kill fire with fire" as the catchphrase. Story hook: the Inquisitor is theologically transgressive — they handle the forbidden to defeat it. Could tie into the Eighth God / Inquisition / Doctrine of Silence chapter-5+ material ([[project_faith_loyalty_arc]], [[project_deep_seals]]).

  Likely sub-branches:
  - *Holy strike / sacred flame*: paladin-adjacent damage with anti-undead bonuses (overlap with paladin's holy-striker — the Inquisitor is the same impulse seen through a fanatic-mage lens rather than a knight lens).
  - *Magic shields*: barriers, ward absorption, possibly the Aether Shield event kind from the combat log roadmap.
  - *Hollow-counter*: pathway that uses controlled doses of *hollow magic* (= undead / sacrifice magic, the school the Cult of Netheron wields) to break through Cult-protected enemies. The Inquisitor is theologically transgressive — they handle the forbidden to defeat it. Possible corruption-stack tradeoff (cost paid in some long-term marker).

**Lore lock:** *Hollow magic* in this design is specifically **necromantic / undead / sacrificial** magic, distinct from aether magic. Hollow = the Cult's domain (goal: resurrect Netheron). Aether = the wizard's neutral arcane medium. An Inquisitor channels small bits of hollow to *counter* hollow; a pure wizard never touches it.

### Priest

Pentagon neighbors: **Wizard** (Inquisitor side) and **Warrior** (Paladin side).

- **Inquisitor-side column** (priest × wizard)
  Mirror of the wizard's Inquisitor column from the *priestly* starting point. The wizard-Inquisitor is "fanatic mage who learned to handle the forbidden"; the priest-Inquisitor is "crusader priest who weaponizes the holy flame and breaks Cult protections with controlled hollow doses." Same identity, different gameplay loop because of the starting kit (cloth, prayer, healing → adds offensive holy fire + hollow-counter), exactly per the *complement* model — see Design Principles.

- **Middle column — Pure Priest**
  Full holy, prayer, healing, magic shields. Iconic support identity. Healing-over-time, party shields, dispel (from the seed-talents list).

- **Paladin-side column** (priest × warrior)
  *This is where the hybrid-complement model really pays off.* A priest who walks toward Paladin has to *invest in martial talents to even get there*: chainmail-wearing, sword-and-shield proficiency, threat generation. The warrior-Paladin starts armored and adds light healing; the priest-Paladin starts as a healer and adds armor + martial weapons. They share the name and the holy flavor, but play very differently in combat:
  - **Warrior-Paladin**: tanks via raw physical defense + threat generated by *dealing damage*. Holy healing/strikes are extras layered on top of warrior tankiness. Probably better at sustained tanking against big single targets.
  - **Priest-Paladin**: tanks via *healing-generates-threat* (a unique mechanic — healing an ally pulls aggro to the healer). Self-healing and group-healing focus. Effectively a tankier healer / "judgment healer." Probably better against multi-enemy fights where healing throughput is the bottleneck.

  This is the cleanest example of the complement principle: same hybrid title, fundamentally different tank archetypes.

**Equipment-access talents.** Becoming a priest-Paladin requires a *chainmail proficiency* talent and a *sword & shield* talent — gating mechanism via investment, not class change. This pattern likely applies elsewhere: wizard-Primalist already has "can equip chainmail" in the seed-talents list. Treating gear access as a talent unlock is a tool we have for hybrid columns generally.

## Open questions (deferred to pass 2)

- **Starting position.** Does every adventurer of a class begin at the same central node, or do they pick an entry point at recruitment that commits them to a flavor early?
- **Point budget.** How many talent points across a full career? Sets the breadth/depth of pathing.
- **Major node count per axis.** Roughly 3–4 big nodes per column, or denser?
- **Pathing rule.** Must talents be connected (PoE-style, walk the small nodes to reach the big ones), or cherry-pick any node with points (Skyrim-style)?
- **Hybrid title threshold.** What ratio of points-on-one-side triggers the title display? E.g. "70% of points left of center → Paladin label."

## Seed talent ideas (loose)

Captured from the now-removed `TALENTS_IDEAS.md` stub. Use as starter material when sketching individual clusters.

- **Paladin** — whole-team HP regen: +1% per turn / +10% between fights.
- **Warrior (or Paladin)** — *Intercept First Blow*: first damage of the turn redirects to the warrior.
- **Venomancer** — *Rust*: poison that degrades enemy armor over time.
- **Venomancer** — *Wither*: poison that reduces enemy attack power.
- **Wizard** — *Conjure Food*: party HP regen between fights (expedition-flavored).
- **Priest** — *Dispel*: removes illness / debuff effects during and between fights.
- **Primalist** — can equip chainmail (toughness tradeoff, fits archer-side bridge).
- **Primalist** — cauterize bleeding during or after combat.
- **Primalist** — cure poison during or after combat.
- ~~**Shared hybrid label, mirrored or complementary?**~~ **Resolved: complement.** The priest-Paladin vs warrior-Paladin contrast (healing-threat vs damage-threat) cemented the principle. Promoted to a Design Principle above.
- **Bleed crossover on assassin-Shadowblade.** Assassin tree's right column currently has Throat Crush and Dirty Fighting but no explicit bleed cluster. Likely *will* gain bleeds as we draw the Shadowblade edge in detail; deferred to tree-drawing pass.
- **Confusion / ally-target combat support.** Venomancer's confusion poison ("enemy attacks its own allies") is not currently supported by the AFK combat engine. Either the talent justifies adding that target-selection mode, or confusion gets reframed (skip turn? attack lowest-threat target? +miss%?).
