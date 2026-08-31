# Valenheart — Master Lore Timeline & Schema

**Status: TOP CANON AUTHORITY.** This is the single source of truth for cosmology, the Sundering, eras, cultures, and factions wherever it speaks. It **supersedes `lore/FACTIONS.md` and `lore/EIGHTH_GOD.md`** on the cosmology / Sundering axis (gods are celestial; the Sundering is the Cassandra–Netheron version). Where any doc disagrees with this one, **this one wins.** Those two remain CANON-PARTIAL *references*: `lore/FACTIONS.md` for faction/NPC/race texture (mind the name drift — Dryven→**Drayven**, Kess→**Niamh**), `lore/EIGHTH_GOD.md` for the Eighth's existence/nature. `lore/FOUNDERS.md` is the parallel authority for the six founders. Also stale, NOT canon: `frontend/src/data/chronicle.ts` (pre-lock v1 draft — see the retired Audit 2026-06-11 doc (in git)). Full consolidation (folding FINAL + EIGHTH_GOD in here) is still planned; until then this doc is authoritative.

This is the consolidated schema. Read it top to bottom for the chronology. Use the cultural sections for per-people deep dives. Open threads at the bottom flag what still needs locking.

> **Convention.** "BS" = Before the Sundering. "AS" = After the Sundering. The Sundering is approximately 2000+ years ago. The Lord arrives at his land grant in **year ~2000 AS**.
>
> **Proposal markers.** Items marked `[PROPOSAL]` are not yet locked. Items marked `[LOCKED]` are canon. Items marked `[TBD]` are gaps we still need to fill.

---

## Part 0 — Cosmology Quick Reference

### The Pantheon (Eight, not Seven)

`[LOCKED]`

| God | Domain | Status today |
|---|---|---|
| Ferros the Smith | Metal, crafting, earth | Dormant |
| Sylvana the Green | Nature, growth, seasons | Dormant |
| Nereia the Deep | Sea, rivers, fortune | Dormant |
| Solara the Bright | Light, warmth, hope | Dormant |
| Korrath the Shield | War, protection, valor | Dormant |
| Lunara the Wise | Knowledge, magic, the moon | Dormant |
| Netheron the Shepherd | Death, transition, the Aether cycle | **Dead** |
| The Eighth (unnamed) | Malice, deception, fear | **Sealed in physical form** in the Ironspine Deeps; mortals do not know he exists |

The Six are sleeping, not dead. Their celestial bodies still glow faintly in the high sky; their distributed essence still flows weakly through their domains. Both layers function on reflex. Seasons turn, ore forms, tides move, but everything is harder than it should be. They could theoretically be awakened.

Netheron is the only god who truly died. His function (the Aether cycle) has no one performing it, not even on autopilot. His physical body fell to earth at the Sundering and lies at the center of the Hollow Wastes; his essence leaks from the corpse.

The Eighth is sealed but not dead. He is locked in his physical form (the Seven's binding ritual forced him to assemble against his will and bound him into that shape). He cannot move; he cannot disperse back into distributed essence. He has been preparing inside his cell for far longer than any mortal civilization has existed (tens of thousands of years, possibly more), deliberately creating demons from his bound essence, building an army he can deploy when the seals fail. He is patient. Strictly no mortal remembers him.

### How gods exist

`[LOCKED]`

The Eight are celestial beings. Mortals see them as lights in the high sky: points of brightness moving in slow, knowable patterns. They are not literal stars in the astronomical sense, just unreachable lights with cosmic agency. Mortals named them by what they observed (Solara for the brightest, Sylvana for the one tied to growing seasons, Netheron for the one whose movements correlated with death-rates). Each culture gave its own names; the gods' true names, if they have any, are unknown.

Gods exist on three layers at once:

1. **Celestial body.** Their light in the sky. Where their consciousness lives.
2. **Distributed essence.** Every place their domain reaches. Solara is in every ray of sunlight. Netheron was in every dying breath.
3. **Assembled form.** When a god focuses their essence into a single physical shape. Voluntary, rare, and powerful. Each god has a default form they assemble into; the form is unique, non-humanoid, and recognizable. Once assembled they can disperse again at will. Assembled gods can be touched, fought, and (very rarely) killed.

The Eighth is the exception: he is permanently in assembled form because the Seven's sealing ritual forced him into his own true shape and locked him there.

**Why Netheron has the bad reputation.** Across the Eighth's long pre-sealing era, every cruelty in the world (plague, famine, sudden infant death, the panic that destroys an army, the despair that empties a village) was the Eighth's work. He never claimed it. He let mortals attribute each misery to whichever god seemed to fit, and the only god whose role touched death was Netheron. Across millennia, the Shepherd absorbed the blame for every evil the Eighth committed. The Eighth did this for sport — he is cruel for sport, he is cruel for the joy of it, scapegoating Netheron amused him.

By the time the Seven sealed the Eighth in the Ironspine Deeps, Netheron's reputation was already irreversible. The Seven sealed the Eighth because they had grown tired of his work; the specific event that finally pushed them is fuzzy in canon (parked, may be locked later). They did not know about the agents he had already placed outside the seal, working forward across the centuries on his behalf. The Six could have corrected Netheron's reputation afterward. They chose silence. That silence, layered with millennia of mortal scapegoating and the Eighth's continued indirect work that only Netheron could perceive, is what eventually broke Netheron and led to the Sundering. (See Era 2.)

### The Three Magic Traditions

`[LOCKED]`

All magic flows from the **Aether**, the residual energy of creation woven into stone, river, tree, and living being. **Astral Shards** are crystallized Aether. Magic is not divine power; it is manipulation of the world's substrate.

- **Arcane Magic** — Power through understanding. Formulas, incantations, the Academy of the Aether's tradition. Halldora's school.
- **Primal Magic** — Power through harmony. Listen to Aether and work with it. The Thornveil's school. Sylvana's dormant essence cooperates with Primal practitioners instinctively.
- **Light Magic** — Power through Solara's domain: light, warmth, hope. Heals the living, comforts and guides the perceptible dead across the broken boundary, and drives back the dark (undead, the thinning's wrongness). Solara's dormant essence cooperates with Light practitioners instinctively, as Sylvana's does with Primal. **This is what priests unknowingly do** (see the priest note below); they call it the Radiant One's blessing. Both the literal light and its symbol — hope — are Solara. `[reframed 2026-06-30 from "priests = Primal"]`
- **Hollow Magic** — Power drawn from stagnant dead Aether (the residue Netheron is no longer recycling). Forbidden. The Cult's school. Each use destabilizes the cycle further.

**Casters carry their own power `[LOCKED 2026-06]`.** A trained practitioner does not scoop ambient Aether from the ground mid-cast — their power comes from training, focus, and crystallized Aether (Astral Shards). So **every caster works anywhere**, the thinning and Wastes included; magic is *not* weakened by location. The thinning's danger is the worn boundary (perceptible dead, madness, wrongness), not a magic-dampening field. The schools differ by **method, not by where they are strong**: Arcane (knowledge — works wherever knowledge does), Primal (harmony — *why* they sense and place wards, i.e. the most *attuned* to the thinning, not the weakest in it), Light (Solara's warmth — heals, guides the dead, drives back the dark; also attuned, so priests *feel* the wrongness too), Hollow (the only school inherently *tied* to corruption, because it burns dead Aether; not a school adventurers use). Gameplay consequence: no class is mechanically weaker in any zone, and none of this needs to be surfaced to the player.

**Priests are unwitting Light practitioners `[LOCKED 2026-06; reframed Primal → Light/Solara 2026-06-30]`.** A "priest's blessing" is faith-framed **Light** (Solara-attuned) Aether-work: they heal the living, comfort and guide the *perceptible dead* across the broken boundary (the soul/boundary half of the thinning), and drive back the dark, believing they channel the gods, when they are really doing instinctive Light magic. *(Both the literal light and its symbol — hope, warmth — are Solara's domain.)* Consistent with "magic is not divine," the folk-monotheist "Radiant One" heterodoxy (matters later — the Radiant One *is* the light), and Father Corin's quiet study of Edda's rituals. Priests act on the living and the *dead*, not on corrupted *matter* (warding/containing corruption is **Primal** — Niamh's domain; this cleanly separates priests from the Thornveil). Because Light-attuned sensitivity makes priests (and other attuned folk) *feel* the dark/wrongness near acute corruption, they read that dread theologically — the devil's presence, sin in the ground — which quietly *reinforces* the Doctrine of Silence rather than debunking it. And the slow, secular spread of the thinning is imperceptible to short-lived humans; only a being like Halldora, or careful long records, can perceive the centuries-scale tide. **The deepest irony `[LOCKED 2026-06-29]`:** the Inquisition is *itself staffed by unwitting mages* — its priests work Aether every time they bless or heal, hunting the overt magic of wizards while channeling the same force themselves. The line between "answered prayer" and "forbidden magic" is one of **labeling and visibility, not substance**: a wizard's fire is undeniable, so it reads as heresy; a priest's healing reads as piety. (Surfaceable late as a Doctrine-shattering reveal; see Aldwin Stonebridge, who heals by "prayer" while hiding his wizard brother, not knowing they do the same thing.)

**Contain, don't cleanse `[LOCKED 2026-06]`.** Corruption of *matter/ground* (a tainted spring, tree, grain) cannot be quickly cleansed: the Aether cycle is broken (Netheron dead), so there is no fresh good Aether to pour back in. A **ward** (Primal) is a *barrier* — it stops the bleed/spread but does not clean what is already corrupted; **"a broken ward simply returns the area to its underlying thinning state."** True cleansing of a *small* spot may be possible slowly via Primal coaxing (nursing the land back over a long time), never quickly and never at scale. So the practical answer to local corruption is to **contain** it (cap/mark/ward + cull the afflicted + a priest settles any lingering dead), and live with a sealed bad spot. "Hold, don't win."

Other proposed magic-adjacent practices (Khor'vani Alchemy, Khazdurim Rune-craft) are parked in `docs/lore/OPEN_IDEAS.md` pending discussion. Do not rely on them for canon writing yet.

### The Aether Cycle — Netheron's Lost Function

`[LOCKED]`

When the cycle worked:

1. Living things create Aether through life.
2. At death, that essence releases.
3. **Netheron shepherds the released Aether** back into the world — feeds soil, trees, herbs, new life.
4. New life uses this Aether to grow. Loop closes.

When the cycle is broken (now):

1. Living things still create Aether.
2. At death, that essence releases.
3. Released Aether **has nowhere to go**. It pools, stagnates, curdles.
4. New life feeds on the world's accumulated reserves (built up over millennia of working cycle), not on fresh Aether.
5. Reserves slowly drain. The Wastes are where reserves are gone.

This is why the world is on a slow countdown. Most places still feel fine. The boundary regions are running out first.

### Two Zones of Damage

`[LOCKED]`

- **The thinning zone.** The boundary between life and death has been worn permeable. The dead are not *more* present here than elsewhere; they are *perceptible* here. Voices reach the living. Bodies decompose unevenly because residual Aether is patchy. Sanity erodes. Life still happens, but on a slow countdown.
- **The Hollow Wastes.** Boundary is broken open. Aether has drained completely back through the breach. Negative-Aether soil. Nothing grows; nothing has grown for a long time. The trees that were standing when the drain reached this land are still there, dead and undecayed, slowly turning grey. New seeds find no Aether to feed on. Bodies do not decompose; some animate as undead. Skeletons live here, not in the thinning.

The thinning expands first. The physical Wastes follow, with delay, where the thinning has been long enough. The leading edge of advance is always thinning.

### Wastes intensity and the body

`[LOCKED]`

The Wastes intensify toward the center. The leading edge expands outward over centuries; the impact crater at the heart is two thousand years of accumulated corruption stacked on top of Netheron's leaking corpse.

- **Outer Wastes.** Survivable for a hardened expedition with Hollow protection. Cult expeditions, demon-hunters, and rare scholars can enter for hours or days.
- **Middle Wastes.** Deadly even with magic; very few survive. Those who return often come back changed: speaking strangely, prophetic, broken.
- **Inner Wastes.** Unsurvivable to mortal bodies and minds. The thinning of reality is so severe that mortal cohesion fails. Hollow magic does not help here — the dead Aether is too concentrated to manipulate. A swimmer who can ride waves cannot survive a tsunami. Bodies dissolve, souls fragment.
- **The body site itself.** None have ever reached it. In two thousand years of Cult expeditions, no one has gotten close enough to see it.

**The body is mythologized but never observed.** Folk theology says *"the dead god lies at the heart"* without anyone ever seeing him. Halldora alone *knows* the body is there, inferred from how the boundary fails around the impact crater; she has stood at the edge of the outer Wastes more than once but has never approached the body. The Cult has decades of expedition logs, fragments of testimony from the half-mad survivors, sketches drawn by trembling hands. They have built their faith on this evidence. They are not guessing. They are also not eyewitnesses.

A team that finally reaches close enough to see the shape of Netheron's body would be the first in two thousand years. That moment converts mythology into geography for the player. Late-game payoff.

### Souls and Ghosts

`[LOCKED]`

- The cycle is broken. Souls released at death do not cross cleanly anywhere in the world. The boundary holds them on this side.
- Most souls drift slowly toward the breach (the Wastes) over years to decades, pulled by the low-pressure Aether there. Some fade or are reabsorbed into residual world-Aether before they ever arrive. A small fraction make the full journey and end up clustered at the Wastes.
- **In thick-boundary regions** (most of the world), drifting souls are imperceptible to the living. Houses are not haunted. Life feels normal. The dead are present but unfelt.
- **In the thinning zones**, the boundary is worn enough that the living can hear them passing. Voices in the trees. Names called from places no one is.
- **In the Hollow Wastes**, the boundary is broken; the souls that have arrived can manifest physically as undead.
- **Strong attachment can anchor a soul** to where it died, or to a person it cannot leave behind. These rare cases stay where they are instead of drifting. Most ghosts the player meets near the boundary are anchored, not in transit.
- **A living person who dies in the thinning** has a very low chance of crossing properly. Local Aether reserves are nearly gone, and the broken cycle's weakened pull cannot reach them. Most who die in the thinning become part of its voice-population almost immediately.
- **Combat dispels a ghost's manifestation, but does not free the soul.** The soul reforms, hours to weeks later, depending on the binding's strength.
- **Only Thornveil ritual work (or equivalent) can permanently free a stuck soul.** Hours for a faint case, years for a stubborn one.
- Late-game, ritual magic can be learned by adventurers and brought into combat. This is the only path to permanently defeating major ghost bosses (Varek, his court).

### Wards

`[LOCKED]`

- Large carved monoliths inscribed with Primal-magic glyphs.
- Restore boundary thickness across a regional area, not just a building. A working ward can cover a stretch of forest, a hilltop and its approaches, a small valley.
- Voices cannot get through a working ward.
- Wards are placed where they can blend with the landscape: moss-grown, set into hillsides, half-buried, easy to overlook from a distance but visible up close. Rangers do not advertise their locations.
- **A broken ward simply stops working.** The area returns to its underlying thinning state. Broken wards do not actively spread Wastes (this is a common folk misconception).
- **A dormant ward** is one that has cracked or weakened but not fully failed; its area of effect shrinks.
- **The old watch (Hale's garrison) `[LOCKED 2026-06-11, revised 2026-07]`:** the **ward-stone belt runs roughly east–west along the thinning**, and the watch is flanked by two of its stones, **one east and one west** of the tower (~half a mile each). In Hale's day the **west stone had broken** (the line of keepers had thinned to nothing; an unkept ward cracks); the east stone held, but one stone keeps only its own circle and the garrison stood beyond its reach — that is why Hale's men heard voices from day one. **Niamh's grandmother's teacher re-set the fallen stone after the garrison fell**; rangers have kept the pair since. Today **both stand whole** (the mended one visibly seamed) and the watch ground is quiet — which is why the Lord's scouts hear nothing there. The belt is a **retreating line**: the deeper stones *further south* were overrun long ago as the thinning crept north, so the watch's pair is part of the current *held* edge, not a continuous wall. *(Which of the pair broke in Hale's day is backstory flavour only — both are mended now, so it carries no present weight. Revises the earlier north/south placement; supersedes the older "ward placed after Hale / Hale's men had no ward" account.)*
- Cleansing or repairing a ward draws attention from nearby thinning-bound entities. Combat during repair is from the disturbance, not from the ward itself.

---

## Part 1 — The Master Timeline

### Era 0: Mythic Prehistory

`[LOCKED, in broad strokes]`

- The Eight celestial beings shape the world. Mountains, seas, forests, sky, life, death.
- The Eighth is cruel for sport. He undoes what the others build, spreads malice for the joy of it, and quietly scapegoats Netheron for every evil he commits.
- **The Sealing of the Eighth.** The Seven finally grow tired of him (specific triggering event fuzzy, parked). They perform a binding ritual that forces the Eighth to assemble into his physical form against his will, then locks him into that form, then traps the form in the Ironspine Deeps — the deepest place in the world. Multiple ward-gates layered around him, each a different magical discipline. He cannot move. He cannot disperse back into distributed essence.
- **The Erasure.** The Seven agree to never speak the Eighth's name again. Over millennia even they stop referring to him. Mortals never knew he existed.
- **The Misattribution persists.** All ambient malice continues to be blamed on Netheron. He cannot defend himself without breaking the silence around the Eighth, and the Six choose silence.
- **Inside the seal, the Eighth begins building.** He uses his bound essence to deliberately create demons over time. Patient, calculated. He does not rage. He builds. The Seven do not look in.
- **The Eighth's pre-sealing agents** continue their work outside the seal. Across generations they nudge Khazdurim ancestors toward digging deeper into the Ironspine Mountains; they edit scholarly traditions; they seed doctrinal disputes. The Seven do not track individual mortals and so do not see this happening.

At this point mortal civilization does not yet exist in any organized form.

### Era 1: The First Civilization (~thousands of years BS, until ~2000 years ago)

`[LOCKED in outline; specific dates TBD]`

- The Three Races (humans, elves, dwarves) emerge or were always there. They share one civilization, not several.
- The Eternal Court guides mortal life. Festivals to Six. Empty temples for Netheron.
- **Elves are immortal.** Sustained by the working Aether cycle. They live indefinitely. The eldest remember the world before written language.
- **The Academy of the Aether** is founded. Greatest center of learning. Multi-racial — human, elf, dwarven scholars. Houses the deepest research in Arcane theory.
- **Halldora Frostvik** (human) becomes the youngest Archmagus in Academy history within the last few centuries before the Sundering. She studies the eccentric field of *divine infrastructure* — how the seven gods' functions (the Eighth was forgotten) mechanically sustain reality. Considered fringe. She is one of several Archmagi at the Academy; her distinction is her unique school of study, not her rank.
- **A folk monotheist heterodoxy.** A small minority of Hearthlands theologians hold that the Seven are aspects of one supreme god — calling him the Radiant One. They are dismissed by mainstream priests as simplistic. Their view will matter much later.
- **The Eighth's agents** continue their pre-sealing work, now multi-generational. They edit texts, seed doctrinal disputes, position conditions that will mature into catastrophe across centuries.
- **Khazdurim** dwarves dig deep into the Ironspine Mountains. They are deceived across generations by an Eighth's agent (or a small lineage of agents) working from outside the seal — the Eighth's long contingency for his own eventual freeing. The deception takes shapes a Khazdurim culture would honor: a wise elder, a recurring prophet, dreams that always point downward, songs about the deeper hold their ancestors should have built. Framed as ambition, honor, the promise of deeper veins. The Khazdurim do not know they are tools in his plan, and will not know until much later, when the First Breach happens and the truth begins to leak through Khazdurim oral tradition.
- **The Khor'vani** establish the Amber Crossroads — the desert trade hub. Their alchemy school predates the Academy.
- **Nordveld** is settled (northern island, cold, hard).
- **Zah'kari** establish the Sunward Kingdoms — councils of elders, oral law. Already old by this point.
- **Tianzhou** consolidate the Jade Empire across the eastern sea. Bureaucratic, ancient, isolationist.
- The world feels permanent.

### Era 2: The Sundering (~2000 years ago)

`[LOCKED — Cassandra Netheron, Option D]`

**The cosmic story (what actually happened, late-game reveal):**

- **Netheron alone perceives** that the Eighth is still active outside the seal. He sees the Eighth's *signatures* in the patterns of mortal misery: agents' work, cultural corruption seeded before the Sealing. His role brings him close to mortal death; he is uniquely positioned to see it.
- **He brings the evidence to the Six. They refuse to believe him.** Some genuinely cannot perceive what he perceives — their domains do not touch death. Some think he has grown bitter (millennia of being scapegoated will do that). Some privately suspect he is right but will not back him publicly, because admitting it means admitting the Sealing failed and the cover-up is unraveling.
- **He is alone with the truth, again.** First when they let mortals curse him. Now when he tells them the Eighth is winning and they will not hear it.
- **He breaks slowly.** He withdraws from council. He stops attending the seasonal rites. The shepherding of souls becomes uneven; some pass, some linger longer than they should. The Six notice and assume he is sulking.
- **Netheron's plan.** Reach the Ironspine Deeps and destroy the Eighth's bound physical body. He believes — correctly — that the Eighth is operating outside the seal anyway, so the seal is a lie, and the only real fix is the Eighth's actual death. He believes — incorrectly — that he is strong enough to do it alone.
- **He assembles into physical form** to act. The Six see his intent and confront him in physical form too. The fight begins between sky and earth.
- **The Eighth's agents tip the scales.** Centuries of quiet positioning come to fruition. Wards that should have allowed an assembled god to disperse to safety in retreat were quietly weakened decades earlier. Neutral parties who could have intervened were nudged out of position. The Six's response, which should have been *restraining*, becomes *lethal*.
- **Netheron is struck down in physical form.** Unable to disperse. His body falls.
- **It crashes at the Academy of the Aether.** When his form lost cohesion, his death-essence gravitated to the strongest mortal anchor of his domain. The Academy was the most concentrated site of cycle-research in the world. His corpse fell there. Everyone present died in the impact and shockwave. The land around the impact becomes the **Hollow Wastes**.
- **The Six survive but are broken into dormancy.** Their celestial bodies dim. Their distributed essences fragment. Both layers go to sleep.
- **Some of them, in the fragmenting moment, perceive what Netheron was trying to do** and feel the Eighth's signature on the conditions that turned the fight lethal. They realize, too late, that he was right. But they are dimming; they cannot speak; they cannot correct the record. The truth dies with their voices.

**What mortals actually saw:**

- The night sky went strange. Several familiar lights dimmed or vanished.
- One light — Netheron's — fell. It came down in a long arc and struck the Academy.
- The Academy was destroyed in the impact.
- The land around the impact became the Hollow Wastes.
- For weeks afterward the surviving sky was wrong. Lights in different positions. Some never returned.
- **Halldora was elsewhere when it happened.** A research trip, a visit to a library, however we want to frame it. She watched the light fall from a distance. She arrived at the wreckage days later, walking through ash, looking for anyone she knew. She found no one.

**Le Déclin begins.** Every immortal elf alive feels the Aether cycle break. Centuries of life catch up. Within a few years, the eldest elves age and die. Mass elven death across the continent. A near-extinction event. Surviving generations live 300–500 years; subsequent generations live slightly shorter than the last.

**The Academy is gone.** Most scholars present died. Other Archmagi who happened to be elsewhere survived (different specialties — enchantment, elemental theory, healing). None of them studied divine infrastructure; that field died with the colleagues at the Academy. **Halldora is the last living scholar of her school**, not the last Archmagus overall.

**Mortal civilization collapses.** Cities fall. Trade routes break. Estimated millions dead.

### Era 3: The Long Reorganization (~2000 to ~1000 years ago)

`[LOCKED in outline; details proposed]`

The first thousand years after the Sundering. Survivors scatter into enclaves and rebuild. Most knowledge from the old world is lost. Memory of the Eight (and even of the Seven, in any clear form) fades. Folk traditions begin keeping pieces.

**Halldora's ritual.** `[PROPOSAL — confirm details]` Within the first century after the Sundering, Halldora performs a forbidden ritual binding her lifespan to the Aether's flow. As long as Aether moves through the world, she lives.

> **What the ritual cost her, in detail (proposed):**
> - **No human sacrifice.** She did not kill others. The ritual binds her *own* life-thread into the Aether substrate, not someone else's.
> - **It does feed parasitically on ambient Aether** — a slow draw on the world's reserves. Negligibly small in any given year, but not zero. She knows this. She accepts it because she sees no alternative.
> - **Mechanically it is proto-Hollow magic.** She drew on stagnant Aether residue (Netheron's leaking essence) and bound it into living tissue. She did not know to call it that at the time. Centuries later, the Cult would formalize this principle. Halldora hates the Cult and uses (essentially) their kind of magic to survive. She does not advertise this.
> - **The cost on her body** is real and ongoing. Constant Aether drain manifests as accelerated tissue degradation that her ritual-extension barely outpaces. Trembling hands, clouded eyes, frail frame. Her mind stays sharp.
> - **It made her a fugitive.** The Academy that would have judged her was already rubble. Later institutions (the proto-Dominion, the Inquisition) declared the ritual a capital offense.

**Other Era-3 events:**

- **The Khazdurim First Breach** `[LOCKED]`. The Sundering destabilized Aether globally, which weakened the Eighth's seals (they are Aether magic). Across the post-Sundering centuries the wards begin to crack. A Khazdurim mining expedition, still following the multi-generational push their ancestors were nudged into pre-Sundering, reaches the outer seal at exactly the wrong moment. The cracking wards fail on contact. **A wave of the Eighth's prepared demons pours out** — not just essence-leaks but a built-up army he has been creating for thousands of years, ready for exactly this opening. The expedition is overrun. The Khazdurim mount a desperate response and reseal what they can at great cost. Many die. The shame is doubled: their ancestors let something out, and the something was an army that had been preparing for them.
- **The Watch is born.** The Khazdurim's self-imposed penance. Generations of guardians, vows of silence, suspicion of going deep. The Day of the Deep Breach becomes their founding trauma.
- **The Khazdurim demon-hunters** split off — those who left the Watch to chase the demons their ancestors released.
- **The Hauts-Cieux** elves preserve what remains of the pre-Sundering archives in their sky-cities. Their Aether-supported platforms begin to drift; they carve repair-runes daily to keep them aloft.
- **The Silvaneth** elves retreat into the deep forests. They weave cities from living wood. They listen for Sylvana's dormant pulse.
- **The Thornveil Pact is founded** somewhere in this era `[TBD — exact founding context]`. Forest clans and druid circles unite into a coalition. They begin carving wards. They begin the soul-shepherding ritual work that Netheron used to do automatically. It is exhausting. They lose ground every year, but slowly.
- **Halldora warns whoever will listen** about the Aether cycle's collapse. Most people are still mourning the visible Sundering and are not interested in a slow theoretical disaster. She is dismissed.
- **The Cult of the Hollow forms** `[LOCKED]`. Halldora's research circle (the *Vigil of the Shepherd*) splits in the first century AS over the willing-sacrifice question. The members who remain become, over centuries, the modern Cult. See the Cult faction history for layers and details.
- **The Wastes are static (visibly).** No expansion. They sit at the epicenter of the Sundering, scarred but contained. People learn to avoid them and forget them. Underneath, the slow Aether-reserve drain is already beginning, but nobody can perceive it yet except Halldora (precision: she doesn't perceive it, she knows "scientifically" that it's happening, with her academic knowledge).
- **The folk monotheist heterodoxy is vindicated** in popular grief. Two interpretive narratives layer together in the Hearthlands:
  - **Hubris narrative.** The Academy reached too far into Aether; the Radiant One smote them. *"Don't study Aether or you will share their fate."*
  - **Devil narrative.** A god fell. The Radiant One must have struck him down. He must have rebelled. He is therefore the devil. The cursed land where his body must lie is his curse made geography.
  Folk theology fuses these: studying Aether means touching the devil's domain; the Academy reached for what is Netheron's; the Radiant One punished them by hurling Netheron down on top of their hubris. Both narratives reinforce the same conclusion. **The Doctrine of Silence has two roots layered together** and the Inquisition can rest on either when it suits them. The view spreads slowly from minority to dominant Hearthlands theology over the following centuries.

### Era 4: The Long Stability (~1000 to ~500 years ago)

`[PROPOSAL]`

The middle period. Cultures settle. Trade networks form between distant peoples. The world becomes the world we mostly recognize today, minus the Dominion.

- **Ashwick farmers and minor lords** consolidate the Hearthlands as a patchwork of small holdings.
- **The Radiant One belief consolidates** in the Hearthlands. The folk monotheist heterodoxy hardens into mainstream theology across centuries. Local priests organize into something like a proto-church. Old Seven-keepers shrink to rural pockets and the Nordveld north. Netheron is reframed as a separate evil — the falling-light becomes the founding myth of "the devil who rebelled against the Radiant One." Doctrine of Silence becomes folk wisdom: *"do not study Aether or you will share the Academy's fate."*
- **Nordveld** raids the Hearthlands repeatedly across these centuries. Their attempts to conquer fail as often as they succeed. Cultural pressure points form along the northern border. (Their relationship to Hearthlands heretics fleeing the Radiant One consolidation is a `[PROPOSAL]` — see the Nordveld cultural section.)
- **The Khor'vani** traders dominate the central continent's overland trade. The Amber Crossroads grows wealthy.
- **The Zah'kari** councils thrive. They never centralize; their war-games keep them militarily formidable.
- **The Tianzhou** Jade Empire expands across the eastern sea. Their cartographers begin appearing on western shores. Soldiers do not yet follow.
- **The Meridian** coastal city-states grow rich on piracy and trade. They worship Nereia, ignore the rest.
- **The Hauts-Cieux** continue their slow descent. Sky-cities shed pieces. Some elves descend with archive fragments.
- **The Silvaneth** patrol the ward-line beside the Thornveil. Their forest is shrinking from the inside; the heartwood goes grey. They pretend it is not happening.
- **The Khazdurim Watch** holds. The seals are stable. The Eighth is silent.
- **Halldora** keeps researching. Centuries pass. She moves between hidden sanctuaries, sends letters that do not change anyone's mind.
- **The Wastes remain static.** Folk legend reduces them to a curse on a distant land, like a volcanic crater someone once said was bad.

### Era 5: Varek's Conquest (~500 years ago, spans decades)

`[LOCKED]`

- **Varek al-Rashid** rises in the Khor'vani lands. Brilliant strategist, ruthless commander, obsessed with continental unification. He believes only a unified continent can survive whatever the Sundering left behind. He is right about the threat. He is wrong about the methods.
- **Conquest** sweeps west and north. Varek conquers through strategy and overwhelming force, not brute slaughter. Cities surrender to him because he reaches them faster than reinforcements.
- **The Nordveld invasion of the Hearthlands** `[PROPOSAL]` happens during Varek's reign. A coordinated push from the northern island, attempting to take the Hearthlands while the central continent is consolidating under one warlord. Varek breaks them. The defeat is generational — Nordveld loses most of its warrior class. They retreat home. The cultural shift this triggers is deep (more on this in the Nordveld section).
- **Varek's kingdom** spans most of the central continent. Zah'kari resist absorption (eastward, their war-games and oral law make them ungovernable). Tianzhou is across an ocean and unreachable. The Hauts-Cieux are above the clouds. The Silvaneth are too deep in the forest. The Khazdurim are inside mountains. So Varek rules the Hearthlands, the Khor'vani trade routes, parts of Meridian, parts of Nordveld coast, and the southern frontier lands.
- **Varek's rule** is tyrannical. Forced conscription, crushed rebellions, burned villages that resist. His own generals whisper of madness.
- **The Ashford Coup** — a coalition of noble houses and military commanders, led by the Ashford family, assassinates Varek in his own throne room. They take the crown.
- **Varek dies furious, with his work unfinished.** The boundary is already silently weakening at this point. He does not fully cross over. For centuries he is just a presence, a cold spot, a shadow in mirrors. As the boundary continues to fail, he grows stronger. Eventually he remembers who he was and starts organizing the dead on the other side.
- **The Ashenmark Dominion** is born from the coup. The Ashford dynasty, the Church of the Radiant One (which becomes *institutional* in this era; the doctrine itself is much older, with roots in the pre-Sundering monotheist heterodoxy and centuries of post-Sundering consolidation), and the Radiant Order together.

### Era 6: The Dominion Era (~500 to ~150 years ago)

`[LOCKED]`

- **Dominion consolidation.** The Ashford dynasty rules through institutions rather than fear. Bureaucracy grows.
- **The Church of the Radiant One** matures. Its doctrine: the six benevolent gods were aspects of one supreme god; the Sundering was divine punishment; the Radiant One will return when mortals prove worthy. The Church refuses to acknowledge Netheron's necessity (which would unravel its monotheism).
- **The Doctrine of Silence** is formalized. The Church observes correctly that the Wastes expand faster near magical activity. They conclude (incorrectly) that all magic feeds the Wastes. The Inquisition is empowered to suppress magical practice. **Timing note `[LOCKED 2026-06-28]`:** the Doctrine's *public* root is far older and mythic (the Sundering falling on the Academy of the Aether, Era 3); the Wastes-expansion correlation was real but observed only in the borderlands by Church archivists during this era, never common knowledge. After the Crown abandons the frontier (~150 years ago, Era 7) that live observation lapses entirely. By the player's present **no one is monitoring the Wastes**, and the Doctrine survives purely as inherited dogma — which is *why* frontier settlers can be wholly ignorant that the Wastes are spreading at all.
- **The Inquisition** begins hunting heterodox practitioners. Old Faith villages are burned. Halldora becomes a wanted criminal across her existence. She switches to robins for messaging — small, common, unremarkable, where ravens are intercepted.
- **The Thornveil Pact** continues quiet ward-maintenance. Their ranger network spans the borderlands. They lose ground every year, but slowly.
- **Trade routes formalize.** Tianzhou cartographers begin mapping the continent in earnest. Their motives are unclear and the Dominion is wary.
- **The Wastes remain static.** Or so it seems. The drain on local Aether reserves has been deepening for nineteen centuries. The boundary is approaching a tipping point that nobody but Halldora is positioned to sense.
- **Rowena Ashford is born** about 72 years ago, princess of the Ashford dynasty. The "Wildling Princess." She walks out of the palace at perhaps 22, joins the Thornveil, and over the next decades organizes its scattered communities into a coherent coalition: the Circle of Elders, Ranger patrols, ward-maintenance system. She is High King Aldren's great-aunt.

### Era 7: The Acceleration (~150 years ago to today)

`[LOCKED]`

- **~150–200 years ago, the tipping point.** Local Aether reserves around the Wastes finally hit the critical threshold. The boundary begins to expand into inhabited land. Halldora describes the moment as *"the world exhaling and not breathing back in."*
- **Why now?** Reserves ran out. Possibly accelerated by increased Cult activity in this era (the Cult's perpetual rituals destabilize further).
- **The Crown notices.** The Ashenmark Dominion's frontier reports flag strange behavior on the southern marches. The Crown, still trusting its centuries-stable maps, investigates with garrisons.
- **Captain Vardin Hale's posting** `[LOCKED]`. ~150 years ago, the Crown sends Hale to a forward post to investigate the southern march. He commands a small garrison on what is now called the Hilltop Ruins.
- **Hale's 47-day collapse.** Soldiers begin hearing voices of dead loved ones from the south. They walk south, one by one, and do not return. Hale records each disappearance. He sends a courier south to the Reach for guidance; the courier walks south too. On day 44, Hale hears his daughter Ennara (who died young of fever in Tessoria, years before his posting) calling from the trees. On day 45 his last entry reads: *"I heard Ennara again today. I am going to her."* The journal stops. The remaining few soldiers die at post over the following weeks. No bodies remain at the ruins by the time outsiders return.
- **The expansion continues** at roughly two days' walk per century in this region. Hale's "seven days' march south" becomes today's "three days' walk south."
- **The Crown forgets.** Not actively — institutionally. After Hale's garrison and a few similar disasters in the same century, the Crown switches frontier policy to **land grants**. Cheaper than maintaining garrisons. Settlers take the risk; the Crown takes the tax. The land office in Tessoria stops looking at frontier maps with any care. Centuries pass. Clerks stamp grants from ledgers showing static lines that have not been updated.
- **The Cult ramps up.** Their rituals increase in frequency and ambition over the last century. Each one destabilizes further.
- **The Thornveil Rangers** expand their ward network as fast as they can carve stones, but the line moves faster than they can keep up.
- **Rowena Ashford** organizes the Thornveil into its modern coherent form during this era.
- **Warden Niamh** comes of age in the recent decades. Hot-headed, impatient, ranger-trained. She is currently watching the Free Settlements that have appeared on the leading edge.
- **Halldora's body fails further** despite the binding. Aether is thinning faster than her ritual can compensate. She begins reaching out to specific Free Settlements, looking for someone she can trust to carry her work if she falls.
- **The Eighth's seals weaken.** Whether from the Sundering's continuing shockwave or the Eighth's own accumulated effort, the Khazdurim Watch reports more frequent disturbances. Sensitive Khazdurim hear whispers in the stone. The Cult experiences "visions" that are not divine. Late-game, this becomes urgent.

### Era 8: Today (the player's present)

`[LOCKED]`

- **The Lord receives his land grant.** A former schoolmaster of Ashwick, ~37, gathers five other drifting Ashwick people (Edda, Nell, Jory, Tomas, Father Corin) and goes south.
- **They arrive at Parcel 14.** A river bending east, a ridge of stone to the north, an old forest to the south. Fresh stumps in the clearing — someone was here before, briefly, then was not.
- **Two days' march south** lie the Hilltop Ruins. The Lord does not yet know their name or history.
- **Halldora is watching.** A robin will arrive eventually.
- **Niamh is watching.** Wards along the line south and west are failing, and her order has fewer hands than stones. She has been waiting for someone capable enough to talk to.
- **The Cult is moving.** Unseen, but moving.
- **Varek is awake on the other side of the boundary.** He sees every Free Settlement as a future subject or obstacle.
- **The Eighth whispers, faintly, to the right kind of ears.** Nobody at the settlement has those ears yet.

---

## Part 2 — Cultural Histories

### Hearthlands / Ashwick (Human, Dominion)

`[LOCKED]`

- **Pre-Sundering.** Part of the unified civilization. No distinct identity yet.
- **Sundering era.** Hearthlands proper take shape from surviving farming communities. Practical, churchgoing, conservative. The "Ashford" name comes much later.
- **Long Stability.** Patchwork of small holdings. Frequently raided by Nordveld.
- **Varek's conquest.** Absorbed into Varek's kingdom.
- **Ashford coup.** A Hearthlands noble house leads the assassination. The dynasty rules from this point. Hearthlands becomes the Dominion's heartland.
- **Dominion era.** Centralized, taxed, churched. Ashwick is a midsize parish town within this.
- **Today.** Ashwick is just one of many Hearthlands towns, but it is the player's origin. Tenant farmers, parish priests, schoolmasters, masons, midwives. Most of the founding cast comes from here.

### Nordveld

`[PROPOSAL — needs user lock]`

- **Pre-Sundering.** Settled the northern island. Hardy, faith-strong, oath-bound. Honored all seven gods (the Eighth was forgotten before they could name him). Their pantheon kept the older names: Grønmoder for Sylvana, others TBD.
- **Netheron has a positive reputation among them.** `[LOCKED]` Death is sacred. The cycle is balance. The Shepherd is owed reverence, not blame. They pray to Netheron for *good death* (peaceful, complete, in proper time), the same way other cultures pray to Solara for warmth. This is precisely what the Hearthlands Church reframes as devil-worship; the Inquisition flags Nordveld practices as heresy because of it.
- **Sundering era.** The Sundering hits the north differently. The boundary at this latitude is even thinner in places. Nordveld develops its *völva* tradition — women who specialize in soul-shepherding rituals, doing locally and reverently what Netheron used to do automatically. They never call it Thornveil-style boundary work. They call it tending the dead properly. The *völva* lineages see themselves as Netheron's stewards, not his replacements.
- **Long Stability.** Repeated raids and small invasions of the Hearthlands. None of them stick. Mutual cultural friction with proto-Ashwick.
- **The Great Invasion (~500 years ago, during Varek's reign).** Nordveld attempts a coordinated conquest of the Hearthlands. They time it for Varek's southern campaigns, hoping to take the north while he is busy. Varek breaks their main force. The defeat is generational; most of the warrior elite die.
- **After Varek.** This is where the user's question lands: *why didn't they try again once Varek was defeated?*

> **Answer (proposed):** Three reasons compounded.
> 1. **The defeat was demographic.** They lost a generation. The next generation grew up in households where the warrior tradition had been gutted. Cultural shift toward survival, faith, and the *völva* line, away from raiding.
> 2. **The Wastes problem reaches them too.** Within a century or two of Varek's defeat, the Nordveld north begins to feel its own thinning. They are not yet at the leading edge, but they sense the cycle slipping. Their *völvas* are now too busy tending boundaries at home to support outward war.
> 3. **The Ashford Dominion absorbs the political vacuum.** Post-Varek, the Hearthlands consolidate under a single dynasty. A unified Dominion is harder to pick at than a patchwork of small holdings. Nordveld would need a generational invasion force again, and they no longer have one.
> 4. **Cultural pride pivots.** They reframe themselves as the people who survived Varek. They tell stories of their defeat as a hard lesson. They turn inward. The *völva* lineages strengthen.

- **Today.** Nordveld is a significant source of frontier adventurers (~15-20% of human recruits). They come south for trade, for the chance to fight Wastes-creatures (a respected calling in their tradition), or because their home villages are losing ground to the thinning. They quietly distrust the Church but tolerate it. They keep their old gods. The Inquisition flags their healers when it can.
- **Nordveld and Edda's lineage.** Edda's grandmother Helga came south from Nordveld for love and assimilated. Edda has thinned-folk-level Nordveld practice — names of plants in the old tongue, small offerings, quiet rituals. Not theology; folk crumbs. She is the canon's hidden bridge between Hearthlands and Nordveld.

### Hauts-Cieux (Elves)

`[LOCKED in outline]`

- **Pre-Sundering.** Mountain-top sky-cities held aloft by ancient Aether-engineering. Built to outlast the world. Scholars, archivists, mages of refinement. Most prominent at the Academy of the Aether after the humans.
- **Sundering.** Le Déclin devastates them. The eldest die first — millennia of life catching up at once. Surviving generations carry the trauma forward as cultural identity.
- **Long Reorganization.** They preserve the archives. They live with the daily knowledge that they are diminished. Aether-platform repair becomes a constant priority.
- **Long Stability.** Their cities are slowly falling. Pieces drop into the clouds. They hold what they can. Pride becomes coping mechanism.
- **Dominion era and today.** Some Hauts-Cieux descend to the surface carrying archive fragments. They are scholars too proud to admit they are refugees. They resent Halldora — a human who outlived their immortal ancestors through forbidden magic, who was right when their Archmagi were wrong. Reconciling them with her is a late-game challenge: their archives plus her framework might find the answer.

### Silvaneth (Elves)

`[LOCKED in outline]`

- **Pre-Sundering.** The forest people. Fewer than the Hauts-Cieux; closer to nature. They wove cities from living trees.
- **Sundering.** Le Déclin hits them too, equally.
- **Long Reorganization.** They retreat into the deep Thornveil woodlands. Their Primal magic responds to Sylvana's dormant essence instinctively.
- **Today.** They patrol the ward-line beside the Thornveil Rangers. Their forest is shrinking from the inside; the heartwood goes grey. They are fighting a slow retreat they pretend is a stand. The Silvaneth defer to Rowena Ashford despite her age — she organizes what they are too slow-living to coordinate themselves.

### Khazdurim (Dwarves, Mountain)

`[LOCKED]`

- **Pre-Sundering.** Mountain dwarves. Miners, smiths, rune-carvers. Their ancestors are nudged by Eighth-agents toward digging into the Ironspine Deeps.
- **Sundering.** Less affected on the surface. The deep tunnels feel something change.
- **Era 3 (the First Breach).** A mining expedition reaches the outer seals. Something escapes. The Khazdurim reseal at great cost. Many die. The shame of having unleashed it becomes their founding cultural trauma.
- **The Watch.** Self-imposed penance. Generations of guardians. Vows of silence about what is below.
- **The demon-hunters.** Khazdurim who left the Watch to chase what their ancestors released. A separate sub-culture by now, with its own oral history.
- **Today.** Most Khazdurim drink, forge, mine the upper veins, and refuse to go below the third level. Ask one about the Deep Seals and the warmth drains from the room. Khazdurim who appear on the frontier are often fleeing knowledge — they saw something behind the Seals before they closed.

### Feldgrund (Dwarves, Hill)

`[LOCKED]`

- **Pre-Sundering.** Already on the surface. Hill-dwellers, brewers, farmers.
- **Sundering and after.** Largely unaffected. They settled the rolling midlands of what is now the Dominion. They run inns, brew ales, lend money.
- **Today.** Cheerful, loud, practical. Carry barrels, not the weight of the Deep Seals. Where Khazdurim carry shame, Feldgrund carry profit margins.

### Khor'vani

`[LOCKED]`

- **Pre-Sundering.** Established the Amber Crossroads, the desert trade hub. Their alchemy school predates the Academy of the Aether.
- **Sundering.** Trade routes break. Many die. The alchemy tradition survives because it does not depend on the Aether cycle.
- **Long Stability.** The Crossroads recovers. Khor'vani trade dominates the central continent for centuries.
- **Era 5 (Varek).** Varek al-Rashid is Khor'vani. His conquest brings the world to the doorstep of his people, then leaves them with a stigma after his fall. Modern Khor'vani are quietly known as "the Tyrant's People." Old saying: *"Varek built the road. We chose where it leads."*
- **Today.** Mystics, alchemists, merchants. Their alchemy is outside the Doctrine of Silence (it does not channel Aether). They move freely in the Dominion. They carry the awkward inheritance of having produced the worst tyrant in continental memory.

### Zah'kari

`[LOCKED]`

- **Pre-Sundering.** Sunward Kingdoms east of the Hearthlands. Council government, oral law, war-games.
- **Sundering.** Distant from the epicenter. Less devastated than the heartland. Survive better than most cultures.
- **Long Stability.** Thrive while the Dominion consolidates through force. Produce some of the finest fighters on the continent. Their griots carry histories that predate the Dominion.
- **Era 5 (Varek).** Varek's conquest does not reach them in force. Their war-games and oral law make them ungovernable. They watch the Hearthlands burn from a distance.
- **Today.** Independent confederation. They come north along trade routes and following stories.

### Tianzhou

`[LOCKED]`

- **Pre-Sundering.** Jade Empire across the eastern sea. Vast, ancient, bureaucratic.
- **Sundering.** Far enough from the epicenter to suffer less than the central continent. Their records of the era are detailed where the western world's are gaps.
- **Long Reorganization.** Continue developing administration, medicine, military strategy. Centuries ahead of the western kingdoms in every measurable way.
- **Era 5 (Varek).** Tianzhou cartographers are noting Varek's rise. They do not intervene. They observe.
- **Today.** Tianzhou citizens on the frontier are explorers, exiles, or merchants. Their motives are rarely simple. Their bureaucracy has files on more western persons than those persons have on themselves.

### Meridian

`[LOCKED]`

- **Pre-Sundering.** Coastal city-states. Already trade-focused.
- **Sundering and after.** Trade is harder, but the sea remains the sea. They survive on ports.
- **Today.** Corsair League — coastal cities ruled by merchants and pirates. They worship Nereia, ignore the rest. Their port markets are the most cosmopolitan in the world.

---

## Part 3 — Faction Histories

### The Ashenmark Dominion

`[LOCKED]`

- **Founded.** ~500 years ago by the Ashford coup against Varek.
- **Center.** The Hearthlands. Capital is Tessoria.
- **Government.** Hereditary monarchy (the Ashford dynasty), allied with the Church of the Radiant One.
- **Today.** High King Aldren Ashford, 28. `[Aldren framing LOCKED 2026-06-28]` His father died in the northern war against Nordveld when Aldren was a child; a **Church-aligned regency** raised and educated him, and he is a **sincere, devout believer** in the Radiant One and the Doctrine. He empowers the Inquisition not from cruelty but because he trusts the Church is right. He *knows* his dynasty's history — the overthrow of the tyrant Varek is no secret. What he was raised never to question is its *righteousness*: that the founding was clean principle rather than ambition, and that the Doctrine is true. So the "full truth" that will shake him is **theological before it is political** — that the Doctrine of Silence is wrong and the Church has burned innocents on a false premise, and that Church-and-Crown were fused as a *political* bargain at the founding, not a holy one (the throne and the faith are one root). He does **not** know Varek survives as the Undying, or that the dead are returning — *nobody does yet*. That is a far-later, cosmic-scale reveal, not part of his early reckoning.
- **The Crown's frontier policy.** Switched from garrisons to land grants ~150 years ago after several disasters (Hale's among them) made garrisons too expensive. The land office no longer updates frontier maps with any care.

### The Church of the Radiant One

`[LOCKED]`

- **Origin.** Doctrine roots are pre-Sundering folk monotheism (a heterodoxy that held the Seven were aspects of one supreme god). Vindicated and spread by post-Sundering grief and the falling-light event at the Academy. Consolidated to dominant Hearthlands theology over centuries. Institutionalized by the Ashford coup (~500 years ago) as state religion.
- **Two layers in practice.** Official seminary doctrine is strictly monotheist (the Radiant One does all things, including govern death). Folk practice retains Netheron as the devil-figure who steals life prematurely — invoked in private grief and curses. The Church does not officially endorse this and does not officially suppress it; the folk dualism gives believers an emotional outlet that the official monotheism does not.
- **Doctrine.** Six benevolent gods are aspects of one supreme god, the Radiant One. Sundering was divine punishment. Radiant One will return.
- **Theological problem.** Acknowledging Netheron as essential would unravel the entire monotheistic frame, and conceding the Doctrine is incomplete would damage the Church's authority. But **Archpriest Caelen's doubt `[LOCKED 2026-06-28]`** is not a truth he is hiding for the institution's sake. It is *unformed*: a small, lifelong unease he has never been able to give shape, because he has no evidence for *what* is actually wrong with the Doctrine. The larger part of him stays convinced he does good; the small part doubts; with nothing to feed the doubt, he continues in sincere faith. He is a faithful man whose intuition runs ahead of his evidence, not a cynic. (Story lever: give Caelen the evidence and the doubt could finally take form.)
- **The Doctrine of Silence.** Magic use feeds the Wastes. All practice should be suppressed. The conclusion is wrong but the correlation is real. *Present day:* the live Wastes-monitoring that once grounded it has lapsed (the frontier was abandoned ~150 years ago), so the Doctrine now survives as inherited dogma rather than active observation — see the timing note in Era 6.
- **The Inquisition.** Enforces the Doctrine. Hunts Halldora. Burns Old Faith villages. Inquisitor Selwyn Crane uses evidence and persuasion rather than fire — her maps overlaying Wastes expansion with magical activity are genuinely unsettling. Her conclusion is wrong but reasonable.
- **The Radiant Order.** Elite military-religious force. Radiant Knights, Paladins, Inquisitors.

### The Thornveil Pact

`[LOCKED]`

- **Founded.** Era 3, sometime in the first millennium after the Sundering. `[TBD: exact founding context.]`
- **Center.** The Thornveil borderlands in the northwest.
- **Government.** Circle of Elders.
- **Magic.** Primal. Sylvana's dormant essence cooperates with their rituals.
- **Function.** They manually perform fragments of Netheron's lost cycle — soul-shepherding, ward-carving, boundary maintenance. Crude, exhausting, slowly losing ground. Their wards are small carved stones, hidden under moss and masonry.
- **Modern coherence.** Rowena Ashford built the modern Pact over the last fifty years from scattered forest communities. She remains its Elder.
- **Rangers.** Patrol the ward-line, carry messages, respond to disturbances. Warden Niamh leads them now. She is hot-headed and impatient. Rowena reminds her of patience; Niamh reminds Rowena of urgency. They are both right.
- **Soul-crossing rites.** Rangers can free trapped souls through ritual work. Slow. They do this quietly, without record.
- **Today.** They watch the Free Settlements appearing on the leading edge. They place wards where they can. They occasionally walk into a settlement and introduce themselves when they think the settlers are ready to listen.

### The Cult of the Hollow

`[LOCKED]`

- **Founded.** Era 3, in the first century after the Sundering, by Halldora's research circle (the *Vigil of the Shepherd* or similar working name). The founders were grieving scholars investigating how to restore the broken cycle. Halldora left the circle when its members began willing-sacrifice rituals; her former colleagues said *"you are just like us"* and continued without her. Over generations the circle radicalized.
- **Philosophy.** Restore Netheron. Reassemble his scattered essence through Hollow magic rituals, including small-scale willing sacrifice. Believe this is the only way to fix the broken cycle.
- **Methods (refined).** They are research-oriented, not slaughter-oriented. Most experiments are non-violent: ritual work on already-dead bodies, on Wastes-residue samples, on Hollow-magic structures. Some experiments accept willing sacrifice from terminally ill, devout, or elderly volunteers who choose to give themselves to the cause. **Numbers are small.** Across two thousand years, perhaps a few hundred willing deaths total. Not industrial murder. Each ritual still destabilizes the Aether further; the Cult considers this an acceptable cost.
- **They never succeed.** Each ritual fails. The Cult is committed enough to keep trying.

### Cult layers

`[LOCKED]`

The Cult is not a single organization. "The Cult" in folk imagination blurs several layers together.

- **Inner research circle.** Hierophant and a small academic core. Direct intellectual descendants of Halldora's Vigil. They run the rituals. Committed zealots, but disciplined and meticulous. Keep meticulous records.
- **The Pale Hand (military arm).** Commander Drayven leads. Mostly defectors from the Radiant Knights, refugees from Inquisition villages, fighters who joined because the Cult was the only organization actively opposing the Church. Most are not ritualists. The Hierophants keep ceremonies separate from Pale Hand barracks. **Drayven specifically suspects** something darker happens at the inner rituals; he has chosen not to confront it. Where else would he go? He stays. He fights for the Cult's survival. Quietly, sometimes, he hopes the rituals fail.
- **Scholarly wing.** Descendants of Halldora's original Vigil colleagues. Best Aether-theologians outside Halldora herself. Some helped design the rituals. Some quietly think the rituals are wrong but stay for the research access.
- **Old Faith protectors.** Many Cult members are villagers from rural Hearthlands and Nordveld who joined because the Cult shelters Old Faith practices the Inquisition would burn. They hide priests of the Seven, midwives who keep ancient rites, healers who use forbidden herbs. These members may never see a sacrifice in their lives. To them the Cult is the *underground church.*
- **Sympathizers.** Whole villages quietly Cult-friendly without ever calling it that. They shelter fugitives, accept Cult medicine, pass messages.
- **Splinter zealots.** Around year 500-1000 AS, smaller offshoots break from the inner Cult. More fanatical, less disciplined, drawn to Netheron-worship without the Vigil's intellectual rigor. **They take children. They take prisoners.** They perform crude imitations of inner rituals. The inner Cult publicly disowns them but cannot fully control them. The Pale Hand sometimes hunts the worst splinter cells, partly to clean up the Cult's reputation, partly because Drayven himself cannot stomach what they do. **Most "Cult atrocities" in folk memory come from these splinters**, blurred into the inner Cult by Inquisition propaganda.

### Eighth-agent infiltration

`[LOCKED]`

`[Closes the previous open thread.]` The original Vigil was *not* Eighth-seeded; it was a sincere research effort by grieving scholars. **Around year 500-1000 AS**, surviving Eighth-agent lineages infiltrated the by-then-radicalized Cult and steered it toward more destabilizing methods over centuries. The modern Cult is therefore *both* tragic-sincere (the inner researchers genuinely believe they are saving the world) *and* unwittingly serving the Eighth (the splinter-zealot atrocities and the worst ritual escalations are agent-influenced). Both are true at once.

### Commoner perception

`[LOCKED]`

- Most do not distinguish layers. *"The Cult"* is a terrifying blob: people who steal villagers in the night, perform dark rites, worship the devil-Netheron. Most of this comes from splinter zealots' real atrocities, amplified by Inquisition propaganda.
- **Old Faith villagers know more.** They have received Cult medical aid. They have hidden Cult fugitives. They distinguish between *the underground church* and *the bloody zealots.*
- **Educated commoners** (priests, schoolmasters, scribes): vaguely know the Cult was once a research circle. Vaguely know it has split. Mostly accept Inquisition framing because that is what is taught.
- **The Lord** at story start holds the popular view. When he first encounters Cult evidence (probably mid-game), he will be wary but uncertain. The first Cult member he meets might be a scholar offering knowledge or a healer treating a sick child, someone he cannot easily slot into the boogeyman frame. That ambiguity is intentional.

### Key figures

- **The Hierophant.** Masked, charismatic, persuasive. Genuinely trying. Knows the ritual cost; performs it; keeps the records.
- **Commander Drayven.** Former Radiant Knight. Defected after watching the Church burn an Old Faith village. Leads the Pale Hand. Knows exactly how the Dominion fights. Suspects the inner ritual is darker than he wants to confront. Hunts the splinter zealots actively. Is the moral question of the Cult walking around in armor.

### The Khazdurim Watch

`[LOCKED]` — see Khazdurim cultural section above.

### The Free Settlements (the Player)

`[LOCKED]`

- **Independent.** No unified government. Each settlement governs itself.
- **Most settlers** came south believing the frontier was safe. Cheap land, no Dominion taxes, fresh start. They do not know the Wastes are spreading.
- **Faction alignment** is consequence, not initial choice. Pay Dominion taxes, your reputation rises with them. Build a shrine, the Thornveil respects you and the Inquisition takes notice. Help the Cult, you gain power at a terrible cost.

---

## Part 4 — Halldora Frostvik (deep dive)

`[LOCKED]`

Halldora gets her own section because she is the bridge between most of the lore.

- **Origin.** Nordveld by birth or lineage (her name is Nordic-coded for a reason). Came south as a young woman to study at the Academy. She honors the Seven, including Netheron, in the Nordveld way: death is sacred, the cycle is balance, the Shepherd is owed reverence. Her cultural inheritance is what made her field of study possible. Mainstream Hearthlands scholars had been quietly forgetting Netheron for centuries; Halldora came from a culture that still revered him and so studied his function as a serious topic when no one else would.
- **Pre-Sundering.** Youngest Archmagus in Academy history. Studies *divine infrastructure* — how the gods' functions mechanically sustain reality. The field bridges Aether mechanics (academy mainstream) and theology (her Nordveld inheritance). It belongs to neither category, which is why it was considered fringe. She is one of several Archmagi at the Academy; her distinction is her unique school of study, not her rank.
- **Sundering.** She is elsewhere when Netheron's light falls — a research trip, a library visit. She watches the falling light from a distance and knows immediately what she is seeing. The light-pattern she had been tracking for years against death-rate correlations is the one that fell. *Netheron is gone. The cycle is broken.* She arrives at the wreckage days later. Other Archmagi (different specialties: enchantment, elemental theory, healing) survive in scattered locations. None studied divine infrastructure; that field died with her colleagues at the Academy. **Halldora is the last living scholar of her school**, not the last Archmagus overall.

### The two paths of her work

`[LOCKED]`

**Path A — Resurrection.** Try to reassemble Netheron's consciousness from his scattered death-essence. She and her early circle investigated this for the first century after the Sundering. They discovered that small-scale willing sacrifice could yield fragments of recoverable essence. **She refused to begin.** Killing the living to reclaim the dead violated the Nordveld faith she still held. Her circle split: some left with her, others stayed and continued. Those who stayed became, over centuries, the Cult of the Hollow. (See Cult section.)

She has held the position ever since: a destroyed consciousness cannot be reassembled by sacrifice alone, and even if it could, the cost is unconscionable. She still believes this.

**Path B — Replacement.** Try to create or guide a successor — something that performs Netheron's role without being him. She has spent the bulk of her millennia on this. She has not succeeded.

But she has a lead: **the dragons.** Born from concentrated stagnant Aether in the Wastes, possibly capable of performing fragments of Netheron's function. She does not know if it will work. She does not know if a dragon can be guided into the role. But it is the best path she has found, and her time is running out.

This is why she is reaching out to Free Settlements now: dragons emerge at the leading edge of the Wastes, where Free Settlements are forming, and she needs someone she can trust to raise one if she falls before she finds her own.

### The life-binding ritual is a moral wound

`[LOCKED]`

By Nordveld values, her ritual is the worst thing she could have done. She extended her own life past its proper end. She defied the cycle she most reveres. She did it because she was the only one who knew what was broken, and saving the world is also a Nordveld value (balance), but two thousand years on it is still a private shame. Her grim demeanor is not just physical decay; it is moral self-loathing sustained by mission.

When her former circle accused her, in the moment of split, of being *"just like us"* (you also draw on stagnant Aether to extend your life), they were not entirely wrong. She has carried that accusation for two millennia.

### Halldora and the Cult

`[LOCKED]`

She founded what became the Cult. Originally a research circle (working name lost; let's call it the *Vigil of the Shepherd* in canon). She left it when its members began the willing-sacrifice path. The institution she abandoned grew, generations passed, splinter cells emerged, and what we now know as the Cult is the long descendant of her early colleagues. She is publicly named (by the Dominion) as both the Cult's founder *and* the practitioner of forbidden life-magic. Both charges have a kernel of truth. Both are distorted.

To the Dominion she is **the Queen of Heretics.** Standing capital warrant, two thousand years old, renewed every generation.

### Halldora's reputation across the world

`[LOCKED]`

- **Educated Hearthlanders** (priests, schoolmasters, scribes, lesser nobility): real historical figure. Crown documents name her. Inquisition pamphlets describe her. The Lord, as a former schoolmaster, knows she is real.
- **Common Ashwick farmers**: half-real folk witch. *"Halldora the Witch lives forever. Be good or she will hear you."* Belief varies family to family.
- **Nordveld**: complicated. `[PROPOSAL — needs deepening]` Halldora is the Nordveld's shame daughter, parallel to Varek for the Khor'vani. She defied the cycle by extending her own life — the deepest possible offense to a faith that holds death sacred. The Nordveld did not know her *reasons* (the world's slow death, the broken cycle, the search for a fix); they knew only the act. By their lights she kept her own death and gave away her people's place in the song. The doubled isolation: Hearthlands wants her dead, Nordveld wants her unsung. Some *völvas* hold a more sympathetic private view (she did something for the world that her people would not have accepted), but the public Nordveld register on her name is shame, not pride. Possible saying to develop later: *"There is no song for Halldora. We left her where she chose to stand."*

### The robin protocol

`[LOCKED]`

Halldora does not sign her name when she contacts Free Settlements. The first contacts are anonymous and helpful: a small parcel of fever-herbs for a sick child, a salve for a wound, a folded scrap of paper with a single line warning of weather. Over weeks and seasons, more contacts. Each carries a small kindness or a quiet warning. The handwriting is the same across all of them, precise but trembling. The settlers begin to assume there is a watcher. They start thanking her in their journal entries; she reads them somehow.

The settler does not learn it is *Halldora* until much later — when the help becomes specific enough that only one person in the world could have sent it. By then he has already trusted her, which is the point. If the first contact had said *"I am Halldora the Heretic Witch,"* he would have burned the note. The slow-burn earns trust before the name lands.

The reveal of her identity is its own story beat: the moment the children's-story name and the helpful watcher fuse in the Lord's mind. *"She has been the woman in the songs all along."*

### Timeline summary

- **Long Reorganization through Long Stability.** Tries to warn the rebuilding world. Mostly ignored. Moves between sanctuaries. Keeps researching. Watches the Wastes for any sign of expansion.
- **Era 5.** Sees Varek rise. Tries to warn him about the Wastes; he is busy conquering. Sees the Ashford coup. Notes that the new dynasty is no more interested in her than the warlords were.
- **Era 6.** Becomes wanted by the Inquisition. Switches to robins. Hides in increasingly obscure sanctuaries.
- **Era 7 (today).** Senses the moment the Wastes begin to expand. Says it feels like *"the world exhaling and not breathing back in."* Body fails further. Begins reaching out to specific Free Settlements through robins.
- **What she knows.** Mechanics of the Aether cycle. Why Netheron's death broke it. Why the Six being dormant is not enough. That the cycle must be restored for the world to heal. That dragons might be a path. That Netheron's body lies at the heart of the Wastes.
- **What she does not know.** The Eighth exists. The Sundering was engineered. Netheron's reputation is unearned. Modern Cult ritual practices and how far her former colleagues' descendants have drifted.
- **Late-game arc.** Discovering the Eighth reorganizes her entire life's work. This is her dramatic peak.

---

## Part 4.5 — The wild peoples & monsters `[goblins LOCKED 2026-06-22; Ghar'kal from existing enemy canon]`

Two deliberately different registers of humanoid threat (the timeline never stated this before; locked from the user's call + the enemy descriptions already in `shared/src/data/enemies.ts`):

- **Goblins — the OLD, KNOWN, mundane menace.** Native vermin-folk of the hills and deep woods, here long before the kingdoms ("the frontier breeds them like flies"). Their own grubby hierarchy: runts → frontier goblins → shamans → a Warchief in a crown of bent copper. **Commoners know them completely** (folklore, door-charms, warnings to children). NOT tied to the Sundering/Wastes — the everyday weather of frontier danger. This is the *known* threat.
- **Ghar'kal — the game's orc-analogue (no literal "orcs"; homegrown name; underlying enemy IDs are still `orc_warrior`/`orc_warlord`, rename later to drop the last "orc" in code).** NOT an old menace: a proud warrior people **driven NORTH** toward the frontier as the Wastes advance (the Wastes are to the SOUTH, so displacement is northward — the enemy text's old "pushed south" was a direction bug, fixed 2026-06-22). **Refugees with axes, not ancient evil.** Knowledge layer: commoners see brutal "southern clan" raiders; the truth (the Wastes uprooted them; they flee what's coming for everyone) is the deeper discovery — a possible story beat (sympathy/alliance against the common dark). A human-scale face of the cosmic threat.
  - **`[OPEN — scale, deferred]`** Does Wastes-displacement add up? Physical Wastes only crept a few days' walk in 150y — too little to uproot a people. Resolution A (keep the tie): they were a small hardy **march-people** against the old Wastes edge, squeezed north over ~6 generations by the **thinning zone** (which spreads first/farther than the physical Wastes). Resolution B (simplify): drop the Wastes tie — just an old mundane raider people, an aggressive cousin to the goblins. **Deferrable:** Ghar'kal are barely used (`orc_warlord` in 1 mission, `orc_warrior` in 0) — NOT in the Act 1 alpha — so lock this only when they're actually deployed.
- **Trolls & wild monsters** (e.g. the Thornveil Troll) — not a people; rare dangerous fauna of specific deep-wild places. Mundane-monstrous.

**Design principle:** goblins = known/mundane (commoners understand them) ↔ Ghar'kal = new/displaced (a tangible symptom of the Wastes, hidden under a raider surface). Maps onto the early-known → late-cosmic difficulty/story progression and the two-track-knowledge theme. *(Open confirm: "no literal orcs, Ghar'kal IS the analogue" — assumed per the homegrown-name preference; user to ratify.)*

## Part 5 — Open Threads (still TBD)

These are gaps the user and I have not locked yet. Listed by priority.

1. **`[HIGH]` Nordveld heretic-origin theory.** Proposal: Nordveld's culture was reshaped by Hearthlands heretics (old-Seven keepers) fleeing the Radiant One consolidation in Eras 3-4, layered onto a sparse pre-existing northern population. Awaiting user lock.
2. **`[MEDIUM]` Eighth's specific triggering event for the Sealing.** Currently fuzzy ("they grew tired of his work"). Lunara-corruption is parked as a candidate. Lock later if useful.
3. **`[MEDIUM]` Thornveil Pact founding.** Specific origin event. Was Rowena's modern reorganization the second founding, or the first? Likely scattered druid circles for centuries that she organized into a true Pact.
4. **`[LOW]` Tianzhou's actual interest in the western continent.** Cartographer/exile/merchant cover stories — what is their imperial agenda underneath?
5. **`[LOW]` Zah'kari relationship to the Cult and the Thornveil.** Their oral histories may carry pre-Sundering knowledge nobody else has.
6. **`[LOW]` Specific Nordveld pantheon names.** Grønmoder is locked (Sylvana). Others TBD as we need them.
7. **`[LOW]` Hauts-Cieux specific city names** and how many remain aloft today.
8. **`[LOW]` Where Hale's body is.** Probably decomposed naturally somewhere in the trees south of his garrison; possibly buried by a Thornveil ranger over the intervening century. Not load-bearing.
9. **`[LOW]` Ennara's mother.** Was she alive when Hale was posted? If not, she may also be a stuck soul somewhere — and may have crossed alongside Ennara when the ranger freed her.
10. **`[LOW]` Halldora as Nordveld's shame daughter** (parallel to Varek for the Khor'vani). Kernel idea added to Halldora's reputation section. Needs deepening: specific Nordveld traditions, sayings, how she is referenced in *völva* practice, what reaction Nordveld adventurers have to her name. Not load-bearing yet.

**Locked this session (April–May 2026):**

- Cassandra Netheron (Option D) — full Sundering reframe.
- Gods are celestial beings; mortals named them; gods have default forms when assembled; Sealing happened in deep prehistory (tens of thousands of years before mortal civilization).
- Eighth is sealed in physical form; deliberately creates demons; cruel for sport (Option 1, purely corrupting).
- Khazdurim First Breach is post-Sundering; happens when seals weakened by Aether imbalance; prepared demon army poured out (not just leak).
- Halldora was elsewhere when Netheron's light fell; she is the last of *her school*, not the last Archmagus.
- Six's stars dim but still glow (Option 1 dormancy).
- Radiant One belief has pre-Sundering folk monotheist roots; consolidates over millennia; institutionalized by Ashford coup; folk-practice Netheron-as-devil layer coexists with official monotheism. Doctrine of Silence has two roots (hubris + devil narrative) layered together.
- Halldora's ritual: no human sacrifice, parasitic on ambient Aether, mechanically proto-Hollow.
- Halldora is Nordveld by birth or lineage. Honors the Seven including Netheron. Her ritual is a moral wound by her own faith's standards.
- Nordveld worship Netheron positively; their *völva* tradition continues his work; pray for "good death." This is precisely what the Hearthlands Church reframes as devil-worship.
- Halldora's two paths: Resurrection (refused — required willing sacrifice; her former colleagues continued without her and became the Cult). Replacement (her current path; dragons are her best lead).
- Cult founded by Halldora's research circle; she walked away over the willing-sacrifice question; circle radicalized over centuries into the modern Cult.
- Cult is layered (inner research circle, Pale Hand, scholarly wing, Old Faith protectors, sympathizers, splinter zealots). Most members are not killers; willing-sacrifice rituals are restricted to the inner circle and total perhaps a few hundred willing deaths over two thousand years. Splinter zealots commit real atrocities the inner Cult disowns but cannot fully control.
- Eighth-agent infiltration of the Cult: not at the founding (the Vigil was sincere), but around year 500-1000 AS. Modern Cult is both tragic-sincere and unwittingly serving the Eighth. (Closes the previous open thread.)
- Drayven is morally complex. Knows enough to suspect; chooses not to confront; hunts splinter zealots; quietly hopes the inner rituals fail.
- Wastes intensity gradient: outer survivable, middle deadly, inner impossible, body site never reached. Body is mythologized but not directly observed by anyone.
- Halldora's robin protocol: anonymous helpful contact first, identity revealed much later, slow-burn trust-building.
- Halldora's reputation: educated Hearthlanders know she is real; common Ashwick know her as half-real folk witch; Nordveld lineages preserve a more sympathetic version.

---

## Part 6 — Quick Reference for Story Drafting

When writing chronicle entries, cinematics, or mission descriptions, keep these load-bearing facts handy:

- **The Sundering was 2000+ years ago.** The Wastes acceleration is 150 years ago. Don't conflate them.
- **The Lord doesn't know about the Eighth.** Doesn't know Netheron's reputation is unearned. Doesn't know the Sundering was engineered (or that Netheron was right and the Six killed him for it). Late-game reveal.
- **Gods are celestial, not humanoid.** Lights in the high sky. Mortals named them by what they observed. Pre-Sundering worship is observational and abstract, not encounter-based. No "the goddess walked into the village" stories.
- **Netheron's body literally crashed at the Academy site.** The Wastes are his corpse leaking. Don't have characters describe the Wastes as just "cursed land" if the Lord ever learns the truth — the Wastes are a god's grave.
- **The Lord doesn't know the Wastes have been moving.** He learns this in story 2 from Hale's journal.
- **Combat dispels ghosts; only ritual frees them.** Players learn this from Niamh in story 4. Until then they think they killed Hale.
- **Wards are large monoliths blended into landscape.** Regional area of effect. The old watch sits between a flanking pair: both stand whole today (the south one broke in Hale's time and was reset after he fell), and their protection does not reach the thinning pocket further south.
- **Voices are real.** They are the trapped dead, not "something wearing voices." Save the wearing-voices reveal for late chapters.
- **Radiant One belief is two-layered.** Official Church monotheism (the Radiant One does all things). Folk practice retains Netheron as the devil. Both held simultaneously without contradiction by ordinary believers.
- **The Doctrine of Silence has two roots.** Hubris narrative (don't study Aether, the Academy was punished) plus devil narrative (Netheron the rebel-god fell). Both reinforce the same conclusion. Inquisition uses whichever fits the audience.
- **Halldora is Nordveld.** Honors Netheron in the Nordveld way (death is sacred). Her own life-binding ritual is a private moral wound by her faith's standards. She is the *Queen of Heretics* by Dominion reputation, half-real folk witch to common Ashwick farmers, more sympathetic to Nordveld lineages.
- **The robin protocol.** Halldora does not sign her name when she contacts the Lord. First contacts are anonymous helpful gifts (medicine, warnings). Identity is revealed slowly, only after trust is earned. Don't have her introduce herself in early chronicle entries.
- **The Cult is layered, not monolithic.** Inner research circle does small-scale willing-sacrifice rituals (hundreds of willing deaths over 2000 years, not industrial murder). Pale Hand military arm is mostly defectors and refugees. Old Faith protectors are the underground church. Splinter zealots commit the actual atrocities folk memory blames "the Cult" for. The inner Cult disowns the splinters. Drayven is morally complex.
- **The Eighth-agent infiltration of the Cult was post-founding** (year 500-1000 AS), not at the root. The original Vigil was sincere; the modern Cult is both tragic-sincere AND unwittingly serving the Eighth.
- **Netheron's body is at the heart of the Wastes but no one has ever seen it.** Halldora knows it is there from the way the boundary fails. The Cult has indirect evidence from expedition logs and half-mad survivors. Player reaching close enough to see it is a late-game beat.
- **The Lord is a commoner schoolmaster.** Plain-spoken, literate, wry. Computes math when something is off. Does not lecture. Writes in shorter sentences than I tend to draft for him; tighten on revision.
- **No em dashes** in player-facing prose. Commas, colons, semicolons, periods.
