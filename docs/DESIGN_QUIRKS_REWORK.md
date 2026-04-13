# Quirks Rework — Design Spec

## Problem

The current 16 quirks are untagged strings — any quirk can appear on any adventurer. This causes immersion breaks:
- "Talks to their sword" on a wizard who doesn't carry one
- Gender-specific language on the wrong gender
- No connection to the food preference system

## Solution

Replace the flat `string[]` with a tagged quirk system. Each quirk has optional filters for **class**, **gender**, and **food preference**. When generating an adventurer, only quirks that match all their tags are eligible. Untagged quirks (the majority) remain universal.

## Data Structure

```typescript
interface PersonalityQuirk {
  text: string;
  classes?: AdventurerClass[];       // omit = all classes
  gender?: "male" | "female";        // omit = any gender
  foodPreference?: FoodPreference;   // omit = any preference
}
```

Selection logic: filter quirks where all tags match, then pick randomly from the filtered pool. If the filtered pool is empty (shouldn't happen with enough universal quirks), fall back to universal quirks only.

## Quirk Pool

### Universal (no tags) — ~20 quirks

These work for any class, gender, or food preference.

1. "Refuses to enter a building without knocking first."
2. "Keeps a tally of every creature killed."
3. "Sleeps with one eye open. Claims it's a learned habit, not paranoia."
4. "Collects teeth from defeated enemies. Won't explain why."
5. "Always the last to eat, first to volunteer for watch."
6. "Writes poetry. Terrible poetry. Reads it aloud to the party."
7. "Never sits with their back to the door."
8. "Names every animal they encounter. Gets upset when others don't use the names."
9. "Whistles the same tune constantly. Nobody knows where it's from."
10. "Prays to a different god each morning. Just to cover all the bases."
11. "Claims to have once arm-wrestled a troll. The details change every telling."
12. "Keeps a pressed flower in a locket. Won't say who gave it to them."
13. "Counts everything — stairs, trees, enemies. Everything."
14. "Won't step on cracks in stone floors. Says it's bad luck. Completely serious."
15. "Hums off-key before every fight. Says it 'centers the spirit.'"
16. "Has a lucky coin. Flips it before every decision. Ignores the result."
17. "Draws little maps of everywhere they go. The maps are surprisingly accurate."
18. "Always knows what time it is. Nobody knows how."
19. "Refuses to walk under ladders, arches, or low branches. Takes detours."
20. "Talks in their sleep. Full conversations. Sometimes useful intelligence."

### Class-specific — ~15 quirks

**Warrior:**
- "Talks to their sword. The sword has a name."
- "Carves a small notch into their blade after every mission."
- "Polishes their armor every evening. Every. Single. Evening."
- "Tests every chair before sitting. Most don't survive."

**Wizard:**
- "Mutters incantations in their sleep. Small objects occasionally levitate nearby."
- "Keeps a journal of every spell they've ever cast. Cross-referenced and indexed."
- "Sniffs potions before drinking them. Even water."
- "Leaves scorch marks on things when they're emotional."

**Priest:**
- "Blesses every meal, every doorway, and every sneeze within earshot."
- "Carries a prayer for every occasion. Has one for finding lost socks."
- "Lectures the wounded about 'spiritual hygiene' while bandaging them."

**Archer:**
- "Counts arrows obsessively. Recounts them if interrupted."
- "Can estimate any distance to within a hand's width. Insufferable about it."
- "Whittles arrows during downtime. The camp is littered with shavings."

**Assassin:**
- "Enters every room through the window. Even when the door is open."
- "Has never been heard approaching. Not once. It unnerves the party."
- "Keeps three hidden blades on their person. That anyone knows of."

### Gender-specific — ~6 quirks

**Male:**
- "Grows a different style of beard every season. Tracks them in a journal."
- "Challenges every new recruit to an arm-wrestling match. Keeps a record."
- "Calls everyone 'brother.' Even people who clearly aren't."

**Female:**
- "Braids wildflowers into her hair before every mission. Says it brings luck."
- "Has a sister in every port town. Or so she claims."
- "Keeps a small mirror and checks her reflection after fights. 'Presentation matters.'"

### Food preference quirks — ~15 quirks (3 per preference)

**Sweet:**
- "Keeps a honeycomb wrapped in cloth at the bottom of their pack. For emergencies, they say."
- "Judges every settlement by the quality of its pastries."
- "Has been caught licking jam off a knife. More than once."

**Spicy:**
- "Carries a pouch of crushed peppers. Puts them on everything. Including ale."
- "Once ate a whole fire pepper on a dare. Won the bet, lost the ability to taste for a week."
- "Complains that every tavern's 'spicy' stew is too mild."

**Hearty:**
- "Won't start a march until they've had a proper bowl of stew. Non-negotiable."
- "Can smell cooking from half a league away. Has led the party to several unexpected inns."
- "Eats twice as much as anyone else and never gains weight. The party suspects sorcery."

**Smoky:**
- "Insists on cooking their own food over an open flame. Doesn't trust kitchens."
- "Smells faintly of woodsmoke at all times. Even after a bath."
- "Stares into campfires for hours. Says it 'clears the mind.'"

**Fresh:**
- "Picks herbs from the roadside and eats them raw. The party has stopped questioning it."
- "Keeps a small herb garden in a box. Carries it on missions. Yes, really."
- "Insists on foraging for 'supplements' during every march. Adds ten minutes."

## Total Pool Size

| Category | Count |
|----------|-------|
| Universal | ~20 |
| Class-specific (5 classes) | ~15 |
| Gender-specific | ~6 |
| Food preference (5 types) | ~15 |
| **Total unique quirks** | **~56** |

For any given adventurer (e.g., female spicy warrior), the eligible pool is:
- All 20 universal + 4 warrior + 3 female + 3 spicy = **~30 eligible quirks**

That's nearly 2x the current total pool of 16, and much more targeted. Repeat sightings will be rare.

## Portrait Repetition (Separate Issue)

The portrait pool is limited by art assets — most origin/class/gender combos have only 1 portrait. This is an art generation task, not a code task. Options:
- Generate more portraits with the same style prompts (batch of ~100 would cover most gaps)
- Add slight CSS variations (hue shift, mirror) to create visual diversity from the same base — but this feels cheap
- Accept it for now and expand the pool over time

**Recommendation:** Note this as a backlog item. When you have time to generate images (or want to share prompts for me to help with), we can batch-generate portraits. The quirk system is the higher-impact fix for "adventurers feel same-y."

## Implementation Notes

- Replace `PERSONALITY_QUIRKS: string[]` with `PERSONALITY_QUIRKS: PersonalityQuirk[]`
- Update `generateCandidate()` to filter by class, gender, and food preference before picking
- Migration: existing adventurers keep their current quirk text (it's just a string on the adventurer, not an ID reference — so no migration needed)
- The `PersonalityQuirk` type is data-only, no UI changes needed (quirk text still displays the same way)
