# Cinematics System — Design Spec

## Overview

Full-screen cinematic sequences that play at key moments:
1. **Intro cinematic** — plays once before first gameplay, tells the player's arrival story
2. **Story mission cinematics** — plays after claiming a completed story mission, reveals lore

Each cinematic is a series of full-screen slides: a background image with overlaid text. The player swipes/clicks to advance. No game UI visible during playback.

---

## Intro Cinematic

### When it triggers
- On first load, before any game UI appears
- Condition: `!state.firstMissionSent` (or a new `introSeen` flag)
- After the cinematic ends, the game UI fades in normally
- A "Skip" button is always visible for replays / impatient players

### Slide Sequence (4 slides)

**Slide 1 — "The Contract"**
*Image:* First-person POV — a weathered hand holding a folded parchment contract, viewed from the seat of a bumpy wooden wagon. The dirt road stretches ahead through grey-green rolling hills. Other wagons visible ahead in a caravan. Overcast sky, late afternoon.

*Text:*
> The contract is already creased from folding and unfolding. "Crown Land Grant — Southern Frontier." Free land. Build a settlement. Serve the Crown.
> It sounded better in the tavern.

---

**Slide 2 — "The Road"**
*Image:* The wagon has stopped at a ridge overlooking a vast forested valley with a river winding through it. Other settlers gathering at the overlook, silhouetted against the sky. Golden late-afternoon light breaking through clouds. The forest stretches endlessly south.

*Text:*
> Three weeks on the road. Farmers who lost their fields. Soldiers who stopped asking questions. A priest who blesses everything, including the mules.
> Nobody talks about what they left behind.

---

**Slide 3 — "Arrival"**
*Image:* First-person view of stepping off the wagon into a forest clearing. Raw tree stumps from fresh felling, muddy ground, a pile of cut logs. The river visible through the trees. A few other settlers unloading supplies. An axe leaning against a stump.

*Text:*
> This is it. The map calls it **{villageName}**. Right now it's mud, timber, and a long list of things we don't have.
> But the river is clean and the soil is dark. That's a start.

*Note:* `{villageName}` is dynamically inserted from `state.villageName`. The player hasn't chosen a name yet, so this uses the randomly generated default. They can rename later.

---

**Slide 4 — "Dawn"**
*Image:* First-person view, hands warming over a small campfire. Two or three canvas tents in the background. First light of dawn catching the treetops in gold. The forest edge glowing. A sense of quiet stillness before the work begins.

*Text:*
> The first night is the quietest. By tomorrow, there'll be axes ringing and arguments about where to dig the well.
> But right now — just the fire and the forest.
> Whatever's coming, we'll build something worth defending.

*After this slide:* Fade to black briefly, then the game UI fades in.

---

## Story Mission Cinematics

### When they trigger
- After the player clicks "Claim" on a completed story mission result
- The claim button text changes to **"Claim & Continue Story"** for story missions
- Rewards are granted immediately, then the cinematic overlay appears
- After the cinematic ends, the player returns to the guild page

### Cinematic Data Structure

Each story mission gains a `cinematic` field:

```typescript
interface CinematicSlide {
  image: string;       // CDN URL for the background image
  text: string;        // Narrative text (supports **bold** for emphasis)
  position?: "top" | "bottom" | "center";  // Where the text overlay appears (default: bottom)
}

// Added to StoryMission interface:
cinematic?: CinematicSlide[];
```

### Story Mission 1: "Scouting the Surroundings"

**Slide 1**
*Image:* Wide shot — a scout crouching on a rocky hilltop, looking down at a vast wilderness stretching south. Morning mist in the valleys. A rough hand-drawn map spread on the rock beside them.

*Text:*
> Your scouts came back with a map and a troubled look. The land around us is rich — game trails, berry thickets, a quarry site on the eastern ridge.
> But it's what they found to the south that changes things.

**Slide 2**
*Image:* Close-up — ancient stone ruins on a hilltop, partially collapsed. Ivy-covered walls, a broken tower, military-style foundations. Late afternoon light casting long shadows through the gaps.

*Text:*
> A hilltop, a day's march south. Stone foundations. A collapsed well. A watchtower still partially standing.
> Whoever was here before us, they were organized. Maybe military.
> And they left.

---

### Story Mission 2: "The Hilltop Ruins"

**Slide 1**
*Image:* Interior of a ruined stone room. Rotting military cots, scattered equipment. Scratch marks on the stone walls — patrol logs carved by hand. A shaft of dusty light from a hole in the ceiling.

*Text:*
> Dominion outpost. Military cots, a collapsed armory, patrol logs carved into the walls.
> The last entry reads: *"Day 47. The whispering won't stop. Maren heard her name. We are leaving at dawn."*

**Slide 2**
*Image:* Close-up of a damaged leather journal on a stone floor, open to a page with water-stained handwriting. A dark treeline visible through a crumbling window behind it.

*Text:*
> Below it, scratched in a different hand: *"They didn't all leave."*
> Your team also found bones. Not old bones.
> And a journal, water-damaged but partially legible. It mentions a dark treeline to the south — where the birds don't sing.

---

### Story Mission 3: "The Silent Forest"

**Slide 1**
*Image:* A grey, dead forest — trees standing but lifeless, bark pale and cracked, no leaves. Mist hanging low. The ground looks soft and wrong. No birds, no insects. Unnatural silence conveyed through the emptiness of the scene.

*Text:*
> The forest is dying from the inside. Trees stand upright but the wood is grey, brittle, cold to the touch. No insects. No birds.
> The ground feels wrong — soft, like walking on something that used to be alive.

**Slide 2**
*Image:* Wide panoramic shot from the forest's edge, looking south. Miles of dead grey forest stretching to the horizon. A faint shimmer in the air, like heat haze but cold. The living forest behind the viewer is green and vibrant — the contrast is stark.

*Text:*
> Half a mile in, the air changed. A taste of copper. A pressure behind the eyes. And then the whispers — fragments of sentences in voices too faint to identify.
> At the treeline, looking south, you could see where the grey expands. Miles of dead forest, stretching toward the horizon.
> Whatever this is, it's not a local problem. It's a boundary. And it's closer than anyone told you it would be.

---

### Story Mission 4: "A Ranger's Warning"

**Slide 1**
*Image:* A hooded figure standing at the edge of a settlement at dawn. Thornveil Ranger — leather armor with green motifs, a bow across her back, a faintly glowing runic blade at her hip. Mist behind her. She's watching, waiting to be noticed.

*Text:*
> She arrived at dawn. A Thornveil Ranger — hooded, armed, and asking to speak with whoever's in charge.
> Her name is Kess. She says she's been watching our settlement. She says we need to hear what she knows.

**Slide 2**
*Image:* Inside a tent or simple building. Kess sitting across from the viewer (first-person), a rough map between them with markings showing the ward-line and the Wastes boundary. Candlelight. Her expression is grim but not unkind.

*Text:*
> *"You built your settlement closer to the Wastes than you realize. That dead forest? That's the boundary's edge. And it's moving north."*
> She explains the wards — ancient stones that hold the boundary in place. The Thornveil maintains them. But they're failing.
> *"The Dominion didn't mention that in the land grants, did they?"*

**Slide 3**
*Image:* Close-up of Kess's hand resting on the hilt of her blade. The runes along the blade glow faintly blue-white. Her other hand is pointing at a spot on the map.

*Text:*
> She offers a deal: help her reinforce the nearest ward-stone, and she'll teach your people what she knows about the Wastes.
> When you ask about her blade, she says: *"Spirit-touched. For when the dead don't stay dead."*

---

### Story Mission 5: "The Cracked Ward-Stone"

**Slide 1**
*Image:* A moss-covered stone monolith in a forest clearing, cracked down the middle. Ancient runes carved into its surface, some still faintly glowing blue, others dark. A wizard's hands extended toward it, channeling light. Kess standing beside, chanting.

*Text:*
> The ritual took hours. Your wizard channeled Aether into the stone while Kess chanted in a language older than the Dominion.
> The runes flickered, dimmed — and finally held. A faint blue glow that pushed back the grey.

**Slide 2**
*Image:* Night scene — translucent spectral figures emerging from mist near the ward-stone, reaching with confused ghostly hands. Adventurers in defensive formation, weapons drawn, protecting the ritual. Blue ward-light clashing with grey mist.

*Text:*
> The dead came, as she predicted. Not with malice — with confusion. Spirits that didn't understand why they were there, drawn to the weakening boundary like moths to a crack of light.

**Slide 3**
*Image:* Kess sitting against the now-glowing ward-stone, exhausted. The clearing is quiet. Dawn light. She's looking directly at the viewer with a tired but evaluating expression.

*Text:*
> *"The world is dying. Not today, not this year. But steadily. The god of death was destroyed thousands of years ago, and without him, the boundary between the living and the dead is failing."*
> She looks at you. *"You're building something here. That takes a certain kind of stubborn. We could use stubborn."*

---

### Story Mission 6: "The Robin's Message"

**Slide 1**
*Image:* A small robin perched on a wooden watchtower railing. A tiny scroll is tied to its leg with a thread. Morning light. The settlement visible below — rooftops, smoke from chimneys.

*Text:*
> A robin landed on the watchtower this morning. Just a bird — except it carried a tiny scroll, sealed with wax that shimmered faintly.
> The seal bears no sigil. The handwriting inside is precise but shaky — written by someone very old, or very tired.

**Slide 2**
*Image:* Close-up of aged hands holding a small unfurled scroll. The handwriting is elegant but trembling. A candle flickers nearby. The text is partially visible.

*Text:*
> *"I have watched your settlement for some time. You reinforce wards. You fight what comes through. You ask questions instead of praying for answers. This is rare."*
> *"I have spent a very long time studying why the ship is sinking. I know the problem. I do not yet know the solution. But I believe the answer is close."*
> *"Follow the robin when it flies south. It knows the way. — H.F."*

**Slide 3**
*Image:* Kess reading over the viewer's shoulder, her expression shifting from curiosity to surprise to recognition. The robin visible through the window behind them, still perched. Waiting.

*Text:*
> Kess frowns. *"A robin? The Thornveil elders say she used ravens."*
> A pause. Then understanding: *"She changed. Because someone was intercepting the ravens."*
> *"H.F. — Halldora Frostvik. They say she was alive before the Dominion existed. They say she knows why the world is broken."*
> The robin tilts its head at you. Small, ordinary, easily overlooked. Waiting.

---

## UI Component Design

### CinematicOverlay

A full-screen overlay component with:
- **Background:** Full-bleed image, covers entire viewport
- **Text overlay:** Semi-transparent dark panel at the bottom (or top, per slide config)
- **Text rendering:** Italic for narrative, bold for character dialogue, supports `{villageName}` interpolation
- **Navigation:** Click/tap anywhere to advance, or arrow keys. Dot indicators at the bottom.
- **Skip button:** Small "Skip" in the top-right corner, always visible
- **Transition:** Crossfade between slides (~0.5s), final slide fades to black then to game UI
- **No game audio/ticks during cinematic** — pause the tick loop while overlay is active

### Story Mission Integration

- `StoryMission` interface gains `cinematic?: CinematicSlide[]`
- In the completed mission claim area, detect if `STORY_MISSIONS.find(m => m.id === result.missionId)?.cinematic` exists
- If yes, change button text from "Claim" to "Claim & Continue Story"
- On click: grant rewards as normal, then show the `CinematicOverlay` with that mission's slides
- After cinematic ends, remove the completed mission from the list as normal

---

## Implementation Order

1. **CinematicOverlay component** — reusable slide viewer with image + text + navigation
2. **Intro cinematic** — trigger on first load, 4 slides with placeholder images
3. **Story mission cinematics** — add `cinematic` data to STORY_MISSIONS, wire up claim button
4. **Generate images** — Midjourney prompts below, upload to CDN
5. **Polish** — crossfade transitions, text animation, sound effects (optional)
