# Expeditions — Multi-Event Mission System

**Status:** Design doc, not yet implemented.
**Prerequisites:** Third per-adventurer supply slot (recovery), new item types (bandages, mending potions), expanded enemy roster.

## Overview

Expeditions are a new class of mission that unfold as a **sequence of events** (combat encounters, treasure chests, traps, NPC interactions, environmental challenges) rather than one big fight at the end. They preserve the feel of the game (AFK-able, deterministic from a seed) while delivering narrative richness and tactical depth.

Simple missions (the current single-encounter model) stay exactly as they are. Expeditions are an additional mission type for longer, higher-stakes content — "the real adventure."

## Core design pillars

1. **AFK-friendly** — events resolve in the background as the mission ticks. No required player input mid-mission (pause-with-choice is future work).
2. **Thematic coherence** — each expedition defines its own event pool (no boars in crypts).
3. **Accumulated wear** — individual events are easier than a standalone mission fight, but HP/supplies deplete across the expedition. The challenge is endurance, not a single brutal check.
4. **Player agency via preparation** — bring the right team, the right supplies, stay or retreat (future).
5. **Variance with guardrails** — some randomness per run, but bounded so the reported success % is meaningful.

## Mission data model

```ts
interface ExpeditionMission extends MissionTemplate {
  events: ExpeditionEventSlot[];
}

interface ExpeditionEventSlot {
  // What kind of event fills this slot. Can be fixed or drawn from a pool.
  type: "fixed" | "random";
  // If fixed: the single event. If random: pool to draw from.
  event?: ExpeditionEvent;
  pool?: { event: ExpeditionEvent; weight: number }[];
}

// Base event interface — extensible
type ExpeditionEvent =
  | CombatEvent
  | TreasureEvent
  | TrapEvent
  | EncounterEvent    // NPC / story beat
  | EnvironmentEvent; // weather, terrain challenge

interface CombatEvent {
  kind: "combat";
  encounters: MissionEncounter[];
  difficultyTier: 1 | 2 | 3; // individual combat difficulty
}

interface TreasureEvent {
  kind: "treasure";
  rewards: MissionReward[];
  requiresCheck?: { stat: "dex" | "wis"; dc: number }; // optional skill check
}

interface TrapEvent {
  kind: "trap";
  dcStat: "dex" | "wis";
  dc: number;                  // difficulty to avoid
  damageOnFail: { pct: number }; // % max HP dealt to whole party
}

interface EncounterEvent {
  kind: "encounter";
  // Non-combat roleplay event. Player choice in future; for now outcome rolls.
  text: string;
  outcomes: { weight: number; effect: ExpeditionEffect }[];
}

interface EnvironmentEvent {
  kind: "environment";
  // Sandstorm, blizzard, darkness — drain HP or fatigue
  text: string;
  effect: ExpeditionEffect;
}

type ExpeditionEffect =
  | { type: "heal"; pct: number }
  | { type: "damage"; pct: number }
  | { type: "reward"; rewards: MissionReward[] }
  | { type: "status"; condition: "blessed" | "cursed"; duration: number }
  | { type: "nothing" };
```

## Event timing

- Expedition has a total duration (say 30 minutes).
- Events are evenly spaced: 4 events → one every 25% of duration.
- Events resolve at their scheduled tick, outcomes are accumulated.
- A mission log records each event's outcome for player review at end.

## HP & supply persistence

| Between events | Behavior |
|---------------|----------|
| **Natural recovery** | +5% max HP (abstract rest/walking) |
| **Priest in party** | +10% max HP per priest (stacks) |
| **Bandage in recovery slot** | Auto-consume when adv HP < 40%, heals 25% max HP |
| **Mending potion in recovery slot** | Auto-consume when adv HP < 40%, heals 50% max HP |
| **Food bonus** | Persists from mission start, never resets |
| **Status effects** (poison, bleed) | Fade between combats |

Death checks happen in each combat. A dead adv stays dead — no post-mission revival from an in-expedition death (priests can still revive during combat, as they do today).

## Third per-adventurer slot — recovery

Each adventurer gets three supply slots (vertical column on their team portrait):

1. **Potion** — combat-only effects (damage_boost, defense_boost, phoenix_tears, haste)
2. **Food** — mission-start buff (stat, HP, preferred-flavor loyalty bonus)
3. **Recovery** — bandage / mending potion (between-event auto-consume)

Strict item→slot categorization (no flex):
- Healing potions (existing, `auto_low_hp` trigger) stay in **potion** slot (combat safety net)
- New **bandages** (tailoring from fiber) go in **recovery** slot
- New **mending potions** (alchemy) go in **recovery** slot

Simple missions still use the potion + food slots. Recovery slot is primarily useful on expeditions but still works on simple missions if you want the extra heal during a single fight.

## Success rate calculation

**Challenge:** events have randomness (which pool entry gets drawn per slot). A naive range display (e.g. "30-70% success") is overwhelming.

**Solution:**
- Compute success % via **N seeded simulations** over full event sequences (same pattern as current combat sim — just extended to multi-event).
- Display a single **expected success %**.
- If std-deviation across simulated runs is high, add a **volatility badge** next to the number:
  - `58% · 🎲 Stable`
  - `58% · ⚠️ Volatile`

Player gets one clear number plus a hint about how swingy it is.

**Constraining variance at design time:** each mission's event slots should mix fixed events (guaranteed structure) with pool draws (flavor variance). Example:

```
Spider Hollow Deep (expedition)
  4 events:
    1: fixed combat — 2× cave_spider
    2: random pool — treasure (w:2), combat with 1 spider (w:1), trap (w:1)
    3: fixed combat — 3× cave_spider + venom_crawler
    4: fixed treasure — boss loot chamber
```

Fixed structure tightens the reported success %. The random slot adds light variance.

## UI — expedition timeline

Between events, the mission card shows:
- **Progress bar** of total duration
- **Timeline**: dots (one per event) — past events show their outcome icon (sword if combat won / skull if TPK survived / chest if treasure / etc.), future events show a `?`, current is highlighted
- **Status line**: "Your team is exploring the crypt…" or "In combat: 2× burnt skeleton"
- **Adventurer HP bars** visible so player sees the wear over time
- **Event log**: scrollable list of completed events with icons + one-line summaries

On mission completion:
- Full summary: each event with its result
- Total loot accumulated
- Casualties (if any)

## Simple vs expedition mission split

| Aspect | Simple mission | Expedition |
|--------|----------------|-----------|
| Format | 1 encounter at end | 3-5 sequenced events |
| Duration | 5-15 min | 20-60 min |
| Events per mission | 0-1 combats | 1-3 combats + flavor events |
| Individual fight difficulty | Tuned for single all-or-nothing | Each individually lower |
| HP between fights | N/A | Accumulates / regenerates |
| Rewards | Flat reward list | Per-event + completion bonus |
| Expected success band | 10-90% (binary-ish) | 40-80% (smoother) |
| Narrative weight | Quick job | Real adventure |

## Enemy roster expansion — rationale

Current enemy roster is tuned around single-fight missions: T1s swarm, T2s lead packs, etc. Expedition combat events need a **wider spread of weaker-to-stronger enemies** so event tiers can be authored flexibly.

Gaps to fill:
- **T1 filler** — small critters that pad out swarms without being dangerous alone (shield slime, young wolf cub, crow, stirges)
- **T1 minibosses** — single enemies that stand alone as a light threat (wounded bandit, injured bear)
- **T2 weaklings** — cannon fodder T2s that fit alongside a boss (acolyte, shieldbearer)
- **T3 soloists** — strong encounters for boss slots that aren't overkill (champion, elite)
- **Environmental enemies** — tied to expedition biomes (swamp-themed, crypt-themed, dragon-ruin-themed)

Approach: author 2-4 new enemies per biome/theme as expeditions are built. Don't try to fill the whole matrix upfront.

## Rollout plan

**Phase 1 — Quick wins (not blocked by this doc):**
- Add optional 2nd slot to swarmy novice missions (spider_hollow is done, do boar_hunt / night_howling / etc.)
- Fix XP formula: `xp_per_adv = baseXp × slots / team_size`
- Session-size: 30-60 min total.

**Phase 2 — Foundation:**
- Third per-adventurer slot (recovery) in data + UI
- Bandage item (tailoring) + mending potion item (alchemy)
- Add `events: ExpeditionEventSlot[]` to MissionTemplate
- Session: 1-2 sessions.

**Phase 3 — Engine:**
- Expedition tick logic (event scheduling, HP persistence, between-event heals)
- Combat event resolution (reuse existing combat.ts)
- Treasure/trap/encounter event handling
- Session: 2-3 sessions.

**Phase 4 — UI:**
- Expedition timeline on active mission card
- Event log visible in-mission
- Completion summary with per-event breakdown
- Session: 1-2 sessions.

**Phase 5 — Content:**
- First 2-3 authored expeditions (e.g., "The Spider Hollow Descent," "The Burning Crypt Expedition")
- New enemies to fill content gaps
- Story-mission migration candidates (some existing story missions could become expeditions)
- Ongoing.

## Expedition-flavored talents

Expedition mechanics create space for new talent-tree depth. Talents that affect between-event behavior give players reasons to specialize and to bring specific classes on expeditions.

Examples:
- **Primalist (warrior/priest hybrid):** *Cauterize* — cleanse bleed/poison from all allies between events. *Primal Recovery* — +5% max HP party-wide between events (stacks with priest heal).
- **Ranger (archer talent):** *Field Dressing* — bandages heal 15% more on this adventurer. *Trailblazer* — treasure events have +25% loot.
- **Monk (assassin/priest hybrid):** *Meditation* — this adventurer regenerates 15% max HP between events without priest presence.
- **Paladin (warrior/priest hybrid):** *Lay on Hands* — once per expedition, fully heal one ally between events.
- **Scholar (wizard talent):** *Lore* — skip trap events on a successful INT check. *Translate* — encounter events can give an extra reward option.
- **Assassin — Adrenaline (risk/reward):** When HP < 30%, +50% DEX and +50% initiative. Creates a real choice: do I bandage this assassin or let them enter combat bloodied and dangerous? Pairs beautifully with the recovery-slot decision.

These make expedition party composition a real strategic decision beyond raw combat stats. Defer to expedition implementation — talents authored alongside expedition content as needs emerge.

## Open questions

- **Retreat mechanic**: can players recall mid-expedition? Losing investment but saving lives. (Defer to v2.)
- **Multi-priest diminishing returns**: 2 priests = +25%, 3 priests = +35%? Or linear +10% each? (Start linear, tune.)
- **Bandage slot-sharing**: should bandages stack inventory-wise like potions, or be consumed one-per-mission? (One-per-mission, auto-consumed.)
- **Scroll slot**: future team-wide scroll slot could hold "Scroll of Rejuvenation" for party-wide between-event heal. (Defer to team scroll implementation.)
- **Expedition difficulty rating**: single difficulty number (1-5) or separate combat/trap/environment scores? (Single number initially; add complexity if needed.)
