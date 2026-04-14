# Pre-Made Character Pool — Design Spec

## Overview

Replace random adventurer generation with a curated pool of ~150 handcrafted characters, each with a unique portrait, name, backstory, and personality. Characters are real people in the world, not dice rolls.

## Why

- Portraits never repeat — each character has their own face
- Family relationships are intentional (the Ashford brothers, the Mensah grandmother)
- Quirks and traits fit the character's personality, not random assignment
- Characters feel like real people worth caring about (and mourning when they die)
- The game's beautiful portraits deserve real identities

## Data Structure

```typescript
interface PremadeAdventurer {
  id: string;                    // unique permanent ID (e.g., "char_aldric_ashford")
  name: string;                  // full name, handcrafted
  class: AdventurerClass;
  race: Race;
  origin: Origin;
  age: AgeCategory;
  portrait: string;              // specific portrait filename (no hash-based selection)
  zoomedPortrait: string;        // zoomed version for detail page
  backstory: string;             // unique personal story
  quirk: string;                 // chosen to fit this character
  trait: string;                 // backstory trait ID, chosen to fit
  foodPreference: FoodPreference;
  familyId?: string;             // groups family members (e.g., "ashford_family_1")
  rarity?: "common" | "uncommon" | "rare";  // affects spawn weight in recruit pool
  unlockCondition?: string;      // optional: only appears after certain conditions
}
```

## Recruit Pool Logic

1. Start with the full pre-made pool
2. Remove characters already in the player's roster (by ID)
3. Remove dead characters (in the pantheon)
4. Remove characters whose `unlockCondition` isn't met
5. Weight by rarity (common: 60%, uncommon: 30%, rare: 10%)
6. Pick N random characters from the remaining pool
7. If the filtered pool has fewer than N characters, fill remaining slots with random generation (legacy fallback)

## Family System

- Characters with the same `familyId` are actual family
- The existing `findKin()` function can check `familyId` instead of matching last names
- Family relationships (parent/child/sibling/spouse) can be explicit in the data rather than guessed from age gaps
- Example: the Ashford family might have a young warrior, her older priest brother, and their retired father who sometimes appears as a rare recruit

## The Pantheon (Dead Characters)

- When a pre-made character dies (permadeath), they're added to the Pantheon
- Pantheon is a memorial page: portrait, name, stats at death, how they died, which mission
- Dead characters never reappear in the recruit pool
- Family members of dead characters might reference the death in their backstory or quirks
  (e.g., "Sister of the late Aldric. Doesn't talk about it.")

## Character Distribution

Target: ~150 characters across 10 origins × 5 classes × 2 genders × 4 ages

Not every combination needs equal coverage — some can be rarer:
- Common origins (Ashwick, Nordveld, Meridian): 20-25 characters each
- Less common origins (Zah'kari, Tianzhou, Khor'vani): 15-20 each
- Rare origins (Silvaneth, Hauts-Cieux, Khazdurim, Feldgrund): 10-15 each

## Legendary/Rare Characters

Some characters could be special:
- **Rare recruits** — only appear occasionally, have stronger backstories
- **Quest-locked** — appear after completing specific story missions
- **Tier-locked** — higher-tier characters only appear at Village/Town/City
- **Seasonal** — certain characters only appear in specific seasons
- **Legacy** — connected to the lore (a relative of Elder Rowena, a former student of Halldora)

## Implementation Order

1. Design the data structure (PremadeAdventurer type)
2. Create the first batch of ~30 characters (3 per origin) using existing portraits
3. Update the recruit refresh logic to pull from the pool
4. Add the Pantheon page
5. Expand to 100+ characters over time
6. Add family relationships and cross-references

## Content Authoring

The user will design each character: choosing a portrait, writing a name, backstory, and quirk.
The code change to support this is small — the bulk of the work is creative/content.
The random generation system stays as a fallback and for testing.
