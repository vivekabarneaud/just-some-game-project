# Roadmap

Bird's-eye view of pending work. Each item is one-or-two lines + a pointer to the design doc / memory note / commit context.
**Not** a duplicate of detailed designs — those still live in `docs/DESIGN_*.md` and the auto-memory.

---

## Now (paused mid-discussion or actively in flight)

### Pantry / warehouse destructibility
Mid-discussion 2026-04-28. Three options on the table:
- **A.** Destroyable; X% stockpile loss on destruction (most punishing).
- **B.** Damageable only; reduced storage cap while damaged (softer).
- **C.** Hybrid — building survives but a "would-have-destroyed" raid steals a 40-50% chunk.

Current lean: A with mitigations (raid-warning prose, cap on max loss, only at higher raid difficulties).

### Damaged-buildings polish (Phase 1 done)
- Defense bug fixed: damaged walls/watchtower/barracks now contribute 0 to defense.
- Label change: "Damaged — Inactive" replaces "not producing" everywhere.
- Open: any other damageable system that has a buggy "still works while damaged" path? Audit pass needed at some point.

### Pantheon polish
Pantheon page is in. Next iteration could:
- Better flavor text (mission-specific templates, e.g., "Died gathering timber" not just "Slain by Wolf, while on Gather Timber").
- Sort/filter by class, origin, age at death.
- Memorial state evolution as the shrine upgrades into a church (more space, candles, priest blessings on graves).

### Tutorial polish (the loved-ones-can-play goal)
Major work shipped: founding cast bios, em dash sweep, phone responsive, recruit pool gated by guild level, combat playback. Still on the list:
- Mission character ties (see Next).
- Maybe: walk through the first hour with a fresh save and sanity-check pacing.

---

## Next (queued, well-scoped, 1-3 sittings each)

### Mission character ties
Rewrite adventurer mission descriptions and rewards through the founding cast (Edda herbs, Jory timber, Tomas stone, Corin shrine work, Nell foraging). Already started for novice tier; apprentice/journeyman tiers still generic.
**Memory:** `project_mission_character_ties.md`

### Wizard teleport (Phase 3 of travel structure)
Passive: wizards on a team halve the return-travel duration (mission completes faster). Late-game scroll: instant return on consume. Mage Tower building unscoped, deferred.
**Conversation context:** 2026-04-27 evening, design locked.

### Combat log: new event kinds
The discriminated-union refactor was deferred until we have 3-4 new kinds to justify it. Add as the corresponding talents land:
- `status_applied` ✓ (done as additive field)
- `status_consumed` (Evaporate consuming Frost Nova)
- `summon` / `entity_hit` (Thorns Wall)
- `stack` / `stack_explode` (Aether Crystals)
- `combo_built` / `combo_spent` (assassin finishers)
- `shield_block` (Aether Shield)

**Memory:** `project_combat_log_plan.md`

### Talent system v1
Frost Nova → Evaporate combo (cold sets up, fire spends). Thorns Wall (HP entity, taunt, fire-vulnerable). Aether Crystals (auto-explode at N stacks). Cross-class border nodes (wizard burn-amp ↔ primalist ↔ archer fire-arrows).
**Discussion:** 2026-04-27 evening (auto-memory carries the design).
**Design doc:** `docs/DESIGN_TALENT_TREES.md` (identity pass per class + cross-tree synergy principle).
**Memory:** `project_talent_pentagon.md`, `project_class_talents.md`

### Per-event combat playback for expeditions
Bring the regular-mission playback experience to **expeditions** (multi-event missions). Today: regular combat missions have a "Watch combat" button + pulsing red card during the combat phase, and the playback modal walks through entries at reading speed. Expeditions only show a one-line timeline summary per event ("Event 2/4 — defeated 3 cave spiders"); there's no way to watch the blow-by-blow.

What this would add:
- When an expedition combat event fires mid-mission, store its log separately on the active mission.
- Active mission card shows a `🔴 unread combat` badge per unviewed event log.
- Player opens a playback modal for each event, same UX as regular missions.
- Optional polish: notification toast when an event fires ("⚔️ Combat at the Spider Hollow!") nudging the player to watch.

**Memory:** `project_combat_log_plan.md`

---

## Later (parked, needs design alignment or bigger commitment)

### Audio: SFX + music
Howler.js. Phase 1 just SFX (click, build-complete, raid alert, mission start/return). Phase 2 ambient music (per-season loops + raid-incoming sting). User browsing sound banks; foley DIY recording for SFX.
**Conversation:** 2026-04-26.

### Custom hand-drawn icons
Replace emoji icons throughout the game (currently 200+ emojis in resources/buildings/items/missions). Decision against Twemoji because real art is the eventual plan.
**Conversation:** 2026-04-26.

### i18n (French)
Framework: `@solid-primitives/i18n`. Phase 1 = tutorial slice (intro cinematic + first ~9 quests + sidebar nav + topbar). Phase 2 = missions + chronicle + character pages. Deferred until content stabilizes.
**Conversation:** 2026-04-27.

### Chronicle entries
Two existing entries (`ch1_nell_notebook`, `ch1_stable_now`) commented out — they predate the founding-cast voice pass. Need rewriting in the locked Lord voice. `ch1_arrival` (intro) is current.
**File:** `frontend/src/data/chronicle_entries.ts`

### More founder fragments
Edda has 4 fragments, Jory 2, Tomas 2, Corin 1 (kept from old version). Nell is deliberately fragment-less for now (felt-through-others design).
- Reconsider: 1-2 more for Tomas (cat reveal, decision-paralysis trauma — late-game beats).
- Father Corin's secret notebook reveal (mid-game beat, see `founder_father_corin.md`).
- "First arrival" beats for non-Ashwick origins as guild upgrades unlock them (see `project_origin_tiers.md`).

### Citizen categories (Phase B — full per-category state)
Replace `state.population: number` with a `CitizenCounts` struct covering toddlers / children / adults / elderly. Aging tick advances cohorts each game-year; food consumption multiplies per category; defense recruitment reads `adults` only (so the Defenses page "available citizens" makes intuitive sense). Growth events get flavor (couple / family / baby / drifter) instead of the generic "1 citizen joined". Founder cast is initialised in-bracket (Edda + Corin elderly, Nell child, Jory + Tomas adult).

Skipped Phase A (cosmetic ratios) per 2026-04-29 discussion — going straight to Phase B once the Defenses rework lands.

**Doc:** `DESIGN_CITIZEN_CATEGORIES.md`. ~3-4 sittings.

### Backend phase
Hono + Prisma + Postgres, deploy on Render, DB on Neon. World map + trade + co-op + PvP foundations.
**Memory:** `project_backend_plan.md`

### Proper authentication
Current login (`frontend/src/api/auth.ts`, `pages/Login.tsx`) doesn't actually verify email addresses or enforce strong identity. For real launch:
- Email verification (signup confirmation flow + verified-only writes for shared/multiplayer features).
- OAuth with **Google** and **Discord** as alternatives — friction-free sign-in, well-known providers for a hobby game audience.
- Password reset flow.
- Sessions / token refresh hardening.

Probably blocked on (or done alongside) the backend phase.

---

## Future (Phase 4+, after the tutorial / single-player core feels right)

### Multiplayer player guilds
Co-op guild halls, shared raids, weekly multiplayer expedition events.
**Memory:** `project_player_guilds.md`. Blocked by backend.

### Cross-player raid defense (send adventurers to help a friend)
WS push when a friend's raid timer starts → toast on your client ("Edda's settlement is under attack from a Wolf Pack — defend?"). Pick an idle adventurer → they travel to the friend's settlement → join their raid sim as a defender unit when combat fires. Friendship-strengthening, fits the cooperative-medieval-fantasy thesis.

Open design Qs (lock at design time, not now): travel time (instant for nearby friends? Hours for far ones?); what happens if your adventurer dies in someone else's raid (full permadeath? Recovery?); reciprocity/cooldown so it isn't a one-way drain; how the raid sim resolves authoritatively across two clients (server-side once backend lands).

**Memory:** `project_friend_raid_defense.md`. Blocked by backend (raid combat is currently client-resolved; cross-player needs server-side sim or strict coordination).

### Dragon system
Egg from late mission, tamagotchi nurturing, defense + PvP.
**Memory:** `project_dragon_system.md`

### Story arc rethink
Outer Wilds-inspired first-person Lord's journal, two-track knowledge (known baseline + joint mystery discovery). Major rework planned April 2026.
**Memory:** `project_chronicle_journal.md`

### Expeditions phase 2+
Phase 1 (slot additions + XP split) done. Phases 2+: deeper event chains, multi-day expeditions, choice-based events.
**Doc:** `DESIGN_EXPEDITIONS.md`. **Memory:** `project_expeditions.md`

### Marketplace rework
Replace cooldown system with exponential price scaling per repeated trade.
**Memory:** `project_marketplace_rework.md`

### Mission supply rework
Per-adventurer potion + food slots + team scroll slot. Replaces flat 3-supply system.
**Memory:** `project_assembly_refactor.md`

### Building tools system
Crafted tools (iron hook, saw) installed in buildings to boost production. Foundation in place; full content pass pending.
**Doc:** `DESIGN_BUILDING_TOOLS.md`. **Memory:** `project_building_tools.md`

---

## Open questions / decisions pending

- **Pantry/warehouse destruction tuning** (see Now).
- **Tomas decision-paralysis reveal** — when in story arc? Likely mid-game; tied to a specific chronicle beat. (`founder_tomas.md`)
- **Edda's daughter Mira / granddaughter Mae** reveal — late-Chapter-1 or Chapter-2 beat. (`founder_edda.md`)
- **Father Corin's secret notebook** reveal — when does someone find it? (`founder_father_corin.md`)
- **Lord's mother dies** beat — seeded in `founder_the_lord.md`, no firing event yet.
- **Real-prod vs preprod environment rename** — deferred to launch (`project_environments.md`).
- **Talent tree visual** — PoE2-inspired spirals/fractals; medium-complexity art pass.

---

## Recently shipped (last 2-3 weeks, for memory)

- **Defenses rework (2026-04-29)**: concentric Outer/Middle/Inner rings, multi-instance walls/watchtowers/barracks, real raid combat sim sharing the mission combat engine, blow-by-blow playback, soldiers-as-citizens recruit, Mage Tower → Inner ring, panic-build escape hatch on lumber mill / quarry, tier-variant images, Houses prereq cap fix.
- Phone responsive pass (shell, cards, dropdowns, drawer nav, font scales).
- Founding cast voice pass (Edda/Jory/Tomas + Corin polish, Lyra named, em dash sweep).
- Recruit pool gated by guild level.
- Mission text + reward thematic alignment (wolfhide/fang/bear claw/etc.).
- Combat log: shared renderer, HP bars, status-applied notes, playback modal.
- Travel structure for combat missions (outbound/combat/homeward).
- Permadeath at deploy + KO vs slain in log + death records on adventurers.
- Pantheon (memorial wall in the shrine), faded portraits, in-game date.
- Damaged defensive buildings: defense bug fix + label cleanup.
- Mission dismiss UX (failure path actually dismisses on click).

---

*Last updated: 2026-04-29 (post-defenses merge). Update when scope or status changes — don't let this drift.*
