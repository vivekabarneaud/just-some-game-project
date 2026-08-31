# DESIGN: Spiders — the Cave/Quarry family (Web & Ambush)

**Status:** Designed 2026-07-26. **Quarry-gating loop BUILT 2026-07-27** (Phase 1: the system + L2/L3 gate). Spider *family* (Web-spinner/web-root, Ambush, Brood Mother, silk gear) still to come. Deferred *out of the marsh* (see [[DESIGN_MARSH]]) — spiders' web/root shines underground, not as a redundant second immobilise next to the Constrictor's grapple. Their home is **quarry / mines / the Spider Hollow.** Follows [[DESIGN_ENEMY_AUDIT_METHOD]].

**BUILT (Phase 1, quarry-gating):** `quarrySpidersClearedLevel` state (starts 1); the quarry yields at `min(quarry.level, cleared)` so digging past the spiders holds output at the previous level until cleared; a forced-only `clear_diggings_${N}` mission (short, in-pit, XP-only, Tomas-framed) injected via the existing `forceMission` path while `quarry.level > cleared`; completing it advances `cleared` and unlocks the new yield. **L2** = `rock_skitter` swarm (reused the existing tiny-spider swarm rather than authoring a redundant "Rock Spider"; it can be differentiated later), **L3** = `rock_skitter` + venomous `cave_spider` (Cave Spinner). Guarded by `quarrySpiders.test.ts`. Materials come off the spiders' own loot, not the mission. Not a director chain — the director is one-way narrative and can't place missions or gate yields.

**One-line:** Underground control-and-attrition. **Web = a ranged *root*** (pins you where you stand — a rooted archer can't kite, a rooted melee can't close), over **venom, ambush, and brood-spawn.** Compassion-framed: it's *their* rock; we dug into it.

---

## The tone — mercy, as always

The Lord's mercy for animals holds here. The spiders aren't a menace to purge — **we disturbed them.** Quarrying broke into their crevices; they boil up defending the dark. So the framing is **protect the crew / drive them back down**, not exterminate. (Same register as the marsh adders' home and the "animals aren't kill-on-sight" ethos.)

## The family

Home: quarry (shallow) → mines → the Spider Hollow (deep). Web/root is the signature; **web ≠ the Constrictor's grapple** — it's a *root* (immobilise-in-place, you still fight at your current range), not a pull-to-0 hold.

| Spider | Tier | Role |
|---|---|---|
| **Rock Spider** *(new)* | 1 | the quarry-crew attacker — lesser, venom, comes in numbers (the shallow-dig hazard) |
| **Cave Spinner** *(exists)* | 2 | the standard venomous spider (mines) — poison 12%/3rd; drops `spinners_bile` + `chitin_plate` |
| **Web-spinner** *(new)* | 1–2 | the **root** specialist — pins your movers so the others swarm |
| **Ambush Spider** *(new, saved — tier 2)* | 2 | hidden / ceiling-drop **first strike** — the deeper you go, the more it lurks. *(Loved it — keep for the tier-2 depths.)* |
| **Brood Mother** *(new)* | 2–3 | spawns spiderlings; the **Spider Hollow's apex** (the well→silk-tunnels dungeon that already exists) |

**Mechanics:** web/root (ranged immobilise) · venom · ambush (surprise strike) · brood-spawn (a swarm generator).

**Loot — spiders *earn* gear (unlike fungal):**
- **Silk** *(new)* → **bowstrings** (an alternative to sinew) **+ light silk armour** (strong, weightless). A genuinely nice material.
- **chitin** *(exists: `chitin_plate`)* → **armour plates** (light armour).
- **spinners_bile** *(exists)* → **alchemy / poison** (a venom coating, a toxin).

So spiders are a **gear + alchemy** material family with a real home and a built-in reason (you go underground for stone / expeditions).

---

## The quarry-gating mechanic (⭐ the systems idea)

**Quarry level = how deep you've dug = how strong the spiders.** Each upgrade is *softly gated* by a spider mission:

- Build **quarry L1 → L2**: a spider mission fires (the little **Rock Spiders**, disturbed by the deeper cut). The quarry **keeps yielding L1 production until you clear them** — *then* it reaches L2 output.
- **L2 → L3**: same shape, but **stronger / more numerous** spiders (Cave Spinners, a Web-spinner, an Ambush lurker). Yields L2 until cleared → L3.
- …and so on, deeper each time.

Why it's good:
- **The mechanic is the fiction** — dig deeper, wake worse things, deal with them to reap the depth.
- **Soft gate, not a wall** — the quarry still works at the *previous* level, so you're never stuck; you're *incentivised* (you want the new output) but not punished. (Cleaner than the earlier "production drops during the attack" idea — this stays at the old level.)
- **Recurring, escalating spider content tied to the economy** — every quarry upgrade is a spider fight, scaling naturally with your progress.
- Compassion intact: you broke into their home *again*, going deeper.

## Missions
- **Quarry-crew defence** *(new, the L-up gate)* — the disturbed spiders swarm **Tomas + the cutting crew**; protect them, drive them back. Cast-tied (Tomas), tier scales with quarry level.
- **Spider Hollow Descent** *(exists — expedition)* — the eastern well → silk-clogged tunnels. The *deep* spider content; a good home for the **Brood Mother** apex + the **Ambush** lurkers.
- Cave Spinners also appear as mixed-encounter hazards in existing apprentice/expedition missions.
