// ─── Potions & recovery supplies ────────────────────────────────
// Three flavors:
// - Mission potions: deploy buffs (success%, death reduction) for non-combat
// - Combat potions: drunk during combat (heal, damage boost, defense)
// - Recovery items: between-event heal on expeditions, pre-combat heal on simple
//
// Bandage is the only non-alchemy potion-style item; alchemy-brewed potions
// live in ../alchemy_recipes.ts. POTION_REGISTRY enumerates both by ID so
// helpers can query the effect set without caring about source.

import type { ItemDefinition, InventoryItem } from "./types.js";
import { ALCHEMY_RECIPES } from "../alchemy_recipes.js";

export const POTION_ITEMS: ItemDefinition[] = [
  // Recovery items (between-event heal on expeditions, pre-combat heal on simple missions)
  // ── Recovery items (between-event heal on expeditions, pre-combat heal on simple missions)
  {
    id: "bandage", name: "Bandage", image: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/items/tailoring/bandage.png", icon: "🩹",
    description: "Clean linen strips. Heals 25% of max HP and stops bleeding. Use one on a resting hero at home, or pack it for a mission to patch up before a fight.",
    classes: [],
    stats: {}, durationMod: 1, lootMod: 1,
    recipeId: "bandage", consumable: true,
  },
];

// ─── Potion System ──────────────────────────────────────────────

export type PotionCategory = "mission" | "combat" | "recovery";

export interface MissionSupplyEffect {
  successBonus: number;     // flat stat bonus to relevant stat check (not %)
  deathReduction: number;
}

export interface CombatPotionEffect {
  type: "heal_pct" | "damage_boost" | "defense_boost" | "cleanse" | "haste";
  value: number;        // heal%=25 means 25% max HP, damage_boost=50 means +50%, etc.
  duration?: number;    // rounds for buffs (undefined = instant)
  trigger: "auto_low_hp" | "before_first_attack" | "on_use";  // when the AI drinks it
}

export interface RecoveryEffect {
  /** Heal % of max HP. Applied pre-combat on simple missions, between-event on expeditions. */
  healPct: number;
}

export interface PotionInfo {
  category: PotionCategory;
  mission?: MissionSupplyEffect;
  combat?: CombatPotionEffect;
  recovery?: RecoveryEffect;
}

export const POTION_REGISTRY: Record<string, PotionInfo> = {
  // Mission potions also work in combat now — each has a combat effect so
  // the player can equip them on any mission. The `category` field is the
  // potion's *primary* flavor (kept for UI grouping); availability is
  // gated on whether the potion has a `mission` / `combat` / `recovery`
  // effect, not on the category string. See getAvailableSupplies below.
  //
  // ── Healing / death-reduction potions ─────────────────────────
  "healing_salve":          { category: "mission",
                              mission: { successBonus: 0,  deathReduction: 0.75 },
                              combat:  { type: "heal_pct",     value: 30, trigger: "auto_low_hp" } },
  "vigor_tea":              { category: "mission",
                              mission: { successBonus: 5,  deathReduction: 1.0 },
                              combat:  { type: "damage_boost", value: 15, duration: 2, trigger: "before_first_attack" } },
  "herbal_antidote":        { category: "mission",
                              mission: { successBonus: 5,  deathReduction: 0.85 },
                              combat:  { type: "heal_pct",     value: 20, trigger: "auto_low_hp" } },
  "swiftfoot_brew":         { category: "mission",
                              mission: { successBonus: 3,  deathReduction: 1.0 },
                              combat:  { type: "damage_boost", value: 20, duration: 2, trigger: "before_first_attack" } },
  "eagle_eye_elixir":       { category: "mission",
                              mission: { successBonus: 15, deathReduction: 1.0 },
                              combat:  { type: "damage_boost", value: 25, duration: 2, trigger: "before_first_attack" } },
  "scholars_draught":       { category: "mission",
                              mission: { successBonus: 0, deathReduction: 1.0 }, // XP bonus handled separately
                              combat:  { type: "damage_boost", value: 10, duration: 3, trigger: "before_first_attack" } },
  "foragers_tonic":         { category: "mission",
                              mission: { successBonus: 0, deathReduction: 1.0 }, // food bonus handled separately
                              combat:  { type: "heal_pct",     value: 15, trigger: "auto_low_hp" } },

  // ── Combat potions ────────────────────────────────────────────
  "strength_draught":       { category: "combat", combat: { type: "damage_boost", value: 25, duration: 3, trigger: "before_first_attack" } },
  "ironhide_tonic":         { category: "combat", combat: { type: "defense_boost", value: 30, duration: 3, trigger: "auto_low_hp" } },
  "phoenix_tears":          { category: "combat", combat: { type: "heal_pct", value: 100, trigger: "auto_low_hp" } },

  // ── Recovery items (between-event heal on expeditions, pre-combat heal on simple missions) ─
  "bandage":                { category: "recovery", recovery: { healPct: 25 } },
  "mending_potion":         { category: "recovery", recovery: { healPct: 50 } },
};

export function getPotionInfo(itemId: string): PotionInfo | undefined {
  return POTION_REGISTRY[itemId];
}

export function getSupplyEffect(itemId: string): MissionSupplyEffect | undefined {
  return POTION_REGISTRY[itemId]?.mission;
}

export function getCombatPotionEffect(itemId: string): CombatPotionEffect | undefined {
  return POTION_REGISTRY[itemId]?.combat;
}

export function getRecoveryEffect(itemId: string): RecoveryEffect | undefined {
  return POTION_REGISTRY[itemId]?.recovery;
}

export function isSupplyItem(itemId: string): boolean {
  return itemId in POTION_REGISTRY;
}

/** Inventory entries that are supply items. Resolves details from POTION_ITEMS first
 *  (bandage etc.), then falls back to ALCHEMY_RECIPES for herb-brewed potions. */
export function getAvailableSupplies(
  inventory: InventoryItem[],
  category?: PotionCategory,
): { item: { id: string; name: string; icon: string; description: string }; qty: number }[] {
  return inventory
    .filter((inv) => inv.quantity > 0 && isSupplyItem(inv.itemId) && (
      !category || POTION_REGISTRY[inv.itemId]?.[category] !== undefined
    ))
    .map((inv) => {
      const item = POTION_ITEMS.find((i) => i.id === inv.itemId);
      if (item) return { item, qty: inv.quantity };
      const alch = ALCHEMY_RECIPES.find((r) => r.id === inv.itemId);
      if (alch) return { item: { id: alch.id, name: alch.name, icon: alch.icon, description: alch.description }, qty: inv.quantity };
      return null;
    })
    .filter(Boolean) as { item: { id: string; name: string; icon: string; description: string }; qty: number }[];
}
