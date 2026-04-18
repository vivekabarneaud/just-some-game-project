import type { CombatUnit } from "../types.js";

export function canUseAbility(unit: CombatUnit, abilityId: string): boolean {
  return (unit.cooldowns[abilityId] ?? 0) <= 0;
}

export function startCooldown(unit: CombatUnit, abilityId: string, rounds: number): void {
  unit.cooldowns[abilityId] = rounds;
}

export function tickCooldowns(unit: CombatUnit): void {
  for (const key of Object.keys(unit.cooldowns)) {
    if (unit.cooldowns[key] > 0) unit.cooldowns[key]--;
  }
}
