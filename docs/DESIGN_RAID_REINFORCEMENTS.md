# DESIGN — Raid Reinforcements ("Call for Help")

Players facing an incoming raid can call for help; other players (and later,
NPC settlements) can send troops that travel for a real amount of time and, if
they arrive before the raid hits, join the defender's ally pool for the fight.

Peaceful-game framing: this is **mutual aid**, not PvP. Nobody attacks anyone;
players cooperate against the NPC raids the world already throws. It is the
`friend_raid_defense` idea from memory, now buildable because the backend it was
blocked on exists.

## Player experience

1. A raid is inbound. The defender sees the existing warning + countdown
   (`IncomingRaid.remaining`), and knows the odds (defense vs. strength).
2. They press **Call for Help**. Pigeons go out (see the Pigeon Loft gate).
3. Eligible allies get a real-time toast (WebSocket): *"Ashwick is under attack,
   arrives in ~Xh. Send help?"* with the distance/ETA and the raid's strength.
4. An ally dispatches troops. The units leave their settlement and are **in
   transit** for `travelTime = distance / marchSpeed` (same shape as a trade
   caravan). They're unavailable at home while away.
5. At the moment the raid lands, every reinforcement whose `arrivesAt <= raidHitsAt`
   is folded into the defender's **ally pool**; late ones turn back.
6. The defense fight resolves with the combined force. Everyone involved gets the
   result (WS). Surviving reinforcements travel **home** (another `travelTime`),
   carrying any wounds/losses. Helpers earn goodwill (see Rewards).

No millisecond real-time: it's a dispatch-now / resolve-later interaction, exactly
like co-op expeditions and trade caravans.

## Maps onto existing systems (this is mostly assembly, not new architecture)

| Need | Reuse |
|---|---|
| The race timer | `IncomingRaid.remaining` (already a countdown) |
| Broadcast the call | WS `eventBus` (already pushes `coop:update` etc.) |
| Who to notify / where they are | `Settlement.x/y`, `SettlementSnapshot`, `Friendship` |
| Travel time to arrival | `TradeOffer.caravanArrivesAt` pattern (distance-based ETA) |
| Request lifecycle + server resolution | `CoopExpedition` model + `coopResolution` service |
| The actual fight (with an ally pool) | shared deterministic `simulateRaidCombat` |
| Gate + progression | new **Pigeon Loft** building |

## New pieces

### `ReinforcementRequest` (Prisma model — mirror `CoopExpedition`)
- `id`, `defenderId`, `raidId`, `raidHitsAt` (absolute time = now + remaining),
  `raidStrength`, `status` (`open | resolved | expired | cancelled`), `worldId`.
- Index `[status, raidHitsAt]` (the resolution tick scans due ones), plus
  `[defenderId, status]`.

### `Reinforcement` (one dispatch by one ally)
- `id`, `requestId`, `helperId`, `units` (JSON: what was sent — militia/soldiers
  and/or adventurer ids), `dispatchedAt`, `arrivesAt`, `status`
  (`marching | arrived | too_late | returning | home`), plus loss results after
  the fight.

### Pigeon Loft (building — the call-for-help gate + upgrade path)
- **Gates** the Call for Help action at all (no loft = no way to send word).
- **Level scales reach and speed:**
  - *Reach:* friends are always reachable (you have a line to them). The loft is
    what reaches **nearby non-friend settlements** within a radius that grows with
    level — the pigeons only fly so far.
  - *Speed / warning:* a higher loft gets the word out faster (less of the raid
    countdown burned before allies even hear), so more of them can arrive in time.
- Camp/village-tier building; modest cost. Trained-birds flavor (faster pigeons
  per level). Sits in the "working animals" family (see below).

### ETA math
`travelTime = round( distance(defender, helper) / MARCH_SPEED )`, distance from
world x/y. `MARCH_SPEED` tuned so a *nearby* ally can realistically beat a raid's
`remaining`, a *far* one usually can't — distance is the core tension. A higher
Pigeon Loft effectively buys lead time (word goes out sooner), not faster troops.

## Resolution authority

The raid fight is currently **client-resolved** (client sim). Two options:

- **A — Backend-coordinated, client-resolved (MVP).** The defender registers the
  raid + `raidHitsAt` with the backend on Call for Help. Helpers dispatch via the
  backend. When the countdown ends, the defender's client asks the backend "who
  arrived?", folds them into the ally pool, runs `simulateRaidCombat`, and reports
  losses back. Simplest; reuses the existing client defense sim.
- **B — Server-authoritative (like `coopResolution`).** A `raidResolution` tick
  resolves due requests server-side with the arrived pool and emits results. More
  consistent with co-op, harder to cheat, but shifts raid resolution off the
  client.

**Recommendation:** start with **A** (fast, reuses everything), and graduate to
**B** if/when cheating or consistency matters — the models above support either.

## Rewards / stakes (peaceful-game shaped)

- Helpers can **take losses** (their sent units can be wounded/killed) — real
  stakes, so answering a call means something.
- The helped player owes **goodwill**: a gratitude beat, a reputation/standing
  bump between the two settlements, maybe a thank-you gift. (No coercion; helping
  is opt-in and warm, matching the game's tone.)
- Late arrivals simply march home, no penalty beyond the wasted trip.

## Who can be called

- **Phase 1:** friends (`Friendship` accepted). Always reachable, no loft needed
  for the closest social tie — but the loft still speeds the word.
- **Phase 2:** nearby non-friend player settlements within the loft's radius (the
  pigeons find them). This is where the Pigeon Loft earns its keep.
- **Later maybe:** NPC settlements (we have their x/y too) answering for a price
  or a standing relationship — a nice PvE flavor, deferred.

## Phasing

1. **MVP:** Pigeon Loft building + Call for Help (friends only) + backend
   `ReinforcementRequest`/`Reinforcement` + WS toast + ETA from x/y + option A
   resolution (client-run fight with the arrived ally pool) + return trip +
   goodwill beat.
2. **P2:** loft-radius reach to nearby non-friend settlements; loft levels tune
   reach/speed.
3. **P3 (optional):** server-authoritative resolution (option B); NPC allies.

## Working-animals family (context, not this doc's scope)

The Pigeon Loft is the first of a loose set — build each **with the mechanic it
serves**, never as one mega-building:
- 🕊️ **Pigeon Loft** — messaging / call-for-help (this doc).
- 🐈 **Cat Shelter** — vermin / food-spoilage drain (backlog: rat rework).
- 🐕 **Kennel** — guard dogs vs. livestock predation (backlog: livestock).
- 🦅 **Falconry** — hunting boost. Caveat: falconry read as *noble*, not
  frontier-peasant; keep it rare/aspirational and much later, if at all.
