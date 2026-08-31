# Workers & Plagues — Design Spec

**Status (2026-08-14 audit):** PARTIAL — staffing SHIPPED but as a different model than §1 (named-hands coverage per building: `getBuildingStaffing`/`BUILDING_STAFF`/`workEffectiveness` + BuildingStaffSection — not a global auto-distributed pool), and the illness/ailments rework SHIPPED (`shared/src/data/ailments.ts`). §2 plague events NOT built. The cat/vermin half is superseded by DESIGN_KEPT_ANIMALS.

## 1. Worker System

### Concept
Each production building requires a fixed number of **workers** (citizens) to operate. If the settlement's population drops below the total workers needed, buildings lose efficiency proportionally. This creates a meaningful connection between population management and production.

### How It Works

**Worker assignment:**
- Each building has a `workersRequired` field per level (e.g., Lumber Mill Lv.1 = 2 workers, Lv.5 = 6 workers)
- Total workers needed = sum of all buildings' worker requirements
- Available workers = population minus a minimum reserve (citizens who don't work: children, elderly, etc.)
- If available workers < total needed, all production buildings operate at reduced efficiency: `efficiency = availableWorkers / totalWorkersNeeded`

**Display:**
- Each building card shows "Workers: 3/3" (green) or "Workers: 2/3" (orange, understaffed)
- Overview page shows total worker allocation and any shortage
- Sidebar notification when understaffed: "Not enough workers! Production reduced."

**Design notes:**
- Workers are NOT manually assigned (too micromanage-y for this game). They auto-distribute evenly.
- Alternatively: priority system where the player can drag buildings into a priority order, and workers fill from top to bottom. This gives control without per-building micromanagement.
- A future "Foreman" building or upgrade could increase efficiency per worker (same workers, more output).

### Worker Counts by Building (suggested)

| Building | Workers per Level | Notes |
|----------|------------------|-------|
| Lumber Mill | 2 | Physical labor |
| Quarry | 3 | Heavy labor |
| Iron Mine | 3 | Dangerous work |
| Farm (per field) | 1 | Seasonal |
| Garden (per garden) | 1 | Light work |
| Pen (per pen) | 1 | Animal care |
| Hive (per hive) | 0 | Bees work for free |
| Orchard (per orchard) | 1 | Seasonal care |
| Hunting Camp | 2 | Skilled hunters |
| Fishing Hut | 2 | |
| Forager's Hut | 1 | |
| Blacksmith | 2 | Skilled craft |
| Tailoring | 1 | |
| Leatherworking | 1 | |
| Woodworker | 1 | |
| Jewelcrafter | 1 | Skilled precision |
| Alchemy Lab | 1 | |
| Brewery | 1 | |
| Kitchen | 2 | Cooking for adventurers |
| Mage Tower | 1 | Scholarly |

**Interaction with happiness:** Happy citizens work harder (existing happiness production modifier). Unhappy citizens might "refuse to work" if happiness drops very low — effectively reducing available workers even if population is sufficient.

---

## 2. Plague System

### Concept
Periodic plague events that reduce population and/or make workers sick, reducing production. Preventable through preparation (cats, cleanliness, medicine) and curable through alchemy/magic.

### Plague Types

| Plague | Severity | Effect | Prevention | Cure |
|--------|----------|--------|------------|------|
| **Rat Fever** | Mild | 5-10% workers sick for 1 season | Cat Shelter building (cats kill rats) | Healing Potion at Alchemy Lab |
| **Wastes Chill** | Moderate | 10-20% workers sick, 1-3 citizen deaths | Apothecary building, warm clothing | Mage Tower Lv.3+ cleansing spell |
| **The Grey Plague** | Severe | 20-30% workers sick, 3-8 citizen deaths, lasts 2 seasons | Apothecary Lv.3+, clean water (well upgrade) | Rare cure potion (moonpetal + nettle + nightbloom) |
| **Hollow Sickness** | Rare/Story | Workers go mad near the Wastes boundary, wander off | Ward-stones maintained (Thornveil quest) | Story mission resolution |

### Plague Mechanics

**Trigger:**
- Random chance per season, modified by:
  - Population density (more people = higher chance)
  - Cleanliness (Apothecary/Cat Shelter reduce chance)
  - Season (winter = higher chance for Wastes Chill)
  - Proximity to Wastes (story progression increases risk)

**"Sick" workers:**
- Sick workers don't count toward available workforce
- They still consume food
- They recover automatically after the plague duration, OR faster with medicine
- Some plagues have a death chance per sick worker per season tick

**Prevention buildings:**
- **Cat Shelter** — new building. Cats reduce rat population, preventing Rat Fever. Also: adorable. Cats visible on the overview page.
- **Apothecary** — new building (or upgrade to Alchemy Lab). Produces medicine passively, reduces plague severity and duration.
- **Well upgrade** — existing well/water source, higher level = cleaner water = lower plague chance.

**Player agency:**
- Plagues are NOT random disasters that punish the player. They're **manageable risks** that reward preparation.
- A player who builds the Cat Shelter and Apothecary early barely notices plagues.
- A player who ignores them will face real production crises.
- Cure potions give an active response: "My people are sick — I need to craft medicine NOW."

### Cat Shelter Building

| Property | Value |
|----------|-------|
| Name | Cat Shelter |
| Category | Settlement |
| Unlock | Village tier |
| Max Level | 5 |
| Effect | Reduces vermin (see below): protects stored food AND prevents Rat Fever (Lv.3+). +small happiness per level (people love the cats). |
| Description | "A warm corner of the settlement where cats gather, breed, and earn their keep. Every rat they catch is a fever prevented — and a sack of grain saved." |
| Cosmetic | Named cats wander the overview. More cats at higher levels. |

### Vermin — the dual threat (developed 2026-06-22, the cat-shelter's real job)
The Cat Shelter's *everyday* purpose, not just plague-prevention:
- **Vermin pressure** rises with food stored (rats follow the feast), settlement size, and **season** (winter drives them indoors → into the pantry).
- High vermin does TWO things: (1) **slowly drains stored food** from the pantry/warehouse (a persistent, *felt* loss), and (2) feeds the **Rat Fever** plague chance.
- **Cats counter both**, and **need no upkeep — they eat the rats.** The thing they prevent feeds them (self-sustaining; tells the whole story in one line). Higher shelter level → vermin near zero → food safe + plague rare.

### Charm layer (the heart of the idea)
- **+Happiness** — joy, not just utility.
- **Named, adoptable cats** with little personalities, wandering the overview (handcraft ethos, like the cast).
- **Adoption → the pet system.** Shelter cats can be adopted as **companions** — this is where Nettle's cat and adventurers' pet-cats come from. Links building ↔ pets ↔ cast into one loop (adopt a stray → it becomes a hero's familiar). See the retired roster-curation doc (in git — superseded by per-character introduction) (signature companions).

### Scoping note
The **food-theft half needs only the existing pantry/food system** — no plague system required. So the Cat Shelter can ship EARLY (cozy "protect food / adopt cats / +happiness" building), with the plague-prevention layer added when the rest of this doc lands. Alpha-friendly, not post-alpha-locked.

### How the shelter PLAYS (explored 2026-06-22)
Tempting idea: a mini-Adventurers-Guild — recruit cats, level them, send them on cat-missions. **Rejected as the literal version** because it (a) competes with / dilutes the real Adventurers Guild, (b) doubles balance+content work, (c) ironically re-creates the "many interchangeable units" problem the roster curation is removing, and (d) sending cats into danger fights the cozy *shelter* (safe-haven) tone. But the FUN is salvageable — keep it, just post cats at home instead of sending them away:
- **Cat roster** at the shelter: named cats, personalities, the collection itch. ✓
- **Assign cats to POSTS** (pantry / granary / barn / docks): a cat on the pantry protects the pantry → the vermin mechanic becomes *spatial & assignable* (the "deploy units" satisfaction, cats safe at home).
- **Seniority/levels via tenure** — kitten = poor mouser, years on the job = grizzled ratter. No micromanage.
- **"Cats on missions" done right = companion adoption:** assign a cat as an *adventurer's* companion and it rides along on real missions, bonded & meaningful (this is where Nettle's cat / pet-cats come from). Honors the instinct without a parallel guild.
- **The comedy survives as FLAVOR, not a system:** cats go on their own "expeditions" and deposit trophies in the event log — a dead mouse, a shiny button, one (1) sock, a smug expression. The joke of cats-adventuring, zero mechanics cost.

### Adoption, naming & care (explored 2026-06-22)
- **Strays arrive UNNAMED, with a portrait + an evocative descriptor** ("a wary one-eyed ginger who won't come close yet"). **Naming = the adoption** — the moment a stray becomes the player's. (Mirrors Sable: "no name worth keeping" → you give one. Naming-as-care is a game-wide motif; the shelter is its purest form.) A few rare cats may arrive pre-named with a story (a famous local mouser).
- **Happiness & leaving = ONE mechanic, via the naming motif:** a cat you've named/fed/toy'd is *yours* and stays; a nameless, untended stray quietly **drifts away** ("the grey tom you never named was gone by morning"). So happiness isn't a separate babysit-bar — it's *whether you actually welcomed the cat*. Naming + care = keeping.
- **Cross-building ties (cheap, charming, give existing buildings new purpose):**
  - **Woodworker → cat toys** (carved mouse, feather-stick) = enrichment/contentment.
  - **Kitchen → cat treats** (dried fish, cream) = the food half.
  - Together the shelter pulls on Woodworker + Kitchen + settlement happiness → the interconnected, lived-in feel (Manor Lords depth).
- **Design principle (load-bearing):** the shelter must **reward care with warmth, never punish neglect with stress.** Tended cats → +happiness + good mousing; neglected ones just gently drift away (a small sadness, never a crisis). It's the cozy corner you visit to feel good, NOT another anxiety meter. (Same ethos as the plague system: manageable joy, not random punishment.)
- **The loop:** stray appears → name it (adopt) → feed it (Kitchen) + toy (Woodworker) + post it (pantry/granary/barn) → content, stays, mouses, settlement happier. Tend nothing → strays move on.

### Where the cats come from (worldbuilding → pacing mechanic, 2026-06-22)
A new frontier settlement wouldn't *have* cats — so don't start with them. **Cats are camp-followers of people + grain:** ~none early (maybe one that trailed the founders' wagons), then strays **drift in as you store food and grow** (food → rats → cats follow). Some are **feral descendants of the old watch's barn cats** (Hale's garrison had people 150y ago) — ties to existing lore. Payoff: the shelter *fills up as the settlement becomes worth coming to* — a stray arriving is a quiet signal you've built something that draws life. The consistency question becomes the pacing. (Generalizes: a thriving frontier outpost is a magnet for people/traders/animals, not a museum.)

### Dog training — the Hunting Camp kennel (parallel building, 2026-06-22)
Hunting dogs are even more natural (hunters bring hounds; no origin question). Creates a deliberate SYMMETRY with the Cat Shelter:
- **Cat Shelter** = cozy, *cared for* (naming-as-care, can drift away), vermin/food/plague/happiness, source of **cat** companions (Nettle's cat).
- **Hunting Camp kennel** = working, *trained* (loyal working animals), boosts hunting yields (more game with hounds; could guard/scout), source of **dog** companions — **this is where Isla's lurcher comes from.**
- Mirrors the Isla-dog (trained/functional) vs Nettle-cat (loved/emotional) distinction AT THE BUILDING LEVEL: cats are loved, dogs are trained.
- **Scope guard:** keep the kennel UTILITARIAN — no full cozy-happiness sub-loop like the shelter (dogs are working animals; the contrast is the point, and it avoids two copies of the same system). See the retired roster-curation doc (in git — superseded by per-character introduction) (signature companions).

### Cat Shelter introduction — chronicle-driven unlock (2026-06-22)
The feature is introduced through the story, not a build-menu button (consistent with the game's chronicle-leads-mechanic approach). Three beats, all in the Lord's voice (em-dash-free):
1. **The first cat (charm/hook).** A stray arrives with a newcomer's wagon, nowhere to go; the soft-hearted Lord takes it in. **He names it himself — NOT the player's choice.** This teaches the naming-as-care motif by example + humanizes the Lord. No mechanic yet. (Best version: he doesn't *decide* to name it; he just starts calling it something and realizes it stuck — same tender logic as Sable's frog.)
2. **The problem (need).** Food starts disappearing; rat droppings by the pantry, gnawed grain sacks. **This is the diegetic ON-SWITCH for the food-theft mechanic** — the chronicle narrates the loss as it begins, so the player never gets unexplained food drain. His one cat keeps its corner clear, but it's one cat.
3. **More cats → unlock.** Strays keep drifting in (food → rats → cats). The Lord writes something wry/fond ("I have to do something about all these cats") → **unlocks the Cat Shelter**. Control of naming + assigning passes to the player.
Arc shape: **charm → problem → solution**, all earned.

Flavor details to keep:
- **Tomas's un-neutered cat** = the in-world reason cats multiply. A recurring gag, NOT a breeding sim ("Edda says half the strays have Tomas's cat's eyes. Tomas says nothing. The cat says nothing.").
- **The Lord's first cat: HIS LORDSHIP** (locked 2026-06-22). The gag is role-reversal — the Lord of the settlement keeps a fat stray he mock-defers to. Chronicle comedy writes itself: *"His Lordship has taken the warm chair by the fire. I am, it seems, a guest in my own house."* / *"Edda asked who the real lord is around here. I did not dignify it. Neither did His Lordship."*

### Cat name bank (for shelter strays — "descriptor → funny feature-name")
The comedy engine = mock-grandeur on a scruffy stray; each stray arrives with a one-line look, the name riffs on the feature. Pool to draw from:
- **One eye:** The Captain · Admiral Squint · Old Winker · Patch
- **Bent/hooked tail:** Comma (a schoolmaster can't not name it after punctuation) · Query (question-mark tail) · Fishhook · Sir Crook
- **Fat/dignified:** His Lordship (TAKEN by the Lord's cat) · The Magistrate · Alderman Whiskers
- **Scruffy/deadpan-plain:** Tuesday (found on a Tuesday, that's the whole reason) · Footnote (always underfoot) · Ledger · Vagrant
- **Mock-title register:** Mister Whiskersworth Esq. · Sergeant Mittens · Lord Pemberton the Third
(Naming-as-care still applies: player christens most strays; this bank is suggestions/auto-fill fodder.)

### Cat motif
Cats are a through-line now: Nettle's cat, Tomas's cat (founder), the `cat_parent` trait, this shelter. A motif, not clutter — lean into it. Naming strays ties to the same naming-as-care thread as Sable.

### Event Log Integration
- "A plague of Rat Fever has struck! 8 workers are sick."
- "Your cats caught the rats before they spread disease. Plague averted!"
- "The Grey Plague is spreading. Craft a cure at the Alchemy Lab or it will worsen."
- "Your Apothecary distributed medicine. The plague is subsiding."

---

## Implementation Order

1. **Worker system first** — it's simpler and creates the foundation for plagues
2. **Plague system** — builds on workers, adds Cat Shelter and Apothecary
3. **Cat Shelter** — new building, cosmetic cats on overview
4. **Cure recipes** — new Alchemy Lab recipes for plague cures

---

## Worker-assignment UX + named-staff buffs (design, July 2026)

Fleshes out the staffing UX on top of the worker system above. Two flavors of staffing, kept distinct:

**1. Quantity (raw boost).** Assigning ordinary citizens to a building increases/accelerates its output (e.g. workers at the Woodcutting Shop speed up crafts). Assign/unassign buttons per building. Unassign must work everywhere — **including the Tavern**, which today auto-staffs from the shared adult pool (no manual control yet).

**2. Named-staff buff.** A specific cast member assigned to a building grants a *qualitative* bonus **while they're home** (ties to loyalty / while-home state, and to the tavern-conversation web). Example: **Elspeth at the Alchemy Lab → bonus potions** while home. This is the more interesting layer; the founder pre-assignments below are really this kind.

**Founders pre-assigned to "their" buildings** (portraits shown, locked — cannot be unassigned; seeing the cast at work is the point):

| Building | Founder(s) |
| --- | --- |
| Forager's Hut | Edda + Nell |
| Hunting Camp | Nessa + Gareth |
| Fishing Hut | Godric + the kid *(Godric fishes at first — crews the early hut without spending a scarce citizen)* |
| Lumber Mill → Woodcutting Shop | Jory *(follow him to the shop when he moves; he can work alone)* |
| Quarry | Tomas |
| Kitchens / Alchemy Lab | none by default — **the Lord cooks and brews a little himself**; assigned staff then give a buff (see Elspeth above) |

**Scope guard (load-bearing):** early food must NOT be gated behind staffing. Early game there are no spare citizens and food is the growth bottleneck (it's what unlocks the Fishing Hut → population). So the shape is: founders pre-assigned + *optional* extra workers as an accelerator, never a requirement. Ship on 2-3 buildings first; don't wire the whole map at once. See memory `project_worker_assignment`.

---

## Illness & injury — the character-driven rework (2026-07-31)

> **§2's abstract "% of workers sick" plague model predates the staff system and is superseded by this.** The staff system means we can do something better and more *felt*: a named worker who's ill/hurt idles **their** building. Abstract population-plague can still come later at city scale, but the early, personal layer is this.

### Step 1 — Staffing respects HP + serious conditions ✅ BUILT
`getBuildingStaffing` used to treat a present adventurer as a full worker unless *deployed*. Now a present worker's share scales with their HP (`workEffectiveness`: full at ≥50% HP, ramping to 0 at death's door) and a serious cure-only condition (venom/froth) benches them entirely. This is the reusable lever the whole illness/injury system pulls: **a sick founder = a worker at reduced effectiveness → their building dips.** (Multiplier still floors at the understaffed floor, so a benched worker is no worse than an empty slot — the settlement pitches in.) *(NB: the watchtower/archer defenses are a separate system — fix there separately if wanted.)*

### Agreed design (Option A)
- **Illness/injury lives on the building** (keyed to its named founder via `BUILDING_STAFF`), NOT on full founder entities (founders aren't modeled as entities yet). "Tomas is abed; the quarry sits idle." Graduate to real founder entities later without wasting this.
- **Injury vs illness by building type:** heavy-labor buildings (**Quarry, Lumber Mill → injuries**: a cut, a wrenched back, cured by **bandage/salve** or rest); **Forager / others → illnesses** (fever, chill, gripe, cured by **alchemy tonics** or rest). Both reduce output through the HP/effectiveness lever.
- **Named vs unnamed cure differently:** founders / Nessa / Godric are cured **individually** (give them the item, like adventurers today). **Unnamed citizens = an abstract sick-pool** ("3 townsfolk abed") cured **in bulk** — self-recovery over time, sped by a "distribute medicine" action and eventually an **Apothecary/Infirmary** building.
- **No founder death** (unless story-tied). **Citizens CAN die** from a bad, long-neglected illness (the population-plague layer).
- **Pacing — gate severity on spare citizens:** while founders are the *only* workforce, illness/injury stays mild + rare (no management answer yet). Once there's a citizen bench, it can bite harder (swap a citizen in, brew medicine). Scales with the player's ability to respond.
- **Dogs (later slice):** a hunting hound gored on the hunt comes home limping → its bonus dips until tended. Fits the kept-animal system + shelter ethos. Follow-on, not first.

### Build order
1. **Staffing respects HP/conditions** ✅ (the foundation, done).
2. **Founder injuries/illness (Option A)** ✅ FIRST SLICE BUILT (2026-07-31).
3. **Citizen sick-pool** — abstract count, distribute-medicine + Apothecary, citizen deaths.
4. **Dogs** — injured hounds, cozy tend-to-heal.

#### Step 2 — what shipped (first slice)
- **Data:** `shared/data/ailments.ts` — `AilmentDef` + `AILMENTS` pool + `BuildingAilment`. **6 ailments** now: *A Bad Cut* & *A Wrenched Back* (injuries, Quarry/Lumber Mill); *A Winter Chill* (winter), *The Summer Gripe* (summer), *The Fen-Ague* (spring/marsh) — contagious + season-weighted; and **The Deep-Cough (pneumonia)** — the serious one.
- **Escalation (worsening) — new mechanic:** an untreated illness can WORSEN into a graver one (`escalatesTo`/`escalateHourly`/`escalateSeasonWeight`). A neglected Winter Chill or Fen-Ague can settle into the chest and become **pneumonia**, likelier in the cold. Pneumonia is `catchable: false` — never caught fresh, only reached by escalation, so the player always had a window to treat the chill first. It's a big work drop (0.65) and a long haul (36h rest), but no death and rest still clears it; the fast cure is **Edda's Deep-Cough Draught** (fenbalm — the scarce marsh herb, so the fen missions pay off). Ties to fenbalm's canon use ("against the deep-cough").
- **Herbs:** yarrow, comfrey, feverfew, wildmint, willowbark added to `HERBS` (foraged). Nettle bumped to **common**.
- **Cures:** `woundwort_salve`, `knitbone_poultice`, `fever_tonic`, `settling_draught`, `bitterroot_tonic` alchemy recipes (starter tier). Injuries also cured by bandage/salve/mending potion.
- **State:** `buildingAilments: Record<buildingId, BuildingAilment>` (frontend + shared, optional → no save migration).
- **Effectiveness:** `getBuildingStaffing` drops the afflicted founder's share by the ailment's `workPenalty` (mild 0.35–0.5) → building dips, floored at the understaffed floor (never zero).
- **Tick:** recover (rest countdown → self-clear) + catch (gated on **spare citizens** — none while founders are the only workforce; season-weighted; **contagion** raises the odds of the next illness). Onset/recovery events in the log.
- **Cure UX:** building-card ailment banner + cure buttons for owned items (`getBuildingAilment` / `cureBuildingAilment`); "they'll rest it off" when nothing's on hand (the deadlock guard is live — rest always works).
- **Tests:** `staffing.test.ts` covers the ailment → reduced-multiplier path.

#### Step 2 — decision: the spare-citizens gate is on CATCHING only (2026-07-31)
Losing all citizens (famine/raid) stops *new* ailments (no spare hands = no fair way to answer), but an ailment already running is **not** auto-cured — it finishes its rest countdown normally. Safe because rest always clears it and the building floors at 50% (never a lock/spiral). Kept as-is. *Deferred alt if it ever feels harsh:* when short-handed (no spare citizens), let existing ailments **recover faster** (the camp rallies to nurse the sick) — a gentle mercy without a jarring instant-cure.

#### Step 2 — deferred (next slices)
- ~~More ailments (Summer Gripe, Fen-Ague)~~ ✅ done (2026-07-31) — pool is now 5, one for every season.
- **Restorative meals** as recovery items (bone broth / herb porridge / honey-cake), given like a bandage (no Lord-narration). MILD effects (see memory `feedback_mild_food_effects`).
- **Contagion tuning** + **citizen sick-pool** (step 3) + **dogs** (step 4).

### OPEN — step 2 design questions (discuss before building)
- **Perfect the pool:** the exact injuries/illnesses, which building each attaches to, flavor + cure.
- **Risk / occurrence:** base rate + modifiers (season-weighted — winter chills, summer gripe; cold/no-heating; poor food diversity / dirty water; later vermin pressure). Preparation lowers it (the "manageable, not punishing" ethos).
- **Epidemics / contagion:** one sick person **raises the chance of more → exponential spread** if unchecked. How steep, and what caps it (isolation? the cure? the Apothecary?).
- **Recovery time when the player has NO cure** — and the **deadlock guards** (load-bearing): if *all* the forager's-hut staff are ill you can't gather herbs to brew medicine; if you're still a **Camp** you can't make bandages at the Tailoring Shop yet. So illness must **always be survivable without a cure** (self-recovery floor / rest), and early/camp-tier illness must never hard-lock. The cure *accelerates*; it is never the only exit.
