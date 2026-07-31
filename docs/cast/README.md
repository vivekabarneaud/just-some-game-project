# Valenheart — Cast Files

One file per character. This is the **deep canon** for each member of the cast: everything that is too good (or too spoilery) to fit in the recruit-card bio. The card shows the surface; these files hold the soul, and most of it is meant to be **discovered** in play (tavern conversations, loyalty milestones, story beats), not dumped.

## Rules
- **`LORE_TIMELINE.md` always wins** on world facts (Crown, Church, Varek, the Wastes, magic). If a character file disagrees with the timeline, the timeline is right.
- **No invention without a flag.** If something isn't decided yet, write it under **Open threads / TBD** rather than inventing canon.
- **Player-facing prose has no em dashes** (the recruit-card bio especially). Design notes in these files can use them freely.
- Filenames are kebab-case: `nessa-thornwood.md`. Families get a shared context file too (e.g. `thornwood-family.md`) so the common backstory lives in one place and the sibling files cross-reference it.

## Index
### The Thornwoods (the "hunters family" — unlocks the Adventurer's Guild)
- [thornwood-family.md](thornwood-family.md) — shared family canon (parents, the winter, the boy, the reunion)
- [nessa-thornwood.md](nessa-thornwood.md) — char_000, archer, the lifelong mother
- [gareth-thornwood.md](gareth-thornwood.md) — char_005, archer, the limits of conscience
- [godric-thornwood.md](godric-thornwood.md) — char_021, warrior, the wall born of grief
- [thornwood-boy.md](thornwood-boy.md) — the adopted child (settlement NPC, name TBD)

### Curated cast (deepened)
- [hester-ironbark.md](hester-ironbark.md) — char_019, warrior, the wall she built
- [elspeth-ravencroft.md](elspeth-ravencroft.md) — char_007, assassin, the reluctant poisoner-mother (quest-unlock)
- [edmund-blackwood.md](edmund-blackwood.md) — char_009, assassin, the gambler (quest-unlock)
- [morgause-dunwall.md](morgause-dunwall.md) — char_020, warrior, the discarded commander
- [sable.md](sable.md) — char_008, assassin, the street orphan with nothing to lose (mononym, ex-Lyra)
- [aldwin-stonebridge.md](aldwin-stonebridge.md) — char_017, priest, the shelterer-priest whose faith cracks for love of his wizard brother
- [magnus-stonebridge.md](magnus-stonebridge.md) — char_029, wizard, the hunted prodigy (your first magic; ex-Alaric)
- [stonebridge-arrival.md](stonebridge-arrival.md) — *story arc:* the magic-unlock beat (their arrival, Magnus's confession, the Lord's mercy, the faith-crack)
- [arrival-order.md](arrival-order.md) — *planning:* who arrives when and *why* (the three arrival engines + the rough Act-1 order + unlock gates)

### Side-story figures (NPCs)
- [aldith-the-bog-witch.md](aldith-the-bog-witch.md) — the Bog Witch & her dead granddaughter Ada

---

## Template
Copy this for new character files.

```markdown
# <Full Name>
- **Status:** locked / in progress / TBD
- **Recruit ID:** char_xxx (or "settlement NPC" / "side-story NPC")
- **Portrait file:** <filename> (note if it mismatches the name)
- **Class / Race / Origin:** 
- **Food preference:** 
- **Trait(s):** 

## Recruit-card bio (public surface)
> The in-game backstory string, verbatim.

## Deep lore (discovery-only)
What the player learns over time, not from the card.

## Personality & tells
How they act, speak, what gives them away.

## Relationships
Family, bonds, rivalries (cross-link other cast files).

## Preferences & specificities
Food, habits, objects they carry, quirks.

## Talent / ability ideas
Bespoke per-character talent direction (trees are being reworked to be unique per character; class stays as the chassis + equipment frame).

## Open threads / TBD
Undecided pieces, flags, future hooks.

## Cross-refs
Docs, missions, memories, other cast files.
```
