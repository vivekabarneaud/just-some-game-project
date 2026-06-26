# Roster Economy

**Status:** design — not yet implemented.
**Date:** Drafted June 2026 from the recruitment-friction discussion.

The guild-roster system needs a coherent economic model so:
1. Exotic-origin recruits (Tianzhou, Zah'kari, Silvaneth, Nordveld, etc.) feel worth chasing when they unlock late-game
2. Players have real reasons to retire, swap, or rotate adventurers instead of hoarding a frozen-in-place A-team
3. Death, retirement, and recruitment all serve distinct narrative and mechanical roles

## Core principles

**No hard roster cap.** Drop the existing `3 + guildLevel × 2` formula. Natural soft constraints (attention, gear, mission slots) already shape how many adventurers a player actually uses; the cap just blocks late-game variety.

**Wages replace the cap.** Each adventurer on the active roster costs gold continuously. Wage scales with level + rank, so investment compounds the cost.

**100% permadeath on KO.** Drops to 0 HP during a mission → permanent loss (mitigated by revival items / priest spells). The 'death-risk %' on the mission assembly panel already exists; the calculation changes but the UI is in place.

**Three exit doors.** Each adventurer can leave the active roster three ways, each with different narrative + mechanical weight:
- *Death* (permadeath on KO) — permanent, optionally reversible by revival
- *Voluntary vacation* — player choice, no loyalty hit, returns after cooldown
- *Forced inactive* (unpaid → happiness 0) — loyalty hit, returns by back-pay; permanently retires if ghosted too long

## Wage scaling

Continuous deduction (like food consumption), shown as `-X gold/hr` on the guild page.

| Factor | Multiplier |
|---|---|
| Base | 1 gold/hr |
| Level | +1 gold/hr per level (Lv.5 = 5 gold/hr) |
| Rank 2 | × 1.5 |
| Rank 3 | × 2.0 |

Examples:
- Lv.1 Rank 1 recruit: 1 gold/hr
- Lv.5 Rank 1 mid-tier: 5 gold/hr
- Lv.10 Rank 3 veteran: 20 gold/hr

A roster of six Lv.5 R1 adventurers = 30 gold/hr.
A roster of six Lv.10 R3 veterans = 120 gold/hr.

Adventurers on a mission still draw wages (they're working). KO'd / between missions still draw. Inactive adventurers do NOT draw (the entire point of inactivity).

## Loyalty and Happiness — two axes

| Axis | Builds | Erodes | Resets |
|---|---|---|---|
| **Loyalty** | Slow — service time, shared victories, gear gifts | Slow — ghosting, repeated abandonment | Doesn't reset; persists |
| **Happiness** | Fast — pay, hot food, rest, victories | Fast — unpaid days, food crisis, dead teammates | Resets when conditions restored |

**Loyalty** represents lasting bond: "would they take a sword for you?" Slow to build, slow to erode. Doesn't fully recover after damage — past neglect leaves scars.

**Happiness** is current mood: paid this period? Fed well? Recent treatment OK? Swings fast. Resets when fixed.

When happiness hits 0 → adventurer becomes inactive (see state machine).

## Adventurer states

| State | Cause | Visible | Mission-eligible | Draws wage | Cost to return | Loyalty hit |
|---|---|---|---|---|---|---|
| **Active** | Paid + happy | Normal card | ✓ | ✓ | — | — |
| **Voluntary vacation** | Player choice | Greyed card, "Vacation — back in Xd" | ✗ | ✗ | 2 real days, small fee | No |
| **Forced inactive** | Wages unpaid → happiness 0 | Greyed card, "Unpaid" | ✗ | ✗ | Back-pay gold | Yes |
| **Permanently retired** | Forced inactive 7+ real days | Memorial only | ✗ | ✗ | Cannot return | (already gone) |
| **Fallen** | KO'd on a mission | Memorial (Pantheon) | ✗ | ✗ | Revival item / priest spell | — |

## Wage failure: pay-all-or-none

If gold can't cover total wage rate this tick, **nobody is paid this tick** (no priority queue, no min-maxing). Every adventurer loses happiness on the rate of `~1 happiness per game-hour unpaid`.

When happiness hits 0 → forced inactive. Greyed out, blocked from missions, slot still occupied.

Reactivation cost = back-pay (gold equal to the wages they missed during inactivity, capped at 1 game-week so it never gets absurd). Happiness restored to a default value on reactivation; loyalty stays at whatever it bled down to.

## Permanent retirement (the relief valve)

After **7 real days** in forced-inactive state, the adventurer permanently retires. Soft permadeath of the *relationship*:

> "Brennan waited a fortnight, then walked north without saying goodbye."

They're removed from the roster, slot freed. Their gear returns to inventory. Their portrait and name go into the chronicle / Pantheon as a "former adventurer" — not dead, but gone. Cannot be re-recruited.

This means a player who recovers within ~7 real days can save the relationship. A player who ghosts loses everyone eventually but won't have a permanent backlog of unpayable debt.

## Voluntary vacation

Player can proactively send any active adventurer on vacation. Reasons:
- "I have too many adventurers and can't afford the wage bill — pre-empt the loyalty hit"
- "I want to recruit a new specialist and don't want to fire anyone"
- "I'm taking a break from playing — pause the bleed"

**No loyalty hit.** Happiness preserved. They return refreshed.

**Anti-abuse cooldowns (real time, not game time)**:
- Minimum 2 real days before reactivation (player can't toggle on demand)
- Maximum once per real week per adventurer (no cycling 5 adventurers through "vacation" to dodge wages)

Real-time gates matter because dev game-speed of 50× would make game-hour gates meaningless.

Reactivation: free, or a small flat fee ("welcome back" — could be flavored as a tavern celebration). No back-pay.

## UI surfaces

**Guild page:**
- Total wage rate prominent (`-23 gold/hr`)
- Per-adventurer wage on each card
- Status pills: Active / Vacation (with countdown) / Unpaid (with back-pay cost) / Forced retired
- Active filters: sort/group by class, origin, status

**Mission assembly:**
- Inactive adventurers visible but disabled, with explanatory tooltip
- "Send to vacation" action available from each card

**Wage-crisis warnings (mirroring food crisis):**
- Red "!" badge on sidebar guild link when gold projected to run out in <12h
- Red callout on Matters card with concrete numbers and action

## Open questions

- **Should there be a "rest day" mechanic separate from vacation?** Adventurer needs rest after intense missions, brief idle period (game-hours). Different from voluntary vacation. Maybe just a hidden cooldown.
- **Does origin affect wage?** Tianzhou monks might cost less (modest), Zah'kari might cost more (proud warriors). Could be a small flavor multiplier.
- **What about the founders?** The Lord, Jory, Tomas, Edda, Corin, Nell. Probably don't draw wages — they ARE the settlement, not its employees. (Also they're citizens, not adventurers, so this is mostly moot.)
- **Revival item cost and rarity?** With permadeath, revival items become precious. Phoenix Tears as panic button — how rare? Drop rate? Craftable?
- **Loyalty restoration mechanics?** After it's been damaged, can the player rebuild it? Specific actions (giving gifts, victories, hot meals)?
- **Group morale effects?** Does an inactive (forced) adventurer drag down the happiness of others nearby? "The roster watches Brennan greyed-out at the corner table." Could be powerful or annoying.

## Implementation order

1. **Field additions:** add `happiness: number` per adventurer, `state: "active" | "vacation" | "forced_inactive"`, `inactivitySince: number`, `lastVacationAt: number`.
2. **Wage tick:** continuous deduction in the tick loop, parallel to food consumption.
3. **State transitions:** happiness hits 0 → forced inactive; forced inactive 7 days real → permanent retirement.
4. **UI surfaces:** guild page wage display, per-adventurer status pills, wage-crisis warnings.
5. **Vacation action + cooldowns:** UI button on adventurer card, real-time tracking.
6. **Drop the hard cap:** remove `getMaxRoster` enforcement. Refactor recruit candidate flow to not check slot availability.
7. **100% permadeath toggle:** flip the death-roll to "always die on KO". Revival item paths need verification first.
8. **Tuning + balance:** wage formula values, happiness decay rate, 7-day-retirement window. Iterate from play.

See also: [[project_class_talents]], [[project_origin_tiers]], [[project_loot_recipes]] (revival items), [[project_food_scrolls_loyalty]] (loyalty already exists).
