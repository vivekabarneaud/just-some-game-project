# DESIGN: Scarcity-Triggered Missions (the never-stuck safety valve)

**Status (2026-08-14 audit):** BUILT via engine code rather than the designed data gate — four live triggers in `gameState.tsx` (`forceMission`): low wood→gather_timber, low stone→quarry, low food→boar hunt / winter deer yard, low water→north stream / fill barrels. Missing: a cooldown/anti-farming guardrail (re-forces every tick while the shortage lasts). The proposed `MissionRequirements` resource-below gate is now an optional refactor.

**One-line:** Some missions appear **when a resource runs low**, so the player is **never soft-locked** — the world offers a way out when you're desperate, wrapped in narration that makes it feel like the settlement *responding to a crisis*, not a handout.

---

## The mechanic

A new **`MissionRequirements`** condition — a **resource-below / scarcity** gate — wired to the game's existing scarcity signals:
- **Food:** `foodHoursLeft < FAMINE_RATION_THRESHOLD_HOURS` (already computed for the ration mechanic).
- **Wood / stone:** below a threshold *and/or* no income (a stalled builder).

When the condition holds, the mission surfaces on the board; when the crisis passes, it retires.

## Why

A frontier survival game can dead-end (no food, no income, no way to recover). These missions are the **catch-up valve** — a hunt for meat when the larder's empty, an emergency timber run when the woodpile's gone. The player always has *a* lever to pull.

## Instances

- **Wild Boar Hunt** — fires on **low food**, rewards **meat**. Gives wild boars a home + a survival hook. *(First one; narration in DESIGN_TIER1_GEAR.)*
- **(future) Emergency timber / quarry run** — fires on **low wood/stone**. NB: the existing Quarry Expedition / timber gathers are *unlock-then-repeatable* (`missionDone`-gated), **not** scarcity-gated — so this is a distinct, still-unbuilt trigger.

## Guardrails

- Fire only on a **genuine** shortage (low resource + no/low income) so it reads as a crisis, not a freebie.
- Consider a **cooldown** / one-at-a-time so a player can't farm the safety valve by deliberately staying poor.
- Strong, situation-aware **narration** — the mission should acknowledge *why* it appeared ("the larder's down to scrapings…"), or it feels gamey.
