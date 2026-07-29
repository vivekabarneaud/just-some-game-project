import type { CombatUnit, CombatResult, LootResult, CombatLogEntry } from "./types.js";
import { combatRandom } from "./prng.js";
import { getEnemy } from "../enemies.js";

/**
 * Post-round: determine victory, roll loot from killed enemies, capture final HP.
 *
 * Victory rules:
 *   - All enemies dead      → victory
 *   - All adventurers dead  → defeat
 *   - Both alive (round cap)→ whoever has higher HP ratio wins
 */
export function buildResult(
  adventurers: CombatUnit[],
  enemies: CombatUnit[],
  totalEnemies: number,
  log: CombatLogEntry[],
  rounds: number,
): CombatResult {
  // A mission-objective ally falling overrides victory regardless of enemy state.
  // Mission engine reads vipFallen to take the distinct-failure path.
  const fallenObjective = adventurers.find((u) => u.isMissionObjective && u.hp <= 0);

  // Fled units left the field alive — they don't count toward "still fighting".
  // A routed enemy (fled, hp > 0) is DEFEATED: the field is cleared, so it
  // counts as a win and toward the performance ratio, not as a survivor.
  const aliveAdvs = adventurers.filter((u) => u.hp > 0 && !u.fled);
  const aliveEnemies = enemies.filter((u) => u.hp > 0 && !u.fled);
  const survivingEnemies = aliveEnemies.length;

  let victory: boolean;
  if (fallenObjective) victory = false;
  else if (aliveEnemies.length === 0) victory = true;
  else if (aliveAdvs.length === 0) victory = false;
  else {
    const advHpRatio = aliveAdvs.reduce((s, u) => s + u.hp, 0) / adventurers.reduce((s, u) => s + u.maxHp, 0);
    const enemyHpRatio = aliveEnemies.reduce((s, u) => s + u.hp, 0) / enemies.reduce((s, u) => s + u.maxHp, 0);
    victory = advHpRatio >= enemyHpRatio;
  }

  const enemiesKilled = totalEnemies - survivingEnemies;
  const performanceRatio = totalEnemies > 0 ? enemiesKilled / totalEnemies : 0.5;
  // Filter out NPC allies / entities — fallenAdventurerIds drives the permadeath
  // roll on the player's side only. Niamh falling is reported via vipFallen.
  // Fallen = downed adventurers who did NOT escape — the death-roll candidates.
  // (Fled units always have hp > 0, so they're naturally excluded.)
  const fallenAdventurerIds = adventurers
    .filter((u) => u.hp <= 0 && u.kind === "adventurer" && !u.fled)
    .map((u) => u.id);
  // Escapees come home wounded.
  const fledAdventurerIds = adventurers
    .filter((u) => u.fled && u.kind === "adventurer")
    .map((u) => u.id);
  // The team broke off rather than winning or being wiped.
  const retreated = !victory && fledAdventurerIds.length > 0;

  // Luck (Combat Foundation): the party's summed luck lifts every drop's chance.
  // Gear-granted (e.g. the Stranger's Signet). Subtle by default — tune LUCK_*.
  const partyLuck = adventurers.reduce((sum, u) => sum + (u.luck ?? 0), 0);
  const loot = rollLoot(enemies, partyLuck);

  const finalHp: Record<string, number> = {};
  const finalMaxHp: Record<string, number> = {};
  const finalConditions: Record<string, { type: "bleed" | "poison" | "froth" | "venom"; remainingRounds: number; perRound?: number; icon?: string }[]> = {};
  for (const unit of adventurers) {
    finalHp[unit.id] = Math.max(0, unit.hp);
    finalMaxHp[unit.id] = unit.maxHp;
    // Only SURVIVORS carry wounds home — the fallen are handled by the death roll.
    // Collapse the unit's remaining DoTs into one condition per type, keeping the
    // longest remaining duration and its per-round damage.
    if (unit.kind === "adventurer" && unit.hp > 0 && unit.poisonTicks.length > 0) {
      const byType = new Map<"bleed" | "poison", { remainingRounds: number; perRound?: number; icon?: string }>();
      for (const tick of unit.poisonTicks) {
        const type = tick.type ?? "bleed";
        const prev = byType.get(type);
        if (!prev || tick.rounds > prev.remainingRounds) {
          byType.set(type, { remainingRounds: tick.rounds, perRound: tick.damage, icon: tick.sourceIcon });
        }
      }
      const conds = [...byType.entries()].map(([type, v]) => ({ type, ...v }));
      if (conds.length > 0) finalConditions[unit.id] = conds;
    }
    // The froth is carried home by any SURVIVOR who was infected. It doesn't
    // decay like the DoTs (remainingRounds is a sentinel) — it worsens at home
    // until treated. remainingRounds:1 keeps it "live" past the decay filter.
    if (unit.kind === "adventurer" && unit.hp > 0 && unit.frothed) {
      (finalConditions[unit.id] ??= []).push({ type: "froth", remainingRounds: 1, icon: "🤢" });
    }
  }

  return {
    victory, rounds, log, performanceRatio, survivingEnemies, totalEnemies,
    fallenAdventurerIds, loot, finalHp, finalMaxHp,
    ...(fledAdventurerIds.length > 0 ? { fledAdventurerIds, retreated } : {}),
    ...(Object.keys(finalConditions).length > 0 ? { finalConditions } : {}),
    ...(fallenObjective?.npcId ? { vipFallen: fallenObjective.npcId } : {}),
  };
}

/** + drop-chance per point of party luck (relative). +10 luck → a 1% drop
 *  becomes 1.1%. Deliberately gentle; the flagship source (Stranger's Signet)
 *  is a modest charm. Tune here once we can eyeball hauls in /dev-battle. */
export const LUCK_CHANCE_PER_POINT = 0.01;

/** Relative drop-chance multiplier for a given summed party luck (1.0 = no luck).
 *  Every drop's chance is scaled by this in rollLoot. Exported so it's testable
 *  without the noise of a full combat sim. */
export function luckLootMultiplier(partyLuck: number): number {
  return 1 + partyLuck * LUCK_CHANCE_PER_POINT;
}

/** Roll each defeated enemy's drop table using the seeded PRNG. Killed enemies
 *  roll their whole table; a routed (fled, hp > 0) enemy only rolls sheddable
 *  `keepOnRout` drops (a fang left behind, not the hide/carcass). `partyLuck`
 *  (summed across the team) lifts every drop's chance uniformly. */
function rollLoot(enemies: CombatUnit[], partyLuck = 0): LootResult[] {
  const luckMult = luckLootMultiplier(partyLuck);
  const loot: LootResult[] = [];
  for (const unit of enemies) {
    const routed = unit.hp > 0 && unit.fled;
    const killed = unit.hp <= 0;
    if (!routed && !killed) continue; // still standing (shouldn't happen post-combat)
    if (!unit.enemyDefId) continue;
    const def = getEnemy(unit.enemyDefId);
    if (!def?.loot?.length) continue;
    for (const drop of def.loot) {
      if (routed && !drop.keepOnRout) continue; // fled: carcass loot stays with the living beast
      if (combatRandom() > drop.chance * luckMult) continue;
      if (drop.type === "resource") {
        const amount = drop.min + Math.floor(combatRandom() * (drop.max - drop.min + 1));
        if (amount > 0) {
          loot.push({ type: "resource", resource: drop.resource, amount, fromEnemy: unit.name });
        }
      } else if (drop.type === "oneOf") {
        // Pick exactly one option by weight (default weight 1 = even odds).
        const total = drop.options.reduce((s, o) => s + (o.weight ?? 1), 0);
        let r = combatRandom() * total;
        let chosen = drop.options[0];
        for (const o of drop.options) { r -= o.weight ?? 1; if (r <= 0) { chosen = o; break; } }
        const amount = chosen.min + Math.floor(combatRandom() * (chosen.max - chosen.min + 1));
        if (amount > 0) {
          loot.push({ type: "resource", resource: chosen.resource, amount, fromEnemy: unit.name });
        }
      } else {
        loot.push({ type: "item", itemId: drop.itemId, amount: 1, fromEnemy: unit.name });
      }
    }
  }
  return loot;
}
