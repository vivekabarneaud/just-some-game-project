# Weather → Yield (Layer 2 gameplay)

**Status:** DESIGNED, not built (brainstormed 2026-07-15). Sibling of `DESIGN_WEATHER.md` (Layer 1 = cosmetic ambient weather, BUILT). This doc is the gameplay layer: weather actually moves crop yields, drought kills plants, and a water system lets players push back.

---

## 1. Why not read yield off the ambient weather

The ambient weather (`data/weather.ts`) rolls **72 windows per season**. Aggregating ~216 window-rolls across a growing year converges every year to ~19% rain (measured sd **1.7%**) — the law of large numbers flattens it. So any yield modifier read off the ambient weather would be nearly identical year to year. **Confirmed dead end.**

The fix: a separate **per-year climate roll** — one roll per year, so it *can* vary — kept distinct from the cosmetic minute-to-minute sky.

## 2. Climate roll

One deterministic roll per year → a climate band:

| Band | ~Freq | Effect |
|---|---|---|
| Drought | 7% | Kills standing plants + strong yield − |
| Dry | 18% | Yield − |
| Normal | 50% | Full yield |
| Wet | 18% | Yield − |
| Deluge | 7% | Yield − − (waterlogging) |

**Bell curve:** moderate = best; too-dry *and* too-wet both hurt (waterlogging rots roots as surely as drought parches them).

**Guarded hash, not raw RNG.** Deterministic (reproducible, no save cost) so it's unpredictable *in play* but fair by construction. The naive `sin(n)` hash clusters on sequential integers (tested: 3 droughts in 4 years, no deluge in 24) — so the roll needs a **better mix + rules**:
- No drought within N years (~3) of another.
- Guarantee a deluge within some window so the wet extreme actually shows.
- Distribution stays close to the table above over a long run.
- We can still **force a year to drought** for a scripted story beat (override seam).

**GLOBAL climate + per-player first-year grace (LOCKED, built Phase 1a).** The climate is keyed to the **world/wall-clock year** (`getGlobalSeason().year`) — so every player at the same real time gets the same good/bad year. This is the shared basis the water storage/**trade** economy needs (a drought hits everyone at once → those who banked water sell to those who didn't). **No backend required:** like the ambient weather, it's a pure function of the clock from a fixed epoch, identical for all clients.

A settlement's own **first year (`state.year` 1) is graced** — no penalty, no drought-kill — so a newcomer who joins mid-drought still gets a fair start.

*(Two clocks by design: the world climate year advances on wall-clock time and is shared; the player's "Year N" is their settlement's age on their own — possibly sped-up — season clock. Your farm is subject to the world's weather regardless of how fast you play it, which is realistic.)*

## 3. Yield vs germination — separate levers

- **Germination** (already built for gardens): the deterministic *sow decision* — sow X seed, `floor(X × rate)` sprouts, capped at plot size. Over-sow to fill, or under-sow to conserve. Per-crop rates. This is the planning lever the player controls.
- **Weather climate**: the *yield modifier* on what grew, plus drought plant-kills. This is the year-to-year variety the player weathers.

Keeping them separate avoids stacking two noisy multipliers.

## 4. Drought = plant-kill (not just a dip)

Drought is the one band that **removes standing plants** (a % of a plot's grown crop, maybe some sown seed too), on top of the yield −. It's the event you must actively survive — which is what the water system is for.

## 5. Water system (the counters) — BUILT (Phase 2, 2026-07-15)

Implemented: `water` resource + 4 village buildings (Well, Cistern, Irrigation Channels, Drainage Ditches) in `data/water.ts`. Well output is drought-scaled; cistern stores + rain-catches (climate-scaled); irrigation spends per-crop water demand (fields 3/h, orchards 2/h, gardens by crop — lavender 0.5, squash/strawberry 2, default 1.5) to cancel the dry/drought penalty *while water lasts*; drainage cancels the wet/deluge penalty + banks runoff. Water shows in the top bar (once a well/cistern exists) with a live net rate; the Farming Weather card shows irrigated/drained vs the raw penalty. Deferred: per-plot control granularity (demand is per-crop but protection is settlement-wide), stored-water TRADE (Phase 3), and animals/kitchen water use.


A `water` resource, capped by storage, generated + spent through these:

| Structure | Role |
|---|---|
| **Well** | Generates water **passively** (trickle/hour) into a small built-in buffer. Not a fixed tank. **Drought sharply cuts its output** (aquifer drops) → you fall back on stored water. |
| **Cistern / reservoir** | **Storage** — raises the `water` cap. Fills from well overflow **and rainfall**, so wet years/deluges fill it fast. |
| **Rain collector / barrel** | Cheap early rain-catcher, feeds storage before the cistern is affordable. |
| **Irrigation** (channel / ditch, per-plot) | **Passively drains stored water** onto connected plots; while watered, the **drought yield penalty + plant-kill are offset**. Water is a consumable *spent* to fight drought. |
| **Drainage** (ditch / raised beds, per-plot) | Sheds excess water in a deluge → **reduces the wet penalty**. Optionally **captures runoff into the cistern** (a drained deluge protects the crop *and* banks water). |

**The loop:** wet years fill your cistern; drought cuts the well and you draw down (or irrigate) the reserve. Bank in the good years, spend in the bad.

**Open considerations (Phase 2, noted 2026-07-15):**
- **Show water use per plot** — fields/gardens/orchards display their water consumption, like the Eats/feed rows on pens.
- **No water use when it rains** — crops drink the rain; irrigation only draws stored water in dry conditions.
- **Other consumers** — animals need water too; maybe the kitchens. Water isn't just for crops.
- **One water item vs two?** — is rainwater potable? Option A: a single `water` resource (simplest). Option B: split **rainwater** (crops/livestock) vs **clean/well water** (drinking/kitchen) — more realism, more bookkeeping. Lean A unless drinking-water becomes a distinct need.
- **Top bar** — water storage + current amount gets its own category in the resource bar (like food/wood/stone).

## 6. Water economy (trade)

Stored water is a **holdable, tradeable resource**. A drought spikes demand → players who banked water in wet years profit selling it. Weather-driven trade with real value — the thing that was missing when the seed loop self-sustained. Ties into `DESIGN_TRAVELING_MERCHANTS.md` / player trade.

## 7. Locust / pest raid (related event)

A **cult-driven swarm** (grasshoppers/locusts) as a crop-**damage** event — *not* a wipe. Counters: scarecrows, smoke/herbs, or sending adventurers to drive them off. Sits beside the rats/plague layer (`DESIGN_WORKERS_PLAGUES.md`) as a crop-pest sibling, and gives the Cult a way to hit the settlement's food rather than just its walls.

## 8. Build phases (proposed)

1. **Climate roll + yield modifier** — the guarded hash, the bell-curve yield on gardens/fields/orchards, drought plant-kill, first-year grace. A weather/climate readout in the UI ("a dry year — yields down"). *No water yet: drought just hurts.*
2. **Water system** — well/cistern/rain-collector buildings, the `water` resource, irrigation (drought offset) + drainage (deluge offset).
3. **Water trade** — stored water as a tradeable good (with the market/merchant work).
4. **Locust/pest event** — the cult swarm + counters.

## Open questions
- Exact yield penalties per band (tune with fresh-player signal, per `DESIGN_BALANCE_PASS.md` — don't tune off dev self-play).
- Whether drought plant-kill hits gardens, fields, *and* orchards, or spares perennials (trees are a multi-year investment — maybe drought only stresses/reduces orchards rather than killing trees).
- Does the climate band apply per-season or per-year? (Per-year headline is simpler; per-season gives more texture.)
