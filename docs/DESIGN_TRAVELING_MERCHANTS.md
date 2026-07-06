# Design: Traveling Merchants

Status: **design locked (spine)** — July 2026. Not built. Evolves the existing
marketplace NPC-offer list into named, origin-tied visitors. Pairs with the
marketplace price rework (see DESIGN — marketplace rework / `project_marketplace_rework`).

## Core idea

The marketplace's faceless "buy/sell" offers become **named traveling merchants
who visit for a limited stay**, each carrying goods from their homeland. The
player starts with local (Hearthlands) traders and unlocks farther cultures as
the frontier stabilizes and word spreads. The settlement becomes a *waystation*
that draws more traffic as it grows.

## 1. A merchant is a person, not a row

Each visitor has a name, a face, a culture/homeland, a line of flavor, and a
small pool of offers. **Reuse the adventurers cut in the roster curation** (they
already have names + portraits) as the merchant cast — no new art needed. See
`project_roster_curation`.

## 2. Culture shelves (goods + purpose)

Each culture sells a recognizable set, so the player looks forward to a specific
caravan for a specific thing. Maps onto the rare-seeds-by-culture decision
(`project_garden_expansion`).

| Culture | Goods | Purpose / notes |
|---|---|---|
| **Local — Ashwick / Greyford / Hearthlands** | staples, tools | cheap, reliable, ~always someone around |
| **Meridian** | wine, grapes, fine cloth | river-valley traders; wine → HP-regen drink tier |
| **Khor'vani** | saffron, incense, **exotic scrolls, alchemy recipes** | luxury + knowledge |
| **Zah'kari** | melon, salt, **glass**, desert goods | see glass uses below |
| **Feldgrund (dwarves)** | **ale, honey ale, Greymantle** | see Greymantle below |

**Glass (Zah'kari)** — two purposes:
- **House upgrades** to Town/City tier need glass (windows for advanced housing) — a real building-material sink that gates late housing on trade.
- **Glass blade** — a consumable weapon: very high damage, but **destroyed after one mission**. A splurge item for a hard push.

**Greymantle (Feldgrund)** — the plant fetched from Feldgrund lands that heals
**ghost wounds**. Now has a true mechanical purpose: with the adventurer-recovery
system (wounds + status alterations persisting between missions, see
`project_adventurer_recovery`), Greymantle (as salve/potion) is the lever that
heals those properly — especially ghost/aether-type status ailments. Buying it
from Feldgrund dwarves is a natural early source. (Name tentative — "the plant
that heals ghost wounds"; confirm against lore.)

## 3. Progression — routes open as the frontier stabilizes

Fiction: the roads are dangerous and the settlement is unknown, so only nearby
folk risk the trip early. As **fame / settlement tier rises and the ward-line /
roads steady**, farther merchants dare the journey. First arrival of a new
culture is a small **event** ("word has reached the Meridian valleys..."). Same
spirit as recruit origin-tiers-by-guild-level, but for trade.

**Early-game flow (locked):**
- Few merchants at first.
- The **first merchant arrival fires a modal**, and likely **spawns the "build the
  Marketplace" quest** so the player can go see the offers.
- **Trade is instant**: you buy resources directly from the merchant who is
  physically here → you receive them immediately (no delivery timer). The
  merchant *being here* is the availability window.
- **Later (backend / multiplayer):** send *your own* merchants outbound to trade
  at NPC settlements or even other players' towns. See `project_player_guilds`.

## 4. Rotation + seasonal rhythm

A "who's passing through" board shows current visitors and how long they'll stay.
Distant merchants visit rarely and briefly. **Seasonal caravans**: the Meridian
wine trader after the autumn harvest, a Zah'kari melon caravan in high summer,
etc. Gives the market a rhythm and reasons to keep checking.

## 5. Rapport with recurring merchants (fixes the price problem)

Merchants are named and recurring, each with their own offer pool. **Trading
frequently with a merchant when they pass makes them visit more often and offer
better prices.** This is the *counter-lever* to the marketplace exponential-price
rework: rapport rewards loyalty instead of only punishing repeat trades. Ties to
the game's loyalty/relationship themes.

## 6. Merchants as a content + lore vehicle

Distant traders bring **news and rumors**, not just goods — cheap, high-flavor,
and exactly how an isolated frontier learns about the wider world. They can:
- Trigger **written chain quests** (e.g. a "bog witch" chain for the adventurers).
- Offer **escort missions** (ties to `project_npc_escort_engine`).
- Drop **rumors** that seed investigation → lore reveals → future content.

## Cross-links (tavern)

**A good Tavern makes merchants come more often** — the tavern is the settlement's
draw for travelers, unifying with the parked "tavern travelers → passive gold"
idea (`project_early_game_polish` J-adjacent / tavern notes). Merchants (what you
buy) + tavern travelers (passive income from who passes through) are one fiction:
traffic scales with how welcoming/prosperous the settlement is.

## Related
- `project_marketplace_rework` — exponential price scaling (rapport is its counter-lever)
- `project_roster_curation` — cut adventurers become the merchant cast
- `project_races_origins` — cultures/homelands
- `project_garden_expansion` — rare seeds by culture (grapes/Meridian, saffron/Khor'vani, melon/Zah'kari)
- `project_adventurer_recovery` — Greymantle heals wounds/status
- `project_npc_escort_engine` — merchant escort missions
- `project_player_guilds` — outbound player-to-player / NPC-settlement trade (backend)

## Marketplace: NPC vs player offers (decided July 2026)

- **Faceless random NPC offers: retired.** A freshly-built marketplace shows no
  random NPC board — the named traveling merchants (Cobb & co., who set up a
  stall on their visits) ARE the NPC trade now. (`showNpcOffers` flag off in
  `Marketplace.tsx`; flip it if we ever want an ambient board back.) A return
  visit now fires a toast so the player doesn't miss the stall.
- **Player (P2P) offers — tiering (idea, partly backend-blocked):** start narrow
  and widen as the settlement grows:
  - **Early:** only offers **directed at us / from friends** — a private,
    trusted trickle. NEEDS BACKEND: `fetchTradeOffers` has no recipient/friends
    scope today; add a "for-this-settlement" / friends filter.
  - **Village tier:** unlock the **full auction house** (all players' open
    offers). Same spirit as recruit origin-tiers and merchant-culture unlocks —
    the world opens to a settlement that has become a known waystation.
