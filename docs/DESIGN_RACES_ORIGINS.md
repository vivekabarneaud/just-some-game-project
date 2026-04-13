# Races, Origins & Enemy Tags — Design Document

*Designed 2026-04-10. Captures decisions from collaborative design session.*

---

## 1. Enemy Type Tags

Expands the existing tag system (`humanoid`, `beast`, `undead`, `magical`, `demon`) to support richer combat strategy and gear requirements.

`magical` remains a modifier tag that stacks with creature types (e.g., a lich is `undead` + `magical`).

| Tag | Description | Weakness | Resistance | Notes |
|---|---|---|---|---|
| **humanoid** | Bandits, orcs, goblins, soldiers | None (baseline) | None | |
| **beast** | Wolves, spiders, trolls | Fire, traps | Magic | |
| **undead** | Skeletons, zombies, liches | Holy, fire | Poison, bleed | |
| **ghost** | Spirits, wraiths, phantoms | Holy, spirit-touched weapons | **Immune to physical** | Separate from undead. Forces gear/party choices. |
| **demon** | Fiends from beyond the veil | Holy, silver | Fire, poison | |
| **divine** | Corrupted angels, temple guardians | Dark/shadow magic | Holy (immune) | |
| **dragon** | All dragonkind | Frost, piercing | Fire (immune), physical resistant | |
| **elemental_fire** | Living flame, magma golems | Water/frost | Fire (immune), physical | |
| **elemental_water** | Water spirits, sea serpents | Lightning | Water (immune), frost | |
| **elemental_earth** | Stone golems, earth elementals | Piercing, magic | Blunt, physical | |
| **elemental_wind** | Storm sprites, air djinn | Earth, heavy strikes | Ranged physical | |
| **elemental_aether** | Pure magic constructs, mana wraiths | Physical attacks | All magic (immune) | Opposite of ghosts — forces warrior-heavy parties |

### Ghost Physical Immunity

Normal physical weapons do nothing against ghosts. To deal physical damage, a character needs:
- A **Spirit-Touched** weapon enchant (craftable or loot drop)
- Priest's **Smite** ability (already ignores physical defense)
- Wizard/magic damage (bypasses naturally)
- The **Spirit Sensitive** backstory trait (weaker alternative — can hit ghosts at reduced damage)

### Aether Elemental Magic Immunity

The design counterpart to ghosts. Aether elementals are immune to all magic damage. Only physical attacks work. Forces warrior/archer-heavy parties — the opposite of ghost missions.

---

## 2. Races

Three playable races. Stat modifiers are small (+1/-1) but meaningful for min-maxing.

| Race | Stat Modifiers | Recruit Weight | Lifespan |
|---|---|---|---|
| **Human** | None (versatile) | 60% | Normal |
| **Elf** | Varies by origin (see below) | 15% (rare) | 300-500 years (post-Sundering, declining) |
| **Dwarf** | +1 STR, +1 VIT, -1 DEX | 25% | ~200-300 years |

### Elven Mortality (Le Déclin)

Before the Sundering, elves were truly immortal — sustained by the complete Aether cycle. When Netheron died and the cycle broke, their immortality shattered. All pre-Sundering elves perished. Post-Sundering generations live 300-500 years but are mortal. Each generation lives slightly shorter than the last. If the Aether cycle were restored, immortality might return.

---

## 3. Origins

Each origin is a homeland with its own culture, name pool, and connection to the game's lore.

### Human Origins (7)

#### Ashwick (English/Celtic) — The Dominion Heartlands
The common folk AND the displaced elite of the Ashenmark Dominion. Farmers, soldiers, merchants, and scholars/nobles who fled the Doctrine of Silence. Most settlers came south for cheap land or to escape the Church's grip.

> *"Every Ashwick settler brought three things south: a plow, a prayer book, and a grudge against their landlord."*

**Names:**
- *First (male):* Aldric, Cedric, Elwin, Gareth, Kael, Osric, Quinlan, Dorian, Finn, Henrik, Nolan, Pavel, Wren, Leif, Jareth, Ivar
- *First (female):* Brenna, Daria, Hilda, Lyra, Petra, Rowena, Gwen, Isla, Kira, Mira, Oona, Rhea, Talia, Cora, Elara, Ysolde
- *Last:* Ashford, Blackwood, Coldwell, Dawnforge, Emberheart, Foxglove, Greystone, Hawkwind, Ironbark, Thornwood, Underhill, Valeheart, Wintermere, Brightwater, Copperfield, Eldergrove

#### Nordveld (Nordic) — The Thornveil Borderlands
Hardy frontier folk from the cold northwest, Thornveil-adjacent. Respect all seven gods including Netheron. Came south because winters worsen and the wards thin.

> *"In Nordveld, you either learn to swing an axe by twelve or you don't see thirteen."*

**Names:**
- *First (male):* Bjorn, Tormund, Leif, Ragnar, Soren, Ulf, Erik, Halvard, Sigurd, Magnus, Wulf, Ivar
- *First (female):* Sigrid, Freya, Astrid, Ingrid, Thora, Helga, Kara, Runa, Hilda, Vara
- *Last:* Stormveil, Ironbark, Wintermere, Coldhammer, Frostwind, Ravensong, Stonehelm, Ashford

#### Meridian (Italian-inspired) — The Corsair League Coast
Traders, sailors, artisans, pirates from the sun-drenched Corsair ports. Pragmatic, charismatic, deeply loyal to family. Funded by the League as buffer settlements.

> *"A Meridian will stab you with a smile. A Ashwick man will just stab you."*

**Names:**
- *First (male):* Luciano, Baldassare, Matteo, Enzo, Vittorio, Dante, Lorenzo, Marco
- *First (female):* Fiora, Serafina, Chiara, Bianca, Rosalia, Alessia, Valentina, Isabella
- *Last:* Ferraro, Castellani, Monteverdi, Solari, Veronesi, Bianchi, Corsini, DeLuca

#### Zah'kari (West African-inspired) — The Sunward Kingdoms
Proud city-states east of the Dominion with deep oral histories and sophisticated governance. Griots use chanted stories carrying subtle Primal magic. Came west as trade routes shift and droughts worsen.

> *"The Zah'kari don't write their laws — they sing them. Try burning a song." — Halldora*

**Names:**
- *First (male):* Kofi, Kwame, Jabari, Tendai, Sekou, Chike, Emeka, Olu
- *First (female):* Amara, Nia, Zuri, Makena, Adama, Fatoumata, Asha, Kalista
- *Last:* Sunspear, Lionmane, Dustwalker, Ironroot, Thornshield, Goldmask, Stormcaller, Hearthkeeper

#### Tianzhou (Chinese-inspired) — The Jade Empire, Across the Eastern Sea
A vast ancient empire across the sea with its own Aether tradition based on elemental harmony. Visitors are rare — scholars, merchants, diplomats, or exiles. Their presence means the Empire is watching.

> *"The Tianzhou sent cartographers first. That means soldiers follow." — Grand Marshal Elara Voss*

**Names:**
- *First (male):* Wei, Zheng, Bowen, Changming, Feng, Hao, Tao, Jun
- *First (female):* Lian, Mei, Yuehan, Xiulan, Ruoxi, Jingyi, Mingzhu, Shuyin
- *Last:* Ironpetal, Jadecrest, Mistborne, Moonridge, Silkblade, Stoneriver, Cloudpeak, Goldengate

#### Khor'vani (Middle Eastern / South Asian-inspired) — The Amber Crossroads
Desert city-states at the trade crossroads. Merchants and alchemists with a tradition predating formal Arcane magic. Alchemy based on physical processes — technically doesn't violate the Doctrine of Silence.

> *"If a Khor'vani tells you something is priceless, it means they haven't named the price yet." — Captain Mira Stormglass*

**Names:**
- *First (male):* Arjun, Ravi, Kiran, Vikram, Dev, Amir, Sanjay, Rohan
- *First (female):* Zahra, Leila, Farah, Nadia, Yasmin, Priya, Soraya, Dalia
- *Last:* Sandweaver, Duskfire, Silkwind, Stargazer, Goldhand, Ashveil, Sunforge, Emberspice

### Elf Origins (2)

#### Silvaneth (Gaelic/Tolkien-esque) — The Deep Forests, Thornveil-adjacent
Stats: +1 DEX, +1 WIS, -1 STR

Nature elves, archers, druids. Cities grown from living wood. Closest to Primal magic and the Thornveil Pact. Some have maintained the wards for generations.

> *"The Silvaneth were old when the Dominion was young. They remember a world that worked. That's why they're so sad."*

**Names:**
- *First (male):* Thalion, Faenor, Galadhrim, Thranduil, Celeborn, Earendil, Aelindor, Caelith
- *First (female):* Aelindra, Sylvari, Elowen, Ithilwen, Miriel, Luthien, Nimloth, Tinuviel
- *Last:* Starweaver, Moonshadow, Dawnwhisper, Leafsong, Silverbrook, Nightbloom, Sunshard, Mistwalker

#### Hauts-Cieux (French, refined) — Mountain-top Ruins Above the Clouds
Stats: +1 INT, +1 WIS, -1 STR

Scholar-mages, archivists, melancholy nobility. Live among the ruins of the pre-Sundering civilization, lifted onto mountain plateaus by the last great act of Arcane magic. Libraries and observatories perched above the clouds. The Aether holding the structures aloft is thinning — platforms are falling.

> *"The Hauts-Cieux were built to outlast the world. They're starting to wonder if the world will outlast them."*

**Names:**
- *First (male):* Aurelien, Lucien, Gaston, Armand, Bastien, Renaud, Thierry, Philippe
- *First (female):* Celeste, Eloise, Vivienne, Solange, Giselle, Adeline, Margaux, Colette
- *Last:* Feuillemorte, Boisvert, Clairdelune, Fontargent, Brumesang, Verdelys, Aubepine, Lunargent

### Dwarf Origins (2)

#### Khazdurim (Classic dwarven) — The Ironspine Mountains
Stats: +1 STR, +1 VIT, -1 DEX

Deep miners, smiths, engineers. Primary source of iron, copper, gold, and Astral Shards. The deepest mines broke through into something wrong — blackened tunnels, overnight rust, whispering from below. The Wastes are underground too. The lowest holds have been sealed.

> *"Ask a Khazdurim about the Deep Seals and watch how fast the conversation ends."*

**Names:**
- *First (male):* Durin, Thordak, Grimjaw, Balin, Thorin, Oin, Nori, Bombur
- *First (female):* Bruna, Hilde, Sigga, Dagna, Helka, Magna, Gretta, Svala
- *Last:* Stonefist, Deepforge, Ironhold, Hammerfall, Copperbeard, Fireaxe, Goldvein, Anvilborn

#### Feldgrund (Rustic/jovial) — The Rolling Hills, Dominion Midlands
Stats: +1 STR, +1 VIT, -1 DEX

Surface-dwelling dwarves. Brewers, farmers, innkeepers. Natural settlers — give them soil and they'll have a brewery running within a month.

> *"A Feldgrund dwarf will outdrink you, outfarm you, and then lend you money for the privilege."*

**Names:**
- *First (male):* Bardin, Rogar, Brokk, Grundy, Flint
- *First (female):* Willa, Tilda, Marta, Hildi, Dagny
- *Last:* Barrelhouse, Hearthstone, Alewell, Meadbrook, Hillfoot, Kettleblack

---

## 4. Backstory System

Each adventurer gets three generated components at recruitment.

### A. Origin Story (1-2 sentence hook)

Six archetypes per origin, avoiding cultural stereotypes:
1. **Fighter** — came to test their blade
2. **Scholar** — seeking knowledge
3. **Refugee** — fled something terrible
4. **Misfit/exile** — didn't fit in back home
5. **Merchant/practical** — followed opportunity
6. **Healer/spiritual** — called to help

Each archetype is flavored by the character's origin geography and culture, but any origin can produce any archetype.

### B. Personality Quirk (one-liner)

Shared pool across all origins:
- "Talks to their sword. The sword has a name."
- "Refuses to enter a building without knocking first."
- "Keeps a tally of every creature killed."
- "Hums off-key before every fight."
- "Sleeps with one eye open."
- "Collects teeth from defeated enemies."
- "Always the last to eat, first to volunteer for watch."
- "Writes terrible poetry. Reads it aloud to the party."

### C. Backstory Trait (gameplay passive)

Small bonuses tied to character history. Generated at recruitment, visible on character sheet.

| Trait | Flavor | Effect |
|---|---|---|
| Demon Hunter | "Survived the Ashland incursions" | +5% damage vs demon |
| Grave Walker | "Grew up near the Barrowfields" | +5% damage vs undead & ghost |
| Beast Tracker | "Hunted dire wolves as a child" | +5% damage vs beast |
| Dragonmarked | "Bears a scar from dragonfire" | +5% damage vs dragon |
| Spirit Sensitive | "Can hear whispers from the other side" | Can hit ghosts with physical attacks |
| Pious Heart | "Devoted to the old gods since youth" | +5% damage vs demon & divine |
| Elemental Attuned | "Born during a great storm" | +5% damage vs elemental |
| Iron Will | "Tortured by bandits and didn't break" | +10% resist to fear/taunt |
| Survivor | "Has already died once, technically" | -15% death chance on failure |
| Veteran Campaigner | "Served in the Border Wars" | +5% damage vs humanoid |
| Lucky | "Found a four-leaf clover at age six" | +3% crit chance |
| Quick Learner | "Reads every book they find" | +10% XP gain |

Not every adventurer gets a combat trait. Utility traits (Survivor, Lucky, Quick Learner) make recruitment more interesting.

---

## 5. Appearance Notes

Tied to origin narratively. Drives portrait selection when portraits are available.

| Origin | Appearance |
|---|---|
| Ashwick | Range of tones, common midlands |
| Nordveld | Pale, light hair, weathered by cold |
| Meridian | Olive to tan, warm features |
| Zah'kari | Deep brown to dark skin, often braided hair |
| Tianzhou | Light to warm tan, straight dark hair |
| Khor'vani | Medium brown to deep brown, ornate jewelry |
| Silvaneth | Pale, angular, faintly luminous |
| Hauts-Cieux | Fair, refined, aristocratic bearing |
| Khazdurim | Ruddy, stocky, thick brows |
| Feldgrund | Tan, round-faced, broad-shouldered |

---

## 6. Generation Flow

When recruiting an adventurer:
1. Pick **race** (weighted: 60% human, 25% dwarf, 15% elf)
2. Pick **origin** (random within race)
3. Pick **name** (from origin's name pool — first + last)
4. Determine **gender** (from first name → affects portrait)
5. Pick **class** (random from 5 classes)
6. Pick **origin story** (random from origin's archetype pool)
7. Pick **personality quirk** (random from shared pool)
8. Pick **backstory trait** (weighted random — some rarer)
9. Apply **stat modifiers** from race/origin

---

## 7. Future Considerations

- Dwarf sub-origin stat differentiation (Khazdurim vs Feldgrund could differ)
- Third elf origin if needed
- Race-specific class restrictions or affinities (e.g., dwarf wizards are rare)
- Race-specific dialogue or quest hooks
- Weakness/resistance system wired into combat engine
- Spirit-Touched weapon enchant for ghost content
