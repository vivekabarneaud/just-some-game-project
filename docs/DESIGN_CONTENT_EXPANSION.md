# Content Expansion — Enemies, Equipment & Jewelcrafting

## Overview

A major content pass adding:
- **~20 new enemies** filling gaps at T1-2 and adding variety at T3-4
- **~35 new equipment items** filling empty/sparse slots (rings, head, legs, boots, amulet, off-hand, daggers)
- **Jewelcrafter building** with gem-based crafting for rings, amulets, and trinkets
- **Elemental gems** as a new material category — dropped from monsters or mined rarely
- **Fang Necklace** moved to Jewelcrafter, Iron Tools stays at Blacksmith

---

## 1. New Enemies

### Design Philosophy
- T1-2 needs more variety — players fight these for hours in early game
- Every new enemy drops at least one material that feeds into new crafting recipes
- Caster enemies add tactical variety (AoE damage, debuffs, healing)
- "Variant" enemies (Burnt Skeleton, Alpha Wolf) reuse familiar archetypes with a twist

### T1 — Common Threats (4 new)

| Enemy | Tags | Abilities | Key Drops |
|-------|------|-----------|-----------|
| **Forest Bear** | Beast | Maul (1.5x dmg) | thick_pelt (35%), bear_claw (20%) |
| **Marsh Adder** | Beast | Venomous Strike (poison 8%/rd x3) | serpent_fang (25%), snake_oil (15%) |
| **Rabid Boar** | Beast | Charge (1.3x dmg, first round only) | bristlehide (30%), tusk_shard (20%) |
| **Fungal Crawler** | Beast, Magical | Spore Burst (poison 5%/rd x2, AoE) | glowcap_spore (30%), chitin_plate (10%) |

### T2 — Organized Threats (5 new)

| Enemy | Tags | Abilities | Key Drops |
|-------|------|-----------|-----------|
| **Goblin Shaman** | Humanoid, Magical | Hex Bolt (1.2x magic dmg), Heal Ally (heal 20%) | hex_fetish (25%), crude_ruby (10%) |
| **Ghoul** | Undead | Paralyzing Touch (stun 1 rd, 30% chance), Feast (heal self on kill) | ghoul_marrow (30%), grave_dust (20%) |
| **Alpha Wolf** (BOSS) | Beast | Pack Howl (buff all wolves +20% STR), Lunge (1.8x dmg) | alpha_fang (40%), thick_pelt (60%), sinew_cord (40%) |
| **Bog Witch** (BOSS) | Humanoid, Magical | Curse of Weakness (debuff STR -25% x2), Poison Cloud (AoE poison 10%/rd x2) | hex_fetish (50%), witch_eye (20%), nightbloom herb (15%) |
| **Burnt Skeleton** | Undead, Elemental Fire | Fire Touch (fire dmg 1.2x), Self-Immolate (on death: AoE 20% fire dmg) | charite (25%), bonewalk_shard (20%), crude_ruby (8%) |

### T3 — Dangerous Foes (6 new)

| Enemy | Tags | Abilities | Key Drops |
|-------|------|-----------|-----------|
| **Corrupted Treant** | Beast, Magical, Elemental Earth | Root Grasp (stun 1 rd), Thorn Spray (AoE 30% dmg) | living_heartwood (30%), amber_resin (20%) |
| **Necromancer Acolyte** (BOSS) | Humanoid, Undead, Magical | Raise Dead (summon 2 skeletons), Dark Bolt (1.5x dmg), Death Shield (reduce dmg 30% x2 rds) | soul_shard (30%), grave_dust (40%), lichglass (10%) |
| **Ember Elemental** | Elemental Fire, Magical | Flame Wave (AoE 35% fire dmg), Ignite (fire DoT 12%/rd x3) | livingflame_bead (30%), fire_ruby (15%) |
| **Frost Elemental** | Elemental Water, Magical | Frost Bolt (1.5x ice dmg), Freeze (stun 1 rd, 25% chance) | frozen_droplet (30%), frost_sapphire (15%) |
| **Dire Bear** (BOSS) | Beast | Savage Maul (2x dmg), Roar (debuff DEX -30% x2), Thick Hide (passive: 20% dmg reduction) | thick_pelt (80%), bear_claw (60%), beast_heart (15%) |
| **Swamp Revenant** | Undead, Ghost | Bog Grasp (stun 1 rd), Drain Life (1.3x dmg, heal self 50% of dmg dealt) | ghostweave (15%), grave_dust (30%), snake_oil (20%) |

### T4 — Elite Threats (4 new)

| Enemy | Tags | Abilities | Key Drops |
|-------|------|-----------|-----------|
| **Goblin Warchief** (BOSS) | Humanoid | War Drums (buff all allies +25% STR x2), Poison Blade (poison 15%/rd x3), Call Reinforcements (summon 2 goblins @50% HP) | hex_fetish (60%), crude_ruby (30%), war_paint (50%), goblin_crown (15%) |
| **Arch-Necromancer** (BOSS) | Humanoid, Undead, Magical | Mass Raise (summon 3 skeletons), Soul Harvest (AoE 40% dmg, heal self), Death Grip (stun + 2x dmg to 1 target) | lichglass (40%), soul_shard (50%), shadow_fragment (15%), void_topaz (10%) |
| **Storm Elemental** | Elemental Wind, Magical | Chain Lightning (hits 3 targets, 1.2x each), Static Field (debuff DEX -20% all), Thunder Crash (AoE 45% @50% HP) | thunderglass (40%), storm_topaz (15%), windweave_fiber (30%) |
| **Infernal Knight** (BOSS) | Demon, Humanoid | Hellfire Slash (1.8x fire dmg), Infernal Armor (passive: reflect 10% dmg), Summon Flames (AoE 35% fire dmg @50% HP) | ashblood (50%), hellite (40%), infernal_link (30%), fire_ruby (20%) |

---

## 2. Elemental Gems

### Concept
A new material sub-category: colored gems tied to elements. They drop from elemental enemies and occasionally from mining. Used at the Jewelcrafter for rings, amulets, and trinkets.

### Gem Types

| Gem | Element | Icon | Sources | Tier |
|-----|---------|------|---------|------|
| **Crude Ruby** | Fire | Ruby | Burnt Skeleton (8%), Goblin Shaman (10%), Ember Elemental (15%), Infernal Knight (20%) | T2-3 |
| **Fire Ruby** | Fire | Ruby | Ember Elemental (15%), Infernal Knight (20%). Refined from 3x Crude Ruby at Jewelcrafter | T3-4 |
| **Frost Sapphire** | Water/Ice | Sapphire | Frost Elemental (15%), Tide Serpent (10%), Iron Mine rare drop | T3 |
| **Storm Topaz** | Lightning | Topaz | Storm Elemental (15%), Storm Sprite (8%), Iron Mine rare drop | T3-4 |
| **Void Topaz** | Shadow/Death | Topaz | Arch-Necromancer (10%), Aether Wraith (8%), Iron Mine very rare drop | T4 |
| **Emerald Shard** | Nature/Life | Emerald | Corrupted Treant (15%), Silvaneth Banshee (10%), Iron Mine rare drop | T3 |
| **Moonstone** | Holy/Divine | White gem | Temple Guardian (10%), from Shrine offerings (rare), Iron Mine very rare | T4 |

### Iron Mine Gem Drops
The Iron Mine occasionally produces gems alongside iron ore:
- Crude Ruby: 2% per tick at mine level 3+
- Frost Sapphire: 1.5% at mine level 4+
- Storm Topaz: 1% at mine level 5+
- Emerald Shard: 1.5% at mine level 4+
- Moonstone: 0.5% at mine level 6+
- Void Topaz: 0.3% at mine level 7+

This gives the Iron Mine late-game value beyond just iron production.

---

## 3. Jewelcrafter Building

### Building Definition

| Property | Value |
|----------|-------|
| Name | Jewelcrafter |
| Category | Crafting |
| Unlock | Town tier |
| Max Level | 8 |
| Description | "A precise artisan's workshop for cutting gems and setting them into rings, amulets, and charms." |
| Icon | Gem |

### Crafting Categories
The Jewelcrafter crafts three equipment types:
- **Rings** (ring1, ring2 slots) — small stat bonuses, elemental affinities
- **Amulets** (amulet slot) — moderate stat bonuses, utility effects
- **Trinkets** (trinket slot) — unique utility effects

### Migration
- **Fang Necklace** recipe moves from Blacksmith → Jewelcrafter (Lv 1)
- **Iron Tools** stays at Blacksmith (it's a tool, not jewelry)

---

## 4. New Equipment

### Rings (10 items — filling 2 completely empty slots)

**Tier 1 — Basic (Jewelcrafter Lv 1-2)**

| Item | Slot | Stats | Recipe | Classes |
|------|------|-------|--------|---------|
| Copper Band | ring | +1 VIT | 5 gold, 3 iron | All |
| Bone Ring | ring | +1 STR | 3 bonewalk_shard, 2 sinew_cord | Warrior, Assassin |
| Woven Vine Ring | ring | +1 WIS | 3 fiber, 2 wild herbs | Priest, Wizard |

**Tier 2 — Gemset (Jewelcrafter Lv 3-4)**

| Item | Slot | Stats | Recipe | Classes |
|------|------|-------|--------|---------|
| Ruby Signet | ring | +2 STR, +1 VIT | 1 fire_ruby, 5 gold, 3 iron | Warrior |
| Sapphire Ring | ring | +2 INT, +1 WIS | 1 frost_sapphire, 5 gold | Wizard, Priest |
| Topaz Band | ring | +2 DEX, +1 STR | 1 storm_topaz, 5 gold | Archer, Assassin |
| Emerald Loop | ring | +2 WIS, +1 VIT | 1 emerald_shard, 5 gold | Priest |

**Tier 3 — Rare (Jewelcrafter Lv 5-6)**

| Item | Slot | Stats | Recipe | Classes |
|------|------|-------|--------|---------|
| Moonstone Seal | ring | +3 WIS, +2 INT, +1 VIT | 1 moonstone, 1 godspark, 10 gold | Priest, Wizard |
| Void Band | ring | +3 DEX, +2 STR | 1 void_topaz, 1 shadow_fragment, 10 gold | Assassin |
| Dragonfire Ring | ring | +3 STR, +2 VIT | 1 fire_ruby, 1 dragon_blood, 10 gold | Warrior |

### Head Armor (6 items — currently only 1)

| Item | Slot | Stats | DEF | Source | Classes |
|------|------|-------|-----|--------|---------|
| Leather Hood | head | +1 DEX | 15 | Leatherworking (existing) | Assassin, Archer |
| Iron Helm | head | +2 VIT, +1 STR | 35 | Blacksmith Lv 3 | Warrior |
| Chainmail Coif | head | +1 VIT, +1 STR | 25 | Blacksmith Lv 4 | Warrior, Archer |
| Wizard's Hat | head | +2 INT | 8 | Tailoring Lv 3 | Wizard |
| Priest's Circlet | head | +1 WIS, +1 INT | 12 | Jewelcrafter Lv 2 (gold + gems) | Priest |
| Shadow Cowl | head | +2 DEX, +1 STR | 18 | Leatherworking Lv 4 | Assassin |
| Bear-Skull Helm | head | +2 STR, +1 VIT | 30 | Leatherworking Lv 4 (bear_claw + thick_pelt) | Warrior, Archer |

### Leg Armor (5 items — currently only 1)

| Item | Slot | Stats | DEF | Source | Classes |
|------|------|-------|-----|--------|---------|
| Leather Pants | legs | +1 VIT | 20 | Leatherworking (existing) | Assassin, Archer, Warrior |
| Iron Greaves | legs | +2 VIT, +1 STR | 40 | Blacksmith Lv 3 | Warrior |
| Cloth Leggings | legs | +1 VIT, +1 WIS | 8 | Tailoring Lv 2 | Wizard, Priest |
| Ranger's Trousers | legs | +1 DEX, +1 VIT | 22 | Leatherworking Lv 3 | Archer, Assassin |
| Wyrmscale Greaves | legs | +3 VIT, +1 STR | 50 | Leatherworking Lv 5 (wyrmshell_plate + leather) | Warrior |

### Boots (5 items — currently only 1)

| Item | Slot | Stats | DEF | Source | Classes |
|------|------|-------|-----|--------|---------|
| Leather Boots | boots | +1 DEX | 15 | Leatherworking (existing) | All |
| Iron Sabatons | boots | +1 VIT, +1 STR | 30 | Blacksmith Lv 3 | Warrior |
| Soft Shoes | boots | +1 DEX, +1 WIS | 5 | Tailoring Lv 2 | Wizard, Priest |
| Scout's Boots | boots | +2 DEX | 18 | Leatherworking Lv 3 | Archer, Assassin |
| Trollhide Boots | boots | +2 VIT, +1 DEX | 25 | Leatherworking Lv 4 (trollhide + leather) | All |

### Amulets (5 items — currently only Fang Necklace)

| Item | Slot | Stats | Source | Classes |
|------|------|-------|--------|---------|
| Fang Necklace | amulet | +1 STR, +1 DEX | Jewelcrafter Lv 1 (moved from Blacksmith) | All |
| Holy Pendant | amulet | +2 WIS, +1 VIT | Jewelcrafter Lv 3 (moonstone + gold) | Priest |
| Amber Charm | amulet | +2 INT, +1 WIS | Jewelcrafter Lv 3 (emerald_shard + amber_resin) | Wizard |
| Predator's Tooth | amulet | +2 DEX, +1 STR | Jewelcrafter Lv 2 (alpha_fang + sinew_cord) | Archer, Assassin |
| Warlord's Chain | amulet | +2 STR, +2 VIT | Jewelcrafter Lv 4 (orc_steel + fire_ruby + gold) | Warrior |
| Ghostveil Locket | amulet | +2 INT, +1 DEX, -5% death chance | Jewelcrafter Lv 5 (ghostweave + soul_shard + moonstone) | All |

### Off-Hand (5 items — currently only 2 shields)

| Item | Slot | Stats | DEF | Source | Classes |
|------|------|-------|-----|--------|---------|
| Iron Shield | offHand | +2 VIT | 45 | Blacksmith (existing) | Warrior |
| Wooden Shield | offHand | +1 VIT | 25 | Woodworker (existing) | Warrior, Archer, Assassin |
| Arcane Focus | offHand | +2 INT, +1 WIS | 0 | Woodworker Lv 4 (wood + livingflame_bead) | Wizard |
| Prayer Book | offHand | +2 WIS, +1 INT | 0 | Tailoring Lv 3 (fiber + gold + moonstone) | Priest |
| Parrying Dagger | offHand | +1 DEX, +1 STR | 15 | Blacksmith Lv 3 (iron + leather) | Assassin |
| Quiver of Precision | offHand | +2 DEX | 0 | Leatherworking Lv 3 (leather + sinew_cord) | Archer |

### Assassin Daggers (3 items — mainHand, filling class gap)

| Item | Slot | Stats | Source | Classes |
|------|------|-------|--------|---------|
| Stiletto | mainHand | +2 DEX, +1 STR | Blacksmith Lv 2 (iron + leather) | Assassin |
| Poisoned Blade | mainHand | +3 DEX, +2 STR | Blacksmith Lv 4 (iron + snake_oil + spinners_bile) | Assassin |
| Shadow Dagger | mainHand | +4 DEX, +3 STR | Blacksmith Lv 5 (shadow_fragment + iron + void_topaz) | Assassin |

### Priest Weapons (2 items — mainHand, filling class gap)

| Item | Slot | Stats | Source | Classes |
|------|------|-------|--------|---------|
| Iron Mace | mainHand | +1 STR, +1 WIS | Blacksmith Lv 2 (iron + wood) | Priest, Warrior |
| Blessed Mace | mainHand | +2 WIS, +2 STR, +1 VIT | Blacksmith Lv 4 (iron + moonstone + gold) | Priest |

### Boss Loot Equipment (6 items — rare drops, alternative to crafting)

| Item | Slot | Stats | Source | Classes |
|------|------|-------|--------|---------|
| Alpha's Fang | amulet | +2 STR, +1 DEX | Alpha Wolf boss (8% drop) | All |
| Witch's Eye | trinket | +2 INT, +1 WIS, -5% duration | Bog Witch boss (8% drop) | Wizard, Priest |
| Goblin Crown | head | +2 DEX, +1 STR, +10% loot | Goblin Warchief boss (6% drop) | All |
| Necromancer's Cowl | head | +3 INT, +1 WIS | Arch-Necromancer boss (6% drop) | Wizard |
| Beast Heart Charm | trinket | +2 VIT, +2 STR, -10% death chance | Dire Bear boss (8% drop) | All |
| Infernal Signet | ring | +3 STR, +2 VIT, fire dmg | Infernal Knight boss (6% drop) | Warrior, Assassin |

---

## 5. New Crafting Materials

| Material | Icon | Source | Category | Tier |
|----------|------|--------|----------|------|
| thick_pelt | Pelt | Forest Bear, Dire Bear | hide | T1-3 |
| bear_claw | Claw | Forest Bear, Dire Bear | bone | T1-3 |
| serpent_fang | Fang | Marsh Adder | bone | T1 |
| snake_oil | Vial | Marsh Adder, Swamp Revenant | alchemy | T1-3 |
| bristlehide | Hide | Rabid Boar | hide | T1 |
| tusk_shard | Tusk | Rabid Boar | bone | T1 |
| glowcap_spore | Mushroom | Fungal Crawler | alchemy | T1 |
| hex_fetish | Totem | Goblin Shaman, Bog Witch, Goblin Warchief | enchanting | T2-4 |
| ghoul_marrow | Bone | Ghoul | bone | T2 |
| grave_dust | Dust | Ghoul, Necromancer Acolyte, Swamp Revenant | alchemy | T2-3 |
| alpha_fang | Fang | Alpha Wolf | bone | T2 |
| witch_eye | Eye | Bog Witch | enchanting | T2 |
| charite | Crystal | Burnt Skeleton | enchanting | T2 |
| living_heartwood | Wood | Corrupted Treant | enchanting | T3 |
| amber_resin | Amber | Corrupted Treant | gem | T3 |
| beast_heart | Heart | Dire Bear | alchemy | T3 |
| fire_ruby | Ruby | Ember Elemental, Infernal Knight, refined from Crude Ruby | gem | T3-4 |
| frost_sapphire | Sapphire | Frost Elemental, Tide Serpent, Iron Mine | gem | T3 |
| storm_topaz | Topaz | Storm Elemental, Storm Sprite, Iron Mine | gem | T3-4 |
| void_topaz | Topaz | Arch-Necromancer, Aether Wraith, Iron Mine | gem | T4 |
| emerald_shard | Emerald | Corrupted Treant, Silvaneth Banshee, Iron Mine | gem | T3 |
| moonstone | Moonstone | Temple Guardian, Shrine, Iron Mine | gem | T4 |
| crude_ruby | Ruby | Burnt Skeleton, Goblin Shaman, early fire enemies | gem | T2 |
| goblin_crown | Crown | Goblin Warchief boss drop | gem | T4 |

---

## 6. Equipment Slot Summary (After Expansion)

| Slot | Before | After | Change |
|------|--------|-------|--------|
| mainHand | 12 | 17 | +5 (daggers, maces) |
| offHand | 2 | 6 | +4 (focus, book, dagger, quiver) |
| head | 1 | 7 | +6 |
| chest | 12 | 12 | unchanged |
| legs | 1 | 5 | +4 |
| boots | 1 | 5 | +4 |
| cloak | 4 | 4 | unchanged |
| ring1/ring2 | 0 | 10 | +10 (new!) |
| amulet | 1 | 6 | +5 |
| trinket | 5 | 7 | +2 (boss drops) |
| **Total** | **39** | **79** | **+40 items** |

Every class now has meaningful gear progression in every slot.

---

## 7. Implementation Order

1. **New enemies** — add to enemies.ts with stats, abilities, loot tables
2. **New materials** — add to items.ts material registry
3. **Elemental gems** — add gem types, Iron Mine rare drops
4. **New equipment** — add items to items.ts
5. **Jewelcrafter building** — add to buildings.ts, create crafting tab
6. **New crafting recipes** — add to recipe lists for Blacksmith, Leatherworking, Tailoring, Woodworker, Jewelcrafter
7. **Mission encounter updates** — add new enemies to mission encounter pools
8. **Boss loot drops** — wire up equipment drops to new bosses
