# Backend slice — minimum viable persistence

**Status:** design agreed May 2026. Not yet built.
**Stack:** TypeScript + Hono + Prisma + PostgreSQL. Render (app) + Neon (db). Frontend on Vercel, assets on R2.

## Why now

We currently persist everything to localStorage. Multiplayer features on the roadmap (friend raid defense, player guilds, weekly co-op expeditions, marketplace) need server-side authoritative state. The right time to start is now — zero playerbase means migrations cost nothing, and designing the schema while features are actively pulling on it produces something more usable than designing it cold.

## Architecture: hybrid blob + table

A pure blob (one `stateJson` per user) is the simplest model and lets the single-player loop iterate fast. It breaks the moment a feature needs to read or mutate *inside another player's state* — friend raid defense, guild authority, PvP trades all require queryable cross-player state.

The trap is doing a full rewrite to normalize everything. Most of the game state is slow-changing single-player data (building levels, recipes discovered, story flags, chronicle progress) where a blob wins on simplicity and schema-evolution tolerance.

**Rule of thumb:** a field gets promoted from blob to its own column the first time a feature needs to query it across players. Not before.

## Minimum-viable slice

Four tables. Everything else stays in the blob until a feature demands otherwise.

### `User`
- `id`, `email`, `passwordHash` (or OAuth equivalent)
- `displayName`, `createdAt`
- Auth + identity only.

### `Settlement`
- `id`, `userId` (FK), `name`
- `tier` (Camp / Village / Town / City)
- `worldMapPosition` (x, y — for distance/travel calculations)
- `chronicleChapter` (so the world map / friend UI can show "Chapter 3" without deserializing the blob)
- `stateBlob: Json` — everything else: resources, buildings, foods map, recipes discovered, building tools, talents distribution, quest progress, chronicle/cast seen flags, calendar state, etc.
- Indexed by `userId` for the player's own load, and by `worldMapPosition` for proximity queries.

### `Adventurer`
- `id`, `settlementId` (FK)
- `name`, `class`, `rank`, `level`, `xp`
- `alive`, `onMission`
- `equipmentBlob: Json` (slot → itemId map; small, only persistent gear)
- `bonusStatsBlob: Json` (rare; talents/quirks are stable schemas — pull out later if needed)

Pulled out because friend raid defense, guild rosters, and recruitment-visibility checks all need to query across settlements: "find my friends' idle adventurers", "list this guild's roster".

### `ActiveMission`
- `id`, `settlementId` (FK)
- `missionId` (data ref), `adventurerIds: string[]`
- `startedAt`, `duration` (server-authoritative timer)
- `successChance` (locked in at deploy)
- `claimed: boolean`
- `resultBlob: Json` (combat log, casualties, loot — populated on resolve)

Server-authoritative so timers don't desync between clients, and so co-op expedition events can fire on the server tick.

## What stays in the blob (for now)

- All buildings + levels + damage state
- Resources (gold, wood, stone, iron, wool, fiber, gems, astralShards, foods map, herbs map)
- Inventory items + materials
- Recipes discovered, building tools installed
- Quest progress, completed missions, story milestones
- Chronicle entries seen / fired, bio fragments unlocked / seen
- Calendar (year, season, day)
- NPC threat state, raid history
- Settings, daily login state, reroll counters

These don't get queried across players. If/when one does, promote it.

## Migration strategy

- Use Prisma migrations. Neon supports branches for safe schema iteration.
- Save format already has a `saveVersion` field — keep using it for blob-internal migrations.
- For the table promotions: write a one-off Prisma script that extracts the field from `stateBlob` and inserts it into the new table. Run it as part of the deploy that introduces the table.
- No need to support "old client + new server" combos while there's no playerbase. Synchronous deploys.

## Open questions

- **Server tick cadence.** Frontend currently ticks at 1s with offline catch-up. Server-side: keep it per-request (resolve on read) or run a real tick (scheduled job)? Per-request is cheaper at low scale; scheduled tick is needed for true offline raid events to happen.
- **Auth provider.** Custom email/password vs Clerk vs Auth.js. Smallest path: Auth.js with email magic link + future OAuth.
- **Session management.** JWT vs server-session-cookies. With Hono, both work; lean toward signed cookies for simplicity.
- **WebSocket vs polling for friend raid toast.** WS preferred but adds infra complexity. Polling at 30s is fine for first version.

## Triggers for promoting more state out of the blob

Concrete signals that a blob field should become its own table or column:

1. A feature needs to query it across players (`SELECT WHERE friendId IN (...)`).
2. A feature needs to mutate it concurrently from two sessions (trades, co-op).
3. A feature needs server-authoritative timing (mission resolve, raid spawn).
4. Reporting/analytics needs aggregate queries (active player counts, average level).

If none apply: leave it in the blob.
