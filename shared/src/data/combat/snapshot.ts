// ─── Combat-stage roster snapshot ───────────────────────────────
// The combat log alone can't drive the combat-stage UI: it identifies fighters
// by name, and it can't say who was in the fight (or their starting HP) before
// anyone has acted. So each sim captures a roster snapshot of every combatant at
// t0 — before the fight mutates anyone — and post-stamps the log with stable ids
// so the stage matches a line to its bar by id, not name.

import type { CombatUnit, CombatLogEntry, CombatantSnapshot } from "./types.js";

/** Snapshot the starting state of every combatant, for the combat stage to lay
 *  out and animate from. Call BEFORE the round loop mutates HP. */
export function snapshotRoster(units: CombatUnit[]): CombatantSnapshot[] {
  return units.map((u) => ({
    id: u.id,
    name: u.name,
    icon: u.icon,
    side: u.isEnemy ? "enemy" : "ally",
    kind: u.kind,
    class: u.class,
    level: u.level,
    hp: u.hp,
    maxHp: u.maxHp,
    portrait: u.portrait,
  }));
}

/** Stamp stable ids onto every log line from the roster's name→id map. Names are
 *  unique per fight (enemies numbered, adventurers + stacks unique), so the map
 *  is 1:1. Mutates the log in place. Call AFTER the sim finishes. */
export function stampLogIds(log: CombatLogEntry[], roster: CombatantSnapshot[]): void {
  const nameToId = new Map<string, string>();
  for (const c of roster) if (!nameToId.has(c.name)) nameToId.set(c.name, c.id);
  for (const e of log) {
    const aId = nameToId.get(e.attackerName);
    if (aId !== undefined) e.attackerId = aId;
    const tId = nameToId.get(e.targetName);
    if (tId !== undefined) e.targetId = tId;
    if (e.targets) {
      for (const t of e.targets) {
        const id = nameToId.get(t.name);
        if (id !== undefined) t.id = id;
      }
    }
  }
}
