# Founding Characters — April 24, 2026 archive

Snapshot of `frontend/src/data/founding_characters.ts` as it existed in commit `f91a10b` ("Slim coreBios to nameplates, add Edda's first four fragments"), preserved here for reference. The April 24 work was discovered after a fresh-machine session re-did the same beats with slightly different phrasings; today's text superseded this version on `main`, but this file keeps the original wording browsable.

To see the full original commit:

```bash
git show archive/april-24-edda-fragments
```

(A git tag was placed on the original commit before it was force-overwritten.)

---

## Core bios (April 24)

| Character | coreBio |
|---|---|
| The Lord (37) | "I am thirty-seven. I was the schoolmaster of Ashwick. I keep this book because a schoolmaster keeps books." |
| Edda (71) | "Midwife of Ashwick for forty years. She came south with us." |
| Jory (36) | "Carpenter. He grew up next door to me." |
| Tomas (48) | "Stonemason, former militia sergeant. He came home from the border with a limp." |
| Father Corin (68) | "Priest of the Radiant One, retired. He baptized me." |
| Nell (11) | "Jory's daughter. She is eleven." |

---

## Edda — fragments (April 24 phrasings)

### `edda_first_fire` (kitchen / first fire)

> I got the fire going, and Edda came over with her apron full of herbs she had probably gathered at dawn, while the rest of us were still asleep. She crushed them between her palms and let them fall into a pot — and as I watched her, I began to feel at home for the first time since we left Ashwick.
>
> She gave me a cup when it was ready. It was bitter and warm, and there was an old song in it, somewhere.

### `edda_my_boy` (pantry)

> Edda walked into the pantry the minute it was finished, and I followed her in. She climbed onto a stool without asking for help, began setting jars on the top shelf, and muttered the names of herbs under her breath the way she used to in her own kitchen.
>
> I stood in the doorway and watched her, remembering all the times she has been there — a remedy for every cut, every fever, every childhood fear that had no name. She still says "you'll live, my boy" the way she said it when I was four.
>
> She has been here my whole life.

### `edda_gronmoder` (forager's hut)

> I was crossing behind the forager's hut when I heard Edda's voice in the herb patch, low and deliberate, the way she reads to children.
>
> "Grønmoder," she was saying. "That is the old name. It stays in this patch. You understand?"
>
> I stopped. Nell was kneeling beside her. She mouthed the word back — Grønmoder — and smiled the small smile, the one no one else ever gets.
>
> I have known Edda my whole life, and I had never heard her speak that word, or any word like it. I understood without needing to be told that I was not meant to hear it now either.
>
> I walked the long way around.

### `edda_nereia_stream` (fishing hut)

> We finished the fishing hut today. I stayed by the water a while after the others had left. Edda stayed too, a little way upstream. She did not see me.
>
> She had a small bundle in her hand — herbs, tied with a length of string. She held it a moment. Then she tossed it into the river, with a small, deliberate motion, the way one might hand something to someone standing in the water.
>
> I heard her say a name under her breath. Nereia.
>
> I was a schoolmaster for ten years. I do not remember a saint by that name. Probably an old folk ritual, the kind grandmothers pass down without thinking about it. It is Edda. I did not stay.

---

## Jory — fragment (April 24 — pre-retcon, kept stoic)

### `jory_sawhorse`

> Jory spent the morning setting up a sawhorse from the wheels of our own wagon. He said it was foolish to keep a wagon that could not roll home, and he said it with his back to me, which is how he tells me things that matter.
>
> We grew up next door. I know the weight of his back.
>
> Nell brought him water and lingered by the sawhorse longer than any task required. He let her. He has let her every day of these three years, and I have watched him not say why, and Nell has watched him not say why, and somehow between the three of us the silence has become a kindness instead of a wound.
>
> He has begun. That is enough, this week.

*(Note: this version contradicts the April 2026 retcon making Jory the jokester — `FOUNDING_CHARACTERS.md:104-106`. Replaced on April 26.)*

---

## Tomas — fragment (April 24)

### `tomas_quarry`

> Tomas took three men out to the stone cut this morning, and by sundown they had a block square enough to please him — meaning he looked at it, grunted once, and lit his pipe, which in Tomas's accounting is approximately a standing ovation.
>
> He walked the perimeter at dusk anyway, the way he always does. He limps when he thinks no one is looking. I have stopped asking why. Some men build a wall around the town; Tomas is the wall.
>
> I told him tonight we were lucky to have him. He did not answer. Then, later, as I was turning in, he said from somewhere I could not see: "We are lucky to be anywhere at all."

---

## Father Corin — fragment (April 24, kept on April 26)

### `corin_altar`

> Father Corin dragged a flat rock out of the brush this morning, placed it at the edge of the clearing, and blessed it as an altar. No hymnal for this one — he said he knew the words, and he did. He always does.
>
> "The Radiant One does not mind a rough altar," he told me after, "so long as we do not pretend it is not rough."
>
> I sat in the grass and listened, which I did not do nearly enough in Ashwick. It is easier to pay attention when you cannot hear your own footsteps on stone. The old words still work out here. Maybe they work better.

*(This one survived into the April 26 commit nearly unchanged — only em dashes were swept.)*

---

## Diff notes — April 24 → April 26

- Edda fragment IDs renamed: `edda_my_boy` → `edda_pantry`, `edda_gronmoder` → `edda_forager_hut`, `edda_nereia_stream` → `edda_fishing_hut`. Nothing was deployed under the old IDs, so no save migration needed.
- Lord's coreBio shortened: "I am thirty-seven..." replaced with no first-person preview (kept the older third-person summary instead).
- Edda's coreBio: "She came south with us" line dropped (made minimal: just the midwife fact).
- Jory's coreBio fully rewritten for the jokester retcon. New `jory_old_songs` fragment added, sawhorse fragment rewritten from stoic to public-laughter-private-grief.
- Tomas's coreBio trimmed to two facts. New `tomas_quarry` body about the way he walks Ashwick vs the frontier. New `tomas_quarry_shack` fragment added (Nell + cat).
- Lyra named in `jory_old_songs`. Wife was "open thread" in the doc; now locked.
- Em dashes swept from all player-facing text (founding characters + all mission tiers).
