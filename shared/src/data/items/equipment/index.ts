// ─── Equipment ─ combined from the per-type files ───
// Split by item TYPE for tidiness as the item list grows; rarity is a field on
// each item (see types.ts ItemRarity). EQUIPMENT_ITEMS keeps the same shape the
// rest of the codebase imports.

import type { ItemDefinition } from "../types.js";
import { WEAPONS } from "./weapons.js";
import { ARMOR } from "./armor.js";
import { JEWELRY } from "./jewelry.js";
import { OFFHAND } from "./offhand.js";
import { STARTER_GEAR } from "./starter.js";

export { WEAPONS, ARMOR, JEWELRY, OFFHAND, STARTER_GEAR };

export const EQUIPMENT_ITEMS: ItemDefinition[] = [
  ...WEAPONS,
  ...ARMOR,
  ...JEWELRY,
  ...OFFHAND,
  ...STARTER_GEAR,
];
