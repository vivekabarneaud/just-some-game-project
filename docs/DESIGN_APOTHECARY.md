# The Apothecary & the Kitchen — free-form crafting (design)

**Status:** VISION / dreaming (2026-07-31). Big future direction, not built. Recall pointer: memory `project_freeform_apothecary`. Builds on the fixed cures/herbs already shipped (DESIGN_WORKERS_PLAGUES §illness).

A BOTW-meets-KCD2 emergent crafting system: the player assembles ingredients whose effects **cumulate** into a potion/dish. Two twin stations sharing one engine — the **Alchemy Lab** (herbs → potions/salves/poisons) and the **Kitchen** (food → meals). It exists to make the game a *little universe*: cozy, mystery, emotion, a bit of min-maxing, loot & rarity — and to give the huge plant diversity a payoff.

## Pillars (load-bearing rules)
1. **Opt-in, never mandatory.** Fixed recipes cover "a bit of everything." A player who never invents is completely fine. See `feedback_mild_food_effects`.
2. **Invention is only SLIGHTLY better / more tailored.** The power gap is marginal, so no one is *forced* to grind alchemy. Its real value is **tailoring** (a potion fit to your exact need — "+2 STR *and* +10% dmg/2t"), **discovery/joy**, and **flexibility** (improvise with what's on hand) — NOT raw power.
3. **Mild by default; the offensive branch may run punchier but capped** (open decision).
4. **Discovery → a card.** Brew a combo once → it's saved to the recipe book as a card (fixed cards pre-known); after that it's one-click brew.
5. **Three paths to any potion:** brew a fixed recipe · invent your own · **buy it**. Matches every playstyle, and grows an emergent **"apothecary" supplier niche** in the economy.

## The two axes
Both mirror real cooking, so they read as intuitive, not abstract.

### ROLE = the pantry tab you grab from (organization + soft balance)
Not "role theory" — just labelled shelves, like a spice rack. Keeps a big plant list legible and stops the player from dumping five heroes.
- **Base** — gentle carrier/softener; often the medium (KCD2 liquid base: water/oil/spirit/honey). **Soft REQUIREMENT: a brew with heroes but no base is harsh / weak / "dubious"** — this is the anti-"5 heroes" balance lever, learned by doing.
- **Hero** — the defining effect; you build a brew *around* it.
- **Catalyst** — little of its own; **amplifies / extends** others (honey = potency + warmth; salt = preserve/duration). A real mechanic.
- **Toxin** — genuinely offensive on purpose → poisons & throwables (see Offensive).
- **Wildcard** — a *small* shelf of volatile ingredients (odd mushrooms, unstable aether plants) → risk & surprise. NOT "everything."

*(A plant lives on ONE shelf, its primary role. Surprises like "nettle + X → poison" come from combo interaction rules, not from re-tagging.)*

### TECHNIQUE = the lab station you place it on (the transformation)
Decides **which of a plant's effects come out.** Each plant has a **signature technique** (its real best use) + a mild generic effect elsewhere — that keeps authoring sane and rewards herblore.
- **Crush** (mortar) — poultices, topical/wound; releases different compounds.
- **Boil** (cauldron) — strong decoctions (bark, roots).
- **Steep/Infuse** — gentle teas (flowers, leaves).
- **Dry** — concentrate/preserve.
- **Distil** — potent essences (late).
- **Char** / **Ferment** — later, exotic (ash; meads/spirits → flammable bases).
- **Techniques gate on Alchemy Lab LEVEL** → the upgrade finally means something. **L1 = just the cauldron: boil (+ mortar/crush). Higher levels unlock steep, dry, distil, char, ferment.** Each = a new slot on the drawn lab = new recipe space.

### The maths: additive effect-vector
A plant contributes `(effect, magnitude)` pairs **keyed by its technique slot**. A brew = the **sum**, per-effect **capped** (mild) with **diminishing returns** on stacking the same effect. Two different ingredient sets → genuinely different multi-effect potions (fixes the BOTW "different inputs, same output" gripe). Design space = ingredients × techniques × combination.

## Effect palette — grounded in real stats + real ailments
Every effect is ONE concrete thing — a real stat or a real ailment — never a fuzzy channel word. (The old "Calm/Soothe" split: **Soothe = the BODY mending** (ailment/HP system); **Calm = the MIND** = combat **+WIS** / home **+happiness**.)

**Attribute reference (what each actually drives, verified in stats.ts):**
- **STR** → physical damage + parry · **DEX** → crit, dodge, accuracy, initiative, mobility · **INT** → magic damage · **VIT** → defense + HP · **WIS** → magic resist + initiative + healing (composure).
- *Note:* an adventurer only "breaks" from a near-lethal hit (HP-driven) — no fear roll to buff. But **mind-control/confusion** is a real status (resisted via WIS/composure).

**Recovery effects:**
- **Heal HP.**
- **Ease a specific ailment line** (speed its recovery / cure it): **Fever** = winter_chill / fen_ague / pneumonia · **Gut** = summer_gripe · **Wound** = bad_cut / wrenched_back (+ adventurer bleed).
- Mild **general recovery** (a little off any ailment / regen boost).
- **+Happiness** (settlement stat).

**Combat effects (the real stats):**
- **+STR / +DEX / +INT / +VIT / +WIS**, and the sub-stats: crit, accuracy, dodge, parry, initiative, mobility, presence (aggro), luck.
- **Resist a damage school** (physical / aether / fire / frost / lightning / light / hollow / nature).
- Buff shapes: **+damage% / +defense% for N rounds**; resist **confusion** (via WIS/composure).

**Offensive (Toxin):** apply **poison** (DoT) · **weaken/slow** (debuff) · **confuse** (mind-control) · **elemental AoE** (fire/frost/…).
**Modifier (Catalyst):** amplify **potency** / extend **duration**.

**Herb clustering (keeps mappings honest):** plants sort into **recovery-herbs** (chamomile, feverfew, fenbalm), **combat-stat herbs** (a strengthening root → STR, a stimulant → DEX, an aether bloom → INT/WIS), and **mixed** — each plant only touches the channels its real nature fits. Not every plant fights.

## Offensive alchemy (the Toxin shelf)
Two delivery methods, feel different:
- **Poison — weapon coating (the assassin's craft).** Coat a hero's weapon pre-mission → hits carry a **poison DoT** or **debuff** (weaken/slow). Reuses the `poison` condition + assassin **Poisoner's Touch**.
- **Throwables — flasks/bombs (burst/AoE, anyone).** A combat supply-slot consumable the sim lobs (e.g. round 1 at a cluster): 💥 explosive → AoE **fire** · ❄️ frost flask → AoE **frost**+slow · 🍄 shroom-fog → confuse (reuse mind-control / accuracy debuff) · 💨 smoke → accuracy down · 🧪 acid → armor break · ✵ caltrops/oil → immobilize (ties to positional traps).
- Technique matters offensively (distil → more potent; fermented/spirit base → flammable = the bomb). Rare toxic plants = strong = **loot payoff**.

## The Kitchen (twin station, same engine)
Food → meals leaning **HP, morale/happiness, warmth, recovery-speed**, mild "well-fed" buffs. Roles: Base (grain/broth/stock), Hero (meat/fish/key veg), Catalyst (honey/salt/butter), Wildcard (foraged oddities). Techniques: boil (stew/broth), roast, bake. Overlap with alchemy kept light (Kitchen = comfort/food, Alchemy = medicine/potion).

## The plant catalog (a herbalist's book)
Each plant a **hand-drawn herbalist illustration** + properties / effects / source / rarity, filling in as you find & study plants (partial knowledge until used). A diegetic home for the game's own artwork. See also the recipe book (cards).
- **Home = a "Herbs / Plants" tab in the encyclopedia** (user 2026-08-01): alongside the character/monster encyclopedia. Each plant = a card with its herbalist drawing + **discovery slots** (properties/techniques filled in as you learn them — ties to the knowledge-layer open decision). Structure can ship with placeholder art; drawings drop in later.

## The unified lab — screen layout (user sketch 2026-08-01)
A vertical divider splits the page:
- **LEFT = the recipe book** — a grid of recipe cards (known/discovered). Click one to load it onto the stations.
- **RIGHT = the working lab**, three zones:
  - **Lab drawing (top):** the hand-drawn lab; the **technique STATIONS live inside the illustration** (cauldron = boil, mortar = crush, still = distil, brazier = char, …). You place ingredients onto them.
  - **Shelves (below):** your owned ingredients, **organized by ROLE** shelf — where you grab from.
  - **Output box (bottom-right):** an arrow; the finished brew flows here (name/effects + Brew).
- **The insight:** this expresses BOTH axes spatially — **shelf = role (grab), station = technique (place)** — so technique is chosen by *which station you drop onto*, not a dropdown. Matches the engine's placement list (ingredient+technique) exactly. Skeuomorphic, art-forward, cozy. Interaction: drag ingredient shelf→station (or click-select-then-click-station). Needs the lab art to shine; a functional labelled-drop-zone version ships first, art drops in later.
- **Open:** stations one ingredient each or a few? Total capacity gated by Alchemy Lab level (more stations/slots as it upgrades). Base-lever still balances "5 heroes."

## Inventory: plants as a category (user 2026-08-01)
Currently herbs live in a separate `state.herbs: Record<id, qty>` store (NOT `state.inventory`). The Inventory page already renders sectioned categories (tools / supplies / food / equipment / seeds / materials). **Add a "Herbs & Plants" section** there — simplest first step is display-only (read `state.herbs`), no risky migration of the herb store. Splitting inventory into clearer categories/tabs is a welcome tidy-up alongside it.

## Open decisions
- Offensive branch **punchier-but-capped** vs uniformly mild? (lean: punchier)
- **Calm** doubling combat + cozy, or split channels?
- **Wrong technique** *wastes* an ingredient (rewards herblore) vs always gives *something* (forgiving)?
- **Preview vs surprise:** show ingredient HINTS (from catalog), reveal the exact combined result on first brew, then save the card. (lean: hint + reveal-on-first-brew)
- **Herbalist knowledge / ⭐ discovery (user 2026-08-01):** should a plant's best technique (⭐) + full effect table be shown from the start, or **DISCOVERED**? A plant could start "unstudied" (properties hidden / fuzzy) and get filled in as you experiment with it or study it — the catalog fills in through play, like a real herbal. Ties the ⭐, the preview-vs-surprise question, and the plant catalog into one **knowledge layer**. Adds discovery/RPG-progression texture but more UI/state. Deferred; strong candidate for its own slice. (Sandbox currently shows ⭐ + all effects — a tuning aid, not the final player-facing reveal.)
- Recipes personal for now; **shareable** later?

---

## Plant sheets
Format per plant: real herblore → signature technique → per-technique effects (rough, tunable magnitudes) → role → notes.

**⭐ = SIGNATURE technique** — the plant's *identity*: its classic, characterful, *early-accessible* prep. NOT "the biggest number."

**Effect SHAPE by technique — SUSTAINED vs BURST (a tactical choice, not a power tier):**
- **Boil / Steep** (decoctions & infusions) = **SUSTAINED** — a buff for the whole fight, or a heal that *regens over turns*. More **total** value, but you must survive to reap it. Reliable, economical.
- **Distil** (essence) = **BURST** — a short strong buff (big +stat for ~2 turns) or an instant one-shot (+50 HP now). Higher **peak**, front-loaded/emergency, less total, and late + costly. A burst also concentrates the **primary** effect and drops the secondary (so narrow + burst go together).
- **Dry** = a preserved, stronger sustained (keeps through winter). **Crush** = an immediate topical poultice (wounds). **Char** = incense/ward. **Ferment** = spirits/flammable.
- So a late technique's bigger number is never a *strict upgrade* over the signature — it's a different *shape* gated behind progression.

**Magnitudes shown are rough placeholders** (shape + a starting number), tuned at build time.

### 🌼 Chamomile — *the gentle Base* (a recovery/base herb, barely combat)
Real herblore: a soothing, calming, digestive **flower**; in *everything* because it's kind. Signature technique: **Steep**. **Role: Base** — softens/rounds; rarely the star.

| Technique | Concrete effect (all mild) |
|---|---|
| **Steep** ⭐ | speeds **Gut** recovery + mild **general recovery**; **+happiness**; a touch of **+WIS** (composure) if brewed for a fighter |
| **Crush** | mild **heal HP** / eases a **Wound** (soothes a cut) |
| **Boil** | *wasted* — the delicate flower cooked out → faint **general recovery** only |
| **Dry** *(later lvl)* | a stronger steep base (more of the above); keeps through winter |
| **Distil** *(late)* | concentrated **+WIS / composure** — the heart of a calming draught |

**As a Base:** softens harsh combos so a punchy brew doesn't backfire on the drinker. The soft partner to a Hero (feverfew → fever tea; yarrow → wound salve) — exactly its place in our fixed recipes already. Honestly not a combat herb — and that's fine; not every plant fights.

### 🌿 Mugwort — *the witch's herb / the sharpener* — **Role: Hero (mind/magic)**
Real herblore: bitter, aromatic, *witchy* — divination, vivid dreams, "sharpens the mind," and famously **burned** as protective incense (moxa). Signature: **Boil** (the classic bitter tonic).

| Technique | Effect *(rough, tunable)* |
|---|---|
| **Boil** ⭐ | *(sustained)* the full bitter tonic → **+2 INT for the whole fight** · speeds **Gut** recovery. Rounded, cheap, early — the classic. |
| **Steep** | *(sustained)* a gentle dream-tea → **+1 WIS** all fight · a little **general recovery** (~+10% rest regen) |
| **Crush** | an ache poultice → heal **~8% HP** · mild **Wound** ease *(weak)* |
| **Char / Burn** ⭐ *(late)* | **warding incense**: party takes **−25% damage from ghosts/undead/hollow** + **resist confusion** (~2 rounds). Wards you *from* the dead — does NOT make them killable *(that stays Niamh's binding / a rare brew)*. |
| **Distil** *(late)* | *(burst)* a concentrated essence → **+4 INT for ~2 turns** (front-loaded spell-power; drops the Gut side). Sustained Boil vs burst Distil = a tactical choice, not a strict upgrade. |

**Its identity: the caster's & spiritualist's herb** — feeds the wizard (**+INT**), clears the head (**+WIS**), and, once you can burn it, becomes a ward *against the dead* (the discovery beat when the Wastes' ghosts arrive). Contrast: chamomile = gentle Base that soothes; mugwort = witch's Hero that sharpens + wards.
