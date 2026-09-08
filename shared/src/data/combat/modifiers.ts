// ─── Mission modifiers ─────────────────────────────────────────
// Per-mission combat-rule overrides. Applied at combat setup and re-evaluated
// each round so gate conditions (e.g. "while Niamh is alive") can flip
// mid-fight. State is stamped onto units; damage.ts and other consumers read
// the flags rather than the modifiers list directly.

import type { CombatContext } from "./types.js";

/** Evaluate every active modifier against current context, stamping unit
 *  flags accordingly. Idempotent — safe to call once per round. */
export function applyMissionModifiers(ctx: CombatContext): void {
  if (!ctx.modifiers?.length) return;

  // Reset flags that modifiers manage. They get re-stamped below if still active.
  for (const e of ctx.enemies) e.physicallyPierceable = false;

  for (const mod of ctx.modifiers) {
    switch (mod.type) {
      case "physical_pierces_tag": {
        if (!isModifierActive(ctx, mod.whileAllyAlive)) continue;
        for (const e of ctx.enemies) {
          if (e.enemyTags?.includes(mod.tag)) e.physicallyPierceable = true;
        }
        break;
      }
    }
  }
}

/** A gate is satisfied when no allyId is required, OR the named NPC ally is
 *  still alive in ctx.adventurers. */
function isModifierActive(ctx: CombatContext, gateAllyId: string | undefined): boolean {
  if (!gateAllyId) return true;
  // NPC ally ids in combat are prefixed with "npc_" (see buildNpcAllyUnit).
  const unit = ctx.adventurers.find((u) => u.kind === "ally" && u.npcId === gateAllyId);
  return !!unit && unit.hp > 0;
}
