# DESIGN — Kept Animals (dogs & cats)

**Status (2026-08-14 audit):** dogs BUILT — `KeptAnimal` state, kennel building + capacity, guard/hunt jobs + leveling, happiness, breeding, strays, named story firsts (Truffle, Ser Sniffsalot). Cats + the vermin loop entirely unbuilt (the `mouse` job value is declared but unused; no cat_shelter building).

One shared model for the working animals the settlement *keeps* — dogs and cats
— rather than two one-off mechanics. They differ only in the jobs they can take.
Cozy and attachment-driven: named companions with moods you post to useful work,
not a spreadsheet to optimize.

Supersedes the guard-dog bit of `DESIGN_LIVESTOCK` (the gold toggle) and the cat
half of `DESIGN_WORKERS_PLAGUES`.

## The shared model

A **kept animal** is a small named entity:

| Field | Notes |
|---|---|
| `id`, `name` | Named — the whole point is attachment. Strays get auto-names; story ones are fixed. |
| `species` | `dog` \| `cat` — the only thing that gates which jobs it can take. |
| `assignment` | A job slot, or `null` = "at the fire" (idle/pet, charm only). |
| `level` | Efficiency 1..N. Rises **passively from time on the same job** (a seasoned guard is better). No active training. |
| `happiness` | Light, mostly automatic (see below). |
| (derived) `age`/pup | Optional later: pups grow into workers. Not v1. |

**Jobs (the only species difference):**
- **Dog → guard a flock:** posted to a pen, it kills wolf predation there. Level scales how fully (rookie cuts predation, veteran stops it).
- **Dog → hunting camp:** posted there, +X% meat yield. Level scales the boost.
- **Cat → mouser:** posted to the food stores (Cat Shelter's coverage), it suppresses the vermin infestation drain (see the vermin loop below).

Start with exactly these. Herding, mission-tracking, etc. are later ideas.

## Acquisition — mostly strays, with named firsts

- **Strays (the charm):** occasionally a stray follows a new citizen in — free, auto-named, a small delight. Low rate; cats stray more than dogs.
- **Named firsts (story):**
  - **The Thornwoods' dog** — arrives with the hunting family in early game. The first working dog, gifted.
  - **"His Lordship"** — a stray cat the Lord adopts; he brings the Lord a rat (or leads him to his kittens), and *that* prompts building the Cat Shelter. The cat earns the building.
- **Raised litters (later):** the Kennel / Cat Shelter can raise pups/kittens from the animals you keep. Not v1.

## Efficiency, happiness, upkeep

- **Efficiency (level):** passive, from continuous time posted to a job. Caps at a few levels. Reassigning resets progress on the *new* job slowly (a guard dog isn't instantly a great hunter). Keeps attachment ("old Bess has guarded that flock three years").
- **Happiness:** light and automatic. Fed + posted to a fitting job = content = full effect. Unfed or long-idle = mopey = reduced effect. **Never death or running away** — this is cozy. Shown as a simple happy/mopey face.
- **Upkeep:** each animal eats a little (scraps / meat / bones — modest). Ties them to the food economy so feeding them reads as care. The home building's capacity caps the herd so it can't balloon.

## Buildings — the roster homes

- **🐕 Kennel** (camp/village tier) and **🐈 Cat Shelter** (village tier, unlocked by His Lordship's nudge) are the management screens: see every animal — name, happy/mopey face, where it's posted, its level. House + feed them; later, raise litters. Capacity per level caps the herd.
- The screen should feel like *"look at my good animals,"* not a management grid. Keep counts small (a handful each).

## Replaces the gold guard-dog toggle

Today a pen's guard dog is an abstract one-off gold buy (`pen.guardDog: boolean`).
New model: you **assign one of your actual dogs** to the pen; `pen.guardDog`
becomes "a dog is posted here," and the dog's level scales how much predation it
stops. Warmer, and it makes the roster matter.

## The vermin loop (cats' job — the later slice)

Village-tier and up, occasional **infestation events**: rats show up and drain
stored food over time until dealt with. Counters: a **Cat Shelter** with cats
posted to the stores suppresses/prevents the drain (higher-level/ more cats =
better coverage). Framed as events to respond to, not a constant tax. This is
the cat's reason to exist; detail lives with `DESIGN_WORKERS_PLAGUES`.

## Phasing

1. **Dogs first (this is buildable now):** the shared kept-animal model + dogs as
   its first user. Thornwoods' dog (early) + strays; assign to flock-guard
   (reuses the live predation system, replacing the gold toggle) and the
   hunting-camp yield boost. Kennel roster screen. Passive leveling, light
   happiness, modest upkeep.
2. **Cats + vermin loop (village tier):** the infestation events + Cat Shelter,
   His Lordship as the intro, cats posted as mousers. Reuses the whole model.
3. **Later:** raised litters, more jobs (herding, tracking), pups growing up.

## Why dogs first

The Thornwoods arrive in early game and the hunting camp is camp-tier, so a dog's
jobs exist immediately. Cats need the village-tier vermin loop to have a job at
all. So the model ships with dogs, and cats join it when vermin land.
