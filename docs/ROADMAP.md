# Roadmap

Bird's-eye view of pending work. One-or-two lines per item + a pointer to the design doc / memory note.
**Not** a duplicate of detailed designs — those live in `docs/DESIGN_*.md`, the auto-memory, and `docs/DESIGN_INDEX.md` (the doc-vs-code status map).

---

## 🎯 The goal: Act 1 Alpha (set 2026-06-11)

A complete, balanced Act 1 ending on the **Story 14 cult assault cliffhanger**, good enough to hand to first outside players (boyfriend → his friends; nephew later via the French translation). Milestones in order:

1. **Lore locked through Story 14** — finish the `LORE_AUDIT_2026-06-11.md` punch-list, settle the remaining canon decisions (Nordveld, Khor'vani alchemy), wire the orphaned Rowena-letter chronicles, draft Story 14 + the cult-raid quest (doesn't exist in code yet). Ward-stone canon LOCKED 2026-06-11.
2. **Progression & anti-softlock pass** — audit every gate/cost/duration through Act 1, simulate playthroughs, eliminate every way to get permanently stuck.
3. **Content quality pass** — loot/gear first (biggest dissatisfaction), then potions & foods.
4. **Talent trees deepening.**
5. **Alpha packaging** — first-hour polish, loot-chest reveal moment, onboarding.
6. **French translation (i18n)** — tutorial slice first, per the existing plan.

Working agreement: Claude executes, the user decides/reacts/plays. No task is scheduled that requires the user to grind.

---

## Now (in flight)

### Weather & ambience
Layer 1 (cosmetic, season-derived weather: top-bar strip + chip) shipped 2026-06-05, along with the sound mixer (master/ui/ambient/music) + Settings modal and a swap to the purchased UI sound pack. Next: weather Layers 2/3 and ambient sound loops (need loop assets).
**Doc:** `DESIGN_WEATHER.md`. **Memory:** `project_weather_ambience.md`.

### Design-doc sweep
`DESIGN_INDEX.md` created 2026-06-05 — every doc tagged BUILT/PARTIAL/BACKLOG against the code; stale status lines fixed. Structural cleanup done same day: archived `LORE_DEEP_SEALS` (salvaged into `LORE_EIGHTH_GOD`), merged Church+Thornveil → `DESIGN_FACTION_BALANCE.md`, retired `STORY_MISSIONS`. Still pending: reconcile Khor'vani Alchemy canon status, retitle `GAME_DESIGN.md`.

### Pantry / warehouse destructibility
Still mid-discussion (since 2026-04-28). Lean: option A (destroyable, capped stockpile loss, only at higher raid difficulties).

---

## Next (designed & ready — rest of the system already shipped)

- **Enchanted team scrolls** — the only unbuilt third of `DESIGN_FOOD_SCROLLS_LOYALTY.md`.
- **Weather Layers 2 & 3** — drought/storm/blizzard mechanics + unnatural aether storms (`DESIGN_WEATHER.md`).
- **Roster economy** — wages, vacation/forced-inactive/retirement, replacing the hard roster cap; reconcile its loyalty model with the shipped 0-100 loyalty (`DESIGN_ROSTER_ECONOMY.md`).
- **Building tools full roster** — ~18 tools + buff/secondary slots; only `cutting_board` exists (`DESIGN_BUILDING_TOOLS.md`).
- **Workers & plagues** — now unblocked since citizen-categories shipped (`DESIGN_WORKERS_PLAGUES.md`).
- **Quirks rework** — tagged personality system replacing the flat string list (`DESIGN_QUIRKS_REWORK.md`).
- **Faction balance** — Church + Thornveil escalation; needs a Chapel/Shrine rethink (`DESIGN_FACTION_BALANCE.md`).
- **Premade characters: family/rarity/unlock layer** — pool + Pantheon shipped; these fields pending (`DESIGN_PREMADE_CHARACTERS.md`).
- **Expeditions Phase 5** — authored multi-day expeditions + enemy-roster fill; core engine shipped (`DESIGN_EXPEDITIONS.md`).
- **Mission character ties** — apprentice/journeyman mission text through the founding cast; novice tier started. **Memory:** `project_mission_character_ties.md`.

---

## Later (bigger commitment / needs design alignment)

- **Marketplace rework** — exponential price scaling per repeated trade. **Memory:** `project_marketplace_rework.md`.
- **Combat log: new event kinds** — discriminated-union refactor as talents land. **Memory:** `project_combat_log_plan.md`.
- **Per-event combat playback for expeditions** — blow-by-blow per expedition event. **Memory:** `project_combat_log_plan.md`.
- **Custom hand-drawn icons** — replace 200+ emoji; art pass (see `PROMPTS.md`).
- **i18n (French)** — `@solid-primitives/i18n`, tutorial slice first; deferred until content stabilizes.
- **Proper authentication** — email verification, OAuth (Google/Discord), password reset, session hardening (alongside the now-built backend).
- **More founder fragments / chronicle entries** — Tomas/Corin late beats; rewrite the two commented-out ch1 entries in the locked Lord voice.

---

## Multiplayer (backend now exists — RE-SCOPE)

The backend shipped (`backend/`: auth/settlement/trade/friends/coop/world/ws + co-op resolution + tick), so "blocked by backend" no longer holds for the foundations. These need a **frontend-wiring audit**, not a server build:

- **Co-op expeditions** — server resolution + `CoopExpedition` table exist; verify/finish the client flow.
- **Cross-player raid defense** — send an idle adventurer to a friend's raid. **Memory:** `project_friend_raid_defense.md`.
- **Player guilds** — co-op halls, shared raids, weekly events. **Memory:** `project_player_guilds.md`.

---

## Future (Phase 4+)

- **Dragon system** — egg from a late mission, tamagotchi nurturing, defense + PvP. **Memory:** `project_dragon_system.md`.
- **Story continuation** — story ships through Story 13 (`STORY_PLAYER_SCRIPT.md`); Chapters 5+ (Inquisition / Doctrine of Silence) pending. **Memory:** `project_faith_loyalty_arc.md`.
- **Ward-stone system** — war-for-the-line late game; ties into weather Layer 3. **Memory:** `project_ward_stone_system.md`.

---

## Open questions / decisions pending

- Pantry/warehouse destruction tuning (see Now).
- Faction-balance redesign after the Chapel→Shrine rename.
- Story beats with no firing event yet: Tomas decision-paralysis reveal, Edda's Mira/Mae, Corin's secret notebook, the Lord's mother's death.
- Real-prod vs preprod environment rename — deferred to launch.

---

## Recently shipped

Big systems confirmed live in the 2026-06-05 sweep (many had been stale-marked "not implemented"):
- **Weather Layer 1 + UI sound system + Settings modal** (2026-06-05).
- **Backend** — Hono + Prisma + Postgres; routes + ws + co-op resolution + tick.
- **Defenses rework** — ring combat sim, Defenses page, garrison modal.
- **Citizen categories** — per-category population, aging, differential food, adults-only defense.
- **Talent trees** — full per-class trees + hybrid-title capstones.
- **Expeditions** — multi-event engine, recovery slot, timeline UI (Phase 5 pending).
- **Races/origins** — races, origins, enemy tags, backstory-trait passives, ghost/aether immunities.
- **Content expansion** — new enemies, gems, Jewelcrafter, ring slots.
- **Farming expansion** — apiary/honey, orchards, mushrooms, cheese.
- **Food + loyalty** — Tavern food crafting, per-adventurer food/potion slots, 0-100 loyalty (scrolls pending).
- **Premade character pool + Pantheon** (family/rarity/unlock pending).
- Earlier: phone-responsive pass, founding-cast voice pass, recruit gating, combat log + playback, travel structure, permadeath.

---

*Last updated 2026-06-05 (doc sweep + weather/sound session). See `DESIGN_INDEX.md` for the full doc-vs-code status map. Update when scope or status changes — don't let this drift.*
