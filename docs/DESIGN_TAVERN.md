# Design: The Tavern

Status: **design locked (spine)** — July 2026. Partially built (passive
ale→happiness). This doc adds the *hospitality* layer: rooms/travelers, a menu,
and cozy conversations. Pairs with `DESIGN_TRAVELING_MERCHANTS.md` and
`project_tavern_conversations`.

## Where it stands today

The Tavern building exists (village tier; level caps village 3 / town 7 / city
10). It **consumes ale** per level (`ALE_CONSUMED_PER_TAVERN_LEVEL`) and **boosts
happiness** (`TAVERN_HAPPINESS_PER_LEVEL`; a "dry" tavern with no ale gives the
reduced `TAVERN_HAPPINESS_DRY`). It is the sink end of the Brewery→Tavern ale
chain. It has **no page and no interaction** — purely passive.

## The idea

The tavern becomes the settlement's **hospitality engine**. It houses travelers
(passive gold + draws merchants), serves a **menu** (happiness + occupancy +
cozy-chat dishes), and hosts **conversations** (character supports). The through
-line: **traffic scales with prosperity** — a welcoming, well-fed, happy
settlement draws more of the world to its door. This pays off the traveling
-merchant hook directly (Cobb: *"a roof a traveller could sleep under would not
go amiss"*).

## 1. Rooms for travelers → passive income + more traffic

Settlement growth is **exponential** (endgame is ~1000 citizens), so rooms scale
exponentially, not linearly.

**First four tavern levels (locked):**

| Tavern level | Rooms |
|---|---|
| 1 | 1 |
| 2 | 2 |
| 3 | 4 |
| 4 | 8 |

Doubling each level. Beyond L4 keeps roughly doubling, tuned to the population
curve once that curve is locked (village caps the tavern at L3 = 4 rooms; town
and city unlock the higher levels).

- Travelers passing through **rent beds → steady passive gold** (~5 gold per
  occupied room per day, placeholder). Empty rooms earn nothing.
- **Merchant tie-in:** a tavern with beds makes traveling merchants **visit more
  often and linger** — the "roof to sleep under" is literally the mechanic.
  Rooms are the settlement's draw. Merchants (what you buy) and tavern travelers
  (passive income from who passes through) are one fiction.

## 2. The menu

- **Baseline (now):** the kitchen's staple cooked meals — **porridge, hearth
  stew, river stew** — plus ale are served by default.
- **Later (phase 2):** the player picks a few extra dishes to *feature* from the
  **adventurer / culture dish roster** (saffron fish stew, harvest ale stew,
  etc.). Menu "slots" scale with tavern level — a bigger house sets a richer,
  more varied table.
- **Effect:** menu **variety** → escalating **happiness + occupancy** bonuses (a
  good table cheers citizens and draws travelers), capped by tavern level.
- The menu is also the **dish list for tavern conversations** (§4) — you pick a
  dish when inviting someone, and their food preference feeds loyalty.
- **Does serving dishes drain cooked-food stock?** REVISED (July 2026): **yes.**
  Serving a dish consumes it from the kitchen's cooked-meal stock over time
  (scaled by occupancy — a full house eats more), and a dish that's **out of
  stock can't be featured** (greyed on the menu). This makes the menu a real
  choice (feed travelers vs feed the settlement) and ties the tavern to the
  kitchen loop. BUILT July 2026: serving draws down the featured dishes' cooked
  stock each tick, scaled by rooms × occupancy (a busy tavern eats more, split
  across served dishes); an out-of-stock dish drops off the menu and stops
  counting toward variety (so occupancy dips until you cook more). Rate is
  placeholder (`TAVERN_FOOD_PER_ROOM_PER_HOUR`). Discrete guests still deferred.

## 3. Occupancy — traffic from prosperity

`occupancy% = f(happiness, menu variety, settlement tier / fame)` — placeholder
weights, tuned with real numbers. A dreary, dry, one-dish tavern in an unhappy
camp sits half-empty; a lively one with a good table in a thriving town runs
full. This is the lever that makes the tavern **reward overall settlement
health**, not just its own level.

## 4. Staffing — who serves

The tavern needs hands to run. **Adults are already a shared pool:** the garrison
pulls its soldiers/archers from `citizens.adults` (see `defenses.ts` —
`availableDefenders = adults − soldiers − archers − named adults`). Tavern
servers draw from the **same pool**, so assigning adults to the tavern reduces
the adults available for the watchtower/garrison, and vice-versa — a real labor
tradeoff, as intended.

- Servers needed scales with the tavern (rooms / level); understaffed → capped
  occupancy (you can't fill beds you can't serve).
- **Consistency with the worker system** (`DESIGN_WORKERS_PLAGUES`): that spec's
  stance is "no manual per-building assignment — auto-distribute." Resolve by
  making the **tavern and the garrison the two *named* exceptions** the player
  assigns deliberately, while background production (mills, quarries) auto
  -distributes. Keep it a simple counter ("3 of 4 served"), not micromanagement.

## 5. Pricing — a lever, not a free number

Do **not** let the player type an arbitrary price per meal (a million-gold
porridge that NPCs happily buy breaks both the fiction and the economy). Pricing
is a **bounded strategy lever**: a cheap↔premium setting (e.g. 0.5×–2×, or three
tiers *generous / fair / steep*) that **trades occupancy for margin** — cheap
fills beds but earns little per head; steep earns more per head but thins the
crowd. Same satisfying tweak, no exploit, and it folds straight into the
occupancy model (§3) as another input. Relates to `project_marketplace_rework`.

## 6. Reputation — the tavern's own bar

A **Tavern Reputation** stat (0–100, like happiness/loyalty), the tavern's own
slow progression, separate from building level. It rises from sustained good
hospitality (high occupancy, varied menu, fair prices, well-staffed) and decays
if the place is dry, empty, or neglected. Reputation is what makes the
settlement a **known waystation**: it raises the occupancy ceiling, pulls
merchants more often and from farther cultures, and unlocks named recurring
guests / rumors later. The counterpart to merchant rapport
(`DESIGN_TRAVELING_MERCHANTS` §5) and the mechanical spine of "traffic scales
with prosperity."

## 7. Conversations (cozy supports)

The designed cozy feature (see `project_tavern_conversations`): invite a named
adventurer, pick a dish, unlock a **one-time bespoke chat + one-time loyalty
bump**. A lore channel the Lord's journal can't reach (a Nordveld archer on
ice-funerals, a Khazdurim warrior on the Seals). Lives at the Tavern (+ the
character sheet); small gold cost paid to the tavern. Ship one chat per ~5
strongest-backstory premades first; premade cast only.

## Phasing — what to build first

1. **Tavern page (UI prototype, placeholder numbers):** rooms + live occupancy
   readout, staple-menu toggle, the passive-gold trickle, and the merchant
   -frequency hook. Build the shell before tuning the content (UI-first).
2. **Menu slots** — feature a few adventurer/culture dishes; variety bonuses.
3. **Conversations** — the cozy supports (already spec'd).

## Open decisions

- Exact **occupancy formula** weights (happiness vs menu vs tier vs pricing).
- **Room counts beyond L4** — tie to the population curve once it's locked.
- **Passive gold rate** per occupied room.
- **Staffing:** servers-needed per level; how the shared adult pool is displayed
  and split against garrison recruitment; whether understaffing caps occupancy
  or just reduces gold.
- **Pricing lever:** slider vs 3 tiers; exact occupancy↔margin curve.
- **Reputation:** growth/decay rates, and exactly what it gates (occupancy
  ceiling, merchant frequency/reach, named guests).
- **Travelers: abstract or faces?** Start abstract (gold + occupancy readout);
  named passers-through come later.
- Menu **food-drain** — REVISED to ON (serving consumes cooked-meal stock; out-of-stock dishes can't be featured). See §2 + the tavern-economy pass; rate/model still open.
- **Rooms as adventurer rest?** A bed could aid between-mission recovery (ties
  to `project_adventurer_recovery`). Open, not locked.

## Cross-links

- `DESIGN_TRAVELING_MERCHANTS.md` — a good tavern makes merchants come more often; unified "traffic scales with prosperity" fiction.
- `project_tavern_conversations` — the cozy character supports.
- `project_marketplace_rework` — economy / rapport as a price counter-lever.
- `project_adventurer_recovery` — possible room-rest tie-in.
- `DESIGN_WORKERS_PLAGUES` — the worker-staffing system the tavern/garrison assignment is the named exception to.

## Tavern-economy pass (pending, July 2026)

Playtest raised two coupled questions about how occupancy reads and behaves:

- **Occupancy is currently an abstract average fill (0-1)** computed instantly
  from happiness + menu + tier + pricing, capped by the reputation ceiling and
  scaled by staffing. It drives passive gold continuously. There is **no
  temporal "a guest arrives and stays"** model, so it jumps the moment you
  assign a server, and at 1 room a "50% occupancy" with a rounded "1 bed filled"
  reads as contradictory.
- **Two ways to resolve it:**
  1. **Keep the average model, fix the presentation** — show occupancy as an
     "average fill / how busy" rate + the gold/day it yields; drop the misleading
     discrete "beds filled" integer at low room counts.
  2. **Discrete guests** — travelers actually arrive and depart over time (a bed
     is occupied or not; gold per guest-night). More immersive, answers "how long
     until a guest," but a bigger sim change (arrival cadence, guest lifetime).
- **Meals consume stock** (see §2 revision): serving draws down cooked-meal
  stock scaled by how busy the tavern is; out-of-stock dishes can't be featured.

These interlock (guests eat what's served), so build them as one pass once the
model (average-with-better-UI vs discrete guests) is chosen.

---

## Tavern v2 — brainstorm (July 2026, from playtest)

A batch of UX + mechanic ideas. Grouped by how deep they cut. NOT locked; a phased plan.

**Phase 1 — display / UX (shallow, no model change):**
- **Consolidate the "Rooms & travelers" stats.** The 4 boxes (Rooms / Occupancy% / Beds filled / Gold-per-day) are noisy. Collapse toward one clear line, e.g. **"1 / 1 beds filled"** (+ keep gold/day). NOTE: occupancy is currently the *abstract average-fill* model, so "beds filled" = round(occupancy × rooms); a truly discrete "N/M beds" wants the discrete-guests model (Phase 3).
- **Menu in two columns: Dishes | Drinks.** Drinks column shows **"Build a brewery first"** when there's no brewery; otherwise ale/drinks.
- **Menu management:** replace the per-row "On the menu / Serve" toggle with a **remove (🗑) affordance** (row stays, disabled) + an **"＋ Add a dish"** row that opens a modal to pick several dishes at once, capped by a **tavern-level limit**. Same pattern for drinks.

**Phase 2 — auto-cook + ingredient-based availability (mechanic change):**
- Today the player manually cooks dishes at the kitchen to build stock, and the tavern serves from that cooked stock. Proposal: **auto-cook** — the kitchen continuously turns raw ingredients into its dishes, and the tavern menu offers a dish **if its ingredients are in stock** (not if a cooked unit sits in inventory). Serving consumes ingredients.
- CAVEAT: cooked meals (porridge/stew/…) are *real food types in the larder* (citizens eat them) and feed the crop→recipe→loyalty gifting loop (Edda). So auto-cook automates the existing kitchen loop; it must not break cooked meals as citizen food / gifts. Ties to `[[project_worker_assignment]]` (Lord cooks by default; assigned staff buff, e.g. Elspeth → bonus potions).

**Phase 3 — the guest list (new system, biggest):**
- Show **who is here right now**: named + typed guests, e.g. *"Cobb · 2 travelers · 1 homeless citizen."* Requires **discrete guest modelling**, which the original design deferred (abstract occupancy). Lovely flavor payoff; the most infra. Merchants-in-residence (Cobb) tie to the traveling-merchant system.

**Recommended order:** Phase 1 (fast, visible), then Phase 2 (the satisfying idle loop), then Phase 3 (flavor). Each is a self-contained pass.
