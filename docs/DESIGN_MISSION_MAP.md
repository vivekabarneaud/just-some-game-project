# DESIGN — The Mission Map

**Status (2026-08-14 audit):** BUILT well past Phase 1 — full-screen map with pan/zoom, pin frames, close-to-home dock, dev placer, parchment fog with authored reveal regions + persisted reveals, marching/fighting team tokens. Remaining: pin authoring (~58 of ~130 missions placed), Phase 3 climate (the field exists but zero missions set it and no seasonal debuff is wired — the kitchen warmth payoff), painted final map art, pin clustering.

## Intent

The list-of-cards mission board becomes a **world map of our valley**, zoomed in
on the settlement to start (pannable, zoom-out later). Every field mission is a
**circle pin** at an authored spot on the map, framed by its type (main story,
side-chain, urgent, ordinary). Clicking a pin opens the **team assembly panel**
directly. Think WoW world-quests: the geography IS the menu.

This also unlocks **mission climate** (cold / hot), which is what finally makes
the kitchen's warm & fresh food channels matter (see DESIGN_KITCHEN.md and the
mission-climate note).

### ⭐ Live weather on nearby missions (idea, 2026-08-19 — user's)

Climate as designed above is a *permanent property of a place* (the cold north,
the hot south). The complement: **today's weather should reach the missions close
to home.** A heat wave or a downpour is already a real, mechanical event with a
duration (`weather.ts` — it kills crops and drains water), and it is *visible in
the top bar* — so letting it touch the nearby pins costs almost nothing and makes
the sky matter to more than farming.

Why it's good: it reuses a built system, it gives the same warm/fresh food
channels a second reason to exist, and unlike authored climate it needs **no
per-mission authoring at all** — proximity to the settlement is already known
from `map: {x, y}`.

Open questions for when this gets built:
- **How near is near?** A radius around the settlement pin, or a "close to home"
  flag? Radius is free (the coordinates exist) and reads naturally on the map.
- **Modify or gate?** Prefer *modify* (a debuff, worse rewards, longer duration)
  over blocking deployment — a hard block strands a player who only has the one
  mission left.
- **Show it on the pin.** The weather icon on affected pins, or a translucent
  wash over the near-map, so the player connects sky → pin without reading a
  tooltip.
- Distant missions ignore local weather, which is itself a nice tell: the valley
  has its own sky, the Wastes have another.

Cross-refs: DESIGN_WEATHER.md (the event layer), DESIGN_KITCHEN.md (the food
mitigation), and the climate section below (the authored, permanent axis).

## The model (everything authored by hand)

Two new optional fields on `MissionTemplate` (shared/src/data/missions/types.ts):

```ts
/** Where this mission pins on the world map. Normalized 0..1 of the full map
 *  image (so the pin survives pan/zoom). Authored per mission. Missions with no
 *  `map` fall to the "close to home" list until a pin is authored (see below). */
map?: { x: number; y: number };

/** The mission site's climate, authored (NOT derived from y). Drives the
 *  seasonal debuff that warm/fresh food mitigates. Omit = temperate. */
climate?: "cold" | "temperate" | "hot";
```

Deliberately NOT doing: regions, or computing climate from position. Both `x, y`
and `climate` are set by hand on each mission, exactly like `difficulty` or
`deathRisk` already are. Full authorial control; a "hot" mission can sit wherever
the story wants it.

### Pin frames (reuse existing card styling signals)

No new data needed. The pin reads the same flags the card already styles from:

| Mission kind          | Signal on the template     | Frame                  |
|-----------------------|----------------------------|------------------------|
| Main story            | `StoryMission` (storyOrder)| ornate gold            |
| Side-chain            | `sideChain`                | teal                   |
| Urgent (settlement)   | `urgent`                   | orange, pulsing        |
| Ordinary / gather     | (none)                     | plain / bronze         |

The pin shows the mission icon inside its frame; a small ❄/☀ badge marks
`climate` when set. Difficulty stars can ride the pin as a tiny row beneath.

### Non-geographic "missions"

Folk social check-ins and tavern conversations **are not missions** and don't go
on the map. If any ever become map-worthy, they pin on or beside the settlement.
Everything currently in the board that is a genuine field mission gets a pin;
anything internal stays in its building.

## The viewport

- One large map image (your painted valley). The visible area is a CSS
  transform (translate + scale) over it.
- **Initial view:** zoomed on the settlement (the crop you sketched). Drag to
  pan. Zoom-out comes later; the transform is built for it from day one.
- Pins are positioned by `map.{x,y} * imageSize`, so they stay glued to the
  terrain through pan/zoom.
- Pan is clamped to the image bounds (no panning off into the void).

## Migration safety (so nothing disappears)

The ~45 existing missions won't have `map` coords on day one. Rule: **a mission
with no `map` field falls to a small "Close to home" list** docked beside/under
the map. As we author each pin the mission leaves the list and appears on the
terrain. This lets us ship the map immediately and place pins incrementally,
with zero risk of a mission going unreachable mid-migration.

## Dev authoring helper

Hand-placing ~45 coordinates is the only real cost of per-mission `x, y`. Kill it
with a **dev-only click-to-place overlay**: click anywhere on the map, it prints
the normalized `{ x, y }` to copy into the mission. (Same spirit as the old
/dev pages, gated to dev.) Makes authoring a copy-paste job, not guess-and-check.

## Fog (later phase — how to split art vs code)

Static hand-painted fog (Procreate) looks great but can't hide/reveal by
discovery, so on its own it's a decorative vignette, not fog-of-war. The split:

- **You paint** the fog TEXTURE (cloudy parchment, soft edges) as an overlay
  image.
- **Code controls** where it's drawn and peels it back per discovered area via a
  reveal mask driven by game state (scouting).

The first version has **no fog** (everything visible, zoomed on the settlement),
so this is safely deferred and never blocks the pin work.

## Phasing

1. **Prototype** — sketch as background, pins for current available missions at
   authored (or fallback-list) positions, click → team assembly panel. Fixed
   zoom on the settlement, drag-pan. Dev click-to-place helper. The board list
   becomes the "Close to home" fallback dock.
2. **Author pins** — add `map.{x,y}` to the real missions, one by one, until the
   fallback list is empty.
3. **Climate** — add `climate` to missions; wire the seasonal debuff + warm/fresh
   food mitigation (DESIGN_KITCHEN warmth/freshness channels earn their keep).
4. **Zoom-out + decor** — expose zoom controls; swap the sketch for the painted
   map with per-site decor (trees, mountains).
5. **Fog + scouting** — painted fog texture + programmatic reveal mask; a scout
   action uncovers areas.

## Open (park until we get there)

- Do multiple pins on the same spot need a fan-out / cluster expander? (Only if
  the valley gets crowded; unlikely at ~45 missions across the map.)
- Active/deployed missions: show a moving token along the road, or just mark the
  pin "in progress"? (Ties to the existing outbound/combat/homeward phase.)
- Zoom levels: free pinch-zoom vs a couple of fixed steps (settlement / valley).
