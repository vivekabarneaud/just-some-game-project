import type { CombatUnit } from "./types.js";

/**
 * Backstory-trait bonuses vs specific enemy tag groups.
 *
 * Add a new trait here, then tag it on an Adventurer.trait to grant the bonus.
 * Kept as data so designers can tune without touching combat logic.
 */
const TRAIT_TAG_BONUSES: Record<string, { tags: string[]; bonus: number }> = {
  demon_hunter:       { tags: ["demon"], bonus: 0.05 },
  grave_walker:       { tags: ["undead", "ghost"], bonus: 0.05 },
  beast_tracker:      { tags: ["beast"], bonus: 0.05 },
  dragonmarked:       { tags: ["dragon"], bonus: 0.05 },
  pious_heart:        { tags: ["demon", "divine"], bonus: 0.05 },
  elemental_attuned:  { tags: ["elemental_fire", "elemental_water", "elemental_earth", "elemental_wind", "elemental_aether"], bonus: 0.05 },
  veteran_campaigner: { tags: ["humanoid"], bonus: 0.05 },
};

/** Damage multiplier bonus an attacker gets vs a defender with matching tags (0 if no match). */
export function getTraitDamageBonus(attacker: CombatUnit, defender: CombatUnit): number {
  if (!attacker.trait || !defender.enemyTags?.length) return 0;
  const entry = TRAIT_TAG_BONUSES[attacker.trait];
  if (!entry) return 0;
  const hasMatch = defender.enemyTags.some((tag) => entry.tags.includes(tag));
  return hasMatch ? entry.bonus : 0;
}

/** Lucky trait grants +3% crit chance. */
export function getTraitCritBonus(unit: CombatUnit): number {
  return unit.trait === "lucky" ? 3 : 0;
}
