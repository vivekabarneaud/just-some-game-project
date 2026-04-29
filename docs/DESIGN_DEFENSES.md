# Defenses Rework — v1 Design

Big architectural change to how raids resolve. Replaces the current scalar `defense vs strength` comparison with a real combat simulation between attackers (raid force) and defenders (walls + soldiers + tower archers). Reuses the combat log + playback system already shipped for adventurer missions.

**Status:** designed 2026-04-28, not yet implemented.
**Touches:** raid system, combat sim, building system, population, UI (new Defenses page).
**Scope:** v1 only. Specialized soldier types, adventurer auto-garrison, named officers, settlement-map UI, etc. are deferred.

---

## Goals

- **Raids feel real.** Watch the breach blow-by-blow; see your watchtower archer crit; see the soldiers hold the gap. The same emotional arc as a good mission combat.
- **Defensive depth.** Multiple wall instances arranged in concentric rings, with tactical choices about where to invest (outer for early damage, inner for last stand).
- **Stakes scale with progression.** Bigger settlements unlock more rings, more soldiers, deeper combat scenes.

---

## Concentric ring model

Defense is organized in named **rings**, scaling with settlement tier:

| Tier | Available rings |
|---|---|
| Camp | Outer |
| Village | Outer + Middle |
| Town | Outer + Middle + Inner |
| City | Same as Town for v1 (4th ring deferred) |

Rings unlock outer→inward. A Village player never sees an "Inner Ring" appear before they have a "Middle Ring", which would read as a labelling glitch.

**Always-stable labels.** "Outer" is always outermost (faces raids first). New tiers add inward. Tier-up never re-labels existing walls — your built Outer Wall stays Outer Wall forever.

**All slots always visible.** Locked future rings show with `🔒 Unlock at X tier` overlay. Same pattern as locked recipes / locked buildings. Visible progression beats hidden surprises.

---

## Buildings & roles

Three defensive building types, all multi-instance, each with its own slot per ring:

### Walls
- **Role:** HP soak. No attacks. Soak damage from raiders attacking that ring.
- **Stats:** HP per level (numbers TBD during playtest).
- **Breach:** when HP hits zero, the wall is breached and the raid pushes to the next ring.
- **After-defense state:** stays damaged at whatever HP remains. Player must repair manually with wood + stone (existing damage system).

### Watchtowers
- **Role:** Ranged attack during siege + raid early-warning visibility.
- **Stats:** 1 archer slot per tower level. Archers fire each round at lead raiders.
- **Recruitment:** archers are soldiers (see "Soldiers" below). Level X tower needs X archers recruited.
- **Spotting (new behavior):** higher-level tower → see incoming raids earlier. Without enough tower coverage, raids appear on the threats panel only when imminent (e.g., 30 min out instead of 2 h out).
- **After-defense state:** towers can be damaged (treat like walls). Killed archers are subtracted from soldier count.

### Barracks
- **Role:** melee defender pool.
- **Stats:** N soldier slots per barracks level (e.g., 3 per level).
- **Combat:** soldiers fight when their ring is breached (raid melee enters the ring).
- **After-defense state:** building can be damaged. Killed soldiers are subtracted from the soldier count AND from the population.

### Slot scheme per ring

Each ring has the same fixed plot layout:
```
[1 wall plot]  [1 watchtower plot]  [1 barracks plot]
```

So a Town tier settlement has 9 total plots (3 rings × 3 building types). Camp has 3 (Outer ring only). Village 6.

### Mage Tower (Inner ring only)

Single-instance research building stationed inside the keep. Doesn't fight in raids — purely a research / enchanting hub. Lives as a 4th plot in the Inner ring, available only at Town tier (when Inner unlocks).

- **Role:** gates enchanting recipes by level (each recipe has a `minTowerLevel`).
- **State:** `state.mageTower: PlayerMageTower` (level / damaged / upgrading).
- **Combat:** none in v1. Future iteration could add a wizard defender unit derived from tower level.

---

## Soldiers — citizens, not a separate pool

**Soldiers ARE citizens.** Recruited from the existing population. When a soldier dies in a raid, both the soldier count AND the population decrement.

### Recruitment
- One-time gold cost + small iron cost per soldier (numbers TBD).
- Recruitment requires `population - currentSoldiers > 0` (a citizen must be available to take the role).
- No upkeep in v1 — paying for them is the construction + recruitment cost.

### State model
- `state.population: number` — total citizens (includes soldiers).
- `state.soldiers: number` — subset who are recruited as defenders. Capped by sum of (barracks levels × soldiers-per-level).
- `state.archers: number` — subset who are stationed at watchtowers. Capped by sum of (tower levels).
- Soldiers and archers are drawn from the same recruited pool (a "trained citizen" reallocates between roles? or are they two separate trained types?). **Decision pending — see Open Questions.**

### Identity
- Soldiers are **anonymous**. UI shows "5 city guards", "2 archers" — no portraits, no names.
- The Pantheon stays for adventurers only. Soldier deaths show in event log + casualty count, not in the memorial.
- A future "Captain of the Guard" named-NPC system can be layered on top later.

---

## Combat simulation

Same engine as adventurer combat. Each entity is a `CombatUnit`-like:

| Entity | HP | Attack | Notes |
|---|---|---|---|
| Wall (per instance) | High, scales with level | None | Pure soak |
| Watchtower archer | Medium | Ranged, fires each round | One per tower level |
| Soldier (barracks) | Medium | Melee | One per barracks slot |
| Adventurer (garrisoned) | Their normal stats | Their normal kit | Deferred to a later phase — see Open Questions |
| Raider | Per raid template | Per raid template | Existing raid enemies |

### Round-by-round flow
1. Raid arrives at the **outer ring**.
2. Each round:
   - Raiders attack the outer wall (if standing).
   - Outer-ring watchtower archers fire on raiders.
   - Outer-ring barracks soldiers fight raiders if the wall is breached this round (melee phase).
3. When outer wall HP = 0, raid moves to the **next inward ring**. Repeat.
4. When all rings are breached AND all soldiers are dead → defense is lost.

### Combat resolution + playback
- Pre-rolled at raid timer start (`Math.random` consumed up front).
- Stored on the active raid as a combat log.
- Active raid card on Overview/Threats panel shows a `Watch combat` button after the timer ends.
- Player opens playback modal — reuses the existing CombatPlayback component.
- Same outcome banner (🛡️ Victory / 💀 Defeated) + Close button.

### Loss state
- All rings breached + soldiers dead → use existing raid loss state:
  - % resources stolen.
  - Citizens die (in addition to dead soldiers).
  - Random buildings damaged.
- Smooth handover; no new system needed.

---

## Raid timer flow

1. Raid spawns. Visibility gated by **highest watchtower level** across all rings.
2. Threats panel shows the incoming raid + countdown.
3. **Prep phase** (during the timer):
   - Player can recruit new soldiers, level up walls, repair damage, build new structures, etc.
   - Nothing is locked. Maximum agency.
4. Timer hits 0.
5. Combat sim resolves. Combat log stored.
6. `Watch combat` button appears on the threats card (or wherever the raid result lands).
7. Player watches → outcome applies (loot, damage, deaths) → raid card clears.

---

## Image-by-building-level (parallel track)

Captured in the roadmap as a separate visual concern. Each level of walls/towers/barracks gets its own art (lvl 1 wattle-and-daub → lvl 5 stone fortress), independent of settlement tier. Worth applying broadly to building art across the game.

Not blocking for the defenses rework — placeholder art (or just emoji) is fine for v1.

---

## Open questions

1. **Are soldiers and archers the same "trained citizen" pool with assignment, or two separate recruited types?**
   - (a) One pool: recruit a citizen → soldier. Assign to either barracks (melee) or watchtower (ranged). Reassignment costs nothing.
   - (b) Two pools: separate recruitment for melee soldiers and tower archers.
   - **Lean: (a)** — simpler, more flexible, citizen-centric narrative.

2. **Adventurer auto-garrison?**
   - Currently deferred. The game has no broader "citizen allocation" yet, so this would introduce a new mental model.
   - Likely lands in a future iteration once "garrison" / "deploy roles" become a more general system.

3. **Wall HP regenerates on its own?**
   - Lean: no. Manual repair only (existing system). Fits the stakes-feel-real goal.

4. **Specialized soldier types** (spearmen vs archers vs heavy infantry)?
   - Deferred. v1 = one generic soldier type. Iterate once the core feels right.

5. **Captain of the Guard / named officer NPC?**
   - Deferred. v1 stays anonymous. Could be a future "promoted soldier" track tying into the talent or adventurer system.

6. **Settlement-map UI?**
   - v1 uses a list page, ring-grouped (matches farming/buildings pattern). Spatial illustration is a polish iteration.

7. **Raid balance** — initial numbers will need a playtest pass. v1 ships with educated-guess values; we tune from there.

---

## Raid templates need rework

Currently each raid carries a scalar `strength: number` that's compared against player defense. With the combat-sim model, raids need explicit force composition — `encounters: MissionEncounter[]` (enemy types + counts), the same shape used by adventurer missions today.

**Good news:** the enemy database (`shared/src/data/enemies.ts`) is already populated and battle-tested by the mission system. No new system code needed — just authoring per-raid encounter sets:

- Small bandit camp → `[{ bandit_thug × 4 }]`
- Goblin warband → `[{ goblin_scout × 6 }, { goblin_shaman × 1 }]`
- Orc raid → `[{ orc_warrior × 3 }, { orc_warlord × 1 }]`
- Etc., across all ~12 raid templates.

Difficulty curve rebalancing follows from total enemy stats vs. expected defender composition — needs a playtest pass.

Existing raid outcomes (% resource theft, citizen losses, building damage probabilities) can stay unchanged; they fire on combat loss the same way they fire on scalar defeat today.

---

## Implementation order (rough)

1. **Data model & state.** Add multi-instance state for walls/towers/barracks (per ring). Add `soldiers` / `archers` counters. Migration from existing single-instance state.
2. **Recruitment UI.** Defenses page with ring-grouped slot list. Build/level/recruit buttons. Locked rings with tier overlays.
3. **Watchtower visibility extension.** Gate raid early-warning on highest tower level.
4. **Raid template rework.** Replace `strength` with `encounters` for each of the ~12 raid templates. Reuse existing enemy data.
5. **Combat sim integration.** Build raid combat that runs through rings sequentially. Emit combat log entries.
6. **Playback + threats UI.** Hook the existing CombatPlayback component. Show "Watch combat" on raid result.
7. **Loss state handover.** Hand off to existing raid-loss logic when defense is lost.
8. **Polish.** Damaged-building visuals, soldier-death event-log entries, UX nits.

Probably 3-5 sittings of focused work.

---

*Last updated: 2026-04-28. Update as scope evolves.*
