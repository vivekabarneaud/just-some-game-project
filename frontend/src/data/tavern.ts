// ─── Tavern: hospitality mechanics ──────────────────────────────
// Phase 1-2 of the tavern rework (docs/IDEAS.md (Tavern & merchants)). The economy loop:
//   staffing (adult servers, shared with the garrison pool) gates whether beds
//   can be served; pricing trades occupancy for margin; reputation (the tavern's
//   own bar) raises the occupancy ceiling. Numbers are placeholder — tune to
//   play. `calcTavern` is the single source of truth for the tick and the page.

import { getSettlementTier, type SettlementTier,
  ALE_PRODUCTION_PER_BREWERY_LEVEL, ALE_FOOD_COST_PER_BREWERY_LEVEL, ALE_CONSUMED_PER_TAVERN_LEVEL, ALE_STORAGE_BASE, ALE_STORAGE_PER_BREWERY_LEVEL,
  MEAD_PRODUCTION_PER_BREWERY_LEVEL, MEAD_HONEY_COST_PER_BREWERY_LEVEL, MEAD_CONSUMED_PER_TAVERN_LEVEL, MEAD_STORAGE_BASE, MEAD_STORAGE_PER_BREWERY_LEVEL,
  CIDER_PRODUCTION_PER_BREWERY_LEVEL, CIDER_APPLE_COST_PER_BREWERY_LEVEL, CIDER_CONSUMED_PER_TAVERN_LEVEL, CIDER_STORAGE_BASE, CIDER_STORAGE_PER_BREWERY_LEVEL,
} from "./buildings";

/** Rooms a tavern of this level offers. Exponential — settlement growth is
 *  exponential (endgame ~1000 citizens). Locked L1-4 at 1/2/4/8; doubles beyond
 *  as a placeholder until the population curve is tuned. */
export function tavernRooms(level: number): number {
  if (level <= 0) return 0;
  return Math.pow(2, level - 1); // 1, 2, 4, 8, 16, ...
}

/** Adult servers to fully staff a tavern of this level (linear — you don't need
 *  8 servers for 8 rooms). Drawn from the same adult pool as the garrison. */
export function serversNeeded(level: number): number {
  return level <= 0 ? 0 : level; // 1, 2, 3, 4, ...
}

/** Cooked staples featured on the menu by default. Phase 2+ adds adventurer
 *  /culture dishes as extra featured slots. */
export const MENU_STAPLE_IDS = ["porridge", "hearth_stew", "river_stew", "bone_broth"];

/** Commodity drinks: NOT kitchen recipes. They're brewed/stored elsewhere (the
 *  Brewery's ale barrel; later wine/mead) and, when featured on the menu, poured
 *  from that stock. The tavern draws the stored resource menu-driven — off the
 *  menu, nothing is drawn (so the Brewery stops eating grain to refill). One
 *  entry per drink; wire beer/wine/mead here as they arrive. */
export interface TavernCommodityDrink {
  id: string;
  name: string;
  icon: string;
  image?: string;
  /** The stored resource this drink is poured from — must match a numeric field
   *  on GameState of the same name (s.ale, s.mead, s.cider, …). */
  resource: string;
  /** Building that produces + gates the drink. */
  requiresBuilding: string;
  /** Minimum level of `requiresBuilding` before this drink unlocks (default 1).
   *  Each new drink comes at a higher brewery level — a real level milestone. */
  minBuildingLevel?: number;
  /** Player-facing label for what it's brewed from (e.g. "grain", "honey"). */
  brewedFrom: string;
  /** The resource consumed to brew it. "food" draws the whole larder (spread
   *  across food types); anything else is a specific resource (honey, apples…). */
  inputResource: string;
  producePerBuildingLevel: number;
  inputPerBuildingLevel: number;
  consumePerTavernLevel: number;
  storageBase: number;
  storagePerBuildingLevel: number;
}

// The tavern's drinks. To add one (beer/wine/…): add an entry here + a matching
// numeric GameState field (s.<resource>) with its init/migration default, and
// register the resource in getResourceQty/spendResource. The brew/pour tick,
// happiness, top-bar row, menu card, and Manage toggle are all generic.
export const TAVERN_COMMODITY_DRINKS: TavernCommodityDrink[] = [
  {
    id: "ale", name: "Ale", icon: "🍺", resource: "ale", requiresBuilding: "brewery", minBuildingLevel: 1, brewedFrom: "grain",
    inputResource: "food", producePerBuildingLevel: ALE_PRODUCTION_PER_BREWERY_LEVEL, inputPerBuildingLevel: ALE_FOOD_COST_PER_BREWERY_LEVEL,
    consumePerTavernLevel: ALE_CONSUMED_PER_TAVERN_LEVEL, storageBase: ALE_STORAGE_BASE, storagePerBuildingLevel: ALE_STORAGE_PER_BREWERY_LEVEL,
  },
  {
    id: "mead", name: "Mead", icon: "🍯", resource: "mead", requiresBuilding: "brewery", minBuildingLevel: 2, brewedFrom: "honey",
    inputResource: "honey", producePerBuildingLevel: MEAD_PRODUCTION_PER_BREWERY_LEVEL, inputPerBuildingLevel: MEAD_HONEY_COST_PER_BREWERY_LEVEL,
    consumePerTavernLevel: MEAD_CONSUMED_PER_TAVERN_LEVEL, storageBase: MEAD_STORAGE_BASE, storagePerBuildingLevel: MEAD_STORAGE_PER_BREWERY_LEVEL,
  },
  {
    id: "cider", name: "Cider", icon: "🍎", resource: "cider", requiresBuilding: "brewery", minBuildingLevel: 3, brewedFrom: "apples",
    inputResource: "apples", producePerBuildingLevel: CIDER_PRODUCTION_PER_BREWERY_LEVEL, inputPerBuildingLevel: CIDER_APPLE_COST_PER_BREWERY_LEVEL,
    consumePerTavernLevel: CIDER_CONSUMED_PER_TAVERN_LEVEL, storageBase: CIDER_STORAGE_BASE, storagePerBuildingLevel: CIDER_STORAGE_PER_BREWERY_LEVEL,
  },
];

export function getCommodityDrink(id: string): TavernCommodityDrink | undefined {
  return TAVERN_COMMODITY_DRINKS.find((d) => d.id === id);
}

/** How many dishes the tavern can feature at once, across all columns. Grows
 *  with the tavern — so a bigger house sets a wider table. Level 1 already
 *  seats the three staples with a little room to spare. */
export function menuCapacity(level: number): number {
  return level <= 0 ? 0 : 3 + level; // L1: 4, L2: 5, …
}

/** Gold per occupied room per game-day, before the pricing margin (placeholder). */
export const TAVERN_GOLD_PER_ROOM_PER_DAY = 5;

/** How fast reputation eases toward the current service quality (points/game-hour). */
export const REPUTATION_DRIFT_PER_HOUR = 1.5;

/** Seasonal fit: featuring a dish the season craves (a warming dish in winter, a
 *  fresh one in summer) lifts the reputation target a little — emergent
 *  seasonality rewarding a menu that reads the weather. Points per fitting dish,
 *  and the cap on the total lift. */
export const SEASONAL_REP_PER_DISH = 4;
export const SEASONAL_REP_CAP = 12;

/** Cooked food a full room's worth of guests eats per game-hour. Served dishes
 *  are drawn from the kitchen's cooked-meal stock (competing with feeding the
 *  settlement); a dish that runs out drops off the menu. Placeholder. */
export const TAVERN_FOOD_PER_ROOM_PER_HOUR = 0.5;

export type TavernPricing = "generous" | "fair" | "steep";

/** Pricing is a bounded lever, never a free number: it trades occupancy for
 *  margin. `occDelta` shifts occupancy; `margin` multiplies gold per bed;
 *  `repDelta` nudges the reputation target (gouging travelers reads poorly). */
export const PRICING: Record<TavernPricing, { label: string; occDelta: number; margin: number; repDelta: number; blurb: string }> = {
  generous: { label: "Generous", occDelta: 0.1, margin: 0.7, repDelta: 0.1, blurb: "Cheap plates fill the room but earn little per head." },
  fair: { label: "Fair", occDelta: 0, margin: 1.0, repDelta: 0.05, blurb: "An honest price for an honest meal." },
  steep: { label: "Steep", occDelta: -0.12, margin: 1.5, repDelta: -0.05, blurb: "More coin per guest, but fewer stop in." },
};

const TIER_OCCUPANCY_BONUS: Record<SettlementTier, number> = {
  camp: 0, village: 0.05, town: 0.1, city: 0.15,
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Reputation raises the ceiling on occupancy: at 0 rep only half the beds ever
 *  fill; a renowned tavern (100) can fill them all. */
export function reputationCeiling(reputation: number): number {
  return 0.5 + (Math.max(0, Math.min(100, reputation)) / 100) * 0.5; // 0.5 .. 1.0
}

export interface TavernInputs {
  level: number;
  happiness: number;
  townHallLevel: number;
  menuVariety: number;
  servers: number;
  pricing: TavernPricing;
  reputation: number;
}

export interface TavernReadout {
  rooms: number;
  serversNeeded: number;
  staffingRatio: number;   // 0..1
  occupancy: number;       // 0..1, after ceiling + staffing
  occupiedRooms: number;
  goldPerDay: number;
  serviceQuality: number;  // 0..1, the target reputation eases toward
}

/** Single source of truth for tavern output. Used by the tick (gold + reputation
 *  drift) and the Tavern page (readout + controls). */
export function calcTavern(inp: TavernInputs): TavernReadout {
  const rooms = tavernRooms(inp.level);
  const need = serversNeeded(inp.level);
  const staffingRatio = need > 0 ? clamp01(inp.servers / need) : 0;
  const tier = getSettlementTier(inp.townHallLevel);
  const price = PRICING[inp.pricing] ?? PRICING.fair;

  // Demand before the reputation ceiling + staffing gate.
  const rawDemand =
    0.25 +
    (Math.max(0, Math.min(100, inp.happiness)) / 100) * 0.45 +
    Math.min(0.24, inp.menuVariety * 0.08) +
    (TIER_OCCUPANCY_BONUS[tier] ?? 0) +
    price.occDelta;

  const demand = clamp01(Math.min(rawDemand, reputationCeiling(inp.reputation)));
  const occupancy = demand * staffingRatio; // can't serve beds with no one to serve them
  const occupiedRooms = Math.round(rooms * occupancy);
  const goldPerDay = Math.round(rooms * occupancy * TAVERN_GOLD_PER_ROOM_PER_DAY * price.margin);

  // Word-of-mouth: full beds, a varied table, being staffed, and fair prices
  // build the tavern's name. An empty or unstaffed tavern lets it fade.
  const serviceQuality = clamp01(
    0.45 * occupancy +
    0.25 * Math.min(1, inp.menuVariety / MENU_STAPLE_IDS.length) +
    0.2 * staffingRatio +
    price.repDelta,
  );

  return { rooms, serversNeeded: need, staffingRatio, occupancy, occupiedRooms, goldPerDay, serviceQuality };
}
