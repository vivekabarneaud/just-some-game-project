# Weather — what's left to build

**Status (2026-08-19):** Layers 1 and 2 are **BUILT**; this doc now covers only
the unbuilt remainder. What shipped:

- **Layer 1 — ambient mood.** Weather derived from (season, progress, year) rather
  than stored, so it costs nothing in the save and drifts on its own. Ambience
  overlay, top-bar chip, sound mixer. `frontend/src/data/weather.ts`.
- **Layer 2 — weather with teeth.** Heat waves and downpours as real events that
  kill standing crops, plus the per-year **climate band** (drought → deluge) that
  moves yields and biases which events roll. Water system alongside it: wells,
  cisterns, the sluice, per-crop water demand. `frontend/src/data/climate.ts`,
  `water.ts`.

*Merged from the retired Weather Yield doc (in git) (deleted 2026-08-19, fully built). The
build history and the rejected designs — reading yield off ambient weather, the
sin-based hash, drought-as-year-long-plant-kill — are in git.*

---

## Storms

`storm` exists as vocabulary, art and a renderer, and nothing drives it. The
ambient drift never produces one, because storms were always meant to be *events*
rather than moods.

Wants: a duration, a consequence worth reacting to (roof/wall damage? a halted
mission? livestock loose?), and a banner that reads as an interruption rather
than a weather report.

## Blizzard

Doesn't exist at all. Winter currently has snowfall as mood only. A blizzard is
the winter counterpart to the heat wave — the season's crisis event.

## Layer 3 — unnatural (aether) storms

The one that carries story rather than agriculture. **The sky is the wrong colour**
and the weather does not belong to the season. Scripted for story beats, and
later emergent: tied to the ward-stone line, so a failing stone shows up as
weather before anyone reports it. See `project_ward_stone_system`.

The tell has to be unmistakable and *legible without text* — a player who has
never read a lore entry should still feel that something is wrong.

## Smaller open threads

- **Locust / pest raid** — a crop-destroying event, sibling to the weather events.
- **Water trade** — buying and selling water in a dry year.
- **Germination lever** — climate affecting *whether seeds take*, as an axis
  separate from how much they yield. Designed, never wired.
