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

  const aliveAdvs = adventurers.filter((u) => u.hp > 0);
  const aliveEnemies = enemies.filter((u) => u.hp > 0);
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
  const fallenAdventurerIds = adventurers
    .filter((u) => u.hp <= 0 && u.kind === "adventurer")
    .map((u) => u.id);

  const loot = rollLoot(enemies);

  const finalHp: Record<string, number> = {};
  const finalMaxHp: Record<string, number> = {};
  for (const unit of adventurers) {
    finalHp[unit.id] = Math.max(0, unit.hp);
    finalMaxHp[unit.id] = unit.maxHp;
  }

  return {
    victory, rounds, log, performanceRatio, survivingEnemies, totalEnemies,
    fallenAdventurerIds, loot, finalHp, finalMaxHp,
    ...(fallenObjective?.npcId ? { vipFallen: fallenObjective.npcId } : {}),
  };
}

/** Roll each killed enemy's drop table using the seeded PRNG. */
function rollLoot(enemies: CombatUnit[]): LootResult[] {
  const loot: LootResult[] = [];
  for (const unit of enemies) {
    if (unit.hp > 0) continue;
    if (!unit.enemyDefId) continue;
    const def = getEnemy(unit.enemyDefId);
    if (!def?.loot?.length) continue;
    for (const drop of def.loot) {
      if (combatRandom() > drop.chance) continue;
      if (drop.type === "resource") {
        const amount = drop.min + Math.floor(combatRandom() * (drop.max - drop.min + 1));
        if (amount > 0) {
          loot.push({ type: "resource", resource: drop.resource, amount, fromEnemy: unit.name });
        }
      } else {
        loot.push({ type: "item", itemId: drop.itemId, amount: 1, fromEnemy: unit.name });
      }
    }
  }
  return loot;
}
