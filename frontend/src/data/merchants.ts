// ─── Traveling Merchants ─────────────────────────────────────────
// Named, origin-tied visitors who pass through and trade on the spot — the
// first slice of the traveling-merchant arc (docs/DESIGN_TRAVELING_MERCHANTS.md).
// A visitor is a person: a name, a culture, a line of flavour, and a small pool
// of offers. Trade is INSTANT while they are here — the visit itself is the
// window, so no marketplace is required (that is the hook: build one and finer
// caravans will come). Slice 1 is a single first visitor; rotation, rapport,
// culture shelves and recurrence come later.

export interface MerchantOffer {
  id: string;
  /** Short flavour label for the row, e.g. "Road provisions". */
  label: string;
  give: string;        // resource the player pays
  giveAmount: number;
  receive: string;     // resource the player receives
  receiveAmount: number;
}

export interface TravelingMerchant {
  id: string;
  name: string;
  culture: string;     // "Dominion road-trader"
  icon: string;        // emoji header until a portrait is wired
  portrait?: string;   // optional R2 portrait URL (falls back to `icon`)
  /** Scene text (the Lord's voice) — the left panel of the FIRST passing visit.
   *  Omit for merchants who have no first-visit modal (they go straight to a
   *  recurring stall, e.g. unlocked by a mission). */
  narrative?: string;
  /** Why he will not stay, and what would bring him back — first-visit modal. */
  parting?: string;
  /** Wares for the first passing visit (modal). Omit if no first visit. */
  offers?: MerchantOffer[];
  /** The wares shown at the marketplace on RETURN visits (the recurring stall). */
  returnOffers?: MerchantOffer[];
  /** Short line for the marketplace stall on a return visit. */
  stallGreeting?: string;
  /** The first (passing-through) visit fires once this th_level is reached.
   *  Omit for merchants with no first-visit beat. */
  requires?: { thLevel?: number };
  /** Recurring marketplace visits begin once this unique mission is completed.
   *  Omit for merchants that don't recur (first-visit only). */
  returnUnlock?: { missionDone: string };
}

export const TRAVELING_MERCHANTS: TravelingMerchant[] = [
  {
    id: "dominion_peddler_first",
    name: "Cobb",
    culture: "Dominion road-trader",
    icon: "🧳",
    portrait: "https://pub-63efdde7a8414a0393a736c5add726cc.r2.dev/images/merchants/cobb_zoomed.png",
    narrative:
      "A trader came up the south road: a short, well-fed Dominion man with a comfortable belly, two mules, and more opinions than cargo, and he walked our camp like a man pricing it. He had been this way before, he said, back when there was nothing here worth stopping for.",
    parting:
      "\"You have grown enough to be worth a second visit,\" he said. \"Build a proper market and I will bring the next one a wagon, not a mule. No one unloads in the mud, and a roof a traveller could sleep under would not go amiss either.\" He will not stay the night, but he will trade what fits on a mule before he goes.",
    offers: [
      { id: "provisions", label: "Road provisions", give: "gold", giveAmount: 25, receive: "food", receiveAmount: 40 },
      { id: "buy_timber", label: "He'll take surplus timber off your hands", give: "wood", giveAmount: 50, receive: "gold", receiveAmount: 30 },
      { id: "buy_stone", label: "He'll buy cut stone for coin", give: "stone", giveAmount: 50, receive: "gold", receiveAmount: 30 },
    ],
    stallGreeting:
      "Cobb is back, and true to his word he came with a wagon this time, not a mule. His stall stands in the market until morning.",
    returnOffers: [
      { id: "provisions_big", label: "Provisions by the wagonload", give: "gold", giveAmount: 40, receive: "food", receiveAmount: 80 },
      { id: "buy_timber_big", label: "He buys timber by the cartload", give: "wood", giveAmount: 60, receive: "gold", receiveAmount: 45 },
      { id: "buy_stone_big", label: "He buys cut stone", give: "stone", giveAmount: 60, receive: "gold", receiveAmount: 45 },
      { id: "buy_grain", label: "He'll take surplus grain for the road", give: "food", giveAmount: 40, receive: "gold", receiveAmount: 25 },
    ],
    // First pass comes once the settlement reaches Village tier (Town Hall 3) —
    // grown into a real village, "worth the wagon", not just a settled camp.
    requires: { thLevel: 3 },
    // His recurring stall begins once you've escorted his first real caravan in.
    returnUnlock: { missionDone: "merchant_escort_first" },
  },
  {
    // Greyford's grain-carter. No first-passing-visit: the Road to Greyford
    // (caravan_guard) IS the introduction, and completing it opens a regular
    // downriver grain run that fills the gap between Cobb's visits. Grain to
    // spare, wants our stone (per the mission fiction).
    id: "greyford_grain_carter",
    name: "Maren",
    culture: "Greyford grain-carter",
    icon: "🌾",
    stallGreeting:
      "Maren has brought the Greyford wagon up the river road, its bed heavy with grain. Neighbours now, not strangers, and her prices say so.",
    returnOffers: [
      { id: "grain_sacks", label: "Sacks of Greyford grain", give: "gold", giveAmount: 20, receive: "food", receiveAmount: 55 },
      { id: "grain_for_stone", label: "Grain traded for our cut stone", give: "stone", giveAmount: 30, receive: "food", receiveAmount: 65 },
      { id: "greyford_buys_stone", label: "She'll take stone back for Greyford's walls", give: "stone", giveAmount: 40, receive: "gold", receiveAmount: 35 },
    ],
    returnUnlock: { missionDone: "caravan_guard" },
  },
];

// ─── Recurrence (return visits) ─────────────────────────────────
// Once the player has BOTH a marketplace and a tavern, Cobb starts coming back
// and sets up a stall that lingers until the next morning (the daily 3AM-UTC
// boundary — the same clock the mission board refreshes on). He returns every
// 2-3 real days; a better tavern (reputation) brings him sooner.
export const MERCHANT_BASE_INTERVAL_DAYS = 3;   // days between visits at low reputation
export const MERCHANT_REP_SPEEDUP_DAYS = 1;     // down to 2 days at full reputation

/** Days between return visits, shortened by tavern reputation. */
export function merchantIntervalDays(reputation: number): number {
  return MERCHANT_BASE_INTERVAL_DAYS - (Math.max(0, Math.min(100, reputation)) / 100) * MERCHANT_REP_SPEEDUP_DAYS;
}

export function getMerchant(id: string): TravelingMerchant | undefined {
  return TRAVELING_MERCHANTS.find((m) => m.id === id);
}
