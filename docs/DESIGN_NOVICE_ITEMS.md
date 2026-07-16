# Novice Items + Weapon-Damage Combat Model

**Status:** DESIGNED (2026-07-16), building. Branch `feature/weapon-damage` (off preprod + the equipment folder/rarity tidy).

Two coupled pieces: a **combat rework** (weapons carry damage, armor carries defense by default) and a **novice-tier item audit** (what to keep/cut/add) that depends on it. Build the combat foundation first; author the items against it.

---

## 1. Rarity framework (WoW-like)

The stat budget is the rarity, and the starter worn gear is already the correct "common" tier (0-stat).

| Tier | Stat budget | Source | Craft gate |
|---|---|---|---|
| **Common** (white) | **0 stat bonus** — function only (a weapon's damage range; an armor's DEF number) | starter worn gear + basic craft | pure early mats (wood / leather / cloth), guild L1 |
| **Uncommon** (green) | **+1, occasionally +2** total | early mats + a little iron or one beast drop | guild L2–3 |
| **Rare** (blue) | **+2/+3** | **only** a named early-boss drop | guild L3–4 |
| Epic+ | — | dragon / void / infernal | **out of novice scope** |

**Materials → timing.** Early: wood (lumber mill), leather (pelts→tannery), fiber (flax), wool→cloth, a little iron (iron mine). Beast drops from the novice board: wolfhide/fang/sinew (wolves), thick pelt/claw (bear), chitin (spider). Gated-late: astralShards (magic — already walls off enchanted gear), orc_steel/cursed_iron/dragon_fang (mid+ bosses), all jewelcrafting. So the economy already enforces "no magic early" via astralShards.

**Novice scope, per the player's steer:** a few **weapons + chest + cloak**, nothing too strong. No trinkets/jewellery at novice (fine to have none). Head/legs/boots front-loaded lightly (guild L2–3), not day-one.

---

## 2. Combat model — weapons deal damage, armor mitigates

### Today (for reference)
- `getAttackPower` = the primary stat itself (warrior→STR, archer/assassin→DEX, caster→INT; enemy→max(STR,DEX)).
- Auto-attack damage = `power × (0.7–1.3 random)`. Weapons are pure stat sticks; a 0-stat weapon does nothing.
- Defense: players via `gearDefense` (summed armor DEF); enemies via `vit×3`. Reduction = `def/(def+150)`.
- Elements exist only as **enemy tags** (elemental_fire/…); no attacker-side element/damage-type. Casters have ability spells but a generic INT-magical auto-attack. Talents don't scale by element.

### Phase 1 — weapon-damage foundation (BUILD FIRST)
Unblocks warrior/archer/assassin novice items; contained + testable.

- Add **`dmgMin`/`dmgMax`** to melee/ranged **weapons** and to **enemies** (a wolf bites e.g. 3–6 — explicit, tunable).
- **Unarmed fallback** range (fists, e.g. 1–2) so a weaponless unit still works.
- **Armor DEF-by-default:** every armor piece carries a `defense` value (none 0/undefined).
- Rework `calcDamageResult` physical path:
  ```
  base = randInt(weapon.dmgMin, weapon.dmgMax)   // weapon's own range replaces the ×0.7–1.3 wobble
  raw  = base × (1 + primaryStat · k)             // multiplicative: weapon AND stat both matter
        → crit / traits / wounded / defense as today
  ```
  `k` is a tuning constant (~0.08–0.1); exact value is a balance pass. Enemies use their intrinsic range the same way (scaled by their stat).
- **Casters interim:** keep the current INT-magical auto-attack (or a simple staff magic range) so they still function until Phase 2.
- Rebalance + re-verify the `simulateCombat` tests (some missions are tuned to win-rates, e.g. spider_hollow @ difficulty 2).

### Phase 2 — caster spell-weapons (its own slice, AFTER)
PoE2/Diablo model: the staff/wand **carries a spell that replaces the auto-attack**.

- New **element / damage-type** layer (fire / frost / holy / arcane / shadow …) on the attacker side.
- **Spell** defs (base damage range + element); a staff/wand carries a `spellId`; a caster's auto-attack *casts that spell*.
- **Talent hooks:** `+X% <element>` scales the weapon's spell —
  `casterRaw = spellRoll × (1 + INT · k) × (1 + elementTalentBonus)`.
- Reuses the existing `abilities/wizard.ts` / `priest.ts`.
- Novice staves ship a single **placeholder spell** (a plain arcane bolt) in Phase 1, and become proper element spell-weapons here — no caster content wasted, just deepened.

**Parked ideas for Phase 2 (2026-07-16):**
- **Staff physical fallback range (WoW-like).** Give staves/wands a *small physical* damage range too, so a caster who can't cast still has a fallback — a Gandalf-style whack. Pairs with a **silence** status (below): silenced → the caster's auto-attack drops from its spell to the staff's physical range. Some wizards could have a **talent** that makes staff-melee genuinely viable (a battle-mage build).
- **`silence` status** — target can't cast; casters fall back to the staff's physical range (needs the fallback above).
- **`disarm` status** — target's weapon is knocked away; they fall back to the **unarmed fists range** (already built in Phase 1). A natural enemy-ability (a wrestler/ogre disarm) that makes the fists floor matter. Both silence + disarm are "strip your normal attack, force the fallback" statuses — design them together.

---

## 3. Weapons audit (novice)

| Class | Common (0-stat, damage range) | Uncommon (+1/+2, early mats) | Rare (early boss) | Cut / merge |
|---|---|---|---|---|
| Warrior | `plain_sword` | `iron_sword` → **re-tier to uncommon** (+1 STR, iron) | add one (bone/beast) | — |
| Archer | one plain bow | `sinew_bow` (wolf sinew) | — | **merge `short_bow` + `hunting_bow`** (dupe +1 DEX commons) → one common bow |
| Assassin | `worn_dagger` | `iron_dagger` → uncommon | — | — |
| Wizard/Priest | `plain_staff` / `wooden_staff` (0-stat; Phase-1 placeholder spell) | mundane only | — | `enchanted_staff` stays out (astralShards = post-story-4) |

**Rare novice weapons (add 1–2 from bosses that already exist on the board):** an **alpha-wolf** weapon (alpha_fang) and/or a **bear** weapon (claw/bone). That's the "one or two rare, crafted from a unique boss drop."

**Out of novice scope (keep, mark not-novice):** steel_sword, longbow, orc_cleaver, stiletto, poisoned_blade, blessed_mace, all epics.

---

## 4. Armor audit (novice) — chest + cloak front-loaded

- **Chest, common (strip to 0-stat, keep DEF):** `leather_vest` (30 DEF), `woolen_robe`/`homespun_robe` (cloth).
- **Chest, uncommon (beast/boss):** `wolfhide_armor` (wolf), `chitin_vest` (spider) — material stories already wired.
- **Cloak, common:** `leather_cloak` (strip +1 DEX → 0-stat, keep 12 DEF).
- **Head/legs/boots:** re-tier the +1 leather pieces to 0-stat commons or push to uncommon; arrive at guild L2–3, not day-one.
- **Out of scope:** iron/chainmail/plate sets, ranger's garb, all rare/epic cloaks, dragon scale.

---

## 5. Concrete cut / merge / re-tier list (novice)

- **Merge** `short_bow` + `hunting_bow` → one common bow.
- **Strip stats** off items meant to be common (leather_vest, leather_cloak, leather_boots/hood/pants, soft_shoes, cloth_leggings) → 0-stat + DEF.
- **Re-tier to uncommon:** iron_sword, iron_dagger, a stat-bearing wooden_staff, woolen_robe.
- **Leave alone, mark "not novice":** every epic + the +3/+4 uncommons + special-material rares.

---

## 6. Build order

1. **Phase 1 combat** — schema (`dmgMin/dmgMax` on weapons + enemies, `defense` on all armor, unarmed fallback), `calcDamageResult` rework, rebalance, re-verify sims.
2. **Novice item pass** — apply §3–5 against the new schema (fill weapon ranges, strip/re-tier stats, merge dupes, add 1–2 rare boss weapons).
3. **Phase 2 caster spell-weapons** — element layer, spell defs, staff `spellId`, talent element scaling.
