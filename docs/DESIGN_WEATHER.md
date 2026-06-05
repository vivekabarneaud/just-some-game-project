# Weather — Design

Status: **Layer 1 shipped (cosmetic).** Layers 2 & 3 designed, not built.

Weather splits into two genuinely different things; keeping them separate is what
keeps the system from feeling muddy.

- **Mood weather** — clear / overcast / rain / snow / fog. Frequent, low-stakes,
  cosmetic. Its job is "the world feels alive every time you glance up."
- **Weather *events*** — drought / storm / blizzard. Rare, named, have duration
  and *consequences*, surface in the event log/banner. Mechanics, not mood.

## Three layers

### Layer 1 — Ambient mood (BUILT)
A `WeatherType` is **derived** from `(season, progress, year)`, not stored, so it
costs nothing in the save and needs no migration. It drifts on its own as the
season advances (6 windows per season). Weighted per season:

| Season | Lean |
| --- | --- |
| Spring | rain, overcast |
| Summer | clear (sun), some overcast |
| Autumn | overcast, rain, fog |
| Winter | snow, overcast |

Files: `frontend/src/data/weather.ts` (vocabulary + drift),
`frontend/src/components/WeatherAmbience.tsx` (topbar particle strip),
weather chip in `Sidebar.tsx`, CSS in `global.css` (`.wx-*`).

`storm` and `unnatural_storm` are in the vocabulary and the renderer already draws
them, but ambient drift never selects them — they arrive via Layers 2/3.

### Layer 2 — Natural events (TODO, cosmetic-first deferred the effects)
Plug into systems we already have rather than new parallel ones:
- **Drought** — seasonal (summer/late-summer), slow-building. Hooks farm yield +
  fire risk. Player mitigates (wells, rationing).
- **Storm** — short, sharp, *any season*. Hooks the existing raid building-damage
  path; can disrupt active missions. This is why storm doesn't feel "seasonal":
  it's an event, not a climate.
- **Blizzard** — winter-amplified; turns up the existing winter-cold dial.

Seam: resolve as `weatherOverride ?? getAmbientWeather(...)`. An event sets the
override for its duration; the renderer already knows the look.

### Layer 3 — Unnatural (aether) storms (TODO — story)
A storm *subtype* that's narratively flagged: wrong season, wrong colour (violet
lightning / green cast — `wx-flash-aether` already built). It's a **tell**: when
the ward-line weakens (ward-stone health), the sky turns and storm elementals
follow. The player learns to *read the sky* to predict aether raids — the
two-track-knowledge payoff.

Decision: **both scripted and emergent.** Scripted unnatural storms for story
set-pieces; emergent ones triggered by ward-stone health / aether pressure.

## Open questions for later
- Should a weather *event* (Layer 2) pause/blunt the ambient drift, or layer over it?
- Does the weather chip gain an "effects" line once Layer 2 lands (hover already reserved for it)?
- Reduced-motion: events are gameplay-relevant — surface them in text/log, not only as motion.
